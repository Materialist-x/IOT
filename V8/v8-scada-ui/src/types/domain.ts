export type Role = "admin" | "operator" | "viewer";

export type User = {
  userId: string;
  username: string;
  roles: Role[];
  permissions: string[];
  role: Role;
  tenantId: string;
};

export type Device = {
  id: string;
  name: string;
  protocol: "json" | "modbus" | "dlt645";
  activationCode?: string;
  host?: string;
  port?: number;
  enable?: boolean;
  status: "online" | "offline" | "disabled";
  location?: string;
  lastSeen?: string;
};

export type TagValue = {
  deviceId: string;
  tagName: string;
  rawValue?: number | string;
  value: number | string;
  timestamp: string;
  quality?: string | number;
  multiplier?: number;
  offset?: number;
};

export type TagConfig = {
  deviceId: string;
  tagName: string;
  address: string;
  registerType: "holding" | "input" | "coil" | "discrete" | "json";
  dataType: "float32" | "int16" | "uint16" | "bool" | "string";
  interval: number;
  retry: number;
  timeout: number;
  multiplier: number;
  offset: number;
  enable: boolean;
};

export type Alarm = {
  id: string;
  deviceId: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
  acknowledged?: boolean;
};

export type HistoryPoint = {
  deviceId: string;
  tagName: string;
  timestamp: string;
  value: number;
};

export type SceneComponent = {
  id: string;
  type: string;
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, unknown>;
};

export type SceneJson = {
  sceneId: string;
  name: string;
  version: number;
  canvas: {
    width: number;
    height: number;
  };
  components: SceneComponent[];
};
