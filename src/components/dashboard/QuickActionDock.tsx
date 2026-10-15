import React from 'react';
import {
  BookOpen,
  ShieldAlert,
  Flame,
  Award,
  Plus,
  Sliders,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

export interface QuickActionDockProps {
  onStartSprint?: () => void;
  onIncrementQuran: () => void;
  onOpenQuranCustomizer?: () => void;
  onOpenPanic: () => void;
  onOpenSmartTasbih: () => void;
  onOpenWeeklyReport: () => void;
  currentWirdPages: number;
  totalWirdPages: number;
  isAr: boolean;
  className?: string;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  onStartSprint: _onStartSprint,
  onIncrementQuran,
  onOpenQuranCustomizer,
  onOpenPanic,
  onOpenSmartTasbih,
  onOpenWeeklyReport,
  currentWirdPages,
  totalWirdPages,
  isAr,
  className = '',
}) => {
  void _onStartSprint;
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 gap-2 select-none ${className}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. Quick +1 Quran Page with Hasanat Multiplier & Customizer */}
      <div className="min-h-[54px] flex items-center justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            onIncrementQuran();
          }}
          className="flex-1 flex items-center gap-2.5 p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all cursor-pointer active:scale-98 min-w-0"
          title={isAr ? 'تسجيل قراءة صفحة من الورد (+5,500 حسنة)' : 'Log +1 Quran Page (+5,500 Hasanat)'}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-start leading-tight min-w-0">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-0.5">
              <span>{isAr ? '+1 صفحة تلاوة' : '+1 Quran Page'}</span>
              <Plus className="w-3 h-3 text-emerald-500 shrink-0" />
            </span>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate block tabular-nums">
              <bdi dir="ltr">{currentWirdPages}/{totalWirdPages}</bdi>
            </span>
          </div>
        </button>

        {onOpenQuranCustomizer && (
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenQuranCustomizer();
            }}
            className="h-full px-2.5 py-3 border-s border-zinc-200/70 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer shrink-0"
            title={isAr ? 'تخصيص السورة والآيات 📖' : 'Customize Quran Wird 📖'}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. Quick 100x Shield Tasbih */}
      <button
        type="button"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onOpenSmartTasbih();
        }}
        className="min-h-[54px] flex items-center gap-2.5 p-2.5 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer active:scale-98 shadow-xs min-w-0"
        title={isAr ? 'المسبحة الذكية وحرز اليوم' : 'Smart Tasbih & Fortress Shield'}
      >
        <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
        </div>
        <div className="text-start leading-tight min-w-0">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate block">
            {isAr ? 'المسبحة الذكية' : 'Smart Tasbih'}
          </span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate block">
            {isAr ? 'حرز ١٠٠ تسبيحة' : '100x Shield'}
          </span>
        </div>
      </button>

      {/* 3. Panic Button (Emergency 3m Zero-Inertia) */}
      <button
        type="button"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onOpenPanic();
        }}
        className="min-h-[54px] flex items-center gap-2.5 p-2.5 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer active:scale-98 shadow-xs min-w-0"
        title={isAr ? 'كسر الجمود والتسويف (مهمة 3 دقائق آمنة)' : 'Break Inertia (3m safe task)'}
      >
        <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="text-start leading-tight min-w-0">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate block">
            {isAr ? 'كسر الجمود' : 'Break Inertia'}
          </span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate block">
            {isAr ? '٣ دقائق آمنة' : '3m Safe Start'}
          </span>
        </div>
      </button>

      {/* 4. Weekly Barakah Harvest Report Button */}
      <button
        type="button"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onOpenWeeklyReport();
        }}
        className="min-h-[54px] flex items-center gap-2.5 p-2.5 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer active:scale-98 shadow-xs min-w-0"
        title={isAr ? 'عرض تقرير حصاد البركة الأسبوعي' : 'Weekly Barakah Harvest Report'}
      >
        <div className="w-8 h-8 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <Award className="w-4 h-4" />
        </div>
        <div className="text-start leading-tight min-w-0">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate block">
            {isAr ? 'حصاد الأسبوع' : 'Weekly Report'}
          </span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate block">
            {isAr ? 'مؤشر البركة' : 'Barakah Index'}
          </span>
        </div>
      </button>
    </div>
  );
};

