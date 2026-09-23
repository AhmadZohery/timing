import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Compass,
  Search,
  Check,
  X,
  Info,
  Globe2,
  Volume2,
  VolumeX,
  BellRing,
  Play,
  Pause,
} from 'lucide-react';
import { db } from '../../db/db';
import type { UserState, PrayerLocationConfig, PrayerAudioSettings } from '../../types';
import {
  PRESET_CITIES,
  CALCULATION_METHODS,
  detectDefaultCityFromTimezone,
  calculateQiblaDirection,
  type PresetCity,
} from '../../utils/prayerCalculator';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface PrayerLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState?: UserState;
  onLocationUpdated?: (cityTitle: string) => void;
}

export const MUADHIN_OPTIONS = [
  {
    id: 'makkah' as const,
    nameAr: 'أذان الحرم المكي الشريف (الشيخ علي ملا)',
    audioUrl: 'https://media.sd.ma/assabile/adhan/ali_ibn_ahmed_malla.mp3',
    icon: '🕋',
  },
  {
    id: 'madinah' as const,
    nameAr: 'أذان المسجد النبوي الشريف (الشيخ عصام بخاري)',
    audioUrl: 'https://media.sd.ma/assabile/adhan/essam_boukhari.mp3',
    icon: '🕌',
  },
  {
    id: 'aqsa' as const,
    nameAr: 'أذان المسجد الأقصى المبارك',
    audioUrl: 'https://media.sd.ma/assabile/adhan/al-aqsa.mp3',
    icon: '✨',
  },
  {
    id: 'abdulbasit' as const,
    nameAr: 'أذان الشيخ عبد الباسط عبد الصمد (مصر)',
    audioUrl: 'https://media.sd.ma/assabile/adhan/abdelbasset_abdessamad.mp3',
    icon: '🎙️',
  },
  {
    id: 'mishary' as const,
    nameAr: 'أذان الشيخ مشاري بن راشد العفاسي',
    audioUrl: 'https://media.sd.ma/assabile/adhan/mishary_rashid_alafasy.mp3',
    icon: '🌟',
  },
];

export const PrayerLocationModal: React.FC<PrayerLocationModalProps> = ({
  isOpen,
  onClose,
  userState,
  onLocationUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'location' | 'adhan'>('location');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Adhan state
  const prayerAudio = userState?.settings?.prayerAudioSettings || {
    adhanEnabled: false,
    muadhin: 'makkah',
    prePrayerAlertEnabled: true,
    prePrayerAlertMinutes: 10,
  };
  const [adhanEnabled, setAdhanEnabled] = useState(prayerAudio.adhanEnabled);
  const [selectedMuadhin, setSelectedMuadhin] = useState(prayerAudio.muadhin || 'makkah');
  const [prePrayerAlert, setPrePrayerAlert] = useState(prayerAudio.prePrayerAlertEnabled ?? true);
  const [prePrayerMins, setPrePrayerMins] = useState(prayerAudio.prePrayerAlertMinutes || 10);

  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
      }
    };
  }, [previewAudio]);

  const togglePlayPreview = (url: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (isPlayingPreview && previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setIsPlayingPreview(false);
      return;
    }
    if (previewAudio) {
      previewAudio.pause();
    }
    const aud = new Audio(url);
    aud.volume = 0.85;
    aud.play().catch(() => {});
    aud.onended = () => setIsPlayingPreview(false);
    setPreviewAudio(aud);
    setIsPlayingPreview(true);
  };

  const handleUpdateAdhanSettings = async (partial: Partial<PrayerAudioSettings>) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const updated: PrayerAudioSettings = {
      adhanEnabled,
      muadhin: selectedMuadhin,
      prePrayerAlertEnabled: prePrayerAlert,
      prePrayerAlertMinutes: prePrayerMins,
      ...partial,
    };
    if (partial.adhanEnabled !== undefined) setAdhanEnabled(partial.adhanEnabled);
    if (partial.muadhin !== undefined) setSelectedMuadhin(partial.muadhin);
    if (partial.prePrayerAlertEnabled !== undefined) setPrePrayerAlert(partial.prePrayerAlertEnabled);
    if (partial.prePrayerAlertMinutes !== undefined) setPrePrayerMins(partial.prePrayerAlertMinutes);

    if (userState) {
      await db.user_state.update(userState.id, {
        'settings.prayerAudioSettings': updated,
      });
    }
  };

  if (!isOpen) return null;

  const currentLoc = userState?.settings?.prayerLocation;
  const activeCityId = currentLoc?.city || detectDefaultCityFromTimezone().id;
  const activeMethod = currentLoc?.calculationMethod || 'egyptian';
  const currentLat = currentLoc?.latitude ?? 30.0444;
  const currentLng = currentLoc?.longitude ?? 31.2357;
  const qiblaAngle = useMemo(() => calculateQiblaDirection(currentLat, currentLng), [currentLat, currentLng]);

  const filteredCities = PRESET_CITIES.filter(
    (c) =>
      c.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCity = async (city: PresetCity) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const config: PrayerLocationConfig = {
      city: city.id,
      latitude: city.lat,
      longitude: city.lng,
      calculationMethod: city.defaultMethod,
    };

    if (userState) {
      await db.user_state.update(userState.id, {
        'settings.prayerLocation': config,
      });
    }

    soundSynth.playCompletionChime();
    if (onLocationUpdated) {
      onLocationUpdated(city.nameAr);
    }
    onClose();
  };

  const handleSelectMethod = async (methodId: any) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    if (userState && currentLoc) {
      await db.user_state.update(userState.id, {
        'settings.prayerLocation.calculationMethod': methodId,
      });
    }
  };

  const handleUseGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('خاصية تحديد الموقع الجغرافي غير مدعومة في متصفحك.');
      return;
    }

    setIsLocatingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Determine best matching calculation method based on longitude
        // Arab Gulf longitudes (~40-60): Umm Al-Qura; Egypt/Sudan (~25-35): Egyptian; North America: ISNA
        let guessedMethod: any = 'egyptian';
        if (longitude >= 38 && longitude <= 60 && latitude <= 32) {
          guessedMethod = 'umm_al_qura';
        } else if (longitude < -50) {
          guessedMethod = 'isna';
        } else if (latitude > 35) {
          guessedMethod = 'mwl';
        }

        const config: PrayerLocationConfig = {
          city: `GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
          latitude,
          longitude,
          calculationMethod: guessedMethod,
        };

        if (userState) {
          await db.user_state.update(userState.id, {
            'settings.prayerLocation': config,
          });
        }

        setIsLocatingGps(false);
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();

        if (onLocationUpdated) {
          onLocationUpdated('موقعك عبر GPS');
        }
        onClose();
      },
      (err) => {
        setIsLocatingGps(false);
        setGpsError(`تعذر الحصول على الموقع: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div
        className="relative z-10 w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        dir="rtl"
      >
        {/* Mobile Pull Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                إعدادات القبلة، المواقيت وصوت الأذان
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                حساب فلكي دقيق وخيارات التنبيهات والأذان لمختلف المؤذنين
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('location');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'location'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>الموقع والقبلة</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('adhan');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'adhan'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>صوت الأذان والتنبيه المسبق</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'adhan' ? (
            /* ADHAN & PRE-PRAYER NOTIFICATION SETTINGS */
            <div className="space-y-5 animate-fade-in">
              {/* Adhan Toggle Card */}
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      {adhanEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        تشغيل صوت الأذان عند دخول الفريضة
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        يمكنك إيقافه لمنع الإحراج في بيئات العمل والأماكن العامة
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateAdhanSettings({ adhanEnabled: !adhanEnabled })}
                    className={`w-12 h-6.5 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                      adhanEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>

              {/* 10-Minute Pre-Prayer Reminder */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        تنبيه اقتراب الصلاة المسبق (للاستعداد والوضوء)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        إشعار ورنين هادئ قبل الأذان لإدراك تكبيرة الإحرام
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateAdhanSettings({ prePrayerAlertEnabled: !prePrayerAlert })}
                    className={`w-12 h-6.5 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                      prePrayerAlert ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {prePrayerAlert && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">وقت التنبيه قبل الأذان:</span>
                    <div className="flex items-center gap-1.5">
                      {[5, 10, 15].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleUpdateAdhanSettings({ prePrayerAlertMinutes: mins })}
                          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                            prePrayerMins === mins
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {mins} دقيقة
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Muadhin Voice Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  اختر صوت المؤذن المفضل:
                </label>
                <div className="space-y-2">
                  {MUADHIN_OPTIONS.map((m) => {
                    const isSelected = selectedMuadhin === m.id;
                    const isThisPlaying = isPlayingPreview && previewAudio?.src === m.audioUrl;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleUpdateAdhanSettings({ muadhin: m.id })}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-xl">{m.icon}</span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {m.nameAr}
                            </p>
                            <span className="text-[10px] text-amber-500 font-mono">
                              {isSelected ? 'المؤذن المعتمد حالياً ✔' : 'انقر للاختيار'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlayPreview(m.audioUrl);
                          }}
                          className={`p-2 rounded-xl border flex items-center gap-1 text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                            isThisPlaying
                              ? 'bg-amber-500 text-black border-amber-400'
                              : 'bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {isThisPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>إيقاف</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>استماع</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* LOCATION, GPS & QIBLA SETTINGS (ORIGINAL TAB) */
            <>
          {/* How dynamic calculation works banner */}
          <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-300">
              <Info className="w-4 h-4 text-sky-600" />
              <span>كيف تعمل مواقيت الصلاة والإشعارات في مضمار؟</span>
            </div>
            <p className="text-[11px] leading-relaxed text-sky-800/90 dark:text-sky-300/90">
              يتم حساب مواقيت الصلاة فلكياً يومياً بناءً على تاريخ اليوم وإحداثيات موقعك بدقة متناهية. ثم يقوم النظام بجدولة الإشعارات تلقائياً:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px] font-bold text-center">
              <span className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-sky-200 dark:border-sky-800">
                🕌 وقت الأذان (0د)
              </span>
              <span className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-sky-200 dark:border-sky-800">
                ⏳ بعد ربع ساعة (+15د)
              </span>
              <span className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-sky-200 dark:border-sky-800">
                🤍 بعد نصف ساعة (+30د)
              </span>
              <span className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-sky-200 dark:border-sky-800 text-emerald-600 dark:text-emerald-400">
                🕌 الجمعة (+120د)
              </span>
            </div>
          </div>

          {/* 1-Tap GPS Auto Detection */}
          <div>
            <button
              onClick={handleUseGps}
              disabled={isLocatingGps}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <Compass className={`w-4 h-4 ${isLocatingGps ? 'animate-spin' : ''}`} />
              <span>
                {isLocatingGps
                  ? 'جارٍ جلب إحداثيات موقعك عبر GPS...'
                  : '📍 تحديد موقعي الجغرافي تلقائياً عبر GPS (بنقرة واحدة)'}
              </span>
            </button>
            {gpsError && (
              <p className="text-[11px] text-rose-500 font-bold mt-1.5 text-center">
                {gpsError}
              </p>
            )}
          </div>

          {/* Qibla Direction Realtime Geodesic Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center border border-emerald-300 dark:border-emerald-700 shadow-inner">
                <Compass
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-700 ease-out"
                  style={{ transform: `rotate(${qiblaAngle}deg)` }}
                />
                <div className="absolute -top-1 text-[8px] font-black text-rose-500">N</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    اتجاه القبلة الشريفة (الكعبة المشرفة)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                    {qiblaAngle}°
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  انحراف {qiblaAngle}° في اتجاه عقارب الساعة عن الشمال الجغرافي
                </p>
              </div>
            </div>
            <div className="text-right text-xs font-bold text-emerald-700 dark:text-emerald-300">
              🕋 مكة المكرمة
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث عن دولتك أو مدينتك (مثال: القاهرة، الرياض، دبي، لندن)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Preset Cities Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              عواصم ومدن كبرى شائعة:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredCities.map((city) => {
                const isSelected = activeCityId === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Globe2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs truncate">{city.nameAr}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculation Method Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              طريقة الحساب الفلكي المعتمدة:
            </label>
            <div className="space-y-1.5">
              {CALCULATION_METHODS.map((m) => {
                const isSelected = activeMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMethod(m.id)}
                    className={`w-full p-2 rounded-xl border text-right text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{m.nameAr}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {currentLoc?.city ? `الموقع المعتمد: ${currentLoc.city}` : 'الموقع التلقائي مفعل'}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
