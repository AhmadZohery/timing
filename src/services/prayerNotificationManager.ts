import { calculatePrayerTimes, detectDefaultCityFromTimezone } from '../utils/prayerCalculator';
import { db } from '../db/db';
import { getBiologicalDate } from '../utils/gamification';
import { soundSynth } from './soundSynthesizer';
import { haptic } from './vibrationService';
import type { PrayerName } from '../types';

class PrayerNotificationManager {
  private timerId: number | null = null;
  private notifiedKeys = new Set<string>();

  constructor() {
    // Load sent notification tags from sessionStorage to prevent spamming on page reload
    try {
      const saved = sessionStorage.getItem('midmar_notified_prayers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((k) => this.notifiedKeys.add(k));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private markNotified(key: string) {
    this.notifiedKeys.add(key);
    try {
      sessionStorage.setItem(
        'midmar_notified_prayers',
        JSON.stringify(Array.from(this.notifiedKeys))
      );
    } catch {
      // Ignore storage errors
    }
  }

  private hasNotified(key: string): boolean {
    return this.notifiedKeys.has(key);
  }

  /**
   * Start periodic check (runs every 30 seconds)
   */
  public start() {
    if (this.timerId !== null) return;
    this.checkAndNotify();
    this.timerId = window.setInterval(() => {
      this.checkAndNotify();
    }, 30000);
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
    } catch (_) {}

    return { isActive: false };
  }

  /**
   * Core inspection and notification trigger
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

      // Configurable reminder delays
      const followUpMinutes = settings?.followUpReminderMinutes ?? 15; // 15 mins
      const secondReminderMinutes = settings?.secondReminderMinutes ?? 30; // 30 mins
      const fridayDelayMinutes = settings?.fridayReminderDelayMinutes ?? 120; // 120 mins = 2 hours

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

        // If already completed, do not send follow-up reminder
        if (isDone) continue;

        const diffMinutes = Math.floor((now.getTime() - item.time.getTime()) / 60000);

        // 0) Exact Adhan Entry Alert (diffMinutes between 0 and 4)
        if (diffMinutes >= 0 && diffMinutes < 5) {
          const key = `adhan-${item.name}-${todayDateStr}`;
          if (!this.hasNotified(key)) {
            this.markNotified(key);
            await this.showNotification(
              `الله أكبر، حان الآن موعد ${item.titleAr} 🕌`,
              `حيّ على الصلاة، حيّ على الفلاح.. بادر بالاستعداد للصلاة في أول وقتها.`,
              `prayer-adhan-${item.name}`
            );
          }
        }

        // Special rule for Friday Prayer:
        // On Friday, Jumu'ah replaces Dhuhr. Reminder is strictly 2 hours (120 min) later!
        if (todayTimes.isFriday && item.name === 'dhuhr') {
          if (diffMinutes >= fridayDelayMinutes && diffMinutes <= fridayDelayMinutes + 45) {
            const key = `friday-120-${todayDateStr}`;
            if (!this.hasNotified(key)) {
              this.markNotified(key);
              await this.showNotification(
                'تقبل الله طاعتكم وجمعتكم 🕌',
                'مضت ساعتان على أذان الجمعة.. هل أديت صلاة الجمعة؟ انقر لتسجيل صلاتك ونيل البركة.',
                'jumuah-friday'
              );
            }
          }
          // Skip 15-min and 30-min reminders for Friday Dhuhr
          continue;
        }

        // Friday Golden Hour: ساعة الإجابة قبل غروب الشمس بساعة
        if (todayTimes.isFriday) {
          const maghribTime = todayTimes.maghrib.getTime();
          const minutesToMaghrib = Math.floor((maghribTime - now.getTime()) / 60000);
          if (minutesToMaghrib > 0 && minutesToMaghrib <= 60) {
            const key = `friday-golden-hour-${todayDateStr}`;
            if (!this.hasNotified(key)) {
              this.markNotified(key);
              await this.showNotification(
                '🌸 ساعة الإجابة يوم الجمعة.. اغتنمها بالدعاء',
                'شارف نهار الجمعة على المغيب.. تفرغ للدعاء والرجاء، فإن فيها ساعة لا يوافقها عبد مسلم يسأل الله خيراً إلا آتاه إياه.',
                'friday-golden-hour'
              );
            }
          }
        }

        // Post-Asr Evening Adhkar (أذكار المساء المسنونة قبل الغروب)
        if (item.name === 'asr' && diffMinutes >= 10 && diffMinutes <= 45) {
          const key = `evening-adhkar-asr-${todayDateStr}`;
          if (!this.hasNotified(key)) {
            this.markNotified(key);
            await this.showNotification(
              '🌿 حان وقت أذكار المساء النبوية',
              '﴿وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ الْغُرُوبِ﴾.. بادر بأذكار المساء لتكون لك حِصناً وبركة وسكينة قبل حلول الليل.',
              'evening-adhkar'
            );
          }
        }

        // Standard prayers (Fajr, Dhuhr, Asr, Maghrib, Isha):
        // 1) First check at +15 minutes (diffMinutes between 15 and 29)
        if (diffMinutes >= followUpMinutes && diffMinutes < secondReminderMinutes) {
          const key = `followup-${followUpMinutes}-${item.name}-${todayDateStr}`;
          if (!this.hasNotified(key)) {
            this.markNotified(key);
            await this.showNotification(
              `حان موعد ${item.titleAr} منذ ${followUpMinutes} دقيقة 🕌`,
              `هل أديت ${item.titleAr} في وقتها؟ الصلاة أحب الأعمال إلى الله، انقر لتسجيل صلاتك.`,
              `prayer-followup-${item.name}`
            );
          }
        }

        // 2) Second check at +30 minutes (diffMinutes between 30 and 59)
        if (diffMinutes >= secondReminderMinutes && diffMinutes < secondReminderMinutes + 30) {
          const key = `followup-${secondReminderMinutes}-${item.name}-${todayDateStr}`;
          if (!this.hasNotified(key)) {
            this.markNotified(key);
            await this.showNotification(
              `تذكير لطيف بـ ${item.titleAr} 🤍`,
              `لا تؤخر ${item.titleAr} عن وقتها، الصلاة راحة للنفس وبركة في الوقت والعمل.`,
              `prayer-warning-${item.name}`
            );
          }
        }
      }
    } catch (err) {
      console.warn('Error in prayerNotificationManager check:', err);
    }
  }

  private async showNotification(title: string, body: string, tag: string) {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();

    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignore
      }
    }

    if (Notification.permission !== 'granted') return;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
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
        icon: '/favicon.svg',
        tag,
      });
    } catch (err) {
      console.warn('Could not display prayer notification:', err);
    }
  }
}

export const prayerNotificationManager = new PrayerNotificationManager();
