import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { db } from '../../db/db';
import type { StationId } from '../../types';
import {
  calculateCourseScheduleMetrics,
  recordDailyCourseProgress,
  getCourseCategoryLabel,
  getCourseUnitLabel,
} from '../../utils/courseStudyEngine';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface ActiveStudyCourseWidgetProps {
  onSelectStation: (st: StationId) => void;
  onRewardToast?: (msg: string) => void;
}

export const ActiveStudyCourseWidget: React.FC<ActiveStudyCourseWidgetProps> = ({
  onSelectStation,
  onRewardToast,
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
        console.warn('Failed to query study_courses for dashboard widget:', e);
        return [];
      }
    },
    [],
    []
  );

  const activeCourses = useMemo(() => {
    return (courses || []).filter((c) => c.status === 'active');
  }, [courses]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const currentCourse = useMemo(() => {
    if (activeCourses.length === 0) return null;
    return activeCourses.find((c) => c.id === selectedCourseId) || activeCourses[0];
  }, [activeCourses, selectedCourseId]);

  const metrics = useMemo(() => {
    if (!currentCourse) return null;
    return calculateCourseScheduleMetrics(currentCourse, todayStr);
  }, [currentCourse, todayStr]);

  const handleOpenCourseHub = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    localStorage.setItem('midmar_work_view_mode', 'learning_tracker');
    localStorage.setItem('midmar_learning_subtab', 'courses');
    window.dispatchEvent(
      new CustomEvent('midmar_switch_work_mode', {
        detail: { mode: 'learning_tracker', subTab: 'courses' },
      })
    );
    onSelectStation('WORK_MICRO_SPRINT');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleQuickIncrement = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCourse) return;

    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();

    const updated = recordDailyCourseProgress(currentCourse, 1, todayStr);
    await db.study_courses.put(updated);

    const unitLabel = getCourseUnitLabel(currentCourse.unitType, 1, isAr);
    if (onRewardToast) {
      if (updated.status === 'completed') {
        onRewardToast(
          isAr
            ? `🎉 مبروك! أتممت خطة "${currentCourse.title}" بالكامل! 🏆 (+50 XP)`
            : `🎉 Completed "${currentCourse.title}"! (+50 XP)`
        );
      } else if (updated.surplusUnits > 0) {
        onRewardToast(
          isAr
            ? `🚀 رائع! أنجزت ${unitLabel} وأنت متقدم بفائض (+${updated.surplusUnits})! (+15 XP)`
            : `🚀 Great! Logged ${unitLabel}, ahead by +${updated.surplusUnits}!`
        );
      } else if (updated.backlogUnits > 0) {
        onRewardToast(
          isAr
            ? `🎯 تم تسجيل ${unitLabel}! متبقي (${updated.backlogUnits}) لاستعادة المسار.`
            : `🎯 Logged ${unitLabel}. Remaining backlog: ${updated.backlogUnits}.`
        );
      } else {
        onRewardToast(
          isAr
            ? `🎯 أحسنت! أنت بالضبط على المسار اليومي المطلوب (+15 XP)`
            : `🎯 Perfect pace! On track (+15 XP)`
        );
      }
    }
  };

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/40 dark:from-[#0d1020] dark:via-[#0c0d16] dark:to-[#12162a] border border-indigo-500/25 dark:border-indigo-500/20 p-4 sm:p-6 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shadow-inner shrink-0 border border-indigo-500/25">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 font-serif">
                {isAr ? 'محراب المذاكرة ومسار الكورسات الذكي' : 'Smart Course Study & Roadmap Hub'}
              </h3>
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60 shadow-2xs">
                <span>⚡ 0 Tokens</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-300 font-medium mt-0.5">
              {isAr
                ? 'متابعة حصتك اليومية، راصد السرعة الحقيقي، والتوزيع الذاتي للمتراكم'
                : 'Daily study quota, velocity forecaster, and auto-rebalancing radar'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCourseHub}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <span>{isAr ? 'فتح المحراب الكامل' : 'Open Course Hub'}</span>
          <ArrowIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Content Body */}
      {currentCourse && metrics ? (
        <div className="space-y-3.5 pt-1">
          {/* Multi-Course Switcher Tabs (if more than 1 active course) */}
          {activeCourses.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {activeCourses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setSelectedCourseId(c.id);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    currentCourse.id === c.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white/80 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-indigo-300'
                  }`}
                >
                  <span>{c.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Active Course Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121422] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-3.5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                    {getCourseCategoryLabel(currentCourse.category, isAr)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                    {isAr ? `متبقي ${metrics.studyDaysRemaining} يوماً` : `${metrics.studyDaysRemaining} days left`}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                  {currentCourse.title}
                </h4>
              </div>

              {/* Pace Radar Badge */}
              <div className="shrink-0">
                {metrics.currentPaceStatus === 'ahead' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {isAr
                        ? `متقدم بفائض (+${metrics.surplusUnits} ${getCourseUnitLabel(currentCourse.unitType, metrics.surplusUnits, true)}) 🚀`
                        : `Ahead (+${metrics.surplusUnits}) 🚀`}
                    </span>
                  </span>
                ) : metrics.currentPaceStatus === 'behind' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-2xs animate-pulse">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      {isAr
                        ? `متأخر (-${metrics.backlogUnits} ${getCourseUnitLabel(currentCourse.unitType, metrics.backlogUnits, true)}) ⚠️`
                        : `Behind (-${metrics.backlogUnits}) ⚠️`}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-800 dark:text-sky-300 text-xs font-bold shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>
                      {isAr
                        ? `على المسار المنشود تماماً 🎯`
                        : `Perfect Pace 🎯`}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar & Numeric Stats */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-zinc-300">
                  {currentCourse.completedUnits} / {currentCourse.totalUnits}{' '}
                  {getCourseUnitLabel(currentCourse.unitType, currentCourse.totalUnits, isAr)}
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {metrics.completionPercentage}%
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden p-0.5 border border-slate-200/60 dark:border-zinc-700/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.completionPercentage))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-0.5">
                <span>
                  {isAr ? 'حصة اليوم الموصى بها:' : 'Today recommended quota:'}{' '}
                  <strong className="text-slate-800 dark:text-zinc-200 font-mono">
                    {metrics.recommendedDailyUnits} {getCourseUnitLabel(currentCourse.unitType, metrics.recommendedDailyUnits, isAr)}
                  </strong>
                </span>
                <span>
                  {isAr ? 'الموعد المستهدف:' : 'Target:'}{' '}
                  <strong className="text-slate-700 dark:text-zinc-300 font-mono">
                    {currentCourse.targetEndDate}
                  </strong>
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/70 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={handleQuickIncrement}
                className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isAr
                    ? `+1 إنجاز ${getCourseUnitLabel(currentCourse.unitType, 1, isAr)} الآن (+15 XP) 🎯`
                    : `+1 Log ${getCourseUnitLabel(currentCourse.unitType, 1, isAr)} (+15 XP) 🎯`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenCourseHub}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                <span>{isAr ? 'التفاصيل والدروس 📚' : 'Details 📚'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Invitation Card */
        <div
          onClick={handleOpenCourseHub}
          className="p-5 rounded-2xl bg-white/90 dark:bg-[#121422] border border-dashed border-indigo-300 dark:border-indigo-800/60 hover:border-indigo-500 text-start flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer transition-all group select-none shadow-2xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {isAr ? 'هل تذاكر كورس أو كتاباً حالياً؟ خطط له في ثوانٍ!' : 'Studying a course or reading a book? Plan it in seconds!'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                {isAr
                  ? 'اكتب أو تحدث باسم الكورس وعدد فيديوهاته، ليقوم المحرك بجدولة حصتك اليومية ومتابعة وتيرتك ذاتياً (0 توكن ⚡)'
                  : 'Speak or type your course details for an automated, zero-token daily study plan'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white font-bold text-xs shrink-0 shadow-xs transition-transform group-hover:scale-105 cursor-pointer"
          >
            {isAr ? '✨ إنشاء خطة كورس ذكية' : '✨ Start AI Study Plan'}
          </button>
        </div>
      )}
    </div>
  );
};
