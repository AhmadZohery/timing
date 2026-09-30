---
trigger:
  glob: "{server/**,src/services/auth*,**/.env*}"
description: Authentication, sessions, and secret protection standards.
---

# Authentication, Sessions & Secret Protection Rule

### 1. Secret Hygiene
- **Never prefix server secrets with `VITE_`:** Vite embeds any variable prefixed with `VITE_` directly into client JavaScript bundles.
- `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, and database connection strings belong exclusively on the companion server or in `.env.local` without `VITE_`.
- All client AI interactions must route through the server proxy (`/api/ai/proxy`) or through client-side user-supplied keys stored locally in Dexie/localStorage.

### 2. Companion Server Authentication
- Every endpoint under `/api/sync/*`, `/api/push/*`, and `/api/ai/*` must validate user authorization headers.
- Never return sensitive user salts anonymously via unauthenticated login routes.
- Multi-user isolation must be enforced: no user may read or overwrite another user's sync data (prevent IDOR/BOLA).

### 3. Password & PIN Security
- Replace single-round SHA-256 with Argon2id or salted PBKDF2 with 100,000+ iterations.
- Never perform PIN equality checks without server-side rate-limiting and temporary account lockout.
