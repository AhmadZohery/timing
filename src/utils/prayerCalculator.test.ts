import { describe, it, expect } from 'vitest';
import { calculatePrayerTimes, PRESET_CITIES, detectDefaultCityFromTimezone } from './prayerCalculator';

describe('prayerCalculator', () => {
  it('should have preset cities defined with valid coordinates', () => {
    expect(PRESET_CITIES.length).toBeGreaterThan(10);
    const cairo = PRESET_CITIES.find((c) => c.id === 'cairo');
    expect(cairo).toBeDefined();
    expect(cairo?.lat).toBeCloseTo(30.0444, 2);
    expect(cairo?.lng).toBeCloseTo(31.2357, 2);
  });

  it('should calculate valid ascending prayer times for Cairo on a fixed date', () => {
    const testDate = new Date('2026-06-15T12:00:00Z');
    const times = calculatePrayerTimes(testDate, 30.0444, 31.2357, 'egyptian');

    expect(times).toBeDefined();
    expect(times.fajr instanceof Date).toBe(true);
    expect(times.sunrise instanceof Date).toBe(true);
    expect(times.dhuhr instanceof Date).toBe(true);
    expect(times.asr instanceof Date).toBe(true);
    expect(times.maghrib instanceof Date).toBe(true);
    expect(times.isha instanceof Date).toBe(true);

    // Astronomical order verification: Fajr < Sunrise < Dhuhr < Asr < Maghrib < Isha
    expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
    expect(times.sunrise.getTime()).toBeLessThan(times.dhuhr.getTime());
    expect(times.dhuhr.getTime()).toBeLessThan(times.asr.getTime());
    expect(times.asr.getTime()).toBeLessThan(times.maghrib.getTime());
    expect(times.maghrib.getTime()).toBeLessThan(times.isha.getTime());
  });

  it('should return a preset city from detectDefaultCityFromTimezone', () => {
    const city = detectDefaultCityFromTimezone();
    expect(city).toBeDefined();
    expect(city.id).toBeTypeOf('string');
    expect(city.lat).toBeTypeOf('number');
    expect(city.lng).toBeTypeOf('number');
  });
});
