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
import { LanguageMasteryCard } from '../learning/LanguageMasteryCard';

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
  const [githubNotes, setGithubNotes] = useState('');
  const [commitHash, setCommitHash] = useState('');
  const [savedNotes, setSavedNotes] = useState(false);
  const [activeProject, setActiveProject] = useState('Midmar PWA');

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

  const handleSaveCodingNotes = () => {
    soundSynth.playTactileClick();
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

  return (
    <div className={`space-y-4 transition-all duration-500 ${isUltraDim ? 'bg-black text-zinc-400 p-3 rounded-2xl' : ''}`}>
      {/* Header */}
      {!isUltraDim && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-l from-purple-50 via-white to-white dark:from-purple-950/40 dark:via-zinc-900 dark:to-zinc-900 border border-purple-200 dark:border-purple-500/20 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider">
                  {persona.badge} • {stationMeta.shortTime}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
                  {isAr ? stationMeta.titleAr : stationMeta.titleEn} ({sprintDurationMin} {isAr ? 'دقيقة' : 'min'})
                </h2>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 font-mono font-bold shadow-2xs">
              +20 XP
            </span>
          </div>
        </div>
      )}

      {/* 6-Mode Universal Selector & Audio/OLED controls */}
      <div className="space-y-2">
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs w-max min-w-full">
            <button
              type="button"
              onClick={() => setMode('LANGUAGE_MASTERY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'LANGUAGE_MASTERY'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isAr ? 'تعلّم اللغات والحصيلة اليومية' : 'Language Mastery'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('PASSION_PROJECT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'PASSION_PROJECT'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{isAr ? 'مشروع شخصي وقراءة' : 'Passion Project'}</span>
            </button>

            <button
              onClick={() => setMode('ACADEMIC_STUDY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'ACADEMIC_STUDY'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{isAr ? 'معمل الأبحاث والدراسة' : 'Academic Study'}</span>
            </button>

            <button
              onClick={() => setMode('SACRED_KNOWLEDGE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'SACRED_KNOWLEDGE'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>{isAr ? 'علم شرعي وحفظ متون' : 'Sacred Knowledge'}</span>
            </button>

            <button
              onClick={() => setMode('CREATIVE_WRITING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'CREATIVE_WRITING'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{isAr ? 'صناعة محتوى وكتابة' : 'Content & Writing'}</span>
            </button>

            <button
              onClick={() => setMode('CODING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'CODING'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>{isAr ? 'برمجة وأنظمة' : 'Coding'}</span>
            </button>

            <button
              onClick={() => setMode('OUTREACH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'OUTREACH'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
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
            className={`tap-spring shrink-0 px-2.5 py-1 rounded-md border text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs active:scale-95 ${
              isUltraDim
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-slate-100 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <Moon className="w-3 h-3" />
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
            className="tap-spring shrink-0 px-2.5 py-1 rounded-md border text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs bg-slate-100 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 active:scale-95"
          >
            <Maximize2 className="w-3 h-3" />
            <span>{language === 'ar' ? 'ملء الشاشة ⛶' : 'Zen HUD ⛶'}</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              handleToggleAmbient('brown');
            }}
            className={`tap-spring shrink-0 px-2.5 py-1 rounded-md border text-xs flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 ${
              ambientType === 'brown'
                ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>{t('ambient_brown')}</span>
          </button>
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              handleToggleAmbient('rain');
            }}
            className={`tap-spring shrink-0 px-2.5 py-1 rounded-md border text-xs flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 ${
              ambientType === 'rain'
                ? 'bg-sky-100 dark:bg-cyan-500/20 border-sky-300 dark:border-cyan-500/40 text-sky-800 dark:text-cyan-300'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
            }`}
          >
            <CloudRain className="w-3 h-3" />
            <span>{t('ambient_rain')}</span>
          </button>
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              handleToggleAmbient('alpha');
            }}
            className={`tap-spring shrink-0 px-2.5 py-1 rounded-md border text-xs flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 ${
              ambientType === 'alpha'
                ? 'bg-purple-100 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/40 text-purple-800 dark:text-purple-300'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Alpha 10Hz</span>
          </button>
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              handleToggleAmbient('theta');
            }}
            className={`tap-spring shrink-0 px-2.5 py-1 rounded-md border text-xs flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 ${
              ambientType === 'theta'
                ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Theta 6Hz</span>
          </button>
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              handleToggleAmbient('none');
            }}
            className={`tap-spring shrink-0 p-1.5 rounded-md border cursor-pointer shadow-2xs active:scale-95 ${
              ambientType === 'none'
                ? 'bg-rose-100 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
            }`}
            title={t('ambient_mute')}
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Desk Clock HUD with Pixel-Shifting */}
      <div className={`relative p-8 rounded-2xl border text-center overflow-hidden transition-all duration-700 shadow-md ${
        isUltraDim ? 'bg-black border-zinc-900' : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800'
      }`}>
        {/* Visual Core (Focus Core) */}
        {!isUltraDim && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 transition-transform duration-1000"
            style={{ transform: `scale(${0.6 + coreProgress * 0.8})` }}
          >
            <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-sky-400/30 via-purple-500/20 to-emerald-400/30 blur-3xl animate-focus-core" />
          </div>
        )}

        {/* Screen Wake Lock & OLED Burn-in Active Indicator */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 dark:text-zinc-500 font-mono mb-4">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{t('wake_lock_active')}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
            <Shield className="w-3 h-3" />
            <span>Pixel-Shift: [{pixelShift[0]}px, {pixelShift[1]}px]</span>
          </span>
        </div>

        {/* Big Digital Clock with Pixel-Shift */}
        <div
          className="my-6 transition-transform duration-1000 ease-out"
          style={{ transform: `translate(${pixelShift[0]}px, ${pixelShift[1]}px)` }}
        >
          <span className={`text-6xl sm:text-7xl font-mono font-black tracking-tight drop-shadow-xs tabular-nums ${
            isUltraDim ? 'text-emerald-500/70' : 'text-slate-900 dark:text-zinc-100'
          }`}>
            {sprintTimer.remainingSec > 0
              ? formatTime(sprintTimer.remainingSec)
              : `${sprintDurationMin}:00`}
          </span>
          <div className="text-xs text-slate-500 dark:text-zinc-500 font-mono mt-2">
            {t('focus_core_level')} {Math.round(coreProgress * 100)}%
          </div>
          <div className="w-48 sm:w-64 mx-auto mt-2 h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden p-0.5 border border-slate-200/60 dark:border-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-sky-500 to-emerald-400 transition-all duration-500 shadow-xs"
              style={{ width: `${Math.round(coreProgress * 100)}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!sprintTimer.isRunning ? (
            <button
              onClick={sprintTimer.remainingSec > 0 ? handleResumeSprint : handleStartSprint}
              className="py-3 px-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-purple-600/30 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{sprintTimer.remainingSec > 0 ? t('resume_sprint') : `${t('start_sprint')} (${sprintDurationMin}m)`}</span>
            </button>
          ) : (
            <button
              onClick={handlePauseSprint}
              className="py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-bold text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Pause className="w-4 h-4" />
              <span>{t('pause_sprint')}</span>
            </button>
          )}

          {sprintTimer.remainingSec > 0 && (
            <button
              onClick={handleCancelWithPenalty}
              title="إلغاء مبكر مع غرامة ذبول النواة"
              className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 transition-all active:scale-95 cursor-pointer shadow-xs"
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

          {/* Universal Modes Workspace (Passion Project, Academic Study, Sacred Knowledge, Creative Writing) */}
          {(mode === 'PASSION_PROJECT' ||
            mode === 'ACADEMIC_STUDY' ||
            mode === 'SACRED_KNOWLEDGE' ||
            mode === 'CREATIVE_WRITING') && (
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {mode === 'PASSION_PROJECT' && '🎨'}
                    {mode === 'ACADEMIC_STUDY' && '🎓'}
                    {mode === 'SACRED_KNOWLEDGE' && '📜'}
                    {mode === 'CREATIVE_WRITING' && '✍️'}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {mode === 'PASSION_PROJECT' && (isAr ? 'مشروع الشغف والقراءة والاهتمام الحر' : 'Passion Project & Reading')}
                      {mode === 'ACADEMIC_STUDY' && (isAr ? 'المعمل الأكاديمي والاستذكار والأبحاث' : 'Academic Research & Study')}
                      {mode === 'SACRED_KNOWLEDGE' && (isAr ? 'مدارسة العلم الشرعي وحفظ المتون' : 'Sacred Knowledge & Memorization')}
                      {mode === 'CREATIVE_WRITING' && (isAr ? 'استوديو صناعة المحتوى والكتابة' : 'Content Studio & Writing')}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {isAr ? 'مساحة هادئة خالية من المشتتات للتركيز في مسارك الشخصي' : 'Distraction-free space for your personal sprint'}
                    </p>
                  </div>
                </div>

                {savedNotes && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md animate-fade-in">
                    {isAr ? 'تم الحفظ تلقائياً ✔' : 'Saved Auto ✔'}
                  </span>
                )}
              </div>

              {/* Title / Objective input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
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
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              {/* Notes / Scratchpad */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
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
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-purple-500 font-mono"
                />
              </div>

              {/* Quick Save button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setSavedNotes(true);
                    setTimeout(() => setSavedNotes(false), 2000);
                  }}
                  className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                >
                  {isAr ? 'حفظ الملاحظات 💾' : 'Save Notes 💾'}
                </button>
              </div>
            </div>
          )}

          {mode === 'OUTREACH' ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    {t('direct_outreach_title')}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {/* Template selector */}
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300"
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
                    className="py-1.5 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-600/20 text-purple-800 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-500/40 cursor-pointer"
                  >
                    {language === 'ar' ? 'إدارة العملاء' : 'Manage Leads'}
                  </button>
                </div>
              </div>

              {/* Direct Leads Action List */}
              <div className="space-y-2">
                {leads.filter((l) => l.status !== 'Contacted' && l.status !== 'Closed').slice(0, 4).map((lead) => {
                  const activeTpl = templates.find((t) => t.id === selectedTemplateId);
                  const msgText = encodeURIComponent(
                    activeTpl ? activeTpl.body.replace('{name}', lead.name) : `مرحباً ${lead.name}، أود التواصل معك.`
                  );

                  return (
                    <div
                      key={lead.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-zinc-100">
                            {lead.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium">
                            {lead.channel}
                          </span>
                        </div>
                        {lead.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate max-w-xs">
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
                          className="flex-1 sm:flex-initial py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <span>{t('send_whatsapp_btn')}</span>
                        </button>

                        <button
                          onClick={async () => {
                            soundSynth.playTactileClick();
                            haptic.vibrateWorkDone();
                            await db.leads.update(lead.id, {
                              status: 'Contacted',
                              lastContactDate: new Date().toISOString().split('T')[0],
                            });
                          }}
                          className="py-1.5 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs cursor-pointer"
                        >
                          {t('mark_contacted_btn')}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {leads.filter((l) => l.status !== 'Contacted' && l.status !== 'Closed').length === 0 && (
                  <div className="text-center py-4 text-xs text-slate-500 dark:text-zinc-400">
                    {language === 'ar' ? '🎉 تم التواصل مع كافة العملاء المستهدفين لليوم!' : 'All target leads contacted for today! 🎉'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-200 flex items-center gap-1.5">
                  <GitCommit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('coding_log_title')}</span>
                </h4>
                <div className="flex items-center gap-1.5">
                  {['Midmar PWA', 'Backend API', 'Open Source'].map((proj) => (
                    <button
                      key={proj}
                      onClick={() => setActiveProject(proj)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        activeProject === proj
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {proj}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder={t('commit_hash_placeholder')}
                  value={commitHash}
                  onChange={(e) => setCommitHash(e.target.value)}
                  className="sm:col-span-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 font-mono shadow-2xs"
                />
                <input
                  type="text"
                  placeholder={t('coding_notes_placeholder')}
                  value={githubNotes}
                  onChange={(e) => setGithubNotes(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 shadow-2xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveCodingNotes}
                  className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
                >
                  {savedNotes ? t('notes_saved') : t('save_coding_notes')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Completion & Next Station */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{t('station_4_heading')}</h4>
          <p className="text-[11px] text-slate-500 dark:text-zinc-500">
            {isCompleted ? (language === 'ar' ? 'تم إنجاز الجلسة وكسب 20 نقطة!' : 'Session complete (+20 pts)!') : (language === 'ar' ? 'أنهِ الجلسة للانتقال للمراجعة الصوتية.' : 'Complete session to advance to evening check-in.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted ? (
            <button
              onClick={onCompleteStation}
              className="py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t('mark_done')} (+20)</span>
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

      {/* Zen Fullscreen Desk Clock Overlay */}
      {isZenFullscreen && (
        <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col items-center justify-between p-6 sm:p-12 animate-fade-in font-mono select-none">
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 font-bold uppercase tracking-wider">Zen Focus Desk HUD</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{mode === 'CODING' ? t('coding_mode_btn') : t('crm_mode_btn')}</span>
            </div>

            <button
              onClick={() => setIsZenFullscreen(false)}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs border border-zinc-800"
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
            <span className="text-8xl sm:text-9xl md:text-[11rem] lg:text-[13rem] font-mono font-black tracking-tight text-emerald-400 drop-shadow-[0_0_60px_rgba(16,185,129,0.3)] block tabular-nums">
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
                className="py-4 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-base flex items-center gap-2.5 shadow-xl shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{sprintTimer.remainingSec > 0 ? t('resume_sprint') : t('start_sprint')}</span>
              </button>
            ) : (
              <button
                onClick={handlePauseSprint}
                className="py-4 px-10 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-bold text-base flex items-center gap-2.5 cursor-pointer border border-zinc-800 active:scale-95 transition-all"
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
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181a24] border border-rose-300 dark:border-rose-900/60 p-6 space-y-4 shadow-2xl animate-scale-in text-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? 'تحذير ذبول نواة التركيز' : 'Focus Core Penalty'}
                </h4>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                  {isAr ? 'خصم 50% من نقاط الجلسة (-10 نقاط)' : '-10 XP Penalty'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
              {isAr
                ? 'إلغاء الجلسة مبكراً يقطع حبل التدفق العصبي ويؤدي لذبول النواة وخسارة 10 نقاط من رصيدك. هل ترغب حقاً في الإلغاء؟'
                : 'Canceling early breaks neuro-flow, withers your focus core, and deducts 10 points. Are you sure?'}
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="tap-spring flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer text-center"
              >
                {isAr ? 'العودة للتركيز' : 'Resume Sprint'}
              </button>

              <button
                type="button"
                onClick={handleConfirmCancelPenalty}
                className="tap-spring flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer text-center"
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
