import React, { useState, useMemo } from 'react';
import {
  X,
  Flame,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import type { DailyLog, UserState } from '../../types';
import { PERSONA_CONFIGS } from '../../utils/lifestyleEngine';

export interface WeeklyBarakahReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState?: UserState;
  dailyLogs: DailyLog[];
  todayLog?: DailyLog;
}

export const WeeklyBarakahReportModal: React.FC<WeeklyBarakahReportModalProps> = ({
  isOpen,
  onClose,
  userState,
  dailyLogs,
  todayLog,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [copied, setCopied] = useState(false);
  const [hideWorshipDetails, setHideWorshipDetails] = useState(false);

  // 1. Sort logs descending by date, combining todayLog if not yet persisted
  const sortedLogs = useMemo(() => {
    const list = [...(dailyLogs || [])];
    if (todayLog && !list.some((l) => l.date === todayLog.date)) {
      list.push(todayLog);
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [dailyLogs, todayLog]);

  // 2. Compute true last 7 days metrics
  const weeklyData = useMemo(() => {
    const last7 = sortedLogs.slice(0, 7);
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

    let totalFocusMins = 0;
    let totalFocusSessions = 0;
    let totalQuranPages = 0;
    let totalPrayersOnTime = 0;
    let totalPrayersInGroup = 0;
    let totalPrayersExcused = 0;
    let totalSunnahRakats = 0;
    let totalWorkouts = 0;
    let totalSleepSum = 0;
    let sleepDaysCount = 0;

    last7.forEach((log) => {
      // Focus
      totalFocusMins += log.totalFocusMinutes || (log.focusSessionsCount || 0) * 20;
      totalFocusSessions += log.focusSessionsCount || (log.totalFocusMinutes ? Math.round(log.totalFocusMinutes / 20) : 0);

      // Quran
      const pages =
        (log.customWirdProgress
          ? Object.values(log.customWirdProgress).reduce((acc, it) => acc + (it.pagesRead || 0), 0)
          : 0) ||
        log.baqarahProgress?.pagesRead ||
        0;
      totalQuranPages += pages;

      // Prayers
      const prs = log.prayers || {};
      prayerNames.forEach((pn) => {
        const pRec = prs[pn];
        if (pRec) {
          if (pRec.status === 'in_group') totalPrayersInGroup += 1;
          if (pRec.status === 'on_time' || pRec.status === 'in_group') totalPrayersOnTime += 1;
          if (pRec.status === 'excused') totalPrayersExcused += 1;
          totalSunnahRakats += (pRec.sunnahQabliyahRakats || 0) + (pRec.sunnahBadiyahRakats || 0) + (pRec.witrRakats || 0);
        }
      });

      // Workouts
      if (log.workoutLog && log.workoutLog.length > 0) totalWorkouts += 1;

      // Sleep
      if (log.sleepHours && log.sleepHours > 0) {
        totalSleepSum += log.sleepHours;
        sleepDaysCount += 1;
      }
    });

    const daysCount = Math.max(1, last7.length);
    const possiblePrayers = daysCount * 5;
    const prayerConsistencyPct = Math.round((totalPrayersOnTime / possiblePrayers) * 100);
    const avgSleep = sleepDaysCount > 0 ? (totalSleepSum / sleepDaysCount).toFixed(1) : '7.0';
    const totalHasanat = totalQuranPages * 5500;
    const focusHours = (totalFocusMins / 60).toFixed(1);

    // Composite Barakah Index: 35% Prayer & Wird, 30% Deep Work, 20% Physical, 15% Sleep
    const prayerScore = Math.min(100, Math.round((totalPrayersOnTime / possiblePrayers) * 100));
    const workScore = Math.min(100, Math.round((totalFocusMins / (daysCount * 45)) * 100));
    const physicalScore = Math.min(100, Math.round((totalWorkouts / Math.min(5, daysCount)) * 100));
    const sleepScore = Math.min(100, Math.round((Number(avgSleep) / 7.5) * 100));

    const barakahIndex = Math.min(
      100,
      Math.max(
        15,
        Math.round(prayerScore * 0.35 + workScore * 0.3 + physicalScore * 0.2 + sleepScore * 0.15)
      )
    );

    return {
      daysCount,
      totalFocusMins,
      totalFocusSessions,
      focusHours,
      totalQuranPages,
      totalHasanat,
      totalPrayersOnTime,
      totalPrayersInGroup,
      totalPrayersExcused,
      totalSunnahRakats,
      prayerConsistencyPct,
      totalWorkouts,
      avgSleep,
      barakahIndex,
    };
  }, [sortedLogs]);

  if (!isOpen) return null;

  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const persona = PERSONA_CONFIGS[personaId] || PERSONA_CONFIGS.builder_exec;
  const streakDays = userState?.streakDays || 1;
  const shields = userState?.streakShields || 0;

  // Formatted Ticket Copy
  const copyWeeklyTicket = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const worshipTxt = hideWorshipDetails
      ? (isAr ? '🌿 الركيزة الإيمانية: مستمرة بحمد الله وفضله (سرائر مباركة بين العبد وربه 🤍)' : '🌿 Spiritual Core: Fulfilled with gratitude & sincere devotions 🤍')
      : (isAr
          ? `🕌 الصلوات المكتوبة: ${weeklyData.totalPrayersOnTime} صلاة في وقتها (${weeklyData.totalPrayersInGroup} في جماعة)\n📖 الورد القرآني: ${weeklyData.totalQuranPages} صفحة (+~${weeklyData.totalHasanat.toLocaleString()} حسنة مضاعفة مقدرة)`
          : `🕌 Prayers: ${weeklyData.totalPrayersOnTime} on-time (${weeklyData.totalPrayersInGroup} in congregation)\n📖 Quran Wird: ${weeklyData.totalQuranPages} pages (~${weeklyData.totalHasanat.toLocaleString()} estimated Hasanat)`);

    const text = isAr
      ? `📊 بطاقة حصاد البركة الأسبوعي من «مِضمار» (LifeOS)
👤 نمط المسار: ${persona.titleAr}
🔥 شعلة الاستمرارية: ${streakDays} أيام متواصلة (دروع حماية: ${shields})
💎 مؤشر نقاء وبركة الأسبوع: ${weeklyData.barakahIndex}%

🏆 حصاد الأيام السبعة:
${worshipTxt}
⚡ ساعات العمل العميق: ${weeklyData.focusHours} ساعة تركيز صافية (${weeklyData.totalFocusSessions} جلسة)
🏋️ النشاط البدني والقوة: ${weeklyData.totalWorkouts} حصص تدريبية
🌙 متوسط النوم والاستشفاء: ${weeklyData.avgSleep} ساعة / ليلة

«اللَّهُمَّ بَارِكْ لَنَا فِي أَوْقَاتِنَا وَأَعْمَالِنَا وَسَعْيِنَا»
#مِضمار #إتقان_وبركة`
      : `📊 Weekly Barakah & Velocity Harvest Report (Midmar LifeOS)
👤 Lifestyle Persona: ${persona.titleEn}
🔥 Consistency Streak: ${streakDays} days active (Shields: ${shields})
💎 Weekly Barakah Index: ${weeklyData.barakahIndex}%

🏆 7-Day Harvest:
${worshipTxt}
⚡ Deep Focus Work: ${weeklyData.focusHours} hours (${weeklyData.totalFocusSessions} sprints)
🏋️ Strength & Movement: ${weeklyData.totalWorkouts} workout sessions
🌙 Rest & Recovery: ${weeklyData.avgSleep} hrs avg sleep / night

#Midmar #LifeOS #Barakah`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-white dark:bg-[#131520] border border-slate-200 dark:border-white/[0.12] shadow-2xl flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.08] bg-gradient-to-r from-purple-500/10 via-emerald-500/10 to-amber-500/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold shrink-0">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isAr ? 'تقرير حصاد البركة والسرعة الأسبوعي' : 'Weekly Barakah & Velocity Harvest Report'}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                  {isAr ? 'آخر 7 أيام' : 'Last 7 Days'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {isAr
                  ? 'رؤية شمولية تزن الإيمان والعمل العميق والجسد دون لوم أو إجهاد'
                  : 'Holistic evaluation synthesizing Deen, Deep Work, and Physical Vitality'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {/* Top Hero: Weekly Barakah Index Score */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-950/70 via-[#18192a] to-emerald-950/60 border border-purple-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md relative overflow-hidden">
            <div className="space-y-1.5 z-10">
              <span className="text-[11px] font-mono text-purple-300 font-bold uppercase tracking-wider block">
                {isAr ? 'مؤشر التزكية وبركة الأسبوع' : 'Weekly Barakah Velocity Score'}
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <span>{weeklyData.barakahIndex}%</span>
                <span className="text-sm font-bold text-emerald-400">
                  {weeklyData.barakahIndex >= 85
                    ? (isAr ? '🌟 بركة وإتقان استثنائي' : 'Exceptional Flow')
                    : weeklyData.barakahIndex >= 65
                    ? (isAr ? '⚡ وتيرة قوية واستمرار مبارك' : 'Strong Momentum')
                    : (isAr ? '🛡️ ثبات مع الحفاظ على الأصول' : 'Resilient Baseline')}
                </span>
              </h4>
              <p className="text-xs text-slate-300/90 leading-relaxed max-w-md">
                {isAr
                  ? 'يجمع المؤشر التزامك بالصلوات وتلاوة القرآن، وساعات التركيز الصافية، والنشاط البدني ونقاء الاستشفاء.'
                  : 'Weighted composite tracking on-time prayers, Quran wird, deep work hours, and physical vitality.'}
              </p>
            </div>

            {/* Streak & Shields Mini Pills */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 z-10">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs font-mono">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                <span>{streakDays} {isAr ? 'أيام شعلة' : 'Days Streak'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>{shields} {isAr ? 'دروع حماية' : 'Shields'}</span>
              </div>
            </div>
          </div>

          {/* 4 Pillars Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Pillar 1: Quran & Hasanat */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.08] space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                  📖
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                  {isAr ? 'الورد القرآني' : 'Quran Wird'}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-lg sm:text-xl font-black text-slate-950 dark:text-white font-mono block">
                  {weeklyData.totalQuranPages} <span className="text-xs font-sans font-bold text-slate-500">{isAr ? 'صفحة' : 'pages'}</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono font-bold block truncate">
                  +{(weeklyData.totalHasanat).toLocaleString()} {isAr ? 'حسنة مقدرة' : 'Hasanat'}
                </span>
              </div>
            </div>

            {/* Pillar 2: Prayers On-Time & Group */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.08] space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">
                  🕌
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                  {isAr ? 'الصلوات والسنن' : 'Prayers & Sunnah'}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-lg sm:text-xl font-black text-slate-950 dark:text-white font-mono block">
                  {weeklyData.totalPrayersOnTime} <span className="text-xs font-sans font-bold text-slate-500">/ {weeklyData.daysCount * 5}</span>
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-mono font-bold block truncate">
                  {weeklyData.totalPrayersInGroup} {isAr ? 'في جماعة' : 'group'} • {weeklyData.totalSunnahRakats} {isAr ? 'ركعة سنة' : 'rakats'}
                </span>
              </div>
            </div>

            {/* Pillar 3: Deep Work Hours */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.08] space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center text-sm font-bold">
                  ⚡
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                  {isAr ? 'العمل والتركيز' : 'Deep Work'}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-lg sm:text-xl font-black text-slate-950 dark:text-white font-mono block">
                  {weeklyData.focusHours} <span className="text-xs font-sans font-bold text-slate-500">{isAr ? 'ساعة' : 'hours'}</span>
                </span>
                <span className="text-[10px] text-sky-700 dark:text-sky-300 font-mono font-bold block truncate">
                  {weeklyData.totalFocusSessions} {isAr ? 'شوط تركيز عميق' : 'sprints'}
                </span>
              </div>
            </div>

            {/* Pillar 4: Physical Strength & Workouts */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.08] space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-sm font-bold">
                  🏋️
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                  {isAr ? 'القوة واللياقة' : 'Physical Health'}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-lg sm:text-xl font-black text-slate-950 dark:text-white font-mono block">
                  {weeklyData.totalWorkouts} <span className="text-xs font-sans font-bold text-slate-500">{isAr ? 'جلسات' : 'sessions'}</span>
                </span>
                <span className="text-[10px] text-rose-700 dark:text-rose-300 font-mono font-bold block truncate">
                  {isAr ? `متوسط النوم ${weeklyData.avgSleep}س` : `${weeklyData.avgSleep}h avg sleep`}
                </span>
              </div>
            </div>
          </div>

          {/* Saturday Buffer Safety Valve Check */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-[#181924] border border-amber-200/90 dark:border-amber-500/25 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-base font-bold shrink-0">
                🛡️
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? 'صمام أمان بافر السبت (The 3-Hour Valve)' : 'Saturday Buffer Safety Valve'}
                </h5>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                  {isAr
                    ? 'طابور المهام المؤجلة للبافر فارغ بنجاح! السبت القادم هو أرباح ترفيه حر واستجمام 100% دون ذنب.'
                    : 'Buffer queue is clear! Enjoy pure bonus leisure dividends without breaking your streak.'}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
              {isAr ? 'أرباح ترفيه حر 🎉' : 'Free Dividends 🎉'}
            </span>
          </div>

          {/* Privacy & Tazkiyah Shield Toggle before Sharing */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🤍</span>
              <div>
                <span className="font-bold text-slate-800 dark:text-zinc-200 block text-xs">
                  {isAr ? 'درع سرائر العبادة (Tazkiyah Privacy Shield):' : 'Tazkiyah Privacy Shield:'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {isAr ? 'إخفاء تفاصيل الصلوات والصفحات عند نسخ البطاقة للمشاركة لمنع الرياء' : 'Mask prayer & Quran numbers when sharing to safeguard sincerity'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setHideWorshipDetails(!hideWorshipDetails);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                hideWorshipDetails
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
              }`}
            >
              {hideWorshipDetails ? (isAr ? 'مُفعّل 🔒' : 'Active 🔒') : (isAr ? 'عرض الكل' : 'Show All')}
            </button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-black/20 shrink-0">
          <button
            type="button"
            onClick={copyWeeklyTicket}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (isAr ? 'تم نسخ التقرير الأسبوعي بنجاح!' : 'Copied to Clipboard!') : (isAr ? 'نسخ بطاقة حصاد الأسبوع 📋' : 'Copy Weekly Pride Ticket 📋')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-200/80 dark:bg-white/[0.06] hover:bg-slate-300 dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
