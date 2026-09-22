import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Sparkles } from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface NotificationPermissionBannerProps {
  onPermissionGranted?: () => void;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  onPermissionGranted,
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const dismissed = localStorage.getItem('midmar_notif_banner_dismissed') === 'true';
    if (Notification.permission === 'default' && !dismissed) {
      // Gentle delay so it doesn't slam the user upon initial render
      const timer = setTimeout(() => setShowBanner(true), 1500);
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
      const result = await Notification.requestPermission();
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
    <div className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white px-4 py-2.5 sm:py-3 shadow-md rounded-2xl border border-emerald-400/30 flex flex-wrap items-center justify-between gap-3 animate-fade-in my-2">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md shrink-0 shadow-xs">
          <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-wide">تفعيل تنبيهات مواقيت الصلاة والاستشفاء 🕌🌙</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <p className="text-[11px] text-emerald-100/90 leading-tight mt-0.5">
            احصل على أذان الصلاة، تفقد الصلوات (+15د)، وتنبيه سورة الملك وقيلولة الظهر بدقة وفي موعدها.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleRequest}
          disabled={isRequesting}
          className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isRequesting ? 'جارِ التفعيل...' : 'تفعيل التنبيهات الآن'}</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          title="تخطي لاحقاً"
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
