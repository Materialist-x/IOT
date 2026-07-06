import { TagValue } from "../types/domain";

export async function listLatestTags(): Promise<TagValue[]> {
  const timestamp = new Date().toISOString();
  return [
    { deviceId: "DEV001", tagName: "Temp", value: 42.8, timestamp, quality: "Good" },
    { deviceId: "DEV001", tagName: "Press", value: 0.82, timestamp, quality: "Good" },
    { deviceId: "DEV001", tagName: "Flow", value: 128.4, timestamp, quality: "Good" },
    { deviceId: "DEV002", tagName: "Speed", value: 1450, timestamp, quality: "Good" }
  ];
}
