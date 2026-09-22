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
    id: 'abdurrazzaq_badr',
    nameAr: 'الشيخ عبد الرزاق البدر',
    nameEn: 'Sheikh Abdur Razzaq Al-Badr',
    avatarEmoji: '🌟',
    specialityAr: 'فقه الأسماء الحسنى، تزكية النفوس، وفقه الأدعية والأذكار',
    descriptionAr: 'شروحات مؤصلة لكتب أئمة الدعوة وابن القيم وابن تيمية في تطهير القلوب والتوحيد.',
    category: 'tazkiyah',
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
        "audioUrl": "https://archive.org/download/ben1-130/0001.mp3",
        "summaryAr": "شرح حديث عمر بن الخطاب؛ حقيقة الإخلاص وكيف تصبح العادات اليومية والرياضة طاعات مأجورة."
      },
      {
        "id": "iu_ep_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: باب التوبة وشروط الرجوع الصادق إلى الله",
        "titleEn": "Repentance and Returning to Allah",
        "durationFormatted": "29:45",
        "audioUrl": "https://archive.org/download/ben1-130/0002.mp3",
        "summaryAr": "سعة رحمة الله تعالى وقبول التوبة من التائبين، والتخلص من الإصرار على المعاصي."
      },
      {
        "id": "iu_ep_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: باب الصبر عند الصدمة الأولى وقوة التحمل",
        "titleEn": "Patience and Resilience",
        "durationFormatted": "33:10",
        "audioUrl": "https://archive.org/download/ben1-130/0003.mp3",
        "summaryAr": "أنواع الصبر الثلاثة: على طاعة الله، وعن معصية الله، وعلى أقدار الله المؤلمة بالرضا والاحتساب."
      },
      {
        "id": "iu_ep_04",
        "episodeNumber": 4,
        "titleAr": "الدرس 4: باب الصدق واليقين في المعاملة والقول",
        "titleEn": "Truthfulness and Firm Certainty",
        "durationFormatted": "28:50",
        "audioUrl": "https://archive.org/download/ben1-130/0004.mp3",
        "summaryAr": "الصدق يهدي إلى البر وإن البر يهدي إلى الجنة؛ بناء شخصية المسلم المستقيمة في السر والعلن."
      }
    ]
  },
  {
    "id": "series_asmaa_badr",
    "titleAr": "شرح العقيدة الواسطية وتثبيت التوحيد",
    "titleEn": "Commentary on Al-Aqidah Al-Wasitiyyah",
    "sheikhAr": "الشيخ عبد الرزاق البدر",
    "sheikhEn": "Sheikh Abdur-Razzaq Al-Badr",
    "category": "tazkiyah",
    "badgeAr": "توحيد وإيمان • 4 حلقات",
    "badgeEn": "Creed & Faith • 4 Episodes",
    "icon": "💎",
    "descriptionAr": "دروس تأصيلية ترسي في القلب قواعد الإيمان بالأسماء والصفات والتوكل على الله ومحبة الشريعة.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "ab_ep_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: مقدمة في أصول الإيمان والتوحيد الخالص",
        "titleEn": "Fundamentals of Faith and Sincere Monotheism",
        "durationFormatted": "45:10",
        "audioUrl": "https://archive.org/download/wasetia_Badr/001.mp3",
        "summaryAr": "أهمية تعلم التوحيد وأثره على طمأنينة القلب وثبات المؤمن أمام تقلبات الحياة."
      },
      {
        "id": "ab_ep_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: معتقد أهل السنة والجماعة والفرقة الناجية",
        "titleEn": "The Creed of Ahlus-Sunnah wal-Jamaah",
        "durationFormatted": "42:30",
        "audioUrl": "https://archive.org/download/wasetia_Badr/002.mp3",
        "summaryAr": "الوسطية والاعتدال في فهم نصوص الوحي ومتابعة هدي السلف الصالح دون إفراط أو تفريط."
      },
      {
        "id": "ab_ep_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: آيات الأسماء الحسنى وعظمة الخالق سبحانه",
        "titleEn": "Verses of the Divine Names and Grandeur",
        "durationFormatted": "39:50",
        "audioUrl": "https://archive.org/download/wasetia_Badr/003.mp3",
        "summaryAr": "تدبر أسماء الله الحسنى وأثر معرفتها في زيادة خشية العبد وحسن مناجاته لربه."
      },
      {
        "id": "ab_ep_04",
        "episodeNumber": 4,
        "titleAr": "الدرس 4: تنزيه الله ومحبته وكمال صفاته العلا",
        "titleEn": "Exaltation and Love of the Creator",
        "durationFormatted": "44:15",
        "audioUrl": "https://archive.org/download/wasetia_Badr/004.mp3",
        "summaryAr": "الجمع بين المحبة والرجاء والخوف في عبادة الله، واستمداد القوة والعزة من جنابه العظيم."
      }
    ]
  },
  {
    "id": "series_halawat_iman_haj",
    "titleAr": "مدارج السالكين وتزكية القلوب",
    "titleEn": "Madarij as-Salikin & Soul Purification",
    "sheikhAr": "الشيخ محمد سيد حاج (رحمه الله)",
    "sheikhEn": "Sheikh Muhammad Sayed Haj",
    "category": "tazkiyah",
    "badgeAr": "رقائق وتزكية • 4 حلقات",
    "badgeEn": "Heart Softeners • 4 Episodes",
    "icon": "✨",
    "descriptionAr": "مواعظ مؤثرة بأسلوب الشيخ الآسر؛ منازل إياك نعبد وإياك نستعين، والتخلص من أمراض القلوب والشبهات.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "msh_ep_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: مقدمة مدارج السالكين ومنزلة اليقظة",
        "titleEn": "Awakening of the Heart in the Shade of Revelation",
        "durationFormatted": "51:20",
        "audioUrl": "https://archive.org/download/Hajj-madarij/01.mp3",
        "summaryAr": "انتباه القلب من رقدة الغفلة وملاحظة نعم الله ومطالعة جناية النفس والتقصير."
      },
      {
        "id": "msh_ep_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: منزلة التوبة الصادقة والإنابة إلى الله",
        "titleEn": "Sincere Repentance and Returning to Allah",
        "durationFormatted": "48:30",
        "audioUrl": "https://archive.org/download/Hajj-madarij/02.mp3",
        "summaryAr": "شروط التوبة النصوح، تذوق حلاوة القرب من الله، وتطهير الصحائف بالاستغفار والعمل الصالح."
      },
      {
        "id": "msh_ep_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: منزلة المحاسبة وعمارة الباطن بالتقوى",
        "titleEn": "Self-Accountability and Inner Piety",
        "durationFormatted": "46:15",
        "audioUrl": "https://archive.org/download/Hajj-madarij/03.mp3",
        "summaryAr": "حاسبوا أنفسكم قبل أن تحاسبوا؛ تمييز ما للعبد وما عليه وتثبيت القدم على الصراط المستقيم."
      },
      {
        "id": "msh_ep_04",
        "episodeNumber": 4,
        "titleAr": "المجلس 4: منزلة الإنابة والتوكل الكامل على الله",
        "titleEn": "Reliance and Devotion to the Almighty",
        "durationFormatted": "53:40",
        "audioUrl": "https://archive.org/download/Hajj-madarij/04.mp3",
        "summaryAr": "تفريغ القلب من التعلق بغير الله والاعتماد الصادق عليه في قضاء الحوائج وتفريج الكروب."
      }
    ]
  },
  {
    "id": "series_fiqh_nafs_amjad_samir",
    "titleAr": "فقه النفس وتزكية القلوب - صلح الحديبية",
    "titleEn": "Self-Discipline & Inner Healing",
    "sheikhAr": "الشيخ أحمد سمير",
    "sheikhEn": "Sheikh Ahmed Samir",
    "category": "tazkiyah",
    "badgeAr": "فقه النفس • حلقتان",
    "badgeEn": "Inner Insight • 2 Episodes",
    "icon": "🌿",
    "descriptionAr": "دروس تطبيقية عميقة في استيعاب نوازع النفس في أوقات الأزمات، من وحي صلح الحديبية وثبات النبي ﷺ.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "as_ep_01",
        "episodeNumber": 1,
        "titleAr": "مجلس 1: صلح الحديبية وفقه النفوس والتسليم لله",
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
        "titleAr": "الدرس 1: معالم اعتقاد السلف في التوحيد والرسالة",
        "titleEn": "The Creed of the Early Muslims in Monotheism",
        "durationFormatted": "36:40",
        "audioUrl": "https://archive.org/download/xboxgamer-4644/e3tqad-sfyan01.mp3",
        "summaryAr": "بيان أسس العقيدة السلفية النقية في الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر."
      },
      {
        "id": "at_ep_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الإيمان بالقدر وحكمة الله في خلقه وأمره",
        "titleEn": "Faith in Divine Decree and Divine Wisdom",
        "durationFormatted": "38:15",
        "audioUrl": "https://archive.org/download/xboxgamer-4644/e3tqad-sfyan02.mp3",
        "summaryAr": "كيف يثمر الإيمان بالقدر شجاعة في النفس وسكينة عند المصائب، وترك الجزع والاعتراض."
      },
      {
        "id": "at_ep_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: استعن بالله ولا تعجز - مفتاح القوة والعزيمة",
        "titleEn": "Seek Allah’s Help and Do Not Falter",
        "durationFormatted": "41:10",
        "audioUrl": "https://archive.org/download/xboxgamer-4644/e3tqad-sfyan03.mp3",
        "summaryAr": "شرح وصية النبي ﷺ الجامعة؛ التحرر من العجز والكسل، وبذل الأسباب مع صدق التوكل."
      }
    ]
  },
  {
    "id": "series_raqaiq_quran_sakran",
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
        "titleAr": "الحلقة 3: أولا يرون أنهم يفتنون في كل عام - الاعتبار بالأقدار",
        "titleEn": "Taking Heed from Life Trials and Ups and Downs",
        "durationFormatted": "42:10",
        "audioUrl": "https://archive.org/download/Mo1440abo3mr/%D8%AC%D8%A7%D9%85%D8%B9%20%D8%A7%D9%84%D9%88%D8%A7%D8%A8%D9%84%20-%20%D9%85%D8%AD%D8%A7%D8%B6%D8%B1%D8%A9%20%D8%A8%D8%B9%D9%86%D9%88%D8%A7%D9%86%20%D8%A3%D9%88%D9%84%D8%A7%20%D9%8A%D8%B1%D9%88%D9%86%20%D8%A3%D9%86%D9%87%D9%85%20%D9%8A%D9%81%D8%AA%D9%86%D9%88%D9%86%20%D9%81%D9%8A%20%D9%83%D9%84%20%D8%B9%D8%A7%D9%85%20%D9%85%D8%B1%D8%A9%20%D8%A3%D9%88%20%D9%85%D8%B1%D8%AA%D9%8A%D9%86%20%D9%84%D9%84%D8%B4%D9%8A%D8%AE%20%D8%A5%D8%A8%D8%B1%D8%A7%D9%87%D9%8A%D9%85%20%D8%A7%D9%84%D8%B3%D9%83%D8%B1%D8%A7%D9%86.mp3",
        "summaryAr": "تفسير سنن الابتلاء والتمحيص، وكيف يستيقظ القلب المؤمن من غفلته ليتدارك أيامه وأهدافه."
      }
    ]
  },
  {
    "id": "series_tadabbur_abdelmonem",
    "titleAr": "مجالس تدبر القرآن العظيم وبصائر الهداية",
    "titleEn": "Quranic Contemplation - Surah Al-Kahf",
    "sheikhAr": "د. أحمد عبد المنعم",
    "sheikhEn": "Dr. Ahmed Abdelmonem",
    "category": "tafseer",
    "badgeAr": "تدبر قرآني • 4 حلقات",
    "badgeEn": "Quran Tafsir • 4 Episodes",
    "icon": "📖",
    "descriptionAr": "مجالس إيمانية تأخذ بيدك للغوص في أسرار سورة الكهف وقصصها الأربع، وكيف تعصم المؤمن من فتن الزمان.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "adm_ep_01",
        "episodeNumber": 1,
        "titleAr": "مجلس 1: مقدمة هامة في مفاتيح تدبر سورة الكهف والقرآن",
        "titleEn": "Introduction & Keys to Contemplating Surah Al-Kahf",
        "durationFormatted": "35:20",
        "audioUrl": "https://archive.org/download/Majales-elQuran-surat-elkahf_Ahmed-Abdelmoneem-mp3/001-%D8%AA%D9%81%D8%B3%D9%8A%D8%B1%20%D8%B3%D9%88%D8%B1%D8%A9%20%D8%A7%D9%84%D9%83%D9%87%D9%81%20(1)%20%D9%85%D9%82%D8%AF%D9%85%D8%A9%20%D9%87%D8%A7%D9%85%D8%A9%20_%20%D8%A7%D9%84%D8%AF%D9%83%D8%AA%D9%88%D8%B1%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "كيف نتجاوز التلاوة العابرة إلى التلقي والعمل، ومقاصد سورة الكهف في العصمة من الفتن."
      },
      {
        "id": "adm_ep_02",
        "episodeNumber": 2,
        "titleAr": "مجلس 2: قصة أصحاب الكهف - الثبات والفرار بالدين",
        "titleEn": "Story of the Companions of the Cave: Firmness & Faith",
        "durationFormatted": "38:10",
        "audioUrl": "https://archive.org/download/Majales-elQuran-surat-elkahf_Ahmed-Abdelmoneem-mp3/002-%D8%AA%D9%81%D8%B3%D9%8A%D8%B1%20%D8%B3%D9%88%D8%B1%D8%A9%20%D8%A7%D9%84%D9%83%D9%87%D9%81%20(2)%20%D9%82%D8%B5%D8%A9%20%D8%A3%D8%B5%D8%AD%D8%A7%D8%A8%20%D8%A7%D9%84%D9%83%D9%87%D9%81%20_%20%D8%A7%D9%84%D8%AF%D9%83%D8%AA%D9%88%D8%B1%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "فتية آمنوا بربهم وزدناهم هدى؛ كيف يحفظ الله عباده الصادقين في أوقات الغربة والابتلاء."
      },
      {
        "id": "adm_ep_03",
        "episodeNumber": 3,
        "titleAr": "مجلس 3: قصة صاحب الجنتين - فتنة المال والغرور الزائف",
        "titleEn": "Story of the Two Gardens: Pitfalls of Arrogance & Wealth",
        "durationFormatted": "34:45",
        "audioUrl": "https://archive.org/download/Majales-elQuran-surat-elkahf_Ahmed-Abdelmoneem-mp3/003-%D8%AA%D9%81%D8%B3%D9%8A%D8%B1%20%D8%B3%D9%88%D8%B1%D8%A9%20%D8%A7%D9%84%D9%83%D9%87%D9%81%20(3)%20%D8%B5%D8%A7%D8%AD%D8%A8%20%D8%A7%D9%84%D8%AC%D9%86%D8%AA%D9%8A%D9%86%20_%20%D8%A7%D9%84%D8%AF%D9%83%D8%AA%D9%88%D8%B1%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "واضرب لهم مثل رجلين؛ خطورة نسيان المنعم والانغماس في الماديات، واليقين بزوال الدنيا."
      },
      {
        "id": "adm_ep_04",
        "episodeNumber": 4,
        "titleAr": "مجلس 4: قصة موسى والعبد الصالح - الصبر على أقدار الله",
        "titleEn": "Moses & Al-Khidr: Patience with Divine Decrees",
        "durationFormatted": "41:15",
        "audioUrl": "https://archive.org/download/Majales-elQuran-surat-elkahf_Ahmed-Abdelmoneem-mp3/004-%D8%AA%D9%81%D8%B3%D9%8A%D8%B1%20%D8%B3%D9%88%D8%B1%D8%A9%20%D8%A7%D9%84%D9%83%D9%87%D9%81%20(4)%20%D9%82%D8%B5%D8%A9%20%D8%B3%D9%8A%D8%AF%D9%86%D8%A7%20%D9%85%D9%88%D8%B3%D9%89%20%D9%88%D8%A7%D9%84%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B5%D8%A7%D9%84%D8%AD%20_%20%D8%A7%D9%84%D8%AF%D9%83%D8%AA%D9%88%D8%B1%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3",
        "summaryAr": "أسرار الحكمة الإلهية الخفية في الأقدار المؤلمة، والتواضع في طلب العلم وحسن الظن بالله."
      }
    ]
  },
  {
    "id": "series_rehlat_yaqeen_qunaibi",
    "titleAr": "رحلة اليقين وبناء المناعة الفكرية والصلابة العقدية",
    "titleEn": "Journey of Certainty - Intellectual Resilience",
    "sheikhAr": "د. إياد قنيبي",
    "sheikhEn": "Dr. Eyad Qunaibi",
    "category": "mindset",
    "badgeAr": "يقين وعقل • 4 حلقات",
    "badgeEn": "Certainty & Intellect • 4 Episodes",
    "icon": "🔬",
    "descriptionAr": "سلسلة علمية منهجية تخاطب العقل والفطرة، تفكك الشبهات المعاصرة وتبني يقيناً راسخاً لا تهزه عواصف التشكيك.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "yq_ep_01",
        "episodeNumber": 1,
        "titleAr": "الحلقة 1: رحلة اليقين - بناء الدعائم وأسس المنهج العلمي",
        "titleEn": "Building Foundations of Rational Certainty",
        "durationFormatted": "28:30",
        "audioUrl": "https://archive.org/download/yaqin_202001/%281%29%20%D8%B1%D8%AD%D9%84%D8%A9%20%D8%A7%D9%84%D9%8A%D9%82%D9%8A%D9%86%20_%20%D8%A8%D9%86%D8%A7%D8%A1%20%D8%A7%D9%84%D8%AF%D8%B9%D8%A7%D9%8A%D9%94%D9%85.mp3",
        "summaryAr": "تأسيس منهج البحث الصادق عن الحق، التمييز بين العلم الحقيقي والدعاوى الأيديولوجية الزائفة."
      },
      {
        "id": "yq_ep_02",
        "episodeNumber": 2,
        "titleAr": "الحلقة 2: خلاصة الأدلة الفطرية على وجود الخالق ومناقشة الاعتراضات",
        "titleEn": "Innate Evidences for the Creator",
        "durationFormatted": "31:15",
        "audioUrl": "https://archive.org/download/yaqin_202001/%2812%29%20%D8%B1%D8%AD%D9%84%D8%A9%20%D8%A7%D9%84%D9%8A%D9%82%D9%8A%D9%86%20%D9%A1%D9%A2-%20%D8%AE%D9%84%D8%A7%D8%B5%D8%A9%20%D8%AD%D9%84%D9%82%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A3%D8%AF%D9%84%D8%A9%20%D8%A7%D9%84%D9%81%D8%B7%D8%B1%D9%8A%D8%A9%20%D8%B9%D9%84%D9%89%20%D9%88%D8%AC%D9%88%D8%AF%20%D8%A7%D9%84%D9%84%D9%87%20%D9%88%D9%85%D9%86%D8%A7%D9%82%D8%B4%D8%A9%20%D8%A7%D9%84%D8%A5%D8%B9%D8%AA%D8%B1%D8%A7%D8%B6%D8%A7%D8%AA.mp3",
        "summaryAr": "برهان الفطرة، شهادة الوجدان والضمير الإنساني، والرد المحكم على مغالطات المادية والعدمية."
      },
      {
        "id": "yq_ep_03",
        "episodeNumber": 3,
        "titleAr": "الحلقة 3: هل هناك دليل من العلم التجريبي على وجود الله؟",
        "titleEn": "Empirical Evidence for the Creator",
        "durationFormatted": "34:20",
        "audioUrl": "https://archive.org/download/yaqin_202001/%2813%29%20%D8%B1%D8%AD%D9%84%D8%A9%20%D8%A7%D9%84%D9%8A%D9%82%D9%8A%D9%86%20%D9%A1%D9%A3-%20%D9%87%D9%84%20%D9%87%D9%86%D8%A7%D9%83%20%D8%AF%D9%84%D9%8A%D9%84%20%D9%85%D9%86%20%D8%A7%D9%84%D8%B9%D9%84%D9%85%20%D8%B9%D9%84%D9%89%20%D9%88%D8%AC%D9%88%D8%AF%20%D8%A7%D9%84%D9%84%D9%87%D8%9F.mp3",
        "summaryAr": "دلالات الضبط الدقيق في قوانين الفيزياء والبيولوجيا، واستحالة نشأة الحياة والنظام بالصدفة العمياء."
      },
      {
        "id": "yq_ep_04",
        "episodeNumber": 4,
        "titleAr": "الحلقة 4: الله غيب - هل معناه أن وجوده غير يقيني؟",
        "titleEn": "The Unseen and Certainty of Existence",
        "durationFormatted": "29:50",
        "audioUrl": "https://archive.org/download/yaqin_202001/%2814%29%20%D8%B1%D8%AD%D9%84%D8%A9%20%D8%A7%D9%84%D9%8A%D9%82%D9%8A%D9%86%20%D9%A1%D9%A4-%20%D8%A7%D9%84%D9%84%D9%87%20%D8%BA%D9%8A%D8%A8.%20%D9%87%D9%84%20%D9%85%D8%B9%D9%86%D8%A7%D9%87%20%D8%A3%D9%86%20%D9%88%D8%AC%D9%88%D8%AF%D9%87%20%D8%BA%D9%8A%D8%B1%20%D9%8A%D9%82%D9%8A%D9%86%D9%8A%20%D8%9F.mp3",
        "summaryAr": "تفنيد مغالطة حصر المعرفة في الحواس المادية المجردة، والبرهان العقلي القطعي على كمال الخالق."
      }
    ]
  },
  {
    "id": "series_himma_samir",
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
        "titleAr": "مجلس 1: شرح حديث من هم بحسنة - عظمة فضل الله ومبادرة الهمة",
        "titleEn": "Hadith of Good Intentions & High Zeal",
        "durationFormatted": "34:20",
        "audioUrl": "https://archive.org/download/mn-hm-samir/mn-hm-samir.mp3",
        "summaryAr": "همة تناطح السحاب في الطاعة، كيف تكتب لك النية الصادقة أجور العابدين والمجاهدين والمحسنين."
      },
      {
        "id": "sm_ep_02",
        "episodeNumber": 2,
        "titleAr": "مجلس 2: استغلال الأوقات والإجازة - بناء الذات وترك البطالة",
        "titleEn": "Time Mastery & Overcoming Idleness",
        "durationFormatted": "29:50",
        "audioUrl": "https://archive.org/download/samir-4-6/agazaa-samir.mp3",
        "summaryAr": "الوقت هو الحياة؛ كيف تكسر قيود الفراغ والكسل وتبني مشاريعك العلمية والبدنية بقوة العزيمة."
      },
      {
        "id": "sm_ep_03",
        "episodeNumber": 3,
        "titleAr": "مجلس 3: قبل أن تهدم الكعبة - المبادرة بالأعمال الصالحة",
        "titleEn": "Urgency in Righteous Deeds Before Tribulations",
        "durationFormatted": "37:10",
        "audioUrl": "https://archive.org/download/k3bah-samir/k3bah.mp3",
        "summaryAr": "بادروا بالأعمال فتناً كقطع الليل المظلم؛ التحذير الصادق من التسويف والتأجيل في التوبة والعمل."
      }
    ]
  },
  {
    "id": "series_waay_ayman_abdelrahim",
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
        "audioUrl": "https://archive.org/download/Establishing_contemporary_Muslim_awareness/01.mp3",
        "summaryAr": "تفكيك عقدة النقص الحضارية، وموقع المسلم المعاصر من الهيمنة الفكرية الغربية، وضرورة التحرر المعرفي."
      },
      {
        "id": "aa_ep_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: طبيعة الصراع ومنظومة القيم الإسلامية",
        "titleEn": "The Nature of Conflict and Islamic Values",
        "durationFormatted": "52:10",
        "audioUrl": "https://archive.org/download/Establishing_contemporary_Muslim_awareness/02.mp3",
        "summaryAr": "كيف يصوغ الوحي نظرة المسلم للكون والإنسان والحياة، ومقاصد الشريعة في بناء العمران."
      },
      {
        "id": "aa_ep_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: سنن التاريخ والاجتماع البشري في ضوء الوحي",
        "titleEn": "Societal Laws of History in Revelation",
        "durationFormatted": "46:40",
        "audioUrl": "https://archive.org/download/Establishing_contemporary_Muslim_awareness/03.mp3",
        "summaryAr": "سنن الصعود والسقوط للأمم، ولماذا تتكرر الأخطاء عبر العصور، والوعي بالسنن الكونية."
      },
      {
        "id": "aa_ep_04",
        "episodeNumber": 4,
        "titleAr": "المحاضرة 4: بناء الشخصية المتزنة ومواجهة الاستلاب",
        "titleEn": "Balanced Character Building",
        "durationFormatted": "54:15",
        "audioUrl": "https://archive.org/download/Establishing_contemporary_Muslim_awareness/04.mp3",
        "summaryAr": "التوازن بين العقل والقلب والسلوك، وحراسة الهوية في زمن السيولة الثقافية والشبهات."
      },
      {
        "id": "aa_ep_05",
        "episodeNumber": 5,
        "titleAr": "المحاضرة 5: معالم النهوض ومسؤولية الفرد المسلم",
        "titleEn": "Roadmap for Revival and Individual Duty",
        "durationFormatted": "49:50",
        "audioUrl": "https://archive.org/download/Establishing_contemporary_Muslim_awareness/05.mp3",
        "summaryAr": "خارطة طريق عملية لكل شاب: التعلم الذاتي، التزكية، ونفع الأمة بالعمل المتقن."
      }
    ]
  },
  {
    "id": "series_barahin_haitham_talaat",
    "titleAr": "براهين اليقين والمناعة العقدية ونقد المادية والإلحاد",
    "titleEn": "Proofs of Certainty & Refuting Materialism",
    "sheikhAr": "د. هيثم طلعت",
    "sheikhEn": "Dr. Haitham Talaat",
    "category": "mindset",
    "badgeAr": "براهين وردود • حلقتان",
    "badgeEn": "Apologetics & Truth • 2 Episodes",
    "icon": "🛡️",
    "descriptionAr": "أدلة عقلية رصينة تدحض الفلسفات الإلحادية والمادية، وتكشف تهافت الشبهات بلغة علمية معاصرة.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "ht_ep_01",
        "episodeNumber": 1,
        "titleAr": "مجلس 1: كيف نحصن قلوبنا من الشبهات ونبني الصلابة الإيمانية",
        "titleEn": "Fortifying Hearts Against Modern Doubts",
        "durationFormatted": "32:40",
        "audioUrl": "https://archive.org/download/media-way2allah-_3832/kef_nhsn_klwbna_mn_alshbhat_tmken_d_hesm_tl3t_ehawrh_d_ebrahem_emam_whsam_mstfe_h_24_-_knaa_alnde.mp3",
        "summaryAr": "قواعد التلقي الواعي، مناعة المسلم العقدية، والرد على الفلسفات المادية بإحكام العقل وبصيرة الفطرة."
      },
      {
        "id": "ht_ep_02",
        "episodeNumber": 2,
        "titleAr": "مجلس 2: براهين حجية السنة النبوية وتثبيت اليقين",
        "titleEn": "Evidences of Prophetic Sunnah Authority",
        "durationFormatted": "36:15",
        "audioUrl": "https://archive.org/download/media-way2allah-_3791/mn_enkr_alsna…_enkr_alkran_tmken_d_hesm_tl3t_ehawrh_d_ebrahem_emam_whsam_mstfe_h18_-_knaa_alnde.mp3",
        "summaryAr": "من ينكر السنة ينكر القرآن؛ براهين النبوة الخالدة وتوثيق الرواية النبوية بأعظم إسناد في تاريخ البشرية."
      }
    ]
  },
  {
    "id": "series_takween_ojairi",
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
    "titleAr": "السيرة النبوية وقصص الأنبياء - معالم العزة والتمكين",
    "titleEn": "Prophetic Seerah & Lessons of Honor",
    "sheikhAr": "الشيخ بدر المشاري",
    "sheikhEn": "Sheikh Badr Al-Meshari",
    "category": "siyra",
    "badgeAr": "سيرة وعبر • 3 حلقات",
    "badgeEn": "Seerah & Lessons • 3 Episodes",
    "icon": "🐎",
    "descriptionAr": "أسلوب قصصي ملحمي يأخذك لقلب الأحداث؛ صبر إبراهيم، بطولات الصحابة، وثبات أهل الحق في وجه الشدائد.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "bm_ep_01",
        "episodeNumber": 1,
        "titleAr": "الحلقة 1: أحداث الفتنة الكبرى ومواقف الصحابة البطولية",
        "titleEn": "The Great Tribulation and Heroic Companions",
        "durationFormatted": "42:30",
        "audioUrl": "https://archive.org/download/20251028_20251028_0842/%D8%A7%D8%AD%D8%AF%D8%A7%D8%AB%20%D8%A7%D9%84%D9%81%D8%AA%D9%86%D9%87%20%D8%A7%D9%84%D9%83%D8%A8%D8%B1%D9%8A.mp3",
        "summaryAr": "سرد ملحمي لمقتل عثمان ومواقف علي ومعاوية والصحابة الكرام بمنهج السلف وبناء العزة والشرف."
      },
      {
        "id": "bm_ep_02",
        "episodeNumber": 2,
        "titleAr": "الحلقة 2: إبراهيم ﷺ وابنه إسماعيل ﷺ - فداء الإيمان وبناء البيت",
        "titleEn": "Abraham & Ishmael: The Sacrifice of Faith",
        "durationFormatted": "39:15",
        "audioUrl": "https://archive.org/download/20251028_20251028_0842/%D8%A7%D8%A8%D8%B1%D8%A7%D9%87%D9%8A%D9%85%20%EF%B7%BA%20%D9%88%D8%A7%D8%A8%D9%86%D9%87%20%D8%A7%D8%B3%D9%85%D8%A7%D8%B9%D9%8A%D9%84%20%EF%B7%BA.mp3",
        "summaryAr": "قصة الخليل إبراهيم عليه السلام، قمة التسليم لأمر الله، وتشييد الكعبة المشرفة في واد غير ذي زرع."
      },
      {
        "id": "bm_ep_03",
        "episodeNumber": 3,
        "titleAr": "الحلقة 3: قصة أصحاب الكهف - فتية آمنوا بربهم وزدناهم هدى",
        "titleEn": "Story of the Cave Companions: Steadfast Youth",
        "durationFormatted": "35:50",
        "audioUrl": "https://archive.org/download/20251028_20251028_0842/%D8%A7%D8%B5%D8%AD%D8%A7%D8%A8%20%D8%A7%D9%84%D9%83%D9%87%D9%81.mp3",
        "summaryAr": "روائع القصص القرآني في الثبات على الإيمان في وجه الطغيان، ومعجزة الرقود والبعث برهاناً للحق."
      }
    ]
  },
  {
    "id": "series_sahabah_haj",
    "titleAr": "سير الفرسان وبطولات الصحابة والتابعين",
    "titleEn": "Biographies of the Companions & Champions",
    "sheikhAr": "الشيخ محمد سيد حاج (رحمه الله)",
    "sheikhEn": "Sheikh Muhammad Sayed Haj",
    "category": "siyra",
    "badgeAr": "سير الأبطال • 3 حلقات",
    "badgeEn": "Heroic Biographies • 3 Episodes",
    "icon": "⚔️",
    "descriptionAr": "رحلة حية مع أبطال الإسلام؛ بطولات خالد بن الوليد، علي بن أبي طالب، وفداء الصحابة في ميادين العزة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sh_ep_01",
        "episodeNumber": 1,
        "titleAr": "الحلقة 1: الهجرة النبوية الشريفة - معالم التخطيط والتوكل والبطولة",
        "titleEn": "The Noble Hijrah: Planning and Divine Reliance",
        "durationFormatted": "47:20",
        "audioUrl": "https://archive.org/download/mohamed_sayed_haj_2013/1.mp3",
        "summaryAr": "دروس عظيمة من هجرة النبي ﷺ وصاحبه الصديق، الأخذ بالأسباب مع تمام التوكل، وبناء مجتمع المدينة."
      },
      {
        "id": "sh_ep_02",
        "episodeNumber": 2,
        "titleAr": "الحلقة 2: سيرة بطل الإسلام علي بن أبي طالب رضي الله عنه (الجزء 1)",
        "titleEn": "Ali ibn Abi Talib: The Lion of Islam (Part 1)",
        "durationFormatted": "49:15",
        "audioUrl": "https://archive.org/download/mohamed_sayed_haj_2013/143140.mp3",
        "summaryAr": "شجاعة علي بن أبي طالب في فراش النبي ليلة الهجرة، ومبارزاته التاريخية في بدر وأحد وخيبر."
      },
      {
        "id": "sh_ep_03",
        "episodeNumber": 3,
        "titleAr": "الحلقة 3: سيرة بطل الإسلام علي بن أبي طالب رضي الله عنه (الجزء 2)",
        "titleEn": "Ali ibn Abi Talib: The Lion of Islam (Part 2)",
        "durationFormatted": "52:10",
        "audioUrl": "https://archive.org/download/mohamed_sayed_haj_2013/154150.mp3",
        "summaryAr": "فقه علي وعدله في الخلافة، زهده وورعه، وثباته في إقامة الحق والشريعة حتى الشهادة."
      }
    ]
  }
];
