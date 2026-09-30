---
trigger: always_on
description: Zero-defect release pre-flight verification gate.
---

# Zero-Defect Release Gate

## Release Pre-Flight Verification
Every release candidate, merge, or production deployment MUST satisfy:
1. **Type Safety:** `npx tsc -b` exits with code 0 (zero errors).
2. **Linter Purity:** `npm run lint` exits with code 0 (zero errors).
3. **Automated Tests:** `npm test` runs with 100% passing suites.
4. **Secret Scan:** Pre-commit/pre-push hooks detect no raw credentials or unvetted environment tokens.
5. **No Broken Mobile Gestures:** Swipeable surfaces must test cleanly with no touch-locking regression.
6. **Local-First Integrity:** Application boots from zero network cache cleanly into IndexedDB without network requests.
