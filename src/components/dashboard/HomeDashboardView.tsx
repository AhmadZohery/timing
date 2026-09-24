import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Flame,
  Shield,
  BookOpen,
  Briefcase,
  Dumbbell,
  Laptop,
  CheckCircle2,
  Sun,
  Moon,
  Sunrise,
  Volume2,
  Globe,
  Play,
  Pause,
  Radio,
  Activity,
  ShieldCheck,
  Feather,
  Calendar,
} from 'lucide-react';
import type { DailyLog, UserState, StationId, UserProfile } from '../../types';
import { TARGET_LANGUAGES } from '../../data/languages/vocabularyDatabase';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { PrayerTimesBar } from '../spiritual/PrayerTimesBar';
import { DailyCircadianTimeline } from '../spiritual/DailyCircadianTimeline';
import { SmartAmbientNudgeCard } from './SmartAmbientNudgeCard';
import { AiBehavioralCopilotCard } from './AiBehavioralCopilotCard';
import { DailyTadabburCard } from '../spiritual/DailyTadabburCard';
import { DailyStationsRoadmap } from './DailyStationsRoadmap';
import { LIFESTYLE_PERSONAS } from '../../utils/lifestyleEngine';
import type { DailyTadabburItem } from '../../data/dailyTadabburData';
import { spacedRepetition } from '../../services/spacedRepetitionService';
import { speechService } from '../../services/speechService';
import { LanguageQuizModal } from '../learning/LanguageQuizModal';
import { LanguageMovesModal } from '../learning/LanguageMovesModal';
import { getDailyWisdom } from '../../data/lifeWisdomData';
import { gymFaithAudio, type GymFaithAudioState } from '../../services/gymFaithAudioService';
import { GymFaithAudioPlayer } from '../spiritual/GymFaithAudioPlayer';
import { scheduleService, type LearnedSportPattern } from '../../services/scheduleService';
import { ScheduleAnomalyModal } from '../modals/ScheduleAnomalyModal';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { MorningEveningAdhkarModal } from '../spiritual/MorningEveningAdhkarModal';
import { SurahMulkModal } from '../spiritual/SurahMulkModal';
import { FastingReminderModal } from '../spiritual/FastingReminderModal';
import { NawafilGuideModal, type NafilaTab } from '../spiritual/NawafilGuideModal';
import { getHijriDateDetails } from '../../utils/prayerCalculator';
import { awardSpiritualHabitPoints } from '../../utils/gamification';

interface HomeDashboardViewProps {
  userState?: UserState;
  todayLog?: DailyLog;
  allDailyLogs?: DailyLog[];
  activeProfile?: UserProfile;
  onSelectStation: (stationId: StationId) => void;
  onOpenSmartTasbih: (mode?: any) => void;
  onOpenSleepRest: () => void;
  onOpenEvaluation: () => void;
  onOpenLocationModal: () => void;
  onRewardToast: (msg: string) => void;
  onOpenTadabburModal?: (item?: DailyTadabburItem, tab?: 'quran' | 'hadith') => void;
  completedStations?: string[];
  onOpenLifestyleModal?: () => void;
  onOpenFaithAudio?: () => void;
  onOpenArabicPoetry?: () => void;
  onOpenLifeWisdom?: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  userState,
  todayLog,
  allDailyLogs,
  activeProfile,
  onSelectStation,
  onOpenSmartTasbih,
  onOpenSleepRest,
  onOpenEvaluation,
  onOpenLocationModal,
  onRewardToast,
  onOpenTadabburModal,
  completedStations = [],
  onOpenLifestyleModal,
  onOpenFaithAudio,
  onOpenArabicPoetry,
  onOpenLifeWisdom,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const now = new Date();
  const currentHour = now.getHours();

  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const personaConfig = LIFESTYLE_PERSONAS[personaId] || LIFESTYLE_PERSONAS.builder_exec;
  const overrides = userState?.settings?.stationCustomOverrides;

  const allStationIds: StationId[] = [
    'COMMUTE_MORNING',
    'WORK_MICRO_SPRINT',
    'GYM_ANCHOR',
    'EVENING_SPRINT',
    'RETROSPECTIVE_CHECKIN',
    'GRAND_REWARD_STATE',
  ];

  // Multilingual Daily Vocabulary on Home Dashboard
  const [isHomeQuizOpen, setIsHomeQuizOpen] = useState(false);
  const activeLangCode = spacedRepetition.getActiveLanguage();
  const currentLangObj =
    TARGET_LANGUAGES.find((l) => l.code === activeLangCode) || TARGET_LANGUAGES[0];
  const todayWords = useMemo(
    () => spacedRepetition.getTodayWords(),
    [activeLangCode, isHomeQuizOpen]
  );
  const [languageStats, setLanguageStats] = useState(() => spacedRepetition.getStats());

  const handleHomeQuizCompleted = (score: number, total: number) => {
    setLanguageStats(spacedRepetition.getStats());
    onRewardToast(
      isAr
        ? `🏆 أحسنت! حققت ${score} من ${total} في اختبار الكلمات اليومي! (+20 XP)`
        : `🏆 Well done! ${score}/${total} correct in daily quiz! (+20 XP)`
    );
  };

  // Dynamic Daily Wisdom & Language Moves State
  const [wisdomCategory, setWisdomCategory] = useState<string>('all');
  const [isReadMoreWisdomOpen, setIsReadMoreWisdomOpen] = useState(false);
  const [isLanguageMovesOpen, setIsLanguageMovesOpen] = useState(false);
  const dailyWisdom = useMemo(() => getDailyWisdom(new Date(), wisdomCategory), [wisdomCategory]);

  // Faith Audio Live Sync & Resume State
  const [faithAudioState, setFaithAudioState] = useState<GymFaithAudioState>(() => gymFaithAudio.getState());
  useEffect(() => {
    return gymFaithAudio.subscribe(setFaithAudioState);
  }, []);

  const resumePoint = faithAudioState.resumePoint || gymFaithAudio.getSavedResumePoint();

  // Spiritual Modals & Smart Time-Based Nudges (Adhkar, Mulk, Fasting, Nawafil)
  const [isAdhkarModalOpen, setIsAdhkarModalOpen] = useState(false);
  const [adhkarMode, setAdhkarMode] = useState<'morning' | 'evening'>('morning');
  const [isHomeSurahMulkOpen, setIsHomeSurahMulkOpen] = useState(false);
  const [isFastingModalOpen, setIsFastingModalOpen] = useState(false);
  const [isNawafilModalOpen, setIsNawafilModalOpen] = useState(false);
  const [nawafilModalTab, setNawafilModalTab] = useState<NafilaTab>('qiyam');

  const currentDayOfWeek = now.getDay();
  const isMorningTime = currentHour >= 3 && currentHour < 15;
  const isTomorrowMonOrThu = currentDayOfWeek === 0 || currentDayOfWeek === 3;
  const isTodayMonOrThu = currentDayOfWeek === 1 || currentDayOfWeek === 4;
  const hijriInfo = useMemo(() => getHijriDateDetails(now), [now.getDate()]);

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

  // Dignified Arabic greetings
  const greeting = useMemo(() => {
    const nameSuffix = activeProfile?.name ? ` يا ${activeProfile.name}` : '';
    if (isFajrMorning) return `صباح النور والبركة${nameSuffix}`;
    if (isForenoon) return `طاب يومك وبورك مسعاك${nameSuffix}`;
    if (isNoon) return `ظهيرة موفقة ومفعمة بالإنجاز${nameSuffix}`;
    if (isAsr) return `مساء الهمة والنشاط${nameSuffix}`;
    if (isMaghrib) return `مساء الطمأنينة وحصاد الإنجاز${nameSuffix}`;
    return `ليلة هادئة ومباركة${nameSuffix}`;
  }, [isFajrMorning, isForenoon, isNoon, isAsr, isMaghrib, activeProfile?.name]);

  // Eloquent motivational message
  const motivationalMessage = useMemo(() => {
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
  }, [isFajrMorning, isForenoon, isNoon, isAsr, isMaghrib]);

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
        title: 'ورد الصباح وتلاوة القرآن الكريم',
        description: 'قراءة وِرد اليوم من سورة البقرة، أذكار الصباح، وحرز التوحيد (100 مرة).',
        cta: 'انطلق إلى محطة القرآن الكريم 📖',
        icon: BookOpen,
        badge: 'المحطة 1 • نافذة الصباح الباكر',
        badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      };
    }
    if (isForenoon || isNoon) {
      return {
        id: 'WORK_MICRO_SPRINT',
        title: 'شوط التركيز والعمل العميق',
        description: 'إنجاز المهام ذات الأولوية القصوى، وتفعيل مؤقت التركيز (20 دقيقة) بلا مقاطعة.',
        cta: 'انطلق إلى شوط التركيز ⚡',
        icon: Briefcase,
        badge: 'المحطة 2 • ذروة الإنتاجية والإتقان',
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
        title: 'شوط المساء والتعلم الذاتي',
        description: 'صلاة المغرب، مشاريعك وتطلعاتك الشخصية، والقراءة والمطالعة النافعة.',
        cta: 'انطلق إلى شوط المساء 💻',
        icon: Laptop,
        badge: 'المحطة 4 • جلسة البناء والتعلم',
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      };
    }
    return {
      id: 'RETROSPECTIVE_CHECKIN',
      title: 'مراجعة اليوم وسكينة الليل',
      description: 'تدوين الفكرة الذهبية، تقييم الإنجاز، سورة الملك، وأذكار النوم والاستشفاء.',
      cta: 'انطلق إلى مراجعة اليوم 📊',
      icon: CheckCircle2,
      badge: 'المحطة 5 • تفريغ الذهن والاستشفاء',
      badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    };
  }, [isFajrMorning, isForenoon, isNoon, isAsr, isMaghrib]);

  const streakDays = userState?.streakDays || 0;
  const totalPoints = userState?.totalPoints || 0;
  const shields = userState?.streakShields || 0;

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* ============================================================ */}
      {/* 1. HERO BENTO LIVING STAGE: GREETING + ACTIVE STATION CTA    */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200/90 dark:border-white/[0.08] p-5 sm:p-7 shadow-sm transition-all space-y-5">
        {/* Subtle Ambient Depth Lighting */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Top Tag & Time of Day Icon + Stats */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300">
                {isFajrMorning ? <Sunrise className="w-4 h-4" /> : isNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </span>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 font-mono tracking-wide">
                {isAr ? 'الرئيسية • مضمار LifeOS' : 'Midmar LifeOS Dashboard'}
              </span>
            </div>

            {/* Streak, Shield & Points Badges */}
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={onOpenEvaluation}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 shadow-2xs hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                title={isAr ? 'عرض لوحة التقييم الدوري والتحفيز' : 'Evaluation Report'}
              >
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                <span>{streakDays} {isAr ? 'أيام' : 'Days'}</span>
              </button>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/50 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>{shields}</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{totalPoints} {isAr ? 'ن' : 'pts'}</span>
              </div>
            </div>
          </div>

          {/* Majestic Classical Arabic Greeting & Spark */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight leading-snug">
              {greeting}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl font-sans font-medium">
              {motivationalMessage}
            </p>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DAILY STATIONS ROADMAP: خريطة مسار اليوم التفاعلية           */}
      {/* Ultra-compact 1-row milestone metro line & dynamic launcher   */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* 1.5. FAITH AUDIO QUICK-RESUME CONTROLLER                     */}
      {/* ============================================================ */}
      {resumePoint && (
        <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-slate-50 to-emerald-500/5 dark:from-emerald-950/30 dark:via-[#12131A] dark:to-emerald-950/20 border border-emerald-500/20 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                if (faithAudioState.isPlaying) {
                  gymFaithAudio.pause();
                } else {
                  gymFaithAudio.resumeLastPlayback();
                }
              }}
              className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
              title={faithAudioState.isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'استئناف الاستماع' : 'Resume Playback')}
            >
              {faithAudioState.isPlaying ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white ps-0.5" />
              )}
            </button>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'أثير السيرة وبطولات الصحابة' : 'Prophetic Faith Stream'}</span>
                </span>
                {faithAudioState.isPlaying && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-emerald-500 rounded-full animate-pulse delay-150" />
                  </span>
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white truncate">
                {resumePoint.seriesTitleAr
                  ? `${resumePoint.seriesTitleAr} • ${resumePoint.episodeTitleAr || ''}`
                  : resumePoint.channelTitleAr || resumePoint.sheikhAr}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                {resumePoint.sheikhAr} • {Math.floor(resumePoint.currentTime / 60)}:
                {(resumePoint.currentTime % 60).toString().padStart(2, '0')}{' '}
                {resumePoint.duration > 0 &&
                  `/ ${Math.floor(resumePoint.duration / 60)}:${(resumePoint.duration % 60).toString().padStart(2, '0')}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                if (onOpenFaithAudio) {
                  onOpenFaithAudio();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800/80 hover:bg-slate-100 text-slate-700 dark:text-zinc-200 text-xs font-bold border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              <span>{isAr ? 'فتح المشغل الكامل 🎙️' : 'Full Player 🎙️'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1.6. SMART TIME-BASED ADHKAR & SUNNAH FASTING SUITE          */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* A. Smart Morning / Evening Adhkar Card */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-50 to-amber-500/5 dark:from-amber-950/30 dark:via-[#12131A] dark:to-amber-950/20 border border-amber-500/20 dark:border-amber-500/30 flex flex-col justify-between gap-2.5 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                isMorningTime ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-600/20 text-indigo-400'
              }`}>
                {isMorningTime ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {isMorningTime ? 'أذكار الصباح المباركة ☀️' : 'أذكار المساء وحصن المسلم 🌙'}
                  </span>
                  {(isMorningTime ? todayLog?.adhkarMorningDone : todayLog?.adhkarEveningDone) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      مكتملة ✔
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                  {isMorningTime
                    ? (todayLog?.adhkarMorningDone ? 'تقبل الله منك! كُتبت في صحيفة حسناتك اليوم' : '«مَنْ قَالَهَا حِينَ يُصْبِحُ أُجِيرَ مِنَ الْجِنِّ حَتَّى يُمْسِيَ»')
                    : (todayLog?.adhkarEveningDone ? 'حرسك الله! كُتبت لك الحماية من كل سوء' : '«مَنْ قَالَهَا حِينَ يُمْسِي كَانَ فِي حِفْظِ اللَّهِ حَتَّى يُصْبِحَ»')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setAdhkarMode(isMorningTime ? 'morning' : 'evening');
                setIsAdhkarModalOpen(true);
              }}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer shrink-0"
            >
              {isAr ? 'فتح النافذة 📖' : 'Open 📖'}
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-amber-500/15">
            <button
              type="button"
              onClick={async () => {
                soundSynth.playStreakMilestoneChime();
                haptic.vibrateWorkDone();
                const habitKey = isMorningTime ? 'adhkar_morning' : 'adhkar_evening';
                const habitLabel = isMorningTime ? 'أذكار الصباح المباركة' : 'أذكار المساء وحصن المسلم';
                const res = await awardSpiritualHabitPoints(habitKey, habitLabel);
                onRewardToast(res.message || '✨ تم تسجيل الأذكار بنجاح (+20 نقطة)!');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                (isMorningTime ? todayLog?.adhkarMorningDone : todayLog?.adhkarEveningDone)
                  ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {(isMorningTime ? todayLog?.adhkarMorningDone : todayLog?.adhkarEveningDone)
                  ? 'تمت القراءة بنجاح اليوم ✔'
                  : 'أتممت القراءة 🤍 (+20 XP)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setAdhkarMode(isMorningTime ? 'morning' : 'evening');
                setIsAdhkarModalOpen(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <span>وضع الحافظ ⚡</span>
            </button>
          </div>
        </div>

        {/* B. Smart Fasting Reminder & Schedule Card */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-slate-50 to-emerald-500/5 dark:from-emerald-950/30 dark:via-[#12131A] dark:to-emerald-950/20 border border-emerald-500/20 dark:border-emerald-500/30 flex flex-col justify-between gap-2.5 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center text-lg shrink-0">
                🌙
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {isTodayMonOrThu
                      ? 'صيام التطوع اليوم (الإثنين / الخميس) 🤍'
                      : isTomorrowMonOrThu
                      ? 'تذكير: غداً صيام مستحب (الإثنين / الخميس) 🌙'
                      : 'سُنن الصيام ومواعيد الأيام البيض 🌙'}
                  </span>
                  {todayLog?.fastingDone && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      صائم ✔
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                  «تُعْرَضُ الأَعْمَالُ يَوْمَ الاِثْنَيْنِ وَالْخَمِيسِ فَأُحِبُّ أَنْ يُعْرَضَ عَمَلِي وَأَنَا صَائِمٌ»
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setIsFastingModalOpen(true);
              }}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer shrink-0"
            >
              {isAr ? 'الأحاديث والمواعيد 📖' : 'Schedule 📖'}
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-emerald-500/15">
            <button
              type="button"
              onClick={async () => {
                soundSynth.playStreakMilestoneChime();
                haptic.vibrateSprintCelebration();
                const res = await awardSpiritualHabitPoints('fasting' as any, 'صيام التطوع المبارك');
                onRewardToast(res.message || '🤍 تقبل الله طاعتك! تم تسجيل صيام اليوم بنجاح (+25 نقطة)');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                todayLog?.fastingDone
                  ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {todayLog?.fastingDone ? 'تم تسجيل الصيام بنجاح اليوم ✔' : 'أنا صائم اليوم 🤍 (+25 XP)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setIsFastingModalOpen(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <span>جدول الصيام 📅</span>
            </button>
          </div>
        </div>
      </div>


      {/* ============================================================ */}
      {/* 3. OFFICIAL REAL-TIME PRAYER TIMES BAR                       */}
      {/* ============================================================ */}
      <PrayerTimesBar
        todayLog={todayLog}
        userState={userState}
        onOpenLocationModal={onOpenLocationModal}
        onRewardToast={onRewardToast}
        onOpenSmartTasbih={onOpenSmartTasbih}
      />

      {/* ============================================================ */}
      {/* 3.2. AI COGNITIVE COPILOT & BEHAVIORAL INTELLIGENCE CARD     */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* 3.3. SPIRITUAL DEVOTIONS & SUNNAH BENTO                      */}
      {/* روضة الأذكار اليومية وسورة الملك وسنن الصيام وموسوعة النوافل */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950/20 via-slate-900/[0.03] to-indigo-950/20 dark:from-emerald-950/40 dark:via-zinc-900/70 dark:to-indigo-950/30 border border-emerald-500/20 dark:border-emerald-500/30 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shadow-inner shrink-0">
              🕊️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 font-serif">
                  {isAr ? 'روضة الأذكار والسنن النبوية' : 'Spiritual Devotions & Sunnah Sanctuary'}
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono">
                  {hijriInfo.formattedAr}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'أذكار الصباح والمساء، سورة الملك المنجية، صيام التطوع، ومحراب قيام الليل'
                  : 'Daily Adhkar, Surah Mulk, Sunnah Fasting, and Night Tahajjud'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20">
              {isAr ? '✨ بركة يومك' : '✨ Daily Blessings'}
            </span>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Adhkar (Morning / Evening) */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-amber-400/60 dark:hover:border-amber-500/40 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  {isMorningTime ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                    (isMorningTime ? todayLog?.adhkarMorningDone : todayLog?.adhkarEveningDone)
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {(isMorningTime ? todayLog?.adhkarMorningDone : todayLog?.adhkarEveningDone)
                    ? (isAr ? 'مكتملة ✓' : 'Completed ✓')
                    : isMorningTime
                    ? (isAr ? 'الصباح ☀️' : 'Morning')
                    : (isAr ? 'المساء 🌙' : 'Evening')}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {isMorningTime
                    ? (isAr ? 'أذكار الصباح وحصن المسلم' : 'Morning Adhkar')
                    : (isAr ? 'أذكار المساء وحصن المسلم' : 'Evening Adhkar')}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                  {isMorningTime
                    ? (isAr ? 'آية الكرسي، المعوذات، سيد الاستغفار وبك أصبحنا' : 'Ayat al-Kursi, Muawwidhat, Sayyid al-Istighfar')
                    : (isAr ? 'أمسينا وأمسى الملك لله، والتعوذ بكلمات الله التامات' : 'Evening fortress & prophetic supplications')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setAdhkarMode(isMorningTime ? 'morning' : 'evening');
                setIsAdhkarModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>{(isMorningTime ? todayLog?.adhkarMorningDone : todayLog?.adhkarEveningDone) ? (isAr ? 'مراجعة الأذكار 📿' : 'Review') : (isAr ? 'قراءة الأذكار والتحصين ☀️' : 'Read Adhkar')}</span>
            </button>
          </div>

          {/* Card 2: Surah Al-Mulk */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-indigo-400/60 dark:hover:border-indigo-500/40 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                    todayLog?.surahMulkDone
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black'
                      : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  {todayLog?.surahMulkDone ? (isAr ? 'تمت التلاوة ✓' : 'Recited ✓') : (isAr ? '30 آية 🌙' : '30 Verses')}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {isAr ? 'سورة الملك (المنجية)' : 'Surah Al-Mulk'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                  {isAr
                    ? '«سورة تبارك هي المانعة من عذاب القبر» تشفع لصاحبها كل ليلة'
                    : 'Protector from the torment of the grave. Recited before sleep.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsHomeSurahMulkOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-800 dark:text-indigo-300 font-bold text-xs border border-indigo-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>{todayLog?.surahMulkDone ? (isAr ? 'إعادة التلاوة 📖' : 'Re-read') : (isAr ? 'تلاوة سورة الملك 🌙' : 'Recite Mulk')}</span>
            </button>
          </div>

          {/* Card 3: Sunnah Fasting & White Days */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-400/60 dark:hover:border-emerald-500/40 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                    todayLog?.fastingDone
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black'
                      : hijriInfo.isWhiteDay
                      ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold animate-pulse'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {todayLog?.fastingDone
                    ? (isAr ? 'صائم اليوم 🤍' : 'Fasting Today 🤍')
                    : hijriInfo.isWhiteDay
                    ? (isAr ? 'أيام بيض 🌟' : 'White Days')
                    : isTodayMonOrThu
                    ? (isAr ? 'عرض الأعمال' : 'Mon/Thu')
                    : (isAr ? 'باب الريان' : 'Sunnah')}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {isAr ? 'سُنن الصيام والتطوع' : 'Sunnah Fasting'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                  {hijriInfo.isWhiteDay
                    ? (isAr ? `اليوم ${hijriInfo.day} ${hijriInfo.monthNameAr} (صيام الدهر كله)` : 'Today is one of the White Days')
                    : isTodayMonOrThu
                    ? (isAr ? 'اليوم يوم عرض الأعمال على الله' : 'Deeds are presented on Mon & Thu')
                    : hijriInfo.isTomorrowWhiteDay
                    ? (isAr ? 'غداً تبدأ الأيام البيض المستحبة' : 'White Days start tomorrow')
                    : (isAr ? 'صيام الإثنين والخميس والأيام البيض' : 'Mondays, Thursdays & White Days')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsFastingModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>{todayLog?.fastingDone ? (isAr ? 'مسجّل صائم ✔' : 'Logged ✔') : (isAr ? 'تسجيل الصيام أو النية 🤍' : 'Log Fasting / Intention')}</span>
            </button>
          </div>

          {/* Card 4: Qiyam al-Layl & Tahajjud */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-purple-400/60 dark:hover:border-purple-500/40 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                    todayLog?.qiyamNightDone
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black'
                      : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                  }`}
                >
                  {todayLog?.qiyamNightDone ? (isAr ? 'سُجِّل القيام 🌟' : 'Logged 🌟') : (isAr ? 'مراتب الآيات 🌌' : 'Night Prayer')}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {isAr ? 'قيام الليل والنوافل' : 'Qiyam & Tahajjud Ranks'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                  {isAr
                    ? '10 آيات (الغافلين)، 100 آية (القانتين)، 1000 آية (المقنطرين)'
                    : '10 verses (heedless), 100 (obedient), 1000 (abundant reward)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setNawafilModalTab('qiyam');
                setIsNawafilModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-800 dark:text-purple-300 font-bold text-xs border border-purple-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>{todayLog?.qiyamNightDone ? (isAr ? 'عرض مراتب القيام 🌌' : 'View Ranks') : (isAr ? 'دليل القيام والسنن 🌌' : 'Open Qiyam Guide')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. ROODAT AL-TADABBUR & HADITH ENGINE                        */}
      {/* ============================================================ */}
      {/* ============================================================ */}
      <DailyTadabburCard
        onOpenModal={(item, tab) => onOpenTadabburModal?.(item, tab)}
        onToast={onRewardToast}
      />

      {/* ============================================================ */}
      {/* 4.2. FAITH & KNOWLEDGE AUDIO SANCTUARY EMBEDDED              */}
      {/* أثير الوعي والدروس الإيمانية والفكرية (أهل السنة والجماعة)   */}
      {/* ============================================================ */}
      <GymFaithAudioPlayer
        onRewardToast={onRewardToast}
      />

      {/* ============================================================ */}
      {/* 4.3. INTELLECTUAL & CULTURAL WISDOM BENTO                    */}
      {/* ديوان الشعر العربي القديم المشروح & خزانة النماذج الفكرية     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Arabic Classical Poetry Card */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/20 dark:via-zinc-900 dark:to-transparent border border-amber-300/40 dark:border-amber-500/20 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Feather className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 font-serif">
                    {isAr ? 'ديوان الحكمة والشعر العربي' : 'Classical Arabic Poetry Diwan'}
                  </h3>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    {isAr ? 'عيون الشعر التليد وتفكيك المفردات' : 'Odes, Vocabulary & Life Wisdom'}
                  </span>
                </div>
              </div>

              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold">
                📜 {isAr ? 'أصالة وبيان' : 'Classics'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-serif">
              «عَلى قَدْرِ أَهْلِ العَزْمِ تَأْتِي العَزائِمُ ... وَتَأْتِي عَلَى قَدْرِ الكِرامِ المَكارِمُ»
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenArabicPoetry?.();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <span>📜</span>
            <span>{isAr ? 'تصفح ديوان الشعر والشرح اللغوي' : 'Open Poetry Diwan'}</span>
            <span>←</span>
          </button>
        </div>

        {/* Dynamic Daily Wisdom & Mental Models Card */}
        <div className="rounded-3xl bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent dark:from-cyan-950/20 dark:via-zinc-900 dark:to-transparent border border-cyan-300/40 dark:border-cyan-500/20 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3.5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-bold text-base shrink-0">
                  <span>{dailyWisdom.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                      {isAr ? 'حكمة ونموذج اليوم' : 'Daily Mental Model'}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40">
                      {dailyWisdom.categoryLabelAr}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400">
                    {dailyWisdom.titleAr} ({dailyWisdom.titleEn})
                  </span>
                </div>
              </div>

              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-600/15 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30">
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
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    wisdomCategory === c.id
                      ? 'bg-cyan-600 text-white font-black'
                      : 'bg-white/70 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-white/[0.06]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-700 dark:text-zinc-200 leading-relaxed font-medium bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-900/30">
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
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
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
              className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer shrink-0"
              title={isAr ? 'فتح الخزانة الكاملة' : 'Open Vault'}
            >
              <span>{isAr ? 'الخزانة الكاملة ←' : 'All Vault →'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4.5. ADAPTIVE SPORTS & HABIT LEARNING BENTO                  */}
      {/* "مع الوقت تتعلم وتفهم أني عملت كذا.. وخليني أحدد اليوم ايه"   */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200/90 dark:border-white/[0.08] p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? 'برنامج اليوم الرياضي وتعلم العادات' : 'Adaptive Sports & Habit Learning'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                  {isAr ? 'مرونة مطلقة' : '100% Flexible'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
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
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-800 dark:text-zinc-200 text-xs font-bold border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title={isAr ? 'توثيق ظرف طارئ وحماية الشعلة' : 'Log Anomaly & Protect Streak'}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'ظرف طارئ / حماية الشعلة 🛡️' : 'Log Anomaly / Shield 🛡️'}</span>
          </button>
        </div>

        {/* AI Habit Pattern Explanation Banner */}
        {learnedPattern && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <p className="font-medium text-[11px] sm:text-xs">
                {learnedPattern.explanationAr}
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 shrink-0">
              دقة {learnedPattern.confidence}%
            </span>
          </div>
        )}

        {/* 1-Tap Sport Selector for Today */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
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
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-200 font-bold shadow-xs ring-1 ring-amber-400/40'
                      : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-zinc-300 hover:border-amber-300'
                  }`}
                >
                  <span className="text-xs block truncate">{isAr ? sp.labelAr : sp.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. DAILY VOCABULARY MASTERY BENTO (الحصيلة اللغوية اليومية) */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200/90 dark:border-white/[0.08] p-4 sm:p-6 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? 'الحصيلة اللغوية اليومية' : 'Daily Language Mastery'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/40">
                  {currentLangObj.flag} {currentLangObj.nameAr}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isAr
                  ? `الورد اليومي: ${todayWords.length} كلمات • متبقي للمراجعة التكرارية: ${languageStats.dueReviewsCount}`
                  : `Daily Quota: ${todayWords.length} words • ${languageStats.dueReviewsCount} due for review`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundSynth.playCompletionChime();
                haptic.vibrateLight();
                setIsHomeQuizOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <span>🎯</span>
              <span>{isAr ? 'اختبار الكلمات اليومي' : 'Quick Quiz'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsLanguageMovesOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800/40 transition-colors cursor-pointer"
              title={isAr ? 'عرض بطاقات الكلمات الكاملة' : 'View full cards'}
            >
              <span>{isAr ? 'عرض البطاقات والتدريب ←' : 'Full Cards & Drill →'}</span>
            </button>
          </div>
        </div>

        {/* Active Word Spotlight Banner */}
        {todayWords[0] && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-slate-50 to-white dark:from-indigo-950/20 dark:via-zinc-900 dark:to-zinc-950 border border-indigo-100 dark:border-indigo-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  speechService.speak(todayWords[0].word, currentLangObj.speechCode, 1.0);
                }}
                className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
                title={isAr ? 'استمع للنطق البشري' : 'Listen speech'}
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white font-serif">
                    {todayWords[0].word}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {todayWords[0].phonetic}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 font-sans">
                  {todayWords[0].translationAr}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-zinc-300 bg-white/80 dark:bg-zinc-800/70 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 max-w-sm truncate">
              "{todayWords[0].contextSentence}"
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 6. 24-HOUR CIRCADIAN TIMELINE & GUIDANCE                     */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200/90 dark:border-white/[0.08] p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base">
            ☀️
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
              {isAr ? 'الإيقاع الحيوي ومسار اليوم' : 'Circadian Timeline & Guidance'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
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

      {/* Language Quiz Modal from Home Dashboard */}
      <ErrorBoundary fallbackTitle="تنبيه في اختبار الكلمات اليومي">
        <LanguageQuizModal
          isOpen={isHomeQuizOpen}
          onClose={() => {
            setIsHomeQuizOpen(false);
            setLanguageStats(spacedRepetition.getStats());
          }}
          words={todayWords}
          speechCode={currentLangObj.speechCode}
          onCompleted={handleHomeQuizCompleted}
        />
      </ErrorBoundary>

      {/* Language Moves & Full Flashcards Modal */}
      <ErrorBoundary fallbackTitle="تنبيه في بطاقات الكلمات">
        <LanguageMovesModal
          isOpen={isLanguageMovesOpen}
          onClose={() => {
            setIsLanguageMovesOpen(false);
            setLanguageStats(spacedRepetition.getStats());
          }}
          words={todayWords}
          speechCode={currentLangObj.speechCode}
          isAr={isAr}
          languageName={currentLangObj.nameAr}
        />
      </ErrorBoundary>

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
            className="w-full max-w-lg bg-white dark:bg-[#12131A] border border-cyan-400/40 dark:border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{dailyWisdom.icon}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
                    {dailyWisdom.titleAr}
                  </h3>
                  <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">
                    {dailyWisdom.titleEn}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReadMoreWisdomOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/40 text-cyan-900 dark:text-cyan-200 font-bold">
                «{dailyWisdom.summaryAr}»
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <span>🧠</span>
                  <span>{isAr ? 'الخلفية العلمية والشرح' : 'Scientific Explanation'}</span>
                </h4>
                <p className="text-slate-600 dark:text-zinc-300">
                  {dailyWisdom.detailedExplanationAr}
                </p>
              </div>

              <div className="space-y-1 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <h4 className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <span>📌</span>
                  <span>{isAr ? 'الخطوة العملية المباشرة' : 'Practical Action'}</span>
                </h4>
                <p className="text-emerald-700 dark:text-emerald-200 font-medium">
                  {dailyWisdom.practicalActionAr}
                </p>
              </div>

              {dailyWisdom.realLifeExampleAr && (
                <div className="space-y-1 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                  <h4 className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>{isAr ? 'مثال واقعي تطبيقي' : 'Real-Life Example'}</span>
                  </h4>
                  <p className="text-amber-700 dark:text-amber-200">
                    {dailyWisdom.realLifeExampleAr}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  const txt = `💡 ${dailyWisdom.titleAr} (${dailyWisdom.titleEn})\n\n«${dailyWisdom.summaryAr}»\n\n📌 الخطوة العملية: ${dailyWisdom.practicalActionAr}`;
                  navigator.clipboard.writeText(txt);
                  onRewardToast(isAr ? '📋 تم نسخ النموذج بنجاح!' : 'Copied to clipboard!');
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <span>📋</span>
                <span>{isAr ? 'نسخ الحكمة' : 'Copy Wisdom'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReadMoreWisdomOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Morning & Evening Adhkar Modal */}
      <MorningEveningAdhkarModal
        isOpen={isAdhkarModalOpen}
        onClose={() => setIsAdhkarModalOpen(false)}
        initialMode={adhkarMode}
        isCompleted={adhkarMode === 'morning' ? todayLog?.adhkarMorningDone : todayLog?.adhkarEveningDone}
        onRewardToast={onRewardToast}
      />

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
    </div>
  );
};
