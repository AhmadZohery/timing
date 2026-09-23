import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Calendar,
  Clock,
  Trash2,
  Bookmark,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { LearningTrackItem, LearningSessionLog } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useWorkerTimer } from '../../hooks/useWorkerTimer';

interface SelfLearningTrackerProps {
  onRewardToast?: (msg: string) => void;
  className?: string;
}

const STORAGE_TRACKS_KEY = 'midmar_learning_tracks_v1';
const STORAGE_LOGS_KEY = 'midmar_learning_logs_v1';

const DEFAULT_TRACKS: LearningTrackItem[] = [
  {
    id: 'track_1',
    title: 'برمجة الويب وهندسة البرمجيات المتقدمة',
    category: 'programming',
    currentTopic: 'إدارة الحالة الموزعة والمزامنة دون خادم',
    totalLessons: 24,
    completedLessons: 14,
    targetHoursWeekly: 8,
    notes: 'تطبيق عملي لمشاريع تفاعلية',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'track_2',
    title: 'إتقان محادثة اللغة الإنجليزية المتخصصة',
    category: 'languages',
    currentTopic: 'المصطلحات المهنية والتفاوض وعرض المشاريع',
    totalLessons: 30,
    completedLessons: 19,
    targetHoursWeekly: 5,
    notes: 'استماع مكثف وممارسة التحدث الذاتي',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'track_3',
    title: 'استراتيجيات التدريس الرقمي والشرح التفاعلي',
    category: 'teaching',
    currentTopic: 'تصميم العروض التفاعلية وتبسيط المفاهيم الصعبة',
    totalLessons: 12,
    completedLessons: 7,
    targetHoursWeekly: 4,
    notes: 'تمارين لتوصيل المعلومة بسلاسة للطلاب',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SelfLearningTracker: React.FC<SelfLearningTrackerProps> = ({
  onRewardToast,
  className = '',
}) => {
  // 1. Tracks State
  const [tracks, setTracks] = useState<LearningTrackItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRACKS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_TRACKS;
    } catch {
      return DEFAULT_TRACKS;
    }
  });

  // 2. Logs State
  const [logs, setLogs] = useState<LearningSessionLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LOGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_TRACKS_KEY, JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  // Selected Track for Active Focus Session
  const [activeTrackId, setActiveTrackId] = useState<string>(() => tracks[0]?.id || '');
  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];

  // Learning Focus Timer (default 25m)
  const timer = useWorkerTimer();
  const timerDurationMin = 25;

  // New Track Dialog State
  const [isNewTrackModalOpen, setIsNewTrackModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<LearningTrackItem['category']>('programming');
  const [newCurrentTopic, setNewCurrentTopic] = useState('');
  const [newTotalLessons, setNewTotalLessons] = useState<number | ''>('');
  const [newCompletedLessons, setNewCompletedLessons] = useState<number>(0);
  const [newWeeklyHours, setNewWeeklyHours] = useState<number | ''>(5);
  const [newNotes, setNewNotes] = useState('');

  // Daily Reflection Form
  const [dailySummary, setDailySummary] = useState('');
  const [dailyTakeaway, setDailyTakeaway] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState<number>(25);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Add / Edit Track Handler
  const handleSaveNewTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundSynth.playCompletionChime();
    haptic.vibrateLight();

    const newTrack: LearningTrackItem = {
      id: `track_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      currentTopic: newCurrentTopic.trim() || 'الموضوع الأول',
      totalLessons: newTotalLessons ? Number(newTotalLessons) : undefined,
      completedLessons: Number(newCompletedLessons) || 0,
      targetHoursWeekly: newWeeklyHours ? Number(newWeeklyHours) : 5,
      notes: newNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTracks([newTrack, ...tracks]);
    setActiveTrackId(newTrack.id);
    setIsNewTrackModalOpen(false);

    // Reset Form
    setNewTitle('');
    setNewCurrentTopic('');
    setNewTotalLessons('');
    setNewCompletedLessons(0);
    setNewNotes('');

    onRewardToast?.(`✨ تمت إضافة مسار التعلم: "${newTrack.title}" بنجاح!`);
  };

  // Quick increment completed lessons
  const handleIncrementLesson = (trackId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const next = t.completedLessons + 1;
          const max = t.totalLessons || 999;
          const updated = Math.min(next, max);
          return {
            ...t,
            completedLessons: updated,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  // Delete Track
  const handleDeleteTrack = (trackId: string, trackTitle: string) => {
    if (confirm(`هل أنت متأكد من حذف مسار "${trackTitle}"؟`)) {
      soundSynth.playTactileClick();
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      if (activeTrackId === trackId) {
        const remaining = tracks.filter((t) => t.id !== trackId);
        setActiveTrackId(remaining[0]?.id || '');
      }
    }
  };

  // Save Daily Reflection Log
  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailySummary.trim()) return;

    soundSynth.playCompletionChime();
    haptic.vibrateWorkDone();

    const newLog: LearningSessionLog = {
      id: `log_${Date.now()}`,
      trackId: activeTrack?.id || 'general',
      date: new Date().toISOString().split('T')[0],
      durationMinutes: sessionMinutes,
      summary: dailySummary.trim(),
      takeaway: dailyTakeaway.trim(),
      createdAt: new Date().toISOString(),
    };

    setLogs([newLog, ...logs]);
    setDailySummary('');
    setDailyTakeaway('');

    onRewardToast?.('🎯 تم توثيق ما تعلمته اليوم في سجلك المعرفي الدائم (+20 نقطة خبرة)!');
  };

  // Stats
  const totalCompletedLessons = useMemo(() => {
    return tracks.reduce((acc, t) => acc + t.completedLessons, 0);
  }, [tracks]);

  const totalLearningMinutes = useMemo(() => {
    return logs.reduce((acc, l) => acc + l.durationMinutes, 0);
  }, [logs]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner / Motivational Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 border border-indigo-500/20 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  سجل ومتابعة التعلم الذاتي 📖
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {tracks.length} مسارات نشطة
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                اكتب ما تتعلمه، وثّق فوائدك اليومية، وتابع نموك المعرفي بلا توقف
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewTrackModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مسار تعلم جديد</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي الدروس المنجزة</span>
            <span className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 block">
              {totalCompletedLessons} درس
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-bold block">وقت الاستثمار المعرفي</span>
            <span className="text-base sm:text-lg font-black text-indigo-300 mt-0.5 block">
              {(totalLearningMinutes / 60).toFixed(1)} ساعة
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-bold block">جلسات التوثيق المسجلة</span>
            <span className="text-base sm:text-lg font-black text-amber-300 mt-0.5 block">
              {logs.length} جلسة
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-bold block">شعلة الشغف والتعلم</span>
            <span className="text-base sm:text-lg font-black text-purple-300 mt-0.5 block">
              مستمرة 🔥
            </span>
          </div>
        </div>
      </div>

      {/* Active Tracks Carousel / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <span>📚</span>
            <span>مساراتي التعليمية الحالية</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            انقر على المسار لتحديده لجلسة التركيز
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tracks.map((track) => {
            const isSelected = track.id === activeTrackId;
            const pct = track.totalLessons
              ? Math.min(100, Math.round((track.completedLessons / track.totalLessons) * 100))
              : null;

            return (
              <div
                key={track.id}
                onClick={() => setActiveTrackId(track.id)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'bg-white dark:bg-[#12131A] border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-zinc-300 inline-block mb-1.5">
                      {track.category === 'programming'
                        ? '💻 برمجة وهندسة'
                        : track.category === 'languages'
                        ? '🌐 لغات ومحادثة'
                        : track.category === 'teaching'
                        ? '🎓 تدريس وتعليم'
                        : track.category === 'reading'
                        ? '📖 قراءة وفكر'
                        : track.category === 'islamic'
                        ? '🕌 علوم شرعية'
                        : '⭐ مهارات عامة'}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {track.title}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrack(track.id, track.title);
                    }}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    title="حذف المسار"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 font-bold block">الدرس / الموضوع الحالي:</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate mt-0.5">
                    {track.currentTopic}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500 dark:text-slate-400">
                      {track.completedLessons} {track.totalLessons ? `/ ${track.totalLessons}` : ''} درس منجز
                    </span>
                    {pct !== null && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-black">
                        {pct}%
                      </span>
                    )}
                  </div>
                  {pct !== null && (
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Quick Increment Button */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    الهدف: {track.targetHoursWeekly || 5} س / أسبوع
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIncrementLesson(track.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>أنهيت درساً ➕</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Active Study Session & Reflection Box */}
      {activeTrack && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                جلسة التعلم والتركيز الحالية
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {activeTrack.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                الموضوع: {activeTrack.currentTopic}
              </p>
            </div>

            {/* Study Session Timer */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/[0.04] px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] self-start sm:self-auto">
              <Clock className="w-4 h-4 text-indigo-500" />
              <div className="text-center font-mono font-black text-sm text-slate-800 dark:text-zinc-200">
                {Math.floor(timer.remainingSec / 60)}:
                {String(timer.remainingSec % 60).padStart(2, '0')}
              </div>
              <div className="flex items-center gap-1">
                {timer.isRunning ? (
                  <button
                    type="button"
                    onClick={() => timer.pauseTimer()}
                    className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                    title="إيقاف مؤقت"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (timer.remainingSec === 0) {
                        timer.startTimer(timerDurationMin * 60, () => {
                          soundSynth.playCompletionChime();
                          haptic.vibrateWorkDone();
                          onRewardToast?.('🎉 أحسنت! اكتمل شوط التعلم المركز بنجاح!');
                        });
                      } else {
                        timer.startTimer(timer.remainingSec);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                    title="بدء المؤقت"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => timer.stopTimer()}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-zinc-300 hover:bg-slate-300 cursor-pointer"
                  title="إعادة ضبط"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* "ماذا تعلمت اليوم؟" Reflection Form */}
          <form onSubmit={handleSaveDailyLog} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base">✍️</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                ماذا تعلمت اليوم؟ (التوثيق والمتابعة الذكية)
              </h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  ملخص ما استوعبته اليوم:
                </label>
                <textarea
                  rows={2}
                  value={dailySummary}
                  onChange={(e) => setDailySummary(e.target.value)}
                  placeholder="مثال: فهمت كيفية بناء مكونات React قابلة لإعادة الاستخدام مع ربط الخصائص، وحللت مشكلة عدم استجابة الشاشة الصغيرة..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    الفائدة الذهبية / المعلومة المحفورة:
                  </label>
                  <input
                    type="text"
                    value={dailyTakeaway}
                    onChange={(e) => setDailyTakeaway(e.target.value)}
                    placeholder="مثال: التدريب العملي المباشر يثبت 80% أكثر من مجرد المشاهدة"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    مدة الجلسة (دقائق):
                  </label>
                  <select
                    value={sessionMinutes}
                    onChange={(e) => setSessionMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={15}>15 دقيقة (سريع)</option>
                    <option value={25}>25 دقيقة (بومودورو)</option>
                    <option value={45}>45 دقيقة (عميق)</option>
                    <option value={60}>60 دقيقة (مكثف)</option>
                    <option value={90}>90 دقيقة (فائق)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-medium">
                يتم حفظ كل ملخص في سجلك المعرفي للرجوع إليه ومراجعته دورياً
              </span>
              <button
                type="submit"
                disabled={!dailySummary.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                <span>حفظ في سجلي المعرفي 💾</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historical Follow-up Timeline */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4">
        <button
          type="button"
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="w-full flex items-center justify-between text-start cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              سجل المتابعة التاريخية لما تعلمته ({logs.length} توثيقات)
            </h3>
          </div>
          {isHistoryExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isHistoryExpanded && (
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                لم توثق أي جلسة بعد. اكتب ما تعلمته في النموذج أعلاه وسيظهر هنا في خط زمني مرتب!
              </div>
            ) : (
              logs.map((log) => {
                const track = tracks.find((t) => t.id === log.trackId);
                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {track?.title || 'مسار عام'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          • {log.durationMinutes} دقيقة
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.date}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-zinc-200 font-medium">
                      {log.summary}
                    </p>

                    {log.takeaway && (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>الفائدة: {log.takeaway}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Add New Learning Track Modal */}
      {isNewTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  إضافة مسار تعلم أو دورة جديدة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTrackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewTrack} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  اسم الدورة / الكتاب / المهارة:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: دورة الذكاء الاصطناعي وبايثون"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    تصنيف المسار:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="programming">💻 برمجة وهندسة برمجيات</option>
                    <option value="languages">🌐 لغات ومحادثة</option>
                    <option value="teaching">🎓 تدريس وشرح رقمي</option>
                    <option value="reading">📖 قراءة وفكر وبناء</option>
                    <option value="islamic">🕌 علوم شرعية وقرآن</option>
                    <option value="business">💼 ريادة أعمال وتسويق</option>
                    <option value="other">⭐ مهارة عامة أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    الدرس / الموضوع الحالي:
                  </label>
                  <input
                    type="text"
                    value={newCurrentTopic}
                    onChange={(e) => setNewCurrentTopic(e.target.value)}
                    placeholder="مثال: مقدمة في خوارزميات التعلم"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    إجمالي الدروس:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newTotalLessons}
                    onChange={(e) => setNewTotalLessons(e.target.value ? Number(e.target.value) : '')}
                    placeholder="مثال: 30"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    الدروس المنجزة حالياً:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newCompletedLessons}
                    onChange={(e) => setNewCompletedLessons(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    الهدف الأسبوعي (ساعات):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newWeeklyHours}
                    onChange={(e) => setNewWeeklyHours(e.target.value ? Number(e.target.value) : '')}
                    placeholder="5"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  ملاحظات أو رابط المرجع:
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="رابط المنصة، كتاب مرجعي، إلخ..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewTrackModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  حفظ المسار والبدء 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
