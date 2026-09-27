import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ShieldAlert,
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

  // Subscribe to real-time audio playback state
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

  const currentMeta = resolveStationMetadata(
    currentStation,
    userState?.settings?.lifestylePersona,
    userState?.settings?.stationCustomOverrides,
    isAr
  );

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

  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsideClick = (e: Event) => {
      const target = e.target as Node;
      if (islandContainerRef.current && !islandContainerRef.current.contains(target)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick, true);
    return () => document.removeEventListener('pointerdown', handleOutsideClick, true);
  }, [isExpanded]);

  const handleToggle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsExpanded(!isExpanded);
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
    <>
      {/* Full-screen Backdrop when Island is Expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="island-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleToggle}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-2xs cursor-pointer"
          />
        )}
      </AnimatePresence>

      <div ref={islandContainerRef} className="relative z-30 w-full max-w-4xl flex justify-center px-1 sm:px-2">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* COMPACT LIVING CAPSULE (Apple VisionOS / Dynamic Island Tier) */
            <div key="compact-pill-wrapper" className="relative group w-full flex justify-center">
              {/* Dynamic Living Reactive Aura */}
              <motion.div
                aria-hidden="true"
                className={`absolute -inset-1 rounded-full blur-md opacity-45 pointer-events-none transition-colors duration-700 ${
                  nextP.minutesRemaining <= 15
                    ? 'bg-gradient-to-r from-rose-500/40 via-amber-500/30 to-rose-500/40'
                    : audioState.isPlaying
                    ? 'bg-gradient-to-r from-teal-500/40 via-sky-500/35 to-emerald-500/40'
                    : fridayStatus.isWindow
                    ? 'bg-gradient-to-r from-amber-400/30 via-emerald-500/30 to-amber-400/30'
                    : 'bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-sky-500/25'
                }`}
                animate={{
                  scale: [1, 1.025, 1],
                  opacity: [0.35, 0.65, 0.35],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              <motion.div
                layoutId="dynamic-island"
                onClick={handleToggle}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                whileHover={{ scale: 1.012, y: -0.5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', damping: 32, stiffness: 380, mass: 0.8 }}
                className="relative w-full max-w-[96vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex items-center justify-between gap-1.5 sm:gap-3 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full bg-slate-950/92 dark:bg-black/95 text-white border border-white/15 dark:border-white/10 shadow-lg shadow-black/40 backdrop-blur-2xl cursor-pointer select-none ring-1 ring-white/10 hover:ring-emerald-500/30 transition-all overflow-hidden"
              >
                {/* Top curved specular edge reflection */}
                <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

                {/* LEFT SEGMENT: Live Station & Vitals */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
                  {/* Live Pulsing Radar Dot */}
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        nextP.minutesRemaining <= 15 ? 'bg-rose-400' : 'bg-emerald-400'
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        nextP.minutesRemaining <= 15 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                  </span>

                  {/* Current Station Tag */}
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-400 truncate max-w-[95px] sm:max-w-[150px] md:max-w-[190px]">
                    {isAr ? currentMeta.shortLabelAr : currentMeta.shortLabelEn}
                  </span>

                  {/* Energy / Survival Mode Chip (on sm+ screens) */}
                  {userState?.survivalMode ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold shrink-0">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      <span>{isAr ? 'MVD طوارئ' : 'MVD'}</span>
                    </span>
                  ) : userState?.energyLevel ? (
                    <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[10px] font-bold shrink-0">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>
                        {isAr
                          ? userState.energyLevel === 'high'
                            ? 'طاقة 100%'
                            : userState.energyLevel === 'medium'
                            ? 'طاقة متوسطة'
                            : 'طاقة منخفضة'
                          : userState.energyLevel}
                      </span>
                    </span>
                  ) : null}
                </div>

                {/* CENTER SEGMENT: Next Prayer & Humane Countdown */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 px-2 sm:px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <motion.div
                    animate={nextP.minutesRemaining <= 15 ? { scale: [1, 1.2, 1], rotate: [0, -6, 6, 0] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="shrink-0 text-amber-400"
                  >
                    <PrayerIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  </motion.div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-200 shrink-0">
                    {nextP.arabicName}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full font-mono text-[10px] sm:text-[11px] font-black tracking-tight shrink-0 ${
                      nextP.minutesRemaining <= 15
                        ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-xs shadow-rose-500/30 animate-pulse'
                        : 'bg-amber-400/15 text-amber-300 border border-amber-400/25'
                    }`}
                  >
                    <bdi dir="ltr">{formatPrayerCountdown(nextP.minutesRemaining, isAr)}</bdi>
                  </span>
                </div>

                {/* RIGHT SEGMENT: Dynamic Living Elements (Audio, Streak, Friday, Chevron) */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Live Audio Equalizer (when audio is playing) */}
                  {audioState.isPlaying && (
                    <div
                      title={audioState.currentTitleAr}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shrink-0"
                    >
                      <div className="flex items-end gap-[2px] h-3.5 w-3.5 shrink-0">
                        {[0, 1, 2, 3].map((barIdx) => (
                          <motion.span
                            key={barIdx}
                            className="w-0.5 bg-emerald-400 rounded-full"
                            animate={{
                              height: ['3px', `${10 + (barIdx % 2) * 3}px`, '4px', `${6 + ((barIdx + 1) % 3) * 3}px`, '3px'],
                            }}
                            transition={{
                              duration: 0.8 + barIdx * 0.15,
                              repeat: Infinity,
                              repeatType: 'reverse',
                              ease: 'easeInOut',
                              delay: barIdx * 0.12,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold max-w-[65px] sm:max-w-[110px] truncate hidden xs:inline-block">
                        {audioState.currentTitleAr || (isAr ? 'الأثير' : 'Audio')}
                      </span>
                    </div>
                  )}

                  {/* Streak Flame */}
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs font-mono text-amber-400 font-bold shrink-0">
                    <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>
                      <bdi dir="ltr">{userState?.streakDays || 0}</bdi>
                    </span>
                  </div>

                  {/* Friday Salawat Season Chip */}
                  {fridayStatus.isWindow && (
                    <span
                      className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold shrink-0"
                      title={isAr ? 'موسم الصلاة الإبراهيمية ليلة ويوم الجمعة' : 'Friday Salawat Window'}
                    >
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400/40 inline" />
                      <span className="hidden md:inline">{isAr ? 'الجمعة' : 'Friday'}</span>
                    </span>
                  )}

                  {/* Animated Interactive Expand Chevron */}
                  <motion.div
                    animate={{ y: [0, 1.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="p-0.5 rounded-full text-white/50 group-hover:text-white/80 transition-colors shrink-0"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          ) : (
            /* EXPANDED INTERACTIVE COCKPIT DRAWER */
            <motion.div
              key="expanded-drawer"
              layoutId="dynamic-island"
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ type: 'spring', damping: 30, stiffness: 360, mass: 0.8 }}
              className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-md sm:max-w-lg rounded-3xl bg-slate-950/98 dark:bg-black/98 text-white border border-white/20 p-4 sm:p-5 shadow-2xl shadow-black/80 backdrop-blur-2xl space-y-4"
            >
              {/* Expanded Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider font-mono">
                    {isAr ? 'الجزيرة الحية • مِضمار Dynamic Island' : 'LifeOS Dynamic Island'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-300 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {isAr ? currentMeta.shortLabelAr : currentMeta.shortLabelEn}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggle}
                    className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
              <div className="space-y-2 pt-1">
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

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {onOpenWirdModal ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        handleToggle();
                        onOpenWirdModal();
                      }}
                      className="tap-spring flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 cursor-pointer active:scale-95"
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
                      className="tap-spring flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 text-xs font-bold border border-white/10 cursor-pointer active:scale-95"
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
                      className="tap-spring flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold border border-sky-500/30 cursor-pointer active:scale-95"
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
                      className="tap-spring flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 text-xs font-bold border border-white/10 cursor-pointer active:scale-95"
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isAr ? 'النوم والاستشفاء' : 'Sleep Rest'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
