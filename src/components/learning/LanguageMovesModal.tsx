import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Volume2,
  Mic,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  Clock,
  Shuffle,
  RotateCw,
  ChevronRight,
  ChevronLeft,
  Layers,
} from 'lucide-react';
import type { VocabularyWord } from '../../data/languages/vocabularyDatabase';
import { spacedRepetition } from '../../services/spacedRepetitionService';
import { speechService } from '../../services/speechService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

export type MoveType = 'flashcards' | 'shadowing' | 'syntax_scramble' | 'speed_sprint' | 'cloze_dictation' | 'idiom_pearls';

interface LanguageMovesModalProps {
  isOpen: boolean;
  onClose: () => void;
  words?: VocabularyWord[];
  speechCode: string;
  isAr: boolean;
  languageName: string;
  initialMove?: MoveType;
}

export const LanguageMovesModal: React.FC<LanguageMovesModalProps> = ({
  isOpen,
  onClose,
  words = [],
  speechCode,
  isAr,
  languageName,
  initialMove = 'flashcards',
}) => {
  const [activeMove, setActiveMove] = useState<MoveType>(initialMove);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Guaranteed words fallback so the modal NEVER fails or renders blank
  const effectiveWords = useMemo(() => {
    if (words && words.length > 0) return words;
    const today = spacedRepetition.getTodayWords();
    if (today && today.length > 0) return today;
    return spacedRepetition.getAllWordsForLanguage();
  }, [words]);

  // Sync initialMove when opening
  useEffect(() => {
    if (isOpen) {
      setActiveMove(initialMove);
      setIsFlipped(false);
    }
  }, [isOpen, initialMove]);

  // Current active word
  const currentWord = effectiveWords[currentIndex] || effectiveWords[0];

  // --- Move 1: Shadowing State ---
  const [shadowSpeed, setShadowSpeed] = useState(0.85);
  const [shadowingActive, setShadowingActive] = useState(false);
  const [shadowLoopCount, setShadowLoopCount] = useState(0);

  // --- Move 2: Sentence Scramble State ---
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [scrambleStatus, setScrambleStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // --- Move 3: Speed Sprint State ---
  const [sprintTime, setSprintTime] = useState(60);
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintScore, setSprintScore] = useState(0);
  const [sprintStreak, setSprintStreak] = useState(0);
  const [sprintMaxStreak, setSprintMaxStreak] = useState(0);
  const [sprintCard, setSprintCard] = useState<{ word: string; proposed: string; isMatch: boolean } | null>(null);

  // --- Move 4: Cloze Dictation State ---
  const [clozeAnswer, setClozeAnswer] = useState<string | null>(null);
  const [clozeSubmitted, setClozeSubmitted] = useState(false);

  // Handle Flashcards Rating & Leitner Progression
  const handleRateFlashcard = (rating: 'easy' | 'medium' | 'hard') => {
    if (!currentWord) return;
    const isCorrect = rating !== 'hard';
    spacedRepetition.recordResult(currentWord.id, isCorrect, rating);

    if (rating === 'easy') {
      soundSynth.playCompletionChime();
      haptic.vibrateLight();
    } else if (rating === 'medium') {
      soundSynth.playTactileClick();
      haptic.vibrateLight();
    } else {
      soundSynth.playWarningSound();
      haptic.vibrateLight();
    }

    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex + 1 < effectiveWords.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 220);
  };

  const handleNextWord = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsFlipped(false);
    if (currentIndex + 1 < effectiveWords.length) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrevWord = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  // Set up tokens for Sentence Scramble
  useEffect(() => {
    if (activeMove === 'syntax_scramble' && currentWord?.contextSentence) {
      const tokens = currentWord.contextSentence
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '')
        .split(/\s+/)
        .filter(Boolean);
      setSelectedTokens([]);
      setAvailableTokens([...tokens].sort(() => 0.5 - Math.random()));
      setScrambleStatus('idle');
    }
  }, [activeMove, currentIndex, currentWord]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean up speech when modal is closed or unmounted
  useEffect(() => {
    if (!isOpen) {
      speechService.stop();
      setShadowingActive(false);
    }
    return () => {
      speechService.stop();
    };
  }, [isOpen]);

  // Generate Speed Sprint Card
  const generateSprintCard = () => {
    if (!effectiveWords || effectiveWords.length === 0) return;
    const target = effectiveWords[Math.floor(Math.random() * effectiveWords.length)];
    const isMatch = Math.random() > 0.45;
    let proposed = target.translationAr;
    if (!isMatch) {
      const others = effectiveWords.filter((w) => w.id !== target.id);
      if (others.length > 0) {
        proposed = others[Math.floor(Math.random() * others.length)].translationAr;
      }
    }
    setSprintCard({ word: target.word, proposed, isMatch });
  };

  // Speed Sprint 60s Countdown
  useEffect(() => {
    let interval: any;
    if (activeMove === 'speed_sprint' && sprintActive && sprintTime > 0) {
      interval = setInterval(() => {
        setSprintTime((t) => t - 1);
      }, 1000);
    } else if (sprintActive && sprintTime === 0) {
      setSprintActive(false);
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
    }
    return () => clearInterval(interval);
  }, [activeMove, sprintActive, sprintTime]);

  if (!isOpen || !currentWord) return null;

  // --- Move 1: Auditory Shadowing Execution ---
  const handleStartShadowLoop = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setShadowingActive(true);
    setShadowLoopCount(1);

    for (let i = 1; i <= 3; i++) {
      setShadowLoopCount(i);
      // Play native audio
      await speechService.speak(currentWord.contextSentence || currentWord.word, speechCode, shadowSpeed);
      // 2.5s pause for user to shadow aloud
      await new Promise((r) => setTimeout(r, 2500));
    }

    setShadowingActive(false);
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
  };

  // --- Move 2: Syntax Rebuilder Handlers ---
  const handleAddToken = (token: string, idx: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveToken = (token: string, idx: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedTokens((prev) => prev.filter((_, i) => i !== idx));
    setAvailableTokens((prev) => [...prev, token]);
  };

  const handleCheckScramble = () => {
    const rawExpected = (currentWord.contextSentence || '')
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const actual = selectedTokens.join(' ').toLowerCase();

    if (actual === rawExpected) {
      setScrambleStatus('correct');
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
    } else {
      setScrambleStatus('wrong');
      soundSynth.playWarningSound();
      haptic.vibrateLight();
    }
  };

  // --- Move 3: Speed Sprint Handlers ---
  const handleStartSprint = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSprintScore(0);
    setSprintStreak(0);
    setSprintMaxStreak(0);
    setSprintTime(60);
    setSprintActive(true);
    generateSprintCard();
  };

  const handleSprintAnswer = (userClaimedMatch: boolean) => {
    if (!sprintCard || !sprintActive) return;

    const isCorrect = userClaimedMatch === sprintCard.isMatch;
    if (isCorrect) {
      soundSynth.playTactileClick();
      haptic.vibrateLight();
      const newStreak = sprintStreak + 1;
      setSprintStreak(newStreak);
      setSprintMaxStreak((m) => Math.max(m, newStreak));

      // Streak multiplier bonus
      const multiplier = newStreak >= 10 ? 5 : newStreak >= 6 ? 3 : newStreak >= 3 ? 2 : 1;
      setSprintScore((s) => s + 10 * multiplier);
    } else {
      soundSynth.playWarningSound();
      haptic.vibrateLight();
      setSprintStreak(0);
    }

    generateSprintCard();
  };

  // Idioms only deck
  const idiomsDeck = effectiveWords.filter((w) => w.isIdiom || w.partOfSpeech === 'idiom');
  const activeIdiom = idiomsDeck[currentIndex % (idiomsDeck.length || 1)] || currentWord;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/[0.08] p-5 sm:p-7 shadow-2xl space-y-4 animate-scale-in text-slate-900 dark:text-white overflow-y-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 text-white flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                  {isAr ? 'مختبر البطاقات والتدريب اللغوي' : 'Language Deck & Moves Lab'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  {languageName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr ? 'بطاقات فلاش 3D، ترديد صوتي، تركيب جمل، وتكرار متباعد ذكي' : '3D flashcards, shadowing, syntax rebuilder & speed sprint'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Move Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900/80 rounded-2xl border border-slate-200 dark:border-zinc-800">
          {[
            { id: 'flashcards', label: isAr ? '🎴 بطاقات 3D' : '🎴 3D Cards' },
            { id: 'shadowing', label: isAr ? '🎙️ الترديد الظلي' : '🎙️ Shadowing' },
            { id: 'syntax_scramble', label: isAr ? '🧩 باني الجمل' : '🧩 Scramble' },
            { id: 'speed_sprint', label: isAr ? '⚡ سبرنت 60ث' : '⚡ Speed 60s' },
            { id: 'cloze_dictation', label: isAr ? '🎧 فجوات الاستماع' : '🎧 Dictation' },
            { id: 'idiom_pearls', label: isAr ? '🎭 الأمثال' : '🎭 Idioms' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setActiveMove(m.id as MoveType);
              }}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer truncate ${
                activeMove === m.id
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* ================= MOVE 0: 3D FLIP FLASHCARD DECK ================= */}
        {activeMove === 'flashcards' && (
          <div className="space-y-3">
            {/* Card Navigation & Counter */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/40">
                  {currentIndex + 1} / {effectiveWords.length}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 bg-slate-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {currentWord.level} • {currentWord.partOfSpeech}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={handlePrevWord}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 disabled:opacity-30 cursor-pointer transition-colors"
                  title={isAr ? 'السابق' : 'Previous'}
                >
                  {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  disabled={currentIndex + 1 >= effectiveWords.length}
                  onClick={handleNextWord}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 disabled:opacity-30 cursor-pointer transition-colors"
                  title={isAr ? 'التالي' : 'Next'}
                >
                  {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 3D Perspective Container */}
            <div style={{ perspective: '1200px' }} className="w-full">
              <div
                style={{
                  transformStyle: 'preserve-3d',
                  WebkitTransformStyle: 'preserve-3d',
                  willChange: 'transform',
                  transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
                className="relative min-h-[300px] w-full rounded-2xl"
              >
                {/* FRONT FACE OF FLASHCARD */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                  className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500/[0.05] via-white dark:via-zinc-900 to-indigo-500/[0.02] dark:to-zinc-950 border-2 border-indigo-200/80 dark:border-indigo-900/40 p-6 flex flex-col justify-between shadow-sm cursor-pointer select-none"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsFlipped(true);
                  }}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {languageName}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{isAr ? 'انقر للقلب والكشف' : 'Tap to Flip'}</span>
                    </span>
                  </div>

                  {/* Big Center Word */}
                  <div className="space-y-2 text-center py-4">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white font-serif tracking-tight">
                      {currentWord.word}
                    </h2>
                    <p className="font-mono text-sm text-slate-500 dark:text-zinc-400">
                      {currentWord.phonetic}
                    </p>

                    <div className="pt-3 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          speechService.speak(currentWord.word, speechCode, 1.0);
                        }}
                        className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>{isAr ? 'نطق أصلي' : 'Native Audio'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          speechService.speak(currentWord.word, speechCode, 0.75);
                        }}
                        className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold border border-slate-200 dark:border-zinc-700 cursor-pointer active:scale-95"
                      >
                        0.75x
                      </button>
                    </div>
                  </div>

                  <div className="text-center pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                    <span className="text-xs text-slate-400 font-medium">
                      {isAr ? '💡 حاول تذكر المعنى العربي ثم اقلب البطاقة للتحقق والتقييم' : '💡 Recall the meaning, then flip to check & rate'}
                    </span>
                  </div>
                </div>

                {/* BACK FACE OF FLASHCARD */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                  className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-emerald-500/[0.08] via-white dark:via-zinc-900 to-emerald-500/[0.02] dark:to-zinc-950 border-2 border-emerald-300/80 dark:border-emerald-800/60 p-5 sm:p-6 flex flex-col justify-between shadow-sm select-none"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isAr ? 'المعنى والسياق العملي' : 'Meaning & Context'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setIsFlipped(false);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{isAr ? 'العودة للوجه' : 'Back to Front'}</span>
                    </button>
                  </div>

                  {/* Meaning & Context */}
                  <div className="space-y-2 py-2">
                    <div className="text-center">
                      <h3 className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 font-sans">
                        {currentWord.translationAr}
                      </h3>
                    </div>

                    {/* Context sentence */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/80 dark:border-zinc-800 text-xs space-y-1">
                      <p dir="ltr" className="font-serif font-semibold text-slate-900 dark:text-zinc-100 text-start leading-relaxed">
                        “{currentWord.contextSentence}”
                      </p>
                      <p className="text-emerald-700 dark:text-emerald-400 font-sans text-start leading-relaxed font-medium">
                        «{currentWord.contextSentenceAr}»
                      </p>
                    </div>
                  </div>

                  {/* SRS Leitner 3-Level Quick Rating Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] text-center font-bold text-slate-500 dark:text-zinc-400">
                      {isAr ? 'قيّم قوة حفظك لنظام التكرار المتباعد (Leitner SRS):' : 'Rate retention for Leitner SRS:'}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRateFlashcard('hard')}
                        className="py-2.5 px-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-900/60 transition-transform active:scale-95 cursor-pointer text-center"
                      >
                        <div className="text-sm">🔴</div>
                        <div>{isAr ? 'صعب (إعادة)' : 'Hard'}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRateFlashcard('medium')}
                        className="py-2.5 px-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-900/60 transition-transform active:scale-95 cursor-pointer text-center"
                      >
                        <div className="text-sm">🟡</div>
                        <div>{isAr ? 'متوسط (جيد)' : 'Good'}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRateFlashcard('easy')}
                        className="py-2.5 px-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-900/60 transition-transform active:scale-95 cursor-pointer text-center"
                      >
                        <div className="text-sm">🟢</div>
                        <div>{isAr ? 'سهل (أتقنتها)' : 'Easy'}</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MOVE 1: AUDITORY SHADOWING LAB ================= */}
        {activeMove === 'shadowing' && (
          <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-500/[0.04] to-purple-500/[0.02] border border-indigo-200/80 dark:border-indigo-900/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Mic className="w-4 h-4" />
                <span>{isAr ? 'محاكي النطق والترديد الصوتي المتزامن' : 'Auditory Shadowing Loop'}</span>
              </span>
              <div className="flex items-center gap-1">
                {[0.75, 0.85, 1.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShadowSpeed(s)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                      shadowSpeed === s
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center py-4 space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black font-serif text-slate-950 dark:text-white">
                {currentWord.word}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-lg mx-auto leading-relaxed italic bg-white/70 dark:bg-zinc-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
                "{currentWord.contextSentence}"
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                "{currentWord.contextSentenceAr}"
              </p>
            </div>

            {/* Audio Waveform Mimic Animation */}
            {shadowingActive && (
              <div className="flex flex-col items-center gap-2 py-1">
                <div className="flex items-center gap-1 h-8">
                  {[0.5, 1.2, 0.8, 1.4, 0.6, 1.0, 0.7, 1.3].map((h, i) => (
                    <span
                      key={i}
                      className="w-1.5 bg-indigo-500 rounded-full animate-pulse"
                      style={{ height: `${h * 20}px`, animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {isAr ? `دورة الترديد [${shadowLoopCount} / 3] • ردّد بصوت عالٍ الآن!` : `Shadow Loop [${shadowLoopCount}/3] • Speak Aloud Now!`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={shadowingActive}
                onClick={handleStartShadowLoop}
                className="py-3 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isAr ? 'بدء جلسة الترديد المتزامن (3 دورات)' : 'Start Shadowing (3 Loops)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => (idx + 1) % words.length)}
                className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                {isAr ? 'الكلمة التالية ➔' : 'Next Word ➔'}
              </button>
            </div>
          </div>
        )}

        {/* ================= MOVE 2: SYNTAX REBUILDER (SCRAMBLE) ================= */}
        {activeMove === 'syntax_scramble' && (
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Shuffle className="w-4 h-4" />
                <span>{isAr ? 'باني التراكيب النحوية: رتّب الجملة بالترتيب الصحيح' : 'Syntax Rebuilder'}</span>
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {currentWord.translationAr}
              </span>
            </div>

            {/* Arabic Target Guide */}
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {isAr ? 'المعنى العربي المطلوب تركيبه:' : 'Target Arabic Meaning:'}
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                "{currentWord.contextSentenceAr}"
              </p>
            </div>

            {/* Assembled Sentence Drop Area */}
            <div className="min-h-[64px] p-3 rounded-2xl bg-indigo-50/50 dark:bg-zinc-950 border-2 border-dashed border-indigo-300 dark:border-indigo-900/60 flex flex-wrap items-center gap-2">
              {selectedTokens.length === 0 ? (
                <span className="text-xs text-slate-400 mx-auto italic">
                  {isAr ? 'انقر على الكلمات بالأسفل لترتيب الجملة بالترتيب النحوي الصحيح' : 'Tap words below in correct grammatical order'}
                </span>
              ) : (
                selectedTokens.map((tok, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRemoveToken(tok, idx)}
                    className="py-1.5 px-3 rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold shadow-xs hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    {tok} ✕
                  </button>
                ))
              )}
            </div>

            {/* Available Shuffled Tokens */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {availableTokens.map((tok, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddToken(tok, idx)}
                  className="py-2 px-3.5 rounded-xl bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-mono text-xs font-bold hover:border-indigo-500 transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  {tok}
                </button>
              ))}
            </div>

            {/* Feedback & Actions */}
            {scrambleStatus === 'correct' && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'إتقان تام! التركيب النحوي للجملة صحيح 100%' : 'Splendid! Sentence syntax is 100% correct!'}</span>
              </div>
            )}
            {scrambleStatus === 'wrong' && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-500 text-rose-800 dark:text-rose-200 text-xs font-bold text-center flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>{isAr ? 'الترتيب النحوي غير دقيق، أعد المحاولة!' : 'Order is incorrect, try again!'}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  const tokens = (currentWord.contextSentence || '')
                    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '')
                    .split(/\s+/)
                    .filter(Boolean);
                  setSelectedTokens([]);
                  setAvailableTokens([...tokens].sort(() => 0.5 - Math.random()));
                  setScrambleStatus('idle');
                }}
                className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إعادة الخلط 🔁' : 'Reset 🔁'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCheckScramble}
                  className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  {isAr ? 'تحقق من الترتيب' : 'Verify Syntax'}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((idx) => (idx + 1) % words.length)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
                >
                  {isAr ? 'الجملة التالية ➔' : 'Next ➔'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MOVE 3: SPEED SPRINT 60s ================= */}
        {activeMove === 'speed_sprint' && (
          <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-br from-amber-500/[0.05] to-orange-500/[0.05] border border-amber-300/80 dark:border-amber-700/60">
            {/* Header with Countdown & Streak Multiplier */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-black text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>{sprintTime}s</span>
                </span>
                {sprintStreak >= 3 && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-black font-black text-xs flex items-center gap-1 shadow-sm animate-bounce">
                    <Flame className="w-3.5 h-3.5 fill-black" />
                    <span>{sprintStreak >= 10 ? '5x Multiplier!' : sprintStreak >= 6 ? '3x Multiplier!' : '2x Multiplier!'}</span>
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
                  {isAr ? 'النقاط:' : 'Score:'} {sprintScore}
                </span>
              </div>
            </div>

            {!sprintActive && sprintTime === 60 ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl">
                  ⚡
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-950 dark:text-white">
                    {isAr ? 'تحدي سبرنت الاستدعاء الخاطف (60 ثانية)' : '60-Second Speed Recall Sprint'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-sm mx-auto">
                    {isAr
                      ? 'اختبر سرعة استجابة جهازك العصبي! هل الترجمة المعروضة متطابقة مع الكلمة؟ اجمع المتتاليات لمضاعفة نقاطك!'
                      : 'Test fast neural retrieval. Answer Match/No-Match rapidly to unlock multiplier combos!'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartSprint}
                  className="py-3.5 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  {isAr ? 'ابدأ السبرنت الآن ⚡' : 'Start Sprint Now ⚡'}
                </button>
              </div>
            ) : sprintActive && sprintCard ? (
              <div className="text-center py-6 space-y-5">
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                    {languageName}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black font-serif text-slate-950 dark:text-white">
                    {sprintCard.word}
                  </h2>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 max-w-sm mx-auto">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    {isAr ? 'المعنى المقترح:' : 'Proposed Meaning:'}
                  </span>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {sprintCard.proposed}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-2">
                  <button
                    type="button"
                    onClick={() => handleSprintAnswer(false)}
                    className="py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-black text-sm border border-rose-300 dark:border-rose-800 transition-transform active:scale-95 cursor-pointer"
                  >
                    ✕ {isAr ? 'غير متطابق' : 'Mismatch'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSprintAnswer(true)}
                    className="py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-black text-sm border border-emerald-300 dark:border-emerald-800 transition-transform active:scale-95 cursor-pointer"
                  >
                    ✓ {isAr ? 'متطابق' : 'Match'}
                  </button>
                </div>
              </div>
            ) : (
              /* Sprint Completed Screen */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl animate-bounce">
                  🏆
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-slate-950 dark:text-white">
                    {isAr ? 'انتهت سويعة السبرنت!' : 'Sprint Completed!'}
                  </h4>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {isAr ? `حققت ${sprintScore} نقطة • أعلى متتالية سرعة: ${sprintMaxStreak}` : `Score: ${sprintScore} pts • Max Streak: ${sprintMaxStreak}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartSprint}
                  className="py-3 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs cursor-pointer"
                >
                  {isAr ? 'جولة سبرنت جديدة ⚡' : 'New Sprint ⚡'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= MOVE 4: CLOZE DICTATION ================= */}
        {activeMove === 'cloze_dictation' && (
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>{isAr ? 'الإملاء السمعي: استمع للجملة واختر الكلمة المحذوفة' : 'Cloze Audio Dictation'}</span>
              </span>
              <button
                type="button"
                onClick={() => speechService.speak(currentWord.contextSentence || currentWord.word, speechCode, 0.9)}
                className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer shadow-xs"
                title={isAr ? 'إعادة الاستماع' : 'Replay'}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Gap Sentence */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-2">
              <p className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-white leading-relaxed">
                {(currentWord.contextSentence || '').replace(new RegExp(`\\b${currentWord.word}\\b`, 'gi'), '__________')}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
                "{currentWord.contextSentenceAr}"
              </p>
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {[
                currentWord.word,
                ...(words.filter((w) => w.id !== currentWord.id).map((w) => w.word).slice(0, 2)),
              ]
                .sort(() => 0.5 - Math.random())
                .map((opt, idx) => {
                  const isSelected = clozeAnswer === opt;
                  const isCorrect = opt.toLowerCase() === currentWord.word.toLowerCase();
                  let style = 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200';
                  if (clozeSubmitted) {
                    if (isCorrect) style = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                    else if (isSelected) style = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 font-bold';
                  } else if (isSelected) {
                    style = 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-900 dark:text-indigo-200 font-bold';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (clozeSubmitted) return;
                        soundSynth.playTactileClick();
                        setClozeAnswer(opt);
                      }}
                      className={`p-3 rounded-xl border text-sm font-mono transition-all cursor-pointer ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
            </div>

            <div className="flex items-center justify-between pt-2">
              {!clozeSubmitted ? (
                <button
                  type="button"
                  disabled={!clozeAnswer}
                  onClick={() => {
                    setClozeSubmitted(true);
                    if (clozeAnswer?.toLowerCase() === currentWord.word.toLowerCase()) {
                      soundSynth.playCompletionChime();
                      haptic.vibrateLight();
                    } else {
                      soundSynth.playWarningSound();
                      haptic.vibrateLight();
                    }
                  }}
                  className="py-2.5 px-6 rounded-xl bg-indigo-600 text-white font-bold text-xs disabled:opacity-40 cursor-pointer"
                >
                  {isAr ? 'تحقق' : 'Submit'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setClozeAnswer(null);
                    setClozeSubmitted(false);
                    setCurrentIndex((idx) => (idx + 1) % words.length);
                  }}
                  className="py-2.5 px-6 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                >
                  {isAr ? 'التالي ➔' : 'Next ➔'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================= MOVE 5: COLLOQUIAL IDIOMS & PEARLS ================= */}
        {activeMove === 'idiom_pearls' && (
          <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-br from-purple-500/[0.05] to-pink-500/[0.05] border border-purple-200/80 dark:border-purple-900/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? 'خزانة التعابير الاصطلاحية والأمثال الشعبية' : 'Colloquial Idioms & Cultural Pearls'}</span>
              </span>
              <button
                type="button"
                onClick={() => speechService.speak(activeIdiom.word, speechCode, 0.9)}
                className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 cursor-pointer shadow-xs"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-slate-950 dark:text-white">
                "{activeIdiom.word}"
              </h2>
              <p className="font-mono text-xs text-purple-500">
                {activeIdiom.phonetic}
              </p>
            </div>

            {/* Comparison Cards: Contextual Meaning vs Literal Meaning */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                  {isAr ? '💡 المعنى البلاغي الحقيقي في بيئة العمل والشارع:' : 'Actual Contextual Meaning:'}
                </span>
                <p className="text-base font-black text-emerald-950 dark:text-emerald-200">
                  {activeIdiom.translationAr}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                  {isAr ? '🎭 المعنى الحرفي للكلمات (لا يُستخدم حرفياً):' : 'Literal Translation:'}
                </span>
                <p className="text-base font-bold text-amber-900 dark:text-amber-200">
                  {activeIdiom.literalTranslationAr || (isAr ? 'ترجمة لفظية مباشرة للمفردات' : 'Direct literal words')}
                </p>
              </div>
            </div>

            {/* Context Sentence */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs space-y-1">
              <p className="font-medium text-slate-900 dark:text-zinc-100 italic">
                "{activeIdiom.contextSentence}"
              </p>
              <p className="text-purple-600 dark:text-purple-400">
                "{activeIdiom.contextSentenceAr}"
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => idx + 1)}
                className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                {isAr ? 'المثل التالي ➔' : 'Next Idiom ➔'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
