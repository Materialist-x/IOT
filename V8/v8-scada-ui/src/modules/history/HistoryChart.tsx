import { useHistoryStore } from "../../store/historyStore";

export function HistoryChart() {
  const points = useHistoryStore((state) => state.points);
  const width = 760;
  const height = 280;
  const padding = 28;
  const values = points.map((point) => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = Math.max(max - min, 1);
  const path = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");

  return (
    <article className="panel history-chart">
      <header>
        <h2>历史趋势</h2>
        <span>{points[0]?.deviceId ?? "DEV001"} / {points[0]?.tagName ?? "Temp"}</span>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="历史趋势曲线">
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} />;
        })}
        <path d={path} />
      </svg>
      <footer>
        <span>最小 {min.toFixed(2)}</span>
        <span>最大 {max.toFixed(2)}</span>
      </footer>
    </article>
  );
}
