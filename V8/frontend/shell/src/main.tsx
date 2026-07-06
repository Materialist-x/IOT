import { Bell, Cpu, Edit3, LogIn, MonitorCog, Play, RadioTower, ShieldCheck, UserPlus, Users } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { RuntimeTagUpdate, ScadaLayout } from "./scada-engine/core/types";
import { ScadaRuntime } from "./scada-engine/runtime/ScadaRuntime";
import "./styles.css";

type Device = { id: string; name: string; protocol: string; status: string; location?: string };
type Account = { id: string; username: string; role: "管理员" | "操作员" | "访客"; status: "启用" | "停用" };
type Alarm = { tenantId: string; deviceId: string; severity: string; message: string; timestamp: string };
type PageKey = "scada" | "devices" | "accounts";
type LoginRole = "管理员" | "子账号";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginRole, setLoginRole] = useState<LoginRole>("管理员");
  const [username, setUsername] = useState("admin");
  const [tenantId, setTenantId] = useState("T1");
  const [page, setPage] = useState<PageKey>("scada");
  const [devices, setDevices] = useState<Device[]>(fallbackDevices);
  const [accounts, setAccounts] = useState<Account[]>(fallbackAccounts);
  const [tags, setTags] = useState<RuntimeTagUpdate[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [status, setStatus] = useState("离线");
  const [mode, setMode] = useState<"runtime" | "editor">("runtime");
  const signalrUrl = import.meta.env.VITE_SIGNALR_URL ?? "http://localhost:8090";

  const layout = useMemo<ScadaLayout>(() => createDefaultLayout(), []);

  useEffect(() => {
    if (!loggedIn) return;
    fetch((import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:8080") + "/api/public/devices?tenantId=" + tenantId)
      .then((response) => response.json())
      .then((body) => {
        const remoteDevices = (body.devices ?? []).map((device: any) => ({
          id: device.id,
          name: device.name,
          protocol: device.protocol,
          status: device.status === "active" ? "在线" : "停用",
          location: "默认产线"
        }));
        if (remoteDevices.length) setDevices(remoteDevices);
      })
      .catch(() => undefined);
  }, [loggedIn, tenantId]);

  const handleTag = useCallback((tag: RuntimeTagUpdate) => {
    setTags((current) => [tag, ...current].slice(0, 50));
  }, []);

  const handleAlarm = useCallback((alarm: unknown) => {
    setAlarms((current) => [alarm as Alarm, ...current].slice(0, 10));
  }, []);

  if (!loggedIn) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <RadioTower size={34} />
          <h1>V8 工业物联网平台</h1>
          <div className="segmented">
            <button className={loginRole === "管理员" ? "active" : ""} onClick={() => setLoginRole("管理员")}>
              <ShieldCheck size={16} />
              管理员
            </button>
            <button className={loginRole === "子账号" ? "active" : ""} onClick={() => setLoginRole("子账号")}>
              <Users size={16} />
              子账号
            </button>
          </div>
          <label>
            租户编号
            <input value={tenantId} onChange={(event) => setTenantId(event.target.value)} />
          </label>
          <label>
            登录账号
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            登录密码
            <input type="password" defaultValue="123456" />
          </label>
          <button onClick={() => setLoggedIn(true)}>
            <LogIn size={18} />
            登录控制台
          </button>
          <p className="login-hint">当前为本地模拟登录，用于验证管理员、子账号、设备管理和 SCADA 运行界面。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header>
        <div>
          <p>{tenantId} / {loginRole} / {username}</p>
          <h1>V8 工业物联网云平台</h1>
        </div>
        <nav className="top-nav">
          <button className={page === "scada" ? "active" : ""} onClick={() => setPage("scada")}><MonitorCog size={16} /> 监控画面</button>
          <button className={page === "devices" ? "active" : ""} onClick={() => setPage("devices")}><Cpu size={16} /> 设备管理</button>
          <button className={page === "accounts" ? "active" : ""} onClick={() => setPage("accounts")}><Users size={16} /> 子账号管理</button>
        </nav>
      </header>

      {page === "scada" && (
        <ScadaPage
          tenantId={tenantId}
          layout={layout}
          signalrUrl={signalrUrl}
          mode={mode}
          setMode={setMode}
          status={status}
          setStatus={setStatus}
          devices={devices}
          tags={tags}
          alarms={alarms}
          onTag={handleTag}
          onAlarm={handleAlarm}
        />
      )}
      {page === "devices" && <DevicePage devices={devices} setDevices={setDevices} />}
      {page === "accounts" && <AccountPage accounts={accounts} setAccounts={setAccounts} />}
    </main>
  );
}

function ScadaPage({
  tenantId,
  layout,
  signalrUrl,
  mode,
  setMode,
  status,
  setStatus,
  devices,
  tags,
  alarms,
  onTag,
  onAlarm
}: {
  tenantId: string;
  layout: ScadaLayout;
  signalrUrl: string;
  mode: "runtime" | "editor";
  setMode: (mode: "runtime" | "editor") => void;
  status: string;
  setStatus: (status: string) => void;
  devices: Device[];
  tags: RuntimeTagUpdate[];
  alarms: Alarm[];
  onTag: (tag: RuntimeTagUpdate) => void;
  onAlarm: (alarm: unknown) => void;
}) {
  return (
    <section className="runtime-layout">
      <aside className="side-stack">
        <article className="panel">
          <h2><Cpu size={18} /> 设备列表</h2>
          <div className="device-list">
            {devices.map((device) => (
              <div key={device.id}>
                <strong>{device.name}</strong>
                <span>编号：{device.id}</span>
                <span>协议：{protocolLabel(device.protocol)}</span>
                <code>{device.status}</code>
              </div>
            ))}
          </div>
        </article>
        <article className="panel alarms">
          <h2><Bell size={18} /> 实时报警</h2>
          {alarms.map((alarm, index) => (
            <div className="alarm" key={`${alarm.deviceId}-${index}`}>
              <strong>{alarm.severity}</strong>
              <span>{alarm.message}</span>
            </div>
          ))}
          {!alarms.length && <p>暂无报警</p>}
        </article>
      </aside>

      <section className="panel scada-panel">
        <div className="panel-title">
          <h2><RadioTower size={18} /> {layout.name}</h2>
          <div className="header-actions">
            <button className={mode === "runtime" ? "mode active" : "mode"} onClick={() => setMode("runtime")}><Play size={16} /> 运行</button>
            <button className={mode === "editor" ? "mode active" : "mode"} onClick={() => setMode("editor")}><Edit3 size={16} /> 编辑</button>
            <span className={status === "connected" || status === "已连接" ? "status ok" : "status"}>{connectionLabel(status)}</span>
          </div>
        </div>
        <ScadaRuntime
          tenantId={tenantId}
          layout={layout}
          signalrUrl={signalrUrl}
          mode={mode}
          onConnectionState={(next) => setStatus(connectionLabel(next))}
          onTag={onTag}
          onAlarm={onAlarm}
        />
      </section>

      <article className="panel tag-panel">
        <h2>实时标签数据</h2>
        <table>
          <thead>
            <tr>
              <th>设备</th>
              <th>标签</th>
              <th>数值</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {(tags.length ? tags : fallbackTags).map((tag, index) => (
              <tr key={`${tag.deviceId}-${tag.tagName ?? tag.tag}-${index}`}>
                <td>{tag.deviceId}</td>
                <td>{tag.tagName ?? tag.tag}</td>
                <td>{String(tag.value)}</td>
                <td>{new Date(tag.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}

function DevicePage({ devices, setDevices }: { devices: Device[]; setDevices: (devices: Device[]) => void }) {
  const [form, setForm] = useState({ id: "", name: "", protocol: "json", location: "" });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.id || !form.name) return;
    setDevices([{ ...form, status: "在线" }, ...devices]);
    setForm({ id: "", name: "", protocol: "json", location: "" });
  }

  return (
    <section className="admin-layout">
      <article className="panel form-panel">
        <h2><Cpu size={18} /> 创建设备</h2>
        <form onSubmit={submit}>
          <label>设备编号<input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="例如 DEV002" /></label>
          <label>设备名称<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如 空压机一号" /></label>
          <label>通信协议
            <select value={form.protocol} onChange={(event) => setForm({ ...form, protocol: event.target.value })}>
              <option value="json">JSON</option>
              <option value="modbus">Modbus TCP</option>
              <option value="dlt645">DL/T645</option>
            </select>
          </label>
          <label>安装位置<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="例如 一车间 / 产线 A" /></label>
          <button type="submit"><Cpu size={16} /> 添加设备</button>
        </form>
      </article>
      <article className="panel table-panel">
        <h2>设备台账</h2>
        <table>
          <thead>
            <tr><th>设备编号</th><th>设备名称</th><th>协议</th><th>位置</th><th>状态</th></tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>{device.id}</td>
                <td>{device.name}</td>
                <td>{protocolLabel(device.protocol)}</td>
                <td>{device.location || "未设置"}</td>
                <td>{device.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}

function AccountPage({ accounts, setAccounts }: { accounts: Account[]; setAccounts: (accounts: Account[]) => void }) {
  const [form, setForm] = useState({ username: "", role: "操作员" as Account["role"] });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.username) return;
    setAccounts([{ id: `U${Date.now()}`, username: form.username, role: form.role, status: "启用" }, ...accounts]);
    setForm({ username: "", role: "操作员" });
  }

  return (
    <section className="admin-layout">
      <article className="panel form-panel">
        <h2><UserPlus size={18} /> 创建子账号</h2>
        <form onSubmit={submit}>
          <label>登录账号<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="例如 operator01" /></label>
          <label>账号角色
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Account["role"] })}>
              <option value="操作员">操作员</option>
              <option value="访客">访客</option>
              <option value="管理员">管理员</option>
            </select>
          </label>
          <button type="submit"><UserPlus size={16} /> 添加子账号</button>
        </form>
      </article>
      <article className="panel table-panel">
        <h2>子账号列表</h2>
        <table>
          <thead>
            <tr><th>账号</th><th>角色</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>{account.username}</td>
                <td>{account.role}</td>
                <td>{account.status}</td>
                <td><button className="text-button" onClick={() => setAccounts(accounts.map((item) => item.id === account.id ? { ...item, status: item.status === "启用" ? "停用" : "启用" } : item))}>{account.status === "启用" ? "停用" : "启用"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}

function createDefaultLayout(): ScadaLayout {
  return {
    id: "press-line-runtime",
    name: "一号产线实时监控画面",
    canvas: { width: 980, height: 560 },
    widgets: [
      {
        id: "pressure-gauge",
        type: "Gauge",
        position: { x: 24, y: 24, width: 280, height: 230 },
        binding: { deviceId: "DEV001", tagName: "pressure" },
        config: { title: "液压压力", min: 0, max: 120, unit: "bar", alarm: { warning: 70, danger: 90 } }
      },
      {
        id: "temperature-gauge",
        type: "Gauge",
        position: { x: 330, y: 24, width: 280, height: 230 },
        binding: { deviceId: "DEV001", tagName: "temp" },
        config: { title: "电机温度", min: 0, max: 120, unit: "℃", alarm: { warning: 70, danger: 80 } }
      },
      {
        id: "temperature-trend",
        type: "LineChart",
        position: { x: 24, y: 288, width: 586, height: 230 },
        binding: { deviceId: "DEV001", tagName: "temp" },
        config: { title: "温度趋势", timeWindow: 60, unit: "℃" }
      }
    ]
  };
}

function protocolLabel(protocol: string): string {
  if (protocol === "modbus") return "Modbus TCP";
  if (protocol === "dlt645") return "DL/T645";
  return "JSON";
}

function connectionLabel(status: string): string {
  if (status === "connected") return "已连接";
  if (status === "reconnecting") return "重连中";
  if (status === "failed") return "连接失败";
  if (status === "offline") return "离线";
  return status;
}

const fallbackDevices: Device[] = [
  { id: "DEV001", name: "MVP JSON 采集设备", protocol: "json", status: "在线", location: "一车间 / 产线 A" }
];

const fallbackAccounts: Account[] = [
  { id: "A001", username: "admin", role: "管理员", status: "启用" },
  { id: "A002", username: "operator01", role: "操作员", status: "启用" }
];

const fallbackTags: RuntimeTagUpdate[] = [
  { tenantId: "T1", deviceId: "DEV001", tagName: "temp", value: "--", timestamp: new Date().toISOString() }
];

createRoot(document.getElementById("root")!).render(<App />);
