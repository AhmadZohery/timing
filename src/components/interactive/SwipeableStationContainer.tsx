import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  const handleDragEnd = (event: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    // Check if the interaction originated from an interactive or scrollable element
    const target = (event?.target || event?.srcElement) as HTMLElement | null;
    if (
      target &&
      (target.closest('[data-no-swipe]') ||
        target.closest('input') ||
        target.closest('button') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('audio') ||
        target.closest('iframe') ||
        target.closest('[role="slider"]') ||
        target.closest('.overflow-x-auto') ||
        target.closest('.no-swipe'))
    ) {
      return;
    }

    const swipeThreshold = 110;
    const velocityThreshold = 0.5;
    const x = info.offset.x;
    const vx = info.velocity.x;

    // In RTL:
    // Dragging left (negative x) means moving forward -> Next Station
    // Dragging right (positive x) means moving backward -> Prev Station
    // In LTR: reverse
    const isForward = isRTL ? (x < -swipeThreshold || vx < -velocityThreshold) : (x > swipeThreshold || vx > velocityThreshold);
    const isBackward = isRTL ? (x > swipeThreshold || vx > velocityThreshold) : (x < -swipeThreshold || vx < -velocityThreshold);

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
    <div className="relative w-full overflow-hidden touch-pan-y" data-no-swipe="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeStation}
          drag={isTouchDevice ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.08}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, y: 10, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 30,
            mass: 0.8,
          }}
          className={`w-full ${isTouchDevice ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
