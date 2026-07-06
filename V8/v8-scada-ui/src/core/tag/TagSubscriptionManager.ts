import { eventBus } from "../bus/EventBus";
import { tagStoreApi } from "../../store/tagStore";
import { TagValue } from "../../types/domain";

type Subscription = {
  deviceId: string;
  tagList: Set<string>;
};

function normalizeTag(input: any): TagValue {
  return {
    deviceId: input.deviceId ?? input.DeviceId,
    tagName: input.tagName ?? input.tag ?? input.TagName,
    value: input.value ?? input.Value,
    timestamp: input.timestamp ?? input.Timestamp ?? new Date().toISOString(),
    quality: input.quality ?? input.Quality
  };
}

export class TagSubscriptionManager {
  private readonly subscriptions = new Map<string, Subscription>();

  constructor() {
    eventBus.on("realtime:tag", (payload) => this.handleMessage(payload));
  }

  subscribe(deviceId: string, tagList: string[]): () => void {
    const key = deviceId;
    this.subscriptions.set(key, { deviceId, tagList: new Set(tagList) });
    return () => this.subscriptions.delete(key);
  }

  private handleMessage(payload: unknown): void {
    const tag = normalizeTag(payload);
    const subscription = this.subscriptions.get(tag.deviceId);
    if (!subscription || !subscription.tagList.has(tag.tagName)) return;
    tagStoreApi.getState().updateTag(tag);
  }
}

export const tagSubscriptionManager = new TagSubscriptionManager();
