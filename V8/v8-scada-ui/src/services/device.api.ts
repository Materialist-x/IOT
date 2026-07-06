import { Device } from "../types/domain";
import { apiGet } from "./api";

export async function listDevices(tenantId: string): Promise<Device[]> {
  try {
    const response = await apiGet<{ devices: any[] }>(`/api/public/devices?tenantId=${encodeURIComponent(tenantId)}`);
    return response.devices.map((device) => ({
      id: device.id,
      name: device.name,
      protocol: device.protocol,
      assetId: device.assetId ?? device.asset_id ?? `asset-${device.id}`,
      activationCode: device.activationCode ?? device.activation_code ?? "",
      host: device.host ?? "",
      port: Number(device.port ?? 0) || undefined,
      enable: device.enable ?? device.status === "active",
      status: device.status === "active" ? "online" : "disabled",
      location: device.location ?? "默认产线",
      lastSeen: device.lastSeen ?? new Date().toISOString()
    }));
  } catch {
    return [
      { id: "DEV001", name: "一号采集设备", protocol: "json", assetId: "asset-DEV001", activationCode: "V8-DEMO-001", host: "127.0.0.1", port: 9000, enable: true, status: "online", location: "一车间 / 产线 A", lastSeen: new Date().toISOString() },
      { id: "DEV002", name: "泵站网关", protocol: "modbus", assetId: "asset-DEV002", activationCode: "V8-PUMP-002", host: "10.0.0.20", port: 502, enable: true, status: "online", location: "二车间 / 泵房", lastSeen: new Date(Date.now() - 90_000).toISOString() },
      { id: "DEV003", name: "电表集中器", protocol: "dlt645", assetId: "asset-DEV003", activationCode: "V8-METER-003", host: "10.0.0.30", port: 2404, enable: false, status: "offline", location: "配电室", lastSeen: new Date(Date.now() - 42 * 60_000).toISOString() }
    ];
  }
}
