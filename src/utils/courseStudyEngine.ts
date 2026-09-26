import type {
  StudyCourse,
  StudyCourseLesson,
  StudyDailyProgressLog,
  WorkdayTask,
} from '../types';
import { db } from '../db/db';

export interface CourseScheduleMetrics {
  daysElapsed: number;
  studyDaysElapsed: number;
  totalStudyDays: number;
  studyDaysRemaining: number;
  expectedUnitsToDate: number;
  variance: number;
  isTodayStudyDay: boolean;
  remainingUnits: number;
  currentPaceStatus: 'ahead' | 'on_track' | 'behind' | 'completed';
  backlogUnits: number;
  surplusUnits: number;
  recommendedDailyUnits: number;
  completionPercentage: number;
  projectedCompletionDate: string;
}

/**
 * Counts active study days between two dates (inclusive) based on allowed days of week.
 * @param startDateStr YYYY-MM-DD
 * @param endDateStr YYYY-MM-DD
 * @param studyDaysPerWeek Array of numbers 0 (Sunday) to 6 (Saturday)
 */
export function countStudyDaysBetween(
  startDateStr: string,
  endDateStr: string,
  studyDaysPerWeek: number[] = [0, 1, 2, 3, 4, 6]
): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }

  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    if (studyDaysPerWeek.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Calculates full mathematical metrics, expected curve, and backlog/surplus for a study course.
 */
export function calculateCourseScheduleMetrics(
  course: StudyCourse,
  todayStr: string = new Date().toISOString().split('T')[0]
): CourseScheduleMetrics {
  const studyDays = course.studyDaysPerWeek || [0, 1, 2, 3, 4, 6];
  const today = new Date(todayStr);
  const start = new Date(course.startDate);

  const isTodayStudyDay = studyDays.includes(today.getDay());

  // Calendar days elapsed
  const diffTime = Math.max(0, today.getTime() - start.getTime());
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Study days elapsed up to today
  const studyDaysElapsed = countStudyDaysBetween(course.startDate, todayStr, studyDays);
  // Total study days planned in overall schedule
  const totalStudyDays = countStudyDaysBetween(course.startDate, course.targetEndDate, studyDays);
  // Study days remaining from today onwards (inclusive of today if study day)
  const studyDaysRemaining = Math.max(
    0,
    countStudyDaysBetween(todayStr, course.targetEndDate, studyDays)
  );

  const remainingUnits = Math.max(0, course.totalUnits - course.completedUnits);

  // Expected progress based on planned pace and elapsed study days
  const expectedUnitsToDate = Math.min(
    course.totalUnits,
    Math.round(studyDaysElapsed * (course.plannedUnitsPerDay || 1))
  );

  const variance = course.completedUnits - expectedUnitsToDate;

  let currentPaceStatus: CourseScheduleMetrics['currentPaceStatus'] = 'on_track';
  let backlogUnits = 0;
  let surplusUnits = 0;

  if (remainingUnits === 0) {
    currentPaceStatus = 'completed';
  } else if (variance > 0) {
    currentPaceStatus = 'ahead';
    surplusUnits = variance;
  } else if (variance < 0) {
    currentPaceStatus = 'behind';
    backlogUnits = Math.abs(variance);
  } else {
    currentPaceStatus = 'on_track';
  }

  // Recommended daily units dynamically adjusted to finish on target date
  let recommendedDailyUnits = course.plannedUnitsPerDay || 1;
  if (remainingUnits === 0) {
    recommendedDailyUnits = 0;
  } else if (studyDaysRemaining <= 1) {
    recommendedDailyUnits = remainingUnits;
  } else {
    recommendedDailyUnits = Math.max(1, Math.ceil(remainingUnits / studyDaysRemaining));
  }

  // Projected completion date at actual recent pace
  const recentLogs = course.dailyLogs?.slice(-7) || [];
  const avgPace = recentLogs.length > 0
    ? recentLogs.reduce((acc, log) => acc + log.completedCount, 0) / recentLogs.length
    : course.plannedUnitsPerDay || 1;

  const daysNeededAtPace = Math.ceil(remainingUnits / Math.max(0.5, avgPace));
  const projectedDate = new Date(today);
  let daysAdded = 0;
  while (daysAdded < daysNeededAtPace) {
    projectedDate.setDate(projectedDate.getDate() + 1);
    if (studyDays.includes(projectedDate.getDay())) {
      daysAdded++;
    }
  }
  const projectedCompletionDate = projectedDate.toISOString().split('T')[0];

  const completionPercentage = course.totalUnits > 0
    ? Math.min(100, Math.round((course.completedUnits / course.totalUnits) * 100))
    : 0;

  return {
    daysElapsed,
    studyDaysElapsed,
    totalStudyDays,
    studyDaysRemaining,
    expectedUnitsToDate,
    variance,
    isTodayStudyDay,
    remainingUnits,
    currentPaceStatus,
    backlogUnits,
    surplusUnits,
    recommendedDailyUnits,
    completionPercentage,
    projectedCompletionDate,
  };
}

/**
 * Records daily progress, marks lessons completed, and computes daily log deficit/surplus.
 */
export function recordDailyCourseProgress(
  course: StudyCourse,
  completedCountToday: number,
  todayStr: string = new Date().toISOString().split('T')[0],
  notes?: string
): StudyCourse {
  const metrics = calculateCourseScheduleMetrics(course, todayStr);
  const targetQuota = metrics.recommendedDailyUnits;

  const newCompletedUnits = Math.min(
    course.totalUnits,
    course.completedUnits + completedCountToday
  );

  // Mark lessons sequentially
  let countToMark = completedCountToday;
  const updatedLessons: StudyCourseLesson[] = (course.lessons || []).map((lesson) => {
    if (!lesson.completed && countToMark > 0) {
      countToMark--;
      return {
        ...lesson,
        completed: true,
        completedAt: new Date().toISOString(),
      };
    }
    return lesson;
  });

  // Calculate day-specific variance
  const dayVariance = completedCountToday - targetQuota;
  const dayDeficit = dayVariance < 0 ? Math.abs(dayVariance) : 0;
  const daySurplus = dayVariance > 0 ? dayVariance : 0;

  const existingLogIndex = (course.dailyLogs || []).findIndex((l) => l.date === todayStr);
  let updatedDailyLogs: StudyDailyProgressLog[] = [...(course.dailyLogs || [])];

  if (existingLogIndex >= 0) {
    const prev = updatedDailyLogs[existingLogIndex];
    const totalCount = prev.completedCount + completedCountToday;
    const netVariance = totalCount - targetQuota;
    updatedDailyLogs[existingLogIndex] = {
      date: todayStr,
      targetQuota,
      completedCount: totalCount,
      accumulatedDeficit: netVariance < 0 ? Math.abs(netVariance) : 0,
      accumulatedSurplus: netVariance > 0 ? netVariance : 0,
      notes: notes || prev.notes,
    };
  } else {
    updatedDailyLogs.push({
      date: todayStr,
      targetQuota,
      completedCount: completedCountToday,
      accumulatedDeficit: dayDeficit,
      accumulatedSurplus: daySurplus,
      notes,
    });
  }

  // Create temporary course object to recalculate updated metrics
  const interimCourse: StudyCourse = {
    ...course,
    completedUnits: newCompletedUnits,
    lessons: updatedLessons,
    dailyLogs: updatedDailyLogs,
    updatedAt: new Date().toISOString(),
  };

  const updatedMetrics = calculateCourseScheduleMetrics(interimCourse, todayStr);

  return {
    ...interimCourse,
    currentPaceStatus: updatedMetrics.currentPaceStatus,
    backlogUnits: updatedMetrics.backlogUnits,
    surplusUnits: updatedMetrics.surplusUnits,
    recommendedDailyUnits: updatedMetrics.recommendedDailyUnits,
    status: newCompletedUnits >= course.totalUnits ? 'completed' : course.status,
  };
}

/**
 * Re-balances a course schedule based on 3 distinct behavioral strategies:
 * 1. 'redistribute': Keeps original deadline, spreads backlog evenly over remaining days.
 * 2. 'extend_deadline': Pushes deadline forward to maintain gentle daily load without anxiety.
 * 3. 'catchup_sprint': Sets a designated catch-up target for tomorrow to clear the backlog.
 */
export function rebalanceCourseSchedule(
  course: StudyCourse,
  strategy: 'redistribute' | 'extend_deadline' | 'catchup_sprint',
  todayStr: string = new Date().toISOString().split('T')[0]
): StudyCourse {
  const metrics = calculateCourseScheduleMetrics(course, todayStr);
  const studyDays = course.studyDaysPerWeek || [0, 1, 2, 3, 4, 6];

  if (strategy === 'redistribute') {
    // Keep end date, update plannedUnitsPerDay to current recommended
    return {
      ...course,
      plannedUnitsPerDay: metrics.recommendedDailyUnits,
      notes: (course.notes ? course.notes + '\n' : '') + `[${todayStr}] تم إعادة توزيع المتراكم بالتساوي بمعدل ${metrics.recommendedDailyUnits} يومياً.`,
      updatedAt: new Date().toISOString(),
    };
  }

  if (strategy === 'extend_deadline') {
    // Extend end date to preserve baseline planned units per day
    const remainingUnits = metrics.remainingUnits;
    const baselineDaily = course.plannedUnitsPerDay || 1;
    const studyDaysNeeded = Math.ceil(remainingUnits / baselineDaily);

    const newEndDate = new Date(todayStr);
    let daysAdded = 0;
    while (daysAdded < studyDaysNeeded) {
      newEndDate.setDate(newEndDate.getDate() + 1);
      if (studyDays.includes(newEndDate.getDay())) {
        daysAdded++;
      }
    }
    const newTargetEndDate = newEndDate.toISOString().split('T')[0];

    return {
      ...course,
      targetEndDate: newTargetEndDate,
      notes: (course.notes ? course.notes + '\n' : '') + `[${todayStr}] تم تمديد الخطة بمرونة حتى ${newTargetEndDate} لحماية صفائك الذهني.`,
      updatedAt: new Date().toISOString(),
    };
  }

  if (strategy === 'catchup_sprint') {
    // Return course with a temporary catch-up note and flagged roadmap
    return {
      ...course,
      notes: (course.notes ? course.notes + '\n' : '') + `[${todayStr}] جلسة استدراك سريعة لإنهاء ${metrics.backlogUnits} من المتراكم.`,
      updatedAt: new Date().toISOString(),
    };
  }

  return course;
}

/**
 * Synchronizes today's required study quota into WorkdayPlanner (db.workday_tasks).
 */
export async function syncCourseQuotaToWorkdayTask(
  course: StudyCourse,
  todayStr: string = new Date().toISOString().split('T')[0]
): Promise<WorkdayTask> {
  const metrics = calculateCourseScheduleMetrics(course, todayStr);
  const unitsToday = metrics.recommendedDailyUnits;
  const unitLabel = getCourseUnitLabel(course.unitType, unitsToday, true);

  const startLessonNum = course.completedUnits + 1;
  const endLessonNum = Math.min(course.totalUnits, course.completedUnits + unitsToday);

  const taskId = `course_task_${course.id}_${todayStr}`;
  const existing = await db.workday_tasks.get(taskId);

  const taskTitle = `📚 [${course.title}] إنجاز ${unitsToday} ${unitLabel} (${startLessonNum} إلى ${endLessonNum})`;
  const estimatedMin = Math.max(15, Math.min(180, unitsToday * 20));

  if (existing) {
    await db.workday_tasks.update(taskId, {
      title: taskTitle,
      estimatedMinutes: estimatedMin,
      reminderTime: course.reminderTime,
      reminderEnabled: course.reminderEnabled,
    });
    return (await db.workday_tasks.get(taskId))!;
  }

  const newTask: WorkdayTask = {
    id: taskId,
    title: taskTitle,
    estimatedMinutes: estimatedMin,
    actualMinutes: 0,
    completed: false,
    priority: 'high',
    date: todayStr,
    reminderTime: course.reminderTime || '17:00',
    reminderEnabled: course.reminderEnabled ?? true,
  };

  await db.workday_tasks.add(newTask);
  return newTask;
}

/**
 * Generates an initial sequential array of course lessons if not provided.
 */
export function generateInitialLessons(
  totalUnits: number,
  unitType: StudyCourse['unitType'],
  courseTitle: string
): StudyCourseLesson[] {
  const lessons: StudyCourseLesson[] = [];
  const typeLabel = unitType === 'video' ? 'فيديو' : unitType === 'chapter' ? 'فصل' : unitType === 'page' ? 'صفحة' : 'درس';

  for (let i = 1; i <= totalUnits; i++) {
    lessons.push({
      id: `lesson_${i}`,
      lessonNumber: i,
      title: `${typeLabel} ${i}: من ${courseTitle}`,
      durationMinutes: unitType === 'video' ? 18 : 25,
      completed: false,
    });
  }
  return lessons;
}

/**
 * Returns localized category label.
 */
export function getCourseCategoryLabel(
  category: StudyCourse['category'],
  isAr: boolean = true
): string {
  const map: Record<StudyCourse['category'], { ar: string; en: string }> = {
    programming: { ar: 'برمجة وتطوير', en: 'Programming' },
    languages: { ar: 'لغات وترجمة', en: 'Languages' },
    sharia: { ar: 'علوم شرعية', en: 'Islamic Studies' },
    business: { ar: 'إدارة وريادة أعمال', en: 'Business' },
    academic: { ar: 'دراسة أكاديمية', en: 'Academic' },
    design: { ar: 'تصميم وواجهات', en: 'Design' },
    reading: { ar: 'قراءة وكتب', en: 'Reading' },
    other: { ar: 'مجال عام', en: 'General' },
  };
  return isAr ? map[category]?.ar || 'عام' : map[category]?.en || 'General';
}

/**
 * Returns localized unit type label.
 */
export function getCourseUnitLabel(
  unitType: StudyCourse['unitType'],
  count: number = 1,
  isAr: boolean = true
): string {
  if (!isAr) {
    if (unitType === 'video') return count === 1 ? 'video' : 'videos';
    if (unitType === 'chapter') return count === 1 ? 'chapter' : 'chapters';
    if (unitType === 'page') return count === 1 ? 'page' : 'pages';
    if (unitType === 'hour') return count === 1 ? 'hour' : 'hours';
    return count === 1 ? 'lesson' : 'lessons';
  }

  if (unitType === 'video') {
    if (count === 1) return 'فيديو';
    if (count === 2) return 'فيديوهان';
    if (count >= 3 && count <= 10) return 'فيديوهات';
    return 'فيديو';
  }
  if (unitType === 'chapter') {
    if (count === 1) return 'فصل';
    if (count === 2) return 'فصلان';
    if (count >= 3 && count <= 10) return 'فصول';
    return 'فصل';
  }
  if (unitType === 'page') {
    if (count === 1) return 'صفحة';
    if (count === 2) return 'صفحتان';
    if (count >= 3 && count <= 10) return 'صفحات';
    return 'صفحة';
  }
  if (unitType === 'hour') {
    if (count === 1) return 'ساعة';
    if (count === 2) return 'ساعتان';
    if (count >= 3 && count <= 10) return 'ساعات';
    return 'ساعة';
  }
  if (count === 1) return 'درس';
  if (count === 2) return 'درسان';
  if (count >= 3 && count <= 10) return 'دروس';
  return 'درس';
}
