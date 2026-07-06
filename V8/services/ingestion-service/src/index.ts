import { connectBroker, consumeJson, exchanges, logger, publishJson, RawPacket, RawPacketSchema, routingKeys, TagValue } from "@v8/shared";

function decodeJson(packet: RawPacket): TagValue[] {
  const decoded = JSON.parse(Buffer.from(packet.payloadBase64, "base64").toString("utf8"));
  const tagSource = decoded.tags && typeof decoded.tags === "object" ? decoded.tags : decoded;
  const values = Array.isArray(tagSource) ? tagSource : Object.entries(tagSource).map(([tagName, value]) => ({ tagName, value }));
  return values
    .filter((item: any) => item.tagName && !["deviceId", "tenantId"].includes(item.tagName) && item.value !== undefined)
    .map((item: any) => ({
      tenantId: decoded.tenantId ?? packet.tenantId,
      deviceId: decoded.deviceId ?? packet.deviceId,
      tagName: String(item.tagName),
      value: item.value,
      timestamp: item.timestamp ?? packet.receivedAt,
      quality: item.quality ?? "GOOD",
      sourceProtocol: "json"
    }));
}

function decodeRawFrame(packet: RawPacket): TagValue[] {
  const frame = Buffer.from(packet.payloadBase64, "base64");
  return [
    {
      tenantId: packet.tenantId,
      deviceId: packet.deviceId,
      tagName: `${packet.protocol}.frame.length`,
      value: frame.length,
      timestamp: packet.receivedAt,
      quality: "UNCERTAIN",
      sourceProtocol: packet.protocol
    },
    {
      tenantId: packet.tenantId,
      deviceId: packet.deviceId,
      tagName: `${packet.protocol}.frame.hex`,
      value: frame.toString("hex"),
      timestamp: packet.receivedAt,
      quality: "UNCERTAIN",
      sourceProtocol: packet.protocol
    }
  ];
}

function normalize(packet: RawPacket): TagValue[] {
  if (packet.protocol === "json") return decodeJson(packet);
  return decodeRawFrame(packet);
}

const { channel } = await connectBroker();

await consumeJson<RawPacket>(channel, "ingestion.raw", exchanges.raw, routingKeys.rawPacket, async (payload) => {
  const packet = RawPacketSchema.parse(payload);
  const tags = normalize(packet);
  for (const tag of tags) {
    publishJson(channel, exchanges.tags, routingKeys.tagValue, tag);
  }
});

logger.info("ingestion-service consuming raw packets");
