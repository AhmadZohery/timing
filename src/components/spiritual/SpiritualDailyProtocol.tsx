import React, { useState } from 'react';
import {
  BookOpen,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  Star,
  Heart,
  Sliders,
  Clock,
} from 'lucide-react';
import { awardSpiritualHabitPoints } from '../../utils/gamification';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import type { DailyLog, UserState, SpiritualWirdItem } from '../../types';
import {
  getActiveSpiritualWirds,
  updateDailyWirdProgress,
  calculateWirdEstimatedMinutes,
  SPIRITUAL_WIRD_PRESETS,
} from '../../utils/spiritualWirdEngine';
import {
  checkIsFridaySalawatWindow,
  updateDailyTasbihProgress,
  TASBIH_PRESETS,
  type TasbihPresetId,
} from '../../utils/tasbihEngine';
import { WirdCustomizerModal } from './WirdCustomizerModal';
import { ResonantAyaCapsule } from './ResonantAyaCapsule';

interface SpiritualDailyProtocolProps {
  todayLog: DailyLog | undefined;
  userState?: UserState | undefined;
  onRewardToast?: (msg: string) => void;
  onOpenSmartTasbih?: (mode?: TasbihPresetId) => void;
  className?: string;
}

export const SpiritualDailyProtocol: React.FC<SpiritualDailyProtocolProps> = ({
  todayLog,
  userState,
  onRewardToast,
  onOpenSmartTasbih,
  className = '',
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const activeWirds = getActiveSpiritualWirds(userState?.settings?.spiritualWirdConfig);
  const activePresetKey = userState?.settings?.spiritualWirdConfig?.activePreset || 'baqarah_only';
  const activePresetInfo = SPIRITUAL_WIRD_PRESETS[activePresetKey] || SPIRITUAL_WIRD_PRESETS.baqarah_only;

  // Daily Sunan completion states
  const yasinDone = todayLog?.surahYasinDone ?? false;
  const mulkDone = todayLog?.surahMulkDone ?? false;
  const qiyamDone = todayLog?.qiyamNightDone ?? false;
  const adhkarMorningDone = todayLog?.adhkarMorningDone ?? false;
  const adhkarEveningDone = todayLog?.adhkarEveningDone ?? false;
  const adhkarSleepDone = todayLog?.adhkarSleepDone ?? false;

  const handleCompleteHabit = async (
    key: 'yasin' | 'mulk' | 'qiyam' | 'adhkar_morning' | 'adhkar_evening' | 'adhkar_sleep',
    title: string
  ) => {
    const res = await awardSpiritualHabitPoints(key, title);
    if (onRewardToast && res.message) {
      onRewardToast(res.message);
    }
  };

  const handleWirdIncrement = async (wird: SpiritualWirdItem, pagesToAdd: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const res = await updateDailyWirdProgress(wird, pagesToAdd, todayLog);
    if (res.message && onRewardToast) {
      onRewardToast(res.message);
    }
  };

  // Calculate totals
  const totalTargetPages = activeWirds.reduce((acc, w) => acc + w.targetPages, 0);
  const totalPagesRead = activeWirds.reduce((acc, w) => {
    const item = todayLog?.customWirdProgress?.[w.id];
    const pages =
      item?.pagesRead ??
      (w.id === 'wird_baqarah' ? (todayLog?.baqarahProgress?.pagesRead ?? 0) : 0);
    return acc + pages;
  }, 0);
  const allWirdsCompleted = activeWirds.every((w) => {
    const item = todayLog?.customWirdProgress?.[w.id];
    return item?.completed || (w.id === 'wird_baqarah' && todayLog?.baqarahProgress?.completed);
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Harmonic Aya Contextual Resonance Capsule */}
      <ResonantAyaCapsule onRewardToast={onRewardToast} />

      {/* 1. Master Spiritual Wird Cockpit Header & Cards */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-white via-slate-50/90 to-emerald-50/40 dark:from-zinc-900 dark:via-zinc-900/95 dark:to-emerald-950/20 border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-4 backdrop-blur-xl">
        {/* Cockpit Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? activePresetInfo.titleAr : activePresetInfo.titleEn}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold">
                  {activePresetInfo.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {activePresetInfo.hadithAr || activePresetInfo.descriptionAr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Wird Customizer Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              title={isAr ? 'تخصيص السور والأوراد' : 'Customize Quran Wird'}
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'تخصيص الورد ⚙️' : 'Customize ⚙️'}</span>
            </button>

            {allWirdsCompleted && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'أُنجز الورد اليوم ✔' : 'Done ✔'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Global Progress Pill */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/50 p-2 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px]">{isAr ? 'إجمالي الصفحات المنجزة اليوم:' : 'Total Pages Today:'}</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs font-black">
              {totalPagesRead} / {totalTargetPages} {isAr ? 'صفحة' : 'pages'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono">
              {totalTargetPages > 0 ? Math.round((totalPagesRead / totalTargetPages) * 100) : 0}%
            </span>
            <div className="w-20 sm:w-28 h-2 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-300"
                style={{
                  width: `${totalTargetPages > 0 ? Math.min(100, (totalPagesRead / totalTargetPages) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Individual Wird Cards Grid (Al-Baqarah, Al-Imran, Custom Surahs) */}
        <div className="space-y-3">
          {activeWirds.map((wird) => {
            const currentItem = todayLog?.customWirdProgress?.[wird.id];
            const pages =
              currentItem?.pagesRead ??
              (wird.id === 'wird_baqarah' ? (todayLog?.baqarahProgress?.pagesRead ?? 0) : 0);
            const isDone =
              currentItem?.completed ??
              (wird.id === 'wird_baqarah' ? (todayLog?.baqarahProgress?.completed ?? false) : false);

            const pct = Math.min(100, Math.round((pages / wird.targetPages) * 100));
            const pagesLeft = Math.max(0, wird.targetPages - pages);
            const estMinLeft = calculateWirdEstimatedMinutes(pagesLeft);

            // Step chunks for quick increments
            const stepChunk = Math.max(1, Math.round(wird.targetPages / 4));

            return (
              <div
                key={wird.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/50 shadow-2xs'
                    : 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700/80 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-zinc-100">
                      {wird.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                      +{wird.pointsReward} {isAr ? 'نقطة' : 'pts'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {!isDone && (
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono hidden sm:inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>~{estMinLeft} {isAr ? 'دقيقة متبقية' : 'min left'}</span>
                      </span>
                    )}

                    {isDone ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isAr ? 'مكتملة اليوم' : 'Done'}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleWirdIncrement(wird, wird.targetPages)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-all shadow-2xs active:scale-95"
                      >
                        {isAr ? 'تمت كاملة ✔' : 'Mark Full'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 font-medium">
                    <span className="text-[11px]">{isAr ? 'صفحات القراءة:' : 'Progress:'}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                      {pages} / {wird.targetPages} {isAr ? 'صفحة' : 'pages'} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-700/80 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Quick Increment Buttons */}
                  {!isDone && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handleWirdIncrement(wird, 1)}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-700 hover:bg-emerald-50 text-[11px] font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer"
                      >
                        +1 {isAr ? 'صفحة' : 'p'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWirdIncrement(wird, 5)}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-700 hover:bg-emerald-50 text-[11px] font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer"
                      >
                        +5 {isAr ? 'صفحات' : 'pages'}
                      </button>
                      {stepChunk > 5 && (
                        <button
                          type="button"
                          onClick={() => handleWirdIncrement(wird, stepChunk)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-700 hover:bg-emerald-50 text-[11px] font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer"
                        >
                          +{stepChunk} {isAr ? 'صفحة (ربع)' : 'quarter'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Surah Yasin, Surah Al-Mulk, Qiyam Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Surah Yasin (Morning) */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            yasinDone
              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-600/30'
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                {isAr ? 'سورة يس (صباحاً)' : 'Surah Yasin (Morning)'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100/60 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">
              +15 {isAr ? 'نقطة' : 'pts'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
            {isAr ? 'قلب القرآن وتيسير شؤون اليوم والبركة.' : 'Heart of Quran for morning ease & barakah.'}
          </p>
          {yasinDone ? (
            <div className="w-full py-1.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-center text-xs font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAr ? 'أُنجزت اليوم ✔' : 'Completed ✔'}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleCompleteHabit('yasin', isAr ? 'سورة يس' : 'Surah Yasin')}
              className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              {isAr ? 'تمت القراءة ☀️' : 'Mark Read ☀️'}
            </button>
          )}
        </div>

        {/* Surah Al-Mulk (Night) */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            mulkDone
              ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-600/30'
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                {isAr ? 'سورة الملك (ليلاً)' : 'Surah Al-Mulk (Night)'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/60 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded">
              +15 {isAr ? 'نقطة' : 'pts'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
            {isAr ? 'المانعة والمنجية من عذاب القبر والشفيعة لصاحبها.' : 'Protection in the grave & night peace.'}
          </p>
          {mulkDone ? (
            <div className="w-full py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-center text-xs font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isAr ? 'أُنجزت اليوم ✔' : 'Completed ✔'}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleCompleteHabit('mulk', isAr ? 'سورة الملك' : 'Surah Al-Mulk')}
              className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              {isAr ? 'تمت القراءة 🌙' : 'Mark Read 🌙'}
            </button>
          )}
        </div>

        {/* Qiyam Al-Layl & Witr */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            qiyamDone
              ? 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-300 dark:border-purple-600/30'
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                {isAr ? 'قيام الليل والوتر' : 'Qiyam & Witr'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-100/60 dark:bg-purple-500/20 px-1.5 py-0.5 rounded">
              +30 {isAr ? 'نقطة' : 'pts'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
            {isAr ? 'شرف المؤمن وساعة الاستجابة في الثلث الأخير.' : 'The honor of believers in the night.'}
          </p>
          {qiyamDone ? (
            <div className="w-full py-1.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 text-center text-xs font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              <span>{isAr ? 'تقبل الله قيامك ✔' : 'Accepted ✔'}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleCompleteHabit('qiyam', isAr ? 'قيام الليل والوتر' : 'Qiyam Al-Layl')}
              className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              {isAr ? 'صليت القيام 🌌' : 'Mark Prayed 🌌'}
            </button>
          )}
        </div>
      </div>

      {/* 3. Core Daily Tasbih & Baqiyat Salihat Cards ("أوراد التسبيح الكبرى والباقيات الصالحات") */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📿</span>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {isAr ? 'أوراد التسبيح الكبرى والباقيات الصالحات' : 'Core Daily Tasbih & Virtues'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'حرز اليوم الأكبر، خفيفتان ثقيلتان، الباقيات الصالحات، والصلاة الإبراهيمية'
                  : 'Daily 100x Tahlil, Baqiyat Salihat, and Salawat'}
              </p>
            </div>
          </div>

          {onOpenSmartTasbih && (
            <button
              type="button"
              onClick={() => onOpenSmartTasbih()}
              className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[11px] font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-100 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{isAr ? 'فتح المسبحة اللمسية 📿' : 'Open Masbaha 📿'}</span>
            </button>
          )}
        </div>

        {/* Friday Celebration Banner if active */}
        {(() => {
          const fridayStatus = checkIsFridaySalawatWindow(new Date(), userState?.settings?.prayerLocation);
          if (fridayStatus.isWindow) {
            return (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">🕌</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block truncate">
                      {fridayStatus.titleAr}
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-zinc-300 block truncate">
                      {fridayStatus.descriptionAr}
                    </span>
                  </div>
                </div>
                {onOpenSmartTasbih && (
                  <button
                    type="button"
                    onClick={() => onOpenSmartTasbih('salawat_ibrahimiyyah')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
                  >
                    {isAr ? 'الورد الإبراهيمي 🌸' : 'Salawat'}
                  </button>
                )}
              </div>
            );
          }
          return null;
        })()}

        {/* 4 Core Dhikr Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(
            [
              'tahlil_100',
              'tasbih_khafifatan',
              'baqiyat_salihat',
              'salawat_ibrahimiyyah',
            ] as TasbihPresetId[]
          ).map((presetKey) => {
            const preset = TASBIH_PRESETS[presetKey];
            const target = preset.stages[0]?.target || 100;
            const record = todayLog?.tasbihDailyProgress?.[presetKey];
            const isDone = record?.completed ?? false;
            const currentCount = record?.count || 0;

            return (
              <div
                key={presetKey}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                  isDone
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{preset.icon}</span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100">
                          {isAr ? preset.titleAr : preset.titleEn}
                        </h4>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {preset.badgeAr}
                        </span>
                      </div>
                    </div>
                    {isDone ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isAr ? 'تم الورد' : 'Done'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 shrink-0">
                        {currentCount > 0 ? `${currentCount} / ${target}` : `الهدف: ${target}`}
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                    {preset.descriptionAr}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80 gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    +{preset.pointsReward} XP
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Launch in Tactile Masbaha */}
                    {onOpenSmartTasbih && (
                      <button
                        type="button"
                        onClick={() => onOpenSmartTasbih(presetKey)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>📿</span>
                        <span>{isAr ? 'السبحة' : 'Masbaha'}</span>
                      </button>
                    )}

                    {/* Quick Direct Mark Done */}
                    <button
                      type="button"
                      onClick={async () => {
                        soundSynth.playCompletionChime();
                        haptic.vibrateSprintCelebration();
                        const res = await updateDailyTasbihProgress(presetKey, target, target);
                        if (onRewardToast && res.message) {
                          onRewardToast(res.message);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isDone ? (isAr ? 'مكتمل ✔' : 'Done') : (isAr ? 'تم الورد' : 'Mark')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Daily Adhkar Ribbon */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
            {isAr ? 'حصن المسلم والأذكار اليومية:' : 'Daily Adhkar & Remembrances:'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Morning Adhkar */}
          <button
            type="button"
            onClick={() => handleCompleteHabit('adhkar_morning', isAr ? 'أذكار الصباح' : 'Morning Adhkar')}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              adhkarMorningDone
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-amber-400'
            }`}
          >
            {adhkarMorningDone ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            <span>{isAr ? 'أذكار الصباح' : 'Morning'}</span>
            <span className="text-[10px] text-amber-600 font-normal">+15</span>
          </button>

          {/* Evening Adhkar */}
          <button
            type="button"
            onClick={() => handleCompleteHabit('adhkar_evening', isAr ? 'أذكار المساء' : 'Evening Adhkar')}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              adhkarEveningDone
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
                : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-indigo-400'
            }`}
          >
            {adhkarEveningDone ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            <span>{isAr ? 'أذكار المساء' : 'Evening'}</span>
            <span className="text-[10px] text-indigo-600 font-normal">+15</span>
          </button>

          {/* Sleep Adhkar */}
          <button
            type="button"
            onClick={() => handleCompleteHabit('adhkar_sleep', isAr ? 'أذكار النوم' : 'Sleep Adhkar')}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              adhkarSleepDone
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300'
                : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-purple-400'
            }`}
          >
            {adhkarSleepDone ? <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> : <Star className="w-3.5 h-3.5 text-purple-500" />}
            <span>{isAr ? 'أذكار النوم' : 'Sleep'}</span>
            <span className="text-[10px] text-purple-600 font-normal">+15</span>
          </button>
        </div>
      </div>

      {/* Wird Customizer Modal */}
      <WirdCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        userState={userState}
        onRewardToast={onRewardToast}
      />
    </div>
  );
};
