import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { triggerCelebrationConfetti } from '../../utils/gamification';
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
    } catch (_) {}
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
      } catch (_) {}
      return updated;
    });
  };

  // Persistent Gratitude Note state
  const [gratitudeNote, setGratitudeNote] = useState(() => {
    try {
      return localStorage.getItem('midmar_gratitude_note') || '';
    } catch (_) {
      return '';
    }
  });
  const [isGratitudeSaved, setIsGratitudeSaved] = useState(false);

  const handleGratitudeChange = (val: string) => {
    setGratitudeNote(val);
    try {
      localStorage.setItem('midmar_gratitude_note', val);
      setIsGratitudeSaved(true);
      setTimeout(() => setIsGratitudeSaved(false), 2000);
    } catch (_) {}
  };

  useEffect(() => {
    triggerCelebrationConfetti();
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
  }, []);

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-emerald-300/80 dark:border-emerald-500/30 text-center space-y-6 shadow-xl transition-colors duration-200">
      {/* Trophy Icon */}
      <div className="relative inline-flex items-center justify-center">
        <div className="w-24 h-24 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-subtle-float shadow-lg shadow-emerald-500/10">
          <Trophy className="w-12 h-12" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 p-2 rounded-2xl bg-amber-500 text-white shadow-md">
          <Award className="w-4 h-4" />
        </div>
      </div>

      {/* Main Cognitive Reassurance Header */}
      <div className="space-y-2 max-w-lg mx-auto">
        <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
          {t('station_6_badge')}
        </span>
        <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-100">
          {t('grand_reward_heading')}
        </h2>
        <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
          {t('grand_reward_desc')}
        </p>
      </div>

      {/* Score and Stats Pill */}
      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-center shadow-2xs">
          <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-1">
            <Flame className="w-3.5 h-3.5 fill-emerald-500 dark:fill-emerald-400" />
            <span>{t('current_streak')}</span>
          </div>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-100">
            <bdi dir="ltr">{streakDays}</bdi> {t('days_label')}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>{t('points_label')}</span>
          </div>
          <span className="text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
            <bdi dir="ltr">{totalPoints}</bdi>
          </span>
        </div>
      </div>

      {/* Daily Pride Ticket Spotlight Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-purple-500/10 border-2 border-amber-500/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3.5 text-start">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-zinc-950 flex items-center justify-center shadow-md shrink-0">
            <Ticket className="w-6 h-6 text-zinc-950" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
              {isAr ? 'تذكرة فخر اليوم الرسمية للمشاركة' : 'Official Daily Pride Ticket'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
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
          className="tap-spring w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 whitespace-nowrap"
        >
          <Ticket className="w-4 h-4" />
          <span>{isAr ? 'عرض تذكرة الفخر' : 'View Pride Ticket'}</span>
        </button>
      </div>

      {/* Real-Life Reward Marketplace Spotlight Card ("اشتري لنفسك كذا 🎁") */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50/80 via-emerald-50/70 to-teal-50/80 dark:from-amber-950/20 dark:via-emerald-950/20 dark:to-teal-950/10 border-2 border-emerald-300 dark:border-emerald-700/60 shadow-md text-start space-y-4 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-500 text-white flex items-center justify-center shadow-md shrink-0 transition-transform duration-200 hover:rotate-6">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? 'متجر المكافآت الواقعية: استبدل نقاطك' : 'Real-Life Reward Store'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                  {isAr ? 'بلا تأنيب ضمير' : 'Guilt-Free'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                {isAr
                  ? 'حوّل نقاط إنجازك اليومية إلى وجبة لذيذة، ملابس جديدة، قهوة فاخرة، كتاب، أو ملحق تقني!'
                  : 'Redeem your hard-earned points for cheat meals, new clothes, specialty coffee, or gadgets!'}
              </p>
            </div>
          </div>

          <div className="flex items-center sm:flex-col items-start sm:items-end justify-between sm:justify-center shrink-0 bg-white/90 dark:bg-zinc-900/90 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              {isAr ? 'الرصيد المتاح للصرف:' : 'Spendable Balance:'}
            </span>
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              <bdi dir="ltr">{spendablePoints}</bdi> {isAr ? 'نقطة' : 'pts'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-200/70 dark:border-emerald-800/40">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
              className="tap-spring w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30 transition-transform active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isAr ? 'افتح متجر المكافآت واستبدل الآن' : 'Open Rewards Store'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Grid for Sleep Hygiene & Gratitude */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto items-stretch">
        {/* Sleep Hygiene Protocol Card with Interactive Persistence */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-start space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Moon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
                    className={`flex items-center gap-2.5 text-xs cursor-pointer p-2.5 rounded-2xl border transition-all tap-spring active:scale-98 ${
                      isChecked
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-slate-800 dark:text-zinc-200'
                        : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
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

        {/* Evening Gratitude Entry with Real-Time Feedback */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-start space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                <span>{t('gratitude_title')}</span>
              </h4>
              {isGratitudeSaved && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
                  <Check className="w-3 h-3" />
                  <span>{isAr ? 'تم الحفظ' : 'Saved'}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
              {t('gratitude_desc')}
            </p>
          </div>
          <input
            type="text"
            placeholder={t('gratitude_placeholder')}
            value={gratitudeNote}
            onChange={(e) => handleGratitudeChange(e.target.value)}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-amber-500 shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* Restart or Review Actions */}
      <div className="pt-2 flex flex-wrap justify-center gap-3">
        {onOpenEvaluation && (
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenEvaluation();
            }}
            className="tap-spring py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{isAr ? 'عرض تقرير وتقييم اليوم' : 'View Daily Evaluation'}</span>
          </button>
        )}

        <button
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateSprintCelebration();
            triggerCelebrationConfetti();
          }}
          className="tap-spring py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20"
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
          className="tap-spring py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('restart_day')}</span>
        </button>
      </div>
    </div>
  );
};
