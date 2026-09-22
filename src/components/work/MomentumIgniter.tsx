import React, { useState, useEffect } from 'react';
import { Wind, Play, ShieldCheck } from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface MomentumIgniterProps {
  onCommit: (actionTitle: string) => void;
  onClose?: () => void;
  defaultTaskTitle?: string;
}

type Step = 'breathe' | 'commit' | 'ignited';

export const MomentumIgniter: React.FC<MomentumIgniterProps> = ({
  onCommit,
  onClose,
  defaultTaskTitle = '',
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [step, setStep] = useState<Step>('breathe');
  const [breathPhase, setBreathPhase] = useState<'inhale1' | 'inhale2' | 'exhale' | 'hold'>('inhale1');
  const [breathCycle, setBreathCycle] = useState(1);
  const totalCycles = 4;
  const [customAction, setCustomAction] = useState('');

  // 2-minute Physiological Sigh Timer
  useEffect(() => {
    if (step !== 'breathe') return;

    let timer: NodeJS.Timeout;
    if (breathPhase === 'inhale1') {
      timer = setTimeout(() => {
        setBreathPhase('inhale2');
        soundSynth.playTactileClick();
        haptic.vibrateLight();
      }, 2500); // 2.5s deep inhale
    } else if (breathPhase === 'inhale2') {
      timer = setTimeout(() => {
        setBreathPhase('exhale');
        haptic.vibrateMedium();
      }, 1500); // 1.5s second sharp sip
    } else if (breathPhase === 'exhale') {
      timer = setTimeout(() => {
        if (breathCycle >= totalCycles) {
          setBreathPhase('hold');
          setStep('commit');
          soundSynth.playCompletionChime();
        } else {
          setBreathCycle((c) => c + 1);
          setBreathPhase('inhale1');
          soundSynth.playTactileClick();
        }
      }, 5000); // 5.0s long sigh exhale
    }

    return () => clearTimeout(timer);
  }, [step, breathPhase, breathCycle]);

  const handleStartSprint = () => {
    const action = customAction.trim() || defaultTaskTitle || (isAr ? 'أول خطوة صغيرة لمدة دقيقتين' : 'First 2-minute micro action');
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    onCommit(action);
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden p-5 sm:p-6 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Wind className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
              {isAr ? 'مُشعل الزخم وتخفيف المقاومة (Physiological Sigh)' : 'Momentum Igniter & Anti-Resistance'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isAr
                ? 'تنفس تنهيدة فسيولوجية لخفض الكورتيزول وتصفية الذهن، ثم ابدأ بخطوة مدتها دقيقتان فقط.'
                : 'Scientific Stanford breathwork to reset autonomic arousal, followed by 1 micro commitment.'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {step === 'breathe' && (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
          {/* Animated Breath Bubble */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <div
              className={`absolute inset-0 rounded-full transition-all duration-1000 ease-in-out ${
                breathPhase === 'inhale1'
                  ? 'scale-90 bg-cyan-400/20 border-2 border-cyan-400'
                  : breathPhase === 'inhale2'
                  ? 'scale-110 bg-sky-500/30 border-2 border-sky-400'
                  : 'scale-70 bg-indigo-500/10 border-2 border-indigo-400/50'
              }`}
            />
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500 mb-1">
                {isAr ? `دورة ${breathCycle} من ${totalCycles}` : `Cycle ${breathCycle} of ${totalCycles}`}
              </span>
              <span className="text-base font-black text-slate-800 dark:text-zinc-100">
                {breathPhase === 'inhale1' && (isAr ? 'شهيق عميق بالأنف' : 'Deep Nose Inhale')}
                {breathPhase === 'inhale2' && (isAr ? 'رشفة هواء ثانية ✦' : 'Second Quick Sip ✦')}
                {breathPhase === 'exhale' && (isAr ? 'زفير بطيء بالفم ~' : 'Slow Mouth Exhale ~')}
                {breathPhase === 'hold' && (isAr ? 'استقرار تام' : 'Centered')}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                {breathPhase === 'inhale1' && '2.5s'}
                {breathPhase === 'inhale2' && '1.5s'}
                {breathPhase === 'exhale' && '5.0s'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundSynth.playTactileClick();
                setStep('commit');
              }}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 underline cursor-pointer"
            >
              {isAr ? 'تخطي التنفس والانتقال للالتزام المباشر' : 'Skip breathwork to commitment'}
            </button>
          </div>
        </div>
      )}

      {step === 'commit' && (
        <div className="space-y-4 py-2">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              <strong className="block font-black mb-0.5">
                {isAr ? 'هدوء عصبي ممتاز. الآن اكسر عتبة البداية (2-Minute Rule):' : 'System reset. Now break initial friction:'}
              </strong>
              {isAr
                ? 'لا تفكر في إنجاز المهمة كاملة. فقط حدد حركة واحدة مدتها 120 ثانية، مثل: فتح الملف، كتابة سطر واحد، أو مسح طاولة العمل.'
                : 'Do not think about completing the whole task. Commit to just 120 seconds of physical action.'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              {isAr ? 'حركتي البسيطة الآن:' : 'My 2-minute micro action:'}
            </label>
            <input
              type="text"
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              placeholder={
                defaultTaskTitle
                  ? `${isAr ? 'مثال: فتح مسودة لـ' : 'E.g.: Open draft for'} ${defaultTaskTitle}`
                  : (isAr ? 'مثال: فتح الملف وكتابة العنوان فقط' : 'E.g. Open editor and type the first line')
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handleStartSprint}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isAr ? 'انطلق لدقيقتين فقط (الزخم يولد الإنجاز) 🚀' : 'Ignite 2-minute micro action 🚀'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
