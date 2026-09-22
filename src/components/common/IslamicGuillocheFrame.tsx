import React from 'react';

interface IslamicGuillocheFrameProps {
  children: React.ReactNode;
  variant?: 'gold' | 'emerald' | 'azure' | 'slate';
  className?: string;
  innerClassName?: string;
  headerTitle?: string;
}

export const IslamicGuillocheFrame: React.FC<IslamicGuillocheFrameProps> = ({
  children,
  variant = 'gold',
  className = '',
  innerClassName = '',
  headerTitle,
}) => {
  const themeStyles = {
    gold: {
      border: 'border-amber-500/30 dark:border-amber-400/25',
      corner: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-gradient-to-b from-amber-500/5 via-transparent to-amber-500/5',
      glow: 'shadow-[0_0_20px_rgba(217,119,6,0.08)]',
      titleBadge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-600/40',
    },
    emerald: {
      border: 'border-emerald-500/30 dark:border-emerald-400/25',
      corner: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-gradient-to-b from-emerald-500/5 via-transparent to-emerald-500/5',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
      titleBadge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-600/40',
    },
    azure: {
      border: 'border-sky-500/30 dark:border-sky-400/25',
      corner: 'text-sky-500 dark:text-sky-400',
      bg: 'bg-gradient-to-b from-sky-500/5 via-transparent to-sky-500/5',
      glow: 'shadow-[0_0_20px_rgba(14,165,233,0.08)]',
      titleBadge: 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-600/40',
    },
    slate: {
      border: 'border-slate-300 dark:border-zinc-700',
      corner: 'text-slate-400 dark:text-zinc-500',
      bg: 'bg-gradient-to-b from-slate-500/5 via-transparent to-slate-500/5',
      glow: 'shadow-sm',
      titleBadge: 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-300 dark:border-zinc-700',
    },
  }[variant];

  // Authentic Mathematical Girih 8-Point Interlaced Star & Strapwork Medallion
  const GirihCornerMedallion = ({ className: cName }: { className: string }) => (
    <svg
      viewBox="0 0 40 40"
      className={`w-8 h-8 absolute pointer-events-none select-none ${cName}`}
      fill="none"
      stroke="currentColor"
    >
      {/* Outer framing hairlines (0.75px haute-horlogerie style) */}
      <path d="M 1 36 L 1 1 L 36 1" strokeWidth="0.75" strokeLinecap="round" opacity="0.4" />
      <path d="M 4 30 L 4 4 L 30 4" strokeWidth="0.75" strokeLinecap="round" opacity="0.6" />
      <path d="M 7 24 C 7 14, 14 7, 24 7" strokeWidth="0.75" strokeLinecap="round" strokeDasharray="1.5 2" opacity="0.7" />

      {/* Girih 8-Point Interlaced Star Center (X=14, Y=14, R=7) */}
      <g transform="translate(13, 13)">
        {/* Square 1 */}
        <polygon
          points="-6,-6 6,-6 6,6 -6,6"
          strokeWidth="0.85"
          opacity="0.85"
        />
        {/* Square 2 (rotated 45 deg) */}
        <polygon
          points="0,-8.48 8.48,0 0,8.48 -8.48,0"
          strokeWidth="0.85"
          opacity="0.85"
        />
        {/* Central Core Bead */}
        <circle cx="0" cy="0" r="1.5" fill="currentColor" opacity="0.9" />
        {/* Interlacing Strapwork Diagonal Rays */}
        <line x1="-3" y1="-3" x2="-8" y2="-8" strokeWidth="0.75" opacity="0.6" strokeLinecap="round" />
        <line x1="3" y1="3" x2="8" y2="8" strokeWidth="0.75" opacity="0.6" strokeLinecap="round" />
      </g>
    </svg>
  );

  return (
    <div
      className={`relative rounded-3xl border ${themeStyles.border} ${themeStyles.bg} ${themeStyles.glow} transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Background Guilloche Watermark Pattern */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id={`girih-mesh-${variant}`} width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M24 0 L48 24 L24 48 L0 24 Z M0 0 L48 48 M48 0 L0 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#girih-mesh-${variant})`} />
      </svg>

      {/* 4 Corner Authentic Girih Arabesque Medallions */}
      <GirihCornerMedallion className={`top-1.5 left-1.5 ${themeStyles.corner}`} />
      <GirihCornerMedallion className={`top-1.5 right-1.5 -scale-x-100 ${themeStyles.corner}`} />
      <GirihCornerMedallion className={`bottom-1.5 left-1.5 -scale-y-100 ${themeStyles.corner}`} />
      <GirihCornerMedallion className={`bottom-1.5 right-1.5 -scale-x-100 -scale-y-100 ${themeStyles.corner}`} />

      {/* Decorative Header Finial if title provided */}
      {headerTitle && (
        <div className="flex justify-center -mt-3.5 mb-2 relative z-10">
          <div
            className={`px-4 py-1 rounded-full text-xs font-bold tracking-normal border shadow-xs flex items-center gap-2 ${themeStyles.titleBadge}`}
          >
            <span className="opacity-70 text-[10px]">❖</span>
            <span>{headerTitle}</span>
            <span className="opacity-70 text-[10px]">❖</span>
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className={`relative z-1 p-4 sm:p-5 ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};
