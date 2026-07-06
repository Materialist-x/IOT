import { ScadaComponentProps } from "../registry/componentRegistry";

export function ScadaSwitch({ value, component }: ScadaComponentProps) {
  return (
    <section className="scada-switch">
      <strong>{String(component.props.label ?? component.tag)}</strong>
      <span className={value ? "switch-on" : "switch-off"}>{value ? "开启" : "关闭"}</span>
    </section>
  );
}
