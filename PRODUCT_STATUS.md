# Klaro — Product Status & Launch Plan
> Last updated: 2026-05-28 · Authored by Claude Code

---

## 1. What Klaro Is

**Klaro** is a Spanish-language fiscal assistant for Spanish-speaking freelancers living and working in Germany. The core promise: *German taxes, finally clear — in your language.*

The target user is a **Freiberufler or Gewerbetreibender** from Spain, Latin America, or any Spanish-speaking country, living in Germany, who needs to file Einkommensteuer, UStVA, and manage Betriebsausgaben — without a Gestoría and without speaking bureaucratic German.

**Core differentiator vs. every competitor:** Language. Not just translated UI — Spanish-first thinking, Spanish explanations, German tax law made human by Clara.

---

## 2. Competitive Landscape

| Product | Price | Users | Differentiator | Gap Klaro fills |
|---|---|---|---|---|
| **Accountable.de** | €9.90–€59.90/mo | 40,000+ | All-in-one: invoicing + bookkeeping + banking + AI | German-only, generic SaaS feel |
| **Wundertax.de** | Pay on submission | 1M+ customers | 17-min filing, ELSTER certified, 11+ years trust | German-only, no freelancer specialisation |
| **Taxfix.de** | €39.99 one-time | 8M+ returns, 4.6★ | Massive scale, refund avg €1,172, English available | No Spanish, no conversational AI guidance |
| **Klaro** | TBD | 0 (pre-launch) | Spanish-first · Clara AI · German tax specialist | **The only Spanish-language German tax platform** |

**Klaro's moat:** None of the above speak Spanish or have a conversational AI advisor trained specifically on German freelancer tax law. That is the wedge. The launch MVP must make that wedge felt in the first 30 seconds on the landing page.

---

## 3. Current State of the Product

### 3.1 Repository structure

```
klaro-landing/
├── index.html              ← Landing page (public)
├── login.html              ← Auth — login form
├── signup.html             ← Auth — signup form
├── klaro-dashboard.html    ← App — main dashboard
├── klaro-clara.html        ← App — Clara AI chat
├── klaro-facturas.html     ← App — Invoice manager
├── klaro-gastos.html       ← App — Expense tracker
├── klaro-impuestos.html    ← App — Tax calculator
├── klaro-profile.html      ← App — User profile
├── auth.js                 ← Shared auth guard + logout
├── api/clara.js            ← Vercel serverless → Anthropic API
├── vercel.json             ← Deployment config
└── design-system/          ← Design tokens (klaro-design skill)
```

### 3.2 Tech stack

| Layer | Tech | Status |
|---|---|---|
| Frontend | Vanilla HTML + Tailwind CDN + inline `<style>` | ✅ Working |
| Fonts | Plus Jakarta Sans (body) + Bricolage Grotesque (headlines) | ✅ |
| Auth | Supabase Auth (email + password) | ⚠️ Partial — see §4 |
| Database | Supabase (invoices, expenses, chat_messages, profiles) | ✅ Tables wired |
| Clara API | Vercel serverless `/api/clara` → Anthropic claude-haiku-4-5 | ❌ Broken — see §5 |
| Automated emails | Make.com webhook (referenced but not confirmed active) | ❌ Not working |
| Hosting | Vercel (`.vercel/project.json` present) | ✅ Deployable |
| CDN | Tailwind via CDN — unpurged, ~400KB | ⚠️ Performance debt |

---

## 4. Backend & Auth — Full Status

### 4.1 What works

- `auth.js` correctly guards all app pages — unauthenticated users are redirected to `/login.html`
- `signup.html` creates Supabase accounts with email + password
- `login.html` authenticates and sets session
- `logout()` signs out and redirects to `/login.html`
- After login, `[data-user-email]` and `[data-user-initials]` placeholders are populated in all pages

### 4.2 What is broken or missing

#### ❌ Email confirmation redirect goes to wrong URL
After signup, Supabase sends a confirmation email. When the user clicks the link, Supabase redirects to its default callback URL — **not** to `/klaro-dashboard.html`. The user lands on a blank or broken page.

**Fix:** In Supabase Dashboard → Authentication → URL Configuration:
- Set `Site URL` to your Vercel production domain (e.g. `https://klaro-landing.vercel.app`)
- Add `https://klaro-landing.vercel.app/klaro-dashboard.html` to **Redirect URLs**

#### ❌ No password reset page
There is no "Forgot password?" link on `login.html` and no `/reset-password.html` page. Users who forget their password are locked out permanently.

**Fix needed:** 
1. Add "¿Olvidaste tu contraseña?" link on `login.html`
2. Create `reset-password.html` that calls `_sb.auth.resetPasswordForEmail(email)`
3. Handle the `type=recovery` hash in Supabase's email redirect

#### ❌ Supabase email templates not customized
All auth emails (confirmation, password reset) use Supabase's default English template. For a product targeting Spanish speakers, this breaks trust immediately.

**Fix needed:** In Supabase Dashboard → Authentication → Email Templates, customize:
- **Confirmation email** — Spanish, Klaro brand colors, clear CTA
- **Password reset email** — Spanish, warm tone, Klaro signature

#### ⚠️ Make.com welcome email — status unknown
The user referenced a Make.com scenario connected to the GitHub repo. This is likely a webhook that triggers on new Supabase user creation to send a branded welcome email. Current state: **cannot confirm active**. Needs verification that:
1. Supabase webhook (Database webhooks → `auth.users` INSERT) is configured
2. Make.com scenario is active and receiving payloads
3. Email template is in Spanish and includes a direct link to the dashboard

#### ⚠️ Supabase anon key exposed in frontend
The `SUPABASE_ANON_KEY` is hardcoded in `auth.js`, `signup.html`, and `login.html`. This is **expected and acceptable** for Supabase anon keys — they are designed to be public. However, Row Level Security (RLS) policies must be correctly configured on all tables to prevent users from reading each other's data.

**Verify:** All Supabase tables (`invoices`, `expenses`, `chat_messages`, `profiles`) must have RLS enabled with `user_id = auth.uid()` policies.

---

## 5. Clara AI — Why It's Broken & How to Fix It

### Root cause

`api/clara.js` reads the Anthropic API key from `process.env.ANTHROPIC_API_KEY`. This environment variable **is not set in the Vercel project**. When the serverless function runs, it finds no key and returns `{ needsKey: true }` with status 401.

The frontend in `klaro-clara.html` interprets this as "demo mode" and stops. The yellow status dot and "Modo demo activo" message is what users see.

The modal "Add API Key" in the UI saves a key to `localStorage` — but the **backend ignores localStorage**. The frontend passes it as an `x-api-key` header, which the current `api/clara.js` does not read either. The two systems are disconnected.

### Fix — two steps

**Step 1: Set the env var in Vercel**
1. Go to Vercel → klaro-landing project → Settings → Environment Variables
2. Add: `ANTHROPIC_API_KEY` = `sk-ant-...` (your key)
3. Set scope: Production + Preview
4. Redeploy

**Step 2: Remove the confusing "API Key" modal from the UI**
Once the env var is set, the modal is unnecessary and confusing for end users. Remove the "API Key" button from `klaro-clara.html`'s header. Clara will simply work.

### Model used
`claude-haiku-4-5-20251001` — correct choice: fast, cheap, good enough for tax Q&A. Max 1024 tokens per response. Keep this.

### Supabase chat persistence
Chat history is saved to `chat_messages` table and loaded on page open. This is implemented and working — once Clara is unblocked by the env var fix.

---

## 6. Dashboard — Current State & What's Missing

### What exists
- 4 stat cards: Ingresos, Gastos, Beneficio neto, IVA pendiente
- Bar chart (Actividad económica) — 4 months visible
- Deadlines panel (Próximos vencimientos) — UStVA Q1/Q2, Einkommensteuer
- Sidebar nav: Dashboard, Facturas, Gastos, Impuestos, Clara, Perfil, Cerrar sesión
- Top bar with greeting, notification bell, "Diagnóstico fiscal" CTA

### Critical problem: all data is hardcoded
Every number on the dashboard is a static HTML string:
- `€18.100` ingresos — hardcoded
- `€990` gastos — hardcoded (though `id="stat-gastos"` exists, no script updates it)
- `€17.110` beneficio — hardcoded
- `€1.254` IVA pendiente — hardcoded
- All bar chart bars have hardcoded pixel heights (`height:95px`, `height:76px`, etc.)
- All deadline dates are hardcoded ("10 abr", "10 jul", "31 jul")

A user who signs up sees **Ana García's fake data**, not their own. This breaks trust and makes the product feel like a prototype, not a real tool.

### What the dashboard must do for MVP

| Feature | Source | Priority |
|---|---|---|
| Real ingresos total | SUM of `invoices` table where `status = paid` | P0 |
| Real gastos total | SUM of `expenses` table for current user | P0 |
| Beneficio neto | Computed: ingresos − gastos | P0 |
| IVA pendiente | Computed from invoices (19% of uninvoiced VAT) or static estimate | P1 |
| Bar chart — real monthly data | GROUP BY month from invoices + expenses | P1 |
| Tax deadlines — dynamic dates | Static array of German fiscal deadlines (same for all users) | P1 |
| User name in greeting | From Supabase `profiles` table or email prefix | P0 |
| Empty state | When user has no invoices or expenses yet | P0 |

### Empty state (critical for new users)
Right now a new user with zero data sees Ana García's numbers. The dashboard must detect an empty account and show an onboarding prompt:
```
"Todavía no hay datos — empieza añadiendo tu primera factura o gasto."
[+ Nueva factura]  [+ Añadir gasto]
```

---

## 7. Landing Page — Current State & What's Missing

### What exists
- Hero with sun/scroll animation, Bricolage Grotesque headlines
- Pain section (dark background, 4 pain cards)
- Clara demo section (static chat mockup)
- Proof strip (persona photos)
- Testimonials
- Pricing section

### What is missing

| Missing | Priority | Why |
|---|---|---|
| **Footer** | P0 | No legal links, no imprint, no socials — legally required in Germany |
| **Imprint / Impressum page** | P0 | §5 TMG + DSGVO required for any German-facing website |
| **FAQ section** | P1 | Freelancers have pre-signup questions: "Is my data safe?", "What taxes exactly?", "Do I need ELSTER?", "How much does it cost?" |
| **Live Clara demo on landing** | P1 | Current chat widget is purely visual — chips do nothing. A keyword-based demo (no API) would show Clara's value before signup |
| **OG / Twitter card image** | P1 | No `og:image` → link unfurls blank on WhatsApp, Telegram, LinkedIn |
| **Mobile nav on landing** | P1 | Current pill nav has no hamburger for mobile |

---

## 8. Launch Checklist

### 🔴 Blocking — must be done before any public sharing

- [ ] **Set `ANTHROPIC_API_KEY` in Vercel** → Clara works
- [ ] **Configure Supabase redirect URLs** → email confirmation lands on dashboard
- [ ] **Create `reset-password.html`** → users can recover accounts
- [ ] **Add "Forgot password?" to login.html**
- [ ] **Verify RLS policies** on all Supabase tables
- [ ] **Fix dashboard empty state** → new users don't see fake data
- [ ] **Connect dashboard stats to real Supabase data** (ingresos, gastos, beneficio)
- [ ] **Add footer to `index.html`** with imprint link, socials, copyright
- [ ] **Create `imprint.html`** with Impressum + Datenschutzerklärung (German law)

### 🟡 Important — needed for a credible launch

- [ ] **Customize Supabase email templates** (Spanish, Klaro brand)
- [ ] **Verify/activate Make.com welcome email** scenario
- [ ] **Remove "API Key" modal** from klaro-clara.html (confuses end users)
- [ ] **Connect bar chart to real data** (GROUP BY month from Supabase)
- [ ] **Dynamic tax deadlines** (calculate from current date, same for all users)
- [ ] **FAQ section on landing page**
- [ ] **Live keyword demo on landing** Clara widget
- [ ] **OG image** for link previews
- [ ] **Fix user greeting** — use real name/email, not "Ana García"

### 🟢 Nice to have — post-launch v1.1

- [ ] Onboarding flow after first signup (step-by-step: add first invoice, understand dashboard)
- [ ] Notifications (bell icon currently decorative)
- [ ] Settings / Configuración page (currently linked but does not exist)
- [ ] Tailwind CDN → compiled/purged CSS (performance)
- [ ] Keyboard accessibility + WCAG AA audit
- [ ] Error and loading states across all app pages

---

## 9. Recommended Build Order

This is the fastest path from current state to a product you can share with real users:

### Sprint 1 — Make it work (2–3 days)
1. Set Anthropic API key in Vercel → Clara lives
2. Fix Supabase redirect URLs + reset password page → auth is complete
3. Fix dashboard: connect stats to real data + empty state
4. Fix "Ana García" hardcoded name → real user data

### Sprint 2 — Make it trustworthy (2–3 days)
5. Add footer + imprint page to landing
6. Customize Supabase email templates (Spanish)
7. Verify Make.com welcome email
8. Remove API Key modal from Clara page
9. OG image

### Sprint 3 — Make it convert (3–4 days)
10. Live Clara demo on landing page (keyword-based)
11. FAQ section on landing
12. Onboarding empty state on dashboard
13. Dynamic deadlines on dashboard + Clara page

**Target launch: Sprint 1 + Sprint 2 complete = product ready to share privately with first 10–20 beta users.**

---

## 10. The Differentiator to Protect

Against Accountable (40k users), Wundertax (1M users), and Taxfix (8M returns), Klaro cannot win on scale or ELSTER certification in the short term. It wins on **language + empathy + specificity**.

Every word in the product — from Clara's first greeting to the error messages — must feel like a smart friend who happens to know German tax law and speaks your language. That is the moat. It must be defended in every screen, every email, every empty state.

The Spanish-speaking freelancer in Germany is a real, underserved, and growing segment. Klaro is the first product built specifically for them. The launch goal is not perfection — it is to get 50 real users in the app, see what Clara gets asked, and iterate fast.

---

*This document should be updated after each sprint. When a section is resolved, mark it done and note the date.*
