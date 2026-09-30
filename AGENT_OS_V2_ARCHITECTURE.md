# AGENT_OS_V2_ARCHITECTURE.md — ANTIGRAVITY-NATIVE TARGET ARCHITECTURE

- **Document Version:** 2.0.0
- **Architectural Status:** RATIFIED TARGET ARCHITECTURE
- **Authority:** Executive Product Director & PM-04 (Architecture & Engineering)
- **Approved by:** Human Project Owner (Ahmad) Delegated Authority

---

## 1. Architectural Philosophy: The Lean Sovereign Organization
The Antigravity Enterprise Agent OS V2 is designed around a singular operating principle:
> **Build the correct product correctly, continuously improve it, and maintain the evidence, governance, engineering discipline, and operational controls required to understand why every meaningful change exists.**

Complexity must justify itself. Governance must be proportional to blast radius. The organization optimizes for **Quality per unit of orchestration**, completely rejecting "architecture theater" and massive always-loaded master prompts.

---

## 2. Master System Hierarchy & Repository Map

```text
/
├── GEMINI.md                          # Canonical lean root context (<200 lines, universal constraints)
├── AGENTS.md                          # Pointer to GEMINI.md for Antigravity discoverability
│
├── .agents/
│   ├── rules/                         # Path-scoped rules with Antigravity YAML frontmatter
│   │   ├── core/                      # always_on rules (epistemic standards, safety, authority)
│   │   ├── frontend/                  # glob: src/**/*.tsx, src/**/*.ts
│   │   ├── backend/                   # glob: server/**/*.mjs
│   │   ├── database/                  # glob: src/db/**/*.ts
│   │   ├── design/                    # glob: src/components/**/*.tsx, src/index.css
│   │   ├── rtl/                       # glob: src/**/*.tsx, src/**/*.css
│   │   ├── security/                  # glob: server/**, src/services/auth*
│   │   └── release/                   # glob: .github/workflows/**, Dockerfile
│   │
│   ├── skills/                        # On-demand reasoning procedures (SKILL.md)
│   │   ├── repository-discovery/
│   │   ├── current-state-audit/
│   │   ├── product-discovery/
│   │   ├── opportunity-shaping/
│   │   ├── competitor-research/
│   │   ├── impact-analysis/
│   │   ├── architecture-review/
│   │   ├── design-review/
│   │   ├── visual-qa/
│   │   ├── security-review/
│   │   ├── regression/
│   │   └── release-readiness/
│   │
│   ├── agents/                        # Persistent Antigravity subagent role profiles
│   │   ├── product-director.md
│   │   ├── system-architect.md
│   │   ├── art-director.md
│   │   ├── security-auditor.md
│   │   ├── independent-evaluator.md
│   │   └── product-evolution-lead.md
│   │
│   └── hooks.json                     # Deterministic tool guards (PreToolUse & PostToolUse)
│
├── agent-os/
│   ├── architecture/                  # Architectural standards & ADR references
│   ├── decisions/                     # Formal Architectural Decision Records (ADRs & DECs)
│   ├── policies/                      # Enforceable operational policies
│   │   ├── DECISION_RIGHTS_MATRIX.md  # Veto authorities, escalation, review limits
│   │   ├── AGENT_ROUTING_POLICY.md    # Smallest useful team dynamic routing
│   │   ├── cost-governor.md           # Review loops, token & fan-out ceilings
│   │   └── threat-model.md            # Agent-system security & injection defense
│   ├── schemas/                       # Machine-readable JSON Schemas for state validation
│   │   ├── opportunity.schema.json    # Complete 40+ field Opportunity Pack schema
│   │   ├── task.schema.json
│   │   └── decision.schema.json
│   └── rfcs/                          # Level 4 & 5 Request for Comments (RFC-0001, etc.)
│
├── evals/                             # Agent OS Automated Evaluation Suite
│   ├── run-evals.mjs                  # Test runner for routing, safety, and deduplication
│   ├── test-routing.mjs               # Validates smallest viable team selection
│   ├── test-permission-guards.mjs     # Validates hook blocking of destructive commands
│   ├── test-opportunity-boundary.mjs  # Validates OPP -> CR delivery handoff
│   └── test-state-consistency.mjs     # Validates canonical state vs dashboard projections
│
├── project-management/
│   ├── state/                         # Canonical Transactional State Store (Source of Truth)
│   │   ├── tasks.jsonl                # Tasks with worker, supervisor, priority, level
│   │   ├── bugs.jsonl                 # Defect tracking with reproduction steps
│   │   ├── decisions.jsonl            # Permanent architectural decisions (DEC-XXXX)
│   │   ├── risks.jsonl                # Mitigated & active project risks
│   │   ├── events.jsonl               # Immutable append-only audit trail
│   │   ├── reviews.jsonl              # Formal peer reviews with epistemic findings
│   │   ├── approvals.jsonl            # Governance gates with signoffs
│   │   ├── comments.jsonl             # Granular discussion threads per task
│   │   ├── inspections.jsonl          # Deep station and engine audit logs
│   │   └── locks.json                 # Multi-agent concurrency control
│   └── dashboard/
│       └── CURRENT_SPRINT.md          # Materialized Markdown projection of state
│
└── product-evolution/
    ├── opportunities/                 # Opportunity Development Packs (OPP-XXXX.md)
    ├── signals.jsonl                  # 6 signal streams (Product, Customer, Market, Tech...)
    ├── insights.jsonl                 # Synthesized analytical deductions
    ├── watchlist.jsonl                # Emerging trends under surveillance
    ├── market-research.jsonl          # Deep competitor benchmark cards & moat scores
    └── marketing-strategy.jsonl       # ICP Personas, SEO keyword clusters & PLG distribution
```

---

## 3. Dynamic Agent Router & Team Sizing
The Dynamic Agent Router replaces static bureaucracy. It evaluates every incoming request across four vectors:
1. **Task Authority Level:** Level 1 (Inspect), Level 2 (Local), Level 3 (Shared), Level 4 (Cross-system), Level 5 (Architectural).
2. **Blast Radius:** Single file vs module vs shared core (`db.ts`, `server/`, `App.tsx`).
3. **Domain Uncertainty:** High (requires research/shaping) vs Low (deterministic fix).
4. **Independent Review Need:** Level 3+ mandates a fresh-context reviewer separate from the implementer.

### Standard Team Sizes (Default Small-Team Principle)
- **Level 1 (Observe/Audit):** 1 agent (Research or Inspector).
- **Level 2 (Local Bug/Copy):** 1 agent (Primary Implementer) + automated test gate.
- **Level 3 (Shared Component/UI):** 2 agents (Primary Implementer + Domain Reviewer).
- **Level 4 (Cross-System / Schema / API):** 3 agents (System Architect + Implementer + Independent Evaluator).
- **Level 5 (Critical Architecture / Security):** 3–4 agents (Architect + Security Lead + Implementer + Evaluator).

---

## 4. Independent Evaluation Architecture (Planner-Implementer-Evaluator)
To eliminate self-confirmation bias:
- **Planner:** Defines acceptance criteria, constraints, and blast radius.
- **Implementer:** Executes changes within authorized boundaries.
- **Evaluator:** Evaluates the result with fresh context and zero pride of authorship. The Evaluator does *not* modify code directly; it executes tests, checks browser rendering, inspects logs, and produces structured findings (`[FACT]`, `[OBSERVATION]`). The Implementer must resolve all findings before completion is declared.

---

## 5. Cost & Complexity Governor
Enforced ceilings prevent orchestration runaways:
- **Maximum Review Loops:** 3 rounds. If disagreements persist after 3 rounds, the issue escalates to the Decision Owner or Human Project Owner.
- **Maximum Implementation Retries:** 3 attempts. Repeated failures require re-analysis rather than blind looping.
- **Stuck Detection:** Monitored tool calls with exponential backoff and timeout aborts.

---

## 6. Product Evolution (PM-07) Operating Engine
The Product Evolution organization transforms raw signals into deeply shaped, cross-functionally reviewed proposals for the human owner:
1. **Signal Ingestion:** Captures signals across 6 streams (Product, Customer, Market, Competitor, Technology, Business/Growth).
2. **Signal -> Insight -> Opportunity:** Weak signals move to the Watchlist; strong signals synthesize into Insights; verified insights become `OPP-XXXX`.
3. **Cross-Functional Shaping:**
   - **Embedded Engineer:** Inspects code and schemas *before* approval to determine technical feasibility and architecture fit.
   - **Senior UX Designer:** Designs user flows, interaction models, and responsive behavior.
   - **Art Director:** Evaluates brand expression, typography, icon families, and rejects generic "AI-style" designs.
4. **"Why Now?" Gate:** Mandatory answers to: Why this? Why now? Why us? Why not a simpler solution? Cost of doing nothing?
5. **Approval Boundary:** Human Owner retains sovereign authority. Approved opportunities convert into Change Requests (`CR-XXXX`) within the standard delivery pipeline. **Self-improving does not mean self-authorizing.**

---

## 7. Canonical State Store & Projection Model
The system enforces a strict single source of truth:
- **Canonical Store:** `project-management/state/*.jsonl`. All state changes (tasks, decisions, reviews, approvals) write directly to this store with file-locking concurrency.
- **Materialized Views:**
  - `project-management/dashboard/CURRENT_SPRINT.md` is compiled on demand via `node scripts/state.mjs compile`.
  - The live dashboard on `http://localhost:3333` serves real-time projections over SSE.
  - No file or agent may maintain an independent copy of state that diverges from canonical JSONL.
