import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { hasPermission } from "../../core/permission/permission";
import { LicenseService } from "../license/license.service";
import { useDeviceStore } from "../../store/deviceStore";
import { Device } from "../../types/domain";

export function DeviceCreateForm({ parentAssetId, parentLocation }: { parentAssetId?: string; parentLocation?: string }) {
  const addDevice = useDeviceStore((state) => state.addDevice);
  const canAdd = hasPermission("device:add");
  const [form, setForm] = useState<Device>(createEmptyDevice());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError("");
    if (!canAdd || !form.id || !form.name) return;
    if (!parentAssetId) {
      setError("请先在左侧选择一个工厂、区域或设备节点。");
      return;
    }
    if (!form.activationCode?.trim()) {
      setError("创建设备必须填写激活码。");
      return;
    }

    try {
      setSubmitting(true);
      await LicenseService.activateDevice(form.activationCode.trim(), form.id.trim());
      addDevice({
        ...form,
        id: form.id.trim(),
        name: form.name.trim(),
        assetId: `asset-${form.id.trim()}`,
        status: form.enable === false ? "disabled" : "online",
        location: form.location || parentLocation || "默认产线",
        lastSeen: new Date().toISOString()
      });
      setForm(createEmptyDevice());
    } catch (error) {
      setError(error instanceof Error ? error.message : "激活码校验失败。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>设备编号<input disabled={!canAdd} value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} /></label>
      <label>设备名称<input disabled={!canAdd} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label>激活码<input disabled={!canAdd} value={form.activationCode ?? ""} onChange={(event) => setForm({ ...form, activationCode: event.target.value })} placeholder="例如 ABC123" /></label>
      <label>通信协议
        <select disabled={!canAdd} value={form.protocol} onChange={(event) => setForm({ ...form, protocol: event.target.value as Device["protocol"] })}>
          <option value="json">JSON</option>
          <option value="modbus">Modbus TCP</option>
          <option value="dlt645">DL/T645</option>
        </select>
      </label>
      <label>主机地址<input disabled={!canAdd} value={form.host ?? ""} onChange={(event) => setForm({ ...form, host: event.target.value })} placeholder="例如 10.0.0.10" /></label>
      <label>通信端口<input disabled={!canAdd} type="number" min={0} value={form.port ?? ""} onChange={(event) => setForm({ ...form, port: Number(event.target.value) || undefined })} placeholder="例如 502" /></label>
      <label>安装位置<input disabled={!canAdd} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
      <label className="check-row"><input disabled={!canAdd} type="checkbox" checked={form.enable !== false} onChange={(event) => setForm({ ...form, enable: event.target.checked, status: event.target.checked ? "online" : "disabled" })} />启用设备</label>
      <button type="submit" disabled={!canAdd || submitting || !parentAssetId}><Plus size={16} />{submitting ? "校验激活码" : "创建设备"}</button>
      {error ? <p className="form-error">{error}</p> : null}
      {!canAdd ? <p className="muted">当前账号没有创建设备权限。</p> : null}
    </form>
  );
}

function createEmptyDevice(): Device {
  return {
    id: "",
    name: "",
    protocol: "json",
    activationCode: "",
    host: "",
    port: undefined,
    enable: true,
    status: "online",
    location: "",
    lastSeen: new Date().toISOString()
  };
}
