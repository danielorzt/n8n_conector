# AGENTS.md — Guía para Claude Code en este proyecto

## Skills a instalar

Desde la raíz del repo, instala estos skills antes de trabajar:

```bash
# 1. Caveman — modo comunicación terse (activo en este proyecto)
/install-skill caveman

# 2. Diseño frontend con reglas impeccable
/install-skill impeccable

# 3. Best practices React + Vercel
/install-skill vercel-react-best-practices

# 4. Diseño UI profesional
/install-skill frontend-design
```

> Después de instalar, activa caveman con `/caveman` en el chat. El usuario trabaja en modo **full** por defecto.

---

## Contexto del proyecto

**NovaSync** es un simulador B2B de ventas conectado a:
- **Supabase** (DB + Realtime WebSockets)
- **n8n** en VPS Hostinger (webhook → Google Sheets + Slack + Gemini AI)

El objetivo es demostrar automatización de inventario: cuando un lead con Score IA ≥ 8 compra y el stock queda crítico, n8n genera una alerta en Slack con texto de Gemini y registra en Google Sheets.

---

## MCPs útiles para este proyecto

El usuario tiene estos MCPs conectados en Claude Code:

| MCP | Para qué usarlo |
|-----|-----------------|
| `mcp__claude_ai_Google_Drive__read_file_content` | Leer el Google Sheet NovaSync (`fileId: 1mqKIJnD6fNjPokLzC-82BG4ufo0zgMpxEvsowmOWq9M`) |
| `mcp__claude_ai_Google_Drive__search_files` | Buscar archivos en Drive del usuario |

---

## Acceso a servicios externos

### Supabase
- **Project ref:** `lpvqyjelnzwaesohiwwk`
- **URL:** `https://lpvqyjelnzwaesohiwwk.supabase.co`
- **Tablas:** `products`, `simulations`
- **Realtime:** habilitado en ambas tablas

### n8n VPS
- **URL:** `https://n8n.srv1679460.hstgr.cloud`
- **Workflow ID:** `3986xhe88EosXA3j`
- **Webhook producción:** `https://n8n.srv1679460.hstgr.cloud/webhook/e263a234-ab7d-4dec-a196-544edb38b3cc`
- **API:** `X-N8N-API-KEY` header (ver con el usuario — no commitear)

### Google Sheet
- **ID:** `1mqKIJnD6fNjPokLzC-82BG4ufo0zgMpxEvsowmOWq9M`
- **Sheets:** `Inventario` (30 productos), `Ops_Alertas` (historial de ventas)

---

## Reglas de diseño (impeccable skill)

Este proyecto usa las leyes del skill `impeccable`. Nunca hacer:
- Side-stripe borders en cards (`border-l-4 border-primary`)
- Gradient text en títulos (`bg-clip-text text-transparent`)
- Glassmorphism como default visual (`backdrop-blur` solo en overlays funcionales)
- Hero-metric template (número grande solo, sin contexto)
- Modal como primera solución para formularios simples

Sí usar:
- `hover:-translate-y-0.5 transition-transform` en cards interactivos
- `animate-ping` para indicadores de estado en vivo (LIVE badge, webhook connected)
- `skeleton-shimmer` class para loading states (definida en `index.css`)
- `font-display` (Syne) para headings, `font-sans` (DM Sans) para body

---

## Patrones importantes en el código

### `useStore.ts` — hook central
- `isSupabaseConfigured` guard en toda operación DB
- Fallback local completo cuando Supabase no configurado
- Realtime: `supabase.channel('novasync-realtime')` con deduplicación por ID
- Payload webhook: campos **flat** (sin wrapper `body: {}`), `Estado_Venta: 'Compró'` con tilde

### `Toast.tsx`
- Progress bar con `animate-toast-progress` (4s, definida en tailwind.config.js)
- Auto-dismiss a los 4000ms via `useEffect`

### `ProductModal.tsx`
- Handlers `onAdd`, `onEdit`, `onDelete` son `async` — siempre `await` en `handleSubmit`

### n8n payload crítico
```ts
// CORRECTO — flat, con tilde
const payload = {
  Score_IA: product.score_ia,
  Estado_Venta: 'Compró',   // <-- tilde obligatoria, n8n IF checa strict equality
  // ... resto de campos al nivel raíz
}

// MAL — nunca envolver en body
const payload = { body: { Score_IA: ... } }  // duplica $json.body en n8n
```

---

## Workflow n8n — puntos importantes

El IF principal checa:
- `$json.body.Score_IA >= 8` (número)
- `$json.body.Estado_Venta === "Compró"` (string con tilde, case-sensitive)

El nodo Gemini tiene `continueOnFail: true` — si falla (cuota, key, red), el flujo continúa con mensaje fallback pre-generado en el Code node.

El Code node `⚙️ Cruzar Lead + Inventario` hace `const webhook = lead.body || lead` — ya maneja la estructura automáticamente.

---

## Comandos frecuentes

```bash
# Verificar build antes de push
npm run build

# Simular webhook directamente (requiere python)
python -c "
import json, subprocess, tempfile, os
payload = {'nombre':'Test','empresa':'Test SA','email':'test@test.com',
           'cargo':'CEO','telefono':'3000000000','Score_IA':9,
           'Estado_Venta':'Compró','Producto_Comprado':'Monitor Dell',
           'Codigo':'MON-027','Cantidad':1,'Total':850000,
           'Stock_Actual':2,'Stock_Minimo':8,'Proveedor':'ImportTech',
           'fecha':'01/01/2026','hora':'10:00:00'}
tmp = os.path.join(tempfile.gettempdir(), 'test.json')
open(tmp,'w',encoding='utf-8').write(json.dumps(payload,ensure_ascii=False))
r = subprocess.run(['curl','-sk','-X','POST',
  'https://n8n.srv1679460.hstgr.cloud/webhook/e263a234-ab7d-4dec-a196-544edb38b3cc',
  '-H','Content-Type: application/json; charset=utf-8','--data-binary','@'+tmp],
  capture_output=True,encoding='utf-8')
print(r.stdout)
"
```

---

## Archivos clave para leer al inicio de sesión

1. `src/hooks/useStore.ts` — estado global + Supabase + webhook
2. `src/types/index.ts` — todos los tipos
3. `supabase/schema.sql` — estructura de DB
4. `n8n/Proyecton8n.json` — workflow completo (para entender flujo)
