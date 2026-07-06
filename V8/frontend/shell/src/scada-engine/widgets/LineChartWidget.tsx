import { WidgetRenderProps } from "../core/types";

type LineChartConfig = {
  title?: string;
  timeWindow?: number;
  unit?: string;
};

export function LineChartWidget({ widget, runtime }: WidgetRenderProps<LineChartConfig>) {
  const config = widget.config;
  const points = runtime.history.slice(-Math.max(2, Number(config.timeWindow ?? 60)));
  const values = points.map((point) => point.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 100;
  const range = Math.max(1, max - min);
  const width = 320;
  const height = 140;
  const path = points
    .map((point, index) => {
      const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * width;
      const y = height - ((point.value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <section className="chart-widget">
      <div className="widget-title">{config.title ?? widget.binding.tagName ?? widget.binding.tag}</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none" aria-hidden="true">
        <g className="chart-grid">
          <line x1="0" y1="35" x2={width} y2="35" />
          <line x1="0" y1="70" x2={width} y2="70" />
          <line x1="0" y1="105" x2={width} y2="105" />
        </g>
        <path className="chart-line" d={path || `M 0 ${height} L ${width} ${height}`} />
      </svg>
      <div className="chart-meta">
        <span>{min.toFixed(1)}</span>
        <strong>{String(runtime.value ?? "--")}</strong>
        <span>{max.toFixed(1)} {config.unit ?? ""}</span>
      </div>
    </section>
  );
}
