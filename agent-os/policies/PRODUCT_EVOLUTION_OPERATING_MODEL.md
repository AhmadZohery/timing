# PRODUCT EVOLUTION OPERATING MODEL (PM-07)
**Governance Standard:** Google Antigravity Native Adaptation  
**Squad:** Product Evolution, Growth, Intelligence & Innovation  
**System:** Midmar LifeOS Multi-Agent Enterprise Operating System V2  
**Authority:** PM-07 Lead & Human Project Owner (Ahmad)

---

## 1. Mission & Philosophy

The Product Evolution Organization transforms Midmar LifeOS from a static task tracker into a living, continuously adapting operating system. Its mandate is **disciplined, evidence-backed innovation** rather than feature creep.

Every proposed evolution must strengthen Midmar's unique core value proposition: **A local-first, distraction-free life and faith operating system combining modern cognitive productivity with classical Islamic rhythm.**

---

## 2. The Six Continuous Signal Streams

Signals are empirical observations gathered from internal and external sources:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE 6 SIGNAL STREAMS                            │
├────┬─────────────────────────────┬─────────────────────────────────────┤
│ 1  │ User Behavior & Friction    │ Aggregated local friction points,   │
│    │                             │ station drop-offs, abandoned tasks  │
├────┼─────────────────────────────┼─────────────────────────────────────┤
│ 2  │ Competitive & Market Shifts │ Moves by Tarteel, Muslim Pro,       │
│    │                             │ TickTick, Forest, Duolingo, Anki    │
├────┼─────────────────────────────┼─────────────────────────────────────┤
│ 3  │ Tech & Platform Advances    │ WebAssembly audio, PWA badges,      │
│    │                             │ Dexie v12, React 19 compiler        │
├────┼─────────────────────────────┼─────────────────────────────────────┤
│ 4  │ Spiritual & Cultural Rhythm │ Seasonal shifts (Ramadan, Hajj),    │
│    │                             │ prayer calculation edge-cases       │
├────┼─────────────────────────────┼─────────────────────────────────────┤
│ 5  │ Codebase Health Signals     │ Storage quota warnings, sync debt,  │
│    │                             │ bundle weight, test flake           │
├────┼─────────────────────────────┼─────────────────────────────────────┤
│ 6  │ Human Owner Directives      │ Strategic intuitions, long-term     │
│    │                             │ vision from Ahmad (Owner)           │
└────┴─────────────────────────────┴─────────────────────────────────────┘
```

---

## 3. The Signal-to-Opportunity Pipeline

```
 [Raw Signals] (product-evolution/signals.jsonl)
       │
       ▼
 [Synthesized Insights] (product-evolution/insights.jsonl)
       │
       ▼
 [Watchlist Curation] (product-evolution/watchlist.jsonl)
       │
       ▼
 [Opportunity Development Pack] (product-evolution/opportunities/OPP-XXXX.md)
       │
       ├─ Art Director Review
       ├─ System Architect Review
       ├─ Security Review
       └─ "Why Now" Gate
       │
       ▼
 [Owner Decision & RFC Conversion] (agent-os/rfcs/RFC-XXXX.md)
```

1. **Signals:** Logged continuously in append-only JSONL format (`SIG-XXXX`).
2. **Insights:** Created when multiple signals cluster into a confirmed behavioral or market pattern (`INS-XXXX`).
3. **Watchlist:** Active monitoring of competitive products or emerging tech that might affect Midmar (`WAT-XXXX`).
4. **Opportunity Development Packs (ODPs):** Formal, comprehensive business and technical dossiers (`OPP-XXXX`).

---

## 4. Mandatory Structure of an Opportunity Development Pack (ODP)

Every `OPP-XXXX` dossier must be backed by a strictly formatted markdown document matching `agent-os/schemas/opportunity.schema.json`:

1. **Header & Metadata:** ID, Title, Status, Horizon (H1 Core, H2 Growth, H3 Exploratory), Category, Risk Tier.
2. **Problem Statement:** Exact user friction or market void, articulated with clarity.
3. **Target Persona & User Journey:** Impact on practicing knowledge worker persona.
4. **Empirical Evidence Base:** Specific user logs, community requests, or market metrics supporting the change.
5. **Evidence Against & Counter-Arguments:** Mandatory devil's advocate analysis. What could go wrong? Why might users reject it?
6. **Alternatives Considered:** At least 2 alternatives evaluated, including the "Do Nothing" baseline.
7. **Impact vs. Effort Scoring:**
   - Strategic Value (1–5)
   - User Reach (1–5)
   - Implementation Effort (1–5)
   - Technical Risk (1–5)
   - Net Priority Score: `(Value × Reach) / (Effort + Risk)`
8. **The "Why Now" Gate:** Rigorous defense of why this opportunity must be executed in the immediate sprint rather than deferred.
9. **Art Director & Aesthetic Guardrails:** Verification of anti-generic UI tokens, calm color palettes, and RTL typography compliance.
10. **Security & Local-First Sovereignty:** Cryptographic and offline audit ensuring zero data leakage.
11. **Human Project Owner Decision Record:** Explicit sign-off, deferral, or rejection by Ahmad.

---

## 5. Strategic Portfolio Balance Rules

To maintain long-term product health, engineering capacity across active Opportunity Packs must adhere to target portfolio allocation:

- **Core & Reliability (H1):** 50% capacity (bug fixes, sync stability, Dexie performance, prayer calculation accuracy).
- **Growth & Feature Enhancements (H2):** 30% capacity (custom flashcard decks, calendar bridge, habit extensions).
- **Exploratory & High-Moat Innovation (H3):** 15% capacity (on-device AI models, WebAssembly Tajweed evaluation).
- **Technical Debt & Architectural Refinement:** 5% capacity (code refactoring, bundle pruning, test coverage expansion).
