import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Scroll,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Share2,
  Bookmark,
  Sun,
  Moon,
  Feather,
  CheckCircle2,
} from 'lucide-react';
import {
  getDailyTadabburItem,
  type DailyTadabburItem,
} from '../../data/dailyTadabburData';
import { QuranAyahAudioPlayer } from '../spiritual/QuranAyahAudioPlayer';
import { IslamicRubElHizb } from '../common/IslamicRubElHizb';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface DailyTadabburModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: DailyTadabburItem;
  initialTab?: 'quran' | 'hadith';
  onRewardToast?: (msg: string) => void;
}

type ReaderTheme = 'default' | 'sepia' | 'dark';
type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export const DailyTadabburModal: React.FC<DailyTadabburModalProps> = ({
  isOpen,
  onClose,
  initialItem,
  initialTab = 'quran',
  onRewardToast,
}) => {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'quran' | 'hadith'>(initialTab);
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('default');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [copied, setCopied] = useState(false);
  const [bookmarkedList, setBookmarkedList] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('midmar_tadabbur_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (initialItem) {
        // Calculate offset if initialItem is provided
        const defaultToday = getDailyTadabburItem(0);
        const diff = initialItem.dayNumber - defaultToday.dayNumber;
        setDayOffset(diff);
      }
    }
  }, [isOpen, initialTab, initialItem]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentItem = getDailyTadabburItem(dayOffset);
  const { quran, hadith } = currentItem;
  const isBookmarked = bookmarkedList.includes(currentItem.dayNumber);

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

  const handleBookmarkToggle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    let updated: number[];
    if (isBookmarked) {
      updated = bookmarkedList.filter((id) => id !== currentItem.dayNumber);
      if (onRewardToast) {
        onRewardToast(isAr ? 'تمت إزالة اليوم من المفضلة' : 'Removed from bookmarks');
      }
    } else {
      updated = [...bookmarkedList, currentItem.dayNumber];
      if (onRewardToast) {
        onRewardToast(isAr ? 'تمت إضافة اليوم لمفضلة التدبر والحديث ⭐' : 'Added to favorites');
      }
    }
    setBookmarkedList(updated);
    try {
      localStorage.setItem('midmar_tadabbur_bookmarks', JSON.stringify(updated));
    } catch (e) {
      console.warn('Bookmark storage error', e);
    }
  };

  const handleCopyText = () => {
    soundSynth.playTactileClick();
    haptic.vibrateSprintCelebration();

    let fullText = '';
    if (activeTab === 'quran') {
      const meaningsText = quran.wordMeanings
        .map((m) => `• ${m.word}: ${m.meaning}`)
        .join('\n');
      const takeawaysText = quran.practicalTakeaways.map((t) => `✔ ${t}`).join('\n');

      fullText = `【 ${quran.surahName} (${quran.ayahRange}) - ${quran.revelationType} 】\n\n«${quran.arabicText}»\n\n🔹 معاني المفردات:\n${meaningsText}\n\n📖 تفسير الحافظ ابن كثير:\n${quran.tafsirIbnKathir}\n\n${
        quran.asbabNuzul ? `📜 سبب النزول:\n${quran.asbabNuzul}\n\n` : ''
      }💡 هدايات وعمل بمقتضى الآية:\n${takeawaysText}\n\n📚 المرجع: ${quran.referenceCitation}`;
    } else {
      const takeawaysText = hadith.practicalTakeaways.map((t) => `✔ ${t}`).join('\n');
      fullText = `【 ${hadith.title} 】\n\nعن ${hadith.narrator} رضي الله عنه قال: قال رسول الله ﷺ:\n«${hadith.matn}»\n\n📚 التخريج:\n${hadith.sourceBook} (رقم ${hadith.hadithNumber}) - ${hadith.chapterName}\n\n📖 شرح الحديث المعتمد:\n${hadith.sharhSummary}\n\n💡 فوائد وعمل بالحديث:\n${takeawaysText}\n\n📚 المرجع: ${hadith.referenceCitation}`;
    }

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    if (onRewardToast) {
      onRewardToast(
        isAr ? 'تم نسخ النص الكامل مع الشرح والمراجع 📋' : 'Copied with commentary and citations!'
      );
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const shareTitle = activeTab === 'quran' ? quran.surahName : hadith.title;
    const shareText =
      activeTab === 'quran'
        ? `«${quran.arabicText}»\n\nتفسير ابن كثير: ${quran.tafsirIbnKathir}`
        : `عن ${hadith.narrator}:\n«${hadith.matn}»\n\nتخريج: ${hadith.sourceBook}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
        });
      } catch (err) {
        // User cancelled or not supported
      }
    } else {
      handleCopyText();
    }
  };

  // Determine dynamic font size classes
  const ayahFontClasses = {
    sm: 'text-base sm:text-lg leading-[2.1]',
    md: 'text-lg sm:text-xl md:text-2xl leading-[2.4]',
    lg: 'text-xl sm:text-2xl md:text-3xl leading-[2.6]',
    xl: 'text-2xl sm:text-3xl md:text-4xl leading-[2.8]',
  }[fontSize];

  const bodyFontClasses = {
    sm: 'text-xs sm:text-sm leading-relaxed',
    md: 'text-sm sm:text-base leading-relaxed',
    lg: 'text-base sm:text-lg leading-relaxed',
    xl: 'text-lg sm:text-xl leading-relaxed',
  }[fontSize];

  // Theme container classes
  const themeClasses = {
    default:
      'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border-slate-200 dark:border-zinc-800',
    sepia:
      'bg-[#fbf7ee] text-[#2c2214] border-[#e8ddc9]',
    dark:
      'bg-zinc-950 text-zinc-100 border-zinc-800',
  }[readerTheme];

  const cardSurfaceClasses = {
    default: 'bg-slate-50/70 dark:bg-zinc-800/50 border-slate-200/80 dark:border-zinc-700/60',
    sepia: 'bg-[#f4edd9] border-[#e2d5bd]',
    dark: 'bg-zinc-900 border-zinc-800',
  }[readerTheme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-colors ${themeClasses}`}
      >
        {/* ============================================================ */}
        {/* MODAL HEADER & CONTROLS                                      */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 border-inherit shrink-0">
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {isAr ? 'روضة التدبر والحديث النبوي الشريف' : 'Daily Quran & Hadith Sanctuary'}
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/40">
                  {isAr ? 'مصادر أصلية موثقة' : 'Authentic'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                {currentItem.dayTitleAr}
              </p>
            </div>
          </div>

          {/* Right Tools: Day Navigator, Reader Themes, Font Sizes, Close */}
          <div className="flex items-center gap-2">
            {/* Day Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl border border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={handlePrevDay}
                title={isAr ? 'اليوم السابق' : 'Previous Day'}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <span className="text-xs font-mono font-bold px-2">
                {isAr ? `يوم #${currentItem.dayNumber}` : `Day #${currentItem.dayNumber}`}
              </span>
              <button
                type="button"
                onClick={handleNextDay}
                title={isAr ? 'اليوم التالي' : 'Next Day'}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Font Size Adjuster */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl border border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setFontSize('sm')}
                className={`px-2 py-1 text-xs rounded-xl font-bold cursor-pointer transition-all ${
                  fontSize === 'sm' ? 'bg-white dark:bg-zinc-900 shadow-xs' : 'opacity-60'
                }`}
                title="حجم خط صغير"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize('md')}
                className={`px-2 py-1 text-xs rounded-xl font-bold cursor-pointer transition-all ${
                  fontSize === 'md' ? 'bg-white dark:bg-zinc-900 shadow-xs' : 'opacity-60'
                }`}
                title="حجم خط متوسط"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('lg')}
                className={`px-2 py-1 text-xs rounded-xl font-bold cursor-pointer transition-all ${
                  fontSize === 'lg' ? 'bg-white dark:bg-zinc-900 shadow-xs' : 'opacity-60'
                }`}
                title="حجم خط كبير"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize('xl')}
                className={`px-2 py-1 text-xs rounded-xl font-bold cursor-pointer transition-all ${
                  fontSize === 'xl' ? 'bg-white dark:bg-zinc-900 shadow-xs' : 'opacity-60'
                }`}
                title="حجم خط ضخم"
              >
                A++
              </button>
            </div>

            {/* Theme switcher (Default / Sepia / Dark) */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl border border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setReaderTheme('default')}
                className={`p-1.5 rounded-xl cursor-pointer transition-all ${
                  readerTheme === 'default' ? 'bg-white dark:bg-zinc-900 shadow-xs' : 'opacity-60'
                }`}
                title={isAr ? 'المظهر التلقائي' : 'Default Theme'}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              </button>
              <button
                type="button"
                onClick={() => setReaderTheme('sepia')}
                className={`p-1.5 rounded-xl cursor-pointer transition-all ${
                  readerTheme === 'sepia' ? 'bg-amber-100 text-amber-900 shadow-xs' : 'opacity-60'
                }`}
                title={isAr ? 'ورق المصحف الدافئ (Sepia)' : 'Sepia Paper'}
              >
                <Feather className="w-3.5 h-3.5 text-amber-800" />
              </button>
              <button
                type="button"
                onClick={() => setReaderTheme('dark')}
                className={`p-1.5 rounded-xl cursor-pointer transition-all ${
                  readerTheme === 'dark' ? 'bg-zinc-900 text-zinc-100 shadow-xs' : 'opacity-60'
                }`}
                title={isAr ? 'المظهر الليلي الهادئ' : 'Night Velvet'}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PRIMARY TAB SWITCHER                                         */}
        {/* ============================================================ */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-inherit bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-zinc-800/80 border border-slate-300/50 dark:border-zinc-700/50">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setActiveTab('quran');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'quran'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/25'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <BookMarked className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'الآية الكريمة وتفسير ابن كثير' : 'Ayah & Tafsir Ibn Kathir'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setActiveTab('hadith');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'hadith'
                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-400 shadow-md ring-1 ring-teal-500/25'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Scroll className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'الحديث الشريف وصحيح السنة' : 'Sahih Hadith & Sunnah'}</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SCROLLABLE MAIN CONTENT BODY                                 */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'quran' ? (
              <motion.div
                key={`quran-body-${currentItem.dayNumber}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Surah Header Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300">
                      {quran.surahName}
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/40 dark:border-emerald-700/40">
                      {quran.ayahRange}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-bold border border-amber-300/40 dark:border-amber-700/40">
                      سورة {quran.revelationType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <QuranAyahAudioPlayer
                      surahNumber={quran.surahNumber}
                      ayahRange={quran.ayahRange}
                      surahName={quran.surahName}
                      variant="compact"
                    />
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono hidden sm:inline">
                      ترتيب السورة: #{quran.surahNumber}
                    </span>
                  </div>
                </div>

                {/* Sacred Text with Full Tashkeel and Illuminated Frame */}
                <div className="relative p-6 sm:p-8 rounded-2xl bg-amber-50/30 dark:bg-zinc-950/80 border border-amber-300/60 dark:border-amber-500/30 shadow-2xs">
                  <IslamicRubElHizb className="absolute top-3.5 start-3.5 w-4 h-4 text-amber-500/50" />
                  <IslamicRubElHizb className="absolute top-3.5 end-3.5 w-4 h-4 text-amber-500/50" />
                  <p
                    className={`${ayahFontClasses} text-center font-quran text-slate-950 dark:text-amber-100 font-normal px-2 sm:px-6 select-text`}
                  >
                    {quran.arabicText}
                  </p>
                  <IslamicRubElHizb className="absolute bottom-3.5 start-3.5 w-4 h-4 text-amber-500/50" />
                  <IslamicRubElHizb className="absolute bottom-3.5 end-3.5 w-4 h-4 text-amber-500/50" />
                </div>

                {/* Section 1: معاني المفردات والكلمات */}
                {quran.wordMeanings.length > 0 && (
                  <div className={`p-5 rounded-2xl border space-y-3 ${cardSurfaceClasses}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-4 rounded-full bg-emerald-500" />
                      <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-zinc-50">
                        {isAr ? 'معاني الكلمات والمفردات الغريبة' : 'Vocabulary & Word Meanings'}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {quran.wordMeanings.map((wm, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white/90 dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 flex items-start gap-2.5 shadow-2xs"
                        >
                          <span className="font-quran font-bold text-base text-emerald-800 dark:text-emerald-400 shrink-0">
                            {wm.word}:
                          </span>
                          <span className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 font-sans font-medium leading-relaxed">
                            {wm.meaning}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: تفسير الحافظ ابن كثير (رحمه الله) */}
                <div className={`p-5 rounded-2xl border space-y-3 ${cardSurfaceClasses}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-4 rounded-full bg-amber-500" />
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                        {isAr ? 'تفسير الحافظ ابن كثير (تفسير القرآن العظيم)' : 'Tafsir Ibn Kathir'}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                      مرجع معتمد
                    </span>
                  </div>
                  <div className={`text-slate-800 dark:text-zinc-200 font-sans leading-relaxed space-y-3 ${bodyFontClasses}`}>
                    {quran.tafsirIbnKathir.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx} className="leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Section 3: أسباب النزول (إن وجدت) */}
                {quran.asbabNuzul && (
                  <div className={`p-5 rounded-2xl border space-y-3 ${cardSurfaceClasses}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-4 rounded-full bg-indigo-500" />
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                        {isAr ? 'أسباب النزول المعتمدة والصحيحة' : 'Context & Asbab al-Nuzul'}
                      </h3>
                    </div>
                    <p className={`text-slate-700 dark:text-zinc-300 font-sans leading-relaxed ${bodyFontClasses}`}>
                      {quran.asbabNuzul}
                    </p>
                  </div>
                )}

                {/* Section 4: ثمرات وتطبيقات عملية بمقتضى الآية */}
                {quran.practicalTakeaways.length > 0 && (
                  <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-4 rounded-full bg-emerald-600" />
                      <h3 className="text-sm sm:text-base font-black text-emerald-900 dark:text-emerald-200">
                        {isAr ? 'فوائد ولطائف وعمل بمقتضى الآيات' : 'Actionable Spiritual Takeaways'}
                      </h3>
                    </div>
                    <ul className="space-y-2 pt-1">
                      {quran.practicalTakeaways.map((takeaway, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-zinc-200 font-sans">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer Citation */}
                <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-zinc-800/40 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                  <span>📚 {quran.referenceCitation}</span>
                  <span className="font-mono">اليوم #{currentItem.dayNumber} من مسيرة التدبر</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`hadith-body-${currentItem.dayNumber}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Hadith Header Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/20">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base sm:text-lg font-black text-teal-800 dark:text-teal-300">
                      {hadith.title}
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300/40 dark:border-teal-700/40">
                      {hadith.sourceBook}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                    حديث رقم: #{hadith.hadithNumber}
                  </span>
                </div>

                {/* Hadith Matn with Framing */}
                <div className="relative p-6 sm:p-8 rounded-2xl bg-teal-50/30 dark:bg-zinc-950/80 border border-teal-300/60 dark:border-teal-500/30 shadow-2xs space-y-3">
                  <div className="text-xs sm:text-sm font-bold text-teal-900 dark:text-teal-300">
                    عن {hadith.narrator} رضي الله عنه قال: قال رسول الله ﷺ:
                  </div>
                  <p
                    className={`${ayahFontClasses} text-center font-quran text-slate-950 dark:text-teal-50 font-normal px-2 sm:px-6 select-text`}
                  >
                    «{hadith.matn}»
                  </p>
                  <div className="text-xs text-center font-mono text-slate-600 dark:text-zinc-400 pt-2 border-t border-teal-500/20 font-medium">
                    {hadith.sourceBook} ({hadith.hadithNumber}) — {hadith.chapterName}
                  </div>
                </div>

                {/* Section 1: شرح الحديث الشريف المعتمد */}
                <div className={`p-5 rounded-2xl border space-y-3 ${cardSurfaceClasses}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-4 rounded-full bg-teal-500" />
                      <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-zinc-50">
                        {isAr ? 'شرح الحديث النبوي الشريف' : 'Hadith Commentary & Analysis'}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                      فتح الباري / شرح النووي
                    </span>
                  </div>
                  <div className={`text-slate-800 dark:text-zinc-200 font-sans leading-relaxed space-y-3 ${bodyFontClasses}`}>
                    {hadith.sharhSummary.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx} className="leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Section 2: هدايات نبوية وتطبيق عملي */}
                {hadith.practicalTakeaways.length > 0 && (
                  <div className="p-5 rounded-2xl border border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-4 rounded-full bg-teal-600" />
                      <h3 className="text-sm sm:text-base font-black text-teal-900 dark:text-teal-200">
                        {isAr ? 'هدايات الحديث والعمل به في يومك' : 'Prophetic Guidance in Daily Life'}
                      </h3>
                    </div>
                    <ul className="space-y-2 pt-1">
                      {hadith.practicalTakeaways.map((takeaway, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-zinc-200 font-sans">
                          <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer Citation */}
                <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-zinc-800/40 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                  <span>📚 {hadith.referenceCitation}</span>
                  <span className="font-mono">سنة صحيحة معتمدة</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ============================================================ */}
        {/* MODAL FOOTER ACTIONS                                         */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3 border-inherit bg-slate-50/60 dark:bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBookmarkToggle}
              className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 shadow-2xs'
                  : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              <span>{isBookmarked ? (isAr ? 'في المفضلة ⭐' : 'Bookmarked') : (isAr ? 'حفظ في المفضلة' : 'Bookmark')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="py-2 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ النص والشرح' : 'Copy Text')}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="py-2 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'مشاركة' : 'Share'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            {isAr ? 'تم التدبر والحمد لله' : 'Done & Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
