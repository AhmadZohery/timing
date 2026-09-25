export type StationId =
  | 'HOME'
  | 'COMMUTE_MORNING'
  | 'WORK_MICRO_SPRINT'
  | 'ONE_SEC_FRICTION'
  | 'SOCIAL_MEDIA_BREAK'
  | 'GYM_ANCHOR'
  | 'EVENING_SPRINT'
  | 'RETROSPECTIVE_CHECKIN'
  | 'GRAND_REWARD_STATE';

export type GoalCategory = 'spiritual' | 'learning' | 'fitness' | 'career' | 'general';
export type EnergyLevel = 'high' | 'medium' | 'low';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface MicroStep {
  id: string;
  title: string;
  durationMin: number;
  completed: boolean;
  isTodayAnchor?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  etaDate: string;
  milestones: Milestone[];
  microSteps: MicroStep[];
}

export interface QuranProgress {
  id?: number;
  surah: string;
  totalPages: number;
  currentPage: number;
  currentAyah: number;
  lastUpdated: string;
  history: Array<{ date: string; page: number; ayah: number }>;
}

export interface TasbihCounterRecord {
  id: string;
  presetId: string;
  date: string;
  currentCount: number;
  target: number;
  stageIndex: number;
  completed: boolean;
  lastUpdated: number;
}

export interface BookProgress {
  id?: number;
  title: string;
  totalPages: number;
  currentPage: number;
  lastUpdated: string;
}

export interface WorkoutSet {
  weight: number;
  reps: number;
  done: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  rir?: number; // Reps in Reserve
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  restTimerSeconds?: number;
}

export interface WorkoutLogRecord {
  id: string;
  date: string;
  category?: 'gym' | 'combat' | 'football' | 'fitness_class' | 'home' | 'walk' | 'mobility' | string;
  splitType?: 'push' | 'pull' | 'legs' | 'full_body' | 'custom' | string;
  routineType?: string;
  exercises: WorkoutExercise[];
  durationMinutes: number;
  totalTonnageKg?: number;
  totalVolume?: number;
  completedSets?: number;
  averageRpe?: number;
  endorphinRating?: number;
  timestamp?: number;
  notes?: string;
}

export interface PadelMatchLog {
  id: string;
  date: string;
  durationMinutes: number;
  courtSide: 'left' | 'right';
  sets: { userGames: number; opponentGames: number; tiebreak?: string }[];
  result: 'win' | 'loss';
  winnerSmashes?: number;
  unforcedErrors?: number;
  caloriesBurned?: number;
  notes?: string;
}

export interface FootballMatchLog {
  id: string;
  date: string;
  durationMinutes: number;
  goals: number;
  assists: number;
  result: 'win' | 'draw' | 'loss';
  position?: 'striker' | 'midfielder' | 'defender' | 'goalkeeper';
  pitchType?: 'natural_grass' | 'turf' | 'indoor';
  estimatedDistanceKm?: number;
  caloriesBurned?: number;
  notes?: string;
}

export interface LanguageProgressRecord {
  wordId: string;
  lang: string;
  box: number; // 1 to 5
  nextReviewDate: string;
  lastReviewedDate: string;
  timesCorrect: number;
  timesIncorrect: number;
  status: 'new' | 'learning' | 'mastered';
  easeFactor?: number;
  scheduledIntervalDays?: number;
}

export interface UserSchedulePreferences {
  wakeTime: string; // e.g. "05:00"
  sleepTime: string; // e.g. "23:00"
  workStartTime: string; // e.g. "08:30"
  workDurationHours: number;
  sportsPreferredTime: 'morning' | 'afternoon' | 'evening' | 'night';
  weeklySportsPlan: Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', 'gym' | 'boxing' | 'muay_thai' | 'bjj' | 'football' | 'padel' | 'fitness' | 'rest'>;
  dailyWordQuota: 5 | 10 | 15;
  primaryLanguage: 'en' | 'es' | 'fr' | 'it' | 'de';
  asrMethod: 'jumhur' | 'hanafi';
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  completedStations: StationId[];
  pointsEarned: number;
  survivalModeActive: boolean;
  voiceNotes: string;
  goldenNugget: string;
  selectedAnchorMicroStepId?: string;
  mvdTasksDone: string[];
  notes?: string;
  // Enriched V2 Fields
  wins?: string[];
  tomorrowAnchor?: string;
  dayRating?: number;
  gratitudeNote?: string;
  quoteOfTheDay?: string;
  sprintFocusTask?: string;
  sprintOutput?: string;
  urgeSurfsCount?: number;
  workoutLog?: WorkoutExercise[];
  workoutRoutine?: string;
  endorphinRating?: number;
  // V3 Workday & Historical Analytics Fields
  workdayTasks?: WorkdayTask[];
  totalFocusMinutes?: number;
  focusSessionsCount?: number;
  // V4 Spiritual Core & Prayer Tracking Fields
  prayers?: Partial<Record<PrayerName, PrayerRecord>>;
  baqarahProgress?: DailyBaqarahProgress;
  customWirdProgress?: Record<string, DailyWirdProgressItem>;
  surahYasinDone?: boolean;
  surahMulkDone?: boolean;
  qiyamNightDone?: boolean;
  qiyamRakats?: number;
  dhuhaDone?: boolean;
  dhuhaRakats?: number;
  witrDone?: boolean;
  istikharaDone?: boolean;
  hajahDone?: boolean;
  tawbahDone?: boolean;
  wuduSunnahDone?: boolean;
  tahiyyatMasjidDone?: boolean;
  ishraqDone?: boolean;
  tasabihDone?: boolean;
  qiyamAyatTarget?: number;
  adhkarMorningDone?: boolean;
  adhkarEveningDone?: boolean;
  adhkarSleepDone?: boolean;
  spiritualHabitsDone?: string[];
  fastingDone?: boolean;
  fastingType?: 'monday' | 'thursday' | 'white_days' | 'voluntary';
  // V16 Tasbih & Spiritual Beads Fields
  tasbihDailyProgress?: Record<string, { count: number; target: number; completed: boolean }>;
  salawatFridayCount?: number;
  // V6 Sleep & Rest Recovery Fields
  sleepHours?: number;
  sleepQuality?: 'rested' | 'normal' | 'tired';
  powerNapDone?: boolean;
  // V17 Physical Health & Desk Worker NEAT Steps
  dailySteps?: number;
  stepGoal?: number;
}

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'qiyam';
export type PrayerStatus = 'pending' | 'on_time' | 'in_group' | 'late' | 'missed' | 'excused';

export interface PrayerRecord {
  status: PrayerStatus;
  completedAt?: string;
  pointsAwarded?: number;
  sunnahPerformed?: boolean;
  sunnahQabliyahRakats?: number; // e.g. 2, 4
  sunnahBadiyahRakats?: number;  // e.g. 2, 4
  witrRakats?: number;           // e.g. 1, 3
}

export interface DailyBaqarahProgress {
  pagesRead: number;
  targetPages: number;
  completed: boolean;
}

export interface SpiritualWirdItem {
  id: string;
  name: string; // e.g. "سورة البقرة", "سورة آل عمران", "الورد اليومي (جزء عم)"
  type: 'surah' | 'juz' | 'pages' | 'custom';
  targetPages: number; // e.g. 48 for Baqarah, 27 for Al-Imran, 20 for 1 Juz
  pointsReward: number; // e.g. 35, 25, 20
  recommendedTime?: 'fajr' | 'morning' | 'afternoon' | 'night' | 'any';
  hadithVirtue?: string;
}

export type SpiritualPresetId =
  | 'baqarah_only'    // سورة البقرة فقط (الأساس والموصى به للبداية والاستمرار)
  | 'imran_only'      // سورة آل عمران فقط (مستقلة 27 صفحة)
  | 'al_zahrawayn'    // سورة البقرة + سورة آل عمران معاً (اختياري 75 صفحة)
  | 'daily_juz'       // جزء يومياً من المصحف
  | 'surahs_mounjiyat' // المنجيات والفضائل
  | 'custom';         // ورد مخصص بالكامل

export interface SpiritualWirdConfig {
  activePreset: SpiritualPresetId;
  customWirds: SpiritualWirdItem[];
}

export interface DailyWirdProgressItem {
  wirdId: string;
  wirdName: string;
  pagesRead: number;
  targetPages: number;
  completed: boolean;
  completedAt?: string;
}

export type HabitRecurrence = 'daily' | 'once' | 'weekly_specific';

export interface CustomHabit {
  id: string;
  title: string;
  category: 'spiritual' | 'work' | 'health' | 'personal';
  recurrence: HabitRecurrence;
  specificDays?: number[]; // 0=Sun, 1=Mon, ..., 5=Fri
  points: number;
  completed: boolean;
  date: string;
  profileId?: string;
  notes?: string;
}

export type TaskPriority = 'high' | 'medium' | 'normal';

export interface WorkdayTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  actualMinutes: number;
  completed: boolean;
  priority: TaskPriority;
  date: string; // YYYY-MM-DD
  profileId?: string;
  notes?: string;
  taskRole?: 'maker' | 'manager';
}

export type FocusSessionMode =
  | 'pomodoro_25'
  | 'deep_50'
  | 'flow_90'
  | 'quick_20'
  | 'custom';

export type LifeRoleTemplate =
  | 'software_engineer'
  | 'student_researcher'
  | 'freelancer_creator'
  | 'custom_general';

export type ProfessionDomain =
  | 'software_dev'
  | 'ui_ux_design'
  | 'data_ai'
  | 'product_management'
  | 'business_freelance'
  | 'content_marketing'
  | 'finance_trading'
  | 'healthcare'
  | 'engineering_architecture'
  | 'law_legal'
  | 'education_teaching'
  | 'ecommerce_retail'
  | 'student_academia'
  | 'custom';

export interface CustomDhikrItem {
  id: string;
  titleAr: string;
  targetCount: number;
  category: 'daily_core' | 'prayer_adhkar' | 'treasures' | 'custom';
  isPublicProposal?: boolean;
  authorName?: string;
  status: 'local_only' | 'pending_approval' | 'approved_global';
  createdAt: string;
}

export type DayWorkRhythm = 'full_day' | 'half_day' | 'rest_day' | 'friday_special';

export type WeekendPreset =
  | 'friday_saturday'
  | 'saturday_sunday'
  | 'sat_half_sun_off'
  | 'friday_only'
  | 'custom';

export interface WorkRhythmConfig {
  preset?: WeekendPreset;
  dayTypes?: Record<number, DayWorkRhythm>; // 0: Sun, 1: Mon, ..., 6: Sat
  saturdayType?: 'half_day' | 'full_day' | 'off';
  sundayType?: 'rest_day' | 'full_day' | 'half_day';
  workdaySessionsTarget: number; // default 5
  halfDaySessionsTarget: number; // default 2
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  roleTemplate: LifeRoleTemplate;
  createdAt: string;
  isDefault?: boolean;
  avatarEmoji?: string;
  professionDomain?: ProfessionDomain;
  customRoleTitle?: string;
  coreInterests?: string[];
  onboardingCompleted?: boolean;
}

export interface BufferItem {
  id: string;
  originalDate: string;
  taskTitle: string;
  durationMin: number;
  resolvedAt?: string;
  status: 'pending' | 'resolved' | 'expired';
}

export type LeadChannel = 'LinkedIn' | 'Upwork' | 'Email' | 'Other';
export type LeadStatus = 'To Contact' | 'Contacted' | 'Replied' | 'Closed';

export interface Lead {
  id: string;
  name: string;
  channel: LeadChannel;
  status: LeadStatus;
  notes: string;
  lastContactDate: string;
}

export interface OutreachTemplate {
  id: string;
  title: string;
  body: string;
}

export type AmbientSoundType = 'none' | 'brown' | 'rain' | 'rain_light' | 'rain_heavy' | 'alpha' | 'theta';

export interface AiProviderConfig {
  provider: 'gemini' | 'openai' | 'custom';
  apiKey: string;
  model: string;
  enabled: boolean;
  customEndpoint?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: string;
}

export interface DeconstructedStep {
  title: string;
  durationMin: number;
  completed: boolean;
}

export interface UserOnboardingAnswers {
  name: string;
  professionDomain: ProfessionDomain;
  customRoleTitle?: string;
  wakePattern: 'early_bird' | 'night_owl' | 'flexible';
  primaryStruggle: 'fajr_prayer' | 'procrastination' | 'distraction' | 'afternoon_crash' | 'consistency';
  spiritualPriority: 'fajr_and_sunan' | 'quran_wird' | 'qiyam_and_witr' | 'all_around';
  focusPreference: 'short_bursts' | 'deep_flow';
  freeTextBio?: string;
}

export interface AiOnboardingBlueprint {
  circadianArchetype: string;
  recommendedSpiritualPreset: SpiritualPresetId;
  recommendedQiyamAyatTarget: number;
  recommendedSprintMinutes: number;
  dailyStepGoal: number;
  psychologicalDiagnosis: string;
  atomicFrictionHacks: string[];
  recommendedScheduleSummary: string;
}

export interface PrayerLocationConfig {
  city: string;
  latitude: number;
  longitude: number;
  calculationMethod: 'egyptian' | 'umm_al_qura' | 'mwl' | 'karachi' | 'isna';
}

export interface SleepScheduleConfig {
  enabled: boolean;
  targetBedtime: string; // e.g. "23:00"
  targetWakeTime: string; // e.g. "05:00"
  syncWithFajr: boolean; // if true, wakes before Fajr
  wakeBeforeFajrMinutes: number; // default 20
  windDownMinutes: number; // default 45
  powerNapEnabled: boolean;
  powerNapDurationMin: number; // default 20
  preferredNapWindow: 'post_dhuhr' | 'custom';
}

export type LifestylePersonaId =
  | 'builder_exec'             // رائد أعمال ومهندس (Default)
  | 'academic_student'         // طالب وباحث أكاديمي
  | 'sharia_seeker'            // طالب علم شرعي وباحث
  | 'freelancer_creator'       // مستقل وصانع محتوى
  | 'remote_teacher_flexible'  // معلّم ومدرّس عن بعد بمواعيد مرنة
  | 'dedicated_learner'        // متفرغ للتعلم الذاتي وبناء المهارات
  | 'homemaker_family'         // ربة منزل وإدارة الأسرة والطهي والسكينة
  | 'seeker_nonworking'        // متفرغ حالياً / باحث عن شغف (تنظيم الحياة بدون ضغط وظيفي)
  | 'flexible_home'            // تنظيم الحياة المرنة (للتوافق العكسي)
  | 'custom';                  // مخصص بالكامل

export interface DailyRoutineAnswers {
  activityType:
    | 'office_job'
    | 'freelance_remote'
    | 'remote_teacher'
    | 'dedicated_learning'
    | 'homemaker_cooking'
    | 'seeking_flexible'
    | 'student';
  commuteMinutes: number; // 0 for home/remote
  cooksFood: boolean;
  cookingWindow?: 'pre_dhuhr' | 'after_dhuhr' | 'pre_maghrib' | 'evening';
  cookingMinutes?: number; // e.g. 60
  workoutPreference: 'gym_iron' | 'home_calisthenics' | 'outdoor_walk' | 'none_rest';
  workStartHour?: number; // e.g. 9
  workEndHour?: number; // e.g. 17
  targetSleepHours: number; // default 7
  autoSuggestWakeup: boolean;
  customWakeupTime?: string; // e.g. "05:00"
  suggestedWakeupTime?: string;
  calculatedAt?: string;
}

export interface LearningTrackItem {
  id: string;
  title: string;
  category: 'programming' | 'languages' | 'teaching' | 'reading' | 'islamic' | 'business' | 'other';
  currentTopic: string;
  totalLessons?: number;
  completedLessons: number;
  targetHoursWeekly?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningSessionLog {
  id: string;
  trackId: string;
  date: string;
  durationMinutes: number;
  summary: string;
  takeaway: string;
  createdAt: string;
}

export interface StationCustomOverride {
  customTitle?: string;
  customShortLabel?: string;
  customSubtitle?: string;
  customIconName?: string;
}

export type ThemePaletteId =
  | 'obsidian_gold'   // ذهب الأوبسيديان الملكي (Luxury Dark)
  | 'damascus_sand'   // الزمرد الدمشقي والرمل العتيق (Heritage Warm)
  | 'cosmic_titanium' // تيتانيوم الفضاء الأبل برو (Space Tech)
  | 'nordic_slate';   // الصلصال الشمالي النقي (Minimalist)

export interface PrayerAudioSettings {
  adhanEnabled: boolean;
  muadhin: 'makkah' | 'madinah' | 'aqsa' | 'abdulbasit' | 'mishary';
  prePrayerAlertEnabled: boolean; // default true
  prePrayerAlertMinutes: number; // default 10
}

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  wakeLockEnabled: boolean;
  ambientSound: AmbientSoundType;
  volume: number;
  oledBurnInProtect: boolean;
  fajrGracePeriodActive: boolean;
  aiConfig?: AiProviderConfig;
  prayerLocation?: PrayerLocationConfig;
  prayerNotificationsEnabled?: boolean;
  prayerAudioSettings?: PrayerAudioSettings;
  followUpReminderMinutes?: number; // default 15
  secondReminderMinutes?: number; // default 30
  fridayReminderDelayMinutes?: number; // default 120 (2 hours)
  accountabilityNotificationsEnabled?: boolean; // default true (نظام تذكيرات الاستدراك الذكية عند التأخر)
  latePrayerReminderEnabled?: boolean; // default true (تذكير الصلاة المتأخرة غير المسجلة)
  lateWirdReminderEnabled?: boolean; // default true (تذكير الورد القرآني وسورة البقرة)
  lateCheckinReminderEnabled?: boolean; // default true (تذكير إغلاق اليوم المسائي)
  workRhythmConfig?: WorkRhythmConfig;
  sleepSchedule?: SleepScheduleConfig;
  smartNudgesEnabled?: boolean; // default true
  smartNudgeDismissedUntil?: string; // ISO timestamp
  dismissedNudgeIds?: string[];
  spiritualWirdConfig?: SpiritualWirdConfig;
  dailyStepGoal?: number;
  lifestylePersona?: LifestylePersonaId;
  stationCustomOverrides?: Partial<Record<StationId, StationCustomOverride>>;
  themePalette?: ThemePaletteId;
  dailyRoutineAnswers?: DailyRoutineAnswers;
  sprintDurationMinutes?: number;
}

export interface UserBehavioralDNA {
  peakFocusHourStart: number; // e.g. 9
  peakFocusHourEnd: number; // e.g. 12
  optimalSprintMinutes: number; // e.g. 20
  completionRatePct: number; // e.g. 84
  averageSleepDuration: number; // e.g. 7.2
  sleepProductivityMultiplier: number; // e.g. 1.35
  bestPrayerTimeWindow: string; // e.g. "05:15 ص - 06:00 ص"
  totalSessionsAnalyzed: number;
  lastAnalysisDate: string;
  keyInsights: string[];
}

export type SmartNudgeCategory =
  | 'focus_optimization'
  | 'circadian_energy'
  | 'prayer_harmony'
  | 'recovery_rest'
  | 'friction_buster'
  | 'streak_protection';

export interface SmartNudge {
  id: string;
  category: SmartNudgeCategory;
  headline: string;
  message: string;
  wittyTag: string; // e.g. "💡 بناءً على وتيرتك الحقيقية"
  actionLabel?: string;
  actionStation?: StationId;
  actionType?: 'navigate_station' | 'start_suggested_sprint' | 'open_sleep' | 'open_coach' | 'enable_survival';
  actionPayload?: any;
  priorityScore: number;
}

export interface UserState {
  id: string;
  activeProfileId?: string;
  streakDays: number;
  streakShields: number;
  totalPoints: number;
  spentPoints?: number;
  activeStation: StationId;
  survivalMode: boolean;
  lastActiveDate: string;
  weeklyBufferCount: number; // Max 2/week
  resilienceBadges: number;
  criticalBonusesWon: number;
  energyLevel?: EnergyLevel;
  energyDate?: string;
  settings: AppSettings;
}

// Real-Life Rewards System ("اشتري لنفسك كذا 🎁")
export type RewardCategory = 'meal' | 'clothes' | 'gadget' | 'coffee' | 'leisure' | 'books' | 'custom';

export interface RealLifeRewardItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: RewardCategory;
  emoji: string;
  isCustom?: boolean;
  createdAt: string;
}

export interface RedeemedRewardRecord {
  id: string;
  rewardId: string;
  title: string;
  pointsSpent: number;
  redeemedAt: string;
  category: RewardCategory;
  emoji: string;
  note?: string;
}

// Authentication & Online Access Security System
export interface AuthAccount {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  passwordHash: string;
  salt: string;
  pinHash?: string;
  isOwner?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  username: string;
  displayName: string;
  email?: string;
  expiresAt: number;
  rememberMe: boolean;
}

