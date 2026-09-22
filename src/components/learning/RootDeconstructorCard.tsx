import React, { useState } from 'react';
import {
  Sparkles,
  Puzzle,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Brain,
  Layers,
} from 'lucide-react';
import type { VocabularyWord } from '../../data/languages/vocabularyDatabase';
import { deconstructVocabularyWord, type RootDeconstruction } from '../../services/etymologyHelper';
import { spacedRepetition } from '../../services/spacedRepetitionService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface RootDeconstructorCardProps {
  word: VocabularyWord;
  isAr: boolean;
  isLeech: boolean;
  timesIncorrect: number;
  easeFactor: number;
  onKnotReset?: () => void;
  defaultExpanded?: boolean;
}

export const RootDeconstructorCard: React.FC<RootDeconstructorCardProps> = ({
  word,
  isAr,
  isLeech,
  timesIncorrect,
  easeFactor,
  onKnotReset,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isLeech);
  const [hasReset, setHasReset] = useState(false);

  const deconstruction: RootDeconstruction = deconstructVocabularyWord(word);

  const handleBreakKnot = async () => {
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    await spacedRepetition.resetLeechStatus(word.id);
    setHasReset(true);
    if (onKnotReset) {
      onKnotReset();
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isLeech
          ? 'bg-gradient-to-r from-amber-500/[0.07] via-rose-500/[0.04] to-transparent dark:from-amber-950/40 dark:via-rose-950/20 dark:to-transparent border-amber-300/80 dark:border-amber-700/60 shadow-xs'
          : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-800/40'
      }`}
    >
      {/* Header Banner */}
      <div
        onClick={() => {
          soundSynth.playTactileClick();
          setIsExpanded(!isExpanded);
        }}
        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isLeech
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            {isLeech ? <Puzzle className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>{isAr ? 'كاسر العقدة المعرفية والتفكيك الصرفي' : 'Morphological Root Deconstructor'}</span>
              </span>
              {isLeech && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-pulse">
                  {isAr ? `عقدة معرفية (${timesIncorrect} تعثرات)` : `Cognitive Knot (${timesIncorrect} lapses)`}
                </span>
              )}
              {easeFactor < 2.0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  Ease: {easeFactor.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              {isAr
                ? 'حل علمي للكلمات المستعصية عبر تفكيك الجذور والمثبت الحسي في قصر الذاكرة'
                : 'Overcome memory interference via etymological roots and sensory anchors'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
            {isExpanded ? (isAr ? 'طي' : 'Collapse') : (isAr ? 'استكشاف' : 'Explore')}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-slate-200/60 dark:border-zinc-800">
          {/* Morphological Components */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isAr ? 'التفكيك المورفولوجي لأجزاء الكلمة:' : 'Morphological Components:'}</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {deconstruction.parts.map((part, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                      {part.part}
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                      {part.type} {part.origin ? `• ${part.origin}` : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-zinc-300 font-medium">
                    {isAr ? part.meaningAr : part.meaningEn}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed bg-white/60 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/60">
              {isAr ? deconstruction.etymologySummaryAr : deconstruction.etymologySummary}
            </p>
          </div>

          {/* Sensory Memory Palace Hook */}
          <div className="p-3.5 rounded-xl bg-amber-500/[0.08] dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-700/50 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 text-xs font-bold">
              <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{isAr ? 'المثبت الحسي وقصر الذاكرة (Sensory Mnemonic):' : 'Sensory Mnemonic Hook:'}</span>
            </div>
            <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
              {isAr ? deconstruction.sensoryMnemonic : deconstruction.sensoryMnemonicEn}
            </p>
            <div className="pt-1 flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-400">
              <span>🏛️</span>
              <span className="italic">{deconstruction.palaceVisual}</span>
            </div>
          </div>

          {/* Break Leech Knot Button */}
          {isLeech && !hasReset && (
            <div className="pt-1 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'هل استوعبت الجذر الآن؟ انقر لفك العقدة وتصفير عداد التعثرات:'
                  : 'Grasped the root? Reset lapse counter and ease factor:'}
              </span>
              <button
                type="button"
                onClick={handleBreakKnot}
                className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'فك العقدة المعرفية ✨' : 'Break Knot ✨'}</span>
              </button>
            </div>
          )}

          {hasReset && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {isAr
                  ? 'تم فك العقدة بنجاح! عادت الكلمة إلى جدول المراجعة بصفحة ذهنية جديدة.'
                  : 'Knot broken! Card reset to a fresh baseline review interval.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
