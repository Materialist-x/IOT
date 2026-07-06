import { useMemo } from "react";
import { useTagStore } from "../../store/tagStore";
import { SceneJson } from "../../types/domain";
import { componentRegistry } from "../registry/componentRegistry";

type SceneRendererProps = {
  scene: SceneJson;
  mode: "runtime" | "editor";
};

export function SceneRenderer({ scene, mode }: SceneRendererProps) {
  const tags = useTagStore((state) => state.tags);
  const historyByComponent = useMemo(() => new Map<string, Array<{ timestamp: string; value: number }>>(), [scene.sceneId]);

  return (
    <div className="scene-scroll">
      <div className="scene-canvas" style={{ width: scene.canvas.width, height: scene.canvas.height }}>
        {scene.components.map((component) => {
          const [deviceId, tagName] = component.tag.split(".");
          const tag = tags[deviceId]?.[tagName];
          const history = historyByComponent.get(component.id) ?? [];
          const numericValue = Number(tag?.value);
          if (tag && Number.isFinite(numericValue)) {
            history.push({ timestamp: tag.timestamp, value: numericValue });
            historyByComponent.set(component.id, history.slice(-300));
          }
          return (
            <div
              key={component.id}
              className={mode === "editor" ? "scene-node editor" : "scene-node"}
              style={{ left: component.x, top: component.y, width: component.width, height: component.height }}
            >
              {componentRegistry.render(component.type, { component, value: tag?.value, history, mode })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
