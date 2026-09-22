import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  CheckCircle,
  Zap,
  Flame,
  ArrowLeft,
  ArrowRight,
  Heart,
  Plus,
  Trash2,
  Timer,
  RotateCcw,
  Smile,
  Star,
  Calculator,
  Copy,
  ShieldAlert,
} from 'lucide-react';
import type { WorkoutExercise, WorkoutSet, UserState } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { resolveStationMetadata, PERSONA_CONFIGS } from '../../utils/lifestyleEngine';
import { CombatSportsModule } from './CombatSportsModule';
import { TeamSportsModule } from './TeamSportsModule';
import { FitnessIntervalEngine } from './FitnessIntervalEngine';
import { WarmupPyramidModal } from './WarmupPyramidModal';
import { db } from '../../db/db';
import { gymFaithAudio } from '../../services/gymFaithAudioService';

export type MovementCategory =
  | 'gym'
  | 'combat'
  | 'football'
  | 'fitness_class'
  | 'home'
  | 'walk'
  | 'mobility';

interface GymAnchorViewProps {
  isSurvivalMode: boolean;
  isCompleted: boolean;
  onCompleteStation: () => void;
  onNextStation: () => void;
  userState?: UserState;
  onRewardToast?: (msg: string) => void;
}

type RoutineType = 'push' | 'pull' | 'legs' | 'cardio' | 'survival';

export const GymAnchorView: React.FC<GymAnchorViewProps> = ({
  isSurvivalMode,
  isCompleted,
  onCompleteStation,
  onNextStation,
  userState,
  onRewardToast,
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  // Dynamic persona & station metadata
  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const persona = PERSONA_CONFIGS[personaId] || PERSONA_CONFIGS.builder_exec;
  const stationMeta = resolveStationMetadata(
    'GYM_ANCHOR',
    personaId,
    userState?.settings?.stationCustomOverrides,
    isAr
  );

  const [movementCategory, setMovementCategory] = useState<MovementCategory>(() => {
    return (localStorage.getItem('midmar_movement_cat') as MovementCategory) || 'gym';
  });

  const handleSelectMovementCat = (cat: MovementCategory) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setMovementCategory(cat);
    localStorage.setItem('midmar_movement_cat', cat);
  };

  // Home calisthenics state
  const [homeExercises, setHomeExercises] = useState([
    { id: 'h1', name: isAr ? 'ضغط الكفين (Push-ups)' : 'Push-ups', target: '3 × 12', done: false },
    { id: 'h2', name: isAr ? 'قرفصاء الأرجل (Bodyweight Squats)' : 'Squats', target: '3 × 15', done: false },
    { id: 'h3', name: isAr ? 'بلانك الثبات (Plank Hold)' : 'Plank Hold', target: '3 × 45s', done: false },
    { id: 'h4', name: isAr ? 'طعنات المشي (Walking Lunges)' : 'Lunges', target: '3 × 10 لكل ساق', done: false },
  ]);

  // Outdoor walk state
  const [walkMinutes, setWalkMinutes] = useState(30);
  const [neatSparkPaces, setNeatSparkPaces] = useState(() => {
    return Number(localStorage.getItem('midmar_neat_spark') || '0');
  });

  // Mobility stretch state including 3-Phase Posture Reset
  const [mobilityStretches, setMobilityStretches] = useState([
    { id: 'm-posture-1', name: isAr ? '1. فتح الصدر عند الباب (Doorway Pec Stretch)' : '1. Doorway Pec Stretch', duration: '30s', done: false },
    { id: 'm-posture-2', name: isAr ? '2. ارتداد الذقن لتصحيح الرقبة (Chin Tucks)' : '2. Chin Tucks Posture Reset', duration: '10 reps', done: false },
    { id: 'm-posture-3', name: isAr ? '3. جسر الألوية وتفعيل الحوض (Glute Bridges)' : '3. Glute Bridge Activation', duration: '15 reps', done: false },
    { id: 'm1', name: isAr ? 'إطالة عضلات الرقبة والترقوة' : 'Neck & Trap Stretch', duration: '60s', done: false },
    { id: 'm2', name: isAr ? 'تمدد القطة والبقرة للعمود الفقري' : 'Cat-Cow Flow', duration: '10 reps', done: false },
    { id: 'm3', name: isAr ? 'وضعية الطفل وفتح الأكتاف' : "Child's Pose", duration: '90s', done: false },
    { id: 'm4', name: isAr ? 'إطالة أوتار الفخذ وأسفل الظهر' : 'Hamstring & Low Back Relief', duration: '60s', done: false },
  ]);

  const [workoutChecked, setWorkoutChecked] = useState(isCompleted);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineType>(
    isSurvivalMode ? 'survival' : 'push'
  );

  // 3-Step Friction Destroyer Checklist
  const [frictionSteps, setFrictionSteps] = useState({
    shoes: false,
    water: false,
    door: false,
  });

  // Interactive Workout Logger
  const [exercises, setExercises] = useState<WorkoutExercise[]>(() => {
    const saved = localStorage.getItem('midmar_workout_exercises');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [
      {
        id: 'ex-1',
        name: isAr ? 'Bench Press (ضغط الصدر بالبار)' : 'Barbell Bench Press',
        sets: [
          { weight: 60, reps: 10, done: true },
          { weight: 65, reps: 8, done: true },
          { weight: 70, reps: 6, done: false },
        ],
      },
      {
        id: 'ex-2',
        name: isAr ? 'Incline Dumbbell Press (تجميع بالدمبل مائل)' : 'Incline DB Press',
        sets: [
          { weight: 22, reps: 10, done: false },
          { weight: 22, reps: 10, done: false },
        ],
      },
    ];
  });

  const [newExerciseName, setNewExerciseName] = useState('');

  // Rest Timer
  const [restSeconds, setRestSeconds] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);

  // Endorphin Rating
  const [endorphinRating, setEndorphinRating] = useState(() => {
    return Number(localStorage.getItem('midmar_endorphin_rating') || '4');
  });

  // Warmup Pyramid Calculator State
  const [isWarmupModalOpen, setIsWarmupModalOpen] = useState(false);
  const [warmupTargetExercise, setWarmupTargetExercise] = useState('Bench Press');
  const [warmupTargetExerciseId, setWarmupTargetExerciseId] = useState<string | null>(null);

  // Save exercises to local storage
  const saveExercises = (updated: WorkoutExercise[]) => {
    setExercises(updated);
    localStorage.setItem('midmar_workout_exercises', JSON.stringify(updated));
  };

  const handleApplyWarmupSets = (warmupSets: Array<{ weight: number; reps: number; done: boolean }>) => {
    if (!warmupTargetExerciseId) return;
    const updated = exercises.map((ex) => {
      if (ex.id === warmupTargetExerciseId) {
        return {
          ...ex,
          sets: [...warmupSets],
        };
      }
      return ex;
    });
    saveExercises(updated);
    if (onRewardToast) {
      onRewardToast(
        isAr ? '📐 تم تطبيق جولات الهرم التدريبي في التمرين!' : '📐 Warm-up pyramid applied to exercise!'
      );
    }
  };

  // Rest Timer Effect
  useEffect(() => {
    let timer: any;
    if (isRestRunning && restSeconds > 0) {
      timer = setTimeout(() => {
        setRestSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isRestRunning && restSeconds === 0) {
      setIsRestRunning(false);
      soundSynth.playGymRestChime();
      haptic.vibrateSprintCelebration();
      gymFaithAudio.duckVolume(2500, 0.25);
    }
    return () => clearTimeout(timer);
  }, [isRestRunning, restSeconds]);

  const handleStartRest = (sec: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setRestSeconds(sec);
    setIsRestRunning(true);
  };

  const handleConfirmDone = async () => {
    setWorkoutChecked(true);
    soundSynth.playCompletionChime();
    haptic.vibrateWorkDone();

    try {
      let loggedExercises: WorkoutExercise[] = exercises;
      let loggedVolume = totalVolume;
      let loggedSets = completedSetsCount;
      let durationMins = 45;

      if (movementCategory === 'walk') {
        durationMins = walkMinutes;
        loggedVolume = 0;
        loggedSets = 1;
        loggedExercises = [
          {
            id: `walk-${Date.now()}`,
            name: isAr ? `مشي خارجي معتدل (${walkMinutes} دقيقة)` : `Outdoor Walk (${walkMinutes} mins)`,
            sets: [{ reps: walkMinutes, weight: 0, done: true }],
          },
        ];
      } else if (movementCategory === 'mobility') {
        durationMins = 20;
        loggedVolume = 0;
        loggedSets = mobilityStretches.filter((m) => m.done).length || 4;
        loggedExercises = mobilityStretches.map((m) => ({
          id: m.id,
          name: m.name,
          sets: [{ reps: 1, weight: 0, done: m.done }],
        }));
      } else if (movementCategory === 'home') {
        durationMins = 30;
        loggedVolume = 0;
        loggedSets = homeExercises.filter((h) => h.done).length || 4;
        loggedExercises = homeExercises.map((h) => ({
          id: h.id,
          name: h.name,
          sets: [{ reps: 15, weight: 0, done: h.done }],
        }));
      }

      await db.workout_logs.add({
        id: `gym-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category: movementCategory,
        routineType: selectedRoutine,
        splitType: selectedRoutine,
        exercises: loggedExercises,
        durationMinutes: durationMins,
        totalVolume: loggedVolume,
        totalTonnageKg: loggedVolume,
        completedSets: loggedSets,
        endorphinRating: endorphinRating,
        timestamp: Date.now(),
      });

      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `🏋️ تم حفظ نشاطك في السجل الدائم بنجاح (${movementCategory === 'gym' ? `${loggedSets} جولات - حجم ${loggedVolume} كجم` : `${durationMins} دقيقة حركة`})!`
            : `🏋️ Activity logged to permanent record (${durationMins} mins movement)!`
        );
      }
    } catch (e) {
      console.error('Failed to log gym workout to Dexie:', e);
    }

    onCompleteStation();
  };

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const newEx: WorkoutExercise = {
      id: `ex-${Date.now()}`,
      name: newExerciseName.trim(),
      sets: [{ weight: 20, reps: 10, done: false }],
    };

    saveExercises([...exercises, newEx]);
    setNewExerciseName('');
  };

  const handleDeleteExercise = (id: string) => {
    soundSynth.playTactileClick();
    saveExercises(exercises.filter((ex) => ex.id !== id));
  };

  const handleAddSet = (exerciseId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const updated = exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1] || { weight: 20, reps: 10, done: false };
        return {
          ...ex,
          sets: [...ex.sets, { weight: lastSet.weight, reps: lastSet.reps, done: false }],
        };
      }
      return ex;
    });
    saveExercises(updated);
  };

  const handleCloneLastSet = (exerciseId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    const updated = exercises.map((ex) => {
      if (ex.id === exerciseId) {
        if (ex.sets.length === 0) {
          return {
            ...ex,
            sets: [{ weight: 20, reps: 10, rpe: 8, done: false }],
          };
        }
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { weight: lastSet.weight, reps: lastSet.reps, rpe: lastSet.rpe || 8, done: false },
          ],
        };
      }
      return ex;
    });
    saveExercises(updated);
    if (onRewardToast) {
      onRewardToast(
        isAr ? '⚡ تم تكرار الجولة السابقة بنجاح بنقرة واحدة!' : '⚡ Last set cloned successfully!'
      );
    }
  };

  const handleApplyDeloadSet = (exerciseId: string, deloadWeight: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    const updated = exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1] || { reps: 8, weight: 20 };
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { weight: deloadWeight, reps: lastSet.reps, rpe: 8, done: false },
          ],
        };
      }
      return ex;
    });
    saveExercises(updated);
    if (onRewardToast) {
      onRewardToast(
        isAr
          ? `🛡️ تم تطبيق التخفيف الذكي للجولة التالية (-7.5% إلى ${deloadWeight} كجم) لحماية الجهاز العصبي!`
          : `🛡️ Applied auto-regulated deload set (${deloadWeight} kg) for CNS recovery!`
      );
    }
  };

  const handleUpdateSet = (
    exerciseId: string,
    setIndex: number,
    field: keyof WorkoutSet,
    val: any
  ) => {
    const updated = exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const newSets = ex.sets.map((s, idx) => {
          if (idx === setIndex) {
            const next = { ...s, [field]: val };
            if (field === 'done' && val === true) {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              // Adaptive Rest Timer: 180s (3m) for heavy compound lifts, 60s for isolation
              const isCompound = /bench|squat|deadlift|press|row|صدر|سكوات|ديدلفت|بار|ظهر|أرجل/i.test(ex.name);
              handleStartRest(isCompound ? 180 : 60);
            }
            return next;
          }
          return s;
        });
        return { ...ex, sets: newSets };
      }
      return ex;
    });
    saveExercises(updated);
  };

  // Calculate total workout volume
  const totalVolume = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sAcc, s) => {
        return s.done ? sAcc + s.weight * s.reps : sAcc;
      }, 0)
    );
  }, 0);

  const completedSetsCount = exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((s) => s.done).length;
  }, 0);

  // Spinal Axial Loading Guard (حارس التحميل المحوري للعمود الفقري)
  const spinalCheck = React.useMemo(() => {
    const squatMatch = exercises.some((ex) => /squat|سكوات|قرفصاء/i.test(ex.name));
    const deadliftMatch = exercises.some((ex) => /deadlift|ديدلفت|رفعة ميتة/i.test(ex.name));
    const isSevere = squatMatch && deadliftMatch;
    return {
      isSevere,
      squatMatch,
      deadliftMatch,
    };
  }, [exercises]);

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-4 transition-colors duration-200">
      {/* Sleek Native Station Header Bar (Apple-Tier) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-l from-orange-500/10 via-white dark:via-zinc-900 to-white dark:to-zinc-900 border border-orange-500/20 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-700 dark:text-orange-400 shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-orange-700 dark:text-orange-400 font-bold uppercase tracking-wider block">
              {persona.badge} • {stationMeta.shortTime}
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 truncate">
              {isAr ? stationMeta.titleAr : stationMeta.titleEn}
            </h2>
          </div>
        </div>

        <div className="shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-500/15 text-orange-800 dark:text-orange-400 font-mono font-bold">
            +15 XP
          </span>
        </div>
      </div>

      {/* 7 Movement Categories Segmented Tab Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => handleSelectMovementCat('gym')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'gym'
              ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-xs border border-orange-200 dark:border-orange-500/30'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>🏋️</span>
          <span>{isAr ? 'حديد وجيم' : 'Gym'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('combat')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'combat'
              ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs border border-rose-200 dark:border-rose-500/30'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>🥊</span>
          <span>{isAr ? 'فنون قتالية وبوكس' : 'Combat & Boxing'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('football')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'football'
              ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-200 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>⚽</span>
          <span>{isAr ? 'كورة وبادل' : 'Football & Padel'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('fitness_class')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'fitness_class'
              ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs border border-amber-200 dark:border-amber-500/30'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>⏱️</span>
          <span>{isAr ? 'كلاس فيتنس و HIIT' : 'Fitness Class'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('home')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'home'
              ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-xs border border-orange-200 dark:border-orange-500/30'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>🏠</span>
          <span>{isAr ? 'تمارين منزلية' : 'Calisthenics'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('walk')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'walk'
              ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-xs border border-orange-200 dark:border-orange-500/30'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>🚶</span>
          <span>{isAr ? 'مشي وهرولة' : 'Walk'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('mobility')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'mobility'
              ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-xs border border-orange-200 dark:border-orange-500/30'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>🧘</span>
          <span>{isAr ? 'إطالات واستشفاء' : 'Mobility'}</span>
        </button>
      </div>

      {/* Movement View: Combat Sports (Boxing, Muay Thai, BJJ) */}
      {movementCategory === 'combat' && (
        <CombatSportsModule onRewardToast={onRewardToast} />
      )}

      {/* Movement View: Team Sports (Football, Padel, Basketball) */}
      {movementCategory === 'football' && (
        <TeamSportsModule onRewardToast={onRewardToast} />
      )}

      {/* Movement View: Fitness Class (HIIT / Tabata / Circuit) */}
      {movementCategory === 'fitness_class' && (
        <FitnessIntervalEngine onRewardToast={onRewardToast} />
      )}

      {/* Movement View: Home Calisthenics */}
      {movementCategory === 'home' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏠</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {isAr ? 'دائرة التمارين المنزلية بوزن الجسم' : 'Bodyweight Calisthenics Circuit'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {isAr ? 'تنشيط عضلي متكامل في غرفتك دون أي أجهزة' : 'Full-body workout with zero equipment'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleStartRest(45)}
              className="py-1.5 px-3 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-mono text-xs font-bold border border-orange-200 dark:border-orange-800/40 cursor-pointer"
            >
              ⏱️ 45s {isAr ? 'استراحة' : 'Rest'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {homeExercises.map((ex) => (
              <div
                key={ex.id}
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setHomeExercises((prev) =>
                    prev.map((item) => (item.id === ex.id ? { ...item, done: !item.done } : item))
                  );
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  ex.done
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-zinc-950/80 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      ex.done
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-zinc-700'
                    }`}
                  >
                    {ex.done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-xs font-bold">{ex.name}</span>
                </div>
                <span className="text-xs font-mono text-orange-600 dark:text-orange-400 font-semibold">
                  {ex.target}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movement View: Outdoor Walk */}
      {movementCategory === 'walk' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚶</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {isAr ? 'جلسة المشي والهرولة في الهواء الطلق' : 'Outdoor Mindful Walk'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr ? 'تجديد الأكسجين، تحفيز الإبداع، وتصفية الذهن' : 'Oxygenation, creative flow, and screen detox'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  soundSynth.playTactileClick();
                  setWalkMinutes(mins);
                }}
                className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  walkMinutes === mins
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800'
                }`}
              >
                {mins} {isAr ? 'دقيقة' : 'm'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/30 text-center">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-sans">الخطوات المقدرة</span>
              <span className="text-lg font-mono font-black text-orange-600 dark:text-orange-400">
                ~{(walkMinutes * 100).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-sans">المسافة المتوقعة</span>
              <span className="text-lg font-mono font-black text-slate-900 dark:text-zinc-100">
                ~{(walkMinutes * 0.08).toFixed(1)} كم
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-sans">حرق السعرات</span>
              <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                ~{(walkMinutes * 4.5).toFixed(0)} kcal
              </span>
            </div>
          </div>

          {/* NEAT 100-Pace Spark Trigger */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-200">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{isAr ? 'شرارة النشاط العفوي (NEAT 100-Pace Spark)' : 'NEAT 100-Pace Spark'}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                {isAr
                  ? 'المشي لـ 100 خطوة بعد الجلوس يخفض سكر الدم بنسبة 24% وينشط الدورة الدموية.'
                  : 'Walking 100 paces right now lowers post-meal glucose and sparks circulation.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                soundSynth.playStreakMilestoneChime();
                haptic.vibrateSprintCelebration();
                const nextCount = neatSparkPaces + 100;
                setNeatSparkPaces(nextCount);
                localStorage.setItem('midmar_neat_spark', String(nextCount));
                if (onRewardToast) {
                  onRewardToast(
                    isAr
                      ? `⚡ أحسنت! أنجزت 100 خطوة الآن (المجموع: ${nextCount.toLocaleString()} خطوة NEAT)!`
                      : `⚡ Awesome! 100 NEAT paces sparked (Total: ${nextCount.toLocaleString()})!`
                  );
                }
              }}
              className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shrink-0 shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              <span>+100 {isAr ? 'خطوة الآن ⚡' : 'Paces ⚡'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Movement View: Mobility & Posture */}
      {movementCategory === 'mobility' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧘</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {isAr ? 'إطالات واستشفاء الظهر والرقبة (Mobility)' : 'Spine & Posture Relief Routine'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr ? 'فك التصلب العضلي الناتج عن الجلوس الطويل والمكاتب' : 'Relieve stiffness from sitting and screens'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mobilityStretches.map((st) => (
              <div
                key={st.id}
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setMobilityStretches((prev) =>
                    prev.map((item) => (item.id === st.id ? { ...item, done: !item.done } : item))
                  );
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  st.done
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-zinc-950/80 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      st.done
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-zinc-700'
                    }`}
                  >
                    {st.done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-xs font-bold">{st.name}</span>
                </div>
                <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">
                  {st.duration}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movement View: Gym (Anti-Couch & Routine Selector) */}
      {movementCategory === 'gym' && (
        <>
          {/* Anti-Couch Inertia & 3-Step Friction Destroyer Protocol */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {t('couch_inertia_title')}
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  {t('couch_inertia_desc')}
                </p>
              </div>
            </div>

            {/* 3 Steps to Destroy Friction */}
            <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-800/30 space-y-2.5">
              <div className="font-bold text-orange-800 dark:text-orange-300 text-xs flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-600" />
                <span>{t('preworkout_checklist_title')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-orange-200/60 dark:border-zinc-800">
                  <input
                    type="checkbox"
                    checked={frictionSteps.shoes}
                    onChange={(e) => {
                      soundSynth.playTactileClick();
                      setFrictionSteps({ ...frictionSteps, shoes: e.target.checked });
                    }}
                    className="w-4 h-4 text-orange-600 rounded-sm focus:ring-0"
                  />
                  <span className="font-medium text-[11px]">{t('pre_step_1')}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-orange-200/60 dark:border-zinc-800">
                  <input
                    type="checkbox"
                    checked={frictionSteps.water}
                    onChange={(e) => {
                      soundSynth.playTactileClick();
                      setFrictionSteps({ ...frictionSteps, water: e.target.checked });
                    }}
                    className="w-4 h-4 text-orange-600 rounded-sm focus:ring-0"
                  />
                  <span className="font-medium text-[11px]">{t('pre_step_2')}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-orange-200/60 dark:border-zinc-800">
                  <input
                    type="checkbox"
                    checked={frictionSteps.door}
                    onChange={(e) => {
                      soundSynth.playTactileClick();
                      setFrictionSteps({ ...frictionSteps, door: e.target.checked });
                    }}
                    className="w-4 h-4 text-orange-600 rounded-sm focus:ring-0"
                  />
                  <span className="font-medium text-[11px]">{t('pre_step_3')}</span>
                </label>
              </div>
            </div>

            {/* Survival Mode Notice */}
            {isSurvivalMode && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <Heart className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>وضع البقاء مُفعّل (MVD):</strong> يكفيك اليوم 5 دقائق إطالات خفيفة لحماية شعلتك بنسبة 100%!
                </span>
              </div>
            )}
          </div>

          {/* Routine Selector Tabs */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              {t('routine_select_title')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  { id: 'push', label: t('routine_push') },
                  { id: 'pull', label: t('routine_pull') },
                  { id: 'legs', label: t('routine_legs') },
                  { id: 'cardio', label: t('routine_cardio') },
                  { id: 'survival', label: t('routine_survival') },
                ] as const
              ).map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setSelectedRoutine(rt.id);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center truncate ${
                    selectedRoutine === rt.id
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:border-orange-400'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

      {/* Rest Timer Bar & Workout Volume Stats */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Timer className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-mono text-orange-400 font-bold uppercase tracking-wider block">
              {t('rest_timer_title')}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-mono font-black text-white">
                {restSeconds}s
              </span>
              {isRestRunning && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/30 text-orange-300 animate-pulse">
                  {isAr ? 'جاري الاستراحة...' : 'Resting...'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Rest Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleStartRest(60)}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
              restSeconds === 60 ? 'bg-orange-600 text-white shadow-xs' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
            title={isAr ? 'عزل (Isolation)' : 'Isolation (60s)'}
          >
            60s {isAr ? 'عزل' : 'Iso'}
          </button>
          <button
            onClick={() => handleStartRest(90)}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
              restSeconds === 90 ? 'bg-orange-600 text-white shadow-xs' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
            title={isAr ? 'بناء عضلي (Hypertrophy)' : 'Hypertrophy (90s)'}
          >
            90s {isAr ? 'بناء' : 'Hyp'}
          </button>
          <button
            onClick={() => handleStartRest(180)}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
              restSeconds === 180 ? 'bg-orange-600 text-white shadow-xs' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
            title={isAr ? 'تمارين مركبة - فوسفات الطاقة (3 دقائق)' : 'Compound ATP (3m)'}
          >
            3m {isAr ? 'مركب' : 'Comp'}
          </button>
          <button
            onClick={() => handleStartRest(300)}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
              restSeconds === 300 ? 'bg-orange-600 text-white shadow-xs' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
            title={isAr ? 'قوة قصوى (5 دقائق)' : 'Max Strength (5m)'}
          >
            5m {isAr ? 'قوة' : 'Str'}
          </button>
          {isRestRunning && (
            <button
              onClick={() => {
                setIsRestRunning(false);
                setRestSeconds(0);
              }}
              className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Total Volume Metric */}
        <div className="text-end border-t sm:border-t-0 sm:border-s border-zinc-800 pt-2 sm:pt-0 sm:ps-4 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
          <span className="text-[11px] text-zinc-400">
            {isAr ? 'الحجم التدريبي الكلي:' : 'Total Volume:'}
          </span>
          <span className="text-base font-mono font-black text-emerald-400">
            {totalVolume.toLocaleString()} kg ({completedSetsCount} {t('sets_label')})
          </span>
        </div>
      </div>

      {/* Spinal Axial Loading Guard (حارس التحميل المحوري للعمود الفقري) */}
      {spinalCheck.isSevere && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs animate-in fade-in">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                {isAr ? 'حارس التحميل المحوري للعمود الفقري (Spinal Axial Guard) ⚠️' : 'Spinal Axial Loading Guard ⚠️'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold">
                L4-L5 Protection
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700 dark:text-zinc-300">
              {isAr
                ? 'رصد النظام الجمع بين (السكوات) و(الديدلفت) في نفس الحصة التدريبية. هذا الجمع يضاعف الضغط الانضغاطي المحوري على الفقرات القطنية وجذور الأعصاب مع استنزاف حاد للجهاز العصبي المركزي (CNS). يُوصى علمياً بفصل التمرينين بـ 48 ساعة، أو استبدال أحدهما ببديل غير محوري (مثل Leg Press أو Bulgarian Split Squat أو Romanian Dumbbell Deadlift).'
                : 'Concurrent Squats & Deadlifts compound heavy axial compressive load on lumbar discs (L4-L5) and CNS fatigue. Sports medicine recommends separating by 48h or swapping one with a non-axial compound (Leg Press, Bulgarian Split Squat, or DB RDL).'}
            </p>
          </div>
        </div>
      )}

      {/* Interactive Exercise Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exercises.map((ex) => {
          const doneSets = ex.sets.filter((s) => s.done);
          const lastDone = doneSets.length > 0 ? doneSets[doneSets.length - 1] : null;
          const isAtLimit = lastDone && (lastDone.rpe || 8) >= 10;
          const deloadWeight = isAtLimit ? Math.max(5, Number((lastDone.weight * 0.925).toFixed(1))) : 0;
          const reductionKg = isAtLimit ? Number((lastDone.weight - deloadWeight).toFixed(1)) : 0;

          return (
            <div
              key={ex.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">{ex.name}</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setWarmupTargetExercise(ex.name);
                      setWarmupTargetExerciseId(ex.id);
                      setIsWarmupModalOpen(true);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title={isAr ? 'حساب أوزان الإحماء والهرم' : 'Calculate Warmup Pyramid'}
                  >
                    <Calculator className="w-3 h-3" />
                    <span>{isAr ? 'حاسبة الإحماء' : 'Warmup'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteExercise(ex.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* RPE 10 Autoregulation & Live Deload Advisor */}
              {isAtLimit && deloadWeight > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">⚡</span>
                    <div className="min-w-0">
                      <span className="font-black text-amber-800 dark:text-amber-300 block truncate text-[11px]">
                        {isAr ? 'مستشعر الإنهاك العصبي (RPE 10 Autoregulation)' : 'CNS Fatigue Alert (RPE 10)'}
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-zinc-400 block truncate">
                        {isAr
                          ? `وصلت للفشل التام (${lastDone.weight}كغ). يُنصح بخفض 7.5% (-${reductionKg}كغ) للحفاظ على سرعة البار.`
                          : `Reached failure at ${lastDone.weight}kg. Deload 7.5% (-${reductionKg}kg) to maintain bar speed.`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyDeloadSet(ex.id, deloadWeight)}
                    className="py-1 px-2.5 rounded-lg bg-amber-500 text-slate-950 font-mono font-bold text-[11px] shrink-0 shadow-2xs hover:bg-amber-400 cursor-pointer transition-all active:scale-95"
                    title={isAr ? 'إضافة جولة بتخفيف ذكي 7.5%' : 'Add auto-regulated deload set'}
                  >
                    {isAr ? `تخفيف ذكي (${deloadWeight} كغ) ⚡` : `Deload (${deloadWeight}kg) ⚡`}
                  </button>
                </div>
              )}

              {/* Sets Header */}
            <div className="grid grid-cols-12 gap-1.5 text-[11px] font-bold text-slate-400 dark:text-zinc-500 px-1 items-center">
              <span className="col-span-1">#</span>
              <span className="col-span-4">{t('weight_label')}</span>
              <span className="col-span-3">{t('reps_label')}</span>
              <span className="col-span-2 text-center" title="Rate of Perceived Exertion (6-10)">RPE</span>
              <span className="col-span-2 text-center">{isAr ? 'تم' : 'Done'}</span>
            </div>

            {/* Sets Rows */}
            <div className="space-y-1.5">
              {ex.sets.map((set, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-12 gap-1.5 items-center p-2 rounded-xl border transition-colors ${
                    set.done
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40'
                      : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <span className="col-span-1 font-mono font-bold text-xs text-slate-600 dark:text-zinc-400 ps-0.5">
                    {idx + 1}
                  </span>
                  {/* Weight Input + Micro-loading pills */}
                  <div className="col-span-4 flex items-center gap-1">
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) =>
                        handleUpdateSet(ex.id, idx, 'weight', Number(e.target.value))
                      }
                      className="w-full py-1 px-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-bold text-slate-900 dark:text-zinc-100"
                    />
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSet(ex.id, idx, 'weight', Number((set.weight + 1.25).toFixed(2)))
                        }
                        className="px-1 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white text-[9px] font-mono font-bold transition-colors cursor-pointer"
                        title="+1.25kg"
                      >
                        +1.2
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSet(ex.id, idx, 'weight', Number((set.weight + 2.5).toFixed(2)))
                        }
                        className="px-1 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white text-[9px] font-mono font-bold transition-colors cursor-pointer"
                        title="+2.5kg"
                      >
                        +2.5
                      </button>
                    </div>
                  </div>
                  {/* Reps Input */}
                  <div className="col-span-3 flex items-center gap-1">
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) =>
                        handleUpdateSet(ex.id, idx, 'reps', Number(e.target.value))
                      }
                      className="w-full py-1 px-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-bold text-slate-900 dark:text-zinc-100"
                    />
                  </div>
                  {/* RPE Column */}
                  <div className="col-span-2 flex justify-center">
                    <select
                      value={set.rpe || 8}
                      onChange={(e) =>
                        handleUpdateSet(ex.id, idx, 'rpe', Number(e.target.value))
                      }
                      className="w-full py-1 px-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-[11px] font-mono font-bold text-slate-800 dark:text-zinc-200 text-center"
                      title={isAr ? 'معدل الجهد RPE (6: سهل، 8: باقي عدتين، 10: الفشل التام)' : 'RPE (6: Easy, 8: 2 RIR, 10: Absolute Failure)'}
                    >
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                    </select>
                  </div>
                  {/* Done Toggle */}
                  <div className="col-span-2 flex justify-center">
                    <button
                      onClick={() => handleUpdateSet(ex.id, idx, 'done', !set.done)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        set.done
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : 'border-slate-300 dark:border-zinc-700 hover:border-emerald-500 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      {set.done && <CheckCircle className="w-4 h-4 stroke-[3]" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Set Actions: Clone Last Set (1-Tap) + Add New Set */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCloneLastSet(ex.id)}
                className="py-2 px-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 dark:bg-orange-500/15 dark:hover:bg-orange-500/25 text-orange-600 dark:text-orange-400 border border-orange-400/30 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                title={isAr ? 'تكرار نفس وزن وعدات الجولة السابقة بنقرة واحدة دون كتابة' : 'Clone last set weight & reps with 1 tap'}
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="truncate">{isAr ? 'تكرار الجولة السابقة ⚡' : 'Clone Last Set ⚡'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddSet(ex.id)}
                className="py-2 px-2 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 hover:border-orange-500 text-slate-600 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="truncate">{t('add_set_btn')}</span>
              </button>
            </div>
          </div>
        )})}

        {/* Add Exercise Form */}
        <form
          onSubmit={handleAddExercise}
          className="col-span-1 md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-dashed border-slate-300 dark:border-zinc-800 flex gap-2"
        >
          <input
            type="text"
            placeholder={t('exercise_name_placeholder')}
            value={newExerciseName}
            onChange={(e) => setNewExerciseName(e.target.value)}
            className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-orange-500"
          />
          <button
            type="submit"
            className="py-2 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_exercise_btn')}</span>
          </button>
        </form>
      </div>
        </>
      )}

      {/* Endorphin & Post-Workout Mood Booster Rating */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Smile className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
            {t('endorphin_title')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => {
                soundSynth.playTactileClick();
                setEndorphinRating(star);
                localStorage.setItem('midmar_endorphin_rating', String(star));
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                star <= endorphinRating
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
                  : 'text-slate-300 dark:text-zinc-700'
              }`}
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* Completion & Next Station */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{t('station_3_heading')}</h4>
          <p className="text-[11px] text-slate-500 dark:text-zinc-500">
            {isCompleted || workoutChecked
              ? isAr
                ? 'تم تسجيل التمرين بنجاح (+15 نقطة)!'
                : 'Workout logged (+15 points)!'
              : isAr
              ? 'أكد تمرينك للانتقال لجلسة المساء الإنجازية.'
              : 'Confirm workout to advance to evening session.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!(isCompleted || workoutChecked) ? (
            <button
              onClick={handleConfirmDone}
              className="py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t('mark_done')} (+15)</span>
            </button>
          ) : (
            <button
              onClick={onNextStation}
              className="py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <span>{t('next_station')}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Warmup Pyramid Modal */}
      <WarmupPyramidModal
        isOpen={isWarmupModalOpen}
        onClose={() => setIsWarmupModalOpen(false)}
        exerciseName={warmupTargetExercise}
        onApplyWarmupSets={handleApplyWarmupSets}
      />
    </div>
  );
};

export default GymAnchorView;
