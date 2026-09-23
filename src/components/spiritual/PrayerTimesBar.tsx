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
} from 'lucide-react';
import {
  calculatePrayerTimes,
  getNextPrayer,
  formatPrayerTime,
  PRESET_CITIES,
  detectDefaultCityFromTimezone,
  type CalculatedPrayerTimes,
} from '../../utils/prayerCalculator';
import { awardPrayerPoints } from '../../utils/gamification';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { db } from '../../db/db';
import { useTranslation } from '../../i18n/LanguageContext';
import type { DailyLog, PrayerName, UserState } from '../../types';
import { checkIsFridaySalawatWindow, type TasbihPresetId } from '../../utils/tasbihEngine';
import { autoDetectAndSyncPrayerLocation, fetchAladhanPrayerTimings } from '../../services/onlinePrayerService';
import { MUADHIN_OPTIONS } from '../modals/PrayerLocationModal';

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
  const [isOnlineLive, setIsOnlineLive] = useState(false);
  const [justLoggedPrayer, setJustLoggedPrayer] = useState<{ name: PrayerName; title: string } | null>(null);

  // Adhan & Pre-Prayer Audio State
  const [activeAdhanAudio, setActiveAdhanAudio] = useState<HTMLAudioElement | null>(null);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);
  const [dismissedAlertPrayer, setDismissedAlertPrayer] = useState<string | null>(null);

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

  const handleMarkPrayer = async (prayer: PrayerName, status: 'on_time' | 'in_group' | 'late') => {
    const res = await awardPrayerPoints(prayer, status, prayerTimes.isFriday);
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

  return (
    <div className={`p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-4 ${className}`}>
      {/* Top Header: Next Prayer Banner + City Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isAr ? 'الصلاة القادمة' : 'Next Prayer'}
              </span>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                {nextPrayer.arabicName} • {nextPrayer.formattedTime}
              </span>
              {isOnlineLive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{isAr ? 'مواقيت رسمية' : 'Live'}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5 font-medium">
              {isAr
                ? `متبقي ${nextPrayer.minutesRemaining} دقيقة تقريباً • الصلاة في وقتها أحب الأعمال إلى الله`
                : `~${nextPrayer.minutesRemaining} mins remaining`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
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
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer transition-all active:scale-95 shrink-0 whitespace-nowrap"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-200 text-xs font-bold cursor-pointer transition-all active:scale-95 shrink-0 whitespace-nowrap border border-slate-200/80 dark:border-white/[0.08]"
            title={isAr ? 'المسبحة اللمسية الذكية لختام الصلاة والأذكار' : 'Smart Haptic Tasbih'}
          >
            <span>📿</span>
            <span className="hidden sm:inline">{isAr ? 'مسبحة ختام الصلاة' : 'Smart Tasbih'}</span>
            <span className="sm:hidden">{isAr ? 'المسبحة' : 'Tasbih'}</span>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all active:scale-95 shrink-0 whitespace-nowrap ${
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
                <VolumeX className="w-3.5 h-3.5 text-black" />
                <span>{isAr ? 'كتم الأذان 🔇' : 'Mute'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">{isAr ? 'صوت الأذان' : 'Adhan'}</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/[0.08] text-xs font-bold text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="max-w-[80px] sm:max-w-none truncate">
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

      {/* 5 Prayers Grid Ribbon: 5 columns on all screens with responsive micro-typography */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {prayerCards.map((p) => {
          const record = prayers[p.name];
          const isDone = record && (record.status === 'on_time' || record.status === 'in_group' || record.status === 'late');
          const isFajr = p.isFajr;
          const isJumuah = p.isJumuah;
          const isNext = nextPrayer.arabicName === p.title || (isJumuah && nextPrayer.arabicName.includes('الجمعة'));

          return (
            <div
              key={p.name}
              className={`relative p-2.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isDone
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-800/60'
                  : isNext
                  ? 'bg-white dark:bg-[#181A24] border-emerald-500/70 dark:border-emerald-400/60 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-slate-50/80 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.06]'
              }`}
            >
              {/* Badges */}
              {isFajr && (
                <span className="hidden sm:flex absolute -top-2 left-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black tracking-tight shadow-xs items-center gap-0.5">
                  <span>👑 {isAr ? 'أعلى نقاط' : 'Top Pts'}</span>
                </span>
              )}

              {isJumuah && (
                <span className="hidden sm:flex absolute -top-2 left-2 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold shadow-xs">
                  <span>🕌 {isAr ? 'الجمعة' : 'Friday'}</span>
                </span>
              )}

              {/* Title & Status */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] sm:text-xs font-bold truncate ${
                    isNext ? 'text-emerald-700 dark:text-emerald-400 font-black' : 'text-slate-900 dark:text-zinc-100'
                  }`}>
                    {p.title}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : isNext ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  ) : null}
                </div>

                {/* Time Display */}
                <div className="text-xs sm:text-base font-black text-slate-950 dark:text-white font-mono tracking-tight">
                  {formatPrayerTime(p.timeDate, isAr)}
                </div>
              </div>

              {/* Action Button or Points Badge */}
              <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-white/[0.06]">
                {isDone ? (
                  <button
                    type="button"
                    onClick={() => setSelectedPrayerAction(selectedPrayerAction === p.name ? null : p.name)}
                    className="w-full flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                    title={isAr ? 'انقر لتعديل حالة الأداء' : 'Click to edit status'}
                  >
                    {record.status === 'in_group' ? (
                      <span className="text-[10px] sm:text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-700/60 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                        <span>🕌</span>
                        <span>{isAr ? 'جماعة' : 'Group'}</span>
                        <span className="font-mono text-[9px] hidden sm:inline">+{record.pointsAwarded}</span>
                      </span>
                    ) : record.status === 'late' ? (
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <span>⏳</span>
                        <span>{isAr ? 'قضاءً' : 'Late'}</span>
                        <span className="font-mono text-[9px] hidden sm:inline">+10</span>
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                        <span>✓</span>
                        <span>{isAr ? 'وقتها' : 'On-time'}</span>
                        <span className="font-mono text-[9px] hidden sm:inline">+{record.pointsAwarded}</span>
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedPrayerAction(selectedPrayerAction === p.name ? null : p.name)}
                    className="w-full py-1 px-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-bold cursor-pointer transition-colors shadow-2xs text-center truncate"
                  >
                    {isAr ? 'تسجيل 🤲' : 'Log 🤲'}
                  </button>
                )}
              </div>

              {/* Action Sheet / Popover */}
              {selectedPrayerAction === p.name && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs cursor-pointer"
                    onClick={() => setSelectedPrayerAction(null)}
                  />
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 w-60 sm:w-68 rounded-3xl bg-white dark:bg-[#181A24] border border-slate-200 dark:border-white/[0.1] shadow-2xl p-3.5 space-y-2 animate-fade-in text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 dark:text-white">
                          {isAr ? `تسجيل ${p.title}` : `Log ${p.title}`}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          ({formatPrayerTime(p.timeDate, isAr)})
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {record ? (isAr ? 'تعديل' : 'Edit') : (isAr ? 'جديد' : 'New')}
                      </span>
                    </div>

                    {/* 1. In Mosque / Group */}
                    <button
                      type="button"
                      onClick={() => handleMarkPrayer(p.name, 'in_group')}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer text-start ${
                        record?.status === 'in_group'
                          ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/30 font-black'
                          : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/[0.06] hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-slate-800 dark:text-zinc-200 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🕌</span>
                        <div>
                          <div className="leading-tight font-black">{isAr ? 'في المسجد / جماعة' : 'In Mosque / Group'}</div>
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            {isAr ? 'الأعلى أجراً وثواباً 👑' : 'Maximum Reward 👑'}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                        +{isFajr ? 45 : 30}ن
                      </span>
                    </button>

                    {/* 2. On Time Solo */}
                    <button
                      type="button"
                      onClick={() => handleMarkPrayer(p.name, 'on_time')}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer text-start ${
                        record?.status === 'on_time'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400/30 font-black'
                          : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-800 dark:text-zinc-200 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏠</span>
                        <div>
                          <div className="leading-tight font-bold">{isAr ? 'في وقتها (منفرد)' : 'On Time (Solo)'}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {isAr ? 'أحب الأعمال إلى الله' : 'On Time'}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{isFajr ? 35 : 20}ن
                      </span>
                    </button>

                    {/* 3. Late */}
                    <button
                      type="button"
                      onClick={() => handleMarkPrayer(p.name, 'late')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer text-start ${
                        record?.status === 'late'
                          ? 'bg-slate-200 dark:bg-zinc-700 border-slate-400 text-slate-900 dark:text-white font-bold'
                          : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-500 dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>⏳</span>
                        <span>{isAr ? 'صليت قضاءً (بعد الوقت)' : 'Prayed Late'}</span>
                      </div>
                      <span className="font-mono text-slate-500">+10ن</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
