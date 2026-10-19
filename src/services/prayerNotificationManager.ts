import { calculatePrayerTimes, detectDefaultCityFromTimezone } from '../utils/prayerCalculator';
import { db } from '../db/db';
import { getBiologicalDate } from '../utils/gamification';
import { soundSynth } from './soundSynthesizer';
import { haptic } from './vibrationService';
import { autonomousNotificationScheduler } from './autonomousNotificationScheduler';
import type { PrayerName } from '../types';

class PrayerNotificationManager {
  private timerId: number | null = null;
  private notifiedKeys = new Set<string>();

  constructor() {
    // Load sent notification tags from localStorage (persists across tabs & reloads)
    try {
      const saved = localStorage.getItem('midmar_notified_prayers_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.slice(-150).forEach((k) => this.notifiedKeys.add(k));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private markNotified(key: string) {
    this.notifiedKeys.add(key);
    try {
      const arr = Array.from(this.notifiedKeys).slice(-150);
      localStorage.setItem('midmar_notified_prayers_v2', JSON.stringify(arr));
    } catch {
      // Ignore storage errors
    }
  }

  private hasNotified(key: string): boolean {
    return this.notifiedKeys.has(key);
  }

  /**
   * Start periodic check (runs every 60 seconds)
   */
  public start() {
    if (this.timerId !== null) return;
    this.checkAndNotify();
    this.timerId = window.setInterval(() => {
      this.checkAndNotify();
    }, 60000);
  }

  public stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Checks if Khushu' Sanctuary Mode is currently active
   * (Active for 20 minutes following each obligatory Adhan to maintain tranquility and silence worldly noise)
   */
  public isKhushuSanctuaryActive(now: Date = new Date()): {
    isActive: boolean;
    prayerName?: PrayerName;
    prayerTitleAr?: string;
    minutesIntoSanctuary?: number;
    minutesRemaining?: number;
  } {
    try {
      const defaultCity = detectDefaultCityFromTimezone();
      const todayTimes = calculatePrayerTimes(now, defaultCity.lat, defaultCity.lng, defaultCity.defaultMethod);

      const prayers: Array<{ name: PrayerName; time: Date; titleAr: string }> = [
        { name: 'fajr', time: todayTimes.fajr, titleAr: 'الفجر' },
        { name: 'dhuhr', time: todayTimes.dhuhr, titleAr: todayTimes.isFriday ? 'الجمعة' : 'الظهر' },
        { name: 'asr', time: todayTimes.asr, titleAr: 'العصر' },
        { name: 'maghrib', time: todayTimes.maghrib, titleAr: 'المغرب' },
        { name: 'isha', time: todayTimes.isha, titleAr: 'العشاء' },
      ];

      for (const p of prayers) {
        const diffMin = Math.floor((now.getTime() - p.time.getTime()) / 60000);
        // Within 0 to 20 minutes post-Adhan
        if (diffMin >= 0 && diffMin < 20) {
          return {
            isActive: true,
            prayerName: p.name,
            prayerTitleAr: p.titleAr,
            minutesIntoSanctuary: diffMin,
            minutesRemaining: 20 - diffMin,
          };
        }
      }
    } catch {}

    return { isActive: false };
  }

  /**
   * Core inspection and notification trigger (Calm & Non-Spammy by default)
   */
  public async checkAndNotify() {
    try {
      const userState = await db.user_state.get('current_user');
      const settings = userState?.settings;

      // Check if notifications are allowed
      if (settings?.prayerNotificationsEnabled === false) return;

      const defaultCity = detectDefaultCityFromTimezone();
      const loc = settings?.prayerLocation;
      const lat = loc?.latitude ?? defaultCity.lat;
      const lng = loc?.longitude ?? defaultCity.lng;
      const method = loc?.calculationMethod ?? defaultCity.defaultMethod;

      const now = new Date();
      const todayTimes = calculatePrayerTimes(now, lat, lng, method);

      const graceActive = settings?.fajrGracePeriodActive ?? true;
      const todayDateStr = getBiologicalDate(graceActive);
      const todayLog = await db.daily_logs.get(todayDateStr);

      const prayersCompleted = todayLog?.prayers || {};

      // Only send extra follow-up reminders if the user explicitly enabled accountabilityNotificationsEnabled === true
      const accountabilityOptIn = settings?.accountabilityNotificationsEnabled === true && settings?.latePrayerReminderEnabled === true;
      const prePrayerOptIn = settings?.prayerAudioSettings?.prePrayerAlertEnabled === true && settings?.accountabilityNotificationsEnabled === true;
      const followUpMinutes = settings?.followUpReminderMinutes ?? 25;

      const prayerCheckList: Array<{
        name: PrayerName;
        time: Date;
        titleAr: string;
      }> = [
        { name: 'fajr', time: todayTimes.fajr, titleAr: 'صلاة الفجر' },
        {
          name: 'dhuhr',
          time: todayTimes.dhuhr,
          titleAr: todayTimes.isFriday ? 'صلاة الجمعة' : 'صلاة الظهر',
        },
        { name: 'asr', time: todayTimes.asr, titleAr: 'صلاة العصر' },
        { name: 'maghrib', time: todayTimes.maghrib, titleAr: 'صلاة المغرب' },
        { name: 'isha', time: todayTimes.isha, titleAr: 'صلاة العشاء' },
      ];

      for (const item of prayerCheckList) {
        const prayerRecord = prayersCompleted[item.name];
        const isDone =
          prayerRecord &&
          (prayerRecord.status === 'on_time' ||
            prayerRecord.status === 'in_group' ||
            prayerRecord.status === 'late');

        // If already completed, cancel background follow-up alarms and skip
        if (isDone) {
          autonomousNotificationScheduler.cancelPrayerAlarms(item.name).catch(() => {});
          continue;
        }

        const diffMinutes = Math.floor((now.getTime() - item.time.getTime()) / 60000);

        // Pre-Prayer Approaching Alert (ONLY if explicitly opted in)
        if (prePrayerOptIn) {
          const msUntilPrayer = item.time.getTime() - now.getTime();
          const minutesUntilPrayer = Math.floor(msUntilPrayer / 60000);
          if (minutesUntilPrayer > 0 && minutesUntilPrayer <= 10) {
            const preKey = `pre-adhan-${item.name}-${todayDateStr}`;
            if (!this.hasNotified(preKey)) {
              this.markNotified(preKey);
              await this.showNotification(
                `اقترب موعد ${item.titleAr} ⏳ (خلال ${minutesUntilPrayer} دقائق)`,
                `استعد بالوضوء والسكينة لصلاتك في أول وقتها.`,
                `pre-prayer-${item.name}`,
                'wird_adhkar'
              );
            }
          }
        }

        // 0) Exact Adhan Entry Alert (within 0 to 15m window, single clean notification per prayer)
        if (diffMinutes >= 0 && diffMinutes <= 15) {
          const key = `adhan-${item.name}-${todayDateStr}`;
          if (!this.hasNotified(key)) {
            this.markNotified(key);
            await this.showNotification(
              `الله أكبر، حان موعد ${item.titleAr} 🕌`,
              `حيّ على الصلاة، حيّ على الفلاح.. بادر بالصلاة في أول وقتها لتنال البركة والسكينة.`,
              `adhan-${item.name}`,
              'prayer_adhan',
              settings?.prayerAudioSettings
            );
          }
        }

        // Follow-up reminder (ONLY if user explicitly opted into accountability reminders, max 1 gentle reminder)
        if (accountabilityOptIn && !(todayTimes.isFriday && item.name === 'dhuhr')) {
          if (diffMinutes >= followUpMinutes && diffMinutes < followUpMinutes + 15) {
            const key = `followup-${followUpMinutes}-${item.name}-${todayDateStr}`;
            if (!this.hasNotified(key)) {
              this.markNotified(key);
              await this.showNotification(
                `تذكير لطيف بـ ${item.titleAr} 🕌`,
                `مضت ${followUpMinutes} دقيقة على الأذان.. هل أديت ${item.titleAr}؟ انقر لتسجيل صلاتك.`,
                `follow1-${item.name}`,
                'urgent_warning'
              );
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error in prayerNotificationManager check:', err);
    }
  }

  private async showNotification(
    title: string,
    body: string,
    tag: string,
    category: 'prayer_adhan' | 'urgent_warning' | 'wird_adhkar' = 'prayer_adhan',
    prayerAudioSettings?: any
  ) {
    if (category === 'prayer_adhan') {
      soundSynth.playPrayerNotification(prayerAudioSettings);
      haptic.vibrateSprintCelebration();
    } else if (category === 'urgent_warning') {
      soundSynth.playUrgentWarningTone();
      haptic.vibrateLight();
    } else {
      soundSynth.playWirdAdhkarChime();
      haptic.vibrateLight();
    }

    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignore
      }
    }

    if (Notification.permission !== 'granted') return;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const iconUrl = `${origin}/icons/icon-192x192.png`;
    const badgeUrl = `${origin}/icons/notification-badge-96x96.png`;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: iconUrl,
          badge: badgeUrl,
          tag,
          renotify: true,
          actions: [
            { action: 'mark_prayed', title: 'صليت في وقتها ✔' },
            { action: 'snooze', title: 'سأصلي الآن 🤲' },
          ],
        } as any);
        return;
      }

      new Notification(title, {
        body,
        icon: iconUrl,
        badge: badgeUrl,
        tag,
      } as any);
    } catch (err) {
      console.warn('Could not display prayer notification:', err);
    }
  }
}

export const prayerNotificationManager = new PrayerNotificationManager();
