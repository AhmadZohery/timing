import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Settings2,
  Check,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

export interface PrayerQadaaItem {
  total: number;
  completed: number;
}

export interface QadaaState {
  fajr: PrayerQadaaItem;
  dhuhr: PrayerQadaaItem;
  asr: PrayerQadaaItem;
  maghrib: PrayerQadaaItem;
  isha: PrayerQadaaItem;
  dailyPaceTarget: number;
  lastUpdated: string;
}

const DEFAULT_QADAA: QadaaState = {
  fajr: { total: 30, completed: 0 },
  dhuhr: { total: 30, completed: 0 },
  asr: { total: 30, completed: 0 },
  maghrib: { total: 30, completed: 0 },
  isha: { total: 30, completed: 0 },
  dailyPaceTarget: 5,
  lastUpdated: new Date().toISOString(),
};

const STORAGE_KEY = 'midmar_qadaa_state_v1';

export const QadaaPrayerTracker: React.FC<{
  onRewardToast?: (msg: string) => void;
}> = ({ onRewardToast }) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [qadaa, setQadaa] = useState<QadaaState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_QADAA;
    } catch {
      return DEFAULT_QADAA;
    }
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Save changes
  const saveState = (newState: QadaaState) => {
    setQadaa(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  // Perform +1 Qadaa Repayment
  const handleLogRepayment = (prayerKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', prayerNameAr: string) => {
    const item = qadaa[prayerKey];
    if (item.completed >= item.total) {
      soundSynth.playCompletionChime();
      return;
    }

    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();

    const updated: QadaaState = {
      ...qadaa,
      [prayerKey]: {
        ...item,
        completed: item.completed + 1,
      },
      lastUpdated: new Date().toISOString(),
    };

    saveState(updated);

    if (onRewardToast) {
      const rem = item.total - (item.completed + 1);
      onRewardToast(
        isAr
          ? `تقبّل الله قضاء ${prayerNameAr}! تبقّى في ذمتك (${rem}) صلاة (+10 XP) 🌿`
          : `Logged 1 Qadaa for ${prayerKey}! Remaining: ${rem} (+10 XP)`
      );
    }
  };

  // Undo -1
  const handleUndo = (prayerKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => {
    const item = qadaa[prayerKey];
    if (item.completed <= 0) return;

    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const updated: QadaaState = {
      ...qadaa,
      [prayerKey]: {
        ...item,
        completed: item.completed - 1,
      },
      lastUpdated: new Date().toISOString(),
    };

    saveState(updated);
  };

  // Apply Quick Preset (e.g. 7 days, 30 days, 365 days)
  const handleApplyPresetDays = (days: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const updated: QadaaState = {
      ...qadaa,
      fajr: { total: days, completed: Math.min(qadaa.fajr.completed, days) },
      dhuhr: { total: days, completed: Math.min(qadaa.dhuhr.completed, days) },
      asr: { total: days, completed: Math.min(qadaa.asr.completed, days) },
      maghrib: { total: days, completed: Math.min(qadaa.maghrib.completed, days) },
      isha: { total: days, completed: Math.min(qadaa.isha.completed, days) },
      lastUpdated: new Date().toISOString(),
    };

    saveState(updated);
    setIsConfigOpen(false);
  };

  const prayers = [
    { key: 'fajr' as const, nameAr: 'الفجر', nameEn: 'Fajr', rakats: 2, icon: '🌄', color: 'indigo' },
    { key: 'dhuhr' as const, nameAr: 'الظهر', nameEn: 'Dhuhr', rakats: 4, icon: '☀️', color: 'amber' },
    { key: 'asr' as const, nameAr: 'العصر', nameEn: 'Asr', rakats: 4, icon: '🌇', color: 'orange' },
    { key: 'maghrib' as const, nameAr: 'المغرب', nameEn: 'Maghrib', rakats: 3, icon: '🌆', color: 'rose' },
    { key: 'isha' as const, nameAr: 'العشاء', nameEn: 'Isha', rakats: 4, icon: '🌙', color: 'purple' },
  ];

  const totalOwed = prayers.reduce((acc, p) => acc + qadaa[p.key].total, 0);
  const totalCleared = prayers.reduce((acc, p) => acc + qadaa[p.key].completed, 0);
  const totalRemaining = Math.max(0, totalOwed - totalCleared);
  const percentage = totalOwed > 0 ? Math.round((totalCleared / totalOwed) * 100) : 100;

  const daysToFinish = qadaa.dailyPaceTarget > 0 ? Math.ceil(totalRemaining / qadaa.dailyPaceTarget) : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Header & Hadith */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 text-white space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  {isAr ? 'سجل إبراء الذمة وقضاء الفوائت' : 'Qadaa & Debt Clearance Tracker'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black">
                  {percentage}% {isAr ? 'مُبرأ' : 'Cleared'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {isAr ? 'حاسبة قضاء الصلوات الفائتة' : 'Missed Prayers Debt Repayment'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setIsConfigOpen(!isConfigOpen);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'ضبط الرصيد والهدف' : 'Configure Debt'}</span>
          </button>
        </div>

        {/* Hadith Quote */}
        <blockquote className="p-3 rounded-2xl bg-black/40 border border-emerald-500/20 text-xs sm:text-sm text-emerald-100 font-serif leading-relaxed">
          عَنْ عَبْدِ اللَّهِ بْنِ عَبَّاسٍ رَضِيَ اللَّهُ عَنْهُمَا أَنَّ رَسُولَ اللَّهِ ﷺ قَالَ:
          <br />
          «<strong className="text-amber-300">فَدَيْنُ اللَّهِ أَحَقُّ أَنْ يُقْضَى</strong>»
          <span className="text-[10px] text-emerald-300/70 block mt-1 font-sans">
            (صحيح البخاري: 1953، صحيح مسلم: 1148)
          </span>
        </blockquote>

        {/* Progress Bar & ETA */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-200">
            <span>
              {isAr ? 'إجمالي ما أُبرئ من الذمة:' : 'Total Debt Cleared:'}{' '}
              <strong className="text-white font-mono font-black">{totalCleared}</strong>{' '}
              {isAr ? 'صلاة من أصل' : 'of'}{' '}
              <span className="font-mono">{totalOwed}</span>
            </span>
            <span className="font-mono text-amber-300">{totalRemaining} {isAr ? 'متبقية' : 'left'}</span>
          </div>

          <div className="w-full h-3 rounded-full bg-black/50 overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {daysToFinish > 0 && totalRemaining > 0 && (
            <p className="text-[11px] text-emerald-300/80 font-medium">
              💡 {isAr
                ? `بمعدلك المستهدف (${qadaa.dailyPaceTarget} صلوات يومياً)، تبرأ ذمتك بإذن الله خلال قرابة ${daysToFinish} يوماً.`
                : `At your target pace of ${qadaa.dailyPaceTarget} prayers/day, you will complete in ~${daysToFinish} days.`}
            </p>
          )}
        </div>
      </div>

      {/* Configuration Drawer */}
      {isConfigOpen && (
        <div className="p-4 rounded-3xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 animate-fade-in shadow-sm">
          <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'تحديد عدد الأيام/الصلوات الواجب قضاؤها' : 'Set Total Days to Repay'}</span>
          </h4>

          <div className="flex flex-wrap items-center gap-2">
            {[7, 30, 90, 180, 365].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleApplyPresetDays(d)}
                className="py-1.5 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:border-emerald-500 transition-all cursor-pointer"
              >
                {d === 7
                  ? isAr ? 'أسبوع (7 أيام)' : '1 Week'
                  : d === 30
                  ? isAr ? 'شهر (30 يوماً)' : '1 Month'
                  : d === 90
                  ? isAr ? '3 أشهر' : '3 Months'
                  : d === 180
                  ? isAr ? '6 أشهر' : '6 Months'
                  : isAr ? 'سنة كاملة (365 يوماً)' : '1 Year'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-slate-600 dark:text-zinc-400 font-bold">
              {isAr ? 'المعدل اليومي المستهدف:' : 'Daily Target Repayments:'}
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 5, 10].map((pace) => (
                <button
                  key={pace}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    saveState({ ...qadaa, dailyPaceTarget: pace });
                  }}
                  className={`py-1 px-2.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    qadaa.dailyPaceTarget === pace
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-zinc-800 border text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {pace} {isAr ? 'يومياً' : '/day'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5 Prayers Repayment Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {prayers.map((prayer) => {
          const item = qadaa[prayer.key];
          const remaining = Math.max(0, item.total - item.completed);
          const isDone = remaining === 0 && item.total > 0;

          return (
            <div
              key={prayer.key}
              className={`p-3.5 sm:p-4 rounded-3xl border transition-all flex flex-col justify-between gap-3 shadow-xs ${
                isDone
                  ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{prayer.icon}</span>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-zinc-100">
                      {isAr ? prayer.nameAr : prayer.nameEn}
                    </h5>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {prayer.rakats} {isAr ? 'ركعات' : 'Rakats'}
                    </span>
                  </div>
                </div>

                {isDone ? (
                  <span className="p-1 rounded-full bg-emerald-500 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-black text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10">
                    {remaining} {isAr ? 'باقٍ' : 'left'}
                  </span>
                )}
              </div>

              {/* Counter Numbers */}
              <div className="text-center py-1">
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  <span className="text-emerald-600 dark:text-emerald-400">{item.completed}</span>
                  <span className="text-slate-300 dark:text-zinc-700 text-base"> / </span>
                  <span className="text-slate-500 dark:text-zinc-400 text-lg">{item.total}</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {isAr ? 'صلوات مقضية' : 'Repaid prayers'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => handleUndo(prayer.key)}
                  disabled={item.completed <= 0}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-600 dark:text-zinc-400 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
                  title={isAr ? 'تراجع عن واحدة' : 'Undo 1'}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleLogRepayment(prayer.key, isAr ? prayer.nameAr : prayer.nameEn)}
                  disabled={isDone}
                  className={`tap-spring flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isDone
                      ? 'bg-emerald-600/30 text-emerald-400 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? '+1 قضاء' : '+1 Repaid'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Practical Fiqh Advice Banner */}
      <div className="p-4 rounded-3xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 space-y-2">
        <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span>{isAr ? 'كيف تقضي فوائتك بيسر دون مشقة؟' : 'How to Repay Missed Prayers Easily'}</span>
        </h4>
        <div className="text-[11px] text-slate-700 dark:text-zinc-300 space-y-1 leading-relaxed">
          <p>
            • <strong>طريقة الفرض مع الفرض:</strong> صلِّ مع كل صلاة حاضرة فريضة فائتة من جنسها (فجر مع فجر، ظهر مع ظهر). هذا يضمن لك قضاء يوم كامل كل ٢٤ ساعة دون إجهاد.
          </p>
          <p>
            • <strong>جلسة السرد المجمّعة:</strong> يمكنك في وقت فراغك سرد صلوات يوم كامل مرتبة (فجر ثم ظهر ثم عصر ثم مغرب ثم عشاء) في جلسة واحدة مدتها قرابة ٢٠ دقيقة.
          </p>
          <p>
            • <strong>أوقات الكراهة:</strong> يصح قضاء الصلوات المفروضة الفائتة في جميع الأوقات بلا كراهة لقوله ﷺ: «مَنْ نَسِيَ صَلَاةً فَلْيُصَلِّهَا إِذَا ذَكَرَهَا».
          </p>
        </div>
      </div>
    </div>
  );
};
