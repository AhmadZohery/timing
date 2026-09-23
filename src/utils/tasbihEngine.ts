import type { PrayerLocationConfig, CustomDhikrItem } from '../types';
import { calculatePrayerTimes, detectDefaultCityFromTimezone } from './prayerCalculator';
import { db } from '../db/db';
import { getBiologicalDate, upsertDailyLog } from './gamification';

export type TasbihCategory = 'daily_core' | 'prayer_adhkar' | 'treasures' | 'custom';

export type TasbihPresetId =
  | 'tahlil_100'          // حرز الصباح الأكبر (100x لا إله إلا الله...)
  | 'tasbih_khafifatan'    // خفيفتان ثقيلتان (100x سبحان الله وبحمده سبحان الله العظيم)
  | 'baqiyat_salihat'      // الباقيات الصالحات (سبحان الله، الحمد لله، لا إله إلا الله، الله أكبر، لا حول ولا قوة إلا بالله)
  | 'salawat_ibrahimiyyah' // الصلاة الإبراهيمية (ليلة الجمعة ويومها ودائماً)
  | 'khitam_salah'         // ختام الصلاة المكتوبة (33+33+33+1)
  | 'tahlil_fajr_maghrib'  // دبر صلاتي الفجر والمغرب (10x)
  | 'istighfar'            // الاستغفار والتوبة (100x)
  | 'hawqala'              // الحوقلة (100x كنز الجنة)
  | 'free';                // تسبيح حر مفتوح

export interface DhikrStage {
  id: string;
  text: string;
  target: number;
  virtueAr: string;
  virtueEn?: string;
  referenceAr?: string;
}

export interface TasbihPreset {
  id: TasbihPresetId;
  category: TasbihCategory;
  titleAr: string;
  titleEn: string;
  badgeAr: string;
  icon: string;
  descriptionAr: string;
  hadithVirtueAr: string;
  pointsReward: number;
  stages: DhikrStage[];
  alternativeText?: string; // e.g. concise Salawat vs full Ibrahimiyyah
  alternativeLabelAr?: string;
}

export const TASBIH_PRESETS: Record<TasbihPresetId, TasbihPreset> = {
  // 1. حرز الصباح الأكبر (100x لا إله إلا الله وحده لا شريك له...)
  tahlil_100: {
    id: 'tahlil_100',
    category: 'daily_core',
    titleAr: 'حرز اليوم الأكبر (100 مرة)',
    titleEn: 'Ultimate Daily Shield (100x Tahlil)',
    badgeAr: '🛡️ حرز من الشيطان وعتق رقاب',
    icon: '☀️',
    descriptionAr: 'من قالها في يومه مائة مرة كانت له حِرزاً من الشيطان حتى يمسي، وعِدل عشر رقاب، ومائة حسنة، ومحو مائة سيئة.',
    hadithVirtueAr: '«كانت له عدل عشر رقاب، وكتبت له مائة حسنة، ومحيت عنه مائة سيئة، وكانت له حرزاً من الشيطان يومه ذلك حتى يمسي» (البخاري ومسلم)',
    pointsReward: 30,
    stages: [
      {
        id: 'tahlil_100_core',
        text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        target: 100,
        virtueAr: 'حرز حصين من الشيطان وعتق عشر رقاب ومحو مائة خطيئة',
        referenceAr: 'صحيح البخاري (3293)',
      },
    ],
  },

  // 2. خفيفتان ثقيلتان (سبحان الله وبحمده سبحان الله العظيم - 100x)
  tasbih_khafifatan: {
    id: 'tasbih_khafifatan',
    category: 'daily_core',
    titleAr: 'خفيفتان ثقيلتان (100 مرة)',
    titleEn: 'Light on Tongue, Heavy on Scale (100x)',
    badgeAr: '⚖️ حط الخطايا وثقل الميزان',
    icon: '✨',
    descriptionAr: 'كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن. ومن قالها مائة مرة حطت خطاياه وإن كانت مثل زبد البحر.',
    hadithVirtueAr: '«من قال: سبحان الله وبحمده، في يوم مائة مرة، حطت خطاياه وإن كانت مثل زبد البحر» (البخاري ومسلم)',
    pointsReward: 25,
    stages: [
      {
        id: 'tasbih_khafifatan_core',
        text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
        target: 100,
        virtueAr: 'تغرس لك نخلاً في الجنة وتثقل ميزانك وتحط خطاياك',
        referenceAr: 'متفق عليه',
      },
    ],
  },

  // 3. الباقيات الصالحات
  baqiyat_salihat: {
    id: 'baqiyat_salihat',
    category: 'daily_core',
    titleAr: 'الباقيات الصالحات (غراس الجنة)',
    titleEn: 'Al-Baqiyat As-Salihat',
    badgeAr: '🌿 أحب الكلام إلى الله',
    icon: '🌱',
    descriptionAr: 'خير عند ربك ثواباً وخير أملاً. هن غراس الجنة وأحب الكلام إلى الله تعالى ومكفرات للذنوب.',
    hadithVirtueAr: '«استكثروا من الباقيات الصالحات: التسبيح، والتحميد، والتهليل، والتكبير، ولا حول ولا قوة إلا بالله» (أحمد وابن حبان)',
    pointsReward: 25,
    stages: [
      {
        id: 'baqiyat_core',
        text: 'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
        target: 100,
        virtueAr: 'أحب مما طلعت عليه الشمس، وكنوز من غراس الجنة',
        referenceAr: 'مسلم وأحمد',
      },
    ],
  },

  // 4. الصلاة على النبي ﷺ بالصلاة الإبراهيمية
  salawat_ibrahimiyyah: {
    id: 'salawat_ibrahimiyyah',
    category: 'daily_core',
    titleAr: 'الصلاة على النبي ﷺ (الصلاة الإبراهيمية)',
    titleEn: 'Salawat on Prophet (Ibrahimiyyah)',
    badgeAr: '👑 نور وبركة وشفاعة يوم القيامة',
    icon: '🌸',
    descriptionAr: 'الصيغة الإبراهيمية المباركة التامة التي علمها النبي ﷺ لأصحابه، وتتأكد خاصة من مغرب الخميس إلى مغرب الجمعة.',
    hadithVirtueAr: '«إن من أفضل أيامكم يوم الجمعة، فأكثروا عليّ من الصلاة فيه فإن صلاتكم معروضة عليّ» (أبو داود والنسائي)',
    pointsReward: 30,
    stages: [
      {
        id: 'salawat_full_stage',
        text: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
        target: 100,
        virtueAr: 'الصيغة الإبراهيمية الكاملة: كفاية الهم وغفران الذنب وصلاة الله عشراً',
        referenceAr: 'صحيح البخاري ومسلم',
      },
    ],
    alternativeText: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    alternativeLabelAr: 'الصيغة الموجزة (للتكرار السريع)',
  },

  // 5. ختام الصلاة المكتوبة (33+33+33+1)
  khitam_salah: {
    id: 'khitam_salah',
    category: 'prayer_adhkar',
    titleAr: 'ختام الصلاة المكتوبة (33×3 + 1)',
    titleEn: 'Post-Prayer Supplication',
    badgeAr: '🕌 مغفرة الذنوب دبر كل صلاة',
    icon: '📿',
    descriptionAr: 'التسبيح والتحميد والتكبير ثلاثاً وثلاثين بعد كل صلاة مكتوبة، وختمها بالتهليل لمغفرة الذنوب ولو كانت مثل زبد البحر.',
    hadithVirtueAr: '«من سبح الله في دبر كل صلاة ثلاثاً وثلاثين... وختم المائة بلا إله إلا الله... غُفرت خطاياه وإن كانت مثل زبد البحر» (مسلم)',
    pointsReward: 20,
    stages: [
      {
        id: 'khitam_istighfar',
        text: 'أَسْتَغْفِرُ اللَّهَ',
        target: 3,
        virtueAr: 'الاستغفار ثلاثاً فور التسليم كما كان يفعل النبي ﷺ',
        referenceAr: 'صحيح مسلم (591)',
      },
      {
        id: 'khitam_salam',
        text: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالإِكْرَامِ',
        target: 1,
        virtueAr: 'دعاء السلام الثابت عقب الاستغفار',
        referenceAr: 'صحيح مسلم (591)',
      },
      {
        id: 'khitam_ayat_kursi',
        text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
        target: 1,
        virtueAr: 'من قرأها دبر كل صلاة مكتوبة لم يمنعه من دخول الجنة إلا أن يموت',
        referenceAr: 'السنن الكبرى للنسائي (صحيح)',
      },
      {
        id: 'khitam_subhanallah',
        text: 'سُبْحَانَ اللَّهِ',
        target: 33,
        virtueAr: 'المرحلة 1: تنزيه الله عن كل نقص (33 مرة)',
        referenceAr: 'صحيح مسلم',
      },
      {
        id: 'khitam_alhamdulillah',
        text: 'الْحَمْدُ لِلَّهِ',
        target: 33,
        virtueAr: 'المرحلة 2: إثبات الحمد والكمال لله (33 مرة)',
        referenceAr: 'صحيح مسلم',
      },
      {
        id: 'khitam_allahuakbar',
        text: 'اللَّهُ أَكْبَرُ',
        target: 33,
        virtueAr: 'المرحلة 3: تعظيم جلال وكبرياء الله (33 مرة)',
        referenceAr: 'صحيح مسلم',
      },
      {
        id: 'khitam_tahlil',
        text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        target: 1,
        virtueAr: 'تمام المئة: غفران الخطايا وإن كانت مثل زبد البحر',
        referenceAr: 'صحيح مسلم (597)',
      },
    ],
  },

  // 6. دبر صلاتي الفجر والمغرب (10 مرات)
  tahlil_fajr_maghrib: {
    id: 'tahlil_fajr_maghrib',
    category: 'prayer_adhkar',
    titleAr: 'تهليل دبر الفجر والمغرب (10 مرات)',
    titleEn: 'Post-Fajr & Maghrib Tahlil (10x)',
    badgeAr: '🌅 حرز من كل مكروه والشيطان',
    icon: '🌄',
    descriptionAr: 'تقال 10 مرات قبل أن يثني رجليه بعد صلاتي الفجر والمغرب؛ تكتب له عشر حسنات وتمحى عنه عشر سيئات وتكون له حرزاً من كل مكروه.',
    hadithVirtueAr: '«من قال قبل أن ينصرف ويثني رجليه من صلاة المغرب والصبح... عشر مرات، كتب الله له بكل واحدة عشر حسنات ومحا عنه عشر سيئات... وكانت له حرزاً من كل مكروه» (الترمذي)',
    pointsReward: 20,
    stages: [
      {
        id: 'tahlil_fajr_maghrib_core',
        text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        target: 10,
        virtueAr: 'حرز من كل مكروه وعتق أربع رقاب مؤمنات من ولد إسماعيل',
        referenceAr: 'سنن الترمذي وحسنه',
      },
    ],
  },

  // 7. الاستغفار والتوبة
  istighfar: {
    id: 'istighfar',
    category: 'treasures',
    titleAr: 'الاستغفار والتوبة (100 مرة)',
    titleEn: 'Istighfar & Repentance (100x)',
    badgeAr: '💧 تفريج الهموم وتيسير الأرزاق',
    icon: '🌧️',
    descriptionAr: 'كان رسول الله ﷺ يستغفر الله ويتوب إليه في اليوم أكثر من سبعين مرة وفي رواية مائة مرة.',
    hadithVirtueAr: '«من لزم الاستغفار جعل الله له من كل ضيق مخرجاً ومن كل هم فرجاً ورزقه من حيث لا يحتسب» (أبو داود)',
    pointsReward: 20,
    stages: [
      {
        id: 'istighfar_core',
        text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
        target: 100,
        virtueAr: 'مغفرة الذنوب وبركة الرزق ودفع البلاء',
        referenceAr: 'صحيح مسلم',
      },
    ],
  },

  // 8. الحوقلة (كنز الجنة)
  hawqala: {
    id: 'hawqala',
    category: 'treasures',
    titleAr: 'الحوقلة (100 مرة)',
    titleEn: 'Hawqala - Treasure of Paradise (100x)',
    badgeAr: '🛡️ كنز من كنوز العرش',
    icon: '🏰',
    descriptionAr: 'لا حول ولا قوة إلا بالله كنز من كنوز الجنة، وباب من أبوابها، وبها يُدفع ثقل الأمر والهم.',
    hadithVirtueAr: '«ألا أدلك على كلمة من تحت العرش من كنز الجنة؟ تقول: لا حول ولا قوة إلا بالله» (الحاكم وصححه الذهبي)',
    pointsReward: 20,
    stages: [
      {
        id: 'hawqala_core',
        text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
        target: 100,
        virtueAr: 'كنز من كنوز الجنة ودواء للهم والحزن والعجز',
        referenceAr: 'متفق عليه',
      },
    ],
  },

  // 9. تسبيح وذكر مفتوح
  free: {
    id: 'free',
    category: 'treasures',
    titleAr: 'تسبيح وذكر حر ومفتوح',
    titleEn: 'Open Contemplative Tasbih',
    badgeAr: '♾️ عداد حر غير مقيد',
    icon: '📿',
    descriptionAr: 'عداد مفتوح لأي ذكر ترغب به دون حد معين، يرطب لسانك بذكر الله أينما كنت.',
    hadithVirtueAr: '«لا يزال لسانك رطباً من ذكر الله» (الترمذي)',
    pointsReward: 15,
    stages: [
      {
        id: 'free_core',
        text: 'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ',
        target: 0,
        virtueAr: 'ذكر مطلق لصفاء القلب وسكينة الروح',
      },
    ],
  },
};

/**
 * Friday Salawat Temporal Status Checker:
 * Islamic rule: Friday begins at Maghrib on Thursday and ends at Maghrib on Friday!
 */
export interface FridaySalawatStatus {
  isWindow: boolean;
  phase: 'night' | 'day' | 'none';
  titleAr: string;
  badgeAr: string;
  descriptionAr: string;
  remainingHours?: number;
}

export function checkIsFridaySalawatWindow(
  now = new Date(),
  loc?: PrayerLocationConfig
): FridaySalawatStatus {
  const defaultCity = detectDefaultCityFromTimezone();
  const lat = loc?.latitude ?? defaultCity.lat;
  const lng = loc?.longitude ?? defaultCity.lng;
  const method = loc?.calculationMethod ?? defaultCity.defaultMethod;

  const todayTimes = calculatePrayerTimes(now, lat, lng, method);
  const dayOfWeek = now.getDay(); // 0 = Sun, 4 = Thu, 5 = Fri

  // 1. Thursday evening (ليلة الجمعة): Thursday >= Maghrib
  if (dayOfWeek === 4) {
    if (now.getTime() >= todayTimes.maghrib.getTime()) {
      return {
        isWindow: true,
        phase: 'night',
        titleAr: '🕌 حلت ليلة الجمعة المباركة',
        badgeAr: '✨ موسم إكثار الصلاة على النبي ﷺ',
        descriptionAr: 'دخل الوقت الشرعي لإكثار الصلاة على النبي ﷺ بغروب شمس الخميس.. صلاتك معروضة عليه ﷺ فاستكثر من الصلاة الإبراهيمية.',
      };
    }
  }

  // 2. Friday daytime (نهار الجمعة): Friday < Maghrib
  if (dayOfWeek === 5) {
    if (now.getTime() < todayTimes.maghrib.getTime()) {
      const msLeft = todayTimes.maghrib.getTime() - now.getTime();
      const hoursLeft = Math.max(1, Math.round(msLeft / 3600000));
      return {
        isWindow: true,
        phase: 'day',
        titleAr: '🕌 يوم الجمعة الأغر (سيد الأيام)',
        badgeAr: '👑 الصلاة الإبراهيمية معروضة على النبي ﷺ',
        descriptionAr: `متبقٍ قرابة ${hoursLeft} ساعة حتى مغرب الجمعة.. اغتنم ساعات الإجابة والبركة بالصلاة الإبراهيمية وسورة الكهف.`,
        remainingHours: hoursLeft,
      };
    }
  }

  return {
    isWindow: false,
    phase: 'none',
    titleAr: 'الصلاة على النبي ﷺ',
    badgeAr: '🌸 كفاية الهم وغفران الذنب',
    descriptionAr: 'الصلاة على النبي ﷺ مستحبة في كل وقت وحين، وتتضاعف بركتها من ليلة الخميس إلى مغرب الجمعة.',
  };
}

/**
 * Saves completed tasbih count in Dexie daily_logs with XP rewards
 */
export async function updateDailyTasbihProgress(
  presetId: TasbihPresetId | string,
  count: number,
  target: number
): Promise<{ completedNow: boolean; pointsAwarded: number; message?: string }> {
  const isCompleted = target > 0 ? count >= target : count >= 33;
  const todayDateStr = getBiologicalDate(true);
  const todayLog = await db.daily_logs.get(todayDateStr);

  const existingMap = todayLog?.tasbihDailyProgress || {};
  const currentRecord = existingMap[presetId as TasbihPresetId];
  const wasAlreadyCompleted = currentRecord?.completed ?? false;
  const completedNow = isCompleted && !wasAlreadyCompleted;

  const nextCount = Math.max(count, currentRecord?.count || 0);

  const nextMap = {
    ...existingMap,
    [presetId]: {
      count: nextCount,
      target,
      completed: isCompleted,
    },
  };

  const allPresets = getAllTasbihPresets();
  const preset = allPresets[presetId] || TASBIH_PRESETS[presetId as TasbihPresetId];
  let pointsAwarded = 0;

  if (completedNow) {
    pointsAwarded = preset?.pointsReward || 20;
    const userState = await db.user_state.get('current_user');
    if (userState) {
      await db.user_state.update(userState.id, {
        totalPoints: (userState.totalPoints || 0) + pointsAwarded,
      });
    }
  }

  // Also track Friday Salawat count if this is Salawat
  let salawatFridayCount = todayLog?.salawatFridayCount || 0;
  if (presetId === 'salawat_ibrahimiyyah') {
    salawatFridayCount += count;
  }

  await upsertDailyLog(todayDateStr, {
    tasbihDailyProgress: nextMap,
    salawatFridayCount,
    pointsEarned: (todayLog?.pointsEarned || 0) + pointsAwarded,
  });

  return {
    completedNow,
    pointsAwarded,
    message: completedNow
      ? `✨ تقبل الله طاعتك ورطب لسانك بذكره! أتممت ${preset?.titleAr || 'الذكر'} (+${pointsAwarded} XP)`
      : undefined,
  };
}

/**
 * Instantly persists every single tap into Dexie tasbih_counters table
 */
export async function recordTasbihTap(
  presetId: TasbihPresetId | string,
  stageIndex: number,
  currentCount: number,
  target: number
): Promise<void> {
  try {
    const todayDateStr = getBiologicalDate(true);
    const id = `${todayDateStr}_${presetId}`;
    const completed = target > 0 ? currentCount >= target : currentCount >= 33;

    await db.tasbih_counters.put({
      id,
      presetId,
      date: todayDateStr,
      currentCount,
      target,
      stageIndex,
      completed,
      lastUpdated: Date.now(),
    });

    // Also mirror into localStorage for zero-latency instant hydration
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`midmar_active_tasbih_${presetId}`, JSON.stringify({
        date: todayDateStr,
        count: currentCount,
        stageIndex,
        completed,
      }));
    }
  } catch (err) {
    console.error('Error persisting tasbih tap:', err);
  }
}

/**
 * Recovers today's active count and stage for a given preset
 */
export async function getActiveTasbihSession(
  presetId: TasbihPresetId | string
): Promise<{ count: number; stageIndex: number; completed: boolean } | null> {
  const todayDateStr = getBiologicalDate(true);
  const id = `${todayDateStr}_${presetId}`;

  try {
    // Check Dexie DB first
    const record = await db.tasbih_counters.get(id);
    if (record && record.date === todayDateStr) {
      return {
        count: record.currentCount,
        stageIndex: record.stageIndex,
        completed: record.completed,
      };
    }

    // Fallback to localStorage
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`midmar_active_tasbih_${presetId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === todayDateStr) {
          return {
            count: parsed.count || 0,
            stageIndex: parsed.stageIndex || 0,
            completed: parsed.completed || false,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Error reading active tasbih session:', err);
  }
  return null;
}

/**
 * Resets the session for a given preset
 */
export async function resetTasbihSession(presetId: TasbihPresetId | string): Promise<void> {
  const todayDateStr = getBiologicalDate(true);
  const id = `${todayDateStr}_${presetId}`;

  try {
    await db.tasbih_counters.delete(id);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`midmar_active_tasbih_${presetId}`);
    }
  } catch (err) {
    console.warn('Error resetting tasbih session:', err);
  }
}

// ==========================================
// Custom Dhikrs & Community Moderation
// ==========================================
const STORAGE_CUSTOM_DHIKRS = 'midmar_custom_dhikrs_v1';
const STORAGE_COMMUNITY_PENDING = 'midmar_community_dhikr_pending_v1';

export function getCustomDhikrs(): CustomDhikrItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_DHIKRS);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

export function saveCustomDhikr(data: {
  titleAr: string;
  targetCount: number;
  category?: TasbihCategory;
  isPublicProposal?: boolean;
  authorName?: string;
}): CustomDhikrItem {
  const existing = getCustomDhikrs();
  const newItem: CustomDhikrItem = {
    id: `custom_dhikr_${Date.now()}`,
    titleAr: data.titleAr.trim(),
    targetCount: Number(data.targetCount) || 100,
    category: data.category || 'custom',
    isPublicProposal: !!data.isPublicProposal,
    authorName: data.authorName?.trim() || 'صاحب الهمة',
    status: data.isPublicProposal ? 'pending_approval' : 'local_only',
    createdAt: new Date().toISOString(),
  };

  const updated = [newItem, ...existing];
  try {
    localStorage.setItem(STORAGE_CUSTOM_DHIKRS, JSON.stringify(updated));

    // If it's proposed for community review, add to pending pool for admin review
    if (data.isPublicProposal) {
      const pending = getCommunityPendingDhikrs();
      localStorage.setItem(
        STORAGE_COMMUNITY_PENDING,
        JSON.stringify([newItem, ...pending.filter((p) => p.id !== newItem.id)])
      );
    }
  } catch (_) {}

  return newItem;
}

export function deleteCustomDhikr(id: string): void {
  const existing = getCustomDhikrs();
  const updated = existing.filter((d) => d.id !== id);
  try {
    localStorage.setItem(STORAGE_CUSTOM_DHIKRS, JSON.stringify(updated));
  } catch (_) {}
}

export function getCommunityPendingDhikrs(): CustomDhikrItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_COMMUNITY_PENDING);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

export function approveCommunityDhikr(id: string): void {
  const pending = getCommunityPendingDhikrs();
  const target = pending.find((p) => p.id === id);
  if (!target) return;

  target.status = 'approved_global';
  const updatedPending = pending.filter((p) => p.id !== id);

  // Update in custom list as approved
  const custom = getCustomDhikrs();
  const updatedCustom = custom.map((c) => (c.id === id ? { ...c, status: 'approved_global' as const } : c));

  try {
    localStorage.setItem(STORAGE_COMMUNITY_PENDING, JSON.stringify(updatedPending));
    localStorage.setItem(STORAGE_CUSTOM_DHIKRS, JSON.stringify(updatedCustom));
  } catch (_) {}
}

export function rejectCommunityDhikr(id: string): void {
  const pending = getCommunityPendingDhikrs();
  const updatedPending = pending.filter((p) => p.id !== id);

  const custom = getCustomDhikrs();
  const updatedCustom = custom.map((c) => (c.id === id ? { ...c, status: 'local_only' as const } : c));

  try {
    localStorage.setItem(STORAGE_COMMUNITY_PENDING, JSON.stringify(updatedPending));
    localStorage.setItem(STORAGE_CUSTOM_DHIKRS, JSON.stringify(updatedCustom));
  } catch (_) {}
}

/**
 * Returns merged dictionary of Built-in Presets + User Custom Dhikrs
 */
export function getAllTasbihPresets(): Record<string, TasbihPreset> {
  const all: Record<string, TasbihPreset> = { ...TASBIH_PRESETS };
  const customItems = getCustomDhikrs();

  for (const item of customItems) {
    all[item.id] = {
      id: item.id as any,
      category: item.category || 'custom',
      titleAr: item.titleAr,
      titleEn: 'Custom Dhikr',
      badgeAr: item.status === 'approved_global' ? '🌐 معتمد للجميع' : '🌸 ورد خاص بك',
      icon: '✨',
      descriptionAr: `ورد شخصي مستهدف: ${item.targetCount} مرة`,
      hadithVirtueAr: 'الذكر غذاء القلوب وطمأنينة الأرواح.',
      pointsReward: 20,
      stages: [
        {
          id: `stage_${item.id}`,
          text: item.titleAr,
          target: item.targetCount,
          virtueAr: 'ذكر مخصص من العبد لربه سبحانه وتعالى.',
        },
      ],
    };
  }

  return all;
}
