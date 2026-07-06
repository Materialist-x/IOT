import { createPool } from "@v8/control-data";
import { connectBroker, consumeJson, exchanges, logger, routingKeys } from "@v8/shared";

type UsageEvent = {
  tenantId: string;
  metric: string;
  quantity: number;
  occurredAt?: string;
};

const pool = createPool();
const { channel } = await connectBroker();

await consumeJson<UsageEvent>(channel, "billing.usage", exchanges.billingEvents, routingKeys.usageRecorded, async (event: UsageEvent) => {
  await pool.query(
    "insert into control.usage_events (tenant_id, metric, quantity, occurred_at) values ($1, $2, $3, $4)",
    [event.tenantId, event.metric, event.quantity, event.occurredAt ?? new Date().toISOString()]
  );
});

logger.info("billing-service consuming usage events");
