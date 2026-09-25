import React from 'react';
import {
  Activity,
  CheckCircle2,
  Circle,
  Flame,
  Calendar,
} from 'lucide-react';
import type { DailyLog, StationId } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

interface HabitConsistencyRadarProps {
  dailyLogs: DailyLog[];
  todayDate: string;
  streakDays: number;
  streakShields: number;
  totalPoints: number;
  onOpenArchiveModal?: () => void;
}

const STATION_KEYS: { id: StationId; labelAr: string; labelEn: string }[] = [
  { id: 'COMMUTE_MORNING', labelAr: 'القرآن', labelEn: 'Quran' },
  { id: 'WORK_MICRO_SPRINT', labelAr: 'التعلم', labelEn: 'Study' },
  { id: 'GYM_ANCHOR', labelAr: 'الجيم', labelEn: 'Gym' },
  { id: 'EVENING_SPRINT', labelAr: 'المسائي', labelEn: 'Sprint' },
  { id: 'RETROSPECTIVE_CHECKIN', labelAr: 'المراجعة', labelEn: 'Checkin' },
  { id: 'GRAND_REWARD_STATE', labelAr: 'الراحة', labelEn: 'Reward' },
];

export const HabitConsistencyRadar: React.FC<HabitConsistencyRadarProps> = ({
  dailyLogs,
  todayDate,
  streakDays,
  streakShields,
  totalPoints,
  onOpenArchiveModal,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  // Build the last 7 days array
  const last7Days: { dateStr: string; dayName: string; isToday: boolean; log?: DailyLog }[] = [];
  const baseDate = new Date(todayDate);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const dayName = d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'short' });
    const log = dailyLogs.find((l) => l.date === dateStr);

    last7Days.push({
      dateStr,
      dayName,
      isToday: i === 0,
      log,
    });
  }

  // Calculate weekly consistency percentage
  const totalSlots = 7 * 6; // 42 possible station checkpoints
  const completedSlots = last7Days.reduce((acc, day) => {
    return acc + (day.log?.completedStations?.length || 0);
  }, 0);
  const weeklyScore = Math.min(100, Math.round((completedSlots / totalSlots) * 100));

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3.5 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              {isAr ? 'مصفوفة الاتساق الأسبوعي (7 أيام)' : '7-Day Consistency Radar'}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              {isAr ? 'تتبع إنجاز المحطات الست يومياً' : 'Visual multi-station habit grid'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenArchiveModal && (
            <button
              onClick={onOpenArchiveModal}
              className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40"
              title={isAr ? 'فتح التقويم والأرشيف' : 'Open Calendar & Archive'}
            >
              <Calendar className="w-3 h-3" />
              <span>{isAr ? 'التقويم' : 'Archive'}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{weeklyScore}%</span>
          </div>
        </div>
      </div>

      {/* 7-Day Matrix Grid */}
      <div className="space-y-2">
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-bold">
          {last7Days.map((day) => (
            <div
              key={day.dateStr}
              className={`py-1 rounded-md ${
                day.isToday
                  ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black'
                  : ''
              }`}
            >
              {day.dayName}
            </div>
          ))}
        </div>

        {/* Stations Rows */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
          {STATION_KEYS.map((st) => (
            <div key={st.id} className="grid grid-cols-7 gap-1.5 items-center">
              {last7Days.map((day) => {
                const isDone = day.log?.completedStations?.includes(st.id);
                return (
                  <div
                    key={`${day.dateStr}-${st.id}`}
                    title={`${day.dateStr}: ${isAr ? st.labelAr : st.labelEn} ${isDone ? '✔' : '—'}`}
                    className={`h-5 rounded-md flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-2xs'
                        : day.isToday
                        ? 'bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-300 dark:text-zinc-600'
                        : 'bg-slate-100/50 dark:bg-zinc-800/30 text-slate-300 dark:text-zinc-700'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                    ) : (
                      <Circle className="w-1.5 h-1.5" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-emerald-500" />
            <span>{isAr ? 'مكتمل' : 'Fulfilled'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-slate-200 dark:bg-zinc-800" />
            <span>{isAr ? 'مستمر / قادم' : 'Pending'}</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-slate-700 dark:text-zinc-300 font-bold">
            <Calendar className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span>{todayDate}</span>
          </div>
        </div>
      </div>

      {/* Streak Protection Stats Banner */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
            {isAr ? 'الشعلة' : 'Streak'}
          </span>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-emerald-500" />
            {streakDays}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
            {isAr ? 'الدروع' : 'Shields'}
          </span>
          <span className="text-sm font-bold text-sky-700 dark:text-sky-400">
            {streakShields} 🛡️
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
            {isAr ? 'النقاط' : 'Points'}
          </span>
          <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
            {totalPoints} ✨
          </span>
        </div>
      </div>
    </div>
  );
};
