import bcrypt from "bcryptjs";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createPool } from "@v8/control-data";
import { logger, requireEnv } from "@v8/shared";
import {
  AlarmPacket,
  ConfigKind,
  ConfigService,
  DevicePacket,
  DeviceShadowService,
  InternalEventBus,
  MetricsService,
  MqttService,
  TagPacket
} from "./cloud-services.js";

type JwtClaims = {
  sub: string;
  tenantId: string;
  role: "platform_admin" | "tenant_admin" | "operator";
};

const pool = createPool();
const app = express();
const eventBus = new InternalEventBus();
const mqtt = new MqttService(eventBus);
const configs = new ConfigService();
const shadows = new DeviceShadowService();
const metrics = new MetricsService();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false }));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const configKindSchema = z.enum(["device", "polling", "alarm"]);
const configSchema = z.object({
  tenantId: z.string().min(1).optional(),
  deviceId: z.string().min(1),
  kind: configKindSchema,
  config: z.unknown()
});

const rollbackSchema = z.object({
  tenantId: z.string().min(1).optional(),
  deviceId: z.string().min(1),
  kind: configKindSchema,
  version: z.number().int().positive()
});

const tagPacketSchema = z.object({
  tenantId: z.string().min(1).optional(),
  deviceId: z.string().min(1),
  tagId: z.string().optional(),
  tagName: z.string().optional(),
  value: z.union([z.number(), z.string(), z.boolean()]),
  quality: z.string().optional(),
  ts: z.union([z.number(), z.string()]).optional()
});

const alarmPacketSchema = z.object({
  tenantId: z.string().min(1).optional(),
  deviceId: z.string().min(1),
  tagId: z.string().optional(),
  level: z.string().optional(),
  message: z.string().min(1),
  ts: z.union([z.number(), z.string()]).optional()
});

const devicePacketSchema = z.object({
  tenantId: z.string().min(1).optional(),
  deviceId: z.string().min(1),
  status: z.string().min(1),
  health: z.union([z.number(), z.string()]).optional(),
  lastSeen: z.string().optional()
});

function signToken(claims: JwtClaims): string {
  return jwt.sign(claims, requireEnv("JWT_SECRET"), { expiresIn: "2h", issuer: "v8-gateway" });
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    res.status(401).json({ error: "missing_token" });
    return;
  }
  try {
    req.user = jwt.verify(token, requireEnv("JWT_SECRET"), { issuer: "v8-gateway" }) as JwtClaims;
    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
}

function requireRole(...roles: JwtClaims["role"][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    next();
  };
}

app.get("/health", (_req, res) => res.json({ status: "ok", service: "gateway-service" }));

app.post("/auth/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await pool.query(
      "select id, tenant_id, email, password_hash, role from control.tenant_users where email = $1",
      [body.email]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }
    res.json({
      accessToken: signToken({ sub: user.id, tenantId: user.tenant_id, role: user.role }),
      tenantId: user.tenant_id,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/me", requireAuth, (req, res) => res.json({ user: req.user }));

app.get("/api/tenants", requireAuth, requireRole("platform_admin"), async (_req, res, next) => {
  try {
    const result = await pool.query("select id, name, status, created_at from control.tenants order by created_at desc limit 200");
    res.json({ tenants: result.rows });
  } catch (error) {
    next(error);
  }
});

app.get("/api/devices", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      "select id, tenant_id, name, protocol, status from control.devices where tenant_id = $1 order by id",
      [req.user!.tenantId]
    );
    res.json({ devices: result.rows });
  } catch (error) {
    next(error);
  }
});

app.get("/api/public/devices", async (req, res, next) => {
  try {
    const tenantId = String(req.query.tenantId ?? "T1");
    const result = await pool.query(
      "select id, name, protocol, status from control.devices where tenant_id = $1 order by id",
      [tenantId]
    );
    res.json({ devices: result.rows });
  } catch (error) {
    next(error);
  }
});

app.post("/api/config", requireAuth, requireRole("platform_admin", "tenant_admin"), (req, res, next) => {
  try {
    const body = configSchema.parse(req.body);
    const tenantId = body.tenantId ?? req.user!.tenantId;
    const version = configs.upsert(tenantId, body.deviceId, body.kind as ConfigKind, body.config);
    mqtt.publishConfig(version);
    if (body.kind === "device" && typeof body.config === "object" && body.config !== null && "activationCode" in body.config) {
      shadows.bindActivation(tenantId, body.deviceId, String((body.config as { activationCode?: unknown }).activationCode ?? ""));
    }
    res.status(201).json({ config: version });
  } catch (error) {
    next(error);
  }
});

app.get("/api/config/:deviceId/:kind", requireAuth, (req, res, next) => {
  try {
    const kind = configKindSchema.parse(req.params.kind);
    res.json({
      latest: configs.latest(req.user!.tenantId, req.params.deviceId, kind),
      history: configs.history(req.user!.tenantId, req.params.deviceId, kind)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/config/rollback", requireAuth, requireRole("platform_admin", "tenant_admin"), (req, res, next) => {
  try {
    const body = rollbackSchema.parse(req.body);
    const tenantId = body.tenantId ?? req.user!.tenantId;
    const version = configs.rollback(tenantId, body.deviceId, body.kind, body.version);
    if (!version) {
      res.status(404).json({ error: "config_version_not_found" });
      return;
    }
    mqtt.publishConfig(version);
    res.json({ config: version });
  } catch (error) {
    next(error);
  }
});

app.get("/api/config/:deviceId/:kind/diff", requireAuth, (req, res, next) => {
  try {
    const kind = configKindSchema.parse(req.params.kind);
    const from = Number(req.query.from);
    const to = Number(req.query.to);
    res.json({ diff: configs.diff(req.user!.tenantId, req.params.deviceId, kind, from, to) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/edge/tag", (req, res, next) => {
  try {
    const packet = tagPacketSchema.parse(req.body) as TagPacket;
    const tenantId = packet.tenantId ?? "T1";
    shadows.touchTag(tenantId, packet.deviceId);
    metrics.observePacket(tenantId, packet.deviceId, packet.ts);
    mqtt.publishEdgePacket("v7/tag/update", { ...packet, tenantId });
    res.status(202).json({ accepted: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/edge/alarm", (req, res, next) => {
  try {
    const packet = alarmPacketSchema.parse(req.body) as AlarmPacket;
    const tenantId = packet.tenantId ?? "T1";
    metrics.observePacket(tenantId, packet.deviceId, packet.ts);
    mqtt.publishEdgePacket("v7/alarm/event", { ...packet, tenantId });
    res.status(202).json({ accepted: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/edge/device", (req, res, next) => {
  try {
    const packet = devicePacketSchema.parse(req.body) as DevicePacket;
    const tenantId = packet.tenantId ?? "T1";
    const shadow = shadows.updateFromPacket(tenantId, packet);
    mqtt.publishEdgePacket("v7/device/status", { ...packet, tenantId });
    res.status(202).json({ accepted: true, shadow });
  } catch (error) {
    next(error);
  }
});

app.get("/api/device-shadow", requireAuth, (req, res) => {
  res.json({ devices: shadows.list(req.user!.tenantId) });
});

app.get("/api/observability/metrics", requireAuth, requireRole("platform_admin", "tenant_admin"), (_req, res) => {
  res.json({ latency: metrics.snapshot() });
});

app.get("/api/licenses/current", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      "select plan, device_quota, data_rate_per_minute, starts_at, expires_at, status from control.licenses where tenant_id = $1 order by starts_at desc limit 1",
      [req.user!.tenantId]
    );
    res.json({ license: result.rows[0] ?? null });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ error }, "gateway request failed");
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "validation_error", details: error.flatten() });
    return;
  }
  res.status(500).json({ error: "internal_error" });
});

declare global {
  namespace Express {
    interface Request {
      user?: JwtClaims;
    }
  }
}

const port = Number(process.env.GATEWAY_PORT ?? 8080);
app.listen(port, () => logger.info({ port }, "gateway-service listening"));
