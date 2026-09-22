import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Lock,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Grid,
  Sparkles,
} from 'lucide-react';
import type { QuranProgress, BookProgress, EnergyLevel, UserState } from '../../types';
import type { TasbihPresetId } from '../../utils/tasbihEngine';
import { db } from '../../db/db';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { CognitiveEnergyBarometer } from '../CognitiveEnergyBarometer';
import { QuranPageGridModal } from '../modals/QuranPageGridModal';
import { useTranslation } from '../../i18n/LanguageContext';
import { ZeroTypingChips, ZERO_TYPING_PRESETS } from '../common/ZeroTypingChips';
import { resolveStationMetadata, PERSONA_CONFIGS } from '../../utils/lifestyleEngine';
import { WIRD_PRESETS, getActiveSpiritualWirds } from '../../utils/spiritualWirdEngine';
import { getDailyTadabburItem, type DailyTadabburItem } from '../../data/dailyTadabburData';

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
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [showGridModal, setShowGridModal] = useState(false);

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
      lastUpdated: new Date().toISOString().split('T')[0],
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
      lastUpdated: new Date().toISOString().split('T')[0],
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
      lastUpdated: new Date().toISOString().split('T')[0],
    });
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
      {/* Sleek Native Station Header Bar (Apple-Tier) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-l from-emerald-500/10 via-white dark:via-zinc-900 to-white dark:to-zinc-900 border border-emerald-500/20 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                {persona.badge} • <bdi dir="ltr" className="font-mono">{stationMeta.shortTime}</bdi>
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[10px] font-bold border border-rose-200 dark:border-rose-900/40">
                <Lock className="w-2.5 h-2.5" />
                <span>{t('social_locked')}</span>
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 truncate">
              {isAr ? stationMeta.titleAr : stationMeta.titleEn}
            </h2>
          </div>
        </div>

        <div className="shrink-0">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 font-mono font-bold">
            +10 XP
          </span>
        </div>
      </div>

      {/* Grid: Quran Tracker & Book Reader */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Dynamic Spiritual Wird Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-4 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">{activeWirdTitle}</h3>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {wirdPreset?.badge || '✨ ورد اليوم'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowGridModal(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Grid className="w-3 h-3" />
              <span>{isAr ? `خريطة الصفحات (${totalWirdPages} ص)` : `${totalWirdPages}-Page Grid`}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-mono">
            <span>{currentWirdPages} / {totalWirdPages} {t('quran_progress')}</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{quranPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${quranPercent}%` }}
            />
          </div>

          {/* MVD notice if active */}
          {isSurvivalMode && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
              🛡️ <strong>وضع البقاء مُفعّل:</strong> يكفيك قراءة صفحة واحدة أو 5 آيات لحماية شعلتك!
            </div>
          )}

          {/* Quick Increment Button */}
          <button
            onClick={handleIncrementQuranPage}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? `+1 صفحة من ${activeWirdTitle}` : `+1 Page from ${activeWirdTitle}`}</span>
          </button>

          {/* Quick Morning 100x Shield Tasbih Button */}
          {onOpenSmartTasbih && (
            <button
              type="button"
              onClick={() => onOpenSmartTasbih('tahlil_100')}
              className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer shadow-2xs"
            >
              <span>🛡️</span>
              <span>{isAr ? 'حرز الصباح (100x لا إله إلا الله...)' : 'Morning 100x Shield'}</span>
            </button>
          )}
        </div>

        {/* Book Reader Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-4 shadow-sm hover:border-sky-300 dark:hover:border-sky-800/60 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-cyan-500/20 text-sky-700 dark:text-cyan-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate">
                {bookProgress?.title ?? t('book_card_title')}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-sky-700 dark:text-cyan-400">{bookPercent}%</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-mono">
            <span>{bookProgress?.currentPage ?? 0} / {bookProgress?.totalPages ?? 280}</span>
            <span>{t('book_remaining')} {(bookProgress?.totalPages ?? 280) - (bookProgress?.currentPage ?? 0)}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${bookPercent}%` }}
            />
          </div>

          {/* Quick Increment Button */}
          <button
            onClick={handleIncrementBookPage}
            className="w-full py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 border border-sky-200 dark:border-cyan-500/40 text-sky-800 dark:text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('book_increment')}</span>
          </button>
        </div>
      </div>

      {/* Book Insight / Quote of the Day Capture */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <span>{t('quote_title')}</span>
          </h4>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="morning-quote-input"
            type="text"
            placeholder={t('quote_placeholder')}
            defaultValue={localStorage.getItem('midmar_today_quote') || ''}
            onChange={(e) => localStorage.setItem('midmar_today_quote', e.target.value)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-sky-500"
          />
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              alert(t('quote_saved'));
            }}
            className="py-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors shrink-0"
          >
            {t('save_template')}
          </button>
        </div>

        {/* Quick Wisdom / Quote Chips */}
        <ZeroTypingChips
          chips={ZERO_TYPING_PRESETS.goldenNuggets}
          onSelect={(chip) => {
            localStorage.setItem('midmar_today_quote', chip);
            const el = document.getElementById('morning-quote-input') as HTMLInputElement;
            if (el) el.value = chip;
          }}
        />
      </div>

      {/* Morning Tadabbur & Spiritual Ayah Reflection Card */}
      {(() => {
        const todayTadabbur = getDailyTadabburItem(0);
        return (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    {isAr ? 'نفحة اليوم القرآنية للتدبر والسكينة' : 'Morning Quranic Reflection & Focus Anchor'}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-mono font-bold border border-emerald-200/60 dark:border-emerald-800/40">
                    {todayTadabbur.quran.surahName} ({todayTadabbur.quran.ayahRange})
                  </span>
                </div>
                <p className="text-sm text-slate-900 dark:text-amber-100/90 leading-[2.1] font-quran line-clamp-2">
                  «{todayTadabbur.quran.arabicText}»
                </p>
              </div>
            </div>

            {onOpenTadabburModal && (
              <button
                type="button"
                onClick={() => onOpenTadabburModal(todayTadabbur, 'quran')}
                className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer self-end sm:self-auto"
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

      {/* Completion & Transition Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{t('station_1_finish')}</h4>
          <p className="text-[11px] text-slate-500 dark:text-zinc-500">
            {t('station_1_finish_desc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted ? (
            <button
              onClick={onCompleteStation}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t('mark_done')} (+10)</span>
            </button>
          ) : (
            <button
              onClick={onNextStation}
              className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
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
    </div>
  );
};
