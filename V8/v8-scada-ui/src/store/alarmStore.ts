import { create } from "zustand";
import { eventBus } from "../core/bus/EventBus";
import { Alarm } from "../types/domain";

type AlarmState = {
  alarms: Alarm[];
  addAlarm: (alarm: Alarm) => void;
  acknowledge: (id: string) => void;
};

export const useAlarmStore = create<AlarmState>((set) => ({
  alarms: [
    {
      id: "ALM001",
      deviceId: "DEV002",
      severity: "warning",
      message: "泵站出口压力超过预警阈值",
      timestamp: new Date(Date.now() - 4 * 60_000).toISOString()
    }
  ],
  addAlarm: (alarm) => set((state) => ({ alarms: [alarm, ...state.alarms].slice(0, 100) })),
  acknowledge: (id) => set((state) => ({ alarms: state.alarms.map((alarm) => alarm.id === id ? { ...alarm, acknowledged: true } : alarm) }))
}));

eventBus.on("realtime:alarm", (payload: any) => {
  useAlarmStore.getState().addAlarm({
    id: payload.alarmId ?? `${payload.deviceId}-${Date.now()}`,
    deviceId: payload.deviceId,
    severity: payload.severity?.toLowerCase?.() ?? "warning",
    message: payload.message ?? "设备告警",
    timestamp: payload.timestamp ?? new Date().toISOString()
  });
});
