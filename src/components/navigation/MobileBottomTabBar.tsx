import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Compass,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Headphones,
  BookOpen,
  Lightbulb,
  MapPin,
  Award,
  Activity,
} from 'lucide-react';
import type { DailyLog, StationId, UserState } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { resolveStationMetadata, LIFESTYLE_PERSONAS } from '../../utils/lifestyleEngine';
import { gymFaithAudio } from '../../services/gymFaithAudioService';

interface MobileBottomTabBarProps {
  currentStation: StationId;
  completedStations: string[];
  onSelectStation: (stationId: StationId) => void;
  userState?: UserState;
  todayLog?: DailyLog;
  onOpenLifestyleModal?: () => void;
  onOpenEvaluationModal?: () => void;
  onOpenCompanionHub?: () => void;
  onOpenWirdModal?: () => void;
  onOpenTadabburModal?: () => void;
  onOpenSmartTasbih?: () => void;
  onOpenPrayerLocation?: () => void;
  onOpenFaithAudio?: () => void;
}

export const MobileBottomTabBar: React.FC<MobileBottomTabBarProps> = ({
  currentStation,
  completedStations,
  onSelectStation,
  userState,
  todayLog,
  onOpenLifestyleModal,
  onOpenEvaluationModal,
  onOpenCompanionHub,
  onOpenWirdModal,
  onOpenTadabburModal,
  onOpenSmartTasbih,
  onOpenPrayerLocation,
  onOpenFaithAudio,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [isStationsSheetOpen, setIsStationsSheetOpen] = useState(false);
  const [isSpiritualSheetOpen, setIsSpiritualSheetOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(
    () => gymFaithAudio.getState().isPlaying
  );

  useEffect(() => {
    return gymFaithAudio.subscribe((state) => {
      setIsPlayingAudio(state.isPlaying);
    });
  }, []);

  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const personaConfig = LIFESTYLE_PERSONAS[personaId] || LIFESTYLE_PERSONAS.builder_exec;
  const overrides = userState?.settings?.stationCustomOverrides;

  // Cognitive Energy Level Indicator
  const energyLevel = userState?.energyLevel || 'high';
  const energyBadgeConfig = {
    high: { label: '100%', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
    medium: { label: '60%', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    low: { label: 'MVD', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
  }[energyLevel];

  const handleSelect = (id: StationId) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onSelectStation(id);
    setIsStationsSheetOpen(false);
    setIsSpiritualSheetOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const allStationIds: StationId[] = [
    'COMMUTE_MORNING',
    'WORK_MICRO_SPRINT',
    'GYM_ANCHOR',
    'EVENING_SPRINT',
    'RETROSPECTIVE_CHECKIN',
    'GRAND_REWARD_STATE',
  ];

  const isStationActive = currentStation !== 'HOME';
  const progressPercent = Math.round((completedStations.length / allStationIds.length) * 100);

  return (
    <>
      {/* Supreme Floating Dynamic VisionOS Capsule Dock (< lg screens only) */}
      <nav
        aria-label={isAr ? 'منصة التحكم التنفيذية العائمة' : 'Floating Command Dock'}
        className="lg:hidden fixed bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-8 max-w-md mx-auto z-40 transition-all duration-300"
      >
        <div className="relative rounded-[30px] bg-white/94 dark:bg-[#0c0e17]/94 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.14] p-1.5 shadow-[0_12px_45px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_65px_rgba(0,0,0,0.85)] flex items-center justify-between select-none">
          {/* Luminous Ambient Prismatic Rim Top Light */}
          <div className="absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/40 via-amber-400/30 to-transparent pointer-events-none rounded-full" />

          {/* TAB 1: 🏠 الرئيسية (Home Sanctuary) */}
          <button
            type="button"
            onClick={() => handleSelect('HOME')}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer select-none tap-spring active:scale-88 ${
              currentStation === 'HOME'
                ? 'text-emerald-600 dark:text-emerald-400 font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            {currentStation === 'HOME' && (
              <motion.div
                layoutId="floating-dock-active-glow"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-2xl bg-emerald-500/15 dark:bg-emerald-400/18 border border-emerald-500/25 dark:border-emerald-400/30 shadow-xs"
              />
            )}
            <div className="relative">
              <Home className={`w-5 h-5 transition-transform stroke-[1.9] ${currentStation === 'HOME' ? 'scale-110 text-emerald-600 dark:text-emerald-400' : ''}`} />
              {currentStation === 'HOME' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10 font-bold">
              {isAr ? 'الرئيسية' : 'Home'}
            </span>
          </button>

          {/* TAB 2: 🧭 مسار المحطات (Stations Journey & Velocity) */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsStationsSheetOpen(true);
            }}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer select-none tap-spring active:scale-88 ${
              isStationActive
                ? 'text-sky-600 dark:text-sky-400 font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            {isStationActive && (
              <motion.div
                layoutId="floating-dock-active-glow"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-2xl bg-sky-500/15 dark:bg-sky-400/18 border border-sky-500/25 dark:border-sky-400/30 shadow-xs"
              />
            )}
            <div className="relative">
              <Compass className={`w-5 h-5 transition-transform stroke-[1.9] ${isStationActive ? 'scale-110 text-sky-600 dark:text-sky-400' : ''}`} />
              <span className="absolute -top-1.5 -end-2.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-[8px] font-black text-white font-mono leading-none shadow-xs border border-white/20">
                <bdi dir="ltr">{completedStations.length}/6</bdi>
              </span>
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10 font-bold">
              {isAr ? 'المحطات' : 'Stations'}
            </span>
          </button>

          {/* TAB 3 (CENTER HERO): 🏛️ محراب النواة التفاعلية المرتفعة (The Bespoke Sacred Mihrab Core) */}
          <div className="relative -mt-6 sm:-mt-7 shrink-0 px-1.5">
            <button
              type="button"
              onClick={() => {
                soundSynth.playStreakMilestoneChime();
                haptic.vibrateSprintCelebration();
                setIsSpiritualSheetOpen(true);
              }}
              className="group relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-emerald-700 via-teal-600 to-amber-500 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-700/35 ring-4 ring-white/95 dark:ring-[#0c0e17] tap-spring active:scale-88 transition-transform cursor-pointer overflow-hidden border border-white/25"
              title={isAr ? 'محراب السكينة والقرآن والأذكار' : 'Spiritual Sanctuary'}
            >
              {/* Dynamic Aura / Breathing Shine */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/30 pointer-events-none" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400/35 rounded-full blur-xs pointer-events-none" />

              {/* Handcrafted Architectural Mihrab Arch SVG */}
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-white filter drop-shadow-xs group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Outer Architectural Horseshoe Arch */}
                <path d="M4 21V10C4 6 7.5 3 12 3C16.5 3 20 6 20 10V21" />
                {/* Inner Sacred Niche */}
                <path d="M7 21V11.5C7 9 9.2 7 12 7C14.8 7 17 9 17 11.5V21" />
                {/* Radiant Core Lamp */}
                <circle cx="12" cy="11.5" r="1.5" fill="currentColor" />
                <path d="M12 7V10" />
              </svg>
              <span className="text-[8.5px] font-black tracking-tight text-white mt-0.5">
                {isAr ? 'المحراب' : 'Mihrab'}
              </span>

              {/* Gentle Breathing Ring */}
              <span className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/40 animate-ping opacity-25 pointer-events-none" />
            </button>
          </div>

          {/* TAB 4: 🎙️ أثير الوعي والدروس (Faith Audio Sanctuary) */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              if (onOpenFaithAudio) {
                onOpenFaithAudio();
              } else {
                setIsSpiritualSheetOpen(true);
              }
            }}
            className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer select-none tap-spring active:scale-88 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
          >
            <div className="relative">
              {isPlayingAudio ? (
                /* Real-time Bouncing Equalizer Bars when audio is playing */
                <div className="w-5 h-5 flex items-end justify-center gap-0.5 py-0.5">
                  <span className="w-1 bg-amber-500 rounded-full animate-bounce h-2.5" />
                  <span className="w-1 bg-amber-500 rounded-full animate-pulse h-4" />
                  <span className="w-1 bg-amber-500 rounded-full animate-bounce h-2" />
                </div>
              ) : (
                <Headphones className="w-5 h-5 stroke-[1.9] text-amber-600 dark:text-amber-400" />
              )}
              {isPlayingAudio && (
                <span className="absolute -top-1 -end-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight relative z-10 font-bold ${isPlayingAudio ? 'text-amber-600 dark:text-amber-400' : ''}`}>
              {isPlayingAudio ? (isAr ? 'بث حي' : 'Live') : (isAr ? 'الأثير' : 'Audio')}
            </span>
          </button>

          {/* TAB 5: 🧭 الرادار التنفيذي والطاقة (Executive Radar & Cognitive Energy) */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenCompanionHub?.();
            }}
            className="group relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer select-none tap-spring active:scale-88 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <div className="relative">
              {/* Bespoke Handcrafted Astrolabe & Celestial Compass SVG */}
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 stroke-[1.9] group-hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Outer Celestial Ring */}
                <circle cx="12" cy="12" r="9" />
                {/* Inner Orbit */}
                <circle cx="12" cy="12" r="4.5" strokeDasharray="2 2" />
                {/* Precision Directional Pointer */}
                <polygon
                  points="12,5.5 13.8,10.2 18.5,12 13.8,13.8 12,18.5 10.2,13.8 5.5,12 10.2,10.2"
                  fill="currentColor"
                  fillOpacity="0.18"
                />
                {/* Center Core Jewel */}
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
              {/* Live Energy Pill Badge */}
              <span className={`absolute -top-1.5 -end-2.5 px-1 py-0.2 rounded-md text-[8px] font-mono font-black border leading-none shadow-2xs ${energyBadgeConfig.color}`}>
                {energyBadgeConfig.label}
              </span>
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10 font-bold">
              {isAr ? 'الرادار' : 'Radar'}
            </span>
          </button>
        </div>
      </nav>

      {/* STATIONS BOTTOM SHEET (Unified Experience for Mobile) */}
      <AnimatePresence>
        {isStationsSheetOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsStationsSheetOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 300) {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsStationsSheetOpen(false);
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-[#10121c] rounded-t-[32px] border-t border-slate-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Sheet Drag Handle & Header */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 mb-3" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
                      {personaConfig.avatarEmoji}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                        {isAr ? 'خريطة محطات اليوم' : 'Daily Stations Map'}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-600 dark:text-zinc-300 font-semibold">
                          {isAr ? personaConfig.titleAr : personaConfig.titleEn}
                        </span>
                        {onOpenLifestyleModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsStationsSheetOpen(false);
                              onOpenLifestyleModal();
                            }}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                          >
                            ({isAr ? 'تعديل النمط' : 'Edit'})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsStationsSheetOpen(false)}
                    className="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-zinc-100 cursor-pointer tap-spring"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Overall Daily Journey Progress Indicator */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-zinc-300">
                    {isAr ? 'إنجاز محطات اليوم' : 'Stations Completed'}
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                    <bdi dir="ltr">{completedStations.length} / 6 ({progressPercent}%)</bdi>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* All 6 Stations List */}
              <div className="space-y-2 pt-1 overflow-y-auto max-h-[50vh] pr-0.5">
                {allStationIds.map((stationId, idx) => {
                  const meta = resolveStationMetadata(stationId, personaId, overrides, isAr);
                  const Icon = meta.icon;
                  const isActive = currentStation === stationId;
                  const isCompleted = completedStations.includes(stationId);

                  return (
                    <button
                      key={stationId}
                      type="button"
                      onClick={() => handleSelect(stationId)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-start tap-spring active:scale-98 ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-md ring-1 ring-emerald-500/20'
                          : isCompleted
                          ? 'bg-slate-50/80 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200'
                          : 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700/60 text-slate-900 dark:text-zinc-100 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-bold truncate">
                              {isAr ? meta.titleAr : meta.titleEn}
                            </span>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded-md bg-emerald-600 text-white text-[9px] font-black animate-pulse">
                                {isAr ? 'أنت هنا' : 'Active'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-zinc-300 truncate mt-0.5">
                            {meta.descriptionAr || meta.descriptionEn}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-end ps-2">
                        <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 block">
                          <bdi dir="ltr">{meta.shortTime}</bdi>
                        </span>
                        {isCompleted ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ {isAr ? 'مكتمل' : 'Done'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-0.5">
                            <span>{isAr ? 'دخول' : 'Open'}</span>
                            {isAr ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Daily Evaluation & Pride Ticket Trigger */}
              {onOpenEvaluationModal && (
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsStationsSheetOpen(false);
                    onOpenEvaluationModal();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 border border-amber-500/40 text-slate-900 dark:text-zinc-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer tap-spring active:scale-98 transition-all hover:bg-amber-500/25"
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'تقييم اليوم وتذكرة الفخر المسائية' : 'Daily Review & Pride Ticket'}</span>
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📿 SHEET 2: محراب الروح والسكينة (Spiritual Sanctuary Drawer) */}
      <AnimatePresence>
        {isSpiritualSheetOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSpiritualSheetOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-[#10121c] rounded-t-[32px] border-t border-slate-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Sheet Drag Handle & Header */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 mb-3" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                        {isAr ? 'الورد القرآني والسكينة' : 'Spiritual & Quran'}
                      </h3>
                      <span className="text-[11px] text-slate-600 dark:text-zinc-300">
                        {isAr ? 'القرآن، التدبر، الأذكار، ومواقيت الصلاة' : 'Quran, Tadabbur, Tasbih & Prayers'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSpiritualSheetOpen(false)}
                    className="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-zinc-100 cursor-pointer tap-spring"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Spiritual Options Grid (Bespoke Human-Crafted Dual-Tone Cards) */}
              <div className="grid grid-cols-1 gap-2.5 pt-1 overflow-y-auto max-h-[55vh]">
                {/* 1. Quran Wird */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSpiritualSheetOpen(false);
                    onOpenWirdModal?.();
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/35 border border-emerald-200/90 dark:border-emerald-800/60 text-start tap-spring active:scale-98 transition-all cursor-pointer hover:bg-emerald-100/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                        {isAr ? 'ورد القرآن الكريم والتثبيت' : 'Daily Quran Wird & Revision'}
                      </h4>
                      <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 leading-snug">
                        {isAr ? 'تتبع صفحات الحفظ اليومي وتثبيت الزهراوين' : 'Track daily pages and revision'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                    {(todayLog?.baqarahProgress?.completed || (todayLog?.baqarahProgress?.pagesRead ?? 0) > 0 || todayLog?.customWirdProgress) ? (isAr ? 'مكتمل ✔' : 'Done ✔') : (isAr ? 'فتح' : 'Open')} →
                  </span>
                </button>

                {/* 2. Daily Tadabbur (Ibn Kathir & Asbab Al-Nuzul) */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSpiritualSheetOpen(false);
                    onOpenTadabburModal?.();
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/35 border border-amber-200/90 dark:border-amber-800/60 text-start tap-spring active:scale-98 transition-all cursor-pointer hover:bg-amber-100/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 dark:text-amber-200">
                        {isAr ? 'آية وتدبر اليوم (ابن كثير وأسباب النزول)' : 'Daily Tadabbur & Ibn Kathir'}
                      </h4>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-snug">
                        {isAr ? 'تدبر قرآني موثق مع التفسير وأحاديث نبوية صحيحة' : 'Authentic Tafsir and Hadith reflection'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 shrink-0">
                    {(todayLog?.goldenNugget || todayLog?.quoteOfTheDay) ? (isAr ? 'مكتمل ✔' : 'Done ✔') : (isAr ? 'تدبر' : 'Reflect')} →
                  </span>
                </button>

                {/* 3. Smart Haptic Tasbih */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSpiritualSheetOpen(false);
                    onOpenSmartTasbih?.();
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/35 border border-indigo-200/90 dark:border-indigo-800/60 text-start tap-spring active:scale-98 transition-all cursor-pointer hover:bg-indigo-100/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                        {isAr ? 'المسبحة اللمسية الذكية' : 'Haptic Smart Tasbih'}
                      </h4>
                      <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 leading-snug">
                        {isAr ? 'ختام الصلاة، الحوقلة، الاستغفار، والتهليل بالاهتزاز' : 'Post-prayer Dhikr with realistic tactile haptics'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
                    {(todayLog?.tasbihDailyProgress && Object.keys(todayLog.tasbihDailyProgress).length > 0) || todayLog?.adhkarMorningDone ? (isAr ? 'مكتمل ✔' : 'Done ✔') : (isAr ? 'تسبيح' : 'Tasbih')} →
                  </span>
                </button>

                {/* 4. Faith & Intellectual Audio Sanctuary */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSpiritualSheetOpen(false);
                    onOpenFaithAudio?.();
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/35 border border-amber-300/70 dark:border-amber-700/60 text-start tap-spring active:scale-98 transition-all cursor-pointer hover:bg-amber-100/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        {isAr ? 'أثير الوعي والدروس الفكرية والإيمانية' : 'Faith & Intellectual Audio Sanctuary'}
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold">
                          {isAr ? 'مكتبة وساوندكلاود' : 'SoundCloud & Hub'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-snug">
                        {isAr ? 'د. أحمد عبد المنعم، م. أيمن عبد الرحيم، الشيخ أمجد سمير وغيرهم' : 'Scholars, intellectual series, and SoundCloud player'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 shrink-0">
                    {isAr ? 'استماع' : 'Listen'} →
                  </span>
                </button>

                {/* 5. Prayer Location & Adhan */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSpiritualSheetOpen(false);
                    onOpenPrayerLocation?.();
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/90 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-start tap-spring active:scale-98 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-700 dark:bg-zinc-700 text-white flex items-center justify-center shadow-xs">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100">
                        {isAr ? 'مواقيت الصلاة وموقع الأذان' : 'Prayer Times Location'}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-0.5 leading-snug">
                        {isAr ? 'تحديد المدينة أو الموقع عبر GPS لحساب دقيق' : 'GPS location & calculation method settings'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 shrink-0">
                    {isAr ? 'ضبط' : 'Configure'} →
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
