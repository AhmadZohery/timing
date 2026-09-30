import { describe, it, expect, vi } from 'vitest';
import {
  formatLocalDate,
  getBiologicalDate,
  rollDopamineLottery,
  getSpendablePoints,
} from './gamification';
import type { UserState } from '../types';

describe('gamification utils', () => {
  describe('formatLocalDate', () => {
    it('should format a date correctly into YYYY-MM-DD', () => {
      const date = new Date(2026, 4, 15); // May 15, 2026
      expect(formatLocalDate(date)).toBe('2026-05-15');
    });

    it('should pad single-digit months and days with leading zeros', () => {
      const date = new Date(2026, 0, 7); // Jan 07, 2026
      expect(formatLocalDate(date)).toBe('2026-01-07');
    });
  });

  describe('getBiologicalDate', () => {
    it('should return a valid YYYY-MM-DD formatted string', () => {
      const bioDate = getBiologicalDate(false);
      expect(bioDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should treat early morning before 04:30 as previous day when grace period is active', () => {
      const mockEarlyDate = new Date(2026, 5, 20, 3, 15, 0); // 03:15 AM
      vi.useFakeTimers();
      vi.setSystemTime(mockEarlyDate);

      const bioDateWithGrace = getBiologicalDate(true);
      expect(bioDateWithGrace).toBe('2026-06-19'); // Yesterday

      const bioDateWithoutGrace = getBiologicalDate(false);
      expect(bioDateWithoutGrace).toBe('2026-06-20'); // Today

      vi.useRealTimers();
    });
  });

  describe('rollDopamineLottery', () => {
    it('should return standard reward with zero bonus on regular roll', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // >= 0.20 -> standard roll

      const result = rollDopamineLottery(25);
      expect(result.basePoints).toBe(25);
      expect(result.bonusPoints).toBe(0);
      expect(result.wonShield).toBe(false);
      expect(result.message).toContain('+25');

      vi.restoreAllMocks();
    });

    it('should award critical bonus (+10 points) on critical roll', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1) // < 0.20 -> critical hit!
        .mockReturnValueOnce(0.8); // >= 0.4 -> +10 points

      const result = rollDopamineLottery(20);
      expect(result.basePoints).toBe(20);
      expect(result.bonusPoints).toBe(10);
      expect(result.wonShield).toBe(false);
      expect(result.message).toContain('Critical Bonus');

      vi.restoreAllMocks();
    });

    it('should award streak shield on lucky shield roll', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.05) // < 0.20 -> critical hit!
        .mockReturnValueOnce(0.2); // < 0.4 -> won shield

      const result = rollDopamineLottery(15);
      expect(result.basePoints).toBe(15);
      expect(result.wonShield).toBe(true);
      expect(result.bonusPoints).toBe(0);
      expect(result.message).toContain('درع حماية');

      vi.restoreAllMocks();
    });
  });

  describe('getSpendablePoints', () => {
    it('should return 0 when user is null or undefined', () => {
      expect(getSpendablePoints(null)).toBe(0);
      expect(getSpendablePoints(undefined)).toBe(0);
    });

    it('should calculate totalPoints - spentPoints correctly', () => {
      const user = {
        totalPoints: 500,
        spentPoints: 120,
      } as UserState;
      expect(getSpendablePoints(user)).toBe(380);
    });

    it('should never return negative spendable points', () => {
      const user = {
        totalPoints: 100,
        spentPoints: 150,
      } as UserState;
      expect(getSpendablePoints(user)).toBe(0);
    });
  });
});
