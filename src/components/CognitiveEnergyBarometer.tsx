import React from 'react';
import { BatteryCharging, BatteryMedium, BatteryWarning, Zap, Lightbulb, ShieldAlert } from 'lucide-react';
import type { EnergyLevel } from '../types';
import { soundSynth } from '../services/soundSynthesizer';
import { haptic } from '../services/vibrationService';
import { useTranslation } from '../i18n/LanguageContext';

interface CognitiveEnergyBarometerProps {
  currentLevel: EnergyLevel;
  onSelectLevel: (level: EnergyLevel) => void;
}

export const CognitiveEnergyBarometer: React.FC<CognitiveEnergyBarometerProps> = ({
  currentLevel,
  onSelectLevel,
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const handleSelect = (level: EnergyLevel) => {
    soundSynth.playTactileClick();
    if (level === 'high') {
      haptic.vibrateSprintCelebration();
    } else {
      haptic.vibrateLight();
    }
    onSelectLevel(level);
  };

  const LEVELS: Array<{
    id: EnergyLevel;
    title: string;
    sub: string;
    percent: string;
    icon: typeof BatteryCharging;
    activeClass: string;
    activeText: string;
    barColor: string;
  }> = [
    {
      id: 'high',
      title: t('energy_high'),
      sub: t('energy_high_desc'),
      percent: '100%',
      icon: BatteryCharging,
      activeClass: 'bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/25',
      activeText: 'text-emerald-700 dark:text-emerald-400',
      barColor: 'bg-emerald-500',
    },
    {
      id: 'medium',
      title: t('energy_medium'),
      sub: t('energy_medium_desc'),
      percent: '60%',
      icon: BatteryMedium,
      activeClass: 'bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/25',
      activeText: 'text-amber-700 dark:text-amber-400',
      barColor: 'bg-amber-500',
    },
    {
      id: 'low',
      title: t('energy_low'),
      sub: t('energy_low_desc'),
      percent: '20%',
      icon: BatteryWarning,
      activeClass: 'bg-rose-500/15 border-rose-500 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/25',
      activeText: 'text-rose-700 dark:text-rose-400',
      barColor: 'bg-rose-500',
    },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#12131A] border border-slate-200/90 dark:border-white/[0.08] space-y-4 shadow-sm transition-all">
      {/* Barometer Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-zinc-100">
              {t('energy_title')}
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
              {isAr ? 'معايرة الحمل الإدراكي ومستوى الجاهزية' : 'Cognitive Pacing & Readiness'}
            </span>
          </div>
        </div>

        {/* Dynamic Multi-Cell Gauge */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10">
          <span className={`w-3.5 h-2 rounded-xs transition-colors ${currentLevel === 'low' ? 'bg-rose-500' : currentLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span className={`w-3.5 h-2 rounded-xs transition-colors ${currentLevel === 'medium' ? 'bg-amber-500' : currentLevel === 'high' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'}`} />
          <span className={`w-3.5 h-2 rounded-xs transition-colors ${currentLevel === 'high' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'}`} />
        </div>
      </div>

      {/* 3 Selectors with Tap Physics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {LEVELS.map((lvl) => {
          const Icon = lvl.icon;
          const isSelected = currentLevel === lvl.id;

          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => handleSelect(lvl.id)}
              className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between space-y-2 tap-spring active:scale-95 ${
                isSelected
                  ? lvl.activeClass
                  : 'bg-slate-50/80 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black">{lvl.title}</span>
                <span className={`text-[11px] font-mono font-bold ${isSelected ? lvl.activeText : 'text-slate-500'}`}>
                  {lvl.percent}
                </span>
              </div>
              <div className="flex items-center justify-between w-full pt-1">
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium line-clamp-1">
                  {lvl.sub}
                </p>
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? lvl.activeText : 'text-slate-400'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Recommendation Card with Smooth Rounded-2xl Styling */}
      {currentLevel === 'medium' && (
        <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs font-medium leading-relaxed animate-fade-in flex items-center gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{t('energy_medium_note')}</span>
        </div>
      )}

      {currentLevel === 'low' && (
        <div className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/30 text-rose-950 dark:text-rose-200 text-xs font-medium leading-relaxed animate-fade-in flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{t('energy_low_note')}</span>
        </div>
      )}
    </div>
  );
};
