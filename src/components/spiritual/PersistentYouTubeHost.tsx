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
      setAudioState(state);
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
      if (gymFaithAudio.hasNextEpisode()) {
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

      try {
        playerRef.current = new window.YT.Player(target, {
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
                // Video ended: auto-advance inside a series, otherwise settle in the paused state
                if (!gymFaithAudio.playNextEpisode()) {
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
    }, 600);
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

  // Audio-only mode keeps a real 200x200 player parked off-screen: browsers throttle or pause
  // embedded players that are 1px / fully hidden, which was cutting the audio.
  return (
    <div
      aria-hidden="true"
      className={
        isYouTube && !audioState.isAudioOnlyMode
          ? 'fixed z-40 bottom-24 end-4 w-72 h-44 rounded-2xl overflow-hidden shadow-2xl border border-amber-500/40 bg-black'
          : 'fixed top-0 -left-[9999px] w-[200px] h-[200px] opacity-0 pointer-events-none'
      }
    >
      <div ref={hostRef} className="w-full h-full" />
    </div>
  );
};
