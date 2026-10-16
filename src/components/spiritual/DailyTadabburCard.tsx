import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Maximize2,
  Bookmark,
  Scroll,
  BookMarked,
  CheckCircle2,
} from 'lucide-react';
import {
  getDailyTadabburItem,
  type DailyTadabburItem,
} from '../../data/dailyTadabburData';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { QuranAyahAudioPlayer } from './QuranAyahAudioPlayer';
import { IslamicRubElHizb } from '../common/IslamicRubElHizb';

interface DailyTadabburCardProps {
  onOpenModal?: (item: DailyTadabburItem, initialTab: 'quran' | 'hadith') => void;
  onToast?: (msg: string) => void;
}

export const DailyTadabburCard: React.FC<DailyTadabburCardProps> = ({
  onOpenModal,
  onToast,
}) => {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  const [dayOffset, setDayOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<'quran' | 'hadith'>('quran');
  const [expandedSection, setExpandedSection] = useState<'tafsir' | 'meanings' | 'asbab' | 'takeaways'>('tafsir');
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const currentItem = getDailyTadabburItem(dayOffset);
  const { quran, hadith } = currentItem;

  const handlePrevDay = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setDayOffset((prev) => prev - 1);
  };

  const handleNextDay = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setDayOffset((prev) => prev + 1);
  };

  const handleCopy = () => {
    soundSynth.playTactileClick();
    haptic.vibrateSprintCelebration();
    const textToCopy =
      activeTab === 'quran'
        ? `【 ${quran.surahName} (${quran.ayahRange}) 】\n\n«${quran.arabicText}»\n\n📖 خلاصة تفسير ابن كثير:\n${quran.tafsirIbnKathir}\n\n📚 المصدر: ${quran.referenceCitation}`
        : `【 ${hadith.title} 】\n\nعن ${hadith.narrator}:\n${hadith.matn}\n\n📖 شرح الحديث:\n${hadith.sharhSummary}\n\n📚 التخريج: ${hadith.sourceBook} (${hadith.hadithNumber}) - ${hadith.chapterName}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    if (onToast) {
      onToast(isAr ? 'تم نسخ النص القرآني والتفسير بنجاح ✓' : 'Tadabbur copied to clipboard!');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleBookmarkToggle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const next = !isBookmarked;
    setIsBookmarked(next);
    if (onToast) {
      onToast(next ? (isAr ? 'تم الحفظ في مفضلة التدبر' : 'Saved to favorites') : (isAr ? 'تمت الإزالة من المفضلة' : 'Removed from favorites'));
    }
  };

  return (
    <div className="w-full rounded-[26px] surface-card-3d border border-slate-200/90 dark:border-white/10 p-4 sm:p-6 space-y-5 transition-all">
      {/* Top Header & Day Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#141517] dark:bg-[#bce8c2] flex items-center justify-center text-[#bce8c2] dark:text-[#141517] shadow-2xs shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-[#141517] dark:text-white">
                {isAr ? 'روضة التدبر والحديث النبوي' : 'Daily Tadabbur & Sunnah'}
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#bce8c2] text-[#141517] font-black border border-[#1eb814]/30">
                {isAr ? 'محقق وموثق' : 'Verified'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5 font-bold">
              {currentItem.dayTitleAr}
            </p>
          </div>
        </div>

        {/* Day Navigator */}
        <div className="flex items-center gap-1 bg-[#141517] dark:bg-white/10 p-1 rounded-2xl border border-[#141517] dark:border-white/15">
          <button
            type="button"
            onClick={handlePrevDay}
            title={isAr ? 'اليوم السابق' : 'Previous Day'}
            className="p-1.5 rounded-xl hover:bg-white/15 text-[#bce8c2] transition-colors cursor-pointer active:scale-90"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-xl bg-[#bce8c2] text-[#141517]">
            {isAr ? `اليوم #${currentItem.dayNumber}` : `Day #${currentItem.dayNumber}`}
          </span>

          <button
            type="button"
            onClick={handleNextDay}
            title={isAr ? 'اليوم التالي' : 'Next Day'}
            className="p-1.5 rounded-xl hover:bg-white/15 text-[#bce8c2] transition-colors cursor-pointer active:scale-90"
          >
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary Switcher Tabs: Quran (Tafsir Ibn Kathir) vs Hadith (Sahih Sunnah) */}
      <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            setActiveTab('quran');
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-[0.98] ${
            activeTab === 'quran'
              ? 'bg-[#141517] text-[#bce8c2] dark:bg-[#bce8c2] dark:text-[#141517] shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-[#141517] dark:hover:text-white'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>{isAr ? 'الآية وتفسير ابن كثير' : 'Ayah & Tafsir Ibn Kathir'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            setActiveTab('hadith');
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-[0.98] ${
            activeTab === 'hadith'
              ? 'bg-[#141517] text-[#fde6d8] dark:bg-[#fde6d8] dark:text-[#141517] shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-[#141517] dark:hover:text-white'
          }`}
        >
          <Scroll className="w-4 h-4" />
          <span>{isAr ? 'الحديث الشريف وشرحه' : 'Sahih Hadith & Sharh'}</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'quran' ? (
          <motion.div
            key={`quran-${currentItem.dayNumber}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Surah Header Pill & Badges */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-[#141517] dark:text-white">
                  {quran.surahName}
                </span>
                <span className="font-mono text-xs font-black text-[#141517] bg-[#e2defc] px-2.5 py-0.5 rounded-full border border-[#5448e8]/20">
                  {quran.ayahRange}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#fde6d8] text-[#141517] font-black border border-[#ff5500]/20">
                  {quran.revelationType}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <QuranAyahAudioPlayer
                  surahNumber={quran.surahNumber}
                  ayahRange={quran.ayahRange}
                  surahName={quran.surahName}
                  variant="compact"
                />

                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  title={isAr ? 'حفظ في المفضلة' : 'Bookmark'}
                  className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    isBookmarked
                      ? 'bg-[#fde6d8] text-[#141517] border-[#ff5500]/30 shadow-2xs'
                      : 'bg-slate-100 dark:bg-white/10 text-[#141517] dark:text-zinc-200 border-slate-200/80 dark:border-white/10 hover:bg-[#fde6d8]/60'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  title={isAr ? 'نسخ الآية والتفسير' : 'Copy'}
                  className="p-2 rounded-xl bg-[#d4f5dc] hover:bg-[#bce8c2] text-[#141517] border border-[#1eb814]/25 transition-all active:scale-95 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-[#1eb814]" /> : <Copy className="w-4 h-4" />}
                </button>

                {onOpenModal && (
                  <button
                    type="button"
                    onClick={() => onOpenModal(currentItem, 'quran')}
                    title={isAr ? 'قراءة موسعة' : 'Expand'}
                    className="p-2 rounded-xl bg-[#e2defc] hover:brightness-95 text-[#141517] border border-[#5448e8]/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Sacred Quran Text Box (Soft Amber/Mint Illuminated Bento with Amiri Font & .tashkeel-text) */}
            <div className="relative p-6 sm:p-8 rounded-[26px] bg-[#fde6d8]/35 dark:bg-black/40 border border-[#fde6d8] dark:border-[#fde6d8]/25 shadow-xs">
              <IslamicRubElHizb className="absolute top-3.5 start-3.5 w-3.5 h-3.5 text-[#ff5500]/50 dark:text-[#fde6d8]/50" />
              <IslamicRubElHizb className="absolute top-3.5 end-3.5 w-3.5 h-3.5 text-[#ff5500]/50 dark:text-[#fde6d8]/50" />
              <p
                dir="rtl"
                lang="ar"
                className="tashkeel-text leading-[2.2] text-xl sm:text-2xl md:text-3xl text-center font-quran text-[#141517] dark:text-[#fde6d8] font-normal px-2 sm:px-6 select-text"
              >
                {quran.arabicText}
              </p>
              <IslamicRubElHizb className="absolute bottom-3.5 start-3.5 w-3.5 h-3.5 text-[#ff5500]/50 dark:text-[#fde6d8]/50" />
              <IslamicRubElHizb className="absolute bottom-3.5 end-3.5 w-3.5 h-3.5 text-[#ff5500]/50 dark:text-[#fde6d8]/50" />
            </div>

            {/* Detail Section Selector Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setExpandedSection('tafsir');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer active:scale-95 ${
                  expandedSection === 'tafsir'
                    ? 'bg-[#141517] text-[#bce8c2] dark:bg-[#bce8c2] dark:text-[#141517] shadow-xs'
                    : 'bg-[#d4f5dc]/50 dark:bg-white/5 text-[#141517] dark:text-zinc-200 border border-[#bce8c2] dark:border-white/10'
                }`}
              >
                📖 {isAr ? 'تفسير ابن كثير' : 'Tafsir Ibn Kathir'}
              </button>

              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setExpandedSection('meanings');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer active:scale-95 ${
                  expandedSection === 'meanings'
                    ? 'bg-[#141517] text-[#e2defc] dark:bg-[#e2defc] dark:text-[#141517] shadow-xs'
                    : 'bg-[#e2defc]/50 dark:bg-white/5 text-[#141517] dark:text-zinc-200 border border-[#e2defc] dark:border-white/10'
                }`}
              >
                🔍 {isAr ? `معاني الكلمات (${quran.wordMeanings.length})` : 'Word Meanings'}
              </button>

              {quran.asbabNuzul && (
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setExpandedSection('asbab');
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer active:scale-95 ${
                    expandedSection === 'asbab'
                      ? 'bg-[#141517] text-[#fde6d8] dark:bg-[#fde6d8] dark:text-[#141517] shadow-xs'
                      : 'bg-[#fde6d8]/50 dark:bg-white/5 text-[#141517] dark:text-zinc-200 border border-[#fde6d8] dark:border-white/10'
                  }`}
                >
                  📜 {isAr ? 'سبب النزول' : 'Asbab al-Nuzul'}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setExpandedSection('takeaways');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer active:scale-95 ${
                  expandedSection === 'takeaways'
                    ? 'bg-[#141517] text-[#bce8c2] dark:bg-[#bce8c2] dark:text-[#141517] shadow-xs'
                    : 'bg-[#d4f5dc]/50 dark:bg-white/5 text-[#141517] dark:text-zinc-200 border border-[#bce8c2] dark:border-white/10'
                }`}
              >
                🌿 {isAr ? 'هدايات وثمار' : 'Key Takeaways'}
              </button>
            </div>

            {/* Expanded Content Bento Box */}
            <div className="p-4 sm:p-5 rounded-[26px] bg-[#d4f5dc]/30 dark:bg-white/[0.04] border border-[#bce8c2] dark:border-white/10 text-xs leading-relaxed shadow-2xs">
              {expandedSection === 'tafsir' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[#141517] dark:text-[#bce8c2] font-black text-xs">
                    <span>📖</span>
                    <span>{isAr ? 'خلاصة تفسير القرآن العظيم للحافظ ابن كثير رحمه الله:' : 'Summary from Tafsir Ibn Kathir:'}</span>
                  </div>
                  <p className="text-[#141517] dark:text-zinc-100 leading-relaxed font-sans font-medium text-xs sm:text-sm">
                    {quran.tafsirIbnKathir}
                  </p>
                </div>
              )}

              {expandedSection === 'meanings' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[#141517] dark:text-[#e2defc] font-black text-xs mb-2">
                    <span>🔍</span>
                    <span>{isAr ? 'بيان المفردات والمعاني اللغوية الدقيقة:' : 'Vocabulary Meanings:'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {quran.wordMeanings.map((wm, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white dark:bg-[#141517] border border-[#e2defc] dark:border-white/10 shadow-2xs"
                      >
                        <span
                          dir="rtl"
                          lang="ar"
                          className="tashkeel-text leading-[2.2] font-bold text-[#141517] dark:text-[#bce8c2] block font-quran text-base"
                        >
                          {wm.word}
                        </span>
                        <span className="text-xs text-slate-700 dark:text-zinc-300 mt-0.5 block font-medium">
                          {wm.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expandedSection === 'asbab' && quran.asbabNuzul && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[#141517] dark:text-[#fde6d8] font-black text-xs">
                    <span>📜</span>
                    <span>{isAr ? 'سياق الآيات وأسباب النزول المعتمدة والصحيحة:' : 'Occasions of Revelation:'}</span>
                  </div>
                  <p className="text-[#141517] dark:text-zinc-100 leading-relaxed text-xs sm:text-sm font-medium">
                    {quran.asbabNuzul}
                  </p>
                </div>
              )}

              {expandedSection === 'takeaways' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[#141517] dark:text-[#bce8c2] font-black text-xs mb-1">
                    <span>🌿</span>
                    <span>{isAr ? 'كيف تعمل بهذه الآيات في يومك؟' : 'Daily Practical Action:'}</span>
                  </div>
                  <ul className="space-y-2">
                    {quran.practicalTakeaways.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[#141517] dark:text-zinc-200 text-xs sm:text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#1eb814] shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reference Citation Footer */}
              <div className="pt-3 mt-3 border-t border-[#bce8c2]/60 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400 font-mono font-bold">
                <span className="truncate">📚 {quran.referenceCitation}</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`hadith-${currentItem.dayNumber}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Hadith Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[#141517] dark:text-[#fde6d8]">
                  {hadith.title}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#bce8c2] text-[#141517] font-mono font-black border border-[#1eb814]/30">
                  {hadith.sourceBook} ({hadith.hadithNumber})
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  title={isAr ? 'حفظ في المفضلة' : 'Bookmark'}
                  className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    isBookmarked
                      ? 'bg-[#fde6d8] text-[#141517] border-[#ff5500]/30'
                      : 'bg-slate-100 dark:bg-white/10 text-[#141517] dark:text-zinc-300 border-slate-200 dark:border-white/10'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  title={isAr ? 'نسخ الحديث والشرح' : 'Copy'}
                  className="p-2 rounded-xl bg-[#d4f5dc] hover:bg-[#bce8c2] text-[#141517] border border-[#1eb814]/25 transition-all active:scale-95 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#1eb814]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {onOpenModal && (
                  <button
                    type="button"
                    onClick={() => onOpenModal(currentItem, 'hadith')}
                    title={isAr ? 'قراءة موسعة' : 'Expand'}
                    className="p-2 rounded-xl bg-[#e2defc] hover:brightness-95 text-[#141517] border border-[#5448e8]/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sacred Hadith Matn Box with Amiri Font & .tashkeel-text */}
            <div className="p-6 sm:p-8 rounded-[26px] bg-[#d4f5dc]/40 dark:bg-black/40 border border-[#bce8c2] dark:border-[#bce8c2]/25 shadow-xs space-y-3">
              <span className="text-xs text-[#141517] dark:text-[#bce8c2] font-bold block">
                عن {hadith.narrator} رضي الله عنه:
              </span>
              <p
                dir="rtl"
                lang="ar"
                className="tashkeel-text leading-[2.2] text-xl sm:text-2xl md:text-3xl text-center font-quran text-[#141517] dark:text-[#d4f5dc] font-normal px-2 sm:px-6 select-text"
              >
                «{hadith.matn}»
              </p>
            </div>

            {/* Hadith Explanation & Practical Takeaways */}
            <div className="p-4 sm:p-5 rounded-[26px] bg-[#fde6d8]/35 dark:bg-white/[0.04] border border-[#fde6d8] dark:border-white/10 space-y-3.5 text-xs leading-relaxed shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[#141517] dark:text-[#fde6d8] font-black text-xs">
                  <span>📖</span>
                  <span>{isAr ? 'شرح الحديث النبوي وفوائده العقدية والسلوكية:' : 'Hadith Explanation:'}</span>
                </div>
                <p className="text-[#141517] dark:text-slate-200 leading-relaxed text-xs sm:text-sm font-medium">
                  {hadith.sharhSummary}
                </p>
              </div>

              {/* Practical Action Takeaways */}
              <div className="pt-3 border-t border-[#fde6d8] dark:border-white/10 space-y-2">
                <div className="flex items-center gap-1.5 text-[#141517] dark:text-[#bce8c2] font-black text-xs">
                  <span>🌿</span>
                  <span>{isAr ? 'وصية اليوم النبوية والتطبيق العملي:' : 'Daily Practical Actions:'}</span>
                </div>
                <ul className="space-y-1.5">
                  {hadith.practicalTakeaways.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[#141517] dark:text-slate-200 text-xs sm:text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#1eb814] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Citation Footer */}
              <div className="pt-2.5 border-t border-[#fde6d8] dark:border-white/10 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                <span className="truncate">📚 {hadith.referenceCitation}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Full Sanctuary Reader CTA Button */}
      {onOpenModal && (
        <button
          type="button"
          onClick={() => onOpenModal(currentItem, activeTab)}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#141517] hover:bg-zinc-900 dark:bg-[#bce8c2] dark:hover:bg-[#d4f5dc] text-[#bce8c2] dark:text-[#141517] font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-xs"
        >
          <span>{isAr ? 'فتح قارئ التدبر والمصحف الكامل' : 'Open Immersive Tadabbur Reader'}</span>
          <span>{isAr ? '←' : '→'}</span>
        </button>
      )}
    </div>
  );
};

