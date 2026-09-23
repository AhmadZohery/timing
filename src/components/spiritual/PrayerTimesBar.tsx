import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Sparkles,
  MapPin,
  ChevronDown,
  Navigation,
  Volume2,
  VolumeX,
  BellRing,
  Check,
} from 'lucide-react';
import {
  calculatePrayerTimes,
  getNextPrayer,
  formatPrayerTime,
  PRESET_CITIES,
  detectDefaultCityFromTimezone,
  type CalculatedPrayerTimes,
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
import { MUADHIN_OPTIONS } from '../modals/PrayerLocationModal';
import { NawafilGuideModal, type NafilaTab } from './NawafilGuideModal';

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
    badgeAr: 'سنة المغرب ✨',
    badgeEn: 'Sunnah ✨',
    gradientDark: 'from-rose-950/70 via-purple-950/40 to-slate-900/90',
    gradientLight: 'from-rose-50/90 via-white to-purple-50/50',
    borderDark: 'border-rose-500/30 hover:border-rose-400/60',
    borderLight: 'border-rose-200/90 hover:border-rose-300',
    accentText: 'text-rose-600 dark:text-rose-400',
    accentGlow: 'rgba(244,63,94,0.25)',
  },
  isha: {
    celestialIcon: '🌙',
    virtueAr: 'سكينة الليل وركعة الوتر',
    virtueEn: 'Nightfall serenity & Witr prayer',
    badgeAr: 'الوتر 🌙',
    badgeEn: 'Witr 🌙',
    gradientDark: 'from-blue-950/70 via-indigo-950/40 to-slate-950/90',
    gradientLight: 'from-blue-50/90 via-white to-indigo-50/50',
    borderDark: 'border-blue-500/30 hover:border-blue-400/60',
    borderLight: 'border-blue-200/90 hover:border-blue-300',
    accentText: 'text-blue-600 dark:text-blue-400',
    accentGlow: 'rgba(59,130,246,0.25)',
  },
  sunrise: {
    celestialIcon: '🌅',
    virtueAr: 'الشروق وانبلاج الصباح',
    virtueEn: 'Sunrise and dawn emergence',
    badgeAr: 'الشروق',
    badgeEn: 'Sunrise',
    gradientDark: 'from-amber-950/40 via-slate-900/90 to-orange-950/30',
    gradientLight: 'from-amber-50/80 via-white to-orange-50/40',
    borderDark: 'border-amber-500/20',
    borderLight: 'border-amber-200/60',
    accentText: 'text-amber-500',
    accentGlow: 'rgba(245,158,11,0.2)',
  },
  qiyam: {
    celestialIcon: '🌌',
    virtueAr: 'شرف المؤمن وساعة النزول الإلهي',
    virtueEn: 'Night Vigil and divine proximity',
    badgeAr: 'التهجد',
    badgeEn: 'Qiyam',
    gradientDark: 'from-indigo-950/80 via-purple-950/40 to-slate-950/90',
    gradientLight: 'from-indigo-50/90 via-white to-purple-50/50',
    borderDark: 'border-indigo-500/30',
    borderLight: 'border-indigo-200/80',
    accentText: 'text-indigo-400',
    accentGlow: 'rgba(99,102,241,0.25)',
  },
};

interface PrayerTimesBarProps {
  todayLog?: DailyLog;
  userState?: UserState;
  onRewardToast?: (msg: string) => void;
  onOpenLocationModal?: () => void;
  onOpenSmartTasbih?: (mode?: TasbihPresetId) => void;
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

  const loc = userState?.settings?.prayerLocation;
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    if (loc?.city && loc.city !== 'cairo') return loc.city;
    const offset = -new Date().getTimezoneOffset() / 60;
    if (offset === 4) return 'dubai';
    return loc?.city || detectDefaultCityFromTimezone().id;
  });
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [selectedPrayerAction, setSelectedPrayerAction] = useState<PrayerName | null>(null);
  const [modalStatus, setModalStatus] = useState<'in_group' | 'on_time' | 'late'>('in_group');
  const [sunnahQabliyah, setSunnahQabliyah] = useState<number>(0);
  const [sunnahBadiyah, setSunnahBadiyah] = useState<number>(0);
  const [witrDone, setWitrDone] = useState<boolean>(false);
  const [isOnlineLive, setIsOnlineLive] = useState(false);
  const [justLoggedPrayer, setJustLoggedPrayer] = useState<{ name: PrayerName; title: string } | null>(null);

  // Adhan & Pre-Prayer Audio State
  const [activeAdhanAudio, setActiveAdhanAudio] = useState<HTMLAudioElement | null>(null);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);
  const [dismissedAlertPrayer, setDismissedAlertPrayer] = useState<string | null>(null);

  // Nawafil & Sunan Guide Modal State
  const [isNawafilModalOpen, setIsNawafilModalOpen] = useState(false);
  const [nawafilModalTab, setNawafilModalTab] = useState<NafilaTab>('dhuha');

  const handleStopAdhan = () => {
    soundSynth.playTactileClick();
    if (activeAdhanAudio) {
      activeAdhanAudio.pause();
      activeAdhanAudio.currentTime = 0;
    }
    setIsAdhanPlaying(false);
  };

  const handlePlayAdhan = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const pAudio = userState?.settings?.prayerAudioSettings;
    const muadhinKey = pAudio?.muadhin || 'makkah';
    const opt = MUADHIN_OPTIONS.find((m) => m.id === muadhinKey) || MUADHIN_OPTIONS[0];

    if (activeAdhanAudio) {
      activeAdhanAudio.pause();
    }
    const aud = new Audio(opt.audioUrl);
    aud.volume = 0.9;
    aud.play().then(() => {
      setIsAdhanPlaying(true);
      setActiveAdhanAudio(aud);
      onRewardToast?.(isAr ? `📢 يُرفع الأذان الآن بصوت: ${opt.nameAr}` : `Adhan playing: ${opt.nameAr}`);
    }).catch(() => {});
    aud.onended = () => {
      setIsAdhanPlaying(false);
    };
  };

  useEffect(() => {
    return () => {
      if (activeAdhanAudio) {
        activeAdhanAudio.pause();
      }
    };
  }, [activeAdhanAudio]);

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

  // Auto-detect real location & synchronize official online prayer times
  useEffect(() => {
    let isMounted = true;

    const syncLiveTimes = async () => {
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
      }
    };

    syncLiveTimes();

    return () => {
      isMounted = false;
    };
  }, [selectedCityId, loc]);

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
    status: 'on_time' | 'in_group' | 'late',
    sunnahDetails?: PrayerSunnahDetails
  ) => {
    const res = await awardPrayerPoints(prayer, status, prayerTimes.isFriday, sunnahDetails);
    setSelectedPrayerAction(null);
    if (onRewardToast && res.message) {
      onRewardToast(res.message);
    }
    if (status !== 'late' && onOpenSmartTasbih) {
      const pObj = prayerCards.find((c) => c.name === prayer);
      setJustLoggedPrayer({
        name: prayer,
        title: pObj?.title || prayer,
      });
    }
  };

  const prayers = todayLog?.prayers || {};

  const handleOpenPrayerModal = (prayerName: PrayerName) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
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
    return rec && (rec.status === 'on_time' || rec.status === 'in_group' || rec.status === 'late');
  }).length;

  const hoursRemaining = Math.floor(nextPrayer.minutesRemaining / 60);
  const minsRemaining = nextPrayer.minutesRemaining % 60;
  const timeRemainingFormatted = hoursRemaining > 0
    ? isAr
      ? `متبقي ${hoursRemaining} س و ${minsRemaining} د`
      : `${hoursRemaining}h ${minsRemaining}m left`
    : isAr
      ? `متبقي ${minsRemaining} دقيقة`
      : `${minsRemaining}m left`;

  return (
    <div className={`p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-4 ${className}`}>
      {/* Radiant Next Prayer Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-emerald-600/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <Clock className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#12131A] animate-ping" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isAr ? 'الصلاة القادمة' : 'Next Prayer'}
              </span>
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
                <span>🕌</span>
                <span>{nextPrayer.arabicName}</span>
                <span className="font-mono text-[11px] opacity-80">({nextPrayer.formattedTime})</span>
              </span>
              <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                ⏳ {timeRemainingFormatted}
              </span>
              {isOnlineLive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{isAr ? 'مواقيت رسمية' : 'Live'}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-1 font-medium">
              {isAr
                ? `الصلاة على وقتها أحب الأعمال إلى الله • تهيأ بالسكينة وإسباغ الوضوء`
                : `Upcoming prayer: ${nextPrayer.arabicName} in ${timeRemainingFormatted}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-start sm:justify-end mt-1 sm:mt-0">
          {/* Friday Salawat Quick Chip */}
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
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] sm:text-xs font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                  title="موسم ليلة الجمعة ويومها الأغر - الصلاة الإبراهيمية"
                >
                  <span>🌸</span>
                  <span>{isAr ? 'الصلاة الإبراهيمية' : 'Salawat'}</span>
                </button>
              );
            }
            return null;
          })()}

          {/* Smart Haptic Tasbih Trigger Button */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              if (onOpenSmartTasbih) onOpenSmartTasbih('khitam_salah');
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-200 text-[11px] sm:text-xs font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap border border-slate-200/80 dark:border-white/[0.08]"
            title={isAr ? 'المسبحة اللمسية الذكية لختام الصلاة والأذكار' : 'Smart Haptic Tasbih'}
          >
            <span>📿</span>
            <span className="hidden sm:inline">{isAr ? 'مسبحة ختام الصلاة' : 'Smart Tasbih'}</span>
            <span className="sm:hidden">{isAr ? 'المسبحة' : 'Tasbih'}</span>
          </button>

          {/* Nawafil & Sunan Guide Quick Button */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setNawafilModalTab('dhuha');
              setIsNawafilModalOpen(true);
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-indigo-500/15 hover:from-amber-500/25 hover:to-indigo-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] sm:text-xs font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap shadow-2xs"
            title="دليل السنن والنوافل والمأثورات النبوية"
          >
            <span>🕊️</span>
            <span className="hidden sm:inline">{isAr ? 'السنن والنوافل' : 'Nawafil Guide'}</span>
            <span className="sm:hidden">{isAr ? 'السنن' : 'Sunan'}</span>
          </button>

          {/* Adhan Audio Play / Stop Quick Button */}
          <button
            type="button"
            onClick={() => {
              if (isAdhanPlaying) {
                handleStopAdhan();
              } else {
                handlePlayAdhan();
              }
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap ${
              isAdhanPlaying
                ? 'bg-amber-500 text-black border-amber-400 animate-pulse font-black'
                : userState?.settings?.prayerAudioSettings?.adhanEnabled
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-white/[0.08]'
            }`}
            title={
              isAdhanPlaying
                ? 'كتم وإيقاف صوت الأذان 🔇'
                : 'الاستماع لصوت الأذان أو تجربة المؤذن'
            }
          >
            {isAdhanPlaying ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-black shrink-0" />
                <span>{isAr ? 'كتم 🔇' : 'Mute'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden sm:inline">{isAr ? 'صوت الأذان' : 'Adhan'}</span>
                <span className="sm:hidden">{isAr ? 'الأذان' : 'Adhan'}</span>
              </>
            )}
          </button>

          {/* City Switcher Dropdown */}
          <div className="relative shrink-0" ref={cityPickerRef}>
            <button
              type="button"
              onClick={() => {
                if (onOpenLocationModal) {
                  onOpenLocationModal();
                } else {
                  setIsCityPickerOpen(!isCityPickerOpen);
                }
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/[0.08] text-[11px] sm:text-xs font-bold text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="max-w-[70px] sm:max-w-none truncate">
                {loc?.city ? (PRESET_CITIES.find((c) => c.id === loc.city)?.nameAr || loc.city) : activeCity.nameAr}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {isCityPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-2xs cursor-pointer pointer-events-auto"
                  onClick={() => setIsCityPickerOpen(false)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setIsCityPickerOpen(false);
                  }}
                />
                <div className="absolute top-full mt-2 left-0 sm:right-0 z-50 w-64 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl p-2 space-y-1 text-xs">
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
        </div>
      </div>

      {/* 1. Active Adhan Audio Playing Bar */}
      {isAdhanPlaying && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border border-amber-500/40 flex items-center justify-between gap-3 animate-pulse shadow-sm">
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

      {/* 2. 10-Minute Pre-Prayer Reminder Alert */}
      {(() => {
        const pAudio = userState?.settings?.prayerAudioSettings;
        const preMinutes = pAudio?.prePrayerAlertMinutes ?? 10;
        const isPreDue =
          (pAudio?.prePrayerAlertEnabled ?? true) &&
          nextPrayer.minutesRemaining <= preMinutes &&
          nextPrayer.minutesRemaining > 0;

        if (isPreDue && dismissedAlertPrayer !== nextPrayer.arabicName) {
          return (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                    {isAr
                      ? `🔔 اقترب موعد صلاة ${nextPrayer.arabicName} (متبقي ${nextPrayer.minutesRemaining} دقيقة تقريباً)`
                      : `Upcoming: ${nextPrayer.arabicName} in ${nextPrayer.minutesRemaining}m`}
                  </p>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block truncate">
                    {isAr ? 'استعد للوضوء وإجابة النداء والتهيؤ للسكينة' : 'Prepare for prayer'}
                  </span>
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

      {/* Friday Notification Note Banner */}
      {prayerTimes.isFriday && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isAr
              ? '🕌 اليوم جمعة مباركة! إشعار متابعة صلاة الجمعة ينطلق بعد ساعتين من وقت الأذان.'
              : "Blessed Friday! Jumu'ah reminder is scheduled 2 hours after Adhan."}
          </span>
        </div>
      )}

      {/* Smart Khitam Al-Salah Slide-Up Prompt */}
      {justLoggedPrayer && onOpenSmartTasbih && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-amber-500/10 to-emerald-500/15 border border-emerald-500/30 dark:border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📿</span>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {isAr
                  ? `تقبّل الله صلاتك (${justLoggedPrayer.title})! هل تود ختام الصلاة الآن؟`
                  : `May Allah accept your prayer (${justLoggedPrayer.title})! Start Khitam Al-Salah?`}
              </div>
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                {isAr
                  ? 'سبّح ٣٣، واحمد ٣٣، وكبّر ٣٣ بالمسبحة اللمسية الذكية'
                  : 'SubhanAllah (33), Alhamdulillah (33), Allahu Akbar (33) with Smart Haptic Tasbih'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                onOpenSmartTasbih('khitam_salah');
                setJustLoggedPrayer(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
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

      {/* Daily Prayer Fulfillment Micro-Ribbon */}
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
          <span className="text-amber-500">✨</span>
          <span>{isAr ? 'الفرائض والسنن اليومية:' : 'Daily Prayers:'}</span>
          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
            {completedPrayersCount}/5
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            ({Math.round((completedPrayersCount / 5) * 100)}%)
          </span>
        </div>

        {/* 5 Indicator Beads */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {prayerCards.map((p) => {
            const rec = prayers[p.name];
            const done = rec && (rec.status === 'on_time' || rec.status === 'in_group' || rec.status === 'late');
            const isNextP = nextPrayer.arabicName === p.title || (p.isJumuah && nextPrayer.arabicName.includes('الجمعة'));
            return (
              <div
                key={p.name}
                className={`h-1.5 rounded-full transition-all ${
                  done
                    ? 'w-4 sm:w-6 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : isNextP
                    ? 'w-4 sm:w-6 bg-amber-400 animate-pulse ring-1 ring-amber-400/50'
                    : 'w-2 sm:w-3 bg-slate-200 dark:bg-zinc-800'
                }`}
                title={`${p.title}: ${done ? 'أُديت' : 'قيد الانتظار'}`}
              />
            );
          })}
        </div>
      </div>

      {/* 5 Celestial Prayer Cards: Responsive Grid, Atmospheric Circadian Depth, Zero Truncation */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 md:gap-3">
        {prayerCards.map((p) => {
          const record = prayers[p.name];
          const isDone = record && (record.status === 'on_time' || record.status === 'in_group' || record.status === 'late');
          const isFajr = p.isFajr;
          const isJumuah = p.isJumuah;
          const isNext = nextPrayer.arabicName === p.title || (isJumuah && nextPrayer.arabicName.includes('الجمعة'));
          const theme = CELESTIAL_THEMES[p.name];
          const celestialIcon = isJumuah ? '🕌' : theme.celestialIcon;

          const timeFormatted = formatPrayerTime(p.timeDate, isAr);
          const timeParts = timeFormatted.split(' ');
          const timeDigits = timeParts[0] || timeFormatted;
          const timeAmPm = timeParts[1] || '';

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
              className={`group relative p-2 sm:p-3.5 rounded-2xl sm:rounded-3xl border transition-all duration-200 flex flex-col justify-between cursor-pointer select-none overflow-hidden ${
                isDone
                  ? 'bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/50 dark:from-emerald-950/40 dark:via-[#151a1e] dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                  : isNext
                  ? 'bg-gradient-to-b from-amber-50/95 via-white to-amber-50/60 dark:from-amber-950/50 dark:via-[#191924] dark:to-amber-950/30 border-amber-400 dark:border-amber-400/80 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/15 -translate-y-0.5 hover:scale-[1.03] active:scale-[0.98]'
                  : `bg-gradient-to-b ${theme.gradientLight} dark:${theme.gradientDark} ${theme.borderLight} dark:${theme.borderDark} shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]`
              }`}
            >
              {/* Subtle Atmospheric Aurora Glow */}
              <div
                className="absolute -top-6 -right-6 w-16 h-16 sm:w-20 sm:h-20 rounded-full opacity-15 dark:opacity-25 blur-xl pointer-events-none transition-opacity group-hover:opacity-40"
                style={{ backgroundColor: isNext ? '#f59e0b' : isDone ? '#10b981' : theme.accentGlow }}
              />

              {/* Top Header: Celestial Icon + Title + Status Pill */}
              <div className="relative z-10 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm sm:text-base md:text-lg transform group-hover:scale-110 transition-transform shrink-0">
                    {celestialIcon}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : isNext ? (
                    <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-amber-500" />
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-1">
                  <h4
                    className={`text-[11px] sm:text-xs md:text-sm font-black truncate leading-tight ${
                      isNext
                        ? 'text-amber-800 dark:text-amber-300'
                        : isDone
                        ? 'text-emerald-800 dark:text-emerald-300'
                        : 'text-slate-900 dark:text-zinc-100'
                    }`}
                  >
                    {p.title}
                  </h4>
                  {isNext && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] shadow-2xs whitespace-nowrap">
                      المقبلة ⏳
                    </span>
                  )}
                  {isFajr && !isNext && !isDone && (
                    <span className="hidden md:inline-block px-1 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[9px] whitespace-nowrap">
                      👑 +35
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Section: Crisp Proportional Time */}
              <div className="relative z-10 my-1 sm:my-2 text-center">
                <div className="flex items-baseline justify-center gap-0.5 sm:gap-1 font-mono">
                  <span className="text-xs sm:text-sm md:text-lg lg:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
                    {timeDigits}
                  </span>
                  <span className="text-[9px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 leading-none">
                    {timeAmPm}
                  </span>
                </div>
                {isNext && nextPrayer.minutesRemaining > 0 && (
                  <div className="text-[9px] sm:text-[10px] font-mono text-amber-700 dark:text-amber-400 font-black mt-0.5 whitespace-nowrap leading-tight">
                    {isAr ? `${nextPrayer.minutesRemaining}د ⏳` : `${nextPrayer.minutesRemaining}m ⏳`}
                  </div>
                )}
              </div>

              {/* Bottom Section: Action Button or Completed Acceptance Seal */}
              <div className="relative z-10 pt-1 border-t border-slate-200/50 dark:border-white/[0.06]">
                {isDone ? (
                  <div className="w-full flex items-center justify-center">
                    {record.status === 'in_group' ? (
                      <div className="w-full py-1 px-1 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[10px] sm:text-[11px] font-black flex items-center justify-center gap-1 shadow-2xs">
                        <span>🕌</span>
                        <span className="truncate">{isAr ? 'جماعة' : 'Group'}</span>
                        {record.sunnahPerformed && <span title="مع السنن">✨</span>}
                        <span className="font-mono text-[9px] opacity-80 hidden md:inline">+{record.pointsAwarded}</span>
                      </div>
                    ) : record.status === 'late' ? (
                      <div className="w-full py-1 px-1 rounded-xl bg-slate-200/80 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1">
                        <span>⏳</span>
                        <span className="truncate">{isAr ? 'قضاءً' : 'Late'}</span>
                        <span className="font-mono text-[9px] opacity-70 hidden md:inline">+10</span>
                      </div>
                    ) : (
                      <div className="w-full py-1 px-1 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-[10px] sm:text-[11px] font-black flex items-center justify-center gap-1 shadow-2xs">
                        <span>✓</span>
                        <span className="truncate">{isAr ? 'في وقتها' : 'On-time'}</span>
                        {record.sunnahPerformed && <span title="مع السنن">✨</span>}
                        <span className="font-mono text-[9px] opacity-80 hidden md:inline">+{record.pointsAwarded}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`w-full py-1 sm:py-1.5 px-1 rounded-xl text-[10px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all shadow-2xs ${
                      isNext
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs">🤲</span>
                    <span className="whitespace-nowrap">{isAr ? 'تسجيل' : 'Log'}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Nawafil & Special Prayers Quick Hub (الضحى، قيام الليل، الوتر، الاستخارة) */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-sm">🕊️</span>
          <span className="font-black text-slate-900 dark:text-white text-[11px] sm:text-xs">
            {isAr ? 'نوافل وسنن اليوم الكبرى:' : 'Daily Nawafil:'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Dhuha Chip */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setNawafilModalTab('dhuha');
              setIsNawafilModalOpen(true);
            }}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
              todayLog?.dhuhaDone
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-300 hover:border-amber-400'
            }`}
            title="صلاة الضحى (صلاة الأوّابين)"
          >
            <span>☀️</span>
            <span>{isAr ? 'صلاة الضحى' : 'Dhuha'}</span>
            {todayLog?.dhuhaDone ? <Check className="w-3 h-3 text-amber-500" /> : <span className="opacity-60 text-[9px]">+20ن</span>}
          </button>

          {/* Qiyam Chip */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setNawafilModalTab('qiyam');
              setIsNawafilModalOpen(true);
            }}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
              todayLog?.qiyamNightDone
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
                : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-300 hover:border-indigo-400'
            }`}
            title="قيام الليل والتهجد"
          >
            <span>🌌</span>
            <span>{isAr ? 'قيام الليل' : 'Qiyam'}</span>
            {todayLog?.qiyamNightDone ? <Check className="w-3 h-3 text-indigo-500" /> : <span className="opacity-60 text-[9px]">+30ن</span>}
          </button>

          {/* Witr Chip */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setNawafilModalTab('witr');
              setIsNawafilModalOpen(true);
            }}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
              todayLog?.witrDone
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300'
                : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-300 hover:border-purple-400'
            }`}
            title="صلاة الشفع والوتر والقنوت"
          >
            <span>🌙</span>
            <span>{isAr ? 'الشفع والوتر' : 'Witr'}</span>
            {todayLog?.witrDone ? <Check className="w-3 h-3 text-purple-500" /> : <span className="opacity-60 text-[9px]">+25ن</span>}
          </button>

          {/* Tawbah Chip */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setNawafilModalTab('tawbah');
              setIsNawafilModalOpen(true);
            }}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
              todayLog?.tawbahDone
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300'
                : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-300 hover:border-teal-400'
            }`}
            title="صلاة التوبة والاستغفار ومحو الذنوب"
          >
            <span>🌿</span>
            <span>{isAr ? 'صلاة التوبة' : 'Tawbah'}</span>
            {todayLog?.tawbahDone ? <Check className="w-3 h-3 text-teal-500" /> : <span className="opacity-60 text-[9px]">+25ن</span>}
          </button>

          {/* Istikhara / All Sunan Hub Button */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setNawafilModalTab('qiyam');
              setIsNawafilModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
            title="موسوعة السنن والنوافل المأثورة الكاملة"
          >
            <span>🕊️</span>
            <span>{isAr ? 'موسوعة السنن (١٢ صلاة)' : 'Sunan Encyclopedia'}</span>
          </button>
        </div>
      </div>

      {/* Centered Floating Pop-up Modal for Prayer & Sunnah Logging */}
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
        const basePts = isFajr
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

            {/* Centered Pop-up Modal (Floating card, responsive, never clipped) */}
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
                <div className="grid grid-cols-3 gap-2">
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
                    <span className="text-xs leading-tight">{isAr ? 'في وقتها (منفرد)' : 'On Time (Solo)'}</span>
                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      +{isFajr ? 35 : 20}ن
                    </span>
                  </button>

                  {/* Late */}
                  <button
                    type="button"
                    onClick={() => setModalStatus('late')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                      modalStatus === 'late'
                        ? 'bg-slate-200 dark:bg-zinc-700 border-slate-400 text-slate-900 dark:text-white font-bold ring-2 ring-slate-400/30 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="text-xl">⏳</span>
                    <span className="text-xs leading-tight">{isAr ? 'صليت قضاءً' : 'Late / Qada'}</span>
                    <span className="font-mono text-[10px] text-slate-500">+10ن</span>
                  </button>
                </div>
              </div>

              {/* 2. Authentic Sunnah Section */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/25 border border-amber-300/60 dark:border-amber-700/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">✨</span>
                    <span className="font-black text-amber-950 dark:text-amber-200 text-xs">
                      {isAr ? '2. السنن الرواتب والمؤكدة:' : '2. Sunnah Prayers:'}
                    </span>
                  </div>
                  {totalSunnahRakats > 0 && (
                    <span className="font-mono font-black text-[10px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-300/80">
                      +{sunnahBonusPts}ن إضافية
                    </span>
                  )}
                </div>

                {/* Fajr Sunnah */}
                {isFajr && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                        سُنّة ركعتي الفجر (قبل الفريضة 🌟):
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSunnahQabliyah(0)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            sunnahQabliyah === 0
                              ? 'bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-white font-black'
                              : 'bg-white/80 dark:bg-zinc-900 text-slate-500 border border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          لم أصلِّ
                        </button>
                        <button
                          type="button"
                          onClick={() => setSunnahQabliyah(2)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            sunnahQabliyah === 2
                              ? 'bg-amber-600 text-white font-black shadow-xs'
                              : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                          }`}
                        >
                          <span>ركعتان 🌟</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 font-medium">
                      «ركعتا الفجر خيرٌ من الدنيا وما فيها» (صحيح مسلم)
                    </p>
                  </div>
                )}

                {/* Dhuhr Sunnah */}
                {isDhuhr && !isJumuah && (
                  <div className="space-y-2">
                    {/* Before Dhuhr */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                        سُنّة ما قبل الظهر (الراتبة وسُنّة الزوال):
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSunnahQabliyah(0)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            sunnahQabliyah === 0
                              ? 'bg-slate-300 dark:bg-zinc-700 text-slate-900 dark:text-white font-black'
                              : 'bg-white dark:bg-zinc-900 text-slate-500 border border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          بدون
                        </button>
                        <button
                          type="button"
                          onClick={() => setSunnahQabliyah(2)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            sunnahQabliyah === 2
                              ? 'bg-amber-600 text-white font-black shadow-xs'
                              : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                          }`}
                        >
                          ركعتان
                        </button>
                        <button
                          type="button"
                          onClick={() => setSunnahQabliyah(4)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            sunnahQabliyah === 4
                              ? 'bg-amber-600 text-white font-black shadow-xs ring-1 ring-amber-400'
                              : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                          }`}
                        >
                          4 ركعات (2+2) 🌟
                        </button>
                      </div>
                    </div>

                    {/* After Dhuhr */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                        سُنّة ما بعد الظهر (الراتبة والمستحبة):
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSunnahBadiyah(0)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            sunnahBadiyah === 0
                              ? 'bg-slate-300 dark:bg-zinc-700 text-slate-900 dark:text-white font-black'
                              : 'bg-white dark:bg-zinc-900 text-slate-500 border border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          بدون
                        </button>
                        <button
                          type="button"
                          onClick={() => setSunnahBadiyah(2)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            sunnahBadiyah === 2
                              ? 'bg-amber-600 text-white font-black shadow-xs'
                              : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                          }`}
                        >
                          ركعتان راتبة 🌟
                        </button>
                        <button
                          type="button"
                          onClick={() => setSunnahBadiyah(4)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            sunnahBadiyah === 4
                              ? 'bg-amber-600 text-white font-black shadow-xs ring-1 ring-amber-400'
                              : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                          }`}
                        >
                          4 ركعات 👑
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 font-medium">
                      «من حافظ على أربع ركعات قبل الظهر وأربع بعدها حرّمه الله على النار» (الترمذي)
                    </p>
                  </div>
                )}

                {/* Friday Jumuah Sunnah */}
                {isJumuah && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                        سُنّة ما بعد الجمعة (في البيت أو المسجد):
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSunnahBadiyah(0)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                            sunnahBadiyah === 0 ? 'bg-slate-300 dark:bg-zinc-700 text-slate-900 dark:text-white font-black' : 'bg-white dark:bg-zinc-900 text-slate-500'
                          }`}
                        >
                          بدون
                        </button>
                        <button
                          type="button"
                          onClick={() => setSunnahBadiyah(2)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                            sunnahBadiyah === 2 ? 'bg-amber-600 text-white font-black' : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border border-amber-300'
                          }`}
                        >
                          ركعتان (في البيت)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSunnahBadiyah(4)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                            sunnahBadiyah === 4 ? 'bg-amber-600 text-white font-black' : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border border-amber-300'
                          }`}
                        >
                          4 ركعات (في المسجد) 🕌
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Asr Sunnah */}
                {isAsr && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                        أربع ركعات قبل العصر (مستحبة 🌸):
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSunnahQabliyah(0)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                            sunnahQabliyah === 0 ? 'bg-slate-300 dark:bg-zinc-700 text-slate-900 dark:text-white font-black' : 'bg-white dark:bg-zinc-900 text-slate-500'
                          }`}
                        >
                          بدون
                        </button>
                        <button
                          type="button"
                          onClick={() => setSunnahQabliyah(2)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                            sunnahQabliyah === 2 ? 'bg-amber-600 text-white font-black' : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border border-amber-300'
                          }`}
                        >
                          ركعتان
                        </button>
                        <button
                          type="button"
                          onClick={() => setSunnahQabliyah(4)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                            sunnahQabliyah === 4 ? 'bg-amber-600 text-white font-black' : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border border-amber-300'
                          }`}
                        >
                          4 ركعات (2+2) 🌸
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 font-medium">
                      «رحِمَ اللهُ امرأً صلَّى قبلَ العصرِ أربعاً» (سنن الترمذي)
                    </p>
                  </div>
                )}

                {/* Maghrib Sunnah */}
                {isMaghrib && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                        سُنّة ما بعد المغرب (الراتبة المؤكدة 🌟):
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSunnahBadiyah(0)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer ${
                            sunnahBadiyah === 0 ? 'bg-slate-300 dark:bg-zinc-700 text-slate-900 dark:text-white font-black' : 'bg-white dark:bg-zinc-900 text-slate-500'
                          }`}
                        >
                          لم أصلِّ
                        </button>
                        <button
                          type="button"
                          onClick={() => setSunnahBadiyah(2)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer ${
                            sunnahBadiyah === 2 ? 'bg-amber-600 text-white font-black' : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border border-amber-300'
                          }`}
                        >
                          ركعتان 🌟
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Isha Sunnah & Witr */}
                {isIsha && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                        سُنّة ما بعد العشاء (الراتبة المؤكدة 🌟):
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSunnahBadiyah(0)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                            sunnahBadiyah === 0 ? 'bg-slate-300 dark:bg-zinc-700 text-slate-900 dark:text-white font-black' : 'bg-white dark:bg-zinc-900 text-slate-500'
                          }`}
                        >
                          بدون
                        </button>
                        <button
                          type="button"
                          onClick={() => setSunnahBadiyah(2)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                            sunnahBadiyah === 2 ? 'bg-amber-600 text-white font-black' : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border border-amber-300'
                          }`}
                        >
                          ركعتان 🌟
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                        صلاة الشفع والوتر:
                      </span>
                      <button
                        type="button"
                        onClick={() => setWitrDone(!witrDone)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                          witrDone
                            ? 'bg-indigo-600 text-white font-black shadow-xs'
                            : 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        <span>🌙</span>
                        <span>{witrDone ? 'تم أداء الوتر الشريف ✓' : 'أداء الشفع والوتر'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Points Badge */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-amber-500/10 to-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  {isAr ? 'مجموع النقاط المستحقة:' : 'Total XP Earned:'}
                </span>
                <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                  +{totalPts} XP
                </span>
              </div>

              {/* Primary Action Submit */}
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🤲</span>
                <span>
                  {isAr
                    ? `حفظ واعتماد صلاة ${p.title} ${totalSunnahRakats > 0 ? 'مع السنن' : ''}`
                    : `Save & Confirm ${p.title}`}
                </span>
              </button>

              {/* Reset if already logged */}
              {record && (
                <button
                  type="button"
                  onClick={async () => {
                    soundSynth.playTactileClick();
                    const todayDateStr = getBiologicalDate(true);
                    const existingPrayers = { ...(todayLog?.prayers || {}) };
                    delete existingPrayers[p.name];
                    await upsertDailyLog(todayDateStr, { prayers: existingPrayers });
                    setSelectedPrayerAction(null);
                  }}
                  className="w-full py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-center font-bold text-[11px] transition-colors cursor-pointer"
                >
                  {isAr ? '🗑️ إلغاء تسجيل هذه الصلاة' : 'Reset this prayer record'}
                </button>
              )}
            </div>
          </>
        );
      })()}

      {/* Nawafil and Special Prayers Guide Modal */}
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
