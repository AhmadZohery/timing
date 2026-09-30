# RFC-0001: Dexie Schema v12 Delta Sync Engine & Tombstone Architecture

- **RFC Number:** RFC-0001
- **Associated Opportunity:** [OPP-0101](../../product-evolution/opportunities/OPP-0101.md)
- **Associated Task:** `TASK-0013`
- **Authority Level:** Level 4 (Cross-System / Schema & Sync)
- **Authors:** PM-04 (Architecture & Engineering Director), DB-01 (Database Specialist)
- **Reviewers:** PM-06 (Security & DevOps), ARCH-01 (System Architect)
- **Approval Status:** APPROVED by Executive Committee (Full Delegated Authority from Human Project Owner Ahmad)
- **Date:** 2026-09-30

---

## 1. Context & Motivation
Currently, Midmar LifeOS uses a monolithic JSON export/import mechanism (`/api/sync/backup`) between Dexie IndexedDB and the companion server. While this ensures offline independence, multi-device usage (e.g. mobile commute + desktop deep work) creates race conditions where the later backup completely overwrites edits made on the other device (`RISK-0003`).

To achieve genuine local-first multi-device convergence without introducing heavy CRDT dependencies (like Yjs or Automerge, which would add ~200KB of bundle weight), this RFC establishes a **Lightweight Last-Write-Wins (LWW) Delta Sync Protocol** backed by Dexie Schema v12 and database tombstones.

---

## 2. Dexie Schema v12 Specification
In `src/db/db.ts`, schema version 12 will extend all synchronized tables with two core fields:
- `updatedAt: number` (Unix epoch in milliseconds, generated on create/update)
- `isDeleted?: boolean` (Tombstone flag; replaces hard physical deletion)

### Index Enhancements
For efficient delta queries without scanning entire tables, schema v12 adds compound indices:
```typescript
// src/db/db.ts - Schema Version 12
this.version(12).stores({
  tasks: 'id, userId, status, priority, [userId+updatedAt], isDeleted',
  habits: 'id, userId, frequency, [userId+updatedAt], isDeleted',
  habitLogs: 'id, userId, habitId, date, [userId+updatedAt]',
  prayerLogs: 'id, userId, prayerName, date, [userId+updatedAt]',
  tadabburNotes: 'id, userId, surah, ayah, [userId+updatedAt], isDeleted',
  vocabularyProgress: 'id, userId, wordId, nextReview, [userId+updatedAt]',
  qadaaRecords: 'id, userId, prayerType, [userId+updatedAt]',
  userSettings: 'userId, [userId+updatedAt]',
});
```

---

## 3. Tombstone Soft-Delete Lifecycle
To prevent deleted items from resurrecting when synced from another device:
1. When a user deletes a task, note, or habit:
   ```typescript
   await db.tasks.update(taskId, {
     isDeleted: true,
     updatedAt: Date.now(),
   });
   ```
2. Client queries filter out soft-deleted records:
   ```typescript
   export const getActiveTasks = (userId: string) =>
     db.tasks.where('userId').equals(userId).filter(t => !t.isDeleted).toArray();
   ```
3. Tombstone garbage collection: Records with `isDeleted === true` older than 90 days are purged locally once confirmed synced across registered devices.

---

## 4. Delta Sync Protocol (`/api/sync/delta`)

### Request Payload (`POST /api/sync/delta`)
```json
{
  "clientDeviceId": "client_macbook_pro_14",
  "lastSyncTimestamp": 1727650800000,
  "changes": {
    "tasks": [
      {
        "id": "tsk_82f1b0a",
        "title": "Complete Midmar RFC",
        "status": "COMPLETED",
        "updatedAt": 1727654400000,
        "isDeleted": false
      }
    ],
    "habitLogs": [
      {
        "id": "hl_99a12c",
        "habitId": "quran_wird",
        "date": "2026-09-30",
        "completed": true,
        "updatedAt": 1727652100000
      }
    ]
  }
}
```

### Server-Side Convergence (PostgreSQL & JSON Fallback)
```sql
INSERT INTO user_tasks (id, user_id, data, updated_at, is_deleted)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (id) DO UPDATE
SET
  data = EXCLUDED.data,
  updated_at = EXCLUDED.updated_at,
  is_deleted = EXCLUDED.is_deleted
WHERE EXCLUDED.updated_at > user_tasks.updated_at;
```

### Response Payload
The server returns all changes committed by other devices since `lastSyncTimestamp`:
```json
{
  "serverSyncTimestamp": 1727655000000,
  "serverChanges": {
    "tasks": [],
    "prayerLogs": [
      {
        "id": "pl_fajr_20260930",
        "prayerName": "FAJR",
        "date": "2026-09-30",
        "prayedOnTime": true,
        "updatedAt": 1727653000000
      }
    ]
  }
}
```

---

## 5. Security & Blast Radius Assessment
- **Authentication:** All requests require valid session Bearer token or `SERVER_API_SECRET` header.
- **Tenant Isolation:** Enforced via `WHERE user_id = $userId` in PostgreSQL queries.
- **Payload Limits:** Maximum payload size capped at 5MB per delta sync request to prevent denial-of-service.
- **Rollback Plan:** Schema v12 migrations preserve all existing v11 data; if rollback is required, existing v11 data remains untouched.

---

## 6. Implementation Milestones
1. **Milestone 1:** Schema v12 definition and unit test verification in `src/db/db.test.ts`.
2. **Milestone 2:** Client `deltaSyncService.ts` with local change accumulator.
3. **Milestone 3:** Companion server `/api/sync/delta` endpoint with atomic upsert transactions.
4. **Milestone 4:** E2E multi-client simulation test validating conflict resolution.
