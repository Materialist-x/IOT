import { HistoryPoint } from "../types/domain";

export async function listHistoryPoints(deviceId = "DEV001", tagName = "Temp"): Promise<HistoryPoint[]> {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, index) => {
    const value = 42 + Math.sin(index / 2) * 8 + (index % 5);
    return {
      deviceId,
      tagName,
      value: Number(value.toFixed(2)),
      timestamp: new Date(now - (23 - index) * 5 * 60 * 1000).toISOString()
    };
  });
}
