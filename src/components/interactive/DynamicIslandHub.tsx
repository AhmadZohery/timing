import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
} from 'lucide-react';
import type { DailyLog, UserState, StationId } from '../../types';
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

function formatRemainingTime(minutes: number, isAr: boolean): string {
  if (minutes <= 0) return isAr ? 'حان الآن 🕌' : 'Now 🕌';
  if (minutes < 60) return `${minutes}${isAr ? 'د' : 'm'}`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours}${isAr ? 'س' : 'h'}`;
  }
  return isAr ? `${hours}س و ${remainingMins}د` : `${hours}h ${remainingMins}m`;
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
  const isApproaching = nextP.minutesRemaining > 0 && nextP.minutesRemaining <= 15;

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

  const islandContainerRef = React.useRef<HTMLDivElement>(null);

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
    setIsExpanded((prev) => !prev);
  };

  const springTransition = {
    type: 'spring' as const,
    damping: 28,
    stiffness: 340,
    mass: 0.65,
  };

  return (
    <>
      {/* Invisible Touch Layer for Quick Dismiss without screen darkening */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="island-backdrop-invisible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleToggle}
            className="fixed inset-0 z-40 bg-transparent cursor-pointer"
          />
        )}
      </AnimatePresence>

      <div ref={islandContainerRef} className="relative z-40 flex justify-center w-full max-w-md">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // ================================================================
            // COMPACT IDLE CAPSULE (Apple VisionOS / Dynamic Island Style)
            // ================================================================
            <motion.div
              key="compact-island"
              layoutId="dynamic-island-morph"
              onClick={handleToggle}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={springTransition}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggle();
                }
              }}
              className={`group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full select-none cursor-pointer transition-all duration-300 ${
                isApproaching
                  ? 'bg-gradient-to-r from-amber-950/70 via-slate-900/95 to-amber-950/70 text-white border border-amber-400/40 ring-1 ring-amber-400/50 shadow-[0_0_24px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900/95 dark:bg-black/95 text-white border border-white/15 ring-1 ring-emerald-500/25 shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12)]'
              }`}
            >
              {/* Organic Live Pulse Beacon */}
              <span className="relative flex h-2 w-2 shrink-0">
                {isApproaching ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                  </>
                )}
              </span>

              {/* Station Tag: ONLY show if NOT at HOME */}
              {currentStation !== 'HOME' && (
                <>
                  <span className="text-[11px] font-bold text-emerald-400 truncate max-w-[110px] sm:max-w-[140px]">
                    {isAr ? currentMeta.shortLabelAr : currentMeta.shortLabelEn}
                  </span>
                  <span className="text-white/30 text-xs">|</span>
                </>
              )}

              {/* Next Prayer Countdown with Organic Approaching Indicator */}
              <div className="flex items-center gap-1.5 text-[11px] font-medium shrink-0">
                <span className={isApproaching ? 'text-amber-200 font-bold' : 'text-slate-300'}>
                  {nextP.arabicName}
                </span>

                {isApproaching ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    <span className="text-[10px]">⏳</span>
                    <bdi dir="ltr">{formatRemainingTime(nextP.minutesRemaining, isAr)}</bdi>
                  </span>
                ) : (
                  <span className="font-bold font-mono text-emerald-300 text-[11px]">
                    <bdi dir="ltr">{formatRemainingTime(nextP.minutesRemaining, isAr)}</bdi>
                  </span>
                )}
              </div>

              {/* Streak Flame Counter */}
              <div className="hidden xs:flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold shrink-0">
                <span className="text-white/30 text-xs me-0.5">|</span>
                <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>
                  <bdi dir="ltr">{userState?.streakDays || 0}</bdi>
                </span>
              </div>

              {/* Friday Salawat Season Indicator */}
              {fridayStatus.isWindow && (
                <>
                  <span className="text-white/30 text-xs">|</span>
                  <span
                    className="text-xs text-amber-300"
                    title={
                      isAr
                        ? 'موسم الصلاة الإبراهيمية ليلة ويوم الجمعة'
                        : 'Friday Salawat Window'
                    }
                  >
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400/40 inline animate-spin-slow" />
                  </span>
                </>
              )}

              <ChevronDown className="w-3.5 h-3.5 text-white/50 -me-0.5 shrink-0 group-hover:text-white transition-colors" />
            </motion.div>
          ) : (
            // ================================================================
            // EXPANDED VISIONOS LIQUID MORPH DRAWER
            // ================================================================
            <motion.div
              key="expanded-island"
              layoutId="dynamic-island-morph"
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={springTransition}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-md rounded-[28px] bg-slate-950/95 dark:bg-black/95 text-white border border-white/15 p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl space-y-3.5"
            >
              {/* Dynamic Island Header Bar */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 uppercase tracking-wider font-mono">
                    {isAr ? 'الجزيرة الحية • مضمار Island' : 'LifeOS Dynamic Island'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    ESC
                  </span>
                  <button
                    type="button"
                    onClick={handleToggle}
                    className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label={isAr ? 'إغلاق' : 'Close'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Spiritual Anchor & Next Prayer Hero Card */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  isApproaching
                    ? 'bg-gradient-to-br from-amber-500/15 via-slate-900/80 to-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isApproaching
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      🕌
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60 block font-medium">
                        {isAr ? 'الصلاة القادمة' : 'Next Prayer'}
                      </span>
                      <span
                        className={`text-sm font-black ${
                          isApproaching ? 'text-amber-300' : 'text-white'
                        }`}
                      >
                        {nextP.arabicName}
                      </span>
                    </div>
                  </div>

                  <div className="text-end">
                    <span className="font-mono text-xs font-bold text-white/90 block">
                      {nextP.time.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span
                      className={`inline-block text-[11px] font-mono font-black ${
                        isApproaching ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      <bdi dir="ltr">{formatRemainingTime(nextP.minutesRemaining, isAr)}</bdi>
                    </span>
                  </div>
                </div>

                {/* Approaching Encouragement Banner */}
                {isApproaching && (
                  <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center gap-2 text-xs text-amber-200/90 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                    <span>
                      {isAr
                        ? 'اقترب موعد الأذان.. تهيأ بالوضوء والسكينة لصلاتك في أول وقتها 🤲'
                        : 'Adhan is approaching. Prepare with peace and wudu.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Vital Status Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] text-white/50 block">
                    {isAr ? 'المحطة الحالية' : 'Active Station'}
                  </span>
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span className="truncate max-w-[120px]">
                      {isAr ? currentMeta.shortLabelAr : currentMeta.shortLabelEn}
                    </span>
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] text-white/50 block">
                    {isAr ? 'سلسلة التتابع' : 'Streak'}
                  </span>
                  <div className="flex items-center justify-between font-bold text-amber-400">
                    <span>
                      {userState?.streakDays || 0} {isAr ? 'أيام' : 'days'}
                    </span>
                    <Flame className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </div>

              {/* 1-Tap Quick Action Shortcuts */}
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
                      <span>
                        {isAr
                          ? 'موسم الصلاة الإبراهيمية المباركة'
                          : 'Friday Salawat Ibrahimiyyah'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-black">
                      +25 XP
                    </span>
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
                    className="tap-spring w-full flex items-center justify-between p-2.5 rounded-2xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold border border-teal-500/30 transition-all cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <Disc className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{isAr ? 'المسبحة اللمسية الذكية' : 'Smart Haptic Tasbih'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-teal-400 font-bold">100x</span>
                  </button>
                )}

                {/* 20m Focus Session */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    handleToggle();
                    onSelectStation('WORK_MICRO_SPRINT');
                  }}
                  className="tap-spring w-full flex items-center justify-between p-2.5 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold border border-sky-500/30 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <span>
                      {isAr ? 'بدء جلسة عمل وتركيز 20 دقيقة' : 'Start 20m Focus Session'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 font-bold">20m</span>
                </button>

                {/* 2-Minute Anti-Friction Rule */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    handleToggle();
                    onOpenTwoMinuteRule?.();
                  }}
                  className="tap-spring w-full flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-amber-400" />
                    <span>
                      {isAr ? 'كسر التسويف: قاعدة الدقيقتين' : '2-Minute Anti-Friction'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">120s</span>
                </button>

                {/* AI Behavioral Guide */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    handleToggle();
                    onOpenAiCoach?.();
                  }}
                  className="tap-spring w-full flex items-center justify-between p-2.5 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    <span>
                      {isAr ? 'استشارة المرشد السلوكي الذكي' : 'Behavioral Mindset Guide'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">Coach</span>
                </button>

                {/* Quick Reminder & Alarm */}
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

                {/* AI Course Study Roadmap */}
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

                {/* Bottom Sub-Actions Grid */}
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
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
