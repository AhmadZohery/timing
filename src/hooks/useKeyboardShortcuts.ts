import { useEffect } from 'react';
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Command Palette shortcut (Ctrl+K / Cmd+K) works everywhere
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onOpenCommandPalette?.();
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
          handlers.onCloseAll();
        }
        return;
      }

      if (e.key === 'Escape') {
        handlers.onCloseAll();
        return;
      }

      // Station navigation 1-6
      if (STATION_MAP[e.key]) {
        e.preventDefault();
        handlers.onSelectStation(STATION_MAP[e.key]);
        return;
      }

      const key = e.key.toLowerCase();
      switch (key) {
        case 'p':
          e.preventDefault();
          handlers.onOpenPanic();
          break;
        case 'b':
          e.preventDefault();
          handlers.onOpenBuffer();
          break;
        case 'g':
          e.preventDefault();
          handlers.onOpenGoals();
          break;
        case 'c':
          e.preventDefault();
          handlers.onOpenCrm();
          break;
        case 's':
          e.preventDefault();
          handlers.onOpenSettings();
          break;
        case '?':
          e.preventDefault();
          handlers.onOpenShortcuts();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
}
