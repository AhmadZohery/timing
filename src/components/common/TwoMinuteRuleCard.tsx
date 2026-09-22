import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface TwoMinuteRuleCardProps {
  stationTitle?: string;
  onCompleteTwoMinutes?: () => void;
  onContinueStation?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const TwoMinuteRuleCard: React.FC<TwoMinuteRuleCardProps> = ({
  stationTitle,
  onCompleteTwoMinutes,
  onContinueStation,
  onClose,
  isModal = false,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [remainingSec, setRemainingSec] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isRunning && remainingSec > 0) {
      timer = setTimeout(() => {
        setRemainingSec((prev) => prev - 1);
        if (remainingSec % 10 === 0) {
          haptic.vibrateLight();
        }
      }, 1000);
    } else if (remainingSec === 0 && isRunning) {
      setIsRunning(false);
      setIsCompleted(true);
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      if (onCompleteTwoMinutes) {
        onCompleteTwoMinutes();
      }
    }
    return () => clearTimeout(timer);
  }, [isRunning, remainingSec, onCompleteTwoMinutes]);

  const handleToggle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    soundSynth.playTactileClick();
    setIsRunning(false);
    setRemainingSec(120);
    setIsCompleted(false);
  };

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;
  const progressPct = ((120 - remainingSec) / 120) * 100;

  const content = (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-emerald-500/10 border border-amber-300 dark:border-amber-500/30 space-y-4 shadow-sm relative overflow-hidden transition-colors">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                {isAr ? 'قاعدة الدقيقتين (Atomic Habits)' : 'The 2-Minute Rule'}
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">+5 {isAr ? 'نقاط زخم' : 'pts'}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
              {isAr ? 'صعب عليك تبدأ؟ التزم بـ 120 ثانية فقط!' : 'High resistance? Commit to just 120 seconds!'}
            </h4>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed relative z-10">
        {isAr
          ? 'المقاومة النفسية تكون في أشدها قبل البداية مباشرة. تعاهد مع نفسك الآن: سأبدأ لمدة دقيقتين فقط، وإن أردت التوقف بعدها فلك كامل الحرية بدون أي لوم!'
          : 'Psychological friction peaks right before starting. Tell yourself: Just 2 minutes, and you are totally free to stop if you want!'}
      </p>

      {/* Timer & Controls Display */}
      <div className="p-3 sm:p-4 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          {/* Circular miniature indicator */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-zinc-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-amber-500 transition-all duration-300"
                strokeDasharray={`${progressPct}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-mono font-black text-slate-900 dark:text-zinc-100">
              {timeFormatted}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
              {isCompleted
                ? (isAr ? 'عظيم! كسرت حاجز البداية 🔥' : 'Awesome! Friction broken 🔥')
                : isRunning
                ? (isAr ? 'استمر.. فقط تنفس وافعل أقل حركة ممكنة' : 'Keep going.. just do the tiny first move')
                : (isAr ? 'اضغط تشغيل وابدأ خطوتك الأولى' : 'Tap play and take the micro step')}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400">
              {stationTitle ? `${isAr ? 'في:' : 'In:'} ${stationTitle}` : (isAr ? 'أي بداية صغيرة كافية' : 'Any tiny start counts')}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {!isCompleted ? (
            <>
              <button
                onClick={handleToggle}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
                  isRunning
                    ? 'bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-300'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'بدء الدقيقتين ⚡' : 'Start 2 Min ⚡')}</span>
              </button>

              <button
                onClick={handleReset}
                className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer"
                title={isAr ? 'إعادة ضبط' : 'Reset'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (onContinueStation) onContinueStation();
                else if (onClose) onClose();
              }}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'أشعر بالزخم! سأكمل المحطة 🚀' : 'Feeling momentum! Continue 🚀'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
        <div className="w-full max-w-lg">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
