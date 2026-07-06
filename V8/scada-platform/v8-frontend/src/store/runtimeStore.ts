import { reactive } from "vue";
import type { AlarmRecord, FaultRecord, TagPoint, TcpTrace } from "../domain/models";

export const runtimeStore = reactive({
  tagValues: [] as TagPoint[],
  alarms: [] as AlarmRecord[],
  faults: [] as FaultRecord[],
  trend: {
    temp: [] as number[],
    pressure: [] as number[]
  },
  systemMetrics: {
    cpu: 0,
    ram: 0,
    net: 0
  },
  metrics: {
    onlineDevices: 0,
    totalDevices: 0,
    onlineRatio: 0,
    ioThroughput: 0,
    tagUpdateRate: 0,
    faultCount: 0
  },
  connected: false,
  tcp: {
    stage: "idle",
    deviceId: "",
    detail: "",
    lastCommand: "--",
    lastResponse: "--",
    steps: [] as TcpTrace[]
  }
});
