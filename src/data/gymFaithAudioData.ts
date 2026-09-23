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
    "scholarId": "abdurrazzaq_badr",
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
    "scholarId": "mohamed_sayed_haj",
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
    "scholarId": "amjad_samir",
    "titleAr": "فقه النفس وتزكية القلوب وعلاج آفات الصدور",
    "titleEn": "Self-Discipline & Inner Healing",
    "sheikhAr": "الشيخ أمجد سمير",
    "sheikhEn": "Sheikh Amjad Samir",
    "category": "tazkiyah",
    "badgeAr": "فقه النفس • 4 حلقات",
    "badgeEn": "Inner Insight • 4 Episodes",
    "icon": "🌿",
    "descriptionAr": "دروس تطبيقية عميقة في استيعاب نوازع النفس وتطهير القلب والتربية الإيمانية المتدرجة من هدي السيرة والوحي.",
    "totalEpisodes": 4,
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
      },
      {
        "id": "as_ep_03",
        "episodeNumber": 3,
        "titleAr": "مجلس 3: علاج آفات القلوب والعجب وخفايا الرياء",
        "titleEn": "Purifying Inner Flaws and Conceit",
        "durationFormatted": "35:10",
        "audioUrl": "https://archive.org/download/media-way2allah-_3780/bnwd_alslh_alhdebea_alshekh_ahmd_smer_h17_-_knaa_alnde_alfdaeaea.mp3",
        "summaryAr": "مراقبة خواطر القلب، التخلص من رياء السر، وبناء الإخلاص المتجرد الذي يثمر السكينة الدائمة."
      },
      {
        "id": "as_ep_04",
        "episodeNumber": 4,
        "titleAr": "مجلس 4: بناء العادات الإيمانية المتينة والثبات على الطاعة",
        "titleEn": "Building Enduring Spiritual Habits",
        "durationFormatted": "31:45",
        "audioUrl": "https://archive.org/download/media-way2allah-_3791/ea_aba_gndl_asbr_wahtsb_alhdebea_alshekh_ahmd_smer_h18_-_knaa_alnde_alfdaeaea.mp3",
        "summaryAr": "كيف يتدرج العبد في مدارج الاستقامة دون انقطاع أو انتكاس، وفقه أحب الأعمال إلى الله أدومها."
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
    "scholarId": "ahmed_abdelmonem",
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
    "scholarId": "eyad_qunaibi",
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
    "scholarId": "haitham_talaat",
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
    "scholarId": "mohamed_sayed_haj",
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
        "durationFormatted": "36:20",
        "audioUrl": "https://archive.org/download/bin-baz-nour-ala-darb/001.mp3",
        "summaryAr": "بيان توحيد الربوبية والألوهية والأسماء والصفات، ولماذا خلق الله الثقلين، وعظمة كلمة الإخلاص."
      },
      {
        "id": "bb_ep_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: عظمة الصلاة في جماعة والتحذير من التهاون فيها",
        "titleEn": "Importance of Congregational Prayer",
        "durationFormatted": "32:45",
        "audioUrl": "https://archive.org/download/bin-baz-nour-ala-darb/002.mp3",
        "summaryAr": "الصلاة عمود الإسلام وعهد الإيمان؛ أدلتها ووجوب أدائها في المساجد مع المسلمين في أوقاتها."
      },
      {
        "id": "bb_ep_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: لزوم السنة وهدي السلف الصالح والحذر من المحدثات",
        "titleEn": "Adhering to the Sunnah and Early Predecessors",
        "durationFormatted": "34:10",
        "audioUrl": "https://archive.org/download/bin-baz-nour-ala-darb/003.mp3",
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
        "titleAr": "المجلس 1: منهاج التصفية والتربية وأثره في نهضة الأمة",
        "titleEn": "Purification and Cultivation in Islamic Revival",
        "durationFormatted": "44:10",
        "audioUrl": "https://archive.org/download/Albany_Tasfya_Tarbya/01.mp3",
        "summaryAr": "كيف تعود الأمة لعزتها؟ التصفية بنفي الدخيل عن الإسلام، والتربية بتنشئة الجيل على الدين الصافي."
      },
      {
        "id": "al_ep_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: تجريد الاتباع لرسول الله ﷺ ونبذ التعصب المذهبي",
        "titleEn": "Sincere Following of Revelation vs Fanaticism",
        "durationFormatted": "39:50",
        "audioUrl": "https://archive.org/download/Albany_Tasfya_Tarbya/02.mp3",
        "summaryAr": "أقوال الأئمة الأربعة في وجوب تقديم الحديث الصحيح على أقوال الرجال، وروح التفقه الدقيق في الدليل."
      },
      {
        "id": "al_ep_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: صفة صلاة النبي ﷺ الخاشعة من التكبير إلى التسليم",
        "titleEn": "The Prophet's Prayer Described",
        "durationFormatted": "41:35",
        "audioUrl": "https://archive.org/download/Albany_Tasfya_Tarbya/03.mp3",
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
        "audioUrl": "https://archive.org/download/sharh_tahawiah_hawali/01.mp3",
        "summaryAr": "أهمية فهم التوحيد كما فهمه الصحابة والتابعون، وأثر الفلسفات الدخيلة في تشتيت عقلية المسلم."
      },
      {
        "id": "shw_ep_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: حقيقة الإيمان بين قول اللسان وعمل الجوارح",
        "titleEn": "The Nature of Faith: Belief, Words & Actions",
        "durationFormatted": "45:30",
        "audioUrl": "https://archive.org/download/sharh_tahawiah_hawali/02.mp3",
        "summaryAr": "الإيمان قول وعمل يزيد بالطاعة وينقص بالمعصية؛ نقد الإرجاء والتأكيد على روح المبادرة والجهاد والعمل."
      },
      {
        "id": "shw_ep_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: علو الهمة وعزة المسلم برسالته أمام الحضارات",
        "titleEn": "High Zeal and Honor in Islamic Heritage",
        "durationFormatted": "50:20",
        "audioUrl": "https://archive.org/download/sharh_tahawiah_hawali/03.mp3",
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
    "descriptionAr": "مواعظ إيمانية تفيض بالخشية ومحبة الله؛ أسرار الصلاة ومناجاة الأسحار وتطهير القلب من العلائق الفانية.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "shq_ep_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: عظمة الوقوف بين يدي الله وأسرار الخشوع في الصلاة",
        "titleEn": "Grandeur of Standing Before the Creator",
        "durationFormatted": "38:40",
        "audioUrl": "https://archive.org/download/zad_shinqitee/salah_01.mp3",
        "summaryAr": "قد أفلح المؤمنون الذين هم في صلاتهم خاشعون؛ استحضار جلال الرب وهيبة الوقوف بين يديه."
      },
      {
        "id": "shq_ep_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: أسرار الدعاء والمناجاة في السجود وعطايا الأسحار",
        "titleEn": "Secrets of Supplication in Prostration",
        "durationFormatted": "36:15",
        "audioUrl": "https://archive.org/download/zad_shinqitee/salah_02.mp3",
        "summaryAr": "أقرب ما يكون العبد من ربه وهو ساجد؛ لذة انكسار القلب للحي القيوم وطلب الجنة والنجاة من النار."
      },
      {
        "id": "shq_ep_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: رقة القلب وحسن الظن بالله وملازمة الاستغفار",
        "titleEn": "Softening the Heart & Good Expectation of Allah",
        "durationFormatted": "40:50",
        "audioUrl": "https://archive.org/download/zad_shinqitee/salah_03.mp3",
        "summaryAr": "سعة رحمة الله للتائبين، كيف يزيل الذكر قسوة القلب ويملأ الصدر سكينة وأمناً ورضا."
      }
    ]
  },
  {
    "id": "series_ahmed_arabi_mindset",
    "scholarId": "ahmed_arabi",
    "titleAr": "بناء الشخصية المسلمة ومواجهة مغريات الزمان",
    "titleEn": "Building the Resilient Muslim Character",
    "sheikhAr": "الشيخ أحمد العربي",
    "sheikhEn": "Sheikh Ahmed Al-Arabi",
    "category": "mindset",
    "badgeAr": "همة وتربية • 3 حلقات",
    "badgeEn": "Mindset & Growth • 3 Episodes",
    "icon": "✨",
    "descriptionAr": "توجيهات إيمانية وسلوكية عملية للشباب في حراسة الفطرة ومقاومة الإدمانات الرقمية وبناء الهمم العالية.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "ara_ep_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: حراسة الفطرة ومقاومة الانجراف الرقمي للشباب",
        "titleEn": "Safeguarding Innate Nature in the Digital Age",
        "durationFormatted": "33:20",
        "audioUrl": "https://archive.org/download/ahmed_arabi_binaa/01.mp3",
        "summaryAr": "حماية البصر والقلب من سيول الشهوات والشبهات الرقمية، وبناء الحصن الداخلي بالتقوى والوعي."
      },
      {
        "id": "ara_ep_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: كيف تبني إرادة صلبة وتنتصر على عاداتك السيئة؟",
        "titleEn": "Developing Iron Will Against Destructive Habits",
        "durationFormatted": "31:45",
        "audioUrl": "https://archive.org/download/ahmed_arabi_binaa/02.mp3",
        "summaryAr": "علم مجاهدة النفس في ضوء القرآن؛ كسر دوائر الإدمان والتسويف واستبدالها بإنجازات يومية مباركة."
      },
      {
        "id": "ara_ep_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: علو الهمة في طلب العلم وخدمة الدين والأمة",
        "titleEn": "Lofty Ambition in Knowledge and Community Service",
        "durationFormatted": "35:10",
        "audioUrl": "https://archive.org/download/ahmed_arabi_binaa/03.mp3",
        "summaryAr": "لا تكن رجلاً عادياً؛ اجعل لك أثراً باقياً ومشروعاً يخدم أمتك ويثقل موازينك عند لقاء الله."
      }
    ]
  },
  {
    "id": "series_abdelmonem_tazkiyah",
    "scholarId": "ahmed_abdelmonem",
    "titleAr": "تزكية النفس وسيكولوجية العبودية ومداواة القلوب",
    "titleEn": "Soul Purification & Psychology of Servitude",
    "sheikhAr": "د. أحمد عبد المنعم",
    "sheikhEn": "Dr. Ahmed Abdelmonem",
    "category": "tazkiyah",
    "badgeAr": "تزكية ورقائق • 3 حلقات",
    "badgeEn": "Spiritual • 3 Episodes",
    "icon": "🌱",
    "descriptionAr": "معالجة أمراض القلوب المعاصرة واستصغار العمل ورؤية عظيم التقصير مع استشعار محبة الله والرجاء في رحمته.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "abm_tz_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: كشف أمراض القلوب وأسرار مداواتها",
        "titleEn": "Diagnosing Spiritual Illnesses",
        "durationFormatted": "38:40",
        "audioUrl": "https://archive.org/download/abdelmonem_tazkiya/01.mp3",
        "summaryAr": "كيف يتسلل الكبر والعجب إلى قلب العابد، وسبل العلاج النبوي بالتواضع والافتقار الصادق لله."
      },
      {
        "id": "abm_tz_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: استصغار العمل ورؤية التقصير بين يدي الله",
        "titleEn": "Humility and Self-Accounting",
        "durationFormatted": "42:15",
        "audioUrl": "https://archive.org/download/abdelmonem_tazkiya/02.mp3",
        "summaryAr": "مهما بلغت عبادتك فأنت في نعم الله مغمور، لا تعجب بعملك واطلب القبول والمغفرة."
      },
      {
        "id": "abm_tz_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: منزلة الرجاء وحسن الظن برب العالمين",
        "titleEn": "Hope and High Trust in Allah",
        "durationFormatted": "36:50",
        "audioUrl": "https://archive.org/download/abdelmonem_tazkiya/03.mp3",
        "summaryAr": "التوازن بين الخوف والرجاء، وسعة مغفرة الله التي تسع كل الذنوب لمن تاب وأناب."
      }
    ]
  },
  {
    "id": "series_abdelmonem_baqarah",
    "scholarId": "ahmed_abdelmonem",
    "titleAr": "معالم الهداية والاستخلاف في سورة البقرة",
    "titleEn": "Guidance & Stewardship in Surah Al-Baqarah",
    "sheikhAr": "د. أحمد عبد المنعم",
    "sheikhEn": "Dr. Ahmed Abdelmonem",
    "category": "tafseer",
    "badgeAr": "تدبر القرآن • 3 حلقات",
    "badgeEn": "Quran Tafsir • 3 Episodes",
    "icon": "📖",
    "descriptionAr": "مدارج الهداية ومشاهد الاستخلاف في الأرض وبناء الأمة المؤمنة من سورة البقرة سنام القرآن.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "abm_bq_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: أصناف الناس الثلاثة وميزان الهدى القرآني",
        "titleEn": "The Three Types of People in Quran",
        "durationFormatted": "45:10",
        "audioUrl": "https://archive.org/download/abdelmonem_baqara/01.mp3",
        "summaryAr": "المتقون، الكافرون، والمنافقون؛ بصائر قرآنية كاشفة لواقع النفوس والمجتمعات."
      },
      {
        "id": "abm_bq_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: قصة الاستخلاف وبداية المعركة مع إبليس",
        "titleEn": "The Divine Mandate & Adam's Creation",
        "durationFormatted": "44:00",
        "audioUrl": "https://archive.org/download/abdelmonem_baqara/02.mp3",
        "summaryAr": "إني جاعل في الأرض خليفة؛ وظيفة الإنسان الكبرى في عمارة الكون بالتوحيد والعدل."
      },
      {
        "id": "abm_bq_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: آية الكرسي ومقام الألوهية والشهود",
        "titleEn": "Ayat Al-Kursi & Supreme Sovereignty",
        "durationFormatted": "41:30",
        "audioUrl": "https://archive.org/download/abdelmonem_baqara/03.mp3",
        "summaryAr": "أعظم آية في كتاب الله؛ قيوميته سبحانه وسعة ملكه وعلمه وحفظه للسماوات والأرض."
      }
    ]
  },
  {
    "id": "series_abdelmonem_yt_mana3a",
    "scholarId": "ahmed_abdelmonem",
    "titleAr": "بناء المناعة الإيمانية للشباب ومواجهة الفتن",
    "titleEn": "Spiritual Resilience for Muslim Youth",
    "sheikhAr": "د. أحمد عبد المنعم",
    "sheikhEn": "Dr. Ahmed Abdelmonem",
    "category": "mindset",
    "badgeAr": "يوتيوب صوتي ⚡ • حلقتان",
    "badgeEn": "Audio Stream • 2 Episodes",
    "icon": "⚡",
    "descriptionAr": "سلسلة مركزة على يوتيوب في تحصين عقول الشباب وقلوبهم من أمواج الشبهات والشهوات.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "abm_yt_01",
        "episodeNumber": 1,
        "titleAr": "المقطع 1: كيف تحافظ على قلبك في زمن الفتن العاصفة؟",
        "titleEn": "Guarding Your Heart in Times of Trial",
        "durationFormatted": "28:15",
        "audioUrl": "https://www.youtube.com/watch?v=kYv7m54eWbU",
        "summaryAr": "خطوات عملية لحفظ السمع والبصر والقلب، وعمارة السريرة بالذكر والاستغفار اليومي."
      },
      {
        "id": "abm_yt_02",
        "episodeNumber": 2,
        "titleAr": "المقطع 2: الشفاء بالقرآن وتثبيت النفس عند الشدائد",
        "titleEn": "Quranic Healing & Steadfastness",
        "durationFormatted": "26:40",
        "audioUrl": "https://www.youtube.com/watch?v=Fj-yZ1q9vP0",
        "summaryAr": "كيف تستنزل سكينة الوحي في صدرك عند ضيق الصدر وتقلب الأحوال الدنيوية."
      }
    ]
  },
  {
    "id": "series_ayman_tareekh",
    "scholarId": "ayman_abdelrahim",
    "titleAr": "تاريخ الأمة الإسلامية: من البعثة إلى سقوط الخلافة",
    "titleEn": "Islamic History: Prophecy to Caliphate Fall",
    "sheikhAr": "م. أيمن عبد الرحيم (فك الله أسره)",
    "sheikhEn": "Eng. Ayman Abdelrahim",
    "category": "history",
    "badgeAr": "تاريخ الأمة • 4 محاضرات",
    "badgeEn": "History • 4 Lectures",
    "icon": "🏛️",
    "descriptionAr": "فلسفة التاريخ الإسلامي، الدولة الراشدة، الفتوحات، وسقوط الخلافة واستخلاص السنن الربانية.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "aym_th_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: فلسفة التاريخ في المنظور القرآني وسنن الأمم",
        "titleEn": "Quranic Philosophy of History",
        "durationFormatted": "56:30",
        "audioUrl": "https://archive.org/download/ayman_history/01.mp3",
        "summaryAr": "التاريخ ليس ركاماً من الأخبار؛ بل سنن ربانية ماضية تحكم صعود الحضارات وسقوطها."
      },
      {
        "id": "aym_th_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: العصر الراشدي ومعالم الدولة النموذجية العادلة",
        "titleEn": "The Rightly Guided Caliphate",
        "durationFormatted": "58:10",
        "audioUrl": "https://archive.org/download/ayman_history/02.mp3",
        "summaryAr": "كيف تحققت العدالة التامة والشورى والنزاهة بين الحاكم والمحكوم في عهد الخلفاء الراشدين."
      },
      {
        "id": "aym_th_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: حركة الفتوحات الإسلامية الكبرى وتحرير الشعوب",
        "titleEn": "The Great Islamic Liberations",
        "durationFormatted": "52:45",
        "audioUrl": "https://archive.org/download/ayman_history/03.mp3",
        "summaryAr": "انتشار الإسلام شرقاً وغرباً، أخلاق الفاتحين، وبناء أعظم حضارة إنسانية عرفها التاريخ."
      },
      {
        "id": "aym_th_04",
        "episodeNumber": 4,
        "titleAr": "المحاضرة 4: سقوط الخلافة والارتهان الفكري والحضاري المعاصر",
        "titleEn": "Fall of Caliphate and Contemporary Crises",
        "durationFormatted": "59:20",
        "audioUrl": "https://archive.org/download/ayman_history/04.mp3",
        "summaryAr": "كيف دخل العالم الإسلامي مرحلة الاستعمار والتغريب، ومسالك استعادة السيادة الحضارية."
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
        "audioUrl": "https://archive.org/download/ayman_psych/01.mp3",
        "summaryAr": "دراسة نقدية لكتاب سيكولوجية الجماهير لغوستاف لوبون ومقارنته بالهدي القرآني في التبين والتثبت."
      },
      {
        "id": "aym_ps_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: التحرر من قطيع الرأي والتبعية الساذجة",
        "titleEn": "Liberation from Herd Mentality",
        "durationFormatted": "51:40",
        "audioUrl": "https://archive.org/download/ayman_psych/02.mp3",
        "summaryAr": "لا تكن إمعة إن أحسن الناس أحسنت وإن أساؤوا أسأت؛ توطين النفس على الحق والعدل."
      },
      {
        "id": "aym_ps_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: تفكيك الخطاب الدعائي ووسائل الإقناع الخفية",
        "titleEn": "Deconstructing Propaganda Tactics",
        "durationFormatted": "49:00",
        "audioUrl": "https://archive.org/download/ayman_psych/03.mp3",
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
    "badgeAr": "تأسيس البيت المسلم • 5 محاضرات",
    "badgeEn": "Marriage & Home • 5 Lectures",
    "icon": "🏡",
    "descriptionAr": "الدورة الشهيرة المتميزة في فلسفة الزواج في الإسلام، معايير اختيار الشريك، فقه الخطبة، توزيع الأدوار، وحل الخلافات الزوجية لبناء بيت صالح مستقر.",
    "totalEpisodes": 5,
    "episodes": [
      {
        "id": "aym_zw_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: فلسفة الزواج في الإسلام ومفهوم السكن والمودة والرحمة",
        "titleEn": "Philosophy of Marriage & Divine Compassion",
        "durationFormatted": "58:30",
        "audioUrl": "https://www.youtube.com/watch?v=d_k6W0Ld8k8",
        "summaryAr": "لماذا شرع الله الزواج؟ مفهوم السكن الروحي والنفسي وعمارة الأرض بالنسل الصالح."
      },
      {
        "id": "aym_zw_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: معايير اختيار شريك الحياة: تنكح المرأة لأربع وحقيقة الدين والخلق",
        "titleEn": "Criteria for Choosing a Spouse: Deen & Character",
        "durationFormatted": "55:10",
        "audioUrl": "https://www.youtube.com/watch?v=J3yN6x9aV5k",
        "summaryAr": "فاظفر بذات الدين تربت يداك؛ إذا أتاكم من ترضون دينه وخلقه؛ كيف تختبر الأثر العملي للتدين والخلق قبل الزواج."
      },
      {
        "id": "aym_zw_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: فقه الخطبة والرؤية الشرعية وضوابط التعارف قبل العقد",
        "titleEn": "Engagement Fiqh & Legitimate Courtship Boundaries",
        "durationFormatted": "52:40",
        "audioUrl": "https://www.youtube.com/watch?v=R9_mK3vT4xI",
        "summaryAr": "الرؤية الشرعية، الأسئلة الجوهرية لمعرفة نمط الشخصية والتوافق الفكري والتربوي دون تجاوز الحدود الشرعية."
      },
      {
        "id": "aym_zw_04",
        "episodeNumber": 4,
        "titleAr": "المحاضرة 4: بناء البيت المسلم وتوزيع الأدوار والمسؤوليات بين الزوجين",
        "titleEn": "Building the Muslim Home: Roles & Responsibilities",
        "durationFormatted": "57:15",
        "audioUrl": "https://www.youtube.com/watch?v=V7_pL2bC9dE",
        "summaryAr": "مفهوم القوامة العادلة، رعاية البيت، الحقوق والواجبات المتبادلة وتجنب صراع الأدوار المستورد."
      },
      {
        "id": "aym_zw_05",
        "episodeNumber": 5,
        "titleAr": "المحاضرة 5: إدارة الخلافات الزوجية وفن حل المشكلات وتجنب الطلاق",
        "titleEn": "Conflict Management & Problem Solving in Marriage",
        "durationFormatted": "54:20",
        "audioUrl": "https://www.youtube.com/watch?v=P2_tX8wQ1zA",
        "summaryAr": "كيف تحاصر الخلاف في مهده؟ الصبر على الطباع المختلفة، فضيلة التغافل، وحفظ أسرار البيوت."
      }
    ]
  },
  {
    "id": "series_amjad_tarbiyah",
    "scholarId": "amjad_samir",
    "titleAr": "مدارج التربية الإيمانية وبناء العادات الصالحة الراسخة",
    "titleEn": "Spiritual Cultivation & Enduring Habits",
    "sheikhAr": "الشيخ أمجد سمير",
    "sheikhEn": "Sheikh Amjad Samir",
    "category": "tazkiyah",
    "badgeAr": "عادات إيمانية • 3 حلقات",
    "badgeEn": "Spiritual Habits • 3 Episodes",
    "icon": "🕊️",
    "descriptionAr": "التدرج في مدارج الصالحين؛ قانون التراكم الإيماني، حلاوة الخلوة بالله، وتثبيت الطاعات اليومية.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "as_tb_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: قانون التراكم الإيماني وأحب الأعمال إلى الله أدومها",
        "titleEn": "Spiritual Compounding & Small Consistent Deeds",
        "durationFormatted": "34:10",
        "audioUrl": "https://archive.org/download/amjad_samir_tarbiya/01.mp3",
        "summaryAr": "قليل دائم خير من كثير منقطع؛ كيف تبني ركيزتك اليومية من الصلاة والذكر وقراءة القرآن."
      },
      {
        "id": "as_tb_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الخلوة بالله وعمارة أوقات السحر بالاستغفار",
        "titleEn": "Seclusion with the Creator at Sahar",
        "durationFormatted": "32:50",
        "audioUrl": "https://archive.org/download/amjad_samir_tarbiya/02.mp3",
        "summaryAr": "ركعات في ظلمة الليل تورث نوراً في الوجه وقوة في القلب وتثبيتاً في مواجهة الأزمات."
      },
      {
        "id": "as_tb_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: مجاهدة النفس في ترك الفضول وصيانة الحواس",
        "titleEn": "Guarding Senses & Purifying Speech",
        "durationFormatted": "36:20",
        "audioUrl": "https://archive.org/download/amjad_samir_tarbiya/03.mp3",
        "summaryAr": "فضول الكلام والنظر والمخالطة يشتت القلب؛ حراسة المدخلات تورث صفاء المخرجات والأفكار."
      }
    ]
  },
  {
    "id": "series_amjad_futur",
    "scholarId": "amjad_samir",
    "titleAr": "علاج الفتور ومرض التسويف في العبادة والعمل",
    "titleEn": "Overcoming Sloth & Procrastination in Worship",
    "sheikhAr": "الشيخ أمجد سمير",
    "sheikhEn": "Sheikh Amjad Samir",
    "category": "mindset",
    "badgeAr": "علاج الفتور • حلقتان",
    "badgeEn": "Overcoming Sloth • 2 Episodes",
    "icon": "🌱",
    "descriptionAr": "تشخيص ظاهرة الفتور والانقطاع بعد الحماس، وتقديم العلاج العملي للاستمرار في الطاعة.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "as_ft_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: لماذا نفتر بعد مواسم الطاعات؟ تشخيص الأسباب",
        "titleEn": "Why Do We Lose Momentum in Good Deeds?",
        "durationFormatted": "31:40",
        "audioUrl": "https://archive.org/download/amjad_samir_futur/01.mp3",
        "summaryAr": "الغفلة عن تجديد النية، التكلف فوق الطاقة، والصحبة المحبطة؛ أسباب انطفاء جذوة الهمة."
      },
      {
        "id": "as_ft_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: الدواء النبوي لاستعادة شعلة الهمة والحيوية",
        "titleEn": "The Prophetic Remedy to Reignite Zeal",
        "durationFormatted": "33:15",
        "audioUrl": "https://archive.org/download/amjad_samir_futur/02.mp3",
        "summaryAr": "التوازن والاعتدال، محاسبة النفس، وإلزامها بورود ثابتة لا تتخلف عنها في منشط ولا مكره."
      }
    ]
  },
  {
    "id": "series_arabi_rujoolah",
    "scholarId": "ahmed_arabi",
    "titleAr": "معالم الرجولة الإيمانية ومسؤولية البناء في عصر السيولة",
    "titleEn": "Islamic Manhood & Duty in an Age of Laxity",
    "sheikhAr": "الشيخ أحمد العربي",
    "sheikhEn": "Sheikh Ahmed Al-Arabi",
    "category": "mindset",
    "badgeAr": "معالم الرجولة • 3 حلقات",
    "badgeEn": "Faith & Manhood • 3 Episodes",
    "icon": "⚔️",
    "descriptionAr": "صفات الرجال الذين مدحهم القرآن؛ الصدق، الثبات، حماية الأهل، وعزة النفس في زمن التميع.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "ara_rj_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: الرجولة في القرآن ومقامات الشرف والعزة",
        "titleEn": "True Manhood in the Quran",
        "durationFormatted": "32:10",
        "audioUrl": "https://archive.org/download/ahmed_arabi_rujoola/01.mp3",
        "summaryAr": "«رجال لا تلهيهم تجارة ولا بيع عن ذكر الله»؛ ميزان الرجولة الحقيقي عند الله عز وجل."
      },
      {
        "id": "ara_rj_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: تحمل المسؤولية ومواجهة الصعاب دون تراجع",
        "titleEn": "Taking Full Responsibility Under Pressure",
        "durationFormatted": "35:40",
        "audioUrl": "https://archive.org/download/ahmed_arabi_rujoola/02.mp3",
        "summaryAr": "الرجل المسلم يبادر للإصلاح ولا يلقي اللوم على الظروف؛ شجاعة الموقف ونبل السلوك."
      },
      {
        "id": "ara_rj_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: عفة البصر واليد وصيانة كرامة المؤمن",
        "titleEn": "Chastity, Integrity & Moral Standing",
        "durationFormatted": "30:50",
        "audioUrl": "https://archive.org/download/ahmed_arabi_rujoola/03.mp3",
        "summaryAr": "حفظ حدود الله، الغيرة على المحارم، والتنزه عن التكسب الحرام وسفاسف الأمور."
      }
    ]
  },
  {
    "id": "series_haitham_barahin",
    "scholarId": "haitham_talaat",
    "titleAr": "براهين النبوة وعظمة الرسالة المحمدية بالحق واليقين",
    "titleEn": "Proofs of Prophethood & Divine Revelation",
    "sheikhAr": "د. هيثم طلعت",
    "sheikhEn": "Dr. Haitham Talaat",
    "category": "mindset",
    "badgeAr": "براهين النبوة • 3 حلقات",
    "badgeEn": "Prophecy Proofs • 3 Episodes",
    "icon": "🛡️",
    "descriptionAr": "أدلة عقلية وتاريخية قاطعة على صدق رسول الله ﷺ ورسالته الخالدة وتحدي القرآن المعجز.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "ht_br_01",
        "episodeNumber": 1,
        "titleAr": "البرهان 1: صدق النبي ﷺ وعصمة سيرته وأخلاقه المعجزة",
        "titleEn": "The Flawless Character of the Messenger",
        "durationFormatted": "37:20",
        "audioUrl": "https://archive.org/download/haitham_talaat_barahin/01.mp3",
        "summaryAr": "لم يُعهد عليه كذبة واحدة في شبابه ولا كهولته؛ شهادة الأعداء قبل الأصدقاء بأمانته ونبله."
      },
      {
        "id": "ht_br_02",
        "episodeNumber": 2,
        "titleAr": "البرهان 2: النبوءات المتحققة التي أخبر بها في مستقبله",
        "titleEn": "Fulfilled Prophecies in Islamic History",
        "durationFormatted": "41:10",
        "audioUrl": "https://archive.org/download/haitham_talaat_barahin/02.mp3",
        "summaryAr": "فتح فارس والروم، تطاول رعاة الشاء في البنيان، وفتن آخر الزمان كما أخبر ﷺ حرفاً بحرف."
      },
      {
        "id": "ht_br_03",
        "episodeNumber": 3,
        "titleAr": "البرهان 3: الإعجاز التشريعي وحفظ القرآن عبر القرون",
        "titleEn": "Legislative Miracle & Preservation of the Quran",
        "durationFormatted": "39:50",
        "audioUrl": "https://archive.org/download/haitham_talaat_barahin/03.mp3",
        "summaryAr": "شريعة محكمة شاملة صالحة لكل زمان ومكان وحفظ فريد لكلمات القرآن لم يمسه تحريف."
      }
    ]
  },
  {
    "id": "series_haitham_yaqeen",
    "scholarId": "haitham_talaat",
    "titleAr": "رحلة الإيمان: براهين وجود الخالق ودلائل الفطرة",
    "titleEn": "The Journey of Faith: Proofs of Creation",
    "sheikhAr": "د. هيثم طلعت",
    "sheikhEn": "Dr. Haitham Talaat",
    "category": "mindset",
    "badgeAr": "رد الإلحاد • 3 حلقات",
    "badgeEn": "Atheism Refuted • 3 Episodes",
    "icon": "🔬",
    "descriptionAr": "الرد على النظريات الإلحادية والمادية بالدلائل العلمية الرصينة وقوانين الفيزياء والبيولوجيا.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "ht_yq_01",
        "episodeNumber": 1,
        "titleAr": "الحلقة 1: برهان الضبط الدقيق لقوانين الكون وسقوط الصدفة",
        "titleEn": "Fine-Tuning of the Universe & Cosmic Constants",
        "durationFormatted": "34:30",
        "audioUrl": "https://archive.org/download/haitham_talaat_yaqeen/01.mp3",
        "summaryAr": "ثوابت الجاذبية والقوى النووية؛ دقة مذهلة تثبت تصميماً حكيماً من خالق عظيم."
      },
      {
        "id": "ht_yq_02",
        "episodeNumber": 2,
        "titleAr": "الحلقة 2: تعقيد الخلية ولغة الشفرة الوراثية DNA المذهلة",
        "titleEn": "Cell Complexity & DNA Information Code",
        "durationFormatted": "36:15",
        "audioUrl": "https://archive.org/download/haitham_talaat_yaqeen/02.mp3",
        "summaryAr": "المعلومة لا تنشأ من العدم؛ الشفرة الوراثية برهان حي على العلم الأزلي المحيط."
      },
      {
        "id": "ht_yq_03",
        "episodeNumber": 3,
        "titleAr": "الحلقة 3: الأخلاق الموضوعية والضمير الإنساني الفطري",
        "titleEn": "Objective Morality & Innate Conscience",
        "durationFormatted": "32:40",
        "audioUrl": "https://archive.org/download/haitham_talaat_yaqeen/03.mp3",
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
        "audioUrl": "https://archive.org/download/ojairi_sunnah/01.mp3",
        "summaryAr": "كيف نصلي ونزكي ونحج دون تفصيل السنة؟ الرد الصارم على شبهات القرآنيين المعاصرين."
      },
      {
        "id": "oj_sn_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: علم مصطلح الحديث والمنهج النقدي الفريد للمحدثين",
        "titleEn": "Critical Methodology of Hadith Scholars",
        "durationFormatted": "49:30",
        "audioUrl": "https://archive.org/download/ojairi_sunnah/02.mp3",
        "summaryAr": "توثيق الأسانيد والرواة؛ أعظم منهج تاريخي لتوثيق النصوص عرفته البشرية قاطبة."
      },
      {
        "id": "oj_sn_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: تفكيك شبهات الطاعنين في صحيح الإمام البخاري",
        "titleEn": "Deconstructing Attacks on Sahih Bukhari",
        "durationFormatted": "51:00",
        "audioUrl": "https://archive.org/download/ojairi_sunnah/03.mp3",
        "summaryAr": "لماذا يستهدفون البخاري بالذات؟ دحض الشبهات حول الإسناد والأحاديث المنتقدة."
      }
    ]
  },
  {
    "id": "series_uthaymeen_salah",
    "scholarId": "ibn_uthaymeen",
    "titleAr": "فقه الصلاة والخشوع ومبطلاتها وسننها الصحيحة",
    "titleEn": "Fiqh of Prayer, Khushu & Proper Sunnahs",
    "sheikhAr": "الشيخ محمد بن صالح العثيمين (رحمه الله)",
    "sheikhEn": "Sheikh Ibn Uthaymeen",
    "category": "fiqh",
    "badgeAr": "فقه الصلاة • 4 دروس",
    "badgeEn": "Fiqh of Salah • 4 Lessons",
    "icon": "📖",
    "descriptionAr": "شرح عملي دقيق لأحكام الصلاة، شروطها، أركانها، سننها المؤكدة، ومسائل الخشوع وسجود السهو.",
    "totalEpisodes": 4,
    "episodes": [
      {
        "id": "uth_sl_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: شروط الصلاة وأركانها وفضل تكبيرة الإحرام",
        "titleEn": "Conditions and Pillars of Prayer",
        "durationFormatted": "43:20",
        "audioUrl": "https://archive.org/download/uthaymeen_salah/01.mp3",
        "summaryAr": "الطهارة، ستر العورة، دخول الوقت، واستقبال القبلة؛ الفروق الدقيقة بين الركن والشرط والواجب."
      },
      {
        "id": "uth_sl_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: صفة الركوع والسجود والطمأنينة الواجبة التي تبطل الصلاة بتركها",
        "titleEn": "Bowing, Prostration & Mandatory Tranquility",
        "durationFormatted": "45:10",
        "audioUrl": "https://archive.org/download/uthaymeen_salah/02.mp3",
        "summaryAr": "حديث المسيء صلاته؛ خطورة نقر الصلاة ونقص الركوع والسجود ووجوب الطمأنينة."
      },
      {
        "id": "uth_sl_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: أسباب الخشوع في الصلاة ودفع وسواس الشيطان",
        "titleEn": "Cultivating Khushu and Dispelling Whispers",
        "durationFormatted": "41:50",
        "audioUrl": "https://archive.org/download/uthaymeen_salah/03.mp3",
        "summaryAr": "استحضار عظمة من تقف بين يديه، تدبر الفاتحة، والاستعاذة من شيطان الصلاة خنزب."
      },
      {
        "id": "uth_sl_04",
        "episodeNumber": 4,
        "titleAr": "الدرس 4: أحكام السنن الرواتب القبلية والبعدية وصلاة الوتر",
        "titleEn": "Sunnah Mu'akkadah & Night Witr",
        "durationFormatted": "39:30",
        "audioUrl": "https://archive.org/download/uthaymeen_salah/04.mp3",
        "summaryAr": "السنن الرواتب الـ 12 ركعة، سنة الظهر القبلية والبعدية، سنة الفجر، وفضل الوتر وأوقاته."
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
        "audioUrl": "https://archive.org/download/uthaymeen_tawheed/01.mp3",
        "summaryAr": "من حقق التوحيد دخل الجنة بغير حساب ولا عذاب؛ معنى لا إله إلا الله وشروطها."
      },
      {
        "id": "uth_tw_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الخوف من الشرك والتحذير من الرياء الخفي",
        "titleEn": "Fear of Shirk & Subconscious Ostentation",
        "durationFormatted": "42:15",
        "audioUrl": "https://archive.org/download/uthaymeen_tawheed/02.mp3",
        "summaryAr": "أخوف ما أخاف عليكم الشرك الأصغر؛ مراقبة القلب وتخليصه من حب المدح وثناء الناس."
      },
      {
        "id": "uth_tw_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: صدق التوكل على الله وتفويض الأمور إليه",
        "titleEn": "Sincere Tawakkul & True Reliance",
        "durationFormatted": "44:00",
        "audioUrl": "https://archive.org/download/uthaymeen_tawheed/03.mp3",
        "summaryAr": "الأخذ بالأسباب مع عدم الاعتماد عليها بل تعليق القلب بمسبب الأسباب جل جلاله."
      }
    ]
  },
  {
    "id": "series_tarefe_ahkam",
    "scholarId": "abdulaziz_tarefe",
    "titleAr": "تفسير آيات الأحكام وتدبر السنن القرآنية الكبرى",
    "titleEn": "Tafsir of Legal Verses & Divine Sunan",
    "sheikhAr": "الشيخ عبد العزيز الطريفي (فك الله أسره)",
    "sheikhEn": "Sheikh Abdul Aziz Al-Tarefe",
    "category": "tafseer",
    "badgeAr": "آيات الأحكام • 3 مجالس",
    "badgeEn": "Legal Tafsir • 3 Sessions",
    "icon": "📖",
    "descriptionAr": "فقه استنباط الأحكام من الآيات، سنن الله في المجتمعات، وفقه الثبات والصلاح والإصلاح.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "tar_ah_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: مقدمات في منهج استنباط الأحكام من نصوص الوحي",
        "titleEn": "Foundations of Deducing Rulings",
        "durationFormatted": "47:20",
        "audioUrl": "https://archive.org/download/tarefe_ahkam/01.mp3",
        "summaryAr": "كيف تفهم مراد الشارع من اللفظ؟ قواعد الجمع والترجيح وفهم مقاصد الشريعة الغراء."
      },
      {
        "id": "tar_ah_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: آيات الصلاة والعبادة وأثرها في تطهير السلوك",
        "titleEn": "Worship Verses & Transforming Conduct",
        "durationFormatted": "45:00",
        "audioUrl": "https://archive.org/download/tarefe_ahkam/02.mp3",
        "summaryAr": "«إن الصلاة تنهى عن الفحشاء والمنكر»؛ كيف تصبح العبادة حصناً عملياً من المعاصي."
      },
      {
        "id": "tar_ah_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: سنن الله الإلهية في تمحيص الصادقين وسقوط الظالمين",
        "titleEn": "Divine Laws in Testing the Truthful",
        "durationFormatted": "50:10",
        "audioUrl": "https://archive.org/download/tarefe_ahkam/03.mp3",
        "summaryAr": "ولا يحيق المكر السيئ إلا بأهله؛ حتمية انتصار الحق مهما طال ليل الباطل وقوي سلطانه."
      }
    ]
  },
  {
    "id": "series_tarefe_ibtilaa",
    "scholarId": "abdulaziz_tarefe",
    "titleAr": "فقه الابتلاء والثبات على الحق زمن الفتن والمحن",
    "titleEn": "Fiqh of Trials & Steadfastness in Tribulations",
    "sheikhAr": "الشيخ عبد العزيز الطريفي (فك الله أسره)",
    "sheikhEn": "Sheikh Abdul Aziz Al-Tarefe",
    "category": "tazkiyah",
    "badgeAr": "فقه الثبات • 3 محاضرات",
    "badgeEn": "Steadfastness • 3 Lectures",
    "icon": "🛡️",
    "descriptionAr": "مفتاح الصبر على الأقدار المؤلمة، حكمة الله في الابتلاء، ورسوخ القدم عند تزلزل المبادئ.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "tar_ib_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: سنة الابتلاء وحكمة الله في تمحيص قلوب المؤمنين",
        "titleEn": "Wisdom Behind Afflictions & Purifying Hearts",
        "durationFormatted": "48:30",
        "audioUrl": "https://archive.org/download/tarefe_ibtila/01.mp3",
        "summaryAr": "أحسب الناس أن يتركوا أن يقولوا آمنا وهم لا يفتنون؛ رفع الدرجات وتكفير الخطايا."
      },
      {
        "id": "tar_ib_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: أسباب الثبات عند تقلب الأحوال وفتن الشبهات والشهوات",
        "titleEn": "Means of Steadfastness Against Tempests",
        "durationFormatted": "52:15",
        "audioUrl": "https://archive.org/download/tarefe_ibtila/02.mp3",
        "summaryAr": "الإقبال على القرآن تدبراً وعملاً، الدعاء بالثبات، ولزوم صحبة الصادقين المصلحين."
      },
      {
        "id": "tar_ib_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: الصدع بالحق وأجر المصلحين عند لقاء الله",
        "titleEn": "Speaking Truth & Reward of Reformers",
        "durationFormatted": "49:40",
        "audioUrl": "https://archive.org/download/tarefe_ibtila/03.mp3",
        "summaryAr": "وما كان ربك ليهلك القرى بظلم وأهلها مصلحون؛ الفرق الدقيق بين الصالح والمصلح."
      }
    ]
  },
  {
    "id": "series_sakran_majrayat",
    "scholarId": "ibrahim_sakran",
    "titleAr": "الماجريات: فقه الواقع والانعتاق من أسر الضجيج والفضول",
    "titleEn": "Al-Majrayat: Reality Insight & Overcoming Digital Distraction",
    "sheikhAr": "الشيخ إبراهيم السكران (فك الله أسره)",
    "sheikhEn": "Sheikh Ibrahim Al-Sakran",
    "category": "mindset",
    "badgeAr": "فقه الواقع • 3 مجالس",
    "badgeEn": "Productivity • 3 Sessions",
    "icon": "✨",
    "descriptionAr": "تحليل ظاهرة الغرق في الأخبار والماجريات التافهة، وكيف يعيد المسلم بناء وقته ومشروعه المثمر.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sak_mj_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: الماجريات الشبكية وإهدار الأعمار في التوافه والجدل",
        "titleEn": "Digital Noise and the Loss of Life Hours",
        "durationFormatted": "43:50",
        "audioUrl": "https://archive.org/download/sakran_majrayat/01.mp3",
        "summaryAr": "إدمان التصفح ومتابعة السجالات العابرة؛ كيف تسرق الشاشات أثمن ساعات الإنتاج العلمي والإيماني."
      },
      {
        "id": "sak_mj_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: كيف يستعيد المسلم تركيزه وإنتاجيته الإيمانية؟",
        "titleEn": "Reclaiming Focus and Spiritual Productivity",
        "durationFormatted": "46:10",
        "audioUrl": "https://archive.org/download/sakran_majrayat/02.mp3",
        "summaryAr": "العزلة الإيجابية، تنظيم الأولويات، والتفرغ للبناء التأصيلي الصامت الذي يثمر الأثر العظيم."
      },
      {
        "id": "sak_mj_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: نماذج من كبار أئمة ومصلحي الأمة وكيف أداروا أوقاتهم",
        "titleEn": "Exemplars of Reformers Managing Time",
        "durationFormatted": "44:30",
        "audioUrl": "https://archive.org/download/sakran_majrayat/03.mp3",
        "summaryAr": "ابن تيمية، ابن القيم، والنووي؛ كيف أنجزوا الموسوعات الضخمة في أوقات المحن والحروب."
      }
    ]
  },
  {
    "id": "series_sakran_maslakiyat",
    "scholarId": "ibrahim_sakran",
    "titleAr": "مسلكيات: في أدب العلم والعمل الصالح وعلو الهمة",
    "titleEn": "Maslakiyat: Manners of Knowledge & High Ambition",
    "sheikhAr": "الشيخ إبراهيم السكران (فك الله أسره)",
    "sheikhEn": "Sheikh Ibrahim Al-Sakran",
    "category": "tazkiyah",
    "badgeAr": "أدب وسلوك • 3 مجالس",
    "badgeEn": "Spiritual Ethics • 3 Sessions",
    "icon": "🌱",
    "descriptionAr": "أدب طالب العلم مع ربه ومع شيخه وكتبه، الجمع بين غزارة الفهم ورقة القلب ونوافل السحر.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sak_ms_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: هيبة الوحي وتذوق لذة التفقه في كتاب الله",
        "titleEn": "Awe of Revelation & Delights of Understanding",
        "durationFormatted": "41:20",
        "audioUrl": "https://archive.org/download/sakran_maslakiyat/01.mp3",
        "summaryAr": "العلم الذي لا يورث خشية ليس علماً نافعاً؛ تصحيح القصد وتطهير الباطن لاستقبال أنوار القرآن."
      },
      {
        "id": "sak_ms_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: التوازن المحمود بين التحصيل العلمي ونوافل العبادة",
        "titleEn": "Harmonizing Knowledge Acquisition & Worship",
        "durationFormatted": "45:00",
        "audioUrl": "https://archive.org/download/sakran_maslakiyat/02.mp3",
        "summaryAr": "لا تكن قارئاً مجرداً؛ اجعل لكل مسألة تتعلمها حظاً من العمل وقيام الليل والصدقة."
      },
      {
        "id": "sak_ms_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: صيانة اللسان وأدب التواضع بين الأقران",
        "titleEn": "Guarding Tongue & Modesty Among Peers",
        "durationFormatted": "39:40",
        "audioUrl": "https://archive.org/download/sakran_maslakiyat/03.mp3",
        "summaryAr": "الحذر من شهوة الغلبة في المناظرات وبغض التعالي على الخلق بالمعرفة والعلم."
      }
    ]
  },
  {
    "id": "series_rashed_ummah",
    "scholarId": "khaled_rashed",
    "titleAr": "يا أمة محمد: خطب النفير وشحذ الهمم لنصرة الدين",
    "titleEn": "O Ummah of Muhammad: Zealous Sermons",
    "sheikhAr": "الشيخ خالد الراشد (فك الله أسره)",
    "sheikhEn": "Sheikh Khaled Al-Rashed",
    "category": "khutbah",
    "badgeAr": "شحذ الهمم • 3 مواعظ",
    "badgeEn": "Zeal & Awakening • 3 Sermons",
    "icon": "🔥",
    "descriptionAr": "مواعظ نارية تهز القلوب وتوقظ الغافلين لنصرة المستضعفين والغيرة على حرمات الشريعة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "kr_um_01",
        "episodeNumber": 1,
        "titleAr": "الموعظة 1: أين عزائم الرجال وغيرة المؤمنين على دينهم؟",
        "titleEn": "Where Are the Zealous Believers?",
        "durationFormatted": "38:10",
        "audioUrl": "https://archive.org/download/rashed_ummah/01.mp3",
        "summaryAr": "صوت صادق ينادي في الأمة للعودة إلى الله والتمسك بدينه ونبذ الذل والتبعية."
      },
      {
        "id": "kr_um_02",
        "episodeNumber": 2,
        "titleAr": "الموعظة 2: غربة الإسلام وبشارة النصر القادم للمستمسكين",
        "titleEn": "Estrangement of Islam & Glad Tidings of Victory",
        "durationFormatted": "42:30",
        "audioUrl": "https://archive.org/download/rashed_ummah/02.mp3",
        "summaryAr": "طوبى للغرباء الذين يصلحون ما أفسد الناس؛ أجر الصابرين القابضين على الجمر في آخر الزمان."
      },
      {
        "id": "kr_um_03",
        "episodeNumber": 3,
        "titleAr": "الموعظة 3: بطولات الصحابة والفاتحين في اليرموك والقادسية",
        "titleEn": "Heroism of Companions in Yarmouk and Qadisiyah",
        "durationFormatted": "45:00",
        "audioUrl": "https://archive.org/download/rashed_ummah/03.mp3",
        "summaryAr": "كيف انتصرت فئة قليلة مؤمنة على أعتى إمبراطوريات الأرض بيقين التوحيد والصدق."
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
    "descriptionAr": "خطبة مؤثرة جداً تبكي العيون في خطورة إضاعة الصلاة والتهاون عن صلاة الفجر والجماعة.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "kr_sl_01",
        "episodeNumber": 1,
        "titleAr": "الجزء 1: نداء الفجر وأول ما يحاسب عليه العبد يوم القيامة",
        "titleEn": "The Fajr Call & First Accountability",
        "durationFormatted": "36:40",
        "audioUrl": "https://archive.org/download/rashed_salah/01.mp3",
        "summaryAr": "كيف ينام العبد عن لقاء ربه؟ عقوبة التثاقل عن صلاة الفجر وعظمة أجر ركعتيها."
      },
      {
        "id": "kr_sl_02",
        "episodeNumber": 2,
        "titleAr": "الجزء 2: حلاوة مناجاة الله والتلذذ بالركوع والسجود",
        "titleEn": "Sweetness of Intimacy in Bowing and Prostrating",
        "durationFormatted": "39:15",
        "audioUrl": "https://archive.org/download/rashed_salah/02.mp3",
        "summaryAr": "أرحنا بها يا بلال؛ الصلاة قرة عين المحبين ومهرب المهمومين والمكروبين."
      }
    ]
  },
  {
    "id": "series_kishk_anbiyaa",
    "scholarId": "abdelhamid_kishk",
    "titleAr": "روائع سير الأنبياء والمرسلين والدروس والعبر الخالدة",
    "titleEn": "Stories of Prophets: Lessons of Faith & Struggle",
    "sheikhAr": "الشيخ عبد الحميد كشك (رحمه الله)",
    "sheikhEn": "Sheikh Abdelhamid Kishk",
    "category": "history",
    "badgeAr": "سير الأنبياء • 3 خطب",
    "badgeEn": "Prophet Stories • 3 Sermons",
    "icon": "🦁",
    "descriptionAr": "ببلاغته الساحرة وشجاعته الفذة؛ قصص الأنبياء مع الطغاة وصبرهم وجهادهم في سبيل الله.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "ksh_an_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: كليم الله موسى عليه السلام ومواجهة فرعون المتكبر",
        "titleEn": "Moses & Confronting the Tyrant Pharaoh",
        "durationFormatted": "51:20",
        "audioUrl": "https://archive.org/download/kishk_anbiya/01.mp3",
        "summaryAr": "«كلا إن معي ربي سيهدين»؛ أعظم درس في الثقة بالله عند اشتداد الكرب وانقطاع الحيل."
      },
      {
        "id": "ksh_an_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الصديق يوسف عليه السلام وثبات العفة في محنة السجن",
        "titleEn": "Joseph's Steadfast Chastity & Triumph",
        "durationFormatted": "48:40",
        "audioUrl": "https://archive.org/download/kishk_anbiya/02.mp3",
        "summaryAr": "«معاذ الله إنه ربي أحسن مثواي»؛ مروءة الشاب المؤمن في مقاومة الفتن والتمسك بالتقوى."
      },
      {
        "id": "ksh_an_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: صابر الأنبياء أيوب عليه السلام وروائع الرضا بالقدر",
        "titleEn": "Job's Exemplary Patience & Divine Relief",
        "durationFormatted": "46:15",
        "audioUrl": "https://archive.org/download/kishk_anbiya/03.mp3",
        "summaryAr": "«أني مسني الضر وأنت أرحم الراحمين»؛ أدب الابتلاء وكيف يفرج الله الكروب بعد طول الشدة."
      }
    ]
  },
  {
    "id": "series_msh_shaytan",
    "scholarId": "mohamed_sayed_haj",
    "titleAr": "مكائد الشيطان ومداخله الخفية وسبل التحصين النبوي",
    "titleEn": "Devil's Traps & Prophetic Fortification",
    "sheikhAr": "الشيخ محمد سيد حاج (رحمه الله)",
    "sheikhEn": "Sheikh Mohamed Sayed Haj",
    "category": "tazkiyah",
    "badgeAr": "مكائد الشيطان • 3 دروس",
    "badgeEn": "Spiritual Protection • 3 Lessons",
    "icon": "🕊️",
    "descriptionAr": "كشف حيل إبليس في إيقاع العابد في الغرور والمذنب في القنوط، وتوضيح أسلحة المؤمن للانتصار عليه.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "msh_sh_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: خطوات الشيطان ومداخله الدقيقة على أهل الصلاح",
        "titleEn": "Subtle Schemes of Satan Against the Righteous",
        "durationFormatted": "44:30",
        "audioUrl": "https://archive.org/download/msh_shaytan/01.mp3",
        "summaryAr": "لا يأتيك الشيطان بالفاحشة أولاً؛ بل يستدرجك بخطوات تدريجية في التساهل والتهاون."
      },
      {
        "id": "msh_sh_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الوساوس في الصلاة والوضوء وكيف تقطعها بحزم",
        "titleEn": "Whispers in Salah & Decisive Remedies",
        "durationFormatted": "42:10",
        "audioUrl": "https://archive.org/download/msh_shaytan/02.mp3",
        "summaryAr": "علاج التكرار والشك في الطهارة والصلاة بالبناء على اليقين والإعراض التام عن الوسواس."
      },
      {
        "id": "msh_sh_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: سلاح الأذكار الصحيحة وحصون الإيمان المنيعة",
        "titleEn": "Authentic Adhkar as Invulnerable Fortress",
        "durationFormatted": "47:00",
        "audioUrl": "https://archive.org/download/msh_shaytan/03.mp3",
        "summaryAr": "أذكار الصباح والمساء والنوم ودخول البيت والخروج منه؛ أدرع ربانية لا يخترقها شيطان."
      }
    ]
  },
  {
    "id": "series_badr_adhkar",
    "scholarId": "abdurrazzaq_badr",
    "titleAr": "فقه الأدعية والأذكار الصحيحة في اليوم والليلة",
    "titleEn": "Fiqh of Authentic Duas and Adhkar",
    "sheikhAr": "الشيخ عبد الرزاق البدر",
    "sheikhEn": "Sheikh Abdur Razzaq Al-Badr",
    "category": "tazkiyah",
    "badgeAr": "فقه الأذكار • 3 دروس",
    "badgeEn": "Adhkar Fiqh • 3 Lessons",
    "icon": "🌟",
    "descriptionAr": "شرح معاني الأذكار النبوية اليومية، أذكار الصباح والمساء والنوم، وفضل المداومة عليها.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "bdr_ad_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: فضائل الذكر وأثره العظيم في سكينة القلب وعمارة الوقت",
        "titleEn": "Great Virtues of Remembrance",
        "durationFormatted": "41:15",
        "audioUrl": "https://archive.org/download/badr_adhkar/01.mp3",
        "summaryAr": "«ألا بذكر الله تطمئن القلوب»؛ كيف يمحو الذكر قسوة القلب ويملأ الصدر نوراً وبصيرة."
      },
      {
        "id": "bdr_ad_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: أذكار الصباح والمساء وتدبر معانيها الجامعة للحفظ والبركة",
        "titleEn": "Morning and Evening Adhkar Contemplation",
        "durationFormatted": "44:50",
        "audioUrl": "https://archive.org/download/badr_adhkar/02.mp3",
        "summaryAr": "سيد الاستغفار، رضيت بالله رباً، وحسبي الله؛ معانٍ عقدية جليلة تبني عقيدة التوكل الصادق."
      },
      {
        "id": "bdr_ad_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: أذكار النوم الصحيحة وسنة تسبيح فاطمة النبوي",
        "titleEn": "Authentic Bedtime Adhkar and Fatima's Tasbih",
        "durationFormatted": "38:40",
        "audioUrl": "https://archive.org/download/badr_adhkar/03.mp3",
        "summaryAr": "باسمك ربي وضعت جنبي، آية الكرسي، وتسبيح 33/33/34؛ هدي المصطفى ﷺ قبل المنام."
      }
    ]
  },
  {
    "id": "series_badr_istiqamah",
    "scholarId": "abdurrazzaq_badr",
    "titleAr": "عشر قواعد في الاستقامة والثبات على دين الله",
    "titleEn": "Ten Principles of Steadfastness in Faith",
    "sheikhAr": "الشيخ عبد الرزاق البدر",
    "sheikhEn": "Sheikh Abdur Razzaq Al-Badr",
    "category": "mindset",
    "badgeAr": "قواعد الاستقامة • 3 دروس",
    "badgeEn": "Steadfastness • 3 Lessons",
    "icon": "🌱",
    "descriptionAr": "شرح رسالة قواعد الاستقامة؛ كيف يستقيم القلب على التوحيد وتتبعه الجوارح بالعمل الصالح.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "bdr_is_01",
        "episodeNumber": 1,
        "titleAr": "القاعدة 1 و2: الاستقامة منة ربانية وأصلها استقامة القلب",
        "titleEn": "Steadfastness is a Divine Gift from the Heart",
        "durationFormatted": "36:20",
        "audioUrl": "https://archive.org/download/badr_istiqama/01.mp3",
        "summaryAr": "اهدنا الصراط المستقيم؛ تضرع العبد الدائم إلى ربه لتثبيت فؤاده على صراطه."
      },
      {
        "id": "bdr_is_02",
        "episodeNumber": 2,
        "titleAr": "القاعدة 3 و4: استقامة اللسان والجوارح ومجانبة الرياء",
        "titleEn": "Steadfast Tongue and Limbs Free of Hypocrisy",
        "durationFormatted": "39:10",
        "audioUrl": "https://archive.org/download/badr_istiqama/02.mp3",
        "summaryAr": "لا يستقيم إيمان عبد حتى يستقيم قلبه، ولا يستقيم قلبه حتى يستقيم لسانه."
      },
      {
        "id": "bdr_is_03",
        "episodeNumber": 3,
        "titleAr": "القاعدة 5 و6: لزوم السنة والحذر من الغلو والتفريط",
        "titleEn": "Adhering to Sunnah Without Extremism or Neglect",
        "durationFormatted": "37:45",
        "audioUrl": "https://archive.org/download/badr_istiqama/03.mp3",
        "summaryAr": "سددوا وقاربوا وأبشروا؛ منهج التوسط والاعتدال في العبادة كما شرعها رسول الله ﷺ."
      }
    ]
  },
  {
    "id": "series_samir_sabr",
    "scholarId": "samir_moustafa",
    "titleAr": "الصبر على الطاعة ولذة مجاهدة النفس والشيطان",
    "titleEn": "Patience in Worship & Sweetness of Self-Struggle",
    "sheikhAr": "الشيخ سمير مصطفى (فك الله أسره)",
    "sheikhEn": "Sheikh Samir Moustafa",
    "category": "mindset",
    "badgeAr": "مجاهدة النفس • 3 دروس",
    "badgeEn": "Self Struggle • 3 Lessons",
    "icon": "⚡",
    "descriptionAr": "خطاب مباشر مشوق يكسر حواجز الكسل، ويوضح كيف تتحول مشقة العبادة إلى ألذ لحظات العمر.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sm_sb_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: لماذا نستثقل العبادة في البداية وكيف تنقلب إلى حلاوة؟",
        "titleEn": "Why Worship Feels Heavy First Before Sweetness",
        "durationFormatted": "35:10",
        "audioUrl": "https://archive.org/download/samir_sabr/01.mp3",
        "summaryAr": "مكاره الجنة ومحاف الشهوات؛ كيف تروض نفسك الأمارة بالسوء حتى تستسلم للعبودية."
      },
      {
        "id": "sm_sb_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: الصبر عن المعصية وإدراك حقارة الشهوات المحرمة",
        "titleEn": "Refraining from Sins & Vanishing Desires",
        "durationFormatted": "33:40",
        "audioUrl": "https://archive.org/download/samir_sabr/02.mp3",
        "summaryAr": "لذة ساعة تعقبها حسرة أبدية؛ استحضار مراقبة الله وعظمة الجزاء لمن ترك شيئاً لله."
      },
      {
        "id": "sm_sb_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: كيف تجعل قيام الليل وصيام النوافل أحب عاداتك اليومية؟",
        "titleEn": "Making Qiyam and Fasting Your Beloved Habit",
        "durationFormatted": "37:00",
        "audioUrl": "https://archive.org/download/samir_sabr/03.mp3",
        "summaryAr": "تجارب الصالحين في قيام الليل؛ ركعتان في جوف الليل كفيلتان بقلب موازين حياتك بالكامل."
      }
    ]
  },
  {
    "id": "series_samir_yusuf",
    "scholarId": "samir_moustafa",
    "titleAr": "وقفات تربوية مع سورة يوسف ومعالم الفتوة والعفة",
    "titleEn": "Spiritual Lessons from Surah Yusuf: Honor & Chastity",
    "sheikhAr": "الشيخ سمير مصطفى (فك الله أسره)",
    "sheikhEn": "Sheikh Samir Moustafa",
    "category": "tafseer",
    "badgeAr": "سورة يوسف • حلقتان",
    "badgeEn": "Surah Yusuf • 2 Episodes",
    "icon": "🕊️",
    "descriptionAr": "تأملات حية في فتنة الشهوة والرياسة والابتلاء والتمكين من سورة يوسف أحسن القصص.",
    "totalEpisodes": 2,
    "episodes": [
      {
        "id": "sm_ys_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: عفة يوسف في قصر العزيز والفرار الصادق من الفتنة",
        "titleEn": "Joseph's Chastity in the Palace & Fleeing Temptation",
        "durationFormatted": "38:20",
        "audioUrl": "https://archive.org/download/samir_yusuf/01.mp3",
        "summaryAr": "وراودته التي هو في بيتها عن نفسه؛ كيف يقف الشاب المؤمن كالجبل الأشم أمام إغراء المعصية."
      },
      {
        "id": "sm_ys_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الصبر في السجن وحسن الظن برب العالمين حتى يأتي الفرج",
        "titleEn": "Patience in Prison & Trust in Divine Relief",
        "durationFormatted": "40:15",
        "audioUrl": "https://archive.org/download/samir_yusuf/02.mp3",
        "summaryAr": "إن ربي لطيف لما يشاء؛ تدبير الله الخفي لأوليائه الصادقين وتحويل المحن إلى منائح."
      }
    ]
  },
  {
    "id": "series_qunaibi_jeel",
    "scholarId": "eyad_qunaibi",
    "titleAr": "همة بناء الجيل المسلم وحراسة الهوية الإيمانية",
    "titleEn": "Building the Faithful Generation & Identity",
    "sheikhAr": "د. إياد قنيبي",
    "sheikhEn": "Dr. Eyad Qunaibi",
    "category": "mindset",
    "badgeAr": "بناء الجيل • 3 حلقات",
    "badgeEn": "Generation Building • 3 Episodes",
    "icon": "🌱",
    "descriptionAr": "مشروع متكامل لتربية الأبناء وتحصين الأسرة المسلمة من التيارات الهدامة وغرس الاعتزاز بالشريعة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "eq_jl_01",
        "episodeNumber": 1,
        "titleAr": "الحلقة 1: كيف نبني أطفالنا وشبابنا على عزة الإسلام وشجاعة الموقف؟",
        "titleEn": "Instilling Islamic Honor & Courage in Children",
        "durationFormatted": "36:40",
        "audioUrl": "https://archive.org/download/qunaibi_jeel/01.mp3",
        "summaryAr": "صناعة الشخصية المسلمة المتزنة؛ القدوة العملية في المنزل وربط النشء ببطولات الصحابة."
      },
      {
        "id": "eq_jl_02",
        "episodeNumber": 2,
        "titleAr": "الحلقة 2: حماية الأسرة من الاختراق الرقمي والثقافي المعاصر",
        "titleEn": "Guarding Families from Digital & Cultural Invasion",
        "durationFormatted": "39:10",
        "audioUrl": "https://archive.org/download/qunaibi_jeel/02.mp3",
        "summaryAr": "ضوابط التعامل مع الأجهزة الذكية ومواقع التواصل، وبناء البدائل التربوية الممتعة."
      },
      {
        "id": "eq_jl_03",
        "episodeNumber": 3,
        "titleAr": "الحلقة 3: دور الوالدين في غرس العقيدة النقية ومحبة الله ورسوله",
        "titleEn": "Parents' Role in Instilling Pure Aqeedah & Love",
        "durationFormatted": "37:50",
        "audioUrl": "https://archive.org/download/qunaibi_jeel/03.mp3",
        "summaryAr": "تعريف الأبناء بنعم الله ورحمته، وكيف يتحول التوحيد إلى سلوك حياة وشغف بالعمل الصالح."
      }
    ]
  },
  {
    "id": "series_meshari_rijal",
    "scholarId": "badr_meshari",
    "titleAr": "رجال حول الرسول ﷺ وبطولات صحابة المصطفى",
    "titleEn": "Men Around the Messenger & Heroism of Sahaba",
    "sheikhAr": "الشيخ بدر المشاري",
    "sheikhEn": "Sheikh Badr Al-Meshari",
    "category": "siyra",
    "badgeAr": "سير الأبطال • 3 حلقات",
    "badgeEn": "Heroism • 3 Episodes",
    "icon": "🕌",
    "descriptionAr": "قصص مشوقة بأسلوب الشيخ العذب في شجاعة وتضحيات صحابة رسول الله ﷺ وصدق وفائهم.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "bm_rj_01",
        "episodeNumber": 1,
        "titleAr": "القصة 1: خالد بن الوليد سيف الله المسلول وعبقرية القيادة العسكرية",
        "titleEn": "Khalid ibn al-Walid: The Drawn Sword of Allah",
        "durationFormatted": "46:10",
        "audioUrl": "https://archive.org/download/meshari_rijal/01.mp3",
        "summaryAr": "فارس لم يُهزم في معركة قط؛ عبقرية اليرموك والوليد والزهد في الإمارة طاعة لله ولرسوله."
      },
      {
        "id": "bm_rj_02",
        "episodeNumber": 2,
        "titleAr": "القصة 2: سعد بن أبي وقاص وفارس القادسية مجاب الدعوة",
        "titleEn": "Saad ibn Abi Waqqas: Hero of Qadisiyyah",
        "durationFormatted": "43:30",
        "audioUrl": "https://archive.org/download/meshari_rijal/02.mp3",
        "summaryAr": "ارمِ فداك أبي وأمي؛ أول من رمى بسهم في سبيل الله وخال المصطفى ﷺ وحامل لواء كسر كسرى."
      },
      {
        "id": "bm_rj_03",
        "episodeNumber": 3,
        "titleAr": "القصة 3: حمزة بن عبد المطلب أسد الله وسيد الشهداء يوم أحد",
        "titleEn": "Hamza ibn Abdul-Muttalib: Lion of Allah",
        "durationFormatted": "44:50",
        "audioUrl": "https://archive.org/download/meshari_rijal/03.mp3",
        "summaryAr": "شجاعة وإقدام في نصرة ابن أخيه ﷺ وثبات عند الشدائد ورثاء النبي العظيم له."
      }
    ]
  },
  {
    "id": "series_bin_baz_wasitiyah",
    "scholarId": "bin_baz",
    "titleAr": "شرح كتاب العقيدة الواسطية لشيخ الإسلام ابن تيمية",
    "titleEn": "Explanation of Al-Aqeedah Al-Wasitiyyah",
    "sheikhAr": "الشيخ عبد العزيز بن باز (رحمه الله)",
    "sheikhEn": "Sheikh Abdul Aziz ibn Baz",
    "category": "fiqh",
    "badgeAr": "العقيدة الواسطية • 3 دروس",
    "badgeEn": "Core Aqeedah • 3 Lessons",
    "icon": "📚",
    "descriptionAr": "شرح مؤصل رصين لمعتقد أهل السنة والجماعة في أسماء الله وصفاته واليوم الآخر والشفاعة والصحابة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "bb_ws_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: معتقد أهل السنة في أسماء الله وصفاته وإثباتها بلا تمثيل",
        "titleEn": "Affirming Divine Attributes Without Distortion",
        "durationFormatted": "42:15",
        "audioUrl": "https://archive.org/download/bin_baz_wasitiya/01.mp3",
        "summaryAr": "ليس كمثله شيء وهو السميع البصير؛ سلامة منهج السلف في إمرار نصوص الصفات كما جاءت."
      },
      {
        "id": "bb_ws_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: الإيمان باليوم الآخر وعذاب القبر ونعيمه والصراط والميزان",
        "titleEn": "Belief in the Last Day & Grave Life",
        "durationFormatted": "44:00",
        "audioUrl": "https://archive.org/download/bin_baz_wasitiya/02.mp3",
        "summaryAr": "مشاهد الحشر والقيامة والشفاعة العظمى لنبينا محمد ﷺ وفوز المؤمنين برؤية ربهم في الجنة."
      },
      {
        "id": "bb_ws_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: فضل الصحابة الكرام وموقف أهل السنة من الخلافات بينهم",
        "titleEn": "Virtue of the Companions & Pure Hearts Toward Them",
        "durationFormatted": "40:30",
        "audioUrl": "https://archive.org/download/bin_baz_wasitiya/03.mp3",
        "summaryAr": "سلامة القلوب والألسن لأصحاب رسول الله ﷺ ومحبتهم والترضي عنهم والكف عما شجر بينهم."
      }
    ]
  },
  {
    "id": "series_albani_sifah_salah",
    "scholarId": "albani",
    "titleAr": "صفة صلاة النبي ﷺ من التكبير إلى التسليم كأنك تراها",
    "titleEn": "Prophet's Prayer Described from Takbir to Tasleem",
    "sheikhAr": "الشيخ محمد ناصر الدين الألباني (رحمه الله)",
    "sheikhEn": "Sheikh Muhammad Nasiruddin al-Albani",
    "category": "fiqh",
    "badgeAr": "صفة الصلاة • 3 دروس",
    "badgeEn": "Prophet Prayer • 3 Lessons",
    "icon": "🔍",
    "descriptionAr": "تحرير دقيق لسنن الصلاة وهيئاتها الصحيحة الثابتة عن رسول الله ﷺ بالأدلة المحققة.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "alb_sf_01",
        "episodeNumber": 1,
        "titleAr": "الدرس 1: استقبال القبلة والنية وتكبيرة الإحرام ودعاء الاستفتاح",
        "titleEn": "Opening Takbir, Intention & Opening Duas",
        "durationFormatted": "45:30",
        "audioUrl": "https://archive.org/download/albani_sifah_salah/01.mp3",
        "summaryAr": "تجريد المتابعة للنبي ﷺ: صلوا كما رأيتموني أصلي؛ تصحيح الأخطاء الشائعة في تكبيرة الإحرام."
      },
      {
        "id": "alb_sf_02",
        "episodeNumber": 2,
        "titleAr": "الدرس 2: القراءة والركوع والرفع منه والاعتدال التام والطمأنينة",
        "titleEn": "Recitation, Bowing & Rising with Tranquility",
        "durationFormatted": "48:10",
        "audioUrl": "https://archive.org/download/albani_sifah_salah/02.mp3",
        "summaryAr": "تسوية الظهر في الركوع، أذكار الرفع منه، ووجوب استقرار كل عظم في موضعه."
      },
      {
        "id": "alb_sf_03",
        "episodeNumber": 3,
        "titleAr": "الدرس 3: السجود الصحيح والافتراش والتورك في التشهد والتسليم",
        "titleEn": "Proper Prostration, Sitting & Concluding Tasleem",
        "durationFormatted": "46:40",
        "audioUrl": "https://archive.org/download/albani_sifah_salah/03.mp3",
        "summaryAr": "السجود على الأعضاء السبعة، هيئة الجلوس بين السجدتين، والصلاة الإبراهيمية في التشهد الأخير."
      }
    ]
  },
  {
    "id": "series_safar_ummah",
    "scholarId": "safar_hawali",
    "titleAr": "فقه الأمة ومعالم الصراع الحضاري واليقظة الإسلامية",
    "titleEn": "Fiqh of the Ummah & Civilizational Conflict",
    "sheikhAr": "الشيخ سفر الحوالي (فك الله أسره)",
    "sheikhEn": "Sheikh Safar Al-Hawali",
    "category": "history",
    "badgeAr": "فقه الأمة • 3 محاضرات",
    "badgeEn": "Ummah Awakening • 3 Lectures",
    "icon": "🏛️",
    "descriptionAr": "قراءة عقدية عميقة لواقع الأمة الإسلامية وتاريخ الصراع مع القوى العالمية وبشائر الاستخلاف.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "sf_um_01",
        "episodeNumber": 1,
        "titleAr": "المحاضرة 1: سنن التدافع الحضاري ومكانة أمة الإسلام بين الأمم",
        "titleEn": "Civilizational Push & True Standing of the Ummah",
        "durationFormatted": "53:20",
        "audioUrl": "https://archive.org/download/safar_ummah/01.mp3",
        "summaryAr": "«ولولا دفع الله الناس بعضهم ببعض لفسدت الأرض»؛ دور الأمة كشاهدة على البشرية بالحق."
      },
      {
        "id": "sf_um_02",
        "episodeNumber": 2,
        "titleAr": "المحاضرة 2: واجب الشباب في حفظ الهوية ونصرة قضايا المسلمين",
        "titleEn": "Duty of Youth in Preserving Identity",
        "durationFormatted": "50:40",
        "audioUrl": "https://archive.org/download/safar_ummah/02.mp3",
        "summaryAr": "المسلم أخو المسلم؛ كيف يتحول الألم إلى أمل وعمل منظم لخدمة الدين ورفع رايته."
      },
      {
        "id": "sf_um_03",
        "episodeNumber": 3,
        "titleAr": "المحاضرة 3: وعد الله للمؤمنين بالتمكين والاستخلاف في الأرض",
        "titleEn": "Divine Promise of Empowerment and Caliphate",
        "durationFormatted": "55:10",
        "audioUrl": "https://archive.org/download/safar_ummah/03.mp3",
        "summaryAr": "«وعد الله الذين آمنوا منكم وعملوا الصالحات ليستخلفنهم في الأرض»؛ اليقين بالنصر القادم."
      }
    ]
  },
  {
    "id": "series_shinqitee_zad",
    "scholarId": "shinqitee",
    "titleAr": "شرح زاد المستقنع: أسرار الصلاة ومناجاة علام الغيوب",
    "titleEn": "Secrets of Prayer & Divine Intimacy in Zad Al-Mustaqni",
    "sheikhAr": "الشيخ محمد بن محمد المختار الشنقيطي",
    "sheikhEn": "Sheikh Muhammad Al-Mukhtar Al-Shinqitee",
    "category": "tazkiyah",
    "badgeAr": "أسرار الصلاة • 3 مجالس",
    "badgeEn": "Prayer Secrets • 3 Sessions",
    "icon": "💎",
    "descriptionAr": "مواعظ تبكي العيون وترقق القلوب بأسلوب فقيه المدينة؛ لذة السجود ودموع الخشية في ظلمات الليل.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "shn_zd_01",
        "episodeNumber": 1,
        "titleAr": "المجلس 1: عظمة الدخول في الصلاة والتجرد من شواغل الدنيا",
        "titleEn": "The Majesty of Standing Before Allah",
        "durationFormatted": "44:10",
        "audioUrl": "https://archive.org/download/shinqitee_zad/01.mp3",
        "summaryAr": "إذا كبرت فاطرح الدنيا وما فيها وراء ظهرك؛ كيف يحضر القلب ويستشعر قرب الرحمن."
      },
      {
        "id": "shn_zd_02",
        "episodeNumber": 2,
        "titleAr": "المجلس 2: أسرار السجود ولذة القرب ودعاء المضطر المستجاب",
        "titleEn": "Secrets of Prostration & The Answered Dua",
        "durationFormatted": "46:30",
        "audioUrl": "https://archive.org/download/shinqitee_zad/02.mp3",
        "summaryAr": "أقرب ما يكون العبد من ربه وهو ساجد؛ سكينة البكاء بين يدي الله وبث الشكوى إليه وحده."
      },
      {
        "id": "shn_zd_03",
        "episodeNumber": 3,
        "titleAr": "المجلس 3: صلاة الوتر وركعات جوف الليل وأثرها في تفريج الكرب",
        "titleEn": "Night Witr & Rakat in Darkness Dispelling Afflictions",
        "durationFormatted": "48:00",
        "audioUrl": "https://archive.org/download/shinqitee_zad/03.mp3",
        "summaryAr": "هل من سائل فأعطيه؟ نزول الرب سبحانه في الثلث الأخير وتجلي الرحمات والمغفرة."
      }
    ]
  },
  {
    "id": "series_shinqitee_birr",
    "scholarId": "shinqitee",
    "titleAr": "بر الوالدين وأثره العظيم في تفريج الكربات والبركة",
    "titleEn": "Filial Piety & Relief of Afflictions",
    "sheikhAr": "الشيخ محمد بن محمد المختار الشنقيطي",
    "sheikhEn": "Sheikh Muhammad Al-Mukhtar Al-Shinqitee",
    "category": "tazkiyah",
    "badgeAr": "بر الوالدين • 3 مواعظ",
    "badgeEn": "Filial Piety • 3 Sermons",
    "icon": "💎",
    "descriptionAr": "موعظة إيمانية جليلة في فضل الأم والأب، وكيف يفتح الله بهما أبواب الرزق والتوفيق والتيسير.",
    "totalEpisodes": 3,
    "episodes": [
      {
        "id": "shn_br_01",
        "episodeNumber": 1,
        "titleAr": "الموعظة 1: فضل الوالدين في القرآن وجنة الدنيا تحت أقدامهم",
        "titleEn": "Virtue of Parents in the Quran & Earthly Paradise",
        "durationFormatted": "42:15",
        "audioUrl": "https://archive.org/download/shinqitee_birr/01.mp3",
        "summaryAr": "«وقضى ربك ألا تعبدوا إلا إياه وبالوالدين إحسانا»؛ اقتران حقهما بحق الله سبحانه وتعالى."
      },
      {
        "id": "shn_br_02",
        "episodeNumber": 2,
        "titleAr": "الموعظة 2: قصص مؤثرة في بر الصالحين وأجر الإحسان عند الكبر",
        "titleEn": "Touching Stories of Pious Forebears Serving Parents",
        "durationFormatted": "45:40",
        "audioUrl": "https://archive.org/download/shinqitee_birr/02.mp3",
        "summaryAr": "خفض جناح الذل من الرحمة؛ كيف كان التابعون يطعمون أمهاتهم بأيديهم ويكتفون بنظرة رضا."
      },
      {
        "id": "shn_br_03",
        "episodeNumber": 3,
        "titleAr": "الموعظة 3: الدعاء للوالدين بعد وفاتهم والصدقة الجارية عنهم",
        "titleEn": "Praying for Parents After Death & Ongoing Charity",
        "durationFormatted": "41:50",
        "audioUrl": "https://archive.org/download/shinqitee_birr/03.mp3",
        "summaryAr": "انقطاع العمل إلا من ولد صالح يدعو له؛ استمرار البر والصلة ورفع درجاتهم في الجنان."
      }
    ]
  }
];
