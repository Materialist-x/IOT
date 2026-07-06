import { ScadaComponentProps } from "../registry/componentRegistry";

export function LineChart({ component, value, history }: ScadaComponentProps) {
  const points = history.slice(-Number(component.props.timeWindow ?? 60));
  const values = points.map((point) => point.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 100;
  const range = Math.max(1, max - min);
  const width = 360;
  const height = 145;
  const path = points
    .map((point, index) => {
      const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * width;
      const y = height - ((point.value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <section className="industrial-chart">
      <strong>{String(component.props.title ?? component.tag)}</strong>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="48" x2={width} y2="48" />
        <line x1="0" y1="96" x2={width} y2="96" />
        <path d={path || `M 0 ${height} L ${width} ${height}`} />
      </svg>
      <div className="chart-foot"><span>{min.toFixed(1)}</span><b>{String(value ?? "--")}</b><span>{max.toFixed(1)}</span></div>
    </section>
  );
}
