import express from "express";
import { z } from "zod";
import { createPool } from "@v8/control-data";
import { connectBroker, exchanges, logger, publishJson, routingKeys } from "@v8/shared";

const app = express();
const pool = createPool();
app.use(express.json());

const tenantSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(2)
});

const { channel } = await connectBroker();

app.get("/health", (_req, res) => res.json({ status: "ok", service: "tenant-service" }));

app.post("/tenants", async (req, res, next) => {
  try {
    const tenant = tenantSchema.parse(req.body);
    await pool.query("insert into control.tenants (id, name, status) values ($1, $2, 'active')", [tenant.id, tenant.name]);
    res.status(201).json({ tenant });
  } catch (error) {
    next(error);
  }
});

app.post("/tenants/:tenantId/disable", async (req, res, next) => {
  try {
    await pool.query("update control.tenants set status = 'disabled', updated_at = now() where id = $1", [req.params.tenantId]);
    publishJson(channel, exchanges.tenantEvents, routingKeys.tenantDisabled, { tenantId: req.params.tenantId, disabledAt: new Date().toISOString() });
    res.status(202).json({ tenantId: req.params.tenantId, status: "disabled" });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ error }, "tenant-service failed");
  res.status(error instanceof z.ZodError ? 400 : 500).json({ error: error instanceof z.ZodError ? "validation_error" : "internal_error" });
});

app.listen(Number(process.env.TENANT_SERVICE_PORT ?? 8081), () => logger.info("tenant-service listening"));
