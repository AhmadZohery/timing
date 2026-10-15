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
  className?: string;
}

export const PrayerTimesBar: React.FC<PrayerTimesBarProps> = ({
  todayLog,
  userState,
  onRewardToast,
  onOpenLocationModal,
  onOpenSmartTasbih,
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
      className={`rounded-[30px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 shadow-[0_10px_34px_rgba(0,0,0,0.05)] dark:shadow-black/30 p-4 sm:p-5 space-y-3.5 transition-all ${className}`}
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
              <span className="px-2 py-0.5 rounded-full bg-[#ff5500] text-white font-mono text-[10px] font-bold shrink-0 shadow-2xs">
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
                ? 'bg-[#1eb814] text-white border-[#1eb814] shadow-2xs'
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
      {/* 1.5 CLICKABLE 12-RAK'AH SUNNAH RAWATIB ("HOUSE IN JANNAH")   */}
      {/* ============================================================ */}
      <button
        type="button"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          setNawafilModalTab('rawatib');
          setIsNawafilModalOpen(true);
        }}
        className="w-full rounded-[20px] bg-gradient-to-r from-[#e2defc]/85 via-[#d4f5dc]/85 to-[#fde6d8]/85 dark:from-indigo-950/50 dark:via-emerald-950/50 dark:to-amber-950/50 border border-indigo-200/70 dark:border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all text-start"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0">🕌</span>
          <span className="text-[11px] sm:text-xs font-bold text-zinc-900 dark:text-white truncate">
            {isAr
              ? `بيت في الجنة (السنن الرواتب): ${totalSunnahRakatsCompleted}/12 ركعة`
              : `12 Sunnah Rawatib: ${totalSunnahRakatsCompleted}/12 Rak'ahs`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 sm:w-24 h-2 rounded-full bg-white/80 dark:bg-zinc-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5448e8] to-[#1eb814] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((totalSunnahRakatsCompleted / 12) * 100))}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-indigo-950 dark:text-indigo-200 bg-white/80 dark:bg-white/10 px-2 py-0.5 rounded-full">
            {isAr ? `${completedPrayersCount}/5 فرائض` : `${completedPrayersCount}/5`}
          </span>
        </div>
      </button>

      {/* ============================================================ */}
      {/* 2. GENIUS 5-COLUMN CIRCADIAN PASTEL PRAYER CARDS             */}
      {/* Tap card = Full Sunnah/Status Modal | Tap check = 1-Tap Log! */}
      {/* ============================================================ */}
      <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
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

          // Motivating Circadian Pastel Identity per Prayer when pending
          const pendingCircadianStyle =
            p.name === 'fajr'
              ? 'bg-[#e0f2fe] dark:bg-sky-950/45 border-sky-300/70 dark:border-sky-500/25 text-sky-950 dark:text-sky-100'
              : p.name === 'dhuhr'
              ? 'bg-[#fef3c7] dark:bg-amber-950/45 border-amber-300/70 dark:border-amber-500/25 text-amber-950 dark:text-amber-100'
              : p.name === 'asr'
              ? 'bg-[#ffedd5] dark:bg-orange-950/45 border-orange-300/70 dark:border-orange-500/25 text-orange-950 dark:text-orange-100'
              : p.name === 'maghrib'
              ? 'bg-[#fce2e6] dark:bg-rose-950/45 border-rose-300/70 dark:border-rose-500/25 text-rose-950 dark:text-rose-100'
              : 'bg-[#e2defc] dark:bg-indigo-950/45 border-indigo-300/70 dark:border-indigo-500/25 text-indigo-950 dark:text-indigo-100';

          const prayerEmoji =
            p.name === 'fajr'
              ? '🌅'
              : p.name === 'dhuhr'
              ? '☀️'
              : p.name === 'asr'
              ? '🌤️'
              : p.name === 'maghrib'
              ? '🌇'
              : '🌙';

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
              ? '+٢ سنة'
              : '+2 Sunnah'
            : p.name === 'dhuhr'
            ? isAr
              ? '+٦ سنن'
              : '+6 Sunnah'
            : p.name === 'asr'
            ? isAr
              ? '+٤ سنن'
              : '+4 Sunnah'
            : p.name === 'maghrib'
            ? isAr
              ? '+٢ سنة'
              : '+2 Sunnah'
            : isAr
            ? '+٢ ووتر'
            : '+2 & Witr';

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
              className={`group relative py-3 px-1.5 sm:p-3.5 rounded-[24px] border transition-all duration-200 flex flex-col items-center justify-between text-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                isDone
                  ? 'bg-gradient-to-b from-[#d4f5dc] to-[#bce8c2] dark:from-emerald-950/80 dark:to-emerald-900/60 border-[#1eb814]/50 text-zinc-900 dark:text-emerald-100 shadow-xs'
                  : isNext
                  ? 'bg-[#141517] dark:bg-white border-[#ff5500] text-white dark:text-zinc-950 ring-2 ring-[#ff5500]/60 shadow-lg scale-[1.03]'
                  : `${pendingCircadianStyle} hover:scale-[1.01]`
              }`}
              title={
                isAr
                  ? `${p.title} (${timeFormatted}) — اضغط للتفاصيل والسنن، أو اضغط الدائرة للتسجيل الفوري`
                  : `${p.title} (${timeFormatted}) — Tap card for details or circle for 1-tap log`
              }
            >
              {/* Top Celestial Icon + Prayer Name */}
              <div className="flex flex-col items-center gap-0.5 w-full">
                <span className="text-xs leading-none">{prayerEmoji}</span>
                <span
                  className={`text-xs font-bold truncate w-full leading-tight ${
                    isDone
                      ? 'text-zinc-950 dark:text-emerald-100'
                      : isNext
                      ? 'text-white dark:text-zinc-950'
                      : 'text-zinc-900 dark:text-white'
                  }`}
                >
                  {p.title}
                </span>
              </div>

              {/* Prayer Time (Tabular Mono) */}
              <span
                className={`text-[11px] sm:text-xs font-mono font-bold tabular-nums leading-none ${
                  isDone
                    ? 'text-emerald-950 dark:text-emerald-200'
                    : isNext
                    ? 'text-amber-300 dark:text-amber-600'
                    : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <bdi dir="ltr">{timeDigits}</bdi>
              </span>

              {/* 1-Tap Instant Log Button (Independent Click Action!) */}
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
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-90 ${
                  isDone
                    ? 'bg-[#1eb814] text-white shadow-sm ring-2 ring-white/60 dark:ring-black/30'
                    : isNext
                    ? 'bg-[#ff5500] hover:bg-[#e04800] text-white shadow-md ring-2 ring-white/30'
                    : 'bg-white/90 dark:bg-zinc-900/90 hover:bg-[#1eb814] hover:text-white text-zinc-700 dark:text-zinc-200 border border-black/10 dark:border-white/15 shadow-2xs'
                }`}
                title={
                  isDone
                    ? isAr
                      ? 'تعديل حالة الصلاة والسنن'
                      : 'Edit Prayer & Sunnah'
                    : isAr
                    ? `تسجيل فوري لصلاة ${p.title} في جماعة مع السنن (+30 XP)`
                    : `1-Tap log ${p.title} in group (+30 XP)`
                }
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[2.8]" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[2.5] opacity-75 group-hover:opacity-100" />
                )}
              </button>

              {/* Micro Status / Sunnah Tag */}
              <span
                className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full truncate max-w-full leading-none ${
                  isDone
                    ? 'bg-[#1eb814]/20 text-emerald-950 dark:text-emerald-200'
                    : isNext
                    ? 'bg-white/15 text-amber-200 dark:bg-zinc-200 dark:text-zinc-800'
                    : 'bg-white/65 dark:bg-black/25 text-zinc-700 dark:text-zinc-300'
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

      {/* ============================================================ */}
      {/* 2.5 ALWAYS-VISIBLE 1-TAP NAWAFIL & DHIKR QUICK CHIPS         */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
        {/* Chip 1: Salat Al-Dhuha */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            setNawafilModalTab('dhuha');
            setIsNawafilModalOpen(true);
          }}
          className={`px-3 py-2 rounded-[16px] border text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer active:scale-95 transition-all ${
            todayLog?.dhuhaDone
              ? 'bg-[#bce8c2] dark:bg-emerald-950/70 border-[#1eb814]/50 text-zinc-900 dark:text-emerald-100'
              : 'bg-[#fef3c7]/70 dark:bg-amber-950/30 border-amber-300/60 dark:border-amber-500/20 text-amber-950 dark:text-amber-200 hover:bg-[#fef3c7]'
          }`}
        >
          <span className="truncate">☀️ {isAr ? 'صلاة الضحى' : 'Dhuha Prayer'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-black/30 font-mono shrink-0">
            {todayLog?.dhuhaDone ? '✓' : '+15'}
          </span>
        </button>

        {/* Chip 2: Qiyam Al-Layl */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            setNawafilModalTab('qiyam');
            setIsNawafilModalOpen(true);
          }}
          className={`px-3 py-2 rounded-[16px] border text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer active:scale-95 transition-all ${
            todayLog?.qiyamNightDone
              ? 'bg-[#bce8c2] dark:bg-emerald-950/70 border-[#1eb814]/50 text-zinc-900 dark:text-emerald-100'
              : 'bg-[#e2defc]/75 dark:bg-indigo-950/30 border-indigo-300/60 dark:border-indigo-500/20 text-indigo-950 dark:text-indigo-200 hover:bg-[#e2defc]'
          }`}
        >
          <span className="truncate">🌌 {isAr ? 'قيام الليل' : 'Night Vigil'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-black/30 font-mono shrink-0">
            {todayLog?.qiyamNightDone ? '✓' : '+30'}
          </span>
        </button>

        {/* Chip 3: Post-Prayer Tasbih & Dhikr */}
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
          className={`px-3 py-2 rounded-[16px] border text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer active:scale-95 transition-all ${
            isExtrasExpanded && sanctuaryTab === 'tasbih'
              ? 'bg-[#1eb814] text-white border-[#1eb814]'
              : 'bg-[#d4f5dc]/75 dark:bg-emerald-950/30 border-emerald-300/60 dark:border-emerald-500/20 text-emerald-950 dark:text-emerald-200 hover:bg-[#d4f5dc]'
          }`}
        >
          <span className="truncate">📿 {isAr ? 'ختام الصلاة' : 'Post-Prayer'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-black/30 text-zinc-900 dark:text-white font-mono shrink-0">
            33×3
          </span>
        </button>

        {/* Chip 4: Qadaa Missed Prayers Log */}
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
          className={`px-3 py-2 rounded-[16px] border text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer active:scale-95 transition-all ${
            isExtrasExpanded && sanctuaryTab === 'qadaa'
              ? 'bg-[#141517] text-white border-[#141517]'
              : 'bg-[#fce2e6]/75 dark:bg-rose-950/30 border-rose-300/60 dark:border-rose-500/20 text-rose-950 dark:text-rose-200 hover:bg-[#fce2e6]'
          }`}
        >
          <span className="truncate">🗓️ {isAr ? 'سجل القضاء' : 'Qadaa Log'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-black/30 text-zinc-900 dark:text-white font-mono shrink-0">
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

            {/* Centered Pop-up Modal */}
            <div
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[94%] sm:w-[440px] max-h-[92vh] overflow-y-auto bg-white dark:bg-[#181A24] border border-slate-200 dark:border-white/[0.12] rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 animate-scale-in text-xs"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shadow-inner">
                    🤲
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        {isAr ? `تسجيل صلاة ${p.title}` : `Log ${p.title}`}
                      </h4>
                      <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
                        {formatPrayerTime(p.timeDate, isAr)}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                      {record ? (isAr ? 'تعديل حالة الأداء والسنن' : 'Edit status & sunnah') : (isAr ? 'تسجيل فريضة وسنن جديدة' : 'Record prayer & sunnah')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPrayerAction(null)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* 1. Primary Status Options */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-700 dark:text-zinc-300 block">
                  {isAr ? '1. حالة أداء الفريضة:' : '1. Prayer Status:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Mosque / Group */}
                  <button
                    type="button"
                    onClick={() => setModalStatus('in_group')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                      modalStatus === 'in_group'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/30 font-black shadow-xs'
                        : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-300 font-bold'
                    }`}
                  >
                    <span className="text-xl">🕌</span>
                    <span className="text-xs leading-tight">{isAr ? 'في المسجد / جماعة' : 'Mosque / Group'}</span>
                    <span className="font-mono text-[10px] font-black text-amber-600 dark:text-amber-400">
                      +{isFajr ? 45 : 30}ن
                    </span>
                  </button>

                  {/* On Time Solo */}
                  <button
                    type="button"
                    onClick={() => setModalStatus('on_time')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                      modalStatus === 'on_time'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30 font-black shadow-xs'
                        : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-300 font-bold'
                    }`}
                  >
                    <span className="text-xl">🏠</span>
                    <span className="text-xs leading-tight">{isAr ? 'في وقتها (منفرداً)' : 'On Time (Solo)'}</span>
                    <span className="font-mono text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      +{isFajr ? 35 : 20}ن
                    </span>
                  </button>

                  {/* Late / Qada */}
                  <button
                    type="button"
                    onClick={() => setModalStatus('late')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                      modalStatus === 'late'
                        ? 'bg-slate-300/40 dark:bg-zinc-700/60 border-slate-400 text-slate-900 dark:text-white ring-2 ring-slate-400/30 font-black'
                        : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-300 font-bold'
                    }`}
                  >
                    <span className="text-xl">⏳</span>
                    <span className="text-xs leading-tight">{isAr ? 'قضاءً بعد الوقت' : 'Late / Qada'}</span>
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      +10ن
                    </span>
                  </button>

                  {/* Pillars-Inspired: Excused / Travel (Zero Guilt) */}
                  <button
                    type="button"
                    onClick={() => setModalStatus('excused')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                      modalStatus === 'excused'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-950 dark:text-purple-200 ring-2 ring-purple-500/30 font-black shadow-xs'
                        : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-300 font-bold'
                    }`}
                  >
                    <span className="text-xl">🕊️</span>
                    <span className="text-xs leading-tight">{isAr ? 'رخصة / عذر شرعي' : 'Excused / Travel'}</span>
                    <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      +20ن 🛡️
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Sunan & Nawafil Attached to This Prayer */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-700 dark:text-zinc-300">
                    {isAr ? '2. السنن والرواتب المرتبطة:' : '2. Attached Sunan:'}
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    {totalSunnahRakats > 0 ? `+${sunnahBonusPts}ن مكافأة سنن` : 'سُنّة نبوية مؤكدة'}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Fajr Sunnah */}
                  {isFajr && (
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/40 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sunnahQabliyah === 2}
                          onChange={(e) => setSunnahQabliyah(e.target.checked ? 2 : 0)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <div>
                          <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200 block">
                            سُنّة الفجر الاستفتاحية (ركعتان قبل الفريضة)
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            «ركعتا الفجر خير من الدنيا وما فيها»
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 text-xs">+10ن</span>
                    </label>
                  )}

                  {/* Dhuhr Sunan */}
                  {(isDhuhr || isJumuah) && (
                    <>
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={sunnahQabliyah === 4}
                            onChange={(e) => setSunnahQabliyah(e.target.checked ? 4 : 0)}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <div>
                            <span className="font-bold text-xs text-amber-950 dark:text-amber-200 block">
                              سُنّة الظهر الاستفتاحية (٤ ركعات سابقة)
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              سنة الزوال التي تُفتح فيها أبواب السماء
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 text-xs">+10ن</span>
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={sunnahBadiyah === 2}
                            onChange={(e) => setSunnahBadiyah(e.target.checked ? 2 : 0)}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <div>
                            <span className="font-bold text-xs text-amber-950 dark:text-amber-200 block">
                              سُنّة الظهر المعقبة (ركعتان لاحقة بعد الفريضة)
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              من السنن الرواتب الـ 12 المؤكدة
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 text-xs">+10ن</span>
                      </label>
                    </>
                  )}

                  {/* Asr Sunnah */}
                  {isAsr && (
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-800/40 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sunnahQabliyah === 4}
                          onChange={(e) => setSunnahQabliyah(e.target.checked ? 4 : 0)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <div>
                          <span className="font-bold text-xs text-orange-950 dark:text-orange-200 block">
                            السنة السابقة المستحبة لصلاة العصر (٤ ركعات)
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            «رَحِمَ اللَّهُ امْرَأً صَلَّى قَبْلَ الْعَصْرِ أَرْبَعاً»
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 text-xs">+10ن</span>
                    </label>
                  )}

                  {/* Maghrib Sunnah */}
                  {isMaghrib && (
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sunnahBadiyah === 2}
                          onChange={(e) => setSunnahBadiyah(e.target.checked ? 2 : 0)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <div>
                          <span className="font-bold text-xs text-rose-950 dark:text-rose-200 block">
                            سُنّة المغرب المعقبة (ركعتان لاحقة بعد الفريضة)
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            من السنن الرواتب الـ 12 المؤكدة
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 text-xs">+10ن</span>
                    </label>
                  )}

                  {/* Isha Sunnah & Witr */}
                  {isIsha && (
                    <>
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={sunnahBadiyah === 2}
                            onChange={(e) => setSunnahBadiyah(e.target.checked ? 2 : 0)}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <div>
                            <span className="font-bold text-xs text-purple-950 dark:text-purple-200 block">
                              سُنّة العشاء المعقبة (ركعتان لاحقة بعد الفريضة)
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              من السنن الرواتب الـ 12 المؤكدة
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 text-xs">+10ن</span>
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={witrDone}
                            onChange={(e) => setWitrDone(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <div>
                            <span className="font-bold text-xs text-purple-950 dark:text-purple-200 block">
                              صلاة الشفع والوتر (٣ ركعات)
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              «اجعلوا آخر صلاتكم بالليل وتراً»
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 text-xs">+15ن</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Total Points Footer and Submit */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  <span>المكافأة:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    +{totalPts}ن
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPrayerAction(null)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 text-slate-600 dark:text-zinc-300 text-xs font-bold cursor-pointer transition-colors"
                  >
                    إلغاء
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>حفظ الصلاة والسنن</span>
                  </button>
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
