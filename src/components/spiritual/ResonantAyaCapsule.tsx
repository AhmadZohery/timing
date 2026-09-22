import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  Zap,
  Sun,
  Flame,
  Moon,
  Award,
} from 'lucide-react';
import {
  spiritualAyaEngine,
  type AyaContextCategory,
  type ResonantAya,
} from '../../services/spiritualAyaEngine';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface ResonantAyaCapsuleProps {
  currentStation?: string;
  isUrgeSurfing?: boolean;
  onRewardToast?: (msg: string) => void;
}

const CATEGORY_TABS: Array<{
  id: AyaContextCategory;
  labelAr: string;
  labelEn: string;
  icon: React.ReactNode;
}> = [
  { id: 'stress_anxiety', labelAr: 'سكينة', labelEn: 'Sakinah', icon: <Heart className="w-3.5 h-3.5 text-rose-500" /> },
  { id: 'athletic_fortitude', labelAr: 'عزم وقوة', labelEn: 'Fortitude', icon: <Flame className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'morning_dawns', labelAr: 'نور الفجر', labelEn: 'Dawn', icon: <Sun className="w-3.5 h-3.5 text-orange-400" /> },
  { id: 'deep_focus', labelAr: 'إتقان وعلم', labelEn: 'Focus', icon: <Zap className="w-3.5 h-3.5 text-sky-400" /> },
  { id: 'night_sahar', labelAr: 'خلوة السحر', labelEn: 'Sahar', icon: <Moon className="w-3.5 h-3.5 text-purple-400" /> },
  { id: 'gratitude_victory', labelAr: 'حمد وشكر', labelEn: 'Hamd', icon: <Award className="w-3.5 h-3.5 text-emerald-400" /> },
];

export const ResonantAyaCapsule: React.FC<ResonantAyaCapsuleProps> = ({
  currentStation,
  isUrgeSurfing = false,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [selectedCategory, setSelectedCategory] = useState<AyaContextCategory>(() =>
    spiritualAyaEngine.detectContext(currentStation, isUrgeSurfing)
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeAya: ResonantAya = spiritualAyaEngine.getResonantAya(selectedCategory);

  const handleSelectCategory = (cat: AyaContextCategory) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedCategory(cat);
  };

  const handleCopy = () => {
    soundSynth.playTactileClick();
    haptic.vibrateSprintCelebration();
    const text = `﴿${activeAya.arabicText}﴾\n[${activeAya.referenceCitation}]\n\n💡 تدبر وتوجيه:\n${activeAya.tadabburInsightAr}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onRewardToast) {
        onRewardToast(isAr ? 'تم نسخ الآية الكريمة وتدبرها بنجاح 📋' : 'Aya copied to clipboard!');
      }
    });
  };

  return (
    <div className="w-full rounded-3xl bg-gradient-to-b from-white via-slate-50 to-white dark:from-[#0e1017] dark:via-[#121420] dark:to-[#0e1017] border border-amber-500/20 dark:border-amber-500/25 p-4 sm:p-5 shadow-xs transition-all space-y-3 relative overflow-hidden">
      {/* Golden subtle ambient aura */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header & Quick State Selector */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider block">
              {isAr ? 'المحرك القرآني التوافقي • رنين اللحظة' : 'Harmonic Aya Resonance Engine'}
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
              {isAr ? activeAya.contextLabelAr : activeAya.contextLabelEn}
            </span>
          </div>
        </div>

        {/* State Selection Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectCategory(tab.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                    : 'bg-white/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Quranic Verse Body (Uthmani Typography) */}
      <div className="text-center py-2 px-2 sm:px-4 space-y-2">
        <p
          className="text-base sm:text-lg md:text-xl font-serif text-slate-900 dark:text-amber-100/95 leading-[2.2] select-text"
          dir="rtl"
        >
          «{activeAya.arabicText}»
        </p>

        <div className="flex items-center justify-center gap-2 text-xs font-mono text-amber-700 dark:text-amber-400/80">
          <span>{activeAya.referenceCitation}</span>
        </div>
      </div>

      {/* Expandable Tadabbur Insight */}
      <div className="pt-2 border-t border-dashed border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            setIsExpanded(!isExpanded);
          }}
          className="text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{isAr ? 'ومضة التدبر والتوجيه السلوكي' : 'Tadabbur Insight'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
          title={isAr ? 'نسخ الآية وتدبرها' : 'Copy'}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-800 dark:text-zinc-200 leading-relaxed animate-in fade-in">
          <p className="font-sans">
            {isAr ? activeAya.tadabburInsightAr : activeAya.tadabburInsightEn}
          </p>
        </div>
      )}
    </div>
  );
};
