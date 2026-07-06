import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { eventBus } from "../bus/EventBus";

export type RealtimeStatus = "offline" | "connecting" | "connected" | "reconnecting" | "failed";

export class RealtimeManager {
  private connection?: HubConnection;
  private heartbeatTimer?: number;

  connect(tenantId: string, baseUrl: string): void {
    if (this.connection?.state === HubConnectionState.Connected) return;
    eventBus.emit<RealtimeStatus>("realtime:status", "connecting");
    this.connection = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/tenant/${tenantId}/tags`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on("tag", (json: string) => eventBus.emit("realtime:tag", JSON.parse(json)));
    this.connection.on("alarm", (json: string) => eventBus.emit("realtime:alarm", JSON.parse(json)));
    this.connection.onreconnecting(() => eventBus.emit<RealtimeStatus>("realtime:status", "reconnecting"));
    this.connection.onreconnected(() => eventBus.emit<RealtimeStatus>("realtime:status", "connected"));
    this.connection.onclose(() => eventBus.emit<RealtimeStatus>("realtime:status", "offline"));

    void this.connection
      .start()
      .then(() => {
        eventBus.emit<RealtimeStatus>("realtime:status", "connected");
        this.startHeartbeat();
      })
      .catch(() => eventBus.emit<RealtimeStatus>("realtime:status", "failed"));
  }

  disconnect(): void {
    if (this.heartbeatTimer) window.clearInterval(this.heartbeatTimer);
    void this.connection?.stop();
    this.connection = undefined;
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) window.clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = window.setInterval(() => {
      eventBus.emit("realtime:heartbeat", { timestamp: new Date().toISOString() });
    }, 15000);
  }
}

export const realtimeManager = new RealtimeManager();
