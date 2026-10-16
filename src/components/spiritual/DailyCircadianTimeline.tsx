import React, { useState } from 'react';
import {
  Moon,
  Sunrise,
  Sunset,
  Clock,
  Coffee,
  Briefcase,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Star,
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
  onOpenNawafilModal?: () => void;
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
  cardSurface: string;
  actionStation?: StationId;
  isSleepAction?: boolean;
}

export const DailyCircadianTimeline: React.FC<DailyCircadianTimelineProps> = ({
  todayLog,
  userState,
  onSelectStation,
  onOpenSleepRest,
  onOpenNawafilModal,
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
      accentColor: 'text-[#fef3c7] bg-[#141517] border-[#141517]',
      cardSurface: 'bg-[#fef3c7] text-[#141517] border-amber-300/70',
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
      accentColor: 'text-[#e0f2fe] bg-[#141517] border-[#141517]',
      cardSurface: 'bg-[#e0f2fe] text-[#141517] border-sky-300/70',
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
      accentColor: 'text-[#bce8c2] bg-[#141517] border-[#141517]',
      cardSurface: 'bg-[#bce8c2] text-[#141517] border-[#1eb814]/30',
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
      accentColor: 'text-[#fde6d8] bg-[#141517] border-[#141517]',
      cardSurface: 'bg-[#fde6d8] text-[#141517] border-[#ff5500]/25',
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
      accentColor: 'text-[#fce2e6] bg-[#141517] border-[#141517]',
      cardSurface: 'bg-[#fce2e6] text-[#141517] border-rose-300/70',
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
      accentColor: 'text-[#e2defc] bg-[#141517] border-[#141517]',
      cardSurface: 'bg-[#e2defc] text-[#141517] border-[#5448e8]/25',
      isSleepAction: true,
    },
    {
      id: 'qiyam_last_third',
      title: 'محراب السَّحَر وقيام الليل',
      subtitle: 'الثلث الأخير من الليل، وقت النزول الإلهي، التهجد ومراتب الآيات (10، 100، 1000 آية)',
      timeRange: '01:30 - 05:00',
      startHour: 1.5,
      endHour: 5.0,
      icon: Star,
      accentColor: 'text-[#141517] bg-[#bce8c2] border-[#1eb814]/40',
      cardSurface: 'bg-[#141517] text-white border-[#bce8c2]/40',
      isSleepAction: false,
    },
  ];

  // Current active phase (handles overnight wrapping)
  const activePhase =
    currentTimeDec >= 1.5 && currentTimeDec < 5.0
      ? phases.find((p) => p.id === 'qiyam_last_third')!
      : (currentTimeDec >= 0 && currentTimeDec < 1.5) || currentTimeDec >= 20.5
      ? phases.find((p) => p.id === 'isha_winddown')!
      : phases.find((p) => currentTimeDec >= p.startHour && currentTimeDec < p.endHour) ||
        phases[phases.length - 1];

  // Smart recommended next best action
  const getNextRecommendedAction = () => {
    const dayOfWeek = now.getDay();

    // 1. Qiyam & Sahar Window (01:30 - 05:00)
    if (currentTimeDec >= 1.5 && currentTimeDec < 5.0) {
      if (!todayLog?.qiyamNightDone) {
        return {
          title: 'التهجد في جوف الليل والثلث الأخير (مراتب الآيات)',
          detail: '«من قام بعشر آيات لم يُكتب من الغافلين، ومن قام بمائة آية كُتب من القانتين» (+30 نقطة)',
          cta: 'محراب قيام الليل والدعاء المستجاب 🌌',
          action: () => {
            if (onOpenNawafilModal) {
              onOpenNawafilModal();
            } else {
              onOpenSleepRest();
            }
          },
        };
      }
      return {
        title: 'الاستغفار بالأسحار ودعاء الفجر القريب',
        detail: '«وَبِالأَسْحَارِ هُمْ يَسْتَغْفِرُونَ».. دقائق معدودة تفصلنا عن أذان الفجر وبركته',
        cta: 'تسجيل الاستغفار والسكينة 🤲',
        action: () => {
          if (onOpenNawafilModal) {
            onOpenNawafilModal();
          } else {
            onOpenSleepRest();
          }
        },
      };
    }

    // 2. Night Wind-down & Mulk (20:30 - 01:30)
    if (currentTimeDec >= 20.5 || currentTimeDec < 1.5) {
      if (!todayLog?.surahMulkDone) {
        return {
          title: 'قراءة سورة الملك (المنجية) وتسبيح فاطمة 33/33/34',
          detail: '30 آية كاملة تشفع لصاحبها، تسبيح النوم، وأذكار التحصين النبوي (+15 نقطة)',
          cta: 'فتح سورة الملك وبروتوكول النوم 🌙',
          action: onOpenSleepRest,
        };
      }
      return {
        title: 'أذكار النوم الصحيحة والاسترخاء الهادئ',
        detail: 'إغلاق الشاشات لحماية الميلاتونين، تسبيح 33/33/34، والنوم على الشق الأيمن',
        cta: 'بروتوكول النوم 😴',
        action: onOpenSleepRest,
      };
    }

    // Fasting reminder for Sunday evening or Wednesday evening
    if (currentTimeDec >= 17 && (dayOfWeek === 0 || dayOfWeek === 3)) {
      return {
        title: `تذكير بسنة صيام غداً (${dayOfWeek === 0 ? 'الإثنين' : 'الخميس'}) المبارك 🌙`,
        detail: '«تُعرض الأعمال يومي الإثنين والخميس فأحب أن يُعرض عملي وأنا صائم»',
        cta: 'عقد نية الصيام والفضائل 🌙',
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

    const remMins = nextP.minutesRemaining;
    const remH = Math.floor(remMins / 60);
    const remM = remMins % 60;
    const remFormatted = remH > 0
      ? `${remH === 1 ? 'ساعة' : remH === 2 ? 'ساعتين' : `${remH} ساعات`}${remM > 0 ? ` و ${remM} دقيقة` : ''}`
      : `${remMins} ${remMins <= 10 && remMins >= 3 ? 'دقائق' : 'دقيقة'}`;

    return {
      title: `الاستعداد لصلاة ${nextP.arabicName}`,
      detail: `متبقي قرابة ${remFormatted} على رفع الأذان`,
      cta: 'تسجيل الصلوات والنوافل 🕌',
      action: () => {
        if (onOpenNawafilModal) {
          onOpenNawafilModal();
        }
      },
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
      className={`rounded-[26px] surface-card-3d border border-slate-200/90 dark:border-white/10 p-4 sm:p-5 space-y-3.5 transition-all ${className}`}
      dir="rtl"
    >
      {/* Top Banner: Next Best Action & Current Time Dial */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#141517] dark:bg-[#bce8c2] text-[#bce8c2] dark:text-[#141517] flex items-center justify-center shadow-xs shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                المسار الزمني وإيقاع اليوم الحي
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#bce8c2] text-[#141517] text-[10px] font-black border border-[#1eb814]/30">
                {activePhase.title}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-black text-[#141517] dark:text-white flex items-center gap-1.5 mt-0.5 truncate">
              <span>{nextAction.title}</span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 line-clamp-1 font-medium">
              {nextAction.detail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleActionClick}
            className="px-4 py-2 rounded-full bg-[#141517] hover:bg-zinc-800 dark:bg-[#bce8c2] dark:hover:bg-[#d4f5dc] text-[#bce8c2] dark:text-[#141517] text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span>{nextAction.cta}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setIsExpanded(!isExpanded);
            }}
            className="p-2 rounded-full bg-[#e2defc] hover:brightness-95 text-[#141517] border border-[#5448e8]/20 transition-all active:scale-95 cursor-pointer"
            title={isExpanded ? 'طي الخط الزمني' : 'عرض محطات اليوم كاملة'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Circadian Progression Ribbon */}
      <div className="relative pt-2 pb-1" dir="ltr">
        {/* Track Line with ambient glow */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            setIsExpanded(!isExpanded);
          }}
          className="w-full h-4 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden relative shadow-inner border border-slate-200/80 dark:border-white/10 block cursor-pointer"
          title="اضغط لعرض بطاقات المسار الزمني"
        >
          {/* Progress fill up to current time (Continuous 24h cycle from Fajr) */}
          <div
            className="h-full bg-gradient-to-r from-[#fef3c7] via-[#bce8c2] to-[#e2defc] rounded-full transition-all duration-700 shadow-xs relative border-r-2 border-[#1eb814]"
            style={{
              width: `${Math.min(100, Math.max(0, (((currentTimeDec >= 5 ? currentTimeDec - 5 : currentTimeDec + 19) / 24) * 100)))}%`,
            }}
          >
            {/* Pulsing beacon on the leading edge */}
            <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-[#141517] dark:bg-white rounded-full animate-pulse" />
          </div>
        </button>

        {/* Interactive Phase Indicators aligned with progression bar */}
        <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono font-bold pt-2 px-0.5 gap-1" dir="ltr">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              onSelectStation('COMMUTE_MORNING');
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#141517] hover:brightness-95 transition-transform active:scale-95 cursor-pointer"
          >
            <span>🌅 الفجر</span> <bdi className="font-sans text-[10px]">05:00</bdi>
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              onOpenSleepRest();
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#bce8c2] text-[#141517] hover:brightness-95 transition-transform active:scale-95 cursor-pointer"
          >
            <span>☀️ الظهر</span> <bdi className="font-sans text-[10px]">12:30</bdi>
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              onSelectStation('GYM_ANCHOR');
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fde6d8] text-[#141517] hover:brightness-95 transition-transform active:scale-95 cursor-pointer"
          >
            <span>⚡ العصر</span> <bdi className="font-sans text-[10px]">15:30</bdi>
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              onSelectStation('RETROSPECTIVE_CHECKIN');
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fce2e6] text-[#141517] hover:brightness-95 transition-transform active:scale-95 cursor-pointer"
          >
            <span>🌆 المغرب</span> <bdi className="font-sans text-[10px]">18:30</bdi>
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              onOpenSleepRest();
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e2defc] text-[#141517] hover:brightness-95 transition-transform active:scale-95 cursor-pointer"
          >
            <span>🌌 السَّحَر</span> <bdi className="font-sans text-[10px]">24:00</bdi>
          </button>
        </div>
      </div>

      {/* Expanded Details: Circadian Pastel Bento Cards (rounded-[26px]) */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-white/10 animate-fade-in">
          {phases.map((phase) => {
            const Icon = phase.icon;
            const isCurrent = phase.id === activePhase.id;
            const isDarkCard = phase.id === 'qiyam_last_third';

            return (
              <div
                key={phase.id}
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  if (phase.isSleepAction) {
                    onOpenSleepRest();
                  } else if (phase.actionStation) {
                    onSelectStation(phase.actionStation);
                  } else if (onOpenNawafilModal) {
                    onOpenNawafilModal();
                  }
                }}
                className={`p-4 rounded-[26px] border transition-all cursor-pointer text-start relative overflow-hidden tap-spring active:scale-98 ${
                  phase.cardSurface
                } ${
                  isCurrent
                    ? 'ring-2 ring-[#1eb814] shadow-md'
                    : 'shadow-2xs hover:brightness-98'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#141517] text-[#bce8c2] animate-pulse">
                    الآن 📍
                  </span>
                )}
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-2xl border shrink-0 ${phase.accentColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-black truncate ${isDarkCard ? 'text-white' : 'text-[#141517]'}`}>
                      {phase.title}
                    </div>
                    <span className={`text-[11px] font-mono font-black ${isDarkCard ? 'text-[#bce8c2]' : 'text-[#141517]/70'}`}>
                      <bdi dir="ltr">{phase.timeRange}</bdi>
                    </span>
                  </div>
                </div>
                <p className={`text-xs mt-2.5 leading-relaxed line-clamp-2 font-bold ${isDarkCard ? 'text-zinc-300' : 'text-[#141517]/80'}`}>
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

