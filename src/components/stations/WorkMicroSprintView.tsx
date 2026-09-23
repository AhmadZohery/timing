import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Coffee,
  CheckCircle,
  Wind,
  ArrowLeft,
  ArrowRight,
  Waves,
  X,
  Target,
  FileCheck,
  Zap,
  GraduationCap,
} from 'lucide-react';
import { useWorkerTimer } from '../../hooks/useWorkerTimer';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { WorkdayPlanner } from '../work/WorkdayPlanner';
import { SelfLearningTracker } from '../learning/SelfLearningTracker';
import { db } from '../../db/db';

interface WorkMicroSprintViewProps {
  isCompleted: boolean;
  onCompleteStation: () => void;
  onNextStation: () => void;
  onDeferToBuffer: (taskTitle: string, durationMin: number) => void;
  bufferAvailableCount: number;
  todayDate?: string;
  onOpenTwoMinuteRule?: (taskTitle?: string) => void;
}

type SprintPhase = 'LEARNING_SPRINT' | 'ONE_SEC_FRICTION' | 'SOCIAL_BREAK' | 'DONE';

export const WorkMicroSprintView: React.FC<WorkMicroSprintViewProps> = ({
  isCompleted,
  onCompleteStation,
  onNextStation,
  onDeferToBuffer,
  bufferAvailableCount,
  todayDate,
  onOpenTwoMinuteRule,
}) => {
  const { t, language } = useTranslation();
  const effectiveToday = todayDate || new Date().toISOString().split('T')[0];

  const [workViewMode, setWorkViewModeState] = useState<'planner' | 'sprint' | 'learning_tracker'>(() => {
    return (localStorage.getItem('midmar_work_view_mode') as 'planner' | 'sprint' | 'learning_tracker') || 'planner';
  });
  const setWorkViewMode = (mode: 'planner' | 'sprint' | 'learning_tracker') => {
    setWorkViewModeState(mode);
    localStorage.setItem('midmar_work_view_mode', mode);
  };
  const [phase, setPhase] = useState<SprintPhase>(isCompleted ? 'DONE' : 'LEARNING_SPRINT');
  const [frictionSeconds, setFrictionSeconds] = useState(3);

  // Focus Task & Checkpoints
  const [focusTask, setFocusTask] = useState(
    () => localStorage.getItem('midmar_sprint_focus') || ''
  );
  const [checkpoints, setCheckpoints] = useState<Array<{ id: number; text: string; done: boolean }>>(
    () => {
      const saved = localStorage.getItem('midmar_sprint_checkpoints');
      return saved
        ? JSON.parse(saved)
        : [
            { id: 1, text: '', done: false },
            { id: 2, text: '', done: false },
            { id: 3, text: '', done: false },
          ];
    }
  );
  const [sprintOutput, setSprintOutput] = useState(
    () => localStorage.getItem('midmar_sprint_output') || ''
  );

  // Urge Surfing (ACT Behavioral Therapy)
  const [isUrgeSurfing, setIsUrgeSurfing] = useState(false);
  const [urgeSeconds, setUrgeSeconds] = useState(60);
  const [surfedCount, setSurfedCount] = useState(() => {
    return Number(localStorage.getItem('midmar_urge_count') || '0');
  });

  // 20-minute learning timer (1200 sec)
  const learningTimer = useWorkerTimer();
  // 15-minute social media break timer (900 sec)
  const socialTimer = useWorkerTimer();

  // Handle completion of 20m learning sprint
  const handleLearningComplete = async () => {
    soundSynth.playCompletionChime();
    haptic.vibrateWorkDone();
    setPhase('ONE_SEC_FRICTION');
    setFrictionSeconds(3);

    // Auto-log 20 completed minutes directly to db.workday_tasks matching focusTask
    if (focusTask.trim()) {
      try {
        const existing = await db.workday_tasks
          .where('date')
          .equals(effectiveToday)
          .filter((t) => t.title.toLowerCase().includes(focusTask.trim().toLowerCase()))
          .first();

        if (existing) {
          await db.workday_tasks.update(existing.id, {
            actualMinutes: (existing.actualMinutes || 0) + 20,
          });
        } else {
          await db.workday_tasks.add({
            id: `wt_sprint_${Date.now()}`,
            title: focusTask.trim(),
            estimatedMinutes: 20,
            actualMinutes: 20,
            completed: false,
            priority: 'high',
            date: effectiveToday,
            taskRole: 'maker',
          });
        }
      } catch (e) {
        console.warn('Auto-log sprint to workday_tasks notice:', e);
      }
    }
  };

  // 3-second breathing friction countdown
  useEffect(() => {
    if (phase === 'ONE_SEC_FRICTION') {
      if (frictionSeconds > 0) {
        const timer = setTimeout(() => {
          setFrictionSeconds((prev) => prev - 1);
          soundSynth.playTactileClick();
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setPhase('SOCIAL_BREAK');
        socialTimer.startTimer(15 * 60, () => {
          soundSynth.playCompletionChime();
          haptic.vibrateWorkDone();
          setPhase('DONE');
        });
      }
    }
  }, [phase, frictionSeconds]);

  // 60-second Urge Surfing Breathing Countdown
  useEffect(() => {
    let timer: any;
    if (isUrgeSurfing && urgeSeconds > 0) {
      timer = setTimeout(() => {
        setUrgeSeconds((prev) => prev - 1);
        if (urgeSeconds % 4 === 0) {
          haptic.vibrateLight();
        }
      }, 1000);
    } else if (isUrgeSurfing && urgeSeconds === 0) {
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      const newCount = surfedCount + 1;
      setSurfedCount(newCount);
      localStorage.setItem('midmar_urge_count', String(newCount));
    }
    return () => clearTimeout(timer);
  }, [isUrgeSurfing, urgeSeconds, surfedCount]);

  const handleStartUrgeSurfing = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setUrgeSeconds(60);
    setIsUrgeSurfing(true);
  };

  const handleCloseUrgeSurfing = () => {
    soundSynth.playTactileClick();
    setIsUrgeSurfing(false);
  };

  const handleToggleCheckpoint = (id: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const updated = checkpoints.map((cp) => (cp.id === id ? { ...cp, done: !cp.done } : cp));
    setCheckpoints(updated);
    localStorage.setItem('midmar_sprint_checkpoints', JSON.stringify(updated));
  };

  const handleUpdateCheckpointText = (id: number, text: string) => {
    const updated = checkpoints.map((cp) => (cp.id === id ? { ...cp, text } : cp));
    setCheckpoints(updated);
    localStorage.setItem('midmar_sprint_checkpoints', JSON.stringify(updated));
  };

  const handleStartLearning = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    learningTimer.startTimer(20 * 60, handleLearningComplete);
  };

  const handlePauseLearning = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    learningTimer.pauseTimer();
  };

  const handleResumeLearning = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    learningTimer.resumeTimer();
  };

  const handleResetLearning = () => {
    soundSynth.playTactileClick();
    learningTimer.stopTimer();
  };

  const handleDefer = () => {
    if (bufferAvailableCount <= 0) {
      alert(language === 'ar' ? 'لقد استنفدت الحد الأقصى لتأجيل المهام لهذا الأسبوع!' : 'You have reached the maximum weekly buffer deferral limit!');
      return;
    }
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onDeferToBuffer(language === 'ar' ? 'جلسة التعلم والتركيز (20 دقيقة)' : 'Technical Learning Session (20 min)', 20);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-4 transition-colors duration-200">
      {/* Sleek Native Station Header Bar (Apple-Tier) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-l from-sky-500/10 via-white dark:via-zinc-900 to-white dark:to-zinc-900 border border-sky-500/20 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-700 dark:text-cyan-400 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-sky-700 dark:text-cyan-400 font-bold uppercase tracking-wider block">
              {t('station_2_badge')}
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 truncate">
              {t('station_2_heading')}
            </h2>
          </div>
        </div>

        <div className="shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-100 dark:bg-cyan-500/15 text-sky-800 dark:text-cyan-400 font-mono font-bold">
            +15 XP
          </span>
        </div>
      </div>

      {/* Work Mode Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        <button
          onClick={() => {
            soundSynth.playTactileClick();
            setWorkViewMode('planner');
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            workViewMode === 'planner'
              ? 'bg-white dark:bg-zinc-800 text-sky-700 dark:text-cyan-400 shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t('workday_planner_title')}</span>
        </button>

        <button
          onClick={() => {
            soundSynth.playTactileClick();
            setWorkViewMode('learning_tracker');
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            workViewMode === 'learning_tracker'
              ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
          <span className="truncate">{language === 'ar' ? 'مسار وسجل التعلم 📖' : 'Learning Tracker'}</span>
        </button>

        <button
          onClick={() => {
            soundSynth.playTactileClick();
            setWorkViewMode('sprint');
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            workViewMode === 'sprint'
              ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0 text-amber-500" />
          <span className="truncate">{language === 'ar' ? 'شوط 20 دقيقة' : 'Quick Sprint'}</span>
        </button>
      </div>

      {workViewMode === 'planner' ? (
        <WorkdayPlanner
          todayDate={effectiveToday}
          onDeferToBuffer={onDeferToBuffer}
          bufferAvailableCount={bufferAvailableCount}
          onOpenTwoMinuteRule={onOpenTwoMinuteRule}
        />
      ) : workViewMode === 'learning_tracker' ? (
        <SelfLearningTracker
          onRewardToast={(msg) => alert(msg)}
        />
      ) : (
        <>
          {/* Main Container depending on Phase */}
          {phase === 'LEARNING_SPRINT' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Sprint Timer Column */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-6 shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs text-sky-700 dark:text-cyan-400 font-bold uppercase tracking-wider">
                    {t('timer_learning_label')}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">{t('timer_learning_heading')}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {t('timer_learning_desc')}
                  </p>
                </div>

            {/* Clock Display */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-4 border-slate-200 dark:border-zinc-800 flex items-center justify-center bg-slate-50 dark:bg-zinc-950/60 shadow-inner">
                <span className="text-5xl font-mono font-black text-sky-600 dark:text-cyan-400 tracking-wider">
                  {learningTimer.remainingSec > 0
                    ? formatTime(learningTimer.remainingSec)
                    : '20:00'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {!learningTimer.isRunning ? (
                <button
                  onClick={
                    learningTimer.remainingSec > 0 ? handleResumeLearning : handleStartLearning
                  }
                  className="py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{learningTimer.remainingSec > 0 ? t('resume_sprint') : t('start_sprint')}</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseLearning}
                  className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  <Pause className="w-4 h-4" />
                  <span>{t('pause_sprint')}</span>
                </button>
              )}

              <button
                onClick={handleResetLearning}
                title="إعادة ضبط / Reset"
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Urge Surfing Trigger Button (Anti-Craving ACT Therapy) */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50/40 to-teal-50/60 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-teal-950/30 border border-blue-200 dark:border-blue-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-300">
                <Waves className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  <strong>{t('urge_surfing_surfed_count')}</strong> <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{surfedCount}</span>
                </span>
              </div>
              <button
                onClick={handleStartUrgeSurfing}
                className="w-full sm:w-auto py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Waves className="w-3.5 h-3.5" />
                <span>{t('urge_surfing_btn')}</span>
              </button>
            </div>

            {/* Defer to Buffer Button */}
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400">
              <span>{t('defer_hint')}</span>
              <button
                onClick={handleDefer}
                className="py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{t('defer_to_buffer')} ({t('buffer_remaining_count')} {bufferAvailableCount}/2)</span>
              </button>
            </div>
          </div>

          {/* Single Target Sprint Task & 3 Checkpoints Column */}
          <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {t('sprint_focus_label')}
              </h4>
            </div>
            <input
              type="text"
              placeholder={t('sprint_focus_placeholder')}
              value={focusTask}
              onChange={(e) => {
                setFocusTask(e.target.value);
                localStorage.setItem('midmar_sprint_focus', e.target.value);
              }}
              className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-sky-500 font-medium"
            />

            {/* 3 Micro-Checkpoints */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                {language === 'ar' ? '3 خطوات مرحلية لإنجاز الجلسة:' : '3 Micro-checkpoints for this session:'}
              </span>
              {checkpoints.map((cp, idx) => (
                <div key={cp.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleCheckpoint(cp.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                      cp.done
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'border-slate-300 dark:border-zinc-700 hover:border-sky-500'
                    }`}
                  >
                    {cp.done && <CheckCircle className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="text"
                    placeholder={`${language === 'ar' ? 'خطوة' : 'Step'} ${idx + 1}...`}
                    value={cp.text}
                    onChange={(e) => handleUpdateCheckpointText(cp.id, e.target.value)}
                    className={`flex-1 py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-sky-500 ${
                      cp.done ? 'line-through text-slate-400 dark:text-zinc-500' : ''
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Post-sprint Output Note */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  {t('sprint_output_label')}
                </span>
              </div>
              <input
                type="text"
                placeholder={t('sprint_output_placeholder')}
                value={sprintOutput}
                onChange={(e) => {
                  setSprintOutput(e.target.value);
                  localStorage.setItem('midmar_sprint_output', e.target.value);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: One-Sec Friction Breathing Pause */}
      {phase === 'ONE_SEC_FRICTION' && (
        <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-500/40 text-center space-y-5 shadow-sm">
          <div className="inline-flex p-3 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 animate-pulse">
            <Wind className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
              {t('one_sec_friction_title')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              {t('one_sec_friction_desc')}
            </p>
          </div>

          <div className="py-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-purple-50 dark:bg-purple-500/10 border-2 border-purple-400/50 flex items-center justify-center animate-breathe">
              <span className="text-4xl font-black font-mono text-purple-700 dark:text-purple-300">
                {frictionSeconds}
              </span>
            </div>
            <span className="text-xs text-purple-600 dark:text-purple-400 mt-2 block font-semibold">{t('one_sec_breathing_hint')}</span>
          </div>
        </div>
      )}

      {/* Phase 3: Social Media Break (15 min) with Coffee Badge */}
      {phase === 'SOCIAL_BREAK' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-500/30 text-center space-y-6 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
            <Coffee className="w-5 h-5 text-amber-600" />
            <span>{t('social_break_title')}</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {t('social_break_desc')}
          </p>

          <div className="relative inline-flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-4 border-amber-200 dark:border-amber-500/30 flex items-center justify-center bg-amber-50 dark:bg-zinc-950 shadow-inner">
              <span className="text-4xl font-mono font-black text-amber-700 dark:text-amber-400">
                {formatTime(socialTimer.remainingSec)}
              </span>
            </div>
          </div>

          <div>
            <button
              onClick={() => {
                socialTimer.stopTimer();
                setPhase('DONE');
              }}
              className="py-2.5 px-5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-semibold cursor-pointer shadow-xs"
            >
              {t('social_break_end_early')}
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Station Completion Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{t('station_2_heading')}</h4>
          <p className="text-[11px] text-slate-500 dark:text-zinc-500">
            {isCompleted ? (language === 'ar' ? 'تم كسب 15 نقطة اليوم!' : '15 Points Earned Today!') : (language === 'ar' ? 'اضغط لإضافة 15 نقطة والانتقال لمحطة الجيم.' : 'Confirm completion to advance to gym anchor.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted ? (
            <button
              onClick={() => {
                onCompleteStation();
                setPhase('DONE');
              }}
              className="py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
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

      {/* Urge Surfing Full Modal Overlay (ACT Therapy) */}
      {isUrgeSurfing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 border border-blue-500/30 p-6 sm:p-8 text-center text-white space-y-6 shadow-2xl relative">
            <button
              onClick={handleCloseUrgeSurfing}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Waves className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-blue-100">
                {t('urge_surfing_title')}
              </h3>
              <p className="text-xs text-blue-200/80 leading-relaxed max-w-md mx-auto">
                {t('urge_surfing_desc')}
              </p>
            </div>

            {/* Breathing Wave Animation Circle */}
            <div className="py-4 relative flex items-center justify-center">
              <div className="w-44 h-44 rounded-full border-4 border-blue-400/40 flex flex-col items-center justify-center bg-blue-600/10 shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-pulse">
                <span className="text-5xl font-mono font-black text-blue-200">
                  {urgeSeconds}
                </span>
                <span className="text-[11px] font-semibold text-blue-300/90 mt-1 uppercase tracking-wider">
                  {t('rest_timer_sec')}
                </span>
              </div>
            </div>

            {urgeSeconds > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-300 animate-pulse">
                  {t('urge_surfing_breathing')}
                </p>
                <span className="text-[10px] text-blue-400/70">
                  {language === 'ar' ? 'شهيق 4 ثوانٍ... احبس ثانيتين... زفير 4 ثوانٍ' : 'Inhale 4s... hold 2s... exhale 4s'}
                </span>
              </div>
            ) : (
              <div className="space-y-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40">
                <p className="text-sm font-bold text-emerald-300">
                  {t('urge_surfing_resisted')}
                </p>
                <button
                  onClick={handleCloseUrgeSurfing}
                  className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {language === 'ar' ? 'العودة إلى العمل الآن 🚀' : 'Back to work now 🚀'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
