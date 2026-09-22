// ============================================================================
// محرك الآيات القرآني التوافقي السياقي (Harmonic Contextual Aya Engine)
// نصوص محققة بالرسم العثماني مرتبطة بالحالة النفسية والفسيولوجية اللحظية للمؤمن
// ============================================================================

export type AyaContextCategory =
  | 'stress_anxiety'      // سكينة وطمأنينة عند مقاومة التشتت أو وطأة الضغط
  | 'athletic_fortitude'  // عزم وشدة بأس وقوة بدنية أثناء الجيم والقتال
  | 'morning_dawns'       // نور وانبثاق وبركة مع الفجر وبواكير النهار
  | 'deep_focus'          // علم وإتقان وحكمة أثناء العمل العميق
  | 'night_sahar'         // استغفار وخلوة وسكينة في جوف الليل والأسحار
  | 'gratitude_victory';  // حمد وثناء ورضى عند إتمام الإنجاز

export interface ResonantAya {
  id: string;
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  contextCategory: AyaContextCategory;
  contextLabelAr: string;
  contextLabelEn: string;
  tadabburInsightAr: string;
  tadabburInsightEn: string;
  hadithLinkAr?: string;
  referenceCitation: string;
}

export const RESONANT_AYAS_DATABASE: ResonantAya[] = [
  // 1. سكينة وطمأنينة عند التوتر والضغط ومقاومة المشتتات
  {
    id: 'aya_sakinah_1',
    surahName: 'سورة الرعد',
    surahNumber: 13,
    ayahNumber: 28,
    arabicText: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    contextCategory: 'stress_anxiety',
    contextLabelAr: 'سكينة القلب وطمأنينة الروح',
    contextLabelEn: 'Serenity of the Heart',
    tadabburInsightAr: 'القلب مضغة لا تسكن لاضطرابات الدنيا ووساوسها إلا بذكر خالقها؛ حين يضطرب عقلك تفرغ لذكر الله ثوانٍ ترتد إليك بصيرتك وسكينتك.',
    tadabburInsightEn: 'The heart finds no genuine calm amidst worldly noise except in the remembrance of Allah.',
    referenceCitation: 'القرآن الكريم • سورة الرعد: 28',
  },
  {
    id: 'aya_sakinah_2',
    surahName: 'سورة الشرح',
    surahNumber: 94,
    ayahNumber: 5,
    arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    contextCategory: 'stress_anxiety',
    contextLabelAr: 'بشارة الفرج وانفراج الكرب',
    contextLabelEn: 'Ease Accompanies Hardship',
    tadabburInsightAr: 'قال ابن عباس: "لن يغلب عسر يسرين". العسر معرف بأل (عسر واحد)، واليسر منكر مكرر (يسران متواليان يحيطان بكل شدة).',
    tadabburInsightEn: 'Difficulty is singular while divine relief is doubled and encompassing.',
    referenceCitation: 'القرآن الكريم • سورة الشرح: 5-6',
  },
  {
    id: 'aya_sakinah_3',
    surahName: 'سورة البقرة',
    surahNumber: 2,
    ayahNumber: 286,
    arabicText: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    contextCategory: 'stress_anxiety',
    contextLabelAr: 'رحمة التكليف وعدل القدر',
    contextLabelEn: 'Divinely Balanced Capacity',
    tadabburInsightAr: 'ما دمت في هذا الموقف، فإن الله الذي خلقك يعلم علم اليقين أن في وسعك تجاوزه والانتصار فيه، فلا تبتئس.',
    tadabburInsightEn: 'You were never assigned a burden beyond the capacity Allah built within you.',
    referenceCitation: 'القرآن الكريم • سورة البقرة: 286',
  },

  // 2. عزم وشدة بأس وقوة بدنية أثناء الجيم والقتال
  {
    id: 'aya_fortitude_1',
    surahName: 'سورة البقرة',
    surahNumber: 2,
    ayahNumber: 63,
    arabicText: 'خُذُوا مَا آتَيْنَاكُم بِقُوَّةٍ وَاذْكُرُوا مَا فِيهِ لَعَلَّكُمْ تَتَّقُونَ',
    contextCategory: 'athletic_fortitude',
    contextLabelAr: 'عزم الفتوة وشدة البأس',
    contextLabelEn: 'Firm Fortitude & Vigor',
    tadabburInsightAr: 'الأمر الإلهي بأخذ الأمانة والتكاليف بجد وحزم وقوة لا بفتور وتهاون؛ المؤمن القوي أحب إلى الله، وقوة البدن معوان على قوة الدين.',
    tadabburInsightEn: 'Embrace noble endeavors with unwavering grit and physical and moral fortitude.',
    referenceCitation: 'القرآن الكريم • سورة البقرة: 63',
  },
  {
    id: 'aya_fortitude_2',
    surahName: 'سورة الأنفال',
    surahNumber: 8,
    ayahNumber: 60,
    arabicText: 'وَأَعِدُّوا لَهُم مَّا اسْتَطَعْتُم مِّن قُوَّةٍ',
    contextCategory: 'athletic_fortitude',
    contextLabelAr: 'إعداد المستطاع وكمال الجاهزية',
    contextLabelEn: 'Maximum Readiness & Strength',
    tadabburInsightAr: 'الواجب هو بذل أقصى الوسع في بناء البدن ورباط الخيل؛ التدريب عبادة يؤجر عليها العبد متى استحضر نية نصرة الحق وصيانة العرض.',
    tadabburInsightEn: 'Preparation and athletic conditioning are worship when dedicated to noble defense and discipline.',
    referenceCitation: 'القرآن الكريم • سورة الأنفال: 60',
  },
  {
    id: 'aya_fortitude_3',
    surahName: 'سورة آل عمران',
    surahNumber: 3,
    ayahNumber: 159,
    arabicText: 'فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ ۚ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ',
    contextCategory: 'athletic_fortitude',
    contextLabelAr: 'مضاء العزيمة وثبات التوكل',
    contextLabelEn: 'Iron Resolve & Absolute Trust',
    tadabburInsightAr: 'بعد الإعداد والتشاور لا مجال للتردد؛ امضِ في جولتك ونزالك بعزم لا يلين مستنداً إلى حول الله وقوته.',
    tadabburInsightEn: 'Once resolved, eliminate hesitation and move forward anchored in divine trust.',
    referenceCitation: 'القرآن الكريم • سورة آل عمران: 159',
  },

  // 3. نور وانبثاق وبركة مع الفجر وبواكير النهار
  {
    id: 'aya_morning_1',
    surahName: 'سورة التكوير',
    surahNumber: 81,
    ayahNumber: 18,
    arabicText: 'وَالصُّبْحِ إِذَا تَنَفَّسَ',
    contextCategory: 'morning_dawns',
    contextLabelAr: 'انبثاق النور وتنفس النهار',
    contextLabelEn: 'The Breathing Dawn',
    tadabburInsightAr: 'تشبيه خروج ضياء الفجر بانبثاق النفس الحي؛ بداية جديدة لصفحتك البيضاء فاستقبلها بأذكار الصباح والهمة العالية.',
    tadabburInsightEn: 'The morning dawn breathes new vitality into creation—embrace its divine renewal.',
    referenceCitation: 'القرآن الكريم • سورة التكوير: 18',
  },
  {
    id: 'aya_morning_2',
    surahName: 'سورة الإسراء',
    surahNumber: 17,
    ayahNumber: 78,
    arabicText: 'أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَىٰ غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا',
    contextCategory: 'morning_dawns',
    contextLabelAr: 'شهود ملائكة الفجر والقرآن',
    contextLabelEn: 'The Witnessed Dawn Quran',
    tadabburInsightAr: 'تشهد صلاة وقرآن الفجر ملائكة الليل وملائكة النهار؛ من استفتح يومه بهذا الشهود حُفظ وبورك له في سائر ساعاته.',
    tadabburInsightEn: 'Angels of the night and day converge to witness the recitation of the dawn prayer.',
    referenceCitation: 'القرآن الكريم • سورة الإسراء: 78',
  },

  // 4. علم وإتقان وحكمة أثناء العمل العميق
  {
    id: 'aya_focus_1',
    surahName: 'سورة النمل',
    surahNumber: 27,
    ayahNumber: 88,
    arabicText: 'صُنْعَ اللَّهِ الَّذِي أَتْقَنَ كُلَّ شَيْءٍ ۚ إِنَّهُ خَبِيرٌ بِمَا تَفْعَلُونَ',
    contextCategory: 'deep_focus',
    contextLabelAr: 'الإتقان المحكم ومراقبة الخبير',
    contextLabelEn: 'Masterful Excellence & Itqan',
    tadabburInsightAr: 'إن الله كتب الإحسان والإتقان على كل شيء؛ في كل سطر كود أو فكرة أو كتابة تخطها، تمثل صفة الإتقان واجعل عملك شاهداً لك.',
    tadabburInsightEn: 'Excellence is a divine signature upon creation—bring flawless itqan to your deep work.',
    referenceCitation: 'القرآن الكريم • سورة النمل: 88',
  },
  {
    id: 'aya_focus_2',
    surahName: 'سورة طه',
    surahNumber: 20,
    ayahNumber: 114,
    arabicText: 'فَتَعَالَى اللَّهُ الْمَلِكُ الْحَقُّ ۗ وَلَا تَعْجَلْ بِالْقُرْآنِ مِن قَبْلِ أَن يُقْضَىٰ إِلَيْكَ وَحْيُهُ ۖ وَقُل رَّبِّ زِدْنِي عِلْمًا',
    contextCategory: 'deep_focus',
    contextLabelAr: 'طلب الاستزادة من العلم والفهم',
    contextLabelEn: 'The Quest for Expanded Knowledge',
    tadabburInsightAr: 'لم يأمر الله نبيه ﷺ بطلب الزيادة في شيء قط إلا في العلم؛ استفتح جلسة تركيزك بهذا الدعاء لتفتح لك مغاليق الفهم.',
    tadabburInsightEn: 'The only endeavor the Prophet was commanded to ask abundance in was beneficial knowledge.',
    referenceCitation: 'القرآن الكريم • سورة طه: 114',
  },

  // 5. استغفار وخلوة وسكينة في جوف الليل والأسحار
  {
    id: 'aya_night_1',
    surahName: 'سورة الذاريات',
    surahNumber: 51,
    ayahNumber: 18,
    arabicText: 'وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ',
    contextCategory: 'night_sahar',
    contextLabelAr: 'استغفار السحر وخلوة الأبرار',
    contextLabelEn: 'Pre-Dawn Seeking Forgiveness',
    tadabburInsightAr: 'وصف الله أهل الجنة بأنهم يختمون قيام ليلهم بالاستغفار هضماً لأنفسهم كأنهم ما عملوا شيئاً؛ وقت السحر هو زمن النزول الإلهي وقبول الدعاء.',
    tadabburInsightEn: 'The righteous conclude their night devotions with humble istighfar at the pre-dawn hours.',
    referenceCitation: 'القرآن الكريم • سورة الذاريات: 18',
  },
  {
    id: 'aya_night_2',
    surahName: 'سورة السجدة',
    surahNumber: 32,
    ayahNumber: 16,
    arabicText: 'تَتَجَافَىٰ جُنُوبُهُمْ عَنِ الْمَضَاجِعِ يَدْعُونَ رَبَّهُمْ خَوْفًا وَطَمَعًا وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ',
    contextCategory: 'night_sahar',
    contextLabelAr: 'التجافي عن الفراش لذة المناجاة',
    contextLabelEn: 'Forsaking Beds for Night Intimacy',
    tadabburInsightAr: 'حين تنام العيون، يقوم المشتاقون ليناجوا الحي القيوم؛ ركعتان في ظلمة الليل تكونان نوراً في ظلمة القبور.',
    tadabburInsightEn: 'While eyes rest, seekers of truth rise to converse in whispered solitude with the Divine.',
    referenceCitation: 'القرآن الكريم • سورة السجدة: 16',
  },

  // 6. حمد وشكر عند إتمام الإنجازات
  {
    id: 'aya_gratitude_1',
    surahName: 'سورة الأعراف',
    surahNumber: 7,
    ayahNumber: 43,
    arabicText: 'الْحَمْدُ لِلَّهِ الَّذِي هَدَانَا لِهَٰذَا وَمَا كُنَّا لِنَهْتَدِيَ لَوْلَا أَنْ هَدَانَا اللَّهُ',
    contextCategory: 'gratitude_victory',
    contextLabelAr: 'رد الفضل لصاحب الفضل',
    contextLabelEn: 'All Praise to the Ultimate Guide',
    tadabburInsightAr: 'كل خطوة إنجاز تخطوها وتوفيق تبلغه ليس بحولك ولا بذكائك، بل بهداية الله وتوفيقه؛ فاصرف الحمد لمن أعطاك العقل والبدن والقدرة.',
    tadabburInsightEn: 'Every achievement is an unmerited gift from the Divine Guide—crown every completion with sincere hamd.',
    referenceCitation: 'القرآن الكريم • سورة الأعراف: 43',
  },
  {
    id: 'aya_gratitude_2',
    surahName: 'سورة إبراهيم',
    surahNumber: 14,
    ayahNumber: 7,
    arabicText: 'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    contextCategory: 'gratitude_victory',
    contextLabelAr: 'شكر النعمة ضامن النماء',
    contextLabelEn: 'Gratitude Multiplies Bounty',
    tadabburInsightAr: 'الشكر قيد النعم ومفتاح المزيد؛ حين توفق لإتمام يومك أو تمرينك أو مهمتك، اشكر الله يثبت لك عزمك ويبارك في ثمرتك.',
    tadabburInsightEn: 'Gratitude secures existing blessings and unlocks infinite divine increments.',
    referenceCitation: 'القرآن الكريم • سورة إبراهيم: 7',
  },
];

class SpiritualAyaEngine {
  /**
   * Automatically detect the optimal aya context based on biological time, active station, and emotional markers
   */
  public detectContext(
    currentStation?: string,
    isUrgeSurfing: boolean = false
  ): AyaContextCategory {
    if (isUrgeSurfing) return 'stress_anxiety';

    // Station overrides
    if (currentStation === 'GYM_ANCHOR') return 'athletic_fortitude';
    if (currentStation === 'WORK_SPRINT') return 'deep_focus';
    if (currentStation === 'FAJR_SANCTUARY') return 'morning_dawns';
    if (currentStation === 'NIGHT_RECOVERY') return 'night_sahar';

    // Time-based circadian detection
    const hour = new Date().getHours();
    if (hour >= 3 && hour < 6) return 'night_sahar';
    if (hour >= 6 && hour < 11) return 'morning_dawns';
    if (hour >= 11 && hour < 16) return 'deep_focus';
    if (hour >= 16 && hour < 20) return 'athletic_fortitude';
    if (hour >= 20 && hour <= 23) return 'gratitude_victory';

    return 'night_sahar';
  }

  /**
   * Retrieve the contextual resonant aya for the current user state
   */
  public getResonantAya(
    forcedCategory?: AyaContextCategory,
    currentStation?: string,
    isUrgeSurfing: boolean = false
  ): ResonantAya {
    const category = forcedCategory || this.detectContext(currentStation, isUrgeSurfing);
    const pool = RESONANT_AYAS_DATABASE.filter((a) => a.contextCategory === category);
    if (pool.length === 0) return RESONANT_AYAS_DATABASE[0];

    // Pick deterministic or day-based aya within category
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = dayOfYear % pool.length;
    return pool[index];
  }

  /**
   * Get all ayas belonging to a context category
   */
  public getAyasForCategory(category: AyaContextCategory): ResonantAya[] {
    return RESONANT_AYAS_DATABASE.filter((a) => a.contextCategory === category);
  }
}

export const spiritualAyaEngine = new SpiritualAyaEngine();
