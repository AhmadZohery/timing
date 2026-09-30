# AGENT SYSTEM THREAT MODEL & DEFENSE-IN-DEPTH MATRIX
**Governance Standard:** Google Antigravity Native Adaptation  
**System:** Midmar LifeOS Multi-Agent Enterprise Operating System V2  
**Authority:** PM-06 (Security Auditor) & Human Project Owner (Ahmad)

---

## 1. Threat Landscape Overview

As an autonomous multi-agent operating system capable of file I/O, tool execution, and state manipulation, Midmar LifeOS must defend against specific threats inherent to agentic systems.

This threat model outlines the primary attack vectors, potential failure modes, and automated countermeasures.

---

## 2. Threat Vector Taxonomy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AGENT SYSTEM THREAT TAXONOMY                    │
├──────┬────────────────────────┬────────────────────────────────────────┤
│ ID   │ Threat Class           │ Description                            │
├──────┼────────────────────────┼────────────────────────────────────────┤
│ T-01 │ Indirect Prompt        │ Malicious payloads embedded in user    │
│      │ Injection              │ files (CSV decks, ICS calendars, web   │
│      │                        │ imports) attempting to hijack agent    │
│      │                        │ instructions or exfiltrate context.    │
├──────┼────────────────────────┼────────────────────────────────────────┤
│ T-02 │ Secret Leakage in      │ Accidental exposure of backend keys    │
│      │ Frontend Bundles       │ (DEEPSEEK_API_KEY, SERVER_API_SECRET)  │
│      │                        │ via Vite client-side bundle injection. │
├──────┼────────────────────────┼────────────────────────────────────────┤
│ T-03 │ State Tampering &      │ An agent or script modifying authority │
│      │ Escalation Bypass      │ levels (e.g. promoting L4 to L1) to    │
│      │                        │ bypass mandatory Human Owner gates.    │
├──────┼────────────────────────┼────────────────────────────────────────┤
│ T-04 │ Tool Poisoning &       │ Execution of unsanitized shell inputs, │
│      │ Command Injection      │ arbitrary code execution, or path      │
│      │                        │ traversal through dynamic script args. │
├──────┼────────────────────────┼────────────────────────────────────────┤
│ T-05 │ Agent Loop & Resource  │ Runaway subagents, infinite recursive  │
│      │ Exhaustion             │ loops, unbounded memory or token drain.│
└──────┴────────────────────────┴────────────────────────────────────────┘
```

---

## 3. Defense-in-Depth Safeguards

### T-01 Safeguards (Prompt Injection):
- **Data-Control Plane Separation:** External data imported from CSV, ICS, or web pages must be parsed strictly through deterministic parsers (e.g. DOMPurify, standard JSON/ICS schema validators) and NEVER fed directly into LLM system prompts without explicit quoting and schema boundaries.
- **Untrusted Content Wrapping:** All external text is wrapped in `<untrusted_content>` tags with strict instruction to treat content solely as passive data.

### T-02 Safeguards (Secret Leakage):
- **Build-Time Scanning:** Automated lint and CI rules ban any environment variables containing `KEY`, `SECRET`, or `TOKEN` prefixed with `VITE_`.
- **Pre-Commit Secrets Audit:** `.env.local`, `.env`, and git history are actively monitored. Client code imports of backend server configurations trigger a build failure.

### T-03 Safeguards (State Tampering):
- **Static Schema Validation:** Modifications to `tasks.jsonl` or `decisions.jsonl` are validated against schema rules. Any change marked `L4` or `L5` requires a matching `decisions.jsonl` entry signed by `Ahmad (Human Owner)`.
- **Append-Only Event Verifier:** The compiler verifies that previous state hashes are unbroken and that authority levels cannot be downgraded post-creation.

### T-04 Safeguards (Command Injection):
- **No Arbitrary Shell Interpolation:** Scripts must avoid `eval()` or unquoted string concatenations in terminal commands.
- **Strict Working Directory Locking:** Execution is locked to `d:\timing`. Access to system files outside workspace requires explicit human approval.

### T-05 Safeguards (Resource Governance):
- **Turn and Sizing Ceilings:** The Dynamic Router enforces strict agent count limits (1 to 5 agents). No task may spawn more than 5 agents.
- **Daemon Lifecycle Controls:** Background tasks are registered with specific PIDs and monitored; idle or crashed daemons are cleaned up.
