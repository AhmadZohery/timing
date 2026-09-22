import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Save,
  Maximize2,
  Minimize2,
  Zap,
} from 'lucide-react';
import {
  COMBAT_DRILLS,
  ROUND_PRESETS,
  STRIKING_COMBOS,
  type CombatDiscipline,
  type RoundTimerPreset,
  type StrikingCombo,
} from '../../data/sportsData';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { gymFaithAudio } from '../../services/gymFaithAudioService';
import { useTranslation } from '../../i18n/LanguageContext';
import { db } from '../../db/db';

interface CombatSportsModuleProps {
  onRewardToast?: (msg: string) => void;
}

interface CornerCoachCue {
  id: string;
  ar: string;
  en: string;
}

const CORNER_COACH_CUES: CornerCoachCue[] = [
  { id: 'guard_high', ar: '🛡️ يديك فوق.. حصّن فكك!', en: 'Hands high! Protect your chin!' },
  { id: 'cut_angle', ar: '⚡ اقطع الزاوية واخرج بيمينية!', en: 'Cut the angle and exit right!' },
  { id: 'sharp_exhale', ar: '💨 زفير حاد مع اللكمة.. لا تحبس نفسك!', en: 'Sharp exhale on impact!' },
  { id: 'head_slip', ar: '🥊 حرك رأسك.. لا تقف في خط النار!', en: 'Head movement! Slip off-center!' },
  { id: 'check_kick', ar: '🥋 ارفع الركبة وتصدَّ للركلة (Check)!', en: 'Shield the leg! Check that kick!' },
  { id: 'empty_tank', ar: '🔥 فجّر طاقتك.. بقي القليل في الجولة!', en: 'Empty the tank! Push now!' },
];

export const CombatSportsModule: React.FC<CombatSportsModuleProps> = ({
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [discipline, setDiscipline] = useState<CombatDiscipline>('boxing');
  const [selectedPreset, setSelectedPreset] = useState<RoundTimerPreset>(ROUND_PRESETS[0]);

  // Round Timer State
  const [currentRound, setCurrentRound] = useState(1);
  const [isRestPhase, setIsRestPhase] = useState(false);
  const [timeLeft, setTimeLeft] = useState(selectedPreset.roundSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [completedRoundsCount, setCompletedRoundsCount] = useState(0);
  const [gloveSlapMode, setGloveSlapMode] = useState(true);
  const [isFullscreenArena, setIsFullscreenArena] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic Combo Caller with Chaotic Cadence Generator (4s - 11s)
  const [comboCallerEnabled, setComboCallerEnabled] = useState(false);
  const [cadenceMode, setCadenceMode] = useState<'chaotic' | 'fixed'>('chaotic');
  const [activeComboCue, setActiveComboCue] = useState<StrikingCombo | null>(null);
  const chaoticCountdownRef = React.useRef<number>(Math.floor(Math.random() * 8) + 4);

  // Virtual Corner Tactical Coach (Defense, Breath, & Angles)
  const [cornerCoachEnabled, setCornerCoachEnabled] = useState(true);
  const [activeCornerCue, setActiveCornerCue] = useState<CornerCoachCue | null>(null);
  const cornerCountdownRef = React.useRef<number>(12);

  // Drill checklist state
  const [checkedDrills, setCheckedDrills] = useState<Record<string, boolean>>({});

  // Screen Wake Lock API with automatic re-acquisition on visibility change
  useEffect(() => {
    let wakeLockSentinel: any = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isRunning && document.visibilityState === 'visible') {
        try {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        } catch (_) {}
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        requestWakeLock();
      } else if (document.visibilityState !== 'visible' && wakeLockSentinel) {
        try {
          wakeLockSentinel.release();
        } catch (_) {}
        wakeLockSentinel = null;
      }
    };

    if (isRunning) {
      requestWakeLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [isRunning]);

  // Reset timer when preset changes
  const handleSelectPreset = (preset: RoundTimerPreset) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedPreset(preset);
    setIsRunning(false);
    setIsRestPhase(false);
    setCurrentRound(1);
    setTimeLeft(preset.roundSeconds);
  };

  // Timer Interval Effect
  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Round or Rest Phase Completed: Authentic Double-Ding Boxing Bell
            soundSynth.playBoxingBell();
            haptic.vibrateSprintCelebration();
            gymFaithAudio.duckVolume(2500, 0.2);

            if (!isRestPhase) {
              // Work round ended -> start rest phase
              if (currentRound >= selectedPreset.totalRounds) {
                // Whole workout completed!
                setIsRunning(false);
                setCompletedRoundsCount((c) => c + 1);
                if (onRewardToast) {
                  onRewardToast(
                    isAr
                      ? `🏆 أتممت النزال بالكامل (${selectedPreset.totalRounds} جولات)! بطل حقيقي!`
                      : `🏆 Finished all ${selectedPreset.totalRounds} rounds! Warrior!`
                  );
                }
                return 0;
              } else {
                setIsRestPhase(true);
                setCompletedRoundsCount((c) => c + 1);
                return selectedPreset.restSeconds;
              }
            } else {
              // Rest phase ended -> start next round
              setIsRestPhase(false);
              setCurrentRound((r) => r + 1);
              return selectedPreset.roundSeconds;
            }
          }

          // Dynamic Combo Caller: Chaotic Cadence (4-11s unpredictable intervals) or Fixed (10s)
          if (comboCallerEnabled && !isRestPhase && prev > selectedPreset.warningSeconds) {
            let shouldTrigger = false;
            if (cadenceMode === 'chaotic') {
              chaoticCountdownRef.current -= 1;
              if (chaoticCountdownRef.current <= 0) {
                shouldTrigger = true;
                // Next random burst between 4s and 11s
                chaoticCountdownRef.current = Math.floor(Math.random() * (11 - 4 + 1)) + 4;
              }
            } else {
              if (prev % 10 === 0) {
                shouldTrigger = true;
              }
            }

            if (shouldTrigger) {
              const validCombos = STRIKING_COMBOS.filter((c) => c.discipline === discipline);
              if (validCombos.length > 0) {
                const picked = validCombos[Math.floor(Math.random() * validCombos.length)];
                setActiveComboCue(picked);
                haptic.vibrateChronographClick();
              }
            }
          }

          // Virtual Corner Tactical Coach (Defense, Breath, & Angles every 14-20s)
          if (cornerCoachEnabled && !isRestPhase && prev > selectedPreset.warningSeconds) {
            cornerCountdownRef.current -= 1;
            if (cornerCountdownRef.current <= 0) {
              const picked = CORNER_COACH_CUES[Math.floor(Math.random() * CORNER_COACH_CUES.length)];
              setActiveCornerCue(picked);
              haptic.vibrateDouble();
              cornerCountdownRef.current = Math.floor(Math.random() * (22 - 14 + 1)) + 14;
            }
          }

          // 10s warning: Authentic Triple Wooden Clapper ("Clack! Clack! Clack!") + Crimson Strobe
          if (!isRestPhase && prev === selectedPreset.warningSeconds + 1) {
            gymFaithAudio.duckVolume(1800, 0.3);
            soundSynth.playTripleWoodenClapper();
            haptic.vibrateDouble();
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isRestPhase, currentRound, selectedPreset, isAr, onRewardToast, comboCallerEnabled, cadenceMode, discipline, cornerCoachEnabled]);

  const handleToggleRunning = () => {
    if (!isRunning) {
      soundSynth.playBoxingBell();
      haptic.vibrateMedium();
    } else {
      soundSynth.playTactileClick();
      haptic.vibrateLight();
    }
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsRunning(false);
    setIsRestPhase(false);
    setCurrentRound(1);
    setTimeLeft(selectedPreset.roundSeconds);
  };

  const handleSaveCombatSession = async () => {
    if (completedRoundsCount === 0 && !isRestPhase) {
      if (onRewardToast) {
        onRewardToast(isAr ? 'أكمل جولة واحدة على الأقل لحفظ الجلسة!' : 'Complete at least 1 round to log session!');
      }
      return;
    }
    setIsSaving(true);
    try {
      soundSynth.playStreakMilestoneChime();
      haptic.vibrateSprintCelebration();
      const sessionMinutes = Math.max(5, Math.round((completedRoundsCount * selectedPreset.roundSeconds) / 60));
      await db.workout_logs.add({
        id: `combat-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category: 'combat',
        routineType: discipline,
        durationMinutes: sessionMinutes,
        exercises: [
          {
            id: `combat-${Date.now()}`,
            name: isAr
              ? `${discipline === 'boxing' ? 'ملاكمة' : discipline === 'muay_thai' ? 'موي تاي' : 'جيوجيتسو'} (${selectedPreset.nameAr})`
              : `${discipline.toUpperCase()} (${selectedPreset.nameEn})`,
            sets: Array.from({ length: Math.max(1, completedRoundsCount) }).map(() => ({
              reps: selectedPreset.roundSeconds,
              weight: 0,
              done: true,
            })),
          },
        ],
        totalVolume: 0,
        completedSets: completedRoundsCount,
        endorphinRating: 5,
        timestamp: Date.now(),
      });
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `🥊 تم حفظ جلسة القتال (${completedRoundsCount} جولات) في السجل الدائم بنجاح!`
            : `🥊 Combat session (${completedRoundsCount} rounds) saved permanently!`
        );
      }
    } catch (e) {
      console.error('Failed to save combat workout:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDrill = (drillId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setCheckedDrills((prev) => ({ ...prev, [drillId]: !prev[drillId] }));
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentDrills = COMBAT_DRILLS[discipline] || COMBAT_DRILLS.boxing;

  const isCrimsonWarning = isRunning && !isRestPhase && timeLeft <= selectedPreset.warningSeconds;

  return (
    <div className="space-y-4">
      {/* 1. Discipline Selector & Mode Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setDiscipline('boxing');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              discipline === 'boxing'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
            }`}
          >
            <span>🥊</span>
            <span>{isAr ? 'ملاكمة (Boxing)' : 'Boxing'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setDiscipline('muay_thai');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              discipline === 'muay_thai'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
            }`}
          >
            <span>🥋</span>
            <span>{isAr ? 'موي تاي (Muay Thai)' : 'Muay Thai'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setDiscipline('bjj');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              discipline === 'bjj'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
            }`}
          >
            <span>🥋</span>
            <span>{isAr ? 'جيوجيتسو (BJJ)' : 'BJJ'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Combo Caller Toggle */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setComboCallerEnabled(!comboCallerEnabled);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              comboCallerEnabled
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
            title={isAr ? 'مُلقّن الكومبو والضربات التلقائي' : 'Auto Combo Caller'}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{isAr ? 'ملقّن الكومبو' : 'Combos'}</span>
          </button>

          {/* Virtual Corner Coach Toggle */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setCornerCoachEnabled(!cornerCoachEnabled);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              cornerCoachEnabled
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
            title={isAr ? 'مدرب الركن التكتيكي (توجيهات دفاعية وزوايا)' : 'Virtual Corner Coach'}
          >
            <span>🥋</span>
            <span>{isAr ? 'مدرب الركن' : 'Corner'}</span>
          </button>

          {/* Chaotic Cadence Mode Toggle */}
          {comboCallerEnabled && (
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setCadenceMode(cadenceMode === 'chaotic' ? 'fixed' : 'chaotic');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                cadenceMode === 'chaotic'
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
              title={
                isAr
                  ? 'نمط الإيقاع: فوضوي غير متوقع (4-11 ثانية كالحلبة الحقيقية) مقابل إيقاع دوري ثابت (10 ثوانٍ)'
                  : 'Cadence: Chaotic (4-11s reaction) vs Fixed (10s)'
              }
            >
              <span>{cadenceMode === 'chaotic' ? '🎲 إيقاع فوضوي (4-11ث)' : '⏱️ إيقاع ثابت (10ث)'}</span>
            </button>
          )}

          {/* Fullscreen Arena Button */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateChronographClick();
              setIsFullscreenArena(true);
            }}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 cursor-pointer"
            title={isAr ? 'وضع الحلبة بالشاشة الكاملة' : 'Fullscreen Arena Mode'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setGloveSlapMode(!gloveSlapMode);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              gloveSlapMode
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-400/40'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-700'
            }`}
            title={isAr ? 'وضع القفازات: انقر أي مكان في الشاشة للتحكم' : 'Glove Slap Mode: Tap anywhere on screen'}
          >
            <span>🥊</span>
            <span>{isAr ? (gloveSlapMode ? 'القفازات مفعّل' : 'وضع القفازات') : (gloveSlapMode ? 'Glove Slap: ON' : 'Glove Slap: OFF')}</span>
          </button>

          <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
            ⚔️ {completedRoundsCount} {isAr ? 'جولات' : 'Rounds'}
          </span>
        </div>
      </div>

      {/* 2. Pro Round Timer Bento Box (Glove Slap Surface) */}
      <div
        onClick={gloveSlapMode ? handleToggleRunning : undefined}
        className={`relative overflow-hidden p-6 rounded-3xl border text-center transition-all shadow-md ${
          gloveSlapMode ? 'cursor-pointer select-none active:scale-[0.99]' : ''
        } ${
          isCrimsonWarning
            ? 'bg-gradient-to-b from-rose-600/30 via-rose-950/80 to-zinc-950 border-rose-500 ring-4 ring-rose-500/40 animate-pulse text-white'
            : isRestPhase
            ? 'bg-gradient-to-b from-sky-500/10 via-white dark:via-zinc-900 to-white dark:to-zinc-900 border-sky-400/40 dark:border-sky-500/30'
            : isRunning
            ? 'bg-gradient-to-b from-rose-500/10 via-white dark:via-zinc-900 to-white dark:to-zinc-900 border-rose-400/50 dark:border-rose-500/30'
            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
        }`}
      >
        {/* Crimson Strobe Visual Warning Banner */}
        {isCrimsonWarning && (
          <div className="mb-2 py-1 px-3 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-wider animate-bounce inline-block">
            {isAr ? `⚡ وميض التنبيه: آخر ${selectedPreset.warningSeconds} ثوانٍ! فجّر طاقتك!` : `⚡ ${selectedPreset.warningSeconds}S WARNING! EMPTY THE TANK!`}
          </div>
        )}

        {/* Dynamic Combo Cue Call Display */}
        {comboCallerEnabled && activeComboCue && isRunning && !isRestPhase && !isCrimsonWarning && (
          <div className="mb-3 py-1.5 px-4 rounded-2xl bg-amber-500/20 border border-amber-400/60 text-amber-900 dark:text-amber-200 animate-fade-in inline-flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-black font-mono tracking-wide">
              {activeComboCue.cueAr} • {activeComboCue.cueText}
            </span>
          </div>
        )}

        {/* Virtual Corner Tactical Coach Cue Display */}
        {cornerCoachEnabled && activeCornerCue && isRunning && !isRestPhase && !isCrimsonWarning && (
          <div className="mb-3 py-1.5 px-4 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-rose-900 dark:text-rose-200 animate-fade-in inline-flex items-center gap-2">
            <span className="text-xs font-black font-sans tracking-wide">
              📢 {isAr ? activeCornerCue.ar : activeCornerCue.en}
            </span>
          </div>
        )}

        {/* Top Status & Round Number */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isRestPhase
                ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300/40'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300/40'
            }`}
          >
            {isRestPhase
              ? isAr
                ? '⏱️ استراحة واستشفاء (Rest)'
                : '⏱️ Rest Interval'
              : isAr
              ? '🔥 جولة نزال وقتال (Fight!)'
              : '🔥 Round Fight!'}
          </span>

          <span className="font-mono text-xs sm:text-sm font-black text-slate-800 dark:text-zinc-200">
            {isAr ? `الجولة ${currentRound} / ${selectedPreset.totalRounds}` : `Round ${currentRound} of ${selectedPreset.totalRounds}`}
          </span>
        </div>

        {/* Big Giant Timer Digits */}
        <div className="my-4">
          <span
            className={`text-5xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight select-none ${
              isCrimsonWarning
                ? 'text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]'
                : isRestPhase
                ? 'text-sky-600 dark:text-sky-400'
                : isRunning
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatSeconds(timeLeft)}
          </span>
          {gloveSlapMode && (
            <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mt-2">
              {isAr ? '👆 المس البطاقة بيدك أو بقفازك للإيقاف أو المتابعة' : '👆 Tap card anywhere with gloves to pause/resume'}
            </p>
          )}
        </div>

        {/* Big Large Gym Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleRunning();
            }}
            className={`px-8 py-3.5 rounded-2xl text-sm sm:text-base font-black flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'ابدأ الجولة 🥊' : 'Start Round 🥊')}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResetTimer();
            }}
            className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
            title={isAr ? 'إعادة ضبط المؤقت' : 'Reset Timer'}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Save Completed Rounds Session Button */}
        {completedRoundsCount > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveCombatSession();
              }}
              disabled={isSaving}
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSaving
                  ? isAr ? 'جاري الحفظ...' : 'Saving...'
                  : isAr
                  ? `حفظ الجلسة (${completedRoundsCount} جولات) في السجل الدائم`
                  : `Save Session (${completedRoundsCount} Rounds) to Log`}
              </span>
            </button>
          </div>
        )}

        {/* Preset Switcher Pills */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none justify-start sm:justify-center">
          {ROUND_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPreset(p);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all shrink-0 cursor-pointer ${
                selectedPreset.id === p.id
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              {isAr ? p.nameAr : p.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Technique Combinations & Drills Checklist */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {isAr ? `تتابعات وتمارين ${discipline === 'boxing' ? 'الملاكمة' : discipline === 'muay_thai' ? 'الموي تاي' : 'الجيوجيتسو'}` : 'Technique & Drills'}
            </h4>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
            {Object.values(checkedDrills).filter(Boolean).length} / {currentDrills.length} {isAr ? 'مكتمل' : 'Done'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentDrills.map((drill) => {
            const isDone = !!checkedDrills[drill.id];
            return (
              <div
                key={drill.id}
                onClick={() => handleToggleDrill(drill.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  isDone
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:border-rose-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 dark:border-zinc-700'
                  }`}
                >
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">{drill.nameAr}</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                    {drill.descriptionAr}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Fullscreen Combat Arena Mode (High Visibility for Gym / Ring floor) */}
      {isFullscreenArena && (
        <div
          onClick={gloveSlapMode ? handleToggleRunning : undefined}
          className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 select-none backdrop-blur-md transition-colors ${
            isCrimsonWarning
              ? 'bg-gradient-to-b from-rose-950 via-black to-rose-950 border-8 border-rose-600 animate-pulse text-white'
              : isRestPhase
              ? 'bg-gradient-to-b from-sky-950/95 via-black to-sky-950/95 text-white'
              : 'bg-black text-white'
          }`}
        >
          {/* Arena Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {discipline === 'boxing' ? '🥊' : discipline === 'muay_thai' ? '🥋' : '🥋'}
              </span>
              <div>
                <span className="text-sm sm:text-base font-black uppercase tracking-wider block text-rose-400">
                  {selectedPreset.nameAr}
                </span>
                <span className="text-xs sm:text-sm font-mono text-zinc-400 font-bold">
                  {isAr ? `الجولة ${currentRound} من ${selectedPreset.totalRounds}` : `Round ${currentRound} of ${selectedPreset.totalRounds}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsFullscreenArena(false);
                }}
                className="p-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-white border border-zinc-700 cursor-pointer shadow-lg"
                title={isAr ? 'تصغير الشاشة' : 'Exit Fullscreen'}
              >
                <Minimize2 className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Arena Center: Giant Readable Digits */}
          <div className="text-center my-auto space-y-4">
            {isCrimsonWarning && (
              <div className="py-2 px-6 rounded-full bg-rose-600 text-white text-base sm:text-xl font-black uppercase tracking-wider animate-bounce inline-block">
                {isAr ? `⚡ وميض الحلبة: آخر ${selectedPreset.warningSeconds} ثوانٍ! فجّر طاقتك!` : `⚡ ${selectedPreset.warningSeconds}S FINAL BURST!`}
              </div>
            )}

            {comboCallerEnabled && activeComboCue && isRunning && !isRestPhase && !isCrimsonWarning && (
              <div className="py-2.5 px-6 rounded-2xl bg-amber-500 text-black font-black text-lg sm:text-2xl font-mono inline-block shadow-lg animate-in zoom-in-95">
                ⚡ {activeComboCue.cueAr} • {activeComboCue.cueText}
                {cadenceMode === 'chaotic' && (
                  <span className="ms-2 px-2 py-0.5 rounded-lg bg-black/20 text-xs font-sans font-bold">
                    {isAr ? 'فوضوي 🎲' : 'Chaotic 🎲'}
                  </span>
                )}
              </div>
            )}

            {cornerCoachEnabled && activeCornerCue && isRunning && !isRestPhase && !isCrimsonWarning && (
              <div className="py-2.5 px-6 rounded-2xl bg-rose-600 text-white font-black text-lg sm:text-2xl font-sans inline-block shadow-lg animate-in zoom-in-95 mt-2">
                📢 {isAr ? activeCornerCue.ar : activeCornerCue.en}
              </div>
            )}

            <div>
              <span
                className={`text-8xl sm:text-[12rem] md:text-[16rem] font-mono font-black tracking-tight leading-none ${
                  isCrimsonWarning
                    ? 'text-rose-400 drop-shadow-[0_0_40px_rgba(244,63,94,0.9)]'
                    : isRestPhase
                    ? 'text-sky-400'
                    : 'text-white'
                }`}
              >
                {formatSeconds(timeLeft)}
              </span>
            </div>

            <div className="text-xs sm:text-sm font-bold text-zinc-400">
              {isRestPhase
                ? isAr ? '⏱️ استراحة واستشفاء وتنفس عميق' : '⏱️ Rest & Deep Breathing'
                : isAr ? '🔥 قتال ونزال مستمر!' : '🔥 Fight & Movement!'}
              {gloveSlapMode && (
                <span className="block mt-1 text-amber-400">
                  {isAr ? '👆 المس أي مكان بقفازك للتحكم الفوري' : '👆 Tap anywhere with glove to toggle'}
                </span>
              )}
            </div>
          </div>

          {/* Arena Bottom Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleRunning();
              }}
              className={`px-12 py-5 rounded-3xl text-lg sm:text-xl font-black flex items-center gap-3 shadow-2xl transition-all active:scale-95 cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-black'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current" />}
              <span>{isRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'ابدأ القتال 🥊' : 'Fight! 🥊')}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleResetTimer();
              }}
              className="p-5 rounded-3xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 cursor-pointer shadow-lg"
              title={isAr ? 'إعادة ضبط' : 'Reset'}
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
