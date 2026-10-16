import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Lightbulb,
  Star,
  CheckCircle,
  Save,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Anchor,
} from 'lucide-react';
import { speechService } from '../../services/speechService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { ZeroTypingChips, ZERO_TYPING_PRESETS } from '../common/ZeroTypingChips';
import { MizanMuhasabahCard } from '../spiritual/MizanMuhasabahCard';
import confetti from 'canvas-confetti';
import { getBiologicalDate, upsertDailyLog, triggerCelebrationConfetti } from '../../utils/gamification';

interface RetrospectiveCheckinViewProps {
  isCompleted: boolean;
  onCompleteStation: () => void;
  onNextStation: () => void;
  voiceNotes: string;
  goldenNugget: string;
  onSaveRetrospective: (voiceNotes: string, goldenNugget: string) => void;
  onOpenEvaluation?: () => void;
  onRewardToast?: (msg: string) => void;
}

export const RetrospectiveCheckinView: React.FC<RetrospectiveCheckinViewProps> = ({
  isCompleted,
  onCompleteStation,
  onNextStation,
  voiceNotes: initialVoiceNotes,
  goldenNugget: initialGoldenNugget,
  onSaveRetrospective,
  onOpenEvaluation,
  onRewardToast,
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState(initialVoiceNotes || '');
  const [goldenNuggetText, setGoldenNuggetText] = useState(initialGoldenNugget || '');
  const [dayRating, setDayRating] = useState<number>(() =>
    Number(localStorage.getItem('midmar_day_rating') || '4')
  );
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const [voiceError, setVoiceError] = useState<string | null>(null);

  useEffect(() => {
    setSpeechSupported(speechService.isSupported());
  }, []);

  const handleToggleVoice = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
    } else {
      if (!speechSupported) {
        setVoiceError(language === 'ar' ? 'ميزة التعرف على الصوت غير مدعومة في متصفحك الحالي، يمكنك الكتابة يدوياً.' : 'Voice recognition is not supported in this browser. Please type manually.');
        setTimeout(() => setVoiceError(null), 4000);
        return;
      }

      setIsRecording(true);
      speechService.startListening(
        (transcript) => {
          setVoiceText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        (error) => {
          console.warn('Speech error:', error);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );
    }
  };

  const handleSave = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    onSaveRetrospective(voiceText, goldenNuggetText);
    try {
      const wins = [
        localStorage.getItem('midmar_win_1') || '',
        localStorage.getItem('midmar_win_2') || '',
        localStorage.getItem('midmar_win_3') || '',
      ].filter(Boolean);
      const tomorrowAnchor = localStorage.getItem('midmar_tomorrow_anchor') || '';
      upsertDailyLog(getBiologicalDate(), {
        voiceNotes: voiceText,
        goldenNugget: goldenNuggetText,
        moodRating: dayRating,
        notes: [wins.length ? `Wins: ${wins.join(' | ')}` : '', tomorrowAnchor ? `Anchor: ${tomorrowAnchor}` : '']
          .filter(Boolean)
          .join(' • '),
      } as any).catch(() => {});
    } catch {}
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleComplete = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleSave();
    soundSynth.playCompletionChime();
    haptic.vibrateSprintCelebration();
    try {
      const x = e.clientX ? e.clientX / window.innerWidth : 0.5;
      const y = e.clientY ? e.clientY / window.innerHeight : 0.6;
      confetti({ disableForReducedMotion: true,
        particleCount: 55,
        spread: 65,
        origin: { x, y },
        colors: ['#1eb814', '#bce8c2', '#fde6d8', '#e2defc'],
      });
    } catch {
      triggerCelebrationConfetti();
    }
    onCompleteStation();
  };

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-4 transition-colors duration-200">
      {/* Habitline Obsidian Station Hero Banner */}
      <div className="celestial-obsidian-stage rounded-[28px] text-white p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-habit-green-ink text-white flex items-center justify-center shadow-lg shadow-[#1eb814]/25 shrink-0">
            <Mic className="w-6 h-6" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-bold border border-white/10">
                {isAr ? 'المحطة 7 من 8' : 'Station 7 of 8'}
              </span>
              <span className="text-[11px] font-mono text-[#bce8c2] font-bold uppercase tracking-wider tabular-nums">
                {t('station_5_badge')} • <bdi dir="ltr">21:30 - 22:00</bdi>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">
              {t('station_5_heading')}
            </h2>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
          {isCompleted && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-[#bce8c2] text-zinc-950 font-bold shadow-xs">
              {isAr ? 'مكتملة اليوم ✓' : 'Completed ✓'}
            </span>
          )}
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-[#bce8c2] text-zinc-950 font-mono font-bold tabular-nums shadow-sm">
            +10 XP
          </span>
        </div>
      </div>

      {/* Mizan Al-Muhasabah: Classical Islamic Daily Audit & Purity Index */}
      <MizanMuhasabahCard onRewardToast={onRewardToast} />

      {/* Responsive 2-Column Grid for Retrospective Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Voice Journal (Soft Lavender) & Golden Nugget (Soft Amber) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Voice-to-Text Card — Habitline Soft Lavender Surface */}
          <div className="bento-3d-lavender p-5 sm:p-6 rounded-[28px] border border-white/50 dark:border-indigo-500/25 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-1.5 flex-wrap">
                  <span>{t('voice_question')}</span>
                  <span className="text-[11px] font-medium text-indigo-900 dark:text-indigo-300">
                    {t('voice_subtext')}
                  </span>
                </h3>
                <p className="text-xs text-zinc-700 dark:text-zinc-300">
                  {t('voice_desc')}
                </p>
              </div>

              {/* Voice Record Button */}
              <button
                onClick={handleToggleVoice}
                className={`p-3.5 rounded-2xl transition-all cursor-pointer shadow-md tap-spring active:scale-90 shrink-0 ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30 ring-4 ring-rose-500/20'
                    : 'bg-[#5448e8] hover:bg-[#4538d8] text-white shadow-[#5448e8]/25'
                }`}
                title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            {/* Status indicator with animated audio waves */}
            {isRecording && (
              <div className="p-3.5 rounded-[20px] bg-[#fce2e6] dark:bg-rose-950/45 border border-rose-400/40 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-end gap-1 h-5">
                    <span className="w-1 bg-rose-600 rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
                    <span className="w-1 bg-rose-600 rounded-full animate-[bounce_0.8s_infinite_200ms] h-5" />
                    <span className="w-1 bg-rose-600 rounded-full animate-[bounce_0.5s_infinite_300ms] h-4" />
                    <span className="w-1 bg-rose-600 rounded-full animate-[bounce_0.7s_infinite_150ms] h-2" />
                    <span className="w-1 bg-rose-600 rounded-full animate-[bounce_0.9s_infinite_250ms] h-5" />
                  </div>
                  <span className="text-xs text-rose-950 dark:text-rose-200 font-bold">
                    {language === 'ar' ? 'جاري الاستماع وتفريغ الصوت فورا...' : 'Listening actively & transcribing...'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-rose-800 dark:text-rose-300 font-bold tabular-nums">
                  🎙️ {voiceText.trim() ? voiceText.trim().split(/\s+/).length : 0} {language === 'ar' ? 'كلمة' : 'words'}
                </span>
              </div>
            )}

            {/* Voice Error Banner */}
            {voiceError && (
              <div className="p-3 rounded-[18px] bg-[#fde6d8] dark:bg-amber-950/45 border border-amber-400/35 text-amber-950 dark:text-amber-200 text-xs font-medium animate-fade-in">
                ⚠️ {voiceError}
              </div>
            )}

            {/* Text Area */}
            <textarea
              rows={4}
              placeholder={t('voice_placeholder')}
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-indigo-400/25 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#5448e8] leading-relaxed resize-none shadow-2xs"
            />

            {/* Live Words & 1-Tap Extract to Golden Nugget */}
            {voiceText.trim().length > 0 && (
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono tabular-nums">
                  {voiceText.trim().split(/\s+/).length} {language === 'ar' ? 'كلمة مفرغة' : 'words transcribed'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    const sentences = voiceText.split(/[.\n!?،]/).map((s) => s.trim()).filter(Boolean);
                    const best = sentences[sentences.length - 1] || voiceText;
                    setGoldenNuggetText(best);
                    if (onRewardToast) {
                      onRewardToast(language === 'ar' ? '💡 تم استخراج فكرة اليوم الذهبية من حديثك الصوتي!' : 'Extracted golden nugget from your voice!');
                    }
                  }}
                  className="text-[11px] font-bold text-[#5448e8] dark:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>💡</span>
                  <span>{language === 'ar' ? 'استخراج كفكرة ذهبية لليوم' : 'Extract to Golden Nugget'}</span>
                </button>
              </div>
            )}

            {/* Zero-Typing Chips for Reflections */}
            <ZeroTypingChips
              label={language === 'ar' ? 'اقتراحات للمراجعة النفسية' : 'Quick Reflection Chips'}
              chips={ZERO_TYPING_PRESETS.reflections}
              onSelect={(chip) => setVoiceText((prev) => (prev ? `${prev} • ${chip}` : chip))}
            />
          </div>

          {/* One Golden Nugget Field — Habitline Soft Amber Surface */}
          <div className="bento-3d-amber p-5 sm:p-6 rounded-[28px] border border-white/50 dark:border-amber-500/25 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-habit-flame-ink text-white flex items-center justify-center shadow-xs shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-100">
                  {t('golden_nugget_title')}
                </h3>
                <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                  {t('golden_nugget_desc')}
                </p>
              </div>
            </div>

            <input
              type="text"
              placeholder={t('golden_nugget_placeholder')}
              value={goldenNuggetText}
              onChange={(e) => setGoldenNuggetText(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-400/30 dark:border-zinc-700 text-xs text-zinc-950 dark:text-amber-200 placeholder:text-zinc-400 focus:outline-none focus:border-[#ff5500] font-medium shadow-2xs"
            />

            {/* Zero-Typing Chips for Golden Nugget */}
            <ZeroTypingChips
              chips={ZERO_TYPING_PRESETS.goldenNuggets}
              onSelect={(chip) => setGoldenNuggetText(chip)}
            />
          </div>
        </div>

        {/* Right Column: 3 Micro-Wins (Soft Mint) + Ivy Lee Tomorrow Anchor (Crisp White) + Rating */}
        <div className="lg:col-span-6 space-y-4">
          {/* 3 Daily Micro-Wins — Habitline Soft Mint Surface */}
          <div className="bento-3d-mint p-5 sm:p-6 rounded-[28px] border border-white/50 dark:border-emerald-500/25 space-y-3.5">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-habit-green-ink text-white flex items-center justify-center shadow-2xs">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span>{t('daily_wins_title')}</span>
            </h3>
            <div className="space-y-2.5">
              {[1, 2, 3].map((num) => (
                <input
                  key={num}
                  id={`midmar-win-input-${num}`}
                  type="text"
                  placeholder={(t as any)[`win_${num}_placeholder`] || `Win ${num}...`}
                  defaultValue={localStorage.getItem(`midmar_win_${num}`) || ''}
                  onChange={(e) => localStorage.setItem(`midmar_win_${num}`, e.target.value)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-[#1eb814]/25 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#1eb814]"
                />
              ))}
            </div>

            {/* Zero-Typing Chips for Daily Wins */}
            <ZeroTypingChips
              label={language === 'ar' ? 'انتصارات شائعة بنقرة واحدة' : 'Common Wins (1-Tap)'}
              chips={ZERO_TYPING_PRESETS.wins}
              onSelect={(chip) => {
                for (const num of [1, 2, 3]) {
                  const val = localStorage.getItem(`midmar_win_${num}`);
                  if (!val) {
                    localStorage.setItem(`midmar_win_${num}`, chip);
                    const el = document.getElementById(`midmar-win-input-${num}`) as HTMLInputElement;
                    if (el) el.value = chip;
                    break;
                  }
                }
              }}
            />
          </div>

          {/* Tomorrow Morning Non-Negotiable Anchor Task (Ivy Lee Method) — Crisp White Bento */}
          <div className="p-5 sm:p-6 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 space-y-3">
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#141517] dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-2xs">
                  <Anchor className="w-4 h-4" />
                </div>
                <span>{t('tomorrow_anchor_title')}</span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t('tomorrow_anchor_desc')}
              </p>
            </div>
            <input
              id="tomorrow-anchor-input"
              type="text"
              placeholder={t('tomorrow_anchor_placeholder')}
              defaultValue={localStorage.getItem('midmar_tomorrow_anchor') || ''}
              onChange={(e) => localStorage.setItem('midmar_tomorrow_anchor', e.target.value)}
              className="w-full py-3 px-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold focus:outline-hidden focus:border-[#1eb814] shadow-2xs"
            />

            {/* Zero-Typing Chips for Tomorrow Anchor */}
            <ZeroTypingChips
              chips={ZERO_TYPING_PRESETS.anchors}
              onSelect={(chip) => {
                localStorage.setItem('midmar_tomorrow_anchor', chip);
                const el = document.getElementById('tomorrow-anchor-input') as HTMLInputElement;
                if (el) el.value = chip;
              }}
            />
          </div>

          {/* Day Rating (1 to 5 Stars) — Habitline Soft Amber */}
          <div className="pride-golden-ticket p-4 sm:p-5 rounded-[28px] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">
              {t('day_rating_title')}
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                return (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star}/5`}
                    aria-pressed={star <= dayRating}
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      setDayRating(star);
                      localStorage.setItem('midmar_day_rating', String(star));
                      upsertDailyLog(getBiologicalDate(), { moodRating: star } as any).catch(() => {});
                      setIsSaved(true);
                      setTimeout(() => setIsSaved(false), 1500);
                    }}
                    className={`min-h-[44px] min-w-[44px] tap-spring p-2 sm:p-2.5 rounded-2xl transition-all active:scale-88 cursor-pointer flex items-center justify-center ${
                      star <= dayRating
                        ? 'text-[#ff5500] bg-white dark:bg-zinc-900 shadow-xs'
                        : 'text-amber-900/55 dark:text-amber-200/50 hover:text-[#ff5500]'
                    }`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Save & Complete Actions — Habitline Pill CTA */}
      <div className="p-5 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <button
          onClick={handleSave}
          className="tap-spring py-2.5 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 self-start sm:self-center"
        >
          <Save className="w-4 h-4" />
          <span>{isSaved ? 'تم الحفظ ✔' : t('save_draft')}</span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onOpenEvaluation && (
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                onOpenEvaluation();
              }}
              className="tap-spring py-2.5 px-4 rounded-full bg-[#fde6d8] hover:bg-[#fbd5be] dark:bg-amber-950/45 text-zinc-950 dark:text-amber-200 border border-amber-400/35 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
              title={language === 'ar' ? 'عرض تقرير وتقييم اليوم والأسبوع' : 'View Evaluation Report'}
            >
              <Trophy className="w-4 h-4 text-[#ff5500]" />
              <span className="hidden sm:inline">{language === 'ar' ? 'تقرير وتقييم اليوم' : 'Evaluation Report'}</span>
            </button>
          )}

          {!isCompleted ? (
            <button
              onClick={handleComplete}
              className="tap-spring py-3 px-6 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#1eb814]/25 active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t('finish_day_reward')} (+10 XP)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                onNextStation();
              }}
              className="tap-spring py-3 px-6 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <span>{t('station_6_title')}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
