import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Play,
  Pause,
  Headphones,
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
import { ChessTacticalLabModal } from '../modals/ChessTacticalLabModal';
import { BookReadingSanctuaryModal } from '../modals/BookReadingSanctuaryModal';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getHijriDateDetails } from '../../utils/prayerCalculator';
import { awardSpiritualHabitPoints, getBiologicalDate, upsertDailyLog } from '../../utils/gamification';
import { WeeklyBarakahReportModal } from '../modals/WeeklyBarakahReportModal';
import { FridayKahfModal } from '../spiritual/FridayKahfModal';
import { FlexibleQuranTrackerModal } from '../spiritual/FlexibleQuranTrackerModal';
import { checkIsFridaySalawatWindow } from '../../utils/tasbihEngine';
import { SmartAppointmentsModal } from '../modals/SmartAppointmentsModal';
import { SmartDailyAppointmentsWidget } from './SmartDailyAppointmentsWidget';

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

  const [faithAudioState, setFaithAudioState] = useState(() => gymFaithAudio.getState());
  const faithPlaying = Boolean(faithAudioState.isPlaying);
  useEffect(() => {
    const unsubscribe = gymFaithAudio.subscribe((s) => setFaithAudioState(s));
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

  // Personalized Work & Workout Schedule Engine (never interrupts work hours with Gym!)
  const routineAns = userState?.settings?.dailyRoutineAnswers;
  const userWorkStartHour = routineAns?.workStartHour ?? 9;
  const userWorkEndHour = routineAns?.workEndHour ?? 17;
  const userWorkoutStartHour =
    routineAns?.workoutStartHour !== undefined
      ? routineAns.workoutStartHour
      : Math.max(18, userWorkEndHour);

  const [isQuickScheduleOpen, setIsQuickScheduleOpen] = useState(false);
  const [isChessLabOpen, setIsChessLabOpen] = useState(false);
  const [isBookSanctuaryOpen, setIsBookSanctuaryOpen] = useState(false);
  const [isSmartAppointmentsOpen, setIsSmartAppointmentsOpen] = useState(false);

  const todayBioDate = getBiologicalDate();
  const activeManualOverride: StationId | null =
    routineAns?.manualStationOverride && routineAns.manualStationOverride.date === todayBioDate
      ? routineAns.manualStationOverride.stationId
      : null;

  const handleSaveScheduleConfig = async (patch: Partial<NonNullable<UserState['settings']['dailyRoutineAnswers']>>) => {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();
    const currentAns = userState?.settings?.dailyRoutineAnswers || {
      activityType: 'office_job' as const,
      commuteMinutes: 0,
      cooksFood: false,
      cookingWindow: 'pre_dhuhr' as const,
      cookingMinutes: 60,
      workoutPreference: 'gym_iron' as const,
      workStartHour: 9,
      workEndHour: 17,
      workoutStartHour: 18,
      targetSleepHours: 7,
      autoSuggestWakeup: true,
    };
    const nextAns = { ...currentAns, ...patch };
    const wStart = nextAns.workStartHour ?? 9;
    const wEnd = nextAns.workEndHour ?? 17;
    const woStart = nextAns.workoutStartHour ?? 18;
    const workWindowStr = `${String(wStart).padStart(2, '0')}:00 - ${String(wEnd).padStart(2, '0')}:00`;
    const workoutWindowStr =
      woStart === -1 || nextAns.workoutPreference === 'none_rest'
        ? isAr ? 'يوم راحة / مرن' : 'Rest / Flexible'
        : `${String(woStart).padStart(2, '0')}:00 - ${String(Math.min(23, woStart + 1)).padStart(2, '0')}:30`;
    const prevOverrides = userState?.settings?.stationCustomOverrides || {};
    await db.user_state.update('current_user', {
      'settings.dailyRoutineAnswers': nextAns,
      'settings.stationCustomOverrides': {
        ...prevOverrides,
        WORK_MICRO_SPRINT: {
          ...prevOverrides.WORK_MICRO_SPRINT,
          customSubtitle: workWindowStr,
        },
        GYM_ANCHOR: {
          ...prevOverrides.GYM_ANCHOR,
          customSubtitle: workoutWindowStr,
        },
      },
    });
    scheduleService.savePreferences({
      workStartTime: `${String(wStart).padStart(2, '0')}:00`,
      workDurationHours: Math.max(1, wEnd - wStart),
      sportsPreferredTime:
        woStart >= 5 && woStart < 11
          ? 'morning'
          : woStart >= 20
          ? 'night'
          : 'evening',
    });
    onRewardToast(
      isAr
        ? '⏰ تم تحديث مواعيد العمل والرياضة في جميع المحطات بنجاح!'
        : '⏰ Work & workout schedule updated across all stations!'
    );
  };

  // Determine biological & personalized time windows
  const isFajrMorning = currentHour >= 4 && currentHour < userWorkStartHour;
  const isWorkWindow = currentHour >= userWorkStartHour && currentHour < userWorkEndHour;
  const isNoonBreak = currentHour === 12 || currentHour === 13;
  const isWorkoutWindow =
    routineAns?.workoutPreference !== 'none_rest' &&
    userWorkoutStartHour !== -1 &&
    !isWorkWindow &&
    currentHour >= userWorkoutStartHour &&
    currentHour < userWorkoutStartHour + 2;
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
      if (isAsr) return `مساء الهمة والتركيز${nameSuffix}`;
      if (isMaghrib) return `مساء الطمأنينة وحصاد الإنجاز${nameSuffix}`;
      return `ليلة هادئة ومباركة${nameSuffix}`;
    }
    const nameSuffix = activeProfile?.name ? `, ${activeProfile.name}` : '';
    if (isFajrMorning) return `Good morning & barakah${nameSuffix}`;
    if (isForenoon) return `High momentum & focus${nameSuffix}`;
    if (isNoon) return `Productive afternoon & steady flow${nameSuffix}`;
    if (isAsr) return `Focused afternoon & steady flow${nameSuffix}`;
    if (isMaghrib) return `Peaceful dusk & reflection${nameSuffix}`;
    return `Serene & restful night${nameSuffix}`;
  }, [isFajrMorning, isForenoon, isNoon, isAsr, isMaghrib, activeProfile?.name, isAr]);

  // Eloquent motivational message respecting user's work & workout schedule
  const motivationalMessage = useMemo(() => {
    if (isAr) {
      if (isFajrMorning) {
        return 'أقبل عليك يومٌ جديد كصفحة بيضاء ناصعة لم يُكتب فيها إلا توكلك على الله. ابدأ بورد القرآن العظيم وأذكار الصباح، فمن بدأ يومه بالله كفاه الله سائر أمره.';
      }
      if (isWorkWindow) {
        if (isNoonBreak) {
          return 'تفيأ ظلال صلاة الظهر واسترح قليلاً لتجديد صفاء الذهن، ثم واصل ساعات عملك وإنتاجيتك بهمة عالية وتركيز متزن.';
        }
        return `أنت الآن ضمن ساعات عملك وتركيزك (${userWorkStartHour}:00 – ${userWorkEndHour}:00)؛ ركّز في أولوياتك الكبرى وأنجز مهامك في أشواط تركيز عميقة دون تشتت.`;
      }
      if (isWorkoutWindow) {
        return 'انتهت ساعات العمل وحان موعد شحذ الجسد وتجديد النشاط البدني؛ انطلق لتمرينك مستمعاً لأثير السيرة النبوية فالمؤمن القوي أحب إلى الله.';
      }
      if (isMaghrib) {
        return 'اقترب اليوم من ختامه؛ دوّن فكرتك الذهبية وإنجازاتك، واحمد الله على التوفيق والسداد، واستعد لمراجعة اليوم.';
      }
      return 'ضع أعباء النهار جانباً؛ اقرأ سورة الملك المانعة من عذاب القبر، وسبّح ربك قبل نومك، وتوجه إلى فراشك بقلب سليم راجياً بركة الغد.';
    }

    if (isFajrMorning) {
      return 'A pristine new day unfolds. Anchor your morning in the Quran and daily remembrance; whoever begins their day with Allah finds all their affairs guided.';
    }
    if (isWorkWindow) {
      return `You are in your scheduled work & focus window (${userWorkStartHour}:00 – ${userWorkEndHour}:00). Zero in on your highest-leverage priorities without distraction.`;
    }
    if (isWorkoutWindow) {
      return 'Work hours are complete—time to recharge your physical vitality and tune into inspiring prophetic history.';
    }
    if (isMaghrib) {
      return 'The day winds down into harvest. Capture your golden insights, express gratitude for breakthroughs granted, and prepare for a mindful evening.';
    }
    return 'Release the weights of the day. Recite Surah Al-Mulk to illuminate the night, glorify your Lord, and step into restorative sleep.';
  }, [isFajrMorning, isWorkWindow, isNoonBreak, isWorkoutWindow, isMaghrib, userWorkStartHour, userWorkEndHour, isAr]);

  // Current suggested Station based on personalized work/workout schedule or 1-tap manual override
  const currentSuggestedStation = useMemo((): {
    id: StationId;
    title: string;
    description: string;
    cta: string;
    icon: any;
    badge: string;
    badgeColor: string;
  } => {
    const buildGymStation = (isManual = false) => {
      const movementCat =
        (typeof window !== 'undefined'
          ? localStorage.getItem('midmar_movement_cat')
          : 'gym') || 'gym';
      const badgeLabel = isManual
        ? isAr
          ? 'تحديد يدوي • محطة الرياضة والنشاط'
          : 'Manual Mode • Sport Anchor'
        : isAr
        ? `موعد الرياضة المفضل (${userWorkoutStartHour > 12 ? `${userWorkoutStartHour - 12} م` : `${userWorkoutStartHour} ص`})`
        : 'Scheduled Workout Window';

      if (movementCat === 'combat') {
        return {
          id: 'GYM_ANCHOR' as StationId,
          title: isAr
            ? '🥊 جولات الملاكمة والفنون القتالية مع السيرة'
            : 'Boxing & Combat Sports with Faith Stream',
          description: isAr
            ? 'مؤقت الجولات الاحترافي مع أثير السيرة النبوية وبطولات الصحابة.'
            : 'Pro round timer & combat drills with prophetic biography stream.',
          cta: isAr ? 'انطلق إلى حلبة النزال 🥊' : 'Enter Combat Arena 🥊',
          icon: Dumbbell,
          badge: badgeLabel,
          badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        };
      }
      if (movementCat === 'football') {
        return {
          id: 'GYM_ANCHOR' as StationId,
          title: isAr
            ? '⚽ مباراة كرة القدم والبادل واللياقة'
            : 'Football & Padel Match Tracker',
          description: isAr
            ? 'تسجيل الأهداف وصناعة اللعب، تقييم الأداء البدني وأثير الهمة العالية.'
            : 'Track goals, assists, match intensity and physical performance.',
          cta: isAr ? 'انطلق إلى سجل المباراة ⚽' : 'Track Match ⚽',
          icon: Dumbbell,
          badge: badgeLabel,
          badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        };
      }
      if (movementCat === 'fitness_class') {
        return {
          id: 'GYM_ANCHOR' as StationId,
          title: isAr
            ? '🔥 كلاس فيتنس وتدريب جماعي مكثف'
            : 'High-Intensity Fitness Class',
          description: isAr
            ? 'شوط حرق السعرات واللياقة العالية مع أثير السيرة النبوية والتحفيز.'
            : 'Cardio conditioning, calories burning and high energy faith stream.',
          cta: isAr ? 'انطلق إلى كلاس الفيتنس 🔥' : 'Start Fitness Class 🔥',
          icon: Dumbbell,
          badge: badgeLabel,
          badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
        };
      }
      return {
        id: 'GYM_ANCHOR' as StationId,
        title: isAr
          ? '🏋️ النشاط البدني وأثير السيرة النبوية (الجيم)'
          : 'Strength Training & Faith Stream (Gym)',
        description: isAr
          ? 'تمارين القوة واللياقة وشحن العزيمة مع أثير السيرة النبوية في موعدك المحدد.'
          : 'Weightlifting routines & inspiring prophetic history at your scheduled time.',
        cta: isAr ? 'انطلق إلى الجيم مع السيرة النبوية 🎙️' : 'Start Gym with Faith Stream 🎙️',
        icon: Dumbbell,
        badge: badgeLabel,
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      };
    };

    const buildWorkStation = (isManual = false) => ({
      id: 'WORK_MICRO_SPRINT' as StationId,
      title: isAr ? 'شوط التركيز والعمل العميق' : 'Deep Work & Focus Sprint',
      description: isAr
        ? 'إنجاز المهام ذات الأولوية القصوى، وتفعيل مؤقت التركيز (20 دقيقة) بلا مقاطعة.'
        : 'Crush high-priority tasks and activate the 20-minute zero-interruption focus sprint.',
      cta: isAr ? 'انطلق إلى شوط التركيز ⚡' : 'Start Focus Sprint ⚡',
      icon: Briefcase,
      badge: isManual
        ? isAr
          ? 'تحديد يدوي • وضع العمل والتركيز الآن'
          : 'Manual Mode • Deep Work Active'
        : isAr
        ? `ساعات العمل والتركيز (${userWorkStartHour}:00 - ${userWorkEndHour}:00)`
        : `Work & Focus Window (${userWorkStartHour}:00 - ${userWorkEndHour}:00)`,
      badgeColor: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    });

    const buildMorningStation = (isManual = false) => ({
      id: 'COMMUTE_MORNING' as StationId,
      title: isAr ? 'ورد الصباح وتلاوة القرآن الكريم' : 'Morning Quran & Sunnah Wird',
      description: isAr
        ? 'قراءة وِرد اليوم من سورة البقرة، أذكار الصباح، وحرز التوحيد (100 مرة).'
        : 'Read daily Quran portion, morning fortress adhkar, and 100x tawheed protection shield.',
      cta: isAr ? 'انطلق إلى محطة القرآن الكريم 📖' : 'Enter Quran Station 📖',
      icon: BookOpen,
      badge: isManual
        ? isAr
          ? 'تحديد يدوي • محطة الصباح والقرآن'
          : 'Manual Mode • Morning Wird'
        : isAr
        ? 'المحطة 1 • نافذة الصباح الباكر'
        : 'Station 1 • Early Morning Window',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    });

    const buildEveningStation = (isManual = false) => ({
      id: 'EVENING_SPRINT' as StationId,
      title: isAr ? 'شوط المساء والتعلم الذاتي' : 'Evening Sprint & Lifelong Learning',
      description: isAr
        ? 'مشاريعك وتطلعاتك الشخصية، تطوير المهارات، والقراءة والمطالعة النافعة.'
        : 'Personal high-leverage projects, skill building, and reflective reading.',
      cta: isAr ? 'انطلق إلى شوط المساء 💻' : 'Launch Evening Sprint 💻',
      icon: Laptop,
      badge: isManual
        ? isAr
          ? 'تحديد يدوي • شوط المساء والتعلم'
          : 'Manual Mode • Evening Sprint'
        : isAr
        ? 'المحطة 4 • جلسة البناء والتعلم'
        : 'Station 4 • Creative Build Session',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    });

    const buildRetrospectiveStation = (isManual = false) => ({
      id: 'RETROSPECTIVE_CHECKIN' as StationId,
      title: isAr ? 'مراجعة اليوم وسكينة الليل' : 'Daily Retrospective & Night Serenity',
      description: isAr
        ? 'تدوين الفكرة الذهبية، تقييم الإنجاز، سورة الملك، وأذكار النوم والاستشفاء.'
        : 'Capture the golden nugget, evaluate progress, recite Surah Mulk, and sleep adhkar.',
      cta: isAr ? 'انطلق إلى مراجعة اليوم 📊' : 'Start Retrospective 📊',
      icon: CheckCircle2,
      badge: isManual
        ? isAr
          ? 'تحديد يدوي • مراجعة اليوم والسكينة'
          : 'Manual Mode • Retrospective'
        : isAr
        ? 'المحطة 5 • تفريغ الذهن والاستشفاء'
        : 'Station 5 • Cognitive Download & Recovery',
      badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    });

    // 1. Honor 1-Tap Manual Station Override for today if set by the user
    if (activeManualOverride === 'WORK_MICRO_SPRINT') return buildWorkStation(true);
    if (activeManualOverride === 'GYM_ANCHOR') return buildGymStation(true);
    if (activeManualOverride === 'COMMUTE_MORNING') return buildMorningStation(true);
    if (activeManualOverride === 'EVENING_SPRINT') return buildEveningStation(true);
    if (activeManualOverride === 'RETROSPECTIVE_CHECKIN') return buildRetrospectiveStation(true);

    // 2. Otherwise follow the user's personalized Work & Workout schedule
    if (isWorkoutWindow) {
      return buildGymStation(false);
    }
    if (isWorkWindow) {
      return buildWorkStation(false);
    }
    if (isFajrMorning) {
      return buildMorningStation(false);
    }
    if (currentHour >= userWorkEndHour && currentHour < 20) {
      return buildEveningStation(false);
    }
    return buildRetrospectiveStation(false);
  }, [
    activeManualOverride,
    isWorkoutWindow,
    isWorkWindow,
    isFajrMorning,
    currentHour,
    userWorkStartHour,
    userWorkEndHour,
    userWorkoutStartHour,
    isAr,
  ]);

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

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsQuickScheduleOpen(true);
              }}
              title={isAr ? 'ضبط مواعيد العمل والرياضة أو تغيير المحطة الحالية' : 'Customize work & workout hours'}
              className="touch-target h-9 px-3 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-300/35 text-[11px] font-bold text-amber-200 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <span>⏰</span>
              <span>{isAr ? 'مواعيدي' : 'My Schedule'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMonthlyEvaluation || onOpenEvaluation}
              className="touch-target h-9 px-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[11px] font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <TargetIcon className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>{isAr ? 'تحديات الشهر' : 'Monthly Goals'}</span>
            </button>
          </div>
        </div>

        {/* Dignified Greeting & Personalized Status (Visible on both Mobile & Desktop) */}
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-2xl font-bold text-white">{greeting}</h1>
          <p className="text-[11px] sm:text-xs text-zinc-300/90 leading-relaxed max-w-3xl line-clamp-2 sm:line-clamp-none">
            {motivationalMessage}
          </p>
        </div>

        {/* Celestial Prayer Arc — photorealistic 3D sun/moon observatory across the five prayers */}
        <CelestialPrayerArc
          now={now}
          doneMap={prayersDoneMap}
          isAr={isAr}
          userState={userState}
          onSelectPrayer={(p) => triggerPrayerModal(p)}
        />

        {/* 7-Day Horizontal Week Calendar Strip (Interactive Day Inspector with 5-Prayer Constellation Dots) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-1">
          {weekDaysStrip.map((day) => {
            const isSelectedDay = selectedWeekDateStr === day.dateStr;
            const isFutureDay = day.dateStr > todayBioDate;
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
                    ? `اضغط لعرض حصاد يوم ${day.dayLabel} (${day.dateStr}) • ${day.prayersDoneCount}/5 صلوات`
                    : `Tap to inspect ${day.dayLabel} (${day.dateStr}) • ${day.prayersDoneCount}/5 prayers`
                }
              >
                <div
                  className={`relative w-full max-w-[2.65rem] h-12 sm:h-13 rounded-2xl flex flex-col items-center justify-center gap-1 text-xs sm:text-sm font-bold tabular-nums transition-all ${
                    isSelectedDay
                      ? 'bg-gradient-to-b from-[#1fb23a] to-[#0d7a2a] text-white ring-2 ring-amber-300 shadow-[0_8px_20px_rgba(34,197,94,0.4)] scale-105'
                      : day.isToday
                      ? 'bg-gradient-to-b from-[#16a34a] via-[#117a33] to-[#0b5622] text-white ring-2 ring-amber-300/90 ring-offset-1 ring-offset-[#101113] shadow-[0_8px_22px_rgba(245,158,11,0.3)] scale-105'
                      : day.hasActivity
                      ? 'bg-gradient-to-b from-emerald-700/85 to-emerald-950/95 text-white border border-emerald-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                      : isFutureDay
                      ? 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-zinc-300/80'
                      : 'bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-zinc-200'
                  }`}
                >
                  <span className="leading-none">{day.dayNumber}</span>

                  {/* 5 Micro Prayer Constellation Dots (reflecting 5 daily prayers) */}
                  <div className="flex items-center gap-[2px]" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((dotIdx) => {
                      const dotFilled = dotIdx < day.prayersDoneCount;
                      return (
                        <span
                          key={dotIdx}
                          className={`w-1 h-1 rounded-full transition-colors ${
                            dotFilled
                              ? day.isToday || isSelectedDay
                                ? 'bg-amber-300 shadow-[0_0_4px_#fcd34d]'
                                : 'bg-emerald-300'
                              : 'bg-white/20'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Gold/Emerald Checkmark Seal on Active Past Days */}
                  {day.hasActivity && !day.isToday && !isSelectedDay && (
                    <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-gradient-to-br from-[#22c55e] to-[#15803d] text-white ring-1 ring-amber-300/60 flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}

                  {/* Crown Dot on Today */}
                  {day.isToday && (
                    <span className="absolute -top-1 px-1.5 py-[0.5px] rounded-full bg-amber-400 text-zinc-950 text-[7px] font-black leading-tight shadow-2xs">
                      {isAr ? 'اليوم' : 'NOW'}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[11px] leading-[1.7] whitespace-nowrap ${
                    isSelectedDay
                      ? 'text-amber-300 font-bold'
                      : day.isToday
                      ? 'text-white font-bold'
                      : day.hasActivity
                      ? 'text-emerald-200/90 font-semibold'
                      : 'text-white/50 font-medium'
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

        {/* Integrated 1-Tap Current Station Launch Pill + Schedule Customizer inside the Dark Stage */}
        <div className="w-full max-w-[96%] mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onSelectStation(currentSuggestedStation.id);
            }}
            className="flex-1 min-w-0 p-2 sm:p-2.5 rounded-[28px] bg-gradient-to-b from-[#1a8f35] to-[#0e5a24] hover:brightness-110 border border-emerald-300/30 shadow-[0_8px_22px_-6px_rgba(30,184,20,0.5)] flex items-center justify-between gap-2.5 transition-all cursor-pointer active:scale-[0.98] text-start"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-habit-green-ink text-white flex items-center justify-center shrink-0 shadow-md ring-1 ring-habit-green/40">
                <currentSuggestedStation.icon className="w-[18px] h-[18px]" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] sm:text-[11px] font-semibold text-emerald-100 leading-[1.6] truncate">
                  {currentSuggestedStation.badge}
                </span>
                <span className="block text-xs sm:text-sm font-bold text-white leading-snug line-clamp-1">
                  {currentSuggestedStation.title}
                </span>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-bold shrink-0 shadow-sm">
              {isAr ? 'ابدأ الآن ←' : 'Start →'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsQuickScheduleOpen(true);
            }}
            title={isAr ? 'تغيير المحطة الحالية أو ضبط مواعيد العمل والرياضة' : 'Change current station or adjust schedule'}
            className="h-12 px-3 rounded-[22px] bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold text-amber-200 flex flex-col items-center justify-center leading-tight shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <span>⚙️</span>
            <span className="text-[10px]">{isAr ? 'تغيير' : 'Mode'}</span>
          </button>
        </div>
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

        {/* Amber focus sprint dial + Interactive Atheer Acoustic Studio Deck */}
        <div className="bento-3d-amber col-span-2 lg:col-span-6 rounded-[28px] border border-white/50 dark:border-amber-500/25 p-3.5 sm:p-4 flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onSelectStation('WORK_MICRO_SPRINT');
            }}
            className="bento-press relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full bg-white/75 dark:bg-white/10 flex items-center justify-center cursor-pointer shadow-2xs"
            aria-label={isAr ? 'ابدأ شوط التركيز 20 دقيقة' : 'Start the 20-minute focus sprint'}
          >
            <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
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
              <bdi dir="ltr" className="text-2xl sm:text-3xl font-bold tabular-nums leading-none">20</bdi>
              <span className="text-[11px] font-semibold leading-[1.6] mt-0.5">{isAr ? 'دقيقة' : 'min'}</span>
            </span>
          </button>

          {/* Interactive Royal Emerald-Gold Atheer Broadcast Studio Deck */}
          <div className="flex-1 min-w-0 rounded-[24px] bg-gradient-to-br from-[#064e3b] via-[#0f5132] to-[#1e1b4b] text-white p-3 border-2 border-amber-300/60 shadow-[0_12px_28px_-6px_rgba(6,78,59,0.45)] flex flex-col justify-between gap-2 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-8 -end-8 w-28 h-28 rounded-full bg-amber-300/20 blur-xl animate-pulse" />
            <div className="pointer-events-none absolute -bottom-8 -start-8 w-24 h-24 rounded-full bg-emerald-400/20 blur-xl" />

            {/* Top Row: Mini Rotating Shamsa Play/Pause + Track Metadata + Mobile-Visible Live Equalizer */}
            <div className="flex items-center justify-between gap-2.5 relative z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  gymFaithAudio.togglePlay();
                }}
                aria-label={faithPlaying ? (isAr ? 'إيقاف الأثير مؤقتاً' : 'Pause Audio') : (isAr ? 'تشغيل الأثير فوراً' : 'Play Audio')}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer active:scale-90 transition-all shadow-md border ${
                  faithPlaying
                    ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-zinc-950 border-white ring-2 ring-amber-300/60'
                    : 'bg-gradient-to-br from-amber-200 to-amber-400 hover:brightness-110 text-zinc-950 border-amber-100'
                }`}
              >
                {faithPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ms-0.5" />
                )}
                {faithPlaying && (
                  <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-zinc-950 animate-ping" />
                )}
              </button>

              <div
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  if (onOpenFaithAudio) onOpenFaithAudio();
                  else onSelectStation('GYM_ANCHOR');
                }}
                className="min-w-0 flex-1 cursor-pointer text-start"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-200 border border-amber-300/40">
                    {faithPlaying ? (isAr ? '🔊 يصدح الآن' : '🔊 Live') : (isAr ? '۞ محراب الأثير' : '۞ Atheer')}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-200 truncate">
                    {faithAudioState.currentSheikhAr || (isAr ? 'يوتيوب 5.0⭐ • ساوند كلاود' : 'YouTube & SoundCloud')}
                  </span>
                </div>
                <p className="text-xs font-bold text-white truncate mt-0.5">
                  {faithAudioState.currentTitleAr || (isAr ? 'أكاديمية الوعي، التلاوات، وسلاسل العلماء' : 'Awareness Academy & Quran')}
                </p>
              </div>

              {/* Mobile-Visible Animated Golden-Emerald Spectrum */}
              <span dir="ltr" className="flex items-center justify-center gap-[2px] h-7 px-1 shrink-0" aria-hidden="true">
                {WAVE_BARS.slice(12, 21).map((h, i) => (
                  <span
                    key={i}
                    className={`wave-bar w-[2.5px] shrink-0 rounded-full bg-gradient-to-t from-emerald-300 to-amber-300 ${
                      faithPlaying ? 'wave-bar-play' : 'opacity-50'
                    }`}
                    style={
                      {
                        height: Math.max(6, Math.round(h * 0.5)),
                        '--d': `${850 + (i % 5) * 120}ms`,
                        '--dl': `-${i * 65}ms`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </span>
            </div>

            {/* Bottom Row: 1-Tap Quick Station Switchers + Open 80+ Academy Studio Modal */}
            <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/15 relative z-10 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 shrink-0">
                {[
                  { id: 'makkah_quran_radio', label: isAr ? '🕋 تلاوات' : 'Quran' },
                  { id: 'seerah_radio', label: isAr ? '⚔️ السيرة' : 'Seerah' },
                  { id: 'tafseer_radio', label: isAr ? '💡 تفسير' : 'Tafsir' },
                ].map((st) => {
                  const activeSt =
                    faithAudioState.mode === 'channel' && faithAudioState.currentChannelId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        gymFaithAudio.setChannel(st.id, true);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                        activeSt
                          ? 'bg-amber-400 text-zinc-950 border-white shadow-xs'
                          : 'bg-white/10 hover:bg-white/20 text-emerald-100 border-white/15'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  if (onOpenFaithAudio) onOpenFaithAudio();
                  else onSelectStation('GYM_ANCHOR');
                }}
                className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-300 hover:brightness-105 text-zinc-950 text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
              >
                <Headphones className="w-3 h-3" />
                <span>{isAr ? 'أكاديمية الأثير (80+) ✨' : 'Studio (80+)'}</span>
              </button>
            </div>
          </div>
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
                  const targetSectionId =
                    stack.id === 'today'
                      ? 'section-routine'
                      : stack.id === 'stations'
                      ? 'section-roadmap'
                      : stack.id === 'spiritual'
                      ? 'section-spiritual'
                      : 'section-wisdom';
                  setTimeout(() => {
                    document
                      .getElementById(targetSectionId)
                      ?.scrollIntoView({ behavior: reduceMotionPref ? 'auto' : 'smooth', block: 'start' });
                  }, 60);
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
      <div className={activeQuickSection === 'today' ? 'space-y-4 animate-fade-in' : 'hidden'}>
          {/* 1.1 "Today's routine" (روتين اليوم) — Primary 6 Clean 1-Tap Habit Cards First */}
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

            {/* Architectural 2-Column Bento Habit Cards (Distinct Domain Atmospheres & Jewel Medallions) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Habit 1: Daily Quran Wird (Sacred Emerald Manuscript Theme) */}
              <div
                onClick={handleOpenQuranTracker}
                className={`group relative overflow-hidden rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  todayLog?.quranWirdDone
                    ? 'bento-3d-mint border-[#22c55e]/60 shadow-[0_8px_20px_-6px_rgba(34,197,94,0.25)]'
                    : 'bg-gradient-to-l from-emerald-500/[0.07] via-teal-500/[0.03] to-white dark:from-emerald-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border-emerald-400/35 dark:border-emerald-500/25 hover:border-emerald-500/50 shadow-2xs'
                }`}
              >
                <span className="w-1.5 self-stretch rounded-full bg-gradient-to-b from-emerald-400 to-teal-600 shrink-0" />
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
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 border ${
                    todayLog?.quranWirdDone
                      ? 'bg-gradient-to-br from-[#22c55e] to-[#15803d] text-white border-amber-300/60 shadow-sm'
                      : 'bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/35 text-emerald-700 dark:text-emerald-300 hover:bg-habit-green-ink hover:text-white'
                  }`}
                  title={isAr ? 'إتمام صفحة من الورد القرآني (+25 XP)' : 'Complete Quran Wird (+25 XP)'}
                >
                  <Check className="w-4 h-4 stroke-[2.8]" />
                </button>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {quranProgress?.surah
                      ? quranProgress.surah.startsWith('سورة')
                        ? `${quranProgress.surah} • استوديو الحفظ 🧠`
                        : `سورة ${quranProgress.surah} • استوديو الحفظ 🧠`
                      : isAr
                      ? 'الورد القرآني واستوديو الحفظ والتسميع 🧠'
                      : 'Daily Quran Wird & Hifz Studio 🧠'}
                  </span>
                  <span
                    className={`block text-xs truncate mt-0.5 ${
                      todayLog?.quranWirdDone
                        ? 'text-zinc-700 dark:text-emerald-200/80'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {isAr
                      ? `إخفاء تدريجي للكلمات للتسميع + تكرار صوتي • ص ${currentWirdPages} من ${totalWirdPages}`
                      : `Progressive word masking & audio loop • Page ${currentWirdPages} of ${totalWirdPages}`}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 border ${
                    todayLog?.quranWirdDone
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200 border-emerald-500/30'
                      : 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border-emerald-500/25'
                  }`}
                >
                  {todayLog?.quranWirdDone
                    ? isAr
                      ? 'اليوم ✓'
                      : 'Today ✓'
                    : isAr
                    ? `🧠 حفظ وتسميع`
                    : `🧠 Hifz`}
                </span>
              </div>

              {/* Habit 2: Morning / Evening Adhkar (Solar Amber / Twilight Theme) */}
              <div
                onClick={() => handleOpenAdhkar(isMorningTime ? 'morning' : 'evening')}
                className={`group relative overflow-hidden rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  isAdhkarDoneToday
                    ? 'bento-3d-mint border-[#22c55e]/60 shadow-[0_8px_20px_-6px_rgba(34,197,94,0.25)]'
                    : 'bg-gradient-to-l from-amber-500/[0.08] via-orange-500/[0.03] to-white dark:from-amber-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border-amber-400/40 dark:border-amber-500/25 hover:border-amber-500/50 shadow-2xs'
                }`}
              >
                <span className="w-1.5 self-stretch rounded-full bg-gradient-to-b from-amber-400 to-orange-500 shrink-0" />
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
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 border ${
                    isAdhkarDoneToday
                      ? 'bg-gradient-to-br from-[#22c55e] to-[#15803d] text-white border-amber-300/60 shadow-sm'
                      : 'bg-amber-500/15 dark:bg-amber-500/20 border-amber-500/35 text-amber-700 dark:text-amber-300 hover:bg-habit-green-ink hover:text-white'
                  }`}
                  title={isAr ? 'تسجيل الأذكار فوراً (+20 XP)' : 'Complete Adhkar (+20 XP)'}
                >
                  <Check className="w-4 h-4 stroke-[2.8]" />
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
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {isAr
                      ? 'اضغط لفتح القارئ التفاعلي والعداد'
                      : 'Tap to open interactive Adhkar reader'}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 border ${
                    isAdhkarDoneToday
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/25'
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

              {/* Habit 3: Deep Work Micro-Sprint (20m) (Electric Indigo Focus Theme) */}
              <div
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  onSelectStation('WORK_MICRO_SPRINT');
                }}
                className={`group relative overflow-hidden rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  isWorkSprintDone
                    ? 'bento-3d-mint border-[#22c55e]/60 shadow-[0_8px_20px_-6px_rgba(34,197,94,0.25)]'
                    : 'bg-gradient-to-l from-sky-500/[0.08] via-indigo-500/[0.03] to-white dark:from-sky-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border-sky-400/40 dark:border-sky-500/25 hover:border-sky-500/50 shadow-2xs'
                }`}
              >
                <span className="w-1.5 self-stretch rounded-full bg-gradient-to-b from-sky-400 to-indigo-600 shrink-0" />
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (isWorkSprintDone) {
                      onSelectStation('WORK_MICRO_SPRINT');
                      return;
                    }
                    triggerHabitConfetti(e);
                    soundSynth.playStreakMilestoneChime();
                    haptic.vibrateSprintCelebration();
                    const nextCompleted: StationId[] = [...(completedStations as StationId[]), 'WORK_MICRO_SPRINT'];
                    await upsertDailyLog(todayBioDate, {
                      completedStations: nextCompleted,
                      pointsEarned: (todayLog?.pointsEarned || 0) + 15,
                    });
                    if (userState) {
                      await db.user_state.update('current_user', {
                        totalPoints: (userState.totalPoints || 0) + 15,
                      });
                    }
                    onRewardToast(
                      isAr
                        ? '⚡ أحسنت! تم توثيق شوط التركيز والعمل العميق (+15 نقطة)'
                        : '⚡ Focus Sprint logged (+15 XP)!'
                    );
                  }}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 border ${
                    isWorkSprintDone
                      ? 'bg-gradient-to-br from-[#22c55e] to-[#15803d] text-white border-amber-300/60 shadow-sm'
                      : 'bg-sky-500/15 dark:bg-sky-500/20 border-sky-500/35 text-sky-700 dark:text-sky-300 hover:bg-habit-green-ink hover:text-white'
                  }`}
                  title={isAr ? 'تسجيل إتمام شوط التركيز فوراً (+15 XP)' : '1-Tap log Focus Sprint (+15 XP)'}
                >
                  <Check className="w-4 h-4 stroke-[2.8]" />
                </button>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {isAr ? 'شوط التركيز والعمل العميق' : 'Deep Work Micro-Sprint'}
                  </span>
                  <span
                    className={`block text-xs truncate mt-0.5 ${
                      isWorkSprintDone
                        ? 'text-zinc-700 dark:text-emerald-200/80'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {isAr
                      ? '٢٠ دقيقة تركيز خالص بلا مقاطعة (+١٥ نقطة)'
                      : '20m zero-distraction focus session (+15 XP)'}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 border ${
                    isWorkSprintDone
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200 border-emerald-500/30'
                      : 'bg-sky-500/15 text-sky-900 dark:text-sky-300 border-sky-500/25'
                  }`}
                >
                  {isWorkSprintDone ? (isAr ? 'اليوم ✓' : 'Today ✓') : isAr ? '٢٠ د ⚡' : '20m ⚡'}
                </span>
              </div>

              {/* Habit 4: Daily Physical & Sport Anchor (Kinetic Flame Athletic Theme) */}
              <div
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  onSelectStation('GYM_ANCHOR');
                }}
                className={`group relative overflow-hidden rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  isGymDone
                    ? 'bento-3d-mint border-[#22c55e]/60 shadow-[0_8px_20px_-6px_rgba(34,197,94,0.25)]'
                    : 'bg-gradient-to-l from-orange-500/[0.08] via-amber-500/[0.03] to-white dark:from-orange-950/40 dark:via-zinc-900/90 dark:to-zinc-900 border-orange-400/40 dark:border-orange-500/25 hover:border-orange-500/50 shadow-2xs'
                }`}
              >
                <span className="w-1.5 self-stretch rounded-full bg-gradient-to-b from-[#ff5500] to-amber-500 shrink-0" />
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (isGymDone) {
                      onSelectStation('GYM_ANCHOR');
                      return;
                    }
                    triggerHabitConfetti(e);
                    soundSynth.playStreakMilestoneChime();
                    haptic.vibrateSprintCelebration();
                    const nextCompleted: StationId[] = [...(completedStations as StationId[]), 'GYM_ANCHOR'];
                    await upsertDailyLog(todayBioDate, {
                      completedStations: nextCompleted,
                      pointsEarned: (todayLog?.pointsEarned || 0) + 20,
                    });
                    if (userState) {
                      await db.user_state.update('current_user', {
                        totalPoints: (userState.totalPoints || 0) + 20,
                      });
                    }
                    onRewardToast(
                      isAr
                        ? '🏋️ عاش! تم توثيق مرساة النشاط البدني والرياضة (+20 نقطة)'
                        : '🏋️ Sport Anchor logged (+20 XP)!'
                    );
                  }}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 border ${
                    isGymDone
                      ? 'bg-gradient-to-br from-[#22c55e] to-[#15803d] text-white border-amber-300/60 shadow-sm'
                      : 'bg-orange-500/15 dark:bg-orange-500/20 border-orange-500/35 text-[#ff5500] dark:text-orange-300 hover:bg-habit-green-ink hover:text-white'
                  }`}
                  title={isAr ? 'تسجيل إتمام التمرين الرياضي فوراً (+20 XP)' : '1-Tap log Sport Anchor (+20 XP)'}
                >
                  <Check className="w-4 h-4 stroke-[2.8]" />
                </button>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {isAr ? 'مرساة النشاط البدني والرياضة' : 'Daily Physical & Sport Anchor'}
                  </span>
                  <span
                    className={`block text-xs truncate mt-0.5 ${
                      isGymDone
                        ? 'text-zinc-700 dark:text-emerald-200/80'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {isAr
                      ? 'أطلس الحركات المصوّر • ترشيح اليوم حسب تمرين الأمس وتبديل التمارين'
                      : 'Visual movement atlas • Yesterday-to-Today coach & exercise swap'}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 border ${
                    isGymDone
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200 border-emerald-500/30'
                      : 'bg-orange-500/15 text-orange-900 dark:text-orange-300 border-orange-500/25'
                  }`}
                >
                  {isGymDone ? (isAr ? 'اليوم ✓' : 'Today ✓') : isAr ? 'الأطلس المصور 🏋️' : 'Visual Gym 🏋️'}
                </span>
              </div>

              {/* Habit 5: Surah Al-Mulk (Night Protection) (Starlit Royal Violet Theme) */}
              <div
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsHomeSurahMulkOpen(true);
                }}
                className={`group relative overflow-hidden rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  todayLog?.surahMulkDone
                    ? 'bento-3d-mint border-[#22c55e]/60 shadow-[0_8px_20px_-6px_rgba(34,197,94,0.25)]'
                    : 'bg-gradient-to-l from-indigo-500/[0.08] via-purple-500/[0.04] to-white dark:from-indigo-950/45 dark:via-zinc-900/90 dark:to-zinc-900 border-indigo-400/40 dark:border-indigo-500/25 hover:border-indigo-500/50 shadow-2xs'
                }`}
              >
                <span className="w-1.5 self-stretch rounded-full bg-gradient-to-b from-indigo-500 to-purple-600 shrink-0" />
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
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 border ${
                    todayLog?.surahMulkDone
                      ? 'bg-gradient-to-br from-[#22c55e] to-[#15803d] text-white border-amber-300/60 shadow-sm'
                      : 'bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500/35 text-indigo-700 dark:text-indigo-300 hover:bg-habit-green-ink hover:text-white'
                  }`}
                  title={isAr ? 'تسجيل قراءة سورة الملك فوراً (+30 XP)' : '1-Tap log Surah Mulk (+30 XP)'}
                >
                  <Check className="w-4 h-4 stroke-[2.8]" />
                </button>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {isAr ? 'سورة الملك (المنجية قبل النوم)' : 'Surah Al-Mulk (Night Protection)'}
                  </span>
                  <span
                    className={`block text-xs truncate mt-0.5 ${
                      todayLog?.surahMulkDone
                        ? 'text-zinc-700 dark:text-emerald-200/80'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {isAr ? '٣٠ آية تشفع لصاحبها وتنير ليلته • اضغط للقراءة' : '30 verses before sleep • Tap to read'}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 border ${
                    todayLog?.surahMulkDone
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200 border-emerald-500/30'
                      : 'bg-indigo-500/15 text-indigo-900 dark:text-indigo-300 border-indigo-500/25'
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

              {/* Habit 6: Sunnah Fasting (Sacred Rose-Gold & Alabaster Theme) */}
              <div
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsFastingModalOpen(true);
                }}
                className={`group relative overflow-hidden rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  todayLog?.fastingDone
                    ? 'bento-3d-mint border-[#22c55e]/60 shadow-[0_8px_20px_-6px_rgba(34,197,94,0.25)]'
                    : 'bg-gradient-to-l from-rose-500/[0.07] via-amber-500/[0.03] to-white dark:from-rose-950/35 dark:via-zinc-900/90 dark:to-zinc-900 border-rose-400/35 dark:border-rose-500/25 hover:border-rose-500/50 shadow-2xs'
                }`}
              >
                <span className="w-1.5 self-stretch rounded-full bg-gradient-to-b from-rose-400 to-amber-500 shrink-0" />
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
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 border ${
                    todayLog?.fastingDone
                      ? 'bg-gradient-to-br from-[#22c55e] to-[#15803d] text-white border-amber-300/60 shadow-sm'
                      : 'bg-rose-500/15 dark:bg-rose-500/20 border-rose-500/35 text-rose-700 dark:text-rose-300 hover:bg-habit-green-ink hover:text-white'
                  }`}
                  title={isAr ? 'تسجيل صيام اليوم فوراً (+25 XP)' : '1-Tap log Fasting (+25 XP)'}
                >
                  <Check className="w-4 h-4 stroke-[2.8]" />
                </button>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {isAr ? 'صيام التطوع والأيام البيض' : 'Sunnah Voluntary Fasting'}
                  </span>
                  <span
                    className={`block text-xs truncate mt-0.5 ${
                      todayLog?.fastingDone
                        ? 'text-zinc-700 dark:text-emerald-200/80'
                        : 'text-zinc-600 dark:text-zinc-400'
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
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 border ${
                    todayLog?.fastingDone
                      ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-900 dark:text-rose-300 border-rose-500/25'
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
                  className={`md:col-span-2 rounded-[22px] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                    todayLog?.surahKahfDone
                      ? 'bento-3d-mint border-[#22c55e]/50'
                      : 'bento-3d-amber border-amber-300/60 dark:border-amber-700/50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      todayLog?.surahKahfDone
                        ? 'bg-habit-green-ink text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.8]" />
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

            {/* Tactile Instrument Capsules Strip */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsSmartAppointmentsOpen(true);
                }}
                className="px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95 transition-transform flex items-center gap-1.5"
              >
                <span>📅</span>
                <span>{isAr ? 'مفكرة المواعيد والمناسبات والهدايا 🎁' : 'Appointments & Occasions 🎁'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsBookSanctuaryOpen(true);
                }}
                className="px-3.5 py-2 rounded-full bg-gradient-to-r from-[#1eb814] to-emerald-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95 transition-transform flex items-center gap-1.5"
              >
                <span>📚</span>
                <span>{isAr ? 'مكتبة القراءة والكتب' : 'Book Reading Shelf'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsChessLabOpen(true);
                }}
                className="px-3.5 py-2 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95 transition-transform flex items-center gap-1.5"
              >
                <span>♟️</span>
                <span>{isAr ? 'مختبر الشطرنج والخطط' : 'Chess Lab & Plans'}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenSmartTasbih('khitam_salah')}
                className="px-3.5 py-2 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-950 dark:text-emerald-200 shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-transform flex items-center gap-1.5"
              >
                <span>📿</span>
                <span>{isAr ? 'المسبحة الذكية' : 'Smart Tasbih'}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-mono">33×3</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWeeklyReportOpen(true)}
                className="px-3.5 py-2 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/10 border border-indigo-500/30 text-xs font-bold text-indigo-950 dark:text-indigo-200 shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-transform flex items-center gap-1.5"
              >
                <span>📊</span>
                <span>{isAr ? 'حصاد الأسبوع' : 'Weekly Report'}</span>
              </button>
              {onOpenPanic && (
                <button
                  type="button"
                  onClick={onOpenPanic}
                  className="px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/35 text-xs font-bold text-amber-950 dark:text-amber-200 shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-transform flex items-center gap-1.5"
                >
                  <span>⚡</span>
                  <span>{isAr ? 'قاعدة الدقيقتين' : '2-Min Rule'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAnomalyModalOpen(true)}
                className="px-3.5 py-2 rounded-full bg-gradient-to-r from-rose-500/15 to-pink-500/10 border border-rose-500/30 text-xs font-bold text-rose-950 dark:text-rose-200 shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-transform flex items-center gap-1.5"
              >
                <span>🛡️</span>
                <span>{isAr ? 'توثيق ظرف طارئ' : 'Streak Shield'}</span>
              </button>
            </div>
          </div>

          {/* 1.15 Smart Daily Appointments, Occasions, Pre-Event Gift Prep & Post-Satisfaction Hub */}
          <SmartDailyAppointmentsWidget
            onOpenFullModal={() => setIsSmartAppointmentsOpen(true)}
            onRewardToast={onRewardToast}
          />

          {/* 1.2 Official 5-Prayer Strip & Detailed Khushu Logger */}
          <PrayerTimesBar
            todayLog={todayLog}
            userState={userState}
            onOpenLocationModal={onOpenLocationModal}
            onRewardToast={onRewardToast}
            onOpenSmartTasbih={onOpenSmartTasbih}
            externalTriggerPrayer={externalTriggerPrayer}
          />

          {/* ============================================================== */}
          {/* 1.3 MOTIVATING 4-CARD DAILY HIGHLIGHTS BENTO (ومضات اليوم)      */}
          {/* Instant 1-tap access to Vocab, Wisdom, Chess Lab & Books       */}
          {/* ============================================================== */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                {isAr ? 'ومضات وإلهام اليوم' : 'Daily Highlights'}
              </h2>
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                {isAr ? 'الكتب، اللغات، نماذج التفكير، والتركيز التكتيكي' : 'Books, Language, Models & Chess'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Highlight 1: Word of the Day with 1-Tap Audio & Quiz Modal (Soft Lavender #e2defc) */}
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

              {/* Highlight 2: Mental Model & Daily Wisdom (Soft Amber #fde6d8) */}
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

              {/* Highlight 3: Chess Tactical Lab & Opening Plans (Soft Mint #d4f5dc) */}
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsChessLabOpen(true);
                }}
                className="bento-3d-mint p-4 rounded-[24px] border border-white/50 dark:border-emerald-500/25 text-start flex flex-col justify-between gap-2.5 cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-habit-green-ink text-white text-[10px] font-bold">
                      ♟️ {isAr ? 'شطرنج وتركيز' : 'Chess Lab'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-950 dark:text-emerald-200">
                      {isAr ? '+20 XP للغز' : '+20 XP'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {isAr ? 'ملف خطط الشطرنج وهنتات التركيز' : 'Opening Repertoire & Tactical Puzzles'}
                  </p>
                  <p className="text-[11px] text-zinc-700 dark:text-emerald-100/80 line-clamp-1">
                    {isAr
                      ? 'ألغاز تكتيكية سريعة بهنتات ذكية + خطط الأبيض والأسود ورقعة حرة'
                      : 'Quick focus puzzles with hints + opening plans & free board'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                  <span>{isAr ? 'افتح الرقعة التفاعلية والخطط' : 'Open Board & Plans'}</span>
                  <span>{isAr ? '←' : '→'}</span>
                </span>
              </button>

              {/* Highlight 4: Book Reading Sanctuary & Daily Page Logger (Soft Rose/Gold) */}
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsBookSanctuaryOpen(true);
                }}
                className="bento-3d-rose p-4 rounded-[24px] border border-white/50 dark:border-rose-500/25 text-start flex flex-col justify-between gap-2.5 cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#a824e0] text-white text-[10px] font-bold">
                      📚 {isAr ? 'محراب القراءة' : 'Reading Shelf'}
                    </span>
                    <span className="text-[10px] font-bold text-rose-950 dark:text-rose-200">
                      {isAr ? '+15 XP للصفحات' : '+15 XP'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {isAr ? 'رف الكتب والورد القرائي اليومي' : 'Bookshelf & Daily Pages Tracker'}
                  </p>
                  <p className="text-[11px] text-zinc-700 dark:text-rose-100/80 line-clamp-1">
                    {isAr
                      ? 'تتبع الصفحات (+5/+10 ص)، مؤقت قراءة هادئ، ودفتر الفوائد والاقتباسات'
                      : 'Log pages read, focus timer, and book quotes vault'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-rose-900 dark:text-rose-300 flex items-center justify-between">
                  <span>{isAr ? 'افتح رف الكتب وسجّل صفحاتك' : 'Open Bookshelf'}</span>
                  <span>{isAr ? '←' : '→'}</span>
                </span>
              </button>
            </div>
          </div>
      </div>

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


      {typeof document !== 'undefined' &&
        createPortal(
          <>
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
                className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
                onClick={() => setIsReadMoreWisdomOpen(false)}
              >
                <div
                  className="w-full max-w-lg modal-surface border border-white/15 rounded-[28px] overflow-hidden max-h-[90dvh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
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

                  <div className="p-5 sm:p-6 space-y-3.5 text-xs leading-relaxed overflow-y-auto overscroll-contain">
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

            {/* 1-Tap Quick Work & Workout Schedule + Active Station Override Modal */}
            {isQuickScheduleOpen && (
              <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
                onClick={() => setIsQuickScheduleOpen(false)}
              >
                <div
                  className="w-full max-w-lg modal-surface border border-white/15 rounded-[28px] overflow-hidden max-h-[90dvh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="celestial-obsidian-stage text-white p-5 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/35 flex items-center justify-center text-2xl shrink-0">
                        ⏰
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {isAr ? 'مواعيدي والجدول اليومي والوضع الحالي' : 'My Schedule, Appointments & Active Mode'}
                        </h3>
                        <p className="text-[11px] text-zinc-300">
                          {isAr
                            ? 'افتح مفكرة مواعيدك ومناسباتك أو خصّص ساعات عملك ورياضتك بضغطة واحدة'
                            : 'Open your appointments journal or customize your work & workout hours'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQuickScheduleOpen(false)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain text-xs">
                    {/* 0. Direct 1-Tap Gateway to Daily Appointments, Occasions & Gift Prep */}
                    <div className="p-3.5 rounded-[22px] bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-emerald-500/15 border-2 border-amber-400/60 dark:border-amber-500/35 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-bold text-zinc-950 dark:text-white block text-xs sm:text-sm">
                          {isAr ? '📅 مفكرة المواعيد والمناسبات والهدايا' : '📅 Appointments, Occasions & Gift Prep'}
                        </span>
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-300 block mt-0.5">
                          {isAr
                            ? 'سجّل مواعيد الشغل، الخروجات، الأطباء، والمناسبات مع تذكير التحضير قبلها'
                            : 'Manage dated appointments, outings, and pre-event reminders'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          setIsQuickScheduleOpen(false);
                          setIsSmartAppointmentsOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm active:scale-95 transition-transform"
                      >
                        {isAr ? 'فتح المفكرة ←' : 'Open ←'}
                      </button>
                    </div>

                    {/* 1. Instant Manual Station Mode Switcher */}
                    <div className="p-4 rounded-[22px] bento-3d-mint border border-emerald-300/60 dark:border-emerald-800/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">
                          {isAr ? '⚡ ما هو وضعك الحالي الآن؟ (تبديل فوري)' : '⚡ What is your mode right now?'}
                        </span>
                        {activeManualOverride && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSaveScheduleConfig({
                                manualStationOverride: undefined,
                              })
                            }
                            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/90 text-emerald-900 cursor-pointer"
                          >
                            {isAr ? 'إعادة للوضع التلقائي 🔄' : 'Auto Mode 🔄'}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            id: 'WORK_MICRO_SPRINT' as StationId,
                            label: isAr ? '💼 أنا في العمل / المذاكرة الآن' : '💼 At Work / Studying Now',
                          },
                          {
                            id: 'GYM_ANCHOR' as StationId,
                            label: isAr ? '🏋️ وقت الرياضة والنشاط الآن' : '🏋️ Workout Time Now',
                          },
                          {
                            id: 'COMMUTE_MORNING' as StationId,
                            label: isAr ? '🌅 ورد الصباح والقرآن' : '🌅 Morning Wird',
                          },
                          {
                            id: 'EVENING_SPRINT' as StationId,
                            label: isAr ? '💻 شوط المساء والتعلم' : '💻 Evening Sprint',
                          },
                        ].map((mode) => {
                          const isCurrent = currentSuggestedStation.id === mode.id;
                          return (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={async () => {
                                await handleSaveScheduleConfig({
                                  manualStationOverride: {
                                    stationId: mode.id,
                                    date: todayBioDate,
                                  },
                                });
                                setIsQuickScheduleOpen(false);
                              }}
                              className={`p-2.5 rounded-2xl border text-start font-bold transition-all cursor-pointer active:scale-95 ${
                                isCurrent
                                  ? 'bg-[#141517] text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-sm'
                                  : 'bg-white/85 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-emerald-200/70 dark:border-zinc-700'
                              }`}
                            >
                              {mode.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Work Start & End Hours */}
                    <div className="p-4 rounded-[22px] bento-3d-sky border border-sky-300/60 dark:border-sky-800/40 space-y-3">
                      <span className="font-bold text-zinc-900 dark:text-white block text-xs sm:text-sm">
                        {isAr ? '💼 مواعيد ساعات العمل أو الدراسة الرسمية:' : '💼 Official Work / Study Hours:'}
                      </span>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          {isAr ? 'بداية العمل:' : 'Work Starts:'}
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            { h: 7, l: '7 ص' },
                            { h: 8, l: '8 ص' },
                            { h: 9, l: '9 ص' },
                            { h: 10, l: '10 ص' },
                            { h: 11, l: '11 ص' },
                          ].map((opt) => (
                            <button
                              key={opt.h}
                              type="button"
                              onClick={() => handleSaveScheduleConfig({ workStartHour: opt.h })}
                              className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                                userWorkStartHour === opt.h
                                  ? 'bg-[#141517] text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                                  : 'bg-white/85 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-sky-200/70 dark:border-zinc-700'
                              }`}
                            >
                              {opt.l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          {isAr ? 'نهاية العمل (لن يزعجك التطبيق بالرياضة قبل هذا الوقت):' : 'Work Ends:'}
                        </label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {[
                            { h: 14, l: '2 م' },
                            { h: 15, l: '3 م' },
                            { h: 16, l: '4 م' },
                            { h: 17, l: '5 م' },
                            { h: 18, l: '6 م' },
                            { h: 19, l: '7 م' },
                          ].map((opt) => (
                            <button
                              key={opt.h}
                              type="button"
                              onClick={() => {
                                const nextWorkout =
                                  userWorkoutStartHour >= userWorkStartHour && userWorkoutStartHour < opt.h
                                    ? Math.min(21, opt.h + 1)
                                    : userWorkoutStartHour;
                                handleSaveScheduleConfig({
                                  workEndHour: opt.h,
                                  workoutStartHour: nextWorkout,
                                });
                              }}
                              className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                                userWorkEndHour === opt.h
                                  ? 'bg-[#141517] text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                                  : 'bg-white/85 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-sky-200/70 dark:border-zinc-700'
                              }`}
                            >
                              {opt.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 3. Preferred Workout Hour */}
                    <div className="p-4 rounded-[22px] bento-3d-amber border border-amber-300/60 dark:border-amber-800/40 space-y-2.5">
                      <span className="font-bold text-zinc-900 dark:text-white block text-xs sm:text-sm">
                        {isAr ? '🏋️ الموعد اليومي المفضل للرياضة:' : '🏋️ Preferred Daily Workout Time:'}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { h: 6, l: isAr ? '🌅 صباحاً (6:00 ص)' : '🌅 Morning (6 AM)' },
                          { h: 17, l: isAr ? '🌤️ عصراً (5:00 م)' : '🌤️ 5:00 PM' },
                          { h: 18, l: isAr ? '🌇 بعد العمل (6:00 م)' : '🌇 6:00 PM' },
                          { h: 19, l: isAr ? '🌆 المغرب (7:00 م)' : '🌆 7:00 PM' },
                          { h: 20, l: isAr ? '🌙 مساءً (8:00 م)' : '🌙 8:00 PM' },
                          { h: -1, l: isAr ? '☕ بدون رياضة / راحة' : '☕ Rest / No Gym' },
                        ].map((opt) => (
                          <button
                            key={opt.h}
                            type="button"
                            onClick={() =>
                              handleSaveScheduleConfig({
                                workoutStartHour: opt.h,
                                workoutPreference: opt.h === -1 ? 'none_rest' : (routineAns?.workoutPreference === 'none_rest' ? 'gym_iron' : (routineAns?.workoutPreference || 'gym_iron')),
                              })
                            }
                            className={`py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                              userWorkoutStartHour === opt.h
                                ? 'bg-[#141517] text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                                : 'bg-white/85 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-amber-200/70 dark:border-zinc-700'
                            }`}
                          >
                            {opt.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-2.5 pt-1">
                      {onOpenLifestyleModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickScheduleOpen(false);
                            onOpenLifestyleModal();
                          }}
                          className="px-4 py-2.5 rounded-full surface-card-3d border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer"
                        >
                          {isAr ? 'تخصيص المحطات المتقدم ⚙️' : 'Advanced Stations ⚙️'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsQuickScheduleOpen(false)}
                        className="ms-auto px-6 py-2.5 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs shadow-md cursor-pointer active:scale-95 transition-transform"
                      >
                        {isAr ? 'تم الحفظ ✓' : 'Done ✓'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chess Tactical Lab & Opening Repertoire Modal */}
            <ChessTacticalLabModal
              isOpen={isChessLabOpen}
              onClose={() => setIsChessLabOpen(false)}
              isAr={isAr}
              onRewardToast={onRewardToast}
            />

            {/* Book Reading Sanctuary & Daily Page Tracker Modal */}
            <BookReadingSanctuaryModal
              isOpen={isBookSanctuaryOpen}
              onClose={() => setIsBookSanctuaryOpen(false)}
              isAr={isAr}
              onRewardToast={onRewardToast}
            />

            {/* Smart Daily Appointments, Occasions, Pre-Prep Gift Assistant & Post-Satisfaction Modal */}
            <SmartAppointmentsModal
              isOpen={isSmartAppointmentsOpen}
              onClose={() => setIsSmartAppointmentsOpen(false)}
              onRewardToast={onRewardToast}
            />
          </>,
          document.body
        )}
    </div>
  );
};
