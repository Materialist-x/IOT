import { useEffect } from "react";
import { sceneEngine } from "../../core/scene/SceneEngine";
import { useSceneStore } from "../../store/sceneStore";
import { SceneJson } from "../../types/domain";
import { registerIndustrialComponents } from "../registry/registerIndustrialComponents";
import { SceneRenderer } from "../renderer/SceneRenderer";

registerIndustrialComponents();

export function ScadaRuntime({ scene }: { scene: SceneJson }) {
  const currentScene = useSceneStore((state) => state.currentScene);

  useEffect(() => {
    sceneEngine.load(scene);
    return () => sceneEngine.dispose();
  }, [scene]);

  if (!currentScene) return null;
  return <SceneRenderer scene={currentScene} mode="runtime" />;
}
