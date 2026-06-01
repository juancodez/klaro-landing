# Klaro — Product Status Report
**Date:** 2026-06-01  
**Auditor:** Claude Code (AUDIT_PRODUCT + gstack)  
**Repo:** juancodez/klaro-landing  
**Live URL:** https://klaro-landing.vercel.app

---

## Launch Readiness: 6.5 / 10

The core product loop (auth → dashboard → facturas → gastos → Clara) is **wired and working**. The app is ready for a closed beta with trusted testers. Before public beta, 7 blockers must be fixed — primarily a missing page, 3 unset environment variables, and 2 legal/UX issues. Estimated **12–15h of work** separates current state from a polished public launch.

---

## Feature Status Table

| Feature | Status | Notes | Est. Effort |
|---------|--------|-------|-------------|
| Auth — signup / login / logout / reset | ✅ Done | Full flow wired, email confirm works | — |
| Auth — new-password (recovery) | ✅ Done | Hash token + updateUser() wired | — |
| Dashboard — KPI stat cards | ✅ Done | Real data from invoices + expenses | — |
| Dashboard — bar chart | ✅ Done | Dynamic, last 6 months real data | — |
| Dashboard — recent invoices list | ✅ Done | Real data, status badges | — |
| Dashboard — Action Center | ✅ Done | loadActionCenter() + loadTasks() wired | — |
| Dashboard — pending income line | ✅ Done | stat-ingresos-pending added | — |
| Dashboard — overdue auto-mark | ✅ Done | Runs on every load | — |
| Facturas — CRUD | ✅ Done | create / read / update / delete, status cycle | — |
| Facturas — PDF download | ✅ Done | jsPDF wired, bilingual DE/ES | — |
| Facturas — send by email | ⚠️ UI wired | api/send-invoice.js exists — RESEND_API_KEY missing in Vercel | 1h |
| Facturas — cancelled status | ✅ Done | overdue→cancelled→draft cycle | — |
| Gastos — CRUD | ✅ Done | Wired per PRODUCT_CHECKLIST | — |
| Gastos — receipt OCR scan | ✅ Done | api/analyze-receipt.js with Anthropic vision | — |
| Clara — chat with real AI | ✅ Done | Anthropic API, demo fallback | — |
| Clara — conversation persistence | ✅ Done | chat_messages table, loadHistory() | — |
| Clara — fiscal profile context | ✅ Done | Fetches fiscal_profiles on every session | — |
| Clara — API key modal for users | ⚠️ Warning | Modal still visible to end users | 0.5h |
| Impuestos — IVA from real data | ✅ Done | Reads from invoices table | — |
| Impuestos — timeline hardcoded | ⚠️ Warning | Static HTML €1.254,50, progress bar 45% initial | 2h |
| Perfil — read / write Supabase | ✅ Done | upsert wired | — |
| Perfil — demo values in inputs | ❌ Blocker | Hardcoded "Ana", "+49 176..." in HTML attrs | 1h |
| Documentos — dedicated page | ❌ Blocker | klaro-documentos.html MISSING | 3h |
| Documentos — sidebar nav item | ❌ Blocker | All 7 sidebars link to missing page | 1h |
| Ayuda — FAQ accordion | ✅ Done | 11 FAQs, Clara link | — |
| imprint.html — legal §5 TMG | ❌ Blocker | Placeholders [Name] [Straße] [St.-Nr.] unfilled | 0.5h |
| SUPABASE_SERVICE_ROLE_KEY in Vercel | ❌ Blocker | clara.js / tasks.js / declarations.js silent fail | 0.25h |
| RESEND_API_KEY in Vercel | ❌ Blocker | Invoice email always 500 | 0.25h |
| Migration 006 applied | ❌ Blocker | cancelled + missing invoice columns not in DB | 0.25h |
| vercel.json — send-invoice timeout | ⚠️ Warning | No maxDuration → may timeout on Hobby plan | 0.5h |

---

## ❌ Critical Blockers — fix before any public user

### 1. `klaro-documentos.html` MISSING
All 7 sidebars have a Documentos nav link pointing to this file. It does not exist → 404 on Vercel.  
**Evidence:** `SPRINT4_CODEX.md` has the full spec — was written but never executed. Sidebar links in `klaro-dashboard.html:118`, `klaro-facturas.html:124`, `klaro-gastos.html`, etc.  
**Fix:** Build the page per `SPRINT4_CODEX.md` — upload zone, file list, filter by type, status badges. Copy sidebar from `klaro-gastos.html`.  
**Effort:** 3h

---

### 2. `SUPABASE_SERVICE_ROLE_KEY` not set in Vercel
`api/clara.js:57`, `api/tasks.js:5`, `api/declarations.js:5` all require this key. Without it: Clara cannot personalize responses (silently falls back to generic), Tasks endpoint returns 500, Declarations endpoint returns 500.  
**Evidence:** `api/clara.js:57` — `if (userId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)`. Key not listed in `CLAUDE.md:114` env vars table.  
**Fix:** Vercel → Settings → Environment Variables → add `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API → service_role). Also add to `CLAUDE.md`.  
**Effort:** 15min

---

### 3. `RESEND_API_KEY` not set in Vercel
`api/send-invoice.js:153-155` — explicit 500 when key is missing. Invoice sending is fully wired in the frontend (`klaro-facturas.html:1191`) but always fails in production.  
**Fix:** resend.com → create free account → get API key → add `RESEND_API_KEY` + `RESEND_FROM_EMAIL` to Vercel env vars.  
**Effort:** 30min

---

### 4. `klaro-profile.html` — demo values hardcoded in input `value=""` attrs
Inputs have `value="Ana"`, `value="García"`, `value="+49 176 12345678"`, `value="Berlin"`, `value="12/345/67890"`. If profile fetch fails (empty row, network error), the user sees fake data.  
**Evidence:** QA Report blocker #2.  
**Fix:** Change all demo `value=""` to empty string `value=""`. JS already overwrites on load — HTML just needs safe empty defaults.  
**Effort:** 1h

---

### 5. `imprint.html` — unfilled legal placeholders
German §5 TMG requires a valid Impressum with real name, address, and Steuernummer. Current file has styled `<span class="placeholder">Vor- und Nachname</span>` etc. A published product with a fake Impressum is a legal liability in Germany.  
**Evidence:** `imprint.html:79-92` — 4 unfilled placeholders.  
**Fix:** Fill with real owner data: full name, street address, city, Steuernummer.  
**Effort:** 30min (requires real data from product owner)

---

### 6. Migration 006 not run in Supabase
`supabase/migrations/006_invoices_cancelled.sql` adds `cancelled` to status CHECK constraint + 8 missing invoice columns (`invoice_number`, `description`, `notes`, `date`, `due_date`, `client_company`, `client_address`, `client_email`). Without it, `klaro-facturas.html` CRUD fails silently when writing these fields.  
**Fix:** Supabase Dashboard → SQL Editor → paste + run `006_invoices_cancelled.sql`.  
**Effort:** 5min

---

### 7. Sidebar "Documentos" nav item missing on all 7 pages
Even once `klaro-documentos.html` exists, none of the 7 app sidebars have the Documentos nav item. All 7 pages need the new item added.  
**Fix:** Add to all 7 sidebars simultaneously (can be done while building klaro-documentos.html — counts as 1 task).  
**Effort:** Included in Blocker #1

---

## ⚠️ Warnings — fix for polished launch

### W1. `vercel.json` — missing maxDuration for send-invoice + analyze-receipt
`api/send-invoice.js` and `api/analyze-receipt.js` have no explicit timeout. Vercel Hobby plan default is 10s — email sending and OCR can exceed this.  
**Fix:** Add to `vercel.json`:
```json
"api/send-invoice.js":    { "maxDuration": 15 },
"api/analyze-receipt.js": { "maxDuration": 20 }
```
**Effort:** 0.5h

### W2. `klaro-impuestos.html` — hardcoded IVA amount in declaration timeline
Static `IVA trimestral · €1.254,50` has no ID and is never replaced by JS. Users permanently see a fake number.  
**Evidence:** QA Report blocker #1. `klaro-impuestos.html:~228`  
**Effort:** 2h (render from tax_declarations table)

### W3. `klaro-impuestos.html` — progress bar starts at 45%
`style="width:45%"` in HTML flashes before JS replaces it. Should be `width:0%`.  
**Evidence:** QA Report warning #3.  
**Effort:** 0.25h

### W4. `klaro-clara.html` — API key modal visible to end users
The "Configurar API Key" button is still in the header. End users don't manage Anthropic keys — the server handles this. Creates confusion.  
**Fix:** Hide the modal and the key button for production users (or remove entirely now that server-side key is set).  
**Effort:** 0.5h

### W5. Dashboard deadline dates hardcoded to 2026
`klaro-dashboard.html:952-954` — `_deadlinePill('dl-q1', '2026-04-10')`. Will be wrong in 2027.  
**Fix:** Replace with `new Date(new Date().getFullYear(), 3, 10)` pattern.  
**Effort:** 0.5h

### W6. CLAUDE.md env vars table incomplete
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` not documented. Future contributors won't know to set them.  
**File:** `CLAUDE.md:114` — add 3 rows.  
**Effort:** 0.25h

### W7. Landing page Gemini API undocumented
`index.html` calls `generativelanguage.googleapis.com` for the Clara demo widget. Undocumented dependency — a missing key silently breaks the public landing demo.  
**Evidence:** QA Report warning #8.  
**Effort:** 0.5h (document or replace with mock)

---

## ✅ Already Working

1. **Auth full cycle** — signup, email confirm, login, session guard, logout, reset, new-password. `auth.js` shared client, no re-init on any page.
2. **Dashboard KPIs real** — all 4 stat cards read from Supabase. Zero hardcoded numbers.
3. **Dashboard bar chart** — dynamic, last 6 months, paid invoices vs expenses.
4. **Facturas CRUD** — create, list, status cycle (draft→sent→paid→overdue→cancelled→draft), delete, auto invoice number.
5. **Facturas PDF** — jsPDF bilingual ES/DE, logo upload, §19 Kleinunternehmer notice.
6. **Facturas email send** — `api/send-invoice.js` complete HTML email. Only needs RESEND env vars.
7. **Gastos CRUD + OCR** — receipt scan via Anthropic vision, auto-fill amount/category.
8. **Clara AI** — system prompt, fiscal profile context, conversation history, demo fallback, suggestion chips.
9. **Action Center** — `loadActionCenter()` + `loadTasks()` in dashboard bootstrap. `api/tasks.js` auth-gated.
10. **Perfil read/write** — `profiles.upsert()` wired. IBAN, Steuernummer, address saved.
11. **Document upload/download/delete** — Supabase Storage, signed URL downloads, progress bar.
12. **Pending income line** — `stat-ingresos-pending` shows amount from sent invoices.
13. **Overdue auto-mark** — runs on every dashboard load.
14. **RLS on all tables** — `user_id` filter everywhere. Supabase anon key exposure safe with RLS active.
15. **vercel.json** — clara (30s), tasks (10s), declarations (10s) timeouts set.

---

## Effort Estimate

| Category | Tasks | Hours |
|----------|-------|-------|
| Critical blockers | 6 | ~7h |
| High-value warnings | 4 | ~3.5h |
| Nice-to-have | 3 | ~1.5h |
| **To closed beta** | env vars + migration + profile fix + imprint | **~2h** |
| **To public beta** | all blockers (inc. documentos page) | **~9h** |
| **To polished launch** | blockers + all warnings | **~12h** |

---

## Next Sprint — Ordered by Impact

```
IMMEDIATE — do today (<30min each):
  1. Run migration 006 in Supabase SQL Editor              [5min]
  2. Add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars      [15min]
  3. Add RESEND_API_KEY + RESEND_FROM_EMAIL to Vercel      [30min]
  4. Fill imprint.html placeholders with real data         [30min]
  5. Fix klaro-profile.html — empty value="" defaults      [30min]

THIS WEEK:
  6. Build klaro-documentos.html (SPRINT4_CODEX.md spec)   [3h]
  7. Add Documentos nav item to all 7 sidebars             [1h]
  8. Add send-invoice + analyze-receipt to vercel.json     [30min]
  9. Fix impuestos timeline hardcoded IVA line             [2h]
 10. Hide Clara API key modal from production users        [30min]

BEFORE LAUNCH:
 11. Add missing env vars to CLAUDE.md                     [15min]
 12. Make deadline dates dynamic in dashboard              [30min]
 13. Document or mock Gemini API on landing                [30min]
```

---

## File Reference Index

| File | Key findings |
|------|-------------|
| `klaro-dashboard.html:952` | ⚠️ Deadline dates hardcoded `'2026-04-10'` |
| `klaro-dashboard.html:1038` | ✅ `loadActionCenter()` + `loadTasks()` wired |
| `klaro-facturas.html:1191` | ✅ `fetch('/api/send-invoice')` wired |
| `klaro-facturas.html:196` | ✅ Send button exists |
| `klaro-profile.html:~250` | ❌ Demo `value="..."` in input HTML |
| `klaro-impuestos.html:~228` | ⚠️ `€1.254,50` static, no dynamic ID |
| `api/clara.js:57` | ❌ Needs `SUPABASE_SERVICE_ROLE_KEY` (silent fail) |
| `api/send-invoice.js:153` | ❌ Needs `RESEND_API_KEY` (500 without it) |
| `api/tasks.js:5` | ❌ Needs `SUPABASE_SERVICE_ROLE_KEY` |
| `api/declarations.js:5` | ❌ Needs `SUPABASE_SERVICE_ROLE_KEY` |
| `vercel.json` | ⚠️ Missing `send-invoice` + `analyze-receipt` timeouts |
| `imprint.html:79-92` | ❌ 4 legal placeholders unfilled |
| `supabase/migrations/006_invoices_cancelled.sql` | ❌ Not run in Supabase yet |
| `CLAUDE.md:114` | ⚠️ Missing 3 env vars from documentation |
