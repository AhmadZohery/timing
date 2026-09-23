import type { StationId, LifestylePersonaId, StationCustomOverride, DailyRoutineAnswers } from '../types';
import {
  BookOpen,
  Briefcase,
  Dumbbell,
  Laptop,
  Mic,
  Trophy,
  GraduationCap,
  Scroll,
  HeartHandshake,
  Sparkles,
  Home,
  Palette,
  Brain,
  Compass,
} from 'lucide-react';

export interface StationMetadata {
  id: StationId;
  stepNum: number;
  titleAr: string;
  titleEn: string;
  shortLabelAr: string;
  shortLabelEn: string;
  shortTime: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: any;
}

export interface LifestylePersonaConfig {
  id: LifestylePersonaId;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  badge: string;
  avatarEmoji: string;
  stations: Record<Exclude<StationId, 'HOME'>, Omit<StationMetadata, 'id' | 'stepNum'>>;
}

export const LIFESTYLE_PERSONAS: Record<LifestylePersonaId, LifestylePersonaConfig> = {
  builder_exec: {
    id: 'builder_exec',
    titleAr: 'رائد الأعمال والمهندس',
    titleEn: 'Builder & Executive',
    subtitleAr: 'للمحترفين، المهندسين، وصُنّاع التقنية الراغبين في حسم المهام الكبرى.',
    subtitleEn: 'For engineers, executives, and builders driving deep work.',
    badge: '⚡ إنتاجية عميقة',
    avatarEmoji: '💼',
    stations: {
      COMMUTE_MORNING: {
        titleAr: 'ورد الصباح والقرآن الكريم',
        titleEn: 'Morning Quran & Commute',
        shortLabelAr: 'القرآن',
        shortLabelEn: 'Quran',
        shortTime: '06:00 - 08:00',
        descriptionAr: 'بركة اليوم، سورة البقرة، وأذكار الصباح.',
        descriptionEn: 'Daily Wird, Al-Baqarah, and morning reflection.',
        icon: BookOpen,
      },
      WORK_MICRO_SPRINT: {
        titleAr: 'جلسات العمل والتركيز العميق',
        titleEn: 'Deep Work Sprints',
        shortLabelAr: 'العمل',
        shortLabelEn: 'Work',
        shortTime: '09:00 - 13:00',
        descriptionAr: 'أشواط تركيز مكثفة ومنتجة بلا مقاطعة.',
        descriptionEn: 'High-leverage focus work blocks.',
        icon: Briefcase,
      },
      ONE_SEC_FRICTION: {
        titleAr: 'كسر التسويف والمقاومة',
        titleEn: 'Anti-Friction Sprint',
        shortLabelAr: 'التسويف',
        shortLabelEn: 'Friction',
        shortTime: 'حسب الحاجة',
        descriptionAr: 'قاعدة الدقيقتين للبدء الفوري.',
        descriptionEn: '2-minute rule to crush resistance.',
        icon: Sparkles,
      },
      SOCIAL_MEDIA_BREAK: {
        titleAr: 'استراحة ذهنية واعية',
        titleEn: 'Mindful Recharge',
        shortLabelAr: 'استراحة',
        shortLabelEn: 'Break',
        shortTime: '15 دقيقة',
        descriptionAr: 'استعادة الصفاء وفصل التشتت.',
        descriptionEn: 'Disconnect and restore mental clarity.',
        icon: Brain,
      },
      GYM_ANCHOR: {
        titleAr: 'مرساة القوة والرياضة',
        titleEn: 'Gym Anchor',
        shortLabelAr: 'الرياضة',
        shortLabelEn: 'Gym',
        shortTime: '17:00 - 18:30',
        descriptionAr: 'تمرين القوة البدنية وتحرير الإندورفين.',
        descriptionEn: 'Physical workout and endorphin release.',
        icon: Dumbbell,
      },
      EVENING_SPRINT: {
        titleAr: 'العمل المسائي والمشاريع',
        titleEn: 'Evening Build Sprint',
        shortLabelAr: 'المساء',
        shortLabelEn: 'Evening',
        shortTime: '19:30 - 21:30',
        descriptionAr: 'حسم المشاريع الجانبية والتواصل المهني.',
        descriptionEn: 'Side projects, code backlog & communication.',
        icon: Laptop,
      },
      RETROSPECTIVE_CHECKIN: {
        titleAr: 'المراجعة وتفريغ الذهن',
        titleEn: 'Daily Retrospective',
        shortLabelAr: 'المراجعة',
        shortLabelEn: 'Review',
        shortTime: '21:30 - 22:30',
        descriptionAr: 'المحاسبة اليومية، فكرة اليوم، وسورة الملك.',
        descriptionEn: 'Daily wins, retrospective, and wind-down.',
        icon: Mic,
      },
      GRAND_REWARD_STATE: {
        titleAr: 'المكافأة والاحتفال بالإنجاز',
        titleEn: 'Grand Reward',
        shortLabelAr: 'المكافأة',
        shortLabelEn: 'Reward',
        shortTime: '22:30+',
        descriptionAr: 'متجر المكافآت الواقعية دون أدنى لوم.',
        descriptionEn: 'Guilt-free dopamine celebration.',
        icon: Trophy,
      },
    },
  },

  academic_student: {
    id: 'academic_student',
    titleAr: 'الطالب والباحث الأكاديمي',
    titleEn: 'Academic Student & Researcher',
    subtitleAr: 'للطلاب، الباحثين، وأصحاب الدراسات العليا: تنظيم المذاكرة والتحصيل والامتحانات.',
    subtitleEn: 'For students, postgrads and researchers mastering exams and papers.',
    badge: '🎓 تحصيل واستذكار',
    avatarEmoji: '🎓',
    stations: {
      COMMUTE_MORNING: {
        titleAr: 'ورد القرآن وصفاء الذهن',
        titleEn: 'Quran & Mental Clarity',
        shortLabelAr: 'القرآن',
        shortLabelEn: 'Quran',
        shortTime: '06:00 - 08:00',
        descriptionAr: 'بداية اليوم بنور القرآن لفتح مدارك الفهم والاستيعاب.',
        descriptionEn: 'Morning recitation for wisdom and mental focus.',
        icon: BookOpen,
      },
      WORK_MICRO_SPRINT: {
        titleAr: 'جلسات المذاكرة والتحصيل الأكاديمي',
        titleEn: 'Study & Lecture Mastery',
        shortLabelAr: 'المذاكرة',
        shortLabelEn: 'Study',
        shortTime: '09:00 - 13:00',
        descriptionAr: 'جلسات استذكار عميقة (بومودورو) لفهم أصعب المفاهيم.',
        descriptionEn: 'Intense study blocks for mastering complex subjects.',
        icon: GraduationCap,
      },
      ONE_SEC_FRICTION: {
        titleAr: 'كسر حاجز صعوبة المادة',
        titleEn: 'Study Anti-Procrastination',
        shortLabelAr: 'المقاومة',
        shortLabelEn: 'Friction',
        shortTime: '2 دقيقة',
        descriptionAr: 'تعهد دقيقتين لفتح الكتاب والبدء دون تردد.',
        descriptionEn: 'Open the book for 2 minutes to break friction.',
        icon: Sparkles,
      },
      SOCIAL_MEDIA_BREAK: {
        titleAr: 'راحة بصرية خالية من الشاشات',
        titleEn: 'Screen-Free Study Break',
        shortLabelAr: 'راحة',
        shortLabelEn: 'Break',
        shortTime: '15 دقيقة',
        descriptionAr: 'إراحة العين وتثبيت المعلومات بالاسترخاء.',
        descriptionEn: 'Rest your eyes and consolidate memory.',
        icon: Brain,
      },
      GYM_ANCHOR: {
        titleAr: 'تجديد الدورة الدموية والنشاط',
        titleEn: 'Brain Boost Movement',
        shortLabelAr: 'النشاط',
        shortLabelEn: 'Movement',
        shortTime: '16:30 - 18:00',
        descriptionAr: 'المشي أو الرياضة لضخ الأكسجين للدماغ وتنشيط الذاكرة.',
        descriptionEn: 'Exercise to oxygenate the brain and recharge memory.',
        icon: Dumbbell,
      },
      EVENING_SPRINT: {
        titleAr: 'مدارسة الأبحاث وحل المسائل',
        titleEn: 'Problem Solving & Research',
        shortLabelAr: 'المساء',
        shortLabelEn: 'Practice',
        shortTime: '19:00 - 21:00',
        descriptionAr: 'حل التمارين، تلخيص المراجع، وإعداد الأبحاث.',
        descriptionEn: 'Solving problem sets, thesis reading, paper writing.',
        icon: Laptop,
      },
      RETROSPECTIVE_CHECKIN: {
        titleAr: 'مراجعة الاستيعاب وتفريغ الذهن',
        titleEn: 'Knowledge Recall & Review',
        shortLabelAr: 'المراجعة',
        shortLabelEn: 'Recall',
        shortTime: '21:30 - 22:30',
        descriptionAr: 'سؤال اليوم: ماذا فهمت؟ + سورة الملك وأذكار النوم.',
        descriptionEn: 'Self-quizzing on key concepts + Surah Al-Mulk.',
        icon: Mic,
      },
      GRAND_REWARD_STATE: {
        titleAr: 'استراحة الإنجاز وتكريم النفس',
        titleEn: 'Study Celebration & Reward',
        shortLabelAr: 'المكافأة',
        shortLabelEn: 'Reward',
        shortTime: '22:30+',
        descriptionAr: 'كافئ نفسك على استيعابك بعشاء لذيذ أو جلسة مرحة.',
        descriptionEn: 'Celebrate your academic progress guilt-free.',
        icon: Trophy,
      },
    },
  },

  sharia_seeker: {
    id: 'sharia_seeker',
    titleAr: 'طالب العلم الشرعي والقرآن',
    titleEn: 'Sacred Knowledge Seeker',
    subtitleAr: 'لحفظة كتاب الله، طلاب الحلقات، والمهتمين بالعلوم الشرعية والتدبر.',
    subtitleEn: 'For Quran memorizers, Islamic students, and seekers of sacred knowledge.',
    badge: '🕌 حفظ وتدبر',
    avatarEmoji: '🕌',
    stations: {
      COMMUTE_MORNING: {
        titleAr: 'الورد القرآني وتثبيت الحفظ',
        titleEn: 'Quran Wird & Hifz Anchor',
        shortLabelAr: 'الورد',
        shortLabelEn: 'Quran',
        shortTime: 'بعد الفجر',
        descriptionAr: 'قراءة الزهراوين أو الورد اليومي مع التدبر الصباحي.',
        descriptionEn: 'Reciting Al-Zahrawayn or daily Juz with deep contemplation.',
        icon: BookOpen,
      },
      WORK_MICRO_SPRINT: {
        titleAr: 'مجالس الحفظ ومدارسة المتون',
        titleEn: 'Mutoon Memorization & Study',
        shortLabelAr: 'المتون',
        shortLabelEn: 'Texts',
        shortTime: 'الضحى والظهيرة',
        descriptionAr: 'حفظ المتون العلمية وشروح الأحاديث والفقه.',
        descriptionEn: 'Deep memorization and comprehension of classical texts.',
        icon: Scroll,
      },
      ONE_SEC_FRICTION: {
        titleAr: 'دفع الفتور وطلب الإعانة',
        titleEn: 'Renewing Intention & Resolve',
        shortLabelAr: 'النية',
        shortLabelEn: 'Resolve',
        shortTime: '2 دقيقة',
        descriptionAr: 'تجديد الإخلاص والاستعاذة من العجز والكسل.',
        descriptionEn: 'Renewing sincere intention and starting small.',
        icon: Sparkles,
      },
      SOCIAL_MEDIA_BREAK: {
        titleAr: 'خلوة الذكر والتفكر',
        titleEn: 'Contemplation & Dhikr',
        shortLabelAr: 'الخلوة',
        shortLabelEn: 'Dhikr',
        shortTime: '15 دقيقة',
        descriptionAr: 'صفاء القلب وتسبيح واستغفار لتثبيت العلم.',
        descriptionEn: 'Peaceful tasbih and mindful reflection.',
        icon: HeartHandshake,
      },
      GYM_ANCHOR: {
        titleAr: 'مرساة البدن والمؤمن القوي',
        titleEn: 'Strength & Physical Vitality',
        shortLabelAr: 'القوة',
        shortLabelEn: 'Strength',
        shortTime: 'العصر',
        descriptionAr: '«المؤمن القوي خير وأحب إلى الله من المؤمن الضعيف».',
        descriptionEn: 'Physical vitality to sustain long hours of study.',
        icon: Dumbbell,
      },
      EVENING_SPRINT: {
        titleAr: 'قراءة الشروح ومراجعة الأقران',
        titleEn: 'Commentaries & Peer Review',
        shortLabelAr: 'الشروح',
        shortLabelEn: 'Research',
        shortTime: 'المغرب والعشاء',
        descriptionAr: 'قراءة في كتب التفسير، الفقه، وتدوين الفوائد والشوارد.',
        descriptionEn: 'Reading commentaries and compiling gems of knowledge.',
        icon: Laptop,
      },
      RETROSPECTIVE_CHECKIN: {
        titleAr: 'محاسبة النفس وصلاة الوتر',
        titleEn: 'Self-Audit & Witr Prayer',
        shortLabelAr: 'المحاسبة',
        shortLabelEn: 'Account',
        shortTime: 'قبل النوم',
        descriptionAr: 'حاسبوا أنفسكم قبل أن تحاسبوا + سورة الملك وركعات الوتر.',
        descriptionEn: 'Nightly self-reckoning, Surah Al-Mulk, and Witr prayer.',
        icon: Mic,
      },
      GRAND_REWARD_STATE: {
        titleAr: 'بركة اليوم والراحة المستحقة',
        titleEn: 'Sacred Rest & Leisure',
        shortLabelAr: 'المكافأة',
        shortLabelEn: 'Reward',
        shortTime: 'الليل',
        descriptionAr: 'الترويح عن النفس المباح لاستئناف النشاط غداً.',
        descriptionEn: 'Mindful relaxation to recharge for tomorrow\'s seeking.',
        icon: Trophy,
      },
    },
  },

  freelancer_creator: {
    id: 'freelancer_creator',
    titleAr: 'المستقل وصانع المحتوى',
    titleEn: 'Freelancer & Content Creator',
    subtitleAr: 'للمستقلين، المصممين، الكُتّاب، وصُنّاع المحتوى أصحاب المواعيد الحرة.',
    subtitleEn: 'For freelancers, creators, writers, and designers managing agile flows.',
    badge: '🎨 إبداع وحرية',
    avatarEmoji: '🎨',
    stations: {
      COMMUTE_MORNING: {
        titleAr: 'ورد الإلهام وسكينة الصباح',
        titleEn: 'Morning Inspiration & Wird',
        shortLabelAr: 'الإلهام',
        shortLabelEn: 'Inspire',
        shortTime: '06:30 - 08:30',
        descriptionAr: 'صفاء روحي وقرآني يملأ الوجدان بالأفكار البكر.',
        descriptionEn: 'Spiritual grounding for high-level creative ideation.',
        icon: BookOpen,
      },
      WORK_MICRO_SPRINT: {
        titleAr: 'جلسات التدفق الإبداعي والإنتاج',
        titleEn: 'Creative Flow Sprints',
        shortLabelAr: 'الإبداع',
        shortLabelEn: 'Create',
        shortTime: '09:00 - 13:00',
        descriptionAr: 'جلسات كتابة، تصميم، مونتاج، أو بناء بدون أي مقاطعات.',
        descriptionEn: 'Deep creative flow: writing, editing, designing.',
        icon: Palette,
      },
      ONE_SEC_FRICTION: {
        titleAr: 'كسر متلازمة الصفحة البيضاء',
        titleEn: 'Blank Page Friction Buster',
        shortLabelAr: 'البدء',
        shortLabelEn: 'Friction',
        shortTime: '2 دقيقة',
        descriptionAr: 'ابدأ بكتابة مسودة أولى سيئة خلال 120 ثانية فقط.',
        descriptionEn: 'Write a messy first sentence to break resistance.',
        icon: Sparkles,
      },
      SOCIAL_MEDIA_BREAK: {
        titleAr: 'استراحة حسية وتجديد الشغف',
        titleEn: 'Sensory Reset Break',
        shortLabelAr: 'شغف',
        shortLabelEn: 'Reset',
        shortTime: '15 دقيقة',
        descriptionAr: 'تغذية بصرية خفيفة أو فنجان قهوة لتجديد الأفكار.',
        descriptionEn: 'Coffee and visual nourishment to refresh ideas.',
        icon: Brain,
      },
      GYM_ANCHOR: {
        titleAr: 'تفريغ التوتر وتنشيط الجسد',
        titleEn: 'Body Reset & Fitness',
        shortLabelAr: 'الحركة',
        shortLabelEn: 'Movement',
        shortTime: '16:00 - 17:30',
        descriptionAr: 'الخروج من كرسي المكتب وتنشيط عضلات الظهر والجسم.',
        descriptionEn: 'Step away from the desk and release posture tension.',
        icon: Dumbbell,
      },
      EVENING_SPRINT: {
        titleAr: 'تسليم المشاريع وتواصل العملاء',
        titleEn: 'Client Pipeline & Delivery',
        shortLabelAr: 'المشاريع',
        shortLabelEn: 'Pipeline',
        shortTime: '18:30 - 20:30',
        descriptionAr: 'التواصل مع العملاء، إرسال العروض، وتنسيق التسليمات.',
        descriptionEn: 'Outreach, proposals, deliverables, and invoices.',
        icon: Laptop,
      },
      RETROSPECTIVE_CHECKIN: {
        titleAr: 'مراجعة المخرجات وتفريغ الأفكار',
        titleEn: 'Creative Day Retrospective',
        shortLabelAr: 'التفريغ',
        shortLabelEn: 'Brain Dump',
        shortTime: '21:00 - 22:00',
        descriptionAr: 'تدوين فكرة اليوم الذهبية وتفريغ مسودات الغد.',
        descriptionEn: 'Capture today\'s breakthrough idea and clear your mind.',
        icon: Mic,
      },
      GRAND_REWARD_STATE: {
        titleAr: 'مكافأة الإبداع والمتعة',
        titleEn: 'Creator Dopamine Reward',
        shortLabelAr: 'المكافأة',
        shortLabelEn: 'Reward',
        shortTime: '22:00+',
        descriptionAr: 'استمتع بكتاب كنت تنتظره أو فيلم ممتع دون أي عمل.',
        descriptionEn: 'Enjoy high-quality leisure to refuel your muse.',
        icon: Trophy,
      },
    },
  },

  flexible_home: {
    id: 'flexible_home',
    titleAr: 'تنظيم الحياة المرنة ورب الأسرة',
    titleEn: 'Life Harmonizer & Homemaker',
    subtitleAr: 'لمن لا يرتبط بوظيفة رسمية: تنظيم أهداف البيت، العائلة، القراءة، والعافية الشخصية.',
    subtitleEn: 'For homemakers, retirees, and individuals designing life on their own terms.',
    badge: '🏡 حياة متزنة',
    avatarEmoji: '🏡',
    stations: {
      COMMUTE_MORNING: {
        titleAr: 'سكينة الصباح والورد القرآني',
        titleEn: 'Morning Serenity & Quran',
        shortLabelAr: 'السكينة',
        shortLabelEn: 'Peace',
        shortTime: '06:00 - 08:30',
        descriptionAr: 'هدوء البيت الصباحي مع القرآن الكريم وأذكار اليوم.',
        descriptionEn: 'Quiet morning reflection, Quran Wird, and gratitude.',
        icon: BookOpen,
      },
      WORK_MICRO_SPRINT: {
        titleAr: 'المشاريع المنزلية والشخصية',
        titleEn: 'Home & Personal Projects',
        shortLabelAr: 'البيت',
        shortLabelEn: 'Projects',
        shortTime: '09:00 - 12:30',
        descriptionAr: 'ترتيب الأولويات، مهام الأسرة، وإنجاز مشاريع المنزل.',
        descriptionEn: 'Family priorities, home projects, organizing routines.',
        icon: Home,
      },
      ONE_SEC_FRICTION: {
        titleAr: 'كسر ثقل البداية في المهام',
        titleEn: 'Gentle Anti-Procrastination',
        shortLabelAr: 'البدء',
        shortLabelEn: 'Gentle',
        shortTime: '2 دقيقة',
        descriptionAr: 'ابدأ بترتيب مساحة صغيرة فقط لدقيقتين دون تعقيد.',
        descriptionEn: 'Tackle one tiny corner for 2 minutes to gain momentum.',
        icon: Sparkles,
      },
      SOCIAL_MEDIA_BREAK: {
        titleAr: 'شاي الصباح والهدوء النفسي',
        titleEn: 'Morning Tea & Mindfulness',
        shortLabelAr: 'استرخاء',
        shortLabelEn: 'Tea Break',
        shortTime: '15 دقيقة',
        descriptionAr: 'لحظة صمت وتلذذ بفنجانك المفضل بعيداً عن الهاتف.',
        descriptionEn: 'Savor a warm drink and quiet your thoughts.',
        icon: Brain,
      },
      GYM_ANCHOR: {
        titleAr: 'المشي ونشاط العافية والصحة',
        titleEn: 'Wellness Walk & Movement',
        shortLabelAr: 'العافية',
        shortLabelEn: 'Wellness',
        shortTime: '16:00 - 17:30',
        descriptionAr: 'مشي خفيف في الهواء الطلق أو تمارين تمدد لطيفة.',
        descriptionEn: 'Outdoor walk, light stretching, and vitality.',
        icon: Dumbbell,
      },
      EVENING_SPRINT: {
        titleAr: 'القراءة الحرة وتطوير المهارات',
        titleEn: 'Reading & Skill Cultivation',
        shortLabelAr: 'القراءة',
        shortLabelEn: 'Reading',
        shortTime: '18:30 - 20:30',
        descriptionAr: 'قراءة كتاب ملهم، تعلم مهارة جديدة، أو ممارسة هواية.',
        descriptionEn: 'Inspiring reading, craft hobbies, and personal learning.',
        icon: BookOpen,
      },
      RETROSPECTIVE_CHECKIN: {
        titleAr: 'سكينة المساء والامتنان',
        titleEn: 'Evening Gratitude & Peace',
        shortLabelAr: 'الامتنان',
        shortLabelEn: 'Gratitude',
        shortTime: '21:00 - 22:00',
        descriptionAr: 'تدوين نِعَم اليوم، سورة الملك، والاستعداد للنوم.',
        descriptionEn: 'Counting today\'s blessings and quiet evening wind-down.',
        icon: Mic,
      },
      GRAND_REWARD_STATE: {
        titleAr: 'واحة الراحة والاستمتاع الذاتي',
        titleEn: 'Guilt-Free Leisure Sanctuary',
        shortLabelAr: 'الراحة',
        shortLabelEn: 'Leisure',
        shortTime: '22:00+',
        descriptionAr: 'استرخاء كامل وعناية بالنفس دون أدنى تأنيب ضمير.',
        descriptionEn: 'Pure peaceful self-care without any guilt.',
        icon: Trophy,
      },
    },
  },

  homemaker_family: {
    id: 'homemaker_family',
    titleAr: 'ربة منزل وإدارة الأسرة والطهي',
    titleEn: 'Homemaker & Family Guardian',
    subtitleAr: 'لربات البيوت، الفتيات في المنزل، إدارة شؤون الأسرة، الطهي الصحي، والسكينة الشخصية.',
    subtitleEn: 'For homemakers managing family care, healthy cooking, and tranquil routines.',
    badge: '🌸 سكينة ورعاية أسرية',
    avatarEmoji: '🌸',
    stations: {
      COMMUTE_MORNING: {
        titleAr: 'سكينة الصباح والورد القرآني',
        titleEn: 'Morning Serenity & Quran',
        shortLabelAr: 'الورد والسكينة',
        shortLabelEn: 'Serenity',
        shortTime: '06:00 - 08:30',
        descriptionAr: 'هدوء البيت الصباحي مع القرآن الكريم وأذكار اليوم والبركة.',
        descriptionEn: 'Quiet morning reflection, Quran Wird, and daily barakah.',
        icon: BookOpen,
      },
      WORK_MICRO_SPRINT: {
        titleAr: 'إدارة شؤون المنزل وفترة الطهي الصحي',
        titleEn: 'Home Management & Meal Prep',
        shortLabelAr: 'البيت والطهي',
        shortLabelEn: 'Cooking & Home',
        shortTime: '09:00 - 13:00',
        descriptionAr: 'إعداد وجبات الأسرة، تنظيم وترتيب أركان البيت، وتفريغ المهام الأسرية بوعي.',
        descriptionEn: 'Nourishing family meals, home organizing, and mindful domestic rhythm.',
        icon: Home,
      },
      ONE_SEC_FRICTION: {
        titleAr: 'كسر ثقل البداية ورتابة الروتين',
        titleEn: 'Gentle Momentum Starter',
        shortLabelAr: 'البدء الهادئ',
        shortLabelEn: 'Start',
        shortTime: '2 دقيقة',
        descriptionAr: 'ترتيب ركن صغير لدقيقتين فقط لتوليد الحماس والتدفق.',
        descriptionEn: 'Tackle one corner for 2 minutes to gain easy momentum.',
        icon: Sparkles,
      },
      SOCIAL_MEDIA_BREAK: {
        titleAr: 'شاي الصباح والهدوء النفسي',
        titleEn: 'Tea & Quiet Mindfulness',
        shortLabelAr: 'استراحة صفاء',
        shortLabelEn: 'Quiet Break',
        shortTime: '15 دقيقة',
        descriptionAr: 'لحظة صمت وتلذذ بمشروبك المفضل بعيداً عن الشاشات والضجيج.',
        descriptionEn: 'Savor your tea in peaceful screen-free stillness.',
        icon: Brain,
      },
      GYM_ANCHOR: {
        titleAr: 'الحيوية المنزلية والمشي وتجديد العافية',
        titleEn: 'Home Vitality & Mobility',
        shortLabelAr: 'العافية والصحة',
        shortLabelEn: 'Vitality',
        shortTime: '16:00 - 17:30',
        descriptionAr: 'تمارين تمدد لطيفة للظهر والرقبة، مشي خفيف، أو استرخاء وتأمل.',
        descriptionEn: 'Gentle posture stretches, light walking, or restful relaxation.',
        icon: HeartHandshake,
      },
      EVENING_SPRINT: {
        titleAr: 'القراءة الهادئة والدفء الأسري',
        titleEn: 'Evening Warmth & Reading',
        shortLabelAr: 'الدفء الأسري',
        shortLabelEn: 'Family Warmth',
        shortTime: '18:30 - 20:30',
        descriptionAr: 'جلسة عائلية دافئة، قراءة كتاب ملهم، أو ممارسة هواية محبوبة.',
        descriptionEn: 'Quality family time, inspiring book reading, or creative hobby.',
        icon: BookOpen,
      },
      RETROSPECTIVE_CHECKIN: {
        titleAr: 'سكينة المساء والامتنان وسورة الملك',
        titleEn: 'Gratitude & Al-Mulk Wind-Down',
        shortLabelAr: 'الامتنان والملك',
        shortLabelEn: 'Gratitude',
        shortTime: '21:00 - 22:00',
        descriptionAr: 'تعداد نِعَم اليوم، محاسبة هادئة، وسورة الملك المنجية.',
        descriptionEn: 'Reflecting on blessings, Surah Al-Mulk, and night reflection.',
        icon: Mic,
      },
      GRAND_REWARD_STATE: {
        titleAr: 'واحة الراحة والاستجمام التام',
        titleEn: 'Rest & Guilt-Free Sanctuary',
        shortLabelAr: 'الراحة التامة',
        shortLabelEn: 'Pure Rest',
        shortTime: '22:00+',
        descriptionAr: 'عناية ذاتية واسترخاء عميق بدون أي قيود أو لوم.',
        descriptionEn: 'Peaceful restorative sleep and complete self-care.',
        icon: Trophy,
      },
    },
  },

  remote_teacher_flexible: {
    id: 'remote_teacher_flexible',
    titleAr: 'المعلّم والمدرّس عن بعد والمستقل',
    titleEn: 'Remote Educator & Flexible Pro',
    subtitleAr: 'للمعلمين عبر الإنترنت، المدرّسين، والمستقلين ذوي الجداول المرنة والحصص التفاعلية.',
    subtitleEn: 'For remote teachers, tutors, and flexible pros crafting impactful learning.',
    badge: '🎓 تدريس ومواعيد مرنة',
    avatarEmoji: '📚',
    stations: {
      COMMUTE_MORNING: {
        titleAr: 'ورد الصباح والتحضير الذهني',
        titleEn: 'Morning Wird & Mindset Prep',
        shortLabelAr: 'الورد والصفاء',
        shortLabelEn: 'Morning Wird',
        shortTime: '06:30 - 08:30',
        descriptionAr: 'بركة اليوم بالقرآن وأذكار الصباح لشحن الطاقة الإيجابية لطلابك.',
        descriptionEn: 'Morning recitation and energetic clarity for teaching.',
        icon: BookOpen,
      },
      WORK_MICRO_SPRINT: {
        titleAr: 'جلسات التدريس والشرح والعمل المرن',
        titleEn: 'Teaching & Interactive Sprints',
        shortLabelAr: 'التدريس والشرح',
        shortLabelEn: 'Teaching',
        shortTime: 'مواعيد مرنة',
        descriptionAr: 'الحصص الافتراضية، إعداد المواد والشروحات، والتواصل البنّاء مع الطلاب.',
        descriptionEn: 'Live sessions, curriculum design, student interaction.',
        icon: GraduationCap,
      },
      ONE_SEC_FRICTION: {
        titleAr: 'كسر التردد وتجهيز الحصة',
        titleEn: 'Classroom Launch Trigger',
        shortLabelAr: 'البدء الفوري',
        shortLabelEn: 'Launch',
        shortTime: '2 دقيقة',
        descriptionAr: 'فتح الشرائح وبيئة العمل فوراً لكسر حاجز التسويف.',
        descriptionEn: 'Open teaching slides immediately to destroy inertia.',
        icon: Sparkles,
      },
      SOCIAL_MEDIA_BREAK: {
        titleAr: 'راحة الصوت وتصفية الذهن',
        titleEn: 'Vocal Rest & Reset',
        shortLabelAr: 'راحة الصوت',
        shortLabelEn: 'Vocal Rest',
        shortTime: '15 دقيقة',
        descriptionAr: 'إراحة الأحبال الصوتية والعينين من الشاشات وشرب الماء الدافئ.',
        descriptionEn: 'Rest your vocal cords and eyes in peaceful silence.',
        icon: Brain,
      },
      GYM_ANCHOR: {
        titleAr: 'تفريغ إجهاد الجلوس وتنشيط البدن',
        titleEn: 'Desk Fatigue Antidote',
        shortLabelAr: 'الحركة والصحة',
        shortLabelEn: 'Movement',
        shortTime: '16:30 - 18:00',
        descriptionAr: 'تنشيط الدورة الدموية وتمدد فقرات الظهر بعد ساعات الشرح.',
        descriptionEn: 'Posture restoration and endorphin recharge.',
        icon: Dumbbell,
      },
      EVENING_SPRINT: {
        titleAr: 'متابعة الواجبات وتطوير المناهج',
        titleEn: 'Grading, Feedback & Curriculum',
        shortLabelAr: 'المتابعة والمناهج',
        shortLabelEn: 'Feedback',
        shortTime: '19:00 - 21:00',
        descriptionAr: 'إرسال التغذية الراجعة للطلاب، تخطيط حصص الغد، وتطوير المحتوى.',
        descriptionEn: 'Grading, student feedback, and next day lesson prep.',
        icon: Laptop,
      },
      RETROSPECTIVE_CHECKIN: {
        titleAr: 'مراجعة أثر العلم وسورة الملك',
        titleEn: 'Educator Reflection & Al-Mulk',
        shortLabelAr: 'المراجعة والملك',
        shortLabelEn: 'Reflection',
        shortTime: '21:30 - 22:30',
        descriptionAr: 'استشعار أجر نشر العلم، سورة الملك، وأذكار المساء والنوم.',
        descriptionEn: 'Intention check for teaching, Surah Al-Mulk, and night reflection.',
        icon: Mic,
      },
      GRAND_REWARD_STATE: {
        titleAr: 'مكافأة المعلم والراحة التامة',
        titleEn: 'Educator Reward Oasis',
        shortLabelAr: 'المكافأة',
        shortLabelEn: 'Reward',
        shortTime: '22:30+',
        descriptionAr: 'استرخاء مستحق واستمتاع بإنجازك في نفع الآخرين.',
        descriptionEn: 'Guilt-free relaxation refuelling your passion.',
        icon: Trophy,
      },
    },
  },

  dedicated_learner: {
    id: 'dedicated_learner',
    titleAr: 'المتفرّغ للتعلم الذاتي وبناء المهارات',
    titleEn: 'Dedicated Self-Learner',
    subtitleAr: 'لمن يكرس وقته لدراسة مجال جديد، كورس مكثف، تعلم لغة، أو بناء مهارات بدل الشغل التقليدي.',
    subtitleEn: 'For learners studying new domains, intensive courses, languages, or skills.',
    badge: '💡 شغف التعلم والنمو',
    avatarEmoji: '💡',
    stations: {
      COMMUTE_MORNING: {
        titleAr: 'ورد القرآن وصفاء الذاكرة والذهن',
        titleEn: 'Quran & Neuroplasticity Prep',
        shortLabelAr: 'القرآن والذاكرة',
        shortLabelEn: 'Clarity',
        shortTime: '06:00 - 08:30',
        descriptionAr: 'افتتاح اليوم بالقرآن لتصفية الذهن ورفع معدل الاستيعاب والحفظ.',
        descriptionEn: 'Grounding with Quran recitation to prime cognitive clarity.',
        icon: BookOpen,
      },
      WORK_MICRO_SPRINT: {
        titleAr: 'جلسات التعلم والمتابعة الذكية لما أتعلمه',
        titleEn: 'Deep Study & Learning Tracker',
        shortLabelAr: 'مسار التعلم',
        shortLabelEn: 'Study Track',
        shortTime: '09:00 - 13:00',
        descriptionAr: 'دراسة موضوع اليوم، حل التطبيقات العملية، وتدوين ما تم استيعابه بالسجل.',
        descriptionEn: 'Mastering today’s topic, coding/practice, logging breakthroughs.',
        icon: GraduationCap,
      },
      ONE_SEC_FRICTION: {
        titleAr: 'كسر حاجز صعوبة الدرس',
        titleEn: 'Study Resistance Buster',
        shortLabelAr: 'البدء لدقيقتين',
        shortLabelEn: '2-Min Start',
        shortTime: '2 دقيقة',
        descriptionAr: 'تشغيل أول 120 ثانية من المحاضرة أو فتح صفحة المرجع بلا تردد.',
        descriptionEn: 'Watch first 2 minutes of the lecture to unlock focus flow.',
        icon: Sparkles,
      },
      SOCIAL_MEDIA_BREAK: {
        titleAr: 'تثبيت المعلومات واستراحة الاستيعاب',
        titleEn: 'Memory Consolidation Break',
        shortLabelAr: 'تثبيت الفهم',
        shortLabelEn: 'Consolidation',
        shortTime: '15 دقيقة',
        descriptionAr: 'إغلاق الشاشة لترسيخ المفاهيم ونقلها للذاكرة طويلة المدى.',
        descriptionEn: 'Screen-free stillness allowing neurons to consolidate facts.',
        icon: Brain,
      },
      GYM_ANCHOR: {
        titleAr: 'ضخ الأكسجين للدماغ بالرياضة أو المشي',
        titleEn: 'Brain BDNF Boost Movement',
        shortLabelAr: 'تنشيط الذهن',
        shortLabelEn: 'Brain Boost',
        shortTime: '16:00 - 17:30',
        descriptionAr: 'الرياضة والمشي يفرزان الـ BDNF المحفز لترسيخ التعلم وسرعة الفهم.',
        descriptionEn: 'Aerobic activity triggering BDNF for optimal learning.',
        icon: Dumbbell,
      },
      EVENING_SPRINT: {
        titleAr: 'التطبيق العملي وتلخيص ما تم تعلمه',
        titleEn: 'Hands-on Practice & Synthesis',
        shortLabelAr: 'التلخيص والممارسة',
        shortLabelEn: 'Synthesis',
        shortTime: '19:00 - 21:00',
        descriptionAr: 'بناء مشروع تجريبي بما تعلمته اليوم وتوثيق الفوائد المستخلصة.',
        descriptionEn: 'Build mini-projects and distill today’s key takeaways.',
        icon: Laptop,
      },
      RETROSPECTIVE_CHECKIN: {
        titleAr: 'سؤال الاستيعاب اليومي وسورة الملك',
        titleEn: 'Daily Recall & Surah Al-Mulk',
        shortLabelAr: 'ماذا تعلمت؟',
        shortLabelEn: 'Daily Recall',
        shortTime: '21:30 - 22:30',
        descriptionAr: 'المحاسبة والإجابة على: ماذا فهمت اليوم؟ + سورة الملك وأذكار النوم.',
        descriptionEn: 'Active recall: What did I master today? + Surah Al-Mulk.',
        icon: Mic,
      },
      GRAND_REWARD_STATE: {
        titleAr: 'مكافأة المستكشف والاحتفال بالنمو',
        titleEn: 'Learner Dopamine Celebration',
        shortLabelAr: 'المكافأة',
        shortLabelEn: 'Reward',
        shortTime: '22:30+',
        descriptionAr: 'فرحة الإنجاز واستيعاب المفاهيم الجديدة دون أي ضغط.',
        descriptionEn: 'Celebrate intellectual growth guilt-free.',
        icon: Trophy,
      },
    },
  },

  seeker_nonworking: {
    id: 'seeker_nonworking',
    titleAr: 'تنظيم الحياة والسكينة وبناء العادات',
    titleEn: 'Life Harmony & Self-Paced',
    subtitleAr: 'لمن لا يرتبط بعمل حالياً: تنظيم اليوم، حماية الصلوات والأوراد، وتطوير الذات دون توتر وظيفي.',
    subtitleEn: 'For individuals seeking harmony, prayer consistency, and mindful self-growth.',
    badge: '🕊️ هدوء وتنظيم متزن',
    avatarEmoji: '🌿',
    stations: {
      COMMUTE_MORNING: {
        titleAr: 'سكينة الصباح والورد القرآني',
        titleEn: 'Morning Serenity & Quran',
        shortLabelAr: 'الورد والسكينة',
        shortLabelEn: 'Serenity',
        shortTime: '06:00 - 08:30',
        descriptionAr: 'افتتاح اليوم بالقرآن الكريم وأذكار الصباح والصفاء الروحي.',
        descriptionEn: 'Start your day with Quran recitation and spiritual calm.',
        icon: BookOpen,
      },
      WORK_MICRO_SPRINT: {
        titleAr: 'إنجاز الأولويات الشخصية وبناء العادات',
        titleEn: 'Personal Priorities & Habit Building',
        shortLabelAr: 'الأولويات',
        shortLabelEn: 'Priorities',
        shortTime: '09:00 - 12:30',
        descriptionAr: 'ترتيب المهام المهمة لحياتك، تنظيم أهدافك، واستثمار وقتك بحرية.',
        descriptionEn: 'Mindful progress on your own life goals at your pace.',
        icon: Home,
      },
      ONE_SEC_FRICTION: {
        titleAr: 'كسر ثقل البداية والتسويف',
        titleEn: 'Gentle Anti-Friction',
        shortLabelAr: 'البدء لدقيقتين',
        shortLabelEn: '2-Min Start',
        shortTime: '2 دقيقة',
        descriptionAr: 'ابدأ بخطوة أولى صغيرة جداً تدوم 120 ثانية فقط.',
        descriptionEn: 'Take one micro-step for 2 minutes to create gentle momentum.',
        icon: Sparkles,
      },
      SOCIAL_MEDIA_BREAK: {
        titleAr: 'استراحة تأمل وهدوء نفسي',
        titleEn: 'Mindful Breathing Break',
        shortLabelAr: 'استراحة صفاء',
        shortLabelEn: 'Quiet Reset',
        shortTime: '15 دقيقة',
        descriptionAr: 'جلسة هدوء وفصل عن وسائل التواصل لتجديد صفاء الذهن.',
        descriptionEn: 'Step away from feeds and recharge in quiet mindfulness.',
        icon: Brain,
      },
      GYM_ANCHOR: {
        titleAr: 'المشي في الهواء الطلق وتجديد الحيوية',
        titleEn: 'Outdoor Walk & Vitality',
        shortLabelAr: 'المشي والعافية',
        shortLabelEn: 'Wellness Walk',
        shortTime: '16:00 - 17:30',
        descriptionAr: 'مشي خفيف، تمدد عضلات الجسم، أو تمارين لياقة منزلية متوازنة.',
        descriptionEn: 'Fresh air walking, light stretches, or balanced home movement.',
        icon: HeartHandshake,
      },
      EVENING_SPRINT: {
        titleAr: 'القراءة الحرة واكتساب المعرفة',
        titleEn: 'Leisure Reading & Knowledge',
        shortLabelAr: 'القراءة الحرة',
        shortLabelEn: 'Reading',
        shortTime: '18:30 - 20:30',
        descriptionAr: 'قراءة في كتاب ممتع، سماع محاضرة مفيدة، أو تنمية هواية.',
        descriptionEn: 'Inspiring reading, enriching podcasts, or mindful hobbies.',
        icon: BookOpen,
      },
      RETROSPECTIVE_CHECKIN: {
        titleAr: 'المحاسبة الهادئة وسورة الملك',
        titleEn: 'Evening Gratitude & Al-Mulk',
        shortLabelAr: 'الامتنان والملك',
        shortLabelEn: 'Gratitude',
        shortTime: '21:00 - 22:00',
        descriptionAr: 'شكر الله على نعم اليوم، سورة الملك المنجية، وأذكار النوم.',
        descriptionEn: 'Counting daily blessings, Surah Al-Mulk, and peaceful night reflection.',
        icon: Mic,
      },
      GRAND_REWARD_STATE: {
        titleAr: 'واحة الراحة التامة دون أي ضغوط',
        titleEn: 'Pure Rest & Serene Sleep',
        shortLabelAr: 'الراحة التامة',
        shortLabelEn: 'Peaceful Rest',
        shortTime: '22:00+',
        descriptionAr: 'نوم عميق وراحة مستحقة لاستقبال يوم جديد بنشاط وبركة.',
        descriptionEn: 'Deep restorative sleep preparing for another blessed day.',
        icon: Trophy,
      },
    },
  },
  custom: {
    id: 'custom',
    titleAr: 'مخصص بالكامل',
    titleEn: 'Custom Blueprint',
    subtitleAr: 'حرية مطلقة في تعيين كل محطة واسمها وهدفها وفق يومك الفريد.',
    subtitleEn: 'Total freedom to customize every station to your exact rhythm.',
    badge: '🛠️ صياغتك الذاتية',
    avatarEmoji: '⚙️',
    stations: {
      COMMUTE_MORNING: {
        titleAr: 'المحطة الأولى: انطلاقة اليوم',
        titleEn: 'Station 1: Daily Launch',
        shortLabelAr: 'المحطة 1',
        shortLabelEn: 'Station 1',
        shortTime: 'الصباح',
        descriptionAr: 'بداية اليوم والورد المفضل.',
        descriptionEn: 'Start your day with your chosen anchor.',
        icon: Compass,
      },
      WORK_MICRO_SPRINT: {
        titleAr: 'المحطة الثانية: التركيز الأول',
        titleEn: 'Station 2: Primary Focus',
        shortLabelAr: 'المحطة 2',
        shortLabelEn: 'Station 2',
        shortTime: 'النهار',
        descriptionAr: 'أهم هدف في نهارك.',
        descriptionEn: 'Your primary daytime objective.',
        icon: Briefcase,
      },
      ONE_SEC_FRICTION: {
        titleAr: 'المحطة: كسر المقاومة',
        titleEn: 'Friction Breaker',
        shortLabelAr: 'البدء',
        shortLabelEn: 'Start',
        shortTime: '2 دقيقة',
        descriptionAr: 'قاعدة الدقيقتين للبدء.',
        descriptionEn: '2-minute anti-friction trigger.',
        icon: Sparkles,
      },
      SOCIAL_MEDIA_BREAK: {
        titleAr: 'المحطة: استراحة ذهنية',
        titleEn: 'Mindful Break',
        shortLabelAr: 'استراحة',
        shortLabelEn: 'Break',
        shortTime: '15 دقيقة',
        descriptionAr: 'فصل وتجديد نشاط.',
        descriptionEn: 'Rest and recharge.',
        icon: Brain,
      },
      GYM_ANCHOR: {
        titleAr: 'المحطة الثالثة: النشاط والبدن',
        titleEn: 'Station 3: Physical Vitality',
        shortLabelAr: 'المحطة 3',
        shortLabelEn: 'Station 3',
        shortTime: 'العصر',
        descriptionAr: 'الحركة والرياضة والعافية.',
        descriptionEn: 'Movement, health and vitality.',
        icon: Dumbbell,
      },
      EVENING_SPRINT: {
        titleAr: 'المحطة الرابعة: استثمار المساء',
        titleEn: 'Station 4: Evening Priority',
        shortLabelAr: 'المحطة 4',
        shortLabelEn: 'Station 4',
        shortTime: 'المساء',
        descriptionAr: 'الهدف الثانوي أو التفرغ للمشاريع.',
        descriptionEn: 'Evening focus and personal projects.',
        icon: Laptop,
      },
      RETROSPECTIVE_CHECKIN: {
        titleAr: 'المحطة الخامسة: مراجعة اليوم',
        titleEn: 'Station 5: Evening Reflection',
        shortLabelAr: 'المحطة 5',
        shortLabelEn: 'Station 5',
        shortTime: 'الليل',
        descriptionAr: 'تقييم اليوم وتفريغ الذهن.',
        descriptionEn: 'Review wins and clear your thoughts.',
        icon: Mic,
      },
      GRAND_REWARD_STATE: {
        titleAr: 'المحطة السادسة: المكافأة والاسترخاء',
        titleEn: 'Station 6: Grand Reward',
        shortLabelAr: 'المكافأة',
        shortLabelEn: 'Reward',
        shortTime: 'وقت النوم',
        descriptionAr: 'الاستمتاع بثمرة يومك.',
        descriptionEn: 'Guilt-free relaxation.',
        icon: Trophy,
      },
    },
  },
};

/**
 * Resolves station metadata combining persona preset and user custom overrides
 */
export function resolveStationMetadata(
  stationId: StationId,
  personaId: LifestylePersonaId = 'builder_exec',
  overrides?: Partial<Record<StationId, StationCustomOverride>>,
  _isAr = true
): StationMetadata {
  if (stationId === 'HOME') {
    return {
      id: 'HOME',
      stepNum: 0,
      titleAr: 'الرئيسية • لوحة اليوم',
      titleEn: 'Home Dashboard',
      shortLabelAr: 'الرئيسية',
      shortLabelEn: 'Home',
      shortTime: 'نظرة اليوم والتحفيز',
      descriptionAr: 'لوحة الانطلاقة والتحفيز ومواقيت الصلاة الحية ومسار اليوم',
      descriptionEn: 'Daily overview, motivational spark, and real-time prayer schedule',
      icon: Home,
    };
  }

  const persona = LIFESTYLE_PERSONAS[personaId] || LIFESTYLE_PERSONAS.builder_exec;
  const base = persona.stations[stationId] || LIFESTYLE_PERSONAS.builder_exec.stations[stationId];
  const override = overrides?.[stationId];

  // Map step numbers
  const stepNums: Record<StationId, number> = {
    HOME: 0,
    COMMUTE_MORNING: 1,
    WORK_MICRO_SPRINT: 2,
    ONE_SEC_FRICTION: 0,
    SOCIAL_MEDIA_BREAK: 0,
    GYM_ANCHOR: 3,
    EVENING_SPRINT: 4,
    RETROSPECTIVE_CHECKIN: 5,
    GRAND_REWARD_STATE: 6,
  };

  return {
    id: stationId,
    stepNum: stepNums[stationId] || 1,
    titleAr: override?.customTitle || base.titleAr,
    titleEn: override?.customTitle || base.titleEn,
    shortLabelAr: override?.customShortLabel || base.shortLabelAr,
    shortLabelEn: override?.customShortLabel || base.shortLabelEn,
    shortTime: override?.customSubtitle || base.shortTime,
    descriptionAr: base.descriptionAr,
    descriptionEn: base.descriptionEn,
    icon: base.icon,
  };
}

export const PERSONA_CONFIGS = LIFESTYLE_PERSONAS;

export interface CalculatedScheduleRecommendation {
  suggestedWakeupTime: string;
  suggestedBedtime: string;
  fajrSyncNote: string;
  commuteSummary: string;
  cookingSummary?: string;
  workoutSummary: string;
  matchedPersona: LifestylePersonaId;
  stationTimeSlots: Record<string, string>;
  stationOverrides: Partial<Record<StationId, StationCustomOverride>>;
}

/**
 * Intelligently generates dynamic schedule recommendations and station overrides
 * tailored to user's work, commute, cooking, and fitness preferences.
 */
export function calculateSmartDailySchedule(
  answers: DailyRoutineAnswers,
  fajrTimeString = '05:00'
): CalculatedScheduleRecommendation {
  // 1. Determine matched persona
  let matchedPersona: LifestylePersonaId = 'builder_exec';
  switch (answers.activityType) {
    case 'homemaker_cooking':
      matchedPersona = 'homemaker_family';
      break;
    case 'remote_teacher':
      matchedPersona = 'remote_teacher_flexible';
      break;
    case 'dedicated_learning':
      matchedPersona = 'dedicated_learner';
      break;
    case 'freelance_remote':
      matchedPersona = 'freelancer_creator';
      break;
    case 'seeking_flexible':
      matchedPersona = 'seeker_nonworking';
      break;
    case 'student':
      matchedPersona = 'academic_student';
      break;
    case 'office_job':
    default:
      matchedPersona = 'builder_exec';
      break;
  }

  // 2. Calculate Wakeup & Bedtime
  let suggestedWakeupTime = answers.customWakeupTime || '05:00';
  let fajrSyncNote = 'متزامن مع صلاة الفجر';

  if (answers.autoSuggestWakeup) {
    if (answers.commuteMinutes > 40 && answers.activityType === 'office_job') {
      suggestedWakeupTime = '04:45';
      fajrSyncNote = 'الاستيقاظ قبل الفجر بـ 20 دقيقة لإدراك الفجر في المسجد والاستعداد للمواصلات براحة';
    } else if (answers.activityType === 'homemaker_cooking') {
      suggestedWakeupTime = '05:15';
      fajrSyncNote = 'الاستيقاظ مع صلاة الفجر والورد الصباحي، ثم بدء أعمال المنزل في هدوء';
    } else if (answers.activityType === 'dedicated_learning') {
      suggestedWakeupTime = '05:00';
      fajrSyncNote = 'صلاة الفجر ثم الورد القرآني واستغلال ساعات الصباح الباكر حيث تكون قمة الاستيعاب الذهني';
    } else {
      suggestedWakeupTime = fajrTimeString || '05:00';
      fajrSyncNote = 'الاستيقاظ لصلاة الفجر في أول وقتها لافتتاح اليوم بالبركة والسكينة';
    }
  }

  // Bedtime based on sleep hours
  const sleepHours = answers.targetSleepHours || 7;
  const [wH, wM] = suggestedWakeupTime.split(':').map(Number);
  let bedH = (wH - sleepHours + 24) % 24;
  const suggestedBedtime = `${String(bedH).padStart(2, '0')}:${String(wM || 0).padStart(2, '0')}`;

  // 3. Commute Summary
  const commuteSummary =
    answers.commuteMinutes > 0
      ? `مدة المواصلات: ${answers.commuteMinutes} دقيقة ذهاباً وإياباً (استثمرها في الاستماع للقرآن أو المحتوى النافع)`
      : 'يوم منزلي مرن بدون مواصلات (0 دقيقة هدر - استثمار كامل للوقت)';

  // 4. Cooking Summary & Overrides
  let cookingSummary: string | undefined;
  if (answers.cooksFood) {
    const dur = answers.cookingMinutes || 60;
    const win =
      answers.cookingWindow === 'pre_dhuhr'
        ? 'قبل الظهر (11:30 - 13:00)'
        : answers.cookingWindow === 'after_dhuhr'
        ? 'بعد الظهر (13:30 - 15:00)'
        : answers.cookingWindow === 'pre_maghrib'
        ? 'قبل المغرب (16:30 - 18:00)'
        : 'فترة المساء (19:00 - 20:30)';
    cookingSummary = `فترة الطهي وإعداد الوجبات: ${win} • لمدة تقريبية ${dur} دقيقة`;
  }

  // 5. Workout Summary & Overrides
  let workoutSummary = 'التمارين البدنية المعتادة';
  const stationOverrides: Partial<Record<StationId, StationCustomOverride>> = {};

  if (answers.workoutPreference === 'none_rest') {
    workoutSummary = 'راحة واستجمام وعناية ذاتية (بدون رفع أثقال أو جيم)';
    stationOverrides.GYM_ANCHOR = {
      customTitle: 'واحة الراحة والاسترخاء والعناية الذاتية',
      customShortLabel: 'الراحة والسكينة',
      customSubtitle: '16:00 - 17:30',
    };
  } else if (answers.workoutPreference === 'home_calisthenics') {
    workoutSummary = 'تمارين لياقة منزلية وتمدد خفيف (15-30 دقيقة في البيت)';
    stationOverrides.GYM_ANCHOR = {
      customTitle: 'التمارين المنزلية وتمدد وتنشيط الجسم',
      customShortLabel: 'لياقة منزلية',
      customSubtitle: '16:30 - 17:30',
    };
  } else if (answers.workoutPreference === 'outdoor_walk') {
    workoutSummary = 'مشي في الهواء الطلق واستنشاق الأكسجين';
    stationOverrides.GYM_ANCHOR = {
      customTitle: 'المشي في الهواء الطلق وتصفية الذهن',
      customShortLabel: 'المشي والتأمل',
      customSubtitle: '17:00 - 18:00',
    };
  }

  // If Homemaker, tailor Work & Commute stations
  if (answers.activityType === 'homemaker_cooking') {
    stationOverrides.COMMUTE_MORNING = {
      customTitle: 'سكينة الصباح والورد المنزلي والبركة',
      customShortLabel: 'السكينة والورد',
      customSubtitle: `${suggestedWakeupTime} - 08:30`,
    };
    stationOverrides.WORK_MICRO_SPRINT = {
      customTitle: 'إدارة شؤون المنزل وفترة الطهي الصحي',
      customShortLabel: 'البيت والطهي',
      customSubtitle: '09:00 - 13:00',
    };
  } else if (answers.activityType === 'dedicated_learning') {
    stationOverrides.WORK_MICRO_SPRINT = {
      customTitle: 'جلسات التعلم الذاتي والمتابعة لما أتعلمه',
      customShortLabel: 'مسار التعلم',
      customSubtitle: '09:00 - 13:00',
    };
  } else if (answers.activityType === 'remote_teacher') {
    stationOverrides.WORK_MICRO_SPRINT = {
      customTitle: 'جلسات التدريس والشرح والعمل المرن',
      customShortLabel: 'التدريس والتحضير',
      customSubtitle: 'مواعيد مرنة',
    };
  }

  const stationTimeSlots: Record<string, string> = {
    COMMUTE_MORNING: `${suggestedWakeupTime} - 08:00`,
    WORK_MICRO_SPRINT:
      answers.activityType === 'office_job'
        ? `${answers.workStartHour || 9}:00 - ${answers.workEndHour || 17}:00`
        : '09:00 - 13:00',
    GYM_ANCHOR: '16:30 - 18:00',
    EVENING_SPRINT: '18:30 - 20:30',
    RETROSPECTIVE_CHECKIN: '21:00 - 22:00',
    GRAND_REWARD_STATE: `${suggestedBedtime}+`,
  };

  return {
    suggestedWakeupTime,
    suggestedBedtime,
    fajrSyncNote,
    commuteSummary,
    cookingSummary,
    workoutSummary,
    matchedPersona,
    stationTimeSlots,
    stationOverrides,
  };
}
