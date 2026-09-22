import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Waves,
  Briefcase,
  Layers,
  VolumeX,
  Trash2,
  Target,
  Zap,
  Sparkles,
  Sun,
  Coffee,
  Heart,
  ChevronDown,
  ChevronUp,
  Shield,
  Lock,
} from 'lucide-react';
import type { WorkdayTask, FocusSessionMode, TaskPriority, AmbientSoundType } from '../../types';
import { useWorkerTimer } from '../../hooks/useWorkerTimer';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from '../../i18n/LanguageContext';
import { aiCoach } from '../../services/aiCoachService';
import { getTodayWorkRhythm, DOMAIN_PRESETS, DEFAULT_WORK_RHYTHM_CONFIG } from '../../utils/workRhythm';
import { calculatePrayerTimes, getNextPrayer } from '../../utils/prayerCalculator';

interface WorkdayPlannerProps {
  todayDate: string;
  onDeferToBuffer?: (taskTitle: string, durationMin: number) => void;
  bufferAvailableCount?: number;
  onOpenTwoMinuteRule?: (taskTitle?: string) => void;
}

export const WorkdayPlanner: React.FC<WorkdayPlannerProps> = ({
  todayDate,
  onDeferToBuffer,
  bufferAvailableCount = 2,
  onOpenTwoMinuteRule,
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  // Profile & Work Rhythm
  const userState = useLiveQuery(async () => (await db.user_state.get('current_user')) || (await db.user_state.toCollection().first()));
  const activeProfile = useLiveQuery(
    () => db.profiles.get(userState?.activeProfileId || 'profile_default'),
    [userState?.activeProfileId]
  );

  const dateParts = todayDate.split('-').map(Number);
  const dateObj = new Date(dateParts[0], (dateParts[1] || 1) - 1, dateParts[2] || 1);
  const rhythm = getTodayWorkRhythm(dateObj, userState?.settings?.workRhythmConfig || DEFAULT_WORK_RHYTHM_CONFIG);
  const domain = activeProfile?.professionDomain || 'software_dev';
  const domainPreset = DOMAIN_PRESETS[domain] || DOMAIN_PRESETS.software_dev;
  const [showRestDayWorkArea, setShowRestDayWorkArea] = useState(false);

  // Live queries for tasks with compound index [date+profileId]
  const tasks = useLiveQuery(
    async () => {
      const pId = activeProfile?.id || 'profile_default';
      const indexedTasks = await db.workday_tasks
        .where('[date+profileId]')
        .equals([todayDate, pId])
        .toArray();
      if (indexedTasks.length === 0) {
        return db.workday_tasks
          .where('date')
          .equals(todayDate)
          .filter(t => !t.profileId || t.profileId === pId)
          .toArray();
      }
      return indexedTasks;
    },
    [todayDate, activeProfile?.id]
  ) || [];

  // Active Focus Mode
  const [focusMode, setFocusMode] = useState<FocusSessionMode>('pomodoro_25');
  const [customMinutes, setCustomMinutes] = useState(45);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Prayer-Aware Focus Block (التقريب الزمني الذكي للصلوات)
  const nextPrayer = useMemo(() => {
    const pLoc = userState?.settings?.prayerLocation;
    const pTimes = calculatePrayerTimes(
      new Date(),
      pLoc?.latitude ?? 30.0444,
      pLoc?.longitude ?? 31.2357,
      pLoc?.calculationMethod ?? 'egyptian'
    );
    return getNextPrayer(pTimes, new Date(), isAr);
  }, [userState?.settings?.prayerLocation, isAr]);

  const prayerSprintMinutes = Math.max(5, (nextPrayer?.minutesRemaining ?? 30) - 2);

  // New Task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEstimate, setNewTaskEstimate] = useState(25);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskRole, setNewTaskRole] = useState<'maker' | 'manager'>('maker');
  const [showAddTask, setShowAddTask] = useState(false);

  // Ivy Lee 6-Task Sequential Lock Mode
  const [ivyLeeLockEnabled, setIvyLeeLockEnabled] = useState<boolean>(() => {
    return localStorage.getItem('midmar_ivy_lee_lock') === 'true';
  });

  // Session states
  const [completedSessionsCount, setCompletedSessionsCount] = useState(() => {
    return Number(localStorage.getItem(`midmar_sessions_${todayDate}`) || '0');
  });
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(() => {
    return Number(localStorage.getItem(`midmar_focus_mins_${todayDate}`) || '0');
  });

  // Ambient sound state
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('none');

  // Urge Control (ACT Therapy)
  const [isUrgeOpen, setIsUrgeOpen] = useState(false);
  const [urgeSeconds, setUrgeSeconds] = useState(60);
  const [surfedCount, setSurfedCount] = useState(() => {
    return Number(localStorage.getItem('midmar_urge_count') || '0');
  });

  // Worker Timer for drift-free precision
  const timer = useWorkerTimer();
  const [isBreakPhase, setIsBreakPhase] = useState(false);

  // Dopamine Sanctuary (محراب الاحتجاب) & 5-Second Friction Vault
  const [isSanctuaryOpen, setIsSanctuaryOpen] = useState(false);
  const [exitHoldProgress, setExitHoldProgress] = useState(0);
  const holdIntervalRef = React.useRef<any>(null);

  const startExitHold = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    haptic.vibrateLight();
    holdIntervalRef.current = setInterval(() => {
      setExitHoldProgress((prev) => {
        if (prev >= 100) {
          if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current);
            holdIntervalRef.current = null;
          }
          soundSynth.playTactileClick();
          haptic.vibrateSprintCelebration();
          setIsSanctuaryOpen(false);
          return 0;
        }
        return prev + 2; // +2% every 100ms = 5000ms (5.0s hold)
      });
    }, 100);
  };

  const cancelExitHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setExitHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, []);

  // Auto-inject tomorrow anchor as Task #1 in morning planner
  useEffect(() => {
    const checkAndInjectTomorrowAnchor = async () => {
      const anchor = localStorage.getItem('midmar_tomorrow_anchor');
      const lastInjectedKey = `midmar_anchor_injected_${todayDate}`;
      if (anchor && anchor.trim() && localStorage.getItem(lastInjectedKey) !== 'true') {
        const existing = await db.workday_tasks
          .where('date')
          .equals(todayDate)
          .filter((t) => t.title.includes(anchor.trim()))
          .first();

        if (!existing) {
          await db.workday_tasks.add({
            id: `wt_anchor_${Date.now()}`,
            title: `🎯 ${anchor.trim()}`,
            estimatedMinutes: 45,
            actualMinutes: 0,
            completed: false,
            priority: 'high',
            date: todayDate,
            profileId: activeProfile?.id || 'profile_default',
          });
          localStorage.setItem(lastInjectedKey, 'true');
        }
      }
    };
    checkAndInjectTomorrowAnchor();
  }, [todayDate, activeProfile]);

  // AI Deconstructor for tasks
  const [deconstructingTaskId, setDeconstructingTaskId] = useState<string | null>(null);

  const handleAiDeconstructTask = async (task: WorkdayTask) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setDeconstructingTaskId(task.id);
    try {
      const steps = await aiCoach.deconstructTask(task.title, {
        profileName: isAr ? 'صديقي' : 'User',
      });
      for (const st of steps) {
        await db.workday_tasks.add({
          id: `wt_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: st.title,
          estimatedMinutes: st.durationMin,
          actualMinutes: 0,
          completed: false,
          priority: task.priority,
          date: todayDate,
          profileId: task.profileId,
        });
      }
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
    } finally {
      setDeconstructingTaskId(null);
    }
  };

  const handleAddPresetTask = async (title: string, durationMin: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    await db.workday_tasks.add({
      id: `wt_preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      estimatedMinutes: durationMin,
      actualMinutes: 0,
      completed: false,
      priority: 'medium',
      date: todayDate,
      profileId: activeProfile?.id || 'profile_default',
    });
  };

  // Determine durations based on mode
  const getModeDurations = (mode: FocusSessionMode) => {
    switch (mode) {
      case 'pomodoro_25':
        return { workMin: 25, restMin: 5 };
      case 'deep_50':
        return { workMin: 50, restMin: 10 };
      case 'flow_90':
        return { workMin: 90, restMin: 15 };
      case 'quick_20':
        return { workMin: 20, restMin: 3 };
      case 'custom':
        return { workMin: customMinutes, restMin: Math.max(5, Math.round(customMinutes * 0.2)) };
    }
  };

  const { workMin, restMin } = getModeDurations(focusMode);

  // Ambient sound control
  useEffect(() => {
    if (timer.isRunning && ambientSound !== 'none') {
      soundSynth.startAmbient(ambientSound, 0.4);
    } else {
      soundSynth.stopAmbient();
    }
    return () => soundSynth.stopAmbient();
  }, [timer.isRunning, ambientSound]);

  // Urge wave countdown
  useEffect(() => {
    let interval: any;
    if (isUrgeOpen && urgeSeconds > 0) {
      interval = setInterval(() => {
        setUrgeSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isUrgeOpen && urgeSeconds === 0) {
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      const next = surfedCount + 1;
      setSurfedCount(next);
      localStorage.setItem('midmar_urge_count', String(next));
    }
    return () => clearInterval(interval);
  }, [isUrgeOpen, urgeSeconds]);

  // Session Persistence: Resume active focus session or break across page refreshes
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem('midmar_active_focus_target');
      if (savedRaw) {
        let targetMs = 0;
        let isBreak = false;
        if (savedRaw.startsWith('{')) {
          const parsed = JSON.parse(savedRaw);
          targetMs = Number(parsed.targetMs) || 0;
          isBreak = !!parsed.isBreak;
        } else {
          targetMs = Number(savedRaw) || 0;
        }

        const remainingSec = Math.round((targetMs - Date.now()) / 1000);
        if (remainingSec > 5) {
          setIsBreakPhase(isBreak);
          timer.startTimer(remainingSec, () => {
            if (isBreak) {
              soundSynth.playGymRestChime();
              haptic.vibrateLight();
              setIsBreakPhase(false);
            } else {
              soundSynth.playCompletionChime();
              haptic.vibrateWorkDone();
              setIsBreakPhase(false);
            }
            localStorage.removeItem('midmar_active_focus_target');
          });
        } else {
          localStorage.removeItem('midmar_active_focus_target');
        }
      }
    } catch (_) {}
  }, []);

  const handleStartWork = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsBreakPhase(false);
    localStorage.setItem(
      'midmar_active_focus_target',
      JSON.stringify({
        targetMs: Date.now() + workMin * 60 * 1000,
        isBreak: false,
      })
    );
    timer.startTimer(workMin * 60, () => {
      soundSynth.playCompletionChime();
      haptic.vibrateWorkDone();
      localStorage.removeItem('midmar_active_focus_target');

      // Record session completion
      const newSessionCount = completedSessionsCount + 1;
      const newMins = totalFocusMinutes + workMin;
      setCompletedSessionsCount(newSessionCount);
      setTotalFocusMinutes(newMins);
      localStorage.setItem(`midmar_sessions_${todayDate}`, String(newSessionCount));
      localStorage.setItem(`midmar_focus_mins_${todayDate}`, String(newMins));

      // Update today's daily log in Dexie
      db.daily_logs.get(todayDate).then((log) => {
        if (log) {
          db.daily_logs.update(todayDate, {
            totalFocusMinutes: newMins,
            focusSessionsCount: newSessionCount,
          });
        }
      });

      // Update active task actual minutes if selected
      if (activeTaskId) {
        db.workday_tasks.get(activeTaskId).then((t) => {
          if (t) {
            db.workday_tasks.update(activeTaskId, {
              actualMinutes: (t.actualMinutes || 0) + workMin,
            });
          }
        });
      }

      // Transition to rest phase
      setIsBreakPhase(true);
      localStorage.setItem(
        'midmar_active_focus_target',
        JSON.stringify({
          targetMs: Date.now() + restMin * 60 * 1000,
          isBreak: true,
        })
      );
      timer.startTimer(restMin * 60, () => {
        soundSynth.playGymRestChime();
        haptic.vibrateLight();
        localStorage.removeItem('midmar_active_focus_target');
        setIsBreakPhase(false);
      });
    });
  };

  const handlePause = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    timer.pauseTimer();
  };

  const handleResume = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    timer.resumeTimer();
  };

  const handleReset = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    localStorage.removeItem('midmar_active_focus_target');
    timer.stopTimer();
    setIsBreakPhase(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const newTask: WorkdayTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      estimatedMinutes: newTaskEstimate,
      actualMinutes: 0,
      completed: false,
      priority: newTaskPriority,
      date: todayDate,
      profileId: activeProfile?.id || 'profile_default',
      taskRole: newTaskRole,
    };

    await db.workday_tasks.add(newTask);
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  const handleToggleIvyLee = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const nextVal = !ivyLeeLockEnabled;
    setIvyLeeLockEnabled(nextVal);
    localStorage.setItem('midmar_ivy_lee_lock', String(nextVal));
  };

  const handleToggleTaskRole = async (task: WorkdayTask) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const nextRole = task.taskRole === 'manager' ? 'maker' : 'manager';
    await db.workday_tasks.update(task.id, { taskRole: nextRole });
  };

  const handleToggleTask = async (task: WorkdayTask) => {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();
    await db.workday_tasks.update(task.id, {
      completed: !task.completed,
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    soundSynth.playTactileClick();
    await db.workday_tasks.delete(taskId);
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Maker vs Manager Ratio Calculation
  const makerTasks = tasks.filter((t) => (t.taskRole || 'maker') === 'maker');
  const managerTasks = tasks.filter((t) => t.taskRole === 'manager');
  const totalMakerMins = makerTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 25), 0);
  const totalManagerMins = managerTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 25), 0);
  const totalTaskMins = totalMakerMins + totalManagerMins;
  const makerPercentage = totalTaskMins > 0 ? Math.round((totalMakerMins / totalTaskMins) * 100) : 100;
  const managerPercentage = 100 - makerPercentage;

  // Context-Switching Guard (alternating maker & manager tasks creates high cognitive thrash)
  let rapidSwitches = 0;
  for (let i = 1; i < tasks.length; i++) {
    const prevRole = tasks[i - 1].taskRole || 'maker';
    const currRole = tasks[i].taskRole || 'maker';
    if (prevRole !== currRole) rapidSwitches++;
  }
  const hasContextSwitchingPenalty = rapidSwitches >= 3;

  // Ivy Lee sequential active task
  const uncompletedTasks = tasks.filter((t) => !t.completed);
  const activeIvyLeeTask = uncompletedTasks[0] || null;

  const isSurvival = Boolean(userState?.survivalMode);
  const anchorTask = isSurvival ? tasks.find((t) => !t.completed) : null;
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <div className="space-y-5 transition-colors duration-200">
      {/* Survival Mode MVD Banner */}
      {isSurvival && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/30 text-amber-950 dark:text-amber-200 flex items-start justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-sm">
                  {isAr ? 'وضع البقاء والحد الأدنى الفعال (MVD Survival Mode) 🛡️' : 'MVD Survival Mode Active 🛡️'}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-mono">
                  1 Task = 100% Flame Protection
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                {isAr
                  ? 'أنت اليوم في وضع الطاقة المنخفضة أو الظرف الطارئ. إنجاز مهمة أساسية واحدة فقط (Anchor Task) كافٍ تماماً لحماية شعلتك ونجاح يومك دون أي ضغط أو تأنيب ضمير.'
                  : 'You are in emergency/low-energy mode today. Completing just ONE anchor task protects 100% of your streak with zero guilt.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rhythm & Profile Status Header */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xl shadow-2xs">
            {activeProfile?.avatarEmoji || '⚡'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {activeProfile?.name || (isAr ? 'الملف الشخصي' : 'Profile')}
              </span>
              {activeProfile?.customRoleTitle && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium">
                  {activeProfile.customRoleTitle}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span>{isAr ? rhythm.titleAr : rhythm.titleEn}</span>
              <span>•</span>
              <span className="font-mono">{todayDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-xl text-xs font-bold ${
              rhythm.isRestDay
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : rhythm.isHalfDay
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-cyan-300 border border-sky-300 dark:border-sky-800'
            }`}
          >
            {isAr ? rhythm.badgeAr : rhythm.rhythm}
          </span>
          {rhythm.targetSessions > 0 ? (
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              🎯 {completedSessionsCount} / {rhythm.targetSessions} {isAr ? 'جلسات' : 'sessions'}
            </span>
          ) : (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5" />
              <span>{isAr ? 'راحة تامة' : 'Rest Mode'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Sunday Rest Oasis Card */}
      {rhythm.isRestDay && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shrink-0 mt-0.5 shadow-sm">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  {isAr ? rhythm.titleAr : rhythm.titleEn}
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                  {isAr ? rhythm.descAr : `${rhythm.dayNameEn} is your day off! No forced tasks, streak is 100% protected.`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRestDayWorkArea(!showRestDayWorkArea)}
              className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>{showRestDayWorkArea ? (isAr ? 'إخفاء مساحة العمل' : 'Hide Work') : (isAr ? 'فتح جلسة خفيفة اختيارية' : 'Open Optional Work')}</span>
              {showRestDayWorkArea ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Sunday Rest Ideas */}
          {domainPreset.restDayIdeas.length > 0 && (
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>{isAr ? 'أفكار لتجديد طاقتك:' : 'Recharge Ideas:'}</span>
              </span>
              {domainPreset.restDayIdeas.map((idea, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-white/90 dark:bg-zinc-900/90 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-2xs"
                >
                  🌿 {idea}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saturday Half-Day Sprint Card */}
      {rhythm.isHalfDay && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/40 dark:via-zinc-900 dark:to-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0 shadow-sm">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  {isAr ? rhythm.titleAr : rhythm.titleEn}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold">
                  {isAr ? '2 إلى 3 جلسات فقط' : '2-3 Sessions Max'}
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                {isAr ? rhythm.descAr : 'Saturday is half-day: wrap up weekly items early and enjoy the rest of your day!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Productivity Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-cyan-500/20 text-sky-700 dark:text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase block">
              {isAr ? 'جلسات اليوم' : 'Sessions Today'}
            </span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-zinc-100">
              {completedSessionsCount}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase block">
              {isAr ? 'التركيز الصافي' : 'Net Focus Time'}
            </span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-zinc-100">
              {totalFocusMinutes} {isAr ? 'دقيقة' : 'min'}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase block">
              {isAr ? 'المهام المنجزة' : 'Tasks Done'}
            </span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-zinc-100">
              {tasks.filter((t) => t.completed).length} / {tasks.length}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase block">
              {isAr ? 'حراسة اليقظة' : 'Attention Guard'}
            </span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-zinc-100">
              {surfedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      {rhythm.isRestDay && !showRestDayWorkArea ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/40 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-3xl">
            🌴
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isAr ? `عطلة ${rhythm.dayNameAr} سعيدة ومباركة! 🌴` : `Happy Restful ${rhythm.dayNameEn}! 🌴`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {isAr
                ? `اليوم ${rhythm.dayNameAr} هو يوم عطلتك: استمتع بالراحة، النوم الكافي، قضاء الوقت مع العائلة، وممارسة هواياتك. لوحة العمل في وضع الاسترخاء التام، وسلسلة التتابع محمية بدون أي ضغوط!`
                : `Enjoy your ${rhythm.dayNameEn} rest, quality family time, and hobbies. Your streak is protected, see you recharged tomorrow!`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRestDayWorkArea(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
          >
            {isAr ? '✍️ فتح جلسة تركيز خفيفة اختيارية' : 'Open optional light focus session'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Focus Session Engine (Timer, Modes, Sounds) */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-5 shadow-xs">
          {/* Header & Focus Mode Switcher */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-700 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>{t('workday_planner_title')}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsSanctuaryOpen(true);
                  }}
                  className="py-1 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title={isAr ? 'دخول وضع التركيز العميق وعزل المشتتات' : 'Enter Deep Focus Sanctuary'}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isAr ? 'خلوة التركيز 🛡️' : 'Deep Focus 🛡️'}</span>
                </button>
                {isBreakPhase && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold animate-pulse">
                    ☕ {isAr ? 'فترة استراحة' : 'Rest Break'} ({restMin}m)
                  </span>
                )}
              </div>
            </div>

            {/* Mode Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              {[
                { id: 'quick_20', label: '20/3m', desc: isAr ? '✨ المقترحة لك' : 'Optimal' },
                { id: 'pomodoro_25', label: '25/5m', desc: 'Pomodoro' },
                { id: 'deep_50', label: '50/10m', desc: 'Deep Work' },
                { id: 'flow_90', label: '90/15m', desc: 'Flow' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setFocusMode(m.id as FocusSessionMode);
                    timer.stopTimer();
                    setIsBreakPhase(false);
                  }}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    focusMode === m.id
                      ? 'bg-sky-600 border-sky-600 text-white shadow-sm font-bold'
                      : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-sky-400'
                  }`}
                >
                  <span className="text-xs block font-mono font-bold">{m.label}</span>
                  <span className="text-[10px] opacity-80 block">{m.desc}</span>
                </button>
              ))}
            </div>

            {/* Prayer-Aware Focus Block (التقريب الزمني الذكي للصلوات) */}
            {nextPrayer && nextPrayer.minutesRemaining > 5 && nextPrayer.minutesRemaining <= 120 && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2 shadow-2xs mt-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-sm shrink-0">
                    🕌
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                        {isAr
                          ? `سويعة إنجاز حتى أذان ${nextPrayer.arabicName}`
                          : `Sprint until ${nextPrayer.englishName}`}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/25 text-emerald-800 dark:text-emerald-300">
                        {prayerSprintMinutes} {isAr ? 'دقيقة' : 'min'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                      {isAr
                        ? `ينتهي قبل الأذان بدقيقتين للتهيئة والوضوء (الأذان: ${nextPrayer.formattedTime})`
                        : `Ends 2m before Adhan at ${nextPrayer.formattedTime}`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setFocusMode('custom');
                    setCustomMinutes(prayerSprintMinutes);
                    timer.stopTimer();
                    setIsBreakPhase(false);
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95 ${
                    focusMode === 'custom' && customMinutes === prayerSprintMinutes
                      ? 'bg-emerald-600 text-white font-black'
                      : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-800 dark:text-emerald-200 hover:text-white border border-emerald-500/30'
                  }`}
                >
                  {focusMode === 'custom' && customMinutes === prayerSprintMinutes
                    ? (isAr ? 'مُفعّل ✓' : 'Active ✓')
                    : (isAr ? `تطبيق (${prayerSprintMinutes} د)` : `Apply (${prayerSprintMinutes}m)`)}
                </button>
              </div>
            )}
          </div>

          {/* Active Task Working Banner */}
          {activeTask ? (
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-cyan-950/40 border border-sky-200 dark:border-cyan-800/50 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <Target className="w-4 h-4 text-sky-600 dark:text-cyan-400 shrink-0" />
                <span className="font-bold text-sky-900 dark:text-cyan-200 truncate">
                  {t('active_working_on')} {activeTask.title}
                </span>
              </div>
              <button
                onClick={() => setActiveTaskId(null)}
                className="text-[10px] px-2 py-1 rounded-md bg-white dark:bg-zinc-900 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {isAr ? 'إلغاء التحديد' : 'Deselect'}
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-500 dark:text-zinc-400">
              {t('select_task_to_focus')}
            </div>
          )}

          {/* Timer Clock Dial */}
          <div className="relative flex flex-col items-center justify-center py-2">
            <div
              className={`w-48 h-48 sm:w-52 sm:h-52 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500 shadow-inner ${
                isBreakPhase
                  ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                  : timer.isRunning
                  ? 'border-sky-500 bg-sky-50/30 dark:bg-zinc-950'
                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950'
              }`}
            >
              <span className="text-5xl font-mono font-black tracking-tight text-slate-900 dark:text-zinc-100">
                {timer.remainingSec > 0
                  ? formatTime(timer.remainingSec)
                  : `${isBreakPhase ? restMin : workMin}:00`}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
                {isBreakPhase ? (isAr ? 'استراحة واستجمام' : 'Break Time') : (isAr ? 'سويعة إنجاز هادئة' : 'Deep Focus Sprint')}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {!timer.isRunning ? (
              <button
                onClick={timer.remainingSec > 0 ? handleResume : handleStartWork}
                className="py-3 px-8 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{timer.remainingSec > 0 ? (isAr ? 'متابعة الإنجاز' : t('resume_focus_session')) : (isAr ? 'بدء سويعة الإنجاز ⚡' : t('start_focus_session'))}</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="py-3 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>{isAr ? 'إيقاف مؤقت' : t('pause_focus_session')}</span>
              </button>
            )}

            <button
              onClick={handleReset}
              title="إعادة ضبط / Reset"
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {onOpenTwoMinuteRule && (
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  onOpenTwoMinuteRule(activeTask?.title);
                }}
                title={isAr ? 'قاعدة الدقيقتين: ابدأ بـ 120 ثانية فقط لكسر حاجز المقاومة' : '2-Minute Rule: Kickstart with 120s'}
                className="py-3 px-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <Zap className="w-4 h-4 fill-amber-500 text-amber-600 dark:text-amber-400" />
                <span>{isAr ? '⚡ 2 دقيقة' : '⚡ 2-Min'}</span>
              </button>
            )}
          </div>

          {/* Ambient Sound Selector & Urge Surfing */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                {isAr ? 'الصوت:' : 'Sound:'}
              </span>
              {(['none', 'brown', 'rain', 'alpha', 'theta'] as AmbientSoundType[]).map((snd) => (
                <button
                  key={snd}
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setAmbientSound(snd);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    ambientSound === snd
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  {snd === 'none' ? <VolumeX className="w-3 h-3" /> : snd}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                soundSynth.playTactileClick();
                setIsUrgeOpen(true);
                setUrgeSeconds(60);
              }}
              className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Waves className="w-3.5 h-3.5" />
              <span>{isAr ? 'مقاومة التشتت (60ث) 🌊' : 'Urge Control (60s) 🌊'}</span>
            </button>
          </div>

          {/* Defer to Buffer */}
          {onDeferToBuffer && (
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>{t('defer_hint')}</span>
              <button
                onClick={() => {
                  const taskTitle = activeTask?.title || (isAr ? 'جلسة عمل مؤجلة' : 'Deferred Focus Task');
                  onDeferToBuffer(taskTitle, workMin);
                }}
                className="py-1 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-500/30 text-xs cursor-pointer"
              >
                {t('defer_to_buffer')} ({bufferAvailableCount}/2)
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Workday Tasks Backlog & Schedule */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                {t('workday_tasks_title')}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Ivy Lee Sequential Lock Mode Toggle */}
              <button
                type="button"
                onClick={handleToggleIvyLee}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  ivyLeeLockEnabled
                    ? 'bg-amber-500/15 border-amber-400 text-amber-800 dark:text-amber-300 shadow-xs ring-1 ring-amber-400/40'
                    : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
                title={
                  isAr
                    ? 'وضع آيفي لي 6: تركيز تسلسلي صارم، يُقفل الانتقال لأي مهمة حتى إتمام المهمة الحالية لمنع التشتت'
                    : 'Ivy Lee Sequential Lock: locks subsequent tasks until current one is finished'
                }
              >
                <span>{ivyLeeLockEnabled ? '🔒' : '🔓'}</span>
                <span>{isAr ? 'قفل آيفي لي' : 'Ivy Lee Lock'}</span>
              </button>

              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-cyan-300 text-xs font-bold flex items-center gap-1 border border-sky-200 dark:border-sky-800/40 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('add_work_task')}</span>
              </button>
            </div>
          </div>

          {/* Quick Domain-Tailored Task Chips */}
          <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200 dark:border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {isAr
                    ? `اقتراحات سريعة لمجالك (${domainPreset.titleAr}):`
                    : `Quick Suggestions (${domainPreset.titleEn}):`}
                </span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                {isAr ? 'اضغط للإضافة الفورية' : '1-tap to add'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(rhythm.isHalfDay ? domainPreset.halfDayTasks : domainPreset.weekdayTasks).map(
                (preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPresetTask(preset.title, preset.durationMin)}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 hover:bg-sky-50 dark:hover:bg-cyan-950/50 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs hover:border-sky-300 dark:hover:border-cyan-700 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                    <span>{preset.title}</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                      {preset.durationMin}m
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Add Task Form */}
          {showAddTask && (
            <form
              onSubmit={handleAddTask}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-sky-200 dark:border-sky-900/60 space-y-3 animate-fade-in"
            >
              <input
                type="text"
                placeholder={t('task_title_placeholder')}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-sky-500 font-medium"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 min-w-[120px] flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t('task_estimated_min')}:</span>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    step={5}
                    value={newTaskEstimate}
                    onChange={(e) => setNewTaskEstimate(Number(e.target.value))}
                    className="w-16 py-1 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold text-center"
                  />
                </div>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                  className="py-1 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium"
                >
                  <option value="high">{t('task_priority_high')}</option>
                  <option value="medium">{t('task_priority_medium')}</option>
                  <option value="normal">{t('task_priority_normal')}</option>
                </select>

                {/* Maker vs Manager Selector */}
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setNewTaskRole('maker')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      newTaskRole === 'maker'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    🎨 {isAr ? 'صانع' : 'Maker'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTaskRole('manager')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      newTaskRole === 'manager'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    📋 {isAr ? 'مدير' : 'Manager'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="py-1 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إضافة' : 'Add'}
                </button>
              </div>
            </form>
          )}

          {/* Maker vs Manager Ratio & Context-Switching Guard */}
          {tasks.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-zinc-950/70 rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                  <span className="text-slate-800 dark:text-zinc-200">
                    {isAr ? 'صانع (عمل عميق):' : 'Maker:'} {makerPercentage}% ({totalMakerMins}m)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-slate-600 dark:text-zinc-400">
                    {isAr ? 'مدير (تنسيق واجتماعات):' : 'Manager:'} {managerPercentage}% ({totalManagerMins}m)
                  </span>
                </div>
              </div>

              {/* Segmented Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden flex">
                <div
                  style={{ width: `${makerPercentage}%` }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all duration-500"
                />
                <div
                  style={{ width: `${managerPercentage}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                />
              </div>

              {hasContextSwitchingPenalty && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                  <span>⚠️</span>
                  <span>
                    {isAr
                      ? 'تنبيه التبديل الذهني: هناك تنقل متكرر بين مهام الصانع والمدير! يُنصح بجدولة مهام المدير في كتلة واحدة بعد الظهر لحماية التركيز العميق.'
                      : 'Context Switch Warning: Alternating frequently between Maker and Manager tasks costs cognitive momentum.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-2">
            {tasks.map((task) => {
              const isCurrent = activeTaskId === task.id;
              const isIvyLeeActive =
                ivyLeeLockEnabled && !task.completed && task.id === activeIvyLeeTask?.id;
              const isIvyLeeLocked =
                ivyLeeLockEnabled && !task.completed && task.id !== activeIvyLeeTask?.id;
              const isMaker = (task.taskRole || 'maker') === 'maker';

              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    task.completed
                      ? 'bg-slate-50/50 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-900 opacity-60'
                      : isIvyLeeActive
                      ? 'bg-amber-50/60 dark:bg-amber-950/25 border-amber-400 dark:border-amber-500 shadow-sm ring-2 ring-amber-400/40'
                      : isIvyLeeLocked
                      ? 'bg-slate-50/40 dark:bg-zinc-950/30 border-slate-200/80 dark:border-zinc-900/80 opacity-75'
                      : isCurrent
                      ? 'bg-sky-50/80 dark:bg-cyan-950/30 border-sky-400 dark:border-cyan-600 shadow-xs'
                      : isSurvival && task.id === anchorTask?.id
                      ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-400 dark:border-amber-600/70 shadow-xs ring-1 ring-amber-400/30'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="cursor-pointer text-emerald-600 dark:text-emerald-400 shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950/60" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-zinc-700" />
                      )}
                    </button>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs font-bold block truncate ${
                            task.completed
                              ? 'line-through text-slate-400 dark:text-zinc-600'
                              : 'text-slate-900 dark:text-zinc-100'
                          }`}
                        >
                          {task.title}
                        </span>
                        {isIvyLeeActive && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 shrink-0">
                            🎯 {isAr ? 'المهمة النشطة #1' : 'Ivy Lee Active #1'}
                          </span>
                        )}
                        {isIvyLeeLocked && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 shrink-0 flex items-center gap-1">
                            🔒 {isAr ? 'مقفلة حتى إتمام #1' : 'Locked until #1 done'}
                          </span>
                        )}
                        {isSurvival && !task.completed && task.id === anchorTask?.id && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/60 shrink-0">
                            ⭐ {isAr ? 'مهمة النجاة 100%' : 'MVD Anchor'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                        <span>{task.estimatedMinutes}m est</span>
                        {task.actualMinutes > 0 && (
                          <span className="text-sky-700 dark:text-cyan-400 font-bold">
                            ({task.actualMinutes}m actual)
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            task.priority === 'high'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* Maker vs Manager Toggle Chip */}
                        <button
                          type="button"
                          onClick={() => handleToggleTaskRole(task)}
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold cursor-pointer transition-all ${
                            isMaker
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                          }`}
                          title={isAr ? 'اضغط للتبديل بين صانع (عميق) ومدير (تنسيق)' : 'Toggle Maker / Manager'}
                        >
                          {isMaker ? (isAr ? '🎨 صانع' : '🎨 Maker') : (isAr ? '📋 مدير' : '📋 Manager')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!task.completed && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAiDeconstructTask(task)}
                          disabled={deconstructingTaskId === task.id}
                          title={isAr ? 'تفكيك المهمة بالذكاء الاصطناعي لـ 3 خطوات مجهرية' : 'Deconstruct with AI into 3 tiny steps'}
                          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800/40"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${deconstructingTaskId === task.id ? 'animate-spin' : ''}`} />
                        </button>

                        {onOpenTwoMinuteRule && (
                          <button
                            type="button"
                            onClick={() => {
                              soundSynth.playTactileClick();
                              haptic.vibrateLight();
                              setActiveTaskId(task.id);
                              onOpenTwoMinuteRule(task.title);
                            }}
                            title={isAr ? 'بدء قاعدة الدقيقتين (120 ثانية) لهذه المهمة ⚡' : 'Start 2-Minute Rule (120s) ⚡'}
                            className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer border border-amber-200 dark:border-amber-800/40"
                          >
                            <Zap className="w-3.5 h-3.5 fill-amber-500/20" />
                          </button>
                        )}

                        {isIvyLeeLocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              soundSynth.playWarningSound();
                              haptic.vibrateLight();
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed flex items-center gap-1 border border-slate-200 dark:border-zinc-700"
                            title={
                              isAr
                                ? 'مقفلة بوضع آيفي لي: أنجز المهمة الأولى أولاً لمنع التشتت الذهني!'
                                : 'Locked by Ivy Lee: complete Task #1 first!'
                            }
                          >
                            <span>🔒</span>
                            <span>{isAr ? 'مقفل' : 'Locked'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              soundSynth.playTactileClick();
                              setActiveTaskId(task.id);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-zinc-800 hover:bg-sky-50 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            {isCurrent ? (isAr ? 'نشطة ⚡' : 'Active ⚡') : (isAr ? 'تركيز' : 'Focus')}
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 dark:text-zinc-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                {t('no_tasks_today')}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Urge Control Wave Overlay Modal */}
      {isUrgeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-blue-400/80 dark:border-blue-700 text-center space-y-5 shadow-2xl relative overflow-hidden">
            {/* Box Breathing Circle (4s Inhale -> 4s Hold -> 4s Exhale -> 4s Rest) */}
            {(() => {
              const cycleSec = (60 - urgeSeconds) % 16;
              let phaseTitle = isAr ? 'شهيق عميق من الأنف (4ث)' : 'Deep Inhale (4s)';
              let phaseColor = 'text-sky-600 dark:text-sky-400';
              let circleClass = 'scale-115 border-sky-400 bg-sky-50 dark:bg-sky-950/60 shadow-lg shadow-sky-500/20';

              if (cycleSec >= 4 && cycleSec < 8) {
                phaseTitle = isAr ? 'حبس النفس بهدوء (4ث)' : 'Hold Breath (4s)';
                phaseColor = 'text-indigo-600 dark:text-indigo-400';
                circleClass = 'scale-125 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 shadow-xl shadow-indigo-500/30';
              } else if (cycleSec >= 8 && cycleSec < 12) {
                phaseTitle = isAr ? 'زفير بطيء ومريح (4ث)' : 'Slow Exhale (4s)';
                phaseColor = 'text-teal-600 dark:text-teal-400';
                circleClass = 'scale-95 border-teal-400 bg-teal-50 dark:bg-teal-950/60 shadow-md shadow-teal-500/20';
              } else if (cycleSec >= 12) {
                phaseTitle = isAr ? 'سكون وفراغ واسترخاء (4ث)' : 'Rest & Stillness (4s)';
                phaseColor = 'text-blue-600 dark:text-blue-400';
                circleClass = 'scale-90 border-blue-400 bg-blue-50 dark:bg-blue-950/50';
              }

              return (
                <div className="space-y-4">
                  <div className={`w-28 h-28 mx-auto rounded-full border-3 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${circleClass}`}>
                    <span className="text-3xl font-mono font-black text-slate-900 dark:text-white">
                      {urgeSeconds}s
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {isAr ? 'ركوب الموجة' : 'Urge Surfing'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className={`text-xs font-black tracking-wide ${phaseColor} block transition-colors duration-500`}>
                      🧘 {phaseTitle}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                      {t('urge_surfing_title')}
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      {t('urge_surfing_desc')}
                    </p>
                  </div>
                </div>
              );
            })()}

            {urgeSeconds === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-bounce">
                🎉 {t('urge_surfing_resisted')}
              </div>
            ) : (
              <div className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 py-1.5 px-3 rounded-full inline-block">
                🌊 الرغبة كالموجة: ترتفع ثم تبلغ ذروتها وتتلاشى تماماً دون أن تستجيب لها
              </div>
            )}

            <button
              onClick={() => setIsUrgeOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black text-xs font-bold cursor-pointer transition-all active:scale-95"
            >
              {isAr ? 'إغلاق والعودة للتركيز' : 'Close and Return to Focus'}
            </button>
          </div>
        </div>
      )}

      {/* Dopamine Sanctuary (محراب الاحتجاب) & 5-Second Friction Vault */}
      {isSanctuaryOpen && (
        <div className="fixed inset-0 z-50 bg-[#050507] text-white flex flex-col justify-between p-6 sm:p-10 select-none backdrop-blur-3xl animate-fade-in">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wide text-zinc-100 flex items-center gap-2">
                  <span>{isAr ? 'خلوة التركيز العميق وعزل المشتتات' : 'Deep Focus Sanctuary'}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {isAr ? 'عزل كامل' : 'Total Isolation'}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  {isAr ? 'صفر إشعارات، صفر محفزات لحظية، تدفق ذهني كامل' : 'Zero notifications, zero dopamine traps, pure flow state'}
                </p>
              </div>
            </div>

            {/* Ambient Sound Selector within Sanctuary */}
            <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-xl">
              <span className="text-[10px] text-zinc-400 px-1 font-bold">{isAr ? 'الخلفية:' : 'Sound:'}</span>
              {(['none', 'brown', 'rain', 'alpha', 'theta'] as AmbientSoundType[]).map((snd) => (
                <button
                  key={snd}
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setAmbientSound(snd);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    ambientSound === snd
                      ? 'bg-cyan-500 text-black font-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {snd === 'none' ? <VolumeX className="w-3 h-3" /> : snd}
                </button>
              ))}
            </div>
          </div>

          {/* Center Focus Orb & Giant Tabular Timer */}
          <div className="flex flex-col items-center justify-center my-auto space-y-6 text-center">
            {/* Active Task Banner */}
            {activeTask ? (
              <div className="max-w-2xl px-6 py-3 rounded-2xl bg-zinc-900/70 border border-cyan-500/20 backdrop-blur-md">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                  {isAr ? 'الهدف الموجه الحالي' : 'Active Singular Focus'}
                </span>
                <p className="text-xl sm:text-2xl font-black text-zinc-100 truncate">
                  {activeTask.title}
                </p>
              </div>
            ) : (
              <div className="text-zinc-500 text-sm font-medium">
                {isAr ? 'جلسة تدفق حر بدون مهام محددة' : 'Open Flow Deep Focus'}
              </div>
            )}

            {/* Giant tabular digits with cyan glow */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="text-8xl sm:text-9xl font-black font-mono tracking-tighter text-zinc-100 tabular-nums drop-shadow-[0_0_50px_rgba(6,182,212,0.18)]">
                {timer.remainingSec > 0
                  ? formatTime(timer.remainingSec)
                  : `${isBreakPhase ? restMin : workMin}:00`}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs uppercase font-mono tracking-widest text-zinc-400">
                  {isBreakPhase
                    ? (isAr ? 'فترة استراحة هادئة' : 'Quiet Rest Interval')
                    : (isAr ? 'عقل حاضر • صفر مشتتات' : 'Deep Work State')}
                </span>
              </div>
            </div>

            {/* Quick Play/Pause Control */}
            <div className="flex items-center gap-3 pt-2">
              {!timer.isRunning ? (
                <button
                  onClick={timer.remainingSec > 0 ? handleResume : handleStartWork}
                  className="py-3 px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>{timer.remainingSec > 0 ? (isAr ? 'متابعة الجلسة' : 'Resume') : (isAr ? 'بدء سويعة الإنجاز' : 'Start Focus')}</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="py-3 px-8 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm flex items-center gap-2 border border-zinc-700 active:scale-95 transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Bar: 5-Second Friction Vault */}
          <div className="flex flex-col items-center space-y-3 pt-6 border-t border-zinc-900">
            <div className="text-center space-y-1">
              <p className="text-xs text-zinc-500">
                {isAr
                  ? 'لحماية تدفقك الذهني من الاندفاع اللحظي، كسر الخلوة يتطلب ضغطاً متواصلاً لمدة 5 ثوانٍ'
                  : 'To guard deep flow against impulsive tab switching, exiting requires a continuous 5-second hold'}
              </p>
            </div>

            {/* Hold Button with Progress Bar */}
            <div className="relative w-full max-w-sm">
              <button
                type="button"
                onMouseDown={startExitHold}
                onMouseUp={cancelExitHold}
                onMouseLeave={cancelExitHold}
                onTouchStart={startExitHold}
                onTouchEnd={cancelExitHold}
                className="relative w-full overflow-hidden py-3.5 px-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 select-none active:scale-[0.99] transition-transform cursor-pointer"
              >
                {/* Progress fill */}
                <div
                  className="absolute inset-0 bg-red-950/60 border-r-2 border-red-500 transition-all duration-75 pointer-events-none"
                  style={{ width: `${exitHoldProgress}%` }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-400" />
                  {exitHoldProgress > 0
                    ? (isAr ? `جاري إنهاء الجلسة... (${Math.round(exitHoldProgress)}%)` : `Exiting session... (${Math.round(exitHoldProgress)}%)`)
                    : (isAr ? 'اضغط مطولاً لمدة 5 ثوانٍ للإنهاء 🔒' : 'Press & Hold 5s to Exit 🔒')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
