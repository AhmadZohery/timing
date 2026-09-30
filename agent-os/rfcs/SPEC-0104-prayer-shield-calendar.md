# SPEC-0104: Zero-Cloud Client-Side ICS Calendar Bridge & Circadian Prayer Shield

- **Spec Number:** SPEC-0104
- **Associated Opportunity:** [OPP-0104](../../product-evolution/opportunities/OPP-0104.md)
- **Associated Task:** `TASK-0014`
- **Authority Level:** Level 3 (Shared UI / Domain Logic)
- **Authors:** PM-01 (Product Director), PM-03 (UX & Arabic Design), ENG-01 (Frontend Specialist)
- **Reviewers:** PM-04 (Architecture), PM-06 (Security & DevOps)
- **Approval Status:** APPROVED by Executive Committee (Full Delegated Authority from Human Project Owner Ahmad)
- **Date:** 2026-09-30

---

## 1. Problem Statement & Motivation
Knowledge workers rely on Google Calendar, Apple Calendar, or Outlook for professional meetings. Users of Midmar LifeOS face daily scheduling friction:
1. Sacred prayer windows (e.g. Dhuhr, Asr, Maghrib) frequently conflict with meetings scheduled by colleagues.
2. Users must constantly cross-reference two separate systems.
3. Traditional calendar integrations require OAuth tokens, cloud servers, and privacy compromises, violating Midmar's zero-telemetry and local-first sovereignty.

---

## 2. Zero-Cloud Architectural Solution
Instead of server-side OAuth integrations:
1. **Local ICS Subscription URL / File Import:** The user provides an encrypted, read-only `.ics` link or uploads an `.ics` file directly into their browser.
2. **Client-Side Parsing:** A lightweight, pure TypeScript parser (`src/utils/icsParser.ts`) extracts `VEVENT` objects directly into IndexedDB (`externalCalendarEvents` table).
3. **Prayer Shield Engine:** Calculates protected buffer windows around each prayer time:
   - Default buffer: 15 minutes before Adhan (preparation/Wudu) to 25 minutes after Adhan (congregational prayer/Adhkar).
   - Flags overlapping corporate meetings with a gentle, non-judgmental alert.
   - Recommends optimal deep-work sprint blocks that avoid prayer collisions.
4. **Circadian Timeline Visualization:** Renders external busy blocks as subtle, low-opacity bars on `DailyCircadianTimeline.tsx`, maintaining visual harmony without cluttering the interface.

---

## 3. Data Model & Dexie Table
```typescript
export interface ExternalCalendarEvent {
  id: string; // UID from iCal
  userId: string;
  summary: string;
  description?: string;
  startTime: number; // Unix timestamp ms
  endTime: number; // Unix timestamp ms
  location?: string;
  isAllDay: boolean;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  sourceFeedUrl?: string;
  updatedAt: number;
}
```

---

## 4. Prayer Shield Logic (`src/utils/prayerShield.ts`)
```typescript
export interface PrayerShieldBuffer {
  prayerName: string;
  bufferStart: Date;
  bufferEnd: Date;
  isConflict: boolean;
  conflictingEvents: ExternalCalendarEvent[];
}

export function computePrayerShieldBuffers(
  prayerTimes: Record<string, string>,
  calendarEvents: ExternalCalendarEvent[],
  bufferMinutesBefore = 15,
  bufferMinutesAfter = 25
): PrayerShieldBuffer[] {
  // Returns buffered time-windows and identifies any overlapping external calendar events
}
```

---

## 5. UI/UX Integration Points
1. **Circadian Timeline (`DailyCircadianTimeline.tsx`):**
   - Displays external meeting pills with calendar icon.
   - Highlights protected prayer zones with a soft emerald/gold halo.
2. **Sprint Planning Modal (`WorkMicroSprintStation.tsx`):**
   - Shows "Recommended Focus Slots" that are guaranteed conflict-free from both meetings and prayer times.
3. **Privacy Assurance Badge:**
   - Displays: *"100% Local-First: Calendar feeds are fetched directly by your browser. No event details are ever transmitted to any external server."*
