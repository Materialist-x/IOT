import bcrypt from "bcryptjs";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createPool } from "@v8/control-data";
import { logger, requireEnv } from "@v8/shared";

type JwtClaims = {
  sub: string;
  tenantId: string;
  role: "platform_admin" | "tenant_admin" | "operator";
};

const pool = createPool();
const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false }));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
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
