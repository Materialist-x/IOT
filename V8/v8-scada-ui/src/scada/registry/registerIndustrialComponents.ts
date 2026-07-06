import { ScadaButton } from "../components/Button";
import { Gauge } from "../components/Gauge";
import { LineChart } from "../components/LineChart";
import { ScadaSwitch } from "../components/Switch";
import { componentRegistry } from "./componentRegistry";

export function registerIndustrialComponents(): void {
  componentRegistry.register("Gauge", Gauge);
  componentRegistry.register("LineChart", LineChart);
  componentRegistry.register("Button", ScadaButton);
  componentRegistry.register("Switch", ScadaSwitch);
}
