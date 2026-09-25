import { useState, useEffect, lazy, Suspense } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import type { StationId, EnergyLevel } from './types';
import { awardStationPoints, awardPrayerPoints, getBiologicalDate, type RewardResult } from './utils/gamification';
import { calculatePrayerTimes, getNextPrayer } from './utils/prayerCalculator';
import { soundSynth } from './services/soundSynthesizer';
import { haptic } from './services/vibrationService';
import { useTranslation } from './i18n/LanguageContext';

// Layout & Components
import { Header } from './components/Header';
import { StationNavigation } from './components/StationNavigation';

// Station Views
import { CommuteMorningView } from './components/stations/CommuteMorningView';
import { WorkMicroSprintView } from './components/stations/WorkMicroSprintView';
import { GymAnchorView } from './components/stations/GymAnchorView';
import { EveningSprintView } from './components/stations/EveningSprintView';
import { RetrospectiveCheckinView } from './components/stations/RetrospectiveCheckinView';
import { GrandRewardView } from './components/stations/GrandRewardView';

// Non-modal core components
import { TwoMinuteRuleCard } from './components/common/TwoMinuteRuleCard';
import { systemHeartbeat } from './services/systemHeartbeatCoordinator';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CompanionSidebar } from './components/dashboard/CompanionSidebar';
import { NotificationPermissionBanner } from './components/common/NotificationPermissionBanner';
import { usePwaInstall } from './hooks/usePwaInstall';

// Living Interactive & Creative Components (V12 & V13)
import { CircadianAuroraBackground } from './components/interactive/CircadianAuroraBackground';
import { SwipeableStationContainer } from './components/interactive/SwipeableStationContainer';
import { DynamicIslandHub } from './components/interactive/DynamicIslandHub';
import { MobileBottomTabBar } from './components/navigation/MobileBottomTabBar';
import { AmbientSoundscapeBar } from './components/interactive/AmbientSoundscapeBar';
import { HomeDashboardView } from './components/dashboard/HomeDashboardView';
import { GlobalAudioCapsule } from './components/spiritual/GlobalAudioCapsule';
import type { DailyTadabburItem } from './data/dailyTadabburData';
import type { TasbihPresetId } from './utils/tasbihEngine';
import type { NiyyahPillar } from './components/spiritual/NiyyahSanctuaryModal';
import { AuthGateView } from './components/auth/AuthGateView';
import { authService } from './services/authService';

// Lazy Loaded Modals for Fast Initial Load & Sub-400kB Core Bundle
const ArabicPoetryModal = lazy(() => import('./components/modals/ArabicPoetryModal').then((m) => ({ default: m.ArabicPoetryModal })));
const LifeWisdomModal = lazy(() => import('./components/modals/LifeWisdomModal').then((m) => ({ default: m.LifeWisdomModal })));
const ZeroInertiaModal = lazy(() => import('./components/modals/ZeroInertiaModal').then((m) => ({ default: m.ZeroInertiaModal })));
const BufferQueueModal = lazy(() => import('./components/modals/BufferQueueModal').then((m) => ({ default: m.BufferQueueModal })));
const GoalVelocityModal = lazy(() => import('./components/modals/GoalVelocityModal').then((m) => ({ default: m.GoalVelocityModal })));
const MiniCrmDrawer = lazy(() => import('./components/modals/MiniCrmDrawer').then((m) => ({ default: m.MiniCrmDrawer })));
const BatteryGuideModal = lazy(() => import('./components/modals/BatteryGuideModal').then((m) => ({ default: m.BatteryGuideModal })));
const SettingsBackupModal = lazy(() => import('./components/modals/SettingsBackupModal').then((m) => ({ default: m.SettingsBackupModal })));
const KeyboardShortcutsModal = lazy(() => import('./components/modals/KeyboardShortcutsModal').then((m) => ({ default: m.KeyboardShortcutsModal })));
const HistoryArchiveModal = lazy(() => import('./components/modals/HistoryArchiveModal').then((m) => ({ default: m.HistoryArchiveModal })));
const ProfileSwitcherModal = lazy(() => import('./components/modals/ProfileSwitcherModal').then((m) => ({ default: m.ProfileSwitcherModal })));
const AiCoachModal = lazy(() => import('./components/modals/AiCoachModal').then((m) => ({ default: m.AiCoachModal })));
const HabitRecurrenceModal = lazy(() => import('./components/modals/HabitRecurrenceModal').then((m) => ({ default: m.HabitRecurrenceModal })));
const EvaluationReportModal = lazy(() => import('./components/modals/EvaluationReportModal').then((m) => ({ default: m.EvaluationReportModal })));
const AddToHomeScreenModal = lazy(() => import('./components/modals/AddToHomeScreenModal').then((m) => ({ default: m.AddToHomeScreenModal })));
const OnboardingWizardModal = lazy(() => import('./components/modals/OnboardingWizardModal').then((m) => ({ default: m.OnboardingWizardModal })));
const SleepRestModal = lazy(() => import('./components/modals/SleepRestModal').then((m) => ({ default: m.SleepRestModal })));
const PrayerLocationModal = lazy(() => import('./components/modals/PrayerLocationModal').then((m) => ({ default: m.PrayerLocationModal })));
const RealLifeRewardsModal = lazy(() => import('./components/modals/RealLifeRewardsModal').then((m) => ({ default: m.RealLifeRewardsModal })));
const QuickCommandPaletteModal = lazy(() => import('./components/modals/QuickCommandPaletteModal').then((m) => ({ default: m.QuickCommandPaletteModal })));
const LifestyleStationCustomizerModal = lazy(() => import('./components/modals/LifestyleStationCustomizerModal').then((m) => ({ default: m.LifestyleStationCustomizerModal })));
const WirdCustomizerModal = lazy(() => import('./components/spiritual/WirdCustomizerModal').then((m) => ({ default: m.WirdCustomizerModal })));
const ThemePaletteModal = lazy(() => import('./components/modals/ThemePaletteModal').then((m) => ({ default: m.ThemePaletteModal })));
const SmartTasbihModal = lazy(() => import('./components/modals/SmartTasbihModal').then((m) => ({ default: m.SmartTasbihModal })));
const DailyPrideTicketModal = lazy(() => import('./components/modals/DailyPrideTicketModal').then((m) => ({ default: m.DailyPrideTicketModal })));
const DailyTadabburModal = lazy(() => import('./components/modals/DailyTadabburModal').then((m) => ({ default: m.DailyTadabburModal })));
const FaithAudioSanctuaryModal = lazy(() => import('./components/spiritual/FaithAudioSanctuaryModal').then((m) => ({ default: m.FaithAudioSanctuaryModal })));
const NiyyahSanctuaryModal = lazy(() => import('./components/spiritual/NiyyahSanctuaryModal').then((m) => ({ default: m.NiyyahSanctuaryModal })));

// Active Station Persistence across page refreshes
const ALL_STATIONS: StationId[] = [
  'HOME',
  'COMMUTE_MORNING',
  'WORK_MICRO_SPRINT',
  'ONE_SEC_FRICTION',
  'SOCIAL_MEDIA_BREAK',
  'GYM_ANCHOR',
  'EVENING_SPRINT',
  'RETROSPECTIVE_CHECKIN',
  'GRAND_REWARD_STATE',
];

const getSavedStation = (): StationId => {
  if (typeof window !== 'undefined' && window.location.hash) {
    const cleanHash = window.location.hash.replace('#', '').toUpperCase();
    const match = ALL_STATIONS.find((s) => s === cleanHash || s.toLowerCase() === cleanHash.toLowerCase());
    if (match) return match;
  }
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('midmar_active_station') : null;
  if (saved && ALL_STATIONS.includes(saved as StationId)) {
    return saved as StationId;
  }
  return 'HOME';
};

export function App() {
  // Dexie Reactive Live Queries (Zero-Cloud / 100% Offline)
  const userState = useLiveQuery(() => db.user_state.get('current_user'));

  // Fajr Grace Period biological date calculation
  const graceActive = userState?.settings?.fajrGracePeriodActive ?? true;
  const today = getBiologicalDate(graceActive);

  const quranList = useLiveQuery(() => db.quran_progress.toArray());
  const bookList = useLiveQuery(() => db.book_progress.toArray());
  const todayLog = useLiveQuery(() => db.daily_logs.get(today));
  const allDailyLogs = useLiveQuery(() => db.daily_logs.toArray());
  const bufferItems = useLiveQuery(() => db.buffer_queue.toArray());
  const goals = useLiveQuery(() => db.goals.toArray());
  const leads = useLiveQuery(() => db.leads.toArray());
  const templates = useLiveQuery(() => db.templates.toArray());
  const activeProfile = useLiveQuery(
    () => db.profiles.get(userState?.activeProfileId || 'profile_default'),
    [userState?.activeProfileId]
  );

  const [activeStation, setActiveStationState] = useState<StationId>(getSavedStation);

  const setActiveStation = (st: StationId) => {
    setActiveStationState(st);
    try {
      localStorage.setItem('midmar_active_station', st);
      if (typeof window !== 'undefined' && window.location.hash !== `#${st.toLowerCase()}`) {
        window.history.replaceState(null, '', `#${st.toLowerCase()}`);
      }
      if (userState?.id) {
        db.user_state.update(userState.id, { activeStation: st }).catch(() => {});
      }
    } catch (_) {}
  };

  // Authentication Gate & Session Security
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

  // Record user activity to support auto-lock
  useEffect(() => {
    const handleActivity = () => {
      authService.recordActivity();
    };
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  const handleLogout = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    authService.logout();
    setIsAuthenticated(false);
  };

  // Full Width Workspace & Mobile Companion Hub
  const { t, language } = useTranslation();
  const [isFullWidthWorkspace, setIsFullWidthWorkspace] = useState(
    () => localStorage.getItem('midmar_full_width') === 'true'
  );
  const [isMobileCompanionOpen, setIsMobileCompanionOpen] = useState(false);

  const toggleFullWidthWorkspace = () => {
    setIsFullWidthWorkspace((prev) => {
      const next = !prev;
      localStorage.setItem('midmar_full_width', String(next));
      return next;
    });
  };

  // Modals state
  const [isPanicModalOpen, setIsPanicModalOpen] = useState(false);
  const [isBufferModalOpen, setIsBufferModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isCrmDrawerOpen, setIsCrmDrawerOpen] = useState(false);
  const [isBatteryGuideOpen, setIsBatteryGuideOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAiCoachOpen, setIsAiCoachOpen] = useState(false);
  const [isTwoMinuteModalOpen, setIsTwoMinuteModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isA2hsModalOpen, setIsA2hsModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isSleepRestModalOpen, setIsSleepRestModalOpen] = useState(false);
  const [isPrayerLocationModalOpen, setIsPrayerLocationModalOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLifestyleModalOpen, setIsLifestyleModalOpen] = useState(false);
  const [isWirdModalOpen, setIsWirdModalOpen] = useState(false);
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);
  const [isSmartTasbihOpen, setIsSmartTasbihOpen] = useState(false);
  const [smartTasbihMode, setSmartTasbihMode] = useState<TasbihPresetId>('tahlil_100');
  const [isDailyPrideTicketOpen, setIsDailyPrideTicketOpen] = useState(false);
  const [isTadabburModalOpen, setIsTadabburModalOpen] = useState(false);
  const [tadabburInitialItem, setTadabburInitialItem] = useState<DailyTadabburItem | undefined>(undefined);
  const [tadabburInitialTab, setTadabburInitialTab] = useState<'quran' | 'hadith'>('quran');
  const [isFaithAudioModalOpen, setIsFaithAudioModalOpen] = useState(false);
  const [isArabicPoetryOpen, setIsArabicPoetryOpen] = useState(false);
  const [isLifeWisdomOpen, setIsLifeWisdomOpen] = useState(false);
  const [isNiyyahModalOpen, setIsNiyyahModalOpen] = useState(false);
  const [niyyahInitialPillar, setNiyyahInitialPillar] = useState<NiyyahPillar>('livelihood');

  const handleOpenNiyyah = (pillar: NiyyahPillar = 'livelihood') => {
    setNiyyahInitialPillar(pillar);
    setIsNiyyahModalOpen(true);
  };

  const handleOpenTadabburModal = (item?: DailyTadabburItem, tab: 'quran' | 'hadith' = 'quran') => {
    setTadabburInitialItem(item);
    setTadabburInitialTab(tab);
    setIsTadabburModalOpen(true);
  };

  const handleOpenSmartTasbih = (mode?: TasbihPresetId) => {
    if (mode) setSmartTasbihMode(mode);
    setIsSmartTasbihOpen(true);
  };

  // Progressive Web App Install Detection
  const pwaState = usePwaInstall();

  // Gentle automatic A2HS prompt on mobile if not standalone and not dismissed
  useEffect(() => {
    if (pwaState.shouldPrompt) {
      const timer = setTimeout(() => {
        setIsA2hsModalOpen(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [pwaState.shouldPrompt]);

  // First-time Onboarding Wizard if user profile has not finished onboarding
  useEffect(() => {
    if (activeProfile && activeProfile.onboardingCompleted !== true) {
      const seen = localStorage.getItem('midmar_onboarding_wizard_seen') === 'true';
      if (!seen) {
        setIsOnboardingModalOpen(true);
      }
    }
  }, [activeProfile]);

  // Central System Heartbeat: Prayer, Circadian Sleep, and Accountability in a single coordinated loop
  useEffect(() => {
    systemHeartbeat.start();
    return () => systemHeartbeat.stop();
  }, []);

  // Linear-speed Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    onSelectStation: (st) => setActiveStation(st),
    onOpenPanic: () => setIsPanicModalOpen(true),
    onOpenBuffer: () => setIsBufferModalOpen(true),
    onOpenGoals: () => setIsGoalsModalOpen(true),
    onOpenCrm: () => setIsCrmDrawerOpen(true),
    onOpenSettings: () => setIsSettingsModalOpen(true),
    onOpenShortcuts: () => setIsShortcutsModalOpen(true),
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onCloseAll: () => {
      setIsPanicModalOpen(false);
      setIsBufferModalOpen(false);
      setIsGoalsModalOpen(false);
      setIsCrmDrawerOpen(false);
      setIsBatteryGuideOpen(false);
      setIsSettingsModalOpen(false);
      setIsShortcutsModalOpen(false);
      setIsArchiveModalOpen(false);
      setIsProfileModalOpen(false);
      setIsAiCoachOpen(false);
      setIsTwoMinuteModalOpen(false);
      setIsEvaluationModalOpen(false);
      setIsHabitModalOpen(false);
      setIsSleepRestModalOpen(false);
      setIsPrayerLocationModalOpen(false);
      setIsRewardsModalOpen(false);
      setIsCommandPaletteOpen(false);
      setIsLifestyleModalOpen(false);
      setIsWirdModalOpen(false);
      setIsPaletteModalOpen(false);
      setIsSmartTasbihOpen(false);
      setIsDailyPrideTicketOpen(false);
      setIsTadabburModalOpen(false);
    },
  });

  // Reward Toast state
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  // Synchronize browser history hashchange (Back / Forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const cleanHash = window.location.hash.replace('#', '').toUpperCase();
      const match = ALL_STATIONS.find((s) => s === cleanHash || s.toLowerCase() === cleanHash.toLowerCase());
      if (match && match !== activeStation) {
        setActiveStationState(match);
        localStorage.setItem('midmar_active_station', match);
        if (userState?.id) {
          db.user_state.update(userState.id, { activeStation: match }).catch(() => {});
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeStation, userState?.id]);

  // Initial DB sync if no localStorage or hash was present
  useEffect(() => {
    if (userState?.activeStation) {
      const local = localStorage.getItem('midmar_active_station');
      const hasHash = Boolean(window.location.hash);
      if (!local && !hasHash && userState.activeStation !== activeStation) {
        setActiveStation(userState.activeStation);
      }
    }
  }, [userState?.activeStation]);

  // Handle Actionable Notification messages from Service Worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        const action = event.data.action;
        if (action === 'start_timer') {
          setActiveStation('WORK_MICRO_SPRINT');
        } else if (action === 'defer_to_buffer') {
          handleDeferToBuffer('مهمة عبر الإشعار التفاعلي', 20);
        } else if (action === 'mark_done') {
          handleCompleteStation('GYM_ANCHOR', 15);
        } else if (action === 'open_sleep') {
          setIsSleepRestModalOpen(true);
        } else if (action === 'open_wird' || action === 'open_prayer') {
          setActiveStation('COMMUTE_MORNING');
        } else if (action === 'open_checkin') {
          setActiveStation('RETROSPECTIVE_CHECKIN');
        } else if (action === 'mark_prayed' || action === 'mark_late_prayer') {
          const now = new Date();
          const pLoc = userState?.settings?.prayerLocation;
          const pTimes = calculatePrayerTimes(
            now,
            pLoc?.latitude ?? 30.0444,
            pLoc?.longitude ?? 31.2357,
            pLoc?.calculationMethod ?? 'egyptian'
          );
          const currentP = getNextPrayer(pTimes);
          awardPrayerPoints(currentP.name, 'on_time', pTimes.isFriday).then((res) => {
            setRewardToast(res.message || '🕌 تقبل الله صلاتك وتم حفظ درع الثبات!');
            setTimeout(() => setRewardToast(null), 3500);
          });
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [userState]);

  const completedStations = todayLog?.completedStations || [];
  const pendingBufferCount = bufferItems?.filter((i) => i.status === 'pending').length || 0;
  const weeklyBufferCount = userState?.weeklyBufferCount || 0;
  const currentEnergyLevel = userState?.energyLevel || 'high';

  // Cognitive Energy Barometer Selector
  const handleSelectEnergyLevel = async (level: EnergyLevel) => {
    if (!userState) return;
    const isLow = level === 'low';
    await db.user_state.update(userState.id, {
      energyLevel: level,
      energyDate: today,
      survivalMode: isLow ? true : (level === 'high' ? false : userState.survivalMode),
    });
    if (todayLog) {
      await db.daily_logs.update(today, { survivalModeActive: isLow });
    }
  };

  // Toggle Survival Mode (Minimum Viable Day - MVD)
  const handleToggleSurvivalMode = async () => {
    if (!userState) return;
    const newSurvival = !userState.survivalMode;
    await db.user_state.update(userState.id, {
      survivalMode: newSurvival,
      resilienceBadges: newSurvival ? userState.resilienceBadges + 1 : userState.resilienceBadges,
    });
    if (todayLog) {
      await db.daily_logs.update(today, { survivalModeActive: newSurvival });
    }
    setRewardToast(
      newSurvival
        ? '🛡️ تم تفعيل وضع البقاء (MVD): تم تقليص المتطلبات بنسبة 80% وحماية شعلتك!'
        : 'تم العودة إلى الوضع الكامل للإنتاجية العالية.'
    );
    setTimeout(() => setRewardToast(null), 4000);
  };

  // Complete a station with points and lottery roll
  const handleCompleteStation = async (stationId: StationId, basePoints: number) => {
    const reward: RewardResult = await awardStationPoints(stationId, basePoints);

    setRewardToast(reward.message);
    setTimeout(() => setRewardToast(null), 4500);

    // Save active station
    if (userState) {
      await db.user_state.update(userState.id, { activeStation: stationId });
    }
  };

  // Penalty handler for Loss Aversion (Focus core withering)
  const handleApplyPenalty = async (pointsLost: number) => {
    if (!userState) return;
    const newPoints = Math.max(0, userState.totalPoints - pointsLost);
    await db.user_state.update(userState.id, { totalPoints: newPoints });

    setRewardToast(`⚠️ تم خصم ${pointsLost} نقاط لعدم إكمال جلسة التركيز (Focus Loss Penalty).`);
    setTimeout(() => setRewardToast(null), 4000);
  };

  // Defer task to Saturday Buffer
  const handleDeferToBuffer = async (taskTitle: string, durationMin: number) => {
    if (!userState) return;
    if (userState.weeklyBufferCount >= 2) {
      alert('تم الوصول للحد الأقصى للتأجيل الأسبوعي (مهمتان كحد أقصى للحفاظ على الالتزام)!');
      return;
    }

    const newItem = {
      id: `buf-${Date.now()}`,
      originalDate: today,
      taskTitle,
      durationMin,
      status: 'pending' as const,
    };

    await db.buffer_queue.add(newItem);
    await db.user_state.update(userState.id, {
      weeklyBufferCount: userState.weeklyBufferCount + 1,
    });

    setRewardToast('⏱️ تم ترحيل المهمة لبافر السبت (3 ساعات) دون كسر شعلتك اليومية!');
    setTimeout(() => setRewardToast(null), 4000);
  };

  // Station navigation step
  const handleNextStationFrom = (current: StationId) => {
    const order: StationId[] = [
      'HOME',
      'COMMUTE_MORNING',
      'WORK_MICRO_SPRINT',
      'GYM_ANCHOR',
      'EVENING_SPRINT',
      'RETROSPECTIVE_CHECKIN',
      'GRAND_REWARD_STATE',
    ];
    const currentIndex = order.indexOf(current);
    if (currentIndex < order.length - 1) {
      const next = order[currentIndex + 1];
      setActiveStation(next);
      if (userState) {
        db.user_state.update(userState.id, { activeStation: next });
      }
    }
  };

  const handlePrevStationFrom = (current: StationId) => {
    const order: StationId[] = [
      'HOME',
      'COMMUTE_MORNING',
      'WORK_MICRO_SPRINT',
      'GYM_ANCHOR',
      'EVENING_SPRINT',
      'RETROSPECTIVE_CHECKIN',
      'GRAND_REWARD_STATE',
    ];
    const currentIndex = order.indexOf(current);
    if (currentIndex > 0) {
      const prev = order[currentIndex - 1];
      setActiveStation(prev);
      if (userState) {
        db.user_state.update(userState.id, { activeStation: prev });
      }
    }
  };

  // Save Retrospective Check-in
  const handleSaveRetrospective = async (voiceNotes: string, goldenNugget: string) => {
    if (todayLog) {
      await db.daily_logs.update(today, {
        voiceNotes,
        goldenNugget,
      });
    }
  };

  // Select Today's Anchor Micro-Step
  const handleSelectTodayAnchor = async (microStepId: string) => {
    if (todayLog) {
      await db.daily_logs.update(today, {
        selectedAnchorMicroStepId: microStepId,
      });
    }
    setRewardToast('⚓ تم تثبيت مرساة اليوم الرئيسية بنجاح!');
    setTimeout(() => setRewardToast(null), 3000);
  };

  const quranProgress = quranList?.[0];
  const bookProgress = bookList?.[0];
  const isSurvival = userState?.survivalMode ?? false;
  if (!isAuthenticated) {
    return <AuthGateView onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col font-sans pb-28 md:pb-16 transition-colors duration-200 relative overflow-x-hidden">
      {/* Living Circadian Sky Aurora (shifts smoothly with sun position) */}
      <CircadianAuroraBackground />

      {/* Top Header */}
      <Header
        userState={userState}
        onLogout={handleLogout}
        onGoHome={() => {
          setActiveStation('HOME');
          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onToggleSurvivalMode={handleToggleSurvivalMode}
        onOpenPanicModal={() => setIsPanicModalOpen(true)}
        onOpenBufferModal={() => setIsBufferModalOpen(true)}
        onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
        onOpenBatteryGuide={() => setIsBatteryGuideOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenAiCoach={() => setIsAiCoachOpen(true)}
        onOpenEvaluationModal={() => setIsEvaluationModalOpen(true)}
        onOpenHabitModal={() => setIsHabitModalOpen(true)}
        onOpenOnboardingWizard={() => setIsOnboardingModalOpen(true)}
        onOpenA2hsModal={() => setIsA2hsModalOpen(true)}
        onOpenSleepRest={() => setIsSleepRestModalOpen(true)}
        onOpenPrayerLocation={() => setIsPrayerLocationModalOpen(true)}
        onOpenRewardsModal={() => setIsRewardsModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenLifestyleModal={() => setIsLifestyleModalOpen(true)}
        onOpenWirdModal={() => setIsWirdModalOpen(true)}
        onOpenPaletteModal={() => setIsPaletteModalOpen(true)}
        onOpenSmartTasbih={() => handleOpenSmartTasbih()}
        onOpenPrideTicket={() => setIsDailyPrideTicketOpen(true)}
        onOpenArabicPoetry={() => setIsArabicPoetryOpen(true)}
        onOpenLifeWisdom={() => setIsLifeWisdomOpen(true)}
        onOpenNiyyahModal={() => handleOpenNiyyah('livelihood')}
        isPwaStandalone={pwaState.isStandalone}
        activeProfileName={activeProfile?.name}
        activeProfileEmoji={activeProfile?.avatarEmoji}
        pendingBufferCount={pendingBufferCount}
        isFullWidth={isFullWidthWorkspace}
        onToggleFullWidth={toggleFullWidthWorkspace}
      />

      {/* Dedicated Apple-Tier Live Capsule Bar ("الشريط الحكيم") */}
      {/* Placed in its own dedicated clear zone: zero floating overlap, zero obstruction */}
      <div className="w-full flex justify-center py-2 px-3 bg-slate-100/70 dark:bg-zinc-900/70 border-b border-slate-200/60 dark:border-zinc-800/60 backdrop-blur-md relative z-20">
        <DynamicIslandHub
          currentStation={activeStation}
          userState={userState}
          todayLog={todayLog}
          onSelectStation={(st) => {
            setActiveStation(st);
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAiCoach={() => setIsAiCoachOpen(true)}
          onOpenTwoMinuteRule={() => setIsTwoMinuteModalOpen(true)}
          onOpenEvaluation={() => setIsEvaluationModalOpen(true)}
          onOpenSleepRest={() => setIsSleepRestModalOpen(true)}
          onOpenLifestyleModal={() => setIsLifestyleModalOpen(true)}
          onOpenWirdModal={() => setIsWirdModalOpen(true)}
          onOpenSmartTasbih={handleOpenSmartTasbih}
          onRewardToast={(msg) => {
            setRewardToast(msg);
            setTimeout(() => setRewardToast(null), 3500);
          }}
        />
      </div>

      {/* Universal Station Navigation (Mobile horizontal capsule track + Desktop spacious cards) */}
      <StationNavigation
        currentStation={activeStation}
        completedStations={completedStations}
        onSelectStation={(st) => {
          setActiveStation(st);
          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isFullWidth={isFullWidthWorkspace}
        userState={userState}
        onOpenLifestyleModal={() => setIsLifestyleModalOpen(true)}
      />

      {/* Floating Reward / Notification Toast */}
      {rewardToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xl backdrop-blur-md animate-bounce flex items-center gap-2 max-w-sm text-center">
          <span>{rewardToast}</span>
        </div>
      )}

      {/* Main Content Area: Full-Width Responsive Workspace */}
      <main className={`flex-1 w-full ${isFullWidthWorkspace ? 'max-w-none px-3 sm:px-6 lg:px-8' : 'max-w-[1720px] mx-auto p-3 sm:p-5 lg:p-6'} pb-44 lg:pb-12 transition-all duration-300 space-y-4`}>
        {activeStation === 'HOME' ? (
          <>
            {/* Interactive User-Gesture Notification Permission Banner (Home Dashboard Only) */}
            <NotificationPermissionBanner
              onPermissionGranted={() => {
                setRewardToast('🔔 تم تفعيل التنبيهات بنجاح! ستصلك في موعدها الدقيق.');
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
            <HomeDashboardView
              userState={userState}
              todayLog={todayLog}
              allDailyLogs={allDailyLogs}
              activeProfile={activeProfile}
              onSelectStation={(st) => setActiveStation(st)}
              onOpenSmartTasbih={handleOpenSmartTasbih}
              onOpenSleepRest={() => setIsSleepRestModalOpen(true)}
              onOpenEvaluation={() => setIsEvaluationModalOpen(true)}
              onOpenLocationModal={() => setIsPrayerLocationModalOpen(true)}
              onRewardToast={(msg) => {
                setRewardToast(msg);
                setTimeout(() => setRewardToast(null), 3500);
              }}
              onOpenTadabburModal={handleOpenTadabburModal}
              completedStations={completedStations}
              onOpenLifestyleModal={() => setIsLifestyleModalOpen(true)}
              onOpenFaithAudio={() => setIsFaithAudioModalOpen(true)}
              onOpenArabicPoetry={() => setIsArabicPoetryOpen(true)}
              onOpenLifeWisdom={() => setIsLifeWisdomOpen(true)}
            />
        </>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Primary Station Focus Workspace with Touch Gestures & Spring Transitions */}
            <section className={isFullWidthWorkspace ? 'col-span-12 space-y-4' : 'col-span-12 lg:col-span-8 xl:col-span-9 space-y-4'}>
              {/* Universal Return Home Breadcrumb Bar */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200/80 dark:border-zinc-800 shadow-xs backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setActiveStation('HOME');
                    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-black text-xs cursor-pointer active:scale-95 transition-all hover:bg-emerald-100"
                >
                  <span className="text-sm">🏠</span>
                  <span>{language === 'ar' ? 'العودة إلى الرئيسية' : 'Return to Home'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-zinc-400">
                    {language === 'ar' ? 'جلسة تركيز نشطة' : 'Active Focus Session'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              <SwipeableStationContainer
                activeStation={activeStation}
                onNextStation={() => handleNextStationFrom(activeStation)}
                onPrevStation={() => handlePrevStationFrom(activeStation)}
              >
              {activeStation === 'COMMUTE_MORNING' && (
                <CommuteMorningView
                  quranProgress={quranProgress}
                  bookProgress={bookProgress}
                  isSurvivalMode={isSurvival}
                  isCompleted={completedStations.includes('COMMUTE_MORNING')}
                  onCompleteStation={() => handleCompleteStation('COMMUTE_MORNING', 10)}
                  onNextStation={() => handleNextStationFrom('COMMUTE_MORNING')}
                  energyLevel={currentEnergyLevel}
                  onSelectEnergyLevel={handleSelectEnergyLevel}
                  userState={userState}
                  onOpenSmartTasbih={handleOpenSmartTasbih}
                  onOpenTadabburModal={handleOpenTadabburModal}
                />
              )}

              {activeStation === 'WORK_MICRO_SPRINT' && (
                <WorkMicroSprintView
                  isCompleted={completedStations.includes('WORK_MICRO_SPRINT')}
                  onCompleteStation={() => handleCompleteStation('WORK_MICRO_SPRINT', 15)}
                  onNextStation={() => handleNextStationFrom('WORK_MICRO_SPRINT')}
                  onDeferToBuffer={handleDeferToBuffer}
                  bufferAvailableCount={2 - weeklyBufferCount}
                  todayDate={today}
                  onOpenTwoMinuteRule={() => setIsTwoMinuteModalOpen(true)}
                  onRewardToast={(msg) => {
                    setRewardToast(msg);
                    setTimeout(() => setRewardToast(null), 3500);
                  }}
                  onOpenNiyyahModal={handleOpenNiyyah}
                />
              )}

              {activeStation === 'GYM_ANCHOR' && (
                <GymAnchorView
                  isSurvivalMode={isSurvival}
                  isCompleted={completedStations.includes('GYM_ANCHOR')}
                  onCompleteStation={() => handleCompleteStation('GYM_ANCHOR', 15)}
                  onNextStation={() => handleNextStationFrom('GYM_ANCHOR')}
                  userState={userState}
                  onRewardToast={(msg) => {
                    setRewardToast(msg);
                    setTimeout(() => setRewardToast(null), 3500);
                  }}
                  onOpenNiyyahModal={handleOpenNiyyah}
                />
              )}

              {activeStation === 'EVENING_SPRINT' && (
                <EveningSprintView
                  isCompleted={completedStations.includes('EVENING_SPRINT')}
                  onCompleteStation={() => handleCompleteStation('EVENING_SPRINT', 20)}
                  onNextStation={() => handleNextStationFrom('EVENING_SPRINT')}
                  onOpenCrmDrawer={() => setIsCrmDrawerOpen(true)}
                  onApplyPenalty={handleApplyPenalty}
                  energyLevel={currentEnergyLevel}
                  userState={userState}
                  onRewardToast={(msg) => {
                    setRewardToast(msg);
                    setTimeout(() => setRewardToast(null), 3500);
                  }}
                />
              )}

              {activeStation === 'RETROSPECTIVE_CHECKIN' && (
                <RetrospectiveCheckinView
                  isCompleted={completedStations.includes('RETROSPECTIVE_CHECKIN')}
                  onCompleteStation={() => handleCompleteStation('RETROSPECTIVE_CHECKIN', 10)}
                  onNextStation={() => handleNextStationFrom('RETROSPECTIVE_CHECKIN')}
                  voiceNotes={todayLog?.voiceNotes || ''}
                  goldenNugget={todayLog?.goldenNugget || ''}
                  onSaveRetrospective={handleSaveRetrospective}
                  onOpenEvaluation={() => setIsEvaluationModalOpen(true)}
                  onRewardToast={(msg) => {
                    setRewardToast(msg);
                    setTimeout(() => setRewardToast(null), 3500);
                  }}
                />
              )}

              {activeStation === 'GRAND_REWARD_STATE' && (
                <GrandRewardView
                  totalPoints={userState?.totalPoints || 0}
                  streakDays={userState?.streakDays || 0}
                  onRestartNewDay={() => setActiveStation('COMMUTE_MORNING')}
                  onOpenRewardsModal={() => setIsRewardsModalOpen(true)}
                  onOpenEvaluation={() => setIsEvaluationModalOpen(true)}
                  onOpenPrideTicket={() => setIsDailyPrideTicketOpen(true)}
                  spentPoints={userState?.spentPoints || 0}
                />
              )}
            </SwipeableStationContainer>
          </section>

          {/* Persistent Companion Command Hub (Desktop: visible only when not full width) */}
          {!isFullWidthWorkspace && (
            <section className="hidden lg:block lg:col-span-4 xl:col-span-3">
              <CompanionSidebar
                dailyLogs={allDailyLogs || []}
                todayDate={today}
                userState={userState}
                todayLog={todayLog}
                goals={goals || []}
                bufferItems={bufferItems || []}
                onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
                onOpenBufferModal={() => setIsBufferModalOpen(true)}
                onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
                onOpenEvaluationModal={() => setIsEvaluationModalOpen(true)}
              />
            </section>
          )}
        </div>
        )}
      </main>

      {/* Native Apple-Tier Floating Glass Bottom Navigation Bar (< lg) */}
      <MobileBottomTabBar
        currentStation={activeStation}
        completedStations={completedStations}
        onSelectStation={(st) => {
          setActiveStation(st);
          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        userState={userState}
        todayLog={todayLog}
        onOpenLifestyleModal={() => setIsLifestyleModalOpen(true)}
        onOpenEvaluationModal={() => setIsEvaluationModalOpen(true)}
        onOpenCompanionHub={() => setIsMobileCompanionOpen(true)}
        onOpenWirdModal={() => setIsWirdModalOpen(true)}
        onOpenTadabburModal={() => handleOpenTadabburModal()}
        onOpenSmartTasbih={() => handleOpenSmartTasbih()}
        onOpenPrayerLocation={() => setIsPrayerLocationModalOpen(true)}
        onOpenFaithAudio={() => setIsFaithAudioModalOpen(true)}
      />

      {/* Mobile Companion Bottom Sheet Modal Drawer */}
      {isMobileCompanionOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setIsMobileCompanionOpen(false)}
          />
          <div className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-zinc-950 rounded-t-3xl border-t border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer Drag Header */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                  {t('mobile_companion_hub')}
                </h3>
              </div>
              <button
                onClick={() => setIsMobileCompanionOpen(false)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                ✕ {t('close')}
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-4 overflow-y-auto space-y-4">
              <CompanionSidebar
                dailyLogs={allDailyLogs || []}
                todayDate={today}
                userState={userState}
                todayLog={todayLog}
                goals={goals || []}
                bufferItems={bufferItems || []}
                onOpenGoalsModal={() => {
                  setIsMobileCompanionOpen(false);
                  setIsGoalsModalOpen(true);
                }}
                onOpenBufferModal={() => {
                  setIsMobileCompanionOpen(false);
                  setIsBufferModalOpen(true);
                }}
                onOpenArchiveModal={() => {
                  setIsMobileCompanionOpen(false);
                  setIsArchiveModalOpen(true);
                }}
                onOpenEvaluationModal={() => {
                  setIsMobileCompanionOpen(false);
                  setIsEvaluationModalOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals & Drawers with Lazy Suspense */}
      <Suspense fallback={null}>
      <ZeroInertiaModal
        isOpen={isPanicModalOpen}
        onClose={() => setIsPanicModalOpen(false)}
        onCompletedInertiaBreak={() => {
          soundSynth.playCompletionChime();
          haptic.vibrateWorkDone();
          setRewardToast('🚀 تم كسر الجمود بنجاح! أحسنت صنعاً.');
          setTimeout(() => setRewardToast(null), 3000);
        }}
      />

      <BufferQueueModal
        isOpen={isBufferModalOpen}
        onClose={() => setIsBufferModalOpen(false)}
        bufferItems={bufferItems || []}
        weeklyBufferCount={weeklyBufferCount}
      />

      <GoalVelocityModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        goals={goals || []}
        selectedAnchorId={todayLog?.selectedAnchorMicroStepId}
        onSelectTodayAnchor={handleSelectTodayAnchor}
      />

      <MiniCrmDrawer
        isOpen={isCrmDrawerOpen}
        onClose={() => setIsCrmDrawerOpen(false)}
        leads={leads || []}
        templates={templates || []}
      />

      <BatteryGuideModal
        isOpen={isBatteryGuideOpen}
        onClose={() => setIsBatteryGuideOpen(false)}
      />

      <SettingsBackupModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userState={userState}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <HistoryArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        dailyLogs={allDailyLogs || []}
        todayDate={today}
      />

      <ProfileSwitcherModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userState={userState}
      />

      {/* Periodic Evaluation & Motivation Report Modal */}
      <EvaluationReportModal
        isOpen={isEvaluationModalOpen}
        onClose={() => setIsEvaluationModalOpen(false)}
        userState={userState}
        todayLog={todayLog}
        dailyLogs={allDailyLogs || []}
      />

      {/* Habit Recurrence & Deed Adder Modal */}
      <HabitRecurrenceModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onHabitAdded={() => {
          setRewardToast(language === 'ar' ? '✨ تمت إضافة العادة بنجاح!' : 'Habit added successfully!');
          setTimeout(() => setRewardToast(null), 3000);
        }}
      />

      {/* AI Behavioral Accountability Coach Modal */}
      <AiCoachModal
        isOpen={isAiCoachOpen}
        onClose={() => setIsAiCoachOpen(false)}
        userState={userState}
        todayLog={todayLog}
        dailyLogs={allDailyLogs || []}
        activeProfile={activeProfile}
        onOpenSettings={() => {
          setIsAiCoachOpen(false);
          setIsSettingsModalOpen(true);
        }}
      />

      {/* 2-Minute Atomic Commitment Modal (Anti-Friction Rule) */}
      {isTwoMinuteModalOpen && (
        <TwoMinuteRuleCard
          isModal
          stationTitle={activeStation}
          onClose={() => setIsTwoMinuteModalOpen(false)}
          onContinueStation={() => setIsTwoMinuteModalOpen(false)}
          onCompleteTwoMinutes={() => {
            soundSynth.playCompletionChime();
            haptic.vibrateSprintCelebration();
            setRewardToast(language === 'ar' ? '🔥 أحسنت! كسرت حاجز البداية بنجاح (+5 نقاط زخم)' : 'Friction broken! (+5 Momentum pts)');
            setTimeout(() => setRewardToast(null), 3500);
          }}
        />
      )}

      {/* Add To Home Screen PWA Modal */}
      <AddToHomeScreenModal
        pwaState={pwaState}
        isOpen={isA2hsModalOpen}
        onClose={() => setIsA2hsModalOpen(false)}
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingWizardModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        activeProfile={activeProfile}
      />

      {/* Sleep & Circadian Rest Recovery Modal */}
      <SleepRestModal
        isOpen={isSleepRestModalOpen}
        onClose={() => setIsSleepRestModalOpen(false)}
        userState={userState}
        todayLog={todayLog}
        onRewardToast={(msg) => {
          setRewardToast(msg);
          setTimeout(() => setRewardToast(null), 3500);
        }}
      />

      {/* Dynamic Prayer Location & Calculation Modal */}
      <PrayerLocationModal
        isOpen={isPrayerLocationModalOpen}
        onClose={() => setIsPrayerLocationModalOpen(false)}
        userState={userState}
        onLocationUpdated={(city) => {
          setRewardToast(`📍 تم تحديث الموقع إلى ${city}`);
          setTimeout(() => setRewardToast(null), 3500);
        }}
      />

      {/* Real-Life Rewards Marketplace ("اشتري لنفسك كذا 🎁") */}
      <RealLifeRewardsModal
        isOpen={isRewardsModalOpen}
        onClose={() => setIsRewardsModalOpen(false)}
        userState={userState}
      />

      {/* Flagship Command Palette Omnisearch (Ctrl+K / ⌘K) */}
      <QuickCommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectStation={(st) => setActiveStation(st)}
        onStartSuggestedSprint={(_dur) => {
          setActiveStation('WORK_MICRO_SPRINT');
        }}
        onOpenSleepRest={() => setIsSleepRestModalOpen(true)}
        onOpenAiCoach={() => setIsAiCoachOpen(true)}
        onOpenTwoMinuteRule={() => setIsTwoMinuteModalOpen(true)}
        onOpenArchive={() => setIsArchiveModalOpen(true)}
        onOpenRewards={() => setIsRewardsModalOpen(true)}
        onOpenEvaluation={() => setIsEvaluationModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onToggleSurvivalMode={handleToggleSurvivalMode}
        onOpenFaithAudio={() => setIsFaithAudioModalOpen(true)}
        onOpenArabicPoetry={() => setIsArabicPoetryOpen(true)}
        onOpenLifeWisdom={() => setIsLifeWisdomOpen(true)}
        userState={userState}
        todayLog={todayLog}
        onRewardToast={(msg) => {
          setRewardToast(msg);
          setTimeout(() => setRewardToast(null), 3500);
        }}
      />

      {/* Universal Lifestyle Flow & Station Customizer Modal */}
      <LifestyleStationCustomizerModal
        isOpen={isLifestyleModalOpen}
        onClose={() => setIsLifestyleModalOpen(false)}
        userState={userState}
        onRewardToast={(msg) => {
          setRewardToast(msg);
          setTimeout(() => setRewardToast(null), 3500);
        }}
      />

      {/* Custom Spiritual & Quran Wird Modal (Al-Zahrawayn, Baqarah, Custom) */}
      <WirdCustomizerModal
        isOpen={isWirdModalOpen}
        onClose={() => setIsWirdModalOpen(false)}
        userState={userState}
        onRewardToast={(msg) => {
          setRewardToast(msg);
          setTimeout(() => setRewardToast(null), 3500);
        }}
      />

      {/* Artisanal Boutique Theme Palette Modal (De-AI Luxe) */}
      <ThemePaletteModal
        isOpen={isPaletteModalOpen}
        onClose={() => setIsPaletteModalOpen(false)}
        onRewardToast={(msg) => {
          setRewardToast(msg);
          setTimeout(() => setRewardToast(null), 3500);
        }}
      />

      {/* Smart Haptic Digital Tasbih Modal (Multi-Stage Khitam Salah & Dhikr) */}
      <SmartTasbihModal
        isOpen={isSmartTasbihOpen}
        onClose={() => setIsSmartTasbihOpen(false)}
        onRewardToast={(msg) => {
          setRewardToast(msg);
          setTimeout(() => setRewardToast(null), 3500);
        }}
        defaultMode={smartTasbihMode}
        userState={userState}
      />

      {/* Luxury Boarding Pass Daily Pride Ticket Modal */}
      <DailyPrideTicketModal
        isOpen={isDailyPrideTicketOpen}
        onClose={() => setIsDailyPrideTicketOpen(false)}
        todayLog={todayLog}
        userState={userState}
      />

      {/* Flagship Daily Quran & Hadith Tadabbur Sanctuary Modal */}
      <DailyTadabburModal
        isOpen={isTadabburModalOpen}
        onClose={() => setIsTadabburModalOpen(false)}
        initialItem={tadabburInitialItem}
        initialTab={tadabburInitialTab}
        onRewardToast={(msg) => {
          setRewardToast(msg);
          setTimeout(() => setRewardToast(null), 3500);
        }}
      />

      {/* Global Floating Audio Capsule (Smart Next/Prev, Speed, Mini Bar) */}
      <GlobalAudioCapsule onOpenFaithHub={() => setIsFaithAudioModalOpen(true)} />

      {/* Flagship Faith & Intellectual Audio Sanctuary Modal */}
      <FaithAudioSanctuaryModal
        isOpen={isFaithAudioModalOpen}
        onClose={() => setIsFaithAudioModalOpen(false)}
        onRewardToast={(msg) => {
          setRewardToast(msg);
          setTimeout(() => setRewardToast(null), 3500);
        }}
      />

      {/* Classical Arabic Poetry Diwan Modal */}
      <ArabicPoetryModal
        isOpen={isArabicPoetryOpen}
        onClose={() => setIsArabicPoetryOpen(false)}
        onRewardToast={(msg) => {
          setRewardToast(msg);
          setTimeout(() => setRewardToast(null), 3500);
        }}
      />

      {/* Practical Mental Models & Life Wisdom Vault Modal */}
      <LifeWisdomModal
        isOpen={isLifeWisdomOpen}
        onClose={() => setIsLifeWisdomOpen(false)}
        onRewardToast={(msg) => {
          setRewardToast(msg);
          setTimeout(() => setRewardToast(null), 3500);
        }}
      />

      {/* Flagship Niyyah Consecration Sanctuary Modal (4 Pillars) */}
      <NiyyahSanctuaryModal
        isOpen={isNiyyahModalOpen}
        onClose={() => setIsNiyyahModalOpen(false)}
        initialPillar={niyyahInitialPillar}
        onRewardToast={(msg) => {
          setRewardToast(msg);
          setTimeout(() => setRewardToast(null), 3500);
        }}
      />
      </Suspense>

      {/* Living Ambient Generative Soundscape Floating Player */}
      <AmbientSoundscapeBar />
    </div>
  );
}

export default App;
