# NovaSync — B2B Sales Simulator

Simulador de ventas B2B conectado a n8n, Supabase y Google Sheets. Pensado para demostrar automatización de inventario y alertas de stock crítico en tiempo real.

**Live:** https://n8n-conector.vercel.app  
**Repo:** https://github.com/danielorzt/n8n_conector  
**n8n VPS:** https://n8n.srv1679460.hstgr.cloud/workflow/3986xhe88EosXA3j  
**Supabase:** https://supabase.com/dashboard/project/lpvqyjelnzwaesohiwwk  
**Google Sheet:** https://docs.google.com/spreadsheets/d/1mqKIJnD6fNjPokLzC-82BG4ufo0zgMpxEvsowmOWq9M

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite 6 + React 19 + TypeScript 5.8 |
| Styles | Tailwind CSS 3.4 + DM Sans + Syne fonts |
| State | `useStore` custom hook (no Redux) |
| DB + Realtime | Supabase PostgreSQL + WebSockets |
| Automation | n8n (VPS Hostinger) |
| AI | Gemini 2.5 Flash (via n8n HTTP node) |
| Observability | Sentry v9 + PostHog |
| Deploy | Vercel (auto-deploy from `main`) |

---

## Quick Start

```bash
git clone https://github.com/danielorzt/n8n_conector.git
cd n8n_conector
npm install
cp .env.example .env.local   # fill in values below
npm run dev
```

### Variables de entorno (`.env.local`)

```env
VITE_SUPABASE_URL=https://lpvqyjelnzwaesohiwwk.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
```

> Supabase → Settings → API → "anon public" JWT. Nunca usar la service_role key en el frontend.

---

## Supabase Setup

Las tablas ya están creadas en el proyecto `lpvqyjelnzwaesohiwwk`.  
Si necesitas recrearlas en un proyecto nuevo:

```bash
# En Supabase SQL Editor:
# 1. Ejecuta supabase/schema.sql
# 2. Ejecuta supabase/seed.sql  (30 productos del sheet Inventario)
```

Realtime habilitado: `products` y `simulations` con RLS anon open policy (demo mode).

---

## n8n Webhook

Workflow `NOVASYNC` (ID: `3986xhe88EosXA3j`) en `n8n.srv1679460.hstgr.cloud`.

**Webhook URL de producción:**
```
https://n8n.srv1679460.hstgr.cloud/webhook/e263a234-ab7d-4dec-a196-544edb38b3cc
```

Pégala en el dashboard → barra superior → Verificar.

### Flujo n8n

```
Webhook POST
  → IF Score_IA ≥ 8 AND Estado_Venta === "Compró"
    → Google Sheets (leer stock Inventario)
    → Code: cruzar lead + inventario → generarOrden = stock < stockMinimo
    → IF generarOrden
      TRUE  → Gemini (continueOnFail=true) → Slack alerta stock crítico
      FALSE → Slack notificación venta
    → Google Sheets: registrar en Ops_Alertas
```

### Payload que envía el frontend

```json
{
  "nombre": "Carlos Ruiz",
  "empresa": "LogiCargo S.A.",
  "email": "carlos@logicargo.com",
  "cargo": "Director de Compras",
  "telefono": "3001234567",
  "Score_IA": 9,
  "Estado_Venta": "Compró",
  "Producto_Comprado": "Monitor Dell UltraSharp 27\"",
  "Codigo": "MON-027",
  "Cantidad": 1,
  "Total": 850000,
  "Stock_Actual": 2,
  "Stock_Minimo": 8,
  "Proveedor": "ImportTech Bogota",
  "fecha": "26/05/2026",
  "hora": "14:30:00"
}
```

> Sin wrapper `body: {}`. n8n Webhook typeVersion 2 ya pone el body bajo `$json.body` internamente.

---

## Arquitectura de datos

```
Frontend (Vercel)
  ↓ CRUD
Supabase DB (products, simulations)
  ↓ Realtime WebSocket
Frontend (live sync en todos los tabs)

Frontend
  ↓ POST webhook en cada simulación de venta
n8n VPS
  ↓ escribe
Google Sheets Ops_Alertas + Slack
```

---

## Estructura del proyecto

```
src/
  components/
    Header.tsx          # Logo + webhook status + LIVE badge (Realtime)
    KPICards.tsx        # 4 KPIs: ventas hoy, stock crítico, valor total, última sync
    ProductGrid.tsx     # Grid de productos con memo
    CheckoutPanel.tsx   # Formulario de venta (cliente + cantidad)
    ProductModal.tsx    # CRUD de productos (admin)
    HistoryTable.tsx    # Historial de simulaciones con retry
    Toast.tsx           # Sistema de toasts con progress bar
    WebhookBar.tsx      # Input URL + botón verificar
  hooks/
    useStore.ts         # Estado global: productos, simulaciones, realtime, webhook
  lib/
    supabase.ts         # Cliente Supabase + isSupabaseConfigured guard
    utils.ts            # formatCOP, formatDate, formatTime, getStockStatus, cn
    sentry.ts           # Sentry v9 init
    posthog.ts          # PostHog analytics
  types/index.ts        # Product, Simulation, CustomerData, WebhookPayload, KPIData
  data/products.ts      # Fallback local (cuando Supabase no configurado)

supabase/
  schema.sql            # DDL: products + simulations + RLS policies
  seed.sql              # 30 productos del Google Sheet Inventario

n8n/
  Proyecton8n.json      # Workflow exportado de n8n
  NovaSync.xlsx         # Referencia del Google Sheet
```

---

## Bugs resueltos (contexto importante)

| Bug | Causa | Fix |
|-----|-------|-----|
| Webhook IF siempre false | `Estado_Venta: 'Compro'` sin tilde | `'Compró'` en `useStore.ts` |
| Webhook IF siempre false | Payload envuelto en `body: {}` extra | Payload flat directo |
| Gemini bloqueaba Slack | `continueOnFail: false` default | Seteado `true` vía n8n API |
| Sentry TS2353 | `tracePropagationTargets` movido en v9 | Movido a root `Sentry.init()` |
| Supabase `orden_generada` | Columna generated en DB no se puede insertar | Removida del INSERT, solo en fallback local |

---

## Comandos útiles

```bash
npm run dev       # dev server :5173
npm run build     # build + type check
npm run preview   # preview del build
```

### n8n API (read/write)

```bash
# Verificar workflow
curl -H "X-N8N-API-KEY: <key>" \
  https://n8n.srv1679460.hstgr.cloud/api/v1/workflows/3986xhe88EosXA3j

# Ver últimas ejecuciones
curl -H "X-N8N-API-KEY: <key>" \
  "https://n8n.srv1679460.hstgr.cloud/api/v1/executions?workflowId=3986xhe88EosXA3j&limit=5"
```

---

## Vercel

Deploy automático desde `main`. Variables de entorno configuradas en Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
