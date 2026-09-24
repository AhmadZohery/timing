import React, { useState } from 'react';
import {
  Flame,
  Shield,
  Sparkles,
  LifeBuoy,
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
  MoreVertical,
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
} from 'lucide-react';
import type { UserState } from '../types';
import { soundSynth } from '../services/soundSynthesizer';
import { haptic } from '../services/vibrationService';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
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
  isPwaStandalone,
  activeProfileName,
  activeProfileEmoji,
  pendingBufferCount,
  isFullWidth,
  onToggleFullWidth,
}) => {
  const { t, language, toggleLanguage, isRTL } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, promptInstall } = usePwaInstall();
  const isOnline = useOnlineStatus();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundSynth.isAudioMuted());
  const [streakToast, setStreakToast] = useState<string | null>(null);

  const mobileMenuRef = React.useRef<HTMLDivElement>(null);
  const controlCenterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showMobileMenu && !showControlCenter) return;
    const handleOutsidePointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (showMobileMenu && mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setShowMobileMenu(false);
      }
      if (showControlCenter && controlCenterRef.current && !controlCenterRef.current.contains(target)) {
        setShowControlCenter(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    return () => document.removeEventListener('pointerdown', handleOutsidePointer);
  }, [showMobileMenu, showControlCenter]);

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
          {/* Quick Omnisearch Command Palette Trigger (Ctrl+K) */}
          {onOpenCommandPalette && (
            <>
              {/* Desktop Pill */}
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  onOpenCommandPalette();
                }}
                title={language === 'ar' ? 'البحث السريع والأوامر الفورية (Ctrl+K)' : 'Quick Command Palette (Ctrl+K)'}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 text-xs transition-all cursor-pointer shadow-2xs group"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-slate-600 dark:text-zinc-300 font-medium">
                  {language === 'ar' ? 'بحث أو أمر سريع...' : 'Search commands...'}
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 shadow-2xs">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile / Tablet Icon */}
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  onOpenCommandPalette();
                }}
                title={language === 'ar' ? 'البحث السريع والأوامر الفورية (⌘K)' : 'Command Palette'}
                className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 cursor-pointer shadow-xs transition-colors"
              >
                <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </button>
            </>
          )}

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={promptInstall}
              title={t('install_app_btn')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm shadow-emerald-600/20 transition-all animate-pulse"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t('install_app_btn')}</span>
            </button>
          )}

          {/* Zero-Inertia Panic Button (Desktop / Tablet) */}
          <button
            onClick={handlePanicClick}
            title={t('panic_tooltip')}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">{t('panic_button')}</span>
          </button>

          {/* Survival Mode MVD Toggle (Desktop / Tablet) */}
          <button
            onClick={handleSurvivalToggle}
            title={t('survival_tooltip')}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-xl border transition-all cursor-pointer shadow-xs font-semibold ${
              isSurvival
                ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-400 text-amber-800 dark:text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <LifeBuoy className={`w-3.5 h-3.5 ${isSurvival ? 'text-amber-600 dark:text-amber-400' : ''}`} />
            <span className="hidden sm:inline">MVD</span>
          </button>

          {/* Buffer Queue Button */}
          <button
            onClick={onOpenBufferModal}
            title={t('buffer_tooltip')}
            className="hidden sm:flex relative p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 cursor-pointer shadow-xs"
          >
            <Clock className="w-4 h-4" />
            {pendingBufferCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white dark:text-zinc-950 font-black text-[9px] flex items-center justify-center">
                {pendingBufferCount}
              </span>
            )}
          </button>

          {/* Quick Audio Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            title={isMuted ? (language === 'ar' ? 'تشغيل الأصوات (مكتوم حالياً)' : 'Unmute Sounds') : (language === 'ar' ? 'كتم الأصوات الهادئة' : 'Mute Sounds')}
            className={`p-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
              isMuted
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20'
                : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Sleep & Rest Quick Action */}
          {onOpenSleepRest && (
            <button
              type="button"
              onClick={onOpenSleepRest}
              title={language === 'ar' ? 'نظام ومواعيد النوم والاستشفاء البيولوجي' : 'Sleep & Rest Recovery'}
              className="hidden sm:flex p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer shadow-xs transition-colors"
            >
              <Moon className="w-4 h-4" />
            </button>
          )}

          {/* Multi-Profile Switcher */}
          {onOpenProfileModal && (
            <button
              type="button"
              onClick={onOpenProfileModal}
              title={t('profile_manager')}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 cursor-pointer shadow-xs transition-colors text-xs font-bold"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{activeProfileEmoji || '⚡'}</span>
              <span className="hidden xl:inline max-w-[80px] truncate">{activeProfileName || (language === 'ar' ? 'الأساسي' : 'Default')}</span>
            </button>
          )}

          {/* Theme Toggle Button [☀️ / 🌙] */}
          <button
            type="button"
            onClick={handleThemeToggle}
            title={theme === 'light' ? t('dark_mode') : t('light_mode')}
            className="hidden sm:flex p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors shadow-xs"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Quick Lock / Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title={language === 'ar' ? 'قفل المنظومة وتسجيل الخروج' : 'Lock & Logout'}
              className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-800 text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors shadow-xs"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* Unified LifeOS Control Center Dropdown */}
          <div className="relative">
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

                  {/* Mobile Quick Action Strip (Emergency & Vital Modes on small screens) */}
                  <div className="sm:hidden p-2 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
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
                        <LifeBuoy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
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

                      {/* Theme Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          handleThemeToggle();
                        }}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium border border-slate-200 dark:border-zinc-700 col-span-2 justify-center"
                      >
                        {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" /> : <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span>{theme === 'light' ? (language === 'ar' ? 'الوضع الليلي 🌙' : 'Dark Mode 🌙') : (language === 'ar' ? 'الوضع النهاري ☀️' : 'Light Mode ☀️')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Category 1: Analytics & Reports */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2 block">
                      {language === 'ar' ? 'التقارير والأرشيف' : 'Analytics & Archive'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
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
                          <span className="truncate">{language === 'ar' ? 'متجر المكافآت 🎁' : 'Rewards Store 🎁'}</span>
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
                          <span className="text-sm shrink-0">🎫</span>
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
                          <span className="text-sm shrink-0">📿</span>
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
                          <span className="text-sm shrink-0">📖</span>
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
                          <span className="text-sm shrink-0">🧭</span>
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
                          <span className="text-sm shrink-0">📜</span>
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
                          <span className="text-sm shrink-0">💡</span>
                          <span className="truncate">{language === 'ar' ? 'منارة الحكمة' : 'Life Wisdom'}</span>
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
                          <span className="text-sm shrink-0">🎨</span>
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
                </div>
              </>
            )}
          </div>

          {/* Mobile Secondary Menu Button (< md) */}
          <div className="relative md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMobileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-2xs cursor-default"
                  onClick={() => setShowMobileMenu(false)}
                  onTouchStart={() => setShowMobileMenu(false)}
                />
                <div
                  className={`absolute top-full mt-2 ${isRTL ? 'left-0' : 'right-0'} z-50 w-52 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl p-1.5 space-y-1 animate-fade-in`}
                >
                {onOpenAiCoach && (
                  <button
                    onClick={() => {
                      onOpenAiCoach();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-start cursor-pointer"
                  >
                    <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{t('ai_coach_title')}</span>
                  </button>
                )}

                {onOpenEvaluationModal && (
                  <button
                    onClick={() => {
                      onOpenEvaluationModal();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-start cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{language === 'ar' ? 'التقييم الدوري والتحفيز' : 'Evaluation & Motivation'}</span>
                  </button>
                )}

                {onOpenRewardsModal && (
                  <button
                    onClick={() => {
                      onOpenRewardsModal();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-start cursor-pointer"
                  >
                    <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{language === 'ar' ? 'متجر المكافآت الواقعية 🎁' : 'Real-Life Rewards 🎁'}</span>
                  </button>
                )}

                {onOpenHabitModal && (
                  <button
                    onClick={() => {
                      onOpenHabitModal();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-start cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{language === 'ar' ? 'إضافة عبادة أو عادة' : 'Add Habit/Deed'}</span>
                  </button>
                )}

                {onOpenArchiveModal && (
                  <button
                    onClick={() => {
                      onOpenArchiveModal();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-start cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{t('history_archive')}</span>
                  </button>
                )}

                {onOpenProfileModal && (
                  <button
                    onClick={() => {
                      onOpenProfileModal();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-start cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>{t('profile_manager')}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenGoalsModal();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-start cursor-pointer"
                >
                  <Target className="w-4 h-4 text-sky-600" />
                  <span>{t('goals_velocity')}</span>
                </button>

                <button
                  onClick={() => {
                    onOpenBatteryGuide();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-start cursor-pointer"
                >
                  <BatteryCharging className="w-4 h-4 text-amber-600" />
                  <span>{t('battery_guide')}</span>
                </button>

                {onOpenShortcutsModal && (
                  <button
                    onClick={() => {
                      onOpenShortcutsModal();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-start cursor-pointer"
                  >
                    <Command className="w-4 h-4 text-indigo-600" />
                    <span>{t('shortcuts_modal_title')}</span>
                  </button>
                )}

                {!isPwaStandalone && onOpenA2hsModal && (
                  <button
                    onClick={() => {
                      onOpenA2hsModal();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-start cursor-pointer border-t border-slate-100 dark:border-zinc-800"
                  >
                    <span>📱</span>
                    <span>{language === 'ar' ? 'إضافة أيقونة للشاشة الرئيسية' : 'Add to Home Screen'}</span>
                  </button>
                )}

                {onOpenOnboardingWizard && (
                  <button
                    onClick={() => {
                      onOpenOnboardingWizard();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-start cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{language === 'ar' ? 'تخصيص مجالك وإيقاعك الأسبوعي' : 'Customize Domain & Rhythm'}</span>
                  </button>
                )}

                {onOpenSleepRest && (
                  <button
                    onClick={() => {
                      onOpenSleepRest();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-start cursor-pointer"
                  >
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>{language === 'ar' ? 'نظام ومواعيد النوم والاستشفاء 🌙' : 'Sleep & Rest Recovery 🌙'}</span>
                  </button>
                )}

                {onOpenPrayerLocation && (
                  <button
                    onClick={() => {
                      onOpenPrayerLocation();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-start cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>{language === 'ar' ? 'تحديد الدولة ومواقيت الصلاة 📍' : 'Prayer Location & Methods 📍'}</span>
                  </button>
                )}

                {onOpenArabicPoetry && (
                  <button
                    onClick={() => {
                      onOpenArabicPoetry();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-start cursor-pointer"
                  >
                    <span>📜</span>
                    <span>{language === 'ar' ? 'ديوان الشعر العربي الكلاسيكي 📜' : 'Classical Arabic Poetry'}</span>
                  </button>
                )}

                {onOpenLifeWisdom && (
                  <button
                    onClick={() => {
                      onOpenLifeWisdom();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-start cursor-pointer"
                  >
                    <span>💡</span>
                    <span>{language === 'ar' ? 'منارة الحكمة والنماذج العقلية 💡' : 'Life Wisdom & Models'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenSettingsModal();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-start cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span>{t('settings')}</span>
                </button>
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
