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
      onToast(isAr ? 'تم نسخ النص القرآني والتفسير بنجاح 📋' : 'Tadabbur copied to clipboard!');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleBookmarkToggle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const next = !isBookmarked;
    setIsBookmarked(next);
    if (onToast) {
      onToast(next ? (isAr ? 'تم الحفظ في مفضلة التدبر ⭐' : 'Saved to favorites') : (isAr ? 'تمت الإزالة من المفضلة' : 'Removed from favorites'));
    }
  };

  return (
    <div className="w-full rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200/90 dark:border-white/[0.08] shadow-sm p-4 sm:p-7 space-y-5 transition-all">
      {/* Top Header & Day Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                {isAr ? 'روضة التدبر والحديث النبوي' : 'Daily Tadabbur & Sunnah'}
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
                {isAr ? 'محقق وموثق' : 'Verified'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
              {currentItem.dayTitleAr}
            </p>
          </div>
        </div>

        {/* Day Navigator */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] p-1 rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={handlePrevDay}
            title={isAr ? 'اليوم السابق' : 'Previous Day'}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <span className="text-xs font-mono font-bold px-2.5 text-slate-900 dark:text-zinc-100">
            {isAr ? `اليوم #${currentItem.dayNumber}` : `Day #${currentItem.dayNumber}`}
          </span>

          <button
            type="button"
            onClick={handleNextDay}
            title={isAr ? 'اليوم التالي' : 'Next Day'}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary Switcher Tabs: Quran (Tafsir Ibn Kathir) vs Hadith (Sahih Sunnah) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            setActiveTab('quran');
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
            activeTab === 'quran'
              ? 'bg-white dark:bg-[#181A24] text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <BookMarked className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{isAr ? 'الآية وتفسير ابن كثير' : 'Ayah & Tafsir Ibn Kathir'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            setActiveTab('hadith');
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
            activeTab === 'hadith'
              ? 'bg-white dark:bg-[#181A24] text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Scroll className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-950 dark:text-white">
                  {quran.surahName}
                </span>
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] px-2.5 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08]">
                  {quran.ayahRange}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/40">
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
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isBookmarked
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 hover:text-slate-900 dark:text-zinc-300 border-slate-200/80 dark:border-white/[0.08]'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  title={isAr ? 'نسخ الآية والتفسير' : 'Copy'}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 hover:text-slate-900 dark:text-zinc-300 border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>

                {onOpenModal && (
                  <button
                    type="button"
                    onClick={() => onOpenModal(currentItem, 'quran')}
                    title={isAr ? 'قراءة موسعة' : 'Expand'}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 hover:text-slate-900 dark:text-zinc-300 border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Sacred Quran Text Box (Illuminated Border with Amiri Font) */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-amber-500/[0.03] dark:bg-black/40 border border-amber-400/30 dark:border-amber-500/20 shadow-xs">
              <IslamicRubElHizb className="absolute top-3 start-3 w-3.5 h-3.5 text-amber-500/50" />
              <IslamicRubElHizb className="absolute top-3 end-3 w-3.5 h-3.5 text-amber-500/50" />
              <p className="text-xl sm:text-2xl md:text-3xl leading-[2.5] text-center font-quran text-slate-950 dark:text-amber-100 font-normal px-2 sm:px-6 select-text">
                {quran.arabicText}
              </p>
              <IslamicRubElHizb className="absolute bottom-3 start-3 w-3.5 h-3.5 text-amber-500/50" />
              <IslamicRubElHizb className="absolute bottom-3 end-3 w-3.5 h-3.5 text-amber-500/50" />
            </div>

            {/* Detail Section Selector Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              <button
                type="button"
                onClick={() => setExpandedSection('tafsir')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  expandedSection === 'tafsir'
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200/90 dark:border-zinc-700'
                }`}
              >
                📖 {isAr ? 'تفسير ابن كثير' : 'Tafsir Ibn Kathir'}
              </button>

              <button
                type="button"
                onClick={() => setExpandedSection('meanings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  expandedSection === 'meanings'
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200/90 dark:border-zinc-700'
                }`}
              >
                🔍 {isAr ? `معاني الكلمات (${quran.wordMeanings.length})` : 'Word Meanings'}
              </button>

              {quran.asbabNuzul && (
                <button
                  type="button"
                  onClick={() => setExpandedSection('asbab')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    expandedSection === 'asbab'
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200/90 dark:border-zinc-700'
                  }`}
                >
                  📜 {isAr ? 'سبب النزول' : 'Asbab al-Nuzul'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setExpandedSection('takeaways')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  expandedSection === 'takeaways'
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200/90 dark:border-zinc-700'
                }`}
              >
                🌿 {isAr ? 'هدايات وثمار' : 'Key Takeaways'}
              </button>
            </div>

            {/* Expanded Content Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/90 dark:border-zinc-700/80 text-xs leading-relaxed shadow-2xs">
              {expandedSection === 'tafsir' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold text-xs">
                    <span>📖</span>
                    <span>{isAr ? 'خلاصة تفسير القرآن العظيم للحافظ ابن كثير رحمه الله:' : 'Summary from Tafsir Ibn Kathir:'}</span>
                  </div>
                  <p className="text-slate-800 dark:text-zinc-100 leading-relaxed font-sans font-medium text-xs sm:text-sm">
                    {quran.tafsirIbnKathir}
                  </p>
                </div>
              )}

              {expandedSection === 'meanings' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold text-xs mb-2">
                    <span>🔍</span>
                    <span>{isAr ? 'بيان المفردات والمعاني اللغوية الدقيقة:' : 'Vocabulary Meanings:'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {quran.wordMeanings.map((wm, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs"
                      >
                        <span className="font-bold text-emerald-800 dark:text-emerald-400 block font-quran text-base">
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
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold text-xs">
                    <span>📜</span>
                    <span>{isAr ? 'سياق الآيات وأسباب النزول المعتمدة والصحيحة:' : 'Occasions of Revelation:'}</span>
                  </div>
                  <p className="text-slate-800 dark:text-zinc-100 leading-relaxed text-xs sm:text-sm font-medium">
                    {quran.asbabNuzul}
                  </p>
                </div>
              )}

              {expandedSection === 'takeaways' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold text-xs mb-1">
                    <span>🌿</span>
                    <span>{isAr ? 'كيف تعمل بهذه الآيات في يومك؟' : 'Daily Practical Action:'}</span>
                  </div>
                  <ul className="space-y-2">
                    {quran.practicalTakeaways.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-800 dark:text-zinc-200 text-xs sm:text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reference Citation Footer */}
              <div className="pt-3 mt-3 border-t border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono font-medium">
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-teal-900 dark:text-teal-300">
                  {hadith.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-mono font-bold border border-teal-200 dark:border-teal-800/40">
                  {hadith.sourceBook} ({hadith.hadithNumber})
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  title={isAr ? 'حفظ في المفضلة' : 'Bookmark'}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isBookmarked
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300'
                      : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 hover:text-slate-900 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  title={isAr ? 'نسخ الحديث والشرح' : 'Copy'}
                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-600 hover:text-slate-900 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {onOpenModal && (
                  <button
                    type="button"
                    onClick={() => onOpenModal(currentItem, 'hadith')}
                    title={isAr ? 'قراءة موسعة' : 'Expand'}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-600 hover:text-slate-900 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sacred Hadith Matn Box with Amiri Font */}
            <div className="p-6 sm:p-8 rounded-2xl bg-emerald-500/[0.03] dark:bg-black/40 border border-emerald-400/30 dark:border-emerald-500/20 shadow-xs space-y-3">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold block">
                عن {hadith.narrator} رضي الله عنه:
              </span>
              <p className="text-xl sm:text-2xl md:text-3xl leading-[2.5] text-center font-quran text-slate-950 dark:text-emerald-50 font-normal px-2 sm:px-6 select-text">
                «{hadith.matn}»
              </p>
            </div>

            {/* Hadith Explanation & Practical Takeaways */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] space-y-3.5 text-xs leading-relaxed shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <span>📖</span>
                  <span>{isAr ? 'شرح الحديث النبوي وفوائده العقدية والسلوكية:' : 'Hadith Explanation:'}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-xs sm:text-sm font-medium">
                  {hadith.sharhSummary}
                </p>
              </div>

              {/* Practical Action Takeaways */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <span>🌿</span>
                  <span>{isAr ? 'وصية اليوم النبوية والتطبيق العملي:' : 'Daily Practical Actions:'}</span>
                </div>
                <ul className="space-y-1.5">
                  {hadith.practicalTakeaways.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Citation Footer */}
              <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">
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
          className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
        >
          <span>{isAr ? 'فتح قارئ التدبر والمصحف الكامل' : 'Open Immersive Tadabbur Reader'}</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
};
