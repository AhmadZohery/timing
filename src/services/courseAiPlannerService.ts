import type { StudyCourse, StudyCourseLesson } from '../types';
import { aiCoach } from './aiCoachService';
import { generateInitialLessons } from '../utils/courseStudyEngine';
import { localIntelligence } from './localIntelligenceEngine';
import { serverSync } from './serverSyncService';

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
   * Ultra-low token course planner. Uses 0-token deterministic local NLP first,
   * with server AI proxy cache and tight token ceiling fallback.
   */
  async parseNaturalLanguagePlan(
    userPrompt: string,
    startDateStr: string = new Date().toISOString().split('T')[0]
  ): Promise<StudyCourse> {
    // 1. First-Pass Deterministic Local NLP (0 Tokens / 0ms)
    const localResult = localIntelligence.parseCourseIntent(userPrompt);
    let parsed: ParsedCoursePlanResult | null = null;
    let isLocalZeroToken = false;

    if (localResult.confidence >= 0.72) {
      // High-confidence local inference (0 Tokens)
      parsed = {
        title: localResult.title,
        category: localResult.category,
        unitType: localResult.unitType,
        totalUnits: localResult.totalUnits,
        completedUnits: localResult.completedUnits,
        targetDays: localResult.targetDays,
        plannedUnitsPerDay: localResult.plannedUnitsPerDay,
        studyDaysPerWeek: localResult.studyDaysPerWeek,
        notes: `⚡ تحليل محلي ذكي (0 توكن): ${localResult.reasons.join(' • ')}`,
      };
      isLocalZeroToken = true;
    } else {
      // 2. Ambiguous query: try Server AI Proxy with LRU cache
      const serverProxy = await serverSync.callServerAiProxy(
        userPrompt,
        'Extract course JSON: {"title":"","category":"programming"|"languages"|"sharia"|"business"|"academic"|"reading"|"design"|"other","unitType":"video"|"lesson"|"chapter"|"page","totalUnits":0,"completedUnits":0,"targetDays":0,"plannedUnitsPerDay":0,"studyDaysPerWeek":[0,1,2,3,4,6]}',
        150
      );

      if (serverProxy?.text) {
        try {
          const cleaned = serverProxy.text.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {}
      }

      // 3. Fallback to client configured LLM
      if (!parsed) {
        const config = await aiCoach.getConfig();
        if (config?.enabled && config.apiKey) {
          try {
            parsed = await this.queryLlmForCoursePlan(userPrompt, config);
          } catch (err) {
            console.warn('AI course parsing failed, using local engine:', err);
          }
        }
      }

      // 4. Guaranteed Local Fallback
      if (!parsed) {
        parsed = {
          title: localResult.title,
          category: localResult.category,
          unitType: localResult.unitType,
          totalUnits: localResult.totalUnits,
          completedUnits: localResult.completedUnits,
          targetDays: localResult.targetDays,
          plannedUnitsPerDay: localResult.plannedUnitsPerDay,
          studyDaysPerWeek: localResult.studyDaysPerWeek,
          notes: 'خطة مستنتجة محلياً بالخوارزمية الذكية',
        };
        isLocalZeroToken = true;
      }
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
      aiRoadmapGenerated: !isLocalZeroToken,
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
    const systemPrompt = `Extract course JSON only: {"title":"","category":"programming"|"languages"|"sharia"|"business"|"academic"|"reading"|"design"|"other","unitType":"video"|"lesson"|"chapter"|"page","totalUnits":0,"completedUnits":0,"targetDays":0,"plannedUnitsPerDay":0,"studyDaysPerWeek":[0,1,2,3,4,6]}`;

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
            maxOutputTokens: 150,
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
          max_tokens: 150,
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
}

export const courseAiPlannerService = new CourseAiPlannerService();
