import React from 'react';

interface IslamicRubElHizbProps {
  className?: string;
}

export const IslamicRubElHizb: React.FC<IslamicRubElHizbProps> = ({
  className = 'w-4 h-4 text-amber-500/50',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Authentic Interlocking 8-point geometric star (Rub el Hizb) */}
      <rect x="4.5" y="4.5" width="15" height="15" rx="0.75" />
      <rect x="4.5" y="4.5" width="15" height="15" rx="0.75" transform="rotate(45 12 12)" />
      {/* Central inner illuminated jewel */}
      <circle cx="12" cy="12" r="2.8" fill="currentColor" fillOpacity="0.5" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" fillOpacity="0.9" stroke="none" />
    </svg>
  );
};
