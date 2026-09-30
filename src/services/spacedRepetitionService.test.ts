import { describe, it, expect, beforeEach } from 'vitest';
import { SpacedRepetitionService } from './spacedRepetitionService';

describe('SpacedRepetitionService', () => {
  let service: SpacedRepetitionService;

  beforeEach(() => {
    service = new SpacedRepetitionService();
  });

  it('should initialize with default active language (en) and quota (10)', () => {
    expect(service.getActiveLanguage()).toBe('en');
    expect(service.getDailyQuota()).toBe(10);
  });

  it('should allow setting active language and quota', () => {
    service.setActiveLanguage('de');
    expect(service.getActiveLanguage()).toBe('de');

    service.setDailyQuota(15);
    expect(service.getDailyQuota()).toBe(15);
  });

  it('should retrieve words for active language from VOCABULARY_DATABASE', () => {
    const enWords = service.getAllWordsForLanguage('en');
    expect(enWords.length).toBeGreaterThan(0);
    expect(enWords[0].lang).toBe('en');

    const frWords = service.getAllWordsForLanguage('fr');
    expect(frWords.length).toBeGreaterThan(0);
    expect(frWords[0].lang).toBe('fr');
  });

  it('should return today words respecting the requested count', () => {
    const words = service.getTodayWords(5);
    expect(words).toBeDefined();
    expect(words.length).toBeLessThanOrEqual(5);
  });
});
