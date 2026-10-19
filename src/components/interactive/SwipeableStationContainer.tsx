import React, { useRef } from 'react';
import type { StationId } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface SwipeableStationContainerProps {
  activeStation: StationId;
  onNextStation: () => void;
  onPrevStation: () => void;
  children: React.ReactNode;
}

export const SwipeableStationContainer: React.FC<SwipeableStationContainerProps> = ({
  activeStation,
  onNextStation,
  onPrevStation,
  children,
}) => {
  const { isRTL } = useTranslation();
  const touchStartRef = useRef<{ x: number; y: number; time: number; ignore: boolean } | null>(null);

  const shouldIgnoreSwipeTarget = (target: EventTarget | null): boolean => {
    const el = target as HTMLElement | null;
    if (!el || typeof el.closest !== 'function') return false;
    return Boolean(
      el.closest('[data-no-swipe]') ||
        el.closest('[role="dialog"]') ||
        el.closest('input') ||
        el.closest('button') ||
        el.closest('select') ||
        el.closest('textarea') ||
        el.closest('audio') ||
        el.closest('iframe') ||
        el.closest('[role="slider"]') ||
        el.closest('.overflow-x-auto') ||
        el.closest('.no-swipe')
    );
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      ignore: shouldIgnoreSwipeTarget(e.target),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || start.ignore || e.changedTouches.length === 0) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dt = Math.max(1, Date.now() - start.time);

    // Must be predominantly horizontal (at least 2.2x more horizontal than vertical)
    if (Math.abs(dx) < 110 || Math.abs(dx) < Math.abs(dy) * 2.2 || dt > 700) {
      return;
    }

    const rawLeftSwipe = dx < -110;
    const rawRightSwipe = dx > 110;
    const isForward = isRTL ? rawRightSwipe : rawLeftSwipe;
    const isBackward = isRTL ? rawLeftSwipe : rawRightSwipe;

    if (isForward) {
      soundSynth.playTactileClick();
      haptic.vibrateLight();
      onNextStation();
    } else if (isBackward) {
      soundSynth.playTactileClick();
      haptic.vibrateLight();
      onPrevStation();
    }
  };

  return (
    <div
      key={activeStation}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full animate-fade-in"
    >
      {children}
    </div>
  );
};
