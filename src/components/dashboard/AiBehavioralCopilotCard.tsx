import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Moon,
  Clock,
  TrendingUp,
  Brain,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Check,
} from 'lucide-react';
import type { DailyLog, UserState, UserProfile, UserBehavioralDNA } from '../../types';
import { behavioralLearning } from '../../services/behavioralLearningService';
import { aiCoach } from '../../services/aiCoachService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { db } from '../../db/db';
import { useTranslation } from '../../i18n/LanguageContext';

interface AiBehavioralCopilotCardProps {
  todayLog?: DailyLog;
  userState?: UserState;
  allDailyLogs?: DailyLog[];
  activeProfile?: UserProfile;
  onRewardToast?: (msg: string) => void;
  onStartSuggestedSprint?: (durationMin: number) => void;
  className?: string;
}

export const AiBehavioralCopilotCard: React.FC<AiBehavioralCopilotCardProps> = ({
  todayLog: _todayLog,
  userState,
  allDailyLogs,
  activeProfile,
  onRewardToast,
  onStartSuggestedSprint,
  className = '',
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [dna, setDna] = useState<UserBehavioralDNA | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [appliedSprintSuccess, setAppliedSprintSuccess] = useState(false);

  // Load DNA and check API Key status
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const computedDna = await behavioralLearning.getOrComputeDNA(allDailyLogs);
        if (isMounted) setDna(computedDna);

        const config = await aiCoach.getConfig();
        if (isMounted) {
          setHasApiKey(Boolean(config?.enabled && config?.apiKey));
          if (config?.apiKey) setApiKeyInput(config.apiKey);
        }
      } catch (err) {
        console.warn('Failed to load behavioral DNA or AI config', err);
      }
    }

    loadData();
  }, [allDailyLogs, userState]);

  const handleGenerateReport = async () => {
    if (!dna) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsLoadingReport(true);
    try {
      const report = await behavioralLearning.generateAiBehavioralReport(
        dna,
        allDailyLogs,
        activeProfile
      );
      setAiReport(report);
      setIsExpanded(true);
      soundSynth.playCompletionChime();
      haptic.vibrateWorkDone();
      onRewardToast?.(
        isAr
          ? '🧠 تم استخلاص تقريرك الإدراكي السلوكي بنجاح!'
          : '🧠 Behavioral analysis generated successfully!'
      );
    } catch (err) {
      console.warn('Failed to generate report', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleApplySprintDuration = async () => {
    if (!dna?.optimalSprintMinutes) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const optimal = dna.optimalSprintMinutes;

    try {
      const current = await db.user_state.get('current_user');
      if (current) {
        await db.user_state.update(current.id, {
          settings: {
            ...current.settings,
            sprintDurationMinutes: optimal,
          },
        });
      }
      setAppliedSprintSuccess(true);
      onStartSuggestedSprint?.(optimal);
      soundSynth.playCompletionChime();
      onRewardToast?.(
        isAr
          ? `⚡ تم اعتماد ${optimal} دقيقة كمعيار جلساتك الذهبي!`
          : `⚡ Set ${optimal}m as your golden sprint duration!`
      );
      setTimeout(() => setAppliedSprintSuccess(false), 4000);
    } catch (err) {
      console.warn('Failed to apply sprint duration', err);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsSavingKey(true);
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    try {
      await aiCoach.saveConfig({
        provider: 'gemini',
        apiKey: apiKeyInput.trim(),
        model: 'gemini-2.0-flash',
        enabled: true,
      });
      setHasApiKey(true);
      setIsConfigModalOpen(false);
      soundSynth.playStreakMilestoneChime();
      haptic.vibrateSprintCelebration();
      onRewardToast?.(
        isAr
          ? '✔ تم ربط مفتاح Gemini 2.0 بنجاح! الذكاء الإدراكي يعمل بكامل طاقته.'
          : '✔ Gemini 2.0 API Key connected successfully!'
      );
    } catch (err) {
      console.warn('Failed to save API key', err);
    } finally {
      setIsSavingKey(false);
    }
  };

  if (!dna) {
    return null;
  }

  const sleepMultiplierPct = Math.round((dna.sleepProductivityMultiplier - 1) * 100);

  return (
    <div
      className={`rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 p-5 sm:p-6 shadow-sm relative overflow-hidden transition-all ${className}`}
    >
      {/* Top Header Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#141517] text-[#e2defc] flex items-center justify-center shadow-xs shrink-0">
            <Brain className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                {isAr ? 'المساعد الإدراكي وفهم السلوك' : 'Cognitive Copilot & Behavioral DNA'}
              </h3>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  hasApiKey
                    ? 'bg-[#bce8c2] text-emerald-950'
                    : 'bg-[#e2defc] text-indigo-950'
                }`}
              >
                <span>{hasApiKey ? '● Gemini 2.0 Active' : '⚡ Local Physics Engine'}</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isAr
                ? 'تحليل أنماط طاقتك اليومية وكشف أسباب التسويف وضبط وتيرتك الفردية'
                : 'Decodes your focus biology, eliminates procrastination, and sets your sweet spot.'}
            </p>
          </div>
        </div>

        {/* API Key / Engine Settings Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3 py-2 rounded-full surface-card-3d border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            title={isAr ? 'إعدادات محرك الذكاء ومفتاح الـ API' : 'AI Engine Settings & API Key'}
          >
            <Key className="w-3.5 h-3.5 text-[#5448e8]" />
            <span className="hidden sm:inline">
              {hasApiKey ? (isAr ? 'المفتاح متصل' : 'Key Active') : (isAr ? 'ربط API' : 'Connect API')}
            </span>
          </button>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isLoadingReport}
            className="px-4 py-2 rounded-full bg-[#141517] dark:bg-white disabled:opacity-50 text-white dark:text-zinc-950 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            {isLoadingReport ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isAr ? 'جارِ التحليل...' : 'Analyzing...'}</span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5 text-[#1eb814]" />
                <span>{isAr ? 'تحليل اليوم الإدراكي' : 'Daily Diagnosis'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Behavioral DNA 4-Metric Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 mb-4">
        {/* Metric 1: Optimal Sprint */}
        <div className="p-3.5 rounded-[22px] bento-3d-amber border border-amber-300/60 dark:border-amber-800/40 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-amber-950 dark:text-amber-200">
            <span className="text-[11px] font-bold">{isAr ? 'الجلسة الذهبية' : 'Golden Sprint'}</span>
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white font-mono">
              {dna.optimalSprintMinutes}{' '}
              <span className="text-xs font-normal text-zinc-600 dark:text-amber-200/80">{isAr ? 'دقيقة' : 'min'}</span>
            </div>
            <span className="text-[10px] text-amber-900 dark:text-amber-300 font-bold block mt-0.5">
              {isAr ? 'طاقة تركيز دون تسويف' : 'Frictionless Focus'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleApplySprintDuration}
            className="w-full py-1.5 px-2 rounded-full bg-white/85 dark:bg-zinc-900/80 hover:bg-white text-zinc-900 dark:text-amber-200 text-[10px] font-bold border border-amber-300/60 dark:border-amber-700/50 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            {appliedSprintSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>{isAr ? 'معتمد' : 'Applied'}</span>
              </>
            ) : (
              <span>{isAr ? 'تطبيق كافتراضي' : 'Apply Default'}</span>
            )}
          </button>
        </div>

        {/* Metric 2: Peak Cognitive Window */}
        <div className="p-3.5 rounded-[22px] bento-3d-sky border border-sky-300/60 dark:border-sky-800/40 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-sky-950 dark:text-sky-200">
            <span className="text-[11px] font-bold">{isAr ? 'ذروة اليقظة' : 'Peak Hours'}</span>
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white font-mono">
              <bdi dir="ltr">{dna.peakFocusHourStart}:00 - {dna.peakFocusHourEnd}:00</bdi>
            </div>
            <span className="text-[10px] text-sky-900 dark:text-sky-300 font-bold block mt-0.5">
              {isAr ? 'أعلى إنتاجية ذهنية صباحية' : 'Optimal Willpower Peak'}
            </span>
          </div>
          <div className="text-[10px] text-zinc-600 dark:text-sky-200/70 font-medium">
            {isAr ? 'احمِ هذه الساعات للمهام الكبرى' : 'Reserve for deep tasks'}
          </div>
        </div>

        {/* Metric 3: Sleep Multiplier */}
        <div className="p-3.5 rounded-[22px] bento-3d-lavender border border-indigo-300/60 dark:border-indigo-800/40 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-indigo-950 dark:text-indigo-200">
            <span className="text-[11px] font-bold">{isAr ? 'أثر الاستشفاء' : 'Recovery Boost'}</span>
            <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-indigo-950 dark:text-white font-mono">
              <bdi dir="ltr">+{sleepMultiplierPct}%</bdi>
            </div>
            <span className="text-[10px] text-indigo-900 dark:text-indigo-300 font-bold block mt-0.5">
              {isAr ? `نوم ${dna.averageSleepDuration} ساعات` : `${dna.averageSleepDuration}h sleep avg`}
            </span>
          </div>
          <div className="text-[10px] text-zinc-600 dark:text-indigo-200/70 font-medium">
            {isAr ? 'مضاعِف نقاط الإنجاز' : 'Energy Multiplier'}
          </div>
        </div>

        {/* Metric 4: Task Velocity & Sessions */}
        <div className="p-3.5 rounded-[22px] bento-3d-mint border border-emerald-300/60 dark:border-emerald-800/40 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-emerald-950 dark:text-emerald-200">
            <span className="text-[11px] font-bold">{isAr ? 'معدل الإتمام' : 'Velocity'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white font-mono">
              <bdi dir="ltr">{dna.completionRatePct}%</bdi>
            </div>
            <span className="text-[10px] text-emerald-900 dark:text-emerald-300 font-bold block mt-0.5">
              {dna.totalSessionsAnalyzed} {isAr ? 'جلسة محللة' : 'sessions logged'}
            </span>
          </div>
          <div className="text-[10px] text-zinc-600 dark:text-emerald-200/70 font-medium">
            {isAr ? 'وتيرة عمل مستقرة' : 'Steady Momentum'}
          </div>
        </div>
      </div>

      {/* Primary Key Insight Pill */}
      {dna.keyInsights && dna.keyInsights.length > 0 && !isExpanded && (
        <div className="relative z-10 p-3.5 rounded-[22px] bento-3d-lavender border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-zinc-900 dark:text-indigo-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#5448e8] dark:text-indigo-300 shrink-0" />
            <p className="line-clamp-2 leading-relaxed font-medium">
              {dna.keyInsights[0].replace(/\*\*/g, '')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/85 dark:bg-white/10 text-indigo-950 dark:text-white shrink-0 flex items-center gap-0.5 cursor-pointer"
          >
            <span>{isAr ? 'تفاصيل أكثر' : 'More'}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded Deep Analysis Report View */}
      {isExpanded && (
        <div className="relative z-10 mt-3 pt-3 border-t border-zinc-200/60 dark:border-white/10 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-[#5448e8]" />
              <span>{isAr ? 'التقرير السلوكي والتشخيص الإدراكي الكامل' : 'Full Cognitive Diagnosis Report'}</span>
            </span>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white flex items-center gap-1 font-bold cursor-pointer"
            >
              <span>{isAr ? 'طي التقرير' : 'Collapse'}</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Report Body */}
          <div className="p-4 rounded-[22px] bento-3d-lavender border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-zinc-800 dark:text-zinc-100 leading-relaxed font-medium space-y-2 whitespace-pre-line">
            {aiReport ? (
              aiReport
            ) : (
              <div className="space-y-2">
                <div className="font-bold text-indigo-950 dark:text-indigo-200">
                  {isAr ? '📌 التوصيات السلوكية الميدانية المستخلصة:' : '📌 Key Behavioral Principles:'}
                </div>
                {dna.keyInsights.map((insight, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {insight.replace(/\*\*/g, '')}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md modal-surface border border-white/15 rounded-[28px] overflow-hidden shadow-2xl">
            <div className="celestial-obsidian-stage text-white p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/15 text-amber-300 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  {isAr ? 'ربط مفتاح الذكاء الاصطناعي (Gemini 2.0)' : 'Connect Gemini 2.0 AI'}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {isAr
                  ? 'يستخدم النظام مفتاح Gemini 2.0 لتحليل سلوكك بدقة وفهم أسباب التسويف وصياغة خطط إنتاجية وروحية تتناسب مع تفاصيل يومك.'
                  : 'Connect your free Google Gemini API key for deep personalization, tailored routines, and cognitive root cause analysis.'}
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {isAr ? 'مفتاح الـ API الخاص بك:' : 'API Key:'}
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#5448e8] dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>{isAr ? 'احصل على مفتاح مجاني' : 'Get free key'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy... الصق المفتاح هنا"
                  className="w-full px-3.5 py-2.5 surface-card-3d border border-zinc-300 dark:border-zinc-700 rounded-2xl text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2.5 rounded-full surface-card-3d border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput.trim() || isSavingKey}
                  className="px-5 py-2.5 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingKey ? (
                    <span>{isAr ? 'جارِ الحفظ...' : 'Saving...'}</span>
                  ) : (
                    <span>{isAr ? 'حفظ وتفعيل' : 'Save & Activate'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
