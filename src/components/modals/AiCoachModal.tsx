import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  Split,
  BarChart2,
  CheckCircle2,
  Plus,
  Key,
  Dna,
  Zap,
  Moon,
  BookOpen,
} from 'lucide-react';
import type {
  AiChatMessage,
  DeconstructedStep,
  DailyLog,
  UserProfile,
  UserState,
  UserBehavioralDNA,
} from '../../types';
import { aiCoach, type CoachingContext } from '../../services/aiCoachService';
import { behavioralLearning } from '../../services/behavioralLearningService';
import { db } from '../../db/db';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface AiCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState | undefined;
  todayLog: DailyLog | undefined;
  dailyLogs: DailyLog[];
  activeProfile?: UserProfile;
  onOpenSettings?: () => void;
}

type TabMode = 'chat' | 'deconstruct' | 'diagnostics' | 'dna';

export const AiCoachModal: React.FC<AiCoachModalProps> = ({
  isOpen,
  onClose,
  userState,
  todayLog,
  dailyLogs,
  activeProfile,
  onOpenSettings,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<TabMode>('chat');
  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    const saved = localStorage.getItem('midmar_ai_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [
      {
        id: 'msg_welcome',
        sender: 'assistant',
        text: isAr
          ? 'مرحباً بك! أنا "مِضمار"، مرشدك الذكي لكسر التسويف وتسهيل الالتزام. ما الذي تشعر بصعوبة في بدئه الآن؟'
          : 'Welcome! I am Midmar, your cognitive accountability coach. What are you finding difficult to start right now?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Deconstructor state
  const [taskToDeconstruct, setTaskToDeconstruct] = useState('');
  const [deconstructedSteps, setDeconstructedSteps] = useState<DeconstructedStep[]>([]);
  const [isDeconstructing, setIsDeconstructing] = useState(false);
  const [stepsAddedToast, setStepsAddedToast] = useState(false);

  // Diagnostics state
  const [diagnosticsText, setDiagnosticsText] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Behavioral DNA State
  const [userDNA, setUserDNA] = useState<UserBehavioralDNA | null>(null);
  const [dnaReportText, setDnaReportText] = useState<string | null>(null);
  const [isGeneratingDnaReport, setIsGeneratingDnaReport] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Check if API key is present and compute DNA
  useEffect(() => {
    if (isOpen) {
      aiCoach.getConfig().then((cfg) => {
        setHasApiKey(Boolean(cfg?.apiKey && cfg.enabled));
      });
      behavioralLearning.getOrComputeDNA(dailyLogs).then((dna) => {
        setUserDNA(dna);
      });
    }
  }, [isOpen, dailyLogs]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, isTyping]);

  if (!isOpen) return null;

  // Build current context for AI
  const coachingContext: CoachingContext = {
    profileName: activeProfile?.name || 'صديقي',
    roleTemplate: activeProfile?.roleTemplate || 'عام',
    energyLevel: userState?.energyLevel || 'عادية',
    streakDays: userState?.streakDays || 0,
    completedStationsCount: todayLog?.completedStations?.length || 0,
    todayTasks: todayLog?.workdayTasks?.map((t) => ({
      title: t.title,
      completed: t.completed,
      estimatedMinutes: t.estimatedMinutes,
    })),
    recentWins: todayLog?.wins,
    voiceNotes: todayLog?.voiceNotes,
    pastWeekConsistencyPct: Math.min(
      100,
      Math.round(
        (dailyLogs.slice(0, 7).reduce((acc, l) => acc + l.completedStations.length, 0) / 42) * 100
      )
    ),
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const userMsg: AiChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputText('');
    setIsTyping(true);

    try {
      const reply = await aiCoach.askCoach(text.trim(), coachingContext);
      const botMsg: AiChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalMsgs = [...updated, botMsg];
      setMessages(finalMsgs);
      localStorage.setItem('midmar_ai_chat_history', JSON.stringify(finalMsgs.slice(-20)));
      soundSynth.playCompletionChime();
      haptic.vibrateLight();
    } catch (err) {
      console.warn('AI chat error', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeconstruct = async () => {
    if (!taskToDeconstruct.trim() || isDeconstructing) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsDeconstructing(true);

    try {
      const steps = await aiCoach.deconstructTask(taskToDeconstruct.trim(), coachingContext);
      setDeconstructedSteps(steps);
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
    } finally {
      setIsDeconstructing(false);
    }
  };

  const handleAddStepsToWorkday = async () => {
    if (!deconstructedSteps.length) return;
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();

    const todayStr = new Date().toISOString().split('T')[0];
    const profileId = activeProfile?.id || 'profile_default';

    for (const step of deconstructedSteps) {
      await db.workday_tasks.add({
        id: `wt_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: step.title,
        estimatedMinutes: step.durationMin,
        actualMinutes: 0,
        completed: false,
        priority: 'high',
        date: todayStr,
        profileId,
      });
    }

    setStepsAddedToast(true);
    setTimeout(() => setStepsAddedToast(false), 3500);
  };

  const handleDiagnose = async () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsDiagnosing(true);

    try {
      const diagnosis = await aiCoach.diagnoseHabitPatterns(dailyLogs, coachingContext);
      setDiagnosticsText(diagnosis);
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleGenerateDnaReport = async () => {
    if (!userDNA) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setIsGeneratingDnaReport(true);

    try {
      const report = await behavioralLearning.generateAiBehavioralReport(
        userDNA,
        dailyLogs,
        activeProfile
      );
      setDnaReportText(report);
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
    } finally {
      setIsGeneratingDnaReport(false);
    }
  };

  const quickPrompts = isAr
    ? [
        'حاسس بكسل ومقاومة ومش قادر أبدأ 🥱',
        'طاقتي منخفضة وعاوز أنجز الأهم فقط 🛡️',
        'عندي تشتت شديد بسبب السوشيال ميديا 🌊',
        'ساعدني أقسم وقت يومي بدون إرهاق 🎯',
      ]
    : [
        'Feeling lazy and resisting to start 🥱',
        'My energy is low, keep only bare minimum 🛡️',
        'Distracted by social media loops 🌊',
        'Help me plan today effortlessly 🎯',
      ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center animate-fade-in">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-white dark:bg-zinc-950 rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Drag Indicator on Mobile */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? 'المرشد السلوكي الذكي (مِضمار AI)' : 'AI Behavioral Coach (Midmar AI)'}
                </h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  hasApiKey
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
                }`}>
                  {hasApiKey ? (isAr ? 'Gemini 2.0 متصل ⚡' : 'Gemini Connected ⚡') : (isAr ? 'ذكاء محلي مدمج 🧠' : 'Offline Heuristics 🧠')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr ? 'يفهم سياقك، يفكك مهامك الصعبة، ويجعل التزامك سهلاً للغاية' : 'Learns your patterns and removes friction'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title={isAr ? 'إعدادات مفتاح الـ API' : 'AI API Settings'}
              >
                <Key className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-4 pt-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40 gap-2">
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('chat');
            }}
            className={`py-2 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-950 rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{isAr ? 'محادثة المرشد' : 'Coach Chat'}</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('deconstruct');
            }}
            className={`py-2 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'deconstruct'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-950 rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>{isAr ? 'تفكيك مهمة صعبة' : 'Deconstruct Task'}</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('diagnostics');
            }}
            className={`py-2 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-950 rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحليل صعوبة الالتزام' : 'Habit Diagnostics'}</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('dna');
            }}
            className={`py-2 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dna'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-950 rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800'
            }`}
          >
            <Dna className="w-3.5 h-3.5 text-purple-500" />
            <span>{isAr ? 'بصمتك السلوكية 🧬' : 'Behavioral DNA 🧬'}</span>
          </button>
        </div>

        {/* Tab 1: AI Coach Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-[360px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-xs shadow-sm'
                        : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 rounded-bl-xs border border-slate-200/70 dark:border-zinc-700/60 shadow-2xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className={`text-[9px] block mt-1.5 font-mono ${
                      msg.sender === 'user' ? 'text-indigo-200 text-end' : 'text-slate-400 dark:text-zinc-500'
                    }`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500 p-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-200" />
                  <span className="text-[11px] font-medium mr-1">
                    {isAr ? 'المرشد يحلل سياقك ويكتب...' : 'Coach is analyzing...'}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick 1-Tap Prompts */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-zinc-900/30">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="shrink-0 text-[11px] font-medium py-1.5 px-3 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs cursor-pointer active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-2">
              <input
                type="text"
                placeholder={isAr ? 'اسأل المرشد.. مثلاً: حاسس بكسل، أو عاوز أبدأ مهمة...' : 'Ask the coach...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-500"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isTyping}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Task Deconstructor */}
        {activeTab === 'deconstruct' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-xs">
                <Split className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? 'مفكك المهام الذري (Atomic Task Deconstructor)' : 'Atomic Task Deconstructor'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                {isAr
                  ? 'أي مهمة تشعر أنها ثقيلة، يفككها الذكاء الاصطناعي إلى 3 خطوات متسلسلة مدتها 3 إلى 10 دقائق فقط، لتزيل أي خوف أو ارتباك من عقلك الباطن فوراً!'
                  : 'Break down daunting tasks into 3 microscopic steps (3-10 minutes each) that eliminate procrastination.'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                {isAr ? 'ما هي المهمة التي تؤجلها أو تشعر بثقلها؟' : 'What task are you putting off?'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={isAr ? 'مثلاً: إنهاء التقرير المالي، كتابة الـ API، أو تنظيف الغرفة...' : 'e.g., Finish report, build API endpoint...'}
                  value={taskToDeconstruct}
                  onChange={(e) => setTaskToDeconstruct(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDeconstruct();
                  }}
                  className="flex-1 py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                />

                <button
                  onClick={handleDeconstruct}
                  disabled={!taskToDeconstruct.trim() || isDeconstructing}
                  className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isDeconstructing ? (isAr ? 'جاري التفكيك...' : 'Deconstructing...') : (isAr ? 'فكك المهمة 🪄' : 'Deconstruct 🪄')}</span>
                </button>
              </div>
            </div>

            {deconstructedSteps.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-zinc-800 animate-fade-in">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                  {isAr ? 'الخطوات المجهرية المقترحة (ابدأ بالخطوة 1 فقط):' : 'Proposed atomic steps (start with Step 1 only):'}
                </span>

                <div className="space-y-2">
                  {deconstructedSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-zinc-200">
                          {step.title}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 border border-slate-200 dark:border-zinc-700">
                        {step.durationMin} {isAr ? 'د' : 'min'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={handleAddStepsToWorkday}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة الخطوات لجدول مهام اليوم 📥' : 'Add to today tasks 📥'}</span>
                  </button>

                  {stepsAddedToast && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'تمت الإضافة بنجاح ✔' : 'Added successfully ✔'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Habit Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                <BarChart2 className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'تحليل صعوبة الالتزام واكتشاف العقبات' : 'Commitment Diagnostics & Habit Analysis'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                {isAr
                  ? 'يقوم الذكاء الاصطناعي بمراجعة سجلاتك ومحطاتك غير المكتملة في الأيام السابقة ليخبرك بالسبب الواقعي الذي جعل الالتزام صعباً عليك، ويقترح تعديلاً بسيطاً جداً.'
                  : 'AI scans your recent completion logs to diagnose why friction was high and gives an actionable fix.'}
              </p>
            </div>

            <div className="text-center py-2">
              <button
                onClick={handleDiagnose}
                disabled={isDiagnosing}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isDiagnosing ? (isAr ? 'جاري قراءة وتحليل السجلات...' : 'Analyzing logs...') : (isAr ? 'تشخيص أسباب صعوبة الالتزام 📈' : 'Diagnose My Patterns 📈')}</span>
              </button>
            </div>

            {diagnosticsText && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm animate-fade-in">
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {isAr ? 'نتيجة التشخيص والتوصيات:' : 'Diagnostic Results & Recommendations:'}
                </h4>
                <div className="text-xs text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {diagnosticsText}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Behavioral DNA & Pattern Learning ("بصمتك السلوكية") */}
        {activeTab === 'dna' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Header intro */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-teal-500/10 border border-purple-300/40 dark:border-purple-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-xs">
                <Dna className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                <span>{isAr ? 'البصمة السلوكية الفردية (Behavioral DNA)' : 'Personal Behavioral DNA'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                {isAr
                  ? 'يتعلم النظام تلقائياً من عاداتك الحقيقية المسجلة محلياً، ويستخرج توقيتات ذروة طاقتك، ومدة الجلسة الأنسب لطبيعتك دون أي افتراضات مسبقة.'
                  : 'The system learns automatically from your real local logs to extract peak hours and optimal focus duration.'}
              </p>
            </div>

            {/* 4 Metric Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Peak Hours */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-500" />
                    <span>{isAr ? 'ساعات ذروة التركيز' : 'Peak Focus Window'}</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
                    {userDNA?.completionRatePct || 85}% {isAr ? 'إتمام' : 'rate'}
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-zinc-100">
                  {userDNA?.peakFocusHourStart || 9}:00 ص - {userDNA?.peakFocusHourEnd || 12}:00 م
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {isAr ? 'أعلى نافذة تنجز فيها مهامك الصعبة دون تسويف' : 'Best time for your hardest tasks'}
                </p>
              </div>

              {/* Optimal Sprint */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'الجلسة الذهبية المقترحة' : 'Optimal Sprint'}</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                    {isAr ? 'مُقترح لك' : 'Optimal'}
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-zinc-100">
                  {userDNA?.optimalSprintMinutes || 20} {isAr ? 'دقيقة تركيز صافي' : 'minutes focus'}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {isAr ? 'المدة الواقعية التي تنهيها بنجاح دون إجهاد ذهني' : 'Frictionless sprint duration'}
                </p>
              </div>

              {/* Sleep Multiplier */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isAr ? 'معامل أثر النوم على الإنجاز' : 'Sleep Multiplier'}</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                    {userDNA?.averageSleepDuration || 7} {isAr ? 'ساعات' : 'hrs avg'}
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{Math.round(((userDNA?.sleepProductivityMultiplier || 1.35) - 1) * 100)}% {isAr ? 'زيادة كفاءة' : 'efficiency'}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {isAr ? 'في الأيام التي تنام فيها جيداً يرتفع إنجازك تلقائياً' : 'Productivity boosts after 7+ hrs sleep'}
                </p>
              </div>

              {/* Best Prayer Window */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isAr ? 'نافذة البركة الصباحية' : 'Blessing Window'}</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                    {isAr ? 'صفاء ذهني' : 'Calm'}
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-zinc-100">
                  {userDNA?.bestPrayerTimeWindow || '05:30 ص - 07:00 ص'}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {isAr ? 'التوقيت الأصفى لسورة البقرة والأذكار قبل زحام اليوم' : 'Ideal time for Quran & morning adhkar'}
                </p>
              </div>
            </div>

            {/* Key Insights List */}
            {userDNA?.keyInsights && userDNA.keyInsights.length > 0 && (
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>{isAr ? 'ملاحظات وتوصيات مستخلصة من وتيرتك:' : 'Learned Habits & Insights:'}</span>
                </h4>
                <div className="space-y-1.5">
                  {userDNA.keyInsights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: insight
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-indigo-700 dark:text-indigo-400">$1</strong>'),
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AI Report Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleGenerateDnaReport}
                disabled={isGeneratingDnaReport}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-md shadow-purple-600/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  {isGeneratingDnaReport
                    ? (isAr ? 'جاري استخراج التقرير بالذكاء الاصطناعي...' : 'Generating AI report...')
                    : (isAr ? 'تحليل متقدم لبصمتي السلوكية بالذكاء الاصطناعي 🪄' : 'Generate In-Depth AI Persona Report 🪄')}
                </span>
              </button>
            </div>

            {/* AI Report Text Output */}
            {dnaReportText && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-300/60 dark:border-purple-800/60 space-y-3 shadow-md animate-fade-in">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs border-b border-slate-100 dark:border-zinc-800 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'التقرير السلوكي الشخصي المعمق:' : 'Deep Behavioral Persona Analysis:'}</span>
                </div>
                <div className="text-xs text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed space-y-2">
                  {dnaReportText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
