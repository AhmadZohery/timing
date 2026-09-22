import React, { useState } from 'react';
import {
  Compass,
  Bot,
  Calendar,
  Zap,
  CheckCircle2,
  BookOpen,
  Briefcase,
  Dumbbell,
  Laptop,
  Mic,
  Trophy,
  X,
  Moon,
  Gift,
  Search,
} from 'lucide-react';
import type { StationId } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface MobileBottomDockProps {
  currentStation: StationId;
  completedStations: string[];
  onSelectStation: (stationId: StationId) => void;
  onOpenAiCoach: () => void;
  onOpenTwoMinuteRule: () => void;
  onOpenArchive: () => void;
  onOpenEvaluation?: () => void;
  onOpenSleepRest?: () => void;
  onOpenRewards?: () => void;
  onOpenCommandPalette?: () => void;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  currentStation,
  completedStations,
  onSelectStation,
  onOpenAiCoach,
  onOpenTwoMinuteRule,
  onOpenArchive,
  onOpenEvaluation,
  onOpenSleepRest,
  onOpenRewards,
  onOpenCommandPalette,
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const [showStationsDrawer, setShowStationsDrawer] = useState(false);

  const stations = [
    { id: 'COMMUTE_MORNING' as StationId, title: t('station_1_title'), shortLabel: isAr ? 'القرآن' : 'Quran', icon: BookOpen, time: t('station_1_time') },
    { id: 'WORK_MICRO_SPRINT' as StationId, title: t('station_2_title'), shortLabel: isAr ? 'العمل' : 'Work', icon: Briefcase, time: t('station_2_time') },
    { id: 'GYM_ANCHOR' as StationId, title: t('station_3_title'), shortLabel: isAr ? 'الرياضة' : 'Gym', icon: Dumbbell, time: t('station_3_time') },
    { id: 'EVENING_SPRINT' as StationId, title: t('station_4_title'), shortLabel: isAr ? 'المساء' : 'Evening', icon: Laptop, time: t('station_4_time') },
    { id: 'RETROSPECTIVE_CHECKIN' as StationId, title: t('station_5_title'), shortLabel: isAr ? 'المراجعة' : 'Review', icon: Mic, time: t('station_5_time') },
    { id: 'GRAND_REWARD_STATE' as StationId, title: t('station_6_title'), shortLabel: isAr ? 'المكافأة' : 'Reward', icon: Trophy, time: t('station_6_time') },
  ];

  return (
    <>
      {/* Fixed Bottom Dock Bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-3 pt-2"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
          {/* 1. Home Sanctuary Button */}
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onSelectStation('HOME');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
              currentStation === 'HOME'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <span className="text-lg leading-none">🏠</span>
            <span className="text-[10px] font-bold">{isAr ? 'الرئيسية' : 'Home'}</span>
          </button>

          {/* 2. Stations Selector Drawer */}
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setShowStationsDrawer(true);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
              currentStation !== 'HOME'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-bold">{isAr ? 'المحطات' : 'Stations'}</span>
          </button>

          {/* 3. Center AI Coach Button (Prominent & Glow) */}
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenAiCoach();
            }}
            className="relative -top-3 p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-500 text-white shadow-lg shadow-indigo-500/40 border-2 border-white dark:border-zinc-900 active:scale-95 transition-all cursor-pointer flex flex-col items-center"
            title={isAr ? 'المرشد الذكي' : 'AI Coach'}
          >
            <Bot className="w-6 h-6 animate-pulse" />
          </button>

          {/* 4. 2-Minute Micro-Action Easy Start */}
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenTwoMinuteRule();
            }}
            className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors cursor-pointer"
          >
            <Zap className="w-5 h-5 fill-amber-500/20 text-amber-500" />
            <span className="text-[10px] font-bold">{isAr ? 'دقيقتين' : '2-Min'}</span>
          </button>

          {/* 5. Calendar & History Archive */}
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenArchive();
            }}
            className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-bold">{isAr ? 'الأرشيف' : 'Archive'}</span>
          </button>
        </div>
      </nav>

      {/* Slide-up Stations Drawer on Mobile */}
      {showStationsDrawer && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setShowStationsDrawer(false)}
          />

          <div
            className="relative z-10 w-full max-h-[80vh] bg-white dark:bg-zinc-950 rounded-t-3xl border-t border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {isAr ? 'اختر محطة اليوم (Stations Flow)' : 'Select Station'}
                </h3>
              </div>
              <button
                onClick={() => setShowStationsDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Omnisearch Action in Mobile Drawer */}
            {onOpenCommandPalette && (
              <div className="p-3 bg-slate-50/70 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowStationsDrawer(false);
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    onOpenCommandPalette();
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 text-xs font-medium flex items-center justify-between shadow-2xs hover:border-indigo-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-indigo-500" />
                    <span>{isAr ? 'ابحث في كل شيء أو نفذ أمراً سريعاً...' : 'Search everything or run command...'}</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-700 text-[10px] font-mono font-bold text-slate-600 dark:text-zinc-300">
                    ⌘K
                  </kbd>
                </button>
              </div>
            )}

            {/* List of Stations */}
            <div className="p-4 overflow-y-auto space-y-2">
              {/* Home Sanctuary Option */}
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  onSelectStation('HOME');
                  setShowStationsDrawer(false);
                }}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-start transition-all cursor-pointer ${
                  currentStation === 'HOME'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-500/20'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-base flex items-center justify-center">
                    🏠
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">#0</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {isAr ? 'الرئيسية (لوحة اليوم)' : 'Home Dashboard'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {isAr ? 'نظرة شاملة، أقباس نورانية، ومواقيت الصلاة' : 'Overview, wisdom sparks, & prayer times'}
                    </span>
                  </div>
                </div>
                {currentStation === 'HOME' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                    {isAr ? 'النشطة' : 'Active'}
                  </span>
                )}
              </button>

              {stations.map((st, idx) => {
                const Icon = st.icon;
                const isActive = currentStation === st.id;
                const isDone = completedStations.includes(st.id);

                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      onSelectStation(st.id);
                      setShowStationsDrawer(false);
                    }}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-start transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-500/20'
                        : isDone
                        ? 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isActive
                          ? 'bg-emerald-200/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                          : isDone
                          ? 'bg-emerald-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Icon className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">{st.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400">{st.time}</span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                        {isAr ? 'النشطة' : 'Active'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Evaluation Link in Drawer */}
            {onOpenEvaluation && (
              <div className="px-4 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowStationsDrawer(false);
                    onOpenEvaluation();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Trophy className="w-4 h-4" />
                  <span>{isAr ? 'عرض لوحة التقييم الدوري والتحفيز 🏆' : 'View Evaluation & Motivation 🏆'}</span>
                </button>
              </div>
            )}

            {/* Quick Sleep & Rest Recovery Link in Drawer */}
            {onOpenSleepRest && (
              <div className="px-4 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowStationsDrawer(false);
                    onOpenSleepRest();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>{isAr ? 'نظام ومواعيد النوم والاستشفاء 🌙' : 'Sleep & Rest Recovery 🌙'}</span>
                </button>
              </div>
            )}

            {/* Real-Life Rewards Link in Drawer */}
            {onOpenRewards && (
              <div className="px-4 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowStationsDrawer(false);
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    onOpenRewards();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/25 transition-transform active:scale-98"
                >
                  <Gift className="w-4 h-4" />
                  <span>{isAr ? 'متجر المكافآت الواقعية (اشتري لنفسك كذا 🎁)' : 'Real-Life Reward Store 🎁'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
