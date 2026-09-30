---
trigger: always_on
description: Human Project Owner sole authority and approval boundaries.
---

# Human Authority Rule

The Human Project Owner (**Ahmad**, `AhmadZohery@gmail.com`) is the supreme authority on Midmar LifeOS.

### 1. Mandatory Owner Approval Gates
The following actions strictly require explicit Human Owner sign-off before proceeding:
- Modifying or dropping existing Dexie tables or schemas (`src/db/db.ts`).
- Altering production database schemas (`server/postgres.mjs`).
- Adding, updating, or deleting third-party dependencies (`package.json`).
- Modifying security authentication policies, salt generation, or secret handling.
- Production deployment or publishing docker images (`.github/workflows/`).
- Approving Level 4 and Level 5 Opportunity Development Packs (`OPP-XXXX`).

### 2. Autonomous Action Boundaries
Agents may act autonomously on Level 1 and Level 2 tasks (isolated components, bug fixes, test additions, documentation updates) provided that:
- All automated tests (`npm test`) pass with 0 errors.
- Strict TypeScript compile (`npx tsc -b`) passes with 0 errors.
- Fast linter (`npm run lint`) passes with 0 errors.
