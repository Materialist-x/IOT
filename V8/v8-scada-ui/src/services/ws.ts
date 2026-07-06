import { realtimeManager } from "../core/realtime/RealtimeManager";
import { runtimeConfig } from "../core/config/runtimeConfig";

export function connectRealtime(tenantId: string): void {
  realtimeManager.connect(tenantId, runtimeConfig.signalrUrl);
}

export function disconnectRealtime(): void {
  realtimeManager.disconnect();
}
