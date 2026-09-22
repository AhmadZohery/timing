import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Compass,
  Edit3,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import type {
  StationId,
  LifestylePersonaId,
  StationCustomOverride,
  UserState,
} from '../../types';
import { db } from '../../db/db';
import { LIFESTYLE_PERSONAS, resolveStationMetadata } from '../../utils/lifestyleEngine';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface LifestyleStationCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState?: UserState;
  onRewardToast?: (msg: string) => void;
}

const PRIMARY_STATIONS: StationId[] = [
  'COMMUTE_MORNING',
  'WORK_MICRO_SPRINT',
  'GYM_ANCHOR',
  'EVENING_SPRINT',
  'RETROSPECTIVE_CHECKIN',
  'GRAND_REWARD_STATE',
];

export const LifestyleStationCustomizerModal: React.FC<LifestyleStationCustomizerModalProps> = ({
  isOpen,
  onClose,
  userState,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const currentPersona = userState?.settings?.lifestylePersona || 'builder_exec';
  const currentOverrides = userState?.settings?.stationCustomOverrides || {};

  const [selectedPersona, setSelectedPersona] = useState<LifestylePersonaId>(currentPersona);
  const [overrides, setOverrides] = useState<Partial<Record<StationId, StationCustomOverride>>>(currentOverrides);
  const [editingStation, setEditingStation] = useState<StationId | null>(null);

  // Form edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editShortLabel, setEditShortLabel] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');

  if (!isOpen) return null;

  const handleSelectPersona = (pId: LifestylePersonaId) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedPersona(pId);
  };

  const handleStartEditStation = (stId: StationId) => {
    soundSynth.playTactileClick();
    const meta = resolveStationMetadata(stId, selectedPersona, overrides, isAr);
    setEditingStation(stId);
    setEditTitle(meta.titleAr);
    setEditShortLabel(meta.shortLabelAr);
    setEditSubtitle(meta.shortTime);
  };

  const handleSaveStationEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;

    soundSynth.playTactileClick();
    haptic.vibrateLight();

    setOverrides({
      ...overrides,
      [editingStation]: {
        customTitle: editTitle.trim(),
        customShortLabel: editShortLabel.trim(),
        customSubtitle: editSubtitle.trim(),
      },
    });

    setEditingStation(null);
  };

  const handleResetOverrides = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setOverrides({});
  };

  const handleSaveAll = async () => {
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();

    if (userState?.id) {
      await db.user_state.update(userState.id, {
        settings: {
          ...userState.settings,
          lifestylePersona: selectedPersona,
          stationCustomOverrides: overrides,
        },
      });
    }

    if (onRewardToast) {
      const persona = LIFESTYLE_PERSONAS[selectedPersona];
      onRewardToast(
        isAr
          ? `✨ تم تفعيل نمط: ${persona.titleAr} وتحديث مصفوفة محطاتك اليومية!`
          : `✨ Activated ${persona.titleEn} lifestyle routine!`
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
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 shrink-0 bg-gradient-to-r from-sky-50/50 via-transparent to-indigo-50/30 dark:from-sky-950/20 dark:to-indigo-950/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-600/30 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? 'نمط الحياة وتخصيص محطات اليوم' : 'Lifestyle Flow & Station Blueprint'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-[10px] font-bold">
                  {isAr ? 'يناسب جميع الحالات' : 'All Lifestyles'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'سواء كنت طالباً، باحثاً، مستقلاً، أو تُنظم شؤون بيتك بلا وظيفة رسمية؛ النظام يتكيف معك بالكامل.'
                  : 'Tailor your daily flow whether you are a student, freelancer, homemaker, or builder.'}
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Lifestyle Personas Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono block">
              {isAr ? '1. اختر نمط حياتك الأساسي:' : '1. Select Your Lifestyle Persona:'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(
                [
                  'builder_exec',
                  'academic_student',
                  'sharia_seeker',
                  'freelancer_creator',
                  'flexible_home',
                  'custom',
                ] as LifestylePersonaId[]
              ).map((pId) => {
                const persona = LIFESTYLE_PERSONAS[pId];
                const isSelected = selectedPersona === pId;

                return (
                  <button
                    key={pId}
                    type="button"
                    onClick={() => handleSelectPersona(pId)}
                    className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500 text-slate-900 dark:text-zinc-100 shadow-md ring-2 ring-sky-500/20'
                        : 'bg-slate-50/70 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span className="text-base">{persona.avatarEmoji}</span>
                          <span>{isAr ? persona.titleAr : persona.titleEn}</span>
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/80 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 mb-1.5">
                        {persona.badge}
                      </span>

                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                        {isAr ? persona.subtitleAr : persona.subtitleEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Station Blueprint Preview & Custom Overrides */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono block">
                  {isAr ? '2. محطات يومك وفق هذا النمط (يمكنك تخصيص وتعديل أي محطة):' : '2. Your Daily Stations (Click to customize any title):'}
                </label>
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'اضغط على زر القلم بجانب أي محطة لتغيير اسمها بما يلائمك.' : 'Click edit to rename any station.'}
                </span>
              </div>

              {Object.keys(overrides).length > 0 && (
                <button
                  type="button"
                  onClick={handleResetOverrides}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 text-[10px] font-bold cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isAr ? 'استعادة الافتراضي' : 'Reset Custom'}</span>
                </button>
              )}
            </div>

            {/* Stations List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRIMARY_STATIONS.map((stId, index) => {
                const meta = resolveStationMetadata(stId, selectedPersona, overrides, isAr);
                const Icon = meta.icon;
                const isOverridden = Boolean(overrides[stId]);

                return (
                  <div
                    key={stId}
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 transition-all ${
                      isOverridden
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                        : 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">#{index + 1}</span>
                          <span className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {meta.titleAr}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          [{meta.shortLabelAr}] • {meta.shortTime}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartEditStation(stId)}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
                      title={isAr ? 'تعديل اسم المحطة' : 'Edit station name'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Inline Station Edit Modal / Box */}
            {editingStation && (
              <form
                onSubmit={handleSaveStationEdit}
                className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 shadow-lg space-y-3 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <span>{isAr ? 'تخصيص بيانات المحطة يدوياً:' : 'Customize Station Name:'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingStation(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 block mb-1">
                      {isAr ? 'الاسم الكامل للمحطة:' : 'Full Station Title:'}
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 block mb-1">
                      {isAr ? 'الاسم المختصر (لشريط الموبايل):' : 'Short Mobile Label:'}
                    </label>
                    <input
                      type="text"
                      value={editShortLabel}
                      onChange={(e) => setEditShortLabel(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 block mb-1">
                      {isAr ? 'التوقيت أو الوصف الفرعي:' : 'Subtitle / Timing:'}
                    </label>
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={(e) => setEditSubtitle(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingStation(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {isAr ? 'تطبيق التعديل ✔' : 'Apply'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 shrink-0 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>{isAr ? 'تنعكس التسميات فوراً على كامل التطبيق' : 'Instantly updates your navigation'}</span>
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
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'اعتماد وحفظ النمط' : 'Apply Persona'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
