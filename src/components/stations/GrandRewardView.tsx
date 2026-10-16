import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Flame,
  Moon,
  RotateCcw,
  ShoppingBag,
  Heart,
  PartyPopper,
  Ticket,
  Gift,
  Check,
  Clock,
} from 'lucide-react';
import { triggerCelebrationConfetti, getBiologicalDate, upsertDailyLog } from '../../utils/gamification';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface GrandRewardViewProps {
  totalPoints: number;
  streakDays: number;
  onRestartNewDay: () => void;
  onOpenRewardsModal?: () => void;
  onOpenEvaluation?: () => void;
  onOpenPrideTicket?: () => void;
  spentPoints?: number;
}

export const GrandRewardView: React.FC<GrandRewardViewProps> = ({
  totalPoints,
  streakDays,
  onRestartNewDay,
  onOpenRewardsModal,
  onOpenEvaluation,
  onOpenPrideTicket,
  spentPoints = 0,
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const spendablePoints = Math.max(0, totalPoints - (spentPoints || 0));

  // Persistent Sleep Hygiene Checklist state
  const [sleepChecks, setSleepChecks] = useState<boolean[]>(() => {
    try {
      const saved = localStorage.getItem('midmar_sleep_hygiene_checks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [true, true, true];
  });

  const toggleSleepCheck = (index: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSleepChecks((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      try {
        localStorage.setItem('midmar_sleep_hygiene_checks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Persistent Gratitude Note state
  const [gratitudeNote, setGratitudeNote] = useState(() => {
    try {
      return localStorage.getItem('midmar_gratitude_note') || '';
    } catch {
      return '';
    }
  });
  const [isGratitudeSaved, setIsGratitudeSaved] = useState(false);

  const handleGratitudeChange = (val: string) => {
    setGratitudeNote(val);
    try {
      localStorage.setItem('midmar_gratitude_note', val);
      upsertDailyLog(getBiologicalDate(), { gratitudeNote: val } as any).catch(() => {});
      setIsGratitudeSaved(true);
      setTimeout(() => setIsGratitudeSaved(false), 2000);
    } catch {}
  };

  useEffect(() => {
    triggerCelebrationConfetti();
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
  }, []);

  return (
    <div className="space-y-4">
      {/* Unified Obsidian Station Hero Banner */}
      <div className="celestial-obsidian-stage rounded-[28px] text-white p-4 sm:p-5 border border-white/10 shadow-lg transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-habit-green-ink text-white flex items-center justify-center shadow-md shadow-[#1eb814]/30 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="space-y-1 text-start">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-200 border border-white/10">
                  {isAr ? 'المحطة 8 من 8' : 'Station 8 of 8'}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#1eb814]" />
                  <bdi dir="ltr">22:00 - 22:30</bdi>
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#bce8c2] text-[#0c4a12] flex items-center gap-1 shadow-xs">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>{isAr ? 'مكتملة اليوم ✓' : 'Completed Today ✓'}</span>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {t('grand_reward_heading')}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t('grand_reward_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <span className="px-3.5 py-1.5 rounded-full bg-[#bce8c2] text-[#0c4a12] font-bold font-mono text-xs tabular-nums shadow-sm flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#1eb814]" />
              <bdi dir="ltr">{totalPoints} XP</bdi>
            </span>
          </div>
        </div>
      </div>

      {/* Main Celebration Showcase Surface */}
      <div className="p-6 sm:p-8 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 text-center space-y-6 transition-colors duration-200">
        {/* Trophy Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-[28px] bg-[#d4f5dc] dark:bg-emerald-500/15 border-2 border-[#1eb814]/40 flex items-center justify-center text-[#1eb814] dark:text-emerald-400 animate-subtle-float shadow-lg shadow-[#1eb814]/15">
            <Trophy className="w-12 h-12" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 p-2 rounded-2xl bg-habit-flame-ink text-white shadow-md">
            <Award className="w-4 h-4" />
          </div>
        </div>

        {/* Main Cognitive Reassurance Header */}
        <div className="space-y-2 max-w-lg mx-auto">
          <span className="inline-block text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-[#d4f5dc] dark:bg-emerald-950/60 text-[#0c4a12] dark:text-emerald-300 uppercase tracking-widest">
            {t('station_6_badge')}
          </span>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('grand_reward_heading')}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t('grand_reward_desc')}
          </p>
        </div>

        {/* Score and Stats Bento Pills */}
        <div className="grid grid-cols-2 gap-3.5 max-w-sm mx-auto">
          <div className="bento-3d-mint p-4 rounded-[24px] border border-white/60 dark:border-[#1eb814]/30 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[#0c4a12] dark:text-emerald-300 text-xs font-bold mb-1">
              <Flame className="w-4 h-4 text-[#ff5500] fill-[#ff5500]" />
              <span>{t('current_streak')}</span>
            </div>
            <span className="text-2xl font-bold font-mono tabular-nums text-[#0c4a12] dark:text-emerald-100">
              <bdi dir="ltr">{streakDays}</bdi> {t('days_label')}
            </span>
          </div>

          <div className="bento-3d-amber p-4 rounded-[24px] border border-white/60 dark:border-amber-400/35 text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-950 dark:text-amber-300 text-xs font-bold mb-1">
              <Award className="w-4 h-4 text-[#ff5500]" />
              <span>{t('points_label')}</span>
            </div>
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-950 dark:text-amber-200">
              <bdi dir="ltr">{totalPoints}</bdi>
            </span>
          </div>
        </div>

        {/* Daily Pride Ticket Spotlight Card — Golden Ticket Surface */}
        <div className="pride-golden-ticket p-5 sm:p-6 rounded-[28px] flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3.5 text-start">
            <div className="w-12 h-12 rounded-2xl bg-habit-flame-ink text-white flex items-center justify-center shadow-md shadow-[#ff5500]/25 shrink-0">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100">
                {isAr ? 'تذكرة فخر اليوم الرسمية للمشاركة' : 'Official Daily Pride Ticket'}
              </h3>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mt-0.5 leading-relaxed">
                {isAr
                  ? 'بطاقة بصرية ملكية تلخص صلواتك، ووردك القرآني، ودقائق تركيزك لمشاركتها مع من تحب'
                  : 'Luxury boarding pass summarizing your prayers, wird, and focus minutes to share'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              if (onOpenPrideTicket) onOpenPrideTicket();
            }}
            className="bento-press w-full sm:w-auto py-3 px-6 rounded-full bg-[#141517] dark:bg-white hover:opacity-90 text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all whitespace-nowrap"
          >
            <Ticket className="w-4 h-4" />
            <span>{isAr ? 'عرض تذكرة الفخر' : 'View Pride Ticket'}</span>
          </button>
        </div>

        {/* Real-Life Reward Marketplace Spotlight Card — Soft Mint Surface */}
        <div className="bento-3d-mint p-6 rounded-[28px] border border-white/60 dark:border-emerald-700/50 text-start space-y-4 max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-habit-green-ink text-white flex items-center justify-center shadow-md shadow-[#1eb814]/25 shrink-0 transition-transform duration-200 hover:rotate-6">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#0c4a12] dark:text-emerald-100">
                    {isAr ? 'متجر المكافآت الواقعية: استبدل نقاطك' : 'Real-Life Reward Store'}
                  </h3>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-habit-green-ink text-white shadow-2xs">
                    {isAr ? 'بلا تأنيب ضمير' : 'Guilt-Free'}
                  </span>
                </div>
                <p className="text-xs text-[#0c4a12]/80 dark:text-emerald-200/80 mt-1 leading-relaxed">
                  {isAr
                    ? 'حوّل نقاط إنجازك اليومية إلى وجبة لذيذة، ملابس جديدة، قهوة فاخرة، كتاب، أو ملحق تقني!'
                    : 'Redeem your hard-earned points for cheat meals, new clothes, specialty coffee, or gadgets!'}
                </p>
              </div>
            </div>

            <div className="flex items-center sm:flex-col items-start sm:items-end justify-between sm:justify-center shrink-0 bg-white/90 dark:bg-zinc-900/90 px-4 py-3 rounded-2xl border border-[#1eb814]/25 dark:border-emerald-800/60 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                {isAr ? 'الرصيد المتاح للصرف:' : 'Spendable Balance:'}
              </span>
              <span className="text-xl font-bold font-mono tabular-nums text-habit-green-ink dark:text-emerald-400">
                <bdi dir="ltr">{spendablePoints}</bdi> {isAr ? 'نقطة' : 'pts'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1eb814]/20 dark:border-emerald-800/40">
            <div className="flex items-center gap-2 text-xs text-[#0c4a12] dark:text-emerald-200">
              <Check className="w-4 h-4 text-[#1eb814] shrink-0" />
              <span className="font-medium">
                {isAr
                  ? 'أنت تعبت وأنجزت اليوم، واستبدال مكافأتك حق لك دون أي تأثير على سلسلة أيامك.'
                  : 'You worked hard today. Enjoying a real reward is well-earned and preserves your streak.'}
              </span>
            </div>

            {onOpenRewardsModal && (
              <button
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  onOpenRewardsModal();
                }}
                className="bento-press w-full sm:w-auto py-3 px-6 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#1eb814]/25 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isAr ? 'افتح متجر المكافآت واستبدل الآن' : 'Open Rewards Store'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Responsive Grid for Sleep Hygiene (Soft Lavender) & Gratitude (Soft Rose) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto items-stretch">
          {/* Sleep Hygiene Protocol Card with Interactive Persistence */}
          <div className="bento-3d-lavender p-5 rounded-[28px] border border-white/60 dark:border-indigo-500/30 text-start space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#5448e8] text-white flex items-center justify-center shadow-xs">
                  <Moon className="w-3.5 h-3.5" />
                </div>
                <span>{t('sleep_hygiene_title')}</span>
              </h4>
              <div className="space-y-2">
                {[t('sleep_item_1'), t('sleep_item_2'), t('sleep_item_3')].map((item, idx) => {
                  const isChecked = sleepChecks[idx] ?? true;
                  return (
                    <label
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSleepCheck(idx);
                      }}
                      className={`flex items-center gap-2.5 text-xs cursor-pointer p-3 rounded-2xl border transition-all tap-spring active:scale-98 ${
                        isChecked
                          ? 'bg-[#d4f5dc] dark:bg-emerald-950/50 border-[#1eb814]/40 text-[#0c4a12] dark:text-emerald-100 font-medium'
                          : 'bg-white/80 dark:bg-zinc-900/80 border-indigo-200/70 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-habit-green-ink border-habit-green-ink text-white'
                            : 'border-indigo-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="leading-snug">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Evening Gratitude Entry with Real-Time Feedback — Soft Rose Surface */}
          <div className="bento-3d-rose p-5 rounded-[28px] border border-white/60 dark:border-rose-500/30 text-start space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                    <Heart className="w-3.5 h-3.5 fill-white/30" />
                  </div>
                  <span>{t('gratitude_title')}</span>
                </h4>
                {isGratitudeSaved && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#bce8c2] text-[#0c4a12] flex items-center gap-1 animate-fade-in">
                    <Check className="w-3 h-3" />
                    <span>{isAr ? 'تم الحفظ ✓' : 'Saved ✓'}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-rose-900/80 dark:text-rose-200/80 leading-relaxed">
                {t('gratitude_desc')}
              </p>
            </div>
            <input
              type="text"
              placeholder={t('gratitude_placeholder')}
              value={gratitudeNote}
              onChange={(e) => handleGratitudeChange(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-rose-200 dark:border-rose-800/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-rose-500 shadow-2xs transition-colors"
            />
          </div>
        </div>

        {/* Restart or Review Actions — Tactile Habitline Pill CTAs */}
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          {onOpenEvaluation && (
            <button
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                onOpenEvaluation();
              }}
              className="bento-press py-3 px-6 rounded-full bg-habit-flame-ink hover:bg-habit-flame-ink-deep text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#ff5500]/25"
            >
              <Trophy className="w-4 h-4" />
              <span>{isAr ? 'عرض تقرير وتقييم اليوم' : 'View Daily Evaluation'}</span>
            </button>
          )}

          <button
            onClick={(e) => {
              soundSynth.playTactileClick();
              haptic.vibrateSprintCelebration();
              const rect = e.currentTarget.getBoundingClientRect();
              confetti({ disableForReducedMotion: true,
                particleCount: 45,
                spread: 65,
                origin: {
                  x: (rect.left + rect.width / 2) / window.innerWidth,
                  y: (rect.top + rect.height / 2) / window.innerHeight,
                },
              });
              triggerCelebrationConfetti();
            }}
            className="bento-press py-3 px-6 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#1eb814]/25"
          >
            <PartyPopper className="w-4 h-4" />
            <span>{t('new_celebration')}</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onRestartNewDay();
            }}
            className="bento-press py-3 px-6 rounded-full bg-[#141517] dark:bg-zinc-800 hover:opacity-90 text-white dark:text-zinc-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('restart_day')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
