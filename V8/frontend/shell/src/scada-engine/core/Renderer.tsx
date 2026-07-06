import { memo } from "react";
import { DataBinder } from "./DataBinder";
import { widgetRegistry } from "./WidgetRegistry";
import { ScadaLayout, WidgetModel } from "./types";

type RendererProps = {
  layout: ScadaLayout;
  binder: DataBinder;
  changedVersion: number;
  mode: "runtime" | "editor";
};

const WidgetFrame = memo(function WidgetFrame({
  widget,
  binder,
  mode
}: {
  widget: WidgetModel;
  binder: DataBinder;
  mode: "runtime" | "editor";
}) {
  return (
    <div
      className={mode === "editor" ? "scada-widget editor" : "scada-widget"}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.position.width,
        height: widget.position.height
      }}
    >
      {widgetRegistry.render(widget.type, {
        widget,
        runtime: binder.getState(widget.id),
        mode
      })}
    </div>
  );
});

export function Renderer({ layout, binder, changedVersion, mode }: RendererProps) {
  void changedVersion;
  return (
    <div className="scada-canvas-wrap">
      <div
        className="scada-canvas"
        style={{
          width: layout.canvas.width,
          height: layout.canvas.height
        }}
      >
        {layout.widgets.map((widget) => (
          <WidgetFrame key={widget.id} widget={widget} binder={binder} mode={mode} />
        ))}
      </div>
    </div>
  );
}
