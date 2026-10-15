import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Play,
  Pause,
  XCircle,
  VolumeX,
  CloudRain,
  Radio,
  Users,
  GitCommit,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  Moon,
  Shield,
  Maximize2,
  Minimize2,
  Palette,
  GraduationCap,
  Scroll,
  PenTool,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import type { EnergyLevel, AmbientSoundType, UserState } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useWorkerTimer } from '../../hooks/useWorkerTimer';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { wakeLockService } from '../../services/wakeLockService';
import { useTranslation } from '../../i18n/LanguageContext';
import { resolveStationMetadata, PERSONA_CONFIGS } from '../../utils/lifestyleEngine';
import confetti from 'canvas-confetti';
import { LanguageMasteryCard } from '../learning/LanguageMasteryCard';
import { getBiologicalDate, upsertDailyLog, triggerCelebrationConfetti } from '../../utils/gamification';

export type EveningFocusMode =
  | 'LANGUAGE_MASTERY'
  | 'CODING'
  | 'OUTREACH'
  | 'PASSION_PROJECT'
  | 'ACADEMIC_STUDY'
  | 'SACRED_KNOWLEDGE'
  | 'CREATIVE_WRITING';

interface EveningSprintViewProps {
  isCompleted: boolean;
  onCompleteStation: () => void;
  onNextStation: () => void;
  onOpenCrmDrawer: () => void;
  onApplyPenalty: (pointsLost: number) => void;
  energyLevel?: EnergyLevel;
  userState?: UserState;
  onRewardToast?: (msg: string) => void;
}

export const EveningSprintView: React.FC<EveningSprintViewProps> = ({
  isCompleted,
  onCompleteStation,
  onNextStation,
  onOpenCrmDrawer,
  onApplyPenalty,
  energyLevel = 'high',
  userState,
  onRewardToast,
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  // Persona & station metadata
  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const persona = PERSONA_CONFIGS[personaId] || PERSONA_CONFIGS.builder_exec;
  const stationMeta = resolveStationMetadata(
    'EVENING_SPRINT',
    personaId,
    userState?.settings?.stationCustomOverrides,
    isAr
  );

  const getPersonaDefaultMode = (pId: string): EveningFocusMode => {
    if (pId === 'flexible_home') return 'PASSION_PROJECT';
    if (pId === 'academic_student') return 'ACADEMIC_STUDY';
    if (pId === 'sharia_seeker') return 'SACRED_KNOWLEDGE';
    if (pId === 'freelancer_creator') return 'CREATIVE_WRITING';
    const todayDay = new Date().getDay();
    return todayDay === 1 || todayDay === 3 ? 'OUTREACH' : 'CODING';
  };

  const [mode, setModeState] = useState<EveningFocusMode>(() => {
    const saved = localStorage.getItem('midmar_evening_mode') as EveningFocusMode;
    if (saved) return saved;
    return getPersonaDefaultMode(personaId);
  });
  const setMode = (m: EveningFocusMode) => {
    setModeState(m);
    localStorage.setItem('midmar_evening_mode', m);
  };

  const [universalProjectTitle, setUniversalProjectTitle] = useState(() => {
    return localStorage.getItem('midmar_evening_univ_title') || '';
  });
  const [universalNotes, setUniversalNotes] = useState(() => {
    return localStorage.getItem('midmar_evening_univ_notes') || '';
  });

  const [ambientType, setAmbientType] = useState<AmbientSoundType>('brown');
  const [githubNotes, setGithubNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('midmar_evening_coding_notes');
      return saved ? JSON.parse(saved).githubNotes || '' : '';
    } catch {
      return '';
    }
  });
  const [commitHash, setCommitHash] = useState(() => {
    try {
      const saved = localStorage.getItem('midmar_evening_coding_notes');
      return saved ? JSON.parse(saved).commitHash || '' : '';
    } catch {
      return '';
    }
  });
  const [savedNotes, setSavedNotes] = useState(false);
  const [activeProject, setActiveProject] = useState(() => {
    try {
      const saved = localStorage.getItem('midmar_evening_coding_notes');
      return saved ? JSON.parse(saved).activeProject || 'Midmar PWA' : 'Midmar PWA';
    } catch {
      return 'Midmar PWA';
    }
  });

  // Live Leads and Templates from Dexie
  const leads = useLiveQuery(() => db.leads.toArray()) || [];
  const templates = useLiveQuery(() => db.templates.toArray()) || [];
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // V2 Upgrades: Ultra-Dim OLED Mode & Pixel Shifting (Burn-in Protection)
  const [isUltraDim, setIsUltraDim] = useState(false);
  const [isZenFullscreen, setIsZenFullscreen] = useState(false);
  const [pixelShift, setPixelShift] = useState<[number, number]>([0, 0]);

  // Adaptive duration: 25 mins if energy is medium, otherwise 45 mins
  const sprintDurationMin = energyLevel === 'medium' ? 25 : 45;
  const sprintDurationSec = sprintDurationMin * 60;

  const sprintTimer = useWorkerTimer();

  // Screen Wake Lock & Ambient Sound management
  useEffect(() => {
    if (sprintTimer.isRunning) {
      wakeLockService.requestLock();
      soundSynth.startAmbient(ambientType, 0.4);
    } else {
      soundSynth.stopAmbient();
    }

    return () => {
      wakeLockService.releaseLock();
      soundSynth.stopAmbient();
    };
  }, [sprintTimer.isRunning, ambientType]);

  // OLED Burn-in Protection: Shift clock 2-3px every 60 seconds
  useEffect(() => {
    if (!sprintTimer.isRunning) return;

    const interval = setInterval(() => {
      const dx = Math.floor(Math.random() * 5) - 2;
      const dy = Math.floor(Math.random() * 5) - 2;
      setPixelShift([dx, dy]);
    }, 60000);

    return () => clearInterval(interval);
  }, [sprintTimer.isRunning]);

  const handleStartSprint = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    sprintTimer.startTimer(sprintDurationSec, () => {
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      onCompleteStation();
    });
  };

  const handlePauseSprint = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    sprintTimer.pauseTimer();
  };

  const handleResumeSprint = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    sprintTimer.resumeTimer();
  };

  // In-app non-blocking confirmation dialog for focus penalty
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCancelWithPenalty = () => {
    if (!sprintTimer.isRunning && sprintTimer.remainingSec === 0) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setShowCancelModal(true);
  };

  const handleConfirmCancelPenalty = () => {
    soundSynth.playWarningSound();
    haptic.vibrateWarning();
    sprintTimer.stopTimer();
    onApplyPenalty(10);
    setShowCancelModal(false);
  };

  const handleToggleAmbient = (type: AmbientSoundType) => {
    soundSynth.playTactileClick();
    setAmbientType(type);
    if (sprintTimer.isRunning) {
      soundSynth.startAmbient(type, 0.4);
    }
  };

  const handleSaveCodingNotes = async () => {
    soundSynth.playTactileClick();
    try {
      localStorage.setItem(
        'midmar_evening_coding_notes',
        JSON.stringify({ commitHash, githubNotes, activeProject })
      );
      await upsertDailyLog(getBiologicalDate(), {
        notes: `[${activeProject}] ${commitHash}: ${githubNotes}`,
      } as any);
    } catch {}
    setSavedNotes(true);
    setTimeout(() => setSavedNotes(false), 2500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const elapsedSec = sprintDurationSec - (sprintTimer.remainingSec || sprintDurationSec);
  const coreProgress = Math.min(1, Math.max(0.15, elapsedSec / sprintDurationSec));

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
        colors: ['#1eb814', '#bce8c2', '#7c3aed', '#e2defc'],
      });
    } catch {
      triggerCelebrationConfetti();
    }
    onCompleteStation();
  };

  return (
    <div className={`space-y-4 transition-all duration-500 ${isUltraDim ? 'bg-black text-zinc-400 p-3 rounded-[28px]' : ''}`}>
      {/* Habitline Obsidian Station Hero Banner */}
      {!isUltraDim && (
        <div className="celestial-obsidian-stage rounded-[28px] text-white p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#7c3aed] text-white flex items-center justify-center shadow-lg shadow-[#7c3aed]/30 shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-bold border border-white/10">
                  {isAr ? 'المحطة 6 من 8' : 'Station 6 of 8'}
                </span>
                <span className="text-[11px] font-mono text-zinc-300 font-bold uppercase tracking-wider">
                  {persona.badge} • <bdi dir="ltr" className="tabular-nums text-[#e2defc]">{stationMeta.shortTime}</bdi>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                {isAr ? stationMeta.titleAr : stationMeta.titleEn} (<span className="tabular-nums">{sprintDurationMin}</span> {isAr ? 'دقيقة' : 'min'})
              </h2>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
            {isCompleted && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-[#bce8c2] text-zinc-950 font-bold shadow-xs">
                {isAr ? 'مكتملة اليوم ✓' : 'Completed ✓'}
              </span>
            )}
            <span className="text-xs px-3.5 py-1.5 rounded-full bg-[#bce8c2] text-zinc-950 font-mono font-bold tabular-nums shadow-sm">
              +20 XP
            </span>
          </div>
        </div>
      )}

      {/* 6-Mode Universal Selector & Audio/OLED controls */}
      <div className="space-y-2.5">
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1.5 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-xs w-max min-w-full">
            <button
              type="button"
              onClick={() => setMode('LANGUAGE_MASTERY')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[18px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'LANGUAGE_MASTERY'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isAr ? 'تعلّم اللغات والحصيلة اليومية' : 'Language Mastery'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('PASSION_PROJECT')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[18px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'PASSION_PROJECT'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{isAr ? 'مشروع شخصي وقراءة' : 'Passion Project'}</span>
            </button>

            <button
              onClick={() => setMode('ACADEMIC_STUDY')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[18px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'ACADEMIC_STUDY'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{isAr ? 'معمل الأبحاث والدراسة' : 'Academic Study'}</span>
            </button>

            <button
              onClick={() => setMode('SACRED_KNOWLEDGE')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[18px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'SACRED_KNOWLEDGE'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>{isAr ? 'علم شرعي وحفظ متون' : 'Sacred Knowledge'}</span>
            </button>

            <button
              onClick={() => setMode('CREATIVE_WRITING')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[18px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'CREATIVE_WRITING'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{isAr ? 'صناعة محتوى وكتابة' : 'Content & Writing'}</span>
            </button>

            <button
              onClick={() => setMode('CODING')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[18px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'CODING'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>{isAr ? 'برمجة وأنظمة' : 'Coding'}</span>
            </button>

            <button
              onClick={() => setMode('OUTREACH')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[18px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'OUTREACH'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isAr ? 'مبيعات وعملاء' : 'Outreach'}</span>
            </button>
          </div>
        </div>

        {/* Ambient Sounds & Ultra Dim OLED Switch */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar py-1 shrink-0 max-w-full">
          {/* Ultra Dim OLED Toggle */}
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsUltraDim(!isUltraDim);
            }}
            title="حماية شاشات OLED ووضع فائق الخفوت"
            className={`tap-spring shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs active:scale-95 ${
              isUltraDim
                ? 'bg-[#141517] border-[#1eb814] text-[#bce8c2]'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{isUltraDim ? t('oled_ultra_dim_active') : t('oled_ultra_dim')}</span>
          </button>

          {/* Zen Fullscreen Desk Clock Button */}
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsZenFullscreen(true);
            }}
            title={language === 'ar' ? 'ساعة مكتبية بملء الشاشة الكاملة (Zen Desk HUD)' : 'Zen Fullscreen Desk HUD'}
            className="tap-spring shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#7c3aed] active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'ملء الشاشة ⛶' : 'Zen HUD ⛶'}</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              handleToggleAmbient('brown');
            }}
            className={`tap-spring shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
              ambientType === 'brown'
                ? 'bg-[#fde6d8] dark:bg-amber-950/45 border-amber-400/40 text-zinc-950 dark:text-amber-200'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{t('ambient_brown')}</span>
          </button>
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              handleToggleAmbient('rain');
            }}
            className={`tap-spring shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
              ambientType === 'rain'
                ? 'bg-[#e2defc] dark:bg-indigo-950/45 border-indigo-400/40 text-zinc-950 dark:text-indigo-200'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>{t('ambient_rain')}</span>
          </button>
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              handleToggleAmbient('alpha');
            }}
            className={`tap-spring shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
              ambientType === 'alpha'
                ? 'bg-[#e2defc] dark:bg-purple-950/45 border-purple-400/40 text-zinc-950 dark:text-purple-200'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Alpha 10Hz</span>
          </button>
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              handleToggleAmbient('theta');
            }}
            className={`tap-spring shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
              ambientType === 'theta'
                ? 'bg-[#d4f5dc] dark:bg-emerald-950/45 border-[#1eb814]/40 text-zinc-950 dark:text-emerald-200'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Theta 6Hz</span>
          </button>
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              handleToggleAmbient('none');
            }}
            className={`tap-spring shrink-0 p-2 rounded-full border cursor-pointer shadow-2xs active:scale-95 ${
              ambientType === 'none'
                ? 'bg-[#fce2e6] dark:bg-rose-950/45 border-rose-400/40 text-rose-800 dark:text-rose-200'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
            title={t('ambient_mute')}
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Desk Clock HUD with Pixel-Shifting — Habitline Bento Stage */}
      <div className={`relative p-8 rounded-[28px] border text-center overflow-hidden transition-all duration-700 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${
        isUltraDim ? 'bg-black border-zinc-900' : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-white/10'
      }`}>
        {/* Visual Core (Focus Core) */}
        {!isUltraDim && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 transition-transform duration-1000"
            style={{ transform: `scale(${0.6 + coreProgress * 0.8})` }}
          >
            <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-[#e2defc]/60 via-[#7c3aed]/25 to-[#d4f5dc]/60 blur-3xl animate-focus-core" />
          </div>
        )}

        {/* Screen Wake Lock & OLED Burn-in Active Indicator */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mb-4 tabular-nums">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-[#1eb814]" />
            <span>{t('wake_lock_active')}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-[#1eb814]">
            <Shield className="w-3 h-3" />
            <span>Pixel-Shift: [{pixelShift[0]}px, {pixelShift[1]}px]</span>
          </span>
        </div>

        {/* Big Digital Clock with Pixel-Shift */}
        <div
          className="my-6 transition-transform duration-1000 ease-out"
          style={{ transform: `translate(${pixelShift[0]}px, ${pixelShift[1]}px)` }}
        >
          <span className={`text-6xl sm:text-7xl font-mono font-bold tracking-tight drop-shadow-xs tabular-nums ${
            isUltraDim ? 'text-[#1eb814]/80' : 'text-zinc-950 dark:text-zinc-100'
          }`}>
            {sprintTimer.remainingSec > 0
              ? formatTime(sprintTimer.remainingSec)
              : `${sprintDurationMin}:00`}
          </span>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-2 tabular-nums">
            {t('focus_core_level')} {Math.round(coreProgress * 100)}%
          </div>
          <div className="w-48 sm:w-64 mx-auto mt-2 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden p-0.5 border border-zinc-200/80 dark:border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] via-[#5448e8] to-[#1eb814] transition-all duration-500 shadow-xs"
              style={{ width: `${Math.round(coreProgress * 100)}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!sprintTimer.isRunning ? (
            <button
              onClick={sprintTimer.remainingSec > 0 ? handleResumeSprint : handleStartSprint}
              className="py-3 px-8 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#1eb814]/25 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{sprintTimer.remainingSec > 0 ? t('resume_sprint') : `${t('start_sprint')} (${sprintDurationMin}m)`}</span>
            </button>
          ) : (
            <button
              onClick={handlePauseSprint}
              className="py-3 px-6 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Pause className="w-4 h-4" />
              <span>{t('pause_sprint')}</span>
            </button>
          )}

          {sprintTimer.remainingSec > 0 && (
            <button
              onClick={handleCancelWithPenalty}
              title="إلغاء مبكر مع غرامة ذبول النواة"
              className="p-3 rounded-full bg-[#fce2e6] hover:bg-rose-200 dark:bg-rose-950/45 border border-rose-400/35 text-rose-800 dark:text-rose-200 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Sub-Panel */}
      {!isUltraDim && (
        <>
          {/* Language Mastery & Vocabulary Engine */}
          {mode === 'LANGUAGE_MASTERY' && (
            <LanguageMasteryCard onRewardToast={onRewardToast} />
          )}

          {/* Universal Modes Workspace (Passion Project, Academic Study, Sacred Knowledge, Creative Writing) — Soft Lavender */}
          {(mode === 'PASSION_PROJECT' ||
            mode === 'ACADEMIC_STUDY' ||
            mode === 'SACRED_KNOWLEDGE' ||
            mode === 'CREATIVE_WRITING') && (
            <div className="bento-3d-lavender p-5 sm:p-6 rounded-[28px] border border-white/50 dark:border-indigo-500/25 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-400/20">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">
                    {mode === 'PASSION_PROJECT' && '🎨'}
                    {mode === 'ACADEMIC_STUDY' && '🎓'}
                    {mode === 'SACRED_KNOWLEDGE' && '📜'}
                    {mode === 'CREATIVE_WRITING' && '✍️'}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                      {mode === 'PASSION_PROJECT' && (isAr ? 'مشروع الشغف والقراءة والاهتمام الحر' : 'Passion Project & Reading')}
                      {mode === 'ACADEMIC_STUDY' && (isAr ? 'المعمل الأكاديمي والاستذكار والأبحاث' : 'Academic Research & Study')}
                      {mode === 'SACRED_KNOWLEDGE' && (isAr ? 'مدارسة العلم الشرعي وحفظ المتون' : 'Sacred Knowledge & Memorization')}
                      {mode === 'CREATIVE_WRITING' && (isAr ? 'استوديو صناعة المحتوى والكتابة' : 'Content Studio & Writing')}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      {isAr ? 'مساحة هادئة خالية من المشتتات للتركيز في مسارك الشخصي' : 'Distraction-free space for your personal sprint'}
                    </p>
                  </div>
                </div>

                {savedNotes && (
                  <span className="text-[10px] font-bold text-zinc-950 bg-[#bce8c2] px-2.5 py-1 rounded-full animate-fade-in">
                    {isAr ? 'تم الحفظ تلقائياً ✔' : 'Saved Auto ✔'}
                  </span>
                )}
              </div>

              {/* Title / Objective input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                  {mode === 'PASSION_PROJECT' && (isAr ? 'اسم المشروع أو الكتاب أو الموضوع:' : 'Project or Book Topic:')}
                  {mode === 'ACADEMIC_STUDY' && (isAr ? 'عنوان الورقة العلمية / مادة المذاكرة:' : 'Research Paper / Subject Title:')}
                  {mode === 'SACRED_KNOWLEDGE' && (isAr ? 'المتن أو الباب المراد مدارسته:' : 'Book, Chapter or Matn:')}
                  {mode === 'CREATIVE_WRITING' && (isAr ? 'عنوان المحتوى / السكريبت / المقال:' : 'Article / Script Title:')}
                </label>
                <input
                  type="text"
                  value={universalProjectTitle}
                  onChange={(e) => {
                    setUniversalProjectTitle(e.target.value);
                    localStorage.setItem('midmar_evening_univ_title', e.target.value);
                  }}
                  placeholder={
                    mode === 'PASSION_PROJECT' ? (isAr ? 'مثال: قراءة كتاب العادات الذرية / تنظيم ميزانية الشهر...' : 'e.g. Reading Atomic Habits...') :
                    mode === 'ACADEMIC_STUDY' ? (isAr ? 'مثال: تلخيص ورقة الذكاء الاصطناعي / الفصل الثالث من الرسالة...' : 'e.g. AI paper summary...') :
                    mode === 'SACRED_KNOWLEDGE' ? (isAr ? 'مثال: حفظ عمدة الأحكام / مدارسة التفسير...' : 'e.g. Hadith memorization...') :
                    (isAr ? 'مثال: سكريبت الفيديو القادم / مقال لينكد إن الأسبوعي...' : 'e.g. Video script / Newsletter...')
                  }
                  className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-indigo-400/25 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#7c3aed]"
                />
              </div>

              {/* Notes / Scratchpad */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                  {isAr ? 'مسودة الإنجاز والملخص والأفكار الذهبية:' : 'Sprint Output & Key Insights:'}
                </label>
                <textarea
                  rows={4}
                  value={universalNotes}
                  onChange={(e) => {
                    setUniversalNotes(e.target.value);
                    localStorage.setItem('midmar_evening_univ_notes', e.target.value);
                  }}
                  placeholder={isAr ? 'دون هنا أهم الملاحظات، المخرجات، أو النقاط المستخلصة من هذه الجلسة...' : 'Jot down your key breakthroughs and outputs...'}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-indigo-400/25 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#7c3aed] font-mono"
                />
              </div>

              {/* Quick Save button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    try {
                      await upsertDailyLog(getBiologicalDate(), {
                        notes: `[${universalProjectTitle || mode}] ${universalNotes}`,
                      } as any);
                    } catch {}
                    setSavedNotes(true);
                    setTimeout(() => setSavedNotes(false), 2000);
                  }}
                  className="min-h-[44px] py-2.5 px-5 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95"
                >
                  {isAr ? 'حفظ الملاحظات 💾' : 'Save Notes 💾'}
                </button>
              </div>
            </div>
          )}

          {mode === 'OUTREACH' ? (
            <div className="p-5 sm:p-6 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#e2defc] dark:bg-indigo-950/60 text-[#7c3aed] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                    {t('direct_outreach_title')}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {/* Template selector */}
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="py-1.5 px-3 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <option value="">{language === 'ar' ? 'اختر قالب الرسالة...' : 'Select template...'}</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.title}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={onOpenCrmDrawer}
                    className="py-1.5 px-3.5 rounded-full bg-[#e2defc] hover:bg-indigo-200 dark:bg-purple-600/20 text-zinc-950 dark:text-purple-200 font-bold text-xs border border-indigo-400/30 cursor-pointer"
                  >
                    {language === 'ar' ? 'إدارة العملاء' : 'Manage Leads'}
                  </button>
                </div>
              </div>

              {/* Direct Leads Action List */}
              <div className="space-y-2.5">
                {leads.filter((l) => l.status !== 'Contacted' && l.status !== 'Closed').slice(0, 4).map((lead) => {
                  const activeTpl = templates.find((t) => t.id === selectedTemplateId);
                  const msgText = encodeURIComponent(
                    activeTpl ? activeTpl.body.replace('{name}', lead.name) : `مرحباً ${lead.name}، أود التواصل معك.`
                  );

                  return (
                    <div
                      key={lead.id}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-zinc-950 dark:text-zinc-100">
                            {lead.name}
                          </span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#e2defc] dark:bg-purple-500/20 text-zinc-950 dark:text-purple-300 font-bold">
                            {lead.channel}
                          </span>
                        </div>
                        {lead.notes && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-xs">
                            {lead.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            soundSynth.playTactileClick();
                            window.open(`https://api.whatsapp.com/send?text=${msgText}`, '_blank');
                          }}
                          className="flex-1 sm:flex-initial py-2 px-3.5 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <span>{t('send_whatsapp_btn')}</span>
                        </button>

                        <button
                          onClick={async () => {
                            soundSynth.playTactileClick();
                            haptic.vibrateWorkDone();
                            await db.leads.update(lead.id, {
                              status: 'Contacted',
                              lastContactDate: getBiologicalDate(),
                            });
                          }}
                          className="py-2 px-3.5 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs cursor-pointer"
                        >
                          {t('mark_contacted_btn')}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {leads.filter((l) => l.status !== 'Contacted' && l.status !== 'Closed').length === 0 && (
                  <div className="text-center py-4 text-xs text-zinc-500 dark:text-zinc-400">
                    {language === 'ar' ? '🎉 تم التواصل مع كافة العملاء المستهدفين لليوم!' : 'All target leads contacted for today! 🎉'}
                  </div>
                )}
              </div>
            </div>
          ) : mode === 'CODING' ? (
            <div className="bento-3d-mint p-5 sm:p-6 rounded-[28px] border border-white/50 dark:border-emerald-500/25 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-habit-green-ink text-white flex items-center justify-center shadow-2xs">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <span>{t('coding_log_title')}</span>
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['Midmar PWA', 'Backend API', 'Open Source'].map((proj) => (
                    <button
                      key={proj}
                      type="button"
                      onClick={() => setActiveProject(proj)}
                      className={`text-[11px] px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                        activeProject === proj
                          ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                          : 'bg-white/90 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-[#1eb814]/20'
                      }`}
                    >
                      {proj}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  placeholder={t('commit_hash_placeholder')}
                  value={commitHash}
                  onChange={(e) => setCommitHash(e.target.value)}
                  className="sm:col-span-1 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-[#1eb814]/25 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#1eb814] font-mono shadow-2xs"
                />
                <input
                  type="text"
                  placeholder={t('coding_notes_placeholder')}
                  value={githubNotes}
                  onChange={(e) => setGithubNotes(e.target.value)}
                  className="sm:col-span-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-[#1eb814]/25 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#1eb814] shadow-2xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveCodingNotes}
                  className="min-h-[44px] py-2.5 px-6 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 text-xs font-bold cursor-pointer shadow-sm transition-all active:scale-95"
                >
                  {savedNotes ? t('notes_saved') : t('save_coding_notes')}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Completion & Next Station — Habitline Pill CTA */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">{t('station_4_heading')}</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isCompleted ? (language === 'ar' ? 'تم إنجاز الجلسة وكسب 20 نقطة!' : 'Session complete (+20 pts)!') : (language === 'ar' ? 'أنهِ الجلسة للانتقال للمراجعة الصوتية.' : 'Complete session to advance to evening check-in.')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {!isCompleted ? (
            <button
              onClick={handleCompleteWithCelebration}
              className="tap-spring py-3 px-6 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#1eb814]/25 active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t('mark_done')} (+20 XP)</span>
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

      {/* Zen Fullscreen Desk Clock Overlay */}
      {isZenFullscreen && (
        <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col items-center justify-between p-6 sm:p-12 animate-fade-in font-mono select-none">
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1eb814] animate-pulse" />
              <span className="text-[#bce8c2] font-bold uppercase tracking-wider">Zen Focus Desk HUD</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{mode === 'CODING' ? t('coding_mode_btn') : t('crm_mode_btn')}</span>
            </div>

            <button
              onClick={() => setIsZenFullscreen(false)}
              className="p-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs border border-zinc-800"
            >
              <Minimize2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'تصغير' : 'Exit Fullscreen'}</span>
            </button>
          </div>

          {/* Big Digital Clock with Pixel-Shift */}
          <div
            className="text-center space-y-4 transition-transform duration-1000 ease-out my-auto"
            style={{ transform: `translate(${pixelShift[0]}px, ${pixelShift[1]}px)` }}
          >
            <span className="text-8xl sm:text-9xl md:text-[11rem] lg:text-[13rem] font-mono font-bold tracking-tight text-[#bce8c2] drop-shadow-[0_0_60px_rgba(30,184,20,0.3)] block tabular-nums">
              {sprintTimer.remainingSec > 0
                ? formatTime(sprintTimer.remainingSec)
                : `${sprintDurationMin}:00`}
            </span>
            <div className="text-sm sm:text-base text-zinc-500 font-mono tracking-widest uppercase">
              {sprintTimer.isRunning ? (language === 'ar' ? 'جلسة تركيز عميق مستمرة...' : 'Deep focus sprint in progress...') : (language === 'ar' ? 'جاهز للبدء' : 'Ready to start')}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="w-full max-w-xl flex items-center justify-center gap-4">
            {!sprintTimer.isRunning ? (
              <button
                onClick={sprintTimer.remainingSec > 0 ? handleResumeSprint : handleStartSprint}
                className="py-4 px-10 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-base flex items-center gap-2.5 shadow-xl shadow-[#1eb814]/25 cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{sprintTimer.remainingSec > 0 ? t('resume_sprint') : t('start_sprint')}</span>
              </button>
            ) : (
              <button
                onClick={handlePauseSprint}
                className="py-4 px-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-bold text-base flex items-center gap-2.5 cursor-pointer border border-zinc-800 active:scale-95 transition-all"
              >
                <Pause className="w-5 h-5" />
                <span>{t('pause_sprint')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Non-Blocking Focus Core Penalty Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-[28px] bg-white dark:bg-[#141517] border border-rose-300 dark:border-rose-900/60 p-6 space-y-4 shadow-2xl animate-scale-in text-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fce2e6] text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                  {isAr ? 'تحذير ذبول نواة التركيز' : 'Focus Core Penalty'}
                </h4>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                  {isAr ? 'خصم 50% من نقاط الجلسة (-10 نقاط)' : '-10 XP Penalty'}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
              {isAr
                ? 'إلغاء الجلسة مبكراً يقطع حبل التدفق العصبي ويؤدي لذبول النواة وخسارة 10 نقاط من رصيدك. هل ترغب حقاً في الإلغاء؟'
                : 'Canceling early breaks neuro-flow, withers your focus core, and deducts 10 points. Are you sure?'}
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="tap-spring flex-1 py-2.5 px-4 rounded-full bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer text-center"
              >
                {isAr ? 'العودة للتركيز' : 'Resume Sprint'}
              </button>

              <button
                type="button"
                onClick={handleConfirmCancelPenalty}
                className="tap-spring flex-1 py-2.5 px-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer text-center"
              >
                {isAr ? 'تأكيد الإلغاء والخصم' : 'Cancel & Deduct'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
