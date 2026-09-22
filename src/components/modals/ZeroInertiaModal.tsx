import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  X,
  Play,
  CheckCircle,
  Zap,
  Smile,
} from 'lucide-react';
import { useWorkerTimer } from '../../hooks/useWorkerTimer';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface ZeroInertiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompletedInertiaBreak: () => void;
}

const MICRO_TASKS_AR = [
  'اقرأ آية واحدة فقط من المصحف الشريف بتدبر',
  'افتح محرر الأكواد واكتب سطراً واحداً فقط أو تعليق توضيحي',
  'اشرب كوب ماء كبير وقم بعمل 5 حركات إطالة خفيفة',
  'اقرأ صفحة واحدة أو فقرة واحدة من كتابك الحالي',
];

const MICRO_TASKS_EN = [
  'Read just one Ayah mindfully from the Holy Quran',
  'Open your code editor and write exactly one line or comment',
  'Drink a tall glass of water and do 5 gentle mobility stretches',
  'Read one single page or paragraph from your current book',
];

export const ZeroInertiaModal: React.FC<ZeroInertiaModalProps> = ({
  isOpen,
  onClose,
  onCompletedInertiaBreak,
}) => {
  const { t, language } = useTranslation();

  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const microTasks = language === 'ar' ? MICRO_TASKS_AR : MICRO_TASKS_EN;

  // 3-minute non-threatening micro-timer (180 sec)
  const timer = useWorkerTimer();

  useEffect(() => {
    if (!isOpen) {
      setIsStarted(false);
      setIsDone(false);
      timer.stopTimer();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartMicroTask = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsStarted(true);
    timer.startTimer(3 * 60, () => {
      soundSynth.playCompletionChime();
      haptic.vibrateWorkDone();
      setIsDone(true);
    });
  };

  const handleCompleteEarly = () => {
    soundSynth.playCompletionChime();
    haptic.vibrateWorkDone();
    timer.stopTimer();
    setIsDone(true);
  };

  const handleFinishAndResume = () => {
    onCompletedInertiaBreak();
    onClose();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in transition-colors duration-200">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-500/40 p-6 space-y-5 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 start-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shrink-0 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              {t('panic_modal_title')}
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              {t('panic_modal_sub')}
            </p>
          </div>
        </div>

        {!isDone ? (
          <>
            {/* Cognitive Safe Space Message */}
            <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-zinc-950 border border-rose-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 space-y-1.5 leading-relaxed">
              <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Smile className="w-3.5 h-3.5" />
                <span>{t('panic_safe_space_title')}</span>
              </span>
              <p className="text-slate-600 dark:text-zinc-400">
                {t('panic_safe_space_desc')}
              </p>
            </div>

            {/* Micro-Tasks Selection */}
            {!isStarted && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                  {t('panic_choose_task')}
                </label>
                {microTasks.map((task, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setSelectedTaskIndex(idx);
                    }}
                    className={`w-full p-2.5 rounded-lg text-xs text-start border transition-all cursor-pointer flex items-center justify-between ${
                      selectedTaskIndex === idx
                        ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 font-semibold'
                        : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span>{task}</span>
                    {selectedTaskIndex === idx && <Zap className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* Timer Active View */}
            {isStarted && (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-center space-y-3">
                <div className="text-xs text-slate-500 dark:text-zinc-400">Task in progress:</div>
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {microTasks[selectedTaskIndex]}
                </div>
                <div className="text-4xl font-mono font-black text-rose-600 dark:text-rose-400">
                  {formatTime(timer.remainingSec)}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Stay with these 3 minutes. Zero external pressure.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              {!isStarted ? (
                <button
                  onClick={handleStartMicroTask}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-500/20 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{t('panic_start_btn')}</span>
                </button>
              ) : (
                <button
                  onClick={handleCompleteEarly}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('panic_early_done')}</span>
                </button>
              )}
            </div>
          </>
        ) : (
          /* Success Screen */
          <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                {t('panic_success_title')}
              </h4>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                {t('panic_success_desc')}
              </p>
            </div>

            <button
              onClick={handleFinishAndResume}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              {t('panic_resume_btn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
