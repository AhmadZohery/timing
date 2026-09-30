# MIDMAR LIFEOS (مضمار) — PROJECT OPERATING CONTEXT

Welcome to **Midmar LifeOS** (`d:\timing`), an enterprise-grade digital product operating as a **Local-First Life & Productivity Operating System** for knowledge workers and practicing Muslims.

---

## 1. Universal Orientation
- **Framework:** React 19 + TypeScript (ES2023 / Bundler) + Vite 8 + Tailwind CSS v4.
- **Client Storage (Source of Truth):** Dexie.js (IndexedDB) via `src/db/db.ts` across 18 tables with 11 versioned schemas.
- **Companion Backend:** Native Node.js HTTP server (`server/index.mjs`) + PostgreSQL 16 Alpine (`server/postgres.mjs`).
- **Human Project Owner:** Ahmad (`AhmadZohery@gmail.com`). All Level 4–5 roadmap and architectural decisions require Owner approval.

---

## 2. Essential Commands
```bash
# Development server (IPv4 forced, sub-second HMR)
npm run dev

# Full typecheck (strict zero-error policy)
npx tsc -b

# Linter (oxlint fast rust-based rules)
npm run lint

# Production build (TypeScript emit + Vite bundling)
npm run build

# Manage structured canonical state & dashboard
node scripts/state.mjs status
node scripts/state.mjs compile
```

---

## 3. Core Operating Rules
1. **Epistemic Standards:** Strictly distinguish `[FACT]`, `[OBSERVATION]`, `[INFERENCE]`, `[HYPOTHESIS]`, and `[RECOMMENDATION]`. Never present assumptions as facts.
2. **Inspect Before Changing:** Never edit shared core components (`src/db/db.ts`, `src/App.tsx`, `server/`) without reading the target files and identifying the blast radius.
3. **Local-First Sovereignty:** The client application must remain 100% functional without internet or external servers. Zero unencrypted third-party telemetry.
4. **Secret Protection:** Never prefix backend secrets with `VITE_`. All AI API keys (`DEEPSEEK_API_KEY`, `GEMINI_API_KEY`) belong server-side only.
5. **No Broken Swipes or Gestures:** Respect mobile touch interactions. Never add `data-no-swipe` to outer container wrappers.
6. **Arabic & BiDi First:** Always preserve Arabic typography standards (cap `font-weight` at 700, letter-spacing normal, line-height 2.2+ for tashkeel) and ensure directional arrows point correctly in RTL.
7. **Risk-Tiered Execution:**
   - Level 1–2 (Local/Module): Execute directly with automated linter/typecheck verification (0 subagents).
   - Level 3 (Shared UI/Component): Implement + Domain Reviewer subagent (1 subagent).
   - Level 4–5 (Cross-system / Security / Schema): Formal RFC + Specialist Team + Independent Evaluator (2–4 subagents).

---

## 4. Architectural Pointers
- **Always-On Rules:** See [`.agents/rules/`](file:///.agents/rules/)
- **On-Demand Skills:** See [`.agents/skills/`](file:///.agents/skills/)
- **Canonical State Store:** See [`project-management/state/`](file:///project-management/state/)
- **Current Sprint View:** See [`project-management/dashboard/CURRENT_SPRINT.md`](file:///project-management/dashboard/CURRENT_SPRINT.md)
- **Product Evolution Engine:** See [`product-evolution/`](file:///product-evolution/)
