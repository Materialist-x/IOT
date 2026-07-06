import { ScadaComponentProps } from "../registry/componentRegistry";

export function ScadaButton({ component }: ScadaComponentProps) {
  return <button className="scada-command-button">{String(component.props.label ?? "执行")}</button>;
}
