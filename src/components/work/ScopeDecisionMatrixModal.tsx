import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Zap,
  Sliders,
  Scale,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { db } from '../../db/db';

export interface ScopeDecisionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeferToBuffer?: (taskTitle: string, durationMin: number) => void;
  onRewardToast?: (msg: string) => void;
  todayDate?: string;
}

export const ScopeDecisionMatrixModal: React.FC<ScopeDecisionMatrixModalProps> = ({
  isOpen,
  onClose,
  onDeferToBuffer,
  onRewardToast,
  todayDate = new Date().toISOString().split('T')[0],
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [requestTitle, setRequestTitle] = useState('');
  const [stakeholder, setStakeholder] = useState('');

  // RICE + Barakah Parameters (1-10)
  const [impact, setImpact] = useState<number>(7);
  const [confidence, setConfidence] = useState<number>(8);
  const [effort, setEffort] = useState<number>(5); // 1 = trivial, 10 = huge architecture lift
  const [barakah, setBarakah] = useState<number>(9); // Values, Halal, ethical alignment

  const [copiedPushback, setCopiedPushback] = useState(false);

  // Compute Priority Score (0-100)
  const score = useMemo(() => {
    // Score = ((Impact * Confidence * Barakah) / (Effort * 10)) * 100 scaled
    const raw = (impact * confidence * barakah) / Math.max(1, effort);
    // Normalize to 0-100
    const normalized = Math.min(100, Math.max(5, Math.round((raw / 50.4) * 100)));
    return normalized;
  }, [impact, confidence, effort, barakah]);

  // Classification & Verdict
  const verdict = useMemo(() => {
    if (score >= 75) {
      return {
        level: 'P1',
        titleAr: '🟢 أولوية قصوى: اشحن فوراً (Must-Ship)',
        titleEn: '🟢 P1: Execute & Ship Immediately',
        descAr: 'الأثر والبركة مرتفعان جداً مقابل الجهد. هذه المبادرة تحرك المؤشر بجدارة.',
        descEn: 'High impact and alignment with reasonable lift. High leverage initiative.',
        badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        recommendation: 'accept',
      };
    }
    if (score >= 50) {
      return {
        level: 'P2',
        titleAr: '🟡 أولوية ثانية: أودعها في مخزن السبت (Buffer)',
        titleEn: '🟡 P2: Defer to Saturday Buffer',
        descAr: 'المهمة جيدة ولكن إدراجها الآن يهدد تركيز الشوط. أودعها في صمام الأمان.',
        descEn: 'Valuable but risks current sprint flow. Park in Saturday buffer safety valve.',
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
        recommendation: 'defer',
      };
    }
    if (score >= 30) {
      return {
        level: 'P3',
        titleAr: '🟠 أولوية متأخرة: اركن في ساحة الانتظار (Parking Lot)',
        titleEn: '🟠 P3: Park in Backlog Parking Lot',
        descAr: 'الجهد المطلوب يفوق الأثر المتوقع. اركنها لجلسة تنقيح المهام القادمة.',
        descEn: 'Effort outweighs immediate impact. Park for next sprint refinement.',
        badgeColor: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
        recommendation: 'park',
      };
    }
    return {
      level: 'P4',
      titleAr: '🔴 تمدد نطاق خطير: ارفض بدبلوماسية (Scope Creep)',
      titleEn: '🔴 P4: High Scope Creep Risk • Pushback',
      descAr: 'مستنزف للطاقة، قليل العائد، ومخاطرة بالمسار الحرج. استخدم الرد الدبلوماسي.',
      descEn: 'Resource sink with low leverage. Deliver diplomatic pushback to protect runway.',
      badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
      recommendation: 'reject',
    };
  }, [score]);

  // Diplomatic Pushback Script Generator
  const pushbackMessage = useMemo(() => {
    const sName = stakeholder.trim() || (isAr ? 'أخي الفاضل' : 'Team');
    const tTitle = requestTitle.trim() || (isAr ? 'هذا المطلب الإضافي' : 'this initiative');

    if (isAr) {
      return `أهلاً بك يا ${sName}،\nشاكر لك جداً طرح مقترح "${tTitle}". بعد مراجعة مصفوفة الأولويات والطاقة الاستيعابية للشوط الحالي، تبيّن أن إدراجه الآن سيشكل تمدداً للنطاق (Scope Creep) ويهدد المسار الحرج لمخرجاتنا الأساسية.\nحرصاً على أعلى معايير الجودة، نقترح حفظ الفكرة في قائمة الانتظار للمراجعة القادمة، أو مقايضتها بمهمة أخرى موازية.\nشاكر لتفهمك وحرصك على نجاح المشروع.`;
    }
    return `Hi ${sName},\nThanks for bringing up "${tTitle}". After evaluating our sprint bandwidth and critical path commitments, taking this on right now introduces an unacceptable delivery risk.\nTo maintain our engineering and quality standards, I propose we park this in the backlog for our upcoming refinement session, or evaluate an explicit trade-off against existing deliverables.\nAppreciate your understanding in keeping our sprint runway clear!`;
  }, [stakeholder, requestTitle, isAr]);

  const handleCopyPushback = () => {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();
    navigator.clipboard.writeText(pushbackMessage);
    setCopiedPushback(true);
    setTimeout(() => setCopiedPushback(false), 2500);
    if (onRewardToast) {
      onRewardToast(
        isAr ? '📋 تم نسخ صيغة الرفض الدبلوماسي بنجاح!' : '📋 Diplomatic pushback copied!'
      );
    }
  };

  const handleAddToSprint = async () => {
    if (!requestTitle.trim()) return;
    soundSynth.playCompletionChime();
    haptic.vibrateLight();

    try {
      await db.workday_tasks.add({
        id: `task_${Date.now()}`,
        date: todayDate,
        title: requestTitle.trim(),
        completed: false,
        priority: score >= 75 ? 'high' : 'medium',
        estimatedMinutes: effort * 15,
        actualMinutes: 0,
        taskRole: 'manager',
        notes: `RICE: ${score}/100 [${verdict.level}] | Stakeholder: ${stakeholder || 'Direct'}`,
      });

      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `✅ تم اعتماد وإدراج "${requestTitle}" في قائمة مهام اليوم!`
            : `✅ "${requestTitle}" added to today's sprint tasks!`
        );
      }
      onClose();
    } catch (_) {}
  };

  const handleDeferToBufferQueue = () => {
    if (!requestTitle.trim()) return;
    soundSynth.playCompletionChime();
    haptic.vibrateLight();
    if (onDeferToBuffer) {
      onDeferToBuffer(requestTitle.trim(), effort * 5);
    }
    if (onRewardToast) {
      onRewardToast(
        isAr
          ? `🛡️ تم إيداع "${requestTitle}" في مخزن السبت بنجاح!`
          : `🛡️ "${requestTitle}" safely deferred to Saturday Buffer!`
      );
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#12131F] border border-slate-200 dark:border-white/[0.09] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                  RICE + Barakah
                </span>
                <span className="text-xs text-slate-400 font-mono">Scope Creep Radar</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {isAr ? 'مصفوفة حماية النطاق والقرارات الإدارية' : 'Scope Creep Radar & Decision Matrix'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {/* Section 1: Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'عنوان المهمة أو المقترح الطارئ:' : 'Proposed Task / Request:'}
              </label>
              <input
                type="text"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: إضافة زر تصدير PDF إضافي قبل تسليم الشوط...'
                    : 'e.g. Add custom export to PDF before sprint release...'
                }
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'الجهة الطالبة (أصحاب المصلحة / المدير / العميل):' : 'Requested By (Stakeholder / Client):'}
              </label>
              <input
                type="text"
                value={stakeholder}
                onChange={(e) => setStakeholder(e.target.value)}
                placeholder={isAr ? 'مثال: مدير المنتج، العميل الفلاني...' : 'e.g. Lead Client, Product Owner...'}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 2: The 4 Sliders */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200 dark:border-white/[0.06] space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>{isAr ? 'معايير التقييم الذكي (وزن المؤشرات):' : 'Decision Weighting Sliders:'}</span>
            </h3>

            {/* Slider 1: Reach / Impact */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? '1. حجم الأثر والقيمة (Impact):' : '1. Impact & Leverage:'}
                </span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{impact} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={impact}
                onChange={(e) => setImpact(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Slider 2: Confidence */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? '2. وضوح الرؤية واليقين (Confidence):' : '2. Confidence & Clarity:'}
                </span>
                <span className="font-mono font-black text-sky-600 dark:text-sky-400">{confidence} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            {/* Slider 3: Effort / Complexity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? '3. الجهد والتكلفة الزمنية (Effort / Lift):' : '3. Effort / Time Cost:'}
                </span>
                <span className="font-mono font-black text-rose-600 dark:text-rose-400">{effort} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={effort}
                onChange={(e) => setEffort(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                {isAr ? '(1 = سهل وسريع جداً • 10 = تغيير معماري مستنزف)' : '(1 = trivial quick fix • 10 = massive refactor)'}
              </span>
            </div>

            {/* Slider 4: Barakah Multiplier */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? '4. معامل البركة والقيمة الأخلاقية (Barakah Index):' : '4. Barakah & Moral Value:'}</span>
                </span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">{barakah} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={barakah}
                onChange={(e) => setBarakah(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 3: Live Priority Score & Verdict Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/50 dark:from-indigo-950/30 dark:via-[#141527] dark:to-sky-950/20 border border-indigo-200/80 dark:border-indigo-500/20 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  {isAr ? 'نتيجة التحليل التنفيذي' : 'Executive Decision Score'}
                </span>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {isAr ? verdict.titleAr : verdict.titleEn}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-black/40 border border-indigo-200 dark:border-indigo-800/40 flex flex-col items-center justify-center shadow-xs">
                  <span className="text-xl font-mono font-black text-slate-900 dark:text-white">{score}</span>
                  <span className="text-[9px] font-mono text-slate-400">/ 100</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans font-medium">
              {isAr ? verdict.descAr : verdict.descEn}
            </p>

            {/* Diplomatic Pushback Preview if score is not P1 */}
            {score < 75 && (
              <div className="pt-2 border-t border-indigo-100 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isAr ? 'صيغة الرفض الدبلوماسي الجاهزة للمشاركة:' : 'Diplomatic Pushback Script:'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPushback}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {copiedPushback ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPushback ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرد' : 'Copy Script')}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-white/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-wrap select-all">
                  {pushbackMessage}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2.5 shrink-0 bg-slate-50/80 dark:bg-white/[0.02] flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {score < 75 && (
              <button
                type="button"
                onClick={handleDeferToBufferQueue}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <span>🛡️</span>
                <span>{isAr ? 'إيداع بمخزن السبت' : 'Defer to Saturday Buffer'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddToSprint}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-transform active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{isAr ? 'اعتماد كأولوية في الشوط' : 'Commit to Current Sprint'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
