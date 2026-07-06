import amqp, { Channel, ChannelModel, ConsumeMessage } from "amqplib";
import pino from "pino";
import { z } from "zod";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { platform: "v8" }
});

export const TenantId = z.string().min(1);
export const DeviceId = z.string().min(1);

export const RawPacketSchema = z.object({
  tenantId: TenantId,
  deviceId: DeviceId,
  protocol: z.enum(["json", "modbus", "dlt645", "unknown"]),
  payloadBase64: z.string().min(1),
  remoteAddress: z.string().optional(),
  receivedAt: z.string().datetime()
});

export const TagValueSchema = z.object({
  tenantId: TenantId,
  deviceId: DeviceId,
  tagName: z.string().min(1),
  value: z.union([z.number(), z.string(), z.boolean()]),
  timestamp: z.string().datetime(),
  quality: z.enum(["GOOD", "BAD", "UNCERTAIN"]),
  sourceProtocol: z.enum(["json", "modbus", "dlt645", "unknown"])
});

export const AlarmSchema = z.object({
  tenantId: TenantId,
  deviceId: DeviceId,
  alarmId: z.string().min(1),
  severity: z.enum(["INFO", "WARN", "CRITICAL"]),
  message: z.string().min(1),
  timestamp: z.string().datetime(),
  acknowledged: z.boolean().default(false)
});

export type RawPacket = z.infer<typeof RawPacketSchema>;
export type TagValue = z.infer<typeof TagValueSchema>;
export type Alarm = z.infer<typeof AlarmSchema>;

export const exchanges = {
  raw: "v8.raw.telemetry",
  processed: "v8.processed.telemetry",
  tags: "v8.tags",
  alarms: "v8.alarms",
  tenantEvents: "v8.tenant.events",
  billingEvents: "v8.billing.events"
} as const;

export const routingKeys = {
  rawPacket: "packet.raw",
  processedTagValue: "tag.processed",
  tagValue: "tag.value",
  alarmRaised: "alarm.raised",
  tenantDisabled: "tenant.disabled",
  usageRecorded: "usage.recorded"
} as const;

export async function connectBroker(url = process.env.RABBITMQ_URL ?? "amqp://localhost"): Promise<{ connection: ChannelModel; channel: Channel }> {
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange(exchanges.raw, "topic", { durable: true });
  await channel.assertExchange(exchanges.processed, "topic", { durable: true });
  await channel.assertExchange(exchanges.tags, "topic", { durable: true });
  await channel.assertExchange(exchanges.alarms, "topic", { durable: true });
  await channel.assertExchange(exchanges.tenantEvents, "topic", { durable: true });
  await channel.assertExchange(exchanges.billingEvents, "topic", { durable: true });
  return { connection, channel };
}

export function publishJson(channel: Channel, exchange: string, routingKey: string, value: unknown): boolean {
  return channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(value)), {
    contentType: "application/json",
    persistent: true,
    timestamp: Date.now()
  });
}

export async function consumeJson<T>(
  channel: Channel,
  queue: string,
  exchange: string,
  routingKey: string,
  handler: (value: T, message: ConsumeMessage) => Promise<void>
): Promise<void> {
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);
  await channel.prefetch(100);
  await channel.consume(queue, async (message) => {
    if (!message) return;
    try {
      await handler(JSON.parse(message.content.toString("utf8")) as T, message);
      channel.ack(message);
    } catch (error) {
      logger.error({ error, queue }, "consumer failed");
      channel.nack(message, false, false);
    }
  });
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

export function tenantScopedKey(tenantId: string, suffix: string): string {
  return `tenant:${tenantId}:${suffix}`;
}
