import { tagSubscriptionManager } from "../tag/TagSubscriptionManager";
import { sceneStoreApi } from "../../store/sceneStore";
import { SceneJson } from "../../types/domain";

export class SceneEngine {
  private unsubscribeFns: Array<() => void> = [];

  load(sceneJson: SceneJson): void {
    this.dispose();
    sceneStoreApi.getState().setScene(sceneJson);
    const groupedTags = new Map<string, Set<string>>();
    for (const component of sceneJson.components) {
      const [deviceId, tagName] = component.tag.split(".");
      const tags = groupedTags.get(deviceId) ?? new Set<string>();
      tags.add(tagName);
      groupedTags.set(deviceId, tags);
    }
    for (const [deviceId, tags] of groupedTags.entries()) {
      this.unsubscribeFns.push(tagSubscriptionManager.subscribe(deviceId, Array.from(tags)));
    }
  }

  bind(sceneJson: SceneJson): void {
    this.load(sceneJson);
  }

  render(): SceneJson | null {
    return sceneStoreApi.getState().currentScene;
  }

  dispose(): void {
    for (const unsubscribe of this.unsubscribeFns) unsubscribe();
    this.unsubscribeFns = [];
  }
}

export const sceneEngine = new SceneEngine();
