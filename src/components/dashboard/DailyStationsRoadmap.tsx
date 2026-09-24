import React from 'react';
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Clock,
  Zap,
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

// Thematic color tokens for each milestone
const STATION_THEMES: Record<
  StationId,
  {
    gradient: string;
    borderActive: string;
    textAccent: string;
    bgAccent: string;
    glowColor: string;
    numberBg: string;
    emoji: string;
  }
> = {
  COMMUTE_MORNING: {
    gradient: 'from-amber-500/15 via-orange-500/10 to-amber-500/5',
    borderActive: 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/30',
    textAccent: 'text-amber-700 dark:text-amber-300',
    bgAccent: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    glowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    numberBg: 'bg-amber-500 text-slate-950 font-black',
    emoji: '🌅',
  },
  WORK_MICRO_SPRINT: {
    gradient: 'from-indigo-500/15 via-sky-500/10 to-indigo-500/5',
    borderActive: 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-400/30',
    textAccent: 'text-indigo-700 dark:text-indigo-300',
    bgAccent: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
    glowColor: 'shadow-[0_0_20px_rgba(99,102,241,0.25)]',
    numberBg: 'bg-indigo-600 text-white font-black',
    emoji: '⚡',
  },
  GYM_ANCHOR: {
    gradient: 'from-rose-500/15 via-purple-500/10 to-rose-500/5',
    borderActive: 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/30',
    textAccent: 'text-rose-700 dark:text-rose-300',
    bgAccent: 'bg-rose-500/20 text-rose-700 dark:text-rose-300',
    glowColor: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
    numberBg: 'bg-rose-600 text-white font-black',
    emoji: '🏋️',
  },
  EVENING_SPRINT: {
    gradient: 'from-violet-500/15 via-fuchsia-500/10 to-violet-500/5',
    borderActive: 'border-violet-400 dark:border-violet-500 ring-2 ring-violet-400/30',
    textAccent: 'text-violet-700 dark:text-violet-300',
    bgAccent: 'bg-violet-500/20 text-violet-700 dark:text-violet-300',
    glowColor: 'shadow-[0_0_20px_rgba(139,92,246,0.25)]',
    numberBg: 'bg-violet-600 text-white font-black',
    emoji: '🚀',
  },
  RETROSPECTIVE_CHECKIN: {
    gradient: 'from-teal-500/15 via-emerald-500/10 to-teal-500/5',
    borderActive: 'border-teal-400 dark:border-teal-500 ring-2 ring-teal-400/30',
    textAccent: 'text-teal-700 dark:text-teal-300',
    bgAccent: 'bg-teal-500/20 text-teal-700 dark:text-teal-300',
    glowColor: 'shadow-[0_0_20px_rgba(20,184,166,0.25)]',
    numberBg: 'bg-teal-600 text-white font-black',
    emoji: '📊',
  },
  GRAND_REWARD_STATE: {
    gradient: 'from-slate-700/15 via-zinc-800/10 to-slate-900/5',
    borderActive: 'border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-400/30',
    textAccent: 'text-emerald-700 dark:text-emerald-300',
    bgAccent: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    numberBg: 'bg-emerald-600 text-white font-black',
    emoji: '🏆',
  },
  ONE_SEC_FRICTION: {
    gradient: 'from-amber-600/15 via-yellow-500/10 to-amber-600/5',
    borderActive: 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30',
    textAccent: 'text-amber-700 dark:text-amber-300',
    bgAccent: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    glowColor: 'shadow-[0_0_20px_rgba(217,119,6,0.25)]',
    numberBg: 'bg-amber-600 text-white font-black',
    emoji: '⏱️',
  },
  SOCIAL_MEDIA_BREAK: {
    gradient: 'from-purple-500/15 via-pink-500/10 to-purple-500/5',
    borderActive: 'border-purple-400 dark:border-purple-500 ring-2 ring-purple-400/30',
    textAccent: 'text-purple-700 dark:text-purple-300',
    bgAccent: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
    glowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]',
    numberBg: 'bg-purple-600 text-white font-black',
    emoji: '🛡️',
  },
  HOME: {
    gradient: 'from-slate-500/10 to-slate-500/5',
    borderActive: 'border-slate-400',
    textAccent: 'text-slate-700',
    bgAccent: 'bg-slate-500/20',
    glowColor: '',
    numberBg: 'bg-slate-700 text-white',
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
  const completedCount = completedStations.length;
  const totalCount = allStationIds.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const handleCardClick = (stId: StationId) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onSelectStation(stId);
  };

  return (
    <div
      className={`rounded-3xl bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-[#11131c] dark:via-[#0e1017] dark:to-[#11131c] border border-slate-200/90 dark:border-white/[0.08] p-5 sm:p-7 shadow-sm space-y-6 relative overflow-hidden ${className}`}
    >
      {/* Background Decorative Ambient Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mt-32" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mb-32" />

      {/* Top Header: Title, Persona Pill, and Progress Metrics */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-600/20 shrink-0">
            🧭
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100 font-serif">
                {isAr ? 'خريطة محطات اليوم المبارك' : 'Daily Stations Roadmap'}
              </h3>
              <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5 shadow-2xs">
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
                    {isAr ? 'تغيير' : 'Change'}
                  </button>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {isAr
                ? 'رحلتك الحيوية المتدرجة من بركة الصباح حتى إغلاق اليوم وسكينة النوم'
                : 'Your daily chronological flow from morning barakah to night wind-down.'}
            </p>
          </div>
        </div>

        {/* Journey Progress Gauge */}
        <div className="flex items-center gap-3 bg-slate-100/80 dark:bg-zinc-900/80 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 self-start md:self-auto shrink-0 shadow-xs">
          <div className="space-y-1 text-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                {isAr ? 'معدل إنجاز المحطات:' : 'Journey Velocity:'}
              </span>
              <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                {completedCount}/{totalCount}
              </span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-36 sm:w-44 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden relative shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-500 transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-black text-xs">
            {progressPct}%
          </div>
        </div>
      </div>

      {/* Hero Spotlight: Current Active / Suggested Station */}
      {currentSuggestedStation && (
        <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent dark:from-sky-950/30 dark:via-indigo-950/20 dark:to-transparent border-2 border-sky-400/50 dark:border-sky-500/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-xl shadow-md shadow-sky-500/20 shrink-0 animate-pulse">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500 text-white shadow-2xs">
                  {isAr ? '📍 المحطة المقترحة الآن' : '📍 Current Station'}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {currentSuggestedStation.badge}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1">
                {currentSuggestedStation.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                {currentSuggestedStation.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCardClick(currentSuggestedStation.id)}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <span>{currentSuggestedStation.cta}</span>
            {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* The Connecting Milestones Journey Rail */}
      <div className="relative z-10">
        {/* Visual Connecting Luminous Guideline (Desktop) */}
        <div className="hidden lg:block absolute top-[52px] left-8 right-8 h-1 bg-gradient-to-r from-slate-200 via-emerald-200 to-slate-200 dark:from-zinc-800 dark:via-emerald-900/60 dark:to-zinc-800 -z-0 rounded-full" />

        {/* Station Cards Grid / Carousel Rail */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4 relative z-10">
          {allStationIds.map((stId, idx) => {
            const meta = resolveStationMetadata(stId, personaId, overrides, isAr);
            const Icon = meta.icon;
            const isCompleted = completedStations.includes(stId);
            const isCurrentSuggested = currentSuggestedStation.id === stId;
            const theme = STATION_THEMES[stId] || STATION_THEMES.COMMUTE_MORNING;

            return (
              <div
                key={stId}
                onClick={() => handleCardClick(stId)}
                className={`group rounded-2xl border p-4 sm:p-4 text-start flex flex-col justify-between transition-all duration-200 cursor-pointer select-none active:scale-[0.98] relative overflow-hidden ${
                  isCompleted
                    ? 'bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-white dark:from-emerald-950/30 dark:via-zinc-900 dark:to-zinc-900 border-emerald-400/80 dark:border-emerald-700/60 shadow-sm'
                    : isCurrentSuggested
                    ? `bg-gradient-to-b ${theme.gradient} dark:from-sky-950/40 dark:via-zinc-900 dark:to-zinc-900 ${theme.borderActive} ${theme.glowColor}`
                    : 'bg-white/90 dark:bg-zinc-900/70 border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md hover:-translate-y-1'
                }`}
              >
                {/* Milestone Card Top Row */}
                <div className="flex items-center justify-between mb-3">
                  {/* Step Number Glyph */}
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-mono font-black ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrentSuggested
                        ? theme.numberBg
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  {/* Icon Glyphs */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-transform group-hover:scale-110 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrentSuggested
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                </div>

                {/* Title & Short Details */}
                <div className="space-y-1 my-1">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {isAr ? meta.titleAr : meta.titleEn}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{meta.shortTime}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed pt-0.5">
                    {isAr ? meta.descriptionAr : meta.descriptionEn}
                  </p>
                </div>

                {/* Status Indicator Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                  {isCompleted ? (
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span>✓</span>
                      <span>{isAr ? 'مكتملة' : 'Completed'}</span>
                    </span>
                  ) : isCurrentSuggested ? (
                    <span className="text-[11px] font-black text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                      <span>{isAr ? 'جارية الآن' : 'Active'}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                      <span>{isAr ? 'دخول' : 'Open'}</span>
                      <span>{isAr ? '←' : '→'}</span>
                    </span>
                  )}

                  <span className="text-[11px] opacity-75">{theme.emoji}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
