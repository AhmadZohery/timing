import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Timer,
  Compass,
  Zap,
  X,
  BookOpen,
  Disc,
  Star,
  Sparkles,
  Check,
  ChevronRight,
  Bell,
} from 'lucide-react';
import type { DailyLog, UserState, StationId, PrayerName } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { calculatePrayerTimes, getNextPrayer } from '../../utils/prayerCalculator';
import { resolveStationMetadata } from '../../utils/lifestyleEngine';
import { checkIsFridaySalawatWindow, type TasbihPresetId } from '../../utils/tasbihEngine';

interface DynamicIslandHubProps {
  currentStation: StationId;
  userState?: UserState;
  todayLog?: DailyLog;
  onSelectStation: (st: StationId) => void;
  onOpenAiCoach?: () => void;
  onOpenTwoMinuteRule?: () => void;
  onOpenEvaluation?: () => void;
  onOpenSleepRest?: () => void;
  onRewardToast?: (msg: string) => void;
  onOpenLifestyleModal?: () => void;
  onOpenWirdModal?: () => void;
  onOpenSmartTasbih?: (mode?: TasbihPresetId) => void;
  onOpenTasbihWithPreset?: (preset: TasbihPresetId) => void;
  onOpenQuickReminder?: () => void;
}

/**
 * Bulletproof Chronograph Time Remaining Chip.
 * Uses structured separate spans in an explicit LTR flexbox
 * so digits and unit indicators (6 and س) never get flipped by the
 * browser's Unicode Bidirectional (BiDi) algorithm. Always renders: 6س 20د.
 */
interface TimeRemainingChipProps {
  minutes: number;
  isAr: boolean;
  isApproaching?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TimeRemainingChip: React.FC<TimeRemainingChipProps> = ({
  minutes,
  isAr,
  isApproaching,
  size = 'sm',
}) => {
  if (minutes <= 0) {
    return (
      <span className="font-bold text-emerald-400 text-xs">
        {isAr ? 'حان الآن 🕌' : 'Now 🕌'}
      </span>
    );
  }

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  const fontClasses =
    size === 'lg'
      ? 'text-lg font-black'
      : size === 'md'
      ? 'text-sm font-bold'
      : 'text-[11px] font-bold';

  const unitClasses =
    size === 'lg'
      ? 'text-xs font-semibold opacity-75'
      : size === 'md'
      ? 'text-[11px] font-medium opacity-80'
      : 'text-[10px] font-medium opacity-80';

  return (
    <span
      dir="ltr"
      className={`inline-flex items-center gap-1 font-mono select-none ${fontClasses} ${
        isApproaching ? 'text-amber-300' : 'text-teal-300'
      }`}
    >
      {hours > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <span>{hours}</span>
          <span className={unitClasses}>{isAr ? 'س' : 'h'}</span>
        </span>
      )}
      {(remainingMins > 0 || hours === 0) && (
        <span className="inline-flex items-center gap-0.5">
          <span>{remainingMins}</span>
          <span className={unitClasses}>{isAr ? 'د' : 'm'}</span>
        </span>
      )}
    </span>
  );
};

function formatClockTime(date: Date, isAr: boolean): string {
  try {
    return date.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}

export const DynamicIslandHub: React.FC<DynamicIslandHubProps> = ({
  currentStation,
  userState,
  todayLog: _todayLog,
  onSelectStation,
  onOpenAiCoach: _onOpenAiCoach,
  onOpenTwoMinuteRule,
  onOpenEvaluation: _onOpenEvaluation,
  onOpenSleepRest: _onOpenSleepRest,
  onRewardToast: _onRewardToast,
  onOpenLifestyleModal,
  onOpenWirdModal,
  onOpenSmartTasbih,
  onOpenTasbihWithPreset: _onOpenTasbihWithPreset,
  onOpenQuickReminder,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const prayerData = useMemo(() => {
    const now = new Date();
    const pLoc = userState?.settings?.prayerLocation;
    const fridayStatus = checkIsFridaySalawatWindow(now, pLoc);
    const pTimes = calculatePrayerTimes(
      now,
      pLoc?.latitude ?? 30.0444,
      pLoc?.longitude ?? 31.2357,
      pLoc?.calculationMethod ?? 'egyptian'
    );
    const nextP = getNextPrayer(pTimes);
    return { fridayStatus, nextP, pTimes };
  }, [userState?.settings?.prayerLocation]);

  const { fridayStatus, nextP, pTimes } = prayerData;
  const isApproaching = nextP.minutesRemaining > 0 && nextP.minutesRemaining <= 15;

  const currentMeta = resolveStationMetadata(
    currentStation,
    userState?.settings?.lifestylePersona,
    userState?.settings?.stationCustomOverrides,
    isAr
  );

  // 5 Canonical Prayers for Timeline
  const prayersTimeline = useMemo(() => {
    const list: Array<{ key: PrayerName; ar: string; en: string; time: Date }> = [
      { key: 'fajr', ar: 'الفجر', en: 'Fajr', time: pTimes.fajr },
      { key: 'dhuhr', ar: 'الظهر', en: 'Dhuhr', time: pTimes.dhuhr },
      { key: 'asr', ar: 'العصر', en: 'Asr', time: pTimes.asr },
      { key: 'maghrib', ar: 'المغرب', en: 'Maghrib', time: pTimes.maghrib },
      { key: 'isha', ar: 'العشاء', en: 'Isha', time: pTimes.isha },
    ];

    const nextIndex = list.findIndex((p) => p.key === nextP.name);

    return list.map((p, idx) => {
      const isTarget = p.key === nextP.name;
      // If next prayer is found, earlier index means already passed today
      const isPast = nextIndex !== -1 ? idx < nextIndex : false;
      return {
        ...p,
        isTarget,
        isPast,
      };
    });
  }, [pTimes, nextP.name]);

  const handleOpen = () => {
    soundSynth.playIslandOpenSound();
    haptic.vibrateIslandOpen();
    setIsExpanded(true);
  };

  const handleClose = () => {
    soundSynth.playIslandCloseSound();
    haptic.vibrateIslandClose();
    setIsExpanded(false);
  };

  // Keyboard shortcut: ESC to dismiss
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Click outside to dismiss
  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsideClick = (e: Event) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        handleClose();
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick, true);
    return () => document.removeEventListener('pointerdown', handleOutsideClick, true);
  }, [isExpanded]);

  return (
    <>
      {/* Non-dimming touch dismiss layer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="island-dismiss-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] cursor-pointer"
          />
        )}
      </AnimatePresence>

      <div className="relative z-50 flex justify-center w-full">
        {/* Single persistent morphing container with liquid mercury physics */}
        <motion.div
          ref={containerRef}
          layout
          initial={false}
          animate={{
            borderRadius: isExpanded ? 28 : 9999,
          }}
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 32,
            mass: 0.75,
          }}
          className={`relative select-none overflow-hidden transition-colors duration-300 ${
            isExpanded
              ? 'w-[94vw] max-w-md bg-[#070A0E]/98 dark:bg-black/98 text-white border border-white/[0.14] p-4 sm:p-5 shadow-[0_28px_72px_rgba(0,0,0,0.92),inset_0_1px_1.5px_rgba(255,255,255,0.22)] backdrop-blur-3xl'
              : isApproaching
              ? 'w-auto max-w-[92vw] bg-[#070A0E]/95 dark:bg-black/95 text-white border border-amber-400/40 ring-1 ring-amber-400/25 px-3.5 py-1.5 shadow-[0_0_24px_rgba(245,158,11,0.22),inset_0_1px_1px_rgba(255,255,255,0.2)] cursor-pointer hover:scale-[1.02] active:scale-[0.97]'
              : 'w-auto max-w-[92vw] bg-[#070A0E]/95 dark:bg-black/95 text-white border border-white/[0.14] px-3.5 py-1.5 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.65),inset_0_1px_1px_0_rgba(255,255,255,0.18)] cursor-pointer hover:scale-[1.02] active:scale-[0.97]'
          }`}
          onClick={!isExpanded ? handleOpen : undefined}
          role={!isExpanded ? 'button' : undefined}
          tabIndex={!isExpanded ? 0 : undefined}
          onKeyDown={
            !isExpanded
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpen();
                  }
                }
              : undefined
          }
        >
          {/* Subtle top specular shimmer line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

          {/* ================================================================ */}
          {/* COMPACT PILL STATE                                              */}
          {/* ================================================================ */}
          {!isExpanded && (
            <motion.div
              key="compact-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-2 sm:gap-2.5"
            >
              {/* Spiritual Beacon Aura */}
              <span className="relative flex h-2 w-2 shrink-0">
                {isApproaching ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-tr from-teal-400 to-emerald-400 shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
                  </>
                )}
              </span>

              {/* Station Tag: ONLY show if outside HOME */}
              {currentStation !== 'HOME' && (
                <span className="text-[11px] font-bold text-teal-300/90 truncate max-w-[100px] tracking-tight">
                  {isAr ? currentMeta.shortLabelAr : currentMeta.shortLabelEn}
                </span>
              )}

              {/* Prayer Name */}
              <span
                className={`text-[11px] font-semibold tracking-tight ${
                  isApproaching ? 'text-amber-200' : 'text-slate-200'
                }`}
              >
                {nextP.arabicName}
              </span>

              {/* Countdown Chip with Zero BiDi Text Flipping */}
              <div
                className={`flex items-center px-1.5 py-0.5 rounded-full ${
                  isApproaching
                    ? 'bg-amber-400/15 border border-amber-400/30'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <TimeRemainingChip
                  minutes={nextP.minutesRemaining}
                  isAr={isAr}
                  isApproaching={isApproaching}
                  size="sm"
                />
              </div>

              {/* Flame Streak Chip */}
              {(userState?.streakDays || 0) > 0 && (
                <div className="hidden xs:flex items-center gap-0.5 text-[10px] font-mono font-bold text-amber-400/90">
                  <Flame className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{userState?.streakDays}</span>
                </div>
              )}

              {/* Friday Salawat Season Blossom */}
              {fridayStatus.isWindow && (
                <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300/40 animate-spin-slow shrink-0" />
              )}
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* EXPANDED MASTERPIECE SANCTUARY                                   */}
          {/* ================================================================ */}
          {isExpanded && (
            <motion.div
              key="expanded-content"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="space-y-4"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-tr from-teal-400 to-emerald-400" />
                  </span>
                  <span className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-200 to-amber-200 uppercase tracking-wider font-mono">
                    {isAr ? 'الجزيرة التفاعلية • مضمار Live' : 'LifeOS Dynamic Sanctuary'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline-block text-[9px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                    ESC
                  </span>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label={isAr ? 'إغلاق' : 'Close'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hero Live Activity Card: Next Prayer & 5-Prayer Orbital Ribbon */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  isApproaching
                    ? 'bg-gradient-to-br from-amber-500/15 via-[#0C0F15] to-amber-950/25 border-amber-400/35 shadow-[0_0_24px_rgba(245,158,11,0.15)]'
                    : 'bg-white/[0.03] border-white/[0.08]'
                }`}
              >
                {/* Upper Hero Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
                        isApproaching
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                          : 'bg-teal-400/15 text-teal-300 border border-teal-400/30'
                      }`}
                    >
                      🕌
                    </div>
                    <div>
                      <span className="text-[10px] text-white/50 block font-medium">
                        {isAr ? 'الصلاة القادمة' : 'Next Prayer'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-black tracking-tight ${
                            isApproaching ? 'text-amber-300' : 'text-white'
                          }`}
                        >
                          {nextP.arabicName}
                        </span>
                        <span className="text-xs font-mono font-medium text-white/60">
                          {formatClockTime(nextP.time, isAr)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Badge */}
                  <div className="text-end">
                    <span className="text-[9px] text-white/40 block font-medium mb-0.5">
                      {isAr ? 'الوقت المتبقي' : 'Time Remaining'}
                    </span>
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-xl border ${
                        isApproaching
                          ? 'bg-amber-400/15 border-amber-400/35 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-teal-500/10 border-teal-400/25'
                      }`}
                    >
                      <TimeRemainingChip
                        minutes={nextP.minutesRemaining}
                        isAr={isAr}
                        isApproaching={isApproaching}
                        size="md"
                      />
                    </div>
                  </div>
                </div>

                {/* 5-Prayer Cosmic Timeline Ribbon */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between gap-1 relative">
                    {/* Underlying Track Line */}
                    <div className="absolute top-3 inset-x-4 h-[2px] bg-white/[0.08] -z-0" />

                    {prayersTimeline.map((prayer) => {
                      return (
                        <div
                          key={prayer.key}
                          className="flex flex-col items-center gap-1 relative z-10 flex-1"
                        >
                          {/* Node Icon / Indicator */}
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              prayer.isTarget
                                ? isApproaching
                                  ? 'bg-amber-400 text-black font-black shadow-[0_0_10px_rgba(245,158,11,0.9)] ring-2 ring-amber-300/40'
                                  : 'bg-teal-400 text-black font-black shadow-[0_0_10px_rgba(45,212,191,0.8)] ring-2 ring-teal-300/40'
                                : prayer.isPast
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                                : 'bg-white/5 text-white/30 border border-white/10'
                            }`}
                          >
                            {prayer.isTarget ? (
                              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                            ) : prayer.isPast ? (
                              <Check className="w-3 h-3 stroke-[3]" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                            )}
                          </div>

                          {/* Prayer Name */}
                          <span
                            className={`text-[10px] font-bold ${
                              prayer.isTarget
                                ? isApproaching
                                  ? 'text-amber-300'
                                  : 'text-teal-300'
                                : prayer.isPast
                                ? 'text-white/60'
                                : 'text-white/30'
                            }`}
                          >
                            {isAr ? prayer.ar : prayer.en}
                          </span>

                          {/* Prayer Time */}
                          <span className="text-[9px] font-mono text-white/40">
                            {formatClockTime(prayer.time, isAr)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Serene Encouragement Banner on Approaching */}
                {isApproaching && (
                  <div className="mt-3 pt-2 border-t border-amber-400/20 flex items-center gap-2 text-[11px] text-amber-200/95 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                    <span>
                      {isAr
                        ? 'اقترب موعد الأذان.. تهيأ بالوضوء والسكينة لصلاتك في أول وقتها 🤲'
                        : 'Adhan is approaching. Prepare with peace and wudu.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Spatial 4-Tile Luxury Glass Action Deck */}
              <div className="grid grid-cols-2 gap-2">
                {/* Tile 1: Smart Haptic Tasbih */}
                {onOpenSmartTasbih && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenSmartTasbih(
                        fridayStatus.isWindow ? 'salawat_ibrahimiyyah' : 'tahlil_100'
                      );
                    }}
                    className={`tap-spring p-3 rounded-2xl border text-start transition-all cursor-pointer active:scale-95 group ${
                      fridayStatus.isWindow
                        ? 'bg-gradient-to-br from-amber-500/15 to-transparent border-amber-400/30 hover:border-amber-400/50'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-teal-400/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          fridayStatus.isWindow
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'bg-teal-400/15 text-teal-300'
                        }`}
                      >
                        {fridayStatus.isWindow ? (
                          <Star className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Disc className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-teal-300">
                        {fridayStatus.isWindow ? '+25 XP' : '100x'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white block group-hover:text-teal-200 transition-colors">
                      {fridayStatus.isWindow
                        ? isAr
                          ? 'الصلاة الإبراهيمية'
                          : 'Friday Salawat'
                        : isAr
                        ? 'المسبحة اللمسية'
                        : 'Smart Tasbih'}
                    </span>
                    <span className="text-[10px] text-white/50 block mt-0.5">
                      {fridayStatus.isWindow
                        ? isAr
                          ? 'موسم يوم الجمعة'
                          : 'Friday Special'
                        : isAr
                        ? 'أذكار وعداد لمسي'
                        : 'Haptic Remembrance'}
                    </span>
                  </button>
                )}

                {/* Tile 2: Quran Daily Wird */}
                {onOpenWirdModal && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenWirdModal();
                    }}
                    className="tap-spring p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-emerald-400/30 text-start transition-all cursor-pointer active:scale-95 group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-400/15 text-emerald-300 flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-300">
                        📖
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white block group-hover:text-emerald-200 transition-colors">
                      {isAr ? 'الورد القرآني' : 'Quran Wird'}
                    </span>
                    <span className="text-[10px] text-white/50 block mt-0.5">
                      {isAr ? 'قراءة وتدبر يومي' : 'Daily Tadabbur'}
                    </span>
                  </button>
                )}

                {/* Tile 3: 20-Minute Focus Sprint */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    handleClose();
                    onSelectStation('WORK_MICRO_SPRINT');
                  }}
                  className="tap-spring p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-sky-400/30 text-start transition-all cursor-pointer active:scale-95 group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-7 h-7 rounded-xl bg-sky-400/15 text-sky-300 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-sky-300">20m</span>
                  </div>
                  <span className="text-xs font-bold text-white block group-hover:text-sky-200 transition-colors">
                    {isAr ? 'سبرنت تركيز 20د' : '20m Focus Sprint'}
                  </span>
                  <span className="text-[10px] text-white/50 block mt-0.5">
                    {isAr ? 'إنتاجية بدون تشتت' : 'Zero Distraction'}
                  </span>
                </button>

                {/* Tile 4: 2-Minute Anti-Friction Rule or Quick Reminder */}
                {onOpenTwoMinuteRule ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenTwoMinuteRule();
                    }}
                    className="tap-spring p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-400/30 text-start transition-all cursor-pointer active:scale-95 group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-7 h-7 rounded-xl bg-amber-400/15 text-amber-300 flex items-center justify-center">
                        <Timer className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        120s
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white block group-hover:text-amber-200 transition-colors">
                      {isAr ? 'قاعدة الدقيقتين' : '2-Min Anti-Friction'}
                    </span>
                    <span className="text-[10px] text-white/50 block mt-0.5">
                      {isAr ? 'كسر حاجز التسويف' : 'Beat Procrastination'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenQuickReminder?.();
                    }}
                    className="tap-spring p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-purple-400/30 text-start transition-all cursor-pointer active:scale-95 group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-7 h-7 rounded-xl bg-purple-400/15 text-purple-300 flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-purple-300">
                        🔔
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white block group-hover:text-purple-200 transition-colors">
                      {isAr ? 'منبه ذكي سريع' : 'Quick Reminder'}
                    </span>
                    <span className="text-[10px] text-white/50 block mt-0.5">
                      {isAr ? 'تنبيه فوري مخصص' : 'Instant Reminder'}
                    </span>
                  </button>
                )}
              </div>

              {/* Bottom Subtle Station Context Strip */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white/60">
                  <Compass className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="text-[11px]">
                    {isAr ? 'المحطة الحالية:' : 'Active Station:'}
                  </span>
                  <span className="text-[11px] font-bold text-white truncate max-w-[140px]">
                    {isAr ? currentMeta.titleAr : currentMeta.titleEn}
                  </span>
                </div>

                {onOpenLifestyleModal && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenLifestyleModal();
                    }}
                    className="text-[10px] font-semibold text-teal-300 hover:text-teal-200 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isAr ? 'تخصيص النمط' : 'Customize'}</span>
                    <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
};
