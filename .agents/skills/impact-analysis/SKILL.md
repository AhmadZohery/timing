---
name: impact-analysis
description: Analyzes the blast radius, dependency graph, and migration risks of proposed changes.
---

# Impact Analysis Skill

## Purpose
Prevents unintended regressions by calculating blast radius before any architectural or schema change is committed.

## Protocol
1. **Dependency Mapping:**
   - Trace all files importing the modified module.
   - For database changes: check Dexie schema versions in `src/db/db.ts` and verify backward-compatibility with existing user IndexedDB state.
2. **State & Side Effects:**
   - Check React hook dependencies and rerender triggers.
   - Check local storage keys and cached sound/audio blobs.
3. **Risk Scoring:**
   - **Level 1 (Trivial):** Isolated UI styling or copy edit (No blast radius).
   - **Level 2 (Feature Component):** Single station or modal (Module blast radius).
   - **Level 3 (Shared Primitive):** Navigation, Dynamic Island, Audio Capsule (System UI blast radius).
   - **Level 4 (State/Storage/Sync):** Dexie tables, auth tokens, sync protocol (Core blast radius).
   - **Level 5 (Production Migration):** Docker, database migrations, security secrets (Critical blast radius).
