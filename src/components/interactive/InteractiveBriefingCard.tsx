import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Volume2,
  Square,
  ArrowLeft,
  ArrowRight,
  Flame,
  Sun,
  Moon,
} from 'lucide-react';
import type { DailyLog, UserState, StationId } from '../../types';
import { speechService } from '../../services/speechService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { calculatePrayerTimes, getNextPrayer } from '../../utils/prayerCalculator';
import { getTodayWorkRhythm } from '../../utils/workRhythm';

interface InteractiveBriefingCardProps {
  todayLog?: DailyLog;
  userState?: UserState;
  activeStation: StationId;
  onSelectStation: (station: StationId) => void;
  onOpenSleepRest?: () => void;
  onOpenEvaluation?: () => void;
}

export const InteractiveBriefingCard: React.FC<InteractiveBriefingCardProps> = ({
  todayLog,
  userState,
  activeStation: _activeStation,
  onSelectStation,
  onOpenSleepRest: _onOpenSleepRest,
  onOpenEvaluation: _onOpenEvaluation,
}) => {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const now = new Date();
  const currentHour = now.getHours();

  // Work Rhythm
  const rhythm = useMemo(() => {
    return getTodayWorkRhythm(now, userState?.settings?.workRhythmConfig);
  }, [now, userState?.settings?.workRhythmConfig]);

  // Prayer Info
  const prayerInfo = useMemo(() => {
    const pLoc = userState?.settings?.prayerLocation;
    const pTimes = calculatePrayerTimes(
      now,
      pLoc?.latitude ?? 30.0444,
      pLoc?.longitude ?? 31.2357,
      pLoc?.calculationMethod ?? 'egyptian'
    );
    return getNextPrayer(pTimes);
  }, [now, userState?.settings?.prayerLocation]);

  // Dynamically constructed intelligent briefing script
  const briefing = useMemo(() => {
    const streak = userState?.streakDays || 0;
    const isMorning = currentHour >= 4 && currentHour < 12;
    const isAfternoon = currentHour >= 12 && currentHour < 18;
    const isNight = currentHour >= 18 || currentHour < 4;

    let greeting = isMorning
      ? 'صباح النور والبركة'
      : isAfternoon
      ? 'طاب يومك بكل خير'
      : 'مساء السكينة والتجديد';

    let contextNote = '';
    let targetStation: StationId = 'COMMUTE_MORNING';
    let ctaLabel = isAr ? 'ابدأ ورد القرآن 📖' : 'Start Quran 📖';

    if (isMorning) {
      targetStation = 'COMMUTE_MORNING';
      if (rhythm.isRestDay) {
        contextNote = `اليوم ${rhythm.dayNameAr} واحة راحة مستحقة؛ شعلتك محمية، ركّز على سكينة روحك وتجديد نشاطك.`;
        ctaLabel = isAr ? 'استمتع بالراحة 🌴' : 'Enjoy Rest 🌴';
      } else if (rhythm.isHalfDay) {
        contextNote = `اليوم ${rhythm.dayNameAr} نصف يوم عمل ذكي؛ ننهي أهم مهمتين فقط، ثم نستمتع ببقية اليوم.`;
        ctaLabel = isAr ? 'انطلاقة نصف اليوم ⚡' : 'Start Half-Day ⚡';
      } else {
        contextNote = `متبقي على صلاة ${prayerInfo.arabicName} قرابة ${prayerInfo.minutesRemaining} دقيقة. انطلاقتك الصباحية تبدأ بورد سورة البقرة المبارك.`;
        ctaLabel = isAr ? 'ابدأ ورد الصباح 🚀' : 'Start Morning 🚀';
      }
    } else if (isAfternoon) {
      targetStation = 'WORK_MICRO_SPRINT';
      ctaLabel = isAr ? 'بدء شوط التركيز ⚡' : 'Start Focus ⚡';
      contextNote = `طاقتك الآن في ذروة صفائها الذهني؛ شوط تركيز لمدة 20 دقيقة كفيل بحسم أصعب مهامك وبناء زخم إنجازك.`;
    } else if (isNight) {
      targetStation = 'RETROSPECTIVE_CHECKIN';
      ctaLabel = isAr ? 'مراجعة وتقييم اليوم 📊' : 'Review Day 📊';
      contextNote = `حان وقت تفريغ الذهن، وتدوين فكرة اليوم الذهبية، والتهيؤ لسكينة النوم مع سورة الملك.`;
    }

    const spokenText = `${greeting}. لديك شعلة استمرار بلغت ${streak} أيام متواصلة. ${contextNote} استعن بالله، وتذكر أن الإنجاز الحقيقي يبدأ بخطوة صغيرة واثقة.`;

    return {
      greeting,
      contextNote,
      targetStation,
      ctaLabel,
      spokenText,
    };
  }, [currentHour, userState?.streakDays, rhythm, prayerInfo, isAr]);

  // Stop speaking when unmounting
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
    };
  }, []);

  const handleToggleVoiceBriefing = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    if (isPlayingAudio) {
      speechService.stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speechService.speak(
        briefing.spokenText,
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
    }
  };

  const handleCtaClick = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    speechService.stopSpeaking();
    setIsPlayingAudio(false);
    onSelectStation(briefing.targetStation);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-slate-50/80 to-emerald-50/50 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-emerald-950/20 border border-slate-200/90 dark:border-zinc-800 shadow-sm p-4 sm:p-5 backdrop-blur-xl transition-all">
      {/* Subtle Background Radial Accent */}
      <div className="absolute top-0 end-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Avatar & Living Intelligence Greeting */}
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
            currentHour >= 5 && currentHour < 12
              ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/30'
              : currentHour >= 12 && currentHour < 18
              ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 shadow-indigo-500/30'
              : 'bg-gradient-to-tr from-purple-600 to-slate-800 shadow-purple-500/30'
          }`}>
            {currentHour >= 5 && currentHour < 18 ? (
              <Sun className="w-6 h-6 animate-pulse" />
            ) : (
              <Moon className="w-6 h-6 animate-pulse" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-400">
                {isAr ? 'الإيجاز اليومي الذكي' : 'Living Daily Briefing'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{userState?.streakDays || 0} {isAr ? 'أيام تتابع' : 'days'}</span>
              </span>
              {todayLog && todayLog.completedStations.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                  <span>{todayLog.completedStations.length}/6 {isAr ? 'محطات منجزة' : 'completed'}</span>
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{briefing.greeting}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-xl">
              {briefing.contextNote}
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Audio Briefing & Action CTA */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {/* Voice Briefing Button with Animated Waves */}
          <button
            type="button"
            onClick={handleToggleVoiceBriefing}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
              isPlayingAudio
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
                : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-xs'
            }`}
            title={isAr ? 'استمع للإيجاز الصوتي الذكي' : 'Play Audio Briefing'}
          >
            {isPlayingAudio ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{isAr ? 'إيقاف' : 'Stop'}</span>
                {/* Audio Wave Visualizer Bars */}
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '70%' }} />
                  <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '100%', animationDelay: '0.15s' }} />
                  <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '50%', animationDelay: '0.3s' }} />
                </div>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">{isAr ? 'استمع للإيجاز 🎙️' : 'Listen 🎙️'}</span>
              </>
            )}
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleCtaClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer ${
              briefing.targetStation === 'WORK_MICRO_SPRINT'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-600/30'
                : briefing.targetStation === 'RETROSPECTIVE_CHECKIN'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
                : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-600/30'
            }`}
          >
            <span>{briefing.ctaLabel}</span>
            <ArrowIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
