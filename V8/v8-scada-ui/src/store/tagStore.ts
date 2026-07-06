import { create } from "zustand";
import { listLatestTags } from "../services/tag.api";
import { TagConfig, TagValue } from "../types/domain";

type TagState = {
  tags: Record<string, Record<string, TagValue>>;
  latest: TagValue[];
  tagConfigs: TagConfig[];
  loadLatestTags: () => Promise<void>;
  updateTag: (tag: TagValue) => void;
  upsertTagConfig: (config: TagConfig) => void;
  removeTagConfig: (deviceId: string, tagName: string) => void;
  getValue: (deviceId: string, tagName: string) => TagValue | undefined;
};

export const useTagStore = create<TagState>((set, get) => ({
  tags: loadCachedTags(),
  latest: flattenTags(loadCachedTags()),
  tagConfigs: loadTagConfigs(),
  loadLatestTags: async () => {
    const latest = (await listLatestTags()).map((tag) => applyTagConfig(tag, get().tagConfigs));
    const tags = latest.reduce<Record<string, Record<string, TagValue>>>((result, tag) => {
      result[tag.deviceId] = { ...(result[tag.deviceId] ?? {}), [tag.tagName]: tag };
      return result;
    }, { ...get().tags });
    localStorage.setItem("v8:last-tags", JSON.stringify(tags));
    set({ tags, latest: flattenTags(tags) });
  },
  updateTag: (tag) => {
    const nextTag = applyTagConfig(tag, get().tagConfigs);
    const tags = {
      ...get().tags,
      [nextTag.deviceId]: {
        ...(get().tags[nextTag.deviceId] ?? {}),
        [nextTag.tagName]: nextTag
      }
    };
    localStorage.setItem("v8:last-tags", JSON.stringify(tags));
    set({ tags, latest: flattenTags(tags).slice(0, 50) });
  },
  upsertTagConfig: (config) => {
    const normalized = normalizeTagConfig(config);
    const tagConfigs = [
      normalized,
      ...get().tagConfigs.filter((item) => tagConfigKey(item) !== tagConfigKey(normalized))
    ];
    localStorage.setItem("v8:tag-configs", JSON.stringify(tagConfigs));
    const tags = remapTagsWithConfig(get().tags, tagConfigs);
    localStorage.setItem("v8:last-tags", JSON.stringify(tags));
    set({ tagConfigs, tags, latest: flattenTags(tags) });
  },
  removeTagConfig: (deviceId, tagName) => {
    const key = `${deviceId}:${tagName}`;
    const tagConfigs = get().tagConfigs.filter((item) => tagConfigKey(item) !== key);
    localStorage.setItem("v8:tag-configs", JSON.stringify(tagConfigs));
    const tags = remapTagsWithConfig(get().tags, tagConfigs);
    localStorage.setItem("v8:last-tags", JSON.stringify(tags));
    set({ tagConfigs, tags, latest: flattenTags(tags) });
  },
  getValue: (deviceId, tagName) => get().tags[deviceId]?.[tagName]
}));

export const tagStoreApi = useTagStore;

function loadCachedTags(): Record<string, Record<string, TagValue>> {
  try {
    return JSON.parse(localStorage.getItem("v8:last-tags") ?? "{}");
  } catch {
    return {};
  }
}

function loadTagConfigs(): TagConfig[] {
  try {
    const cached = JSON.parse(localStorage.getItem("v8:tag-configs") ?? "[]") as TagConfig[];
    return cached.length ? cached.map(normalizeTagConfig) : getDefaultTagConfigs();
  } catch {
    return getDefaultTagConfigs();
  }
}

function flattenTags(tags: Record<string, Record<string, TagValue>>): TagValue[] {
  return Object.values(tags)
    .flatMap((deviceTags) => Object.values(deviceTags))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function applyTagConfig(tag: TagValue, configs: TagConfig[]): TagValue {
  const config = configs.find((item) => item.deviceId === tag.deviceId && item.tagName === tag.tagName);
  if (!config || !config.enable) return tag;
  const rawValue = tag.rawValue ?? tag.value;
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return { ...tag, rawValue, multiplier: config.multiplier, offset: config.offset };
  }
  return {
    ...tag,
    rawValue,
    value: roundValue(numeric * config.multiplier + config.offset),
    multiplier: config.multiplier,
    offset: config.offset
  };
}

function remapTagsWithConfig(tags: Record<string, Record<string, TagValue>>, configs: TagConfig[]): Record<string, Record<string, TagValue>> {
  return Object.fromEntries(
    Object.entries(tags).map(([deviceId, deviceTags]) => [
      deviceId,
      Object.fromEntries(
        Object.entries(deviceTags).map(([tagName, tag]) => [tagName, applyTagConfig({ ...tag, value: tag.rawValue ?? tag.value }, configs)])
      )
    ])
  );
}

function normalizeTagConfig(config: TagConfig): TagConfig {
  return {
    ...config,
    tagName: config.tagName.trim(),
    address: config.address.trim(),
    interval: Math.max(100, Number(config.interval) || 1000),
    retry: Math.max(0, Number(config.retry) || 0),
    timeout: Math.max(100, Number(config.timeout) || 500),
    multiplier: Number.isFinite(Number(config.multiplier)) ? Number(config.multiplier) : 1,
    offset: Number.isFinite(Number(config.offset)) ? Number(config.offset) : 0,
    enable: config.enable !== false
  };
}

function tagConfigKey(config: TagConfig): string {
  return `${config.deviceId}:${config.tagName}`;
}

function roundValue(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function getDefaultTagConfigs(): TagConfig[] {
  return [
    { deviceId: "DEV001", tagName: "Temp", address: "40001", registerType: "holding", dataType: "float32", interval: 1000, retry: 3, timeout: 500, multiplier: 1, offset: 0, enable: true },
    { deviceId: "DEV001", tagName: "Press", address: "40003", registerType: "holding", dataType: "float32", interval: 1000, retry: 3, timeout: 500, multiplier: 1, offset: 0, enable: true },
    { deviceId: "DEV001", tagName: "Flow", address: "flow", registerType: "json", dataType: "float32", interval: 1000, retry: 3, timeout: 500, multiplier: 1, offset: 0, enable: true },
    { deviceId: "DEV002", tagName: "Speed", address: "30001", registerType: "input", dataType: "uint16", interval: 1000, retry: 3, timeout: 500, multiplier: 1, offset: 0, enable: true }
  ];
}
