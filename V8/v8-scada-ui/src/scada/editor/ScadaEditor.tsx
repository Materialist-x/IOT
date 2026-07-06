import { sceneEngine } from "../../core/scene/SceneEngine";
import { useSceneStore } from "../../store/sceneStore";
import { SceneJson } from "../../types/domain";
import { SceneRenderer } from "../renderer/SceneRenderer";

export function ScadaEditor({ scene }: { scene: SceneJson }) {
  const saveVersion = useSceneStore((state) => state.saveVersion);
  const currentScene = useSceneStore((state) => state.currentScene) ?? scene;

  return (
    <section className="editor-shell">
      <div className="editor-toolbar">
        <button onClick={() => sceneEngine.load(scene)}>加载场景</button>
        <button onClick={() => saveVersion({ ...currentScene, version: currentScene.version + 1 })}>保存版本</button>
      </div>
      <SceneRenderer scene={currentScene} mode="editor" />
    </section>
  );
}
