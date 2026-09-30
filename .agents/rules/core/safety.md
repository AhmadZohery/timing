---
trigger: always_on
description: Core safety rules, command validation, and blast radius control.
---

# Safety & Destruction Prevention Rule

To prevent catastrophic data loss and maintain system stability:

### 1. Prohibited Commands & Actions
- Never run commands that recursively delete user directories (`rm -rf /`, `Remove-Item -Recurse D:\` without specific targets).
- Never drop database tables or clear IndexedDB in automated tests without dedicated mocking.
- Never write API keys or sensitive credentials into git-tracked files or terminal outputs.

### 2. Inspect Before Changing
- Always inspect target files and understand their full blast radius prior to modification.
- Never refactor shared root files (`src/App.tsx`, `src/db/db.ts`, `server/index.mjs`) without verifying all dependent consumers.
