import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Zap,
  X,
  BookOpen,
  Disc,
  Star,
  Sparkles,
  Check,
  ChevronRight,
  Compass,
  Navigation,
  Sun,
  Moon,
  Sunset,
  Volume2,
  VolumeX,
  Timer,
  GraduationCap,
  Trophy,
  Clock,
  Brain,
  Bell,
  Radio,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  ChevronLeft,
} from 'lucide-react';
import type { DailyLog, UserState, StationId, PrayerName } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  calculatePrayerTimes,
  getNextPrayer,
  calculateQiblaDirection,
} from '../../utils/prayerCalculator';
import { resolveStationMetadata } from '../../utils/lifestyleEngine';
import { checkIsFridaySalawatWindow, type TasbihPresetId } from '../../utils/tasbihEngine';
import { gymFaithAudio, type GymFaithAudioState } from '../../services/gymFaithAudioService';

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
  onOpenFaithAudio?: () => void;
}

/**
 * Universal Precision Chronograph Chip.
 *
 * In Arabic (RTL):
 * Parent has dir="rtl".
 * Hours token is on the RIGHT: 8س
 * Conjunction "و" in the middle: و
 * Minutes token is on the LEFT: 30د
 * Reading from right-to-left: 8س و 30د (Hours First, then Minutes).
 * Each sub-token has dir="ltr" so digits precede unit letters (never inverted to س 8).
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
      ? 'text-[11px] font-medium opacity-75'
      : 'text-[10px] font-medium opacity-75';

  if (!isAr) {
    // English LTR: Hours first on left, minutes on right (e.g. 8h 30m)
    return (
      <div
        dir="ltr"
        className={`inline-flex items-center gap-1 font-mono select-none ${fontClasses} ${
          isApproaching ? 'text-amber-300' : 'text-emerald-400'
        }`}
      >
        {hours > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <span>{hours}</span>
            <span className={unitClasses}>h</span>
          </span>
        )}
        {(remainingMins > 0 || hours === 0) && (
          <span className="inline-flex items-center gap-0.5">
            <span>{remainingMins}</span>
            <span className={unitClasses}>m</span>
          </span>
        )}
      </div>
    );
  }

  // Arabic RTL: Hours on the RIGHT, "و" in middle, Minutes on the LEFT
  // Reading right to left: 8س و 30د (Hours First, then Minutes)
  return (
    <div
      dir="rtl"
      className={`inline-flex items-center gap-1 font-mono select-none ${fontClasses} ${
        isApproaching ? 'text-amber-300' : 'text-emerald-400'
      }`}
    >
      {hours > 0 && (
        <span dir="ltr" className="inline-flex items-center gap-0.5">
          <span>{hours}</span>
          <span className={unitClasses}>س</span>
        </span>
      )}
      {hours > 0 && remainingMins > 0 && (
        <span className="text-white/40 text-[10px] font-sans px-0.5">و</span>
      )}
      {(remainingMins > 0 || hours === 0) && (
        <span dir="ltr" className="inline-flex items-center gap-0.5">
          <span>{remainingMins}</span>
          <span className={unitClasses}>د</span>
        </span>
      )}
    </div>
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
  onOpenAiCoach,
  onOpenTwoMinuteRule,
  onOpenEvaluation,
  onOpenSleepRest,
  onRewardToast,
  onOpenLifestyleModal,
  onOpenWirdModal,
  onOpenSmartTasbih,
  onOpenTasbihWithPreset: _onOpenTasbihWithPreset,
  onOpenQuickReminder,
  onOpenFaithAudio,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Faith Audio Live Activity State
  const [audioState, setAudioState] = useState<GymFaithAudioState>(() => gymFaithAudio.getState());

  useEffect(() => {
    return gymFaithAudio.subscribe(setAudioState);
  }, []);

  // Pre-Adhan 10-minute alert toggle state
  const [isPreAlertEnabled, setIsPreAlertEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('midmar_pre_adhan_alert_armed') !== 'false';
    } catch {
      return true;
    }
  });

  const togglePreAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const nextVal = !isPreAlertEnabled;
    setIsPreAlertEnabled(nextVal);
    if (nextVal) {
      soundSynth.playPrayerSpiritualChime('serenity_chime');
    }
    try {
      localStorage.setItem('midmar_pre_adhan_alert_armed', String(nextVal));
    } catch (_) {}
    if (onRewardToast) {
      onRewardToast(
        nextVal
          ? isAr
            ? 'تم تفعيل التنبيه المسبق للأذان (قبل 10 دقائق) 🔔'
            : '10-minute pre-adhan alert enabled 🔔'
          : isAr
          ? 'تم كتم التنبيه المسبق للأذان 🔕'
          : '10-minute pre-adhan alert muted 🔕'
      );
    }
  };

  // In-Island Mini Haptic Tasbih Bead Counter
  const [islandTasbihCount, setIslandTasbihCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('midmar_island_quick_tasbih') || 0);
    } catch {
      return 0;
    }
  });

  const handleIncrementIslandTasbih = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const nextCount = (islandTasbihCount + 1) % 101;
    setIslandTasbihCount(nextCount);
    try {
      localStorage.setItem('midmar_island_quick_tasbih', String(nextCount));
    } catch (_) {}
  };

  // Local state to track quick prayer confirmation
  const [confirmedPrayers, setConfirmedPrayers] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('midmar_island_confirmed_prayers');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Calculate Prayer Times and Geodesic Qibla
  const prayerData = useMemo(() => {
    const now = new Date();
    const pLoc = userState?.settings?.prayerLocation;
    const lat = pLoc?.latitude ?? 30.0444;
    const lng = pLoc?.longitude ?? 31.2357;
    const fridayStatus = checkIsFridaySalawatWindow(now, pLoc);
    const pTimes = calculatePrayerTimes(
      now,
      lat,
      lng,
      pLoc?.calculationMethod ?? 'egyptian'
    );
    const nextP = getNextPrayer(pTimes);
    const qiblaAngle = calculateQiblaDirection(lat, lng);
    return { fridayStatus, nextP, pTimes, qiblaAngle };
  }, [userState?.settings?.prayerLocation]);

  const { fridayStatus, nextP, pTimes, qiblaAngle } = prayerData;
  const isApproaching = nextP.minutesRemaining > 0 && nextP.minutesRemaining <= 15;

  const currentMeta = resolveStationMetadata(
    currentStation,
    userState?.settings?.lifestylePersona,
    userState?.settings?.stationCustomOverrides,
    isAr
  );

  // 5 Canonical Obligatory Prayers for the Timeline
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
      const isPast = nextIndex !== -1 ? idx < nextIndex : false;
      return {
        ...p,
        isTarget,
        isPast,
      };
    });
  }, [pTimes, nextP.name]);

  // Determine current/previous prayer window and progress
  const prayerWindowProgress = useMemo(() => {
    const canonical = [
      { key: 'fajr' as PrayerName, time: pTimes.fajr, ar: 'الفجر', en: 'Fajr' },
      { key: 'dhuhr' as PrayerName, time: pTimes.dhuhr, ar: 'الظهر', en: 'Dhuhr' },
      { key: 'asr' as PrayerName, time: pTimes.asr, ar: 'العصر', en: 'Asr' },
      { key: 'maghrib' as PrayerName, time: pTimes.maghrib, ar: 'المغرب', en: 'Maghrib' },
      { key: 'isha' as PrayerName, time: pTimes.isha, ar: 'العشاء', en: 'Isha' },
    ];

    const nextIdx = canonical.findIndex((p) => p.key === nextP.name);
    if (nextIdx === -1) {
      return {
        percent: 50,
        prevName: isAr ? 'الصلاة' : 'Prayer',
        prevKey: 'dhuhr' as PrayerName,
      };
    }

    const prevIdx = (nextIdx - 1 + canonical.length) % canonical.length;
    const prevPrayer = canonical[prevIdx];
    const nextPrayer = canonical[nextIdx];

    let prevMs = prevPrayer.time.getTime();
    let nextMs = nextPrayer.time.getTime();
    const nowMs = nextMs - (nextP.minutesRemaining * 60 * 1000);

    if (nextMs < prevMs) {
      nextMs += 24 * 60 * 60 * 1000;
    }
    if (nowMs < prevMs && nextIdx === 0) {
      prevMs -= 24 * 60 * 60 * 1000;
    }

    const total = Math.max(1, nextMs - prevMs);
    const elapsed = Math.max(0, Math.min(total, nowMs - prevMs));
    const percent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));

    return {
      percent,
      prevName: isAr ? prevPrayer.ar : prevPrayer.en,
      prevKey: prevPrayer.key,
    };
  }, [pTimes, nextP.name, nextP.time, nextP.minutesRemaining, isAr]);

  // Logical Focus Sprint Opportunity: Sprint until prayer with 5m buffer
  const prayerSprintMinutes = Math.max(5, nextP.minutesRemaining - 5);
  const hasSprintOpportunity = nextP.minutesRemaining >= 20 && nextP.minutesRemaining <= 180;

  const handleStartPrayerSprint = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    handleClose();
    try {
      localStorage.setItem('midmar_prayer_sprint_minutes', String(prayerSprintMinutes));
    } catch {
      // ignore
    }
    onSelectStation('WORK_MICRO_SPRINT');
    if (onRewardToast) {
      onRewardToast(
        isAr
          ? `بدأت سبرنت إنجاز ${prayerSprintMinutes} دقيقة حتى أذان ${nextP.arabicName} ⚡`
          : `Started ${prayerSprintMinutes}m sprint until ${nextP.englishName} ⚡`
      );
    }
  };

  const handleConfirmCurrentPrayer = (prayerKey: PrayerName, prayerNameAr: string) => {
    soundSynth.playPrayerSpiritualChime('andalusian_peace');
    haptic.vibrateLight();
    const updated = { ...confirmedPrayers, [prayerKey]: true };
    setConfirmedPrayers(updated);
    try {
      localStorage.setItem('midmar_island_confirmed_prayers', JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (onRewardToast) {
      onRewardToast(
        isAr
          ? `تقبل الله طاعتك! أديت صلاة ${prayerNameAr} في وقتها (+50 XP) 🤲`
          : `Prayer confirmed! (+50 XP) 🤲`
      );
    }
  };

  // Astronomical Celestial Sky Phase
  const celestialPhase = useMemo(() => {
    const now = new Date();
    if (now < pTimes.fajr) {
      return {
        labelAr: 'السَحَر والاستغفار',
        labelEn: 'Pre-Dawn Stillness',
        icon: Moon,
        color: 'text-indigo-300',
      };
    }
    if (now >= pTimes.fajr && now < pTimes.sunrise) {
      return {
        labelAr: 'الغداة ونور الفجر',
        labelEn: 'Dawn Awakening',
        icon: Sun,
        color: 'text-teal-300',
      };
    }
    if (now >= pTimes.sunrise && now < pTimes.dhuhr) {
      return {
        labelAr: 'ضحوة النهار وبركته',
        labelEn: 'Morning Radiance',
        icon: Sun,
        color: 'text-amber-300',
      };
    }
    if (now >= pTimes.dhuhr && now < pTimes.asr) {
      return {
        labelAr: 'الظهيرة والزوال',
        labelEn: 'Midday Zenith',
        icon: Sun,
        color: 'text-emerald-300',
      };
    }
    if (now >= pTimes.asr && now < pTimes.maghrib) {
      return {
        labelAr: 'العشي والأصيل المبارك',
        labelEn: 'Golden Afternoon',
        icon: Sunset,
        color: 'text-amber-300',
      };
    }
    if (now >= pTimes.maghrib && now < pTimes.isha) {
      return {
        labelAr: 'الشفق والمغرب',
        labelEn: 'Twilight Dusk',
        icon: Sunset,
        color: 'text-rose-300',
      };
    }
    return {
      labelAr: 'هدأة الليل وسكينته',
      labelEn: 'Night Serenity',
      icon: Moon,
      color: 'text-indigo-300',
    };
  }, [pTimes]);

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

  const isPrevPrayerConfirmed = Boolean(confirmedPrayers[prayerWindowProgress.prevKey]);

  return (
    <>
      {/* Invisible non-dimming touch dismiss layer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="island-dismiss-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] cursor-pointer"
          />
        )}
      </AnimatePresence>

      <div className="relative z-50 flex justify-center w-full px-2">
        {/* Precision Stately Jewel Capsule - Proportionately Sized (~320-350px) with Zero Bloat */}
        <motion.div
          ref={containerRef}
          layout
          initial={false}
          animate={{
            borderRadius: isExpanded ? 26 : 9999,
          }}
          transition={{
            type: 'spring',
            stiffness: 640,
            damping: 36,
            mass: 0.42,
          }}
          className={`relative select-none overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'w-full max-w-lg bg-[#080C14]/96 dark:bg-black/98 text-white border border-emerald-500/35 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.95),0_0_24px_rgba(16,185,129,0.12),inset_0_1px_1.5px_rgba(255,255,255,0.2)] backdrop-blur-3xl'
              : isApproaching
              ? 'w-auto min-w-[280px] max-w-[360px] bg-[#120F06]/95 dark:bg-black/95 text-white border border-amber-400/50 ring-1 ring-amber-400/30 px-4 py-2 shadow-[0_8px_24px_rgba(245,158,11,0.25),inset_0_1px_1.5px_rgba(253,224,71,0.25)] cursor-pointer hover:scale-[1.015] active:scale-[0.98]'
              : 'w-auto min-w-[280px] max-w-[360px] bg-[#080C14]/95 dark:bg-black/95 text-white border border-emerald-500/35 ring-1 ring-emerald-400/20 px-4 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.8),0_0_16px_rgba(16,185,129,0.15),inset_0_1px_1.5px_0_rgba(255,255,255,0.22)] cursor-pointer hover:scale-[1.015] active:scale-[0.98]'
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
          {/* Subtle Top Specular Edge Line */}
          <div
            className={`absolute inset-x-0 top-0 h-[1.5px] pointer-events-none ${
              isApproaching
                ? 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent'
                : 'bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent'
            }`}
          />

          {/* ================================================================ */}
          {/* COMPACT STATELY CAPSULE (High Information Density & Balance)     */}
          {/* ================================================================ */}
          {!isExpanded && (
            <motion.div
              key="compact-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="flex items-center justify-between gap-2.5 w-full"
            >
              {/* Right Wing: Luminous Beacon + Prayer Name + Exact Time */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  {isApproaching ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.95)]" />
                    </>
                  ) : (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-tr from-emerald-400 to-teal-300 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                    </>
                  )}
                </span>

                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-xs font-bold tracking-tight ${
                      isApproaching ? 'text-amber-200' : 'text-white'
                    }`}
                  >
                    {nextP.arabicName}
                  </span>
                  <span className="text-[10px] font-mono text-white/50">
                    {formatClockTime(nextP.time, isAr)}
                  </span>
                </div>
              </div>

              {/* Center: Precision Chronograph Chip (Strict RTL: Hours on Right, Minutes on Left) */}
              <div
                className={`flex items-center px-2 py-0.5 rounded-full shrink-0 ${
                  isApproaching
                    ? 'bg-amber-400/20 border border-amber-400/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                    : 'bg-emerald-950/50 border border-emerald-400/30'
                }`}
              >
                <TimeRemainingChip
                  minutes={nextP.minutesRemaining}
                  isAr={isAr}
                  isApproaching={isApproaching}
                  size="sm"
                />
              </div>

              {/* Left Wing: Live Faith Audio Equalizer OR Streak Flame / Qibla / Salawat */}
              <div className="flex items-center gap-1.5 shrink-0">
                {audioState.isPlaying ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      gymFaithAudio.togglePlay();
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                    }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/35 text-emerald-300 transition-all cursor-pointer select-none active:scale-95"
                    title={audioState.currentTitleAr || (isAr ? 'أثير السكينة (انقر للإيقاف)' : 'Faith Audio (Click to pause)')}
                  >
                    <div className="flex items-end gap-0.5 h-2.5">
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ height: '70%', animationDuration: '0.6s' }} />
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ height: '100%', animationDuration: '0.4s' }} />
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ height: '50%', animationDuration: '0.7s' }} />
                    </div>
                    <span className="text-[9px] font-bold font-sans truncate max-w-[62px]">
                      {audioState.currentTitleAr ? audioState.currentTitleAr.replace(/^(سورة|تلاوة|كتاب)\s+/, '') : (isAr ? 'أثير' : 'Audio')}
                    </span>
                  </button>
                ) : (
                  <>
                    {currentStation !== 'HOME' ? (
                      <span className="text-[10px] font-bold text-emerald-300/90 truncate max-w-[80px] tracking-tight">
                        {isAr ? currentMeta.shortLabelAr : currentMeta.shortLabelEn}
                      </span>
                    ) : (
                      <div
                        className="flex items-center gap-0.5 text-[10px] font-mono text-emerald-300/80"
                        title={isAr ? `اتجاه القبلة: ${qiblaAngle}°` : `Qibla: ${qiblaAngle}°`}
                      >
                        <Navigation
                          className="w-2.5 h-2.5 text-emerald-400"
                          style={{ transform: `rotate(${qiblaAngle}deg)` }}
                        />
                        <span>{qiblaAngle}°</span>
                      </div>
                    )}

                    {(userState?.streakDays || 0) > 0 && (
                      <div className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-amber-300">
                        <Flame className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{userState?.streakDays}</span>
                      </div>
                    )}

                    {fridayStatus.isWindow && (
                      <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300/40 animate-spin-slow shrink-0" />
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* EXPANDED MASTERPIECE SANCTUARY (All Capabilities Accessible)     */}
          {/* ================================================================ */}
          {isExpanded && (
            <motion.div
              key="expanded-content"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="space-y-3"
            >
              {/* Top Header Bar: Status + Qibla Bearing + Alert Toggle + Close */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-tr from-emerald-400 to-teal-300" />
                  </span>
                  <span className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 uppercase tracking-wider font-mono">
                    {isAr ? 'الجزيرة الحية • مضمار Live' : 'LifeOS Dynamic Sanctuary'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Interactive Pre-Adhan 10-Minute Alert Toggle */}
                  <button
                    type="button"
                    onClick={togglePreAlert}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono transition-colors cursor-pointer ${
                      isPreAlertEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-sm'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                    title={
                      isAr
                        ? 'تنبيه الأذان المسبق (10 دقائق): انقر للتبديل'
                        : '10-minute pre-adhan alert: click to toggle'
                    }
                  >
                    {isPreAlertEnabled ? (
                      <Volume2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-3 h-3 text-white/40" />
                    )}
                    <span>{isPreAlertEnabled ? (isAr ? 'تنبيه 10د' : '10m On') : isAr ? 'مكتوم' : 'Muted'}</span>
                  </button>

                  {/* Geodesic Qibla Direction Chip */}
                  <div
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300"
                    title={isAr ? `اتجاه القبلة: ${qiblaAngle}° عن الشمال` : `Qibla: ${qiblaAngle}°`}
                  >
                    <Navigation
                      className="w-2.5 h-2.5 text-emerald-400 shrink-0"
                      style={{ transform: `rotate(${qiblaAngle}deg)` }}
                    />
                    <span>{qiblaAngle}°</span>
                    <span className="text-[9px] opacity-60">{isAr ? 'قبلة' : 'Qibla'}</span>
                  </div>

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

              {/* Celestial Astronomical Sky Phase Pill */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs">
                <div className="flex items-center gap-2">
                  <celestialPhase.icon className={`w-3.5 h-3.5 ${celestialPhase.color} shrink-0`} />
                  <span className="text-[11px] font-medium text-slate-200">
                    {isAr ? celestialPhase.labelAr : celestialPhase.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300/80">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{isAr ? 'مضمار الفلك الحي' : 'Live Circadian'}</span>
                </div>
              </div>

              {/* Faith Audio Live Activity Strip */}
              {audioState.isPlaying || audioState.currentTitleAr ? (
                <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-teal-950/60 border border-emerald-500/25 shadow-sm space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      onClick={() => {
                        handleClose();
                        onOpenFaithAudio?.();
                      }}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                      title={isAr ? 'فتح مشغل الأثير الكامل' : 'Open Faith Audio Sanctuary'}
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm relative">
                        <Radio className="w-4 h-4" />
                        {audioState.isPlaying && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                            {audioState.isPlaying ? (isAr ? 'أثير حي يعمل الآن' : 'Live Audio') : (isAr ? 'أثير متوقف مؤقتاً' : 'Audio Paused')}
                          </span>
                          {audioState.isPlaying && (
                            <div className="flex items-end gap-0.5 h-2">
                              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ height: '60%', animationDuration: '0.5s' }} />
                              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ height: '100%', animationDuration: '0.35s' }} />
                              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ height: '40%', animationDuration: '0.6s' }} />
                            </div>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                          {audioState.currentTitleAr || (isAr ? 'أثير السكينة والقرآن' : 'Faith Stream')}
                        </h4>
                        {audioState.currentSheikhAr && (
                          <p className="text-[10px] text-white/50 truncate">
                            {audioState.currentSheikhAr}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Media Micro Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          gymFaithAudio.seekBy(-15);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                        title={isAr ? 'رجوع 15 ثانية' : 'Back 15s'}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          gymFaithAudio.togglePlay();
                        }}
                        className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black shadow-sm transition-all cursor-pointer"
                        title={audioState.isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
                      >
                        {audioState.isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          gymFaithAudio.seekBy(15);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                        title={isAr ? 'تقديم 15 ثانية' : 'Forward 15s'}
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Line */}
                  {audioState.duration > 0 && (
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, (audioState.currentTime / audioState.duration) * 100))}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    handleClose();
                    onOpenFaithAudio?.();
                  }}
                  className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-emerald-400/30 flex items-center justify-between gap-2 cursor-pointer transition-all group"
                  title={isAr ? 'فتح أثير السكينة' : 'Open Faith Audio'}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <Radio className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-bold text-white/80 group-hover:text-emerald-300 truncate">
                      {isAr ? 'أثير السكينة والقرآن الكريم (تلاوات وسيرة)' : 'Faith Audio & Quran Stream'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-300 group-hover:translate-x-[-2px] transition-transform shrink-0 flex items-center gap-0.5">
                    <span>{isAr ? 'استمع الآن' : 'Listen'}</span>
                    <ChevronLeft className="w-3 h-3 rtl:rotate-0 rotate-180" />
                  </span>
                </div>
              )}

              {/* Hero Live Activity Card: Next Prayer, Countdown & Cosmic Timeline */}
              <div
                className={`p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                  isApproaching
                    ? 'bg-gradient-to-br from-amber-500/15 via-[#130F05]/95 to-amber-950/20 border-amber-400/40 shadow-[0_0_24px_rgba(245,158,11,0.2)]'
                    : 'bg-gradient-to-br from-emerald-500/10 via-[#0B1017]/90 to-teal-950/20 border-emerald-500/25 shadow-sm'
                }`}
              >
                {/* Upper Hero Row */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shadow-sm ${
                        isApproaching
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
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
                          className={`text-base font-black tracking-tight ${
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

                  {/* Countdown Badge (Strict RTL: 8س و 30د) */}
                  <div className="text-end">
                    <span className="text-[9px] text-white/50 block font-medium mb-0.5">
                      {isAr ? 'الوقت المتبقي' : 'Remaining'}
                    </span>
                    <div
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg border ${
                        isApproaching
                          ? 'bg-amber-400/20 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                          : 'bg-emerald-500/15 border-emerald-400/30'
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

                {/* Dynamic Elapsed Prayer Interval Progress Rail */}
                <div className="mb-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-white/70 font-medium">
                    <span>
                      {isAr
                        ? `مضى ${prayerWindowProgress.percent}% من وقت ${prayerWindowProgress.prevName}`
                        : `${prayerWindowProgress.percent}% of current window elapsed`}
                    </span>
                    <span className="font-mono text-emerald-300">{100 - prayerWindowProgress.percent}% متبقي</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${prayerWindowProgress.percent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        isApproaching
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                          : 'bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      }`}
                    />
                  </div>
                </div>

                {/* 5-Prayer Cosmic Timeline Ribbon */}
                <div className="pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between gap-1 relative">
                    <div className="absolute top-3 inset-x-4 h-[2px] bg-white/[0.08] -z-0" />

                    {prayersTimeline.map((prayer) => {
                      return (
                        <div
                          key={prayer.key}
                          className="flex flex-col items-center gap-1 relative z-10 flex-1"
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              prayer.isTarget
                                ? isApproaching
                                  ? 'bg-amber-400 text-black font-black shadow-[0_0_10px_rgba(245,158,11,0.9)] ring-2 ring-amber-300/50'
                                  : 'bg-emerald-400 text-black font-black shadow-[0_0_10px_rgba(52,211,153,0.9)] ring-2 ring-emerald-300/50'
                                : prayer.isPast
                                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/35'
                                : 'bg-white/5 text-white/30 border border-white/10'
                            }`}
                          >
                            {prayer.isTarget ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                            ) : prayer.isPast ? (
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            ) : (
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                            )}
                          </div>

                          <span
                            className={`text-[9px] font-bold ${
                              prayer.isTarget
                                ? isApproaching
                                  ? 'text-amber-300'
                                  : 'text-emerald-300'
                                : prayer.isPast
                                ? 'text-white/70'
                                : 'text-white/30'
                            }`}
                          >
                            {isAr ? prayer.ar : prayer.en}
                          </span>

                          <span className="text-[8px] font-mono text-white/40">
                            {formatClockTime(prayer.time, isAr)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Logical Situational Check: Did you pray the previous fard? */}
                {!isPrevPrayerConfirmed && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-[10px] text-white/70">
                      {isAr
                        ? `هل أديت صلاة ${prayerWindowProgress.prevName}؟`
                        : `Did you pray ${prayerWindowProgress.prevName}?`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleConfirmCurrentPrayer(
                          prayerWindowProgress.prevKey,
                          prayerWindowProgress.prevName
                        )
                      }
                      className="tap-spring px-2.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/35 text-[10px] font-bold text-emerald-200 transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>{isAr ? 'أديتها والحمد لله (+50 XP)' : 'Mark Prayed (+50 XP)'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Creative Smart Feature: Focus Sprint Until Prayer (Work & Faith Alignment) */}
              {hasSprintOpportunity && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-sky-500/15 via-teal-500/10 to-indigo-500/15 border border-sky-400/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-sky-200 block">
                        {isAr
                          ? `سبرنت إنجاز حتى أذان ${nextP.arabicName}`
                          : `Sprint until ${nextP.englishName}`}
                      </span>
                      <span className="text-[10px] text-white/50 block">
                        {isAr
                          ? `${prayerSprintMinutes} دقيقة تركيز + 5 دقائق مهلة للوضوء`
                          : `${prayerSprintMinutes}m sprint + 5m wudu buffer`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartPrayerSprint}
                    className="tap-spring px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 text-xs font-bold border border-sky-400/35 cursor-pointer active:scale-95 shrink-0"
                  >
                    {isAr ? 'بدء الآن' : 'Start'}
                  </button>
                </div>
              )}

              {/* Complete 6-Tile Smart Shortcuts Deck (ALL ORIGINAL FEATURES PRESERVED & ELEVATED) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* 1: Smart Haptic Tasbih */}
                <div
                  className={`tap-spring p-2 rounded-xl border text-start transition-all group ${
                    fridayStatus.isWindow
                      ? 'bg-gradient-to-br from-amber-500/15 to-transparent border-amber-400/35'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-emerald-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        fridayStatus.isWindow
                          ? 'bg-amber-400/20 text-amber-300'
                          : 'bg-emerald-400/15 text-emerald-300'
                      }`}
                    >
                      {fridayStatus.isWindow ? (
                        <Star className="w-3 h-3 fill-current" />
                      ) : (
                        <Disc className="w-3 h-3" />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleIncrementIslandTasbih}
                      title={isAr ? 'اضغط للتسبيح المباشر هنا' : 'Quick Tap'}
                      className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/35 text-[9px] font-mono font-bold text-emerald-200 active:scale-90 transition-transform cursor-pointer"
                    >
                      +{islandTasbihCount}/100
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenSmartTasbih?.(
                        fridayStatus.isWindow ? 'salawat_ibrahimiyyah' : 'tahlil_100'
                      );
                    }}
                    className="text-start w-full cursor-pointer"
                  >
                    <span className="text-[11px] font-bold text-white block group-hover:text-emerald-200 transition-colors truncate">
                      {fridayStatus.isWindow
                        ? isAr
                          ? 'الصلاة الإبراهيمية'
                          : 'Friday Salawat'
                        : isAr
                        ? 'المسبحة اللمسية'
                        : 'Smart Tasbih'}
                    </span>
                    <span className="text-[9px] text-white/50 block truncate">
                      {isAr ? 'أذكار وعداد لمسي' : 'Haptic Beads'}
                    </span>
                  </button>
                </div>

                {/* 2: Quran Daily Wird */}
                {onOpenWirdModal && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenWirdModal();
                    }}
                    className="tap-spring p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-emerald-400/40 text-start transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-6 h-6 rounded-lg bg-teal-400/15 text-teal-300 flex items-center justify-center">
                        <BookOpen className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-teal-300">📖</span>
                    </div>
                    <span className="text-[11px] font-bold text-white block group-hover:text-teal-200 transition-colors truncate">
                      {isAr ? 'الورد القرآني' : 'Quran Wird'}
                    </span>
                    <span className="text-[9px] text-white/50 block truncate">
                      {isAr ? 'قراءة وتدبر يومي' : 'Daily Reading'}
                    </span>
                  </button>
                )}

                {/* 3: 20-Minute Focus Session */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    handleClose();
                    onSelectStation('WORK_MICRO_SPRINT');
                  }}
                  className="tap-spring p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-sky-400/40 text-start transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-6 h-6 rounded-lg bg-sky-400/15 text-sky-300 flex items-center justify-center">
                      <Zap className="w-3 h-3" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-sky-300">20m</span>
                  </div>
                  <span className="text-[11px] font-bold text-white block group-hover:text-sky-200 transition-colors truncate">
                    {isAr ? 'سبرنت تركيز 20د' : 'Focus Sprint'}
                  </span>
                  <span className="text-[9px] text-white/50 block truncate">
                    {isAr ? 'إنتاجية بدون تشتت' : 'Zero Distraction'}
                  </span>
                </button>

                {/* 4: 2-Minute Anti-Friction Rule */}
                {onOpenTwoMinuteRule && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenTwoMinuteRule();
                    }}
                    className="tap-spring p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-400/40 text-start transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-6 h-6 rounded-lg bg-amber-400/15 text-amber-300 flex items-center justify-center">
                        <Timer className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-amber-300">120s</span>
                    </div>
                    <span className="text-[11px] font-bold text-white block group-hover:text-amber-200 transition-colors truncate">
                      {isAr ? 'قاعدة الدقيقتين' : '2-Min Rule'}
                    </span>
                    <span className="text-[9px] text-white/50 block truncate">
                      {isAr ? 'كسر التسويف' : 'Beat Friction'}
                    </span>
                  </button>
                )}

                {/* 5: AI Behavioral Guide Coach */}
                {onOpenAiCoach && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenAiCoach();
                    }}
                    className="tap-spring p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-indigo-400/40 text-start transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-6 h-6 rounded-lg bg-indigo-400/15 text-indigo-300 flex items-center justify-center">
                        <Brain className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-indigo-300">AI</span>
                    </div>
                    <span className="text-[11px] font-bold text-white block group-hover:text-indigo-200 transition-colors truncate">
                      {isAr ? 'المرشد السلوكي' : 'Behavior Coach'}
                    </span>
                    <span className="text-[9px] text-white/50 block truncate">
                      {isAr ? 'توجيه وحلول ذكية' : 'Smart Guidance'}
                    </span>
                  </button>
                )}

                {/* 6: Quick Reminder & Alarm */}
                {onOpenQuickReminder && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenQuickReminder();
                    }}
                    className="tap-spring p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-purple-400/40 text-start transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-6 h-6 rounded-lg bg-purple-400/15 text-purple-300 flex items-center justify-center">
                        <Bell className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-purple-300">🔔</span>
                    </div>
                    <span className="text-[11px] font-bold text-white block group-hover:text-purple-200 transition-colors truncate">
                      {isAr ? 'منبه ومفكرة' : 'Quick Alarm'}
                    </span>
                    <span className="text-[9px] text-white/50 block truncate">
                      {isAr ? 'تذكير فوري' : 'Fast Reminder'}
                    </span>
                  </button>
                )}
              </div>

              {/* Bottom Quick Row: AI Courses + Sleep + Evaluation + Lifestyle */}
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-white/60">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    handleClose();
                    localStorage.setItem('midmar_work_view_mode', 'learning_tracker');
                    localStorage.setItem('midmar_learning_subtab', 'courses');
                    window.dispatchEvent(
                      new CustomEvent('midmar_switch_work_mode', {
                        detail: { mode: 'learning_tracker', subTab: 'courses' },
                      })
                    );
                    onSelectStation('WORK_MICRO_SPRINT');
                  }}
                  className="flex items-center gap-1 text-indigo-300 hover:text-indigo-200 cursor-pointer"
                >
                  <GraduationCap className="w-3 h-3" />
                  <span>{isAr ? 'مسار الكورسات (AI)' : 'Courses'}</span>
                </button>

                {onOpenSleepRest && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenSleepRest();
                    }}
                    className="flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{isAr ? 'النوم والاستشفاء' : 'Sleep'}</span>
                  </button>
                )}

                {onOpenEvaluation && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenEvaluation();
                    }}
                    className="flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span>{isAr ? 'التقييم الدوري' : 'Scorecard'}</span>
                  </button>
                )}

                {onOpenLifestyleModal && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleClose();
                      onOpenLifestyleModal();
                    }}
                    className="flex items-center gap-1 text-emerald-300 hover:text-emerald-200 cursor-pointer font-medium"
                  >
                    <Compass className="w-3 h-3" />
                    <span>{isAr ? 'نمط الحياة' : 'Lifestyle'}</span>
                    <ChevronRight className="w-2.5 h-2.5 rtl:rotate-180" />
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
