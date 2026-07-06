import { ComponentType, createElement, ReactElement } from "react";
import { WidgetRenderProps } from "./types";

export type WidgetComponent = ComponentType<WidgetRenderProps<any>>;

export class WidgetRegistry {
  private readonly components = new Map<string, WidgetComponent>();

  register(type: string, component: WidgetComponent): void {
    this.components.set(type, component);
  }

  get(type: string): WidgetComponent | undefined {
    return this.components.get(type);
  }

  render(type: string, props: WidgetRenderProps): ReactElement {
    const Component = this.get(type);
    if (!Component) {
      return createElement("div", { className: "widget-unknown" }, `Unknown widget: ${type}`);
    }
    return createElement(Component, props);
  }
}

export const widgetRegistry = new WidgetRegistry();
