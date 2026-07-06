import { LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { filterMenu } from "../core/permission/menuFilter";
import { guardRoute } from "../core/permission/routeGuard";
import { eventBus } from "../core/bus/EventBus";
import { connectRealtime, disconnectRealtime } from "../services/ws";
import { routes, RouteKey } from "../router/routes";
import { useAuthStore } from "../store/authStore";
import { useDeviceStore } from "../store/deviceStore";
import { useHistoryStore } from "../store/historyStore";
import { useTagStore } from "../store/tagStore";
import { Role } from "../types/domain";
import { AlarmCenterView } from "../views/alarm-center/AlarmCenterView";
import { ArchitectureView } from "../views/architecture/ArchitectureView";
import { DashboardView } from "../views/dashboard/DashboardView";
import { DeviceDetailView } from "../views/device-detail/DeviceDetailView";
import { DeviceListView } from "../views/device-list/DeviceListView";
import { HistoryView } from "../views/history/HistoryView";
import { LoginView } from "../views/login/LoginView";
import { ScadaEditorView } from "../views/scada-editor/ScadaEditorView";
import { ScadaRuntimeView } from "../views/scada-runtime/ScadaRuntimeView";
import { SystemView } from "../views/system/SystemView";
import { TagMonitorView } from "../views/tag-monitor/TagMonitorView";

export function App() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const loadDevices = useDeviceStore((state) => state.loadDevices);
  const loadLatestTags = useTagStore((state) => state.loadLatestTags);
  const loadHistory = useHistoryStore((state) => state.loadHistory);
  const [active, setActive] = useState<RouteKey>("dashboard");
  const [realtimeStatus, setRealtimeStatus] = useState("离线");

  useEffect(() => {
    const off = eventBus.on<string>("realtime:status", (status) => setRealtimeStatus(statusLabel(status)));
    return off;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    void loadDevices(currentUser.tenantId);
    void loadLatestTags();
    void loadHistory("DEV001", "Temp");
    connectRealtime(currentUser.tenantId);
    return () => disconnectRealtime();
  }, [currentUser, loadDevices, loadLatestTags, loadHistory]);

  const visibleRoutes = useMemo(() => filterMenu(routes), [currentUser?.permissions.join("|")]);

  useEffect(() => {
    if (!currentUser) return;
    const decision = guardRoute(active, currentUser);
    if (!decision.allowed) {
      setActive(visibleRoutes[0]?.key ?? "dashboard");
    }
  }, [active, currentUser, visibleRoutes]);

  if (!currentUser) {
    return <LoginView onLogin={(username: string, role: Role, tenantId: string) => login(username, role, tenantId)} />;
  }

  const decision = guardRoute(active, currentUser);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">V8 SCADA</div>
        <nav>
          {visibleRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <button key={route.key} className={active === route.key ? "active" : ""} onClick={() => setActive(route.key)}>
                <Icon size={17} />
                {route.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <strong>{currentUser.username}</strong>
            <span>{currentUser.tenantId} / {roleLabel(currentUser.role)}</span>
          </div>
          <div className="topbar-actions">
            <span className="status-pill">{realtimeStatus}</span>
            <button className="icon-button" title="退出登录" onClick={logout}>
              <LogOut size={16} />
            </button>
          </div>
        </header>
        {decision.allowed ? renderView(active) : <ForbiddenView />}
      </main>
    </div>
  );
}

function renderView(route: RouteKey) {
  if (route === "architecture") return <ArchitectureView />;
  if (route === "device-list") return <DeviceListView />;
  if (route === "device-detail") return <DeviceDetailView />;
  if (route === "tag-monitor") return <TagMonitorView />;
  if (route === "alarm-center") return <AlarmCenterView />;
  if (route === "history") return <HistoryView />;
  if (route === "scada-editor") return <ScadaEditorView />;
  if (route === "scada-runtime") return <ScadaRuntimeView />;
  if (route === "system") return <SystemView />;
  return <DashboardView />;
}

function ForbiddenView() {
  return (
    <article className="panel empty-state">
      <h1>403</h1>
      <p>当前账号没有访问该页面的权限。</p>
    </article>
  );
}

function roleLabel(role: Role): string {
  if (role === "admin") return "管理员";
  if (role === "operator") return "操作员";
  return "访客";
}

function statusLabel(status: string): string {
  if (status === "connected") return "实时已连接";
  if (status === "connecting") return "连接中";
  if (status === "reconnecting") return "重连中";
  if (status === "failed") return "连接失败";
  return "离线";
}
