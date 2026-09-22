import React, { useState, useMemo } from 'react';
import {
  X,
  Trophy,
  Sparkles,
  Flame,
  Star,
  Quote,
  Bot,
  Brain,
  Moon,
  Activity,
  Heart,
  Briefcase,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import type { DailyLog, UserState } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { aiCoach } from '../../services/aiCoachService';

interface EvaluationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState | undefined;
  todayLog: DailyLog | undefined;
  dailyLogs: DailyLog[];
}

type TabType = 'daily' | 'weekly' | 'monthly' | 'motivation';

const SPIRITUAL_HADITHS_WISDOM = [
  {
    hadith: '«أحب الأعمال إلى الله تعالى: الصلاة على وقتها، ثم بر الوالدين، ثم الجهاد في سبيل الله»',
    source: 'صحيح البخاري ومسلم',
    topic: 'الصلاة في وقتها بوصلة البركة',
  },
  {
    hadith: '«من صلى البردين (الفجر والعصر) دخل الجنة»',
    source: 'متفق عليه',
    topic: 'عظمة الفجر والعصر',
  },
  {
    hadith: '«ركعتا الفجر خيرٌ من الدنيا وما فيها»',
    source: 'صحيح مسلم',
    topic: 'سنة الفجر وفضل التبكير',
  },
  {
    hadith: '«بشّر المشائين في الظُّلَم إلى المساجد بالنور التام يوم القيامة»',
    source: 'رواه أبو داود والترمذي',
    topic: 'صلاة العشاء والفجر في جماعة',
  },
  {
    hadith: '«اقرءوا سورة البقرة، فإن أخذها بركة، وتركها حسرة، ولا تستطيعها البَطَلَة (أي السحرة)»',
    source: 'صحيح مسلم',
    topic: 'بركة وحصن سورة البقرة',
  },
  {
    hadith: '«سورة تبارك هي المانعة من عذاب القبر»',
    source: 'صحيح الجامع',
    topic: 'فضل سورة الملك كل ليلة',
  },
  {
    hadith: '«أفضل الصلاة بعد الصلاة المكتوبة: الصلاة في جوف الليل»',
    source: 'صحيح مسلم',
    topic: 'شرف قيام الليل والوتر',
  },
  {
    hadith: '«يصبح على كل سلامى من أحدكم صدقة... ويجزئ من ذلك ركعتان يركعهما من الضحى»',
    source: 'صحيح مسلم',
    topic: 'صلاة الضحى زكاة المفاصل',
  },
];

export const EvaluationReportModal: React.FC<EvaluationReportModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <EvaluationReportModalContent {...props} />;
};

const EvaluationReportModalContent: React.FC<EvaluationReportModalProps> = ({
  onClose,
  userState,
  todayLog,
  dailyLogs,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // 1. Sort logs descending by date to evaluate true recent timeline
  const sortedLogs = useMemo(() => {
    return [...(dailyLogs || [])].sort((a, b) => b.date.localeCompare(a.date));
  }, [dailyLogs]);

  // 2. Realistic 4-Pillar Life Balance Computations
  const dailyMetrics = useMemo(() => {
    const prayers = todayLog?.prayers || {};
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
    const completedPrayersCount = prayerNames.filter((p) => {
      const rec = prayers[p];
      return rec && (rec.status === 'on_time' || rec.status === 'in_group');
    }).length;

    const prayerOnTimePercent = Math.round((completedPrayersCount / 5) * 100);
    const fajrDoneOnTime =
      prayers.fajr?.status === 'on_time' || prayers.fajr?.status === 'in_group';

    // Pillar 1: Spiritual Score (0-100)
    let spiritualScore = prayerOnTimePercent * 0.6;
    if (fajrDoneOnTime) spiritualScore += 10;
    if (todayLog?.baqarahProgress?.completed || (todayLog?.baqarahProgress?.pagesRead || 0) >= 10) spiritualScore += 15;
    if (todayLog?.surahYasinDone || todayLog?.surahMulkDone) spiritualScore += 10;
    if (todayLog?.qiyamNightDone) spiritualScore += 5;
    spiritualScore = Math.min(100, Math.round(spiritualScore));

    // Pillar 2: Deep Work & Focus Score (0-100)
    const focusMins = todayLog?.totalFocusMinutes || 0;
    const focusSessions = todayLog?.focusSessionsCount || 0;
    let workScore = Math.min(100, Math.round((focusMins / 90) * 100));
    if (focusSessions >= 3 && workScore < 75) workScore = 75;

    // Pillar 3: Circadian Rest & Recovery Score (0-100)
    const sleepHours = todayLog?.sleepHours ?? 7;
    const sleepQuality = todayLog?.sleepQuality || 'normal';
    let sleepScore = 70;
    if (sleepHours >= 7 && sleepHours <= 9) sleepScore = 95;
    else if (sleepHours >= 6) sleepScore = 80;
    else if (sleepHours < 5) sleepScore = 45;
    if (sleepQuality === 'rested') sleepScore = Math.min(100, sleepScore + 10);
    if (sleepQuality === 'tired') sleepScore = Math.max(30, sleepScore - 20);
    if (todayLog?.powerNapDone) sleepScore = Math.min(100, sleepScore + 15);

    // Pillar 4: Physical Anchor & Reflection (0-100)
    const gymDone = todayLog?.completedStations?.includes('GYM_ANCHOR');
    const retrospectiveDone = todayLog?.completedStations?.includes('RETROSPECTIVE_CHECKIN');
    let physicalMindScore = 40;
    if (gymDone) physicalMindScore += 40;
    if (retrospectiveDone) physicalMindScore += 20;

    // Composite Life Balance Score (Weighted 4 Pillars)
    const lifeBalanceScore = Math.round(
      spiritualScore * 0.35 +
      workScore * 0.30 +
      sleepScore * 0.20 +
      physicalMindScore * 0.15
    );

    return {
      completedPrayersCount,
      prayerOnTimePercent,
      fajrDoneOnTime,
      spiritualScore,
      workScore,
      focusMins,
      focusSessions,
      sleepScore,
      sleepHours,
      sleepQuality,
      physicalMindScore,
      gymDone,
      retrospectiveDone,
      lifeBalanceScore,
      totalPointsToday: todayLog?.pointsEarned || 0,
      baqarahPages: todayLog?.baqarahProgress?.pagesRead || 0,
    };
  }, [todayLog]);

  // 3. Weekly Evaluation Computations (True Last 7 Days)
  const weeklyMetrics = useMemo(() => {
    const last7 = sortedLogs.slice(0, 7);
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

    let totalPrayersOnTime = 0;
    let totalFajrOnTime = 0;
    let totalBaqarahDone = 0;
    let totalMulkDone = 0;
    let totalQiyamDone = 0;
    let totalFocusMins = 0;
    let totalSleepSum = 0;
    let sleepCount = 0;

    const dailyBars = last7.map((log) => {
      const prs = log.prayers || {};
      let onTimeCount = 0;
      prayerNames.forEach((p) => {
        if (prs[p]?.status === 'on_time' || prs[p]?.status === 'in_group') {
          onTimeCount += 1;
        }
      });
      totalPrayersOnTime += onTimeCount;
      if (prs.fajr?.status === 'on_time' || prs.fajr?.status === 'in_group') {
        totalFajrOnTime += 1;
      }
      if (log.baqarahProgress?.completed) totalBaqarahDone += 1;
      if (log.surahMulkDone) totalMulkDone += 1;
      if (log.qiyamNightDone) totalQiyamDone += 1;
      totalFocusMins += log.totalFocusMinutes || 0;

      if (log.sleepHours && log.sleepHours > 0) {
        totalSleepSum += log.sleepHours;
        sleepCount += 1;
      }

      const pScore = Math.round((onTimeCount / 5) * 100);
      const dateParts = log.date.split('-').map(Number);
      const dayDate = new Date(dateParts[0], (dateParts[1] || 1) - 1, dateParts[2] || 1);
      const dayLabel = dayDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'short' });

      return {
        date: log.date,
        dayLabel,
        points: log.pointsEarned || 0,
        prayersOnTime: onTimeCount,
        prayerScore: pScore,
        focusMins: log.totalFocusMinutes || 0,
        isToday: log.date === todayLog?.date,
      };
    }).reverse();

    const daysRecorded = Math.max(1, last7.length);
    const totalPossiblePrayers = daysRecorded * 5;
    const weeklyPrayerConsistency = Math.round((totalPrayersOnTime / totalPossiblePrayers) * 100);
    const avgSleepHours = sleepCount > 0 ? Math.round((totalSleepSum / sleepCount) * 10) / 10 : 7.2;

    return {
      last7,
      dailyBars,
      totalPrayersOnTime,
      totalPossiblePrayers,
      weeklyPrayerConsistency,
      totalFajrOnTime,
      totalBaqarahDone,
      totalMulkDone,
      totalQiyamDone,
      totalFocusHours: Math.round((totalFocusMins / 60) * 10) / 10,
      avgSleepHours,
    };
  }, [sortedLogs, isAr, todayLog?.date]);

  // 4. Monthly Evaluation Computations (True Last 30 Days)
  const monthlyMetrics = useMemo(() => {
    const last30 = sortedLogs.slice(0, 30);
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

    let monthlyTotalPoints = 0;
    let monthlyPrayersDone = 0;
    let monthlyFocusMins = 0;
    let baqarahCompletions = 0;

    last30.forEach((l) => {
      monthlyTotalPoints += l.pointsEarned || 0;
      monthlyFocusMins += l.totalFocusMinutes || 0;
      if (l.baqarahProgress?.completed) baqarahCompletions += 1;
      const prs = l.prayers || {};
      prayerNames.forEach((p) => {
        if (prs[p]?.status === 'on_time' || prs[p]?.status === 'in_group') {
          monthlyPrayersDone += 1;
        }
      });
    });

    const activeDays = last30.length;
    const monthlyPossiblePrayers = Math.max(5, activeDays * 5);
    const monthlyConsistencyPct = Math.round((monthlyPrayersDone / monthlyPossiblePrayers) * 100);

    return {
      activeDays,
      monthlyTotalPoints,
      monthlyPrayersDone,
      monthlyConsistencyPct,
      monthlyFocusHours: Math.round((monthlyFocusMins / 60) * 10) / 10,
      baqarahCompletions,
    };
  }, [sortedLogs]);

  // Dynamic Grade categorization
  let gradeBadgeColor = 'from-emerald-600 to-teal-600 text-white';
  let gradeTitle = isAr ? 'يوم استثنائي متوازن 🌟' : 'Exceptional Balanced Day 🌟';
  let gradeSummary = isAr
    ? 'أحسنت! حافظت على الصلوات في وقتها وقدمت أداءً إيمانياً وعملياً رفيعاً مع راحة واعية.'
    : 'Outstanding spiritual, productive, and restorative alignment today.';

  if (dailyMetrics.lifeBalanceScore < 50) {
    gradeBadgeColor = 'from-amber-600 to-orange-600 text-white';
    gradeTitle = isAr ? 'يوم استشفاء وبقاء 🛡️' : 'Survival & Recovery Day 🛡️';
    gradeSummary = isAr
      ? 'اليوم طاقته منخفضة؛ المهم هو حماية شعلتك وعدم لوم نفسك، والنوم مبكراً للتعويض.'
      : 'Low energy day. The priority is protecting your streak and resting early.';
  } else if (dailyMetrics.lifeBalanceScore < 75) {
    gradeBadgeColor = 'from-sky-600 to-indigo-600 text-white';
    gradeTitle = isAr ? 'أداء طيب ومنجز ✨' : 'Good & Meaningful ✨';
    gradeSummary = isAr
      ? 'أداء رائع في معظم الجوانب، خطوة بسيطة تفصلك عن التوازن الذهبي الكامل غداً.'
      : 'Solid progress across key pillars. Just one step from gold tomorrow.';
  }

  // 1-Tap AI Deep Evaluation Generator
  const handleGenerateAiEvaluation = async () => {
    setIsGeneratingAi(true);
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    try {
      const config = await aiCoach.getConfig();
      const promptText = `أنت مرشد سلوكي وإيماني عميق (مِضمار AI). قيّم يوم المستخدم وأسبوعه بواقعية ورحمة وتوجيه ذكي:
- مؤشر توازن اليوم: ${dailyMetrics.lifeBalanceScore}/100
- الصلوات في وقتها اليوم: ${dailyMetrics.completedPrayersCount}/5 (الفجر: ${dailyMetrics.fajrDoneOnTime ? 'نعم في وقته' : 'تأخر'})
- سورة البقرة اليوم: ${dailyMetrics.baqarahPages} صفحة
- دقائق العمل المركز: ${dailyMetrics.focusMins} دقيقة
- ساعات النوم: ${dailyMetrics.sleepHours} ساعات (جودة: ${dailyMetrics.sleepQuality})
- النشاط البدني: ${dailyMetrics.gymDone ? 'تم التمرين' : 'لم يتم'}
- نسبة الصلوات الأسبوعية: ${weeklyMetrics.weeklyPrayerConsistency}%
أجب بـ 3 نقاط محددة وشخصية جداً بدون حشو:
1. 🏆 **أكبر نصر حقيقي اليوم:** أشر إلى أهم شيء نجح فيه بامتياز.
2. ⚖️ **تشخيص تسريب الطاقة والاتزان:** حلل بواقعية وعلمية (مثلاً أثر قلة النوم أو تأخر الصلاة أو إجهاد العمل).
3. 🎯 **تعديل ذري واحد محدد للغد:** خطوة مجهرية قابلة للتنفيذ فوراً.`;

      if (config?.enabled && config.apiKey && config.provider === 'gemini') {
        const model = config.model || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.6, maxOutputTokens: 600 },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) {
            setAiAnalysisResult(txt.trim());
            setIsGeneratingAi(false);
            soundSynth.playCompletionChime();
            haptic.vibrateSprintCelebration();
            return;
          }
        }
      }

      // Offline Heuristic Deep Evaluation (100% Free & Realistic)
      const winText = dailyMetrics.completedPrayersCount === 5
        ? 'حضور إيماني كامل بحفظ الصلوات الخمس في وقتها، وهو الأساس المتين لبركة يومك وسكينتك الذهنية.'
        : dailyMetrics.focusMins >= 45
        ? `إنجاز عمل عميق متماسك بـ ${dailyMetrics.focusMins} دقيقة تركيز صافٍ متجاوزاً عقبات التسويف والتشتت.`
        : 'الحفاظ على تتابع شعلتك واستمرارية المحطات وتغذية العادات اليومية رغم تذبذب الطاقة.';

      const frictionText = dailyMetrics.sleepHours < 6
        ? `رصدنا أن نومك كان ${dailyMetrics.sleepHours} ساعات فقط. قلة النوم تزيد مادة الأدينوسين وتثبط الفص الجبهي، مما يصعّب مقاومة التسويف. لا تقسُ على نفسك، فالجسد يحتاج وقود الاستشفاء أولاً.`
        : !dailyMetrics.fajrDoneOnTime
        ? 'تأخر صلاة الفجر اليوم أحدث بعض الارتباك في انطلاقة الصباح، بينما الاستيقاظ المبكر للفجر يفرز الكورتيزول الطبيعي للنشاط وصفاء الذهن.'
        : 'أداؤك اليوم متوازن جداً، وتحديك القادم هو تثبيت ورد سورة البقرة مبكراً قبل زحام التنبيهات.';

      const actionText = dailyMetrics.sleepHours < 6
        ? 'النوم مبكراً بنصف ساعة الليلة، وأخذ قيلولة ظهر (20 دقيقة) غداً لتفريغ الإجهاد واستعادة سرعة البديهة.'
        : !dailyMetrics.fajrDoneOnTime
        ? 'وضع الهاتف بعيداً عن السرير بـ 3 خطوات، وضبط المنبه قبل أذان الفجر بـ 10 دقائق لتدرك بركة التبكير.'
        : 'ابدأ غداً بشوط التركيز الأول (20 دقيقة) فور الانتهاء من أذكار الصباح لحسم المهمة الأهم في اليوم.';

      const result = `🔮 **تشخيص مِضمار السلوكي الذكي لليوم:**

1. 🏆 **أكبر نصر حقيقي اليوم:**
${winText}

2. ⚖️ **تشخيص تسريب الطاقة والاتزان:**
${frictionText}

3. 🎯 **تعديل ذري واحد محدد للغد:**
${actionText}`;

      setAiAnalysisResult(result);
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
    } catch {
      setAiAnalysisResult('تعذر إتمام التحليل حالياً، يرجى المحاولة لاحقاً.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-l from-emerald-50/70 via-white to-white dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
                {isAr ? 'لوحة التقييم الدوري والتحفيز' : 'LifeOS Scorecard & Motivation'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isAr ? 'مؤشر توازن الحياة الحقيقي، تقارير الأسبوع والشهر، والتوجيه الذكي' : 'Daily, weekly & monthly holistic performance'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userState && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-xs font-bold text-amber-700 dark:text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{userState.streakDays || 0} {isAr ? 'أيام تتابع' : 'days'}</span>
                <span className="text-amber-300 dark:text-amber-700">|</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{userState.totalPoints || 0} {isAr ? 'نقطة' : 'pts'}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Tabs Bar: 100% visible on mobile with 0 horizontal scroll */}
        <div className="grid grid-cols-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 px-2 pt-2 gap-1 text-center">
          {[
            { id: 'daily' as const, shortLabel: isAr ? 'اليومي' : 'Daily', label: isAr ? 'التقييم اليومي الشامل' : 'Daily Balance' },
            { id: 'weekly' as const, shortLabel: isAr ? 'الأسبوعي' : 'Weekly', label: isAr ? 'التقرير الأسبوعي (7 أيام)' : 'Weekly (7 Days)' },
            { id: 'monthly' as const, shortLabel: isAr ? 'الشهري' : 'Monthly', label: isAr ? 'المسار الشهري (30 يوماً)' : 'Monthly' },
            { id: 'motivation' as const, shortLabel: isAr ? 'حِكم 🤍' : 'Wisdom 🤍', label: isAr ? 'أنوار نبوية وحِكم 🤍' : 'Wisdom 🤍' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 rounded-t-xl text-xs font-bold transition-all cursor-pointer select-none text-center truncate ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-zinc-900 border-t border-x border-slate-200 dark:border-zinc-800 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: DAILY EVALUATION */}
          {activeTab === 'daily' && (
            <div className="space-y-4 animate-fade-in">
              {/* Daily Balance Score Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-l from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900 border border-emerald-300 dark:border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${gradeBadgeColor} shadow-md shrink-0 flex flex-col items-center justify-center text-center min-w-[64px]`}>
                    <span className="text-xl font-black font-mono leading-none">{dailyMetrics.lifeBalanceScore}</span>
                    <span className="text-[9px] font-bold opacity-90 mt-0.5">/ 100</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
                        {gradeTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black font-mono">
                        +{dailyMetrics.totalPointsToday} {isAr ? 'نقطة' : 'pts'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-md">
                      {gradeSummary}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiEvaluation}
                  disabled={isGeneratingAi}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Bot className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAi ? (isAr ? 'جارِ التحليل...' : 'Analyzing...') : (isAr ? 'تحليل ذكي لليوم 🪄' : 'AI Analysis 🪄')}</span>
                </button>
              </div>

              {/* AI Deep Analysis Output Card (if generated) */}
              {aiAnalysisResult && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 space-y-2 animate-fade-in text-xs leading-relaxed text-indigo-950 dark:text-indigo-200">
                  <div className="flex items-center justify-between pb-1 border-b border-indigo-200/60 dark:border-indigo-800/40">
                    <span className="font-bold flex items-center gap-1.5 text-indigo-800 dark:text-indigo-300">
                      <Brain className="w-4 h-4" />
                      <span>{isAr ? 'التشخيص السلوكي الشخصي من مِضمار AI' : 'Cognitive Behavioral Diagnosis'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAiAnalysisResult(null)}
                      className="text-slate-400 hover:text-slate-600 text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="whitespace-pre-line font-medium text-slate-800 dark:text-zinc-200">
                    {aiAnalysisResult}
                  </div>
                </div>
              )}

              {/* 4 Pillars Real Life Balance Grid */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'تفصيل أركان الحياة الأربعة (LifeOS Pillars):' : 'Four Pillars Balance Matrix:'}</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pillar 1: Spiritual & Prayers (35%) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <span>🕌</span>
                        <span>{isAr ? 'الركن الإيماني والصلوات (35%)' : 'Spiritual & Prayers'}</span>
                      </span>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {dailyMetrics.spiritualScore}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${dailyMetrics.spiritualScore}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                      <span>{dailyMetrics.completedPrayersCount} / 5 {isAr ? 'صلوات في وقتها' : 'prayers'}</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {dailyMetrics.fajrDoneOnTime ? (isAr ? '👑 الفجر أُنجز' : 'Fajr done') : (isAr ? '⚠️ الفجر مؤجل' : 'Fajr delayed')}
                      </span>
                    </div>
                  </div>

                  {/* Pillar 2: Deep Work & Career (30%) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                        <span>{isAr ? 'ركن العمل والتركيز العميق (30%)' : 'Deep Work & Focus'}</span>
                      </span>
                      <span className="text-xs font-black font-mono text-sky-600 dark:text-cyan-400">
                        {dailyMetrics.workScore}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                        style={{ width: `${dailyMetrics.workScore}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                      <span>{dailyMetrics.focusMins} {isAr ? 'دقيقة تركيز صافٍ' : 'focus mins'}</span>
                      <span className="font-mono font-bold text-sky-700 dark:text-cyan-400">
                        {dailyMetrics.focusSessions} {isAr ? 'جلسات' : 'sessions'}
                      </span>
                    </div>
                  </div>

                  {/* Pillar 3: Circadian Rest & Recovery (20%) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{isAr ? 'ركن الاستشفاء والنوم (20%)' : 'Sleep & Recovery'}</span>
                      </span>
                      <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {dailyMetrics.sleepScore}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
                        style={{ width: `${dailyMetrics.sleepScore}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                      <span>{dailyMetrics.sleepHours} {isAr ? 'ساعات نوم' : 'hrs sleep'} ({dailyMetrics.sleepQuality})</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {todayLog?.powerNapDone ? (isAr ? '☕ قيلولة ظهر ✔' : 'Power Nap ✔') : (isAr ? '— بدون قيلولة' : 'No Nap')}
                      </span>
                    </div>
                  </div>

                  {/* Pillar 4: Physical Anchor & Mind (15%) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>{isAr ? 'الصحة البدنية والصفاء (15%)' : 'Physical & Mind'}</span>
                      </span>
                      <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-400">
                        {dailyMetrics.physicalMindScore}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 transition-all duration-500 rounded-full"
                        style={{ width: `${dailyMetrics.physicalMindScore}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                      <span>{dailyMetrics.gymDone ? (isAr ? '🏋️‍♂️ الجيم منجز' : 'Gym Done') : (isAr ? '— استشفاء/راحة' : 'Rest')}</span>
                      <span>{dailyMetrics.retrospectiveDone ? (isAr ? '📝 المراجعة تمت' : 'Review Done') : (isAr ? 'قيد الانتظار' : 'Pending')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEEKLY EVALUATION */}
          {activeTab === 'weekly' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-l from-indigo-50 to-white dark:from-indigo-950/40 dark:to-zinc-900 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    {isAr ? 'تقرير آخر 7 أيام فعلية' : 'True 7-Day Performance'}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
                    {isAr ? 'مصفوفة الاتساق والالتزام الأسبوعي' : 'Weekly Consistency Scorecard'}
                  </h3>
                </div>
                <div className="text-end">
                  <div className="text-xl font-black text-indigo-700 dark:text-indigo-400 font-mono">
                    {weeklyMetrics.weeklyPrayerConsistency}%
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {isAr ? 'نسبة الصلوات في وقتها' : 'Prayers on time'}
                  </span>
                </div>
              </div>

              {/* 7-Day Visual Mini Bar Chart */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {isAr ? 'رسم بياني لأداء الأيام السبعة:' : '7-Day Activity Chart:'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {isAr ? 'معدل الصلاة والنقاط لكل يوم' : 'Daily prayer & points ratio'}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2 pt-2 items-end min-h-[90px]">
                  {weeklyMetrics.dailyBars.map((bar, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex flex-col items-center">
                        <div
                          style={{ height: `${Math.max(15, bar.prayerScore * 0.65)}px` }}
                          className={`w-full rounded-t-lg transition-all ${
                            bar.prayerScore === 100
                              ? 'bg-emerald-500'
                              : bar.prayerScore >= 60
                              ? 'bg-sky-500'
                              : 'bg-amber-500'
                          } ${bar.isToday ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-zinc-900' : ''}`}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300">
                        {bar.prayersOnTime}/5
                      </span>
                      <span className={`text-[10px] font-bold truncate max-w-[40px] ${bar.isToday ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-400'}`}>
                        {bar.dayLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 Weekly Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                    👑 {isAr ? 'حارس الفجر الأسبوعي:' : 'Fajr Keeper:'}
                  </span>
                  <div className="text-base font-black text-emerald-600 font-mono">
                    {weeklyMetrics.totalFajrOnTime} / {weeklyMetrics.dailyBars.length} {isAr ? 'أيام في وقته' : 'days'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                    📖 {isAr ? 'سورة البقرة والختمات:' : 'Baqarah Completions:'}
                  </span>
                  <div className="text-base font-black text-indigo-600 font-mono">
                    {weeklyMetrics.totalBaqarahDone} {isAr ? 'مرات إتمام' : 'times'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                    ⏱️ {isAr ? 'ساعات العمل المركز:' : 'Focus Hours:'}
                  </span>
                  <div className="text-base font-black text-sky-600 font-mono">
                    {weeklyMetrics.totalFocusHours} {isAr ? 'ساعة عمل صافٍ' : 'hrs'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                    🌙 {isAr ? 'متوسط ساعات النوم:' : 'Avg Sleep:'}
                  </span>
                  <div className="text-base font-black text-purple-600 font-mono">
                    {weeklyMetrics.avgSleepHours} {isAr ? 'ساعة / ليلة' : 'hrs/night'}
                  </div>
                </div>
              </div>

              {/* Weekly Advice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
                <span className="font-bold block mb-1">
                  💡 {isAr ? 'خطة الأسبوع القادم المقترحة:' : 'Next Week Strategy:'}
                </span>
                {isAr
                  ? 'ثبت ورد سورة البقرة في نافذة الصباح بعد الفجر مباشرة، واعتمد على قاعدة الدقيقتين في بداية كل جلسة عمل لتفادي أي احتكاك نفسي.'
                  : 'Anchor Surah Baqarah in the morning and utilize the 2-minute rule.'}
              </div>
            </div>
          )}

          {/* TAB 3: MONTHLY EVALUATION */}
          {activeTab === 'monthly' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    {isAr ? 'مسار الـ 30 يوماً الماضية الحقيقية' : '30-Day True Trajectory'}
                  </h3>
                  <span className="text-xs font-extrabold text-emerald-600 font-mono">
                    {monthlyMetrics.monthlyTotalPoints} {isAr ? 'نقطة إجمالية' : 'total pts'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {isAr
                    ? `تم تسجيل ${monthlyMetrics.activeDays} يوماً نشطاً هذا الشهر. تم أداء ${monthlyMetrics.monthlyPrayersDone} صلاة في وقتها (${monthlyMetrics.monthlyConsistencyPct}%)، وإنجاز ${monthlyMetrics.monthlyFocusHours} ساعة عمل مركز.`
                    : `${monthlyMetrics.activeDays} active days recorded with ${monthlyMetrics.monthlyPrayersDone} prayers on time.`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-l from-amber-50 to-white dark:from-amber-950/20 dark:to-zinc-900 border border-amber-200 dark:border-amber-800/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-600" />
                  {isAr ? 'الإنجاز الأبرز لهذا الشهر:' : 'Monthly Top Milestone:'}
                </span>
                <p className="text-[11px] text-slate-700 dark:text-zinc-300">
                  {isAr
                    ? 'بناء عادات الصلاة في وقتها وقراءة سورة البقرة والنوم المنضبط أحدث فارقاً ملموساً في بركة الوقت والتركيز الذهني دون إجهاد.'
                    : 'Consistent prayer on time and circadian rest have unlocked substantial daily barakah.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CONTINUOUS SPIRITUAL MOTIVATION */}
          {activeTab === 'motivation' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">
                <Quote className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'أنوار نبوية وحِكم تحفيزية مستمرة:' : 'Spiritual Motivation & Hadiths:'}</span>
              </div>

              {SPIRITUAL_HADITHS_WISDOM.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-zinc-800/60 border border-emerald-100 dark:border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      {item.topic}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">{item.source}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 leading-relaxed font-serif">
                    {item.hadith}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
