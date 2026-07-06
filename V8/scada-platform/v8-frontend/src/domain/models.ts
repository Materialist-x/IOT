export type DeviceStatus = "ONLINE" | "OFFLINE";
export type DeviceProtocol = "ModbusTCP" | "DL645" | "JSON" | string;

export type TagDefinition = {
  key: string;
  name: string;
  address: string;
  scale: number;
};

export type Device = {
  id: string;
  name: string;
  deviceNo: string;
  status: DeviceStatus;
  protocol: DeviceProtocol;
  licenseCode: string;
  host: string;
  port: number;
  modbusStation: string;
  registerAddress: string;
  pollIntervalMs: number;
  health: number;
  lastError: string;
  lastSeen: string;
  jsonMappings: Record<string, string>;
  tagDefinitions: TagDefinition[];
};

export type TcpTrace = {
  stage: string;
  deviceId: string;
  detail: string;
  time: string;
  command: string;
  response: string;
};

export type TagPoint = {
  id: string;
  deviceId: string;
  name: string;
  address: string;
  scale: number;
  value: number | null;
  quality: "GOOD" | "BAD" | "UNCERTAIN";
  lastUpdate: string;
};

export type AlarmRecord = {
  id: string;
  tagId: string;
  deviceId: string;
  tagName: string;
  value: number;
  threshold: number;
  condition: string;
  level: string;
  source: string;
  time: string;
};

export type AlarmRule = {
  id: string;
  tagId: string;
  condition: string;
  threshold: number;
  enabled: boolean;
};

export type FaultRecord = {
  id: string;
  time: string;
  deviceId: string;
  protocol: string;
  reason: string;
  frameHex: string;
};

export type HistoryPoint = {
  tagId: string;
  deviceId: string;
  tagName: string;
  value: number;
  timestamp: string;
};

export type LicenseState = {
  status: "ACTIVE" | "EXPIRED" | "INVALID";
  type: "SINGLE" | "MULTI" | "TRIAL";
  maxDevices: number;
  activeDevices: number;
  expiresAt: string | null;
  licenseKey: string;
  machineId: string;
  features: {
    scadaDashboard: boolean;
    deviceManagement: boolean;
    alarmSystem: boolean;
    multiDevice: boolean;
    historian: boolean;
  };
};
