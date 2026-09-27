import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Headphones,
  FileEdit,
  Repeat,
  Flame,
  Copy,
  Check,
} from 'lucide-react';
import {
  VOCABULARY_DATABASE,
  type VocabularyWord,
  type CefrLevel,
  CEFR_LEVELS_INFO,
} from '../../data/languages/vocabularyDatabase';
import { spacedRepetition } from '../../services/spacedRepetitionService';
import { speechService } from '../../services/speechService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { RootDeconstructorCard } from './RootDeconstructorCard';
import { triggerCelebrationConfetti } from '../../utils/gamification';

export type QuizMode = 'multiple_choice' | 'reverse_recall' | 'cloze_sentence' | 'listening';

interface LanguageQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  words?: VocabularyWord[];
  speechCode: string;
  onCompleted?: (score: number, total: number) => void;
  initialLevel?: CefrLevel | 'ALL';
}

export const LanguageQuizModal: React.FC<LanguageQuizModalProps> = ({
  isOpen,
  onClose,
  words = [],
  speechCode,
  onCompleted,
  initialLevel = 'ALL',
}) => {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | 'ALL'>(initialLevel);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [activeQuizMode, setActiveQuizMode] = useState<QuizMode>('multiple_choice');
  const [quizStreak, setQuizStreak] = useState(0);
  const [maxQuizStreak, setMaxQuizStreak] = useState(0);
  const [copiedCert, setCopiedCert] = useState(false);

  // Guaranteed words fallback so the modal NEVER blocks or fails
  const rawWords = useMemo(() => {
    if (words && words.length > 0) return words;
    const today = spacedRepetition.getTodayWords();
    if (today && today.length > 0) return today;
    return spacedRepetition.getAllWordsForLanguage();
  }, [words]);

  // Words filtered by selectedLevel
  const effectiveWords = useMemo(() => {
    if (selectedLevel === 'ALL') return rawWords;
    const filtered = rawWords.filter((w) => w.level === selectedLevel);
    return filtered.length > 0 ? filtered : rawWords;
  }, [rawWords, selectedLevel]);

  // Level counts
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rawWords.length };
    CEFR_LEVELS_INFO.forEach((c) => {
      counts[c.level] = rawWords.filter((w) => w.level === c.level).length;
    });
    return counts;
  }, [rawWords]);

  // Reset state when opening with words
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setScore(0);
      setQuizStreak(0);
      setMaxQuizStreak(0);
      setIsFinished(false);
      setShowHint(false);
      setCopiedCert(false);
    }
  }, [isOpen, words]);

  const currentWord = effectiveWords[currentIndex] || effectiveWords[0];
  const currentWordProgress = currentWord ? spacedRepetition.getWordProgress(currentWord.id) : undefined;
  const isLeech = currentWord ? spacedRepetition.isLeechWord(currentWord.id) : false;

  // Dynamic Options Generator based on Quiz Mode
  const { options, correctAnswer } = useMemo(() => {
    if (!currentWord) return { options: [], correctAnswer: '' };
    const lang = currentWord.lang;
    const langWords = VOCABULARY_DATABASE.filter((w) => w.lang === lang);

    if (activeQuizMode === 'reverse_recall' || activeQuizMode === 'cloze_sentence') {
      // Question is Arabic meaning / sentence; options are target words
      const correct = currentWord.word;
      const otherWords = langWords
        .map((w) => w.word)
        .filter((w) => w.toLowerCase() !== correct.toLowerCase());

      const shuffled = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3);
      const combined = [correct, ...shuffled].sort(() => 0.5 - Math.random());
      return { options: combined, correctAnswer: correct };
    } else {
      // Standard Multiple Choice or Listening: Question is Foreign word/audio; options are Arabic translations
      const correct = currentWord.translationAr;
      const otherTranslations = langWords
        .map((w) => w.translationAr)
        .filter((t) => t !== correct);

      const fallbackDistractors = [
        'المواظبة المستمرة',
        'الانضباط الذاتي',
        'المرونة النفسية',
        'القدرة على التحمل',
        'التركيز العميق',
      ];

      const pool = otherTranslations.length >= 3 ? otherTranslations : [...otherTranslations, ...fallbackDistractors];
      const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
      const combined = [correct, ...shuffled].sort(() => 0.5 - Math.random());
      return { options: combined, correctAnswer: correct };
    }
  }, [currentWord, activeQuizMode]);

  // Automatically speak word in listening mode
  useEffect(() => {
    if (isOpen && activeQuizMode === 'listening' && currentWord) {
      const timer = setTimeout(() => {
        speechService.speak(currentWord.word, speechCode, 0.9);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeQuizMode, currentIndex, speechCode, currentWord]);

  const handleSpeakWord = () => {
    soundSynth.playTactileClick();
    speechService.speak(currentWord.word, speechCode, 0.9);
  };

  const handleSelectOption = (option: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAnswerSubmitted) return;

    const isCorrect = selectedOption.trim() === correctAnswer.trim();
    setIsAnswerSubmitted(true);

    if (isCorrect) {
      const nextStreak = quizStreak + 1;
      setQuizStreak(nextStreak);
      setMaxQuizStreak((prev) => Math.max(prev, nextStreak));
      soundSynth.playCompletionChime();
      haptic.vibrateLight();
      setScore((s) => s + 1);
      spacedRepetition.recordResult(currentWord.id, true, 'medium');

      if (nextStreak === 3 || nextStreak === 5 || nextStreak === 10) {
        haptic.vibrateSprintCelebration();
        triggerCelebrationConfetti();
      }
    } else {
      setQuizStreak(0);
      soundSynth.playWarningSound();
      haptic.vibrateWorkDone();
      spacedRepetition.recordResult(currentWord.id, false);
    }
  };

  const handleNextQuestion = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setShowHint(false);

    if (currentIndex + 1 < effectiveWords.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
      const finalScore = score + (selectedOption === correctAnswer ? 1 : 0);
      if (finalScore / effectiveWords.length >= 0.75) {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        triggerCelebrationConfetti();
      }
      if (onCompleted) {
        onCompleted(finalScore, effectiveWords.length);
      }
    }
  };

  // Keyboard Shortcuts: 1-4 for options, Enter for Submit / Next, Esc to Close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (isFinished) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onClose();
        }
        return;
      }

      // Keyboard choices 1, 2, 3, 4
      if (!isAnswerSubmitted) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= options.length) {
          e.preventDefault();
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          setSelectedOption(options[num - 1]);
          return;
        }

        if (e.key === 'Enter' && selectedOption) {
          e.preventDefault();
          handleSubmitAnswer();
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFinished, isAnswerSubmitted, selectedOption, options, onClose, handleSubmitAnswer, handleNextQuestion]);

  const progressPercentage = Math.round(((currentIndex + 1) / effectiveWords.length) * 100);
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  if (!isOpen || !currentWord || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] rounded-3xl bg-white dark:bg-[#13141F] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-5 sm:p-7 space-y-4 animate-scale-in text-slate-900 dark:text-white overflow-y-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Top Bar: Mode Switcher & Close */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setActiveQuizMode('multiple_choice');
                setSelectedOption(null);
                setIsAnswerSubmitted(false);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeQuizMode === 'multiple_choice'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              <Repeat className="w-3 h-3" />
              <span>{isAr ? 'ترجمة' : 'Meaning'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setActiveQuizMode('reverse_recall');
                setSelectedOption(null);
                setIsAnswerSubmitted(false);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeQuizMode === 'reverse_recall'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{isAr ? 'استدعاء عكسي' : 'Reverse'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setActiveQuizMode('cloze_sentence');
                setSelectedOption(null);
                setIsAnswerSubmitted(false);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeQuizMode === 'cloze_sentence'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              <FileEdit className="w-3 h-3" />
              <span>{isAr ? 'فراغ السياق' : 'Cloze'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setActiveQuizMode('listening');
                setSelectedOption(null);
                setIsAnswerSubmitted(false);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeQuizMode === 'listening'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              <Headphones className="w-3 h-3" />
              <span>{isAr ? 'استماع' : 'Audio'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CEFR Level Selector Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setSelectedLevel('ALL');
              setCurrentIndex(0);
              setSelectedOption(null);
              setIsAnswerSubmitted(false);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              selectedLevel === 'ALL'
                ? 'bg-slate-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300'
            }`}
          >
            <span>{isAr ? 'الكل' : 'All'}</span>
            <span className="text-[10px] opacity-75 ms-1 font-mono">({levelCounts.ALL || 0})</span>
          </button>
          {CEFR_LEVELS_INFO.map((lvl) => {
            const count = levelCounts[lvl.level] || 0;
            const isSelected = selectedLevel === lvl.level;
            return (
              <button
                key={lvl.level}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setSelectedLevel(lvl.level);
                  setCurrentIndex(0);
                  setSelectedOption(null);
                  setIsAnswerSubmitted(false);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-indigo-400'
                }`}
              >
                <span className="font-mono font-bold">{lvl.level}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Quiz Progress Bar & Dynamic Streak Multiplier */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span>{isAr ? 'السؤال' : 'Question'} {currentIndex + 1} / {effectiveWords.length}</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[10px]">
                {currentWord.level}
              </span>
            </span>

            <div className="flex items-center gap-2">
              {quizStreak >= 2 && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1 border border-amber-500/30 animate-pulse">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{quizStreak} {isAr ? 'متتالية!' : 'Streak!'}</span>
                </span>
              )}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {score} {isAr ? 'إجابات صحيحة' : 'Correct'}
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {!isFinished ? (
          <div className="space-y-4">
            {/* Question Card Display */}
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-center space-y-2">
              {activeQuizMode === 'listening' ? (
                <div className="py-3 space-y-2.5">
                  <div className="w-14 h-14 mx-auto rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md animate-pulse">
                    <Headphones className="w-7 h-7" />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleSpeakWord}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800/40 shadow-2xs hover:bg-slate-50 cursor-pointer active:scale-95"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isAr ? 'استمع (1.0x)' : 'Play (1.0x)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        speechService.speak(currentWord.word, speechCode, 0.75);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 font-mono font-bold text-xs border border-indigo-200 dark:border-indigo-800/40 shadow-2xs hover:bg-slate-50 cursor-pointer active:scale-95"
                      title={isAr ? 'نطق هادئ وبطيء' : 'Slow audio'}
                    >
                      <span>0.75x 🐢</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {isAr ? 'استمع جيداً ثم اختر المعنى العربي المطابق' : 'Listen carefully and select the Arabic meaning'}
                  </p>
                </div>
              ) : activeQuizMode === 'reverse_recall' ? (
                <div className="py-2 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                    {isAr ? 'ما هي الكلمة الأجنبية المطابقة لهذا المعنى؟' : 'What is the foreign word for this?'}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {currentWord.translationAr}
                  </h2>
                </div>
              ) : activeQuizMode === 'cloze_sentence' ? (
                <div className="py-2 space-y-1.5 text-start sm:text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">
                    {isAr ? 'أكمل الفراغ بالكلمة الصحيحة:' : 'Fill in the blank with the correct word:'}
                  </span>
                  <p dir="ltr" className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white font-serif">
                    {currentWord.contextSentence
                      ? currentWord.contextSentence.replace(
                          new RegExp(currentWord.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
                          '_______'
                        )
                      : '_______'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    «{currentWord.contextSentenceAr}»
                  </p>
                </div>
              ) : (
                <div className="py-2 space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {currentWord.word}
                    </h2>
                    <button
                      type="button"
                      onClick={handleSpeakWord}
                      className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                    {currentWord.phonetic} • {currentWord.level}
                  </span>
                </div>
              )}

              {/* Hint Toggle */}
              {showHint && (
                <p dir="ltr" className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800/40 animate-fade-in font-serif">
                  💡 “{currentWord.contextSentence}”
                </p>
              )}
            </div>

            {/* Hint Button */}
            {!isAnswerSubmitted && !showHint && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'أظهر تلميحاً' : 'Show Hint'}</span>
                </button>
              </div>
            )}

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt.trim() === correctAnswer.trim();

                let style = 'bg-slate-50 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:border-indigo-400';

                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    style = 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                  } else if (isSelected && !isCorrect) {
                    style = 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 font-bold';
                  }
                } else if (isSelected) {
                  style = 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold ring-2 ring-indigo-500/30';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-3.5 rounded-2xl border text-sm text-start font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${style}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-xl bg-slate-200/70 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate font-sans font-semibold">{opt}</span>
                    </div>
                    {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Learning Reinforcement Hub (Context Sentence, Collocations & Mnemonic Hook) */}
            {isAnswerSubmitted && (
              <div className="space-y-2 pt-1 animate-fade-in text-start">
                {/* Context Sentence */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 text-xs space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p dir="ltr" className="font-serif font-semibold text-slate-900 dark:text-zinc-100 leading-relaxed flex-1">
                      “{currentWord.contextSentence}”
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        speechService.speak(currentWord.contextSentence, speechCode, 0.9);
                      }}
                      className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shrink-0 cursor-pointer"
                      title={isAr ? 'استمع للجملة كاملة' : 'Listen full sentence'}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400 font-sans font-medium">
                    «{currentWord.contextSentenceAr}»
                  </p>
                </div>

                {/* Collocations */}
                {currentWord.collocations && currentWord.collocations.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {isAr ? '🔗 متلازمات شائعة:' : '🔗 Collocations:'}
                    </span>
                    {currentWord.collocations.map((col, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          speechService.speak(col, speechCode, 0.95);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title={isAr ? 'انقر للاستماع للنطق' : 'Click to hear pronunciation'}
                      >
                        <span>{col}</span>
                        <Volume2 className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Mnemonic Hook */}
                {currentWord.mnemonicHook && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 flex items-start gap-2 text-xs">
                    <span className="text-base shrink-0">🧠</span>
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-300 block text-[11px]">
                        {isAr ? 'خطاف الذاكرة الصوري (Mnemonic Hook):' : 'Visual Memory Hook:'}
                      </span>
                      <p className="text-amber-950/80 dark:text-amber-200/90 text-[11px] leading-relaxed font-sans">
                        {currentWord.mnemonicHook}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cognitive Knot Breaker & Etymology Deconstructor */}
            {isAnswerSubmitted && (selectedOption?.trim() !== correctAnswer.trim() || isLeech) && (
              <div className="pt-2 animate-fade-in">
                <RootDeconstructorCard
                  word={currentWord}
                  isAr={isAr}
                  isLeech={isLeech}
                  timesIncorrect={currentWordProgress?.timesIncorrect || 1}
                  easeFactor={currentWordProgress?.easeFactor ?? 2.5}
                  defaultExpanded={true}
                />
              </div>
            )}

            {/* Action Bar & Keyboard Hint */}
            <div className="pt-2 space-y-2">
              {!isAnswerSubmitted ? (
                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={handleSubmitAnswer}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {isAr ? 'تأكيد الإجابة (Enter ↵)' : 'Check Answer (Enter ↵)'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <span>{isAr ? 'السؤال التالي (Enter ↵)' : 'Next Question (Enter ↵)'}</span>
                  <ArrowIcon className="w-4 h-4" />
                </button>
              )}
              <div className="text-center">
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                  {isAr ? '⌨️ [اضغط 1-4 للاختيار السريع • Enter للتأكيد والتقدم]' : '⌨️ [Press 1-4 to select • Enter to submit & next]'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Finished Screen with Royal CEFR Certificate Seal */
          <div className="py-4 text-center space-y-4 animate-scale-in">
            {/* Royal CEFR Certificate Seal for High Performers */}
            {score / effectiveWords.length >= 0.75 ? (
              <div className="p-5 rounded-3xl bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent border-2 border-amber-500/40 relative overflow-hidden shadow-lg space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                  <span className="bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    ★ CEFR MASTERY SEAL
                  </span>
                  {maxQuizStreak >= 3 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{isAr ? `أعلى متتالية: ${maxQuizStreak}` : `Max Streak: ${maxQuizStreak}`}</span>
                    </span>
                  )}
                </div>

                <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center text-3xl shadow-md ring-4 ring-amber-500/20 animate-bounce">
                  🏅
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block font-mono">
                    {isAr ? 'ختم اعتماد الكفاءة اللغوية' : 'Official CEFR Competency Seal'}
                  </span>
                  <h4 className="text-xl font-black text-slate-950 dark:text-white font-serif">
                    {selectedLevel === 'ALL'
                      ? (isAr ? 'إتقان بنك المفردات الشامل' : 'Comprehensive Vocabulary Mastery')
                      : `${selectedLevel} • ${CEFR_LEVELS_INFO.find((l) => l.level === selectedLevel)?.titleAr || selectedLevel}`}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 max-w-sm mx-auto leading-relaxed">
                    {isAr
                      ? `أحرزت دقة إتقان استثنائية بلغت ${Math.round((score / effectiveWords.length) * 100)}% (+${score * 10} XP)، مؤكداً استيعابك العميق للمفردات!`
                      : `Achieved an outstanding ${Math.round((score / effectiveWords.length) * 100)}% accuracy (+${score * 10} XP), validating deep vocabulary retention!`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    const certText = `🏅 شهادة اعتماد الكفاءة اللغوية (CEFR)\nالمستوى: ${selectedLevel}\nالنتيجة: ${score}/${effectiveWords.length} (${Math.round((score / effectiveWords.length) * 100)}%)\nأعلى متتالية إتقان: ${maxQuizStreak}\nتاريخ الاعتماد: ${new Date().toLocaleDateString('ar-EG')}`;
                    navigator.clipboard.writeText(certText);
                    setCopiedCert(true);
                    setTimeout(() => setCopiedCert(false), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-sm cursor-pointer transition-transform active:scale-95"
                >
                  {copiedCert ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تم نسخ الشهادة للحافظة!' : 'Certificate Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isAr ? 'نسخ بطاقة الاعتماد والشهادة 📋' : 'Copy Certificate 📋'}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs text-3xl">
                  🏆
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {isAr ? 'اكتمل الاختبار بنجاح!' : 'Quiz Completed!'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">
                    {isAr
                      ? `أحرزت ${score} من إجمالي ${effectiveWords.length} كلمات (+${score * 10} XP)`
                      : `You scored ${score} out of ${effectiveWords.length} words (+${score * 10} XP)`}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setCurrentIndex(0);
                  setSelectedOption(null);
                  setIsAnswerSubmitted(false);
                  setScore(0);
                  setQuizStreak(0);
                  setMaxQuizStreak(0);
                  setIsFinished(false);
                  setShowHint(false);
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
              >
                {isAr ? 'إعادة الاختبار 🔄' : 'Retake Quiz 🔄'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                {isAr ? 'تم، متابعة اليوم ✔' : 'Done & Continue ✔'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
