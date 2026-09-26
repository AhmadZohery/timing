import { calculatePrayerTimes, detectDefaultCityFromTimezone } from '../utils/prayerCalculator';
import { db } from '../db/db';
import { getBiologicalDate } from '../utils/gamification';
import type { PrayerName } from '../types';

export interface ScheduledAlarmItem {
  id: string;
  title: string;
  body: string;
  timestampMs: number;
  tag: string;
  url?: string;
  icon?: string;
  actions?: Array<{ action: string; title: string }>;
  data?: Record<string, any>;
}

declare class TimestampTrigger {
  constructor(timestamp: number);
  readonly timestamp: number;
}

class AutonomousNotificationScheduler {
  private isScheduling = false;
  public lastScheduledDate = '';

  /**
   * Request system notification permissions with user gesture
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        await this.scheduleAllUpcomingAlarms();
      }
      return perm;
    } catch {
      return 'denied';
    }
  }

  /**
   * Calculates all upcoming 24-48h alarms and pre-schedules them
   * with the OS AlarmManager (TimestampTrigger) and Service Worker.
   */
  public async scheduleAllUpcomingAlarms(): Promise<number> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return 0;
    }
    if (Notification.permission !== 'granted') {
      return 0;
    }
    if (this.isScheduling) return 0;
    this.isScheduling = true;

    try {
      const reg = await navigator.serviceWorker.ready;
      const userState = await db.user_state.get('current_user');
      const settings = userState?.settings;

      const defaultCity = detectDefaultCityFromTimezone();
      const loc = settings?.prayerLocation;
      const lat = loc?.latitude ?? defaultCity.lat;
      const lng = loc?.longitude ?? defaultCity.lng;
      const method = loc?.calculationMethod ?? defaultCity.defaultMethod;

      const now = new Date();
      const todayTimes = calculatePrayerTimes(now, lat, lng, method);

      // Tomorrow's Fajr calculation to protect early morning waking
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowTimes = calculatePrayerTimes(tomorrow, lat, lng, method);

      const graceActive = settings?.fajrGracePeriodActive ?? true;
      const todayDateStr = getBiologicalDate(graceActive);
      const todayLog = await db.daily_logs.get(todayDateStr);
      const prayersCompleted = todayLog?.prayers || {};

      const alarms: ScheduledAlarmItem[] = [];
      const followUpMinutes = settings?.followUpReminderMinutes ?? 15;
      const secondReminderMinutes = settings?.secondReminderMinutes ?? 30;
      const prePrayerAlertEnabled = settings?.prayerAudioSettings?.prePrayerAlertEnabled ?? true;
      const prePrayerMinutes = settings?.prayerAudioSettings?.prePrayerAlertMinutes ?? 10;
      const fridayDelayMinutes = settings?.fridayReminderDelayMinutes ?? 120;

      // 1. Today's 5 Prayers
      const prayerList: Array<{ name: PrayerName; time: Date; titleAr: string }> = [
        { name: 'fajr', time: todayTimes.fajr, titleAr: 'صلاة الفجر' },
        { name: 'dhuhr', time: todayTimes.dhuhr, titleAr: todayTimes.isFriday ? 'صلاة الجمعة المباركة' : 'صلاة الظهر' },
        { name: 'asr', time: todayTimes.asr, titleAr: 'صلاة العصر' },
        { name: 'maghrib', time: todayTimes.maghrib, titleAr: 'صلاة المغرب' },
        { name: 'isha', time: todayTimes.isha, titleAr: 'صلاة العشاء' },
      ];

      for (const p of prayerList) {
        const prayerRecord = prayersCompleted[p.name];
        const isDone =
          prayerRecord &&
          (prayerRecord.status === 'on_time' ||
            prayerRecord.status === 'in_group' ||
            prayerRecord.status === 'late');

        // A) Pre-Prayer Reminder (10 mins before Adhan)
        if (prePrayerAlertEnabled) {
          const preTime = new Date(p.time.getTime() - prePrayerMinutes * 60 * 1000).getTime();
          if (preTime > now.getTime()) {
            alarms.push({
              id: `pre_${p.name}_${todayDateStr}`,
              title: `اقترب موعد ${p.titleAr} ⏳`,
              body: `بقي قرابة ${prePrayerMinutes} دقائق على الأذان.. تهيأ بالوضوء والسكينة.`,
              timestampMs: preTime,
              tag: `pre-prayer-${p.name}`,
              url: '/?station=HOME',
            });
          }
        }

        // B) Exact Adhan Time Notification
        const adhanTime = p.time.getTime();
        if (adhanTime > now.getTime()) {
          alarms.push({
            id: `adhan_${p.name}_${todayDateStr}`,
            title: `الله أكبر، حان الآن موعد ${p.titleAr} 🕌`,
            body: `حيّ على الصلاة، حيّ على الفلاح.. بادر بالصلاة في أول وقتها لتنال أجر الصف الأول.`,
            timestampMs: adhanTime,
            tag: `adhan-${p.name}`,
            url: '/?station=HOME',
            actions: [
              { action: 'mark_prayed', title: 'صليت في وقتها ✔' },
              { action: 'snooze', title: 'سأصلي الآن 🤲' },
            ],
            data: { prayer: p.name },
          });
        }

        // C) Follow-up late reminder 1 (15m post-adhan) if not already done
        if (!isDone) {
          const follow1Time = new Date(p.time.getTime() + followUpMinutes * 60 * 1000).getTime();
          if (follow1Time > now.getTime() && !(todayTimes.isFriday && p.name === 'dhuhr')) {
            alarms.push({
              id: `follow1_${p.name}_${todayDateStr}`,
              title: `تذكير استدراك: ${p.titleAr} ⏳`,
              body: `مضت ${followUpMinutes} دقيقة على الأذان.. هل أديت الفريضة؟ سارع لتحفظ ثواب الوقت.`,
              timestampMs: follow1Time,
              tag: `follow1-${p.name}`,
              url: '/?station=HOME',
              actions: [
                { action: 'mark_prayed', title: 'صليت الآن ✔' },
                { action: 'snooze', title: 'تذكير بعد 10د ⏰' },
              ],
              data: { prayer: p.name },
            });
          }

          // D) Follow-up late reminder 2 (30m post-adhan)
          const follow2Time = new Date(p.time.getTime() + secondReminderMinutes * 60 * 1000).getTime();
          if (follow2Time > now.getTime() && !(todayTimes.isFriday && p.name === 'dhuhr')) {
            alarms.push({
              id: `follow2_${p.name}_${todayDateStr}`,
              title: `تنبيه حازم: ${p.titleAr} ⚠️`,
              body: `مضت نصف ساعة على دخول الوقت! استدرك صلاتك فوراً لتحمي بركة يومك وشعلتك.`,
              timestampMs: follow2Time,
              tag: `follow2-${p.name}`,
              url: '/?station=HOME',
              actions: [{ action: 'mark_prayed', title: 'سأقوم للصلاة فوراً 🏃‍♂️' }],
              data: { prayer: p.name },
            });
          }
        }
      }

      // 2. Friday Special Reminders
      if (todayTimes.isFriday) {
        // Friday Jumuah 2 hours reminder
        const jumuahReminderTime = new Date(todayTimes.dhuhr.getTime() + fridayDelayMinutes * 60 * 1000).getTime();
        if (jumuahReminderTime > now.getTime()) {
          alarms.push({
            id: `friday_jumuah_${todayDateStr}`,
            title: 'تقبل الله طاعتكم وجمعتكم 🕌',
            body: 'مضت ساعتان على صلاة الجمعة.. سجل صلاتك ونل بركة اليوم.',
            timestampMs: jumuahReminderTime,
            tag: 'jumuah-friday',
            url: '/?station=HOME',
          });
        }

        // Friday Golden Hour (ساعة الإجابة - ساعة قبل المغرب)
        const goldenHourTime = new Date(todayTimes.maghrib.getTime() - 60 * 60 * 1000).getTime();
        if (goldenHourTime > now.getTime()) {
          alarms.push({
            id: `friday_golden_${todayDateStr}`,
            title: 'ساعة الإجابة المباركة يوم الجمعة 🤲',
            body: 'بقي ساعة على غروب شمس الجمعة.. اغتنم هذا الوقت بالدعاء والصلاة على النبي ﷺ.',
            timestampMs: goldenHourTime,
            tag: 'friday-golden-hour',
            url: '/?station=HOME',
          });
        }
      }

      // 3. Tomorrow's Fajr (Pre-schedule so sleeping users wake up on time)
      const tomorrowFajrTime = tomorrowTimes.fajr.getTime();
      if (tomorrowFajrTime > now.getTime()) {
        alarms.push({
          id: `adhan_fajr_tomorrow`,
          title: 'الصلاة خير من النوم: صلاة الفجر 🌅',
          body: 'الله أكبر.. حان موعد فجر يوم جديد. استيقظ لتنال ذمة الله وبركة الصباح.',
          timestampMs: tomorrowFajrTime,
          tag: 'adhan-fajr-tomorrow',
          url: '/?station=HOME',
          actions: [{ action: 'mark_prayed', title: 'صليت في جماعة 🕌' }],
          data: { prayer: 'fajr' },
        });
      }

      // 4. Midday Wird & Surah Al-Baqarah Reminder (Midday ~ 13:30)
      if (settings?.lateWirdReminderEnabled ?? true) {
        const middayWirdTime = new Date();
        middayWirdTime.setHours(13, 30, 0, 0);
        if (middayWirdTime.getTime() > now.getTime()) {
          alarms.push({
            id: `wird_midday_${todayDateStr}`,
            title: 'ورد سورة البقرة المبارك 📖',
            body: 'انتصف نهارك.. لا تدع زحام العمل ينسيك نور وبركة سورة البقرة وطرد الشياطين.',
            timestampMs: middayWirdTime.getTime(),
            tag: 'wird-midday',
            url: '/?station=COMMUTE_MORNING',
          });
        }
      }

      // 5. Evening Retrospective Check-in (21:30)
      if (settings?.lateCheckinReminderEnabled ?? true) {
        const checkinTime = new Date();
        checkinTime.setHours(21, 30, 0, 0);
        if (checkinTime.getTime() > now.getTime()) {
          alarms.push({
            id: `checkin_evening_${todayDateStr}`,
            title: 'حصاد اليوم وإغلاق المحطات (مِضمار) 🌙',
            body: 'حان وقت إغلاق محطات اليوم وحصاد نقاطك وتأمين شعلة الالتزام قبل النوم.',
            timestampMs: checkinTime.getTime(),
            tag: 'evening-checkin',
            url: '/?station=RETROSPECTIVE_CHECKIN',
          });
        }
      }

      // Filter only valid future alarms
      const futureAlarms = alarms.filter((a) => a.timestampMs > Date.now());

      // Send the complete 24h alarm schedule to Service Worker
      if (reg.active) {
        reg.active.postMessage({
          type: 'SCHEDULE_ALARMS',
          alarms: futureAlarms,
        });
      }

      // Register Periodic Background Sync if available in browser
      if ('periodicSync' in reg) {
        try {
          const status = await (navigator as any).permissions.query({
            name: 'periodic-background-sync',
          });
          if (status.state === 'granted') {
            await (reg as any).periodicSync.register('midmar-alarms', {
              minInterval: 15 * 60 * 1000,
            });
          }
        } catch (_) {}
      }

      this.lastScheduledDate = todayDateStr;
      return futureAlarms.length;
    } catch (err) {
      console.warn('AutonomousNotificationScheduler error:', err);
      return 0;
    } finally {
      this.isScheduling = false;
    }
  }

  /**
   * Schedule an instant 10-second lockscreen test alarm
   * so the user can lock their phone right away and verify it triggers!
   */
  public async testLockscreenAlarm(delaySeconds = 10): Promise<{ success: boolean; message: string }> {
    const perm = await this.requestPermission();
    if (perm !== 'granted') {
      return {
        success: false,
        message: 'يرجى تفعيل صلاحية الإشعارات أولاً في المتصفح.',
      };
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const targetTimeMs = Date.now() + delaySeconds * 1000;

      // 1. Try native Notification Triggers API
      if ('showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined') {
        try {
          await reg.showNotification('🔔 تجربة تنبيه الشاشة المقفلة (مِضمار)', {
            body: 'ما شاء الله! التنبيه يعمل بدقة متناهية وشاشة هاتفك مقفلة.',
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: 'test-lockscreen-alert',
            requireInteraction: true,
            vibrate: [500, 250, 500, 250, 500],
            showTrigger: new TimestampTrigger(targetTimeMs),
            data: { url: '/' },
          } as any);
        } catch (_) {}
      }

      // 2. Send message to Service Worker for background setTimeout
      if (reg.active) {
        reg.active.postMessage({
          type: 'TEST_LOCKSCREEN_ALARM',
          delayMs: delaySeconds * 1000,
        });
      }

      return {
        success: true,
        message: `تم ضبط التنبيه! اقفل شاشة هاتفك الآن وانتظر ${delaySeconds} ثوانٍ لتتأكد من رنينه وهو مقفل.`,
      };
    } catch (e: any) {
      return {
        success: false,
        message: `تعذر ضبط التنبيه التجريبي: ${e?.message || e}`,
      };
    }
  }

  /**
   * Cancel follow-up reminders when a prayer is completed early
   */
  public async cancelPrayerAlarms(prayerName: PrayerName) {
    try {
      if (!('serviceWorker' in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) {
        reg.active.postMessage({ type: 'CANCEL_ALARM', tag: `follow1-${prayerName}` });
        reg.active.postMessage({ type: 'CANCEL_ALARM', tag: `follow2-${prayerName}` });
      }
      // Close any active notification with those tags
      const notifs = await reg.getNotifications();
      notifs.forEach((n) => {
        if (n.tag.includes(prayerName)) n.close();
      });
    } catch (_) {}
  }
}

export const autonomousNotificationScheduler = new AutonomousNotificationScheduler();
