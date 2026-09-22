import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Flame,
  Clock,
  Dumbbell,
  Mic,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Trophy,
  BarChart3,
  CalendarDays,
} from 'lucide-react';
import type { DailyLog, StationId } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface HistoryArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyLogs: DailyLog[];
  todayDate: string;
}

type TabType = 'calendar' | 'heatmap' | 'analytics';

export const HistoryArchiveModal: React.FC<HistoryArchiveModalProps> = ({
  isOpen,
  onClose,
  dailyLogs,
  todayDate,
}) => {
  const { t, language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  // Calendar Month Navigation State (Year & Month: 0-indexed month)
  const todayObj = useMemo(() => new Date(todayDate), [todayDate]);
  const [currentYear, setCurrentYear] = useState<number>(() => todayObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => todayObj.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);

  // Map daily logs by date for fast O(1) lookup
  const logsMap = useMemo(() => {
    const map = new Map<string, DailyLog>();
    dailyLogs.forEach((log) => {
      map.set(log.date, log);
    });
    return map;
  }, [dailyLogs]);

  // Selected Day's Log
  const selectedLog = useMemo(() => {
    return logsMap.get(selectedDate);
  }, [logsMap, selectedDate]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleTodayJump = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setCurrentYear(todayObj.getFullYear());
    setCurrentMonth(todayObj.getMonth());
    setSelectedDate(todayDate);
  };

  // Calendar Calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 6 = Sat

  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = isAr ? monthNamesAr[currentMonth] : monthNamesEn[currentMonth];

  const weekDayLabels = isAr
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Monthly aggregated analytics
  const monthlyLogs = dailyLogs.filter((l) => {
    const d = new Date(l.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const totalMonthlyFocusMin = monthlyLogs.reduce((acc, l) => acc + (l.totalFocusMinutes || 0), 0);
  const totalMonthlyPoints = monthlyLogs.reduce((acc, l) => acc + (l.pointsEarned || 0), 0);
  const totalMonthlyWorkouts = monthlyLogs.filter((l) => l.workoutLog && l.workoutLog.length > 0).length;
  const activeDaysThisMonth = monthlyLogs.filter((l) => (l.pointsEarned || 0) > 0 || (l.completedStations && l.completedStations.length > 0)).length;

  // Yearly Heatmap (365 days) Data
  const generateYearlyDays = () => {
    const days: Array<{ dateStr: string; points: number; stationsCount: number; focusMin: number }> = [];
    const endDate = new Date(todayDate);
    // 52 weeks = 364 days back
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 364);

    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dStr = cur.toISOString().split('T')[0];
      const log = logsMap.get(dStr);
      days.push({
        dateStr: dStr,
        points: log?.pointsEarned || 0,
        stationsCount: log?.completedStations?.length || 0,
        focusMin: log?.totalFocusMinutes || 0,
      });
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  };

  const yearlyDays = useMemo(() => generateYearlyDays(), [todayDate, logsMap]);

  const getHeatmapColor = (points: number) => {
    if (points === 0) return 'bg-slate-100 dark:bg-zinc-800/80 hover:ring-1 hover:ring-slate-400';
    if (points < 25) return 'bg-emerald-200 dark:bg-emerald-900/60 hover:ring-1 hover:ring-emerald-400';
    if (points < 50) return 'bg-emerald-400 dark:bg-emerald-700 hover:ring-1 hover:ring-emerald-300';
    if (points < 80) return 'bg-emerald-500 dark:bg-emerald-600 hover:ring-1 hover:ring-emerald-200';
    return 'bg-emerald-600 dark:bg-emerald-400 hover:ring-2 hover:ring-amber-400 shadow-xs';
  };

  const stationNameMap: Record<StationId, { ar: string; en: string }> = {
    HOME: { ar: 'الرئيسية (لوحة اليوم)', en: 'Home Dashboard' },
    COMMUTE_MORNING: { ar: 'الانطلاقة الصباحية والقراءة', en: 'Morning Commute & Reading' },
    WORK_MICRO_SPRINT: { ar: 'جلسة العمل والتركيز العميق', en: 'Work & Deep Focus Session' },
    ONE_SEC_FRICTION: { ar: 'صمام التنفس والهدوء', en: '1-Sec Breathing Friction' },
    SOCIAL_MEDIA_BREAK: { ar: 'استراحة الترويح المقيدة', en: 'Controlled Rest Break' },
    GYM_ANCHOR: { ar: 'مرساة النشاط البدني (الجيم)', en: 'Gym & Physical Anchor' },
    EVENING_SPRINT: { ar: 'جلسة الإنجاز المسائي والتواصل', en: 'Evening Sprint & CRM' },
    RETROSPECTIVE_CHECKIN: { ar: 'المراجعة والتقييم المسائي', en: 'Evening Retrospective' },
    GRAND_REWARD_STATE: { ar: 'التتويج ومكافأة اليوم', en: 'Grand Reward & Victory' },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-5xl max-h-[92vh] rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                {t('archive_modal_title')}
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                  {dailyLogs.length} {isAr ? 'يوماً مسجلاً' : 'Days Tracked'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {t('archive_modal_sub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2 bg-slate-50/40 dark:bg-zinc-900/30">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-950 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>{t('calendar_tab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'heatmap'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-950 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>{t('heatmap_tab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-950 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-sky-500" />
            <span>{t('analytics_tab')}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: MONTHLY CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Calendar Grid Column */}
              <div className="lg:col-span-7 space-y-4">
                {/* Month Navigator Toolbar */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer shadow-2xs"
                      title={t('prev_month')}
                    >
                      {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                    <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 min-w-[130px] text-center">
                      {currentMonthName} {currentYear}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer shadow-2xs"
                      title={t('next_month')}
                    >
                      {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={handleTodayJump}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer"
                  >
                    {isAr ? 'اليوم' : 'Today'}
                  </button>
                </div>

                {/* Days of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {weekDayLabels.map((dayLabel, idx) => (
                    <div
                      key={idx}
                      className="py-1.5 text-[11px] font-bold text-slate-500 dark:text-zinc-400"
                    >
                      {dayLabel}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Matrix */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {/* Empty cells before month start */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="h-14 sm:h-18 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-dashed border-slate-200/60 dark:border-zinc-800/40 opacity-40"
                    />
                  ))}

                  {/* Days in Month */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayLog = logsMap.get(dateStr);
                    const isSelected = selectedDate === dateStr;
                    const isToday = todayDate === dateStr;
                    const points = dayLog?.pointsEarned || 0;
                    const stationsCount = dayLog?.completedStations?.length || 0;
                    const focusMin = dayLog?.totalFocusMinutes || 0;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          setSelectedDate(dateStr);
                        }}
                        className={`h-14 sm:h-18 p-1.5 sm:p-2 rounded-xl text-start flex flex-col justify-between border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'ring-2 ring-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-sm'
                            : isToday
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-600/60'
                            : dayLog
                            ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-zinc-700'
                            : 'bg-slate-50/60 dark:bg-zinc-900/40 border-slate-200/70 dark:border-zinc-850 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-mono font-bold ${
                              isSelected
                                ? 'text-emerald-700 dark:text-emerald-300 font-black'
                                : isToday
                                ? 'text-amber-700 dark:text-amber-400 font-black'
                                : 'text-slate-800 dark:text-zinc-200'
                            }`}
                          >
                            {dayNum}
                          </span>

                          {isToday && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          )}
                        </div>

                        {/* Day Badges */}
                        <div className="w-full space-y-0.5">
                          {points > 0 ? (
                            <div className="flex items-center justify-between text-[10px] font-mono leading-none">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                +{points}
                              </span>
                              {focusMin > 0 && (
                                <span className="text-slate-500 dark:text-zinc-400 text-[9px]">
                                  {focusMin}m
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="h-2" />
                          )}

                          {stationsCount > 0 && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: Math.min(stationsCount, 5) }).map((_, dotIdx) => (
                                <span
                                  key={dotIdx}
                                  className="w-1 h-1 rounded-full bg-emerald-500"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Monthly Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">
                      {t('monthly_hours_worked')}
                    </span>
                    <span className="text-sm font-bold font-mono text-sky-600 dark:text-cyan-400">
                      {(totalMonthlyFocusMin / 60).toFixed(1)} {isAr ? 'ساعة' : 'hrs'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">
                      {t('monthly_days_active')}
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {activeDaysThisMonth} / {daysInMonth}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">
                      {t('monthly_workout_sessions')}
                    </span>
                    <span className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                      {totalMonthlyWorkouts} {isAr ? 'جلسات' : 'sessions'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">
                      {isAr ? 'نقاط الشهر المحصلة' : 'Monthly Points'}
                    </span>
                    <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                      {totalMonthlyPoints}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Day Inspector Column */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {t('selected_day_details')} <span className="font-mono text-emerald-600 dark:text-emerald-400">{selectedDate}</span>
                    </h4>
                  </div>
                  {selectedDate === todayDate && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50">
                      {isAr ? 'اليوم النشط' : 'Today'}
                    </span>
                  )}
                </div>

                {selectedLog ? (
                  <div className="space-y-4">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">{isAr ? 'النقاط' : 'Points'}</span>
                        <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                          +{selectedLog.pointsEarned}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">{isAr ? 'دقائق التركيز' : 'Focus Time'}</span>
                        <span className="text-base font-black font-mono text-sky-600 dark:text-cyan-400">
                          {selectedLog.totalFocusMinutes || 0}m
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">{isAr ? 'المحطات' : 'Stations'}</span>
                        <span className="text-base font-black font-mono text-purple-600 dark:text-purple-400">
                          {selectedLog.completedStations.length}/6
                        </span>
                      </div>
                    </div>

                    {/* Stations Completed List */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block">
                        {isAr ? 'المحطات المنجزة في هذا اليوم:' : 'Stations Completed:'}
                      </span>
                      {selectedLog.completedStations.length > 0 ? (
                        <div className="space-y-1">
                          {selectedLog.completedStations.map((stId) => (
                            <div
                              key={stId}
                              className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="font-medium text-slate-800 dark:text-zinc-200">
                                {stationNameMap[stId]?.[language as 'ar' | 'en'] || stId}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 italic">
                          {isAr ? 'لم تسجل محطات مكتملة' : 'No stations completed'}
                        </p>
                      )}
                    </div>

                    {/* Workday Tasks */}
                    {selectedLog.workdayTasks && selectedLog.workdayTasks.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-zinc-800">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block">
                          {isAr ? 'مهام العمل المسجلة:' : 'Workday Tasks:'}
                        </span>
                        <div className="space-y-1">
                          {selectedLog.workdayTasks.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 text-xs"
                            >
                              <span className={`font-medium ${t.completed ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-800 dark:text-zinc-200'}`}>
                                {t.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                                {t.estimatedMinutes}m
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Golden Nugget / Wins */}
                    {(selectedLog.goldenNugget || (selectedLog.wins && selectedLog.wins.length > 0)) && (
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                        {selectedLog.goldenNugget && (
                          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs space-y-1">
                            <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              {isAr ? 'فكرة اليوم الذهبية:' : 'Golden Nugget:'}
                            </span>
                            <p className="text-slate-800 dark:text-zinc-200 italic">
                              "{selectedLog.goldenNugget}"
                            </p>
                          </div>
                        )}

                        {selectedLog.wins && selectedLog.wins.some((w) => w.trim().length > 0) && (
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-1">
                            <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                              <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                              {isAr ? 'انتصارات اليوم الصغيرة:' : 'Daily Wins:'}
                            </span>
                            <ul className="list-disc list-inside text-slate-700 dark:text-zinc-300 space-y-0.5">
                              {selectedLog.wins.filter((w) => w.trim().length > 0).map((win, idx) => (
                                <li key={idx}>{win}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Voice Notes Audio Transcript */}
                    {selectedLog.voiceNotes && (
                      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs space-y-1">
                        <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-purple-600" />
                          {isAr ? 'تسجيل المراجعة الصوتية:' : 'Voice Reflection Transcript:'}
                        </span>
                        <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
                          {selectedLog.voiceNotes}
                        </p>
                      </div>
                    )}

                    {/* Workout Details */}
                    {selectedLog.workoutRoutine && (
                      <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-cyan-950/30 border border-sky-200 dark:border-cyan-800/40 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                          <span className="font-bold text-sky-900 dark:text-cyan-200">
                            {selectedLog.workoutRoutine}
                          </span>
                        </div>
                        {selectedLog.endorphinRating && (
                          <span className="font-mono font-bold text-sky-700 dark:text-cyan-300">
                            ⚡ {selectedLog.endorphinRating}/10
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-2">
                    <CalendarDays className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {t('no_data_for_day')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: YEARLY CONSISTENCY HEATMAP (365 DAYS) */}
          {activeTab === 'heatmap' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    {isAr ? 'مصفوفة الاتساق السنوية (365 يوماً - 52 أسبوعاً)' : 'Yearly Consistency Matrix (365 Days)'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    {isAr ? 'كل مربع يمثل يوماً. انقر على أي مربع لاستعراض أنشطة ذلك اليوم.' : 'Each block represents a day. Click any day to view its logs.'}
                  </p>
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                  <span>{isAr ? 'أقل' : 'Less'}</span>
                  <span className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700" />
                  <span className="w-3 h-3 rounded-xs bg-emerald-200 dark:bg-emerald-900/60" />
                  <span className="w-3 h-3 rounded-xs bg-emerald-400 dark:bg-emerald-700" />
                  <span className="w-3 h-3 rounded-xs bg-emerald-500 dark:bg-emerald-600" />
                  <span className="w-3 h-3 rounded-xs bg-emerald-600 dark:bg-emerald-400" />
                  <span>{isAr ? 'أكثر' : 'More'}</span>
                </div>
              </div>

              {/* Heatmap Grid Container */}
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 overflow-x-auto shadow-inner">
                <div className="min-w-[760px] space-y-2">
                  <div className="grid grid-flow-col grid-rows-7 gap-1.5 auto-cols-max">
                    {yearlyDays.map((d) => (
                      <button
                        key={d.dateStr}
                        onClick={() => {
                          setSelectedDate(d.dateStr);
                          setActiveTab('calendar');
                          const dObj = new Date(d.dateStr);
                          setCurrentYear(dObj.getFullYear());
                          setCurrentMonth(dObj.getMonth());
                        }}
                        title={`${d.dateStr}: ${d.points} ${isAr ? 'نقطة' : 'pts'} • ${d.stationsCount} ${isAr ? 'محطات' : 'stations'}`}
                        className={`w-3.5 h-3.5 rounded-xs transition-transform hover:scale-135 cursor-pointer ${getHeatmapColor(d.points)}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 pt-2 font-mono">
                    <span>{yearlyDays[0]?.dateStr}</span>
                    <span>{yearlyDays[Math.floor(yearlyDays.length / 2)]?.dateStr}</span>
                    <span>{yearlyDays[yearlyDays.length - 1]?.dateStr}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AGGREGATE ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50/50 dark:from-sky-950/30 dark:to-indigo-950/20 border border-sky-200 dark:border-sky-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-800 dark:text-sky-300">
                      {isAr ? 'إجمالي ساعات التركيز الكلية' : 'Total Focus Hours'}
                    </span>
                    <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <span className="text-2xl font-black font-mono text-sky-900 dark:text-sky-200">
                    {(dailyLogs.reduce((acc, l) => acc + (l.totalFocusMinutes || 0), 0) / 60).toFixed(1)}
                  </span>
                  <span className="text-[11px] text-sky-700 dark:text-sky-400 block font-semibold">
                    {isAr ? 'ساعة عمل وعمق محسوبة بدقة' : 'Hours of deep work logged'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      {isAr ? 'أيام الالتزام والنشاط' : 'Active Tracked Days'}
                    </span>
                    <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-200">
                    {dailyLogs.length}
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-semibold">
                    {isAr ? 'يوماً مسجلاً في قاعدة البيانات' : 'Days stored in offline db'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                      {isAr ? 'جلسات الرياضة المكتملة' : 'Gym Workouts Done'}
                    </span>
                    <Dumbbell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-2xl font-black font-mono text-purple-900 dark:text-purple-200">
                    {dailyLogs.filter((l) => l.workoutLog && l.workoutLog.length > 0).length}
                  </span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-400 block font-semibold">
                    {isAr ? 'جلسة تمرين بنجاح' : 'Successful workout anchors'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      {isAr ? 'إجمالي النقاط والمكافآت' : 'Lifetime Points Earned'}
                    </span>
                    <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-2xl font-black font-mono text-amber-900 dark:text-amber-200">
                    {dailyLogs.reduce((acc, l) => acc + (l.pointsEarned || 0), 0)}
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 block font-semibold">
                    {isAr ? 'نقطة محصلة عبر كل المحطات' : 'Points earned through stations'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/60">
          <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'البيانات محفوظة بالكامل في جهازك بدون أي اشتراكات أو خوادم خارجية' : 'All history is preserved locally on device (Zero-Cloud / 100% Free)'}</span>
          </div>

          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
          >
            {t('close_archive')}
          </button>
        </div>
      </div>
    </div>
  );
};
