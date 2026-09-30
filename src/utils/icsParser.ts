/**
 * Client-Side Zero-Cloud RFC 5545 iCalendar (.ics) Parser
 * Midmar LifeOS - Local-First Sovereignty (OPP-0104 / SPEC-0104)
 * 
 * Safely parses .ics data purely in the browser with zero cloud dependencies.
 */

import type { ExternalCalendarEvent } from '../types';

/**
 * Unescape RFC 5545 text sequences
 */
function unescapeIcsText(text: string): string {
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Parse RFC 5545 date/time strings into Unix timestamp (milliseconds)
 * Examples:
 *   - 20260930T093000Z (UTC)
 *   - 20260930T093000 (Local time)
 *   - 20260930 (All day date)
 */
export function parseIcsDateTime(raw: string): { timestamp: number; isAllDay: boolean } {
  const cleaned = raw.trim();

  // All-day date format: YYYYMMDD
  if (/^\d{8}$/.test(cleaned)) {
    const year = parseInt(cleaned.substring(0, 4), 10);
    const month = parseInt(cleaned.substring(4, 6), 10) - 1;
    const day = parseInt(cleaned.substring(6, 8), 10);
    const date = new Date(year, month, day, 0, 0, 0, 0);
    return { timestamp: date.getTime(), isAllDay: true };
  }

  // Date-Time format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hour = parseInt(match[4], 10);
    const min = parseInt(match[5], 10);
    const sec = parseInt(match[6], 10);
    const isUtc = match[7] === 'Z';

    if (isUtc) {
      const date = new Date(Date.UTC(year, month, day, hour, min, sec));
      return { timestamp: date.getTime(), isAllDay: false };
    } else {
      const date = new Date(year, month, day, hour, min, sec);
      return { timestamp: date.getTime(), isAllDay: false };
    }
  }

  // Fallback to standard Date parsing if format varies
  const fallback = Date.parse(cleaned);
  return {
    timestamp: isNaN(fallback) ? Date.now() : fallback,
    isAllDay: false,
  };
}

/**
 * Unfold multi-line folded headers according to RFC 5545:
 * Lines that start with a space or tab are continuations of previous lines.
 */
function unfoldIcsLines(rawIcs: string): string[] {
  const lines = rawIcs.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const unfolded: string[] = [];

  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      // Append folded content to previous line, omitting the leading whitespace
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }

  return unfolded;
}

/**
 * Parse an ISO 8601 duration (e.g. PT1H30M, PT45M, P1D)
 */
function parseIcsDuration(durationStr: string): number {
  const match = durationStr.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) return 3600 * 1000; // default 1 hour in ms

  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  const seconds = parseInt(match[4] || '0', 10);

  return (days * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000;
}

/**
 * Parse an RFC 5545 iCalendar text into ExternalCalendarEvent array
 */
export function parseICS(icsData: string, sourceFeedUrl?: string): ExternalCalendarEvent[] {
  if (!icsData || typeof icsData !== 'string') return [];

  const lines = unfoldIcsLines(icsData);
  const events: ExternalCalendarEvent[] = [];
  let inEvent = false;
  let currentEvent: Partial<ExternalCalendarEvent> = {};
  let currentDurationMs: number | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {
        status: 'CONFIRMED',
        sourceFeedUrl,
        updatedAt: Date.now(),
      };
      currentDurationMs = null;
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (inEvent && currentEvent.id && currentEvent.summary && currentEvent.startTime) {
        // Calculate endTime if not provided
        if (!currentEvent.endTime) {
          if (currentDurationMs !== null) {
            currentEvent.endTime = currentEvent.startTime + currentDurationMs;
          } else if (currentEvent.isAllDay) {
            currentEvent.endTime = currentEvent.startTime + 24 * 3600 * 1000;
          } else {
            currentEvent.endTime = currentEvent.startTime + 3600 * 1000; // 1 hr default
          }
        }

        events.push(currentEvent as ExternalCalendarEvent);
      }
      inEvent = false;
      currentEvent = {};
      currentDurationMs = null;
      continue;
    }

    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const propKeyPart = line.substring(0, colonIdx);
    const propValue = line.substring(colonIdx + 1);

    const keyUpper = propKeyPart.toUpperCase();
    const [propName] = keyUpper.split(';');

    switch (propName) {
      case 'UID':
        currentEvent.id = propValue.trim();
        break;

      case 'SUMMARY':
        currentEvent.summary = unescapeIcsText(propValue.trim());
        break;

      case 'DESCRIPTION':
        currentEvent.description = unescapeIcsText(propValue.trim());
        break;

      case 'LOCATION':
        currentEvent.location = unescapeIcsText(propValue.trim());
        break;

      case 'STATUS': {
        const val = propValue.trim().toUpperCase();
        if (val === 'CANCELLED' || val === 'TENTATIVE' || val === 'CONFIRMED') {
          currentEvent.status = val as ExternalCalendarEvent['status'];
        }
        break;
      }

      case 'DTSTART': {
        const parsed = parseIcsDateTime(propValue);
        currentEvent.startTime = parsed.timestamp;
        currentEvent.isAllDay = parsed.isAllDay;
        break;
      }

      case 'DTEND': {
        const parsed = parseIcsDateTime(propValue);
        currentEvent.endTime = parsed.timestamp;
        break;
      }

      case 'DURATION': {
        currentDurationMs = parseIcsDuration(propValue.trim());
        break;
      }
    }
  }

  return events;
}

/**
 * Filter calendar events for a specific target day
 */
export function filterEventsForDate(
  events: ExternalCalendarEvent[],
  targetDate: Date | string
): ExternalCalendarEvent[] {
  const d = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
  const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

  return events.filter((e) => {
    if (e.status === 'CANCELLED') return false;
    // Event overlaps with day if its start is before day end and end is after day start
    return e.startTime <= endOfDay && e.endTime >= startOfDay;
  });
}
