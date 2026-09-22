import React, { useState } from 'react';
import {
  X,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { db } from '../../db/db';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import type { CustomHabit, HabitRecurrence } from '../../types';

interface HabitRecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHabitAdded?: (habit: CustomHabit) => void;
}

const PRESET_ISLAMIC_HABITS = [
  { title: 'صلاة الضحى (ركعتان فأكثر) ☀️', category: 'spiritual' as const, recurrence: 'daily' as const, points: 20 },
  { title: 'السنن الرواتب (12 ركعة يومياً) 🕌', category: 'spiritual' as const, recurrence: 'daily' as const, points: 25 },
  { title: 'سورة الكهف (نور بين الجمعتين) 📖', category: 'spiritual' as const, recurrence: 'weekly_specific' as const, specificDays: [5], points: 30 },
  { title: 'صيام الاثنين والخميس تطوعاً 🌙', category: 'spiritual' as const, recurrence: 'weekly_specific' as const, specificDays: [1, 4], points: 35 },
  { title: 'صيام الأيام البيض (13، 14، 15 هجرياً) 🌕', category: 'spiritual' as const, recurrence: 'once' as const, points: 35 },
  { title: 'صدقة وإطعام طعام 🤍', category: 'spiritual' as const, recurrence: 'once' as const, points: 20 },
  { title: 'ورد الاستغفار والتسبيح (100 مرة) 📿', category: 'spiritual' as const, recurrence: 'daily' as const, points: 15 },
  { title: 'الصلاة على النبي ﷺ (100 مرة) 🌿', category: 'spiritual' as const, recurrence: 'daily' as const, points: 15 },
  { title: 'صلة الرحم والاطمئنان على الأهل 📞', category: 'spiritual' as const, recurrence: 'weekly_specific' as const, specificDays: [5], points: 25 },
];

export const HabitRecurrenceModal: React.FC<HabitRecurrenceModalProps> = ({
  isOpen,
  onClose,
  onHabitAdded,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [title, setTitle] = useState('');
  const [recurrence, setRecurrence] = useState<HabitRecurrence>('daily');
  const [specificDays, setSpecificDays] = useState<number[]>([5]); // Friday default
  const [points, setPoints] = useState(20);

  if (!isOpen) return null;

  const daysOfWeek = [
    { num: 6, labelAr: 'السبت', labelEn: 'Sat' },
    { num: 0, labelAr: 'الأحد', labelEn: 'Sun' },
    { num: 1, labelAr: 'الاثنين', labelEn: 'Mon' },
    { num: 2, labelAr: 'الثلاثاء', labelEn: 'Tue' },
    { num: 3, labelAr: 'الأربعاء', labelEn: 'Wed' },
    { num: 4, labelAr: 'الخميس', labelEn: 'Thu' },
    { num: 5, labelAr: 'الجمعة', labelEn: 'Fri' },
  ];

  const handleToggleDay = (d: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSpecificDays((prev) =>
      prev.includes(d) ? prev.filter((item) => item !== d) : [...prev, d]
    );
  };

  const handleSelectPreset = (preset: typeof PRESET_ISLAMIC_HABITS[0]) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setTitle(preset.title);
    setRecurrence(preset.recurrence);
    if (preset.specificDays) {
      setSpecificDays(preset.specificDays);
    }
    setPoints(preset.points);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();

    const todayStr = new Date().toISOString().split('T')[0];
    const newHabit: CustomHabit = {
      id: `habit_${Date.now()}`,
      title: title.trim(),
      category: 'spiritual',
      recurrence,
      specificDays: recurrence === 'weekly_specific' ? specificDays : undefined,
      points,
      completed: false,
      date: todayStr,
    };

    await db.custom_habits.add(newHabit);

    if (onHabitAdded) {
      onHabitAdded(newHabit);
    }

    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-zinc-900 border-t sm:border border-slate-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {isAr ? 'إضافة عبادة أو عادة جديدة' : 'Add New Habit / Deed'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isAr ? 'تحديد نمط التكرار والجدول الزمني الذكي' : 'Specify recurrence & points reward'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Islamic Presets Catalog */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            {isAr ? 'اقتراحات سنن وعبادات جاهزة بنقرة واحدة:' : 'Suggested Islamic Habits (1-Tap):'}
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto no-scrollbar p-1">
            {PRESET_ISLAMIC_HABITS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/60 cursor-pointer select-none"
              >
                + {p.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              {isAr ? 'اسم العبادة أو العادة:' : 'Habit Name:'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isAr ? 'مثال: صلاة الضحى، صيام الاثنين، سورة الكهف...' : 'e.g. Duha prayer, fasting...'}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Core Questionnaire: Recurrence Pattern */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {isAr ? 'هل هذه العادة يومياً أم مرة واحدة أم أيام محددة؟' : 'How often does this habit repeat?'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {/* Option 1: Daily */}
              <button
                type="button"
                onClick={() => setRecurrence('daily')}
                className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                  recurrence === 'daily'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400'
                }`}
              >
                <div className="text-xs font-bold">{isAr ? 'يومياً (كل يوم) 🔄' : 'Daily 🔄'}</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  {isAr ? 'تتكرر في كل الأيام' : 'Repeats every day'}
                </div>
              </button>

              {/* Option 2: Once */}
              <button
                type="button"
                onClick={() => setRecurrence('once')}
                className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                  recurrence === 'once'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400'
                }`}
              >
                <div className="text-xs font-bold">{isAr ? 'مرة واحدة فقط 🎯' : 'Once Today 🎯'}</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  {isAr ? 'لهذا اليوم فقط' : 'Only for today'}
                </div>
              </button>

              {/* Option 3: Weekly Specific */}
              <button
                type="button"
                onClick={() => setRecurrence('weekly_specific')}
                className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                  recurrence === 'weekly_specific'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400'
                }`}
              >
                <div className="text-xs font-bold">{isAr ? 'أيام محددة 🗓️' : 'Specific Days 🗓️'}</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  {isAr ? 'مثل الجمعة أو الاثنين' : 'e.g. Fri or Mon'}
                </div>
              </button>
            </div>

            {/* Days Selection if Specific Days */}
            {recurrence === 'weekly_specific' && (
              <div className="pt-2 space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                  {isAr ? 'اختر الأيام التي تتكرر فيها العادة:' : 'Select days to repeat on:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {daysOfWeek.map((d) => {
                    const isSelected = specificDays.includes(d.num);
                    return (
                      <button
                        key={d.num}
                        type="button"
                        onClick={() => handleToggleDay(d.num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {isAr ? d.labelAr : d.labelEn}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Presets for Days */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSpecificDays([5])}
                    className="text-[10px] text-emerald-700 dark:text-emerald-400 underline cursor-pointer"
                  >
                    {isAr ? 'كل جمعة فقط (سورة الكهف)' : 'Every Friday'}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setSpecificDays([1, 4])}
                    className="text-[10px] text-emerald-700 dark:text-emerald-400 underline cursor-pointer"
                  >
                    {isAr ? 'الاثنين والخميس (صيام التطوع)' : 'Mon & Thu'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Points Reward */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
              <span>{isAr ? 'نقاط المكافأة المكتسبة عند الإنجاز:' : 'Reward points on completion:'}</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold font-mono">+{points} نقطة</span>
            </div>
            <div className="flex gap-2">
              {[15, 20, 25, 30, 35].map((pts) => (
                <button
                  key={pts}
                  type="button"
                  onClick={() => setPoints(pts)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    points === pts
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  +{pts}
                </button>
              ))}
            </div>
          </div>

          {/* Save / Cancel buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs"
            >
              {isAr ? 'حفظ وتثبيت العادة ✨' : 'Save Habit ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
