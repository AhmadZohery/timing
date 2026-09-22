import React from 'react';
import { X, Sparkles, Check, Palette } from 'lucide-react';
import type { ThemePaletteId } from '../../types';
import { useTheme, PALETTE_CONFIGS } from '../../context/ThemeContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface ThemePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardToast?: (msg: string) => void;
}

export const ThemePaletteModal: React.FC<ThemePaletteModalProps> = ({
  isOpen,
  onClose,
  onRewardToast,
}) => {
  const { palette, setPalette } = useTheme();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const handleSelect = (pId: ThemePaletteId) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setPalette(pId);

    if (onRewardToast) {
      const conf = PALETTE_CONFIGS[pId];
      onRewardToast(
        isAr
          ? `🎨 تم تفعيل طراز: ${conf.nameAr}`
          : `🎨 Switched to ${conf.nameEn}`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-xl flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 shrink-0 bg-gradient-to-r from-amber-50/50 via-transparent to-purple-50/30 dark:from-amber-950/20 dark:to-purple-950/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? 'طراز التصميم والباليت الفنية' : 'Boutique Theme Palette'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                  {isAr ? 'تصميم بشري فاخر' : 'De-AI Craft'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'اختر الطابع اللوني الفخم الذي يمنحك الراحة والتركيز التام.'
                  : 'Select an artisanal luxury palette tailored for deep visual comfort.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Palettes Grid */}
        <div className="p-4 sm:p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          {(
            [
              'obsidian_gold',
              'damascus_sand',
              'cosmic_titanium',
              'nordic_slate',
            ] as ThemePaletteId[]
          ).map((pId) => {
            const conf = PALETTE_CONFIGS[pId];
            const isSelected = palette === pId;

            return (
              <button
                key={pId}
                type="button"
                onClick={() => handleSelect(pId)}
                className={`w-full p-4 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                    : 'bg-slate-50/70 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Swatch circle */}
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${conf.bgPreview} border border-white/20 shadow-inner flex items-center justify-center shrink-0`}
                    style={{ borderColor: conf.primaryColor }}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs"
                      style={{ backgroundColor: conf.primaryColor }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-sm text-slate-900 dark:text-zinc-100">
                        {isAr ? conf.nameAr : conf.nameEn}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/80 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300">
                        {conf.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      {conf.descAr}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full border border-slate-300 dark:border-zinc-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 shrink-0 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'تُحفظ الإعدادات تلقائياً محلياً' : 'Saved instantly to device'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold transition-all hover:opacity-90 cursor-pointer"
          >
            {isAr ? 'تم، إغلاق' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
