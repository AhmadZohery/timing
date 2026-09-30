# AGENT OS V2 MIGRATION PLAN: M0 TO M12
**Project:** Midmar LifeOS (مضمار)  
**Governance Standard:** Google Antigravity Native Adaptation  
**Status:** In Execution (Current Stage: M4–M7 Active)  
**Authority:** Human Project Owner (Ahmad) Approval Gate

---

## 1. Executive Summary & Migration Principles

This document defines the strict, phase-gated migration roadmap transitioning the Midmar LifeOS Multi-Agent Operating System from its V1 prototype to the robust, production-grade **Enterprise Agent OS V2**.

### Migration Invariants:
1. **Preserve Operational History:** Zero destructive overwrites of existing task numbering (`TASK-0001` through `TASK-0021`), decisions (`DEC-0001` through `DEC-0005`), or code commits.
2. **Smallest Effective Organization:** Eradicate prompt bloat, ceremonial token wastage, and blind 20-agent fan-outs. Enforce dynamic sizing (1–5 agents).
3. **Local-First & Offline Sovereignty:** Zero dependency on remote unencrypted telemetry. All state, scripts, and evaluation engines run natively in local Node.js / IndexedDB environments.
4. **Zero-Defect Verification:** Every stage requires automated testing (`npm test`), strict TypeScript verification (`npx tsc -b`), and linter passes.

---

## 2. Migration Stages Breakdown (M0 – M12)

```
 [M0: Snapshot] ──▶ [M1: Canonical State] ──▶ [M2: Native Rules] ──▶ [M3: Dynamic Router]
         │
         ▼
 [M4: Evolution Squad] ──▶ [M5: Decision Rights] ──▶ [M6: Independent Evals] ──▶ [M7: Dashboard V2]
         │
         ▼
 [M8: Legacy Cleanup] ──▶ [M9: E2E Dry Run] ──▶ [M10: Human Sign-off] ──▶ [M11: Stabilization] ──▶ [M12: Cadence]
```

### Stage M0: Pre-Migration Freeze & Baseline Audit
- **Objective:** Establish an uncorrupted baseline of all current assets, tasks, decisions, code, and test suites.
- **Actions:**
  - Run full test suite (`npm test`), typecheck (`npx tsc -b`), and lint check (`npm run lint`).
  - Create backup snapshot in `project-management/backups/`.
  - Author and ratify [`AGENT_OS_V2_CURRENT_STATE_AUDIT.md`](./AGENT_OS_V2_CURRENT_STATE_AUDIT.md).
- **Gate Criteria:** 100% test pass rate, 0 TypeScript compile errors, audit ratified.
- **Status:** **COMPLETED** (17/17 tests passing, audit published).

### Stage M1: Establish Canonical State Store Architecture
- **Objective:** Formally define and lock the unified, single-source-of-truth state architecture.
- **Actions:**
  - Author [`agent-os/decisions/ADR-0002-canonical-state-architecture.md`](./agent-os/decisions/ADR-0002-canonical-state-architecture.md).
  - Implement JSON Lines transactional event logs (`tasks.jsonl`, `bugs.jsonl`, `decisions.jsonl`, `reviews.jsonl`, `comments.jsonl`).
  - Implement atomic commit helpers and projection compiler (`scripts/state.mjs compile`).
- **Gate Criteria:** Zero drift between JSONL transactional logs and compiled Markdown views.
- **Status:** **COMPLETED** (Compiler operational, SSE sync live).

### Stage M2: Antigravity-Native Rule Triggering & Enforcement
- **Objective:** Convert passive prose guidelines into active, machine-evaluable Antigravity rule triggers.
- **Actions:**
  - Upgrade `.agents/rules/` headers to Antigravity YAML frontmatter (`trigger: always_on`, `trigger: glob`).
  - Map glob patterns for database changes (`src/db/**`), security (`server/**`, `src/services/auth*`), and RTL (`src/components/**`).
  - Enforce zero-bypass pre-commit checks.
- **Gate Criteria:** All rules have valid YAML frontmatter and pass path matching tests.
- **Status:** **ACTIVE / IN EXECUTION**.

### Stage M3: Dynamic Agent Router & Capability Matching
- **Objective:** Replace manual, bloated multi-agent assignments with automated task sizing and capability routing.
- **Actions:**
  - Author [`agent-os/policies/AGENT_ROUTING_POLICY.md`](./agent-os/policies/AGENT_ROUTING_POLICY.md).
  - Define 5-tier complexity matrix (Level 1: 1 agent; Level 5: max 5 agents).
  - Implement automated router test harness in `evals/test-routing.mjs`.
- **Gate Criteria:** No routine task ever spawns more than 3 agents; zero circular agent delegation loops.
- **Status:** **ACTIVE / IN EXECUTION**.

### Stage M4: Product Evolution, Growth & Intelligence Engine
- **Objective:** Operationalize PM-07 (Product Evolution Squad) as an autonomous innovation pipeline.
- **Actions:**
  - Author [`agent-os/policies/PRODUCT_EVOLUTION_OPERATING_MODEL.md`](./agent-os/policies/PRODUCT_EVOLUTION_OPERATING_MODEL.md).
  - Implement machine-readable schema [`agent-os/schemas/opportunity.schema.json`](./agent-os/schemas/opportunity.schema.json).
  - Establish the 4 active Opportunity Development Packs (`OPP-0101` through `OPP-0104`).
  - Instate the mandatory "Why Now" and "Evidence Against" evaluation gates.
- **Gate Criteria:** 100% schema validation on all Opportunity Packs; Art Director and Security Auditor sign-offs present.
- **Status:** **ACTIVE / IN EXECUTION**.

### Stage M5: Decision Rights, Escalation & Tie-Breaking Matrix
- **Objective:** Codify explicit decision-making authority, veto boundaries, and consensus protocols.
- **Actions:**
  - Author [`agent-os/policies/DECISION_RIGHTS_MATRIX.md`](./agent-os/policies/DECISION_RIGHTS_MATRIX.md).
  - Formulate veto triggers (Security Auditor on auth, Art Director on generic UI, PM-04 on Dexie migration).
  - Define Human Project Owner sole authority triggers (schema changes, Level 4/5 roadmap, production release).
- **Gate Criteria:** Explicit escalation pathways defined; zero silent overrides of reviewer objections.
- **Status:** **ACTIVE / IN EXECUTION**.

### Stage M6: Independent Evaluation & Verification Test Harness
- **Objective:** Implement adversarial evaluation subagents and automated Agent OS unit tests.
- **Actions:**
  - Create `evals/` test suite:
    - `evals/test-routing.mjs`: Validates dynamic sizing logic.
    - `evals/test-permission-guards.mjs`: Tests Level 1–5 authority enforcement.
    - `evals/test-opportunity-boundary.mjs`: Verifies PM-07 proposal standards.
    - `evals/test-state-consistency.mjs`: Tests JSONL transactional integrity.
    - `evals/run-evals.mjs`: Master runner.
  - Require Planner-Implementer-Evaluator separation on all Level 3+ tasks.
- **Gate Criteria:** 100% evals passing; independent evaluator role codified in `.agents/agents/independent-evaluator.md`.
- **Status:** **ACTIVE / IN EXECUTION**.

### Stage M7: Live Dashboard V2 Enhancement
- **Objective:** Deliver interactive, real-time visual governance and monitoring.
- **Actions:**
  - Integrate Interactive Kanban Board with drag-and-drop, quick-move, and role indicators.
  - Deliver Opportunity Radar (Impact vs. Effort interactive 2x2 grid).
  - Deliver Strategic Portfolio Balance visualizer (Core vs. Growth vs. Exploratory vs. Tech Debt).
  - Add real-time task editing, review logging, and SSE event streaming.
- **Gate Criteria:** Sub-second latency, zero client-side crashes, full RTL Arabic typography.
- **Status:** **ACTIVE / IN EXECUTION**.

### Stage M8: Legacy Artifact Cleanup & Archival
- **Objective:** Safely retire obsolete V1 scripts, redundant Markdown trackers, and prototype scaffolding.
- **Actions:**
  - Archive deprecated Claude-specific scripts or stubs into `archive/v1-legacy/`.
  - Validate that all active references point exclusively to Antigravity-native paths.
- **Gate Criteria:** Zero broken internal links across documentation; clean directory tree.
- **Status:** **PLANNED**.

### Stage M9: End-to-End Evaluation & Full Cycle Dry Run
- **Objective:** Execute a complete lifecycle flow through the V2 Agent OS (Signal ➔ Opportunity ➔ RFC ➔ Review ➔ Approval ➔ Implementation ➔ Eval).
- **Actions:**
  - Simulate an end-to-end task cycle on a non-critical feature.
  - Measure token efficiency, execution wall-clock time, and eval pass rates.
- **Gate Criteria:** Zero manual intervention required; complete audit trail logged in canonical state.
- **Status:** **PLANNED**.

### Stage M10: Production Transition & Human Sign-off
- **Objective:** Present complete V2 system to Ahmad (Human Owner) for formal ratification.
- **Actions:**
  - Compile final V2 transition summary and walkthrough artifact.
  - Request formal Owner approval via interactive command/sign-off.
- **Gate Criteria:** Explicit Human Owner approval recorded in `project-management/state/decisions.jsonl`.
- **Status:** **PLANNED**.

### Stage M11: Post-Migration Stabilization & Metric Monitoring
- **Objective:** Monitor system stability during initial sprint execution.
- **Actions:**
  - Track Dexie sync performance, server uptime, and eval stability.
  - Review developer experience ergonomics.
- **Gate Criteria:** 14-day zero-defect window under active usage.
- **Status:** **PLANNED**.

### Stage M12: Continuous Evolution & Sprint Cadence
- **Objective:** Establish the recurring bi-weekly cadence for PM-07 Opportunity harvesting and engineering sprints.
- **Actions:**
  - Bi-weekly Signal harvest and Watchlist curation.
  - Monthly Strategic Opportunity Pack portfolio rebalancing.
- **Gate Criteria:** Operating rhythm established as regular project workflow.
- **Status:** **PLANNED**.

---

## 3. Risk Mitigation & Rollback Protocols

| Risk Scenario | Probability | Impact | Mitigation / Rollback Procedure |
| :--- | :---: | :---: | :--- |
| **State Drift between JSONL & UI** | Low | High | Run `node scripts/state.mjs compile` to regenerate projections; rollback to previous Git commit on state directory. |
| **Eval Harness Timeout or Failure** | Low | Medium | Evals run locally using native Node.js assertions without external network dependencies. Isolated per test file. |
| **Daemon Process Desync** | Low | Low | Kill and respawn background daemon task (`task-978`) via Antigravity process manager. |
| **Schema Incompatibility** | Very Low | Critical | Schema versioning enforced with backward compatibility checks before writing to IndexedDB or JSONL. |
