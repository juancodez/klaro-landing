# Klaro — Product Brief for Engineering
**From:** Juani · Product Designer & Product Manager  
**To:** Claude Code · Head of Engineering  
**Version:** 1.0 · May 2026

---

## Who I Am and What We're Building Together

Hey. I'm Juani, the product designer and PM on this project. My job is to define what we build, why we build it, and what it needs to feel like. Your job is to turn that into production-grade code. This document is the source of truth for everything we need to build Klaro.

I'll be working with you iteratively — short cycles, fast feedback, no big-bang releases. Think of this as an ongoing conversation where I bring the product decisions and you bring the implementation.

---

## What Is Klaro?

Klaro is an AI-powered fiscal advisory app for **Spanish-speaking freelancers and expats living in Germany**.

The German tax system is notoriously complex — and doing it entirely in a foreign language makes it worse. Our users aren't tax experts. They're designers, developers, consultants, and entrepreneurs who moved to Germany and now face a system they don't understand, in a language they don't fully speak.

Klaro solves this by providing:
1. A personalized fiscal profile built from a diagnostic conversation
2. An AI advisor named **Clara** who explains everything in plain Spanish
3. Deadline tracking and reminders for German tax obligations
4. Contextual guidance replacing (or reducing dependence on) a human Steuerberater

**The core emotional promise:** "You're not alone in this. Clara has you covered."

---

## The Problem We're Solving

Spanish-speaking freelancers in Germany face three simultaneous pain points:

- **They don't know what deductions they can claim** — home office, equipment, software, health insurance (Rürup), etc.
- **They're afraid of making errors** with the Finanzamt — penalties, audits, wrong declarations
- **They can't navigate the German** — letters from the Finanzamt, tax forms, legal terminology

Research finding worth noting: **more time spent on tax prep did not correlate with more confidence**. Effort alone doesn't solve the problem. Guided, personalized, reassuring UX does.

---

## Primary Users

Four validated user profiles from our research:

| Persona | Profile | Key Pain |
|---|---|---|
| **Ana García** | Freiberufler, designer, Berlin, 2 years in DE | Doesn't know if she's declaring correctly |
| **Carlos Mendoza** | Consultant, Munich, recently self-employed | Overwhelmed by paperwork, no idea where to start |
| **Laura** | Developer, Hamburg, EU clients | Concerned about cross-border VAT obligations |
| **José** | Freelancer, Frankfurt, 4+ years in DE | Paying a Steuerberater €800/year, wants out |

---

## Competitive Reference

### Accountable (main competitor)
- Tax management app for freelancers in Germany, Austria, Belgium
- Has income/expense tracking, VAT declarations, tax estimation
- Recently added an AI tax advisor — **but gated behind premium tiers**
- **Critical gap: zero Spanish-language support**
- Their AI advisor feels like a chatbot add-on, not the core product

### What Klaro Does Differently
- **Clara is the product, not a premium upsell.** She's present from the first interaction
- **Spanish-first, always.** Not a translation layer — the entire experience is designed in Spanish
- **Personalized from day one** via the Diagnóstico agent — no generic tips
- **Emotionally intelligent** — designed to feel like a trusted advisor, not a tax form

---

## Architecture Overview

Klaro runs on a **multi-agent AI pipeline** with three specialized agents and an orchestrator:

```
User Input
    │
    ▼
┌─────────────────┐
│   ORCHESTRATOR  │  ← coordinates the pipeline, passes context
└────────┬────────┘
         │
    ┌────▼────┐
    │ Agent 1 │  DIAGNÓSTICO
    │         │  Builds the user's fiscal profile from onboarding answers
    │         │  Output: structured JSON profile
    └────┬────┘
         │
    ┌────▼────┐
    │ Agent 2 │  VALIDADOR
    │         │  Checks the profile for fiscal inconsistencies and risks
    │         │  Output: validated profile + list of alerts
    └────┬────┘
         │
    ┌────▼────┐
    │ Agent 3 │  CLARA
    │         │  Conversational AI advisor
    │         │  Receives enriched context (profile + validation)
    │         │  Responds in Spanish, with personalized guidance
    └─────────┘
```

The Orchestrator is not an AI agent — it's pure code that coordinates when and how to call each agent, handles errors, and passes context downstream.

---

## Core Features to Build

### 1. Onboarding & Diagnóstico Flow
The first time a user opens Klaro, they go through a diagnostic conversation — not a boring form.

Questions cover:
- Type of freelancer: Freiberufler (§18 EStG) or Gewerbetreibender (§15 EStG)
- Time since starting self-employment
- Annual income range (relevant for Kleinunternehmerregelung threshold: €22,000)
- Whether they have a Steuernummer
- Client base: Germany only, EU, or non-EU
- Primary activity (UX design, programming, consulting, etc.)

Output: a `fiscal_profile` JSON object stored in the user's Supabase record.

### 2. Clara — The Conversational AI Advisor
The main interface of the app. A chat UI where users can:
- Ask anything about German taxes in Spanish
- Get explanations of forms, deadlines, and concepts
- Receive proactive suggestions based on their profile
- Ask about specific letters from the Finanzamt

Clara receives the full enriched context (profile + validation alerts) on every session. She never asks questions the Diagnóstico already answered.

Key behaviors:
- Always responds in Spanish
- Explains German terms inline (e.g., "la Umsatzsteuervoranmeldung, que es básicamente tu declaración periódica de IVA...")
- Flags urgency when appropriate (missing Steuernummer, upcoming deadlines)
- Never overpromises — she's an advisor, not a licensed Steuerberaterin

### 3. Fiscal Deadlines Engine
Tracks and notifies users of German tax deadlines based on their profile:

| Declaration | Trigger | Frequency |
|---|---|---|
| UStVA (Umsatzsteuervoranmeldung) | If not Kleinunternehmer | Monthly or quarterly |
| Einkommensteuererklärung | All users | Annual (deadline: July 31) |
| EÜR (Einnahmenüberschussrechnung) | All self-employed | Annual |
| Gewerbesteuer | Gewerbetreibender only | Annual |

Deadline notifications via in-app + (future phase) Gmail + Google Calendar integration.

### 4. Fiscal Profile Dashboard
A summary screen showing the user's current fiscal status:
- Profile type (Freiberufler / Gewerbetreibender / Kleinunternehmer)
- Active tax obligations
- Upcoming deadlines with countdown
- Any open alerts from the Validador agent

### 5. Conversation History
All Clara conversations are saved per user in Supabase. Users can scroll back, search, and reference previous exchanges. This is important for trust — users need to feel their context is remembered.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend (web) | Next.js 14, App Router, TypeScript, Tailwind CSS |
| Frontend (mobile) | React Native, Expo Go, NativeWind, React Navigation |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| AI / Agents | Anthropic API — `claude-sonnet-4-20250514` |
| State (mobile) | AsyncStorage |
| Auth | Supabase Auth |

Directory: `~/users/klaro-web/`

---

## Supabase Data Model (Core Tables)

```sql
-- User fiscal profile (output of Diagnóstico agent)
CREATE TABLE fiscal_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  tipo_autonomo TEXT, -- 'Freiberufler' | 'Gewerbetreibender'
  inicio_actividad TEXT,
  ingresos_anuales TEXT,
  clientes_extranjero TEXT,
  tiene_steuernummer BOOLEAN,
  actividad TEXT,
  is_kleinunternehmer BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clara conversation history
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  role TEXT NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fiscal deadlines per user
CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL, -- 'UStVA' | 'Einkommensteuer' | 'EÜR'
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'completed' | 'overdue'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Brand & Visual Identity

| Token | Value |
|---|---|
| Primary orange | `#E8622A` |
| Amber | `#FFB830` |
| Navy | `#1A1D2E` |
| Cream (background) | `#FFF8F0` |
| Heading font | DM Serif Display |
| Body font | DM Sans |

The visual tone is warm, trustworthy, and slightly premium — not the cold minimalism of generic fintech. Think: a knowledgeable friend who happens to know German tax law, not a government portal.

---

## What We're NOT Building (Yet)

- Bank account integration (Accountable's core — we'll revisit post-MVP)
- Invoice generation
- Direct submission to ELSTER (German tax authority's e-filing system)
- Multi-country support
- English language version

---

## Build Order

1. Supabase schema + auth setup
2. Diagnóstico agent + onboarding flow
3. Validador agent
4. Clara conversational interface
5. Deadlines engine
6. Profile dashboard
7. Mobile (React Native) version

We build sequentially. No parallel tracks until the core pipeline is solid.

---

## How We Work

- I'll bring product decisions and design direction — you execute
- Short cycles: build → review → iterate
- When something's ambiguous, ask. Don't assume
- All documentation goes to Notion
- Code lives in GitHub

Let's build it.

---

*Juani · Product Designer & PM · Klaro*  
*Berlin, May 2026*
