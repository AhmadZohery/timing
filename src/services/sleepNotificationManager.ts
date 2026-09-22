import { db } from '../db/db';
import { getBiologicalDate } from '../utils/gamification';
import { calculatePrayerTimes, detectDefaultCityFromTimezone } from '../utils/prayerCalculator';
import { soundSynth } from './soundSynthesizer';
import { haptic } from './vibrationService';

class SleepNotificationManager {
  private timerId: number | null = null;
  private notifiedKeys = new Set<string>();

  constructor() {
    try {
      const saved = sessionStorage.getItem('midmar_notified_sleep');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((k) => this.notifiedKeys.add(k));
        }
      }
    } catch {
      // Ignore
    }
  }

  private markNotified(key: string) {
    this.notifiedKeys.add(key);
    try {
      sessionStorage.setItem(
        'midmar_notified_sleep',
        JSON.stringify(Array.from(this.notifiedKeys))
      );
    } catch {
      // Ignore
    }
  }

  private hasNotified(key: string): boolean {
    return this.notifiedKeys.has(key);
  }

  public start() {
    if (this.timerId !== null) return;
    this.checkAndNotify();
    this.timerId = window.setInterval(() => {
      this.checkAndNotify();
    }, 60000); // Check once a minute
  }

  public stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public async checkAndNotify() {
    try {
      const userState = await db.user_state.get('current_user');
      const settings = userState?.settings;
      const sleepConfig = settings?.sleepSchedule;

      if (sleepConfig?.enabled === false) return;

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const nowTotalMins = currentHours * 60 + currentMinutes;

      const todayDateStr = getBiologicalDate(settings?.fajrGracePeriodActive ?? true);
      const todayLog = await db.daily_logs.get(todayDateStr);

      // 1. Bedtime Wind-Down Alert
      const bedtimeStr = sleepConfig?.targetBedtime || '23:00';
      const [bHour, bMin] = bedtimeStr.split(':').map(Number);
      const bedtimeTotalMins = bHour * 60 + bMin;

      const windDownMin = sleepConfig?.windDownMinutes || 45;
      const windDownStartMins = (bedtimeTotalMins - windDownMin + 1440) % 1440;

      // Check if within a 3-minute window of wind-down start
      const diffWindDown = Math.abs(nowTotalMins - windDownStartMins);
      if (diffWindDown <= 2) {
        const key = `winddown-${todayDateStr}`;
        if (!this.hasNotified(key)) {
          this.markNotified(key);
          await this.showNotification(
            '🌙 اقترب موعد النوم والاستشفاء (خلال 45 دقيقة)',
            'حان وقت إغلاق الشاشات الزرقاء، قراءة سورة الملك وأذكار النوم لتستيقظ بكامل طاقتك لصلاة الفجر 🤍.',
            'sleep-winddown'
          );
        }
      }

      // 2. Afternoon Sunnah Power Nap Alert (Post-Dhuhr ~30 mins after Dhuhr prayer)
      if (sleepConfig?.powerNapEnabled !== false && !todayLog?.powerNapDone) {
        const defaultCity = detectDefaultCityFromTimezone();
        const loc = settings?.prayerLocation;
        const lat = loc?.latitude ?? defaultCity.lat;
        const lng = loc?.longitude ?? defaultCity.lng;
        const method = loc?.calculationMethod ?? defaultCity.defaultMethod;
        const todayTimes = calculatePrayerTimes(now, lat, lng, method);

        // Target: ~30 mins after Dhuhr (or 13:30 if unavailable)
        let napTargetMins = 13 * 60 + 30;
        if (todayTimes.dhuhr) {
          napTargetMins = todayTimes.dhuhr.getHours() * 60 + todayTimes.dhuhr.getMinutes() + 30;
        }

        const diffNap = Math.abs(nowTotalMins - napTargetMins);
        if (diffNap <= 2) {
          const key = `powernap-${todayDateStr}`;
          if (!this.hasNotified(key)) {
            this.markNotified(key);
            await this.showNotification(
              '☕ قيلولة الظهر النبوية واستعادة النشاط الذهني (20 دقيقة)',
              '«قِيلُوا فَإِنَّ الشَّيَاطِينَ لَا تَقِيلُ».. استعد صفاء ذهنك وطاقتك لبقية اليوم. انقر لبدء مؤقت الاسترخاء 😴.',
              'sleep-powernap'
            );
          }
        }
      }
    } catch (err) {
      console.warn('Error in sleepNotificationManager check:', err);
    }
  }

  private async showNotification(title: string, body: string, tag: string) {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();

    if (!('Notification' in window)) return;
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
            { action: 'open_sleep', title: 'فتح نافذة النوم والراحة 🌙' },
          ],
        } as any);
      }
    } catch (err) {
      console.warn('Failed to display sleep notification:', err);
    }
  }
}

export const sleepNotificationManager = new SleepNotificationManager();
