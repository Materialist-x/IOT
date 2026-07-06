import { reactive } from "vue";
import type { AlarmRule, Device, LicenseState, TagPoint } from "../domain/models";

export const configStore = reactive({
  devices: [] as Device[],
  tags: [] as TagPoint[],
  rules: [] as AlarmRule[],
  license: {
    status: "ACTIVE",
    type: "TRIAL",
    maxDevices: 1,
    activeDevices: 0,
    expiresAt: null,
    licenseKey: "V8-TRIAL-0001",
    machineId: "HASH_VM_001",
    features: {
      scadaDashboard: true,
      deviceManagement: true,
      alarmSystem: true,
      multiDevice: false,
      historian: false
    }
  } as LicenseState
});
