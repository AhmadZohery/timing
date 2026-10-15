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
  Compass,
} from 'lucide-react';
import { useWorkerTimer } from '../../hooks/useWorkerTimer';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { WorkdayPlanner } from '../work/WorkdayPlanner';
import { SelfLearningTracker } from '../learning/SelfLearningTracker';
import { CourseStudyHub } from '../learning/CourseStudyHub';
import type { NiyyahPillar } from '../spiritual/NiyyahSanctuaryModal';
import type { AmbientSoundType } from '../../types';
import { db } from '../../db/db';
import confetti from 'canvas-confetti';
import { getBiologicalDate, upsertDailyLog, triggerCelebrationConfetti } from '../../utils/gamification';
import { AgileStandupModal } from '../work/AgileStandupModal';
import { ScopeDecisionMatrixModal } from '../work/ScopeDecisionMatrixModal';
import { ExecutiveFocusHUD } from '../work/ExecutiveFocusHUD';
import { ExecutiveEnglishStudioModal } from '../learning/ExecutiveEnglishStudioModal';

interface WorkMicroSprintViewProps {
  isCompleted: boolean;
  onCompleteStation: () => void;
  onNextStation: () => void;
  onDeferToBuffer: (taskTitle: string, durationMin: number) => void;
  bufferAvailableCount: number;
  todayDate?: string;
  onOpenTwoMinuteRule?: (taskTitle?: string) => void;
  onRewardToast?: (msg: string) => void;
  onOpenNiyyahModal?: (pillar?: NiyyahPillar) => void;
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
  onRewardToast,
  onOpenNiyyahModal,
}) => {
  const { t, language } = useTranslation();
  const effectiveToday = todayDate || getBiologicalDate();

  const [workViewMode, setWorkViewModeState] = useState<'planner' | 'sprint' | 'learning_tracker'>(() => {
    return (localStorage.getItem('midmar_work_view_mode') as 'planner' | 'sprint' | 'learning_tracker') || 'planner';
  });
  const setWorkViewMode = (mode: 'planner' | 'sprint' | 'learning_tracker') => {
    setWorkViewModeState(mode);
    localStorage.setItem('midmar_work_view_mode', mode);
  };
  const [learningSubTab, setLearningSubTabState] = useState<'courses' | 'sessions'>(() => {
    return (localStorage.getItem('midmar_learning_subtab') as 'courses' | 'sessions') || 'courses';
  });
  const setLearningSubTab = (tab: 'courses' | 'sessions') => {
    setLearningSubTabState(tab);
    localStorage.setItem('midmar_learning_subtab', tab);
  };

  useEffect(() => {
    const handleSwitchMode = (e: Event) => {
      const customEv = e as CustomEvent<{ mode?: 'planner' | 'sprint' | 'learning_tracker'; subTab?: 'courses' | 'sessions' }>;
      if (customEv.detail?.mode) {
        setWorkViewModeState(customEv.detail.mode);
        localStorage.setItem('midmar_work_view_mode', customEv.detail.mode);
      }
      if (customEv.detail?.subTab) {
        setLearningSubTabState(customEv.detail.subTab);
        localStorage.setItem('midmar_learning_subtab', customEv.detail.subTab);
      }
    };
    window.addEventListener('midmar_switch_work_mode', handleSwitchMode);
    return () => window.removeEventListener('midmar_switch_work_mode', handleSwitchMode);
  }, []);

  const [phase, setPhase] = useState<SprintPhase>(isCompleted ? 'DONE' : 'LEARNING_SPRINT');
  const [frictionSeconds, setFrictionSeconds] = useState(3);
  const [isStandupOpen, setIsStandupOpen] = useState(false);
  const [isScopeMatrixOpen, setIsScopeMatrixOpen] = useState(false);
  const [isFocusHUDOpen, setIsFocusHUDOpen] = useState(false);
  const [isExecutiveStudioOpen, setIsExecutiveStudioOpen] = useState(false);

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

  // Niyyah (Intention) Consecration Engine
  const [activeNiyyah, setActiveNiyyah] = useState<string>(() => {
    return localStorage.getItem('midmar_work_niyyah') || 'livelihood_halal';
  });

  // Selected Sprint Duration (15, 20, 25, 45, 60 minutes)
  const [selectedSprintMins, setSelectedSprintMins] = useState<number>(() => {
    return Number(localStorage.getItem('midmar_sprint_selected_mins') || '20');
  });

  // Focus Acoustics Ambient Sound (Zero-Cloud Web Audio)
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>(() => {
    return (localStorage.getItem('midmar_sprint_ambient') as AmbientSoundType) || 'none';
  });

  // Cleanup ambient sound on unmount
  useEffect(() => {
    return () => {
      soundSynth.stopAmbient();
    };
  }, []);

  // 20-minute learning timer (or custom duration)
  const learningTimer = useWorkerTimer();
  // 15-minute social media break timer (900 sec)
  const socialTimer = useWorkerTimer();

  // Handle completion of learning sprint
  const handleLearningComplete = async () => {
    soundSynth.stopAmbient();
    soundSynth.playCompletionChime();
    haptic.vibrateWorkDone();
    setPhase('ONE_SEC_FRICTION');
    setFrictionSeconds(3);

    // Auto-log completed minutes directly to db.workday_tasks & db.daily_logs
    const loggedMins = selectedSprintMins;
    try {
      const existingLog = await db.daily_logs.get(effectiveToday);
      await upsertDailyLog(effectiveToday, {
        totalFocusMinutes: (existingLog?.totalFocusMinutes || 0) + loggedMins,
        focusSessionsCount: (existingLog?.focusSessionsCount || 0) + 1,
        notes: sprintOutput.trim() || focusTask.trim() || existingLog?.notes,
      } as any);
    } catch {}

    if (focusTask.trim()) {
      try {
        const existing = await db.workday_tasks
          .where('date')
          .equals(effectiveToday)
          .filter((t) => t.title.toLowerCase().includes(focusTask.trim().toLowerCase()))
          .first();

        if (existing) {
          await db.workday_tasks.update(existing.id, {
            actualMinutes: (existing.actualMinutes || 0) + loggedMins,
          });
        } else {
          await db.workday_tasks.add({
            id: `wt_sprint_${Date.now()}`,
            title: focusTask.trim(),
            estimatedMinutes: loggedMins,
            actualMinutes: loggedMins,
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
      try {
        db.daily_logs.get(effectiveToday).then((log) => {
          if (log) {
            db.daily_logs.update(effectiveToday, {
              urgeSurfsCount: (log.urgeSurfsCount || 0) + 1,
            });
          }
        });
      } catch {}
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
    learningTimer.startTimer(selectedSprintMins * 60, handleLearningComplete);
    if (ambientSound !== 'none') {
      soundSynth.startAmbient(ambientSound, 0.4);
    }
  };

  const handlePauseLearning = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    learningTimer.pauseTimer();
    soundSynth.stopAmbient();
  };

  const handleResumeLearning = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    learningTimer.resumeTimer();
    if (ambientSound !== 'none') {
      soundSynth.startAmbient(ambientSound, 0.4);
    }
  };

  const handleResetLearning = () => {
    soundSynth.playTactileClick();
    learningTimer.stopTimer();
    soundSynth.stopAmbient();
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

  const handleCompleteWithCelebration = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    try {
      const x = e.clientX ? e.clientX / window.innerWidth : 0.5;
      const y = e.clientY ? e.clientY / window.innerHeight : 0.6;
      confetti({ disableForReducedMotion: true,
        particleCount: 55,
        spread: 65,
        origin: { x, y },
        colors: ['#1eb814', '#bce8c2', '#5448e8', '#e2defc'],
      });
    } catch {
      triggerCelebrationConfetti();
    }
    onCompleteStation();
    setPhase('DONE');
  };

  return (
    <div className="space-y-4 transition-colors duration-200">
      {/* Habitline Obsidian Station Hero Banner */}
      <div className="celestial-obsidian-stage rounded-[28px] text-white p-4 sm:p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#5448e8] text-white flex items-center justify-center shadow-lg shadow-[#5448e8]/30 shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-bold border border-white/10">
                {language === 'ar' ? 'المحطة 2 من 8' : 'Station 2 of 8'}
              </span>
              <span className="text-[11px] font-mono text-[#bce8c2] font-bold uppercase tracking-wider tabular-nums">
                {t('station_2_badge')} • <bdi dir="ltr">09:00 - 17:00</bdi>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">
              {t('station_2_heading')}
            </h2>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsFocusHUDOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title={language === 'ar' ? 'كابينة التركيز الذهني والترددات السمعية (Focus HUD)' : 'Executive Focus HUD & Flow Beats'}
          >
            <span>⚡</span>
            <span className="hidden sm:inline font-sans">
              {language === 'ar' ? 'كابينة التدفق (HUD)' : 'Focus HUD'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsScopeMatrixOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#fce2e6]/15 hover:bg-[#fce2e6]/25 text-[#fce2e6] border border-[#fce2e6]/25 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title={language === 'ar' ? 'مصفوفة حماية النطاق والرفض الدبلوماسي (RICE + Barakah)' : 'Scope Creep Radar & Decision Matrix'}
          >
            <span>⚖️</span>
            <span className="hidden sm:inline font-sans">
              {language === 'ar' ? 'رادار النطاق' : 'Scope Radar'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsStandupOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title={language === 'ar' ? 'الوقفة اليومية والعبارات الإدارية للمشروع' : 'Daily Standup & PM English Phrases'}
          >
            <span>🎙️</span>
            <span className="hidden sm:inline font-sans">
              {language === 'ar' ? 'الوقفة اليومية' : 'Standup'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsExecutiveStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e2defc]/15 hover:bg-[#e2defc]/25 text-[#e2defc] border border-[#e2defc]/25 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title={language === 'ar' ? 'أستوديو القيادة الإنجليزية ومحاكي الاجتماعات (Executive PM Studio)' : 'Executive English PM Studio & Meeting Simulator'}
          >
            <span>👔</span>
            <span className="hidden sm:inline font-sans">
              {language === 'ar' ? 'إنجليزية القيادة' : 'PM Studio'}
            </span>
          </button>

          {isCompleted && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-[#bce8c2] text-zinc-950 font-bold shadow-xs">
              {language === 'ar' ? 'مكتملة اليوم ✓' : 'Completed ✓'}
            </span>
          )}

          <span className="text-xs px-3.5 py-1.5 rounded-full bg-[#bce8c2] text-zinc-950 font-mono font-bold tabular-nums shadow-sm">
            +15 XP
          </span>
        </div>
      </div>

      {/* Work Mode Switcher Tabs — Habitline Segmented Pill Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => {
            soundSynth.playTactileClick();
            setWorkViewMode('planner');
          }}
          className={`flex-1 py-2.5 px-3 rounded-[18px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            workViewMode === 'planner'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
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
          className={`flex-1 py-2.5 px-3 rounded-[18px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            workViewMode === 'learning_tracker'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 shrink-0 text-[#5448e8] dark:text-indigo-400" />
          <span className="truncate">{language === 'ar' ? 'مسار وسجل التعلم' : 'Learning Tracker'}</span>
        </button>

        <button
          onClick={() => {
            soundSynth.playTactileClick();
            setWorkViewMode('sprint');
          }}
          className={`flex-1 py-2.5 px-3 rounded-[18px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            workViewMode === 'sprint'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0 text-[#ff5500]" />
          <span className="truncate">{language === 'ar' ? 'شوط 20 دقيقة' : 'Quick Sprint'}</span>
        </button>
      </div>

      {/* Niyyah (Intention) Consecration Bar — Habitline Soft Lavender Surface */}
      <div className="bento-3d-lavender p-4 rounded-[28px] border border-white/50 dark:border-indigo-500/25 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#5448e8] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-indigo-900 dark:text-indigo-300 block leading-tight">
              {language === 'ar' ? 'استحضار النية وتجديد الاحتساب' : 'Intention Consecration'}
            </span>
            <span
              dir={language === 'ar' ? 'rtl' : undefined}
              lang={language === 'ar' ? 'ar' : undefined}
              className="text-xs font-bold text-zinc-950 dark:text-zinc-100 leading-[2.2] tashkeel-text"
            >
              {language === 'ar' ? '«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ»' : '"Actions are by intentions"'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'livelihood_halal', labelAr: 'كفاية الأهل والرزق الحلال', labelEn: 'Halal Sustenance' },
            { id: 'knowledge_mastery', labelAr: 'طلب العلم وإتقان الصنعة', labelEn: 'Knowledge & Mastery' },
            { id: 'ummah_growth', labelAr: 'عمارة الأرض ونفع الأمة', labelEn: 'Building Ummah' },
            { id: 'self_chastity', labelAr: 'الاستغناء بالحلال عن الحرام', labelEn: 'Self-Sufficiency' },
          ].map((chip) => {
            const isSelected = activeNiyyah === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setActiveNiyyah(chip.id);
                  localStorage.setItem('midmar_work_niyyah', chip.id);
                  if (onRewardToast) {
                    onRewardToast(
                      language === 'ar'
                        ? `عُقدت النية: ${chip.labelAr} ✨`
                        : `Intention set: ${chip.labelEn}`
                    );
                  }
                }}
                className={`py-1.5 px-3 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                    : 'bg-white/90 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-indigo-400/25 hover:border-[#5448e8]'
                }`}
              >
                {isSelected && '✓ '}
                {language === 'ar' ? chip.labelAr : chip.labelEn}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              if (onOpenNiyyahModal) onOpenNiyyahModal('livelihood');
            }}
            className="py-1.5 px-3 rounded-full bg-[#5448e8] hover:bg-[#4538d8] text-white text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
            title={language === 'ar' ? 'فتح محراب النوايا الأربع الكامل' : 'Open Full Niyyah Sanctuary'}
          >
            {language === 'ar' ? 'المحراب الكامل ←' : 'Full Sanctuary →'}
          </button>
        </div>
      </div>

      {workViewMode === 'planner' ? (
        <WorkdayPlanner
          todayDate={effectiveToday}
          onDeferToBuffer={onDeferToBuffer}
          bufferAvailableCount={bufferAvailableCount}
          onOpenTwoMinuteRule={onOpenTwoMinuteRule}
        />
      ) : workViewMode === 'learning_tracker' ? (
        <div className="space-y-3">
          {/* Subtabs for Learning: AI Courses Roadmap vs Focus Timer & Reflection */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 max-w-md shadow-2xs">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setLearningSubTab('courses');
              }}
              className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                learningSubTab === 'courses'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#5448e8] dark:text-indigo-400" />
              <span>{language === 'ar' ? 'خطة ومسار الكورسات (AI)' : 'AI Course Roadmap'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setLearningSubTab('sessions');
              }}
              className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                learningSubTab === 'sessions'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#1eb814]" />
              <span>{language === 'ar' ? 'مؤقت وسجل المذاكرة' : 'Focus Sessions'}</span>
            </button>
          </div>

          {learningSubTab === 'courses' ? (
            <CourseStudyHub
              onRewardToast={(msg) => {
                if (onRewardToast) {
                  onRewardToast(msg);
                } else {
                  soundSynth.playStreakMilestoneChime();
                }
              }}
            />
          ) : (
            <SelfLearningTracker
              onRewardToast={(msg) => {
                if (onRewardToast) {
                  onRewardToast(msg);
                } else {
                  soundSynth.playStreakMilestoneChime();
                }
              }}
            />
          )}
        </div>
      ) : (
        <>
          {/* Main Container depending on Phase */}
          {phase === 'LEARNING_SPRINT' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Sprint Timer Column — Crisp White Habitline Bento */}
              <div className="lg:col-span-6 p-6 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 text-center space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="space-y-1">
                  <span className="text-xs text-[#5448e8] dark:text-indigo-400 font-bold uppercase tracking-wider">
                    {t('timer_learning_label')}
                  </span>
                  <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-100">{t('timer_learning_heading')}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t('timer_learning_desc')}
                  </p>
                </div>

                {/* Sprint Duration Presets */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-400 font-bold shrink-0">
                    {language === 'ar' ? 'المدة:' : 'Duration:'}
                  </span>
                  {[
                    { mins: 15, labelAr: '15 دقيقة', labelEn: '15m' },
                    { mins: 20, labelAr: '20 دقيقة (قياسي)', labelEn: '20m (Std)' },
                    { mins: 25, labelAr: '25 دقيقة (بومودورو)', labelEn: '25m (Pomodoro)' },
                    { mins: 45, labelAr: '45 دقيقة (تركيز عميق)', labelEn: '45m (Deep Work)' },
                    { mins: 60, labelAr: '60 دقيقة (ساعة كاملة)', labelEn: '60m (Full)' },
                  ].map((preset) => {
                    const isSelected = selectedSprintMins === preset.mins;
                    return (
                      <button
                        key={preset.mins}
                        type="button"
                        disabled={learningTimer.isRunning}
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          setSelectedSprintMins(preset.mins);
                          localStorage.setItem('midmar_sprint_selected_mins', String(preset.mins));
                          if (!learningTimer.isRunning) {
                            learningTimer.stopTimer();
                          }
                        }}
                        className={`py-1.5 px-3 rounded-full text-[11px] font-bold transition-all cursor-pointer tabular-nums ${
                          isSelected
                            ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                            : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                        } ${learningTimer.isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {language === 'ar' ? preset.labelAr : preset.labelEn}
                      </button>
                    );
                  })}
                </div>

                {/* Clock Display with Radial SVG Countdown Ring */}
                <div className="chronograph-3d-ring relative inline-flex items-center justify-center rounded-full p-2">
                  {/* Outer Pulsing Glow when running */}
                  {learningTimer.isRunning && (
                    <div className="absolute inset-0 rounded-full bg-[#1eb814]/15 dark:bg-[#1eb814]/20 blur-xl animate-pulse pointer-events-none" />
                  )}
                  <svg className="w-52 h-52 -rotate-90 transform overflow-visible" viewBox="0 0 200 200">
                    {/* Outer flame ring — time remaining */}
                    <circle
                      cx="100"
                      cy="100"
                      r="86"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="86"
                      className="ring-glow-flame transition-all duration-1000 ease-linear"
                      stroke="#ff5500"
                      strokeWidth="8"
                      strokeDasharray={540.35}
                      strokeDashoffset={
                        540.35 *
                        (1 -
                          ((learningTimer.remainingSec || selectedSprintMins * 60) /
                            (selectedSprintMins * 60)))
                      }
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    {/* Inner emerald ring — checkpoints completed */}
                    <circle
                      cx="100"
                      cy="100"
                      r="72"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="72"
                      className="ring-glow-emerald transition-all duration-500 ease-out"
                      stroke="#1eb814"
                      strokeWidth="6"
                      strokeDasharray={452.39}
                      strokeDashoffset={
                        452.39 *
                        (1 -
                          (checkpoints.length > 0
                            ? checkpoints.filter((cp) => cp.done).length / checkpoints.length
                            : 0))
                      }
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center select-none">
                    <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-wider tabular-nums">
                      {learningTimer.remainingSec > 0
                        ? formatTime(learningTimer.remainingSec)
                        : `${selectedSprintMins.toString().padStart(2, '0')}:00`}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-300 mt-1 uppercase tracking-widest">
                      {learningTimer.isRunning ? (language === 'ar' ? 'تركيز عميق ⚡' : 'Deep Focus ⚡') : (language === 'ar' ? 'جاهز للانطلاق' : 'Ready')}
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
                      className="py-3 px-7 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#1eb814]/25 active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{learningTimer.remainingSec > 0 ? t('resume_sprint') : t('start_sprint')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseLearning}
                      className="py-3 px-7 rounded-full bg-habit-flame-ink hover:bg-habit-flame-ink-deep text-white font-bold text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
                    >
                      <Pause className="w-4 h-4" />
                      <span>{t('pause_sprint')}</span>
                    </button>
                  )}

                  <button
                    onClick={handleResetLearning}
                    title="إعادة ضبط / Reset"
                    className="p-3 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Ambient Focus Acoustics (Zero-Cloud Web Audio) — Soft Lavender */}
                <div className="p-4 rounded-[22px] bg-[#e2defc]/65 dark:bg-indigo-950/40 border border-indigo-400/25 space-y-2.5 text-start">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                      <Waves className="w-3.5 h-3.5 text-[#5448e8]" />
                      <span>{language === 'ar' ? 'أثير التركيز وعزل التشتت (أصوات طبيعية):' : 'Focus Acoustics (Zero Cloud):'}</span>
                    </span>
                    {ambientSound !== 'none' && learningTimer.isRunning && (
                      <span className="text-[#1eb814] dark:text-emerald-400 flex items-center gap-1 text-[10px] animate-pulse font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1eb814]" />
                        <span>{language === 'ar' ? 'نشط الآن 🎙️' : 'Active 🎙️'}</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'none' as AmbientSoundType, labelAr: '🔇 صامت', labelEn: 'Silent' },
                      { id: 'brown' as AmbientSoundType, labelAr: '🌊 ضوضاء بنية', labelEn: 'Brown Noise' },
                      { id: 'rain' as AmbientSoundType, labelAr: '🌧️ صوت المطر', labelEn: 'Rain' },
                      { id: 'alpha' as AmbientSoundType, labelAr: '⚡ موجات ألفا', labelEn: 'Alpha Wave' },
                    ].map((amb) => {
                      const isSelected = ambientSound === amb.id;
                      return (
                        <button
                          key={amb.id}
                          type="button"
                          onClick={() => {
                            soundSynth.playTactileClick();
                            haptic.vibrateLight();
                            setAmbientSound(amb.id);
                            localStorage.setItem('midmar_sprint_ambient', amb.id);
                            if (learningTimer.isRunning) {
                              if (amb.id === 'none') {
                                soundSynth.stopAmbient();
                              } else {
                                soundSynth.startAmbient(amb.id, 0.4);
                              }
                            }
                          }}
                          className={`py-2 px-2.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                              : 'bg-white/90 dark:bg-zinc-900 hover:bg-white text-zinc-800 dark:text-zinc-200 border border-indigo-400/20'
                          }`}
                        >
                          <span>{language === 'ar' ? amb.labelAr : amb.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Urge Surfing Trigger Button (Anti-Craving ACT Therapy) — Habitline Soft Rose */}
                <div className="p-4 rounded-[22px] bg-[#fce2e6]/80 dark:bg-rose-950/45 border border-rose-400/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-rose-950 dark:text-rose-200">
                    <Waves className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>
                      <strong>{t('urge_surfing_surfed_count')}</strong>{' '}
                      <span className="font-mono font-bold tabular-nums text-rose-800 dark:text-rose-300">{surfedCount}</span>
                    </span>
                  </div>
                  <button
                    onClick={handleStartUrgeSurfing}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Waves className="w-3.5 h-3.5" />
                    <span>{t('urge_surfing_btn')}</span>
                  </button>
                </div>

                {/* Defer to Buffer Button */}
                <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{t('defer_hint')}</span>
                  <button
                    onClick={handleDefer}
                    className="py-2 px-4 rounded-full bg-[#fde6d8] hover:bg-[#fbd5be] dark:bg-amber-950/45 border border-amber-400/35 text-amber-950 dark:text-amber-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#ff5500]" />
                    <span>{t('defer_to_buffer')} ({t('buffer_remaining_count')} <bdi dir="ltr" className="tabular-nums">{bufferAvailableCount}/2</bdi>)</span>
                  </button>
                </div>
              </div>

              {/* Single Target Sprint Task & 3 Checkpoints Column — Crisp White & Soft Mint */}
              <div className="lg:col-span-6 p-5 sm:p-6 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#d4f5dc] dark:bg-emerald-950/60 text-[#1eb814] flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">
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
                  className="w-full py-3 px-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#1eb814] font-medium"
                />

                {/* 3 Micro-Checkpoints */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    {language === 'ar' ? '3 خطوات مرحلية لإنجاز الجلسة:' : '3 Micro-checkpoints for this session:'}
                  </span>
                  {checkpoints.map((cp, idx) => (
                    <div
                      key={cp.id}
                      className={`${
                        ['bento-3d-lavender', 'bento-3d-mint', 'bento-3d-rose'][idx % 3]
                      } p-2 rounded-[20px] flex items-center gap-2.5`}
                    >
                      <button
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          handleToggleCheckpoint(cp.id);
                        }}
                        className={`tap-spring w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90 ${
                          cp.done
                            ? 'bg-habit-green-ink border-[#1eb814] text-white shadow-xs'
                            : 'border-zinc-300 dark:border-zinc-700 hover:border-[#1eb814] bg-white dark:bg-zinc-900'
                        }`}
                      >
                        {cp.done && <CheckCircle className="w-4 h-4" />}
                      </button>
                      <input
                        type="text"
                        placeholder={`${language === 'ar' ? 'خطوة' : 'Step'} ${idx + 1}...`}
                        value={cp.text}
                        onChange={(e) => handleUpdateCheckpointText(cp.id, e.target.value)}
                        className={`flex-1 py-2 px-3.5 rounded-2xl border text-xs focus:outline-hidden focus:border-[#1eb814] transition-colors ${
                          cp.done
                            ? 'bg-[#d4f5dc]/60 dark:bg-emerald-950/30 border-[#1eb814]/30 line-through text-zinc-500 dark:text-zinc-400'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* Post-sprint Output Note — Habitline Soft Mint */}
                <div className="bento-3d-mint p-4 rounded-[22px] border border-white/50 dark:border-emerald-500/25 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#1eb814]" />
                    <span className="text-xs font-bold text-zinc-950 dark:text-zinc-100">
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
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-[#1eb814]/25 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#1eb814]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Phase 2: One-Sec Friction Breathing Pause — Habitline Soft Rose */}
          {phase === 'ONE_SEC_FRICTION' && (
            <div className="p-8 rounded-[28px] bg-[#fce2e6]/80 dark:bg-rose-950/45 border border-rose-400/30 text-center space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="inline-flex p-3.5 rounded-2xl bg-rose-500 text-white animate-pulse shadow-md">
                <Wind className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-100">
                  {t('one_sec_friction_title')}
                </h3>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 max-w-md mx-auto leading-relaxed">
                  {t('one_sec_friction_desc')}
                </p>
              </div>

              <div className="py-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-white dark:bg-zinc-900 border-2 border-rose-400 flex items-center justify-center animate-breathe shadow-md">
                  <span className="text-4xl font-bold font-mono text-rose-700 dark:text-rose-300 tabular-nums">
                    {frictionSeconds}
                  </span>
                </div>
                <span className="text-xs text-rose-800 dark:text-rose-300 mt-2 block font-bold">{t('one_sec_breathing_hint')}</span>
              </div>
            </div>
          )}

          {/* Phase 3: Social Media Break (15 min) with Coffee Badge — Habitline Soft Amber */}
          {phase === 'SOCIAL_BREAK' && (
            <div className="p-6 rounded-[28px] bg-[#fde6d8]/80 dark:bg-amber-950/45 border border-amber-400/35 text-center space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-center gap-2 text-amber-950 dark:text-amber-200 font-bold text-sm">
                <Coffee className="w-5 h-5 text-[#ff5500]" />
                <span>{t('social_break_title')}</span>
              </div>

              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                {t('social_break_desc')}
              </p>

              <div className="relative inline-flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-4 border-[#ff5500]/40 flex items-center justify-center bg-white dark:bg-zinc-900 shadow-inner">
                  <span className="text-4xl font-mono font-bold text-[#ff5500] tabular-nums">
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
                  className="py-2.5 px-6 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 text-xs font-bold cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  {t('social_break_end_early')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Station Completion Bar — Habitline Pill CTA */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">{t('station_2_heading')}</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isCompleted ? (language === 'ar' ? 'تم كسب 15 نقطة اليوم!' : '15 Points Earned Today!') : (language === 'ar' ? 'اضغط لإضافة 15 نقطة والانتقال لمحطة الجيم.' : 'Confirm completion to advance to gym anchor.')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {!isCompleted ? (
            <button
              onClick={handleCompleteWithCelebration}
              className="tap-spring py-3 px-6 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#1eb814]/25 active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t('mark_done')} (+15 XP)</span>
            </button>
          ) : (
            <button
              onClick={onNextStation}
              className="tap-spring py-3 px-6 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
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
                  {language === 'ar' ? 'العودة إلى العمل الآن' : 'Back to work now'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agile Standup & PM English Phrases Modal */}
      <AgileStandupModal
        isOpen={isStandupOpen}
        onClose={() => setIsStandupOpen(false)}
        onRewardToast={onRewardToast}
      />

      {/* Scope Creep Radar & Decision Matrix Modal */}
      <ScopeDecisionMatrixModal
        isOpen={isScopeMatrixOpen}
        onClose={() => setIsScopeMatrixOpen(false)}
        onDeferToBuffer={onDeferToBuffer}
        onRewardToast={onRewardToast}
        todayDate={effectiveToday}
      />

      {/* Executive Focus HUD Cockpit Modal */}
      <ExecutiveFocusHUD
        isOpen={isFocusHUDOpen}
        onClose={() => setIsFocusHUDOpen(false)}
        focusTask={focusTask}
        checkpoints={checkpoints}
        onToggleCheckpoint={handleToggleCheckpoint}
        onCompleteSprint={handleLearningComplete}
        onRewardToast={onRewardToast}
      />

      {/* Executive English PM Studio & Meeting Simulator Modal */}
      <ExecutiveEnglishStudioModal
        isOpen={isExecutiveStudioOpen}
        onClose={() => setIsExecutiveStudioOpen(false)}
        onRewardToast={onRewardToast}
      />
    </div>
  );
};
