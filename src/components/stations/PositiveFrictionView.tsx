import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Home,
  Zap,
} from 'lucide-react';
import type { UserState } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { resolveStationMetadata } from '../../utils/lifestyleEngine';

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

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto py-2" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white dark:via-zinc-900 to-emerald-500/10 border border-amber-500/25 shadow-xs text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 shadow-inner">
          <StationIcon className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {isAr ? 'وقفة كسر الاندفاع الدوباميني (One-Sec Positive Friction)' : 'Positive Friction & Dopamine Interrupt'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Interactive Dopamine Breathing Regulator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs flex flex-col items-center justify-center text-center space-y-5">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            {isAr ? 'دائرة التنفس الصندوقي لتهدئة الجهاز العصبي' : 'Box Breathing Nervous Reset'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {isAr ? '4 ثوانٍ شهيق • 4 ثوانٍ حبس • 4 ثوانٍ زفير • 4 ثوانٍ ثبات' : '4s Inhale • 4s Hold • 4s Exhale • 4s Rest'}
          </p>
        </div>

        {/* Pulsing Breathing Circle */}
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full transition-all duration-1000 ${
              breathPhase === 'inhale'
                ? 'scale-100 bg-emerald-500/20 border-2 border-emerald-500 animate-pulse'
                : breathPhase === 'hold'
                ? 'scale-105 bg-amber-500/25 border-2 border-amber-500'
                : breathPhase === 'exhale'
                ? 'scale-85 bg-sky-500/20 border-2 border-sky-500'
                : 'scale-90 bg-indigo-500/15 border-2 border-indigo-400'
            }`}
          />
          <div className="relative z-10 flex flex-col items-center justify-center space-y-1">
            <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-zinc-100">
              {breathCount}
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 max-w-[120px] text-center">
              {getBreathLabel()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 font-mono font-medium">
          <span>{isAr ? 'الدورات المكتملة:' : 'Completed Cycles:'}</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
            {completedBreaths}
          </span>
        </div>
      </div>

      {/* Conscious Decision Branching */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 text-center">
          {isAr ? 'سؤال الوعي والنية: ما هي خطوتك التالية؟' : 'Conscious Intent: What is your next move?'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: Return to Focus / Home */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onReturnHome();
            }}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold transition-all active:scale-95 cursor-pointer flex flex-col items-center gap-2 text-center"
          >
            <div className="p-2 rounded-xl bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300">
              <Home className="w-4 h-4" />
            </div>
            <span>{isAr ? 'العودة للرئيسية والتركيز' : 'Return to Home'}</span>
          </button>

          {/* Action 2: 3-Min Zero Inertia Break */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              if (onOpenZeroInertia) {
                onOpenZeroInertia();
              }
            }}
            className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all active:scale-95 cursor-pointer flex flex-col items-center gap-2 text-center"
          >
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
              <Zap className="w-4 h-4" />
            </div>
            <span>{isAr ? 'كسر الجمود (مهمة مصغرة 3د)' : 'Zero-Inertia Break (3m)'}</span>
          </button>

          {/* Action 3: Proceed to Next Station */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playCompletionChime();
              haptic.vibrateSprintCelebration();
              if (onRewardToast) {
                onRewardToast(
                  isAr
                    ? '🌟 أحسنت باجتياز وقفة الهدوء بوعي كامل (+10 XP)'
                    : '🌟 Great job completing your positive friction pause (+10 XP)'
                );
              }
              onNextStation();
            }}
            className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer flex flex-col items-center gap-2 text-center shadow-md shadow-emerald-600/20"
          >
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <ArrowIcon className="w-4 h-4" />
            </div>
            <span>{isAr ? 'المتابعة للمحطة التالية ⚡' : 'Proceed to Next Station'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
