import React, { useState } from 'react';
import {
  Target,
  Zap,
  CheckCircle,
  Volume2,
  VolumeX,
  CloudRain,
  Radio,
  Clock,
  ChevronRight,
  Headphones,
  Trophy,
} from 'lucide-react';
import type { Goal, DailyLog, BufferItem, UserState } from '../../types';
import { HabitConsistencyRadar } from './HabitConsistencyRadar';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { db } from '../../db/db';
import { useTranslation } from '../../i18n/LanguageContext';

interface CompanionSidebarProps {
  dailyLogs: DailyLog[];
  todayDate: string;
  userState: UserState | undefined;
  todayLog: DailyLog | undefined;
  goals: Goal[];
  bufferItems: BufferItem[];
  onOpenGoalsModal: () => void;
  onOpenBufferModal: () => void;
  onOpenArchiveModal?: () => void;
  onOpenEvaluationModal?: () => void;
}

export const CompanionSidebar: React.FC<CompanionSidebarProps> = ({
  dailyLogs,
  todayDate,
  userState,
  todayLog,
  goals,
  bufferItems,
  onOpenGoalsModal,
  onOpenBufferModal,
  onOpenArchiveModal,
  onOpenEvaluationModal,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [ambientSound, setAmbientSound] = useState<('none' | 'brown' | 'rain' | 'alpha' | 'theta')>('none');
  const [volume, setVolume] = useState(0.5);

  // Find the selected anchor micro-step from all goals
  const selectedAnchorId = todayLog?.selectedAnchorMicroStepId;
  let activeAnchorStep: { goalTitle: string; title: string; durationMin: number; completed: boolean; goalId: string; stepId: string } | null = null;

  for (const g of goals) {
    const step = g.microSteps.find((s) => s.id === selectedAnchorId || s.isTodayAnchor);
    if (step) {
      activeAnchorStep = {
        goalTitle: g.title,
        title: step.title,
        durationMin: step.durationMin,
        completed: step.completed,
        goalId: g.id,
        stepId: step.id,
      };
      break;
    }
  }

  // Toggle anchor completion
  const handleToggleAnchor = async () => {
    if (!activeAnchorStep) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const goal = await db.goals.get(activeAnchorStep.goalId);
    if (!goal) return;

    const updated = goal.microSteps.map((s) =>
      s.id === activeAnchorStep?.stepId ? { ...s, completed: !s.completed } : s
    );

    await db.goals.update(activeAnchorStep.goalId, { microSteps: updated });
  };

  // Toggle ambient sound directly from sidebar
  const handleSetAmbient = (type: 'none' | 'brown' | 'rain' | 'alpha' | 'theta') => {
    soundSynth.playTactileClick();
    setAmbientSound(type);
    if (type === 'none') {
      soundSynth.stopAmbient();
    } else {
      soundSynth.startAmbient(type, volume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (ambientSound !== 'none') {
      soundSynth.startAmbient(ambientSound, newVol);
    }
  };

  const pendingBufferCount = bufferItems.filter((i) => i.status === 'pending').length;
  const tomorrowAnchor = localStorage.getItem('midmar_tomorrow_anchor');

  return (
    <aside className="space-y-4 transition-colors">
      {/* 1. 7-Day Multi-Station Consistency Matrix */}
      <HabitConsistencyRadar
        dailyLogs={dailyLogs}
        todayDate={todayDate}
        streakDays={userState?.streakDays || 0}
        streakShields={userState?.streakShields || 0}
        totalPoints={userState?.totalPoints || 0}
        onOpenArchiveModal={onOpenArchiveModal}
      />

      {/* Quick LifeOS Evaluation & Scorecard Launcher */}
      {onOpenEvaluationModal && (
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            onOpenEvaluationModal();
          }}
          className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-300 dark:border-emerald-700/50 hover:border-emerald-400 text-emerald-950 dark:text-emerald-200 text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>{isAr ? 'لوحة التقييم الدوري والتحفيز 📊' : 'Evaluation & Scorecard 📊'}</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
            LifeOS
          </span>
        </button>
      )}

      {/* 2. Today's Strategic Anchor Micro-Step */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <Zap className="w-4 h-4 fill-emerald-500" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              {isAr ? 'مرساة اليوم غير القابلة للتفاوض' : 'Today’s Non-Negotiable Anchor'}
            </h4>
          </div>

          <button
            onClick={onOpenGoalsModal}
            className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            {isAr ? 'تغيير' : 'Change'}
          </button>
        </div>

        {activeAnchorStep ? (
          <div
            onClick={handleToggleAnchor}
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              activeAnchorStep.completed
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:border-emerald-400'
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <span className={`text-xs font-bold block truncate ${
                activeAnchorStep.completed ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-900 dark:text-zinc-100'
              }`}>
                {activeAnchorStep.title}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                {activeAnchorStep.goalTitle} • {activeAnchorStep.durationMin} {isAr ? 'دقيقة' : 'min'}
              </span>
            </div>

            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
              activeAnchorStep.completed
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}>
              {activeAnchorStep.completed && <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
        ) : (
          <div
            onClick={onOpenGoalsModal}
            className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 hover:border-emerald-400 text-center cursor-pointer transition-colors"
          >
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium block">
              {isAr ? '+ اختر خطوة مجهرية كمرساة لليوم' : '+ Select today’s non-negotiable step'}
            </span>
          </div>
        )}

        {tomorrowAnchor && (
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-teal-800 dark:text-teal-300 font-medium">
            <span>⚓ {isAr ? 'مرساة صباح الغد:' : 'Tomorrow Anchor:'}</span>
            <span className="font-bold truncate max-w-[160px]">{tomorrowAnchor}</span>
          </div>
        )}
      </div>

      {/* 3. Focus Sound Synthesizer Deck (Web Audio API) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                {isAr ? 'مولد الأصوات وموجات التركيز' : 'Procedural Sound Synthesizer'}
              </h4>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">Web Audio API • Binaural Beats</span>
            </div>
          </div>

          {ambientSound !== 'none' && (
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="w-1 h-4 rounded-full bg-emerald-500 animate-pulse delay-75" />
              <span className="w-1 h-2 rounded-full bg-emerald-500 animate-pulse delay-150" />
            </div>
          )}
        </div>

        {/* Ambient Sound Options */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs font-medium">
          <button
            onClick={() => handleSetAmbient('brown')}
            className={`py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all ${
              ambientSound === 'brown'
                ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-400 text-amber-900 dark:text-amber-200 shadow-2xs font-bold'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span className="text-[11px]">Brown</span>
          </button>

          <button
            onClick={() => handleSetAmbient('rain')}
            className={`py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all ${
              ambientSound === 'rain'
                ? 'bg-sky-100 dark:bg-cyan-500/20 border-sky-300 dark:border-cyan-400 text-sky-900 dark:text-cyan-200 shadow-2xs font-bold'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            <CloudRain className="w-3 h-3" />
            <span className="text-[11px]">Rain</span>
          </button>

          <button
            onClick={() => handleSetAmbient('alpha')}
            className={`py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all ${
              ambientSound === 'alpha'
                ? 'bg-purple-100 dark:bg-purple-500/20 border-purple-300 dark:border-purple-400 text-purple-900 dark:text-purple-200 shadow-2xs font-bold'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span className="text-[11px]">Alpha</span>
          </button>

          <button
            onClick={() => handleSetAmbient('theta')}
            className={`py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all ${
              ambientSound === 'theta'
                ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-400 text-emerald-900 dark:text-emerald-200 shadow-2xs font-bold'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span className="text-[11px]">Theta</span>
          </button>

          <button
            onClick={() => handleSetAmbient('none')}
            className={`py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all ${
              ambientSound === 'none'
                ? 'bg-slate-200 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 font-bold'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400'
            }`}
          >
            <VolumeX className="w-3 h-3" />
            <span className="text-[11px]">{isAr ? 'كتم' : 'Mute'}</span>
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2 pt-1">
          <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] font-mono text-slate-400 w-7 text-end">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* 4. Goals Velocity Quick Preview */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400">
              <Target className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              {isAr ? 'سرعة الأهداف الكبرى' : 'Active Goal Velocity'}
            </h4>
          </div>

          <button
            onClick={onOpenGoalsModal}
            className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
          >
            <span>{isAr ? 'عرض الكل' : 'View All'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2.5">
          {goals.slice(0, 3).map((g) => {
            const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
            return (
              <div key={g.id} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[180px]">
                    {g.title}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-zinc-400">
                    {g.currentValue}/{g.targetValue} {g.unit} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-sky-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Saturday Buffer Health Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2.5 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                {isAr ? 'صمام بافر السبت (3 ساعات)' : 'Saturday Buffer Health'}
              </h4>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                {isAr ? 'تأجيل آمن يحمي شعلتك' : 'Zero-guilt streak protection'}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenBufferModal}
            className="text-[10px] px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/40 cursor-pointer shadow-2xs"
          >
            {pendingBufferCount} {isAr ? 'مؤجل' : 'Queued'}
          </button>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 flex items-center justify-between">
          <span>{isAr ? 'المتاح للتأجيل هذا الأسبوع:' : 'Buffer capacity remaining:'}</span>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
            {Math.max(0, 2 - (userState?.weeklyBufferCount || 0))} / 2
          </span>
        </div>
      </div>
    </aside>
  );
};
