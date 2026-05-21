# CLAUDE.md — Project Constitution
# klaro-landing-00

> **Protocol:** B.L.A.S.T. | **Build:** A.N.T. 3-layer
> **Status:** PHASE B — BLUEPRINT (incomplete)
> **Last updated:** 2026-05-21

---

## 1. North Star

> _To be defined in Phase B, Q1._

---

## 2. B.L.A.S.T. Phase Outputs

### Phase B — Blueprint

| Item | Value |
|------|-------|
| North Star | TBD |
| Integrations | TBD |
| Source of Truth | TBD |
| Delivery Payload | TBD |
| Behavioral Rules | TBD |

### Phase L — Link

| Service | Endpoint | Status |
|---------|----------|--------|
| TBD | — | ⏳ |

### Phase A — Architect

> SOPs live in `/architecture/`. List files here once created.

### Phase S — Stylize

> Payload format and delivery confirmed here.

### Phase T — Trigger

| Trigger | Mechanism | Frequency |
|---------|-----------|-----------|
| TBD | — | — |

---

## 3. Data Schema

> **CODING DOES NOT BEGIN UNTIL THIS IS CONFIRMED.**

### Input Shape

```json
{
  // TBD — awaiting Phase B answers
}
```

### Output / Payload Shape

```json
{
  // TBD — awaiting Phase B answers
}
```

---

## 4. Behavioral Rules

> To be filled from Phase B, Q5.

- Must-dos: TBD
- Must-not-dos: TBD
- Refusal triggers: TBD
- Tone: TBD

---

## 5. Architectural Invariants

- All credentials live in `.env` only — never hardcoded
- All intermediate files route through `/.tmp/`
- SOPs in `/architecture/` are updated before code in `/execution/`
- Every output ships with a verify command or test
- Broken link in Phase L = full halt

---

## 6. Trigger & Maintenance

> To be filled in Phase T.

### Automation

> TBD

### Self-Annealing Repair Protocol

When anything fails:
1. Read the error — do not guess
2. Patch the script in `/execution/`
3. Verify the fix
4. Write the lesson into the relevant `/architecture/` SOP

---

## 7. File Map

```
klaro-landing-00/
├── CLAUDE.md              ← This file (Project Constitution)
├── .env                   ← Credentials (never committed)
├── memory/
│   ├── task_plan.md       ← Phases, goals, checklists
│   ├── findings.md        ← Research, discoveries, constraints
│   ├── progress.md        ← Done, errors, test results
│   └── decisions.md       ← Architectural choices + reasoning
├── architecture/          ← Layer A: SOPs
├── execution/             ← Layer T: Deterministic scripts
└── .tmp/                  ← Ephemeral workbench
```
