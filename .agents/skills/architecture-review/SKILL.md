---
name: architecture-review
description: Evaluates modularity, dependency inversion, state flow, and local-first boundaries against architectural standards.
---

# Architecture Review Skill (PM-04)

## Purpose
Ensures technical modifications preserve system modularity, offline resilience, and clean separation between client UI, client database, and companion backend.

## Review Pillars
1. **Local-First Boundary:** UI components must bind directly to Dexie live queries or custom hooks; they must NEVER rely on synchronous HTTP responses to render.
2. **React 19 & Compiler Idioms:**
   - Avoid legacy manual `useMemo` or `useCallback` unless strictly necessary for custom stable ref caches.
   - Zero side-effects in render functions.
3. **Companion Server Simplicity:**
   - Server endpoints in `server/index.mjs` must remain lightweight sync/backup conduits without taking ownership of client-side business logic.
