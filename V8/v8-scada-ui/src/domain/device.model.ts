export type DeviceProtocol = "json" | "modbus" | "dlt645";
export type DeviceStatus = "online" | "offline" | "disabled";

export type IndustrialDevice = {
  id: string;
  name: string;
  protocol: DeviceProtocol;
  assetId: string;
  activationCode?: string;
  host?: string;
  port?: number;
  enable?: boolean;
  status: DeviceStatus;
  location?: string;
  lastSeen?: string;
};
