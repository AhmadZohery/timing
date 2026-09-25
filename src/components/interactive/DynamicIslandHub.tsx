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

  const handleToggle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Full-screen Backdrop when Island is Expanded (Click anywhere outside to close with animation) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="island-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleToggle}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-2xs cursor-pointer"
          />
        )}
      </AnimatePresence>

      <div className="relative z-30 max-w-md w-auto flex justify-center">
        <AnimatePresence>
          {!isExpanded ? (
            // Compact Idle Pill (Dynamic Island in Header Center)
            <motion.div
              layoutId="dynamic-island"
              onClick={handleToggle}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', damping: 32, stiffness: 280, mass: 0.8 }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:py-1.5 rounded-full bg-slate-900/95 dark:bg-black/95 text-white border border-white/15 shadow-sm backdrop-blur-xl cursor-pointer select-none ring-1 ring-emerald-500/25 active:scale-95 transition-transform"
            >
              {/* Live Pulsing Dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>

              {/* Current Station Tag */}
              <span className="text-[11px] font-bold text-emerald-400 truncate max-w-[120px] sm:max-w-[160px]">
                {isAr ? currentMeta.shortLabelAr : currentMeta.shortLabelEn}
              </span>

              <span className="text-white/40 text-xs">|</span>

              {/* Next Prayer Countdown with urgent highlight if <= 15m */}
              <div className="flex items-center gap-1 text-[11px] font-medium shrink-0">
                <span className="text-slate-300">{nextP.arabicName}</span>
                <span className={`font-bold font-mono ${nextP.minutesRemaining <= 15 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                  <bdi dir="ltr">{nextP.minutesRemaining}د</bdi>
                </span>
              </div>

              {/* Streak flame */}
              <div className="hidden xs:flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold shrink-0">
                <span className="text-white/40 text-xs me-0.5">|</span>
                <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span><bdi dir="ltr">{userState?.streakDays || 0}</bdi></span>
              </div>

              {/* Friday Salawat Season Blossom Chip */}
              {fridayStatus.isWindow && (
                <>
                  <span className="text-white/40 text-xs">|</span>
                  <span className="text-xs text-amber-300" title={isAr ? 'موسم الصلاة الإبراهيمية ليلة ويوم الجمعة' : 'Friday Salawat Window'}>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400/40 inline" />
                  </span>
                </>
              )}

              <ChevronDown className="w-3 h-3 text-white/50 -me-0.5 shrink-0" />
            </motion.div>
          ) : (
            // Expanded Interactive Island Drawer
            <motion.div
              layoutId="dynamic-island"
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ type: 'spring', damping: 32, stiffness: 280, mass: 0.8 }}
              className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-sm rounded-3xl bg-slate-900/98 dark:bg-black/98 text-white border border-white/15 p-4 shadow-2xl shadow-black/80 backdrop-blur-2xl space-y-3.5"
            >
            {/* Expanded Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider font-mono">
                  {isAr ? 'الجزيرة الحية • مِضمار Island' : 'LifeOS Dynamic Island'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Vital Status Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-white/50 block">{isAr ? 'الصلاة القادمة' : 'Next Prayer'}</span>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-amber-300">{nextP.arabicName}</span>
                  <span className="font-mono text-white/80">
                    {nextP.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-white/50 block">{isAr ? 'سلسلة التتابع' : 'Streak'}</span>
                <div className="flex items-center justify-between font-bold text-amber-400">
                  <span>{userState?.streakDays || 0} {isAr ? 'أيام' : 'days'}</span>
                  <Flame className="w-3.5 h-3.5 fill-current" />
                </div>
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
