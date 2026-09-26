import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  GraduationCap,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Send,
  Mic,
  MicOff,
  Video,
  BookOpen,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { StudyCourse, StudyCourseLesson } from '../../types';
import { db } from '../../db/db';
import {
  calculateCourseScheduleMetrics,
  recordDailyCourseProgress,
  rebalanceCourseSchedule,
  syncCourseQuotaToWorkdayTask,
  getCourseCategoryLabel,
  getCourseUnitLabel,
} from '../../utils/courseStudyEngine';
import { courseAiPlannerService } from '../../services/courseAiPlannerService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { speechService } from '../../services/speechService';
import { useTranslation } from '../../i18n/LanguageContext';

interface CourseStudyHubProps {
  onRewardToast?: (msg: string) => void;
  className?: string;
}

const PRESET_AI_PROMPTS = [
  'بذاكر كورس بايثون 40 فيديو في 10 أيام بمعدل 4 فيديوهات يومياً',
  'كورس رياكت 60 درس عاوز اخلصه في شهر، الجمعة راحة',
  'كتاب العادات الذرية 20 فصل، بمعدل فصل كل يوم',
  'دورة إتقان محادثة الإنجليزية 30 درساً في أسبوعين',
  'مادة الفقه 15 محاضرة، عاوز أخلصها قبل نهاية الشهر',
];

export const CourseStudyHub: React.FC<CourseStudyHubProps> = ({
  onRewardToast,
  className = '',
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Live Query all study courses from Dexie
  const courses = useLiveQuery(
    async () => {
      try {
        return await db.study_courses.reverse().sortBy('createdAt');
      } catch (e) {
        console.warn('Failed to query study_courses', e);
        return [];
      }
    },
    [],
    []
  );

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const activeCourse = useMemo(() => {
    if (!courses || courses.length === 0) return null;
    return courses.find((c) => c.id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  // Modal / Drawer States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLessonsExpanded, setIsLessonsExpanded] = useState(false);

  // Manual Form States
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState<StudyCourse['category']>('programming');
  const [manualUnitType, setManualUnitType] = useState<StudyCourse['unitType']>('video');
  const [manualTotalUnits, setManualTotalUnits] = useState(30);
  const [manualCompletedUnits, setManualCompletedUnits] = useState(0);
  const [manualTargetDays, setManualTargetDays] = useState(15);
  const [manualPlannedDaily, setManualPlannedDaily] = useState(2);
  const [manualReminderTime, setManualReminderTime] = useState('17:00');

  // Compute live metrics for active course
  const activeMetrics = useMemo(() => {
    if (!activeCourse) return null;
    return calculateCourseScheduleMetrics(activeCourse, todayStr);
  }, [activeCourse, todayStr]);

  // Handle Voice Input for AI Prompt
  const handleToggleVoice = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
    } else {
      if (!speechService.isSupported()) {
        if (onRewardToast) onRewardToast(isAr ? 'التعرف الصوتي غير مدعوم في متصفحك' : 'Speech not supported');
        return;
      }
      setIsRecording(true);
      speechService.startListening(
        (text) => setAiPromptInput((prev) => (prev ? `${prev} ${text}` : text)),
        () => setIsRecording(false),
        () => setIsRecording(false)
      );
    }
  };

  // Generate course via AI
  const handleGenerateCourseWithAi = async () => {
    if (!aiPromptInput.trim()) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsGenerating(true);

    try {
      const generatedCourse = await courseAiPlannerService.parseNaturalLanguagePlan(
        aiPromptInput.trim(),
        todayStr
      );

      await db.study_courses.add(generatedCourse);
      setSelectedCourseId(generatedCourse.id);
      setIsAiModalOpen(false);
      setAiPromptInput('');

      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `✨ تم توليد خطة "${generatedCourse.title}" بنجاح (${generatedCourse.totalUnits} ${getCourseUnitLabel(generatedCourse.unitType, generatedCourse.totalUnits, true)})!`
            : `✨ Generated plan for "${generatedCourse.title}"!`
        );
      }
    } catch (err) {
      console.error('Failed to create course:', err);
      if (onRewardToast) {
        onRewardToast(isAr ? 'حدث خطأ أثناء إعداد الخطة، يرجى المحاولة ثانية' : 'Error generating course');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual course creation
  const handleCreateManualCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + Math.max(1, manualTargetDays));
    const targetEndDateStr = targetDate.toISOString().split('T')[0];

    const courseId = `course_${Date.now()}`;
    const newCourse: StudyCourse = {
      id: courseId,
      title: manualTitle.trim(),
      category: manualCategory,
      unitType: manualUnitType,
      totalUnits: Math.max(1, manualTotalUnits),
      completedUnits: Math.min(manualTotalUnits, Math.max(0, manualCompletedUnits)),
      startDate: todayStr,
      targetEndDate: targetEndDateStr,
      plannedUnitsPerDay: Math.max(1, manualPlannedDaily),
      studyDaysPerWeek: [0, 1, 2, 3, 4, 6],
      currentPaceStatus: 'on_track',
      backlogUnits: 0,
      surplusUnits: 0,
      recommendedDailyUnits: Math.max(1, manualPlannedDaily),
      lessons: [],
      dailyLogs: [],
      autoSyncToWorkday: true,
      reminderTime: manualReminderTime,
      reminderEnabled: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.study_courses.add(newCourse);
    setSelectedCourseId(courseId);
    setIsManualModalOpen(false);
    setManualTitle('');

    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    if (onRewardToast) {
      onRewardToast(isAr ? '✅ تمت إضافة الخطة الدراسية بنجاح!' : 'Course created successfully!');
    }
  };

  // Quick Progress Increment (+1, +2, or today quota)
  const handleQuickProgress = async (count: number) => {
    if (!activeCourse) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const updated = recordDailyCourseProgress(activeCourse, count, todayStr);
    await db.study_courses.put(updated);

    if (updated.status === 'completed') {
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `🎉 مبروك! أتممت خطة "${activeCourse.title}" بالكامل! 🏆`
            : `🎉 Congratulations! Completed "${activeCourse.title}"! 🏆`
        );
      }
    } else {
      const surplus = updated.surplusUnits;
      if (surplus > 0) {
        if (onRewardToast) {
          onRewardToast(
            isAr
              ? `🚀 إنجاز ممتاز! أنت متقدم بفائض (+${surplus}) ${getCourseUnitLabel(activeCourse.unitType, surplus, true)}!`
              : `🚀 Great pace! You are ahead by ${surplus} units!`
          );
        }
      } else if (updated.backlogUnits > 0) {
        if (onRewardToast) {
          onRewardToast(
            isAr
              ? `تم تسجيل ${count} ${getCourseUnitLabel(activeCourse.unitType, count, true)}. متبقي (${updated.backlogUnits}) لاستعادة المسار 🎯`
              : `Logged progress. Backlog is ${updated.backlogUnits} units.`
          );
        }
      } else {
        if (onRewardToast) {
          onRewardToast(
            isAr
              ? `🎯 أحسنت! أنت بالضبط على المسار المخطط (+${count})`
              : `🎯 On track (+${count})`
          );
        }
      }
    }
  };

  // Toggle individual lesson completion
  const handleToggleLesson = async (lesson: StudyCourseLesson) => {
    if (!activeCourse) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const updatedLessons = (activeCourse.lessons || []).map((l) =>
      l.id === lesson.id ? { ...l, completed: !l.completed, completedAt: !l.completed ? new Date().toISOString() : undefined } : l
    );

    const newCompletedCount = updatedLessons.filter((l) => l.completed).length;
    const diff = newCompletedCount - activeCourse.completedUnits;

    if (diff > 0) {
      await handleQuickProgress(diff);
    } else {
      const interim: StudyCourse = {
        ...activeCourse,
        completedUnits: newCompletedCount,
        lessons: updatedLessons,
        updatedAt: new Date().toISOString(),
      };
      const recalculated = calculateCourseScheduleMetrics(interim, todayStr);
      await db.study_courses.put({
        ...interim,
        currentPaceStatus: recalculated.currentPaceStatus,
        backlogUnits: recalculated.backlogUnits,
        surplusUnits: recalculated.surplusUnits,
        recommendedDailyUnits: recalculated.recommendedDailyUnits,
      });
    }
  };

  // Re-balance strategies (Redistribute, Extend, Catchup)
  const handleRebalance = async (strategy: 'redistribute' | 'extend_deadline' | 'catchup_sprint') => {
    if (!activeCourse) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const rebalanced = rebalanceCourseSchedule(activeCourse, strategy, todayStr);
    await db.study_courses.put(rebalanced);

    if (onRewardToast) {
      if (strategy === 'redistribute') {
        onRewardToast(
          isAr
            ? `⚡ تم توزيع المتراكم بالتساوي. حصتك الجديدة: ${rebalanced.plannedUnitsPerDay} يومياً.`
            : 'Redistributed backlog across remaining days.'
        );
      } else if (strategy === 'extend_deadline') {
        onRewardToast(
          isAr
            ? `📅 تم تمديد الموعد إلى ${rebalanced.targetEndDate} للحفاظ على راحتك الذهنية.`
            : `Extended deadline to ${rebalanced.targetEndDate}.`
        );
      } else {
        onRewardToast(
          isAr
            ? '🛡️ تم تحديد جلسة استدراك تعويضية لإنهاء المتراكم!'
            : 'Catch-up sprint active.'
        );
      }
    }
  };

  // Sync today's quota to WorkdayPlanner
  const handleSyncToWorkday = async () => {
    if (!activeCourse) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    try {
      const task = await syncCourseQuotaToWorkdayTask(activeCourse, todayStr);
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `📌 تم إرسال حصة اليوم بنجاح إلى جدول العمل: "${task.title}"!`
            : `📌 Synced quota to Workday Tasks: "${task.title}"!`
        );
      }
    } catch (e) {
      console.error('Failed to sync to workday tasks', e);
      if (onRewardToast) {
        onRewardToast(isAr ? 'تعذر إرسال المهمة لجدول العمل' : 'Failed to sync');
      }
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذه الخطة الدراسية؟' : 'Delete this course plan?')) {
      return;
    }
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    await db.study_courses.delete(courseId);
    if (onRewardToast) {
      onRewardToast(isAr ? 'تم حذف الخطة' : 'Course deleted');
    }
  };

  return (
    <div className={`space-y-4 ${className}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header & Course Track Selector */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider">
                  {isAr ? 'محراب المذاكرة والتعلم الذاتي' : 'Self-Learning Engine'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                  {courses?.length || 0} {isAr ? 'مسارات' : 'courses'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                {isAr ? 'منظم ومخطط الكورسات الذكي' : 'Smart Course Study Planner'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsAiModalOpen(true);
              }}
              className="tap-spring flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>{isAr ? 'خطة ذكية بالـ AI ✨' : 'AI Plan ✨'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setIsManualModalOpen(true);
              }}
              className="tap-spring p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
              title={isAr ? 'إضافة خطة يدوياً' : 'Add manual plan'}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Course Tabs Carousel */}
        {courses && courses.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {courses.map((c) => {
              const isSelected = activeCourse?.id === c.id;
              const isCompleted = c.completedUnits >= c.totalUnits;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setSelectedCourseId(c.id);
                  }}
                  className={`tap-spring shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/25 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} />
                  ) : c.unitType === 'video' ? (
                    <Video className="w-3.5 h-3.5 opacity-80" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5 opacity-80" />
                  )}
                  <span className="truncate max-w-[140px]">{c.title}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400'}`}>
                    {Math.round((c.completedUnits / (c.totalUnits || 1)) * 100)}%
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-dashed border-indigo-200 dark:border-indigo-800/50 text-center space-y-2">
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              {isAr
                ? 'لا توجد كورسات مضافة حالياً. اضغط "خطة ذكية بالـ AI" واكتب بأسلوبك البسيط، أو اختر أحد الأمثلة الجاهزة!'
                : 'No courses added yet. Tap "AI Plan" and write naturally!'}
            </p>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="tap-spring px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'ابدأ خطتك الأولى الآن' : 'Start your first plan'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Active Course Main Dashboard Card */}
      {activeCourse && activeMetrics && (
        <div className="space-y-4">
          {/* Main Visual Status & Progress Radar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            {/* Top Bar: Title, Category, Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                    {getCourseCategoryLabel(activeCourse.category, isAr)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isAr ? `تاريخ البدء: ${activeCourse.startDate}` : `Started: ${activeCourse.startDate}`}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                  {activeCourse.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Pace Status Badge */}
                {activeMetrics.currentPaceStatus === 'completed' && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'مكتمل بنجاح 🏆' : 'Completed 🏆'}</span>
                  </span>
                )}
                {activeMetrics.currentPaceStatus === 'ahead' && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30 animate-pulse">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{isAr ? `متقدم (+${activeMetrics.surplusUnits} فائض) 🚀` : `Ahead (+${activeMetrics.surplusUnits}) 🚀`}</span>
                  </span>
                )}
                {activeMetrics.currentPaceStatus === 'on_track' && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-800 dark:text-cyan-300 text-xs font-bold border border-sky-500/30">
                    <Target className="w-3.5 h-3.5" />
                    <span>{isAr ? 'على المسار الصحيح 🎯' : 'On Track 🎯'}</span>
                  </span>
                )}
                {activeMetrics.currentPaceStatus === 'behind' && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{isAr ? `متأخر (-${activeMetrics.backlogUnits} متراكم) ⚠️` : `Behind (-${activeMetrics.backlogUnits}) ⚠️`}</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteCourse(activeCourse.id)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title={isAr ? 'حذف الكورس' : 'Delete course'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Metrics Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-zinc-400 font-medium">
                  {isAr ? 'نسبة الإنجاز الكلية:' : 'Total Progress:'}{' '}
                  <strong className="text-slate-900 dark:text-zinc-100 font-mono">
                    {activeCourse.completedUnits} / {activeCourse.totalUnits} {getCourseUnitLabel(activeCourse.unitType, activeCourse.totalUnits, isAr)}
                  </strong>
                </span>
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                  {activeMetrics.completionPercentage}%
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 shadow-xs"
                  style={{ width: `${activeMetrics.completionPercentage}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
                <span>
                  {isAr ? 'الموعد المستهدف:' : 'Target End:'}{' '}
                  <strong className="text-slate-700 dark:text-zinc-300 font-mono">{activeCourse.targetEndDate}</strong>
                </span>
                <span>
                  {isAr ? 'أيام المذاكرة المتبقية:' : 'Remaining Study Days:'}{' '}
                  <strong className="text-slate-700 dark:text-zinc-300 font-mono">{activeMetrics.studyDaysRemaining} {isAr ? 'يوم' : 'days'}</strong>
                </span>
              </div>
            </div>

            {/* 3. Today's Mission & Dynamic Quota Action Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-l from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <div>
                    <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold block">
                      {isAr ? 'حصة اليوم الموصى بها إدراكياً:' : 'Recommended Today Quota:'}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span>{activeMetrics.recommendedDailyUnits} {getCourseUnitLabel(activeCourse.unitType, activeMetrics.recommendedDailyUnits, isAr)}</span>
                      {activeMetrics.isTodayStudyDay ? (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          {isAr ? 'يوم مذاكرة حي' : 'Active Study Day'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          {isAr ? 'استراحة مجدولة ☕' : 'Scheduled Rest ☕'}
                        </span>
                      )}
                    </h4>
                  </div>
                </div>

                {/* 1-Tap Sync to Workday Tasks Button */}
                <button
                  type="button"
                  onClick={handleSyncToWorkday}
                  className="tap-spring flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                  title={isAr ? 'إرسال حصة اليوم إلى جدول مهام العمل' : 'Sync to Workday Tasks'}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إرسال لجدول المهام' : 'Add to Workday'}</span>
                </button>
              </div>

              {/* Quick Increment Progress Buttons */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {isAr ? 'تسجيل إنجاز اليوم:' : 'Log Today Progress:'}
                </span>

                <button
                  type="button"
                  onClick={() => handleQuickProgress(1)}
                  className="tap-spring px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  +1 {getCourseUnitLabel(activeCourse.unitType, 1, isAr)}
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickProgress(2)}
                  className="tap-spring px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  +2 {getCourseUnitLabel(activeCourse.unitType, 2, isAr)}
                </button>

                {activeMetrics.recommendedDailyUnits > 2 && (
                  <button
                    type="button"
                    onClick={() => handleQuickProgress(activeMetrics.recommendedDailyUnits)}
                    className="tap-spring px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    +حصة اليوم كاملة ({activeMetrics.recommendedDailyUnits}) ✔
                  </button>
                )}
              </div>
            </div>

            {/* 4. Interactive Backlog Rebalance Card (If user is behind schedule) */}
            {activeMetrics.currentPaceStatus === 'behind' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-amber-900 dark:text-amber-200">
                      {isAr
                        ? `تراكم عليك (${activeMetrics.backlogUnits}) ${getCourseUnitLabel(activeCourse.unitType, activeMetrics.backlogUnits, true)} عن الخطة الأساسية!`
                        : `Backlog: You have ${activeMetrics.backlogUnits} units accumulated!`}
                    </h5>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                      {isAr
                        ? 'لا تشعر بالضغط أو الذنب! مِضمار مصمم لحماية صفائك الذهني. اختر أحد الحلول الثلاثة وسيقوم النظام بضبط الجدول فوراً:'
                        : 'No stress! Choose one of the 3 re-balancing options:'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Option 1: Redistribute evenly */}
                  <button
                    type="button"
                    onClick={() => handleRebalance('redistribute')}
                    className="tap-spring p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-amber-500/30 hover:border-amber-500 text-start space-y-1 transition-all active:scale-98 cursor-pointer shadow-2xs"
                  >
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <span>⚡</span>
                      <span>{isAr ? 'توزيع بالتساوي' : 'Redistribute'}</span>
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {isAr
                        ? `يصبح المطلوب ${activeMetrics.recommendedDailyUnits} يومياً حتى نفس الموعد.`
                        : `Adjusts daily quota to ${activeMetrics.recommendedDailyUnits}.`}
                    </p>
                  </button>

                  {/* Option 2: Extend deadline */}
                  <button
                    type="button"
                    onClick={() => handleRebalance('extend_deadline')}
                    className="tap-spring p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-amber-500/30 hover:border-amber-500 text-start space-y-1 transition-all active:scale-98 cursor-pointer shadow-2xs"
                  >
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                      <span>📅</span>
                      <span>{isAr ? 'تمديد الموعد بمرونة' : 'Extend Deadline'}</span>
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {isAr
                        ? `يحافظ على ${activeCourse.plannedUnitsPerDay} يومياً ويمد التاريخ لراحتك.`
                        : 'Keeps gentle daily quota and extends deadline.'}
                    </p>
                  </button>

                  {/* Option 3: Catch-up Sprint */}
                  <button
                    type="button"
                    onClick={() => handleRebalance('catchup_sprint')}
                    className="tap-spring p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-amber-500/30 hover:border-amber-500 text-start space-y-1 transition-all active:scale-98 cursor-pointer shadow-2xs"
                  >
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <span>🛡️</span>
                      <span>{isAr ? 'جلسة استدراك' : 'Catch-up Sprint'}</span>
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {isAr
                        ? 'تخصيص جلسة تركيز تعويضية لإنهاء التراكم.'
                        : 'Dedicate one focus block to clear backlog.'}
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* 5. Surplus Celebration Card (If user is ahead of schedule) */}
            {activeMetrics.currentPaceStatus === 'ahead' && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🚀</span>
                  <div>
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block">
                      {isAr
                        ? `أنت متقدم بفائض (+${activeMetrics.surplusUnits}) ${getCourseUnitLabel(activeCourse.unitType, activeMetrics.surplusUnits, true)}!`
                        : `Ahead of schedule (+${activeMetrics.surplusUnits} units)!`}
                    </span>
                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                      {isAr
                        ? `بهذا المعدل ستنهي الكورس مبكراً في ${activeMetrics.projectedCompletionDate}!`
                        : `Projected finish: ${activeMetrics.projectedCompletionDate}!`}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40 shrink-0">
                  +30 XP Bonus 🌟
                </span>
              </div>
            )}

            {/* 6. Expandable Lessons Checklist */}
            {activeCourse.lessons && activeCourse.lessons.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsLessonsExpanded(!isLessonsExpanded)}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>{isAr ? 'قائمة الدروس والمحطات التفصيلية' : 'Detailed Lessons Checklist'} ({activeCourse.lessons.length})</span>
                  </span>
                  {isLessonsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isLessonsExpanded && (
                  <div className="space-y-1.5 pt-2 max-h-60 overflow-y-auto pr-1">
                    {activeCourse.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        onClick={() => handleToggleLesson(lesson)}
                        className={`tap-spring flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                          lesson.completed
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-slate-500 line-through border border-emerald-200/50 dark:border-emerald-800/30'
                            : 'bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 text-slate-800 dark:text-zinc-200 border border-slate-200/60 dark:border-zinc-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              lesson.completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 dark:border-zinc-600'
                            }`}
                          >
                            {lesson.completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        {lesson.durationMinutes && (
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {lesson.durationMinutes}m
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. AI Smart Plan Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                    {isAr ? 'توليد خطة المذاكرة بالذكاء الاصطناعي' : 'AI Course Study Generator'}
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {isAr ? 'اكتب أو أملِ صوتياً ما تريد دراسته بحرية تامة' : 'Speak or type naturally'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prompt Textarea */}
            <div className="space-y-1.5">
              <div className="relative">
                <textarea
                  rows={4}
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: بذاكر كورس بايثون 40 فيديو وعاوز اخلصه في 10 أيام بمعدل 4 فيديوهات في اليوم وببدأ من فيديو 1...'
                      : 'E.g. Studying Python course 40 videos in 10 days, 4 videos per day...'
                  }
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-indigo-500 leading-relaxed resize-none shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`absolute bottom-3 ${isAr ? 'left-3' : 'right-3'} p-2 rounded-xl tap-spring transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                  }`}
                  title={isRecording ? 'إيقاف التسجيل' : 'تحدث بالصوت'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {isRecording && (
                <p className="text-[10px] text-rose-500 font-bold animate-pulse">
                  {isAr ? '🎙️ جاري الاستماع وتفريغ صوتك...' : 'Listening actively...'}
                </p>
              )}
            </div>

            {/* Quick 1-Tap Preset Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold block">
                {isAr ? 'أو اختر نموذجاً جاهزاً بلمسة واحدة:' : 'Or tap a preset template:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_AI_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      setAiPromptInput(promptText);
                    }}
                    className="tap-spring text-[10px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="button"
              disabled={isGenerating || !aiPromptInput.trim()}
              onClick={handleGenerateCourseWithAi}
              className={`tap-spring w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                isGenerating || !aiPromptInput.trim()
                  ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 active:scale-95'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {isGenerating
                  ? isAr ? 'جاري تحليل الخطة وتوزيع المهام...' : 'Generating plan...'
                  : isAr ? 'تحويل إلى خطة ذكية ومجدولة ✨' : 'Generate Smart Roadmap ✨'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Manual Plan Creation Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                {isAr ? 'إضافة خطة دراسية يدوياً' : 'Add Course Manually'}
              </h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualCourse} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  {isAr ? 'اسم الكورس أو الكتاب:' : 'Course Title:'}
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder={isAr ? 'مثال: كورس بايثون الأساسي' : 'E.g. Python Core'}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isAr ? 'المجال:' : 'Category:'}
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200"
                  >
                    <option value="programming">{isAr ? 'برمجة وتطوير' : 'Programming'}</option>
                    <option value="languages">{isAr ? 'لغات' : 'Languages'}</option>
                    <option value="sharia">{isAr ? 'علوم شرعية' : 'Islamic'}</option>
                    <option value="business">{isAr ? 'أعمال وبزنس' : 'Business'}</option>
                    <option value="academic">{isAr ? 'دراسة أكاديمية' : 'Academic'}</option>
                    <option value="design">{isAr ? 'تصميم' : 'Design'}</option>
                    <option value="reading">{isAr ? 'قراءة وكتب' : 'Reading'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isAr ? 'نوع الوحدة:' : 'Unit Type:'}
                  </label>
                  <select
                    value={manualUnitType}
                    onChange={(e) => setManualUnitType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200"
                  >
                    <option value="video">{isAr ? 'فيديو' : 'Video'}</option>
                    <option value="lesson">{isAr ? 'درس' : 'Lesson'}</option>
                    <option value="chapter">{isAr ? 'فصل' : 'Chapter'}</option>
                    <option value="page">{isAr ? 'صفحة' : 'Page'}</option>
                    <option value="hour">{isAr ? 'ساعة' : 'Hour'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isAr ? 'إجمالي الوحدات:' : 'Total Units:'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={manualTotalUnits}
                    onChange={(e) => setManualTotalUnits(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isAr ? 'المنجز مسبقاً:' : 'Already Done:'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={manualCompletedUnits}
                    onChange={(e) => setManualCompletedUnits(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isAr ? 'الحصة اليومية:' : 'Daily Quota:'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={manualPlannedDaily}
                    onChange={(e) => setManualPlannedDaily(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isAr ? 'المدة المستهدفة (أيام):' : 'Target Days:'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={manualTargetDays}
                    onChange={(e) => setManualTargetDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  {isAr ? 'وقت التذكير اليومي:' : 'Daily Reminder Time:'}
                </label>
                <input
                  type="time"
                  value={manualReminderTime}
                  onChange={(e) => setManualReminderTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                className="tap-spring w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs active:scale-95 cursor-pointer mt-2"
              >
                {isAr ? 'حفظ الخطة وبدء المذاكرة' : 'Save & Start'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
