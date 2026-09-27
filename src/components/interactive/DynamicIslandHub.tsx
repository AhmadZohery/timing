import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Clock,
  Timer,
  Compass,
  Zap,
  Trophy,
  ChevronDown,
  ChevronUp,
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
  Sparkles,
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
  todayLog,
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
  const [tickerIndex, setTickerIndex] = useState(0);

  // Audio service real-time subscription
  useEffect(() => {
    return gymFaithAudio.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

  // Prayer Calculation
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

  // Active Special Station metadata (never show "الرئيسية")
  const isSpecialStation = currentStation !== 'HOME';
  const currentMeta = resolveStationMetadata(
    currentStation,
    userState?.settings?.lifestylePersona,
    userState?.settings?.stationCustomOverrides,
    isAr
  );

  // Quran Wird Progress from todayLog
  const wirdPagesRead = todayLog?.baqarahProgress?.pagesRead ?? 0;
  const wirdTargetPages = todayLog?.baqarahProgress?.targetPages ?? 20;
  const isWirdCompleted =
    todayLog?.baqarahProgress?.completed ?? (wirdPagesRead >= wirdTargetPages && wirdTargetPages > 0);
  const focusMinutes = todayLog?.totalFocusMinutes ?? 0;

  // Smart Rotating Ticker Items: Live intelligent carousel
  const tickerItems = useMemo(() => {
    const items: Array<{
      id: string;
      icon: React.ReactNode;
      label: string;
      value: string;
      action?: () => void;
      colorClass: string;
    }> = [];

    // Slide 1: Daily Quran Wird
    items.push({
      id: 'wird',
      icon: <BookOpen className="w-3.5 h-3.5 text-emerald-400" />,
      label: isAr ? 'الورد القرآني' : 'Quran Wird',
      value: isWirdCompleted
        ? isAr
          ? 'تم الإنجاز ✨'
          : 'Completed ✨'
        : `${wirdPagesRead}/${wirdTargetPages} ${isAr ? 'ص' : 'p'}`,
      action: onOpenWirdModal,
      colorClass: 'text-emerald-300 font-bold',
    });

    // Slide 2: Daily Streak & Shields
    items.push({
      id: 'streak',
      icon: <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />,
      label: isAr ? 'الاستمرارية' : 'Streak',
      value: `${userState?.streakDays || 0} ${isAr ? 'أيام' : 'days'}${
        userState?.streakShields ? ` • 🛡️ ${userState.streakShields}` : ''
      }`,
      colorClass: 'text-amber-300 font-bold',
    });

    // Slide 3: Friday Season or Focus Output
    if (fridayStatus.isWindow) {
      items.push({
        id: 'friday',
        icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/40" />,
        label: isAr ? 'موسم الجمعة' : 'Friday Blessing',
        value: isAr ? 'الصلاة الإبراهيمية (+25 XP)' : 'Salawat Ibrahimiyyah',
        action: onOpenSmartTasbih ? () => onOpenSmartTasbih('salawat_ibrahimiyyah') : undefined,
        colorClass: 'text-amber-300 font-bold',
      });
    } else if (focusMinutes > 0) {
      items.push({
        id: 'focus',
        icon: <Zap className="w-3.5 h-3.5 text-sky-400" />,
        label: isAr ? 'إنجاز التركيز' : 'Focus Output',
        value: `${focusMinutes} ${isAr ? 'دقيقة اليوم' : 'min today'}`,
        colorClass: 'text-sky-300 font-bold',
      });
    } else {
      items.push({
        id: 'wisdom',
        icon: <Compass className="w-3.5 h-3.5 text-indigo-400" />,
        label: isAr ? 'بوصلة الإنجاز' : 'Mindset',
        value: isAr ? 'أحب الأعمال أدومها وإن قل' : 'Small steps compound daily',
        colorClass: 'text-indigo-300 font-medium',
      });
    }

    return items;
  }, [
    isAr,
    isWirdCompleted,
    wirdPagesRead,
    wirdTargetPages,
    onOpenWirdModal,
    userState?.streakDays,
    userState?.streakShields,
    fridayStatus.isWindow,
    onOpenSmartTasbih,
    focusMinutes,
  ]);

  // Auto-cycle the ticker every 6 seconds
  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [tickerItems.length]);

  const handleNextTicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setTickerIndex((prev) => (prev + 1) % tickerItems.length);
  };

  // Close expanded tools on Escape key
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

  // Close expanded tools on outside click (No screen-dimming backdrop needed!)
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

  const activeTicker = tickerItems[tickerIndex % tickerItems.length] || tickerItems[0];
  const prayerTimeFormatted = nextP.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div ref={islandContainerRef} className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Integrated Living Cockpit: Expands INLINE without any screen-darkening backdrop */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 32,
          mass: 0.8,
        }}
        className={`w-full rounded-2xl ${
          isExpanded ? 'sm:rounded-3xl' : 'sm:rounded-full'
        } bg-slate-950/92 dark:bg-black/95 text-white border border-white/15 dark:border-white/10 shadow-xl shadow-black/35 backdrop-blur-2xl transition-colors overflow-hidden`}
      >
        {/* Specular glass reflection line across top edge */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* PRIMARY COCKPIT ROW */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-3 sm:px-4 py-2">
          {/* 1. START: Live Radar + Next Prayer Widget */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Pulsing radar status dot */}
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

            {/* Special Station Tag (only if NOT on Home) */}
            {isSpecialStation && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full shrink-0">
                {isAr ? currentMeta.shortLabelAr : currentMeta.shortLabelEn}
              </span>
            )}

            {/* Next Prayer Capsule */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 shrink-0">
              <motion.div
                animate={nextP.minutesRemaining <= 15 ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : {}}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="text-amber-400 shrink-0"
              >
                <PrayerIcon className="w-3.5 h-3.5 text-amber-400" />
              </motion.div>
              <span className="text-xs font-bold text-slate-200">{nextP.arabicName}</span>
              <span className="text-[11px] font-mono text-slate-400 hidden xs:inline">{prayerTimeFormatted}</span>
              <span
                className={`inline-flex items-center px-2 py-0.2 rounded-full font-mono text-[11px] font-black tracking-tight ${
                  nextP.minutesRemaining <= 15
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-xs shadow-rose-500/30 animate-pulse'
                    : 'bg-amber-400/15 text-amber-300 border border-amber-400/25'
                }`}
              >
                <bdi dir="ltr">{formatPrayerCountdown(nextP.minutesRemaining, isAr)}</bdi>
              </span>
            </div>
          </div>

          {/* 2. CENTER: Creative Smart Rotating Ticker */}
          <div
            onClick={activeTicker.action || handleNextTicker}
            className="flex-1 min-w-[170px] flex items-center justify-center cursor-pointer select-none px-2 py-1 rounded-full hover:bg-white/5 transition-colors group"
            title={isAr ? 'اضغط للتبديل السريع بين المؤشرات الذكية' : 'Click to cycle indicators'}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTicker.id}
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -7 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex items-center gap-1.5 truncate"
              >
                <span className="shrink-0">{activeTicker.icon}</span>
                <span className="text-[11px] font-medium text-slate-300 truncate">{activeTicker.label}:</span>
                <span className={`text-[11px] ${activeTicker.colorClass} truncate`}>{activeTicker.value}</span>
                <Sparkles className="w-2.5 h-2.5 text-white/30 group-hover:text-amber-400 transition-colors shrink-0 ms-0.5" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 3. END: Audio Controller + 1-Tap Focus Sprint + Tools Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Audio Controller (Direct Play/Pause without any popup) */}
            {audioState.currentTitleAr && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                {audioState.isPlaying ? (
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
                ) : (
                  <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span className="text-[10px] font-bold max-w-[70px] truncate hidden md:inline-block">
                  {audioState.currentTitleAr}
                </span>
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className="p-1 rounded-full hover:bg-emerald-500/20 text-emerald-300 transition-transform active:scale-90 cursor-pointer"
                  title={audioState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                >
                  {audioState.isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                </button>
              </div>
            )}

            {/* Instant 1-Click 20m Focus Session */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                onSelectStation('WORK_MICRO_SPRINT');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              title={isAr ? 'بدء جلسة تركيز وعمل 20 دقيقة فوراً' : 'Start 20m Sprint'}
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px]">{isAr ? '20د تركيز' : '20m Focus'}</span>
            </button>

            {/* Inline Cockpit Expand Toggle (No screen darkening!) */}
            <button
              type="button"
              onClick={handleToggle}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                isExpanded
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
              }`}
              title={isExpanded ? (isAr ? 'طي الأدوات' : 'Collapse') : isAr ? 'فتح لوحة الأدوات الذكية' : 'Expand Tools'}
            >
              <span className="text-[11px] hidden xs:inline">{isExpanded ? (isAr ? 'إخفاء' : 'Close') : isAr ? 'الأدوات' : 'Tools'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* INLINE EXPANDED SUPER-COCKPIT GRID (Silky-smooth slide down, ZERO screen-dimming!) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeInOut' }}
              className="border-t border-white/10 px-3 sm:px-4 py-3 bg-white/[0.02]"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {/* Tool 1: 2-Minute Anti-Friction Rule */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    onOpenTwoMinuteRule?.();
                  }}
                  className="tap-spring flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-amber-300 text-xs font-bold transition-all text-start cursor-pointer active:scale-98"
                >
                  <Timer className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="truncate">
                    <span className="block truncate">{isAr ? 'قاعدة الدقيقتين' : '2-Min Rule'}</span>
                    <span className="text-[9px] text-white/50 block font-normal">{isAr ? 'كسر التسويف' : 'Anti-Friction'}</span>
                  </div>
                </button>

                {/* Tool 2: Smart Tasbih */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    onOpenSmartTasbih?.(fridayStatus.isWindow ? 'salawat_ibrahimiyyah' : 'tahlil_100');
                  }}
                  className="tap-spring flex items-center gap-2 p-2.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/25 text-teal-300 text-xs font-bold transition-all text-start cursor-pointer active:scale-98"
                >
                  <Disc className="w-4 h-4 text-teal-400 shrink-0" />
                  <div className="truncate">
                    <span className="block truncate">{isAr ? 'المسبحة اللمسية' : 'Smart Tasbih'}</span>
                    <span className="text-[9px] text-white/50 block font-normal">{fridayStatus.isWindow ? 'موسم الجمعة ⭐' : '100x تهليل'}</span>
                  </div>
                </button>

                {/* Tool 3: AI Behavioral Coach */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    onOpenAiCoach?.();
                  }}
                  className="tap-spring flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-300 text-xs font-bold transition-all text-start cursor-pointer active:scale-98"
                >
                  <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="truncate">
                    <span className="block truncate">{isAr ? 'المرشد السلوكي' : 'Mindset Coach'}</span>
                    <span className="text-[9px] text-white/50 block font-normal">{isAr ? 'ذكاء نفسي' : 'AI Advice'}</span>
                  </div>
                </button>

                {/* Tool 4: Quick Reminder & Alarm */}
                {onOpenQuickReminder && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      onOpenQuickReminder();
                    }}
                    className="tap-spring flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/25 text-purple-300 text-xs font-bold transition-all text-start cursor-pointer active:scale-98"
                  >
                    <Bell className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="truncate">
                      <span className="block truncate">{isAr ? 'منبه ومفكرة' : 'Quick Reminder'}</span>
                      <span className="text-[9px] text-white/50 block font-normal">{isAr ? 'تنبيه ذكي' : 'Alarm'}</span>
                    </div>
                  </button>
                )}

                {/* Tool 5: AI Course Study Roadmap */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    localStorage.setItem('midmar_work_view_mode', 'learning_tracker');
                    localStorage.setItem('midmar_learning_subtab', 'courses');
                    window.dispatchEvent(
                      new CustomEvent('midmar_switch_work_mode', {
                        detail: { mode: 'learning_tracker', subTab: 'courses' },
                      })
                    );
                    onSelectStation('WORK_MICRO_SPRINT');
                  }}
                  className="tap-spring flex items-center gap-2 p-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/25 text-sky-300 text-xs font-bold transition-all text-start cursor-pointer active:scale-98"
                >
                  <GraduationCap className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="truncate">
                    <span className="block truncate">{isAr ? 'مسار الكورسات' : 'Study Roadmap'}</span>
                    <span className="text-[9px] text-white/50 block font-normal">{isAr ? 'مخطط AI' : 'AI Courses'}</span>
                  </div>
                </button>

                {/* Tool 6: Quran Wird Modal */}
                {onOpenWirdModal ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      onOpenWirdModal();
                    }}
                    className="tap-spring flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-300 text-xs font-bold transition-all text-start cursor-pointer active:scale-98"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <span className="block truncate">{isAr ? 'الورد القرآني' : 'Quran Wird'}</span>
                      <span className="text-[9px] text-white/50 block font-normal">{wirdPagesRead}/{wirdTargetPages} ص</span>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      onOpenEvaluation?.();
                    }}
                    className="tap-spring flex items-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-bold transition-all text-start cursor-pointer active:scale-98"
                  >
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <span className="block truncate">{isAr ? 'التقييم الدوري' : 'Scorecard'}</span>
                      <span className="text-[9px] text-white/50 block font-normal">{isAr ? 'مؤشرات اليوم' : 'Daily Review'}</span>
                    </div>
                  </button>
                )}

                {/* Tool 7: Lifestyle & Rest */}
                {onOpenLifestyleModal ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      onOpenLifestyleModal();
                    }}
                    className="tap-spring flex items-center gap-2 p-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/25 text-sky-300 text-xs font-bold transition-all text-start cursor-pointer active:scale-98"
                  >
                    <Compass className="w-4 h-4 text-sky-400 shrink-0" />
                    <div className="truncate">
                      <span className="block truncate">{isAr ? 'نمط الحياة' : 'Lifestyle'}</span>
                      <span className="text-[9px] text-white/50 block font-normal">{isAr ? 'تخصيص المحطات' : 'Stations'}</span>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      onOpenSleepRest?.();
                    }}
                    className="tap-spring flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-300 text-xs font-bold transition-all text-start cursor-pointer active:scale-98"
                  >
                    <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="truncate">
                      <span className="block truncate">{isAr ? 'النوم والاستشفاء' : 'Sleep Rest'}</span>
                      <span className="text-[9px] text-white/50 block font-normal">{isAr ? 'طاقة الجسد' : 'Recovery'}</span>
                    </div>
                  </button>
                )}

                {/* Tool 8: Daily Evaluation / Scorecard */}
                {onOpenEvaluation && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      onOpenEvaluation();
                    }}
                    className="tap-spring flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-amber-300 text-xs font-bold transition-all text-start cursor-pointer active:scale-98"
                  >
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <span className="block truncate">{isAr ? 'بطاقة التقييم' : 'Scorecard'}</span>
                      <span className="text-[9px] text-white/50 block font-normal">{userState?.streakDays || 0}d streak</span>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
