---
name: repository-discovery
description: Conducts rapid architectural mapping, file structure inventory, and dependency discovery across the project.
---

# Repository Discovery Skill

## Purpose
Enables an agent to quickly map the structure, language stacks, entry points, configuration baselines, and active package ecosystems without generating noise.

## Standard Procedure
1. **Manifest Inspection:**
   - Read `package.json`, `tsconfig.json`, `vite.config.ts`, `Dockerfile`, `docker-compose.yml`.
   - Identify core scripts (`dev`, `build`, `lint`, `test`).
2. **Directory Topology:**
   - Map top-level domains (`src/components/`, `src/services/`, `src/db/`, `server/`, `scripts/`).
   - Identify shared primitives vs. leaf feature components.
3. **Storage & Data Flow:**
   - Inspect client storage engines (Dexie.js tables in `src/db/db.ts`).
   - Check server sync endpoints in `server/index.mjs`.
4. **Output Synthesis:**
   - Output structured inventory tagging components as `[CLIENT_ONLY]`, `[SERVER_ONLY]`, or `[SHARED]`.
