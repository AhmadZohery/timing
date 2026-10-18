import React, { useId, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { SIGNATURE_EASE } from './GlowRing';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

interface CelestialPrayerArcProps {
  now: Date;
  doneMap: Record<PrayerKey, boolean>;
  isAr: boolean;
  onSelectPrayer?: (prayer: PrayerKey) => void;
}

/**
 * Approximate window starts (local hours): used only for visual placement.
 * Exact prayer times remain the job of PrayerTimesBar.
 */
const PRAYERS: { key: PrayerKey; start: number; ar: string; en: string }[] = [
  { key: 'fajr', start: 4.5, ar: 'الفجر', en: 'Fajr' },
  { key: 'dhuhr', start: 12, ar: 'الظهر', en: 'Dhuhr' },
  { key: 'asr', start: 15.5, ar: 'العصر', en: 'Asr' },
  { key: 'maghrib', start: 18, ar: 'المغرب', en: 'Maghrib' },
  { key: 'isha', start: 19.5, ar: 'العشاء', en: 'Isha' },
];

const W = 320;
const H = 128;
// Quadratic bezier of the sky path (LTR coordinates). x(t) = 22 + 276t
const P0 = { x: 22, y: 114 };
const P1 = { x: 160, y: -74 };
const P2 = { x: 298, y: 114 };
const HORIZON_Y = 116;
const BODY_LIFT = 12; // sun/moon float above the path so they never cover a marker

/** Marker i sits exactly on the centre of grid column i (5 equal columns of a 320 viewBox). */
const colCenter = (i: number) => 32 + 64 * i;
const tAtColumn = (i: number) => (colCenter(i) - P0.x) / (P2.x - P0.x);

const pointAt = (t: number) => {
  const u = 1 - t;
  return {
    x: u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x,
    y: u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y,
  };
};

/**
 * Position of the sun/moon along the arc. Piecewise-linear between prayer markers so the
 * body passes each marker at that prayer's start hour. At night (isha → fajr) it rests at the isha end.
 */
const bodyT = (hour: number) => {
  if (hour >= PRAYERS[4].start || hour < PRAYERS[0].start) return tAtColumn(4);
  for (let i = 0; i < 4; i++) {
    const a = PRAYERS[i].start;
    const b = PRAYERS[i + 1].start;
    if (hour >= a && hour < b) {
      return tAtColumn(i) + ((hour - a) / (b - a)) * (tAtColumn(i + 1) - tAtColumn(i));
    }
  }
  return tAtColumn(4);
};

export const CelestialPrayerArc: React.FC<CelestialPrayerArcProps> = ({
  now,
  doneMap,
  isAr,
  onSelectPrayer,
}) => {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const reduce = useReducedMotion();

  const hour = now.getHours() + now.getMinutes() / 60;
  const t = bodyT(hour);
  const isNightSky = hour >= 18 || hour < 4.5;

  // In RTL the day flows right → left: mirror every x coordinate (chips follow `dir` below).
  const fx = (x: number) => (isAr ? W - x : x);
  const sky = pointAt(t);
  const bodyX = fx(sky.x);
  const bodyY = sky.y - BODY_LIFT;

  const pathD = `M ${fx(P0.x)} ${P0.y} Q ${fx(P1.x)} ${P1.y} ${fx(P2.x)} ${P2.y}`;

  const currentKey = useMemo<PrayerKey>(() => {
    let cur: PrayerKey = 'isha';
    for (const p of PRAYERS) {
      if (hour >= p.start) cur = p.key;
    }
    return cur;
  }, [hour]);

  const doneCount = PRAYERS.filter((p) => doneMap[p.key]).length;
  const ease = SIGNATURE_EASE;

  return (
    <div className="space-y-1 max-w-3xl mx-auto w-full" dir={isAr ? 'rtl' : 'ltr'}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={
          isAr
            ? `قوس الصلوات: ${doneCount} من 5 مكتملة`
            : `Prayer arc: ${doneCount} of 5 completed`
        }
      >
        <defs>
          <linearGradient id={`arc${uid}`} x1={isAr ? 1 : 0} y1="0" x2={isAr ? 0 : 1} y2="0">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#1eb814" />
          </linearGradient>
          <linearGradient id={`gold${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.1" />
          </linearGradient>
          <radialGradient id={`bloom${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <filter id={`glow${uid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          {/* Moon crescent mask in the body's LOCAL coordinates */}
          <mask id={`moon${uid}`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="40" height="40">
            <rect x="-20" y="-20" width="40" height="40" fill="white" />
            <circle cx={isAr ? -5.5 : 5.5} cy="-3" r="9" fill="black" />
          </mask>
        </defs>

        {/* Static apex bloom under the dome */}
        <ellipse cx={W / 2} cy="24" rx="72" ry="36" fill={`url(#bloom${uid})`} />

        {/* Horizon */}
        <line x1="6" y1={HORIZON_Y} x2="314" y2={HORIZON_Y} stroke="rgba(251,191,36,0.25)" strokeWidth="1" />

        {/* Golden dome halo + full sky track */}
        <path
          d={pathD}
          fill="none"
          stroke="#fbbf24"
          strokeOpacity="0.55"
          strokeWidth="10"
          strokeLinecap="round"
          filter={`url(#glow${uid})`}
        />
        <path d={pathD} fill="none" stroke={`url(#gold${uid})`} strokeWidth="2.5" strokeLinecap="round" />

        {/* Travelled portion */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={`url(#arc${uid})`}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? t : 0 }}
          animate={{ pathLength: t }}
          transition={{ duration: reduce ? 0 : 1.2, ease }}
        />

        {/* Sun / Moon: floats above the path, glides to its position */}
        <motion.g
          initial={{ x: reduce ? bodyX : fx(P0.x), y: reduce ? bodyY : P0.y - BODY_LIFT, opacity: reduce ? 1 : 0 }}
          animate={{ x: bodyX, y: bodyY, opacity: 1 }}
          transition={{ duration: reduce ? 0 : 1.2, ease }}
        >
          <circle r="18" fill={isNightSky ? '#a5b4fc' : '#fbbf24'} opacity="0.55" filter={`url(#glow${uid})`} />
          {isNightSky ? (
            <circle r="10" fill="#e0e7ff" mask={`url(#moon${uid})`} />
          ) : (
            <circle r="10" fill="#fbbf24" stroke="#fde68a" strokeWidth="2.5" />
          )}
        </motion.g>

        {/* Prayer markers — drawn last so nothing covers them; aligned to the chip columns below */}
        {PRAYERS.map((p, i) => {
          const pt = pointAt(tAtColumn(i));
          const x = fx(pt.x);
          const done = doneMap[p.key];
          const current = p.key === currentKey;
          return (
            <g
              key={p.key}
              onClick={() => onSelectPrayer?.(p.key)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={isAr ? `تسجيل صلاة ${p.ar}` : `Log ${p.en} prayer`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPrayer?.(p.key);
                }
              }}
            >
              <circle cx={x} cy={pt.y} r="14" fill="transparent" />
              {current && (
                <circle
                  className="arc-ping"
                  cx={x}
                  cy={pt.y}
                  r="9"
                  fill="none"
                  stroke="#fbbf24"
                  strokeOpacity="0.7"
                  strokeWidth="1.5"
                />
              )}
              <motion.circle
                cx={x}
                cy={pt.y}
                r="5.5"
                fill={done ? '#1eb814' : '#141517'}
                stroke={done ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)'}
                strokeWidth="1.5"
                initial={false}
                animate={done && !reduce ? { scale: [0.6, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.45, ease }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            </g>
          );
        })}
      </svg>

      {/* Prayer names: 5 equal columns with no gap → column centres match the markers exactly */}
      <div className="grid grid-cols-5 gap-0">
        {PRAYERS.map((p) => {
          const done = doneMap[p.key];
          const current = p.key === currentKey;
          return (
            <div key={p.key} className="flex justify-center">
              <button
                type="button"
                onClick={() => onSelectPrayer?.(p.key)}
                title={isAr ? `انقر لتسجيل صلاة ${p.ar}` : `Tap to log ${p.en}`}
                className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[12px] leading-[1.7] font-semibold whitespace-nowrap cursor-pointer transition-all active:scale-95 ${
                  current
                    ? 'bg-amber-300/15 hover:bg-amber-300/25 ring-1 ring-amber-300/30 text-amber-200'
                    : done
                    ? 'text-zinc-200 hover:bg-white/10'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {done && (
                  <Check
                    className="w-3 h-3 text-[#22c55e] stroke-[3]"
                    aria-label={isAr ? 'مكتملة' : 'done'}
                  />
                )}
                <span>{isAr ? p.ar : p.en}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CelestialPrayerArc;
