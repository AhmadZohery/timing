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
          className="w-full py-3 px-4 rounded-[26px] bg-[#141517] hover:bg-zinc-900 border border-white/10 text-white text-xs font-black flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer shadow-sm group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-[#bce8c2] text-[#141517] group-hover:scale-105 transition-transform">
              <Trophy className="w-4 h-4" />
            </div>
            <span>{isAr ? 'لوحة التقييم الدوري والتحفيز 📊' : 'Evaluation & Scorecard 📊'}</span>
          </div>
          <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-[#e2defc] text-[#141517]">
            LifeOS
          </span>
        </button>
      )}

      {/* 2. Today's Strategic Anchor Micro-Step */}
      <div className="p-4 sm:p-5 rounded-[26px] bg-white dark:bg-[#141517] border border-slate-200/90 dark:border-white/10 space-y-3.5 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#141517] dark:bg-[#bce8c2] text-[#bce8c2] dark:text-[#141517] shadow-2xs">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <h4 className="text-xs font-black text-[#141517] dark:text-white">
              {isAr ? 'مرساة اليوم غير القابلة للتفاوض' : 'Today’s Non-Negotiable Anchor'}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenGoalsModal();
            }}
            className="text-[10px] px-2.5 py-1 rounded-full bg-[#d4f5dc] hover:bg-[#bce8c2] text-[#141517] font-black border border-[#1eb814]/25 active:scale-95 transition-all cursor-pointer"
          >
            {isAr ? 'تغيير' : 'Change'}
          </button>
        </div>

        {activeAnchorStep ? (
          <button
            type="button"
            onClick={handleToggleAnchor}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer text-start transition-all active:scale-[0.98] ${
              activeAnchorStep.completed
                ? 'bg-[#bce8c2] text-[#141517] border-[#1eb814]/40 shadow-2xs'
                : 'bg-[#d4f5dc]/45 dark:bg-white/5 border-[#bce8c2] dark:border-white/10 hover:bg-[#d4f5dc]/75'
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <span className={`text-xs font-black block truncate ${
                activeAnchorStep.completed ? 'line-through text-[#141517]/70' : 'text-[#141517] dark:text-white'
              }`}>
                {activeAnchorStep.title}
              </span>
              <span className={`text-[10px] font-bold block truncate ${
                activeAnchorStep.completed ? 'text-[#141517]/80' : 'text-slate-600 dark:text-zinc-400'
              }`}>
                {activeAnchorStep.goalTitle} • {activeAnchorStep.durationMin} {isAr ? 'دقيقة' : 'min'}
              </span>
            </div>

            <div className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
              activeAnchorStep.completed
                ? 'bg-[#141517] border-[#141517] text-[#bce8c2]'
                : 'border-[#141517]/30 dark:border-zinc-600 bg-white dark:bg-zinc-900'
            }`}>
              {activeAnchorStep.completed && <CheckCircle className="w-4 h-4 stroke-[2.75]" />}
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenGoalsModal();
            }}
            className="w-full p-3.5 rounded-2xl bg-[#d4f5dc]/35 dark:bg-white/5 border border-dashed border-[#1eb814]/40 hover:bg-[#d4f5dc]/60 text-center cursor-pointer transition-all active:scale-[0.98]"
          >
            <span className="text-xs text-[#141517] dark:text-[#bce8c2] font-black block">
              {isAr ? '+ اختر خطوة مجهرية كمرساة لليوم' : '+ Select today’s non-negotiable step'}
            </span>
          </button>
        )}

        {tomorrowAnchor && (
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenGoalsModal();
            }}
            className="w-full pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-[#141517] dark:text-[#bce8c2] font-medium cursor-pointer hover:opacity-80"
          >
            <span>⚓ {isAr ? 'مرساة صباح الغد:' : 'Tomorrow Anchor:'}</span>
            <span className="font-black truncate max-w-[160px] px-2 py-0.5 rounded-lg bg-[#d4f5dc] text-[#141517]">{tomorrowAnchor}</span>
          </button>
        )}
      </div>

      {/* 3. Focus Sound Synthesizer Deck (Web Audio API) */}
      <div className="p-4 sm:p-5 rounded-[26px] bg-[#e2defc]/35 dark:bg-[#141517] border border-[#e2defc] dark:border-[#e2defc]/20 space-y-3.5 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#141517] dark:bg-[#e2defc] text-[#e2defc] dark:text-[#141517] shadow-2xs">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#141517] dark:text-white">
                {isAr ? 'مولد الأصوات وموجات التركيز' : 'Procedural Sound Synthesizer'}
              </h4>
              <span className="text-[10px] font-bold text-[#141517]/70 dark:text-[#e2defc]/80">Web Audio API • Binaural Beats</span>
            </div>
          </div>

          {ambientSound !== 'none' && (
            <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-[#141517] dark:bg-[#e2defc]/15">
              <span className="w-1 h-3 rounded-full bg-[#bce8c2] animate-pulse" />
              <span className="w-1 h-4 rounded-full bg-[#1eb814] animate-pulse delay-75" />
              <span className="w-1 h-2 rounded-full bg-[#e2defc] animate-pulse delay-150" />
            </div>
          )}
        </div>

        {/* Ambient Sound Options (Lavender #e2defc & Obsidian #141517 pills) */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => handleSetAmbient('brown')}
            className={`py-2 px-1.5 rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
              ambientSound === 'brown'
                ? 'bg-[#141517] dark:bg-[#e2defc] border-[#141517] dark:border-[#e2defc] text-[#e2defc] dark:text-[#141517] shadow-xs font-black'
                : 'bg-[#e2defc]/70 dark:bg-white/5 border-[#5448e8]/20 text-[#141517] dark:text-[#e2defc] hover:bg-[#e2defc]'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span className="text-[11px]">Brown</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetAmbient('rain')}
            className={`py-2 px-1.5 rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
              ambientSound === 'rain'
                ? 'bg-[#141517] dark:bg-[#e2defc] border-[#141517] dark:border-[#e2defc] text-[#e2defc] dark:text-[#141517] shadow-xs font-black'
                : 'bg-[#e2defc]/70 dark:bg-white/5 border-[#5448e8]/20 text-[#141517] dark:text-[#e2defc] hover:bg-[#e2defc]'
            }`}
          >
            <CloudRain className="w-3 h-3" />
            <span className="text-[11px]">Rain</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetAmbient('alpha')}
            className={`py-2 px-1.5 rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
              ambientSound === 'alpha'
                ? 'bg-[#141517] dark:bg-[#e2defc] border-[#141517] dark:border-[#e2defc] text-[#e2defc] dark:text-[#141517] shadow-xs font-black'
                : 'bg-[#e2defc]/70 dark:bg-white/5 border-[#5448e8]/20 text-[#141517] dark:text-[#e2defc] hover:bg-[#e2defc]'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span className="text-[11px]">Alpha</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetAmbient('theta')}
            className={`py-2 px-1.5 rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
              ambientSound === 'theta'
                ? 'bg-[#141517] dark:bg-[#bce8c2] border-[#141517] dark:border-[#bce8c2] text-[#bce8c2] dark:text-[#141517] shadow-xs font-black'
                : 'bg-[#e2defc]/70 dark:bg-white/5 border-[#5448e8]/20 text-[#141517] dark:text-[#e2defc] hover:bg-[#e2defc]'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span className="text-[11px]">Theta</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetAmbient('none')}
            className={`py-2 px-1.5 rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
              ambientSound === 'none'
                ? 'bg-[#141517] dark:bg-white/15 border-[#141517] dark:border-white/20 text-white font-black'
                : 'bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:bg-white'
            }`}
          >
            <VolumeX className="w-3 h-3" />
            <span className="text-[11px]">{isAr ? 'كتم' : 'Mute'}</span>
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2.5 pt-1 bg-white/80 dark:bg-white/5 px-3 py-2 rounded-2xl border border-[#5448e8]/15">
          <button
            type="button"
            onClick={() => handleSetAmbient('none')}
            className="text-[#141517] dark:text-[#e2defc] shrink-0 cursor-pointer hover:scale-110 transition-transform"
            title={isAr ? 'كتم الصوت' : 'Mute'}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-[#5448e8] h-1.5 bg-[#e2defc] dark:bg-zinc-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] font-mono font-black text-[#141517] dark:text-[#e2defc] w-8 text-end">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* 4. Goals Velocity Quick Preview */}
      <div className="p-4 sm:p-5 rounded-[26px] bg-white dark:bg-[#141517] border border-slate-200/90 dark:border-white/10 space-y-3.5 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#141517] dark:bg-[#d4f5dc] text-[#d4f5dc] dark:text-[#141517] shadow-2xs">
              <Target className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-[#141517] dark:text-white">
              {isAr ? 'سرعة الأهداف الكبرى' : 'Active Goal Velocity'}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenGoalsModal();
            }}
            className="text-[10px] px-2.5 py-1 rounded-full bg-[#d4f5dc] hover:bg-[#bce8c2] text-[#141517] flex items-center gap-0.5 cursor-pointer font-black active:scale-95 transition-all"
          >
            <span>{isAr ? 'عرض الكل' : 'View All'}</span>
            <ChevronRight className="w-3 h-3 rtl:rotate-180" />
          </button>
        </div>

        <div className="space-y-2">
          {goals.slice(0, 3).map((g) => {
            const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  onOpenGoalsModal();
                }}
                className="w-full p-2.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 hover:bg-[#d4f5dc]/40 dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10 space-y-1.5 text-start transition-all active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#141517] dark:text-zinc-100 truncate max-w-[175px]">
                    {g.title}
                  </span>
                  <span className="font-mono font-bold text-[#141517] dark:text-[#bce8c2]">
                    {g.currentValue}/{g.targetValue} {g.unit} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1eb814] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Saturday Buffer Health Card */}
      <div className="p-4 sm:p-5 rounded-[26px] bg-[#fde6d8]/45 dark:bg-[#141517] border border-[#fde6d8] dark:border-[#fde6d8]/20 space-y-3 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#141517] dark:bg-[#fde6d8] text-[#fde6d8] dark:text-[#141517] shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#141517] dark:text-white">
                {isAr ? 'صمام بافر السبت (3 ساعات)' : 'Saturday Buffer Health'}
              </h4>
              <span className="text-[10px] font-bold text-[#141517]/70 dark:text-[#fde6d8]/80">
                {isAr ? 'تأجيل آمن يحمي شعلتك' : 'Zero-guilt streak protection'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenBufferModal();
            }}
            className="text-[10px] px-3 py-1 rounded-full bg-[#141517] dark:bg-[#fde6d8] text-[#fde6d8] dark:text-[#141517] font-black cursor-pointer shadow-2xs active:scale-95 transition-transform"
          >
            {pendingBufferCount} {isAr ? 'مؤجل' : 'Queued'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            onOpenBufferModal();
          }}
          className="w-full p-3 rounded-2xl bg-white/85 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-[#ff5500]/20 text-[11px] text-[#141517] dark:text-zinc-200 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98]"
        >
          <span className="font-bold">{isAr ? 'المتاح للتأجيل هذا الأسبوع:' : 'Buffer capacity remaining:'}</span>
          <span className="font-mono font-black px-2 py-0.5 rounded-lg bg-[#bce8c2] text-[#141517]">
            {Math.max(0, 2 - (userState?.weeklyBufferCount || 0))} / 2
          </span>
        </button>
      </div>
    </aside>
  );
};

