import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Vibrate,
  ScrollText,
  Zap,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  TASBIH_PRESETS,
  type TasbihPresetId,
  type TasbihCategory,
  checkIsFridaySalawatWindow,
  updateDailyTasbihProgress,
} from '../../utils/tasbihEngine';
import type { UserState } from '../../types';

export type TasbihMode = TasbihPresetId;

interface SmartTasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardToast?: (message: string) => void;
  defaultMode?: TasbihPresetId;
  userState?: UserState;
}

export const SmartTasbihModal: React.FC<SmartTasbihModalProps> = ({
  isOpen,
  onClose,
  onRewardToast,
  defaultMode = 'tahlil_100',
  userState,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [activeCategory, setActiveCategory] = useState<TasbihCategory>('daily_core');
  const [activeMode, setActiveMode] = useState<TasbihPresetId>(defaultMode);
  const [useAlternativeFormula, setUseAlternativeFormula] = useState(false);
  const [customTarget, setCustomTarget] = useState<number | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [totalCompletedCycles, setTotalCompletedCycles] = useState(() => {
    return Number(localStorage.getItem('midmar_tasbih_cycles') || '0');
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [isPressing, setIsPressing] = useState(false);

  // Check Friday Salawat window
  const prayerLoc = userState?.settings?.prayerLocation;
  const fridayStatus = checkIsFridaySalawatWindow(new Date(), prayerLoc);

  // Synchronize default mode when opened
  useEffect(() => {
    if (isOpen) {
      const mode = defaultMode || (fridayStatus.isWindow ? 'salawat_ibrahimiyyah' : 'tahlil_100');
      setActiveMode(mode);
      setActiveCategory(TASBIH_PRESETS[mode]?.category || 'daily_core');
      setStageIndex(0);
      setCount(0);
      setCustomTarget(null);
      setUseAlternativeFormula(false);
    }
  }, [isOpen, defaultMode]);

  const currentPreset = TASBIH_PRESETS[activeMode] || TASBIH_PRESETS.tahlil_100;
  const currentStage = currentPreset.stages[stageIndex] || currentPreset.stages[0];
  const target = customTarget !== null ? customTarget : currentStage.target;
  const isTargetMode = target > 0;
  const progressPercent = isTargetMode ? Math.min(100, Math.round((count / target) * 100)) : 100;

  // Active Dhikr Display Text (support formula toggle e.g. for Salawat)
  const displayedText =
    activeMode === 'salawat_ibrahimiyyah' && useAlternativeFormula && currentPreset.alternativeText
      ? currentPreset.alternativeText
      : currentStage.text;

  // Haptic & Sound Trigger on Tap
  const handleTap = async () => {
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 120);

    if (soundEnabled) {
      soundSynth.playTactileClick();
    }
    if (hapticEnabled) {
      haptic.vibrateLight();
    }

    const nextCount = count + 1;

    if (isTargetMode && nextCount >= target) {
      // Completed current stage
      if (stageIndex < currentPreset.stages.length - 1) {
        // Move to next stage in multi-stage (e.g. Khitam Salah: 33 SubhanAllah -> 33 Alhamdulillah)
        soundSynth.playStreakMilestoneChime();
        haptic.vibrateWorkDone();
        setStageIndex((prev) => prev + 1);
        setCount(0);
      } else {
        // Completed entire preset!
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        const nextCycles = totalCompletedCycles + 1;
        setTotalCompletedCycles(nextCycles);
        localStorage.setItem('midmar_tasbih_cycles', String(nextCycles));

        // Save progress to Dexie DB and award XP
        const res = await updateDailyTasbihProgress(activeMode, nextCount, target);

        if (onRewardToast) {
          onRewardToast(
            res.message ||
              (isAr
                ? `✨ تقبل الله طاعتك! أتممت ذكر ${currentPreset.titleAr} (+${currentPreset.pointsReward} XP)`
                : `✨ Dhikr completed: ${currentPreset.titleEn} (+${currentPreset.pointsReward} XP)`)
          );
        }

        // Reset to first stage for another cycle
        setStageIndex(0);
        setCount(0);
      }
    } else {
      setCount(nextCount);
    }
  };

  const handleReset = () => {
    if (soundEnabled) soundSynth.playTactileClick();
    if (hapticEnabled) haptic.vibrateLight();
    setCount(0);
    setStageIndex(0);
  };

  const handleSwitchMode = (mode: TasbihPresetId) => {
    if (soundEnabled) soundSynth.playTactileClick();
    setActiveMode(mode);
    setActiveCategory(TASBIH_PRESETS[mode].category);
    setStageIndex(0);
    setCount(0);
    setCustomTarget(null);
    setUseAlternativeFormula(false);
  };

  // Keyboard Space / Enter support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault();
        handleTap();
      } else if (e.code === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, count, stageIndex, activeMode, soundEnabled, hapticEnabled]);

  if (!isOpen) return null;

  // SVG Circle Progress Math
  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isTargetMode
    ? circumference - (progressPercent / 100) * circumference
    : 0;

  // Filter presets by active category
  const categoryPresets = (Object.keys(TASBIH_PRESETS) as TasbihPresetId[]).filter(
    (key) => TASBIH_PRESETS[key].category === activeCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in transition-colors">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#0b0e14] via-[#0f141f] to-[#080a0f] border border-emerald-500/30 p-3.5 sm:p-5 shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col justify-between gap-2.5">
        {/* Subtle Ambient Backlight Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentPreset.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-zinc-100 tracking-wide">
                  {isAr ? currentPreset.titleAr : currentPreset.titleEn}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 hidden sm:inline-block">
                  {currentPreset.badgeAr}
                </span>
              </div>
              {currentPreset.stages.length > 1 && (
                <p className="text-[11px] font-mono text-emerald-400 font-medium">
                  {isAr
                    ? `المرحلة ${stageIndex + 1} من ${currentPreset.stages.length}`
                    : `Stage ${stageIndex + 1} of ${currentPreset.stages.length}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-zinc-800 text-emerald-400 border-zinc-700'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800'
              }`}
              title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Haptic Toggle */}
            <button
              onClick={() => setHapticEnabled((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                hapticEnabled
                  ? 'bg-zinc-800 text-amber-400 border-zinc-700'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800'
              }`}
              title={hapticEnabled ? 'تعطيل الاهتزاز' : 'تفعيل الاهتزاز'}
            >
              <Vibrate className="w-4 h-4" />
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all cursor-pointer"
              title="تصفير العداد"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Friday Salawat Season Celebration Banner */}
        {fridayStatus.isWindow && (
          <div className="w-full mt-2 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-amber-950/80 border border-amber-500/40 flex items-center justify-between gap-2 z-10 animate-fade-in shadow-lg">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">🕌</span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-amber-300 block truncate">
                  {fridayStatus.titleAr}
                </span>
                <span className="text-[10px] text-zinc-300 block truncate">
                  {fridayStatus.descriptionAr}
                </span>
              </div>
            </div>
            {activeMode !== 'salawat_ibrahimiyyah' && (
              <button
                type="button"
                onClick={() => handleSwitchMode('salawat_ibrahimiyyah')}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black shrink-0 transition-transform active:scale-95 cursor-pointer shadow-sm"
              >
                {isAr ? 'الورد الإبراهيمي 🌸' : 'Salawat'}
              </button>
            )}
          </div>
        )}

        {/* Category Tabs: Daily Core / Prayer / Treasures */}
        <div className="w-full flex items-center justify-center gap-1 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800/80 z-10 mt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveCategory('daily_core')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeCategory === 'daily_core'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🌟 {isAr ? 'أوراد اليوم الكبرى' : 'Daily Core'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('prayer_adhkar')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeCategory === 'prayer_adhkar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🕌 {isAr ? 'أذكار الصلوات' : 'Prayer Dhikr'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('treasures')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeCategory === 'treasures'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📿 {isAr ? 'كنوز الذكر' : 'Treasures'}
          </button>
        </div>

        {/* Preset Selector Pill Strip for active category */}
        <div className="w-full overflow-x-auto py-1 flex items-center gap-1.5 scrollbar-none z-10 shrink-0">
          {categoryPresets.map((modeKey) => {
            const preset = TASBIH_PRESETS[modeKey];
            const isActive = activeMode === modeKey;
            return (
              <button
                key={modeKey}
                onClick={() => handleSwitchMode(modeKey)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-500/25 text-emerald-200 border-emerald-500/70 shadow-xs scale-102 ring-1 ring-emerald-500/40'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span>{preset.icon}</span>
                <span>{isAr ? preset.titleAr : preset.titleEn}</span>
              </button>
            );
          })}
        </div>

        {/* Active Dhikr Text & Virtue Card */}
        <div className="w-full text-center space-y-2 px-1 z-10 my-auto">
          <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/85 border border-zinc-800 shadow-inner space-y-2">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold font-serif text-amber-200/95 leading-relaxed tracking-wide select-none">
              {displayedText}
            </h2>

            {/* Salawat Formula Switcher Button (Full vs Concise) */}
            {activeMode === 'salawat_ibrahimiyyah' && (
              <div className="flex items-center justify-center gap-2 pt-1 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setUseAlternativeFormula(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    !useAlternativeFormula
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ScrollText className="w-3 h-3" />
                  <span>الصيغة الإبراهيمية التامة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUseAlternativeFormula(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    useAlternativeFormula
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>الصيغة الموجزة</span>
                </button>
              </div>
            )}

            {/* Dynamic Target Picker Pills (Single Stage or Free Dhikr) */}
            {(currentPreset.stages.length === 1 || activeMode === 'free') && (
              <div className="flex items-center justify-center gap-1.5 pt-1.5 border-t border-zinc-800/80 flex-wrap">
                <span className="text-[10px] text-zinc-400 font-medium">
                  {isAr ? 'الهدف:' : 'Goal:'}
                </span>
                {[33, 100, 300, 1000, 0].map((tVal) => (
                  <button
                    key={tVal}
                    type="button"
                    onClick={() => {
                      if (soundEnabled) soundSynth.playTactileClick();
                      if (hapticEnabled) haptic.vibrateLight();
                      setCustomTarget(tVal);
                      if (tVal > 0 && count >= tVal) {
                        setCount(0);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      target === tVal
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/60 shadow-xs scale-105'
                        : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
                    }`}
                  >
                    {tVal === 0 ? (isAr ? 'حر ♾️' : 'Free ♾️') : tVal}
                  </button>
                ))}
              </div>
            )}

            {currentStage.virtueAr && (
              <p className="text-[10px] sm:text-xs text-zinc-400 font-sans leading-relaxed">
                💫 {currentStage.virtueAr}
              </p>
            )}
          </div>
        </div>

        {/* Central Giant Tactile Haptic Bead Button */}
        <div className="relative my-2 sm:my-3 z-10 flex items-center justify-center shrink-0">
          <svg className="w-44 h-44 sm:w-56 sm:h-56 -rotate-90 transform" viewBox="0 0 240 240">
            {/* Outer Track */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              className="text-zinc-800/60"
              fill="transparent"
            />
            {/* Dynamic Progress Ring */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="url(#tasbih-emerald-gradient)"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-150 ease-out"
              fill="transparent"
            />
            <defs>
              <linearGradient id="tasbih-emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
          </svg>

          {/* Interactive Tap Area with Touch-manipulation & Ripple feedback */}
          <button
            onClick={handleTap}
            className={`absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-b from-[#192231] via-[#111724] to-[#0c101a] border-2 border-emerald-500/40 shadow-2xl flex flex-col items-center justify-center transition-all duration-75 active:scale-92 cursor-pointer select-none touch-manipulation ${
              isPressing
                ? 'scale-90 ring-4 ring-emerald-400/60 shadow-emerald-500/50'
                : 'hover:border-emerald-400/60 hover:shadow-emerald-900/30'
            }`}
          >
            {/* Ripple Wave on Tap */}
            {isPressing && (
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400/50 animate-ping pointer-events-none opacity-60" />
            )}

            <span className="text-3xl sm:text-4xl font-mono font-black text-zinc-100 tracking-tight">
              {count}
            </span>
            {isTargetMode ? (
              <span className="text-xs font-mono text-emerald-400 font-bold mt-1">
                من أصل {target}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-amber-400 font-bold mt-1">تسبيح حر</span>
            )}
            <span className="mt-1 text-[10px] text-zinc-500 font-medium flex items-center gap-1">
              <span>انقر أو اضغط مسافة</span>
            </span>
          </button>
        </div>

        {/* Bottom Multi-Stage Breadcrumbs & Cycle Summary */}
        <div className="w-full flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs text-zinc-400 z-10 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              دورات اليوم: <strong className="text-zinc-200 font-mono">{totalCompletedCycles}</strong>
            </span>
          </div>

          {currentPreset.stages.length > 1 && (
            <div className="flex items-center gap-1">
              {currentPreset.stages.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === stageIndex
                      ? 'w-5 bg-emerald-400'
                      : idx < stageIndex
                      ? 'bg-emerald-600'
                      : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>
          )}

          <button
            onClick={handleTap}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <span>+1 تسبيحة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
