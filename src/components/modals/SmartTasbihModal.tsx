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
  Plus,
  Hand,
  Globe,
  Lock,
  Trash2,
  ShieldCheck,
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
  recordTasbihTap,
  getActiveTasbihSession,
  resetTasbihSession,
  getAllTasbihPresets,
  saveCustomDhikr,
  deleteCustomDhikr,
  getCommunityPendingDhikrs,
  approveCommunityDhikr,
  rejectCommunityDhikr,
  getYesterdayTasbihSummary,
} from '../../utils/tasbihEngine';
import { authService } from '../../services/authService';
import type { UserState, CustomDhikrItem } from '../../types';

export type TasbihMode = TasbihPresetId | string;

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

  const [allPresets, setAllPresets] = useState(() => getAllTasbihPresets());
  const [activeCategory, setActiveCategory] = useState<TasbihCategory>('daily_core');
  const [activeMode, setActiveMode] = useState<string>(defaultMode);
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

  // Blind Full-Screen Tap Mode
  const [isBlindTapMode, setIsBlindTapMode] = useState(false);

  // Custom Dhikr Builder Modal State
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [newDhikrText, setNewDhikrText] = useState('');
  const [newDhikrTarget, setNewDhikrTarget] = useState<number>(100);
  const [newDhikrIsPublic, setNewDhikrIsPublic] = useState(false);

  // Admin Community Moderation State
  const [pendingCommunityList, setPendingCommunityList] = useState<CustomDhikrItem[]>(() =>
    getCommunityPendingDhikrs()
  );
  const session = authService.getSession();
  const isAdmin = session?.username?.toLowerCase() === 'ahmad' || session?.userId === 'account_owner_ahmad';

  // In-progress session continuation prompt & Yesterday achievements banner
  const [inProgressPrompt, setInProgressPrompt] = useState<{ count: number; stageIndex: number } | null>(null);
  const [yesterdaySummary, setYesterdaySummary] = useState<string | null>(null);

  // Check Friday Salawat window
  const prayerLoc = userState?.settings?.prayerLocation;
  const fridayStatus = checkIsFridaySalawatWindow(new Date(), prayerLoc);

  // Synchronize and restore active count when opened
  useEffect(() => {
    if (isOpen) {
      getYesterdayTasbihSummary().then((res) => {
        if (res.hasData) setYesterdaySummary(res.summaryTextAr);
      });

      const merged = getAllTasbihPresets();
      setAllPresets(merged);
      const mode = defaultMode || (fridayStatus.isWindow ? 'salawat_ibrahimiyyah' : 'tahlil_100');
      setActiveMode(mode);
      setActiveCategory(merged[mode]?.category || 'daily_core');
      setCustomTarget(null);
      setUseAlternativeFormula(false);

      // Restore active saved session for this mode: prompt user to continue or restart!
      getActiveTasbihSession(mode).then((saved) => {
        if (saved && !saved.completed && saved.count > 0) {
          setCount(saved.count);
          setStageIndex(saved.stageIndex);
          setInProgressPrompt({ count: saved.count, stageIndex: saved.stageIndex });
        } else {
          setCount(0);
          setStageIndex(0);
          setInProgressPrompt(null);
        }
      });
    }
  }, [isOpen, defaultMode]);

  const currentPreset = allPresets[activeMode] || allPresets.tahlil_100 || TASBIH_PRESETS.tahlil_100;
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
        const nextStage = stageIndex + 1;
        setStageIndex(nextStage);
        setCount(0);
        recordTasbihTap(activeMode, nextStage, 0, currentPreset.stages[nextStage]?.target || 33);
      } else {
        // Completed entire preset!
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        const nextCycles = totalCompletedCycles + 1;
        setTotalCompletedCycles(nextCycles);
        localStorage.setItem('midmar_tasbih_cycles', String(nextCycles));

        // Save progress to Dexie DB and award XP
        const res = await updateDailyTasbihProgress(activeMode, nextCount, target);
        recordTasbihTap(activeMode, 0, 0, target);

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
      // Persist every intermediate tap immediately
      recordTasbihTap(activeMode, stageIndex, nextCount, target);
    }
  };

  const handleReset = async () => {
    if (soundEnabled) soundSynth.playTactileClick();
    if (hapticEnabled) haptic.vibrateLight();
    setCount(0);
    setStageIndex(0);
    await resetTasbihSession(activeMode);
  };

  const handleSwitchMode = (mode: string) => {
    if (soundEnabled) soundSynth.playTactileClick();
    setActiveMode(mode);
    setActiveCategory(allPresets[mode]?.category || 'daily_core');
    setCustomTarget(null);
    setUseAlternativeFormula(false);
    getActiveTasbihSession(mode).then((saved) => {
      if (saved && !saved.completed && saved.count > 0) {
        setCount(saved.count);
        setStageIndex(saved.stageIndex);
        setInProgressPrompt({ count: saved.count, stageIndex: saved.stageIndex });
      } else {
        setCount(0);
        setStageIndex(0);
        setInProgressPrompt(null);
      }
    });
  };

  const handleCreateCustomDhikr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDhikrText.trim()) return;

    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();

    const created = saveCustomDhikr({
      titleAr: newDhikrText.trim(),
      targetCount: Number(newDhikrTarget) || 100,
      category: 'custom',
      isPublicProposal: newDhikrIsPublic,
      authorName: session?.displayName || session?.username || 'أحمد',
    });

    const updated = getAllTasbihPresets();
    setAllPresets(updated);
    setActiveCategory('custom');
    setActiveMode(created.id);
    setIsAddCustomOpen(false);
    setNewDhikrText('');
    setNewDhikrTarget(100);

    if (newDhikrIsPublic) {
      setPendingCommunityList(getCommunityPendingDhikrs());
      onRewardToast?.(
        isAr
          ? '✨ تم حفظ الورد، ورُفع كطلب مجتمعي لمراجعته واعتماده للجميع!'
          : 'Custom dhikr saved and submitted for global review!'
      );
    } else {
      onRewardToast?.(
        isAr ? '🌸 تم حفظ وردك الشخصي بنجاح!' : 'Personal dhikr saved successfully!'
      );
    }
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    deleteCustomDhikr(id);
    const updated = getAllTasbihPresets();
    setAllPresets(updated);
    setActiveMode('tahlil_100');
    setActiveCategory('daily_core');
  };

  const handleApprove = (id: string) => {
    approveCommunityDhikr(id);
    setPendingCommunityList(getCommunityPendingDhikrs());
    setAllPresets(getAllTasbihPresets());
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    onRewardToast?.(isAr ? '✅ تم اعتماد الذكر ونشره لجميع المستخدمين!' : 'Approved globally!');
  };

  const handleReject = (id: string) => {
    rejectCommunityDhikr(id);
    setPendingCommunityList(getCommunityPendingDhikrs());
    setAllPresets(getAllTasbihPresets());
    soundSynth.playWarningSound();
    haptic.vibrateWarning();
    onRewardToast?.(isAr ? '❌ تم رفض المقترح واقتصاره على صاحبه فقط.' : 'Proposal rejected.');
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
  const categoryPresets = Object.keys(allPresets).filter(
    (key) => allPresets[key]?.category === activeCategory
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
            {/* Blind Tap Fullscreen Mode */}
            <button
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsBlindTapMode(true);
              }}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 transition-all cursor-pointer"
              title="نمط النقرة العمياء للشاشة بالكامل"
            >
              <Hand className="w-4 h-4" />
            </button>

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

        {/* Admin Community Dhikr Moderation Card (For Ahmad) */}
        {isAdmin && pendingCommunityList.length > 0 && (
          <div className="w-full p-2.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2 z-10 animate-fade-in shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>طلبات الأوراد المجتمعية قيد المراجعة ({pendingCommunityList.length})</span>
              </span>
              <span className="text-[10px] text-amber-400 font-mono">لوحة تحكم المدير</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {pendingCommunityList.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-100 truncate">{item.titleAr}</p>
                    <p className="text-[10px] text-zinc-400">
                      بواسطة: {item.authorName} • الهدف: {item.targetCount}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                    >
                      اعتماد للجميع ✅
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-300 font-bold text-[10px] cursor-pointer"
                    >
                      رفض ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friday Salawat Season Celebration Banner */}
        {fridayStatus.isWindow && (
          <div className="w-full mt-1 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-amber-950/80 border border-amber-500/40 flex items-center justify-between gap-2 z-10 animate-fade-in shadow-lg">
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

        {/* Yesterday Achievements Banner */}
        {yesterdaySummary && (
          <div className="w-full p-2.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs flex items-center justify-between gap-2 z-10 animate-fade-in shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">🌟</span>
              <span className="text-[11px] font-medium truncate">
                {yesterdaySummary} • <span className="font-bold text-indigo-300">{isAr ? 'مسجل في إنجازاتك' : 'Saved in history'}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setYesterdaySummary(null)}
              className="text-indigo-400 hover:text-white text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* In-Progress Session Continuation vs Restart Prompt Banner */}
        {inProgressPrompt && (
          <div className="w-full p-2.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-between gap-2 z-10 animate-fade-in shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">⏸️</span>
              <span className="text-[11px] font-bold text-amber-200 truncate">
                {isAr
                  ? `جلسة متوقفة عند (${inProgressPrompt.count}) تسبيحة:`
                  : `Paused at (${inProgressPrompt.count}) taps:`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setInProgressPrompt(null);
                }}
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
              >
                <span>{isAr ? `استمرار من ${inProgressPrompt.count} ⏩` : `Continue`}</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setCount(0);
                  setStageIndex(0);
                  setInProgressPrompt(null);
                  await resetTasbihSession(activeMode);
                }}
                className="px-2 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] cursor-pointer"
              >
                <span>{isAr ? 'إعادة من 0 🔄' : 'Reset'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Category Tabs: Daily Core / Prayer / Treasures / Custom */}
        <div className="w-full flex items-center justify-center gap-1 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800/80 z-10 mt-1 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveCategory('daily_core')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
              activeCategory === 'daily_core'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🌟 {isAr ? 'أوراد اليوم' : 'Daily'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('prayer_adhkar')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
              activeCategory === 'prayer_adhkar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🕌 {isAr ? 'الصلوات' : 'Prayer'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('treasures')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
              activeCategory === 'treasures'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📿 {isAr ? 'الكنوز' : 'Treasures'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('custom')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
              activeCategory === 'custom'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🌸 {isAr ? 'أوراد خاصة' : 'Custom'}
          </button>
        </div>

        {/* Preset Selector Pill Strip */}
        <div className="w-full overflow-x-auto py-1 flex items-center gap-1.5 scrollbar-none z-10 shrink-0">
          {categoryPresets.map((modeKey) => {
            const preset = allPresets[modeKey];
            if (!preset) return null;
            const isActive = activeMode === modeKey;
            const isCustomItem = modeKey.startsWith('custom_dhikr_');
            return (
              <div key={modeKey} className="flex items-center gap-0.5 shrink-0">
                <button
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
                {isCustomItem && (
                  <button
                    onClick={(e) => handleDeleteCustom(modeKey, e)}
                    className="p-1 text-zinc-500 hover:text-red-400 rounded-full"
                    title="حذف هذا الورد"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Custom Dhikr Button */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsAddCustomOpen(true);
            }}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer border border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة ورد خاص' : 'Add Custom'}</span>
          </button>
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

        {/* 1. Blind Full-Screen Tap Mode Overlay */}
        {isBlindTapMode && (
          <div
            onClick={handleTap}
            className="absolute inset-0 z-40 bg-zinc-950/98 flex flex-col items-center justify-between p-6 cursor-pointer select-none animate-fade-in"
          >
            {/* Top Indicator */}
            <div className="w-full flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Hand className="w-4 h-4 animate-bounce" />
                <span>{isAr ? 'نمط النقرة العمياء (المس أي مكان بالشاشة)' : 'Blind Tap Mode Active'}</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsBlindTapMode(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs cursor-pointer shadow-sm"
              >
                {isAr ? 'خروج ✕' : 'Exit ✕'}
              </button>
            </div>

            {/* Giant Center Display */}
            <div className="flex flex-col items-center text-center space-y-4 my-auto">
              <p className="text-xl sm:text-2xl font-bold font-serif text-amber-200/90 max-w-md px-4 leading-relaxed">
                {displayedText}
              </p>
              <div className="text-8xl sm:text-9xl font-mono font-black text-white tracking-wider my-4 drop-shadow-lg">
                {count}
              </div>
              {isTargetMode && (
                <div className="space-y-1">
                  <p className="text-sm font-mono text-emerald-400 font-bold">
                    من أصل {target} ({progressPercent}%)
                  </p>
                  <div className="w-48 bg-zinc-800 h-2 rounded-full overflow-hidden mx-auto border border-zinc-700">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-150"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Hint */}
            <p className="text-xs text-zinc-500 animate-pulse">
              {isAr ? 'اضغط بأي إصبع في أي موضع للتسبيح باللمس' : 'Tap anywhere with any finger to increment'}
            </p>
          </div>
        )}

        {/* 2. Add Custom Dhikr Modal Dialog */}
        {isAddCustomOpen && (
          <div className="absolute inset-0 z-40 bg-zinc-950/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-zinc-900 border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {isAr ? 'صانع الأوراد والأذكار المخصصة' : 'Custom Dhikr Builder'}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      {isAr ? 'أضف ذكرك المفضل وحدد عدد تكراراتك' : 'Create personal or community dhikr'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCustomOpen(false)}
                  className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomDhikr} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'نص الذكر أو الدعاء:' : 'Dhikr / Dua Text:'}
                  </label>
                  <textarea
                    required
                    value={newDhikrText}
                    onChange={(e) => setNewDhikrText(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال: سبحان الله وبحمده عدد خلقه ورضا نفسه وزنة عرشه ومداد كلماته...'
                        : 'Enter dhikr or prayer text...'
                    }
                    className="w-full h-20 px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'العدد المستهدف للتكرار:' : 'Target Count:'}
                  </label>
                  <div className="flex items-center gap-2">
                    {[33, 70, 100, 500, 1000].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNewDhikrTarget(num)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          newDhikrTarget === num
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={newDhikrTarget}
                    onChange={(e) => setNewDhikrTarget(Number(e.target.value) || 100)}
                    className="w-full mt-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white font-mono text-center"
                    placeholder="أو اكتب رقماً مخصصاً..."
                  />
                </div>

                {/* Privacy & Governance Selection */}
                <div className="p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700 space-y-2">
                  <span className="text-[11px] font-bold text-zinc-300 block">
                    {isAr ? 'نطاق المشاركة والخصوصية:' : 'Sharing & Privacy:'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewDhikrIsPublic(false)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        !newDhikrIsPublic
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 mx-auto mb-1" />
                      <span className="text-[10px] font-bold block">
                        {isAr ? '🔒 خاص بي فقط' : 'Private'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewDhikrIsPublic(true)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        newDhikrIsPublic
                          ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 mx-auto mb-1" />
                      <span className="text-[10px] font-bold block">
                        {isAr ? '🌐 اقتراح للنشر العام' : 'Community Proposal'}
                      </span>
                    </button>
                  </div>
                  {newDhikrIsPublic && (
                    <p className="text-[10px] text-amber-400 leading-normal">
                      💡 سيُحفظ الورد لك فوراً، وسيُرفع كطلب مجتمعي للمدير (أحمد) للمراجعة وتعميمه على كافة المستخدمين.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs cursor-pointer shadow-md transition-transform active:scale-95"
                  >
                    {isAr ? '✨ حفظ الورد والبدء' : 'Save & Start'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddCustomOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
