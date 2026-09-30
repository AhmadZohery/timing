/**
 * Dynamic CEFR Custom Deck & CSV/TSV/JSON Importer Service
 * Midmar LifeOS - Language Mastery Engine (OPP-0103 / SPEC-0103)
 * 
 * Supports multi-format deck ingestion with strict DOMPurify sanitization
 * against Cross-Site Scripting (XSS) and client-side memory safety bounds.
 */

import DOMPurify from 'dompurify';
import type { CustomVocabularyWord } from '../types';
import type { CefrLevel } from '../data/languages/vocabularyDatabase';

export interface ParsedCardPreview {
  term: string;
  translation: string;
  pronunciation?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  cefrLevel: CefrLevel;
  tags: string[];
  isValid: boolean;
  validationError?: string;
}

export interface ImportValidationReport {
  totalRows: number;
  validCards: ParsedCardPreview[];
  invalidCards: { row: number; error: string; raw: string }[];
  detectedDelimiter?: string;
}

const MAX_TERM_LENGTH = 150;
const MAX_TRANSLATION_LENGTH = 300;
const MAX_EXAMPLE_LENGTH = 500;
const MAX_BATCH_LIMIT = 5000;

/**
 * Sanitize text using DOMPurify in browser environments,
 * with secure regex fallback for SSR / unit tests.
 */
export function sanitizeCardField(input: unknown, maxLength = 300): string {
  if (typeof input !== 'string') return '';

  let sanitized = '';
  if (typeof window !== 'undefined' && DOMPurify.sanitize) {
    sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // Strip all HTML tags
      ALLOWED_ATTR: [],
    });
  } else {
    // Robust fallback for non-DOM / test environments
    sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  }

  // Trim and enforce length bound
  return sanitized.trim().slice(0, maxLength);
}

/**
 * Auto-detect delimiter in text (Tab, Comma, Semicolon, Pipe)
 */
export function detectDelimiter(sampleLines: string[]): string {
  const delimiters = ['\t', ',', ';', '|'];
  const scores: Record<string, number> = { '\t': 0, ',': 0, ';': 0, '|': 0 };

  for (const line of sampleLines.slice(0, 10)) {
    if (!line.trim()) continue;
    for (const d of delimiters) {
      const count = line.split(d).length - 1;
      if (count > 0) {
        scores[d] += count;
      }
    }
  }

  let bestDelimiter = ',';
  let highestScore = -1;

  for (const d of delimiters) {
    if (scores[d] > highestScore) {
      highestScore = scores[d];
      bestDelimiter = d;
    }
  }

  return bestDelimiter;
}

/**
 * Normalize and parse CEFR level
 */
export function parseCefrLevel(raw?: string): CefrLevel {
  if (!raw) return 'A1';
  const upper = raw.trim().toUpperCase();
  if (upper === 'A1' || upper === 'A2' || upper === 'B1' || upper === 'B2' || upper === 'C1' || upper === 'C2') {
    return upper as CefrLevel;
  }
  return 'A1';
}

/**
 * Parse CSV / TSV text content
 */
export function parseDelimitedText(
  content: string,
  explicitDelimiter?: string
): ImportValidationReport {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const validCards: ParsedCardPreview[] = [];
  const invalidCards: { row: number; error: string; raw: string }[] = [];

  const cleanLines = lines.filter((l) => l.trim().length > 0);
  if (cleanLines.length === 0) {
    return { totalRows: 0, validCards: [], invalidCards: [] };
  }

  const delimiter = explicitDelimiter || detectDelimiter(cleanLines);

  // Check if first line contains known headers
  const firstLineCols = cleanLines[0].split(delimiter).map((c) => c.trim().toLowerCase());
  const hasHeader =
    firstLineCols.some((c) => ['term', 'word', 'front', 'vocabulary', 'الكلمة', 'المصطلح'].includes(c)) &&
    firstLineCols.some((c) => ['translation', 'meaning', 'back', 'definition', 'الترجمة', 'المعنى'].includes(c));

  // Determine column index mapping
  let colIndex = {
    term: 0,
    translation: 1,
    pronunciation: -1,
    example: -1,
    exampleTrans: -1,
    level: -1,
    tags: -1,
  };

  const startIndex = hasHeader ? 1 : 0;
  if (hasHeader) {
    firstLineCols.forEach((col, idx) => {
      if (['term', 'word', 'front', 'vocabulary', 'الكلمة', 'المصطلح'].includes(col)) colIndex.term = idx;
      else if (['translation', 'meaning', 'back', 'definition', 'الترجمة', 'المعنى'].includes(col)) colIndex.translation = idx;
      else if (['pronunciation', 'phonetic', 'reading', 'النطق'].includes(col)) colIndex.pronunciation = idx;
      else if (['example', 'examplesentence', 'sentence', 'المثال'].includes(col)) colIndex.example = idx;
      else if (['exampletranslation', 'sentence_ar', 'ترجمة المثال'].includes(col)) colIndex.exampleTrans = idx;
      else if (['level', 'cefr', 'cefrlevel', 'المستوى'].includes(col)) colIndex.level = idx;
      else if (['tag', 'tags', 'وسوم'].includes(col)) colIndex.tags = idx;
    });
  } else {
    // Default column layout: term, translation, pronunciation, example, level, tags
    colIndex = {
      term: 0,
      translation: 1,
      pronunciation: 2,
      example: 3,
      exampleTrans: 4,
      level: 5,
      tags: 6,
    };
  }

  const rowsToProcess = cleanLines.slice(startIndex, startIndex + MAX_BATCH_LIMIT);

  rowsToProcess.forEach((line, i) => {
    const rowNum = startIndex + i + 1;
    const cols = line.split(delimiter).map((c) => c.trim());

    const rawTerm = cols[colIndex.term] || '';
    const rawTranslation = cols[colIndex.translation] || '';

    const term = sanitizeCardField(rawTerm, MAX_TERM_LENGTH);
    const translation = sanitizeCardField(rawTranslation, MAX_TRANSLATION_LENGTH);

    if (!term || !translation) {
      invalidCards.push({
        row: rowNum,
        error: !term ? 'حقل الكلمة/المصطلح مفقود' : 'حقل الترجمة/المعنى مفقود',
        raw: line,
      });
      return;
    }

    const pronunciation = colIndex.pronunciation >= 0 ? sanitizeCardField(cols[colIndex.pronunciation]) : undefined;
    const exampleSentence = colIndex.example >= 0 ? sanitizeCardField(cols[colIndex.example], MAX_EXAMPLE_LENGTH) : undefined;
    const exampleTranslation = colIndex.exampleTrans >= 0 ? sanitizeCardField(cols[colIndex.exampleTrans], MAX_EXAMPLE_LENGTH) : undefined;
    const cefrLevel = colIndex.level >= 0 ? parseCefrLevel(cols[colIndex.level]) : 'A1';

    let tags: string[] = [];
    if (colIndex.tags >= 0 && cols[colIndex.tags]) {
      tags = cols[colIndex.tags]
        .split(/[ ,|]+/)
        .map((t) => sanitizeCardField(t, 40))
        .filter(Boolean);
    }

    validCards.push({
      term,
      translation,
      pronunciation: pronunciation || undefined,
      exampleSentence: exampleSentence || undefined,
      exampleTranslation: exampleTranslation || undefined,
      cefrLevel,
      tags,
      isValid: true,
    });
  });

  return {
    totalRows: rowsToProcess.length,
    validCards,
    invalidCards,
    detectedDelimiter: delimiter,
  };
}

/**
 * Parse JSON array or Midmar deck export
 */
export function parseJsonDeck(jsonContent: string): ImportValidationReport {
  const validCards: ParsedCardPreview[] = [];
  const invalidCards: { row: number; error: string; raw: string }[] = [];

  let parsedData: any;
  try {
    parsedData = JSON.parse(jsonContent);
  } catch (e: any) {
    return {
      totalRows: 0,
      validCards: [],
      invalidCards: [{ row: 1, error: `خطأ في صيغة JSON: ${e.message}`, raw: jsonContent.slice(0, 100) }],
    };
  }

  const items = Array.isArray(parsedData)
    ? parsedData
    : Array.isArray(parsedData?.cards)
    ? parsedData.cards
    : Array.isArray(parsedData?.words)
    ? parsedData.words
    : [];

  if (items.length === 0) {
    return {
      totalRows: 0,
      validCards: [],
      invalidCards: [{ row: 1, error: 'لم يتم العثور على مصفوفة بطاقات في كائن JSON', raw: '' }],
    };
  }

  const limitedItems = items.slice(0, MAX_BATCH_LIMIT);

  limitedItems.forEach((item: any, idx: number) => {
    const rawTerm = item.term || item.word || item.front || '';
    const rawTrans = item.translation || item.meaning || item.back || item.definition || '';

    const term = sanitizeCardField(rawTerm, MAX_TERM_LENGTH);
    const translation = sanitizeCardField(rawTrans, MAX_TRANSLATION_LENGTH);

    if (!term || !translation) {
      invalidCards.push({
        row: idx + 1,
        error: !term ? 'حقل الكلمة/المصطلح مفقود' : 'حقل الترجمة/المعنى مفقود',
        raw: JSON.stringify(item).slice(0, 100),
      });
      return;
    }

    const pronunciation = sanitizeCardField(item.pronunciation || item.phonetic || '', 100);
    const exampleSentence = sanitizeCardField(item.exampleSentence || item.example || '', MAX_EXAMPLE_LENGTH);
    const exampleTranslation = sanitizeCardField(item.exampleTranslation || item.exampleAr || '', MAX_EXAMPLE_LENGTH);
    const cefrLevel = parseCefrLevel(item.cefrLevel || item.level);
    const tags = Array.isArray(item.tags)
      ? item.tags.map((t: any) => sanitizeCardField(String(t), 40)).filter(Boolean)
      : [];

    validCards.push({
      term,
      translation,
      pronunciation: pronunciation || undefined,
      exampleSentence: exampleSentence || undefined,
      exampleTranslation: exampleTranslation || undefined,
      cefrLevel,
      tags,
      isValid: true,
    });
  });

  return {
    totalRows: limitedItems.length,
    validCards,
    invalidCards,
  };
}

/**
 * Parse raw text format (e.g. "term - translation" or "term : translation")
 */
export function parseRawTextCards(rawText: string): ImportValidationReport {
  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const validCards: ParsedCardPreview[] = [];
  const invalidCards: { row: number; error: string; raw: string }[] = [];

  const cleanLines = lines.filter((l) => l.trim().length > 0).slice(0, MAX_BATCH_LIMIT);

  cleanLines.forEach((line, idx) => {
    const rowNum = idx + 1;
    // Split by " - ", " : ", " = ", or "\t"
    let parts = line.split(/\s*[-:=]\s*/);
    if (parts.length < 2) {
      parts = line.split('\t');
    }

    if (parts.length < 2) {
      invalidCards.push({
        row: rowNum,
        error: 'صيغة السطر غير صالحة. استخدم: الكلمة - الترجمة',
        raw: line,
      });
      return;
    }

    const term = sanitizeCardField(parts[0], MAX_TERM_LENGTH);
    const translation = sanitizeCardField(parts[1], MAX_TRANSLATION_LENGTH);

    if (!term || !translation) {
      invalidCards.push({
        row: rowNum,
        error: !term ? 'المصطلح مفقود' : 'الترجمة مفقودة',
        raw: line,
      });
      return;
    }

    validCards.push({
      term,
      translation,
      cefrLevel: 'A1',
      tags: ['مستورد_يدوي'],
      isValid: true,
    });
  });

  return {
    totalRows: cleanLines.length,
    validCards,
    invalidCards,
  };
}

/**
 * Export deck cards to standard Anki TSV format
 */
export function exportDeckToAnkiTsv(cards: ParsedCardPreview[] | CustomVocabularyWord[]): string {
  const header = '#separator:tab\n#html:false\n#tags column:5\n';
  const rows = cards.map((c) => {
    const term = (c as any).term || '';
    const translation = (c as any).translation || '';
    const pronunciation = (c as any).pronunciation || '';
    const example = (c as any).exampleSentence || '';
    const tags = Array.isArray(c.tags) ? c.tags.join(' ') : '';

    return `${term}\t${translation}\t${pronunciation}\t${example}\t${tags}`;
  });

  return header + rows.join('\n');
}

/**
 * Creates CustomVocabularyWord entities ready for storage
 */
export function createCustomVocabularyWords(
  cards: ParsedCardPreview[],
  deckId: string,
  userId = 'default_user'
): CustomVocabularyWord[] {
  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];

  return cards.map((c, index) => ({
    id: `cvw_${now}_${index}_${Math.random().toString(36).substring(2, 6)}`,
    deckId,
    userId,
    term: c.term,
    translation: c.translation,
    pronunciation: c.pronunciation,
    exampleSentence: c.exampleSentence,
    exampleTranslation: c.exampleTranslation,
    cefrLevel: c.cefrLevel,
    tags: c.tags,
    status: 'NEW',
    box: 1,
    nextReviewDate: todayStr,
    createdAt: now,
    updatedAt: now,
  }));
}
