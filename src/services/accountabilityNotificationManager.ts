import { db } from '../db/db';
import { getBiologicalDate } from '../utils/gamification';
import { calculatePrayerTimes, detectDefaultCityFromTimezone } from '../utils/prayerCalculator';
import { getActiveSpiritualWirds } from '../utils/spiritualWirdEngine';
import { soundSynth } from './soundSynthesizer';
import { haptic } from './vibrationService';
import type { PrayerName } from '../types';

class AccountabilityNotificationManager {
  private timerId: number | null = null;
  private notifiedKeys = new Set<string>();

  constructor() {
    try {
      const saved = sessionStorage.getItem('midmar_notified_accountability');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((k) => this.notifiedKeys.add(k));
        }
      }
    } catch {
      // Ignore storage error
    }
  }

  private markNotified(key: string) {
    this.notifiedKeys.add(key);
    try {
      sessionStorage.setItem(
        'midmar_notified_accountability',
        JSON.stringify(Array.from(this.notifiedKeys))
      );
    } catch {
      // Ignore storage error
    }
  }

  private hasNotified(key: string): boolean {
    return this.notifiedKeys.has(key);
  }

  /**
   * Start periodic check (every 60 seconds)
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
   * Core inspection and notification trigger
   */
  public async checkAndNotify() {
    try {
      const userState = await db.user_state.get('current_user');
      const settings = userState?.settings;

      // Master toggle for late accountability notifications
      if (settings?.accountabilityNotificationsEnabled === false) return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const nowTotalMinutes = currentHour * 60 + currentMinutes;

      const graceActive = settings?.fajrGracePeriodActive ?? true;
      const todayDateStr = getBiologicalDate(graceActive);
      const todayLog = await db.daily_logs.get(todayDateStr);

      // =========================================================================
      // 1. LATE PRAYER ACCOUNTABILITY CHECK (تذكير الصلوات المتأخرة غير المسجلة)
      // =========================================================================
      if (settings?.latePrayerReminderEnabled !== false) {
        const defaultCity = detectDefaultCityFromTimezone();
        const loc = settings?.prayerLocation;
        const lat = loc?.latitude ?? defaultCity.lat;
        const lng = loc?.longitude ?? defaultCity.lng;
        const method = loc?.calculationMethod ?? defaultCity.defaultMethod;
        const todayTimes = calculatePrayerTimes(now, lat, lng, method);

        const prayersCompleted = todayLog?.prayers || {};

        const prayerList: Array<{
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

        for (let i = 0; i < prayerList.length; i++) {
          const item = prayerList[i];
          const record = prayersCompleted[item.name];
          const isDone =
            record &&
            (record.status === 'on_time' ||
              record.status === 'in_group' ||
              record.status === 'late');

          if (isDone) continue;

          const diffMinutes = Math.floor((now.getTime() - item.time.getTime()) / 60000);

          // Check if this prayer is past and either:
          // A) 45+ minutes have passed, or
          // B) Next prayer has already entered its time!
          const nextPrayer = prayerList[i + 1];
          const nextPrayerStarted = nextPrayer && now.getTime() >= nextPrayer.time.getTime();

          const isOverdue = diffMinutes >= 45 || nextPrayerStarted;

          if (isOverdue && diffMinutes <= 360) {
            const key = `late-accountability-${item.name}-${todayDateStr}`;
            if (!this.hasNotified(key)) {
              this.markNotified(key);
              await this.showNotification(
                `🕌 تذكير استدراك: ${item.titleAr}`,
                `مضى وقت على دخول ${item.titleAr} ولم تسجلها بعد.. هل أديت صلاتك؟ بادر بتسجيلها للحفاظ على أورادك ودروعك.`,
                `late-prayer-${item.name}`,
                [
                  { action: 'mark_late_prayer', title: 'صليت الآن ✔' },
                  { action: 'open_prayer', title: 'مراجعة الصلوات 🕌' },
                ]
              );
              break; // Don't spam multiple prayers at the exact same tick
            }
          }
        }
      }

      // =========================================================================
      // 2. LATE QURAN WIRD ACCOUNTABILITY CHECK (تذكير الورد القرآني - سورة البقرة)
      // =========================================================================
      if (settings?.lateWirdReminderEnabled !== false) {
        const activeWirds = getActiveSpiritualWirds(settings?.spiritualWirdConfig);
        const totalTargetPages = activeWirds.reduce((acc, w) => acc + (w.targetPages || 0), 0) || 48;

        // Calculate pages read today
        let pagesReadToday = 0;
        if (todayLog?.customWirdProgress) {
          pagesReadToday = Object.values(todayLog.customWirdProgress).reduce(
            (acc, it) => acc + (it.pagesRead || 0),
            0
          );
        } else if (todayLog?.baqarahProgress?.pagesRead) {
          pagesReadToday = todayLog.baqarahProgress.pagesRead;
        }

        const isWirdComplete = pagesReadToday >= totalTargetPages;

        if (!isWirdComplete) {
          // Afternoon Nudge (14:30 to 17:30) if 0 pages read so far
          if (nowTotalMinutes >= 14 * 60 + 30 && nowTotalMinutes <= 17 * 60 + 30 && pagesReadToday === 0) {
            const key = `late-wird-afternoon-${todayDateStr}`;
            if (!this.hasNotified(key)) {
              this.markNotified(key);
              await this.showNotification(
                '📖 تذكير بركة اليوم: سورة البقرة بانتظارك 🌱',
                'مضى نصف النهار ولم تسجل قراءة وردك بعد.. «أخذها بركة وتركها حسرة»، 15 دقيقة تصنع فارقاً عظيماً في بركة يومك.',
                'late-wird-afternoon',
                [{ action: 'open_wird', title: 'بدء قراءة الورد 📖' }]
              );
            }
          }

          // Evening / Pre-Sleep Nudge (19:30 to 22:45) if wird still not finished
          if (nowTotalMinutes >= 19 * 60 + 30 && nowTotalMinutes <= 22 * 60 + 45) {
            const key = `late-wird-evening-${todayDateStr}`;
            if (!this.hasNotified(key)) {
              this.markNotified(key);
              const remainingPages = Math.max(1, totalTargetPages - pagesReadToday);
              await this.showNotification(
                '🛡️ استدراك الورد القرآني قبل انقضاء اليوم',
                `متبقٍ ${remainingPages} صفحة لإتمام وردك اليومي.. ما زال بإمكانك قراءة ما تيسر من سورة البقرة لتنعم بحفظ الله وسكينته.`,
                'late-wird-evening',
                [{ action: 'open_wird', title: 'إتمام الورد القرآني 📖' }]
              );
            }
          }
        }
      }

      // =========================================================================
      // 3. LATE EVENING RETROSPECTIVE / CHECK-IN CHECK (تذكير تفقد اليوم وإغلاق المحطات)
      // =========================================================================
      if (settings?.lateCheckinReminderEnabled !== false) {
        if (nowTotalMinutes >= 21 * 60 + 30 && nowTotalMinutes <= 23 * 60 + 30) {
          const completedCount = todayLog?.completedStations?.length || 0;
          const hasReflection = Boolean(todayLog?.voiceNotes || todayLog?.goldenNugget);

          if (completedCount === 0 && !hasReflection) {
            const key = `late-evening-checkin-${todayDateStr}`;
            if (!this.hasNotified(key)) {
              this.markNotified(key);
              await this.showNotification(
                '🌙 تفقد حصاد اليوم وإغلاق المحطات',
                'شارف اليوم على الانتهاء.. دقائق يسيرة لتسجيل إنجازاتك وتصفية ذهنك استعداداً لنوم عميق وبداية مشرقة لغدك.',
                'late-evening-checkin',
                [{ action: 'open_checkin', title: 'مراجعة اليوم 🌟' }]
              );
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error in accountabilityNotificationManager check:', err);
    }
  }

  /**
   * Instant test notification for user testing and verification
   */
  public async testNotification(type: 'prayer' | 'wird' | 'checkin'): Promise<boolean> {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();

    let title = '';
    let body = '';
    let tag = '';
    let actions: Array<{ action: string; title: string }> = [];

    if (type === 'prayer') {
      title = '🕌 تجربة: تذكير استدراك صلاة العصر';
      body = 'لم تسجل صلاة العصر بعد.. الصلاة أحب الأعمال إلى الله، انقر لتسجيلها ونيل درع الثبات.';
      tag = 'test-late-prayer';
      actions = [
        { action: 'mark_late_prayer', title: 'صليت الآن ✔' },
        { action: 'open_prayer', title: 'مراجعة الصلوات 🕌' },
      ];
    } else if (type === 'wird') {
      title = '📖 تجربة: تذكير ورد سورة البقرة المباركة';
      body = '«أخذها بركة وتركها حسرة ولا تستطيعها البطلة».. ما زال ورد سورة البقرة بانتظارك 🌱.';
      tag = 'test-late-wird';
      actions = [{ action: 'open_wird', title: 'بدء قراءة الورد 📖' }];
    } else {
      title = '🌙 تجربة: تذكير تفقد وإغلاق اليوم';
      body = 'شارف يومك على الانتهاء.. راجع إنجازاتك ودروعك لتنعم بذهن هادئ ونوم مستقر.';
      tag = 'test-late-checkin';
      actions = [{ action: 'open_checkin', title: 'مراجعة اليوم 🌟' }];
    }

    return this.showNotification(title, body, tag, actions);
  }

  /**
   * Helper to show notification via Service Worker or Web Notification API
   */
  private async showNotification(
    title: string,
    body: string,
    tag: string,
    actions: Array<{ action: string; title: string }> = []
  ): Promise<boolean> {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();

    if (!('Notification' in window)) return false;

    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignore
      }
    }

    if (Notification.permission !== 'granted') return false;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag,
          renotify: true,
          actions,
        } as any);
        return true;
      }

      new Notification(title, {
        body,
        icon: '/favicon.svg',
        tag,
      });
      return true;
    } catch (err) {
      console.warn('Could not display accountability notification:', err);
      return false;
    }
  }
}

export const accountabilityNotificationManager = new AccountabilityNotificationManager();
