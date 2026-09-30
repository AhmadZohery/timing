import { useEffect, useRef } from 'react';
import type { StationId } from '../types';

interface ShortcutHandlers {
  onSelectStation: (stationId: StationId) => void;
  onOpenPanic: () => void;
  onOpenBuffer: () => void;
  onOpenGoals: () => void;
  onOpenCrm: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onCloseAll: () => void;
  onOpenCommandPalette?: () => void;
}

const STATION_MAP: Record<string, StationId> = {
  '1': 'COMMUTE_MORNING',
  '2': 'WORK_MICRO_SPRINT',
  '3': 'GYM_ANCHOR',
  '4': 'EVENING_SPRINT',
  '5': 'RETROSPECTIVE_CHECKIN',
  '6': 'GRAND_REWARD_STATE',
};

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  // Use a ref to prevent unnecessary event listener re-binding churn on every render
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Command Palette shortcut (Ctrl+K / Cmd+K) works everywhere, layout-agnostic
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        handlersRef.current.onOpenCommandPalette?.();
        return;
      }

      // Ignore keystrokes when user is typing in form controls
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        if (e.key === 'Escape') {
          handlersRef.current.onCloseAll();
        }
        return;
      }

      if (e.key === 'Escape') {
        handlersRef.current.onCloseAll();
        return;
      }

      // Station navigation 1-6 (layout and numpad agnostic)
      const digitKey = e.key in STATION_MAP ? e.key : e.code.replace(/^(Digit|Numpad)/, '');
      if (STATION_MAP[digitKey]) {
        e.preventDefault();
        handlersRef.current.onSelectStation(STATION_MAP[digitKey]);
        return;
      }

      // Layout-agnostic actions matching both English key, Arabic key, and physical key code
      const key = e.key.toLowerCase();
      const code = e.code;

      if (key === 'p' || key === 'ح' || code === 'KeyP') {
        e.preventDefault();
        handlersRef.current.onOpenPanic();
      } else if (key === 'b' || key === 'لا' || code === 'KeyB') {
        e.preventDefault();
        handlersRef.current.onOpenBuffer();
      } else if (key === 'g' || key === 'ل' || code === 'KeyG') {
        e.preventDefault();
        handlersRef.current.onOpenGoals();
      } else if (key === 'c' || key === 'ؤ' || code === 'KeyC') {
        e.preventDefault();
        handlersRef.current.onOpenCrm();
      } else if (key === 's' || key === 'س' || code === 'KeyS') {
        e.preventDefault();
        handlersRef.current.onOpenSettings();
      } else if (key === '?' || key === '؟' || (code === 'Slash' && e.shiftKey)) {
        e.preventDefault();
        handlersRef.current.onOpenShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
