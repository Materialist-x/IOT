import express from "express";
import { z } from "zod";
import { createPool } from "@v8/control-data";
import { logger } from "@v8/shared";

const app = express();
const pool = createPool();
app.use(express.json());

const deviceSchema = z.object({
  id: z.string().min(2),
  tenantId: z.string().min(2),
  name: z.string().min(2),
  protocol: z.enum(["json", "modbus", "dlt645"])
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "device-service" }));

app.post("/devices", async (req, res, next) => {
  try {
    const device = deviceSchema.parse(req.body);
    await pool.query(
      "insert into control.devices (id, tenant_id, name, protocol, status) values ($1, $2, $3, $4, 'active')",
      [device.id, device.tenantId, device.name, device.protocol]
    );
    res.status(201).json({ device });
  } catch (error) {
    next(error);
  }
});

app.get("/tenants/:tenantId/devices", async (req, res, next) => {
  try {
    const result = await pool.query("select id, tenant_id, name, protocol, status from control.devices where tenant_id = $1", [req.params.tenantId]);
    res.json({ devices: result.rows });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ error }, "device-service failed");
  res.status(error instanceof z.ZodError ? 400 : 500).json({ error: error instanceof z.ZodError ? "validation_error" : "internal_error" });
});

app.listen(Number(process.env.DEVICE_SERVICE_PORT ?? 8082), () => logger.info("device-service listening"));
