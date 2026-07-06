import { randomUUID } from "node:crypto";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { Redis } from "ioredis";
import { Alarm, connectBroker, consumeJson, exchanges, logger, publishJson, routingKeys, TagValue, TagValueSchema } from "@v8/shared";

type Rule = {
  tagName: string;
  operator: ">" | "<" | "=";
  threshold: number | string | boolean;
  severity: Alarm["severity"];
  message: string;
};

const rules: Rule[] = [
  { tagName: "temperature", operator: ">", threshold: 80, severity: "CRITICAL", message: "Temperature above safe operating limit" },
  { tagName: "pressure", operator: ">", threshold: 200, severity: "WARN", message: "Pressure threshold exceeded" }
];

function matchesRule(tag: TagValue, rule: Rule): boolean {
  if (tag.tagName !== rule.tagName) return false;
  if (rule.operator === ">") return Number(tag.value) > Number(rule.threshold);
  if (rule.operator === "<") return Number(tag.value) < Number(rule.threshold);
  return tag.value === rule.threshold;
}

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
const influx = new InfluxDB({ url: process.env.INFLUX_URL ?? "http://localhost:8086", token: process.env.INFLUX_TOKEN ?? "v8-influx-token" });
const writeApi = influx.getWriteApi(process.env.INFLUX_ORG ?? "v8", process.env.INFLUX_BUCKET ?? "telemetry");
const { channel } = await connectBroker();

async function storeTag(tag: TagValue): Promise<void> {
  await redis.set(`tenant:${tag.tenantId}:device:${tag.deviceId}:tag:${tag.tagName}`, JSON.stringify(tag), "EX", 3600);

  const point = new Point("tag_value")
    .tag("tenantId", tag.tenantId)
    .tag("deviceId", tag.deviceId)
    .tag("tagName", tag.tagName)
    .tag("quality", tag.quality)
    .tag("source", tag.sourceProtocol)
    .timestamp(new Date(tag.timestamp));

  if (typeof tag.value === "number") point.floatField("value", tag.value);
  else point.stringField("value_text", String(tag.value));

  writeApi.writePoint(point);
}

await consumeJson<TagValue>(channel, "stream-engine.tags", exchanges.tags, routingKeys.tagValue, async (payload) => {
  const tag = TagValueSchema.parse(payload);
  await storeTag(tag);
  publishJson(channel, exchanges.processed, routingKeys.processedTagValue, tag);

  publishJson(channel, exchanges.billingEvents, routingKeys.usageRecorded, {
    tenantId: tag.tenantId,
    metric: "tag_value",
    quantity: 1,
    occurredAt: tag.timestamp
  });

  for (const rule of rules) {
    if (!matchesRule(tag, rule)) continue;
    publishJson(channel, exchanges.alarms, routingKeys.alarmRaised, {
      tenantId: tag.tenantId,
      deviceId: tag.deviceId,
      alarmId: randomUUID(),
      severity: rule.severity,
      message: rule.message,
      timestamp: tag.timestamp,
      acknowledged: false
    } satisfies Alarm);
  }
});

setInterval(() => writeApi.flush().catch((error) => logger.error({ error }, "influx flush failed")), 1000);
logger.info("stream-engine consuming normalized tags");
