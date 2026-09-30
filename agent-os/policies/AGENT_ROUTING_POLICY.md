# DYNAMIC AGENT ROUTING & CAPABILITY MATCHING POLICY
**Governance Standard:** Google Antigravity Native Adaptation  
**System:** Midmar LifeOS Multi-Agent Enterprise Operating System V2  
**Authority:** Executive Product Director & Human Project Owner (Ahmad)

---

## 1. Core Principle: Smallest Effective Organization

Every token consumed and every agent spawned must justify its existence with measurable, high-signal contribution. Blind fan-out, ceremonial reviews, and bloated multi-agent committees are strictly prohibited.

The Dynamic Agent Router selects the **minimum sufficient set of capabilities** needed to accomplish a task safely, balancing risk against execution velocity.

---

## 2. Dynamic Task Sizing Matrix

The router computes the required team size based on the Task Complexity and Blast Radius:

| Level | Blast Radius / Scope | Max Active Subagents | Required Roles | Workflow Pipeline |
| :---: | :--- | :---: | :--- | :--- |
| **L1** | Leaf utility, isolated style, single translation string | **1** | Implementer | Implement ➔ Auto-Lint/Test ➔ Commit |
| **L2** | Single station component, isolated hook, localized UI | **1–2** | Implementer + Domain Reviewer | Implement ➔ Peer Review ➔ Commit |
| **L3** | Cross-station component, shared state, audio synthesis | **2–3** | Planner + Implementer + Domain Reviewer | Plan ➔ Implement ➔ Review ➔ Commit |
| **L4** | Database schema, server auth, core sync, external API | **3–4** | Architect + Implementer + Security/A11y Reviewer + Evaluator | RFC ➔ Approval ➔ Implement ➔ Adversarial Eval ➔ Owner Sign-off |
| **L5** | Core system redesign, strategic roadmap pivot, production cut | **4–5** | Director + Architect + Security + Evaluator + PM Council | Formal Specification ➔ Multi-Domain Defense ➔ Owner Approval |

```
                       DYNAMIC SIZING PIPELINE
                       
   [Incoming Task]
          │
          ▼
   [Blast Radius & Risk Assessment]
          │
          ├─────── Level 1 (Leaf / Local) ──────────▶ [1 Agent: Implementer]
          │
          ├─────── Level 2 (Feature / Module) ──────▶ [2 Agents: Dev + Reviewer]
          │
          ├─────── Level 3 (Shared Component) ──────▶ [3 Agents: Plan + Dev + Review]
          │
          ├─────── Level 4 (Schema / Auth / Infra) ─▶ [4 Agents: Arch + Dev + Sec + Eval]
          │
          └─────── Level 5 (Core Architecture) ─────▶ [5 Agents: Full Specialized Council]
```

---

## 3. Capability Matching Rules

When assigning roles, the router maps tasks to specialized skills rather than generic personas:

1. **Database & Storage Changes (`src/db/**`, `Dexie`, migrations):**
   - *Primary Capability:* System Architect (`PM-04`, `dexie-lifecycle` rule).
   - *Mandatory Guard:* Verify data loss safeguards, index costs, schema version increments.
2. **Visual, Typography, BiDi & Layout Changes (`src/components/**`, CSS):**
   - *Primary Capability:* Art Director / UX Specialist (`PM-03`, `anti-generic-design`, `arabic-bidi`).
   - *Mandatory Guard:* Check mobile viewport responsiveness (360px–1440px), Arabic line-height (2.2+ for tashkeel), font-weight ceiling (700 max).
3. **Authentication, Secrets & Server (`server/**`, `src/services/auth*`):**
   - *Primary Capability:* Security Auditor (`PM-06`, `auth-and-secrets`).
   - *Mandatory Guard:* Zero credentials in client builds, timing attack resistance, rate limiting.
4. **Market Intelligence & Feature Expansion (`product-evolution/**`):**
   - *Primary Capability:* Product Evolution Lead (`PM-07`, `opportunity-shaping`).
   - *Mandatory Guard:* "Why Now" gate, evidence validation, competitor moat preservation.

---

## 4. Forbidden Routing Anti-Patterns

1. **The Ceremony Anti-Pattern:** Spawning 5 subagents to modify a color token, a typo, or a single test fixture.
2. **The Self-Review Anti-Pattern:** An agent acting as both implementer and sole reviewer on Level 3+ tasks without an independent evaluator.
3. **The Circular Delegation Anti-Pattern:** Agent A delegating a task to Agent B, which re-delegates to Agent C, which delegates back to Agent A.
4. **The Zombie Subagent Anti-Pattern:** Leaving long-lived background subagents active without concrete deliverables or timeouts.
