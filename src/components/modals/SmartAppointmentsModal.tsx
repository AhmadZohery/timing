import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Gift,
  Bell,
  Smile,
  MapPin,
  PackageCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { CustomReminderItem, ReminderCategory, ReminderRecurrence } from '../../types';
import { autonomousNotificationScheduler } from '../../services/autonomousNotificationScheduler';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatLocalDate } from '../../utils/gamification';

interface SmartAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardToast?: (msg: string) => void;
  initialFilter?: 'all' | 'today' | 'occasions' | 'unrated';
}

export interface AppointmentCategoryMeta {
  id: ReminderCategory;
  labelAr: string;
  labelEn: string;
  emoji: string;
  cardBg: string;
  badgeBg: string;
  defaultLeadMins: number;
  smartPrepSuggestions: string[];
}

export const APPOINTMENT_CATEGORIES: AppointmentCategoryMeta[] = [
  {
    id: 'occasion',
    labelAr: 'مناسبات وهدايا',
    labelEn: 'Occasions & Gifts',
    emoji: '🎉',
    cardBg: 'bg-gradient-to-br from-rose-50/95 via-white to-amber-50/80 dark:from-rose-950/45 dark:via-zinc-900 dark:to-amber-950/35 border-rose-300/85 dark:border-rose-500/30',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/50 text-rose-950 dark:text-rose-200 border-rose-300/70',
    defaultLeadMins: 1440, // 24 hours before
    smartPrepSuggestions: [
      '🎁 هات هدية مناسبة أو بوكيه ورد',
      '🍰 خد معاك حلويات أو شوكولاتة للزيارة',
      '👔 تجهيز الملابس والمظهر قبل الموعد بوقت كافٍ',
      '🤲 استحضار نية صلة الرحم وإدخال السرور',
    ],
  },
  {
    id: 'outing',
    labelAr: 'خروجات وفسح',
    labelEn: 'Outings & Friends',
    emoji: '☕',
    cardBg: 'bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/80 dark:from-emerald-950/45 dark:via-zinc-900 dark:to-teal-950/35 border-emerald-300/85 dark:border-emerald-500/30',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-950 dark:text-emerald-200 border-emerald-300/70',
    defaultLeadMins: 60, // 1 hour before
    smartPrepSuggestions: [
      '🔋 خد معاك الباور بانك والشاحن',
      '🪪 خد معاك المحفظة والبطاقة والمفاتيح',
      '🚗 اتحرك بدري 30 دقيقة لتفادي الزحمة',
      '💧 خد معاك زجاجة مياه أو مستلزماتك الشخصية',
    ],
  },
  {
    id: 'work',
    labelAr: 'مواعيد شغل واجتماعات',
    labelEn: 'Work & Meetings',
    emoji: '💼',
    cardBg: 'bg-gradient-to-br from-indigo-50/95 via-white to-sky-50/80 dark:from-indigo-950/45 dark:via-zinc-900 dark:to-sky-950/35 border-indigo-300/85 dark:border-indigo-500/30',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-950 dark:text-indigo-200 border-indigo-300/70',
    defaultLeadMins: 30, // 30 mins before
    smartPrepSuggestions: [
      '💻 خد معاك اللابتوب والشاحن والنوتة',
      '📋 راجع نقاط الاجتماع والملفات المطلوبة',
      '☕ جهز مكان هادئ واختبر الصوت قبل الميتنج',
      '📇 خد معاك الكروت الشخصية أو العينات',
    ],
  },
  {
    id: 'errand',
    labelAr: 'مشاوير ومواعيد طبية',
    labelEn: 'Medical & Errands',
    emoji: '🏥',
    cardBg: 'bg-gradient-to-br from-amber-50/95 via-white to-orange-50/80 dark:from-amber-950/45 dark:via-zinc-900 dark:to-orange-950/35 border-amber-300/85 dark:border-amber-500/30',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-950 dark:text-amber-200 border-amber-300/70',
    defaultLeadMins: 120, // 2 hours before
    smartPrepSuggestions: [
      '📄 خد معاك الأوراق الرسمية والبطاقة الشخصية',
      '🩺 خد معاك الروشتات والتحاليل والأشعة السابقة',
      '💵 تأكد من وجود كاش كافٍ أو الفيزا للمشوار',
      '📍 راجع اللوكيشن ومواعيد العمل قبل التحرك',
    ],
  },
  {
    id: 'family',
    labelAr: 'التزامات عائلية ومنزلية',
    labelEn: 'Family & Home',
    emoji: '👨‍👩‍👧‍👦',
    cardBg: 'bg-gradient-to-br from-purple-50/95 via-white to-pink-50/80 dark:from-purple-950/45 dark:via-zinc-900 dark:to-pink-950/35 border-purple-300/85 dark:border-purple-500/30',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-950 dark:text-purple-200 border-purple-300/70',
    defaultLeadMins: 180, // 3 hours before
    smartPrepSuggestions: [
      '🛍️ هات طلبات البيت أو فاكهة في طريقك',
      '🎁 هات حاجة تفرح الأولاد أو أهل البيت',
      '📞 اتصل للاطمئنان والتأكيد قبل الموعد',
    ],
  },
];

export const QUICK_TEMPLATES = [
  {
    title: '🎂 عيد ميلاد / مناسبة خاصة',
    category: 'occasion' as ReminderCategory,
    leadMins: 1440,
    prep: ['🎁 هات هدية مناسبة أو بوكيه ورد', '🍰 خد معاك تورتة أو حلويات'],
    recurrence: 'yearly' as ReminderRecurrence,
  },
  {
    title: '🏡 عزومة / زيارة عائلية',
    category: 'occasion' as ReminderCategory,
    leadMins: 180,
    prep: ['🍰 خد معاك حلويات أو فاكهة في إيدك', '👔 تجهيز الملابس قبل الموعد'],
    recurrence: 'once' as ReminderRecurrence,
  },
  {
    title: '☕ خروجة مع الأصحاب',
    category: 'outing' as ReminderCategory,
    leadMins: 60,
    prep: ['🔋 خد معاك الباور بانك والمحفظة والمفاتيح', '🚗 اتحرك بدري 30 دقيقة'],
    recurrence: 'once' as ReminderRecurrence,
  },
  {
    title: '💼 اجتماع عمل / مقابلة مهمة',
    category: 'work' as ReminderCategory,
    leadMins: 30,
    prep: ['💻 خد معاك اللابتوب والشاحن والنوتة', '📋 راجع النقاط والملفات المطلوبة'],
    recurrence: 'once' as ReminderRecurrence,
  },
  {
    title: '🏥 موعد دكتور / مشوار مهم',
    category: 'errand' as ReminderCategory,
    leadMins: 120,
    prep: ['📄 خد معاك البطاقة والروشتات والتحاليل السابقة', '💵 تحضير الكاش المطلوب'],
    recurrence: 'once' as ReminderRecurrence,
  },
];

export const LEAD_TIME_OPTIONS = [
  { mins: 30, labelAr: 'قبلها بـ 30 دقيقة' },
  { mins: 60, labelAr: 'قبلها بساعة' },
  { mins: 180, labelAr: 'قبلها بـ 3 ساعات' },
  { mins: 1440, labelAr: 'قبلها بيوم كامل (24 ساعة)' },
  { mins: 2880, labelAr: 'قبلها بيومين (لشراء هدية)' },
];

export const SATISFACTION_PRESETS = [
  { score: 100, emoji: '😍', labelAr: 'ممتاز ومبهج (100%)', color: 'bg-emerald-600 text-white border-emerald-700' },
  { score: 85, emoji: '😊', labelAr: 'راضٍ جداً (85%)', color: 'bg-teal-600 text-white border-teal-700' },
  { score: 65, emoji: '🙂', labelAr: 'مقبول (65%)', color: 'bg-amber-500 text-white border-amber-600' },
  { score: 35, emoji: '😕', labelAr: 'مرهق / غير مرضٍ (35%)', color: 'bg-rose-600 text-white border-rose-700' },
];

export function getCategoryMeta(cat: ReminderCategory): AppointmentCategoryMeta {
  return (
    APPOINTMENT_CATEGORIES.find((c) => c.id === cat) ||
    APPOINTMENT_CATEGORIES[1]
  );
}

/**
 * Automatically detects smart pre-appointment prep items (like buying a gift or taking items)
 * based on Arabic keywords in the title.
 */
export function detectSmartPrepFromTitle(title: string, category: ReminderCategory): {
  suggestedCategory: ReminderCategory;
  suggestedPrep: string[];
  suggestedLeadMins: number;
} {
  const t = title.trim();
  if (/عيد ميلاد|فرح|خطوب|زفاف|هدي[ةه]|مناسب|ذكرى|تخرج|سبوع|عقيق/i.test(t)) {
    return {
      suggestedCategory: 'occasion',
      suggestedPrep: ['🎁 هات هدية مناسبة أو بوكيه ورد', '👔 تجهيز الملابس قبل الموعد بوقت كافٍ'],
      suggestedLeadMins: 1440,
    };
  }
  if (/عزوم|زيار|عائلي|خالت|عمت|أهل|والد|إفطار|عشاء عائلي/i.test(t)) {
    return {
      suggestedCategory: 'occasion',
      suggestedPrep: ['🍰 خد معاك حلويات أو فاكهة في الزيارة', '🤲 استحضار نية صلة الرحم'],
      suggestedLeadMins: 180,
    };
  }
  if (/خروج|فسح|قهو|كافيه|ماتش|سفر|رحل|تمشي|غداء|عشاء|أصحاب|شباب/i.test(t)) {
    return {
      suggestedCategory: 'outing',
      suggestedPrep: ['🔋 خد معاك الباور بانك والمحفظة والمفاتيح', '🚗 اتحرك بدري 30 دقيقة لتجنب الزحمة'],
      suggestedLeadMins: 60,
    };
  }
  if (/اجتماع|ميتنج|شغل|عمل|انترفيو|مقابل|عميل|مشروع|تسليم|كورس/i.test(t)) {
    return {
      suggestedCategory: 'work',
      suggestedPrep: ['💻 خد معاك اللابتوب والشاحن والنوتة', '📋 راجع نقاط الاجتماع والملفات قبل البدء'],
      suggestedLeadMins: 30,
    };
  }
  if (/دكتور|طبيب|مستشف|عياد|أسنان|تحاليل|بنك|شهر عقاري|مرور|صيان|مشوار/i.test(t)) {
    return {
      suggestedCategory: 'errand',
      suggestedPrep: ['📄 خد معاك الأوراق المطلوبة والبطاقة والروشتات السابقة', '💵 تأكد من وجود كاش كافٍ'],
      suggestedLeadMins: 120,
    };
  }

  const meta = getCategoryMeta(category);
  return {
    suggestedCategory: category,
    suggestedPrep: meta.smartPrepSuggestions.slice(0, 2),
    suggestedLeadMins: meta.defaultLeadMins,
  };
}

export const SmartAppointmentsModal: React.FC<SmartAppointmentsModalProps> = ({
  isOpen,
  onClose,
  onRewardToast,
  initialFilter = 'all',
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const allReminders = useLiveQuery(() => db.custom_reminders.toArray(), []) || [];
  const todayStr = formatLocalDate(new Date());
  const tomorrowStr = formatLocalDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'occasions' | 'unrated'>(initialFilter);
  const [isCreating, setIsCreating] = useState(true);

  // New Appointment Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('occasion');
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>('19:00');
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>('once');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [prepChecklist, setPrepChecklist] = useState<string[]>([
    '🎁 هات هدية مناسبة أو بوكيه ورد',
  ]);
  const [customPrepInput, setCustomPrepInput] = useState('');
  const [prepLeadMins, setPrepLeadMins] = useState<number>(1440);

  // Active rating modal state for a specific item
  const [ratingItemId, setRatingItemId] = useState<string | null>(null);
  const [tempScore, setTempScore] = useState<number>(90);
  const [tempSatisfactionNote, setTempSatisfactionNote] = useState<string>('');

  const currentCatMeta = useMemo(() => getCategoryMeta(category), [category]);

  // Handle smart title change with automatic gift/prep detection
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (val.trim().length >= 3) {
      const detected = detectSmartPrepFromTitle(val, category);
      if (detected.suggestedCategory !== category) {
        setCategory(detected.suggestedCategory);
      }
      if (prepChecklist.length <= 2) {
        setPrepChecklist(detected.suggestedPrep);
        setPrepLeadMins(detected.suggestedLeadMins);
      }
    }
  };

  const handleSelectCategory = (catId: ReminderCategory) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setCategory(catId);
    const meta = getCategoryMeta(catId);
    setPrepLeadMins(meta.defaultLeadMins);
    setPrepChecklist(meta.smartPrepSuggestions.slice(0, 2));
  };

  const handleApplyQuickTemplate = (tpl: (typeof QUICK_TEMPLATES)[number]) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setTitle(tpl.title);
    setCategory(tpl.category);
    setPrepLeadMins(tpl.leadMins);
    setPrepChecklist([...tpl.prep]);
    setRecurrence(tpl.recurrence);
  };

  const togglePrepItem = (item: string) => {
    soundSynth.playTactileClick();
    setPrepChecklist((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleAddCustomPrep = () => {
    const trimmed = customPrepInput.trim();
    if (!trimmed) return;
    soundSynth.playTactileClick();
    const formatted = /^[🎁🎒🍰👔📄💻🔋🚗]/.test(trimmed) ? trimmed : `🎒 ${trimmed}`;
    if (!prepChecklist.includes(formatted)) {
      setPrepChecklist((prev) => [...prev, formatted]);
    }
    setCustomPrepInput('');
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();

    const newItem: CustomReminderItem = {
      id: `appt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      time: time || '18:00',
      date: date || todayStr,
      recurrence,
      category,
      enabled: true,
      notes: notes.trim() || undefined,
      location: location.trim() || undefined,
      prepChecklist: prepChecklist.length > 0 ? prepChecklist : undefined,
      prepReminderLeadMinutes: prepChecklist.length > 0 ? prepLeadMins : undefined,
      prepCompleted: false,
      completedDates: [],
      createdAt: Date.now(),
    };

    await db.custom_reminders.add(newItem);
    await autonomousNotificationScheduler.scheduleAllUpcomingAlarms();

    try {
      confetti({
        particleCount: 30,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#ec4899', '#6366f1'],
        disableForReducedMotion: true,
      });
    } catch {}

    const leadLabel =
      LEAD_TIME_OPTIONS.find((o) => o.mins === prepLeadMins)?.labelAr || 'قبل الموعد';
    onRewardToast?.(
      prepChecklist.length > 0
        ? `📅 تم حفظ "${newItem.title}" + تذكير تحضير (${leadLabel}: ${prepChecklist[0]})`
        : `📅 تم حفظ الموعد "${newItem.title}" وتفعيل التنبيه بنجاح!`
    );

    setTitle('');
    setNotes('');
    setLocation('');
  };

  const handleToggleCompletedToday = async (item: CustomReminderItem) => {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();
    const targetDate = item.date || todayStr;
    const prevDates = item.completedDates || [];
    const isAlreadyDone = prevDates.includes(targetDate);
    const nextDates = isAlreadyDone
      ? prevDates.filter((d) => d !== targetDate)
      : [...prevDates, targetDate];

    await db.custom_reminders.update(item.id, {
      completedDates: nextDates,
    });

    if (!isAlreadyDone && item.satisfactionScore === undefined) {
      setRatingItemId(item.id);
      setTempScore(90);
      setTempSatisfactionNote(item.satisfactionNote || '');
    }
  };

  const handleTogglePrepCompleted = async (item: CustomReminderItem) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const nextVal = !item.prepCompleted;
    await db.custom_reminders.update(item.id, {
      prepCompleted: nextVal,
    });
    if (nextVal) {
      onRewardToast?.(`🎁 ممتاز! تم تجهيز مستلزمات "${item.title}" قبل الموعد`);
    }
  };

  const handleSaveSatisfaction = async (itemId: string, score: number, note?: string) => {
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    const item = allReminders.find((r) => r.id === itemId);
    const targetDate = item?.date || todayStr;
    const prevDates = item?.completedDates || [];
    const nextDates = prevDates.includes(targetDate) ? prevDates : [...prevDates, targetDate];

    await db.custom_reminders.update(itemId, {
      satisfactionScore: score,
      satisfactionNote: note?.trim() || undefined,
      ratedAt: Date.now(),
      completedDates: nextDates,
    });

    setRatingItemId(null);
    onRewardToast?.(`🌟 تم تسجيل نسبة رضاك (${score}%) عن "${item?.title || 'الموعد'}"!`);
  };

  const handleDelete = async (id: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    await db.custom_reminders.delete(id);
    await autonomousNotificationScheduler.scheduleAllUpcomingAlarms();
  };

  // Filtered & sorted appointments
  const sortedAppointments = useMemo(() => {
    return [...allReminders]
      .filter((item) => {
        if (activeFilter === 'today') {
          return !item.date || item.date === todayStr || item.recurrence === 'daily';
        }
        if (activeFilter === 'occasions') {
          return item.category === 'occasion' || item.category === 'outing' || item.category === 'family';
        }
        if (activeFilter === 'unrated') {
          return item.satisfactionScore === undefined;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = a.date || todayStr;
        const dateB = b.date || todayStr;
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      });
  }, [allReminders, activeFilter, todayStr]);

  // Satisfaction Analytics Summary
  const satisfactionStats = useMemo(() => {
    const rated = allReminders.filter((r) => typeof r.satisfactionScore === 'number');
    if (rated.length === 0) return { avg: null, count: 0, byCat: [] };
    const total = rated.reduce((acc, r) => acc + (r.satisfactionScore || 0), 0);
    const avg = Math.round(total / rated.length);

    const byCat = APPOINTMENT_CATEGORIES.map((cat) => {
      const catItems = rated.filter((r) => r.category === cat.id);
      if (catItems.length === 0) return null;
      const catAvg = Math.round(
        catItems.reduce((acc, r) => acc + (r.satisfactionScore || 0), 0) / catItems.length
      );
      return {
        id: cat.id,
        labelAr: cat.labelAr,
        emoji: cat.emoji,
        avg: catAvg,
        count: catItems.length,
      };
    }).filter(Boolean) as Array<{ id: string; labelAr: string; emoji: string; avg: number; count: number }>;

    return { avg, count: rated.length, byCat };
  }, [allReminders]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="مفكرة المواعيد والمناسبات الذكية وحصاد الرضا"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/60 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[93vh] flex flex-col bg-[#faf7f0] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-[32px] border-2 border-amber-300/80 dark:border-amber-500/30 shadow-[0_24px_80px_rgba(6,78,59,0.28)] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
        data-no-swipe="true"
      >
        {/* Top Luminous Mihrab Header */}
        <div className="bg-gradient-to-br from-[#ecfdf5] via-[#fef9c3]/75 to-[#fce7f3]/70 dark:from-emerald-950/90 dark:via-zinc-900 dark:to-rose-950/70 px-4 py-3.5 border-b-2 border-amber-300/70 dark:border-amber-500/25 shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-2xl shrink-0 shadow-sm border border-amber-300">
              📅
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-950 dark:text-amber-200 border border-amber-300">
                  {isAr ? '🎁 مساعد المواعيد والمناسبات الذكي' : 'Smart Appointments & Occasions'}
                </span>
                {satisfactionStats.avg !== null && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-950 dark:text-emerald-200 border border-emerald-300">
                    🌟 {isAr ? `متوسط الرضا: ${satisfactionStats.avg}%` : `Avg Satisfaction: ${satisfactionStats.avg}%`}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white truncate mt-0.5">
                {isAr
                  ? 'مفكرة المواعيد، الخروجات، تذكير الهدايا، ونسبة الرضا'
                  : 'Daily Appointments, Gift Prep & Satisfaction Tracker'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-800 hover:bg-rose-50 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 overscroll-contain">
          {/* 1. Collapsible Add New Appointment / Occasion Studio */}
          <div className="rounded-[26px] bg-white dark:bg-zinc-900 border-2 border-amber-300/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setIsCreating(!isCreating);
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-amber-50/90 via-emerald-50/60 to-rose-50/70 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-between gap-2 text-start cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white">
                  {isAr
                    ? 'إضافة موعد جديد، خروجة، أو مناسبة (مع تذكير الهدايا والتحضير)'
                    : 'Add New Appointment, Outing, or Occasion'}
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                {isCreating ? (isAr ? 'طي النموذج ▲' : 'Hide ▲') : (isAr ? 'فتح النموذج ▼' : 'Open ▼')}
              </span>
            </button>

            {isCreating && (
              <form onSubmit={handleSaveAppointment} className="p-3.5 sm:p-4 space-y-3.5 border-t border-amber-200/70 dark:border-zinc-800">
                {/* 1-Tap Quick Templates */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block">
                    {isAr ? '⚡ قوالب سريعة بضغطة واحدة (تجهز التذكير والهدية تلقائياً):' : '⚡ 1-Tap Smart Templates:'}
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {QUICK_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.title}
                        type="button"
                        onClick={() => handleApplyQuickTemplate(tpl)}
                        className="px-3 py-1.5 rounded-full bg-[#faf7f0] dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-amber-300/80 dark:border-zinc-700 text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        {tpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Selector Pills */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                    {isAr ? '1. تصنيف الموعد:' : '1. Category:'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {APPOINTMENT_CATEGORIES.map((cat) => {
                      const active = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelectCategory(cat.id)}
                          className={`py-2 px-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            active
                              ? 'bg-zinc-900 dark:bg-amber-400 text-amber-300 dark:text-zinc-950 border-zinc-900 dark:border-amber-400 shadow-xs'
                              : 'bg-[#faf7f0] dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border-amber-300/70 dark:border-zinc-700'
                          }`}
                        >
                          <span>{cat.emoji}</span>
                          <span className="truncate">{cat.labelAr}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title & Location Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                      {isAr ? '2. اسم الموعد أو المناسبة:' : '2. Appointment / Occasion Title:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder={
                        isAr
                          ? 'مثال: عيد ميلاد صديقي، خروجة عشاء، اجتماع مشروع، كشف دكتور...'
                          : 'e.g., Friend birthday, Dinner outing, Client meeting...'
                      }
                      className="w-full h-10 px-3.5 rounded-xl bg-[#faf7f0] dark:bg-zinc-950 border border-amber-300/90 dark:border-zinc-700 focus:border-emerald-600 text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                      {isAr ? 'المكان (اختياري):' : 'Location (Optional):'}
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={isAr ? 'المكان أو العنوان...' : 'Location...'}
                        className="w-full h-10 ps-8 pe-3 rounded-xl bg-[#faf7f0] dark:bg-zinc-950 border border-amber-300/90 dark:border-zinc-700 focus:border-emerald-600 text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Date, Time & Recurrence Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        {isAr ? '3. التاريخ:' : '3. Date:'}
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDate(todayStr)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                            date === todayStr
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {isAr ? 'اليوم' : 'Today'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDate(tomorrowStr)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                            date === tomorrowStr
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {isAr ? 'غداً' : 'Tomorrow'}
                        </button>
                      </div>
                    </div>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#faf7f0] dark:bg-zinc-950 border border-amber-300/90 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                      {isAr ? 'الساعة (وقت الموعد):' : 'Time:'}
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#faf7f0] dark:bg-zinc-950 border border-amber-300/90 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                      {isAr ? 'تكرار الموعد / المناسبة:' : 'Recurrence:'}
                    </label>
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value as ReminderRecurrence)}
                      className="w-full h-10 px-3 rounded-xl bg-[#faf7f0] dark:bg-zinc-950 border border-amber-300/90 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white"
                    >
                      <option value="once">{isAr ? 'مرة واحدة في هذا التاريخ' : 'Once on this date'}</option>
                      <option value="daily">{isAr ? 'يومياً' : 'Daily'}</option>
                      <option value="weekdays">{isAr ? 'أيام العمل (الأحد - الخميس)' : 'Weekdays'}</option>
                      <option value="weekly">{isAr ? 'أسبوعياً في نفس اليوم' : 'Weekly'}</option>
                      <option value="yearly">{isAr ? 'سنوياً (عيد ميلاد / ذكرى سنوية)' : 'Yearly (Anniversary/Birthday)'}</option>
                    </select>
                  </div>
                </div>

                {/* Smart Pre-Event Preparation & Gift Assistant Box */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-rose-50/50 to-emerald-50/60 dark:from-amber-950/35 dark:via-zinc-900 dark:to-emerald-950/30 border-2 border-amber-300/80 dark:border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="text-xs font-bold text-zinc-950 dark:text-white">
                        {isAr
                          ? '4. تذكير التحضير قبل الموعد (هات هدية / خد حاجة معاك 🎁🎒):'
                          : '4. Smart Pre-Event Gift & Carry-Items Reminder:'}
                      </span>
                    </div>

                    <select
                      value={prepLeadMins}
                      onChange={(e) => setPrepLeadMins(Number(e.target.value))}
                      className="h-8 px-2.5 rounded-full bg-white dark:bg-zinc-900 border border-amber-400 text-[11px] font-bold text-amber-950 dark:text-amber-200 cursor-pointer"
                    >
                      {LEAD_TIME_OPTIONS.map((opt) => (
                        <option key={opt.mins} value={opt.mins}>
                          🔔 {opt.labelAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Smart Toggleable Suggestions */}
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set([...currentCatMeta.smartPrepSuggestions, ...prepChecklist])).map(
                      (sug) => {
                        const isSelected = prepChecklist.includes(sug);
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => togglePrepItem(sug)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                : 'bg-white/90 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-amber-300/70 dark:border-zinc-700'
                            }`}
                          >
                            {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                            <span>{sug}</span>
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* Custom Item to Bring / Buy Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customPrepInput}
                      onChange={(e) => setCustomPrepInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomPrep();
                        }
                      }}
                      placeholder={
                        isAr
                          ? 'أضف تذكير تحضير خاص (مثال: اشتري عطر هدية، خد الكاميرا، هات عصير)...'
                          : 'Add custom prep item (e.g., Buy perfume gift, Bring camera)...'
                      }
                      className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-amber-300/80 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomPrep}
                      className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {isAr ? '+ أضف للتحضير' : '+ Add'}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition-all"
                >
                  <Bell className="w-4 h-4" />
                  <span>
                    {isAr
                      ? 'حفظ الموعد وتفعيل تذكير التحضير والمنبه الذكي 🔔'
                      : 'Save Appointment & Activate Smart Prep Alarms 🔔'}
                  </span>
                </button>
              </form>
            )}
          </div>

          {/* 2. Satisfaction Overview & Filter Tabs */}
          <div className="space-y-2.5">
            {satisfactionStats.byCat.length > 0 && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/80 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-amber-950/20 border border-emerald-300/70 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'مؤشر الرضا عن مواعيدك حسب التصنيف:' : 'Satisfaction by Category:'}</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {satisfactionStats.byCat.map((c) => (
                    <span
                      key={c.id}
                      className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-emerald-300/70 dark:border-zinc-700 text-[11px] font-bold text-zinc-900 dark:text-zinc-100"
                    >
                      {c.emoji} {c.labelAr}: <strong className="text-emerald-700 dark:text-emerald-300">{c.avg}%</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', labelAr: `✨ كل المواعيد (${allReminders.length})` },
                { id: 'today', labelAr: '📅 مواعيد اليوم' },
                { id: 'occasions', labelAr: '🎉 المناسبات والخروجات' },
                { id: 'unrated', labelAr: '🌟 بانتظار تقييم الرضا' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setActiveFilter(tab.id as any);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-zinc-900 dark:bg-amber-400 text-amber-300 dark:text-zinc-950 border-zinc-900 dark:border-amber-400 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-amber-300/70 dark:border-zinc-700'
                  }`}
                >
                  {tab.labelAr}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Appointments & Occasions Cards List */}
          <div className="space-y-3">
            {sortedAppointments.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-3xl bg-white/80 dark:bg-zinc-900/60 border border-amber-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold">
                {isAr
                  ? 'لا توجد مواعيد أو مناسبات مسجلة في هذا التصنيف حالياً — أضف موعدك الأول من الأعلى!'
                  : 'No appointments found in this filter.'}
              </div>
            ) : (
              sortedAppointments.map((item) => {
                const meta = getCategoryMeta(item.category);
                const targetDate = item.date || todayStr;
                const isDone = (item.completedDates || []).includes(targetDate);
                const hasPrep = item.prepChecklist && item.prepChecklist.length > 0;
                const isRatingOpen = ratingItemId === item.id;
                const leadLabel =
                  LEAD_TIME_OPTIONS.find((o) => o.mins === item.prepReminderLeadMinutes)?.labelAr ||
                  'قبل الموعد';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-[24px] border-2 transition-all space-y-2.5 shadow-xs ${meta.cardBg}`}
                  >
                    {/* Top Row: Category Icon, Title, Date/Time, Done & Delete */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCompletedToday(item)}
                          title={isAr ? 'تحديد الموعد كمكتمل وتقييم الرضا' : 'Mark completed & rate'}
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 border-2 transition-all cursor-pointer ${
                            isDone
                              ? 'bg-emerald-600 text-white border-amber-300 shadow-sm'
                              : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-amber-300/80 dark:border-zinc-700'
                          }`}
                        >
                          {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <span>{meta.emoji}</span>}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeBg}`}>
                              {meta.emoji} {meta.labelAr}
                            </span>
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/90 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300/70 dark:border-zinc-700">
                              📅 {targetDate === todayStr ? (isAr ? 'اليوم' : 'Today') : targetDate === tomorrowStr ? (isAr ? 'غداً' : 'Tomorrow') : targetDate} • ⏰ {item.time}
                            </span>
                            {item.location && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300/60">
                                📍 {item.location}
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-sm sm:text-base font-bold mt-1 ${
                              isDone
                                ? 'line-through text-zinc-500 dark:text-zinc-400'
                                : 'text-zinc-950 dark:text-white'
                            }`}
                          >
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {typeof item.satisfactionScore === 'number' && (
                          <button
                            type="button"
                            onClick={() => {
                              setRatingItemId(isRatingOpen ? null : item.id);
                              setTempScore(item.satisfactionScore ?? 90);
                              setTempSatisfactionNote(item.satisfactionNote || '');
                            }}
                            className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                            title={isAr ? 'تعديل نسبة الرضا عن الموعد' : 'Edit Satisfaction'}
                          >
                            <span>
                              {item.satisfactionScore >= 85
                                ? '😍'
                                : item.satisfactionScore >= 65
                                ? '😊'
                                : '😕'}
                            </span>
                            <span>{item.satisfactionScore}% رضا</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          aria-label={isAr ? 'حذف الموعد' : 'Delete'}
                          className="w-8 h-8 rounded-full bg-white/80 dark:bg-zinc-800 hover:bg-rose-100 text-zinc-500 hover:text-rose-600 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Pre-Event Preparation / Gift Checklist Banner */}
                    {hasPrep && (
                      <div
                        onClick={() => handleTogglePrepCompleted(item)}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          item.prepCompleted
                            ? 'bg-emerald-100/70 dark:bg-emerald-950/40 border-emerald-300 text-emerald-950 dark:text-emerald-200'
                            : 'bg-amber-100/80 dark:bg-amber-950/50 border-amber-400/80 text-amber-950 dark:text-amber-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <PackageCheck className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-300" />
                          <div className="text-[11px] font-bold truncate">
                            <span className="underline decoration-amber-500/60 me-1.5">
                              {isAr ? `تذكير (${leadLabel}):` : `Prep (${leadLabel}):`}
                            </span>
                            <span>{item.prepChecklist?.join(' • ')}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/90 dark:bg-zinc-900 text-[10px] font-bold shrink-0 border border-amber-300">
                          {item.prepCompleted
                            ? isAr
                              ? '✓ تم التجهيز'
                              : '✓ Prepped'
                            : isAr
                            ? 'اضغط عند التجهيز'
                            : 'Mark Prepped'}
                        </span>
                      </div>
                    )}

                    {/* Post-Appointment Quick Satisfaction Bar */}
                    {item.satisfactionScore === undefined && !isRatingOpen ? (
                      <div className="pt-1 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                          {isAr ? '🌟 بعد انتهاء الموعد: ما نسبة رضاك عنه؟' : '🌟 How satisfied were you after this appointment?'}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {SATISFACTION_PRESETS.map((preset) => (
                            <button
                              key={preset.score}
                              type="button"
                              onClick={() => handleSaveSatisfaction(item.id, preset.score)}
                              className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>{preset.emoji}</span>
                              <span>{preset.score}%</span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setRatingItemId(item.id);
                              setTempScore(85);
                              setTempSatisfactionNote('');
                            }}
                            className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-950 dark:text-indigo-200 text-[10px] font-bold cursor-pointer"
                          >
                            {isAr ? 'تقييم مفصل...' : 'Custom...'}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Saved Satisfaction Note */}
                    {item.satisfactionNote && !isRatingOpen && (
                      <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 bg-white/70 dark:bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-zinc-800">
                        💬 {isAr ? 'انطباعك بعد الموعد:' : 'Post-event reflection:'} {item.satisfactionNote}
                      </p>
                    )}

                    {/* Detailed Satisfaction Slider Drawer */}
                    {isRatingOpen && (
                      <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-emerald-400 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white">
                            {isAr ? `تحديد نسبة الرضا عن "${item.title}":` : 'Satisfaction Score:'}
                          </span>
                          <span className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-400">
                            {tempScore}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={tempScore}
                          onChange={(e) => setTempScore(Number(e.target.value))}
                          className="w-full h-2 bg-emerald-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <input
                          type="text"
                          value={tempSatisfactionNote}
                          onChange={(e) => setTempSatisfactionNote(e.target.value)}
                          placeholder={
                            isAr
                              ? 'ملاحظة بعد الموعد (إيه اللي أسعدك أو تحب تغيره المرة الجاية؟)...'
                              : 'Post-appointment note...'
                          }
                          className="w-full h-9 px-3 rounded-xl bg-[#faf7f0] dark:bg-zinc-950 border border-amber-300/80 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setRatingItemId(null)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-500 cursor-pointer"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSaveSatisfaction(item.id, tempScore, tempSatisfactionNote)
                            }
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer shadow-xs"
                          >
                            {isAr ? 'حفظ التقييم 🌟' : 'Save Rating 🌟'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
