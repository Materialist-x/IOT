import { widgetRegistry } from "../core/WidgetRegistry";
import { GaugeWidget } from "./GaugeWidget";
import { LineChartWidget } from "./LineChartWidget";

export function registerIndustrialWidgets(): void {
  widgetRegistry.register("Gauge", GaugeWidget);
  widgetRegistry.register("LineChart", LineChartWidget);
}
