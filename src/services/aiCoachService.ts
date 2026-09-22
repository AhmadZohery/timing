import type { AiProviderConfig, DeconstructedStep, DailyLog } from '../types';
import { db } from '../db/db';

export interface CoachingContext {
  profileName?: string;
  roleTemplate?: string;
  energyLevel?: string;
  streakDays?: number;
  completedStationsCount?: number;
  todayTasks?: Array<{ title: string; completed: boolean; estimatedMinutes: number }>;
  recentWins?: string[];
  voiceNotes?: string;
  pastWeekConsistencyPct?: number;
}

export class AiCoachService {
  /**
   * Fetch current AI provider configuration from DB or localStorage
   */
  async getConfig(): Promise<AiProviderConfig | null> {
    try {
      const userState = await db.user_state.get('current_user');
      if (userState?.settings?.aiConfig) {
        return userState.settings.aiConfig;
      }
    } catch (e) {
      console.warn('Failed to read AI config from db, checking localStorage', e);
    }

    const local = localStorage.getItem('midmar_ai_config');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Save AI provider config
   */
  async saveConfig(config: AiProviderConfig): Promise<void> {
    localStorage.setItem('midmar_ai_config', JSON.stringify(config));
    try {
      const userState = await db.user_state.get('current_user');
      if (userState) {
        await db.user_state.update(userState.id, {
          settings: {
            ...userState.settings,
            aiConfig: config,
          },
        });
      }
    } catch (e) {
      console.warn('Failed to persist AI config in db', e);
    }
  }

  /**
   * Test API connection with a tiny query
   */
  async testConnection(config: AiProviderConfig): Promise<{ success: boolean; message: string }> {
    if (!config.apiKey || !config.apiKey.trim()) {
      return { success: false, message: 'يرجى إدخال مفتاح الـ API أولاً.' };
    }

    try {
      if (config.provider === 'gemini') {
        const model = config.model || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'قل كلمة واحدة فقط: متصل' }] }],
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          return { success: false, message: `فشل الاتصال بـ Gemini API: ${errMsg}` };
        }

        return { success: true, message: 'تم الاتصال بنجاح بـ Gemini API! المرشد الذكي جاهز لمساعدتك.' };
      }

      // OpenAI or Custom endpoint
      const endpoint = config.customEndpoint || 'https://api.openai.com/v1/chat/completions';
      const model = config.model || 'gpt-4o-mini';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say "Connected"' }],
          max_tokens: 10,
        }),
      });

      if (!res.ok) {
        return { success: false, message: `فشل الاتصال بالـ API: HTTP ${res.status}` };
      }
      return { success: true, message: 'تم الاتصال بنجاح بالـ API الخارجي!' };
    } catch (err: any) {
      return { success: false, message: `خطأ في الاتصال بالشبكة: ${err.message || err}` };
    }
  }

  /**
   * Build an empathetic, science-based behavioral System Prompt incorporating actual user context
   */
  private buildSystemPrompt(context: CoachingContext): string {
    return `أنت "مِضمار" - المرشد السلوكي الذكي والمعرفي (Cognitive & Behavioral Accountability Coach) المبني على مبادئ كتاب العادات الذرية (Atomic Habits - James Clear)، نموذج السلوك (BJ Fogg Tiny Habits)، وعلاج القبول والالتزام (ACT Therapy).

هدف أولويتك القصوى: القضاء التام على صعوبة الالتزام والمقاومة النفسية لدى المستخدم، وتقليل طاقة البدء (Activation Energy) إلى الصفر، ومساعدته على بناء الزخم بدلاً من الضغط العصبي أو الشعور بالذنب.

سياق المستخدم الحالي:
- الاسم / الملف الشخصي: ${context.profileName || 'المستخدم'} (${context.roleTemplate || 'عام'})
- مستوى الطاقة اليوم: ${context.energyLevel || 'عادية'}
- شعلة الالتزام الحالية: ${context.streakDays || 0} يوماً
- المحطات المكتملة اليوم: ${context.completedStationsCount || 0} من 6 محطات
- مهام العمل اليومية: ${context.todayTasks ? context.todayTasks.map((t) => `${t.title} [${t.completed ? 'منجزة ✔' : 'قيد الانتظار'}]`).join('، ') : 'لا توجد مهام'}
- نسبة الاتساق في الأسبوع الأخير: ${context.pastWeekConsistencyPct ?? 80}%
${context.recentWins?.length ? `- إنجازات حديثة: ${context.recentWins.join('، ')}` : ''}
${context.voiceNotes ? `- خواطر مسجلة بصوته: "${context.voiceNotes}"` : ''}

أسلوبك في التوجيه:
1. كن ودوداً، واقعياً، متفهماً جداً للمشاعر البشرية (الكسل، التشتت، التعب)، وتحدث بلهجة محفزة رصينة ومريحة بدون أي تنظير معقد.
2. لا تعطِ قوائم طويلة أبداً؛ أعطِ دائماً "خطوة واحدة دقيقة مدتها دقيقتان إلى 5 دقائق" فقط ليبدأ بها فوراً.
3. تذكر دائماً: "الإنجاز الأصغر خيراً من الصفر الكامل بنسبة 100%". شجعه دائماً على حماية شعلته بأقل مجهود ممكن إن كان متعباً.
4. تحدث باللغة العربية الأنيقة والواضحة والمباشرة.`;
  }

  /**
   * Conversational Coaching - answers user queries, feelings of resistance or procrastination
   */
  async askCoach(userMessage: string, context: CoachingContext): Promise<string> {
    const config = await this.getConfig();

    // If API is configured and enabled, query Gemini / OpenAI
    if (config?.enabled && config.apiKey) {
      try {
        const systemPrompt = this.buildSystemPrompt(context);

        if (config.provider === 'gemini') {
          const model = config.model || 'gemini-2.0-flash';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [{ parts: [{ text: userMessage }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 600,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text.trim();
          }
        } else {
          // OpenAI / Custom Endpoint
          const endpoint = config.customEndpoint || 'https://api.openai.com/v1/chat/completions';
          const model = config.model || 'gpt-4o-mini';
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
                { role: 'user', content: userMessage },
              ],
              max_tokens: 400,
              temperature: 0.7,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) return reply.trim();
          }
        }
      } catch (err) {
        console.warn('AI API call failed, falling back to heuristic offline engine', err);
      }
    }

    // Fallback: Smart Offline Rule-Based Cognitive Heuristic Engine
    return this.getOfflineHeuristicResponse(userMessage, context);
  }

  /**
   * Deconstruct an intimidating task into 3 tiny, frictionless steps (3-10 minutes each)
   */
  async deconstructTask(taskTitle: string, context: CoachingContext): Promise<DeconstructedStep[]> {
    const config = await this.getConfig();

    if (config?.enabled && config.apiKey) {
      try {
        const prompt = `المستخدم يجد صعوبة ومقاومة نفسية في بدء هذه المهمة: "${taskTitle}".
مستوى طاقة المستخدم حالياً: ${context.energyLevel || 'متوسط'}.
قم بتفكيك هذه المهمة فوراً إلى 3 خطوات مجهرية ذرية متسلسلة (Micro-steps)، كل خطوة تستغرق من 3 إلى 10 دقائق فقط وتكون واضحة ومحددة للغاية وتناسب طاقته الحالية دون أي إرهاق ذهني.
أرجع النتيجة بصيغة JSON حصراً بهذا التنسيق وبدون أي نص خارجي:
[
  {"title": "اسم الخطوة الأولى السهلة", "durationMin": 5},
  {"title": "اسم الخطوة الثانية الملموسة", "durationMin": 10},
  {"title": "اسم الخطوة الثالثة لإنهاء المسودة", "durationMin": 5}
]`;

        if (config.provider === 'gemini') {
          const model = config.model || 'gemini-2.0-flash';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText);
              if (Array.isArray(parsed) && parsed.length >= 2) {
                return parsed.map((item: any) => ({
                  title: String(item.title || ''),
                  durationMin: Number(item.durationMin) || 5,
                  completed: false,
                }));
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed to deconstruct via AI API, using heuristic breakdown', err);
      }
    }

    // Heuristic Fallback Breakdown
    return [
      {
        title: `تجهيز وفتح ملف المهمة وتحديد المخرج الأول فقط (${taskTitle.slice(0, 30)}...)`,
        durationMin: 3,
        completed: false,
      },
      {
        title: 'العمل المركز لمدة 10 دقائق لكتابة مسودة أولية غير مثالية',
        durationMin: 10,
        completed: false,
      },
      {
        title: 'مراجعة المنجز ووضع اللمسات الأخيرة لإتمام الجزء الأهم',
        durationMin: 5,
        completed: false,
      },
    ];
  }

  /**
   * Analyze past habit logs to diagnose why the user felt it was hard to stick
   */
  async diagnoseHabitPatterns(pastLogs: DailyLog[], context: CoachingContext): Promise<string> {
    const config = await this.getConfig();

    if (config?.enabled && config.apiKey) {
      try {
        const logsSummary = pastLogs.slice(0, 7).map((l) => ({
          date: l.date,
          completedStations: l.completedStations.length,
          points: l.pointsEarned,
          survivalActive: l.survivalModeActive,
          focusMinutes: l.totalFocusMinutes || 0,
          tasksCount: l.workdayTasks?.length || 0,
        }));

        const prompt = `حلل هذا السجل الأسبوعي للمستخدم لمساعدته على التغلب على صعوبة الالتزام:
${JSON.stringify(logsSummary)}
الملف الشخصي: ${context.roleTemplate || 'عام'}.
أجب بـ 3 نقاط ذكية وموجزة جداً:
1. ما السبب الرئيسي وراء شعوره بصعوبة الالتزام (مثلاً: تقدير أوقات أطول من اللازم، عدم أخذ فترات راحة كافية، أو البدء متأخراً)؟
2. تعديل ذري بسيط جداً يجعله يلتزم غداً بنسبة 100% دون ضغط.
3. جملة تعزيز نفسي قصيرة.`;

        if (config.provider === 'gemini') {
          const model = config.model || 'gemini-2.0-flash';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.5, maxOutputTokens: 500 },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text.trim();
          }
        }
      } catch (err) {
        console.warn('Diagnose patterns API call failed', err);
      }
    }

    // Heuristic Diagnosis
    return `تحليل نمط الالتزام الأسبوعي (مضمار الذكي):
1. **الملاحظة الأساسية:** المقاومة التي تشعر بها لا تعني ضعف إرادة، بل تعني أن "حجم الخطوة الأولى" أكبر مما تحتاجه طاقتك الحالية. كلما زادت مدة الجلسة عن 25 دقيقة دفعة واحدة، زاد تردد العقل الباطن في البدء.
2. **الحل المقترح لغداً:** استخدم "قاعدة الدقيقتين" دائماً. لا تقل لنفسك "سأعمل لساعة"، بل قل "سأفتح الملف لمدة دقيقتين فقط".
3. **مبدأ ذهبي:** الالتزام بقليل مستمر يحمي شعلتك ويكسبك الدوبامين، وهو أفضل بمئات المرات من السعي للكمال والتوقف.`;
  }

  /**
   * Offline Heuristic Rule-based Engine (Zero-internet, high-quality cognitive coaching)
   */
  private getOfflineHeuristicResponse(query: string, context: CoachingContext): string {
    const q = query.toLowerCase();

    if (q.includes('كسل') || q.includes('تشتت') || q.includes('مش قادر') || q.includes('صعب')) {
      return `طبيعي جداً أن تشعر بهذا؛ عقلك الآن يحاول حمايتك من استهلاك الطاقة.
إليك الحل العلمي الفوري في 3 خطوات بسيطة:
1. **لا تفكر في إنجاز كل شيء اليوم.** اختر محطة واحدة فقط، أو مهمة واحدة صغيرة.
2. **تطبيق قاعدة الدقيقتين:** اضغط على زر "دقيقتين فقط" في الأسفل، والتزم فقط بـ 120 ثانية دون أي التزام بما بعدها.
3. إذا كانت طاقتك منخفضة حقاً، فعّل **وضع البقاء (MVD)** من شريط التحكم العلوي؛ سيقلص النظام المتطلبات بنسبة 80% مع حماية شعلتك ونقاطك بالكامل! 🛡️`;
    }

    if (q.includes('فكك') || q.includes('مهمة') || q.includes('تخطيط')) {
      return `أبسط طريقة لتنظيم يومك عندما تشعر بالثقل:
- حدد **مهمة واحدة فقط غير قابلة للتفاوض** (Ivy Lee Anchor).
- اجعل مدتها التقديرية 15 إلى 20 دقيقة كحد أقصى.
- باقي المهام ضعها في قائمة السبت الاحتياطية (Saturday Buffer) لتفريغ ذهنك فوراً من عبء التفكير.
هل تود تفكيك مهمة معينة؟ انتقل لتبويب "تفكيك مهمة" واكتب عنوانها لأقوم بتجزئتها لـ 3 خطوات سهلة! 🪄`;
    }

    if (q.includes('طاقة') || q.includes('تعبان') || q.includes('إرهاق')) {
      return `مستوى طاقتك اليوم (${context.energyLevel || 'منخفض'}):
عندما تنخفض الطاقة، يكون النجاح الحقيقي هو **"حماية العادة بأقل حركة ممكنة"** وليس تحقيق أرقام قياسية.
- في القراءة: اقرأ آية واحدة أو صفحة واحدة فقط.
- في الرياضة: قم بـ 5 تمارين إطالة أو 10 تكرارات في منزلك دون الذهاب للجيم.
- في العمل: أنجز جزءاً مدته 10 دقائق فقط.
هذا الأسلوب يرسل إشارة لعقلك: "أنا شخص يلتزم دائماً مهما كانت الظروف"، وستحافظ على شعلتك (${context.streakDays || 1} يوم) متقدة بفخر! 🔥`;
    }

    return `أهلاً بك يا ${context.profileName || 'صديقي'}. أنا هنا لأجعل التزامك اليوم سلساً وممتعاً وخالياً من أي ضغط عصبي.
تذكر دائماً مبدأ "مِضمار": الخطوة الصغيرة المنجزة تهزم الخطة الكبيرة المؤجلة في كل مرة.
اختر محطتك القادمة، وجرّب قاعدة الدقيقتين لتشهد كيف يتدفق الزخم تلقائياً! 🚀`;
  }
}

export const aiCoach = new AiCoachService();
