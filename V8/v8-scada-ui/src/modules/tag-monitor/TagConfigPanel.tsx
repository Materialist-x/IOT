import { FormEvent, useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { hasPermission } from "../../core/permission/permission";
import { useDeviceStore } from "../../store/deviceStore";
import { useTagStore } from "../../store/tagStore";
import { TagConfig } from "../../types/domain";

export function TagConfigPanel({ assetId, deviceId }: { assetId?: string; deviceId?: string }) {
  const devices = useDeviceStore((state) => state.devices);
  const tagConfigs = useTagStore((state) => state.tagConfigs);
  const upsertTagConfig = useTagStore((state) => state.upsertTagConfig);
  const removeTagConfig = useTagStore((state) => state.removeTagConfig);
  const canEdit = hasPermission("tag:edit");
  const deviceIds = useMemo(() => {
    const ids = new Set([
      ...devices.map((device) => device.id),
      ...tagConfigs.map((config) => config.deviceId)
    ]);
    return Array.from(ids);
  }, [devices, tagConfigs]);
  const visibleConfigs = deviceId ? tagConfigs.filter((config) => config.deviceId === deviceId) : tagConfigs;
  const [form, setForm] = useState<TagConfig>(() => createEmptyConfig(deviceId ?? deviceIds[0] ?? "DEV001", assetId));

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (!canEdit || !form.deviceId || !form.tagName || !form.address || !form.assetId) return;
    upsertTagConfig({ ...form, deviceId: deviceId ?? form.deviceId, assetId: assetId ?? form.assetId });
    setForm(createEmptyConfig(deviceId ?? form.deviceId, assetId));
  }

  function editConfig(config: TagConfig): void {
    setForm({ ...config });
  }

  return (
    <section className="tag-config-layout">
      <form className="panel stack-form tag-config-form" onSubmit={submit}>
        <h2>Tag 采集配置</h2>
        {!assetId ? <p className="muted">请先选择设备资产，Tag 必须绑定资产节点。</p> : null}
        <label>设备
          <select disabled={!canEdit || Boolean(deviceId)} value={deviceId ?? form.deviceId} onChange={(event) => setForm({ ...form, deviceId: event.target.value })}>
            {deviceIds.map((deviceId) => <option value={deviceId} key={deviceId}>{deviceId}</option>)}
            {!deviceIds.length ? <option value="DEV001">DEV001</option> : null}
          </select>
        </label>
        <label>Tag 名称<input disabled={!canEdit} value={form.tagName} onChange={(event) => setForm({ ...form, tagName: event.target.value })} placeholder="例如 Temp" /></label>
        <label>采集地址<input disabled={!canEdit} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="例如 40001 / temp" /></label>
        <div className="form-row">
          <label>寄存器类型
            <select disabled={!canEdit} value={form.registerType} onChange={(event) => setForm({ ...form, registerType: event.target.value as TagConfig["registerType"] })}>
              <option value="holding">Holding</option>
              <option value="input">Input</option>
              <option value="coil">Coil</option>
              <option value="discrete">Discrete</option>
              <option value="json">JSON</option>
            </select>
          </label>
          <label>数据类型
            <select disabled={!canEdit} value={form.dataType} onChange={(event) => setForm({ ...form, dataType: event.target.value as TagConfig["dataType"] })}>
              <option value="float32">Float32</option>
              <option value="int16">Int16</option>
              <option value="uint16">UInt16</option>
              <option value="bool">Bool</option>
              <option value="string">String</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>采集周期(ms)<input disabled={!canEdit} type="number" min={100} value={form.interval} onChange={(event) => setForm({ ...form, interval: Number(event.target.value) })} /></label>
          <label>超时(ms)<input disabled={!canEdit} type="number" min={100} value={form.timeout} onChange={(event) => setForm({ ...form, timeout: Number(event.target.value) })} /></label>
        </div>
        <div className="form-row">
          <label>重试次数<input disabled={!canEdit} type="number" min={0} value={form.retry} onChange={(event) => setForm({ ...form, retry: Number(event.target.value) })} /></label>
          <label>解析倍数<input disabled={!canEdit} type="number" step="0.0001" value={form.multiplier} onChange={(event) => setForm({ ...form, multiplier: Number(event.target.value) })} /></label>
        </div>
        <label>解析偏移<input disabled={!canEdit} type="number" step="0.0001" value={form.offset} onChange={(event) => setForm({ ...form, offset: Number(event.target.value) })} /></label>
        <label className="check-row"><input disabled={!canEdit} type="checkbox" checked={form.enable} onChange={(event) => setForm({ ...form, enable: event.target.checked })} />启用采集</label>
        <button type="submit" disabled={!canEdit || !assetId}>{existingConfig(tagConfigs, form) ? <Check size={16} /> : <Plus size={16} />}{existingConfig(tagConfigs, form) ? "保存配置" : "添加配置"}</button>
        {!canEdit ? <p className="muted">当前账号没有修改 Tag 配置权限。</p> : null}
      </form>

      <article className="panel tag-config-table">
        <h2>配置列表</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>设备</th><th>Tag</th><th>地址</th><th>类型</th><th>周期</th><th>解析倍数</th><th>偏移</th><th>状态</th><th>操作</th></tr>
            </thead>
            <tbody>
              {visibleConfigs.map((config) => (
                <tr key={`${config.deviceId}-${config.tagName}`}>
                  <td>{config.deviceId}</td>
                  <td>{config.tagName}</td>
                  <td><code>{config.address}</code></td>
                  <td>{registerTypeLabel(config.registerType)} / {config.dataType}</td>
                  <td>{config.interval}ms</td>
                  <td>{config.multiplier}</td>
                  <td>{config.offset}</td>
                  <td><span className={`status-dot ${config.enable ? "online" : "disabled"}`}>{config.enable ? "启用" : "停用"}</span></td>
                  <td className="table-actions">
                    <button className="small-button" disabled={!canEdit} type="button" onClick={() => editConfig(config)}><Pencil size={14} />编辑</button>
                    <button className="small-button secondary-button" disabled={!canEdit} type="button" onClick={() => removeTagConfig(config.deviceId, config.tagName)}><Trash2 size={14} />删除</button>
                  </td>
                </tr>
              ))}
              {visibleConfigs.length === 0 ? <tr><td colSpan={9} className="muted">暂无 Tag 配置</td></tr> : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function createEmptyConfig(deviceId: string, assetId?: string): TagConfig {
  return {
    deviceId,
    assetId,
    tagName: "",
    address: "",
    registerType: "holding",
    dataType: "float32",
    interval: 1000,
    retry: 3,
    timeout: 500,
    multiplier: 1,
    offset: 0,
    enable: true
  };
}

function existingConfig(configs: TagConfig[], form: TagConfig): boolean {
  return configs.some((config) => config.deviceId === form.deviceId && config.tagName === form.tagName);
}

function registerTypeLabel(type: TagConfig["registerType"]): string {
  if (type === "holding") return "保持寄存器";
  if (type === "input") return "输入寄存器";
  if (type === "coil") return "线圈";
  if (type === "discrete") return "离散量";
  return "JSON";
}
