# Klaro — Launch Plan: Public Beta Sprint
**Branch:** main | **Goal:** Fix 7 blockers, ship public beta
**Audit source:** PRODUCT_STATUS.md (2026-06-01, score: 6.5/10)
**Stack:** Static HTML + Tailwind CDN + Supabase + Vercel Serverless (no build step)

---

## Scope: What This Plan Ships

This plan covers the gap between current state (closed beta ready) and public beta launch. It does NOT cover P1/P2 roadmap features.

### Sprint 1 — Immediate (today, ~2h)
1. Run `supabase/migrations/006_invoices_cancelled.sql` in Supabase SQL Editor
2. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel env vars
3. Add `RESEND_API_KEY` + `RESEND_FROM_EMAIL` to Vercel env vars
4. Fill `imprint.html` placeholders with real legal data
5. Fix `klaro-profile.html` — remove demo `value="Ana"` etc. from input HTML
6. Update `CLAUDE.md` env vars table with 3 missing variables

### Sprint 2 — This week (~7h)
7. Build `klaro-documentos.html` (spec: `SPRINT4_CODEX.md`)
8. Add Documentos nav item to all 7 app sidebars
9. Add `send-invoice` + `analyze-receipt` to `vercel.json` functions with maxDuration
10. Fix `klaro-impuestos.html` — remove hardcoded `€1.254,50` from timeline, set progress bar to `width:0%`
11. Hide API key modal in `klaro-clara.html`

### Sprint 3 — Polish (~3h)
12. Make dashboard deadline dates dynamic (not hardcoded `2026-04-10`)
13. Document or mock Gemini API dependency on `index.html`
14. Run `/qa` against live Vercel URL end-to-end

---

## Key Technical Decisions

### klaro-documentos.html
- Copy sidebar + head from `klaro-gastos.html` exactly
- Use existing `documents` table + Supabase Storage bucket
- Drop zone + file list + filter by type (`factura|recibo|carta_finanzamt|declaracion|otro`)
- Status badges: pendiente / clasificado / verificado
- No new API routes needed — pure client-side Supabase JS

### SUPABASE_SERVICE_ROLE_KEY
- Used server-side ONLY in `api/clara.js`, `api/tasks.js`, `api/declarations.js`
- Never exposed to browser
- Clara silently degrades to generic responses without it

### Invoice email (RESEND)
- `api/send-invoice.js` complete — HTML email template, input validation, Kleinunternehmer §19 notice
- Only needs `RESEND_API_KEY` + `RESEND_FROM_EMAIL` in Vercel
- Frontend already calls `/api/send-invoice` on "Enviar Factura" click

---

## Out of Scope (this sprint)

- OCR / document classification (P1)
- Clara embedded in workflows (P1)
- ELSTER pre-fill (P2)
- Bank sync (P2)
- Multi-currency (P2)

---

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale |
|---|-------|----------|----------------|-----------|-----------|
| 1 | CEO | Promote impuestos €1.254,50 to blocker | Mechanical | P1 | Trust-killer for fiscal tool; Eng confirms already fixed |
| 2 | CEO | Cut CLAUDE.md env update from sprint | Mechanical | P3 | Zero user impact; developer housekeeping |
| 3 | CEO | Cut dynamic deadline dates from beta scope | Mechanical | P3 | No user impact before 2027 |
| 4 | CEO | Flag imprint as owner dependency pre-Sprint1 | Mechanical | P5 | Explicit dependency; dev can't unblock it |
| 5 | Eng | Shrink Sprint 1 — profile + impuestos already fixed | Mechanical | P3 | Read actual code, confirmed fixed |
| 6 | Eng | vercel.json timeout capped at 10s on Hobby plan | Taste | P5 | User must confirm plan tier |
| 7 | Eng | clara.html: remove no-key-banner + dead modal JS | Mechanical | P5 | Null-ref error in prod; simplest fix = delete |
| 8 | Eng | Migration 006: check constraint name before DROP | Mechanical | P3 | Non-standard name = silent no-op risk |
