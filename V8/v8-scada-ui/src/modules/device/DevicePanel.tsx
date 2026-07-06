import { Activity, Cpu, KeyRound, MapPin, Network } from "lucide-react";
import { Device } from "../../types/domain";

export function DevicePanel({ device }: { device?: Device }) {
  if (!device) {
    return (
      <article className="panel empty-state">
        <h2>请选择设备资产</h2>
        <p>设备详情、通讯参数和 Tag 配置会按资产层级展示。</p>
      </article>
    );
  }

  return (
    <article className="panel device-panel">
      <header>
        <div>
          <h2>{device.name}</h2>
          <span>{device.id}</span>
        </div>
        <span className={`status-dot ${device.status}`}>{statusLabel(device.status)}</span>
      </header>
      <section className="device-detail-grid">
        <Detail icon={<KeyRound size={16} />} label="激活码" value={device.activationCode || "--"} />
        <Detail icon={<Network size={16} />} label="协议" value={protocolLabel(device.protocol)} />
        <Detail icon={<Cpu size={16} />} label="地址" value={`${device.host || "--"}:${device.port ?? "--"}`} />
        <Detail icon={<MapPin size={16} />} label="资产位置" value={device.location || "未设置"} />
        <Detail icon={<Activity size={16} />} label="最后在线" value={device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "--"} />
      </section>
    </article>
  );
}

function Detail({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) {
  return (
    <div className="device-detail-item">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function statusLabel(status: Device["status"]): string {
  if (status === "online") return "在线";
  if (status === "disabled") return "停用";
  return "离线";
}

function protocolLabel(protocol: Device["protocol"]): string {
  if (protocol === "modbus") return "Modbus TCP";
  if (protocol === "dlt645") return "DL/T645";
  return "JSON";
}
