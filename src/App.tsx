import { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
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
import { PositiveFrictionView } from './components/stations/PositiveFrictionView';

// Non-modal core components
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { TwoMinuteRuleCard } from './components/common/TwoMinuteRuleCard';
import { systemHeartbeat } from './services/systemHeartbeatCoordinator';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CompanionSidebar } from './components/dashboard/CompanionSidebar';
import { NotificationPermissionBanner } from './components/common/NotificationPermissionBanner';
import { BrandFooter } from './components/common/BrandFooter';
import { usePwaInstall } from './hooks/usePwaInstall';

// Living Interactive & Creative Components (V12 & V13)
import { CircadianAuroraBackground } from './components/interactive/CircadianAuroraBackground';
import { SwipeableStationContainer } from './components/interactive/SwipeableStationContainer';
import { DynamicIslandHub } from './components/interactive/DynamicIslandHub';
import { MobileBottomTabBar } from './components/navigation/MobileBottomTabBar';
import { AmbientSoundscapeBar } from './components/interactive/AmbientSoundscapeBar';
import { HomeDashboardView } from './components/dashboard/HomeDashboardView';
import { GlobalAudioCapsule } from './components/spiritual/GlobalAudioCapsule';
import { PersistentYouTubeHost } from './components/spiritual/PersistentYouTubeHost';
import { gymFaithAudio } from './services/gymFaithAudioService';
import type { DailyTadabburItem } from './data/dailyTadabburData';
import type { TasbihPresetId } from './utils/tasbihEngine';
import type { NiyyahPillar } from './components/spiritual/NiyyahSanctuaryModal';
import { AuthGateView } from './components/auth/AuthGateView';
import { authService } from './services/authService';
import { MorningEveningAdhkarModal } from './components/spiritual/MorningEveningAdhkarModal';
import { FlexibleQuranTrackerModal } from './components/spiritual/FlexibleQuranTrackerModal';

import { lazyWithRetry } from './utils/lazyWithRetry';

// Lazy Loaded Modals for Fast Initial Load & Sub-400kB Core Bundle (wrapped with lazyWithRetry for zero crash on chunk rotation)
const ArabicPoetryModal = lazyWithRetry(() => import('./components/modals/ArabicPoetryModal').then((m) => ({ default: m.ArabicPoetryModal })), 'ArabicPoetryModal');
const LifeWisdomModal = lazyWithRetry(() => import('./components/modals/LifeWisdomModal').then((m) => ({ default: m.LifeWisdomModal })), 'LifeWisdomModal');
const ZeroInertiaModal = lazyWithRetry(() => import('./components/modals/ZeroInertiaModal').then((m) => ({ default: m.ZeroInertiaModal })), 'ZeroInertiaModal');
const BufferQueueModal = lazyWithRetry(() => import('./components/modals/BufferQueueModal').then((m) => ({ default: m.BufferQueueModal })), 'BufferQueueModal');
const GoalVelocityModal = lazyWithRetry(() => import('./components/modals/GoalVelocityModal').then((m) => ({ default: m.GoalVelocityModal })), 'GoalVelocityModal');
const MiniCrmDrawer = lazyWithRetry(() => import('./components/modals/MiniCrmDrawer').then((m) => ({ default: m.MiniCrmDrawer })), 'MiniCrmDrawer');
const BatteryGuideModal = lazyWithRetry(() => import('./components/modals/BatteryGuideModal').then((m) => ({ default: m.BatteryGuideModal })), 'BatteryGuideModal');
const SettingsBackupModal = lazyWithRetry(() => import('./components/modals/SettingsBackupModal').then((m) => ({ default: m.SettingsBackupModal })), 'SettingsBackupModal');
const KeyboardShortcutsModal = lazyWithRetry(() => import('./components/modals/KeyboardShortcutsModal').then((m) => ({ default: m.KeyboardShortcutsModal })), 'KeyboardShortcutsModal');
const HistoryArchiveModal = lazyWithRetry(() => import('./components/modals/HistoryArchiveModal').then((m) => ({ default: m.HistoryArchiveModal })), 'HistoryArchiveModal');
const ProfileSwitcherModal = lazyWithRetry(() => import('./components/modals/ProfileSwitcherModal').then((m) => ({ default: m.ProfileSwitcherModal })), 'ProfileSwitcherModal');
const AiCoachModal = lazyWithRetry(() => import('./components/modals/AiCoachModal').then((m) => ({ default: m.AiCoachModal })), 'AiCoachModal');
const HabitRecurrenceModal = lazyWithRetry(() => import('./components/modals/HabitRecurrenceModal').then((m) => ({ default: m.HabitRecurrenceModal })), 'HabitRecurrenceModal');
const EvaluationReportModal = lazyWithRetry(() => import('./components/modals/EvaluationReportModal').then((m) => ({ default: m.EvaluationReportModal })), 'EvaluationReportModal');
const AddToHomeScreenModal = lazyWithRetry(() => import('./components/modals/AddToHomeScreenModal').then((m) => ({ default: m.AddToHomeScreenModal })), 'AddToHomeScreenModal');
const OnboardingWizardModal = lazyWithRetry(() => import('./components/modals/OnboardingWizardModal').then((m) => ({ default: m.OnboardingWizardModal })), 'OnboardingWizardModal');
const SleepRestModal = lazyWithRetry(() => import('./components/modals/SleepRestModal').then((m) => ({ default: m.SleepRestModal })), 'SleepRestModal');
const PrayerLocationModal = lazyWithRetry(() => import('./components/modals/PrayerLocationModal').then((m) => ({ default: m.PrayerLocationModal })), 'PrayerLocationModal');
const RealLifeRewardsModal = lazyWithRetry(() => import('./components/modals/RealLifeRewardsModal').then((m) => ({ default: m.RealLifeRewardsModal })), 'RealLifeRewardsModal');
const QuickCommandPaletteModal = lazyWithRetry(() => import('./components/modals/QuickCommandPaletteModal').then((m) => ({ default: m.QuickCommandPaletteModal })), 'QuickCommandPaletteModal');
const LifestyleStationCustomizerModal = lazyWithRetry(() => import('./components/modals/LifestyleStationCustomizerModal').then((m) => ({ default: m.LifestyleStationCustomizerModal })), 'LifestyleStationCustomizerModal');
const ThemePaletteModal = lazyWithRetry(() => import('./components/modals/ThemePaletteModal').then((m) => ({ default: m.ThemePaletteModal })), 'ThemePaletteModal');
const SmartTasbihModal = lazyWithRetry(() => import('./components/modals/SmartTasbihModal').then((m) => ({ default: m.SmartTasbihModal })), 'SmartTasbihModal');
const DailyPrideTicketModal = lazyWithRetry(() => import('./components/modals/DailyPrideTicketModal').then((m) => ({ default: m.DailyPrideTicketModal })), 'DailyPrideTicketModal');
const DailyTadabburModal = lazyWithRetry(() => import('./components/modals/DailyTadabburModal').then((m) => ({ default: m.DailyTadabburModal })), 'DailyTadabburModal');
const FaithAudioSanctuaryModal = lazyWithRetry(() => import('./components/spiritual/FaithAudioSanctuaryModal').then((m) => ({ default: m.FaithAudioSanctuaryModal })), 'FaithAudioSanctuaryModal');
const NiyyahSanctuaryModal = lazyWithRetry(() => import('./components/spiritual/NiyyahSanctuaryModal').then((m) => ({ default: m.NiyyahSanctuaryModal })), 'NiyyahSanctuaryModal');
const QuickReminderModal = lazyWithRetry(() => import('./components/modals/QuickReminderModal').then((m) => ({ default: m.QuickReminderModal })), 'QuickReminderModal');
const CustomDeckModal = lazyWithRetry(() => import('./components/modals/CustomDeckModal').then((m) => ({ default: m.CustomDeckModal })), 'CustomDeckModal');
const CalendarPrayerShieldModal = lazyWithRetry(() => import('./components/modals/CalendarPrayerShieldModal').then((m) => ({ default: m.CalendarPrayerShieldModal })), 'CalendarPrayerShieldModal');
const QuickPinModal = lazyWithRetry(() => import('./components/modals/QuickPinModal').then((m) => ({ default: m.QuickPinModal })), 'QuickPinModal');

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
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const stationParam = params.get('station');
    if (stationParam) {
      const match = ALL_STATIONS.find((s) => s.toUpperCase() === stationParam.toUpperCase());
      if (match) return match;
    }
    if (window.location.hash) {
      const cleanHash = window.location.hash.replace('#', '').toUpperCase();
      const match = ALL_STATIONS.find((s) => s === cleanHash || s.toLowerCase() === cleanHash.toLowerCase());
      if (match) return match;
    }
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
  const allDailyLogs = useLiveQuery(() => db.daily_logs.orderBy('date').reverse().limit(90).toArray());
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
        window.history.pushState({ station: st }, '', `#${st.toLowerCase()}`);
      }
      if (userState?.id) {
        db.user_state.update(userState.id, { activeStation: st }).catch(() => {});
      }
    } catch {}
  };

  const [hasAudioTrack, setHasAudioTrack] = useState(() => {
    const s = gymFaithAudio.getState();
    return Boolean(s.isPlaying || s.isLoading || s.currentTime > 0 || s.currentSeriesId);
  });

  useEffect(() => {
    return gymFaithAudio.subscribe((s) => {
      setHasAudioTrack(Boolean(s.isPlaying || s.isLoading || s.currentTime > 0 || s.currentSeriesId));
    });
  }, []);

  const [isGlobalAdhanPlaying, setIsGlobalAdhanPlaying] = useState(() => soundSynth.isAthanActive());

  useEffect(() => {
    return soundSynth.subscribeAthan((playing) => {
      setIsGlobalAdhanPlaying(playing);
    });
  }, []);

  // Authentication Gate & Session Security
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

  // Record user activity to support auto-lock (throttled to max 1 write per 15s)
  useEffect(() => {
    let lastActivityWrite = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityWrite > 15000) {
        lastActivityWrite = now;
        authService.recordActivity();
      }
    };
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity, { passive: true });
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
  const [evaluationInitialTab, setEvaluationInitialTab] = useState<'daily' | 'weekly' | 'monthly' | 'motivation'>('daily');

  const handleOpenEvaluation = (tab: 'daily' | 'weekly' | 'monthly' | 'motivation' = 'daily') => {
    setEvaluationInitialTab(tab);
    setIsEvaluationModalOpen(true);
  };
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
  const [isAdhkarModalOpen, setIsAdhkarModalOpen] = useState(false);
  const [adhkarMode, setAdhkarMode] = useState<'morning' | 'evening'>('morning');
  const [isDailyPrideTicketOpen, setIsDailyPrideTicketOpen] = useState(false);
  const [isTadabburModalOpen, setIsTadabburModalOpen] = useState(false);
  const [tadabburInitialItem, setTadabburInitialItem] = useState<DailyTadabburItem | undefined>(undefined);
  const [tadabburInitialTab, setTadabburInitialTab] = useState<'quran' | 'hadith'>('quran');
  const [isFaithAudioModalOpen, setIsFaithAudioModalOpen] = useState(false);
  const [isArabicPoetryOpen, setIsArabicPoetryOpen] = useState(false);
  const [isLifeWisdomOpen, setIsLifeWisdomOpen] = useState(false);
  const [isNiyyahModalOpen, setIsNiyyahModalOpen] = useState(false);
  const [niyyahInitialPillar, setNiyyahInitialPillar] = useState<NiyyahPillar>('livelihood');
  const [isQuickReminderOpen, setIsQuickReminderOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('action') === 'quick_reminder';
    }
    return false;
  });
  const [isCustomDeckModalOpen, setIsCustomDeckModalOpen] = useState(false);
  const [isCalendarShieldModalOpen, setIsCalendarShieldModalOpen] = useState(false);
  const [isQuickPinModalOpen, setIsQuickPinModalOpen] = useState(false);

  const handleOpenAdhkarModal = (mode?: 'morning' | 'evening') => {
    const currentHour = new Date().getHours();
    const defaultMode = mode || (currentHour >= 3 && currentHour < 16 ? 'morning' : 'evening');
    setAdhkarMode(defaultMode);
    setIsAdhkarModalOpen(true);
  };

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

  // Progressive Web App Install Detection (available manually from Header menu — no intrusive auto-popup on launch)
  const pwaState = usePwaInstall();

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
      setIsFaithAudioModalOpen(false);
      setIsArabicPoetryOpen(false);
      setIsLifeWisdomOpen(false);
      setIsNiyyahModalOpen(false);
      setIsQuickReminderOpen(false);
      setIsCustomDeckModalOpen(false);
      setIsCalendarShieldModalOpen(false);
      setIsQuickPinModalOpen(false);
    },
  });

  // Reward Toast state
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  // Synchronize browser & Android hardware back button navigation (hashchange + popstate)
  useEffect(() => {
    const handleHashChange = () => {
      const cleanHash = window.location.hash.replace('#', '').toUpperCase();
      if (!cleanHash) {
        if (activeStation !== 'HOME') {
          setActiveStationState('HOME');
          localStorage.setItem('midmar_active_station', 'HOME');
        }
        return;
      }
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
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
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

  // Penalty handler for Loss Aversion (Focus core withering)
  const handleApplyPenalty = async (pointsLost: number) => {
    if (!userState) return;
    const newPoints = Math.max(0, userState.totalPoints - pointsLost);
    await db.user_state.update(userState.id, { totalPoints: newPoints });

    setRewardToast(`⚠️ تم خصم ${pointsLost} نقاط لعدم إكمال جلسة التركيز (Focus Loss Penalty).`);
    setTimeout(() => setRewardToast(null), 4000);
  };

  // Station navigation step
  const handleNextStationFrom = (current: StationId) => {
    const order: StationId[] = [
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
    const currentIndex = order.indexOf(current);
    if (currentIndex >= 0 && currentIndex < order.length - 1) {
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
      'ONE_SEC_FRICTION',
      'SOCIAL_MEDIA_BREAK',
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
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col font-sans transition-colors duration-200 relative overflow-x-hidden">
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
        onOpenQuickReminder={() => setIsQuickReminderOpen(true)}
        onOpenPinModal={() => setIsQuickPinModalOpen(true)}
        onOpenCourses={() => {
          localStorage.setItem('midmar_work_view_mode', 'learning_tracker');
          localStorage.setItem('midmar_learning_subtab', 'courses');
          window.dispatchEvent(
            new CustomEvent('midmar_switch_work_mode', {
              detail: { mode: 'learning_tracker', subTab: 'courses' },
            })
          );
          setActiveStation('WORK_MICRO_SPRINT');
          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isPwaStandalone={pwaState.isStandalone}
        activeProfileName={activeProfile?.name}
        activeProfileEmoji={activeProfile?.avatarEmoji}
        pendingBufferCount={pendingBufferCount}
        isFullWidth={isFullWidthWorkspace}
        onToggleFullWidth={toggleFullWidthWorkspace}
      />

      {/* Dedicated Apple-Tier Live Capsule Bar ("الشريط الحكيم") */}
      {/* Placed in its own dedicated clear zone: zero floating overlap, zero obstruction */}
      <div className="w-full flex justify-center py-2 px-3 empty:hidden relative z-20">
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
          onOpenQuickReminder={() => setIsQuickReminderOpen(true)}
          onOpenFaithAudio={() => setIsFaithAudioModalOpen(true)}
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

      {/* Floating Reward / Notification Toast — Habitline Obsidian Capsule */}
      {rewardToast && (
        <div
          role="status"
          aria-live="polite"
          onClick={() => setRewardToast(null)}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#141517]/95 dark:bg-white/95 border border-white/15 dark:border-zinc-200 text-white dark:text-zinc-950 text-xs font-bold shadow-[0_14px_35px_rgba(20,21,23,0.35)] backdrop-blur-xl animate-fade-in flex items-center gap-2.5 max-w-[92vw] sm:max-w-md text-center cursor-pointer active:scale-95 transition-transform"
        >
          <span className="w-5 h-5 rounded-full bg-habit-green-ink text-white flex items-center justify-center text-[11px] shrink-0 shadow-xs">
            ✓
          </span>
          <span className=" leading-snug">{rewardToast}</span>
        </div>
      )}

      {/* Main Content Area: Full-Width Responsive Workspace */}
      <main className={`flex-1 w-full ${isFullWidthWorkspace ? 'max-w-none px-2.5 sm:px-6 lg:px-8' : 'max-w-[1720px] mx-auto px-2.5 py-2 sm:p-5 lg:p-6'} ${hasAudioTrack ? 'pb-52 lg:pb-10' : 'pb-24 lg:pb-8'} transition-all duration-300 space-y-3 sm:space-y-4`}>
        {activeStation === 'HOME' ? (
          <>
            <ErrorBoundary
              fallbackTitle={language === 'ar' ? 'تنبيه مؤقت في لوحة المؤشرات الرئيسية' : 'Temporary alert in Home Dashboard'}
              onReset={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
            >
              <HomeDashboardView
                userState={userState}
                todayLog={todayLog}
                allDailyLogs={allDailyLogs}
                activeProfile={activeProfile}
                onSelectStation={(st) => setActiveStation(st)}
                onOpenSmartTasbih={handleOpenSmartTasbih}
                onOpenSleepRest={() => setIsSleepRestModalOpen(true)}
                onOpenEvaluation={() => handleOpenEvaluation('daily')}
                onOpenMonthlyEvaluation={() => handleOpenEvaluation('monthly')}
                onOpenLocationModal={() => setIsPrayerLocationModalOpen(true)}
                onRewardToast={(msg) => {
                  setRewardToast(msg);
                  setTimeout(() => setRewardToast(null), 3500);
                }}
                onOpenTadabburModal={handleOpenTadabburModal}
                completedStations={completedStations}
                onOpenLifestyleModal={() => setIsLifestyleModalOpen(true)}
                onOpenFaithAudio={() => setIsFaithAudioModalOpen(true)}
                notificationSlot={
                  <NotificationPermissionBanner
                    onPermissionGranted={() => {
                      setRewardToast('🔔 تم تفعيل التنبيهات بنجاح! ستصلك في موعدها الدقيق.');
                      setTimeout(() => setRewardToast(null), 3500);
                    }}
                  />
                }
                onOpenArabicPoetry={() => setIsArabicPoetryOpen(true)}
                onOpenLifeWisdom={() => setIsLifeWisdomOpen(true)}
                onOpenPanic={() => setIsPanicModalOpen(true)}
                onOpenCustomDeck={() => setIsCustomDeckModalOpen(true)}
                onOpenCalendarShield={() => setIsCalendarShieldModalOpen(true)}
                onOpenAdhkarModal={(mode) => handleOpenAdhkarModal(mode)}
                onOpenQuranTracker={() => setIsWirdModalOpen(true)}
              />
            </ErrorBoundary>
        </>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
            {/* Primary Station Focus Workspace with Touch Gestures & Spring Transitions */}
            <section className={isFullWidthWorkspace ? 'col-span-12 space-y-3 sm:space-y-4' : 'col-span-12 lg:col-span-8 xl:col-span-9 space-y-3 sm:space-y-4'}>
              <ErrorBoundary
                fallbackTitle={language === 'ar' ? 'تنبيه مؤقت في محطة العمل الحالية' : 'Temporary alert in current station'}
                onReset={() => setActiveStation('HOME')}
              >
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
                    onRewardToast={(msg) => {
                      setRewardToast(msg);
                      setTimeout(() => setRewardToast(null), 3500);
                    }}
                    todayLog={todayLog}
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

                {(activeStation === 'ONE_SEC_FRICTION' || activeStation === 'SOCIAL_MEDIA_BREAK') && (
                  <PositiveFrictionView
                    stationId={activeStation}
                    onNextStation={() => {
                      handleCompleteStation(activeStation, 10);
                      handleNextStationFrom(activeStation);
                    }}
                    onReturnHome={() => setActiveStation('HOME')}
                    onOpenZeroInertia={() => setIsPanicModalOpen(true)}
                    userState={userState}
                    onRewardToast={(msg) => {
                      setRewardToast(msg);
                      setTimeout(() => setRewardToast(null), 3500);
                    }}
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
            </ErrorBoundary>
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

        {/* Official FikraDM & Timing OS Brand Footer */}
        <BrandFooter language={language} />
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
        onOpenAdhkarModal={() => handleOpenAdhkarModal()}
        onOpenTadabburModal={() => handleOpenTadabburModal()}
        onOpenSmartTasbih={() => handleOpenSmartTasbih()}
        onOpenPrayerLocation={() => setIsPrayerLocationModalOpen(true)}
        onOpenFaithAudio={() => setIsFaithAudioModalOpen(true)}
      />

      {/* Mobile Companion Centered Popup Modal */}
      {isMobileCompanionOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('mobile_companion_hub')}
          className="fixed inset-0 z-[100] lg:hidden flex items-center justify-center p-3.5 bg-black/65 backdrop-blur-xs animate-fade-in"
        >
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setIsMobileCompanionOpen(false)}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md max-h-[85dvh] bg-[#f7f7f7] dark:bg-zinc-950 rounded-[28px] border border-zinc-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-scale-in"
          >
            {/* Popup Header — Habitline Obsidian Pill Accent */}
            <div className="px-4 py-3.5 border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#141517]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#141517] dark:bg-emerald-500/20 text-[#bce8c2] flex items-center justify-center text-xs font-bold">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {t('mobile_companion_hub')}
                  </h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {language === 'ar' ? 'الأثر الأسبوعي • الأصوات • صندوق التأجيل' : 'Weekly Matrix • Soundscape • Buffer'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileCompanionOpen(false)}
                className="min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 transition-transform active:scale-95 cursor-pointer flex items-center justify-center"
              >
                ✕ {t('close')}
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-4 overflow-y-auto overscroll-contain space-y-4">
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
        </div>,
        document.body
      )}

      {/* Dedicated Sacred Modals with Isolated ErrorBoundary (Always Eagerly Mounted) */}
      <ErrorBoundary
        isModal
        resetKey={String(isWirdModalOpen)}
        onReset={() => setIsWirdModalOpen(false)}
        fallbackTitle="تنبيه مؤقت في نافذة متابعة الورد القرآني"
      >
        {isWirdModalOpen && (
          <FlexibleQuranTrackerModal
            isOpen={isWirdModalOpen}
            onClose={() => setIsWirdModalOpen(false)}
            quranProgress={quranProgress}
            todayLog={todayLog}
            onRewardToast={(msg) => {
              setRewardToast(msg);
              setTimeout(() => setRewardToast(null), 3500);
            }}
          />
        )}
      </ErrorBoundary>

      <ErrorBoundary
        isModal
        resetKey={String(isAdhkarModalOpen)}
        onReset={() => setIsAdhkarModalOpen(false)}
        fallbackTitle="تنبيه مؤقت في نافذة أذكار الصباح والمساء"
      >
        {isAdhkarModalOpen && (
          <MorningEveningAdhkarModal
            isOpen={isAdhkarModalOpen}
            onClose={() => setIsAdhkarModalOpen(false)}
            initialMode={adhkarMode}
            isCompleted={adhkarMode === 'morning' ? todayLog?.adhkarMorningDone : todayLog?.adhkarEveningDone}
            onRewardToast={(msg) => {
              setRewardToast(msg);
              setTimeout(() => setRewardToast(null), 3500);
            }}
          />
        )}
      </ErrorBoundary>

      {/* Lazy Modals Protected by Self-Healing Modal ErrorBoundary & Instant Feedback Suspense */}
      <ErrorBoundary
        isModal
        resetKey={[
          isPanicModalOpen,
          isBufferModalOpen,
          isGoalsModalOpen,
          isCrmDrawerOpen,
          isBatteryGuideOpen,
          isSettingsModalOpen,
          isQuickReminderOpen,
          isShortcutsModalOpen,
          isArchiveModalOpen,
          isProfileModalOpen,
          isEvaluationModalOpen,
          isHabitModalOpen,
          isAiCoachOpen,
          isTwoMinuteModalOpen,
          isA2hsModalOpen,
          isOnboardingModalOpen,
          isSleepRestModalOpen,
          isPrayerLocationModalOpen,
          isRewardsModalOpen,
          isCommandPaletteOpen,
          isLifestyleModalOpen,
          isPaletteModalOpen,
          isSmartTasbihOpen,
          isDailyPrideTicketOpen,
          isTadabburModalOpen,
          isFaithAudioModalOpen,
          isArabicPoetryOpen,
          isLifeWisdomOpen,
          isNiyyahModalOpen,
          isCustomDeckModalOpen,
          isCalendarShieldModalOpen,
          isQuickPinModalOpen,
        ].join(',')}
        onReset={() => {
          setIsPanicModalOpen(false);
          setIsBufferModalOpen(false);
          setIsGoalsModalOpen(false);
          setIsCrmDrawerOpen(false);
          setIsBatteryGuideOpen(false);
          setIsSettingsModalOpen(false);
          setIsQuickReminderOpen(false);
          setIsShortcutsModalOpen(false);
          setIsArchiveModalOpen(false);
          setIsProfileModalOpen(false);
          setIsEvaluationModalOpen(false);
          setIsHabitModalOpen(false);
          setIsAiCoachOpen(false);
          setIsTwoMinuteModalOpen(false);
          setIsA2hsModalOpen(false);
          setIsOnboardingModalOpen(false);
          setIsSleepRestModalOpen(false);
          setIsPrayerLocationModalOpen(false);
          setIsRewardsModalOpen(false);
          setIsCommandPaletteOpen(false);
          setIsLifestyleModalOpen(false);
          setIsPaletteModalOpen(false);
          setIsSmartTasbihOpen(false);
          setIsDailyPrideTicketOpen(false);
          setIsTadabburModalOpen(false);
          setIsFaithAudioModalOpen(false);
          setIsArabicPoetryOpen(false);
          setIsLifeWisdomOpen(false);
          setIsNiyyahModalOpen(false);
          setIsCustomDeckModalOpen(false);
          setIsCalendarShieldModalOpen(false);
          setIsQuickPinModalOpen(false);
        }}
        fallbackTitle="تنبيه مؤقت في النوافذ المنبثقة"
      >
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs animate-fade-in">
              <div className="px-5 py-3.5 rounded-2xl celestial-obsidian-stage text-white border border-white/15 shadow-2xl flex items-center gap-3 text-xs font-bold">
                <span className="w-4 h-4 rounded-full border-2 border-[#bce8c2] border-t-transparent animate-spin" />
                <span>{language === 'ar' ? 'جاري فتح النافذة...' : 'Opening window...'}</span>
              </div>
            </div>
          }
        >
          {isPanicModalOpen && (
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
          )}

          {isBufferModalOpen && (
            <BufferQueueModal
              isOpen={isBufferModalOpen}
              onClose={() => setIsBufferModalOpen(false)}
              bufferItems={bufferItems || []}
              weeklyBufferCount={weeklyBufferCount}
            />
          )}

          {isGoalsModalOpen && (
            <GoalVelocityModal
              isOpen={isGoalsModalOpen}
              onClose={() => setIsGoalsModalOpen(false)}
              goals={goals || []}
              selectedAnchorId={todayLog?.selectedAnchorMicroStepId}
              onSelectTodayAnchor={handleSelectTodayAnchor}
            />
          )}

          {isCrmDrawerOpen && (
            <MiniCrmDrawer
              isOpen={isCrmDrawerOpen}
              onClose={() => setIsCrmDrawerOpen(false)}
              leads={leads || []}
              templates={templates || []}
            />
          )}

          {isBatteryGuideOpen && (
            <BatteryGuideModal
              isOpen={isBatteryGuideOpen}
              onClose={() => setIsBatteryGuideOpen(false)}
            />
          )}

          {isSettingsModalOpen && (
            <SettingsBackupModal
              isOpen={isSettingsModalOpen}
              onClose={() => setIsSettingsModalOpen(false)}
              userState={userState}
              onOpenBatteryGuide={() => setIsBatteryGuideOpen(true)}
            />
          )}

          {isQuickReminderOpen && (
            <QuickReminderModal
              isOpen={isQuickReminderOpen}
              onClose={() => setIsQuickReminderOpen(false)}
              onRewardToast={(msg) => {
                setRewardToast(msg);
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}

          {isShortcutsModalOpen && (
            <KeyboardShortcutsModal
              isOpen={isShortcutsModalOpen}
              onClose={() => setIsShortcutsModalOpen(false)}
            />
          )}

          {isArchiveModalOpen && (
            <HistoryArchiveModal
              isOpen={isArchiveModalOpen}
              onClose={() => setIsArchiveModalOpen(false)}
              dailyLogs={allDailyLogs || []}
              todayDate={today}
            />
          )}

          {isProfileModalOpen && (
            <ProfileSwitcherModal
              isOpen={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
              userState={userState}
              onOpenPinModal={() => setIsQuickPinModalOpen(true)}
            />
          )}

          {isEvaluationModalOpen && (
            <EvaluationReportModal
              isOpen={isEvaluationModalOpen}
              onClose={() => setIsEvaluationModalOpen(false)}
              userState={userState}
              todayLog={todayLog}
              dailyLogs={allDailyLogs || []}
              activeProfile={activeProfile}
              initialTab={evaluationInitialTab}
              onRewardToast={(msg) => {
                setRewardToast(msg);
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}

          {isHabitModalOpen && (
            <HabitRecurrenceModal
              isOpen={isHabitModalOpen}
              onClose={() => setIsHabitModalOpen(false)}
              onHabitAdded={() => {
                setRewardToast(language === 'ar' ? '✨ تمت إضافة العادة بنجاح!' : 'Habit added successfully!');
                setTimeout(() => setRewardToast(null), 3000);
              }}
            />
          )}

          {isAiCoachOpen && (
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
          )}

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

          {isA2hsModalOpen && (
            <AddToHomeScreenModal
              pwaState={pwaState}
              isOpen={isA2hsModalOpen}
              onClose={() => setIsA2hsModalOpen(false)}
            />
          )}

          {isOnboardingModalOpen && (
            <OnboardingWizardModal
              isOpen={isOnboardingModalOpen}
              onClose={() => setIsOnboardingModalOpen(false)}
              activeProfile={activeProfile}
            />
          )}

          {isSleepRestModalOpen && (
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
          )}

          {isPrayerLocationModalOpen && (
            <PrayerLocationModal
              isOpen={isPrayerLocationModalOpen}
              onClose={() => setIsPrayerLocationModalOpen(false)}
              userState={userState}
              onLocationUpdated={(city) => {
                setRewardToast(`📍 تم تحديث الموقع إلى ${city}`);
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}

          {isRewardsModalOpen && (
            <RealLifeRewardsModal
              isOpen={isRewardsModalOpen}
              onClose={() => setIsRewardsModalOpen(false)}
              userState={userState}
            />
          )}

          {isCommandPaletteOpen && (
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
          )}

          {isLifestyleModalOpen && (
            <LifestyleStationCustomizerModal
              isOpen={isLifestyleModalOpen}
              onClose={() => setIsLifestyleModalOpen(false)}
              userState={userState}
              onRewardToast={(msg) => {
                setRewardToast(msg);
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}

          {isPaletteModalOpen && (
            <ThemePaletteModal
              isOpen={isPaletteModalOpen}
              onClose={() => setIsPaletteModalOpen(false)}
              onRewardToast={(msg) => {
                setRewardToast(msg);
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}

          {isSmartTasbihOpen && (
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
          )}

          {isDailyPrideTicketOpen && (
            <DailyPrideTicketModal
              isOpen={isDailyPrideTicketOpen}
              onClose={() => setIsDailyPrideTicketOpen(false)}
              todayLog={todayLog}
              userState={userState}
            />
          )}

          {isTadabburModalOpen && (
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
          )}

          {isFaithAudioModalOpen && (
            <FaithAudioSanctuaryModal
              isOpen={isFaithAudioModalOpen}
              onClose={() => setIsFaithAudioModalOpen(false)}
              onRewardToast={(msg) => {
                setRewardToast(msg);
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}

          {isArabicPoetryOpen && (
            <ArabicPoetryModal
              isOpen={isArabicPoetryOpen}
              onClose={() => setIsArabicPoetryOpen(false)}
              onRewardToast={(msg) => {
                setRewardToast(msg);
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}

          {isLifeWisdomOpen && (
            <LifeWisdomModal
              isOpen={isLifeWisdomOpen}
              onClose={() => setIsLifeWisdomOpen(false)}
              onRewardToast={(msg) => {
                setRewardToast(msg);
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}

          {isNiyyahModalOpen && (
            <NiyyahSanctuaryModal
              isOpen={isNiyyahModalOpen}
              onClose={() => setIsNiyyahModalOpen(false)}
              initialPillar={niyyahInitialPillar}
              onRewardToast={(msg) => {
                setRewardToast(msg);
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}

          {isCustomDeckModalOpen && (
            <CustomDeckModal
              isOpen={isCustomDeckModalOpen}
              onClose={() => setIsCustomDeckModalOpen(false)}
              onImportComplete={(count) => {
                setRewardToast(`تم استيراد ${count} بطاقة بنجاح إلى بنك المفردات! ✨`);
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}

          {isCalendarShieldModalOpen && (
            <CalendarPrayerShieldModal
              isOpen={isCalendarShieldModalOpen}
              onClose={() => setIsCalendarShieldModalOpen(false)}
              onEventsImported={(count) => {
                setRewardToast(`تمت حماية مواعيدك ومزامنة ${count} موعد في درع الصلوات 🛡️`);
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}

          {isQuickPinModalOpen && (
            <QuickPinModal
              isOpen={isQuickPinModalOpen}
              onClose={() => setIsQuickPinModalOpen(false)}
              onProfileUpdated={() => {
                setRewardToast('✨ تم حفظ وتحديث بيانات الحساب بنجاح');
                setTimeout(() => setRewardToast(null), 3500);
              }}
            />
          )}
        </Suspense>
      </ErrorBoundary>

      {/* Global Emergency Adhan Stop Banner (Always on top z-[200] across all stations & modals) */}
      {isGlobalAdhanPlaying && (
        <div className="fixed top-3 inset-x-3 z-[200] max-w-lg mx-auto rounded-2xl bg-zinc-950/95 border-2 border-amber-500/80 shadow-[0_16px_48px_rgba(0,0,0,0.85)] p-3 flex flex-wrap items-center justify-between gap-2.5 text-white animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center text-base shrink-0 font-black">
              🕌
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black text-amber-300 truncate">
                📢 يُرفع الآن صوت الأذان الشريف
              </p>
              <p className="text-[10px] text-zinc-300 truncate">
                اضغط للإيقاف الفوري أو اضغط زر (Esc) في لوحة المفاتيح
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ms-auto">
            <button
              type="button"
              onClick={() => {
                soundSynth.stopAthanAudio();
                setIsGlobalAdhanPlaying(false);
                setRewardToast('🔇 تم إيقاف صوت الأذان فوراً');
                setTimeout(() => setRewardToast(null), 2500);
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-black shadow-md cursor-pointer transition-all"
            >
              🔇 إيقاف فوراً
            </button>
            <button
              type="button"
              onClick={async () => {
                soundSynth.stopAthanAudio();
                setIsGlobalAdhanPlaying(false);
                const stateId = userState?.id || 'current_user';
                const currentAudio = userState?.settings?.prayerAudioSettings || {
                  adhanEnabled: false,
                  adhanUserExplicitlyOptedIn: false,
                  muadhin: 'makkah',
                  prePrayerAlertEnabled: true,
                  prePrayerAlertMinutes: 10,
                  chimeWhenDisabled: 'rast_minaret',
                };
                await db.user_state.update(stateId, {
                  'settings.prayerAudioSettings': {
                    ...currentAudio,
                    adhanEnabled: false,
                    adhanUserExplicitlyOptedIn: false,
                    silentWorkMode: true,
                  },
                });
                setRewardToast('🔕 تم تفعيل وضع العمل والاجتماعات (إلغاء الأذان التلقائي نهائياً)');
                setTimeout(() => setRewardToast(null), 3500);
              }}
              className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/15 active:scale-95 text-zinc-200 text-[11px] font-bold cursor-pointer transition-all"
              title="إيقاف الصوت الآن وإلغاء التشغيل التلقائي للأذان نهائياً أثناء العمل والاجتماعات"
            >
              💼 وضع العمل (صامت دائماً)
            </button>
          </div>
        </div>
      )}

      {/* Persistent Global YouTube Player Host (Keeps Audio Playing Across All Modals & Views) */}
      <PersistentYouTubeHost />

      {/* Global Floating Audio Capsule (Hidden while full FaithAudioSanctuaryModal is open to prevent duplicate player & backdrop-blur flicker) */}
      {!isFaithAudioModalOpen && (
        <GlobalAudioCapsule onOpenFaithHub={() => setIsFaithAudioModalOpen(true)} />
      )}

      {/* Living Ambient Generative Soundscape Floating Player */}
      <AmbientSoundscapeBar />
    </div>
  );
}

export default App;
