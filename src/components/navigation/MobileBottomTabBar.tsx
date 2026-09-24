import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Compass,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Radio,
} from 'lucide-react';
import type { StationId, UserState } from '../../types';
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

  return (
    <>
      {/* Supreme Floating Dynamic Island Dock (< lg screens only) */}
      <nav
        aria-label={isAr ? 'منصة التحكم التنفيذية العائمة' : 'Floating Command Dock'}
        className="lg:hidden fixed bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-8 max-w-md mx-auto z-40 transition-all duration-300"
      >
        <div className="relative rounded-[26px] bg-white/90 dark:bg-[#0c0d16]/90 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.12] p-1.5 shadow-[0_12px_45px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_55px_rgba(0,0,0,0.7)] flex items-center justify-between select-none">
          {/* Subtle Ambient Rim Glow */}
          <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent pointer-events-none" />

          {/* TAB 1: 🏠 الرئيسية (Home Sanctuary) */}
          <button
            type="button"
            onClick={() => handleSelect('HOME')}
            className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-90 ${
              currentStation === 'HOME'
                ? 'text-emerald-600 dark:text-emerald-400 font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            {currentStation === 'HOME' && (
              <motion.div
                layoutId="floating-dock-active-glow"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-0 rounded-2xl bg-emerald-500/12 dark:bg-emerald-400/15 border border-emerald-500/20"
              />
            )}
            <div className="relative">
              <Home className={`w-5 h-5 transition-transform stroke-[1.8] ${currentStation === 'HOME' ? 'scale-110 text-emerald-600 dark:text-emerald-400' : ''}`} />
              {currentStation === 'HOME' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 shadow-xs" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10">
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
            className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-90 ${
              isStationActive
                ? 'text-sky-600 dark:text-sky-400 font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            {isStationActive && (
              <motion.div
                layoutId="floating-dock-active-glow"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-0 rounded-2xl bg-sky-500/12 dark:bg-sky-400/15 border border-sky-500/20"
              />
            )}
            <div className="relative">
              <Compass className={`w-5 h-5 transition-transform stroke-[1.8] ${isStationActive ? 'scale-110 text-sky-600 dark:text-sky-400' : ''}`} />
              <span className="absolute -top-1 -end-2.5 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-[8px] font-black text-white font-mono leading-none shadow-xs">
                <bdi dir="ltr">{completedStations.length}/6</bdi>
              </span>
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10">
              {isAr ? 'المحطات' : 'Stations'}
            </span>
          </button>

          {/* TAB 3 (CENTER HERO): 🏛️ محراب النواة التفاعلية المرتفعة (The Bespoke Sacred Mihrab Core) */}
          <div className="relative -mt-6 sm:-mt-7 shrink-0 px-1">
            <button
              type="button"
              onClick={() => {
                soundSynth.playStreakMilestoneChime();
                haptic.vibrateSprintCelebration();
                setIsSpiritualSheetOpen(true);
              }}
              className="group relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-500 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-600/35 ring-4 ring-white/95 dark:ring-[#0c0d16] active:scale-90 transition-transform cursor-pointer overflow-hidden"
              title={isAr ? 'محراب السكينة والقرآن والأذكار' : 'Spiritual Sanctuary'}
            >
              {/* Dynamic Aura / Breathing Shine */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/25 pointer-events-none" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400/35 rounded-full blur-xs pointer-events-none" />

              {/* Handcrafted Architectural Mihrab Arch SVG */}
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-white filter drop-shadow-xs group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.85"
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
                {isAr ? 'المحراب' : 'Core'}
              </span>

              {/* Pulsing beacon ring */}
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
            className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-90 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
          >
            <div className="relative">
              {isPlayingAudio ? (
                /* Real-time Bouncing Equalizer Bars when audio is playing! */
                <div className="w-5 h-5 flex items-end justify-center gap-0.5 py-0.5">
                  <span className="w-1 bg-amber-500 rounded-full animate-bounce h-2.5" />
                  <span className="w-1 bg-amber-500 rounded-full animate-pulse h-4" />
                  <span className="w-1 bg-amber-500 rounded-full animate-bounce h-2" />
                </div>
              ) : (
                <Radio className="w-5 h-5 stroke-[1.8] text-amber-600 dark:text-amber-400" />
              )}
              {isPlayingAudio && (
                <span className="absolute -top-1 -end-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight relative z-10 ${isPlayingAudio ? 'text-amber-600 dark:text-amber-400 font-black' : ''}`}>
              {isPlayingAudio ? (isAr ? 'بث حي' : 'Live') : (isAr ? 'الأثير' : 'Audio')}
            </span>
          </button>

          {/* TAB 5: 🧭 الرفيق والمسار اليومي (Executive Focus Companion & Navigator) */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenCompanionHub?.();
            }}
            className="group relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-90 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <div className="relative">
              {/* Bespoke Handcrafted Astrolabe & Celestial Compass SVG (Zero Generic AI Vibes) */}
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 stroke-[1.8] group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
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
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10 font-bold">
              {isAr ? 'الرفيق' : 'Companion'}
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
              className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-[32px] border-t border-slate-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Sheet Header */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 mb-3" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{personaConfig.avatarEmoji}</span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                        {isAr ? 'خريطة محطات اليوم' : 'Daily Stations Map'}
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {isAr ? personaConfig.titleAr : personaConfig.titleEn}
                        {onOpenLifestyleModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsStationsSheetOpen(false);
                              onOpenLifestyleModal();
                            }}
                            className="ms-2 text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                          >
                            ({isAr ? 'تعديل النمط' : 'Edit'})
                          </button>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsStationsSheetOpen(false)}
                    className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* All 6 Stations List */}
              <div className="space-y-2 pt-1 overflow-y-auto max-h-[55vh] pr-0.5">
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
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-start active:scale-98 ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-300 shadow-md ring-1 ring-emerald-500/20'
                          : isCompleted
                          ? 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                          : 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700/60 text-slate-800 dark:text-zinc-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-400">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-bold truncate">
                              {isAr ? meta.titleAr : meta.titleEn}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                            {meta.descriptionAr || meta.descriptionEn}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-end ps-2">
                        <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500 block">
                          {meta.shortTime}
                        </span>
                        {isCompleted ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ {isAr ? 'مكتمل' : 'Done'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-0.5">
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
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30 text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all hover:bg-amber-500/20"
                >
                  <span className="text-base">📊</span>
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
              onTouchStart={() => setIsSpiritualSheetOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-[32px] border-t border-slate-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Sheet Header */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 mb-3" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📿</span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                        {isAr ? 'الورد القرآني والسكينة' : 'Spiritual & Quran'}
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {isAr ? 'القرآن، التدبر، الأذكار، ومواقيت الصلاة' : 'Quran, Tadabbur, Tasbih & Prayers'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSpiritualSheetOpen(false)}
                    className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Spiritual Options Grid */}
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
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-start active:scale-98 transition-all cursor-pointer hover:bg-emerald-100/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-sm">
                      📖
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                        {isAr ? 'ورد القرآن الكريم والتثبيت' : 'Daily Quran Wird & Revision'}
                      </h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {isAr ? 'تتبع آيات الحفظ والمراجعة مع الزهراوين' : 'Track your daily pages and surah memorization'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {isAr ? 'فتح' : 'Open'} →
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
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-start active:scale-98 transition-all cursor-pointer hover:bg-amber-100/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-sm">
                      💡
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 dark:text-amber-200">
                        {isAr ? 'آية وتدبر اليوم (ابن كثير وأسباب النزول)' : 'Daily Tadabbur & Ibn Kathir'}
                      </h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                        {isAr ? 'تدبر قرآني موثق مع التفسير وأحاديث نبوية صحيحة' : 'Authentic Tafsir and Hadith reflection'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    {isAr ? 'تدبر' : 'Reflect'} →
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
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 text-start active:scale-98 transition-all cursor-pointer hover:bg-indigo-100/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-sm">
                      📿
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                        {isAr ? 'المسبحة اللمسية الذكية' : 'Haptic Smart Tasbih'}
                      </h4>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5">
                        {isAr ? 'ختام الصلاة، الحوقلة، الاستغفار، والتهليل بالاهتزاز' : 'Post-prayer Dhikr with realistic tactile haptics'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {isAr ? 'تسبيح' : 'Tasbih'} →
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
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-700/50 text-start active:scale-98 transition-all cursor-pointer hover:bg-amber-100/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-linear-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-lg shadow-sm">
                      🎙️
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        {isAr ? 'أثير الوعي والدروس الفكرية والإيمانية' : 'Faith & Intellectual Audio Sanctuary'}
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                          {isAr ? 'مكتبة وساوندكلاود' : 'SoundCloud & Hub'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                        {isAr ? 'د. أحمد عبد المنعم، م. أيمن عبد الرحيم، الشيخ أمجد سمير وغيرهم' : 'Scholars, intellectual series, and SoundCloud player'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
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
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-start active:scale-98 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-700 dark:bg-zinc-700 text-white flex items-center justify-center text-lg shadow-sm">
                      📍
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100">
                        {isAr ? 'مواقيت الصلاة وموقع الأذان' : 'Prayer Times Location'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {isAr ? 'تحديد المدينة أو الموقع عبر GPS لحساب دقيق' : 'GPS location & calculation method settings'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
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
