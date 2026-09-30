---
name: current-state-audit
description: Audits the operational health, active tasks, logged bugs, and build/typecheck status of the repository.
---

# Current State Audit Skill

## Purpose
Establishes a verifiable snapshot of the codebase's current operational state using hard evidence.

## Execution Checklist
1. **Compilation & Static Analysis:**
   - Execute `npx tsc -b` and capture any TypeScript compile diagnostics.
   - Execute `npm run lint` and capture oxlint/eslint warnings or errors.
2. **Project State Query:**
   - Run `node scripts/state.mjs status` to inspect active sprint tasks, open bugs, and active risks.
3. **Environment & Secrets Hygiene:**
   - Verify that no `.env` or `.env.local` contains exposed secrets prefixed with `VITE_`.
4. **Epistemic Reporting:**
   - Compile findings into `[FACT]`, `[OBSERVATION]`, and `[INFERENCE]`.
