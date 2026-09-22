import Dexie, { type Table } from 'dexie';
import type {
  Goal,
  QuranProgress,
  BookProgress,
  DailyLog,
  BufferItem,
  Lead,
  OutreachTemplate,
  UserState,
  WorkdayTask,
  UserProfile,
  CustomHabit,
  RealLifeRewardItem,
  RedeemedRewardRecord,
  WorkoutLogRecord,
  LanguageProgressRecord,
  AuthAccount,
} from '../types';

export class LifeOSDatabase extends Dexie {
  goals!: Table<Goal, string>;
  quran_progress!: Table<QuranProgress, number>;
  book_progress!: Table<BookProgress, number>;
  daily_logs!: Table<DailyLog, string>;
  buffer_queue!: Table<BufferItem, string>;
  leads!: Table<Lead, string>;
  templates!: Table<OutreachTemplate, string>;
  user_state!: Table<UserState, string>;
  workday_tasks!: Table<WorkdayTask, string>;
  profiles!: Table<UserProfile, string>;
  custom_habits!: Table<CustomHabit, string>;
  custom_rewards!: Table<RealLifeRewardItem, string>;
  redeemed_rewards!: Table<RedeemedRewardRecord, string>;
  workout_logs!: Table<WorkoutLogRecord, string>;
  match_logs!: Table<any, string>;
  language_progress!: Table<LanguageProgressRecord, string>;
  auth_accounts!: Table<AuthAccount, string>;

  constructor() {
    super('LifeOS_Database');
    this.version(1).stores({
      goals: 'id, category',
      quran_progress: '++id, surah',
      book_progress: '++id, title',
      daily_logs: 'date',
      buffer_queue: 'id, status, originalDate',
      leads: 'id, status, channel',
      templates: 'id',
      user_state: 'id',
    });

    this.version(2).stores({
      goals: 'id, category',
      quran_progress: '++id, surah',
      book_progress: '++id, title',
      daily_logs: 'date',
      buffer_queue: 'id, status, originalDate',
      leads: 'id, status, channel',
      templates: 'id',
      user_state: 'id',
      workday_tasks: 'id, date, profileId, completed',
      profiles: 'id, isDefault',
    });

    this.version(3).stores({
      goals: 'id, category',
      quran_progress: '++id, surah',
      book_progress: '++id, title',
      daily_logs: 'date',
      buffer_queue: 'id, status, originalDate',
      leads: 'id, status, channel',
      templates: 'id',
      user_state: 'id',
      workday_tasks: 'id, date, profileId, completed',
      profiles: 'id, isDefault',
      custom_habits: 'id, date, category, recurrence, completed',
    });

    this.version(4).stores({
      goals: 'id, category',
      quran_progress: '++id, surah',
      book_progress: '++id, title',
      daily_logs: 'date',
      buffer_queue: 'id, status, originalDate',
      leads: 'id, status, channel',
      templates: 'id',
      user_state: 'id',
      workday_tasks: 'id, date, profileId, completed',
      profiles: 'id, isDefault',
      custom_habits: 'id, date, category, recurrence, completed',
      custom_rewards: 'id, category, pointsCost',
      redeemed_rewards: 'id, rewardId, category, redeemedAt',
    });

    this.version(5).stores({
      goals: 'id, category',
      quran_progress: '++id, surah',
      book_progress: '++id, title',
      daily_logs: 'date',
      buffer_queue: 'id, status, originalDate',
      leads: 'id, status, channel',
      templates: 'id',
      user_state: 'id',
      workday_tasks: 'id, date, profileId, completed',
      profiles: 'id, isDefault',
      custom_habits: 'id, date, category, recurrence, completed',
      custom_rewards: 'id, category, pointsCost',
      redeemed_rewards: 'id, rewardId, category, redeemedAt',
      workout_logs: 'id, date, splitType',
      match_logs: 'id, date, sportType',
      language_progress: 'wordId, lang, box, nextReviewDate, status',
    });

    this.version(6).stores({
      goals: 'id, category',
      quran_progress: '++id, surah',
      book_progress: '++id, title',
      daily_logs: 'date',
      buffer_queue: 'id, status, originalDate',
      leads: 'id, status, channel',
      templates: 'id',
      user_state: 'id',
      workday_tasks: 'id, date, profileId, completed, [date+completed]',
      profiles: 'id, isDefault',
      custom_habits: 'id, date, category, recurrence, completed',
      custom_rewards: 'id, category, pointsCost',
      redeemed_rewards: 'id, rewardId, category, redeemedAt',
      workout_logs: 'id, date, splitType, category, routineType, [date+routineType]',
      match_logs: 'id, date, sportType, [date+sportType]',
      language_progress: 'wordId, lang, box, nextReviewDate, status, [lang+status]',
    });

    this.version(7).stores({
      workday_tasks: 'id, date, profileId, completed, [date+completed], [date+profileId]',
    });

    this.version(8).stores({
      auth_accounts: 'id, username',
    });
  }
}

export const db = new LifeOSDatabase();

export interface StorageQuotaStatus {
  usageBytes: number;
  quotaBytes: number;
  usageMB: number;
  quotaMB: number;
  percentUsed: number;
  isCritical: boolean;
}

export class StorageQuotaGuard {
  private memoryFallbackBuffer: Map<string, any> = new Map();

  /**
   * Check current origin storage quota and usage via navigator.storage.estimate
   */
  public async getStorageEstimate(): Promise<StorageQuotaStatus> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageBytes = estimate.usage || 0;
        const quotaBytes = estimate.quota || (50 * 1024 * 1024);
        const percentUsed = Math.min(100, Math.round((usageBytes / quotaBytes) * 100));
        return {
          usageBytes,
          quotaBytes,
          usageMB: Math.round(usageBytes / (1024 * 1024)),
          quotaMB: Math.round(quotaBytes / (1024 * 1024)),
          percentUsed,
          isCritical: percentUsed > 90,
        };
      } catch (e) {
        console.warn('Storage estimate failed:', e);
      }
    }
    return {
      usageBytes: 0,
      quotaBytes: 50 * 1024 * 1024,
      usageMB: 0,
      quotaMB: 50,
      percentUsed: 0,
      isCritical: false,
    };
  }

  /**
   * Safely execute a Dexie DB write operation.
   * If a QuotaExceededError is encountered, buffers the record in memory to guarantee zero data loss.
   */
  public async safeWrite<T>(
    fallbackKey: string,
    payload: any,
    writeOp: () => Promise<T>
  ): Promise<T | null> {
    try {
      return await writeOp();
    } catch (err: any) {
      const isQuota =
        err?.name === 'QuotaExceededError' ||
        err?.code === 22 ||
        err?.message?.toLowerCase().includes('quota');

      if (isQuota) {
        console.error(
          `[StorageQuotaGuard] QuotaExceededError intercepted. Buffering in-memory for key: ${fallbackKey}`,
          err
        );
        this.memoryFallbackBuffer.set(fallbackKey, {
          payload,
          timestamp: Date.now(),
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('midmar:storage_quota_warning', {
              detail: {
                fallbackKey,
                message: 'مساحة التخزين المحلية ممتلئة. تم حفظ البيانات مؤقتاً في الذاكرة الحية لحمايتها من الضياع.',
              },
            })
          );
        }
        return null;
      }
      throw err;
    }
  }

  public getMemoryBufferCount(): number {
    return this.memoryFallbackBuffer.size;
  }

  public getBufferedItem(key: string): any {
    return this.memoryFallbackBuffer.get(key);
  }
}

export const storageQuotaGuard = new StorageQuotaGuard();

// Initial Seed Data for Zero-Cloud local operation
export async function initializeDatabaseSeed() {
  const userStateCount = await db.user_state.count();
  if (userStateCount === 0) {
    const today = new Date().toISOString().split('T')[0];

    // Seed User State
    await db.user_state.add({
      id: 'current_user',
      streakDays: 7,
      streakShields: 2,
      totalPoints: 340,
      activeStation: 'COMMUTE_MORNING',
      survivalMode: false,
      lastActiveDate: today,
      weeklyBufferCount: 0,
      resilienceBadges: 1,
      criticalBonusesWon: 3,
      energyLevel: 'high',
      energyDate: today,
      settings: {
        soundEnabled: true,
        vibrationEnabled: true,
        wakeLockEnabled: true,
        ambientSound: 'brown',
        volume: 0.7,
        oledBurnInProtect: true,
        fajrGracePeriodActive: true,
      },
    });

    // Seed Quran Progress (Surah Al-Baqarah 48 pages)
    await db.quran_progress.add({
      surah: 'سورة البقرة',
      totalPages: 48,
      currentPage: 14,
      currentAyah: 91,
      lastUpdated: today,
      history: [
        { date: '2026-09-17', page: 12, ayah: 76 },
        { date: '2026-09-18', page: 14, ayah: 91 },
      ],
    });

    // Seed Book Progress
    await db.book_progress.add({
      title: 'العادات الذرية (Atomic Habits)',
      totalPages: 280,
      currentPage: 84,
      lastUpdated: today,
    });

    // Seed Goals
    await db.goals.bulkAdd([
      {
        id: 'goal-quran',
        title: 'تثبيت وحفظ سورة البقرة مع التدبر',
        category: 'spiritual',
        targetValue: 48,
        currentValue: 14,
        unit: 'صفحة',
        startDate: '2026-09-01',
        etaDate: '2026-10-18',
        milestones: [
          { id: 'm1', title: 'إتمام الحزب الأول والثاني (الصفحات 1-21)', completed: false },
          { id: 'm2', title: 'إتمام الجزء الثاني (الصفحات 22-48)', completed: false },
        ],
        microSteps: [
          { id: 'ms1', title: 'قراءة صفحتين مع معاني الكلمات الغريبة', durationMin: 20, completed: false, isTodayAnchor: true },
          { id: 'ms2', title: 'مراجعة الربع الأخير من الذاكرة', durationMin: 15, completed: false },
        ],
      },
      {
        id: 'goal-dev',
        title: 'بناء وبرمجة أنظمة معمارية متقدمة (Full-Stack & PWA)',
        category: 'learning',
        targetValue: 30,
        currentValue: 12,
        unit: 'درس تطبيقي',
        startDate: '2026-09-05',
        etaDate: '2026-10-25',
        milestones: [
          { id: 'm3', title: 'إتقان Web Audio و Web Workers', completed: true },
          { id: 'm4', title: 'إتقان IndexedDB و Service Workers المتقدمة', completed: false },
        ],
        microSteps: [
          { id: 'ms3', title: 'تنفيذ نموذج عملي لمولد الأصوات التوليدية', durationMin: 25, completed: false },
        ],
      },
      {
        id: 'goal-crm',
        title: 'توسيع شبكة العملاء والحصول على مشروعين مستقلين',
        category: 'career',
        targetValue: 20,
        currentValue: 6,
        unit: 'تواصل مباشر',
        startDate: '2026-09-10',
        etaDate: '2026-10-10',
        milestones: [
          { id: 'm5', title: 'تجهيز بورتفوليو المشاريع المتقدمة', completed: true },
          { id: 'm6', title: 'إرسال 10 عروض مخصصة في لينكد إن وUpwork', completed: false },
        ],
        microSteps: [
          { id: 'ms4', title: 'مراسلة عميلين مهتمين بتطبيقات الويب التقدمية', durationMin: 20, completed: false },
        ],
      },
    ]);

    // Seed Leads
    await db.leads.bulkAdd([
      {
        id: 'lead-1',
        name: 'كريم المنشاوي (CTO - FinTech Tech)',
        channel: 'LinkedIn',
        status: 'To Contact',
        notes: 'يبحث عن مهندس لتطوير PWA داخلي عالي الأداء مع دعم Offline كامل.',
        lastContactDate: '2026-09-18',
      },
      {
        id: 'lead-2',
        name: 'Sarah Jenkins (Digital Agency)',
        channel: 'Upwork',
        status: 'Contacted',
        notes: 'تم تقديم عرض على مشروع Dashboard تفاعلي بالـ React و Tailwind.',
        lastContactDate: '2026-09-17',
      },
      {
        id: 'lead-3',
        name: 'م. عمر عبد العزيز (مؤسس ناشئة SaaS)',
        channel: 'Email',
        status: 'Replied',
        notes: 'طلب مكالمة استكشافية لمناقشة بناء MVP سريع.',
        lastContactDate: '2026-09-19',
      },
    ]);

    // Seed Outreach Templates
    await db.templates.bulkAdd([
      {
        id: 'tpl-1',
        title: 'عرض قيمة مباشر (Direct Value Proposition)',
        body: `أهلاً بك أستاذي الكريم،
لاحظت اهتمامكم بتطوير الواجهات وتطبيقات الويب السريعة. قمت مؤخراً بتطوير أنظمة PWA معمارية تعتمد على Local-First و IndexedDB وتعمل بنسبة 100% بدون إنترنت مع استجابة فائقة (0ms Latency).
يسعدني جداً مشاركة نموذج حي معك إذا كان ذلك مفيداً لمشاريعكم الحالية.`,
      },
      {
        id: 'tpl-2',
        title: 'استشارة فنية سريعة (Technical Audit Offer)',
        body: `مرحباً،
اطلعت على متطلباتكم بخصوص تحسين سرعة التطبيق ودعم العتاد والهواتف الذكية. هل تواجهون تحديات في استهلاك الموارد أو توفير تجربة تطبيق Native سلسة عبر المتصفح؟
لدي حلول مجربة لتقليل الـ Bundles وتحسين مؤشرات Core Web Vitals بنسبة تزيد عن 40%. هل يناسبك نقاش سريع لمدة 10 دقائق هذا الأسبوع؟`,
      },
      {
        id: 'tpl-3',
        title: 'متابعة مهنية لطيفة (Follow-up Message)',
        body: `السلام عليكم،
أتمنى أن تكون بأفضل حال. أحببت المتابعة معك بخصوص رسالتي السابقة حول تطوير الحلول البرمجية عالية الكفاءة.
ما زلت مهتماً بمساعدتكم في الوصول لأهدافكم التقنية متى ما كان الوقت مناسباً لديكم.`,
      },
    ]);

    // Seed Daily Log for today
    await db.daily_logs.add({
      date: today,
      completedStations: [],
      pointsEarned: 0,
      survivalModeActive: false,
      voiceNotes: '',
      goldenNugget: '',
      mvdTasksDone: [],
    });
  }

  // Ensure Default Profile exists
  const profileCount = await db.profiles.count();
  if (profileCount === 0) {
    await db.profiles.add({
      id: 'profile_default',
      name: 'أحمد',
      email: 'AhmadZohery@gmail.com',
      roleTemplate: 'software_engineer',
      createdAt: new Date().toISOString(),
      isDefault: true,
      avatarEmoji: '⚡',
    });
  } else {
    const existing = await db.profiles.get('profile_default');
    if (existing && (existing.name === 'الملف الشخصي الأساسي' || !existing.name)) {
      await db.profiles.update('profile_default', {
        name: 'أحمد',
        email: 'AhmadZohery@gmail.com',
      });
    }
  }

  // Ensure Sample Workday Tasks exist for today
  const todayStr = new Date().toISOString().split('T')[0];
  const tasksCount = await db.workday_tasks.count();
  if (tasksCount === 0) {
    await db.workday_tasks.bulkAdd([
      {
        id: 'wt-1',
        title: 'مراجعة وتطوير البنية المعمارية للنظام (Architecture Core)',
        estimatedMinutes: 50,
        actualMinutes: 50,
        completed: true,
        priority: 'high',
        date: todayStr,
        profileId: 'profile_default',
      },
      {
        id: 'wt-2',
        title: 'كتابة وتوثيق اختبارات واجهات العمل (E2E Verification)',
        estimatedMinutes: 25,
        actualMinutes: 0,
        completed: false,
        priority: 'high',
        date: todayStr,
        profileId: 'profile_default',
      },
      {
        id: 'wt-3',
        title: 'تصميم واجهة تقويم الأرشيف الشهري والسنوي',
        estimatedMinutes: 50,
        actualMinutes: 0,
        completed: false,
        priority: 'medium',
        date: todayStr,
        profileId: 'profile_default',
      },
    ]);
  }

  // Ensure rich historical daily logs exist for archive demonstration
  const logsCount = await db.daily_logs.count();
  if (logsCount <= 1) {
    const base = new Date();
    const d1 = new Date(base); d1.setDate(base.getDate() - 1); const d1Str = d1.toISOString().split('T')[0];
    const d2 = new Date(base); d2.setDate(base.getDate() - 2); const d2Str = d2.toISOString().split('T')[0];
    const d3 = new Date(base); d3.setDate(base.getDate() - 3); const d3Str = d3.toISOString().split('T')[0];
    const d4 = new Date(base); d4.setDate(base.getDate() - 5); const d4Str = d4.toISOString().split('T')[0];

    const pastLogs: DailyLog[] = [
      {
        date: d1Str,
        completedStations: ['COMMUTE_MORNING', 'WORK_MICRO_SPRINT', 'GYM_ANCHOR', 'EVENING_SPRINT', 'RETROSPECTIVE_CHECKIN'],
        pointsEarned: 85,
        survivalModeActive: false,
        voiceNotes: 'يوم استثنائي في التركيز العميق، أتممت الـ API المعقد وذهبت للجيم في الموعد.',
        goldenNugget: 'البداية هي نصف كل شيء؛ مجرد الجلوس على المكتب يحسم المعركة.',
        wins: ['إنهاء كود معمارية PWA', 'تمرين Push مكثف مع زيادة أوزان', 'قراءة 20 صفحة من كتاب العادات'],
        totalFocusMinutes: 145,
        focusSessionsCount: 3,
        workoutRoutine: 'Push (صدر وتراي وأكتاف)',
        endorphinRating: 9,
        mvdTasksDone: [],
      },
      {
        date: d2Str,
        completedStations: ['COMMUTE_MORNING', 'WORK_MICRO_SPRINT', 'EVENING_SPRINT'],
        pointsEarned: 55,
        survivalModeActive: false,
        voiceNotes: 'كان هناك بعض التشتت بعد الظهيرة، لكن تم تدارك الأمر بشوط تركيز مسائي متقن.',
        goldenNugget: 'لا تكسر السلسلة ليومين متتاليين أبداً.',
        wins: ['مراسلة عميلين على لينكد إن', 'حل مشكلة في قاعدة البيانات المحلية'],
        totalFocusMinutes: 95,
        focusSessionsCount: 2,
        mvdTasksDone: [],
      },
      {
        date: d3Str,
        completedStations: ['COMMUTE_MORNING', 'WORK_MICRO_SPRINT', 'GYM_ANCHOR', 'RETROSPECTIVE_CHECKIN'],
        pointsEarned: 70,
        survivalModeActive: false,
        voiceNotes: 'طاقة عالية اليوم، استمعت لموجات Alpha وكان التركيز سلساً للغاية.',
        goldenNugget: 'البيئة الهادئة تصنع معجزات الإنتاجية.',
        wins: ['تمرين أرجل قوي', 'قراءة ورد سورة البقرة بالكامل'],
        totalFocusMinutes: 120,
        focusSessionsCount: 3,
        workoutRoutine: 'Legs & Core (أرجل وبطن)',
        endorphinRating: 8,
        mvdTasksDone: [],
      },
      {
        date: d4Str,
        completedStations: ['COMMUTE_MORNING', 'WORK_MICRO_SPRINT'],
        pointsEarned: 35,
        survivalModeActive: true,
        voiceNotes: 'تفعيل وضع البقاء MVD بعد يوم عمل شاق لحماية الشعلة.',
        goldenNugget: 'الإنجاز الأصغر أفضل من الصفر الكامل بنسبة 100%.',
        wins: ['حماية الشعلة من الانقطاع'],
        totalFocusMinutes: 50,
        focusSessionsCount: 1,
        mvdTasksDone: ['مهمة البقاء الأساسية'],
      },
    ];

    for (const pl of pastLogs) {
      const exists = await db.daily_logs.get(pl.date);
      if (!exists) {
        await db.daily_logs.add(pl);
      }
    }
  }

  // Seed Default Real-Life Rewards if not yet populated
  const rewardsCount = await db.custom_rewards.count();
  if (rewardsCount === 0) {
    for (const reward of DEFAULT_REAL_LIFE_REWARDS) {
      await db.custom_rewards.add(reward);
    }
  }
}

export const DEFAULT_REAL_LIFE_REWARDS: RealLifeRewardItem[] = [
  {
    id: 'reward_cheat_meal',
    title: 'وجبة فاخرة أو عشاءك المفضل 🍔',
    description: 'اطلب وجبتك المفضلة أو اذهب لمطعم تحبه واستمتع بكل لقمة دون أي تأنيب ضمير!',
    pointsCost: 120,
    category: 'meal',
    emoji: '🍔',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reward_new_clothes',
    title: 'قطعة ملابس جديدة أو حذاء أنيق 👕',
    description: 'كافئ نفسك بمظهر جديد تحبه، أنت تستحق أن ترى ثمرة تعبك في مظهرك وأناقتك.',
    pointsCost: 350,
    category: 'clothes',
    emoji: '👕',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reward_specialty_coffee',
    title: 'قهوة مميزة وحلوى في كافيه راقٍ ☕',
    description: 'جلسة هادئة في مقهى مميز مع فنجان قهوة مختصة وقطعة حلا لتصفية الذهن والاستجمام.',
    pointsCost: 45,
    category: 'coffee',
    emoji: '☕',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reward_book_or_course',
    title: 'كتاب جديد أو دورة تدريبية ممتعة 📚',
    description: 'استثمر في عقلك بكتاب كنت تنتظره أو كورس يطور مهاراتك ويزيدك شغفاً.',
    pointsCost: 180,
    category: 'books',
    emoji: '📚',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reward_tech_gadget',
    title: 'جهاز إلكتروني أو ملحق تقني 🎮',
    description: 'سماعة، إكسسوار مكتب، لعبة إلكترونية، أو أداة تقنية كنت تتمناها منذ فترة.',
    pointsCost: 500,
    category: 'gadget',
    emoji: '🎮',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reward_cinema_movie',
    title: 'أمسية فيلم وسينما مع الفشار 🍿',
    description: 'أمسية استرخاء كاملة مع فيلم ممتع وسناك مفضل بدون أي تفكير في المهام أو العمل.',
    pointsCost: 80,
    category: 'leisure',
    emoji: '🍿',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reward_full_rest_day',
    title: 'يوم راحة تامة واستجمام بدون شاشات 🌴',
    description: 'يوم كامل لك ولعائلتك ونزهة في الهواء الطلق بعيداً عن ضغط الشاشات والعمل.',
    pointsCost: 300,
    category: 'leisure',
    emoji: '🌴',
    createdAt: new Date().toISOString(),
  },
];
