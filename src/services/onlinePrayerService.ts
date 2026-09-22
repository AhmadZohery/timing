import { PRESET_CITIES, type CalculatedPrayerTimes, detectDefaultCityFromTimezone } from '../utils/prayerCalculator';
import type { PrayerLocationConfig } from '../types';
import { db } from '../db/db';

export interface OnlinePrayerTimesResult {
  source: 'online_api' | 'offline_calc';
  cityNameAr: string;
  cityNameEn: string;
  prayerTimes: CalculatedPrayerTimes;
  lastUpdated: string;
}

/**
 * Fetch official prayer timings from Aladhan API for given coordinates
 */
export async function fetchAladhanPrayerTimings(
  lat: number,
  lng: number,
  methodId: string = 'umm_al_qura',
  date: Date = new Date()
): Promise<CalculatedPrayerTimes | null> {
  try {
    const methodNumMap: Record<string, number> = {
      egyptian: 5,
      umm_al_qura: 4,
      mwl: 3,
      karachi: 1,
      isna: 2,
    };
    const methodNum = methodNumMap[methodId] || 4;

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const cacheKey = `midmar_prayer_online_${year}_${month}_${day}_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return deserializeCalculatedPrayerTimes(parsed, date);
      } catch {
        // cache invalid, re-fetch
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=${methodNum}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const json = await res.json();
    if (json.code !== 200 || !json.data?.timings) return null;

    const timings = json.data.timings;

    const parseTime = (timeStr: string): Date => {
      const [cleanTime] = timeStr.split(' ');
      const [hStr, mStr] = cleanTime.split(':');
      const d = new Date(date);
      d.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
      return d;
    };

    const fajr = parseTime(timings.Fajr);
    const sunrise = parseTime(timings.Sunrise);
    const dhuhr = parseTime(timings.Dhuhr);
    const asr = parseTime(timings.Asr);
    const maghrib = parseTime(timings.Maghrib);
    const isha = parseTime(timings.Isha);
    const duha = new Date(sunrise.getTime() + 20 * 60 * 1000);

    // Qiyam: Last third of night (between Maghrib and Fajr)
    const nextFajr = new Date(fajr.getTime() + 24 * 60 * 60 * 1000);
    const nightDuration = nextFajr.getTime() - maghrib.getTime();
    const qiyam = new Date(nextFajr.getTime() - nightDuration / 3.0);

    const result: CalculatedPrayerTimes = {
      fajr,
      sunrise,
      duha,
      dhuhr,
      asr,
      maghrib,
      isha,
      qiyam,
      isFriday: date.getDay() === 5,
    };

    // Cache in localStorage
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        fajr: fajr.toISOString(),
        sunrise: sunrise.toISOString(),
        duha: duha.toISOString(),
        dhuhr: dhuhr.toISOString(),
        asr: asr.toISOString(),
        maghrib: maghrib.toISOString(),
        isha: isha.toISOString(),
        qiyam: qiyam.toISOString(),
        isFriday: result.isFriday,
      })
    );

    return result;
  } catch {
    return null;
  }
}

function deserializeCalculatedPrayerTimes(data: any, originalDate: Date): CalculatedPrayerTimes {
  return {
    fajr: new Date(data.fajr),
    sunrise: new Date(data.sunrise),
    duha: new Date(data.duha),
    dhuhr: new Date(data.dhuhr),
    asr: new Date(data.asr),
    maghrib: new Date(data.maghrib),
    isha: new Date(data.isha),
    qiyam: new Date(data.qiyam),
    isFriday: originalDate.getDay() === 5,
  };
}

/**
 * Detect User's Real Geographic Location from HTTPS IP API
 */
export async function detectLocationByOnlineIp(): Promise<{
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();

    if (data.latitude && data.longitude) {
      return {
        city: data.cityName || 'دبي',
        country: data.countryName || 'الإمارات',
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        timezone: (data.timeZones && data.timeZones[0]) || 'Asia/Dubai',
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Intelligently resolve the most accurate Prayer Location for the current user
 * Auto-detects Dubai / UAE / local timezone and synchronizes to Dexie DB
 */
export async function autoDetectAndSyncPrayerLocation(
  currentConfig?: PrayerLocationConfig
): Promise<PrayerLocationConfig> {
  // If user already explicitly set a custom GPS or saved a preset city, verify timezone coherence
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const isGulfTz = tz.includes('Dubai') || tz.includes('Muscat') || tz.includes('Riyadh') || tz.includes('Qatar') || tz.includes('Kuwait');

  // If currently set to cairo but user's browser is in Gulf / Dubai timezone:
  const isMismatchedDefault = !currentConfig || (!currentConfig.city && isGulfTz) || (currentConfig.city === 'cairo' && isGulfTz);

  if (isMismatchedDefault) {
    // 1. Try IP Geolocation
    const ipLoc = await detectLocationByOnlineIp();
    if (ipLoc) {
      // Find matching preset city if available
      const matchingPreset = PRESET_CITIES.find(
        (c) =>
          c.nameEn.toLowerCase().includes(ipLoc.city.toLowerCase()) ||
          ipLoc.city.toLowerCase().includes(c.id.toLowerCase())
      ) || (isGulfTz ? PRESET_CITIES.find((c) => c.id === 'dubai') : null);

      const newConfig: PrayerLocationConfig = {
        city: matchingPreset ? matchingPreset.id : 'dubai',
        latitude: ipLoc.latitude,
        longitude: ipLoc.longitude,
        calculationMethod: 'umm_al_qura',
      };

      await db.user_state.update('current_user', {
        'settings.prayerLocation': newConfig,
      });

      return newConfig;
    }

    // 2. Fallback to Browser Timezone Detection
    const defaultCity = detectDefaultCityFromTimezone();
    const fallbackConfig: PrayerLocationConfig = {
      city: defaultCity.id,
      latitude: defaultCity.lat,
      longitude: defaultCity.lng,
      calculationMethod: defaultCity.defaultMethod,
    };

    await db.user_state.update('current_user', {
      'settings.prayerLocation': fallbackConfig,
    });

    return fallbackConfig;
  }

  return currentConfig;
}
