import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Grid,
  Heart,
  Shield,
  Sliders,
} from 'lucide-react';
import type { QuranProgress, BookProgress, EnergyLevel, UserState, DailyLog } from '../../types';
import type { TasbihPresetId } from '../../utils/tasbihEngine';
import { db } from '../../db/db';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { CognitiveEnergyBarometer } from '../CognitiveEnergyBarometer';
import { QuranPageGridModal } from '../modals/QuranPageGridModal';
import { FlexibleQuranTrackerModal } from '../spiritual/FlexibleQuranTrackerModal';
import { useTranslation } from '../../i18n/LanguageContext';
import { ZeroTypingChips, ZERO_TYPING_PRESETS } from '../common/ZeroTypingChips';
import { resolveStationMetadata, PERSONA_CONFIGS } from '../../utils/lifestyleEngine';
import { WIRD_PRESETS, getActiveSpiritualWirds } from '../../utils/spiritualWirdEngine';
import { getDailyTadabburItem, type DailyTadabburItem } from '../../data/dailyTadabburData';
import confetti from 'canvas-confetti';
import { getBiologicalDate, upsertDailyLog, triggerCelebrationConfetti } from '../../utils/gamification';

interface CommuteMorningViewProps {
  quranProgress: QuranProgress | undefined;
  bookProgress: BookProgress | undefined;
  isSurvivalMode: boolean;
  isCompleted: boolean;
  onCompleteStation: () => void;
  onNextStation: () => void;
  energyLevel?: EnergyLevel;
  onSelectEnergyLevel: (level: EnergyLevel) => void;
  userState?: UserState;
  onOpenSmartTasbih?: (mode?: TasbihPresetId) => void;
  onOpenTadabburModal?: (item: DailyTadabburItem, tab: 'quran' | 'hadith') => void;
  onRewardToast?: (msg: string) => void;
  todayLog?: DailyLog;
}

export const CommuteMorningView: React.FC<CommuteMorningViewProps> = ({
  quranProgress,
  bookProgress,
  isSurvivalMode,
  isCompleted,
  onCompleteStation,
  onNextStation,
  energyLevel = 'high',
  onSelectEnergyLevel,
  userState,
  onOpenSmartTasbih,
  onOpenTadabburModal,
  onRewardToast,
  todayLog,
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [showGridModal, setShowGridModal] = useState(false);
  const [showFlexibleTrackerModal, setShowFlexibleTrackerModal] = useState(false);
  const [isQuoteSaved, setIsQuoteSaved] = useState(false);

  // Dynamic persona & station metadata
  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const persona = PERSONA_CONFIGS[personaId] || PERSONA_CONFIGS.builder_exec;
  const stationMeta = resolveStationMetadata(
    'COMMUTE_MORNING',
    personaId,
    userState?.settings?.stationCustomOverrides,
    isAr
  );

  // Dynamic Spiritual Wird config
  const wirdConfig = userState?.settings?.spiritualWirdConfig;
  const activeWirds = getActiveSpiritualWirds(wirdConfig);
  const activePresetKey = wirdConfig?.activePreset || 'baqarah_only';
  const wirdPreset = WIRD_PRESETS[activePresetKey] || WIRD_PRESETS.baqarah_only;
  const activeWirdTitle = activePresetKey === 'custom'
    ? (isAr ? 'الورد القرآني المخصص' : 'Custom Spiritual Wird')
    : (isAr ? wirdPreset?.titleAr || 'سورة البقرة' : wirdPreset?.titleEn || 'Surah Al-Baqarah');

  const totalWirdPages = activeWirds.reduce((acc: number, it: { targetPages: number }) => acc + (it.targetPages || 0), 0)
    || (quranProgress?.totalPages ?? 48);

  const currentWirdPages = Math.min(
    totalWirdPages,
    quranProgress?.currentPage ?? 0
  );

  const handleIncrementQuranPage = async () => {
    if (!quranProgress?.id) return;
    const nextPg = Math.min(quranProgress.totalPages, quranProgress.currentPage + 1);
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    await db.quran_progress.update(quranProgress.id, {
      currentPage: nextPg,
      lastUpdated: getBiologicalDate(),
    });

    const quranGoal = await db.goals.get('goal-quran');
    if (quranGoal) {
      await db.goals.update('goal-quran', {
        currentValue: Math.min(quranGoal.targetValue, nextPg),
      });
    }
  };

  const handleSelectSpecificPage = async (page: number) => {
    if (!quranProgress?.id) return;
    await db.quran_progress.update(quranProgress.id, {
      currentPage: page,
      lastUpdated: getBiologicalDate(),
    });

    const quranGoal = await db.goals.get('goal-quran');
    if (quranGoal) {
      await db.goals.update('goal-quran', {
        currentValue: Math.min(quranGoal.targetValue, page),
      });
    }
  };

  const handleIncrementBookPage = async () => {
    if (!bookProgress?.id) return;
    const nextPg = Math.min(bookProgress.totalPages, bookProgress.currentPage + 1);
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    await db.book_progress.update(bookProgress.id, {
      currentPage: nextPg,
      lastUpdated: getBiologicalDate(),
    });
  };

  const handleCompleteWithCelebration = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    try {
      const x = e.clientX ? e.clientX / window.innerWidth : 0.5;
      const y = e.clientY ? e.clientY / window.innerHeight : 0.6;
      confetti({ disableForReducedMotion: true,
        particleCount: 55,
        spread: 65,
        origin: { x, y },
        colors: ['#1eb814', '#bce8c2', '#fde6d8', '#e2defc'],
      });
    } catch {
      triggerCelebrationConfetti();
    }
    onCompleteStation();
  };

  const quranPercent = Math.round(
    (currentWirdPages / (totalWirdPages || 1)) * 100
  );

  const bookPercent = Math.round(
    ((bookProgress?.currentPage ?? 0) / (bookProgress?.totalPages ?? 1)) * 100
  );

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-5 transition-colors duration-200">
      {/* Habitline Obsidian Station Hero Banner */}
      <div className="celestial-obsidian-stage rounded-[28px] text-white p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-habit-green-ink text-white flex items-center justify-center shadow-lg shadow-[#1eb814]/25 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-bold border border-white/10">
                {isAr ? 'المحطة 1 من 8' : 'Station 1 of 8'}
              </span>
              <span className="text-[11px] text-zinc-300 font-bold">
                {persona.badge} • <span className="text-zinc-400 font-normal">{isAr ? 'الوقت المقترح:' : 'Suggested:'}</span>{' '}
                <bdi dir="ltr" className="font-mono tabular-nums text-[#bce8c2]">{stationMeta.shortTime}</bdi>
              </span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1eb814]/20 text-[#bce8c2] text-[10px] font-bold border border-[#1eb814]/30"
                title={isAr ? 'المحطة مفتوحة ومتاحة دائماً، والمقصود حظر مشتتات السوشيال ميديا أثناء الورد' : 'Focus protected from distractions'}
              >
                <Shield className="w-2.5 h-2.5" />
                <span>{isAr ? 'درع التركيز وحظر المشتتات 🛡️' : 'Focus Shield 🛡️'}</span>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">
              {isAr ? stationMeta.titleAr : stationMeta.titleEn}
            </h2>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
          {isCompleted && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-[#bce8c2] text-zinc-950 font-bold shadow-xs">
              {isAr ? 'مكتملة اليوم ✓' : 'Completed ✓'}
            </span>
          )}
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-[#bce8c2] text-zinc-950 font-mono font-bold tabular-nums shadow-sm">
            +10 XP
          </span>
        </div>
      </div>

      {/* Grid: Quran Tracker (Soft Mint) & Book Reader (Soft Lavender) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Dynamic Spiritual Wird Card — Emerald-Gold Mihrab Arch (Unified Hybrid) */}
        <div className="mihrab-emerald-arch p-5 sm:p-6 rounded-t-[44px] rounded-b-[28px] flex flex-col justify-between space-y-4 transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-sm shrink-0">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-amber-50">{activeWirdTitle}</h3>
                <span className="text-[11px] text-emerald-200 font-bold">
                  {wirdPreset?.badge || (isAr ? 'ورد اليوم المبارك' : 'Daily Wird')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setShowFlexibleTrackerModal(true);
                }}
                className="tap-spring min-h-[44px] px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                title={isAr ? 'تخصيص السورة والآيات والصفحات' : 'Customize Surah and range'}
              >
                <Sliders className="w-3 h-3" />
                <span>{isAr ? 'تخصيص الورد' : 'Customize'}</span>
              </button>

              <button
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setShowGridModal(true);
                }}
                className="tap-spring min-h-[44px] px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-[11px] font-bold border border-white/20 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Grid className="w-3 h-3 text-amber-300" />
                <span>{isAr ? `الخريطة` : `Grid`}</span>
              </button>
            </div>
          </div>

          {/* Surah & Ayah / Bookmark Range Indicator */}
          <div className="p-3.5 rounded-[20px] bg-white/10 border border-white/15 flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-white truncate">
                  📖 {quranProgress?.surah ? (quranProgress.surah.startsWith('سورة') ? quranProgress.surah : `سورة ${quranProgress.surah}`) : (isAr ? 'سورة البقرة' : 'Surah Al-Baqarah')}
                </span>
                {quranProgress?.startAyah && quranProgress?.endAyah && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#bce8c2] text-zinc-950 font-mono font-bold tabular-nums">
                    {isAr ? `آية ${quranProgress.startAyah} - ${quranProgress.endAyah}` : `Ayah ${quranProgress.startAyah}-${quranProgress.endAyah}`}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-emerald-100/80 block mt-0.5 truncate tabular-nums">
                {isAr
                  ? `📌 موضع التوقف: صفحة ${quranProgress?.currentPage || quranProgress?.startPage || 1} من 604`
                  : `📌 Position: Page ${quranProgress?.currentPage || 1} of 604`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setShowFlexibleTrackerModal(true);
              }}
              className="min-h-[44px] text-[11px] font-bold text-amber-300 hover:underline cursor-pointer shrink-0 ps-2"
            >
              {isAr ? 'تعديل النطاق ✏️' : 'Edit Range ✏️'}
            </button>
          </div>

          {/* Glowing progress ring + page counter */}
          <div className="flex items-center gap-4">
            <div
              className="relative w-16 h-16 shrink-0 flex items-center justify-center"
              role="img"
              aria-label={isAr ? `تقدم الورد ${quranPercent}%` : `Wird progress ${quranPercent}%`}
            >
              <svg className="w-16 h-16 -rotate-90 overflow-visible" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#1eb814"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 26}
                  strokeDashoffset={2 * Math.PI * 26 * (1 - Math.min(100, Math.max(0, quranPercent)) / 100)}
                  className="ring-glow-emerald transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-white tabular-nums">{quranPercent}%</span>
            </div>
            <div className="min-w-0 text-xs text-emerald-50 font-mono tabular-nums">
              <span><bdi dir="ltr">{currentWirdPages} / {totalWirdPages}</bdi> {t('quran_progress')}</span>
            </div>
          </div>

          {/* MVD notice if active */}
          {isSurvivalMode && (
            <div className="p-3 rounded-[18px] bg-[#fde6d8] dark:bg-amber-950/45 border border-amber-400/30 text-amber-950 dark:text-amber-200 text-[11px] leading-relaxed">
              🛡️ <strong>وضع البقاء مُفعّل:</strong> يكفيك قراءة صفحة واحدة أو 5 آيات لحماية شعلتك!
            </div>
          )}

          {/* Quranly-Inspired Authentic Hasanat Calculator (+10 Hasanat / Letter, ~5,500/Page) */}
          <div className="p-3 rounded-[20px] bg-white/10 border border-white/15 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🪙</span>
              <div>
                <span className="text-[10px] text-emerald-100/80 block font-medium">
                  {isAr ? 'الحسنات المقدرة لورد اليوم (10 حسنات لكل حرف):' : 'Estimated Hasanat (10 Hasanat / Letter):'}
                </span>
                <span className="text-xs font-bold text-amber-200 font-mono tabular-nums">
                  +{(currentWirdPages * 5500).toLocaleString()} {isAr ? 'حسنة مضاعفة 🤍' : 'Hasanat 🤍'}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#bce8c2] text-zinc-950 shrink-0 tashkeel-text">
              {isAr ? '«بِكُلِّ حَرْفٍ حَسَنَةٌ»' : 'Hadith Based'}
            </span>
          </div>

          {/* Action Buttons: Quick Increment & Open Modal */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleIncrementQuranPage}
              className="tap-spring py-3 px-3.5 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-[#1eb814]/25"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isAr ? '+1 صفحة تالية' : '+1 Next Page'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setShowFlexibleTrackerModal(true);
              }}
              className="tap-spring py-3 px-3.5 rounded-full bg-[#141517] hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#bce8c2] dark:text-[#1eb814]" />
              <span>{isAr ? 'تحديد السورة والآيات' : 'Select Surah/Ayahs'}</span>
            </button>
          </div>

          {/* Quick Morning 100x Shield Tasbih Button */}
          {onOpenSmartTasbih && (
            <button
              type="button"
              onClick={() => onOpenSmartTasbih('tahlil_100')}
              className="w-full py-2.5 px-4 rounded-full bg-[#fde6d8] hover:bg-[#fbd5be] dark:bg-amber-950/45 dark:hover:bg-amber-900/50 border border-amber-400/40 text-amber-950 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer shadow-2xs"
            >
              <span>🛡️</span>
              <span>{isAr ? 'حرز الصباح (100x لا إله إلا الله...)' : 'Morning 100x Shield'}</span>
            </button>
          )}
        </div>

        {/* Book Reader Card — Habitline Soft Lavender Surface */}
        <div className="bento-3d-lavender p-5 sm:p-6 rounded-[28px] border border-white/50 dark:border-indigo-500/25 flex flex-col justify-between space-y-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#5448e8] text-white flex items-center justify-center shadow-sm shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-zinc-950 dark:text-zinc-100 truncate">
                  {bookProgress?.title ?? t('book_card_title')}
                </h3>
                <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                  {isAr ? 'قراءة المعرفة وبناء الفكر' : 'Knowledge & Deep Reading'}
                </span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/90 dark:bg-zinc-900 font-mono font-bold text-[#5448e8] dark:text-indigo-300 tabular-nums shadow-2xs">
              {bookPercent}%
            </span>
          </div>

          <div className="p-3.5 rounded-[20px] bg-white/90 dark:bg-zinc-900/90 border border-indigo-400/20 flex items-center justify-between text-xs text-zinc-800 dark:text-zinc-300 font-mono tabular-nums">
            <span><bdi dir="ltr">{bookProgress?.currentPage ?? 0} / {bookProgress?.totalPages ?? 280}</bdi></span>
            <span>{t('book_remaining')} <bdi dir="ltr">{(bookProgress?.totalPages ?? 280) - (bookProgress?.currentPage ?? 0)}</bdi></span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 rounded-full bg-white/80 dark:bg-zinc-800 overflow-hidden p-0.5 border border-indigo-400/20">
            <div
              className="h-full rounded-full bg-[#5448e8] transition-all duration-500"
              style={{ width: `${bookPercent}%` }}
            />
          </div>

          {/* Quick Increment Button */}
          <button
            onClick={handleIncrementBookPage}
            className="tap-spring w-full py-3 px-4 rounded-full bg-[#5448e8] hover:bg-[#4538d8] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md shadow-[#5448e8]/25"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('book_increment')}</span>
          </button>
        </div>
      </div>

      {/* Book Insight / Quote of the Day Capture — Habitline Soft Amber Surface */}
      <div className="p-5 rounded-[28px] bg-[#fde6d8]/75 dark:bg-amber-950/45 border border-amber-400/30 dark:border-amber-500/25 space-y-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-habit-flame-ink text-white flex items-center justify-center shadow-2xs">
              <Bookmark className="w-3.5 h-3.5" />
            </div>
            <span>{t('quote_title')}</span>
          </h4>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            id="morning-quote-input"
            type="text"
            placeholder={t('quote_placeholder')}
            defaultValue={localStorage.getItem('midmar_today_quote') || ''}
            onChange={(e) => localStorage.setItem('midmar_today_quote', e.target.value)}
            className="flex-1 py-2.5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-400/30 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#ff5500] shadow-2xs"
          />
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              const val = (document.getElementById('morning-quote-input') as HTMLInputElement)?.value || localStorage.getItem('midmar_today_quote') || '';
              if (val) {
                upsertDailyLog(getBiologicalDate(), { goldenNugget: val } as any).catch(() => {});
              }
              setIsQuoteSaved(true);
              setTimeout(() => setIsQuoteSaved(false), 2200);
            }}
            className={`min-h-[44px] tap-spring py-2.5 px-5 rounded-full font-bold text-xs cursor-pointer shadow-sm transition-all shrink-0 active:scale-95 ${
              isQuoteSaved
                ? 'bg-habit-green-ink text-white shadow-[#1eb814]/25 ring-2 ring-[#1eb814]/30'
                : 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 hover:opacity-90'
            }`}
          >
            {isQuoteSaved ? (isAr ? 'تم الحفظ بنجاح ✔' : 'Saved ✔') : t('save_template')}
          </button>
        </div>

        {/* Quick Wisdom / Quote Chips */}
        <ZeroTypingChips
          chips={ZERO_TYPING_PRESETS.goldenNuggets}
          onSelect={(chip) => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            localStorage.setItem('midmar_today_quote', chip);
            upsertDailyLog(getBiologicalDate(), { goldenNugget: chip } as any).catch(() => {});
            const el = document.getElementById('morning-quote-input') as HTMLInputElement;
            if (el) el.value = chip;
          }}
        />
      </div>

      {/* Morning Tadabbur & Spiritual Ayah Reflection Card — Crisp White Bento */}
      {(() => {
        const todayTadabbur = getDailyTadabburItem(0);
        return (
          <div className="p-5 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#d4f5dc] dark:bg-emerald-950/60 text-[#1eb814] dark:text-emerald-300 border border-[#1eb814]/25 flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-5 h-5 fill-[#1eb814]/20" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">
                    {isAr ? 'نفحة اليوم القرآنية للتدبر والسكينة' : 'Morning Quranic Reflection & Focus Anchor'}
                  </h4>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#d4f5dc] dark:bg-emerald-900/50 text-zinc-950 dark:text-emerald-200 font-mono font-bold">
                    {todayTadabbur.quran.surahName} ({todayTadabbur.quran.ayahRange})
                  </span>
                </div>
                <p
                  dir="rtl"
                  lang="ar"
                  className="text-sm text-zinc-900 dark:text-amber-100/90 leading-[2.3] tashkeel-text font-quran line-clamp-3"
                >
                  «{todayTadabbur.quran.arabicText}»
                </p>
              </div>
            </div>

            {onOpenTadabburModal && (
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  onOpenTadabburModal(todayTadabbur, 'quran');
                }}
                className="tap-spring py-2.5 px-4 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm cursor-pointer self-end sm:self-auto active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isAr ? 'تفسير ابن كثير وأسباب النزول' : 'Tafsir & Context'}</span>
              </button>
            )}
          </div>
        );
      })()}

      {/* Cognitive Energy Barometer (Morning Pacing) */}
      <CognitiveEnergyBarometer
        currentLevel={energyLevel}
        onSelectLevel={onSelectEnergyLevel}
      />

      {/* Completion & Transition Bar — Habitline Pill CTA */}
      <div className="p-5 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">{t('station_1_finish')}</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t('station_1_finish_desc')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {!isCompleted ? (
            <button
              onClick={handleCompleteWithCelebration}
              className="tap-spring py-3 px-6 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#1eb814]/25 active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t('mark_done')} (+10 XP)</span>
            </button>
          ) : (
            <button
              onClick={onNextStation}
              className="tap-spring py-3 px-6 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <span>{t('next_station')}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Interactive Page Grid Modal */}
      <QuranPageGridModal
        isOpen={showGridModal}
        onClose={() => setShowGridModal(false)}
        currentPage={currentWirdPages}
        totalPages={totalWirdPages}
        title={isAr ? `خريطة صفحات ${activeWirdTitle} (${totalWirdPages} صفحة)` : `${activeWirdTitle} Grid (${totalWirdPages} Pages)`}
        onSelectPage={handleSelectSpecificPage}
      />

      {/* Flexible Quran Tracker & Surah Selection Modal */}
      <FlexibleQuranTrackerModal
        isOpen={showFlexibleTrackerModal}
        onClose={() => setShowFlexibleTrackerModal(false)}
        quranProgress={quranProgress}
        onRewardToast={onRewardToast}
        todayLog={todayLog}
      />
    </div>
  );
};
