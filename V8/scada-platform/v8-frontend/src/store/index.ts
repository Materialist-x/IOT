import { reactive } from "vue";
import type { AlarmRecord, AlarmRule, Device, FaultRecord, LicenseState, TagPoint } from "../domain/models";
import { getWsUrl, v7Api } from "../services/v7";
import { configStore } from "./configStore";
import { historianStore } from "./historianStore";
import { runtimeStore } from "./runtimeStore";

export const store = reactive({
  devices: [] as Device[],
  tags: [] as TagPoint[],
  alarms: [] as AlarmRecord[],
  faults: [] as FaultRecord[],
  alarmRules: [] as AlarmRule[],
  license: {
    status: "ACTIVE",
    type: "TRIAL",
    maxDevices: 1,
    activeDevices: 0,
    expiresAt: null,
    licenseKey: "V8-TRIAL-0001",
    machineId: "HASH_VM_001",
    features: {
      scadaDashboard: true,
      deviceManagement: true,
      alarmSystem: true,
      multiDevice: false,
      historian: false
    }
  } as LicenseState,
  connected: false
});

let socket: WebSocket | null = null;
const tagActivity: number[] = [];
const ioActivity: number[] = [];

export async function bootstrapStore(): Promise<void> {
  await Promise.all([loadDevices(), loadTags(), loadLicense(), loadAlarms(), loadFaults()]);
  connectWs();
}

export async function loadDevices(): Promise<void> {
  store.devices = await v7Api.devices();
  configStore.devices = store.devices;
  syncDeviceMetrics();
}

export async function loadTags(): Promise<void> {
  store.tags = await v7Api.tags();
  syncTagStores();
}

export async function createDevice(payload: Partial<Device>): Promise<void> {
  await v7Api.createDevice(payload);
  await loadDevices();
  await loadTags();
}

export async function loadLicense(): Promise<void> {
  store.license = await v7Api.license();
  configStore.license = store.license;
}

export async function activateLicense(key: string): Promise<void> {
  store.license = await v7Api.activateLicense(key);
  configStore.license = store.license;
}

export async function loadAlarms(): Promise<void> {
  const [rules, records] = await Promise.all([v7Api.alarmRules(), v7Api.alarmRecords()]);
  store.alarmRules = rules;
  store.alarms = records;
  configStore.rules = rules;
  runtimeStore.alarms = records;
}

export async function loadFaults(): Promise<void> {
  store.faults = await v7Api.faults();
  runtimeStore.faults = store.faults;
  runtimeStore.metrics.faultCount = store.faults.length;
}

export async function createAlarmRule(payload: { tagId: string; condition: string; threshold: number }): Promise<void> {
  const rule = await v7Api.createAlarmRule(payload);
  store.alarmRules = [rule, ...store.alarmRules];
  configStore.rules = store.alarmRules;
}

export async function triggerAlarm(payload: { tagId: string; condition: string; threshold: number; value?: number }): Promise<void> {
  const alarm = await v7Api.triggerAlarm(payload);
  store.alarms = [alarm, ...store.alarms];
  runtimeStore.alarms = store.alarms;
}

export async function loadHistory(tagId: string, from: string, to: string): Promise<void> {
  historianStore.selectedTagId = tagId;
  historianStore.from = from;
  historianStore.to = to;
  historianStore.points = await v7Api.history(tagId, from, to);
}

export function connectWs(): void {
  if (socket && socket.readyState <= WebSocket.OPEN) return;
  socket = new WebSocket(getWsUrl());
  socket.onopen = () => { store.connected = true; runtimeStore.connected = true; };
  socket.onclose = () => {
    store.connected = false;
    runtimeStore.connected = false;
    window.setTimeout(connectWs, 1500);
  };
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "tag.update" || message.type === "runtime.tag.update") handleTagUpdate(message.payload);
    if (message.type === "alarm.event" || message.type === "runtime.alarm.event") {
      store.alarms = [message.payload, ...store.alarms].slice(0, 120);
      runtimeStore.alarms = store.alarms;
    }
    if (message.type === "fault.event") handleFaultEvent(message.payload);
    if (message.type === "device.status") handleDeviceStatus(message.payload);
    if (message.type === "license.update" || message.type === "config.license.update") {
      store.license = message.payload;
      configStore.license = store.license;
    }
    if (message.type === "runtime.tcp.status") {
      handleTcpStatus(message.payload);
    }
  };
}

function handleTagUpdate(payload: any): void {
  const tag: TagPoint = {
    id: String(payload.id ?? `${payload.deviceId}:${payload.name ?? payload.tag}`),
    deviceId: String(payload.deviceId ?? ""),
    name: String(payload.name ?? payload.tag ?? ""),
    address: String(payload.address ?? payload.registerAddress ?? ""),
    scale: Number(payload.scale ?? 1),
    value: payload.value === null || payload.value === undefined ? null : Number(payload.value),
    quality: (payload.quality ?? "GOOD") as TagPoint["quality"],
    lastUpdate: String(payload.lastUpdate ?? new Date().toISOString())
  };

  if (tag.deviceId === "SYSTEM") {
    if (tag.name === "CPU") runtimeStore.systemMetrics.cpu = Number(tag.value ?? 0);
    if (tag.name === "RAM") runtimeStore.systemMetrics.ram = Number(tag.value ?? 0);
    if (tag.name === "NET") runtimeStore.systemMetrics.net = Number(tag.value ?? 0);
    return;
  }

  upsertTag(tag);
  trackRate(tagActivity, "tag");

  if (tag.name === "Temp" && tag.value !== null) runtimeStore.trend.temp = [...runtimeStore.trend.temp, tag.value].slice(-36);
  if (tag.name === "Pressure" && tag.value !== null) runtimeStore.trend.pressure = [...runtimeStore.trend.pressure, tag.value].slice(-36);
}

function upsertDevice(device: Device): void {
  store.devices = [device, ...store.devices.filter((item) => item.id !== device.id)];
  configStore.devices = store.devices;
  syncDeviceMetrics();
}

function upsertTag(tag: TagPoint): void {
  store.tags = [tag, ...store.tags.filter((item) => item.id !== tag.id)];
  syncTagStores();
}

function syncTagStores(): void {
  configStore.tags = store.tags.filter((tag) => tag.deviceId !== "SYSTEM");
  runtimeStore.tagValues = configStore.tags;
}

function handleTcpStatus(payload: any): void {
  runtimeStore.tcp.stage = String(payload.stage ?? "idle");
  runtimeStore.tcp.deviceId = String(payload.deviceId ?? "");
  runtimeStore.tcp.detail = String(payload.detail ?? "");
  runtimeStore.tcp.lastCommand = String(payload.extra?.command ?? runtimeStore.tcp.lastCommand);
  runtimeStore.tcp.lastResponse = String(payload.extra?.response ?? runtimeStore.tcp.lastResponse);
  runtimeStore.tcp.steps = [
    {
      stage: runtimeStore.tcp.stage,
      deviceId: runtimeStore.tcp.deviceId,
      detail: runtimeStore.tcp.detail,
      time: String(payload.time ?? new Date().toISOString()),
      command: String(payload.extra?.command ?? ""),
      response: String(payload.extra?.response ?? "")
    },
    ...runtimeStore.tcp.steps
  ].slice(0, 12);

  if (runtimeStore.tcp.stage === "response-received") {
    trackRate(ioActivity, "io");
  }
}

function handleDeviceStatus(payload: any): void {
  const current = store.devices.find((item) => item.id === String(payload.id ?? ""));
  if (!current) {
    return;
  }

  upsertDevice({
    ...current,
    status: String(payload.status ?? current.status) as Device["status"],
    health: Number(payload.health ?? current.health ?? 0),
    lastError: String(payload.lastError ?? current.lastError ?? ""),
    lastSeen: String(payload.lastSeen ?? current.lastSeen ?? "")
  });
}

function handleFaultEvent(payload: any): void {
  const fault: FaultRecord = {
    id: String(payload.id ?? crypto.randomUUID()),
    time: String(payload.time ?? new Date().toISOString()),
    deviceId: String(payload.deviceId ?? ""),
    protocol: String(payload.protocol ?? ""),
    reason: String(payload.reason ?? ""),
    frameHex: String(payload.frameHex ?? "")
  };

  store.faults = [fault, ...store.faults].slice(0, 500);
  runtimeStore.faults = store.faults;
  runtimeStore.metrics.faultCount = store.faults.length;
}

function syncDeviceMetrics(): void {
  const total = store.devices.length;
  const online = store.devices.filter((device) => device.status === "ONLINE").length;
  runtimeStore.metrics.totalDevices = total;
  runtimeStore.metrics.onlineDevices = online;
  runtimeStore.metrics.onlineRatio = total === 0 ? 0 : Math.round((online / total) * 100);
}

function trackRate(buffer: number[], kind: "tag" | "io"): void {
  const now = Date.now();
  buffer.push(now);
  while (buffer.length > 0 && now - buffer[0] > 60_000) {
    buffer.shift();
  }

  if (kind === "tag") {
    runtimeStore.metrics.tagUpdateRate = buffer.length;
    return;
  }

  runtimeStore.metrics.ioThroughput = buffer.length;
}
