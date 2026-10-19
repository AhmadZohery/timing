import React, { useEffect, useRef, useState } from 'react';
import {
  gymFaithAudio,
  type GymFaithAudioState,
} from '../../services/gymFaithAudioService';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Give up waiting for the IFrame API after this long (offline / blocked) instead of polling forever. */
const MAX_API_WAIT_MS = 30000;

/**
 * Persistent Global YouTube Audio Host
 * Mounts at App root level so YouTube audio playback continues uninterrupted
 * when modals close, when stations switch, or when navigating anywhere in the app.
 *
 * Reliability model:
 *  - ONE player instance is created and then re-used via loadVideoById (the IFrame API replaces
 *    the target element with an iframe and destroy() removes it, so "destroy + new Player(sameId)"
 *    silently fails). A fresh target element is created only when a brand-new player is needed.
 *  - Player callbacks are guarded by a generation counter tied to the player, not to React effect
 *    runs, so toggling YouTube <-> MP3 never leaves a live player with dead event handlers.
 *  - Unplayable videos (removed / embedding disabled) skip to the next episode instead of freezing.
 */
export const PersistentYouTubeHost: React.FC = () => {
  const [audioState, setAudioState] = useState<GymFaithAudioState>(() =>
    gymFaithAudio.getState()
  );
  const audioStateRef = useRef<GymFaithAudioState>(audioState);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const readyRef = useRef(false);
  const genRef = useRef(0);
  const loadedVideoRef = useRef<string | null>(null);
  const retriedVideoRef = useRef<string | null>(null);

  useEffect(() => {
    return gymFaithAudio.subscribe((state) => {
      audioStateRef.current = state;
      setAudioState((prev) => {
        if (
          prev.mediaType === state.mediaType &&
          prev.youtubeVideoId === state.youtubeVideoId &&
          prev.isAudioOnlyMode === state.isAudioOnlyMode &&
          prev.isPlaying === state.isPlaying &&
          prev.currentTitleAr === state.currentTitleAr &&
          prev.seriesPlayMode === state.seriesPlayMode
        ) {
          return prev;
        }
        return state;
      });
    });
  }, []);

  const videoId = audioState.youtubeVideoId;
  const isYouTube = audioState.mediaType === 'youtube' && Boolean(videoId);

  // 1. Ensure YouTube IFrame API script is in the DOM only when YouTube playback is requested
  useEffect(() => {
    if (!isYouTube || !videoId) return;
    if (!window.YT) {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }
  }, [isYouTube, videoId]);

  // 2. Create the player once, then switch / resume it as the requested video changes
  useEffect(() => {
    if (!isYouTube || !videoId) {
      // YouTube is no longer the active source: make sure it is silent (MP3 / other channel took over)
      try {
        if (readyRef.current) playerRef.current?.pauseVideo();
      } catch {}
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();
    const startSeconds = () => Math.max(0, audioStateRef.current.currentTime || 0);

    const reportError = (err: any) => {
      const code = Number(err?.data);
      const p = playerRef.current;
      const current = loadedVideoRef.current;
      // 5 = HTML5 player glitch: retry the same video once before giving up
      if (code === 5 && current && retriedVideoRef.current !== current) {
        retriedVideoRef.current = current;
        try {
          p?.loadVideoById({ videoId: current, startSeconds: startSeconds() });
          return;
        } catch {}
      }
      let cur = 0;
      try {
        cur = p?.getCurrentTime?.() || 0;
      } catch {}
      gymFaithAudio.updateYouTubeProgress(cur, undefined, false);
      // 100 / 101 / 150 = removed or embedding disabled: skip to the next episode rather than freezing
      if (
        audioStateRef.current.seriesPlayMode === 'all' &&
        gymFaithAudio.hasNextEpisode()
      ) {
        gymFaithAudio.playNextEpisode();
      } else {
        gymFaithAudio.reportYouTubeError('تعذّر تشغيل هذا المقطع (محذوف أو غير مسموح بتشغيله خارج يوتيوب). جرّب مقطعًا آخر.');
      }
    };

    const createPlayer = () => {
      const wrapper = hostRef.current;
      if (!wrapper || !window.YT?.Player) return;

      // The API swaps its target element for an iframe, so every new player needs a fresh target.
      wrapper.textContent = '';
      const target = document.createElement('div');
      target.className = 'w-full h-full';
      wrapper.appendChild(target);

      const gen = ++genRef.current;
      readyRef.current = false;
      loadedVideoRef.current = videoId;
      retriedVideoRef.current = null;

      const isHttpOrigin =
        typeof window !== 'undefined' &&
        (window.location.protocol === 'http:' || window.location.protocol === 'https:');

      try {
        playerRef.current = new window.YT.Player(target, {
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
            ...(isHttpOrigin ? { origin: window.location.origin } : {}),
          },
          events: {
            onReady: (event: any) => {
              if (gen !== genRef.current) return;
              readyRef.current = true;
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

              const latest = audioStateRef.current;
              // The requested video may have changed while the player was still booting
              if (latest.youtubeVideoId && latest.youtubeVideoId !== loadedVideoRef.current) {
                loadedVideoRef.current = latest.youtubeVideoId;
                event.target.loadVideoById({
                  videoId: latest.youtubeVideoId,
                  startSeconds: Math.max(0, latest.currentTime || 0),
                });
              } else if (latest.currentTime > 0) {
                event.target.seekTo(latest.currentTime, true);
              }
              event.target.setPlaybackRate(latest.playbackRate);
              event.target.setVolume(Math.round(latest.volume * 100));
              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              if (gen !== genRef.current) return;
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
              const p = playerRef.current;
              if (event.data === 1) {
                const dur = p?.getDuration() || 0;
                const cur = p?.getCurrentTime() || 0;
                gymFaithAudio.updateYouTubeProgress(cur, dur, true);
              } else if (event.data === 2) {
                const cur = p?.getCurrentTime() || 0;
                gymFaithAudio.updateYouTubeProgress(cur, undefined, false);
              } else if (event.data === 0) {
                // Video ended: auto-advance inside a series only when seriesPlayMode === 'all'
                const advanced =
                  audioStateRef.current.seriesPlayMode === 'all' &&
                  gymFaithAudio.playNextEpisode();
                if (!advanced) {
                  const dur = p?.getDuration() || 0;
                  gymFaithAudio.updateYouTubeProgress(dur, undefined, false);
                }
              }
            },
            onError: (err: any) => {
              if (gen !== genRef.current) return;
              console.warn('Persistent YouTube Player error:', err);
              reportError(err);
            },
          },
        });
      } catch (e) {
        playerRef.current = null;
        console.warn('Failed to construct Persistent YT.Player:', e);
      }
    };

    const attach = () => {
      if (cancelled) return;

      // Re-use a ready player: switch the video in place, or just resume the same one
      if (playerRef.current && readyRef.current) {
        try {
          if (loadedVideoRef.current !== videoId) {
            loadedVideoRef.current = videoId;
            retriedVideoRef.current = null;
            playerRef.current.loadVideoById({ videoId, startSeconds: startSeconds() });
          } else if (audioStateRef.current.isPlaying) {
            playerRef.current.playVideo();
          }
        } catch {}
        return;
      }

      // Player is still booting: onReady will pick up the latest requested video
      if (playerRef.current) return;

      if (!window.YT || !window.YT.Player) {
        if (Date.now() - startedAt > MAX_API_WAIT_MS) return;
        setTimeout(attach, 250);
        return;
      }
      createPlayer();
    };

    attach();

    return () => {
      cancelled = true;
    };
  }, [isYouTube, videoId]);

  // 3. Live scrubber sync (single timer for the host lifetime, only works while YouTube is active)
  useEffect(() => {
    const timer = setInterval(() => {
      const p = playerRef.current;
      if (!p || !readyRef.current || audioStateRef.current.mediaType !== 'youtube') return;
      try {
        if (p.getPlayerState() === 1) {
          const cur = p.getCurrentTime() || 0;
          const dur = p.getDuration() || 0;
          gymFaithAudio.updateYouTubeProgress(cur, dur, true);
        }
      } catch {}
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 4. Clean teardown when the host completely unmounts from the app root
  useEffect(() => {
    const generation = genRef;
    return () => {
      generation.current++;
      readyRef.current = false;
      gymFaithAudio.registerYouTubeBridge(null);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
      loadedVideoRef.current = null;
    };
  }, []);

  // Audio-only mode keeps a real 200x200 player parked off-screen without opacity-0 GPU alpha compositing.
  // When video mode is active (!isAudioOnlyMode), render at z-[80] above modals with a clean header bar.
  const showFloatingVideo = isYouTube && !audioState.isAudioOnlyMode;

  return (
    <div
      aria-hidden={!showFloatingVideo}
      className={
        showFloatingVideo
          ? 'fixed z-[80] bottom-28 end-3 sm:end-6 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.75)] border-2 border-amber-400/80 bg-zinc-950 flex flex-col'
          : 'fixed -top-[9999px] -left-[9999px] w-[200px] h-[200px] pointer-events-none overflow-hidden'
      }
    >
      {showFloatingVideo && (
        <div
          dir="rtl"
          className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 border-b border-amber-400/30 text-white"
        >
          <span className="text-[11px] font-bold text-amber-300 truncate">
            📺 {audioState.currentTitleAr || 'العرض المرئي للمحاضرة'}
          </span>
          <button
            type="button"
            onClick={() => gymFaithAudio.setAudioOnlyMode(true)}
            className="px-2.5 py-0.5 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 text-[10px] font-bold shrink-0 cursor-pointer transition-colors"
          >
            🎧 صوت فقط (إخفاء الفيديو)
          </button>
        </div>
      )}
      <div className={showFloatingVideo ? 'w-full h-48 sm:h-56 bg-black' : 'w-full h-full'}>
        <div ref={hostRef} className="w-full h-full" />
      </div>
    </div>
  );
};
