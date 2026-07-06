create schema if not exists control;
create schema if not exists metadata;
create extension if not exists pgcrypto;

create table if not exists control.tenants (
  id text primary key,
  name text not null,
  status text not null check (status in ('active', 'disabled', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists control.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references control.tenants(id),
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('platform_admin', 'tenant_admin', 'operator')),
  created_at timestamptz not null default now()
);

create table if not exists control.devices (
  id text primary key,
  tenant_id text not null references control.tenants(id),
  name text not null,
  protocol text not null check (protocol in ('json', 'modbus', 'dlt645')),
  status text not null check (status in ('active', 'disabled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_devices_tenant on control.devices(tenant_id);

create table if not exists control.licenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references control.tenants(id),
  plan text not null check (plan in ('trial', 'monthly', 'yearly', 'enterprise')),
  device_quota integer not null,
  data_rate_per_minute integer not null,
  starts_at timestamptz not null,
  expires_at timestamptz,
  status text not null check (status in ('active', 'expired', 'disabled')),
  generated_by_system boolean not null default true
);

create table if not exists control.usage_events (
  id bigserial primary key,
  tenant_id text not null references control.tenants(id),
  metric text not null,
  quantity numeric not null,
  occurred_at timestamptz not null default now()
);

create table if not exists metadata.tag_definitions (
  tenant_id text not null,
  device_id text not null,
  tag_name text not null,
  data_type text not null,
  unit text,
  primary key (tenant_id, device_id, tag_name)
);

insert into control.tenants (id, name, status)
values
  ('tenant-demo', 'Demo Manufacturing Tenant', 'active'),
  ('T1', 'MVP Tenant', 'active')
on conflict (id) do nothing;

insert into control.tenant_users (tenant_id, email, password_hash, role)
values ('tenant-demo', 'admin@tenant-demo.local', '$2a$10$lIpcS3K7CRqQKZc2AvStoO1vqIZTIt5SE7FKMPCIhs.Z1uMFGE/hK', 'tenant_admin')
on conflict (email) do nothing;

insert into control.devices (id, tenant_id, name, protocol, status)
values
  ('DEV001', 'T1', 'MVP JSON Device', 'json', 'active'),
  ('press-001', 'tenant-demo', 'Hydraulic Press 001', 'json', 'active'),
  ('meter-645-001', 'tenant-demo', 'DLT645 Energy Meter', 'dlt645', 'active'),
  ('plc-modbus-001', 'tenant-demo', 'Modbus PLC', 'modbus', 'active')
on conflict (id) do nothing;

insert into control.licenses (tenant_id, plan, device_quota, data_rate_per_minute, starts_at, expires_at, status)
values
  ('tenant-demo', 'enterprise', 10000, 100000, now(), null, 'active'),
  ('T1', 'enterprise', 10000, 100000, now(), null, 'active')
on conflict do nothing;
