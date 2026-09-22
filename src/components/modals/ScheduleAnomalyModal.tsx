import React, { useState } from 'react';
import { X, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import {
  scheduleService,
  ANOMALY_REASONS,
  type ScheduleAnomalyRecord,
} from '../../services/scheduleService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface ScheduleAnomalyModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedSport?: string;
  actualAction?: string;
  onLogged?: (record: ScheduleAnomalyRecord) => void;
}

export const ScheduleAnomalyModal: React.FC<ScheduleAnomalyModalProps> = ({
  isOpen,
  onClose,
  expectedSport = 'gym',
  actualAction = 'rest',
  onLogged,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const eligibleDates = scheduleService.getEligibleGraceDates();
  const [selectedDate, setSelectedDate] = useState(eligibleDates[0]?.dateStr || new Date().toISOString().split('T')[0]);
  const [selectedReason, setSelectedReason] = useState<typeof ANOMALY_REASONS[number]['id']>('travel');
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();

    const reasonObj = ANOMALY_REASONS.find((r) => r.id === selectedReason) || ANOMALY_REASONS[0];

    const record = scheduleService.logScheduleAnomaly({
      date: selectedDate,
      expectedSport,
      actualSportOrAction: actualAction,
      reason: selectedReason,
      reasonLabelAr: isAr ? reasonObj.labelAr : reasonObj.labelEn,
      customNote: customNote.trim() || undefined,
    });

    if (onLogged) {
      onLogged(record);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-white dark:via-zinc-900 to-white dark:to-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {isAr ? 'حماية الشعلة وتوثيق الظرف 🛡️' : 'Streak Shield & Anomaly Logger'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isAr ? 'مرونة تامة دون أي عقوبات أو تأنيب ضمير' : '100% flexible, zero guilt, zero streak penalty'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>{isAr ? 'مرونة الجدول واستدراك الـ 48 ساعة:' : '48-Hour Grace Period & Routine Shield:'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 ps-5 leading-relaxed">
              {isAr
                ? `تتيح لك المنظومة توثيق أي ظرف طارئ حالي أو استدراكه بأثر رجعي خلال 48 ساعة لحماية شعلتك بنسبة 100% دون أي عقوبة.`
                : `Log current or past circumstances within 48h to shield your streak 100% with zero penalty.`}
            </p>
          </div>

          {/* 48-Hour Retroactive Grace Period Date Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
              <span>{isAr ? 'تاريخ اليوم المراد حمايته:' : 'Select Day to Shield:'}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                {isAr ? 'درع الـ 48 ساعة 🛡️' : '48h Grace 🛡️'}
              </span>
            </label>

            <div className="grid grid-cols-3 gap-1.5">
              {eligibleDates.map((d) => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setSelectedDate(d.dateStr);
                  }}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    selectedDate === d.dateStr
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                      : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-emerald-400'
                  }`}
                >
                  <span className="text-[11px] block truncate">{isAr ? d.labelAr : d.labelEn}</span>
                  <span className="text-[9px] font-mono opacity-80 block">{d.dateStr}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason Selection Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
              {isAr ? 'ما هو السبب أو الظرف الطارئ؟' : 'What is the reason or circumstance?'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ANOMALY_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.id;
                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setSelectedReason(reason.id);
                    }}
                    className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-2xs font-bold'
                        : 'bg-slate-50 dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-emerald-300'
                    }`}
                  >
                    <span className="text-base">{reason.icon}</span>
                    <span className="text-xs truncate">{isAr ? reason.labelAr : reason.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
              {isAr ? 'ملاحظة شخصية (اختياري):' : 'Personal Note (optional):'}
            </label>
            <input
              type="text"
              placeholder={isAr ? 'مثلاً: اجتماع عمل مسائي حتى وقت متأخر' : 'e.g. late evening work meeting'}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-zinc-950/60">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'توثيق وحماية الشعلة 100%' : 'Protect Streak & Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
