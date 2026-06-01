# Klaro — Product Status Report
**Date:** 2026-06-01
**Auditor:** Claude Code (AUDIT_PRODUCT skill)
**Commit:** latest · Branch: main
**Live URL:** https://klaro-landing.vercel.app

---

## Launch Readiness: 8.5 / 10

The core product loop works end-to-end: auth, dashboard with real data, facturas CRUD + PDF + email, gastos + OCR, Clara AI with personalization, document upload, and message limit. The only remaining blocker is `imprint.html` — unfilled legal data required by German law (§5 TMG). Everything else is wired.

---

## Feature Status Table

| Feature | Status | Notes | Est. Effort |
|---------|--------|-------|-------------|
| Auth (signup / login / logout / reset) | ✅ | Full flow, email confirm, new-password | — |
| Auth guard on all 8 app pages | ✅ | auth.js loaded correctly everywhere | — |
| Dashboard — real KPI stat cards | ✅ | invoices + expenses from Supabase | — |
| Dashboard — bar chart dynamic | ✅ | `_renderChart()` from real data | — |
| Dashboard — Action Center | ✅ | `loadActionCenter()` + `loadTasks()` | — |
| Dashboard — recent invoices list | ✅ | Dynamic, status badges | — |
| Dashboard — overdue auto-mark | ✅ | Runs on every load | — |
| Dashboard — pending income line | ✅ | `stat-ingresos-pending` | — |
| Facturas — CRUD complete | ✅ | create/list/status-cycle/delete | — |
| Facturas — PDF download | ✅ | jsPDF bilingual ES/DE | — |
| Facturas — email send | ✅ | `/api/send-invoice` + Resend | — |
| Facturas — cancelled status | ✅ | overdue→cancelled→draft cycle | — |
| Gastos — CRUD complete | ✅ | create/list/delete | — |
| Gastos — receipt OCR | ✅ | `/api/analyze-receipt` + Anthropic vision | — |
| Documentos — page + upload | ✅ | drag-drop, filter, download, delete | — |
| Documentos — nav in all sidebars | ✅ | 9/9 pages | — |
| Clara — real AI responses | ✅ (fixed) | Bug fixed: timeouts no longer lock to demo | — |
| Clara — fiscal profile personalization | ✅ | API fetches profiles + injects into prompt | — |
| Clara — conversation persistence | ✅ | `chat_messages` table | — |
| Clara — 5 free messages limit | ✅ | Counter UI + upgrade prompt | — |
| Impuestos — IVA from real data | ✅ | Queries from invoices/expenses | — |
| Perfil — read/write Supabase | ✅ | `profiles.upsert()` wired | — |
| Ayuda — FAQ accordion | ✅ | 20 items, Clara CTA | — |
| Help icon question mark | ✅ (fixed) | Circle dot, 9 files | — |
| vercel.json — all 5 APIs with timeouts | ✅ | clara:30s, others:10s | — |
| imprint.html — legal §5 TMG | ❌ BLOCKER | Placeholders unfilled | Owner |
| SUPABASE_URL in Preview env | ⚠️ | Only Production+Development, not Preview | 5min |
| SUPABASE_SERVICE_ROLE_KEY in Preview env | ⚠️ | Same | 5min |
| CLAUDE.md env vars table | ⚠️ | Missing SUPABASE_SERVICE_ROLE_KEY, RESEND_* | 10min |

---

## ❌ Critical Blockers

### 1. `imprint.html` — legal placeholders unfilled
German §5 TMG requires a valid Impressum before any public user can access the product. Current file shows `Vor- und Nachname`, `Straße und Hausnummer`, `XX/XXX/XXXXX` as placeholders.

**File:** `imprint.html:79-102`
**Fix:** Owner fills in real name, address, Steuernummer, Finanzamt.
**Effort:** 10 minutes (owner task, no code change)

---

## ⚠️ Warnings (fix for polished launch)

### W1. Clara status indicator shows "Iniciando..." on cold start
`checkApiConnection` shows a connecting state for up to 15 seconds on Vercel cold start. Fixed bug where timeouts locked to demo mode — now `useRealApi` stays `null` during timeouts so `sendMessage` always tries the real API. Visual feedback could be improved with a loading animation.
**File:** `klaro-clara.html:523-543`
**Effort:** 0.5h

### W2. `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` missing from Preview env
Vercel Preview deployments (PRs) would fail for `tasks.js`, `declarations.js`, `clara.js`.
**Fix:** Vercel → Settings → Environment Variables → add both for Preview.
**Effort:** 5 minutes

### W3. `CLAUDE.md` env vars table incomplete
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` not documented.
**File:** `CLAUDE.md:114`
**Effort:** 5 minutes

### W4. Dashboard y-axis chart labels start at €6k
Before data loads, chart shows €6k/€4k/€2k/€0 placeholders. Dynamic IDs (y1/y2/y3) exist and get updated by `_renderChart()`, but the flash before load is visible.
**File:** `klaro-dashboard.html:559-562`
**Effort:** 0.25h (set initial values to `—`)

---

## ✅ Already Working (44 checks)

1. **Auth full cycle** — signup, email confirm, login, redirect, logout, reset, new-password
2. **Auth guard** — `_PUBLIC_PAGES` prevents redirect-loop; 8/8 protected pages guarded
3. **No Supabase re-init** — `_sb` from auth.js reused everywhere, zero re-initializations
4. **No hardcoded user data** — "Ana García", "€18.100", "€17.110" absent from all HTML
5. **Dashboard KPIs real** — 4 Supabase queries, stat cards initialize with `—`
6. **Facturas CRUD** — insert/update/delete/list with invoice_number auto-gen
7. **Facturas PDF** — jsPDF + §19 Kleinunternehmer + bilingual ES/DE
8. **Facturas email** — Resend integration complete, HTML template professional
9. **Gastos CRUD + OCR** — Anthropic vision parses receipts, auto-fills category
10. **Clara real AI** — Anthropic `claude-haiku-4-5-20251001`, 1024 max_tokens
11. **Clara personalization** — fetches `profiles` + `fiscal_profiles` → injects into system prompt
12. **Clara message limit** — 5 free messages, counter UI, upgrade prompt, syncs with Supabase history
13. **Clara persistence** — `chat_messages` insert server-side (non-blocking)
14. **Documentos** — Supabase Storage upload/download/delete, signed URLs, filter tabs
15. **Documentos nav** — 9/9 sidebars have Documentos link
16. **Impuestos IVA** — dynamic from invoices/expenses, quarterly logic
17. **Action Center** — `loadTasks()` from `api/tasks.js` (auth-gated)
18. **vercel.json** — all 5 functions registered with appropriate timeouts
19. **API guards** — tasks + declarations: 503 if missing env, 401 if no token, 401 if bad token
20. **CORS** — `Allow-Origin: *` on all API endpoints
21. **Overdue auto-mark** — dashboard bootstrap marks sent+past-due invoices
22. **Help icon** — question mark dot fixed in 9 files
23. **Documentos empty state** — filter-aware messages
24. **Migration 006** — executed, invoices table has all required columns

---

## Effort Estimate

| Category | Tasks | Hours |
|----------|-------|-------|
| Critical blockers | 1 | Owner task (0h code) |
| High-value warnings | 2 | ~0.5h |
| Nice-to-have | 2 | ~0.5h |
| **To production launch** | imprint only | **Owner fills 5 fields** |
| **To polished launch** | + warnings | **~1h** |

---

## What Was Fixed This Session

| Bug | File | Fix |
|-----|------|-----|
| Clara locked to demo after cold-start timeout | `klaro-clara.html:523` | Timeouts keep `useRealApi=null`; 3 retries instead of 1 |
| Clara `useRealApi=false` on first timeout | `klaro-clara.html:532` | Removed `useRealApi=false` from catch block |
| Help icon question mark invisible | 9 HTML files | `<line x1="12.01">` → `<circle cx="12" cy="17" r="1">` |
| `tasks.js`/`declarations.js` FUNCTION_INVOCATION_FAILED | `api/tasks.js`, `api/declarations.js` | Moved `createClient` inside handler with env guard |

---

## File Reference Index

| File | Key findings |
|------|-------------|
| `klaro-clara.html:386` | `useRealApi = null` — correct initial state |
| `klaro-clara.html:523` | Catch block: timeouts no longer set `useRealApi=false` |
| `klaro-clara.html:671` | `if (useRealApi !== false)` — tries API when null or confirmed true |
| `api/clara.js:42` | `hasKey: !!process.env.ANTHROPIC_API_KEY` — health check |
| `api/clara.js:57-65` | Fiscal profile fetch from Supabase → injects into system prompt |
| `api/clara.js:121` | Returns `{ content: data.content[0] }` — matches frontend expectation |
| `imprint.html:79-102` | ❌ 5 legal placeholders unfilled |
| `CLAUDE.md:114` | ⚠️ Missing 3 env vars from documentation |
| `vercel.json` | ✅ All 5 functions registered |
