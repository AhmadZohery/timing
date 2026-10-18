import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Search,
  Volume2,
  X,
  Disc3,
  Heart,
  Moon,
  ChevronDown,
  ChevronUp,
  Loader2,
  Tv,
  Headphones,
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
  masteryLevel?: 0 | 1 | 2 | 3;
  lastReviewedAt?: string;
}

const COMPLETED_TRACKS_STORAGE_KEY = 'midmar_completed_audio_ids_v1';
const SAVED_GEMS_STORAGE_KEY = 'midmar_audio_gems_v1';
const UP_NEXT_QUEUE_STORAGE_KEY = 'midmar_atheer_queue_v1';

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
  const [isAmbiencePopoverOpen, setIsAmbiencePopoverOpen] = useState(false);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelSurpriseTrackId, setWheelSurpriseTrackId] = useState<string | null>(null);
  const [isBottomDeckExpanded, setIsBottomDeckExpanded] = useState(false);
  const [showMoodCompassFilter, setShowMoodCompassFilter] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [topOrbStripMode, setTopOrbStripMode] = useState<'stories' | 'sos'>('stories');
  const [activeSosId, setActiveSosId] = useState<string | null>(null);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);
  const [isDrivingHudMode, setIsDrivingHudMode] = useState(false);
  const [ijazahPreviewPath, setIjazahPreviewPath] = useState<GuidedAcademyPath | null>(null);
  const [trackProgressMap, setTrackProgressMap] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('midmar_atheer_track_progress_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [isDictatingGem, setIsDictatingGem] = useState(false);
  const [expandedMindMapTrackId, setExpandedMindMapTrackId] = useState<string | null>(null);
  const [manuscriptPreviewTrack, setManuscriptPreviewTrack] = useState<MobileAudioTrack | null>(null);
  const [manuscriptTheme, setManuscriptTheme] = useState<'parchment' | 'emerald' | 'sapphire'>('parchment');
  const [isMudarasahMode, setIsMudarasahMode] = useState(false);
  const [mudarasahIndex, setMudarasahIndex] = useState(0);
  const [isMudarasahRevealed, setIsMudarasahRevealed] = useState(false);
  const [upNextQueueIds, setUpNextQueueIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(UP_NEXT_QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [pledgedActionIds, setPledgedActionIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('midmar_atheer_daily_pledges_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const ambientCtxRef = React.useRef<AudioContext | null>(null);
  const ambientGainRef = React.useRef<GainNode | null>(null);
  const autoAdvanceTriggeredRef = React.useRef<string | null>(null);

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

  // Persist per-track listening timestamp every 5 seconds of playback
  useEffect(() => {
    if (!playingTrackId || !audioState.isPlaying || audioState.currentTime < 10) return;
    const sec = Math.floor(audioState.currentTime);
    if (sec % 5 !== 0) return;
    setTrackProgressMap((prev) => {
      if (prev[playingTrackId] === sec) return prev;
      const next = { ...prev, [playingTrackId]: sec };
      try {
        localStorage.setItem('midmar_atheer_track_progress_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [playingTrackId, audioState.isPlaying, audioState.currentTime]);

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

  // 🎙️ Voice-to-Gem Arabic Speech Dictation (إملاء الفائدة صوتياً بالذكاء الصوتي)
  const handleVoiceDictateGem = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      onRewardToast?.('🎙️ متصفحك الحالي لا يدعم الإملاء الصوتي المباشر — يمكنك الكتابة مباشرة');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'ar-SA';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setIsDictatingGem(true);
      onRewardToast?.('🎙️ تحدّث الآن... جاري تحويل صوتك إلى فائدة مكتوبة');

      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setGemDraftText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          onRewardToast?.('✨ تم التقاط الفائدة الصوتية بنجاح!');
        }
        setIsDictatingGem(false);
      };
      recognition.onerror = () => {
        setIsDictatingGem(false);
      };
      recognition.onend = () => {
        setIsDictatingGem(false);
      };
      recognition.start();
    } catch {
      setIsDictatingGem(false);
    }
  };

  // 🔖 1-Tap Instant Golden Timestamp Bookmark (ختم اللحظة الذهبية بضغطة واحدة أثناء الاستماع)
  const handleOneTapGoldenBookmark = () => {
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    const sec = Math.floor(audioState.currentTime || 0);
    const title = audioState.currentTitleAr || 'مجلس صوتي';
    const sheikh = audioState.currentSheikhAr || 'محراب الوعي';
    const matchedTrack = allCombinedTracks.find(
      (t) => t.id === playingTrackId || t.titleAr === title
    );

    const newGem: SavedAudioGem = {
      id: 'gem_mark_' + Date.now(),
      trackId: matchedTrack?.id || playingTrackId || 'active_stream',
      trackTitleAr: title,
      sheikhAr: sheikh,
      timestampSec: sec,
      noteText:
        matchedTrack?.takeawayAr ||
        `🔖 علامة ذهبية مختومة عند الدقيقة ${formatSeconds(sec)} للرجوع والتدبر`,
      createdAt: new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
    };

    setSavedGems((prev) => {
      const next = [newGem, ...prev];
      try {
        localStorage.setItem(SAVED_GEMS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    onRewardToast?.(`🔖 تم ختم اللحظة الذهبية (${formatSeconds(sec)}) في كشكول البصائر بضغطة واحدة!`);
  };

  // 🗺️ Interactive 3-Node Visual Mind-Map Generator per Track (التشجير العقلي البصري للمحاضرة)
  const getTrackVisualMindMap = (track: MobileAudioTrack) => {
    if (track.category === 'men_fiqh') {
      return [
        {
          icon: '🔍',
          stage: '١. التشخيص',
          text: 'فتور الهمة وضياع بوصلة القوامة والمسؤولية في زحام المشتتات.',
          step: '١. التشخيص',
          label: 'فتور الهمة وضياع بوصلة القوامة والمسؤولية في زحام المشتتات.',
        },
        {
          icon: '⚖️',
          stage: '٢. التأصيل',
          text: track.takeawayAr || 'بناء الفتوة الإيمانية والانضباط النفسي على هدي الصحابة.',
          step: '٢. التأصيل',
          label: track.takeawayAr || 'بناء الفتوة الإيمانية والانضباط النفسي على هدي الصحابة.',
        },
        {
          icon: '🎯',
          stage: '٣. العمل',
          text: 'تخصيص ورد يومي ثابت للعلم والعمل لا يُفرّط فيه مهما كانت الظروف.',
          step: '٣. العمل',
          label: 'تخصيص ورد يومي ثابت للعلم والعمل لا يُفرّط فيه مهما كانت الظروف.',
        },
      ];
    }
    if (track.category === 'women_fiqh' || track.category === 'zawaj') {
      return [
        {
          icon: '🔍',
          stage: '١. التشخيص',
          text: 'تأثر البيوت بالمقارنات الوهمية واضطراب مفاهيم السكينة والمودة.',
          step: '١. التشخيص',
          label: 'تأثر البيوت بالمقارنات الوهمية واضطراب مفاهيم السكينة والمودة.',
        },
        {
          icon: '⚖️',
          stage: '٢. التأصيل',
          text: track.takeawayAr || 'البيت المسلم محراب يُبنى بالتغافل الكريم والرحمة وفقه الأدوار.',
          step: '٢. التأصيل',
          label: track.takeawayAr || 'البيت المسلم محراب يُبنى بالتغافل الكريم والرحمة وفقه الأدوار.',
        },
        {
          icon: '🎯',
          stage: '٣. العمل',
          text: 'إرساء مجلس أسري يومي هادئ للذكر والحوار بعيداً عن الشاشات.',
          step: '٣. العمل',
          label: 'إرساء مجلس أسري يومي هادئ للذكر والحوار بعيداً عن الشاشات.',
        },
      ];
    }
    if (track.category === 'mindset' || track.category === 'siyra') {
      return [
        {
          icon: '🔍',
          stage: '١. التشخيص',
          text: 'التشظي المعرفي واستهلاك الشذرات السريعة دون خريطة كلية.',
          step: '١. التشخيص',
          label: 'التشظي المعرفي واستهلاك الشذرات السريعة دون خريطة كلية.',
        },
        {
          icon: '⚖️',
          stage: '٢. التأصيل',
          text: track.takeawayAr || 'ردّ الجزئيات إلى الأصول الكلية المحكمة في الوحي وسنن التاريخ.',
          step: '٢. التأصيل',
          label: track.takeawayAr || 'ردّ الجزئيات إلى الأصول الكلية المحكمة في الوحي وسنن التاريخ.',
        },
        {
          icon: '🎯',
          stage: '٣. العمل',
          text: 'تدوين ٣ أصول منهجية من المجلس ومراجعتها قبل البدء بمجلس جديد.',
          step: '٣. العمل',
          label: 'تدوين ٣ أصول منهجية من المجلس ومراجعتها قبل البدء بمجلس جديد.',
        },
      ];
    }
    return [
      {
        icon: '🔍',
        stage: '١. الباعث',
        text: 'حاجة القلب المتجددة إلى جلاء الغفلة واستعادة الأنس بالله.',
        step: '١. الباعث',
        label: 'حاجة القلب المتجددة إلى جلاء الغفلة واستعادة الأنس بالله.',
      },
      {
        icon: '⚖️',
        stage: '٢. البصيرة',
        text: track.takeawayAr || 'اليقين بأن الصبر على المجاهدة يفتح أبواب اللذة والسكينة.',
        step: '٢. البصيرة',
        label: track.takeawayAr || 'اليقين بأن الصبر على المجاهدة يفتح أبواب اللذة والسكينة.',
      },
      {
        icon: '🎯',
        stage: '٣. الثمرة',
        text: 'محاسبة النفس برفق وتحويل أثر الموعظة إلى ورد عمل يومي دائم.',
        step: '٣. الثمرة',
        label: 'محاسبة النفس برفق وتحويل أثر الموعظة إلى ورد عمل يومي دائم.',
      },
    ];
  };

  const getTrackDailyActionPledge = (track: MobileAudioTrack) => {
    const nodes = getTrackVisualMindMap(track);
    return nodes[2]?.text || 'تحويل بصيرة هذا المجلس إلى خطوة عملية ثابتة اليوم.';
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

  const hasActiveStudioDeck = Boolean(
    playingTrackId ||
      audioState.isPlaying ||
      audioState.isLoading ||
      audioState.currentTime > 0 ||
      (audioState.mediaType === 'youtube' && audioState.youtubeVideoId)
  );

  // Quick Live Radio Stations for 1-Tap FM Tuning
  const quickRadioTracks = useMemo(
    () => allCombinedTracks.filter((t) => t.category === 'radio').slice(0, 4),
    [allCombinedTracks]
  );

  // Circadian Time-of-Day Smart Prescription & Wheel of Wisdom (شمسة البصيرة الدوّارة ووصفة الساعة)
  const circadianPrescription = useMemo(() => {
    const hour = new Date().getHours();
    let labelAr = '🌅 نفحة البكور والصباح';
    let descAr = 'أفضل وقت لتأسيس الوعي وشحذ الهمة في بداية اليوم';
    let defaultTrackId = 'yt_sakran_jisr_taab';
    let badgeGradient = 'from-amber-500 to-emerald-600';

    if (hour >= 4 && hour < 11) {
      labelAr = '🌅 نفحة البكور والصباح';
      descAr = 'طاقة الفجر والضحى: شحذ الهمة وعبور جسر التعب';
      defaultTrackId = 'yt_sakran_jisr_taab';
      badgeGradient = 'from-amber-500 to-emerald-600';
    } else if (hour >= 11 && hour < 16) {
      labelAr = '☀️ زاد السعي والظهيرة';
      descAr = 'بناء الفكر والمنهج في قلب ساعات العمل والسعي';
      defaultTrackId = 'yt_ayman_waay_01';
      badgeGradient = 'from-emerald-600 to-teal-700';
    } else if (hour >= 16 && hour < 21) {
      labelAr = '🌇 سكينة الأصيل والمساء';
      descAr = 'مراجعة القلب وتجديد الإيمان وحسن الظن بالله';
      defaultTrackId = 'yt_qunaibi_husn_zann_01';
      badgeGradient = 'from-amber-600 to-rose-600';
    } else {
      labelAr = '🌌 خلوة الليل والسكينة';
      descAr = 'هدوء الليل: تدبر القرآن ورقائق القلوب الخاشعة';
      defaultTrackId = 'yt_abdelmonem_yusuf_01';
      badgeGradient = 'from-indigo-600 to-emerald-700';
    }

    const activeId = wheelSurpriseTrackId || defaultTrackId;
    const track =
      allCombinedTracks.find((t) => t.id === activeId) ||
      allCombinedTracks.find((t) => t.category !== 'radio') ||
      allCombinedTracks[0];

    return { labelAr, descAr, badgeGradient, track, isSurprise: Boolean(wheelSurpriseTrackId) };
  }, [wheelSurpriseTrackId, allCombinedTracks]);

  const handleSpinWheelOfWisdom = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    setIsSpinningWheel(true);
    const pool = allCombinedTracks.filter((t) => t.category !== 'radio' && t.id !== circadianPrescription.track?.id);
    setTimeout(() => {
      if (pool.length > 0) {
        const picked = pool[Math.floor(Math.random() * pool.length)];
        setWheelSurpriseTrackId(picked.id);
        onRewardToast?.(`🎡 شمسة البصيرة اختارت لك: ${picked.titleAr} (${picked.sheikhAr})`);
      }
      setIsSpinningWheel(false);
    }, 520);
  };

  // ⚡ Interactive Micro-Dose Wisdom Stories (ومضات البصيرة والدرر التطبيقية)
  const wisdomStories = useMemo(
    () => [
      {
        id: 'story_sakran_taab',
        scholarShortAr: 'السكران',
        titleAr: 'سِرّ جسر التعب',
        emoji: '🔥',
        ringGrad: 'from-amber-400 via-orange-500 to-emerald-600',
        quoteAr:
          '«التعب في بداية الطاعة أو طلب العلم ليس علامة عدم توفيق، بل هو "الجسر" الذي جعله الله ليفرز الصادقين؛ فإذا عبرته بالصبر انقلب التعب إلى لذة وأنس لا يقاوم.»',
        actionPledgeAr: 'ألتزم اليوم بـ ٢٠ دقيقة تركيز كامل في وردي أو عملي دون الالتفات للمشتتات',
        trackId: 'yt_sakran_jisr_taab',
      },
      {
        id: 'story_tarefe_thabat',
        scholarShortAr: 'الطريفي',
        titleAr: 'قاعدة الثبات',
        emoji: '🛡️',
        ringGrad: 'from-emerald-500 via-teal-500 to-amber-400',
        quoteAr:
          '«بقدر ما تُعظّم أمر الله في خلواتك وعند الفتن، يثبّت الله قلبك حين تضطرب القلوب؛ فالثبات في العلن ثمرة لصدق التسليم لله في السر.»',
        actionPledgeAr: 'ألتزم اليوم بركعتين في جوف الليل أو الضحى بنية سؤال الله الثبات واليقين',
        trackId: 'yt_tarefe_aqeedah_01',
      },
      {
        id: 'story_ayman_waay',
        scholarShortAr: 'أيمن عبد الرحيم',
        titleAr: 'فخ التشتت',
        emoji: '🧠',
        ringGrad: 'from-indigo-500 via-violet-500 to-amber-400',
        quoteAr:
          '«أكبر أزمة تواجه المسلم المعاصر ليست قلة المعلومات، بل غياب "الخريطة الكلية" والغرق في آلاف الشذرات المبعثرة التي تستهلك العمر بلا بناء حقيقي.»',
        actionPledgeAr: 'ألتزم اليوم بكتابة ٣ فوائد أساسية من مجلس علمي واحد وإتمامه للنهاية',
        trackId: 'yt_ayman_waay_01',
      },
      {
        id: 'story_qunaibi_yaqeen',
        scholarShortAr: 'د. إياد قنيبي',
        titleAr: 'برهان الفطرة',
        emoji: '🧬',
        ringGrad: 'from-teal-500 via-emerald-600 to-indigo-500',
        quoteAr:
          '«حسن الظن بالله ليس مجرد شعور عاطفي، بل هو يقين عقلي وإيماني راسخ بأن كل تقدير يقدّره الحكيم العليم للمؤمن هو محض خير ورحمة وإن خفيت حكمته.»',
        actionPledgeAr: 'ألتزم اليوم بترديد ذكر الاسترجاع والحمد بقلب مطمئن عند أي ضيق أو عارض',
        trackId: 'yt_qunaibi_husn_zann_01',
      },
      {
        id: 'story_sayed_kamel',
        scholarShortAr: 'أحمد السيد',
        titleAr: 'كامل الصورة',
        emoji: '📜',
        ringGrad: 'from-amber-500 via-emerald-600 to-teal-700',
        quoteAr:
          '«الجزئيات إذا فُصلت عن أصولها الكلية أورثت الحيرة؛ فطالب البصيرة يجمع بين نصوص الوحي وفهم السنن الإلهية ليرى المشهد كاملاً بعين السكينة.»',
        actionPledgeAr: 'ألتزم اليوم بقراءة أو سماع ٢٠ دقيقة تأسيسية متسلسلة بدل التصفح العشوائي',
        trackId: 'yt_sayed_kamel_01',
      },
      {
        id: 'story_abdelmonem_tadabbur',
        scholarShortAr: 'د. عبد المنعم',
        titleAr: 'مفتاح التدبر',
        emoji: '📖',
        ringGrad: 'from-emerald-600 via-amber-400 to-teal-600',
        quoteAr:
          '«القرآن لا يمنح أسراره لمن يقرؤه بعين العجلة، بل لمن يقف على الآية وكأنها أُنزلت الساعة لتداوي جرح قلبه وتهديه في موقفه اليومي.»',
        actionPledgeAr: 'ألتزم اليوم بتدبر صفحة واحدة من القرآن بتأنٍّ واستخراج رسالة عملية منها',
        trackId: 'yt_abdelmonem_yusuf_01',
      },
    ],
    []
  );

  // 🏆 Interactive 30-Second Insight Quiz (تحدي البصيرة التفاعلي)
  const insightQuizzes = useMemo(
    () => [
      {
        id: 'quiz_1',
        questionAr: 'بحسب الشيخ إبراهيم السكران في «جسر التعب»، متى يتحول ثقل الطاعة والعلم إلى لذة وأنس؟',
        optionsAr: [
          'حين تترك المجاهدة وتنتظر تغير المزاج تلقائياً',
          'حين تصبر وتثبت على المجاهدة الأولى حتى تعبر «جسر التعب»',
          'حين تقلل الأوراد إلى الحد الأدنى دائماً',
        ],
        correctIdx: 1,
        explanationAr: 'أحسنت! المجاهدة في البداية كالجسر؛ من عبره بالصبر أفضى إلى رياض الأنس واللذة.',
        trackId: 'yt_sakran_jisr_taab',
      },
      {
        id: 'quiz_2',
        questionAr: 'ما العلاج المنهجي لـ «مأزق المترقب» وتأجيل العمل لحين صفاء الظروف؟',
        optionsAr: [
          'البدء الفوري بالممكن المتاح وعدم تعليق البناء على غيب المستقبل',
          'انتظار الإجازة السنوية أو التفرغ التام',
          'الاكتفاء بمتابعة الأخبار والتحليلات اليومية',
        ],
        correctIdx: 0,
        explanationAr: 'إصابة دقيقة! البركة تُستجلب باقتحام العمل المتاح الآن وكسر وهم الانتظار.',
        trackId: 'yt_sakran_maaziq_mutaraqqib',
      },
      {
        id: 'quiz_3',
        questionAr: 'ما الركيزة الأولى في منهج «كامل الصورة» عند الشيخ أحمد بن يوسف السيد؟',
        optionsAr: [
          'الاشتغال بالجدليات الفرعية قبل الأصول',
          'ردّ المتشابهات والجزئيات إلى المحكمات والأصول الكلية في الوحي',
          'القراءة السريعة في كل فن دون تدرج',
        ],
        correctIdx: 1,
        explanationAr: 'فتح الله عليك! ردّ الجزئيات إلى الأصول الكلية المحكمة هو عاصم العقل والقلب من التشتت.',
        trackId: 'yt_sayed_kamel_01',
      },
    ],
    []
  );

  const handleTogglePledge = (pledgeId: string, pledgeTextAr: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    setPledgedActionIds((prev) => {
      const exists = prev.includes(pledgeId);
      const next = exists ? prev.filter((id) => id !== pledgeId) : [...prev, pledgeId];
      try {
        localStorage.setItem('midmar_atheer_daily_pledges_v1', JSON.stringify(next));
      } catch {}
      if (!exists) {
        onRewardToast?.(`🎯 عهد مبارك! تم تسجيل التزامك العملي اليوم (+30 XP): ${pledgeTextAr}`);
      }
      return next;
    });
  };

  const handleInstantSaveStoryGem = (story: (typeof wisdomStories)[number]) => {
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    const newGem: SavedAudioGem = {
      id: 'gem_' + Date.now(),
      trackId: story.trackId,
      trackTitleAr: story.titleAr,
      sheikhAr: story.scholarShortAr,
      timestampSec: 0,
      noteText: story.quoteAr,
      createdAt: new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
      masteryLevel: 1,
    };
    setSavedGems((prev) => {
      const next = [newGem, ...prev];
      try {
        localStorage.setItem(SAVED_GEMS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    onRewardToast?.('💎 تم حفظ القاعدة الذهبية في كشكول البصائر الخاص بك!');
  };

  // 🚑 Instant 1-Tap SOS Spiritual First-Aid Capsules (كبسولات إسعاف القلب الفوري حسب الحال الطارئ)
  const sosHeartCapsules = useMemo(
    () => [
      {
        id: 'sos_futoor',
        emoji: '🥀',
        titleAr: 'عند الفتور وثقل الطاعة',
        subtitleAr: 'روشتة عبور جسر التعب',
        ayahOrHadithAr: '﴿وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا﴾',
        diagnosisAr:
          'الفتور العارض طبيعة بشرية، وعلاجه ألا تقطع الوِرد بالكلية بل تعبر «جسر التعب» بالقليل الدائم حتى يفتح الله عليك باب الأنس.',
        breathingCueAr: 'شهيق بالاستعانة بالله (٤ث) • سكون (٤ث) • زفير لكسل النفس (٤ث)',
        ambientPreset: 'breeze' as const,
        trackId: 'yt_sakran_jisr_taab',
        autoSleepMinutes: null as number | null,
      },
      {
        id: 'sos_dayq',
        emoji: '❤️‍🩹',
        titleAr: 'عند ضيق الصدر والهمّ',
        subtitleAr: 'بلسم اليقين وحسن الظن',
        ayahOrHadithAr: '﴿فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾',
        diagnosisAr:
          'ضيق الصدر ينقشع حين يستحضر القلب أن تدبير الله لعبده المؤمن خيرٌ من تدبير العبد لنفسه، وأن مع كل عسر يسرين.',
        breathingCueAr: 'شهيق بالرضا والتسليم • سكون بالطمأنينة • زفير للهموم',
        ambientPreset: 'rain' as const,
        trackId: 'yt_qunaibi_husn_zann_01',
        autoSleepMinutes: null as number | null,
      },
      {
        id: 'sos_tashattut',
        emoji: '🌪️',
        titleAr: 'عند تشتت الذهن والقلق',
        subtitleAr: 'جمع الشتات وبناء البوصلة',
        ayahOrHadithAr: '«اللَّهُمَّ رحمتَك أرجو فلا تَكِلْني إلى نفسي طرفةَ عينٍ»',
        diagnosisAr:
          'التشتت ينشأ من ازدحام الشذرات والمقارنات؛ وعلاجه إغلاق منافذ الضجيج والرجوع إلى أصل واحد محكم تتقنه اليوم.',
        breathingCueAr: 'شهيق بجمع القلب على الله • سكون • زفير لمشتتات الشاشات',
        ambientPreset: 'warmth' as const,
        trackId: 'yt_ayman_waay_01',
        autoSleepMinutes: null as number | null,
      },
      {
        id: 'sos_qarar',
        emoji: '⚖️',
        titleAr: 'قبل قرار مصيري أو حيرة',
        subtitleAr: 'تأصيل الثبات والتوكل',
        ayahOrHadithAr: '﴿فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ﴾',
        diagnosisAr:
          'الحيرة تزول بالجمع بين الاستخارة الصادقة، واستشارة أهل البصيرة، وبذل السبب المتاح دون شلل الترقب.',
        breathingCueAr: 'شهيق بالتوكل • سكون باليقين • زفير للتردد والقلق',
        ambientPreset: 'breeze' as const,
        trackId: 'yt_sakran_maaziq_mutaraqqib',
        autoSleepMinutes: null as number | null,
      },
      {
        id: 'sos_araq',
        emoji: '🌙',
        titleAr: 'عند الأرق قبل النوم',
        subtitleAr: 'خلوة السكينة ومؤقت النوم',
        ayahOrHadithAr: '﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾',
        diagnosisAr:
          'سكينة الليل تنزل بتفريغ القلب من خصومات النهار، والتدبر الهادئ في آيات الله مع صوت المطر ومؤقت النوم التلقائي.',
        breathingCueAr: 'شهيق هادئ عميق • سكون بالذكر • زفير طويل مسترخٍ',
        ambientPreset: 'rain' as const,
        trackId: 'yt_abdelmonem_yusuf_01',
        autoSleepMinutes: 30 as number | null,
      },
    ],
    []
  );

  const handleLaunchSosCapsule = (capsule: (typeof sosHeartCapsules)[number]) => {
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    const targetTrack =
      allCombinedTracks.find((t) => t.id === capsule.trackId) || allCombinedTracks[0];
    setAmbientMode(capsule.ambientPreset);
    if (capsule.autoSleepMinutes) {
      setSleepSecondsLeft(capsule.autoSleepMinutes * 60);
    }
    if (targetTrack) {
      handleTogglePlayTrack(targetTrack);
    }
    onRewardToast?.(
      `🚑 تم تفعيل روشتة «${capsule.titleAr}» مع أجواء السكينة المصاحبة!`
    );
  };

  // 🚗 Smart Majlis Queue & Continuous Hands-Free Flow (قائمة المجلس الذكية المتتابعة)
  const handleToggleQueueTrack = (trackId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setUpNextQueueIds((prev) => {
      const exists = prev.includes(trackId);
      const next = exists ? prev.filter((id) => id !== trackId) : [...prev, trackId];
      try {
        localStorage.setItem(UP_NEXT_QUEUE_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      onRewardToast?.(
        exists
          ? '📋 تم إزالة المجلس من طابور الاستماع التلقائي'
          : '🚗 تمت إضافة المجلس لطابور الاستماع المتتابع (يعمل تلقائياً بعد المجلس الحالي)'
      );
      return next;
    });
  };

  const handleQueueEntirePath = (pathTracks: MobileAudioTrack[], pathTitleAr: string) => {
    if (pathTracks.length === 0) return;
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    const firstUncompleted = pathTracks.find((t) => !completedTrackIds.includes(t.id)) || pathTracks[0];
    const startIdx = pathTracks.findIndex((t) => t.id === firstUncompleted.id);
    const remainingIds = pathTracks.slice(startIdx + 1).map((t) => t.id);

    setUpNextQueueIds(remainingIds);
    try {
      localStorage.setItem(UP_NEXT_QUEUE_STORAGE_KEY, JSON.stringify(remainingIds));
    } catch {}
    handleTogglePlayTrack(firstUncompleted);
    onRewardToast?.(
      `🚗▶️ بدأ تشغيل مسار «${pathTitleAr}» متصلاً (${remainingIds.length} مجالس في الطابور التلقائي)`
    );
  };

  const handlePlayNextInQueue = () => {
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    if (upNextQueueIds.length > 0) {
      const [nextId, ...rest] = upNextQueueIds;
      setUpNextQueueIds(rest);
      try {
        localStorage.setItem(UP_NEXT_QUEUE_STORAGE_KEY, JSON.stringify(rest));
      } catch {}
      const nextTrack = allCombinedTracks.find((t) => t.id === nextId);
      if (nextTrack) {
        handleTogglePlayTrack(nextTrack);
        onRewardToast?.(`⏭️ انتقل الطابور الذكي تلقائياً إلى: ${nextTrack.titleAr}`);
        return;
      }
    }
    // Smart Auto-Pilot fallback: pick next uncompleted non-radio track
    const nonRadio = allCombinedTracks.filter((t) => t.category !== 'radio');
    const curIdx = nonRadio.findIndex((t) => t.id === playingTrackId);
    const fallbackTrack = nonRadio[(curIdx + 1) % Math.max(1, nonRadio.length)];
    if (fallbackTrack) {
      handleTogglePlayTrack(fallbackTrack);
      onRewardToast?.(`⏭️ اقتراح الأثير المتصل: ${fallbackTrack.titleAr}`);
    }
  };

  // Auto-advance when current track finishes
  useEffect(() => {
    if (
      audioState.duration > 45 &&
      audioState.currentTime >= audioState.duration - 1.5 &&
      playingTrackId &&
      autoAdvanceTriggeredRef.current !== playingTrackId
    ) {
      autoAdvanceTriggeredRef.current = playingTrackId;
      if (!completedTrackIds.includes(playingTrackId)) {
        toggleCompletedTrack(playingTrackId);
      }
      if (upNextQueueIds.length > 0) {
        handlePlayNextInQueue();
      }
    }
  }, [audioState.currentTime, audioState.duration, playingTrackId, upNextQueueIds, completedTrackIds]);

  // 🧠 Interactive Spaced-Repetition "Mudarasah" Flashcard Deck & 1-Tap Timestamp Audio Seek
  const handleJumpToGemTimestamp = (gem: SavedAudioGem) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const targetTrack = allCombinedTracks.find(
      (t) => t.id === gem.trackId || t.titleAr === gem.trackTitleAr
    );
    if (targetTrack && playingTrackId !== targetTrack.id) {
      handleTogglePlayTrack(targetTrack);
      setTimeout(() => {
        if (gem.timestampSec > 0) gymFaithAudio.seekTo(gem.timestampSec);
      }, 450);
    } else if (gem.timestampSec > 0) {
      gymFaithAudio.seekTo(gem.timestampSec);
    }
    onRewardToast?.(
      `⏱️▶️ تم القفز الصوتي المباشر للحظة الدرة (${formatSeconds(gem.timestampSec)})`
    );
  };

  const mudarasahDeck = useMemo<SavedAudioGem[]>(() => {
    const builtInCards: SavedAudioGem[] = wisdomStories.map((st) => ({
      id: `builtin_${st.id}`,
      trackId: st.trackId,
      trackTitleAr: st.titleAr,
      sheikhAr: st.scholarShortAr,
      timestampSec: 0,
      noteText: st.quoteAr,
      createdAt: 'قاعدة تأصيلية',
      masteryLevel: 1,
    }));
    return [...savedGems, ...builtInCards];
  }, [savedGems, wisdomStories]);

  const handleRateGemMastery = (gem: SavedAudioGem, level: 1 | 2 | 3) => {
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    if (!gem.id.startsWith('builtin_')) {
      setSavedGems((prev) => {
        const next = prev.map((g) =>
          g.id === gem.id
            ? {
                ...g,
                masteryLevel: level,
                lastReviewedAt: new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
              }
            : g
        );
        try {
          localStorage.setItem(SAVED_GEMS_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    }
    setIsMudarasahRevealed(false);
    setMudarasahIndex((prev) => (prev + 1) % Math.max(1, mudarasahDeck.length));
    if (level === 3) {
      onRewardToast?.('👑 ما شاء الله! ثبتت الدرة في القلب والعمل (+30 XP)');
    } else if (level === 2) {
      onRewardToast?.('🌿 أحسنت! تم تثبيت البصيرة في جدول المدارسة (+15 XP)');
    } else {
      onRewardToast?.('🔄 تمت جدولة الدرة للمراجعة مجدداً غداً بإذن الله');
    }
  };

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

  // Color-coded 3D Bento card palette per track category
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

      {/* 1. Sleek Compact 2-Row Royal Mihrab Crown Header (Liberates 82%+ Mobile Scroll Canvas) */}
      <div className="bg-gradient-to-br from-[#ecfdf5] via-[#fef9c3]/70 to-[#e0e7ff]/75 dark:from-emerald-950/90 dark:via-zinc-900 dark:to-indigo-950/85 px-3 pt-2.5 pb-2 border-b border-amber-300/70 dark:border-amber-500/25 shrink-0 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-indigo-500" />

        {/* Live Atmospheric Sanctuary Weather Visual Overlays */}
        {ambientMode === 'rain' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-65">
            <span className="absolute top-1 start-[12%] w-[1.5px] h-7 bg-gradient-to-b from-transparent via-teal-500 to-amber-400 rotate-12 animate-pulse" />
            <span className="absolute top-2 start-[38%] w-[1.5px] h-8 bg-gradient-to-b from-transparent via-emerald-500 to-teal-300 rotate-12 animate-bounce" />
            <span className="absolute top-1 start-[68%] w-[1.5px] h-8 bg-gradient-to-b from-transparent via-emerald-500 to-amber-400 rotate-12 animate-bounce" />
            <span className="absolute top-1 start-[88%] w-[1.5px] h-7 bg-gradient-to-b from-transparent via-teal-500 to-emerald-300 rotate-12 animate-pulse" />
          </div>
        )}
        {ambientMode === 'breeze' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-75">
            <span className="absolute top-2 start-[18%] w-2 h-2 rounded-full bg-emerald-400/60 blur-[1px] animate-ping" />
            <span className="absolute bottom-2 start-[48%] w-2.5 h-2.5 rounded-full bg-amber-300/70 blur-[1px] animate-bounce" />
            <span className="absolute top-3 start-[76%] w-2 h-2 rounded-full bg-teal-400/60 blur-[1px] animate-pulse" />
          </div>
        )}
        {ambientMode === 'warmth' && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.28),transparent_70%)] animate-pulse" />
        )}

        {/* Row 1: Rotating Mamluk Shamsa Vinyl + Title + 4 Compact Action Orbs */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2 min-w-0">
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
              className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer group shadow-[0_4px_14px_rgba(6,78,59,0.25)] active:scale-95 transition-transform"
            >
              {audioState.isPlaying && (
                <span className="pointer-events-none absolute -inset-0.5 rounded-full border-2 border-amber-400/70 animate-ping opacity-40" />
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
                <circle cx="50" cy="50" r="48" fill="url(#shamsaDiscGrad)" stroke="#f59e0b" strokeWidth="2.5" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#fde68a" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.75" />
                <rect x="26" y="26" width="48" height="48" rx="4" fill="none" stroke="#fbbf24" strokeWidth="1.4" opacity="0.85" />
                <rect x="26" y="26" width="48" height="48" rx="4" fill="none" stroke="#fbbf24" strokeWidth="1.4" opacity="0.85" transform="rotate(45 50 50)" />
                <circle cx="50" cy="50" r="15" fill="#fffbeb" stroke="#d97706" strokeWidth="2" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-emerald-900">
                {audioState.isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ms-0.5" />
                )}
              </div>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300/80">
                  {isAr ? '۞ مِحراب الوعي' : '۞ Mihrab'}
                </span>
                {completedTrackIds.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-950 dark:text-indigo-200 border border-indigo-300">
                    🎓 {completedTrackIds.length}
                  </span>
                )}
                {audioState.isPlaying && (
                  <div className="flex items-end gap-[2px] h-3 px-1 py-0.5 rounded-full bg-emerald-900/10 dark:bg-emerald-400/15">
                    {[5, 10, 7, 11].map((h, idx) => (
                      <span
                        key={idx}
                        className="w-[2px] rounded-full bg-gradient-to-t from-emerald-600 to-amber-500 wave-bar wave-bar-play"
                        style={{ height: `${h}px`, '--d': `${0.5 + idx * 0.08}s` } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white truncate">
                {audioState.isPlaying && audioState.currentTitleAr
                  ? audioState.currentTitleAr
                  : isAr
                  ? 'أكاديمية واستوديو أثير الوعي'
                  : 'Midmar Faith & Awareness Studio'}
              </h2>
            </div>
          </div>

          {/* Compact Action Orbs: رشّح لي • أجواء • رابط • نوم • إغلاق */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsSmartConciergeOpen((prev) => !prev);
                setIsAmbiencePopoverOpen(false);
                setIsCustomDrawerOpen(false);
              }}
              className={`px-2 py-1.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isSmartConciergeOpen
                  ? 'bg-indigo-600 text-white border-amber-300 ring-2 ring-amber-300/60'
                  : 'bg-gradient-to-r from-amber-100 to-emerald-100 dark:from-indigo-950 dark:to-emerald-950 text-zinc-950 dark:text-amber-200 border-amber-400/90'
              }`}
              title={isAr ? 'مستشار القلب والوقت الذكي' : 'Smart Concierge'}
            >
              <span>🧭</span>
              <span className="hidden xs:inline">{isAr ? 'رشّح لي' : 'Advise'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsAmbiencePopoverOpen((prev) => !prev);
                setIsSmartConciergeOpen(false);
                setIsCustomDrawerOpen(false);
              }}
              className={`px-2 py-1.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                ambientMode !== 'off' || isAmbiencePopoverOpen
                  ? 'bg-indigo-600 text-white border-amber-300 shadow-2xs'
                  : 'bg-white/90 dark:bg-zinc-800 text-indigo-950 dark:text-indigo-200 border-indigo-300/80 dark:border-zinc-700'
              }`}
              title={isAr ? 'مازج أجواء الخشوع والطبيعة (مطر • نسيم • دفء)' : 'Nature Ambience Mixer'}
            >
              <span>{ambientMode === 'rain' ? '🌧️' : ambientMode === 'breeze' ? '🍃' : ambientMode === 'warmth' ? '🕯️' : '🌧️'}</span>
              <span className="hidden sm:inline">{isAr ? 'أجواء' : 'Ambience'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setIsCustomDrawerOpen((prev) => !prev);
                setIsSmartConciergeOpen(false);
                setIsAmbiencePopoverOpen(false);
              }}
              className={`px-2 py-1.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer ${
                isCustomDrawerOpen
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-white/90 dark:bg-zinc-800 text-emerald-900 dark:text-emerald-200 border-emerald-300/80 dark:border-zinc-700'
              }`}
              title={isAr ? 'إضافة وحفظ رابط يوتيوب أو ساوند كلاود خاص' : 'Add Custom Link'}
            >
              ➕
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setIsSleepModalOpen(true);
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer ${
                sleepSecondsLeft !== null
                  ? 'bg-indigo-600 text-white border-indigo-700 font-mono animate-pulse'
                  : 'bg-white/90 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-amber-300/80 dark:border-zinc-700'
              }`}
              title={isAr ? 'مؤقت النوم' : 'Sleep Timer'}
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
              className="w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-800 hover:bg-rose-50 text-zinc-700 dark:text-zinc-200 hover:text-rose-700 border border-zinc-300/80 dark:border-zinc-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Popover 1: Nature & Sanctuary Ambience Mixer (أجواء الخشوع) */}
        {isAmbiencePopoverOpen && (
          <div className="mt-2 p-2.5 rounded-2xl bg-white/95 dark:bg-zinc-900 border-2 border-indigo-300 dark:border-indigo-500/40 shadow-md flex flex-wrap items-center justify-between gap-2 relative z-10 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-indigo-950 dark:text-indigo-200 me-1">
                {isAr ? '🌧️ خلفية صوتية خاشعة:' : 'Ambience:'}
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
                        onRewardToast?.(isAr ? `${amb.label} يعمل بهدوء في خلفية المجلس` : `${amb.label} enabled`);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white border-amber-300 shadow-xs'
                        : 'bg-indigo-50/80 dark:bg-zinc-800 text-indigo-950 dark:text-indigo-200 border-indigo-200 dark:border-zinc-700'
                    }`}
                  >
                    {amb.label}
                  </button>
                );
              })}
            </div>
            {ambientMode !== 'off' && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100/90 dark:bg-indigo-950/70 border border-indigo-300">
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
                  className="w-16 h-1 bg-indigo-300 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            )}
          </div>
        )}

        {/* Collapsible Popover 2: Smart Heart-State & Time-Window Concierge Drawer ("رشّح لي") */}
        {isSmartConciergeOpen && (
          <div className="mt-2 p-2.5 rounded-2xl bg-gradient-to-br from-white via-amber-50/70 to-emerald-50/80 dark:from-zinc-900 dark:via-indigo-950/50 dark:to-emerald-950/40 border-2 border-amber-400/90 shadow-lg space-y-2 relative z-10 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-zinc-950 dark:text-amber-200 flex items-center gap-1">
                <span>🧭</span>
                <span>{isAr ? 'مستشار البصيرة الذكي: اختر حال قلبك ووقتك' : 'Smart Heart & Time Concierge'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsSmartConciergeOpen(false)}
                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'futoor', label: '🌧️ فتور وتشتت' },
                { id: 'shubuhat', label: '🛡️ شبهات وحيرة' },
                { id: 'waay', label: '🧠 شغف بالوعي' },
                { id: 'bayt', label: '🏡 بناء الأسرة' },
                { id: 'sakeenah', label: '🌿 سكينة وخشوع' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setConciergeMood(m.id as any);
                  }}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer border transition-all ${
                    conciergeMood === m.id
                      ? 'bg-emerald-700 text-white border-amber-300 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-amber-300/70'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                {isAr ? 'الوقت:' : 'Time:'}
              </span>
              {[
                { id: 'short', label: '⚡ ١٥-٢٥د' },
                { id: 'medium', label: '🎯 ٣٠-٤٥د' },
                { id: 'deep', label: '🏛️ +٤٥د' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setConciergeDuration(d.id as any);
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer border transition-all ${
                    conciergeDuration === d.id
                      ? 'bg-indigo-600 text-white border-amber-300 shadow-2xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-indigo-200 dark:border-zinc-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {smartRecommendedTrack.track && (
              <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white border border-amber-300/80 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">
                    ✨ {smartRecommendedTrack.track.titleAr} ({smartRecommendedTrack.track.sheikhAr})
                  </p>
                  <p className="text-[10px] text-emerald-100 truncate">
                    💡 {smartRecommendedTrack.reasonAr}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleTogglePlayTrack(smartRecommendedTrack.track);
                    setIsSmartConciergeOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-[11px] font-bold shrink-0 cursor-pointer shadow-md"
                >
                  {isAr ? 'تشغيل ▶️' : 'Play ▶️'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Popover 3: Custom YouTube / SoundCloud Link Launcher */}
        {isCustomDrawerOpen && (
          <form
            onSubmit={handleLaunchCustomUrl}
            className="mt-2 p-2 rounded-2xl bg-white/95 dark:bg-zinc-900 border border-emerald-400/80 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 relative z-10 animate-in fade-in duration-150"
          >
            <input
              type="url"
              required
              value={customLinkInput}
              onChange={(e) => setCustomLinkInput(e.target.value)}
              placeholder={isAr ? 'الصق رابط يوتيوب أو ساوند كلاود أو MP3 لحفظه وتشغيله...' : 'Paste YouTube, SoundCloud, or MP3 URL...'}
              className="flex-1 h-8 px-2.5 rounded-xl bg-emerald-50/60 dark:bg-zinc-950 border border-emerald-300/80 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none"
            />
            <input
              type="text"
              value={customTitleInput}
              onChange={(e) => setCustomTitleInput(e.target.value)}
              placeholder={isAr ? 'عنوان الدرس (اختياري)' : 'Title (optional)'}
              className="sm:w-40 h-8 px-2.5 rounded-xl bg-amber-50/60 dark:bg-zinc-950 border border-amber-300/80 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="h-8 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0"
            >
              {isAr ? 'حفظ وتشغيل ▶️' : 'Save & Play ▶️'}
            </button>
          </form>
        )}

        {/* Row 2: 5-Mode Interactive Studio Switcher integrated cleanly into Crown */}
        <div className="mt-2 grid grid-cols-5 bg-white/90 dark:bg-zinc-950/90 p-0.5 rounded-xl border border-amber-300/70 dark:border-zinc-800 gap-0.5 shadow-inner relative z-10">
          {[
            { id: 'tracks', label: isAr ? 'المختارات 🎧' : 'Curated', activeGrad: 'from-emerald-600 to-teal-600' },
            { id: 'paths', label: isAr ? 'مسارات 🎓' : 'Paths', activeGrad: 'from-amber-600 to-emerald-600' },
            { id: 'youtube', label: isAr ? 'يوتيوب ⭐' : 'YouTube', activeGrad: 'from-rose-600 to-amber-600' },
            { id: 'soundcloud', label: isAr ? 'ساوند كلاود ☁️' : 'SoundCloud', activeGrad: 'from-orange-600 to-amber-500' },
            { id: 'scholars', label: isAr ? 'العلماء 🏛️' : 'Scholars', activeGrad: 'from-indigo-600 to-violet-600' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setViewMode(tab.id as any);
              }}
              className={`py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                viewMode === tab.id
                  ? `bg-gradient-to-r ${tab.activeGrad} text-white shadow-2xs`
                  : 'text-zinc-700 dark:text-zinc-400 hover:bg-amber-50/70 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Inline Timestamped Gem Modal when user taps ✍️ دوّن فائدة */}
      {gemDraftTrack && (
        <form
          onSubmit={handleSaveGem}
          className="mx-3 mt-2 p-2.5 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-emerald-50 dark:from-zinc-900 dark:to-emerald-950/50 border-2 border-amber-400 shadow-lg space-y-1.5 shrink-0 relative z-20"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-amber-950 dark:text-amber-200 truncate">
              ✍️ تدوين فائدة: <span className="text-emerald-800 dark:text-emerald-300">{gemDraftTrack.titleAr}</span>
              {audioState.currentTime > 0 && (
                <span className="ms-1.5 px-1.5 py-0.5 rounded-full bg-amber-200/80 text-zinc-950 font-mono text-[10px]">
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
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              required
              value={gemDraftText}
              onChange={(e) => setGemDraftText(e.target.value)}
              placeholder={isAr ? 'اكتب الدرة أو اضغط 🎙️ للإملاء الصوتي بالعربية...' : 'Write or dictate your insight...'}
              className="flex-1 h-8 px-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-amber-300 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleVoiceDictateGem}
              className={`h-8 px-2.5 rounded-xl text-[11px] font-bold shrink-0 cursor-pointer border transition-all flex items-center gap-1 ${
                isDictatingGem
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-md'
                  : 'bg-amber-100 hover:bg-amber-200 dark:bg-zinc-800 text-amber-950 dark:text-amber-200 border-amber-300'
              }`}
              title={isAr ? 'إملاء الفائدة بالصوت 🎙️' : 'Voice Dictation 🎙️'}
            >
              <span>🎙️</span>
              <span className="hidden xs:inline">{isDictatingGem ? 'يستمع...' : 'إملاء'}</span>
            </button>
            <button
              type="submit"
              className="h-8 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              {isAr ? 'حفظ 💎' : 'Save 💎'}
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
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          setIjazahPreviewPath(path);
                        }}
                        className="px-2.5 py-1 rounded-full bg-amber-300 hover:bg-amber-200 text-zinc-950 text-[10px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
                        title="عرض وثيقة وإجازة المسار المنهجي"
                      >
                        <span>📜</span>
                        <span>وثيقة المسار</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQueueEntirePath(pathTracks, path.titleAr)}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 text-emerald-950 text-[10px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
                        title="تشغيل محاضرات المسار متتابعة تلقائياً"
                      >
                        <span>🚗▶️</span>
                        <span>تشغيل متصلاً</span>
                      </button>
                      <span className="px-2.5 py-1 rounded-full bg-amber-400 text-zinc-950 font-mono text-xs font-bold shrink-0">
                        {pct}%
                      </span>
                    </div>
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

          {/* Saved Timestamped Insights Notebook + Spaced-Repetition Mudarasah Deck */}
          <div className="p-4 rounded-[26px] bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-zinc-900 dark:to-zinc-900 border-2 border-amber-300/80 dark:border-zinc-700 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                <span>💎</span>
                <span>{isAr ? 'كشكول الفوائد ومدارسة الدرر' : 'Timestamped Insights & Flashcards'}</span>
              </h4>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsMudarasahMode((prev) => !prev);
                    setIsMudarasahRevealed(false);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
                    isMudarasahMode
                      ? 'bg-emerald-700 text-amber-200 border-amber-400 shadow-xs'
                      : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 border-amber-500'
                  }`}
                >
                  {isMudarasahMode ? '📋 عرض الكشكول' : '🧠 بطاقات المدارسة والتثبيت'}
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-zinc-950">
                  {savedGems.length} {isAr ? 'فائدة' : 'gems'}
                </span>
              </div>
            </div>

            {isMudarasahMode ? (
              (() => {
                const activeGem = mudarasahDeck[mudarasahIndex % Math.max(1, mudarasahDeck.length)];
                if (!activeGem) return null;
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-indigo-950 text-white border-2 border-amber-400 shadow-lg space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-bold">
                        🧠 مدارسة وتثبيت بالتكرار المتباعد ({(mudarasahIndex % mudarasahDeck.length) + 1}/{mudarasahDeck.length})
                      </span>
                      <span className="text-[10px] font-bold text-emerald-200 truncate">
                        🎙️ {activeGem.sheikhAr}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-300 font-bold block">
                        📚 المجلس: {activeGem.trackTitleAr}
                      </span>
                      {!isMudarasahRevealed ? (
                        <div className="p-4 rounded-2xl bg-white/10 border border-dashed border-amber-300/50 text-center space-y-2.5">
                          <p className="text-xs font-bold text-amber-100 leading-relaxed">
                            «استحضر في ذهنك القاعدة التأصيلية أو الفائدة التي قيّدتها من هذا المجلس قبل كشف البطاقة...»
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              soundSynth.playTactileClick();
                              haptic.vibrateLight();
                              setIsMudarasahRevealed(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold cursor-pointer shadow-md"
                          >
                            👁️ اكشف الدرة والقاعدة
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5 animate-in fade-in duration-150">
                          <div className="p-3 rounded-2xl bg-white/15 border border-amber-300/60 text-xs font-bold text-white leading-[1.95]">
                            «{activeGem.noteText}»
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRateGemMastery(activeGem, 1)}
                              className="py-2 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-100 border border-white/20 text-[10px] font-bold cursor-pointer"
                            >
                              🔄 أعد غداً
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRateGemMastery(activeGem, 2)}
                              className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 text-[10px] font-bold cursor-pointer"
                            >
                              🌿 ترسّخت (+15 XP)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRateGemMastery(activeGem, 3)}
                              className="py-2 px-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 border border-amber-200 text-[10px] font-bold cursor-pointer shadow-sm"
                            >
                              👑 أتقنتها (+30 XP)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : savedGems.length === 0 ? (
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                {isAr
                  ? 'اضغط على زر (✍️ فائدة) أو (🔖 ختم) في أي محاضرة لحفظ الفوائد بختم الدقيقة والثانية، أو اضغط (🧠 بطاقات المدارسة) لمراجعة القواعد التأصيلية.'
                  : 'Tap (✍️ Note) or (🔖 Mark) on any lecture card to save timestamped insights.'}
              </p>
            ) : (
              <div className="space-y-2">
                {savedGems.map((gem) => (
                  <div
                    key={gem.id}
                    className="p-3 rounded-2xl bg-white dark:bg-zinc-950 border border-amber-300/70 dark:border-zinc-800 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 truncate">
                          {gem.trackTitleAr} — {gem.sheikhAr}
                        </span>
                        {gem.masteryLevel === 3 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold shrink-0">
                            👑 متقنة
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleJumpToGemTimestamp(gem)}
                          className="px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 font-mono text-[10px] font-bold cursor-pointer flex items-center gap-1"
                          title="تشغيل المحاضرة والقفز مباشرة لهذه الدقيقة"
                        >
                          <span>▶️⏱️</span>
                          <span>{formatSeconds(gem.timestampSec)}</span>
                        </button>
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
        /* Unified Full-Height Mobile Scrollable Canvas (82%+ Fluid Viewport) */
        <div
          className={`flex-1 overflow-y-auto overscroll-contain relative z-10 ${
            hasActiveStudioDeck ? 'pb-36' : 'pb-10'
          }`}
        >
          {/* A. ⚡ Interactive Wisdom Story Orbs + 4-Card Swipeable Hero Deck */}
          {!searchQuery.trim() && (
            <div className="px-3.5 pt-2.5 pb-1 space-y-2.5">
              {/* 1. ⚡ Glowing Scholar Wisdom Story Orbs + 🚑 SOS Spiritual First-Aid Switcher */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 px-0.5 flex-wrap">
                  <div className="inline-flex items-center p-0.5 rounded-full bg-amber-100/80 dark:bg-zinc-900 border border-amber-300/80 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setTopOrbStripMode('stories');
                        setActiveSosId(null);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                        topOrbStripMode === 'stories'
                          ? 'bg-emerald-800 text-white shadow-2xs'
                          : 'text-amber-950 dark:text-amber-200'
                      }`}
                    >
                      ⚡ ومضات العلماء
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        setTopOrbStripMode('sos');
                        setActiveStoryId(null);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                        topOrbStripMode === 'sos'
                          ? 'bg-rose-700 text-white shadow-2xs'
                          : 'text-rose-900 dark:text-rose-300'
                      }`}
                    >
                      🚑 إسعاف القلب الفوري (SOS)
                    </button>
                  </div>

                  {pledgedActionIds.length > 0 && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300">
                      🎯 {pledgedActionIds.length} عهد عملي اليوم
                    </span>
                  )}
                </div>

                {topOrbStripMode === 'stories' ? (
                  <>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 -mx-3.5 px-3.5">
                      {wisdomStories.map((story) => {
                        const isSelected = activeStoryId === story.id;
                        const isPledged = pledgedActionIds.includes(story.id);
                        return (
                          <button
                            key={story.id}
                            type="button"
                            onClick={() => {
                              soundSynth.playTactileClick();
                              haptic.vibrateLight();
                              setActiveStoryId(isSelected ? null : story.id);
                            }}
                            className={`shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white border-amber-400 shadow-md ring-2 ring-amber-300/60'
                                : 'bg-white/95 dark:bg-zinc-900 hover:bg-amber-50/80 text-zinc-900 dark:text-zinc-100 border-amber-300/80 dark:border-zinc-700 shadow-2xs'
                            }`}
                          >
                            <span
                              className={`w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr ${story.ringGrad} flex items-center justify-center shrink-0`}
                            >
                              <span className="w-full h-full rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center text-sm">
                                {story.emoji}
                              </span>
                            </span>
                            <div className="text-start leading-tight">
                              <div className="text-[10px] font-bold flex items-center gap-1">
                                <span>{story.scholarShortAr}</span>
                                {isPledged && <span className="text-emerald-500">✔</span>}
                              </div>
                              <div
                                className={`text-[9px] font-semibold ${
                                  isSelected ? 'text-amber-200' : 'text-zinc-500 dark:text-zinc-400'
                                }`}
                              >
                                {story.titleAr}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Expandable Interactive Story Flash Card when an Orb is tapped */}
                    {activeStoryId &&
                      (() => {
                        const activeStoryIdx = wisdomStories.findIndex((s) => s.id === activeStoryId);
                        const story = wisdomStories[activeStoryIdx];
                        if (!story) return null;
                        const linkedTrack = allCombinedTracks.find((t) => t.id === story.trackId);
                        const isPledged = pledgedActionIds.includes(story.id);

                        return (
                          <div className="p-3.5 rounded-[22px] bg-gradient-to-br from-[#fffdf7] via-amber-50/80 to-emerald-50/75 dark:from-zinc-900 dark:via-indigo-950/40 dark:to-emerald-950/40 border-2 border-amber-400 shadow-md space-y-2.5 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{story.emoji}</span>
                                <div>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-300/80 text-zinc-950">
                                    ⚡ ومضة بصيرة • {story.scholarShortAr}
                                  </span>
                                  <h4 className="text-xs font-bold text-zinc-950 dark:text-white mt-0.5">
                                    {story.titleAr}
                                  </h4>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundSynth.playTactileClick();
                                    const nextStory =
                                      wisdomStories[(activeStoryIdx + 1) % wisdomStories.length];
                                    setActiveStoryId(nextStory.id);
                                  }}
                                  className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-zinc-800 hover:bg-amber-200 text-amber-950 dark:text-amber-200 text-[10px] font-bold border border-amber-300 cursor-pointer"
                                >
                                  {isAr ? 'الومضة التالية ⏭️' : 'Next ⏭️'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveStoryId(null)}
                                  className="w-6 h-6 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100 leading-[1.9] bg-white/85 dark:bg-zinc-950/70 p-2.5 rounded-xl border border-amber-300/70">
                              {story.quoteAr}
                            </p>

                            {/* Actionable Daily Micro-Pledge Box */}
                            <div className="p-2.5 rounded-xl bg-emerald-900/95 text-white border border-amber-300/70 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[9px] font-bold text-amber-300 block">
                                  🎯 تحويل البصيرة إلى عمل اليوم (+30 XP):
                                </span>
                                <p className="text-[11px] font-bold text-white leading-snug">
                                  {story.actionPledgeAr}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleTogglePledge(story.id, story.actionPledgeAr)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 cursor-pointer transition-all ${
                                  isPledged
                                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                                    : 'bg-white/15 hover:bg-white/25 text-amber-200 border border-amber-300/50'
                                }`}
                              >
                                {isPledged ? '✔ عاهدت اليوم' : '🤝 ألتزم بها'}
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleInstantSaveStoryGem(story)}
                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-amber-50 text-amber-950 dark:text-amber-200 border border-amber-300 text-[10px] font-bold cursor-pointer"
                              >
                                💎 احفظ القاعدة في كشكولي
                              </button>
                              {linkedTrack && (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePlayTrack(linkedTrack)}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <span>استمع للمجلس الكامل</span>
                                  <Play className="w-3 h-3 fill-current" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                  </>
                ) : (
                  <>
                    {/* 🚑 SOS Spiritual First-Aid Capsules Strip */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 -mx-3.5 px-3.5">
                      {sosHeartCapsules.map((cap) => {
                        const isSelected = activeSosId === cap.id;
                        return (
                          <button
                            key={cap.id}
                            type="button"
                            onClick={() => {
                              soundSynth.playTactileClick();
                              haptic.vibrateLight();
                              setActiveSosId(isSelected ? null : cap.id);
                            }}
                            className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 transition-all cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-gradient-to-r from-rose-800 via-amber-800 to-emerald-900 text-white border-amber-300 shadow-md'
                                : 'bg-gradient-to-r from-rose-50 via-amber-50/90 to-white dark:from-rose-950/40 dark:via-zinc-900 dark:to-amber-950/30 text-zinc-900 dark:text-zinc-100 border-rose-300/80 dark:border-rose-500/40'
                            }`}
                          >
                            <span className="text-base">{cap.emoji}</span>
                            <div className="text-start leading-tight">
                              <div className="text-[10px] font-bold">{cap.titleAr}</div>
                              <div
                                className={`text-[9px] font-semibold ${
                                  isSelected ? 'text-amber-200' : 'text-rose-800 dark:text-amber-300'
                                }`}
                              >
                                {cap.subtitleAr}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Expandable SOS First-Aid Prescription Card */}
                    {activeSosId &&
                      (() => {
                        const capsule = sosHeartCapsules.find((c) => c.id === activeSosId);
                        if (!capsule) return null;
                        return (
                          <div className="p-3.5 rounded-[22px] bg-gradient-to-br from-rose-50 via-[#fffdf7] to-emerald-50/80 dark:from-zinc-900 dark:via-rose-950/30 dark:to-emerald-950/40 border-2 border-rose-400 dark:border-amber-400/70 shadow-md space-y-2.5 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-700 text-white text-[10px] font-bold">
                                🚑 روشتة إسعاف قلبي فوري • {capsule.titleAr}
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveSosId(null)}
                                className="text-xs font-bold text-zinc-500 hover:text-zinc-900 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-zinc-950/80 border border-amber-300/80 text-center">
                              <p className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-amber-200 leading-[2.1]">
                                {capsule.ayahOrHadithAr}
                              </p>
                            </div>

                            <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                              🩺 <span className="font-bold text-rose-900 dark:text-amber-300">التشخيص والعلاج:</span>{' '}
                              {capsule.diagnosisAr}
                            </p>

                            <div className="p-2 rounded-xl bg-emerald-900/90 text-amber-100 text-[10px] font-bold flex items-center justify-between gap-2">
                              <span>🌬️ {capsule.breathingCueAr}</span>
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping shrink-0" />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleLaunchSosCapsule(capsule)}
                              className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <span>▶️ شغّل جرعة الإسعاف الصوتي + أجواء السكينة تلقائياً</span>
                            </button>
                          </div>
                        );
                      })()}
                  </>
                )}
              </div>

              {/* 2. 🎡 4-Card Swipeable Hero Deck Header */}
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                  <span>✨</span>
                  <span>
                    {isAr
                      ? 'منصة البصيرة الذكية (اسحب يميناً ويساراً ⬅️➡️)'
                      : 'Interactive Insight Deck (Swipe ⬅️➡️)'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleSpinWheelOfWisdom}
                  className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-[10px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                >
                  <span className={isSpinningWheel ? 'animate-spin inline-block' : ''}>🎡</span>
                  <span>{isAr ? 'أدر شمسة البصيرة' : 'Spin Gem Wheel'}</span>
                </button>
              </div>

              <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-3.5 px-3.5 scroll-px-3.5">
                {/* Hero Card 1: 🕰️ Circadian Time Prescription + Interactive Wheel of Wisdom */}
                {circadianPrescription.track && (
                  <div className="snap-center shrink-0 w-[88%] sm:w-[360px] rounded-[24px] p-3.5 bg-gradient-to-br from-[#064e3b] via-[#0f766e] to-[#1e1b4b] text-white border-2 border-amber-400/90 shadow-[0_12px_28px_-8px_rgba(6,78,59,0.45)] flex flex-col justify-between gap-2.5 relative overflow-hidden">
                    <div className="pointer-events-none absolute -top-10 -end-10 w-28 h-28 rounded-full bg-amber-400/20 blur-xl" />

                    <div className="space-y-1.5 relative z-10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-bold shadow-2xs">
                          {circadianPrescription.isSurprise
                            ? '🎡 درّة مختارة من شمسة البصيرة'
                            : circadianPrescription.labelAr}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-200">
                          {circadianPrescription.track.durationFormatted}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                        {circadianPrescription.track.titleAr}
                      </h3>
                      <p className="text-[11px] font-bold text-amber-300 truncate">
                        {circadianPrescription.track.sheikhAr} • {circadianPrescription.track.badgeAr}
                      </p>
                      <p className="text-[10px] text-emerald-100/95 line-clamp-2 leading-relaxed">
                        💡{' '}
                        {circadianPrescription.track.takeawayAr ||
                          circadianPrescription.descAr}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/15 relative z-10">
                      <button
                        type="button"
                        onClick={handleSpinWheelOfWisdom}
                        className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-amber-200 border border-amber-300/40 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                      >
                        <span className={isSpinningWheel ? 'animate-spin inline-block' : ''}>🎡</span>
                        <span>{isAr ? 'فاجئني بدرّة أخرى' : 'Surprise Me'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePlayTrack(circadianPrescription.track)}
                        className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-[11px] font-bold flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-transform"
                      >
                        <span>{isAr ? 'تشغيل الآن' : 'Play Now'}</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Hero Card 2: 📻 Interactive FM Frequency Radio Tuner (مِذياع الحرمين والوعي التفاعلي) */}
                <div className="snap-center shrink-0 w-[88%] sm:w-[350px] rounded-[24px] p-3.5 bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/40 text-zinc-900 dark:text-white border-2 border-amber-400/85 shadow-sm flex flex-col justify-between gap-2 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      <span className="text-xs font-bold text-zinc-950 dark:text-white">
                        {isAr ? '📻 مِذياع الأثير الحيّ (24/7 FM)' : '📻 Live 24/7 FM Tuner'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-mono text-[10px] font-bold border border-emerald-300">
                      LIVE HD
                    </span>
                  </div>

                  {/* Interactive Golden FM Frequency Scale Visual */}
                  <div className="px-2.5 py-1.5 rounded-xl bg-zinc-950 text-amber-300 border border-amber-400/60 flex items-center justify-between font-mono text-[10px] relative overflow-hidden">
                    <span>88.0</span>
                    <span className="text-emerald-400 font-bold">98.2 FM 🕌</span>
                    <span>101.5</span>
                    <span className="text-amber-400 font-bold">104.8 FM 📖</span>
                    <span>108.0</span>
                  </div>

                  {/* 2x2 Tactile Radio Station Grid */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {quickRadioTracks.map((radioTrack, rIdx) => {
                      const freqs = ['98.2 FM', '101.5 FM', '104.8 FM', '107.3 FM'];
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
                          className={`p-2 rounded-xl border text-start transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                            isRadioPlaying
                              ? 'bg-emerald-700 text-white border-amber-400 shadow-xs ring-2 ring-amber-300/60'
                              : 'bg-white dark:bg-zinc-800 hover:bg-emerald-50/80 text-zinc-900 dark:text-zinc-100 border-amber-300/70 dark:border-zinc-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <div
                              className={`text-[9px] font-mono font-bold ${
                                isRadioPlaying ? 'text-amber-300' : 'text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {freqs[rIdx % freqs.length]}
                            </div>
                            <div className="text-[10px] font-bold truncate">
                              {radioTrack.titleAr.replace('إذاعة ', '').replace('بث ', '')}
                            </div>
                          </div>
                          {isRadioPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current text-amber-300 shrink-0" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hero Card 3: 🏆 Interactive 30-Second Insight Quiz (تحدي البصيرة السريع +50 XP) */}
                {(() => {
                  const quiz = insightQuizzes[quizIndex % insightQuizzes.length];
                  const isAnswered = selectedQuizOption !== null;
                  const isCorrect = selectedQuizOption === quiz.correctIdx;
                  return (
                    <div className="snap-center shrink-0 w-[88%] sm:w-[360px] rounded-[24px] p-3.5 bg-gradient-to-br from-[#fffbeb] via-white to-[#ecfdf5] dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/50 text-zinc-950 dark:text-white border-2 border-emerald-400/85 shadow-sm flex flex-col justify-between gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                          🏆 تحدي البصيرة التفاعلي (+50 XP)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            soundSynth.playTactileClick();
                            setSelectedQuizOption(null);
                            setQuizIndex((prev) => (prev + 1) % insightQuizzes.length);
                          }}
                          className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
                        >
                          سؤال آخر ↻
                        </button>
                      </div>

                      <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                        {quiz.questionAr}
                      </p>

                      <div className="space-y-1">
                        {quiz.optionsAr.map((opt, oIdx) => {
                          const isThisSelected = selectedQuizOption === oIdx;
                          const isThisCorrect = oIdx === quiz.correctIdx;
                          let btnClass =
                            'bg-white dark:bg-zinc-800 hover:bg-amber-50/70 text-zinc-800 dark:text-zinc-200 border-amber-300/80 dark:border-zinc-700';
                          if (isAnswered) {
                            if (isThisCorrect) {
                              btnClass = 'bg-emerald-600 text-white border-emerald-700 font-bold';
                            } else if (isThisSelected) {
                              btnClass = 'bg-rose-100 text-rose-900 border-rose-400';
                            }
                          }
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => {
                                soundSynth.playTactileClick();
                                setSelectedQuizOption(oIdx);
                                if (oIdx === quiz.correctIdx) {
                                  haptic.vibrateMedium();
                                  onRewardToast?.('🏆 إجابة سديدة! (+50 XP في رصيد البصيرة المعرفية)');
                                } else {
                                  haptic.vibrateLight();
                                }
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-xl border text-start text-[10px] font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 ${btnClass}`}
                            >
                              <span className="line-clamp-1">{opt}</span>
                              {isAnswered && isThisCorrect && <span>✔</span>}
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <div className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between gap-2 pt-0.5">
                          <span className="truncate">
                            {isCorrect ? '✨ ' : '💡 '}
                            {quiz.explanationAr}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuizOption(null);
                              setQuizIndex((prev) => (prev + 1) % insightQuizzes.length);
                            }}
                            className="px-2 py-0.5 rounded-full bg-amber-300 text-zinc-950 shrink-0 cursor-pointer"
                          >
                            التالي ⬅️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Hero Card 4: 🏛️ Live Mastery Rank & 1-Tap Instant Resume Card */}
                <div className="snap-center shrink-0 w-[88%] sm:w-[340px] rounded-[24px] p-3.5 bg-gradient-to-br from-indigo-950 via-zinc-900 to-emerald-950 text-white border-2 border-indigo-400/70 shadow-sm flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-300/40 text-amber-200 text-[10px] font-bold">
                      {completedTrackIds.length < 3
                        ? '🌱 طالب وعي مجتهد'
                        : completedTrackIds.length < 8
                        ? '🛡️ بصيرة راسخة'
                        : '👑 فقيه النفس والوعي'}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-300 tabular-nums">
                      🎓 {completedTrackIds.length} مجالس مكتملة
                    </span>
                  </div>

                  {audioState.resumePoint ? (
                    <div className="p-2.5 rounded-xl bg-white/10 border border-amber-300/40 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-amber-200 font-bold">
                        <span>⏯️ آخر مجلس توقفت عنده:</span>
                        {audioState.resumePoint.currentTime > 5 && (
                          <span className="font-mono px-1.5 py-0.2 rounded bg-black/30">
                            {formatSeconds(audioState.resumePoint.currentTime)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white truncate">
                        {audioState.resumePoint.episodeTitleAr || audioState.resumePoint.channelTitleAr}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-indigo-100/90 leading-relaxed">
                      {isAr
                        ? 'كل محاضرة تستمع إليها يُحفظ موضع توقفك فيها تلقائياً بالثانية، مع إمكانية تدوين الفوائد بالوقت.'
                        : 'Every lecture automatically saves your exact resume timestamp.'}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('paths')}
                      className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold cursor-pointer"
                    >
                      {isAr ? '🎓 مسارات الأكاديمية' : '🎓 Academy Paths'}
                    </button>
                    {audioState.resumePoint && (
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateMedium();
                          gymFaithAudio.resumeLastPlayback();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[11px] font-bold cursor-pointer shadow-sm"
                      >
                        {isAr ? 'متابعة الاستماع ▶️' : 'Resume ▶️'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. Sticky Frosted-Glass Search & Compact Category Filter Strip (Sticks cleanly while scrolling) */}
          <div className="sticky top-0 z-20 px-3.5 py-2 bg-[#faf7f0]/92 dark:bg-zinc-950/92 backdrop-blur-xl border-b border-amber-300/70 dark:border-zinc-800 space-y-1.5 shadow-2xs">
            {/* Compact Search Row + Mood Compass Toggle */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? 'ابحث عن درس أو شيخ (أيمن عبد الرحيم، السيد، القنيبي، الطريفي، السكران...)'
                      : 'Search lecture, scholar, recitation...'
                  }
                  className="w-full h-8 ps-8 pe-7 rounded-xl bg-white dark:bg-zinc-900 border border-amber-300/80 dark:border-zinc-700 focus:border-emerald-600 text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none transition-colors shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute end-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {viewMode === 'tracks' && (
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setShowMoodCompassFilter((prev) => !prev);
                  }}
                  className={`h-8 px-2.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                    showMoodCompassFilter
                      ? 'bg-emerald-700 text-white border-amber-300 shadow-2xs'
                      : 'bg-white dark:bg-zinc-900 text-emerald-900 dark:text-emerald-300 border-amber-300/80 dark:border-zinc-700'
                  }`}
                >
                  <span>🌿</span>
                  <span>{isAr ? 'بوصلة القلب' : 'Moods'}</span>
                </button>
              )}
            </div>

            {/* Optional Expandable Spiritual Mood Compass Pills */}
            {viewMode === 'tracks' && showMoodCompassFilter && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-3.5 px-3.5 animate-in fade-in duration-150">
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
                      className={`px-2.5 py-1 rounded-xl border text-start transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isSelected ? mood.activeClass : mood.idleClass
                      }`}
                    >
                      <span className="text-sm leading-none">{mood.emoji}</span>
                      <span className="text-[10px] font-bold whitespace-nowrap">{mood.titleAr}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Horizontal Category Pills (shown in 'tracks' mode) */}
            {viewMode === 'tracks' ? (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 scroll-px-3.5 snap-x">
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
                      className={`snap-start h-7 px-2.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 cursor-pointer border ${
                        isActive
                          ? 'bg-zinc-900 dark:bg-amber-400 text-amber-300 dark:text-zinc-950 border-zinc-900 dark:border-amber-400 shadow-2xs'
                          : 'bg-white dark:bg-zinc-800/90 hover:bg-amber-50/80 text-zinc-800 dark:text-zinc-200 border-amber-300/70 dark:border-zinc-700'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full tabular-nums ${
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
            ) : (
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 dark:text-emerald-300 px-0.5">
                <span>▶️ ٢٤ محاضرة وسلسلة يوتيوب مختارة بتقييم 5.0⭐ (تعمل بالخلفية أو بالفيديو)</span>
                <span className="font-mono">{filteredTracks.length}</span>
              </div>
            )}
          </div>

          {/* C. Color-Coded Tactile 3D Bento Track Cards */}
          <div className="p-3.5 space-y-2.5">
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

                    {track.category !== 'radio' && (
                      <div className="space-y-2 pt-1 border-t border-amber-200/50 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar pb-0.5">
                          <div className="flex items-center gap-1 shrink-0">
                            {trackProgressMap[track.id] > 15 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  soundSynth.playTactileClick();
                                  haptic.vibrateMedium();
                                  const savedSec = trackProgressMap[track.id];
                                  if (!isPlayingThis) {
                                    handleTogglePlayTrack(track);
                                    setTimeout(() => gymFaithAudio.seekTo(savedSec), 450);
                                  } else {
                                    gymFaithAudio.seekTo(savedSec);
                                  }
                                  onRewardToast?.(`⏪ تم استئناف المجلس من الدقيقة ${formatSeconds(savedSec)}`);
                                }}
                                className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-400 text-zinc-950 border border-amber-300 shadow-2xs cursor-pointer shrink-0 font-mono"
                                title="استئناف الاستماع من آخر موضع توقفت عنده"
                              >
                                ⏪ {formatSeconds(trackProgressMap[track.id])}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                soundSynth.playTactileClick();
                                setGemDraftTrack(track);
                              }}
                              className={`px-2 py-1 rounded-full text-[10px] font-bold border cursor-pointer shrink-0 transition-colors ${
                                isPlayingThis
                                  ? 'bg-white/15 hover:bg-white/25 text-white border-white/25'
                                  : 'bg-white/90 dark:bg-zinc-800 hover:bg-amber-100 text-zinc-800 dark:text-zinc-200 border-amber-300/70 dark:border-zinc-700'
                              }`}
                            >
                              {isAr ? '✍️ فائدة' : '✍️ Note'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                soundSynth.playTactileClick();
                                haptic.vibrateLight();
                                setExpandedMindMapTrackId((prev) => (prev === track.id ? null : track.id));
                              }}
                              className={`px-2 py-1 rounded-full text-[10px] font-bold border cursor-pointer shrink-0 transition-colors ${
                                expandedMindMapTrackId === track.id
                                  ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-xs'
                                  : isPlayingThis
                                  ? 'bg-white/15 text-amber-200 border-white/25'
                                  : 'bg-amber-50/90 dark:bg-zinc-800 text-amber-950 dark:text-amber-200 border-amber-300/70 dark:border-zinc-700'
                              }`}
                            >
                              {isAr ? '🗺️ التشجير' : '🗺️ Mind-Map'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleToggleQueueTrack(track.id, e)}
                              className={`px-2 py-1 rounded-full text-[10px] font-bold border cursor-pointer shrink-0 transition-colors ${
                                upNextQueueIds.includes(track.id)
                                  ? 'bg-indigo-600 text-white border-amber-300 shadow-xs'
                                  : isPlayingThis
                                  ? 'bg-white/15 text-emerald-100 border-white/25'
                                  : 'bg-indigo-50/90 dark:bg-zinc-800 text-indigo-950 dark:text-indigo-200 border-indigo-300/70 dark:border-zinc-700'
                              }`}
                            >
                              {upNextQueueIds.includes(track.id)
                                ? isAr
                                  ? '🚗 بالطابور ✓'
                                  : 'Queued ✓'
                                : isAr
                                ? '➕ للطابور'
                                : '+ Queue'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => toggleCompletedTrack(track.id, e)}
                              className={`px-2 py-1 rounded-full text-[10px] font-bold border cursor-pointer shrink-0 transition-colors ${
                                isDone
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : isPlayingThis
                                  ? 'bg-white/15 text-amber-200 border-white/25'
                                  : 'bg-emerald-50/90 dark:bg-zinc-800 text-emerald-900 dark:text-emerald-300 border-emerald-300/70 dark:border-zinc-700'
                              }`}
                            >
                              {isDone ? (isAr ? '✔ أتممت' : '✔ Done') : isAr ? '🎓 إتمام' : 'Mark Done'}
                            </button>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                soundSynth.playTactileClick();
                                haptic.vibrateLight();
                                setManuscriptPreviewTrack(track);
                              }}
                              className={`px-2 py-1 rounded-full text-[10px] font-bold border cursor-pointer shrink-0 transition-colors ${
                                isPlayingThis
                                  ? 'bg-amber-400 text-zinc-950 border-amber-200 shadow-xs'
                                  : 'bg-gradient-to-r from-amber-100 to-emerald-50 dark:from-amber-950/60 dark:to-emerald-950/50 text-amber-950 dark:text-amber-200 border-amber-400/80'
                              }`}
                            >
                              {isAr ? '🖼️ مخطوطة' : '🖼️ Poster'}
                            </button>
                          </div>
                        </div>

                        {/* 🗺️ Interactive 3-Node Visual Mind-Map Drawer (التشجير العقلي البصري للمحاضرة) */}
                        {expandedMindMapTrackId === track.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`p-2.5 rounded-2xl border space-y-2 animate-in fade-in duration-150 ${
                              isPlayingThis
                                ? 'bg-black/30 border-amber-300/40 text-white'
                                : 'bg-gradient-to-br from-amber-50/95 via-white to-emerald-50/80 dark:from-zinc-950 dark:to-emerald-950/30 border-amber-300/80 dark:border-amber-500/40 text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                <span>🗺️</span>
                                <span>خريطة التشجير العقلي للمجلس (٣ محاور متسلسلة)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setExpandedMindMapTrackId(null)}
                                className="text-[10px] font-bold opacity-75 hover:opacity-100 cursor-pointer"
                              >
                                إغلاق ✕
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                              {getTrackVisualMindMap(track).map((node, idx) => (
                                <div
                                  key={idx}
                                  className={`p-2 rounded-xl border ${
                                    isPlayingThis
                                      ? 'bg-white/10 border-white/20'
                                      : 'bg-white/95 dark:bg-zinc-900/90 border-amber-200/80 dark:border-zinc-800 shadow-2xs'
                                  }`}
                                >
                                  <div className="text-[10px] font-bold text-emerald-700 dark:text-amber-300 mb-0.5 flex items-center gap-1">
                                    <span>{node.icon}</span>
                                    <span>{node.stage}</span>
                                  </div>
                                  <p className="text-[10px] leading-relaxed font-medium opacity-90">
                                    {node.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Scholars & Full Series Encyclopedia View */
        <div
          className={`flex-1 overflow-y-auto p-3.5 space-y-3 overscroll-contain relative z-10 ${
            hasActiveStudioDeck ? 'pb-36' : 'pb-8'
          }`}
        >
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

      {/* 5. Unified Collapsible Bottom Studio Dock (Handles Both Audio & YouTube without blocking the screen!) */}
      {hasActiveStudioDeck && (
        <div className="absolute bottom-2.5 inset-x-3 sm:inset-x-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-2 border-emerald-500/70 dark:border-emerald-500/40 rounded-[22px] p-2.5 sm:p-3 shadow-[0_18px_45px_rgba(6,78,59,0.3)] flex flex-col gap-1.5 animate-in slide-in-from-bottom-4 duration-200 z-30 overflow-hidden">
          {/* Thin Live Golden Progress Ribbon along the top edge when collapsed */}
          {!isBottomDeckExpanded && audioState.duration > 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-emerald-100 dark:bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-teal-500 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((audioState.currentTime / Math.max(1, audioState.duration)) * 100))}%`,
                }}
              />
            </div>
          )}

          {/* Error Banner if Stream Failed */}
          {audioState.hasError && audioState.errorMessage && (
            <div className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-950 border border-rose-300 text-[10px] font-bold flex items-center justify-between gap-2">
              <span className="truncate">{audioState.errorMessage}</span>
              <button
                type="button"
                onClick={() => gymFaithAudio.togglePlay()}
                className="px-2 py-0.5 rounded-full bg-rose-700 text-white text-[10px] font-bold shrink-0 cursor-pointer"
              >
                {isAr ? 'إعادة' : 'Retry'}
              </button>
            </div>
          )}

          {/* Expandable Scrubber + Semantic Chapter Milestones + Studio Utility & Queue Tray */}
          {isBottomDeckExpanded && (
            <div className="space-y-2 pt-0.5 pb-1 border-b border-emerald-200/70 dark:border-zinc-800 animate-in fade-in duration-150">
              {audioState.duration > 0 && (
                <>
                  <div className="flex items-center gap-2 px-1" dir="ltr">
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

                  {/* 📑 Track-Aware Semantic Chapter Milestones (فصول ومحطات المحاضرة الذكية) */}
                  {audioState.duration > 120 &&
                    (() => {
                      const activeTrackObj =
                        allCombinedTracks.find(
                          (t) => t.id === playingTrackId || t.titleAr === audioState.currentTitleAr
                        ) || allCombinedTracks[0];
                      const chapters = activeTrackObj
                        ? getTrackVisualMindMap(activeTrackObj)
                        : [];
                      const progressRatio =
                        audioState.currentTime / Math.max(1, audioState.duration);
                      const chapterTargets = [
                        0,
                        Math.floor(audioState.duration * 0.35),
                        Math.floor(audioState.duration * 0.7),
                      ];

                      return (
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1" dir="rtl">
                          <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 shrink-0">
                            📑 فصول المجلس:
                          </span>
                          {chapters.map((ch, idx) => {
                            const targetSec = chapterTargets[idx] ?? 0;
                            const isCurrentChapter =
                              (idx === 0 && progressRatio < 0.35) ||
                              (idx === 1 && progressRatio >= 0.35 && progressRatio < 0.7) ||
                              (idx === 2 && progressRatio >= 0.7);

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  soundSynth.playTactileClick();
                                  haptic.vibrateLight();
                                  gymFaithAudio.seekTo(targetSec);
                                  onRewardToast?.(`📑 ${ch.stage}: ${ch.text}`);
                                }}
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 cursor-pointer transition-all ${
                                  isCurrentChapter
                                    ? 'bg-emerald-700 text-amber-200 border-amber-400 shadow-2xs'
                                    : 'bg-amber-50/90 dark:bg-zinc-800 hover:bg-emerald-50 text-emerald-950 dark:text-emerald-200 border-amber-300/80'
                                }`}
                              >
                                {ch.icon} {ch.stage} ({formatSeconds(targetSec)})
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                </>
              )}

              {/* Secondary Studio Utility Tray (De-crowds primary mobile bar!) */}
              <div className="flex items-center justify-between gap-1.5 px-1 flex-wrap" dir="rtl">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSpeedCycle}
                    className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-950 dark:text-amber-200 font-mono text-[10px] font-bold border border-amber-300/80 cursor-pointer tabular-nums"
                  >
                    ⚡ السرعة: {audioState.playbackRate}x
                  </button>

                  <button
                    type="button"
                    onClick={() => gymFaithAudio.seekBy(15)}
                    className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer"
                  >
                    +15 ثانية ⏩
                  </button>

                  {audioState.mediaType === 'youtube' && audioState.youtubeVideoId && (
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        haptic.vibrateLight();
                        gymFaithAudio.toggleAudioOnlyMode();
                      }}
                      className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-zinc-800 hover:bg-emerald-50 text-emerald-950 dark:text-amber-200 border border-amber-300/80 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {audioState.isAudioOnlyMode ? (
                        <>
                          <Tv className="w-3 h-3 text-amber-600" />
                          <span>إظهار الفيديو</span>
                        </>
                      ) : (
                        <>
                          <Headphones className="w-3 h-3 text-emerald-600" />
                          <span>صوت فقط</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePlayNextInQueue()}
                    className="px-2.5 py-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold cursor-pointer shadow-2xs"
                  >
                    ⏭️ المجلس التالي {upNextQueueIds.length > 0 ? `(${upNextQueueIds.length})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      setIsZenModeOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-700 to-teal-700 text-amber-200 border border-amber-300/80 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                  >
                    <span>✨</span>
                    <span>خلوة التدبر</span>
                  </button>
                </div>
              </div>

              {/* 🚗 Smart Up-Next Queue Strip when tracks are queued */}
              {upNextQueueIds.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 pt-0.5" dir="rtl">
                  <span className="text-[9px] font-bold text-indigo-800 dark:text-indigo-300 shrink-0">
                    🚗 طابور المجلس التلقائي:
                  </span>
                  {upNextQueueIds.map((qid, idx) => {
                    const qTrack = allCombinedTracks.find((t) => t.id === qid);
                    if (!qTrack) return null;
                    return (
                      <span
                        key={qid}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 border border-indigo-300/70 text-[9px] font-bold shrink-0"
                      >
                        <span>
                          {idx + 1}. {qTrack.titleAr}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleQueueTrack(qid)}
                          className="text-rose-600 hover:text-rose-800 font-bold ms-0.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sleek Ergonomic Primary Transport Row (Uncrowded 360px Mobile Layout) */}
          <div className="flex items-center justify-between gap-2">
            <div
              onClick={() => setIsBottomDeckExpanded((prev) => !prev)}
              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs border border-amber-300/60 relative overflow-hidden">
                {audioState.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : audioState.isPlaying ? (
                  <div className="flex items-end gap-[2px] h-3.5">
                    {[6, 12, 8, 13].map((h, idx) => (
                      <span
                        key={idx}
                        className="w-[2px] rounded-full bg-amber-300 wave-bar wave-bar-play"
                        style={{ height: `${h}px`, '--d': `${0.5 + idx * 0.08}s` } as React.CSSProperties}
                      />
                    ))}
                  </div>
                ) : (
                  <Volume2 className="w-4 h-4 stroke-[2.2]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs font-bold text-zinc-950 dark:text-white truncate">
                  {audioState.currentTitleAr || (isAr ? 'مقطع صوتي' : 'Audio Track')}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                  <span className="truncate max-w-[115px] sm:max-w-[200px]">
                    {audioState.currentSheikhAr || (isAr ? 'أثير مضمار' : 'Midmar Audio')}
                  </span>
                  {audioState.duration > 0 && (
                    <span className="font-mono text-[9px] text-amber-800 dark:text-amber-300 tabular-nums shrink-0">
                      • {formatSeconds(audioState.currentTime)}
                    </span>
                  )}
                  {upNextQueueIds.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 text-[9px] font-bold shrink-0">
                      🚗 +{upNextQueueIds.length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Clean Primary Studio Transport Controls */}
            <div dir="ltr" className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => gymFaithAudio.seekBy(-15)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer"
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
                onClick={() => handleOneTapGoldenBookmark()}
                className="h-8 px-2.5 rounded-full bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-950 dark:text-amber-200 border border-amber-300/80 text-[10px] font-bold cursor-pointer flex items-center gap-0.5"
                title={isAr ? 'ختم اللحظة الذهبية بضغطة واحدة 🔖' : '1-Tap Golden Timestamp Bookmark 🔖'}
              >
                <span>🔖</span>
                <span className="hidden xs:inline">{isAr ? 'ختم' : 'Mark'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setIsBottomDeckExpanded((prev) => !prev);
                }}
                className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-zinc-800 text-emerald-800 dark:text-emerald-300 border border-emerald-300/70 flex items-center justify-center cursor-pointer"
                title={isBottomDeckExpanded ? 'تصغير الشريط' : 'إظهار فصول المجلس وأدوات الاستوديو'}
              >
                {isBottomDeckExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  gymFaithAudio.stop();
                  setPlayingTrackId(null);
                }}
                aria-label={isAr ? 'إيقاف الصوت' : 'Stop Audio'}
                className="w-7 h-7 rounded-full text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 flex items-center justify-center cursor-pointer"
                title={isAr ? 'إيقاف' : 'Stop'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* ✨ Full-Screen Mamluk Shamsa Zen Contemplation Mode (وضع خلوة التدبر والتركيز العميق) */}
            {isZenModeOpen && (
              <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-[90] flex flex-col items-center justify-between p-5 bg-gradient-to-b from-[#042f2e] via-[#064e3b] to-[#1e1b4b] text-white animate-in fade-in duration-200 overflow-y-auto"
              >
          <div className="pointer-events-none absolute inset-0 bg-islamic-pattern opacity-10" />

          {/* Top Bar */}
          <div className="w-full max-w-md flex items-center justify-between gap-2 relative z-10 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-200 text-xs font-bold">
                ✨ خلوة التدبر
              </span>
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setIsDrivingHudMode((prev) => !prev);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                  isDrivingHudMode
                    ? 'bg-amber-400 text-zinc-950 border-amber-200 shadow-md'
                    : 'bg-white/15 hover:bg-white/25 text-amber-100 border-white/25'
                }`}
              >
                {isDrivingHudMode ? '🧘 وضع الخلوة العادي' : '🚗 وضع القيادة والسعي'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsDrivingHudMode(false);
                setIsZenModeOpen(false);
              }}
              className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
            >
              {isAr ? 'العودة للاستوديو ✕' : 'Exit Zen ✕'}
            </button>
          </div>

          {/* Center Breathing Mamluk Shamsa Mandala OR Giant Hands-Free Driving HUD */}
          {isDrivingHudMode ? (
            <div className="my-auto py-3 flex flex-col items-center text-center max-w-md w-full space-y-4 relative z-10">
              <div className="w-full p-3.5 rounded-3xl bg-black/35 border border-amber-400/40 space-y-1">
                <span className="text-xs font-bold text-amber-300 block">
                  🚗 {audioState.currentSheikhAr || 'وضع القيادة والسعي الآمن'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2">
                  {audioState.currentTitleAr || 'اختر مجلساً للبدء'}
                </h3>
                {audioState.duration > 0 && (
                  <p className="text-sm font-mono font-bold text-emerald-300 pt-1" dir="ltr">
                    {formatSeconds(audioState.currentTime)} / {formatSeconds(audioState.duration)}
                  </p>
                )}
              </div>

              {/* Giant 2x2 Hands-Free Tactile Grid for Safe Eyes-Free Operation */}
              <div className="w-full grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    gymFaithAudio.togglePlay();
                  }}
                  className="min-h-[104px] rounded-3xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold flex flex-col items-center justify-center gap-1.5 shadow-xl cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="text-3xl">{audioState.isPlaying ? '⏸️' : '▶️'}</span>
                  <span className="text-sm font-bold">
                    {audioState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل المجلس'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOneTapGoldenBookmark()}
                  className="min-h-[104px] rounded-3xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold flex flex-col items-center justify-center gap-1.5 shadow-xl cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="text-3xl">🔖</span>
                  <span className="text-sm font-bold">ختم اللحظة الذهبية</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    if (audioState.duration > 0) {
                      gymFaithAudio.seekTo(Math.max(0, audioState.currentTime - 15));
                    }
                  }}
                  className="min-h-[88px] rounded-3xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="text-2xl">⏪ -15s</span>
                  <span className="text-xs text-amber-200">إرجاع ١٥ ثانية</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    if (upNextQueueIds.length > 0) {
                      handlePlayNextInQueue();
                    } else if (audioState.duration > 0) {
                      gymFaithAudio.seekTo(Math.min(audioState.duration, audioState.currentTime + 30));
                    }
                  }}
                  className="min-h-[88px] rounded-3xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="text-2xl">{upNextQueueIds.length > 0 ? '⏭️' : '⏩ +30s'}</span>
                  <span className="text-xs text-amber-200">
                    {upNextQueueIds.length > 0 ? 'المجلس التالي بالطابور' : 'تقديم ٣٠ ثانية'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="my-auto py-4 flex flex-col items-center text-center max-w-md w-full space-y-4 relative z-10">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                <span className="pointer-events-none absolute -inset-3 rounded-full border-2 border-amber-300/40 animate-ping opacity-30" />
                <span className="pointer-events-none absolute -inset-1.5 rounded-full border border-emerald-300/50 animate-pulse" />
                <svg
                  viewBox="0 0 100 100"
                  className={`w-full h-full drop-shadow-[0_14px_35px_rgba(251,191,36,0.35)] ${
                    audioState.isPlaying ? 'animate-[spin_14s_linear_infinite]' : ''
                  }`}
                >
                  <circle cx="50" cy="50" r="48" fill="#064e3b" stroke="#fbbf24" strokeWidth="2.5" />
                  <circle cx="50" cy="50" r="39" fill="none" stroke="#fde68a" strokeWidth="0.9" strokeDasharray="4 3" />
                  <rect x="24" y="24" width="52" height="52" rx="5" fill="none" stroke="#fbbf24" strokeWidth="1.6" />
                  <rect x="24" y="24" width="52" height="52" rx="5" fill="none" stroke="#fbbf24" strokeWidth="1.6" transform="rotate(45 50 50)" />
                  <circle cx="50" cy="50" r="16" fill="#fef3c7" stroke="#d97706" strokeWidth="2.5" />
                </svg>
                <button
                  type="button"
                  onClick={() => gymFaithAudio.togglePlay()}
                  className="absolute inset-0 flex items-center justify-center text-emerald-950 cursor-pointer"
                >
                  {audioState.isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ms-0.5" />
                  )}
                </button>
              </div>

              <div className="space-y-1 px-2">
                <span className="text-xs font-bold text-amber-300 block">
                  {audioState.currentSheikhAr || 'محراب الوعي'}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {audioState.currentTitleAr || 'اختر مجلساً للبدء'}
                </h3>
              </div>

              {/* Ambient Nature Soundscape Selector inside Zen Mode */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {[
                  { id: 'off', label: '🔇 صمت الخلوة' },
                  { id: 'rain', label: '🌧️ مطر السكينة' },
                  { id: 'breeze', label: '🍃 نسيم الفجر' },
                  { id: 'warmth', label: '🕯️ دفء المحراب' },
                ].map((amb) => (
                  <button
                    key={amb.id}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setAmbientMode(amb.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                      ambientMode === amb.id
                        ? 'bg-amber-400 text-zinc-950 border-amber-200 shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-emerald-100 border-white/20'
                    }`}
                  >
                    {amb.label}
                  </button>
                ))}
              </div>

              {/* Scrubber & Quick Note inside Zen Mode */}
              {audioState.duration > 0 && (
                <div className="w-full space-y-2 pt-2">
                  <div className="flex items-center gap-2.5" dir="ltr">
                    <span className="text-xs font-mono text-amber-200 tabular-nums">
                      {formatSeconds(audioState.currentTime)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(1, audioState.duration)}
                      value={Math.min(audioState.currentTime, audioState.duration)}
                      onChange={(e) => gymFaithAudio.seekTo(Number(e.target.value))}
                      className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-amber-400"
                    />
                    <span className="text-xs font-mono text-amber-200 tabular-nums">
                      {formatSeconds(audioState.duration)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Zen Controls */}
          <div className="w-full max-w-md flex items-center justify-between gap-1.5 flex-wrap relative z-10">
            <button
              type="button"
              onClick={() => handleOneTapGoldenBookmark()}
              className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold cursor-pointer shadow-md"
            >
              🔖 ختم اللحظة بضغطة
            </button>
            <button
              type="button"
              onClick={() => {
                setIsZenModeOpen(false);
                const curTrack =
                  allCombinedTracks.find(
                    (t) => t.id === playingTrackId || t.titleAr === audioState.currentTitleAr
                  ) || allCombinedTracks[0];
                if (curTrack) setGemDraftTrack(curTrack);
              }}
              className="px-3.5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold cursor-pointer shadow-md"
            >
              ✍️ دوّن أو أملِ بالصوت
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSleepModalOpen(true);
              }}
              className="px-3 py-2 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold cursor-pointer"
            >
              🌙 مؤقت النوم
            </button>
          </div>
        </div>
      )}

      {/* 🖼️ Royal Illuminated Manuscript Card Generator Modal (مُولِّد بطاقة المخطوطة المملوكية المصوّرة) */}
      {manuscriptPreviewTrack && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setManuscriptPreviewTrack(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-3"
          >
            {/* Theme Selector Pills */}
            <div className="flex items-center justify-between gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-amber-400/50">
              {[
                { id: 'parchment', label: '📜 رقّ المدينة المذهّب' },
                { id: 'emerald', label: '🌲 زمرد المحراب الملكي' },
                { id: 'sapphire', label: '🌌 ياقوت السحر والليل' },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setManuscriptTheme(th.id as 'parchment' | 'emerald' | 'sapphire');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
                    manuscriptTheme === th.id
                      ? 'bg-amber-400 text-zinc-950 shadow-sm'
                      : 'text-amber-100 hover:bg-white/10'
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>

            {/* The Illuminated Manuscript Poster Frame */}
            <div
              className={`relative overflow-hidden rounded-[28px] p-5 border-2 shadow-2xl space-y-3.5 text-center transition-all ${
                manuscriptTheme === 'parchment'
                  ? 'bg-gradient-to-b from-[#fdf8ed] via-[#f7edd4] to-[#efe0b9] text-zinc-950 border-amber-500'
                  : manuscriptTheme === 'emerald'
                  ? 'bg-gradient-to-b from-[#042f2e] via-[#064e3b] to-[#022c22] text-white border-amber-400'
                  : 'bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#090d16] text-white border-amber-400'
              }`}
            >
              <div className="pointer-events-none absolute inset-0 bg-islamic-pattern opacity-10" />
              <div className="pointer-events-none absolute inset-2.5 rounded-[20px] border border-amber-400/45" />

              {/* Top Shamsa Seal */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <span
                  className={`px-3 py-0.5 rounded-full text-[10px] font-bold border ${
                    manuscriptTheme === 'parchment'
                      ? 'bg-amber-900/10 text-amber-950 border-amber-600/40'
                      : 'bg-amber-400/20 text-amber-200 border-amber-300/40'
                  }`}
                >
                  🏛️ مخطوطة محراب البصيرة • مضمار
                </span>
                <h3
                  className={`text-base font-bold leading-snug pt-1 ${
                    manuscriptTheme === 'parchment' ? 'text-emerald-950' : 'text-amber-300'
                  }`}
                >
                  «{manuscriptPreviewTrack.titleAr}»
                </h3>
                <span
                  className={`text-xs font-bold ${
                    manuscriptTheme === 'parchment' ? 'text-amber-900' : 'text-emerald-200'
                  }`}
                >
                  🎙️ {manuscriptPreviewTrack.sheikhAr}
                </span>
              </div>

              {/* Golden Rule Quote Box */}
              <div
                className={`relative z-10 p-3.5 rounded-2xl border text-xs font-bold leading-relaxed ${
                  manuscriptTheme === 'parchment'
                    ? 'bg-white/80 border-amber-400/80 text-zinc-900 shadow-xs'
                    : 'bg-black/25 border-amber-300/35 text-amber-50'
                }`}
              >
                💎 {manuscriptPreviewTrack.takeawayAr || 'مجلس علمي وتزكوي مؤصل يحيي القلب ويرفع الهمة'}
              </div>

              {/* 3-Pillar Mini Summary inside Manuscript */}
              <div className="relative z-10 grid grid-cols-3 gap-1.5 text-right">
                {getTrackVisualMindMap(manuscriptPreviewTrack).map((node, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border ${
                      manuscriptTheme === 'parchment'
                        ? 'bg-amber-50/90 border-amber-300/80 text-zinc-900'
                        : 'bg-white/10 border-white/15 text-white'
                    }`}
                  >
                    <div
                      className={`text-[9px] font-bold mb-0.5 ${
                        manuscriptTheme === 'parchment' ? 'text-emerald-800' : 'text-amber-300'
                      }`}
                    >
                      {node.icon} {node.stage}
                    </div>
                    <p className="text-[9px] leading-snug opacity-90 line-clamp-3">{node.text}</p>
                  </div>
                ))}
              </div>

              {/* Action Pledge Footer */}
              <div
                className={`relative z-10 p-2 rounded-xl text-[10px] font-bold ${
                  manuscriptTheme === 'parchment'
                    ? 'bg-emerald-900 text-amber-100'
                    : 'bg-amber-400/20 text-amber-200 border border-amber-300/40'
                }`}
              >
                🎯 الواجب العملي: {getTrackDailyActionPledge(manuscriptPreviewTrack)}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  handleShareDawahCard(manuscriptPreviewTrack, e);
                  setManuscriptPreviewTrack(null);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold cursor-pointer shadow-lg"
              >
                📋 نسخ ومشاركة المخطوطة الدعوية
              </button>
              <button
                type="button"
                onClick={() => setManuscriptPreviewTrack(null)}
                className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📜 Interactive Mamluk Academy Path Mastery Ijazah Scroll Modal (وثيقة وإجازة المسار المنهجي) */}
      {ijazahPreviewPath && (() => {
        const ijazahTracks = ijazahPreviewPath.trackIds
          .map((id) => allCombinedTracks.find((t) => t.id === id))
          .filter((t): t is MobileAudioTrack => Boolean(t));
        const doneCount = ijazahTracks.filter((t) => completedTrackIds.includes(t.id)).length;
        const totalCount = ijazahTracks.length;
        return (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setIjazahPreviewPath(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm space-y-3"
            >
              <div className="relative overflow-hidden rounded-[28px] p-5 border-2 border-amber-500 bg-gradient-to-b from-[#fdf8ed] via-[#f7edd4] to-[#efe0b9] text-zinc-950 shadow-2xl space-y-3.5 text-center">
                <div className="pointer-events-none absolute inset-0 bg-islamic-pattern opacity-10" />
                <div className="pointer-events-none absolute inset-2.5 rounded-[20px] border border-amber-500/45" />

                <div className="relative z-10 flex flex-col items-center gap-1">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900 text-amber-200 border border-amber-400/50">
                    📜 وثيقة إجازة ومدارسة منهجية • مضمار
                  </span>
                  <h3 className="text-base font-bold text-emerald-950 pt-1">
                    {ijazahPreviewPath.emoji} {ijazahPreviewPath.titleAr}
                  </h3>
                  <p className="text-[11px] font-medium text-amber-900 leading-relaxed">
                    {ijazahPreviewPath.subtitleAr}
                  </p>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-600/40 text-amber-950 text-[10px] font-bold mt-0.5">
                    نسبة الإتمام المنهجي: {doneCount}/{totalCount} (
                    {Math.round((doneCount / Math.max(1, totalCount)) * 100)}%)
                  </span>
                </div>

                <div className="relative z-10 space-y-1.5 text-right max-h-52 overflow-y-auto pr-1">
                  {ijazahTracks.map((tr, idx) => {
                    const isDone = completedTrackIds.includes(tr.id);
                    return (
                      <div
                        key={tr.id}
                        className={`p-2 rounded-xl border flex items-start justify-between gap-2 ${
                          isDone
                            ? 'bg-emerald-900/10 border-emerald-600/40 text-emerald-950'
                            : 'bg-white/75 border-amber-400/60 text-zinc-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold truncate">
                            {idx + 1}. {tr.titleAr}
                          </div>
                          <div className="text-[9px] text-amber-900 font-bold truncate">
                            🎙️ {tr.sheikhAr}
                          </div>
                        </div>
                        <span className="text-xs shrink-0">
                          {isDone ? '✅ مُنجز' : '⏳ قيد السماع'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="relative z-10 p-2 rounded-xl bg-emerald-950 text-amber-100 text-[10px] font-bold">
                  🏛️ منهج أهل السنة والجماعة • تلقي العلم للعمل والتزكية
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    soundSynth.playTactileClick();
                    const text = `📜 وثيقة مدارسة «${ijazahPreviewPath.titleAr}» عبر محراب البصيرة (مضمار)\nالإنجاز المنهجي: ${doneCount}/${totalCount}\n\n${ijazahTracks
                      .map(
                        (t, i) =>
                          `${i + 1}. ${completedTrackIds.includes(t.id) ? '✅' : '▫️'} ${t.titleAr} — ${t.sheikhAr}`
                      )
                      .join('\n')}`;
                    try {
                      if (navigator.clipboard) {
                        await navigator.clipboard.writeText(text);
                        onRewardToast?.('📜 تم نسخ وثيقة المسار المنهجي للحافظة!');
                      }
                    } catch {
                      // ignore
                    }
                    setIjazahPreviewPath(null);
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold cursor-pointer shadow-lg"
                >
                  📋 نسخ ومشاركة وثيقة المسار
                </button>
                <button
                  type="button"
                  onClick={() => setIjazahPreviewPath(null)}
                  className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
                >
                  إغلاق ✕
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
          </>,
          document.body
        )}
    </div>
  );
};

