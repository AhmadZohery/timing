import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Check,
  Gift,
  Smile,
  PackageCheck,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { CustomReminderItem, ReminderCategory } from '../../types';
import {
  APPOINTMENT_CATEGORIES,
  getCategoryMeta,
  detectSmartPrepFromTitle,
  SATISFACTION_PRESETS,
  LEAD_TIME_OPTIONS,
} from '../modals/SmartAppointmentsModal';
import { autonomousNotificationScheduler } from '../../services/autonomousNotificationScheduler';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatLocalDate } from '../../utils/gamification';

interface SmartDailyAppointmentsWidgetProps {
  onOpenFullModal: (initialFilter?: 'all' | 'today' | 'occasions' | 'unrated') => void;
  onRewardToast: (msg: string) => void;
}

export const SmartDailyAppointmentsWidget: React.FC<SmartDailyAppointmentsWidgetProps> = ({
  onOpenFullModal,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const allReminders = useLiveQuery(() => db.custom_reminders.toArray(), []) || [];
  const todayStr = formatLocalDate(new Date());
  const tomorrowStr = formatLocalDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

  // Quick Inline Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<ReminderCategory>('occasion');
  const [quickDate, setQuickDate] = useState<string>(todayStr);
  const [quickTime, setQuickTime] = useState<string>('19:00');

  const detectedSmartPrep = useMemo(() => {
    if (!quickTitle.trim()) return null;
    return detectSmartPrepFromTitle(quickTitle, quickCategory);
  }, [quickTitle, quickCategory]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();

    const smart = detectSmartPrepFromTitle(quickTitle, quickCategory);
    const newItem: CustomReminderItem = {
      id: `appt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: quickTitle.trim(),
      time: quickTime || '19:00',
      date: quickDate || todayStr,
      recurrence: 'once',
      category: smart.suggestedCategory,
      enabled: true,
      prepChecklist: smart.suggestedPrep,
      prepReminderLeadMinutes: smart.suggestedLeadMins,
      prepCompleted: false,
      completedDates: [],
      createdAt: Date.now(),
    };

    await db.custom_reminders.add(newItem);
    await autonomousNotificationScheduler.scheduleAllUpcomingAlarms();

    const leadLabel =
      LEAD_TIME_OPTIONS.find((o) => o.mins === smart.suggestedLeadMins)?.labelAr || 'قبل الموعد';
    onRewardToast(
      `📅 تم تسجيل "${newItem.title}" + تذكير ذكي (${leadLabel}: ${smart.suggestedPrep[0]})`
    );
    setQuickTitle('');
  };

  const handleRateSatisfaction = async (item: CustomReminderItem, score: number) => {
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    const targetDate = item.date || todayStr;
    const prevDates = item.completedDates || [];
    const nextDates = prevDates.includes(targetDate) ? prevDates : [...prevDates, targetDate];

    await db.custom_reminders.update(item.id, {
      satisfactionScore: score,
      ratedAt: Date.now(),
      completedDates: nextDates,
    });
    onRewardToast(`🌟 تم تسجيل نسبة رضاك (${score}%) عن "${item.title}"!`);
  };

  const handleTogglePrep = async (item: CustomReminderItem) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const nextVal = !item.prepCompleted;
    await db.custom_reminders.update(item.id, { prepCompleted: nextVal });
    if (nextVal) {
      onRewardToast(`🎁 تم تجهيز مستلزمات "${item.title}" قبل الموعد!`);
    }
  };

  // Top 4 Upcoming / Today Appointments
  const featuredAppointments = useMemo(() => {
    return [...allReminders]
      .sort((a, b) => {
        const dA = a.date || todayStr;
        const dB = b.date || todayStr;
        if (dA !== dB) return dA.localeCompare(dB);
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      })
      .slice(0, 4);
  }, [allReminders, todayStr]);

  const satisfactionAvg = useMemo(() => {
    const rated = allReminders.filter((r) => typeof r.satisfactionScore === 'number');
    if (rated.length === 0) return null;
    return Math.round(
      rated.reduce((acc, r) => acc + (r.satisfactionScore || 0), 0) / rated.length
    );
  }, [allReminders]);

  return (
    <div className="rounded-[28px] bg-gradient-to-br from-[#faf7f0] via-white to-[#ecfdf5]/70 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/30 border-2 border-amber-300/80 dark:border-amber-500/30 p-4 sm:p-5 shadow-[0_10px_30px_-10px_rgba(6,78,59,0.15)] space-y-3.5">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-lg shrink-0 shadow-xs border border-amber-300">
            📅
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
                {isAr
                  ? 'مفكرة المواعيد والمناسبات وتذكير الهدايا'
                  : 'Daily Appointments, Occasions & Gift Prep'}
              </h2>
              {satisfactionAvg !== null && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 border border-emerald-300">
                  🌟 {isAr ? `الرضا العام: ${satisfactionAvg}%` : `Avg Satisfaction: ${satisfactionAvg}%`}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
              {isAr
                ? 'سجّل مواعيد الشغل، الخروجات، والمناسبات بالتاريخ • يفكرك قبلها بهدية أو حاجات تاخدها معاك + تقييم الرضا بعدها'
                : 'Log work, outings & occasions with smart pre-event gift/item reminders & post-event satisfaction'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            onOpenFullModal('all');
          }}
          className="px-3.5 py-2 rounded-full bg-zinc-900 dark:bg-amber-400 text-amber-300 dark:text-zinc-950 text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95 transition-transform flex items-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isAr ? `كل المواعيد والمناسبات (${allReminders.length})` : `All Appointments (${allReminders.length})`}</span>
        </button>
      </div>

      {/* 1-Tap Quick Add Bar with Live Smart Prep Detection */}
      <form
        onSubmit={handleQuickAdd}
        className="p-3 rounded-2xl bg-white dark:bg-zinc-950/90 border border-amber-300/80 dark:border-zinc-800 space-y-2.5 shadow-2xs"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {APPOINTMENT_CATEGORIES.map((cat) => {
            const active =
              (detectedSmartPrep ? detectedSmartPrep.suggestedCategory : quickCategory) === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setQuickCategory(cat.id);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                    : 'bg-[#faf7f0] dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-amber-300/70 dark:border-zinc-700'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.labelAr}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder={
              isAr
                ? 'اكتب موعد أو مناسبة (مثال: عيد ميلاد محمد، خروجة مع الشباب، اجتماع عمل، دكتور)...'
                : 'Type appointment or occasion...'
            }
            className="sm:col-span-6 h-9 px-3 rounded-xl bg-[#faf7f0] dark:bg-zinc-900 border border-amber-300/80 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-600"
          />
          <input
            type="date"
            value={quickDate}
            onChange={(e) => setQuickDate(e.target.value)}
            aria-label={isAr ? 'تاريخ الموعد' : 'Date'}
            className="sm:col-span-3 h-9 px-2.5 rounded-xl bg-[#faf7f0] dark:bg-zinc-900 border border-amber-300/80 dark:border-zinc-700 text-[11px] font-mono font-bold text-zinc-900 dark:text-white"
          />
          <div className="sm:col-span-3 flex items-center gap-1.5">
            <input
              type="time"
              value={quickTime}
              onChange={(e) => setQuickTime(e.target.value)}
              aria-label={isAr ? 'وقت الموعد' : 'Time'}
              className="flex-1 h-9 px-2 rounded-xl bg-[#faf7f0] dark:bg-zinc-900 border border-amber-300/80 dark:border-zinc-700 text-[11px] font-mono font-bold text-zinc-900 dark:text-white"
            />
            <button
              type="submit"
              className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة' : 'Add'}</span>
            </button>
          </div>
        </div>

        {/* Live Smart Pre-Reminder Preview when typing */}
        {detectedSmartPrep && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 text-[11px] font-bold text-amber-950 dark:text-amber-200 flex items-center justify-between gap-2 flex-wrap animate-in fade-in duration-150">
            <span className="flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>
                {isAr
                  ? `🧠 فهمت تلقائياً! سأذكرك قبل الموعد بـ: (${detectedSmartPrep.suggestedPrep.join(' • ')})`
                  : `Smart Prep: ${detectedSmartPrep.suggestedPrep.join(' • ')}`}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onOpenFullModal('all')}
              className="text-[10px] underline text-emerald-800 dark:text-emerald-300 cursor-pointer"
            >
              {isAr ? 'تخصيص الهدية والوقت ←' : 'Customize →'}
            </button>
          </div>
        )}
      </form>

      {/* Active Appointments & Post-Event Satisfaction Cards */}
      {featuredAppointments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {featuredAppointments.map((item) => {
            const meta = getCategoryMeta(item.category);
            const targetDate = item.date || todayStr;
            const isDone = (item.completedDates || []).includes(targetDate);
            const hasPrep = item.prepChecklist && item.prepChecklist.length > 0;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-[22px] border-2 flex flex-col justify-between gap-2 shadow-2xs ${meta.cardBg}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-white/90 dark:bg-zinc-800 border border-amber-300/70 flex items-center justify-center text-base shrink-0">
                      {isDone ? <Check className="w-4 h-4 text-emerald-600 stroke-[3]" /> : meta.emoji}
                    </span>
                    <div className="min-w-0">
                      <span className="block text-xs sm:text-sm font-bold text-zinc-950 dark:text-white truncate">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mt-0.5 flex-wrap">
                        <span className={`px-1.5 py-0.2 rounded-full border ${meta.badgeBg}`}>
                          {meta.labelAr}
                        </span>
                        <span className="font-mono">
                          📅 {targetDate === todayStr ? (isAr ? 'اليوم' : 'Today') : targetDate === tomorrowStr ? (isAr ? 'غداً' : 'Tomorrow') : targetDate} • ⏰ {item.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {typeof item.satisfactionScore === 'number' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                      {item.satisfactionScore >= 85 ? '😍' : '😊'} {item.satisfactionScore}%
                    </span>
                  )}
                </div>

                {/* Smart Pre-Event Gift / Carry Checklist Pill */}
                {hasPrep && (
                  <button
                    type="button"
                    onClick={() => handleTogglePrep(item)}
                    className={`w-full px-2.5 py-1.5 rounded-xl border text-start text-[10px] font-bold flex items-center justify-between gap-1.5 cursor-pointer transition-colors ${
                      item.prepCompleted
                        ? 'bg-emerald-100/70 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-100/85 dark:bg-amber-950/50 border-amber-400/80 text-amber-950 dark:text-amber-200'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.prepChecklist?.join(' • ')}</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white/90 dark:bg-zinc-900 shrink-0">
                      {item.prepCompleted ? (isAr ? '✓ جاهز' : '✓ Ready') : (isAr ? 'تحضير 🎁' : 'Prep 🎁')}
                    </span>
                  </button>
                )}

                {/* 1-Tap Post-Appointment Satisfaction Rating */}
                {item.satisfactionScore === undefined && (
                  <div className="pt-1 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <Smile className="w-3 h-3 text-emerald-600" />
                      <span>{isAr ? 'نسبة رضاك بعد الموعد:' : 'Rate satisfaction:'}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {SATISFACTION_PRESETS.map((p) => (
                        <button
                          key={p.score}
                          type="button"
                          onClick={() => handleRateSatisfaction(item, p.score)}
                          className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer transition-colors"
                          title={p.labelAr}
                        >
                          {p.emoji} {p.score}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
