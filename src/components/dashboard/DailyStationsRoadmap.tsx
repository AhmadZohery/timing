import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { StationId, LifestylePersonaId, StationCustomOverride } from '../../types';
import { resolveStationMetadata, type LifestylePersonaConfig } from '../../utils/lifestyleEngine';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface DailyStationsRoadmapProps {
  allStationIds: StationId[];
  completedStations: string[];
  currentSuggestedStation: {
    id: StationId;
    title: string;
    description: string;
    cta: string;
    icon: any;
    badge: string;
    badgeColor: string;
  };
  personaId: LifestylePersonaId;
  personaConfig: LifestylePersonaConfig;
  overrides?: Partial<Record<StationId, StationCustomOverride>>;
  isAr: boolean;
  onSelectStation: (stationId: StationId) => void;
  onOpenLifestyleModal?: () => void;
  className?: string;
}

// Compact themes for the 6 daily milestones
const MILESTONE_THEMES: Record<
  StationId,
  {
    gradient: string;
    activeBorder: string;
    activeRing: string;
    activeBadge: string;
    textAccent: string;
    dotColor: string;
    emoji: string;
  }
> = {
  COMMUTE_MORNING: {
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    activeBorder: 'border-amber-400 dark:border-amber-500',
    activeRing: 'ring-amber-400/30',
    activeBadge: 'bg-amber-500 text-slate-950 font-black',
    textAccent: 'text-amber-700 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    emoji: '🌅',
  },
  WORK_MICRO_SPRINT: {
    gradient: 'from-indigo-500/20 via-sky-500/10 to-transparent',
    activeBorder: 'border-indigo-400 dark:border-indigo-500',
    activeRing: 'ring-indigo-400/30',
    activeBadge: 'bg-indigo-600 text-white font-black',
    textAccent: 'text-indigo-700 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
    emoji: '⚡',
  },
  GYM_ANCHOR: {
    gradient: 'from-rose-500/20 via-purple-500/10 to-transparent',
    activeBorder: 'border-rose-400 dark:border-rose-500',
    activeRing: 'ring-rose-400/30',
    activeBadge: 'bg-rose-600 text-white font-black',
    textAccent: 'text-rose-700 dark:text-rose-300',
    dotColor: 'bg-rose-500',
    emoji: '🏋️',
  },
  EVENING_SPRINT: {
    gradient: 'from-violet-500/20 via-fuchsia-500/10 to-transparent',
    activeBorder: 'border-violet-400 dark:border-violet-500',
    activeRing: 'ring-violet-400/30',
    activeBadge: 'bg-violet-600 text-white font-black',
    textAccent: 'text-violet-700 dark:text-violet-300',
    dotColor: 'bg-violet-500',
    emoji: '💻',
  },
  RETROSPECTIVE_CHECKIN: {
    gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent',
    activeBorder: 'border-teal-400 dark:border-teal-500',
    activeRing: 'ring-teal-400/30',
    activeBadge: 'bg-teal-600 text-white font-black',
    textAccent: 'text-teal-700 dark:text-teal-300',
    dotColor: 'bg-teal-500',
    emoji: '📊',
  },
  GRAND_REWARD_STATE: {
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    activeBorder: 'border-emerald-400 dark:border-emerald-500',
    activeRing: 'ring-emerald-400/30',
    activeBadge: 'bg-emerald-600 text-white font-black',
    textAccent: 'text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    emoji: '🏆',
  },
  ONE_SEC_FRICTION: {
    gradient: 'from-yellow-500/20 to-transparent',
    activeBorder: 'border-yellow-400',
    activeRing: 'ring-yellow-400/30',
    activeBadge: 'bg-yellow-600 text-white font-black',
    textAccent: 'text-yellow-700',
    dotColor: 'bg-yellow-500',
    emoji: '⏱️',
  },
  SOCIAL_MEDIA_BREAK: {
    gradient: 'from-purple-500/20 to-transparent',
    activeBorder: 'border-purple-400',
    activeRing: 'ring-purple-400/30',
    activeBadge: 'bg-purple-600 text-white font-black',
    textAccent: 'text-purple-700',
    dotColor: 'bg-purple-500',
    emoji: '🛡️',
  },
  HOME: {
    gradient: 'from-slate-500/15 to-transparent',
    activeBorder: 'border-slate-400',
    activeRing: 'ring-slate-400/30',
    activeBadge: 'bg-slate-700 text-white',
    textAccent: 'text-slate-700',
    dotColor: 'bg-slate-500',
    emoji: '🏠',
  },
};

export const DailyStationsRoadmap: React.FC<DailyStationsRoadmapProps> = ({
  allStationIds,
  completedStations,
  currentSuggestedStation,
  personaId,
  personaConfig,
  overrides,
  isAr,
  onSelectStation,
  onOpenLifestyleModal,
  className = '',
}) => {
  // Currently selected station for interactive spotlighting (defaults to suggested station)
  const [selectedStationId, setSelectedStationId] = useState<StationId>(() => {
    return currentSuggestedStation?.id || allStationIds[0] || 'COMMUTE_MORNING';
  });

  const completedCount = completedStations.length;
  const totalCount = allStationIds.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const selectedIndex = allStationIds.indexOf(selectedStationId);
  const activeIndex = selectedIndex !== -1 ? selectedIndex : 0;
  const activeStationId = allStationIds[activeIndex] || 'COMMUTE_MORNING';

  const selectedMeta = resolveStationMetadata(activeStationId, personaId, overrides, isAr);
  const SelectedIcon = selectedMeta.icon;
  const isSelectedCompleted = completedStations.includes(activeStationId);
  const isSelectedSuggested = currentSuggestedStation?.id === activeStationId;

  const currentTheme = MILESTONE_THEMES[activeStationId] || MILESTONE_THEMES.COMMUTE_MORNING;

  // Quick Gym Rest Timer State for Athletic Anchors
  const [restSeconds, setRestSeconds] = useState<number>(0);
  const [isRestRunning, setIsRestRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRestRunning && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            setIsRestRunning(false);
            soundSynth.playStreakMilestoneChime();
            haptic.vibrateSprintCelebration();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRestRunning, restSeconds]);

  const handleStartRestTimer = (seconds: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setRestSeconds(seconds);
    setIsRestRunning(true);
  };

  const handleToggleRestRunning = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsRestRunning(!isRestRunning);
  };

  const handleResetRestTimer = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setRestSeconds(0);
    setIsRestRunning(false);
  };

  const handleLaunchStation = (stId: StationId) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onSelectStation(stId);
  };

  return (
    <div
      className={`rounded-[30px] surface-card-3d border border-zinc-200/80 dark:border-white/10 p-4 sm:p-5 space-y-4 relative overflow-hidden transition-all ${className}`}
    >
      {/* 1. Header Bar: Title, Persona Badge, and Velocity Progress */}
      <div className="flex items-center justify-between gap-2 flex-wrap relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#1eb814]/15 text-[#1eb814] flex items-center justify-center text-sm font-bold shrink-0">
            🧭
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isAr ? 'خريطة محطات اليوم' : 'Daily Stations Roadmap'}
            </h3>

            {/* Persona Badge */}
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10 inline-flex items-center gap-1">
              <span>{personaConfig.avatarEmoji}</span>
              <span>{isAr ? personaConfig.titleAr : personaConfig.titleEn}</span>
              {onOpenLifestyleModal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundSynth.playTactileClick();
                    onOpenLifestyleModal();
                  }}
                  className="ms-1 text-[#1eb814] hover:underline cursor-pointer font-bold"
                >
                  {isAr ? 'تخصيص' : 'Edit'}
                </button>
              )}
            </span>
          </div>
        </div>

        {/* Compact Progress Gauge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 sm:w-24 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#1eb814] transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* 2. Clean 2-Column / 3-Column Habitline Station Cards (Mobile-Friendly 56px+ Touch Targets) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 relative z-10 select-none">
        {allStationIds.map((stId, idx) => {
          const meta = resolveStationMetadata(stId, personaId, overrides, isAr);
          const Icon = meta.icon;
          const isCompleted = completedStations.includes(stId);
          const isSuggestedNow = currentSuggestedStation?.id === stId;
          const isSelected = activeStationId === stId;

          return (
            <motion.button
              key={stId}
              type="button"
              whileTap={{ scale: 0.96 }}
              onMouseEnter={() => setSelectedStationId(stId)}
              onFocus={() => setSelectedStationId(stId)}
              onClick={() => {
                setSelectedStationId(stId);
                handleLaunchStation(stId);
              }}
              className={`relative min-h-[58px] p-2.5 rounded-[22px] border text-start flex items-center justify-between gap-2 transition-all cursor-pointer ${
                isCompleted
                  ? 'bento-3d-mint border-[#1eb814]/50 text-zinc-900 dark:text-emerald-100'
                  : isSelected
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 border-[#141517] dark:border-white shadow-md'
                  : isSuggestedNow
                  ? 'bento-3d-lavender border-indigo-400/40'
                  : 'surface-card-3d hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200/70 dark:border-white/10'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="roadmap-active-station-ring"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-[22px] ring-2 ring-[#ff5500] pointer-events-none"
                />
              )}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 relative ${
                    isCompleted
                      ? 'bg-habit-green-ink text-white shadow-2xs'
                      : isSelected
                      ? 'bg-white/15 dark:bg-zinc-900/15 text-white dark:text-zinc-900'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  {isSuggestedNow && !isCompleted && (
                    <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-[#ff5500] ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
                  )}
                </div>
                <div className="min-w-0">
                  <span
                    className={`block text-xs font-bold truncate leading-tight ${
                      isSelected && !isCompleted
                        ? 'text-white dark:text-zinc-900'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {isAr ? meta.shortLabelAr : meta.shortLabelEn}
                  </span>
                  <span
                    className={`block text-[10px] font-mono truncate tabular-nums mt-0.5 ${
                      isSelected && !isCompleted
                        ? 'text-zinc-300 dark:text-zinc-600'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {meta.shortTime || `#${idx + 1}`}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 3. Selected Station Launch Capsule with Smooth Crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStationId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`relative z-10 p-3.5 rounded-[24px] bg-gradient-to-r ${currentTheme.gradient} dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-white/10 flex items-center justify-between gap-3`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-2xs ${
                isSelectedCompleted
                  ? 'bg-[#1eb814]'
                  : isSelectedSuggested
                  ? 'bg-[#ff5500]'
                  : 'bg-[#141517] dark:bg-zinc-700'
              }`}
            >
              {isSelectedCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <SelectedIcon className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {isAr ? selectedMeta.titleAr : selectedMeta.titleEn}
                </h4>
                {isSelectedCompleted ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#bce8c2] text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200">
                    {isAr ? 'مكتملة ✔' : 'Done ✔'}
                  </span>
                ) : isSelectedSuggested ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff5500]/15 text-[#ff5500] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500] animate-pulse" />
                    <span>{isAr ? 'مقترحة الآن' : 'Suggested'}</span>
                  </span>
                ) : null}
              </div>

              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-1">
                {isAr ? selectedMeta.descriptionAr : selectedMeta.descriptionEn}
              </p>
            </div>
          </div>

          {/* 1-Tap Entry Launch Button */}
          <button
            type="button"
            onClick={() => handleLaunchStation(activeStationId)}
            className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 ${
              isSelectedCompleted
                ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-[#141517] hover:bg-zinc-800 dark:bg-habit-green-ink dark:hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            <span>
              {isSelectedCompleted
                ? isAr
                  ? 'فتح المحطة'
                  : 'Open'
                : isAr
                ? 'ابدأ المحطة'
                : 'Start'}
            </span>
            {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </motion.div>
      </AnimatePresence>

      {/* 3.1 Dedicated Gym Rest Timer between sets */}
      {activeStationId === 'GYM_ANCHOR' && (
        <div className="relative z-10 p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/25 flex items-center justify-between gap-2 flex-wrap text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">⏱️</span>
            <div>
              <span className="font-bold text-rose-950 dark:text-rose-200 block text-[11px]">
                {isAr ? 'مؤقت الراحة السريع بين الجولات:' : 'Quick Rest Timer:'}
              </span>
              {restSeconds > 0 ? (
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300 text-xs tabular-nums">
                  {Math.floor(restSeconds / 60)}:{(restSeconds % 60).toString().padStart(2, '0')} {isRestRunning ? '⏳' : '⏸️'}
                </span>
              ) : (
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {isAr ? 'اختر المدة للبدء' : 'Select interval'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[60, 90, 120].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleStartRestTimer(sec)}
                className={`min-h-[36px] px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold cursor-pointer transition-colors ${
                  restSeconds === sec && isRestRunning
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-800 text-rose-800 dark:text-rose-300 border border-rose-300/40 dark:border-rose-700/40'
                }`}
              >
                {sec}s
              </button>
            ))}

            {restSeconds > 0 && (
              <div className="flex items-center gap-1 ms-1">
                <button
                  type="button"
                  onClick={handleToggleRestRunning}
                  className="p-1.5 rounded-lg bg-rose-200/70 dark:bg-zinc-800 text-rose-900 dark:text-rose-200 cursor-pointer"
                >
                  {isRestRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleResetRestTimer}
                  className="p-1.5 rounded-lg bg-rose-200/70 dark:bg-zinc-800 text-rose-900 dark:text-rose-200 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
