# SPEC-0103: Dynamic CEFR Custom Deck & CSV/JSON/Anki Importer

- **Spec Number:** SPEC-0103
- **Associated Opportunity:** [OPP-0103](../../product-evolution/opportunities/OPP-0103.md)
- **Associated Task:** `TASK-0015`
- **Authority Level:** Level 3 (Shared UI / Domain Logic)
- **Authors:** PM-07 (Product Evolution Director), ENG-01 (Frontend Specialist)
- **Reviewers:** PM-01 (Product Director), PM-03 (UX & Arabic Design)
- **Approval Status:** APPROVED by Executive Committee (Full Delegated Authority from Human Project Owner Ahmad)
- **Date:** 2026-09-30

---

## 1. Problem Statement & Motivation
Midmar LifeOS currently features a fixed vocabulary database of ~1,200 words across 5 languages (EN, FR, DE, IT, ES) statically compiled into `src/data/languages/vocabularyDatabase.ts`.
This static architecture limits utility for:
1. Professional learners needing specialized terminology (Medical, Legal, Technical, Quranic Classical Arabic).
2. Users migrating from Anki or Quizlet with extensive existing spaced repetition decks.
3. Custom deck creators wanting to share bilingual study sets offline.

---

## 2. Technical Architecture & Ingestion Pipeline
1. **Multi-Format Ingestion:**
   - **CSV / TSV:** Supports comma, semicolon, and tab delimiters with auto-detection of column headers (`term`, `translation`, `pronunciation`, `example`, `level`, `tags`).
   - **JSON:** Accepts standardized Midmar deck format or Anki export JSON payloads.
   - **Raw Text / Clipboard:** Direct pasting of `term - definition` pairs.
2. **Sanitization & Safety Guardrails:**
   - All imported strings are strictly sanitized with DOMPurify to eliminate XSS risks from imported HTML tags.
   - Input length limits: Term (100 chars), Translation (250 chars), Example (500 chars).
   - Rate/volume guard: Maximum 5,000 cards per single batch import to ensure zero main-thread freezes.
3. **Database Integration (Dexie IndexedDB):**
   - Introduces `customDecks` table:
     ```typescript
     export interface CustomDeck {
       id: string;
       userId: string;
       title: string;
       description: string;
       sourceLanguage: string;
       targetLanguage: string;
       cardCount: number;
       tags: string[];
       isBuiltIn: boolean;
       createdAt: number;
       updatedAt: number;
     }
     ```
   - Cards are stored in the existing `vocabularyWords` table with an added `deckId?: string` property.
   - Leverages existing `spacedRepetitionService.ts` (SuperMemo SM-2 algorithm) for interval scheduling.

---

## 3. UI/UX Workflow & Components
1. **`CustomDeckModal.tsx`:**
   - Drag-and-drop file upload zone with preview table.
   - Column mapping selector allowing users to map arbitrary spreadsheet columns to Midmar card fields.
   - Instant validation report indicating valid rows vs. syntax warnings.
2. **Station Integration (`RetrospectiveCheckinStation.tsx` & Dynamic Hub):**
   - Users can switch active study decks directly from the language capsule.
   - Deck statistics view: Cards studied, retention rate, upcoming review queue.
3. **Export Engine:**
   - One-click export of any deck to standard Anki `.tsv` format with SM-2 review progress included.
