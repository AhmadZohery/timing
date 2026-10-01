import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  Search,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import {
  QURAN_SURAHS,
  POPULAR_WIRD_SURAHS,
  getSurahByNumber,
  getSurahByName,
  getSurahForPage,
  calculateEstimatedHasanat,
  type QuranSurahMetadata,
} from '../../data/quranSurahsData';
import type { QuranProgress, DailyLog } from '../../types';
import { db } from '../../db/db';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { getBiologicalDate, upsertDailyLog } from '../../utils/gamification';

interface FlexibleQuranTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quranProgress?: QuranProgress;
  onRewardToast?: (msg: string) => void;
  todayLog?: DailyLog;
}

export type QuranReadingMode = 'surah_ayah' | 'pages' | 'preset';

export const FlexibleQuranTrackerModal: React.FC<FlexibleQuranTrackerModalProps> = ({
  isOpen,
  onClose,
  quranProgress,
  onRewardToast,
  todayLog,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  // Determine initial state from existing progress
  const initialSurah = useMemo(() => {
    if (quranProgress?.surahNumber) {
      return getSurahByNumber(quranProgress.surahNumber) || QURAN_SURAHS[1];
    }
    if (quranProgress?.surah) {
      return getSurahByName(quranProgress.surah) || QURAN_SURAHS[1];
    }
    return QURAN_SURAHS[1]; // Surah Al-Baqarah by default
  }, [quranProgress]);

  const [activeTab, setActiveTab] = useState<QuranReadingMode>(
    quranProgress?.mode && quranProgress.mode !== 'juz' ? quranProgress.mode : 'surah_ayah'
  );

  // Tab 1: Surah & Ayah state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(initialSurah.number);
  const [startAyah, setStartAyah] = useState<number>(quranProgress?.startAyah || 1);
  const [endAyah, setEndAyah] = useState<number>(
    quranProgress?.endAyah || Math.min(initialSurah.ayahCount, 50)
  );

  // Tab 2: Pages & Bookmark state
  const [startPage, setStartPage] = useState<number>(
    quranProgress?.startPage || quranProgress?.currentPage || initialSurah.startPage
  );
  const [endPage, setEndPage] = useState<number>(
    quranProgress?.endPage || Math.min(604, (quranProgress?.currentPage || initialSurah.startPage) + 4)
  );

  // Tab 3: Preset selection
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('baqarah');

  if (!isOpen) return null;

  const currentSurah = getSurahByNumber(selectedSurahNumber) || initialSurah;

  // Filtered surahs for search
  const filteredSurahs = QURAN_SURAHS.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      s.nameAr.includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.number.toString() === q
    );
  });

  // Calculate stats for current Surah & Ayahs
  const calculatedAyahsCount = Math.max(1, endAyah - startAyah + 1);
  const estimatedPagesForAyahs = Math.max(
    1,
    Math.round((calculatedAyahsCount / Math.max(1, currentSurah.ayahCount)) * (currentSurah.endPage - currentSurah.startPage + 1))
  );

  // Calculate stats for Pages mode
  const calculatedPagesCount = Math.max(1, endPage - startPage + 1);
  const surahAtStartPage = getSurahForPage(startPage);
  const surahAtEndPage = getSurahForPage(endPage);

  // Handle Surah Selection
  const handleSelectSurah = (surah: QuranSurahMetadata) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedSurahNumber(surah.number);
    setStartAyah(1);
    setEndAyah(Math.min(surah.ayahCount, 50));
    setStartPage(surah.startPage);
    setEndPage(Math.min(surah.endPage, surah.startPage + 4));
  };

  // Quick preset definitions
  const PRESETS = [
    {
      id: 'baqarah',
      titleAr: 'سورة البقرة المباركة',
      titleEn: 'Surah Al-Baqarah',
      surahNumber: 2,
      pages: 48,
      badge: '🛡️ الأساس المبارك',
      descAr: 'قراءة سورة البقرة كاملة (48 صفحة) لدفع الشياطين وبركة الرزق.',
    },
    {
      id: 'kahf',
      titleAr: 'سورة الكهف',
      titleEn: 'Surah Al-Kahf',
      surahNumber: 18,
      pages: 12,
      badge: '✨ نور بين الجمعتين',
      descAr: 'سورة الكهف (12 صفحة) نور وعصمة من فتنة المسيح الدجال.',
    },
    {
      id: 'imran',
      titleAr: 'سورة آل عمران',
      titleEn: 'Surah Ali \'Imran',
      surahNumber: 3,
      pages: 27,
      badge: '🌿 حجة وظل يوم القيامة',
      descAr: 'سورة آل عمران (27 صفحة) ثانية الزهراوين.',
    },
    {
      id: 'daily_juz',
      titleAr: 'جزء كامل من المصحف',
      titleEn: '1 Full Daily Juz',
      surahNumber: 1,
      pages: 20,
      badge: '📖 ختمة شهرية',
      descAr: 'قراءة 20 صفحة يومياً لختم القرآن الكريم كاملاً كل شهر.',
    },
    {
      id: 'half_juz',
      titleAr: 'نصف جزء (10 صفحات)',
      titleEn: 'Half Juz (10 pages)',
      surahNumber: 1,
      pages: 10,
      badge: '🌱 ختمة متدرجة هادئة',
      descAr: '10 صفحات يومياً لختم المصحف في 60 يوماً بثبات.',
    },
    {
      id: 'mounjiyat',
      titleAr: 'السور الفاضلة (يس + الواقعة + الملك)',
      titleEn: 'Virtuous Surahs',
      surahNumber: 36,
      pages: 13,
      badge: '⭐ باقة الفضل والبركة',
      descAr: 'يس و الواقعة والملك لقضاء الحوائج والنجاة من عذاب القبر.',
    },
  ];

  // Save Progress Handler
  const handleSaveProgress = async (isBookmarkOnly: boolean = false) => {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();

    const todayStr = getBiologicalDate(true);
    let finalSurahName = currentSurah.nameAr;
    let finalSurahNumber = currentSurah.number;
    let finalStartAyah = startAyah;
    let finalEndAyah = endAyah;
    let finalStartPage = startPage;
    let finalEndPage = endPage;
    let finalPagesCount = 1;
    let rewardPoints = 15;

    if (activeTab === 'surah_ayah') {
      finalSurahName = currentSurah.nameAr;
      finalSurahNumber = currentSurah.number;
      finalPagesCount = estimatedPagesForAyahs;
      finalStartPage = currentSurah.startPage;
      finalEndPage = Math.min(currentSurah.endPage, currentSurah.startPage + finalPagesCount - 1);
      rewardPoints = Math.min(50, Math.max(10, Math.round(finalPagesCount * 1.5)));
    } else if (activeTab === 'pages') {
      finalPagesCount = calculatedPagesCount;
      finalStartPage = startPage;
      finalEndPage = endPage;
      finalSurahName = surahAtStartPage ? surahAtStartPage.nameAr : currentSurah.nameAr;
      finalSurahNumber = surahAtStartPage ? surahAtStartPage.number : currentSurah.number;
      rewardPoints = Math.min(50, Math.max(10, Math.round(finalPagesCount * 1.5)));
    } else if (activeTab === 'preset') {
      const preset = PRESETS.find((p) => p.id === selectedPresetKey) || PRESETS[0];
      const pSurah = getSurahByNumber(preset.surahNumber) || currentSurah;
      finalSurahName = preset.titleAr;
      finalSurahNumber = preset.surahNumber;
      finalPagesCount = preset.pages;
      finalStartPage = pSurah.startPage;
      finalEndPage = Math.min(604, pSurah.startPage + preset.pages - 1);
      rewardPoints = Math.min(50, Math.max(10, Math.round(finalPagesCount * 1.2)));
    }

    // Update or create quran_progress in Dexie
    if (quranProgress?.id) {
      await db.quran_progress.update(quranProgress.id, {
        surah: finalSurahName,
        surahNumber: finalSurahNumber,
        currentPage: finalEndPage,
        totalPages: 604,
        currentAyah: finalEndAyah,
        startAyah: finalStartAyah,
        endAyah: finalEndAyah,
        startPage: finalStartPage,
        endPage: finalEndPage,
        mode: activeTab,
        dailyTargetPages: finalPagesCount,
        lastUpdated: todayStr,
        history: [
          ...(quranProgress.history || []).slice(-30),
          {
            date: todayStr,
            page: finalEndPage,
            ayah: finalEndAyah,
            surah: finalSurahName,
          },
        ],
      });
    } else {
      await db.quran_progress.add({
        surah: finalSurahName,
        surahNumber: finalSurahNumber,
        currentPage: finalEndPage,
        totalPages: 604,
        currentAyah: finalEndAyah,
        startAyah: finalStartAyah,
        endAyah: finalEndAyah,
        startPage: finalStartPage,
        endPage: finalEndPage,
        mode: activeTab,
        dailyTargetPages: finalPagesCount,
        lastUpdated: todayStr,
        history: [
          {
            date: todayStr,
            page: finalEndPage,
            ayah: finalEndAyah,
            surah: finalSurahName,
          },
        ],
      });
    }

    // Update daily log if not just a bookmark
    if (!isBookmarkOnly) {
      const currentPoints = todayLog?.pointsEarned || 0;
      await upsertDailyLog(todayStr, {
        pointsEarned: currentPoints + rewardPoints,
        baqarahProgress: {
          pagesRead: finalPagesCount,
          targetPages: finalPagesCount,
          completed: true,
        },
      });

      // Update goal if exists
      const quranGoal = await db.goals.get('goal-quran');
      if (quranGoal) {
        await db.goals.update('goal-quran', {
          currentValue: Math.min(quranGoal.targetValue, (quranGoal.currentValue || 0) + finalPagesCount),
        });
      }

      const hasanat = calculateEstimatedHasanat(finalPagesCount);
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `✨ تقبّل الله تلاوتك! تم تسجيل ${finalPagesCount} ص من ${finalSurahName} (+${hasanat.toLocaleString()} حسنة مضاعفة 🤍)`
            : `✨ May Allah accept! Logged ${finalPagesCount} pages of ${finalSurahName} (+${rewardPoints} XP)`
        );
      }
    } else {
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `📌 تم حفظ علامة المصحف بنجاح: ${finalSurahName} (صفحة ${finalEndPage})`
            : `📌 Bookmark saved: ${finalSurahName} (Page ${finalEndPage})`
        );
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col h-[90dvh] sm:h-auto sm:max-h-[92dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                {isAr ? 'تخصيص ومتابعة الورد القرآني' : 'Custom Quran Wird Tracker'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'اختر سورتك، حدد الآيات أو الصفحات، وسجل قراءتك بمرونة مطلقة'
                  : 'Choose your Surah, set ayah/page range, and track with total flexibility'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (3 Flexible Modes) */}
        <div className="px-4 sm:px-5 pt-3 border-b border-slate-100 dark:border-zinc-800 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('surah_ayah');
            }}
            className={`pb-2.5 px-3 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'surah_ayah'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300'
            }`}
          >
            <span>{isAr ? '📖 بالسورة والآيات' : 'By Surah & Ayahs'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('pages');
            }}
            className={`pb-2.5 px-3 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'pages'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300'
            }`}
          >
            <span>{isAr ? '📄 بالصفحات وعلامة المصحف' : 'By Pages & Bookmark'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('preset');
            }}
            className={`pb-2.5 px-3 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'preset'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300'
            }`}
          >
            <span>{isAr ? '✨ أوراد وختمات جاهزة' : 'Preset Wirds'}</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-5 space-y-5 flex-1 min-h-0 overflow-y-auto">
          {/* TAB 1: SURAH & AYAH */}
          {activeTab === 'surah_ayah' && (
            <div className="space-y-4">
              {/* Quick Popular Surahs Carousel / Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  {isAr ? 'سور البركة والورد السريع:' : 'Quick Wird Surahs:'}
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                  {POPULAR_WIRD_SURAHS.map((num) => {
                    const s = getSurahByNumber(num);
                    if (!s) return null;
                    const isSelected = selectedSurahNumber === s.number;
                    return (
                      <button
                        key={s.number}
                        type="button"
                        onClick={() => handleSelectSurah(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700'
                        }`}
                      >
                        <span>{s.nameAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Surah Search & Select Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {isAr ? 'البحث واختيار سورة من القرآن الكريم (114 سورة):' : 'Select Surah (114 Surahs):'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'ابحث باسم السورة أو رقمها (مثلاً: الكهف، 18، يس)...' : 'Search Surah name or number...'}
                    className="w-full px-3.5 py-2.5 pe-9 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute end-3 top-3 pointer-events-none" />
                </div>

                {/* Dropdown list if searching or displaying current */}
                {searchQuery.trim().length > 0 && (
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-lg divide-y divide-slate-100 dark:divide-zinc-700">
                    {filteredSurahs.slice(0, 10).map((s) => (
                      <button
                        key={s.number}
                        type="button"
                        onClick={() => {
                          handleSelectSurah(s);
                          setSearchQuery('');
                        }}
                        className="w-full px-3 py-2 text-start flex items-center justify-between text-xs hover:bg-emerald-50 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center">
                            {s.number}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-zinc-200">
                            {s.nameAr}
                          </span>
                          <span className="text-[10px] text-slate-400">({s.revelation})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {s.ayahCount} {isAr ? 'آية' : 'ayahs'} • {isAr ? `ص ${s.startPage}` : `p.${s.startPage}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Surah Card Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-bold">
                      #{currentSurah.number}
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-emerald-950 dark:text-emerald-300">
                      {isAr ? `سورة ${currentSurah.nameAr}` : currentSurah.nameEn}
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      ({currentSurah.revelation} • {currentSurah.ayahCount} {isAr ? 'آية' : 'ayahs'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1">
                    {isAr
                      ? `الجزء ${currentSurah.juz} • من صفحة ${currentSurah.startPage} إلى ${currentSurah.endPage}`
                      : `Juz ${currentSurah.juz} • Pages ${currentSurah.startPage} - ${currentSurah.endPage}`}
                  </p>
                </div>

                <div className="text-end">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {isAr ? 'إجمالي صفحاتها' : 'Total Pages'}
                  </span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {currentSurah.endPage - currentSurah.startPage + 1} {isAr ? 'صفحة' : 'p'}
                  </span>
                </div>
              </div>

              {/* Ayah Range Inputs: من آية ... إلى آية ... */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    {isAr ? 'من آية رقم:' : 'From Ayah #:'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={currentSurah.ayahCount}
                    value={startAyah}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(currentSurah.ayahCount, parseInt(e.target.value) || 1));
                      setStartAyah(val);
                      if (val > endAyah) setEndAyah(val);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-mono font-bold text-slate-900 dark:text-zinc-100 text-center focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => setStartAyah(1)}
                      className="flex-1 py-1 rounded-lg bg-slate-200/70 dark:bg-zinc-700 text-[10px] font-bold text-slate-700 dark:text-zinc-300 hover:bg-emerald-100"
                    >
                      {isAr ? 'البداية (1)' : 'Start (1)'}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                    {isAr ? 'إلى آية رقم:' : 'To Ayah #:'}
                  </label>
                  <input
                    type="number"
                    min={startAyah}
                    max={currentSurah.ayahCount}
                    value={endAyah}
                    onChange={(e) => {
                      const val = Math.max(startAyah, Math.min(currentSurah.ayahCount, parseInt(e.target.value) || startAyah));
                      setEndAyah(val);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-mono font-bold text-slate-900 dark:text-zinc-100 text-center focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => setEndAyah(currentSurah.ayahCount)}
                      className="flex-1 py-1 rounded-lg bg-slate-200/70 dark:bg-zinc-700 text-[10px] font-bold text-slate-700 dark:text-zinc-300 hover:bg-emerald-100"
                    >
                      {isAr ? `نهاية السورة (${currentSurah.ayahCount})` : `End (${currentSurah.ayahCount})`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Calculation Card */}
              <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block">
                    {isAr
                      ? `القراءة المحددة: ${calculatedAyahsCount} آية من سورة ${currentSurah.nameAr}`
                      : `Selected: ${calculatedAyahsCount} ayahs of ${currentSurah.nameEn}`}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {isAr
                      ? `تعادل تقريباً ${estimatedPagesForAyahs} صفحة • +${calculateEstimatedHasanat(estimatedPagesForAyahs).toLocaleString()} حسنة مضاعفة 🤍`
                      : `Approx ${estimatedPagesForAyahs} pages • +${calculateEstimatedHasanat(estimatedPagesForAyahs).toLocaleString()} Hasanat 🤍`}
                  </span>
                </div>
                <span className="text-xl">🌿</span>
              </div>
            </div>
          )}

          {/* TAB 2: BY PAGES & BOOKMARK */}
          {activeTab === 'pages' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                  {isAr ? 'تحديد نطاق القراءة بالصفحات (مصحف المدينة 604 صفحة):' : 'Reading Range by Pages (Medina Mushaf 604p):'}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
                  {isAr
                    ? 'حدد الصفحة التي بدأت منها والصفحة التي وصلت إليها اليوم لتسجيل التقدم فوراً.'
                    : 'Specify start page and end page to log your progress.'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                      {isAr ? 'من صفحة:' : 'From Page:'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={604}
                      value={startPage}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(604, parseInt(e.target.value) || 1));
                        setStartPage(val);
                        if (val > endPage) setEndPage(val);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-mono font-bold text-slate-900 dark:text-zinc-100 text-center"
                    />
                    {surahAtStartPage && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 text-center font-bold">
                        سورة {surahAtStartPage.nameAr}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                      {isAr ? 'إلى صفحة:' : 'To Page:'}
                    </label>
                    <input
                      type="number"
                      min={startPage}
                      max={604}
                      value={endPage}
                      onChange={(e) => {
                        const val = Math.max(startPage, Math.min(604, parseInt(e.target.value) || startPage));
                        setEndPage(val);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-mono font-bold text-slate-900 dark:text-zinc-100 text-center"
                    />
                    {surahAtEndPage && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 text-center font-bold">
                        سورة {surahAtEndPage.nameAr}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Jump Increments */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1.5">
                  {isAr ? 'أو إضافة سريعة لصفحات اليوم:' : 'Or Quick Add Pages for Today:'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { count: 1, label: '+1 ص' },
                    { count: 2, label: '+2 ص' },
                    { count: 5, label: '+5 ص (حزب)' },
                    { count: 20, label: '+20 ص (جزء)' },
                  ].map((btn) => (
                    <button
                      key={btn.count}
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setEndPage(Math.min(604, endPage + btn.count));
                      }}
                      className="py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-zinc-200 hover:text-emerald-700 text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 block">
                    {isAr
                      ? `الإجمالي: ${calculatedPagesCount} صفحة مقروءة اليوم`
                      : `Total: ${calculatedPagesCount} pages read today`}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {isAr
                      ? `من ص ${startPage} (${surahAtStartPage?.nameAr || ''}) إلى ص ${endPage} (${surahAtEndPage?.nameAr || ''})`
                      : `From p.${startPage} to p.${endPage}`}
                  </span>
                </div>
                <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400">
                  +{(calculatedPagesCount * 5500).toLocaleString()} {isAr ? 'حسنة' : 'XP'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: PRESETS */}
          {activeTab === 'preset' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400">
                {isAr ? 'اختر باقة الورد اليومية المعتمدة:' : 'Select Core Wird Routine:'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESETS.map((preset) => {
                  const isSelected = selectedPresetKey === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setSelectedPresetKey(preset.id);
                      }}
                      className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                          : 'bg-white dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black">{preset.titleAr}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                          {preset.pages} {isAr ? 'صفحة' : 'p'}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mb-1">
                        {preset.badge}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                        {preset.descAr}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSaveProgress(false)}
            className="w-full sm:flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-98 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAr ? 'حفظ الورد وتسجيل قراءة اليوم 🌿' : 'Save Wird & Log Today\'s Reading 🌿'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveProgress(true)}
            className="w-full sm:w-auto min-h-[44px] py-3 px-4 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title={isAr ? 'حفظ موضع التوقف دون إضافة نقاط لليوم' : 'Save current bookmark position'}
          >
            <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'تثبيت كعلامة مصحف 📌' : 'Set as Bookmark 📌'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
