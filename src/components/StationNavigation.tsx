import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Home,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StationId, UserState } from '../types';
import { soundSynth } from '../services/soundSynthesizer';
import { haptic } from '../services/vibrationService';
import { useTranslation } from '../i18n/LanguageContext';
import { resolveStationMetadata } from '../utils/lifestyleEngine';

interface StationNavigationProps {
  currentStation: StationId;
  completedStations: string[];
  onSelectStation: (stationId: StationId) => void;
  isFullWidth?: boolean;
  userState?: UserState;
  onOpenLifestyleModal?: () => void;
}

export const StationNavigation: React.FC<StationNavigationProps> = ({
  currentStation,
  completedStations,
  onSelectStation,
  isFullWidth = false,
  userState,
  onOpenLifestyleModal,
}) => {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const [isMobilePickerOpen, setIsMobilePickerOpen] = useState(false);

  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const overrides = userState?.settings?.stationCustomOverrides;

  const stationIds: StationId[] = [
    'COMMUTE_MORNING',
    'WORK_MICRO_SPRINT',
    'ONE_SEC_FRICTION',
    'SOCIAL_MEDIA_BREAK',
    'GYM_ANCHOR',
    'EVENING_SPRINT',
    'RETROSPECTIVE_CHECKIN',
    'GRAND_REWARD_STATE',
  ];

  const stations = stationIds.map((id) =>
    resolveStationMetadata(id, personaId, overrides, isAr)
  );

  const currentIndex = stationIds.indexOf(currentStation);
  const currentMeta = currentIndex !== -1 ? stations[currentIndex] : null;
  const isCompleted = completedStations.includes(currentStation);

  // Bidirectional cyclical navigation calculation
  const prevStation: StationId =
    currentStation === 'HOME'
      ? stationIds[stationIds.length - 1]
      : currentIndex === 0
      ? 'HOME'
      : currentIndex > 0
      ? stationIds[currentIndex - 1]
      : stationIds[stationIds.length - 1];

  const nextStation: StationId =
    currentStation === 'HOME'
      ? stationIds[0]
      : currentIndex === stationIds.length - 1
      ? 'HOME'
      : currentIndex !== -1 && currentIndex < stationIds.length - 1
      ? stationIds[currentIndex + 1]
      : stationIds[0];

  const nextMeta =
    currentStation === 'HOME'
      ? stations[0]
      : currentIndex !== -1 && currentIndex < stationIds.length - 1
      ? stations[currentIndex + 1]
      : null;

  const handleSelect = (id: StationId) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsMobilePickerOpen(false);
    onSelectStation(id);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const PrevChevron = isRTL ? ChevronRight : ChevronLeft;
  const NextChevron = isRTL ? ChevronLeft : ChevronRight;

  return (
    <nav className={`w-full px-2.5 sm:px-4 py-1.5 transition-colors duration-200 ${currentStation === 'HOME' ? 'hidden lg:block' : 'block'}`}>
      <div className={`w-full ${isFullWidth ? 'max-w-none' : 'max-w-[1720px] mx-auto'} transition-all duration-300 space-y-2`}>
        {/* ============================================================ */}
        {/* MOBILE HABITLINE OBSIDIAN BAR (< lg, Active Station View)    */}
        {/* Tapping center pill opens interactive 8-station switcher!    */}
        {/* ============================================================ */}
        <div className="lg:hidden rounded-[24px] bg-[#141517] text-white p-2 shadow-lg border border-white/10 flex items-center justify-between gap-2">
          {/* Start: Return Home Pill */}
          <button
            type="button"
            onClick={() => handleSelect('HOME')}
            className="h-9 px-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-white/10"
            title={isAr ? 'العودة للرئيسية' : 'Back to Home'}
          >
            <Home className="w-3.5 h-3.5 text-[#1eb814] shrink-0" />
            <span>{isAr ? 'الرئيسية' : 'Home'}</span>
          </button>

          {/* Center: Clickable Current Station Title + Quick Switcher Drawer Toggle */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsMobilePickerOpen(!isMobilePickerOpen);
            }}
            className="min-w-0 flex-1 h-9 px-2.5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center gap-1.5 text-center cursor-pointer active:scale-95 transition-all"
            title={isAr ? 'اضغط للتنقل السريع بين جميع محطات اليوم' : 'Tap to switch station'}
          >
            <span className="text-xs font-bold text-white truncate">
              {currentMeta ? (isAr ? currentMeta.titleAr : currentMeta.titleEn) : ''}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-habit-flame-ink text-white text-[10px] font-mono font-bold shrink-0">
              <bdi dir="ltr">{currentIndex + 1}/{stationIds.length}</bdi>
            </span>
            {isCompleted && (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1eb814] shrink-0" />
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isMobilePickerOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* End: Next Station Pill */}
          <button
            type="button"
            onClick={() => handleSelect(nextStation)}
            className="h-9 px-3.5 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white text-xs font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-xs"
            title={isAr ? 'المحطة التالية' : 'Next Station'}
          >
            <span className="max-w-[78px] sm:max-w-[110px] truncate">
              {nextStation === 'HOME'
                ? isAr
                  ? 'الختام'
                  : 'Finish'
                : nextMeta
                ? isAr
                  ? nextMeta.shortLabelAr
                  : nextMeta.shortLabelEn
                : isAr
                ? 'التالي'
                : 'Next'}
            </span>
            <NextChevron className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

        {/* Mobile Expandable All-Stations Quick Jumper Drawer */}
        <AnimatePresence>
          {isMobilePickerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden overflow-hidden"
            >
              <div className="p-3 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    {isAr ? '🧭 التنقل السريع بين المحطات (٨ محطات)' : '🧭 Quick Station Switcher'}
                  </span>
                  {onOpenLifestyleModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobilePickerOpen(false);
                        onOpenLifestyleModal();
                      }}
                      className="text-[11px] font-bold text-[#5448e8] dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{isAr ? 'تخصيص المحطات' : 'Customize'}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {stations.map((st, idx) => {
                    const Icon = st.icon;
                    const isAct = currentStation === st.id;
                    const isComp = completedStations.includes(st.id);
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelect(st.id)}
                        className={`p-2.5 rounded-2xl border text-start flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                          isAct
                            ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 border-[#141517] dark:border-white font-bold shadow-xs'
                            : isComp
                            ? 'bg-[#bce8c2] dark:bg-emerald-950/60 border-[#1eb814]/40 text-zinc-900 dark:text-emerald-100 font-bold'
                            : 'bg-zinc-50 dark:bg-zinc-800/70 border-zinc-200/70 dark:border-white/10 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                            isAct
                              ? 'bg-habit-flame-ink text-white'
                              : isComp
                              ? 'bg-habit-green-ink text-white'
                              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {isComp ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold block truncate">
                            {idx + 1}. {isAr ? st.titleAr : st.titleEn}
                          </span>
                          <span className="text-[10px] opacity-75 font-mono block truncate">
                            {st.shortTime}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* DESKTOP HABITLINE FLOATING PILL BAR (lg+)                    */}
        {/* Obsidian Active Pill + Mint Completed Pills                  */}
        {/* ============================================================ */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-[24px] bg-white/95 dark:bg-zinc-900/95 p-1.5 shadow-lg border border-zinc-200/80 dark:border-white/10 backdrop-blur-xl">
          {/* Quick Prev Station Button */}
          <button
            type="button"
            onClick={() => handleSelect(prevStation)}
            className="w-10 h-10 rounded-2xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
            title={isAr ? 'المحطة السابقة' : 'Previous Station'}
          >
            <PrevChevron className="w-4 h-4" />
          </button>

          {/* Interactive Pill Tabs */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* 1. Home Sanctuary Pill Tab */}
            <button
              type="button"
              onClick={() => handleSelect('HOME')}
              className={`flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2 rounded-2xl text-start transition-all cursor-pointer select-none ${
                currentStation === 'HOME'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-md'
                  : 'bg-transparent border border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  currentStation === 'HOME'
                    ? 'bg-habit-green-ink text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500'
                }`}
              >
                <span className="text-base">🏠</span>
              </div>
              <div className="overflow-hidden min-w-0">
                <span
                  className={`text-[10px] font-bold block ${
                    currentStation === 'HOME' ? 'text-emerald-300 dark:text-emerald-600' : 'text-[#1eb814]'
                  }`}
                >
                  {isAr ? 'البداية ✦' : 'Start ✦'}
                </span>
                <span className="text-xs font-bold truncate block">{isAr ? 'الرئيسية' : 'Home'}</span>
              </div>
            </button>

            {/* Stations Pill Tabs */}
            {stations.map((station, index) => {
              const Icon = station.icon;
              const isActive = currentStation === station.id;
              const isComp = completedStations.includes(station.id);

              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => handleSelect(station.id)}
                  className={`flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2 rounded-2xl text-start transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-md scale-[1.01]'
                      : isComp
                      ? 'bg-[#d4f5dc] dark:bg-emerald-950/50 border border-[#1eb814]/40 text-zinc-900 dark:text-emerald-100 hover:bg-[#bce8c2]'
                      : 'bg-transparent border border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-habit-flame-ink text-white'
                        : isComp
                        ? 'bg-habit-green-ink text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500'
                    }`}
                  >
                    {isComp ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="overflow-hidden min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] opacity-70 font-mono">#{index + 1}</span>
                      <span className="text-xs font-bold truncate block">
                        {isAr ? station.titleAr : station.titleEn}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-75 block truncate font-mono">
                      {station.shortTime}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Next Station Button */}
          <button
            type="button"
            onClick={() => {
              if (nextStation) handleSelect(nextStation);
              else handleSelect('HOME');
            }}
            className="w-10 h-10 rounded-2xl bg-habit-green-ink hover:bg-habit-green-ink-deep text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
            title={isAr ? 'المحطة التالية ›' : 'Next Station ›'}
          >
            <NextChevron className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
