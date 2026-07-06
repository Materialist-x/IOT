import express from "express";
import { z } from "zod";
import { createPool } from "@v8/control-data";
import { logger } from "@v8/shared";

const app = express();
const pool = createPool();
app.use(express.json());

const planConfig = {
  trial: { quota: 10, rate: 1000, hours: 24 },
  monthly: { quota: 500, rate: 20000, hours: 24 * 31 },
  yearly: { quota: 2000, rate: 50000, hours: 24 * 366 },
  enterprise: { quota: 10000, rate: 100000, hours: null }
} as const;

const issueSchema = z.object({
  tenantId: z.string().min(2),
  plan: z.enum(["trial", "monthly", "yearly", "enterprise"])
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "license-service" }));

app.post("/licenses/system-issue", async (req, res, next) => {
  try {
    const body = issueSchema.parse(req.body);
    const config = planConfig[body.plan];
    const expires = config.hours ? `now() + interval '${config.hours} hours'` : "null";
    const result = await pool.query(
      `insert into control.licenses (tenant_id, plan, device_quota, data_rate_per_minute, starts_at, expires_at, status, generated_by_system)
       values ($1, $2, $3, $4, now(), ${expires}, 'active', true)
       returning id, tenant_id, plan, device_quota, data_rate_per_minute, starts_at, expires_at, status`,
      [body.tenantId, body.plan, config.quota, config.rate]
    );
    res.status(201).json({ license: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.post("/licenses/expire-sweep", async (_req, res, next) => {
  try {
    const result = await pool.query(
      "update control.licenses set status = 'expired' where status = 'active' and expires_at is not null and expires_at < now() returning tenant_id"
    );
    await pool.query(
      "update control.tenants set status = 'expired' where id = any($1::text[])",
      [result.rows.map((row) => row.tenant_id)]
    );
    res.json({ expiredTenants: result.rows.map((row) => row.tenant_id) });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ error }, "license-service failed");
  res.status(error instanceof z.ZodError ? 400 : 500).json({ error: error instanceof z.ZodError ? "validation_error" : "internal_error" });
});

app.listen(Number(process.env.LICENSE_SERVICE_PORT ?? 8083), () => logger.info("license-service listening"));
