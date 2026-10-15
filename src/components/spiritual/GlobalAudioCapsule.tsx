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
    (audioState.mediaType === 'youtube' && audioState.youtubeVideoId) ||
    (audioState.resumePoint && audioState.resumePoint.currentTime > 0)
  );

  if (!hasTrack || isDismissed) {
    return null;
  }

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '00:00';
    const hrs = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (hrs > 0) {
      return `${hrs}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playTactileClick();
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(audioState.playbackRate) + 1) % speeds.length;
    gymFaithAudio.setPlaybackRate(speeds[nextIdx]);
  };

  return (
    <aside
      aria-label={isAr ? 'مشغل الصوت العائم' : 'Floating Audio Capsule'}
      data-no-swipe="true"
      className="fixed z-35 bottom-[92px] sm:bottom-[98px] lg:bottom-5 inset-x-3 sm:inset-x-auto sm:end-6 max-w-md md:max-w-lg mx-auto transition-all animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div className="p-2.5 sm:p-3 rounded-[24px] bg-[#141517]/95 text-white backdrop-blur-2xl border border-white/15 shadow-[0_18px_50px_rgba(0,0,0,0.45)] space-y-2">
        {/* Top Interactive Mini Scrubber Line (for on-demand tracks) */}
        {audioState.duration > 0 && (
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden" dir="ltr">
            <div
              className="h-full bg-[#bce8c2] transition-all duration-300 rounded-full"
              style={{
                width: `${Math.min(100, (audioState.currentTime / audioState.duration) * 100)}%`,
              }}
            />
          </div>
        )}

        {/* Error Notification with Direct 1-Tap Retry */}
        {audioState.hasError && audioState.errorMessage && (
          <div className="px-3 py-1 rounded-xl bg-[#fce2e6] text-rose-950 text-[11px] font-bold flex items-center justify-between gap-2 animate-fade-in">
            <span className="truncate">{audioState.errorMessage}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                gymFaithAudio.togglePlay();
              }}
              className="px-2.5 py-0.5 rounded-full bg-zinc-950 text-white font-bold shrink-0 cursor-pointer text-[10px]"
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
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none group"
            title={isAr ? 'انقر لتوسيع استوديو الصوتيات الكامل 🎙️' : 'Click to open full audio studio'}
          >
            {/* Live Visual Artwork / Waveform Badge */}
            <div className="relative w-10 h-10 rounded-2xl bg-[#bce8c2] text-zinc-950 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              {audioState.isPlaying ? (
                <div className="flex items-end justify-center gap-0.5 h-4 w-4">
                  <span className="w-1 bg-zinc-950 rounded-full animate-bounce h-2" />
                  <span className="w-1 bg-[#1eb814] rounded-full animate-pulse h-3.5" />
                  <span className="w-1 bg-zinc-950 rounded-full animate-bounce h-2.5" />
                </div>
              ) : (
                <Radio className="w-4 h-4 stroke-[2.2]" />
              )}
              {audioState.isPlaying && (
                <span className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full bg-[#1eb814] ring-2 ring-[#141517] animate-ping" />
              )}
            </div>

            <div className="min-w-0 space-y-0.5 flex-1">
              <span className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#bce8c2] transition-colors block max-w-[135px] xs:max-w-[180px] sm:max-w-[240px]">
                {audioState.currentTitleAr}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 truncate">
                <span className="font-bold text-[#bce8c2] shrink-0">
                  {audioState.currentSheikhAr}
                </span>
                {audioState.duration > 0 && (
                  <span className="shrink-0 font-mono text-[9px] text-zinc-400 hidden xs:inline tabular-nums">
                    • <bdi dir="ltr">{formatSeconds(audioState.currentTime)} / {formatSeconds(audioState.duration)}</bdi>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Smart Playback Tactical Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Media Transport Strip (Strictly LTR per BiDi media convention) */}
            <div dir="ltr" className="flex items-center gap-0.5 sm:gap-1">
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
                className="hidden sm:inline-flex min-w-[36px] min-h-[36px] items-center justify-center p-1.5 rounded-full text-zinc-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title={isAr ? 'الحلقة السابقة ⏮️' : 'Previous Episode'}
                aria-label={isAr ? 'الحلقة السابقة' : 'Previous Episode'}
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
                className="hidden sm:inline-flex min-w-[36px] min-h-[36px] items-center justify-center p-1.5 rounded-full text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer"
                title={isAr ? 'تأخير 15 ثانية' : 'Rewind 15s'}
                aria-label={isAr ? 'تأخير 15 ثانية' : 'Rewind 15s'}
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
                className={`min-w-[44px] min-h-[44px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center p-2 rounded-full shadow-sm transition-all active:scale-90 cursor-pointer ${
                  audioState.isPlaying
                    ? 'bg-[#fde6d8] text-zinc-950 hover:bg-[#fcd4be]'
                    : 'bg-[#bce8c2] text-zinc-950 hover:bg-[#d4f5dc]'
                }`}
                title={audioState.isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
                aria-label={audioState.isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
              >
                {audioState.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : audioState.isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current pl-0.5" />
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
                className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center p-1.5 rounded-full text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
                title={isAr ? 'تقديم 15 ثانية' : 'Forward 15s'}
                aria-label={isAr ? 'تقديم 15 ثانية' : 'Forward 15s'}
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
                className="hidden sm:inline-flex min-w-[36px] min-h-[36px] items-center justify-center p-1.5 rounded-full text-zinc-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title={isAr ? 'الحلقة التالية ⏭️' : 'Next Episode'}
                aria-label={isAr ? 'الحلقة التالية' : 'Next Episode'}
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              {/* Speed Badge (hidden on mobile, shown on sm+) */}
              <button
                type="button"
                onClick={handleCycleSpeed}
                className="hidden sm:inline-flex px-2 py-1 rounded-full bg-white/10 text-[10px] font-mono font-bold text-[#bce8c2] hover:bg-white/15 transition-colors cursor-pointer tabular-nums"
                title={isAr ? 'سرعة التشغيل' : 'Speed'}
              >
                {audioState.playbackRate}x
              </button>
            </div>

            {/* Expand to Full Sanctuary */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                onOpenFaithHub();
              }}
              className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center p-1.5 rounded-full text-zinc-300 hover:text-[#bce8c2] hover:bg-white/10 transition-colors cursor-pointer"
              title={isAr ? 'توسيع الاستوديو الكامل 🎙️' : 'Expand full studio'}
              aria-label={isAr ? 'توسيع الاستوديو الكامل' : 'Expand full studio'}
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
              className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center p-1.5 rounded-full text-zinc-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
              title={isAr ? 'إخفاء مؤقت' : 'Hide'}
              aria-label={isAr ? 'إخفاء مؤقت' : 'Hide'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
