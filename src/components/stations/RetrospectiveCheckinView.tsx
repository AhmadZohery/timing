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

  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState(initialVoiceNotes || '');
  const [goldenNuggetText, setGoldenNuggetText] = useState(initialGoldenNugget || '');
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
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleComplete = () => {
    handleSave();
    onCompleteStation();
  };

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="p-4 rounded-xl bg-gradient-to-l from-teal-50 via-white to-white dark:from-teal-950/40 dark:via-zinc-900 dark:to-zinc-900 border border-teal-200 dark:border-teal-500/20 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-teal-700 dark:text-teal-400 font-semibold uppercase tracking-wider">
                {t('station_5_badge')}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {t('station_5_heading')}
              </h2>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-500/10 text-teal-800 dark:text-teal-400 font-mono font-bold shadow-2xs">
            +10
          </span>
        </div>
      </div>

      {/* Mizan Al-Muhasabah: Classical Islamic Daily Audit & Purity Index */}
      <MizanMuhasabahCard onRewardToast={onRewardToast} />

      {/* Responsive 2-Column Grid for Retrospective Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Voice Journal & Golden Nugget */}
        <div className="lg:col-span-6 space-y-4">
          {/* Voice-to-Text Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>{t('voice_question')}</span>
                  <span className="text-[11px] font-normal text-slate-500 dark:text-zinc-400">
                    {t('voice_subtext')}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {t('voice_desc')}
                </p>
              </div>

              {/* Voice Record Button */}
              <button
                onClick={handleToggleVoice}
                className={`p-3.5 rounded-2xl transition-all cursor-pointer shadow-md tap-spring active:scale-90 ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30 ring-4 ring-rose-500/20'
                    : 'bg-gradient-to-tr from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white shadow-teal-600/25 border border-white/20'
                }`}
                title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            {/* Status indicator with animated audio waves */}
            {isRecording && (
              <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-end gap-1 h-5">
                    <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
                    <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.8s_infinite_200ms] h-5" />
                    <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.5s_infinite_300ms] h-4" />
                    <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.7s_infinite_150ms] h-2" />
                    <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.9s_infinite_250ms] h-5" />
                  </div>
                  <span className="text-xs text-rose-700 dark:text-rose-300 font-bold">
                    {language === 'ar' ? 'جاري الاستماع وتفريغ الصوت فورا...' : 'Listening actively & transcribing...'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-black">
                  🎙️ {voiceText.trim() ? voiceText.trim().split(/\s+/).length : 0} {language === 'ar' ? 'كلمة' : 'words'}
                </span>
              </div>
            )}

            {/* Voice Error Banner */}
            {voiceError && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-medium animate-fade-in">
                ⚠️ {voiceError}
              </div>
            )}

            {/* Text Area */}
            <textarea
              rows={4}
              placeholder={t('voice_placeholder')}
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-teal-500 leading-relaxed resize-none shadow-2xs"
            />

            {/* Live Words & 1-Tap Extract to Golden Nugget */}
            {voiceText.trim().length > 0 && (
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10px] text-slate-400 font-mono">
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
                  className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer flex items-center gap-1"
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

          {/* One Golden Nugget Field */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {t('golden_nugget_title')}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {t('golden_nugget_desc')}
                </p>
              </div>
            </div>

            <input
              type="text"
              placeholder={t('golden_nugget_placeholder')}
              value={goldenNuggetText}
              onChange={(e) => setGoldenNuggetText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-amber-900 dark:text-amber-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-medium shadow-2xs"
            />

            {/* Zero-Typing Chips for Golden Nugget */}
            <ZeroTypingChips
              chips={ZERO_TYPING_PRESETS.goldenNuggets}
              onSelect={(chip) => setGoldenNuggetText(chip)}
            />
          </div>
        </div>

        {/* Right Column: 3 Micro-Wins + Rating + Ivy Lee Tomorrow Anchor */}
        <div className="lg:col-span-6 space-y-4">
          {/* 3 Daily Micro-Wins */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('daily_wins_title')}</span>
            </h3>
            <div className="space-y-2">
              {[1, 2, 3].map((num) => (
                <input
                  key={num}
                  id={`midmar-win-input-${num}`}
                  type="text"
                  placeholder={(t as any)[`win_${num}_placeholder`] || `Win ${num}...`}
                  defaultValue={localStorage.getItem(`midmar_win_${num}`) || ''}
                  onChange={(e) => localStorage.setItem(`midmar_win_${num}`, e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-emerald-500"
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

          {/* Tomorrow Morning Non-Negotiable Anchor Task (Ivy Lee Method) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50/80 to-emerald-50/70 dark:from-teal-950/20 dark:to-emerald-950/20 border border-teal-200 dark:border-teal-800/40 space-y-2.5 shadow-xs">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{t('tomorrow_anchor_title')}</span>
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                {t('tomorrow_anchor_desc')}
              </p>
            </div>
            <input
              id="tomorrow-anchor-input"
              type="text"
              placeholder={t('tomorrow_anchor_placeholder')}
              defaultValue={localStorage.getItem('midmar_tomorrow_anchor') || ''}
              onChange={(e) => localStorage.setItem('midmar_tomorrow_anchor', e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-teal-300 dark:border-teal-800 text-xs text-slate-900 dark:text-zinc-100 font-semibold focus:outline-hidden focus:border-teal-500 shadow-2xs"
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

          {/* Day Rating (1 to 5 Stars) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              {t('day_rating_title')}
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const currentRating = Number(localStorage.getItem('midmar_day_rating') || '4');
                return (
                  <button
                    key={star}
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      localStorage.setItem('midmar_day_rating', String(star));
                      setIsSaved(true);
                      setTimeout(() => setIsSaved(false), 1500);
                    }}
                    className={`tap-spring p-2 sm:p-2.5 rounded-xl transition-all active:scale-88 cursor-pointer ${
                      star <= currentRating
                        ? 'text-amber-500 bg-amber-500/15 dark:bg-amber-500/20 shadow-xs'
                        : 'text-slate-300 dark:text-zinc-700 hover:text-amber-400'
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

      {/* Save & Complete Actions */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs">
        <button
          onClick={handleSave}
          className="tap-spring py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>{isSaved ? 'تم الحفظ ✔' : t('save_draft')}</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenEvaluation && (
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                onOpenEvaluation();
              }}
              className="tap-spring py-2.5 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
              title={language === 'ar' ? 'عرض تقرير وتقييم اليوم والأسبوع' : 'View Evaluation Report'}
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">{language === 'ar' ? 'تقرير وتقييم اليوم' : 'Evaluation Report'}</span>
            </button>
          )}

          {!isCompleted ? (
            <button
              onClick={handleComplete}
              className="tap-spring py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/20 active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t('finish_day_reward')} (+10)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                onNextStation();
              }}
              className="tap-spring py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
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
