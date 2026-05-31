# Klaro — Product Status Report
Date: 2026-06-01
Auditor: Claude Code (AUDIT_PRODUCT skill)

---

## Launch Readiness: 7.5 / 10

Core app is functional: auth, facturas, gastos, dashboard KPIs, and Clara are all wired to real Supabase data with proper loading/empty states. Two things block a clean portfolio demo — the EÜR annual calculator (Spec 07) is still a static card, and a false "ELSTER Certificado / Garantía 10.000€" marketing claim must be removed before any real user sees it.

---

## Feature Status Table

| Feature | Status | Note | Est. Effort |
|---------|--------|------|-------------|
| Auth + signup trigger | ✅ | profiles auto-created, session guard on all pages | — |
| Dashboard KPIs (live) | ✅ | real invoices + expenses, skeleton, empty state | — |
| Facturas CRUD | ✅ | full CRUD, status cycling, PDF export, toast | — |
| Gastos CRUD | ✅ | full CRUD, receipt upload, category filter, skeleton | — |
| Clara AI | ✅ | real Anthropic API, cold-start retry fixed | — |
| UStVA quarterly calc | ✅ | per-invoice tax_rate, Kleinunternehmer flag | — |
| Seed data | ✅ | 21 invoices, 33 expenses, 3 tasks live in Supabase | — |
| EÜR annual calculator | ❌ | static hardcoded card — no real calculation | 4–6h |
| Wrong storage bucket | ❌ | `klaro-documents` doesn't exist → uploads fail silently | 5min |
| False ELSTER claim | ❌ | misleading copy must be removed before launch | 10min |
| Tasks priority sort | ⚠️ | alphabetic sort puts red (urgent) tasks last | 5min |
| IVA estimate flat 19% | ⚠️ | dashboard ignores Reverse Charge / 0% invoices | 30min |
| Gastos save error alert | ⚠️ | uses browser alert() instead of toast | 5min |
| Supabase re-init | ⚠️ | klaro-impuestos.html creates a second client | 15min |

---

## ❌ Critical Blockers

### 1. EÜR / Einkommensteuer calculator — not implemented
**File:** `klaro-impuestos.html:354–390`
What exists is a **hardcoded static card**: "Einkommensteuer 2025 · Pendiente · 106 días · 31 julio 2026". No real calculation. No Grundfreibetrag. No profit from real data. Spec 07 calls for a year selector, real Supabase fetch, profit/loss calculation, and tax estimate.
**Fix:** Implement Spec 07 — build prompt in `klaro-vibe-plan.md` Phase 9 → PROMPT 7.
**Effort:** 4–6h

### 2. Wrong storage bucket name
**File:** `klaro-impuestos.html:733`
```js
const BUCKET = 'klaro-documents'; // bucket does not exist
```
Actual Supabase Storage bucket is named `documents`. Any document upload or download in this page silently fails with a storage 404.
**Fix:** Change `'klaro-documents'` → `'documents'` on line 733.
**Effort:** 2 minutes

### 3. False marketing copy — ELSTER / Garantía claim
**File:** `klaro-impuestos.html:392–410`
The "Garantía Klaro" card claims:
- "Cubrimos errores hasta **10.000 €**" — no such guarantee exists
- "Conexión cifrada con ELSTER" — no ELSTER integration in the product
- Badge: **"ELSTER Certificado"** — false certification

Legally problematic and factually wrong. Must go before any user sees this page.
**Fix:** Replace with accurate copy: "Datos protegidos con cifrado SSL. Klaro es una herramienta de apoyo — no envía datos automáticamente al Finanzamt."
**Effort:** 10 minutes

---

## ⚠️ Warnings

### 1. Task priority sort is backwards
**File:** `api/tasks.js:27`
```js
.order('priority', { ascending: true }) // code comment admits: "red < amber < green alphabetically"
```
Alphabetically: `amber` → `green` → `red`. Urgent (red) tasks appear **last** on the dashboard.
**Fix:** Delete line 27 entirely — sort by `due_date` only (already on line 28).
**Effort:** 2 minutes + deploy

### 2. Dashboard IVA estimate uses flat 19%
**File:** `klaro-dashboard.html:1109`
```js
const ivaPendiente = Math.max(0, totalIngresos * 0.19 - totalGastos * 0.19);
```
Ignores per-invoice `tax_rate`. Reverse Charge invoices (0% — e.g. Contentful Ltd in seed data) inflate the estimate. UStVA page correctly uses `i.tax_rate` per invoice.
**Fix:** Include `tax_rate` in the invoices select and sum `i.amount * (i.tax_rate/100)` per invoice.
**Effort:** 30 minutes

### 3. Gastos save error uses `alert()` instead of toast
**File:** `klaro-gastos.html:781`
```js
if (error) { alert('Error al guardar: ' + error.message); return; }
```
Every other error in this file uses `showToast()`. Breaks UX consistency.
**Fix:** `showToast('Error al guardar: ' + error.message, 'error');`
**Effort:** 5 minutes

### 4. klaro-impuestos.html re-initializes Supabase
**File:** `klaro-impuestos.html:730–732`
```js
const db = supabase.createClient(_SUPA_URL, _SUPA_KEY); // violates CLAUDE.md
```
Should reuse `_sb` from `auth.js`. Works but creates a second client and wastes memory.
**Fix:** Remove lines 730–732, rename all `db.` → `_sb.` throughout the file.
**Effort:** 15 minutes

### 5. Hardcoded countdown in Einkommensteuer card
**File:** `klaro-impuestos.html:365`
```html
<p class="text-xl font-extrabold">106 días</p>
```
Static. Wrong immediately. Should calculate dynamically from today to `new Date(year+1, 6, 31)`.
**Effort:** 10 minutes

---

## ✅ Already Working

1. **Auth trigger** — `handle_new_user()` creates `profiles` row on signup. Applied and verified via Supabase MCP.
2. **Dashboard KPIs** — `stat-ingresos/gastos/beneficio` from real Supabase queries. Skeleton at lines 499–501. Empty state banner at line 83.
3. **Facturas CRUD** — `loadInvoices()` at line 648, insert at 830, status cycling at 843, delete at 858. Skeleton + empty state + toast all present.
4. **Gastos CRUD** — `loadExpenses()` at line 587, receipt upload at line 774, empty state with category-aware message at lines 619–623.
5. **Clara AI** — `api/clara.js` complete. `checkApiConnection()` uses 12s timeout + 1 retry for cold starts (`klaro-clara.html:471`).
6. **UStVA quarterly calc** — `calcQ()` at `klaro-impuestos.html:1345` correctly uses `i.tax_rate` and zeroes IVA for Kleinunternehmer.
7. **API env vars** — all 3 API files use `SUPABASE_SERVICE_ROLE_KEY` consistently.
8. **vercel.json** — all 3 routes declared. `clara.js` has `maxDuration: 30`.
9. **Seed data** — 21 invoices (2025–2026), 33 expenses (6 categories), 3 tasks. Live in Supabase as of 2026-06-01.
10. **Profile page** — reads/writes `profiles` table. Fiscal profile saved to `user_profiles`.
11. **Nav active states** — sidebar `klaro-active` class set. Mobile nav uses `data-nav` + `pathname.includes()`.

---

## Prioritized Fix Order

1. `klaro-impuestos.html:733` — bucket name (2 min) **do this now**
2. `klaro-impuestos.html:392` — remove false ELSTER/Garantía card (10 min) **do this now**
3. `api/tasks.js:27` — delete bad priority sort line (2 min) **do this now**
4. `klaro-gastos.html:781` — alert → showToast (5 min) **do this now**
5. Spec 07 EÜR calculator — build from vibe-plan PROMPT 7 (4–6h) **next big session**
6. Dashboard IVA flat 19% — use per-invoice tax_rate (30 min)
7. `klaro-impuestos.html:730–732` — remove second Supabase client (15 min)
8. Spec 08 Polish + QA pass across all pages

---

## File Reference Index

| File | Key findings |
|------|-------------|
| `klaro-impuestos.html:354` | ❌ Hardcoded Einkommensteuer card — no real calculation |
| `klaro-impuestos.html:392` | ❌ False ELSTER / Garantía 10.000€ claim — remove |
| `klaro-impuestos.html:733` | ❌ `BUCKET = 'klaro-documents'` — bucket doesn't exist |
| `klaro-impuestos.html:730` | ⚠️ Second Supabase client init — use `_sb` |
| `klaro-impuestos.html:365` | ⚠️ Hardcoded "106 días" — should be dynamic |
| `klaro-dashboard.html:1109` | ⚠️ Flat 19% IVA — ignores per-invoice tax_rate |
| `klaro-gastos.html:781` | ⚠️ `alert()` on save error — use `showToast()` |
| `api/tasks.js:27` | ⚠️ Priority sort alphabetic — red tasks appear last |
| `api/clara.js` | ✅ Complete — API key, system prompt, persistence |
| `api/declarations.js` | ✅ Auth guard + RLS pattern correct |
| `klaro-facturas.html` | ✅ Full CRUD, skeleton, toast, PDF |
| `klaro-gastos.html` | ✅ Full CRUD, skeleton, receipt upload |
| `klaro-dashboard.html` | ✅ Live KPIs, bar chart, tasks, skeleton |
| `klaro-clara.html` | ✅ Real API, 12s timeout, retry logic |
| `auth.js` | ✅ Shared client, auth guard, profile fill |
| `vercel.json` | ✅ All routes declared, durations set |
| `supabase/seed.sql` | ✅ 21 invoices, 33 expenses, 3 tasks |
