import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Headphones,
  Gauge,
} from 'lucide-react';
import type { VocabularyWord } from '../../data/languages/vocabularyDatabase';
import { speechService } from '../../services/speechService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface HandsFreeImmersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: VocabularyWord[];
  speechCode: string;
  isAr: boolean;
  languageName: string;
}

export const HandsFreeImmersionModal: React.FC<HandsFreeImmersionModalProps> = ({
  isOpen,
  onClose,
  words,
  speechCode,
  isAr,
  languageName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [phase, setPhase] = useState<'speaking_word' | 'recall_pause' | 'speaking_sentence' | 'idle'>('idle');

  const timerRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      speechService.stop();
    };
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    speechService.stop();
    setIsPlaying(false);
    onClose();
  };

  const currentWord = words[currentIndex] || words[0];

  // Continuous Immersion Sequencer Loop
  useEffect(() => {
    if (!isOpen || !isPlaying || !currentWord) return;

    let isCancelled = false;

    const runImmersionSequence = async () => {
      if (isCancelled) return;

      // 1. Speak word
      setPhase('speaking_word');
      haptic.vibrateLight();
      await speechService.speak(currentWord.word, speechCode, speechRate);

      if (isCancelled || !isMountedRef.current) return;

      // 2. Active recall pause (2.5 seconds)
      setPhase('recall_pause');
      timerRef.current = setTimeout(async () => {
        if (isCancelled || !isMountedRef.current) return;

        // 3. Speak context sentence
        setPhase('speaking_sentence');
        if (currentWord.contextSentence) {
          await speechService.speak(currentWord.contextSentence, speechCode, speechRate * 0.95);
        }

        if (isCancelled || !isMountedRef.current) return;

        // 4. Brief transition pause before next word (1.2 seconds)
        timerRef.current = setTimeout(() => {
          if (isCancelled || !isMountedRef.current) return;
          setCurrentIndex((prev) => (prev + 1) % words.length);
        }, 1200);
      }, 2500);
    };

    runImmersionSequence();

    return () => {
      isCancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      speechService.stop();
    };
  }, [isOpen, isPlaying, currentIndex, speechCode, speechRate, words.length]);

  if (!isOpen || words.length === 0) return null;

  const togglePlay = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      speechService.stop();
      setIsPlaying(false);
      setPhase('idle');
    } else {
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    speechService.stop();
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const handlePrev = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    speechService.stop();
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050507]/95 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-10 select-none animate-in fade-in duration-300 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Headphones className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-wide text-zinc-100">
                {isAr ? 'الانغماس الصوتي المتواصل (Hands-Free)' : 'Hands-Free Audio Immersion'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {languageName}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {isAr
                ? 'تعلم ذاتي مستمر أثناء المشي أو الجيم أو التنقل دون لمس الشاشة'
                : 'Continuous loop of words, recall silence & context sentences'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Center Stage */}
      <div className="flex flex-col items-center justify-center my-auto space-y-8 text-center max-w-2xl mx-auto w-full">
        {/* Counter & Level Badge */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800/60">
            {currentIndex + 1} / {words.length}
          </span>
          <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
            {currentWord.level} • {currentWord.partOfSpeech}
          </span>
          {currentWord.isIdiom && (
            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800/60">
              {isAr ? 'تعبير اصطلاحي 🎭' : 'Idiom 🎭'}
            </span>
          )}
        </div>

        {/* Big Word Display with Ambient Glow */}
        <div className="space-y-3">
          <h1 className="text-5xl sm:text-7xl font-black font-serif tracking-tight text-zinc-100 drop-shadow-[0_0_40px_rgba(99,102,241,0.25)]">
            {currentWord.word}
          </h1>
          <p className="font-mono text-sm sm:text-base text-indigo-400">
            {currentWord.phonetic}
          </p>
        </div>

        {/* Dynamic Phase Indicator / Audio Waves */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 h-8">
            {[0.4, 0.8, 1.2, 0.6, 1.0, 0.7, 0.3].map((height, i) => (
              <span
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ${
                  isPlaying && phase !== 'idle'
                    ? 'bg-indigo-400 animate-pulse'
                    : 'bg-zinc-800'
                }`}
                style={{
                  height: isPlaying && phase !== 'idle' ? `${height * 28}px` : '6px',
                  animationDelay: `${i * 120}ms`,
                }}
              />
            ))}
          </div>

          <span className="text-xs uppercase font-mono tracking-widest text-zinc-400">
            {phase === 'speaking_word' && (isAr ? '🔊 نطق الكلمة المستهدفة...' : '🔊 Speaking Word...')}
            {phase === 'recall_pause' && (isAr ? '🧠 صمت الاستدعاء الذهني النشط...' : '🧠 Active Recall Silence...')}
            {phase === 'speaking_sentence' && (isAr ? '📖 نطق الجملة السياقية الكاملة...' : '📖 Context Sentence...')}
            {phase === 'idle' && (isAr ? 'اضغط تشغيل لبدء الانغماس الصوتي' : 'Press Play to Begin Immersion')}
          </span>
        </div>

        {/* Arabic Translation Card */}
        <div className="w-full p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800/90 backdrop-blur-xl space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-400">
            {currentWord.translationAr}
          </h2>
          {currentWord.contextSentence && (
            <div className="pt-2 border-t border-zinc-800/70 text-xs sm:text-sm text-zinc-300 space-y-1">
              <p className="italic text-zinc-300">"{currentWord.contextSentence}"</p>
              <p className="text-emerald-400/90">"{currentWord.contextSentenceAr}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="border-t border-zinc-800 pt-6 space-y-4 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-center gap-6">
          {/* Prev */}
          <button
            type="button"
            onClick={handlePrev}
            className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
            title={isAr ? 'الكلمة السابقة' : 'Previous Word'}
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Big Play / Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className={`py-4 px-8 rounded-3xl font-black text-sm sm:text-base flex items-center gap-3 shadow-xl transition-all active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{isAr ? 'بدء الاستماع المتواصل ⚡' : 'Start Immersion ⚡'}</span>
              </>
            )}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={handleNext}
            className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
            title={isAr ? 'الكلمة التالية' : 'Next Word'}
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5" />
            <span>{isAr ? 'سرعة الإلقاء:' : 'Playback Speed:'}</span>
          </span>
          {[0.75, 0.9, 1.0, 1.2].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setSpeechRate(rate);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer ${
                speechRate === rate
                  ? 'bg-indigo-500 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
