import { ComponentType, createElement, ReactElement } from "react";
import { SceneComponent } from "../../types/domain";

export type ScadaComponentProps = {
  component: SceneComponent;
  value: number | string | undefined;
  history: Array<{ timestamp: string; value: number }>;
  mode: "runtime" | "editor";
};

type ScadaComponent = ComponentType<ScadaComponentProps>;

class ComponentRegistry {
  private readonly registry = new Map<string, ScadaComponent>();

  register(type: string, component: ScadaComponent): void {
    this.registry.set(type, component);
  }

  get(type: string): ScadaComponent | undefined {
    return this.registry.get(type);
  }

  render(type: string, props: ScadaComponentProps): ReactElement {
    const Component = this.get(type);
    if (!Component) return createElement("div", { className: "unknown-component" }, `未知组件：${type}`);
    return createElement(Component, props);
  }
}

export const componentRegistry = new ComponentRegistry();
