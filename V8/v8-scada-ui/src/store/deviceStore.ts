import { create } from "zustand";
import { listDevices } from "../services/device.api";
import { Device } from "../types/domain";

type DeviceState = {
  devices: Device[];
  loadDevices: (tenantId: string) => Promise<void>;
  addDevice: (device: Device) => void;
  updateDevice: (id: string, patch: Partial<Device>) => void;
};

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  loadDevices: async (tenantId) => set({ devices: await listDevices(tenantId) }),
  addDevice: (device) => set((state) => ({ devices: [device, ...state.devices] })),
  updateDevice: (id, patch) => set((state) => ({
    devices: state.devices.map((device) => device.id === id ? { ...device, ...patch } : device)
  }))
}));
