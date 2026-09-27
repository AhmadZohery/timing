import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Clock,
  Timer,
  Compass,
  Zap,
  Trophy,
  X,
  ChevronDown,
  BookOpen,
  Disc,
  Star,
  Bell,
  GraduationCap,
  Sunrise,
  Sunset,
  Sun,
  Moon,
  Play,
  Pause,
  Radio,
} from 'lucide-react';
import type { DailyLog, UserState, StationId } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { calculatePrayerTimes, getNextPrayer } from '../../utils/prayerCalculator';
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
}

/**
 * Humanized prayer countdown:
 * If >= 60 minutes: e.g. "2س 28د" or "1س"
 * If < 60 minutes: e.g. "45د"
 * If <= 0 minutes: "حان الآن"
 */
export const formatPrayerCountdown = (minutes: number, isArabic: boolean): string => {
  if (minutes <= 0) return isArabic ? 'حان الآن' : 'Now';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    if (mins === 0) return isArabic ? `${hours}س` : `${hours}h`;
    return isArabic ? `${hours}س ${mins}د` : `${hours}h ${mins}m`;
  }
  return isArabic ? `${minutes}د` : `${minutes}m`;
};

const getPrayerIcon = (name: string) => {
  switch (name) {
    case 'fajr':
    case 'sunrise':
      return Sunrise;
    case 'dhuhr':
    case 'asr':
      return Sun;
    case 'maghrib':
      return Sunset;
    case 'isha':
    default:
      return Moon;
  }
};

// Physics spring configuration tuned for genuine Apple Dynamic Island liquid elasticity
const ISLAND_SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 440,
  damping: 30,
  mass: 0.7,
};

export const DynamicIslandHub: React.FC<DynamicIslandHubProps> = ({
  currentStation,
  userState,
  todayLog: _todayLog,
  onSelectStation,
  onOpenAiCoach,
  onOpenTwoMinuteRule,
  onOpenEvaluation,
  onOpenSleepRest,
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
  const [audioState, setAudioState] = useState<GymFaithAudioState>(() => gymFaithAudio.getState());

  // Real-time audio subscription
  useEffect(() => {
    return gymFaithAudio.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

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
    return { fridayStatus, nextP };
  }, [userState?.settings?.prayerLocation]);

  const { fridayStatus, nextP } = prayerData;
  const PrayerIcon = getPrayerIcon(nextP.name);

  // Station metadata: only show tag when the user is in an active non-home station
  const isSpecialStation = currentStation !== 'HOME';
  const currentMeta = resolveStationMetadata(
    currentStation,
    userState?.settings?.lifestylePersona,
    userState?.settings?.stationCustomOverrides,
    isAr
  );

  // Close on Escape key
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundSynth.playTactileClick();
        haptic.vibrateLight();
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const islandContainerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsideClick = (e: Event) => {
      const target = e.target as Node;
      if (islandContainerRef.current && !islandContainerRef.current.contains(target)) {
        soundSynth.playTactileClick();
        haptic.vibrateLight();
        setIsExpanded(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick, true);
    return () => document.removeEventListener('pointerdown', handleOutsideClick, true);
  }, [isExpanded]);

  const handleToggle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsExpanded((prev) => !prev);
  };

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (audioState.isPlaying) {
      gymFaithAudio.pause();
    } else {
      gymFaithAudio.play();
    }
  };

  return (
    <div ref={islandContainerRef} className="relative z-30 flex justify-center items-center w-full min-h-[38px]">
      {/* Full-screen Backdrop rendered at body level to avoid any containment or stacking clipping */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                key="island-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsExpanded(false);
                }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-2xs cursor-pointer"
              />
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Shared Layout Shell: Authentic Liquid Mercury Morph between Pill and Drawer */}
      <AnimatePresence initial={false}>
        {!isExpanded ? (
          /* ================= COMPACT FLOATING PILL (HUGS CONTENT, NO STRETCH, NO "الرئيسية") ================= */
          <motion.div
            key="compact-island"
            layoutId="midmar-dynamic-island"
            onClick={handleToggle}
            whileHover={{ scale: 1.025, y: -0.5 }}
            whileTap={{ scale: 0.96 }}
            transition={ISLAND_SPRING_TRANSITION}
            className="relative z-30 inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-950/95 dark:bg-black/98 text-white border border-white/15 dark:border-white/10 shadow-lg shadow-black/40 backdrop-blur-2xl cursor-pointer select-none ring-1 ring-white/10 hover:ring-emerald-500/30 transition-shadow overflow-hidden"
          >
            {/* Top specular reflection line (Apple Glass feel) */}
            <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

            {/* Living Ambient Reactive Aura */}
            <motion.div
              layoutId="midmar-island-aura"
              className={`absolute -inset-1 rounded-full blur-md opacity-40 pointer-events-none transition-colors duration-500 ${
                nextP.minutesRemaining <= 15
                  ? 'bg-rose-500/35'
                  : audioState.isPlaying
                  ? 'bg-emerald-500/30'
                  : fridayStatus.isWindow
                  ? 'bg-amber-400/25'
                  : 'bg-emerald-500/20'
              }`}
              animate={{ scale: [1, 1.03, 1], opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* 1. Live Pulsing Radar Dot */}
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  nextP.minutesRemaining <= 15 ? 'bg-rose-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  nextP.minutesRemaining <= 15 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
            </span>

            {/* 2. Active Station Tag ONLY if NOT on Home (Never show "الرئيسية") */}
            {isSpecialStation && (
              <span className="text-[11px] font-bold text-emerald-400 truncate max-w-[100px] sm:max-w-[140px]">
                {isAr ? currentMeta.shortLabelAr : currentMeta.shortLabelEn}
              </span>
            )}

            {/* 3. Next Prayer Icon & Humanized Countdown */}
            <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              <motion.div
                animate={nextP.minutesRemaining <= 15 ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : {}}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="shrink-0 text-amber-400"
              >
                <PrayerIcon className="w-3.5 h-3.5 text-amber-400" />
              </motion.div>
              <span className="text-[11px] font-bold text-slate-200 shrink-0">{nextP.arabicName}</span>
              <span
                className={`inline-flex items-center px-1.5 py-0.2 rounded-full font-mono text-[10px] sm:text-[11px] font-black tracking-tight shrink-0 ${
                  nextP.minutesRemaining <= 15
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-xs shadow-rose-500/30 animate-pulse'
                    : 'bg-amber-400/15 text-amber-300 border border-amber-400/25'
                }`}
              >
                <bdi dir="ltr">{formatPrayerCountdown(nextP.minutesRemaining, isAr)}</bdi>
              </span>
            </div>

            {/* 4. Live Audio Equalizer (if audio is active) */}
            {audioState.isPlaying && (
              <div
                title={audioState.currentTitleAr}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shrink-0"
              >
                <div className="flex items-end gap-[2px] h-3 w-3 shrink-0">
                  {[0, 1, 2, 3].map((barIdx) => (
                    <motion.span
                      key={barIdx}
                      className="w-0.5 bg-emerald-400 rounded-full"
                      animate={{
                        height: ['2.5px', `${8 + (barIdx % 2) * 3}px`, '3px', `${5 + ((barIdx + 1) % 3) * 3}px`, '2.5px'],
                      }}
                      transition={{
                        duration: 0.75 + barIdx * 0.12,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                        delay: barIdx * 0.1,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold max-w-[70px] truncate hidden sm:inline-block">
                  {audioState.currentTitleAr || (isAr ? 'الأثير' : 'Audio')}
                </span>
              </div>
            )}

            {/* 5. Daily Streak Flame */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold shrink-0">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>
                <bdi dir="ltr">{userState?.streakDays || 0}</bdi>
              </span>
            </div>

            {/* 6. Friday Blessing Chip (if Friday window) */}
            {fridayStatus.isWindow && (
              <span
                className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold shrink-0"
                title={isAr ? 'موسم الصلاة الإبراهيمية ليلة ويوم الجمعة' : 'Friday Salawat Window'}
              >
                <Star className="w-3 h-3 text-amber-400 fill-amber-400/40 inline" />
                <span>{isAr ? 'الجمعة' : 'Friday'}</span>
              </span>
            )}

            {/* 7. Interactive Chevron */}
            <motion.div
              animate={{ y: [0, 1.2, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-white/40 group-hover:text-white/80 transition-colors shrink-0 -me-0.5"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </motion.div>
        ) : (
          /* ================= EXPANDED LIQUID COCKPIT DRAWER (FLUID SPRING MORPH) ================= */
          <motion.div
            key="expanded-island"
            layoutId="midmar-dynamic-island"
            transition={ISLAND_SPRING_TRANSITION}
            className="absolute top-0 left-0 right-0 mx-auto z-50 w-[92vw] max-w-sm sm:max-w-md rounded-[28px] bg-slate-950/98 dark:bg-black/98 text-white border border-white/20 p-4 sm:p-5 shadow-2xl shadow-black/90 backdrop-blur-2xl space-y-3.5 overflow-hidden"
          >
            {/* Top specular reflection line */}
            <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

            {/* Living Ambient Reactive Aura (smoothly morphs with container) */}
            <motion.div
              layoutId="midmar-island-aura"
              className={`absolute -inset-2 rounded-[32px] blur-xl opacity-35 pointer-events-none transition-colors duration-500 ${
                nextP.minutesRemaining <= 15
                  ? 'bg-rose-500/35'
                  : audioState.isPlaying
                  ? 'bg-emerald-500/30'
                  : fridayStatus.isWindow
                  ? 'bg-amber-400/25'
                  : 'bg-emerald-500/20'
              }`}
            />

            {/* Inner Content with subtle staggered entrance during liquid morph */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, delay: 0.05 }}
              className="w-full space-y-3.5 relative z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider font-mono">
                    {isAr ? 'الجزيرة الحية • مِضمار Island' : 'LifeOS Dynamic Island'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isSpecialStation && (
                    <span className="text-[11px] font-bold text-slate-300 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                      {isAr ? currentMeta.shortLabelAr : currentMeta.shortLabelEn}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleToggle}
                    className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Audio Control Bar (if audio is active or playing) */}
              {audioState.currentTitleAr && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-sky-500/15 border border-emerald-500/25 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                      <Radio className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{audioState.currentTitleAr}</p>
                      <p className="text-[10px] text-emerald-400/80 truncate">
                        {audioState.currentSheikhAr || (isAr ? 'أثير مضمار الإيماني' : 'Midmar Faith Audio')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAudio}
                    className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-transform active:scale-90 cursor-pointer shrink-0 shadow-md"
                    title={audioState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                  >
                    {audioState.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                </div>
              )}

              {/* Quick Vital Status Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Next Prayer Card */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-white/60">
                    <span>{isAr ? 'الصلاة القادمة' : 'Next Prayer'}</span>
                    <PrayerIcon className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-amber-300">{nextP.arabicName}</span>
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded-full font-black ${
                        nextP.minutesRemaining <= 15
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : 'bg-amber-400/15 text-amber-300 border border-amber-400/25'
                      }`}
                    >
                      <bdi dir="ltr">{formatPrayerCountdown(nextP.minutesRemaining, isAr)}</bdi>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block text-end">
                    {nextP.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Streak & Energy Card */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-white/60">
                    <span>{isAr ? 'سلسلة التتابع' : 'Streak'}</span>
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex items-center justify-between font-bold text-amber-400">
                    <span>
                      {userState?.streakDays || 0} {isAr ? 'أيام' : 'days'}
                    </span>
                    {userState?.streakShields && userState.streakShields > 0 ? (
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-500/20 px-1.5 py-0.5 rounded-full">
                        🛡️ {userState.streakShields}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] text-emerald-400 block text-end">
                    {userState?.survivalMode ? (isAr ? '🛡️ وضع النجاة' : 'MVD Mode') : (isAr ? '⚡ وتيرة نشطة' : 'Active Flow')}
                  </span>
                </div>
              </div>

              {/* 1-Tap Quick Action Buttons */}
              <div className="space-y-1.5 pt-1">
                {/* Friday Salawat Season Priority Action */}
                {fridayStatus.isWindow && onOpenSmartTasbih && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleToggle();
                      onOpenSmartTasbih('salawat_ibrahimiyyah');
                    }}
                    className="tap-spring w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-emerald-500/20 to-amber-500/25 hover:from-amber-500/35 hover:to-amber-500/35 text-amber-300 text-xs font-bold border border-amber-500/40 transition-all cursor-pointer active:scale-98 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400/40 shrink-0" />
                      <span>{isAr ? 'موسم الصلاة الإبراهيمية المباركة' : 'Friday Salawat Ibrahimiyyah'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-black">+25 XP</span>
                  </button>
                )}

                {/* General Smart Tasbih quick launch if not Friday */}
                {!fridayStatus.isWindow && onOpenSmartTasbih && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleToggle();
                      onOpenSmartTasbih('tahlil_100');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold border border-teal-500/30 transition-all cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <Disc className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{isAr ? 'المسبحة اللمسية الذكية' : 'Smart Haptic Tasbih'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-teal-400 font-bold">100x</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    handleToggle();
                    onSelectStation('WORK_MICRO_SPRINT');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold border border-sky-500/30 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <span>{isAr ? 'بدء جلسة عمل وتركيز 20 دقيقة' : 'Start 20m Focus Session'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 font-bold">20m</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    handleToggle();
                    onOpenTwoMinuteRule?.();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'كسر التسويف: قاعدة الدقيقتين' : '2-Minute Anti-Friction'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">120s</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    handleToggle();
                    onOpenAiCoach?.();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    <span>{isAr ? 'استشارة المرشد السلوكي الذكي' : 'Behavioral Mindset Guide'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">Coach</span>
                </button>

                {onOpenQuickReminder && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      handleToggle();
                      onOpenQuickReminder();
                    }}
                    className="tap-spring w-full flex items-center justify-between p-2.5 rounded-2xl bg-violet-500/20 hover:bg-violet-500/30 text-purple-300 text-xs font-bold border border-violet-500/30 transition-all cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-purple-400" />
                      <span>{isAr ? 'منبه ومفكرة تذكير ذكية سريعة' : 'Quick Reminder & Alarm'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400 font-bold">🔔</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    handleToggle();
                    localStorage.setItem('midmar_work_view_mode', 'learning_tracker');
                    localStorage.setItem('midmar_learning_subtab', 'courses');
                    window.dispatchEvent(
                      new CustomEvent('midmar_switch_work_mode', {
                        detail: { mode: 'learning_tracker', subTab: 'courses' },
                      })
                    );
                    onSelectStation('WORK_MICRO_SPRINT');
                  }}
                  className="tap-spring w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-sky-500/15 to-indigo-500/20 hover:from-indigo-500/30 hover:to-sky-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span>{isAr ? 'مخطط ومسار الكورسات الذكي (AI)' : 'AI Course Study Roadmap'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">📚</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {onOpenWirdModal ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        handleToggle();
                        onOpenWirdModal();
                      }}
                      className="tap-spring flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{isAr ? 'الورد القرآني' : 'Quran Wird'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        handleToggle();
                        onOpenEvaluation?.();
                      }}
                      className="tap-spring flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 text-xs font-bold border border-white/10 cursor-pointer active:scale-95"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? 'التقييم الدوري' : 'Scorecard'}</span>
                    </button>
                  )}

                  {onOpenLifestyleModal ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        handleToggle();
                        onOpenLifestyleModal();
                      }}
                      className="tap-spring flex items-center justify-center gap-1.5 p-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold border border-sky-500/30 cursor-pointer active:scale-95"
                    >
                      <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{isAr ? 'نمط الحياة' : 'Lifestyle'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        handleToggle();
                        onOpenSleepRest?.();
                      }}
                      className="tap-spring flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 text-xs font-bold border border-white/10 cursor-pointer active:scale-95"
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isAr ? 'النوم والاستشفاء' : 'Sleep Rest'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
