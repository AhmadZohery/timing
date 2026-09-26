import type { StudyCourse, StudyCourseLesson } from '../types';
import { aiCoach } from './aiCoachService';
import { generateInitialLessons } from '../utils/courseStudyEngine';

export interface ParsedCoursePlanResult {
  title: string;
  category: StudyCourse['category'];
  unitType: StudyCourse['unitType'];
  totalUnits: number;
  completedUnits: number;
  targetDays: number;
  plannedUnitsPerDay: number;
  studyDaysPerWeek: number[];
  notes: string;
  milestones?: Array<{ lessonNumber: number; title: string }>;
}

export class CourseAiPlannerService {
  /**
   * Parses natural language course descriptions using DeepSeek / Gemini or smart heuristic fallback.
   */
  async parseNaturalLanguagePlan(
    userPrompt: string,
    startDateStr: string = new Date().toISOString().split('T')[0]
  ): Promise<StudyCourse> {
    const config = await aiCoach.getConfig();
    let parsed: ParsedCoursePlanResult | null = null;

    if (config?.enabled && config.apiKey) {
      try {
        parsed = await this.queryLlmForCoursePlan(userPrompt, config);
      } catch (err) {
        console.warn('AI course parsing failed, using heuristic parser:', err);
      }
    }

    if (!parsed) {
      parsed = this.parseWithHeuristics(userPrompt);
    }

    // Compute target end date based on target days and study days per week
    const targetDays = Math.max(1, parsed.targetDays || Math.ceil(parsed.totalUnits / Math.max(1, parsed.plannedUnitsPerDay)));
    const studyDays = parsed.studyDaysPerWeek?.length ? parsed.studyDaysPerWeek : [0, 1, 2, 3, 4, 6]; // default all except Fri

    const targetDate = new Date(startDateStr);
    let daysAdded = 0;
    while (daysAdded < targetDays) {
      targetDate.setDate(targetDate.getDate() + 1);
      if (studyDays.includes(targetDate.getDay())) {
        daysAdded++;
      }
    }
    const targetEndDateStr = targetDate.toISOString().split('T')[0];

    // Generate lessons with custom milestone titles if AI generated them
    let lessons: StudyCourseLesson[] = generateInitialLessons(
      parsed.totalUnits,
      parsed.unitType,
      parsed.title
    );

    if (parsed.milestones && parsed.milestones.length > 0) {
      const milestoneMap = new Map(parsed.milestones.map((m) => [m.lessonNumber, m.title]));
      lessons = lessons.map((l) => ({
        ...l,
        title: milestoneMap.get(l.lessonNumber) || l.title,
      }));
    }

    // Mark initially completed units if specified (e.g. "خلصت منه 5 دروس")
    const completedUnits = Math.min(parsed.totalUnits, parsed.completedUnits || 0);
    lessons = lessons.map((l, idx) => ({
      ...l,
      completed: idx < completedUnits,
      completedAt: idx < completedUnits ? new Date().toISOString() : undefined,
    }));

    const courseId = `course_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newCourse: StudyCourse = {
      id: courseId,
      title: parsed.title,
      category: parsed.category,
      unitType: parsed.unitType,
      totalUnits: parsed.totalUnits,
      completedUnits,
      startDate: startDateStr,
      targetEndDate: targetEndDateStr,
      plannedUnitsPerDay: parsed.plannedUnitsPerDay,
      studyDaysPerWeek: studyDays,
      currentPaceStatus: 'on_track',
      backlogUnits: 0,
      surplusUnits: 0,
      recommendedDailyUnits: parsed.plannedUnitsPerDay,
      aiPrompt: userPrompt,
      aiRoadmapGenerated: true,
      lessons,
      dailyLogs: [],
      autoSyncToWorkday: true,
      reminderTime: '17:00',
      reminderEnabled: true,
      status: 'active',
      notes: parsed.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newCourse;
  }

  /**
   * Queries configured LLM with strict JSON schema response.
   */
  private async queryLlmForCoursePlan(
    userPrompt: string,
    config: any
  ): Promise<ParsedCoursePlanResult | null> {
    const systemPrompt = `أنت خبير التخطيط التعليمي في تطبيق "مِضمار".
مهمتك: تحويل كلام المستخدم الطبيعي حول كورس أو مادة أو كتاب يريد مذاكرته إلى خطة رقمية دقيقة ومنظمة.
أخرج النتيجة بصيغة JSON نقية فقط بدون أي markdown وبدون شروحات خارج الـ JSON:
{
  "title": "اسم الكورس بدقة",
  "category": "programming" | "languages" | "sharia" | "business" | "academic" | "design" | "reading" | "other",
  "unitType": "video" | "lesson" | "chapter" | "page" | "hour",
  "totalUnits": 40, // إجمالي عدد الوحدات
  "completedUnits": 0, // ما أنهاه مسبقا إن ذكر
  "targetDays": 10, // عدد الأيام المطلوبة لإنهائه
  "plannedUnitsPerDay": 4, // الحصة اليومية
  "studyDaysPerWeek": [0, 1, 2, 3, 4, 6], // مصفوفة أيام الأسبوع المحددة للمذاكرة (0=الأحد، 1=الإثنين، 2=الثلاثاء، 3=الأربعاء، 4=الخميس، 5=الجمعة، 6=السبت)
  "notes": "توجيه معرفي مختصر للمستخدم لحماية استمراريته",
  "milestones": [
    {"lessonNumber": 1, "title": "مقدمة وتأسيس"},
    {"lessonNumber": 5, "title": "المفاهيم الأساسية والتطبيق"}
  ]
}`;

    if (config.provider === 'gemini') {
      const model = config.model || 'gemini-2.0-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) return JSON.parse(raw);
      }
    } else {
      // DeepSeek / OpenAI
      const endpoint = config.customEndpoint || (config.provider === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://api.openai.com/v1/chat/completions');
      const model = config.model || (config.provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content;
        if (raw) {
          const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(cleaned);
        }
      }
    }

    return null;
  }

  /**
   * High-accuracy heuristic rule-based parser that handles numbers, unit types, and study days offline.
   */
  private parseWithHeuristics(prompt: string): ParsedCoursePlanResult {
    const text = prompt.toLowerCase();

    // 1. Detect Category
    let category: StudyCourse['category'] = 'other';
    if (/(بايثون|برمج|كود|رياكت|جافا|ويب|فرونت|باك|تطبيق|html|css|js|ts|python|flutter)/.test(text)) {
      category = 'programming';
    } else if (/(إنجليز|لغ|محادث|كلمات|grammar|english|french|ielts)/.test(text)) {
      category = 'languages';
    } else if (/(فقه|عقيدة|تفسير|حديث|قرآن|شرع|سيرة)/.test(text)) {
      category = 'sharia';
    } else if (/(تسويق|إدار|بزنس|مشروع|مبيعات|marketing|business)/.test(text)) {
      category = 'business';
    } else if (/(كتاب|فصل|رواية|قراءة|صفحة)/.test(text)) {
      category = 'reading';
    } else if (/(تصميم|ui|ux|ديزاين|فوتوشوب|figma)/.test(text)) {
      category = 'design';
    } else if (/(جامع|امتحان|مذاكر|مادة|منهج|كلية)/.test(text)) {
      category = 'academic';
    }

    // 2. Detect Unit Type
    let unitType: StudyCourse['unitType'] = 'lesson';
    if (/(فيديو|مقطع|فيديوهات|clips)/.test(text)) {
      unitType = 'video';
    } else if (/(فصل|شابتر|باب|chapters)/.test(text)) {
      unitType = 'chapter';
    } else if (/(صفحة|صفحات|pages)/.test(text)) {
      unitType = 'page';
    } else if (/(ساعة|ساعات|hours)/.test(text)) {
      unitType = 'hour';
    }

    // 3. Extract Total Units
    // Matches patterns like "40 فيديو" or "60 درس" or "20 فصل" or "300 صفحة"
    let totalUnits = 30;
    const totalMatch = text.match(/(\d+)\s*(فيديو|درس|فصل|صفحة|ساعة|حص|حلق)/);
    if (totalMatch && totalMatch[1]) {
      totalUnits = parseInt(totalMatch[1], 10);
    } else {
      // General first number
      const anyNum = text.match(/(\d+)/);
      if (anyNum && anyNum[1]) {
        totalUnits = parseInt(anyNum[1], 10);
      }
    }

    // 4. Extract Completed Units (e.g. "خلصت منه 5" or "مخلص 3")
    let completedUnits = 0;
    const completedMatch = text.match(/(خلصت|أنهيت|معايا|مخلص|بادئ من)\s*(\d+)/);
    if (completedMatch && completedMatch[2]) {
      completedUnits = parseInt(completedMatch[2], 10);
    }

    // 5. Extract Days or Daily Quota
    // e.g. "في 10 أيام" or "في شهر" or "في أسبوعين"
    let targetDays = 15;
    if (text.includes('شهرين')) targetDays = 60;
    else if (text.includes('شهر')) targetDays = 30;
    else if (text.includes('أسبوعين')) targetDays = 14;
    else if (text.includes('أسبوع')) targetDays = 7;
    else {
      const daysMatch = text.match(/(في|خلال|غضون)\s*(\d+)\s*(يوم|ايام|أيام)/);
      if (daysMatch && daysMatch[2]) {
        targetDays = parseInt(daysMatch[2], 10);
      }
    }

    // 6. Extract Daily Quota (e.g. "بمعدل 4 في اليوم" or "درسين يوميا" or "3 فيديوهات كل يوم")
    let plannedUnitsPerDay = Math.max(1, Math.ceil((totalUnits - completedUnits) / Math.max(1, targetDays)));
    const dailyMatch = text.match(/(معدل|حصة|مقدار)?\s*(\d+)\s*(في اليوم|يومياً|يوميا|كل يوم)/);
    if (dailyMatch && dailyMatch[2]) {
      plannedUnitsPerDay = parseInt(dailyMatch[2], 10);
    } else if (text.includes('درسين') || text.includes('فيديوهين') || text.includes('فصلين')) {
      plannedUnitsPerDay = 2;
    }

    // 7. Extract Rest Days (e.g. "ما عدا الجمعة" or "السبت والأحد إجازة")
    let studyDaysPerWeek = [0, 1, 2, 3, 4, 6]; // default: Sunday to Thursday + Saturday (Friday rest)
    if (text.includes('كل يوم') || text.includes('طوال الأسبوع') || text.includes('بدون إجازة')) {
      studyDaysPerWeek = [0, 1, 2, 3, 4, 5, 6];
    } else if (text.includes('الجمعة والسبت') || text.includes('الويكند')) {
      studyDaysPerWeek = [0, 1, 2, 3, 4]; // Sun to Thu
    }

    // 8. Extract Title Cleanly
    let title = prompt.trim();
    const titleMatch = prompt.match(/(كورس|دورة|مادة|كتاب|سلسلة)\s+([^\d,،.؟]+)/i);
    if (titleMatch && titleMatch[0]) {
      title = titleMatch[0].trim();
    } else if (title.length > 40) {
      title = title.substring(0, 35) + '...';
    }

    return {
      title,
      category,
      unitType,
      totalUnits: Math.max(1, totalUnits),
      completedUnits: Math.max(0, completedUnits),
      targetDays: Math.max(1, targetDays),
      plannedUnitsPerDay: Math.max(1, plannedUnitsPerDay),
      studyDaysPerWeek,
      notes: 'تم توليد الخطة تلقائياً بمعدل ثابت ومرن يحمي تركيزك وطاقتك الإدراكية.',
    };
  }
}

export const courseAiPlannerService = new CourseAiPlannerService();
