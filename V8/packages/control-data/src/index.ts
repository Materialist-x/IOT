import pg from "pg";

const { Pool } = pg;

export function createPool(): pg.Pool {
  return new Pool({
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER ?? "v8",
    password: process.env.POSTGRES_PASSWORD ?? "v8_password",
    database: process.env.POSTGRES_DB ?? "v8_platform",
    max: 10,
    idleTimeoutMillis: 30000
  });
}

export async function tenantExists(pool: pg.Pool, tenantId: string): Promise<boolean> {
  const result = await pool.query("select 1 from control.tenants where id = $1 and status = 'active'", [tenantId]);
  return (result.rowCount ?? 0) > 0;
}

export async function deviceAllowed(pool: pg.Pool, tenantId: string, deviceId: string): Promise<boolean> {
  const result = await pool.query(
    "select 1 from control.devices d join control.tenants t on t.id = d.tenant_id where d.id = $1 and d.tenant_id = $2 and d.status = 'active' and t.status = 'active'",
    [deviceId, tenantId]
  );
  return (result.rowCount ?? 0) > 0;
}
