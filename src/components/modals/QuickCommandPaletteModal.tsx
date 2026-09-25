import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Zap,
  BookOpen,
  Coffee,
  Sparkles,
  Bot,
  Flame,
  Moon,
  Volume2,
  VolumeX,
  Sun,
  Calendar,
  Gift,
  CheckCircle2,
  Shield,
  Clock,
  ArrowRight,
  Briefcase,
  Dumbbell,
  Laptop,
  Headphones,
} from 'lucide-react';
import type { StationId, UserState, DailyLog, PrayerName } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { awardPrayerPoints } from '../../utils/gamification';
import { calculatePrayerTimes } from '../../utils/prayerCalculator';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'stations' | 'spiritual' | 'timers' | 'ai' | 'tools';
  icon: any;
  iconColor: string;
  badge?: string;
  keywords: string[];
  action: () => void;
}

interface QuickCommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStation: (st: StationId) => void;
  onStartSuggestedSprint?: (dur: number) => void;
  onOpenSleepRest?: () => void;
  onOpenAiCoach?: () => void;
  onOpenTwoMinuteRule?: () => void;
  onOpenArchive?: () => void;
  onOpenRewards?: () => void;
  onOpenEvaluation?: () => void;
  onOpenSettings?: () => void;
  onToggleSurvivalMode?: () => void;
  onOpenFaithAudio?: () => void;
  onOpenArabicPoetry?: () => void;
  onOpenLifeWisdom?: () => void;
  userState?: UserState;
  todayLog?: DailyLog;
  onRewardToast?: (msg: string) => void;
}

export const QuickCommandPaletteModal: React.FC<QuickCommandPaletteModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <QuickCommandPaletteModalContent {...props} />;
};

const QuickCommandPaletteModalContent: React.FC<QuickCommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectStation,
  onStartSuggestedSprint,
  onOpenSleepRest,
  onOpenAiCoach,
  onOpenTwoMinuteRule,
  onOpenArchive,
  onOpenRewards,
  onOpenEvaluation,
  onOpenSettings,
  onToggleSurvivalMode,
  onOpenFaithAudio,
  onOpenArabicPoetry,
  onOpenLifeWisdom,
  userState,
  todayLog,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleLogPrayer = async (prayer: PrayerName, prayerNameAr: string) => {
    const now = new Date();
    const pLoc = userState?.settings?.prayerLocation;
    const pTimes = calculatePrayerTimes(
      now,
      pLoc?.latitude ?? 30.0444,
      pLoc?.longitude ?? 31.2357,
      pLoc?.calculationMethod ?? 'egyptian'
    );
    const res = await awardPrayerPoints(prayer, 'on_time', pTimes.isFriday);
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    onRewardToast?.(res.message || `🕌 تم تسجيل ${prayerNameAr} في وقتها بنجاح!`);
    onClose();
  };

  // Commands catalog
  const commands: CommandItem[] = useMemo(() => {
    return [
      // --- Timers & Anti-Friction ---
      {
        id: 'timer_golden_sprint',
        title: isAr ? 'بدء شوط التركيز الذهبي (20 دقيقة)' : 'Start Golden Focus Session (20 min)',
        subtitle: isAr ? 'المدة المثالية لكسر المقاومة وحماية التدفق الذهني' : 'Optimal duration to bypass procrastination',
        category: 'timers',
        icon: Zap,
        iconColor: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
        badge: '⚡ 20m',
        keywords: ['عمل', 'شوط', 'تركيز', 'focus', 'work', 'session', 'timer', 'مؤقت'],
        action: () => {
          onStartSuggestedSprint?.(20);
          onSelectStation('WORK_MICRO_SPRINT');
          onRewardToast?.('⚡ تم بدء شوط الـ 20 دقيقة للتركيز العميق!');
          onClose();
        },
      },
      {
        id: 'timer_two_minute',
        title: isAr ? 'قاعدة الدقيقتين (كسر التسويف الفوري)' : 'The 2-Minute Rule (Anti-Friction)',
        subtitle: isAr ? '120 ثانية فقط تبدأ بها دون أي التزام بما بعدها (+5 نقاط)' : 'Just 120 seconds to kickstart momentum',
        category: 'timers',
        icon: Flame,
        iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        badge: '⏱️ 2m',
        keywords: ['تسويف', 'كسل', 'دقيقتين', 'two', 'minute', 'procrastination', 'friction'],
        action: () => {
          onOpenTwoMinuteRule?.();
          onClose();
        },
      },
      {
        id: 'timer_sunnah_nap',
        title: isAr ? 'سِنة القيلولة النبوية (20 دقيقة)' : 'Sunnah Midday Nap (20 min)',
        subtitle: isAr ? 'استعادة سرعة البديهة وتفريغ الإجهاد الإدراكي' : 'Clear adenosine and reset brain bandwidth',
        category: 'timers',
        icon: Coffee,
        iconColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
        badge: '☕ 20m',
        keywords: ['قيلولة', 'نوم', 'ظهر', 'nap', 'sleep', 'power', 'rest'],
        action: () => {
          onOpenSleepRest?.();
          onClose();
        },
      },

      // --- Stations Navigation ---
      {
        id: 'station_commute',
        title: isAr ? 'الانتقال إلى: محطة الانطلاقة الصباحية والورد' : 'Go to: Morning Commute & Reading',
        subtitle: isAr ? 'المحطة 1 • تلاوة القرآن والقراءة الصباحية' : 'Station 1 • Quran & Morning Knowledge',
        category: 'stations',
        icon: BookOpen,
        iconColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
        badge: 'المحطة 1',
        keywords: ['صباح', 'قرآن', 'قراءة', 'بقرة', 'commute', 'morning', 'quran'],
        action: () => {
          onSelectStation('COMMUTE_MORNING');
          onClose();
        },
      },
      {
        id: 'station_work',
        title: isAr ? 'الانتقال إلى: محطة جلسة العمل والتركيز العميق' : 'Go to: Work Deep Focus Session',
        subtitle: isAr ? 'المحطة 2 • مهام اليوم، أشواط العمل، وأصوات التركيز' : 'Station 2 • Daily tasks & Focus sessions',
        category: 'stations',
        icon: Briefcase,
        iconColor: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
        badge: 'المحطة 2',
        keywords: ['عمل', 'وظيفة', 'تركيز', 'مهام', 'work', 'deep', 'tasks'],
        action: () => {
          onSelectStation('WORK_MICRO_SPRINT');
          onClose();
        },
      },
      {
        id: 'station_gym',
        title: isAr ? 'الانتقال إلى: مرساة النشاط البدني (الجيم)' : 'Go to: Gym & Physical Anchor',
        subtitle: isAr ? 'المحطة 3 • التمارين، ضخ الإندورفين، ومؤقت الراحة' : 'Station 3 • Workouts & Endorphins',
        category: 'stations',
        icon: Dumbbell,
        iconColor: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
        badge: 'المحطة 3',
        keywords: ['جيم', 'رياضة', 'تمارين', 'لياقة', 'gym', 'workout', 'fitness'],
        action: () => {
          onSelectStation('GYM_ANCHOR');
          onClose();
        },
      },
      {
        id: 'station_evening',
        title: isAr ? 'الانتقال إلى: جلسة الإنجاز المسائي والتواصل' : 'Go to: Evening Sprint & Outreach',
        subtitle: isAr ? 'المحطة 4 • برمجة، مشاريع خاصة، أو إدارة العملاء CRM' : 'Station 4 • Side-projects & Outreach',
        category: 'stations',
        icon: Laptop,
        iconColor: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
        badge: 'المحطة 4',
        keywords: ['مساء', 'برمجة', 'عملاء', 'crm', 'evening', 'coding'],
        action: () => {
          onSelectStation('EVENING_SPRINT');
          onClose();
        },
      },
      {
        id: 'station_retrospective',
        title: isAr ? 'الانتقال إلى: المراجعة اليومية والفكرة الذهبية' : 'Go to: Evening Retrospective',
        subtitle: isAr ? 'المحطة 5 • توثيق الفوز، الدروس المستفادة، وشحن الدوبامين' : 'Station 5 • Wins & Golden Nugget',
        category: 'stations',
        icon: CheckCircle2,
        iconColor: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
        badge: 'المحطة 5',
        keywords: ['مراجعة', 'تقييم', 'فكرة', 'retrospective', 'wins', 'review'],
        action: () => {
          onSelectStation('RETROSPECTIVE_CHECKIN');
          onClose();
        },
      },
      {
        id: 'station_rewards',
        title: isAr ? 'متجر المكافآت الواقعية (اشتري لنفسك كذا 🎁)' : 'Real-Life Rewards Marketplace 🎁',
        subtitle: isAr ? 'استبدال نقاط إنجازك بوجبة مفضلة، ملابس، أو مكافأة تسعدك' : 'Redeem points for meals, clothes, leisure',
        category: 'stations',
        icon: Gift,
        iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        badge: 'مكافآت 🎁',
        keywords: ['مكافأة', 'هدايا', 'شراء', 'نقاط', 'rewards', 'points', 'gift'],
        action: () => {
          onOpenRewards?.();
          onClose();
        },
      },

      // --- Prayers & Spiritual ---
      {
        id: 'prayer_fajr',
        title: isAr ? 'تسجيل صلاة الفجر في وقتها 🕌' : 'Log Fajr Prayer On Time 🕌',
        subtitle: isAr ? 'بداية البركة والسكينة (+25 نقطة)' : '+25 points on time',
        category: 'spiritual',
        icon: Sun,
        iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        badge: 'صلاة',
        keywords: ['فجر', 'صلاة', 'fajr', 'prayer'],
        action: () => handleLogPrayer('fajr', 'صلاة الفجر'),
      },
      {
        id: 'prayer_dhuhr',
        title: isAr ? 'تسجيل صلاة الظهر في وقتها 🕌' : 'Log Dhuhr Prayer On Time 🕌',
        subtitle: isAr ? '+15 نقطة ودرع حماية' : '+15 points on time',
        category: 'spiritual',
        icon: Sun,
        iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        badge: 'صلاة',
        keywords: ['ظهر', 'صلاة', 'dhuhr', 'prayer'],
        action: () => handleLogPrayer('dhuhr', 'صلاة الظهر'),
      },
      {
        id: 'prayer_asr',
        title: isAr ? 'تسجيل صلاة العصر في وقتها 🕌' : 'Log Asr Prayer On Time 🕌',
        subtitle: isAr ? 'الصلاة الوسطى (+15 نقطة)' : '+15 points on time',
        category: 'spiritual',
        icon: Sun,
        iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        badge: 'صلاة',
        keywords: ['عصر', 'صلاة', 'asr', 'prayer'],
        action: () => handleLogPrayer('asr', 'صلاة العصر'),
      },
      {
        id: 'prayer_maghrib',
        title: isAr ? 'تسجيل صلاة المغرب في وقتها 🕌' : 'Log Maghrib Prayer On Time 🕌',
        subtitle: isAr ? '+15 نقطة' : '+15 points on time',
        category: 'spiritual',
        icon: Moon,
        iconColor: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
        badge: 'صلاة',
        keywords: ['مغرب', 'صلاة', 'maghrib', 'prayer'],
        action: () => handleLogPrayer('maghrib', 'صلاة المغرب'),
      },
      {
        id: 'prayer_isha',
        title: isAr ? 'تسجيل صلاة العشاء في وقتها 🕌' : 'Log Isha Prayer On Time 🕌',
        subtitle: isAr ? '+15 نقطة وختام الصلوات الخمس' : '+15 points on time',
        category: 'spiritual',
        icon: Moon,
        iconColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
        badge: 'صلاة',
        keywords: ['عشاء', 'صلاة', 'isha', 'prayer'],
        action: () => handleLogPrayer('isha', 'صلاة العشاء'),
      },
      {
        id: 'spiritual_surah_mulk',
        title: isAr ? 'سورة الملك قبل النوم (30 آية منجية) 🌙' : 'Surah Mulk Before Sleep 🌙',
        subtitle: isAr ? 'تشفع لصاحبها وتمنحك سكينة تامة قبل النوم (+15 نقطة)' : 'Night peaceful recitation',
        category: 'spiritual',
        icon: Moon,
        iconColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
        badge: 'قرآن',
        keywords: ['ملك', 'سورة', 'نوم', 'mulk', 'surah', 'sleep'],
        action: () => {
          onOpenSleepRest?.();
          onClose();
        },
      },
      {
        id: 'spiritual_surah_kahf',
        title: isAr ? 'سورة الكهف والصلاة على النبي ﷺ (بركة الجمعة) 🕌' : 'Surah Al-Kahf & Friday Salawat 🕌',
        subtitle: isAr ? 'المصحف الشريف كاملًا، تدبر القصص الأربع، وعداد الصلوات (+30 XP)' : 'Complete Surah Al-Kahf, 4 Life Lessons & Salawat counter',
        category: 'spiritual',
        icon: BookOpen,
        iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        badge: '🕌 الجمعة',
        keywords: ['كهف', 'جمعة', 'صلاة', 'نبي', 'kahf', 'friday', 'salawat', 'surah', 'قرآن'],
        action: () => {
          onSelectStation('HOME');
          onClose();
        },
      },
      {
        id: 'faith_audio_hub',
        title: isAr ? 'أثير الوعي والدروس الإيمانية والفكرية 🎙️' : 'Faith & Intellectual Audio Sanctuary 🎙️',
        subtitle: isAr ? 'د. أحمد عبد المنعم، م. أيمن عبد الرحيم، الشيخ أمجد سمير، تضمين ساوند كلاود' : 'Scholars, intellectual series, and SoundCloud player',
        category: 'spiritual',
        icon: Headphones,
        iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        badge: 'أثير',
        keywords: ['دروس', 'صوتيات', 'أحمد عبد المنعم', 'أيمن عبد الرحيم', 'أمجد سمير', 'ساوند', 'ساوند كلاود', 'soundcloud', 'audio', 'podcast', 'sheikh', 'بودكاست'],
        action: () => {
          onOpenFaithAudio?.();
          onClose();
        },
      },

      // --- AI & Intelligence ---
      {
        id: 'ai_coach_chat',
        title: isAr ? 'استشارة المرشد السلوكي الذكي (مِضمار AI) 🪄' : 'Consult AI Cognitive Coach 🪄',
        subtitle: isAr ? 'حلول للتسويف، وتفكيك المهام الصعبة، وتوجيه نفسي مهدئ' : 'Overcome resistance & break down hard tasks',
        category: 'ai',
        icon: Bot,
        iconColor: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
        badge: 'AI Coach',
        keywords: ['مرشد', 'ذكاء', 'ai', 'coach', 'تفكير', 'مضمار', 'chat'],
        action: () => {
          onOpenAiCoach?.();
          onClose();
        },
      },
      {
        id: 'ai_behavioral_dna',
        title: isAr ? 'عرض البصمة السلوكية الفردية (Behavioral DNA) 🧬' : 'View Behavioral DNA & Patterns 🧬',
        subtitle: isAr ? 'ساعات ذروة تركيزك، مدة جلستك الذهبية، ومعامل أثر النوم' : 'Learned peak hours and habit sweet spots',
        category: 'ai',
        icon: Sparkles,
        iconColor: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
        badge: 'DNA 🧬',
        keywords: ['بصمة', 'سلوك', 'dna', 'patterns', 'learning', 'تعلم'],
        action: () => {
          onOpenAiCoach?.();
          onClose();
        },
      },

      // --- Tools & System ---
      {
        id: 'tool_survival_mode',
        title: isAr
          ? (userState?.survivalMode ? 'إلغاء وضع البقاء والعودة للوضع الطبيعي 🛡️' : 'تفعيل وضع البقاء (MVD Survival Mode) 🛡️')
          : (userState?.survivalMode ? 'Disable Survival Mode 🛡️' : 'Enable MVD Survival Mode 🛡️'),
        subtitle: isAr ? 'تقليص المتطلبات لـ 20% عند المرض أو انخفاض الطاقة لحماية شعلتك' : 'Protect streak during low energy days',
        category: 'tools',
        icon: Shield,
        iconColor: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
        badge: 'MVD',
        keywords: ['طاقة', 'بقاء', 'survival', 'mvd', 'sick', 'تعب'],
        action: () => {
          onToggleSurvivalMode?.();
          onClose();
        },
      },
      {
        id: 'tool_archive_calendar',
        title: isAr ? 'التقويم السنوي وسجل الإنجاز (365 يوماً) 📅' : 'Yearly Activity Heatmap & Archive 📅',
        subtitle: isAr ? 'سجل الأيام السابقة وخريطة النقاط والصلوات' : 'Historical logs and streak calendar',
        category: 'tools',
        icon: Calendar,
        iconColor: 'text-teal-500 bg-teal-500/10 border-teal-500/30',
        badge: 'أرشيف',
        keywords: ['أرشيف', 'تاريخ', 'تقويم', 'سجل', 'archive', 'calendar', 'history'],
        action: () => {
          onOpenArchive?.();
          onClose();
        },
      },
      {
        id: 'tool_pm_standup',
        title: isAr ? 'الوقفة اليومية وتكتيكات إدارة المشاريع (Daily PM Standup) 🎙️' : 'Daily Standup & Executive PM Phrases 🎙️',
        subtitle: isAr ? 'شحن تقرير الستاند اب لـ Slack/Teams ومراجعة تكتيك إداري ناطق' : 'Prepare and export standup report for Slack/Teams with audio phrase',
        category: 'tools',
        icon: Briefcase,
        iconColor: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
        badge: '🎙️ Standup',
        keywords: ['standup', 'agile', 'scrum', 'pm', 'slack', 'teams', 'وقفة', 'تقرير', 'إدارة', 'مشاريع'],
        action: () => {
          onSelectStation('WORK_MICRO_SPRINT');
          onClose();
        },
      },
      {
        id: 'tool_weekly_harvest',
        title: isAr ? 'تقرير حصاد البركة الأسبوعي وسرعة الإنجاز 📊' : 'Weekly Barakah Velocity & Harvest Report 📊',
        subtitle: isAr ? 'تحليل شامل للأركان الأربعة، بطاقة التزكية، وساعات العمل العميق' : '7-day analytics across 4 life pillars with Tazkiyah shield',
        category: 'tools',
        icon: Sparkles,
        iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        badge: 'حصاد',
        keywords: ['حصاد', 'بركة', 'أسبوعي', 'تقرير', 'weekly', 'harvest', 'barakah', 'velocity'],
        action: () => {
          onOpenEvaluation?.();
          onClose();
        },
      },
      {
        id: 'tool_evaluation',
        title: isAr ? 'التقييم الدوري والتحفيز (يومي / أسبوعي / شهري) 📊' : 'Periodic Evaluation & Motivation Report 📊',
        subtitle: isAr ? 'معدل الصلوات، توازن الجوانب، ونصائح تحفيزية' : 'Prayer ratio, balance scores & tips',
        category: 'tools',
        icon: Clock,
        iconColor: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
        badge: 'تقرير',
        keywords: ['تقرير', 'تقييم', 'أسبوعي', 'شهري', 'evaluation', 'report'],
        action: () => {
          onOpenEvaluation?.();
          onClose();
        },
      },
      {
        id: 'tool_arabic_poetry',
        title: isAr ? 'ديوان الشعر العربي الكلاسيكي والحكمة 📜' : 'Classical Arabic Poetry & Wisdom 📜',
        subtitle: isAr ? 'المتنبي، عنترة، الشافعي، زهير بن أبي سلمى مع بحور الشعر وشرح المعاني' : 'Ancient Arabic verse with meter and practical wisdom',
        category: 'tools',
        icon: BookOpen,
        iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        badge: 'شعر',
        keywords: ['شعر', 'أدب', 'متنبي', 'عنترة', 'شافعي', 'زهير', 'معري', 'قصيدة', 'بحر', 'poetry', 'arabic'],
        action: () => {
          onOpenArabicPoetry?.();
          onClose();
        },
      },
      {
        id: 'tool_life_wisdom',
        title: isAr ? 'منارة الحكمة والنماذج العقلية والإنتاجية 💡' : 'Life Wisdom & High-Impact Mental Models 💡',
        subtitle: isAr ? 'مبدأ باريتو، قانون باركنسون، نصل أوكام، قاعدة 10/10/10، والأثر التراكمي' : 'Mental models, Parkinson’s law, Pareto, and decision frameworks',
        category: 'tools',
        icon: Sparkles,
        iconColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
        badge: 'حكمة',
        keywords: ['حكمة', 'نماذج', 'عقلية', 'باريتو', 'باركنسون', 'أوكام', 'دوبامين', 'قرارات', 'wisdom', 'mental', 'models'],
        action: () => {
          onOpenLifeWisdom?.();
          onClose();
        },
      },
      {
        id: 'tool_english_idioms',
        title: isAr ? 'المصطلحات الإنجليزية اليومية ومختبر الطلاقة 🗣️' : 'Everyday English Idioms & Fluency 🗣️',
        subtitle: isAr ? 'مصطلحات وتعابير يومية شائعة للعمل والتواصل مع النطق الصوتي الفوري' : 'High-frequency everyday idioms, collocations and pronunciation',
        category: 'tools',
        icon: Headphones,
        iconColor: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
        badge: 'English',
        keywords: ['انجليزي', 'لغة', 'مصطلحات', 'تحدث', 'english', 'idioms', 'speaking', 'fluency'],
        action: () => {
          onSelectStation('COMMUTE_MORNING');
          onRewardToast?.('🗣️ تم فتح محطة الانطلاقة ومختبر الإنجليزية اليومي');
          onClose();
        },
      },
      {
        id: 'tool_toggle_theme',
        title: isAr ? 'تبديل المظهر (ليلي / نهاري) 🌓' : 'Toggle Theme (Dark / Light) 🌓',
        subtitle: isAr ? `الوضع الحالي: ${theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}` : `Current: ${theme}`,
        category: 'tools',
        icon: theme === 'dark' ? Sun : Moon,
        iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        badge: 'Theme',
        keywords: ['مظهر', 'ثيم', 'ليلي', 'نهاري', 'dark', 'light', 'theme'],
        action: () => {
          toggleTheme();
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        },
      },
      {
        id: 'tool_toggle_sound',
        title: isAr ? 'كتم / تشغيل المؤثرات الصوتية 🔊' : 'Toggle Sound Effects 🔊',
        subtitle: isAr ? 'كتم رنات الإنجاز في المساجد والاجتماعات بنقرة واحدة' : 'Mute/unmute all chimes and audio',
        category: 'tools',
        icon: soundSynth.isAudioMuted() ? VolumeX : Volume2,
        iconColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
        badge: 'Audio',
        keywords: ['صوت', 'كتم', 'رنين', 'sound', 'audio', 'mute'],
        action: () => {
          const isNowMuted = soundSynth.toggleMuted();
          haptic.vibrateLight();
          onRewardToast?.(isNowMuted ? '🔇 تم كتم كافة الأصوات' : '🔊 تم تشغيل الأصوات التفاعلية');
          onClose();
        },
      },
      {
        id: 'tool_settings',
        title: isAr ? 'النسخ الاحتياطي وإعدادات النظام ⚙️' : 'Settings & Local Backup ⚙️',
        subtitle: isAr ? 'تصدير البيانات، مزامنة QR، وتعديل جدول العمل' : 'Export JSON, QR sync, work rhythm',
        category: 'tools',
        icon: Shield,
        iconColor: 'text-slate-500 bg-slate-500/10 border-slate-500/30',
        badge: 'إعدادات',
        keywords: ['إعدادات', 'نسخ', 'باك اب', 'settings', 'backup'],
        action: () => {
          onOpenSettings?.();
          onClose();
        },
      },
    ];
  }, [
    isAr,
    theme,
    toggleTheme,
    userState,
    todayLog,
    onSelectStation,
    onStartSuggestedSprint,
    onOpenSleepRest,
    onOpenAiCoach,
    onOpenTwoMinuteRule,
    onOpenArchive,
    onOpenRewards,
    onOpenEvaluation,
    onOpenSettings,
    onToggleSurvivalMode,
    onRewardToast,
    onClose,
  ]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;
    const q = searchQuery.toLowerCase().trim();
    return commands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchSub = cmd.subtitle ? cmd.subtitle.toLowerCase().includes(q) : false;
      const matchKeywords = cmd.keywords.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchSub || matchKeywords;
    });
  }, [commands, searchQuery]);

  // Handle Keyboard Navigation (Up, Down, Enter, Esc)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        soundSynth.playTactileClick();
        haptic.vibrateLight();
        selected.action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement;
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-20 bg-slate-950/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3 bg-slate-50/70 dark:bg-zinc-950/40">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={isAr ? 'ابحث عن أي محطة، صلاة، مؤقت، أو إجراء سريع... (أو استخدم الأسهم)' : 'Search commands, stations, prayers, timers...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none outline-hidden text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
              Esc
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 max-h-[55vh]"
        >
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    cmd.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/40 text-indigo-950 dark:text-indigo-100 shadow-xs'
                      : 'bg-transparent border border-transparent hover:bg-slate-100/60 dark:hover:bg-zinc-800/40 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl border shrink-0 ${cmd.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold truncate">
                          {cmd.title}
                        </span>
                        {cmd.badge && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      {cmd.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-indigo-600 dark:text-indigo-400 -translate-x-0.5' : 'text-slate-300 dark:text-zinc-600'}`} />
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 space-y-2">
              <Search className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr ? 'لم يتم العثور على إجراء يطابق بحثك.' : 'No commands matched your query.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-[10px] font-mono">↓</kbd>
              <span>{isAr ? 'للتنقل' : 'Navigate'}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-[10px] font-mono">Enter</kbd>
              <span>{isAr ? 'للتنفيذ' : 'Execute'}</span>
            </span>
          </div>
          <span className="font-mono text-[10px]">
            {filteredCommands.length} {isAr ? 'إجراء متاح' : 'actions'}
          </span>
        </div>
      </div>
    </div>
  );
};
