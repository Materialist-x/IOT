import { RuntimeTagUpdate, WidgetModel, WidgetRuntimeState } from "./types";

type Subscriber = (widgetIds: string[]) => void;

export class DataBinder {
  private readonly bindings = new Map<string, string[]>();
  private readonly state = new Map<string, WidgetRuntimeState>();
  private readonly pending = new Set<string>();
  private subscribers = new Set<Subscriber>();
  private frame = 0;

  loadWidgets(widgets: WidgetModel[]): void {
    this.bindings.clear();
    for (const widget of widgets) {
      const key = this.bindingKey(widget.binding.deviceId, widget.binding.tagName ?? widget.binding.tag ?? "");
      const ids = this.bindings.get(key) ?? [];
      ids.push(widget.id);
      this.bindings.set(key, ids);
      if (!this.state.has(widget.id)) {
        this.state.set(widget.id, { value: widget.runtimeValue ?? null, history: [] });
      }
    }
  }

  applyUpdate(update: RuntimeTagUpdate): void {
    const tagName = update.tagName ?? update.tag ?? "";
    const widgetIds = this.bindings.get(this.bindingKey(update.deviceId, tagName));
    if (!widgetIds?.length) return;

    for (const widgetId of widgetIds) {
      const previous = this.state.get(widgetId) ?? { value: null, history: [] };
      const numericValue = Number(update.value);
      const history = Number.isFinite(numericValue)
        ? [...previous.history, { timestamp: update.timestamp, value: numericValue }].slice(-300)
        : previous.history;

      this.state.set(widgetId, {
        value: update.value,
        timestamp: update.timestamp,
        history
      });
      this.pending.add(widgetId);
    }

    this.scheduleNotify();
  }

  getState(widgetId: string): WidgetRuntimeState {
    return this.state.get(widgetId) ?? { value: null, history: [] };
  }

  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  private bindingKey(deviceId: string, tagName: string): string {
    return `${deviceId}::${tagName}`;
  }

  private scheduleNotify(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      const changed = Array.from(this.pending);
      this.pending.clear();
      for (const subscriber of this.subscribers) subscriber(changed);
    });
  }
}
