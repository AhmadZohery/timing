import React from 'react';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Home,
} from 'lucide-react';
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
}) => {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const overrides = userState?.settings?.stationCustomOverrides;

  const stationIds: StationId[] = [
    'COMMUTE_MORNING',
    'WORK_MICRO_SPRINT',
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

  const prevMeta =
    currentStation === 'HOME'
      ? stations[stations.length - 1]
      : currentIndex > 0
      ? stations[currentIndex - 1]
      : null;

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
    onSelectStation(id);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const PrevChevron = isRTL ? ChevronRight : ChevronLeft;
  const NextChevron = isRTL ? ChevronLeft : ChevronRight;

  return (
    <nav className="w-full bg-white/95 dark:bg-zinc-950/95 border-b border-slate-200/80 dark:border-zinc-800/80 px-2 sm:px-4 py-2 backdrop-blur-md transition-colors duration-200 block">
      <div className={`w-full ${isFullWidth ? 'max-w-none px-1 sm:px-4' : 'max-w-[1720px] mx-auto'} transition-all duration-300`}>
        {/* ============================================================ */}
        {/* MOBILE BIDIRECTIONAL STEPPER (< lg)                          */}
        {/* Allows seamless forward and reverse navigation               */}
        {/* ============================================================ */}
        <div className="lg:hidden space-y-1.5 py-0.5">
          <div className="flex items-center justify-between gap-1.5">
            {/* ‹ Previous Station / Back Button */}
            <button
              type="button"
              onClick={() => handleSelect(prevStation)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold shrink-0 active:scale-95 transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-700"
              title={isAr ? 'المحطة السابقة (العكس)' : 'Previous Station'}
            >
              <PrevChevron className="w-3.5 h-3.5" />
              <span>
                {currentStation === 'HOME'
                  ? (isAr ? (prevMeta?.shortLabelAr || 'ختام اليوم 🏆') : (prevMeta?.shortLabelEn || 'Finish 🏆'))
                  : prevStation === 'HOME'
                  ? (isAr ? 'الرئيسية 🏠' : 'Home')
                  : (isAr ? (prevMeta?.shortLabelAr || 'السابق') : (prevMeta?.shortLabelEn || 'Prev'))}
              </span>
            </button>

            {/* Center: Home / Active Station Title & Step Counter */}
            <button
              type="button"
              onClick={() => handleSelect('HOME')}
              className="flex-1 flex flex-col items-center min-w-0 text-center px-1 py-0.5 rounded-xl hover:bg-slate-100/60 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer select-none"
              title={isAr ? 'العودة للرئيسية' : 'Go to Home Dashboard'}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                {currentStation === 'HOME' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Home className="w-3 h-3 inline" />
                    <span>{isAr ? 'الرئيسية' : 'Home'}</span>
                  </span>
                ) : (
                  <>
                    <span>
                      {isAr
                        ? `المحطة ${currentIndex + 1} من ${stationIds.length}`
                        : `Station ${currentIndex + 1} of ${stationIds.length}`}
                    </span>
                    {isCompleted && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                        ✓ {isAr ? 'مكتملة' : 'Done'}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate w-full">
                {currentStation === 'HOME'
                  ? (isAr ? 'لوحة التحكم والمسار اليومي' : 'Daily LifeOS Roadmap')
                  : (currentMeta ? (isAr ? currentMeta.titleAr : currentMeta.titleEn) : '')}
              </div>
            </button>

            {/* Next Station Button › */}
            <button
              type="button"
              onClick={() => handleSelect(nextStation)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold shrink-0 active:scale-95 transition-all cursor-pointer hover:bg-emerald-100"
              title={isAr ? 'المحطة التالية' : 'Next Station'}
            >
              <span>
                {nextStation === 'HOME'
                  ? (isAr ? 'الرئيسية 🏠' : 'Home 🏠')
                  : nextMeta
                  ? (isAr ? nextMeta.shortLabelAr : nextMeta.shortLabelEn)
                  : (isAr ? 'التالي' : 'Next')}
              </span>
              <NextChevron className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive 6-Station Segmented Micro Indicator Track */}
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            {stationIds.map((id, idx) => {
              const isAct = currentStation === id;
              const isComp = completedStations.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(id)}
                  aria-label={`Station ${idx + 1}`}
                  title={isAr ? stations[idx]?.titleAr : stations[idx]?.titleEn}
                  className={`relative h-1.5 rounded-full transition-all cursor-pointer before:absolute before:-inset-3 before:content-[''] ${
                    isAct
                      ? 'w-7 bg-emerald-600 dark:bg-emerald-400 shadow-2xs'
                      : isComp
                      ? 'w-3 bg-emerald-500/70 dark:bg-emerald-600/70'
                      : 'w-2.5 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* DESKTOP BIDIRECTIONAL STEPPER & CARDS (lg+)                  */}
        {/* Full 7 cards with Prev & Next quick step arrows              */}
        {/* ============================================================ */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Quick Prev Station Button */}
          <button
            type="button"
            onClick={() => handleSelect(prevStation)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shrink-0"
            title={isAr ? 'المحطة السابقة (السهم العكسي)' : 'Previous Station'}
          >
            <PrevChevron className="w-4 h-4" />
          </button>

          {/* 7 Interactive Cards */}
          <div className="flex-1 grid grid-cols-7 items-center gap-2">
            {/* 1. Home Sanctuary Card */}
            <button
              type="button"
              onClick={() => handleSelect('HOME')}
              className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-start transition-all cursor-pointer select-none ${
                currentStation === 'HOME'
                  ? 'bg-emerald-50 dark:bg-zinc-800/90 border border-emerald-500/50 text-emerald-900 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-transparent border border-transparent text-slate-500 dark:text-zinc-500 hover:bg-slate-100/60 dark:hover:bg-zinc-800/30 hover:text-slate-800 dark:hover:text-zinc-300'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  currentStation === 'HOME'
                    ? 'bg-emerald-200/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-zinc-800/60 text-slate-400 dark:text-zinc-500'
                }`}
              >
                <span className="text-base">🏠</span>
              </div>
              <div className="overflow-hidden min-w-0">
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold block">{isAr ? 'البداية ✦' : 'Start ✦'}</span>
                <span className="text-xs font-bold truncate block">{isAr ? 'الرئيسية' : 'Home'}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">
                  {isAr ? 'نظرة اليوم والتحفيز' : 'Overview'}
                </span>
              </div>
            </button>

            {/* 6 Stations Cards */}
            {stations.map((station, index) => {
              const Icon = station.icon;
              const isActive = currentStation === station.id;
              const isComp = completedStations.includes(station.id);

              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => handleSelect(station.id)}
                  className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-start transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-zinc-800/90 border border-emerald-500/50 text-emerald-900 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/20'
                      : isComp
                      ? 'bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800/60 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:border-slate-300'
                      : 'bg-transparent border border-transparent text-slate-500 dark:text-zinc-500 hover:bg-slate-100/60 dark:hover:bg-zinc-800/30 hover:text-slate-800 dark:hover:text-zinc-300'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-emerald-200/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                        : isComp
                        ? 'bg-emerald-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-zinc-800/60 text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {isComp ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="overflow-hidden min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">#{index + 1}</span>
                      <span className="text-xs font-bold truncate block">{isAr ? station.titleAr : station.titleEn}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">
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
            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 transition-all cursor-pointer shrink-0"
            title={isAr ? 'المحطة التالية ›' : 'Next Station ›'}
          >
            <NextChevron className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
