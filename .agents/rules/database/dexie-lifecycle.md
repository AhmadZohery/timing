---
trigger:
  glob: "src/db/**"
description: Dexie.js Schema Lifecycle & Data Integrity Rule.
---

# Dexie.js Schema Lifecycle & Data Integrity Rule

IndexedDB (`src/db/db.ts`) is the primary sovereign store of user life data. Any schema mistake risks client database corruption.

### 1. Schema Versioning Rules
- Never modify an existing `this.version(N).stores(...)` block in-place once released.
- To add a table, drop an index, or modify a schema, **increment to `this.version(N + 1).stores(...)`**.
- Only specify modified or newly added tables in the new version block; Dexie automatically inherits unchanged tables from prior versions.

### 2. Compound Indexes
- Compound indexes must use bracketed syntax: `'id, date, [date+completed], [date+profileId]'`.
- Index keys must correspond to immutable or top-level primitive fields (string, number).

### 3. Safe Writes & Quota Interception
- All bulk or user-critical writes should be wrapped in `storageQuotaGuard.safeWrite()` to prevent `QuotaExceededError` from crashing the app or dropping unwritten state.
- Always retain `navigator.storage.persist()` on application boot.
