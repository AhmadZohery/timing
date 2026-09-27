import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Flame,
  Shield,
  ShieldAlert,
  Clock,
  Target,
  BatteryCharging,
  Settings,
  AlertTriangle,
  Sun,
  Moon,
  Globe,
  Command,
  Download,
  Maximize2,
  Columns,
  Calendar,
  Users,
  Lightbulb,
  Trophy,
  PlusCircle,
  MapPin,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  ChevronDown,
  Gift,
  Search,
  Lock,
  Scroll,
  Palette,
  Ticket,
  Disc,
  BookOpen,
  Compass,
  Bell,
  GraduationCap,
  Pin,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import type { UserState } from '../types';
import { soundSynth } from '../services/soundSynthesizer';
import { haptic } from '../services/vibrationService';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export type HeaderPinActionId =
  | 'courses'
  | 'reminders'
  | 'search'
  | 'niyyah'
  | 'buffer'
  | 'panic'
  | 'survival'
  | 'sleep'
  | 'wird'
  | 'tasbih'
  | 'poetry'
  | 'wisdom'
  | 'goals'
  | 'coach'
  | 'palette'
  | 'archive'
  | 'mute'
  | 'theme';

const PINNABLE_OPTIONS: Array<{
  id: HeaderPinActionId;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
}> = [
  {
    id: 'courses',
    labelAr: 'المذاكرة والكورسات',
    labelEn: 'Study Hub',
    descAr: 'محراب المذاكرة ومسار التعلم الذكي بالذكاء الاصطناعي',
    descEn: 'AI learning roadmap and study sessions',
    icon: GraduationCap,
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
  },
  {
    id: 'reminders',
    labelAr: 'التذكيرات والمنبهات',
    labelEn: 'Reminders',
    descAr: 'منبهات وتذكيرات اليوم الفورية',
    descEn: 'Daily alarms and custom reminder prompts',
    icon: Bell,
    badgeClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'search',
    labelAr: 'البحث والأوامر (⌘K)',
    labelEn: 'Omnisearch (⌘K)',
    descAr: 'لوحة الأوامر الفورية والبحث السريع',
    descEn: 'Command palette and quick search',
    icon: Search,
    badgeClass: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
  },
  {
    id: 'niyyah',
    labelAr: 'تجديد النوايا',
    labelEn: 'Niyyah Sanctuary',
    descAr: 'محراب استحضار وتجديد النوايا الصادقة',
    descEn: 'Pure intentions sanctuary and alignment',
    icon: Compass,
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'buffer',
    labelAr: 'صندوق التأجيل',
    labelEn: 'Buffer Queue',
    descAr: 'تفريغ المهام الطارئة لعدم التشتت والارتباك',
    descEn: 'Buffer inbox for unexpected interruptions',
    icon: Clock,
    badgeClass: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
  },
  {
    id: 'panic',
    labelAr: 'زر الطوارئ (Panic)',
    labelEn: 'Panic Protocol',
    descAr: 'بروتوكول كسر الجمود واستعادة التركيز',
    descEn: 'Break overwhelm and regain instant calm',
    icon: AlertTriangle,
    badgeClass: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
  },
  {
    id: 'survival',
    labelAr: 'وضع MVD (الحد الأدنى)',
    labelEn: 'MVD Mode',
    descAr: 'بروتوكول اليوم الأدنى الفعّال لطاقة منخفضة',
    descEn: 'Minimum viable day mode for low energy',
    icon: ShieldAlert,
    badgeClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'sleep',
    labelAr: 'بروتوكول النوم',
    labelEn: 'Sleep Rest',
    descAr: 'تهيئة النوم والتهدئة المسائية العميقة',
    descEn: 'Evening wind-down and sleep prep',
    icon: Moon,
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
  },
  {
    id: 'wird',
    labelAr: 'الورد القرآني',
    labelEn: 'Quran Wird',
    descAr: 'القراءة والتدبر اليومي للقرآن',
    descEn: 'Daily Quran reading and reflection',
    icon: BookOpen,
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'tasbih',
    labelAr: 'السبحة الذكية',
    labelEn: 'Smart Tasbih',
    descAr: 'عداد الأذكار اليومية التفاعلي',
    descEn: 'Interactive counter for daily remembrance',
    icon: Disc,
    badgeClass: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
  },
  {
    id: 'poetry',
    labelAr: 'ديوان الشعر العربي',
    labelEn: 'Classical Poetry',
    descAr: 'مقتطفات وحكم الأدب والشعر الفصيح',
    descEn: 'Classical Arabic poetic gems and eloquence',
    icon: Scroll,
    badgeClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'wisdom',
    labelAr: 'منارة الحكمة',
    labelEn: 'Life Wisdom',
    descAr: 'حكم واقتباسات تعزيز الوعي والهدوء',
    descEn: 'Wisdom drops to reset mindset and focus',
    icon: Lightbulb,
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'goals',
    labelAr: 'الأهداف والسرعة',
    labelEn: 'Goals Velocity',
    descAr: 'تتبع تقدم الأهداف الكبرى ومعدل السرعة',
    descEn: 'Track macro milestones and velocity',
    icon: Target,
    badgeClass: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
  },
  {
    id: 'coach',
    labelAr: 'الموجه الذكي AI',
    labelEn: 'AI Coach',
    descAr: 'استشارات وتوجيهات الإنتاجية والتخطيط',
    descEn: 'AI conversational guidance for daily mastery',
    icon: Lightbulb,
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
  },
  {
    id: 'palette',
    labelAr: 'ألوان المظهر (Palette)',
    labelEn: 'Color Palette',
    descAr: 'تخصيص الهوية والسمة اللونية',
    descEn: 'Customize UI palette and aesthetic theme',
    icon: Palette,
    badgeClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/50 border-fuchsia-200 dark:border-fuchsia-800 text-fuchsia-700 dark:text-fuchsia-300',
  },
  {
    id: 'archive',
    labelAr: 'سجل وتاريخ الإنجاز',
    labelEn: 'History Archive',
    descAr: 'أرشيف الأيام السابقة ومراجعة التاريخ',
    descEn: 'Historical archive and previous logs',
    icon: Calendar,
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'mute',
    labelAr: 'مؤثرات الصوت',
    labelEn: 'Audio Feedback',
    descAr: 'كتم أو تشغيل المؤثرات الصوتية التفاعلية',
    descEn: 'Toggle sound effects and tactile audio',
    icon: Volume2,
    badgeClass: 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300',
  },
  {
    id: 'theme',
    labelAr: 'المظهر (ليلي / نهاري)',
    labelEn: 'Theme (Dark/Light)',
    descAr: 'التبديل الفوري بين الوضع الليلي والنهاري',
    descEn: 'Toggle between dark and light themes',
    icon: Sun,
    badgeClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  },
];

const DEFAULT_PINNED_ACTIONS: HeaderPinActionId[] = ['courses', 'reminders', 'search'];
const MAX_PINNED_ACTIONS = 4;
import { usePwaInstall, useOnlineStatus } from '../hooks/usePwaInstall';

interface HeaderProps {
  userState: UserState | undefined;
  onToggleSurvivalMode: () => void;
  onOpenPanicModal: () => void;
  onOpenBufferModal: () => void;
  onOpenGoalsModal: () => void;
  onOpenBatteryGuide: () => void;
  onOpenSettingsModal: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenArchiveModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenAiCoach?: () => void;
  onOpenEvaluationModal?: () => void;
  onOpenHabitModal?: () => void;
  onOpenOnboardingWizard?: () => void;
  onOpenA2hsModal?: () => void;
  onOpenSleepRest?: () => void;
  onOpenPrayerLocation?: () => void;
  onOpenRewardsModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenLifestyleModal?: () => void;
  onOpenWirdModal?: () => void;
  onOpenPaletteModal?: () => void;
  onOpenSmartTasbih?: () => void;
  onOpenPrideTicket?: () => void;
  isPwaStandalone?: boolean;
  activeProfileName?: string;
  activeProfileEmoji?: string;
  pendingBufferCount: number;
  isFullWidth?: boolean;
  onToggleFullWidth?: () => void;
  onGoHome?: () => void;
  onLogout?: () => void;
  onOpenArabicPoetry?: () => void;
  onOpenLifeWisdom?: () => void;
  onOpenNiyyahModal?: () => void;
  onOpenQuickReminder?: () => void;
  onOpenCourses?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userState,
  onGoHome,
  onLogout,
  onToggleSurvivalMode,
  onOpenPanicModal,
  onOpenBufferModal,
  onOpenGoalsModal,
  onOpenBatteryGuide,
  onOpenSettingsModal,
  onOpenShortcutsModal,
  onOpenArchiveModal,
  onOpenProfileModal,
  onOpenAiCoach,
  onOpenEvaluationModal,
  onOpenHabitModal,
  onOpenOnboardingWizard,
  onOpenA2hsModal,
  onOpenSleepRest,
  onOpenPrayerLocation,
  onOpenRewardsModal,
  onOpenCommandPalette,
  onOpenLifestyleModal,
  onOpenWirdModal,
  onOpenPaletteModal,
  onOpenSmartTasbih,
  onOpenPrideTicket,
  onOpenArabicPoetry,
  onOpenLifeWisdom,
  onOpenNiyyahModal,
  onOpenQuickReminder,
  onOpenCourses,
  isPwaStandalone,
  activeProfileName,
  activeProfileEmoji,
  pendingBufferCount,
  isFullWidth,
  onToggleFullWidth,
}) => {
  const { t, language, toggleLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, promptInstall } = usePwaInstall();
  const isOnline = useOnlineStatus();
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundSynth.isAudioMuted());
  const [streakToast, setStreakToast] = useState<string | null>(null);

  const [pinnedActions, setPinnedActions] = useState<HeaderPinActionId[]>(() => {
    try {
      const saved = localStorage.getItem('midmar_header_pins');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((id) => PINNABLE_OPTIONS.some((o) => o.id === id)).slice(0, MAX_PINNED_ACTIONS);
          if (valid.length > 0) return valid as HeaderPinActionId[];
        }
      }
    } catch (_) {}
    return DEFAULT_PINNED_ACTIONS;
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const handleTogglePin = (id: HeaderPinActionId) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setPinnedActions((prev) => {
      let next: HeaderPinActionId[];
      if (prev.includes(id)) {
        next = prev.filter((p) => p !== id);
      } else {
        if (prev.length >= MAX_PINNED_ACTIONS) {
          soundSynth.playWarningSound();
          return prev;
        }
        next = [...prev, id];
      }
      try {
        localStorage.setItem('midmar_header_pins', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const handleResetPins = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setPinnedActions(DEFAULT_PINNED_ACTIONS);
    try {
      localStorage.setItem('midmar_header_pins', JSON.stringify(DEFAULT_PINNED_ACTIONS));
    } catch (_) {}
  };

  const controlCenterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showControlCenter) return;
    const handleOutsidePointer = (e: Event) => {
      const target = e.target as Node;
      if (controlCenterRef.current && !controlCenterRef.current.contains(target)) {
        setShowControlCenter(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointer, true);
    return () => document.removeEventListener('pointerdown', handleOutsidePointer, true);
  }, [showControlCenter]);

  React.useEffect(() => {
    if (!isPinModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPinModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinModalOpen]);

  const streakDays = userState?.streakDays ?? 0;
  const streakTier = React.useMemo(() => {
    if (streakDays >= 30) {
      return {
        title: language === 'ar' ? 'وسام الالتزام الأسمى (30+ يوماً متواصلاً)' : 'Mastery Horizon (30+ Days)',
        badgeClass: 'bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400/30 shadow-xs',
        flameClass: 'fill-amber-500 text-amber-600 dark:text-amber-400',
        iconEmoji: '◆',
      };
    }
    if (streakDays >= 15) {
      return {
        title: language === 'ar' ? 'إيقاع التميّز المستدام (15-29 يوماً)' : 'Sustained Momentum (15-29 Days)',
        badgeClass: 'bg-cyan-500/10 dark:bg-cyan-400/10 border-cyan-500/30 text-cyan-900 dark:text-cyan-200 ring-1 ring-cyan-400/20 shadow-xs',
        flameClass: 'fill-cyan-500 text-cyan-600 dark:text-cyan-400',
        iconEmoji: '◇',
      };
    }
    if (streakDays >= 8) {
      return {
        title: language === 'ar' ? 'زخم متصاعد ومستقر (8-14 يوماً)' : 'Steady Cadence (8-14 Days)',
        badgeClass: 'bg-indigo-500/10 dark:bg-indigo-400/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-200 shadow-xs',
        flameClass: 'fill-indigo-500 text-indigo-600 dark:text-indigo-400',
        iconEmoji: null,
      };
    }
    if (streakDays >= 4) {
      return {
        title: language === 'ar' ? 'ثبات المسار اليومي (4-7 أيام)' : 'Consistent Rhythm (4-7 Days)',
        badgeClass: 'bg-orange-500/10 dark:bg-orange-400/10 border-orange-400/30 text-orange-900 dark:text-orange-300 shadow-xs',
        flameClass: 'fill-orange-500 text-orange-600 dark:text-orange-400',
        iconEmoji: null,
      };
    }
    return {
      title: language === 'ar' ? 'انطلاقة المسار الإيجابي (1-3 أيام)' : 'Initial Focus (1-3 Days)',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300/60 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 shadow-xs',
      flameClass: 'fill-emerald-500 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400',
      iconEmoji: null,
    };
  }, [streakDays, language]);

  const handleStreakClick = () => {
    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();
    setStreakToast(streakTier.title);
    setTimeout(() => setStreakToast(null), 3000);
  };

  const handleToggleMute = () => {
    const next = soundSynth.toggleMuted();
    setIsMuted(next);
    if (!next) {
      soundSynth.playTactileClick();
    }
  };

  const isSurvival = userState?.survivalMode ?? false;

  const handlePanicClick = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onOpenPanicModal();
  };

  const handleSurvivalToggle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onToggleSurvivalMode();
  };

  const handleLangToggle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    toggleLanguage();
  };

  const handleThemeToggle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    toggleTheme();
  };

  const renderPinnedAction = (id: HeaderPinActionId) => {
    switch (id) {
      case 'courses':
        if (!onOpenCourses) return null;
        return (
          <button
            key="courses"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenCourses();
            }}
            title={language === 'ar' ? 'محراب المذاكرة ومسار الكورسات (AI)' : 'AI Course Study Roadmap'}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'المذاكرة 📚' : 'Courses'}</span>
          </button>
        );

      case 'reminders':
        if (!onOpenQuickReminder) return null;
        return (
          <button
            key="reminders"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenQuickReminder();
            }}
            title={language === 'ar' ? 'منبهات وتذكيرات اليوم (خلف الشاشة)' : 'Daily Alarms & Custom Reminders'}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <Bell className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'تذكير 🔔' : 'Reminder'}</span>
          </button>
        );

      case 'search':
        if (!onOpenCommandPalette) return null;
        return (
          <button
            key="search"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenCommandPalette();
            }}
            title={language === 'ar' ? 'البحث السريع والأوامر الفورية (⌘K)' : 'Command Palette (⌘K)'}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs font-medium text-xs active:scale-95 shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="hidden md:inline">{language === 'ar' ? 'بحث ⌘K' : 'Search'}</span>
          </button>
        );

      case 'niyyah':
        if (!onOpenNiyyahModal) return null;
        return (
          <button
            key="niyyah"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenNiyyahModal();
            }}
            title={language === 'ar' ? 'محراب استحضار وتجديد النوايا' : 'Niyyah Sanctuary'}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <Compass className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'النية ✨' : 'Niyyah'}</span>
          </button>
        );

      case 'buffer':
        if (!onOpenBufferModal) return null;
        return (
          <button
            key="buffer"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenBufferModal();
            }}
            title={language === 'ar' ? 'صندوق التأجيل ومفرغة المهام' : 'Buffer Queue'}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <Clock className="w-3.5 h-3.5 shrink-0 text-sky-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'التأجيل' : 'Buffer'} {pendingBufferCount > 0 && `(${pendingBufferCount})`}</span>
          </button>
        );

      case 'panic':
        return (
          <button
            key="panic"
            type="button"
            onClick={handlePanicClick}
            title={t('panic_button')}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'طوارئ 🚨' : 'Panic'}</span>
          </button>
        );

      case 'survival':
        return (
          <button
            key="survival"
            type="button"
            onClick={handleSurvivalToggle}
            title={isSurvival ? (language === 'ar' ? 'إلغاء وضع الحد الأدنى MVD' : 'Disable MVD') : (language === 'ar' ? 'تفعيل وضع الحد الأدنى MVD' : 'Enable MVD')}
            className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0 ${
              isSurvival
                ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-200'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="hidden md:inline">{isSurvival ? 'MVD نشط' : 'MVD'}</span>
          </button>
        );

      case 'sleep':
        if (!onOpenSleepRest) return null;
        return (
          <button
            key="sleep"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenSleepRest();
            }}
            title={language === 'ar' ? 'بروتوكول النوم والاسترخاء' : 'Sleep Rest'}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <Moon className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'نوم 🌙' : 'Sleep'}</span>
          </button>
        );

      case 'wird':
        if (!onOpenWirdModal) return null;
        return (
          <button
            key="wird"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenWirdModal();
            }}
            title={language === 'ar' ? 'الورد القرآني' : 'Quran Wird'}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'الورد 📖' : 'Wird'}</span>
          </button>
        );

      case 'tasbih':
        if (!onOpenSmartTasbih) return null;
        return (
          <button
            key="tasbih"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenSmartTasbih();
            }}
            title={language === 'ar' ? 'السبحة الذكية' : 'Smart Tasbih'}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <Disc className="w-3.5 h-3.5 shrink-0 text-teal-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'سبحة 📿' : 'Tasbih'}</span>
          </button>
        );

      case 'poetry':
        if (!onOpenArabicPoetry) return null;
        return (
          <button
            key="poetry"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenArabicPoetry();
            }}
            title={language === 'ar' ? 'ديوان الشعر العربي' : 'Classical Poetry'}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <Scroll className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'شعر 📜' : 'Poetry'}</span>
          </button>
        );

      case 'wisdom':
        if (!onOpenLifeWisdom) return null;
        return (
          <button
            key="wisdom"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenLifeWisdom();
            }}
            title={language === 'ar' ? 'منارة الحكمة' : 'Life Wisdom'}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <Lightbulb className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'حكمة 💡' : 'Wisdom'}</span>
          </button>
        );

      case 'goals':
        return (
          <button
            key="goals"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenGoalsModal();
            }}
            title={t('goals_velocity')}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <Target className="w-3.5 h-3.5 shrink-0 text-sky-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'الأهداف 🎯' : 'Goals'}</span>
          </button>
        );

      case 'coach':
        if (!onOpenAiCoach) return null;
        return (
          <button
            key="coach"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenAiCoach();
            }}
            title={t('ai_coach_title')}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <Lightbulb className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'الموجه AI' : 'Coach'}</span>
          </button>
        );

      case 'palette':
        if (!onOpenPaletteModal) return null;
        return (
          <button
            key="palette"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenPaletteModal();
            }}
            title={language === 'ar' ? 'طراز وألوان الشاشة' : 'Color Palette'}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-400 border border-fuchsia-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <Palette className="w-3.5 h-3.5 shrink-0 text-fuchsia-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'المظهر 🎨' : 'Palette'}</span>
          </button>
        );

      case 'archive':
        if (!onOpenArchiveModal) return null;
        return (
          <button
            key="archive"
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenArchiveModal();
            }}
            title={t('history_archive')}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shadow-2xs font-bold text-xs active:scale-95 shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            <span className="hidden md:inline">{language === 'ar' ? 'الأرشيف 📅' : 'Archive'}</span>
          </button>
        );

      case 'mute':
        return (
          <button
            key="mute"
            type="button"
            onClick={handleToggleMute}
            title={isMuted ? (language === 'ar' ? 'تشغيل الصوت' : 'Unmute') : (language === 'ar' ? 'كتم الصوت' : 'Mute')}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs font-medium text-xs active:scale-95 shrink-0"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500 shrink-0" /> : <Volume2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
            <span className="hidden md:inline">{isMuted ? (language === 'ar' ? 'تشغيل' : 'Unmute') : (language === 'ar' ? 'كتم' : 'Mute')}</span>
          </button>
        );

      case 'theme':
        return (
          <button
            key="theme"
            type="button"
            onClick={handleThemeToggle}
            title={theme === 'light' ? (language === 'ar' ? 'الوضع الليلي' : 'Dark Mode') : (language === 'ar' ? 'الوضع النهاري' : 'Light Mode')}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs font-medium text-xs active:scale-95 shrink-0"
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" /> : <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            <span className="hidden md:inline">{theme === 'light' ? (language === 'ar' ? 'ليلي' : 'Dark') : (language === 'ar' ? 'نهاري' : 'Light')}</span>
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-[#0c0e14]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] px-3 sm:px-6 py-2.5 transition-colors duration-200 shadow-2xs">
      <div className={`w-full ${isFullWidth ? 'max-w-none px-1 sm:px-2' : 'max-w-[1720px] mx-auto'} flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300`}>
        {/* Logo & Brand (Click to return Home) */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            onGoHome?.();
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 shrink-0 text-start cursor-pointer group active:scale-95 transition-transform select-none tap-spring"
          title={language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Return to Home'}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20 group-hover:scale-105 group-hover:shadow-emerald-500/40 transition-all">
            {language === 'ar' ? 'مِ' : 'M'}
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              {t('app_name')}
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                {t('life_os')}
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 hidden sm:block leading-none mt-0.5">
              {t('app_subtitle')}
            </p>
          </div>
        </button>

        {/* Stats: Streak, Shield, Points & Offline status (Desktop / Tablet) */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 text-xs relative">
          {/* Living Dynamic Streak Flame with Celebration */}
          <button
            type="button"
            onClick={handleStreakClick}
            title={streakTier.title}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 ${streakTier.badgeClass}`}
          >
            <Flame className={`w-3.5 h-3.5 ${streakTier.flameClass}`} />
            <span>{streakDays}</span>
            {streakTier.iconEmoji && <span className="text-[11px] leading-none">{streakTier.iconEmoji}</span>}
          </button>

          {/* Streak Celebration Popup Toast */}
          {streakToast && (
            <div className="absolute -bottom-8 right-0 sm:right-auto z-40 whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold shadow-lg animate-fade-in flex items-center gap-1.5 border border-slate-800 dark:border-zinc-200">
              <span>{streakToast}</span>
            </div>
          )}

          {/* Streak Shields */}
          <div
            title={t('shields_count')}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-sky-50 dark:bg-cyan-950/40 border border-sky-200 dark:border-cyan-800/40 text-sky-700 dark:text-cyan-400 font-mono text-xs shadow-xs"
          >
            <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 fill-sky-600/20" />
            <span>{userState?.streakShields ?? 0}</span>
          </div>

          {/* Total Points */}
          <div
            title={t('total_points')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 font-mono text-xs shadow-xs"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{userState?.totalPoints ?? 0}</span>
          </div>

          {/* Offline Ready Badge */}
          {!isOnline && (
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 text-[10px] font-bold font-mono">
              {t('offline_ready_badge')}
            </span>
          )}
        </div>

        {/* Action Controls & Toggles */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Pinned Quick Action Buttons (User Customizable, Max 4) */}
          {pinnedActions.map((actionId) => renderPinnedAction(actionId))}

          {/* Unified LifeOS Control Center Dropdown */}
          <div ref={controlCenterRef} className="relative">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setShowControlCenter(!showControlCenter);
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                showControlCenter
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20 ring-2 ring-emerald-500/20'
                  : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
              title={language === 'ar' ? 'مركز التحكم والإنتاجية' : 'LifeOS Control Center'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500" />
              <span className="hidden sm:inline">{language === 'ar' ? 'مركز التحكم' : 'Control Center'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showControlCenter ? 'rotate-180' : ''}`} />
            </button>

            {/* Control Center Popover Dropdown */}
            {showControlCenter && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default bg-black/10 dark:bg-black/30 backdrop-blur-2xs"
                  onClick={() => setShowControlCenter(false)}
                  onTouchStart={() => setShowControlCenter(false)}
                />
                <div
                  className="absolute end-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl p-3 space-y-3 animate-fade-in"
                  style={{ maxHeight: '82vh', overflowY: 'auto' }}
                >
                  {/* Popover Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 text-xs font-bold text-slate-800 dark:text-zinc-200">
                    <div className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{language === 'ar' ? 'مركز التحكم والأدوات' : 'Control Center'}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500">
                      LifeOS Hub
                    </span>
                  </div>

                  {/* Pin Customizer Banner / Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowControlCenter(false);
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      setIsPinModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 transition-all cursor-pointer text-xs font-bold group"
                  >
                    <div className="flex items-center gap-2">
                      <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
                      <span>{language === 'ar' ? 'تخصيص الأزرار العلوية' : 'Customize Top Pins'}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-bold">
                      {pinnedActions.length}/{MAX_PINNED_ACTIONS}
                    </span>
                  </button>

                  {/* Quick Action Strip (Emergency & Vital Modes on all screens) */}
                  <div className="p-2 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block">
                      {language === 'ar' ? 'أدوات الوصول السريع' : 'Quick Actions'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Panic */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowControlCenter(false);
                          handlePanicClick();
                        }}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200/60 dark:border-rose-900/40"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">{t('panic_button')}</span>
                      </button>

                      {/* Survival MVD */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowControlCenter(false);
                          handleSurvivalToggle();
                        }}
                        className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold border transition-colors ${
                          isSurvival
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                            : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{isSurvival ? 'إلغاء MVD' : 'وضع MVD'}</span>
                      </button>

                      {/* Buffer */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowControlCenter(false);
                          onOpenBufferModal();
                        }}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium border border-slate-200 dark:border-zinc-700"
                      >
                        <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">{language === 'ar' ? 'صندوق التأجيل' : 'Buffer Tasks'} {pendingBufferCount > 0 && `(${pendingBufferCount})`}</span>
                      </button>

                      {/* Sleep Rest */}
                      {onOpenSleepRest && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenSleepRest();
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-800/40"
                        >
                          <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'بروتوكول النوم' : 'Sleep'}</span>
                        </button>
                      )}

                      {/* Quick Audio Mute Toggle */}
                      <button
                        type="button"
                        onClick={handleToggleMute}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-colors ${
                          isMuted
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                            : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500 shrink-0" /> : <Volume2 className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400 shrink-0" />}
                        <span className="truncate">{isMuted ? (language === 'ar' ? 'تشغيل الصوت' : 'Unmute') : (language === 'ar' ? 'كتم الصوت' : 'Mute')}</span>
                      </button>

                      {/* Theme Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          handleThemeToggle();
                        }}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium border border-slate-200 dark:border-zinc-700"
                      >
                        {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" /> : <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span className="truncate">{theme === 'light' ? (language === 'ar' ? 'الوضع الليلي' : 'Dark Mode') : (language === 'ar' ? 'الوضع النهاري' : 'Light Mode')}</span>
                      </button>

                      {/* PWA Install Button */}
                      {isInstallable && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            promptInstall();
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 col-span-2 justify-center"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span>{t('install_app_btn')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category 1: Analytics & Productivity */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2 block">
                      {language === 'ar' ? 'الإنتاجية والمسارات والتقارير' : 'Productivity & Analytics'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {onOpenCourses && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenCourses();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-xs font-bold transition-colors cursor-pointer text-start border border-indigo-200/80 dark:border-indigo-800/50 col-span-2 shadow-xs"
                        >
                          <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'محراب المذاكرة ومسار الكورسات (AI) 📚' : 'AI Course Study Roadmap 📚'}</span>
                        </button>
                      )}
                      {onOpenArchiveModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenArchiveModal();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                        >
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{t('history_archive')}</span>
                        </button>
                      )}

                      {onOpenEvaluationModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenEvaluationModal();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-amber-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'التقييم الدوري' : 'Evaluation'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowControlCenter(false);
                          onOpenGoalsModal();
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-sky-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                      >
                        <Target className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">{t('goals_velocity')}</span>
                      </button>

                      {onOpenRewardsModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenRewardsModal();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer text-start border border-amber-200/80 dark:border-amber-800/50"
                        >
                          <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'متجر المكافآت' : 'Rewards Store'}</span>
                        </button>
                      )}

                      {onOpenPrideTicket && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenPrideTicket();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer text-start border border-purple-200/80 dark:border-purple-800/50 col-span-2"
                        >
                          <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'تذكرة إنجاز اليوم (Pride Ticket)' : 'Daily Pride Ticket'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category 2: Guidance & Spiritual */}
                  <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-zinc-900">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2 block">
                      {language === 'ar' ? 'التوجيه والعادات والموقع' : 'Guidance & Habits'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {onOpenAiCoach && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenAiCoach();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{t('ai_coach_title')}</span>
                        </button>
                      )}

                      {onOpenHabitModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenHabitModal();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'إضافة عبادة/عادة' : 'Add Habit'}</span>
                        </button>
                      )}

                      {onOpenOnboardingWizard && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenOnboardingWizard();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-amber-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'تخصيص مجالك' : 'Domain'}</span>
                        </button>
                      )}

                      {onOpenPrayerLocation && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenPrayerLocation();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                        >
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'مواقيت وموقع الصلاة' : 'Prayer Location'}</span>
                        </button>
                      )}

                      {onOpenSmartTasbih && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenSmartTasbih();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-xs font-bold transition-colors cursor-pointer text-start border border-teal-200/80 dark:border-teal-800/50"
                        >
                          <Disc className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'مسبحة الأذكار الذكية' : 'Digital Tasbih'}</span>
                        </button>
                      )}

                      {onOpenWirdModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenWirdModal();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer text-start border border-emerald-200/80 dark:border-emerald-800/50"
                        >
                          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'الورد القرآني' : 'Quran Wird'}</span>
                        </button>
                      )}

                      {onOpenLifestyleModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenLifestyleModal();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-800 dark:text-sky-300 text-xs font-bold transition-colors cursor-pointer text-start border border-sky-200/80 dark:border-sky-800/50 col-span-2"
                        >
                          <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'نمط الحياة والمحطات' : 'Lifestyle Flow'}</span>
                        </button>
                      )}

                      {onOpenArabicPoetry && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenArabicPoetry();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer text-start border border-amber-200/80 dark:border-amber-800/50"
                        >
                          <Scroll className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'ديوان الشعر العربي' : 'Classical Poetry'}</span>
                        </button>
                      )}

                      {onOpenLifeWisdom && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenLifeWisdom();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer text-start border border-emerald-200/80 dark:border-emerald-800/50"
                        >
                          <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'منارة الحكمة' : 'Life Wisdom'}</span>
                        </button>
                      )}

                      {onOpenNiyyahModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenNiyyahModal();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer text-start border border-amber-200/80 dark:border-amber-800/50 col-span-2"
                        >
                          <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'محراب استحضار وتجديد النوايا' : 'Niyyah Sanctuary'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category 3: System & Tools */}
                  <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-zinc-900">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2 block">
                      {language === 'ar' ? 'أدوات النظام والمظهر' : 'System & Themes'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {onOpenPaletteModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenPaletteModal();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer text-start border border-amber-200/80 dark:border-amber-800/50 col-span-2"
                        >
                          <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'تخصيص المظهر والطراز اللوني' : 'Atelier Color Palette'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowControlCenter(false);
                          onOpenBatteryGuide();
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                      >
                        <BatteryCharging className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{t('battery_guide')}</span>
                      </button>

                      {onOpenShortcutsModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenShortcutsModal();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                        >
                          <Command className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{t('shortcuts_modal_title')}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowControlCenter(false);
                          onOpenSettingsModal();
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{t('settings')}</span>
                      </button>

                      {!isPwaStandalone && onOpenA2hsModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            onOpenA2hsModal();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{language === 'ar' ? 'تثبيت الأيقونة' : 'Install Icon'}</span>
                        </button>
                      )}

                      {onToggleFullWidth && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowControlCenter(false);
                            soundSynth.playTactileClick();
                            onToggleFullWidth();
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                        >
                          {isFullWidth ? <Columns className="w-3.5 h-3.5 text-teal-500 shrink-0" /> : <Maximize2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
                          <span className="truncate">{isFullWidth ? t('toggle_companion_hub') : t('toggle_full_width')}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowControlCenter(false);
                          handleLangToggle();
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-start"
                      >
                        <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{language === 'ar' ? 'English (EN)' : 'عربي (AR)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Popover Footer: Profile & Logout */}
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    {onOpenProfileModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowControlCenter(false);
                          onOpenProfileModal();
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{activeProfileEmoji || '⚡'}</span>
                        <span className="max-w-[100px] truncate">{activeProfileName || (language === 'ar' ? 'الملف الشخصي' : 'Profile')}</span>
                      </button>
                    )}
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowControlCenter(false);
                          onLogout();
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors ms-auto"
                      >
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>{language === 'ar' ? 'قفل وخروج' : 'Logout'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pin Customizer Modal */}
      {isPinModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 animate-fade-in" role="dialog" aria-modal="true">
          {/* Clickable backdrop with outside click */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => {
              soundSynth.playTactileClick();
              setIsPinModalOpen(false);
            }}
          />
          <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200 dark:border-zinc-800 p-5 sm:p-7 shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Pin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {language === 'ar' ? 'تخصيص أزرار الشريط العلوي' : 'Customize Top Header Pins'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {language === 'ar'
                      ? `اختر حتى ${MAX_PINNED_ACTIONS} أزرار مفضلة لتظهر في الأعلى دون زحام (${pinnedActions.length}/${MAX_PINNED_ACTIONS})`
                      : `Select up to ${MAX_PINNED_ACTIONS} quick pins for the top bar (${pinnedActions.length}/${MAX_PINNED_ACTIONS})`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Counter Badge & Reset to Default */}
            <div className="flex items-center justify-between text-xs px-3 py-2 my-3 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 font-medium shrink-0">
              <span>
                {language === 'ar'
                  ? `المحدد حالياً: ${pinnedActions.length} من أصل ${MAX_PINNED_ACTIONS}`
                  : `Selected: ${pinnedActions.length} of ${MAX_PINNED_ACTIONS}`}
              </span>
              <button
                type="button"
                onClick={handleResetPins}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'ar' ? 'استعادة الافتراضي' : 'Reset default'}</span>
              </button>
            </div>

            {/* Grid of Options (Scrollable area) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1 min-h-0">
              {PINNABLE_OPTIONS.map((opt) => {
                const isPinned = pinnedActions.includes(opt.id);
                const isMaxReached = !isPinned && pinnedActions.length >= MAX_PINNED_ACTIONS;
                const IconComp = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isMaxReached}
                    onClick={() => handleTogglePin(opt.id)}
                    className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isPinned
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                        : isMaxReached
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-zinc-900/40 border-slate-200/50 dark:border-zinc-800/40'
                        : 'bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 ${opt.badgeClass}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {language === 'ar' ? opt.labelAr : opt.labelEn}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isPinned
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-zinc-700'
                          }`}
                        >
                          {isPinned && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                        {language === 'ar' ? opt.descAr : opt.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setIsPinModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
              >
                {language === 'ar' ? 'حفظ وتأكيد ✔' : 'Done & Save ✔'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
