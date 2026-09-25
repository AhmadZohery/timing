import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Volume2,
  Copy,
  Check,
  Sparkles,
  Share2,
  Briefcase,
  Shuffle,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { speechService } from '../../services/speechService';
import { ENGLISH_WORDS } from '../../data/languages/english';

export interface AgileStandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardToast?: (msg: string) => void;
}

export const AgileStandupModal: React.FC<AgileStandupModalProps> = ({
  isOpen,
  onClose,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const storageKey = `midmar_standup_${todayStr}`;

  // Form State
  const [yesterdayText, setYesterdayText] = useState('');
  const [todayText, setTodayText] = useState('');
  const [blockersText, setBlockersText] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setYesterdayText(parsed.yesterday || '');
        setTodayText(parsed.today || '');
        setBlockersText(parsed.blockers || '');
      }
    } catch (_) {}
  }, [storageKey]);

  // Save to local storage on change
  const saveDraft = (y: string, t: string, b: string) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ yesterday: y, today: t, blockers: b, date: todayStr })
      );
    } catch (_) {}
  };

  // Filter PM & Agile vocabulary from english.ts
  const pmPhrases = useMemo(() => {
    return ENGLISH_WORDS.filter((w) => w.category === 'agile_pm_leadership');
  }, []);

  const [phraseIndex, setPhraseIndex] = useState(() => {
    return Math.floor(Math.random() * (pmPhrases.length || 1));
  });

  const activePhrase = pmPhrases[phraseIndex] || pmPhrases[0];

  const handleNextPhrase = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setPhraseIndex((prev) => (prev + 1) % pmPhrases.length);
  };

  const handleSpeakPhrase = () => {
    if (!activePhrase) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    speechService.speak(
      `${activePhrase.word}. ${activePhrase.contextSentence}`,
      'en-US'
    );
  };

  const handleCopyPhrase = () => {
    if (!activePhrase) return;
    soundSynth.playCompletionChime();
    haptic.vibrateLight();
    const textToCopy = `"${activePhrase.word}" (${activePhrase.phonetic})\n${activePhrase.translationAr}\nExample: ${activePhrase.contextSentence}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 2000);
  };

  const handleCopyFullStandup = () => {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();

    const formattedStandup = isAr
      ? `🚀 **تقرير الوقفة اليومية (Daily Standup) - ${todayStr}**\n\n` +
        `✅ **ما تم إنجازه وشحنه بالأمس:**\n${yesterdayText.trim() || '• إنجاز المهام الأساسية المجدولة.'}\n\n` +
        `🎯 **هدف اليوم المحوري (North Star):**\n${todayText.trim() || '• التركيز على الأولوية القصوى والشحن المستمر.'}\n\n` +
        `⚠️ **العوائق وتمدد النطاق (Blockers & Risks):**\n${blockersText.trim() || '• لا توجد عوائق مانعة، المسار سالك بحمد الله.'}\n\n` +
        (activePhrase
          ? `💡 *PM English Power Phrase:* "${activePhrase.word}" - ${activePhrase.translationAr}\n`
          : '')
      : `🚀 **Daily Standup - ${todayStr}**\n\n` +
        `✅ **Yesterday (Shipped Wins):**\n${yesterdayText.trim() || '• Completed core scheduled sprint items.'}\n\n` +
        `🎯 **Today's North Star:**\n${todayText.trim() || '• Moving the needle on highest-leverage deliverable.'}\n\n` +
        `⚠️ **Blockers & Scope Risks:**\n${blockersText.trim() || '• No critical blockers. Runway is clear.'}\n\n` +
        (activePhrase
          ? `💡 *PM Power Phrase:* "${activePhrase.word}" - ${activePhrase.translationAr}\n`
          : '');

    navigator.clipboard.writeText(formattedStandup);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    if (onRewardToast) {
      onRewardToast(
        isAr
          ? '📋 تم نسخ تقرير الستاند اب جاهزاً للإرسال في Slack / Teams!'
          : '📋 Standup report copied for Slack / Teams!'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#12131F] border border-slate-200 dark:border-white/[0.09] shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                  Agile PM Ritual
                </span>
                <span className="text-xs text-slate-400 font-mono">{todayStr}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {isAr ? 'الوقفة اليومية وتكتيكات إدارة المشاريع' : 'Daily Standup & Executive PM Phrases'}
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {/* Section 1: The 3 Core Standup Questions */}
          <div className="space-y-4">
            {/* Question 1: Yesterday */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="text-emerald-500 font-mono font-black">1.</span>
                <span>{isAr ? 'ما تم إنجازه وشحنه بالأمس (Yesterday’s Shipped):' : 'What did you ship yesterday?'}</span>
              </label>
              <textarea
                rows={2}
                value={yesterdayText}
                onChange={(e) => {
                  setYesterdayText(e.target.value);
                  saveDraft(e.target.value, todayText, blockersText);
                }}
                placeholder={
                  isAr
                    ? 'مثال: إتمام واجهة المستخدم وتكامل الـ API، حل مشكلة التأخير...'
                    : 'e.g. Shipped authentication endpoint, closed QA bug tickets...'
                }
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 leading-relaxed resize-none shadow-2xs"
              />
            </div>

            {/* Question 2: Today (North Star) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="text-sky-500 font-mono font-black">2.</span>
                <span>{isAr ? 'هدف اليوم المحوري (Today’s North Star Focus):' : 'Today’s core high-leverage priority?'}</span>
              </label>
              <textarea
                rows={2}
                value={todayText}
                onChange={(e) => {
                  setTodayText(e.target.value);
                  saveDraft(yesterdayText, e.target.value, blockersText);
                }}
                placeholder={
                  isAr
                    ? 'مثال: التركيز على شوطي عمل عميق لإطلاق ميزة التقارير، مراجعة الكود...'
                    : 'e.g. 2 deep work sprints on core report architecture, zero context switching...'
                }
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 leading-relaxed resize-none shadow-2xs"
              />
            </div>

            {/* Question 3: Blockers & Scope Creep */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="text-rose-500 font-mono font-black">3.</span>
                <span>{isAr ? 'العوائق ومخاطر زحف النطاق (Blockers & Scope Risks):' : 'Any blockers or scope risks?'}</span>
              </label>
              <textarea
                rows={2}
                value={blockersText}
                onChange={(e) => {
                  setBlockersText(e.target.value);
                  saveDraft(yesterdayText, todayText, e.target.value);
                }}
                placeholder={
                  isAr
                    ? 'مثال: انتظار موافقة العميل، استهلاك الطاقة في اجتماعات متتابعة...'
                    : 'e.g. Waiting on backend contract approval, meeting fatigue...'
                }
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 leading-relaxed resize-none shadow-2xs"
              />
            </div>
          </div>

          {/* Section 2: Executive PM English Power Phrase Card of the Day */}
          {activePhrase && (
            <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/60 dark:from-indigo-950/30 dark:via-[#141527] dark:to-sky-950/20 border border-indigo-200/80 dark:border-indigo-500/20 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                    {isAr ? 'تكتيك لغوي إداري بالإنجليزية (Executive PM Phrase)' : 'PM Power Phrase of the Day'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleNextPhrase}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title={isAr ? 'عبارة إدارية أخرى' : 'Next phrase'}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSpeakPhrase}
                    className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer"
                    title={isAr ? 'استماع للنطق الصحيح' : 'Listen pronunciation'}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Phrase Details */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sans tracking-tight">
                    {activePhrase.word}
                  </h3>
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-300">
                    {activePhrase.phonetic}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200">
                    {activePhrase.level}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activePhrase.translationAr}
                </p>
              </div>

              {/* Context Sentence */}
              <div className="p-3 rounded-xl bg-white/80 dark:bg-black/30 border border-indigo-100 dark:border-white/[0.06] text-xs space-y-1">
                <p className="font-sans font-medium text-slate-800 dark:text-slate-200 italic leading-relaxed">
                  "{activePhrase.contextSentence}"
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {activePhrase.contextSentenceAr}
                </p>
              </div>

              {/* Copy Phrase Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCopyPhrase}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer"
                >
                  {copiedPhrase ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPhrase ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ العبارة' : 'Copy Phrase')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3 shrink-0 bg-slate-50/80 dark:bg-white/[0.02]">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {isAr ? 'يتم حفظ المسودة تلقائياً في جهازك' : 'Draft auto-saved locally'}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyFullStandup}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition-transform active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>
                {copied
                  ? (isAr ? 'تم نسخ التقرير لـ Slack / Teams!' : 'Copied for Slack / Teams!')
                  : (isAr ? 'نسخ التقرير لـ Slack / Teams' : 'Copy Standup for Slack / Teams')}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
