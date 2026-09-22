import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const CircadianAuroraBackground: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Compute living circadian color scheme
  const auroraTheme = useMemo(() => {
    // 1. Dawn / Fajr (04:30 - 07:30)
    if (currentHour >= 4.5 && currentHour < 7.5) {
      return {
        glow1: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(251, 191, 36, 0.20)', // Amber gold
        glow2: isDark ? 'rgba(244, 63, 94, 0.08)' : 'rgba(253, 164, 175, 0.25)',  // Dawn Rose
        glow3: isDark ? 'rgba(16, 185, 129, 0.07)' : 'rgba(110, 231, 183, 0.18)', // Morning emerald
      };
    }
    // 2. High-energy Morning Focus (07:30 - 12:30)
    if (currentHour >= 7.5 && currentHour < 12.5) {
      return {
        glow1: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(52, 211, 153, 0.22)', // Emerald energy
        glow2: isDark ? 'rgba(6, 182, 212, 0.09)' : 'rgba(103, 232, 249, 0.20)',  // Cyan focus
        glow3: isDark ? 'rgba(59, 130, 246, 0.06)' : 'rgba(147, 197, 253, 0.15)', // Day blue
      };
    }
    // 3. Midday Sun & Rest (12:30 - 16:30)
    if (currentHour >= 12.5 && currentHour < 16.5) {
      return {
        glow1: isDark ? 'rgba(20, 184, 166, 0.10)' : 'rgba(94, 234, 212, 0.20)', // Teal
        glow2: isDark ? 'rgba(234, 179, 8, 0.08)' : 'rgba(253, 224, 71, 0.18)',   // Sunlight
        glow3: isDark ? 'rgba(16, 185, 129, 0.07)' : 'rgba(167, 243, 208, 0.18)', // Mint
      };
    }
    // 4. Sunset / Maghrib Reflection (16:30 - 19:30)
    if (currentHour >= 16.5 && currentHour < 19.5) {
      return {
        glow1: isDark ? 'rgba(249, 115, 22, 0.10)' : 'rgba(253, 186, 116, 0.22)', // Sunset Orange
        glow2: isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(216, 180, 254, 0.20)', // Twilight Purple
        glow3: isDark ? 'rgba(244, 63, 94, 0.07)' : 'rgba(251, 113, 133, 0.18)',  // Rose
      };
    }
    // 5. Twilight Wind-Down (19:30 - 21:00)
    if (currentHour >= 19.5 && currentHour < 21.0) {
      return {
        glow1: isDark ? 'rgba(180, 83, 9, 0.10)' : 'rgba(251, 191, 36, 0.18)',   // Warm amber
        glow2: isDark ? 'rgba(120, 53, 15, 0.08)' : 'rgba(245, 158, 11, 0.15)',  // Candle ochre
        glow3: isDark ? 'rgba(69, 26, 3, 0.06)' : 'rgba(252, 211, 77, 0.12)',   // Soft twilight
      };
    }
    // 6. Night / Post-Isha & Deep Sleep Recovery (21:00 - 04:30)
    // Melatonin preservation: Zero blue/cyan light (>600nm warm amber & deep hearth tones)
    return {
      glow1: isDark ? 'rgba(217, 119, 6, 0.08)' : 'rgba(245, 158, 11, 0.15)',  // Melatonin-safe Amber (>600nm)
      glow2: isDark ? 'rgba(146, 64, 14, 0.06)' : 'rgba(217, 119, 6, 0.12)',   // Deep ochre
      glow3: isDark ? 'rgba(80, 30, 5, 0.05)' : 'rgba(253, 230, 138, 0.10)',   // Warm ember
    };
  }, [currentHour, isDark]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-1000"
    >
      {/* Top Left / Right Breathing Aurora Orbs */}
      <div
        className="absolute -top-32 -start-32 w-96 sm:w-[32rem] h-96 sm:h-[32rem] rounded-full blur-3xl opacity-70 transition-all duration-1000 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${auroraTheme.glow1} 0%, transparent 70%)`,
          animationDuration: '8s',
        }}
      />
      <div
        className="absolute top-1/4 -end-32 w-80 sm:w-[28rem] h-80 sm:h-[28rem] rounded-full blur-3xl opacity-60 transition-all duration-1000 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${auroraTheme.glow2} 0%, transparent 70%)`,
          animationDuration: '10s',
        }}
      />
      <div
        className="absolute bottom-10 start-1/3 w-80 sm:w-[30rem] h-80 sm:h-[30rem] rounded-full blur-3xl opacity-50 transition-all duration-1000 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${auroraTheme.glow3} 0%, transparent 70%)`,
          animationDuration: '12s',
        }}
      />
    </div>
  );
};
