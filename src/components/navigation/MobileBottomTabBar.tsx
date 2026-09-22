import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Compass,
  Moon,
  Award,
  Sparkles,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { StationId, UserState } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { resolveStationMetadata, LIFESTYLE_PERSONAS } from '../../utils/lifestyleEngine';

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
      {/* Native Apple-Tier Floating Glass Bottom Navigation Bar (< lg screens only) */}
      <nav
        aria-label={isAr ? 'شريط التنقل السفلي' : 'Bottom Navigation'}
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-zinc-800/80 px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-colors"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-items-center">
          {/* TAB 1: 🏠 الرئيسية (Home Sanctuary) */}
          <button
            type="button"
            onClick={() => handleSelect('HOME')}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer select-none active:scale-92 ${
              currentStation === 'HOME'
                ? 'text-emerald-600 dark:text-emerald-400 font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            {currentStation === 'HOME' && (
              <motion.div
                layoutId="mobile-active-tab-glow"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute inset-0 rounded-2xl bg-emerald-500/12 dark:bg-emerald-400/15"
              />
            )}
            <Home className={`w-5 h-5 transition-transform stroke-[1.75] ${currentStation === 'HOME' ? 'scale-110' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10">
              {isAr ? 'الرئيسية' : 'Home'}
            </span>
          </button>

          {/* TAB 2: 🧭 المحطات (Stations Journey) */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsStationsSheetOpen(true);
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer select-none active:scale-92 ${
              isStationActive
                ? 'text-emerald-600 dark:text-emerald-400 font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            {isStationActive && (
              <motion.div
                layoutId="mobile-active-tab-glow"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute inset-0 rounded-2xl bg-emerald-500/12 dark:bg-emerald-400/15"
              />
            )}
            <div className="relative">
              <Compass className={`w-5 h-5 transition-transform stroke-[1.75] ${isStationActive ? 'scale-110' : ''}`} />
              <span className="absolute -top-1 -end-2 px-1 py-0.2 rounded-full bg-emerald-600 text-[8px] font-bold text-white font-mono leading-none">
                {completedStations.length}/6
              </span>
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10">
              {isAr ? 'المحطات' : 'Stations'}
            </span>
          </button>

          {/* TAB 3: 📿 المحراب (Spiritual Sanctuary) */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsSpiritualSheetOpen(true);
            }}
            className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer select-none active:scale-92 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
          >
            <div className="relative">
              <Moon className="w-5 h-5 stroke-[1.75]" />
              <span className="absolute -top-0.5 -end-1 w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10">
              {isAr ? 'الورد والقرآن' : 'Spiritual'}
            </span>
          </button>

          {/* TAB 4: 📊 التقييم (Daily Evaluation & Pride) */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenEvaluationModal?.();
            }}
            className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer select-none active:scale-92 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
          >
            <Award className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10">
              {isAr ? 'التقييم' : 'Review'}
            </span>
          </button>

          {/* TAB 5: ⚡ المساعد (Companion Command & Tools) */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenCompanionHub?.();
            }}
            className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer select-none active:scale-92 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
          >
            <Sparkles className="w-5 h-5 stroke-[1.75] text-amber-500" />
            <span className="text-[10px] mt-0.5 tracking-tight relative z-10">
              {isAr ? 'المساعد' : 'Tools'}
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
