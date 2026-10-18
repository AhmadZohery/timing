import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Shield,
  BookOpen,
  Briefcase,
  Dumbbell,
  Laptop,
  Check,
  CheckCircle2,
  Sun,
  Moon,
  Activity,
  ShieldCheck,
  Feather,
  Calendar,
  Volume2,
  Globe,
  ChevronDown,
} from 'lucide-react';
import type { DailyLog, UserState, StationId, UserProfile } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { PrayerTimesBar } from '../spiritual/PrayerTimesBar';
import { CelestialPrayerArc, type PrayerKey } from './CelestialPrayerArc';
import { GlowRing } from './GlowRing';
import { Landmark, BarChart3, Target as TargetIcon } from 'lucide-react';
import { gymFaithAudio } from '../../services/gymFaithAudioService';
import { DailyCircadianTimeline } from '../spiritual/DailyCircadianTimeline';
import { SmartAmbientNudgeCard } from './SmartAmbientNudgeCard';
import { AiBehavioralCopilotCard } from './AiBehavioralCopilotCard';
import { DailyTadabburCard } from '../spiritual/DailyTadabburCard';
import { DailyStationsRoadmap } from './DailyStationsRoadmap';
import { LIFESTYLE_PERSONAS } from '../../utils/lifestyleEngine';
import { getDailyTadabburItem, type DailyTadabburItem } from '../../data/dailyTadabburData';
import { LanguageQuizModal } from '../learning/LanguageQuizModal';
import { LanguageMovesModal } from '../learning/LanguageMovesModal';
import {
  TARGET_LANGUAGES,
  type TargetLanguageCode,
  type CefrLevel,
  CEFR_LEVELS_INFO,
} from '../../data/languages/vocabularyDatabase';
import { spacedRepetition } from '../../services/spacedRepetitionService';
import { speechService } from '../../services/speechService';
import { getDailyWisdom } from '../../data/lifeWisdomData';
import { GymFaithAudioPlayer } from '../spiritual/GymFaithAudioPlayer';
import { scheduleService, type LearnedSportPattern } from '../../services/scheduleService';
import { ScheduleAnomalyModal } from '../modals/ScheduleAnomalyModal';
import { MorningEveningAdhkarModal } from '../spiritual/MorningEveningAdhkarModal';
import { SurahMulkModal } from '../spiritual/SurahMulkModal';
import { FastingReminderModal } from '../spiritual/FastingReminderModal';
import { NawafilGuideModal, type NafilaTab } from '../spiritual/NawafilGuideModal';
import { ActiveStudyCourseWidget } from './ActiveStudyCourseWidget';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getHijriDateDetails } from '../../utils/prayerCalculator';
import { awardSpiritualHabitPoints } from '../../utils/gamification';
import { WeeklyBarakahReportModal } from '../modals/WeeklyBarakahReportModal';
import { FridayKahfModal } from '../spiritual/FridayKahfModal';
import { FlexibleQuranTrackerModal } from '../spiritual/FlexibleQuranTrackerModal';
import { checkIsFridaySalawatWindow } from '../../utils/tasbihEngine';

interface HomeDashboardViewProps {
  userState?: UserState;
  todayLog?: DailyLog;
  allDailyLogs?: DailyLog[];
  activeProfile?: UserProfile;
  onSelectStation: (stationId: StationId) => void;
  onOpenSmartTasbih: (mode?: any) => void;
  onOpenSleepRest: () => void;
  onOpenEvaluation: () => void;
  onOpenMonthlyEvaluation?: () => void;
  onOpenLocationModal: () => void;
  onRewardToast: (msg: string) => void;
  onOpenTadabburModal?: (item?: DailyTadabburItem, tab?: 'quran' | 'hadith') => void;
  completedStations?: string[];
  onOpenLifestyleModal?: () => void;
  onOpenFaithAudio?: () => void;
  /** Rendered as a slim row inside the bento grid (below the hero content) */
  notificationSlot?: React.ReactNode;
  onOpenArabicPoetry?: () => void;
  onOpenLifeWisdom?: () => void;
  onOpenPanic?: () => void;
  onOpenCustomDeck?: () => void;
  onOpenCalendarShield?: () => void;
  onOpenAdhkarModal?: (mode?: 'morning' | 'evening') => void;
  onOpenQuranTracker?: () => void;
}

/** Centre-weighted spectrum bar heights for the prophetic-audio waveform (static, deterministic). */
const WAVE_BARS: number[] = Array.from({ length: 36 }, (_, i) => {
  const x = (i - 17.5) / 17.5;
  return Math.round(10 + 34 * Math.exp(-x * x * 1.6) * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7))));
});
export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  userState,
  todayLog,
  allDailyLogs,
  activeProfile,
  onSelectStation,
  onOpenSmartTasbih,
  onOpenSleepRest,
  onOpenEvaluation,
  onOpenMonthlyEvaluation,
  onOpenLocationModal,
  onRewardToast,
  onOpenTadabburModal,
  completedStations = [],
  onOpenLifestyleModal,
  onOpenFaithAudio,
  notificationSlot,
  onOpenArabicPoetry,
  onOpenLifeWisdom,
  onOpenPanic,
  onOpenCustomDeck,
  onOpenCalendarShield,
  onOpenAdhkarModal,
  onOpenQuranTracker,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const currentHour = now.getHours();

  const [faithPlaying, setFaithPlaying] = useState(false);
  useEffect(() => {
    const unsubscribe = gymFaithAudio.subscribe((s) => setFaithPlaying(Boolean(s.isPlaying)));
    return () => {
      unsubscribe();
    };
  }, []);

  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const personaConfig = LIFESTYLE_PERSONAS[personaId] || LIFESTYLE_PERSONAS.builder_exec;
  const overrides = userState?.settings?.stationCustomOverrides;

  const allStationIds: StationId[] = [
    'COMMUTE_MORNING',
    'WORK_MICRO_SPRINT',
    'ONE_SEC_FRICTION',
    'SOCIAL_MEDIA_BREAK',
    'GYM_ANCHOR',
    'EVENING_SPRINT',
    'RETROSPECTIVE_CHECKIN',
    'GRAND_REWARD_STATE',
  ];

  // Dynamic Daily Wisdom State
  const [wisdomCategory, setWisdomCategory] = useState<string>('all');
  const [isReadMoreWisdomOpen, setIsReadMoreWisdomOpen] = useState(false);
  const dailyWisdom = useMemo(() => getDailyWisdom(now, wisdomCategory), [now, wisdomCategory]);



  // Spiritual Modals & Smart Time-Based Nudges (Adhkar, Mulk, Fasting, Nawafil)
  const [isAdhkarModalOpen, setIsAdhkarModalOpen] = useState(false);
  const [adhkarMode, setAdhkarMode] = useState<'morning' | 'evening'>('morning');

  const handleOpenAdhkar = (mode: 'morning' | 'evening') => {
    soundSynth.playTactileClick();
    setAdhkarMode(mode);
    if (onOpenAdhkarModal) {
      onOpenAdhkarModal(mode);
    } else {
      setIsAdhkarModalOpen(true);
    }
  };

  const handleOpenQuranTracker = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (onOpenQuranTracker) {
      onOpenQuranTracker();
    } else {
      setIsFlexibleQuranOpen(true);
    }
  };

  const [isHomeSurahMulkOpen, setIsHomeSurahMulkOpen] = useState(false);
  const [isFastingModalOpen, setIsFastingModalOpen] = useState(false);
  const [isNawafilModalOpen, setIsNawafilModalOpen] = useState(false);
  const [nawafilModalTab, setNawafilModalTab] = useState<NafilaTab>('qiyam');
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [isFridayModalOpen, setIsFridayModalOpen] = useState(false);

  const fridayWindow = useMemo(() => {
    return checkIsFridaySalawatWindow(now, userState?.settings?.prayerLocation);
  }, [now, userState?.settings?.prayerLocation]);

  // Language Mastery Bento State
  const [isHomeQuizOpen, setIsHomeQuizOpen] = useState(false);
  const [isLanguageMovesOpen, setIsLanguageMovesOpen] = useState(false);
  const [activeLangCode, setActiveLangCode] = useState<TargetLanguageCode>(() =>
    spacedRepetition.getActiveLanguage()
  );
  const [langStats, setLangStats] = useState(() => spacedRepetition.getStats());
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [selectedBentoLevel, setSelectedBentoLevel] = useState<CefrLevel | 'ALL'>('ALL');
  const [speechPlaying, setSpeechPlaying] = useState(false);

  useEffect(() => {
    spacedRepetition.setActiveLanguage(activeLangCode);
  }, [activeLangCode]);

  const allHomeLangWords = useMemo(() => {
    void langStats;
    const words = spacedRepetition.getTodayWords();
    if (words && words.length > 0) return words;
    return spacedRepetition.getAllWordsForLanguage(activeLangCode);
  }, [activeLangCode, langStats]);

  const homeLangWords = useMemo(() => {
    if (selectedBentoLevel === 'ALL') return allHomeLangWords;
    const filtered = allHomeLangWords.filter((w) => w.level === selectedBentoLevel);
    return filtered.length > 0 ? filtered : allHomeLangWords;
  }, [allHomeLangWords, selectedBentoLevel]);

  const bentoLevelCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allHomeLangWords.length };
    CEFR_LEVELS_INFO.forEach((c) => {
      counts[c.level] = allHomeLangWords.filter((w) => w.level === c.level).length;
    });
    return counts;
  }, [allHomeLangWords]);

  const currentLangObj = useMemo(() => {
    return TARGET_LANGUAGES.find((l) => l.code === activeLangCode) || TARGET_LANGUAGES[0];
  }, [activeLangCode]);

  const fluencyProfile = useMemo(() => {
    void langStats;
    return spacedRepetition.calculateFluencyProfile(activeLangCode);
  }, [activeLangCode, langStats]);

  const featuredWord = homeLangWords[0] || allHomeLangWords[0];

  // Live Quran Progress Query & Quick Increment Handler
  const quranList = useLiveQuery(() => db.quran_progress.toArray(), []);
  const quranProgress = quranList?.[0];
  const currentWirdPages = quranProgress?.currentPage ?? 0;
  const totalWirdPages = quranProgress?.totalPages ?? 604;
  const [isFlexibleQuranOpen, setIsFlexibleQuranOpen] = useState(false);
  const [activeQuickSection, setActiveQuickSection] = useState<string>('today');

  const handleQuickIncrementQuran = async () => {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();
    if (quranProgress?.id) {
      const nextPg = Math.min(quranProgress.totalPages, quranProgress.currentPage + 1);
      await db.quran_progress.update(quranProgress.id, {
        currentPage: nextPg,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
      const quranGoal = await db.goals.get('goal-quran');
      if (quranGoal) {
        await db.goals.update('goal-quran', {
          currentValue: Math.min(quranGoal.targetValue, nextPg),
        });
      }
    } else {
      await db.quran_progress.add({
        surah: 'الفاتحة',
        totalPages: 604,
        currentPage: 1,
        currentAyah: 1,
        lastUpdated: new Date().toISOString().split('T')[0],
        history: [{ date: new Date().toISOString().split('T')[0], page: 1, ayah: 1 }],
      });
    }
    onRewardToast(
      isAr
        ? '📖 تم تسجيل تلاوة صفحة من القرآن الكريم! (+5,500 حسنة مضاعفة بإذن الله)'
        : '📖 +1 Quran Page logged! (+5,500 multiplied Hasanat)'
    );
  };

  const isMorningTime = currentHour >= 3 && currentHour < 15;
  const hijriInfo = useMemo(() => getHijriDateDetails(now), [now]);

  // Habit Learning & Sports Flexibility Engine
  const [learnedPattern, setLearnedPattern] = useState<LearnedSportPattern | null>(null);
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string>(() => {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem('midmar_movement_cat') : null) ||
      scheduleService.getSportForDay()
    );
  });

  useEffect(() => {
    scheduleService.getLearnedSportPattern().then((pat) => {
      setLearnedPattern(pat);
    });
  }, [selectedSport]);

  const handleSelectSportForToday = (sportKey: string, movementCat: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedSport(sportKey);
    localStorage.setItem('midmar_movement_cat', movementCat);
    onRewardToast(
      isAr
        ? `✅ تم اعتماد نشاط اليوم: ${sportKey}`
        : `✅ Today's activity set to: ${sportKey}`
    );
  };

  // Determine biological time of day
  const isFajrMorning = currentHour >= 4 && currentHour < 8;
  const isForenoon = currentHour >= 8 && currentHour < 12;
  const isNoon = currentHour >= 12 && currentHour < 15;
  const isAsr = currentHour >= 15 && currentHour < 18;
  const isMaghrib = currentHour >= 18 && currentHour < 20;
  const isNight = currentHour >= 20 || currentHour < 4;

  // Dignified bilingual greetings
  const greeting = useMemo(() => {
    if (isAr) {
      const nameSuffix = activeProfile?.name ? ` يا ${activeProfile.name}` : '';
      if (isFajrMorning) return `صباح النور والبركة${nameSuffix}`;
      if (isForenoon) return `طاب يومك وبورك مسعاك${nameSuffix}`;
      if (isNoon) return `ظهيرة موفقة ومفعمة بالإنجاز${nameSuffix}`;
      if (isAsr) return `مساء الهمة والنشاط${nameSuffix}`;
      if (isMaghrib) return `مساء الطمأنينة وحصاد الإنجاز${nameSuffix}`;
      return `ليلة هادئة ومباركة${nameSuffix}`;
    }
    const nameSuffix = activeProfile?.name ? `, ${activeProfile.name}` : '';
    if (isFajrMorning) return `Good morning & barakah${nameSuffix}`;
    if (isForenoon) return `High momentum & focus${nameSuffix}`;
    if (isNoon) return `Productive afternoon & steady flow${nameSuffix}`;
    if (isAsr) return `Vibrant evening & energy${nameSuffix}`;
    if (isMaghrib) return `Peaceful dusk & reflection${nameSuffix}`;
    return `Serene & restful night${nameSuffix}`;
  }, [isFajrMorning, isForenoon, isNoon, isAsr, isMaghrib, activeProfile?.name, isAr]);

  // Eloquent motivational message
  const motivationalMessage = useMemo(() => {
    if (isAr) {
      if (isFajrMorning) {
        return 'أقبل عليك يومٌ جديد كصفحة بيضاء ناصعة لم يُكتب فيها إلا توكلك على الله. ابدأ بورد القرآن العظيم وأذكار الصباح، فمن بدأ يومه بالله كفاه الله سائر أمره.';
      }
      if (isForenoon) {
        return 'أنت الآن في ذروة النشاط الذهني؛ ركّز في أهدافك الكبرى، وادخل شوط التركيز الأول دون مشتتات. ساعةٌ من التركيز التام تسبق يوماً من التردد.';
      }
      if (isNoon) {
        return 'تفيأ ظلال صلاة الظهر وسِنة القيلولة النبوية (20 دقيقة)؛ فإنها تفرغ الإجهاد الإدراكي وتجدد صفاء الذهن لمواصلة السعي بهمة عالية.';
      }
      if (isAsr) {
        return 'حافظ على صلاة العصر فإنها الصلاة الوسطى، ثم اشحن همتك في الجيم مستمعاً لأثير السيرة النبوية وبطولات الصحابة؛ فالمؤمن القوي أحب إلى الله.';
      }
      if (isMaghrib) {
        return 'اقترب اليوم من ختامه؛ دوّن فكرتك الذهبية وإنجازاتك، واحمد الله على التوفيق والسداد، واستعد لمراجعة اليوم.';
      }
      return 'ضع أعباء النهار جانباً؛ اقرأ سورة الملك المانعة من عذاب القبر، وسبّح ربك قبل نومك، وتوجه إلى فراشك بقلب سليم راجياً بركة الغد.';
    }

    if (isFajrMorning) {
      return 'A pristine new day unfolds. Anchor your morning in the Quran and daily remembrance; whoever begins their day with Allah finds all their affairs guided and sustained.';
    }
    if (isForenoon) {
      return 'You are in your prime cognitive window. Zero in on your highest-leverage goal and enter your first deep work sprint without distraction. One hour of pure focus outweighs a full day of hesitation.';
    }
    if (isNoon) {
      return 'Pause under the shade of Dhuhr prayer and a restorative 20-minute sunnah power nap. It resets cognitive bandwidth for relentless afternoon execution.';
    }
    if (isAsr) {
      return 'Preserve Asr, the middle prayer, then charge your vitality in training while tuning into inspiring prophetic history. A strong believer is beloved to Allah.';
    }
    if (isMaghrib) {
      return 'The day winds down into harvest. Capture your golden insights, express gratitude for breakthroughs granted, and prepare for a mindful evening sprint.';
    }
    return 'Release the weights of the day. Recite Surah Al-Mulk to protect and illuminate the night, glorify your Lord, and step into restorative sleep with a peaceful heart.';
  }, [isFajrMorning, isForenoon, isNoon, isAsr, isMaghrib, isAr]);

  // Current suggested Station based on real hour
  const currentSuggestedStation = useMemo((): {
    id: StationId;
    title: string;
    description: string;
    cta: string;
    icon: any;
    badge: string;
    badgeColor: string;
  } => {
    if (isFajrMorning) {
      return {
        id: 'COMMUTE_MORNING',
        title: isAr ? 'ورد الصباح وتلاوة القرآن الكريم' : 'Morning Quran & Sunnah Wird',
        description: isAr
          ? 'قراءة وِرد اليوم من سورة البقرة، أذكار الصباح، وحرز التوحيد (100 مرة).'
          : 'Read daily Quran portion, morning fortress adhkar, and 100x tawheed protection shield.',
        cta: isAr ? 'انطلق إلى محطة القرآن الكريم 📖' : 'Enter Quran Station 📖',
        icon: BookOpen,
        badge: isAr ? 'المحطة 1 • نافذة الصباح الباكر' : 'Station 1 • Early Morning Window',
        badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      };
    }
    if (isForenoon || isNoon) {
      return {
        id: 'WORK_MICRO_SPRINT',
        title: isAr ? 'شوط التركيز والعمل العميق' : 'Deep Work & Focus Sprint',
        description: isAr
          ? 'إنجاز المهام ذات الأولوية القصوى، وتفعيل مؤقت التركيز (20 دقيقة) بلا مقاطعة.'
          : 'Crush high-priority tasks and activate the 20-minute zero-interruption focus sprint.',
        cta: isAr ? 'انطلق إلى شوط التركيز ⚡' : 'Start Focus Sprint ⚡',
        icon: Briefcase,
        badge: isAr ? 'المحطة 2 • ذروة الإنتاجية والإتقان' : 'Station 2 • Peak Productivity Window',
        badgeColor: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
      };
    }
    if (isAsr) {
      const movementCat =
        (typeof window !== 'undefined'
          ? localStorage.getItem('midmar_movement_cat')
          : 'gym') || 'gym';

      if (movementCat === 'combat') {
        return {
          id: 'GYM_ANCHOR',
          title: isAr
            ? '🥊 جولات الملاكمة والفنون القتالية مع السيرة'
            : 'Boxing & Combat Sports with Faith Stream',
          description: isAr
            ? 'مؤقت الجولات الاحترافي (ملاكمة / موي تاي / جيوجيتسو) مع أثير السيرة النبوية وبطولات الصحابة.'
            : 'Pro round timer & combat drills with prophetic biography stream.',
          cta: isAr ? 'انطلق إلى حلبة النزال 🥊' : 'Enter Combat Arena 🥊',
          icon: Dumbbell,
          badge: isAr ? 'المحطة 3 • حلبة القوة والشجاعة' : 'Station 3 • Combat Arena',
          badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        };
      }
      if (movementCat === 'football') {
        return {
          id: 'GYM_ANCHOR',
          title: isAr
            ? '⚽ مباراة كرة القدم والبادل واللياقة'
            : 'Football & Padel Match Tracker',
          description: isAr
            ? 'تسجيل الأهداف وصناعة اللعب، تقييم الأداء البدني وأثير الهمة العالية.'
            : 'Track goals, assists, match intensity and physical performance.',
          cta: isAr ? 'انطلق إلى سجل المباراة ⚽' : 'Track Match ⚽',
          icon: Dumbbell,
          badge: isAr ? 'المحطة 3 • مرساة اللياقة والمباريات' : 'Station 3 • Match Fitness',
          badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        };
      }
      if (movementCat === 'fitness_class') {
        return {
          id: 'GYM_ANCHOR',
          title: isAr
            ? '🔥 كلاس فيتنس وتدريب جماعي مكثف'
            : 'High-Intensity Fitness Class',
          description: isAr
            ? 'شوط حرق السعرات واللياقة العالية مع أثير السيرة النبوية والتحفيز.'
            : 'Cardio conditioning, calories burning and high energy faith stream.',
          cta: isAr ? 'انطلق إلى كلاس الفيتنس 🔥' : 'Start Fitness Class 🔥',
          icon: Dumbbell,
          badge: isAr ? 'المحطة 3 • حرق ودهون وهمة' : 'Station 3 • High Conditioning',
          badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
        };
      }

      return {
        id: 'GYM_ANCHOR',
        title: isAr
          ? '🏋️ النشاط البدني وأثير السيرة النبوية (الجيم)'
          : 'Strength Training & Faith Stream (Gym)',
        description: isAr
          ? 'صلاة العصر، تمارين الأوزان، وشحن العزيمة مع أثير السيرة النبوية والهمم العالية.'
          : 'Afternoon prayer, weightlifting routines & inspiring prophetic history.',
        cta: isAr ? 'انطلق إلى الجيم مع السيرة النبوية 🎙️' : 'Start Gym with Faith Stream 🎙️',
        icon: Dumbbell,
        badge: isAr ? 'المحطة 3 • مرساة القوة والهمة' : 'Station 3 • Strength Anchor',
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      };
    }
    if (isMaghrib) {
      return {
        id: 'EVENING_SPRINT',
        title: isAr ? 'شوط المساء والتعلم الذاتي' : 'Evening Sprint & Lifelong Learning',
        description: isAr
          ? 'صلاة المغرب، مشاريعك وتطلعاتك الشخصية، والقراءة والمطالعة النافعة.'
          : 'Maghrib prayer, personal high-leverage projects, and reflective reading.',
        cta: isAr ? 'انطلق إلى شوط المساء 💻' : 'Launch Evening Sprint 💻',
        icon: Laptop,
        badge: isAr ? 'المحطة 4 • جلسة البناء والتعلم' : 'Station 4 • Creative Build Session',
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      };
    }
    return {
      id: 'RETROSPECTIVE_CHECKIN',
      title: isAr ? 'مراجعة اليوم وسكينة الليل' : 'Daily Retrospective & Night Serenity',
      description: isAr
        ? 'تدوين الفكرة الذهبية، تقييم الإنجاز، سورة الملك، وأذكار النوم والاستشفاء.'
        : 'Capture the golden nugget, evaluate progress, recite Surah Mulk, and sleep adhkar.',
      cta: isAr ? 'انطلق إلى مراجعة اليوم 📊' : 'Start Retrospective 📊',
      icon: CheckCircle2,
      badge: isAr ? 'المحطة 5 • تفريغ الذهن والاستشفاء' : 'Station 5 • Cognitive Download & Recovery',
      badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    };
  }, [isFajrMorning, isForenoon, isNoon, isAsr, isMaghrib, isAr]);

  const streakDays = userState?.streakDays || 0;
  const totalPoints = userState?.totalPoints || 0;
  const shields = userState?.streakShields || 0;

  const [selectedWeekDateStr, setSelectedWeekDateStr] = useState<string | null>(null);
  const todayTadabburItem = useMemo(() => getDailyTadabburItem(0), []);

  // Compute 7-Day Horizontal Week Strip (Matches Habitline mobile-image.png & dashboard-09.png)
  const weekDaysStrip = useMemo(() => {
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dayOfWeek = now.getDay(); // 0 (Sun) .. 6 (Sat)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);

    const arDayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const enDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + idx);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isToday = dateStr === todayDateStr;
      const logForDay = isToday
        ? todayLog
        : allDailyLogs?.find((l) => l.date === dateStr);

      const prayersDoneCount = logForDay?.prayers
        ? Object.values(logForDay.prayers).filter(
            (p: any) => p?.status && p.status !== 'pending' && p.status !== 'missed'
          ).length
        : 0;
      const stationsDoneCount = logForDay?.completedStations?.length || 0;
      const xpEarned = logForDay?.pointsEarned || 0;

      const hasPrayerDone = prayersDoneCount > 0;
      const hasActivity = Boolean(
        logForDay &&
          (hasPrayerDone ||
            stationsDoneCount > 0 ||
            logForDay.quranWirdDone ||
            logForDay.adhkarMorningDone ||
            logForDay.adhkarEveningDone ||
            xpEarned > 0)
      );

      return {
        dateStr,
        dayNumber: d.getDate(),
        dayLabel: isAr ? arDayNames[idx] : enDayNames[idx],
        isToday,
        hasActivity,
        prayersDoneCount,
        stationsDoneCount,
        xpEarned,
        quranDone: Boolean(logForDay?.quranWirdDone),
      };
    });
  }, [now, todayLog, allDailyLogs, isAr]);

  const inspectedWeekDay = useMemo(() => {
    if (!selectedWeekDateStr) return null;
    return weekDaysStrip.find((d) => d.dateStr === selectedWeekDateStr) || null;
  }, [selectedWeekDateStr, weekDaysStrip]);

  // Compute Daily Prayers & Routine Progress for SVG Circular Rings (Matches mobile-image.png)
  const completedPrayersToday = useMemo(() => {
    const pMap = todayLog?.prayers || {};
    return (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).filter((pn) => {
      const rec = pMap[pn];
      return (
        rec &&
        (rec.status === 'on_time' ||
          rec.status === 'in_group' ||
          rec.status === 'late' ||
          rec.status === 'excused')
      );
    }).length;
  }, [todayLog?.prayers]);

  const prayersPercent = Math.round((completedPrayersToday / 5) * 100);

  const prayersDoneMap = useMemo(() => {
    const pMap = todayLog?.prayers || {};
    const isDone = (pn: PrayerKey) => {
      const rec = pMap[pn];
      return Boolean(
        rec &&
          (rec.status === 'on_time' ||
            rec.status === 'in_group' ||
            rec.status === 'late' ||
            rec.status === 'excused')
      );
    };
    return {
      fajr: isDone('fajr'),
      dhuhr: isDone('dhuhr'),
      asr: isDone('asr'),
      maghrib: isDone('maghrib'),
      isha: isDone('isha'),
    } as Record<PrayerKey, boolean>;
  }, [todayLog?.prayers]);

  const isAdhkarDoneToday = Boolean(
    isMorningTime ? todayLog?.adhkarMorningDone : todayLog?.adhkarEveningDone
  );
  const isWorkSprintDone = completedStations.includes('WORK_MICRO_SPRINT');
  const isGymDone = completedStations.includes('GYM_ANCHOR');

  const completedRoutineToday = useMemo(() => {
    let count = 0;
    if (todayLog?.quranWirdDone) count += 1;
    if (isAdhkarDoneToday) count += 1;
    if (isWorkSprintDone) count += 1;
    if (isGymDone) count += 1;
    if (todayLog?.surahMulkDone || todayLog?.fastingDone) count += 1;
    return count;
  }, [
    todayLog?.quranWirdDone,
    isAdhkarDoneToday,
    isWorkSprintDone,
    isGymDone,
    todayLog?.surahMulkDone,
    todayLog?.fastingDone,
  ]);

  const routinePercent = Math.round((completedRoutineToday / 5) * 100);


  const triggerHabitConfetti = (tapEvent?: React.MouseEvent) => {
    try {
      const originX =
        tapEvent && typeof window !== 'undefined'
          ? tapEvent.clientX / window.innerWidth
          : 0.5;
      const originY =
        tapEvent && typeof window !== 'undefined'
          ? tapEvent.clientY / window.innerHeight
          : 0.55;
      confetti({
        particleCount: 28,
        spread: 65,
        origin: { x: originX, y: originY },
        colors: ['#1eb814', '#22c55e', '#ff5500', '#7c3aed', '#f59e0b'],
        disableForReducedMotion: true,
      });
    } catch {}
  };

  // Context-Aware Smart Next-Best-Action Engine (Impeccable Clarify Pass)
  const smartNextAction = useMemo(() => {
    if (!todayLog?.quranWirdDone) {
      return {
        label: isAr ? '🤖 مقترح الآن: أتمم صفحة الورد القرآني (+25\u00A0ن)' : '🤖 Next: Complete Quran Wird (+25 XP)',
        onTrigger: () => handleOpenQuranTracker(),
      };
    }
    if (!isAdhkarDoneToday) {
      return {
        label: isMorningTime
          ? isAr
            ? '🤖 مقترح الآن: حصّن يومك بأذكار الصباح (+20ن)'
            : '🤖 Next: Morning Adhkar (+20 XP)'
          : isAr
          ? '🤖 مقترح الآن: أذكار المساء وحصن المسلم (+20ن)'
          : '🤖 Next: Evening Adhkar (+20 XP)',
        onTrigger: () => handleOpenAdhkar(isMorningTime ? 'morning' : 'evening'),
      };
    }
    if (!isWorkSprintDone) {
      return {
        label: isAr ? '🤖 مقترح الآن: ابدأ شوط التركيز ٢٠د (+15\u00A0ن)' : '🤖 Next: 20m Focus Sprint (+15 XP)',
        onTrigger: () => onSelectStation('WORK_MICRO_SPRINT'),
      };
    }
    if (!isGymDone) {
      return {
        label: isAr ? '🤖 مقترح الآن: انطلق لمرساة الرياضة (+20\u00A0ن)' : '🤖 Next: Sport Anchor (+20 XP)',
        onTrigger: () => onSelectStation('GYM_ANCHOR'),
      };
    }
    if (!todayLog?.surahMulkDone) {
      return {
        label: isAr ? '🤖 مقترح الآن: تلاوة سورة الملك المنجية (+30\u00A0ن)' : '🤖 Next: Recite Surah Mulk (+30 XP)',
        onTrigger: () => setIsHomeSurahMulkOpen(true),
      };
    }
    return {
      label: isAr ? '🌟 اكتملت أورادك! افتح حصاد البركة' : '🌟 All Done! View Weekly Report',
      onTrigger: () => setIsWeeklyReportOpen(true),
    };
  }, [
    todayLog?.quranWirdDone,
    isAdhkarDoneToday,
    isMorningTime,
    isWorkSprintDone,
    isGymDone,
    todayLog?.surahMulkDone,
    isAr,
  ]);

  const reduceMotionPref =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const [externalTriggerPrayer, setExternalTriggerPrayer] = useState<{
    prayer: PrayerKey;
    nonce: number;
  } | null>(null);

  const triggerPrayerModal = (specificPrayer?: PrayerKey) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setActiveQuickSection('today');
    const order: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const fallbackPrayer =
      order.find((p) => !prayersDoneMap[p]) ||
      (now.getHours() < 6
        ? 'fajr'
        : now.getHours() < 15
        ? 'dhuhr'
        : now.getHours() < 18
        ? 'asr'
        : now.getHours() < 20
        ? 'maghrib'
        : 'isha');
    const targetPrayer = specificPrayer || fallbackPrayer;
    setExternalTriggerPrayer({ prayer: targetPrayer, nonce: Date.now() });
    setTimeout(() => {
      document
        .getElementById('section-prayers')
        ?.scrollIntoView({ behavior: reduceMotionPref ? 'auto' : 'smooth', block: 'center' });
    }, 60);
  };

  const activatePrayers = () => {
    triggerPrayerModal();
  };

  const activateRoutine = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsWeeklyReportOpen(true);
  };

  // Never cut scripture mid-ayah: keep whole ayat (split on the end-of-ayah mark) up to a budget.
  // Avoid regex lookbehind (?<=...) so older WebKit/Safari engines never throw SyntaxError.
  const ayahDisplay = useMemo(() => {
    const text = todayTadabburItem.quran.arabicText;
    const rawMatches = text.match(/[^\u06DD]+(?:\u06DD[\u0660-\u0669\d]*)?/g);
    const parts = rawMatches ? rawMatches.map((s) => s.trim()).filter(Boolean) : [text];
    let out = '';
    for (const p of parts) {
      if (out && (out + ' ' + p).length > 150) break;
      out = out ? out + ' ' + p : p;
    }
    return out || text;
  }, [todayTadabburItem.quran.arabicText]);
  return (
    <div id="section-top" className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* ================================================================= */}
      {/* 1. CELESTIAL OBSIDIAN STAGE: PRAYER ARC + 7-DAY WEEK STRIP        */}
      {/* Approved Unified Hybrid identity (council-reviewed)               */}
      {/* ================================================================= */}
      <div className="celestial-obsidian-stage celestial-stage-curve relative overflow-hidden text-white p-4 sm:p-6 pb-14 sm:pb-14 border border-white/10 space-y-3">
        {/* Top Row: Live Time + Hijri Date + Monthly Goals Pill */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                if (onOpenLocationModal) onOpenLocationModal();
                else triggerPrayerModal();
              }}
              title={isAr ? 'ضبط الموقع ومواقيت الصلاة' : 'Configure Location & Prayer Times'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] font-semibold text-white tabular-nums cursor-pointer active:scale-95 transition-all"
            >
              {isNight ? (
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
              <bdi dir="ltr">
                {now.toLocaleTimeString(isAr ? 'ar-EG-u-nu-latn' : 'en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </bdi>
            </button>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsFastingModalOpen(true);
              }}
              title={isAr ? 'التقويم الهجري وصيام التطوع' : 'Hijri Calendar & Voluntary Fasting'}
              className="px-2.5 py-1 rounded-full hover:bg-white/10 text-[11px] leading-[1.7] font-medium text-zinc-200 whitespace-nowrap cursor-pointer active:scale-95 transition-all"
            >
              <bdi>{hijriInfo.formattedAr.replace(/\s+هـ$/, '\u00A0هـ')}</bdi>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenMonthlyEvaluation || onOpenEvaluation}
            className="touch-target h-9 px-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[11px] font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
          >
            <TargetIcon className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span>{isAr ? 'تحديات الشهر' : 'Monthly Goals'}</span>
          </button>
        </div>

        {/* Desktop Dignified Greeting */}
        <div className="hidden sm:block space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white">{greeting}</h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">{motivationalMessage}</p>
        </div>

        {/* Celestial Prayer Arc — sun/moon path across the five prayers */}
        <CelestialPrayerArc
          now={now}
          doneMap={prayersDoneMap}
          isAr={isAr}
          onSelectPrayer={(p) => triggerPrayerModal(p)}
        />

        {/* 7-Day Horizontal Week Calendar Strip (Interactive Day Inspector) */}
        <div className="grid grid-cols-7 gap-0 pt-1">
          {weekDaysStrip.map((day) => {
            const isSelectedDay = selectedWeekDateStr === day.dateStr;
            return (
              <button
                key={day.dateStr}
                type="button"
                aria-pressed={isSelectedDay}
                aria-label={`${day.dayLabel} ${day.dayNumber}`}
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setSelectedWeekDateStr((prev) =>
                    prev === day.dateStr ? null : day.dateStr
                  );
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer select-none rounded-2xl min-h-[44px] px-0 focus-visible:outline-offset-4"
                title={
                  isAr
                    ? `اضغط لعرض حصاد يوم ${day.dayLabel} (${day.dateStr})`
                    : `Tap to inspect ${day.dayLabel} (${day.dateStr})`
                }
              >
                <div
                  className={`relative w-full max-w-[2.5rem] h-11 sm:h-12 rounded-2xl flex items-center justify-center text-xs sm:text-sm font-bold tabular-nums transition-all ${
                    isSelectedDay
                      ? 'bg-gradient-to-b from-[#1fb23a] to-[#0d7a2a] text-white ring-2 ring-emerald-300 shadow-lg scale-105'
                      : day.isToday
                      ? 'bg-gradient-to-b from-[#16a34a] to-[#0b6b27] text-white ring-2 ring-white/80 ring-offset-1 ring-offset-[#101113] shadow-lg scale-105'
                      : day.hasActivity
                      ? 'bg-gradient-to-b from-emerald-700/80 to-emerald-900/90 text-white border border-emerald-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
                      : 'bg-gradient-to-b from-emerald-800/70 to-emerald-950/90 border border-emerald-400/25 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] group-hover:from-emerald-700/70'
                  }`}
                >
                  <span>{day.dayNumber}</span>

                  {/* Green Checkmark Badge on Completed Days */}
                  {day.hasActivity && !day.isToday && !isSelectedDay && (
                    <span className="absolute -top-0.5 -end-0.5 w-4 h-4 rounded-full bg-[#22c55e] text-zinc-950 flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <span
                  className={`text-[11px] leading-[1.7] whitespace-nowrap ${
                    isSelectedDay
                      ? 'text-[#22c55e] font-bold'
                      : day.isToday
                      ? 'text-white font-bold'
                      : 'text-white/60 font-medium'
                  }`}
                >
                  {day.dayLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive Day Snapshot Drawer with Framer Motion AnimatePresence */}
        <AnimatePresence>
          {inspectedWeekDay && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="p-3 rounded-[20px] bg-white/10 border border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-habit-green-ink text-white font-bold text-[11px]">
                  {inspectedWeekDay.isToday
                    ? isAr
                      ? `اليوم (${inspectedWeekDay.dayLabel})`
                      : `Today (${inspectedWeekDay.dayLabel})`
                    : `${inspectedWeekDay.dayLabel} ${inspectedWeekDay.dayNumber}`}
                </span>
                <span className="text-zinc-200 font-medium">
                  🕌 <bdi dir="ltr">{inspectedWeekDay.prayersDoneCount}/5</bdi> {isAr ? 'صلوات' : 'Prayers'}
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-200 font-medium">
                  ⚡ {inspectedWeekDay.stationsDoneCount} {isAr ? 'محطات' : 'Stations'}
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-amber-300 font-bold">
                  ✨ <bdi dir="ltr">+{inspectedWeekDay.xpEarned}</bdi> {isAr ? 'نقطة' : 'XP'}
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenEvaluation}
                className="touch-target px-3 py-1.5 rounded-full bg-white text-zinc-950 font-bold text-[11px] cursor-pointer active:scale-95 transition-transform"
              >
                {isAr ? 'تقييم ومراجعة اليوم ←' : 'Review Day →'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Integrated 1-Tap Current Station Launch Pill inside the Dark Stage */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            onSelectStation(currentSuggestedStation.id);
          }}
          className="w-full max-w-[94%] mx-auto p-2 sm:p-2.5 rounded-[28px] bg-gradient-to-b from-[#1a8f35] to-[#0e5a24] hover:brightness-110 border border-emerald-300/30 shadow-[0_8px_22px_-6px_rgba(30,184,20,0.5)] flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.97] text-start"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-habit-green-ink text-white flex items-center justify-center shrink-0 shadow-md ring-1 ring-habit-green/40">
              <currentSuggestedStation.icon className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold text-emerald-100 leading-[1.7]">
                {currentSuggestedStation.badge}
              </span>
              <span className="block text-sm font-bold text-white leading-snug line-clamp-2 text-balance">
                {currentSuggestedStation.title}
              </span>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-bold shrink-0 shadow-sm">
            {isAr ? 'ابدأ الآن ←' : 'Start →'}
          </span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* 2. RING CARDS + MIHRAB VERSE + AMBER FOCUS/AUDIO (bento grid)     */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-12 lg:gap-4">
        {/* Lavender — Today's Prayers (opens prayer logging modal immediately) */}
        <div
          role="button"
          tabIndex={0}
          aria-label={
            isAr
              ? `صلوات اليوم: ${completedPrayersToday} من 5. اضغط لتسجيل الفرائض`
              : `Today's prayers: ${completedPrayersToday} of 5. Tap to log prayers`
          }
          onClick={activatePrayers}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              activatePrayers();
            }
          }}
          className="bento-3d-lavender bento-press col-span-1 lg:col-span-3 rounded-[26px] border border-white/50 dark:border-indigo-500/25 p-3.5 flex flex-col items-center gap-2 text-center cursor-pointer"
        >
          <div className="relative w-[104px] h-[104px] flex items-center justify-center" aria-hidden="true">
            <svg className="w-[104px] h-[104px] -rotate-90 overflow-visible" viewBox="0 0 100 100">
              <GlowRing
                r={38}
                width={12}
                percent={prayersPercent}
                color="#7c3aed"
                trackClassName="text-[#6d28d9]/20 dark:text-white/15"
                glowClassName="ring-glow-violet"
              />
            </svg>
            <bdi dir="ltr" className="absolute inline-flex items-baseline leading-none text-indigo-950 dark:text-white tabular-nums">
              <span className="text-[28px] font-bold">{completedPrayersToday}</span>
              <span className="text-[15px] font-semibold opacity-60">/5</span>
            </bdi>
          </div>
          <span className="block text-xs font-bold text-zinc-800 dark:text-indigo-100">
            {isAr ? 'صلوات اليوم' : 'Today Prayers'}
          </span>
          <span className="touch-target-y inline-flex items-center gap-1 text-[11px] leading-[1.7] font-semibold text-indigo-950 dark:text-indigo-200 px-2.5 min-h-[28px] rounded-full bg-white/60 dark:bg-white/10">
            <Landmark className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'سجّل الفرائض ←' : 'Log Prayers →'}</span>
          </span>
        </div>

        {/* Rose — Dual ring: outer flame = monthly streak, inner emerald = today's routine */}
        <div
          role="button"
          tabIndex={0}
          aria-label={
            isAr
              ? `شعلة الالتزام ${streakDays} من 30، وروتين اليوم ${completedRoutineToday} من 5، ${shields} دروع. اضغط لفتح الحصاد`
              : `Streak ${streakDays} of 30, today routine ${completedRoutineToday} of 5, ${shields} shields. Tap to open the report`
          }
          onClick={activateRoutine}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              activateRoutine();
            }
          }}
          className="bento-3d-rose bento-press col-span-1 lg:col-span-3 rounded-[26px] border border-white/50 dark:border-rose-500/25 p-3.5 flex flex-col items-center gap-2 text-center cursor-pointer"
        >
          <div className="relative w-[104px] h-[104px] flex items-center justify-center" aria-hidden="true">
            <svg className="w-[104px] h-[104px] -rotate-90 overflow-visible" viewBox="0 0 100 100">
              <GlowRing
                r={42}
                width={9}
                percent={Math.min(100, (streakDays / 30) * 100)}
                color="#cc4400"
                trackClassName="text-[#be123c]/20 dark:text-white/15"
                glowClassName="ring-glow-flame"
                delay={0.08}
              />
              <GlowRing
                r={29}
                width={9}
                percent={routinePercent}
                color="#138508"
                trackClassName="text-[#be123c]/20 dark:text-white/15"
                glowClassName="ring-glow-emerald"
                delay={0.16}
              />
            </svg>
            <bdi dir="ltr" className="absolute inline-flex items-baseline leading-none text-rose-950 dark:text-white tabular-nums">
              <span className="text-[22px] font-bold">{completedRoutineToday}</span>
              <span className="text-[12px] font-semibold opacity-60">/5</span>
            </bdi>
          </div>
          <span className="block text-xs font-bold text-zinc-800 dark:text-rose-100">
            {isAr ? 'شعلة الالتزام والروتين' : 'Streak & Routine'}
          </span>
          <span className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="touch-target-y inline-flex items-center gap-1 text-[11px] leading-[1.7] font-semibold text-rose-950 dark:text-rose-200 px-2.5 min-h-[28px] rounded-full bg-white/60 dark:bg-white/10">
              <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                <bdi dir="ltr">{totalPoints}</bdi>
                {isAr ? '\u00A0نقطة' : ' XP'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-950 dark:text-rose-200 px-2 min-h-[28px] rounded-full bg-white/60 dark:bg-white/10">
              <Shield className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
              <bdi dir="ltr">{shields}</bdi>
            </span>
          </span>
        </div>

        {/* Emerald-gold mihrab verse card, framed by a soft mint panel */}
        <div className="bento-3d-mint col-span-2 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:row-span-2 rounded-[28px] border border-white/50 dark:border-emerald-500/25 p-3">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              if (onOpenTadabburModal) {
                onOpenTadabburModal(todayTadabburItem, 'quran');
              } else {
                setActiveQuickSection('spiritual');
              }
            }}
            aria-label={isAr ? 'آية وتدبر اليوم: اضغط لقراءة التفسير' : "Today's ayah: tap to read the tafsir"}
            className="bento-press relative w-full lg:h-full text-center flex flex-col items-center justify-center gap-1 cursor-pointer drop-shadow-[0_14px_22px_rgba(16,185,129,0.30)]"
          >
            {/* Pointed (ogee) mihrab silhouette with a double gold border */}
            <svg
              className="absolute inset-0 w-full h-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="mhFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1b9a4a" />
                  <stop offset="45%" stopColor="#064e3b" />
                  <stop offset="100%" stopColor="#042f2e" />
                </linearGradient>
                <linearGradient id="mhGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fde68a" />
                  <stop offset="55%" stopColor="#d4a017" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
              </defs>
              <path
                d="M1.5 97 V40 C1.5 31 9 28 19 22 C33 14 43 8 50 1.5 C57 8 67 14 81 22 C91 28 98.5 31 98.5 40 V97 C98.5 98.5 97.5 99 96 99 H4 C2.5 99 1.5 98.5 1.5 97 Z"
                fill="url(#mhFill)"
                stroke="url(#mhGold)"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
              <g transform="translate(3 3) scale(0.94)">
                <path
                  d="M1.5 97 V40 C1.5 31 9 28 19 22 C33 14 43 8 50 1.5 C57 8 67 14 81 22 C91 28 98.5 31 98.5 40 V97 C98.5 98.5 97.5 99 96 99 H4 C2.5 99 1.5 98.5 1.5 97 Z"
                  fill="none"
                  stroke="url(#mhGold)"
                  strokeOpacity="0.6"
                  strokeWidth="1.2"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            </svg>

            <div className="relative px-6 pt-[20%] pb-5 flex flex-col items-center gap-1">
              <span
                dir="rtl"
                lang="ar"
                className="text-[17px] font-normal text-amber-200 tashkeel-text font-quran"
              >
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </span>
              <span
                dir="rtl"
                lang="ar"
                className={`text-[16px] lg:text-lg font-normal text-[#fffbeb] tashkeel-text font-quran text-balance ${
                  ayahDisplay.length > 170
                    ? 'max-h-[11.5rem] overflow-hidden [mask-image:linear-gradient(#000_78%,transparent)]'
                    : ''
                }`}
              >
                ﴿{ayahDisplay}﴾
              </span>
              <span className="text-xs font-semibold text-amber-100 flex items-center gap-1.5 mt-1">
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'آية وتدبر اليوم' : 'Daily Ayah'}</span>
                <span aria-hidden="true">•</span>
                <span>{todayTadabburItem.quran.surahName}</span>
                <span aria-hidden="true">{isAr ? '←' : '→'}</span>
              </span>
            </div>
          </button>
        </div>

        {/* Amber focus sprint dial + prophetic audio waveform */}
        <div className="bento-3d-amber col-span-2 lg:col-span-6 rounded-[28px] border border-white/50 dark:border-amber-500/25 p-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onSelectStation('WORK_MICRO_SPRINT');
            }}
            className="bento-press relative w-24 h-24 shrink-0 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center cursor-pointer"
            aria-label={isAr ? 'ابدأ شوط التركيز 20 دقيقة' : 'Start the 20-minute focus sprint'}
          >
            <svg className="absolute inset-0 w-24 h-24 -rotate-90 overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
              <GlowRing
                r={44}
                width={6}
                percent={isWorkSprintDone ? 100 : 25}
                color="#a33600"
                trackClassName="text-amber-900/15 dark:text-amber-200/20"
                glowClassName=""
                minDot={false}
              />
            </svg>
            <span className="relative flex flex-col items-center text-amber-950 dark:text-amber-100">
              <bdi dir="ltr" className="text-3xl font-bold tabular-nums leading-none">20</bdi>
              <span className="text-xs font-semibold leading-[1.6] mt-0.5">{isAr ? 'دقيقة' : 'min'}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              if (onOpenFaithAudio) onOpenFaithAudio();
              else onSelectStation('GYM_ANCHOR');
            }}
            className="touch-target flex-1 min-w-0 min-h-[44px] flex flex-col items-stretch gap-1.5 cursor-pointer text-start"
            aria-pressed={faithPlaying}
            aria-label={
              isAr
                ? faithPlaying
                  ? 'أثير السيرة النبوية يعمل الآن: اضغط للفتح'
                  : 'افتح أثير السيرة النبوية'
                : faithPlaying
                ? 'Prophetic audio is playing: tap to open'
                : 'Open prophetic audio'
            }
          >
            <span dir="ltr" className="flex items-center justify-center gap-[3px] h-14" aria-hidden="true">
              {WAVE_BARS.map((h, i) => (
                <span
                  key={i}
                  className={`wave-bar w-[2px] shrink-0 rounded-full bg-amber-900/80 dark:bg-amber-300/80 ${
                    faithPlaying ? 'wave-bar-play' : 'opacity-60'
                  }`}
                  style={
                    {
                      height: h,
                      '--d': `${900 + (i % 5) * 130}ms`,
                      '--dl': `-${i * 70}ms`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </span>
            <span className="text-xs font-bold text-amber-950 dark:text-amber-100 text-center">
              {isAr ? 'أثير السيرة النبوية' : 'Prophetic audio'}
            </span>
          </button>
        </div>

        {/* Notification permission nudge: slim row below the hero content, never above the fold */}
        {notificationSlot ? <div className="col-span-2 lg:col-span-12">{notificationSlot}</div> : null}
      </div>

      {/* ================================================================= */}
      {/* 3. HABITLINE "ROUTINE STACKS" PASTEL CARDS WITH LAYOUT-ID RING     */}
      {/* ================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
            {isAr ? 'مجموعات الروتين' : 'Routine Stacks'}
          </h2>
          {onOpenLifestyleModal && (
            <button
              type="button"
              onClick={onOpenLifestyleModal}
              className="px-3 py-1.5 rounded-full surface-card-3d border border-zinc-200/80 dark:border-white/10 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer shadow-2xs"
            >
              {isAr ? 'تخصيص النمط ⚙️' : 'Persona ⚙️'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            {
              id: 'today',
              badge: isAr ? '٥ صلوات + ٥ مهام' : '5 Prayers + 5 Habits',
              badgeBg: 'bg-habit-green-ink text-white',
              cardBg: 'bento-3d-mint border-white/50 dark:border-emerald-500/25',
              title: isAr ? 'روتين ومواقيت اليوم' : "Today's Routine",
              sub: isAr ? 'الفرائض والأوراد الأساسية' : 'Prayers & Core Habits',
            },
            {
              id: 'stations',
              badge: isAr
                ? `${completedStations.length}/${allStationIds.length} محطات`
                : `${completedStations.length}/${allStationIds.length} Stations`,
              badgeBg: 'bg-[#5448e8] text-white',
              cardBg: 'bento-3d-lavender border-white/50 dark:border-indigo-500/25',
              title: isAr ? 'خريطة المحطات' : 'Lifestyle Stations',
              sub: isAr ? 'التركيز، العمل، والرياضة' : 'Focus, Work & Gym',
            },
            {
              id: 'spiritual',
              badge: isAr ? '٤ أبواب' : '4 Portals',
              badgeBg: 'bg-[#a824e0] text-white',
              cardBg: 'bento-3d-rose border-white/50 dark:border-rose-500/25',
              title: isAr ? 'المحراب والتدبر' : 'Sacred Sanctuary',
              sub: isAr ? 'القرآن، الأذكار، والأثير' : 'Quran, Adhkar & Audio',
            },
            {
              id: 'growth',
              badge: isAr ? 'اللغات والحكمة' : 'Growth',
              badgeBg: 'bg-habit-flame-ink text-white',
              cardBg: 'bento-3d-amber border-white/50 dark:border-amber-500/25',
              title: isAr ? 'اللغات والشعر' : 'Languages & Wisdom',
              sub: isAr ? 'المفردات، الشعر، والنماذج' : 'Vocab, Poetry & Models',
            },
          ].map((stack) => {
            const isSelected = activeQuickSection === stack.id;
            return (
              <motion.button
                key={stack.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setActiveQuickSection(stack.id);
                }}
                className={`relative p-3.5 rounded-[24px] border text-start transition-all cursor-pointer ${
                  stack.cardBg
                } ${isSelected ? 'shadow-md' : 'opacity-90 hover:opacity-100'}`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="habitline-stack-active-ring"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-[24px] ring-2 ring-[#141517] dark:ring-white pointer-events-none"
                  />
                )}
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${stack.badgeBg}`}
                >
                  {stack.badge}
                </span>
                <span className="block text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mt-2 truncate">
                  {stack.title}
                </span>
                <span className="block text-[11px] text-zinc-600 dark:text-zinc-300 mt-0.5 truncate">
                  {stack.sub}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: TODAY'S ROUTINE & PRAYERS (mobile-image.png & dashboard-07) */}
      {/* ================================================================= */}
      {activeQuickSection === 'today' && (
        <div className="space-y-4 animate-fade-in">
          {/* 1.1 Official 5-Prayer Strip */}
          <PrayerTimesBar
            todayLog={todayLog}
            userState={userState}
            onOpenLocationModal={onOpenLocationModal}
            onRewardToast={onRewardToast}
            onOpenSmartTasbih={onOpenSmartTasbih}
            externalTriggerPrayer={externalTriggerPrayer}
          />

          {/* 1.2 "Today's routine" (روتين اليوم) — Exact mobile-image.png & dashboard-07.png */}
          <div id="section-routine" className="space-y-2.5">
            {/* Section Header with Context-Aware AI Next-Best-Action Pill */}
            <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                {isAr ? 'روتين اليوم' : "Today's routine"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  smartNextAction.onTrigger();
                }}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#10b981] text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <span>{smartNextAction.label}</span>
              </button>
            </div>

            {/* Clean 1-Tap Habit Cards (3D Mint when done, 3D Tactile Surface when pending) */}
            <div className="space-y-2.5">
              {/* Habit 1: Daily Quran Wird */}
              <div
                onClick={handleOpenQuranTracker}
                className={`rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  todayLog?.quranWirdDone
                    ? 'bento-3d-mint border-[#22c55e]/50'
                    : 'surface-card-3d border-zinc-200/80 dark:border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    triggerHabitConfetti(e);
                    soundSynth.playStreakMilestoneChime();
                    haptic.vibrateSprintCelebration();
                    const wasAlreadyDone = Boolean(todayLog?.quranWirdDone);
                    await handleQuickIncrementQuran();
                    if (!wasAlreadyDone) {
                      const res = await awardSpiritualHabitPoints(
                        'wird' as any,
                        isAr ? 'الورد القرآني اليومي' : 'Daily Quran Wird'
                      );
                      if (res.message) onRewardToast(res.message);
                    }
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 ${
                    todayLog?.quranWirdDone
                      ? 'bg-habit-green-ink text-white shadow-2xs'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-habit-green-ink hover:text-white'
                  }`}
                  title={isAr ? 'إتمام صفحة من الورد القرآني (+25 XP)' : 'Complete Quran Wird (+25 XP)'}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {quranProgress?.surah
                      ? quranProgress.surah.startsWith('سورة')
                        ? quranProgress.surah
                        : `سورة ${quranProgress.surah}`
                      : isAr
                      ? 'الورد القرآني اليومي'
                      : 'Daily Quran Wird'}
                  </span>
                  <span
                    className={`block text-xs truncate mt-0.5 ${
                      todayLog?.quranWirdDone
                        ? 'text-zinc-700 dark:text-emerald-200/80'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {isAr
                      ? `تلاوة القرآن الكريم • صفحة ${currentWirdPages} من ${totalWirdPages}`
                      : `Quran Recitation • Page ${currentWirdPages} of ${totalWirdPages}`}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    todayLog?.quranWirdDone
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200'
                      : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {todayLog?.quranWirdDone
                    ? isAr
                      ? 'اليوم ✓'
                      : 'Today ✓'
                    : isAr
                    ? `ص ${currentWirdPages}`
                    : `p.${currentWirdPages}`}
                </span>
              </div>

              {/* Habit 2: Morning / Evening Adhkar */}
              <div
                onClick={() => handleOpenAdhkar(isMorningTime ? 'morning' : 'evening')}
                className={`rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  isAdhkarDoneToday
                    ? 'bento-3d-mint border-[#22c55e]/50'
                    : 'surface-card-3d border-zinc-200/80 dark:border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (isAdhkarDoneToday) {
                      handleOpenAdhkar(isMorningTime ? 'morning' : 'evening');
                      return;
                    }
                    triggerHabitConfetti(e);
                    soundSynth.playStreakMilestoneChime();
                    haptic.vibrateWorkDone();
                    const habitKey = isMorningTime ? 'adhkar_morning' : 'adhkar_evening';
                    const habitLabel = isMorningTime
                      ? 'أذكار الصباح المباركة'
                      : 'أذكار المساء وحصن المسلم';
                    const res = await awardSpiritualHabitPoints(habitKey, habitLabel);
                    onRewardToast(
                      res.message ||
                        (isAr
                          ? 'تم تسجيل الأذكار بنجاح (+20 نقطة)'
                          : 'Adhkar recorded (+20 pts)')
                    );
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 ${
                    isAdhkarDoneToday
                      ? 'bg-habit-green-ink text-white shadow-2xs'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-habit-green-ink hover:text-white'
                  }`}
                  title={isAr ? 'تسجيل الأذكار فوراً (+20 XP)' : 'Complete Adhkar (+20 XP)'}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {isMorningTime
                      ? isAr
                        ? 'أذكار الصباح وحصن المسلم'
                        : 'Morning Adhkar'
                      : isAr
                      ? 'أذكار المساء وحصن المسلم'
                      : 'Evening Adhkar'}
                  </span>
                  <span
                    className={`block text-xs truncate mt-0.5 ${
                      isAdhkarDoneToday
                        ? 'text-zinc-700 dark:text-emerald-200/80'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {isAr
                      ? 'اضغط لفتح القارئ التفاعلي والعداد'
                      : 'Tap to open interactive Adhkar reader'}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    isAdhkarDoneToday
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200'
                      : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {isAdhkarDoneToday
                    ? isAr
                      ? 'اليوم ✓'
                      : 'Today ✓'
                    : isMorningTime
                    ? isAr
                      ? 'صباحاً ☀️'
                      : 'AM ☀️'
                    : isAr
                    ? 'مساءً 🌙'
                    : 'PM 🌙'}
                </span>
              </div>

              {/* Habit 3: Deep Work Micro-Sprint (20m) */}
              <div
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  onSelectStation('WORK_MICRO_SPRINT');
                }}
                className={`rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  isWorkSprintDone
                    ? 'bento-3d-mint border-[#22c55e]/50'
                    : 'surface-card-3d border-zinc-200/80 dark:border-white/10'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isWorkSprintDone
                      ? 'bg-habit-green-ink text-white shadow-2xs'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {isAr ? 'شوط التركيز والعمل العميق' : 'Deep Work Micro-Sprint'}
                  </span>
                  <span
                    className={`block text-xs truncate mt-0.5 ${
                      isWorkSprintDone
                        ? 'text-zinc-700 dark:text-emerald-200/80'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {isAr
                      ? '٢٠ دقيقة تركيز خالص بلا مقاطعة (+١٥ نقطة)'
                      : '20m zero-distraction focus session (+15 XP)'}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    isWorkSprintDone
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200'
                      : 'bg-sky-500/15 text-sky-800 dark:text-sky-300'
                  }`}
                >
                  {isWorkSprintDone ? (isAr ? 'اليوم ✓' : 'Today ✓') : isAr ? '٢٠ د ⚡' : '20m ⚡'}
                </span>
              </div>

              {/* Habit 4: Daily Physical & Sport Anchor */}
              <div
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  onSelectStation('GYM_ANCHOR');
                }}
                className={`rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  isGymDone
                    ? 'bento-3d-mint border-[#22c55e]/50'
                    : 'surface-card-3d border-zinc-200/80 dark:border-white/10'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isGymDone
                      ? 'bg-habit-green-ink text-white shadow-2xs'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {isAr ? 'مرساة النشاط البدني والرياضة' : 'Daily Physical & Sport Anchor'}
                  </span>
                  <span
                    className={`block text-xs truncate mt-0.5 ${
                      isGymDone
                        ? 'text-zinc-700 dark:text-emerald-200/80'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {isAr
                      ? 'تمارين القوة واللياقة مع أثير السيرة النبوية'
                      : 'Strength & conditioning with prophetic biography audio'}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    isGymDone
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200'
                      : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {isGymDone ? (isAr ? 'اليوم ✓' : 'Today ✓') : isAr ? 'تمرين 🏋️' : 'Gym 🏋️'}
                </span>
              </div>

              {/* Habit 5: Surah Al-Mulk (Night Protection) — Dual 1-Tap Check + Reader Modal */}
              <div
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsHomeSurahMulkOpen(true);
                }}
                className={`rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  todayLog?.surahMulkDone
                    ? 'bento-3d-mint border-[#22c55e]/50'
                    : 'surface-card-3d border-zinc-200/80 dark:border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (todayLog?.surahMulkDone) {
                      setIsHomeSurahMulkOpen(true);
                      return;
                    }
                    triggerHabitConfetti(e);
                    soundSynth.playStreakMilestoneChime();
                    haptic.vibrateSprintCelebration();
                    const res = await awardSpiritualHabitPoints(
                      'mulk',
                      isAr ? 'سورة الملك المنجية' : 'Surah Al-Mulk'
                    );
                    if (res.message) onRewardToast(res.message);
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 ${
                    todayLog?.surahMulkDone
                      ? 'bg-habit-green-ink text-white shadow-2xs'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-habit-green-ink hover:text-white'
                  }`}
                  title={isAr ? 'تسجيل قراءة سورة الملك فوراً (+30 XP)' : '1-Tap log Surah Mulk (+30 XP)'}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {isAr ? 'سورة الملك (المنجية قبل النوم)' : 'Surah Al-Mulk (Night Protection)'}
                  </span>
                  <span
                    className={`block text-xs truncate mt-0.5 ${
                      todayLog?.surahMulkDone
                        ? 'text-zinc-700 dark:text-emerald-200/80'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {isAr ? '٣٠ آية تشفع لصاحبها وتنير ليلته • اضغط للقراءة' : '30 verses before sleep • Tap to read'}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    todayLog?.surahMulkDone
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200'
                      : 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300'
                  }`}
                >
                  {todayLog?.surahMulkDone
                    ? isAr
                      ? 'اليوم ✓'
                      : 'Today ✓'
                    : isAr
                    ? 'تلاوة 🌙'
                    : 'Read 🌙'}
                </span>
              </div>

              {/* Habit 6: Sunnah Fasting — Dual 1-Tap Check + Schedule Modal */}
              <div
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsFastingModalOpen(true);
                }}
                className={`rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  todayLog?.fastingDone
                    ? 'bento-3d-mint border-[#22c55e]/50'
                    : 'surface-card-3d border-zinc-200/80 dark:border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (todayLog?.fastingDone) {
                      setIsFastingModalOpen(true);
                      return;
                    }
                    triggerHabitConfetti(e);
                    soundSynth.playStreakMilestoneChime();
                    haptic.vibrateSprintCelebration();
                    const res = await awardSpiritualHabitPoints(
                      'fasting' as any,
                      isAr ? 'صيام التطوع المبارك' : 'Sunnah Fasting'
                    );
                    if (res.message) onRewardToast(res.message);
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 ${
                    todayLog?.fastingDone
                      ? 'bg-habit-green-ink text-white shadow-2xs'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-habit-green-ink hover:text-white'
                  }`}
                  title={isAr ? 'تسجيل صيام اليوم فوراً (+25 XP)' : '1-Tap log Fasting (+25 XP)'}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {isAr ? 'صيام التطوع والأيام البيض' : 'Sunnah Voluntary Fasting'}
                  </span>
                  <span
                    className={`block text-xs truncate mt-0.5 ${
                      todayLog?.fastingDone
                        ? 'text-zinc-700 dark:text-emerald-200/80'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {hijriInfo.isWhiteDay
                      ? isAr
                        ? 'اليوم من الأيام البيض المباركة 🌟'
                        : 'Today is a blessed White Day 🌟'
                      : isAr
                      ? 'صيام الإثنين والخميس والأيام البيض'
                      : 'Mon/Thu & White Days'}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    todayLog?.fastingDone
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200'
                      : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {todayLog?.fastingDone
                    ? isAr
                      ? 'صائم ✓'
                      : 'Fasting ✓'
                    : isAr
                    ? 'جدول 🤍'
                    : 'Sunnah'}
                </span>
              </div>

              {/* Conditional Habit 7: Friday Surah Al-Kahf */}
              {fridayWindow.isWindow && (
                <div
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsFridayModalOpen(true);
                  }}
                  className={`rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                    todayLog?.surahKahfDone
                      ? 'bento-3d-mint border-[#22c55e]/50'
                      : 'bento-3d-amber border-amber-300/60 dark:border-amber-700/50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      todayLog?.surahKahfDone
                        ? 'bg-habit-green-ink text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {fridayWindow.titleAr}
                    </span>
                    <span className="block text-xs text-zinc-600 dark:text-zinc-300 truncate mt-0.5">
                      {fridayWindow.descriptionAr}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 shrink-0">
                    {isAr ? 'الجمعة ✨' : 'Friday ✨'}
                  </span>
                </div>
              )}
            </div>

            {/* Clean Single-Row Quick Tools & Sport Switcher Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              <button
                type="button"
                onClick={() => onOpenSmartTasbih('khitam_salah')}
                className="px-3.5 py-2 rounded-full surface-card-3d border border-zinc-200/80 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-transform"
              >
                📿 {isAr ? 'المسبحة الذكية' : 'Smart Tasbih'}
              </button>
              <button
                type="button"
                onClick={() => setIsWeeklyReportOpen(true)}
                className="px-3.5 py-2 rounded-full surface-card-3d border border-zinc-200/80 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-transform"
              >
                📊 {isAr ? 'حصاد الأسبوع' : 'Weekly Report'}
              </button>
              {onOpenPanic && (
                <button
                  type="button"
                  onClick={onOpenPanic}
                  className="px-3.5 py-2 rounded-full surface-card-3d border border-zinc-200/80 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-transform"
                >
                  ⚡ {isAr ? 'قاعدة الدقيقتين' : '2-Min Rule'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAnomalyModalOpen(true)}
                className="px-3.5 py-2 rounded-full surface-card-3d border border-zinc-200/80 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-transform"
              >
                🛡️ {isAr ? 'توثيق ظرف طارئ' : 'Streak Shield'}
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 1.3 MOTIVATING 3-CARD DAILY HIGHLIGHTS BENTO (ومضات اليوم)      */}
          {/* Instant 1-tap access to Daily Ayah, Vocab Word & Mental Model  */}
          {/* ============================================================== */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                {isAr ? 'ومضات وإلهام اليوم' : 'Daily Highlights'}
              </h2>
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                {isAr ? 'تغذية الروح والعقل واللسان' : 'Soul, Mind & Language'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Highlight 2: Word of the Day with 1-Tap Audio & Quiz Modal (Soft Lavender #e2defc) */}
              <div
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsHomeQuizOpen(true);
                }}
                className="bento-3d-lavender p-4 rounded-[24px] border border-white/50 dark:border-indigo-500/25 text-start flex flex-col justify-between gap-2.5 cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#5448e8] text-white text-[10px] font-bold">
                      {currentLangObj.flag} {isAr ? 'كلمة اليوم' : 'Word of Day'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        if (featuredWord) {
                          speechService.speak(
                            featuredWord.word,
                            currentLangObj.speechCode as any,
                            1.0
                          );
                        }
                      }}
                      className="w-9 h-9 rounded-full bg-white/85 dark:bg-white/15 text-indigo-900 dark:text-white flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-2xs"
                      title={isAr ? 'نطق صوتي للكلمة' : 'Pronounce Word'}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white truncate" dir="ltr">
                      {featuredWord?.word || 'Resilience'}
                    </span>
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate">
                      {featuredWord?.translationAr || 'المرونة والصمود'}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                  <span>{isAr ? `اختبار المفردات (${homeLangWords.length} كلمات)` : 'Practice Vocab'}</span>
                  <span>{isAr ? '←' : '→'}</span>
                </span>
              </div>

              {/* Highlight 3: Mental Model & Daily Wisdom (Soft Amber #fde6d8) */}
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsReadMoreWisdomOpen(true);
                }}
                className="bento-3d-amber p-4 rounded-[24px] border border-white/50 dark:border-amber-500/25 text-start flex flex-col justify-between gap-2.5 cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-habit-flame-ink text-white text-[10px] font-bold">
                      💡 {isAr ? 'نموذج التفكير' : 'Mental Model'}
                    </span>
                    <span className="text-[10px] font-bold text-amber-950 dark:text-amber-200">
                      {dailyWisdom.categoryLabelAr}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {dailyWisdom.titleAr}
                  </p>
                  <p className="text-[11px] text-zinc-700 dark:text-amber-100/80 line-clamp-1">
                    {dailyWisdom.summaryAr}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                  <span>{isAr ? 'الشرح والتطبيق العملي' : 'Deep Dive'}</span>
                  <span>{isAr ? '←' : '→'}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: STATIONS, COURSES & COPILOT (🧭 المحطات)               */}
      {/* ============================================================ */}
      {activeQuickSection === 'stations' && (
        <div id="section-roadmap" className="space-y-4 animate-fade-in">
          <DailyStationsRoadmap
            allStationIds={allStationIds}
            completedStations={completedStations}
            currentSuggestedStation={currentSuggestedStation}
            personaId={personaId}
            personaConfig={personaConfig}
            overrides={overrides}
            isAr={isAr}
            onSelectStation={onSelectStation}
            onOpenLifestyleModal={onOpenLifestyleModal}
          />

          <ActiveStudyCourseWidget
            onSelectStation={onSelectStation}
            onRewardToast={onRewardToast}
          />

          <AiBehavioralCopilotCard
            todayLog={todayLog}
            userState={userState}
            allDailyLogs={allDailyLogs}
            activeProfile={activeProfile}
            onRewardToast={onRewardToast}
            onStartSuggestedSprint={(_dur: number) => {
              onSelectStation('WORK_MICRO_SPRINT');
            }}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SPIRITUAL SANCTUARY & AUDIO (🕌 المحراب)               */}
      {/* ============================================================ */}
      {activeQuickSection === 'spiritual' && (
        <div id="section-spiritual" className="space-y-4 animate-fade-in">
          {/* Tadabbur & Hadith Engine */}
          <DailyTadabburCard
            onOpenModal={(item, tab) => onOpenTadabburModal?.(item, tab)}
            onToast={onRewardToast}
          />

          {/* Faith & Knowledge Audio Sanctuary */}
          <GymFaithAudioPlayer
            onRewardToast={onRewardToast}
            onOpenFullModal={onOpenFaithAudio}
          />

          {/* Spiritual Devotions & Sunnah 4-Card Habitline Bento */}
          <div className="rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#141517] dark:bg-emerald-500/20 text-[#bce8c2] dark:text-emerald-300 flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                  🕊️
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {isAr ? 'روضة الأذكار والسنن النبوية' : 'Spiritual Devotions & Sunnah Sanctuary'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {isAr
                      ? 'أذكار الصباح والمساء، سورة الملك المنجية، صيام التطوع، ومحراب قيام الليل'
                      : 'Daily Adhkar, Surah Mulk, Sunnah Fasting, and Night Tahajjud'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#d4f5dc] dark:bg-emerald-950/60 text-zinc-900 dark:text-emerald-300">
                ✨ {isAr ? 'زاد الروح اليومي' : 'Daily Sanctuary'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Adhkar (Habitline Amber Pastel) */}
              <div className="bento-3d-amber p-4 rounded-[24px] border border-amber-300/50 dark:border-amber-800/40 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-white/80 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-2xs">
                      {isMorningTime ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200">
                      {(isMorningTime ? todayLog?.adhkarMorningDone : todayLog?.adhkarEveningDone)
                        ? isAr
                          ? 'مكتملة ✓'
                          : 'Done ✓'
                        : isMorningTime
                        ? isAr
                          ? 'الصباح'
                          : 'Morning'
                        : isAr
                        ? 'المساء'
                        : 'Evening'}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                    {isMorningTime
                      ? isAr
                        ? 'أذكار الصباح وحصن المسلم'
                        : 'Morning Adhkar'
                      : isAr
                      ? 'أذكار المساء وحصن المسلم'
                      : 'Evening Adhkar'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAdhkar(isMorningTime ? 'morning' : 'evening')}
                  className="min-h-[42px] w-full py-2 px-3 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-900 font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-transform"
                >
                  {isAr ? 'قراءة الأذكار ☀️' : 'Read Adhkar'}
                </button>
              </div>

              {/* Card 2: Surah Al-Mulk (Habitline Lavender Pastel) */}
              <div className="bento-3d-lavender p-4 rounded-[24px] border border-indigo-300/50 dark:border-indigo-800/40 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-white/80 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-2xs">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-indigo-900/60 text-indigo-950 dark:text-indigo-200">
                      {todayLog?.surahMulkDone ? (isAr ? 'تمت ✓' : 'Done ✓') : (isAr ? '٣٠ آية' : '30 Verses')}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                    {isAr ? 'سورة الملك (المنجية)' : 'Surah Al-Mulk'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHomeSurahMulkOpen(true)}
                  className="min-h-[42px] w-full py-2 px-3 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-900 font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-transform"
                >
                  {isAr ? 'تلاوة سورة الملك 🌙' : 'Recite Mulk'}
                </button>
              </div>

              {/* Card 3: Sunnah Fasting (Habitline Mint Pastel) */}
              <div className="bento-3d-mint p-4 rounded-[24px] border border-emerald-300/50 dark:border-emerald-800/40 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-white/80 dark:bg-emerald-500/20 text-[#1eb814] dark:text-emerald-300 flex items-center justify-center shadow-2xs">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-200">
                      {todayLog?.fastingDone ? (isAr ? 'صائم 🤍' : 'Fasting') : (isAr ? 'سنة نبوية' : 'Sunnah')}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                    {isAr ? 'سُنن الصيام والأيام البيض' : 'Sunnah Fasting'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFastingModalOpen(true)}
                  className="min-h-[42px] w-full py-2 px-3 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-900 font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-transform"
                >
                  {isAr ? 'جدول وتوثيق الصيام 🤍' : 'Fasting Schedule'}
                </button>
              </div>

              {/* Card 4: Qiyam & Nawafil (Habitline Rose Pastel) */}
              <div className="bento-3d-rose p-4 rounded-[24px] border border-rose-300/50 dark:border-rose-800/40 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-white/80 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center shadow-2xs">
                      <Moon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-rose-900/60 text-rose-950 dark:text-rose-200">
                      {todayLog?.qiyamNightDone ? (isAr ? 'مسجل 🌟' : 'Logged') : (isAr ? 'قيام الليل' : 'Qiyam')}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                    {isAr ? 'قيام الليل والسنن الرواتب' : 'Qiyam & Nawafil Guide'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNawafilModalTab('qiyam');
                    setIsNawafilModalOpen(true);
                  }}
                  className="min-h-[42px] w-full py-2 px-3 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-900 font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-transform"
                >
                  {isAr ? 'دليل القيام والسنن 🌌' : 'Open Nawafil Guide'}
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Prayer Shield Integration (Habitline Obsidian Banner) */}
          {onOpenCalendarShield && (
            <div className="flex items-center justify-between p-4 rounded-[24px] bg-[#141517] text-white border border-white/10 text-xs shadow-md">
              <div className="flex items-center gap-3 font-medium">
                <span className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-lg shrink-0">🛡️</span>
                <div>
                  <span className="font-bold block text-xs sm:text-sm text-white">
                    {isAr ? 'درع الصلوات ومزامنة التقويم' : 'Calendar Prayer Shield'}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {isAr ? 'فحص ملفات .ics لمنع تعارض الاجتماعات مع أوقات الصلاة' : 'Import .ics calendar to guard prayer buffers'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCalendarShield}
                className="min-h-[40px] px-4 py-1.5 rounded-full bg-[#bce8c2] hover:bg-[#a7dfb0] text-zinc-950 font-bold text-xs shrink-0 cursor-pointer active:scale-95 transition-all"
              >
                {isAr ? 'فحص 📅' : 'Scan 📅'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: LANGUAGES, WISDOM & HABIT LEARNING (🌱 نمو وثقافة)    */}
      {/* ============================================================ */}
      {activeQuickSection === 'growth' && (
        <div id="section-wisdom" className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Arabic Classical Poetry Card (Habitline Amber Bento) */}
        <div className="bento-3d-amber rounded-[28px] border border-amber-300/60 dark:border-amber-800/40 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#141517] text-[#fde6d8] flex items-center justify-center font-bold shadow-xs">
                  <Feather className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                    {isAr ? 'ديوان الحكمة والشعر العربي' : 'Classical Arabic Poetry Diwan'}
                  </h3>
                  <span className="text-[11px] font-bold text-amber-900/80 dark:text-amber-300">
                    {isAr ? 'عيون الشعر التليد وتفكيك المفردات' : 'Odes, Vocabulary & Life Wisdom'}
                  </span>
                </div>
              </div>

              <span className="text-xs px-3 py-1 rounded-full bg-white/85 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 font-bold">
                📜 {isAr ? 'أصالة وبيان' : 'Classics'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/70 border border-amber-300/40 dark:border-white/10">
              <p dir="rtl" lang="ar" className="text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-[2.2] font-quran tashkeel-text">
                «عَلى قَدْرِ أَهْلِ العَزْمِ تَأْتِي العَزائِمُ ... وَتَأْتِي عَلَى قَدْرِ الكِرامِ المَكارِمُ»
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenArabicPoetry?.();
            }}
            className="min-h-[44px] w-full py-2.5 px-4 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            <span>📜</span>
            <span>{isAr ? 'تصفح ديوان الشعر والشرح اللغوي' : 'Open Poetry Diwan'}</span>
            <span>{isAr ? '←' : '→'}</span>
          </button>
        </div>

        {/* Dynamic Daily Wisdom & Mental Models Card (Habitline Sky/Lavender Bento) */}
        <div className="bento-3d-sky rounded-[28px] border border-sky-300/60 dark:border-sky-800/40 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#141517] text-sky-200 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                  <span>{dailyWisdom.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {isAr ? 'حكمة ونموذج اليوم' : 'Daily Mental Model'}
                    </h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/85 dark:bg-sky-900/70 text-sky-950 dark:text-sky-200">
                      {dailyWisdom.categoryLabelAr}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-sky-900/80 dark:text-sky-300">
                    {dailyWisdom.titleAr} ({dailyWisdom.titleEn})
                  </span>
                </div>
              </div>

              <span className="text-xs px-3 py-1 rounded-full bg-white/85 dark:bg-sky-900/60 text-sky-950 dark:text-sky-200 font-bold">
                💡 {isAr ? 'متجدد يومياً' : 'Daily Fresh'}
              </span>
            </div>

            {/* Category Filter Pills on Dashboard */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
              {[
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'mental_models', label: isAr ? 'تفكير' : 'Models' },
                { id: 'productivity_decisions', label: isAr ? 'إنتاجية' : 'Productivity' },
                { id: 'health_body', label: isAr ? 'صحة وجسد' : 'Health' },
                { id: 'psychology_relations', label: isAr ? 'علاقات' : 'Psychology' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setWisdomCategory(c.id);
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                    wisdomCategory === c.id
                      ? 'bg-[#141517] text-white dark:bg-white dark:text-zinc-950'
                      : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium bg-white/85 dark:bg-zinc-900/70 p-3 rounded-2xl border border-sky-200/60 dark:border-white/10">
              «{dailyWisdom.summaryAr}»
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsReadMoreWisdomOpen(true);
              }}
              className="flex-1 min-h-[42px] py-2 px-3 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <span>📖</span>
              <span>{isAr ? 'اقرأ أكثر والشرح العملي' : 'Read Deep Dive'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                onOpenLifeWisdom?.();
              }}
              className="min-h-[42px] py-2 px-3.5 rounded-full bg-white/90 dark:bg-zinc-900 hover:bg-white text-zinc-800 dark:text-zinc-200 font-bold text-xs border border-sky-300/60 dark:border-zinc-700 transition-colors cursor-pointer shrink-0"
              title={isAr ? 'فتح الخزانة الكاملة' : 'Open Vault'}
            >
              <span>{isAr ? 'الخزانة الكاملة ←' : 'All Vault →'}</span>
            </button>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* ============================================================ */}
      {/* 4.5. ADAPTIVE SPORTS & HABIT LEARNING BENTO                  */}
      {/* ============================================================ */}
      {activeQuickSection === 'growth' && (
        <div id="section-sports" className="scroll-mt-20">
      <div className="rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#141517] text-[#ff5500] flex items-center justify-center font-bold text-base shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {isAr ? 'برنامج اليوم الرياضي وتعلم العادات' : 'Adaptive Sports & Habit Learning'}
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#fde6d8] dark:bg-amber-950/60 text-zinc-900 dark:text-amber-300">
                  {isAr ? 'مرونة مطلقة' : '100% Flexible'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isAr
                  ? 'يتعلم النظام من تكرار نشاطك عبر 1-3 أشهر، مع حريتك الكاملة في التحديد يومياً'
                  : 'AI learns weekly patterns over 1-3 months with full daily customization'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsAnomalyModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-full bg-[#d4f5dc] dark:bg-emerald-950/50 hover:bg-[#bce8c2] text-zinc-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title={isAr ? 'توثيق ظرف طارئ وحماية الشعلة' : 'Log Anomaly & Protect Streak'}
          >
            <ShieldCheck className="w-4 h-4 text-[#1eb814]" />
            <span>{isAr ? 'ظرف طارئ / حماية الشعلة 🛡️' : 'Log Anomaly / Shield 🛡️'}</span>
          </button>
        </div>

        {/* AI Habit Pattern Explanation Banner */}
        {learnedPattern && (
          <div className="p-3 rounded-2xl bg-[#fde6d8]/60 dark:bg-amber-950/30 border border-amber-300/40 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <p className="font-medium text-[11px] sm:text-xs">
                {learnedPattern.explanationAr}
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 shrink-0">
              دقة {learnedPattern.confidence}%
            </span>
          </div>
        )}

        {/* 1-Tap Sport Selector for Today */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
            {isAr ? 'حدد نشاطك اليوم حسب رغبتك ومزاجك:' : 'Choose today\'s activity freely:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'gym', cat: 'gym', labelAr: '🏋️ جيم وأوزان', labelEn: 'Gym & Weights' },
              { id: 'combat', cat: 'combat', labelAr: '🥊 ملاكمة وقتال', labelEn: 'Boxing & Combat' },
              { id: 'padel', cat: 'football', labelAr: '⚽ بادل / مباريات', labelEn: 'Padel / Football' },
              { id: 'fitness', cat: 'fitness_class', labelAr: '🔥 فيتنس مكثف', labelEn: 'HIIT & Fitness' },
              { id: 'rest', cat: 'mobility', labelAr: '🧘 راحة واستشفاء', labelEn: 'Active Rest' },
            ].map((sp) => {
              const isSelected = selectedSport === sp.id || selectedSport === sp.cat;
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => handleSelectSportForToday(sp.id, sp.cat)}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#141517] dark:bg-white border-[#141517] dark:border-white text-white dark:text-zinc-950 font-bold shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-[#fde6d8]/50'
                  }`}
                >
                  <span className="text-xs block truncate">{isAr ? sp.labelAr : sp.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </div>
      )}

      {/* ============================================================ */}
      {/* 5. DAILY VOCABULARY MASTERY BENTO (الحصيلة اللغوية اليومية) */}
      {/* ============================================================ */}
      {activeQuickSection === 'growth' && (
        <div id="section-languages" className="scroll-mt-20">
      <div className="rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
        {/* Header: Title, Language Switcher & Stats */}
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#141517] text-[#e2defc] flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                  {isAr ? 'الحصيلة اللغوية اليومية' : 'Daily Language Mastery'}
                </h3>

                {/* Language Picker Dropdown Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setIsLangDropdownOpen((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#e2defc] dark:bg-indigo-950/60 text-zinc-900 dark:text-indigo-200 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <span>{currentLangObj.flag}</span>
                    <span>{isAr ? currentLangObj.nameAr : currentLangObj.nameEn}</span>
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>

                  {/* Language Dropdown Menu */}
                  {isLangDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsLangDropdownOpen(false)}
                      />
                      <div className="absolute top-full mt-1.5 start-0 z-40 w-44 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5 space-y-0.5 animate-scale-up">
                        {TARGET_LANGUAGES.map((tl) => (
                          <button
                            key={tl.code}
                            type="button"
                            onClick={() => {
                              soundSynth.playTactileClick();
                              haptic.vibrateLight();
                              setActiveLangCode(tl.code);
                              setIsLangDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                              activeLangCode === tl.code
                                ? 'bg-[#141517] text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{tl.flag}</span>
                              <span>{isAr ? tl.nameAr : tl.nameEn}</span>
                            </span>
                            {activeLangCode === tl.code && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                {isAr
                  ? `الورد اليومي: ${homeLangWords.length} كلمات • نسبة الاستبقاء: ${fluencyProfile.retentionRate}% • متقن: ${fluencyProfile.totalMastered} كلمة`
                  : `Daily Quota: ${homeLangWords.length} words • Retention: ${fluencyProfile.retentionRate}% • Mastered: ${fluencyProfile.totalMastered} words`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs px-3 py-1 rounded-full bg-[#e2defc]/80 dark:bg-indigo-950/60 text-zinc-900 dark:text-indigo-300 font-bold">
              {featuredWord?.level ? `${featuredWord.level} • ${featuredWord.partOfSpeech}` : 'A1 • المفردات'}
            </span>
          </div>
        </div>

        {/* CEFR Level Selector Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setSelectedBentoLevel('ALL');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              selectedBentoLevel === 'ALL'
                ? 'bg-[#141517] text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            <span>{isAr ? 'الكل' : 'All'}</span>
            <span className="text-[10px] opacity-75 ms-1.5 font-mono">({bentoLevelCounts.ALL || 0})</span>
          </button>
          {CEFR_LEVELS_INFO.map((lvl) => {
            const count = bentoLevelCounts[lvl.level] || 0;
            const isSelected = selectedBentoLevel === lvl.level;
            return (
              <button
                key={lvl.level}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setSelectedBentoLevel(lvl.level);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#141517] border-[#141517] text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                }`}
              >
                <span className="font-mono font-bold">{lvl.level}</span>
                <span className="text-[10px] font-medium">{isAr ? lvl.nameAr : lvl.nameEn}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Featured Word Hero Glance (Habitline Lavender Card) */}
        {featuredWord && (
          <div className="bento-3d-lavender p-4 sm:p-5 rounded-[24px] border border-indigo-300/50 dark:border-indigo-900/40 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      setSpeechPlaying(true);
                      speechService.speak(featuredWord.word, currentLangObj.speechCode, 1.0);
                      setTimeout(() => setSpeechPlaying(false), 1200);
                    }}
                    className="w-11 h-11 rounded-2xl bg-[#141517] hover:bg-zinc-800 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
                    title={isAr ? 'استمع للنطق الأصلي (1.0x)' : 'Listen Native Pronunciation (1.0x)'}
                  >
                    <Volume2 className={`w-5 h-5 ${speechPlaying ? 'animate-bounce' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      setSpeechPlaying(true);
                      speechService.speak(featuredWord.word, currentLangObj.speechCode, 0.75);
                      setTimeout(() => setSpeechPlaying(false), 1600);
                    }}
                    className="px-2 py-0.5 rounded-full bg-white/85 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-900 dark:text-indigo-300 hover:bg-white cursor-pointer text-center"
                    title={isAr ? 'نطق هادئ وبطيء' : 'Slow audio'}
                  >
                    0.75x 🐢
                  </button>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white font-serif tracking-tight">
                      {featuredWord.word}
                    </span>
                    <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {featuredWord.phonetic}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#bce8c2] text-zinc-950">
                      {featuredWord.level}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#1eb814] dark:text-emerald-400 font-sans">
                    {featuredWord.translationAr}
                  </p>
                </div>
              </div>

              {/* Context Sentence Preview */}
              <div className="max-w-md bg-white/90 dark:bg-zinc-900/80 p-3 rounded-2xl border border-indigo-200/60 dark:border-zinc-700/60 text-xs space-y-1">
                <p dir="ltr" className="font-serif font-semibold text-zinc-900 dark:text-zinc-100 text-start leading-relaxed">
                  “{featuredWord.contextSentence}”
                </p>
                <p className="text-[#1eb814] dark:text-emerald-400 font-sans text-start leading-relaxed font-medium">
                  «{featuredWord.contextSentenceAr}»
                </p>
              </div>
            </div>

            {/* Clickable Collocations Chips */}
            {featuredWord.collocations && featuredWord.collocations.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-indigo-200/50 dark:border-zinc-800/60">
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                  {isAr ? '🔗 متلازمات شائعة:' : '🔗 Collocations:'}
                </span>
                {featuredWord.collocations.map((col, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      speechService.speak(col, currentLangObj.speechCode, 0.95);
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-white/85 hover:bg-white dark:bg-indigo-950/60 text-zinc-900 dark:text-indigo-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    title={isAr ? 'انقر للاستماع للنطق' : 'Click to listen'}
                  >
                    <span>{col}</span>
                    <Volume2 className="w-2.5 h-2.5 opacity-60" />
                  </button>
                ))}
              </div>
            )}

            {/* Memory Hook */}
            {featuredWord.mnemonicHook && (
              <div className="text-[11px] text-amber-950 dark:text-amber-200 bg-[#fde6d8]/85 dark:bg-amber-500/15 px-3 py-2 rounded-2xl border border-amber-300/60 flex items-start gap-2">
                <span className="text-sm shrink-0">🧠</span>
                <div>
                  <span className="font-bold block text-[10px] text-amber-900 dark:text-amber-300">
                    {isAr ? 'خطاف الذاكرة الصوري للربط الذهني:' : 'Visual Mnemonic Hook:'}
                  </span>
                  <span>{featuredWord.mnemonicHook}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Two High-Impact Art-Directed Action Launchers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* 1. Daily Words Quiz */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playCompletionChime();
              haptic.vibrateLight();
              setIsHomeQuizOpen(true);
            }}
            className="w-full py-3.5 px-4 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="text-base">🎯</span>
            <span>{isAr ? 'اختبار الكلمات اليومي' : 'Daily Vocab Quiz'}</span>
          </button>

          {/* 2. Flashcards & Training Lab */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsLanguageMovesOpen(true);
            }}
            className="w-full py-3.5 px-4 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="text-base">🎴</span>
            <span>{isAr ? 'عرض البطاقات والتدريب ←' : 'Flashcards & Moves Lab →'}</span>
          </button>
        </div>

        {/* Custom Decks Import / Export Launcher (OPP-0103) */}
        {onOpenCustomDeck && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                onOpenCustomDeck();
              }}
              className="w-full py-2.5 px-3 rounded-full bg-[#e2defc]/70 dark:bg-indigo-950/40 hover:bg-[#e2defc] text-zinc-900 dark:text-indigo-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>📥</span>
              <span>{isAr ? 'استيراد حزم وبطاقات مخصصة (CSV / Anki / JSON) ✨' : 'Import Custom Decks & Cards (CSV / Anki / JSON) ✨'}</span>
            </button>
          </div>
        )}
      </div>
      </div>
      )}

      {/* ============================================================ */}
      {/* 6. 24-HOUR CIRCADIAN TIMELINE & GUIDANCE                     */}
      {/* ============================================================ */}
      {activeQuickSection === 'stations' && (
        <div id="section-circadian" className="scroll-mt-20">
      <div className="rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#141517] text-[#fde6d8] flex items-center justify-center font-bold text-base shrink-0">
            ☀️
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              {isAr ? 'الإيقاع الحيوي ومسار اليوم' : 'Circadian Timeline & Guidance'}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {isAr ? 'حركة الشمس والقمر وتوزيع محطات اليوم على مدار 24 ساعة' : 'Sun/Moon cycle & 24-hour station allocation'}
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <DailyCircadianTimeline
            todayLog={todayLog}
            userState={userState}
            onSelectStation={onSelectStation}
            onOpenSleepRest={onOpenSleepRest}
            onOpenNawafilModal={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setNawafilModalTab('qiyam');
              setIsNawafilModalOpen(true);
            }}
          />

          <SmartAmbientNudgeCard
            todayLog={todayLog}
            userState={userState}
            dailyLogs={allDailyLogs}
            onSelectStation={onSelectStation}
            onOpenSleepRest={onOpenSleepRest}
            onStartSuggestedSprint={(_dur: number) => {
              onSelectStation('WORK_MICRO_SPRINT');
            }}
            onRewardToast={onRewardToast}
          />
        </div>
      </div>
      </div>
      )}


      {/* Schedule Anomaly Modal */}
      <ScheduleAnomalyModal
        isOpen={isAnomalyModalOpen}
        onClose={() => setIsAnomalyModalOpen(false)}
        expectedSport={selectedSport}
        onLogged={(_record) => {
          onRewardToast(
            isAr
              ? '🛡️ تم توثيق ظرفك وحماية شعلتك بنسبة 100% دون أي عقوبة!'
              : '🛡️ Anomaly logged. Your streak is 100% protected!'
          );
        }}
      />

      {/* Deep-Dive Read More Wisdom Modal */}
      {isReadMoreWisdomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsReadMoreWisdomOpen(false)}
        >
          <div
            className="w-full max-w-lg modal-surface border border-white/15 rounded-[28px] overflow-hidden max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="celestial-obsidian-stage text-white p-5 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl shrink-0">
                  {dailyWisdom.icon}
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-bold mb-0.5">
                    {dailyWisdom.categoryLabelAr}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {dailyWisdom.titleAr}
                  </h3>
                  <span className="text-xs font-mono text-zinc-300">
                    {dailyWisdom.titleEn}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReadMoreWisdomOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-3.5 text-xs leading-relaxed overflow-y-auto">
              <div className="p-3.5 rounded-[22px] bento-3d-sky border border-sky-300/60 dark:border-sky-800/40 text-sky-950 dark:text-sky-100 font-bold text-xs sm:text-sm">
                «{dailyWisdom.summaryAr}»
              </div>

              <div className="space-y-1.5 p-4 rounded-[22px] surface-card-3d border border-zinc-200/80 dark:border-white/10">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-xs sm:text-sm">
                  <span>🧠</span>
                  <span>{isAr ? 'الخلفية العلمية والشرح' : 'Scientific Explanation'}</span>
                </h4>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {dailyWisdom.detailedExplanationAr}
                </p>
              </div>

              <div className="space-y-1.5 p-4 rounded-[22px] bento-3d-mint border border-emerald-300/60 dark:border-emerald-800/40">
                <h4 className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5 text-xs sm:text-sm">
                  <span>📌</span>
                  <span>{isAr ? 'الخطوة العملية المباشرة' : 'Practical Action'}</span>
                </h4>
                <p className="text-emerald-900 dark:text-emerald-100 font-medium leading-relaxed">
                  {dailyWisdom.practicalActionAr}
                </p>
              </div>

              {dailyWisdom.realLifeExampleAr && (
                <div className="space-y-1.5 p-4 rounded-[22px] bento-3d-amber border border-amber-300/60 dark:border-amber-800/40">
                  <h4 className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5 text-xs sm:text-sm">
                    <span>💡</span>
                    <span>{isAr ? 'مثال واقعي تطبيقي' : 'Real-Life Example'}</span>
                  </h4>
                  <p className="text-amber-900 dark:text-amber-100 leading-relaxed">
                    {dailyWisdom.realLifeExampleAr}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    const txt = `💡 ${dailyWisdom.titleAr} (${dailyWisdom.titleEn})\n\n«${dailyWisdom.summaryAr}»\n\n📌 الخطوة العملية: ${dailyWisdom.practicalActionAr}`;
                    navigator.clipboard.writeText(txt);
                    onRewardToast(isAr ? '📋 تم نسخ النموذج بنجاح!' : 'Copied to clipboard!');
                  }}
                  className="flex-1 py-3 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  <span>📋</span>
                  <span>{isAr ? 'نسخ الحكمة' : 'Copy Wisdom'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReadMoreWisdomOpen(false)}
                  className="py-3 px-5 rounded-full surface-card-3d border border-zinc-200/80 dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Morning & Evening Adhkar Modal (Fallback if not handled by root App) */}
      {!onOpenAdhkarModal && (
        <MorningEveningAdhkarModal
          isOpen={isAdhkarModalOpen}
          onClose={() => setIsAdhkarModalOpen(false)}
          initialMode={adhkarMode}
          isCompleted={adhkarMode === 'morning' ? todayLog?.adhkarMorningDone : todayLog?.adhkarEveningDone}
          onRewardToast={onRewardToast}
        />
      )}

      {/* Surah Al-Mulk Interactive Reader Modal */}
      <SurahMulkModal
        isOpen={isHomeSurahMulkOpen}
        onClose={() => setIsHomeSurahMulkOpen(false)}
        isCompleted={todayLog?.surahMulkDone}
        onRewardToast={onRewardToast}
      />

      {/* Sunnah Fasting Reminder Modal */}
      <FastingReminderModal
        isOpen={isFastingModalOpen}
        onClose={() => setIsFastingModalOpen(false)}
        isFastingToday={todayLog?.fastingDone}
        onRewardToast={onRewardToast}
      />

      {/* Nawafil Guide Full Modal Gateway */}
      <NawafilGuideModal
        isOpen={isNawafilModalOpen}
        onClose={() => setIsNawafilModalOpen(false)}
        initialTab={nawafilModalTab}
        todayLog={todayLog}
        onRewardToast={onRewardToast}
      />

      {/* Weekly Barakah Harvest Report Modal */}
      <WeeklyBarakahReportModal
        isOpen={isWeeklyReportOpen}
        onClose={() => setIsWeeklyReportOpen(false)}
        userState={userState}
        dailyLogs={allDailyLogs || []}
        todayLog={todayLog}
      />

      {/* Friday Barakah & Surah Al-Kahf Sanctuary Modal */}
      <FridayKahfModal
        isOpen={isFridayModalOpen}
        onClose={() => setIsFridayModalOpen(false)}
        isCompleted={todayLog?.surahKahfDone}
        onRewardToast={onRewardToast}
      />

      {/* Language Quiz Modal from Home Dashboard */}
      <LanguageQuizModal
        isOpen={isHomeQuizOpen}
        onClose={() => {
          setIsHomeQuizOpen(false);
          setLangStats(spacedRepetition.getStats());
        }}
        words={homeLangWords}
        speechCode={currentLangObj.speechCode}
        initialLevel={selectedBentoLevel}
        onCompleted={(_score, _total) => {
          setLangStats(spacedRepetition.getStats());
          if (onRewardToast) {
            onRewardToast(
              isAr
                ? `🏆 أحسنت! أتممت اختبار الكلمات اليومي بنجاح (+20 XP)!`
                : `🏆 Great job! Quiz completed (+20 XP)!`
            );
          }
        }}
      />

      {/* Language Moves & 3D Flashcards Modal */}
      <LanguageMovesModal
        isOpen={isLanguageMovesOpen}
        onClose={() => {
          setIsLanguageMovesOpen(false);
          setLangStats(spacedRepetition.getStats());
        }}
        words={homeLangWords}
        speechCode={currentLangObj.speechCode}
        isAr={isAr}
        languageName={currentLangObj.nameAr}
        initialMove="flashcards"
        initialLevel={selectedBentoLevel}
      />

      {/* Flexible Quran Tracker & Surah Selection Modal (Fallback if not handled by root App) */}
      {!onOpenQuranTracker && (
        <FlexibleQuranTrackerModal
          isOpen={isFlexibleQuranOpen}
          onClose={() => setIsFlexibleQuranOpen(false)}
          quranProgress={quranProgress}
          onRewardToast={onRewardToast}
          todayLog={todayLog}
        />
      )}
    </div>
  );
};
