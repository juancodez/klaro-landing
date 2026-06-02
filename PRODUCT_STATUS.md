# Klaro — Product Status 2026-06-01
**Auditor:** Claude Code (AUDIT_PRODUCT skill)  
**Repo:** juancodez/klaro-landing — `C:\Users\tn\klaro-landing-01`  
**Deployed:** https://klaro-landing.vercel.app  
**Previous score:** 6.5 / 10 (PRODUCT_STATUS.md anterior, mismo día — pre-sprint)

---

## Launch Readiness: 7.5 / 10

El núcleo del producto funciona: auth, CRUD de facturas y gastos, dashboard con datos reales, EÜR con año selector, Clara conectada a Anthropic. La brecha principal es la **página de documentos que no existe todavía**, falta de datos demo (seed), un bug de IVA para Kleinunternehmer, y 2–3 variables de entorno que necesitan confirmación en Vercel.

---

## Feature Status Table

| Feature | Status | Blocker / Nota | Est. Esfuerzo |
|---------|--------|----------------|---------------|
| Auth (login/signup/session/logout) | ✅ | — | — |
| Auth trigger (profiles auto-insert) | ✅ | — | — |
| Dashboard KPIs (ingresos/gastos/beneficio/IVA) | ✅ | IVA flat-rate bug (ver abajo) | 0.5h |
| Dashboard bar chart (datos reales) | ✅ | — | — |
| Dashboard recent invoices | ✅ | — | — |
| Deadline notifications | ✅ | — | — |
| Onboarding overlay (7 pasos) | ✅ | — | — |
| Facturas CRUD + PDF | ✅ | — | — |
| Facturas: invoice_number auto-gen | ✅ | — | — |
| Facturas: email via /api/send-invoice | ⚠️ | RESEND_API_KEY no confirmada en Vercel | 0.5h |
| Gastos CRUD + recibo upload | ✅ | — | — |
| Gastos: AI receipt scanner (/api/analyze-receipt) | ⚠️ | Funciona si ANTHROPIC_API_KEY activa | — |
| Gastos: delete sin user_id guard | ⚠️ | RLS protege, pero falta `.eq('user_id', uid)` | 0.5h |
| Impuestos EÜR (año selector + brackets) | ✅ | — | — |
| Impuestos UStVA trimestral | ✅ | — | — |
| Impuestos: 2nd Supabase client (`db`) | ⚠️ | Viola CLAUDE.md; no es bug funcional | 1h |
| Clara AI (/api/clara) | ✅ | Fallback a canned si API falla | — |
| Clara: msg limit (5, localStorage) | ⚠️ | Trivialmente saltable — no producción-grade | 2h |
| Profile page | ✅ | — | — |
| klaro-documentos.html | ❌ | **No existe** — tabla y bucket en DB, página no | 4h |
| Nav: ítem Documentos en los 7 sidebars | ❌ | Bloqueado por punto anterior | 1h |
| Seed data demo | ❌ | `supabase/seed.sql` no creado | 2h |
| SUPABASE_SERVICE_ROLE_KEY en Vercel | ⚠️ | Clara + Tasks silently degrade sin ella | Manual 5 min |
| Migration 006 (invoices_cancelled) | ⚠️ | No confirmado si se ejecutó | Manual 2 min |
| Imprint.html (datos legales reales) | ⚠️ | Puede contener placeholders | Depende del owner |
| Mobile (sidebar) | ❌ | `hidden md:flex` — app inutilizable en móvil | 3h |

---

## ❌ Critical Blockers (fix antes de lanzar)

### 1. klaro-documentos.html no existe
**Lo que pasa:** El LAUNCH_PLAN.md lo define como Sprint 2, ítem 7. La tabla `documents` existe en Supabase, el bucket `documents` existe, hay un script de upload embebido en `klaro-impuestos.html` (líneas 820–879), pero no hay una página dedicada. Los 7 sidebars de la app no tienen el nav item. Si alguien navega a `/klaro-documentos.html` obtiene 404.  
**Fix:** Crear `klaro-documentos.html` copiando head + sidebar de `klaro-gastos.html`. Mover el script de documentos de `klaro-impuestos.html:820-879` a la nueva página y reemplazar `const db` por `_sb`. Añadir el ítem "Documentos" al sidebar de los 7 archivos HTML del app (dashboard, facturas, gastos, impuestos, clara, profile, ayuda).  
**Esfuerzo:** 4h (página) + 1h (nav en 7 sidebars) = **5h**

### 2. No hay datos demo (seed data)
**Lo que pasa:** `supabase/seed.sql` no existe. Un visitante de portfolio que crea una cuenta nueva ve dashboard vacío, gráfico vacío, 0 facturas, 0 gastos. La primera impresión del producto es un estado vacío — no demuestra el valor real de la app.  
**Fix:** Crear `supabase/seed.sql` con 12+ facturas (2025–2026, mix de estados pagada/enviada/vencida), 20+ gastos (6+ categorías EÜR), 3 tasks abiertas. Spec completa en `klaro-vibe-plan.md` → Phase 5 → Spec 04. Ejecutar en el SQL editor de Supabase con la UUID del usuario demo.  
**Esfuerzo:** **2h**

### 3. IVA incorrecta en dashboard para Kleinunternehmer
**Lo que pasa:** `klaro-dashboard.html:1013` calcula:  
```js
const ivaPendiente = Math.max(0, totalIngresos * 0.19 - totalGastos * 0.19);
```
Esto aplica 19% flat a todos los ingresos, ignorando:
- Los `tax_rate` individuales por factura (que ya están en el SELECT en línea 999)
- El flag `is_kleinunternehmer` de `fiscal_profiles`

Un Kleinunternehmer (que cobra 0% IVA) verá un IVA pendiente positivo y falso. Para un asesor fiscal, esto es un trust-killer inmediato.  
**Fix:** Consultar `fiscal_profiles.is_kleinunternehmer` en el bootstrap del dashboard. Si es true, ocultar la tarjeta IVA o mostrar "N/A — Kleinunternehmer §19". Si es false, calcular `SUM(amount * tax_rate/100)` para IVA real usando los datos ya cargados.  
**Esfuerzo:** **0.5h**

---

## ⚠️ Warnings (fix para lanzamiento pulido)

### 4. RESEND_API_KEY no confirmada en Vercel
El código en `klaro-facturas.html:1200` llama `/api/send-invoice` con el email del cliente. El archivo `api/send-invoice.js` existe y está completo (LAUNCH_PLAN.md confirma). Necesita `RESEND_API_KEY` + `RESEND_FROM_EMAIL` en Vercel env vars. Sin ellas, el envío falla y el usuario ve el toast "Guardada, pero no se pudo enviar el email" — funcionalidad degradada.  
**Fix:** Vercel dashboard → klaro-landing → Settings → Environment Variables. Añadir `RESEND_API_KEY` y `RESEND_FROM_EMAIL`.  
**Esfuerzo:** Manual 5 min.

### 5. SUPABASE_SERVICE_ROLE_KEY en Vercel — estado desconocido
`api/clara.js`, `api/tasks.js`, `api/declarations.js` usan la service role key server-side para leer el perfil fiscal del usuario e inyectarlo en el system prompt de Clara. Sin ella, Clara responde sin contexto y `tasks.js`/`declarations.js` pueden fallar silenciosamente.  
**Fix:** Confirmar que `SUPABASE_SERVICE_ROLE_KEY` está en Vercel. Obtenerla en Supabase → Settings → API → Service role (secret).  
**Esfuerzo:** Manual 5 min.

### 6. deleteExpense sin guard de user_id (`klaro-gastos.html:1135`)
```js
const { error } = await _sb.from('expenses').delete().eq('id', id);
// Falta: .eq('user_id', user.id)
```
RLS protege en producción, pero en entornos sin RLS activo (test, clonar BD) puede eliminar filas de otros usuarios. Es práctica incorrecta que viola la regla #3 de CLAUDE.md.  
**Fix:** Guardar `user.id` en scope del init y añadir `.eq('user_id', userId)` en la delete query.  
**Esfuerzo:** **15 min**

### 7. Migration 006 (invoices_cancelled) — estado desconocido
LAUNCH_PLAN.md Sprint 1 ítem 1 requiere ejecutar `supabase/migrations/006_invoices_cancelled.sql`. Si no se ejecutó, el status `cancelled` en facturas puede lanzar un constraint violation en Supabase.  
**Fix:** Verificar en Supabase → Table Editor → invoices → Constraints. Si no hay constraint para `cancelled`, ejecutar la migración manualmente.  
**Esfuerzo:** Manual 2 min.

### 8. Segundo cliente Supabase en klaro-impuestos.html (líneas 821–823)
```js
const _SUPA_URL = 'https://rhyobhcgvrqobouqymqr.supabase.co';
const _SUPA_KEY = 'eyJ...';  // anon key en texto claro (segunda vez)
const db = supabase.createClient(_SUPA_URL, _SUPA_KEY);
```
Viola la regla #1 de CLAUDE.md ("ALWAYS use `_sb` from auth.js"). No es bug funcional (misma anon key), pero duplica la sesión, introduce riesgo de desync si auth cambia, y va contra el patrón del proyecto.  
**Fix:** Al crear `klaro-documentos.html` (ítem 1), mover este script allí y reemplazar `db` por `_sb`. Eliminar el bloque de documentos de `klaro-impuestos.html`.  
**Esfuerzo:** **Resuelto con el bloque de docs (ítem 1)**

### 9. Message limit de Clara es localStorage-only (`klaro-clara.html:664`)
```js
if (_msgCount >= FREE_MSG_LIMIT) { /* block */ }
```
`_msgCount` viene de `localStorage`. Cualquier usuario puede abrir DevTools → Application → localStorage → borrar `klaro_clara_count` y reiniciar el contador. El límite no tiene efecto real.  
**Fix opción A (simple):** Eliminar el límite; confiar en rate-limiting de Anthropic y los costos bajos de claude-haiku.  
**Fix opción B (robusto):** Contar filas en `chat_messages` por `user_id` en el endpoint `/api/clara` y retornar `{limitReached: true}` si supera el threshold.  
**Esfuerzo:** 30 min (opción A) / 2h (opción B)

### 10. Dependencia Gemini no documentada en index.html
LAUNCH_PLAN.md ítem 13 menciona "Document or mock Gemini API dependency on index.html". No auditado en detalle — puede ser el widget interactivo de la landing que llama a un `/api/gemini-*` sin GEMINI_API_KEY configurada en Vercel.  
**Fix:** Abrir `index.html`, buscar fetch a `/api/`. Si depende de Gemini, añadir `GEMINI_API_KEY` a Vercel o convertir la feature a demo estático hardcodeado.  
**Esfuerzo:** 30 min para investigar y resolver.

---

## ✅ Already Working

1. **Auth guard completo** — `auth.js:20` `onAuthStateChange` guarda todas las páginas protegidas, redirige a login si no hay sesión, redirige al dashboard si ya está logueado en páginas públicas.
2. **Dashboard KPIs desde DB** — `klaro-dashboard.html:998-1022` queries paralelas a invoices + expenses con `user_id`, stats computadas en frontend.
3. **Bar chart con datos reales** — `klaro-dashboard.html:862-933` `_renderChart(inv, exp)` construye arrays mes-a-mes desde los datos fetched, muestra empty state si no hay datos.
4. **Facturas CRUD completo** — `klaro-facturas.html:870-963` insert con `invoice_number` auto (KL-YYYY-NNN), status cycling draft→sent→paid, delete, PDF con jsPDF.
5. **Kleinunternehmer lock en facturas** — `klaro-facturas.html:718-719` consulta `fiscal_profiles.is_kleinunternehmer` en init; si true, tax_rate forzado a 0.
6. **Gastos CRUD completo** — `klaro-gastos.html:815-1138` insert, load, delete con categorías, receipt upload a Supabase Storage, categorías EÜR-alineadas.
7. **Impuestos EÜR real** — `klaro-impuestos.html:1546-1608` year selector (2024/2025/2026), queries reales a invoices + expenses, brackets de Einkommensteuer correctos, Kleinunternehmer notice, clipboard export, disclaimer "estimación aproximada".
8. **Clara wired a /api/clara** — `klaro-clara.html:681-718` POST con `{messages, userProfile, userId}`, fallback a canned response si API falla, `savePair()` persiste en `chat_messages` via `_sb.from`.
9. **Onboarding 7 pasos** — `klaro-dashboard.html:111-284` overlay en dashboard, persiste a `fiscal_profiles` en Supabase, skip si ya existe fila.
10. **Deadline notifications** — `klaro-dashboard.html:1062-1090` toasts para UStVA Q1–Q4 + Einkommensteuer, verifican `tax_declarations` para no notificar lo ya declarado.
11. **vercel.json correcto** — `vercel.json:3-9` 5 funciones declaradas con maxDuration (clara 30s, resto 10s).
12. **Profile page** — IBAN/BIC, steuernummer, datos personales, editables y persistidos en `profiles` table.
13. **Signup con full_name + trigger** — Auth trigger crea `profiles` row automáticamente en signup.
14. **Loading skeletons + empty states** — Presentes en dashboard, facturas, gastos.

---

## Effort Estimate

| Categoría | Tareas | Horas |
|-----------|--------|-------|
| Blockers críticos | klaro-documentos + seed + IVA fix | **7.5h** |
| Warnings manuales | RESEND key + service key + migration 006 | **~15 min manual** |
| Warnings código | delete guard + Gemini audit + Clara limit A | **~1.5h** |
| **Para public beta** | todo lo anterior | **~9h + 15 min manual** |
| **Para lanzamiento pulido** | + Clara limit opción B + mobile sidebar | **~14h** |

---

## Build Order Recomendado (mínimo viable)

```
Hoy — ~15 min manual:
1. Vercel dashboard → confirmar/añadir RESEND_API_KEY + RESEND_FROM_EMAIL
2. Vercel dashboard → confirmar/añadir SUPABASE_SERVICE_ROLE_KEY
3. Supabase SQL editor → verificar/ejecutar migration 006

Esta semana — ~8h desarrollo:
4. [0.5h]  Fix IVA dashboard: leer is_kleinunternehmer, ocultar/recalcular tarjeta IVA
5. [15 min] Fix deleteExpense: añadir .eq('user_id', userId) en klaro-gastos.html:1135
6. [4h]    Crear klaro-documentos.html + mover script de docs de impuestos
7. [1h]    Añadir nav item "Documentos" a los 7 sidebars del app
8. [2h]    Crear supabase/seed.sql con datos demo realistas
9. [30 min] Investigar dependencia Gemini en index.html
10. [1h]   QA pass: flujo completo con cuenta demo en klaro-landing.vercel.app
```

---

## File Reference Index

| Archivo | Hallazgo clave |
|---------|---------------|
| `auth.js:10-13` | Supabase anon key en texto claro — correcto por diseño (pública) |
| `klaro-dashboard.html:1013` | IVA flat 19% — no respeta tax_rate individual ni is_kleinunternehmer ❌ |
| `klaro-dashboard.html:998-1000` | Fetches con `.eq('user_id', uid)` ✅ |
| `klaro-facturas.html:931` | `_sb.from('invoices').insert(payload)` con user_id ✅ |
| `klaro-facturas.html:1200` | Llama `/api/send-invoice` — necesita RESEND_API_KEY ⚠️ |
| `klaro-gastos.html:1122` | Insert con user_id correcto ✅ |
| `klaro-gastos.html:1135` | Delete sin `.eq('user_id', userId)` ⚠️ |
| `klaro-gastos.html:1057` | Llama `/api/analyze-receipt` — funciona si ANTHROPIC_API_KEY activa |
| `klaro-impuestos.html:821-823` | `const db = supabase.createClient(...)` — 2nd client, viola CLAUDE.md ⚠️ |
| `klaro-impuestos.html:1562-1565` | Queries EÜR con `_sb` y `user_id` ✅ |
| `klaro-clara.html:681-690` | POST a `/api/clara` con messages + userProfile + userId ✅ |
| `klaro-clara.html:664` | `_msgCount >= FREE_MSG_LIMIT` — límite localStorage-only ⚠️ |
| `vercel.json:3-9` | 5 funciones declaradas con maxDuration correcto ✅ |
| `LAUNCH_PLAN.md:7` | `klaro-documentos.html` listado como Sprint 2 — no creado ❌ |

---

*Generado por AUDIT_PRODUCT skill — Claude Code — 2026-06-01*
