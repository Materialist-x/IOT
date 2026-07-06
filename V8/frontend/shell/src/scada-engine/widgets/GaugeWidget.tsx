import { WidgetRenderProps } from "../core/types";

type GaugeConfig = {
  title?: string;
  min: number;
  max: number;
  unit?: string;
  alarm?: {
    warning: number;
    danger: number;
  };
};

export function GaugeWidget({ widget, runtime }: WidgetRenderProps<GaugeConfig>) {
  const config = widget.config;
  const value = Number(runtime.value ?? 0);
  const min = Number(config.min ?? 0);
  const max = Number(config.max ?? 100);
  const warning = Number(config.alarm?.warning ?? max * 0.7);
  const danger = Number(config.alarm?.danger ?? max * 0.9);
  const clamped = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  const ratio = (clamped - min) / Math.max(1, max - min);
  const angle = -130 + ratio * 260;
  const state = clamped >= danger ? "danger" : clamped >= warning ? "warning" : "normal";

  return (
    <section className={`gauge-widget ${state}`}>
      <div className="widget-title">{config.title ?? widget.binding.tagName ?? widget.binding.tag}</div>
      <svg viewBox="0 0 220 150" className="gauge-svg" aria-hidden="true">
        <path className="gauge-track" d="M35 120 A80 80 0 0 1 185 120" />
        <path className="gauge-zone normal-zone" d="M35 120 A80 80 0 0 1 108 42" />
        <path className="gauge-zone warn-zone" d="M108 42 A80 80 0 0 1 160 70" />
        <path className="gauge-zone danger-zone" d="M160 70 A80 80 0 0 1 185 120" />
        <line className="gauge-needle" x1="110" y1="120" x2="110" y2="50" style={{ transform: `rotate(${angle}deg)` }} />
        <circle cx="110" cy="120" r="7" className="gauge-hub" />
      </svg>
      <div className="gauge-value">
        <strong>{Number.isFinite(value) ? value.toFixed(1) : "--"}</strong>
        <span>{config.unit ?? ""}</span>
      </div>
      <div className="gauge-scale">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </section>
  );
}
