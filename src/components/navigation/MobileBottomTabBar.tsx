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
  Shield,
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
  onOpenAdhkarModal?: () => void;
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
  onOpenAdhkarModal,
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
    'ONE_SEC_FRICTION',
    'SOCIAL_MEDIA_BREAK',
    'GYM_ANCHOR',
    'EVENING_SPRINT',
    'RETROSPECTIVE_CHECKIN',
    'GRAND_REWARD_STATE',
  ];

  const isStationActive = currentStation !== 'HOME';
  const progressPercent = Math.round((completedStations.length / allStationIds.length) * 100);
  const sheetRingRadius = 19;
  const sheetRingCircumference = 2 * Math.PI * sheetRingRadius;
  const sheetRingOffset =
    sheetRingCircumference - (progressPercent / 100) * sheetRingCircumference;

  return (
    <>
      {/* ================================================================= */}
      {/* HABITLINE OBSIDIAN FLOATING PILL DOCK (< lg screens only)         */}
      {/* Mirrors the top #141517 stage with pure white active capsules     */}
      {/* ================================================================= */}
      <nav
        aria-label={isAr ? 'منصة التحكم التنفيذية العائمة' : 'Floating Command Dock'}
        className="lg:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-3 sm:inset-x-8 max-w-md mx-auto z-40 transition-all duration-300"
      >
        <div className="relative rounded-[28px] bg-[#141517]/95 backdrop-blur-2xl border border-white/12 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.38)] flex items-center justify-between gap-1 select-none">
          {/* TAB 1: 🏠 الرئيسية (Home Sanctuary) */}
          <button
            type="button"
            onClick={() => handleSelect('HOME')}
            className={`relative flex-1 min-w-[44px] min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-[22px] transition-all cursor-pointer select-none tap-spring active:scale-95 ${
              currentStation === 'HOME'
                ? 'text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {currentStation === 'HOME' && (
              <motion.div
                layoutId="habitline-dock-active"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-[22px] bg-white shadow-md"
              />
            )}
            <div className="relative z-10">
              <Home
                className={`w-5 h-5 transition-transform stroke-[2] ${
                  currentStation === 'HOME' ? 'text-zinc-950' : ''
                }`}
              />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10 font-bold truncate max-w-full">
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
            className={`relative flex-1 min-w-[44px] min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-[22px] transition-all cursor-pointer select-none tap-spring active:scale-95 ${
              isStationActive
                ? 'text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isStationActive && (
              <motion.div
                layoutId="habitline-dock-active"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-[22px] bg-white shadow-md"
              />
            )}
            <div className="relative z-10">
              <Compass
                className={`w-5 h-5 transition-transform stroke-[2] ${
                  isStationActive ? 'text-zinc-950' : ''
                }`}
              />
              <span
                className={`absolute -top-1.5 -end-3 px-1 py-0.2 rounded-full text-[8.5px] font-mono font-bold leading-none ${
                  completedStations.length > 0
                    ? 'bg-habit-green-ink text-white'
                    : isStationActive
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white/15 text-zinc-300'
                }`}
              >
                {completedStations.length}/{allStationIds.length}
              </span>
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10 font-bold truncate max-w-full">
              {isAr ? 'المحطات' : 'Stations'}
            </span>
          </button>

          {/* TAB 3 (CENTER HERO): 🏛️ محراب السكينة (Habitline Vibrant Green Core) */}
          <div className="relative -mt-4 shrink-0 px-1">
            <button
              type="button"
              onClick={() => {
                soundSynth.playStreakMilestoneChime();
                haptic.vibrateSprintCelebration();
                setIsSpiritualSheetOpen(true);
              }}
              className="group relative w-12 h-12 rounded-[20px] bg-habit-green-ink hover:bg-habit-green-ink-deep text-white flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(30,184,20,0.45)] ring-4 ring-[#141517] tap-spring active:scale-90 transition-transform cursor-pointer overflow-hidden"
              title={isAr ? 'محراب السكينة والقرآن والأذكار' : 'Spiritual Sanctuary'}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-white group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 21V10C4 6 7.5 3 12 3C16.5 3 20 6 20 10V21" />
                <path d="M7 21V11.5C7 9 9.2 7 12 7C14.8 7 17 9 17 11.5V21" />
                <circle cx="12" cy="11.5" r="1.5" fill="currentColor" />
                <path d="M12 7V10" />
              </svg>
              <span className="text-[8.5px] font-bold tracking-tight text-white mt-0.5">
                {isAr ? 'المحراب' : 'Mihrab'}
              </span>
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
            className={`relative flex-1 min-w-[44px] min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-[22px] transition-all cursor-pointer select-none tap-spring active:scale-95 ${
              isPlayingAudio
                ? 'bg-[#ff5500]/20 text-[#ff5500]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <div className="relative">
              {isPlayingAudio ? (
                <div className="w-5 h-5 flex items-end justify-center gap-0.5 py-0.5">
                  <span className="w-1 bg-[#ff5500] rounded-full animate-bounce h-2.5" />
                  <span className="w-1 bg-[#ff5500] rounded-full animate-pulse h-4" />
                  <span className="w-1 bg-[#ff5500] rounded-full animate-bounce h-2" />
                </div>
              ) : (
                <Headphones className="w-5 h-5 stroke-[2]" />
              )}
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight relative z-10 font-bold truncate max-w-full ${
                isPlayingAudio ? 'text-[#ff5500]' : ''
              }`}
            >
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
            className="group relative flex-1 min-w-[44px] min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-[22px] transition-all cursor-pointer select-none tap-spring active:scale-95 text-zinc-400 hover:text-white"
          >
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 stroke-[2] group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4.5" strokeDasharray="2 2" />
                <polygon
                  points="12,5.5 13.8,10.2 18.5,12 13.8,13.8 12,18.5 10.2,13.8 5.5,12 10.2,10.2"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
              <span className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-[#7c3aed]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10 font-bold truncate max-w-full">
              {isAr ? 'الرادار' : 'Radar'}
            </span>
          </button>
        </div>
      </nav>

      {/* ================================================================= */}
      {/* SHEET 1: HABITLINE STATIONS BOTTOM SHEET (خريطة محطات اليوم)       */}
      {/* ================================================================= */}
      <AnimatePresence>
        {isStationsSheetOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsStationsSheetOpen(false)}
              className="fixed inset-0 bg-black/65 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={isAr ? 'خريطة محطات اليوم' : 'Daily Stations Map'}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
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
              className="relative z-10 w-full max-h-[86vh] bg-[#f5f6f8] dark:bg-[#141517] rounded-t-[36px] border-t border-zinc-200 dark:border-white/10 shadow-2xl p-5 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Drag Handle & Header */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mb-3" />
                <div className="w-full flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      {isAr ? 'خريطة محطات اليوم' : 'Daily Stations Map'}
                    </h3>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {isAr ? 'انتقل بين محطات يومك بلمسة واحدة' : 'Switch between your daily stations'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsStationsSheetOpen(false)}
                    aria-label={isAr ? 'إغلاق' : 'Close'}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 cursor-pointer tap-spring"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Habitline Obsidian Progress & Persona Card */}
              <div className="rounded-[26px] bg-[#141517] dark:bg-zinc-900 text-white p-4 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-xl shrink-0">
                    {personaConfig.avatarEmoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {isAr ? personaConfig.titleAr : personaConfig.titleEn}
                      </span>
                      {onOpenLifestyleModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsStationsSheetOpen(false);
                            onOpenLifestyleModal();
                          }}
                          className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-emerald-300 cursor-pointer shrink-0"
                        >
                          {isAr ? 'تخصيص' : 'Edit'}
                        </button>
                      )}
                    </div>
                    <span className="block text-xs text-zinc-400 mt-0.5">
                      {isAr
                        ? `تم إنجاز ${completedStations.length} من ${allStationIds.length} محطات اليوم`
                        : `${completedStations.length} of ${allStationIds.length} stations completed`}
                    </span>
                  </div>
                </div>

                {/* SVG Circular Ring */}
                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle
                      cx="24"
                      cy="24"
                      r={sheetRingRadius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4.5"
                      className="text-white/15"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r={sheetRingRadius}
                      fill="none"
                      stroke="#1eb814"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeDasharray={sheetRingCircumference}
                      strokeDashoffset={sheetRingOffset}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-white tabular-nums">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              {/* All Stations List (Habitline Soft Mint #bce8c2 for done, Pure White pending) */}
              <div className="space-y-2.5 pt-0.5 overflow-y-auto max-h-[48vh] pe-0.5">
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
                      className={`w-full flex items-center justify-between p-4 rounded-[22px] border transition-all cursor-pointer text-start tap-spring active:scale-[0.98] ${
                        isActive
                          ? 'bg-[#141517] dark:bg-white border-[#141517] dark:border-white text-white dark:text-zinc-950 shadow-md'
                          : isCompleted
                          ? 'bg-[#bce8c2] dark:bg-emerald-950/70 border-[#22c55e]/50 text-zinc-900 dark:text-white'
                          : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/10 text-zinc-900 dark:text-white shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isCompleted
                              ? 'bg-habit-green-ink text-white'
                              : isActive
                              ? 'bg-habit-flame-ink text-white'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono text-[10px] ${
                                isActive
                                  ? 'text-zinc-400 dark:text-zinc-500'
                                  : 'text-zinc-400 dark:text-zinc-500'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <span className="text-sm font-bold truncate">
                              {isAr ? meta.titleAr : meta.titleEn}
                            </span>
                          </div>
                          <p
                            className={`text-xs truncate mt-0.5 ${
                              isActive
                                ? 'text-zinc-300 dark:text-zinc-600'
                                : isCompleted
                                ? 'text-zinc-700 dark:text-emerald-200/80'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            {meta.descriptionAr || meta.descriptionEn}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-end ps-2">
                        {isCompleted ? (
                          <span className="text-xs font-bold text-zinc-800 dark:text-emerald-200">
                            {isAr ? 'اليوم ✓' : 'Done ✓'}
                          </span>
                        ) : isActive ? (
                          <span className="px-2.5 py-1 rounded-full bg-white/15 dark:bg-zinc-900/15 text-[11px] font-bold">
                            {isAr ? 'الآن' : 'Now'}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-zinc-400 flex items-center gap-0.5">
                            <bdi dir="ltr">{meta.shortTime}</bdi>
                            {isAr ? (
                              <ChevronLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
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
                  className="w-full py-3.5 px-4 rounded-[22px] bg-gradient-to-r from-[#7c3aed] to-[#10b981] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer tap-spring active:scale-98 shadow-md"
                >
                  <Award className="w-4 h-4" />
                  <span>{isAr ? 'تقييم اليوم وتذكرة الفخر المسائية' : 'Daily Review & Pride Ticket'}</span>
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* SHEET 2: HABITLINE SPIRITUAL SANCTUARY DRAWER (محراب السكينة)     */}
      {/* Styled with Habitline Pastel Bento Stack Cards                    */}
      {/* ================================================================= */}
      <AnimatePresence>
        {isSpiritualSheetOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSpiritualSheetOpen(false)}
              className="fixed inset-0 bg-black/65 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={isAr ? 'محراب القرآن والسكينة' : 'Spiritual & Quran'}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 300) {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsSpiritualSheetOpen(false);
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="relative z-10 w-full max-h-[86vh] bg-[#f5f6f8] dark:bg-[#141517] rounded-t-[36px] border-t border-zinc-200 dark:border-white/10 shadow-2xl p-5 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Sheet Drag Handle & Header */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mb-3" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-habit-green-ink text-white flex items-center justify-center shadow-sm">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                        {isAr ? 'محراب القرآن والسكينة' : 'Sacred Sanctuary'}
                      </h3>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {isAr ? 'القرآن، التدبر، الأذكار، والأثير الإيماني' : 'Quran, Tadabbur, Tasbih & Audio'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSpiritualSheetOpen(false)}
                    aria-label={isAr ? 'إغلاق' : 'Close'}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 cursor-pointer tap-spring"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Habitline Pastel Stack Cards Grid */}
              <div className="grid grid-cols-1 gap-2.5 pt-0.5 overflow-y-auto max-h-[58vh] pe-0.5">
                {/* 1. Quran Wird (Soft Mint #d4f5dc) */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSpiritualSheetOpen(false);
                    onOpenWirdModal?.();
                  }}
                  className="flex items-center justify-between p-4 rounded-[24px] bg-[#d4f5dc] dark:bg-emerald-950/60 border border-[#22c55e]/40 text-start tap-spring active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-habit-green-ink text-white flex items-center justify-center shrink-0 shadow-xs">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {isAr ? 'ورد القرآن الكريم والتثبيت' : 'Daily Quran Wird & Revision'}
                      </h4>
                      <p className="text-xs text-zinc-700 dark:text-emerald-200/80 mt-0.5 truncate">
                        {isAr ? 'تتبع السورة والصفحات اليومية' : 'Track daily Surah and pages'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-habit-green-ink text-white text-[11px] font-bold shrink-0">
                    {todayLog?.quranWirdDone ? (isAr ? 'اليوم ✓' : 'Done ✓') : (isAr ? 'فتح ←' : 'Open →')}
                  </span>
                </button>

                {/* 2. Morning & Evening Adhkar (Soft Lavender #e2defc) */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSpiritualSheetOpen(false);
                    onOpenAdhkarModal?.();
                  }}
                  className="flex items-center justify-between p-4 rounded-[24px] bg-[#e2defc] dark:bg-indigo-950/60 border border-indigo-400/40 text-start tap-spring active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#5448e8] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {isAr ? 'أذكار الصباح والمساء وحصن المسلم' : 'Morning & Evening Adhkar'}
                      </h4>
                      <p className="text-xs text-zinc-700 dark:text-indigo-200/80 mt-0.5 truncate">
                        {isAr ? 'الأذكار الموثقة مع عداد التكرار الذكي' : 'Verified Adhkar with smart counter'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#5448e8] text-white text-[11px] font-bold shrink-0">
                    {todayLog?.adhkarMorningDone || todayLog?.adhkarEveningDone
                      ? isAr
                        ? 'اليوم ✓'
                        : 'Done ✓'
                      : isAr
                      ? 'قراءة ←'
                      : 'Read →'}
                  </span>
                </button>

                {/* 3. Daily Tadabbur (Soft Lilac #f0dcf7) */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSpiritualSheetOpen(false);
                    onOpenTadabburModal?.();
                  }}
                  className="flex items-center justify-between p-4 rounded-[24px] bg-[#f0dcf7] dark:bg-purple-950/60 border border-purple-400/40 text-start tap-spring active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#a824e0] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {isAr ? 'آية وتدبر اليوم (تفسير ابن كثير)' : 'Daily Tadabbur & Ibn Kathir'}
                      </h4>
                      <p className="text-xs text-zinc-700 dark:text-purple-200/80 mt-0.5 truncate">
                        {isAr ? 'تدبر قرآني موثق وأحاديث نبوية صحيحة' : 'Authentic Tafsir and Sahih Hadith'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#a824e0] text-white text-[11px] font-bold shrink-0">
                    {isAr ? 'تدبر ←' : 'Reflect →'}
                  </span>
                </button>

                {/* 4. Smart Haptic Tasbih (Soft Rose #fce2e6) */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSpiritualSheetOpen(false);
                    onOpenSmartTasbih?.();
                  }}
                  className="flex items-center justify-between p-4 rounded-[24px] bg-[#fce2e6] dark:bg-rose-950/60 border border-rose-400/40 text-start tap-spring active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#e11d48] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {isAr ? 'المسبحة اللمسية الذكية' : 'Haptic Smart Tasbih'}
                      </h4>
                      <p className="text-xs text-zinc-700 dark:text-rose-200/80 mt-0.5 truncate">
                        {isAr ? 'ختام الصلاة، الحوقلة، والاستغفار بالاهتزاز' : 'Post-prayer Dhikr with tactile haptics'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#e11d48] text-white text-[11px] font-bold shrink-0">
                    {isAr ? 'تسبيح ←' : 'Tasbih →'}
                  </span>
                </button>

                {/* 5. Faith & Intellectual Audio Sanctuary (Soft Amber #fde6d8) */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSpiritualSheetOpen(false);
                    onOpenFaithAudio?.();
                  }}
                  className="flex items-center justify-between p-4 rounded-[24px] bg-[#fde6d8] dark:bg-amber-950/60 border border-amber-400/40 text-start tap-spring active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-habit-flame-ink text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {isAr ? 'أثير الوعي والدروس الإيمانية' : 'Faith & Audio Sanctuary'}
                      </h4>
                      <p className="text-xs text-zinc-700 dark:text-amber-200/80 mt-0.5 truncate">
                        {isAr ? 'السيرة النبوية، التزكية، ومشغل ساوندكلاود' : 'Prophetic biography & SoundCloud stream'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-habit-flame-ink text-white text-[11px] font-bold shrink-0">
                    {isAr ? 'استماع ←' : 'Listen →'}
                  </span>
                </button>

                {/* 6. Prayer Location & Adhan (Clean White / Obsidian) */}
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSpiritualSheetOpen(false);
                    onOpenPrayerLocation?.();
                  }}
                  className="flex items-center justify-between p-4 rounded-[24px] surface-card-3d border border-zinc-200/80 dark:border-white/10 text-start tap-spring active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shrink-0 shadow-xs">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {isAr ? 'مواقيت الصلاة وموقع الأذان' : 'Prayer Times Location'}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                        {isAr ? 'تحديد المدينة أو الموقع عبر GPS' : 'GPS location & calculation settings'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 text-[11px] font-bold shrink-0">
                    {isAr ? 'ضبط ←' : 'Setup →'}
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
