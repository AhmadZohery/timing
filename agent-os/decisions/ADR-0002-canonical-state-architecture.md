# ADR-0002: Canonical State Architecture & Event-Driven Projections
**Date:** 2026-09-30  
**Status:** Accepted  
**Deciders:** Human Project Owner (Ahmad), System Architect (PM-04), Executive Product Director  
**Supersedes:** Unstructured Markdown file tracking (V1 legacy)

---

## 1. Context & Problem Statement

In early agent operating architectures, project management state was maintained by having agents directly edit large Markdown files (`TASKS.md`, `BUGS.md`, `SPRINT.md`). This led to severe systemic failures:
1. **Merge Conflicts & Race Conditions:** Concurrent agents attempting to edit lines simultaneously resulted in lost updates or file corruption.
2. **State Drift:** Markdown tables drifted out of sync with real code commits and test results.
3. **Lack of Machine-Queryability:** Parsing unstructured markdown tables in automated tooling was slow, brittle, and prone to formatting regressions.
4. **Boundary Confusion:** Unclear separation between user application data (IndexedDB) and agent governance data.

---

## 2. Decision: Dual-Tier Event-Driven Canonical State

We adopt a strict **Dual-Tier State Architecture** separating transactional event logs from materialized projections and client application storage:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CANONICAL STATE TOPOLOGY                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [Subagents / Dashboard APIs / State Scripts]                         │
│                           │                                            │
│                           ▼ (Atomic Append Operations)                 │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ LEVEL 1: TRANSACTIONAL EVENT LOGS (Source of Truth)          │     │
│   │ - project-management/state/tasks.jsonl                      │     │
│   │ - project-management/state/bugs.jsonl                       │     │
│   │ - project-management/state/decisions.jsonl                  │     │
│   │ - project-management/state/reviews.jsonl                    │     │
│   │ - project-management/state/comments.jsonl                   │     │
│   │ - product-evolution/signals.jsonl                           │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                           │                                            │
│                           ▼ (Deterministic Compiler: scripts/state.mjs)│
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ LEVEL 2: MATERIALIZED READ PROJECTIONS (Derived Views)       │     │
│   │ - project-management/dashboard/CURRENT_SPRINT.md            │     │
│   │ - project-management/dashboard/ACTIVE_BUGS.md                │     │
│   │ - project-management/dashboard/DECISION_LOG.md              │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                           │                                            │
│                           ▼ (SSE Real-Time Broadcast on Port 3333)     │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ LEVEL 3: INTERACTIVE DASHBOARD & KANBAN (Visual UI)          │     │
│   │ - Live Kanban Board (Drag & Drop, Status Transitions)        │     │
│   │ - Opportunity Radar (Impact vs. Effort Grid)                 │     │
│   │ - Portfolio Balance Visualizer                               │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                        │
│   ======================= STRICT BOUNDARY ============================ │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ CLIENT APPLICATION RUNTIME DATA (End-User Local Data)        │     │
│   │ - src/db/db.ts (Dexie.js IndexedDB across 18 tables)         │     │
│   │ - Prayers, Wird, Tajweed, Vocab, Tasks, Eisenhower, Gym      │     │
│   │ * Strictly isolated from Agent OS state. ZERO telemetry.    │     │
│   └──────────────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Structural Rules & Invariants

1. **Append-Only Immutability:** State changes are appended as discrete JSON records. To update an entity (e.g. advance a task status), tools write an event that resolves to the entity ID. The compiler computes the latest state by folding events in chronological sequence.
2. **Deterministic Compilation:** The materialized markdown views in `project-management/dashboard/` must never be manually hand-edited. They are regenerated via `node scripts/state.mjs compile`.
3. **Real-time SSE Notification:** When a mutation occurs via `POST /api/tasks/move` or `POST /api/tasks/create`, the dashboard server appends the record, recompiles, and pushes an SSE event (`task-update`) to all connected browser clients.
4. **Offline & Zero-Cloud Dependency:** All state storage resides entirely on the local file system. No cloud telemetry, no remote databases required.

---

## 4. Consequences & Trade-offs

### Positive:
- **Zero Race Conditions:** Append-only JSONL files tolerate concurrent writes without corrupted file structures.
- **Full Historical Traceability:** Every change of status, supervisor assignment, or review comment is preserved with timestamps.
- **Fast Execution:** Reading JSONL files in Node.js takes under 5ms, maintaining sub-second dashboard refreshes.
- **Clean Git Diffs:** Line-based JSONL appends produce clean, non-conflicting git commits.

### Negative / Mitigation:
- **File Growth:** Over thousands of events, JSONL files grow in length.
  *Mitigation:* A compacting routine (`scripts/state.mjs compact`) can be triggered between sprints to collapse historic terminal states into baseline snapshots.
