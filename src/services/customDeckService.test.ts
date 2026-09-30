import { describe, it, expect } from 'vitest';
import {
  detectDelimiter,
  sanitizeCardField,
  parseDelimitedText,
  parseJsonDeck,
  parseRawTextCards,
  exportDeckToAnkiTsv,
  createCustomVocabularyWords,
} from './customDeckService';

describe('Custom Deck & CSV/TSV/JSON Importer Service', () => {
  describe('Sanitization & Security Guardrails', () => {
    it('strips malicious <script> tags and javascript protocol from inputs', () => {
      const malicious = '<script>alert("pwned")</script>Resilience<img src=x onerror="alert(1)">';
      const cleaned = sanitizeCardField(malicious);
      expect(cleaned).not.toContain('<script>');
      expect(cleaned).not.toContain('alert');
      expect(cleaned).toContain('Resilience');
    });

    it('enforces maximum character limits', () => {
      const longText = 'A'.repeat(500);
      const cleaned = sanitizeCardField(longText, 100);
      expect(cleaned.length).toBe(100);
    });
  });

  describe('Delimiter Detection', () => {
    it('detects comma, tab, and semicolon correctly', () => {
      expect(detectDelimiter(['apple,تفاحة,noun', 'banana,موز,noun'])).toBe(',');
      expect(detectDelimiter(['apple\tتفاحة\tnoun', 'banana\tموز\tnoun'])).toBe('\t');
      expect(detectDelimiter(['apple;تفاحة;noun', 'banana;موز;noun'])).toBe(';');
    });
  });

  describe('CSV / TSV Parsing', () => {
    it('parses CSV with header row correctly', () => {
      const csv = `term,translation,pronunciation,example,level,tags
perseverance,المثابرة,/pɜːrsəˈvɪərəns/,Keep going with patience,B2,grit mindset
serenity,السكينة والطمأنينة,/səˈrenəti/,Prayer brings peace,A2,spirituality`;

      const report = parseDelimitedText(csv);
      expect(report.totalRows).toBe(2);
      expect(report.invalidCards.length).toBe(0);
      expect(report.validCards.length).toBe(2);

      const first = report.validCards[0];
      expect(first.term).toBe('perseverance');
      expect(first.translation).toBe('المثابرة');
      expect(first.cefrLevel).toBe('B2');
      expect(first.tags).toContain('grit');
    });

    it('parses TSV (Anki export format) without headers', () => {
      const tsv = `ephemeral\tزائل / سريع الزوال\t/ɪˈfem.ər.əl/\tLife is ephemeral\tA2\tphilosophy
resilience\tالمرونة والقدرة على التعافي\t/rɪˈzɪl.jəns/\tResilience is key\tB1\tpsychology`;

      const report = parseDelimitedText(tsv, '\t');
      expect(report.validCards.length).toBe(2);
      expect(report.validCards[0].term).toBe('ephemeral');
      expect(report.validCards[0].translation).toBe('زائل / سريع الزوال');
    });

    it('flags rows with missing mandatory fields', () => {
      const brokenCsv = `term,translation
solitude,
,الوحشة`;

      const report = parseDelimitedText(brokenCsv);
      expect(report.validCards.length).toBe(0);
      expect(report.invalidCards.length).toBe(2);
      expect(report.invalidCards[0].error).toContain('الترجمة');
      expect(report.invalidCards[1].error).toContain('الكلمة');
    });
  });

  describe('JSON Deck Parsing', () => {
    it('parses valid JSON array of words', () => {
      const json = JSON.stringify([
        {
          term: 'Equanimity',
          translation: 'رباطة الجأش',
          cefrLevel: 'C1',
          tags: ['mental', 'calm'],
        },
      ]);

      const report = parseJsonDeck(json);
      expect(report.validCards.length).toBe(1);
      expect(report.validCards[0].term).toBe('Equanimity');
      expect(report.validCards[0].cefrLevel).toBe('C1');
    });

    it('gracefully handles invalid JSON syntax', () => {
      const badJson = '{"term": broken...';
      const report = parseJsonDeck(badJson);
      expect(report.validCards.length).toBe(0);
      expect(report.invalidCards.length).toBe(1);
      expect(report.invalidCards[0].error).toContain('خطأ في صيغة JSON');
    });
  });

  describe('Raw Text Parsing', () => {
    it('parses simple key-value lines', () => {
      const text = `
Diligence - الاجتهاد
Prudence - الحكمة وحسن التدبير
Fortitude : الصبر والجلد
`;
      const report = parseRawTextCards(text);
      expect(report.validCards.length).toBe(3);
      expect(report.validCards[0].term).toBe('Diligence');
      expect(report.validCards[0].translation).toBe('الاجتهاد');
      expect(report.validCards[2].term).toBe('Fortitude');
      expect(report.validCards[2].translation).toBe('الصبر والجلد');
    });
  });

  describe('Export to Anki TSV', () => {
    it('generates compliant Anki tab-separated text', () => {
      const cards = [
        {
          term: 'Tadabbur',
          translation: 'التدبر والتأمل في آيات الله',
          pronunciation: '/ta-dab-bur/',
          exampleSentence: 'كتاب أنزلناه إليك مبارك ليدبروا آياته',
          cefrLevel: 'B2' as const,
          tags: ['quran', 'spiritual'],
          isValid: true,
        },
      ];

      const exported = exportDeckToAnkiTsv(cards);
      expect(exported).toContain('#separator:tab');
      expect(exported).toContain('Tadabbur\tالتدبر والتأمل في آيات الله');
      expect(exported).toContain('quran spiritual');
    });
  });

  describe('Entity Creation', () => {
    it('creates CustomVocabularyWord items with initial SM-2 box 1', () => {
      const cards = [
        {
          term: 'Patience',
          translation: 'الصبر',
          cefrLevel: 'A1' as const,
          tags: ['virtues'],
          isValid: true,
        },
      ];

      const words = createCustomVocabularyWords(cards, 'deck_virtues_01');
      expect(words.length).toBe(1);
      expect(words[0].deckId).toBe('deck_virtues_01');
      expect(words[0].box).toBe(1);
      expect(words[0].status).toBe('NEW');
      expect(words[0].id).toContain('cvw_');
    });
  });
});
