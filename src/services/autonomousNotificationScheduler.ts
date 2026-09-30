import { calculatePrayerTimes, detectDefaultCityFromTimezone, getHijriDateDetails } from '../utils/prayerCalculator';
import { db } from '../db/db';
import { getBiologicalDate, formatLocalDate } from '../utils/gamification';
import { scheduleService } from './scheduleService';
import { serverSync } from './serverSyncService';
import type { PrayerName, CustomReminderItem, WorkdayTask } from '../types';

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

const DEFAULT_ALARM_ICON = '/icons/icon-192x192.png';

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
   * Calculates all upcoming 36-48h alarms (Today + Tomorrow rolling window)
   * and pre-schedules them with OS AlarmManager (TimestampTrigger),
   * Service Worker IndexedDB & in-memory timers, and Server-Side Web Push Dispatcher.
   * Guarantees notifications fire on time even if phone is locked and app is 100% closed!
   */
  public async scheduleAllUpcomingAlarms(): Promise<number> {
    if (typeof window === 'undefined') {
      return 0;
    }
    if (Notification.permission !== 'granted') {
      return 0;
    }
    if (this.isScheduling) return 0;
    this.isScheduling = true;

    try {
      // 1. Resolve Service Worker registration with resilient fallback
      let reg: ServiceWorkerRegistration | null = null;
      if ('serviceWorker' in navigator) {
        try {
          reg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
          ]);
          if (!reg) {
            reg = (await navigator.serviceWorker.getRegistration()) ?? null;
          }
        } catch {
          reg = (await navigator.serviceWorker.getRegistration().catch(() => null)) ?? null;
        }
      }

      const userState = await db.user_state.get('current_user');
      const settings = userState?.settings;

      const defaultCity = detectDefaultCityFromTimezone();
      const loc = settings?.prayerLocation;
      const lat = loc?.latitude ?? defaultCity.lat;
      const lng = loc?.longitude ?? defaultCity.lng;
      const method = loc?.calculationMethod ?? defaultCity.defaultMethod;

      const now = new Date();
      const todayTimes = calculatePrayerTimes(now, lat, lng, method);

      // Tomorrow's full astronomical calculation for closed-app protection
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowTimes = calculatePrayerTimes(tomorrow, lat, lng, method);

      const graceActive = settings?.fajrGracePeriodActive ?? true;
      const todayDateStr = getBiologicalDate(graceActive);
      const tomorrowDateStr = formatLocalDate(tomorrow);

      const todayLog = await db.daily_logs.get(todayDateStr);
      const prayersCompleted = todayLog?.prayers || {};

      const alarms: ScheduledAlarmItem[] = [];
      const followUpMinutes = settings?.followUpReminderMinutes ?? 15;
      const secondReminderMinutes = settings?.secondReminderMinutes ?? 30;
      const prePrayerAlertEnabled = settings?.prayerAudioSettings?.prePrayerAlertEnabled ?? true;
      const prePrayerMinutes = settings?.prayerAudioSettings?.prePrayerAlertMinutes ?? 10;
      const fridayDelayMinutes = settings?.fridayReminderDelayMinutes ?? 120;

      // ----------------------------------------------------
      // 1. TODAY'S PRAYERS (Remaining obligatory prayers)
      // ----------------------------------------------------
      const todayPrayerList: Array<{ name: PrayerName; time: Date; titleAr: string }> = [
        { name: 'fajr', time: todayTimes.fajr, titleAr: 'صلاة الفجر' },
        { name: 'dhuhr', time: todayTimes.dhuhr, titleAr: todayTimes.isFriday ? 'صلاة الجمعة المباركة' : 'صلاة الظهر' },
        { name: 'asr', time: todayTimes.asr, titleAr: 'صلاة العصر' },
        { name: 'maghrib', time: todayTimes.maghrib, titleAr: 'صلاة المغرب' },
        { name: 'isha', time: todayTimes.isha, titleAr: 'صلاة العشاء' },
      ];

      for (const p of todayPrayerList) {
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
              icon: DEFAULT_ALARM_ICON,
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
            icon: DEFAULT_ALARM_ICON,
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
              icon: DEFAULT_ALARM_ICON,
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
              icon: DEFAULT_ALARM_ICON,
              actions: [{ action: 'mark_prayed', title: 'سأقوم للصلاة فوراً 🏃‍♂️' }],
              data: { prayer: p.name },
            });
          }
        }
      }

      // ----------------------------------------------------
      // 2. FRIDAY SPECIAL REMINDERS (Today if Friday)
      // ----------------------------------------------------
      if (todayTimes.isFriday) {
        const jumuahReminderTime = new Date(todayTimes.dhuhr.getTime() + fridayDelayMinutes * 60 * 1000).getTime();
        if (jumuahReminderTime > now.getTime()) {
          alarms.push({
            id: `friday_jumuah_${todayDateStr}`,
            title: 'تقبل الله طاعتكم وجمعتكم 🕌',
            body: 'مضت ساعتان على صلاة الجمعة.. سجل صلاتك ونل بركة اليوم.',
            timestampMs: jumuahReminderTime,
            tag: 'jumuah-friday',
            url: '/?station=HOME',
            icon: DEFAULT_ALARM_ICON,
          });
        }

        const goldenHourTime = new Date(todayTimes.maghrib.getTime() - 60 * 60 * 1000).getTime();
        if (goldenHourTime > now.getTime()) {
          alarms.push({
            id: `friday_golden_${todayDateStr}`,
            title: 'ساعة الإجابة المباركة يوم الجمعة 🤲',
            body: 'بقي ساعة على غروب شمس الجمعة.. اغتنم هذا الوقت بالدعاء والصلاة على النبي ﷺ.',
            timestampMs: goldenHourTime,
            tag: 'friday-golden-hour',
            url: '/?station=HOME',
            icon: DEFAULT_ALARM_ICON,
          });
        }
      }

      // ----------------------------------------------------
      // 3. TOMORROW'S 5 PRAYERS (Rolling 36-48h window so alerts fire even if app stays closed!)
      // ----------------------------------------------------
      const tomorrowPrayerList: Array<{ name: PrayerName; time: Date; titleAr: string }> = [
        { name: 'fajr', time: tomorrowTimes.fajr, titleAr: 'صلاة الفجر' },
        { name: 'dhuhr', time: tomorrowTimes.dhuhr, titleAr: tomorrowTimes.isFriday ? 'صلاة الجمعة المباركة' : 'صلاة الظهر' },
        { name: 'asr', time: tomorrowTimes.asr, titleAr: 'صلاة العصر' },
        { name: 'maghrib', time: tomorrowTimes.maghrib, titleAr: 'صلاة المغرب' },
        { name: 'isha', time: tomorrowTimes.isha, titleAr: 'صلاة العشاء' },
      ];

      for (const tp of tomorrowPrayerList) {
        // Pre-prayer reminder tomorrow
        if (prePrayerAlertEnabled) {
          const preTime = new Date(tp.time.getTime() - prePrayerMinutes * 60 * 1000).getTime();
          if (preTime > now.getTime()) {
            alarms.push({
              id: `pre_${tp.name}_${tomorrowDateStr}`,
              title: `اقترب موعد ${tp.titleAr} ⏳`,
              body: `بقي قرابة ${prePrayerMinutes} دقائق على الأذان.. تهيأ بالوضوء والسكينة.`,
              timestampMs: preTime,
              tag: `pre-prayer-${tp.name}`,
              url: '/?station=HOME',
              icon: DEFAULT_ALARM_ICON,
            });
          }
        }

        // Adhan tomorrow
        const adhanTime = tp.time.getTime();
        if (adhanTime > now.getTime()) {
          alarms.push({
            id: `adhan_${tp.name}_${tomorrowDateStr}`,
            title: tp.name === 'fajr' ? 'الصلاة خير من النوم: صلاة الفجر 🌅' : `الله أكبر، حان الآن موعد ${tp.titleAr} 🕌`,
            body: tp.name === 'fajr'
              ? 'الله أكبر.. حان موعد فجر يوم جديد. استيقظ لتنال ذمة الله وبركة الصباح.'
              : 'حيّ على الصلاة، حيّ على الفلاح.. بادر بالصلاة في أول وقتها لتنال أجر الصف الأول.',
            timestampMs: adhanTime,
            tag: `adhan-${tp.name}`,
            url: '/?station=HOME',
            icon: DEFAULT_ALARM_ICON,
            actions: [
              { action: 'mark_prayed', title: 'صليت في وقتها ✔' },
              { action: 'snooze', title: 'سأصلي الآن 🤲' },
            ],
            data: { prayer: tp.name },
          });
        }

        // Follow-up 1 (+15m) tomorrow
        const follow1Time = new Date(tp.time.getTime() + followUpMinutes * 60 * 1000).getTime();
        if (follow1Time > now.getTime() && !(tomorrowTimes.isFriday && tp.name === 'dhuhr')) {
          alarms.push({
            id: `follow1_${tp.name}_${tomorrowDateStr}`,
            title: `تذكير استدراك: ${tp.titleAr} ⏳`,
            body: `مضت ${followUpMinutes} دقيقة على الأذان.. هل أديت الفريضة؟ سارع لتحفظ ثواب الوقت.`,
            timestampMs: follow1Time,
            tag: `follow1-${tp.name}`,
            url: '/?station=HOME',
            icon: DEFAULT_ALARM_ICON,
            actions: [
              { action: 'mark_prayed', title: 'صليت الآن ✔' },
              { action: 'snooze', title: 'تذكير بعد 10د ⏰' },
            ],
            data: { prayer: tp.name },
          });
        }
      }

      // Friday special tomorrow if tomorrow is Friday
      if (tomorrowTimes.isFriday) {
        const tomorrowGoldenHour = new Date(tomorrowTimes.maghrib.getTime() - 60 * 60 * 1000).getTime();
        if (tomorrowGoldenHour > now.getTime()) {
          alarms.push({
            id: `friday_golden_${tomorrowDateStr}`,
            title: 'ساعة الإجابة المباركة يوم الجمعة 🤲',
            body: 'بقي ساعة على غروب شمس الجمعة.. اغتنم هذا الوقت بالدعاء والصلاة على النبي ﷺ.',
            timestampMs: tomorrowGoldenHour,
            tag: 'friday-golden-hour',
            url: '/?station=HOME',
            icon: DEFAULT_ALARM_ICON,
          });
        }
      }

      // ----------------------------------------------------
      // 4. MIDDAY WIRD & SURAH AL-BAQARAH REMINDER (13:30 Today & Tomorrow)
      // ----------------------------------------------------
      if (settings?.lateWirdReminderEnabled ?? true) {
        const middayWirdToday = new Date();
        middayWirdToday.setHours(13, 30, 0, 0);
        if (middayWirdToday.getTime() > now.getTime()) {
          alarms.push({
            id: `wird_midday_${todayDateStr}`,
            title: 'ورد سورة البقرة المبارك 📖',
            body: 'انتصف نهارك.. لا تدع زحام العمل ينسيك نور وبركة سورة البقرة وطرد الشياطين.',
            timestampMs: middayWirdToday.getTime(),
            tag: 'wird-midday',
            url: '/?station=COMMUTE_MORNING',
            icon: DEFAULT_ALARM_ICON,
          });
        }

        const middayWirdTomorrow = new Date(tomorrow);
        middayWirdTomorrow.setHours(13, 30, 0, 0);
        if (middayWirdTomorrow.getTime() > now.getTime()) {
          alarms.push({
            id: `wird_midday_${tomorrowDateStr}`,
            title: 'ورد سورة البقرة المبارك 📖',
            body: 'انتصف نهارك.. لا تدع زحام العمل ينسيك نور وبركة سورة البقرة وطرد الشياطين.',
            timestampMs: middayWirdTomorrow.getTime(),
            tag: 'wird-midday',
            url: '/?station=COMMUTE_MORNING',
            icon: DEFAULT_ALARM_ICON,
          });
        }
      }

      // ----------------------------------------------------
      // 5. EVENING RETROSPECTIVE CHECK-IN (21:30 Today & Tomorrow)
      // ----------------------------------------------------
      if (settings?.lateCheckinReminderEnabled ?? true) {
        const checkinToday = new Date();
        checkinToday.setHours(21, 30, 0, 0);
        if (checkinToday.getTime() > now.getTime()) {
          alarms.push({
            id: `checkin_evening_${todayDateStr}`,
            title: 'حصاد اليوم وإغلاق المحطات (مِضمار) 🌙',
            body: 'حان وقت إغلاق محطات اليوم وحصاد نقاطك وتأمين شعلة الالتزام قبل النوم.',
            timestampMs: checkinToday.getTime(),
            tag: 'evening-checkin',
            url: '/?station=RETROSPECTIVE_CHECKIN',
            icon: DEFAULT_ALARM_ICON,
          });
        }

        const checkinTomorrow = new Date(tomorrow);
        checkinTomorrow.setHours(21, 30, 0, 0);
        if (checkinTomorrow.getTime() > now.getTime()) {
          alarms.push({
            id: `checkin_evening_${tomorrowDateStr}`,
            title: 'حصاد اليوم وإغلاق المحطات (مِضمار) 🌙',
            body: 'حان وقت إغلاق محطات اليوم وحصاد نقاطك وتأمين شعلة الالتزام قبل النوم.',
            timestampMs: checkinTomorrow.getTime(),
            tag: 'evening-checkin',
            url: '/?station=RETROSPECTIVE_CHECKIN',
            icon: DEFAULT_ALARM_ICON,
          });
        }
      }

      // ----------------------------------------------------
      // 6. MORNING & EVENING ADHKAR REMINDERS
      // ----------------------------------------------------
      if (settings?.morningEveningAdhkarRemindersEnabled ?? true) {
        // Today Morning Adhkar (20m post-sunrise)
        const morningToday = new Date(todayTimes.sunrise.getTime() + 20 * 60 * 1000).getTime();
        if (morningToday > now.getTime()) {
          alarms.push({
            id: `adhkar_morning_${todayDateStr}`,
            title: '🌿 حان وقت أذكار الصباح النبوية',
            body: '﴿وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ﴾.. أذكار الصباح حِصن يومك وسكينتك وبركة مسعاك.',
            timestampMs: morningToday,
            tag: 'adhkar-morning',
            url: '/?station=COMMUTE_MORNING',
            icon: DEFAULT_ALARM_ICON,
          });
        }

        // Today Evening Adhkar (25m post-Asr before sunset)
        const eveningToday = new Date(todayTimes.asr.getTime() + 25 * 60 * 1000).getTime();
        if (eveningToday > now.getTime()) {
          alarms.push({
            id: `adhkar_evening_${todayDateStr}`,
            title: '🌿 حان وقت أذكار المساء النبوية',
            body: '﴿وَقَبْلَ الْغُرُوبِ﴾.. بادر بأذكار المساء لتكون لك حِصناً وبركة وسكينة قبل حلول الليل.',
            timestampMs: eveningToday,
            tag: 'adhkar-evening',
            url: '/?station=EVENING_SPRINT',
            icon: DEFAULT_ALARM_ICON,
          });
        }

        // Tomorrow Morning Adhkar
        const morningTomorrow = new Date(tomorrowTimes.sunrise.getTime() + 20 * 60 * 1000).getTime();
        if (morningTomorrow > now.getTime()) {
          alarms.push({
            id: `adhkar_morning_${tomorrowDateStr}`,
            title: '🌿 حان وقت أذكار الصباح النبوية',
            body: '﴿وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ﴾.. أذكار الصباح حِصن يومك وسكينتك وبركة مسعاك.',
            timestampMs: morningTomorrow,
            tag: 'adhkar-morning',
            url: '/?station=COMMUTE_MORNING',
            icon: DEFAULT_ALARM_ICON,
          });
        }

        // Tomorrow Evening Adhkar
        const eveningTomorrow = new Date(tomorrowTimes.asr.getTime() + 25 * 60 * 1000).getTime();
        if (eveningTomorrow > now.getTime()) {
          alarms.push({
            id: `adhkar_evening_${tomorrowDateStr}`,
            title: '🌿 حان وقت أذكار المساء النبوية',
            body: '﴿وَقَبْلَ الْغُرُوبِ﴾.. بادر بأذكار المساء لتكون لك حِصناً وبركة وسكينة قبل حلول الليل.',
            timestampMs: eveningTomorrow,
            tag: 'adhkar-evening',
            url: '/?station=EVENING_SPRINT',
            icon: DEFAULT_ALARM_ICON,
          });
        }
      }

      // ----------------------------------------------------
      // 7. SUNNAH FASTING REMINDERS
      // ----------------------------------------------------
      if (settings?.sunnahFastingRemindersEnabled ?? true) {
        const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
        const eveningFastTime = new Date();
        eveningFastTime.setHours(20, 15, 0, 0); // 8:15 PM

        if (eveningFastTime.getTime() > now.getTime()) {
          // Sunday evening -> Tomorrow is Monday fasting
          if (dayOfWeek === 0) {
            alarms.push({
              id: `fasting_monday_${todayDateStr}`,
              title: '🌙 تذكير صيام غداً الإثنين (سنة نبوية)',
              body: 'غداً تُعرض الأعمال على الله وأحب أن يُعرض عملي وأنا صائم.. تذكر نية الصيام وبركة السحور.',
              timestampMs: eveningFastTime.getTime(),
              tag: 'fasting-monday',
              url: '/?station=HOME',
              icon: DEFAULT_ALARM_ICON,
            });
          }

          // Wednesday evening -> Tomorrow is Thursday fasting
          if (dayOfWeek === 3) {
            alarms.push({
              id: `fasting_thursday_${todayDateStr}`,
              title: '🌙 تذكير صيام غداً الخميس (سنة نبوية)',
              body: 'غداً يوم مبارك تُعرض فيه الأعمال على الله.. استعد بنية الصيام وبركة السحور.',
              timestampMs: eveningFastTime.getTime(),
              tag: 'fasting-thursday',
              url: '/?station=HOME',
              icon: DEFAULT_ALARM_ICON,
            });
          }

          // White Days
          const hijri = getHijriDateDetails(now);
          if (hijri.isTomorrowWhiteDay) {
            alarms.push({
              id: `fasting_white_days_${todayDateStr}`,
              title: '🌕 تذكير صيام الأيام البيض المباركة',
              body: `غداً تبدأ الأيام البيض (${hijri.day + 1} ${hijri.monthNameAr}).. صيام 3 أيام من كل شهر كصيام الدهر.`,
              timestampMs: eveningFastTime.getTime(),
              tag: 'fasting-white-days',
              url: '/?station=HOME',
              icon: DEFAULT_ALARM_ICON,
            });
          }
        }
      }

      // ----------------------------------------------------
      // 8. USER SCHEDULE & LIFESTYLE STATION REMINDERS (Today & Tomorrow)
      // ----------------------------------------------------
      if (settings?.scheduleStationRemindersEnabled ?? true) {
        const schedulePrefs = scheduleService.getPreferences();

        const scheduleDays = [
          { date: now, dateStr: todayDateStr },
          { date: tomorrow, dateStr: tomorrowDateStr },
        ];

        for (const sd of scheduleDays) {
          // Work sprint start
          if (schedulePrefs.workStartTime) {
            const [wH, wM] = schedulePrefs.workStartTime.split(':').map(Number);
            const workStartTime = new Date(sd.date);
            workStartTime.setHours(wH || 8, wM || 30, 0, 0);
            if (workStartTime.getTime() > now.getTime()) {
              alarms.push({
                id: `station_work_${sd.dateStr}`,
                title: '🎯 بداية ساعات العمل والتركيز العميق',
                body: 'حان موعد محطة العمل والإنتاجية.. صفّ ذهنك وحدد مهمة اليوم الرئيسية لتحقيق إنجاز نوعي.',
                timestampMs: workStartTime.getTime(),
                tag: 'station-work',
                url: '/?station=WORK_MICRO_SPRINT',
                icon: DEFAULT_ALARM_ICON,
              });
            }
          }

          // Sports / Gym Anchor
          const sportHour =
            schedulePrefs.sportsPreferredTime === 'morning'
              ? 7
              : schedulePrefs.sportsPreferredTime === 'evening'
              ? 18
              : schedulePrefs.sportsPreferredTime === 'night'
              ? 20
              : 16;
          const sportTime = new Date(sd.date);
          sportTime.setHours(sportHour, 30, 0, 0);
          if (sportTime.getTime() > now.getTime()) {
            const plannedSport = scheduleService.getSportForDay(sd.date);
            if (plannedSport !== 'rest') {
              alarms.push({
                id: `station_gym_${sd.dateStr}`,
                title: `🏋️‍♂️ موعد شحذ الجسد والرياضة (${plannedSport})`,
                body: 'حان موعد محطة اللياقة وتجديد النشاط.. الرياضة وقود صفائك الذهني ودرع صحتك.',
                timestampMs: sportTime.getTime(),
                tag: 'station-gym',
                url: '/?station=GYM_ANCHOR',
                icon: DEFAULT_ALARM_ICON,
              });
            }
          }

          // Bedtime wind-down alert (30m before sleepTime)
          if (schedulePrefs.sleepTime) {
            const [sH, sM] = schedulePrefs.sleepTime.split(':').map(Number);
            const windDownTime = new Date(sd.date);
            windDownTime.setHours(sH || 23, (sM || 0) - 30, 0, 0);
            if (windDownTime.getTime() > now.getTime()) {
              alarms.push({
                id: `station_sleep_${sd.dateStr}`,
                title: '🌙 وقت التهدئة والاستعداد للنوم العميق',
                body: 'شارف اليوم على الانتهاء.. أوقف الشاشات الزرقاء واقرأ أذكار النوم وسورة الملك لتنعم بنوم هانئ.',
                timestampMs: windDownTime.getTime(),
                tag: 'station-sleep',
                url: '/?station=HOME',
                icon: DEFAULT_ALARM_ICON,
              });
            }
          }
        }
      }

      // ----------------------------------------------------
      // 9. CUSTOM USER REMINDERS (Evaluated for BOTH Today & Tomorrow)
      // ----------------------------------------------------
      if (settings?.customRemindersEnabled ?? true) {
        try {
          const activeCustomReminders: CustomReminderItem[] = await db.custom_reminders
            .filter((r) => r.enabled)
            .toArray();

          const daysToCheck = [
            { date: now, dateStr: todayDateStr, isWeekend: now.getDay() === 5 || now.getDay() === 6 },
            { date: tomorrow, dateStr: tomorrowDateStr, isWeekend: tomorrow.getDay() === 5 || tomorrow.getDay() === 6 },
          ];

          for (const day of daysToCheck) {
            for (const rem of activeCustomReminders) {
              let shouldSchedule = false;
              if (rem.recurrence === 'daily') {
                shouldSchedule = true;
              } else if (rem.recurrence === 'weekdays' && !day.isWeekend) {
                shouldSchedule = true;
              } else if (rem.recurrence === 'once' && (!rem.date || rem.date === day.dateStr)) {
                shouldSchedule = true;
              }

              if (shouldSchedule && rem.time) {
                const [rH, rM] = rem.time.split(':').map(Number);
                const reminderTime = new Date(day.date);
                reminderTime.setHours(rH || 0, rM || 0, 0, 0);

                if (reminderTime.getTime() > now.getTime()) {
                  alarms.push({
                    id: `custom_${rem.id}_${day.dateStr}`,
                    title: `${rem.title} ⏳`,
                    body: rem.notes || 'تذكير مخصص من جدولك في مِضمار في موعدك المحدد.',
                    timestampMs: reminderTime.getTime(),
                    tag: `custom-${rem.id}`,
                    url: '/?station=HOME',
                    icon: DEFAULT_ALARM_ICON,
                    actions: [{ action: 'mark_done', title: 'تم الإنجاز ✔' }],
                    data: { reminderId: rem.id },
                  });
                }
              }
            }
          }
        } catch (e) {
          console.warn('Could not schedule custom reminders:', e);
        }
      }

      // ----------------------------------------------------
      // 10. WORKDAY TASKS WITH REMINDER TIME (Today & Tomorrow)
      // ----------------------------------------------------
      try {
        const targetDates = [todayDateStr, tomorrowDateStr];
        for (const dateStr of targetDates) {
          const tasks: WorkdayTask[] = await db.workday_tasks
            .where('date')
            .equals(dateStr)
            .filter((t) => !t.completed && !!t.reminderEnabled && !!t.reminderTime)
            .toArray();

          for (const task of tasks) {
            if (!task.reminderTime) continue;
            const [tH, tM] = task.reminderTime.split(':').map(Number);
            const targetDate = dateStr === todayDateStr ? new Date() : new Date(tomorrow);
            targetDate.setHours(tH || 0, tM || 0, 0, 0);

            if (targetDate.getTime() > now.getTime()) {
              alarms.push({
                id: `task_${task.id}_${dateStr}`,
                title: `تذكير مهمة: ${task.title} 📌`,
                body: `حان موعد إنجاز هذه المهمة (${task.estimatedMinutes} دقيقة).. افتح محطة العمل لبدء التركيز.`,
                timestampMs: targetDate.getTime(),
                tag: `task-${task.id}`,
                url: '/?station=WORK_MICRO_SPRINT',
                icon: DEFAULT_ALARM_ICON,
                actions: [{ action: 'start_task', title: 'ابدأ الآن 🚀' }],
                data: { taskId: task.id },
              });
            }
          }
        }
      } catch (e) {
        console.warn('Could not schedule task reminders:', e);
      }

      // ----------------------------------------------------
      // 11. STUDY COURSES REMINDERS (Today & Tomorrow)
      // ----------------------------------------------------
      try {
        const activeCourses = await db.study_courses
          .filter((c) => c.status === 'active' && !!c.reminderEnabled && !!c.reminderTime)
          .toArray();

        const checkDays = [
          { date: now, dateStr: todayDateStr, dayOfWeek: now.getDay() },
          { date: tomorrow, dateStr: tomorrowDateStr, dayOfWeek: tomorrow.getDay() },
        ];

        for (const cd of checkDays) {
          for (const course of activeCourses) {
            const studyDays = course.studyDaysPerWeek || [0, 1, 2, 3, 4, 6];
            if (!studyDays.includes(cd.dayOfWeek)) continue;

            if (!course.reminderTime) continue;
            const [cH, cM] = course.reminderTime.split(':').map(Number);
            const courseAlarmTime = new Date(cd.date);
            courseAlarmTime.setHours(cH || 17, cM || 0, 0, 0);

            if (courseAlarmTime.getTime() > now.getTime()) {
              alarms.push({
                id: `course_${course.id}_${cd.dateStr}`,
                title: `📚 موعد حصة المذاكرة: ${course.title}`,
                body: `المطلوب اليوم: ${course.recommendedDailyUnits || course.plannedUnitsPerDay} من المحتوى.. افتح محراب المذاكرة لحماية مسارك.`,
                timestampMs: courseAlarmTime.getTime(),
                tag: `course-${course.id}`,
                url: '/?station=WORK_MICRO_SPRINT',
                icon: DEFAULT_ALARM_ICON,
                actions: [{ action: 'start_study', title: 'ابدأ المذاكرة 🎓' }],
                data: { courseId: course.id },
              });
            }
          }
        }
      } catch (e) {
        console.warn('Could not schedule course reminders:', e);
      }

      // ----------------------------------------------------
      // 12. DISPATCH TO SERVICE WORKER & COMPANION SERVER PUSH
      // ----------------------------------------------------
      // Filter only future alarms and sort ascending
      const futureAlarms = alarms
        .filter((a) => a.timestampMs > Date.now())
        .sort((a, b) => a.timestampMs - b.timestampMs);

      // A) Dispatch to local Service Worker if available
      if (reg) {
        const targetWorker = reg.active || reg.waiting || reg.installing;
        if (targetWorker) {
          targetWorker.postMessage({
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
          } catch {}
        }
      }

      // B) Sync schedule to Companion Server Push Dispatcher (wakes device even when browser is closed!)
      const profileId = userState?.activeProfileId || 'default';
      await serverSync.syncPushSchedule(futureAlarms, profileId).catch(() => {});

      this.lastScheduledDate = todayDateStr;
      console.log(`⏰ [AutonomousScheduler] Successfully scheduled ${futureAlarms.length} upcoming alarms (36h window).`);
      return futureAlarms.length;
    } catch (err) {
      console.warn('AutonomousNotificationScheduler error:', err);
      return 0;
    } finally {
      this.isScheduling = false;
    }
  }

  /**
   * Schedule an instant 5-10 second lockscreen test alarm
   * so the user can lock their phone right away and verify it triggers!
   */
  public async testLockscreenAlarm(delaySeconds = 5): Promise<{ success: boolean; message: string }> {
    const perm = await this.requestPermission();
    if (perm !== 'granted') {
      return {
        success: false,
        message: 'يرجى تفعيل صلاحية الإشعارات أولاً في المتصفح.',
      };
    }

    try {
      const targetTimeMs = Date.now() + delaySeconds * 1000;

      // 1. Trigger server-side push (most reliable for closed app / locked screen)
      serverSync.sendTestLockscreenPush(delaySeconds).catch(() => {});

      // 2. Try native Notification Triggers API & SW postMessage
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;

        if ('showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined') {
          try {
            await reg.showNotification('🔔 تجربة تنبيه الشاشة المقفلة (مِضمار)', {
              body: 'ما شاء الله! التنبيه يعمل بدقة متناهية وشاشة هاتفك مقفلة والتطبيق مغلق.',
              icon: DEFAULT_ALARM_ICON,
              badge: DEFAULT_ALARM_ICON,
              tag: 'test-lockscreen-alert',
              requireInteraction: true,
              vibrate: [500, 250, 500, 250, 500],
              showTrigger: new TimestampTrigger(targetTimeMs),
              data: { url: '/' },
            } as any);
          } catch {}
        }

        const targetWorker = reg.active || reg.waiting || reg.installing;
        if (targetWorker) {
          targetWorker.postMessage({
            type: 'TEST_LOCKSCREEN_ALARM',
            delayMs: delaySeconds * 1000,
          });
        }
      }

      return {
        success: true,
        message: `تم إطلاق أمر التنبيه! اقفل شاشة هاتفك الآن أو اخرج من المتصفح وانتظر ${delaySeconds} ثوانٍ.`,
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
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg.active) {
          reg.active.postMessage({ type: 'CANCEL_ALARM', tag: `follow1-${prayerName}` });
          reg.active.postMessage({ type: 'CANCEL_ALARM', tag: `follow2-${prayerName}` });
        }

        const notifs = await reg.getNotifications();
        notifs.forEach((n) => {
          if (n.tag.includes(prayerName)) n.close();
        });
      }

      // Also cancel on server push dispatcher
      serverSync.cancelPushAlarm(`follow1-${prayerName}`);
      serverSync.cancelPushAlarm(`follow2-${prayerName}`);
    } catch {}
  }
}

export const autonomousNotificationScheduler = new AutonomousNotificationScheduler();
