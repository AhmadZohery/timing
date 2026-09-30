---
name: product-discovery
description: Discovers user personas, feature completeness, missing requirements, and domain logic across lifestyle stations.
---

# Product Discovery Skill

## Purpose
Inspects feature modules against product requirements to determine what is fully implemented, what is partially implemented, and what is stubbed or missing.

## Domain Matrix
- **Lifestyle Stations (9):**
  - `HOME`, `COMMUTE_MORNING`, `WORK_MICRO_SPRINT`, `ONE_SEC_FRICTION`
  - `SOCIAL_MEDIA_BREAK`, `GYM_ANCHOR`, `EVENING_SPRINT`, `RETROSPECTIVE_CHECKIN`, `GRAND_REWARD_STATE`
- **Faith & Spirituality:**
  - Prayer calculation (`src/utils/prayerCalculator.ts`), Circadian timeline, Tadabbur, Quran, Adhkar, Wird, Kahf, Mulk, Tasbih, Qadaa.
- **Language & Wisdom:**
  - CEFR vocabulary engines, audio dictation, Spaced Repetition (`src/services/spacedRepetitionService.ts`), Arabic poetry & Arud meters.
- **Workday & Gamification:**
  - Eisenhower matrix, agile standups, streaks, shields, survival mode.

## Deliverable
Output a granular status matrix tagging each feature as `[COMPLETE]`, `[PARTIAL]`, `[MOCKED]`, or `[PLANNED]`.
