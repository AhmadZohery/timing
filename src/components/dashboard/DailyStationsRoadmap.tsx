import React, { useState, useEffect } from 'react';
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

  const handleSelectNode = (stId: StationId) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedStationId(stId);
  };

  const handleLaunchStation = (stId: StationId) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onSelectStation(stId);
  };

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-[#11131a] border border-slate-200/90 dark:border-white/[0.08] p-3.5 sm:p-5 shadow-sm space-y-3.5 relative overflow-hidden transition-all ${className}`}
    >
      {/* Subtle Ambient Decorative Light */}
      <div className="absolute top-0 right-1/3 w-72 h-72 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mt-24" />

      {/* 1. Header Bar: Title, Persona Badge, and Velocity Progress */}
      <div className="flex items-center justify-between gap-2 flex-wrap relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center text-sm shadow-xs font-bold shrink-0">
            🧭
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-zinc-100">
              {isAr ? 'خريطة مسار اليوم' : 'Daily Stations Roadmap'}
            </h3>

            {/* Persona Badge */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-white/[0.08] inline-flex items-center gap-1">
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
                  className="ms-1 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-black"
                >
                  {isAr ? 'تعديل' : 'Edit'}
                </button>
              )}
            </span>
          </div>
        </div>

        {/* Compact Progress Gauge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 sm:w-24 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden relative shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-black text-emerald-700 dark:text-emerald-400">
            {completedCount}/{totalCount} {isAr ? 'مكتمل' : 'Done'}
          </span>
        </div>
      </div>

      {/* 2. Horizontal Connected Milestones Track (All 6 on 1 row) */}
      <div className="relative pt-1 pb-1 z-10">
        {/* Background Connecting Metro Guideline */}
        <div className="absolute top-[20px] sm:top-[22px] left-5 right-5 h-[2px] bg-slate-200 dark:bg-white/[0.08] z-0 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-500 transition-all duration-500 rounded-full"
            style={{
              width: `${totalCount > 1 ? (Math.max(0, completedCount - 0.5) / (totalCount - 1)) * 100 : 0}%`,
            }}
          />
        </div>

        {/* 6 Interactive Milestone Beads */}
        <div className="flex items-center justify-between gap-1 relative z-10 select-none">
          {allStationIds.map((stId) => {
            const meta = resolveStationMetadata(stId, personaId, overrides, isAr);
            const Icon = meta.icon;
            const isCompleted = completedStations.includes(stId);
            const isSuggestedNow = currentSuggestedStation?.id === stId;
            const isSelected = activeStationId === stId;

            return (
              <button
                key={stId}
                type="button"
                onClick={() => handleSelectNode(stId)}
                className="flex flex-col items-center gap-1 group cursor-pointer tap-spring focus:outline-hidden flex-1 max-w-[56px] sm:max-w-[72px]"
                title={`${isAr ? meta.titleAr : meta.titleEn} (${meta.shortTime})`}
              >
                {/* Milestone Node Circle */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-200 relative ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                      : isSelected
                      ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30 ring-4 ring-sky-400/40 scale-105'
                      : isSuggestedNow
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-2 border-sky-400 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-white/[0.08]'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}

                  {/* Pulsing beacon if active right now and not completed */}
                  {isSuggestedNow && !isCompleted && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-white dark:ring-zinc-950 animate-ping" />
                  )}
                </div>

                {/* Milestone Label */}
                <div className="text-center w-full min-w-0">
                  <span
                    className={`block text-[10px] sm:text-[11px] font-bold truncate leading-tight transition-colors ${
                      isSelected
                        ? 'text-sky-600 dark:text-sky-400 font-black'
                        : isCompleted
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-200'
                    }`}
                  >
                    {isAr ? meta.shortLabelAr : meta.shortLabelEn}
                  </span>
                  <span className="hidden sm:block text-[9px] font-mono text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                    {meta.shortTime}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Interactive Spotlight Action Capsule (Height ~56px) */}
      <div
        className={`relative z-10 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r ${currentTheme.gradient} dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-xs shadow-slate-900/5 dark:shadow-none transition-all duration-300`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
              isSelectedCompleted
                ? 'bg-emerald-600'
                : isSelectedSuggested
                ? 'bg-sky-600'
                : 'bg-slate-700 dark:bg-zinc-800'
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
              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500">
                #{activeIndex + 1}
              </span>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {isAr ? selectedMeta.titleAr : selectedMeta.titleEn}
              </h4>
              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-400 hidden xs:inline">
                • {selectedMeta.shortTime}
              </span>
              {isSelectedCompleted ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  {isAr ? 'مكتملة ✔' : 'Done ✔'}
                </span>
              ) : isSelectedSuggested ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  <span>{isAr ? 'جارية الآن' : 'Active'}</span>
                </span>
              ) : null}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-md">
              {isAr ? selectedMeta.descriptionAr : selectedMeta.descriptionEn}
            </p>
          </div>
        </div>

        {/* 1-Tap Entry Launch Button */}
        <button
          type="button"
          onClick={() => handleLaunchStation(activeStationId)}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 tap-spring shadow-xs ${
            isSelectedCompleted
              ? 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
          }`}
        >
          <span>
            {isSelectedCompleted
              ? isAr
                ? 'فتح المحطة'
                : 'Open'
              : isAr
              ? 'انطلق الآن'
              : 'Enter'}
          </span>
          {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 3.1 Dedicated Gym Rest Timer between sets */}
      {activeStationId === 'GYM_ANCHOR' && (
        <div className="relative z-10 p-2.5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 flex items-center justify-between gap-2 flex-wrap text-xs animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-base">⏱️</span>
            <div>
              <span className="font-bold text-rose-950 dark:text-rose-200 block text-[11px]">
                {isAr ? 'مؤقت الراحة بين الجولات:' : 'Rest Between Sets:'}
              </span>
              {restSeconds > 0 ? (
                <span className="font-mono font-black text-rose-700 dark:text-rose-300 text-xs">
                  {Math.floor(restSeconds / 60)}:{(restSeconds % 60).toString().padStart(2, '0')} {isRestRunning ? '⏳' : '⏸️'}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {isAr ? 'اختر مدة الراحة للبدء' : 'Select interval'}
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
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-black cursor-pointer transition-colors ${
                  restSeconds === sec && isRestRunning
                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/40'
                    : 'bg-white dark:bg-zinc-800 text-rose-800 dark:text-rose-300 border border-rose-300/40 dark:border-rose-700/40 hover:bg-rose-100 dark:hover:bg-rose-900/40'
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
                  className="p-1 rounded-lg bg-rose-200/70 dark:bg-zinc-800 text-rose-900 dark:text-rose-200 hover:bg-rose-300 cursor-pointer"
                  title={isRestRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'استئناف' : 'Resume')}
                >
                  {isRestRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleResetRestTimer}
                  className="p-1 rounded-lg bg-rose-200/70 dark:bg-zinc-800 text-rose-900 dark:text-rose-200 hover:bg-rose-300 cursor-pointer"
                  title={isAr ? 'إلغاء' : 'Reset'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Non-Punitive Compassionate Banner (Dr. Zakaria Bassou CBT Principle) */}
      <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 pt-1 px-1 border-t border-slate-100 dark:border-white/[0.04]">
        <span>✨ {isAr ? '«سددوا وقاربوا وأبشروا»' : 'Steady, moderate, and joyful steps'}</span>
        <span>{isAr ? 'ما لا يُدرك كُلّه لا يُترك جُلّه' : 'Every sincere moment counts'}</span>
      </div>
    </div>
  );
};
