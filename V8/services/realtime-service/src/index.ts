import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { Alarm, connectBroker, consumeJson, exchanges, logger, routingKeys, TagValue } from "@v8/shared";

type Client = {
  socket: WebSocket;
  tenantId: string;
  deviceId?: string;
  kind: "tags" | "alarms" | "device";
};

const clients = new Set<Client>();
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ status: "ok", service: "realtime-service" }));
});
const wss = new WebSocketServer({ server });

wss.on("connection", (socket, request) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const [, scope, tenantId, kindOrDevice, deviceId] = url.pathname.split("/");
  if (scope !== "tenant" || !tenantId) {
    socket.close(1008, "tenant scope required");
    return;
  }
  const client: Client = {
    socket,
    tenantId,
    kind: kindOrDevice === "alarms" ? "alarms" : kindOrDevice === "device" ? "device" : "tags",
    deviceId
  };
  clients.add(client);
  socket.on("close", () => clients.delete(client));
});

function fanout(kind: Client["kind"], payload: TagValue | Alarm): void {
  for (const client of clients) {
    if (client.socket.readyState !== WebSocket.OPEN) continue;
    if (client.tenantId !== payload.tenantId) continue;
    if (client.kind !== kind && client.kind !== "device") continue;
    if (client.deviceId && client.deviceId !== payload.deviceId) continue;
    client.socket.send(JSON.stringify({ type: kind, payload }));
  }
}

const { channel } = await connectBroker();
await consumeJson<TagValue>(channel, "realtime.tags", exchanges.tags, routingKeys.tagValue, async (tag) => fanout("tags", tag));
await consumeJson<Alarm>(channel, "realtime.alarms", exchanges.alarms, routingKeys.alarmRaised, async (alarm) => fanout("alarms", alarm));

const port = Number(process.env.REALTIME_PORT ?? 8090);
server.listen(port, () => logger.info({ port }, "realtime-service listening"));
