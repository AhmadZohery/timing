export type GymAudioCategory =
  | 'all'
  | 'favorites'
  | 'downloaded'
  | 'tazkiyah'
  | 'khutbah'
  | 'tafseer'
  | 'mindset'
  | 'history'
  | 'siyra'
  | 'fiqh'
  | 'live'
  | 'custom';

export interface ScholarProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  avatarEmoji: string;
  specialityAr: string;
  descriptionAr: string;
  category: GymAudioCategory;
}

export interface GymAudioChannel {
  id: string;
  titleAr: string;
  titleEn: string;
  category: GymAudioCategory;
  sheikhAr: string;
  sheikhEn: string;
  streamUrl: string;
  descriptionAr: string;
  descriptionEn: string;
  badgeAr: string;
  badgeEn: string;
  icon: string;
  isLiveStream: boolean;
}

export interface SeerahMotivationQuote {
  id: string;
  titleAr: string;
  quoteAr: string;
  sourceAr: string;
  lessonAr: string;
}

export interface FaithAudioEpisode {
  id: string;
  episodeNumber: number;
  titleAr: string;
  titleEn: string;
  durationFormatted: string;
  audioUrl: string;
  summaryAr: string;
}

export interface FaithAudioSeries {
  id: string;
  scholarId?: string;
  titleAr: string;
  titleEn: string;
  sheikhAr: string;
  sheikhEn: string;
  category: GymAudioCategory;
  badgeAr: string;
  badgeEn: string;
  icon: string;
  descriptionAr: string;
  totalEpisodes: number;
  isCustom?: boolean;
  episodes: FaithAudioEpisode[];
}

export const GYM_AUDIO_CATEGORIES: Array<{
  id: GymAudioCategory;
  labelAr: string;
  labelEn: string;
  icon: string;
}> = [
  { id: 'all', labelAr: 'الكل', labelEn: 'All', icon: '✨' },
  { id: 'favorites', labelAr: 'المفضلة', labelEn: 'Favorites', icon: '⭐' },
  { id: 'downloaded', labelAr: '📱 المحملة أوفلاين', labelEn: 'Downloaded', icon: '📱' },
  { id: 'tazkiyah', labelAr: 'تزكية ورقائق', labelEn: 'Spiritual & Heart', icon: '💖' },
  { id: 'khutbah', labelAr: 'خطب ومواعظ مدوية', labelEn: 'Sermons & Grit', icon: '🎙️' },
  { id: 'tafseer', labelAr: 'تفسير وتدبر القرآن', labelEn: 'Quran Tafsir', icon: '📖' },
  { id: 'mindset', labelAr: 'بناء النفس والهمة', labelEn: 'Mindset & Growth', icon: '🌱' },
  { id: 'history', labelAr: 'تاريخ وسير الأبطال', labelEn: 'History & Heroes', icon: '⚔️' },
  { id: 'siyra', labelAr: 'السيرة النبوية العطرة', labelEn: 'Prophetic Seerah', icon: '🕌' },
  { id: 'fiqh', labelAr: 'فقه وسنن العبادات', labelEn: 'Fiqh & Sunnah', icon: '⚖️' },
  { id: 'live', labelAr: 'إذاعات حية متواصلة', labelEn: 'Live Radios', icon: '📻' },
  { id: 'custom', labelAr: 'دروس خاصة ➕', labelEn: 'Custom Links', icon: '🔗' },
];

// دساتير وأئمة وعلماء أهل السنة والجماعة الأثريين المستقلين الصادقين
export const SCHOLARS_DIRECTORY: ScholarProfile[] = [
  {
    id: 'ahmed_abdelmonem',
    nameAr: 'د. أحمد عبد المنعم',
    nameEn: 'Dr. Ahmed Abdelmonem',
    avatarEmoji: '🌱',
    specialityAr: 'تأسيس وعي المسلم، رقائق وتدبر القرآن، ومعالم الهداية',
    descriptionAr: 'طبيب وداعية مربٍّ، عناية فائقة بتدبر الوحي وتزكية النفوس وبناء مناعة الجيل الصاعد.',
    category: 'tafseer',
  },
  {
    id: 'ayman_abdelrahim',
    nameAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    nameEn: 'Eng. Ayman Abdelrahim',
    avatarEmoji: '🧠',
    specialityAr: 'تأسيس وعي المسلم المعاصر، التاريخ الإسلامي، ومدخل العلوم',
    descriptionAr: 'محاضر ومفكر إسلامي فذ، دورات تأسيس الوعي، سيكولوجية الجماهير، وفك الارتهان الفكري والحضاري.',
    category: 'mindset',
  },
  {
    id: 'amjad_samir',
    nameAr: 'الشيخ أمجد سمير',
    nameEn: 'Sheikh Amjad Samir',
    avatarEmoji: '🕊️',
    specialityAr: 'فقه النفس، التزكية والسلوك، والتربية الإيمانية المتدرجة',
    descriptionAr: 'مربٍّ وداعية، معالجة آفات القلوب وفقه النفس وبناء العادات الإيمانية المتينة بأسلوب هادئ عميق.',
    category: 'tazkiyah',
  },
  {
    id: 'ahmed_arabi',
    nameAr: 'الشيخ أحمد العربي',
    nameEn: 'Sheikh Ahmed Al-Arabi',
    avatarEmoji: '✨',
    specialityAr: 'بناء الشخصية المسلمة، مدارج التزكية، وتوجيهات الشباب',
    descriptionAr: 'خطاب إيماني تأصيلي يعنى ببناء الذات المسلمة، حراسة الفطرة، وشحذ الهمم لنصرة الدين.',
    category: 'mindset',
  },
  {
    id: 'haitham_talaat',
    nameAr: 'د. هيثم طلعت',
    nameEn: 'Dr. Haitham Talaat',
    avatarEmoji: '🛡️',
    specialityAr: 'المناعة العقدية، نقد الإلحاد والمادية، وبراهين النبوة',
    descriptionAr: 'طبيب وباحث متخصص في ترسيخ اليقين العقلي والرد على الإلحاد والشبهات المعاصرة بالأدلة القاطعة.',
    category: 'mindset',
  },
  {
    id: 'abdullah_ojairi',
    nameAr: 'الشيخ د. عبد الله العجيري',
    nameEn: 'Dr. Abdullah Al-Ojairi',
    avatarEmoji: '⚡',
    specialityAr: 'مركز تكوين، صناعة المحاور، ينبوع الغواية، وحجية السنة',
    descriptionAr: 'تأصيل معرفي عقدي صلب، تفكيك الشبهات العصرية، وتثبيت مرجعية الوحي في نفوس الشباب.',
    category: 'mindset',
  },
  {
    id: 'ibn_uthaymeen',
    nameAr: 'الشيخ محمد بن صالح العثيمين (رحمه الله)',
    nameEn: 'Sheikh Muhammad ibn Salih al-Uthaymeen',
    avatarEmoji: '📖',
    specialityAr: 'فقه العبادات، شرح رياض الصالحين، وتفسير القرآن',
    descriptionAr: 'فقيه الأمة المحقق، تأصيل علمي رصين، فقه الصلاة، رقة القلب، وأدب السنة.',
    category: 'fiqh',
  },
  {
    id: 'abdulaziz_tarefe',
    nameAr: 'الشيخ عبد العزيز الطريفي (فك الله أسره)',
    nameEn: 'Sheikh Abdul Aziz Al-Tarefe',
    avatarEmoji: '🛡️',
    specialityAr: 'محدث العصر، فقه السنن، تفسير آيات الأحكام، وثبات اليقين',
    descriptionAr: 'علم جم وفهم عميق للحديث والسنن المهجورة، فقه الفتن، استقلالية تامة وصدع بالحق.',
    category: 'tafseer',
  },
  {
    id: 'ibrahim_sakran',
    nameAr: 'الشيخ إبراهيم السكران (فك الله أسره)',
    nameEn: 'Sheikh Ibrahim Al-Sakran',
    avatarEmoji: '✨',
    specialityAr: 'رقائق القرآن، مسلكيات، بناء العقلية الإيمانية، وعلو الهمة',
    descriptionAr: 'قلم فذ يوقظ الغفلة في "رقائق القرآن" و"الماجريات"، عمق تدبري وبصيرة نافذة.',
    category: 'tafseer',
  },
  {
    id: 'khaled_rashed',
    nameAr: 'الشيخ خالد الراشد (فك الله أسره)',
    nameEn: 'Sheikh Khaled Al-Rashed',
    avatarEmoji: '🔥',
    specialityAr: 'خطب حماسية، شحذ الهمم، ومواعظ التوبة والخشوع',
    descriptionAr: 'صوت جهوري صادق يهز القلوب، الحث على الصلاة والتوبة والغيرة على حرمات الأمة.',
    category: 'khutbah',
  },
  {
    id: 'abdelhamid_kishk',
    nameAr: 'الشيخ عبد الحميد كشك (رحمه الله)',
    nameEn: 'Sheikh Abdelhamid Kishk',
    avatarEmoji: '🦁',
    specialityAr: 'فارس المنابر، الخطب التاريخية المدوية، والشجاعة والبطولة',
    descriptionAr: 'خطب الجمعة التاريخية التي لا تموت، شجاعة نادرة في الصدع بالحق وثبات كالجبال.',
    category: 'khutbah',
  },
  {
    id: 'mohamed_sayed_haj',
    nameAr: 'الشيخ محمد سيد حاج (رحمه الله)',
    nameEn: 'Sheikh Mohamed Sayed Haj',
    avatarEmoji: '🕊️',
    specialityAr: 'داعية السنة، شرح رياض الصالحين، حلاوة الإيمان، والتربية',
    descriptionAr: 'أسلوب إيماني آسر يجمع بين فقه السلف وعاطفة المحبة الصادقة وزهد الصالحين.',
    category: 'tazkiyah',
  },
  {
    id: 'abu_ishaq_huwayni',
    nameAr: 'الشيخ أبو إسحاق الحويني (حفظه الله)',
    nameEn: 'Sheikh Abu Ishaq Al-Huwayni',
    avatarEmoji: '🦁',
    specialityAr: 'محدث الديار المصرية، الذب عن السنة النبوية، مدرسة الحياة، وفضائل الصحابة',
    descriptionAr: 'تأصيل حديثي وعقدي راسخ على منهج السلف الصالح، ونقد الانحرافات الصوفية والبدعية بالحجة والبرهان.',
    category: 'tazkiyah',
  },
  {
    id: 'muhammad_ismail_muqaddam',
    nameAr: 'الشيخ د. محمد إسماعيل المقدم',
    nameEn: 'Dr. Muhammad Ismail Al-Muqaddam',
    avatarEmoji: '🏔️',
    specialityAr: 'علو الهمة، لماذا نصلي، عودة الحجاب، وتزكية النفس على منهج أهل السنة',
    descriptionAr: 'طبيب وعالم مربٍّ، صاحب المؤلفات والمحاضرات الخالدة في شحذ الهمم وبناء الشخصية السنية المتوازنة.',
    category: 'mindset',
  },
  {
    id: 'samir_moustafa',
    nameAr: 'الشيخ سمير مصطفى (فك الله أسره)',
    nameEn: 'Sheikh Samir Moustafa',
    avatarEmoji: '⚡',
    specialityAr: 'علو الهمة، الصبر على الطاعة، وعلاج الفتور والتسويف',
    descriptionAr: 'خطاب شبابي إيماني حارق يكسر قيود الكسل والتسويف في العبادة والعمل الصالح.',
    category: 'mindset',
  },
  {
    id: 'eyad_qunaibi',
    nameAr: 'د. إياد قنيبي',
    nameEn: 'Dr. Eyad Qunaibi',
    avatarEmoji: '🌱',
    specialityAr: 'رحلة اليقين، بناء المناعة الفكرية، وهمة بناء الجيل المسلم',
    descriptionAr: 'ترسيخ الإيمان والصلابة العقدية بالأدلة العقلية ومحاربة الشبهات والانحرافات.',
    category: 'mindset',
  },
  {
    id: 'badr_meshari',
    nameAr: 'الشيخ بدر المشاري',
    nameEn: 'Sheikh Badr Al-Meshari',
    avatarEmoji: '🕌',
    specialityAr: 'السيرة النبوية الكبرى، بطولات الصحابة، وتاريخ الفاتحين',
    descriptionAr: 'سرد قصصي عذب لسير النبي ﷺ وأصحابه الكرام يبني العزة والشرف في النفوس.',
    category: 'siyra',
  },
  {
    id: 'bin_baz',
    nameAr: 'الشيخ عبد العزيز بن باز (رحمه الله)',
    nameEn: 'Sheikh Abdul Aziz ibn Baz',
    avatarEmoji: '📚',
    specialityAr: 'إمام أهل السنة، التوحيد الخالص، النصيحة، ونور على الدرب',
    descriptionAr: 'الإمام المجدد، ورع وتواضع وصدق في الفتوى وتوجيه المسلمين إلى صريح السنة.',
    category: 'fiqh',
  },
  {
    id: 'albani',
    nameAr: 'الشيخ محمد ناصر الدين الألباني (رحمه الله)',
    nameEn: 'Sheikh Muhammad Nasiruddin al-Albani',
    avatarEmoji: '🔍',
    specialityAr: 'محدث العصر، التصفية والتربية، وهدي النبي ﷺ الصحيح',
    descriptionAr: 'إحياء السنن وإماتة البدع، تحرير الأحاديث، وتجريد المتابعة لرسول الله ﷺ.',
    category: 'fiqh',
  },
  {
    id: 'safar_hawali',
    nameAr: 'الشيخ سفر الحوالي (فك الله أسره)',
    nameEn: 'Sheikh Safar Al-Hawali',
    avatarEmoji: '🏛️',
    specialityAr: 'شرح العقيدة الطحاوية، فقه الأمة، وعلو الهمة',
    descriptionAr: 'تأصيل عقدي متين يربط بين نصوص الوحي وواقع الأمة بعزة واستقلال.',
    category: 'history',
  },
  {
    id: 'shinqitee',
    nameAr: 'الشيخ محمد بن محمد المختار الشنقيطي',
    nameEn: 'Sheikh Muhammad Al-Mukhtar Al-Shinqitee',
    avatarEmoji: '💎',
    specialityAr: 'فقيه المدينة، شرح زاد المستقنع، رقة القلب، ومواعظ التوحيد',
    descriptionAr: 'مواعظ تبكي العيون وترقق القلوب، تفيض بالخشية وحب الله والتفقه في الدين.',
    category: 'tazkiyah',
  },
  {
    id: 'ahmed_al_sayed',
    nameAr: 'الشيخ أحمد بن يوسف السيد',
    nameEn: 'Sheikh Ahmad Al-Sayed',
    avatarEmoji: '💡',
    specialityAr: 'صناعة المحاور، كامل الصورة، البناء الفكري والعقدي، وتزكية الجيل الصاعد',
    descriptionAr: 'مربٍّ ومؤصل معرفي فذ، حراسة الوحي، تفكيك الشبهات المعاصرة، وبناء الجيل القرآني المتين.',
    category: 'mindset',
  },
  {
    id: 'hazem_shouman',
    nameAr: 'د. حازم شومان',
    nameEn: 'Dr. Hazem Shouman',
    avatarEmoji: '🔥',
    specialityAr: 'طريق النجاة، شحذ الهمم، ومفاتيح القلوب والتوبة النصوح',
    descriptionAr: 'طبيب وداعية ملهب للقلوب، خطاب شبابي حيوي ينتزع الغفلة ويشعل محبة الله والحرص على الصلاة.',
    category: 'khutbah',
  },
];

export const GYM_FAITH_CHANNELS: GymAudioChannel[] = [
  {
    id: 'makkah_quran_radio',
    titleAr: 'إذاعة القرآن الكريم - تلاوات خاشعة متواصلة',
    titleEn: 'Holy Quran Radio - Continuous Recitations',
    category: 'live',
    sheikhAr: 'نخبة من كبار قراء العالم الإسلامي (ترتيل خاشع)',
    sheikhEn: 'Renowned Quran Reciters',
    streamUrl: 'https://qurango.net/radio/tarateel',
    descriptionAr: 'بث حي متواصل 24/7 لأعذب التلاوات القرآنية الخاشعة لسكينة الروح وتصفية الذهن.',
    descriptionEn: 'Continuous 24/7 live broadcast of serene Quranic recitations for mental peace.',
    badgeAr: 'بث مباشر 🔴',
    badgeEn: 'Live 🔴',
    icon: '🕋',
    isLiveStream: true,
  },
  {
    id: 'sakeenah_radio',
    titleAr: 'إذاعة آيات السكينة والطمأنينة (أحمد العجمي)',
    titleEn: 'Verses of Tranquility (Ahmad Al-Ajmy)',
    category: 'live',
    sheikhAr: 'الشيخ أحمد بن علي العجمي',
    sheikhEn: 'Sheikh Ahmad Al-Ajmy',
    streamUrl: 'https://qurango.net/radio/ahmad_alajmy',
    descriptionAr: 'تلاوات هادئة مهدئة للقلب والنفس، لخفض التوتر وإراحة البال وتجديد الطاقة الإيجابية.',
    descriptionEn: 'Selected calming recitations by Ahmad Al-Ajmy to ease stress and renew mental focus.',
    badgeAr: 'استشفاء وسكينة',
    badgeEn: 'Peace & Healing',
    icon: '🌿',
    isLiveStream: true,
  },
  {
    id: 'alafasi_radio',
    titleAr: 'إذاعة التلاوات والأذكار (مشاري العفاسي)',
    titleEn: 'Recitations & Adhkar (Mishary Alafasy)',
    category: 'live',
    sheikhAr: 'الشيخ مشاري بن راشد العفاسي',
    sheikhEn: 'Sheikh Mishary Alafasy',
    streamUrl: 'https://qurango.net/radio/mishary_alafasi',
    descriptionAr: 'تلاوات عذبة ندية وأذكار نبوية تملأ القلب بالسكينة والتفاؤل أثناء الرياضة والعمل.',
    descriptionEn: 'Soul-stirring recitations and authentic adhkar for spiritual serenity and vitality.',
    badgeAr: 'تلاوات وأذكار',
    badgeEn: 'Recitations & Adhkar',
    icon: '✨',
    isLiveStream: true,
  },
  {
    id: 'hamas_tarateel',
    titleAr: 'تلاوات حماسية خاشعة لشحذ الهمة (ياسر الدوسري)',
    titleEn: 'Vibrant Inspiring Recitations (Yasser Al-Dosari)',
    category: 'live',
    sheikhAr: 'الشيخ د. ياسر بن راشد الدوسري (الحرم المكي)',
    sheikhEn: 'Sheikh Yasser Al-Dosari',
    streamUrl: 'https://qurango.net/radio/yasser_aldosari',
    descriptionAr: 'تلاوات قوية جياشة تبعث في النفس الشجاعة والإقدام، ممتازة لجولات التمارين الشاقة ورفع الأثقال.',
    descriptionEn: 'Dynamic and powerful recitations instilling drive and resilience for intense physical sessions.',
    badgeAr: 'شحنة حماس',
    badgeEn: 'High Energy',
    icon: '🦁',
    isLiveStream: true,
  },
  {
    id: 'shuraim_radio',
    titleAr: 'إذاعة أئمة الحرم المكي (سعود الشريم)',
    titleEn: 'Makkah Imams Radio (Saud Al-Shuraim)',
    category: 'live',
    sheikhAr: 'الشيخ د. سعود بن إبراهيم الشريم',
    sheikhEn: 'Sheikh Saud Al-Shuraim',
    streamUrl: 'https://qurango.net/radio/saud_alshuraim',
    descriptionAr: 'قراءات تاريخية مؤثرة من محراب الحرم المكي الشريف، تفيض بالخشوع والرهبة والجمال.',
    descriptionEn: 'Historic recitations from the Grand Mosque of Makkah, inspiring devotion and humility.',
    badgeAr: 'أئمة الحرم',
    badgeEn: 'Haram Imams',
    icon: '📜',
    isLiveStream: true,
  },
  {
    id: 'maher_radio',
    titleAr: 'إذاعة الحرم المكي الشريف (ماهر المعيقلي)',
    titleEn: 'Makkah Grand Mosque Radio (Maher Al-Muaiqly)',
    category: 'live',
    sheikhAr: 'الشيخ د. ماهر بن حمد المعيقلي (إمام الحرم المكي)',
    sheikhEn: 'Sheikh Maher Al-Muaiqly',
    streamUrl: 'https://qurango.net/radio/maher',
    descriptionAr: 'بث حي لتلاوات خاشعة آسرة من الحرم المكي، تفيض بالسكينة وخشوع القلب.',
    descriptionEn: 'Live continuous broadcast of serene recitations from the Grand Mosque of Makkah.',
    badgeAr: 'إمام الحرم المكي 🕋',
    badgeEn: 'Haram Imam 🕋',
    icon: '🕋',
    isLiveStream: true,
  },
  {
    id: 'qatami_radio',
    titleAr: 'إذاعة التلاوات المؤثرة (ناصر القطامي)',
    titleEn: 'Heartfelt Recitations (Nasser Al-Qatami)',
    category: 'live',
    sheikhAr: 'الشيخ ناصر بن علي القطامي',
    sheikhEn: 'Sheikh Nasser Al-Qatami',
    streamUrl: 'https://qurango.net/radio/nasser_alqatami',
    descriptionAr: 'تلاوات خاشعة تمس القلوب برقة وأنين، مناسبة جداً لفترات الاسترخاء والتهدئة وتفريغ الذهن.',
    descriptionEn: 'Moving recitations touching hearts with deep spiritual warmth and reflection.',
    badgeAr: 'تلاوة خاشعة',
    badgeEn: 'Devotional',
    icon: '🌟',
    isLiveStream: true,
  },
  {
    id: 'abdulbasit_radio',
    titleAr: 'إذاعة الشيخ عبد الباسط عبد الصمد (المجود الخاشع)',
    titleEn: 'Sheikh Abdul Basit Radio (Mujawwad)',
    category: 'live',
    sheikhAr: 'الشيخ عبد الباسط عبد الصمد (رحمه الله)',
    sheikhEn: 'Sheikh Abdul Basit Abdus Samad',
    streamUrl: 'https://qurango.net/radio/abdulbasit_abdulsamad_mojawwad',
    descriptionAr: 'تلاوات تاريخية مجودة بصوت قيثارة السماء، تبعث الهيبة والإجلال في القلب.',
    descriptionEn: 'Legendary mujawwad recitations of breathtaking spiritual depth and grandeur.',
    badgeAr: 'تلاوات مجودة',
    badgeEn: 'Legendary Mujawwad',
    icon: '💎',
    isLiveStream: true,
  },
  {
    id: 'minshawi_radio',
    titleAr: 'إذاعة الشيخ محمد صديق المنشاوي (الصوت الباكي الخاشع)',
    titleEn: 'Sheikh Mohamed Siddiq Al-Minshawi Radio',
    category: 'live',
    sheikhAr: 'الشيخ محمد صديق المنشاوي (رحمه الله)',
    sheikhEn: 'Sheikh Mohamed Siddiq Al-Minshawi',
    streamUrl: 'https://qurango.net/radio/mohammed_siddiq_alminshawi',
    descriptionAr: 'تلاوات خاشعة تفيض بالروحانية والخشوع، مثالية للقراءة والتدبر وساعات الهدوء.',
    descriptionEn: 'Deeply moving recitations by Sheikh Al-Minshawi for reflection and peace.',
    badgeAr: 'الصوت الخاشع',
    badgeEn: 'Soulful Recitation',
    icon: '🌙',
    isLiveStream: true,
  },
  {
    id: 'husary_radio',
    titleAr: 'إذاعة الشيخ محمود خليل الحصري (المصحف المرتل المتقن)',
    titleEn: 'Sheikh Mahmoud Khalil Al-Husary Radio',
    category: 'live',
    sheikhAr: 'الشيخ محمود خليل الحصري (رحمه الله)',
    sheikhEn: 'Sheikh Mahmoud Khalil Al-Husary',
    streamUrl: 'https://qurango.net/radio/mahmoud_khalil_alhussary',
    descriptionAr: 'إمام القراء في ضبط مخارج الحروف والترتيل المتقن، ممتاز لتصحيح التلاوة والحفظ.',
    descriptionEn: 'Masterful, crystal-clear tartil recitation ideal for memorization and focus.',
    badgeAr: 'ضبط وإتقان',
    badgeEn: 'Master Tartil',
    icon: '📖',
    isLiveStream: true,
  },
  {
    id: 'hudhaify_radio',
    titleAr: 'إذاعة المسجد النبوي الشريف (علي الحذيفي)',
    titleEn: 'Prophet Mosque Imam Radio (Ali Al-Hudhaify)',
    category: 'live',
    sheikhAr: 'الشيخ د. علي بن عبد الرحمن الحذيفي',
    sheikhEn: 'Sheikh Ali Al-Hudhaify',
    streamUrl: 'https://qurango.net/radio/ali_alhuthaifi',
    descriptionAr: 'تلاوات مهيبة متأنية من رحاب المسجد النبوي الشريف تبعث الطمأنينة والوقار.',
    descriptionEn: 'Majestic recitations from the Imam of the Prophet’s Mosque in Madinah.',
    badgeAr: 'الحرم النبوي 🕌',
    badgeEn: 'Madinah Imam 🕌',
    icon: '🕌',
    isLiveStream: true,
  },
  {
    id: 'tafseer_radio',
    titleAr: 'إذاعة تفسير القرآن الكريم الميسر والشامل',
    titleEn: 'Holy Quran Tafsir & Commentary Radio',
    category: 'tafseer',
    sheikhAr: 'نخبة علماء التفسير وعلوم القرآن',
    sheikhEn: 'Quran Tafsir Scholars',
    streamUrl: 'https://qurango.net/radio/tafseer',
    descriptionAr: 'بث مباشر على مدار الساعة لشرح معاني آيات القرآن الكريم وتدبر هداياته.',
    descriptionEn: '24/7 continuous broadcast explaining the meanings and wisdom of the Quran.',
    badgeAr: 'تفسير وتدبر 💡',
    badgeEn: 'Quran Tafsir 💡',
    icon: '💡',
    isLiveStream: true,
  },
  {
    id: 'seerah_radio',
    titleAr: 'إذاعة السيرة النبوية العطرة ومواقف الصحابة',
    titleEn: 'Prophetic Seerah & Companions Radio',
    category: 'siyra',
    sheikhAr: 'إذاعة السيرة النبوية المتواصلة',
    sheikhEn: 'Prophetic Biography Radio',
    streamUrl: 'https://qurango.net/radio/fi_zilal_alsiyra',
    descriptionAr: 'حلقات متواصلة تروي سيرة المصطفى ﷺ وغزواته وأخلاقه ومواقف أصحابه الكرام.',
    descriptionEn: 'Continuous episodes narrating the life, character, and expeditions of the Prophet ﷺ.',
    badgeAr: 'في ظلال السيرة ⚔️',
    badgeEn: 'Seerah Live ⚔️',
    icon: '⚔️',
    isLiveStream: true,
  },
  {
    id: 'ruqyah_radio',
    titleAr: 'إذاعة الرقية الشرعية وآيات الشفاء والسكينة',
    titleEn: 'Ruqyah Shariah & Healing Verses Radio',
    category: 'tazkiyah',
    sheikhAr: 'إذاعة الرقية الشرعية المتواصلة',
    sheikhEn: 'Authentic Ruqyah Radio',
    streamUrl: 'https://qurango.net/radio/roqiah',
    descriptionAr: 'بث متواصل لآيات الرقية الشرعية والشفاء والتحصين من القرآن الكريم والسنة النبوية.',
    descriptionEn: 'Continuous broadcast of healing Quranic verses and authentic Ruqyah.',
    badgeAr: 'شفاء وتحصين 🛡️',
    badgeEn: 'Healing & Shield 🛡️',
    icon: '🛡️',
    isLiveStream: true,
  },
];

export const SEERAH_DETERMINATION_QUOTES: SeerahMotivationQuote[] = [
  {
    id: 'quote-1',
    titleAr: 'ثبات النبي ﷺ يوم حنين',
    quoteAr: 'لما انكشف الناس عن رسول الله ﷺ في حنين، نزل عن بغلته البيضاء وتقدم وحده وهو ينادي بملء صوته: "أنا النبي لا كذب، أنا ابن عبد المطلب!" فاجتمع الصحابة حوله وتغير مجرى المعركة.',
    sourceAr: 'صحيح البخاري',
    lessonAr: 'الشجاعة ليست غياب الصعوبة، بل هي الثبات عندما يتراجع الجميع.',
  },
  {
    id: 'quote-2',
    titleAr: 'عزيمة خالد بن الوليد يوم مؤتة',
    quoteAr: 'قال خالد بن الوليد رضي الله عنه: "لقد انكسرت في يدي يوم مؤتة تسعة أسياف، فما ثبت في يدي إلا صفيحة يمانية".',
    sourceAr: 'صحيح البخاري',
    lessonAr: 'المؤمن لا يعرف الاستسلام؛ إذا انكسر في يدك سلاح، ابحث عن سلاح آخر حتى تظفر.',
  },
  {
    id: 'quote-3',
    titleAr: 'قوة الإرادة والتوكل النبوي',
    quoteAr: 'قال النبي ﷺ: "المؤمنُ القويُّ خيرٌ وأحبُّ إلى اللهِ من المؤمنِ الضعيفِ، وفي كلٍّ خيرٌ، احرِصْ على ما ينفعُكَ واستعِنْ باللهِ ولا تعجَزْ".',
    sourceAr: 'صحيح مسلم',
    lessonAr: 'التمرين وبناء الجسد عبادة، وإياك وكلمة "لا أستطيع"، بل استعن بالله ولا تعجز.',
  },
  {
    id: 'quote-4',
    titleAr: 'فداء الزبير بن العوام',
    quoteAr: 'كان الزبير بن العوام حواري رسول الله ﷺ، وكان إذا ركب الخيل تخط قدماه الأرض من طوله وشدة بأسه، وجُرح في سبيل الله حتى كان في جسده طعنات كالأعين.',
    sourceAr: 'سير أعلام النبلاء',
    lessonAr: 'أثر الجهد والتعب البدني في طاعة الله هو وسام شرف دائم لصاحبه.',
  },
  {
    id: 'quote-5',
    titleAr: 'صبر النبي ﷺ في حفر الخندق',
    quoteAr: 'كان النبي ﷺ يربط على بطنه حجرين من شدة الجوع في غزوة الخندق في برد قارس، ومع ذلك كان يضرب الصخرة العظيمة بمعوله فتتفتت كالكثيب الأهيل وتبرق منها أنوار النصر.',
    sourceAr: 'السيرة النبوية لابن هشام',
    lessonAr: 'أشد أوقات الشدة هي ذاتها التي تسبق انبلاج فجر الفتح والتمكين.',
  },
];

export const FAITH_AUDIO_SERIES: FaithAudioSeries[] = [
  {
    "id": "series_riyad_uthaymeen",
    "scholarId": "ibn_uthaymeen",
    "titleAr": "شرح رياض الصالحين وأخلاق المسلم",
    "titleEn": "Riyad as-Salihin Commentary",
    "sheikhAr": "الشيخ محمد بن صالح العثيمين (رحمه الله)",
    "sheikhEn": "Sheikh Muhammad ibn Salih al-Uthaymeen",
    "category": "tazkiyah",
    "badgeAr": "فقه وأخلاق • 4 حلقات",
    "badgeEn": "Salihin Ethics • 4 Episodes",
    "icon": "📖",
    "descriptionAr": "شرح فريد لأحاديث الصبر، الإخلاص، التقوى، ومجاهدة النفس، بأسلوب علمي رقيق يأخذ بالقلوب.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "iu_ep_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: باب الإخلاص وإحضار النية في كل عمل (إنما الأعمال بالنيات)",
        "titleEn": "The Sincerity of Intention in Every Action",
        "durationFormatted": "31:20",
        "audioUrl": "https://archive.org/download/011_20210928_202109/001.mp3",
        "summaryAr": "شرح حديث عمر بن الخطاب؛ حقيقة الإخلاص وكيف تصبح العادات اليومية والرياضة طاعات مأجورة."
      },
      {
        "id": "iu_ep_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: باب التوبة وشروط الرجوع الصادق إلى الله",
        "titleEn": "Repentance and Returning to Allah",
        "durationFormatted": "29:45",
        "audioUrl": "https://archive.org/download/011_20210928_202109/002.mp3",
        "summaryAr": "سعة رحمة الله تعالى وقبول التوبة من التائبين، والتخلص من الإصرار على المعاصي."
      },
      {
        "id": "iu_ep_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: باب الصبر عند الصدمة الأولى وقوة التحمل",
        "titleEn": "Patience and Resilience",
        "durationFormatted": "33:10",
        "audioUrl": "https://archive.org/download/011_20210928_202109/003.mp3",
        "summaryAr": "أنواع الصبر الثلاثة: على طاعة الله، وعن معصية الله، وعلى أقدار الله المؤلمة بالرضا والاحتساب."
      },
      {
        "id": "iu_ep_04",
        "episodeNumber": 4,
        "titleAr": "الدرس 4: باب الصدق واليقين في المعاملة والقول",
        "titleEn": "Truthfulness and Firm Certainty",
        "durationFormatted": "28:50",
        "audioUrl": "https://archive.org/download/011_20210928_202109/004.mp3",
        "summaryAr": "الصدق يهدي إلى البر وإن البر يهدي إلى الجنة؛ بناء شخصية المسلم المستقيمة في السر والعلن."
      }
    ]
  },
  {
    "id": "series_huwayni_madrasat_hayah",
    "scholarId": "abu_ishaq_huwayni",
    "titleAr": "مدرسة الحياة وتنقية السلوك على منهج السلف",
    "titleEn": "School of Life & Authentic Sunnah Purification",
    "sheikhAr": "الشيخ أبو إسحاق الحويني (حفظه الله)",
    "sheikhEn": "Sheikh Abu Ishaq Al-Huwayni",
    "category": "tazkiyah",
    "badgeAr": "مدرسة الحياة • 3 مجالس",
    "badgeEn": "School of Life • 3 Episodes",
    "icon": "🦁",
    "descriptionAr": "مجالس علمية وتربوية ماتعة في فهم الحياة على ضوء السنة النبوية، ونقد شطحات المتصوفة وأهل البدع بالحجة والدليل.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "ah_ep_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: يا نفس جِدِّي — اليقظة الإيمانية واغتنام الأعمار",
        "titleEn": "O Soul Strive Hard: Spiritual Awakening",
        "durationFormatted": "48:20",
        "audioUrl": "https://www.youtube.com/watch?v=_F_mBa4NufU",
        "summaryAr": "محاسبة النفس ومجاهدتها على طاعة الله قبل فوات الأوان، والاعتبار بتجارب الحياة."
      },
      {
        "id": "ah_ep_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: الفراسة الإيمانية ونور البصيرة بنور الوحي",
        "titleEn": "Faith-Based Insight & Spiritual Discernment",
        "durationFormatted": "52:10",
        "audioUrl": "https://www.youtube.com/watch?v=DPO-zWty9VM",
        "summaryAr": "كيف يرزق الله المؤمن الصادق المتبع للسنة نوراً يميز به بين الحق والباطل."
      },
      {
        "id": "ah_ep_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: أنت الجماعة وإن كنت وحدك — الثبات على السنة النبوية",
        "titleEn": "You Are the Jama'ah Even If Alone: Firmness on the Sunnah",
        "durationFormatted": "87:40",
        "audioUrl": "https://archive.org/download/anta_algama3a_wa_en_konta_wa7dak_S/anta-walgma3a.mp3",
        "summaryAr": "بيان صفاء منهج أهل السنة والجماعة في التزكية والاتباع بعيداً عن البدع والخرافات."
      }
    ]
  },
  {
    "id": "series_halawat_iman_haj",
    "scholarId": "mohamed_sayed_haj",
    "titleAr": "مدارج السالكين وتزكية القلوب",
    "titleEn": "Madarij as-Salikin & Soul Purification",
    "sheikhAr": "الشيخ محمد سيد حاج (رحمه الله)",
    "sheikhEn": "Sheikh Muhammad Sayed Haj",
    "category": "tazkiyah",
    "badgeAr": "رقائق وتزكية • 4 حلقات",
    "badgeEn": "Heart Softeners • 4 Episodes",
    "icon": "✨",
    "descriptionAr": "مواعظ مؤثرة بأسلوب الشيخ الآسر؛ طريق الهداية، الصلة بالله، والانشغال بالذكر والاستقامة.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "msh_ep_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: أريد أن أستقيم ولكن — عقبات الطريق وكيف نتجاوزها",
        "titleEn": "I Want to Be Steadfast, But: Overcoming Obstacles",
        "durationFormatted": "29:15",
        "audioUrl": "https://archive.org/download/Mohamed-Sayed-Hajj/%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%86%20%D8%A7%D8%B3%D8%AA%D9%82%D9%8A%D9%85%20%D9%88%D9%84%D9%83%D9%86.mp3",
        "summaryAr": "انتباه القلب من رقدة الغفلة وكسر العوائق النفسية التي تحول بين الشاب والاستقامة."
      },
      {
        "id": "msh_ep_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: الطريق إلى الهداية والإنابة الصادقة إلى الله",
        "titleEn": "The Path to Guidance and Sincere Return to Allah",
        "durationFormatted": "26:50",
        "audioUrl": "https://archive.org/download/Mohamed-Sayed-Hajj/%D8%A7%D9%84%D8%B7%D8%B1%D9%8A%D9%82%20%D8%A7%D9%84%D9%89%20%D8%A7%D9%84%D9%87%D8%AF%D8%A7%D9%8A%D8%A9.mp3",
        "summaryAr": "شروط التوبة النصوح، تذوق حلاوة القرب من الله، وتطهير الصحائف بالاستغفار والعمل الصالح."
      },
      {
        "id": "msh_ep_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: الصلة بالله وعمارة الباطن بالتقوى والإخلاص",
        "titleEn": "Connection with Allah and Inner Piety",
        "durationFormatted": "12:15",
        "audioUrl": "https://archive.org/download/Mohamed-Sayed-Hajj/%D8%A7%D9%84%D8%B5%D9%84%D8%A9%20%D8%A8%D8%A7%D9%84%D9%84%D9%87.mp3",
        "summaryAr": "حاسبوا أنفسكم قبل أن تحاسبوا؛ تقوية الصلة بالله في الخلوات وتثبيت القدم على الصراط المستقيم."
      },
      {
        "id": "msh_ep_04",
        "episodeNumber": 4,
        "titleAr": "المجلس 4: الانشغال بالذكر وحياة القلب بذكر الرحمن",
        "titleEn": "Busying the Tongue and Heart with Dhikr",
        "durationFormatted": "19:30",
        "audioUrl": "https://archive.org/download/Mohamed-Sayed-Hajj/%D8%A7%D9%84%D8%A7%D9%86%D8%B4%D8%BA%D8%A7%D9%84%20%D8%A8%D8%A7%D9%84%D8%B0%D9%83%D8%B1.mp3",
        "summaryAr": "مثل الذي يذكر ربه والذي لا يذكر ربه مثل الحي والميت؛ أثر الذكر في طمأنينة الفؤاد."
      }
    ]
  },
  {
    "id": "series_fiqh_nafs_amjad_samir",
    "scholarId": "amjad_samir",
    "titleAr": "فقه النفس والتربية الإيمانية من أحداث الحديبية",
    "titleEn": "Self-Discipline & Spiritual Lessons from Hudaybiyyah",
    "sheikhAr": "الشيخ أمجد سمير",
    "sheikhEn": "Sheikh Amjad Samir",
    "category": "tazkiyah",
    "badgeAr": "فقه النفس • حلقتان",
    "badgeEn": "Inner Insight • 2 Episodes",
    "icon": "🌿",
    "descriptionAr": "دروس تطبيقية عميقة في استيعاب نوازع النفس وتطهير القلب والتربية الإيمانية المتدرجة من هدي السيرة والوحي.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "as_ep_01",
        "episodeNumber": 1,
        "titleAr": "مجلس 1: بنود صلح الحديبية وفقه النفوس والتسليم لله",
        "titleEn": "Treaty of Hudaybiyyah and Soul Submission",
        "durationFormatted": "33:15",
        "audioUrl": "https://archive.org/download/media-way2allah-_3780/bnwd_alslh_alhdebea_alshekh_ahmd_smer_h17_-_knaa_alnde_alfdaeaea.mp3",
        "summaryAr": "فهم أغوار النفس البشرية في مواجهة الشدائد والظنون، وجمال التسليم للوحي وعواقب الصبر المحمود."
      },
      {
        "id": "as_ep_02",
        "episodeNumber": 2,
        "titleAr": "مجلس 2: يا أبا جندل اصبر واحتسب - الصبر على مرارة الأقدار",
        "titleEn": "Patience in the Face of Trials",
        "durationFormatted": "29:40",
        "audioUrl": "https://archive.org/download/media-way2allah-_3791/ea_aba_gndl_asbr_wahtsb_alhdebea_alshekh_ahmd_smer_h18_-_knaa_alnde_alfdaeaea.mp3",
        "summaryAr": "مداواة جراح النفس وآلام الابتلاء، كيف يجعل الله من المحنة منحة، وسكينة القلب بحسن التوكل."
      }
    ]
  },
  {
    "id": "series_khutbah_kishk",
    "scholarId": "abdelhamid_kishk",
    "titleAr": "فرسان المنابر - خطب الجمعة في الشجاعة والبطولة",
    "titleEn": "Pulpit Lions - Friday Sermons of Courage",
    "sheikhAr": "الشيخ عبد الحميد كشك (رحمه الله)",
    "sheikhEn": "Sheikh Abdelhamid Kishk",
    "category": "khutbah",
    "badgeAr": "خطب تاريخية • 4 حلقات",
    "badgeEn": "Historic Sermons • 4 Episodes",
    "icon": "🦁",
    "descriptionAr": "خطب تاريخية مدوية تهز المشاعر وتبعث الشجاعة والأنفة الإيمانية في الدفاع عن الحق والمبدأ.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "ak_ep_01",
        "episodeNumber": 1,
        "titleAr": "خطبة 1: شجاعة علي بن أبي طالب وبطولة الصحابة الكرام",
        "titleEn": "Courage of Ali ibn Abi Talib and the Companions",
        "durationFormatted": "41:20",
        "audioUrl": "https://archive.org/download/Keshik_uP_bY_mUSLEm/008_uP_bY_mUSLEm.Ettounssi.mp3",
        "summaryAr": "شجاعة الصحابة في اليرموك والقادسية وخيبر، ومواجهة الشدائد برأس مرفوع ويقين بالخالق."
      },
      {
        "id": "ak_ep_02",
        "episodeNumber": 2,
        "titleAr": "خطبة 2: الإمام أحمد بن حنبل وثبات أهل السنة كالجبال",
        "titleEn": "Imam Ahmad ibn Hanbal and Steadfastness",
        "durationFormatted": "38:50",
        "audioUrl": "https://archive.org/download/Keshik_uP_bY_mUSLEm/003_uP_bY_mUSLEm.Ettounssi.mp3",
        "summaryAr": "محنة خلق القرآن وصبر إمام أهل السنة أحمد بن حنبل تحت السياط دفاعاً عن الشريعة والوحي."
      },
      {
        "id": "ak_ep_03",
        "episodeNumber": 3,
        "titleAr": "خطبة 3: فضل قيام الليل وعظمة التبتل في الأسحار",
        "titleEn": "Virtues of Night Prayer and Solitude with Allah",
        "durationFormatted": "36:15",
        "audioUrl": "https://archive.org/download/Keshik_uP_bY_mUSLEm/004_uP_bY_mUSLEm.Ettounssi.mp3",
        "summaryAr": "شرف المؤمن قيامه بالليل وعزه استغناؤه عن الناس؛ أسرار المناجاة والدموع الخاشعة."
      },
      {
        "id": "ak_ep_04",
        "episodeNumber": 4,
        "titleAr": "خطبة 4: حقوق الوالدين وبرهم ومفتاح الجنان",
        "titleEn": "Honoring Parents: The Key to Paradise",
        "durationFormatted": "44:10",
        "audioUrl": "https://archive.org/download/Keshik_uP_bY_mUSLEm/002_uP_bY_mUSLEm.Ettounssi.mp3",
        "summaryAr": "وقضى ربك ألا تعبدوا إلا إياه وبالوالدين إحساناً؛ عظمة البر وأثره في التوفيق وسعة الرزق."
      }
    ]
  },
  {
    "id": "series_khutbah_khaled_rashed",
    "scholarId": "khaled_rashed",
    "titleAr": "صرخة نذير - مواعظ التوبة وعلو الهمة والرجوع لله",
    "titleEn": "Awakening Call - Repentance & High Zeal",
    "sheikhAr": "الشيخ خالد الراشد (فك الله أسره)",
    "sheikhEn": "Sheikh Khaled Al-Rashed",
    "category": "khutbah",
    "badgeAr": "مواعظ مبكية • 4 حلقات",
    "badgeEn": "Moving Exhortations • 4 Episodes",
    "icon": "⚡",
    "descriptionAr": "كلمات قوية مبكية تقتحم شغاف القلب، توقظ الغافل وتجدد العهد مع الله بالصدق والعمل الصالح.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "kr_ep_01",
        "episodeNumber": 1,
        "titleAr": "خطبة 1: الصلاة تشتكي - عظمة الوقوف بين يدي الله",
        "titleEn": "The Cry of the Prayer: Standing Before Allah",
        "durationFormatted": "37:25",
        "audioUrl": "https://archive.org/download/way2sona_20160319_1746/1-asalat.mp3",
        "summaryAr": "الصلاة عمود الدين وأول ما يحاسب عليه العبد؛ نداء مدوٍ لكل من فرط في صلاته أو تهاون فيها."
      },
      {
        "id": "kr_ep_02",
        "episodeNumber": 2,
        "titleAr": "خطبة 2: قوافل العائدين - الرجوع الصادق إلى الله",
        "titleEn": "Caravans of the Returning: Sincere Repentance",
        "durationFormatted": "42:15",
        "audioUrl": "https://archive.org/download/way2sona_20160319_1746/1-qawafela3aiedeen.mp3",
        "summaryAr": "قصص ومواعظ مبكية لأبطال أقبلوا على التوبة بدموع الندم ووجدوا حلاوة الطاعة والقرب من الله."
      },
      {
        "id": "kr_ep_03",
        "episodeNumber": 3,
        "titleAr": "خطبة 3: الثبات على الحق في زمن الفتن والمغريات",
        "titleEn": "Firmness on the Truth Amidst Temptations",
        "durationFormatted": "35:40",
        "audioUrl": "https://archive.org/download/way2sona_20160319_1746/1-al-thabat.mp3",
        "summaryAr": "يا مقلب القلوب ثبت قلبي على دينك؛ قواعد الثبات في زمن الغربة والشهوات والشبهات."
      },
      {
        "id": "kr_ep_04",
        "episodeNumber": 4,
        "titleAr": "خطبة 4: قبل الندم - اغتنام الشباب والصحة قبل الفوات",
        "titleEn": "Before Regret: Seizing Youth and Good Health",
        "durationFormatted": "33:50",
        "audioUrl": "https://archive.org/download/way2sona_20160319_1746/1-qableanadam.mp3",
        "summaryAr": "وصية شاحذة للهمم تحث على ترك الكسل والتسويف، وبناء النفس والعمل للآخرة قبل فوات الأوان."
      }
    ]
  },
  {
    "id": "series_tafseer_tarefe",
    "scholarId": "abdulaziz_tarefe",
    "titleAr": "معالم في العقيدة واليقين والتوكل",
    "titleEn": "Principles of Creed, Certainty & Reliance",
    "sheikhAr": "الشيخ عبد العزيز الطريفي (فك الله أسره)",
    "sheikhEn": "Sheikh Abdul Aziz Al-Tarefe",
    "category": "mindset",
    "badgeAr": "عقيدة وتأصيل • 3 حلقات",
    "badgeEn": "Creed & Foundation • 3 Episodes",
    "icon": "🌟",
    "descriptionAr": "تأصيل منهجي متين يرسخ قواعد التوحيد الصافي واليقين بحكمة الله، واستمداد العون منه وحده.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "at_ep_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: معالم اعتقاد السلف في التوحيد والرسالة (عقيدة الرازيين ١)",
        "titleEn": "The Creed of the Early Muslims in Monotheism (Part 1)",
        "durationFormatted": "55:10",
        "audioUrl": "https://archive.org/download/3azamitAllah/abo-hatem-3akedah-masr-1.mp3",
        "summaryAr": "بيان أسس العقيدة السلفية النقية في الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر."
      },
      {
        "id": "at_ep_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الإيمان بالقدر وحكمة الله في خلقه وأمره (عقيدة الرازيين ٢)",
        "titleEn": "Faith in Divine Decree and Divine Wisdom (Part 2)",
        "durationFormatted": "74:45",
        "audioUrl": "https://archive.org/download/3azamitAllah/abo-hatem-3akedah-masr-2.mp3",
        "summaryAr": "كيف يثمر الإيمان بالقدر شجاعة في النفس وسكينة عند المصائب، وترك الجزع والاعتراض."
      },
      {
        "id": "at_ep_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: استعن بالله ولا تعجز - مفتاح القوة والعزيمة",
        "titleEn": "Seek Allah’s Help and Do Not Falter",
        "durationFormatted": "31:50",
        "audioUrl": "https://archive.org/download/3azamitAllah/ista3in-billah-jordan.mp3",
        "summaryAr": "شرح وصية النبي ﷺ الجامعة؛ التحرر من العجز والكسل، وبذل الأسباب مع صدق التوكل."
      }
    ]
  },
  {
    "id": "series_raqaiq_quran_sakran",
    "scholarId": "ibrahim_sakran",
    "titleAr": "رقائق القرآن ومسلكيات علو الهمة",
    "titleEn": "Quranic Softeners & High Aspiration",
    "sheikhAr": "الشيخ إبراهيم السكران (فك الله أسره)",
    "sheikhEn": "Sheikh Ibrahim Al-Sakran",
    "category": "mindset",
    "badgeAr": "رقائق وهمة • 3 حلقات",
    "badgeEn": "Inspirational • 3 Episodes",
    "icon": "💎",
    "descriptionAr": "تأملات فريدة في سطوة الوحي، حراسة الوقت من التشتت الرقمي، وكسر قيود الفتور وبناء الشخصية المؤمنة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "is_ep_01",
        "episodeNumber": 1,
        "titleAr": "الحلقة 1: القرآن والتربية - كيف يصنع الوحي النفوس العظيمة؟",
        "titleEn": "The Quran and Soul Cultivation",
        "durationFormatted": "38:20",
        "audioUrl": "https://archive.org/download/Mo1440abo3mr/%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%88%D8%A7%D9%84%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9%20-%20%D8%AF.%D8%A5%D8%A8%D8%B1%D8%A7%D9%87%D9%8A%D9%85%20%D8%A7%D9%84%D8%B3%D9%83%D8%B1%D8%A7%D9%86.mp3",
        "summaryAr": "أثر معايشة القرآن وتدبر آياته في تربية الإرادة وصقل الشخصية وتجاوز المغريات."
      },
      {
        "id": "is_ep_02",
        "episodeNumber": 2,
        "titleAr": "الحلقة 2: كيف السبيل للفرار من الفتن في هذا الزمان؟",
        "titleEn": "How to Flee from Tribulations in Modern Times",
        "durationFormatted": "35:45",
        "audioUrl": "https://archive.org/download/Mo1440abo3mr/%D9%83%D9%8A%D9%81%20%D8%A7%D9%84%D8%B3%D8%A8%D9%8A%D9%84%20%D9%84%D9%84%D9%81%D8%B1%D8%A7%D8%B1%20%D9%85%D9%86%20%D8%A7%D9%84%D9%81%D8%AA%D9%86%20%D9%81%D9%8A%20%D9%87%D8%B0%D8%A7%20%D8%A7%D9%84%D8%B2%D9%85%D8%A7%D9%86%D8%A5%D8%A8%D8%B1%D8%A7%D9%87%D9%8A%D9%85%20%D8%A7%D9%84%D8%B3%D9%83%D8%B1%D8%A7%D9%86.mp3",
        "summaryAr": "بصائر قرآنية ونبوية في النجاة من أمواج الشبهات والشهوات وصيانة الإيمان في زمن الغربة."
      },
      {
        "id": "is_ep_03",
        "episodeNumber": 3,
        "titleAr": "الحلقة 3: أولا يرون أنهم يفتنون في كل عام مرة أو مرتين - الاعتبار بالأقدار",
        "titleEn": "Taking Heed from Life Trials and Ups and Downs",
        "durationFormatted": "42:10",
        "audioUrl": "https://archive.org/download/Mo1440abo3mr/%D8%AC%D8%A7%D9%85%D8%B9%20%D8%A7%D9%84%D9%88%D8%A7%D8%A8%D9%84%20-%20%D9%85%D8%AD%D8%A7%D8%B6%D8%B1%D8%A9%20%D8%A8%D8%B9%D9%86%D9%88%D8%A7%D9%86%20%D8%A3%D9%88%D9%84%D8%A7%20%D9%8A%D8%B1%D9%88%D9%86%20%D8%A3%D9%86%D9%87%D9%85%20%D9%8A%D9%81%D8%AA%D9%86%D9%88%D9%86%20%D9%81%D9%8A%20%D9%83%D9%84%20%D8%B9%D8%A7%D9%85%20%D9%85%D8%B1%D8%A9%20%D8%A3%D9%88%20%D9%85%D8%B1%D8%AA%D9%8A%D9%86%20%D9%84%D9%84%D8%B4%D9%8A%D8%AE%20%D8%A5%D8%A8%D8%B1%D8%A7%D9%87%D9%8A%D9%85%20%D8%A7%D9%84%D8%B3%D9%83%D8%B1%D8%A7%D9%86.mp3",
        "summaryAr": "تفسير سنن الابتلاء والتمحيص، وكيف يستيقظ القلب المؤمن من غفلته ليتدارك أيامه وأهدافه."
      }
    ]
  },
  {
    "id": "series_tadabbur_abdelmonem",
    "scholarId": "ahmed_abdelmonem",
    "titleAr": "برنامج هدى للناس وتدبر سور القرآن العظيم",
    "titleEn": "Guidance for Mankind - Quranic Contemplation",
    "sheikhAr": "د. أحمد عبد المنعم",
    "sheikhEn": "Dr. Ahmed Abdelmonem",
    "category": "tafseer",
    "badgeAr": "هدى للناس • 4 حلقات",
    "badgeEn": "Quran Tafsir • 4 Episodes",
    "icon": "📖",
    "descriptionAr": "مجالس إيمانية من برنامج هدى للناس لتبسيط القرآن لهداية القلوب وتدبر سور الفاتحة والحجرات وق.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "adm_ep_01",
        "episodeNumber": 1,
        "titleAr": "مجلس 1: فكرة برنامج هدى للناس وتبسيط القرآن لهداية القلوب",
        "titleEn": "Introduction to Guidance for Mankind & Contemplating the Quran",
        "durationFormatted": "12:15",
        "audioUrl": "https://archive.org/download/islampodcst-UCDlHNz7RAK0vAl5eIKNxrjg-PLx8eSI7UgsiFNFbZ6BlxZjqpGxSvM0Aq_/001%20%D9%81%D9%83%D8%B1%D8%A9%20%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC%20%D9%87%D8%AF%D9%89%20%D9%84%D9%84%D9%86%D8%A7%D8%B3%20%EF%BD%9C%20%D8%AA%D8%A8%D8%B3%D9%8A%D8%B7%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%84%D9%87%D8%AF%D8%A7%D9%8A%D8%A9%20%D8%A7%D9%84%D9%86%D8%A7%D8%B3%20%EF%BD%9C%20%D8%AF.%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "كيف نتجاوز التلاوة العابرة إلى التلقي والعمل، ومقاصد سور القرآن في إصلاح النفس والواقع."
      },
      {
        "id": "adm_ep_02",
        "episodeNumber": 2,
        "titleAr": "مجلس 2: تفسير وتدبر سورة الفاتحة - أعظم سور القرآن",
        "titleEn": "Tafsir and Contemplation of Surah Al-Fatihah",
        "durationFormatted": "34:20",
        "audioUrl": "https://archive.org/download/islampodcst-UCDlHNz7RAK0vAl5eIKNxrjg-PLx8eSI7UgsiFNFbZ6BlxZjqpGxSvM0Aq_/002%20%D8%AA%D9%81%D8%B3%D9%8A%D8%B1%20%D8%B3%D9%88%D8%B1%D8%A9%20%D8%A7%D9%84%D9%81%D8%A7%D8%AA%D8%AD%D8%A9%20%EF%BD%9C%20%D9%87%D8%AF%D9%89%20%D9%84%D9%84%D9%86%D8%A7%D8%B3%20%EF%BD%9C%20%D8%AF.%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "أسرار أم الكتاب ومنازل إياك نعبد وإياك نستعين وسبيل المهتدين."
      },
      {
        "id": "adm_ep_03",
        "episodeNumber": 3,
        "titleAr": "مجلس 3: تفسير سورة الحجرات - دستور الأخلاق وبناء المجتمع",
        "titleEn": "Tafsir of Surah Al-Hujurat: Ethics & Community",
        "durationFormatted": "31:45",
        "audioUrl": "https://archive.org/download/islampodcst-UCDlHNz7RAK0vAl5eIKNxrjg-PLx8eSI7UgsiFNFbZ6BlxZjqpGxSvM0Aq_/003%20%D8%AA%D9%81%D8%B3%D9%8A%D8%B1%20%D8%B3%D9%88%D8%B1%D8%A9%20%D8%A7%D9%84%D8%AD%D8%AC%D8%B1%D8%A7%D8%AA%20%281%29%20%EF%BD%9C%20%D9%87%D8%AF%D9%89%20%D9%84%D9%84%D9%86%D8%A7%D8%B3%20%EF%BD%9C%20%D8%AF.%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "توقير الوحي، التثبت من الأخبار، وحفظ الأخوة الإيمانية من الظنون والغيبة."
      },
      {
        "id": "adm_ep_04",
        "episodeNumber": 4,
        "titleAr": "مجلس 4: تفسير سورة ق - إيقاظ القلوب واستحضار الآخرة",
        "titleEn": "Tafsir of Surah Qaf: Awakening the Heart",
        "durationFormatted": "33:15",
        "audioUrl": "https://archive.org/download/islampodcst-UCDlHNz7RAK0vAl5eIKNxrjg-PLx8eSI7UgsiFNFbZ6BlxZjqpGxSvM0Aq_/005%20%D8%AA%D9%81%D8%B3%D9%8A%D8%B1%20%D8%B3%D9%88%D8%B1%D8%A9%20%D9%82%20%281%29%20%EF%BD%9C%20%D8%AA%D8%AE%D8%A7%D8%B7%D8%A8%20%D9%88%D8%AA%D8%AD%D8%A7%D8%B5%D8%B1%20%D8%A7%D9%84%D9%85%D8%B9%D8%B1%D8%B6%D9%8A%D9%86%20%D8%AD%D8%AA%D9%89%20%D9%8A%D8%AA%D9%88%D8%A8%D9%88%D8%A7%20%EF%BD%9C%20%D9%87%D8%AF%D9%89%20%D9%84%D9%84%D9%86%D8%A7%D8%B3%20%EF%BD%9C%20%D8%AF%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "فذكر بالقرآن من يخاف وعيد؛ كيف تخاطب سورة ق القلوب حتى تنيب إلى ربها."
      }
    ]
  },
  {
    "id": "series_rehlat_yaqeen_qunaibi",
    "scholarId": "eyad_qunaibi",
    "titleAr": "سلسلة فن حسن الظن بالله وبناء اليقين الإيماني",
    "titleEn": "The Art of Good Trust in Allah & Certainty",
    "sheikhAr": "د. إياد قنيبي",
    "sheikhEn": "Dr. Eyad Qunaibi",
    "category": "mindset",
    "badgeAr": "يقين وتوكل • 4 حلقات",
    "badgeEn": "Certainty & Trust • 4 Episodes",
    "icon": "🔬",
    "descriptionAr": "سلسلة إيمانية عميقة تملأ القلب يقيناً بحكمة الله ورحمته، وتداوي القلق والاكتئاب بحسن التوكل على الخالق.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "yq_ep_01",
        "episodeNumber": 1,
        "titleAr": "الحلقة 1: مقدمة فن حسن الظن بالله وثمراته في حياة المؤمن",
        "titleEn": "Introduction to the Art of Trusting Allah",
        "durationFormatted": "18:30",
        "audioUrl": "https://archive.org/download/hosnzan/1-%20%D9%85%D9%82%D8%AF%D9%85%D8%A9.mp3",
        "summaryAr": "تأسيس عبادة حسن الظن بالله، وكيف تغير نظرة المسلم للابتلاءات والأقدار."
      },
      {
        "id": "yq_ep_02",
        "episodeNumber": 2,
        "titleAr": "الحلقة 2: ابنِ حبك لله على أسس سليمة وتعرف على الودود جل جلاله",
        "titleEn": "Building Love of Allah on Sound Foundations",
        "durationFormatted": "21:40",
        "audioUrl": "https://archive.org/download/hosnzan/5-%20%D8%A7%D8%A8%D9%86%20%D8%AD%D8%A8%D9%83%20%D9%84%D9%84%D9%87%20%D8%B9%D9%84%D9%89%20%D8%A3%D8%B3%D8%B3%20%D8%B3%D9%84%D9%8A%D9%85%D8%A9.mp3",
        "summaryAr": "مشاهد تودد الله لعباده بالنعم واللطف الخفي، وكيف يستجيب القلب بالمحبة والطاعة."
      },
      {
        "id": "yq_ep_03",
        "episodeNumber": 3,
        "titleAr": "الحلقة 3: استعن بالله المعين ولا تخف من عقبات الطريق",
        "titleEn": "Seek Help from Allah the Helper and Do Not Fear",
        "durationFormatted": "26:20",
        "audioUrl": "https://archive.org/download/hosnzan/12-%20%D8%A7%D8%B3%D8%AA%D8%B9%D9%86%20%D8%A8%D8%A7%D9%84%D9%84%D9%87%20%D8%A7%D9%84%D9%85%D8%B9%D9%8A%D9%86%20%D9%88%D9%84%D8%A7%20%D8%AA%D8%AE%D9%81.mp3",
        "summaryAr": "استمداد القوة والعون من الله وحده في مواجهة المصاعب وتحديات الحياة."
      },
      {
        "id": "yq_ep_04",
        "episodeNumber": 4,
        "titleAr": "الحلقة 4: لا تكتئب وحول الشعور السلبي إلى قوة دافعة",
        "titleEn": "Overcoming Despair & Turning Pain into Positive Drive",
        "durationFormatted": "25:50",
        "audioUrl": "https://archive.org/download/hosnzan/14-%20%D9%84%D8%A7%20%D8%AA%D9%83%D8%AA%D8%A6%D8%A8%21.mp3",
        "summaryAr": "العلاج الإيماني والنفسي للهموم والأحزان وتحويلها إلى وقود للعمل الصالح والإنجاز."
      }
    ]
  },
  {
    "id": "series_himma_samir",
    "scholarId": "samir_moustafa",
    "titleAr": "همة تناطح السحاب وعلاج الفتور والتسويف",
    "titleEn": "Lofty Zeal & Overcoming Procrastination",
    "sheikhAr": "الشيخ سمير مصطفى (فك الله أسره)",
    "sheikhEn": "Sheikh Samir Mustafa",
    "category": "mindset",
    "badgeAr": "شحنة همة • 3 حلقات",
    "badgeEn": "High Energy • 3 Episodes",
    "icon": "🔥",
    "descriptionAr": "جرعات إيمانية نارية تبدد الكسل، وتغرس في النفس حرقة الإنجاز واغتنام العمر قبل فوات الأوان.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sm_ep_01",
        "episodeNumber": 1,
        "titleAr": "مجلس 1: اصبروا وصابروا ورابطوا - ثبات القلب وعلو الهمة",
        "titleEn": "Persevere and Endure: Steadfastness & High Zeal",
        "durationFormatted": "34:20",
        "audioUrl": "https://archive.org/download/khotab_minbriah-sh_samir-mostafa/01_Smir_Mostafa_khotab_esbero(%D8%A7%D8%B5%D8%A8%D8%B1%D9%88%D8%A7%20%D9%88%D8%B5%D8%A7%D8%A8%D9%80%D8%B1%D9%88%D8%A7).mp3",
        "summaryAr": "همة تناطح السحاب في الصبر والمصابرة والمرابطة على ثغور الطاعة والعمل."
      },
      {
        "id": "sm_ep_02",
        "episodeNumber": 2,
        "titleAr": "مجلس 2: أهمية دراسة السيرة النبوية في بناء الذات والهمة",
        "titleEn": "Importance of Studying Seerah for Character Building",
        "durationFormatted": "29:50",
        "audioUrl": "https://archive.org/download/islami-888/%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%D8%A9%20%D8%A7%D9%84%D9%86%D8%A8%D9%88%D9%8A%D8%A9%20(01-%20%D8%A3%D9%87%D9%85%D9%8A%D8%A9%20%D8%AF%D8%B1%D8%A7%D8%B3%D8%A9%20%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%D8%A9)%20%D9%84%D9%81%D8%B6%D9%8A%D9%84%D8%A9%20%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%20%D8%B3%D9%85%D9%8A%D8%B1%20%D9%85%D8%B5%D8%B7%D9%81%D9%89.mp3",
        "summaryAr": "كيف نقتبس من سيرة النبي ﷺ وأصحابه قوة العزيمة ومقارعة الصعاب."
      },
      {
        "id": "sm_ep_03",
        "episodeNumber": 3,
        "titleAr": "مجلس 3: شرح حديث من هم بحسنة - عظمة فضل الله ومبادرة العمل",
        "titleEn": "Hadith of Good Intentions & Urgency in Righteous Deeds",
        "durationFormatted": "37:10",
        "audioUrl": "https://archive.org/download/mn-hm-samir/mn-hm-samir.mp3",
        "summaryAr": "شرح حديث من هم بحسنة فلم يعملها كتبها الله عنده حسنة كاملة؛ كيف تحول النوايا إلى أجور عظيمة."
      }
    ]
  },
  {
    "id": "series_waay_ayman_abdelrahim",
    "scholarId": "ayman_abdelrahim",
    "titleAr": "تأسيس وعي المسلم المعاصر وفك الارتهان الحضاري",
    "titleEn": "Foundations of Modern Muslim Awareness",
    "sheikhAr": "م. أيمن عبد الرحيم (فك الله أسره)",
    "sheikhEn": "Eng. Ayman Abdelrahim",
    "category": "mindset",
    "badgeAr": "وعي وفكر • 5 حلقات",
    "badgeEn": "Intellectual Foundation • 5 Episodes",
    "icon": "🧭",
    "descriptionAr": "خارطة طريق شاملة لتفكيك عقدة الهزيمة النفسية، واستعادة المركزية الإسلامية في فهم الواقع وبناء المستقبل.",
    "totalEpisodes": 5,
    "episodes": [
      {
        "id": "aa_ep_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: مدخل تأسيس وعي المسلم وفك الارتهان الحضاري",
        "titleEn": "Deconstructing Cultural Dependency",
        "durationFormatted": "48:30",
        "audioUrl": "https://archive.org/download/TASES-2017/01-Tasees-2017.mp3",
        "summaryAr": "تفكيك عقدة النقص الحضارية، وموقع المسلم المعاصر من الهيمنة الفكرية الغربية، وضرورة التحرر المعرفي."
      },
      {
        "id": "aa_ep_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: طبيعة الصراع ومنظومة القيم الإسلامية",
        "titleEn": "The Nature of Conflict and Islamic Values",
        "durationFormatted": "52:10",
        "audioUrl": "https://archive.org/download/TASES-2017/02-Tasees-2017.mp3",
        "summaryAr": "كيف يصوغ الوحي نظرة المسلم للكون والإنسان والحياة، ومقاصد الشريعة في بناء العمران."
      },
      {
        "id": "aa_ep_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: سنن التاريخ والاجتماع البشري في ضوء الوحي",
        "titleEn": "Societal Laws of History in Revelation",
        "durationFormatted": "46:40",
        "audioUrl": "https://archive.org/download/TASES-2017/03-Tasees-2017.mp3",
        "summaryAr": "سنن الصعود والسقوط للأمم، ولماذا تتكرر الأخطاء عبر العصور، والوعي بالسنن الكونية."
      },
      {
        "id": "aa_ep_04",
        "episodeNumber": 4,
        "titleAr": "المحاضرة 4: بناء الشخصية المتزنة ومواجهة الاستلاب",
        "titleEn": "Balanced Character Building",
        "durationFormatted": "54:15",
        "audioUrl": "https://archive.org/download/TASES-2017/04-Tasees-2017.mp3",
        "summaryAr": "التوازن بين العقل والقلب والسلوك، وحراسة الهوية في زمن السيولة الثقافية والشبهات."
      },
      {
        "id": "aa_ep_05",
        "episodeNumber": 5,
        "titleAr": "المحاضرة 5: معالم النهوض ومسؤولية الفرد المسلم",
        "titleEn": "Roadmap for Revival and Individual Duty",
        "durationFormatted": "49:50",
        "audioUrl": "https://archive.org/download/TASES-2017/05-Tasees-2017.mp3",
        "summaryAr": "خارطة طريق عملية لكل شاب: التعلم الذاتي، التزكية، ونفع الأمة بالعمل المتقن."
      }
    ]
  },
  {
    "id": "series_barahin_haitham_talaat",
    "scholarId": "haitham_talaat",
    "titleAr": "سموم الإلحاد وبراهين اليقين والمناعة العقدية",
    "titleEn": "Poisons of Atheism & Proofs of Certainty",
    "sheikhAr": "د. هيثم طلعت",
    "sheikhEn": "Dr. Haitham Talaat",
    "category": "mindset",
    "badgeAr": "براهين وردود • حلقتان",
    "badgeEn": "Apologetics & Truth • 2 Episodes",
    "icon": "🛡️",
    "descriptionAr": "أدلة عقلية رصينة تدحض الفلسفات الإلحادية والمادية، وتكشف سموم الشبهات بلغة علمية معاصرة.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "ht_ep_01",
        "episodeNumber": 1,
        "titleAr": "مجلس 1: كيف يسمم الإلحاد القيمة والأخلاق؟ وبراهين الفطرة",
        "titleEn": "How Atheism Poisons Value and Morality",
        "durationFormatted": "18:40",
        "audioUrl": "https://archive.org/download/20200703_20200703_1945/%D9%82%D9%86%D8%A7%D8%A9_%D8%A7%D9%84%D8%A8%D9%8A%D9%86%D8%A9_%D9%84%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D8%A7%D9%84%D8%A3%D8%AF%D9%8A%D8%A7%D9%86_%D9%88%D8%A7%D9%84%D8%B1%D8%AF_%D8%B9%D9%84%D9%89_%D8%A7%D9%84%D8%B4%D8%A8%D9%87%D8%A7%D8%AA_%D8%A7%D9%84%D8%A5%D9%84%D8%AD%D8%A7%D8%AF_%D9%8A%D8%B3%D9%85%D9%85_%D8%A7%D9%84%D9%82%D9%8A%D9%85%D8%A9.mp3",
        "summaryAr": "قواعد التلقي الواعي، مناعة المسلم العقدية، والرد على الفلسفات المادية بإحكام العقل وبصيرة الفطرة."
      },
      {
        "id": "ht_ep_02",
        "episodeNumber": 2,
        "titleAr": "مجلس 2: كيف يسمم الإلحاد العلوم؟ والبرهان العلمي على الخلق",
        "titleEn": "How Atheism Distorts Science & Proofs of Creation",
        "durationFormatted": "21:15",
        "audioUrl": "https://archive.org/download/20200703_20200703_1945/%D9%82%D9%86%D8%A7%D8%A9_%D8%A7%D9%84%D8%A8%D9%8A%D9%86%D8%A9_%D9%84%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D8%A7%D9%84%D8%A3%D8%AF%D9%8A%D8%A7%D9%86_%D9%88%D8%A7%D9%84%D8%B1%D8%AF_%D8%B9%D9%84%D9%89_%D8%A7%D9%84%D8%B4%D8%A8%D9%87%D8%A7%D8%AA_%D8%A7%D9%84%D8%A5%D9%84%D8%AD%D8%A7%D8%AF_%D9%8A%D8%B3%D9%85%D9%85_%D8%A7%D9%84%D8%B9%D9%84%D9%88%D9%85.mp3",
        "summaryAr": "تفكيك خرافة التعارض بين العلم والإيمان، وكيف يقود العلم التجريبي الصحيح إلى تعظيم الخالق."
      }
    ]
  },
  {
    "id": "series_takween_ojairi",
    "scholarId": "abdullah_ojairi",
    "titleAr": "معالم في اليقين الفكري وحراسة الهوية الإسلامية",
    "titleEn": "Milestones in Intellectual Certainty",
    "sheikhAr": "الشيخ د. عبد الله العجيري",
    "sheikhEn": "Dr. Abdullah Al-Ojairi",
    "category": "mindset",
    "badgeAr": "تأصيل استدلالي • 3 حلقات",
    "badgeEn": "Rational Foundations • 3 Episodes",
    "icon": "🏛️",
    "descriptionAr": "دروس تأصيلية فريدة من مركز تكوين؛ صناعة عقلية استدلالية رصينة قادرة على محاورة الشبهات وتثبيت اليقين.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "ao_ep_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: معالم صناعة الاستدلال العقدي والتأصيل",
        "titleEn": "Foundations of Islamic Epistemology & Evidence",
        "durationFormatted": "35:10",
        "audioUrl": "https://archive.org/download/sina3at_istidlal/01.mp3",
        "summaryAr": "كيف يبني المسلم عقليته الاستدلالية المتينة، الجمع بين النص الشرعي الصريح والبرهان العقلي السليم."
      },
      {
        "id": "ao_ep_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: حجية السنة النبوية والرد على منكريها",
        "titleEn": "Authority of Sunnah and Refutation of Doubts",
        "durationFormatted": "38:20",
        "audioUrl": "https://archive.org/download/sina3at_istidlal/02.mp3",
        "summaryAr": "مكانة السنة في التشريع، مناهج المحدثين الصارمة في التوثيق، وتفنيد شبهات القرآنيين والمشككين."
      },
      {
        "id": "ao_ep_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: أصول ترسيخ اليقين ومواجهة الشبهات المعاصرة",
        "titleEn": "Principles of Firm Conviction in Digital Age",
        "durationFormatted": "33:45",
        "audioUrl": "https://archive.org/download/sina3at_istidlal/03.mp3",
        "summaryAr": "معالم الثبات الفكري في عصر الانفتاح الرقمي، وصناعة المحاور المسلم القادر على نصرة دينه بالحجة."
      }
    ]
  },
  {
    "id": "series_siyra_badr_meshari",
    "scholarId": "badr_meshari",
    "titleAr": "السيرة النبوية وقصص الأنبياء - معالم العزة والتمكين",
    "titleEn": "Prophetic Seerah & Stories of the Prophets",
    "sheikhAr": "الشيخ بدر المشاري",
    "sheikhEn": "Sheikh Badr Al-Meshari",
    "category": "siyra",
    "badgeAr": "سيرة وعبر • 3 حلقات",
    "badgeEn": "Seerah & Lessons • 3 Episodes",
    "icon": "🐎",
    "descriptionAr": "أسلوب قصصي ملحمي يأخذك لقلب الأحداث؛ سيرة آدم وموسى ويوسف عليهم السلام وثبات أهل الحق في وجه الشدائد.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "bm_ep_01",
        "episodeNumber": 1,
        "titleAr": "الحلقة 1: قصة نبي الله آدم عليه السلام وبداية الخلق والاستخلاف",
        "titleEn": "Story of Prophet Adam and the Beginning of Creation",
        "durationFormatted": "42:30",
        "audioUrl": "https://archive.org/download/20251028_20251028_0842/%D8%A2%D8%AF%D9%85%20%D8%B9%D9%84%D9%8A%D9%87%20%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85.mp3",
        "summaryAr": "سرد قصصي مؤثر لخلق آدم عليه السلام، عداوة إبليس، ودرس التوبة والإنابة إلى الله عز وجل."
      },
      {
        "id": "bm_ep_02",
        "episodeNumber": 2,
        "titleAr": "الحلقة 2: قصة كليم الله موسى عليه السلام ومواجهة الطغيان",
        "titleEn": "Story of Prophet Moses: Confronting Tyranny",
        "durationFormatted": "54:15",
        "audioUrl": "https://archive.org/download/20240428_20240428_0452/%D9%82%D8%B5%D8%B5%20%20%D9%85%D9%88%D8%B3%D9%89%20%D8%B9%D9%84%D9%8A%D9%87%20%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%20%D8%A8%D8%AF%D8%B1%20%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D8%B1%D9%8A%20-%20%D9%85%D8%AA%D8%B9%D8%A8%20%D8%B9%D9%84%D9%8A%20%D8%A7%D9%84%D8%B5%D8%A8%D9%8A%D8%AD%D9%8A.mp3",
        "summaryAr": "نشأة موسى عليه السلام، يقينه التام بوعد الله: «كلا إن معي ربي سيهدين»، وهلاك فرعون وجنوده."
      },
      {
        "id": "bm_ep_03",
        "episodeNumber": 3,
        "titleAr": "الحلقة 3: أحسن القصص - قصة الصديق يوسف عليه السلام",
        "titleEn": "The Best of Stories: Prophet Yusuf (Joseph)",
        "durationFormatted": "48:50",
        "audioUrl": "https://archive.org/download/256-kbps-ss.shabakngy.com_202404/%D8%A3%D8%AD%D8%B3%D9%86%20%D8%A7%D9%84%D9%82%D8%B5%D8%B5_%20%D9%82%D8%B5%D8%A9%20%D9%8A%D9%88%D8%B3%D9%81%20%D8%B9%D9%84%D9%8A%D9%87%20%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20_%20%D8%A8%D8%AF%D8%B1%20%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D8%B1%D9%8A%20%28256%20%20kbps%29%20%28ss.shabakngy.com%29.mp3",
        "summaryAr": "الصبر على البلاء، العفة في الشباب، وكيف يرفع الله عباده الصادقين من غيابت الجب إلى التمكين."
      }
    ]
  },
  {
    "id": "series_sahabah_haj",
    "scholarId": "mohamed_sayed_haj",
    "titleAr": "سير الفرسان وبطولات الصحابة والتابعين",
    "titleEn": "Biographies of the Companions & Champions",
    "sheikhAr": "الشيخ محمد سيد حاج (رحمه الله)",
    "sheikhEn": "Sheikh Muhammad Sayed Haj",
    "category": "siyra",
    "badgeAr": "سير الأبطال • 3 حلقات",
    "badgeEn": "Heroic Biographies • 3 Episodes",
    "icon": "⚔️",
    "descriptionAr": "رحلة حية مع أبطال الإسلام؛ بطولات عمر الفاروق، سعد بن عبادة، وأبطال معركة القادسية في ميادين العزة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sh_ep_01",
        "episodeNumber": 1,
        "titleAr": "الحلقة 1: سيرة الفاروق عمر بن الخطاب رضي الله عنه ومعالم العدل والعزة",
        "titleEn": "Al-Faruq Umar ibn Al-Khattab: Justice and Honor",
        "durationFormatted": "47:50",
        "audioUrl": "https://archive.org/download/moh_said_2/13.mp3",
        "summaryAr": "دروس عظيمة من سيرة الفاروق عمر رضي الله عنه، هيبته في الحق، وعدله الذي ملأ الآفاق."
      },
      {
        "id": "sh_ep_02",
        "episodeNumber": 2,
        "titleAr": "الحلقة 2: سيرة الصحابي الجليل سعد بن عبادة رضي الله عنه وبذل الأنصار",
        "titleEn": "Sa'd ibn Ubadah: Generosity & Heroism of the Ansar",
        "durationFormatted": "29:15",
        "audioUrl": "https://archive.org/download/Mohamed-Sayed-Hajj/%D8%B3%D8%B9%D8%AF%20%D8%A8%D9%86%20%D8%B9%D8%A8%D8%A7%D8%AF%D8%A9.mp3",
        "summaryAr": "شجاعة سيد الخزرج سعد بن عبادة رضي الله عنه، كرمه الفياض، ونصرته لرسول الله ﷺ."
      },
      {
        "id": "sh_ep_03",
        "episodeNumber": 3,
        "titleAr": "الحلقة 3: ملحمة معركة القادسية وبطولات فرسان الصحابة",
        "titleEn": "Battle of Al-Qadisiyyah & Heroism of the Companions",
        "durationFormatted": "45:20",
        "audioUrl": "https://archive.org/download/Mohamed-Sayed-Hajj/%D9%85%D8%B9%D8%B1%D9%83%D8%A9%20%D8%A7%D9%84%D9%82%D8%A7%D8%AF%D8%B3%D9%8A%D8%A9.mp3",
        "summaryAr": "فداء الصحابة تحت راية سعد بن أبي وقاص، عزة ربعي بن عامر، وكسر عرش كسرى بنور التوحيد."
      }
    ]
  },
  {
    "id": "series_bin_baz_aqidah",
    "scholarId": "bin_baz",
    "titleAr": "نور على الدرب - أصول التوحيد وفقه الإيمان الخالص",
    "titleEn": "Light on the Path - Pure Monotheism & Faith",
    "sheikhAr": "الشيخ عبد العزيز بن باز (رحمه الله)",
    "sheikhEn": "Sheikh Abdul Aziz ibn Baz",
    "category": "fiqh",
    "badgeAr": "توحيد وسنة • 3 حلقات",
    "badgeEn": "Creed & Sunnah • 3 Episodes",
    "icon": "📚",
    "descriptionAr": "شرح مبارك لأصول التوحيد الخالص، والتحذير من الشرك والبدع، والإجابة عن فتاوى العقيدة والعبادة بوضوح السنة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "bb_ep_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: حقيقة التوحيد وأقسامه الثلاثة في الكتاب والسنة",
        "titleEn": "The Reality and Categories of Monotheism",
        "durationFormatted": "51:50",
        "audioUrl": "https://archive.org/download/Ibn_Baz_uP_bY_mUSLEm/009-_uP_bY_mUSLEm.mp3",
        "summaryAr": "بيان توحيد الربوبية والألوهية والأسماء والصفات، ولماذا خلق الله الثقلين، وعظمة كلمة الإخلاص."
      },
      {
        "id": "bb_ep_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الصلاة وعظم شأنها في الإسلام والتحذير من التهاون فيها",
        "titleEn": "Importance of Congregational Prayer",
        "durationFormatted": "32:20",
        "audioUrl": "https://archive.org/download/Ibn_Baz_uP_bY_mUSLEm/013-_up_by_muslem.mp3",
        "summaryAr": "الصلاة عمود الإسلام وعهد الإيمان؛ أدلتها ووجوب أدائها في المساجد مع المسلمين في أوقاتها."
      },
      {
        "id": "bb_ep_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: السنة ومكانتها في الإسلام والحذر من المحدثات",
        "titleEn": "Adhering to the Sunnah and Early Predecessors",
        "durationFormatted": "55:10",
        "audioUrl": "https://archive.org/download/Ibn_Baz_uP_bY_mUSLEm/012-_up_by_muslem.mp3",
        "summaryAr": "عليكم بسنتي وسنة الخلفاء الراشدين؛ ضبط العمل بميزان الاتباع وترك الابتداع في الدين."
      }
    ]
  },
  {
    "id": "series_albani_sunnah",
    "scholarId": "albani",
    "titleAr": "معالم التصفية والتربية وإحياء هدي النبي ﷺ",
    "titleEn": "Tasfiyah & Tarbiyah - Reviving the Authentic Sunnah",
    "sheikhAr": "الشيخ محمد ناصر الدين الألباني (رحمه الله)",
    "sheikhEn": "Sheikh Muhammad Nasiruddin al-Albani",
    "category": "fiqh",
    "badgeAr": "حديث وسنة • 3 حلقات",
    "badgeEn": "Hadith & Fiqh • 3 Episodes",
    "icon": "🔍",
    "descriptionAr": "دروس تأصيلية في تنقية العقيدة والعبادة من الأحاديث الضعيفة والبدع، وتربية النفس على صريح هدي المصطفى ﷺ.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "al_ep_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: التوحيد أولاً ومنهاج التصفية والتربية",
        "titleEn": "Tawheed First: Purification and Cultivation",
        "durationFormatted": "51:50",
        "audioUrl": "https://archive.org/download/Ashrita_motanawi3a_sheikh_Al-Albany___uploaded_by_Abu-Ahmad-S-A/001.albany_tawheed1.mp3",
        "summaryAr": "كيف تعود الأمة لعزتها؟ التصفية بنفي الدخيل عن الإسلام، والتربية بتنشئة الجيل على الدين الصافي."
      },
      {
        "id": "al_ep_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: تجريد الاتباع لرسول الله ﷺ ونبذ التعصب المذهبي",
        "titleEn": "Sincere Following of Revelation vs Fanaticism",
        "durationFormatted": "63:40",
        "audioUrl": "https://archive.org/download/Ashrita_motanawi3a_sheikh_Al-Albany___uploaded_by_Abu-Ahmad-S-A/031.albany_ettebaa_a_1.mp3",
        "summaryAr": "أقوال الأئمة الأربعة في وجوب تقديم الحديث الصحيح على أقوال الرجال، وروح التفقه الدقيق في الدليل."
      },
      {
        "id": "al_ep_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: من فقه الصلاة وصفة صلاة النبي ﷺ الصحيحة",
        "titleEn": "The Prophet's Prayer Described",
        "durationFormatted": "60:15",
        "audioUrl": "https://archive.org/download/Ashrita_motanawi3a_sheikh_Al-Albany___uploaded_by_Abu-Ahmad-S-A/005.albany_minfiqhsalah1.mp3",
        "summaryAr": "صلوا كما رأيتموني أصلي؛ تفاصيل حركات الصلاة وسكناتها بالروايات الصحيحة لتعظيم الخشوع."
      }
    ]
  },
  {
    "id": "series_safar_hawali_aqidah",
    "scholarId": "safar_hawali",
    "titleAr": "شرح العقيدة الطحاوية ومعالم النهوض الإيماني",
    "titleEn": "Commentary on Tahawiyyah & Muslim Revival",
    "sheikhAr": "الشيخ سفر الحوالي (فك الله أسره)",
    "sheikhEn": "Sheikh Safar Al-Hawali",
    "category": "history",
    "badgeAr": "عقيدة وتاريخ • 3 حلقات",
    "badgeEn": "Creed & History • 3 Episodes",
    "icon": "🏛️",
    "descriptionAr": "تأصيل منهجي يربط بين نصوص العقيدة وواقع الأمة وتاريخ الصراع الحضاري، وشحذ الهمم لنصرة الحق.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "shw_ep_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: مدخل في دراسة العقيدة السلفية وأسباب الانحراف",
        "titleEn": "Fundamentals of Orthodox Creed and Causes of Deviation",
        "durationFormatted": "48:15",
        "audioUrl": "https://archive.org/download/006_20240819/001.mp3",
        "summaryAr": "أهمية فهم التوحيد كما فهمه الصحابة والتابعون، وأثر الفلسفات الدخيلة في تشتيت عقلية المسلم."
      },
      {
        "id": "shw_ep_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: حقيقة الإيمان بين قول اللسان وعمل الجوارح",
        "titleEn": "The Nature of Faith: Belief, Words & Actions",
        "durationFormatted": "45:30",
        "audioUrl": "https://archive.org/download/006_20240819/002.mp3",
        "summaryAr": "الإيمان قول وعمل يزيد بالطاعة وينقص بالمعصية؛ نقد الإرجاء والتأكيد على روح المبادرة والجهاد والعمل."
      },
      {
        "id": "shw_ep_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: علو الهمة وعزة المسلم برسالته أمام الحضارات",
        "titleEn": "High Zeal and Honor in Islamic Heritage",
        "durationFormatted": "50:20",
        "audioUrl": "https://archive.org/download/006_20240819/003.mp3",
        "summaryAr": "كيف تبنى الأمة القوية الشجاعة، والتخلص من التبعية الفكرية باستمداد النور من الوحي الإلهي."
      }
    ]
  },
  {
    "id": "series_shinqitee_tazkiyah",
    "scholarId": "shinqitee",
    "titleAr": "فقه الصلاة ورقائق القلوب والتعلق بالله",
    "titleEn": "Fiqh of Prayer, Solitude & Heart Softeners",
    "sheikhAr": "الشيخ محمد بن محمد المختار الشنقيطي",
    "sheikhEn": "Sheikh Muhammad Al-Mukhtar Al-Shinqitee",
    "category": "tazkiyah",
    "badgeAr": "رقائق وخشوع • 3 حلقات",
    "badgeEn": "Heart Devotion • 3 Episodes",
    "icon": "💎",
    "descriptionAr": "مواعظ إيمانية تفيض بالخشية ومحبة الله؛ زاد الإيمان، كيف ترق قلوبنا، والنجاة من المعاصي.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "shq_ep_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: زاد الإيمان وعظمة الوقوف بين يدي الرحمن",
        "titleEn": "Provision of Faith & Standing Before the Creator",
        "durationFormatted": "61:20",
        "audioUrl": "https://archive.org/download/Shnghiti_by_hassan/022-zad_aleman.mp3",
        "summaryAr": "قد أفلح المؤمنون الذين هم في صلاتهم خاشعون؛ التزود بالتقوى واستحضار جلال الرب."
      },
      {
        "id": "shq_ep_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: كيف ترق قلوبنا؟ أسباب حياة القلب والخشوع",
        "titleEn": "How Our Hearts Soften: Causes of Spiritual Life",
        "durationFormatted": "58:15",
        "audioUrl": "https://archive.org/download/Shnghiti_by_hassan/024_MMMShnqitti_KyfaTerquAlQalob.mp3",
        "summaryAr": "أقرب ما يكون العبد من ربه وهو ساجد؛ لذة انكسار القلب للحي القيوم ومواطن رقة القلوب."
      },
      {
        "id": "shq_ep_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: النجاة من المعاصي وحسن الظن بالله وملازمة الاستغفار",
        "titleEn": "Deliverance from Sins & Good Expectation of Allah",
        "durationFormatted": "54:40",
        "audioUrl": "https://archive.org/download/Shnghiti_by_hassan/013elngaamnelmasee.mp3",
        "summaryAr": "سعة رحمة الله للتائبين، كيف يزيل الذكر قسوة القلب ويملأ الصدر سكينة وأمناً ورضا."
      }
    ]
  },
  {
    "id": "series_ahmed_arabi_mindset",
    "scholarId": "ahmed_arabi",
    "titleAr": "سلسلة تذوق العبادات وبناء الشخصية المسلمة",
    "titleEn": "Tasting the Sweetness of Worship & Character Building",
    "sheikhAr": "الشيخ أحمد العربي",
    "sheikhEn": "Sheikh Ahmed Al-Arabi",
    "category": "mindset",
    "badgeAr": "تذوق العبادات • 3 حلقات",
    "badgeEn": "Mindset & Worship • 3 Episodes",
    "icon": "✨",
    "descriptionAr": "توجيهات إيمانية وسلوكية عملية للشباب في تذوق حلاوة الصلاة وبناء الشخصية المسلمة والهمة العالية.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "ara_ep_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: تذوق العبادات (1) - كيف تتحول الصلاة إلى قرة عين؟",
        "titleEn": "Tasting the Sweetness of Worship: Prayer",
        "durationFormatted": "63:20",
        "audioUrl": "https://archive.org/download/36-1-.-63-aocldy-xo/%D9%81%D8%A7%D9%87%D9%85%2036%20_%20%D8%B3%D9%84%D8%B3%D9%84%D8%A9%20%D8%AA%D8%B0%D9%88%D9%82%20%D8%A7%D9%84%D8%B9%D8%A8%D8%A7%D8%AF%D8%A7%D8%AA%20-%20%281%29%20%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9%20_%20%D9%85%D8%B9%20%D8%AF.%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%20%5B63_AOCldyXo%5D.mp3",
        "summaryAr": "حوار عميق في استشعار لذة الوقوف بين يدي الله وكسر فتور العادة في أداء الصلوات."
      },
      {
        "id": "ara_ep_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: نشأة الهمة وطلب العلم - من سيرة الإمام الشافعي (1)",
        "titleEn": "Developing High Zeal in Seeking Knowledge (Part 1)",
        "durationFormatted": "41:45",
        "audioUrl": "https://archive.org/download/khaled_alridwany_3_20150411/1.mp3",
        "summaryAr": "كيف يصنع الصبر والرحلة في طلب العلم شخصية المسلم القوية المؤثرة في أمتها."
      },
      {
        "id": "ara_ep_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: فقه النصرة وبناء الذات العلمية - من سيرة الإمام الشافعي (2)",
        "titleEn": "Supporting the Sunnah & Building Intellectual Grit (Part 2)",
        "durationFormatted": "44:10",
        "audioUrl": "https://archive.org/download/khaled_alridwany_3_20150411/2.mp3",
        "summaryAr": "تجريد القصد لله عز وجل والجمع بين الفقه والأدب والعمل الصالح."
      }
    ]
  },
  {
    "id": "series_abdelmonem_tazkiyah",
    "scholarId": "ahmed_abdelmonem",
    "titleAr": "أصول الانحراف وتصحيح مسار الالتزام وتزكية القلوب",
    "titleEn": "Correcting the Path of Commitment & Soul Purification",
    "sheikhAr": "د. أحمد عبد المنعم",
    "sheikhEn": "Dr. Ahmed Abdelmonem",
    "category": "tazkiyah",
    "badgeAr": "تزكية ورقائق • 3 حلقات",
    "badgeEn": "Spiritual • 3 Episodes",
    "icon": "🌱",
    "descriptionAr": "معالجة آفات التدين الشكلي، استعادة الثقة بالوحي، وتعظيم الله جل جلاله في الباطن والظاهر.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "abm_tz_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: مقدمة - استعادة الثقة بالله واليقين بمنهج الوحي",
        "titleEn": "Restoring Trust and Certainty in Divine Guidance",
        "durationFormatted": "38:40",
        "audioUrl": "https://archive.org/download/05_20200814_20200814_0611/01-%20%D9%85%D9%82%D8%AF%D9%85%D8%A9%20-%20%D8%A7%D8%B3%D8%AA%D8%B9%D8%A7%D8%AF%D8%A9%20%D8%A7%D9%84%D8%AB%D9%82%D8%A9.mp3",
        "summaryAr": "كيف يستعيد المسلم ثقته بربه ودينه في مواجهة موجات التشكيك والفتور."
      },
      {
        "id": "abm_tz_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: ما قدروا الله حق قدره - تعظيم الخالق في القلوب",
        "titleEn": "Venerating Allah as He Deserves to Be Venerated",
        "durationFormatted": "42:15",
        "audioUrl": "https://archive.org/download/05_20200814_20200814_0611/04-%20%D9%85%D8%A7%20%D9%82%D8%AF%D8%B1%D9%88%D8%A7%20%D8%A7%D9%84%D9%84%D9%87%20%D8%AD%D9%82%20%D9%82%D8%AF%D8%B1%D9%87.mp3",
        "summaryAr": "أصل كل انحراف أو فتور هو ضعف تعظيم الله في القلب؛ كيف نحيي هيبة الله ومحبته."
      },
      {
        "id": "abm_tz_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: تصحيح تصورات الالتزام وعلاج خواء الجوف",
        "titleEn": "Correcting Misconceptions of Religious Commitment",
        "durationFormatted": "36:50",
        "audioUrl": "https://archive.org/download/05_20200814_20200814_0611/06-%20%D8%AA%D8%B5%D8%AD%D9%8A%D8%AD%20%D8%AA%D8%B5%D9%88%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A7%D9%84%D8%AA%D8%B2%D8%A7%D9%85.mp3",
        "summaryAr": "الانتقال من الالتزام المظهري الأجوف إلى عمق العبودية وصدق المعاملة مع الله."
      }
    ]
  },
  {
    "id": "series_abdelmonem_baqarah",
    "scholarId": "ahmed_abdelmonem",
    "titleAr": "بصائر قرآنية في التفكير والبيئة الإيمانية والرجولة",
    "titleEn": "Quranic Insights on Logic, Faith Environment & Manhood",
    "sheikhAr": "د. أحمد عبد المنعم",
    "sheikhEn": "Dr. Ahmed Abdelmonem",
    "category": "tafseer",
    "badgeAr": "بصائر قرآنية • 3 حلقات",
    "badgeEn": "Quran Insights • 3 Episodes",
    "icon": "📖",
    "descriptionAr": "مجالس تربوية قرآنية في بناء التفكير السليم، التواجد في بيئة الإيمان، ومعاني الرجولة في كتاب الله.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "abm_bq_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: قواعد التفكير المنطقي السليم في ضوء الوحي",
        "titleEn": "Rules of Sound Logical Thinking in the Light of Revelation",
        "durationFormatted": "35:10",
        "audioUrl": "https://archive.org/download/islampodcst-UCCy0qwIz722Gi2MtjYlrQeg-PLnpYU8_AiEPc2iOrUi2wv8GHhKaCuHPJd/001_%D9%82%D9%88%D8%A7%D8%B9%D8%AF%20%D8%A7%D9%84%D8%AA%D9%81%D9%83%D9%8A%D8%B1%20%D8%A7%D9%84%D9%85%D9%86%D8%B7%D9%82%D9%8A%20%EF%BD%9C%20%D8%AF.%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "كيف يبني القرآن عقلية برهانية مستقيمة تزن الأمور بميزان الحق والهدى."
      },
      {
        "id": "abm_bq_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: أهمية التواجد في بيئة الإيمان والصحبة الصالحة",
        "titleEn": "Importance of Dwelling in an Environment of Faith",
        "durationFormatted": "34:00",
        "audioUrl": "https://archive.org/download/islampodcst-UCCy0qwIz722Gi2MtjYlrQeg-PLnpYU8_AiEPc2iOrUi2wv8GHhKaCuHPJd/002_%D8%A3%D9%87%D9%85%D9%8A%D8%A9%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%AC%D8%AF%20%D9%81%D9%8A%20%D8%A8%D9%8A%D8%A6%D8%A9%20%D8%A7%D9%84%D8%A5%D9%8A%D9%85%D8%A7%D9%86%20%EF%BD%9C%20%D8%AF.%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "واصبر نفسك مع الذين يدعون ربهم؛ أثر المحيط الإيماني في تثبيت القلب ومضاعفة الهمة."
      },
      {
        "id": "abm_bq_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: معاني الرجولة الحقيقية في القرآن الكريم",
        "titleEn": "True Meanings of Manhood in the Holy Quran",
        "durationFormatted": "41:30",
        "audioUrl": "https://archive.org/download/islampodcst-UCCy0qwIz722Gi2MtjYlrQeg-PLnpYU8_AiEPc2iOrUi2wv8GHhKaCuHPJd/004_%D9%85%D8%B9%D8%A7%D9%86%D9%8A%20%D8%A7%D9%84%D8%B1%D8%AC%D9%88%D9%84%D8%A9%20%D9%81%D9%8A%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%EF%BD%9C%20%D8%AF.%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "رجال صدقوا ما عاهدوا الله عليه؛ صفات القوة، الأمانة، والثبات على المبدأ في كتاب الله."
      }
    ]
  },
  {
    "id": "series_abdelmonem_yt_mana3a",
    "scholarId": "ahmed_abdelmonem",
    "titleAr": "اللياقة الإيمانية وضبط المشاعر على معايير الوحي",
    "titleEn": "Spiritual Fitness & Emotional Balance in Islam",
    "sheikhAr": "د. أحمد عبد المنعم",
    "sheikhEn": "Dr. Ahmed Abdelmonem",
    "category": "mindset",
    "badgeAr": "صوت نقي متواصل ⚡ • حلقتان",
    "badgeEn": "Direct Audio • 2 Episodes",
    "icon": "⚡",
    "descriptionAr": "سلسلة مركزة بالصوت النقي المباشر في بناء اللياقة الإيمانية للقلب وضبط المشاعر الإنسانية على المعايير الشرعية.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "abm_yt_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: اللياقة الإيمانية وكيف يستعيد القلب قوته وحيويته؟",
        "titleEn": "Spiritual Fitness & Restoring Heart Vitality",
        "durationFormatted": "37:40",
        "audioUrl": "https://archive.org/download/islampodcst-UCCy0qwIz722Gi2MtjYlrQeg-PLnpYU8_AiEPc2iOrUi2wv8GHhKaCuHPJd/008_%D8%A7%D9%84%D9%84%D9%8A%D8%A7%D9%82%D8%A9%20%D8%A7%D9%84%D8%A5%D9%8A%D9%85%D8%A7%D9%86%D9%8A%D8%A9%20%EF%BD%9C%20%D8%AE%D8%B7%D8%A8%D8%A9%20%EF%BD%9C%20%D8%AF.%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "كما يحتاج الجسد إلى تمرين مستمر، يحتاج القلب إلى لياقة إيمانية تعصمه من الانهيار عند الفتن."
      },
      {
        "id": "abm_yt_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: ضبط المشاعر الإنسانية على المعايير الشرعية",
        "titleEn": "Aligning Human Emotions with Divine Standards",
        "durationFormatted": "42:15",
        "audioUrl": "https://archive.org/download/islampodcst-UCCy0qwIz722Gi2MtjYlrQeg-PLnpYU8_AiEPc2iOrUi2wv8GHhKaCuHPJd/009_%D8%B6%D8%A8%D8%B7%20%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D8%B9%D8%B1%20%D8%A7%D9%84%D8%A5%D9%86%D8%B3%D8%A7%D9%86%D9%8A%D8%A9%20%D8%B9%D9%84%D9%89%20%D8%A7%D9%84%D9%85%D8%B9%D8%A7%D9%8A%D9%8A%D8%B1%20%D8%A7%D9%84%D8%B4%D8%B1%D8%B9%D9%8A%D8%A9%20%EF%BD%9C%20%D8%AE%D8%B7%D8%A8%D8%A9%20%EF%BD%9C%20%D8%AF.%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "تهذيب الغضب والحزن والفرح والخوف لتكون كلها محكومة بهدي القرآن والسنة."
      }
    ]
  },
  {
    "id": "series_ayman_tareekh",
    "scholarId": "ayman_abdelrahim",
    "titleAr": "تاريخ الأمة الإسلامية: قراءة في السنن والتحولات الكبرى",
    "titleEn": "Islamic History: Laws of Civilizations & Major Shifts",
    "sheikhAr": "م. أيمن عبد الرحيم (فك الله أسره)",
    "sheikhEn": "Eng. Ayman Abdelrahim",
    "category": "history",
    "badgeAr": "تاريخ الأمة • 4 محاضرات",
    "badgeEn": "History • 4 Lectures",
    "icon": "🏛️",
    "descriptionAr": "استكمال محاضرات تأسيس الوعي التاريخي والحضاري، قراءة التحولات الكبرى، واستخلاص السنن الربانية.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "aym_th_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: قراءة سنن التاريخ والتحولات الحضارية (المجلس السادس)",
        "titleEn": "Reading Historical Laws & Civilizational Shifts",
        "durationFormatted": "56:30",
        "audioUrl": "https://archive.org/download/TASES-2017/06-Tasees-2017.mp3",
        "summaryAr": "التاريخ ليس ركاماً من الأخبار؛ بل سنن ربانية ماضية تحكم صعود الحضارات وسقوطها."
      },
      {
        "id": "aym_th_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: بنية المجتمع المسلم ومؤسسات الأمة التاريخية (المجلس السابع)",
        "titleEn": "Structure of Muslim Society & Historic Institutions",
        "durationFormatted": "58:10",
        "audioUrl": "https://archive.org/download/TASES-2017/07-Tasees-2017.mp3",
        "summaryAr": "كيف حفظت الأوقاف والعلماء والأمة استقلالية المجتمع المسلم عبر القرون."
      },
      {
        "id": "aym_th_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: الصدمة الحضارية الحديثة وجذور التغريب (المجلس الثامن)",
        "titleEn": "Modern Civilizational Shock & Roots of Westernization",
        "durationFormatted": "52:45",
        "audioUrl": "https://archive.org/download/TASES-2017/08-Tasees-2017.mp3",
        "summaryAr": "تحليل دقيق لكيفية تغلغل الاستعمار الثقافي وتفكيك منظومات التعليم والقضاء."
      },
      {
        "id": "aym_th_04",
        "episodeNumber": 4,
        "titleAr": "المحاضرة 4: آفاق النهوض واستعادة الفاعلية الحضارية (المجلس التاسع)",
        "titleEn": "Horizons of Revival & Reclaiming Civilizational Agency",
        "durationFormatted": "59:20",
        "audioUrl": "https://archive.org/download/TASES-2017/09-Tasees-2017.mp3",
        "summaryAr": "مسالك استعادة السيادة المعرفية والحضارية وبناء الإنسان المسلم الفاعل."
      }
    ]
  },
  {
    "id": "series_ayman_psychology",
    "scholarId": "ayman_abdelrahim",
    "titleAr": "سيكولوجية الجماهير وبناء العقل النقدي المستقل",
    "titleEn": "Crowd Psychology & Independent Critical Thinking",
    "sheikhAr": "م. أيمن عبد الرحيم (فك الله أسره)",
    "sheikhEn": "Eng. Ayman Abdelrahim",
    "category": "mindset",
    "badgeAr": "بناء الوعي • 3 محاضرات",
    "badgeEn": "Critical Mind • 3 Lectures",
    "icon": "🧠",
    "descriptionAr": "تفكيك آليات التلاعب بالرأي العام وسيكولوجية الحشود، وبناء المسلم صاحب البصيرة المستقلة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "aym_ps_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: كيف تُصنع الآراء وتُوجه عقول الجماهير؟",
        "titleEn": "Manufacturing Public Opinion",
        "durationFormatted": "48:15",
        "audioUrl": "https://archive.org/download/NAFS-2017/01-NAFS.mp3",
        "summaryAr": "دراسة نقدية لكتاب سيكولوجية الجماهير لغوستاف لوبون ومقارنته بالهدي القرآني في التبين والتثبت."
      },
      {
        "id": "aym_ps_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: التحرر من قطيع الرأي والتبعية الساذجة",
        "titleEn": "Liberation from Herd Mentality",
        "durationFormatted": "51:40",
        "audioUrl": "https://archive.org/download/NAFS-2017/02-NAFS.mp3",
        "summaryAr": "لا تكن إمعة إن أحسن الناس أحسنت وإن أساؤوا أسأت؛ توطين النفس على الحق والعدل."
      },
      {
        "id": "aym_ps_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: تفكيك الخطاب الدعائي ووسائل الإقناع الخفية",
        "titleEn": "Deconstructing Propaganda Tactics",
        "durationFormatted": "49:00",
        "audioUrl": "https://archive.org/download/NAFS-2017/03-NAFS.mp3",
        "summaryAr": "رصد الحيل البلاغية والمغالطات المنطقية التي تُستخدم لتزييف وعي الشعوب والمجتمعات."
      }
    ]
  },
  {
    "id": "series_ayman_zawaj_bayt_muslim",
    "scholarId": "ayman_abdelrahim",
    "titleAr": "دورة تأسيس البيت المسلم وفقه الزواج والعلاقات",
    "titleEn": "Building the Muslim Home & Fiqh of Marriage",
    "sheikhAr": "م. أيمن عبد الرحيم (فك الله أسره)",
    "sheikhEn": "Eng. Ayman Abdelrahim",
    "category": "mindset",
    "badgeAr": "تأسيس البيت المسلم • 8 محاضرات",
    "badgeEn": "Marriage & Home • 8 Lectures",
    "icon": "🏡",
    "descriptionAr": "الدورة الشهيرة المتميزة في فلسفة الزواج في الإسلام، معايير اختيار الشريك، فقه الخطبة، توزيع الأدوار، وحل الخلافات الزوجية لبناء بيت صالح مستقر.",
    "totalEpisodes": 8,
    "episodes": [
      {
        "id": "aym_zw_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: فلسفة الزواج في الإسلام ومفهوم السكن والمودة والرحمة",
        "titleEn": "Philosophy of Marriage & Divine Compassion",
        "durationFormatted": "50:57",
        "audioUrl": "https://archive.org/download/03_20191120_20191120/01.mp3",
        "summaryAr": "لماذا شرع الله الزواج؟ مفهوم السكن الروحي والنفسي وعمارة الأرض بالنسل الصالح والتحصين من الفتن."
      },
      {
        "id": "aym_zw_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: معايير اختيار شريك الحياة: تنكح المرأة لأربع وحقيقة الدين والخلق",
        "titleEn": "Criteria for Choosing a Spouse: Deen & Character",
        "durationFormatted": "103:04",
        "audioUrl": "https://archive.org/download/03_20191120_20191120/02.mp3",
        "summaryAr": "فاظفر بذات الدين تربت يداك؛ إذا أتاكم من ترضون دينه وخلقه؛ كيف تختبر الأثر العملي للتدين والخلق قبل الزواج."
      },
      {
        "id": "aym_zw_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: فقه الخطبة والرؤية الشرعية وضوابط التعارف قبل العقد",
        "titleEn": "Engagement Fiqh & Legitimate Courtship Boundaries",
        "durationFormatted": "142:15",
        "audioUrl": "https://archive.org/download/03_20191120_20191120/03.mp3",
        "summaryAr": "الرؤية الشرعية، الأسئلة الجوهرية لمعرفة نمط الشخصية والتوافق الفكري والتربوي دون تجاوز الحدود الشرعية."
      },
      {
        "id": "aym_zw_04",
        "episodeNumber": 4,
        "titleAr": "المحاضرة 4: بناء البيت المسلم وتوزيع الأدوار والمسؤوليات بين الزوجين",
        "titleEn": "Building the Muslim Home: Roles & Responsibilities",
        "durationFormatted": "135:48",
        "audioUrl": "https://archive.org/download/03_20191120_20191120/04.mp3",
        "summaryAr": "مفهوم القوامة العادلة، رعاية البيت، الحقوق والواجبات المتبادلة وتجنب صراع الأدوار المستورد."
      },
      {
        "id": "aym_zw_05",
        "episodeNumber": 5,
        "titleAr": "المحاضرة 5: إدارة الخلافات الزوجية وفن حل المشكلات وتجنب الطلاق",
        "titleEn": "Conflict Management & Problem Solving in Marriage",
        "durationFormatted": "109:42",
        "audioUrl": "https://archive.org/download/03_20191120_20191120/05.mp3",
        "summaryAr": "كيف تحاصر الخلاف في مهده؟ الصبر على الطباع المختلفة، فضيلة التغافل، وحفظ أسرار البيوت."
      },
      {
        "id": "aym_zw_06",
        "episodeNumber": 6,
        "titleAr": "المحاضرة 6: تربية الأبناء وبناء المناعة الإيمانية والأخلاقية في البيت",
        "titleEn": "Parenting & Building Moral Immunity in Children",
        "durationFormatted": "106:36",
        "audioUrl": "https://archive.org/download/03_20191120_20191120/06.mp3",
        "summaryAr": "أصول التربية الإيمانية، القدوة الصامتة، حماية الأبناء من الانحرافات المعاصرة وبناء شخصية مسلمة قوية."
      },
      {
        "id": "aym_zw_07",
        "episodeNumber": 7,
        "titleAr": "المحاضرة 7: صيانة ميزانية الأسرة وفقه الاقتصاد المنزلي والقناعة",
        "titleEn": "Family Budget, Home Economics & Contentment",
        "durationFormatted": "103:36",
        "audioUrl": "https://archive.org/download/03_20191120_20191120/07.mp3",
        "summaryAr": "التدبير المالي في البيت المسلم، تجنب التبذير والديون، وبركة الرزق الحلال والتكافل الأسري."
      },
      {
        "id": "aym_zw_08",
        "episodeNumber": 8,
        "titleAr": "المحاضرة 8: حفظ ميثاق الزوجية وتوريث القيم للأجيال وصناعة الأثر",
        "titleEn": "Preserving the Marital Covenant & Transmitting Values",
        "durationFormatted": "130:16",
        "audioUrl": "https://archive.org/download/03_20191120_20191120/08.mp3",
        "summaryAr": "الميثاق الغليظ؛ كيف تصنع من بيتك محراباً للعلم والعبادة، وثمرة الاستقرار الأسري على نهضة الأمة."
      }
    ]
  },
  {
    "id": "series_amjad_tarbiyah",
    "scholarId": "amjad_samir",
    "titleAr": "وقفات تربوية وإيمانية من سيرة المصطفى ﷺ",
    "titleEn": "Spiritual & Educational Reflections from Seerah",
    "sheikhAr": "الشيخ أمجد سمير",
    "sheikhEn": "Sheikh Amjad Samir",
    "category": "tazkiyah",
    "badgeAr": "تربية إيمانية • حلقتان",
    "badgeEn": "Spiritual Tarbiyah • 2 Episodes",
    "icon": "🕊️",
    "descriptionAr": "وقفات تربوية عميقة مع فقه الابتلاء، التسليم لأمر الله، وتثبيت القلوب من أحداث السيرة النبوية.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "as_tb_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: فقه التسليم لله عند اشتداد الأزمات (بنود الحديبية)",
        "titleEn": "Submission to Allah Amidst Crises",
        "durationFormatted": "33:15",
        "audioUrl": "https://archive.org/download/media-way2allah-_3780/bnwd_alslh_alhdebea_alshekh_ahmd_smer_h17_-_knaa_alnde_alfdaeaea.mp3",
        "summaryAr": "كيف يتعامل المؤمن مع الأقدار التي يظهر في بدايتها العسر وفي باطنها الفتح المبين."
      },
      {
        "id": "as_tb_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الصبر والاحتساب عند الفتن (يا أبا جندل اصبر واحتسب)",
        "titleEn": "Patience and Seeking Reward in Tribulations",
        "durationFormatted": "29:40",
        "audioUrl": "https://archive.org/download/media-way2allah-_3791/ea_aba_gndl_asbr_wahtsb_alhdebea_alshekh_ahmd_smer_h18_-_knaa_alnde_alfdaeaea.mp3",
        "summaryAr": "تثبيت القلوب المبتلاة واليقين بأن الله جاعل للمتقين فرجاً ومخرجاً."
      }
    ]
  },
  {
    "id": "series_amjad_futur",
    "scholarId": "amjad_samir",
    "titleAr": "علاج الفتور وتثبيت القلب على الطاعة واليقين",
    "titleEn": "Overcoming Sloth & Steadfastness in Worship",
    "sheikhAr": "الشيخ أمجد سمير",
    "sheikhEn": "Sheikh Amjad Samir",
    "category": "mindset",
    "badgeAr": "ثبات القلب • حلقتان",
    "badgeEn": "Heart Steadfastness • 2 Episodes",
    "icon": "🌱",
    "descriptionAr": "معالجة فتور الهمة وضعف اليقين عند تأخر الفرج، وتقديم الدواء النبوي للاستمرار في الطاعة.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "as_ft_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: الدواء النبوي لثبات القلب عند تأخر الفرج",
        "titleEn": "Prophetic Remedy for Steadfastness When Relief Delays",
        "durationFormatted": "29:40",
        "audioUrl": "https://archive.org/download/media-way2allah-_3791/ea_aba_gndl_asbr_wahtsb_alhdebea_alshekh_ahmd_smer_h18_-_knaa_alnde_alfdaeaea.mp3",
        "summaryAr": "مغالبة اليأس والفتور واستحضار وعد الله الصادق لعباده الصابرين."
      },
      {
        "id": "as_ft_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: اتهام الرأي أمام الوحي والانقياد الكامل للشريعة",
        "titleEn": "Submitting Personal Opinion to Divine Revelation",
        "durationFormatted": "33:15",
        "audioUrl": "https://archive.org/download/media-way2allah-_3780/bnwd_alslh_alhdebea_alshekh_ahmd_smer_h17_-_knaa_alnde_alfdaeaea.mp3",
        "summaryAr": "كيف يورث التسليم للشرع طمأنينة في النفس وانشراحاً في الصدر."
      }
    ]
  },
  {
    "id": "series_arabi_rujoolah",
    "scholarId": "ahmed_arabi",
    "titleAr": "سيرة الإمام الشافعي ومعالم الرجولة والعلم والهمة",
    "titleEn": "Biography of Imam Al-Shafi'i & Milestones of Manhood",
    "sheikhAr": "الشيخ أحمد العربي",
    "sheikhEn": "Sheikh Ahmed Al-Arabi",
    "category": "mindset",
    "badgeAr": "سير الأئمة • 4 حلقات",
    "badgeEn": "Imams & Grit • 4 Episodes",
    "icon": "⚔️",
    "descriptionAr": "سرد ملهم لسيرة الإمام محمد بن إدريس الشافعي؛ فتوته، رحلته في طلب العلم، نصره للسنة، وورعه.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "ara_rj_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: نشأة الإمام الشافعي وهمته المبكرة في حفظ العلم واللغة",
        "titleEn": "Upbringing of Imam Al-Shafi'i & Early Zeal",
        "durationFormatted": "41:45",
        "audioUrl": "https://archive.org/download/khaled_alridwany_3_20150411/1.mp3",
        "summaryAr": "كيف صنعت الأم الصالحة والهمة العالية إماماً من أئمة المسلمين."
      },
      {
        "id": "ara_rj_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: رحلة الشافعي إلى الإمام مالك والجمع بين الفقه والحديث",
        "titleEn": "Al-Shafi'i's Journey to Imam Malik: Fiqh & Hadith",
        "durationFormatted": "44:10",
        "audioUrl": "https://archive.org/download/khaled_alridwany_3_20150411/2.mp3",
        "summaryAr": "أدب المتعلم مع شيخه، والجمع بين مدرسة الحجاز ومدرسة العراق."
      },
      {
        "id": "ara_rj_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: ناصر السنة وتأسيس علم أصول الفقه والرسالة",
        "titleEn": "Defender of Sunnah & Founding Usul Al-Fiqh",
        "durationFormatted": "43:20",
        "audioUrl": "https://archive.org/download/khaled_alridwany_3_20150411/3.mp3",
        "summaryAr": "مناظرات الشافعي العلمية، دفاعه عن حجية السنة، وتأليفه لكتاب الرسالة."
      },
      {
        "id": "ara_rj_04",
        "episodeNumber": 4,
        "titleAr": "الدرس 4: عبادة الإمام الشافعي، زهده، وحكمه الخالدة",
        "titleEn": "Worship, Asceticism & Timeless Wisdom of Al-Shafi'i",
        "durationFormatted": "45:50",
        "audioUrl": "https://archive.org/download/khaled_alridwany_3_20150411/4.mp3",
        "summaryAr": "تقسيم الشافعي لليله بين العلم والصلاة والنوم، ووصاياه الذهبية لطلاب الحق."
      }
    ]
  },
  {
    "id": "series_haitham_barahin",
    "scholarId": "haitham_talaat",
    "titleAr": "تحصين المتدينين والمثقفين من سموم الشبهات المعاصرة",
    "titleEn": "Fortifying Youth & Intellectuals Against Modern Doubts",
    "sheikhAr": "د. هيثم طلعت",
    "sheikhEn": "Dr. Haitham Talaat",
    "category": "mindset",
    "badgeAr": "حصن اليقين • 3 حلقات",
    "badgeEn": "Certainty Shield • 3 Episodes",
    "icon": "🛡️",
    "descriptionAr": "تشخيص دقيق لكيفية تسلل الشبهات إلى المتدينين والمثقفين والشعوب، وبناء الحصانة العقدية.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "ht_br_01",
        "episodeNumber": 1,
        "titleAr": "البرهان 1: كيف تستهدف الشبهات المتدينين؟ وسبل الوقاية",
        "titleEn": "How Doubts Target Practicing Believers & Prevention",
        "durationFormatted": "19:20",
        "audioUrl": "https://archive.org/download/20200703_20200703_1945/%D9%82%D9%86%D8%A7%D8%A9_%D8%A7%D9%84%D8%A8%D9%8A%D9%86%D8%A9_%D9%84%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D8%A7%D9%84%D8%A3%D8%AF%D9%8A%D8%A7%D9%86_%D9%88%D8%A7%D9%84%D8%B1%D8%AF_%D8%B9%D9%84%D9%89_%D8%A7%D9%84%D8%B4%D8%A8%D9%87%D8%A7%D8%AA_%D8%A7%D9%84%D8%A5%D9%84%D8%AD%D8%A7%D8%AF_%D9%8A%D8%B3%D9%85%D9%85_%D8%A7%D9%84%D9%85%D8%AA%D8%AF%D9%8A%D9%86%D9%8A%D9%86.mp3",
        "summaryAr": "خطورة التعرض للشبهات دون تأصيل علمي، وكيف يحفظ المسلم قلبه بالوحي."
      },
      {
        "id": "ht_br_02",
        "episodeNumber": 2,
        "titleAr": "البرهان 2: كيف يسمم الإلحاد عقول المثقفين؟ ونقد التبعية الفكرية",
        "titleEn": "Deconstructing Materialist Influence on Intellectuals",
        "durationFormatted": "21:10",
        "audioUrl": "https://archive.org/download/20200703_20200703_1945/%D9%82%D9%86%D8%A7%D8%A9_%D8%A7%D9%84%D8%A8%D9%8A%D9%86%D8%A9_%D9%84%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D8%A7%D9%84%D8%A3%D8%AF%D9%8A%D8%A7%D9%86_%D9%88%D8%A7%D9%84%D8%B1%D8%AF_%D8%B9%D9%84%D9%89_%D8%A7%D9%84%D8%B4%D8%A8%D9%87%D8%A7%D8%AA_%D8%A7%D9%84%D8%A5%D9%84%D8%AD%D8%A7%D8%AF_%D9%8A%D8%B3%D9%85%D9%85_%D8%A7%D9%84%D9%85%D8%AB%D9%82%D9%81%D9%8A%D9%86.mp3",
        "summaryAr": "كشف المغالطات الفلسفية التي ينخدع بها بعض المثقفين، وعظمة المنهج المعرفي الإسلامي."
      },
      {
        "id": "ht_br_03",
        "episodeNumber": 3,
        "titleAr": "البرهان 3: كيف يدمر الإلحاد الشعوب والمجتمعات الإنسانية؟",
        "titleEn": "Impact of Materialism on Societies and Nations",
        "durationFormatted": "20:50",
        "audioUrl": "https://archive.org/download/20200703_20200703_1945/%D9%82%D9%86%D8%A7%D8%A9_%D8%A7%D9%84%D8%A8%D9%8A%D9%86%D8%A9_%D9%84%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D8%A7%D9%84%D8%A3%D8%AF%D9%8A%D8%A7%D9%86_%D9%88%D8%A7%D9%84%D8%B1%D8%AF_%D8%B9%D9%84%D9%89_%D8%A7%D9%84%D8%B4%D8%A8%D9%87%D8%A7%D8%AA_%D8%A7%D9%84%D8%A5%D9%84%D8%AD%D8%A7%D8%AF_%D9%8A%D8%B3%D9%85%D9%85_%D8%A7%D9%84%D8%B4%D8%B9%D9%88%D8%A8.mp3",
        "summaryAr": "الأثر التدميري لغياب الإيمان بالله واليوم الآخر على الأسرة والأخلاق والأمن المجتمعي."
      }
    ]
  },
  {
    "id": "series_haitham_yaqeen",
    "scholarId": "haitham_talaat",
    "titleAr": "نقد العدمية الإلحادية وبراهين الفطرة والعلم",
    "titleEn": "Critique of Nihilism & Proofs of Innate Nature",
    "sheikhAr": "د. هيثم طلعت",
    "sheikhEn": "Dr. Haitham Talaat",
    "category": "mindset",
    "badgeAr": "رد الإلحاد • 3 حلقات",
    "badgeEn": "Atheism Refuted • 3 Episodes",
    "icon": "🔬",
    "descriptionAr": "الرد على العدمية والمادية بالدلائل العلمية والفطرية وبيان كيف يناقض الإلحاد نفسه.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "ht_yq_01",
        "episodeNumber": 1,
        "titleAr": "الحلقة 1: كيف يسمم الإلحاد حياة الملحدين أنفسهم؟ وأزمة المعنى",
        "titleEn": "The Crisis of Meaning in Materialist Nihilism",
        "durationFormatted": "22:30",
        "audioUrl": "https://archive.org/download/20200703_20200703_1945/%D9%82%D9%86%D8%A7%D8%A9_%D8%A7%D9%84%D8%A8%D9%8A%D9%86%D8%A9_%D9%84%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D8%A7%D9%84%D8%A3%D8%AF%D9%8A%D8%A7%D9%86_%D9%88%D8%A7%D9%84%D8%B1%D8%AF_%D8%B9%D9%84%D9%89_%D8%A7%D9%84%D8%B4%D8%A8%D9%87%D8%A7%D8%AA_%D8%A7%D9%84%D8%A5%D9%84%D8%AD%D8%A7%D8%AF_%D9%8A%D8%B3%D9%85%D9%85_%D8%A7%D9%84%D9%85%D9%84%D8%AD%D8%AF%D9%8A%D9%86.mp3",
        "summaryAr": "الفراغ الوجودي والعدمية التي يقود إليها إنكار الخالق، وكيف يمنح الإيمان السكينة والمعنى."
      },
      {
        "id": "ht_yq_02",
        "episodeNumber": 2,
        "titleAr": "الحلقة 2: برهان العلوم التجريبية ودلالات التصميم في الكون",
        "titleEn": "Empirical Science & Signs of Cosmic Design",
        "durationFormatted": "21:15",
        "audioUrl": "https://archive.org/download/20200703_20200703_1945/%D9%82%D9%86%D8%A7%D8%A9_%D8%A7%D9%84%D8%A8%D9%8A%D9%86%D8%A9_%D9%84%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D8%A7%D9%84%D8%A3%D8%AF%D9%8A%D8%A7%D9%86_%D9%88%D8%A7%D9%84%D8%B1%D8%AF_%D8%B9%D9%84%D9%89_%D8%A7%D9%84%D8%B4%D8%A8%D9%87%D8%A7%D8%AA_%D8%A7%D9%84%D8%A5%D9%84%D8%AD%D8%A7%D8%AF_%D9%8A%D8%B3%D9%85%D9%85_%D8%A7%D9%84%D8%B9%D9%84%D9%88%D9%85.mp3",
        "summaryAr": "المعلومة والنظام لا ينشآن من العدم؛ دلالات العلم على العلم الأزلي المحيط."
      },
      {
        "id": "ht_yq_03",
        "episodeNumber": 3,
        "titleAr": "الحلقة 3: الأخلاق الموضوعية والضمير الإنساني الفطري",
        "titleEn": "Objective Morality & Innate Conscience",
        "durationFormatted": "18:40",
        "audioUrl": "https://archive.org/download/20200703_20200703_1945/%D9%82%D9%86%D8%A7%D8%A9_%D8%A7%D9%84%D8%A8%D9%8A%D9%86%D8%A9_%D9%84%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D8%A7%D9%84%D8%A3%D8%AF%D9%8A%D8%A7%D9%86_%D9%88%D8%A7%D9%84%D8%B1%D8%AF_%D8%B9%D9%84%D9%89_%D8%A7%D9%84%D8%B4%D8%A8%D9%87%D8%A7%D8%AA_%D8%A7%D9%84%D8%A5%D9%84%D8%AD%D8%A7%D8%AF_%D9%8A%D8%B3%D9%85%D9%85_%D8%A7%D9%84%D9%82%D9%8A%D9%85%D8%A9.mp3",
        "summaryAr": "لماذا يميز الإنسان بين الخير والشر؟ انهيار التفسير المادي للأخلاق والضمير."
      }
    ]
  },
  {
    "id": "series_ojairi_sunnah",
    "scholarId": "abdullah_ojairi",
    "titleAr": "حجية السنة النبوية ومكانتها في التشريع وتفنيد الشبهات",
    "titleEn": "Authority of the Sunnah in Islamic Law",
    "sheikhAr": "الشيخ د. عبد الله العجيري",
    "sheikhEn": "Dr. Abdullah Al-Ojairi",
    "category": "mindset",
    "badgeAr": "حجية السنة • 3 محاضرات",
    "badgeEn": "Sunnah Authority • 3 Lectures",
    "icon": "⚡",
    "descriptionAr": "تأصيل معرفي محكم لاستحالة فهم الإسلام والقرآن دون السنة النبوية الشريفة وتفكيك دعاوى منكريها.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "oj_sn_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: ضرورة السنة لفهم القرآن واستحالة الاستغناء عنها",
        "titleEn": "Why Sunnah is Essential to Understand the Quran",
        "durationFormatted": "46:15",
        "audioUrl": "https://archive.org/download/sina3at_istidlal/01.mp3",
        "summaryAr": "كيف نصلي ونزكي ونحج دون تفصيل السنة؟ الرد الصارم على شبهات القرآنيين المعاصرين."
      },
      {
        "id": "oj_sn_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: علم مصطلح الحديث والمنهج النقدي الفريد للمحدثين",
        "titleEn": "Critical Methodology of Hadith Scholars",
        "durationFormatted": "49:30",
        "audioUrl": "https://archive.org/download/sina3at_istidlal/02.mp3",
        "summaryAr": "توثيق الأسانيد والرواة؛ أعظم منهج تاريخي لتوثيق النصوص عرفته البشرية قاطبة."
      },
      {
        "id": "oj_sn_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: تفكيك شبهات الطاعنين في صحيح الإمام البخاري",
        "titleEn": "Deconstructing Attacks on Sahih Bukhari",
        "durationFormatted": "51:00",
        "audioUrl": "https://archive.org/download/sina3at_istidlal/03.mp3",
        "summaryAr": "لماذا يستهدفون البخاري بالذات؟ دحض الشبهات حول الإسناد والأحاديث المنتقدة."
      }
    ]
  },
  {
    "id": "series_uthaymeen_salah",
    "scholarId": "ibn_uthaymeen",
    "titleAr": "أصول الإيمان والتفسير وعلم الأصول",
    "titleEn": "Foundations of Faith, Tafsir & Usul al-Fiqh",
    "sheikhAr": "الشيخ محمد بن صالح العثيمين (رحمه الله)",
    "sheikhEn": "Sheikh Ibn Uthaymeen",
    "category": "fiqh",
    "badgeAr": "تأصيل علمي • 4 دروس",
    "badgeEn": "Core Foundations • 4 Lessons",
    "icon": "📖",
    "descriptionAr": "شرح علمي رصين لأصول الإيمان، أصول التفسير، والأصول من علم الأصول للعلامة ابن عثيمين رحمه الله.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "uth_sl_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: شرح أصول الإيمان (المجلس الأول) — حقيقة الإيمان وأركانه",
        "titleEn": "Foundations of Faith (Part 1): Reality and Pillars",
        "durationFormatted": "48:35",
        "audioUrl": "https://archive.org/download/ben1-130/0001.mp3",
        "summaryAr": "بيان أركان الإيمان الستة وثمراتها في صلاح القلب واستقامة العمل."
      },
      {
        "id": "uth_sl_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: شرح أصول الإيمان (المجلس الثاني) — توحيد الله وتعظيمه",
        "titleEn": "Foundations of Faith (Part 2): Venerating Allah",
        "durationFormatted": "45:10",
        "audioUrl": "https://archive.org/download/ben1-130/0002.mp3",
        "summaryAr": "تفصيل مسائل الإيمان بالله وأسمائه وصفاته وأثرها في الخشوع والعبودية."
      },
      {
        "id": "uth_sl_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: شرح أصول التفسير — قواعد فهم كتاب الله العزيز",
        "titleEn": "Foundations of Tafsir: Rules for Understanding the Quran",
        "durationFormatted": "47:00",
        "audioUrl": "https://archive.org/download/ben1-130/0003.mp3",
        "summaryAr": "كيف نرجع إلى تفسير القرآن بالقرآن وبالسنة وبأقوال الصحابة الكرام."
      },
      {
        "id": "uth_sl_04",
        "episodeNumber": 4,
        "titleAr": "الدرس 4: شرح الأصول من علم الأصول — مدخل استنباط الأحكام",
        "titleEn": "Usul min Ilm al-Usul: Introduction to Legal Deduction",
        "durationFormatted": "46:55",
        "audioUrl": "https://archive.org/download/ben1-130/0034.mp3",
        "summaryAr": "تعريف أصول الفقه، الأحكام التكليفية والوضعية، وأدلة الشريعة الغراء."
      }
    ]
  },
  {
    "id": "series_uthaymeen_tawheed",
    "scholarId": "ibn_uthaymeen",
    "titleAr": "شرح كتاب التوحيد وحقيقة الإخلاص لله وحده",
    "titleEn": "Explanation of Kitab At-Tawheed",
    "sheikhAr": "الشيخ محمد بن صالح العثيمين (رحمه الله)",
    "sheikhEn": "Sheikh Ibn Uthaymeen",
    "category": "tazkiyah",
    "badgeAr": "التوحيد الخالص • 3 دروس",
    "badgeEn": "Pure Monotheism • 3 Lessons",
    "icon": "🌟",
    "descriptionAr": "شرح ميسر لأصل الدين وأعظم واجب على العبيد؛ تجريد الإخلاص لله ونبذ الشرك بكافة صوره.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "uth_tw_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: فضل التوحيد وما يكفر من الذنوب والخطايا",
        "titleEn": "Virtues of Tawheed and Erasing Sins",
        "durationFormatted": "46:40",
        "audioUrl": "https://archive.org/download/uthaymeen-audio-kitab-tawheed/%D8%A7%D8%A8%D9%86%20%D8%A7%D9%84%D8%B9%D8%AB%D9%8A%D9%85%D9%8A%D9%86%20-%20%D9%83%D8%AA%D8%A7%D8%A8%20%D8%A7%D9%84%D8%AA%D9%88%D8%AD%D9%8A%D8%AF%20-%2001.mp3",
        "summaryAr": "من حقق التوحيد دخل الجنة بغير حساب ولا عذاب؛ معنى لا إله إلا الله وشروطها."
      },
      {
        "id": "uth_tw_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الخوف من الشرك والتحذير من الرياء الخفي",
        "titleEn": "Fear of Shirk & Subconscious Ostentation",
        "durationFormatted": "42:15",
        "audioUrl": "https://archive.org/download/uthaymeen-audio-kitab-tawheed/%D8%A7%D8%A8%D9%86%20%D8%A7%D9%84%D8%B9%D8%AB%D9%8A%D9%85%D9%8A%D9%86%20-%20%D9%83%D8%AA%D8%A7%D8%A8%20%D8%A7%D9%84%D8%AA%D9%88%D8%AD%D9%8A%D8%AF%20-%2002.mp3",
        "summaryAr": "أخوف ما أخاف عليكم الشرك الأصغر؛ مراقبة القلب وتخليصه من حب المدح وثناء الناس."
      },
      {
        "id": "uth_tw_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: صدق التوكل على الله وتفويض الأمور إليه",
        "titleEn": "Sincere Tawakkul & True Reliance",
        "durationFormatted": "44:00",
        "audioUrl": "https://archive.org/download/uthaymeen-audio-kitab-tawheed/%D8%A7%D8%A8%D9%86%20%D8%A7%D9%84%D8%B9%D8%AB%D9%8A%D9%85%D9%8A%D9%86%20-%20%D9%83%D8%AA%D8%A7%D8%A8%20%D8%A7%D9%84%D8%AA%D9%88%D8%AD%D9%8A%D8%AF%20-%2003.mp3",
        "summaryAr": "الأخذ بالأسباب مع عدم الاعتماد عليها بل تعليق القلب بمسبب الأسباب جل جلاله."
      }
    ]
  },
  {
    "id": "series_tarefe_ahkam",
    "scholarId": "abdulaziz_tarefe",
    "titleAr": "التفسير والبيان لآيات القرآن والسنن الربانية",
    "titleEn": "Tafsir & Explanation of Quranic Verses",
    "sheikhAr": "الشيخ عبد العزيز الطريفي (فك الله أسره)",
    "sheikhEn": "Sheikh Abdul Aziz Al-Tarefe",
    "category": "tafseer",
    "badgeAr": "التفسير والبيان • 3 مجالس",
    "badgeEn": "Quranic Tafsir • 3 Sessions",
    "icon": "📖",
    "descriptionAr": "فقه استنباط الهدايات والأحكام من الآيات، سنن الله في المجتمعات، وفقه الثبات والصلاح والإصلاح.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "tar_ah_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: مقدمات في التفسير واستنباط الهدايات من نصوص الوحي",
        "titleEn": "Foundations of Tafsir & Deducing Guidance",
        "durationFormatted": "47:20",
        "audioUrl": "https://archive.org/download/S_Tafssir-5_uP_bY_mUSLEm/001.mp3",
        "summaryAr": "كيف تفهم مراد الشارع من اللفظ؟ قواعد الجمع والترجيح وفهم مقاصد الشريعة الغراء."
      },
      {
        "id": "tar_ah_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: آيات العبودية والصلاة وأثرها في تطهير السلوك",
        "titleEn": "Worship Verses & Transforming Conduct",
        "durationFormatted": "45:00",
        "audioUrl": "https://archive.org/download/S_Tafssir-5_uP_bY_mUSLEm/002.mp3",
        "summaryAr": "«إن الصلاة تنهى عن الفحشاء والمنكر»؛ كيف تصبح العبادة حصناً عملياً من المعاصي."
      },
      {
        "id": "tar_ah_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: سنن الله الإلهية في تمحيص الصادقين وسقوط الظالمين",
        "titleEn": "Divine Laws in Testing the Truthful",
        "durationFormatted": "50:10",
        "audioUrl": "https://archive.org/download/S_Tafssir-5_uP_bY_mUSLEm/003.mp3",
        "summaryAr": "ولا يحيق المكر السيئ إلا بأهله؛ حتمية انتصار الحق مهما طال ليل الباطل وقوي سلطانه."
      }
    ]
  },
  {
    "id": "series_tarefe_ibtilaa",
    "scholarId": "abdulaziz_tarefe",
    "titleAr": "شرح حديث جبريل ومراتب الدين وفقه الفتن",
    "titleEn": "Hadith of Jibreel, Ranks of Religion & Fiqh of Trials",
    "sheikhAr": "الشيخ عبد العزيز الطريفي (فك الله أسره)",
    "sheikhEn": "Sheikh Abdul Aziz Al-Tarefe",
    "category": "tazkiyah",
    "badgeAr": "مراتب الدين • 3 محاضرات",
    "badgeEn": "Ranks of Faith • 3 Lectures",
    "icon": "🛡️",
    "descriptionAr": "شرح جامع لحديث جبريل عليه السلام في الإسلام والإيمان والإحسان وأشراط الساعة وفقه الثبات.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "tar_ib_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: شرح حديث جبريل (المجلس الأول) — أركان الإسلام ومباني العمل",
        "titleEn": "Hadith of Jibreel (Part 1): Pillars of Islam",
        "durationFormatted": "52:30",
        "audioUrl": "https://archive.org/download/3azamitAllah/7adeth-jbrel-aman-1.mp3",
        "summaryAr": "بيان أركان الإسلام العملية وكيف يتكامل الظاهر والباطن في تحقيق العبودية لله."
      },
      {
        "id": "tar_ib_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: شرح حديث جبريل (المجلس الثاني) — أركان الإيمان واليقين",
        "titleEn": "Hadith of Jibreel (Part 2): Pillars of Faith",
        "durationFormatted": "58:15",
        "audioUrl": "https://archive.org/download/3azamitAllah/7adeth-jbrel-aman-2.mp3",
        "summaryAr": "الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر خيره وشره وأثره في ثبات القلب."
      },
      {
        "id": "tar_ib_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: شرح حديث جبريل (المجلس الثالث) — مقام الإحسان وأشراط الساعة",
        "titleEn": "Hadith of Jibreel (Part 3): Ihsan & Signs of the Hour",
        "durationFormatted": "32:20",
        "audioUrl": "https://archive.org/download/3azamitAllah/7adeth-jbrel-aman-3.mp3",
        "summaryAr": "أن تعبد الله كأنك تراه؛ مراقبة الله في الخلوات وفقه التعامل مع فتن آخر الزمان."
      }
    ]
  },
  {
    "id": "series_sakran_majrayat",
    "scholarId": "ibrahim_sakran",
    "titleAr": "الماجريات ومآلات الخطاب: فقه الواقع والانعتاق من أسر الضجيج",
    "titleEn": "Al-Majrayat: Reality Insight & Overcoming Digital Distraction",
    "sheikhAr": "الشيخ إبراهيم السكران (فك الله أسره)",
    "sheikhEn": "Sheikh Ibrahim Al-Sakran",
    "category": "mindset",
    "badgeAr": "فقه الواقع • 3 مجالس",
    "badgeEn": "Productivity • 3 Sessions",
    "icon": "✨",
    "descriptionAr": "تحليل ظاهرة الغرق في الماجريات ومآلات الخطاب المعاصر، وكيف يعيد المسلم بناء وقته وبصيرته الفكرية.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sak_mj_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: سلطة طرح الأسئلة وتفكيك الماجريات الفكرية",
        "titleEn": "The Power of Framing Questions & Intellectual Insight",
        "durationFormatted": "43:50",
        "audioUrl": "https://archive.org/download/Mo1440abo3mr/%D9%85%D8%AD%D8%A7%D8%B6%D8%B1%D8%A9%20-%20%D8%B3%D9%84%D8%B7%D8%A9%20%D8%B7%D8%B1%D8%AD%20%D8%A7%D9%84%D8%A3%D8%B3%D8%A6%D9%84%D8%A9%D8%A5%D8%A8%D8%B1%D8%A7%D9%87%D9%8A%D9%85%20%D8%A7%D9%84%D8%B3%D9%83%D8%B1%D8%A7%D9%86.mp3",
        "summaryAr": "كيف يُوجَّه الوعي عبر سلطة طرح الأسئلة، وكيف يتحرر طالب العلم من أسر السجالات المفتعلة."
      },
      {
        "id": "sak_mj_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: مآلات الخطاب المدني - مدخل وتنويهات أولية",
        "titleEn": "Consequences of Civil Discourse: Foundational Insights",
        "durationFormatted": "08:42",
        "audioUrl": "https://archive.org/download/khtab-mdni/02-%D9%85%D8%AF%D8%AE%D9%84.mp3",
        "summaryAr": "قراءة نقدية رصينة في تحولات الخطاب المعاصر وميزان الوحي في تقييم الأطروحات الفكرية."
      },
      {
        "id": "sak_mj_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: تنقلات الخطاب المعاصر واستعادة مركزية الوحي",
        "titleEn": "Shifts in Modern Discourse & Reclaiming Revelation Centrality",
        "durationFormatted": "31:54",
        "audioUrl": "https://archive.org/download/khtab-mdni/03-%D8%A7%D9%84%D9%81%D8%B5%D9%84%20%D8%A7%D9%84%D8%A3%D9%88%D9%84-%D8%AA%D9%86%D9%82%D9%84%D8%A7%D8%AA%20%D8%A7%D9%84%D8%AE%D8%B7%D8%A7%D8%A8%20%D8%A7%D9%84%D9%85%D8%AF%D9%86%D9%8A.mp3",
        "summaryAr": "رصد مسارات التحول الفكري وكيف يعتصم المسلم بمرجعية الكتاب والسنة أمام الموجات الوافدة."
      }
    ]
  },
  {
    "id": "series_sakran_maslakiyat",
    "scholarId": "ibrahim_sakran",
    "titleAr": "غائية الحضارة والاستخلاف وتأجيل نتائج الاستقامة",
    "titleEn": "Purpose of Civilization, Stewardship & Steadfastness",
    "sheikhAr": "الشيخ إبراهيم السكران (فك الله أسره)",
    "sheikhEn": "Sheikh Ibrahim Al-Sakran",
    "category": "tazkiyah",
    "badgeAr": "فكر وتزكية • 3 مجالس",
    "badgeEn": "Spiritual Ethics • 3 Sessions",
    "icon": "🌱",
    "descriptionAr": "تأملات عميقة من قراءة كتاب مآلات الخطاب المدني للشيخ إبراهيم السكران في غائية الحضارة في سلم الوحي وتأجيل نتائج الاستقامة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sak_ms_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: غائية الحضارة في سلم الوحي وتصحيح بوصلة العمل",
        "titleEn": "Purpose of Civilization in the Hierarchy of Revelation",
        "durationFormatted": "29:15",
        "audioUrl": "https://archive.org/download/khtab-mdni/08-%D8%BA%D8%A7%D8%A6%D9%8A%D8%A9%20%D8%A7%D9%84%D8%AD%D8%B6%D8%A7%D8%B1%D8%A9%20%D9%81%D9%8A%20%D8%B3%D9%84%D9%85%20%D8%A7%D9%84%D9%88%D8%AD%D9%8A.mp3",
        "summaryAr": "العلم والعمران وسيلة لتحقيق العبودية لله؛ تصحيح القصد وتطهير الباطن بنور الوحي."
      },
      {
        "id": "sak_ms_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: التعلق بآيتي العمارة والاستخلاف ومفهوم العبادة الشامل",
        "titleEn": "Understanding Stewardship and Comprehensive Worship",
        "durationFormatted": "22:45",
        "audioUrl": "https://archive.org/download/khtab-mdni/12-%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%82%20%D8%A8%D8%A2%D9%8A%D8%AA%D9%8A%20%D8%A7%D9%84%D8%B9%D9%85%D8%A7%D8%B1%D8%A9%20%D9%88%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%AE%D9%84%D8%A7%D9%81.mp3",
        "summaryAr": "تحرير المفهوم القرآني للاستخلاف وارتباطه الوثيق بتحقيق التوحيد وإقامة الصلاة."
      },
      {
        "id": "sak_ms_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: تأجيل نتائج الاستقامة وثبات القلب على الحق",
        "titleEn": "Delayed Fruits of Steadfastness & Firmness of Heart",
        "durationFormatted": "18:55",
        "audioUrl": "https://archive.org/download/khtab-mdni/27-%D8%AA%D8%A3%D8%AC%D9%8A%D9%84%20%D9%86%D8%AA%D8%A7%D8%A6%D8%AC%20%D8%A7%D9%84%D8%A5%D8%B3%D8%AA%D9%82%D8%A7%D9%85%D8%A9.mp3",
        "summaryAr": "لماذا قد تتأخر ثمار الاستقامة في الدنيا؟ تربية النفس على الإخلاص وانتظار الجزاء من الله."
      }
    ]
  },
  {
    "id": "series_rashed_ummah",
    "scholarId": "khaled_rashed",
    "titleAr": "عجباً لأمر المؤمن: مواعظ الثبات وأحوال الصادقين",
    "titleEn": "Wondrous is the Believer: Sermons of Steadfastness",
    "sheikhAr": "الشيخ خالد الراشد (فك الله أسره)",
    "sheikhEn": "Sheikh Khaled Al-Rashed",
    "category": "khutbah",
    "badgeAr": "شحذ الهمم • 3 مواعظ",
    "badgeEn": "Zeal & Awakening • 3 Sermons",
    "icon": "🔥",
    "descriptionAr": "مواعظ نارية تهز القلوب وتوقظ الغافلين في بيان عزة المؤمن وأحوال العابدين والشوق إلى الجنة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "kr_um_01",
        "episodeNumber": 1,
        "titleAr": "الموعظة 1: عجباً لأمر المؤمن وسمو يقينه عند الشدائد",
        "titleEn": "Wondrous is the Affair of the Believer in Adversity",
        "durationFormatted": "38:10",
        "audioUrl": "https://archive.org/download/way2sona_20160319_1746/2-3agaban-lelmomen.mp3",
        "summaryAr": "إن أمره كله خير؛ كيف يتقلب المؤمن بين مقامات الشكر والصبر بعزة ويقين راسخ."
      },
      {
        "id": "kr_um_02",
        "episodeNumber": 2,
        "titleAr": "الموعظة 2: أحوال العابدين الصادقين ومنازلهم عند الله",
        "titleEn": "States of the Devout Worshippers & Their Ranks",
        "durationFormatted": "42:30",
        "audioUrl": "https://archive.org/download/way2sona_20160319_1746/2-a7walaabedeen.mp3",
        "summaryAr": "تتألق قلوبهم في ظلمات الليل؛ صور مشرقة من عبادة السلف الصالح ومناجاتهم لربهم."
      },
      {
        "id": "kr_um_03",
        "episodeNumber": 3,
        "titleAr": "الموعظة 3: الملتقى الجنة ونعيم الصابرين القابضين على الجمر",
        "titleEn": "Our Rendezvous is Paradise: Bliss of the Patient",
        "durationFormatted": "45:00",
        "audioUrl": "https://archive.org/download/way2sona_20160319_1746/2-alganah.mp3",
        "summaryAr": "سلعة الله الغالية التي تهون دونها كل مشقة؛ وصف صادق لنعيم أهل الجنة ولقاء الرحمن."
      }
    ]
  },
  {
    "id": "series_rashed_salah",
    "scholarId": "khaled_rashed",
    "titleAr": "الصلاة تشتكي: موعظة تهز الأركان في تعظيم الفرائض",
    "titleEn": "Prayer Pleads: Deep Warning on Neglecting Salah",
    "sheikhAr": "الشيخ خالد الراشد (فك الله أسره)",
    "sheikhEn": "Sheikh Khaled Al-Rashed",
    "category": "khutbah",
    "badgeAr": "موعظة الصلاة • حلقتان",
    "badgeEn": "Prayer Warning • 2 Episodes",
    "icon": "🔥",
    "descriptionAr": "خطبة مؤثرة جداً تبكي العيون في خطورة إضاعة الصلاة والمبادرة بالتوبة النصوح قبل الندم.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "kr_sl_01",
        "episodeNumber": 1,
        "titleAr": "الجزء 1: الصلاة تشتكي - أول ما يحاسب عليه العبد يوم القيامة",
        "titleEn": "Prayer Pleads: First Accountability on Judgment Day",
        "durationFormatted": "36:40",
        "audioUrl": "https://archive.org/download/way2sona_20160319_1746/1-asalat.mp3",
        "summaryAr": "كيف ينام العبد عن لقاء ربه؟ عقوبة التثاقل عن الصلاة وعظمة قدرها في ميزان الإسلام."
      },
      {
        "id": "kr_sl_02",
        "episodeNumber": 2,
        "titleAr": "الجزء 2: قبل الندم - المبادرة بالتوبة والمحافظة على الصلوات",
        "titleEn": "Before Regret: Hastening to Repentance & Guarding Salah",
        "durationFormatted": "39:15",
        "audioUrl": "https://archive.org/download/way2sona_20160319_1746/1-qableanadam.mp3",
        "summaryAr": "نداء مشفق لكل مقصر أن يغتنم فسحة العمر ويعود إلى صفوف المصلين قبل فوات الأوان."
      }
    ]
  },
  {
    "id": "series_kishk_anbiyaa",
    "scholarId": "abdelhamid_kishk",
    "titleAr": "أنوار السيرة المحمدية والهدي النبوي الخالد",
    "titleEn": "Lights of the Prophetic Biography & Guidance",
    "sheikhAr": "الشيخ عبد الحميد كشك (رحمه الله)",
    "sheikhEn": "Sheikh Abdelhamid Kishk",
    "category": "history",
    "badgeAr": "أنوار النبوة • 3 خطب",
    "badgeEn": "Prophetic Lights • 3 Sermons",
    "icon": "🦁",
    "descriptionAr": "ببلاغته الساحرة وصوته الجهوري الخاشع؛ مشاهد مؤثرة من سيرة المصطفى ﷺ وعبادته واستقامته.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "ksh_an_01",
        "episodeNumber": 1,
        "titleAr": "الخطبة 1: وفاة آمنة بنت وهب وميلاد النور المحمدي ﷺ",
        "titleEn": "Passing of Aminah & Dawn of the Prophetic Light",
        "durationFormatted": "51:20",
        "audioUrl": "https://archive.org/download/Keshik_uP_bY_mUSLEm/001_uP_bY_mUSLEm.Ettounssi.mp3",
        "summaryAr": "آوى الله نبيه اليتيم فكفله ورعاه؛ دروس عظيمة من طفولة سيد الخلق ﷺ وتهيئته للرسالة."
      },
      {
        "id": "ksh_an_02",
        "episodeNumber": 2,
        "titleAr": "الخطبة 2: صيام رسول الله ﷺ وهديه الكامل في العبادة",
        "titleEn": "The Fasting of the Messenger & His Complete Worship",
        "durationFormatted": "48:40",
        "audioUrl": "https://archive.org/download/Keshik_uP_bY_mUSLEm/005_uP_bY_mUSLEm.Ettounssi.mp3",
        "summaryAr": "كيف كان حال النبي ﷺ في الصيام والقيام والذكر، وجمعه بين كمال العبودية ورحمة الأمة."
      },
      {
        "id": "ksh_an_03",
        "episodeNumber": 3,
        "titleAr": "الخطبة 3: السورة التي شيبت الرسول ﷺ (فاستقم كما أمرت)",
        "titleEn": "The Surah That Grayed the Prophet: Stand Firm as Commanded",
        "durationFormatted": "46:15",
        "audioUrl": "https://archive.org/download/Keshik_uP_bY_mUSLEm/006_uP_bY_mUSLEm.Ettounssi.mp3",
        "summaryAr": "شيبتني هود وأخواتها؛ وقفات تهز القلوب مع آية الاستقامة وأهوال يوم القيامة."
      }
    ]
  },
  {
    "id": "series_msh_shaytan",
    "scholarId": "mohamed_sayed_haj",
    "titleAr": "علاج الفتور والهموم وحفظ الجوارح بالهدي النبوي",
    "titleEn": "Curing Spiritual Slump, Worries & Guarding the Senses",
    "sheikhAr": "الشيخ محمد سيد حاج (رحمه الله)",
    "sheikhEn": "Sheikh Mohamed Sayed Haj",
    "category": "tazkiyah",
    "badgeAr": "تزكية وحصانة • 3 دروس",
    "badgeEn": "Spiritual Protection • 3 Lessons",
    "icon": "🕊️",
    "descriptionAr": "محاضرات إيمانية عملية في علاج المشكلات النفسية، غض البصر، والاعتصام بالله عبر وصية احفظ الله يحفظك.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "msh_sh_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: عندي مشكلة أريد حلها - منهج الإسلام في تفريج الكروب",
        "titleEn": "I Have a Problem to Solve: Prophetic Relief of Distress",
        "durationFormatted": "44:30",
        "audioUrl": "https://archive.org/download/moh_said_2/14.mp3",
        "summaryAr": "كيف يتعامل المؤمن مع الأزمات والمشكلات اليومية بالتوكل الصادق وحسن التدبير والاستعانة بالله."
      },
      {
        "id": "msh_sh_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: غض البصر وحفظ الجوارح من مداخل الفتن",
        "titleEn": "Lowering the Gaze & Guarding the Senses from Temptation",
        "durationFormatted": "42:10",
        "audioUrl": "https://archive.org/download/moh_said_2/16.mp3",
        "summaryAr": "البصر بريد القلب؛ كيف يورث غض البصر لله نور البصيرة وحلاوة الإيمان في الصدر."
      },
      {
        "id": "msh_sh_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: فوائد تربوية وعقدية من حديث (احفظ الله يحفظك)",
        "titleEn": "Educational & Faith Benefits from 'Be Mindful of Allah'",
        "durationFormatted": "47:00",
        "audioUrl": "https://archive.org/download/moh_said_2/17.mp3",
        "summaryAr": "احفظ الله تجده تجاهك؛ دستور الحماية الربانية وحفظ الدين والنفس والأهل."
      }
    ]
  },
  {
    "id": "series_muqaddam_himma",
    "scholarId": "muhammad_ismail_muqaddam",
    "titleAr": "علو الهمة وبناء الشخصية المسلمة",
    "titleEn": "High Zeal & Building the Muslim Character",
    "sheikhAr": "الشيخ د. محمد إسماعيل المقدم",
    "sheikhEn": "Dr. Muhammad Ismail Al-Muqaddam",
    "category": "mindset",
    "badgeAr": "علو الهمة • 3 دروس",
    "badgeEn": "High Zeal • 3 Lessons",
    "icon": "🏔️",
    "descriptionAr": "موسوعة تربوية وإيمانية خالدة في علاج الكسل والفتور، وبناء الهمة العالية في طلب العلم والعبادة وإصلاح النفس.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "mim_hm_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: حقيقة علو الهمة وأثرها في نهوض الفرد والأمة",
        "titleEn": "The Reality of High Zeal & Its Impact",
        "durationFormatted": "69:50",
        "audioUrl": "https://archive.org/download/3olow-hemmuh/01.mp3",
        "summaryAr": "المؤمن القوي خير وأحب إلى الله؛ كيف يرتقي المسلم بهمته عن سفاسف الأمور إلى معاليها."
      },
      {
        "id": "mim_hm_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: نماذج خالدة من علو همة الصحابة والسلف الصالح",
        "titleEn": "Timeless Models of High Zeal from the Salaf",
        "durationFormatted": "83:20",
        "audioUrl": "https://archive.org/download/3olow-hemmuh/02.mp3",
        "summaryAr": "سير أبطال الصحابة والتابعين في الجمع بين إتقان العمل الدنيوي والسباق إلى الآخرة."
      },
      {
        "id": "mim_hm_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: بواعث علو الهمة وكسر قيود العجز والكسل",
        "titleEn": "Drivers of High Zeal & Breaking the Chains of Sloth",
        "durationFormatted": "73:50",
        "audioUrl": "https://archive.org/download/3olow-hemmuh/03.mp3",
        "summaryAr": "الأسباب العملية التي تشعل الهمة في طلب العلم والعبادة وتطرد الفتور والتسويف."
      }
    ]
  },
  {
    "id": "series_huwayni_istiqamah",
    "scholarId": "abu_ishaq_huwayni",
    "titleAr": "معالم الاستقامة والأمر بالمعروف على منهج السلف",
    "titleEn": "Milestones of Steadfastness on the Salaf Path",
    "sheikhAr": "الشيخ أبو إسحاق الحويني (حفظه الله)",
    "sheikhEn": "Sheikh Abu Ishaq Al-Huwayni",
    "category": "mindset",
    "badgeAr": "قواعد الاتباع • 3 دروس",
    "badgeEn": "Steadfastness • 3 Lessons",
    "icon": "🦁",
    "descriptionAr": "دروس تأصيلية للعلامة أبي إسحاق الحويني في ثبات القلب على التوحيد والسنة، وفقه الأمر بالمعروف والنهي عن المنكر.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "bdr_is_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: من المؤمنين رجال — ثبات القلوب والصدق مع الله",
        "titleEn": "Among the Believers Are Men: True Steadfastness",
        "durationFormatted": "63:40",
        "audioUrl": "https://archive.org/download/alheweny0_gmail/%D9%85%D9%86%20%D8%A7%D9%84%D9%85%D8%A4%D9%85%D9%86%D9%8A%D9%86%20%D8%B1%D8%AC%D8%A7%D9%84.mp3",
        "summaryAr": "اهدنا الصراط المستقيم؛ تضرع العبد الدائم إلى ربه لتثبيت فؤاده على صراطه المستقيم."
      },
      {
        "id": "bdr_is_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: فقه الأمر بالمعروف والنهي عن المنكر وإصلاح النفس (١)",
        "titleEn": "Enjoining Good and Reforming the Self (Part 1)",
        "durationFormatted": "63:50",
        "audioUrl": "https://archive.org/download/Amer_Nahi/1.mp3",
        "summaryAr": "لا يستقيم إيمان عبد حتى يستقيم قلبه، ولا يستقيم قلبه حتى يستقيم لسانه."
      },
      {
        "id": "bdr_is_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: ضوابط النصيحة ولزوم السنة والحذر من الغلو والتفريط (٢)",
        "titleEn": "Adhering to Sunnah Without Extremism or Neglect (Part 2)",
        "durationFormatted": "55:00",
        "audioUrl": "https://archive.org/download/Amer_Nahi/2.mp3",
        "summaryAr": "سددوا وقاربوا وأبشروا؛ منهج التوسط والاعتدال في العبادة والدعوة كما شرعها رسول الله ﷺ."
      }
    ]
  },
  {
    "id": "series_samir_sabr",
    "scholarId": "samir_moustafa",
    "titleAr": "الصبر والمصابرة وأصول الثبات في المحن والفتن",
    "titleEn": "Patience, Perseverance & Steadfastness in Trials",
    "sheikhAr": "الشيخ سمير مصطفى (فك الله أسره)",
    "sheikhEn": "Sheikh Samir Moustafa",
    "category": "mindset",
    "badgeAr": "مجاهدة وثبات • 3 خطب",
    "badgeEn": "Steadfastness • 3 Sermons",
    "icon": "⚡",
    "descriptionAr": "خطاب مباشر مشوق يشحذ الهمم للصبر والمصابرة، ويوضح أصول الثبات عند المحن وكسر حواجز الغفلة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sm_sb_01",
        "episodeNumber": 1,
        "titleAr": "الخطبة 1: اصبروا وصابروا ورابطوا - صناعة النفس الصابرة",
        "titleEn": "Be Patient and Persevere: Forging the Resilient Soul",
        "durationFormatted": "35:10",
        "audioUrl": "https://archive.org/download/khotab_minbriah-sh_samir-mostafa/01_Smir_Mostafa_khotab_esbero(%D8%A7%D8%B5%D8%A8%D8%B1%D9%88%D8%A7%20%D9%88%D8%B5%D8%A7%D8%A8%D9%80%D8%B1%D9%88%D8%A7).mp3",
        "summaryAr": "مكاره الجنة وحفت النار بالشهوات؛ كيف تروض نفسك على الصبر حتى تذوق حلاوة العبودية."
      },
      {
        "id": "sm_sb_02",
        "episodeNumber": 2,
        "titleAr": "الخطبة 2: أصول في المحن - كيف يثبت المؤمن عند الابتلاء؟",
        "titleEn": "Principles in Trials: How the Believer Stands Firm",
        "durationFormatted": "33:40",
        "audioUrl": "https://archive.org/download/khotab_minbriah-sh_samir-mostafa/03_Smir_Mostafa_khotab_o.f.me7an(%D8%A3%D9%8F%D8%B5%D9%88%D9%84%20%D9%81%D9%8A%20%D8%A7%D9%84%D9%85%D8%AD%D9%80%D9%80%D9%86).mp3",
        "summaryAr": "القواعد الإيمانية الراسخة التي تحول المحن والشدائد إلى منح ربانية ورفعة في الدرجات."
      },
      {
        "id": "sm_sb_03",
        "episodeNumber": 3,
        "titleAr": "الخطبة 3: اعرف قدرك وإياك والغفلة - يقظة القلب للآخرة",
        "titleEn": "Know Your Worth & Beware of Heedlessness",
        "durationFormatted": "37:00",
        "audioUrl": "https://archive.org/download/khotab_minbriah-sh_samir-mostafa/04_Smir_Mostafa_khotab_kadrak(%D8%A7%D8%B9%D8%B1%D9%81%20%D9%82%D8%AF%D8%B1%D9%83%20%D9%88%D8%A5%D9%8A%D8%A7%D9%83%20%D9%88%D8%A7%D9%84%D8%BA%D9%81%D9%84%D8%A9).mp3",
        "summaryAr": "قيمة العمر الغالية وكيف ينتفض المؤمن من كسله وغفلته ليعمر صحائفه بصالح الأعمال."
      }
    ]
  },
  {
    "id": "series_samir_yusuf",
    "scholarId": "samir_moustafa",
    "titleAr": "السيرة النبوية الشريفة ومعالم عظمة المصطفى ﷺ",
    "titleEn": "The Noble Prophetic Biography & Majesty of the Messenger",
    "sheikhAr": "الشيخ سمير مصطفى (فك الله أسره)",
    "sheikhEn": "Sheikh Samir Moustafa",
    "category": "siyra",
    "badgeAr": "السيرة النبوية • 3 مجالس",
    "badgeEn": "Prophetic Seerah • 3 Sessions",
    "icon": "🕊️",
    "descriptionAr": "مدخل ماتع لدراسة السيرة النبوية الشريفة، أسماء النبي ﷺ، وتعظيم الصحابة والسلف الصالح لهديه.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sm_ys_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: أهمية دراسة السيرة النبوية وحاجتنا الملحة إليها",
        "titleEn": "Importance of Studying the Prophetic Biography",
        "durationFormatted": "38:20",
        "audioUrl": "https://archive.org/download/islami-888/%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%D8%A9%20%D8%A7%D9%84%D9%86%D8%A8%D9%88%D9%8A%D8%A9%20(01-%20%D8%A3%D9%87%D9%85%D9%8A%D8%A9%20%D8%AF%D8%B1%D8%A7%D8%B3%D8%A9%20%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%D8%A9)%20%D9%84%D9%81%D8%B6%D9%8A%D9%84%D8%A9%20%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%20%D8%B3%D9%85%D9%8A%D8%B1%20%D9%85%D8%B5%D8%B7%D9%81%D9%89.mp3",
        "summaryAr": "لماذا ندرس سيرة سيد المرسلين ﷺ؟ كيف تتحول السيرة من سرد تاريخي إلى منهج حياة وتربية."
      },
      {
        "id": "sm_ys_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: أسماء النبي ﷺ ودلالاتها على كمال صفاته ورسالته",
        "titleEn": "Names of the Prophet & Their Meanings of Perfection",
        "durationFormatted": "40:15",
        "audioUrl": "https://archive.org/download/islami-888/%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%D8%A9%20%D8%A7%D9%84%D9%86%D8%A8%D9%88%D9%8A%D8%A9%20(03-%20%D8%A3%D8%B3%D9%85%D8%A7%D8%A1%20%D8%A7%D9%84%D9%86%D8%A8%D9%8A-%D8%B5%D9%84%D9%89%20%D8%A7%D9%84%D9%84%D9%87%20%D8%B9%D9%84%D9%8A%D9%87%20%D9%88%D8%B3%D9%84%D9%85-)%20%D9%84%D9%81%D8%B6%D9%8A%D9%84%D8%A9%20%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%20%D8%B3%D9%85%D9%8A%D8%B1%20%D9%85%D8%B5%D8%B7%D9%81%D9%89.mp3",
        "summaryAr": "محمد، أحمد، الماحي، الحاشر، العاقب، نبي الرحمة ونبي الملحمة؛ أنوار الأسماء النبوية الشريفة."
      },
      {
        "id": "sm_ys_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: تعظيم الصحابة والسلف الصالح لرسول الله ﷺ وسنته",
        "titleEn": "How the Companions & Salaf Revered the Messenger",
        "durationFormatted": "42:00",
        "audioUrl": "https://archive.org/download/islami-888/%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%D8%A9%20%D8%A7%D9%84%D9%86%D8%A8%D9%88%D9%8A%D8%A9%20(05-%20%D8%AA%D8%B9%D8%B8%D9%8A%D9%85%20%D8%A7%D9%84%D8%B5%D8%AD%D8%A7%D8%A8%D8%A9%20%D9%88%D8%A7%D9%84%D8%B3%D9%84%D9%81%20%D9%84%D8%B1%D8%B3%D9%88%D9%84%20%D8%A7%D9%84%D9%84%D9%87)%20%D9%84%D9%84%D8%B4%D9%8A%D8%AE%20%20%D8%B3%D9%85%D9%8A%D8%B1%20%D9%85%D8%B5%D8%B7%D9%81%D9%89.mp3",
        "summaryAr": "أدب الصحابة الكرام بين يدي النبي ﷺ، وسرعة استجابتهم لأمره وتوقيرهم لحديثه الشريف."
      }
    ]
  },
  {
    "id": "series_qunaibi_jeel",
    "scholarId": "eyad_qunaibi",
    "titleAr": "القرآن حياة: بناء الوعي الإيماني وحراسة الباطن",
    "titleEn": "Quran is Life: Building Faith Awareness & Guarding the Heart",
    "sheikhAr": "د. إياد قنيبي",
    "sheikhEn": "Dr. Eyad Qunaibi",
    "category": "mindset",
    "badgeAr": "القرآن حياة • 3 حلقات",
    "badgeEn": "Quranic Life • 3 Episodes",
    "icon": "🌱",
    "descriptionAr": "سلسلة إيمانية عميقة لربط القلوب والبيوت بكتاب الله، حراسة الباطن من الفتن، وعلاج استثقال الطاعات.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "eq_jl_01",
        "episodeNumber": 1,
        "titleAr": "الحلقة 1: فهم كلام الله نعمة عظمى وبناء وعي الأسرة بالوحي",
        "titleEn": "Understanding Allah's Speech is the Greatest Blessing",
        "durationFormatted": "26:40",
        "audioUrl": "https://archive.org/download/quraanhaya/1-%20%D9%81%D9%87%D9%85%20%D9%83%D9%84%D8%A7%D9%85%20%D8%A7%D9%84%D9%84%D9%87%20%D9%86%D8%B9%D9%85%D8%A9%21.mp3",
        "summaryAr": "كيف نتذوق حلاوة فهم خطاب الله المباشر لنا في القرآن، ونغرس حب تدبره في بيوتنا."
      },
      {
        "id": "eq_jl_02",
        "episodeNumber": 2,
        "titleAr": "الحلقة 2: حراسة الباطن وصيانة القلوب من الخواطر المفسدة",
        "titleEn": "Guarding the Inner Self & Protecting the Heart",
        "durationFormatted": "29:10",
        "audioUrl": "https://archive.org/download/quraanhaya/13%20-%20%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9%20%D8%A7%D9%84%D8%A8%D8%A7%D8%B7%D9%86.mp3",
        "summaryAr": "صلاح الظاهر فرع عن صلاح الباطن؛ كيف نحرس قلوبنا من الشبهات والشهوات الخفية."
      },
      {
        "id": "eq_jl_03",
        "episodeNumber": 3,
        "titleAr": "الحلقة 3: لماذا نستثقل الطاعات؟ وكيف نحيي الشغف بالعبادة",
        "titleEn": "Why Worship Feels Heavy & Reviving Passion for Obedience",
        "durationFormatted": "27:50",
        "audioUrl": "https://archive.org/download/quraanhaya/15%20-%20%D9%84%D9%85%D8%A7%D8%B0%D8%A7%20%D9%86%D8%B3%D8%AA%D8%AB%D9%82%D9%84%20%D8%A7%D9%84%D8%B7%D8%A7%D8%B9%D8%A7%D8%AA%20%D8%9F.mp3",
        "summaryAr": "تشخيص دقيق لأسباب فتور الهمة عن الطاعة، والروشتة القرآنية لاستعادة لذة القرب من الله."
      }
    ]
  },
  {
    "id": "series_meshari_rijal",
    "scholarId": "badr_meshari",
    "titleAr": "سيد الأولين والآخرين ﷺ وبطولات صحابته الكرام",
    "titleEn": "Master of Creation & Heroism of His Noble Companions",
    "sheikhAr": "الشيخ بدر المشاري",
    "sheikhEn": "Sheikh Badr Al-Meshari",
    "category": "siyra",
    "badgeAr": "سير الأبطال • 3 حلقات",
    "badgeEn": "Heroism • 3 Episodes",
    "icon": "🕌",
    "descriptionAr": "قصص مشوقة بأسلوب الشيخ بدر المشاري العذب في سيرة النبي ﷺ وبطولات الصحابة وكرامات أولياء الله.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "bm_rj_01",
        "episodeNumber": 1,
        "titleAr": "القصة 1: محمد رسول الله ﷺ - سيد الأولين والآخرين وقدوة الأبطال",
        "titleEn": "Muhammad Messenger of Allah: Role Model of Heroes",
        "durationFormatted": "46:10",
        "audioUrl": "https://archive.org/download/alwaldin_gmail_201504/%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%D8%A8%D8%AF%D8%B1%20%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D8%B1%D9%8A%20-%20%D9%85%D8%AD%D9%85%D8%AF%20%D8%B1%D8%B3%D9%88%D9%84%20%D8%A7%D9%84%D9%84%D9%87.MP3",
        "summaryAr": "ملحمة السيرة النبوية العطرة؛ شجاعة النبي ﷺ وثباته وعظيم رحمته بأمته وأصحابه."
      },
      {
        "id": "bm_rj_02",
        "episodeNumber": 2,
        "titleAr": "القصة 2: وأخرى تحبونها - نصر من الله وفتح قريب وبطولات الفاتحين",
        "titleEn": "Victory from Allah and an Imminent Conquest",
        "durationFormatted": "43:30",
        "audioUrl": "https://archive.org/download/20230722_20230722_1320/%D9%88%D8%A3%D8%AE%D8%B1%D9%89%20%D8%AA%D8%AD%D8%A8%D9%88%D9%86%D9%87%D8%A7%20%20%20%D8%A8%D8%AF%D8%B1%20%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D8%B1%D9%8A.mp3",
        "summaryAr": "كيف نصر الله جنده الموحدين في معارك الإسلام الفاصلة بصدق التوكل والإقدام."
      },
      {
        "id": "bm_rj_03",
        "episodeNumber": 3,
        "titleAr": "القصة 3: قصة الصحابي الجليل أبي معلق الأنصاري ومعجزة استجابة الدعاء",
        "titleEn": "Story of Abu Mu'allaq Al-Ansari & the Answered Prayer",
        "durationFormatted": "34:50",
        "audioUrl": "https://archive.org/download/BDRALMSHARY01/BDRALMSHARY01.mp3",
        "summaryAr": "يا ودود يا ذا العرش المجيد؛ كيف أنقذ الله صحابياً صادق اليقين بملك من السماء الرابعـة."
      }
    ]
  },
  {
    "id": "series_bin_baz_wasitiyah",
    "scholarId": "bin_baz",
    "titleAr": "شرح كتاب العقيدة الواسطية والفتاوى العقدية المهمة",
    "titleEn": "Explanation of Al-Aqeedah Al-Wasitiyyah & Core Fatawa",
    "sheikhAr": "الشيخ عبد العزيز بن باز (رحمه الله)",
    "sheikhEn": "Sheikh Abdul Aziz ibn Baz",
    "category": "fiqh",
    "badgeAr": "العقيدة والفتاوى • 3 دروس",
    "badgeEn": "Core Aqeedah • 3 Lessons",
    "icon": "📚",
    "descriptionAr": "تأصيل رصين لمعتقد أهل السنة والجماعة في التوحيد وأسماء الله وصفاته واليوم الآخر وفقه العبادات.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "bb_ws_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: معتقد أهل السنة في التوحيد وأسماء الله وصفاته",
        "titleEn": "Affirming Tawheed and Divine Attributes",
        "durationFormatted": "42:15",
        "audioUrl": "https://archive.org/download/Fatawa_ibn_Baz_bY_mUSLEm/0001_uP_bY_mUSLEm.mp3",
        "summaryAr": "ليس كمثله شيء وهو السميع البصير؛ سلامة منهج السلف في إمرار نصوص الصفات وتحقيق التوحيد."
      },
      {
        "id": "bb_ws_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الإيمان باليوم الآخر وأحكام الطهارة والصلاة",
        "titleEn": "Belief in the Last Day & Rulings of Purification",
        "durationFormatted": "44:00",
        "audioUrl": "https://archive.org/download/Fatawa_ibn_Baz_bY_mUSLEm/0002_uP_bY_mUSLEm.mp3",
        "summaryAr": "توجيهات علمية محققة في مسائل العقيدة وأركان الإسلام العملية بأسلوب واضح ميسر."
      },
      {
        "id": "bb_ws_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: فضل الصحابة الكرام وفقه المعاملات والآداب الشرعية",
        "titleEn": "Virtue of the Companions & Islamic Ethics",
        "durationFormatted": "40:30",
        "audioUrl": "https://archive.org/download/Fatawa_ibn_Baz_bY_mUSLEm/0003_uP_bY_mUSLEm.mp3",
        "summaryAr": "سلامة القلوب والألسن لأصحاب رسول الله ﷺ وتحري الحلال والاتباع في سائر الشؤون."
      }
    ]
  },
  {
    "id": "series_albani_sifah_salah",
    "scholarId": "albani",
    "titleAr": "سلسلة الهدى والنور: فقه السنة وصفة صلاة النبي ﷺ",
    "titleEn": "Guidance & Light: Sunnah Fiqh & Prophet's Prayer",
    "sheikhAr": "الشيخ محمد ناصر الدين الألباني (رحمه الله)",
    "sheikhEn": "Sheikh Muhammad Nasiruddin al-Albani",
    "category": "fiqh",
    "badgeAr": "الهدى والنور • 3 مجالس",
    "badgeEn": "Sunnah Fiqh • 3 Sessions",
    "icon": "🔍",
    "descriptionAr": "مجالس علمية محققة من سلسلة الهدى والنور في تحرير مسائل السنة، العقيدة، وصفة الصلاة النبوية بالأدلة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "alb_sf_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: منهج التصفية والتربية وتجريد المتابعة للنبي ﷺ",
        "titleEn": "Methodology of Purification, Education & Following the Sunnah",
        "durationFormatted": "45:30",
        "audioUrl": "https://archive.org/download/selselat_Alhoda-wa-nnor_1-to-150_Al-Albany___uploaded_by_Abu-Ahmad-S-A/001.mp3",
        "summaryAr": "أسس النهوض بالأمة عبر تصفية العقيدة والعبادة مما علق بها والتربية على الكتاب والسنة."
      },
      {
        "id": "alb_sf_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: تحقيق مسائل الطهارة والصلاة والعمل بالحديث الصحيح",
        "titleEn": "Verifying Rulings of Salah & Acting Upon Authentic Hadith",
        "durationFormatted": "48:10",
        "audioUrl": "https://archive.org/download/selselat_Alhoda-wa-nnor_1-to-150_Al-Albany___uploaded_by_Abu-Ahmad-S-A/002.mp3",
        "summaryAr": "صلوا كما رأيتموني أصلي؛ تحرير دقيق لمسائل الفقه والحديث والرد على الشبهات."
      },
      {
        "id": "alb_sf_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: فقه السنن الرواتب وآداب المساجد والفتاوى الحديثية",
        "titleEn": "Sunnah Prayers, Mosque Etiquette & Hadith Verifications",
        "durationFormatted": "46:40",
        "audioUrl": "https://archive.org/download/selselat_Alhoda-wa-nnor_1-to-150_Al-Albany___uploaded_by_Abu-Ahmad-S-A/003.mp3",
        "summaryAr": "مباحث حديثية وفقهية ماتعة في إحياء السنن المهجورة والتمسك بهدي السلف الصالح."
      }
    ]
  },
  {
    "id": "series_safar_ummah",
    "scholarId": "safar_hawali",
    "titleAr": "فقه الأمة وتاريخ القدس ومعالم اليقظة الإسلامية",
    "titleEn": "Fiqh of the Ummah, Jerusalem History & Islamic Awakening",
    "sheikhAr": "الشيخ سفر الحوالي (فك الله أسره)",
    "sheikhEn": "Sheikh Safar Al-Hawali",
    "category": "history",
    "badgeAr": "فقه الأمة • 3 محاضرات",
    "badgeEn": "Ummah Awakening • 3 Lectures",
    "icon": "🏛️",
    "descriptionAr": "قراءة عقدية وتاريخية عميقة لواقع الأمة الإسلامية وتاريخ بيت المقدس وبشائر التمكين والاستخلاف.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sf_um_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: سنن التدافع الحضاري ومكانة أمة الإسلام بين الأمم",
        "titleEn": "Civilizational Push & True Standing of the Ummah",
        "durationFormatted": "53:20",
        "audioUrl": "https://archive.org/download/006_20240819/001.mp3",
        "summaryAr": "«ولولا دفع الله الناس بعضهم ببعض لفسدت الأرض»؛ دور الأمة كشاهدة على البشرية بالحق."
      },
      {
        "id": "sf_um_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: واجب الشباب في حفظ الهوية العقدية ونصرة الدين",
        "titleEn": "Duty of Youth in Preserving Creedal Identity",
        "durationFormatted": "50:40",
        "audioUrl": "https://archive.org/download/006_20240819/002.mp3",
        "summaryAr": "كيف يتحول الوعي العقدي إلى عمل منظم وبناء علمي رصين لخدمة الدين ورفع رايته."
      },
      {
        "id": "sf_um_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: تاريخ القدس العقدي وحتمية وعد الله للمؤمنين",
        "titleEn": "History of Al-Quds & Certainty of Divine Promise",
        "durationFormatted": "55:10",
        "audioUrl": "https://archive.org/download/tareekh_alaqids__alhawaly_fast/tareekh_alaqids__alhawaly_01.mp3",
        "summaryAr": "الجذور التاريخية والعقدية لقضية بيت المقدس في ميزان الوحي وبشائر النصر والتمكين."
      }
    ]
  },
  {
    "id": "series_shinqitee_zad",
    "scholarId": "shinqitee",
    "titleAr": "أسرار الفاتحة ومناجاة علام الغيوب في ظلمات الليل",
    "titleEn": "Secrets of Al-Fatihah & Divine Intimacy",
    "sheikhAr": "الشيخ محمد بن محمد المختار الشنقيطي",
    "sheikhEn": "Sheikh Muhammad Al-Mukhtar Al-Shinqitee",
    "category": "tazkiyah",
    "badgeAr": "أسرار المناجاة • 3 مجالس",
    "badgeEn": "Prayer Secrets • 3 Sessions",
    "icon": "💎",
    "descriptionAr": "مواعظ تبكي العيون وترقق القلوب بأسلوب فقيه المدينة؛ تفسير سورة الفاتحة ولذة الانكسار بين يدي الله.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "shn_zd_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: تفسير سورة الفاتحة وأسرار مناجاة الرحمن في الصلاة",
        "titleEn": "Tafseer of Surah Al-Fatihah & Secrets of Prayer Intimacy",
        "durationFormatted": "48:00",
        "audioUrl": "https://archive.org/download/0020217121427/001%20-%20%D8%B3%D9%88%D8%B1%D8%A9%20%D8%A7%D9%84%D9%81%D8%A7%D8%AA%D8%AD%D8%A9(01)%2016-12-1427.mp3",
        "summaryAr": "قسمت الصلاة بيني وبين عبدي نصفين؛ كيف يستشعر المصلي جواب ربه له عند كل آية من الفاتحة."
      },
      {
        "id": "shn_zd_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: لذة القرب من الله ودعاء المضطر في السجود والأسحار",
        "titleEn": "Sweetness of Nearness to Allah & the Distressed Supplication",
        "durationFormatted": "46:30",
        "audioUrl": "https://archive.org/download/my1_ail_555_201/555.mp3",
        "summaryAr": "أقرب ما يكون العبد من ربه وهو ساجد؛ سكينة البكاء بين يدي الله وبث الشكوى إليه وحده."
      },
      {
        "id": "shn_zd_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: لقاء مفتوح - توجيهات تربوية وفقهية لإصلاح القلوب",
        "titleEn": "Open Counsel: Spiritual & Fiqh Guidance for Heart Reform",
        "durationFormatted": "44:10",
        "audioUrl": "https://archive.org/download/Shnghiti_by_hassan/001likaamftoooh.mp3",
        "summaryAr": "وصايا أبوية حانية من رحاب المدينة النبوية في الثبات على الطاعة وحفظ الجوارح."
      }
    ]
  },
  {
    "id": "series_shinqitee_birr",
    "scholarId": "shinqitee",
    "titleAr": "أخلاق المسلم وتزكية النفوس من آفات الغرور",
    "titleEn": "Muslim Character & Purifying the Soul from Arrogance",
    "sheikhAr": "الشيخ محمد بن محمد المختار الشنقيطي",
    "sheikhEn": "Sheikh Muhammad Al-Mukhtar Al-Shinqitee",
    "category": "tazkiyah",
    "badgeAr": "الأخلاق والتزكية • 3 مواعظ",
    "badgeEn": "Character & Tazkiyah • 3 Sermons",
    "icon": "💎",
    "descriptionAr": "مواعظ إيمانية جليلة في معالي أخلاق المسلم، علاج داء الغرور، واستلهام المواقف الإيمانية الخالدة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "shn_br_01",
        "episodeNumber": 1,
        "titleAr": "الموعظة 1: خلق المسلم ومعالي الآداب التي يبلغ بها درجة الصائم القائم",
        "titleEn": "The Muslim's Noble Character & High Etiquette",
        "durationFormatted": "42:15",
        "audioUrl": "https://archive.org/download/Shnghiti_by_hassan/006-Kholoq_AlMoslem.mp3",
        "summaryAr": "إن المؤمن ليدرك بحسن خلقه درجة الصائم القائم؛ كيف يتجمل العبد بأخلاق القرآن مع الخلق."
      },
      {
        "id": "shn_br_02",
        "episodeNumber": 2,
        "titleAr": "الموعظة 2: داء الغرور وأثره على طلبة العلم والعباد الصالحين",
        "titleEn": "The Disease of Arrogance & Its Danger to Seekers",
        "durationFormatted": "45:40",
        "audioUrl": "https://archive.org/download/Shnghiti_by_hassan/004-AlGhoror_Wa_Atharoh.mp3",
        "summaryAr": "الحذر من العجب بالنفس أو العمل، وكيف كان السلف يجمعون إحساناً ومخافة وانكساراً لله."
      },
      {
        "id": "shn_br_03",
        "episodeNumber": 3,
        "titleAr": "الموعظة 3: مواقف إيمانية خالدة في الصدق مع الله عند المحن",
        "titleEn": "Timeless Faith Stances of Sincerity in Trials",
        "durationFormatted": "41:50",
        "audioUrl": "https://archive.org/download/Shnghiti_by_hassan/008aleman.mp3",
        "summaryAr": "مشاهد تهز الوجدان من صدق أولياء الله الصالحين وثباتهم حين تمتحن القلوب."
      }
    ]
  },
  {
    "id": "series_kamel_al_soorah",
    "scholarId": "ahmed_al_sayed",
    "titleAr": "البناء الحديثي والمنهجي: حجية السنة وتثبيت اليقين",
    "titleEn": "Hadith & Methodological Foundation: Authority of Sunnah",
    "sheikhAr": "الشيخ أحمد بن يوسف السيد",
    "sheikhEn": "Sheikh Ahmad Al-Sayed",
    "category": "mindset",
    "badgeAr": "تأصيل منهجي • 4 محاضرات",
    "badgeEn": "Methodological Certainty • 4 Lectures",
    "icon": "💡",
    "descriptionAr": "تأصيل منهجي وحديثي متين لتثبيت مرجعية الوحي، بيان دقة منهج المحدثين، ومواجهة الشبهات المعاصرة.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "as_ks_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: مدخل البناء العلمي ومركزية السنة النبوية في الإسلام",
        "titleEn": "Foundational Intro & Centrality of Prophetic Sunnah",
        "durationFormatted": "42:30",
        "audioUrl": "https://archive.org/download/hadith_/1.mp3",
        "summaryAr": "كيف تتكامل السنة النبوية مع القرآن الكريم لبناء التصور الإسلامي الكامل وحفظ الشريعة."
      },
      {
        "id": "as_ks_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: عبقرية الإسناد ومنهج المحدثين في نقد الروايات",
        "titleEn": "Genius of Isnad & Hadith Scholars' Critical Methodology",
        "durationFormatted": "46:15",
        "audioUrl": "https://archive.org/download/hadith_/2.mp3",
        "summaryAr": "كيف حُفظت السنة النبوية بأدق معايير التوثيق التاريخي في الحضارة الإنسانية."
      },
      {
        "id": "as_ks_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: تفكيك شبهات الطاعنين في السنة وحجية خبر الآحاد",
        "titleEn": "Refuting Doubts Against Sunnah & Authentic Reports",
        "durationFormatted": "48:50",
        "audioUrl": "https://archive.org/download/hadith_/3.mp3",
        "summaryAr": "الرد العلمي الرصين على الدعاوى المعاصرة المشككة في دواوين السنة الصحيحة."
      },
      {
        "id": "as_ks_04",
        "episodeNumber": 4,
        "titleAr": "المحاضرة 4: خطة عملية لطالب العلم في التحصيل وملازمة الوحي",
        "titleEn": "Practical Roadmap for Seeking Knowledge & Revelation",
        "durationFormatted": "44:10",
        "audioUrl": "https://archive.org/download/hadith_/4.mp3",
        "summaryAr": "خارطة طريق متدرجة للانتقال من التشتت المعرفي إلى البناء العلمي والعملي المتين."
      }
    ]
  },
  {
    "id": "series_anwar_seerah",
    "scholarId": "ahmed_al_sayed",
    "titleAr": "السيرة النبوية للمصلحين: بناء الشخصية القيادية والفتح",
    "titleEn": "Prophetic Seerah for Reformers: Leadership & Victory",
    "sheikhAr": "الشيخ أحمد بن يوسف السيد",
    "sheikhEn": "Sheikh Ahmad Al-Sayed",
    "category": "siyra",
    "badgeAr": "سيرة المصلحين • حلقتان",
    "badgeEn": "Reformers' Seerah • 2 Episodes",
    "icon": "🕌",
    "descriptionAr": "قراءة إصلاحية عميقة في أحداث السيرة النبوية الشريفة لاستلهام فقه القيادة، الصبر الاستراتيجي، وأخلاق الفتح.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "as_sn_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: السيرة النبوية للمصلحين - عمرة القضاء ومعركة مؤتة",
        "titleEn": "Seerah for Reformers: Umrah of Fulfillment & Battle of Mu'tah",
        "durationFormatted": "55:10",
        "audioUrl": "https://archive.org/download/mp-3-160-k_20240824_1419/%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%D8%A9%20%D8%A7%D9%84%D9%86%D8%A8%D9%88%D9%8A%D8%A9%20%D9%84%D9%84%D9%85%D8%B5%D9%84%D8%AD%D9%8A%D9%86%20%D9%A3%D9%A0%20_%20%D8%B9%D9%85%D8%B1%D8%A9%20%D8%A7%D9%84%D9%82%D8%B6%D8%A7%D8%A1%20%D9%88%D9%85%D8%B9%D8%B1%D9%83%D8%A9%20%D9%85%D8%A4%D8%AA%D8%A9%20_%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%A7%D9%84%D8%B3%D9%8A%D8%AF%28MP3_160K%29.mp3",
        "summaryAr": "كيف أثمر صلح الحديبية نصراً سياسياً ودعوياً في عمرة القضاء، وبطولة قادة مؤتة الثلاثة وخالد بن الوليد."
      },
      {
        "id": "as_sn_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: السيرة النبوية للمصلحين - فتح مكة المكرمة وعفو القادرين",
        "titleEn": "Seerah for Reformers: Conquest of Makkah & Noble Forgiveness",
        "durationFormatted": "55:15",
        "audioUrl": "https://archive.org/download/mp-3-160-k_20240824_1424/%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%D8%A9%20%D8%A7%D9%84%D9%86%D8%A8%D9%88%D9%8A%D8%A9%20%D9%84%D9%84%D9%85%D8%B5%D9%84%D8%AD%D9%8A%D9%86%20%D9%A3%D9%A1%20_%20%D9%81%D8%AA%D8%AD%20%D9%85%D9%83%D8%A9%20_%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%A7%D9%84%D8%B3%D9%8A%D8%AF%28MP3_160K%29.mp3",
        "summaryAr": "دخول النبي ﷺ مكة مطأطئاً رأسه تواضعاً لله، تطهير البيت الحرام من الأوثان، وقولته الخالدة: اذهبوا فأنتم الطلقاء."
      }
    ]
  },
  {
    "id": "series_tareeq_najah",
    "scholarId": "hazem_shouman",
    "titleAr": "طريق النجاة: التوبة الصادقة وإحياء القلوب",
    "titleEn": "Path to Salvation: Sincere Repentance & Heart Revival",
    "sheikhAr": "د. حازم شومان",
    "sheikhEn": "Dr. Hazem Shouman",
    "category": "khutbah",
    "badgeAr": "مواعظ حية • 3 محاضرات",
    "badgeEn": "Heart Awakening • 3 Lectures",
    "icon": "🔥",
    "descriptionAr": "خطاب إيماني حيوي ملتهب يوقظ القلب من رقدة الغفلة، ويدعو للتوبة الصادقة وبدء حياة جديدة مليئة بالطاعة والنور.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "hs_tn_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: فِرَّ إلى الله: حان وقت كسر قيود الغفلة",
        "titleEn": "Flee to Allah: Breaking the Chains of Heedlessness",
        "durationFormatted": "36:45",
        "audioUrl": "https://archive.org/download/dr___hazem-shoman-mp3/1.mp3",
        "summaryAr": "استيقظ قبل فوات الأوان؛ نداء التوبة العاجل وعظمة مغفرة الله التي تسع كل الذنوب لمن صدق."
      },
      {
        "id": "hs_tn_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: روشتة عملية للثبات والتخلص من ذنوب الخلوات",
        "titleEn": "Prescription for Steadfastness Against Secret Sins",
        "durationFormatted": "40:15",
        "audioUrl": "https://archive.org/download/dr___hazem-shoman-mp3/2.mp3",
        "summaryAr": "مراقبة الله في السر والعلن، خطوات عملية لسد منافذ وسوسة الشيطان واستبدال المعصية بلذة الطاعة."
      },
      {
        "id": "hs_tn_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: أول يوم في الجنة: نعيم لا يفنى ورؤية وجه الله",
        "titleEn": "First Day in Paradise: Eternal Bliss",
        "durationFormatted": "38:20",
        "audioUrl": "https://archive.org/download/dr___hazem-shoman-mp3/3.mp3",
        "summaryAr": "وصف جنات النعيم ولقاء الأحبه في الفردوس الأعلى، شحذ الهمم وتهوين مصائب الدنيا في جنب الآخرة."
      }
    ]
  },
  {
    "id": "series_asrar_salah",
    "scholarId": "hazem_shouman",
    "titleAr": "سلسلة محتاج أصلي: أسرار الخشوع والتلذذ بالصلاة",
    "titleEn": "I Need to Pray: Secrets of Khushu in Salah",
    "sheikhAr": "د. حازم شومان",
    "sheikhEn": "Dr. Hazem Shouman",
    "category": "fiqh",
    "badgeAr": "محتاج أصلي • 4 محاضرات",
    "badgeEn": "Secrets of Salah • 4 Lectures",
    "icon": "🤲",
    "descriptionAr": "سلسلة (محتاج أصلي) الشهيرة للدكتور حازم شومان؛ كيف تحول صلاتك إلى جنة روحية وسكينة تناجي بها ملك الملوك.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "hs_sl_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: محتاج أصلي (1) - معجزة الركعتين وبداية الطريق",
        "titleEn": "I Need to Pray (1): The Miracle of Two Rakat",
        "durationFormatted": "35:10",
        "audioUrl": "https://archive.org/download/way2sona_20160330_2010/1--.mp3",
        "summaryAr": "لماذا نصلي؟ كيف تفتح لك ركعتان صادقتان أبواب الفرج والسكينة والبركة في الدنيا والآخرة."
      },
      {
        "id": "hs_sl_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: محتاج أصلي (2) - أسرار سورة الفاتحة ومناجاة الرحمن",
        "titleEn": "I Need to Pray (2): Secrets of Al-Fatihah & Intimacy",
        "durationFormatted": "37:55",
        "audioUrl": "https://archive.org/download/way2sona_20160330_2010/2--.mp3",
        "summaryAr": "استشعار جواب الله لك في كل آية من الفاتحة: «حمدني عبدي... أثنى علي عبدي»؛ حياة القلب بالقرآن."
      },
      {
        "id": "hs_sl_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: محتاج أصلي (3) - وليمة كل صلاة ولذة الركوع والسجود",
        "titleEn": "I Need to Pray (3): The Spiritual Banquet of Every Salah",
        "durationFormatted": "39:30",
        "audioUrl": "https://archive.org/download/way2sona_20160330_2010/3---.mp3",
        "summaryAr": "أقرب ما يكون العبد من ربه وهو ساجد؛ كيف تذوق حلاوة الانكسار والخضوع بين يدي الله."
      },
      {
        "id": "hs_sl_04",
        "episodeNumber": 4,
        "titleAr": "المحاضرة 4: محتاج أصلي (4) - أتدرون بين يدي من أقوم؟",
        "titleEn": "I Need to Pray (4): Do You Know Before Whom I Stand?",
        "durationFormatted": "41:00",
        "audioUrl": "https://archive.org/download/way2sona_20160330_2010/4--.mp3",
        "summaryAr": "استحضار عظمة الله وجلاله عند تكبيرة الإحرام، وكيف كان السلف يقفون في صلاتهم كأنهم يرون الآخرة."
      }
    ]
  },
  {
    "id": "series_qunaibi_tarbiyah",
    "scholarId": "eyad_qunaibi",
    "titleAr": "صناعة التفاؤل والعمل الإيجابي وإصلاح الماضي",
    "titleEn": "Cultivating Optimism, Positive Action & Reforming the Past",
    "sheikhAr": "د. إياد قنيبي",
    "sheikhEn": "Dr. Eyad Qunaibi",
    "category": "mindset",
    "badgeAr": "بناء الذات • 3 محاضرات",
    "badgeEn": "Self Renewal • 3 Lectures",
    "icon": "🌱",
    "descriptionAr": "محاضرات تربوية ونفسية إيمانية لاستثمار العمر والأسرة في صفقة رابحة مع الله، وتحويل المشاعر السلبية إلى قوة دافعة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "eq_tb_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: صفقة رابحة مع الله واستثمار العمر والأبناء في الطاعة",
        "titleEn": "A Profitable Deal with Allah: Investing Life & Family",
        "durationFormatted": "28:15",
        "audioUrl": "https://archive.org/download/quraanhaya/12-%20%D8%B5%D9%81%D9%82%D8%A9%20%D8%B1%D8%A7%D8%A8%D8%AD%D8%A9.mp3",
        "summaryAr": "إن الله اشترى من المؤمنين أنفسهم وأموالهم بأن لهم الجنة؛ كيف نجعل حياتنا وأسرنا وقفاً لمرضاة الله."
      },
      {
        "id": "eq_tb_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: إصلاح أخطاء الماضي وبدء صفحة إيمانية مشرقة",
        "titleEn": "Reforming Past Mistakes & Starting a Bright Faith Chapter",
        "durationFormatted": "31:00",
        "audioUrl": "https://archive.org/download/quraanhaya/16-%20%D8%A5%D8%B5%D9%84%D8%A7%D8%AD%20%D8%A3%D8%AE%D8%B7%D8%A7%D8%A1%20%D8%A7%D9%84%D9%85%D8%A7%D8%B6%D9%8A.mp3",
        "summaryAr": "التحرر من جلد الذات المقعد عن العمل، وكيف يبدل الله السيئات حسنات بالتوبة الصادقة والعمل الصالح."
      },
      {
        "id": "eq_tb_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: تحويل الشعور السلبي والألم إلى قوة دافعة للبناء",
        "titleEn": "Transforming Negative Feelings into Constructive Drive",
        "durationFormatted": "29:40",
        "audioUrl": "https://archive.org/download/hosnzan/15-%20%D8%AD%D9%88%D9%84%20%D8%A7%D9%84%D8%B4%D8%B9%D9%88%D8%B1%20%D8%A7%D9%84%D8%B3%D9%84%D8%A8%D9%8A%20%D8%A5%D9%84%D9%89%20%D9%82%D9%88%D8%A9%20%D8%AF%D8%A7%D9%81%D8%B9%D8%A9.mp3",
        "summaryAr": "من روائع سلسلة حسن الظن بالله؛ كيف يصنع المؤمن من الحزن والابتلاء وقوداً للإنجاز ونفع الأمة."
      }
    ]
  }
];
