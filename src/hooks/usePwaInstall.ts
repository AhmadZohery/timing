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

function checkStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isStandaloneMedia = Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    const isIosStandalone = Boolean((window.navigator as any)?.standalone === true);
    const isAndroidReferrer = Boolean(typeof document !== 'undefined' && document?.referrer && typeof document.referrer === 'string' && document.referrer.includes('android-app://'));
    return isStandaloneMedia || isIosStandalone || isAndroidReferrer;
  } catch {
    return false;
  }
}

function checkHasDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(STORAGE_KEY_INSTALLED) === 'true') return true;
  const dismissedUntil = localStorage.getItem(STORAGE_KEY_DISMISSED);
  return Boolean(dismissedUntil && Date.now() < parseInt(dismissedUntil, 10));
}

function getPlatformInfo() {
  if (typeof window === 'undefined') return { isIos: false, isAndroid: false, isMobile: false };
  const ua = window.navigator.userAgent || '';
  const isIosDevice = /iPhone|iPad|iPod/i.test(ua) && !(window as any).MSStream;
  const isAndroidDevice = /Android/i.test(ua);
  const isMobileViewport = window.innerWidth <= 820 || isIosDevice || isAndroidDevice;
  return { isIos: isIosDevice, isAndroid: isAndroidDevice, isMobile: isMobileViewport };
}

export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() =>
    typeof window !== 'undefined' ? (window as any).__deferredPwaPrompt || null : null
  );
  const [isInstallable, setIsInstallable] = useState<boolean>(() =>
    typeof window !== 'undefined' ? Boolean((window as any).__deferredPwaPrompt) : false
  );
  const [isStandalone, setIsStandalone] = useState(checkStandalone);
  const [hasDismissed, setHasDismissed] = useState(checkHasDismissed);
  const [platform] = useState(getPlatformInfo);
  const { isIos, isAndroid, isMobile } = platform;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).__deferredPwaPrompt) {
      setDeferredPrompt((window as any).__deferredPwaPrompt);
      setIsInstallable(true);
    }

    // Listen for Chrome/Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).__deferredPwaPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
      (window as any).__deferredPwaPrompt = null;
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
    setHasDismissed(true);
  }, []);

  const dismissForLater = useCallback((days: number = 7) => {
    const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY_DISMISSED, expiry.toString());
    setHasDismissed(true);
  }, []);

  const suppressForever = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
    setHasDismissed(true);
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__deferredPwaPrompt : null);
    if (!promptEvent) return false;
    try {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        markAsInstalled();
        (window as any).__deferredPwaPrompt = null;
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
    return false;
  }, [deferredPrompt, markAsInstalled]);

  // Should auto-prompt if:
  // - Not standalone AND
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
