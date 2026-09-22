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
      className="fixed z-35 bottom-[70px] lg:bottom-4 inset-x-2 sm:inset-x-auto sm:end-4 sm:max-w-md md:max-w-lg transition-all animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-500/30 dark:border-amber-500/25 shadow-[0_12px_36px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] space-y-1.5 sm:space-y-2">
        {/* Top Mini Progress Line (for on-demand tracks) */}
        {audioState.duration > 0 && (
          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
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

        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Track Info (Click to open full Sanctuary) */}
          <div
            onClick={() => {
              soundSynth.playTactileClick();
              onOpenFaithHub();
            }}
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 cursor-pointer select-none group"
            title={isAr ? 'انقر لتوسيع المشغل الكامل 🎙️' : 'Click to open full player'}
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {audioState.isPlaying && (
                <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
              )}
            </div>

            <div className="min-w-0 space-y-0.5 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors block">
                  {audioState.currentTitleAr}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                <span className="truncate max-w-[140px] sm:max-w-[200px] font-sans font-bold text-amber-700 dark:text-amber-400">
                  {audioState.currentSheikhAr}
                </span>
                {audioState.duration > 0 && (
                  <span className="shrink-0 hidden xs:inline">
                    • {formatSeconds(audioState.currentTime)} / {formatSeconds(audioState.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Smart Playback Tactical Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
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

            {/* Skip 15s Back */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundSynth.playTactileClick();
                gymFaithAudio.seekBy(-15);
              }}
              className="p-1 sm:p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={isAr ? 'تأخير 15 ثانية' : 'Rewind 15s'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Big Play / Pause */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                gymFaithAudio.togglePlay();
              }}
              className={`p-2 rounded-xl text-white shadow-xs transition-all active:scale-92 cursor-pointer ${
                audioState.isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
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

            {/* Skip 15s Forward */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundSynth.playTactileClick();
                gymFaithAudio.seekBy(15);
              }}
              className="p-1 sm:p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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
              className="p-1 sm:p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
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
              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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
