import React, { useEffect, useState } from 'react';
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

interface YouTubeAudioPlayerProps {
  onRewardToast?: (msg: string) => void;
}

/**
 * YouTubeAudioPlayer — Remote Control & Visualizer for PersistentYouTubeHost.
 * Does NOT instantiate a duplicate YT.Player; delegates all playback to the
 * single global PersistentYouTubeHost via gymFaithAudio bridge.
 */
export const YouTubeAudioPlayer: React.FC<YouTubeAudioPlayerProps> = ({
  onRewardToast: _onRewardToast,
}) => {
  const [audioState, setAudioState] = useState<GymFaithAudioState>(() =>
    gymFaithAudio.getState()
  );

  useEffect(() => {
    return gymFaithAudio.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

  const videoId = audioState.youtubeVideoId;
  const isYouTube = audioState.mediaType === 'youtube' && Boolean(videoId);

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
    <div className="p-4 rounded-[26px] bg-gradient-to-br from-[#ecfdf5] via-white to-[#eef2ff] dark:from-emerald-950/60 dark:via-zinc-900 dark:to-indigo-950/50 border-2 border-emerald-300/80 dark:border-emerald-500/30 shadow-md space-y-3 relative overflow-hidden transition-all duration-300">
      {/* Top Header & Mode Switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-200/70 dark:border-white/10 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            {isAudioOnly ? <Headphones className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
              {isAudioOnly ? '🎧 نمط الاستماع الصوتي الذكي' : '📺 نمط المشاهدة المرئية العائمة'}
            </span>
            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 hover:bg-emerald-50 text-zinc-800 dark:text-zinc-200 border border-emerald-300/80 dark:border-white/10 text-[11px] font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
          title={isAudioOnly ? 'التحويل للمشاهدة المرئية' : 'التحويل للاستماع الصوتي فقط'}
        >
          {isAudioOnly ? (
            <>
              <Tv className="w-3.5 h-3.5 text-amber-600" />
              <span>إظهار الفيديو</span>
            </>
          ) : (
            <>
              <Headphones className="w-3.5 h-3.5 text-emerald-600" />
              <span>صوت فقط</span>
            </>
          )}
        </button>
      </div>

      {/* Audio Mode Graphic Artwork & Soundwaves */}
      <div className="py-3 px-3 rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-emerald-200/70 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-1.5">
        <div className="flex items-end justify-center gap-1.5 h-6">
          <span
            className={`w-1.5 bg-emerald-500 rounded-full transition-all duration-300 ${
              audioState.isPlaying ? 'animate-bounce h-5' : 'h-2 opacity-40'
            }`}
          />
          <span
            className={`w-1.5 bg-teal-600 rounded-full transition-all duration-300 ${
              audioState.isPlaying ? 'animate-pulse h-6' : 'h-3 opacity-40'
            }`}
            style={{ animationDelay: '150ms' }}
          />
          <span
            className={`w-1.5 bg-indigo-500 rounded-full transition-all duration-300 ${
              audioState.isPlaying ? 'animate-bounce h-4' : 'h-2 opacity-40'
            }`}
            style={{ animationDelay: '300ms' }}
          />
          <span
            className={`w-1.5 bg-amber-500 rounded-full transition-all duration-300 ${
              audioState.isPlaying ? 'animate-pulse h-5' : 'h-3 opacity-40'
            }`}
            style={{ animationDelay: '200ms' }}
          />
        </div>

        <h3 className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300">
          {audioState.currentSheikhAr || 'محاضرة إيمانية'}
        </h3>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300/60">
          بث مستمر بالخلفية • لا يتوقف عند إغلاق النافذة
        </span>
      </div>

      {/* Error Alert */}
      {audioState.hasError && audioState.errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-100 text-rose-950 text-xs font-bold flex items-center gap-2 border border-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{audioState.errorMessage}</span>
        </div>
      )}

      {/* Progress Scrubber */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400 font-bold">
          <span>{formatSeconds(audioState.currentTime)}</span>
          <span>{formatSeconds(audioState.duration)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={audioState.duration || 100}
          value={audioState.currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-emerald-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 transition-all"
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            const speeds = [1, 1.25, 1.5, 2];
            const nextIdx = (speeds.indexOf(audioState.playbackRate) + 1) % speeds.length;
            gymFaithAudio.setPlaybackRate(speeds[nextIdx]);
          }}
          className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-950 dark:text-indigo-200 border border-indigo-300/60 text-xs font-mono font-bold transition-all cursor-pointer"
        >
          {audioState.playbackRate}x
        </button>

        <div className="flex items-center gap-3" dir="ltr">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              gymFaithAudio.seekBy(-15);
            }}
            className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 hover:bg-emerald-50 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
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
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer ${
              audioState.isPlaying
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
            title={audioState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {audioState.isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current pl-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              gymFaithAudio.seekBy(15);
            }}
            className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 hover:bg-emerald-50 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="تقديم 15 ثانية"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <a
          href={audioState.youtubeUrl || `https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-white dark:bg-zinc-800 hover:bg-emerald-50 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-all shadow-2xs"
          title="فتح في تطبيق يوتيوب"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
