import { Activity, BellRing, Cpu, RadioTower } from "lucide-react";
import { useAlarmStore } from "../../store/alarmStore";
import { useDeviceStore } from "../../store/deviceStore";
import { useTagStore } from "../../store/tagStore";

export function DashboardPanel() {
  const devices = useDeviceStore((state) => state.devices);
  const latest = useTagStore((state) => state.latest);
  const alarms = useAlarmStore((state) => state.alarms);
  const onlineDevices = devices.filter((device) => device.status === "online").length;
  const activeAlarms = alarms.filter((alarm) => !alarm.acknowledged).length;

  return (
    <section className="metric-grid">
      <article><Cpu /><span>在线设备数</span><strong>{onlineDevices}</strong></article>
      <article><RadioTower /><span>实时 Tag 数</span><strong>{latest.length}</strong></article>
      <article><BellRing /><span>未确认告警</span><strong>{activeAlarms}</strong></article>
      <article><Activity /><span>系统延迟</span><strong>42ms</strong></article>
    </section>
  );
}
