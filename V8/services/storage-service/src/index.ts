import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { Redis } from "ioredis";
import { connectBroker, consumeJson, exchanges, logger, routingKeys, TagValue, TagValueSchema, tenantScopedKey } from "@v8/shared";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
const influx = new InfluxDB({ url: process.env.INFLUX_URL ?? "http://localhost:8086", token: process.env.INFLUX_TOKEN ?? "v8-influx-token" });
const writeApi = influx.getWriteApi(process.env.INFLUX_ORG ?? "v8", process.env.INFLUX_BUCKET ?? "telemetry");
const { channel } = await connectBroker();

await consumeJson<TagValue>(channel, "storage.tags", exchanges.tags, routingKeys.tagValue, async (payload) => {
  const tag = TagValueSchema.parse(payload);
  const cacheKey = tenantScopedKey(tag.tenantId, `device:${tag.deviceId}:tag:${tag.tagName}`);
  await redis.set(cacheKey, JSON.stringify(tag), "EX", 3600);

  const point = new Point("tag_value")
    .tag("tenantId", tag.tenantId)
    .tag("deviceId", tag.deviceId)
    .tag("tagName", tag.tagName)
    .tag("quality", tag.quality)
    .tag("sourceProtocol", tag.sourceProtocol)
    .timestamp(new Date(tag.timestamp));

  if (typeof tag.value === "number") point.floatField("value", tag.value);
  else if (typeof tag.value === "boolean") point.booleanField("value_bool", tag.value);
  else point.stringField("value_text", String(tag.value));

  writeApi.writePoint(point);
});

setInterval(() => writeApi.flush().catch((error) => logger.error({ error }, "influx flush failed")), 1000);
logger.info("storage-service consuming tag values");
