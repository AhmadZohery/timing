import type {
  SpiritualWirdItem,
  SpiritualPresetId,
  SpiritualWirdConfig,
  DailyWirdProgressItem,
  DailyLog,
} from '../types';
import { db } from '../db/db';
import { getBiologicalDate, upsertDailyLog } from './gamification';

export const SPIRITUAL_WIRD_PRESETS: Record<
  SpiritualPresetId,
  {
    id: SpiritualPresetId;
    titleAr: string;
    titleEn: string;
    badge: string;
    descriptionAr: string;
    descriptionEn: string;
    hadithAr?: string;
    wirds: SpiritualWirdItem[];
  }
> = {
  baqarah_only: {
    id: 'baqarah_only',
    titleAr: 'سورة البقرة المباركة (الأساس اليومي)',
    titleEn: 'Surah Al-Baqarah Daily (Core Foundation)',
    badge: '🛡️ بركة ودفع الحسرة (موصى به)',
    descriptionAr: 'قراءة سورة البقرة كاملة يومياً (48 صفحة) لبركة الوقت والرزق وطرد الشياطين وبناء عادة روحية راسخة دون إثقال.',
    descriptionEn: 'Daily full recitation of Surah Al-Baqarah (48 pages) for ultimate blessing, protection, and consistent habit foundation.',
    hadithAr: '«اقرءوا سورة البقرة فإن أخذها بركة وتركها حسرة ولا تستطيعها البطلة» (مسلم)',
    wirds: [
      {
        id: 'wird_baqarah',
        name: 'سورة البقرة',
        type: 'surah',
        targetPages: 48,
        pointsReward: 35,
        recommendedTime: 'fajr',
        hadithVirtue: '«فإن أخذها بركة، وتركها حسرة، ولا تستطيعها البطلة» (مسلم)',
      },
    ],
  },
  imran_only: {
    id: 'imran_only',
    titleAr: 'سورة آل عمران المباركة',
    titleEn: 'Surah Al-Imran Daily',
    badge: '🌿 حجة وشفاعة وظل',
    descriptionAr: 'قراءة سورة آل عمران يومياً (27 صفحة) كورد مستقل ميسر لمن يرغب بالتدرج دون جمع السورتين.',
    descriptionEn: 'Daily recitation of Surah Al-Imran (27 pages) as a standalone focused routine.',
    hadithAr: '«تأتي يوم القيامة كأنها غمامة أو ظلة تحاج عن صاحبها» (مسلم)',
    wirds: [
      {
        id: 'wird_imran',
        name: 'سورة آل عمران',
        type: 'surah',
        targetPages: 27,
        pointsReward: 30,
        recommendedTime: 'morning',
        hadithVirtue: '«تحاج عن صاحبها يوم القيامة وتظله» (مسلم)',
      },
    ],
  },
  al_zahrawayn: {
    id: 'al_zahrawayn',
    titleAr: 'الزهراوان معاً (البقرة + آل عمران)',
    titleEn: 'Al-Zahrawayn Combined (Baqarah + Al-Imran)',
    badge: '👑 الجمع بين السورتين (همة متقدمة)',
    descriptionAr: 'قراءة سورتي البقرة وآل عمران معاً يومياً (75 صفحة)؛ همة متقدمة واختيارية لمن يرغب بالجمع بينهما.',
    descriptionEn: 'Daily combined recitation of Surah Al-Baqarah (48p) + Al-Imran (27p) for advanced consistency.',
    hadithAr: '«اقرءوا الزهراوين: البقرة وسورة آل عمران، فإنهما تأتيان يوم القيامة كأنهما غمامتان... تحاجان عن أصحابهما» (صحيح مسلم)',
    wirds: [
      {
        id: 'wird_baqarah',
        name: 'سورة البقرة',
        type: 'surah',
        targetPages: 48,
        pointsReward: 35,
        recommendedTime: 'fajr',
        hadithVirtue: '«فإن أخذها بركة، وتركها حسرة، ولا تستطيعها البطلة» (مسلم)',
      },
      {
        id: 'wird_imran',
        name: 'سورة آل عمران',
        type: 'surah',
        targetPages: 27,
        pointsReward: 30,
        recommendedTime: 'morning',
        hadithVirtue: '«تأتيان يوم القيامة كأنهما غمامتان تحاجان عن صاحبهما» (مسلم)',
      },
    ],
  },
  daily_juz: {
    id: 'daily_juz',
    titleAr: 'الورد الجزئي للختمة (جزء يومياً)',
    titleEn: 'Daily Juz Khatmah (1 Juz/Day)',
    badge: '📖 ختمة شهرية متواصلة',
    descriptionAr: 'قراءة جزء كامل من المصحف الشريف يومياً (20 صفحة) لختم القرآن الكريم كاملاً كل شهر.',
    descriptionEn: 'Recite 1 Juz (20 pages) daily to complete the full Quran every month.',
    hadithAr: '«من قرأ حرفاً من كتاب الله فله به حسنة، والحسنة بعشر أمثالها» (الترمذي)',
    wirds: [
      {
        id: 'wird_daily_juz',
        name: 'ورد الجزء اليومي',
        type: 'juz',
        targetPages: 20,
        pointsReward: 30,
        recommendedTime: 'fajr',
        hadithVirtue: '«يقال لصاحب القرآن: اقرأ وارق ورتل كما كنت ترتل في الدنيا»',
      },
    ],
  },
  surahs_mounjiyat: {
    id: 'surahs_mounjiyat',
    titleAr: 'السور الفاضلة والمنجيات',
    titleEn: 'Virtuous & Saving Surahs',
    badge: '✨ سور البركة المأثورة',
    descriptionAr: 'باقة منتقاة من السور المأثورة الموصى بها يومياً (يس صباحاً، الواقعة عصراً، والملك ليلاً).',
    descriptionEn: 'Curated daily selection of virtuous surahs (Yasin, Al-Waqiah, Al-Mulk).',
    hadithAr: '«سورة تبارك هي المانعة من عذاب القبر» (الترمذي)',
    wirds: [
      {
        id: 'wird_yasin',
        name: 'سورة يس',
        type: 'surah',
        targetPages: 6,
        pointsReward: 15,
        recommendedTime: 'morning',
        hadithVirtue: '«قلب القرآن» (الترمذي)',
      },
      {
        id: 'wird_waqiah',
        name: 'سورة الواقعة',
        type: 'surah',
        targetPages: 4,
        pointsReward: 15,
        recommendedTime: 'afternoon',
        hadithVirtue: '«سورة الغنى والبركة في الرزق»',
      },
      {
        id: 'wird_mulk',
        name: 'سورة الملك',
        type: 'surah',
        targetPages: 3,
        pointsReward: 15,
        recommendedTime: 'night',
        hadithVirtue: '«المانعة والمنجية من عذاب القبر»',
      },
    ],
  },
  custom: {
    id: 'custom',
    titleAr: 'ورد مخصص بالكامل',
    titleEn: 'Fully Custom Wird',
    badge: '🎨 تصميمك الشخصي',
    descriptionAr: 'حرية مطلقة في إضافة سورك المفضلة وأورادك وتحديد عدد صفحاتها ونقاط بركتها.',
    descriptionEn: 'Total freedom to define your own custom surahs, pages, and rewards.',
    wirds: [],
  },
};

/**
 * Resolves active wird items from user configuration
 */
export function getActiveSpiritualWirds(config?: SpiritualWirdConfig): SpiritualWirdItem[] {
  const preset = config?.activePreset || 'baqarah_only'; // Default to Surah Al-Baqarah for consistent foundation!
  if (preset === 'custom') {
    return config?.customWirds && config.customWirds.length > 0
      ? config.customWirds
      : SPIRITUAL_WIRD_PRESETS.baqarah_only.wirds;
  }
  return SPIRITUAL_WIRD_PRESETS[preset]?.wirds || SPIRITUAL_WIRD_PRESETS.baqarah_only.wirds;
}

/**
 * Calculates estimated remaining reading time in minutes (assuming ~2 min per Quran page)
 */
export function calculateWirdEstimatedMinutes(pagesRemaining: number, paceMinPerPage = 2): number {
  return Math.max(1, Math.round(pagesRemaining * paceMinPerPage));
}

/**
 * Updates a specific wird's progress in Dexie daily_logs with backward compatibility for baqarahProgress
 */
export async function updateDailyWirdProgress(
  wird: SpiritualWirdItem,
  pagesToAdd: number,
  todayLog?: DailyLog
): Promise<{ completedNow: boolean; nextPages: number; message?: string }> {
  const targetDate = todayLog?.date || getBiologicalDate(true);
  const currentItem = todayLog?.customWirdProgress?.[wird.id];

  // Also support legacy baqarahProgress if this is the Baqarah wird
  const currentPages =
    currentItem?.pagesRead ??
    (wird.id === 'wird_baqarah' ? (todayLog?.baqarahProgress?.pagesRead ?? 0) : 0);

  const nextPages = Math.min(wird.targetPages, currentPages + pagesToAdd);
  const isCompleted = nextPages >= wird.targetPages;
  const wasAlreadyCompleted = currentItem?.completed || (wird.id === 'wird_baqarah' && todayLog?.baqarahProgress?.completed);
  const completedNow = isCompleted && !wasAlreadyCompleted;

  const updatedProgressItem: DailyWirdProgressItem = {
    wirdId: wird.id,
    wirdName: wird.name,
    pagesRead: nextPages,
    targetPages: wird.targetPages,
    completed: isCompleted,
    completedAt: isCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
  };

  const nextCustomMap: Record<string, DailyWirdProgressItem> = {
    ...(todayLog?.customWirdProgress || {}),
    [wird.id]: updatedProgressItem,
  };

  const updates: Partial<DailyLog> = {
    customWirdProgress: nextCustomMap,
  };

  // Sync legacy Baqarah fields for backwards compatibility
  if (wird.id === 'wird_baqarah') {
    updates.baqarahProgress = {
      pagesRead: nextPages,
      targetPages: wird.targetPages,
      completed: isCompleted,
    };
  }

  // If completed just now, award points
  if (completedNow) {
    const userState = await db.user_state.get('current_user');
    if (userState) {
      const pts = wird.pointsReward || 35;
      await db.user_state.update(userState.id, {
        totalPoints: (userState.totalPoints || 0) + pts,
      });
      updates.pointsEarned = (todayLog?.pointsEarned || 0) + pts;
    }
  }

  await upsertDailyLog(targetDate, updates);

  return {
    completedNow,
    nextPages,
    message: completedNow
      ? `✨ هنيئاً لك! أتممت ${wird.name} ونلت +${wird.pointsReward} نقطة بركة!`
      : undefined,
  };
}

export const WIRD_PRESETS = SPIRITUAL_WIRD_PRESETS;

export interface BaqarahPrayerChunk {
  prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  prayerTitleAr: string;
  pagesRange: string;
  pageCount: number;
  startPage: number;
  endPage: number;
}

/**
 * 5-Prayer Micro-Chunking Strategy for Surah Al-Baqarah (48 pages)
 * Eliminates the cognitive friction wall by splitting daily reading evenly across prayers.
 */
export const BAQARAH_PRAYER_CHUNKS: BaqarahPrayerChunk[] = [
  { prayer: 'fajr', prayerTitleAr: 'دبر صلاة الفجر', pagesRange: 'ص 2 إلى 9', pageCount: 8, startPage: 2, endPage: 9 },
  { prayer: 'dhuhr', prayerTitleAr: 'دبر صلاة الظهر', pagesRange: 'ص 10 إلى 17', pageCount: 8, startPage: 10, endPage: 17 },
  { prayer: 'asr', prayerTitleAr: 'دبر صلاة العصر', pagesRange: 'ص 18 إلى 25', pageCount: 8, startPage: 18, endPage: 25 },
  { prayer: 'maghrib', prayerTitleAr: 'دبر صلاة المغرب', pagesRange: 'ص 26 إلى 33', pageCount: 8, startPage: 26, endPage: 33 },
  { prayer: 'isha', prayerTitleAr: 'دبر صلاة العشاء والشفع', pagesRange: 'ص 34 إلى 49', pageCount: 16, startPage: 34, endPage: 49 },
];

