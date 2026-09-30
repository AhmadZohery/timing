import type { StudyCourse, DeconstructedStep, DailyLog, ReminderCategory, ReminderRecurrence } from '../types';

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

export interface LocalReminderNLPResult {
  title: string;
  time: string; // HH:mm format
  category: ReminderCategory;
  recurrence: ReminderRecurrence;
  confidence: number; // 0.0 to 1.0
  explanation: string;
  detectedDelayMins?: number;
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
    } catch {
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
    } catch {}
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
    } catch {
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
    } catch {}
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

  /**
   * High-Precision Arabic & Multilingual Natural Language Reminder & Alarm Parser.
   * Extracts clean titles, relative time offsets, clock times, recurrences, and categories locally (0 tokens).
   */
  parseReminderIntent(prompt: string): LocalReminderNLPResult {
    const text = prompt.trim();
    const lower = text.toLowerCase();
    let confidence = 0.5;
    const explanations: string[] = [];

    // 1. Recurrence
    let recurrence: ReminderRecurrence = 'once';
    if (/(كل يوم|يوميا|يومياً|طوال الأسبوع|daily|every day)/i.test(lower)) {
      recurrence = 'daily';
      confidence += 0.15;
      explanations.push('التكرار: يومياً');
    } else if (/(أيام العمل|أيام الشغل|من الأحد للخميس|weekdays|workdays)/i.test(lower)) {
      recurrence = 'weekdays';
      confidence += 0.15;
      explanations.push('التكرار: أيام العمل');
    } else {
      explanations.push('التكرار: اليوم فقط');
    }

    // 2. Category
    let category: ReminderCategory = 'custom';
    if (/(ماء|شرب|مية|دواء|علاج|فيتامين|قطرة|صيدلية|طبيب|دكتور|حبوب|مسكن|فحص|صحة|water|medicine|pill)/i.test(lower)) {
      category = 'health';
      confidence += 0.15;
      explanations.push('التصنيف: صحة وعافية');
    } else if (/(شغل|اجتماع|ميتينج|مكالمة|تسليم|عميل|بريد|إيميل|مهمة|ريبورت|مشروع|تيم|work|meeting|call)/i.test(lower)) {
      category = 'work';
      confidence += 0.15;
      explanations.push('التصنيف: عمل ومتابعات');
    } else if (/(كورس|مذاكرة|درس|كتاب|قراءة|حفظ|مراجعة|تلاوة|محاضرة|واجب|بحث|study|course|read)/i.test(lower)) {
      category = 'learning';
      confidence += 0.15;
      explanations.push('التصنيف: تعلم ودراسة');
    } else if (/(مشي|رياضة|تمرين|جيم|ضغط|إطالة|حركة|جري|كارديو|عضلات|walk|gym|workout)/i.test(lower)) {
      category = 'fitness';
      confidence += 0.15;
      explanations.push('التصنيف: لياقة وحركة');
    } else if (/(صلاة|استغفار|ذكر|تسبيح|ورد|قيام|قرآن|بقرة|أذكار|توبة|دعاء|prayer|dhikr)/i.test(lower)) {
      category = 'spiritual';
      confidence += 0.15;
      explanations.push('التصنيف: روحانيات وأذكار');
    }

    // 3. Time detection
    const now = new Date();
    let targetTime = '';
    let detectedDelayMins: number | undefined;

    // Relative offset patterns
    if (/(بعد|كمان|in)\s*(ربع\s*ساعة|15\s*min|15\s*دقيقة)/i.test(lower)) {
      detectedDelayMins = 15;
    } else if (/(بعد|كمان|in)\s*(ثلث\s*ساعة|20\s*min|20\s*دقيقة)/i.test(lower)) {
      detectedDelayMins = 20;
    } else if (/(بعد|كمان|in)\s*(نص|نصف)\s*ساعة|half\s*an?\s*hour|30\s*min/i.test(lower)) {
      detectedDelayMins = 30;
    } else if (/(بعد|كمان)\s*ساعة\s*إلا\s*ربع|45\s*min|45\s*دقيقة/i.test(lower)) {
      detectedDelayMins = 45;
    } else if (/(بعد|كمان|in)\s*(ساعتين|2\s*hours)/i.test(lower)) {
      detectedDelayMins = 120;
    } else if (/(بعد|كمان|in)\s*(ساعة|an?\s*hour)/i.test(lower)) {
      detectedDelayMins = 60;
    } else {
      const minMatch = lower.match(/(?:بعد|كمان|خلال|في|in)\s*(\d+)\s*(?:دقيقة|دقائق|د|mins?|minutes?)/i);
      if (minMatch && minMatch[1]) {
        detectedDelayMins = parseInt(minMatch[1], 10);
      } else {
        const hrMatch = lower.match(/(?:بعد|كمان|خلال|في|in)\s*(\d+)\s*(?:ساعة|ساعات|س|hrs?|hours?)/i);
        if (hrMatch && hrMatch[1]) {
          detectedDelayMins = parseInt(hrMatch[1], 10) * 60;
        }
      }
    }

    if (detectedDelayMins !== undefined) {
      const future = new Date(now.getTime() + detectedDelayMins * 60 * 1000);
      const h = String(future.getHours()).padStart(2, '0');
      const m = String(future.getMinutes()).padStart(2, '0');
      targetTime = `${h}:${m}`;
      confidence += 0.25;
      explanations.push(`الموعد: بعد ${detectedDelayMins} دقيقة (${targetTime})`);
    } else {
      // Explicit clock time patterns
      const explicitTimeMatch = lower.match(/(?:الساعة|at)?\s*(\d{1,2})(?::(\d{2}))?\s*(صباحا|صباحاً|ص|مساء|مساءً|م|بالليل|عصرا|عصراً|ظهرا|ظهراً|am|pm)?/i);
      if (explicitTimeMatch && explicitTimeMatch[1]) {
        let hour = parseInt(explicitTimeMatch[1], 10);
        const minute = explicitTimeMatch[2] ? parseInt(explicitTimeMatch[2], 10) : 0;
        const period = explicitTimeMatch[3] ? explicitTimeMatch[3].toLowerCase() : '';

        const isPM = /(مساء|مساءً|م|بالليل|عصرا|عصراً|ظهرا|ظهراً|pm)/i.test(period);
        const isAM = /(صباحا|صباحاً|ص|am)/i.test(period);

        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;

        // Auto PM inference if hour is small and already passed in AM
        if (!period && hour <= 11 && now.getHours() >= hour + 2) {
          hour += 12;
        }

        const h = String(hour % 24).padStart(2, '0');
        const m = String(minute).padStart(2, '0');
        targetTime = `${h}:${m}`;
        confidence += 0.25;
        explanations.push(`الموعد الصريح: الساعة ${targetTime}`);
      } else {
        // Natural prayer / day windows
        if (/(الفجر|باكرا|الصبح|dawn)/.test(lower)) {
          targetTime = '05:30';
          confidence += 0.15;
          explanations.push('الموعد: موعد الفجر والصباح (05:30)');
        } else if (/(الظهر|ظهرا|noon)/.test(lower)) {
          targetTime = '12:30';
          confidence += 0.15;
          explanations.push('الموعد: موعد الظهر (12:30)');
        } else if (/(العصر|عصرا|afternoon)/.test(lower)) {
          targetTime = '15:45';
          confidence += 0.15;
          explanations.push('الموعد: موعد العصر (15:45)');
        } else if (/(المغرب|sunset)/.test(lower)) {
          targetTime = '18:15';
          confidence += 0.15;
          explanations.push('الموعد: موعد المغرب (18:15)');
        } else if (/(العشاء|بالليل|مساء|مساءً|night)/.test(lower)) {
          targetTime = '20:30';
          confidence += 0.15;
          explanations.push('الموعد: المساء (20:30)');
        } else {
          const defaultFuture = new Date(now.getTime() + 30 * 60 * 1000);
          const h = String(defaultFuture.getHours()).padStart(2, '0');
          const m = String(defaultFuture.getMinutes()).padStart(2, '0');
          targetTime = `${h}:${m}`;
          explanations.push('موعد افتراضي: بعد 30 دقيقة');
        }
      }
    }

    // 4. Extract clean title
    let cleanTitle = text
      .replace(/(فكرني|ذكرني|تذكير|منبه|عاوز تذكير|اعملي منبه|نبهني|remind me to|set alarm for)\s*(?:بـ|ب|أن|ان|إني|اني|لـ|ل|to)?/gi, '')
      .replace(/(بعد|كمان|in)\s*(ربع\s*ساعة|ثلث\s*ساعة|نص\s*ساعة|نصف\s*ساعة|ساعة\s*إلا\s*ربع|ساعة|ساعتين|half an hour|an hour)/gi, '')
      .replace(/(?:بعد|كمان|خلال|في|in)\s*\d+\s*(?:دقيقة|دقائق|ساعة|ساعات|mins?|minutes?|hours?)/gi, '')
      .replace(/الساعة\s*\d{1,2}(?::\d{2})?\s*(صباحا|صباحاً|مساء|مساءً|بالليل|عصرا|ظهرا|am|pm)?/gi, '')
      .replace(/(كل يوم|يوميا|يومياً|طوال الأسبوع|أيام العمل|الصبح|الفجر|الظهر|العصر|المغرب|العشاء|بالليل)/gi, '')
      .replace(/[،,.]/g, '')
      .trim();

    if (!cleanTitle || cleanTitle.length < 2) {
      if (category === 'health') cleanTitle = 'شرب الماء وترطيب الجسم';
      else if (category === 'work') cleanTitle = 'متابعة العمل ومكالمة هامة';
      else if (category === 'learning') cleanTitle = 'جلسة مذاكرة وتطوير مهارة';
      else if (category === 'fitness') cleanTitle = 'حركة واستراحة مشي وتمدد';
      else if (category === 'spiritual') cleanTitle = 'ورد الأذكار والاستغفار';
      else cleanTitle = 'تنبيه شخصي مجدول';
    } else {
      confidence += 0.1;
      explanations.push(`العنوان: "${cleanTitle}"`);
    }

    // Record token savings (0 tokens consumed)
    this.recordTokensSaved(350);

    return {
      title: cleanTitle,
      time: targetTime,
      category,
      recurrence,
      confidence: Math.min(0.98, confidence),
      explanation: explanations.join(' • '),
      detectedDelayMins,
    };
  }
}

export const localIntelligence = new LocalIntelligenceEngine();
