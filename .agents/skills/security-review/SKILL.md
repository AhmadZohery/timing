---
name: security-review
description: Performs static security analysis, authentication verification, secret leakage detection, and input sanitization audits.
---

# Security Review Skill (PM-06)

## Purpose
Ensures zero secret leakage, safe cryptographic practices, hardened authentication endpoints, and strict boundary isolation.

## Security Checklist
1. **Secret Leakage:**
   - Scan git diffs and `.env*` files for raw tokens or keys.
   - Verify no secrets use the `VITE_` prefix, preventing bundling into client assets.
2. **Server Auth & Rate Limiting:**
   - Verify all `/api/sync/*` and `/api/ai/proxy` endpoints validate authorization tokens.
   - Verify rate limiting is active on brute-forceable routes (`/api/auth/login`, `/api/auth/pin`).
3. **Client-Side Data Sanitization:**
   - Ensure external text input (CSV imports, custom decks, leads) is sanitized before insertion into IndexedDB to prevent XSS.
