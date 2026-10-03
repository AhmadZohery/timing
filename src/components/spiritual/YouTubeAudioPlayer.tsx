import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Tv,
  Headphones,
  Maximize2,
  AlertCircle,
} from 'lucide-react';
import {
  gymFaithAudio,
  type GymFaithAudioState,
} from '../../services/gymFaithAudioService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubeAudioPlayerProps {
  onRewardToast?: (msg: string) => void;
}

export const YouTubeAudioPlayer: React.FC<YouTubeAudioPlayerProps> = ({
  onRewardToast: _onRewardToast,
}) => {
  const [audioState, setAudioState] = useState<GymFaithAudioState>(() =>
    gymFaithAudio.getState()
  );
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    return gymFaithAudio.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

  const videoId = audioState.youtubeVideoId;
  const isYouTube = audioState.mediaType === 'youtube' && Boolean(videoId);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (!window.YT) {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }
  }, []);

  // Initialize or re-cue player when videoId changes
  useEffect(() => {
    if (!isYouTube || !videoId) return;

    let destroyed = false;

    const initPlayer = () => {
      if (destroyed) return;
      if (!window.YT || !window.YT.Player) {
        // Retry until API is ready
        setTimeout(initPlayer, 200);
        return;
      }

      try {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        playerRef.current = new window.YT.Player('midmar-yt-player-target', {
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (destroyed) return;
              setIsPlayerReady(true);
              setLoadError(null);
              // Register bridge to gymFaithAudio
              gymFaithAudio.registerYouTubeBridge({
                play: () => {
                  try {
                    playerRef.current?.playVideo();
                  } catch {}
                },
                pause: () => {
                  try {
                    playerRef.current?.pauseVideo();
                  } catch {}
                },
                seekTo: (seconds: number) => {
                  try {
                    playerRef.current?.seekTo(seconds, true);
                  } catch {}
                },
                setPlaybackRate: (rate: number) => {
                  try {
                    playerRef.current?.setPlaybackRate(rate);
                  } catch {}
                },
                setVolume: (vol: number) => {
                  try {
                    playerRef.current?.setVolume(Math.round(vol * 100));
                  } catch {}
                },
              });

              if (audioState.currentTime > 0) {
                event.target.seekTo(audioState.currentTime, true);
              }
              event.target.setPlaybackRate(audioState.playbackRate);
              event.target.setVolume(Math.round(audioState.volume * 100));
              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              if (destroyed) return;
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
              if (event.data === 1) {
                const dur = playerRef.current?.getDuration() || 0;
                const cur = playerRef.current?.getCurrentTime() || 0;
                gymFaithAudio.updateYouTubeProgress(cur, dur, true);
              } else if (event.data === 2) {
                const cur = playerRef.current?.getCurrentTime() || 0;
                gymFaithAudio.updateYouTubeProgress(cur, undefined, false);
              } else if (event.data === 0) {
                // Video ended, auto-next
                gymFaithAudio.playNextEpisode();
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Player error:', err);
              setLoadError('تعذر تحميل البث من يوتيوب. تأكد من اتصال الإنترنت.');
            },
          },
        });
      } catch (e: any) {
        console.warn('Failed to construct YT.Player:', e);
      }
    };

    initPlayer();

    // Polling interval for live scrubber sync
    progressTimerRef.current = setInterval(() => {
      if (playerRef.current && isPlayerReady) {
        try {
          const state = playerRef.current.getPlayerState();
          if (state === 1) {
            const cur = playerRef.current.getCurrentTime() || 0;
            const dur = playerRef.current.getDuration() || 0;
            gymFaithAudio.updateYouTubeProgress(cur, dur, true);
          }
        } catch {}
      }
    }, 600);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [videoId, isYouTube]);

  if (!isYouTube) {
    return null;
  }

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    gymFaithAudio.seekTo(val);
  };

  const isAudioOnly = audioState.isAudioOnlyMode;

  return (
    <div
      ref={containerRef}
      className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950 border border-amber-500/30 shadow-xl space-y-3 relative overflow-hidden transition-all duration-300"
    >
      {/* Top Header & Mode Switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shrink-0">
            {isAudioOnly ? <Headphones className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              {isAudioOnly ? '🎧 نمط الاستماع الصوتي الذكي' : '📺 نمط المشاهدة المرئية'}
            </span>
            <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
              {audioState.currentTitleAr}
            </p>
          </div>
        </div>

        {/* Toggle Mode Button */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            gymFaithAudio.toggleAudioOnlyMode();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 text-[11px] font-bold transition-all cursor-pointer shrink-0"
          title={isAudioOnly ? 'التحويل للمشاهدة المرئية' : 'التحويل للاستماع الصوتي فقط'}
        >
          {isAudioOnly ? (
            <>
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>مشاهدة الفيديو</span>
            </>
          ) : (
            <>
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span>استماع صوتي فقط</span>
            </>
          )}
        </button>
      </div>

      {/* Video Container (Visible in Video Mode, Hidden in Audio Mode) */}
      <div
        className={`${
          isAudioOnly
            ? 'h-0.5 w-0.5 opacity-0 overflow-hidden absolute pointer-events-none'
            : 'aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 relative bg-black'
        }`}
      >
        <div id="midmar-yt-player-target" className="w-full h-full" />
      </div>

      {/* Audio Mode Graphic Artwork & Soundwaves */}
      {isAudioOnly && (
        <div className="py-4 px-3 rounded-2xl bg-slate-900/60 border border-white/[0.06] flex flex-col items-center justify-center text-center space-y-2">
          {/* Animated Waveform Visualizer */}
          <div className="flex items-end justify-center gap-1.5 h-8">
            <span
              className={`w-1.5 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full transition-all duration-300 ${
                audioState.isPlaying ? 'animate-bounce h-7' : 'h-2 opacity-50'
              }`}
            />
            <span
              className={`w-1.5 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full transition-all duration-300 ${
                audioState.isPlaying ? 'animate-pulse h-8' : 'h-3 opacity-50'
              }`}
              style={{ animationDelay: '150ms' }}
            />
            <span
              className={`w-1.5 bg-gradient-to-t from-teal-500 to-teal-300 rounded-full transition-all duration-300 ${
                audioState.isPlaying ? 'animate-bounce h-6' : 'h-2 opacity-50'
              }`}
              style={{ animationDelay: '300ms' }}
            />
            <span
              className={`w-1.5 bg-gradient-to-t from-amber-400 to-amber-200 rounded-full transition-all duration-300 ${
                audioState.isPlaying ? 'animate-pulse h-7' : 'h-3 opacity-50'
              }`}
              style={{ animationDelay: '200ms' }}
            />
            <span
              className={`w-1.5 bg-gradient-to-t from-emerald-400 to-emerald-200 rounded-full transition-all duration-300 ${
                audioState.isPlaying ? 'animate-bounce h-5' : 'h-2 opacity-50'
              }`}
              style={{ animationDelay: '400ms' }}
            />
          </div>

          <h3 className="text-sm font-black text-amber-200">
            {audioState.currentSheikhAr || 'محاضرة إيمانية'}
          </h3>
          <p className="text-xs text-slate-300 line-clamp-2 max-w-sm">
            {audioState.currentTitleAr}
          </p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            صوت مباشر نقي • موفر للبطارية والبيانات
          </span>
        </div>
      )}

      {/* Load Error Alert */}
      {loadError && (
        <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Progress Scrubber */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{formatSeconds(audioState.currentTime)}</span>
          <span>{formatSeconds(audioState.duration)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={audioState.duration || 100}
          value={audioState.currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 transition-all"
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Speed button */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            const speeds = [1, 1.25, 1.5];
            const nextIdx = (speeds.indexOf(audioState.playbackRate) + 1) % speeds.length;
            gymFaithAudio.setPlaybackRate(speeds[nextIdx]);
          }}
          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-white/[0.08] text-xs font-mono font-bold transition-all cursor-pointer"
        >
          {audioState.playbackRate}x
        </button>

        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              gymFaithAudio.seekBy(-15);
            }}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.06]"
            title="إرجاع 15 ثانية"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateMedium();
              gymFaithAudio.togglePlay();
            }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 hover:brightness-110 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 transition-all cursor-pointer scale-102"
            title={audioState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {audioState.isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ms-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              gymFaithAudio.seekBy(15);
            }}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.06]"
            title="تقديم 15 ثانية"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Direct Link to YouTube */}
        <a
          href={audioState.youtubeUrl || `https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/[0.08] transition-all"
          title="فتح في تطبيق يوتيوب"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
