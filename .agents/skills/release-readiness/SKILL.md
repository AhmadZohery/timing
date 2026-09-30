---
name: release-readiness
description: Validates all release gates, build outputs, Docker assets, and migration scripts prior to production tag creation.
---

# Release Readiness Skill

## Purpose
Acts as the final gatekeeper before code is released, tagged, or deployed to production environments.

## Automated Verification Protocol
```bash
# 1. Typecheck
npx tsc -b

# 2. Linting
npm run lint

# 3. Test Suites
npm test

# 4. Production Bundle
npm run build

# 5. State Synchrony
node scripts/state.mjs compile
```

## Release Sign-Off
Only when all 5 checks return code 0, and no open P0/P1 bugs exist in `project-management/state/bugs.jsonl`, is a release authorized.
