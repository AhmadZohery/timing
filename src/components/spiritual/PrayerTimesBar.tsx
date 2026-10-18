import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  MapPin,
  ChevronDown,
  Navigation,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  calculatePrayerTimes,
  getNextPrayer,
  formatPrayerTime,
  calculateNightIntervals,
  PRESET_CITIES,
  detectDefaultCityFromTimezone,
  type CalculatedPrayerTimes,
  type NightIntervals,
} from '../../utils/prayerCalculator';
import {
  awardPrayerPoints,
  getBiologicalDate,
  upsertDailyLog,
  type PrayerSunnahDetails,
} from '../../utils/gamification';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { db } from '../../db/db';
import { useTranslation } from '../../i18n/LanguageContext';
import type { DailyLog, PrayerName, UserState } from '../../types';
import { checkIsFridaySalawatWindow, type TasbihPresetId } from '../../utils/tasbihEngine';
import { autoDetectAndSyncPrayerLocation, fetchAladhanPrayerTimings } from '../../services/onlinePrayerService';
import { MUADHIN_OPTIONS } from '../../utils/prayerCalculator';
import { NawafilGuideModal, type NafilaTab } from './NawafilGuideModal';
import { QadaaPrayerTracker } from './QadaaPrayerTracker';

interface CelestialTheme {
  celestialIcon: string;
  virtueAr: string;
  virtueEn: string;
  badgeAr?: string;
  badgeEn?: string;
  gradientDark: string;
  gradientLight: string;
  borderDark: string;
  borderLight: string;
  accentText: string;
  accentGlow: string;
}

const CELESTIAL_THEMES: Record<PrayerName, CelestialTheme> = {
  fajr: {
    celestialIcon: '🌄',
    virtueAr: 'ركعتا الفجر خيرٌ من الدنيا وما فيها',
    virtueEn: 'Fajr sunnah is better than the world',
    badgeAr: 'أعلى أجر 👑',
    badgeEn: 'Top XP 👑',
    gradientDark: 'from-indigo-950/80 via-slate-900/90 to-amber-950/30',
    gradientLight: 'from-indigo-50/90 via-white to-amber-50/50',
    borderDark: 'border-indigo-500/30 hover:border-indigo-400/60',
    borderLight: 'border-indigo-200/90 hover:border-indigo-300',
    accentText: 'text-indigo-600 dark:text-indigo-400',
    accentGlow: 'rgba(99,102,241,0.25)',
  },
  dhuhr: {
    celestialIcon: '☀️',
    virtueAr: 'سنة الزوال وباب السماء مفتوح',
    virtueEn: 'Sunnah of Zawal & open gates',
    badgeAr: 'الزوال ☀️',
    badgeEn: 'Zenith ☀️',
    gradientDark: 'from-amber-950/70 via-slate-900/90 to-yellow-950/30',
    gradientLight: 'from-amber-50/90 via-white to-yellow-50/50',
    borderDark: 'border-amber-500/30 hover:border-amber-400/60',
    borderLight: 'border-amber-200/90 hover:border-amber-300',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentGlow: 'rgba(245,158,11,0.25)',
  },
  asr: {
    celestialIcon: '🌇',
    virtueAr: 'الصلاة الوسطى ورحم الله من صلى قبلها 4',
    virtueEn: 'The Middle Prayer & golden hour',
    badgeAr: 'الوسطى ⏳',
    badgeEn: 'Middle ⏳',
    gradientDark: 'from-orange-950/70 via-slate-900/90 to-amber-950/30',
    gradientLight: 'from-orange-50/90 via-white to-amber-50/50',
    borderDark: 'border-orange-500/30 hover:border-orange-400/60',
    borderLight: 'border-orange-200/90 hover:border-orange-300',
    accentText: 'text-orange-600 dark:text-orange-400',
    accentGlow: 'rgba(249,115,22,0.25)',
  },
  maghrib: {
    celestialIcon: '🌆',
    virtueAr: 'إقبال الليل وإدبار النهار وسنة المغرب',
    virtueEn: 'Sunset twilight & prayer of dusk',
    badgeAr: 'سنة مؤكدة',
    badgeEn: 'Sunnah',
    gradientDark: 'from-rose-950/70 via-purple-950/40 to-slate-900/90',
    gradientLight: 'from-rose-50/90 via-white to-purple-50/50',
    borderDark: 'border-rose-500/30 hover:border-rose-400/60',
    borderLight: 'border-rose-200/90 hover:border-rose-300',
    accentText: 'text-rose-600 dark:text-rose-400',
    accentGlow: 'rgba(244,63,94,0.25)',
  },
  isha: {
    celestialIcon: '🌙',
    virtueAr: 'نور تام لمن مشى في الظلم وشرف قيام الليل',
    virtueEn: 'Light for dark walks & night vigil',
    badgeAr: 'الوتر والقيام 🌌',
    badgeEn: 'Night Vigil 🌌',
    gradientDark: 'from-slate-950 via-indigo-950/60 to-purple-950/40',
    gradientLight: 'from-slate-50/90 via-indigo-50/40 to-white',
    borderDark: 'border-indigo-500/30 hover:border-indigo-400/60',
    borderLight: 'border-indigo-200/90 hover:border-indigo-300',
    accentText: 'text-purple-600 dark:text-purple-400',
    accentGlow: 'rgba(168,85,247,0.25)',
  },
  sunrise: {
    celestialIcon: '🌅',
    virtueAr: 'صلاة الإشراق والضحى كأجر حجة وعمرة تامة',
    virtueEn: 'Ishraq & Dhuha prayer reward',
    gradientDark: 'from-amber-950/50 via-slate-900 to-slate-950',
    gradientLight: 'from-amber-50/80 via-white to-amber-50/30',
    borderDark: 'border-amber-500/30',
    borderLight: 'border-amber-200',
    accentText: 'text-amber-500',
    accentGlow: 'rgba(245,158,11,0.2)',
  },
  qiyam: {
    celestialIcon: '🌌',
    virtueAr: 'أفضل الصلاة بعد الفريضة صلاة الليل • شرف المؤمن',
    virtueEn: 'Best prayer after obligatory is night prayer',
    gradientDark: 'from-purple-950/70 via-indigo-950/80 to-slate-950',
    gradientLight: 'from-purple-50/80 via-white to-indigo-50/40',
    borderDark: 'border-purple-500/30',
    borderLight: 'border-purple-200',
    accentText: 'text-purple-500',
    accentGlow: 'rgba(168,85,247,0.25)',
  },
};

type SanctuaryTab = 'meeqat' | 'qiyam' | 'sunan' | 'qadaa' | 'tasbih';

export interface PrayerTimesBarProps {
  todayLog?: DailyLog | null;
  userState?: UserState | null;
  onRewardToast?: (msg: string) => void;
  onOpenLocationModal?: () => void;
  onOpenSmartTasbih?: (presetId?: TasbihPresetId) => void;
  externalTriggerPrayer?: { prayer: PrayerName; nonce: number } | null;
  className?: string;
}

export const PrayerTimesBar: React.FC<PrayerTimesBarProps> = ({
  todayLog,
  userState,
  onRewardToast,
  onOpenLocationModal,
  onOpenSmartTasbih,
  externalTriggerPrayer,
  className = '',
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  // Sanctuary Active Mode Tab
  const [sanctuaryTab, setSanctuaryTab] = useState<SanctuaryTab>('meeqat');

  const loc = userState?.settings?.prayerLocation;
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    if (loc?.city && loc.city !== 'cairo') return loc.city;
    const offset = -new Date().getTimezoneOffset() / 60;
    if (offset === 4) return 'dubai';
    return loc?.city || detectDefaultCityFromTimezone().id;
  });
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [selectedPrayerAction, setSelectedPrayerAction] = useState<PrayerName | null>(null);
  const [modalStatus, setModalStatus] = useState<'in_group' | 'on_time' | 'late' | 'excused'>('in_group');
  const [sunnahQabliyah, setSunnahQabliyah] = useState<number>(0);
  const [sunnahBadiyah, setSunnahBadiyah] = useState<number>(0);
  const [witrDone, setWitrDone] = useState<boolean>(false);
  const [isOnlineLive, setIsOnlineLive] = useState(false);
  const [justLoggedPrayer, setJustLoggedPrayer] = useState<{ name: PrayerName; title: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // In-Sanctuary Quick Tasbih State
  const [inAppTasbihCount, setInAppTasbihCount] = useState<number>(0);
  const [inAppTasbihTarget, setInAppTasbihTarget] = useState<number>(33);
  const [inAppTasbihPhrase, setInAppTasbihPhrase] = useState<string>('سُبْحَانَ اللَّهِ');

  // Adhan & Pre-Prayer Audio State
  const activeAdhanAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);
  const [dismissedAlertPrayer, setDismissedAlertPrayer] = useState<string | null>(null);

  // Nawafil Guide Modal & Extras Collapse State
  const [isNawafilModalOpen, setIsNawafilModalOpen] = useState(false);
  const [nawafilModalTab, setNawafilModalTab] = useState<NafilaTab>('dhuha');
  const [isExtrasExpanded, setIsExtrasExpanded] = useState(false);

  const handleStopAdhan = () => {
    soundSynth.playTactileClick();
    if (activeAdhanAudioRef.current) {
      activeAdhanAudioRef.current.pause();
      activeAdhanAudioRef.current.currentTime = 0;
    }
    setIsAdhanPlaying(false);
  };

  const handlePlayAdhan = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const pAudio = userState?.settings?.prayerAudioSettings;
    const muadhinKey = pAudio?.muadhin || 'makkah';
    const opt = MUADHIN_OPTIONS.find((m) => m.id === muadhinKey) || MUADHIN_OPTIONS[0];

    if (activeAdhanAudioRef.current) {
      activeAdhanAudioRef.current.pause();
    }
    const aud = new Audio(opt.audioUrl);
    aud.volume = 0.9;
    aud.play().then(() => {
      setIsAdhanPlaying(true);
      activeAdhanAudioRef.current = aud;
      onRewardToast?.(isAr ? `📢 يُرفع الأذان الآن بصوت: ${opt.nameAr}` : `Adhan playing: ${opt.nameAr}`);
    }).catch(() => {
      soundSynth.playPrayerSpiritualChime(pAudio?.chimeWhenDisabled || 'rast_minaret');
      onRewardToast?.(isAr ? `📿 رنين الصلاة الروحي (مقام الرست النبوي الشريف)` : `Prayer spiritual chime`);
    });
    aud.onended = () => {
      setIsAdhanPlaying(false);
    };
  };

  useEffect(() => {
    return () => {
      if (activeAdhanAudioRef.current) {
        activeAdhanAudioRef.current.pause();
      }
    };
  }, []);

  const cityPickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isCityPickerOpen) return;
    const handleOutsidePointer = (e: PointerEvent) => {
      if (cityPickerRef.current && !cityPickerRef.current.contains(e.target as Node)) {
        setIsCityPickerOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    return () => document.removeEventListener('pointerdown', handleOutsidePointer);
  }, [isCityPickerOpen]);

  const activeCity = PRESET_CITIES.find((c) => c.id === selectedCityId) || PRESET_CITIES[6]; // Dubai default

  const [prayerTimes, setPrayerTimes] = useState<CalculatedPrayerTimes>(() => {
    return calculatePrayerTimes(
      new Date(),
      loc?.latitude ?? activeCity.lat,
      loc?.longitude ?? activeCity.lng,
      (loc?.calculationMethod ?? activeCity.defaultMethod) as any
    );
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Optional background synchronization of official online prayer times (once per session, non-blocking)
  useEffect(() => {
    let isMounted = true;
    const sessionKey = 'midmar_online_prayer_synced_session';
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionKey)) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const activeLoc = await autoDetectAndSyncPrayerLocation(loc);
        const lat = activeLoc?.latitude ?? activeCity.lat;
        const lng = activeLoc?.longitude ?? activeCity.lng;
        const method = activeLoc?.calculationMethod ?? activeCity.defaultMethod;

        if (activeLoc?.city && activeLoc.city !== selectedCityId) {
          setSelectedCityId(activeLoc.city);
        }

        const onlineTimes = await fetchAladhanPrayerTimings(lat, lng, method);
        if (onlineTimes && isMounted) {
          setPrayerTimes(onlineTimes);
          setIsOnlineLive(true);
          sessionStorage.setItem(sessionKey, 'true');
        }
      } catch {}
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Recalculate or fallback offline calculation when city changes
  useEffect(() => {
    const times = calculatePrayerTimes(
      new Date(),
      loc?.latitude ?? activeCity.lat,
      loc?.longitude ?? activeCity.lng,
      (loc?.calculationMethod ?? activeCity.defaultMethod) as any
    );
    setPrayerTimes(times);
  }, [selectedCityId, loc, activeCity]);

  const nextPrayer = getNextPrayer(prayerTimes, currentTime, isAr);

  // Astronomical Night Intervals (Last Third of Night & Midnight)
  const nightIntervals: NightIntervals = calculateNightIntervals(
    prayerTimes.maghrib,
    prayerTimes.fajr,
    currentTime,
    isAr
  );

  const handleSelectCity = async (cityId: string) => {
    const target = PRESET_CITIES.find((c) => c.id === cityId);
    if (!target) return;
    setSelectedCityId(cityId);
    setIsCityPickerOpen(false);
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    if (userState) {
      await db.user_state.update('current_user', {
        'settings.prayerLocation': {
          city: target.id,
          latitude: target.lat,
          longitude: target.lng,
          calculationMethod: target.defaultMethod,
        },
      });
    }
  };

  const handleUseGps = () => {
    if (!('geolocation' in navigator)) {
      alert(isAr ? 'خدمة تحديد الموقع الجغرافي غير مدعومة في متصفحك' : 'Geolocation is not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        if (userState) {
          await db.user_state.update('current_user', {
            'settings.prayerLocation': {
              city: 'custom_gps',
              latitude,
              longitude,
              calculationMethod: 'egyptian',
            },
          });
        }
        setPrayerTimes(calculatePrayerTimes(new Date(), latitude, longitude, 'egyptian'));
        setIsCityPickerOpen(false);
        soundSynth.playCompletionChime();
        haptic.vibrateLight();
        if (onRewardToast) {
          onRewardToast(isAr ? '📍 تم تحديث مواقيت الصلاة لموقعك بدقة!' : 'Prayer times updated to your GPS!');
        }
      },
      (err) => {
        alert(isAr ? `تعذر الوصول للموقع: ${err.message}` : `GPS error: ${err.message}`);
      }
    );
  };

  const handleMarkPrayer = async (
    prayer: PrayerName,
    status: 'on_time' | 'in_group' | 'late' | 'excused',
    sunnahDetails?: PrayerSunnahDetails,
    tapEvent?: React.MouseEvent
  ) => {
    try {
      const originX =
        tapEvent && typeof window !== 'undefined'
          ? tapEvent.clientX / window.innerWidth
          : 0.5;
      const originY =
        tapEvent && typeof window !== 'undefined'
          ? tapEvent.clientY / window.innerHeight
          : 0.45;
      confetti({
        particleCount: status === 'in_group' ? 32 : 20,
        spread: 65,
        origin: { x: originX, y: originY },
        colors: ['#1eb814', '#22c55e', '#ff5500', '#7c3aed', '#f59e0b'],
        disableForReducedMotion: true,
      });
    } catch {}
    const res = await awardPrayerPoints(prayer, status, prayerTimes.isFriday, sunnahDetails);
    setSelectedPrayerAction(null);
    if (onRewardToast && res.message) {
      onRewardToast(res.message);
    }
    if (status !== 'late') {
      const pObj = prayerCards.find((c) => c.name === prayer);
      setJustLoggedPrayer({
        name: prayer,
        title: pObj?.title || prayer,
      });
    }
  };

  const handleLogNafilaDirect = async (nafilaId: NafilaTab, title: string, points: number) => {
    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();
    const bioDate = getBiologicalDate();
    const logKey: Partial<DailyLog> = {};
    if (nafilaId === 'dhuha') logKey.dhuhaDone = true;
    if (nafilaId === 'qiyam') logKey.qiyamNightDone = true;
    if (nafilaId === 'witr') logKey.witrDone = true;
    if (nafilaId === 'tawbah') logKey.tawbahDone = true;

    await upsertDailyLog(bioDate, {
      ...logKey,
      pointsEarned: (todayLog?.pointsEarned || 0) + points,
    });
    if (userState) {
      await db.user_state.update('current_user', {
        totalPoints: (userState.totalPoints || 0) + points,
      });
    }
    onRewardToast?.(`تقبل الله منك! تم تسجيل ${title} (+${points}ن) بنجاح.`);
  };

  const handleCopyText = (text: string, id: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onRewardToast?.(isAr ? 'تم نسخ النص النبوي الشريف بنجاح 📋' : 'Copied to clipboard 📋');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const prayers = todayLog?.prayers || {};

  const handleOpenPrayerModal = (prayerName: PrayerName) => {
    setSelectedPrayerAction(prayerName);
    const existing = prayers[prayerName];
    setModalStatus(
      existing?.status && existing.status !== 'pending' && existing.status !== 'missed'
        ? existing.status
        : 'in_group'
    );
    setSunnahQabliyah(
      existing?.sunnahQabliyahRakats ??
        (prayerName === 'fajr' ? 2 : prayerName === 'dhuhr' ? 4 : prayerName === 'asr' ? 4 : 0)
    );
    setSunnahBadiyah(
      existing?.sunnahBadiyahRakats ??
        (prayerName === 'dhuhr' ? 2 : prayerName === 'maghrib' ? 2 : prayerName === 'isha' ? 2 : 0)
    );
    setWitrDone(Boolean(existing?.witrRakats));
  };

  useEffect(() => {
    if (externalTriggerPrayer?.prayer) {
      setSanctuaryTab('meeqat');
      handleOpenPrayerModal(externalTriggerPrayer.prayer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalTriggerPrayer?.nonce]);

  const prayerCards: Array<{
    name: PrayerName;
    title: string;
    timeDate: Date;
    isFajr?: boolean;
    isJumuah?: boolean;
  }> = [
    { name: 'fajr', title: isAr ? 'الفجر' : 'Fajr', timeDate: prayerTimes.fajr, isFajr: true },
    {
      name: 'dhuhr',
      title: prayerTimes.isFriday ? (isAr ? 'الجمعة' : "Jumu'ah") : (isAr ? 'الظهر' : 'Dhuhr'),
      timeDate: prayerTimes.dhuhr,
      isJumuah: prayerTimes.isFriday,
    },
    { name: 'asr', title: isAr ? 'العصر' : 'Asr', timeDate: prayerTimes.asr },
    { name: 'maghrib', title: isAr ? 'المغرب' : 'Maghrib', timeDate: prayerTimes.maghrib },
    { name: 'isha', title: isAr ? 'العشاء' : 'Isha', timeDate: prayerTimes.isha },
  ];

  const completedPrayersCount = (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerName[]).filter((pn) => {
    const rec = prayers[pn];
    return rec && (rec.status === 'on_time' || rec.status === 'in_group' || rec.status === 'late' || rec.status === 'excused');
  }).length;

  // Calculate confirmed 12 Sunnah Rawatib Rak'ahs completed today
  const totalSunnahRakatsCompleted = (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerName[]).reduce((acc, pn) => {
    const rec = prayers[pn];
    if (!rec) return acc;
    return acc + (rec.sunnahQabliyahRakats || 0) + (rec.sunnahBadiyahRakats || 0);
  }, 0);

  const hoursRemaining = Math.floor(nextPrayer.minutesRemaining / 60);
  const minsRemaining = nextPrayer.minutesRemaining % 60;

  const heroTheme = CELESTIAL_THEMES[nextPrayer.name as PrayerName] || CELESTIAL_THEMES.fajr;
  const nextPrayerRecord = prayers[nextPrayer.name as PrayerName];
  const isNextPrayerDone = Boolean(
    nextPrayerRecord &&
      (nextPrayerRecord.status === 'on_time' ||
        nextPrayerRecord.status === 'in_group' ||
        nextPrayerRecord.status === 'late')
  );

  return (
    <div
      id="section-prayers"
      className={`rounded-[30px] surface-card-3d border border-zinc-200/80 dark:border-white/10 shadow-[0_10px_34px_rgba(0,0,0,0.05)] dark:shadow-black/30 p-4 sm:p-5 space-y-3.5 transition-all ${className}`}
    >
      {/* ============================================================ */}
      {/* 1. HABITLINE OBSIDIAN NEXT-PRAYER HERO BANNER + CONTROLS     */}
      {/* ============================================================ */}
      <div className="rounded-[24px] bg-[#141517] text-white p-3.5 sm:p-4 border border-white/10 shadow-md flex flex-wrap items-center justify-between gap-2.5">
        {/* Start (RTL Right): Clickable Next Prayer Live Countdown */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            if (nextPrayer.name === 'sunrise') {
              setNawafilModalTab('dhuha');
              setIsNawafilModalOpen(true);
            } else {
              handleOpenPrayerModal(nextPrayer.name as PrayerName);
            }
          }}
          className="min-w-0 flex items-center gap-3 text-start cursor-pointer active:scale-[0.98] transition-transform"
          title={isAr ? 'اضغط لتوثيق الصلاة القادمة والسنن الرواتب' : 'Tap to log next prayer & Sunnah'}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1eb814] to-emerald-700 text-white flex items-center justify-center text-lg shrink-0 shadow-sm ring-2 ring-white/15">
            <span>{heroTheme.celestialIcon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                {isAr ? `القادمة: ${nextPrayer.arabicName}` : `Next: ${nextPrayer.arabicName}`}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-habit-flame-ink text-white font-mono text-[10px] font-bold shrink-0 shadow-2xs">
                {hoursRemaining > 0
                  ? isAr
                    ? `بعد ${hoursRemaining}س ${minsRemaining}د`
                    : `in ${hoursRemaining}h ${minsRemaining}m`
                  : isAr
                  ? `بعد ${minsRemaining}د`
                  : `in ${minsRemaining}m`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-300 mt-0.5">
              <span className="font-mono font-bold text-emerald-300">
                <bdi dir="ltr">{nextPrayer.formattedTime}</bdi>
              </span>
              <span>•</span>
              <span className="truncate">
                {isNextPrayerDone
                  ? isAr
                    ? 'تم التوثيق ✓'
                    : 'Logged ✓'
                  : isAr
                  ? 'اضغط للتسجيل السريع'
                  : 'Tap to log'}
              </span>
            </div>
          </div>
        </button>

        {/* End (RTL Left): City Picker Pill + Audio Bell + Extras Toggle */}
        <div className="flex items-center gap-1.5 shrink-0 ms-auto sm:ms-0">
          {/* City Switcher Pill */}
          <div className="relative shrink-0" ref={cityPickerRef}>
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                if (onOpenLocationModal) {
                  onOpenLocationModal();
                } else {
                  setIsCityPickerOpen(!isCityPickerOpen);
                }
              }}
              className="h-8 px-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              title={isAr ? 'تغيير المدينة أو ضبط إحداثيات GPS' : 'Change City'}
            >
              <MapPin className="w-3 h-3 text-[#22c55e] shrink-0" />
              <span className="max-w-[72px] sm:max-w-none truncate">
                {(() => {
                  const raw = loc?.city
                    ? PRESET_CITIES.find((c) => c.id === loc.city)?.nameAr || loc.city
                    : activeCity.nameAr;
                  return raw.replace('العربية المتحدة', '').trim();
                })()}
              </span>
              {isOnlineLive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" title={isAr ? 'مواقيت رسمية' : 'Live'} />
              )}
            </button>

            {/* City Switcher Dropdown */}
            {isCityPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-2xs cursor-pointer pointer-events-auto"
                  onClick={() => setIsCityPickerOpen(false)}
                />
                <div className="absolute top-full mt-2 end-0 z-50 w-64 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl p-2 space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={handleUseGps}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold hover:bg-emerald-100 cursor-pointer text-start"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? 'استخدام موقعي عبر GPS 📍' : 'Use Current GPS'}</span>
                  </button>
                  <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />
                  {PRESET_CITIES.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelectCity(city.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-start cursor-pointer ${
                        selectedCityId === city.id
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>{isAr ? city.nameAr : city.nameEn}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Adhan Audio Settings Quick Button */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setSanctuaryTab('meeqat');
              setIsExtrasExpanded(true);
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-amber-300 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            title={isAr ? 'إعدادات صوت الأذان والتنبيهات' : 'Adhan Audio Settings'}
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Extras Drawer Toggle Pill (Nawafil, Qiyam, Qadaa, Tasbih) */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsExtrasExpanded(!isExtrasExpanded);
            }}
            className={`h-8 px-2.5 rounded-full border text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all ${
              isExtrasExpanded
                ? 'bg-habit-green-ink text-white border-[#1eb814] shadow-2xs'
                : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
            }`}
            title={isAr ? 'النوافل، قيام الليل، القضاء، والأذكار' : 'Sunnah, Night Vigil & Dhikr'}
          >
            <span>📿</span>
            <span>{isAr ? 'السنن' : 'Sunnah'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isExtrasExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1.5 ARCHITECTURAL 12-RAK'AH SUNNAH RAWATIB & FARD PROGRESS   */}
      {/* Grouped by Prayer (2 Fajr • 4+2 Dhuhr • 2 Maghrib • 2 Isha)  */}
      {/* ============================================================ */}
      <button
        type="button"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          setNawafilModalTab('rawatib');
          setIsNawafilModalOpen(true);
        }}
        className="w-full rounded-[22px] bg-gradient-to-r from-emerald-950/[0.05] via-amber-500/[0.07] to-emerald-950/[0.05] dark:from-zinc-900/95 dark:via-emerald-950/35 dark:to-zinc-900/95 hover:from-emerald-500/12 hover:to-amber-500/12 border border-emerald-600/25 dark:border-emerald-500/30 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer active:scale-[0.99] transition-all text-start shadow-2xs"
      >
        <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/25 to-emerald-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2c-4 3.5-7 7.5-7 11.5V21h14v-7.5C19 9.5 16 5.5 12 2Z" />
                <path d="M9 21v-5a3 3 0 0 1 6 0v5" />
              </svg>
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] sm:text-xs font-bold text-zinc-900 dark:text-white truncate">
                {isAr
                  ? 'قصر في الجنة • ١٢ ركعة سنة راتبة مؤكدة'
                  : 'Palace in Jannah • 12 Sunnah Rawatib'}
              </span>
              <span className="block text-[10px] text-zinc-600 dark:text-zinc-400 truncate">
                {isAr ? '٢ الفجر • ٤+٢ الظهر • ٢ المغرب • ٢ العشاء' : '2 Fajr • 4+2 Dhuhr • 2 Maghrib • 2 Isha'}
              </span>
            </div>
          </div>

          <span className="sm:hidden text-[10px] font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shrink-0">
            {isAr ? `${completedPrayersCount}/5 فرائض` : `${completedPrayersCount}/5 Fard`}
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
          {/* 12 Archway Dome Jewels for 12 Rak'ahs (Grouped 2 | 6 | 2 | 2) */}
          <div
            className="flex items-center gap-1 flex-1 sm:flex-initial"
            title={isAr ? `${totalSunnahRakatsCompleted} من 12 ركعة سنة راتبة` : `${totalSunnahRakatsCompleted}/12 Rak'ahs`}
          >
            {Array.from({ length: 12 }).map((_, idx) => {
              const isFilled = idx < totalSunnahRakatsCompleted;
              const isGroupDivider = idx === 1 || idx === 7 || idx === 9;
              return (
                <React.Fragment key={idx}>
                  <span
                    className={`h-3 flex-1 sm:w-2.5 sm:flex-initial rounded-t-full rounded-b-xs transition-all duration-300 ${
                      isFilled
                        ? 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-amber-300 shadow-[0_0_8px_rgba(16,185,129,0.55)] scale-y-110'
                        : 'bg-zinc-300/85 dark:bg-zinc-700/75'
                    }`}
                  />
                  {isGroupDivider && (
                    <span className="w-0.5 h-2 rounded-full bg-amber-500/40 dark:bg-amber-400/30 shrink-0 mx-0.5" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
            <bdi dir="ltr">{totalSunnahRakatsCompleted}/12</bdi>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shrink-0">
            <span>{isAr ? `${completedPrayersCount}/5 فرائض` : `${completedPrayersCount}/5 Fard`}</span>
          </span>
        </div>
      </button>

      {/* ============================================================ */}
      {/* 2. CELESTIAL MIHRAB HOROLOGY GALLERY (5 ARCHWAY PORTALS)     */}
      {/* Rich Circadian Sky Canvases + Sculpted Mihrab + Jewel Seal   */}
      {/* ============================================================ */}
      <div className="relative py-1">
        {/* Continuous Celestial Solar-Lunar Horizon Thread connecting all 5 Mihrab Portals */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[54%] inset-x-3 -translate-y-1/2 h-[3px] rounded-full bg-gradient-to-r from-indigo-500/40 via-amber-400/60 via-orange-500/50 via-rose-500/55 to-purple-600/45 z-0 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
        />

        <div className="relative z-10 grid grid-cols-5 gap-1.5 sm:gap-2.5">
          {prayerCards.map((p) => {
            const record = prayers[p.name];
            const isDone = Boolean(
              record &&
                (record.status === 'on_time' ||
                  record.status === 'in_group' ||
                  record.status === 'late' ||
                  record.status === 'excused')
            );
            const isJumuah = p.isJumuah;
            const isNext =
              nextPrayer.arabicName === p.title || (isJumuah && nextPrayer.arabicName.includes('الجمعة'));

            const timeFormatted = formatPrayerTime(p.timeDate, isAr);
            const timeParts = timeFormatted.split(' ');
            const timeDigits = timeParts[0] || timeFormatted;

            const sunnahLogged =
              (record?.sunnahQabliyahRakats || 0) + (record?.sunnahBadiyahRakats || 0);

            // Compact, zero-truncation bottom label
            const statusMicroLabel = isDone
              ? record?.status === 'in_group'
                ? isAr
                  ? 'جماعة ★'
                  : 'Group ★'
                : record?.status === 'on_time'
                ? isAr
                  ? 'في الوقت ✓'
                  : 'On time ✓'
                : isAr
                ? 'تمت ✓'
                : 'Done ✓'
              : p.name === 'fajr'
              ? isAr
                ? '٢ سنة'
                : '2 Sunnah'
              : p.name === 'dhuhr'
              ? isAr
                ? '٦ سنن'
                : '6 Sunnah'
              : p.name === 'asr'
              ? isAr
                ? '٤ سنن'
                : '4 Sunnah'
              : p.name === 'maghrib'
              ? isAr
                ? '٢ سنة'
                : '2 Sunnah'
              : isAr
              ? '٢ + وتر'
              : '2 + Witr';

            // Rich Atmospheric Circadian Sky Palette per prayer (No more sterile white/gray rectangles!)
            const circadianPendingSurface =
              p.name === 'fajr'
                ? 'bg-gradient-to-b from-[#e0e7ff] via-[#fce7f3]/80 to-[#f5f3ff] dark:from-[#171c3a] dark:via-[#291736] dark:to-[#121320] border-indigo-300/90 dark:border-indigo-500/35'
                : p.name === 'dhuhr'
                ? 'bg-gradient-to-b from-[#fef3c7] via-[#e0f2fe]/75 to-[#fffbeb] dark:from-[#2e2210] dark:via-[#152636] dark:to-[#14161d] border-amber-300/90 dark:border-amber-500/35'
                : p.name === 'asr'
                ? 'bg-gradient-to-b from-[#ffedd5] via-[#fef3c7]/80 to-[#fff7ed] dark:from-[#331b11] dark:via-[#271b11] dark:to-[#151418] border-orange-300/90 dark:border-orange-500/35'
                : p.name === 'maghrib'
                ? 'bg-gradient-to-b from-[#ffe4e6] via-[#f3e8ff]/80 to-[#fff1f2] dark:from-[#341328] dark:via-[#231433] dark:to-[#13131f] border-rose-300/90 dark:border-rose-500/35'
                : 'bg-gradient-to-b from-[#e0e7ff] via-[#ede9fe]/85 to-[#f1f5f9] dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#111322] border-indigo-300/90 dark:border-indigo-500/35';

            const circadianNextHeroSurface =
              p.name === 'fajr'
                ? 'bg-gradient-to-b from-[#0f172a] via-[#261a47] to-[#3b1238] border-amber-300/80 ring-2 ring-indigo-400/50 shadow-[0_14px_30px_-6px_rgba(99,102,241,0.55)]'
                : p.name === 'dhuhr'
                ? 'bg-gradient-to-b from-[#1c1917] via-[#362610] to-[#122229] border-amber-300/85 ring-2 ring-amber-400/55 shadow-[0_14px_30px_-6px_rgba(245,158,11,0.5)]'
                : p.name === 'asr'
                ? 'bg-gradient-to-b from-[#23140e] via-[#3d1e10] to-[#1b1412] border-amber-300/85 ring-2 ring-orange-400/55 shadow-[0_14px_30px_-6px_rgba(249,115,22,0.5)]'
                : p.name === 'maghrib'
                ? 'bg-gradient-to-b from-[#1a0f26] via-[#3d1431] to-[#131c24] border-amber-300/85 ring-2 ring-rose-400/55 shadow-[0_14px_30px_-6px_rgba(244,63,94,0.5)]'
                : 'bg-gradient-to-b from-[#090d18] via-[#17203d] to-[#231942] border-amber-300/80 ring-2 ring-indigo-400/55 shadow-[0_14px_30px_-6px_rgba(129,140,248,0.55)]';

            const celestialIconAccent = isDone
              ? 'text-emerald-700 dark:text-emerald-300'
              : isNext
              ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.75)]'
              : p.name === 'fajr'
              ? 'text-indigo-700 dark:text-indigo-300'
              : p.name === 'dhuhr'
              ? 'text-amber-700 dark:text-amber-300'
              : p.name === 'asr'
              ? 'text-orange-700 dark:text-orange-300'
              : p.name === 'maghrib'
              ? 'text-rose-700 dark:text-rose-300'
              : 'text-indigo-700 dark:text-indigo-300';

            const sealPendingStyle =
              p.name === 'fajr'
                ? 'bg-gradient-to-br from-indigo-500/20 to-rose-500/20 border-indigo-400/60 dark:border-indigo-400/45 text-indigo-800 dark:text-indigo-200'
                : p.name === 'dhuhr'
                ? 'bg-gradient-to-br from-amber-500/25 to-sky-500/15 border-amber-400/70 dark:border-amber-400/45 text-amber-900 dark:text-amber-200'
                : p.name === 'asr'
                ? 'bg-gradient-to-br from-orange-500/25 to-amber-500/20 border-orange-400/70 dark:border-orange-400/45 text-orange-900 dark:text-orange-200'
                : p.name === 'maghrib'
                ? 'bg-gradient-to-br from-rose-500/25 to-purple-500/20 border-rose-400/70 dark:border-rose-400/45 text-rose-900 dark:text-rose-200'
                : 'bg-gradient-to-br from-indigo-500/25 to-purple-500/25 border-indigo-400/65 dark:border-indigo-400/45 text-indigo-900 dark:text-indigo-200';

            // Bespoke Celestial SVG Icon per prayer
            const renderCelestialSvg = () => {
              const iconClass = `w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-300 group-hover:scale-110 ${celestialIconAccent}`;
              if (p.name === 'fajr') {
                return (
                  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4" />
                    <path d="m4.93 10.93 1.41 1.41" />
                    <path d="M2 18h2" />
                    <path d="M20 18h2" />
                    <path d="m19.07 10.93-1.41 1.41" />
                    <path d="M22 22H2" />
                    <path d="M8 18a4 4 0 0 1 8 0" />
                  </svg>
                );
              }
              if (p.name === 'dhuhr') {
                return (
                  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                );
              }
              if (p.name === 'asr') {
                return (
                  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 3v1" />
                    <path d="M12 20v1" />
                    <path d="M3 12h1" />
                    <path d="M20 12h1" />
                    <path d="m18.364 5.636-.707.707" />
                    <path d="m6.343 17.657-.707.707" />
                  </svg>
                );
              }
              if (p.name === 'maghrib') {
                return (
                  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 10V2" />
                    <path d="m4.93 10.93 1.41 1.41" />
                    <path d="M2 18h2" />
                    <path d="M20 18h2" />
                    <path d="m19.07 10.93-1.41 1.41" />
                    <path d="M22 22H2" />
                    <path d="M16 18a4 4 0 0 0-8 0" />
                  </svg>
                );
              }
              return (
                <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              );
            };

            return (
              <div
                key={p.name}
                role="button"
                tabIndex={0}
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  handleOpenPrayerModal(p.name);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenPrayerModal(p.name);
                  }
                }}
                className={`group relative pt-4 pb-2.5 px-1.5 sm:px-2.5 sm:pt-4.5 sm:pb-3 rounded-t-[34px] rounded-b-[20px] border transition-all duration-300 flex flex-col items-center justify-between text-center gap-2 cursor-pointer select-none active:scale-95 overflow-hidden ${
                  isDone
                    ? 'bg-gradient-to-b from-[#bbf7d0] via-[#dcfce7] to-[#f0fdf4] dark:from-emerald-950/95 dark:via-emerald-900/60 dark:to-[#0c1915] border-emerald-500/65 dark:border-emerald-400/55 text-zinc-900 dark:text-emerald-50 shadow-[0_10px_24px_-6px_rgba(16,185,129,0.32)]'
                    : isNext
                    ? `${circadianNextHeroSurface} text-white -translate-y-1`
                    : `${circadianPendingSurface} hover:-translate-y-0.5 hover:shadow-md text-zinc-900 dark:text-zinc-100`
                }`}
                title={
                  isAr
                    ? `${p.title} (${timeFormatted}) — اضغط للسنن والتفاصيل، أو اضغط الختم الأوسط للتوثيق الفوري`
                    : `${p.title} (${timeFormatted}) — Tap card for details or center seal for 1-tap log`
                }
              >
                {/* Sculpted Double-Line Andalusian Ogee Mihrab Archway & Celestial Scenery SVG */}
                <svg
                  className="pointer-events-none absolute inset-0 w-full h-full"
                  viewBox="0 0 100 150"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  {/* Soft Celestial Glow Orb at Mihrab Crown */}
                  <circle
                    cx="50"
                    cy="28"
                    r="24"
                    fill="currentColor"
                    className={
                      isDone
                        ? 'text-emerald-400/20'
                        : isNext
                        ? 'text-amber-400/25'
                        : p.name === 'fajr'
                        ? 'text-rose-400/15'
                        : p.name === 'dhuhr'
                        ? 'text-amber-400/20'
                        : p.name === 'asr'
                        ? 'text-orange-400/20'
                        : p.name === 'maghrib'
                        ? 'text-rose-500/20'
                        : 'text-indigo-400/20'
                    }
                  />

                  {/* Outer Sculpted Pointed Mihrab Arch */}
                  <path
                    d="M 4 148 V 46 C 4 24 25 13 50 3 C 75 13 96 24 96 46 V 148"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    className={
                      isDone
                        ? 'text-emerald-600/45 dark:text-emerald-400/45'
                        : isNext
                        ? 'text-amber-300/65'
                        : 'text-zinc-600/25 dark:text-white/20'
                    }
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Inner Fine Filigree Mihrab Arch */}
                  <path
                    d="M 9 148 V 48 C 9 28 28 18 50 8 C 72 18 91 28 91 48 V 148"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    strokeDasharray="3 2"
                    className={
                      isDone
                        ? 'text-emerald-600/30 dark:text-emerald-300/25'
                        : isNext
                        ? 'text-amber-200/40'
                        : 'text-zinc-500/20 dark:text-white/10'
                    }
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Hanging Mishkat (قنديل المحراب) Chain from Apex */}
                  <line
                    x1="50"
                    y1="3"
                    x2="50"
                    y2="16"
                    stroke="currentColor"
                    strokeWidth="1.1"
                    strokeDasharray="1.5 1.5"
                    className={
                      isNext
                        ? 'text-amber-300/85'
                        : isDone
                        ? 'text-emerald-600/60 dark:text-emerald-400/60'
                        : 'text-zinc-500/35 dark:text-white/25'
                    }
                  />

                  {/* Starlight micro-dots for Fajr, Maghrib, and Isha */}
                  {(p.name === 'fajr' || p.name === 'maghrib' || p.name === 'isha') && (
                    <g
                      fill="currentColor"
                      className={isNext ? 'text-amber-200/70' : 'text-indigo-500/35 dark:text-amber-200/40'}
                    >
                      <circle cx="22" cy="28" r="1" />
                      <circle cx="78" cy="26" r="1.2" />
                      <circle cx="26" cy="46" r="0.8" />
                      <circle cx="75" cy="44" r="0.9" />
                    </g>
                  )}
                </svg>

                {/* Top Golden Crown Badge for Next Prayer (Eliminates bottom text truncation!) */}
                {isNext && !isDone && (
                  <span className="absolute top-0 inset-x-3 py-[1.5px] rounded-b-lg bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 text-zinc-950 text-[8px] sm:text-[9px] font-black tracking-tight shadow-sm">
                    {isAr ? 'القادمة' : 'NEXT'}
                  </span>
                )}

                {/* Top Completed Crown Dot */}
                {isDone && (
                  <span className="absolute top-0 inset-x-5 h-1 rounded-b-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
                )}

                {/* Top Celestial Mishkat Lantern Medallion + Prayer Name */}
                <div className="relative z-10 flex flex-col items-center gap-1 w-full mt-0.5">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shadow-2xs ${
                      isDone
                        ? 'bg-emerald-600/20 dark:bg-emerald-400/20 ring-1 ring-emerald-500/40'
                        : isNext
                        ? 'bg-amber-400/20 ring-1 ring-amber-300/60 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                        : 'bg-white/80 dark:bg-white/10 ring-1 ring-black/5 dark:ring-white/15'
                    }`}
                  >
                    {renderCelestialSvg()}
                  </div>
                  <span
                    className={`text-xs sm:text-[13px] font-bold truncate w-full leading-tight ${
                      isDone
                        ? 'text-emerald-950 dark:text-emerald-50'
                        : isNext
                        ? 'text-white'
                        : 'text-zinc-900 dark:text-white'
                    }`}
                  >
                    {p.title}
                  </span>
                </div>

                {/* Horology Time Pill */}
                <span
                  className={`relative z-10 text-[10px] sm:text-xs font-mono font-bold tabular-nums leading-none px-2 py-1 rounded-lg border ${
                    isDone
                      ? 'text-emerald-950 dark:text-emerald-200 bg-white/75 dark:bg-emerald-950/80 border-emerald-500/35'
                      : isNext
                      ? 'text-amber-200 bg-black/45 border-amber-300/45 shadow-inner'
                      : 'text-zinc-800 dark:text-zinc-200 bg-white/85 dark:bg-zinc-900/80 border-black/10 dark:border-white/15 shadow-2xs'
                  }`}
                >
                  <bdi dir="ltr">{timeDigits}</bdi>
                </span>

                {/* 1-Tap Tactile Jewel Medallion (Sculpted Seal — NEVER an empty white circle!) */}
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    soundSynth.playStreakMilestoneChime();
                    haptic.vibrateSprintCelebration();
                    if (!isDone) {
                      const defaultQabliyah =
                        p.name === 'fajr' ? 2 : p.name === 'dhuhr' ? 4 : 0;
                      const defaultBadiyah =
                        p.name === 'dhuhr'
                          ? 2
                          : p.name === 'maghrib'
                          ? 2
                          : p.name === 'isha'
                          ? 2
                          : 0;
                      await handleMarkPrayer(
                        p.name,
                        'in_group',
                        {
                          sunnahPerformed: defaultQabliyah + defaultBadiyah > 0,
                          qabliyahRakats: defaultQabliyah,
                          badiyahRakats: defaultBadiyah,
                          witrRakats: p.name === 'isha' ? 3 : 0,
                        },
                        e
                      );
                    } else {
                      handleOpenPrayerModal(p.name);
                    }
                  }}
                  className={`relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-90 border ${
                    isDone
                      ? 'bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-[#15803d] text-white border-amber-300/70 shadow-[0_4px_12px_rgba(34,197,94,0.45)] ring-2 ring-emerald-400/40'
                      : isNext
                      ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-emerald-500 hover:from-emerald-400 hover:to-emerald-600 text-zinc-950 border-white/80 shadow-[0_0_18px_rgba(251,191,36,0.55)]'
                      : `${sealPendingStyle} hover:bg-emerald-600 hover:text-white hover:border-emerald-500 shadow-xs`
                  }`}
                  title={
                    isDone
                      ? isAr
                        ? 'تم توثيق الصلاة ✓ (اضغط لتعديل الحالة أو السنن)'
                        : 'Prayer logged ✓ (Tap to edit)'
                      : isAr
                      ? `توثيق فوري لصلاة ${p.title} في جماعة مع السنن (+30 XP)`
                      : `1-Tap log ${p.title} in group (+30 XP)`
                  }
                >
                  {isDone ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isNext ? (
                    <>
                      <span className="absolute -inset-1 rounded-full border border-amber-300/70 animate-ping opacity-50" />
                      <Check className="w-4 h-4 stroke-[3]" />
                    </>
                  ) : (
                    /* Intricate Rub el Hizb 8-Pointed Star + Check Emblem so pending cards look like sculpted medallions */
                    <svg
                      className="w-4 h-4 opacity-85 group-hover:scale-110 transition-transform"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon
                        points="12,2 14.8,8.2 21.5,9.2 16.5,14 17.8,20.8 12,17.5 6.2,20.8 7.5,14 2.5,9.2 9.2,8.2"
                        fill="currentColor"
                        fillOpacity="0.18"
                      />
                      <path d="m9 12 2 2 4-4" strokeWidth="2.4" />
                    </svg>
                  )}
                </button>

                {/* Clean Sunnah / Status Tag (Zero truncation!) */}
                <span
                  className={`relative z-10 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap leading-none border ${
                    isDone
                      ? 'bg-emerald-600/20 text-emerald-950 dark:text-emerald-100 border-emerald-600/35'
                      : isNext
                      ? 'bg-amber-400/20 text-amber-200 border-amber-300/40'
                      : 'bg-white/75 dark:bg-black/35 text-zinc-800 dark:text-zinc-200 border-black/10 dark:border-white/10'
                  }`}
                >
                  {isDone && sunnahLogged > 0
                    ? isAr
                      ? `${statusMicroLabel} +${sunnahLogged}س`
                      : `${statusMicroLabel} +${sunnahLogged}S`
                    : statusMicroLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2.5 ATMOSPHERIC BENTO NAWAFIL & DHIKR QUICK TILES            */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
        {/* Tile 1: Salat Al-Dhuha (Solar Gold Bento) */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            setNawafilModalTab('dhuha');
            setIsNawafilModalOpen(true);
          }}
          className={`px-3 py-2.5 rounded-[18px] border text-xs font-bold flex items-center justify-between gap-2 cursor-pointer active:scale-95 transition-all ${
            todayLog?.dhuhaDone
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/15 dark:from-emerald-950/70 dark:to-emerald-900/40 border-emerald-500/45 text-emerald-950 dark:text-emerald-100'
              : 'bg-gradient-to-br from-amber-500/15 via-orange-500/8 to-amber-50/80 dark:from-amber-950/45 dark:via-zinc-900/80 dark:to-zinc-900 border-amber-400/45 dark:border-amber-500/25 text-amber-950 dark:text-amber-100 hover:brightness-105'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-amber-500/25 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </span>
            <span className="truncate">{isAr ? 'صلاة الضحى' : 'Dhuha Prayer'}</span>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
              todayLog?.dhuhaDone
                ? 'bg-[#1eb814] text-white'
                : 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30'
            }`}
          >
            {todayLog?.dhuhaDone ? '✓' : '+15'}
          </span>
        </button>

        {/* Tile 2: Qiyam Al-Layl (Starlit Indigo Bento) */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            setNawafilModalTab('qiyam');
            setIsNawafilModalOpen(true);
          }}
          className={`px-3 py-2.5 rounded-[18px] border text-xs font-bold flex items-center justify-between gap-2 cursor-pointer active:scale-95 transition-all ${
            todayLog?.qiyamNightDone
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/15 dark:from-emerald-950/70 dark:to-emerald-900/40 border-emerald-500/45 text-emerald-950 dark:text-emerald-100'
              : 'bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-indigo-50/80 dark:from-indigo-950/55 dark:via-zinc-900/80 dark:to-zinc-900 border-indigo-400/45 dark:border-indigo-500/30 text-indigo-950 dark:text-indigo-100 hover:brightness-105'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </span>
            <span className="truncate">{isAr ? 'قيام الليل' : 'Night Vigil'}</span>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
              todayLog?.qiyamNightDone
                ? 'bg-[#1eb814] text-white'
                : 'bg-indigo-500/20 text-indigo-900 dark:text-indigo-200 border border-indigo-500/30'
            }`}
          >
            {todayLog?.qiyamNightDone ? '✓' : '+30'}
          </span>
        </button>

        {/* Tile 3: Post-Prayer Tasbih & Dhikr (Sacred Emerald Bento) */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            if (isExtrasExpanded && sanctuaryTab === 'tasbih') {
              setIsExtrasExpanded(false);
            } else {
              setSanctuaryTab('tasbih');
              setIsExtrasExpanded(true);
            }
          }}
          className={`px-3 py-2.5 rounded-[18px] border text-xs font-bold flex items-center justify-between gap-2 cursor-pointer active:scale-95 transition-all ${
            isExtrasExpanded && sanctuaryTab === 'tasbih'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 border-[#141517] dark:border-white'
              : 'bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-50/80 dark:from-emerald-950/45 dark:via-zinc-900/80 dark:to-zinc-900 border-emerald-400/45 dark:border-emerald-500/25 text-emerald-950 dark:text-emerald-100 hover:brightness-105'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">{isAr ? 'ختام الصلاة' : 'Post-Prayer'}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30 font-mono font-bold shrink-0">
            33×3
          </span>
        </button>

        {/* Tile 4: Qadaa Missed Prayers Log (Rose-Gold Ledger Bento) */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            if (isExtrasExpanded && sanctuaryTab === 'qadaa') {
              setIsExtrasExpanded(false);
            } else {
              setSanctuaryTab('qadaa');
              setIsExtrasExpanded(true);
            }
          }}
          className={`px-3 py-2.5 rounded-[18px] border text-xs font-bold flex items-center justify-between gap-2 cursor-pointer active:scale-95 transition-all ${
            isExtrasExpanded && sanctuaryTab === 'qadaa'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 border-[#141517] dark:border-white'
              : 'bg-gradient-to-br from-rose-500/12 via-amber-500/8 to-rose-50/75 dark:from-rose-950/40 dark:via-zinc-900/80 dark:to-zinc-900 border-rose-300/60 dark:border-rose-500/25 text-rose-950 dark:text-rose-100 hover:brightness-105'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
              <RotateCcw className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">{isAr ? 'سجل القضاء' : 'Qadaa Log'}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-900 dark:text-rose-200 border border-rose-500/25 font-bold shrink-0">
            {isAr ? 'فوائت' : 'Track'}
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 3. ACTIVE ADHAN AUDIO / PRE-PRAYER / JUST LOGGED BANNERS     */}
      {/* ============================================================ */}
      {isAdhanPlaying && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border border-amber-500/40 flex items-center justify-between gap-3 animate-pulse shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <Volume2 className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200 truncate">
                {isAr ? '📢 يُرفع الآن صوت الأذان الشريف' : 'Adhan is currently playing'}
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 truncate">
                {isAr
                  ? `بصوت: ${MUADHIN_OPTIONS.find((m) => m.id === userState?.settings?.prayerAudioSettings?.muadhin)?.nameAr || 'الحرم المكي'}`
                  : 'Call to prayer is live'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStopAdhan}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black shadow-md cursor-pointer transition-all shrink-0"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>{isAr ? 'إيقاف / كتم 🔇' : 'Mute'}</span>
          </button>
        </div>
      )}

      {/* 10-Minute Pre-Prayer Reminder Alert */}
      {(() => {
        const pAudio = userState?.settings?.prayerAudioSettings;
        const preMinutes = pAudio?.prePrayerAlertMinutes ?? 10;
        const isPreDue =
          (pAudio?.prePrayerAlertEnabled ?? true) &&
          nextPrayer.minutesRemaining <= preMinutes &&
          nextPrayer.minutesRemaining > 0;

        if (isPreDue && dismissedAlertPrayer !== nextPrayer.arabicName) {
          return (
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                    {isAr
                      ? `🔔 اقترب موعد صلاة ${nextPrayer.arabicName} (متبقي ${nextPrayer.minutesRemaining}د)`
                      : `Upcoming: ${nextPrayer.arabicName} in ${nextPrayer.minutesRemaining}m`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDismissedAlertPrayer(nextPrayer.arabicName)}
                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 p-1 text-xs font-bold shrink-0 cursor-pointer"
                title="إخفاء التنبيه"
              >
                ✕
              </button>
            </div>
          );
        }
        return null;
      })()}

      {/* Just Logged Celebration Banner */}
      {justLoggedPrayer && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h5 className="text-xs font-black text-emerald-900 dark:text-emerald-200 truncate">
                {isAr ? `تقبل الله صلاة ${justLoggedPrayer.title}!` : `Prayer logged!`}
              </h5>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
                {isAr ? 'هل تود ختام الصلاة بالأذكار والتسبيح النبوي؟' : 'Ready for post-prayer dhikr?'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsExtrasExpanded(true);
                setSanctuaryTab('tasbih');
                setJustLoggedPrayer(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>📿</span>
              <span>{isAr ? 'ابدأ ختام الصلاة' : 'Start Dhikr'}</span>
            </button>
            <button
              type="button"
              onClick={() => setJustLoggedPrayer(null)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-200/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              {isAr ? 'لاحقاً' : 'Later'}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. COLLAPSIBLE SANCTUARY EXTRAS DRAWER (NAWAFIL & DHIKR)     */}
      {/* ============================================================ */}
      {isExtrasExpanded && (
        <div className="space-y-4 pt-3 border-t border-slate-200/70 dark:border-white/[0.08] animate-fade-in">
          {/* Quick Audio & Progress Bar inside Extras */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300">
              <span>{isAr ? 'إنجاز الفرائض اليوم:' : 'Daily Prayers:'}</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                <bdi dir="ltr">{completedPrayersCount}/5</bdi>
              </span>
              <span className="text-[11px] text-slate-400">
                ({Math.round((completedPrayersCount / 5) * 100)}%)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {(() => {
                const fridayStatus = checkIsFridaySalawatWindow(currentTime, loc);
                if (fridayStatus.isWindow) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        if (onOpenSmartTasbih) onOpenSmartTasbih('salawat_ibrahimiyyah');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold cursor-pointer transition-all active:scale-95"
                    >
                      <span>🌸</span>
                      <span>{isAr ? 'الصلاة الإبراهيمية' : 'Salawat'}</span>
                    </button>
                  );
                }
                return null;
              })()}

              {/* Adhan Audio Play / Stop */}
              <button
                type="button"
                onClick={() => {
                  if (isAdhanPlaying) {
                    handleStopAdhan();
                  } else {
                    handlePlayAdhan();
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold cursor-pointer transition-all active:scale-95 ${
                  isAdhanPlaying
                    ? 'bg-amber-500 text-black border-amber-400 animate-pulse font-black'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-zinc-200 dark:border-white/10'
                }`}
              >
                {isAdhanPlaying ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-black shrink-0" />
                    <span>{isAr ? 'كتم 🔇' : 'Mute'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{isAr ? 'سماع الأذان' : 'Adhan'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 5-Pillar Segmented Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setSanctuaryTab('meeqat');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                sanctuaryTab === 'meeqat'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🕌</span>
              <span className="truncate">{isAr ? 'بطاقة الميقات' : 'Meeqat Card'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setSanctuaryTab('qiyam');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                sanctuaryTab === 'qiyam'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-300 dark:ring-indigo-700/50'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-300'
              }`}
            >
              <span>🌌</span>
              <span className="truncate">{isAr ? 'قيام الليل' : 'Night Vigil'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setSanctuaryTab('sunan');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                sanctuaryTab === 'sunan'
                  ? 'bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-300 shadow-sm ring-1 ring-amber-300 dark:ring-amber-700/50'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-300'
              }`}
            >
              <span>🕊️</span>
              <span className="truncate">{isAr ? 'السنن الرواتب (١٢)' : 'Sunan Rawatib'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setSanctuaryTab('qadaa');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                sanctuaryTab === 'qadaa'
                  ? 'bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-300 shadow-sm ring-1 ring-teal-300 dark:ring-teal-700/50'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-300'
              }`}
            >
              <span>⚖️</span>
              <span className="truncate">{isAr ? 'قضاء الفوائت' : 'Qadaa Debt'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setSanctuaryTab('tasbih');
              }}
              className={`col-span-2 sm:col-span-1 py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                sanctuaryTab === 'tasbih'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-300 dark:ring-emerald-700/50'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              <span>📿</span>
              <span className="truncate">{isAr ? 'المسبحة والأذكار' : 'Tasbih & Dhikr'}</span>
            </button>
          </div>

          {/* TAB 1 (Inside Extras): Atmospheric Circadian Hero Stage */}
          {sanctuaryTab === 'meeqat' && (
            <div
              className={`group relative overflow-hidden rounded-3xl p-4 sm:p-5 border transition-all duration-300 shadow-xs ${
                isNextPrayerDone
                  ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:via-[#131b1f] dark:to-teal-950/30 border-emerald-500/30 dark:border-emerald-500/20'
                  : `bg-gradient-to-br ${heroTheme.gradientLight} dark:${heroTheme.gradientDark} ${heroTheme.borderLight} dark:${heroTheme.borderDark}`
              }`}
            >
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="font-serif text-xs sm:text-sm text-slate-700 dark:text-zinc-200 leading-relaxed font-medium">
                    «{heroTheme.virtueAr || (isAr ? 'الصلاة على وقتها أحب الأعمال إلى الله • تهيأ بالسكينة وإسباغ الوضوء' : 'On-time prayer is beloved to Allah')}»
                  </p>
                </div>
                <div className="shrink-0">
                  {nextPrayer.name === 'sunrise' ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        setNawafilModalTab('dhuha');
                        setIsNawafilModalOpen(true);
                      }}
                      className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      ☀️ {isAr ? 'صلاة الضحى والإشراق (+20ن)' : 'Dhuha Prayer (+20 XP)'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        handleOpenPrayerModal(nextPrayer.name as PrayerName);
                      }}
                      className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      🤲 {isNextPrayerDone
                        ? (isAr ? `تعديل تسجيل ${nextPrayer.arabicName}` : `Edit ${nextPrayer.arabicName}`)
                        : (isAr ? `تسجيل صلاة ${nextPrayer.arabicName} (+25ن)` : `Log ${nextPrayer.arabicName}`)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

      {/* ============================================================ */}
      {/* TAB 2: 🌌 QIYAM AL-LAYL SANCTUARY (3 RANKS & LAST THIRD)     */}
      {/* ============================================================ */}
      {sanctuaryTab === 'qiyam' && (
        <div className="space-y-5 animate-fade-in">
          {/* Astronomical Night Intervals & Divine Descent Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-purple-950/60 border border-indigo-500/30 text-white space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl shrink-0">
                  🌌
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-indigo-100 flex items-center gap-2">
                    <span>{isAr ? 'حاسبة الثلث الأخير من الليل وميقات النزول الإلهي' : 'Last Third of Night & Divine Descent'}</span>
                  </h4>
                  <span className="text-[11px] text-indigo-300 block">
                    {isAr ? `محسوب فلكياً لمدينة: ${activeCity.nameAr}` : `Calculated for: ${activeCity.nameEn}`}
                  </span>
                </div>
              </div>

              {nightIntervals.isCurrentlyLastThird ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{isAr ? 'وقت النزول الإلهي قائم الآن!' : 'Last Third Active Now!'}</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold font-mono">
                  {nightIntervals.isCurrentlyNight
                    ? (isAr ? `⏳ يبدأ الثلث الأخير بعد ${Math.floor(nightIntervals.minutesToLastThird / 60)}س و ${nightIntervals.minutesToLastThird % 60}د` : `Starts in ${nightIntervals.minutesToLastThird}m`)
                    : (isAr ? `يبدأ في ليلتكم: ${nightIntervals.formattedLastThird}` : `Starts at ${nightIntervals.formattedLastThird}`)}
                </span>
              )}
            </div>

            {/* Night Timings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-indigo-200 block mb-0.5">نصف الليل الشرعي (نهاية العشاء)</span>
                <strong className="text-sm sm:text-base font-mono font-black text-white">
                  {nightIntervals.formattedMidnight} ⏳
                </strong>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 ring-1 ring-indigo-400/30">
                <span className="text-[10px] text-amber-300 block font-bold mb-0.5">بدء الثلث الأخير (النزول الإلهي)</span>
                <strong className="text-sm sm:text-base font-mono font-black text-amber-300">
                  {nightIntervals.formattedLastThird} 🌟
                </strong>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-indigo-200 block mb-0.5">طلوع الفجر الصادق</span>
                <strong className="text-sm sm:text-base font-mono font-black text-white">
                  {formatPrayerTime(prayerTimes.fajr, isAr)} 🌄
                </strong>
              </div>
            </div>

            {/* Authentic Hadith on Divine Descent */}
            <blockquote className="p-3 rounded-xl bg-black/30 border border-indigo-500/20 text-xs text-indigo-100 font-serif leading-loose">
              عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ، أَنَّ رَسُولَ اللَّهِ ﷺ قَالَ:
              <br />
              «<strong className="text-amber-300">يَنْزِلُ رَبُّنَا تَبَارَكَ وَتَعَالَى كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الآخِرُ</strong>، فَيَقُولُ: <strong className="text-emerald-300">مَنْ يَدْعُونِي فَأَسْتَجِيبَ لَهُ، مَنْ يَسْأَلُنِي فَأُعْطِيَهُ، مَنْ يَسْتَغْفِرُنِي فَأَغْفِرَ لَهُ</strong>»
              <span className="block text-[10px] text-indigo-300 mt-1 font-sans">
                (متفق عليه: صحيح البخاري 1145، وصحيح مسلم 758)
              </span>
            </blockquote>
          </div>

          {/* Central Hadith: 10, 100, 1000 Ayat */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border-2 border-indigo-400/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-black">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>الحديث النبوي الصريح في مراتب قيام الليل بالآيات:</span>
            </div>
            <p className="font-serif text-xs sm:text-sm text-slate-800 dark:text-zinc-100 leading-loose">
              قال رسول الله ﷺ: «<strong className="text-amber-700 dark:text-amber-300">مَنْ قَامَ بِعَشْرِ آيَاتٍ لَمْ يُكْتَبْ مِنَ الْغَافِلِينَ</strong>، وَ<strong className="text-emerald-700 dark:text-emerald-300">مَنْ قَامَ بِمِائَةِ آيَةٍ كُتِبَ مِنَ الْقَانِتِينَ</strong>، وَ<strong className="text-indigo-700 dark:text-indigo-300">مَنْ قَامَ بِأَلْفِ آيَةٍ كُتِبَ مِنَ الْمُقَنْطِرِينَ</strong>» (رواه أبو داود وصححه الألباني).
            </p>
          </div>

          {/* 3 Interactive Ranks Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Rank 1: 10 Ayat */}
            <div className="p-4 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-400/30 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                    ١٠ آيات
                  </span>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">🛡️ نجاة من الغفلة</span>
                </div>
                <h5 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200">
                  «لَمْ يُكْتَبْ مِنَ الْغَافِلِينَ»
                </h5>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                  الحد الأدنى الذي يرفعك من ديوان الغافلين، ركعتان خفيفتان لا تستغرقان سوى دقيقة أو دقيقتين.
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-300/40 text-[11px] space-y-1">
                  <strong className="text-amber-900 dark:text-amber-300 block font-bold">كيف تقرؤها عملياً:</strong>
                  <span>• الفاتحة (٧) + الإخلاص (٤) = ١١ آية ✅</span>
                  <br />
                  <span>• أو الفاتحة + المعوذتين = ١٨ آية ✅</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLogNafilaDirect('qiyam', 'قيام الليل (مرتبة الـ 10 آيات)', 30)}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>🌟</span>
                <span>{todayLog?.qiyamNightDone ? 'سُجّل قيام الليلة ✓' : 'اعتمد ورد الـ 10 آيات (+30ن)'}</span>
              </button>
            </div>

            {/* Rank 2: 100 Ayat */}
            <div className="p-4 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-400/30 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-xs">
                    ١٠٠ آية
                  </span>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">🌿 رتبة القنوت</span>
                </div>
                <h5 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-200">
                  «كُتِبَ مِنَ الْقَانِتِينَ»
                </h5>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                  القانت هو المطيع الخاشع الدائم على العبادة. تستغرق قرابة 8 إلى 12 دقيقة.
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-300/40 text-[11px] space-y-1">
                  <strong className="text-emerald-900 dark:text-emerald-300 block font-bold">كيف تقرؤها عملياً:</strong>
                  <span>• سورة الواقعة (٩٦) + الفاتحة = ١٠٣ آيات ✅</span>
                  <br />
                  <span>• الملك (٣٠) + القلم (٥٢) + الفاتحة + الإخلاص ✅</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLogNafilaDirect('qiyam', 'قيام الليل (مرتبة الـ 100 آية)', 35)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>🌿</span>
                <span>{todayLog?.qiyamNightDone ? 'سُجّل قيام الليلة ✓' : 'اعتمد ورد الـ 100 آية (+35ن)'}</span>
              </button>
            </div>

            {/* Rank 3: 1000 Ayat */}
            <div className="p-4 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-400/30 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-black text-xs">
                    ١٠٠٠ آية
                  </span>
                  <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">👑 قناطير الأجر</span>
                </div>
                <h5 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">
                  «كُتِبَ مِنَ الْمُقَنْطِرِينَ»
                </h5>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                  أصحاب القناطير المقنطرة من النعيم (القنطار خير مما طلعت عليه الشمس). تستغرق 45-60 دقيقة.
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-300/40 text-[11px] space-y-1">
                  <strong className="text-indigo-900 dark:text-indigo-300 block font-bold">كيف تقرؤها عملياً:</strong>
                  <span>• قراءة جزأي (تبارك وعمّ كاملين) = ١٠٠٢ آية مع الفاتحة ✅</span>
                  <br />
                  <span>• يُصلى بها ركعات التهجد في الثلث الأخير ✅</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLogNafilaDirect('qiyam', 'قيام الليل (مرتبة الـ 1000 آية المقنطرين)', 50)}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>👑</span>
                <span>{todayLog?.qiyamNightDone ? 'سُجّل قيام الليلة ✓' : 'اعتمد ورد الـ 1000 آية (+50ن)'}</span>
              </button>
            </div>
          </div>

          {/* Prophet's Grand Tahajjud Dua (Bukhari & Muslim) */}
          <div className="p-4 rounded-3xl bg-slate-900 text-white border border-indigo-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                <span>🤲</span>
                <span>دُعَاءُ التَّهَجُّدِ وَاسْتِفْتَاحِ اللَّيْلِ النَّبَوِيُّ (مُتَّفَقٌ عَلَيْهِ):</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    'اللَّهُمَّ لَكَ الحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الحَمْدُ أَنْتَ قَيِّمُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الحَمْدُ أَنْتَ الحَقُّ، وَوَعْدُكَ الحَقُّ، وَقَوْلُكَ الحَقُّ، وَلِقَاؤُكَ حَقٌّ، وَالجَنَّةُ حَقٌّ، وَالنَّارُ حَقٌّ، وَالنَّبِيُّونَ حَقٌّ، وَمُحَمَّدٌ حَقٌّ، وَالسَّاعَةُ حَقٌّ. اللَّهُمَّ لَكَ أَسْلَمْتُ، وَبِكَ آمَنْتُ، وَعَلَيْكَ تَوَكَّلْتُ، وَإِلَيْكَ أَنَبْتُ، وَبِكَ خَاصَمْتُ، وَإِلَيْكَ حَاكَمْتُ، فَاغْفِرْ لِي مَا قَدَّمْتُ وَمَا أَخَّرْتُ، وَمَا أَسْرَرْتُ وَمَا أَعْلَنْتُ، أَنْتَ المُقَدِّمُ وَأَنْتَ المُؤَخِّرُ، لاَ إِلَهَ إِلَّا أَنْتَ.',
                    'tahajjud_dua'
                  )
                }
                className="p-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedId === 'tahajjud_dua' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'tahajjud_dua' ? 'تم النسخ' : 'نسخ الدعاء'}</span>
              </button>
            </div>

            <p className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs sm:text-sm font-serif leading-loose tracking-wide text-zinc-100">
              «اللَّهُمَّ لَكَ الحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الحَمْدُ أَنْتَ قَيِّمُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الحَمْدُ أَنْتَ الحَقُّ، وَوَعْدُكَ الحَقُّ... اللَّهُمَّ لَكَ أَسْلَمْتُ، وَبِكَ آمَنْتُ، وَعَلَيْكَ تَوَكَّلْتُ، وَإِلَيْكَ أَنَبْتُ، وَبِكَ خَاصَمْتُ، وَإِلَيْكَ حَاكَمْتُ، فَاغْفِرْ لِي مَا قَدَّمْتُ وَمَا أَخَّرْتُ، وَمَا أَسْرَرْتُ وَمَا أَعْلَنْتُ، أَنْتَ المُقَدِّمُ وَأَنْتَ المُؤَخِّرُ، لاَ إِلَهَ إِلَّا أَنْتَ»
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: 🕊️ 12 SUNAN RAWATIB & DAILY VOLUNTARY PRAYERS         */}
      {/* ============================================================ */}
      {sanctuaryTab === 'sunan' && (
        <div className="space-y-5 animate-fade-in">
          {/* Confirmed 12 Sunan Rawatib Tracker ("Built a House in Jannah") */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-yellow-500/10 dark:from-amber-950/30 dark:via-zinc-900/60 dark:to-yellow-950/20 border-2 border-amber-500/30 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                  🏰
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>السنن الرواتب الاثنتا عشرة المؤكدة</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200">
                      {totalSunnahRakatsCompleted}/12 ركعة
                    </span>
                  </h4>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold block">
                    «مَنْ صَلَّى فِي يَوْمٍ وَلَيْلَةٍ ثِنْتَيْ عَشْرَةَ رَكْعَةً بُنِيَ لَهُ بَيْتٌ فِي الْجَنَّةِ» (رواه مسلم)
                  </span>
                </div>
              </div>

              {/* Progress Ring / Percentage */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                  {Math.round((totalSunnahRakatsCompleted / 12) * 100)}% تم أداؤه
                </span>
              </div>
            </div>

            {/* 12 Sunan Distribution Grid with Classical Fiqh Linguistic Terms (100% Interactive) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              {/* Fajr 2 Sunnah */}
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  handleOpenPrayerModal('fajr');
                }}
                className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-800/40 hover:border-indigo-400 space-y-1 text-start cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-indigo-600 dark:text-indigo-400">سُنّة الفجر الاستفتاحية</span>
                  <span className="font-mono text-xs text-amber-600">٢ ركعة ←</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  السنة السابقة قبل فريضة الفجر • اضغط للتوثيق
                </p>
              </button>

              {/* Dhuhr 4+2 Sunnah */}
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  handleOpenPrayerModal('dhuhr');
                }}
                className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-800/40 hover:border-amber-400 space-y-1 text-start cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-amber-600 dark:text-amber-400">سُنّة الظهر الرواتب</span>
                  <span className="font-mono text-xs text-amber-600">٤ + ٢ ركعة ←</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  ٤ سابقة استفتاحية + ٢ لاحقة معقبة • اضغط للتوثيق
                </p>
              </button>

              {/* Maghrib 2 Sunnah */}
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  handleOpenPrayerModal('maghrib');
                }}
                className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-800/40 hover:border-rose-400 space-y-1 text-start cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-rose-600 dark:text-rose-400">سُنّة المغرب المعقبة</span>
                  <span className="font-mono text-xs text-amber-600">٢ ركعة ←</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  السنة اللاحقة المعقبة بعد المغرب • اضغط للتوثيق
                </p>
              </button>

              {/* Isha 2 Sunnah */}
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  handleOpenPrayerModal('isha');
                }}
                className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-800/40 hover:border-purple-400 space-y-1 text-start cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-purple-600 dark:text-purple-400">سُنّة العشاء المعقبة</span>
                  <span className="font-mono text-xs text-amber-600">٢ ركعة ←</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  السنة اللاحقة بعد العشاء والوتر • اضغط للتوثيق
                </p>
              </button>
            </div>
          </div>

          {/* Daily Major Nawafil Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Dhuha */}
            <div className="p-4 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between font-black text-xs">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span>☀️</span>
                    <span>صلاة الضحى (الأوّابين)</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                    +20ن
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                  «يصبح على كل سلامى من أحدكم صدقة... ويجزئ من ذلك ركعتان يركعهما من الضحى» (صدقة عن ٣٦٠ مفصل).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLogNafilaDirect('dhuha', 'صلاة الضحى والإشراق', 20)}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                {todayLog?.dhuhaDone ? '✓ أُديت اليوم' : 'سجّل صلاة الضحى ☀️'}
              </button>
            </div>

            {/* Witr */}
            <div className="p-4 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between font-black text-xs">
                  <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                    <span>🌙</span>
                    <span>الشفع والوتر</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                    +25ن
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                  «اجعلوا آخر صلاتكم بالليل وتراً» (متفق عليه). ركعتا شفع وركعة وتر مع دعاء القنوت.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLogNafilaDirect('witr', 'الشفع والوتر', 25)}
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                {todayLog?.witrDone ? '✓ أُديت اليوم' : 'سجّل الشفع والوتر 🌙'}
              </button>
            </div>

            {/* Tawbah */}
            <div className="p-4 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between font-black text-xs">
                  <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                    <span>🌿</span>
                    <span>صلاة التوبة والإنابة</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
                    +25ن
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                  «ما من عبد يذنب ذنباً فيحسن الطهور ثم يقوم فيصلي ركعتين ثم يستغفر الله إلا غفر الله له» (أبو داود).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLogNafilaDirect('tawbah', 'صلاة التوبة والاستغفار', 25)}
                className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                {todayLog?.tawbahDone ? '✓ أُديت اليوم' : 'سجّل صلاة التوبة 🌿'}
              </button>
            </div>

            {/* Istikharah */}
            <div className="p-4 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between font-black text-xs">
                  <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <span>🧭</span>
                    <span>صلاة الاستخارة والحاجة</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                    +20ن
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                  كان النبي ﷺ يعلم أصحابه الاستخارة في الأمور كلها كما يعلمهم السورة من القرآن (البخاري).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setNawafilModalTab('istikhara');
                  setIsNawafilModalOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                عرض دعاء الاستخارة 🧭
              </button>
            </div>
          </div>

          {/* Full 12 Sunan Encyclopedia Gateway */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setNawafilModalTab('qiyam');
              setIsNawafilModalOpen(true);
            }}
            className="w-full p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-indigo-500/15 hover:from-amber-500/25 hover:to-indigo-500/25 border border-emerald-500/30 text-slate-900 dark:text-white text-xs sm:text-sm font-black cursor-pointer transition-all flex items-center justify-between gap-3 shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl group-hover:scale-110 transition-transform">🕊️</span>
              <span>
                {isAr
                  ? 'موسوعة السنن والنوافل النبوية الكاملة (١٢ صلاة وعبادة مأثورة مع الأدعية والتفاصيل الفقهية)'
                  : 'Full 12 Sunan & Nawafil Encyclopedia'}
              </span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-black group-hover:translate-x-1 transition-transform">
              تصفح الموسوعة ←
            </span>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: ⚖️ QADAA AL-FAWAIT DEBT CLEARANCE TRACKER              */}
      {/* ============================================================ */}
      {sanctuaryTab === 'qadaa' && (
        <QadaaPrayerTracker onRewardToast={onRewardToast} />
      )}

      {/* ============================================================ */}
      {/* TAB 5: 📿 POST-PRAYER DHIKR & INTERACTIVE HAPTIC TASBIH       */}
      {/* ============================================================ */}
      {sanctuaryTab === 'tasbih' && (
        <div className="space-y-5 animate-fade-in">
          {/* Post-Prayer Sequential Protocol Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 dark:from-emerald-950/40 dark:via-zinc-900/60 dark:to-teal-950/30 border border-emerald-500/30 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
                  📿
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {isAr ? 'أذكار ختام الصلاة المكتوبة (المأثور النبوي)' : 'Authentic Post-Prayer Adhkar'}
                  </h4>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold block">
                    «مَنْ سَبَّحَ اللَّهَ فِي دُبُرِ كُلِّ صَلاةٍ ثَلاثاً وَثَلاثِينَ... غُفِرَتْ خَطَايَاهُ وَإِنْ كَانَتْ مِثْلَ زَبَدِ البَحْرِ» (مسلم)
                  </span>
                </div>
              </div>

              {onOpenSmartTasbih && (
                <button
                  type="button"
                  onClick={() => onOpenSmartTasbih('khitam_salah')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  فتح المسبحة الشاملة 📿
                </button>
              )}
            </div>

            {/* In-Place Interactive Haptic Dhikr Clicker */}
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/40 flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                المسبحة اللمسية التفاعلية الفورية:
              </span>

              {/* Phrase Selector Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { label: 'سُبْحَانَ اللَّهِ', target: 33 },
                  { label: 'الْحَمْدُ لِلَّهِ', target: 33 },
                  { label: 'اللَّهُ أَكْبَرُ', target: 33 },
                  { label: 'أَسْتَغْفِرُ اللَّهَ', target: 3 },
                ].map((ph) => (
                  <button
                    key={ph.label}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      setInAppTasbihPhrase(ph.label);
                      setInAppTasbihTarget(ph.target);
                      setInAppTasbihCount(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      inAppTasbihPhrase === ph.label
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                    }`}
                  >
                    {ph.label} ({ph.target})
                  </button>
                ))}
              </div>

              {/* Giant Touch Button */}
              <div className="relative pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = inAppTasbihCount + 1;
                    if (next >= inAppTasbihTarget) {
                      soundSynth.playStreakMilestoneChime();
                      haptic.vibrateSprintCelebration();
                      setInAppTasbihCount(inAppTasbihTarget);
                      onRewardToast?.(`أتممت ورد ${inAppTasbihPhrase} بنجاح! تقبل الله منك.`);
                    } else {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      setInAppTasbihCount(next);
                    }
                  }}
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-600 text-white shadow-xl shadow-emerald-600/30 flex flex-col items-center justify-center cursor-pointer active:scale-90 transition-all select-none border-4 border-white dark:border-zinc-800"
                >
                  <span className="text-3xl sm:text-4xl font-mono font-black tracking-tight">
                    {inAppTasbihCount}
                  </span>
                  <span className="text-[11px] font-bold opacity-80 mt-1">
                    من {inAppTasbihTarget}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setInAppTasbihCount(0);
                  }}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold hover:bg-slate-200 cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>تصفير العداد</span>
                </button>
              </div>
            </div>

            {/* Ayat Al-Kursi Post-Prayer Core */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs text-emerald-900 dark:text-emerald-200">
                  <span>🛡️</span>
                  <span>آيَةُ الْكُرْسِيِّ عَقِيبَ كُلِّ فَرِيضَةٍ:</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ',
                      'ayat_kursi'
                    )
                  }
                  className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'ayat_kursi' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'ayat_kursi' ? 'تم النسخ' : 'نسخ الآية'}</span>
                </button>
              </div>

              <p className="font-serif text-xs sm:text-sm text-slate-800 dark:text-zinc-100 leading-loose p-2.5 rounded-xl bg-slate-50 dark:bg-black/20">
                «اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ»
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                فضلها: «مَنْ قَرَأَ آيَةَ الْكُرْسِيِّ دُبُرَ كُلِّ صَلاةٍ مَكْتُوبَةٍ لَمْ يَمْنَعْهُ مِنْ دُخُولِ الْجَنَّةِ إِلا أَنْ يَمُوتَ» (صحيح الجامع: 6464).
              </span>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. CENTERED POP-UP MODAL FOR PRAYER LOGGING                 */}
      {/* ============================================================ */}
      {selectedPrayerAction && (() => {
        const p = prayerCards.find((c) => c.name === selectedPrayerAction);
        if (!p) return null;
        const record = prayers[p.name];
        const isFajr = p.isFajr;
        const isDhuhr = p.name === 'dhuhr';
        const isAsr = p.name === 'asr';
        const isMaghrib = p.name === 'maghrib';
        const isIsha = p.name === 'isha';
        const isJumuah = p.isJumuah;

        // Calculate total expected reward
        const basePts = modalStatus === 'excused'
          ? 20
          : isFajr
          ? (modalStatus === 'in_group' ? 45 : modalStatus === 'on_time' ? 35 : 10)
          : (modalStatus === 'in_group' ? 30 : modalStatus === 'on_time' ? 20 : 10);
        const totalSunnahRakats = sunnahQabliyah + sunnahBadiyah + (witrDone ? 3 : 0);
        const sunnahBonusPts = totalSunnahRakats >= 4 ? 15 : totalSunnahRakats > 0 ? 10 : 0;
        const totalPts = basePts + sunnahBonusPts;

        const handleSave = () => {
          handleMarkPrayer(p.name, modalStatus, {
            sunnahPerformed: totalSunnahRakats > 0,
            qabliyahRakats: sunnahQabliyah,
            badiyahRakats: sunnahBadiyah,
            witrRakats: witrDone ? 3 : 0,
          });
        };

        return (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setSelectedPrayerAction(null)}
            />

            {/* Centered Pop-up Modal — Unified Hybrid Celestial + 3D Bento */}
            <div
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[94%] sm:w-[460px] max-h-[92vh] overflow-y-auto modal-surface border border-zinc-200/80 dark:border-white/10 rounded-[28px] overflow-hidden animate-scale-in text-xs"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Celestial Obsidian Stage Header */}
              <div className="celestial-obsidian-stage text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-habit-green-ink text-white flex items-center justify-center text-xl shadow-lg shadow-[#1eb814]/25 shrink-0">
                    🤲
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-black text-white">
                        {isAr ? `تسجيل صلاة ${p.title}` : `Log ${p.title}`}
                      </h4>
                      <span className="font-mono text-[11px] font-bold text-[#bce8c2] bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-full tabular-nums">
                        {formatPrayerTime(p.timeDate, isAr)}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-300 font-bold block mt-0.5">
                      {record ? (isAr ? 'تعديل حالة الأداء والسنن الرواتب' : 'Edit status & sunnah') : (isAr ? 'تسجيل فريضة وسنن جديدة' : 'Record prayer & sunnah')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPrayerAction(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                {/* 1. Primary Status Options */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 block">
                    {isAr ? '1. حالة أداء الفريضة:' : '1. Prayer Status:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Mosque / Group */}
                    <button
                      type="button"
                      onClick={() => setModalStatus('in_group')}
                      className={`p-3 rounded-[20px] border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                        modalStatus === 'in_group'
                          ? 'bento-3d-amber ring-2 ring-amber-500/40 font-black shadow-sm'
                          : 'surface-card-3d border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold'
                      }`}
                    >
                      <span className="text-xl">🕌</span>
                      <span className="text-xs leading-tight">{isAr ? 'في المسجد / جماعة' : 'Mosque / Group'}</span>
                      <span className="font-mono text-[10px] font-black text-amber-800 dark:text-amber-300">
                        +{isFajr ? 45 : 30}ن
                      </span>
                    </button>

                    {/* On Time Solo */}
                    <button
                      type="button"
                      onClick={() => setModalStatus('on_time')}
                      className={`p-3 rounded-[20px] border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                        modalStatus === 'on_time'
                          ? 'bento-3d-mint ring-2 ring-[#1eb814]/40 font-black shadow-sm'
                          : 'surface-card-3d border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold'
                      }`}
                    >
                      <span className="text-xl">🏠</span>
                      <span className="text-xs leading-tight">{isAr ? 'في وقتها (منفرداً)' : 'On Time (Solo)'}</span>
                      <span className="font-mono text-[10px] font-black text-[#1eb814] dark:text-emerald-300">
                        +{isFajr ? 35 : 20}ن
                      </span>
                    </button>

                    {/* Late / Qada */}
                    <button
                      type="button"
                      onClick={() => setModalStatus('late')}
                      className={`p-3 rounded-[20px] border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                        modalStatus === 'late'
                          ? 'bento-3d-sky ring-2 ring-sky-500/40 font-black shadow-sm'
                          : 'surface-card-3d border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold'
                      }`}
                    >
                      <span className="text-xl">⏳</span>
                      <span className="text-xs leading-tight">{isAr ? 'قضاءً بعد الوقت' : 'Late / Qada'}</span>
                      <span className="font-mono text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                        +10ن
                      </span>
                    </button>

                    {/* Pillars-Inspired: Excused / Travel (Zero Guilt) */}
                    <button
                      type="button"
                      onClick={() => setModalStatus('excused')}
                      className={`p-3 rounded-[20px] border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                        modalStatus === 'excused'
                          ? 'bento-3d-lavender ring-2 ring-[#5448e8]/40 font-black shadow-sm'
                          : 'surface-card-3d border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold'
                      }`}
                    >
                      <span className="text-xl">🕊️</span>
                      <span className="text-xs leading-tight">{isAr ? 'رخصة / عذر شرعي' : 'Excused / Travel'}</span>
                      <span className="font-mono text-[10px] font-bold text-[#5448e8] dark:text-indigo-300">
                        +20ن 🛡️
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Sunan & Nawafil Attached to This Prayer */}
                <div className="space-y-2 pt-2 border-t border-zinc-200/80 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-zinc-800 dark:text-zinc-200">
                      {isAr ? '2. السنن والرواتب المرتبطة:' : '2. Attached Sunan:'}
                    </label>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#fde6d8] dark:bg-amber-950/60 text-amber-950 dark:text-amber-300 font-bold">
                      {totalSunnahRakats > 0 ? `+${sunnahBonusPts}ن مكافأة سنن` : 'سُنّة نبوية مؤكدة'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Fajr Sunnah */}
                    {isFajr && (
                      <label className="flex items-center justify-between p-3 rounded-[20px] bento-3d-lavender cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={sunnahQabliyah === 2}
                            onChange={(e) => setSunnahQabliyah(e.target.checked ? 2 : 0)}
                            className="w-4 h-4 accent-[#1eb814] rounded"
                          />
                          <div>
                            <span className="font-bold text-xs text-zinc-950 dark:text-indigo-100 block">
                              سُنّة الفجر الاستفتاحية (ركعتان قبل الفريضة)
                            </span>
                            <span className="text-[10px] text-zinc-700 dark:text-zinc-300">
                              «ركعتا الفجر خير من الدنيا وما فيها»
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-[#1eb814] text-xs">+10ن</span>
                      </label>
                    )}

                    {/* Dhuhr Sunan */}
                    {(isDhuhr || isJumuah) && (
                      <>
                        <label className="flex items-center justify-between p-3 rounded-[20px] bento-3d-amber cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={sunnahQabliyah === 4}
                              onChange={(e) => setSunnahQabliyah(e.target.checked ? 4 : 0)}
                              className="w-4 h-4 accent-[#1eb814] rounded"
                            />
                            <div>
                              <span className="font-bold text-xs text-zinc-950 dark:text-amber-100 block">
                                سُنّة الظهر الاستفتاحية (٤ ركعات سابقة)
                              </span>
                              <span className="text-[10px] text-zinc-700 dark:text-zinc-300">
                                سنة الزوال التي تُفتح فيها أبواب السماء
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#1eb814] text-xs">+10ن</span>
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-[20px] bento-3d-amber cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={sunnahBadiyah === 2}
                              onChange={(e) => setSunnahBadiyah(e.target.checked ? 2 : 0)}
                              className="w-4 h-4 accent-[#1eb814] rounded"
                            />
                            <div>
                              <span className="font-bold text-xs text-zinc-950 dark:text-amber-100 block">
                                سُنّة الظهر المعقبة (ركعتان لاحقة بعد الفريضة)
                              </span>
                              <span className="text-[10px] text-zinc-700 dark:text-zinc-300">
                                من السنن الرواتب الـ 12 المؤكدة
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#1eb814] text-xs">+10ن</span>
                        </label>
                      </>
                    )}

                    {/* Asr Sunnah */}
                    {isAsr && (
                      <label className="flex items-center justify-between p-3 rounded-[20px] bento-3d-amber cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={sunnahQabliyah === 4}
                            onChange={(e) => setSunnahQabliyah(e.target.checked ? 4 : 0)}
                            className="w-4 h-4 accent-[#1eb814] rounded"
                          />
                          <div>
                            <span className="font-bold text-xs text-zinc-950 dark:text-amber-100 block">
                              السنة السابقة المستحبة لصلاة العصر (٤ ركعات)
                            </span>
                            <span className="text-[10px] text-zinc-700 dark:text-zinc-300">
                              «رَحِمَ اللَّهُ امْرَأً صَلَّى قَبْلَ الْعَصْرِ أَرْبَعاً»
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-[#1eb814] text-xs">+10ن</span>
                      </label>
                    )}

                    {/* Maghrib Sunnah */}
                    {isMaghrib && (
                      <label className="flex items-center justify-between p-3 rounded-[20px] bento-3d-rose cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={sunnahBadiyah === 2}
                            onChange={(e) => setSunnahBadiyah(e.target.checked ? 2 : 0)}
                            className="w-4 h-4 accent-[#1eb814] rounded"
                          />
                          <div>
                            <span className="font-bold text-xs text-zinc-950 dark:text-rose-100 block">
                              سُنّة المغرب المعقبة (ركعتان لاحقة بعد الفريضة)
                            </span>
                            <span className="text-[10px] text-zinc-700 dark:text-zinc-300">
                              من السنن الرواتب الـ 12 المؤكدة
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-[#1eb814] text-xs">+10ن</span>
                      </label>
                    )}

                    {/* Isha Sunnah & Witr */}
                    {isIsha && (
                      <>
                        <label className="flex items-center justify-between p-3 rounded-[20px] bento-3d-lavender cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={sunnahBadiyah === 2}
                              onChange={(e) => setSunnahBadiyah(e.target.checked ? 2 : 0)}
                              className="w-4 h-4 accent-[#1eb814] rounded"
                            />
                            <div>
                              <span className="font-bold text-xs text-zinc-950 dark:text-indigo-100 block">
                                سُنّة العشاء المعقبة (ركعتان لاحقة بعد الفريضة)
                              </span>
                              <span className="text-[10px] text-zinc-700 dark:text-zinc-300">
                                من السنن الرواتب الـ 12 المؤكدة
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#1eb814] text-xs">+10ن</span>
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-[20px] bento-3d-lavender cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={witrDone}
                              onChange={(e) => setWitrDone(e.target.checked)}
                              className="w-4 h-4 accent-[#1eb814] rounded"
                            />
                            <div>
                              <span className="font-bold text-xs text-zinc-950 dark:text-indigo-100 block">
                                صلاة الشفع والوتر (٣ ركعات)
                              </span>
                              <span className="text-[10px] text-zinc-700 dark:text-zinc-300">
                                «اجعلوا آخر صلاتكم بالليل وتراً»
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#1eb814] text-xs">+15ن</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Total Points Footer and Submit */}
                <div className="pt-3 border-t border-zinc-200/80 dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    <span>المكافأة:</span>
                    <span className="px-2.5 py-1 rounded-full bg-[#bce8c2] text-zinc-950 font-mono font-black text-xs tabular-nums">
                      +{totalPts} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPrayerAction(null)}
                      className="px-4 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 text-xs font-bold cursor-pointer transition-colors"
                    >
                      إلغاء
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-5 py-2.5 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white text-xs font-black shadow-md shadow-[#1eb814]/25 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <span>✓</span>
                      <span>حفظ الصلاة والسنن</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

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
