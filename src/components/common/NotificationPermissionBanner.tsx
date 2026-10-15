import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { autonomousNotificationScheduler } from '../../services/autonomousNotificationScheduler';

interface NotificationPermissionBannerProps {
  onPermissionGranted?: () => void;
}

/**
 * Slim permission nudge (council: it must never push the hero content below the fold).
 * Rendered by the Home dashboard below the hero cards; permission is only requested on tap.
 */
export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  onPermissionGranted,
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const dismissed =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('midmar_notif_banner_dismissed') === 'true';
    if (window.Notification && window.Notification.permission === 'default' && !dismissed) {
      const timer = setTimeout(() => setShowBanner(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showBanner) return null;

  const handleRequest = async () => {
    if (!('Notification' in window)) return;
    setIsRequesting(true);
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    try {
      const result = await autonomousNotificationScheduler.requestPermission();
      if (result === 'granted') {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        setShowBanner(false);
        if (onPermissionGranted) onPermissionGranted();
      } else {
        setShowBanner(false);
      }
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      setShowBanner(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    soundSynth.playTactileClick();
    localStorage.setItem('midmar_notif_banner_dismissed', 'true');
    setShowBanner(false);
  };

  return (
    <div className="w-full rounded-[28px] bg-white/70 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 pe-1.5 ps-3 py-1.5 flex items-center gap-2.5 animate-fade-in">
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-habit-flame to-habit-flame-ink text-white flex items-center justify-center shrink-0">
        <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2 text-balance">
          فعّل تنبيهات الأذان والمنبهات الذكية
        </p>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug line-clamp-1">
          تنبيه قبل الصلاة بعشر دقائق حتى والشاشة مقفلة
        </p>
      </div>

      <button
        type="button"
        onClick={handleRequest}
        disabled={isRequesting}
        className="touch-target px-3.5 min-h-[36px] rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white text-xs font-bold ring-1 ring-habit-green/40 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0 disabled:opacity-60"
      >
        <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
        <span>{isRequesting ? 'جارِ التفعيل…' : 'تفعيل'}</span>
      </button>

      <button
        type="button"
        onClick={handleDismiss}
        title="تخطي لاحقاً"
        aria-label="تخطي لاحقاً"
        className="w-11 h-11 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};
