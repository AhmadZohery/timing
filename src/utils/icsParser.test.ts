import { describe, it, expect } from 'vitest';
import { parseICS, filterEventsForDate, parseIcsDateTime } from './icsParser';
import { computePrayerShieldBuffers, findConflictFreeFocusSlots } from './prayerShield';
import type { ExternalCalendarEvent } from '../types';

describe('Zero-Cloud ICS Calendar Parser (RFC 5545)', () => {
  const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
UID:event_001@google.com
SUMMARY:Executive Strategy Review & Roadmap
DESCRIPTION:Quarterly planning session\\nReview Q4 targets and OKRs.\\, All teams attend.
LOCATION:Meeting Room A / Zoom
DTSTART:20260930T090000Z
DTEND:20260930T100000Z
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:event_002@google.com
SUMMARY:Folded Line Event Summary That Spans Multiple Lines For
  Testing Unfolding Behavior Correctly
DTSTART:20260930T113000Z
DTEND:20260930T121500Z
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:event_cancelled@google.com
SUMMARY:Cancelled Standup
DTSTART:20260930T080000Z
DTEND:20260930T083000Z
STATUS:CANCELLED
END:VEVENT
BEGIN:VEVENT
UID:event_allday@google.com
SUMMARY:Company Hackathon
DTSTART;VALUE=DATE:20260930
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  it('parses standard VEVENTs correctly', () => {
    const events = parseICS(sampleIcs);
    expect(events.length).toBe(4);

    const first = events.find((e) => e.id === 'event_001@google.com');
    expect(first).toBeDefined();
    expect(first?.summary).toBe('Executive Strategy Review & Roadmap');
    expect(first?.location).toBe('Meeting Room A / Zoom');
    expect(first?.description).toContain('Quarterly planning session\nReview Q4 targets and OKRs., All teams attend.');
    expect(first?.status).toBe('CONFIRMED');
    expect(first?.isAllDay).toBe(false);
  });

  it('unfolds multi-line folded headers per RFC 5545', () => {
    const events = parseICS(sampleIcs);
    const folded = events.find((e) => e.id === 'event_002@google.com');
    expect(folded).toBeDefined();
    expect(folded?.summary).toBe('Folded Line Event Summary That Spans Multiple Lines For Testing Unfolding Behavior Correctly');
  });

  it('parses all-day events correctly with 24h default duration', () => {
    const events = parseICS(sampleIcs);
    const allDay = events.find((e) => e.id === 'event_allday@google.com');
    expect(allDay).toBeDefined();
    expect(allDay?.isAllDay).toBe(true);
    expect(allDay?.endTime).toBe(allDay!.startTime + 24 * 3600 * 1000);
  });

  it('parses date strings accurately', () => {
    const parsedAllDay = parseIcsDateTime('20260930');
    expect(parsedAllDay.isAllDay).toBe(true);

    const parsedUtc = parseIcsDateTime('20260930T120000Z');
    expect(parsedUtc.isAllDay).toBe(false);
    expect(new Date(parsedUtc.timestamp).toISOString()).toBe('2026-09-30T12:00:00.000Z');
  });

  it('filters active events for a specific target date, ignoring cancelled events', () => {
    const events = parseICS(sampleIcs);
    const target = new Date('2026-09-30T12:00:00Z');
    const dayEvents = filterEventsForDate(events, target);

    expect(dayEvents.some((e) => e.id === 'event_cancelled@google.com')).toBe(false);
    expect(dayEvents.some((e) => e.id === 'event_001@google.com')).toBe(true);
  });
});

describe('Circadian Prayer Shield Engine', () => {
  const baseDate = new Date('2026-09-30T00:00:00');
  
  // Prayer times for Cairo
  const prayerTimes: Record<string, string> = {
    fajr: '05:15',
    dhuhr: '12:45',
    asr: '16:05',
    maghrib: '18:35',
    isha: '19:50',
  };

  it('computes accurate protected buffer windows (-15m / +25m)', () => {
    const buffers = computePrayerShieldBuffers(prayerTimes, [], 15, 25, baseDate);
    expect(buffers.length).toBe(5);

    const dhuhrBuffer = buffers.find((b) => b.prayerName === 'dhuhr');
    expect(dhuhrBuffer).toBeDefined();
    
    // Dhuhr at 12:45
    // Buffer start: 12:30
    // Buffer end: 13:10
    expect(dhuhrBuffer?.bufferStart.getHours()).toBe(12);
    expect(dhuhrBuffer?.bufferStart.getMinutes()).toBe(30);
    expect(dhuhrBuffer?.bufferEnd.getHours()).toBe(13);
    expect(dhuhrBuffer?.bufferEnd.getMinutes()).toBe(10);
    expect(dhuhrBuffer?.isConflict).toBe(false);
  });

  it('detects corporate meeting conflicts overlapping prayer buffer', () => {
    const conflictMeeting: ExternalCalendarEvent = {
      id: 'meeting_conflict',
      summary: 'Urgent Client Sync',
      startTime: new Date(baseDate).setHours(12, 35, 0, 0), // 12:35 (during 12:30-13:10 buffer)
      endTime: new Date(baseDate).setHours(13, 0, 0, 0),
      isAllDay: false,
      status: 'CONFIRMED',
    };

    const safeMeeting: ExternalCalendarEvent = {
      id: 'meeting_safe',
      summary: 'Design Review',
      startTime: new Date(baseDate).setHours(14, 0, 0, 0), // 14:00 (safe)
      endTime: new Date(baseDate).setHours(15, 0, 0, 0),
      isAllDay: false,
      status: 'CONFIRMED',
    };

    const buffers = computePrayerShieldBuffers(prayerTimes, [conflictMeeting, safeMeeting], 15, 25, baseDate);
    
    const dhuhr = buffers.find((b) => b.prayerName === 'dhuhr');
    expect(dhuhr?.isConflict).toBe(true);
    expect(dhuhr?.conflictingEvents.length).toBe(1);
    expect(dhuhr?.conflictingEvents[0].id).toBe('meeting_conflict');

    const asr = buffers.find((b) => b.prayerName === 'asr');
    expect(asr?.isConflict).toBe(false);
  });

  it('recommends conflict-free deep-work focus slots', () => {
    const buffers = computePrayerShieldBuffers(prayerTimes, [], 15, 25, baseDate);
    
    const meeting: ExternalCalendarEvent = {
      id: 'sync_01',
      summary: 'Team Standup',
      startTime: new Date(baseDate).setHours(10, 0, 0, 0),
      endTime: new Date(baseDate).setHours(11, 0, 0, 0),
      isAllDay: false,
      status: 'CONFIRMED',
    };

    const slots = findConflictFreeFocusSlots(buffers, [meeting], 9, 18, 45, baseDate);
    
    expect(slots.length).toBeGreaterThan(0);
    // Every returned slot must be >= 45 min
    for (const slot of slots) {
      expect(slot.durationMinutes).toBeGreaterThanOrEqual(45);
    }
  });
});
