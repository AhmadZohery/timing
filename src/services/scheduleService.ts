import type { UserSchedulePreferences } from '../types';
import { db } from '../db/db';

const SCHEDULE_PREFS_KEY = 'midmar_user_schedule_prefs';
const ANOMALIES_LOG_KEY = 'midmar_schedule_anomalies';

export interface ScheduleAnomalyRecord {
  id: string;
  date: string;
  expectedSport: string;
  actualSportOrAction: string;
  reason: 'travel' | 'rest' | 'family' | 'health' | 'work_crunch' | 'other';
  reasonLabelAr: string;
  customNote?: string;
  streakProtected: boolean;
  timestamp: number;
}

export interface LearnedSportPattern {
  predictedSport: string;
  confidence: number;
  totalSessions: number;
  explanationAr: string;
}

export const ANOMALY_REASONS = [
  { id: 'travel', labelAr: 'سفر وعمل طارئ ✈️', labelEn: 'Travel / Urgent Work', icon: '✈️' },
  { id: 'rest', labelAr: 'راحة واستشفاء عضلي 🧘', labelEn: 'Active Rest & Recovery', icon: '🧘' },
  { id: 'family', labelAr: 'مناسبة أو ظرف عائلي 👨‍👩‍👧‍👦', labelEn: 'Family & Social Duty', icon: '👨‍👩‍👧‍👦' },
  { id: 'health', labelAr: 'وعكة صحية أو إرهاق 🩹', labelEn: 'Health / Fatigue', icon: '🩹' },
  { id: 'work_crunch', labelAr: 'ضغط مهام حرج في العمل 💼', labelEn: 'Work Crunch', icon: '💼' },
  { id: 'other', labelAr: 'تغيير جدول مسبق 🗓️', labelEn: 'Schedule Adjustment', icon: '🗓️' },
] as const;

export const DEFAULT_SCHEDULE_PREFERENCES: UserSchedulePreferences = {
  wakeTime: '05:00',
  sleepTime: '23:00',
  workStartTime: '08:30',
  workDurationHours: 4,
  sportsPreferredTime: 'afternoon',
  weeklySportsPlan: {
    mon: 'gym',
    tue: 'boxing',
    wed: 'fitness',
    thu: 'gym',
    fri: 'padel',
    sat: 'football',
    sun: 'rest',
  },
  dailyWordQuota: 10,
  primaryLanguage: 'en',
  asrMethod: 'jumhur',
};

class ScheduleService {
  private prefs: UserSchedulePreferences;

  constructor() {
    this.prefs = this.loadPreferences();
  }

  private loadPreferences(): UserSchedulePreferences {
    try {
      const raw = localStorage.getItem(SCHEDULE_PREFS_KEY);
      if (raw) {
        return { ...DEFAULT_SCHEDULE_PREFERENCES, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Failed to load schedule preferences, using defaults:', e);
    }
    return { ...DEFAULT_SCHEDULE_PREFERENCES };
  }

  public getPreferences(): UserSchedulePreferences {
    return { ...this.prefs };
  }

  public savePreferences(updated: Partial<UserSchedulePreferences>): UserSchedulePreferences {
    this.prefs = { ...this.prefs, ...updated };
    try {
      localStorage.setItem(SCHEDULE_PREFS_KEY, JSON.stringify(this.prefs));
    } catch (e) {
      console.warn('Failed to persist schedule preferences:', e);
    }
    return { ...this.prefs };
  }

  /**
   * Returns the planned sport for any given day of the week
   */
  public getSportForDay(date: Date = new Date()): string {
    const days: Array<'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'> = [
      'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'
    ];
    const dayKey = days[date.getDay()];
    return this.prefs.weeklySportsPlan[dayKey] || 'gym';
  }

  /**
   * Sets the sport for a specific day of the week
   */
  public setSportForDay(
    dayKey: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat',
    sport: 'gym' | 'boxing' | 'muay_thai' | 'bjj' | 'football' | 'padel' | 'fitness' | 'rest'
  ) {
    this.prefs.weeklySportsPlan[dayKey] = sport;
    this.savePreferences({ weeklySportsPlan: this.prefs.weeklySportsPlan });
  }

  /**
   * Learns and predicts habits based on 30-90 days of actual user logs in Dexie.
   * "مع الوقت تتعلم وتفهم أني عملت اليوم ده كذا يبقى غالباً اليوم ده بيحصل فيه كذا"
   */
  public async getLearnedSportPattern(date: Date = new Date()): Promise<LearnedSportPattern> {
    const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon ...
    const fallbackSport = this.getSportForDay(date);

    try {
      // Fetch workout logs and match logs from Dexie
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const ninetyDaysIso = ninetyDaysAgo.toISOString().split('T')[0];

      const workouts = await db.workout_logs
        .where('date')
        .aboveOrEqual(ninetyDaysIso)
        .toArray();

      const matches = await db.match_logs
        .where('date')
        .aboveOrEqual(ninetyDaysIso)
        .toArray();

      // Count sport frequency for this specific day of week
      const sportCounts: Record<string, number> = {};
      let totalMatchingDays = 0;

      for (const w of workouts) {
        const logDate = new Date(w.date);
        if (logDate.getDay() === dayOfWeek) {
          const sp = w.category || w.routineType || 'gym';
          sportCounts[sp] = (sportCounts[sp] || 0) + 1;
          totalMatchingDays++;
        }
      }

      for (const m of matches) {
        const logDate = new Date(m.date);
        if (logDate.getDay() === dayOfWeek) {
          const sp = m.sportType || 'football';
          sportCounts[sp] = (sportCounts[sp] || 0) + 1;
          totalMatchingDays++;
        }
      }

      if (totalMatchingDays >= 3) {
        // Find dominant sport
        let bestSport = fallbackSport;
        let maxCount = 0;

        for (const [sport, count] of Object.entries(sportCounts)) {
          if (count > maxCount) {
            maxCount = count;
            bestSport = sport;
          }
        }

        const confidence = Math.round((maxCount / totalMatchingDays) * 100);
        return {
          predictedSport: bestSport,
          confidence,
          totalSessions: totalMatchingDays,
          explanationAr: `بناءً على نشاطك لـ ${totalMatchingDays} أسابيع: يوم ${this.getDayNameAr(dayOfWeek)} عادةً هو موعد (${bestSport}) بنسبة ${confidence}%.`,
        };
      }
    } catch (e) {
      console.warn('Failed to compute learned patterns:', e);
    }

    return {
      predictedSport: fallbackSport,
      confidence: 100,
      totalSessions: 1,
      explanationAr: `حسب خطتك الأسبوعية المعتمدة ليوم ${this.getDayNameAr(dayOfWeek)}: (${fallbackSport}).`,
    };
  }

  private getDayNameAr(day: number): string {
    const names = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return names[day] || '';
  }

  /**
   * Gentle Anomaly Reason Logger (حماية الشعلة دون تأنيب)
   * When routine changes, user logs reason with 1-tap, preserving streaks.
   */
  public logScheduleAnomaly(record: Omit<ScheduleAnomalyRecord, 'id' | 'timestamp' | 'streakProtected'>): ScheduleAnomalyRecord {
    const newRecord: ScheduleAnomalyRecord = {
      ...record,
      id: `anomaly-${Date.now()}`,
      streakProtected: true,
      timestamp: Date.now(),
    };

    try {
      const existing = this.getRecentAnomalies();
      const updated = [newRecord, ...existing].slice(0, 50);
      localStorage.setItem(ANOMALIES_LOG_KEY, JSON.stringify(updated));

      // Asynchronously shield the daily log in Dexie
      this.protectRetroactiveDailyLog(newRecord.date, newRecord.reasonLabelAr);
    } catch (e) {
      console.warn('Failed to persist schedule anomaly:', e);
    }

    return newRecord;
  }

  public getRecentAnomalies(): ScheduleAnomalyRecord[] {
    try {
      const raw = localStorage.getItem(ANOMALIES_LOG_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  }

  /**
   * Checks if an anomaly was logged protecting the streak for a specific date
   */
  public isStreakProtectedForDate(dateStr: string): boolean {
    const anomalies = this.getRecentAnomalies();
    return anomalies.some((a) => a.date === dateStr && a.streakProtected);
  }

  /**
   * Helper to retrieve dates eligible for the 48-hour retroactive grace shield:
   * [Today, Yesterday, 2 days ago]
   */
  public getEligibleGraceDates(): Array<{ dateStr: string; labelAr: string; labelEn: string; isPast: boolean }> {
    const dates = [];
    const now = new Date();

    // Today
    const todayStr = now.toISOString().split('T')[0];
    dates.push({
      dateStr: todayStr,
      labelAr: 'اليوم (الظرف الحالي)',
      labelEn: 'Today (Current)',
      isPast: false,
    });

    // Yesterday
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().split('T')[0];
    dates.push({
      dateStr: yestStr,
      labelAr: 'أمس (بأثر رجعي 🛡️)',
      labelEn: 'Yesterday (Retroactive 🛡️)',
      isPast: true,
    });

    // 2 days ago (48h boundary)
    const twoDays = new Date(now);
    twoDays.setDate(twoDays.getDate() - 2);
    const twoDaysStr = twoDays.toISOString().split('T')[0];
    dates.push({
      dateStr: twoDaysStr,
      labelAr: 'قبل أمس (مهلة 48 ساعة 🛡️)',
      labelEn: '2 Days Ago (48h Grace 🛡️)',
      isPast: true,
    });

    return dates;
  }

  /**
   * Shields a past date in Dexie daily_logs so streaks remain uninterrupted
   */
  public async protectRetroactiveDailyLog(dateStr: string, reason: string): Promise<void> {
    try {
      const existingLog = await db.daily_logs.get(dateStr);
      if (existingLog) {
        await db.daily_logs.update(dateStr, {
          notes: `${existingLog.notes || ''}\n🛡️ استدراك بأثر رجعي: تم حماية اليوم بعذر (${reason})`.trim(),
        });
      } else {
        await db.daily_logs.add({
          date: dateStr,
          completedStations: ['GYM_ANCHOR'],
          prayers: {},
          totalFocusMinutes: 0,
          survivalModeActive: true,
          voiceNotes: '',
          goldenNugget: `حماية الشعلة: ${reason}`,
          mvdTasksDone: [],
          notes: `🛡️ استدراك بأثر رجعي: تم حماية اليوم بعذر (${reason})`,
          pointsEarned: 10,
        });
      }
    } catch (e) {
      console.warn('Failed to protect retroactive daily log:', e);
    }
  }
}

export const scheduleService = new ScheduleService();
