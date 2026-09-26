import React, { useState, useEffect, useMemo } from 'react';
import {
  Volume2,
  ChevronRight,
  ChevronLeft,
  Globe,
  Plus,
  RotateCw,
  Layers,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  Zap,
  Headphones,
  GraduationCap,
  Trophy,
  Briefcase,
} from 'lucide-react';
import {
  TARGET_LANGUAGES,
  type TargetLanguageCode,
  type VocabularyWord,
  type CefrLevel,
  CEFR_LEVELS_INFO,
  CATEGORY_INFO,
} from '../../data/languages/vocabularyDatabase';
import {
  spacedRepetition,
  type LanguageLearningStats,
  type FluencyProfile,
  type LevelProgress,
} from '../../services/spacedRepetitionService';
import { speechService } from '../../services/speechService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { LanguageQuizModal } from './LanguageQuizModal';
import { RootDeconstructorCard } from './RootDeconstructorCard';
import { LanguageMovesModal, type MoveType } from './LanguageMovesModal';
import { HandsFreeImmersionModal } from './HandsFreeImmersionModal';
import { CefrAdvancementModal } from './CefrAdvancementModal';
import { ExecutiveEnglishStudioModal } from './ExecutiveEnglishStudioModal';

interface LanguageMasteryCardProps {
  className?: string;
  onRewardToast?: (msg: string) => void;
}

export const LanguageMasteryCard: React.FC<LanguageMasteryCardProps> = ({
  className = '',
  onRewardToast,
}) => {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  const [activeLang, setActiveLang] = useState<TargetLanguageCode>(() =>
    spacedRepetition.getActiveLanguage()
  );
  const [dailyQuota, setDailyQuota] = useState<number>(() =>
    spacedRepetition.getDailyQuota()
  );
  const [todayWords, setTodayWords] = useState<VocabularyWord[]>([]);
  const [stats, setStats] = useState<LanguageLearningStats>(() =>
    spacedRepetition.getStats()
  );
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  // View Mode: 'flashcards' (3D Flip) vs 'detail' (Full Breakdown) vs 'vault' (Vocabulary Archive)
  const [viewMode, setViewMode] = useState<'flashcards' | 'detail' | 'vault'>('flashcards');
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultFilter, setVaultFilter] = useState<'all' | 'mastered' | 'knots'>('all');
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz Modal State
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizDeck, setQuizDeck] = useState<VocabularyWord[]>([]);

  // Add Custom Word Modal State
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [customWordText, setCustomWordText] = useState('');
  const [customTransText, setCustomTransText] = useState('');
  const [customSentenceText, setCustomSentenceText] = useState('');
  const [customSentenceArText, setCustomSentenceArText] = useState('');

  // CEFR Level Filter: 'all' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  const [selectedCefrLevel, setSelectedCefrLevel] = useState<CefrLevel | 'all'>('all');

  // Moves Lab Modal State
  const [isMovesOpen, setIsMovesOpen] = useState(false);
  const [selectedMove] = useState<MoveType>('shadowing');

  // Hands-Free Immersion State
  const [isImmersionOpen, setIsImmersionOpen] = useState(false);

  // CEFR Advancement Exam State
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [examLevel, setExamLevel] = useState<CefrLevel>('A1');

  // Executive English Studio & Meeting Simulator State
  const [isExecutiveStudioOpen, setIsExecutiveStudioOpen] = useState(false);

  // Refresh words when language, quota, or CEFR level changes
  useEffect(() => {
    spacedRepetition.setActiveLanguage(activeLang);
    spacedRepetition.setDailyQuota(dailyQuota);

    let words: VocabularyWord[] = [];
    if (selectedCefrLevel === 'all') {
      words = spacedRepetition.getTodayWords(dailyQuota);
    } else {
      words = spacedRepetition.getWordsByLevel(selectedCefrLevel, activeLang);
      if (words.length === 0) {
        words = spacedRepetition.getTodayWords(dailyQuota);
      }
    }

    setTodayWords(words);
    setStats(spacedRepetition.getStats());
    setActiveWordIndex(0);
    setIsFlipped(false);
  }, [activeLang, dailyQuota, selectedCefrLevel]);

  const fluencyProfile: FluencyProfile = useMemo(() => {
    return spacedRepetition.calculateFluencyProfile(activeLang);
  }, [activeLang, stats]);

  const levelsProgress: LevelProgress[] = useMemo(() => {
    return spacedRepetition.getAllLevelsProgress(activeLang);
  }, [activeLang, stats]);

  const currentLangObj =
    TARGET_LANGUAGES.find((l) => l.code === activeLang) || TARGET_LANGUAGES[0];

  const currentWord = todayWords[activeWordIndex] || todayWords[0];
  const currentWordProgress = currentWord ? spacedRepetition.getWordProgress(currentWord.id) : undefined;
  const isCurrentLeech = currentWord ? spacedRepetition.isLeechWord(currentWord.id) : false;

  const handleSpeak = (wordToSpeak?: string, rate = 1.0) => {
    const text = wordToSpeak || currentWord?.word;
    if (!text) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    speechService.speak(text, currentLangObj.speechCode, rate);
  };

  const handleNextWord = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsFlipped(false);
    if (activeWordIndex + 1 < todayWords.length) {
      setActiveWordIndex((idx) => idx + 1);
    }
  };

  const handlePrevWord = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsFlipped(false);
    if (activeWordIndex > 0) {
      setActiveWordIndex((idx) => idx - 1);
    }
  };

  // Flashcard Rating (Spaced Repetition Quick Response)
  const handleRateFlashcard = (rating: 'easy' | 'medium' | 'hard') => {
    if (!currentWord) return;
    const isCorrect = rating !== 'hard';
    spacedRepetition.recordResult(currentWord.id, isCorrect, rating);
    setStats(spacedRepetition.getStats());

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
      if (activeWordIndex + 1 < todayWords.length) {
        setActiveWordIndex((idx) => idx + 1);
      } else {
        setActiveWordIndex(0);
        if (onRewardToast) {
          onRewardToast(
            isAr
              ? '🎉 ممتاز! أتممت جولة البطاقات التفاعلية لليوم بنجاح!'
              : '🎉 Splendid! You completed today’s flashcards round!'
          );
        }
      }
    }, 220);
  };

  const handleStartTodayQuiz = () => {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();
    setQuizDeck(todayWords);
    setIsQuizOpen(true);
  };

  const handleStartReviewSession = () => {
    const dueWords = spacedRepetition.getDueReviewWords();
    if (dueWords.length === 0) {
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? '✨ رائع! جميع المراجعات التكرارية محدثة ولا توجد كلمات متأخرة اليوم!'
            : '✨ Great! All spaced repetition reviews are up to date!'
        );
      }
      return;
    }
    soundSynth.playCompletionChime();
    haptic.vibrateLight();
    setQuizDeck(dueWords);
    setIsQuizOpen(true);
  };

  const handleQuizCompleted = (score: number, total: number) => {
    setStats(spacedRepetition.getStats());
    if (onRewardToast) {
      onRewardToast(
        isAr
          ? `🏆 أحسنت! حققت ${score} من ${total} في اختبار الكلمات اليومي! (+20 XP)`
          : `🏆 Well done! ${score}/${total} correct in daily quiz! (+20 XP)`
      );
    }
  };

  const handleSaveCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWordText.trim() || !customTransText.trim()) return;

    soundSynth.playCompletionChime();
    haptic.vibrateLight();

    spacedRepetition.addCustomWord({
      word: customWordText.trim(),
      phonetic: `/${customWordText.trim().toLowerCase()}/`,
      translationAr: customTransText.trim(),
      partOfSpeech: 'noun',
      level: 'A2',
      lang: activeLang,
      category: 'daily_fluency',
      contextSentence:
        customSentenceText.trim() || `I am using the word ${customWordText.trim()} in my daily life.`,
      contextSentenceAr:
        customSentenceArText.trim() || `أنا أستخدم كلمة ${customTransText.trim()} في حياتي اليومية.`,
      collocations: [],
    });

    const words = spacedRepetition.getTodayWords(dailyQuota);
    setTodayWords(words);
    setStats(spacedRepetition.getStats());

    if (onRewardToast) {
      onRewardToast(
        isAr
          ? `✨ تمت إضافة "${customWordText.trim()}" إلى حصيلتك وجدول المراجعات بنجاح!`
          : `✨ Added "${customWordText.trim()}" to your vocabulary deck!`
      );
    }

    setCustomWordText('');
    setCustomTransText('');
    setCustomSentenceText('');
    setCustomSentenceArText('');
    setIsAddWordOpen(false);
  };

  const ArrowPrev = isRTL ? ChevronRight : ChevronLeft;
  const ArrowNext = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200/90 dark:border-white/[0.08] p-4 sm:p-6 shadow-sm space-y-4 ${className}`}
    >
      {/* 1. Header: Language Picker, View Mode Toggle & Add Word */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                {isAr ? 'منظومة تعلّم اللغات والحصيلة اليومية' : 'Language Mastery & Daily Vocabulary'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/40">
                {currentLangObj.flag} {currentLangObj.nameAr}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {isAr
                ? 'حفظ سياقي، بطاقات تفاعلية، نطق بشري، وتكرار متباعد (SRS)'
                : 'Contextual learning, 3D flip cards, native speech & Leitner SRS'}
            </p>
          </div>
        </div>

        {/* Action Controls: Quota & Add Word Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Add Word Button */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsAddWordOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300/80 dark:border-emerald-700/60 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'أضف كلمة' : 'Add Word'}</span>
          </button>

          {/* Quota Selector: 10 vs 15 Words */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setDailyQuota(5);
              }}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                dailyQuota === 5
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              5 {isAr ? 'كلمات' : 'words'}
            </button>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setDailyQuota(10);
              }}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                dailyQuota === 10
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              10 {isAr ? 'كلمات' : 'words'}
            </button>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setDailyQuota(15);
              }}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                dailyQuota === 15
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              15 {isAr ? 'كلمة' : 'words'}
            </button>
          </div>
        </div>
      </div>

      {/* Fluency Index & CEFR Rank Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-500/[0.08] via-purple-500/[0.05] to-emerald-500/[0.06] border border-indigo-200/80 dark:border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
            {fluencyProfile.score}%
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-slate-950 dark:text-zinc-100 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'مؤشر الطلاقة اللغوية الشامل' : 'Fluency Index'}</span>
              </span>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                {fluencyProfile.currentCefr} • {isAr ? fluencyProfile.titleAr : fluencyProfile.titleEn}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {isAr
                ? `نسبة الاستبقاء: ${fluencyProfile.retentionRate}% • متقن: ${fluencyProfile.totalMastered} كلمة`
                : `Retention: ${fluencyProfile.retentionRate}% • Mastered: ${fluencyProfile.totalMastered} words`}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons: Moves Lab, Hands-Free Immersion, CEFR Exam */}
        <div className="flex items-center gap-1.5 flex-wrap self-stretch sm:self-auto">
          {/* Moves Lab Button */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsMovesOpen(true);
            }}
            className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{isAr ? 'مختبر الحركات ⚡' : 'Moves Lab ⚡'}</span>
          </button>

          {/* Hands-Free Immersion Button */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsImmersionOpen(true);
            }}
            className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>{isAr ? 'انغماس صوتي 🎧' : 'Hands-Free 🎧'}</span>
          </button>

          {/* CEFR Advancement Exam Button */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setExamLevel(fluencyProfile.currentCefr);
              setIsExamOpen(true);
            }}
            className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-black dark:hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 dark:border-zinc-700 shadow-2xs transition-transform active:scale-95 cursor-pointer"
            title={isAr ? 'امتحان ارتقاء المستوى المعتمد' : 'CEFR Level Exam'}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'امتحان الارتقاء 🎓' : 'Level Exam 🎓'}</span>
          </button>

          {/* Executive English PM Studio Button */}
          {activeLang === 'en' && (
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsExecutiveStudioOpen(true);
              }}
              className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer ring-1 ring-purple-400/40"
              title={isAr ? 'أستوديو القيادة الإنجليزية ومحاكي الاجتماعات التنفيذي' : 'Executive English PM Studio & Meeting Simulator'}
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAr ? 'أستوديو القيادة 🎙️' : 'PM Studio 🎙️'}</span>
            </button>
          )}
        </div>
      </div>

      {/* CEFR Levels Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 border-y border-slate-100 dark:border-white/[0.05]">
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            setSelectedCefrLevel('all');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedCefrLevel === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-xs font-black'
              : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
          }`}
        >
          {isAr ? 'جميع المستويات' : 'All Levels'}
        </button>

        {CEFR_LEVELS_INFO.map((lvl) => {
          const prog = levelsProgress.find((p) => p.level === lvl.level);
          const isSelected = selectedCefrLevel === lvl.level;
          const isPassed = prog?.isExamPassed;
          return (
            <button
              key={lvl.level}
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setSelectedCefrLevel(lvl.level);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 border border-slate-200/60 dark:border-zinc-700/60'
              }`}
            >
              <span>{lvl.level}</span>
              <span className="text-[10px] opacity-80">{lvl.nameAr.split(' ')[0]}</span>
              {isPassed && <span className="text-[10px] text-amber-400">👑</span>}
              {prog && prog.total > 0 && (
                <span className="text-[10px] opacity-70 font-mono">
                  ({prog.mastered}/{prog.total})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Language Selector Pills & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Languages */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {TARGET_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setActiveLang(l.code);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeLang === l.code
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.nameAr.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setViewMode('flashcards');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              viewMode === 'flashcards'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? 'بطاقات فلاش 3D' : '3D Flashcards'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setViewMode('detail');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              viewMode === 'detail'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isAr ? 'تفصيلي' : 'Detailed'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setViewMode('vault');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              viewMode === 'vault'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'الخزانة' : 'Vault'}</span>
          </button>
        </div>
      </div>

      {/* 2. MODE A: 3D FLIP FLASHCARD */}
      {currentWord && viewMode === 'flashcards' && (
        <div className="space-y-3">
          {/* Card Navigation & Counter */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/40">
                {activeWordIndex + 1} / {todayWords.length}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 bg-slate-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded">
                {currentWord.level} • {currentWord.partOfSpeech}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activeWordIndex === 0}
                onClick={handlePrevWord}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 disabled:opacity-30 cursor-pointer"
                title={isAr ? 'السابق' : 'Previous'}
              >
                <ArrowPrev className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={activeWordIndex + 1 >= todayWords.length}
                onClick={handleNextWord}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 disabled:opacity-30 cursor-pointer"
                title={isAr ? 'التالي' : 'Next'}
              >
                <ArrowNext className="w-4 h-4" />
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
              className="relative min-h-[290px] w-full rounded-2xl"
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
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {currentLangObj.flag} {currentLangObj.nameEn}
                    </span>
                    {isCurrentLeech && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-pulse">
                        {isAr ? 'عقدة معرفية 🧩' : 'Cognitive Knot 🧩'}
                      </span>
                    )}
                  </div>
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
                        handleSpeak(currentWord.word, 1.0);
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
                        handleSpeak(currentWord.word, 0.75);
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
                    <p className="font-medium text-slate-900 dark:text-zinc-100">
                      "{currentWord.contextSentence}"
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-400/90 font-sans">
                      "{currentWord.contextSentenceAr}"
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

          {/* Morphological Root Deconstructor & Leech Breaker */}
          <RootDeconstructorCard
            word={currentWord}
            isAr={isAr}
            isLeech={isCurrentLeech}
            timesIncorrect={currentWordProgress?.timesIncorrect || 0}
            easeFactor={currentWordProgress?.easeFactor ?? 2.5}
            onKnotReset={() => {
              setStats(spacedRepetition.getStats());
              if (onRewardToast) {
                onRewardToast(
                  isAr
                    ? '✨ تم فك العقدة المعرفية وتصفير التعثرات بنجاح!'
                    : '✨ Cognitive knot unraveled!'
                );
              }
            }}
          />
        </div>
      )}

      {/* 2. MODE B: DETAILED CARD BREAKDOWN */}
      {currentWord && viewMode === 'detail' && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/[0.04] via-slate-50/70 dark:via-zinc-900/60 to-white dark:to-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 space-y-4 shadow-xs">
          {/* Top Counter & Category */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/40">
                {activeWordIndex + 1} / {todayWords.length}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 bg-slate-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded">
                {currentWord.level} • {currentWord.partOfSpeech}
              </span>
              {currentWord.category && CATEGORY_INFO[currentWord.category] && (
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded flex items-center gap-1 border border-indigo-200/50 dark:border-indigo-800/30">
                  <span>{CATEGORY_INFO[currentWord.category].icon}</span>
                  <span className="hidden sm:inline">
                    {isAr ? CATEGORY_INFO[currentWord.category].nameAr : CATEGORY_INFO[currentWord.category].nameEn}
                  </span>
                </span>
              )}
            </div>

            {/* Stepper buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activeWordIndex === 0}
                onClick={handlePrevWord}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 disabled:opacity-30 cursor-pointer"
              >
                <ArrowPrev className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={activeWordIndex + 1 >= todayWords.length}
                onClick={handleNextWord}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 disabled:opacity-30 cursor-pointer"
              >
                <ArrowNext className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Big Word & Speech Audio Buttons */}
          <div className="space-y-1 text-center py-2">
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white font-serif tracking-tight">
                {currentWord.word}
              </h2>

              <button
                type="button"
                onClick={() => handleSpeak(currentWord.word, 1.0)}
                className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                title={isAr ? 'نطق صوتي أصلي' : 'Native Speech'}
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleSpeak(currentWord.word, 0.75)}
                className="px-2 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold border border-indigo-200 dark:border-indigo-800/40 cursor-pointer"
                title={isAr ? 'نطق بطيء للتدقيق' : 'Slow speech 0.75x'}
              >
                0.75x
              </button>
            </div>

            <p className="font-mono text-xs text-slate-500 dark:text-zinc-400">
              {currentWord.phonetic}
            </p>

            <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 pt-1">
              {currentWord.translationAr}
            </p>
          </div>

          {/* Contextual Real Sentence Box */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              <span>📖</span>
              <span>{isAr ? 'سياق الاستخدام في جملة عملية:' : 'Contextual Sentence:'}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-900 dark:text-zinc-100 font-medium leading-relaxed">
              "{currentWord.contextSentence}"
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300/90 leading-relaxed font-sans font-medium">
              "{currentWord.contextSentenceAr}"
            </p>
          </div>

          {/* Common Collocations */}
          {currentWord.collocations.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-500 font-bold">متلازمات شائعة:</span>
              {currentWord.collocations.map((col, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 font-mono"
                >
                  {col}
                </span>
              ))}
            </div>
          )}

          {/* Morphological Root Deconstructor & Leech Breaker */}
          <RootDeconstructorCard
            word={currentWord}
            isAr={isAr}
            isLeech={isCurrentLeech}
            timesIncorrect={currentWordProgress?.timesIncorrect || 0}
            easeFactor={currentWordProgress?.easeFactor ?? 2.5}
            defaultExpanded={true}
            onKnotReset={() => {
              setStats(spacedRepetition.getStats());
              if (onRewardToast) {
                onRewardToast(
                  isAr
                    ? '✨ تم فك العقدة المعرفية وتصفير التعثرات بنجاح!'
                    : '✨ Cognitive knot unraveled!'
                );
              }
            }}
          />
        </div>
      )}

      {/* 2. MODE C: VOCABULARY VAULT (ARCHIVE) */}
      {viewMode === 'vault' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={vaultSearch}
              onChange={(e) => setVaultSearch(e.target.value)}
              placeholder={isAr ? 'ابحث في كلمات اللغة المتقنة...' : 'Search words in vocabulary vault...'}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Vault Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setVaultFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                vaultFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'جميع الكلمات' : 'All Words'}
            </button>
            <button
              type="button"
              onClick={() => setVaultFilter('mastered')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                vaultFilter === 'mastered'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              {isAr ? `المتقنة (${stats.masteredCount})` : `Mastered (${stats.masteredCount})`}
            </button>
            <button
              type="button"
              onClick={() => setVaultFilter('knots')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                vaultFilter === 'knots'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              {isAr ? `العقد المعرفية (${stats.leechCount}) 🧩` : `Cognitive Knots (${stats.leechCount}) 🧩`}
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {spacedRepetition
              .getAllWordsForLanguage(activeLang)
              .filter((w) => {
                const matchesSearch =
                  w.word.toLowerCase().includes(vaultSearch.toLowerCase()) ||
                  w.translationAr.includes(vaultSearch);
                if (!matchesSearch) return false;

                if (vaultFilter === 'mastered') {
                  return spacedRepetition.getWordProgress(w.id)?.status === 'mastered';
                }
                if (vaultFilter === 'knots') {
                  return spacedRepetition.isLeechWord(w.id);
                }
                return true;
              })
              .map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-white/[0.05] flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                        {w.word}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {w.phonetic}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800/40">
                        {w.level}
                      </span>
                      {spacedRepetition.isLeechWord(w.id) && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                          {isAr ? 'عقدة معرفية 🧩' : 'Knot 🧩'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300">
                      {w.translationAr}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSpeak(w.word)}
                    className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"
                    title={isAr ? 'استماع' : 'Listen'}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Review Avalanche Anti-Burnout Triage Banner */}
      {stats.dueReviewsCount > 20 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-rose-500/10 border border-amber-500/30 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-base">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
                  {isAr ? 'طوارئ تراكم المراجعات (Review Avalanche)' : 'Review Avalanche Recovery'}
                </h4>
                <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {stats.dueReviewsCount} {isAr ? 'كلمة متراكمة' : 'overdue'}
                </span>
              </div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                {isAr
                  ? 'لا تقلق من التراكم! خوارزمية FSRS جهزت لك دفعة إنقاذ مركزة من 15 كلمة فقط هي الأكثر عرضة للنسيان.'
                  : 'Avoid burnout! FSRS triage selected the 15 highest-forgetting-risk words to conquer right now.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const triageQueue = spacedRepetition.getAvalancheRecoveryQueue();
              soundSynth.playCompletionChime();
              haptic.vibrateLight();
              setQuizDeck(triageQueue);
              setIsQuizOpen(true);
            }}
            className="self-stretch sm:self-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>⚡</span>
            <span>{isAr ? 'بدء جلسة الإنقاذ (15 كلمة)' : 'Start Rescue Triage (15)'}</span>
          </button>
        </div>
      )}

      {/* 3. Action Buttons & Spaced Repetition Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {/* Launch Interactive Quiz */}
        <button
          type="button"
          onClick={handleStartTodayQuiz}
          className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <span>🎯</span>
          <span>{isAr ? 'ابدأ اختبار الحفظ والاستيعاب اليومي' : 'Start Daily Quiz'}</span>
        </button>

        {/* Launch Spaced Repetition Review Deck */}
        <button
          type="button"
          onClick={handleStartReviewSession}
          className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer"
        >
          <span>🔁</span>
          <span>
            {isAr
              ? `مراجعة الكلمات السابقة (${stats.dueReviewsCount})`
              : `Review Due Words (${stats.dueReviewsCount})`}
          </span>
        </button>
      </div>

      {/* SRS Stats Summary Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span>
            📚 {isAr ? 'إجمالي ما تعلمته:' : 'Learned:'}{' '}
            <strong className="text-slate-800 dark:text-zinc-200 font-mono">
              {stats.totalLearned}
            </strong>
          </span>
          <span>
            👑 {isAr ? 'المتقنات في الذاكرة الدائمة:' : 'Mastered:'}{' '}
            <strong className="text-emerald-600 font-mono">{stats.masteredCount}</strong>
          </span>
          {stats.leechCount > 0 && (
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setViewMode('vault');
                setVaultFilter('knots');
              }}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>🧩 {isAr ? 'عقد معرفية بحاجة لتفكيك:' : 'Cognitive Knots:'}</span>
              <strong className="font-mono">{stats.leechCount}</strong>
            </button>
          )}
        </div>

        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
          نظام التكرار المتباعد (SRS) والتفكيك المورفولوجي مفعل ⚡
        </span>
      </div>

      {/* Add Custom Word Modal */}
      {isAddWordOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#151722] border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isAr ? 'إضافة كلمة جديدة لحصيلتك' : 'Add Custom Vocabulary'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWordOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomWord} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {isAr ? `الكلمة (${currentLangObj.nameAr}):` : `Word (${currentLangObj.nameEn}):`}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={customWordText}
                    onChange={(e) => setCustomWordText(e.target.value)}
                    placeholder={activeLang === 'en' ? 'e.g. Perseverance' : 'الكلمة باللغة الأجنبية'}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {customWordText.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSpeak(customWordText.trim())}
                      className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40"
                      title={isAr ? 'اختبر النطق' : 'Test Speech'}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {isAr ? 'الترجمة العربية الدقيقة:' : 'Arabic Translation:'}
                </label>
                <input
                  type="text"
                  required
                  value={customTransText}
                  onChange={(e) => setCustomTransText(e.target.value)}
                  placeholder="مثال: المثابرة والإصرار"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {isAr ? 'جملة توضيحية في سياق (اختياري):' : 'Context Sentence (Optional):'}
                </label>
                <input
                  type="text"
                  value={customSentenceText}
                  onChange={(e) => setCustomSentenceText(e.target.value)}
                  placeholder="e.g. Success requires perseverance and faith."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddWordOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
                >
                  {isAr ? 'حفظ في حصيلتي اليومية' : 'Save to My Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      <LanguageQuizModal
        isOpen={isQuizOpen}
        onClose={() => {
          setIsQuizOpen(false);
          setStats(spacedRepetition.getStats());
        }}
        words={quizDeck}
        speechCode={currentLangObj.speechCode}
        onCompleted={handleQuizCompleted}
      />

      {/* 5 Moves Lab Modal */}
      <LanguageMovesModal
        isOpen={isMovesOpen}
        onClose={() => {
          setIsMovesOpen(false);
          setStats(spacedRepetition.getStats());
        }}
        words={todayWords.length > 0 ? todayWords : spacedRepetition.getAllWordsForLanguage(activeLang)}
        speechCode={currentLangObj.speechCode}
        isAr={isAr}
        languageName={currentLangObj.nameAr}
        initialMove={selectedMove}
      />

      {/* Hands-Free Continuous Audio Immersion Modal */}
      <HandsFreeImmersionModal
        isOpen={isImmersionOpen}
        onClose={() => setIsImmersionOpen(false)}
        words={todayWords.length > 0 ? todayWords : spacedRepetition.getAllWordsForLanguage(activeLang)}
        speechCode={currentLangObj.speechCode}
        isAr={isAr}
        languageName={currentLangObj.nameAr}
      />

      {/* CEFR Advancement Exam & Certificate Modal */}
      <CefrAdvancementModal
        isOpen={isExamOpen}
        onClose={() => setIsExamOpen(false)}
        level={examLevel}
        words={
          spacedRepetition.getWordsByLevel(examLevel, activeLang).length > 0
            ? spacedRepetition.getWordsByLevel(examLevel, activeLang)
            : spacedRepetition.getAllWordsForLanguage(activeLang)
        }
        speechCode={currentLangObj.speechCode}
        isAr={isAr}
        languageName={currentLangObj.nameAr}
        onLevelPassed={(lvl) => {
          setStats(spacedRepetition.getStats());
          if (onRewardToast) {
            onRewardToast(
              isAr
                ? `🎓 مبارك! تم اجتياز امتحان مستوى ${lvl} بنجاح وترقية شهادتك اللغوية!`
                : `🎓 Splendid! You passed level ${lvl} exam!`
            );
          }
        }}
      />

      {/* Executive English PM Studio & Meeting Simulator Modal */}
      <ExecutiveEnglishStudioModal
        isOpen={isExecutiveStudioOpen}
        onClose={() => setIsExecutiveStudioOpen(false)}
        onRewardToast={onRewardToast}
      />
    </div>
  );
};
