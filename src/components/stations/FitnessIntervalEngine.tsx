import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Save,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { gymFaithAudio } from '../../services/gymFaithAudioService';
import { useTranslation } from '../../i18n/LanguageContext';
import { db } from '../../db/db';

type IntervalProtocol = 'tabata' | 'emom' | 'amrap' | 'norwegian_4x4';

interface FitnessIntervalEngineProps {
  onRewardToast?: (msg: string) => void;
}

export const FitnessIntervalEngine: React.FC<FitnessIntervalEngineProps> = ({
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [protocol, setProtocol] = useState<IntervalProtocol>('tabata');
  const [isRunning, setIsRunning] = useState(false);

  // Tabata State (8 rounds: 20s work, 10s rest)
  const [tabataRound, setTabataRound] = useState(1);
  const [isTabataRest, setIsTabataRest] = useState(false);
  const [tabataTimeLeft, setTabataTimeLeft] = useState(20);

  // EMOM State (Every Minute On the Minute)
  const [emomTotalMinutes] = useState(12);
  const [emomCurrentMinute, setEmomCurrentMinute] = useState(1);
  const [emomSecondsLeft, setEmomSecondsLeft] = useState(60);

  // AMRAP State (As Many Rounds As Possible)
  const [amrapTotalMinutes] = useState(15);
  const [amrapTimeLeft, setAmrapTimeLeft] = useState(15 * 60);
  const [amrapRoundsCompleted, setAmrapRoundsCompleted] = useState(0);

  // Norwegian 4x4 VO2 Max Protocol (4 rounds: 4m work @ 90-95% HR, 3m active recovery @ 70% HR)
  const [norwegianRound, setNorwegianRound] = useState(1);
  const [isNorwegianRest, setIsNorwegianRest] = useState(false);
  const [norwegianTimeLeft, setNorwegianTimeLeft] = useState(240); // 4 minutes

  // 60-second Heart Rate Recovery (HRR) Drop Test
  const [_isHrrTestOpen, setIsHrrTestOpen] = useState(false);
  const [hrrSecondsLeft, setHrrSecondsLeft] = useState(60);
  const [isHrrRunning, setIsHrrRunning] = useState(false);
  const [peakHr, setPeakHr] = useState(165);
  const [recoveryHr, setRecoveryHr] = useState(135);
  const [_hrrTested, setHrrTested] = useState(false);

  // Athlete Age & Tanaka Formula HR Max: 208 - (0.7 * age)
  const [userAge] = useState(() => Number(localStorage.getItem('midmar_athlete_age') || '28'));
  const tanakaMaxHr = Math.round(208 - 0.7 * userAge);
  const norwegianWorkTargetMin = Math.round(tanakaMaxHr * 0.90);
  const norwegianWorkTargetMax = Math.round(tanakaMaxHr * 0.95);
  const norwegianRecoveryTarget = Math.round(tanakaMaxHr * 0.70);

  // Physiological Sigh (Double Inhale, Long Exhale) State
  const [isPhysioSighOpen, setIsPhysioSighOpen] = useState(false);
  const [physioSighPhase, setPhysioSighPhase] = useState<'inhale1' | 'inhale2' | 'exhale'>('inhale1');
  const [physioSighRoundsLeft, setPhysioSighRoundsLeft] = useState(5);

  // Dexie Saving State
  const [isSaving, setIsSaving] = useState(false);

  // Screen Wake Lock API
  useEffect(() => {
    let wakeLockSentinel: any = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isRunning) {
        try {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        } catch (_) {}
      }
    };
    if (isRunning) {
      requestWakeLock();
    }
    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [isRunning]);

  // Tabata Timer Effect
  useEffect(() => {
    let interval: any = null;

    if (isRunning && protocol === 'tabata') {
      interval = setInterval(() => {
        setTabataTimeLeft((prev) => {
          // 3-2-1 Countdown Beeps
          if (prev <= 4 && prev > 1) {
            soundSynth.playIntervalBeep(false);
            haptic.vibrateLight();
          }

          if (prev <= 1) {
            // Round/Phase Transition: High Beep + Audio ducking
            soundSynth.playIntervalBeep(true);
            haptic.vibrateMedium();
            gymFaithAudio.duckVolume(1800, 0.25);

            if (!isTabataRest) {
              // Work ended -> Rest phase
              if (tabataRound >= 8) {
                // Tabata Completed!
                setIsRunning(false);
                soundSynth.playStreakMilestoneChime();
                haptic.vibrateSprintCelebration();
                if (onRewardToast) {
                  onRewardToast(
                    isAr
                      ? '🏆 أتممت بروتوكول تاباتا الخارق (8 جولات متفجرة)! حرق دهون استثنائي!'
                      : '🏆 Tabata completed (8 intense rounds)! Peak burn!'
                  );
                }
                return 0;
              }
              setIsTabataRest(true);
              return 10;
            } else {
              // Rest ended -> Next Work round
              setIsTabataRest(false);
              setTabataRound((r) => r + 1);
              return 20;
            }
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, protocol, tabataRound, isTabataRest, isAr, onRewardToast]);

  // EMOM Timer Effect
  useEffect(() => {
    let interval: any = null;

    if (isRunning && protocol === 'emom') {
      interval = setInterval(() => {
        setEmomSecondsLeft((prev) => {
          // 3-2-1 Countdown Beeps at end of minute
          if (prev <= 4 && prev > 1) {
            soundSynth.playIntervalBeep(false);
            haptic.vibrateLight();
          }

          if (prev <= 1) {
            // Minute transition: High Beep
            soundSynth.playIntervalBeep(true);
            haptic.vibrateMedium();
            gymFaithAudio.duckVolume(1800, 0.25);

            if (emomCurrentMinute >= emomTotalMinutes) {
              // EMOM Completed!
              setIsRunning(false);
              soundSynth.playStreakMilestoneChime();
              haptic.vibrateSprintCelebration();
              if (onRewardToast) {
                onRewardToast(
                  isAr
                    ? `🏆 أتممت نظام EMOM بالكامل (${emomTotalMinutes} دقيقة على رأس كل دقيقة)!`
                    : `🏆 EMOM completed (${emomTotalMinutes} mins)! Iron discipline!`
                );
              }
              return 0;
            }

            setEmomCurrentMinute((m) => m + 1);
            return 60;
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, protocol, emomCurrentMinute, emomTotalMinutes, isAr, onRewardToast]);

  // AMRAP Timer Effect
  useEffect(() => {
    let interval: any = null;

    if (isRunning && protocol === 'amrap') {
      interval = setInterval(() => {
        setAmrapTimeLeft((prev) => {
          if (prev <= 4 && prev > 1) {
            soundSynth.playIntervalBeep(false);
            haptic.vibrateLight();
          }

          if (prev <= 1) {
            setIsRunning(false);
            soundSynth.playStreakMilestoneChime();
            haptic.vibrateSprintCelebration();
            if (onRewardToast) {
              onRewardToast(
                isAr
                  ? `🏆 انتهى وقت AMRAP! أتممت ${amrapRoundsCompleted} جولة قتالية بنجاح!`
                  : `🏆 AMRAP finished! You completed ${amrapRoundsCompleted} rounds!`
              );
            }
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, protocol, amrapRoundsCompleted, isAr, onRewardToast]);

  // Norwegian 4x4 Timer Effect (4 rounds: 4m work @ 90-95% HR, 3m active recovery @ 70% HR)
  useEffect(() => {
    let interval: any = null;

    if (isRunning && protocol === 'norwegian_4x4') {
      interval = setInterval(() => {
        setNorwegianTimeLeft((prev) => {
          if (prev <= 4 && prev > 1) {
            soundSynth.playIntervalBeep(false);
            haptic.vibrateLight();
          }

          if (prev <= 1) {
            soundSynth.playIntervalBeep(true);
            haptic.vibrateSprintCelebration();
            gymFaithAudio.duckVolume(2000, 0.25);

            if (!isNorwegianRest) {
              if (norwegianRound >= 4) {
                setIsRunning(false);
                soundSynth.playStreakMilestoneChime();
                haptic.vibrateSprintCelebration();
                if (onRewardToast) {
                  onRewardToast(
                    isAr
                      ? '🏆 أتممت بروتوكول 4×4 النرويجي لرفع كفاءة VO2 Max بنجاح! جاهز لاختبار استعادة النبض HRR!'
                      : '🏆 Norwegian 4x4 VO2 Max completed! Ready for 60s HRR Drop Test!'
                  );
                }
                setIsHrrTestOpen(true);
                return 0;
              }
              setIsNorwegianRest(true);
              return 180; // 3m active recovery
            } else {
              setIsNorwegianRest(false);
              setNorwegianRound((r) => r + 1);
              return 240; // 4m work interval
            }
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, protocol, norwegianRound, isNorwegianRest, isAr, onRewardToast]);

  // 60-Second HRR Drop Test Timer Effect
  useEffect(() => {
    let timer: any = null;
    if (isHrrRunning && hrrSecondsLeft > 0) {
      timer = setInterval(() => {
        setHrrSecondsLeft((s) => {
          if (s <= 1) {
            setIsHrrRunning(false);
            setHrrTested(true);
            soundSynth.playStreakMilestoneChime();
            haptic.vibrateVaultLock();
            return 0;
          }
          if (s % 2 === 0) {
            haptic.vibrateHeartbeatPulse();
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isHrrRunning, hrrSecondsLeft]);

  // Physiological Sigh Breathing Cycle Effect (2s Inhale 1 -> 1.2s Inhale 2 -> 5s Long Exhale x 5 cycles)
  useEffect(() => {
    let timer: any = null;
    if (isPhysioSighOpen && physioSighRoundsLeft > 0) {
      if (physioSighPhase === 'inhale1') {
        timer = setTimeout(() => {
          setPhysioSighPhase('inhale2');
          haptic.vibrateLight();
        }, 2000);
      } else if (physioSighPhase === 'inhale2') {
        timer = setTimeout(() => {
          setPhysioSighPhase('exhale');
          haptic.vibrateMedium();
        }, 1200);
      } else if (physioSighPhase === 'exhale') {
        timer = setTimeout(() => {
          if (physioSighRoundsLeft - 1 <= 0) {
            setIsPhysioSighOpen(false);
            soundSynth.playSolfeggioChime();
            haptic.vibrateVaultLock();
            if (onRewardToast) {
              onRewardToast(
                isAr
                  ? '🌿 اكتملت دورة التنهيدة الفسيولوجية! هدأ نبض القلب واستقر الجهاز العصبي الباراسمبثاوي.'
                  : '🌿 Physiological sigh completed! Heart rate calmed & vagal tone restored.'
              );
            }
          } else {
            setPhysioSighRoundsLeft((r) => r - 1);
            setPhysioSighPhase('inhale1');
            haptic.vibrateLight();
          }
        }, 5000);
      }
    }
    return () => clearTimeout(timer);
  }, [isPhysioSighOpen, physioSighPhase, physioSighRoundsLeft, onRewardToast, isAr]);

  const handleToggleRunning = () => {
    if (!isRunning) {
      soundSynth.playIntervalBeep(true);
      haptic.vibrateMedium();
    } else {
      soundSynth.playTactileClick();
      haptic.vibrateLight();
    }
    setIsRunning(!isRunning);
  };

  const handleResetProtocol = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsRunning(false);

    if (protocol === 'tabata') {
      setTabataRound(1);
      setIsTabataRest(false);
      setTabataTimeLeft(20);
    } else if (protocol === 'emom') {
      setEmomCurrentMinute(1);
      setEmomSecondsLeft(60);
    } else if (protocol === 'amrap') {
      setAmrapTimeLeft(amrapTotalMinutes * 60);
      setAmrapRoundsCompleted(0);
    } else if (protocol === 'norwegian_4x4') {
      setNorwegianRound(1);
      setIsNorwegianRest(false);
      setNorwegianTimeLeft(240);
    }
  };

  const handleSwitchProtocol = (p: IntervalProtocol) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsRunning(false);
    setProtocol(p);

    if (p === 'tabata') {
      setTabataRound(1);
      setIsTabataRest(false);
      setTabataTimeLeft(20);
    } else if (p === 'emom') {
      setEmomCurrentMinute(1);
      setEmomSecondsLeft(60);
    } else if (p === 'amrap') {
      setAmrapTimeLeft(amrapTotalMinutes * 60);
      setAmrapRoundsCompleted(0);
    } else if (p === 'norwegian_4x4') {
      setNorwegianRound(1);
      setIsNorwegianRest(false);
      setNorwegianTimeLeft(240);
    }
  };

  const handleSaveFitnessSession = async () => {
    setIsSaving(true);
    try {
      soundSynth.playStreakMilestoneChime();
      haptic.vibrateSprintCelebration();

      let duration = 15;
      let sessionName = 'HIIT Circuit';
      let setsCount = 1;

      if (protocol === 'tabata') {
        duration = 4;
        sessionName = isAr ? 'بروتوكول تاباتا (Tabata HIIT)' : 'Tabata HIIT Protocol';
        setsCount = tabataRound;
      } else if (protocol === 'emom') {
        duration = emomTotalMinutes;
        sessionName = isAr ? `نظام EMOM (${emomTotalMinutes} دقيقة)` : `EMOM (${emomTotalMinutes} mins)`;
        setsCount = emomCurrentMinute;
      } else if (protocol === 'amrap') {
        duration = amrapTotalMinutes;
        sessionName = isAr ? `نظام AMRAP (${amrapRoundsCompleted} جولة)` : `AMRAP (${amrapRoundsCompleted} rounds)`;
        setsCount = amrapRoundsCompleted;
      } else if (protocol === 'norwegian_4x4') {
        duration = 28;
        sessionName = isAr ? 'بروتوكول 4×4 النرويجي (VO2 Max)' : 'Norwegian 4x4 VO2 Max';
        setsCount = norwegianRound;
      }

      await db.workout_logs.add({
        id: `fitness-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category: 'fitness_class',
        routineType: protocol,
        durationMinutes: duration,
        exercises: [
          {
            id: `hiit-${Date.now()}`,
            name: sessionName,
            sets: Array.from({ length: Math.max(1, setsCount) }).map(() => ({
              reps: protocol === 'tabata' ? 20 : 60,
              weight: 0,
              done: true,
            })),
          },
        ],
        totalVolume: 0,
        completedSets: setsCount,
        endorphinRating: 5,
        timestamp: Date.now(),
      });

      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `⏱️ تم حفظ كلاس الفيتنس (${sessionName}) في السجل الدائم بنجاح!`
            : `⏱️ Fitness class (${sessionName}) saved permanently!`
        );
      }
    } catch (e) {
      console.error('Failed to save fitness session:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* 1. Protocol Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => handleSwitchProtocol('tabata')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
            protocol === 'tabata'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span>🔥</span>
          <span>{isAr ? 'تاباتا (Tabata)' : 'Tabata'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchProtocol('emom')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
            protocol === 'emom'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span>⏱️</span>
          <span>{isAr ? 'إيموم (EMOM)' : 'EMOM'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchProtocol('amrap')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
            protocol === 'amrap'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span>⚡</span>
          <span>{isAr ? 'أمراب (AMRAP)' : 'AMRAP'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchProtocol('norwegian_4x4')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
            protocol === 'norwegian_4x4'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span>🫀</span>
          <span>{isAr ? 'نرويجي 4×4' : 'Norwegian 4x4'}</span>
        </button>
      </div>

      {/* 2. Interactive Timer Hero Card */}
      <div
        className={`p-6 rounded-3xl border text-center transition-all shadow-md relative overflow-hidden ${
          protocol === 'tabata'
            ? isTabataRest
              ? 'bg-gradient-to-b from-sky-500/15 via-white dark:via-zinc-900 to-white dark:to-zinc-900 border-sky-400/40 dark:border-sky-500/30'
              : 'bg-gradient-to-b from-amber-500/15 via-white dark:via-zinc-900 to-white dark:to-zinc-900 border-amber-400/40 dark:border-amber-500/30'
            : protocol === 'emom'
            ? 'bg-gradient-to-b from-sky-500/15 via-white dark:via-zinc-900 to-white dark:to-zinc-900 border-sky-400/40 dark:border-sky-500/30'
            : protocol === 'norwegian_4x4'
            ? isNorwegianRest
              ? 'bg-gradient-to-b from-sky-500/15 via-white dark:via-zinc-900 to-white dark:to-zinc-900 border-sky-400/40 dark:border-sky-500/30'
              : 'bg-gradient-to-b from-rose-500/15 via-white dark:via-zinc-900 to-white dark:to-zinc-900 border-rose-400/40 dark:border-rose-500/30'
            : 'bg-gradient-to-b from-emerald-500/15 via-white dark:via-zinc-900 to-white dark:to-zinc-900 border-emerald-400/40 dark:border-emerald-500/30'
        }`}
      >
        {/* Protocol Header Info */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              protocol === 'tabata'
                ? isTabataRest
                  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                : protocol === 'emom'
                ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                : protocol === 'norwegian_4x4'
                ? isNorwegianRest
                  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {protocol === 'tabata'
              ? isTabataRest
                ? isAr ? '⏱️ استراحة (10 ثوانٍ)' : '⏱️ Rest (10s)'
                : isAr ? '🔥 انطلاق وتفجير (20 ثانية)' : '🔥 Work Work (20s)'
              : protocol === 'emom'
              ? isAr ? `دقيقة ${emomCurrentMinute} / ${emomTotalMinutes}` : `Minute ${emomCurrentMinute} of ${emomTotalMinutes}`
              : protocol === 'norwegian_4x4'
              ? isNorwegianRest
                ? isAr ? '⏱️ استشفاء نشط (3 دقائق @ 70% HR)' : '⏱️ Active Recovery (3m @ 70% HR)'
                : isAr ? '🔥 ذروة الشدة (4 دقائق @ 90-95% HR)' : '🔥 VO2 Max Peak (4m @ 90-95% HR)'
              : isAr ? `أقصى تكرار في ${amrapTotalMinutes} دقيقة` : `Max Rounds in ${amrapTotalMinutes}m`}
          </span>

          {protocol === 'tabata' && (
            <span className="font-mono text-sm font-black text-slate-800 dark:text-zinc-200">
              {isAr ? `جولة ${tabataRound} / 8` : `Round ${tabataRound} / 8`}
            </span>
          )}

          {protocol === 'norwegian_4x4' && (
            <span className="font-mono text-sm font-black text-rose-600 dark:text-rose-400">
              {isAr ? `جولة ${norwegianRound} / 4` : `Round ${norwegianRound} / 4`}
            </span>
          )}

          {protocol === 'amrap' && (
            <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
              ⚔️ {amrapRoundsCompleted} {isAr ? 'جولات منجزة' : 'Rounds'}
            </span>
          )}
        </div>

        {/* Big Giant Counter Digits */}
        <div className="my-4">
          <span
            className={`text-6xl sm:text-8xl font-black font-mono tracking-tight select-none tabular-nums ${
              protocol === 'tabata'
                ? isTabataRest
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-amber-600 dark:text-amber-400'
                : protocol === 'emom'
                ? 'text-sky-600 dark:text-sky-400'
                : protocol === 'norwegian_4x4'
                ? isNorwegianRest
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {protocol === 'tabata'
              ? formatSeconds(tabataTimeLeft)
              : protocol === 'emom'
              ? formatSeconds(emomSecondsLeft)
              : protocol === 'norwegian_4x4'
              ? formatSeconds(norwegianTimeLeft)
              : formatSeconds(amrapTimeLeft)}
          </span>
        </div>

        {/* Tanaka Formula Target Zone for Norwegian 4x4 */}
        {protocol === 'norwegian_4x4' && (
          <div className="p-3 mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 max-w-sm mx-auto text-xs space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-700 dark:text-zinc-300">
                {isAr ? 'نطاق النبض المستهدف (معادلة تاناكا):' : 'Tanaka Target HR Zone:'}
              </span>
              <span className="font-mono text-rose-600 dark:text-rose-400 font-black">
                {norwegianWorkTargetMin} - {norwegianWorkTargetMax} bpm
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
              <span>{isAr ? 'النبض الأقصى المقدر:' : 'Est. Max HR:'} <strong className="font-mono">{tanakaMaxHr} bpm</strong></span>
              <span>{isAr ? 'نبض الاستشفاء (70%):' : 'Recovery 70%:'} <strong className="font-mono text-sky-600 dark:text-sky-400">{norwegianRecoveryTarget} bpm</strong></span>
            </div>
          </div>
        )}

        {/* AMRAP Round Incrementer Button */}
        {protocol === 'amrap' && (
          <div className="mb-4 flex justify-center">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setAmrapRoundsCompleted((r) => r + 1);
              }}
              className="py-2.5 px-6 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'أتممت جولة كاملة (+1)' : 'Completed 1 Round (+1)'}</span>
            </button>
          </div>
        )}

        {/* Big Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleToggleRunning}
            className={`px-8 py-3.5 rounded-2xl text-sm sm:text-base font-black flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                : protocol === 'tabata'
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                : protocol === 'emom'
                ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/30'
                : protocol === 'norwegian_4x4'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'ابدأ التمرين ⏱️' : 'Start Interval ⏱️')}</span>
          </button>

          <button
            type="button"
            onClick={handleResetProtocol}
            className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
            title={isAr ? 'إعادة ضبط' : 'Reset'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Save Session to Dexie */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-center">
          <button
            type="button"
            onClick={handleSaveFitnessSession}
            disabled={isSaving}
            className="py-2 px-5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-2 shadow-xs hover:opacity-90 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? isAr ? 'جاري الحفظ...' : 'Saving...'
                : isAr ? 'حفظ جلسة الكلاس في السجل الدائم' : 'Save Session to Log'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. 60-Second Heart Rate Recovery (HRR) Drop Test Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-white dark:via-zinc-900 to-rose-500/10 border border-rose-500/30 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🫀</span>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-zinc-100">
                {isAr ? 'اختبار استعادة النبض القلبي (60s HRR Drop Test)' : '60-Second Heart Rate Recovery Test'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'مقياس إكلينيكي ذهبي لقوة العصب الحائر (Vagal Tone) وسرعة استشفاء القلب بعد المجهود الأقصى.'
                  : 'Clinical gold-standard for vagal tone and post-exercise cardiovascular recovery.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateMedium();
                setIsPhysioSighOpen(true);
                setPhysioSighRoundsLeft(5);
                setPhysioSighPhase('inhale1');
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold text-xs border border-teal-300 dark:border-teal-700/60 flex items-center gap-1.5 hover:bg-teal-100 cursor-pointer"
              title={isAr ? 'بروتوكول د. أندرو هوبرمان لتنشيط العصب الحائر وخفض النبض فورياً' : 'Physiological Sigh vagal reset'}
            >
              <span>🌿</span>
              <span>{isAr ? 'تنهيدة فسيولوجية' : 'Physio Sigh'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setIsHrrRunning(!isHrrRunning);
                if (!isHrrRunning && hrrSecondsLeft === 0) setHrrSecondsLeft(60);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                isHrrRunning ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white shadow-xs'
              }`}
            >
              {isHrrRunning ? (isAr ? 'إيقاف' : 'Pause') : (isAr ? 'بدء مؤقت 60ث ⏱️' : 'Start 60s ⏱️')}
            </button>
          </div>
        </div>

        {/* Timer and Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-2">
          <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <span className="text-[10px] text-slate-400 block font-mono">مؤقت الاستشفاء</span>
            <span className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
              {hrrSecondsLeft}s
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block">
              {isAr ? 'النبض عند نهاية التمرين (Peak HR):' : 'Peak HR (bpm):'}
            </label>
            <input
              type="number"
              value={peakHr}
              onChange={(e) => setPeakHr(Number(e.target.value))}
              className="w-full py-1 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono font-bold text-sm text-center"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block">
              {isAr ? 'النبض بعد دقيقة راحة (Recovery HR):' : '1-Min Recovery HR:'}
            </label>
            <input
              type="number"
              value={recoveryHr}
              onChange={(e) => setRecoveryHr(Number(e.target.value))}
              className="w-full py-1 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono font-bold text-sm text-center"
            />
          </div>
        </div>

        {/* Calculated HRR Drop Result */}
        {peakHr > recoveryHr && (
          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                {isAr ? 'معدل انخفاض النبض (HRR Drop):' : 'HRR Drop:'}
              </span>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                -{peakHr - recoveryHr} bpm
              </span>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                peakHr - recoveryHr >= 25
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                  : peakHr - recoveryHr >= 15
                  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300'
              }`}
            >
              {peakHr - recoveryHr >= 25
                ? isAr ? '🟢 استشفاء ممتاز (Vagal Tone فائق)' : '🟢 Excellent Recovery'
                : peakHr - recoveryHr >= 15
                ? isAr ? '🔵 استشفاء طبيعي وجيد' : '🔵 Normal & Healthy'
                : isAr ? '🔴 استشفاء بطيء (إجهاد عصبي أو قلة نوم)' : '🔴 Slow Recovery (Fatigue)'}
            </span>
          </div>
        )}
      </div>

      {/* Physiological Sigh (Double Inhale, Long Exhale) Guidance Overlay */}
      {isPhysioSighOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-teal-500/30 text-center text-white space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono">
                {isAr ? 'بروتوكول التهدئة العصبية الفورية' : 'Neuro Vagal Reset'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {5 - physioSighRoundsLeft + 1} / 5 {isAr ? 'دورات' : 'Cycles'}
              </span>
            </div>

            {/* Breathing Ring Animation */}
            <div className="py-6 flex items-center justify-center">
              <div
                className={`rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 ${
                  physioSighPhase === 'inhale1'
                    ? 'w-44 h-44 border-teal-400 bg-teal-500/20 scale-100'
                    : physioSighPhase === 'inhale2'
                    ? 'w-52 h-52 border-emerald-400 bg-emerald-500/30 scale-110 shadow-[0_0_40px_rgba(16,185,129,0.4)]'
                    : 'w-32 h-32 border-sky-400 bg-sky-500/10 scale-90'
                }`}
              >
                <span className="text-3xl mb-1">
                  {physioSighPhase === 'inhale1' ? '👃' : physioSighPhase === 'inhale2' ? '🫁' : '💨'}
                </span>
                <span className="text-sm font-black text-white">
                  {physioSighPhase === 'inhale1'
                    ? isAr ? 'شهيق أول عميق' : 'Inhale 1 (Nose)'
                    : physioSighPhase === 'inhale2'
                    ? isAr ? 'شهيق ثانٍ مكمل' : 'Inhale 2 (Fill Lungs)'
                    : isAr ? 'زفير طويل ممتد' : 'Long Slow Exhale'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? 'شهيقان متتاليان بالأنف ثم زفير ممتد بالفم يفرغان ثاني أكسيد الكربون وينشطان العصب الحائر لتهدئة القلب فورياً.'
                : 'Two quick inhales followed by a prolonged slow exhale reset your autonomic nervous system.'}
            </p>

            <button
              type="button"
              onClick={() => setIsPhysioSighOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
            >
              {isAr ? 'إغلاق والعودة' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
