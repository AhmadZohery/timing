import React, { useState } from 'react';
import { X, Dumbbell, Check } from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface WarmupPyramidModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName?: string;
  onApplyWarmupSets?: (sets: Array<{ weight: number; reps: number; done: boolean }>) => void;
}

export const WarmupPyramidModal: React.FC<WarmupPyramidModalProps> = ({
  isOpen,
  onClose,
  exerciseName = 'Bench Press',
  onApplyWarmupSets,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [targetWeight, setTargetWeight] = useState(80);
  const [barWeight, setBarWeight] = useState(20);

  const [activeTab, setActiveTab] = useState<'pyramid' | 'one_rm'>('pyramid');
  const [liftWeight, setLiftWeight] = useState(70);
  const [liftReps, setLiftReps] = useState(8);

  // Dual Biomechanical 1RM Algorithm (Brzycki for reps <= 8, Wathan for reps > 8)
  const safeReps = Math.max(1, Math.min(30, liftReps));
  const isBrzyckiMethod = safeReps <= 8;
  const estimated1RM = isBrzyckiMethod
    ? Math.round(liftWeight * (36 / (37 - safeReps)))
    : Math.round((100 * liftWeight) / (48.8 + 53.8 * Math.exp(-0.075 * safeReps)));

  if (!isOpen) return null;

  // Round weight to nearest 2.5 kg
  const roundTo2_5 = (val: number) => Math.max(barWeight, Math.round(val / 2.5) * 2.5);

  // Plate calculation per side (using 20, 15, 10, 5, 2.5, 1.25 kg plates)
  const calculatePlatesPerSide = (totalWeight: number) => {
    let weightPerSide = (totalWeight - barWeight) / 2;
    if (weightPerSide <= 0) return isAr ? 'البار فارغ' : 'Empty Bar';

    const plateTypes = [20, 15, 10, 5, 2.5, 1.25];
    const platesUsed: string[] = [];

    for (const p of plateTypes) {
      while (weightPerSide >= p) {
        platesUsed.push(`${p}k`);
        weightPerSide -= p;
      }
    }

    return platesUsed.join(' + ') || (isAr ? 'بدون أوزان' : 'No Plates');
  };

  const pyramidSets = [
    {
      labelAr: 'البار فارغ (تليين المفاصل)',
      labelEn: 'Empty Bar (Mobility & Flow)',
      percentage: 0,
      weight: barWeight,
      reps: 10,
      purposeAr: 'تدفق الدم وتزييت المفاصل دون أي إجهاد',
    },
    {
      labelAr: 'الإحماء الأول (تفعيل العصبي)',
      labelEn: 'Warmup 1 (Activation)',
      percentage: 40,
      weight: roundTo2_5(targetWeight * 0.4),
      reps: 5,
      purposeAr: 'إيقاظ الجهاز العصبي المركزي ومسار الحركة',
    },
    {
      labelAr: 'الإحماء الثاني (بناء الثقة)',
      labelEn: 'Warmup 2 (Grooving)',
      percentage: 60,
      weight: roundTo2_5(targetWeight * 0.6),
      reps: 3,
      purposeAr: 'تثبيت مسار البار وسرعة الدفع',
    },
    {
      labelAr: 'المعاينة الثقيلة (Potentiation)',
      labelEn: 'Heavy Primer (Potentiation)',
      percentage: 80,
      weight: roundTo2_5(targetWeight * 0.8),
      reps: 1,
      purposeAr: 'تهيئة الألياف الثقيلة مع توفير 100% من الطاقة للجولة الأساسية',
    },
    {
      labelAr: 'الجولة الأساسية (Work Set)',
      labelEn: 'Target Work Set',
      percentage: 100,
      weight: targetWeight,
      reps: 6,
      purposeAr: 'البناء العضلي والقوة الفائقة',
    },
  ];

  const handleApply = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (onApplyWarmupSets) {
      const generated = pyramidSets.map((s) => ({
        weight: s.weight,
        reps: s.reps,
        done: false,
      }));
      onApplyWarmupSets(generated);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {isAr ? 'حاسبة أوزان الإحماء والقوة القصوى' : 'Warmup & 1RM Calculator'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-xs">
                {exerciseName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              onClose();
            }}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-2 bg-slate-100 dark:bg-zinc-950/80 border-b border-slate-200/80 dark:border-zinc-800 flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('pyramid');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pyramid'
                ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            {isAr ? 'هرم الإحماء العصبي' : 'Warmup Pyramid'}
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('one_rm');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'one_rm'
                ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            {isAr ? 'حاسبة 1RM المزدوجة الآمنة' : 'Dual 1RM Calculator'}
          </button>
        </div>

        {/* Inputs Bar */}
        {activeTab === 'pyramid' ? (
          <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 border-b border-slate-100 dark:border-zinc-800 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block mb-1">
                {isAr ? 'الوزن المستهدف للجولة (كجم):' : 'Target Work Weight (kg):'}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="20"
                  max="400"
                  step="2.5"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(Number(e.target.value))}
                  className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-mono font-black text-slate-900 dark:text-white"
                />
                <span className="text-xs font-mono font-bold text-slate-500">kg</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block mb-1">
                {isAr ? 'وزن البار فقط (كجم):' : 'Barbell Weight (kg):'}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="2.5"
                  value={barWeight}
                  onChange={(e) => setBarWeight(Number(e.target.value))}
                  className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-mono font-black text-slate-900 dark:text-white"
                />
                <span className="text-xs font-mono font-bold text-slate-500">kg</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 border-b border-slate-100 dark:border-zinc-800 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block mb-1">
                  {isAr ? 'الوزن المرفوع (كجم):' : 'Weight Lifted (kg):'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="450"
                  step="2.5"
                  value={liftWeight}
                  onChange={(e) => setLiftWeight(Number(e.target.value))}
                  className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-mono font-black text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block mb-1">
                  {isAr ? 'عدد التكرارات المنجزة:' : 'Reps Completed:'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={liftReps}
                  onChange={(e) => setLiftReps(Number(e.target.value))}
                  className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-mono font-black text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-orange-700 dark:text-orange-400">
                    {isAr ? 'أقصى وزن تقديري آمن (1RM):' : 'Estimated 1RM:'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-200 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 font-bold">
                    {isBrzyckiMethod ? 'Brzycki (قوة عصبية)' : 'Wathan (أمان الفقرات)'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 pt-0.5">
                  {isBrzyckiMethod
                    ? isAr
                      ? 'تكرارات منخفضة دقيقة جداً للقوة القصوى'
                      : 'High neuromuscular accuracy for heavy sets'
                    : isAr
                      ? 'معادلة أسية تمنع تضخيم الوزن وتحمي المفاصل وأسفل الظهر'
                      : 'Exponential formula protecting lower back & tendons'}
                </p>
              </div>

              <div className="text-end">
                <span className="text-xl font-mono font-black text-orange-600 dark:text-orange-400">
                  {estimated1RM} <span className="text-xs font-normal">kg</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setTargetWeight(Math.round(estimated1RM * 0.8));
                setActiveTab('pyramid');
              }}
              className="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer transition-transform active:scale-95"
            >
              {isAr ? '← نقل 80% (كوزن عمل أساسي) إلى هرم الإحماء' : '← Set 80% as Target in Pyramid'}
            </button>
          </div>
        )}

        {/* Content Area: Pyramid Sets List or 1RM Percentages */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          {activeTab === 'pyramid' ? (
            pyramidSets.map((s, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  s.percentage === 100
                    ? 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800/50'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                      s.percentage === 100
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {isAr ? s.labelAr : s.labelEn}
                      </span>
                      {s.percentage > 0 && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500">
                          {s.percentage}%
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                      {isAr ? `لكل جانب: ${calculatePlatesPerSide(s.weight)}` : `Per side: ${calculatePlatesPerSide(s.weight)}`}
                    </span>
                  </div>
                </div>

                <div className="text-end shrink-0">
                  <span className="text-base font-mono font-black text-slate-900 dark:text-white block">
                    {s.weight} <span className="text-xs font-normal text-slate-500">kg</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-orange-600 dark:text-orange-400">
                    {s.reps} {isAr ? 'تكرارات' : 'reps'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 px-1">
                {isAr ? 'مستويات الشدة وتوزيع التكرارات الموصى بها:' : 'Intensity Zones & Recommended Reps:'}
              </div>
              {[
                { pct: 95, reps: '1 - 2', labelAr: 'قوة قصوى عصبية (Peak Max)', color: 'text-rose-600 dark:text-rose-400' },
                { pct: 90, reps: '3 - 4', labelAr: 'قوة ثقيلة جداً (Heavy Strength)', color: 'text-orange-600 dark:text-orange-400' },
                { pct: 85, reps: '5 - 6', labelAr: 'بناء القوة والحجم (Power-Building)', color: 'text-amber-600 dark:text-amber-400' },
                { pct: 80, reps: '7 - 8', labelAr: 'الحجم العضلي الأمثل (Hypertrophy Anchor)', color: 'text-emerald-600 dark:text-emerald-400' },
                { pct: 75, reps: '9 - 10', labelAr: 'تحمل عضلي وقوة (Strength Endurance)', color: 'text-teal-600 dark:text-teal-400' },
                { pct: 70, reps: '11 - 12', labelAr: 'حجم عالي وتكثيف (High Volume)', color: 'text-blue-600 dark:text-blue-400' },
                { pct: 60, reps: '15+', labelAr: 'سرعة وضخ وتخفيف (Speed / Deload)', color: 'text-indigo-600 dark:text-indigo-400' },
              ].map((zone, zIdx) => {
                const zoneWeight = roundTo2_5(estimated1RM * (zone.pct / 100));
                return (
                  <div
                    key={zIdx}
                    className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-orange-400 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-center font-mono font-black text-xs px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                        {zone.pct}%
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {zone.labelAr}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {zone.reps} {isAr ? 'تكرارات' : 'reps'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-base font-mono font-black ${zone.color}`}>
                        {zoneWeight} <span className="text-xs font-normal text-slate-500">kg</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          setTargetWeight(zoneWeight);
                          setActiveTab('pyramid');
                        }}
                        className="py-1 px-2.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 hover:bg-orange-600 hover:text-white text-orange-700 dark:text-orange-300 font-bold text-[10px] transition-all cursor-pointer"
                      >
                        {isAr ? 'تطبيق' : 'Use'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-zinc-950/60">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>

          {onApplyWarmupSets && (
            <button
              type="button"
              onClick={handleApply}
              className="py-2.5 px-5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'تطبيق الجولات في التمرين' : 'Apply Sets to Workout'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
