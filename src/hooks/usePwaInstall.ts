import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_INSTALLED = 'midmar_pwa_installed';
const STORAGE_KEY_DISMISSED = 'midmar_pwa_dismissed_until';

export interface PwaInstallState {
  isStandalone: boolean;
  isInstallable: boolean;
  isIos: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  shouldPrompt: boolean;
  promptInstall: () => Promise<boolean>;
  markAsInstalled: () => void;
  dismissForLater: (days?: number) => void;
  suppressForever: () => void;
}

export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect standalone / already installed
    const checkStandalone = (): boolean => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      const isAndroidReferrer = document.referrer.includes('android-app://');
      const isMarkedInstalled = localStorage.getItem(STORAGE_KEY_INSTALLED) === 'true';
      return isStandaloneMedia || isIosStandalone || isAndroidReferrer || isMarkedInstalled;
    };

    const standaloneStatus = checkStandalone();
    setIsStandalone(standaloneStatus);

    // 2. Check temporary dismissal
    const dismissedUntil = localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      setHasDismissed(true);
    }

    // 3. Platform detection
    const ua = window.navigator.userAgent || '';
    const isIosDevice = /iPhone|iPad|iPod/i.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /Android/i.test(ua);
    const isMobileViewport = window.innerWidth <= 820 || isIosDevice || isAndroidDevice;

    setIsIos(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isMobileViewport);

    // 4. Listen for Chrome/Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // 5. Listen for appinstalled
    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
      setIsStandalone(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const markAsInstalled = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
    setIsStandalone(true);
  }, []);

  const dismissForLater = useCallback((days: number = 7) => {
    const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY_DISMISSED, expiry.toString());
    setHasDismissed(true);
  }, []);

  const suppressForever = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
    setIsStandalone(true);
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        markAsInstalled();
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
    return false;
  }, [deferredPrompt, markAsInstalled]);

  // Should prompt if:
  // - Not standalone AND
  // - Not marked installed AND
  // - Not currently dismissed AND
  // - Is mobile (or installable on desktop)
  const shouldPrompt = !isStandalone && !hasDismissed && (isMobile || isInstallable);

  return {
    isStandalone,
    isInstallable,
    isIos,
    isAndroid,
    isMobile,
    shouldPrompt,
    promptInstall,
    markAsInstalled,
    dismissForLater,
    suppressForever,
  };
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
