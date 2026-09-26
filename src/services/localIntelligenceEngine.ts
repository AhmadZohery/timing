import type { StudyCourse, DeconstructedStep, DailyLog } from '../types';

export interface LocalNLPParseResult {
  title: string;
  category: StudyCourse['category'];
  unitType: StudyCourse['unitType'];
  totalUnits: number;
  completedUnits: number;
  targetDays: number;
  plannedUnitsPerDay: number;
  studyDaysPerWeek: number[];
  reminderTime: string;
  confidence: number; // 0.0 to 1.0
  reasons: string[];
}

export interface VelocityForecast {
  plannedUnitsPerDay: number;
  actualRollingVelocity: number; // units per active day
  expectedFinishDate: string;
  realisticFinishDate: string;
  daysDifference: number; // + ahead, - behind
  burnoutRiskLevel: 'low' | 'moderate' | 'high';
  burnoutAdvice: string;
}

const TOKENS_SAVED_KEY = 'midmar_tokens_saved_counter';
const PARSE_CACHE_KEY = 'midmar_nlp_parse_cache';

/**
 * 100% On-Device Deterministic & Statistical Intelligence Engine.
 * Replaces costly cloud LLM calls with instant (0ms / 0-token) local comprehension.
 */
export class LocalIntelligenceEngine {
  /**
   * Get total estimated tokens saved by running intelligence locally.
   */
  getTokensSaved(): number {
    try {
      const val = localStorage.getItem(TOKENS_SAVED_KEY);
      return val ? parseInt(val, 10) : 0;
    } catch (_) {
      return 0;
    }
  }

  /**
   * Record tokens saved into persistent counter.
   */
  recordTokensSaved(approxTokens: number = 650) {
    try {
      const current = this.getTokensSaved();
      localStorage.setItem(TOKENS_SAVED_KEY, String(current + approxTokens));
    } catch (_) {}
  }

  /**
   * Check local semantic cache before calling any parser.
   */
  getCachedParse(prompt: string): LocalNLPParseResult | null {
    try {
      const cacheStr = localStorage.getItem(PARSE_CACHE_KEY);
      if (!cacheStr) return null;
      const cache = JSON.parse(cacheStr);
      const key = prompt.trim().toLowerCase();
      return cache[key] || null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Store parse result in local LRU cache.
   */
  setCachedParse(prompt: string, result: LocalNLPParseResult) {
    try {
      const cacheStr = localStorage.getItem(PARSE_CACHE_KEY);
      const cache = cacheStr ? JSON.parse(cacheStr) : {};
      const key = prompt.trim().toLowerCase();
      // Keep up to 50 cached queries
      const keys = Object.keys(cache);
      if (keys.length > 50) {
        delete cache[keys[0]];
      }
      cache[key] = result;
      localStorage.setItem(PARSE_CACHE_KEY, JSON.stringify(cache));
    } catch (_) {}
  }

  /**
   * High-Precision Arabic & Multilingual Natural Language Course Parser.
   * Parses titles, unit quantities, completion status, durations, and rest days locally.
   */
  parseCourseIntent(prompt: string): LocalNLPParseResult {
    // Check cache first (0 tokens)
    const cached = this.getCachedParse(prompt);
    if (cached) {
      this.recordTokensSaved(500);
      return cached;
    }

    const text = prompt.trim();
    const lower = text.toLowerCase();
    const reasons: string[] = [];
    let confidenceScore = 0.5;

    // 1. Detect Category
    let category: StudyCourse['category'] = 'other';
    if (/(بايثون|برمج|كود|رياكت|جافا|ويب|فرونت|باك|تطبيق|html|css|js|ts|python|flutter|كودينج|ذكاء اصطناعي|ماشين ليرنينج|data|ai)/i.test(lower)) {
      category = 'programming';
      reasons.push('تم استنتاج تصنيف برمجة وتقنية');
    } else if (/(إنجليز|لغ|محادث|كلمات|grammar|english|french|ielts|toefl|ألماني|تركي|لغات)/i.test(lower)) {
      category = 'languages';
      reasons.push('تم استنتاج تصنيف لغات ومحادثة');
    } else if (/(فقه|عقيدة|تفسير|حديث|قرآن|شرع|سيرة|تجويد|أصول|مصطلح|إسلامي)/i.test(lower)) {
      category = 'sharia';
      reasons.push('تم استنتاج تصنيف علوم شرعية وقرآنية');
    } else if (/(تسويق|إدار|بزنس|مشروع|مبيعات|marketing|business|تجارة|إعلانات)/i.test(lower)) {
      category = 'business';
      reasons.push('تم استنتاج تصنيف ريادة وإدارة أعمال');
    } else if (/(كتاب|فصل|رواية|قراءة|صفحة|كتيب|مطالعة)/i.test(lower)) {
      category = 'reading';
      reasons.push('تم استنتاج تصنيف قراءة وكتب');
    } else if (/(تصميم|ui|ux|ديزاين|فوتوشوب|figma|مونتاج|جرافيك)/i.test(lower)) {
      category = 'design';
      reasons.push('تم استنتاج تصنيف تصميم ومونتاج');
    } else if (/(جامع|امتحان|مذاكر|مادة|منهج|كلية|ثانوي|فيزياء|كيمياء|رياضيات|محاضرة)/i.test(lower)) {
      category = 'academic';
      reasons.push('تم استنتاج تصنيف دراسة أكاديمية');
    }

    // 2. Detect Unit Type
    let unitType: StudyCourse['unitType'] = 'lesson';
    if (/(فيديو|مقطع|فيديوهات|clips|مقاطع)/i.test(lower)) {
      unitType = 'video';
      reasons.push('وحدة التعلم: فيديوهات');
    } else if (/(فصل|شابتر|باب|chapters|أبواب)/i.test(lower)) {
      unitType = 'chapter';
      reasons.push('وحدة التعلم: فصول');
    } else if (/(صفحة|صفحات|pages)/i.test(lower)) {
      unitType = 'page';
      reasons.push('وحدة التعلم: صفحات');
    } else if (/(ساعة|ساعات|hours)/i.test(lower)) {
      unitType = 'hour';
      reasons.push('وحدة التعلم: ساعات');
    } else {
      reasons.push('وحدة التعلم: دروس افتراضية');
    }

    // 3. Extract Total Units
    let totalUnits = 20;
    // Pattern A: "40 فيديو" or "60 درس" or "20 فصل" or "150 صفحة"
    const unitsMatch = lower.match(/(\d+)\s*(فيديو|مقطع|درس|دروس|فصل|فصول|شابتر|صفحة|صفحات|ساعة|ساعات|محاضرة|محاضرات|حصص|حصة)/);
    if (unitsMatch && unitsMatch[1]) {
      totalUnits = parseInt(unitsMatch[1], 10);
      confidenceScore += 0.2;
      reasons.push(`رصد إجمالي المحتوى: ${totalUnits}`);
    } else {
      // General first number
      const anyNum = lower.match(/(\d+)/);
      if (anyNum && anyNum[1]) {
        totalUnits = parseInt(anyNum[1], 10);
        confidenceScore += 0.1;
      }
    }

    // 4. Extract Completed Units (e.g. "خلصت منه 5" or "أنهيت 8")
    let completedUnits = 0;
    const completedMatch = lower.match(/(خلصت|أنهيت|معايا|مخلص|بادئ من|منجز)\s*(\d+)/);
    if (completedMatch && completedMatch[2]) {
      completedUnits = Math.min(totalUnits, parseInt(completedMatch[2], 10));
      reasons.push(`رصد وحدات منجزة مسبقاً: ${completedUnits}`);
      confidenceScore += 0.1;
    }

    // 5. Extract Duration in Days or Weeks or Months
    let targetDays = 14;
    const daysMatch = lower.match(/(?:في|خلال|لمدة)?\s*(\d+)\s*(يوم|أيام|ايام)/);
    const weeksMatch = lower.match(/(?:في|خلال|لمدة)?\s*(\d+)?\s*(أسبوع|اسبوع|اسبوعين|أسبوعين|أسابيع|اسابيع)/);
    const monthsMatch = lower.match(/(?:في|خلال|لمدة)?\s*(\d+)?\s*(شهر|شهور|شهرين)/);

    if (daysMatch && daysMatch[1]) {
      targetDays = parseInt(daysMatch[1], 10);
      confidenceScore += 0.15;
      reasons.push(`المدة المستهدفة: ${targetDays} يوماً`);
    } else if (weeksMatch) {
      const wCount = weeksMatch[1] ? parseInt(weeksMatch[1], 10) : (lower.includes('أسبوعين') || lower.includes('اسبوعين') ? 2 : 1);
      targetDays = wCount * 7;
      confidenceScore += 0.15;
      reasons.push(`المدة المستهدفة: ${targetDays} يوماً (${wCount} أسابيع)`);
    } else if (monthsMatch) {
      const mCount = monthsMatch[1] ? parseInt(monthsMatch[1], 10) : (lower.includes('شهرين') ? 2 : 1);
      targetDays = mCount * 30;
      confidenceScore += 0.15;
      reasons.push(`المدة المستهدفة: ${targetDays} يوماً (${mCount} شهر)`);
    }

    // 6. Extract Daily Quota (e.g. "بمعدل 4 فيديوهات يومياً" or "كل يوم 2")
    let plannedUnitsPerDay = Math.max(1, Math.ceil(totalUnits / Math.max(1, targetDays)));
    const quotaMatch = lower.match(/(?:بمعدل|كل يوم|يوميا|يومياً)\s*(\d+)/);
    if (quotaMatch && quotaMatch[1]) {
      plannedUnitsPerDay = parseInt(quotaMatch[1], 10);
      confidenceScore += 0.15;
      reasons.push(`المعدل اليومي المطلوب: ${plannedUnitsPerDay} وحدات`);
      // Re-adjust target days if not explicitly specified
      if (!daysMatch && !weeksMatch && !monthsMatch) {
        targetDays = Math.ceil(totalUnits / plannedUnitsPerDay);
      }
    }

    // 7. Rest Days Detection
    // Default: Saturday to Thursday (Friday off) -> [0, 1, 2, 3, 4, 6] (5 is Friday)
    let studyDaysPerWeek = [0, 1, 2, 3, 4, 6];
    if (/(بدون راحة|كل يوم|طوال الأسبوع|يومياً بدون توقف)/.test(lower)) {
      studyDaysPerWeek = [0, 1, 2, 3, 4, 5, 6];
      reasons.push('الجدول: 7 أيام أسبوعياً بدون استراحة');
    } else if (/(الجمعة راحة|جمعة راحة|إجازة الجمعة)/.test(lower)) {
      studyDaysPerWeek = [0, 1, 2, 3, 4, 6];
      reasons.push('الجمعة يوم استراحة وتعويض');
    } else if (/(الجمعة والسبت راحة|ويك إند راحة|إجازة نهاية الأسبوع)/.test(lower)) {
      studyDaysPerWeek = [0, 1, 2, 3, 4]; // Sun to Thu
      reasons.push('الجمعة والسبت أيام استراحة');
    }

    // 8. Extract Clean Course Title
    let title = text
      .replace(/(بذاكر|عاوز أذاكر|أريد دراسة|كورس|دورة|مادة|كتاب|في \d+ يوم|في شهر|بمعدل \d+.*|الجمعة راحة)/gi, '')
      .replace(/[،,.]/g, '')
      .trim();

    if (!title || title.length < 2) {
      if (category === 'programming') title = 'مسار البرمجة والتطوير';
      else if (category === 'languages') title = 'كورس إتقان اللغة';
      else if (category === 'sharia') title = 'مدارسة العلوم الشرعية';
      else if (category === 'reading') title = 'قراءة كتاب وتلخيصه';
      else title = 'خطة التعلم الذاتي';
    } else {
      confidenceScore += 0.1;
      reasons.push(`عنوان الكورس المستنتج: "${title}"`);
    }

    // 9. Reminder Time
    let reminderTime = '17:00';
    if (/(الصبح|صباحا|صباحاً|الفجر|باكرا)/.test(lower)) reminderTime = '07:30';
    else if (/(الظهر|ظهرا)/.test(lower)) reminderTime = '13:00';
    else if (/(العصر|عصرا)/.test(lower)) reminderTime = '16:00';
    else if (/(المغرب|بعد المغرب)/.test(lower)) reminderTime = '18:30';
    else if (/(العشاء|بالليل|مساء|مساءً)/.test(lower)) reminderTime = '21:00';

    const result: LocalNLPParseResult = {
      title,
      category,
      unitType,
      totalUnits: Math.max(1, totalUnits),
      completedUnits: Math.max(0, completedUnits),
      targetDays: Math.max(1, targetDays),
      plannedUnitsPerDay: Math.max(1, plannedUnitsPerDay),
      studyDaysPerWeek,
      reminderTime,
      confidence: Math.min(0.98, confidenceScore),
      reasons,
    };

    // Cache local result and record token savings
    this.setCachedParse(prompt, result);
    this.recordTokensSaved(650);

    return result;
  }

  /**
   * Deconstruct any complex task into 3 atomic micro-steps locally without calling AI.
   * Consumes 0 tokens.
   */
  deconstructTaskLocally(taskTitle: string, unitType: string = 'درس'): DeconstructedStep[] {
    this.recordTokensSaved(350);
    const cleanTitle = taskTitle.trim() || unitType;
    return [
      {
        title: `تهيئة البيئة ومصادر "${cleanTitle}" وتحديد نقطة الانطلاق (Zero Friction)`,
        durationMin: 3,
        completed: false,
      },
      {
        title: `الاستيعاب المركز للنصف الأول وتدوين ملخص أو فكرة رئيسية واحدة من "${cleanTitle}"`,
        durationMin: 12,
        completed: false,
      },
      {
        title: `مراجعة سريعة لما تم فهمه وتأكيد إنجاز "${cleanTitle}" في المسار`,
        durationMin: 5,
        completed: false,
      },
    ];
  }

  /**
   * Velocity & Burnout Forecaster based on actual historical logs.
   */
  computeVelocityForecast(course: StudyCourse, dailyLogs: DailyLog[]): VelocityForecast {
    const plannedUnitsPerDay = course.plannedUnitsPerDay || 2;
    const remainingUnits = Math.max(0, course.totalUnits - course.completedUnits);

    // Look at logs for this course or general productivity over last 14 days
    const recentLogs = dailyLogs.slice(0, 14);
    const activeDaysCount = recentLogs.filter((l) => (l.focusSessionsCount || 0) > 0 || l.completedStations.length > 0).length || 1;
    
    // Average completed per active day (rolling velocity)
    const rollingVelocity = course.completedUnits > 0
      ? Math.max(0.5, Number((course.completedUnits / Math.max(1, activeDaysCount)).toFixed(1)))
      : plannedUnitsPerDay;

    // Realistic days needed
    const realisticDaysNeeded = Math.ceil(remainingUnits / rollingVelocity);
    const realisticDate = new Date();
    realisticDate.setDate(realisticDate.getDate() + realisticDaysNeeded);
    const realisticFinishDate = realisticDate.toISOString().split('T')[0];

    // Difference between target and realistic
    const targetDate = new Date(course.targetEndDate);
    const diffDays = Math.round((targetDate.getTime() - realisticDate.getTime()) / (1000 * 60 * 60 * 24));

    // Burnout Index Evaluation
    let burnoutRiskLevel: VelocityForecast['burnoutRiskLevel'] = 'low';
    let burnoutAdvice = 'مسارك متوازن ومستقر، استمر على هذا الإيقاع الرشيق 🌿';

    const backlogPct = course.backlogUnits / Math.max(1, course.totalUnits);
    if (backlogPct >= 0.35 || course.recommendedDailyUnits >= plannedUnitsPerDay * 2) {
      burnoutRiskLevel = 'high';
      burnoutAdvice = 'تنبيه إرهاق: تراكم أكثر من 35% من الكورس. ننصح بشدة بتفعيل خيار "تمديد الموعد بلطف" لحماية الاستمرارية.';
    } else if (backlogPct >= 0.15 || course.recommendedDailyUnits > plannedUnitsPerDay * 1.3) {
      burnoutRiskLevel = 'moderate';
      burnoutAdvice = 'إيقاعك يتطلب انتباهاً: سبرنت تعويضي في يوم الراحة كفيل بإعادة التوازن الكامل دون إرهاق.';
    }

    return {
      plannedUnitsPerDay,
      actualRollingVelocity: rollingVelocity,
      expectedFinishDate: course.targetEndDate,
      realisticFinishDate,
      daysDifference: diffDays,
      burnoutRiskLevel,
      burnoutAdvice,
    };
  }
}

export const localIntelligence = new LocalIntelligenceEngine();
