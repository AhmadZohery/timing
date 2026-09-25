import React from 'react';
import {
  Zap,
  BookOpen,
  ShieldAlert,
  Flame,
  Award,
  Plus,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

export interface QuickActionDockProps {
  onStartSprint: () => void;
  onIncrementQuran: () => void;
  onOpenPanic: () => void;
  onOpenSmartTasbih: () => void;
  onOpenWeeklyReport: () => void;
  currentWirdPages: number;
  totalWirdPages: number;
  isAr: boolean;
  className?: string;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  onStartSprint,
  onIncrementQuran,
  onOpenPanic,
  onOpenSmartTasbih,
  onOpenWeeklyReport,
  currentWirdPages,
  totalWirdPages,
  isAr,
  className = '',
}) => {
  return (
    <div
      className={`p-2.5 sm:p-3 rounded-2xl bg-white/90 dark:bg-[#121422] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none select-none ${className}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. Quick +20m Deep Focus Sprint */}
      <button
        type="button"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onStartSprint();
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-800 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/50 transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs group"
        title={isAr ? 'بدء جلسة عمل عميق وتركيز (20 دقيقة)' : 'Start 20m Deep Work Sprint'}
      >
        <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Zap className="w-3.5 h-3.5 fill-sky-500" />
        </div>
        <div className="text-start leading-tight">
          <span className="text-[11px] font-black block">
            {isAr ? 'شوط تركيز ⚡' : 'Deep Sprint ⚡'}
          </span>
          <span className="text-[9px] font-mono opacity-80 block">
            {isAr ? '20 دقيقة عميقة' : '20 min focus'}
          </span>
        </div>
      </button>

      {/* 2. Quick +1 Quran Page with Hasanat Multiplier */}
      <button
        type="button"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onIncrementQuran();
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs group"
        title={isAr ? 'تسجيل قراءة صفحة من الورد وكسب الحسنات (+5,500 حسنة)' : 'Log +1 Quran Page (+5,500 Hasanat)'}
      >
        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <BookOpen className="w-3.5 h-3.5" />
        </div>
        <div className="text-start leading-tight">
          <span className="text-[11px] font-black block flex items-center gap-1">
            <span>{isAr ? '+1 صفحة تلاوة' : '+1 Quran Page'}</span>
            <Plus className="w-3 h-3 text-emerald-500" />
          </span>
          <span className="text-[9px] font-mono opacity-80 block">
            <bdi dir="ltr">{currentWirdPages}/{totalWirdPages}</bdi> • +5.5k {isAr ? 'حسنة' : 'H'}
          </span>
        </div>
      </button>

      {/* 3. Quick 100x Shield Tasbih */}
      <button
        type="button"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onOpenSmartTasbih();
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50 transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs group"
        title={isAr ? 'المسبحة الذكية وحرز الصباح والمساء' : 'Smart Tasbih & Fortress Shield'}
      >
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
        </div>
        <div className="text-start leading-tight">
          <span className="text-[11px] font-black block">
            {isAr ? 'حرز التسبيح 📿' : 'Tasbih Shield 📿'}
          </span>
          <span className="text-[9px] font-mono opacity-80 block">
            {isAr ? '100x حرز اليوم' : '100x daily fortress'}
          </span>
        </div>
      </button>

      {/* 4. Panic Button (Emergency 3m Zero-Inertia) */}
      <button
        type="button"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onOpenPanic();
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/50 transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs group"
        title={isAr ? 'كسر الجمود والتسويف (مهمة 3 دقائق آمنة)' : 'Break Inertia (3m safe task)'}
      >
        <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <ShieldAlert className="w-3.5 h-3.5" />
        </div>
        <div className="text-start leading-tight">
          <span className="text-[11px] font-black block">
            {isAr ? 'كسر الجمود 🛡️' : 'Break Inertia 🛡️'}
          </span>
          <span className="text-[9px] font-mono opacity-80 block">
            {isAr ? '3 دقائق آمنة' : '3 min safe zone'}
          </span>
        </div>
      </button>

      {/* 5. Weekly Barakah Harvest Report Button */}
      <button
        type="button"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onOpenWeeklyReport();
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/50 transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs group"
        title={isAr ? 'عرض تقرير حصاد البركة الأسبوعي' : 'Weekly Barakah Harvest Report'}
      >
        <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Award className="w-3.5 h-3.5" />
        </div>
        <div className="text-start leading-tight">
          <span className="text-[11px] font-black block">
            {isAr ? 'حصاد الأسبوع 📊' : 'Weekly Harvest 📊'}
          </span>
          <span className="text-[9px] font-mono opacity-80 block">
            {isAr ? 'مؤشر البركة' : 'Barakah Index'}
          </span>
        </div>
      </button>
    </div>
  );
};
