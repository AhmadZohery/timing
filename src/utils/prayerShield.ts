/**
 * Circadian Prayer Shield Engine
 * Midmar LifeOS - Local-First Sovereignty (OPP-0104 / SPEC-0104)
 * 
 * Computes protected buffer zones around sacred prayer times
 * and detects scheduling conflicts with external meetings.
 */

import type { ExternalCalendarEvent, PrayerShieldBuffer, FocusSlot } from '../types';

export const PRAYER_NAMES_AR: Record<string, string> = {
  fajr: 'صلاة الفجر',
  sunrise: 'الشروق',
  duha: 'صلاة الضحى',
  dhuhr: 'صلاة الظهر',
  jummah: 'صلاة الجمعة',
  asr: 'صلاة العصر',
  maghrib: 'صلاة المغرب',
  isha: 'صلاة العشاء',
  qiyam: 'قيام الليل',
};

/**
 * Normalizes input prayer time (Date or HH:MM string or ISO string) to a Date on the target day
 */
function normalizePrayerTimeToDate(raw: Date | string, targetDate: Date): Date {
  if (raw instanceof Date) {
    return raw;
  }

  if (typeof raw === 'string') {
    // Check if HH:MM format
    const timeMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const d = new Date(targetDate);
      d.setHours(hours, minutes, 0, 0);
      return d;
    }

    // Try parsing as ISO date string
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date(targetDate);
}

/**
 * Computes protected prayer buffer zones and identifies conflicting meetings
 * 
 * @param prayerTimes Object mapping prayer names ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha') to Date or 'HH:MM'
 * @param calendarEvents List of external calendar events
 * @param bufferMinutesBefore Preparation/Wudu buffer (default: 15 min)
 * @param bufferMinutesAfter Prayer/Sunnah/Adhkar buffer (default: 25 min)
 * @param targetDate Base date for calculation (default: current day)
 */
export function computePrayerShieldBuffers(
  prayerTimes: Record<string, Date | string>,
  calendarEvents: ExternalCalendarEvent[],
  bufferMinutesBefore = 15,
  bufferMinutesAfter = 25,
  targetDate: Date | string = new Date()
): PrayerShieldBuffer[] {
  const baseDate = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const isFriday = baseDate.getDay() === 5;

  const corePrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const buffers: PrayerShieldBuffer[] = [];

  for (const prayerKey of corePrayers) {
    const rawTime = prayerTimes[prayerKey];
    if (!rawTime) continue;

    const prayerDate = normalizePrayerTimeToDate(rawTime, baseDate);
    const bufferStart = new Date(prayerDate.getTime() - bufferMinutesBefore * 60 * 1000);
    const bufferEnd = new Date(prayerDate.getTime() + bufferMinutesAfter * 60 * 1000);

    const prayerName = (prayerKey === 'dhuhr' && isFriday) ? 'jummah' : prayerKey;
    const prayerNameAr = PRAYER_NAMES_AR[prayerName] || prayerKey;

    // Detect overlapping calendar events
    const conflictingEvents = calendarEvents.filter((event) => {
      if (event.status === 'CANCELLED') return false;
      // Overlap: event starts before buffer end AND ends after buffer start
      return event.startTime < bufferEnd.getTime() && event.endTime > bufferStart.getTime();
    });

    buffers.push({
      prayerName,
      prayerNameAr,
      prayerTime: prayerDate,
      bufferStart,
      bufferEnd,
      isConflict: conflictingEvents.length > 0,
      conflictingEvents,
    });
  }

  return buffers;
}

/**
 * Identifies conflict-free deep-work focus slots throughout the day
 * that do not collide with either prayer buffers or external meetings.
 */
export function findConflictFreeFocusSlots(
  prayerBuffers: PrayerShieldBuffer[],
  calendarEvents: ExternalCalendarEvent[],
  dayStartHour = 8,
  dayEndHour = 22,
  minSlotMinutes = 25,
  targetDate: Date | string = new Date()
): FocusSlot[] {
  const baseDate = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  
  const dayStart = new Date(baseDate);
  dayStart.setHours(dayStartHour, 0, 0, 0);

  const dayEnd = new Date(baseDate);
  dayEnd.setHours(dayEndHour, 0, 0, 0);

  // Collect all blocked intervals
  interface BlockedInterval {
    start: number;
    end: number;
  }

  const blocked: BlockedInterval[] = [];

  // 1. Prayer Buffers
  for (const b of prayerBuffers) {
    blocked.push({
      start: b.bufferStart.getTime(),
      end: b.bufferEnd.getTime(),
    });
  }

  // 2. Calendar Events
  for (const e of calendarEvents) {
    if (e.status !== 'CANCELLED') {
      blocked.push({
        start: e.startTime,
        end: e.endTime,
      });
    }
  }

  // Sort blocked intervals by start time
  blocked.sort((a, b) => a.start - b.start);

  // Merge overlapping blocked intervals
  const mergedBlocked: BlockedInterval[] = [];
  for (const interval of blocked) {
    if (mergedBlocked.length === 0) {
      mergedBlocked.push({ ...interval });
    } else {
      const last = mergedBlocked[mergedBlocked.length - 1];
      if (interval.start <= last.end) {
        last.end = Math.max(last.end, interval.end);
      } else {
        mergedBlocked.push({ ...interval });
      }
    }
  }

  // Find gaps
  const freeSlots: FocusSlot[] = [];
  let currentPointer = dayStart.getTime();
  const dayEndMs = dayEnd.getTime();
  const minSlotMs = minSlotMinutes * 60 * 1000;

  for (const interval of mergedBlocked) {
    // If interval ends before dayStart, skip
    if (interval.end <= currentPointer) continue;

    // If interval starts after pointer, check gap
    if (interval.start > currentPointer) {
      const gapEnd = Math.min(interval.start, dayEndMs);
      const gapDuration = gapEnd - currentPointer;

      if (gapDuration >= minSlotMs) {
        freeSlots.push({
          start: new Date(currentPointer),
          end: new Date(gapEnd),
          durationMinutes: Math.round(gapDuration / (60 * 1000)),
        });
      }
    }

    currentPointer = Math.max(currentPointer, interval.end);
    if (currentPointer >= dayEndMs) break;
  }

  // Final gap until dayEnd
  if (currentPointer < dayEndMs && (dayEndMs - currentPointer) >= minSlotMs) {
    freeSlots.push({
      start: new Date(currentPointer),
      end: new Date(dayEndMs),
      durationMinutes: Math.round((dayEndMs - currentPointer) / (60 * 1000)),
    });
  }

  return freeSlots;
}
