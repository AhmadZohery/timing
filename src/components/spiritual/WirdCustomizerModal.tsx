import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Check,
  Plus,
  Trash2,
  BookmarkCheck,
  Flame,
} from 'lucide-react';
import type {
  SpiritualPresetId,
  SpiritualWirdConfig,
  SpiritualWirdItem,
  UserState,
} from '../../types';
import { db } from '../../db/db';
import { SPIRITUAL_WIRD_PRESETS } from '../../utils/spiritualWirdEngine';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface WirdCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState?: UserState;
  onRewardToast?: (msg: string) => void;
}

export const WirdCustomizerModal: React.FC<WirdCustomizerModalProps> = ({
  isOpen,
  onClose,
  userState,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const existingConfig = userState?.settings?.spiritualWirdConfig;
  const [selectedPreset, setSelectedPreset] = useState<SpiritualPresetId>(
    existingConfig?.activePreset || 'baqarah_only'
  );

  // Custom wirds list if in custom mode
  const [customWirds, setCustomWirds] = useState<SpiritualWirdItem[]>(
    existingConfig?.customWirds && existingConfig.customWirds.length > 0
      ? existingConfig.customWirds
      : [
          {
            id: `wird_${Date.now()}_1`,
            name: isAr ? 'سورة البقرة' : 'Surah Al-Baqarah',
            type: 'surah',
            targetPages: 48,
            pointsReward: 35,
            recommendedTime: 'fajr',
          },
        ]
  );

  // New wird form fields
  const [newWirdName, setNewWirdName] = useState('');
  const [newWirdPages, setNewWirdPages] = useState(20);
  const [newWirdPoints, setNewWirdPoints] = useState(25);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: SpiritualPresetId) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedPreset(presetId);
  };

  const handleAddCustomWird = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWirdName.trim()) return;

    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const newWird: SpiritualWirdItem = {
      id: `wird_${Date.now()}`,
      name: newWirdName.trim(),
      type: 'custom',
      targetPages: Math.max(1, newWirdPages),
      pointsReward: Math.max(5, newWirdPoints),
      recommendedTime: 'fajr',
    };

    setCustomWirds([...customWirds, newWird]);
    setNewWirdName('');
    setNewWirdPages(20);
    setNewWirdPoints(25);
  };

  const handleDeleteCustomWird = (id: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setCustomWirds(customWirds.filter((w) => w.id !== id));
  };

  const handleSave = async () => {
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();

    const config: SpiritualWirdConfig = {
      activePreset: selectedPreset,
      customWirds: selectedPreset === 'custom' ? customWirds : [],
    };

    if (userState?.id) {
      await db.user_state.update(userState.id, {
        settings: {
          ...userState.settings,
          spiritualWirdConfig: config,
        },
      });
    }

    if (onRewardToast) {
      const presetInfo = SPIRITUAL_WIRD_PRESETS[selectedPreset];
      onRewardToast(
        isAr
          ? `✨ تم اعتماد ورد ${presetInfo.titleAr} بنجاح! بارك الله في وقتك.`
          : `✨ Spiritual Wird updated to ${presetInfo.titleEn}!`
      );
    }

    onClose();
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
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 shrink-0 bg-gradient-to-r from-emerald-50/50 via-transparent to-amber-50/30 dark:from-emerald-950/20 dark:to-amber-950/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? 'تخصيص الورد القرآني والروحي' : 'Custom Spiritual & Quran Wird'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                  {isAr ? 'مرونة مطلقة' : 'Flexible'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'اختر باقة الورد التي تناسب همتك ويومك (الزهراوان، البقرة، أو ورد مخصص).'
                  : 'Select your preferred Quran recitation routine or craft your own bespoke wird.'}
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

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Presets Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono block">
              {isAr ? 'اختر نظام الورد المعتمد لديك:' : 'Choose Your Active Routine:'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  'baqarah_only',
                  'imran_only',
                  'daily_juz',
                  'surahs_mounjiyat',
                  'al_zahrawayn',
                  'custom',
                ] as SpiritualPresetId[]
              ).map((presetId) => {
                const preset = SPIRITUAL_WIRD_PRESETS[presetId];
                const isSelected = selectedPreset === presetId;
                const totalPages = preset.wirds.reduce((acc, w) => acc + w.targetPages, 0);

                return (
                  <button
                    key={presetId}
                    type="button"
                    onClick={() => handleSelectPreset(presetId)}
                    className={`relative p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-zinc-100 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-slate-50/70 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-slate-900 dark:text-zinc-100">
                          {isAr ? preset.titleAr : preset.titleEn}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          {preset.badge}
                        </span>
                        {totalPages > 0 && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                            {totalPages} {isAr ? 'صفحة/يوم' : 'pages/day'}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {isAr ? preset.descriptionAr : preset.descriptionEn}
                      </p>
                    </div>

                    {preset.hadithAr && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-zinc-700/50 text-[10px] text-emerald-800 dark:text-emerald-300 font-medium italic">
                        {preset.hadithAr}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Preset Breakdown / Custom Wird Builder */}
          {selectedPreset === 'custom' ? (
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>{isAr ? 'قائمتك القرآنية المخصصة:' : 'Your Custom Wird Items:'}</span>
                </div>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                  {customWirds.length} {isAr ? 'أوراد مضافة' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {customWirds.map((wird) => (
                  <div
                    key={wird.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-800 dark:text-zinc-100">{wird.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({wird.targetPages} {isAr ? 'صفحة' : 'pages'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                        +{wird.pointsReward} XP
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomWird(wird.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title={isAr ? 'حذف الورد' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Wird Inline Form */}
              <form onSubmit={handleAddCustomWird} className="pt-2 border-t border-amber-200/80 dark:border-amber-800/40 space-y-2">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block">
                  {isAr ? 'إضافة سورة أو ورد جديد:' : 'Add New Surah or Portion:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <input
                    type="text"
                    value={newWirdName}
                    onChange={(e) => setNewWirdName(e.target.value)}
                    placeholder={isAr ? 'اسم السورة أو الورد (مثال: سورة الكهف)' : 'Wird name'}
                    className="sm:col-span-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:outline-emerald-500 text-slate-900 dark:text-zinc-100"
                    required
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={604}
                      value={newWirdPages}
                      onChange={(e) => setNewWirdPages(Number(e.target.value))}
                      placeholder={isAr ? 'الصفحات' : 'Pages'}
                      className="w-full p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:outline-emerald-500 text-slate-900 dark:text-zinc-100 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 shrink-0">{isAr ? 'صفحة' : 'p'}</span>
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة الورد' : 'Add'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Preset Details Card
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300 font-bold">
                <span>{isAr ? 'الأوراد المشمولة في هذه الباقة:' : 'Included in this routine:'}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {SPIRITUAL_WIRD_PRESETS[selectedPreset].wirds.length} {isAr ? 'أوراد' : 'portions'}
                </span>
              </div>

              <div className="space-y-1.5">
                {SPIRITUAL_WIRD_PRESETS[selectedPreset].wirds.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-800 dark:text-zinc-100">{w.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({w.targetPages} {isAr ? 'صفحة' : 'pages'})
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                      +{w.pointsReward} {isAr ? 'نقطة بركة' : 'pts'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 shrink-0 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{isAr ? 'يحفظ الورد استمراريتك وشعلتك' : 'Saves your streak & momentum'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-300 transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'اعتماد وحفظ الورد' : 'Save Routine'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
