type Handler<T = unknown> = (payload: T) => void;

export class EventBus {
  private readonly handlers = new Map<string, Set<Handler>>();

  on<T>(event: string, handler: Handler<T>): () => void {
    const handlers = this.handlers.get(event) ?? new Set<Handler>();
    handlers.add(handler as Handler);
    this.handlers.set(event, handlers);
    return () => handlers.delete(handler as Handler);
  }

  emit<T>(event: string, payload: T): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    for (const handler of handlers) handler(payload);
  }
}

export const eventBus = new EventBus();
