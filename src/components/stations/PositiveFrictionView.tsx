import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Home,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserState } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { resolveStationMetadata, PERSONA_CONFIGS } from '../../utils/lifestyleEngine';
import { triggerCelebrationConfetti } from '../../utils/gamification';

interface PositiveFrictionViewProps {
  stationId: 'ONE_SEC_FRICTION' | 'SOCIAL_MEDIA_BREAK';
  onNextStation: () => void;
  onReturnHome: () => void;
  onOpenZeroInertia?: () => void;
  userState?: UserState;
  onRewardToast?: (msg: string) => void;
}

export const PositiveFrictionView: React.FC<PositiveFrictionViewProps> = ({
  stationId,
  onNextStation,
  onReturnHome,
  onOpenZeroInertia,
  userState,
  onRewardToast,
}) => {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const persona = PERSONA_CONFIGS[personaId] || PERSONA_CONFIGS.builder_exec;
  const meta = resolveStationMetadata(stationId, personaId, userState?.settings?.stationCustomOverrides, isAr);

  // Box Breathing cycle (4s Inhale, 4s Hold, 4s Exhale, 4s Rest = 16s cycle)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [breathCount, setBreathCount] = useState(4);
  const [completedBreaths, setCompletedBreaths] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBreathCount((prev) => {
        if (prev <= 1) {
          setBreathPhase((currPhase) => {
            if (currPhase === 'inhale') return 'hold';
            if (currPhase === 'hold') return 'exhale';
            if (currPhase === 'exhale') return 'rest';
            // Rest finished: complete 1 breath cycle
            setCompletedBreaths((c) => c + 1);
            return 'inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getBreathLabel = () => {
    if (isAr) {
      switch (breathPhase) {
        case 'inhale': return 'شَهِيق عَميق (املأ الرئتين)';
        case 'hold': return 'احبِس النَّفَس (صفاء ذهني)';
        case 'exhale': return 'زَفِير هَادئ (تفريغ التوتر)';
        case 'rest': return 'استِقرَار وتأمُّل';
      }
    } else {
      switch (breathPhase) {
        case 'inhale': return 'Deep Inhale (Fill lungs)';
        case 'hold': return 'Hold Breath (Stillness)';
        case 'exhale': return 'Slow Exhale (Release tension)';
        case 'rest': return 'Ground & Pause';
      }
    }
  };

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const StationIcon = meta.icon;
  const title = isAr ? meta.titleAr : meta.titleEn;
  const description = isAr ? meta.descriptionAr : meta.descriptionEn;
  const stationStepNumber = stationId === 'ONE_SEC_FRICTION' ? 3 : 4;

  const handleProceedWithCelebration = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    try {
      const x = e.clientX ? e.clientX / window.innerWidth : 0.5;
      const y = e.clientY ? e.clientY / window.innerHeight : 0.6;
      confetti({ disableForReducedMotion: true,
        particleCount: 55,
        spread: 65,
        origin: { x, y },
        colors: ['#1eb814', '#bce8c2', '#fde6d8', '#fce2e6'],
      });
    } catch {
      triggerCelebrationConfetti();
    }
    if (onRewardToast) {
      onRewardToast(
        isAr
          ? '🌟 أحسنت باجتياز وقفة الهدوء بوعي كامل (+10 XP)'
          : '🌟 Great job completing your positive friction pause (+10 XP)'
      );
    }
    onNextStation();
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto py-2" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Habitline Obsidian Station Hero Banner */}
      <div className="celestial-obsidian-stage rounded-[28px] text-white p-4 sm:p-5 border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-habit-flame-ink text-white flex items-center justify-center shadow-lg shadow-[#ff5500]/25 shrink-0">
            <StationIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0 space-y-1 text-start">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-bold border border-white/10">
                {isAr ? `المحطة ${stationStepNumber} من 8` : `Station ${stationStepNumber} of 8`}
              </span>
              <span className="text-[11px] text-zinc-300 font-bold">
                {persona.badge} • <bdi dir="ltr" className="font-mono tabular-nums text-[#fde6d8]">{meta.shortTime}</bdi>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">
              {title}
            </h2>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
          {completedBreaths > 0 && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-[#bce8c2] text-zinc-950 font-bold shadow-xs">
              {isAr ? 'مكتملة اليوم ✓' : 'Completed ✓'}
            </span>
          )}
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-[#fde6d8] text-zinc-950 font-mono font-bold tabular-nums shadow-sm">
            +10 XP
          </span>
        </div>
      </div>

      {/* Positive Friction Context Banner — Habitline Soft Rose Surface */}
      <div className="bento-3d-rose p-5 rounded-[28px] border border-white/60 dark:border-rose-500/30 text-center space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-white/90 dark:bg-zinc-900 text-[11px] font-mono font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 shadow-2xs">
          {isAr ? 'وقفة كسر الاندفاع الدوباميني (One-Sec Positive Friction)' : 'Positive Friction & Dopamine Interrupt'}
        </span>
        <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 max-w-xl mx-auto leading-relaxed font-medium">
          {description}
        </p>
      </div>

      {/* Interactive Dopamine Breathing Regulator — Crisp White Habitline Bento */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center space-y-5">
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-100">
            {isAr ? 'دائرة التنفس الصندوقي لتهدئة الجهاز العصبي' : 'Box Breathing Nervous Reset'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {isAr ? '4 ثوانٍ شهيق • 4 ثوانٍ حبس • 4 ثوانٍ زفير • 4 ثوانٍ ثبات' : '4s Inhale • 4s Hold • 4s Exhale • 4s Rest'}
          </p>
        </div>

        {/* Pulsing Breathing Circle */}
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full transition-all duration-1000 ${
              breathPhase === 'inhale'
                ? 'scale-100 bg-[#d4f5dc] dark:bg-emerald-500/20 border-2 border-[#1eb814] animate-pulse'
                : breathPhase === 'hold'
                ? 'scale-105 bg-[#fde6d8] dark:bg-amber-500/25 border-2 border-[#ff5500]'
                : breathPhase === 'exhale'
                ? 'scale-85 bg-[#e2defc] dark:bg-indigo-500/20 border-2 border-[#5448e8]'
                : 'scale-90 bg-[#fce2e6] dark:bg-rose-500/15 border-2 border-rose-400'
            }`}
          />
          <div className="relative z-10 flex flex-col items-center justify-center space-y-1">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-zinc-950 dark:text-zinc-100 tabular-nums">
              {breathCount}
            </span>
            <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 max-w-[130px] text-center">
              {getBreathLabel()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono font-medium">
          <span>{isAr ? 'الدورات المكتملة:' : 'Completed Cycles:'}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#bce8c2] text-zinc-950 font-bold tabular-nums">
            {completedBreaths}
          </span>
        </div>
      </div>

      {/* Conscious Decision Branching — Habitline Pastel Action Grid */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center">
          {isAr ? 'سؤال الوعي والنية: ما هي خطوتك التالية؟' : 'Conscious Intent: What is your next move?'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: Return to Focus / Home — Soft Lavender */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onReturnHome();
            }}
            className="bento-3d-lavender bento-press p-4 rounded-[22px] border border-white/60 dark:border-indigo-400/25 text-zinc-950 dark:text-zinc-100 text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-2 text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-[#5448e8] text-white flex items-center justify-center shadow-xs">
              <Home className="w-4 h-4" />
            </div>
            <span>{isAr ? 'العودة للرئيسية والتركيز' : 'Return to Home'}</span>
          </button>

          {/* Action 2: 3-Min Zero Inertia Break — Soft Amber */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              if (onOpenZeroInertia) {
                onOpenZeroInertia();
              }
            }}
            className="bento-3d-amber bento-press p-4 rounded-[22px] border border-white/60 dark:border-amber-400/35 text-zinc-950 dark:text-amber-100 text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-2 text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-habit-flame-ink text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <span>{isAr ? 'كسر الجمود (مهمة مصغرة 3د)' : 'Zero-Inertia Break (3m)'}</span>
          </button>

          {/* Action 3: Proceed to Next Station — Habitline Emerald Pill CTA */}
          <button
            type="button"
            onClick={handleProceedWithCelebration}
            className="bento-press p-4 rounded-[22px] bg-habit-green-ink hover:bg-habit-green-ink-deep text-white text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-2 text-center shadow-lg shadow-[#1eb814]/25"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <ArrowIcon className="w-4 h-4" />
            </div>
            <span>{isAr ? 'إتمام المحطة والانتقال للتالية ⚡' : 'Complete & Next Station ⚡'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
