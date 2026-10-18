import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  Search,
  Bookmark,
  CheckCircle2,
  EyeOff,
  Play,
  Pause,
  Repeat,
  Sparkles,
  Volume2,
  RotateCcw,
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
  initialMode?: QuranReadingMode;
}

export type QuranReadingMode = 'surah_ayah' | 'pages' | 'preset' | 'hifz';
export type HifzMaskLevel = 'full_visible' | 'half_masked' | 'first_word_only' | 'blind_recall';

interface HifzAyahItem {
  numberInSurah: number;
  globalNumber: number;
  text: string;
}

const OFFLINE_FALLBACK_AYAHS: Record<number, HifzAyahItem[]> = {
  1: [
    { numberInSurah: 1, globalNumber: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
    { numberInSurah: 2, globalNumber: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
    { numberInSurah: 3, globalNumber: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ' },
    { numberInSurah: 4, globalNumber: 4, text: 'مَالِكِ يَوْمِ الدِّينِ' },
    { numberInSurah: 5, globalNumber: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    { numberInSurah: 6, globalNumber: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ' },
    { numberInSurah: 7, globalNumber: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ' },
  ],
  67: [
    { numberInSurah: 1, globalNumber: 5242, text: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ' },
    { numberInSurah: 2, globalNumber: 5243, text: 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ' },
    { numberInSurah: 3, globalNumber: 5244, text: 'الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ' },
    { numberInSurah: 4, globalNumber: 5245, text: 'ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ' },
    { numberInSurah: 5, globalNumber: 5246, text: 'وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ' },
  ],
  18: [
    { numberInSurah: 1, globalNumber: 2141, text: 'الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا' },
    { numberInSurah: 2, globalNumber: 2142, text: 'قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا' },
    { numberInSurah: 3, globalNumber: 2143, text: 'مَّاكِثِينَ فِيهِ أَبَدًا' },
    { numberInSurah: 4, globalNumber: 2144, text: 'وَيُنذِرَ الَّذِينَ قَالُوا اتَّخَذَ اللَّهُ وَلَدًا' },
    { numberInSurah: 5, globalNumber: 2145, text: 'مَّا لَهُم بِهِ مِنْ عِلْمٍ وَلَا لِآبَائِهِمْ ۚ كَبُرَتْ كَلِمَةً تَخْرُجُ مِنْ أَفْوَاهِهِمْ ۚ إِن يَقُولُونَ إِلَّا كَذِبًا' },
  ],
};

export const FlexibleQuranTrackerModal: React.FC<FlexibleQuranTrackerModalProps> = ({
  isOpen,
  onClose,
  quranProgress,
  onRewardToast,
  todayLog,
  initialMode,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  // Fallback Surah (Al-Baqarah)
  const defaultSurah = QURAN_SURAHS[1] || QURAN_SURAHS[0];

  // Determine initial state from existing progress
  const initialSurah = useMemo(() => {
    if (quranProgress?.surahNumber) {
      const found = getSurahByNumber(quranProgress.surahNumber);
      if (found) return found;
    }
    if (quranProgress?.surah) {
      const found = getSurahByName(quranProgress.surah);
      if (found) return found;
    }
    return defaultSurah;
  }, [quranProgress, defaultSurah]);

  const [activeTab, setActiveTab] = useState<QuranReadingMode>(
    initialMode || (quranProgress?.mode && quranProgress.mode !== 'juz' ? (quranProgress.mode as QuranReadingMode) : 'surah_ayah')
  );

  // Tab 1: Surah & Ayah state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(initialSurah?.number || 2);
  const [startAyah, setStartAyah] = useState<number>(quranProgress?.startAyah || 1);
  const [endAyah, setEndAyah] = useState<number>(
    quranProgress?.endAyah || Math.min(initialSurah?.ayahCount || 286, 50)
  );

  // Tab 2: Pages & Bookmark state
  const [startPage, setStartPage] = useState<number>(
    quranProgress?.startPage || quranProgress?.currentPage || initialSurah?.startPage || 2
  );
  const [endPage, setEndPage] = useState<number>(
    quranProgress?.endPage || Math.min(604, (quranProgress?.currentPage || initialSurah?.startPage || 2) + 4)
  );

  // Tab 4: Interactive Hifz (Memorization & Self-Testing Studio) state
  const [hifzSurahNumber, setHifzSurahNumber] = useState<number>(67); // Default Surah Al-Mulk
  const [hifzStartAyah, setHifzStartAyah] = useState<number>(1);
  const [hifzEndAyah, setHifzEndAyah] = useState<number>(5);
  const [hifzMaskLevel, setHifzMaskLevel] = useState<HifzMaskLevel>('half_masked');
  const [revealedWordKeys, setRevealedWordKeys] = useState<Record<string, boolean>>({});
  const [hifzAyahs, setHifzAyahs] = useState<HifzAyahItem[]>(OFFLINE_FALLBACK_AYAHS[67]);
  const [isLoadingHifz, setIsLoadingHifz] = useState<boolean>(false);
  const [hifzReciter, setHifzReciter] = useState<'ar.husary' | 'ar.minshawi' | 'ar.alafasy'>('ar.husary');
  const [hifzLoopTarget, setHifzLoopTarget] = useState<number>(3);
  const [hifzCurrentLoop, setHifzCurrentLoop] = useState<number>(0);
  const [playingHifzAyah, setPlayingHifzAyah] = useState<number | null>(null);
  const [hifzStepsDone, setHifzStepsDone] = useState<Record<string, boolean>>({
    listen3: false,
    read5: false,
    maskHalf: false,
    blindTest: false,
    linkPrev: false,
  });
  const hifzAudioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch Surah Ayahs for Hifz Studio (with localStorage cache + offline fallback)
  useEffect(() => {
    if (!isOpen || activeTab !== 'hifz') return;
    let cancelled = false;
    const cacheKey = `midmar_hifz_surah_v1_${hifzSurahNumber}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as HifzAyahItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHifzAyahs(parsed);
          return;
        }
      } catch {}
    }

    setIsLoadingHifz(true);
    fetch(`https://api.alquran.cloud/v1/surah/${hifzSurahNumber}/quran-uthmani`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const rawAyahs = json?.data?.ayahs;
        if (Array.isArray(rawAyahs) && rawAyahs.length > 0) {
          const mapped: HifzAyahItem[] = rawAyahs.map((a: any) => ({
            numberInSurah: Number(a.numberInSurah),
            globalNumber: Number(a.number),
            text: String(a.text || '').trim(),
          }));
          setHifzAyahs(mapped);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(mapped));
          } catch {}
        } else if (OFFLINE_FALLBACK_AYAHS[hifzSurahNumber]) {
          setHifzAyahs(OFFLINE_FALLBACK_AYAHS[hifzSurahNumber]);
        }
      })
      .catch(() => {
        if (!cancelled && OFFLINE_FALLBACK_AYAHS[hifzSurahNumber]) {
          setHifzAyahs(OFFLINE_FALLBACK_AYAHS[hifzSurahNumber]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHifz(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab, hifzSurahNumber]);

  // Cleanup Hifz audio when modal closes
  useEffect(() => {
    if (!isOpen && hifzAudioRef.current) {
      hifzAudioRef.current.pause();
      setPlayingHifzAyah(null);
    }
  }, [isOpen]);

  // Play & Loop Ayah Audio for Hifz
  const handlePlayHifzAyah = (ayah: HifzAyahItem, loopCount: number = 1) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (playingHifzAyah === ayah.numberInSurah && hifzAudioRef.current && !hifzAudioRef.current.paused) {
      hifzAudioRef.current.pause();
      setPlayingHifzAyah(null);
      return;
    }

    if (hifzAudioRef.current) {
      hifzAudioRef.current.pause();
    }

    const audioUrl = `https://cdn.islamic.network/quran/audio/128/${hifzReciter}/${ayah.globalNumber}.mp3`;
    const audio = new Audio(audioUrl);
    hifzAudioRef.current = audio;
    setPlayingHifzAyah(ayah.numberInSurah);
    setHifzCurrentLoop(loopCount);

    audio.onended = () => {
      if (loopCount < hifzLoopTarget) {
        const nextLoop = loopCount + 1;
        setHifzCurrentLoop(nextLoop);
        audio.currentTime = 0;
        audio.play().catch(() => setPlayingHifzAyah(null));
      } else {
        setPlayingHifzAyah(null);
        setHifzCurrentLoop(0);
      }
    };

    audio.onerror = () => {
      setPlayingHifzAyah(null);
    };

    audio.play().catch(() => {
      setPlayingHifzAyah(null);
    });
  };

  // Sync state whenever modal opens or quranProgress updates
  useEffect(() => {
    if (isOpen) {
      if (quranProgress?.surahNumber) {
        setSelectedSurahNumber(quranProgress.surahNumber);
      }
      if (quranProgress?.startAyah) setStartAyah(quranProgress.startAyah);
      if (quranProgress?.endAyah) setEndAyah(quranProgress.endAyah);
      if (quranProgress?.startPage || quranProgress?.currentPage) {
        setStartPage(quranProgress.startPage || quranProgress.currentPage);
      }
      if (quranProgress?.endPage) setEndPage(quranProgress.endPage);
      if (initialMode) {
        setActiveTab(initialMode);
      } else if (quranProgress?.mode && quranProgress.mode !== 'juz') {
        setActiveTab(quranProgress.mode as QuranReadingMode);
      }
    }
  }, [isOpen, quranProgress, initialMode]);

  // Tab 3: Preset selection
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('baqarah');

  if (!isOpen) return null;

  const currentSurah = getSurahByNumber(selectedSurahNumber) || initialSurah || defaultSurah;
  const hifzSurahMeta = getSurahByNumber(hifzSurahNumber) || getSurahByNumber(67) || currentSurah;
  const activeHifzAyahSlice = hifzAyahs.filter(
    (a) => a.numberInSurah >= hifzStartAyah && a.numberInSurah <= hifzEndAyah
  );

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
  const safeAyahCount = Math.max(1, currentSurah?.ayahCount || 286);
  const safeStartPage = currentSurah?.startPage || 2;
  const safeEndPage = currentSurah?.endPage || 49;
  const calculatedAyahsCount = Math.max(1, endAyah - startAyah + 1);
  const estimatedPagesForAyahs = Math.max(
    1,
    Math.round((calculatedAyahsCount / safeAyahCount) * (safeEndPage - safeStartPage + 1))
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
    } else if (activeTab === 'hifz') {
      finalSurahName = hifzSurahMeta.nameAr;
      finalSurahNumber = hifzSurahMeta.number;
      finalStartAyah = hifzStartAyah;
      finalEndAyah = hifzEndAyah;
      finalPagesCount = Math.max(1, Math.ceil((hifzEndAyah - hifzStartAyah + 1) / 8));
      finalStartPage = hifzSurahMeta.startPage;
      finalEndPage = hifzSurahMeta.endPage;
      rewardPoints = 30;
    }

    const dbMode = activeTab === 'hifz' ? 'surah_ayah' : activeTab;

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
        mode: dbMode,
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
        mode: dbMode,
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

    // Update daily log and user_state.totalPoints if not just a bookmark
    if (!isBookmarkOnly) {
      const user = await db.user_state.get('current_user');
      if (user) {
        await db.user_state.update('current_user', {
          totalPoints: (user.totalPoints || 0) + rewardPoints,
        });
      }
      const currentPoints = todayLog?.pointsEarned || 0;
      await upsertDailyLog(todayStr, {
        pointsEarned: currentPoints + rewardPoints,
        quranWirdDone: true,
        ...(finalSurahNumber === 2
          ? {
              baqarahProgress: {
                pagesRead: finalPagesCount,
                targetPages: finalPagesCount,
                completed: true,
              },
            }
          : {}),
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
          activeTab === 'hifz'
            ? isAr
              ? `🧠 ما شاء الله! تم تثبيت وتسميع آيات (${finalStartAyah}-${finalEndAyah}) من سورة ${finalSurahName} (+30 XP)`
              : `🧠 Masha'Allah! Memorized & verified Ayahs ${finalStartAyah}-${finalEndAyah} of ${finalSurahName} (+30 XP)`
            : isAr
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl modal-surface rounded-3xl border border-slate-200 dark:border-zinc-800 flex flex-col h-[90dvh] sm:h-auto sm:max-h-[92dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between celestial-obsidian-stage text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isAr ? 'الورد القرآني واستوديو الحفظ والتسميع' : 'Quran Wird & Interactive Hifz Studio'}
              </h2>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'تابع وردك اليومي أو احفظ الآيات بالتكرار الصوتي والإخفاء التدريجي للكلمات'
                  : 'Track your daily Wird or memorize Ayahs with audio looping & progressive word masking'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              onClose();
            }}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (4 Flexible Modes including Interactive Hifz Studio) */}
        <div className="px-4 sm:px-5 pt-3 border-b border-slate-200/80 dark:border-white/[0.08] flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('hifz');
            }}
            className={`pb-2.5 px-3 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'hifz'
                ? 'border-amber-500 text-amber-700 dark:text-amber-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <span>🧠 {isAr ? 'استوديو الحفظ والتسميع' : 'Hifz & Recall Studio'}</span>
          </button>

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
                            : 'surface-card-3d text-slate-700 dark:text-zinc-300 hover:border-emerald-400'
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
                    className="w-full px-3.5 py-2.5 pe-9 rounded-xl surface-card-3d text-xs sm:text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute end-3 top-3 pointer-events-none" />
                </div>

                {/* Dropdown list if searching or displaying current */}
                {searchQuery.trim().length > 0 && (
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl surface-card-3d shadow-lg divide-y divide-slate-100 dark:divide-zinc-700">
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
              <div className="p-3.5 rounded-2xl bento-3d-mint flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-bold">
                      #{currentSurah.number}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-emerald-950 dark:text-emerald-300">
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
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {currentSurah.endPage - currentSurah.startPage + 1} {isAr ? 'صفحة' : 'p'}
                  </span>
                </div>
              </div>

              {/* Ayah Range Inputs: من آية ... إلى آية ... */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 rounded-2xl surface-card-3d">
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
                      className="flex-1 py-1 rounded-lg bg-slate-200/70 dark:bg-zinc-700 text-[10px] font-bold text-slate-700 dark:text-zinc-300 hover:bg-emerald-100 cursor-pointer"
                    >
                      {isAr ? 'البداية (1)' : 'Start (1)'}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl surface-card-3d">
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
                      className="flex-1 py-1 rounded-lg bg-slate-200/70 dark:bg-zinc-700 text-[10px] font-bold text-slate-700 dark:text-zinc-300 hover:bg-emerald-100 cursor-pointer"
                    >
                      {isAr ? `نهاية السورة (${currentSurah.ayahCount})` : `End (${currentSurah.ayahCount})`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Calculation Card */}
              <div className="p-3 rounded-2xl bento-3d-amber flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-amber-900 dark:text-amber-300 font-bold block">
                    {isAr
                      ? `القراءة المحددة: ${calculatedAyahsCount} آية من سورة ${currentSurah.nameAr}`
                      : `Selected: ${calculatedAyahsCount} ayahs of ${currentSurah.nameEn}`}
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-zinc-400">
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
              <div className="p-3.5 rounded-2xl surface-card-3d">
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
                      className="py-2 rounded-xl surface-card-3d hover:border-emerald-400 text-slate-800 dark:text-zinc-200 hover:text-emerald-700 text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-3.5 rounded-2xl bento-3d-mint flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block">
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
                <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
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
                      className={`p-3.5 rounded-2xl text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'bento-3d-mint text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                          : 'surface-card-3d text-slate-800 dark:text-zinc-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{preset.titleAr}</span>
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

          {/* TAB 4: INTERACTIVE QURAN HIFZ & SELF-TESTING STUDIO (استوديو الحفظ والتسميع المتدرج) */}
          {activeTab === 'hifz' && (
            <div className="space-y-4">
              {/* 1. Surah & Ayah Range Picker for Hifz */}
              <div className="p-3.5 rounded-2xl surface-card-3d space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 block">
                      🧠 {isAr ? '١. اختر السورة ونصاب الآيات للحفظ والتثبيت اليوم:' : '1. Select Surah & Ayah Window for Hifz:'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {isAr
                        ? 'ينصح العلماء بحفظ 3 إلى 5 آيات متقنة مع ربطها وتكرارها بصرياً وصوتياً'
                        : 'Memorize 3-5 Ayahs at a time with audio looping and progressive word masking'}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                    سورة {hifzSurahMeta.nameAr} ({hifzStartAyah} - {hifzEndAyah})
                  </span>
                </div>

                {/* Quick Hifz Surahs Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {[67, 18, 36, 55, 56, 78, 87, 1, 2].map((sNum) => {
                    const s = getSurahByNumber(sNum);
                    if (!s) return null;
                    const isSel = hifzSurahNumber === s.number;
                    return (
                      <button
                        key={s.number}
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          setHifzSurahNumber(s.number);
                          setHifzStartAyah(1);
                          setHifzEndAyah(Math.min(s.ayahCount, 5));
                          setRevealedWordKeys({});
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                          isSel
                            ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                            : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        سورة {s.nameAr}
                      </button>
                    );
                  })}
                </div>

                {/* Full 114 Surah Dropdown + Start/End Ayah */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                      {isAr ? 'اختر من 114 سورة:' : 'Surah (1-114):'}
                    </label>
                    <select
                      value={hifzSurahNumber}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        const s = getSurahByNumber(num);
                        setHifzSurahNumber(num);
                        setHifzStartAyah(1);
                        setHifzEndAyah(Math.min(s?.ayahCount || 5, 5));
                        setRevealedWordKeys({});
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-zinc-100"
                    >
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.number} value={s.number}>
                          {s.number}. سورة {s.nameAr} ({s.ayahCount} آية)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                      {isAr ? 'من آية:' : 'From Ayah:'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={hifzSurahMeta.ayahCount}
                      value={hifzStartAyah}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(hifzSurahMeta.ayahCount, Number(e.target.value) || 1));
                        setHifzStartAyah(v);
                        if (v > hifzEndAyah) setHifzEndAyah(Math.min(hifzSurahMeta.ayahCount, v + 4));
                        setRevealedWordKeys({});
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-bold text-center text-slate-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                      {isAr ? 'إلى آية (ننصح بـ 5 آيات):' : 'To Ayah:'}
                    </label>
                    <input
                      type="number"
                      min={hifzStartAyah}
                      max={hifzSurahMeta.ayahCount}
                      value={hifzEndAyah}
                      onChange={(e) => {
                        const v = Math.max(hifzStartAyah, Math.min(hifzSurahMeta.ayahCount, Number(e.target.value) || hifzStartAyah));
                        setHifzEndAyah(v);
                        setRevealedWordKeys({});
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-bold text-center text-slate-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Progressive Word Masking Level Bar + Sheikh Audio Repeater */}
              <div className="p-3.5 rounded-2xl bento-3d-amber space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-amber-600" />
                    <span>{isAr ? '٢. مستوى الإخفاء التدريجي للتسميع الذاتي:' : '2. Progressive Word Masking Level:'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setRevealedWordKeys({});
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer border border-amber-500/30"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isAr ? 'إعادة إخفاء الكلمات' : 'Reset Hidden Words'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'full_visible', labelAr: '👁️ ١. قراءة بصرية كاملة', labelEn: '1. Full Text' },
                      { id: 'half_masked', labelAr: '🌓 ٢. إخفاء 50% من الكلمات', labelEn: '2. Mask 50%' },
                      { id: 'first_word_only', labelAr: '🔑 ٣. أول كلمة فقط (ربط)', labelEn: '3. First Word Only' },
                      { id: 'blind_recall', labelAr: '🧠 ٤. تسميع غيبي كامل', labelEn: '4. Full Blind Recall' },
                    ] as const
                  ).map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setHifzMaskLevel(lvl.id);
                        setRevealedWordKeys({});
                      }}
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center ${
                        hifzMaskLevel === lvl.id
                          ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                          : 'bg-white/80 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-amber-500/20'
                      }`}
                    >
                      {isAr ? lvl.labelAr : lvl.labelEn}
                    </button>
                  ))}
                </div>

                {/* Audio Reciter & Loop Count Selector */}
                <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Volume2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                    <span className="text-[11px] font-bold text-amber-950 dark:text-amber-200">
                      {isAr ? 'المُقرئ المُعلّم:' : 'Reciter:'}
                    </span>
                    {(
                      [
                        { id: 'ar.husary', label: 'الحصري' },
                        { id: 'ar.minshawi', label: 'المنشاوي' },
                        { id: 'ar.alafasy', label: 'العفاسي' },
                      ] as const
                    ).map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => setHifzReciter(rec.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                          hifzReciter === rec.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/80 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {rec.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <Repeat className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                    <span className="text-[10px] font-bold text-amber-950 dark:text-amber-200">
                      {isAr ? 'تكرار الآية:' : 'Loop:'}
                    </span>
                    {[1, 3, 5, 7].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setHifzLoopTarget(cnt)}
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold cursor-pointer ${
                          hifzLoopTarget === cnt
                            ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950'
                            : 'bg-white/80 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {cnt}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Interactive Mushaf Hifz Stage (Tap any masked word to reveal it!) */}
              <div className="p-4 sm:p-5 rounded-3xl celestial-obsidian-stage border border-amber-500/30 text-white space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isAr
                        ? `لوح الحفظ التفاعلي — سورة ${hifzSurahMeta.nameAr} (الآيات ${hifzStartAyah} إلى ${hifzEndAyah})`
                        : `Interactive Hifz Slate — Surah ${hifzSurahMeta.nameEn}`}
                    </span>
                  </span>
                  <span className="text-[10px] text-emerald-300 font-bold">
                    {isAr ? '💡 اضغط على أي كلمة مخفية لكشفها والتحقق من حفظك' : '💡 Tap any hidden word to reveal'}
                  </span>
                </div>

                {isLoadingHifz ? (
                  <div className="py-8 text-center text-xs text-slate-300">
                    {isAr ? 'جاري تحميل الرسم العثماني للآيات...' : 'Loading Uthmani Ayahs...'}
                  </div>
                ) : activeHifzAyahSlice.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-300">
                    {isAr ? 'لا توجد آيات في هذا النطاق، يرجى ضبط رقم البداية والنهاية.' : 'No Ayahs in selected range.'}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pe-1">
                    {activeHifzAyahSlice.map((ayah) => {
                      const words = ayah.text.split(/\s+/).filter(Boolean);
                      const isPlayingThisAyah = playingHifzAyah === ayah.numberInSurah;

                      return (
                        <div
                          key={ayah.numberInSurah}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isPlayingThisAyah
                              ? 'bg-emerald-950/60 border-emerald-400/50 shadow-md'
                              : 'bg-white/[0.04] border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold">
                              آية ﴿{ayah.numberInSurah}﴾
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handlePlayHifzAyah(ayah, 1)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                  isPlayingThisAyah
                                    ? 'bg-emerald-500 text-zinc-950'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                              >
                                {isPlayingThisAyah ? (
                                  <>
                                    <Pause className="w-3 h-3" />
                                    <span>
                                      {isAr
                                        ? `جاري التكرار (${hifzCurrentLoop}/${hifzLoopTarget})`
                                        : `Loop ${hifzCurrentLoop}/${hifzLoopTarget}`}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3" />
                                    <span>{isAr ? `استمع وكرر (${hifzLoopTarget}x)` : `Play (${hifzLoopTarget}x)`}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Words Flow with Interactive Masking */}
                          <div
                            dir="rtl"
                            lang="ar"
                            className="flex flex-wrap items-center gap-1.5 leading-[2.35] text-base sm:text-lg font-bold tashkeel-text"
                          >
                            {words.map((word, wIdx) => {
                              const wordKey = `${ayah.numberInSurah}-${wIdx}`;
                              const isManuallyRevealed = Boolean(revealedWordKeys[wordKey]);
                              let shouldHide = false;
                              if (hifzMaskLevel === 'half_masked') {
                                shouldHide = wIdx % 2 === 1;
                              } else if (hifzMaskLevel === 'first_word_only') {
                                shouldHide = wIdx > 0;
                              } else if (hifzMaskLevel === 'blind_recall') {
                                shouldHide = true;
                              }

                              const isHiddenNow = shouldHide && !isManuallyRevealed;

                              return isHiddenNow ? (
                                <button
                                  key={wordKey}
                                  type="button"
                                  onClick={() => {
                                    soundSynth.playTactileClick();
                                    haptic.vibrateLight();
                                    setRevealedWordKeys((prev) => ({ ...prev, [wordKey]: true }));
                                  }}
                                  className="px-3 py-0.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/30 border border-dashed border-amber-400/45 text-amber-300 text-xs font-mono cursor-pointer transition-all active:scale-95"
                                  title={isAr ? 'اضغط لكشف الكلمة' : 'Tap to reveal word'}
                                >
                                  •••
                                </button>
                              ) : (
                                <span
                                  key={wordKey}
                                  onClick={() => {
                                    if (shouldHide) {
                                      setRevealedWordKeys((prev) => ({ ...prev, [wordKey]: false }));
                                    }
                                  }}
                                  className={`px-1 rounded transition-colors ${
                                    isManuallyRevealed
                                      ? 'text-emerald-300 bg-emerald-500/15 cursor-pointer'
                                      : 'text-white'
                                  }`}
                                >
                                  {word}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. 5-Step Hifz Mastery Method Checklist (خماسية الحفظ المتقن) */}
              <div className="p-3.5 rounded-2xl bento-3d-mint space-y-2">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                  ✅ {isAr ? 'خماسية الحفظ المتقن والربط (منهج الحفاظ لتثبيت المحفوظ):' : '5-Step Hifz Mastery Checklist:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    { key: 'listen3', labelAr: '١. الاستماع للمقرئ 3 مرات لتصحيح المخارج والتجويد' },
                    { key: 'read5', labelAr: '٢. القراءة البصرية المركزة 5 مرات مع فهم المعنى' },
                    { key: 'maskHalf', labelAr: '٣. التسميع مع إخفاء نصف الكلمات ثم رؤوس الآيات' },
                    { key: 'blindTest', labelAr: '٤. التسميع الغيبي الكامل 3 مرات متتالية دون خطأ' },
                    { key: 'linkPrev', labelAr: '٥. ربط آخر آية بأول آية وقراءتها في ركعتي السنة' },
                  ].map((st) => (
                    <label
                      key={st.key}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/85 dark:bg-zinc-900/85 border border-emerald-500/20 text-[11px] font-bold text-slate-800 dark:text-zinc-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(hifzStepsDone[st.key])}
                        onChange={(e) => {
                          soundSynth.playTactileClick();
                          setHifzStepsDone((prev) => ({ ...prev, [st.key]: e.target.checked }));
                        }}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>{st.labelAr}</span>
                    </label>
                  ))}
                </div>
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
            <span>
              {activeTab === 'hifz'
                ? isAr
                  ? 'تأكيد إتقان وتسميع آيات اليوم (+30 XP) 🧠'
                  : 'Confirm Today Hifz Mastery (+30 XP) 🧠'
                : isAr
                ? 'حفظ الورد وتسجيل قراءة اليوم 🌿'
                : "Save Wird & Log Today's Reading 🌿"}
            </span>
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
