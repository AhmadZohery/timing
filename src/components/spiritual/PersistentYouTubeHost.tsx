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

/**
 * Persistent Global YouTube Audio Host
 * Mounts at App root level so YouTube audio playback continues uninterrupted
 * when modals close, when stations switch, or when navigating anywhere in the app.
 */
export const PersistentYouTubeHost: React.FC = () => {
  const [audioState, setAudioState] = useState<GymFaithAudioState>(() =>
    gymFaithAudio.getState()
  );
  const audioStateRef = useRef<GymFaithAudioState>(audioState);
  const playerRef = useRef<any>(null);
  const progressTimerRef = useRef<any>(null);
  const currentVideoIdRef = useRef<string | null>(null);

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

  // 2. Initialize or re-cue player when videoId changes
  useEffect(() => {
    if (!isYouTube || !videoId) return;

    if (currentVideoIdRef.current === videoId && playerRef.current) {
      // Same video already loaded, ensure playback
      if (audioStateRef.current.isPlaying) {
        try {
          playerRef.current.playVideo();
        } catch {}
      }
      return;
    }

    currentVideoIdRef.current = videoId;
    let destroyed = false;

    const initPlayer = () => {
      if (destroyed) return;
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 200);
        return;
      }

      try {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {}
          playerRef.current = null;
        }

        playerRef.current = new window.YT.Player('midmar-global-yt-iframe', {
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
              // Register bridge with gymFaithAudio
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

              const latestState = audioStateRef.current;
              if (latestState.currentTime > 0) {
                event.target.seekTo(latestState.currentTime, true);
              }
              event.target.setPlaybackRate(latestState.playbackRate);
              event.target.setVolume(Math.round(latestState.volume * 100));
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
                // Video ended, auto-next episode if in series
                gymFaithAudio.playNextEpisode();
              }
            },
            onError: (err: any) => {
              console.warn('Persistent YouTube Player error:', err);
            },
          },
        });
      } catch (e) {
        console.warn('Failed to construct Persistent YT.Player:', e);
      }
    };

    initPlayer();

    // Polling interval for live scrubber progress sync
    progressTimerRef.current = setInterval(() => {
      if (playerRef.current && isYouTube) {
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
      destroyed = true;
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [isYouTube, videoId]);

  // Clean teardown when component completely unmounts from app root
  useEffect(() => {
    return () => {
      gymFaithAudio.registerYouTubeBridge(null);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, []);

  // When YouTube is NOT active, keep hidden.
  // When YouTube is active, keep offscreen (audio-only) or docked.
  return (
    <div
      aria-hidden="true"
      className={
        isYouTube && !audioState.isAudioOnlyMode
          ? 'fixed z-40 bottom-24 end-4 w-72 h-44 rounded-2xl overflow-hidden shadow-2xl border border-amber-500/40 bg-black'
          : 'fixed -bottom-[9999px] -right-[9999px] w-1 h-1 opacity-0 pointer-events-none'
      }
    >
      <div id="midmar-global-yt-iframe" className="w-full h-full" />
    </div>
  );
};
