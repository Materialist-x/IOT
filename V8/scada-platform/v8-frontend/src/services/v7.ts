import type { AlarmRecord, AlarmRule, Device, FaultRecord, HistoryPoint, LicenseState, TagPoint } from "../domain/models";

const API_BASE = import.meta.env.VITE_V7_API_BASE ?? "";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`V7 API failed: ${response.status}`);
  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`V7 API failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const v7Api = {
  devices: () => getJson<Device[]>("/api/device"),
  createDevice: (payload: Partial<Device>) => postJson<Device>("/api/device", payload),
  tags: () => getJson<TagPoint[]>("/api/tag"),
  tagsByDevice: (deviceId: string) => getJson<TagPoint[]>(`/api/tag/${deviceId}`),
  faults: () => getJson<FaultRecord[]>("/api/faults"),
  history: (tagId: string, from: string, to: string) => getJson<HistoryPoint[]>(`/api/history?tagId=${encodeURIComponent(tagId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  license: () => getJson<LicenseState>("/api/license"),
  activateLicense: (key: string) => postJson<LicenseState>("/api/license/activate", { key }),
  alarmRules: () => getJson<AlarmRule[]>("/api/alarm/rules"),
  createAlarmRule: (payload: { tagId: string; condition: string; threshold: number }) => postJson<AlarmRule>("/api/alarm/rules", payload),
  alarmRecords: () => getJson<AlarmRecord[]>("/api/alarm/records"),
  triggerAlarm: (payload: { tagId: string; condition: string; threshold: number; value?: number }) => postJson<AlarmRecord>("/api/alarm/trigger", payload)
};

export function getWsUrl(): string {
  const configured = import.meta.env.VITE_V7_WS_URL as string | undefined;
  if (configured) return configured;
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws`;
}
