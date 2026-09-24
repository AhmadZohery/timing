import type { PrayerName } from '../types';

export interface PresetCity {
  id: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  defaultMethod: 'egyptian' | 'umm_al_qura' | 'mwl' | 'karachi' | 'isna';
}

export const PRESET_CITIES: PresetCity[] = [
  { id: 'cairo', nameAr: 'القاهرة، مصر', nameEn: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357, defaultMethod: 'egyptian' },
  { id: 'alexandria', nameAr: 'الإسكندرية، مصر', nameEn: 'Alexandria, Egypt', lat: 31.2001, lng: 29.9187, defaultMethod: 'egyptian' },
  { id: 'makkah', nameAr: 'مكة المكرمة، السعودية', nameEn: 'Makkah, Saudi Arabia', lat: 21.4225, lng: 39.8262, defaultMethod: 'umm_al_qura' },
  { id: 'madinah', nameAr: 'المدينة المنورة، السعودية', nameEn: 'Madinah, Saudi Arabia', lat: 24.5247, lng: 39.5692, defaultMethod: 'umm_al_qura' },
  { id: 'riyadh', nameAr: 'الرياض، السعودية', nameEn: 'Riyadh, Saudi Arabia', lat: 24.7136, lng: 46.6753, defaultMethod: 'umm_al_qura' },
  { id: 'jeddah', nameAr: 'جدة، السعودية', nameEn: 'Jeddah, Saudi Arabia', lat: 21.5433, lng: 39.1728, defaultMethod: 'umm_al_qura' },
  { id: 'dubai', nameAr: 'دبي، الإمارات', nameEn: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, defaultMethod: 'umm_al_qura' },
  { id: 'abu_dhabi', nameAr: 'أبو ظبي، الإمارات', nameEn: 'Abu Dhabi, UAE', lat: 24.4539, lng: 54.3773, defaultMethod: 'umm_al_qura' },
  { id: 'kuwait', nameAr: 'مدينة الكويت', nameEn: 'Kuwait City', lat: 29.3759, lng: 47.9774, defaultMethod: 'umm_al_qura' },
  { id: 'doha', nameAr: 'الدوحة، قطر', nameEn: 'Doha, Qatar', lat: 25.2854, lng: 51.5310, defaultMethod: 'umm_al_qura' },
  { id: 'amman', nameAr: 'عمان، الأردن', nameEn: 'Amman, Jordan', lat: 31.9539, lng: 35.9106, defaultMethod: 'mwl' },
  { id: 'jerusalem', nameAr: 'القدس الشريف، فلسطين', nameEn: 'Jerusalem, Palestine', lat: 31.7683, lng: 35.2137, defaultMethod: 'mwl' },
  { id: 'damascus', nameAr: 'دمشق، سوريا', nameEn: 'Damascus, Syria', lat: 33.5138, lng: 36.2765, defaultMethod: 'mwl' },
  { id: 'beirut', nameAr: 'بيروت، لبنان', nameEn: 'Beirut, Lebanon', lat: 33.8938, lng: 35.5018, defaultMethod: 'mwl' },
  { id: 'baghdad', nameAr: 'بغداد، العراق', nameEn: 'Baghdad, Iraq', lat: 33.3152, lng: 44.3661, defaultMethod: 'mwl' },
  { id: 'tripoli', nameAr: 'طرابلس، ليبيا', nameEn: 'Tripoli, Libya', lat: 32.8872, lng: 13.1913, defaultMethod: 'mwl' },
  { id: 'tunis', nameAr: 'تونس العاصمة', nameEn: 'Tunis, Tunisia', lat: 36.8065, lng: 10.1815, defaultMethod: 'mwl' },
  { id: 'algiers', nameAr: 'الجزائر العاصمة', nameEn: 'Algiers, Algeria', lat: 36.7538, lng: 3.0588, defaultMethod: 'mwl' },
  { id: 'casablanca', nameAr: 'الدار البيضاء، المغرب', nameEn: 'Casablanca, Morocco', lat: 33.5731, lng: -7.5898, defaultMethod: 'mwl' },
  { id: 'rabat', nameAr: 'الرباط، المغرب', nameEn: 'Rabat, Morocco', lat: 34.0209, lng: -6.8416, defaultMethod: 'mwl' },
  { id: 'khartoum', nameAr: 'الخرطوم، السودان', nameEn: 'Khartoum, Sudan', lat: 15.5007, lng: 32.5599, defaultMethod: 'egyptian' },
  { id: 'istanbul', nameAr: 'إسطنبول، تركيا', nameEn: 'Istanbul, Turkey', lat: 41.0082, lng: 28.9784, defaultMethod: 'mwl' },
  { id: 'london', nameAr: 'لندن، المملكة المتحدة', nameEn: 'London, UK', lat: 51.5074, lng: -0.1278, defaultMethod: 'mwl' },
  { id: 'paris', nameAr: 'باريس، فرنسا', nameEn: 'Paris, France', lat: 48.8566, lng: 2.3522, defaultMethod: 'mwl' },
  { id: 'new_york', nameAr: 'نيويورك، أمريكا', nameEn: 'New York, USA', lat: 40.7128, lng: -74.0060, defaultMethod: 'isna' },
  { id: 'muscat', nameAr: 'مسقط، عُمان', nameEn: 'Muscat, Oman', lat: 23.5880, lng: 58.3829, defaultMethod: 'umm_al_qura' },
  { id: 'manama', nameAr: 'المنامة، البحرين', nameEn: 'Manama, Bahrain', lat: 26.2285, lng: 50.5860, defaultMethod: 'umm_al_qura' },
  { id: 'sanaa', nameAr: 'صنعاء، اليمن', nameEn: 'Sanaa, Yemen', lat: 15.3694, lng: 44.1910, defaultMethod: 'umm_al_qura' },
];

export const CALCULATION_METHODS = [
  { id: 'egyptian', nameAr: 'الهيئة العامة المصرية للمساحة (الفجر 19.5° / العشاء 17.5°)', nameEn: 'Egyptian General Authority of Survey' },
  { id: 'umm_al_qura', nameAr: 'أم القرى - مكة المكرمة (الفجر 18.5° / العشاء +90 دقيقة)', nameEn: 'Umm Al-Qura, Makkah' },
  { id: 'mwl', nameAr: 'رابطة العالم الإسلامي (الفجر 18° / العشاء 17°)', nameEn: 'Muslim World League (MWL)' },
  { id: 'karachi', nameAr: 'جامعة العلوم الإسلامية بكراتشي (الفجر 18° / العشاء 18°)', nameEn: 'University of Islamic Sciences, Karachi' },
  { id: 'isna', nameAr: 'الجمعية الإسلامية لأمريكا الشمالية ISNA (الفجر 15° / العشاء 15°)', nameEn: 'Islamic Society of North America (ISNA)' },
] as const;

export function detectDefaultCityFromTimezone(): PresetCity {
  const getCity = (id: string): PresetCity => PRESET_CITIES.find((c) => c.id === id) || PRESET_CITIES[6];
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const offset = -new Date().getTimezoneOffset() / 60;

    // Timezone +4 (United Arab Emirates / Dubai / Abu Dhabi / Muscat)
    if (offset === 4 || tz.includes('Dubai') || tz.includes('Abu_Dhabi') || tz.includes('Muscat')) {
      return getCity('dubai');
    }
    // Timezone +3 (Saudi Arabia, Kuwait, Qatar, Bahrain, Iraq)
    if (tz.includes('Riyadh') || tz.includes('Saudi') || tz.includes('Makkah')) return getCity('riyadh');
    if (tz.includes('Kuwait')) return getCity('kuwait');
    if (tz.includes('Qatar')) return getCity('doha');
    if (tz.includes('Bahrain') || tz.includes('Manama')) return getCity('manama');
    if (tz.includes('Baghdad')) return getCity('baghdad');

    // Egypt (+2 or +3 with DST)
    if (tz.includes('Cairo') || tz.includes('Egypt')) return getCity('cairo');

    // Other Arab & World capitals
    if (tz.includes('Amman')) return getCity('amman');
    if (tz.includes('Jerusalem') || tz.includes('Gaza') || tz.includes('Hebron')) return getCity('jerusalem');
    if (tz.includes('Damascus')) return getCity('damascus');
    if (tz.includes('Beirut')) return getCity('beirut');
    if (tz.includes('Tripoli')) return getCity('tripoli');
    if (tz.includes('Tunis')) return getCity('tunis');
    if (tz.includes('Algiers')) return getCity('algiers');
    if (tz.includes('Casablanca')) return getCity('casablanca');
    if (tz.includes('Rabat')) return getCity('rabat');
    if (tz.includes('Khartoum')) return getCity('khartoum');
    if (tz.includes('Istanbul')) return getCity('istanbul');
    if (tz.includes('London')) return getCity('london');
    if (tz.includes('Paris') || tz.includes('Berlin')) return getCity('paris');
    if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Toronto')) return getCity('new_york');
    if (tz.includes('Sanaa') || tz.includes('Yemen')) return getCity('sanaa');

    if (offset === 3) return getCity('riyadh');
    if (offset === 2) return getCity('cairo');
  } catch {
    // fallback
  }
  return getCity('dubai');
}

export interface CalculatedPrayerTimes {
  fajr: Date;
  sunrise: Date;
  duha: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  qiyam: Date; // Last third of night start
  isFriday: boolean;
}

// Astronomical calculation utilities
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

function radToDeg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

function normalize(value: number, max: number): number {
  let val = value - max * Math.floor(value / max);
  if (val < 0) val += max;
  return val;
}

export interface PrayerCalculationOptions {
  latitude?: number;
  longitude?: number;
  method?: 'egyptian' | 'umm_al_qura' | 'mwl' | 'karachi' | 'isna';
  asrJuristicMethod?: 'standard' | 'hanafi'; // standard = 1 shadow, hanafi = 2 shadow
  highLatitudeRule?: 'seventh_of_night' | 'angle_based' | 'none';
}

/**
 * High-accuracy astronomical offline prayer times engine
 * Supports high-latitude fiqh adjustments and Hanafi Asr
 */
export function calculatePrayerTimes(
  date: Date = new Date(),
  latitude: number = 30.0444, // Default Cairo
  longitude: number = 31.2357,
  method: 'egyptian' | 'umm_al_qura' | 'mwl' | 'karachi' | 'isna' = 'egyptian',
  asrJuristicMethod: 'standard' | 'hanafi' = 'standard'
): CalculatedPrayerTimes {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const isFriday = date.getDay() === 5;

  // Julian Date calculation
  let m = month;
  let y = year;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    B -
    1524.5;

  const D = JD - 2451545.0;

  // Mean Solar Anomaly and Mean Ecliptic Longitude
  const g = normalize(357.529 + 0.98560028 * D, 360);
  const q = normalize(280.459 + 0.98564736 * D, 360);
  const L = normalize(q + 1.915 * Math.sin(degToRad(g)) + 0.02 * Math.sin(degToRad(2 * g)), 360);

  // Sun Declination and Equation of Time
  const e = 23.439 - 0.00000036 * D;
  const sinDec = Math.sin(degToRad(e)) * Math.sin(degToRad(L));
  const dec = radToDeg(Math.asin(sinDec));

  const RA = radToDeg(Math.atan2(Math.cos(degToRad(e)) * Math.sin(degToRad(L)), Math.cos(degToRad(L)))) / 15.0;
  const EqT = q / 15.0 - normalize(RA, 24);

  // Timezone offset in hours
  const timezoneOffset = -date.getTimezoneOffset() / 60.0;

  // Solar Transit (Dhuhr)
  const noon = 12 + timezoneOffset - longitude / 15.0 - EqT;

  // Parameters according to calculation method
  let fajrAngle = 19.5;
  let ishaAngle = 17.5;
  let ishaMinutesAfterMaghrib: number | null = null;

  if (method === 'umm_al_qura') {
    fajrAngle = 18.5;
    ishaMinutesAfterMaghrib = 90;
  } else if (method === 'mwl') {
    fajrAngle = 18.0;
    ishaAngle = 17.0;
  } else if (method === 'karachi') {
    fajrAngle = 18.0;
    ishaAngle = 18.0;
  } else if (method === 'isna') {
    fajrAngle = 15.0;
    ishaAngle = 15.0;
  }

  // Hour Angle calculation helper with safety check
  const hourAngle = (angle: number): number => {
    const cosH =
      (Math.sin(degToRad(-angle)) -
        Math.sin(degToRad(latitude)) * Math.sin(degToRad(dec))) /
      (Math.cos(degToRad(latitude)) * Math.cos(degToRad(dec)));
    if (cosH > 1 || cosH < -1) return NaN; // Twilight does not naturally occur
    return radToDeg(Math.acos(cosH)) / 15.0;
  };

  // Asr Shadow angle (Standard = 1x shadow factor; Hanafi = 2x shadow factor)
  const asrAngle = (): number => {
    const shadowFactor = asrJuristicMethod === 'hanafi' ? 2.0 : 1.0;
    const d = Math.abs(latitude - dec);
    const alt = radToDeg(Math.atan(1.0 / (shadowFactor + Math.tan(degToRad(d)))));
    const cosH =
      (Math.sin(degToRad(alt)) -
        Math.sin(degToRad(latitude)) * Math.sin(degToRad(dec))) /
      (Math.cos(degToRad(latitude)) * Math.cos(degToRad(dec)));
    return radToDeg(Math.acos(Math.max(-1, Math.min(1, cosH)))) / 15.0;
  };

  // Sunrise/Sunset angle with atmospheric refraction (~0.833 deg)
  const sunAngle = 0.833;
  let H_sun = hourAngle(sunAngle);
  if (isNaN(H_sun)) H_sun = 6.0; // Polar day/night fallback

  let H_fajr = hourAngle(fajrAngle);
  const H_asr = asrAngle();
  let H_isha = hourAngle(ishaAngle);

  // High Latitude Fiqh Adjustment (1/7th of Night Rule):
  // According to Islamic Fiqh Academy and European Council for Fatwa and Research (ECFR):
  // Only apply 1/7th rule if twilight fails to appear (white nights in summer)
  // or if the calculated twilight interval exceeds the night boundary (H_fajr > H_sun + nightPortion).
  // Do NOT artificially compress Fajr during winter in moderate high-latitudes (e.g. London/Paris).
  const nightPortion = (24.0 - 2.0 * H_sun) / 7.0;
  const maxFajrPortion = H_sun + nightPortion;
  const maxIshaPortion = H_sun + nightPortion;

  if (isNaN(H_fajr) || (Math.abs(latitude) > 48.0 && H_fajr > maxFajrPortion)) {
    H_fajr = maxFajrPortion;
  }
  if (isNaN(H_isha) || (Math.abs(latitude) > 48.0 && H_isha > maxIshaPortion)) {
    H_isha = maxIshaPortion;
  }

  // Time calculations in hours
  const fajrHours = noon - H_fajr;
  const sunriseHours = noon - H_sun;
  const dhuhrHours = noon;
  const asrHours = noon + H_asr;
  const maghribHours = noon + H_sun;
  const ishaHours = ishaMinutesAfterMaghrib
    ? maghribHours + ishaMinutesAfterMaghrib / 60.0
    : noon + H_isha;

  const toDate = (hours: number): Date => {
    const d = new Date(date);
    d.setSeconds(0);
    d.setMilliseconds(0);
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const fajrDate = toDate(fajrHours);
  const sunriseDate = toDate(sunriseHours);
  const dhuhrDate = toDate(dhuhrHours);
  const asrDate = toDate(asrHours);
  const maghribDate = toDate(maghribHours);
  const ishaDate = toDate(ishaHours);

  // Duha prayer: 20 minutes after sunrise
  const duhaDate = new Date(sunriseDate.getTime() + 20 * 60 * 1000);

  // Qiyam Al-Layl (Last third of the night):
  // Night spans from Maghrib today to Fajr tomorrow
  // Duration = 24h + Fajr - Maghrib
  const nextFajrTime = fajrDate.getTime() + 24 * 60 * 60 * 1000;
  const nightDurationMs = nextFajrTime - maghribDate.getTime();
  const oneThirdNightMs = nightDurationMs / 3.0;
  const qiyamDate = new Date(nextFajrTime - oneThirdNightMs);

  return {
    fajr: fajrDate,
    sunrise: sunriseDate,
    duha: duhaDate,
    dhuhr: dhuhrDate,
    asr: asrDate,
    maghrib: maghribDate,
    isha: ishaDate,
    qiyam: qiyamDate,
    isFriday,
  };
}

/**
 * Format Date to localized 12-hour AM/PM string (e.g., 04:32 ص or 04:32 AM)
 */
export function formatPrayerTime(d: Date, isAr: boolean = true): string {
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minStr} ${ampm}`;
}

export interface NextPrayerInfo {
  name: PrayerName;
  arabicName: string;
  englishName: string;
  time: Date;
  formattedTime: string;
  minutesRemaining: number;
  isFridayDhuhr: boolean;
}

/**
 * Determine which prayer is coming next and how many minutes are left
 */
export function getNextPrayer(
  times: CalculatedPrayerTimes,
  now: Date = new Date(),
  isAr: boolean = true
): NextPrayerInfo {
  const currentMs = now.getTime();

  const prayerList: Array<{ name: PrayerName; time: Date; ar: string; en: string }> = [
    { name: 'fajr', time: times.fajr, ar: 'الفجر', en: 'Fajr' },
    { name: 'sunrise', time: times.sunrise, ar: 'الشروق', en: 'Sunrise' },
    { name: 'dhuhr', time: times.dhuhr, ar: times.isFriday ? 'الجمعة' : 'الظهر', en: times.isFriday ? "Jumu'ah" : 'Dhuhr' },
    { name: 'asr', time: times.asr, ar: 'العصر', en: 'Asr' },
    { name: 'maghrib', time: times.maghrib, ar: 'المغرب', en: 'Maghrib' },
    { name: 'isha', time: times.isha, ar: 'العشاء', en: 'Isha' },
  ];

  for (const item of prayerList) {
    if (item.time.getTime() > currentMs) {
      const diffMs = item.time.getTime() - currentMs;
      const minutesRemaining = Math.max(0, Math.round(diffMs / 60000));
      return {
        name: item.name,
        arabicName: item.ar,
        englishName: item.en,
        time: item.time,
        formattedTime: formatPrayerTime(item.time, isAr),
        minutesRemaining,
        isFridayDhuhr: times.isFriday && item.name === 'dhuhr',
      };
    }
  }

  // After Isha -> next prayer is tomorrow's Fajr
  const tomorrowFajr = new Date(times.fajr.getTime() + 24 * 60 * 60 * 1000);
  const diffMs = tomorrowFajr.getTime() - currentMs;
  const minutesRemaining = Math.max(0, Math.round(diffMs / 60000));

  return {
    name: 'fajr',
    arabicName: 'الفجر (غداً)',
    englishName: 'Fajr (Tomorrow)',
    time: tomorrowFajr,
    formattedTime: formatPrayerTime(tomorrowFajr, isAr),
    minutesRemaining,
    isFridayDhuhr: false,
  };
}

/**
 * Exact astronomical Qibla calculation based on Great Circle spherical geodesy
 * towards the Holy Kaaba in Makkah (21.422487° N, 39.826206° E)
 * Returns heading degrees clockwise from True North (0° to 360°).
 */
export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const safeLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : 30.0444;
  const safeLng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : 31.2357;

  const makkahLat = degToRad(21.422487);
  const makkahLng = degToRad(39.826206);
  const userLat = degToRad(safeLat);
  const userLng = degToRad(safeLng);

  const deltaLng = makkahLng - userLng;

  const y = Math.sin(deltaLng);
  const x =
    Math.cos(userLat) * Math.tan(makkahLat) -
    Math.sin(userLat) * Math.cos(deltaLng);

  let qiblaDeg = radToDeg(Math.atan2(y, x));
  if (qiblaDeg < 0) {
    qiblaDeg += 360.0;
  }
  return Number(qiblaDeg.toFixed(2));
}

export interface NightIntervals {
  midnight: Date;
  lastThirdStart: Date;
  isCurrentlyLastThird: boolean;
  isCurrentlyNight: boolean;
  formattedLastThird: string;
  formattedMidnight: string;
  minutesToLastThird: number;
  minutesToFajr: number;
}

/**
 * Calculates authentic astronomical night intervals (Islamic midnight and the Last Third of the Night)
 * based on Maghrib and Fajr timings.
 */
export function calculateNightIntervals(
  maghribDate: Date,
  fajrDate: Date,
  currentTime: Date = new Date(),
  isAr: boolean = true
): NightIntervals {
  const now = currentTime.getTime();
  let maghribTime = maghribDate.getTime();
  let fajrTime = fajrDate.getTime();

  // If fajr was earlier today than maghrib, the night spans to tomorrow's fajr
  if (fajrTime <= maghribTime) {
    fajrTime += 24 * 60 * 60 * 1000;
  }

  // Adjust interval anchor depending on whether we are currently between maghrib and fajr
  if (now > fajrTime) {
    maghribTime += 24 * 60 * 60 * 1000;
    fajrTime += 24 * 60 * 60 * 1000;
  }

  const nightDurationMs = fajrTime - maghribTime;
  const midnightMs = maghribTime + nightDurationMs / 2.0;
  const lastThirdStartMs = fajrTime - nightDurationMs / 3.0;

  const midnightDate = new Date(midnightMs);
  const lastThirdStartDate = new Date(lastThirdStartMs);

  const isCurrentlyNight = now >= maghribTime && now < fajrTime;
  const isCurrentlyLastThird = now >= lastThirdStartMs && now < fajrTime;
  const minutesToLastThird = Math.max(0, Math.round((lastThirdStartMs - now) / 60000));
  const minutesToFajr = Math.max(0, Math.round((fajrTime - now) / 60000));

  return {
    midnight: midnightDate,
    lastThirdStart: lastThirdStartDate,
    isCurrentlyLastThird,
    isCurrentlyNight,
    formattedLastThird: formatPrayerTime(lastThirdStartDate, isAr),
    formattedMidnight: formatPrayerTime(midnightDate, isAr),
    minutesToLastThird,
    minutesToFajr,
  };
}

export interface MuadhinOption {
  id: 'makkah' | 'madinah' | 'aqsa' | 'abdulbasit' | 'mishary';
  nameAr: string;
  audioUrl: string;
  icon: string;
}

export const MUADHIN_OPTIONS: MuadhinOption[] = [
  {
    id: 'makkah',
    nameAr: 'أذان الحرم المكي الشريف (الشيخ علي ملا)',
    audioUrl: 'https://media.sd.ma/assabile/adhan/ali_ibn_ahmed_malla.mp3',
    icon: '🕋',
  },
  {
    id: 'madinah',
    nameAr: 'أذان المسجد النبوي الشريف (الشيخ عصام بخاري)',
    audioUrl: 'https://media.sd.ma/assabile/adhan/essam_boukhari.mp3',
    icon: '🕌',
  },
  {
    id: 'aqsa',
    nameAr: 'أذان المسجد الأقصى المبارك',
    audioUrl: 'https://media.sd.ma/assabile/adhan/al-aqsa.mp3',
    icon: '✨',
  },
  {
    id: 'abdulbasit',
    nameAr: 'أذان الشيخ عبد الباسط عبد الصمد (مصر)',
    audioUrl: 'https://media.sd.ma/assabile/adhan/abdelbasset_abdessamad.mp3',
    icon: '🎙️',
  },
  {
    id: 'mishary',
    nameAr: 'أذان الشيخ مشاري بن راشد العفاسي',
    audioUrl: 'https://media.sd.ma/assabile/adhan/mishary_rashid_alafasy.mp3',
    icon: '🌟',
  },
];

export interface HijriDateInfo {
  day: number;
  month: number;
  year: number;
  monthNameAr: string;
  monthNameEn: string;
  formattedAr: string;
  isWhiteDay: boolean; // 13, 14, or 15
  isTomorrowWhiteDay: boolean;
}

export function getHijriDateDetails(date: Date = new Date()): HijriDateInfo {
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    let day = 1;
    let month = 1;
    let year = 1448;

    for (const part of parts) {
      if (part.type === 'day') day = parseInt(part.value, 10) || 1;
      if (part.type === 'month') month = parseInt(part.value, 10) || 1;
      if (part.type === 'year') year = parseInt(part.value, 10) || 1448;
    }

    const HIJRI_MONTHS_AR = [
      'محرّم',
      'صفر',
      'ربيع الأول',
      'ربيع الآخر',
      'جمادى الأولى',
      'جمادى الآخرة',
      'رجب',
      'شعبان',
      'رمضان',
      'شوّال',
      'ذو القعدة',
      'ذو الحجة',
    ];

    const HIJRI_MONTHS_EN = [
      'Muharram',
      'Safar',
      'Rabi al-Awwal',
      'Rabi al-Thani',
      'Jumada al-Awwal',
      'Jumada al-Thani',
      'Rajab',
      'Shaban',
      'Ramadan',
      'Shawwal',
      'Dhu al-Qadah',
      'Dhu al-Hijjah',
    ];

    const monthNameAr = HIJRI_MONTHS_AR[month - 1] || 'شهر هجري';
    const monthNameEn = HIJRI_MONTHS_EN[month - 1] || 'Hijri Month';

    // Tomorrow Hijri day
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowParts = formatter.formatToParts(tomorrow);
    let tomorrowDay = day + 1;
    for (const part of tomorrowParts) {
      if (part.type === 'day') tomorrowDay = parseInt(part.value, 10) || day + 1;
    }

    const isWhiteDay = day === 13 || day === 14 || day === 15;
    const isTomorrowWhiteDay = tomorrowDay === 13;

    return {
      day,
      month,
      year,
      monthNameAr,
      monthNameEn,
      formattedAr: `${day} ${monthNameAr} ${year} هـ`,
      isWhiteDay,
      isTomorrowWhiteDay,
    };
  } catch {
    return {
      day: 13,
      month: 4,
      year: 1448,
      monthNameAr: 'ربيع الآخر',
      monthNameEn: 'Rabi al-Thani',
      formattedAr: '13 ربيع الآخر 1448 هـ',
      isWhiteDay: true,
      isTomorrowWhiteDay: false,
    };
  }
}


