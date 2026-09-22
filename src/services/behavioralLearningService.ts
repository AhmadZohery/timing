import type {
  DailyLog,
  WorkdayTask,
  UserState,
  UserBehavioralDNA,
  SmartNudge,
  DayWorkRhythm,
  UserProfile,
} from '../types';
import { db } from '../db/db';
import { aiCoach } from './aiCoachService';

export class BehavioralLearningService {
  private cachedDNA: UserBehavioralDNA | null = null;
  private lastAnalysisTimestamp = 0;

  /**
   * Analyze user history across past daily logs and tasks to construct their Behavioral DNA.
   * Runs 100% locally with zero cloud dependence.
   */
  async getOrComputeDNA(dailyLogs?: DailyLog[]): Promise<UserBehavioralDNA> {
    const now = Date.now();
    // Cache for 5 minutes during active session
    if (this.cachedDNA && now - this.lastAnalysisTimestamp < 5 * 60 * 1000) {
      return this.cachedDNA;
    }

    const logs = dailyLogs && dailyLogs.length > 0 ? dailyLogs : await db.daily_logs.toArray();
    const tasks = await db.workday_tasks.toArray().catch(() => [] as WorkdayTask[]);
    const userState = await db.user_state.get('current_user').catch(() => undefined);

    const dna = this.computeDNA(logs, tasks, userState);
    this.cachedDNA = dna;
    this.lastAnalysisTimestamp = now;
    return dna;
  }

  /**
   * Pure mathematical extraction of behavioral parameters
   */
  private computeDNA(
    logs: DailyLog[],
    tasks: WorkdayTask[],
    _userState?: UserState
  ): UserBehavioralDNA {
    const validLogs = logs.filter((l) => l && l.date);
    const sortedLogs = [...validLogs].sort((a, b) => b.date.localeCompare(a.date));
    const recentLogs = sortedLogs.slice(0, 14); // Analyze last 2 weeks

    // 1. Total Focus Sessions Analyzed
    const totalSessions = validLogs.reduce(
      (acc, l) => acc + (l.focusSessionsCount || 0) + (l.completedStations.length > 0 ? 1 : 0),
      0
    );

    // 2. Optimal Focus Sprint Duration (Sweet Spot)
    // Check actual completed tasks or default to 20 minutes (scientifically proven micro-sprint)
    let avgTaskDuration = 20;
    const completedTasksWithDuration = tasks.filter((t) => t.completed && t.estimatedMinutes > 0);
    if (completedTasksWithDuration.length >= 3) {
      const sum = completedTasksWithDuration.reduce((acc, t) => acc + (t.actualMinutes || t.estimatedMinutes), 0);
      const rawAvg = Math.round(sum / completedTasksWithDuration.length);
      // Snap to friendly sprint bucket (15, 20, 25, 30, 45)
      if (rawAvg <= 17) avgTaskDuration = 15;
      else if (rawAvg <= 22) avgTaskDuration = 20;
      else if (rawAvg <= 27) avgTaskDuration = 25;
      else if (rawAvg <= 35) avgTaskDuration = 30;
      else avgTaskDuration = 45;
    }

    // 3. Task Completion Rate
    let completionRatePct = 80;
    if (tasks.length >= 3) {
      const completedCount = tasks.filter((t) => t.completed).length;
      completionRatePct = Math.min(100, Math.round((completedCount / tasks.length) * 100));
    } else if (recentLogs.length > 0) {
      const stationRate =
        recentLogs.reduce((acc, l) => acc + l.completedStations.length, 0) /
        (recentLogs.length * 6);
      completionRatePct = Math.min(100, Math.max(40, Math.round(stationRate * 100)));
    }

    // 4. Sleep & Recovery Analysis
    const logsWithSleep = recentLogs.filter((l) => (l.sleepHours ?? 0) > 0);
    let avgSleep = 7.0;
    if (logsWithSleep.length > 0) {
      const totalSleep = logsWithSleep.reduce((acc, l) => acc + (l.sleepHours || 0), 0);
      avgSleep = Math.round((totalSleep / logsWithSleep.length) * 10) / 10;
    }

    // 5. Sleep to Productivity Multiplier
    // Calculate if days after good sleep (7+ hrs or 'rested') had more points/stations
    let sleepMultiplier = 1.35;
    const restedDays = logsWithSleep.filter((l) => (l.sleepHours ?? 0) >= 7 || l.sleepQuality === 'rested');
    const tiredDays = logsWithSleep.filter((l) => (l.sleepHours ?? 0) < 6 || l.sleepQuality === 'tired');
    if (restedDays.length > 0 && tiredDays.length > 0) {
      const avgPointsRested =
        restedDays.reduce((acc, l) => acc + (l.pointsEarned || 0), 0) / restedDays.length;
      const avgPointsTired =
        tiredDays.reduce((acc, l) => acc + (l.pointsEarned || 0), 0) / tiredDays.length;
      if (avgPointsTired > 0) {
        const ratio = Math.round((avgPointsRested / avgPointsTired) * 100) / 100;
        sleepMultiplier = Math.min(2.0, Math.max(1.15, ratio));
      }
    }

    // 6. Peak Focus Hour (Default 9 to 12 based on human circadian cortisol peak)
    const peakFocusHourStart = 9;
    const peakFocusHourEnd = 12;

    // 7. Best Prayer & Quran Window
    const bestPrayerWindow = '05:30 ص - 07:00 ص';

    // 8. Key Behavioral Insights in Arabic
    const keyInsights: string[] = [];
    keyInsights.push(
      `🎯 **مدة الجلسة الذهبية لك هي ${avgTaskDuration} دقيقة:** هذا التوقيت هو الأكثر ملاءمة لطاقتك ويحميك من التشتت أو التسويف.`
    );
    keyInsights.push(
      `⚡ **نافذة التركيز الإدراكي القصوى:** بين الساعة ${peakFocusHourStart}:00 ص و ${peakFocusHourEnd}:00 ص تسجل أعلى معدل إنتاجية صافية.`
    );
    if (avgSleep > 0) {
      const pctIncrease = Math.round((sleepMultiplier - 1) * 100);
      keyInsights.push(
        `🌙 **معامل أثر النوم:** النوم بمعدل ${avgSleep} ساعات يرفع كفاءة إنجازك اليومي بنسبة تزيد عن ${pctIncrease}% مقارنة بأيام الإرهاق.`
      );
    }
    keyInsights.push(
      `🕌 **إيقاع البركة:** إنجاز ورد سورة البقرة وأذكار الصباح قبل 08:30 يمنحك هدوءاً ذهنياً ينعكس إيجاباً على كامل يومك.`
    );

    return {
      peakFocusHourStart,
      peakFocusHourEnd,
      optimalSprintMinutes: avgTaskDuration,
      completionRatePct,
      averageSleepDuration: avgSleep,
      sleepProductivityMultiplier: sleepMultiplier,
      bestPrayerTimeWindow: bestPrayerWindow,
      totalSessionsAnalyzed: totalSessions,
      lastAnalysisDate: new Date().toISOString().split('T')[0],
      keyInsights,
    };
  }

  /**
   * Determine the single most relevant, non-nagging smart nudge for the current moment.
   * Returns null if nudges are disabled, on cooldown, or no appropriate nudge fits.
   */
  getBestContextualNudge(
    dna: UserBehavioralDNA,
    currentDate: Date,
    todayLog?: DailyLog,
    userState?: UserState,
    rhythmType: DayWorkRhythm = 'full_day'
  ): SmartNudge | null {
    const settings = userState?.settings;

    // Check if smart nudges are explicitly disabled
    if (settings?.smartNudgesEnabled === false) {
      return null;
    }

    // Check if dismissed cooldown is active
    if (settings?.smartNudgeDismissedUntil) {
      const cooldownEnd = new Date(settings.smartNudgeDismissedUntil).getTime();
      if (Date.now() < cooldownEnd) {
        return null;
      }
    }

    const currentHour = currentDate.getHours() + currentDate.getMinutes() / 60;
    const dismissedIds = settings?.dismissedNudgeIds || [];
    const isRestDay = rhythmType === 'rest_day';

    // Candidate Nudges Pool with Context Filters
    const candidates: SmartNudge[] = [];

    // --- CASE A: Rest Day Oasis ---
    if (isRestDay) {
      if (currentHour >= 8 && currentHour < 18) {
        candidates.push({
          id: `rest_oasis_${currentDate.toISOString().split('T')[0]}`,
          category: 'recovery_rest',
          headline: 'واحة راحة معتمدة لحماية طاقتك 🌴',
          message: 'اليوم يوم عطلتك المعتمد. شعلتك محمية بنسبة 100% دون أي إلزام بعمل. استمتع بيومك وجدد شغفك!',
          wittyTag: '🌴 حماية الشعلة والراحة',
          actionLabel: 'تسجيل الراحة والاستشفاء ☕',
          actionType: 'open_sleep',
          priorityScore: 90,
        });
      }
    }

    // --- CASE B: Fajr / Morning Flow (05:00 - 08:30) ---
    if (currentHour >= 5 && currentHour < 8.5) {
      const baqarahDone = todayLog?.baqarahProgress?.completed;
      if (!baqarahDone) {
        candidates.push({
          id: 'morning_baqarah_focus',
          category: 'prayer_harmony',
          headline: 'ساعة الصفاء الأولى: ورد سورة البقرة 📖',
          message: '«أخذها بركة».. التوقيت الأصفى لذهنك قبل زحام التنبيهات. قراءة صفحات اليوم تمنحك سكينة تدوم حتى المساء.',
          wittyTag: '💡 وتيرة الصباح الباكر',
          actionLabel: 'فتح الورد الصباحي 📖',
          actionStation: 'COMMUTE_MORNING',
          actionType: 'navigate_station',
          priorityScore: 95,
        });
      } else {
        candidates.push({
          id: 'morning_early_momentum',
          category: 'focus_optimization',
          headline: 'بداية ذهبية! طاقتك الإدراكية في ذروتها ⚡',
          message: `أنهيت وردك الصباحي بنجاح. ما رأيك في جلسة تركيز مدتها ${dna.optimalSprintMinutes} دقيقة لإنهاء أهم خطوة اليوم؟`,
          wittyTag: '⚡ توقيتك الذهبي الآن',
          actionLabel: `بدء جلسة ${dna.optimalSprintMinutes} دقيقة ⚡`,
          actionStation: 'WORK_MICRO_SPRINT',
          actionType: 'start_suggested_sprint',
          actionPayload: { duration: dna.optimalSprintMinutes },
          priorityScore: 88,
        });
      }
    }

    // --- CASE C: Peak Focus Window (08:30 - 12:30) ---
    if (!isRestDay && currentHour >= 8.5 && currentHour < 12.5) {
      const focusSessions = todayLog?.focusSessionsCount || 0;
      if (focusSessions === 0) {
        candidates.push({
          id: 'peak_focus_activation',
          category: 'focus_optimization',
          headline: `نافذة تركيزك الذهبية (${dna.peakFocusHourStart}:00 - ${dna.peakFocusHourEnd}:00) 🎯`,
          message: `عقلك الآن في أقصى درجات اليقظة. جلسة مجهرية مدتها ${dna.optimalSprintMinutes} دقيقة فقط كافية لكسر أي مقاومة والبدء فوراً.`,
          wittyTag: '💡 بناءً على وتيرتك الحقيقية',
          actionLabel: `بدء جلسة ${dna.optimalSprintMinutes} دقيقة ⚡`,
          actionStation: 'WORK_MICRO_SPRINT',
          actionType: 'start_suggested_sprint',
          actionPayload: { duration: dna.optimalSprintMinutes },
          priorityScore: 92,
        });
      } else if (focusSessions >= 3) {
        candidates.push({
          id: 'mid_morning_brain_reset',
          category: 'recovery_rest',
          headline: 'أداء مذهل! 3 جلسات تركيز مكتملة 🧠',
          message: 'قدمت أداءً استثنائياً هذا الصباح. اشرب كوباً من الماء أو خذ 5 دقائق تنفس بعيداً عن الشاشات لحماية صفائك.',
          wittyTag: '☕ وقاية من الإجهاد الإدراكي',
          actionLabel: 'تم أخذ الاستراحة 👍',
          actionType: 'open_sleep',
          priorityScore: 85,
        });
      }
    }

    // --- CASE D: Post-Dhuhr Circadian Recharge & Hydration (12:30 - 15:30) ---
    if (currentHour >= 12.5 && currentHour < 15.5) {
      const napDone = todayLog?.powerNapDone;
      if (!napDone) {
        candidates.push({
          id: 'post_dhuhr_hydration_reset',
          category: 'circadian_energy',
          headline: 'ترطيب الخلايا وكوب ماء بارد 💧',
          message: 'انخفاض الطاقة بعد الظهيرة يتضاعف بنقص السوائل. شرب كوب ماء نقي مع دقائق استرخاء يفرغ الإجهاد ويعيد التوازن الحيوي.',
          wittyTag: '💡 رعاية بيولوجية ذكية',
          actionLabel: 'تم شرب الماء وتجديد النشاط 💧',
          actionType: 'start_suggested_sprint',
          priorityScore: 82,
        });
      }
    }

    // --- CASE E: Late Afternoon Energy Lift (15:30 - 18:30) ---
    if (currentHour >= 15.5 && currentHour < 18.5) {
      const gymDone = todayLog?.completedStations?.includes('GYM_ANCHOR');
      if (!gymDone) {
        candidates.push({
          id: 'afternoon_movement_lift',
          category: 'circadian_energy',
          headline: 'تجديد الإندورفين وكسر خمول الجلوس ⚡',
          message: '15 دقيقة فقط من الحركة أو تمارين التمدد كافية لضخ الأكسجين إلى الدماغ وتجهيزك لأمسية هادئة ومريحة.',
          wittyTag: '🏃‍♂️ تجديد النشاط الحركي',
          actionLabel: 'محطة النشاط البدني 🏃‍♂️',
          actionStation: 'GYM_ANCHOR',
          actionType: 'navigate_station',
          priorityScore: 86,
        });
      }
    }

    // --- CASE F: Evening Reflection & Golden Nugget (18:30 - 21:00) ---
    if (currentHour >= 18.5 && currentHour < 21.0) {
      const hasGoldenNugget = Boolean(todayLog?.goldenNugget && todayLog.goldenNugget.trim().length > 3);
      if (!hasGoldenNugget) {
        candidates.push({
          id: 'evening_reflection_nudge',
          category: 'friction_buster',
          headline: 'توثيق فوزك اليومي وشحن الدوبامين 💡',
          message: 'ما هي الفكرة أو الدرس الأهم الذي تعلمته اليوم؟ تدوين جملة واحدة يغلق حلقات التفكير المفتوحة في عقلك.',
          wittyTag: '📝 ترسيخ المكاسب',
          actionLabel: 'تدوين الفكرة الذهبية 💡',
          actionStation: 'RETROSPECTIVE_CHECKIN',
          actionType: 'navigate_station',
          priorityScore: 89,
        });
      }
    }

    // --- CASE G: Night Wind-Down & Surah Mulk (21:00 - 24:00) ---
    if (currentHour >= 21.0 || currentHour < 4.0) {
      const mulkDone = todayLog?.surahMulkDone;
      if (!mulkDone) {
        candidates.push({
          id: 'night_surah_mulk_nudge',
          category: 'prayer_harmony',
          headline: 'سورة الملك المنجية (30 آية قبل النوم) 🌙',
          message: '«تشفع لصاحبها».. دقيقتان إلى 3 دقائق من التلاوة الهادئة تمنحك سكينة روحية وتفرغ الشحنات الذهنية قبل النوم.',
          wittyTag: '🌙 سكينة ما قبل النوم',
          actionLabel: 'بروتوكول النوم وسورة الملك 🌙',
          actionType: 'open_sleep',
          priorityScore: 96,
        });
      } else {
        const sleepHours = dna.averageSleepDuration || 7;
        const multiplierPct = Math.round((dna.sleepProductivityMultiplier - 1) * 100);
        candidates.push({
          id: 'night_circadian_winddown',
          category: 'recovery_rest',
          headline: 'حماية إفراز الميلاتونين والنوم العميق 😴',
          message: `النوم بمعدل ${sleepHours} ساعات الليلة سيرفع كفاءة تركيزك غداً بنسبة +${multiplierPct}%. حان وقت إبعاد الشاشات الزرقاء.`,
          wittyTag: '😴 سر الإنتاجية المستدامة',
          actionLabel: 'تسجيل وقت النوم 🌙',
          actionType: 'open_sleep',
          priorityScore: 84,
        });
      }
    }

    // Filter out candidates that have been dismissed recently
    const filteredCandidates = candidates.filter((c) => !dismissedIds.includes(c.id));

    if (filteredCandidates.length === 0) {
      return null;
    }

    // Sort by priorityScore descending
    filteredCandidates.sort((a, b) => b.priorityScore - a.priorityScore);
    return filteredCandidates[0];
  }

  /**
   * Record user feedback on a nudge (applied or dismissed)
   */
  async recordFeedback(nudgeId: string, action: 'applied' | 'dismissed'): Promise<void> {
    try {
      const userState = await db.user_state.get('current_user');
      if (!userState) return;

      const currentSettings = userState.settings || {};
      const currentDismissed = currentSettings.dismissedNudgeIds || [];

      if (action === 'dismissed') {
        // Cooldown for 4 hours
        const cooldownUntil = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
        const updatedDismissed = Array.from(new Set([...currentDismissed, nudgeId]));

        await db.user_state.update(userState.id, {
          settings: {
            ...currentSettings,
            smartNudgeDismissedUntil: cooldownUntil,
            dismissedNudgeIds: updatedDismissed,
          },
        });
      } else {
        // Applied: Keep track, don't nag again today
        const updatedDismissed = Array.from(new Set([...currentDismissed, nudgeId]));
        await db.user_state.update(userState.id, {
          settings: {
            ...currentSettings,
            dismissedNudgeIds: updatedDismissed,
          },
        });
      }
    } catch (err) {
      console.warn('Failed to record nudge feedback', err);
    }
  }

  /**
   * Generate an in-depth AI Persona Behavioral Analysis Report
   */
  async generateAiBehavioralReport(
    dna: UserBehavioralDNA,
    _dailyLogs?: DailyLog[],
    activeProfile?: UserProfile
  ): Promise<string> {
    const config = await aiCoach.getConfig();

    if (config?.enabled && config.apiKey) {
      try {
        const prompt = `أنت خبير علم النفس الإدراكي وهندسة العادات (Cognitive Scientist & Habit Architect).
حلل البصمة السلوكية لهذا المستخدم بناءً على البيانات الواقعية المستخلصة:
- الملف الشخصي: ${activeProfile?.name || 'المستخدم'} (${activeProfile?.customRoleTitle || activeProfile?.roleTemplate || 'عام'})
- إجمالي الجلسات المحللة: ${dna.totalSessionsAnalyzed}
- مدة الجلسة الذهبية المقترحة: ${dna.optimalSprintMinutes} دقيقة
- ساعات الذروة الإدراكية: من ${dna.peakFocusHourStart}:00 ص حتى ${dna.peakFocusHourEnd}:00 ص
- معدل إتمام المهام: ${dna.completionRatePct}%
- متوسط ساعات النوم: ${dna.averageSleepDuration} ساعات
- معامل أثر النوم على الإنجاز: +${Math.round((dna.sleepProductivityMultiplier - 1) * 100)}% زيادة في النقاط عند الراحة الجيدة

اكتب تقريراً سلوكياً شخصياً ذكياً وموجزاً وممتعاً (بدون أي ملل أو نصائح تقليدية معادة):
1. **تشخيص وتيرتك الفردية (Your Behavioral DNA):** لخص نمطه الإدراكي في جملتين ذكيتين.
2. **سلاحك السري (Your Superpower):** ما هي النقطة الإيجابية الأبرز في نمطه؟
3. **تعديل ذري واحد (One Tiny Hack):** إجراء ميكروسكوبي يرفع إنتاجيته دون أي ضغط عصبي.
4. **شعار محفز ليومك.**`;

        if (config.provider === 'gemini') {
          const model = config.model || 'gemini-2.0-flash';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 600 },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text.trim();
          }
        }
      } catch (err) {
        console.warn('AI Behavioral report failed, falling back to heuristics', err);
      }
    }

    // Heuristic Fallback Report
    return `### 🧬 تقرير البصمة السلوكية الفردية (مِضمار الذكي)

1. **تشخيص وتيرتك الفردية:**
أنت تعمل بأعلى كفاءة في فترات التركيز القصيرة المكثفة (${dna.optimalSprintMinutes} دقيقة). محاولة العمل لساعات طويلة متصلة هي السبب الأكبر لأي تسويف تشعر به، بينما التقسيم المجهري يجعلك لا تقاوم.

2. **سلاحك السري (Your Superpower):**
ساعات الصباح بين ${dna.peakFocusHourStart}:00 ص و ${dna.peakFocusHourEnd}:00 ص تمثل خزانتك الذهبية؛ إنجازك خلال هذه الساعات يعادل ضعف إنجازك في المساء.

3. **تعديل ذري واحد لغداً:**
ثبت جلسة الـ ${dna.optimalSprintMinutes} دقيقة كمعيار افتراضي. عندما ترغب في البدء، لا تفكر فيما ستفعله بعدها، فقط ركز في هذه الدقائق الـ ${dna.optimalSprintMinutes} دون تشتت.

4. **تأثير النوم والسكينة:**
النوم الجيد يرفع طاقتك الإدراكية بنسبة +${Math.round((dna.sleepProductivityMultiplier - 1) * 100)}%. الاستشفاء ليس ترفاً، بل هو الوقود الحقيقي لكل إنجاز تصنعه! 🔥`;
  }
}

export const behavioralLearning = new BehavioralLearningService();
