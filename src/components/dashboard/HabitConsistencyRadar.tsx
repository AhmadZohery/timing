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
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

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

  const handleInteractiveTap = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (onOpenArchiveModal) {
      onOpenArchiveModal();
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-[26px] surface-card-3d border border-slate-200/90 dark:border-white/10 space-y-4 transition-all">
      {/* Header with Obsidian (#141517) Accent */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-[#141517] dark:bg-[#bce8c2] text-[#bce8c2] dark:text-[#141517] shadow-2xs shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-[#141517] dark:text-white tracking-tight">
              {isAr ? 'مصفوفة الاتساق الأسبوعي (7 أيام)' : '7-Day Consistency Matrix'}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
              {isAr ? 'تتبع إنجاز المحطات الست يومياً' : 'Visual multi-station habit grid'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenArchiveModal && (
            <button
              type="button"
              onClick={handleInteractiveTap}
              className="flex items-center gap-1 text-[10px] font-black text-[#141517] bg-[#e2defc] hover:bg-[#d4f5dc] px-2.5 py-1 rounded-full border border-[#5448e8]/20 transition-all active:scale-95 cursor-pointer shadow-2xs"
              title={isAr ? 'فتح التقويم والأرشيف' : 'Open Calendar & Archive'}
            >
              <Calendar className="w-3 h-3" />
              <span>{isAr ? 'التقويم' : 'Archive'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleInteractiveTap}
            className="flex items-center gap-1 font-mono text-xs font-black px-2.5 py-1 rounded-full bg-[#bce8c2] text-[#141517] border border-[#1eb814]/30 active:scale-95 transition-transform cursor-pointer shadow-2xs"
            title={isAr ? 'نسبة الاتساق الأسبوعي' : 'Weekly Consistency Score'}
          >
            <Activity className="w-3.5 h-3.5 text-[#1eb814]" />
            <span>{weeklyScore}%</span>
          </button>
        </div>
      </div>

      {/* 7-Day Matrix Grid */}
      <div className="space-y-2">
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono font-bold">
          {last7Days.map((day) => (
            <button
              key={day.dateStr}
              type="button"
              onClick={handleInteractiveTap}
              className={`py-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                day.isToday
                  ? 'bg-[#141517] text-[#bce8c2] dark:bg-[#bce8c2] dark:text-[#141517] font-black shadow-2xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
              title={day.dateStr}
            >
              {day.dayName}
            </button>
          ))}
        </div>

        {/* Stations Rows */}
        <div className="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-white/10">
          {STATION_KEYS.map((st) => (
            <div key={st.id} className="grid grid-cols-7 gap-1.5 items-center">
              {last7Days.map((day) => {
                const isDone = day.log?.completedStations?.includes(st.id);
                return (
                  <button
                    key={`${day.dateStr}-${st.id}`}
                    type="button"
                    onClick={handleInteractiveTap}
                    title={`${day.dateStr}: ${isAr ? st.labelAr : st.labelEn} ${isDone ? '✔' : '—'}`}
                    className={`h-6 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                      isDone
                        ? 'bg-[#bce8c2] text-[#141517] border border-[#1eb814]/40 shadow-2xs hover:bg-[#d4f5dc]'
                        : day.isToday
                        ? 'bg-[#d4f5dc]/35 dark:bg-white/10 border border-[#bce8c2] dark:border-white/15 text-slate-400 dark:text-zinc-400 hover:border-[#1eb814]'
                        : 'bg-slate-100/70 dark:bg-white/[0.04] text-slate-300 dark:text-zinc-600 hover:bg-slate-200/70 dark:hover:bg-white/10'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1eb814] stroke-[2.75]" />
                    ) : (
                      <Circle className="w-1.5 h-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-md bg-[#bce8c2] border border-[#1eb814]/50" />
            <span>{isAr ? 'مكتمل' : 'Fulfilled'}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-md bg-slate-200 dark:bg-white/10" />
            <span>{isAr ? 'مستمر / قادم' : 'Pending'}</span>
          </div>
          <button
            type="button"
            onClick={handleInteractiveTap}
            className="flex items-center gap-1 font-mono text-[#141517] dark:text-[#bce8c2] font-bold hover:underline cursor-pointer"
          >
            <Calendar className="w-3 h-3 text-[#1eb814]" />
            <span>{todayDate}</span>
          </button>
        </div>
      </div>

      {/* Streak Protection Stats Banner (100% Interactive Pastel Bento Pills) */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
        <button
          type="button"
          onClick={handleInteractiveTap}
          className="p-2.5 rounded-2xl bg-[#fde6d8] text-[#141517] border border-[#ff5500]/20 hover:brightness-98 active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <span className="text-[10px] text-[#141517]/70 font-sans font-bold block">
            {isAr ? 'الشعلة' : 'Streak'}
          </span>
          <span className="text-sm font-black text-[#141517] flex items-center justify-center gap-1 mt-0.5">
            <Flame className="w-3.5 h-3.5 text-[#ff5500] fill-[#ff5500]" />
            {streakDays}
          </span>
        </button>

        <button
          type="button"
          onClick={handleInteractiveTap}
          className="p-2.5 rounded-2xl bg-[#e2defc] text-[#141517] border border-[#5448e8]/20 hover:brightness-98 active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <span className="text-[10px] text-[#141517]/70 font-sans font-bold block">
            {isAr ? 'الدروع' : 'Shields'}
          </span>
          <span className="text-sm font-black text-[#141517] block mt-0.5">
            {streakShields} 🛡️
          </span>
        </button>

        <button
          type="button"
          onClick={handleInteractiveTap}
          className="p-2.5 rounded-2xl bg-[#d4f5dc] text-[#141517] border border-[#1eb814]/25 hover:brightness-98 active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <span className="text-[10px] text-[#141517]/70 font-sans font-bold block">
            {isAr ? 'النقاط' : 'Points'}
          </span>
          <span className="text-sm font-black text-[#141517] block mt-0.5">
            {totalPoints} ✨
          </span>
        </button>
      </div>
    </div>
  );
};

