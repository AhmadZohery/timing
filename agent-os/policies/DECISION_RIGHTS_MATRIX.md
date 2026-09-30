# DECISION RIGHTS & ESCALATION MATRIX
**Governance Standard:** Google Antigravity Native Adaptation  
**System:** Midmar LifeOS Multi-Agent Enterprise Operating System V2  
**Authority:** Human Project Owner (Ahmad) — Supreme Arbiter

---

## 1. Principles of Decision Governance

1. **Explicit Authority over Consensus Theater:** Consensus is encouraged, but every domain has exactly one accountable owner. If an authority makes a valid, evidence-backed determination within their remit, it holds.
2. **Specialized Hard Vetoes:** Specific domain leaders possess absolute veto power over their domains to protect safety, user privacy, aesthetic integrity, and structural health. A veto cannot be overridden by consensus; it requires either resolution of the underlying defect or escalation to the Human Project Owner.
3. **Documented Disagreements:** Non-blocking objections do not stop execution, but they must be permanently recorded as an explicit note in the decision log.

---

## 2. Authority Levels (Level 1 to Level 5)

| Level | Scope | Example | Autonomous Approver | Mandatory Reviewers | Human Owner Sign-off |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **L1** | Local Component / Utility | CSS tweak, isolated helper function, bug fix in leaf file | Assigned Specialist / Implementer | None (Automated Lint + Test) | No |
| **L2** | Feature Enhancement / Non-breaking Subsystem | New station component, flashcard filter, Adhkar counter option | Domain PM (PM-01, PM-02, PM-03) | 1 Domain Reviewer | No |
| **L3** | Cross-Subsystem Feature / Shared Component | Dynamic Island Hub, Audio Capsule, Circadian engine change | Executive Product Director | System Architect (PM-04) + Art Director (PM-03) | Notification Only |
| **L4** | Architectural Shift / Schema Migration / Auth | Dexie v12 schema migration, server auth overhaul, ICS calendar bridge | Executive Product Director + System Architect | Security Auditor (PM-06) + Independent Evaluator | **REQUIRED** |
| **L5** | Core Business / Strategic Roadmap / Production Tag | Deploying to production, adding a paid tier, changing core philosophical axioms | **Human Project Owner (Ahmad)** | Full PM Council (PM-01 to PM-07) + Independent Evaluator | **REQUIRED** |

---

## 3. Specialized Hard Veto Rights

Specialists have binding veto authority within their designated safety zones:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SPECIALIZED HARD VETOES                         │
├───────────────────────┬──────────────────────┬─────────────────────────┤
│ Specialist Role       │ Veto Trigger Domain  │ Condition for Veto      │
├───────────────────────┼──────────────────────┼─────────────────────────┤
│ Security Auditor      │ Authentication,      │ Any credential leak,    │
│ (PM-06)               │ Secrets, Crypto,     │ unauthenticated public  │
│                       │ Rate Limiting        │ endpoint, or CVE risk   │
├───────────────────────┼──────────────────────┼─────────────────────────┤
│ Art Director & UX     │ Anti-Generic Design, │ Any template generic UI,│
│ (PM-03)               │ Typography, RTL,     │ broken BiDi/Arabic, or  │
│                       │ Mobile Swipes        │ touch-target failure    │
├───────────────────────┼──────────────────────┼─────────────────────────┤
│ System Architect      │ Schema, IndexedDB,   │ Potential data loss,    │
│ (PM-04)               │ Offline Sync,        │ non-backward-compatible │
│                       │ Dependency Bloat     │ schema, unbounded sync  │
├───────────────────────┼──────────────────────┼─────────────────────────┤
│ Product Evolution     │ Strategic Alignment, │ Opportunity fails "Why  │
│ Lead (PM-07)          │ "Why Now" Gate,      │ Now", lacks empirical   │
│                       │ Feasibility Risk     │ evidence, or dilutes MVD│
└───────────────────────┴──────────────────────┴─────────────────────────┘
```

---

## 4. Escalation & Tie-Breaking Protocol

When a conflict arises between two agents or PMs:

```
Step 1: Domain Deliberation (24h / Subagent turn)
  Implementer & Reviewer attempt to resolve through empirical data or alternate designs.

Step 2: Executive Director Mediation
  If deadlock persists, Executive Product Director evaluates against MVD (Minimum Viable Discipline)
  and Product Mission.
  * Limitation: Executive Director CANNOT override a Security or Architecture Veto.

Step 3: Escalation to Human Project Owner (Ahmad)
  If the issue involves a Hard Veto that the team believes is blocking essential progress,
  or an unresolvable strategic dispute, it is escalated immediately to the Owner with:
    a) Concrete factual summary of the dispute.
    b) Trade-off analysis (Cost, Security, UX, Time).
    c) Explicit recommendation from the Executive Director.
    d) Direct veto rationale from the specialized auditor.
```

---

## 5. Non-Blocking Objections Protocol

If a specialist or reviewer disagrees with a direction but acknowledges that it does not violate hard safety, design, or architectural boundaries:
1. They file an **`OBJECTION_CONCUR`** entry.
2. The objection is recorded in `project-management/state/decisions.jsonl` under the `dissenting_views` attribute.
3. The author may proceed without blocking the release, but the objection serves as an evaluation monitor during post-release telemetry audits.
