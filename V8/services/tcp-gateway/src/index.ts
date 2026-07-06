import net from "node:net";
import { randomUUID } from "node:crypto";
import { connectBroker, exchanges, logger, publishJson, RawPacket, routingKeys } from "@v8/shared";

const { channel } = await connectBroker();
const port = Number(process.env.TCP_GATEWAY_PORT ?? 9000);

function readMetadata(socket: net.Socket): { tenantId: string; deviceId: string; protocol: RawPacket["protocol"] } {
  const tenantId = process.env.DEFAULT_TENANT_ID ?? "T1";
  const deviceId = process.env.DEFAULT_DEVICE_ID ?? `unknown-${randomUUID()}`;
  const protocol = (process.env.DEFAULT_PROTOCOL ?? "json") as RawPacket["protocol"];
  const [hostTenant, hostDevice, hostProtocol] = (socket.remoteAddress ?? "").split(".");
  return {
    tenantId: hostTenant?.startsWith("tenant-") ? hostTenant : tenantId,
    deviceId: hostDevice || deviceId,
    protocol: ["json", "modbus", "dlt645"].includes(hostProtocol) ? (hostProtocol as RawPacket["protocol"]) : protocol
  };
}

const server = net.createServer((socket) => {
  const metadata = readMetadata(socket);
  logger.info({ remoteAddress: socket.remoteAddress, ...metadata }, "device connected");

  socket.on("data", (buffer) => {
    const packet: RawPacket = {
      ...metadata,
      payloadBase64: buffer.toString("base64"),
      remoteAddress: socket.remoteAddress,
      receivedAt: new Date().toISOString()
    };
    publishJson(channel, exchanges.raw, routingKeys.rawPacket, packet);
  });

  socket.on("error", (error) => logger.warn({ error }, "tcp socket error"));
});

server.listen(port, "0.0.0.0", () => logger.info({ port }, "tcp-gateway listening"));
