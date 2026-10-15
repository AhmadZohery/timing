import confetti from 'canvas-confetti';
import { soundSynth } from '../services/soundSynthesizer';
import { haptic } from '../services/vibrationService';
import { db } from '../db/db';
import type { UserState, StationId, PrayerName, DailyLog, RealLifeRewardItem, RedeemedRewardRecord } from '../types';

export interface RewardResult {
  basePoints: number;
  bonusPoints: number;
  wonShield: boolean;
  message: string;
}

// Resilient Dexie DailyLog Upsert Function
// Guarantees that record exists with full defaults before applying changes, preventing silent failures.
export async function upsertDailyLog(
  date: string,
  updates: Partial<DailyLog>
): Promise<DailyLog> {
  return db.transaction('rw', [db.daily_logs, db.user_state], async () => {
    const existing = await db.daily_logs.get(date);
    const user = await db.user_state.get('current_user');
    const survivalMode = user?.survivalMode ?? false;

    const merged: DailyLog = existing
      ? { ...existing, ...updates }
      : {
          date,
          completedStations: [],
          pointsEarned: 0,
          survivalModeActive: survivalMode,
          voiceNotes: '',
          goldenNugget: '',
          mvdTasksDone: [],
          ...updates,
        };

    await db.daily_logs.put(merged);
    return merged;
  });
}

// Standard Local Date Formatter (YYYY-MM-DD)
// Safe against UTC timezone shifts in Egypt/Saudi/Dubai/etc.
export function formatLocalDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Biological Day Cutoff (04:30 AM Fajr Grace Period)
// If between midnight and 04:30 AM, treat as continuation of previous day so night owls never lose their streak!
export function getBiologicalDate(gracePeriodActive = true): string {
  const now = new Date();
  if (gracePeriodActive) {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Before 04:30 AM -> belongs to yesterday's streak
    if (hours < 4 || (hours === 4 && minutes < 30)) {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return formatLocalDate(yesterday);
    }
  }
  return formatLocalDate(now);
}

// Compute streak progression, shield consumption/gain, and resilience badges for a biological date
export function computeStreakProgress(
  user: UserState,
  bioDate: string,
  wonShield = false
): Pick<UserState, 'streakDays' | 'streakShields' | 'lastActiveDate' | 'resilienceBadges'> {
  let streakDays = user.streakDays || 0;
  let streakShields = user.streakShields || 0;
  let lastActiveDate = user.lastActiveDate || bioDate;
  let resilienceBadges = user.resilienceBadges || 0;

  if (!user.lastActiveDate || user.streakDays <= 0) {
    streakDays = 1;
    lastActiveDate = bioDate;
  } else {
    const [ly, lm, ld] = user.lastActiveDate.split('-').map(Number);
    const [by, bm, bd] = bioDate.split('-').map(Number);
    const lastActiveMs = Date.UTC(ly, (lm || 1) - 1, ld || 1);
    const bioDateMs = Date.UTC(by, (bm || 1) - 1, bd || 1);
    const diffDays = Math.round((bioDateMs - lastActiveMs) / 86400000);

    if (diffDays <= 0) {
      streakDays = streakDays > 0 ? streakDays : 1;
      lastActiveDate = bioDate;
    } else if (diffDays === 1) {
      streakDays = user.streakDays + 1;
      lastActiveDate = bioDate;
    } else if (diffDays === 2 && streakShields > 0) {
      streakShields -= 1;
      streakDays = user.streakDays + 1;
      resilienceBadges += 1;
      lastActiveDate = bioDate;
    } else {
      streakDays = 1;
      lastActiveDate = bioDate;
    }
  }

  streakShields += wonShield ? 1 : 0;

  return {
    streakDays,
    streakShields,
    lastActiveDate,
    resilienceBadges,
  };
}

// 20% Variable Dopamine Lottery
export function rollDopamineLottery(basePoints: number): RewardResult {
  const roll = Math.random();
  const isCritical = roll < 0.20; // 20% chance

  if (isCritical) {
    const shieldRoll = Math.random() < 0.4; // 40% chance of shield, 60% chance of +10 points
    if (shieldRoll) {
      return {
        basePoints,
        bonusPoints: 0,
        wonShield: true,
        message: '🎉 ضربة حظ خارقة! حصلت على درع حماية إضافي للشعلة (Streak Shield)!',
      };
    } else {
      return {
        basePoints,
        bonusPoints: 10,
        wonShield: false,
        message: '⚡ ضربة حظ حرجة (Critical Bonus)! +10 نقاط إضافية!',
      };
    }
  }

  return {
    basePoints,
    bonusPoints: 0,
    wonShield: false,
    message: `+${basePoints} نقطة إنجاز!`,
  };
}

// Trigger celebratory confetti burst
export function triggerCelebrationConfetti() {
  confetti({ disableForReducedMotion: true,
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#34d399', '#38bdf8', '#fbbf24', '#f43f5e', '#a78bfa'],
  });
}

// Award points and update UserState in Dexie
export async function awardStationPoints(
  stationId: StationId,
  basePoints: number
): Promise<RewardResult> {
  const reward = rollDopamineLottery(basePoints);
  const totalEarned = reward.basePoints + reward.bonusPoints;

  let didAward = false;
  await db.transaction('rw', [db.user_state, db.daily_logs], async () => {
    const user = await db.user_state.get('current_user');
    if (!user) return;
    didAward = true;

    const graceActive = user.settings?.fajrGracePeriodActive ?? true;
    const bioDate = getBiologicalDate(graceActive);
    const todayLog = await db.daily_logs.get(bioDate);
    const streakUpdates = computeStreakProgress(user, bioDate, reward.wonShield);

    const updatedUserState: UserState = {
      ...user,
      ...streakUpdates,
      totalPoints: user.totalPoints + totalEarned,
      criticalBonusesWon:
        reward.bonusPoints > 0 || reward.wonShield
          ? user.criticalBonusesWon + 1
          : user.criticalBonusesWon,
    };

    await db.user_state.put(updatedUserState);

    // Update Daily Log via resilient upsert
    const completed = new Set(todayLog?.completedStations || []);
    completed.add(stationId);
    await upsertDailyLog(bioDate, {
      completedStations: Array.from(completed),
      pointsEarned: (todayLog?.pointsEarned || 0) + totalEarned,
    });
  });

  if (!didAward) {
    return { basePoints, bonusPoints: 0, wonShield: false, message: '' };
  }

  // Sound and Haptics
  soundSynth.playCompletionChime();
  haptic.vibrateSprintCelebration();
  triggerCelebrationConfetti();

  return reward;
}

export interface PrayerSunnahDetails {
  sunnahPerformed?: boolean;
  qabliyahRakats?: number;
  badiyahRakats?: number;
  witrRakats?: number;
}

// Dedicated High-Weight Prayer Points Award Function
export async function awardPrayerPoints(
  prayer: PrayerName,
  status: 'on_time' | 'in_group' | 'late' | 'excused',
  isFriday = false,
  sunnahDetails?: PrayerSunnahDetails
): Promise<RewardResult> {
  if (status === 'excused') {
    const reward: RewardResult = {
      basePoints: 20,
      bonusPoints: 0,
      wonShield: false,
      message: '🕊️ رخصة شرعية مقبولة وحماية للشعلة دون أي لوم أو حرج (+20 نقطة) 🛡️',
    };

    let didAwardExcused = false;
    await db.transaction('rw', [db.user_state, db.daily_logs], async () => {
      const user = await db.user_state.get('current_user');
      if (!user) return;
      didAwardExcused = true;

      const graceActive = user.settings?.fajrGracePeriodActive ?? true;
      const bioDate = getBiologicalDate(graceActive);
      const todayLog = await db.daily_logs.get(bioDate);
      const streakUpdates = computeStreakProgress(user, bioDate, false);

      const updatedUserState: UserState = {
        ...user,
        ...streakUpdates,
        totalPoints: user.totalPoints + 20,
      };
      await db.user_state.put(updatedUserState);

      const currentPrayers = todayLog?.prayers || {};
      const updatedPrayers = {
        ...currentPrayers,
        [prayer]: {
          status: 'excused' as const,
          completedAt: new Date().toISOString(),
          pointsAwarded: 20,
        },
      };

      await upsertDailyLog(bioDate, {
        prayers: updatedPrayers,
        pointsEarned: (todayLog?.pointsEarned || 0) + 20,
      });
    });

    if (!didAwardExcused) {
      return { basePoints: 0, bonusPoints: 0, wonShield: false, message: '' };
    }

    soundSynth.playCompletionChime();
    haptic.vibrateLight();
    return reward;
  }

  let basePoints = 20;
  let prayerTitle = '';

  if (prayer === 'fajr') {
    prayerTitle = 'صلاة الفجر';
    basePoints = status === 'in_group' ? 45 : 35; // Fajr has the HIGHEST single deed reward in the whole system!
  } else if (prayer === 'dhuhr') {
    prayerTitle = isFriday ? 'صلاة الجمعة' : 'صلاة الظهر';
    basePoints = status === 'in_group' ? 30 : status === 'on_time' ? 20 : 10;
  } else if (prayer === 'asr') {
    prayerTitle = 'صلاة العصر';
    basePoints = status === 'in_group' ? 30 : status === 'on_time' ? 20 : 10;
  } else if (prayer === 'maghrib') {
    prayerTitle = 'صلاة المغرب';
    basePoints = status === 'in_group' ? 30 : status === 'on_time' ? 20 : 10;
  } else if (prayer === 'isha') {
    prayerTitle = 'صلاة العشاء';
    basePoints = status === 'in_group' ? 30 : status === 'on_time' ? 20 : 10;
  }

  // Bonus for Sunnah
  if (sunnahDetails?.sunnahPerformed) {
    const totalRakats = (sunnahDetails.qabliyahRakats || 0) + (sunnahDetails.badiyahRakats || 0) + (sunnahDetails.witrRakats || 0);
    const sunnahBonus = totalRakats >= 4 ? 15 : 10;
    basePoints += sunnahBonus;
  }

  // Dopamine lottery roll + bonus
  const reward = rollDopamineLottery(basePoints);
  // Special bonus: Fajr on time grants guaranteed or extra high chance shield!
  if (prayer === 'fajr' && (status === 'on_time' || status === 'in_group')) {
    reward.wonShield = true;
    reward.message = `👑 تقبل الله فجرك! هنيئاً لك أداء الفجر في وقته${sunnahDetails?.sunnahPerformed ? ' وسنتها العظيمة' : ''} (+${basePoints} نقطة + درع حماية الشعلة)!`;
  } else {
    reward.message = `🕌 تقبل الله طاعتكم! أداء ${prayerTitle}${sunnahDetails?.sunnahPerformed ? ' مع السنن المباركة' : ''} (+${basePoints} نقطة)`;
  }

  const totalEarned = reward.basePoints + reward.bonusPoints;

  let didAward = false;
  await db.transaction('rw', [db.user_state, db.daily_logs], async () => {
    const user = await db.user_state.get('current_user');
    if (!user) return;
    didAward = true;

    const graceActive = user.settings?.fajrGracePeriodActive ?? true;
    const bioDate = getBiologicalDate(graceActive);
    const todayLog = await db.daily_logs.get(bioDate);
    const streakUpdates = computeStreakProgress(user, bioDate, reward.wonShield);

    const updatedUserState: UserState = {
      ...user,
      ...streakUpdates,
      totalPoints: user.totalPoints + totalEarned,
      criticalBonusesWon:
        reward.bonusPoints > 0 || reward.wonShield
          ? user.criticalBonusesWon + 1
          : user.criticalBonusesWon,
    };
    await db.user_state.put(updatedUserState);

    // Update Daily Log prayers via resilient upsert
    const currentPrayers = todayLog?.prayers || {};
    const updatedPrayers = {
      ...currentPrayers,
      [prayer]: {
        status,
        completedAt: new Date().toISOString(),
        pointsAwarded: totalEarned,
        sunnahPerformed: sunnahDetails?.sunnahPerformed,
        sunnahQabliyahRakats: sunnahDetails?.qabliyahRakats,
        sunnahBadiyahRakats: sunnahDetails?.badiyahRakats,
        witrRakats: sunnahDetails?.witrRakats,
      },
    };

    await upsertDailyLog(bioDate, {
      prayers: updatedPrayers,
      pointsEarned: (todayLog?.pointsEarned || 0) + totalEarned,
    });
  });

  if (!didAward) {
    return { basePoints: 0, bonusPoints: 0, wonShield: false, message: '' };
  }

  soundSynth.playCompletionChime();
  haptic.vibrateSprintCelebration();
  triggerCelebrationConfetti();

  return reward;
}

// Award points for specific spiritual daily habits (Baqarah, Yasin, Mulk, Kahf, Qiyam, Adhkar, Fasting, Wird)
export async function awardSpiritualHabitPoints(
  habitKey:
    | 'baqarah'
    | 'yasin'
    | 'mulk'
    | 'kahf'
    | 'qiyam'
    | 'adhkar_morning'
    | 'adhkar_evening'
    | 'adhkar_sleep'
    | 'fasting'
    | 'wird',
  title: string
): Promise<RewardResult> {
  let basePoints = 15;
  if (habitKey === 'baqarah') basePoints = 35;
  else if (habitKey === 'qiyam' || habitKey === 'kahf') basePoints = 30;
  else if (habitKey === 'fasting' || habitKey === 'wird') basePoints = 25;
  else if (habitKey === 'yasin' || habitKey === 'mulk') basePoints = 15;
  else if (habitKey.startsWith('adhkar')) basePoints = 15;

  const reward = rollDopamineLottery(basePoints);
  const totalEarned = reward.basePoints + reward.bonusPoints;
  reward.message = `✨ مبارك! أتممت ${title} بنجاح (+${totalEarned} نقطة)`;

  let earlyReturnResult: RewardResult | null = null;
  let didAward = false;

  await db.transaction('rw', [db.user_state, db.daily_logs], async () => {
    const user = await db.user_state.get('current_user');
    if (!user) return;

    const graceActive = user.settings?.fajrGracePeriodActive ?? true;
    const bioDate = getBiologicalDate(graceActive);
    const todayLog = await db.daily_logs.get(bioDate);

    // Idempotency checks to prevent duplicate XP farming on the same biological day
    if (habitKey === 'fasting' && todayLog?.fastingDone) {
      earlyReturnResult = {
        basePoints: 0,
        bonusPoints: 0,
        wonShield: false,
        message: '✔ تم تسجيل صيام اليوم مسبقاً — تقبل الله طاعتك!',
      };
      return;
    }
    if (habitKey === 'wird' && todayLog?.quranWirdDone) {
      earlyReturnResult = {
        basePoints: 0,
        bonusPoints: 0,
        wonShield: false,
        message: '✔ تم تسجيل ورد اليوم مسبقاً — زادك الله نوراً!',
      };
      return;
    }
    if (
      (habitKey === 'baqarah' && todayLog?.baqarahProgress?.completed) ||
      (habitKey === 'yasin' && todayLog?.surahYasinDone) ||
      (habitKey === 'mulk' && todayLog?.surahMulkDone) ||
      (habitKey === 'kahf' && todayLog?.surahKahfDone) ||
      (habitKey === 'qiyam' && todayLog?.qiyamNightDone) ||
      (habitKey === 'adhkar_morning' && todayLog?.adhkarMorningDone) ||
      (habitKey === 'adhkar_evening' && todayLog?.adhkarEveningDone) ||
      (habitKey === 'adhkar_sleep' && todayLog?.adhkarSleepDone)
    ) {
      earlyReturnResult = {
        basePoints: 0,
        bonusPoints: 0,
        wonShield: false,
        message: `✔ تم تسجيل ${title} اليوم مسبقاً — تقبل الله طاعتك!`,
      };
      return;
    }

    didAward = true;
    const streakUpdates = computeStreakProgress(user, bioDate, reward.wonShield);

    const updatedUserState: UserState = {
      ...user,
      ...streakUpdates,
      totalPoints: user.totalPoints + totalEarned,
      criticalBonusesWon:
        reward.bonusPoints > 0 || reward.wonShield
          ? user.criticalBonusesWon + 1
          : user.criticalBonusesWon,
    };
    await db.user_state.put(updatedUserState);

    const updates: Partial<DailyLog> = {
      pointsEarned: (todayLog?.pointsEarned || 0) + totalEarned,
    };

    if (habitKey === 'baqarah') {
      updates.baqarahProgress = { pagesRead: 48, targetPages: 48, completed: true };
    } else if (habitKey === 'yasin') {
      updates.surahYasinDone = true;
    } else if (habitKey === 'mulk') {
      updates.surahMulkDone = true;
    } else if (habitKey === 'kahf') {
      updates.surahKahfDone = true;
    } else if (habitKey === 'qiyam') {
      updates.qiyamNightDone = true;
    } else if (habitKey === 'adhkar_morning') {
      updates.adhkarMorningDone = true;
    } else if (habitKey === 'adhkar_evening') {
      updates.adhkarEveningDone = true;
    } else if (habitKey === 'adhkar_sleep') {
      updates.adhkarSleepDone = true;
    } else if (habitKey === 'fasting') {
      updates.fastingDone = true;
    } else if (habitKey === 'wird') {
      updates.quranWirdDone = true;
    }

    await upsertDailyLog(bioDate, updates);
  });

  if (earlyReturnResult) {
    return earlyReturnResult;
  }
  if (!didAward) {
    return { basePoints: 0, bonusPoints: 0, wonShield: false, message: '' };
  }

  soundSynth.playCompletionChime();
  haptic.vibrateLight();
  triggerCelebrationConfetti();

  return reward;
}

// Award general points with atomic UserState, Streak, and DailyLog updates
export async function awardGeneralPoints(
  basePoints: number,
  title: string,
  dailyLogUpdates?: Partial<DailyLog>
): Promise<RewardResult> {
  const reward = rollDopamineLottery(basePoints);
  const totalEarned = reward.basePoints + reward.bonusPoints;
  reward.message = `✨ مبارك! ${title} (+${totalEarned} نقطة)`;

  let didAward = false;
  await db.transaction('rw', [db.user_state, db.daily_logs], async () => {
    const user = await db.user_state.get('current_user');
    if (!user) return;
    didAward = true;

    const graceActive = user.settings?.fajrGracePeriodActive ?? true;
    const bioDate = getBiologicalDate(graceActive);
    const todayLog = await db.daily_logs.get(bioDate);
    const streakUpdates = computeStreakProgress(user, bioDate, reward.wonShield);

    const updatedUserState: UserState = {
      ...user,
      ...streakUpdates,
      totalPoints: user.totalPoints + totalEarned,
      criticalBonusesWon:
        reward.bonusPoints > 0 || reward.wonShield
          ? user.criticalBonusesWon + 1
          : user.criticalBonusesWon,
    };
    await db.user_state.put(updatedUserState);

    await upsertDailyLog(bioDate, {
      ...dailyLogUpdates,
      pointsEarned: (todayLog?.pointsEarned || 0) + totalEarned,
    });
  });

  if (!didAward) {
    return { basePoints: 0, bonusPoints: 0, wonShield: false, message: '' };
  }

  soundSynth.playCompletionChime();
  haptic.vibrateLight();
  triggerCelebrationConfetti();

  return reward;
}

// Calculate spendable balance without touching lifetime totalPoints or streaks
export function getSpendablePoints(user?: UserState | null): number {
  if (!user) return 0;
  return Math.max(0, user.totalPoints - (user.spentPoints || 0));
}

export interface RedeemRewardResult {
  success: boolean;
  message: string;
  record?: RedeemedRewardRecord;
}

// Redeem a real-life reward using points
export async function redeemReward(
  reward: RealLifeRewardItem,
  note?: string
): Promise<RedeemRewardResult> {
  let result: RedeemRewardResult = {
    success: false,
    message: 'لم يتم العثور على بيانات المستخدم',
  };

  await db.transaction('rw', [db.user_state, db.redeemed_rewards], async () => {
    const user = await db.user_state.get('current_user');
    if (!user) return;

    const spendable = getSpendablePoints(user);
    if (spendable < reward.pointsCost) {
      result = {
        success: false,
        message: `رصيد نقاطك المتاحة (${spendable} نقطة) لا يكفي لاستبدال هذه المكافأة (${reward.pointsCost} نقطة). واصل إنجازك! 🚀`,
      };
      return;
    }

    const record: RedeemedRewardRecord = {
      id: `redeem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      rewardId: reward.id,
      title: reward.title,
      pointsSpent: reward.pointsCost,
      redeemedAt: new Date().toISOString(),
      category: reward.category,
      emoji: reward.emoji,
      note: note?.trim() || undefined,
    };

    await db.redeemed_rewards.add(record);

    const updatedSpent = (user.spentPoints || 0) + reward.pointsCost;
    await db.user_state.update('current_user', {
      spentPoints: updatedSpent,
    });

    result = {
      success: true,
      message: `🎉 مبارك! تم استبدال "${reward.title}" بنجاح! حان وقت الاستمتاع بها دون أدنى شعور بالذنب!`,
      record,
    };
  });

  if (result.success) {
    // Dopamine feedback: Chime, haptic, confetti
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    triggerCelebrationConfetti();
  }

  return result;
}

// Add a custom real-life reward to the wishlist
export async function addCustomReward(
  data: Omit<RealLifeRewardItem, 'id' | 'createdAt'>
): Promise<RealLifeRewardItem> {
  const item: RealLifeRewardItem = {
    ...data,
    id: `custom_reward_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  await db.custom_rewards.add(item);
  soundSynth.playTactileClick();
  haptic.vibrateLight();
  return item;
}

// Delete custom reward
export async function deleteCustomReward(rewardId: string): Promise<void> {
  await db.custom_rewards.delete(rewardId);
  soundSynth.playTactileClick();
  haptic.vibrateLight();
}

export interface ConsistencyRingStats {
  daysCompleted: number;
  totalWindowDays: number;
  percentage: number;
  consistencyStatus: 'elite' | 'steady' | 'building' | 'reigniting';
  messageAr: string;
  messageEn: string;
}

// 14-Day Rolling Consistency Ring (Non-Punitive Antidote to Streak Snapping)
export function calculate14DayConsistency(logs: DailyLog[] = []): ConsistencyRingStats {
  const windowDays = 14;
  const now = new Date();
  const past14Dates = new Set<string>();
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    past14Dates.add(formatLocalDate(d));
  }

  const logMap = new Map(logs.map((l) => [l.date, l]));
  let completedDays = 0;

  past14Dates.forEach((dateStr) => {
    const log = logMap.get(dateStr);
    if (
      log &&
      ((log.completedStations && log.completedStations.length >= 2) ||
        (log.pointsEarned && log.pointsEarned >= 30))
    ) {
      completedDays++;
    }
  });

  const percentage = Math.round((completedDays / windowDays) * 100);
  let consistencyStatus: ConsistencyRingStats['consistencyStatus'] = 'reigniting';
  let messageAr = 'ابدأ خطوة اليوم لتفعيل حلقة الالتزام';
  let messageEn = 'Take a step today to reignite your consistency ring';

  if (percentage >= 80) {
    consistencyStatus = 'elite';
    messageAr = `ثبات ذهبي استثنائي! حققت ${completedDays} من آخر 14 يوماً (${percentage}%)`;
    messageEn = `Elite consistency! ${completedDays} of past 14 days (${percentage}%)`;
  } else if (percentage >= 50) {
    consistencyStatus = 'steady';
    messageAr = `زخم رائع ومستمر! حققت ${completedDays} من آخر 14 يوماً (${percentage}%)`;
    messageEn = `Steady momentum! ${completedDays} of past 14 days (${percentage}%)`;
  } else if (percentage > 0) {
    consistencyStatus = 'building';
    messageAr = `قيد البناء! واصل لتثبيت العادة (${completedDays} من 14 يوماً)`;
    messageEn = `Building up! Keep going (${completedDays} of 14 days)`;
  }

  return {
    daysCompleted: completedDays,
    totalWindowDays: windowDays,
    percentage,
    consistencyStatus,
    messageAr,
    messageEn,
  };
}

