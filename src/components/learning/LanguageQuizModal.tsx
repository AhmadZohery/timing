import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import {
  VOCABULARY_DATABASE,
  type VocabularyWord,
} from '../../data/languages/vocabularyDatabase';
import { spacedRepetition } from '../../services/spacedRepetitionService';
import { speechService } from '../../services/speechService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { RootDeconstructorCard } from './RootDeconstructorCard';

export type QuizMode = 'multiple_choice' | 'reverse_recall' | 'cloze_sentence' | 'listening';

interface LanguageQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: VocabularyWord[];
  speechCode: string;
  onCompleted?: (score: number, total: number) => void;
}

export const LanguageQuizModal: React.FC<LanguageQuizModalProps> = ({
  isOpen,
  onClose,
  words,
  speechCode,
  onCompleted,
}) => {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [activeQuizMode, setActiveQuizMode] = useState<QuizMode>('multiple_choice');

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset state when opening with words
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setScore(0);
      setIsFinished(false);
      setShowHint(false);
    }
  }, [isOpen, words]);

  // Automatically speak word in listening mode
  useEffect(() => {
    if (isOpen && activeQuizMode === 'listening' && words[currentIndex]) {
      const timer = setTimeout(() => {
        speechService.speak(words[currentIndex].word, speechCode, 0.9);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeQuizMode, currentIndex, speechCode, words]);

  if (!isOpen || words.length === 0) return null;

  const currentWord = words[currentIndex] || words[0];
  const currentWordProgress = currentWord ? spacedRepetition.getWordProgress(currentWord.id) : undefined;
  const isLeech = currentWord ? spacedRepetition.isLeechWord(currentWord.id) : false;

  // Dynamic Options Generator based on Quiz Mode
  const { options, correctAnswer } = useMemo(() => {
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
      soundSynth.playCompletionChime();
      haptic.vibrateLight();
      setScore((s) => s + 1);
      spacedRepetition.recordResult(currentWord.id, true, 'medium');
    } else {
      soundSynth.playTactileClick();
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

    if (currentIndex + 1 < words.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
      if (onCompleted) {
        onCompleted(score + (selectedOption === correctAnswer ? 1 : 0), words.length);
      }
    }
  };

  const progressPercentage = Math.round(((currentIndex + 1) / words.length) * 100);
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#13141F] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-5 sm:p-7 space-y-4">
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

        {/* Quiz Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400">
            <span>
              {isAr ? 'السؤال' : 'Question'} {currentIndex + 1} / {words.length}
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {score} {isAr ? 'إجابات صحيحة' : 'Correct'}
            </span>
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
                <div className="py-3 space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md animate-pulse">
                    <Headphones className="w-7 h-7" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSpeakWord}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800/40"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isAr ? 'أعد الاستماع' : 'Replay Audio'}</span>
                  </button>
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
                  <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white dir-ltr">
                    {currentWord.contextSentence.replace(new RegExp(currentWord.word, 'gi'), '_______')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    ({currentWord.contextSentenceAr})
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
                      className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
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
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800/40 animate-fade-in">
                  💡 {currentWord.contextSentence}
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
                    className={`p-3.5 rounded-2xl border text-sm text-start font-medium transition-all flex items-center justify-between gap-2 cursor-pointer ${style}`}
                  >
                    <span>{opt}</span>
                    {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

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

            {/* Action Bar */}
            <div className="pt-2">
              {!isAnswerSubmitted ? (
                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={handleSubmitAnswer}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {isAr ? 'تأكيد الإجابة' : 'Check Answer'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <span>{isAr ? 'السؤال التالي' : 'Next Question'}</span>
                  <ArrowIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Finished Screen */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {isAr ? 'أحسنت! اكتمل الاختبار اليومي بنجاح' : 'Great Job! Quiz Completed'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                {isAr
                  ? `أحرزت ${score} من إجمالي ${words.length} كلمات بنجاح (+${score * 3} XP)`
                  : `You scored ${score} out of ${words.length} words (+${score * 3} XP)`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md cursor-pointer"
            >
              {isAr ? 'إغلاق ومتابعة اليوم' : 'Close & Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
