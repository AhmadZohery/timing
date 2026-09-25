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
      className={`rounded-3xl bg-gradient-to-br from-indigo-900/10 via-slate-900/[0.03] to-purple-900/10 dark:from-indigo-950/40 dark:via-zinc-900/80 dark:to-purple-950/30 border border-indigo-200/80 dark:border-indigo-800/40 p-5 sm:p-6 shadow-sm relative overflow-hidden backdrop-blur-xs transition-all ${className}`}
    >
      {/* Decorative Glow Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Top Header Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isAr ? 'المساعد الإدراكي وفهم السلوك' : 'Cognitive Copilot & Behavioral DNA'}
              </h3>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                  hasApiKey
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                }`}
              >
                <span>{hasApiKey ? '● Gemini 2.0 Active' : '⚡ Local Physics Engine'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
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
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title={isAr ? 'إعدادات محرك الذكاء ومفتاح الـ API' : 'AI Engine Settings & API Key'}
          >
            <Key className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">
              {hasApiKey ? (isAr ? 'المفتاح متصل' : 'Key Active') : (isAr ? 'ربط API' : 'Connect API')}
            </span>
          </button>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isLoadingReport}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            {isLoadingReport ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isAr ? 'جارِ التحليل...' : 'Analyzing...'}</span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحليل اليوم الإدراكي' : 'Daily Diagnosis'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Behavioral DNA 4-Metric Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 mb-4">
        {/* Metric 1: Optimal Sprint */}
        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-bold">{isAr ? 'الجلسة الذهبية' : 'Golden Sprint'}</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {dna.optimalSprintMinutes}{' '}
              <span className="text-xs font-normal text-slate-500">{isAr ? 'دقيقة' : 'min'}</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
              {isAr ? 'طاقة تركيز دون تسويف' : 'Frictionless Focus'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleApplySprintDuration}
            className="w-full py-1.5 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-200 dark:border-indigo-800/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            {appliedSprintSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span>{isAr ? 'معتمد' : 'Applied'}</span>
              </>
            ) : (
              <span>{isAr ? 'تطبيق كافتراضي' : 'Apply Default'}</span>
            )}
          </button>
        </div>

        {/* Metric 2: Peak Cognitive Window */}
        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-bold">{isAr ? 'ذروة اليقظة' : 'Peak Hours'}</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
              {dna.peakFocusHourStart}:00 - {dna.peakFocusHourEnd}:00
            </div>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block mt-0.5">
              {isAr ? 'أعلى إنتاجية ذهنية صباحية' : 'Optimal Willpower Peak'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
            {isAr ? 'احمِ هذه الساعات للمهام الكبرى' : 'Reserve for deep tasks'}
          </div>
        </div>

        {/* Metric 3: Sleep Multiplier */}
        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-bold">{isAr ? 'أثر الاستشفاء' : 'Recovery Boost'}</span>
            <Moon className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
              +{sleepMultiplierPct}%
            </div>
            <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-bold block mt-0.5">
              {isAr ? `نوم ${dna.averageSleepDuration} ساعات` : `${dna.averageSleepDuration}h sleep avg`}
            </span>
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
            {isAr ? 'مضاعِف نقاط الإنجاز' : 'Energy Multiplier'}
          </div>
        </div>

        {/* Metric 4: Task Velocity & Sessions */}
        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-bold">{isAr ? 'معدل الإتمام' : 'Velocity'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {dna.completionRatePct}%
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold block mt-0.5">
              {dna.totalSessionsAnalyzed} {isAr ? 'جلسة محللة' : 'sessions logged'}
            </span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {isAr ? 'وتيرة عمل مستقرة' : 'Steady Momentum'}
          </div>
        </div>
      </div>

      {/* Primary Key Insight Pill */}
      {dna.keyInsights && dna.keyInsights.length > 0 && !isExpanded && (
        <div className="relative z-10 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-slate-800 dark:text-indigo-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
            <p className="line-clamp-2 leading-relaxed">
              {dna.keyInsights[0].replace(/\*\*/g, '')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer"
          >
            <span>{isAr ? 'تفاصيل أكثر' : 'More'}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded Deep Analysis Report View */}
      {isExpanded && (
        <div className="relative z-10 mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-800/40 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'التقرير السلوكي والتشخيص الإدراكي الكامل' : 'Full Cognitive Diagnosis Report'}</span>
            </span>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-bold cursor-pointer"
            >
              <span>{isAr ? 'طي التقرير' : 'Collapse'}</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Report Body */}
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-black/40 border border-indigo-100 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 leading-relaxed font-medium space-y-2 whitespace-pre-line shadow-xs">
            {aiReport ? (
              aiReport
            ) : (
              <div className="space-y-2">
                <div className="font-bold text-indigo-700 dark:text-indigo-300">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? 'ربط مفتاح الذكاء الاصطناعي (Gemini 2.0)' : 'Connect Gemini 2.0 AI'}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              {isAr
                ? 'يستخدم النظام مفتاح Gemini 2.0 لتحليل سلوكك بدقة وفهم أسباب التسويف وصياغة خطط إنتاجية وروحية تتناسب مع تفاصيل يومك.'
                : 'Connect your free Google Gemini API key for deep personalization, tailored routines, and cognitive root cause analysis.'}
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  {isAr ? 'مفتاح الـ API الخاص بك:' : 'API Key:'}
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim() || isSavingKey}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
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
      )}
    </div>
  );
};
