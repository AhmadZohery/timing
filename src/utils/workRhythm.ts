import type { DayWorkRhythm, ProfessionDomain, WeekendPreset, WorkRhythmConfig } from '../types';

export const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// 0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday, 5: Friday, 6: Saturday
export const WEEKEND_PRESET_MAPS: Record<WeekendPreset, Record<number, DayWorkRhythm>> = {
  friday_saturday: {
    0: 'full_day',
    1: 'full_day',
    2: 'full_day',
    3: 'full_day',
    4: 'full_day',
    5: 'friday_special',
    6: 'rest_day',
  },
  sat_half_sun_off: {
    0: 'rest_day',
    1: 'full_day',
    2: 'full_day',
    3: 'full_day',
    4: 'full_day',
    5: 'friday_special',
    6: 'half_day',
  },
  saturday_sunday: {
    0: 'rest_day',
    1: 'full_day',
    2: 'full_day',
    3: 'full_day',
    4: 'full_day',
    5: 'friday_special',
    6: 'rest_day',
  },
  friday_only: {
    0: 'full_day',
    1: 'full_day',
    2: 'full_day',
    3: 'full_day',
    4: 'full_day',
    5: 'friday_special',
    6: 'full_day',
  },
  custom: {
    0: 'rest_day',
    1: 'full_day',
    2: 'full_day',
    3: 'full_day',
    4: 'full_day',
    5: 'friday_special',
    6: 'half_day',
  },
};

export const DEFAULT_WORK_RHYTHM_CONFIG: WorkRhythmConfig = {
  preset: 'friday_saturday',
  dayTypes: { ...WEEKEND_PRESET_MAPS.friday_saturday },
  saturdayType: 'off',
  sundayType: 'full_day',
  workdaySessionsTarget: 5,
  halfDaySessionsTarget: 2,
};

export const WEEKEND_PRESETS_INFO: Array<{
  id: WeekendPreset;
  titleAr: string;
  titleEn: string;
  descAr: string;
  badge: string;
}> = [
  {
    id: 'friday_saturday',
    titleAr: 'عطلة الجمعة والسبت (النظام العربي / الإسلامي)',
    titleEn: 'Friday & Saturday Weekend',
    descAr: 'الجمعة عبادة وسنن وراحة، والسبت عطلة واستجمام، والأحد إلى الخميس عمل كامل.',
    badge: '🕌 عربي / إسلامي',
  },
  {
    id: 'sat_half_sun_off',
    titleAr: 'السبت نصف يوم عمل + الأحد عطلة كاملة',
    titleEn: 'Saturday Half-Day + Sunday Off',
    descAr: 'السبت مهام تركيز سريعة، والأحد راحة تامة واستجمام، وباقي الأسبوع عمل كامل.',
    badge: '⚡ نصف سبت + أحد',
  },
  {
    id: 'saturday_sunday',
    titleAr: 'عطلة السبت والأحد (النظام الدولي / الريموت)',
    titleEn: 'Saturday & Sunday Weekend',
    descAr: 'السبت والأحد عطلة أسبوعية، ومن الإثنين إلى الجمعة أيام عمل كاملة.',
    badge: '🌍 دولي / ريموت',
  },
  {
    id: 'friday_only',
    titleAr: 'عطلة الجمعة فقط (نظام 6 أيام عمل)',
    titleEn: 'Friday Only Off (6-Day Week)',
    descAr: 'الجمعة يوم الراحة والعبادة الوحيد، ومن السبت إلى الخميس أيام عمل كاملة.',
    badge: '💼 6 أيام عمل',
  },
  {
    id: 'custom',
    titleAr: 'تخصيص حر لكل يوم من أيام الأسبوع',
    titleEn: 'Custom Daily Schedule',
    descAr: 'حدد بنفسك طبيعة كل يوم: عمل كامل، نصف يوم خفيف، أو عطلة استجمام وحماية للشعلة.',
    badge: '🛠️ تخصيص حر',
  },
];

export interface WorkRhythmInfo {
  rhythm: DayWorkRhythm;
  dayIndex: number; // 0: Sunday, 6: Saturday
  dayNameAr: string;
  dayNameEn: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  targetSessions: number;
  isRestDay: boolean;
  isHalfDay: boolean;
  isFriday: boolean;
  accentColor: string;
  badgeAr: string;
}

export function getDayWorkRhythmType(
  dayIndex: number,
  config: WorkRhythmConfig = DEFAULT_WORK_RHYTHM_CONFIG
): DayWorkRhythm {
  if (config.preset === 'custom' && config.dayTypes?.[dayIndex]) {
    return config.dayTypes[dayIndex];
  }
  if (config.preset && WEEKEND_PRESET_MAPS[config.preset]) {
    return WEEKEND_PRESET_MAPS[config.preset][dayIndex] || 'full_day';
  }
  if (config.dayTypes?.[dayIndex]) {
    return config.dayTypes[dayIndex];
  }
  // Backward compatibility fallback:
  if (dayIndex === 0 && config.sundayType === 'rest_day') return 'rest_day';
  if (dayIndex === 6 && config.saturdayType === 'half_day') return 'half_day';
  if (dayIndex === 6 && config.saturdayType === 'off') return 'rest_day';
  if (dayIndex === 5) return 'friday_special';
  return 'full_day';
}

export function getTodayWorkRhythm(
  date: Date = new Date(),
  config: WorkRhythmConfig = DEFAULT_WORK_RHYTHM_CONFIG
): WorkRhythmInfo {
  const dayIndex = date.getDay();
  const dayNameAr = DAYS_AR[dayIndex];
  const dayNameEn = DAYS_EN[dayIndex];
  const rhythmType = getDayWorkRhythmType(dayIndex, config);

  if (rhythmType === 'rest_day') {
    return {
      rhythm: 'rest_day',
      dayIndex,
      dayNameAr,
      dayNameEn,
      titleAr: `واحة الراحة والتجديد (عطلة ${dayNameAr})`,
      titleEn: `Rest & Recharge Oasis (${dayNameEn})`,
      descAr: `${dayNameAr} هو يوم عطلتك واستجمامك: تم تخفيف ضغط العمل، ولا يوجد إجبار على مهام، وشعلتك (Streak) محميّة بالكامل!`,
      targetSessions: 0,
      isRestDay: true,
      isHalfDay: false,
      isFriday: dayIndex === 5,
      accentColor: 'emerald',
      badgeAr: `🌴 عطلة ${dayNameAr}`,
    };
  }

  if (rhythmType === 'half_day') {
    return {
      rhythm: 'half_day',
      dayIndex,
      dayNameAr,
      dayNameEn,
      titleAr: `نصف يوم عمل ذكي (${dayNameAr})`,
      titleEn: `Focused Half-Day (${dayNameEn})`,
      descAr: `${dayNameAr} نصف يوم عمل: أنجز 2-3 مهام تركيز سريعة قبل الظهيرة، ثم تفرغ للراحة والتنفس دون تأنيب ضمير.`,
      targetSessions: config.halfDaySessionsTarget || 2,
      isRestDay: false,
      isHalfDay: true,
      isFriday: dayIndex === 5,
      accentColor: 'amber',
      badgeAr: `⚡ نصف يوم (${dayNameAr})`,
    };
  }

  if (rhythmType === 'friday_special') {
    return {
      rhythm: 'friday_special',
      dayIndex,
      dayNameAr,
      dayNameEn,
      titleAr: 'جمعة مباركة وسنن وصلة رحم',
      titleEn: 'Blessed Friday',
      descAr: 'يوم مبارك: تركيز على صلاة الجمعة، سورة الكهف، الأذكار، والاسترخاء مع الأهل والأحباب.',
      targetSessions: 1,
      isRestDay: false,
      isHalfDay: false,
      isFriday: true,
      accentColor: 'indigo',
      badgeAr: '🕌 جمعة مباركة',
    };
  }

  // Standard Weekday
  return {
    rhythm: 'full_day',
    dayIndex,
    dayNameAr,
    dayNameEn,
    titleAr: 'يوم إنجاز وتركيز عميق',
    titleEn: 'Deep Focus Workday',
    descAr: 'يوم عمل كامل: استهدف 4-5 جلسات عمل عميق مع فترات راحة ذكية ومحافظة على الصلوات.',
    targetSessions: config.workdaySessionsTarget || 5,
    isRestDay: false,
    isHalfDay: false,
    isFriday: false,
    accentColor: 'emerald',
    badgeAr: '🎯 عمل كامل',
  };
}

export interface DomainPreset {
  domain: ProfessionDomain;
  titleAr: string;
  titleEn: string;
  icon: string;
  roleExamples: string[];
  weekdayTasks: Array<{ title: string; durationMin: number; category: string }>;
  halfDayTasks: Array<{ title: string; durationMin: number; category: string }>;
  restDayIdeas: string[];
}

export const DOMAIN_PRESETS: Record<ProfessionDomain, DomainPreset> = {
  software_dev: {
    domain: 'software_dev',
    titleAr: 'تطوير البرمجيات وهندسة الكود',
    titleEn: 'Software Engineering',
    icon: '💻',
    roleExamples: ['Full-Stack Developer', 'Frontend Engineer', 'Backend Dev', 'Mobile Dev', 'DevOps'],
    weekdayTasks: [
      { title: 'كتابة فيوتشر جديدة (Feature Implementation)', durationMin: 45, category: 'deep_work' },
      { title: 'مراجعة كود الزملاء (Pull Request Review)', durationMin: 25, category: 'review' },
      { title: 'إصلاح Bug حرج واختباره', durationMin: 30, category: 'debugging' },
      { title: 'كتابة Unit / Integration Tests', durationMin: 25, category: 'quality' },
      { title: 'قراءة توثيق تقني أو بحث معماري', durationMin: 20, category: 'research' },
    ],
    halfDayTasks: [
      { title: 'Merge الفروع وتنظيف الـ Branches', durationMin: 20, category: 'admin' },
      { title: 'حل مشكلة تقنية خفيفة أو توثيق API', durationMin: 25, category: 'docs' },
      { title: 'تجهيز قائمة مهام الأسبوع القادم', durationMin: 15, category: 'planning' },
    ],
    restDayIdeas: [
      'الابتعاد التام عن الشاشات والجلوس في الطبيعة',
      'الاستماع لبودكاست تقني خفيف أو قصة نجاح ملهمة',
      'ترتيب بيئة ومكتب العمل لاستقبال الأسبوع الجديد بنشاط',
    ],
  },
  ui_ux_design: {
    domain: 'ui_ux_design',
    titleAr: 'تصميم واجهات وتجربة المستخدم',
    titleEn: 'UI/UX & Product Design',
    icon: '🎨',
    roleExamples: ['UI Designer', 'UX Researcher', 'Product Designer', 'Graphic Artist'],
    weekdayTasks: [
      { title: 'تصميم شاشات رئيسية في Figma', durationMin: 45, category: 'design' },
      { title: 'تحليل رحلة المستخدم وإعداد Wireframes', durationMin: 35, category: 'ux' },
      { title: 'بناء وتحديث مكونات Design System', durationMin: 30, category: 'system' },
      { title: 'مراجعة الملاحظات وتعديل النماذج', durationMin: 25, category: 'feedback' },
      { title: 'اختبار قابلية الاستخدام ومشاركة النموذج', durationMin: 20, category: 'testing' },
    ],
    halfDayTasks: [
      { title: 'تصدير الملفات والـ Assets للمطورين', durationMin: 20, category: 'handover' },
      { title: 'تنظيم طبقات ومجلدات Figma', durationMin: 20, category: 'tidy' },
      { title: 'تحديث نماذج الـ Portfolio الشخصي', durationMin: 25, category: 'portfolio' },
    ],
    restDayIdeas: [
      'تغذية بصرية حرة بدون قيود عمل',
      'رسم حر يدوي بالقلم والورق',
      'جلسة تأمل واستراحة للعينين والظهر',
    ],
  },
  student_academia: {
    domain: 'student_academia',
    titleAr: 'التعليم والبحث الأكاديمي',
    titleEn: 'Student & Academic Research',
    icon: '📚',
    roleExamples: ['طالب جامعي', 'باحث ماجستير/دكتوراه', 'متعلم ذاتي'],
    weekdayTasks: [
      { title: 'مذاكرة وتلخيص محاضرة جديدة', durationMin: 40, category: 'study' },
      { title: 'حل تمارين وتطبيقات عملية وشيتات', durationMin: 35, category: 'practice' },
      { title: 'قراءة بحث علمي وتدوين النقاط الرئيسية', durationMin: 30, category: 'research' },
      { title: 'مراجعة بطاقات الفلاش (Spaced Repetition)', durationMin: 20, category: 'review' },
      { title: 'كتابة جزء من تقرير أو مشروع التخرج', durationMin: 35, category: 'writing' },
    ],
    halfDayTasks: [
      { title: 'مراجعة سريعة لما تم إنجازه طوال الأسبوع', durationMin: 25, category: 'recap' },
      { title: 'ترتيب ملخصات ومجلدات المواد الدراسية', durationMin: 20, category: 'organization' },
    ],
    restDayIdeas: [
      'نوم عميق لتعويض إجهاد الأسبوع الدراسي',
      'نزهة مع أصدقاء الدراسة بدون حديث عن الامتحانات',
      'ممارسة رياضة خفيفة وتجديد النشاط البدني',
    ],
  },
  business_freelance: {
    domain: 'business_freelance',
    titleAr: 'العمل الحر وريادة الأعمال',
    titleEn: 'Freelance & Business',
    icon: '💼',
    roleExamples: ['مستقل Freelancer', 'صاحب مشروع ناشئ', 'مسوق رقمي', 'مدير مشاريع'],
    weekdayTasks: [
      { title: 'تنفيذ تسليمات حاسمة للمشروع الحالي', durationMin: 45, category: 'delivery' },
      { title: 'التواصل مع العملاء والرد على الاستفسارات', durationMin: 20, category: 'client' },
      { title: 'إرسال مقترحات وعروض مشاريع جديدة (Proposals)', durationMin: 30, category: 'sales' },
      { title: 'تطوير محتوى تسويقي أو منشورات متخصصة', durationMin: 25, category: 'marketing' },
      { title: 'إدارة الفواتير والمدفوعات والميزانية', durationMin: 20, category: 'finance' },
    ],
    halfDayTasks: [
      { title: 'مراجعة الدفعات وإصدار الفواتير الأسبوعية', durationMin: 20, category: 'invoices' },
      { title: 'أرشفة المشاريع المنتهية وترتيب ملفات Drive', durationMin: 20, category: 'archive' },
      { title: 'وضع أهداف الأسبوع المالي والمهني القادم', durationMin: 15, category: 'goals' },
    ],
    restDayIdeas: [
      'إيقاف إشعارات الإيميل وتطبيقات العمل كلياً',
      'قضاء وقت نوعي مع العائلة',
      'قراءة كتاب في التطوير الذاتي بعيداً عن ضغوط الأرقام',
    ],
  },
  healthcare: {
    domain: 'healthcare',
    titleAr: 'المجال الطبي والرعاية الصحية',
    titleEn: 'Healthcare & Medicine',
    icon: '🩺',
    roleExamples: ['طبيب', 'صيدلي', 'أخصائي علاج طبيعي', 'ممرض'],
    weekdayTasks: [
      { title: 'متابعة سجلات الحالات وملاحظات التطور', durationMin: 35, category: 'clinical' },
      { title: 'قراءة أحدث الدلائل الإرشادية (Guidelines)', durationMin: 25, category: 'guidelines' },
      { title: 'جلسة تعليم طبي مستمر (CME Module)', durationMin: 30, category: 'cme' },
      { title: 'تنظيم جدول النوبتجيات والمناوبات', durationMin: 20, category: 'admin' },
    ],
    halfDayTasks: [
      { title: 'تلخيص حالات الأسبوع المعقدة لمناقشتها', durationMin: 25, category: 'case_review' },
      { title: 'تنظيم الحقيبة والمراجع الطبية', durationMin: 15, category: 'prep' },
    ],
    restDayIdeas: [
      'راحة جسدية كاملة واسترخاء عضلي',
      'المشي الهادئ لتصفية الذهن',
      'لقاء عائلي وتناول وجبة صحية متوازنة',
    ],
  },
  custom: {
    domain: 'custom',
    titleAr: 'مجال مخصص / عام',
    titleEn: 'Custom / General',
    icon: '⭐',
    roleExamples: ['محترف متخصص', 'صانع محتوى', 'متعدد الاهتمامات'],
    weekdayTasks: [
      { title: 'جلسة عمل عميق بدون مقاطعات', durationMin: 40, category: 'focus' },
      { title: 'إنهاء مهمة إدارية معلقة', durationMin: 25, category: 'admin' },
      { title: 'تعلّم مهارة جديدة لمدة 20 دقيقة', durationMin: 20, category: 'learning' },
      { title: 'تنظيم الملفات والمهام', durationMin: 15, category: 'org' },
    ],
    halfDayTasks: [
      { title: 'إنهاء آخر مهمة عالقة لهذا الأسبوع', durationMin: 30, category: 'wrapup' },
      { title: 'تنظيم مساحة العمل والملاحظات', durationMin: 20, category: 'tidy' },
    ],
    restDayIdeas: [
      'قضاء يوم هادئ مع الهوايات المفضلة',
      'ممارسة الرياضة في الهواء الطلق',
      'راحة تامة وتغذية عقلية وروحية',
    ],
  },
};
