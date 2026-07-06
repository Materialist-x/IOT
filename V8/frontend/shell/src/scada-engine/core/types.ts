export type WidgetPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WidgetBinding = {
  deviceId: string;
  tagName?: string;
  tag?: string;
};

export type WidgetModel<TConfig = Record<string, unknown>> = {
  id: string;
  type: string;
  position: WidgetPosition;
  binding: WidgetBinding;
  config: TConfig;
  runtimeValue?: unknown;
};

export type ScadaLayout = {
  id: string;
  name: string;
  canvas: {
    width: number;
    height: number;
  };
  widgets: WidgetModel[];
};

export type RuntimeTagUpdate = {
  tenantId?: string;
  deviceId: string;
  tagName?: string;
  tag?: string;
  value: number | string;
  timestamp: string;
  quality?: string | number;
  source?: string;
  sourceProtocol?: string;
};

export type WidgetRuntimeState = {
  value: unknown;
  timestamp?: string;
  history: Array<{ timestamp: string; value: number }>;
};

export type WidgetRenderProps<TConfig = Record<string, unknown>> = {
  widget: WidgetModel<TConfig>;
  runtime: WidgetRuntimeState;
  mode: "runtime" | "editor";
};
