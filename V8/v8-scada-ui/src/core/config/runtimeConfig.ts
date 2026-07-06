export const runtimeConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  signalrUrl: import.meta.env.VITE_SIGNALR_URL ?? "http://localhost:8090",
  tenantId: "T1"
};
