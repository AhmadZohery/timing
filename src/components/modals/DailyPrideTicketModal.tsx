import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import type { DailyLog, UserState } from '../../types';
import { PERSONA_CONFIGS } from '../../utils/lifestyleEngine';
import { WIRD_PRESETS } from '../../utils/spiritualWirdEngine';

interface DailyPrideTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayLog?: DailyLog;
  userState?: UserState;
}

export const DailyPrideTicketModal: React.FC<DailyPrideTicketModalProps> = ({
  isOpen,
  onClose,
  todayLog,
  userState,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const [copied, setCopied] = useState(false);
  const [hideWorshipDetails, setHideWorshipDetails] = useState(true);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const persona = PERSONA_CONFIGS[personaId] || PERSONA_CONFIGS.builder_exec;

  const wirdId = userState?.settings?.spiritualWirdConfig?.activePreset || 'baqarah_only';
  const wirdPreset = WIRD_PRESETS[wirdId] || WIRD_PRESETS.baqarah_only;

  const streakDays = userState?.streakDays || 1;
  const totalPoints = userState?.totalPoints || 0;

  // Calculate stats
  const onTimePrayers = Object.values(todayLog?.prayers || {}).filter(
    (p) => p?.status === 'on_time'
  ).length;

  const quranPages =
    (todayLog?.customWirdProgress
      ? Object.values(todayLog.customWirdProgress).reduce((acc, it) => acc + (it.pagesRead || 0), 0)
      : 0) ||
    todayLog?.baqarahProgress?.pagesRead ||
    0;

  const focusMinutes =
    todayLog?.totalFocusMinutes ||
    (todayLog?.focusSessionsCount || 0) * 20;

  // Formatted message to copy with Sacred Tazkiyah Privacy Shield
  const worshipSection = hideWorshipDetails
    ? `🌿 الركيزة الإيمانية: مستمرة بحمد الله وفضله (سرائر بين العبد وربه 🤍)`
    : `🕌 الصلوات المكتوبة: ${onTimePrayers}/5 في وقتها\n📖 الورد القرآني: ${quranPages} صفحة (${wirdPreset.titleAr})`;

  const ticketText = `🎫 بطاقة حصاد اليوم من مِضمار (LifeOS)
📅 ${todayStr}
👤 نمط المسار: ${persona.titleAr}

🏆 إنجازات وبركة اليوم:
${worshipSection}
⚡ التركيز والعمل: ${focusMinutes} دقيقة تركيز عميق
🔥 شعلة الاستمرارية: ${streakDays} أيام متواصلة
💎 رصيد البركة والالتزام: ${totalPoints} نقطة

✨ "الحمد لله الذي بنعمته تتم الصالحات.. وأستغفر الله من التقصير والسهو"
#مِضمار #إتقان`;

  const handleCopy = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    navigator.clipboard.writeText(ticketText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in transition-colors">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-[#11131a] via-[#161a26] to-[#0c0e14] border border-amber-500/40 p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col items-center space-y-5 max-h-[95vh] overflow-y-auto">
        {/* Golden ambient aura */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-all cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Boarding Pass Ticket Header */}
        <div className="w-full text-center space-y-1 pt-1 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'تذكرة فخر اليوم الرسمية' : 'Daily Boarding Pass of Pride'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
            مِضـمـار • MIDMAR
          </h2>
          <p className="text-xs text-zinc-400 font-mono">{todayStr}</p>
        </div>

        {/* Luxury Ticket Frame */}
        <div className="w-full rounded-2xl bg-gradient-to-b from-[#181c28] to-[#121520] border-2 border-amber-500/30 p-5 space-y-4 shadow-xl relative z-10">
          {/* Perforated edge effect */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#11131a] border-r border-amber-500/30" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#11131a] border-l border-amber-500/30" />

          {/* Persona Strip */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{persona.badge.split(' ')[0]}</span>
              <div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase block">نمط الحياة</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-200">{isAr ? persona.titleAr : persona.titleEn}</span>
              </div>
            </div>
            <div className="text-end">
              <span className="text-[10px] text-zinc-400 font-mono uppercase block">الشعلة المتواصلة</span>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{streakDays} أيام</span>
              </div>
            </div>
          </div>

          {/* Core Accomplishment Pillars */}
          <div className="grid grid-cols-2 gap-3 py-1">
            {/* Prayers */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>الصلوات المكتوبة</span>
              </div>
              <span className={`font-mono font-black text-zinc-100 ${hideWorshipDetails ? 'text-xs text-emerald-400/90' : 'text-xl'}`}>
                {hideWorshipDetails ? '🔒 سريرة خبيئة' : `${onTimePrayers} / 5`}
              </span>
            </div>

            {/* Wird */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>الورد القرآني</span>
              </div>
              <span className={`font-mono font-black text-zinc-100 ${hideWorshipDetails ? 'text-xs text-amber-400/90' : 'text-xl'}`}>
                {hideWorshipDetails ? (
                  '🔒 سريرة خبيئة'
                ) : (
                  <>
                    {quranPages} <span className="text-xs text-zinc-400 font-normal">صفحة</span>
                  </>
                )}
              </span>
            </div>

            {/* Focus */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>التركيز العميق</span>
              </div>
              <span className="text-xl font-mono font-black text-zinc-100">
                {focusMinutes} <span className="text-xs text-zinc-400 font-normal">دقيقة</span>
              </span>
            </div>

            {/* XP Points */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold mb-1">
                <Award className="w-3.5 h-3.5" />
                <span>نقاط الشرف</span>
              </div>
              <span className="text-xl font-mono font-black text-purple-300">+{totalPoints}</span>
            </div>
          </div>

          {/* Inspirational Golden Seal Quote */}
          <div className="pt-2 border-t border-dashed border-zinc-800 text-center">
            <p className="text-[11px] text-amber-300/80 font-serif italic">
              "الحمد لله الذي بنعمته تتم الصالحات • أستغفر الله من التقصير والسهو"
            </p>
          </div>
        </div>

        {/* Sacred Tazkiyah Privacy Shield Toggle */}
        <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs z-10">
          <span className="text-zinc-300 font-medium flex items-center gap-1.5">
            <span>🛡️</span>
            <span>حراسة الإخلاص والسرائر (إخفاء أرقام العبادات عند المشاركة)</span>
          </span>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setHideWorshipDetails(!hideWorshipDetails);
            }}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
              hideWorshipDetails ? 'bg-emerald-600' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                hideWorshipDetails ? 'end-1' : 'start-1'
              }`}
            />
          </button>
        </div>

        {/* Copy & Share Actions */}
        <div className="w-full flex items-center gap-3 z-10">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-zinc-950" />
                <span>تم النسخ بنجاح! جاهز للمشاركة</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>نسخ تذكرة الحصاد للمشاركة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
