import { ScadaComponentProps } from "../registry/componentRegistry";

export function Gauge({ component, value }: ScadaComponentProps) {
  const min = Number(component.props.min ?? 0);
  const max = Number(component.props.max ?? 100);
  const warning = Number(component.props.warning ?? 70);
  const danger = Number(component.props.danger ?? 90);
  const numericValue = Number(value ?? 0);
  const clamped = Math.min(max, Math.max(min, Number.isFinite(numericValue) ? numericValue : min));
  const ratio = (clamped - min) / Math.max(1, max - min);
  const angle = -130 + ratio * 260;
  const state = clamped >= danger ? "danger" : clamped >= warning ? "warning" : "normal";

  return (
    <section className={`industrial-gauge ${state}`}>
      <strong>{String(component.props.title ?? component.tag)}</strong>
      <svg viewBox="0 0 220 150" aria-hidden="true">
        <path className="gauge-track" d="M35 120 A80 80 0 0 1 185 120" />
        <path className="gauge-ok" d="M35 120 A80 80 0 0 1 108 42" />
        <path className="gauge-warn" d="M108 42 A80 80 0 0 1 160 70" />
        <path className="gauge-danger" d="M160 70 A80 80 0 0 1 185 120" />
        <line className="gauge-needle" x1="110" y1="120" x2="110" y2="50" style={{ transform: `rotate(${angle}deg)` }} />
        <circle cx="110" cy="120" r="7" className="gauge-hub" />
      </svg>
      <div className="metric-value">{Number.isFinite(numericValue) ? numericValue.toFixed(1) : "--"} <span>{String(component.props.unit ?? "")}</span></div>
    </section>
  );
}
