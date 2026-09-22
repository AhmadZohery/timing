import {
  VOCABULARY_DATABASE,
  type TargetLanguageCode,
  type VocabularyWord,
  type CefrLevel,
  CEFR_LEVELS_INFO,
} from '../data/languages/vocabularyDatabase';
import { db } from '../db/db';

export interface LevelProgress {
  level: CefrLevel;
  total: number;
  mastered: number;
  learning: number;
  percentage: number;
  isUnlocked: boolean;
  canTakeExam: boolean;
  isExamPassed: boolean;
}

export interface FluencyProfile {
  score: number; // 0 to 100
  currentCefr: CefrLevel;
  titleAr: string;
  titleEn: string;
  badgeColor: string;
  retentionRate: number; // 0 to 100
  totalMastered: number;
  wordsToNextLevel: number;
}

export interface WordProgressItem {
  wordId: string;
  lang: TargetLanguageCode;
  box: number; // 1 to 5 (Leitner boxes)
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedDate: string;
  timesCorrect: number;
  timesIncorrect: number;
  status: 'new' | 'learning' | 'mastered';
  easeFactor?: number; // SM-2 / FSRS cognitive ease factor (default 2.5, min 1.3, max 3.2)
  scheduledIntervalDays?: number;
}

export interface LanguageLearningStats {
  totalLearned: number;
  masteredCount: number;
  learningCount: number;
  dueReviewsCount: number;
  currentLanguage: TargetLanguageCode;
  dailyQuota: number;
  leechCount: number;
}

const STORAGE_LANG_KEY = 'midmar_language_active';
const STORAGE_QUOTA_KEY = 'midmar_language_quota';
const STORAGE_PROGRESS_KEY = 'midmar_language_progress';
const STORAGE_CUSTOM_KEY = 'midmar_language_custom_words';

// Leitner intervals in days:
// Box 1: 1 day, Box 2: 2 days, Box 3: 5 days, Box 4: 12 days, Box 5: 30 days
const LEITNER_INTERVALS_DAYS = [1, 2, 5, 12, 30];
const MAX_SESSION_REVIEWS = 25; // Prevents the "Review Avalanche" / burnout

class SpacedRepetitionService {
  private activeLanguage: TargetLanguageCode;
  private dailyQuota: number;
  private progress: Record<string, WordProgressItem> = {};
  private customWords: VocabularyWord[] = [];

  constructor() {
    this.activeLanguage = (localStorage.getItem(STORAGE_LANG_KEY) as TargetLanguageCode) || 'en';
    this.dailyQuota = Number(localStorage.getItem(STORAGE_QUOTA_KEY) || '10');

    try {
      const savedProgress = localStorage.getItem(STORAGE_PROGRESS_KEY);
      if (savedProgress) this.progress = JSON.parse(savedProgress);
    } catch (_) {}

    try {
      const savedCustom = localStorage.getItem(STORAGE_CUSTOM_KEY);
      if (savedCustom) this.customWords = JSON.parse(savedCustom);
    } catch (_) {}

    // Hydrate from Dexie if local memory was empty
    this.syncFromDexie();
  }

  private async syncFromDexie() {
    try {
      if (db.language_progress) {
        const records = await db.language_progress.toArray();
        if (records.length > 0) {
          records.forEach((r) => {
            if (!this.progress[r.wordId]) {
              this.progress[r.wordId] = {
                wordId: r.wordId,
                lang: r.lang as TargetLanguageCode,
                box: r.box,
                nextReviewDate: r.nextReviewDate,
                lastReviewedDate: r.lastReviewedDate,
                timesCorrect: r.timesCorrect,
                timesIncorrect: r.timesIncorrect,
                status: r.status,
                easeFactor: r.easeFactor ?? 2.5,
                scheduledIntervalDays: r.scheduledIntervalDays ?? LEITNER_INTERVALS_DAYS[r.box - 1] ?? 1,
              };
            }
          });
        }
      }
    } catch (e) {
      console.warn('Dexie language progress sync notice:', e);
    }
  }

  private saveProgress() {
    try {
      localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(this.progress));
    } catch (_) {}
  }

  private saveCustomWords() {
    try {
      localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(this.customWords));
    } catch (_) {}
  }

  public getActiveLanguage(): TargetLanguageCode {
    return this.activeLanguage;
  }

  public setActiveLanguage(lang: TargetLanguageCode) {
    this.activeLanguage = lang;
    localStorage.setItem(STORAGE_LANG_KEY, lang);
  }

  public getDailyQuota(): number {
    return this.dailyQuota;
  }

  public setDailyQuota(quota: number) {
    this.dailyQuota = quota;
    localStorage.setItem(STORAGE_QUOTA_KEY, quota.toString());
  }

  public getAllWordsForLanguage(lang?: TargetLanguageCode): VocabularyWord[] {
    const targetLang = lang || this.activeLanguage;
    const standard = VOCABULARY_DATABASE.filter((w) => w.lang === targetLang);
    const custom = this.customWords.filter((w) => w.lang === targetLang);
    return [...standard, ...custom];
  }

  /**
   * Returns today's quota of words for learning.
   * Dual-Pool Quota Rule (Duolingo/Anki standard):
   * 70% of quota dedicated to due reviews (memory consolidation),
   * 30% of quota dedicated to fresh new words (steady forward expansion).
   */
  public getTodayWords(count?: number): VocabularyWord[] {
    const limit = count || this.dailyQuota;
    const all = this.getAllWordsForLanguage();
    const today = new Date().toISOString().split('T')[0];

    const dueReviews: VocabularyWord[] = [];
    const inProgress: VocabularyWord[] = [];
    const freshWords: VocabularyWord[] = [];

    all.forEach((w) => {
      const prog = this.progress[w.id];
      if (prog && prog.nextReviewDate <= today) {
        dueReviews.push(w);
      } else if (prog && prog.status === 'learning') {
        inProgress.push(w);
      } else if (!prog || prog.status === 'new') {
        freshWords.push(w);
      }
    });

    // Dual-pool allocation: 70% reviews, 30% fresh
    const reviewTarget = Math.round(limit * 0.7);
    const selectedReviews = dueReviews.slice(0, reviewTarget);
    const remainingSlots = limit - selectedReviews.length;

    // Fill remaining with fresh words first, then in-progress words
    const selectedFresh = freshWords.slice(0, remainingSlots);
    const stillNeeded = remainingSlots - selectedFresh.length;
    const selectedInProgress = inProgress.slice(0, stillNeeded);

    const combined = [...selectedReviews, ...selectedFresh, ...selectedInProgress];

    // If still have space, backfill with remaining due reviews
    if (combined.length < limit && dueReviews.length > selectedReviews.length) {
      const extra = dueReviews.slice(selectedReviews.length, selectedReviews.length + (limit - combined.length));
      combined.push(...extra);
    }

    return combined.slice(0, limit);
  }

  /**
   * Returns words that are currently due for spaced review.
   * Mastered words are NEVER evicted; they recur on long-range retention maintenance!
   * Capped to MAX_SESSION_REVIEWS to avoid review avalanche burnout.
   */
  public getDueReviewWords(): VocabularyWord[] {
    const today = new Date().toISOString().split('T')[0];
    const all = this.getAllWordsForLanguage();

    const due = all.filter((w) => {
      const prog = this.progress[w.id];
      // Due if review date has arrived (including long-range mastered words!)
      return prog && prog.nextReviewDate <= today;
    });

    // Sort by most overdue first
    due.sort((a, b) => {
      const progA = this.progress[a.id];
      const progB = this.progress[b.id];
      return (progA?.nextReviewDate || '').localeCompare(progB?.nextReviewDate || '');
    });

    return due.slice(0, MAX_SESSION_REVIEWS);
  }

  /**
   * Returns all mastered words for the "Vocabulary Vault"
   */
  public getMasteredWords(lang?: TargetLanguageCode): VocabularyWord[] {
    const all = this.getAllWordsForLanguage(lang);
    return all.filter((w) => this.progress[w.id]?.status === 'mastered');
  }

  /**
   * Anti-Burnout Review Avalanche Triage Queue:
   * When overdue cards accumulate (> 20 items), cognitive load causes users to abandon reviews.
   * This returns a tightly focused triage batch of 15 highest-risk words:
   * prioritized by (1) lowest ease factor (hardest to retain), (2) most lapses, (3) oldest overdue date.
   */
  public getAvalancheRecoveryQueue(): VocabularyWord[] {
    const today = new Date().toISOString().split('T')[0];
    const all = this.getAllWordsForLanguage();

    const overdue = all.filter((w) => {
      const prog = this.progress[w.id];
      return prog && prog.nextReviewDate <= today;
    });

    // Sort by forgetting risk: lowest easeFactor, then highest timesIncorrect, then oldest date
    overdue.sort((a, b) => {
      const progA = this.progress[a.id];
      const progB = this.progress[b.id];
      const easeA = progA?.easeFactor ?? 2.5;
      const easeB = progB?.easeFactor ?? 2.5;
      if (easeA !== easeB) return easeA - easeB; // lowest ease first

      const lapsesA = progA?.timesIncorrect ?? 0;
      const lapsesB = progB?.timesIncorrect ?? 0;
      if (lapsesA !== lapsesB) return lapsesB - lapsesA; // most lapses first

      return (progA?.nextReviewDate || '').localeCompare(progB?.nextReviewDate || '');
    });

    return overdue.slice(0, 15);
  }

  /**
   * Returns word progress item if recorded
   */
  public getWordProgress(wordId: string): WordProgressItem | undefined {
    return this.progress[wordId];
  }

  /**
   * Leech Detection (العقدة المعرفية):
   * When timesIncorrect >= 3 or easeFactor <= 1.5, card is a "Leech"
   * causing cognitive fatigue and resistance to raw rote repetition.
   */
  public isLeechWord(wordId: string): boolean {
    const p = this.progress[wordId];
    if (!p) return false;
    return p.timesIncorrect >= 3 || (p.easeFactor !== undefined && p.easeFactor <= 1.5);
  }

  /**
   * Returns all words identified as Leech / Cognitive Knots for the active language
   */
  public getLeechWords(lang?: TargetLanguageCode): VocabularyWord[] {
    const all = this.getAllWordsForLanguage(lang);
    return all.filter((w) => this.isLeechWord(w.id));
  }

  /**
   * Resets leech status with a clean cognitive slate after morphological deconstruction
   */
  public async resetLeechStatus(wordId: string): Promise<void> {
    const item = this.progress[wordId];
    if (!item) return;

    item.timesIncorrect = 0;
    item.easeFactor = 2.2; // Fresh viable baseline
    item.box = 1;
    item.status = 'learning';
    item.scheduledIntervalDays = 1;
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    item.nextReviewDate = tomorrow.toISOString().split('T')[0];

    this.progress[wordId] = item;
    this.saveProgress();

    try {
      if (db.language_progress) {
        await db.language_progress.put({
          wordId: item.wordId,
          lang: item.lang,
          box: item.box,
          nextReviewDate: item.nextReviewDate,
          lastReviewedDate: item.lastReviewedDate,
          timesCorrect: item.timesCorrect,
          timesIncorrect: item.timesIncorrect,
          status: item.status,
          easeFactor: item.easeFactor,
          scheduledIntervalDays: item.scheduledIntervalDays,
        });
      }
    } catch (e) {
      console.warn('Dexie language progress update error:', e);
    }
  }

  /**
   * Records quiz or flashcard result and computes next SRS interval using FSRS / SM-2 cognitive ease
   */
  public async recordResult(
    wordId: string,
    isCorrect: boolean,
    rating: 'easy' | 'medium' | 'hard' = 'medium'
  ) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let item = this.progress[wordId];
    if (!item) {
      item = {
        wordId,
        lang: this.activeLanguage,
        box: 1,
        nextReviewDate: todayStr,
        lastReviewedDate: todayStr,
        timesCorrect: 0,
        timesIncorrect: 0,
        status: 'new',
        easeFactor: 2.5,
        scheduledIntervalDays: 1,
      };
    }

    const currentEase = item.easeFactor ?? 2.5;

    if (isCorrect) {
      item.timesCorrect += 1;
      let nextBox = item.box + 1;
      let newEase = currentEase;

      if (rating === 'easy') {
        nextBox = Math.min(5, nextBox + 1);
        newEase = Math.min(3.2, currentEase + 0.15);
      } else if (rating === 'hard') {
        newEase = Math.max(1.3, currentEase - 0.15);
      } // 'medium' keeps currentEase

      item.easeFactor = Number(newEase.toFixed(2));

      if (nextBox >= 5) {
        item.box = 5;
        item.status = 'mastered';
        // Progressive maintenance interval for mastered items (60d -> 120d -> 240d adjusted by ease)
        const bonusCycles = Math.max(1, item.timesCorrect - 4);
        const baseDays = Math.min(240, 60 * bonusCycles);
        const daysToAdd = Math.max(30, Math.round(baseDays * (item.easeFactor / 2.5)));
        item.scheduledIntervalDays = daysToAdd;
        const nextDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        item.nextReviewDate = nextDate.toISOString().split('T')[0];
      } else {
        item.box = nextBox;
        item.status = 'learning';
        // SM-2 / FSRS dynamic interval: baseInterval scaled by ease factor
        const baseInterval = LEITNER_INTERVALS_DAYS[item.box - 1] || 1;
        const daysToAdd = Math.max(1, Math.round(baseInterval * (item.easeFactor / 2.5)));
        item.scheduledIntervalDays = daysToAdd;
        const nextDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        item.nextReviewDate = nextDate.toISOString().split('T')[0];
      }
    } else {
      item.timesIncorrect += 1;
      // Partial memory preservation: lapse to box 2 if previously advanced (not total amnesia)
      item.box = item.box >= 3 ? 2 : 1;
      item.status = 'learning';
      // Negative ease penalty on lapse
      item.easeFactor = Number(Math.max(1.3, currentEase - 0.20).toFixed(2));
      item.scheduledIntervalDays = 1;
      // Review tomorrow
      const tomorrow = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
      item.nextReviewDate = tomorrow.toISOString().split('T')[0];
    }

    item.lastReviewedDate = todayStr;
    this.progress[wordId] = item;
    this.saveProgress();

    // Persist to Dexie
    try {
      if (db.language_progress) {
        await db.language_progress.put({
          wordId: item.wordId,
          lang: item.lang,
          box: item.box,
          nextReviewDate: item.nextReviewDate,
          lastReviewedDate: item.lastReviewedDate,
          timesCorrect: item.timesCorrect,
          timesIncorrect: item.timesIncorrect,
          status: item.status,
          easeFactor: item.easeFactor,
          scheduledIntervalDays: item.scheduledIntervalDays,
        });
      }
    } catch (e) {
      console.warn('Dexie language progress put notice:', e);
    }
  }

  public getStats(): LanguageLearningStats {
    const all = this.getAllWordsForLanguage();
    const today = new Date().toISOString().split('T')[0];

    let mastered = 0;
    let learning = 0;
    let due = 0;
    let leechCount = 0;

    all.forEach((w) => {
      const p = this.progress[w.id];
      if (p) {
        if (p.status === 'mastered') mastered++;
        else learning++;

        if (p.nextReviewDate <= today) due++;
        if (p.timesIncorrect >= 3 || (p.easeFactor !== undefined && p.easeFactor <= 1.5)) {
          leechCount++;
        }
      }
    });

    return {
      totalLearned: mastered + learning,
      masteredCount: mastered,
      learningCount: learning,
      dueReviewsCount: due,
      currentLanguage: this.activeLanguage,
      dailyQuota: this.dailyQuota,
      leechCount,
    };
  }

  public addCustomWord(wordData: Omit<VocabularyWord, 'id'>): VocabularyWord {
    const newWord: VocabularyWord = {
      ...wordData,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };

    this.customWords.push(newWord);
    this.saveCustomWords();
    return newWord;
  }

  // --- CEFR Progression & Fluency Methods ---

  public getPassedExams(lang?: TargetLanguageCode): CefrLevel[] {
    const targetLang = lang || this.activeLanguage;
    try {
      const data = localStorage.getItem(`midmar_language_passed_exams_${targetLang}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public recordExamPassed(level: CefrLevel, lang?: TargetLanguageCode) {
    const targetLang = lang || this.activeLanguage;
    const passed = this.getPassedExams(targetLang);
    if (!passed.includes(level)) {
      passed.push(level);
      localStorage.setItem(`midmar_language_passed_exams_${targetLang}`, JSON.stringify(passed));
    }
  }

  public getWordsByLevel(level: CefrLevel, lang?: TargetLanguageCode): VocabularyWord[] {
    const words = this.getAllWordsForLanguage(lang);
    return words.filter((w) => w.level === level);
  }

  public getLevelProgress(level: CefrLevel, lang?: TargetLanguageCode): LevelProgress {
    const targetLang = lang || this.activeLanguage;
    const words = this.getWordsByLevel(level, targetLang);
    const passedExams = this.getPassedExams(targetLang);
    const isExamPassed = passedExams.includes(level);

    const levelOrder: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const idx = levelOrder.indexOf(level);
    let isUnlocked = idx === 0;
    if (idx > 0) {
      const prevLevel = levelOrder[idx - 1];
      isUnlocked = passedExams.includes(prevLevel);
    }

    let mastered = 0;
    let learning = 0;
    words.forEach((w) => {
      const prog = this.progress[w.id];
      if (prog?.status === 'mastered') mastered++;
      else if (prog?.status === 'learning') learning++;
    });

    const total = words.length;
    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;
    const info = CEFR_LEVELS_INFO.find((i) => i.level === level);
    const minWords = info?.minWordsToUnlockExam || 4;
    const canTakeExam = isUnlocked && total > 0 && (mastered >= minWords || percentage >= 60);

    return {
      level,
      total,
      mastered,
      learning,
      percentage,
      isUnlocked,
      canTakeExam,
      isExamPassed,
    };
  }

  public getAllLevelsProgress(lang?: TargetLanguageCode): LevelProgress[] {
    const levelOrder: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return levelOrder.map((lvl) => this.getLevelProgress(lvl, lang));
  }

  public calculateFluencyProfile(lang?: TargetLanguageCode): FluencyProfile {
    const targetLang = lang || this.activeLanguage;
    const allWords = this.getAllWordsForLanguage(targetLang);
    const passedExams = this.getPassedExams(targetLang);

    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalMastered = 0;
    let weightedScore = 0;

    const levelWeights: Record<CefrLevel, number> = {
      A1: 1,
      A2: 1.5,
      B1: 2.2,
      B2: 3.2,
      C1: 4.5,
      C2: 6.0,
    };

    allWords.forEach((w) => {
      const p = this.progress[w.id];
      if (p) {
        totalCorrect += p.timesCorrect || 0;
        totalIncorrect += p.timesIncorrect || 0;
        if (p.status === 'mastered') {
          totalMastered++;
          weightedScore += (levelWeights[w.level] || 1) * 8;
        } else if (p.status === 'learning') {
          weightedScore += (levelWeights[w.level] || 1) * 2.5;
        }
      }
    });

    const totalAttempts = totalCorrect + totalIncorrect;
    const retentionRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 85;

    let currentCefr: CefrLevel = 'A1';
    const levelOrder: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    for (let i = levelOrder.length - 1; i >= 0; i--) {
      if (passedExams.includes(levelOrder[i])) {
        currentCefr = levelOrder[Math.min(levelOrder.length - 1, i + 1)];
        break;
      }
    }

    const rawScore = Math.min(100, Math.round((weightedScore / 200) * 75 + (retentionRate / 100) * 25));
    const score = Math.max(8, rawScore);

    const info = CEFR_LEVELS_INFO.find((i) => i.level === currentCefr) || CEFR_LEVELS_INFO[0];
    const currentProg = this.getLevelProgress(currentCefr, targetLang);
    const isMaxMasteryReached = currentCefr === 'C2' && passedExams.includes('C2');
    const wordsToNextLevel = isMaxMasteryReached ? 0 : Math.max(0, currentProg.total - currentProg.mastered);

    return {
      score,
      currentCefr,
      titleAr: info.nameAr,
      titleEn: info.nameEn,
      badgeColor: info.badgeColor,
      retentionRate,
      totalMastered,
      wordsToNextLevel,
    };
  }
}

export const srsService = new SpacedRepetitionService();
export const spacedRepetition = srsService;
