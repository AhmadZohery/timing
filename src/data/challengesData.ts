import type { PrimaryStruggleId, DailyLog, UserState } from '../types';

export interface ChallengeItemMetadata {
  id: PrimaryStruggleId;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  emoji: string;
  badgeAr: string;
  metricTitleAr: string;
  colorClass: {
    bg: string;
    border: string;
    text: string;
    darkBg: string;
    darkBorder: string;
    ring: string;
  };
}

export const ALL_CHALLENGES_METADATA: ChallengeItemMetadata[] = [
  {
    id: 'fajr_prayer',
    titleAr: 'المحافظة على صلاة الفجر في وقتها',
    titleEn: 'Fajr Prayer On Time',
    descAr: 'صعوبة الاستيقاظ وتذبذب النوم والسهر المتأخر',
    descEn: 'Early wake-up struggles and sleep irregularity',
    emoji: '🕌',
    badgeAr: 'درع الفجر',
    metricTitleAr: 'نسبة الفجر في وقته',
    colorClass: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      text: 'text-emerald-900',
      darkBg: 'dark:bg-emerald-950/40',
      darkBorder: 'dark:border-emerald-800/60',
      ring: 'ring-emerald-500',
    },
  },
  {
    id: 'procrastination',
    titleAr: 'التسويف وصعوبة بدء المهام',
    titleEn: 'Overcoming Procrastination',
    descAr: 'المقاومة النفسية وتأجيل العمل المهم للغد',
    descEn: 'Initial friction and postponing vital work',
    emoji: '⏳',
    badgeAr: 'كسر الجمود',
    metricTitleAr: 'جلسات العمل وقاعدة الدقيقتين',
    colorClass: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-900',
      darkBg: 'dark:bg-amber-950/40',
      darkBorder: 'dark:border-amber-800/60',
      ring: 'ring-amber-500',
    },
  },
  {
    id: 'distraction',
    titleAr: 'التشتت الرقمي وتصفح الهاتف',
    titleEn: 'Digital Distraction Buster',
    descAr: 'ضياع ساعات في وسائل التواصل والتنقل العشوائي',
    descEn: 'Phone addiction and endless algorithmic scrolling',
    emoji: '📱',
    badgeAr: 'التركيز الصافي',
    metricTitleAr: 'ساعات العمل المحمية من التشتت',
    colorClass: {
      bg: 'bg-sky-50',
      border: 'border-sky-300',
      text: 'text-sky-900',
      darkBg: 'dark:bg-sky-950/40',
      darkBorder: 'dark:border-sky-800/60',
      ring: 'ring-sky-500',
    },
  },
  {
    id: 'afternoon_crash',
    titleAr: 'هبوط الطاقة الشديد بعد الظهر',
    titleEn: 'Afternoon Energy Crash',
    descAr: 'الخمول وضياع النصف الثاني من اليوم بعد العمل',
    descEn: 'Midday fatigue and circadian slumps',
    emoji: '🔋',
    badgeAr: 'شحن الحيوية',
    metricTitleAr: 'القيلولة والنوم المنضبط',
    colorClass: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-300',
      text: 'text-indigo-900',
      darkBg: 'dark:bg-indigo-950/40',
      darkBorder: 'dark:border-indigo-800/60',
      ring: 'ring-indigo-500',
    },
  },
  {
    id: 'consistency',
    titleAr: 'تذبذب الالتزام وتراجع الحماس',
    titleEn: 'Consistency & Momentum Drift',
    descAr: 'البدء بقوة ثم التوقف والانقطاع بعد أيام قليلة',
    descEn: 'Starting strong but fading after a few days',
    emoji: '📉',
    badgeAr: 'حفظ الشعلة',
    metricTitleAr: 'أيام السلسلة المتصلة والدروع',
    colorClass: {
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      text: 'text-rose-900',
      darkBg: 'dark:bg-rose-950/40',
      darkBorder: 'dark:border-rose-800/60',
      ring: 'ring-rose-500',
    },
  },
];

/**
 * Returns month key in YYYY-MM format
 */
export function getCurrentMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Format month key to localized Arabic / English label
 */
export function getMonthDisplayName(monthKey: string, isAr: boolean = true): string {
  try {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const date = new Date(year, monthIndex, 1);
    if (isAr) {
      const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      return `${monthNames[monthIndex] || ''} ${year}`;
    }
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return monthKey;
  }
}

export interface ChallengeMonthlyStats {
  scorePct: number;
  mainMetricText: string;
  subMetricText: string;
  statusText: string;
  statusBadgeColor: string;
}

/**
 * Calculate concrete 30-day performance for a specific challenge
 */
export function calculateChallengeMonthlyStats(
  challengeId: PrimaryStruggleId,
  dailyLogs: DailyLog[],
  userState?: UserState,
  isAr: boolean = true
): ChallengeMonthlyStats {
  const last30 = (dailyLogs || []).slice(0, 30);
  const recordedDays = Math.max(1, last30.length);

  switch (challengeId) {
    case 'fajr_prayer': {
      let fajrOnTimeCount = 0;
      last30.forEach((log) => {
        const fajrStatus = log.prayers?.fajr?.status;
        if (fajrStatus === 'on_time' || fajrStatus === 'in_group') {
          fajrOnTimeCount += 1;
        }
      });
      const pct = Math.round((fajrOnTimeCount / recordedDays) * 100);
      const isHigh = pct >= 80;
      const isMed = pct >= 50;
      return {
        scorePct: pct,
        mainMetricText: isAr
          ? `${fajrOnTimeCount} من ${recordedDays} يوماً في وقته`
          : `${fajrOnTimeCount} of ${recordedDays} days on time`,
        subMetricText: isAr
          ? `نسبة الالتزام بالفجر: ${pct}%`
          : `Fajr On-Time Rate: ${pct}%`,
        statusText: isHigh
          ? (isAr ? 'ثبات متميز 👑' : 'Excellent 👑')
          : isMed
          ? (isAr ? 'تقدم طيب 🌿' : 'Good Progress 🌿')
          : (isAr ? 'يحتاج تعزيزاً وورداً مبكراً ⚠️' : 'Needs Early Rest ⚠️'),
        statusBadgeColor: isHigh
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
          : isMed
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
      };
    }

    case 'procrastination': {
      let focusMinsTotal = 0;
      let activeWorkDays = 0;
      last30.forEach((log) => {
        if ((log.totalFocusMinutes || 0) > 0) {
          activeWorkDays += 1;
          focusMinsTotal += log.totalFocusMinutes || 0;
        }
      });
      const focusHours = Math.round((focusMinsTotal / 60) * 10) / 10;
      const pct = Math.min(100, Math.round((activeWorkDays / recordedDays) * 100));
      return {
        scorePct: pct,
        mainMetricText: isAr
          ? `${focusHours} ساعة عمل تركيز صافٍ`
          : `${focusHours} clean focus hours`,
        subMetricText: isAr
          ? `أنجزت في ${activeWorkDays} يوماً نشطاً`
          : `Across ${activeWorkDays} active days`,
        statusText: pct >= 70
          ? (isAr ? 'كسر مستمر للجمود 🚀' : 'High Velocity 🚀')
          : (isAr ? 'استمر على قاعدة الدقيقتين 💡' : 'Use 2-Min Rule 💡'),
        statusBadgeColor: pct >= 70
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
          : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
      };
    }

    case 'distraction': {
      let totalMins = 0;
      last30.forEach((log) => {
        totalMins += log.totalFocusMinutes || 0;
      });
      const avgMins = Math.round(totalMins / recordedDays);
      const pct = Math.min(100, Math.round((avgMins / 90) * 100)); // Target 90 mins clean daily
      return {
        scorePct: pct,
        mainMetricText: isAr
          ? `متوسط ${avgMins} دقيقة تركيز محمي يومياً`
          : `Avg ${avgMins} clean mins/day`,
        subMetricText: isAr
          ? 'محمي من إغراء التشتت الرقمي'
          : 'Protected from distractions',
        statusText: pct >= 75
          ? (isAr ? 'حصانة تركيز قوية 🛡️' : 'Strong Fortress 🛡️')
          : (isAr ? 'استعن بوضع الصدمة الإيجابية 📱' : 'Leverage Friction 📱'),
        statusBadgeColor: pct >= 75
          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
          : 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200',
      };
    }

    case 'afternoon_crash': {
      let powerNapsDone = 0;
      let totalSleep = 0;
      let sleepCount = 0;
      last30.forEach((log) => {
        if (log.powerNapDone) powerNapsDone += 1;
        if (log.sleepHours && log.sleepHours > 0) {
          totalSleep += log.sleepHours;
          sleepCount += 1;
        }
      });
      const avgSleep = sleepCount > 0 ? Math.round((totalSleep / sleepCount) * 10) / 10 : 7.2;
      const pct = Math.min(100, Math.round(((powerNapsDone * 2 + (avgSleep >= 6.5 ? 50 : 25)) / 70) * 100));
      return {
        scorePct: pct,
        mainMetricText: isAr
          ? `${powerNapsDone} قيلولة منضبطة • متوسط النوم ${avgSleep} ساعة`
          : `${powerNapsDone} Power Naps • ${avgSleep}h Avg Sleep`,
        subMetricText: isAr
          ? 'إدارة حيوية الإيقاع اليومي'
          : 'Circadian Energy Rhythm',
        statusText: powerNapsDone >= 5 || avgSleep >= 7
          ? (isAr ? 'حيوية متجددة ⚡' : 'Refreshed Energy ⚡')
          : (isAr ? 'احرص على قيلولة الظهر ☕' : 'Prioritize Power Nap ☕'),
        statusBadgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
      };
    }

    case 'consistency': {
      const streak = userState?.streakDays || 0;
      const shields = userState?.streakShields ?? 0;
      const pct = Math.min(100, Math.round((recordedDays / 30) * 100));
      return {
        scorePct: pct,
        mainMetricText: isAr
          ? `شعلة مستمرة ${streak} يوماً • ${shields} درع حماية`
          : `Active Streak ${streak} Days • ${shields} Shields`,
        subMetricText: isAr
          ? `${recordedDays} يوماً مسجلاً هذا الشهر (${pct}%)`
          : `${recordedDays} days logged this month (${pct}%)`,
        statusText: streak >= 7
          ? (isAr ? 'شعلة لا تنطفئ 🔥' : 'Unstoppable Flame 🔥')
          : (isAr ? 'ابنِ سلسلة أيام جديدة 💪' : 'Build Your Streak 💪'),
        statusBadgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
      };
    }
  }
}
