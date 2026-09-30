import { describe, it, expect } from 'vitest';
import {
  QURAN_SURAHS,
  POPULAR_WIRD_SURAHS,
  getSurahByNumber,
  getSurahByName,
  getSurahForPage,
  calculateEstimatedHasanat,
} from './quranSurahsData';

describe('quranSurahsData - 114 Surahs Metadata & Helpers', () => {
  it('contains exactly 114 Surahs with valid sequential numbering', () => {
    expect(QURAN_SURAHS).toHaveLength(114);
    for (let i = 0; i < 114; i++) {
      expect(QURAN_SURAHS[i].number).toBe(i + 1);
      expect(QURAN_SURAHS[i].nameAr.length).toBeGreaterThan(0);
      expect(QURAN_SURAHS[i].nameEn.length).toBeGreaterThan(0);
      expect(QURAN_SURAHS[i].ayahCount).toBeGreaterThan(0);
      expect(QURAN_SURAHS[i].startPage).toBeGreaterThanOrEqual(1);
      expect(QURAN_SURAHS[i].endPage).toBeLessThanOrEqual(604);
      expect(QURAN_SURAHS[i].startPage).toBeLessThanOrEqual(QURAN_SURAHS[i].endPage);
    }
  });

  it('retrieves Surah correctly by number', () => {
    const fatihah = getSurahByNumber(1);
    expect(fatihah?.nameAr).toBe('الفاتحة');
    expect(fatihah?.ayahCount).toBe(7);

    const baqarah = getSurahByNumber(2);
    expect(baqarah?.nameAr).toBe('البقرة');
    expect(baqarah?.ayahCount).toBe(286);
    expect(baqarah?.startPage).toBe(2);
    expect(baqarah?.endPage).toBe(49);

    const kahf = getSurahByNumber(18);
    expect(kahf?.nameAr).toBe('الكهف');
    expect(kahf?.ayahCount).toBe(110);
    expect(kahf?.startPage).toBe(293);
    expect(kahf?.endPage).toBe(304);
  });

  it('retrieves Surah correctly by Arabic or English name with or without prefix', () => {
    expect(getSurahByName('الكهف')?.number).toBe(18);
    expect(getSurahByName('سورة الكهف')?.number).toBe(18);
    expect(getSurahByName('Al-Kahf')?.number).toBe(18);
    expect(getSurahByName('Surah Al-Kahf')?.number).toBe(18);
    expect(getSurahByName('يس')?.number).toBe(36);
    expect(getSurahByName('الواقعة')?.number).toBe(56);
    expect(getSurahByName('الملك')?.number).toBe(67);
  });

  it('identifies Surah for a specific page in Medina Mushaf', () => {
    expect(getSurahForPage(1)?.nameAr).toBe('الفاتحة');
    expect(getSurahForPage(25)?.nameAr).toBe('البقرة');
    expect(getSurahForPage(295)?.nameAr).toBe('الكهف');
    expect(getSurahForPage(604)?.nameAr).toBe('الإخلاص');
  });

  it('calculates authentic hasanat estimation (+5,500 / page)', () => {
    expect(calculateEstimatedHasanat(1)).toBe(5500);
    expect(calculateEstimatedHasanat(10)).toBe(55000);
    expect(calculateEstimatedHasanat(0)).toBe(0);
  });

  it('includes core wird surahs in popular wird list', () => {
    expect(POPULAR_WIRD_SURAHS).toContain(2);  // البقرة
    expect(POPULAR_WIRD_SURAHS).toContain(18); // الكهف
    expect(POPULAR_WIRD_SURAHS).toContain(36); // يس
    expect(POPULAR_WIRD_SURAHS).toContain(56); // الواقعة
    expect(POPULAR_WIRD_SURAHS).toContain(67); // الملك
  });
});
