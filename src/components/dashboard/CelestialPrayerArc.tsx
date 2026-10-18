import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Compass, RotateCcw, Sparkles } from 'lucide-react';
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
  defaultMinutes: number;
}

// Ordered from right (0 = start of day in RTL) to left (1 = end of day in RTL)
const STOPS: ArcStop[] = [
  { key: 'fajr', labelAr: 'الفجر', labelEn: 'Fajr', t: 0.09, defaultMinutes: 5 * 60 },
  { key: 'dhuhr', labelAr: 'الظهر', labelEn: 'Dhuhr', t: 0.32, defaultMinutes: 12 * 60 + 15 },
  { key: 'asr', labelAr: 'العصر', labelEn: 'Asr', t: 0.54, defaultMinutes: 15 * 60 + 35 },
  { key: 'maghrib', labelAr: 'المغرب', labelEn: 'Maghrib', t: 0.76, defaultMinutes: 18 * 60 + 15 },
  { key: 'isha', labelAr: 'العشاء', labelEn: 'Isha', t: 0.91, defaultMinutes: 19 * 60 + 40 },
];

// Deterministic rich starfield for night & twilight
const STARS = Array.from({ length: 78 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const r1 = seed / 233280;
  const r2 = ((seed * 7 + 13) % 233280) / 233280;
  const r3 = ((seed * 31 + 101) % 233280) / 233280;
  return {
    x: 0.02 + r1 * 0.96,
    y: 0.04 + r2 * 0.64,
    size: 0.6 + r3 * 1.75,
    phase: r1 * Math.PI * 2,
    speed: 1.3 + r2 * 2.4,
  };
});

// Volumetric multi-puff cloud clusters with soft organic layering
const CLOUD_CLUSTERS = [
  {
    baseX: 0.16,
    baseY: 0.31,
    scale: 1.15,
    speed: 0.0022,
    puffs: [
      { dx: -48, dy: 8, r: 28 },
      { dx: -22, dy: -4, r: 38 },
      { dx: 12, dy: -9, r: 44 },
      { dx: 44, dy: 2, r: 34 },
      { dx: 72, dy: 10, r: 24 },
    ],
  },
  {
    baseX: 0.52,
    baseY: 0.22,
    scale: 0.92,
    speed: 0.0015,
    puffs: [
      { dx: -40, dy: 6, r: 26 },
      { dx: -12, dy: -6, r: 35 },
      { dx: 20, dy: -4, r: 33 },
      { dx: 48, dy: 6, r: 24 },
    ],
  },
  {
    baseX: 0.81,
    baseY: 0.34,
    scale: 1.2,
    speed: 0.0019,
    puffs: [
      { dx: -50, dy: 8, r: 30 },
      { dx: -20, dy: -5, r: 40 },
      { dx: 14, dy: -10, r: 46 },
      { dx: 46, dy: -2, r: 35 },
      { dx: 74, dy: 9, r: 26 },
    ],
  },
];

// Quadratic Bezier point in pixel coordinates for canvas (width W, horizon Y)
function getArcPoint(t: number, rtl: boolean, width: number, horizonY: number): { x: number; y: number } {
  const u = rtl ? 1 - t : t;
  const padX = width * 0.065;
  const x0 = padX;
  const y0 = horizonY - 8;
  const x1 = width * 0.5;
  const y1 = -horizonY * 0.18;
  const x2 = width - padX;
  const y2 = horizonY - 8;
  const omt = 1 - u;
  const x = omt * omt * x0 + 2 * omt * u * x1 + u * u * x2;
  const y = omt * omt * y0 + 2 * omt * u * y1 + u * u * y2;
  return { x, y };
}

function getArcProgressForMinutes(
  mins: number,
  fajrMin: number,
  ishaMin: number,
  stopDetails: Array<ArcStop & { minutes: number; formatted: string }>
): number {
  if (mins < fajrMin) {
    return Math.max(0.02, (mins / Math.max(1, fajrMin)) * stopDetails[0].t);
  }
  for (let i = 0; i < stopDetails.length - 1; i++) {
    const curr = stopDetails[i];
    const next = stopDetails[i + 1];
    if (mins >= curr.minutes && mins <= next.minutes) {
      const span = Math.max(1, next.minutes - curr.minutes);
      const ratio = (mins - curr.minutes) / span;
      return curr.t + ratio * (next.t - curr.t);
    }
  }
  const afterIshaSpan = Math.max(1, 24 * 60 - ishaMin);
  const afterRatio = Math.min(1, Math.max(0, (mins - ishaMin) / afterIshaSpan));
  return stopDetails[4].t + afterRatio * (0.98 - stopDetails[4].t);
}

interface SkyColorKeyframe {
  min: number;
  labelAr: string;
  labelEn: string;
  zenith: [number, number, number];
  mid: [number, number, number];
  horizon: [number, number, number];
  glow: [number, number, number];
  sunCore: [number, number, number];
  sunHalo: [number, number, number];
  starAlpha: number;
  cloudAlpha: number;
  mosqueLit: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpRGB(c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

function rgbStr(c: [number, number, number], alpha = 1): string {
  return alpha >= 1
    ? `rgb(${c[0]}, ${c[1]}, ${c[2]})`
    : `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha.toFixed(3)})`;
}

// Smoothly interpolates sky colors across the entire 24-hour cycle based on actual prayer minutes
function computeContinuousAtmosphere(
  minutes: number,
  fajrMin: number,
  dhuhrMin: number,
  asrMin: number,
  maghribMin: number,
  ishaMin: number
) {
  const keyframes: SkyColorKeyframe[] = [
    {
      min: 0,
      labelAr: 'هدوء الليل العميق وسكون السحر',
      labelEn: 'Deep Midnight & Suhoor Serenity',
      zenith: [3, 7, 18],
      mid: [12, 20, 44],
      horizon: [28, 36, 76],
      glow: [99, 102, 241],
      sunCore: [248, 250, 252],
      sunHalo: [129, 140, 248],
      starAlpha: 0.95,
      cloudAlpha: 0.14,
      mosqueLit: 0.95,
    },
    {
      min: Math.max(10, fajrMin - 35),
      labelAr: 'ثلث الليل الأخير واقتراب الفجر',
      labelEn: 'Pre-Dawn Tahajjud Sanctuary',
      zenith: [8, 12, 30],
      mid: [25, 28, 68],
      horizon: [76, 48, 108],
      glow: [168, 85, 247],
      sunCore: [254, 249, 195],
      sunHalo: [192, 132, 252],
      starAlpha: 0.85,
      cloudAlpha: 0.22,
      mosqueLit: 0.9,
    },
    {
      min: fajrMin + 15,
      labelAr: 'شفق الفجر الصادق ونسمات البكور',
      labelEn: 'Fajr Rose-Gold Dawn',
      zenith: [15, 23, 58],
      mid: [67, 56, 130],
      horizon: [244, 114, 182],
      glow: [251, 146, 60],
      sunCore: [255, 251, 235],
      sunHalo: [249, 115, 22],
      starAlpha: 0.35,
      cloudAlpha: 0.45,
      mosqueLit: 0.65,
    },
    {
      min: fajrMin + 85,
      labelAr: 'إشراق الضحى والذهب الساطع',
      labelEn: 'Golden Sunrise & Dhuha Radiance',
      zenith: [12, 74, 110],
      mid: [2, 132, 199],
      horizon: [253, 224, 71],
      glow: [245, 158, 11],
      sunCore: [255, 255, 255],
      sunHalo: [251, 191, 36],
      starAlpha: 0,
      cloudAlpha: 0.65,
      mosqueLit: 0.1,
    },
    {
      min: dhuhrMin,
      labelAr: 'سماء الظهيرة الساطعة وذروة النهار',
      labelEn: 'High Noon Zenith Sky',
      zenith: [4, 72, 124],
      mid: [14, 150, 218],
      horizon: [176, 224, 252],
      glow: [253, 224, 71],
      sunCore: [255, 255, 255],
      sunHalo: [250, 204, 21],
      starAlpha: 0,
      cloudAlpha: 0.78,
      mosqueLit: 0,
    },
    {
      min: asrMin,
      labelAr: 'أصيل العصر الذهبي الدافئ',
      labelEn: 'Warm Golden Asr Horizon',
      zenith: [15, 58, 102],
      mid: [56, 126, 174],
      horizon: [252, 205, 72],
      glow: [249, 115, 22],
      sunCore: [255, 252, 235],
      sunHalo: [245, 158, 11],
      starAlpha: 0,
      cloudAlpha: 0.72,
      mosqueLit: 0.15,
    },
    {
      min: maghribMin - 10,
      labelAr: 'غسق المغرب وتجلي الشفق القرمزي',
      labelEn: 'Crimson Maghrib Sunset',
      zenith: [19, 18, 54],
      mid: [124, 45, 98],
      horizon: [244, 63, 94],
      glow: [251, 146, 60],
      sunCore: [254, 240, 138],
      sunHalo: [225, 29, 72],
      starAlpha: 0.4,
      cloudAlpha: 0.55,
      mosqueLit: 0.85,
    },
    {
      min: ishaMin + 10,
      labelAr: 'قبة الليل المرصعة بالنجوم وأنوار العشاء',
      labelEn: 'Starlit Isha Sanctuary',
      zenith: [3, 7, 18],
      mid: [15, 23, 42],
      horizon: [30, 27, 75],
      glow: [99, 102, 241],
      sunCore: [248, 250, 252],
      sunHalo: [129, 140, 248],
      starAlpha: 0.95,
      cloudAlpha: 0.18,
      mosqueLit: 0.95,
    },
    {
      min: 1440,
      labelAr: 'هدوء الليل العميق وسكون السحر',
      labelEn: 'Deep Midnight & Suhoor Serenity',
      zenith: [3, 7, 18],
      mid: [12, 20, 44],
      horizon: [28, 36, 76],
      glow: [99, 102, 241],
      sunCore: [248, 250, 252],
      sunHalo: [129, 140, 248],
      starAlpha: 0.95,
      cloudAlpha: 0.14,
      mosqueLit: 0.95,
    },
  ];

  const m = ((minutes % 1440) + 1440) % 1440;
  let k0 = keyframes[0];
  let k1 = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (m >= keyframes[i].min && m <= keyframes[i + 1].min) {
      k0 = keyframes[i];
      k1 = keyframes[i + 1];
      break;
    }
  }

  const span = Math.max(1, k1.min - k0.min);
  const ratio = Math.min(1, Math.max(0, (m - k0.min) / span));
  const s = ratio * ratio * (3 - 2 * ratio);

  return {
    labelAr: ratio < 0.5 ? k0.labelAr : k1.labelAr,
    labelEn: ratio < 0.5 ? k0.labelEn : k1.labelEn,
    zenith: lerpRGB(k0.zenith, k1.zenith, s),
    mid: lerpRGB(k0.mid, k1.mid, s),
    horizon: lerpRGB(k0.horizon, k1.horizon, s),
    glow: lerpRGB(k0.glow, k1.glow, s),
    sunCore: lerpRGB(k0.sunCore, k1.sunCore, s),
    sunHalo: lerpRGB(k0.sunHalo, k1.sunHalo, s),
    starAlpha: lerp(k0.starAlpha, k1.starAlpha, s),
    cloudAlpha: lerp(k0.cloudAlpha, k1.cloudAlpha, s),
    mosqueLit: lerp(k0.mosqueLit, k1.mosqueLit, s),
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interactive time-travel scrubbing state (null = live real-time)
  const [scrubMinutes, setScrubMinutes] = useState<number | null>(null);
  const [isDraggingSky, setIsDraggingSky] = useState(false);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

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

  const realMinutesNow = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = scrubMinutes !== null ? scrubMinutes : realMinutesNow;
  const animatedMinutesRef = useRef<number>(targetMinutes);

  const fajrMin = stopDetails[0].minutes;
  const dhuhrMin = stopDetails[1].minutes;
  const asrMin = stopDetails[2].minutes;
  const maghribMin = stopDetails[3].minutes;
  const ishaMin = stopDetails[4].minutes;

  const nextKey: PrayerKey = useMemo(() => {
    const upcoming = stopDetails.find((s) => s.minutes > realMinutesNow);
    return upcoming ? upcoming.key : 'fajr';
  }, [stopDetails, realMinutesNow]);

  const nextStop = useMemo(
    () => stopDetails.find((s) => s.key === nextKey) || stopDetails[0],
    [stopDetails, nextKey]
  );

  const minutesUntilNext = useMemo(() => {
    if (nextStop.minutes > realMinutesNow) {
      return nextStop.minutes - realMinutesNow;
    }
    return 24 * 60 - realMinutesNow + stopDetails[0].minutes;
  }, [nextStop, realMinutesNow, stopDetails]);

  const countdownLabel = useMemo(() => {
    const h = Math.floor(minutesUntilNext / 60);
    const m = minutesUntilNext % 60;
    if (isAr) {
      return h > 0 ? `بعد ${h}س و${m}د` : `بعد ${m} دقيقة`;
    }
    return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
  }, [minutesUntilNext, isAr]);

  const hudAtmosphere = useMemo(
    () =>
      computeContinuousAtmosphere(
        targetMinutes,
        fajrMin,
        dhuhrMin,
        asrMin,
        maghribMin,
        ishaMin
      ),
    [targetMinutes, fajrMin, dhuhrMin, asrMin, maghribMin, ishaMin]
  );

  const formattedScrubTime = useMemo(() => {
    const m = Math.round(((targetMinutes % 1440) + 1440) % 1440);
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    const periodAr = hh >= 12 ? 'م' : 'ص';
    const periodEn = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${isAr ? periodAr : periodEn}`;
  }, [targetMinutes, isAr]);

  // Convert pointer X on the sky dome into simulated minutes of the day
  const handleSkyPointer = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width)));
    const tProgress = rtl ? 1 - relX : relX;
    const minStart = Math.max(0, fajrMin - 60);
    const minEnd = Math.min(1439, ishaMin + 150);
    const mappedMin = Math.round(minStart + tProgress * (minEnd - minStart));
    setScrubMinutes(mappedMin);
  };

  // High-DPI Retina 60FPS Atmospheric Optical Canvas Renderer with Smooth Time-Lapse Gliding
  useEffect(() => {
    let animId = 0;
    const startTime = performance.now();

    const renderFrame = (ts: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Smoothly glide animatedMinutesRef toward targetMinutes (instant when actively dragging, smooth 60fps time-lapse when clicking presets)
      const diff = targetMinutes - animatedMinutesRef.current;
      if (isDraggingSky || Math.abs(diff) < 0.35) {
        animatedMinutesRef.current = targetMinutes;
      } else {
        animatedMinutesRef.current += diff * 0.12;
      }
      const frameMinutes = animatedMinutesRef.current;

      const atmosphere = computeContinuousAtmosphere(
        frameMinutes,
        fajrMin,
        dhuhrMin,
        asrMin,
        maghribMin,
        ishaMin
      );
      const isDaytime = frameMinutes >= fajrMin - 10 && frameMinutes <= maghribMin + 18;
      const currentT = getArcProgressForMinutes(frameMinutes, fajrMin, ishaMin, stopDetails);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(300, rect.width);
      const height = Math.max(220, rect.height);

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const elapsed = (ts - startTime) / 1000;
      const horizonY = height * 0.75;
      const body = getArcPoint(currentT, rtl, width, horizonY);

      // -----------------------------------------------------------------
      // 1. MULTI-STOP ATMOSPHERIC SKY DOME GRADIENT (Rayleigh Scattering)
      // -----------------------------------------------------------------
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, rgbStr(atmosphere.zenith));
      skyGrad.addColorStop(0.54, rgbStr(atmosphere.mid));
      skyGrad.addColorStop(1, rgbStr(atmosphere.horizon));
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // -----------------------------------------------------------------
      // 2. MIE SCATTERING SOLAR/LUNAR ATMOSPHERIC GLOW
      // -----------------------------------------------------------------
      const mieRadius = Math.max(width, height) * 0.65;
      const mieGrad = ctx.createRadialGradient(body.x, body.y, 2, body.x, body.y, mieRadius);
      mieGrad.addColorStop(0, rgbStr(atmosphere.sunCore, isDaytime ? 0.65 : 0.28));
      mieGrad.addColorStop(0.24, rgbStr(atmosphere.sunHalo, isDaytime ? 0.36 : 0.15));
      mieGrad.addColorStop(0.62, rgbStr(atmosphere.glow, isDaytime ? 0.14 : 0.05));
      mieGrad.addColorStop(1, rgbStr(atmosphere.zenith, 0));
      ctx.fillStyle = mieGrad;
      ctx.fillRect(0, 0, width, horizonY + 20);

      // Warm horizon belt glow
      const horizonBelt = ctx.createLinearGradient(0, horizonY - 65, 0, horizonY + 12);
      horizonBelt.addColorStop(0, rgbStr(atmosphere.glow, 0));
      horizonBelt.addColorStop(0.75, rgbStr(atmosphere.glow, isDaytime ? 0.32 : 0.18));
      horizonBelt.addColorStop(1, rgbStr(atmosphere.horizon, 0.48));
      ctx.fillStyle = horizonBelt;
      ctx.fillRect(0, horizonY - 65, width, 77);

      // -----------------------------------------------------------------
      // 3. TWINKLING COSMIC STARFIELD (Night / Twilight)
      // -----------------------------------------------------------------
      if (atmosphere.starAlpha > 0.02) {
        ctx.save();
        for (let i = 0; i < STARS.length; i++) {
          const st = STARS[i];
          const sx = st.x * width;
          const sy = st.y * horizonY * 0.92;
          const twinkle = 0.35 + 0.65 * Math.sin(elapsed * st.speed + st.phase);
          const alpha = atmosphere.starAlpha * twinkle;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sx, sy, st.size, 0, Math.PI * 2);
          ctx.fill();

          if (st.size > 1.8 && alpha > 0.48) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.45).toFixed(3)})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(sx - 4.5, sy);
            ctx.lineTo(sx + 4.5, sy);
            ctx.moveTo(sx, sy - 4.5);
            ctx.lineTo(sx, sy + 4.5);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------
      // 4. VOLUMETRIC CREPUSCULAR GOD RAYS (Rotating Optical Light Shafts)
      // -----------------------------------------------------------------
      if (isDaytime) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const rayCount = 11;
        for (let r = 0; r < rayCount; r++) {
          const baseAngle = (r / rayCount) * Math.PI * 1.2 - Math.PI * 0.1;
          const sway = Math.sin(elapsed * 0.42 + r * 1.3) * 0.045;
          const angle = baseAngle + sway;
          const spread = 0.05 + (r % 3) * 0.018;
          const rayLen = Math.max(width, height) * 0.95;

          const rayGrad = ctx.createRadialGradient(body.x, body.y, 4, body.x, body.y, rayLen * 0.78);
          rayGrad.addColorStop(0, rgbStr(atmosphere.sunCore, 0.24));
          rayGrad.addColorStop(0.42, rgbStr(atmosphere.sunHalo, 0.08));
          rayGrad.addColorStop(1, 'rgba(255,255,255,0)');

          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(body.x, body.y);
          ctx.lineTo(
            body.x + Math.cos(angle - spread) * rayLen,
            body.y + Math.sin(angle - spread) * rayLen
          );
          ctx.lineTo(
            body.x + Math.cos(angle + spread) * rayLen,
            body.y + Math.sin(angle + spread) * rayLen
          );
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // -----------------------------------------------------------------
      // 5. VOLUMETRIC MULTI-LAYERED CLOUDS WITH SOLAR SILVER-LINING
      // -----------------------------------------------------------------
      if (atmosphere.cloudAlpha > 0.05) {
        ctx.save();
        CLOUD_CLUSTERS.forEach((cluster, cIdx) => {
          const drift = ((elapsed * cluster.speed) % 1.2) - 0.1;
          const cx = ((cluster.baseX + drift) % 1.15) * width - width * 0.05;
          const cy = cluster.baseY * horizonY + Math.sin(elapsed * 0.6 + cIdx) * 2.5;

          const distToSun = Math.hypot(cx - body.x, cy - body.y);
          const rimIntensity = Math.max(0.15, Math.min(1, 1 - distToSun / (width * 0.55)));

          cluster.puffs.forEach((puff) => {
            const px = cx + puff.dx * cluster.scale;
            const py = cy + puff.dy * cluster.scale;
            const pr = puff.r * cluster.scale;

            const puffGrad = ctx.createRadialGradient(
              px + (body.x > px ? 5 : -5),
              py - pr * 0.35,
              pr * 0.08,
              px,
              py,
              pr
            );
            const highlightColor = isDaytime ? atmosphere.sunCore : ([203, 213, 225] as [number, number, number]);
            const midCloudColor = isDaytime
              ? lerpRGB([255, 255, 255], atmosphere.horizon, 0.35)
              : ([71, 85, 105] as [number, number, number]);

            puffGrad.addColorStop(0, rgbStr(highlightColor, atmosphere.cloudAlpha * (0.58 + rimIntensity * 0.35)));
            puffGrad.addColorStop(0.58, rgbStr(midCloudColor, atmosphere.cloudAlpha * 0.36));
            puffGrad.addColorStop(1, rgbStr(midCloudColor, 0));

            ctx.fillStyle = puffGrad;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
          });
        });
        ctx.restore();
      }

      // -----------------------------------------------------------------
      // 6. SOLAR / LUNAR ORBIT TRAJECTORY & ILLUMINATED PROGRESS ARC
      // -----------------------------------------------------------------
      const padX = width * 0.065;
      const startPt = { x: padX, y: horizonY - 8 };
      const ctrlPt = { x: width * 0.5, y: -horizonY * 0.18 };
      const endPt = { x: width - padX, y: horizonY - 8 };

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 7]);
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.quadraticCurveTo(ctrlPt.x, ctrlPt.y, endPt.x, endPt.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Illuminated traversed trajectory up to current Sun/Moon position
      ctx.save();
      ctx.beginPath();
      if (rtl) {
        ctx.rect(body.x, 0, width - body.x, horizonY + 10);
      } else {
        ctx.rect(0, 0, body.x, horizonY + 10);
      }
      ctx.clip();

      ctx.strokeStyle = rgbStr(atmosphere.sunHalo, 0.35);
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.quadraticCurveTo(ctrlPt.x, ctrlPt.y, endPt.x, endPt.y);
      ctx.stroke();

      const arcGrad = ctx.createLinearGradient(0, 0, width, 0);
      arcGrad.addColorStop(0, '#34d399');
      arcGrad.addColorStop(0.5, '#fde047');
      arcGrad.addColorStop(1, '#fb923c');
      ctx.strokeStyle = arcGrad;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.quadraticCurveTo(ctrlPt.x, ctrlPt.y, endPt.x, endPt.y);
      ctx.stroke();
      ctx.restore();
      ctx.restore();

      // -----------------------------------------------------------------
      // 7. FIVE LUMINOUS PRAYER BEACON NODES & FLOATING LABELS ON SKY ARC
      // -----------------------------------------------------------------
      stopDetails.forEach((s) => {
        const pt = getArcPoint(s.t, rtl, width, horizonY);
        const done = doneMap[s.key];
        const isNext = s.key === nextKey && !done;
        const distFromBody = Math.hypot(pt.x - body.x, pt.y - body.y);

        ctx.save();
        if (isNext) {
          const pulseR = 12 + Math.sin(elapsed * 3.2) * 3.5;
          const pulseGrad = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, pulseR * 1.4);
          pulseGrad.addColorStop(0, 'rgba(253, 224, 71, 0.78)');
          pulseGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = pulseGrad;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pulseR * 1.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (done) {
          const doneGlow = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, 12);
          doneGlow.addColorStop(0, 'rgba(16, 185, 129, 0.7)');
          doneGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = doneGlow;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = done ? '#10b981' : isNext ? '#fde047' : 'rgba(15, 23, 42, 0.75)';
        ctx.strokeStyle = done ? '#a7f3d0' : isNext ? '#ffffff' : 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = done || isNext ? 2.2 : 1.5;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, done ? 5.5 : isNext ? 6 : 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Floating prayer label above node when not occluded by Sun/Moon
        if (distFromBody > 34 && width >= 360) {
          ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = isNext
            ? '#fef08a'
            : done
            ? '#a7f3d0'
            : 'rgba(255, 255, 255, 0.82)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
          ctx.shadowBlur = 4;
          ctx.fillText(isAr ? s.labelAr : s.labelEn, pt.x, pt.y - 11);
        }
        ctx.restore();
      });

      // -----------------------------------------------------------------
      // 8. TRUE PHOTOGRAPHIC OPTICAL SUN OR SCULPTED 3D CRESCENT MOON
      // -----------------------------------------------------------------
      ctx.save();
      if (isDaytime) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const breath = 1 + Math.sin(elapsed * 2.1) * 0.05;

        // Layer A: Wide Atmospheric Optical Corona
        const outerCorona = ctx.createRadialGradient(
          body.x,
          body.y,
          2,
          body.x,
          body.y,
          76 * breath
        );
        outerCorona.addColorStop(0, 'rgba(255, 255, 255, 1)');
        outerCorona.addColorStop(0.18, 'rgba(255, 255, 255, 0.96)');
        outerCorona.addColorStop(0.34, rgbStr(atmosphere.sunCore, 0.78));
        outerCorona.addColorStop(0.62, rgbStr(atmosphere.sunHalo, 0.36));
        outerCorona.addColorStop(1, rgbStr(atmosphere.sunHalo, 0));
        ctx.fillStyle = outerCorona;
        ctx.beginPath();
        ctx.arc(body.x, body.y, 76 * breath, 0, Math.PI * 2);
        ctx.fill();

        // Layer B: Cinematic Horizontal Anamorphic Lens Streak
        const streakW = 115 * breath;
        const streakH = 3.5;
        const streakGrad = ctx.createLinearGradient(body.x - streakW, body.y, body.x + streakW, body.y);
        streakGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        streakGrad.addColorStop(0.32, rgbStr(atmosphere.sunCore, 0.38));
        streakGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
        streakGrad.addColorStop(0.68, rgbStr(atmosphere.sunCore, 0.38));
        streakGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = streakGrad;
        ctx.beginPath();
        ctx.ellipse(body.x, body.y, streakW, streakH, 0, 0, Math.PI * 2);
        ctx.fill();

        // Layer C: Diagonal & Vertical Optical Starburst Glint
        [Math.PI / 2, Math.PI / 4, -Math.PI / 4].forEach((ang, idx) => {
          const len = (idx === 0 ? 52 : 34) * breath;
          ctx.save();
          ctx.translate(body.x, body.y);
          ctx.rotate(ang);
          const glintGrad = ctx.createLinearGradient(-len, 0, len, 0);
          glintGrad.addColorStop(0, 'rgba(255,255,255,0)');
          glintGrad.addColorStop(0.5, rgbStr(atmosphere.sunCore, idx === 0 ? 0.6 : 0.4));
          glintGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = glintGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, len, 1.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Layer D: Optical Camera Bokeh Ghost Reflections along Axis to Center
        const centerAxisX = width * 0.5 - body.x;
        const centerAxisY = horizonY * 0.58 - body.y;
        [0.42, 0.76, 1.12].forEach((factor, idx) => {
          const fx = body.x + centerAxisX * factor;
          const fy = body.y + centerAxisY * factor;
          const fr = idx === 1 ? 13 : idx === 2 ? 19 : 7;
          const flareGrad = ctx.createRadialGradient(fx, fy, 1, fx, fy, fr);
          const flareCol = idx === 1 ? ([56, 189, 248] as [number, number, number]) : atmosphere.sunHalo;
          flareGrad.addColorStop(0, rgbStr(flareCol, 0.20));
          flareGrad.addColorStop(0.75, rgbStr(flareCol, 0.08));
          flareGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = flareGrad;
          ctx.beginPath();
          ctx.arc(fx, fy, fr, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        // Layer E: Soft Photographic Blinding Solar Core (Zero hard border!)
        const coreGrad = ctx.createRadialGradient(
          body.x,
          body.y,
          1,
          body.x,
          body.y,
          24
        );
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.48, '#ffffff');
        coreGrad.addColorStop(0.72, rgbStr(atmosphere.sunCore, 0.92));
        coreGrad.addColorStop(1, rgbStr(atmosphere.sunHalo, 0));
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(body.x, body.y, 24, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // NIGHTTIME: 3D Lunar Sphere with Earthshine, Maria Craters & Lit Crescent
        const moonHalo = ctx.createRadialGradient(body.x, body.y, 4, body.x, body.y, 52);
        moonHalo.addColorStop(0, 'rgba(226, 232, 240, 0.58)');
        moonHalo.addColorStop(0.42, 'rgba(129, 140, 248, 0.24)');
        moonHalo.addColorStop(1, 'rgba(129, 140, 248, 0)');
        ctx.fillStyle = moonHalo;
        ctx.beginPath();
        ctx.arc(body.x, body.y, 52, 0, Math.PI * 2);
        ctx.fill();

        // Dark Earthshine Lunar Sphere
        ctx.fillStyle = 'rgba(148, 163, 184, 0.16)';
        ctx.beginPath();
        ctx.arc(body.x, body.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // Illuminated Pearlescent Crescent Moon
        ctx.save();
        ctx.translate(body.x, body.y);
        const moonGrad = ctx.createLinearGradient(-14, -14, 14, 14);
        moonGrad.addColorStop(0, '#ffffff');
        moonGrad.addColorStop(0.6, '#fef9c3');
        moonGrad.addColorStop(1, '#93c5fd');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 15.5, -Math.PI * 0.38, Math.PI * 0.72, false);
        ctx.arc(-5.2, -2.6, 13, Math.PI * 0.65, -Math.PI * 0.32, true);
        ctx.closePath();
        ctx.fill();

        // Subtle Lunar Maria Craters on Lit Edge
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.beginPath();
        ctx.arc(7, 1.5, 2.3, 0, Math.PI * 2);
        ctx.arc(4.5, 6.5, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // -----------------------------------------------------------------
      // 9. DISTANT GLIDING BIRDS (Daytime) FOR LIVING DEPTH
      // -----------------------------------------------------------------
      if (isDaytime) {
        ctx.save();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.lineWidth = 1.25;
        ctx.lineCap = 'round';
        const flockBaseX = ((elapsed * 15) % (width + 120)) - 60;
        const flockBaseY = horizonY * 0.54 + Math.sin(elapsed * 0.8) * 6;
        [
          { dx: 0, dy: 0, s: 1 },
          { dx: -15, dy: 6, s: 0.82 },
          { dx: -28, dy: -3, s: 0.75 },
        ].forEach((b, idx) => {
          const bx = rtl ? width - flockBaseX + b.dx : flockBaseX + b.dx;
          const by = flockBaseY + b.dy;
          const flap = Math.sin(elapsed * 5.5 + idx * 1.4) * 3 * b.s;
          ctx.beginPath();
          ctx.moveTo(bx - 5.2 * b.s, by - flap);
          ctx.quadraticCurveTo(bx - 2 * b.s, by - 2.6 * b.s, bx, by);
          ctx.quadraticCurveTo(bx + 2 * b.s, by - 2.6 * b.s, bx + 5.2 * b.s, by - flap);
          ctx.stroke();
        });
        ctx.restore();
      }

      // -----------------------------------------------------------------
      // 10. PARALLAX MOUNTAIN RIDGES & SACRED MOSQUE SANCTUARY SKYLINE
      // -----------------------------------------------------------------
      ctx.save();
      const distantRidgeColor = lerpRGB(atmosphere.horizon, [10, 15, 28], 0.62);
      ctx.fillStyle = rgbStr(distantRidgeColor, 0.88);
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.quadraticCurveTo(width * 0.14, horizonY - 28, width * 0.31, horizonY - 10);
      ctx.quadraticCurveTo(width * 0.52, horizonY - 35, width * 0.72, horizonY - 12);
      ctx.quadraticCurveTo(width * 0.88, horizonY - 26, width, horizonY - 7);
      ctx.lineTo(width, horizonY + 4);
      ctx.lineTo(0, horizonY + 4);
      ctx.closePath();
      ctx.fill();

      const nearRidgeColor = lerpRGB(atmosphere.horizon, [6, 9, 18], 0.82);
      ctx.fillStyle = rgbStr(nearRidgeColor, 0.96);
      ctx.beginPath();
      ctx.moveTo(0, horizonY + 1);
      ctx.quadraticCurveTo(width * 0.22, horizonY - 16, width * 0.45, horizonY - 4);
      ctx.quadraticCurveTo(width * 0.74, horizonY - 18, width, horizonY - 1);
      ctx.lineTo(width, horizonY + 6);
      ctx.lineTo(0, horizonY + 6);
      ctx.closePath();
      ctx.fill();

      // Grand Sanctuary Mosque Silhouette (Left-Center on Coastline)
      const mx = width * 0.17;
      const my = horizonY - 1;
      ctx.fillStyle = '#070a13';

      ctx.fillRect(mx - 36, my - 12, 72, 13);
      ctx.fillRect(mx - 24, my - 18, 48, 7);

      // Central Grand Dome
      ctx.beginPath();
      ctx.arc(mx, my - 18, 16, Math.PI, 0, false);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(mx, my - 34);
      ctx.lineTo(mx, my - 40);
      ctx.stroke();

      // Two Flanking Smaller Domes
      ctx.fillStyle = '#070a13';
      ctx.beginPath();
      ctx.arc(mx - 20, my - 12, 8.5, Math.PI, 0, false);
      ctx.arc(mx + 20, my - 12, 8.5, Math.PI, 0, false);
      ctx.fill();

      // Twin Slender Minarets
      [-40, 40].forEach((offset) => {
        const minX = mx + offset;
        ctx.fillStyle = '#070a13';
        ctx.fillRect(minX - 2.3, my - 45, 4.6, 45);
        ctx.fillRect(minX - 4, my - 31, 8, 2.4);
        ctx.beginPath();
        ctx.moveTo(minX - 2.3, my - 45);
        ctx.lineTo(minX, my - 55);
        ctx.lineTo(minX + 2.3, my - 45);
        ctx.closePath();
        ctx.fill();
      });

      // Warm Glowing Sanctuary Windows at Dusk / Fajr / Night
      if (atmosphere.mosqueLit > 0.15) {
        ctx.fillStyle = `rgba(253, 224, 71, ${(atmosphere.mosqueLit * 0.85).toFixed(2)})`;
        [-15, -7.5, 0, 7.5, 15].forEach((wx) => {
          ctx.beginPath();
          ctx.roundRect(mx + wx - 1.5, my - 9, 3, 5.5, [2, 2, 0, 0]);
          ctx.fill();
        });
      }
      ctx.restore();

      // -----------------------------------------------------------------
      // 11. FOREGROUND WATER COVE & LIVING SHIMMERING REFLECTIONS
      // -----------------------------------------------------------------
      const waterH = height - horizonY;
      const waterGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      waterGrad.addColorStop(0, rgbStr(lerpRGB(atmosphere.horizon, [8, 13, 26], 0.45)));
      waterGrad.addColorStop(0.45, rgbStr(lerpRGB(atmosphere.mid, [5, 9, 20], 0.65)));
      waterGrad.addColorStop(1, '#050811');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, horizonY, width, waterH);

      // Soft Water Glow Pillar Under Sun/Moon
      const reflGrad = ctx.createRadialGradient(
        body.x,
        horizonY + 6,
        3,
        body.x,
        horizonY + waterH * 0.5,
        width * 0.28
      );
      reflGrad.addColorStop(0, rgbStr(atmosphere.sunCore, isDaytime ? 0.68 : 0.38));
      reflGrad.addColorStop(0.45, rgbStr(atmosphere.sunHalo, isDaytime ? 0.32 : 0.15));
      reflGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = reflGrad;
      ctx.fillRect(0, horizonY, width, waterH);

      // Living Animated Water Shimmer Ripples Directly Below Sun/Moon
      ctx.save();
      const rippleCount = 16;
      for (let i = 0; i < rippleCount; i++) {
        const progress = (i + 0.5) / rippleCount;
        const ry = horizonY + 3 + Math.pow(progress, 1.25) * (waterH - 7);
        const waveShift = Math.sin(elapsed * 2.8 + i * 1.15) * (6 + progress * 14);
        const halfWidth = (12 + progress * 54) * (0.75 + 0.25 * Math.cos(elapsed * 1.9 + i));
        const alpha = (1 - progress * 0.62) * (isDaytime ? 0.72 : 0.45);

        ctx.strokeStyle = rgbStr(atmosphere.sunCore, alpha);
        ctx.lineWidth = 1.1 + progress * 1.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(body.x + waveShift - halfWidth, ry);
        ctx.lineTo(body.x + waveShift + halfWidth, ry);
        ctx.stroke();
      }
      ctx.restore();

      // Crisp Horizon Shoreline Divider
      const shoreGrad = ctx.createLinearGradient(0, 0, width, 0);
      shoreGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
      shoreGrad.addColorStop(Math.min(0.95, Math.max(0.05, body.x / width)), rgbStr(atmosphere.sunCore, 0.55));
      shoreGrad.addColorStop(1, 'rgba(255,255,255,0.06)');
      ctx.strokeStyle = shoreGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();

      ctx.restore();
      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [asrMin, dhuhrMin, doneMap, fajrMin, isAr, isDraggingSky, ishaMin, maghribMin, nextKey, rtl, stopDetails, targetMinutes]);

  return (
    <div className="relative select-none pt-0.5 pb-1">
      {/* ================================================================ */}
      {/* 1. PANORAMIC 60FPS OPTICAL OBSERVATORY WINDOW                     */}
      {/* ================================================================ */}
      <div
        ref={containerRef}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
          setIsDraggingSky(true);
        }}
        onPointerMove={(e) => {
          if (!isDraggingSky) return;
          if (
            pointerDownPosRef.current &&
            Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y) > 5
          ) {
            handleSkyPointer(e.clientX);
          }
        }}
        onPointerUp={(e) => {
          if (
            isDraggingSky &&
            pointerDownPosRef.current &&
            Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y) <= 6 &&
            containerRef.current
          ) {
            // Check if the user tapped near one of the 5 sky prayer beacons
            const rect = containerRef.current.getBoundingClientRect();
            const tapX = e.clientX - rect.left;
            const tapY = e.clientY - rect.top;
            const horizonY = rect.height * 0.75;
            const hitBeacon = stopDetails.find((s) => {
              const pt = getArcPoint(s.t, rtl, rect.width, horizonY);
              return Math.hypot(pt.x - tapX, pt.y - tapY) <= 28;
            });
            if (hitBeacon && onSelectPrayer) {
              onSelectPrayer(hitBeacon.key);
            } else {
              handleSkyPointer(e.clientX);
            }
          }
          setIsDraggingSky(false);
          pointerDownPosRef.current = null;
        }}
        onPointerCancel={() => {
          setIsDraggingSky(false);
          pointerDownPosRef.current = null;
        }}
        className="relative rounded-[28px] overflow-hidden border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),0_18px_45px_rgba(0,0,0,0.55)] touch-pan-y cursor-grab active:cursor-grabbing"
      >
        {/* High-DPI Retina Canvas Taking Generous Panoramic Space */}
        <canvas
          ref={canvasRef}
          className="w-full h-[240px] sm:h-[290px] block"
        />

        {/* Top Floating Glassmorphic Observatory HUD */}
        <div className="absolute top-3 inset-x-3.5 z-20 flex items-center justify-between gap-2 flex-wrap pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold text-white shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">{isAr ? hudAtmosphere.labelAr : hudAtmosphere.labelEn}</span>
            {scrubMinutes !== null && (
              <span className="ms-1 px-2 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/50 text-amber-200 font-mono text-[10px]">
                <bdi dir="ltr">{formattedScrubTime}</bdi>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {scrubMinutes !== null ? (
              <button
                type="button"
                onClick={() => setScrubMinutes(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/85 hover:bg-emerald-500 backdrop-blur-md border border-white/30 text-[11px] font-bold text-white cursor-pointer active:scale-95 transition-all shadow-lg"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'العودة للوقت الفعلي' : 'Back to Live Time'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectPrayer?.(nextKey)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-amber-300/45 text-[11px] sm:text-xs font-bold text-amber-200 cursor-pointer active:scale-95 transition-all shadow-lg"
                title={isAr ? 'اضغط لتوثيق الصلاة أو ضبط السنن' : 'Tap to log prayer'}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>
                  {isAr ? `القادمة: ${nextStop.labelAr}` : `Next: ${nextStop.labelEn}`}
                </span>
                <span className="text-white/95 font-mono">({countdownLabel})</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Horizon Interactive Controls: Time-Travel Drag Hint + 1-Tap Sky Presets */}
        <div className="absolute bottom-2.5 inset-x-3 z-20 flex items-center justify-between gap-2 flex-wrap pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[10px] font-medium text-white/90">
            <Compass className="w-3 h-3 text-amber-300 shrink-0 animate-spin" style={{ animationDuration: '14s' }} />
            <span className="hidden sm:inline">
              {isAr
                ? 'اسحب السماء لمحاكاة الشروق والغروب والليل ✨'
                : 'Drag across the sky to simulate dawn, noon, sunset & night ✨'}
            </span>
            <span className="sm:hidden">
              {isAr ? 'اسحب السماء لمحاكاة اليوم ✨' : 'Drag sky to simulate ✨'}
            </span>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            {[
              { id: 'fajr', labelAr: '🌅 الفجر', labelEn: '🌅 Dawn', min: fajrMin + 12 },
              { id: 'dhuhr', labelAr: '☀️ الظهيرة', labelEn: '☀️ Noon', min: dhuhrMin + 10 },
              { id: 'maghrib', labelAr: '🌇 الغروب', labelEn: '🌇 Sunset', min: maghribMin - 8 },
              { id: 'isha', labelAr: '🌙 الليل', labelEn: '🌙 Night', min: ishaMin + 45 },
            ].map((preset) => {
              const isSelectedPreset =
                scrubMinutes !== null && Math.abs(scrubMinutes - preset.min) < 25;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setScrubMinutes(preset.min)}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border transition-all cursor-pointer active:scale-95 ${
                    isSelectedPreset
                      ? 'bg-amber-400/35 border-amber-300 text-white shadow-sm'
                      : 'bg-black/45 hover:bg-black/65 border-white/15 text-white/85'
                  }`}
                >
                  {isAr ? preset.labelAr : preset.labelEn}
                </button>
              );
            })}
          </div>
        </div>
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
              aria-label={`${isAr ? s.labelAr : s.labelEn} ${s.formatted}`}
              className={`min-h-[54px] py-2 px-1.5 rounded-2xl text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
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
                className={`text-[10px] sm:text-[11px] font-mono tabular-nums leading-none ${
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
