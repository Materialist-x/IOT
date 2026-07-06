import { Activity, Bell, Cpu, Database, Gauge, History, MonitorCog, Network, Users } from "lucide-react";

export type RouteKey =
  | "dashboard"
  | "architecture"
  | "device-list"
  | "device-detail"
  | "tag-monitor"
  | "alarm-center"
  | "history"
  | "scada-editor"
  | "scada-runtime"
  | "system";

export type AppRoute = {
  key: RouteKey;
  label: string;
  permission?: string;
  icon: typeof Activity;
};

export const routes: AppRoute[] = [
  { key: "dashboard", label: "总览", permission: "dashboard:view", icon: Activity },
  { key: "architecture", label: "云边架构", permission: "architecture:view", icon: Network },
  { key: "device-list", label: "设备管理", permission: "device:view", icon: Cpu },
  { key: "device-detail", label: "设备详情", permission: "device:view", icon: Database },
  { key: "tag-monitor", label: "Tag 监控", permission: "tag:view", icon: Gauge },
  { key: "alarm-center", label: "告警中心", permission: "alarm:view", icon: Bell },
  { key: "history", label: "历史数据", permission: "history:view", icon: History },
  { key: "scada-editor", label: "组态编辑", permission: "scada:edit", icon: MonitorCog },
  { key: "scada-runtime", label: "组态运行", permission: "scada:view", icon: MonitorCog },
  { key: "system", label: "系统权限", permission: "system:rbac", icon: Users }
];

export function findRoute(key: RouteKey): AppRoute | undefined {
  return routes.find((route) => route.key === key);
}
