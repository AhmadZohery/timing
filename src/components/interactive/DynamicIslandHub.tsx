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
  Navigation,
  Sun,
  Moon,
  Sunset,
  Volume2,
  VolumeX,
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
 * Mathematically and culturally flawless Chronograph Time Remaining Chip.
 *
 * In Arabic (RTL):
 * The container is explicitly dir="rtl".
 * The FIRST child in DOM (Hours) is rendered on the RIGHT.
 * The SECOND child in DOM (Minutes) is rendered on the LEFT of hours.
 * Reading right-to-left: First Hours, then Minutes (e.g. 6س 20د).
 *
 * Inside each unit span (e.g. 6س), dir="ltr" ensures the digit precedes the letter (never inverted to س 6).
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
      : 'text-xs font-bold';

  const unitClasses =
    size === 'lg'
      ? 'text-xs font-semibold opacity-80'
      : size === 'md'
      ? 'text-[11px] font-medium opacity-80'
      : 'text-[10px] font-medium opacity-80';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`inline-flex items-center gap-1.5 font-mono select-none ${fontClasses} ${
        isApproaching ? 'text-amber-300' : 'text-emerald-400'
      }`}
    >
      {hours > 0 && (
        <span dir="ltr" className="inline-flex items-center gap-0.5">
          <span>{hours}</span>
          <span className={unitClasses}>{isAr ? 'س' : 'h'}</span>
        </span>
      )}
      {(remainingMins > 0 || hours === 0) && (
        <span dir="ltr" className="inline-flex items-center gap-0.5">
          <span>{remainingMins}</span>
          <span className={unitClasses}>{isAr ? 'د' : 'm'}</span>
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
  onOpenAiCoach: _onOpenAiCoach,
  onOpenTwoMinuteRule,
  onOpenEvaluation: _onOpenEvaluation,
  onOpenSleepRest: _onOpenSleepRest,
  onRewardToast,
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

  // Pre-Adhan Alert Armed Toggle State (Armed by default)
  const [isPreAlertEnabled, setIsPreAlertEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('midmar_pre_adhan_alert_armed');
      return stored !== 'false';
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
    try {
      localStorage.setItem('midmar_pre_adhan_alert_armed', String(nextVal));
    } catch (_) {}
    if (onRewardToast) {
      onRewardToast(
        nextVal
          ? isAr
            ? 'تم تفعيل تنبيه الأذان المسبق (10 دقائق) 🔔'
            : '10-minute pre-adhan alert enabled 🔔'
          : isAr
          ? 'تم كتم تنبيه الأذان المسبق 🔕'
          : '10-minute pre-adhan alert muted 🔕'
      );
    }
  };

  // In-Island Mini Tasbih Counter
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

  // Prayer and Qibla Calculation
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

  // Situational Intelligence: Current Prayer Interval Progress %
  const prayerWindowProgress = useMemo(() => {
    const canonical = [
      { name: 'fajr', time: pTimes.fajr, ar: 'الفجر', en: 'Fajr' },
      { name: 'dhuhr', time: pTimes.dhuhr, ar: 'الظهر', en: 'Dhuhr' },
      { name: 'asr', time: pTimes.asr, ar: 'العصر', en: 'Asr' },
      { name: 'maghrib', time: pTimes.maghrib, ar: 'المغرب', en: 'Maghrib' },
      { name: 'isha', time: pTimes.isha, ar: 'العشاء', en: 'Isha' },
    ];

    const nextIdx = canonical.findIndex((p) => p.name === nextP.name);
    if (nextIdx === -1) {
      return { percent: 50, prevName: isAr ? 'الوقت الحالي' : 'Current Window' };
    }

    const prevIdx = (nextIdx - 1 + canonical.length) % canonical.length;
    const prevPrayer = canonical[prevIdx];
    const nextPrayer = canonical[nextIdx];

    let prevMs = prevPrayer.time.getTime();
    let nextMs = nextPrayer.time.getTime();
    const nowMs = Date.now();

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
    };
  }, [pTimes, nextP.name, isAr]);

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
            transition={{ duration: 0.1 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] cursor-pointer"
          />
        )}
      </AnimatePresence>

      <div className="relative z-50 flex justify-center w-full px-2 sm:px-4">
        {/* Generous Stately Island Capsule with Pure Obsidian Crystal Glass & Radiant Neon Auroras */}
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
              ? 'w-full max-w-lg bg-[#080C14]/96 dark:bg-black/98 text-white border border-emerald-500/35 p-4 sm:p-5 shadow-[0_28px_80px_rgba(0,0,0,0.95),0_0_30px_rgba(16,185,129,0.14),inset_0_1px_1.5px_rgba(255,255,255,0.2)] backdrop-blur-3xl'
              : isApproaching
              ? 'w-full max-w-[390px] sm:max-w-[450px] bg-[#120F06]/95 dark:bg-black/95 text-white border border-amber-400/50 ring-1 ring-amber-400/30 px-4 sm:px-5 py-2.5 shadow-[0_12px_32px_rgba(245,158,11,0.25),inset_0_1px_1.5px_rgba(253,224,71,0.25)] cursor-pointer hover:scale-[1.015] active:scale-[0.98]'
              : 'w-full max-w-[390px] sm:max-w-[450px] bg-[#080C14]/95 dark:bg-black/95 text-white border border-emerald-500/35 ring-1 ring-emerald-400/20 px-4 sm:px-5 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.8),0_0_24px_rgba(16,185,129,0.18),inset_0_1px_1.5px_0_rgba(255,255,255,0.22)] cursor-pointer hover:scale-[1.015] active:scale-[0.98]'
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
          {/* Radiant Specular Edge Light */}
          <div
            className={`absolute inset-x-0 top-0 h-[1.5px] pointer-events-none ${
              isApproaching
                ? 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent'
                : 'bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent'
            }`}
          />

          {/* ================================================================ */}
          {/* COMPACT STATELY CAPSULE (Generously Proportioned & Symmetrical)  */}
          {/* ================================================================ */}
          {!isExpanded && (
            <motion.div
              key="compact-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="flex items-center justify-between w-full gap-2 sm:gap-3"
            >
              {/* Right Wing (in RTL): Luminous Beacon + Prayer Name + Scheduled Time */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
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

                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-xs font-bold tracking-tight ${
                      isApproaching ? 'text-amber-200' : 'text-white'
                    }`}
                  >
                    {nextP.arabicName}
                  </span>
                  <span className="text-[10px] font-mono text-white/50 hidden xs:inline">
                    {formatClockTime(nextP.time, isAr)}
                  </span>
                </div>
              </div>

              {/* Center Anchor: Countdown Chip (Hours FIRST then Minutes in RTL) */}
              <div
                className={`flex items-center px-2.5 py-1 rounded-full ${
                  isApproaching
                    ? 'bg-amber-400/20 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-emerald-950/50 border border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                }`}
              >
                <span className="text-[10px] text-white/50 me-1 hidden sm:inline">
                  {isAr ? 'متبقي' : 'in'}
                </span>
                <TimeRemainingChip
                  minutes={nextP.minutesRemaining}
                  isAr={isAr}
                  isApproaching={isApproaching}
                  size="sm"
                />
              </div>

              {/* Left Wing: Streak Flame / Qibla / Salawat */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Station Tag: ONLY show if outside HOME */}
                {currentStation !== 'HOME' ? (
                  <span className="text-[10px] font-bold text-emerald-300/90 truncate max-w-[85px] tracking-tight hidden xs:inline">
                    {isAr ? currentMeta.shortLabelAr : currentMeta.shortLabelEn}
                  </span>
                ) : (
                  <div
                    className="hidden xs:flex items-center gap-1 text-[10px] font-mono text-emerald-300/80"
                    title={isAr ? `اتجاه القبلة: ${qiblaAngle}°` : `Qibla: ${qiblaAngle}°`}
                  >
                    <Navigation
                      className="w-2.5 h-2.5 text-emerald-400"
                      style={{ transform: `rotate(${qiblaAngle}deg)` }}
                    />
                    <span>{qiblaAngle}°</span>
                  </div>
                )}

                {/* Flame Streak Chip */}
                {(userState?.streakDays || 0) > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-amber-300">
                    <Flame className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{userState?.streakDays}</span>
                  </div>
                )}

                {/* Friday Salawat Season Blossom */}
                {fridayStatus.isWindow && (
                  <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300/40 animate-spin-slow shrink-0" />
                )}
              </div>
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* EXPANDED MASTERPIECE SANCTUARY                                   */}
          {/* ================================================================ */}
          {isExpanded && (
            <motion.div
              key="expanded-content"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="space-y-3.5"
            >
              {/* Top Header Bar: Status + Qibla Bearing + Alert Toggle + Close */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
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
                  <span>{isAr ? 'توقيت فلكي حي' : 'Live Celestial'}</span>
                </div>
              </div>

              {/* Hero Live Activity Card: Next Prayer & 5-Prayer Orbital Ribbon */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                  isApproaching
                    ? 'bg-gradient-to-br from-amber-500/15 via-[#130F05]/95 to-amber-950/20 border-amber-400/40 shadow-[0_0_24px_rgba(245,158,11,0.2)]'
                    : 'bg-gradient-to-br from-emerald-500/10 via-[#0B1017]/90 to-teal-950/20 border-emerald-500/25 shadow-sm'
                }`}
              >
                {/* Upper Hero Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
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

                  {/* Countdown Badge with Strict RTL Order (Hours FIRST then Minutes) */}
                  <div className="text-end">
                    <span className="text-[9px] text-white/50 block font-medium mb-0.5">
                      {isAr ? 'الوقت المتبقي' : 'Remaining'}
                    </span>
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-xl border ${
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
                <div className="mb-3 space-y-1">
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
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              prayer.isTarget
                                ? isApproaching
                                  ? 'bg-amber-400 text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.9)] ring-2 ring-amber-300/50'
                                  : 'bg-emerald-400 text-black font-black shadow-[0_0_12px_rgba(52,211,153,0.9)] ring-2 ring-emerald-300/50'
                                : prayer.isPast
                                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/35'
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

                          <span
                            className={`text-[10px] font-bold ${
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
                  <div className="mt-3 pt-2 border-t border-amber-400/25 flex items-center gap-2 text-[11px] text-amber-200/95 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                    <span>
                      {isAr
                        ? 'اقترب موعد الأذان (خلال 10 دقائق).. تهيأ بالوضوء والسكينة لصلاتك 🤲'
                        : 'Adhan is approaching. Prepare with peace and wudu.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Spatial 4-Tile Luxury Action Deck */}
              <div className="grid grid-cols-2 gap-2">
                {/* Tile 1: Interactive Smart Haptic Tasbih with In-Island Bead Tapping */}
                <div
                  className={`tap-spring p-3 rounded-2xl border text-start transition-all group ${
                    fridayStatus.isWindow
                      ? 'bg-gradient-to-br from-amber-500/15 to-transparent border-amber-400/35 hover:border-amber-400/55'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-emerald-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        fridayStatus.isWindow
                          ? 'bg-amber-400/20 text-amber-300'
                          : 'bg-emerald-400/15 text-emerald-300'
                      }`}
                    >
                      {fridayStatus.isWindow ? (
                        <Star className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Disc className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Quick In-Island Tap Bead Counter */}
                    <button
                      type="button"
                      onClick={handleIncrementIslandTasbih}
                      title={isAr ? 'اضغط للتسبيح المباشر هنا' : 'Quick Tap Tasbih'}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/35 text-[10px] font-mono font-bold text-emerald-200 active:scale-90 transition-transform cursor-pointer shadow-sm"
                    >
                      +{islandTasbihCount}/100
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
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
                      className="text-start flex-1 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-white block group-hover:text-emerald-200 transition-colors">
                        {fridayStatus.isWindow
                          ? isAr
                            ? 'الصلاة الإبراهيمية'
                            : 'Friday Salawat'
                          : isAr
                          ? 'المسبحة اللمسية'
                          : 'Smart Tasbih'}
                      </span>
                      <span className="text-[10px] text-white/50 block mt-0.5">
                        {isAr ? 'سبحان الله وبحمده' : 'Subhan Allah'}
                      </span>
                    </button>
                  </div>
                </div>

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
                    className="tap-spring p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-emerald-400/40 text-start transition-all cursor-pointer active:scale-95 group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-7 h-7 rounded-xl bg-teal-400/15 text-teal-300 flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-teal-300">
                        📖
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white block group-hover:text-teal-200 transition-colors">
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
                  className="tap-spring p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-sky-400/40 text-start transition-all cursor-pointer active:scale-95 group"
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
                    className="tap-spring p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-400/40 text-start transition-all cursor-pointer active:scale-95 group"
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
                    className="tap-spring p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-purple-400/40 text-start transition-all cursor-pointer active:scale-95 group"
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
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white/60">
                  <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
                    className="text-[10px] font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 cursor-pointer"
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
