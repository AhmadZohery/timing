import React, { useState } from 'react';
import {
  X,
  Bell,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
  Droplets,
  Pill,
  Phone,
  BookOpen,
  Footprints,
  Eye,
  Coffee,
  HeartPulse,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { CustomReminderItem, ReminderRecurrence, ReminderCategory } from '../../types';
import { autonomousNotificationScheduler } from '../../services/autonomousNotificationScheduler';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface QuickReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardToast?: (msg: string) => void;
}

const PRESET_SUGGESTIONS = [
  { title: 'شرب كوب ماء وترطيب الجسم', icon: Droplets, category: 'health' as ReminderCategory, defaultMins: 30 },
  { title: 'أخذ الفيتامينات / الدواء', icon: Pill, category: 'health' as ReminderCategory, defaultMins: 60 },
  { title: 'مكالمة هامة / متابعة سريعة', icon: Phone, category: 'work' as ReminderCategory, defaultMins: 15 },
  { title: 'استراحة مشي وحركة 10 دقائق', icon: Footprints, category: 'fitness' as ReminderCategory, defaultMins: 45 },
  { title: 'إراحة العينين وإطالة العضلات', icon: Eye, category: 'health' as ReminderCategory, defaultMins: 20 },
  { title: 'جلسة قراءة وورد تطويري', icon: BookOpen, category: 'learning' as ReminderCategory, defaultMins: 60 },
  { title: 'استراحة قهوة وصفاء ذهني', icon: Coffee, category: 'custom' as ReminderCategory, defaultMins: 30 },
  { title: 'استراحة تنفس وسكينة', icon: HeartPulse, category: 'spiritual' as ReminderCategory, defaultMins: 15 },
];

export const QuickReminderModal: React.FC<QuickReminderModalProps> = ({
  isOpen,
  onClose,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const reminders = useLiveQuery(() => db.custom_reminders.toArray(), []) || [];

  const [title, setTitle] = useState('');
  const [time, setTime] = useState(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>('once');
  const [category, setCategory] = useState<ReminderCategory>('custom');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Add minutes to current time
  const handleAddMinutes = (mins: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const d = new Date(Date.now() + mins * 60 * 1000);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    setTime(`${h}:${m}`);
  };

  const handleSelectPreset = (preset: typeof PRESET_SUGGESTIONS[0]) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setTitle(preset.title);
    setCategory(preset.category);
    handleAddMinutes(preset.defaultMins);
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time) return;

    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();
    setIsSubmitting(true);

    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const newReminder: CustomReminderItem = {
        id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        time,
        date: todayIso,
        recurrence,
        category,
        enabled: true,
        notes: notes.trim() || undefined,
        createdAt: Date.now(),
      };

      await db.custom_reminders.add(newReminder);
      await autonomousNotificationScheduler.scheduleAllUpcomingAlarms();

      setTitle('');
      setNotes('');
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `تم ضبط المنبه بنجاح في الساعة ${time} 🔔`
            : `Reminder scheduled for ${time} 🔔`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEnabled = async (rem: CustomReminderItem) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    await db.custom_reminders.update(rem.id, { enabled: !rem.enabled });
    await autonomousNotificationScheduler.scheduleAllUpcomingAlarms();
  };

  const handleDeleteReminder = async (id: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateWarning();
    await db.custom_reminders.delete(id);
    await autonomousNotificationScheduler.scheduleAllUpcomingAlarms();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>{isAr ? 'منبهات وتذكيرات اليوم' : 'Daily Alarms & Custom Reminders'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                  {isAr ? 'خلف الشاشة ⚡' : 'Background OS'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'جدولة منبهات ترن في موعدها حتى والشاشة مقفلة والمتصفح مغلق'
                  : 'Fires accurately even when screen is locked & browser closed'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Presets Carousel */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 block">
              {isAr ? 'اقتراحات سريعة بنقرة واحدة:' : 'Quick 1-Tap Presets:'}
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PRESET_SUGGESTIONS.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-950 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-800 text-slate-700 dark:text-zinc-300 text-xs font-medium shrink-0 transition-all cursor-pointer active:scale-95"
                  >
                    <Icon className="w-3.5 h-3.5 text-amber-500" />
                    <span>{preset.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create Reminder Form */}
          <form onSubmit={handleCreateReminder} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                {isAr ? 'عنوان التذكير أو المنبه:' : 'Reminder Title:'}
              </label>
              <input
                type="text"
                required
                placeholder={isAr ? 'مثال: موعد شرب الماء، مكالمة هامة، جلسة قراءة...' : 'e.g., Drink water, Team standup, Reading...'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Time Selector & Quick Increments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'موعد الرنين:' : 'Alarm Time:'}</span>
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Quick +Mins Chips */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold shrink-0">{isAr ? 'تقديم:' : 'Fast add:'}</span>
                {[
                  { label: '+15د', mins: 15 },
                  { label: '+30د', mins: 30 },
                  { label: '+1س', mins: 60 },
                  { label: '+2س', mins: 120 },
                ].map((chip) => (
                  <button
                    key={chip.mins}
                    type="button"
                    onClick={() => handleAddMinutes(chip.mins)}
                    className="px-2 py-1 rounded-md bg-white dark:bg-zinc-900 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 border border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recurrence Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isAr ? 'التكرار:' : 'Recurrence:'}</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'once' as ReminderRecurrence, label: isAr ? 'اليوم فقط' : 'Once today' },
                  { id: 'daily' as ReminderRecurrence, label: isAr ? 'يومياً' : 'Daily' },
                  { id: 'weekdays' as ReminderRecurrence, label: isAr ? 'أيام العمل' : 'Weekdays' },
                ].map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setRecurrence(rec.id);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      recurrence === rec.id
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    {rec.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'تأكيد وضبط التنبيه المستقل' : 'Save & Schedule Alarm'}</span>
            </button>
          </form>

          {/* Existing Reminders List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'منبهاتك وتذكيراتك النشطة' : 'Active Reminders & Alarms'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 font-mono">
                  {reminders.length}
                </span>
              </h4>
            </div>

            {reminders.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-dashed border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 text-xs">
                {isAr
                  ? 'لا توجد منبهات مخصصة مسجلة حالياً.. اختر من الاقتراحات أعلاه أو اضبط موعداً جديداً.'
                  : 'No custom reminders registered yet. Pick a preset above or add one!'}
              </div>
            ) : (
              <div className="space-y-2">
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      rem.enabled
                        ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 shadow-2xs'
                        : 'bg-slate-50/50 dark:bg-zinc-950/50 border-slate-200/50 dark:border-zinc-800/50 text-slate-400 dark:text-zinc-600 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(rem)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 cursor-pointer transition-colors ${
                          rem.enabled
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                        }`}
                      >
                        {rem.time}
                      </button>

                      <div className="min-w-0">
                        <span className={`text-xs font-bold block truncate ${rem.enabled ? '' : 'line-through'}`}>
                          {rem.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="capitalize">
                            {rem.recurrence === 'daily'
                              ? (isAr ? 'يومياً' : 'Daily')
                              : rem.recurrence === 'weekdays'
                              ? (isAr ? 'أيام العمل' : 'Weekdays')
                              : (isAr ? 'اليوم' : 'Today')}
                          </span>
                          {rem.notes && <span>• {rem.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Toggle switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(rem)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          rem.enabled
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                        title={rem.enabled ? 'تفعيل' : 'تعطيل'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteReminder(rem.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
