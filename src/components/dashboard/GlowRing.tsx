import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Project motion signature: cubic-bezier(0.16, 1, 0.3, 1) */
export const SIGNATURE_EASE = [0.16, 1, 0.3, 1] as const;

interface GlowRingProps {
  /** Radius in the parent svg's viewBox units */
  r: number;
  width: number;
  /** 0-100 */
  percent: number;
  /** Stroke colour of the progress arc (must keep >= 3:1 on its surface) */
  color: string;
  /** Tailwind classes that set `text-*` colour of the track (stroke=currentColor) */
  trackClassName: string;
  /** e.g. ring-glow-emerald */
  glowClassName: string;
  /** Mount-only stagger, seconds */
  delay?: number;
  cx?: number;
  cy?: number;
  /** Show a small round-cap dot even at 0% so the ring never looks dead */
  minDot?: boolean;
}

/**
 * Track + progress arc pair for use inside an <svg className="-rotate-90">.
 * Fills from empty on mount (900ms, signature ease); updates animate the same way.
 * Honors prefers-reduced-motion by rendering the final value immediately.
 */
export const GlowRing: React.FC<GlowRingProps> = ({
  r,
  width,
  percent,
  color,
  trackClassName,
  glowClassName,
  delay = 0,
  cx = 50,
  cy = 50,
  minDot = true,
}) => {
  const reduce = useReducedMotion();
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(minDot ? 3 : 0, percent));
  const target = c * (1 - p / 100);

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={width}
        className={trackClassName}
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: reduce ? target : c }}
        animate={{ strokeDashoffset: target }}
        transition={{
          duration: reduce ? 0 : 0.9,
          ease: SIGNATURE_EASE,
          delay: reduce ? 0 : delay,
        }}
        className={glowClassName}
      />
    </>
  );
};

export default GlowRing;
