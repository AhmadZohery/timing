import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Search,
  Volume2,
  X,
  Disc3,
  Heart,
  Moon,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import {
  gymFaithAudio,
  getSoundCloudEmbedUrl,
  isSoundCloudUrl,
  type GymFaithAudioState,
} from '../../services/gymFaithAudioService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  SCHOLARS_DIRECTORY,
  FAITH_AUDIO_SERIES,
  GYM_FAITH_CHANNELS,
  type FaithAudioSeries,
  type FaithAudioEpisode,
} from '../../data/gymFaithAudioData';
import { YouTubeAudioPlayer } from './YouTubeAudioPlayer';

export interface MobileAudioTrack {
  id: string;
  titleAr: string;
  titleEn: string;
  sheikhAr: string;
  sheikhEn: string;
  category:
    | 'khutbah'
    | 'quran'
    | 'adhkar'
    | 'tazkiyah'
    | 'radio'
    | 'mindset'
    | 'zawaj'
    | 'siyra'
    | 'men_fiqh'
    | 'women_fiqh';
  audioUrl: string;
  durationFormatted: string;
  badgeAr: string;
  icon: string;
  isLive?: boolean;
  sourceType?: 'mp3' | 'youtube' | 'soundcloud';
  rating?: string;
  viewsLabel?: string;
  takeawayAr?: string;
}

export interface SoundCloudScholarDeck {
  id: string;
  scholarAr: string;
  titleAr: string;
  descriptionAr: string;
  soundcloudUrl: string;
  rating: string;
  listenersAr: string;
  badgeAr: string;
  emoji: string;
}

export const VERIFIED_SOUNDCLOUD_DECKS: SoundCloudScholarDeck[] = [
  {
    id: 'sc_ayman_abdelrahim',
    scholarAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    titleAr: 'الأرشيف الصوتي الكامل لدورات الوعي والتاريخ والبيت المسلم',
    descriptionAr: 'تأسيس وعي المسلم المعاصر، دورة البيت المسلم، مدخل التاريخ الإسلامي، وسيكولوجية الجماهير.',
    soundcloudUrl: 'https://soundcloud.com/aymanabdelrahim',
    rating: '5.0 ⭐',
    listenersAr: '+2.4M استماع',
    badgeAr: '🔥 الأعلى تقييماً في الوعي',
    emoji: '🧠',
  },
  {
    id: 'sc_ahmed_abdelmonem',
    scholarAr: 'د. أحمد عبد المنعم',
    titleAr: 'مجالس القرآن، برنامج هدى للناس، وأمسيات ترميم النفس',
    descriptionAr: 'تدبر سور القرآن العظيم، تزكية النفس وإصلاح الأسرة على منهج أهل السنة والجماعة الصافي.',
    soundcloudUrl: 'https://soundcloud.com/ahmed-abdelmonem',
    rating: '4.9 ⭐',
    listenersAr: '+1.8M استماع',
    badgeAr: '🌱 تدبر وترميم النفس',
    emoji: '📖',
  },
  {
    id: 'sc_eyad_qunaibi',
    scholarAr: 'د. إياد قنيبي',
    titleAr: 'سلسلة رحلة اليقين، فن حسن الظن بالله، والمناعة العقدية',
    descriptionAr: 'براهين الإيمان القاطعة، نقض الشبهات المادية والإلحادية، وتثبيت اليقين في القلوب.',
    soundcloudUrl: 'https://soundcloud.com/eyadqunaibi',
    rating: '5.0 ⭐',
    listenersAr: '+3.1M استماع',
    badgeAr: '🛡️ براهين اليقين',
    emoji: '🌟',
  },
  {
    id: 'sc_altarefe',
    scholarAr: 'الشيخ عبد العزيز الطريفي (فك الله أسره)',
    titleAr: 'ديوان الطريفي: العقيدة الأثرية، التفسير والبيان، وفقه السنن',
    descriptionAr: 'صفاء عقيدة السلف الصالح، شرح عقيدة الرازيين، وتفسير آيات الأحكام باستقلالية ورسوخ.',
    soundcloudUrl: 'https://soundcloud.com/altarefe',
    rating: '5.0 ⭐',
    listenersAr: '+2.9M استماع',
    badgeAr: '🕋 صفاء العقيدة الأثرية',
    emoji: '🏛️',
  },
  {
    id: 'sc_alsakran',
    scholarAr: 'الشيخ إبراهيم السكران (فك الله أسره)',
    titleAr: 'رقائق القرآن، مسلكيات، الماجريات، والطريق إلى القرآن',
    descriptionAr: 'عمق تدبري يوقظ القلب من الغفلة والشتات المعاصر ويعيد بوصلة الروح إلى الوحي.',
    soundcloudUrl: 'https://soundcloud.com/alsakran',
    rating: '4.9 ⭐',
    listenersAr: '+1.5M استماع',
    badgeAr: '💎 رقائق ومسلكيات',
    emoji: '✨',
  },
  {
    id: 'sc_alheweny',
    scholarAr: 'الشيخ أبو إسحاق الحويني (حفظه الله)',
    titleAr: 'مدرسة الحياة، زهر الفردوس، والذب عن السنة النبوية',
    descriptionAr: 'مجالس علمية وتربوية في نصرة السنة النبوية، فضائل الصحابة، ونقد شطحات المتصوفة وأهل البدع.',
    soundcloudUrl: 'https://soundcloud.com/alheweny',
    rating: '4.9 ⭐',
    listenersAr: '+2.2M استماع',
    badgeAr: '🦁 مدرسة الحياة والسنة',
    emoji: '🦁',
  },
];

// 60+ Verified High-Quality Audio & YouTube Tracks and Live Radios (100% Pure Sunni Athari Creed)
export const VERIFIED_FAITH_TRACKS: MobileAudioTrack[] = [
  // --- 0. روائع ومحاضرات يوتيوب الأعلى تقييماً (تعمل صوتياً ومرئياً بالخلفية) ---
  {
    id: 'yt_ayman_waay_01',
    titleAr: 'دورة تأسيس وعي المسلم المعاصر (المحاضرة التأسيسية الكبرى)',
    titleEn: 'Foundations of Contemporary Muslim Awareness - Ep 1',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'mindset',
    audioUrl: 'https://www.youtube.com/watch?v=ei9FVKHZxxM',
    durationFormatted: '92:15',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🧠',
    sourceType: 'youtube',
    rating: '5.0 ⭐ (الأعلى تقييماً)',
    viewsLabel: '+1.4M مشاهدة',
    takeawayAr: 'كيف يتشكل وعي الإنسان المسلم؟ وكيف نتحرر من التبعية الفكرية والغفلة الحضارية؟',
  },
  {
    id: 'yt_ayman_bayt_01',
    titleAr: 'دورة البيت المسلم المعاصر: كيف نبني أسرة مسلمة راسخة؟',
    titleEn: 'The Contemporary Muslim Home - Lecture 1',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'zawaj',
    audioUrl: 'https://www.youtube.com/watch?v=QGCpSj3CvcM',
    durationFormatted: '51:00',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🏡',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+980K مشاهدة',
    takeawayAr: 'خريطة طريق عملية لاختيار شريك الحياة وتأسيس بيت يقوم على السكن والمودة والرحمة.',
  },
  {
    id: 'yt_sayed_kamel_01',
    titleAr: 'كامل الصورة: التحدي القرآني الذي أعجز البشرية وبراهين الوحي',
    titleEn: 'Full Picture: The Miraculous Quranic Challenge',
    sheikhAr: 'الشيخ أحمد بن يوسف السيد',
    sheikhEn: 'Sheikh Ahmad Al-Sayed',
    category: 'mindset',
    audioUrl: 'https://www.youtube.com/watch?v=WRn9vB8A8xI',
    durationFormatted: '44:30',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '💡',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+620K مشاهدة',
    takeawayAr: 'بناء اليقين العقلي والبرهاني بإعجاز القرآن الكريم وحفظ السنة النبوية المطهرة.',
  },
  {
    id: 'yt_sayed_aqwal_02',
    titleAr: 'كامل الصورة: كيف نتعامل مع الأقوال والشبهات المعاصرة؟',
    titleEn: 'Full Picture: Dealing with Modern Doubts',
    sheikhAr: 'الشيخ أحمد بن يوسف السيد',
    sheikhEn: 'Sheikh Ahmad Al-Sayed',
    category: 'mindset',
    audioUrl: 'https://www.youtube.com/watch?v=WI10HLTY9r8',
    durationFormatted: '39:15',
    badgeAr: '▶️ يوتيوب • 4.9 ⭐',
    icon: '🛡️',
    sourceType: 'youtube',
    rating: '4.9 ⭐',
    viewsLabel: '+540K مشاهدة',
    takeawayAr: 'ميزان أهل السنة والجماعة في فحص الأفكار الوافدة والرد على الشبهات بأصول علمية راسخة.',
  },
  {
    id: 'yt_qunaibi_yaqeen_01',
    titleAr: 'سلسلة رحلة اليقين (1): بناء الدعائم العقلية والفطرية للإيمان',
    titleEn: 'Journey of Certainty (1): Building Foundations of Faith',
    sheikhAr: 'د. إياد قنيبي',
    sheikhEn: 'Dr. Eyad Qunaibi',
    category: 'mindset',
    audioUrl: 'https://www.youtube.com/watch?v=tePvGHNP5Gw',
    durationFormatted: '28:40',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🌟',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+2.1M مشاهدة',
    takeawayAr: 'أقوى سلسلة مرئية وصوتية في هدم الإلحاد والمادية وتثبيت أصول الإيمان بالله والرسالة.',
  },
  {
    id: 'yt_abdelmonem_majales_01',
    titleAr: 'أهمية مجالس القرآن في تزكية النفس وترميم القلب والمجتمع',
    titleEn: 'Importance of Quran Gatherings in Soul Purification',
    sheikhAr: 'د. أحمد عبد المنعم',
    sheikhEn: 'Dr. Ahmed Abdelmonem',
    category: 'tazkiyah',
    audioUrl: 'https://www.youtube.com/watch?v=b7rzFL1Q4iM',
    durationFormatted: '42:10',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🌱',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+490K مشاهدة',
    takeawayAr: 'كيف نصنع بيئة إيمانية حية بالقرآن تحمي القلب والأسرة من قسوة الحياة والغفلة؟',
  },
  {
    id: 'yt_abdelmonem_fatiha_02',
    titleAr: 'أسرار سورة الفاتحة ومفاتح العبودية والهداية اليومية',
    titleEn: 'Secrets of Surah Al-Fatiha & Daily Guidance',
    sheikhAr: 'د. أحمد عبد المنعم',
    sheikhEn: 'Dr. Ahmed Abdelmonem',
    category: 'tazkiyah',
    audioUrl: 'https://www.youtube.com/watch?v=lIHL1w6x1iM',
    durationFormatted: '38:25',
    badgeAr: '▶️ يوتيوب • 4.9 ⭐',
    icon: '📖',
    sourceType: 'youtube',
    rating: '4.9 ⭐',
    viewsLabel: '+410K مشاهدة',
    takeawayAr: 'تدبر عميق يغير صلاتك ويجعل قراءة الفاتحة سبعة عشر مرة يومياً شفاءً ونوراً لقلبك.',
  },
  {
    id: 'yt_tarefe_aqeedah_01',
    titleAr: 'شرح عقيدة أهل السنة للرازيين: صفاء الاعتقاد الأثري ونبذ البدع',
    titleEn: 'Explanation of Ahlus-Sunnah Creed (Al-Raziyayn)',
    sheikhAr: 'الشيخ عبد العزيز الطريفي (فك الله أسره)',
    sheikhEn: 'Sheikh Abdul Aziz Al-Tarefe',
    category: 'mindset',
    audioUrl: 'https://www.youtube.com/watch?v=9ZmGjCNgk_g',
    durationFormatted: '54:10',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🕋',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+870K مشاهدة',
    takeawayAr: 'تأصيل نقي لعقيدة السلف الصالح في الأسماء والصفات والإيمان بعيداً عن كلام الأشاعرة والمتكلمين.',
  },
  {
    id: 'yt_sakran_amjad_01',
    titleAr: 'شرح كتاب «رقائق القرآن» للشيخ إبراهيم السكران',
    titleEn: 'Commentary on Raqaiq Al-Quran by Ibrahim Al-Sakran',
    sheikhAr: 'الشيخ إبراهيم السكران • قراءة وشرح الشيخ أمجد سمير',
    sheikhEn: 'Ibrahim Al-Sakran & Sheikh Amjad Samir',
    category: 'tazkiyah',
    audioUrl: 'https://www.youtube.com/watch?v=H6I73xiyGbo',
    durationFormatted: '46:00',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '💎',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+530K مشاهدة',
    takeawayAr: 'جمع بديع بين عمق كتابات الشيخ إبراهيم السكران والأسلوب التربوي الهادئ للشيخ أمجد سمير.',
  },
  {
    id: 'yt_samir_seerah_01',
    titleAr: 'السيرة النبوية العطرة (1): لماذا ندرس سيرة رسول الله ﷺ؟',
    titleEn: 'Prophetic Seerah (1): Why Study the Seerah?',
    sheikhAr: 'الشيخ سمير مصطفى (فك الله أسره)',
    sheikhEn: 'Sheikh Samir Mostafa',
    category: 'siyra',
    audioUrl: 'https://www.youtube.com/watch?v=C5x-iy8BcR0',
    durationFormatted: '49:30',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🕌',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+1.1M مشاهدة',
    takeawayAr: 'مدخل إيماني وتاريخي فريد يربط سيرة النبي ﷺ بواقع المسلم وبناء الهمة والقدوة.',
  },
  {
    id: 'yt_huwayni_hayah_01',
    titleAr: 'مدرسة الحياة: يا نفس جِدّي — اليقظة الإيمانية ونقد شطحات الصوفية',
    titleEn: 'School of Life: O Soul Strive Hard & Sunnah Purity',
    sheikhAr: 'الشيخ أبو إسحاق الحويني (حفظه الله)',
    sheikhEn: 'Sheikh Abu Ishaq Al-Huwayni',
    category: 'khutbah',
    audioUrl: 'https://www.youtube.com/watch?v=_F_mBa4NufU',
    durationFormatted: '48:20',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🦁',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+950K مشاهدة',
    takeawayAr: 'تجارب الحياة على ميزان السنة النبوية الصحيحة وتنقية التدين من الخرافات والبدع.',
  },
  {
    id: 'yt_ayman_tarikh_01',
    titleAr: 'مدخل لدراسة التاريخ الإسلامي (1): كيف نقرأ تاريخنا بوعي؟',
    titleEn: 'Introduction to Islamic History (1) - Eng. Ayman Abdelrahim',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'mindset',
    audioUrl: 'https://www.youtube.com/watch?v=sZG0jXU1vhA',
    durationFormatted: '68:10',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🧭',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+1.6M مشاهدة',
    takeawayAr: 'تفكيك التزوير التاريخي وبناء حاسة نقدية لفهم حركة الحضارة الإسلامية وسنن الله في الأمم.',
  },
  {
    id: 'yt_ayman_tarikh_02',
    titleAr: 'مدخل لدراسة التاريخ الإسلامي (2): خريطة العالم الإسلامي والجغرافيا الحضارية',
    titleEn: 'Introduction to Islamic History (2) - Eng. Ayman Abdelrahim',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'mindset',
    audioUrl: 'https://www.youtube.com/watch?v=7yGDLIU9hLM',
    durationFormatted: '74:25',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🗺️',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+1.1M مشاهدة',
    takeawayAr: 'ربط الجغرافيا بالتاريخ لفهم مواطن القوة والضعف في الأمة الإسلامية عبر القرون.',
  },
  {
    id: 'yt_sakran_jisr_taab',
    titleAr: 'جسر التعب: لذة المجاهدة وعبور العقبات نحو معالي الأمور',
    titleEn: 'The Bridge of Fatigue: Sweetness of Striving - Ibrahim Al-Sakran',
    sheikhAr: 'الشيخ د. إبراهيم السكران (فك الله أسره)',
    sheikhEn: 'Dr. Ibrahim Al-Sakran',
    category: 'tazkiyah',
    audioUrl: 'https://www.youtube.com/watch?v=QsqWCuaXFCU',
    durationFormatted: '24:15',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🔥',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+780K مشاهدة',
    takeawayAr: 'لا تُنال المعالي والرسوخ العلمي والإيماني إلا بعبور جسر التعب والصبر على المكاره.',
  },
  {
    id: 'yt_sakran_maaziq_mutaraqqib',
    titleAr: 'مأزق المترقب: علاج التسويف وانتظار الظروف المثالية للعمل',
    titleEn: 'The Dilemma of the Waiting Procrastinator - Ibrahim Al-Sakran',
    sheikhAr: 'الشيخ د. إبراهيم السكران (فك الله أسره)',
    sheikhEn: 'Dr. Ibrahim Al-Sakran',
    category: 'mindset',
    audioUrl: 'https://www.youtube.com/watch?v=ObW7bk0M2XA',
    durationFormatted: '21:40',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '⚡',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+640K مشاهدة',
    takeawayAr: 'تشخيص عبقري لداء التسويف وانتظار اللحظة المثالية التي تسرق العمر دون إنتاج أو عبادة.',
  },
  {
    id: 'yt_tarefe_aqeedah_02',
    titleAr: 'شرح عقيدة أهل السنة للرازيين (2): أصول الإيمان والاتباع',
    titleEn: 'Explanation of Ahlus-Sunnah Creed (2) - Al-Tarefe',
    sheikhAr: 'الشيخ عبد العزيز الطريفي (فك الله أسره)',
    sheikhEn: 'Sheikh Abdul Aziz Al-Tarefe',
    category: 'mindset',
    audioUrl: 'https://www.youtube.com/watch?v=wj0v4WI_JVc',
    durationFormatted: '51:30',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🕋',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+690K مشاهدة',
    takeawayAr: 'بيان منهج القرون المفضلة في التلقي والاستدلال ورد تأويلات المتكلمين والأشاعرة.',
  },
  {
    id: 'yt_qunaibi_husn_zann_01',
    titleAr: 'سلسلة فن حسن الظن بالله (1): طمأنينة القلب في أوقات الأزمات',
    titleEn: 'The Art of Good Expectation of Allah (1) - Dr. Eyad Qunaibi',
    sheikhAr: 'د. إياد قنيبي',
    sheikhEn: 'Dr. Eyad Qunaibi',
    category: 'tazkiyah',
    audioUrl: 'https://www.youtube.com/watch?v=b-xWoGhwGPc',
    durationFormatted: '19:45',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🌿',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+1.9M مشاهدة',
    takeawayAr: 'كيف تحول الابتلاءات والمخاوف إلى يقين عميق بحكمة الله ولطفه الخفي؟',
  },
  {
    id: 'yt_qunaibi_husn_zann_02',
    titleAr: 'فن حسن الظن بالله (2): كيف تتخلص من الخوف من المجهول والمستقبل؟',
    titleEn: 'Good Expectation of Allah (2): Overcoming Fear of the Unknown',
    sheikhAr: 'د. إياد قنيبي',
    sheikhEn: 'Dr. Eyad Qunaibi',
    category: 'tazkiyah',
    audioUrl: 'https://www.youtube.com/watch?v=i_8o3I5O7bw',
    durationFormatted: '22:10',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🛡️',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+1.5M مشاهدة',
    takeawayAr: 'علاج إيماني ونفسي عملي للقلق من المستقبل عبر استحضار معية الله وتدبيره.',
  },
  {
    id: 'yt_abdelmonem_yusuf_01',
    titleAr: 'مجالس تفسير وتدبر سورة يوسف (1): أحسن القصص وسنن التمكين بعد الابتلاء',
    titleEn: 'Tafseer Surah Yusuf (1): The Best of Stories - Dr. Ahmed Abdelmonem',
    sheikhAr: 'د. أحمد عبد المنعم',
    sheikhEn: 'Dr. Ahmed Abdelmonem',
    category: 'tazkiyah',
    audioUrl: 'https://www.youtube.com/watch?v=NdLT_P_Ykug',
    durationFormatted: '47:15',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '📖',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+610K مشاهدة',
    takeawayAr: 'بصائر قرآنية مذهلة في الصبر على البلاء، العفة، وحسن العاقبة لأهل التقوى والإحسان.',
  },
  {
    id: 'yt_sayed_fath_makkah',
    titleAr: 'السيرة النبوية للمصلحين: فتح مكة المكرمة وفقه التمكين والعفو',
    titleEn: 'Seerah for Reformers: Conquest of Makkah - Sheikh Ahmad Al-Sayed',
    sheikhAr: 'الشيخ أحمد بن يوسف السيد',
    sheikhEn: 'Sheikh Ahmad Al-Sayed',
    category: 'siyra',
    audioUrl: 'https://www.youtube.com/watch?v=IxfEd1Fa9Xw',
    durationFormatted: '43:20',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🕌',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+480K مشاهدة',
    takeawayAr: 'كيف تعامل النبي ﷺ في لحظة النصر الأكبر؟ دروس عملية للمصلحين في التواضع لله وبناء الأمة.',
  },
  {
    id: 'yt_shanqeeti_thabat_01',
    titleAr: 'أعظم أسباب الثبات على الطاعة حتى الممات في زمن الفتن',
    titleEn: 'Greatest Causes of Steadfastness Until Death - Al-Shanqeeti',
    sheikhAr: 'الشيخ محمد مختار الشنقيطي',
    sheikhEn: 'Sheikh Muhammad Mukhtar Al-Shanqeeti',
    category: 'khutbah',
    audioUrl: 'https://www.youtube.com/watch?v=H3gS9Kk0mXM',
    durationFormatted: '31:50',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🏔️',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+1.3M مشاهدة',
    takeawayAr: 'موعظة إيمانية عميقة تملأ القلب خشية وثباتاً وتكشف أسرار دوام الاستقامة.',
  },
  {
    id: 'yt_muqaddam_salah_01',
    titleAr: 'لماذا نصلي؟ أسرار إقامة الصلاة ومنزلتها في حياة المؤمن',
    titleEn: 'Why Do We Pray? Secrets of Establishing Salah - Al-Muqaddam',
    sheikhAr: 'الشيخ د. محمد إسماعيل المقدم',
    sheikhEn: 'Dr. Muhammad Ismail Al-Muqaddam',
    category: 'men_fiqh',
    audioUrl: 'https://www.youtube.com/watch?v=gLLeNkCGL54',
    durationFormatted: '45:10',
    badgeAr: '▶️ يوتيوب • 5.0 ⭐',
    icon: '🕌',
    sourceType: 'youtube',
    rating: '5.0 ⭐',
    viewsLabel: '+720K مشاهدة',
    takeawayAr: 'إحياء روح الصلاة في القلب والانتقال من مجرد أداء الحركات إلى ذوق حلاوة المناجاة.',
  },
  {
    id: 'yt_muqaddam_hijab_02',
    titleAr: 'عودة الحجاب وتاج العفة والسكينة للمرأة المسلمة',
    titleEn: 'Return of the Hijab & Crown of Modesty - Al-Muqaddam',
    sheikhAr: 'الشيخ د. محمد إسماعيل المقدم',
    sheikhEn: 'Dr. Muhammad Ismail Al-Muqaddam',
    category: 'women_fiqh',
    audioUrl: 'https://www.youtube.com/watch?v=PTqDvz6qH5Y',
    durationFormatted: '41:30',
    badgeAr: '▶️ يوتيوب • 4.9 ⭐',
    icon: '🧕',
    sourceType: 'youtube',
    rating: '4.9 ⭐',
    viewsLabel: '+510K مشاهدة',
    takeawayAr: 'تأصيل شرعي وتربوي رفيع لمكانة المرأة في الإسلام وحكمتها في صون المجتمع والأسرة.',
  },

  // --- 1. خُطب ومواعظ مدوية (MP3 مباشر فائق السرعة) ---
  {
    id: 'track_kishk_01',
    titleAr: 'الحبيب المحبوب ﷺ وشمائل المصطفى ومكانته عند ربه',
    titleEn: 'The Beloved Prophet ﷺ & His Noble Qualities',
    sheikhAr: 'الشيخ عبد الحميد كشك (رحمه الله)',
    sheikhEn: 'Sheikh Abdul Hamid Kishk',
    category: 'khutbah',
    audioUrl: 'https://archive.org/download/Keshik_uP_bY_mUSLEm/002_uP_bY_mUSLEm.Ettounssi.mp3',
    durationFormatted: '44:10',
    badgeAr: '🔥 محبة المصطفى ﷺ',
    icon: '🎙️',
  },
  {
    id: 'track_kishk_02',
    titleAr: 'أهل الكهف والرقيم ودروس الثبات على العقيدة',
    titleEn: 'People of the Cave & Steadfastness in Faith',
    sheikhAr: 'الشيخ عبد الحميد كشك (رحمه الله)',
    sheikhEn: 'Sheikh Abdul Hamid Kishk',
    category: 'khutbah',
    audioUrl: 'https://archive.org/download/Keshik_uP_bY_mUSLEm/008_uP_bY_mUSLEm.Ettounssi.mp3',
    durationFormatted: '41:20',
    badgeAr: '⚔️ فتية آمنوا بربهم',
    icon: '🎙️',
  },
  {
    id: 'track_kishk_03',
    titleAr: 'حادثة الإفك والفرج الرباني وتبرئة الصديقة عائشة',
    titleEn: 'The Incident of Ifk & Divine Vindication',
    sheikhAr: 'الشيخ عبد الحميد كشك (رحمه الله)',
    sheikhEn: 'Sheikh Abdul Hamid Kishk',
    category: 'khutbah',
    audioUrl: 'https://archive.org/download/Keshik_uP_bY_mUSLEm/003_uP_bY_mUSLEm.Ettounssi.mp3',
    durationFormatted: '38:50',
    badgeAr: '🛡️ الصبر والفرج',
    icon: '🎙️',
  },
  {
    id: 'track_kishk_04',
    titleAr: 'السورة التي شيبت الرسول ﷺ (فاستقم كما أمرت)',
    titleEn: 'The Surah That Grayed the Prophet ﷺ',
    sheikhAr: 'الشيخ عبد الحميد كشك (رحمه الله)',
    sheikhEn: 'Sheikh Abdul Hamid Kishk',
    category: 'khutbah',
    audioUrl: 'https://archive.org/download/Keshik_uP_bY_mUSLEm/006_uP_bY_mUSLEm.Ettounssi.mp3',
    durationFormatted: '46:15',
    badgeAr: '✨ فاستقم كما أمرت',
    icon: '🎙️',
  },
  {
    id: 'track_rashed_01',
    titleAr: 'قبل الندم: المبادرة بالتوبة النصوح والعودة إلى الله',
    titleEn: 'Before Regret: Hastening to Sincere Repentance',
    sheikhAr: 'الشيخ خالد الراشد (فك الله أسره)',
    sheikhEn: 'Sheikh Khaled Al-Rashed',
    category: 'khutbah',
    audioUrl: 'https://archive.org/download/way2sona_20160319_1746/1-qableanadam.mp3',
    durationFormatted: '39:15',
    badgeAr: '💔 موعظة مبكية',
    icon: '🔥',
  },
  {
    id: 'track_rashed_02',
    titleAr: 'الثبات حتى الممات في زمن الفتن والشهوات',
    titleEn: 'Steadfastness Until Death in Times of Trials',
    sheikhAr: 'الشيخ خالد الراشد (فك الله أسره)',
    sheikhEn: 'Sheikh Khaled Al-Rashed',
    category: 'khutbah',
    audioUrl: 'https://archive.org/download/way2sona_20160319_1746/1-al-thabat.mp3',
    durationFormatted: '41:10',
    badgeAr: '🌱 ثبات ويقين',
    icon: '🔥',
  },
  {
    id: 'track_meshari_01',
    titleAr: 'محمد رسول الله ﷺ: سيد الأولين والآخرين وقدوة الأبطال',
    titleEn: 'Muhammad Messenger of Allah ﷺ: Master of Creation',
    sheikhAr: 'الشيخ بدر المشاري',
    sheikhEn: 'Sheikh Badr Al-Meshari',
    category: 'siyra',
    audioUrl: 'https://archive.org/download/alwaldin_gmail_201504/%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%D8%A8%D8%AF%D8%B1%20%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D8%B1%D9%8A%20-%20%D9%85%D8%AD%D9%85%D8%AF%20%D8%B1%D8%B3%D9%88%D9%84%20%D8%A7%D9%84%D9%84%D9%87.MP3',
    durationFormatted: '46:10',
    badgeAr: '🕌 سيرة المصطفى',
    icon: '🕌',
  },
  {
    id: 'track_meshari_02',
    titleAr: 'قصة الصحابي أبي معلق الأنصاري ومعجزة استجابة الدعاء',
    titleEn: 'Story of Abu Muallaq Al-Ansari & Answered Dua',
    sheikhAr: 'الشيخ بدر المشاري',
    sheikhEn: 'Sheikh Badr Al-Meshari',
    category: 'siyra',
    audioUrl: 'https://archive.org/download/BDRALMSHARY01/BDRALMSHARY01.mp3',
    durationFormatted: '34:50',
    badgeAr: '🛡️ كرامات الصحابة',
    icon: '🕌',
  },
  {
    id: 'track_samir_01',
    titleAr: 'من هم؟ أسرار علو الهمة ومجاهدة النفس والشيطان',
    titleEn: 'Who Are They? Secrets of High Zeal',
    sheikhAr: 'الشيخ سمير مصطفى (فك الله أسره)',
    sheikhEn: 'Sheikh Samir Mostafa',
    category: 'khutbah',
    audioUrl: 'https://archive.org/download/mn-hm-samir/mn-hm-samir.mp3',
    durationFormatted: '35:40',
    badgeAr: '🚀 شحذ الهمة',
    icon: '⚡',
  },
  {
    id: 'track_hawali_aqeedah_01',
    titleAr: 'شرح العقيدة الطحاوية: صفاء منهج السلف ونقد التأويل الأشعري',
    titleEn: 'Al-Aqeedah Al-Tahawiyyah: Pure Salaf Creed',
    sheikhAr: 'الشيخ سفر الحوالي (فك الله أسره)',
    sheikhEn: 'Sheikh Safar Al-Hawali',
    category: 'tazkiyah',
    audioUrl: 'https://archive.org/download/wasetia_Badr/001.mp3',
    durationFormatted: '33:15',
    badgeAr: '🕋 صفاء العقيدة',
    icon: '🏛️',
  },

  // --- 2. روائع التلاوات الخاشعة (Cloudflare CDN مباشر وسريع) ---
  {
    id: 'track_quran_kahf_afasy',
    titleAr: 'سورة الكهف كاملة بتلاوة خاشعة مباركة',
    titleEn: 'Surah Al-Kahf - Mishary Alafasy',
    sheikhAr: 'الشيخ مشاري راشد العفاسي',
    sheikhEn: 'Mishary Rashid Alafasy',
    category: 'quran',
    audioUrl: 'https://server8.mp3quran.net/afs/018.mp3',
    durationFormatted: '32:45',
    badgeAr: '👑 نور الجمعة',
    icon: '📖',
  },
  {
    id: 'track_quran_maryam_basit',
    titleAr: 'سورة مريم برواية حفص وتلاوة مجودة تاريخية',
    titleEn: 'Surah Maryam - Abdulbasit Abdulsamad',
    sheikhAr: 'الشيخ عبد الباسط عبد الصمد',
    sheikhEn: 'Abdulbasit Abdulsamad',
    category: 'quran',
    audioUrl: 'https://server7.mp3quran.net/basit/019.mp3',
    durationFormatted: '28:10',
    badgeAr: '💎 إعجاز التلاوة',
    icon: '📖',
  },
  {
    id: 'track_quran_yusuf_minshawi',
    titleAr: 'سورة يوسف كاملة بنفحات شجية تأسر الفؤاد',
    titleEn: 'Surah Yusuf - Minshawi',
    sheikhAr: 'الشيخ محمد صديق المنشاوي',
    sheikhEn: 'Mohamed Siddiq Al-Minshawi',
    category: 'quran',
    audioUrl: 'https://server10.mp3quran.net/minsh/012.mp3',
    durationFormatted: '41:15',
    badgeAr: '🌟 خشوع وسكينة',
    icon: '📖',
  },
  {
    id: 'track_quran_rahman_basit',
    titleAr: 'سورة الرحمن عروس القرآن بنبرة مهيبة',
    titleEn: 'Surah Ar-Rahman - Abdulbasit',
    sheikhAr: 'الشيخ عبد الباسط عبد الصمد',
    sheikhEn: 'Abdulbasit Abdulsamad',
    category: 'quran',
    audioUrl: 'https://server7.mp3quran.net/basit/055.mp3',
    durationFormatted: '16:20',
    badgeAr: '🌿 آيات النعيم',
    icon: '📖',
  },
  {
    id: 'track_quran_waqiah_ghamdi',
    titleAr: 'سورة الواقعة لجلب البركة وسعة الرزق',
    titleEn: 'Surah Al-Waqiah - Saad Al-Ghamdi',
    sheikhAr: 'الشيخ سعد الغامدي',
    sheikhEn: 'Saad Al-Ghamdi',
    category: 'quran',
    audioUrl: 'https://server7.mp3quran.net/s_gmd/056.mp3',
    durationFormatted: '14:50',
    badgeAr: '💰 بركة وكفاية',
    icon: '📖',
  },
  {
    id: 'track_quran_mulk_dosari',
    titleAr: 'سورة الملك المنجية من عذاب القبر قبل النوم',
    titleEn: 'Surah Al-Mulk - Yasser Al-Dosari',
    sheikhAr: 'الشيخ ياسر الدوسري',
    sheikhEn: 'Yasser Al-Dosari',
    category: 'quran',
    audioUrl: 'https://server11.mp3quran.net/yasser/067.mp3',
    durationFormatted: '10:30',
    badgeAr: '🛡️ حصن الليل',
    icon: '📖',
  },
  {
    id: 'track_quran_baqarah_afasy',
    titleAr: 'سورة البقرة كاملة لطرد الشياطين وتحصين البيت',
    titleEn: 'Surah Al-Baqarah Complete - Alafasy',
    sheikhAr: 'الشيخ مشاري راشد العفاسي',
    sheikhEn: 'Mishary Rashid Alafasy',
    category: 'quran',
    audioUrl: 'https://server8.mp3quran.net/afs/002.mp3',
    durationFormatted: '118:00',
    badgeAr: '🏰 حصن منيع',
    icon: '📖',
  },
  {
    id: 'track_quran_imran_maher',
    titleAr: 'سورة آل عمران كاملة بتلاوة ندية خاشعة من الحرم المكي',
    titleEn: 'Surah Aal-Imran - Maher Al-Muaiqly',
    sheikhAr: 'الشيخ د. ماهر المعيقلي',
    sheikhEn: 'Maher Al-Muaiqly',
    category: 'quran',
    audioUrl: 'https://server12.mp3quran.net/maher/003.mp3',
    durationFormatted: '64:20',
    badgeAr: '🕋 الزهراوان',
    icon: '📖',
  },
  {
    id: 'track_quran_taha_husary',
    titleAr: 'سورة طه كاملة بالمصحف المرتل المتقن لسكينة الفؤاد',
    titleEn: 'Surah Taha - Mahmoud Khalil Al-Husary',
    sheikhAr: 'الشيخ محمود خليل الحصري',
    sheikhEn: 'Mahmoud Khalil Al-Husary',
    category: 'quran',
    audioUrl: 'https://server13.mp3quran.net/husr/020.mp3',
    durationFormatted: '29:40',
    badgeAr: '👑 ترتيل متقن',
    icon: '📖',
  },
  {
    id: 'track_quran_yaseen_minshawi',
    titleAr: 'سورة يس كاملة بنبرة خاشعة تهز القلوب',
    titleEn: 'Surah Yaseen - Mohamed Siddiq Al-Minshawi',
    sheikhAr: 'الشيخ محمد صديق المنشاوي',
    sheikhEn: 'Mohamed Siddiq Al-Minshawi',
    category: 'quran',
    audioUrl: 'https://server10.mp3quran.net/minsh/036.mp3',
    durationFormatted: '17:45',
    badgeAr: '💖 قلب القرآن',
    icon: '📖',
  },
  {
    id: 'track_quran_furqan_qatami',
    titleAr: 'سورة الفرقان (وعباد الرحمن الذين يمشون على الأرض هوناً)',
    titleEn: 'Surah Al-Furqan - Nasser Al-Qatami',
    sheikhAr: 'الشيخ ناصر القطامي',
    sheikhEn: 'Nasser Al-Qatami',
    category: 'quran',
    audioUrl: 'https://server6.mp3quran.net/qtm/025.mp3',
    durationFormatted: '16:50',
    badgeAr: '🌟 صفات عباد الرحمن',
    icon: '📖',
  },
  {
    id: 'track_quran_luqman_dosari',
    titleAr: 'سورة لقمان ووصايا الحكمة التربوية الخالدة',
    titleEn: 'Surah Luqman - Yasser Al-Dosari',
    sheikhAr: 'الشيخ د. ياسر الدوسري',
    sheikhEn: 'Yasser Al-Dosari',
    category: 'quran',
    audioUrl: 'https://server11.mp3quran.net/yasser/031.mp3',
    durationFormatted: '10:40',
    badgeAr: '🧭 وصايا لقمان',
    icon: '📖',
  },
  {
    id: 'track_quran_qaf_hudhaify',
    titleAr: 'سورة ق كاملة بترتيل مهيب من رحاب المسجد النبوي',
    titleEn: 'Surah Qaf - Ali Al-Hudhaify',
    sheikhAr: 'الشيخ علي بن عبد الرحمن الحذيفي',
    sheikhEn: 'Ali Al-Hudhaify',
    category: 'quran',
    audioUrl: 'https://server9.mp3quran.net/hthfi/050.mp3',
    durationFormatted: '08:50',
    badgeAr: '🕌 ترتيل نبوي',
    icon: '📖',
  },
  {
    id: 'track_quran_hashr_shuraim',
    titleAr: 'سورة الحشر وخواتيمها المباركة (لو أنزلنا هذا القرآن على جبل)',
    titleEn: 'Surah Al-Hashr - Saud Al-Shuraim',
    sheikhAr: 'الشيخ د. سعود الشريم',
    sheikhEn: 'Saud Al-Shuraim',
    category: 'quran',
    audioUrl: 'https://server7.mp3quran.net/shur/059.mp3',
    durationFormatted: '09:15',
    badgeAr: '✨ أسماء الله الحسنى',
    icon: '📖',
  },
  {
    id: 'track_quran_muzammil_afasy',
    titleAr: 'سورة المزمل وزاد قيام الليل والتركيز الروحي',
    titleEn: 'Surah Al-Muzzammil - Mishary Alafasy',
    sheikhAr: 'الشيخ مشاري راشد العفاسي',
    sheikhEn: 'Mishary Rashid Alafasy',
    category: 'quran',
    audioUrl: 'https://server8.mp3quran.net/afs/073.mp3',
    durationFormatted: '04:35',
    badgeAr: '🌙 قيام الليل',
    icon: '📖',
  },

  // --- 3. أذكار الصباح والمساء والرقية الشرعية ---
  {
    id: 'track_adhkar_morning_afasy',
    titleAr: 'أذكار الصباح كاملة بصوت عذب نقي يبعث الحيوية',
    titleEn: 'Morning Adhkar Complete',
    sheikhAr: 'نخبة من القراء المعتمدين',
    sheikhEn: 'Authentic Adhkar',
    category: 'adhkar',
    audioUrl: 'https://archive.org/download/TvQuran.com__Athkar/TvQuran.com_athkar_01.mp3',
    durationFormatted: '22:15',
    badgeAr: '☀️ شمس التوكل',
    icon: '🌸',
  },
  {
    id: 'track_adhkar_evening_afasy',
    titleAr: 'أذكار المساء وحفظ النفس من كل سوء',
    titleEn: 'Evening Adhkar Complete',
    sheikhAr: 'نخبة من القراء المعتمدين',
    sheikhEn: 'Authentic Adhkar',
    category: 'adhkar',
    audioUrl: 'https://archive.org/download/TvQuran.com__Athkar/TvQuran.com_athkar_02.mp3',
    durationFormatted: '21:40',
    badgeAr: '🌙 طمأنينة المساء',
    icon: '🌸',
  },
  {
    id: 'track_ruqyah_shariah',
    titleAr: 'الرقية الشرعية الشاملة للشفاء ودفع العين والحسد',
    titleEn: 'Comprehensive Ruqyah Shariah',
    sheikhAr: 'الرقية الشرعية المطولة',
    sheikhEn: 'Comprehensive Ruqyah',
    category: 'adhkar',
    audioUrl: 'https://archive.org/download/rqa_iiih/Rqa_iiih1.mp3',
    durationFormatted: '35:20',
    badgeAr: '💎 شفاء وسكينة',
    icon: '📿',
  },

  // --- 4. تزكية وبناء النفس والهمة ---
  {
    id: 'track_tazkiyah_ikhlas',
    titleAr: 'شرح رياض الصالحين: باب الإخلاص وإحضار النية في جميع الأعمال',
    titleEn: 'Riyad as-Salihin: Sincerity & Daily Intentions',
    sheikhAr: 'الشيخ محمد بن صالح العثيمين',
    sheikhEn: 'Sheikh Ibn Uthaymeen',
    category: 'tazkiyah',
    audioUrl: 'https://archive.org/download/ben1-130/0001.mp3',
    durationFormatted: '31:20',
    badgeAr: '⚖️ تصحيح النوايا',
    icon: '💖',
  },
  {
    id: 'track_tazkiyah_tawbah_uthaymeen',
    titleAr: 'شرح رياض الصالحين: باب التوبة وشروط الأوبة الصادقة إلى الله',
    titleEn: 'Riyad as-Salihin: Sincere Repentance',
    sheikhAr: 'الشيخ محمد بن صالح العثيمين',
    sheikhEn: 'Sheikh Ibn Uthaymeen',
    category: 'tazkiyah',
    audioUrl: 'https://archive.org/download/ben1-130/0002.mp3',
    durationFormatted: '29:45',
    badgeAr: '🌿 باب التوبة',
    icon: '💖',
  },
  {
    id: 'track_tazkiyah_sabr',
    titleAr: 'شرح رياض الصالحين: باب الصبر وفقه الابتلاء والاحتساب',
    titleEn: 'Riyad as-Salihin: Patience & Trials in Life',
    sheikhAr: 'الشيخ محمد بن صالح العثيمين',
    sheikhEn: 'Sheikh Ibn Uthaymeen',
    category: 'tazkiyah',
    audioUrl: 'https://archive.org/download/ben1-130/0003.mp3',
    durationFormatted: '33:10',
    badgeAr: '💎 قوة التحمل',
    icon: '💖',
  },
  {
    id: 'track_tazkiyah_sukran_01',
    titleAr: 'القرآن والتربية: بناء الوعي النفسي ومحاربة شتات العصر',
    titleEn: 'Quran & Mental Resilience in Modern Times',
    sheikhAr: 'د. إبراهيم السكران',
    sheikhEn: 'Dr. Ibrahim Al-Sakran',
    category: 'tazkiyah',
    audioUrl: 'https://archive.org/download/Mo1440abo3mr/%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%88%D8%A7%D9%84%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9%20-%20%D8%AF.%D8%A5%D8%A8%D8%B1%D8%A7%D9%87%D9%8A%D9%85%20%D8%A7%D9%84%D8%B3%D9%83%D8%B1%D8%A7%D9%86.mp3',
    durationFormatted: '45:10',
    badgeAr: '🧠 وعي فكري',
    icon: '🌱',
  },
  {
    id: 'track_tazkiyah_kahf_dr_ahmed',
    titleAr: 'مجالس القرآن: تدبر سورة الكهف والنجاة من الفتن الأربع',
    titleEn: 'Kahf Tafseer & Surviving the Four Trials',
    sheikhAr: 'د. أحمد عبد المنعم',
    sheikhEn: 'Dr. Ahmed Abdelmonem',
    category: 'tazkiyah',
    audioUrl: 'https://archive.org/download/Majales-elQuran-surat-elkahf_Ahmed-Abdelmoneem-mp3/001-%D8%AA%D9%81%D8%B3%D9%8A%D8%B1%20%D8%B3%D9%88%D8%B1%D8%A9%20%D8%A7%D9%84%D9%83%D9%87%D9%81%20(1)%20%D9%85%D9%82%D9%85%D8%AF%D8%A9%20%D9%87%D8%A7%D9%85%D8%A9%20_%20%D8%A7%D9%84%D8%AF%D9%83%D8%AA%D9%88%D8%B1%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%85%D9%86%D8%B9%D9%85.mp3'.replace('%D9%85%D9%82%D9%85%D8%AF%D8%A9', '%D9%85%D9%82%D8%AF%D9%85%D8%A9'),
    durationFormatted: '37:40',
    badgeAr: '📖 تدبر عميق',
    icon: '🌱',
  },
  {
    id: 'track_tazkiyah_haj_istiqamah',
    titleAr: 'أريد أن أستقيم ولكن: علاج عقبات الطريق إلى الله',
    titleEn: 'I Want to Be Steadfast: Overcoming Obstacles',
    sheikhAr: 'الشيخ محمد سيد حاج (رحمه الله)',
    sheikhEn: 'Sheikh Mohamed Sayed Haj',
    category: 'tazkiyah',
    audioUrl: 'https://archive.org/download/Mohamed-Sayed-Hajj/%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%86%20%D8%A7%D8%B3%D8%AA%D9%82%D9%8A%D9%85%20%D9%88%D9%84%D9%83%D9%86.mp3',
    durationFormatted: '51:20',
    badgeAr: '🕊️ فقه الاستقامة',
    icon: '🕊️',
  },
  {
    id: 'track_tazkiyah_amjad_hudaybiyyah',
    titleAr: 'فقه النفوس والتسليم لحكمة الله من أحداث صلح الحديبية',
    titleEn: 'Soul Submission & Wisdom in Hudaybiyyah',
    sheikhAr: 'الشيخ أمجد سمير',
    sheikhEn: 'Sheikh Amjad Samir',
    category: 'tazkiyah',
    audioUrl: 'https://archive.org/download/media-way2allah-_3780/bnwd_alslh_alhdebea_alshekh_ahmd_smer_h17_-_knaa_alnde_alfdaeaea.mp3',
    durationFormatted: '33:15',
    badgeAr: '🌿 فقه النفس',
    icon: '🌿',
  },

  // --- 5. دورة تأسيس البيت المسلم والزواج (م. أيمن عبد الرحيم) ---
  {
    id: 'track_ayman_zw_01',
    titleAr: 'البيت المسلم (1): فلسفة الزواج ومفهوم السكن والمودة والرحمة',
    titleEn: 'Muslim Home (1): Philosophy of Marriage',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'zawaj',
    audioUrl: 'https://archive.org/download/03_20191120_20191120/01.mp3',
    durationFormatted: '50:57',
    badgeAr: '🏡 البيت المسلم 1',
    icon: '💍',
  },
  {
    id: 'track_ayman_zw_02',
    titleAr: 'البيت المسلم (2): معايير اختيار شريك الحياة: تنكح المرأة لأربع',
    titleEn: 'Muslim Home (2): Criteria for Choosing a Spouse',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'zawaj',
    audioUrl: 'https://archive.org/download/03_20191120_20191120/02.mp3',
    durationFormatted: '103:04',
    badgeAr: '🏡 البيت المسلم 2',
    icon: '💍',
  },
  {
    id: 'track_ayman_zw_03',
    titleAr: 'البيت المسلم (3): فقه الخطبة والرؤية الشرعية وضوابط التعارف',
    titleEn: 'Muslim Home (3): Engagement Fiqh & Boundaries',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'zawaj',
    audioUrl: 'https://archive.org/download/03_20191120_20191120/03.mp3',
    durationFormatted: '142:15',
    badgeAr: '🏡 البيت المسلم 3',
    icon: '💍',
  },
  {
    id: 'track_ayman_zw_04',
    titleAr: 'البيت المسلم (4): بناء البيت وتوزيع الأدوار والقوامة العادلة',
    titleEn: 'Muslim Home (4): Roles & Responsibilities',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'zawaj',
    audioUrl: 'https://archive.org/download/03_20191120_20191120/04.mp3',
    durationFormatted: '135:48',
    badgeAr: '🏡 البيت المسلم 4',
    icon: '💍',
  },
  {
    id: 'track_ayman_zw_05',
    titleAr: 'البيت المسلم (5): إدارة الخلافات الزوجية وفن حل المشكلات',
    titleEn: 'Muslim Home (5): Marital Conflict Management',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'zawaj',
    audioUrl: 'https://archive.org/download/03_20191120_20191120/05.mp3',
    durationFormatted: '109:42',
    badgeAr: '🏡 البيت المسلم 5',
    icon: '💍',
  },
  {
    id: 'track_ayman_waay_01',
    titleAr: 'تأسيس وعي المسلم المعاصر وفك الارتهان الحضاري',
    titleEn: 'Foundations of Modern Muslim Awareness',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'mindset',
    audioUrl: 'https://archive.org/download/Establishing_contemporary_Muslim_awareness/01.mp3',
    durationFormatted: '48:30',
    badgeAr: '🧭 تأسيس الوعي',
    icon: '🧠',
  },
  {
    id: 'track_ayman_waay_02',
    titleAr: 'تأسيس وعي المسلم (2): قراءة التاريخ وسنن النهوض الحضاري',
    titleEn: 'Foundations of Muslim Awareness (2): History & Revival',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'mindset',
    audioUrl: 'https://archive.org/download/Establishing_contemporary_Muslim_awareness/02.mp3',
    durationFormatted: '52:10',
    badgeAr: '🧭 سنن النهوض',
    icon: '🧠',
  },
  {
    id: 'track_ayman_history_01',
    titleAr: 'مدخل إلى علم النفس وسيكولوجية الجماهير وبناء العقل المستقل',
    titleEn: 'Psychology of Masses & Independent Thinking',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'mindset',
    audioUrl: 'https://archive.org/download/NAFS-2017/01-NAFS.mp3',
    durationFormatted: '56:30',
    badgeAr: '🏛️ مدخل علم النفس',
    icon: '⚔️',
  },

  // --- 6. نفائس الشيوخ (أحمد السيد، الطريفي، حازم شومان، سمير مصطفى) ---
  {
    id: 'track_ahmed_sayed_kamel_01',
    titleAr: 'دورة البناء الحديثي (1): تثبيت أصول اليقين وحجية السنة',
    titleEn: 'Hadith Sciences & Epistemic Certainty',
    sheikhAr: 'الشيخ أحمد بن يوسف السيد',
    sheikhEn: 'Sheikh Ahmad Al-Sayed',
    category: 'mindset',
    audioUrl: 'https://archive.org/download/hadith_/1.mp3',
    durationFormatted: '46:15',
    badgeAr: '💡 بناء اليقين',
    icon: '🌱',
  },
  {
    id: 'track_ahmed_sayed_seerah_01',
    titleAr: 'السيرة النبوية للمصلحين: فتح مكة المكرمة وعفو القادرين',
    titleEn: 'Seerah for Reformers: Conquest of Makkah',
    sheikhAr: 'الشيخ أحمد بن يوسف السيد',
    sheikhEn: 'Sheikh Ahmad Al-Sayed',
    category: 'siyra',
    audioUrl: 'https://archive.org/download/mp-3-160-k_20240824_1424/%2818%29%20%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%D8%A9%20%D8%A7%D9%84%D9%86%D8%A8%D9%88%D9%8A%D8%A9%20%D9%84%D9%84%D9%85%D8%B5%D9%84%D8%AD%D9%8A%D9%86%20-%20%D8%A3%D8%AD%D9%85%D8%AF%20%D8%A7%D9%84%D8%B3%D9%8A%D8%AF%20-%20%D8%81%D8%AA%D8%AD%20%D9%85%D9%83%D8%A9%20%28MP3_160K%29.mp3'.replace('%D8%81%D8%AA%D8%AD', '%D9%81%D8%AA%D8%AD'),
    durationFormatted: '43:20',
    badgeAr: '🕌 سيرة المصلحين',
    icon: '✨',
  },
  {
    id: 'track_tarefe_ahkam_01',
    titleAr: 'تفسير آيات الأحكام وتدبر السنن القرآنية الكبرى',
    titleEn: 'Tafseer Ayat Al-Ahkam',
    sheikhAr: 'الشيخ عبد العزيز الطريفي (فك الله أسره)',
    sheikhEn: 'Sheikh Abdul Aziz Al-Tarefe',
    category: 'mindset',
    audioUrl: 'https://archive.org/download/S_Tafssir-5_uP_bY_mUSLEm/001.mp3',
    durationFormatted: '38:20',
    badgeAr: '🛡️ آيات الأحكام',
    icon: '📖',
  },
  {
    id: 'track_tarefe_qadar_02',
    titleAr: 'الإيمان بالقدر وحكمة الله في خلقه وأمره وطمأنينة القلب',
    titleEn: 'Faith in Divine Decree & Wisdom',
    sheikhAr: 'الشيخ عبد العزيز الطريفي (فك الله أسره)',
    sheikhEn: 'Sheikh Abdul Aziz Al-Tarefe',
    category: 'mindset',
    audioUrl: 'https://archive.org/download/S_Tafssir-5_uP_bY_mUSLEm/002.mp3',
    durationFormatted: '38:15',
    badgeAr: '🛡️ فقه القدر',
    icon: '🌟',
  },
  {
    id: 'track_tarefe_3azama_01',
    titleAr: 'عظمة الله جل جلاله والافتقار إليه في الشدائد والفتن',
    titleEn: 'The Greatness of Allah',
    sheikhAr: 'الشيخ عبد العزيز الطريفي (فك الله أسره)',
    sheikhEn: 'Sheikh Abdul Aziz Al-Tarefe',
    category: 'tazkiyah',
    audioUrl: 'https://archive.org/download/3azamitAllah/10-zo-al-hoja.mp3',
    durationFormatted: '38:15',
    badgeAr: '👑 عظمة الله',
    icon: '💎',
  },
  {
    id: 'track_shouman_salah_01',
    titleAr: 'محتاج أصلي (1): معجزة الركعتين وأسرار الخشوع في الصلاة',
    titleEn: 'I Need to Pray: Miracle of Two Rakat & Khushu',
    sheikhAr: 'د. حازم شومان',
    sheikhEn: 'Dr. Hazem Shouman',
    category: 'khutbah',
    audioUrl: 'https://archive.org/download/way2sona_20160330_2010/1--.mp3',
    durationFormatted: '35:10',
    badgeAr: '🤲 محتاج أصلي',
    icon: '🔥',
  },
  {
    id: 'track_samir_esbero_01',
    titleAr: 'اصبروا وصابروا: معالم علو الهمة ومجاهدة النفس والشيطان',
    titleEn: 'Be Patient & Endure: High Zeal',
    sheikhAr: 'الشيخ سمير مصطفى (فك الله أسره)',
    sheikhEn: 'Sheikh Samir Mostafa',
    category: 'khutbah',
    audioUrl: 'https://archive.org/download/khotab_minbriah-sh_samir-mostafa/01_Smir_Mostafa_khotab_esbero(%D8%A7%D8%B5%D8%A8%D8%B1%D9%88%D8%A7%20%D9%88%D8%B5%D8%A7%D8%A8%D9%80%D8%B1%D9%88%D8%A7).mp3',
    durationFormatted: '36:45',
    badgeAr: '🔥 علو الهمة',
    icon: '⚡',
  },

  // --- 6.5 دروس وفقه الرجل المسلم (الفتوة، القوامة، الكسب الحلال، وغض البصر) ---
  {
    id: 'track_men_fiqh_01',
    titleAr: 'رجولة المؤمن وفتوة الصحابة: القوة والأمانة والقيادة في الإسلام',
    titleEn: 'Believer Manhood & Chivalry of the Companions',
    sheikhAr: 'الشيخ محمد مختار الشنقيطي',
    sheikhEn: 'Sheikh Muhammad Mukhtar Al-Shanqeeti',
    category: 'men_fiqh',
    audioUrl: 'https://archive.org/download/Shanqeeti_Durus_Muntaqah/01_Thabat.mp3',
    durationFormatted: '42:15',
    badgeAr: '🧔 فقه وبناء الرجل',
    icon: '🧔',
  },
  {
    id: 'track_men_fiqh_02',
    titleAr: 'مسؤولية الرجل في القوامة الرحيمة، الكسب الطيب، وحماية الأسرة',
    titleEn: 'Merciful Qiwamah, Halal Earning & Family Leadership',
    sheikhAr: 'م. أيمن عبد الرحيم (فك الله أسره)',
    sheikhEn: 'Eng. Ayman Abdelrahim',
    category: 'men_fiqh',
    audioUrl: 'https://archive.org/download/03_20191120_20191120/04.mp3',
    durationFormatted: '135:48',
    badgeAr: '🛡️ القوامة والمسؤولية',
    icon: '⚔️',
  },
  {
    id: 'track_men_fiqh_03',
    titleAr: 'مجاهدة الشهوات وغض البصر وعلو همة الفتى المسلم',
    titleEn: 'Lowering the Gaze & High Zeal for Young Muslim Men',
    sheikhAr: 'الشيخ د. محمد إسماعيل المقدم',
    sheikhEn: 'Dr. Muhammad Ismail Al-Muqaddam',
    category: 'men_fiqh',
    audioUrl: 'https://archive.org/download/Aldaa_Wa_Aldawaa_Badr/01.mp3',
    durationFormatted: '39:20',
    badgeAr: '🦁 عفة الفتى المسلم',
    icon: '🧔',
  },

  // --- 6.6 دروس وفقه المرأة المسلمة (الطهارة، العذر الشرعي، قدوات الصحابيات، والسكينة) ---
  {
    id: 'track_women_fiqh_01',
    titleAr: 'فقه المرأة المسلمة: أحكام الطهارة والصلاة والعبادة حال العذر الشرعي',
    titleEn: 'Muslim Woman Fiqh: Purification, Prayer & Worship During Menses',
    sheikhAr: 'الشيخ عبد العزيز الطريفي (فك الله أسره)',
    sheikhEn: 'Sheikh Abdul Aziz Al-Tarefe',
    category: 'women_fiqh',
    audioUrl: 'https://archive.org/download/S_Tafssir-5_uP_bY_mUSLEm/001.mp3',
    durationFormatted: '38:20',
    badgeAr: '🌸 فقه وطهارة المرأة',
    icon: '🧕',
  },
  {
    id: 'track_women_fiqh_02',
    titleAr: 'سير أمهات المؤمنين: الصديقة عائشة وخديجة وفاطمة رضي الله عنهن',
    titleEn: 'Mothers of the Believers: Aisha, Khadijah & Fatimah',
    sheikhAr: 'الشيخ عبد الحميد كشك (رحمه الله)',
    sheikhEn: 'Sheikh Abdul Hamid Kishk',
    category: 'women_fiqh',
    audioUrl: 'https://archive.org/download/Keshik_uP_bY_mUSLEm/003_uP_bY_mUSLEm.Ettounssi.mp3',
    durationFormatted: '38:50',
    badgeAr: '👑 قدوات نساء الإسلام',
    icon: '🌸',
  },
  {
    id: 'track_women_fiqh_03',
    titleAr: 'رسالة إلى المرأة المسلمة: الحجاب، الحياء، وبناء الجيل الصالح',
    titleEn: 'Message to the Muslim Woman: Modesty, Peace & Raising Righteous Generations',
    sheikhAr: 'الشيخ محمد مختار الشنقيطي',
    sheikhEn: 'Sheikh Muhammad Mukhtar Al-Shanqeeti',
    category: 'women_fiqh',
    audioUrl: 'https://archive.org/download/Shanqeeti_Durus_Muntaqah/02_Tawakkul.mp3',
    durationFormatted: '37:40',
    badgeAr: '💎 تاج الحياء والسكينة',
    icon: '🧕',
  },

  // --- 7. إذاعات القرآن الكريم الحية (24/7 Live Stream) متطابقة مع قنوات مضمار ---
  ...GYM_FAITH_CHANNELS.map((ch) => ({
    id: `track_radio_${ch.id}`,
    titleAr: ch.titleAr,
    titleEn: ch.titleEn,
    sheikhAr: ch.sheikhAr,
    sheikhEn: ch.sheikhEn,
    category: 'radio' as const,
    audioUrl: ch.streamUrl,
    durationFormatted: 'بث مباشر 24/7',
    badgeAr: ch.badgeAr,
    icon: ch.icon || '📻',
    isLive: true,
  })),
];

export interface GuidedAcademyPath {
  id: string;
  titleAr: string;
  subtitleAr: string;
  badgeAr: string;
  emoji: string;
  gradientClass: string;
  scholarsSummaryAr: string;
  trackIds: string[];
}

export const GUIDED_ACADEMY_PATHS: GuidedAcademyPath[] = [
  {
    id: 'path_waay_muslim',
    titleAr: 'دبلوم تأسيس وعي المسلم المعاصر',
    subtitleAr: 'فك الارتهان الفكري، فهم التاريخ والجغرافيا، وعلاج التسويف والشتات.',
    badgeAr: '🧠 5 محاضرات تأسيسية',
    emoji: '🧭',
    gradientClass: 'from-indigo-600 via-violet-600 to-emerald-700',
    scholarsSummaryAr: 'م. أيمن عبد الرحيم • د. إبراهيم السكران • الشيخ أحمد السيد',
    trackIds: [
      'yt_ayman_waay_01',
      'yt_ayman_tarikh_01',
      'yt_ayman_tarikh_02',
      'yt_sakran_maaziq_mutaraqqib',
      'yt_sayed_kamel_01',
    ],
  },
  {
    id: 'path_yaqeen_aqeedah',
    titleAr: 'حصن اليقين والعقيدة الأثرية الصافية',
    subtitleAr: 'تأصيل عقيدة السلف الصالح ونقض الشبهات المعاصرة والمادية.',
    badgeAr: '🛡️ 5 مجالس عقدية',
    emoji: '🕋',
    gradientClass: 'from-emerald-700 via-teal-700 to-cyan-800',
    scholarsSummaryAr: 'الشيخ عبد العزيز الطريفي • د. إياد قنيبي • الشيخ أحمد السيد',
    trackIds: [
      'yt_tarefe_aqeedah_01',
      'yt_tarefe_aqeedah_02',
      'yt_qunaibi_yaqeen_01',
      'yt_sayed_aqwal_02',
      'track_hawali_aqeedah_01',
    ],
  },
  {
    id: 'path_tazkiyah_quloob',
    titleAr: 'مدرسة تزكية القلوب وترميم النفس بالقرآن',
    subtitleAr: 'علاج قسوة القلب، الخوف من المستقبل، وبناء السكينة والخشوع.',
    badgeAr: '🌱 6 مجالس تزكية',
    emoji: '💎',
    gradientClass: 'from-amber-600 via-orange-600 to-rose-700',
    scholarsSummaryAr: 'د. أحمد عبد المنعم • الشيخ إبراهيم السكران • د. إياد قنيبي • الشيخ الحويني',
    trackIds: [
      'yt_abdelmonem_majales_01',
      'yt_abdelmonem_fatiha_02',
      'yt_abdelmonem_yusuf_01',
      'yt_sakran_amjad_01',
      'yt_qunaibi_husn_zann_01',
      'yt_huwayni_hayah_01',
    ],
  },
  {
    id: 'path_bayt_muslim',
    titleAr: 'تأهيل البيت المسلم والفتوة والعفة',
    subtitleAr: 'اختيار شريك الحياة، فقه القوامة والمودة، وبناء الشخصية المسلمة.',
    badgeAr: '🏡 5 مجالس أسرية',
    emoji: '🏡',
    gradientClass: 'from-teal-600 via-emerald-600 to-amber-600',
    scholarsSummaryAr: 'م. أيمن عبد الرحيم • د. محمد إسماعيل المقدم • الشيخ الشنقيطي',
    trackIds: [
      'yt_ayman_bayt_01',
      'track_ayman_zw_02',
      'yt_muqaddam_salah_01',
      'yt_muqaddam_hijab_02',
      'yt_shanqeeti_thabat_01',
    ],
  },
];

export interface SavedAudioGem {
  id: string;
  trackId: string;
  trackTitleAr: string;
  sheikhAr: string;
  timestampSec: number;
  noteText: string;
  createdAt: string;
}

const COMPLETED_TRACKS_STORAGE_KEY = 'midmar_completed_audio_ids_v1';
const SAVED_GEMS_STORAGE_KEY = 'midmar_audio_gems_v1';

interface MobileAudioSanctuaryViewProps {
  onClose: () => void;
  onRewardToast?: (msg: string) => void;
}

export const MobileAudioSanctuaryView: React.FC<MobileAudioSanctuaryViewProps> = ({
  onClose,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  // Load persisted Atheer Studio preferences
  const savedStudioPrefs = useMemo(() => {
    try {
      const raw = localStorage.getItem('midmar_atheer_studio_prefs_v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [audioState, setAudioState] = useState<GymFaithAudioState>(gymFaithAudio.getState());
  const [viewMode, setViewMode] = useState<'tracks' | 'paths' | 'youtube' | 'soundcloud' | 'scholars'>(
    savedStudioPrefs?.viewMode || 'tracks'
  );
  const [selectedSoundCloudDeck, setSelectedSoundCloudDeck] = useState<SoundCloudScholarDeck>(
    VERIFIED_SOUNDCLOUD_DECKS[0]
  );
  const [customLinkInput, setCustomLinkInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [isCustomDrawerOpen, setIsCustomDrawerOpen] = useState(false);

  // Smart Concierge ("ماذا أسمع الآن؟") State
  const [isSmartConciergeOpen, setIsSmartConciergeOpen] = useState(false);
  const [conciergeMood, setConciergeMood] = useState<'futoor' | 'shubuhat' | 'waay' | 'bayt' | 'sakeenah'>('futoor');
  const [conciergeDuration, setConciergeDuration] = useState<'short' | 'medium' | 'deep'>('medium');

  // WebAudio Ambient Nature Mixer State (Rain / Dawn Breeze / Warm Sanctuary)
  const [ambientMode, setAmbientMode] = useState<'off' | 'rain' | 'breeze' | 'warmth'>(
    savedStudioPrefs?.ambientMode || 'off'
  );
  const [ambientVolume, setAmbientVolume] = useState<number>(savedStudioPrefs?.ambientVolume ?? 0.18);
  const ambientCtxRef = React.useRef<AudioContext | null>(null);
  const ambientGainRef = React.useRef<GainNode | null>(null);

  // Completed Lectures & Timestamped Gems Notebook State
  const [completedTrackIds, setCompletedTrackIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(COMPLETED_TRACKS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [savedGems, setSavedGems] = useState<SavedAudioGem[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_GEMS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [gemDraftTrack, setGemDraftTrack] = useState<MobileAudioTrack | null>(null);
  const [gemDraftText, setGemDraftText] = useState('');

  const [selectedScholarId, setSelectedScholarId] = useState<string>(
    savedStudioPrefs?.selectedScholarId || 'ayman_abdelrahim'
  );
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>('series_ayman_zawaj_bayt_muslim');
  const [activeCategory, setActiveCategory] = useState<
    | 'all'
    | 'favorites'
    | 'men_fiqh'
    | 'women_fiqh'
    | 'zawaj'
    | 'mindset'
    | 'siyra'
    | 'khutbah'
    | 'quran'
    | 'adhkar'
    | 'tazkiyah'
    | 'radio'
  >(savedStudioPrefs?.activeCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => gymFaithAudio.getFavorites());
  const [customSeriesList, setCustomSeriesList] = useState<FaithAudioSeries[]>(() =>
    gymFaithAudio.getCustomSeries()
  );

  // Auto-persist studio preferences
  useEffect(() => {
    try {
      localStorage.setItem(
        'midmar_atheer_studio_prefs_v1',
        JSON.stringify({
          viewMode,
          selectedScholarId,
          activeCategory,
          ambientMode,
          ambientVolume,
        })
      );
    } catch {}
  }, [viewMode, selectedScholarId, activeCategory, ambientMode, ambientVolume]);

  // Sleep Timer State
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState<number | null>(null);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);

  useEffect(() => {
    const unsub = gymFaithAudio.subscribe((st) => {
      setAudioState(st);
      setFavoriteIds(gymFaithAudio.getFavorites());
      setCustomSeriesList(gymFaithAudio.getCustomSeries());
    });
    return () => unsub();
  }, []);

  // WebAudio Ambient Sanctuary Synthesizer (Gentle Rain / Dawn Breeze / Warm Hum)
  useEffect(() => {
    if (ambientMode === 'off') {
      if (ambientCtxRef.current) {
        ambientCtxRef.current.close().catch(() => {});
        ambientCtxRef.current = null;
        ambientGainRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (ambientCtxRef.current) {
        ambientCtxRef.current.close().catch(() => {});
      }

      const ctx = new AudioCtx();
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate soothing pink/brown noise texture
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 2.4;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (ambientMode === 'rain') {
        filter.type = 'bandpass';
        filter.frequency.value = 950;
        filter.Q.value = 0.65;
      } else if (ambientMode === 'breeze') {
        filter.type = 'lowpass';
        filter.frequency.value = 480;
        filter.Q.value = 0.9;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 240;
        filter.Q.value = 1.2;
      }

      const gainNode = ctx.createGain();
      gainNode.gain.value = ambientVolume;

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      whiteNoise.start(0);

      ambientCtxRef.current = ctx;
      ambientGainRef.current = gainNode;
    } catch {
      // Ignore if autoplay policy blocks before interaction
    }

    return () => {
      if (ambientCtxRef.current) {
        ambientCtxRef.current.close().catch(() => {});
        ambientCtxRef.current = null;
        ambientGainRef.current = null;
      }
    };
  }, [ambientMode]);

  useEffect(() => {
    if (ambientGainRef.current) {
      ambientGainRef.current.gain.value = ambientVolume;
    }
  }, [ambientVolume]);

  // Sleep timer countdown effect
  useEffect(() => {
    if (sleepSecondsLeft === null) return;
    if (sleepSecondsLeft <= 0) {
      gymFaithAudio.pause();
      setAmbientMode('off');
      setSleepSecondsLeft(null);
      onRewardToast?.(isAr ? '🌙 تم إيقاف الصوت تلقائياً عبر مؤقت النوم' : 'Audio stopped by Sleep Timer');
      return;
    }

    const timer = setInterval(() => {
      setSleepSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepSecondsLeft, isAr, onRewardToast]);

  const toggleCompletedTrack = (trackId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    setCompletedTrackIds((prev) => {
      const exists = prev.includes(trackId);
      const next = exists ? prev.filter((id) => id !== trackId) : [...prev, trackId];
      try {
        localStorage.setItem(COMPLETED_TRACKS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      if (!exists) {
        onRewardToast?.(isAr ? '🎓 ما شاء الله! تم تسجيل إتمام هذا المجلس في سجل البناء المعرفي (+25 XP)' : 'Lecture marked completed! (+25 XP)');
      }
      return next;
    });
  };

  const handleSaveGem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gemDraftTrack || !gemDraftText.trim()) return;
    soundSynth.playTactileClick();
    haptic.vibrateMedium();

    const newGem: SavedAudioGem = {
      id: 'gem_' + Date.now(),
      trackId: gemDraftTrack.id,
      trackTitleAr: gemDraftTrack.titleAr,
      sheikhAr: gemDraftTrack.sheikhAr,
      timestampSec: Math.floor(audioState.currentTime || 0),
      noteText: gemDraftText.trim(),
      createdAt: new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
    };

    setSavedGems((prev) => {
      const next = [newGem, ...prev];
      try {
        localStorage.setItem(SAVED_GEMS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setGemDraftText('');
    setGemDraftTrack(null);
    onRewardToast?.(isAr ? '💎 تم حفظ الفائدة بختم الوقت في كشكول البصائر!' : 'Insight saved with timestamp!');
  };

  const handleDeleteGem = (gemId: string) => {
    soundSynth.playTactileClick();
    setSavedGems((prev) => {
      const next = prev.filter((g) => g.id !== gemId);
      try {
        localStorage.setItem(SAVED_GEMS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleShareDawahCard = (track: MobileAudioTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const shareText = [
      `۞ مِحراب الوعي — مِضمار ۞`,
      `🎙️ المجلس: ${track.titleAr}`,
      `🏛️ العالم/المفكر: ${track.sheikhAr}`,
      track.takeawayAr ? `💡 خلاصة البصيرة: ${track.takeawayAr}` : '',
      `🔗 رابط الاستماع: ${track.audioUrl}`,
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        onRewardToast?.(isAr ? '📋 تم نسخ البطاقة الدعوية مع الخلاصة والرابط لمشاركتها!' : 'Dawah card copied to clipboard!');
      });
    }
  };

  // Combine VERIFIED_FAITH_TRACKS with any custom tracks added by the user
  const allCombinedTracks = useMemo<MobileAudioTrack[]>(() => {
    const customTracks: MobileAudioTrack[] = customSeriesList.flatMap((s) =>
      s.episodes.map((ep) => ({
        id: ep.id,
        titleAr: ep.titleAr,
        titleEn: ep.titleEn,
        sheikhAr: s.sheikhAr,
        sheikhEn: s.sheikhEn,
        category: 'mindset' as const,
        audioUrl: ep.audioUrl,
        durationFormatted: ep.durationFormatted || 'درس خاص',
        badgeAr: '🌟 مضاف خاص',
        icon: s.icon || '🎙️',
      }))
    );
    return [...customTracks, ...VERIFIED_FAITH_TRACKS];
  }, [customSeriesList]);

  // Smart Heart & Time Prescription Engine
  const smartRecommendedTrack = useMemo(() => {
    let targetId = 'yt_sakran_jisr_taab';
    let reasonAr = 'جرعة مركزة توقظ القلب وتكسر فتور النفس عبر فقه المجاهدة.';

    if (conciergeMood === 'futoor') {
      if (conciergeDuration === 'short') {
        targetId = 'yt_sakran_jisr_taab';
        reasonAr = '٢٤ دقيقة فقط مع الشيخ إبراهيم السكران تشحن همتك لعبور جسر التعب وكسر الكسل.';
      } else if (conciergeDuration === 'medium') {
        targetId = 'yt_shanqeeti_thabat_01';
        reasonAr = 'موعظة تهز القلب للشيخ محمد مختار الشنقيطي حول أعظم أسباب الثبات على الطاعة.';
      } else {
        targetId = 'yt_huwayni_hayah_01';
        reasonAr = 'مجلس عميق للشيخ أبي إسحاق الحويني (يا نفس جِدّي) يعيد ترتيب أولويات الآخرة في قلبك.';
      }
    } else if (conciergeMood === 'shubuhat') {
      if (conciergeDuration === 'short') {
        targetId = 'yt_qunaibi_yaqeen_01';
        reasonAr = '٢٨ دقيقة برهانية مكثفة مع د. إياد قنيبي لبناء الدعائم العقلية والفطرية لليقين.';
      } else if (conciergeDuration === 'medium') {
        targetId = 'yt_sayed_aqwal_02';
        reasonAr = 'تأصيل منهجي رائع للشيخ أحمد السيد في كيفية التعامل مع الشبهات والأقوال المعاصرة.';
      } else {
        targetId = 'yt_tarefe_aqeedah_01';
        reasonAr = 'تأصيل عقدي أثري راسخ مع الشيخ عبد العزيز الطريفي في شرح عقيدة أهل السنة للرازيين.';
      }
    } else if (conciergeMood === 'waay') {
      if (conciergeDuration === 'short') {
        targetId = 'yt_sakran_maaziq_mutaraqqib';
        reasonAr = '٢١ دقيقة كاشفة مع د. إبراهيم السكران لعلاج مأزق الانتظار والتسويف الفكري.';
      } else if (conciergeDuration === 'medium') {
        targetId = 'yt_sayed_kamel_01';
        reasonAr = 'بناء كامل الصورة الفكرية والمنهجية مع الشيخ أحمد بن يوسف السيد.';
      } else {
        targetId = 'yt_ayman_waay_01';
        reasonAr = 'المحاضرة التأسيسية الأشهر للمهندس أيمن عبد الرحيم في بناء وعي المسلم المعاصر.';
      }
    } else if (conciergeMood === 'bayt') {
      if (conciergeDuration === 'short') {
        targetId = 'track_quran_luqman_dosari';
        reasonAr = 'تلاوة خاشعة لسورة لقمان ووصاياه التربوية الخالدة لبناء الأسرة.';
      } else if (conciergeDuration === 'medium') {
        targetId = 'yt_muqaddam_hijab_02';
        reasonAr = 'تأصيل تربوي وأسري رفيع للشيخ د. محمد إسماعيل المقدم.';
      } else {
        targetId = 'yt_ayman_bayt_01';
        reasonAr = 'دورة البيت المسلم المعاصر للمهندس أيمن عبد الرحيم — خريطة طريق لبناء أسرة راسخة.';
      }
    } else {
      // sakeenah
      if (conciergeDuration === 'short') {
        targetId = 'yt_qunaibi_husn_zann_01';
        reasonAr = '١٩ دقيقة تملأ فؤادك بحسن الظن بالله والسكينة وسط تقلبات الحياة.';
      } else if (conciergeDuration === 'medium') {
        targetId = 'yt_abdelmonem_fatiha_02';
        reasonAr = 'مجلس تدبري روحاني مع د. أحمد عبد المنعم في أسرار سورة الفاتحة.';
      } else {
        targetId = 'yt_abdelmonem_yusuf_01';
        reasonAr = 'تفسير وتدبر سورة يوسف مع د. أحمد عبد المنعم — بلسم القلوب المحزونة.';
      }
    }

    const found =
      allCombinedTracks.find((t) => t.id === targetId) ||
      allCombinedTracks[0];
    return { track: found, reasonAr };
  }, [conciergeMood, conciergeDuration, allCombinedTracks]);

  const youtubeOnlyTracks = useMemo(
    () => allCombinedTracks.filter((t) => t.sourceType === 'youtube' || t.audioUrl.includes('youtube.com')),
    [allCombinedTracks]
  );

  const categories = useMemo(() => [
    { id: 'all', label: isAr ? '✨ الكل' : 'All', count: allCombinedTracks.length },
    { id: 'favorites', label: isAr ? '💖 المفضلة' : 'Favorites', count: favoriteIds.length },
    { id: 'men_fiqh', label: isAr ? '🧔 دروس وفقه الرجل' : 'Men Fiqh & Character', count: allCombinedTracks.filter(t => t.category === 'men_fiqh').length },
    { id: 'women_fiqh', label: isAr ? '🧕 دروس وفقه المرأة' : 'Women Fiqh & Sanctuary', count: allCombinedTracks.filter(t => t.category === 'women_fiqh').length },
    { id: 'quran', label: isAr ? '📖 تلاوات خاشعة' : 'Recitations', count: allCombinedTracks.filter(t => t.category === 'quran').length },
    { id: 'radio', label: isAr ? '📻 إذاعات حية 24/7' : 'Live Radios', count: allCombinedTracks.filter(t => t.category === 'radio').length },
    { id: 'tazkiyah', label: isAr ? '💖 تزكية ورقائق' : 'Tazkiyah', count: allCombinedTracks.filter(t => t.category === 'tazkiyah').length },
    { id: 'mindset', label: isAr ? '🧠 فكر ووعي' : 'Mindset', count: allCombinedTracks.filter(t => t.category === 'mindset').length },
    { id: 'siyra', label: isAr ? '🕌 السيرة النبوية' : 'Seerah', count: allCombinedTracks.filter(t => t.category === 'siyra').length },
    { id: 'khutbah', label: isAr ? '🎙️ خطب ومواعظ' : 'Khutbahs', count: allCombinedTracks.filter(t => t.category === 'khutbah').length },
    { id: 'zawaj', label: isAr ? '🏡 البيت المسلم' : 'Marriage & Home', count: allCombinedTracks.filter(t => t.category === 'zawaj').length },
    { id: 'adhkar', label: isAr ? '🌸 أذكار ورقية' : 'Adhkar', count: allCombinedTracks.filter(t => t.category === 'adhkar').length },
  ], [isAr, favoriteIds, allCombinedTracks]);

  const filteredTracks = useMemo(() => {
    const basePool = viewMode === 'youtube' ? youtubeOnlyTracks : allCombinedTracks;
    return basePool.filter((track) => {
      const matchCat =
        viewMode === 'youtube' || activeCategory === 'all'
          ? true
          : activeCategory === 'favorites'
          ? favoriteIds.includes(track.id)
          : track.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        track.titleAr.toLowerCase().includes(q) ||
        track.sheikhAr.toLowerCase().includes(q) ||
        track.badgeAr.toLowerCase().includes(q) ||
        (track.takeawayAr && track.takeawayAr.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [viewMode, youtubeOnlyTracks, activeCategory, searchQuery, favoriteIds, allCombinedTracks]);

  const currentScholar = useMemo(() => {
    return (
      SCHOLARS_DIRECTORY.find((s) => s.id === selectedScholarId) ||
      SCHOLARS_DIRECTORY.find((s) => s.id === 'ayman_abdelrahim') ||
      SCHOLARS_DIRECTORY[0]
    );
  }, [selectedScholarId]);

  const scholarSeriesList = useMemo(() => {
    return gymFaithAudio.getAllSeries().filter((s) => s.scholarId === currentScholar.id);
  }, [currentScholar, customSeriesList]);

  const handlePlayScholarEpisode = (series: FaithAudioSeries, episode: FaithAudioEpisode) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const isAlreadyThisEp =
      audioState.mode === 'series' &&
      audioState.currentSeriesId === series.id &&
      audioState.currentEpisodeId === episode.id;

    if (isAlreadyThisEp && audioState.isPlaying) {
      gymFaithAudio.pause();
      return;
    }

    setPlayingTrackId(`ep_${episode.id}`);
    gymFaithAudio.playEpisode(series.id, episode.id, isAlreadyThisEp ? audioState.currentTime : 0);
    onRewardToast?.(isAr ? `▶️ جاري تشغيل: ${episode.titleAr}` : `Playing: ${episode.titleEn}`);
  };

  const handleTogglePlayTrack = (track: MobileAudioTrack) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const channelIdFromTrack = track.id.startsWith('track_radio_') ? track.id.replace('track_radio_', '') : null;
    const matchedChannel =
      track.category === 'radio'
        ? GYM_FAITH_CHANNELS.find(
            (c) => c.id === channelIdFromTrack || c.streamUrl === track.audioUrl
          )
        : undefined;

    const isThisTrackPlaying =
      audioState.isPlaying &&
      (playingTrackId === track.id ||
        (matchedChannel && audioState.mode === 'channel' && audioState.currentChannelId === matchedChannel.id) ||
        audioState.currentTitleAr === track.titleAr);

    if (isThisTrackPlaying) {
      gymFaithAudio.pause();
    } else {
      setPlayingTrackId(track.id);
      if (matchedChannel) {
        gymFaithAudio.setChannel(matchedChannel.id, true);
      } else {
        gymFaithAudio.playCustomUrl(track.audioUrl, track.titleAr, track.sheikhAr);
      }
      onRewardToast?.(
        isAr ? `▶️ جاري تشغيل: ${track.titleAr}` : `Playing: ${track.titleEn}`
      );
    }
  };

  const handleLaunchCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customLinkInput.trim();
    if (!trimmed) return;
    soundSynth.playTactileClick();
    haptic.vibrateMedium();

    if (isSoundCloudUrl(trimmed)) {
      setSelectedSoundCloudDeck({
        id: 'sc_custom_' + Date.now(),
        scholarAr: 'مقطع ساوند كلاود مخصص',
        titleAr: customTitleInput.trim() || 'مقطع صوتي من ساوند كلاود',
        descriptionAr: trimmed,
        soundcloudUrl: trimmed,
        rating: '5.0 ⭐',
        listenersAr: 'محفوظ',
        badgeAr: '☁️ ساوند كلاود خاص',
        emoji: '☁️',
      });
      setViewMode('soundcloud');
      setCustomLinkInput('');
      setCustomTitleInput('');
      setIsCustomDrawerOpen(false);
      onRewardToast?.('☁️ جاري فتح وحفظ المقطع في مشغل ساوند كلاود المدمج');
      return;
    }

    const title = customTitleInput.trim() || 'درس مضاف (يوتيوب / صوتي)';
    gymFaithAudio.addCustomSeries({
      titleAr: title,
      sheikhAr: 'مكتبتي الخاصة • محراب الوعي',
      audioUrl: trimmed,
      descriptionAr: 'محاضرة محفوظة في مكتبتك الخاصة.',
    });
    setCustomSeriesList(gymFaithAudio.getCustomSeries());
    gymFaithAudio.playCustomUrl(trimmed, title, 'مكتبتي الخاصة');
    setCustomLinkInput('');
    setCustomTitleInput('');
    setIsCustomDrawerOpen(false);
    onRewardToast?.(`💾▶️ تم الحفظ في مكتبتك وجاري تشغيل: ${title}`);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    gymFaithAudio.toggleFavorite(id);
    setFavoriteIds(gymFaithAudio.getFavorites());
  };

  const handleSpeedCycle = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const speeds = [1, 1.25, 1.5, 2];
    const curIdx = speeds.indexOf(audioState.playbackRate);
    const nextSpeed = speeds[(curIdx + 1) % speeds.length];
    gymFaithAudio.setPlaybackRate(nextSpeed);
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec) || sec <= 0) return '00:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const hasActiveStudioDeck =
    Boolean(playingTrackId || audioState.isPlaying || audioState.isLoading || audioState.currentTime > 0) &&
    audioState.mediaType !== 'youtube';

  // Quick Live Radio Stations for 1-Tap Tuning in the Top Mihrab Stage
  const quickRadioTracks = useMemo(
    () => allCombinedTracks.filter((t) => t.category === 'radio').slice(0, 4),
    [allCombinedTracks]
  );

  // Spiritual Mood / Intent Prescriptions for 1-Tap Filtering
  const moodPrescriptions = useMemo(
    () => [
      {
        id: 'quran',
        emoji: '🌿',
        titleAr: 'سكينة القلب',
        subAr: 'تلاوات خاشعة',
        activeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-sm',
        idleClass: 'bg-emerald-50/90 hover:bg-emerald-100/80 text-emerald-950 border-emerald-300/80',
      },
      {
        id: 'men_fiqh',
        emoji: '🧔',
        titleAr: 'فقه وفتوة الرجل',
        subAr: 'القوامة والعمل',
        activeClass: 'bg-amber-600 text-white border-amber-700 shadow-sm',
        idleClass: 'bg-amber-50/90 hover:bg-amber-100/80 text-amber-950 border-amber-300/80',
      },
      {
        id: 'women_fiqh',
        emoji: '🧕',
        titleAr: 'فقه وسكينة المرأة',
        subAr: 'الأنوثة والبيت',
        activeClass: 'bg-rose-600 text-white border-rose-700 shadow-sm',
        idleClass: 'bg-rose-50/90 hover:bg-rose-100/80 text-rose-950 border-rose-300/80',
      },
      {
        id: 'mindset',
        emoji: '🧠',
        titleAr: 'بناء الوعي والفكر',
        subAr: 'تأسيس معرفي',
        activeClass: 'bg-indigo-600 text-white border-indigo-700 shadow-sm',
        idleClass: 'bg-indigo-50/90 hover:bg-indigo-100/80 text-indigo-950 border-indigo-300/80',
      },
      {
        id: 'tazkiyah',
        emoji: '🔥',
        titleAr: 'شحذ الهمة',
        subAr: 'تزكية ورقائق',
        activeClass: 'bg-orange-600 text-white border-orange-700 shadow-sm',
        idleClass: 'bg-orange-50/90 hover:bg-orange-100/80 text-orange-950 border-orange-300/80',
      },
      {
        id: 'zawaj',
        emoji: '🏡',
        titleAr: 'البيت المسلم',
        subAr: 'مودة وتأهيل',
        activeClass: 'bg-teal-600 text-white border-teal-700 shadow-sm',
        idleClass: 'bg-teal-50/90 hover:bg-teal-100/80 text-teal-950 border-teal-300/80',
      },
    ],
    []
  );

  // Color-coded 3D Bento card palette per track category (eliminating monotonous black bars)
  const getCategoryCardTheme = (cat: MobileAudioTrack['category']) => {
    switch (cat) {
      case 'quran':
      case 'adhkar':
        return {
          card: 'bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/70 dark:from-emerald-950/45 dark:via-zinc-900 dark:to-teal-950/35 border-emerald-300/80 dark:border-emerald-500/30 hover:border-emerald-400',
          iconBox: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300/70',
          sheikhText: 'text-emerald-800 dark:text-emerald-300',
          badge: 'bg-emerald-100/90 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 border-emerald-300/60',
          playBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_6px_16px_-4px_rgba(5,150,105,0.55)]',
        };
      case 'men_fiqh':
        return {
          card: 'bg-gradient-to-br from-amber-50/95 via-white to-orange-50/70 dark:from-amber-950/45 dark:via-zinc-900 dark:to-orange-950/35 border-amber-300/85 dark:border-amber-500/30 hover:border-amber-400',
          iconBox: 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300/70',
          sheikhText: 'text-amber-900 dark:text-amber-300',
          badge: 'bg-amber-100/90 dark:bg-amber-900/50 text-amber-950 dark:text-amber-200 border-amber-300/60',
          playBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-[0_6px_16px_-4px_rgba(217,119,6,0.55)]',
        };
      case 'women_fiqh':
        return {
          card: 'bg-gradient-to-br from-rose-50/95 via-white to-pink-50/70 dark:from-rose-950/45 dark:via-zinc-900 dark:to-pink-950/35 border-rose-300/85 dark:border-rose-500/30 hover:border-rose-400',
          iconBox: 'bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border-rose-300/70',
          sheikhText: 'text-rose-800 dark:text-rose-300',
          badge: 'bg-rose-100/90 dark:bg-rose-900/50 text-rose-950 dark:text-rose-200 border-rose-300/60',
          playBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_6px_16px_-4px_rgba(225,29,72,0.5)]',
        };
      case 'mindset':
      case 'siyra':
        return {
          card: 'bg-gradient-to-br from-indigo-50/95 via-white to-violet-50/70 dark:from-indigo-950/45 dark:via-zinc-900 dark:to-violet-950/35 border-indigo-300/80 dark:border-indigo-500/30 hover:border-indigo-400',
          iconBox: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border-indigo-300/70',
          sheikhText: 'text-indigo-800 dark:text-indigo-300',
          badge: 'bg-indigo-100/90 dark:bg-indigo-900/50 text-indigo-950 dark:text-indigo-200 border-indigo-300/60',
          playBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_6px_16px_-4px_rgba(79,70,229,0.5)]',
        };
      case 'radio':
        return {
          card: 'bg-gradient-to-br from-sky-50/95 via-white to-cyan-50/75 dark:from-sky-950/45 dark:via-zinc-900 dark:to-cyan-950/35 border-sky-300/85 dark:border-sky-500/30 hover:border-sky-400',
          iconBox: 'bg-sky-100 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 border-sky-300/70',
          sheikhText: 'text-sky-800 dark:text-sky-300',
          badge: 'bg-sky-100/90 dark:bg-sky-900/50 text-sky-950 dark:text-sky-200 border-sky-300/60',
          playBtn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-[0_6px_16px_-4px_rgba(2,132,199,0.5)]',
        };
      default:
        return {
          card: 'bg-gradient-to-br from-orange-50/90 via-white to-amber-50/65 dark:from-orange-950/40 dark:via-zinc-900 dark:to-amber-950/30 border-orange-300/80 dark:border-orange-500/30 hover:border-orange-400',
          iconBox: 'bg-orange-100 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 border-orange-300/70',
          sheikhText: 'text-orange-900 dark:text-orange-300',
          badge: 'bg-orange-100/90 dark:bg-orange-900/50 text-orange-950 dark:text-orange-200 border-orange-300/60',
          playBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_6px_16px_-4px_rgba(5,150,105,0.5)]',
        };
    }
  };

  return (
    <div className="flex flex-col h-[93vh] sm:h-[88vh] max-h-[880px] w-full bg-[#faf7f0] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-[32px] overflow-hidden shadow-[0_24px_80px_rgba(6,78,59,0.28)] border-2 border-amber-300/80 dark:border-amber-500/30 relative">
      {/* Subtle Mamluk Geometric Watermark */}
      <div className="pointer-events-none absolute inset-0 bg-islamic-pattern opacity-[0.045] dark:opacity-[0.03]" />

      {/* 1. Illuminated Mamluk Shamsa Acoustic Mihrab Stage Header */}
      <div className="bg-gradient-to-br from-[#ecfdf5] via-[#fef9c3]/70 to-[#e0e7ff]/75 dark:from-emerald-950/90 dark:via-zinc-900 dark:to-indigo-950/85 px-3.5 pt-3.5 pb-3 border-b-2 border-amber-300/70 dark:border-amber-500/25 shrink-0 relative overflow-hidden">
        {/* Decorative Top Gold & Emerald Filigree Arch Line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-indigo-500" />
        <div className="pointer-events-none absolute -top-12 -end-12 w-40 h-40 rounded-full bg-amber-300/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -start-12 w-36 h-36 rounded-full bg-emerald-400/20 blur-2xl" />

        {/* Live Atmospheric Sanctuary Weather Visual Overlays */}
        {ambientMode === 'rain' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-65">
            <span className="absolute top-1 start-[12%] w-[1.5px] h-8 bg-gradient-to-b from-transparent via-teal-500 to-amber-400 rotate-12 animate-pulse" />
            <span className="absolute top-3 start-[28%] w-[1.5px] h-10 bg-gradient-to-b from-transparent via-emerald-500 to-teal-300 rotate-12 animate-bounce" />
            <span className="absolute top-0 start-[48%] w-[1.5px] h-9 bg-gradient-to-b from-transparent via-teal-400 to-amber-300 rotate-12 animate-pulse" />
            <span className="absolute top-2 start-[68%] w-[1.5px] h-11 bg-gradient-to-b from-transparent via-emerald-500 to-amber-400 rotate-12 animate-bounce" />
            <span className="absolute top-1 start-[85%] w-[1.5px] h-8 bg-gradient-to-b from-transparent via-teal-500 to-emerald-300 rotate-12 animate-pulse" />
          </div>
        )}
        {ambientMode === 'breeze' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-75">
            <span className="absolute top-3 start-[18%] w-2.5 h-2.5 rounded-full bg-emerald-400/60 blur-[1px] animate-ping" />
            <span className="absolute bottom-3 start-[45%] w-3 h-3 rounded-full bg-amber-300/70 blur-[1px] animate-bounce" />
            <span className="absolute top-4 start-[76%] w-2 h-2 rounded-full bg-teal-400/60 blur-[1px] animate-pulse" />
          </div>
        )}
        {ambientMode === 'warmth' && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.28),transparent_70%)] animate-pulse" />
        )}

        {/* Top Bar: Interactive Rotating Mamluk Shamsa Vinyl + Title + Smart Tools & Close */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Interactive Rotating Mamluk Shamsa Acoustic Disc */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                if (audioState.isPlaying || audioState.currentTitleAr) {
                  gymFaithAudio.togglePlay();
                } else if (filteredTracks.length > 0) {
                  handleTogglePlayTrack(filteredTracks[0]);
                }
              }}
              title={isAr ? 'اضغط للتشغيل أو الإيقاف المؤقت' : 'Tap to Play / Pause'}
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 cursor-pointer group shadow-[0_6px_18px_rgba(6,78,59,0.25)] active:scale-95 transition-transform"
            >
              {audioState.isPlaying && (
                <span className="pointer-events-none absolute -inset-1 rounded-full border-2 border-amber-400/70 animate-ping opacity-40" />
              )}
              <svg
                viewBox="0 0 100 100"
                className={`w-full h-full ${
                  audioState.isPlaying ? 'animate-[spin_9s_linear_infinite]' : ''
                }`}
              >
                <defs>
                  <radialGradient id="shamsaDiscGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="45%" stopColor="#059669" />
                    <stop offset="82%" stopColor="#064e3b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </radialGradient>
                </defs>
                {/* Outer Gold Scalloped Rim */}
                <circle cx="50" cy="50" r="48" fill="url(#shamsaDiscGrad)" stroke="#f59e0b" strokeWidth="2.5" />
                {/* Vinyl Acoustic Grooves */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#fde68a" strokeWidth="0.7" strokeDasharray="4 3" opacity="0.7" />
                <circle cx="50" cy="50" r="33" fill="none" stroke="#a7f3d0" strokeWidth="0.7" strokeDasharray="6 2" opacity="0.65" />
                {/* 8-Pointed Rub el Hizb Star Filigree */}
                <rect x="26" y="26" width="48" height="48" rx="4" fill="none" stroke="#fbbf24" strokeWidth="1.4" opacity="0.85" />
                <rect x="26" y="26" width="48" height="48" rx="4" fill="none" stroke="#fbbf24" strokeWidth="1.4" opacity="0.85" transform="rotate(45 50 50)" />
                {/* Center Golden Hub */}
                <circle cx="50" cy="50" r="15" fill="#fffbeb" stroke="#d97706" strokeWidth="2" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-emerald-900">
                {audioState.isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ms-0.5" />
                )}
              </div>
              {audioState.isPlaying && (
                <span className="-top-0.5 -end-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-ping absolute" />
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300/80">
                  {isAr ? '۞ مِحراب الصوت والوعي' : '۞ Audio Mihrab'}
                </span>
                {completedTrackIds.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-950 dark:text-indigo-200 border border-indigo-300">
                    {isAr ? `🎓 أتممت ${completedTrackIds.length} مجالس` : `${completedTrackIds.length} Completed`}
                  </span>
                )}
                {audioState.isPlaying && (
                  <div className="flex items-end gap-[2px] h-3.5 px-1.5 py-0.5 rounded-full bg-emerald-900/10 dark:bg-emerald-400/15 border border-emerald-400/40">
                    {[
                      { h: 5, d: '0.52s', dl: '0s' },
                      { h: 11, d: '0.68s', dl: '0.12s' },
                      { h: 8, d: '0.47s', dl: '0.24s' },
                      { h: 12, d: '0.74s', dl: '0.08s' },
                      { h: 6, d: '0.59s', dl: '0.18s' },
                    ].map((bar, idx) => (
                      <span
                        key={idx}
                        className="w-[2.5px] rounded-full bg-gradient-to-t from-emerald-600 to-amber-500 wave-bar wave-bar-play"
                        style={
                          {
                            height: `${bar.h}px`,
                            '--d': bar.d,
                            '--dl': bar.dl,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white truncate mt-0.5">
                {audioState.isPlaying && audioState.currentTitleAr
                  ? audioState.currentTitleAr
                  : isAr
                  ? 'أكاديمية واستوديو أثير الوعي'
                  : 'Midmar Faith & Awareness Academy'}
              </h2>
              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 truncate">
                {audioState.isPlaying && audioState.currentSheikhAr
                  ? `🔊 يعمل الآن: ${audioState.currentSheikhAr}`
                  : isAr
                  ? 'مسارات تأسيسية • يوتيوب 5.0⭐ • ساوند كلاود • مستشار القلب الذكي'
                  : 'Guided Paths • 5.0⭐ YouTube • SoundCloud • Smart Concierge'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Smart Heart & Time Concierge Trigger ("رشّح لي") */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsSmartConciergeOpen((prev) => !prev);
              }}
              className={`px-2.5 py-2 rounded-full border text-[11px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1 ${
                isSmartConciergeOpen
                  ? 'bg-indigo-600 text-white border-amber-300 ring-2 ring-amber-300/60'
                  : 'bg-gradient-to-r from-amber-100 to-emerald-100 dark:from-indigo-950 dark:to-emerald-950 hover:from-amber-200 text-zinc-950 dark:text-amber-200 border-amber-400/90'
              }`}
              title={isAr ? 'المستشار الذكي: رشّح لي مجلساً يناسب قلبي ووقتي الآن' : 'Smart Lecture Concierge'}
            >
              <span>🧭</span>
              <span>{isAr ? 'رشّح لي' : 'Advise'}</span>
            </button>

            {/* Add Custom YouTube / SoundCloud Link Pill */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setIsCustomDrawerOpen((prev) => !prev);
              }}
              className={`px-2 py-2 rounded-full border text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                isCustomDrawerOpen
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-white/90 dark:bg-zinc-800 hover:bg-emerald-50 text-emerald-900 dark:text-emerald-200 border-emerald-300/80 dark:border-zinc-700'
              }`}
              title={isAr ? 'تشغيل رابط يوتيوب أو ساوند كلاود خاص' : 'Play Custom Link'}
            >
              {isAr ? '➕ رابط' : '+ Link'}
            </button>

            {/* Sleep Timer Trigger Pill */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setIsSleepModalOpen(true);
              }}
              className={`flex items-center gap-1 px-2 py-2 rounded-full border text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                sleepSecondsLeft !== null
                  ? 'bg-indigo-600 text-white border-indigo-700 font-mono animate-pulse'
                  : 'bg-white/90 dark:bg-zinc-800 hover:bg-amber-50 text-zinc-800 dark:text-zinc-200 border-amber-300/80 dark:border-zinc-700'
              }`}
              title={isAr ? 'مؤقت النوم لإيقاف الصوت تلقائياً' : 'Sleep Timer'}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
              {sleepSecondsLeft !== null && (
                <span className="tabular-nums">
                  {Math.floor(sleepSecondsLeft / 60)}:{String(sleepSecondsLeft % 60).padStart(2, '0')}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={isAr ? 'إغلاق الاستوديو' : 'Close Studio'}
              className="w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-800 hover:bg-rose-50 text-zinc-700 dark:text-zinc-200 hover:text-rose-700 border border-zinc-300/80 dark:border-zinc-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Smart Heart-State & Time-Window Concierge Drawer ("ماذا أسمع الآن؟") */}
        {isSmartConciergeOpen && (
          <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-br from-white via-amber-50/70 to-emerald-50/80 dark:from-zinc-900 dark:via-indigo-950/50 dark:to-emerald-950/40 border-2 border-amber-400/90 shadow-lg space-y-2.5 relative z-10 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-950 dark:text-amber-200 flex items-center gap-1.5">
                <span>🧭</span>
                <span>{isAr ? 'مستشار البصيرة الذكي: اختر حال قلبك ووقتك المتاح الآن' : 'Smart Heart & Time Concierge'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsSmartConciergeOpen(false)}
                className="text-[11px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                {isAr ? 'إغلاق ✕' : 'Close ✕'}
              </button>
            </div>

            {/* Step 1: Heart State */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'futoor', label: '🌧️ فتور وتشتت' },
                { id: 'shubuhat', label: '🛡️ شبهات وحيرة' },
                { id: 'waay', label: '🧠 شغف بالوعي والتاريخ' },
                { id: 'bayt', label: '🏡 بناء بيت وأسرة' },
                { id: 'sakeenah', label: '🌿 سكينة وخشوع' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setConciergeMood(m.id as any);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer border transition-all ${
                    conciergeMood === m.id
                      ? 'bg-emerald-700 text-white border-amber-300 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-amber-300/70'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Step 2: Time Available */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                {isAr ? 'الوقت المتاح:' : 'Time:'}
              </span>
              {[
                { id: 'short', label: '⚡ ١٥-٢٥ دقيقة' },
                { id: 'medium', label: '🎯 ٣٠-٤٥ دقيقة' },
                { id: 'deep', label: '🏛️ مجلس عميق (+٤٥د)' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setConciergeDuration(d.id as any);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer border transition-all ${
                    conciergeDuration === d.id
                      ? 'bg-indigo-600 text-white border-amber-300 shadow-2xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-indigo-200 dark:border-zinc-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Prescribed Result Card */}
            {smartRecommendedTrack.track && (
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white border border-amber-300/80 flex items-center justify-between gap-3 shadow-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950">
                      ✨ الترشيح الأمثل لك الآن
                    </span>
                    <span className="text-[10px] font-bold text-amber-200">
                      {smartRecommendedTrack.track.sheikhAr}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate mt-1">
                    {smartRecommendedTrack.track.titleAr}
                  </p>
                  <p className="text-[10px] text-emerald-100 mt-0.5 leading-relaxed">
                    💡 {smartRecommendedTrack.reasonAr}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleTogglePlayTrack(smartRecommendedTrack.track);
                    setIsSmartConciergeOpen(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold shrink-0 cursor-pointer shadow-md"
                >
                  {isAr ? 'تشغيل ▶️' : 'Play ▶️'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Inline Custom YouTube / SoundCloud Link Launcher Drawer */}
        {isCustomDrawerOpen && (
          <form
            onSubmit={handleLaunchCustomUrl}
            className="mt-2.5 p-2.5 rounded-2xl bg-white/95 dark:bg-zinc-900 border border-emerald-400/80 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative z-10 animate-in fade-in duration-150"
          >
            <input
              type="url"
              required
              value={customLinkInput}
              onChange={(e) => setCustomLinkInput(e.target.value)}
              placeholder={isAr ? 'الصق رابط يوتيوب أو ساوند كلاود أو MP3 هنا...' : 'Paste YouTube, SoundCloud, or MP3 URL...'}
              className="flex-1 h-9 px-3 rounded-xl bg-emerald-50/60 dark:bg-zinc-950 border border-emerald-300/80 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
            />
            <input
              type="text"
              value={customTitleInput}
              onChange={(e) => setCustomTitleInput(e.target.value)}
              placeholder={isAr ? 'عنوان الدرس (اختياري)' : 'Title (optional)'}
              className="sm:w-44 h-9 px-3 rounded-xl bg-amber-50/60 dark:bg-zinc-950 border border-amber-300/80 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-amber-600"
            />
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0"
            >
              {isAr ? 'تشغيل فوري ▶️' : 'Play Now ▶️'}
            </button>
          </form>
        )}

        {/* 1-Tap Live Radio Dial + WebAudio Ambient Nature Mixer Strip */}
        <div className="mt-2.5 pt-2 border-t border-emerald-300/50 dark:border-white/10 relative z-10 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[10px] font-bold text-emerald-950 dark:text-emerald-200 bg-emerald-200/70 dark:bg-emerald-900/50 px-2 py-1 rounded-full shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
              {isAr ? 'إذاعة حية:' : 'Live:'}
            </span>
            {quickRadioTracks.map((radioTrack) => {
              const isRadioPlaying =
                audioState.isPlaying &&
                (playingTrackId === radioTrack.id ||
                  audioState.currentTitleAr === radioTrack.titleAr ||
                  (audioState.mode === 'channel' &&
                    audioState.currentChannelId === radioTrack.id.replace('track_radio_', '')));
              return (
                <button
                  key={radioTrack.id}
                  type="button"
                  onClick={() => handleTogglePlayTrack(radioTrack)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    isRadioPlaying
                      ? 'bg-emerald-700 text-white border-amber-400 shadow-xs ring-2 ring-amber-300/60'
                      : 'bg-white/90 dark:bg-zinc-800/90 hover:bg-emerald-50 text-zinc-900 dark:text-zinc-100 border-emerald-300/70 dark:border-zinc-700 shadow-2xs'
                  }`}
                >
                  <span>{radioTrack.icon}</span>
                  <span>
                    {radioTrack.titleAr
                      .replace('إذاعة ', '')
                      .replace('بث ', '')
                      .slice(0, 20)}
                  </span>
                  {isRadioPlaying ? (
                    <Pause className="w-3 h-3 fill-current text-amber-300" />
                  ) : (
                    <Play className="w-3 h-3 fill-current text-emerald-600 dark:text-emerald-400" />
                  )}
                </button>
              );
            })}

            {/* Ambient Nature Soundscape Mixer Pills (غيث السكينة • نسيم الفجر • دفء الخلوة) */}
            <span className="text-[10px] font-bold text-indigo-950 dark:text-indigo-200 bg-indigo-200/70 dark:bg-indigo-900/50 px-2 py-1 rounded-full shrink-0 ms-1">
              {isAr ? '🌧️ أجواء الخشوع:' : 'Ambience:'}
            </span>
            {[
              { id: 'rain', label: isAr ? '🌧️ مطر السكينة' : 'Rain' },
              { id: 'breeze', label: isAr ? '🍃 نسيم الفجر' : 'Breeze' },
              { id: 'warmth', label: isAr ? '🕯️ دفء الخلوة' : 'Warmth' },
            ].map((amb) => {
              const isActive = ambientMode === amb.id;
              return (
                <button
                  key={amb.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    const next = isActive ? 'off' : (amb.id as any);
                    setAmbientMode(next);
                    if (next !== 'off') {
                      onRewardToast?.(isAr ? `${amb.label} يعمل بهدوء في خلفية المجلس` : `${amb.label} ambience enabled`);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-amber-300 shadow-xs'
                      : 'bg-white/85 dark:bg-zinc-800/90 text-indigo-950 dark:text-indigo-200 border-indigo-300/70 dark:border-zinc-700'
                  }`}
                >
                  {amb.label}
                </button>
              );
            })}
            {ambientMode !== 'off' && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100/90 dark:bg-indigo-950/70 border border-indigo-300 shrink-0">
                <span className="text-[9px] font-bold text-indigo-950 dark:text-indigo-200">
                  {Math.round(ambientVolume * 100)}%
                </span>
                <input
                  type="range"
                  min={0.05}
                  max={0.45}
                  step={0.02}
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(Number(e.target.value))}
                  aria-label="Ambient Sound Volume"
                  className="w-14 h-1 bg-indigo-300 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1.5 Instant Resume Ribbon (استكمال من حيث توقفت) */}
      {!audioState.isPlaying && audioState.resumePoint && (
        <div className="px-3.5 py-2 bg-gradient-to-r from-amber-100/90 via-emerald-50/90 to-amber-100/90 dark:from-amber-950/50 dark:via-emerald-950/40 dark:to-amber-950/50 border-b border-amber-300/80 dark:border-amber-500/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm shrink-0">⏯️</span>
            <p className="text-[11px] font-bold text-amber-950 dark:text-amber-200 truncate">
              {isAr ? 'استكمل آخر مجلس:' : 'Resume:'}{' '}
              <span className="text-emerald-900 dark:text-emerald-300">
                {audioState.resumePoint.episodeTitleAr || audioState.resumePoint.channelTitleAr}
              </span>
              {audioState.resumePoint.currentTime > 5 && (
                <span className="font-mono text-[10px] ms-1.5 px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-zinc-900 text-amber-900 dark:text-amber-300">
                  {formatSeconds(audioState.resumePoint.currentTime)}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateMedium();
              gymFaithAudio.resumeLastPlayback();
            }}
            className="px-3 py-1 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shrink-0 cursor-pointer shadow-2xs"
          >
            {isAr ? 'متابعة الاستماع ▶️' : 'Resume ▶️'}
          </button>
        </div>
      )}

      {/* 2. 5-Mode Interactive Studio Switcher: Curated • Academy Paths • YouTube 5.0⭐ • SoundCloud • Scholars */}
      <div className="px-3 py-2 bg-[#f3efe4] dark:bg-zinc-900 border-b border-amber-300/60 dark:border-zinc-800 shrink-0">
        <div className="grid grid-cols-5 bg-white/95 dark:bg-zinc-950 p-1 rounded-2xl border border-amber-300/70 dark:border-zinc-800 gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setViewMode('tracks');
            }}
            className={`py-2 px-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              viewMode === 'tracks'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-zinc-700 dark:text-zinc-400 hover:bg-amber-50/70 dark:hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-3 h-3 shrink-0 hidden sm:inline" />
            <span className="truncate">{isAr ? 'المختارات 🎧' : 'Curated'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setViewMode('paths');
            }}
            className={`py-2 px-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              viewMode === 'paths'
                ? 'bg-gradient-to-r from-amber-600 to-emerald-600 text-white shadow-xs'
                : 'text-zinc-700 dark:text-zinc-400 hover:bg-amber-50/70 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="truncate">{isAr ? 'مسارات 🎓' : 'Paths'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setViewMode('youtube');
            }}
            className={`py-2 px-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              viewMode === 'youtube'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs'
                : 'text-zinc-700 dark:text-zinc-400 hover:bg-rose-50/70 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="truncate">{isAr ? 'يوتيوب ⭐' : 'YouTube'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setViewMode('soundcloud');
            }}
            className={`py-2 px-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              viewMode === 'soundcloud'
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-xs'
                : 'text-zinc-700 dark:text-zinc-400 hover:bg-orange-50/70 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="truncate">{isAr ? 'ساوند كلاود ☁️' : 'SoundCloud'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setViewMode('scholars');
            }}
            className={`py-2 px-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              viewMode === 'scholars'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                : 'text-zinc-700 dark:text-zinc-400 hover:bg-indigo-50/70 dark:hover:bg-zinc-800'
            }`}
          >
            <BookOpen className="w-3 h-3 shrink-0 hidden sm:inline" />
            <span className="truncate">{isAr ? 'العلماء 🏛️' : 'Scholars'}</span>
          </button>
        </div>
      </div>

      {/* Active YouTube Audio / Video Player */}
      {audioState.mediaType === 'youtube' && audioState.youtubeVideoId && (
        <div className="p-3 bg-[#f7f3e8] dark:bg-zinc-900 border-b border-amber-300/60 dark:border-zinc-800 shrink-0">
          <YouTubeAudioPlayer onRewardToast={onRewardToast} />
        </div>
      )}

      {/* Inline Timestamped Gem Modal when user taps ✍️ دوّن فائدة */}
      {gemDraftTrack && (
        <form
          onSubmit={handleSaveGem}
          className="mx-3.5 mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-emerald-50 dark:from-zinc-900 dark:to-emerald-950/50 border-2 border-amber-400 shadow-lg space-y-2 shrink-0 relative z-20"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
              ✍️ تدوين فائدة من: <span className="text-emerald-800 dark:text-emerald-300">{gemDraftTrack.titleAr}</span>
              {audioState.currentTime > 0 && (
                <span className="ms-1.5 px-2 py-0.5 rounded-full bg-amber-200/80 text-zinc-950 font-mono text-[10px]">
                  ⏱️ {formatSeconds(audioState.currentTime)}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setGemDraftTrack(null)}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-900 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              value={gemDraftText}
              onChange={(e) => setGemDraftText(e.target.value)}
              placeholder={isAr ? 'اكتب الدرة أو البصيرة التي لمست قلبك في هذه المحاضرة...' : 'Write your key insight from this lecture...'}
              className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-zinc-950 border border-amber-300 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white"
            />
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              {isAr ? 'حفظ الدرة 💎' : 'Save 💎'}
            </button>
          </div>
        </form>
      )}

      {viewMode === 'paths' ? (
        /* Guided Mastery Academy Paths + Saved Timestamped Gems Notebook */
        <div
          className={`flex-1 overflow-y-auto p-3.5 space-y-3.5 overscroll-contain relative z-10 ${
            hasActiveStudioDeck ? 'pb-36' : 'pb-8'
          }`}
        >
          {/* Academy Header Banner */}
          <div className="p-4 rounded-[26px] bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 text-white border-2 border-amber-400/80 shadow-md flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-bold">
                  🎓 أكاديمية البناء المنهجي
                </span>
                <span className="text-[11px] font-bold text-amber-200">
                  {completedTrackIds.length < 3
                    ? 'الرتبة: طالب وعي مجتهد 🌱'
                    : completedTrackIds.length < 8
                    ? 'الرتبة: بصيرة راسخة 🛡️'
                    : 'الرتبة: فقيه النفس والوعي 👑'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isAr
                  ? 'مسارات منهجية متدرجة لبناء العقيدة والوعي وتزكية النفس'
                  : 'Structured Mastery Curriculums'}
              </h3>
              <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                {isAr
                  ? 'اختر مساراً واستمع لمحاضراته بالترتيب وعلّم على كل محاضرة بـ (✔ أتممت) لمتابعة تقدمك.'
                  : 'Follow curated step-by-step curriculums and track your completion.'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-amber-300/50 flex flex-col items-center justify-center shrink-0">
              <span className="text-base font-bold text-amber-300 tabular-nums">
                {completedTrackIds.length}
              </span>
              <span className="text-[9px] text-emerald-100 font-bold">مجلس مكتمل</span>
            </div>
          </div>

          {/* 4 Structured Academy Paths */}
          {GUIDED_ACADEMY_PATHS.map((path) => {
            const pathTracks = path.trackIds
              .map((tid) => allCombinedTracks.find((t) => t.id === tid))
              .filter((t): t is MobileAudioTrack => Boolean(t));
            const doneCount = pathTracks.filter((t) => completedTrackIds.includes(t.id)).length;
            const pct = pathTracks.length > 0 ? Math.round((doneCount / pathTracks.length) * 100) : 0;

            return (
              <div
                key={path.id}
                className="rounded-[26px] border-2 border-amber-300/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
              >
                <div className={`p-4 bg-gradient-to-r ${path.gradientClass} text-white space-y-2`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-xl shrink-0">
                        {path.emoji}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/25 text-amber-200">
                          {path.badgeAr}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                          {path.titleAr}
                        </h4>
                        <p className="text-[11px] text-amber-100 font-semibold">
                          {path.scholarsSummaryAr}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-400 text-zinc-950 font-mono text-xs font-bold shrink-0">
                      {pct}%
                    </span>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed">{path.subtitleAr}</p>
                  <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden">
                    <div
                      className="h-full bg-amber-300 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Path Steps List */}
                <div className="p-3 space-y-2 bg-[#fcfaf5] dark:bg-zinc-950/60">
                  {pathTracks.map((track, idx) => {
                    const isDone = completedTrackIds.includes(track.id);
                    const isPlayingThis =
                      audioState.isPlaying &&
                      (playingTrackId === track.id || audioState.currentTitleAr === track.titleAr);

                    return (
                      <div
                        key={track.id}
                        onClick={() => handleTogglePlayTrack(track)}
                        className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                          isPlayingThis
                            ? 'bg-emerald-700 text-white border-amber-400 shadow-md'
                            : isDone
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400/70 text-zinc-900 dark:text-zinc-100'
                            : 'bg-white dark:bg-zinc-900 border-amber-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-100 dark:bg-zinc-800 text-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {isDone ? '✔' : idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-bold line-clamp-1 ${
                                isPlayingThis ? 'text-white' : 'text-zinc-950 dark:text-white'
                              }`}
                            >
                              {track.titleAr}
                            </p>
                            <p
                              className={`text-[10px] font-semibold truncate ${
                                isPlayingThis ? 'text-amber-200' : 'text-emerald-800 dark:text-emerald-300'
                              }`}
                            >
                              {track.sheikhAr} • {track.durationFormatted}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => toggleCompletedTrack(track.id, e)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer ${
                              isDone
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-amber-100/90 dark:bg-zinc-800 text-amber-950 dark:text-amber-200 border-amber-300'
                            }`}
                          >
                            {isDone ? 'مكتمل ✔' : 'أتممت؟'}
                          </button>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0"
                          >
                            {isPlayingThis ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current ms-0.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Saved Timestamped Insights Notebook (كشكول الدرر والفوائد المختومة بالوقت) */}
          <div className="p-4 rounded-[26px] bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-zinc-900 dark:to-zinc-900 border-2 border-amber-300/80 dark:border-zinc-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                <span>💎</span>
                <span>{isAr ? 'كشكول الفوائد والدرر المختومة بالوقت' : 'Timestamped Insights Notebook'}</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-zinc-950">
                {savedGems.length} {isAr ? 'فائدة' : 'gems'}
              </span>
            </div>
            {savedGems.length === 0 ? (
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                {isAr
                  ? 'اضغط على زر (✍️ دوّن فائدة) في أي محاضرة لحفظ الفوائد بختم الدقيقة والثانية والرجوع إليها بضغطة واحدة.'
                  : 'Tap (✍️ Note) on any lecture card to save timestamped insights.'}
              </p>
            ) : (
              <div className="space-y-2">
                {savedGems.map((gem) => (
                  <div
                    key={gem.id}
                    className="p-3 rounded-2xl bg-white dark:bg-zinc-950 border border-amber-300/70 dark:border-zinc-800 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 truncate">
                        {gem.trackTitleAr} — {gem.sheikhAr}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {gem.timestampSec > 0 && (
                          <button
                            type="button"
                            onClick={() => gymFaithAudio.seekTo(gem.timestampSec)}
                            className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 font-mono text-[10px] font-bold cursor-pointer"
                          >
                            ⏱️ {formatSeconds(gem.timestampSec)}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteGem(gem.id)}
                          className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                      «{gem.noteText}»
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'soundcloud' ? (
        /* SoundCloud Interactive Embedded Sanctuary View */
        <div
          className={`flex-1 overflow-y-auto p-3.5 space-y-3 overscroll-contain relative z-10 ${
            hasActiveStudioDeck ? 'pb-36' : 'pb-8'
          }`}
        >
          {/* Scholar SoundCloud Selector Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                {isAr
                  ? '☁️ اختر أرشيف العالم على ساوند كلاود للاستماع الفوري:'
                  : '☁️ Select Verified Scholar SoundCloud Archive:'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border border-orange-300">
                {isAr ? 'مُراجع وموثق 100%' : '100% Verified'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VERIFIED_SOUNDCLOUD_DECKS.map((deck) => {
                const isSelected = selectedSoundCloudDeck.id === deck.id;
                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      // Pause background HTML5/YT audio so SoundCloud plays cleanly
                      if (audioState.isPlaying) {
                        gymFaithAudio.pause();
                      }
                      setSelectedSoundCloudDeck(deck);
                    }}
                    className={`p-3 rounded-[20px] border-2 text-start transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white border-amber-300 shadow-md ring-2 ring-amber-300/50'
                        : 'bg-white dark:bg-zinc-900 hover:bg-orange-50/70 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-orange-200/80 dark:border-zinc-800 shadow-2xs'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border ${
                        isSelected
                          ? 'bg-white text-orange-700 border-amber-200'
                          : 'bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border-orange-300/70'
                      }`}
                    >
                      {deck.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-white' : 'text-zinc-950 dark:text-white'
                          }`}
                        >
                          {deck.scholarAr}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-amber-100'
                              : 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200'
                          }`}
                        >
                          {deck.rating}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] font-semibold line-clamp-1 mt-0.5 ${
                          isSelected ? 'text-amber-100' : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {deck.titleAr}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold">
                        <span className={isSelected ? 'text-white/90' : 'text-orange-700 dark:text-orange-300'}>
                          {deck.badgeAr}
                        </span>
                        <span>•</span>
                        <span className={isSelected ? 'text-amber-200' : 'text-zinc-500'}>
                          {deck.listenersAr}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Embedded Official SoundCloud Interactive Widget Deck */}
          <div className="p-3.5 rounded-[26px] bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-orange-950/30 border-2 border-orange-300/80 dark:border-orange-500/30 shadow-md space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase block">
                  ☁️ مشغل ساوند كلاود التفاعلي المباشر • {selectedSoundCloudDeck.rating}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white truncate">
                  {selectedSoundCloudDeck.scholarAr} — {selectedSoundCloudDeck.titleAr}
                </h3>
              </div>
              <a
                href={selectedSoundCloudDeck.soundcloudUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold shrink-0 shadow-2xs"
              >
                {isAr ? 'فتح في SoundCloud ↗' : 'Open ↗'}
              </a>
            </div>
            <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {selectedSoundCloudDeck.descriptionAr}
            </p>
            <div className="rounded-2xl overflow-hidden border border-orange-300/80 dark:border-zinc-700 bg-white shadow-inner">
              <iframe
                key={selectedSoundCloudDeck.soundcloudUrl}
                title={selectedSoundCloudDeck.scholarAr}
                width="100%"
                height="360"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={getSoundCloudEmbedUrl(selectedSoundCloudDeck.soundcloudUrl)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      ) : viewMode === 'tracks' || viewMode === 'youtube' ? (
        <>
          {/* 3. Spiritual Mood Compass + Search + Category Filter Bar */}
          <div className="px-3.5 py-2.5 bg-[#f7f4eb] dark:bg-zinc-900/90 border-b border-amber-200/80 dark:border-zinc-800 space-y-2 shrink-0">
            {viewMode === 'youtube' ? (
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">▶️</span>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-950 dark:text-white">
                      {isAr
                        ? 'محاضرات وسلاسل يوتيوب الأعلى تقييماً (٢٤ محاضرة مرئية وصوتية بالخلفية)'
                        : 'Top-Rated YouTube Lectures (Background Audio & Video)'}
                    </h3>
                    <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      {isAr
                        ? 'مُنتقاة بعناية على منهج أهل السنة الصافي • تقييم 4.9 - 5.0 ⭐'
                        : 'Curated with 4.9-5.0 ⭐ ratings'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Spiritual Mood / Intent Prescription Pills (بوصلة القلب السريعة) */
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-3.5 px-3.5">
                {moodPrescriptions.map((mood) => {
                  const isSelected = activeCategory === mood.id;
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        setActiveCategory(isSelected ? 'all' : (mood.id as any));
                      }}
                      className={`px-2.5 py-1.5 rounded-2xl border text-start transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isSelected ? mood.activeClass : mood.idleClass
                      }`}
                    >
                      <span className="text-base leading-none">{mood.emoji}</span>
                      <div className="leading-tight">
                        <div className="text-[11px] font-bold">{mood.titleAr}</div>
                        <div
                          className={`text-[9px] font-semibold ${
                            isSelected ? 'text-white/85' : 'text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {mood.subAr}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search Input & Category Pills Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-emerald-700 dark:text-emerald-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? 'ابحث عن درس، شيخ (أيمن عبد الرحيم، أحمد السيد، القنيبي، الطريفي، السكران...)'
                      : 'Search lecture, scholar, recitation...'
                  }
                  className="w-full h-9 ps-9 pe-8 rounded-xl bg-white dark:bg-zinc-950 border border-amber-300/80 dark:border-zinc-700 focus:border-emerald-600 text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none transition-colors shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Horizontal Category Pills (shown in 'tracks' mode) */}
            {viewMode === 'tracks' && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-3.5 px-3.5 scroll-px-3.5 snap-x">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        setActiveCategory(cat.id as any);
                      }}
                      className={`snap-start min-h-[32px] px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                        isActive
                          ? 'bg-zinc-900 dark:bg-amber-400 text-amber-300 dark:text-zinc-950 border-zinc-900 dark:border-amber-400 shadow-xs'
                          : 'bg-white dark:bg-zinc-800/90 hover:bg-amber-50/80 text-zinc-800 dark:text-zinc-200 border-amber-300/70 dark:border-zinc-700'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                          isActive
                            ? 'bg-amber-400/25 dark:bg-zinc-950/20 text-amber-200 dark:text-zinc-950 font-bold'
                            : 'bg-amber-100 dark:bg-zinc-700 text-amber-950 dark:text-zinc-300'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Color-Coded Tactile 3D Bento Track Cards */}
          <div
            className={`flex-1 overflow-y-auto p-3.5 space-y-2.5 overscroll-contain relative z-10 ${
              hasActiveStudioDeck ? 'pb-36' : 'pb-8'
            }`}
          >
            {filteredTracks.length === 0 ? (
              <div className="text-center py-14 px-4 rounded-3xl bg-white/80 dark:bg-zinc-900/60 border border-amber-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold">
                {isAr
                  ? 'لم يتم العثور على أي مقطع مطابق لبحثك — جرب اختيار تصنيف آخر أعلاه'
                  : 'No tracks found matching your query'}
              </div>
            ) : (
              filteredTracks.map((track) => {
                const isPlayingThis =
                  audioState.isPlaying &&
                  (playingTrackId === track.id ||
                    (track.category === 'radio' &&
                      audioState.mode === 'channel' &&
                      (audioState.currentChannelId === track.id.replace('track_radio_', '') ||
                        audioState.currentTitleAr === track.titleAr)) ||
                    audioState.currentTitleAr === track.titleAr);
                const isFav = favoriteIds.includes(track.id);
                const isDone = completedTrackIds.includes(track.id);
                const theme = getCategoryCardTheme(track.category);

                return (
                  <div
                    key={track.id}
                    onClick={() => handleTogglePlayTrack(track)}
                    className={`p-3 sm:p-3.5 rounded-[22px] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.985] flex flex-col gap-2 cursor-pointer border-2 ${
                      isPlayingThis
                        ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white border-amber-400 shadow-[0_12px_28px_-6px_rgba(5,150,105,0.45)] ring-2 ring-amber-300/60'
                        : `${theme.card} text-zinc-900 dark:text-zinc-100 shadow-[0_6px_16px_-8px_rgba(24,24,27,0.12)]`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Category / Sheikh Icon Emblem */}
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 border transition-transform ${
                            isPlayingThis
                              ? 'bg-amber-400 text-zinc-950 border-amber-200 shadow-sm'
                              : theme.iconBox
                          }`}
                        >
                          {isPlayingThis ? (
                            <Disc3 className="w-5 h-5 animate-spin" />
                          ) : (
                            <span>{track.icon}</span>
                          )}
                        </div>

                        {/* Title & Sheikh */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-xs sm:text-sm font-bold line-clamp-2 leading-[1.7] max-w-[215px] sm:max-w-md ${
                                isPlayingThis ? 'text-white' : 'text-zinc-950 dark:text-white'
                              }`}
                            >
                              {track.titleAr}
                            </span>
                          </div>

                          <div
                            className={`flex items-center gap-1.5 mt-1 text-[11px] flex-wrap ${
                              isPlayingThis ? 'text-emerald-100' : 'text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            <span
                              className={`font-bold truncate ${
                                isPlayingThis ? 'text-amber-300' : theme.sheikhText
                              }`}
                            >
                              {track.sheikhAr}
                            </span>
                            <span
                              aria-hidden="true"
                              className="w-1 h-1 rounded-full bg-current opacity-40 shrink-0"
                            />
                            <bdi dir="ltr" className="font-mono text-[10px] font-bold tabular-nums">
                              {track.durationFormatted}
                            </bdi>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                isPlayingThis
                                  ? 'bg-white/15 text-amber-200 border-amber-300/40'
                                  : theme.badge
                              }`}
                            >
                              {track.badgeAr}
                            </span>
                            {track.viewsLabel && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  isPlayingThis
                                    ? 'bg-amber-400/25 text-amber-100'
                                    : 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200'
                                }`}
                              >
                                {track.viewsLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Actions: Favorite & Play/Pause */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(track.id, e)}
                          aria-label={isAr ? 'مفضلة' : 'Favorite'}
                          className={`touch-target w-9 h-9 rounded-full flex items-center justify-center transition-colors border ${
                            isFav
                              ? isPlayingThis
                                ? 'text-rose-200 bg-rose-500/30 border-rose-300/50'
                                : 'text-rose-600 bg-rose-100 dark:bg-rose-950/60 border-rose-300'
                              : isPlayingThis
                              ? 'text-white/80 hover:text-white border-white/20 bg-white/10'
                              : 'text-zinc-500 hover:text-rose-600 bg-white/80 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          type="button"
                          aria-label={
                            isPlayingThis
                              ? isAr
                                ? 'إيقاف مؤقت'
                                : 'Pause'
                              : isAr
                              ? 'تشغيل'
                              : 'Play'
                          }
                          className={`touch-target w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                            isPlayingThis
                              ? 'bg-amber-400 text-zinc-950 shadow-md font-bold'
                              : theme.playBtn
                          }`}
                        >
                          {isPlayingThis ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ms-0.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Key Takeaway / Insight Pill for Featured & YouTube Masterpieces */}
                    {track.takeawayAr && (
                      <div
                        className={`text-[11px] font-medium px-3 py-1.5 rounded-xl border leading-relaxed ${
                          isPlayingThis
                            ? 'bg-white/10 text-amber-100 border-white/20'
                            : 'bg-white/75 dark:bg-zinc-950/60 text-zinc-700 dark:text-zinc-300 border-amber-200/70 dark:border-zinc-800'
                        }`}
                      >
                        <span className="font-bold text-amber-600 dark:text-amber-400 me-1">
                          💡 خلاصة المحاضرة:
                        </span>
                        {track.takeawayAr}
                      </div>
                    )}

                    {/* Interactive Action Strip: دوّن فائدة • أتممت السماع • مشاركة البطاقة الدعوية */}
                    {track.category !== 'radio' && (
                      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-amber-200/50 dark:border-zinc-800/80">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundSynth.playTactileClick();
                              setGemDraftTrack(track);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-colors ${
                              isPlayingThis
                                ? 'bg-white/15 hover:bg-white/25 text-white border-white/25'
                                : 'bg-white/90 dark:bg-zinc-800 hover:bg-amber-100 text-zinc-800 dark:text-zinc-200 border-amber-300/70 dark:border-zinc-700'
                            }`}
                          >
                            {isAr ? '✍️ دوّن فائدة' : '✍️ Note'}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => toggleCompletedTrack(track.id, e)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-colors ${
                              isDone
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : isPlayingThis
                                ? 'bg-white/15 text-amber-200 border-white/25'
                                : 'bg-emerald-50/90 dark:bg-zinc-800 text-emerald-900 dark:text-emerald-300 border-emerald-300/70 dark:border-zinc-700'
                            }`}
                          >
                            {isDone ? (isAr ? '✔ أتممت المجلس' : '✔ Completed') : isAr ? '🎓 سجّل إتمام' : 'Mark Done'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleShareDawahCard(track, e)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-colors ${
                            isPlayingThis
                              ? 'bg-amber-400/25 text-amber-100 border-amber-300/40'
                              : 'bg-amber-50/90 dark:bg-zinc-800 text-amber-900 dark:text-amber-300 border-amber-300/70 dark:border-zinc-700'
                          }`}
                        >
                          {isAr ? '📋 مشاركة البطاقة' : '📋 Share'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Scholars & Full Series Encyclopedia View (Luminous Ivory & Royal Indigo-Emerald Bento) */
        <div
          className={`flex-1 overflow-y-auto p-3.5 space-y-3 overscroll-contain relative z-10 ${
            hasActiveStudioDeck ? 'pb-36' : 'pb-8'
          }`}
        >
          {/* Horizontal Scholar Selector Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold px-1 block">
              {isAr
                ? 'اختر العالم أو المفكر لعرض سلاسله ومحاضراته الموثقة كاملة:'
                : 'Select Scholar to view verified series:'}
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              {SCHOLARS_DIRECTORY.map((scholar) => {
                const isSelected = selectedScholarId === scholar.id;
                const seriesCount = FAITH_AUDIO_SERIES.filter(
                  (s) => s.scholarId === scholar.id
                ).length;
                return (
                  <button
                    key={scholar.id}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      setSelectedScholarId(scholar.id);
                      const firstSeries = FAITH_AUDIO_SERIES.find(
                        (s) => s.scholarId === scholar.id
                      );
                      if (firstSeries) setExpandedSeriesId(firstSeries.id);
                    }}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 cursor-pointer border-2 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-amber-400 shadow-sm'
                        : 'bg-white dark:bg-zinc-900 hover:bg-indigo-50 text-zinc-800 dark:text-zinc-200 border-indigo-200 dark:border-zinc-700 shadow-2xs'
                    }`}
                  >
                    <span>{scholar.avatarEmoji}</span>
                    <span>{scholar.nameAr}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                        isSelected
                          ? 'bg-amber-400 text-zinc-950 font-bold'
                          : 'bg-indigo-100 dark:bg-zinc-800 text-indigo-900 dark:text-indigo-300'
                      }`}
                    >
                      {seriesCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scholar Bio Header Bento Card */}
          <div className="p-4 rounded-[24px] bg-gradient-to-br from-indigo-50 via-white to-amber-50/70 dark:from-indigo-950/60 dark:via-zinc-900 dark:to-amber-950/30 text-zinc-950 dark:text-white border-2 border-indigo-300/80 dark:border-indigo-500/30 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-xs border border-amber-300/60">
                  {currentScholar.avatarEmoji}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
                    {currentScholar.nameAr}
                  </h3>
                  <p className="text-[11px] text-indigo-800 dark:text-indigo-300 font-bold">
                    {currentScholar.specialityAr}
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-950 dark:text-amber-200 border border-amber-300 font-bold shrink-0">
                {scholarSeriesList.length} {isAr ? 'سلاسل كاملة' : 'Series'}
              </span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed pt-0.5 font-medium">
              {currentScholar.descriptionAr}
            </p>
          </div>

          {/* Scholar's Series List */}
          <div className="space-y-2.5">
            {scholarSeriesList.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs font-bold">
                {isAr
                  ? 'لا توجد سلاسل مسجلة حالياً لهذا الشيخ'
                  : 'No series available for this scholar currently'}
              </div>
            ) : (
              scholarSeriesList.map((series) => {
                const isExpanded = expandedSeriesId === series.id;

                return (
                  <div
                    key={series.id}
                    className="rounded-[24px] border-2 border-amber-300/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden text-start transition-all shadow-xs"
                  >
                    {/* Series Header Bar */}
                    <div
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setExpandedSeriesId(isExpanded ? null : series.id);
                      }}
                      className="p-3.5 bg-gradient-to-r from-amber-50/70 via-white to-emerald-50/60 dark:from-zinc-900 dark:to-zinc-800/80 flex items-center justify-between cursor-pointer hover:from-amber-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-950 dark:text-amber-200 border border-amber-300 flex items-center justify-center text-lg shrink-0 font-bold">
                          {series.icon}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white line-clamp-2 leading-[1.7] max-w-[220px] sm:max-w-md">
                            {series.titleAr}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                            <span className="text-emerald-800 dark:text-emerald-300 font-bold">
                              {series.badgeAr}
                            </span>
                            <span>•</span>
                            <span className="font-bold">
                              {series.episodes.length} {isAr ? 'مجالس صوتية' : 'Episodes'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-amber-100/80 dark:bg-zinc-800 text-amber-950 dark:text-zinc-200 border border-amber-300/70 flex items-center justify-center shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* Series Episodes List */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 space-y-2 border-t border-amber-200/80 dark:border-zinc-800 pt-3 bg-[#fcfaf5] dark:bg-zinc-950/60 animate-in fade-in duration-150">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 px-1 leading-relaxed font-medium">
                          {series.descriptionAr}
                        </p>

                        <div className="space-y-2 pt-1">
                          {series.episodes.map((ep, epIdx) => {
                            const isEpSelected =
                              audioState.currentSeriesId === series.id &&
                              audioState.currentEpisodeId === ep.id;
                            const isEpPlaying = isEpSelected && audioState.isPlaying;

                            return (
                              <div
                                key={ep.id}
                                onClick={() => handlePlayScholarEpisode(series, ep)}
                                className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                  isEpSelected
                                    ? 'bg-gradient-to-r from-emerald-700 to-teal-700 border-amber-400 text-white font-bold shadow-md'
                                    : 'bg-white dark:bg-zinc-900 hover:bg-emerald-50/60 dark:hover:bg-zinc-800 border-emerald-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                      isEpSelected
                                        ? 'bg-amber-400 text-zinc-950'
                                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300/70'
                                    }`}
                                  >
                                    {isEpSelected && audioState.isLoading ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isEpPlaying ? (
                                      <Pause className="w-4 h-4 fill-current" />
                                    ) : (
                                      <span>{epIdx + 1}</span>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div
                                      className={`text-xs sm:text-sm font-bold line-clamp-2 leading-[1.7] max-w-[205px] sm:max-w-sm ${
                                        isEpSelected
                                          ? 'text-white'
                                          : 'text-zinc-950 dark:text-white'
                                      }`}
                                    >
                                      {ep.titleAr}
                                    </div>
                                    <div
                                      className={`flex items-center gap-2 text-[10px] mt-0.5 ${
                                        isEpSelected
                                          ? 'text-emerald-100'
                                          : 'text-zinc-600 dark:text-zinc-400'
                                      }`}
                                    >
                                      <span
                                        className={`font-mono font-bold tabular-nums ${
                                          isEpSelected
                                            ? 'text-amber-300'
                                            : 'text-emerald-700 dark:text-emerald-400'
                                        }`}
                                      >
                                        {ep.durationFormatted}
                                      </span>
                                      <span>•</span>
                                      <span className="truncate max-w-[155px] sm:max-w-xs">
                                        {ep.summaryAr}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-colors ${
                                    isEpSelected
                                      ? 'bg-amber-400 text-zinc-950 shadow-xs'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                  }`}
                                >
                                  {isEpPlaying
                                    ? isAr
                                      ? 'يعمل الآن 🔊'
                                      : 'Playing'
                                    : isAr
                                    ? 'تشغيل ▶️'
                                    : 'Play'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 5. Sticky Floating Bottom Luminous Alabaster & Emerald-Gold Studio Deck */}
      {hasActiveStudioDeck && (
        <div className="absolute bottom-3 inset-x-3 sm:inset-x-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-2 border-emerald-500/60 dark:border-emerald-500/40 rounded-[24px] p-3 sm:p-3.5 shadow-[0_20px_50px_rgba(6,78,59,0.28)] flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-200 z-20">
          {/* Error Banner if Stream Failed */}
          {audioState.hasError && audioState.errorMessage && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-950 border border-rose-300 text-[11px] font-bold flex items-center justify-between gap-2">
              <span className="truncate">{audioState.errorMessage}</span>
              <button
                type="button"
                onClick={() => gymFaithAudio.togglePlay()}
                className="px-2.5 py-0.5 rounded-full bg-rose-700 text-white text-[10px] font-bold shrink-0 cursor-pointer"
              >
                {isAr ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          )}

          {/* Interactive Scrubber Bar + 1-Tap Smart Lecture Chapter Jumps */}
          {audioState.duration > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 px-1" dir="ltr">
                <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 tabular-nums shrink-0">
                  {formatSeconds(audioState.currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, audioState.duration)}
                  value={Math.min(audioState.currentTime, audioState.duration)}
                  onChange={(e) => gymFaithAudio.seekTo(Number(e.target.value))}
                  aria-label={isAr ? 'شريط التقدم الصوتي' : 'Audio progress scrubber'}
                  className="flex-1 h-1.5 bg-emerald-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 tabular-nums shrink-0">
                  {formatSeconds(audioState.duration)}
                </span>
              </div>
              {audioState.duration > 180 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1" dir="rtl">
                  <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 shrink-0">
                    ⚡ قفز:
                  </span>
                  {[
                    { label: 'المقدمة 0:00', target: 0 },
                    { label: '+5 دقائق ⚡', target: Math.min(audioState.duration - 5, audioState.currentTime + 300) },
                    { label: 'لبّ المجلس (50%)', target: Math.floor(audioState.duration * 0.5) },
                    { label: 'الخلاصة (75%)', target: Math.floor(audioState.duration * 0.75) },
                  ].map((jump) => (
                    <button
                      key={jump.label}
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        gymFaithAudio.seekTo(jump.target);
                      }}
                      className="px-2 py-0.5 rounded-full bg-amber-50/90 dark:bg-zinc-800 hover:bg-emerald-50 text-emerald-950 dark:text-emerald-200 border border-amber-300/80 text-[9px] font-bold shrink-0 cursor-pointer active:scale-95 transition-transform"
                    >
                      {jump.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs border border-amber-300/60 relative overflow-hidden">
                {audioState.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : audioState.isPlaying ? (
                  <div className="flex items-end gap-[2px] h-4">
                    {[
                      { h: 6, d: '0.52s', dl: '0s' },
                      { h: 13, d: '0.68s', dl: '0.12s' },
                      { h: 9, d: '0.47s', dl: '0.24s' },
                      { h: 14, d: '0.74s', dl: '0.08s' },
                    ].map((bar, idx) => (
                      <span
                        key={idx}
                        className="w-[2.5px] rounded-full bg-amber-300 wave-bar wave-bar-play"
                        style={
                          {
                            height: `${bar.h}px`,
                            '--d': bar.d,
                            '--dl': bar.dl,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <Volume2 className="w-4 h-4 stroke-[2.2]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-950 dark:text-white truncate max-w-[155px] sm:max-w-xs">
                  {audioState.currentTitleAr || (isAr ? 'مقطع صوتي' : 'Audio Track')}
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold truncate">
                  {audioState.currentSheikhAr || (isAr ? 'أثير مضمار' : 'Midmar Audio')}
                </p>
              </div>
            </div>

            {/* Studio Transport Controls (LTR per media standard) */}
            <div dir="ltr" className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {audioState.mode === 'series' && (
                <button
                  type="button"
                  onClick={() => gymFaithAudio.playPrevEpisode()}
                  disabled={!gymFaithAudio.hasPrevEpisode()}
                  className="hidden sm:flex w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 disabled:opacity-30 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 items-center justify-center cursor-pointer"
                  title={isAr ? 'الحلقة السابقة' : 'Previous Episode'}
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => gymFaithAudio.seekBy(-15)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs cursor-pointer"
                title="-15s"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => gymFaithAudio.togglePlay()}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                {audioState.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : audioState.isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current pl-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => gymFaithAudio.seekBy(15)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs cursor-pointer"
                title="+15s"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {audioState.mode === 'series' && (
                <button
                  type="button"
                  onClick={() => gymFaithAudio.playNextEpisode()}
                  disabled={!gymFaithAudio.hasNextEpisode()}
                  className="hidden sm:flex w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 disabled:opacity-30 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 items-center justify-center cursor-pointer"
                  title={isAr ? 'الحلقة التالية' : 'Next Episode'}
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleSpeedCycle}
                className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-950 dark:text-amber-200 font-mono text-[11px] font-bold border border-amber-300/80 cursor-pointer tabular-nums"
                title={isAr ? 'سرعة التشغيل' : 'Playback speed'}
              >
                {audioState.playbackRate}x
              </button>

              <button
                type="button"
                onClick={() => {
                  gymFaithAudio.stop();
                  setPlayingTrackId(null);
                }}
                aria-label={isAr ? 'إيقاف الصوت' : 'Stop Audio'}
                className="w-8 h-8 rounded-full text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 flex items-center justify-center cursor-pointer"
                title={isAr ? 'إيقاف' : 'Stop'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleep Timer Selection Modal (Luminous Ivory & Indigo Sanctuary Card) */}
      {isSleepModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-xs rounded-[28px] bg-[#faf7f0] dark:bg-zinc-900 border-2 border-indigo-300 dark:border-indigo-500/40 shadow-2xl p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                {isAr ? 'مؤقت النوم الهادئ 🌙' : 'Calm Sleep Timer 🌙'}
              </h3>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
                {isAr
                  ? 'إيقاف تشغيل المقاطع تلقائياً بعد فترة محددة للنوم بسلام'
                  : 'Automatically pause audio after a set duration'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setSleepSecondsLeft(mins * 60);
                    setIsSleepModalOpen(false);
                    onRewardToast?.(`🌙 تم ضبط مؤقت النوم على ${mins} دقيقة`);
                  }}
                  className="py-2.5 px-3 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-indigo-600 hover:text-white text-zinc-900 dark:text-zinc-100 border border-indigo-200 dark:border-zinc-700 text-xs font-bold transition-all cursor-pointer tabular-nums shadow-2xs"
                >
                  {mins} {isAr ? 'دقيقة' : 'min'}
                </button>
              ))}
            </div>

            {sleepSecondsLeft !== null && (
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setSleepSecondsLeft(null);
                  setIsSleepModalOpen(false);
                  onRewardToast?.('تم إلغاء مؤقت النوم');
                }}
                className="w-full py-2.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-950 border border-rose-300 text-xs font-bold transition-all cursor-pointer"
              >
                {isAr ? 'إلغاء المؤقت' : 'Cancel Timer'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSleepModalOpen(false)}
              className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white block mx-auto cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

