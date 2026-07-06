import { create } from "zustand";
import { listHistoryPoints } from "../services/history.api";
import { HistoryPoint } from "../types/domain";

type HistoryState = {
  points: HistoryPoint[];
  loading: boolean;
  loadHistory: (deviceId: string, tagName: string) => Promise<void>;
};

export const useHistoryStore = create<HistoryState>((set) => ({
  points: [],
  loading: false,
  loadHistory: async (deviceId, tagName) => {
    set({ loading: true });
    try {
      set({ points: await listHistoryPoints(deviceId, tagName), loading: false });
    } catch {
      set({ points: [], loading: false });
    }
  }
}));
