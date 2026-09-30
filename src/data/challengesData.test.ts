import { describe, it, expect } from 'vitest';
import {
  ALL_CHALLENGES_METADATA,
  getCurrentMonthKey,
  getMonthDisplayName,
  calculateChallengeMonthlyStats,
} from './challengesData';
import type { DailyLog, UserState } from '../types';

describe('challengesData and monthly evaluation', () => {
  it('should have metadata for all 5 lifestyle challenges', () => {
    expect(ALL_CHALLENGES_METADATA).toHaveLength(5);
    const ids = ALL_CHALLENGES_METADATA.map((c) => c.id);
    expect(ids).toContain('fajr_prayer');
    expect(ids).toContain('procrastination');
    expect(ids).toContain('distraction');
    expect(ids).toContain('afternoon_crash');
    expect(ids).toContain('consistency');
  });

  describe('getCurrentMonthKey', () => {
    it('should format a specific date as YYYY-MM', () => {
      const d = new Date(2026, 9, 1); // October 2026
      expect(getCurrentMonthKey(d)).toBe('2026-10');
    });
  });

  describe('getMonthDisplayName', () => {
    it('should return Arabic month name by default', () => {
      expect(getMonthDisplayName('2026-10', true)).toContain('أكتوبر');
      expect(getMonthDisplayName('2026-10', true)).toContain('2026');
    });

    it('should return English month name when isAr is false', () => {
      const label = getMonthDisplayName('2026-10', false);
      expect(label).toContain('October');
      expect(label).toContain('2026');
    });
  });

  describe('calculateChallengeMonthlyStats', () => {
    const mockLogs: DailyLog[] = [
      {
        date: '2026-10-01',
        prayers: {
          fajr: { status: 'on_time' },
          dhuhr: { status: 'on_time' },
        },
        totalFocusMinutes: 90,
        powerNapDone: true,
        sleepHours: 7.5,
        pointsEarned: 50,
      } as any,
      {
        date: '2026-10-02',
        prayers: {
          fajr: { status: 'in_group' },
        },
        totalFocusMinutes: 60,
        powerNapDone: false,
        sleepHours: 8,
        pointsEarned: 40,
      } as any,
      {
        date: '2026-10-03',
        prayers: {
          fajr: { status: 'late' },
        },
        totalFocusMinutes: 45,
        powerNapDone: true,
        sleepHours: 6,
        pointsEarned: 30,
      } as any,
    ];

    const mockUserState: UserState = {
      id: 'current_user',
      streakDays: 14,
      streakShields: 3,
      totalPoints: 1200,
      activeStation: 'HOME',
      survivalMode: false,
      lastActiveDate: '2026-10-03',
      weeklyBufferCount: 0,
      resilienceBadges: 2,
      criticalBonusesWon: 1,
      settings: {} as any,
    };

    it('should compute fajr prayer stats accurately', () => {
      const stats = calculateChallengeMonthlyStats('fajr_prayer', mockLogs, mockUserState, true);
      // 2 out of 3 logs are on_time/in_group = 67%
      expect(stats.scorePct).toBe(67);
      expect(stats.mainMetricText).toContain('2 من 3');
      expect(stats.statusText).toContain('تقدم طيب');
    });

    it('should compute procrastination / focus stats accurately', () => {
      const stats = calculateChallengeMonthlyStats('procrastination', mockLogs, mockUserState, true);
      // Total focus hours: (90 + 60 + 45) / 60 = 3.25 hrs
      expect(stats.mainMetricText).toContain('ساعة عمل تركيز صافٍ');
      expect(stats.scorePct).toBe(100); // 3 of 3 active work days
    });

    it('should compute afternoon crash / power nap stats accurately', () => {
      const stats = calculateChallengeMonthlyStats('afternoon_crash', mockLogs, mockUserState, true);
      // 2 power naps done
      expect(stats.mainMetricText).toContain('2 قيلولة منضبطة');
    });

    it('should compute consistency / streak stats accurately', () => {
      const stats = calculateChallengeMonthlyStats('consistency', mockLogs, mockUserState, true);
      expect(stats.mainMetricText).toContain('14 يوماً');
      expect(stats.mainMetricText).toContain('3 درع');
      expect(stats.statusText).toContain('شعلة لا تنطفئ');
    });
  });
});
