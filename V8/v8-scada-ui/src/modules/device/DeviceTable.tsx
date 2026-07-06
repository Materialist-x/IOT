import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { hasPermission } from "../../core/permission/permission";
import { useDeviceStore } from "../../store/deviceStore";
import { Device } from "../../types/domain";

export function DeviceTable() {
  const devices = useDeviceStore((state) => state.devices);
  const updateDevice = useDeviceStore((state) => state.updateDevice);
  const canEdit = hasPermission("device:edit");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Device | null>(null);

  function startEdit(device: Device): void {
    setEditingId(device.id);
    setDraft({ ...device });
  }

  function saveEdit(): void {
    if (!draft) return;
    updateDevice(draft.id, { ...draft, status: draft.enable === false ? "disabled" : draft.status === "disabled" ? "online" : draft.status });
    setEditingId(null);
    setDraft(null);
  }

  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th>设备编号</th><th>设备名称</th><th>激活码</th><th>协议</th><th>主机</th><th>端口</th><th>位置</th><th>状态</th><th>最后在线</th><th>操作</th></tr></thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id}>
              {editingId === device.id && draft ? (
                <>
                  <td>{device.id}</td>
                  <td><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></td>
                  <td><input value={draft.activationCode ?? ""} onChange={(event) => setDraft({ ...draft, activationCode: event.target.value })} /></td>
                  <td>
                    <select value={draft.protocol} onChange={(event) => setDraft({ ...draft, protocol: event.target.value as Device["protocol"] })}>
                      <option value="json">JSON</option>
                      <option value="modbus">Modbus TCP</option>
                      <option value="dlt645">DL/T645</option>
                    </select>
                  </td>
                  <td><input value={draft.host ?? ""} onChange={(event) => setDraft({ ...draft, host: event.target.value })} /></td>
                  <td><input type="number" min={0} value={draft.port ?? ""} onChange={(event) => setDraft({ ...draft, port: Number(event.target.value) || undefined })} /></td>
                  <td><input value={draft.location ?? ""} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></td>
                  <td><label className="table-check"><input type="checkbox" checked={draft.enable !== false} onChange={(event) => setDraft({ ...draft, enable: event.target.checked })} />启用</label></td>
                  <td>{formatTime(device.lastSeen)}</td>
                  <td className="table-actions">
                    <button className="small-button" type="button" onClick={saveEdit}><Check size={14} />保存</button>
                    <button className="small-button secondary-button" type="button" onClick={() => { setEditingId(null); setDraft(null); }}><X size={14} />取消</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{device.id}</td>
                  <td>{device.name}</td>
                  <td><code>{device.activationCode || "--"}</code></td>
                  <td>{protocolLabel(device.protocol)}</td>
                  <td>{device.host || "--"}</td>
                  <td>{device.port ?? "--"}</td>
                  <td>{device.location ?? "--"}</td>
                  <td><span className={`status-dot ${device.status}`}>{statusLabel(device.status)}</span></td>
                  <td>{formatTime(device.lastSeen)}</td>
                  <td>{canEdit ? <button className="small-button" type="button" onClick={() => startEdit(device)}><Pencil size={14} />编辑</button> : <span className="muted">只读</span>}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function protocolLabel(protocol: string): string {
  if (protocol === "modbus") return "Modbus TCP";
  if (protocol === "dlt645") return "DL/T645";
  return "JSON";
}

function statusLabel(status: string): string {
  if (status === "online") return "在线";
  if (status === "disabled") return "停用";
  return "离线";
}

function formatTime(value?: string): string {
  return value ? new Date(value).toLocaleString() : "--";
}
