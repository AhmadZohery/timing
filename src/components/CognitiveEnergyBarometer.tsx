import React from 'react';
import { BatteryMedium, BatteryCharging, BatteryWarning, HeartPulse } from 'lucide-react';
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
  const { t } = useTranslation();

  const handleSelect = (level: EnergyLevel) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onSelectLevel(level);
  };

  return (
    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2.5 shadow-xs transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-zinc-200">
          <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t('energy_title')}</span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">Dynamic Pacing</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* High 100% */}
        <button
          onClick={() => handleSelect('high')}
          className={`p-2.5 rounded-lg border text-start transition-all cursor-pointer flex flex-col justify-between ${
            currentLevel === 'high'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
              : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold">{t('energy_high')}</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1">{t('energy_high_desc')}</span>
        </button>

        {/* Medium 60% */}
        <button
          onClick={() => handleSelect('medium')}
          className={`p-2.5 rounded-lg border text-start transition-all cursor-pointer flex flex-col justify-between ${
            currentLevel === 'medium'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/50 text-amber-800 dark:text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
              : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold">{t('energy_medium')}</span>
            <BatteryMedium className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1">{t('energy_medium_desc')}</span>
        </button>

        {/* Low / Recovery 20% */}
        <button
          onClick={() => handleSelect('low')}
          className={`p-2.5 rounded-lg border text-start transition-all cursor-pointer flex flex-col justify-between ${
            currentLevel === 'low'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-500/50 text-rose-800 dark:text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
              : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold">{t('energy_low')}</span>
            <BatteryWarning className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1">{t('energy_low_desc')}</span>
        </button>
      </div>

      {currentLevel === 'medium' && (
        <p className="text-[11px] text-amber-800 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800/40">
          {t('energy_medium_note')}
        </p>
      )}

      {currentLevel === 'low' && (
        <p className="text-[11px] text-rose-800 dark:text-rose-300/90 bg-rose-50 dark:bg-rose-950/20 p-2 rounded border border-rose-200 dark:border-rose-800/40">
          {t('energy_low_note')}
        </p>
      )}
    </div>
  );
};
