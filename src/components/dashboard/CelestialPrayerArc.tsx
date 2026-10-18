import React, { useMemo } from 'react';
import { Check, Sparkles } from 'lucide-react';
import {
  calculatePrayerTimes,
  formatPrayerTime,
  PRESET_CITIES,
  detectDefaultCityFromTimezone,
} from '../../utils/prayerCalculator';
import type { UserState } from '../../types';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

interface CelestialPrayerArcProps {
  now: Date;
  doneMap: Record<PrayerKey, boolean>;
  isAr: boolean;
  userState?: UserState | null;
  onSelectPrayer?: (prayer: PrayerKey) => void;
}

interface ArcStop {
  key: PrayerKey;
  labelAr: string;
  labelEn: string;
  t: number; // 0..1 along the arc
  defaultMinutes: number; // fallback minutes from midnight
}

// Ordered from right (0 = start of day in RTL) to left (1 = end of day in RTL)
const STOPS: ArcStop[] = [
  { key: 'fajr', labelAr: 'الفجر', labelEn: 'Fajr', t: 0.08, defaultMinutes: 5 * 60 },
  { key: 'dhuhr', labelAr: 'الظهر', labelEn: 'Dhuhr', t: 0.31, defaultMinutes: 12 * 60 + 15 },
  { key: 'asr', labelAr: 'العصر', labelEn: 'Asr', t: 0.54, defaultMinutes: 15 * 60 + 35 },
  { key: 'maghrib', labelAr: 'المغرب', labelEn: 'Maghrib', t: 0.76, defaultMinutes: 18 * 60 + 15 },
  { key: 'isha', labelAr: 'العشاء', labelEn: 'Isha', t: 0.92, defaultMinutes: 19 * 60 + 40 },
];

// Deterministic cosmic starfield for night/twilight sky dome
const STARFIELD = [
  { x: 28, y: 22, r: 1.3, delay: '0s', dur: '3.2s' },
  { x: 54, y: 42, r: 0.9, delay: '0.7s', dur: '4.1s' },
  { x: 82, y: 18, r: 1.5, delay: '1.3s', dur: '2.8s' },
  { x: 115, y: 34, r: 1.0, delay: '0.4s', dur: '3.7s' },
  { x: 148, y: 15, r: 1.6, delay: '1.9s', dur: '3.0s' },
  { x: 176, y: 46, r: 0.8, delay: '0.2s', dur: '4.5s' },
  { x: 210, y: 20, r: 1.2, delay: '1.1s', dur: '3.4s' },
  { x: 244, y: 12, r: 1.7, delay: '2.2s', dur: '2.9s' },
  { x: 278, y: 38, r: 1.0, delay: '0.8s', dur: '3.9s' },
  { x: 312, y: 19, r: 1.4, delay: '1.5s', dur: '3.1s' },
  { x: 345, y: 44, r: 0.9, delay: '0.3s', dur: '4.2s' },
  { x: 382, y: 16, r: 1.6, delay: '1.7s', dur: '2.7s' },
  { x: 418, y: 32, r: 1.1, delay: '0.6s', dur: '3.6s' },
  { x: 448, y: 22, r: 1.4, delay: '1.2s', dur: '3.3s' },
  { x: 472, y: 48, r: 0.9, delay: '2.0s', dur: '4.0s' },
  { x: 68, y: 66, r: 0.8, delay: '1.0s', dur: '3.8s' },
  { x: 195, y: 62, r: 0.9, delay: '0.5s', dur: '4.3s' },
  { x: 330, y: 64, r: 0.8, delay: '1.4s', dur: '3.5s' },
  { x: 432, y: 68, r: 1.0, delay: '0.9s', dur: '3.9s' },
];

// Quadratic Bezier point at parameter u in [0,1].
// P0=(28, 122) [right/start in RTL], P1=(250, -18) [zenith], P2=(472, 122) [left/end]
function arcPoint(t: number, rtl: boolean): { x: number; y: number } {
  const u = rtl ? 1 - t : t;
  const x0 = 28;
  const y0 = 122;
  const x1 = 250;
  const y1 = -14;
  const x2 = 472;
  const y2 = 122;
  const omt = 1 - u;
  const x = omt * omt * x0 + 2 * omt * u * x1 + u * u * x2;
  const y = omt * omt * y0 + 2 * omt * u * y1 + u * u * y2;
  return { x, y };
}

type SkyAtmospherePhase = 'fajr' | 'morning' | 'zenith' | 'asr' | 'maghrib' | 'night';

interface AtmospherePalette {
  phase: SkyAtmospherePhase;
  labelAr: string;
  labelEn: string;
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  horizonGlow: string;
  sunCore: string;
  sunMid: string;
  sunCorona: string;
  archStroke: string;
  starOpacity: number;
  cloudOpacity: number;
}

function getAtmospherePalette(minutesNow: number, fajrMin: number, dhuhrMin: number, asrMin: number, maghribMin: number, ishaMin: number): AtmospherePalette {
  if (minutesNow >= fajrMin - 35 && minutesNow < fajrMin + 75) {
    return {
      phase: 'fajr',
      labelAr: 'شفق الفجر الصادق ونسمات البكور',
      labelEn: 'Dawn Twilight & Fajr Breeze',
      skyTop: '#0f172a',
      skyMid: '#312e81',
      skyHorizon: '#f472b6',
      horizonGlow: '#fb923c',
      sunCore: '#fffbeb',
      sunMid: '#fde047',
      sunCorona: '#f97316',
      archStroke: '#f472b6',
      starOpacity: 0.45,
      cloudOpacity: 0.25,
    };
  }
  if (minutesNow >= fajrMin + 75 && minutesNow < dhuhrMin - 30) {
    return {
      phase: 'morning',
      labelAr: 'إشراق الضحى وساعات البكور المباركة',
      labelEn: 'Radiant Morning & Dhuha Glow',
      skyTop: '#0c4a6e',
      skyMid: '#0284c7',
      skyHorizon: '#fde68a',
      horizonGlow: '#fbbf24',
      sunCore: '#ffffff',
      sunMid: '#fef08a',
      sunCorona: '#f59e0b',
      archStroke: '#38bdf8',
      starOpacity: 0,
      cloudOpacity: 0.45,
    };
  }
  if (minutesNow >= dhuhrMin - 30 && minutesNow < asrMin - 15) {
    return {
      phase: 'zenith',
      labelAr: 'سماء الظهيرة الساطعة وذروة النهار',
      labelEn: 'High Noon Zenith Radiance',
      skyTop: '#075985',
      skyMid: '#0ea5e9',
      skyHorizon: '#fef08a',
      horizonGlow: '#facc15',
      sunCore: '#ffffff',
      sunMid: '#fef9c3',
      sunCorona: '#eab308',
      archStroke: '#facc15',
      starOpacity: 0,
      cloudOpacity: 0.4,
    };
  }
  if (minutesNow >= asrMin - 15 && minutesNow < maghribMin - 25) {
    return {
      phase: 'asr',
      labelAr: 'أصيل العصر الذهبي والسكينة',
      labelEn: 'Golden Hour & Asr Serenity',
      skyTop: '#1e1b4b',
      skyMid: '#9a3412',
      skyHorizon: '#fbbf24',
      horizonGlow: '#f97316',
      sunCore: '#fffbeb',
      sunMid: '#fde047',
      sunCorona: '#ea580c',
      archStroke: '#fb923c',
      starOpacity: 0.1,
      cloudOpacity: 0.35,
    };
  }
  if (minutesNow >= maghribMin - 25 && minutesNow < ishaMin + 15) {
    return {
      phase: 'maghrib',
      labelAr: 'غسق المغرب وتجلي الشفق الأحمر',
      labelEn: 'Crimson Sunset & Maghrib Dusk',
      skyTop: '#090d16',
      skyMid: '#581c87',
      skyHorizon: '#e11d48',
      horizonGlow: '#f97316',
      sunCore: '#fef08a',
      sunMid: '#fb923c',
      sunCorona: '#e11d48',
      archStroke: '#f43f5e',
      starOpacity: 0.65,
      cloudOpacity: 0.25,
    };
  }
  return {
    phase: 'night',
    labelAr: 'قبة الليل الساكنة وأنوار السحر',
    labelEn: 'Starlit Night Sanctuary',
    skyTop: '#030712',
    skyMid: '#0f172a',
    skyHorizon: '#1e1b4b',
    horizonGlow: '#6366f1',
    sunCore: '#f8fafc',
    sunMid: '#e2e8f0',
    sunCorona: '#818cf8',
    archStroke: '#818cf8',
    starOpacity: 0.95,
    cloudOpacity: 0.12,
  };
}

export const CelestialPrayerArc: React.FC<CelestialPrayerArcProps> = ({
  now,
  doneMap,
  isAr,
  userState,
  onSelectPrayer,
}) => {
  const rtl = isAr;

  // Calculate accurate prayer times for the user's city/coordinates
  const calculatedTimes = useMemo(() => {
    const loc = userState?.settings?.prayerLocation;
    const defaultCity = detectDefaultCityFromTimezone();
    const cityObj = PRESET_CITIES.find((c) => c.id === loc?.city) || defaultCity || PRESET_CITIES[6];
    const lat = loc?.latitude ?? cityObj.lat;
    const lng = loc?.longitude ?? cityObj.lng;
    const method = (loc?.calculationMethod ?? cityObj.defaultMethod) as any;
    return calculatePrayerTimes(now, lat, lng, method);
  }, [now, userState?.settings?.prayerLocation]);

  const stopDetails = useMemo(() => {
    const toMins = (d: Date, fallback: number) =>
      d instanceof Date && !isNaN(d.getTime()) ? d.getHours() * 60 + d.getMinutes() : fallback;

    return STOPS.map((s) => {
      const dateObj = calculatedTimes[s.key];
      const minutes = toMins(dateObj, s.defaultMinutes);
      const formatted = dateObj
        ? formatPrayerTime(dateObj, isAr).replace(/\s*(ص|م|AM|PM)$/i, '')
        : `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      return {
        ...s,
        minutes,
        formatted,
      };
    });
  }, [calculatedTimes, isAr]);

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const fajrMin = stopDetails[0].minutes;
  const dhuhrMin = stopDetails[1].minutes;
  const asrMin = stopDetails[2].minutes;
  const maghribMin = stopDetails[3].minutes;
  const ishaMin = stopDetails[4].minutes;

  const isDaytime = minutesNow >= fajrMin && minutesNow <= maghribMin + 20;

  // Piece-wise linear interpolation between real prayer times so the Sun/Moon sits accurately relative to the 5 prayer beacons
  const currentT = useMemo(() => {
    if (minutesNow < fajrMin) {
      // Pre-fajr night segment (00:00 -> fajr maps to 0.01 -> 0.08)
      return Math.max(0.02, (minutesNow / Math.max(1, fajrMin)) * stopDetails[0].t);
    }
    for (let i = 0; i < stopDetails.length - 1; i++) {
      const curr = stopDetails[i];
      const next = stopDetails[i + 1];
      if (minutesNow >= curr.minutes && minutesNow <= next.minutes) {
        const span = Math.max(1, next.minutes - curr.minutes);
        const ratio = (minutesNow - curr.minutes) / span;
        return curr.t + ratio * (next.t - curr.t);
      }
    }
    // After Isha (isha -> 24:00 maps from 0.92 -> 0.98)
    const afterIshaSpan = Math.max(1, 24 * 60 - ishaMin);
    const afterRatio = Math.min(1, Math.max(0, (minutesNow - ishaMin) / afterIshaSpan));
    return stopDetails[4].t + afterRatio * (0.98 - stopDetails[4].t);
  }, [minutesNow, fajrMin, ishaMin, stopDetails]);

  const nextKey: PrayerKey = useMemo(() => {
    const upcoming = stopDetails.find((s) => s.minutes > minutesNow);
    return upcoming ? upcoming.key : 'fajr';
  }, [stopDetails, minutesNow]);

  const nextStop = useMemo(
    () => stopDetails.find((s) => s.key === nextKey) || stopDetails[0],
    [stopDetails, nextKey]
  );

  const minutesUntilNext = useMemo(() => {
    if (nextStop.minutes > minutesNow) {
      return nextStop.minutes - minutesNow;
    }
    return 24 * 60 - minutesNow + stopDetails[0].minutes;
  }, [nextStop, minutesNow, stopDetails]);

  const countdownLabel = useMemo(() => {
    const h = Math.floor(minutesUntilNext / 60);
    const m = minutesUntilNext % 60;
    if (isAr) {
      return h > 0 ? `بعد ${h}س و${m}د` : `بعد ${m} دقيقة`;
    }
    return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
  }, [minutesUntilNext, isAr]);

  const body = arcPoint(currentT, rtl);
  const atmosphere = getAtmospherePalette(
    minutesNow,
    fajrMin,
    dhuhrMin,
    asrMin,
    maghribMin,
    ishaMin
  );

  // Elevation factor (0 at horizon, 1 at zenith) for scaling rays & reflections
  const elevationFactor = Math.max(0.15, Math.min(1, (124 - body.y) / 72));

  return (
    <div className="relative select-none pt-0.5 pb-1">
      {/* ================================================================ */}
      {/* 1. OBSERVATORY DOME CANVAS (Photorealistic Sky, Sun/Moon, Horizon) */}
      {/* ================================================================ */}
      <div className="relative rounded-[24px] overflow-hidden border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_12px_32px_rgba(0,0,0,0.45)]">
        {/* Top Floating Status Bar Inside the Sky Dome */}
        <div className="absolute top-2.5 inset-x-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-bold text-white/95 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
            <span className="truncate">{isAr ? atmosphere.labelAr : atmosphere.labelEn}</span>
          </div>

          <button
            type="button"
            onClick={() => onSelectPrayer?.(nextKey)}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-amber-300/40 text-[10px] sm:text-[11px] font-bold text-amber-200 cursor-pointer active:scale-95 transition-all shadow-sm"
            title={isAr ? 'اضغط لتوثيق الصلاة أو ضبط السنن' : 'Tap to log prayer'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>
              {isAr ? `القادمة: ${nextStop.labelAr}` : `Next: ${nextStop.labelEn}`}
            </span>
            <span className="text-white/90 font-mono">({countdownLabel})</span>
          </button>
        </div>

        <svg
          viewBox="0 0 500 154"
          className="w-full h-[142px] sm:h-[164px] block overflow-hidden"
          aria-hidden="true"
        >
          <defs>
            {/* Dynamic Atmospheric Sky Dome Gradient */}
            <linearGradient id="skyDomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={atmosphere.skyTop} />
              <stop offset="56%" stopColor={atmosphere.skyMid} />
              <stop offset="100%" stopColor={atmosphere.skyHorizon} />
            </linearGradient>

            {/* Radial Atmospheric Glow Tracking the Sun/Moon X/Y */}
            <radialGradient
              id="celestialAtmosBloom"
              cx={body.x}
              cy={body.y}
              r="145"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={atmosphere.sunMid} stopOpacity={isDaytime ? '0.55' : '0.28'} />
              <stop offset="38%" stopColor={atmosphere.sunCorona} stopOpacity={isDaytime ? '0.22' : '0.12'} />
              <stop offset="100%" stopColor={atmosphere.skyTop} stopOpacity="0" />
            </radialGradient>

            {/* Horizon Reflection Shimmer Tracking Body X */}
            <radialGradient
              id="horizonReflectionGrad"
              cx={body.x}
              cy="132"
              r="95"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={atmosphere.sunMid} stopOpacity="0.65" />
              <stop offset="45%" stopColor={atmosphere.horizonGlow} stopOpacity="0.25" />
              <stop offset="100%" stopColor={atmosphere.skyHorizon} stopOpacity="0" />
            </radialGradient>

            {/* Active Solar Trajectory Path Gradient */}
            <linearGradient id="arcActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#fde047" stopOpacity="1" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0.95" />
            </linearGradient>

            {/* Photorealistic 3D Solar Photosphere Core */}
            <radialGradient id="photosphereCore" cx="42%" cy="40%" r="58%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor={atmosphere.sunCore} />
              <stop offset="78%" stopColor={atmosphere.sunMid} />
              <stop offset="100%" stopColor={atmosphere.sunCorona} />
            </radialGradient>

            {/* Solar Outer Corona Halo */}
            <radialGradient id="solarCoronaHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={atmosphere.sunMid} stopOpacity="0.9" />
              <stop offset="45%" stopColor={atmosphere.sunCorona} stopOpacity="0.45" />
              <stop offset="100%" stopColor={atmosphere.sunCorona} stopOpacity="0" />
            </radialGradient>

            {/* Volumetric Crepuscular God Rays Gradient */}
            <linearGradient id="godRayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={atmosphere.sunCore} stopOpacity="0.36" />
              <stop offset="60%" stopColor={atmosphere.sunMid} stopOpacity="0.10" />
              <stop offset="100%" stopColor={atmosphere.sunCorona} stopOpacity="0" />
            </linearGradient>

            {/* 3D Pearlescent Moon Gradient */}
            <linearGradient id="lunarPearlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#fef9c3" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>

            {/* Clip Path for Progressed Portion of the Arc */}
            <clipPath id="arcProgressClip">
              {rtl ? (
                <rect x={body.x} y="0" width={500 - body.x} height="154" />
              ) : (
                <rect x="0" y="0" width={body.x} height="154" />
              )}
            </clipPath>
          </defs>

          {/* 1. Base Sky Dome Backdrop */}
          <rect x="0" y="0" width="500" height="154" fill="url(#skyDomeGrad)" />

          {/* 2. Dynamic Celestial Atmospheric Bloom Following Sun/Moon */}
          <rect x="0" y="0" width="500" height="154" fill="url(#celestialAtmosBloom)" />

          {/* 3. Twinkling Cosmic Starfield (Visible at Night, Fajr & Maghrib) */}
          {atmosphere.starOpacity > 0 && (
            <g opacity={atmosphere.starOpacity}>
              {STARFIELD.map((st, idx) => (
                <circle
                  key={idx}
                  cx={st.x}
                  cy={st.y}
                  r={st.r}
                  fill="#ffffff"
                >
                  <animate
                    attributeName="opacity"
                    values="0.25;1;0.25"
                    dur={st.dur}
                    begin={st.delay}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
              {/* Subtle Milky Way / Cosmic Dust Wisps */}
              <ellipse
                cx="250"
                cy="38"
                rx="190"
                ry="18"
                fill="#818cf8"
                opacity="0.08"
                transform="rotate(-8 250 38)"
              />
            </g>
          )}

          {/* 4. Volumetric Crepuscular God Rays (Daytime Only) */}
          {isDaytime && (
            <g opacity={0.55 * elevationFactor} style={{ mixBlendMode: 'screen' }}>
              <polygon
                points={`${body.x},${body.y} ${body.x - 135},154 ${body.x - 75},154`}
                fill="url(#godRayGrad)"
              />
              <polygon
                points={`${body.x},${body.y} ${body.x - 48},154 ${body.x + 12},154`}
                fill="url(#godRayGrad)"
              />
              <polygon
                points={`${body.x},${body.y} ${body.x + 35},154 ${body.x + 105},154`}
                fill="url(#godRayGrad)"
              />
              <polygon
                points={`${body.x},${body.y} ${body.x + 115},154 ${body.x + 175},154`}
                fill="url(#godRayGrad)"
              />
            </g>
          )}

          {/* 5. Soft Illuminated Atmospheric Clouds */}
          {atmosphere.cloudOpacity > 0 && (
            <g opacity={atmosphere.cloudOpacity} fill="#ffffff">
              <g transform="translate(65, 48)">
                <ellipse cx="24" cy="10" rx="26" ry="7" opacity="0.45" />
                <ellipse cx="16" cy="7" rx="14" ry="6" opacity="0.6" />
                <ellipse cx="32" cy="8" rx="12" ry="5" opacity="0.5" />
              </g>
              <g transform="translate(355, 36)">
                <ellipse cx="28" cy="10" rx="30" ry="7.5" opacity="0.4" />
                <ellipse cx="20" cy="6" rx="16" ry="6.5" opacity="0.55" />
                <ellipse cx="38" cy="8" rx="14" ry="5.5" opacity="0.45" />
              </g>
            </g>
          )}

          {/* 6. Subtle Celestial Meridian Grid & Horizon Baseline */}
          <ellipse
            cx="250"
            cy="122"
            rx="222"
            ry="14"
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeDasharray="2 5"
          />

          {/* 7. Full Solar/Lunar Orbit Track (Dashed Future Guide) */}
          <path
            d="M 28 122 Q 250 -14 472 122"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2"
            strokeDasharray="4 6"
            strokeLinecap="round"
          />

          {/* 8. Illuminated Completed Trajectory Arc */}
          <g clipPath="url(#arcProgressClip)">
            {/* Soft Outer Glow on Traversed Path */}
            <path
              d="M 28 122 Q 250 -14 472 122"
              fill="none"
              stroke={atmosphere.archStroke}
              strokeWidth="7"
              strokeOpacity="0.28"
              strokeLinecap="round"
            />
            <path
              d="M 28 122 Q 250 -14 472 122"
              fill="none"
              stroke="url(#arcActiveGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </g>

          {/* 9. Five 3D Jewel Prayer Beacons Along the Horizon Arc */}
          {stopDetails.map((s) => {
            const p = arcPoint(s.t, rtl);
            const done = doneMap[s.key];
            const isNext = s.key === nextKey && !done;
            return (
              <g
                key={s.key}
                onClick={() => onSelectPrayer?.(s.key)}
                className="cursor-pointer"
              >
                {/* Invisible 44px Hit Target for Effortless Touch */}
                <circle cx={p.x} cy={p.y} r={22} fill="transparent" />

                {/* Next Prayer Pulsing Beacon Ring */}
                {isNext && (
                  <>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={13}
                      fill="none"
                      stroke="#fde047"
                      strokeWidth="1.6"
                      opacity="0.75"
                    >
                      <animate
                        attributeName="r"
                        values="8;16;8"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.85;0.1;0.85"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={9}
                      fill="rgba(250,204,21,0.22)"
                    />
                  </>
                )}

                {/* Completed Emerald Halo or Pending Jewel Node */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={done ? 6.5 : isNext ? 6 : 4.5}
                  fill={done ? '#10b981' : isNext ? '#fde047' : '#0f172a'}
                  stroke={done ? '#a7f3d0' : isNext ? '#ffffff' : 'rgba(255,255,255,0.65)'}
                  strokeWidth={done || isNext ? 2 : 1.5}
                />

                {/* Specular Jewel Highlight */}
                <circle
                  cx={p.x - 1.2}
                  cy={p.y - 1.2}
                  r={1.3}
                  fill="#ffffff"
                  opacity="0.85"
                />
              </g>
            );
          })}

          {/* ============================================================== */}
          {/* 10. PHOTOREALISTIC SUN (DAY) OR 3D CRESCENT MOON (NIGHT)       */}
          {/* ============================================================== */}
          <g
            transform={`translate(${body.x}, ${body.y})`}
            onClick={() => onSelectPrayer?.(nextKey)}
            className="cursor-pointer"
          >
            {isDaytime ? (
              <>
                {/* Layer A: Wide Atmospheric Corona Halo */}
                <circle r={34} fill="url(#solarCoronaHalo)" />

                {/* Layer B: Pulsing Solar Chromosphere Wave */}
                <circle r={21} fill={atmosphere.sunMid} opacity="0.22">
                  <animate
                    attributeName="r"
                    values="18;24;18"
                    dur="3.6s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.28;0.12;0.28"
                    dur="3.6s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Layer C: Rotating 12-Ray Solar Crown */}
                <g opacity="0.85">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="28s"
                    repeatCount="indefinite"
                  />
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const angle = idx * 30;
                    const isLong = idx % 2 === 0;
                    return (
                      <polygon
                        key={idx}
                        points={isLong ? '-1.6,-11 0,-22 1.6,-11' : '-1.1,-11 0,-17 1.1,-11'}
                        fill={isLong ? '#fef08a' : '#fbbf24'}
                        opacity={isLong ? '0.9' : '0.65'}
                        transform={`rotate(${angle})`}
                      />
                    );
                  })}
                </g>

                {/* Layer D: Counter-Rotating Warm Flare Ring */}
                <g opacity="0.55">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="360"
                    to="0"
                    dur="19s"
                    repeatCount="indefinite"
                  />
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <polygon
                      key={idx}
                      points="-2,-10 0,-19 2,-10"
                      fill={atmosphere.sunCorona}
                      transform={`rotate(${idx * 45 + 15})`}
                    />
                  ))}
                </g>

                {/* Layer E: 3D Blinding Photosphere Core */}
                <circle
                  r={11.5}
                  fill="url(#photosphereCore)"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />

                {/* Layer F: Inner Specular Hot-Spot & Subtle Lens Flare */}
                <circle cx="-3" cy="-3" r="4.2" fill="#ffffff" opacity="0.9" />
                <circle
                  cx={rtl ? -18 : 18}
                  cy="8"
                  r="2.4"
                  fill="#fef08a"
                  opacity="0.45"
                />
                <circle
                  cx={rtl ? -28 : 28}
                  cy="13"
                  r="4"
                  fill="none"
                  stroke="#fde047"
                  strokeWidth="0.8"
                  opacity="0.35"
                />
              </>
            ) : (
              <>
                {/* Nighttime Layer A: Deep Lunar Nocturnal Halo */}
                <circle r={30} fill="url(#solarCoronaHalo)" opacity="0.65" />

                {/* Nighttime Layer B: Subtle Pulsing Moonbeam Ring */}
                <circle r={17} fill="#818cf8" opacity="0.18">
                  <animate
                    attributeName="r"
                    values="15;20;15"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Nighttime Layer C: Earthshine Full Lunar Disc & Subtle Craters */}
                <circle
                  r={11.5}
                  fill="#cbd5e1"
                  opacity="0.16"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="0.6"
                />
                <circle cx="-3" cy="-2" r="2.1" fill="#94a3b8" opacity="0.18" />
                <circle cx="2" cy="4" r="1.5" fill="#94a3b8" opacity="0.15" />

                {/* Nighttime Layer D: Sculpted 3D Pearlescent Crescent Moon */}
                <path
                  d="M 3.5 -10.8 A 11.2 11.2 0 1 0 10.8 4.2 A 8.6 8.6 0 1 1 3.5 -10.8 Z"
                  fill="url(#lunarPearlGrad)"
                  stroke="#ffffff"
                  strokeWidth="0.6"
                />

                {/* Nighttime Layer E: Companion Evening Star (Zuhrah) */}
                <g transform="translate(-14, -8)">
                  <path
                    d="M 0 -3.5 L 0.9 -0.9 L 3.5 0 L 0.9 0.9 L 0 3.5 L -0.9 0.9 L -3.5 0 L -0.9 -0.9 Z"
                    fill="#fef08a"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.5;1;0.5"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              </>
            )}
          </g>

          {/* ============================================================== */}
          {/* 11. HORIZON SILHOUETTE & SHIMMERING WATER/DUNE REFLECTION       */}
          {/* ============================================================== */}
          {/* Horizon Water/Desert Light Reflection Directly Under Sun/Moon */}
          <ellipse
            cx={body.x}
            cy="138"
            rx="85"
            ry="16"
            fill="url(#horizonReflectionGrad)"
          />
          {/* Shimmering Horizontal Light Ripples Under Body */}
          <g opacity="0.55" stroke={atmosphere.sunMid} strokeLinecap="round">
            <line x1={body.x - 24} y1="133" x2={body.x + 24} y2="133" strokeWidth="1.5" />
            <line x1={body.x - 16} y1="138" x2={body.x + 16} y2="138" strokeWidth="1.2" opacity="0.75" />
            <line x1={body.x - 9} y1="143" x2={body.x + 9} y2="143" strokeWidth="1" opacity="0.5" />
          </g>

          {/* Serene Layered Horizon Dunes & Mosque Silhouette */}
          <path
            d="M 0 136 Q 90 124 185 133 T 365 130 T 500 135 L 500 154 L 0 154 Z"
            fill="rgba(7, 10, 19, 0.55)"
          />
          <path
            d="M 0 142 Q 125 132 250 140 T 500 139 L 500 154 L 0 154 Z"
            fill="rgba(5, 8, 15, 0.85)"
          />
          {/* Subtle Architectural Mihrab Dome & Minaret Silhouette on Left/Right */}
          <g fill="rgba(5, 8, 15, 0.92)">
            <path d="M 48 142 Q 58 128 68 142 Z" />
            <rect x="72" y="122" width="2.6" height="20" rx="1" />
            <polygon points="73.3,117 71.2,122 75.4,122" />
          </g>
        </svg>
      </div>

      {/* ================================================================ */}
      {/* 2. FIVE INTERACTIVE PRAYER CHIPS WITH REAL CALCULATED TIMES       */}
      {/* ================================================================ */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mt-2.5">
        {stopDetails.map((s) => {
          const done = doneMap[s.key];
          const isNext = s.key === nextKey && !done;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelectPrayer?.(s.key)}
              aria-label={`${ isAr ? s.labelAr : s.labelEn } ${s.formatted}`}
              className={`min-h-[50px] py-1.5 px-1.5 rounded-2xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 ${
                done
                  ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                  : isNext
                  ? 'bg-gradient-to-b from-amber-400/30 to-amber-500/15 text-amber-100 border border-amber-300/65 ring-1 ring-amber-300/40 shadow-[0_6px_16px_rgba(245,158,11,0.22)]'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {done ? (
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 text-zinc-950 inline-flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : isNext ? (
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/35 shrink-0" />
                )}
                <span className="truncate">{isAr ? s.labelAr : s.labelEn}</span>
              </div>
              <span
                className={`text-[10px] font-mono tabular-nums leading-none ${
                  done
                    ? 'text-emerald-300'
                    : isNext
                    ? 'text-amber-300 font-extrabold'
                    : 'text-zinc-400'
                }`}
              >
                <bdi dir="ltr">{s.formatted}</bdi>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
