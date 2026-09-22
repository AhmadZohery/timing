import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Volume2,
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import {
  type VocabularyWord,
  type CefrLevel,
  CEFR_LEVELS_INFO,
} from '../../data/languages/vocabularyDatabase';
import { spacedRepetition } from '../../services/spacedRepetitionService';
import { speechService } from '../../services/speechService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface CefrAdvancementModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: CefrLevel;
  words: VocabularyWord[];
  speechCode: string;
  isAr: boolean;
  languageName: string;
  onLevelPassed?: (level: CefrLevel) => void;
}

interface ExamQuestion {
  id: string;
  type: 'vocab_meaning' | 'listening' | 'reverse_recall';
  prompt: string;
  subPrompt?: string;
  wordToSpeak?: string;
  options: string[];
  correctAnswer: string;
  wordRef: VocabularyWord;
}

export const CefrAdvancementModal: React.FC<CefrAdvancementModalProps> = ({
  isOpen,
  onClose,
  level,
  words,
  speechCode,
  isAr,
  languageName,
  onLevelPassed,
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const levelInfo = CEFR_LEVELS_INFO.find((i) => i.level === level) || CEFR_LEVELS_INFO[0];

  // Generate 8 tailored exam questions from the level words
  const questions: ExamQuestion[] = useMemo(() => {
    if (!words || words.length === 0) return [];

    const examDeck = [...words].sort(() => 0.5 - Math.random()).slice(0, 8);

    return examDeck.map((w, idx) => {
      const otherWords = words.filter((ow) => ow.id !== w.id);
      const questionTypes: ('vocab_meaning' | 'listening' | 'reverse_recall')[] = [
        'vocab_meaning',
        'listening',
        'reverse_recall',
      ];
      const type = questionTypes[idx % questionTypes.length];

      if (type === 'reverse_recall') {
        // Prompt is Arabic, options are target language words
        const wrongAnswers = otherWords.map((ow) => ow.word).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [w.word, ...wrongAnswers].sort(() => 0.5 - Math.random());
        return {
          id: `q-${idx}`,
          type,
          prompt: isAr ? `ما هي الكلمة الأجنبية المقابلة لـ: "${w.translationAr}"؟` : `Which word matches "${w.translationAr}"?`,
          subPrompt: w.contextSentenceAr,
          options,
          correctAnswer: w.word,
          wordRef: w,
        };
      } else if (type === 'listening') {
        // Listen to word, options are Arabic translations
        const wrongAnswers = otherWords.map((ow) => ow.translationAr).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [w.translationAr, ...wrongAnswers].sort(() => 0.5 - Math.random());
        return {
          id: `q-${idx}`,
          type,
          prompt: isAr ? 'استمع إلى النطق الصوتي واختر المعنى الصحيح:' : 'Listen carefully and select the correct meaning:',
          wordToSpeak: w.word,
          options,
          correctAnswer: w.translationAr,
          wordRef: w,
        };
      } else {
        // Standard vocab meaning
        const wrongAnswers = otherWords.map((ow) => ow.translationAr).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [w.translationAr, ...wrongAnswers].sort(() => 0.5 - Math.random());
        return {
          id: `q-${idx}`,
          type,
          prompt: isAr ? `ما معنى كلمة [${w.word}]؟` : `What is the meaning of [${w.word}]?`,
          subPrompt: w.contextSentence ? `"${w.contextSentence}"` : undefined,
          wordToSpeak: w.word,
          options,
          correctAnswer: w.translationAr,
          wordRef: w,
        };
      }
    });
  }, [words, isAr]);

  useEffect(() => {
    if (isOpen) {
      setCurrentQIndex(0);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      setScore(0);
      setIsFinished(false);
    }
  }, [isOpen, level]);

  const currentQ = questions[currentQIndex];

  // Auto-play audio on listening questions
  useEffect(() => {
    if (isOpen && currentQ?.type === 'listening' && currentQ.wordToSpeak) {
      const timer = setTimeout(() => {
        speechService.speak(currentQ.wordToSpeak!, speechCode, 0.95);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentQIndex, currentQ, speechCode]);

  if (!isOpen) return null;

  const handleSelectOption = (option: string) => {
    if (isAnswerSubmitted) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || isAnswerSubmitted) return;

    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    setIsAnswerSubmitted(true);

    if (isCorrect) {
      soundSynth.playCompletionChime();
      haptic.vibrateLight();
      setScore((s) => s + 1);
    } else {
      soundSynth.playWarningSound();
      haptic.vibrateLight();
    }
  };

  const handleNextQuestion = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((idx) => idx + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      // Exam finished
      setIsFinished(true);
      const passRatio = score / (questions.length || 1);
      if (passRatio >= 0.75) {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        spacedRepetition.recordExamPassed(level);
        if (onLevelPassed) {
          onLevelPassed(level);
        }
      }
    }
  };

  const passRatio = score / (questions.length || 1);
  const isPassed = passRatio >= 0.75;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-up text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                  {isAr ? `امتحان ارتقاء المستوى (${level})` : `CEFR Advancement Exam (${level})`}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-300 dark:border-indigo-800/60">
                  {languageName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {levelInfo.titleAr} • {levelInfo.descriptionAr}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isFinished && currentQ ? (
          <div className="space-y-6">
            {/* Progress Bar & Counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">
                <span>
                  {isAr ? 'السؤال' : 'Question'} {currentQIndex + 1} / {questions.length}
                </span>
                <span>
                  {isAr ? 'الدرجة:' : 'Score:'} {score}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Prompt */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 space-y-2 text-center">
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {currentQ.type}
              </span>
              <h4 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white pt-1">
                {currentQ.prompt}
              </h4>
              {currentQ.subPrompt && (
                <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
                  {currentQ.subPrompt}
                </p>
              )}

              {currentQ.wordToSpeak && (
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => speechService.speak(currentQ.wordToSpeak!, speechCode, 0.95)}
                    className="p-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 shadow-md transition-transform active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt;
                const isCorrect = opt === currentQ.correctAnswer;

                let btnStyle = 'bg-white dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:border-indigo-400';
                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 font-bold';
                  } else {
                    btnStyle = 'opacity-40 border-slate-200 dark:border-zinc-800';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-900 dark:text-indigo-200 font-bold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`p-4 rounded-2xl border text-sm text-center transition-all cursor-pointer ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex justify-end">
              {!isAnswerSubmitted ? (
                <button
                  type="button"
                  disabled={!selectedAnswer}
                  onClick={handleSubmitAnswer}
                  className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm disabled:opacity-40 shadow-sm cursor-pointer"
                >
                  {isAr ? 'تأكيد الإجابة' : 'Submit Answer'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>{currentQIndex + 1 >= questions.length ? (isAr ? 'عرض النتيجة' : 'View Results') : (isAr ? 'السؤال التالي' : 'Next Question')}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Finished Screen: Certificate of Achievement or Retake */
          <div className="text-center space-y-6 py-4">
            {isPassed ? (
              <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/[0.08] via-emerald-500/[0.05] to-indigo-500/[0.08] border-2 border-amber-400/80 dark:border-amber-600/60 space-y-5 shadow-xl relative overflow-hidden">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center text-4xl shadow-lg shadow-amber-500/30 animate-bounce">
                  🏆
                </div>

                <div className="space-y-2">
                  <span className="text-xs uppercase font-mono font-bold tracking-widest text-amber-700 dark:text-amber-400">
                    {isAr ? 'شهادة إتقان معتمدة' : 'Official Level Certificate'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
                    {isAr ? `مبارك! اجتزت بنجاح مستوى ${level}` : `Congratulations! You passed Level ${level}`}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-md mx-auto leading-relaxed">
                    {isAr
                      ? `حققت ${score} من أصل ${questions.length} أسئلة (${Math.round(passRatio * 100)}%). تم ترقية تصنيفك اللغوي وفتح تحديات المستوى التالي بنجاح!`
                      : `You achieved ${score}/${questions.length} (${Math.round(passRatio * 100)}%). Your level has been upgraded!`}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{levelInfo.titleAr} ({levelInfo.nameEn}) • موثقة ومحفوظة</span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  {isAr ? 'استلام الشهادة ومتابعة التعلم 🎓' : 'Claim Certificate & Continue 🎓'}
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl">
                  🧩
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {isAr ? 'أوشكت على الاجتياز!' : 'Almost there!'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-sm mx-auto">
                    {isAr
                      ? `حققت ${score} من ${questions.length} (${Math.round(passRatio * 100)}%). يلزم تحقيق 75% للارتقاء. راجع الكلمات التي تعثرت فيها وأعد المحاولة!`
                      : `You scored ${score}/${questions.length}. 75% required to level up. Review your cards and try again!`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentQIndex(0);
                    setSelectedAnswer(null);
                    setIsAnswerSubmitted(false);
                    setScore(0);
                    setIsFinished(false);
                  }}
                  className="py-2.5 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs cursor-pointer"
                >
                  {isAr ? 'إعادة الاختبار الآن 🔁' : 'Retake Exam 🔁'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
