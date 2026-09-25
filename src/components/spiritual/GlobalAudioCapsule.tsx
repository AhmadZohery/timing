import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Maximize2,
  X,
  Radio,
  Loader2,
} from 'lucide-react';
import {
  gymFaithAudio,
  type GymFaithAudioState,
} from '../../services/gymFaithAudioService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface GlobalAudioCapsuleProps {
  onOpenFaithHub: () => void;
}

export const GlobalAudioCapsule: React.FC<GlobalAudioCapsuleProps> = ({ onOpenFaithHub }) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [audioState, setAudioState] = useState<GymFaithAudioState>(() => gymFaithAudio.getState());
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    return gymFaithAudio.subscribe((state) => {
      setAudioState(state);
      // Auto-reappear if playback starts
      if (state.isPlaying) {
        setIsDismissed(false);
      }
    });
  }, []);

  const hasTrack = Boolean(
    audioState.isPlaying ||
    audioState.isLoading ||
    audioState.currentTime > 0 ||
    audioState.currentSeriesId ||
    (audioState.resumePoint && audioState.resumePoint.currentTime > 0)
  );

  if (!hasTrack || isDismissed) {
    return null;
  }

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playTactileClick();
    const speeds = [1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(audioState.playbackRate) + 1) % speeds.length;
    gymFaithAudio.setPlaybackRate(speeds[nextIdx]);
  };

  return (
    <aside
      aria-label={isAr ? 'مشغل الصوت العائم' : 'Floating Audio Capsule'}
      data-no-swipe="true"
      className="fixed z-35 bottom-[92px] sm:bottom-[98px] lg:bottom-5 inset-x-3 sm:inset-x-auto sm:end-6 max-w-md md:max-w-lg mx-auto transition-all animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/95 dark:bg-[#0c0d16]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.7)] space-y-1.5">
        {/* Top Mini Progress Line (for on-demand tracks) */}
        {audioState.duration > 0 && (
          <div className="w-full bg-slate-200/80 dark:bg-white/[0.08] h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{
                width: `${Math.min(100, (audioState.currentTime / audioState.duration) * 100)}%`,
              }}
            />
          </div>
        )}

        {/* Error Notification with Direct 1-Tap Retry */}
        {audioState.hasError && audioState.errorMessage && (
          <div className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-700 dark:text-rose-300 font-bold flex items-center justify-between gap-1.5 animate-fade-in">
            <span className="truncate">{audioState.errorMessage}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                gymFaithAudio.togglePlay();
              }}
              className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 cursor-pointer text-[10px]"
            >
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {/* Track Info (Click to open full Sanctuary) */}
          <div
            onClick={() => {
              soundSynth.playTactileClick();
              onOpenFaithHub();
            }}
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 cursor-pointer select-none group"
            title={isAr ? 'انقر لتوسيع المشغل الكامل 🎙️' : 'Click to open full player'}
          >
            {/* Live Visual Artwork / Waveform Badge */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-emerald-500/15 to-teal-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/25 dark:border-emerald-500/30 overflow-hidden shadow-xs">
              {audioState.isPlaying ? (
                <div className="flex items-end justify-center gap-0.5 h-4 w-4">
                  <span className="w-1 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-bounce h-2" />
                  <span className="w-1 bg-amber-500 rounded-full animate-pulse h-3.5" />
                  <span className="w-1 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-bounce h-2.5" />
                </div>
              ) : (
                <Radio className="w-4 h-4 stroke-[1.8]" />
              )}
              {audioState.isPlaying && (
                <span className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c0d16] animate-ping" />
              )}
            </div>

            <div className="min-w-0 space-y-0.5 flex-1">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors block max-w-[150px] xs:max-w-[190px] sm:max-w-[240px]">
                {audioState.currentTitleAr}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                  {audioState.currentSheikhAr}
                </span>
                {audioState.duration > 0 && (
                  <span className="shrink-0 font-mono text-[9px] text-slate-400 dark:text-zinc-500 hidden xs:inline">
                    • <bdi dir="ltr">{formatSeconds(audioState.currentTime)} / {formatSeconds(audioState.duration)}</bdi>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Smart Playback Tactical Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Previous Episode (shown on sm+) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                gymFaithAudio.playPrevEpisode();
              }}
              disabled={!gymFaithAudio.hasPrevEpisode()}
              className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title={isAr ? 'الحلقة السابقة ⏮️' : 'Previous Episode'}
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Skip 15s Back (shown on sm+) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundSynth.playTactileClick();
                gymFaithAudio.seekBy(-15);
              }}
              className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={isAr ? 'تأخير 15 ثانية' : 'Rewind 15s'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Tactile Play / Pause Core Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                gymFaithAudio.togglePlay();
              }}
              className={`p-2 rounded-xl text-white shadow-xs transition-all active:scale-90 cursor-pointer ${
                audioState.isPlaying
                  ? 'bg-gradient-to-tr from-amber-600 to-amber-500 shadow-amber-500/25 hover:from-amber-500 hover:to-amber-400'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500'
              }`}
              title={audioState.isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
            >
              {audioState.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : audioState.isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ps-0.5" />
              )}
            </button>

            {/* Skip 15s Forward (Always visible on mobile & desktop) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundSynth.playTactileClick();
                gymFaithAudio.seekBy(15);
              }}
              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer active:scale-90"
              title={isAr ? 'تقديم 15 ثانية' : 'Forward 15s'}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Next Episode (hidden on mobile, shown on sm+) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                gymFaithAudio.playNextEpisode();
              }}
              disabled={!gymFaithAudio.hasNextEpisode()}
              className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title={isAr ? 'الحلقة التالية ⏭️' : 'Next Episode'}
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Speed Badge (hidden on mobile, shown on sm+) */}
            <button
              type="button"
              onClick={handleCycleSpeed}
              className="hidden sm:inline-flex px-1.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 transition-colors cursor-pointer"
              title={isAr ? 'سرعة التشغيل' : 'Speed'}
            >
              {audioState.playbackRate}x
            </button>

            {/* Expand to Full Sanctuary */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                onOpenFaithHub();
              }}
              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={isAr ? 'توسيع المشغل الكامل 🎙️' : 'Expand full player'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Dismiss Mini Player */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title={isAr ? 'إخفاء مؤقت' : 'Hide'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
