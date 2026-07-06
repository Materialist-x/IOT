import { create } from "zustand";
import { SceneJson } from "../types/domain";

type SceneState = {
  currentScene: SceneJson | null;
  versions: SceneJson[];
  setScene: (scene: SceneJson) => void;
  saveVersion: (scene: SceneJson) => void;
};

export const useSceneStore = create<SceneState>((set) => ({
  currentScene: null,
  versions: [],
  setScene: (scene) => set({ currentScene: scene }),
  saveVersion: (scene) => set((state) => ({ versions: [scene, ...state.versions].slice(0, 20), currentScene: scene }))
}));

export const sceneStoreApi = useSceneStore;
