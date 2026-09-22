import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Coffee,
  Clock,
  Sparkles,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  X,
  Heart,
  BookOpen,
  Shield,
} from 'lucide-react';
import { db } from '../../db/db';
import type { UserState, DailyLog, SleepScheduleConfig } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { calculatePrayerTimes } from '../../utils/prayerCalculator';
import { getBiologicalDate, awardSpiritualHabitPoints, upsertDailyLog } from '../../utils/gamification';

interface SleepRestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState?: UserState;
  todayLog?: DailyLog;
  onRewardToast?: (msg: string) => void;
}

export const SleepRestModal: React.FC<SleepRestModalProps> = ({
  isOpen,
  onClose,
  userState,
  todayLog,
  onRewardToast,
}) => {
  const [activeTab, setActiveTab] = useState<'circadian' | 'nap' | 'winddown'>('circadian');

  // Sleep Config State
  const defaultSchedule: SleepScheduleConfig = {
    enabled: true,
    targetBedtime: '23:00',
    targetWakeTime: '05:00',
    syncWithFajr: true,
    wakeBeforeFajrMinutes: 20,
    windDownMinutes: 45,
    powerNapEnabled: true,
    powerNapDurationMin: 20,
    preferredNapWindow: 'post_dhuhr',
  };

  const currentSchedule: SleepScheduleConfig =
    userState?.settings?.sleepSchedule || defaultSchedule;

  const [bedtime, setBedtime] = useState(currentSchedule.targetBedtime);
  const [wakeTime, setWakeTime] = useState(currentSchedule.targetWakeTime);
  const [syncFajr, setSyncFajr] = useState(currentSchedule.syncWithFajr);
  const [windDownMin, setWindDownMin] = useState(currentSchedule.windDownMinutes);

  // Power Nap Timer State
  const [napSeconds, setNapSeconds] = useState(currentSchedule.powerNapDurationMin * 60);
  const [isNapRunning, setIsNapRunning] = useState(false);
  const [napAmbient, setNapAmbient] = useState<'none' | 'rain' | 'theta'>('rain');

  // Sleep hours & quality for today log
  const [sleepHours, setSleepHours] = useState<number>(todayLog?.sleepHours || 7);
  const [sleepQuality, setSleepQuality] = useState<'rested' | 'normal' | 'tired'>(
    todayLog?.sleepQuality || 'rested'
  );

  // Calculate Fajr time for synchronization
  const todayTimes = calculatePrayerTimes(
    new Date(),
    userState?.settings?.prayerLocation?.latitude ?? 30.0444,
    userState?.settings?.prayerLocation?.longitude ?? 31.2357,
    userState?.settings?.prayerLocation?.calculationMethod ?? 'egyptian'
  );

  // Auto calculate wake time if sync with Fajr is enabled
  useEffect(() => {
    if (syncFajr && todayTimes.fajr) {
      const fajrDate = new Date(todayTimes.fajr.getTime() - (currentSchedule.wakeBeforeFajrMinutes || 20) * 60000);
      const hours = fajrDate.getHours().toString().padStart(2, '0');
      const mins = fajrDate.getMinutes().toString().padStart(2, '0');
      setWakeTime(`${hours}:${mins}`);
    }
  }, [syncFajr, todayTimes.fajr]);

  // Nap timer effect
  useEffect(() => {
    let interval: any;
    if (isNapRunning && napSeconds > 0) {
      interval = setInterval(() => {
        setNapSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isNapRunning && napSeconds === 0) {
      setIsNapRunning(false);
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      handleCompleteNap();
    }
    return () => clearInterval(interval);
  }, [isNapRunning, napSeconds]);

  // Ambient sound during nap
  useEffect(() => {
    if (isNapRunning && napAmbient !== 'none') {
      soundSynth.startAmbient(napAmbient === 'rain' ? 'rain' : 'theta', 0.3);
    } else {
      soundSynth.stopAmbient();
    }
    return () => soundSynth.stopAmbient();
  }, [isNapRunning, napAmbient]);

  if (!isOpen) return null;

  // Calculate total sleep duration and 90-minute sleep cycles
  const calculateSleepMetrics = () => {
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);

    let startMins = bH * 60 + bM;
    let endMins = wH * 60 + wM;
    if (endMins <= startMins) endMins += 1440; // overnight

    const diffMins = endMins - startMins;
    const totalHours = (diffMins / 60).toFixed(1);
    const cycles = (diffMins / 90).toFixed(1);

    // Caffeine Curfew: 10 hours prior to bedtime to ensure total adenosine receptor clearance
    let curfewMins = (bH * 60 + bM) - 10 * 60;
    if (curfewMins < 0) curfewMins += 1440;
    const curfewH = Math.floor(curfewMins / 60);
    const curfewM = curfewMins % 60;
    const caffeineCurfew = `${curfewH.toString().padStart(2, '0')}:${curfewM.toString().padStart(2, '0')}`;

    return { diffMins, totalHours, cycles, caffeineCurfew };
  };

  const { totalHours, cycles, caffeineCurfew } = calculateSleepMetrics();

  const handleSaveSchedule = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    if (userState) {
      await db.user_state.update(userState.id, {
        'settings.sleepSchedule': {
          ...currentSchedule,
          targetBedtime: bedtime,
          targetWakeTime: wakeTime,
          syncWithFajr: syncFajr,
          windDownMinutes: windDownMin,
        },
      });
    }

    if (onRewardToast) {
      onRewardToast('🌙 تم حفظ وتحديث جدول النوم والراحة بنجاح!');
    }
  };

  const handleSaveSleepLog = async (hours: number, quality: 'rested' | 'normal' | 'tired') => {
    setSleepHours(hours);
    setSleepQuality(quality);
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const todayStr = getBiologicalDate(userState?.settings?.fajrGracePeriodActive ?? true);
    await upsertDailyLog(todayStr, {
      sleepHours: hours,
      sleepQuality: quality,
    });

    if (onRewardToast) {
      onRewardToast('✨ تم تسجيل ساعات وجودة النوم بنجاح (+5 نقاط استشفاء)!');
    }
  };

  const handleCompleteNap = async () => {
    const todayStr = getBiologicalDate(userState?.settings?.fajrGracePeriodActive ?? true);
    await upsertDailyLog(todayStr, {
      powerNapDone: true,
    });
    if (onRewardToast) {
      onRewardToast('☕ هنيئاً لك القيلولة! استعدت طاقتك الذهنية بالكامل (+10 نقاط)');
    }
  };

  const handleToggleMulk = async () => {
    const res = await awardSpiritualHabitPoints('mulk', 'سورة الملك المنجية');
    if (onRewardToast && res.message) {
      onRewardToast(res.message);
    }
  };

  const handleToggleSleepAdhkar = async () => {
    const res = await awardSpiritualHabitPoints('adhkar_sleep', 'أذكار النوم الصحيحة');
    if (onRewardToast && res.message) {
      onRewardToast(res.message);
    }
  };

  const formatNapTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div
        className="relative z-10 w-full sm:max-w-xl bg-slate-900 text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-indigo-900/60 overflow-hidden max-h-[92vh] flex flex-col"
        dir="rtl"
      >
        {/* Mobile Pull Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-indigo-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 shadow-xs">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                نظام ومواعيد النوم والاستشفاء البيولوجي
              </h3>
              <p className="text-[11px] text-indigo-300/80">
                ساعة الإيقاع اليومي، قيلولة الظهيرة، وبروتوكول الاسترخاء
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-indigo-950/60">
          <button
            onClick={() => setActiveTab('circadian')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'circadian'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-indigo-300/70 hover:text-white hover:bg-indigo-950/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>جدول ودورات النوم</span>
          </button>

          <button
            onClick={() => setActiveTab('nap')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'nap'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-indigo-300/70 hover:text-white hover:bg-indigo-950/50'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>قيلولة الظهيرة (20د)</span>
          </button>

          <button
            onClick={() => setActiveTab('winddown')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'winddown'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-indigo-300/70 hover:text-white hover:bg-indigo-950/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>تجهيز النوم والقرآن</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: CIRCADIAN SCHEDULE & SLEEP CYCLES */}
          {activeTab === 'circadian' && (
            <div className="space-y-5 animate-fade-in">
              {/* Circadian Metrics Hero Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/90 to-purple-950/50 border border-indigo-800/60 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                    الحساب البيولوجي لجدول نومك
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-white">
                      {totalHours} ساعة
                    </span>
                    <span className="text-xs text-indigo-300 font-medium">
                      ({cycles} دورة نوم عميقة)
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-300/90 leading-relaxed">
                    الدورة الواحدة 90 دقيقة: الاستيقاظ في نهاية دورة كاملة يضمن لك نشاطاً ذهنياً فورياً دون صداع أو خمول!
                  </p>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs text-indigo-300 font-bold">الهدف</span>
                  <span className="text-lg font-black text-amber-400 font-mono">
                    {Math.round(Number(cycles))}
                  </span>
                  <span className="text-[9px] text-indigo-300">دورات</span>
                </div>
              </div>

              {/* Caffeine Curfew Chronobiology Alert */}
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-200 block">
                      حظر الكافيين الذهبي (Caffeine Curfew)
                    </span>
                    <span className="text-[10px] text-amber-300/80 block">
                      توقف عن شرب القهوة قبل موعد نومك بـ 10 ساعات لتصفية الأدينوزين تماماً
                    </span>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <span className="text-sm font-mono font-black text-amber-400 block">
                    {caffeineCurfew}
                  </span>
                  <span className="text-[9px] text-amber-300/70">أقصى موعد</span>
                </div>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>موعد النوم المستهدف:</span>
                  </label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    يُرسل تذكير الاسترخاء قبل هذا الوقت بـ {windDownMin} دقيقة
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>موعد الاستيقاظ المستهدف:</span>
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    disabled={syncFajr}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    {syncFajr ? 'مضبوط تلقائياً قبل أذان الفجر بـ 20 دقيقة' : 'وقت مخصص يدوياً'}
                  </span>
                </div>
              </div>

              {/* Sync with Fajr Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>مزامنة الاستيقاظ تلقائياً مع أذان الفجر</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    يتم تعديل موعد الاستيقاظ يومياً ليكون قبل أذان الفجر بـ 20 دقيقة لحضور السحر وركعتي الفجر
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSyncFajr(!syncFajr)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    syncFajr ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      syncFajr ? 'right-1' : 'right-7'
                    }`}
                  />
                </button>
              </div>

              {/* Wind-down Preparation Window */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>تنبيه الاستعداد للنوم وسورة الملك مسبقاً:</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    {windDownMin} دقيقة قبل النوم
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[15, 30, 45, 60].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setWindDownMin(min)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        windDownMin === min
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {min} د
                    </button>
                  ))}
                </div>
              </div>

              {/* Log Last Night's Sleep */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    سجل نوم الليلة الماضية:
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {sleepHours} ساعات ({sleepQuality === 'rested' ? 'ممتاز ومستريح 🌟' : sleepQuality === 'normal' ? 'عادي 😐' : 'مجهد 🥱'})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 justify-between">
                  {[5, 6, 7, 8, 9].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSaveSleepLog(h, sleepQuality)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        sleepHours === h
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {h} س
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {(
                    [
                      { id: 'rested', label: 'نشيط ومستريح 🌟' },
                      { id: 'normal', label: 'عادي 😐' },
                      { id: 'tired', label: 'مرهق وقليل 🥱' },
                    ] as const
                  ).map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSaveSleepLog(sleepHours, q.id)}
                      className={`flex-1 py-1.5 rounded-xl text-[11px] font-medium border transition-all cursor-pointer ${
                        sleepQuality === q.id
                          ? 'bg-purple-950 border-purple-500 text-purple-200 font-bold'
                          : 'bg-slate-900/80 border-slate-700 text-slate-400'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Settings Button */}
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
              >
                اعتماد وتحديث مواعيد النوم المستهدفة ✔
              </button>
            </div>
          )}

          {/* TAB 2: POWER NAP TIMER (20 MIN) */}
          {activeTab === 'nap' && (
            <div className="space-y-5 animate-fade-in text-center">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-right space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>سِنة القيلولة النبوية وتجديد النشاط (20 دقيقة):</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  «قِيلُوا فَإِنَّ الشَّيَاطِينَ لَا تَقِيلُ». القيلولة لمدة 20 دقيقة بين الظهر والعصر تفرغ شحنات الإجهاد الذهني وتعيد سرعة استجابة الدماغ بنسبة 34% دون الدخول في نوم عميق وثقيل.
                </p>
              </div>

              {/* Nap Dial */}
              <div className="py-3 flex flex-col items-center justify-center">
                <div className="w-48 h-48 rounded-full border-4 border-amber-500/40 bg-amber-950/20 flex flex-col items-center justify-center shadow-inner relative">
                  <span className="text-4xl font-black font-mono tracking-tight text-white">
                    {formatNapTime(napSeconds)}
                  </span>
                  <span className="text-[11px] font-bold text-amber-400/90 mt-1 uppercase tracking-wider">
                    {isNapRunning ? 'استرخِ وأغلق عينيك 😴' : 'جاهزة للانطلاق ⚡'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setIsNapRunning(!isNapRunning);
                  }}
                  className="py-3 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isNapRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isNapRunning ? 'إيقاف مؤقت' : 'بدء القيلولة (20 دقيقة)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setIsNapRunning(false);
                    setNapSeconds(currentSchedule.powerNapDurationMin * 60);
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Nap Ambient Sound Selector */}
              <div className="pt-2 flex items-center justify-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">صوت هادئ للقيلولة:</span>
                {(['none', 'rain', 'theta'] as const).map((snd) => (
                  <button
                    key={snd}
                    type="button"
                    onClick={() => setNapAmbient(snd)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                      napAmbient === snd
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {snd === 'none' ? 'صامت' : snd === 'rain' ? 'مطر هادئ 🌧️' : 'موجات ثيتا 🌊'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BEDTIME WIND-DOWN & SURAH MULK */}
          {activeTab === 'winddown' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/50 text-xs text-purple-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-purple-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>بروتوكول ما قبل النوم والاسترخاء الهادئ:</span>
                </span>
                <p className="text-[11px] text-purple-300/80 leading-relaxed">
                  خصّص آخر 30 دقيقة من يومك للسكينة: أبعد هاتفك عن السرير، اقرأ سورة الملك المنجية من عذاب القبر، وردد أذكار النوم.
                </p>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2">
                {/* Surah Al-Mulk */}
                <button
                  type="button"
                  onClick={handleToggleMulk}
                  className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    todayLog?.surahMulkDone
                      ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200'
                      : 'bg-slate-800/80 border-slate-700/70 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        todayLog?.surahMulkDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">قراءة سورة الملك (المنجية)</div>
                      <div className="text-[10px] text-slate-400">
                        {todayLog?.surahMulkDone ? 'تمت القراءة بنجاح (+15 نقطة)' : '30 آية تشفع لصاحبها'}
                      </div>
                    </div>
                  </div>
                  {todayLog?.surahMulkDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                {/* Sleep Adhkar */}
                <button
                  type="button"
                  onClick={handleToggleSleepAdhkar}
                  className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    todayLog?.adhkarSleepDone
                      ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200'
                      : 'bg-slate-800/80 border-slate-700/70 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        todayLog?.adhkarSleepDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">أذكار النوم الصحيحة</div>
                      <div className="text-[10px] text-slate-400">
                        {todayLog?.adhkarSleepDone ? 'تم التسجيل (+10 نقاط)' : 'آية الكرسي، المعوذات، وباسمك ربي'}
                      </div>
                    </div>
                  </div>
                  {todayLog?.adhkarSleepDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                {/* Sleep Hygiene Tips */}
                <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-1.5 text-[11px] text-slate-400">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>خطوات ذهبية لنوم عميق:</span>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div>• شحن الهاتف خارج متناول اليد في غرفة النوم.</div>
                    <div>• غرفة مظلمة وباردة لتحفيز الميلاتونين الطبيعي.</div>
                    <div>• شرب نصف كوب ماء دافئ وتجنب الوجبات الثقيلة قبل النوم بساعتين.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-indigo-950 flex items-center justify-between text-xs text-slate-400">
          <span>نظام النوم البيولوجي • مضمار</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
