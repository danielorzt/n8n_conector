-- =============================================
-- NovaSync — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- Products table
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  codigo text not null unique,
  nombre text not null,
  categoria text not null,
  precio numeric not null,
  stock_actual integer not null default 0,
  stock_minimo integer not null default 5,
  proveedor text not null,
  score_ia integer not null default 8 check (score_ia between 1 and 10),
  icono text not null default 'Package',
  created_at timestamptz default now()
);

-- Simulations table
create table if not exists simulations (
  id uuid default gen_random_uuid() primary key,
  cliente_nombre text not null,
  cliente_empresa text not null,
  cliente_email text not null,
  cliente_cargo text not null,
  cliente_telefono text not null,
  producto_id uuid references products(id) on delete set null,
  producto_nombre text not null,
  producto_codigo text not null,
  cantidad integer not null,
  total numeric not null,
  stock_post_venta integer not null,
  estado_stock text not null check (estado_stock in ('critical', 'low', 'ok')),
  webhook_url text,
  estado_envio text not null default 'pendiente' check (estado_envio in ('pendiente', 'enviado', 'error')),
  respuesta_n8n jsonb,
  created_at timestamptz default now()
);

-- Row Level Security
alter table products enable row level security;
alter table simulations enable row level security;

-- Open policies for anon (demo/simulator app — no auth required)
create policy "anon_all_products"    on products    for all to anon using (true) with check (true);
create policy "anon_all_simulations" on simulations for all to anon using (true) with check (true);
