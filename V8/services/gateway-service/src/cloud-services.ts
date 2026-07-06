import { EventEmitter } from "node:events";
import { logger } from "@v8/shared";

export type ConfigKind = "device" | "polling" | "alarm";

export type VersionedConfig = {
  tenantId: string;
  deviceId: string;
  kind: ConfigKind;
  version: number;
  timestamp: number;
  config: unknown;
};

export type ConfigDiff = {
  before?: VersionedConfig;
  after?: VersionedConfig;
  changed: boolean;
};

export type DeviceShadow = {
  tenantId: string;
  deviceId: string;
  activationCode?: string;
  online: boolean;
  health: "GOOD" | "WARN" | "BAD" | "UNKNOWN";
  lastSeen: string;
  latencyMs?: number;
};

export type TagPacket = {
  tenantId?: string;
  deviceId: string;
  tagId?: string;
  tagName?: string;
  value: number | string | boolean;
  quality?: string;
  ts?: number | string;
};

export type AlarmPacket = {
  tenantId?: string;
  deviceId: string;
  tagId?: string;
  level?: string;
  message: string;
  ts?: number | string;
};

export type DevicePacket = {
  tenantId?: string;
  deviceId: string;
  status: string;
  health?: number | string;
  lastSeen?: string;
};

function configKey(tenantId: string, deviceId: string, kind: ConfigKind): string {
  return `${tenantId}:${deviceId}:${kind}`;
}

export class InternalEventBus {
  private readonly events = new EventEmitter();

  publish(topic: string, payload: unknown): void {
    this.events.emit(topic, payload);
    logger.info({ topic }, "event published");
  }

  subscribe(topic: string, handler: (payload: unknown) => void): () => void {
    this.events.on(topic, handler);
    return () => this.events.off(topic, handler);
  }
}

export class MqttService {
  constructor(private readonly eventBus: InternalEventBus) {}

  publishConfig(config: VersionedConfig): void {
    this.eventBus.publish(`v8/config/${config.kind}/${config.deviceId}`, config);
  }

  publishEdgePacket(topic: string, packet: unknown): void {
    this.eventBus.publish(topic, packet);
  }
}

export class ConfigService {
  private readonly versions = new Map<string, VersionedConfig[]>();

  upsert(tenantId: string, deviceId: string, kind: ConfigKind, config: unknown): VersionedConfig {
    const key = configKey(tenantId, deviceId, kind);
    const history = this.versions.get(key) ?? [];
    const next: VersionedConfig = {
      tenantId,
      deviceId,
      kind,
      version: (history.at(-1)?.version ?? 0) + 1,
      timestamp: Math.floor(Date.now() / 1000),
      config
    };
    this.versions.set(key, [...history, next]);
    return next;
  }

  latest(tenantId: string, deviceId: string, kind: ConfigKind): VersionedConfig | undefined {
    return this.versions.get(configKey(tenantId, deviceId, kind))?.at(-1);
  }

  history(tenantId: string, deviceId: string, kind: ConfigKind): VersionedConfig[] {
    return this.versions.get(configKey(tenantId, deviceId, kind)) ?? [];
  }

  rollback(tenantId: string, deviceId: string, kind: ConfigKind, version: number): VersionedConfig | undefined {
    const target = this.history(tenantId, deviceId, kind).find((item) => item.version === version);
    if (!target) return undefined;
    return this.upsert(tenantId, deviceId, kind, target.config);
  }

  diff(tenantId: string, deviceId: string, kind: ConfigKind, fromVersion: number, toVersion: number): ConfigDiff {
    const history = this.history(tenantId, deviceId, kind);
    const before = history.find((item) => item.version === fromVersion);
    const after = history.find((item) => item.version === toVersion);
    return {
      before,
      after,
      changed: JSON.stringify(before?.config) !== JSON.stringify(after?.config)
    };
  }
}

export class DeviceShadowService {
  private readonly shadows = new Map<string, DeviceShadow>();

  bindActivation(tenantId: string, deviceId: string, activationCode?: string): DeviceShadow {
    const shadow = this.getOrCreate(tenantId, deviceId);
    const next = { ...shadow, activationCode };
    this.shadows.set(this.key(tenantId, deviceId), next);
    return next;
  }

  updateFromPacket(tenantId: string, packet: DevicePacket): DeviceShadow {
    const health = normalizeHealth(packet.health);
    const online = packet.status.toUpperCase() !== "OFFLINE" && packet.status.toUpperCase() !== "DISABLED";
    const next: DeviceShadow = {
      ...this.getOrCreate(tenantId, packet.deviceId),
      online,
      health,
      lastSeen: packet.lastSeen ?? new Date().toISOString()
    };
    this.shadows.set(this.key(tenantId, packet.deviceId), next);
    return next;
  }

  touchTag(tenantId: string, deviceId: string): DeviceShadow {
    const next: DeviceShadow = {
      ...this.getOrCreate(tenantId, deviceId),
      online: true,
      health: "GOOD",
      lastSeen: new Date().toISOString()
    };
    this.shadows.set(this.key(tenantId, deviceId), next);
    return next;
  }

  list(tenantId: string): DeviceShadow[] {
    return Array.from(this.shadows.values()).filter((shadow) => shadow.tenantId === tenantId);
  }

  private getOrCreate(tenantId: string, deviceId: string): DeviceShadow {
    return this.shadows.get(this.key(tenantId, deviceId)) ?? {
      tenantId,
      deviceId,
      online: false,
      health: "UNKNOWN",
      lastSeen: new Date(0).toISOString()
    };
  }

  private key(tenantId: string, deviceId: string): string {
    return `${tenantId}:${deviceId}`;
  }
}

export class MetricsService {
  private readonly latency = new Map<string, number>();

  observePacket(tenantId: string, deviceId: string, ts?: string | number): void {
    if (!ts) return;
    const timestamp = typeof ts === "number" ? ts : Date.parse(ts);
    if (!Number.isFinite(timestamp)) return;
    this.latency.set(`${tenantId}:${deviceId}`, Math.max(0, Date.now() - timestamp));
  }

  snapshot(): Record<string, number> {
    return Object.fromEntries(this.latency);
  }
}

function normalizeHealth(value: DevicePacket["health"]): DeviceShadow["health"] {
  if (typeof value === "number") {
    if (value >= 0.8) return "GOOD";
    if (value >= 0.4) return "WARN";
    return "BAD";
  }
  if (typeof value === "string" && ["GOOD", "WARN", "BAD", "UNKNOWN"].includes(value.toUpperCase())) {
    return value.toUpperCase() as DeviceShadow["health"];
  }
  return "UNKNOWN";
}
