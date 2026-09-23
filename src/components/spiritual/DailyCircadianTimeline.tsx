import React, { useState } from 'react';
import {
  Moon,
  Sunrise,
  Sunset,
  Clock,
  Coffee,
  Briefcase,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import type { DailyLog, UserState, StationId } from '../../types';
import { calculatePrayerTimes, getNextPrayer } from '../../utils/prayerCalculator';
import { getTodayWorkRhythm } from '../../utils/workRhythm';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface DailyCircadianTimelineProps {
  todayLog?: DailyLog;
  userState?: UserState;
  onSelectStation: (station: StationId) => void;
  onOpenSleepRest: () => void;
  className?: string;
}

interface CircadianPhase {
  id: string;
  title: string;
  subtitle: string;
  timeRange: string;
  startHour: number;
  endHour: number;
  icon: any;
  accentColor: string;
  actionStation?: StationId;
  isSleepAction?: boolean;
}

export const DailyCircadianTimeline: React.FC<DailyCircadianTimelineProps> = ({
  todayLog,
  userState,
  onSelectStation,
  onOpenSleepRest,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTimeDec = currentHour + currentMin / 60;

  // Dynamic Work Rhythm for today
  const rhythm = getTodayWorkRhythm(now, userState?.settings?.workRhythmConfig);

  // Prayer times
  const pLoc = userState?.settings?.prayerLocation;
  const pTimes = calculatePrayerTimes(
    now,
    pLoc?.latitude ?? 30.0444,
    pLoc?.longitude ?? 31.2357,
    pLoc?.calculationMethod ?? 'egyptian'
  );
  const nextP = getNextPrayer(pTimes);

  const routineAns = userState?.settings?.dailyRoutineAnswers;
  const isHomemaker = routineAns?.activityType === 'homemaker_cooking' || userState?.settings?.lifestylePersona === 'homemaker_family';
  const isLearner = routineAns?.activityType === 'dedicated_learning' || userState?.settings?.lifestylePersona === 'dedicated_learner';
  const isRemoteTeacher = routineAns?.activityType === 'remote_teacher' || userState?.settings?.lifestylePersona === 'remote_teacher_flexible';

  const phases: CircadianPhase[] = [
    {
      id: 'fajr_morning',
      title: 'الفجر وبداية البركة',
      subtitle: routineAns?.commuteMinutes && routineAns.commuteMinutes > 0
        ? `صلاة الفجر، أذكار الصباح، والمواصلات (${routineAns.commuteMinutes} دقيقة)`
        : 'صلاة الفجر، أذكار الصباح، ورد سورة البقرة والسكينة المنزلية',
      timeRange: '05:00 - 08:30',
      startHour: 5,
      endHour: 8.5,
      icon: Sunrise,
      accentColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      actionStation: 'COMMUTE_MORNING',
    },
    {
      id: 'morning_deep_work',
      title: rhythm.isRestDay
        ? `واحة الراحة (${rhythm.dayNameAr})`
        : rhythm.isHalfDay
        ? `نصف يوم عمل (${rhythm.dayNameAr})`
        : isHomemaker
        ? 'إدارة شؤون المنزل وفترة الطهي الصحي'
        : isLearner
        ? 'جلسات التعلم الذاتي وبناء المهارات'
        : isRemoteTeacher
        ? 'الحصص والتدريس التفاعلي المرن'
        : 'التركيز والعمل العميق',
      subtitle: rhythm.isRestDay
        ? 'استجمام وتجديد الطاقة وحماية مسار الراحة'
        : rhythm.isHalfDay
        ? 'إنجاز مهام سريعة أساسية قبل بدء عطلتك'
        : isHomemaker
        ? 'إعداد وجبات الأسرة، تنظيم أركان البيت، وتفريغ المهام'
        : isLearner
        ? 'دراسة الموضوع المختار، حل التطبيقات وتوثيق الفوائد'
        : isRemoteTeacher
        ? 'شرح الدروس للطلاب، إعداد المناهج والمتابعة'
        : 'جلسات العمل ذات الأولوية القصوى والإنتاجية',
      timeRange: '08:30 - 12:30',
      startHour: 8.5,
      endHour: 12.5,
      icon: rhythm.isRestDay ? Coffee : Briefcase,
      accentColor: rhythm.isRestDay
        ? 'text-teal-500 bg-teal-500/10 border-teal-500/30'
        : rhythm.isHalfDay
        ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
        : 'text-blue-500 bg-blue-500/10 border-blue-500/30',
      actionStation: rhythm.isRestDay ? undefined : 'WORK_MICRO_SPRINT',
      isSleepAction: rhythm.isRestDay,
    },
    {
      id: 'dhuhr_recovery',
      title: 'الظهر والقيلولة النبوية',
      subtitle: 'صلاة الظهر، قيلولة الـ 20 دقيقة لاستعادة النشاط',
      timeRange: '12:30 - 15:30',
      startHour: 12.5,
      endHour: 15.5,
      icon: Coffee,
      accentColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      isSleepAction: true,
    },
    {
      id: 'afternoon_gym',
      title: routineAns?.workoutPreference === 'none_rest'
        ? 'العصر والاسترخاء والعناية الذاتية'
        : routineAns?.workoutPreference === 'home_calisthenics'
        ? 'العصر واللياقة المنزلية'
        : routineAns?.workoutPreference === 'outdoor_walk'
        ? 'العصر والمشي وتجديد الهواء'
        : 'العصر وتجديد الإندورفين',
      subtitle: routineAns?.workoutPreference === 'none_rest'
        ? 'صلاة العصر، جلسة راحة وشاي هادئ وعناية شخصية'
        : routineAns?.workoutPreference === 'home_calisthenics'
        ? 'صلاة العصر، تمارين لياقة وتمدد خفيف في البيت'
        : routineAns?.workoutPreference === 'outdoor_walk'
        ? 'صلاة العصر، مشي وتصفية الذهن واستنشاق الأكسجين'
        : 'صلاة العصر، التمارين البدنية، وجلسات المساء',
      timeRange: '15:30 - 18:30',
      startHour: 15.5,
      endHour: 18.5,
      icon: Zap,
      accentColor: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
      actionStation: 'GYM_ANCHOR',
    },
    {
      id: 'maghrib_reflection',
      title: 'المغرب والمراجعة اليومية',
      subtitle: 'صلاة المغرب، تدوين الفكرة الذهبية وإنجازات اليوم',
      timeRange: '18:30 - 20:30',
      startHour: 18.5,
      endHour: 20.5,
      icon: Sunset,
      accentColor: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
      actionStation: 'RETROSPECTIVE_CHECKIN',
    },
    {
      id: 'isha_winddown',
      title: 'العشاء وسكينة النوم',
      subtitle: 'صلاة العشاء، قراءة سورة الملك، أذكار النوم والاستشفاء',
      timeRange: '20:30 - 24:00',
      startHour: 20.5,
      endHour: 24,
      icon: Moon,
      accentColor: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40',
      isSleepAction: true,
    },
  ];

  // Current active phase
  const activePhase =
    phases.find((p) => currentTimeDec >= p.startHour && currentTimeDec < p.endHour) ||
    phases[phases.length - 1];

  // Smart recommended next best action
  const getNextRecommendedAction = () => {
    if (currentTimeDec >= 21 || currentTimeDec < 4) {
      if (!todayLog?.surahMulkDone) {
        return {
          title: 'قراءة سورة الملك المنجية (30 آية)',
          detail: 'تشفع لصاحبها وتمنحك سكينة تامة قبل النوم (+15 نقطة)',
          cta: 'فتح بروتوكول النوم 🌙',
          action: onOpenSleepRest,
        };
      }
      return {
        title: 'أذكار النوم والاسترخاء الهادئ',
        detail: 'إغلاق الشاشات الزرقاء لحماية إفراز الميلاتونين والنوم العميق',
        cta: 'تسجيل النوم 😴',
        action: onOpenSleepRest,
      };
    }

    if (currentTimeDec >= 12.5 && currentTimeDec <= 15.5 && !todayLog?.powerNapDone) {
      return {
        title: 'سِنة القيلولة النبوية (20 دقيقة)',
        detail: 'تفرغ الإجهاد الذهني وتعيد سرعة استجابة الدماغ وتجدد النشاط بنسبة 34%',
        cta: 'بدء مؤقت القيلولة ☕',
        action: onOpenSleepRest,
      };
    }

    if (currentTimeDec >= 5 && currentTimeDec <= 9 && !(todayLog?.baqarahProgress?.completed)) {
      return {
        title: 'ورد سورة البقرة الصباحي',
        detail: '«أخذها بركة وتركها حسرة».. قراءة صفحات اليوم لافتتاح يومك بالسكينة',
        cta: 'الذهاب للورد الصباحي 📖',
        action: () => onSelectStation('COMMUTE_MORNING'),
      };
    }

    if (currentTimeDec >= 9 && currentTimeDec < 13) {
      if (rhythm.isRestDay) {
        return {
          title: `استجمام وتجديد الطاقة (${rhythm.dayNameAr})`,
          detail: 'اليوم واحة راحة مستحقة لحماية طاقتك وصفائك الذهني',
          cta: 'تسجيل الراحة والاستشفاء ☕',
          action: onOpenSleepRest,
        };
      }
      return {
        title: rhythm.isHalfDay ? `نصف يوم عمل ذكي (${rhythm.dayNameAr})` : 'جلسة عمل وتركيز عميق (Deep Work Session)',
        detail: rhythm.isHalfDay ? 'إنجاز أهم مهمتين فقط لإنهاء يومك مبكراً' : 'أنجز أولويتك الكبرى اليوم قبل استنزاف طاقتك الإدراكية',
        cta: 'بدء جلسة العمل ⚡',
        action: () => onSelectStation('WORK_MICRO_SPRINT'),
      };
    }

    return {
      title: `الاستعداد لصلاة ${nextP.arabicName}`,
      detail: `متبقي قرابة ${nextP.minutesRemaining} دقيقة على رفع الأذان`,
      cta: 'تسجيل الصلوات 🕌',
      action: () => {},
    };
  };

  const nextAction = getNextRecommendedAction();

  const handleActionClick = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    nextAction.action();
  };

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs p-3.5 sm:p-4 space-y-3 transition-all ${className}`}
      dir="rtl"
    >
      {/* Top Banner: Next Best Action & Current Time Dial */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                المسار الزمني وإيقاع اليوم الحي
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/40">
                {activePhase.title}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
              <span>{nextAction.title}</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
              {nextAction.detail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleActionClick}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{nextAction.cta}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title={isExpanded ? 'طي الخط الزمني' : 'عرض محطات اليوم كاملة'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Circadian Progression Ribbon */}
      <div className="relative pt-2 pb-1">
        {/* Track Line */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden relative">
          {/* Progress fill up to current time (5:00 to 24:00 scale) */}
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, Math.max(0, ((currentTimeDec - 5) / 19) * 100))}%`,
            }}
          />
        </div>

        {/* Phase Indicators */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-zinc-500 font-mono pt-1.5 px-0.5">
          <span><bdi dir="ltr">05:00</bdi> الفجر</span>
          <span><bdi dir="ltr">12:30</bdi> الظهر</span>
          <span><bdi dir="ltr">15:30</bdi> العصر</span>
          <span><bdi dir="ltr">18:30</bdi> المغرب</span>
          <span><bdi dir="ltr">24:00</bdi> النوم</span>
        </div>
      </div>

      {/* Expanded Details: 6 Circadian Phases Cards */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 animate-fade-in">
          {phases.map((phase) => {
            const Icon = phase.icon;
            const isCurrent = phase.id === activePhase.id;

            return (
              <div
                key={phase.id}
                onClick={() => {
                  soundSynth.playTactileClick();
                  if (phase.isSleepAction) {
                    onOpenSleepRest();
                  } else if (phase.actionStation) {
                    onSelectStation(phase.actionStation);
                  }
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-start relative overflow-hidden ${
                  isCurrent
                    ? 'bg-emerald-50/70 dark:bg-zinc-800/90 border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-zinc-900/50 border-slate-200/80 dark:border-zinc-800/60 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white animate-pulse">
                    الآن 📍
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border shrink-0 ${phase.accentColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                      {phase.title}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                      <bdi dir="ltr">{phase.timeRange}</bdi>
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 leading-snug line-clamp-1">
                  {phase.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
