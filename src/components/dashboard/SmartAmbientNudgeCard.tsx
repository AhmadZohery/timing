import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Zap,
  Coffee,
  BookOpen,
  ArrowLeft,
  Check,
} from 'lucide-react';
import type { DailyLog, UserState, StationId, SmartNudge } from '../../types';
import { behavioralLearning } from '../../services/behavioralLearningService';
import { getTodayWorkRhythm } from '../../utils/workRhythm';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface SmartAmbientNudgeCardProps {
  todayLog?: DailyLog;
  userState?: UserState;
  dailyLogs?: DailyLog[];
  onSelectStation: (station: StationId) => void;
  onOpenSleepRest: () => void;
  onStartSuggestedSprint?: (durationMin: number) => void;
  onRewardToast?: (msg: string) => void;
  className?: string;
}

export const SmartAmbientNudgeCard: React.FC<SmartAmbientNudgeCardProps> = ({
  todayLog,
  userState,
  dailyLogs,
  onSelectStation,
  onOpenSleepRest,
  onStartSuggestedSprint,
  onRewardToast,
  className = '',
}) => {
  const [currentNudge, setCurrentNudge] = useState<SmartNudge | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function evaluateNudge() {
      try {
        const dna = await behavioralLearning.getOrComputeDNA(dailyLogs);
        const rhythm = getTodayWorkRhythm(new Date(), userState?.settings?.workRhythmConfig);
        const nudge = behavioralLearning.getBestContextualNudge(
          dna,
          new Date(),
          todayLog,
          userState,
          rhythm.rhythm
        );
        if (isMounted) {
          setCurrentNudge(nudge);
          setIsApplied(false);
        }
      } catch (err) {
        console.warn('Failed to evaluate smart nudge', err);
      }
    }

    evaluateNudge();
    const interval = setInterval(evaluateNudge, 60 * 1000); // Re-evaluate every 60s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [todayLog, userState, dailyLogs]);

  if (!currentNudge || isDismissing) {
    return null;
  }

  const handleApply = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateWorkDone();
    setIsApplied(true);

    // Record positive feedback
    await behavioralLearning.recordFeedback(currentNudge.id, 'applied');

    // Execute designated action
    if (currentNudge.actionType === 'start_suggested_sprint') {
      const dur = currentNudge.actionPayload?.duration || 20;
      onStartSuggestedSprint?.(dur);
      onSelectStation('WORK_MICRO_SPRINT');
      onRewardToast?.(`⚡ تم تفعيل جلسة الـ ${dur} دقيقة المقترحة لتركيزك!`);
    } else if (currentNudge.actionType === 'navigate_station' && currentNudge.actionStation) {
      onSelectStation(currentNudge.actionStation);
    } else if (currentNudge.actionType === 'open_sleep') {
      onOpenSleepRest();
    }

    // Dismiss after brief confirmation
    setTimeout(() => {
      setIsDismissing(true);
      setTimeout(() => setCurrentNudge(null), 300);
    }, 1200);
  };

  const handleDismiss = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsDismissing(true);

    // Record dismissal for cooldown
    await behavioralLearning.recordFeedback(currentNudge.id, 'dismissed');

    onRewardToast?.('👍 تمام، لن نقترح عليك هذا الآن وسنتركك تركز.');
    setTimeout(() => setCurrentNudge(null), 300);
  };

  // Dynamic icon based on category
  const renderCategoryIcon = () => {
    switch (currentNudge.category) {
      case 'focus_optimization':
        return <Zap className="w-4 h-4 text-sky-500" />;
      case 'prayer_harmony':
        return <BookOpen className="w-4 h-4 text-emerald-500" />;
      case 'recovery_rest':
        return <Coffee className="w-4 h-4 text-amber-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div
      dir="rtl"
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3 sm:p-4 border border-indigo-500/30 shadow-lg shadow-indigo-950/20 transition-all duration-300 animate-fade-in ${className}`}
    >
      {/* Decorative Subtle Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        {/* Content Info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-white/10 text-white shrink-0 mt-0.5 border border-white/10 shadow-xs">
            {renderCategoryIcon()}
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {currentNudge.wittyTag}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                {currentNudge.headline}
              </h4>
            </div>
            <p className="text-xs text-indigo-100/80 leading-relaxed max-w-2xl">
              {currentNudge.message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {currentNudge.actionLabel && !isApplied ? (
            <button
              type="button"
              onClick={handleApply}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <span>{currentNudge.actionLabel}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          ) : isApplied ? (
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Check className="w-3.5 h-3.5" />
              <span>تم التطبيق بنجاح!</span>
            </span>
          ) : null}

          <button
            type="button"
            onClick={handleDismiss}
            title="مش وقته (تخطي دون إزعاج)"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors cursor-pointer border border-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
