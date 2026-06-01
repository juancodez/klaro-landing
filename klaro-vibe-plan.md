# Klaro Dashboard — Vibe Plan
**Generated:** 2026-06-01  
**Project:** klaro-landing (juancodez/klaro-landing)  
**Deployed:** https://klaro-landing.vercel.app  
**Supabase:** rhyobhcgvrqobouqymqr  
**Goal:** Functional MVP dashboard — portfolio-first, real product second

---

## Diagnosis (current state)

| Area | Status | Notes |
|------|--------|-------|
| Auth | ✅ Working | Supabase auth + session guard via auth.js |
| DB Schema | ✅ Exists | invoices, expenses, fiscal_profiles, tasks, tax_declarations, documents, chat_messages — all with RLS |
| DB Data | ❌ Empty | 0 rows in invoices, expenses, tasks (1 row in fiscal_profiles) |
| Dashboard KPIs | ❌ Hardcoded | Stats + bar chart are fake HTML |
| Facturas UI | ⚠️ Unknown | UI exists, Supabase wiring unverified |
| Gastos UI | ⚠️ Unknown | UI exists, Supabase wiring unverified |
| Clara AI | ⚠️ Blocked | api/clara.js complete — blocked by missing ANTHROPIC_API_KEY in Vercel |
| Impuestos | ❌ Fake | No EÜR calculation from real data |
| Documents | ⚠️ Partial | 3 rows in DB, no file upload UI |

---

## Phase 2 — Executive Plan

```markdown
# Klaro — Executive Plan

## The Problem
Spanish-speaking freelancers in Germany have no fiscal tool in their language.
ELSTER is in German. Tax advisors cost €200/hour. Deadlines are missed.

## The Solution
Klaro is a fiscal dashboard: track invoices and expenses, compute
EÜR profit, estimate taxes, get deadlines, and ask Clara (AI advisor)
in Spanish — all in one static app backed by Supabase.

## Target User
Latin American or Spanish freelancer (Freiberufler), 1–5 years in Germany,
using ELSTER for the first time, no German tax advisor, mid-level income.

## Core Features (MVP)
1. Auth — register, login, session, logout
2. Facturas — create/edit/delete invoices linked to real user
3. Gastos — create/edit/delete deductible expenses
4. Dashboard — live KPIs (income, expenses, profit) + monthly chart
5. Clara AI — Spanish tax advisor with fiscal profile context

## Differentiator
Only fiscal tool for German freelancers fully in Spanish, with
context-aware AI advisor that knows the user's tax type and income range.

## Out of Scope (v1)
- Direct ELSTER submission
- PDF invoice generation
- Bank sync
- VAT return automation
- Multi-user / accountant access
```

---

## Phase 3 — Technical Plan

### Feature 1: Auth (verify only)
- **Frontend:** login.html, signup.html, reset.html, new-password.html, auth.js
- **Backend:** Supabase Auth + email confirmation templates
- **DB:** auth.users + profiles + fiscal_profiles
- **Gap:** profiles table has 0 rows — need auto-insert trigger on signup

### Feature 2: Facturas CRUD
- **Frontend:** klaro-facturas.html — form + list
- **Backend:** Direct Supabase client calls (RLS protects rows)
- **DB:** invoices (client_name, amount, tax_rate, status, date, due_date)
- **Gap:** Invoice number auto-generation (KL-2026-001 format), status update on overdue
- **Edge cases:** Kleinunternehmer = tax_rate 0, foreign clients = Reverse Charge

### Feature 3: Gastos CRUD
- **Frontend:** klaro-gastos.html — form + list with category filter
- **Backend:** Direct Supabase client calls
- **DB:** expenses (amount, category, date, receipt_url)
- **Gap:** deductible_percent column missing, receipt_url upload not wired
- **Dependencies:** None

### Feature 4: Dashboard KPIs (core gap)
- **Frontend:** klaro-dashboard.html — stat cards + bar chart + deadline list
- **Computed:**
  ```
  total_income   = SUM(invoices.amount WHERE status != 'draft')
  total_expenses = SUM(expenses.amount)
  gross_profit   = total_income - total_expenses
  monthly_data   = GROUP BY month(date) → income + expenses per month
  ```
- **DB:** Reads from invoices + expenses + tasks (no new tables)
- **Gap:** Bar chart must replace hardcoded data with computed monthly arrays
- **Dependencies:** Features 2 + 3 must exist (data) and Feature 6 (seed)

### Feature 5: Clara AI
- **Frontend:** klaro-clara.html + api/clara.js Vercel serverless
- **Backend:** Anthropic claude-haiku-4-5 via /api/clara — code COMPLETE
- **DB:** chat_messages — persist conversations
- **Gap:** ANTHROPIC_API_KEY missing from Vercel env — only blocker
- **Dependencies:** Auth (userId injected into system prompt)

### Feature 6: Seed Data
- **What:** Script inserting realistic invoices + expenses for demo user (2025–2026)
- **Why:** Portfolio demo needs live data, not empty state
- **Output:** 12 months invoices (€3k–€8k/month) + categorized expenses + tasks
- **How:** supabase/seed.sql

### Feature 7: Impuestos Calculator
- **Frontend:** klaro-impuestos.html — EÜR summary + Einkommensteuer estimate
- **Tax logic:**
  ```
  profit = income - expenses
  grundfreibetrag_2026 = 12,096 €
  taxable = max(0, profit - grundfreibetrag_2026)
  estimated_tax = progressive_rate(taxable)
  ```
- **Dependencies:** Features 2 + 3 + fiscal_profiles (Kleinunternehmer flag)

---

## Phase 4 — Build Order

```
1. Auth trigger fix        — profiles auto-insert on signup (no dependencies)
2. Gastos CRUD             — wire klaro-gastos.html to Supabase
3. Facturas CRUD           — wire klaro-facturas.html to Supabase
4. Seed data               — insert realistic demo data
5. Dashboard KPIs          — replace hardcoded stats with real queries (requires 2+3+4)
6. Clara activation        — ANTHROPIC_API_KEY to Vercel env (requires deploy access)
7. Impuestos calculator    — EÜR from real data (requires 2+3+4)
8. Polish + QA             — empty states, loading skeletons, error toasts across all pages
```

---

## Phase 5 — Spec Files

### `docs/specs/01-auth-trigger.md`

**Goal:** Auto-insert profiles row on signup.

**Acceptance Criteria:**
- [ ] Signup creates profiles row with id = user.id
- [ ] profiles.full_name from user_metadata
- [ ] auth.js data-user-name shows name not email for new users
- [ ] Idempotent (ON CONFLICT DO NOTHING)

**Migration:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**DO NOT:** Add this logic to auth.js frontend — DB trigger is the correct layer.

---

### `docs/specs/02-gastos-crud.md`

**Goal:** Add, view, filter, delete expenses from klaro-gastos.html → Supabase expenses table.

**Acceptance Criteria:**
- [ ] Add expense form saves to Supabase with correct user_id
- [ ] List loads from Supabase on page open
- [ ] Category filter works (Todos / Software / Oficina / Viajes / etc.)
- [ ] Delete removes from DB and UI immediately
- [ ] Empty state when 0 expenses
- [ ] Loading skeleton during fetch
- [ ] Toast on save + delete

**Categories (EÜR-aligned):**
Software & Tools | Oficina / Homeoffice | Marketing | Suscripciones | Viajes | Formación | Cuotas y tasas | Otros gastos

**Supabase pattern:**
```js
// Load
const { data } = await _sb.from('expenses')
  .select('*').eq('user_id', userId).order('date', { ascending: false });
// Insert
await _sb.from('expenses').insert({ user_id: userId, amount, category, description, date });
// Delete
await _sb.from('expenses').delete().eq('id', id).eq('user_id', userId);
```

**DO NOT:** Receipt upload, deductible_percent column.

---

### `docs/specs/03-facturas-crud.md`

**Goal:** Create, view, update status, delete invoices → Supabase invoices table.

**Acceptance Criteria:**
- [ ] New invoice saves with auto-generated invoice_number (KL-YYYY-NNN)
- [ ] List loads from Supabase on page open
- [ ] Status cycles: draft → sent → paid
- [ ] Overdue badge: due_date < today AND status != paid
- [ ] Delete removes from DB and UI
- [ ] Kleinunternehmer: tax_rate locked to 0
- [ ] Empty state + loading skeleton

**Invoice number generation:**
```js
const count = await _sb.from('invoices').select('id', { count: 'exact' }).eq('user_id', userId);
const next = String((count.count || 0) + 1).padStart(3, '0');
const invoice_number = `KL-${new Date().getFullYear()}-${next}`;
```

**DO NOT:** PDF generation, client address book.

---

### `docs/specs/04-seed-data.md`

**Goal:** Realistic demo data — 12+ invoices, 20+ expenses, 3 tasks for demo user.

**Acceptance Criteria:**
- [ ] 12+ invoices across 2025–2026 (paid/sent/overdue mix)
- [ ] Expenses across 6+ categories
- [ ] Monthly income €3,500–€7,500 range
- [ ] 3 open tasks in tasks table
- [ ] Idempotent SQL (ON CONFLICT DO NOTHING)

**Delivery:** `supabase/seed.sql` — run in Supabase dashboard SQL editor after replacing UUID.

**DO NOT:** Seed production users. Use real names or tax numbers.

---

### `docs/specs/05-dashboard-kpis.md`

**Goal:** Replace all hardcoded stats, bar chart, deadline list in klaro-dashboard.html with real Supabase data.

**Acceptance Criteria:**
- [ ] Stat cards: real total_income, total_expenses, gross_profit for current year
- [ ] Bar chart: computed monthly income + expenses arrays
- [ ] Recent invoices: last 5 from DB
- [ ] Deadline list: open tasks from tasks table
- [ ] Empty state banner hidden when data exists
- [ ] Loading skeletons before data arrives

**Core queries:**
```js
const year = new Date().getFullYear();
const { data: invoices } = await _sb.from('invoices')
  .select('amount, date, status, client_name').eq('user_id', userId)
  .neq('status', 'draft').gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
const { data: expenses } = await _sb.from('expenses')
  .select('amount, date, category').eq('user_id', userId)
  .gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
const total_income   = invoices.reduce((s, i) => s + Number(i.amount), 0);
const total_expenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
const profit         = total_income - total_expenses;
```

**DO NOT:** Server-side aggregation function, year selector UI, design changes.

---

### `docs/specs/06-clara-activation.md`

**Goal:** Add ANTHROPIC_API_KEY to Vercel — Clara works immediately, zero code changes.

**Acceptance Criteria:**
- [ ] Messages in klaro-clara.html get real AI responses (not demo fallback)
- [ ] Chat history persists to chat_messages table
- [ ] No API key exposed in frontend

**Action:** Vercel dashboard → klaro-landing → Settings → Environment Variables:
- `ANTHROPIC_API_KEY` = sk-ant-...
- `SUPABASE_URL` = https://rhyobhcgvrqobouqymqr.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` = (Supabase dashboard → Settings → API)

**DO NOT:** Add any key to HTML or auth.js. Expose service role key to frontend.

---

### `docs/specs/07-impuestos-calculator.md`

**Goal:** klaro-impuestos.html shows real EÜR summary + simplified Einkommensteuer estimate from Supabase data.

**Acceptance Criteria:**
- [ ] Year selector (2024 / 2025 / 2026)
- [ ] Fetch invoices + expenses for selected year
- [ ] Show: income, expenses, profit, Grundfreibetrag, taxable income, estimated tax
- [ ] Kleinunternehmer note if is_kleinunternehmer = true
- [ ] Export button copies EÜR text to clipboard
- [ ] "Estimación aproximada" disclaimer always visible

**Tax logic 2026:**
```js
const PARAMS = {
  2026: { grundfreibetrag: 12096 },
  2025: { grundfreibetrag: 11784 },
  2024: { grundfreibetrag: 11604 },
};
function estimateEinkommensteuer(profit, year = 2026) {
  const zvE = Math.max(0, profit - PARAMS[year].grundfreibetrag);
  if (zvE <= 0) return 0;
  if (zvE <= 8000)  return zvE * 0.14;
  if (zvE <= 55000) return zvE * 0.24;
  if (zvE <= 265000) return zvE * 0.42;
  return zvE * 0.45;
}
```

**Export format:**
```
Einnahmenüberschussrechnung {year}
Betriebseinnahmen:  €{income}
Betriebsausgaben:   €{expenses}
Gewinn/Überschuss:  €{profit}
```

**DO NOT:** ELSTER submission, Kirchensteuer, Solidaritätszuschlag, label as exact.

---

## Phase 6 — Project Structure

```
klaro-landing/
├── CLAUDE.md                        ← UPDATE (replace placeholder)
├── AGENTS.md                        ← CREATE
├── auth.js                          ← EXISTS ✅
├── index.html                       ← EXISTS ✅
├── login.html / signup.html         ← EXISTS ✅
├── klaro-dashboard.html             ← MODIFY (spec 05)
├── klaro-facturas.html              ← MODIFY (spec 03)
├── klaro-gastos.html                ← MODIFY (spec 02)
├── klaro-impuestos.html             ← MODIFY (spec 07)
├── klaro-clara.html                 ← VERIFY (spec 06)
├── api/
│   ├── clara.js                     ← EXISTS ✅
│   ├── declarations.js              ← EXISTS ✅
│   └── tasks.js                     ← EXISTS ✅
├── docs/
│   └── specs/
│       ├── 01-auth-trigger.md
│       ├── 02-gastos-crud.md
│       ├── 03-facturas-crud.md
│       ├── 04-seed-data.md
│       ├── 05-dashboard-kpis.md
│       ├── 06-clara-activation.md
│       └── 07-impuestos-calculator.md
└── supabase/
    ├── seed.sql                     ← CREATE (spec 04)
    └── migrations/
        └── 001-auth-trigger.sql     ← CREATE (spec 01)
```

---

## Phase 7 — CLAUDE.md

```markdown
# CLAUDE.md — Klaro Landing

## Stack
- Static HTML + Tailwind CDN (no build step)
- Supabase JS CDN for auth + DB
- Vercel serverless functions in /api/ (Node.js)
- Anthropic claude-haiku-4-5 for Clara

## Project IDs
- Supabase: rhyobhcgvrqobouqymqr
- Vercel: klaro-landing

## Critical Rules
- NEVER hardcode Supabase URL or anon key — already in auth.js, reuse `_sb`
- NEVER put service role key in frontend — Vercel env vars only
- NEVER run npm commands without permission
- ALWAYS use `_sb` (from auth.js) for all Supabase queries in HTML pages
- ALWAYS read relevant spec in docs/specs/ before modifying a page
- ALWAYS show loading skeleton before data arrives — no blank flash
- ALWAYS handle empty state (0 rows) — never assume data exists
- No TypeScript — plain JS only
- No frameworks — plain HTML + inline scripts

## Auth Pattern
Protected pages have `<script src="auth.js"></script>`.
Get userId: session.user.id from onAuthStateChange.

## RLS Rule
All tables have RLS. Every query MUST include `.eq('user_id', userId)`.

## Design Tokens
Orange: #a43700 | Cream: #fff8f1 | Dark: #1e1b17 | Muted: #594139
Soft: #e0bfb4 | BG: #f4ede5 | Font: Plus Jakarta Sans
```

---

## Phase 8 — AGENTS.md

```markdown
# AGENTS.md — Klaro

## Rule
Context-only. Do NOT write files or run tools. Read, analyze, advise.

---

## supabase-agent
**Expertise:** Schema, RLS, anon vs service key, migrations
**Activate when:** DB query bugs, RLS issues, migration design
**Read:** auth.js, relevant HTML, supabase/migrations/

## tax-logic-agent
**Expertise:** German EÜR, Kleinunternehmer, Grundfreibetrag, UStVA
**Activate when:** Impuestos calculator, Clara system prompt updates
**Read:** docs/specs/07-impuestos-calculator.md, api/clara.js

## frontend-agent
**Expertise:** Vanilla JS DOM, Tailwind, async fetch, loading states
**Activate when:** Complex UI state (loading + error + empty + data), chart rendering
**Read:** klaro-dashboard.html, relevant spec

## security-agent
**Expertise:** Client-side key exposure, RLS bypass, OWASP A01-A03
**Activate when:** Auth tokens, API keys, user data handling
**Read:** auth.js, api/clara.js, relevant HTML
```

---

## Phase 9 — Build Prompts (copy one by one, in order)

---

**PROMPT 1: Auth Trigger**
```
Read docs/specs/01-auth-trigger.md completely.

Create supabase/migrations/001-auth-trigger.sql with the SQL trigger
that auto-inserts a profiles row on new user signup. Must be idempotent.

After writing, print the exact SQL so I can paste it into the Supabase
SQL editor. Do not modify any HTML or JS. Confirm acceptance criteria.
```

---

**PROMPT 2: Gastos CRUD**
```
Read docs/specs/02-gastos-crud.md completely.

Audit klaro-gastos.html: find all hardcoded expense rows or fake data.
Replace with Supabase queries using the existing `_sb` client from auth.js.
Implement: load on page open, insert on form submit, delete on click.
Add loading skeleton and empty state matching existing design tokens.

No receipt upload. No new CSS files. Confirm all acceptance criteria.
```

---

**PROMPT 3: Facturas CRUD**
```
Read docs/specs/03-facturas-crud.md completely.

Audit klaro-facturas.html: find hardcoded invoice rows.
Wire to Supabase: load, insert with auto-generated invoice_number,
status update on click, delete.
Check fiscal_profiles.is_kleinunternehmer → lock tax_rate=0 if true.
Add loading skeleton and empty state.

No PDF. No client address book. Confirm all acceptance criteria.
```

---

**PROMPT 4: Seed Data**
```
Read docs/specs/04-seed-data.md completely.

Create supabase/seed.sql with realistic invoices and expenses.
Use placeholder comment where UUID goes: -- REPLACE: demo user UUID
Include: 12+ invoices (2025–2026, mixed statuses), 20+ expenses (6+ categories),
3 open tasks. SQL must be idempotent (ON CONFLICT DO NOTHING).

Print instructions for running in Supabase SQL editor. Do not run it yourself.
```

---

**PROMPT 5: Dashboard Live KPIs**
```
Read docs/specs/05-dashboard-kpis.md completely.

Audit klaro-dashboard.html: find all hardcoded stat values and chart data.
Replace with real Supabase queries (invoices + expenses for current year).
Compute: total_income, total_expenses, profit, monthly_breakdown.
Render bar chart with computed data using existing .bar CSS classes.
Show last 5 invoices in recent section. Load open tasks into deadline list.
Show loading skeletons. Show empty state banner only when 0 data.

No year selector. No design changes. Confirm all acceptance criteria.
```

---

**PROMPT 6: Clara Activation**
```
Read docs/specs/06-clara-activation.md completely.

Do NOT modify api/clara.js — it is complete.

Audit klaro-clara.html:
1. Verify it calls /api/clara with { messages, userId }
2. Verify userId comes from session (not hardcoded)
3. Verify demo fallback only triggers when API returns needsKey:true

Print the exact list of Vercel environment variables I need to add manually.
Do not put any key in any file. Confirm what needs to be done.
```

---

**PROMPT 7: Impuestos Calculator**
```
Read docs/specs/07-impuestos-calculator.md completely.

Audit klaro-impuestos.html: find hardcoded tax numbers.
Implement: year selector, fetch invoices + expenses from Supabase,
compute profit, estimate Einkommensteuer using bracket function from spec,
Kleinunternehmer note if applicable, clipboard export button.

Always show "estimación aproximada — no es asesoría fiscal oficial" disclaimer.
No Kirchensteuer. No Solidaritätszuschlag. Confirm all acceptance criteria.
```

---

**PROMPT 8: Polish + QA Pass**
```
Audit all 5 inner app pages:
klaro-dashboard.html, klaro-facturas.html, klaro-gastos.html,
klaro-impuestos.html, klaro-clara.html

Check each for:
1. Loading skeleton shown before data arrives (no blank flash)
2. Empty state when 0 rows (not broken UI)
3. Error toast when Supabase query fails (not silent failure)
4. Sidebar nav-active class set for current page
5. data-user-name / data-user-initials populated from session

Fix every issue. No new features. Report findings page by page.
```

---

## Phase 10 — Handoff Summary

```
# Vibe Plan Complete — Klaro Dashboard

## Artifacts to create
- [ ] supabase/migrations/001-auth-trigger.sql
- [ ] supabase/seed.sql
- [ ] docs/specs/ (7 spec files)
- [ ] CLAUDE.md (replace existing placeholder)
- [ ] AGENTS.md (create)

## Build order
1. Auth trigger SQL
2. Gastos CRUD
3. Facturas CRUD
4. Seed data
5. Dashboard KPIs
6. Clara activation (Vercel env var — fastest win, do this NOW)
7. Impuestos calculator
8. Polish + QA pass

## Fastest win
Add ANTHROPIC_API_KEY to Vercel → Clara works immediately.
No code changes. 2 minutes. Do it before anything else.

## Then start Prompt 1 in Claude Code.
```

---

*Plan generated by /vibe-plan on 2026-06-01*
