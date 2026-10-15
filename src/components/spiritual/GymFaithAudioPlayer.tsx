import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  Loader2,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  RotateCw,
  BookOpen,
  Radio,
  Star,
  Search,
  Plus,
  Trash2,
  User,
  Check,
  SkipBack,
  SkipForward,
  Download,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import { offlineAudioService } from '../../services/offlineAudioService';
import {
  GYM_FAITH_CHANNELS,
  FAITH_AUDIO_SERIES,
  SEERAH_DETERMINATION_QUOTES,
  SCHOLARS_DIRECTORY,
  GYM_AUDIO_CATEGORIES,
  type GymAudioChannel,
  type FaithAudioSeries,
  type FaithAudioEpisode,
  type GymAudioCategory,
} from '../../data/gymFaithAudioData';
import {
  gymFaithAudio,
  isSoundCloudUrl,
  getSoundCloudEmbedUrl,
  isYouTubeUrl,
  type GymFaithAudioState,
} from '../../services/gymFaithAudioService';
import { YouTubeAudioPlayer } from './YouTubeAudioPlayer';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface GymFaithAudioPlayerProps {
  className?: string;
  onRewardToast?: (msg: string) => void;
  onClose?: () => void;
  onOpenFullModal?: () => void;
}

export const GymFaithAudioPlayer: React.FC<GymFaithAudioPlayerProps> = ({
  className = '',
  onRewardToast,
  onClose,
  onOpenFullModal,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [audioState, setAudioState] = useState<GymFaithAudioState>(gymFaithAudio.getState());
  const [playerTab, setPlayerTab] = useState<'series' | 'radio'>('series');
  const [allSeries, setAllSeries] = useState<FaithAudioSeries[]>(() => gymFaithAudio.getAllSeries());
  const [selectedSeries, setSelectedSeries] = useState<FaithAudioSeries>(
    () => gymFaithAudio.getAllSeries()[0] || FAITH_AUDIO_SERIES[0]
  );
  const [isSeriesListOpen, setIsSeriesListOpen] = useState(false);
  const [showQuoteCard, setShowQuoteCard] = useState(false);
  const [randomQuoteIndex, setRandomQuoteIndex] = useState(0);
  const [, setOfflineTick] = useState(0);

  useEffect(() => {
    return offlineAudioService.subscribe(() => setOfflineTick((t) => t + 1));
  }, []);

  // Filters & Custom Add
  const [favorites, setFavorites] = useState<string[]>(() => gymFaithAudio.getFavorites());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GymAudioCategory>('all');
  const [selectedScholarId, setSelectedScholarId] = useState<string | null>(null);
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);

  // Custom Lesson form
  const [customSheikh, setCustomSheikh] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<GymAudioCategory>('tazkiyah');
  const [customUrl, setCustomUrl] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  useEffect(() => {
    const unsubscribe = gymFaithAudio.subscribe(setAudioState);
    return () => unsubscribe();
  }, []);

  const currentChannel = gymFaithAudio.getCurrentChannel();

  // Multi-Criteria Series Filtering (Strict & Non-Leaking)
  const filteredSeries = useMemo(() => {
    let list = allSeries;

    // Filter strictly by ScholarId if selected
    if (selectedScholarId) {
      list = list.filter((s) => s.scholarId === selectedScholarId);
    }

    // Filter by Category
    if (selectedCategory === 'favorites') {
      list = list.filter((s) => favorites.includes(s.id));
    } else if (selectedCategory === 'downloaded') {
      list = list.filter((s) => s.episodes.some((e) => offlineAudioService.isDownloaded(e.id)));
    } else if (selectedCategory === 'custom') {
      list = list.filter((s) => s.isCustom);
    } else if (selectedCategory !== 'all') {
      list = list.filter((s) => s.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.titleAr.toLowerCase().includes(q) ||
          s.sheikhAr.toLowerCase().includes(q) ||
          s.descriptionAr.toLowerCase().includes(q) ||
          s.episodes.some(
            (e) =>
              e.titleAr.toLowerCase().includes(q) ||
              e.summaryAr.toLowerCase().includes(q)
          )
      );
    }

    return list;
  }, [allSeries, selectedScholarId, selectedCategory, searchQuery, favorites]);

  // Derived effective series: ensures selectedSeries always matches current filter & never leaks another scholar!
  const effectiveSeries = useMemo(() => {
    if (!selectedSeries) return filteredSeries[0] || null;
    const exists = filteredSeries.find((s) => s.id === selectedSeries.id);
    return exists || filteredSeries[0] || null;
  }, [filteredSeries, selectedSeries]);

  // Active episode & SoundCloud detection
  const activeEpisode = useMemo(() => {
    if (audioState.mode === 'series' && audioState.currentSeriesId && audioState.currentEpisodeId) {
      const s = allSeries.find((ser) => ser.id === audioState.currentSeriesId);
      return s?.episodes.find((e) => e.id === audioState.currentEpisodeId) || null;
    }
    return effectiveSeries?.episodes[0] || null;
  }, [audioState.mode, audioState.currentSeriesId, audioState.currentEpisodeId, allSeries, effectiveSeries]);

  const isCurrentSoundCloud = useMemo(() => {
    return isSoundCloudUrl(activeEpisode?.audioUrl);
  }, [activeEpisode]);

  const isCurrentYouTube = useMemo(() => {
    return isYouTubeUrl(activeEpisode?.audioUrl);
  }, [activeEpisode]);

  // Radio Channels Filtering
  const filteredChannels = useMemo(() => {
    let list = GYM_FAITH_CHANNELS;

    if (selectedCategory === 'downloaded') {
      return [];
    } else if (selectedCategory === 'favorites') {
      list = list.filter((c) => favorites.includes(c.id));
    } else if (selectedCategory !== 'all' && selectedCategory !== 'live') {
      list = list.filter((c) => c.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.titleAr.toLowerCase().includes(q) ||
          c.sheikhAr.toLowerCase().includes(q) ||
          c.descriptionAr.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedCategory, searchQuery, favorites]);

  const isTogglingRef = useRef(false);
  const handleTogglePlay = (targetChannelId?: string) => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;
    setTimeout(() => {
      isTogglingRef.current = false;
    }, 250);

    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const wasPlaying = audioState.isPlaying;
    gymFaithAudio.togglePlay(targetChannelId);

    if (!wasPlaying && onRewardToast) {
      const latestTitle = gymFaithAudio.getState().currentTitleAr;
      onRewardToast(
        isAr ? `🎙️ بدأ تشغيل: ${latestTitle}` : `🎙️ Playing: ${latestTitle}`
      );
    }
  };

  const handleSelectEpisode = (series: FaithAudioSeries, ep: FaithAudioEpisode) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedSeries(series);
    gymFaithAudio.playEpisode(series.id, ep.id, 0);
    if (onRewardToast) {
      onRewardToast(
        isAr ? `📖 استماع إلى: ${series.titleAr} - ${ep.titleAr}` : `Listening to: ${ep.titleEn}`
      );
    }
  };

  const handleSelectChannel = (channel: GymAudioChannel) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    gymFaithAudio.setChannel(channel.id, true);
    if (onRewardToast) {
      onRewardToast(
        isAr ? `🎙️ استماع إلى: ${channel.titleAr}` : `Listening to: ${channel.titleEn}`
      );
    }
  };

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const isNow = gymFaithAudio.toggleFavorite(id);
    setFavorites(gymFaithAudio.getFavorites());
    if (onRewardToast) {
      onRewardToast(
        isNow
          ? (isAr ? '⭐ تمت الإضافة إلى المفضلة' : '⭐ Added to favorites')
          : (isAr ? 'تمت الإزالة من المفضلة' : 'Removed from favorites')
      );
    }
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customSheikh.trim() || !customUrl.trim()) return;

    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();

    const created = gymFaithAudio.addCustomSeries({
      titleAr: customTitle.trim(),
      sheikhAr: customSheikh.trim(),
      category: customCategory,
      audioUrl: customUrl.trim(),
      descriptionAr: customDesc.trim() || undefined,
    });

    const updated = gymFaithAudio.getAllSeries();
    setAllSeries(updated);
    setSelectedSeries(created);
    setIsAddCustomOpen(false);
    setCustomTitle('');
    setCustomSheikh('');
    setCustomUrl('');
    setCustomDesc('');

    // Play immediately
    gymFaithAudio.playEpisode(created.id, created.episodes[0].id, 0);

    if (onRewardToast) {
      onRewardToast(
        isAr
          ? `🎉 تم حفظ وبدء درس: ${created.titleAr}`
          : `🎉 Custom lesson saved & playing: ${created.titleAr}`
      );
    }
  };

  const handleDeleteCustom = (seriesId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundSynth.playTactileClick();
    gymFaithAudio.deleteCustomSeries(seriesId);
    const updated = gymFaithAudio.getAllSeries();
    setAllSeries(updated);
    if (selectedSeries.id === seriesId) {
      setSelectedSeries(updated[0] || FAITH_AUDIO_SERIES[0]);
    }
    if (onRewardToast) {
      onRewardToast(isAr ? 'تم حذف الدرس الخاص' : 'Custom lesson removed');
    }
  };

  const handleCycleSpeed = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const speeds = [1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(audioState.playbackRate) + 1) % speeds.length;
    gymFaithAudio.setPlaybackRate(speeds[nextIdx]);
  };

  const handleNextQuote = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setRandomQuoteIndex((prev) => (prev + 1) % SEERAH_DETERMINATION_QUOTES.length);
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '00:00';
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeQuote = SEERAH_DETERMINATION_QUOTES[randomQuoteIndex];
  const activeScholar = SCHOLARS_DIRECTORY.find((s) => s.id === selectedScholarId);

  return (
    <div
      className={`rounded-[26px] bg-[#141517] text-white border border-white/10 p-4 sm:p-5 shadow-md space-y-4 relative overflow-hidden transition-all ${className}`}
    >
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#e2defc]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#bce8c2]/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Track Identity & Library CTA */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        {/* Right (RTL Start): Artwork + Titles with Thumb-Friendly Click Area */}
        <div
          onClick={() => {
            if (onOpenFullModal) {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              onOpenFullModal();
            }
          }}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group select-none"
          title={isAr ? 'انقر لفتح المحراب الصوتي الشامل (40+ درساً)' : 'Click to open Sanctuary (40+ lessons)'}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border shadow-xs relative overflow-hidden group-hover:scale-105 transition-transform ${
              audioState.isPlaying
                ? 'bg-[#bce8c2] text-[#141517] border-[#1eb814]/40 ring-2 ring-[#bce8c2]/40'
                : 'bg-[#e2defc] text-[#141517] border-[#e2defc]/50'
            }`}
          >
            {audioState.mode === 'series' ? '🎙️' : currentChannel.icon || '🎙️'}
            {audioState.isPlaying && (
              <div className="absolute inset-x-0 bottom-1 flex items-end justify-center gap-0.5 h-3 px-1 pointer-events-none">
                <span className="w-0.5 bg-[#1eb814] rounded-full animate-bounce h-2" />
                <span className="w-0.5 bg-[#141517] rounded-full animate-pulse h-3" />
                <span className="w-0.5 bg-[#1eb814] rounded-full animate-bounce h-1.5" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#e2defc] text-[#141517]">
                {audioState.mode === 'series'
                  ? (isAr ? 'أثير الوعي والدروس' : 'Faith Stream')
                  : (isAr ? currentChannel.badgeAr : currentChannel.badgeEn)}
              </span>
              <span className="text-[11px] text-zinc-300 font-bold truncate">
                {audioState.currentSheikhAr}
              </span>
              {audioState.resumePoint && !audioState.isPlaying && (
                <span className="text-[10px] font-black text-[#141517] bg-[#fde6d8] px-2.5 py-0.5 rounded-full hidden xs:inline-block">
                  {isAr ? `نقطة التوقف: ${formatSeconds(audioState.resumePoint.currentTime)}` : `Resume: ${formatSeconds(audioState.resumePoint.currentTime)}`}
                </span>
              )}
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-[#bce8c2] transition-colors">
              {audioState.currentTitleAr}
            </h3>
          </div>
        </div>

        {/* Left (RTL End): Direct Library Modal Trigger & Optional Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenFullModal && (
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                onOpenFullModal();
              }}
              className="px-3.5 py-2 rounded-full bg-[#bce8c2] hover:bg-[#d4f5dc] text-[#141517] text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
              title={isAr ? 'فتح المحراب الصوتي الكامل (40+ درساً)' : 'Open Full Sanctuary'}
            >
              <span>🎙️</span>
              <span>{isAr ? 'المكتبة (40+)' : 'Library (40+)'}</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Compact Scrubber Progress Bar */}
      {!isCurrentSoundCloud && audioState.duration > 0 && (
        <div className="relative z-10 space-y-1">
          <input
            type="range"
            min="0"
            max={audioState.duration}
            value={audioState.currentTime}
            onChange={(e) => gymFaithAudio.seekTo(Number(e.target.value))}
            className="w-full accent-[#bce8c2] h-1.5 bg-white/15 rounded-full cursor-pointer transition-all"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300 font-bold px-0.5">
            <span>{formatSeconds(audioState.currentTime)}</span>
            {audioState.resumePoint && !audioState.isPlaying && (
              <span className="text-[#fde6d8] font-sans font-bold text-[10px] xs:hidden">
                {isAr ? `نقطة التوقف: ${formatSeconds(audioState.resumePoint.currentTime)}` : 'Ready to resume'}
              </span>
            )}
            <span>{formatSeconds(audioState.duration)}</span>
          </div>
        </div>
      )}

      {/* 3. Symmetrical Media Controls Deck */}
      <div className="relative z-10 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
        {/* Speed Selector Pill (Corner) */}
        <button
          type="button"
          onClick={handleCycleSpeed}
          className="px-3 py-1.5 rounded-full bg-[#e2defc] hover:brightness-95 text-[#141517] font-mono text-xs font-black transition-all active:scale-95 cursor-pointer shrink-0"
          title={isAr ? 'سرعة التشغيل' : 'Playback Speed'}
        >
          {audioState.playbackRate}x
        </button>

        {/* Center Cluster: Forced LTR for Standard Media Symmetry */}
        <div className="flex items-center gap-1.5 sm:gap-3" dir="ltr">
          {/* Prev Episode */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              gymFaithAudio.playPrevEpisode();
            }}
            disabled={!gymFaithAudio.hasPrevEpisode()}
            className="p-2.5 rounded-full bg-white/5 text-zinc-200 hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer"
            title={isAr ? 'الحلقة السابقة' : 'Previous Episode'}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Rewind 15s */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              gymFaithAudio.seekBy(-15);
            }}
            className="p-2.5 rounded-full bg-white/5 text-zinc-200 hover:bg-white/15 transition-all active:scale-90 cursor-pointer"
            title={isAr ? 'تأخير 15 ثانية' : 'Rewind 15s'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Master Play/Pause: Perfectly round 48px button with Habitline Mint/Amber tokens */}
          <div className="mx-1 sm:mx-1.5">
            <button
              type="button"
              onClick={() => handleTogglePlay()}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer ${
                audioState.isLoading
                  ? 'bg-[#e2defc] text-[#141517]'
                  : audioState.isPlaying
                  ? 'bg-[#fde6d8] hover:brightness-95 text-[#141517] ring-2 ring-[#ff5500]/40'
                  : 'bg-[#bce8c2] hover:bg-[#d4f5dc] text-[#141517] ring-2 ring-[#1eb814]/40'
              }`}
              title={audioState.isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
            >
              {audioState.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#141517]" />
              ) : audioState.isPlaying ? (
                <Pause className="w-5 h-5 fill-[#141517] text-[#141517]" />
              ) : (
                <Play className="w-5 h-5 fill-[#141517] text-[#141517] ps-0.5" />
              )}
            </button>
          </div>

          {/* Forward 15s */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              gymFaithAudio.seekBy(15);
            }}
            className="p-2.5 rounded-full bg-white/5 text-zinc-200 hover:bg-white/15 transition-all active:scale-90 cursor-pointer"
            title={isAr ? 'تقديم 15 ثانية' : 'Fast-forward 15s'}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Next Episode */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              gymFaithAudio.playNextEpisode();
            }}
            disabled={!gymFaithAudio.hasNextEpisode()}
            className="p-2.5 rounded-full bg-white/5 text-zinc-200 hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer"
            title={isAr ? 'الحلقة التالية' : 'Next Episode'}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Mute Pill (Corner) */}
        <button
          type="button"
          onClick={() => gymFaithAudio.setVolume(audioState.isMuted ? 0.8 : 0)}
          className={`p-2.5 rounded-full transition-all active:scale-90 cursor-pointer shrink-0 ${
            audioState.isMuted
              ? 'bg-[#fce2e6] text-[#141517]'
              : 'bg-white/10 text-[#bce8c2] hover:bg-white/20'
          }`}
          title={audioState.isMuted ? (isAr ? 'إلغاء الكتم' : 'Unmute') : (isAr ? 'كتم الصوت' : 'Mute')}
        >
          {audioState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* 4. Series Drawer Toggle with Tactile Pill Button */}
      <div className="relative z-10 flex items-center justify-center pt-0.5">
        <button
          type="button"
          onClick={() => {
            soundSynth.playTactileClick();
            setIsSeriesListOpen(!isSeriesListOpen);
          }}
          className="text-[11px] font-black text-[#141517] bg-[#e2defc] hover:bg-[#d4f5dc] flex items-center gap-1.5 transition-all py-1.5 px-4 rounded-full cursor-pointer min-h-[34px] active:scale-95 shadow-2xs"
        >
          <span>{isAr ? (isSeriesListOpen ? 'طي قائمة السلاسل' : 'تصفح قائمة السلاسل هنا') : (isSeriesListOpen ? 'Hide series' : 'Browse series here')}</span>
          {isSeriesListOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* SoundCloud Embedded Widget if current track is from SoundCloud */}
      {isCurrentSoundCloud && activeEpisode?.audioUrl && (
        <div className="rounded-2xl overflow-hidden border border-[#fde6d8]/30 bg-white/5 p-2.5 space-y-1.5 animate-fade-in relative z-10">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#fde6d8] px-1">
            <span>🟠 {isAr ? 'مشغل ساوندكلاود مدمج' : 'SoundCloud Player'}</span>
            <span className="font-mono text-zinc-400 truncate max-w-[200px]">
              {activeEpisode.titleAr}
            </span>
          </div>
          <iframe
            width="100%"
            height="140"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={getSoundCloudEmbedUrl(activeEpisode.audioUrl)}
            className="w-full rounded-xl"
          />
        </div>
      )}

      {/* YouTube Audio Remote Control (delegates to single PersistentYouTubeHost) */}
      {isCurrentYouTube && activeEpisode?.audioUrl && (
        <div className="relative z-10">
          <YouTubeAudioPlayer onRewardToast={onRewardToast} />
        </div>
      )}

      {/* Network Offline / Weak Signal Alert */}
      {audioState.isLoading && typeof navigator !== 'undefined' && !navigator.onLine && (
        <div className="p-3 rounded-2xl bg-[#fde6d8] text-[#141517] text-[11px] font-bold flex items-center gap-2 relative z-10 animate-fade-in">
          <WifiOff className="w-4 h-4 text-[#ff5500] shrink-0" />
          <span>{isAr ? '⚠️ ضعف أو انقطاع في الشبكة.. محاولة استئناف البث تلقائياً' : 'Weak/Offline network.. Reconnecting'}</span>
        </div>
      )}

      {/* Error Notification */}
      {audioState.hasError && (
        <div className="p-3 rounded-2xl bg-[#fce2e6] text-[#141517] text-[11px] font-bold flex items-center justify-between gap-2 relative z-10 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <span>⚠️</span>
            <span className="truncate">{audioState.errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => handleTogglePlay()}
            className="px-3 py-1 rounded-full bg-[#141517] text-white font-black text-[10px] shrink-0 transition-transform active:scale-95 cursor-pointer"
          >
            {isAr ? 'إعادة المحاولة ↻' : 'Retry ↻'}
          </button>
        </div>
      )}

      {/* 4. Seerah Determination Quote Card */}
      {showQuoteCard && (
        <div className="relative z-10 p-4 rounded-[22px] bg-[#fde6d8] text-[#141517] space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚔️</span>
              <h4 className="text-xs sm:text-sm font-black text-[#141517]">
                {activeQuote.titleAr}
              </h4>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleNextQuote}
                className="px-3 py-1 rounded-full bg-[#141517] text-[#fde6d8] text-[11px] font-black transition-transform active:scale-95 cursor-pointer"
              >
                {isAr ? 'موقف آخر ↻' : 'Next ↻'}
              </button>
              <button
                type="button"
                onClick={() => setShowQuoteCard(false)}
                className="p-1 rounded-full hover:bg-black/10 text-[#141517] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-[#141517] leading-relaxed font-sans font-bold">
            "{activeQuote.quoteAr}"
          </p>
          <div className="pt-2 border-t border-[#141517]/15 flex items-center justify-between text-[10px]">
            <span className="font-black text-[#141517]">
              ⚡ العِبرة والعزيمة: {activeQuote.lessonAr}
            </span>
            <span className="font-mono font-bold text-[#141517]/70">
              [{activeQuote.sourceAr}]
            </span>
          </div>
        </div>
      )}

      {/* 5. Comprehensive Scholars & Series Navigation Drawer */}
      {isSeriesListOpen && (
        <div className="relative z-20 space-y-3.5 pt-3.5 border-t border-white/10 animate-fade-in">
          {/* Mode Switcher: On-demand Series vs Live Radios */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setPlayerTab('series');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                playerTab === 'series'
                  ? 'bg-[#bce8c2] text-[#141517] shadow-xs'
                  : 'text-zinc-300 hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{isAr ? 'سلاسل وخطب ودروس (اختر شيخك)' : 'Lectures & Sermons by Scholar'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setPlayerTab('radio');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                playerTab === 'radio'
                  ? 'bg-[#e2defc] text-[#141517] shadow-xs'
                  : 'text-zinc-300 hover:bg-white/10'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>{isAr ? 'إذاعات مباشرة وتلاوات' : 'Live Radios'}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={
                isAr
                  ? '🔍 ابحث عن شيخ، خطبة، أو موضوع (مثلاً: أحمد عبد المنعم، أيمن عبد الرحيم، الطريفي، كشك، يقين، همة)...'
                  : 'Search by scholar, sermon, or topic...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 px-3 ps-9 rounded-2xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-zinc-400 focus:outline-hidden focus:border-[#bce8c2]"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Scholar / Sheikh Selection Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#bce8c2]" />
                <span>{isAr ? 'اختر الشيخ أو المتحدث المفضل:' : 'Select Scholar / Speaker:'}</span>
              </span>
              {selectedScholarId && (
                <button
                  type="button"
                  onClick={() => setSelectedScholarId(null)}
                  className="text-[10px] text-[#bce8c2] font-bold hover:underline cursor-pointer"
                >
                  {isAr ? 'عرض الكل (إلغاء التحديد)' : 'Clear Filter'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setSelectedScholarId(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedScholarId === null
                    ? 'bg-[#bce8c2] text-[#141517] shadow-xs'
                    : 'bg-white/10 text-zinc-200 hover:bg-white/15'
                }`}
              >
                <span>✨</span>
                <span>{isAr ? 'كل الشيوخ' : 'All Scholars'}</span>
              </button>

              {SCHOLARS_DIRECTORY.map((scholar) => {
                const isSelected = selectedScholarId === scholar.id;
                return (
                  <button
                    key={scholar.id}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      const nextId = isSelected ? null : scholar.id;
                      setSelectedScholarId(nextId);
                      if (nextId) {
                        const match = allSeries.find((s) => s.scholarId === nextId);
                        if (match) setSelectedSeries(match);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-[#e2defc] text-[#141517] shadow-sm ring-2 ring-[#e2defc]/40'
                        : 'bg-white/10 text-zinc-200 hover:bg-white/15 border border-white/10'
                    }`}
                    title={scholar.specialityAr}
                  >
                    <span className="text-sm">{scholar.avatarEmoji}</span>
                    <span>{scholar.nameAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Scholar Spotlight Banner */}
          {activeScholar && (
            <div className="p-3 rounded-2xl bg-[#e2defc] text-[#141517] flex items-center justify-between gap-2 text-xs animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{activeScholar.avatarEmoji}</span>
                <div className="min-w-0">
                  <span className="font-black text-[#141517]">
                    {activeScholar.nameAr}:
                  </span>
                  <span className="text-[11px] text-[#141517]/80 font-bold ms-1 line-clamp-1">
                    {activeScholar.specialityAr}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScholarId(null)}
                className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#141517] text-[#e2defc] font-black shrink-0 cursor-pointer"
              >
                ✕ {isAr ? 'عرض الكل' : 'Clear'}
              </button>
            </div>
          )}

          {/* Category Topics Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {GYM_AUDIO_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    haptic.vibrateLight();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-black transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#bce8c2] text-[#141517] shadow-xs'
                      : 'bg-white/10 text-zinc-300 border border-white/10 hover:bg-white/15'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                  {cat.id === 'favorites' && favorites.length > 0 && (
                    <span className="ms-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-[#fde6d8] text-[#141517] font-mono font-black">
                      {favorites.length}
                    </span>
                  )}
                  {cat.id === 'downloaded' && offlineAudioService.getDownloadedEpisodes().length > 0 && (
                    <span className="ms-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-[#1eb814] text-white font-mono font-bold">
                      {offlineAudioService.getDownloadedEpisodes().length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>


          {/* Offline Status & Storage Indicator */}
          {offlineAudioService.getDownloadedEpisodes().length > 0 && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#bce8c2] text-[#141517] text-xs shadow-2xs animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="w-4 h-4 text-[#141517] shrink-0" />
                <span className="text-[11px] font-black text-[#141517] truncate">
                  {isAr
                    ? `المحمل على هاتفك: ${offlineAudioService.getDownloadedEpisodes().length} درس (${offlineAudioService.getTotalDownloadedSizeFormatted()}) • بدون إنترنت`
                    : `Offline on device: ${offlineAudioService.getDownloadedEpisodes().length} lessons (${offlineAudioService.getTotalDownloadedSizeFormatted()})`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-black text-[#bce8c2] bg-[#141517] px-2.5 py-0.5 rounded-full">
                  {isAr ? 'بدون باقة ⚡' : '0 Data ⚡'}
                </span>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm(isAr ? 'هل تريد حذف جميع الدروس المحملة لتحرير مساحة الهاتف؟' : 'Delete all downloaded lessons to free up space?')) {
                      await offlineAudioService.clearAllDownloads();
                      if (onRewardToast) {
                        onRewardToast(isAr ? '✓ تم تفريغ مساحة الهاتف وحذف المحملات' : 'All downloads cleared');
                      }
                    }
                  }}
                  className="p-1.5 rounded-full text-[#141517] hover:bg-black/10 transition-colors cursor-pointer"
                  title={isAr ? 'تفريغ الذاكرة وحذف جميع المحملات' : 'Delete all downloaded files'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 1: On-Demand Series & Lectures */}
          {playerTab === 'series' && (
            <div className="space-y-3">
              {/* Series Picker Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredSeries.map((s) => {
                  const isCurrent = effectiveSeries?.id === s.id;
                  const isFav = favorites.includes(s.id);

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setSelectedSeries(s);
                      }}
                      className={`p-3.5 rounded-[22px] border text-start transition-all cursor-pointer space-y-1.5 relative group ${
                        isCurrent
                          ? 'bg-[#e2defc] text-[#141517] border-[#e2defc] shadow-xs ring-2 ring-[#e2defc]/40'
                          : 'bg-white/5 text-white border-white/10 hover:border-[#e2defc]/50 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-base">{s.icon}</span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full truncate ${
                              isCurrent
                                ? 'bg-[#141517] text-[#e2defc]'
                                : 'bg-[#e2defc]/20 text-[#e2defc]'
                            }`}
                          >
                            {s.badgeAr}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {s.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustom(s.id, e)}
                              className={`p-1 transition-colors cursor-pointer ${
                                isCurrent ? 'text-[#141517]/60 hover:text-red-600' : 'text-zinc-400 hover:text-red-400'
                              }`}
                              title={isAr ? 'حذف هذا الدرس الخاص' : 'Delete custom lesson'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(s.id, e)}
                            className="p-1 transition-colors cursor-pointer"
                            title={isFav ? (isAr ? 'إزالة من المفضلة' : 'Unfavorite') : (isAr ? 'إضافة إلى المفضلة' : 'Favorite')}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                isFav
                                  ? 'fill-[#ff5500] text-[#ff5500]'
                                  : isCurrent
                                  ? 'text-[#141517]/50'
                                  : 'text-zinc-400'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h5 className={`text-xs font-black truncate ${isCurrent ? 'text-[#141517]' : 'text-white'}`}>
                          {s.titleAr}
                        </h5>
                        <p className={`text-[11px] font-bold truncate ${isCurrent ? 'text-[#141517]/80' : 'text-[#bce8c2]'}`}>
                          {s.sheikhAr}
                        </p>
                        <p className={`text-[10px] line-clamp-1 mt-0.5 ${isCurrent ? 'text-[#141517]/70' : 'text-zinc-400'}`}>
                          {s.descriptionAr}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredSeries.length === 0 && (
                <div className="p-6 text-center rounded-[22px] border border-dashed border-white/15 space-y-2.5 bg-white/5">
                  <p className="text-xs text-zinc-300">
                    {selectedCategory === 'downloaded'
                      ? (isAr
                          ? 'لم تقم بتحميل أي درس بعد. يمكنك النقر على زر التحميل 📥 بجانب أي حلقة لحفظها على هاتفك والاستماع بدون إنترنت!'
                          : 'No downloaded lessons yet. Tap the download button 📥 next to any episode to save it for offline listening!')
                      : isAr
                      ? 'لا توجد دروس تطابق هذا البحث أو التصفية.'
                      : 'No lectures match this search or filter.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCategory === 'downloaded') {
                        setSelectedCategory('all');
                      } else {
                        setIsAddCustomOpen(true);
                      }
                    }}
                    className="px-4 py-2 rounded-full bg-[#bce8c2] hover:bg-[#d4f5dc] text-[#141517] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                  >
                    {selectedCategory === 'downloaded' ? (
                      <span>{isAr ? 'تصفح جميع الدروس والسلاسل 🎙️' : 'Browse All Lectures 🎙️'}</span>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAr ? 'أضف رابط الدرس الذي تريده الآن' : 'Add custom lesson URL'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Selected Series Episodes List (Guarded against leaks) */}
              {effectiveSeries && filteredSeries.some((s) => s.id === effectiveSeries.id) && (
                <div className="p-4 rounded-[22px] bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{effectiveSeries.icon}</span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-white">
                          {effectiveSeries.titleAr} ({effectiveSeries.sheikhAr})
                        </h4>
                        <p className="text-[10px] text-zinc-400">
                          {effectiveSeries.descriptionAr}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-[#bce8c2] text-[#141517]">
                      {effectiveSeries.totalEpisodes} {isAr ? 'حلقات' : 'episodes'}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {effectiveSeries.episodes.map((ep) => {
                      const isPlayingEp =
                        audioState.mode === 'series' &&
                        audioState.currentSeriesId === effectiveSeries.id &&
                        audioState.currentEpisodeId === ep.id &&
                        audioState.isPlaying;
                      const isDownloaded = offlineAudioService.isDownloaded(ep.id);
                      const isDownloading = offlineAudioService.isDownloading(ep.id);
                      const downloadProgress = offlineAudioService.getProgress(ep.id);
                      const isSoundCloud = isSoundCloudUrl(ep.audioUrl);
                      const isYouTube = isYouTubeUrl(ep.audioUrl);

                      return (
                        <div
                          key={ep.id}
                          onClick={() => handleSelectEpisode(effectiveSeries, ep)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            isPlayingEp
                              ? 'bg-[#bce8c2] border-[#1eb814]/40 text-[#141517] shadow-xs'
                              : 'bg-white/5 border-white/10 text-white hover:border-[#bce8c2]/50 hover:bg-white/10'
                          }`}
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-mono font-black flex items-center justify-center shrink-0 ${
                                  isPlayingEp
                                    ? 'bg-[#141517] text-[#bce8c2]'
                                    : 'bg-[#e2defc] text-[#141517]'
                                }`}
                              >
                                {ep.episodeNumber}
                              </span>
                              <h5 className={`text-xs font-black truncate ${isPlayingEp ? 'text-[#141517]' : 'text-white'}`}>
                                {ep.titleAr}
                              </h5>
                              {isDownloaded && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#141517] text-[#bce8c2] shrink-0">
                                  {isAr ? 'أوفلاين ⚡' : 'Offline ⚡'}
                                </span>
                              )}
                              {isYouTube && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#fce2e6] text-[#141517] shrink-0">
                                  {isAr ? 'يوتيوب 🔴' : 'YouTube 🔴'}
                                </span>
                              )}
                              {isSoundCloud && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#fde6d8] text-[#141517] shrink-0">
                                  {isAr ? 'ساوندكلاود ☁️' : 'SoundCloud ☁️'}
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] line-clamp-1 ps-7 ${isPlayingEp ? 'text-[#141517]/75 font-bold' : 'text-zinc-400'}`}>
                              {ep.summaryAr}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Offline Download / Status / Delete Controls */}
                            {!isSoundCloud && (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {isDownloading ? (
                                  <div className="flex items-center gap-1 text-[10px] font-mono font-black text-[#141517] bg-[#fde6d8] px-2.5 py-1 rounded-full">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>{downloadProgress}%</span>
                                  </div>
                                ) : isDownloaded ? (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      soundSynth.playTactileClick();
                                      await offlineAudioService.deleteDownload(ep.id);
                                      if (onRewardToast) {
                                        onRewardToast(isAr ? 'تم حذف الملف من الهاتف لتوفير المساحة' : 'Deleted from device');
                                      }
                                    }}
                                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                    title={isAr ? 'حذف من ذاكرة الهاتف لتوفير المساحة' : 'Delete downloaded audio'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      soundSynth.playTactileClick();
                                      haptic.vibrateLight();
                                      try {
                                        if (onRewardToast) {
                                          onRewardToast(isAr ? `جاري تحميل "${ep.titleAr}" على هاتفك...` : `Downloading...`);
                                        }
                                        await offlineAudioService.downloadEpisode(ep, effectiveSeries);
                                        if (onRewardToast) {
                                          onRewardToast(isAr ? `✓ تم حفظ "${ep.titleAr}" على هاتفك! متاح بدون نت وبدون باقة` : 'Saved for offline listening!');
                                        }
                                      } catch (err: any) {
                                        if (onRewardToast) {
                                          onRewardToast(isAr ? `تعذر التحميل: ${err.message || 'خطأ في الاتصال'}` : 'Download failed');
                                        }
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#e2defc] hover:bg-[#d4f5dc] text-[#141517] transition-colors flex items-center gap-1 cursor-pointer"
                                    title={isAr ? 'تحميل على الهاتف للاستماع بدون نت وبدون استهلاك الباقة' : 'Download for offline playback'}
                                  >
                                    <Download className="w-3 h-3" />
                                    <span className="hidden sm:inline">{isAr ? 'تحميل' : 'Save'}</span>
                                  </button>
                                )}
                              </div>
                            )}

                            <span className={`text-[10px] font-mono font-bold ${isPlayingEp ? 'text-[#141517]' : 'text-zinc-400'}`}>
                              {ep.durationFormatted}
                            </span>
                            <span
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                                isPlayingEp
                                  ? 'bg-[#141517] text-[#bce8c2]'
                                  : 'bg-white/10 text-zinc-200'
                              }`}
                            >
                              {isPlayingEp ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Live Radio Channels */}
          {playerTab === 'radio' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto scrollbar-thin p-1">
              {filteredChannels.map((c) => {
                const isCurrent = c.id === currentChannel.id && audioState.mode === 'channel';
                const isPlayingThis = isCurrent && audioState.isPlaying;
                const isFav = favorites.includes(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectChannel(c)}
                    className={`p-3 rounded-[22px] border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isCurrent
                        ? 'bg-[#bce8c2] text-[#141517] border-[#1eb814]/40 shadow-xs'
                        : 'bg-white/5 text-white border-white/10 hover:border-[#bce8c2]/40 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{c.icon}</span>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                              isCurrent ? 'bg-[#141517] text-[#bce8c2]' : 'bg-[#e2defc]/20 text-[#e2defc]'
                            }`}
                          >
                            {isAr ? c.badgeAr : c.badgeEn}
                          </span>
                          <span className={`text-[10px] font-bold truncate ${isCurrent ? 'text-[#141517]/80' : 'text-zinc-400'}`}>
                            {isAr ? c.sheikhAr : c.sheikhEn}
                          </span>
                        </div>
                        <h5 className={`text-xs font-black truncate ${isCurrent ? 'text-[#141517]' : 'text-white'}`}>
                          {isAr ? c.titleAr : c.titleEn}
                        </h5>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(c.id, e)}
                        className="p-1 transition-colors cursor-pointer"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isFav
                              ? 'fill-[#ff5500] text-[#ff5500]'
                              : isCurrent
                              ? 'text-[#141517]/50'
                              : 'text-zinc-400'
                          }`}
                        />
                      </button>

                      {isPlayingThis ? (
                        <span className="w-7 h-7 rounded-full bg-[#141517] text-[#bce8c2] flex items-center justify-center text-xs">
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        </span>
                      ) : (
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                            isCurrent ? 'bg-[#141517] text-[#bce8c2]' : 'bg-white/10 text-zinc-200'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. Modal for Adding Custom Lecture / Sheikh / Audio URL */}
      {isAddCustomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddCustomOpen(false);
            }
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              setIsAddCustomOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-[26px] bg-white dark:bg-[#141517] border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-[#e2defc]/40 dark:bg-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-[#141517] text-[#e2defc]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#141517] dark:text-white">
                    {isAr ? 'إضافة درس أو شيخ خاص بك 🎙️' : 'Add Custom Lecture / Sheikh'}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    {isAr
                      ? 'أدخل تفاصيل أي شيخ أو سلسلة صوتية تفضل الاستماع إليها'
                      : 'Enter any scholar or lecture stream you love listening to'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveCustom} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#141517] dark:text-zinc-300 block mb-1">
                  {isAr ? 'اسم الشيخ أو المتحدث:' : 'Scholar / Speaker Name:'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثلاً: الشيخ عبد الرزاق البدر، د. حازم شومان...' : 'e.g. Sheikh Abdul Razzaq Al-Badr'}
                  value={customSheikh}
                  onChange={(e) => setCustomSheikh(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs text-[#141517] dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#141517] dark:text-zinc-300 block mb-1">
                  {isAr ? 'عنوان الخطبة أو الدرس أو السلسلة:' : 'Lecture / Series Title:'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثلاً: أسباب انشراح الصدر وزوال الهم' : 'e.g. Causes of Joy and Inner Peace'}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs text-[#141517] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#141517] dark:text-zinc-300 block mb-1">
                    {isAr ? 'القسم / التصنيف:' : 'Category:'}
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as GymAudioCategory)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs text-[#141517] dark:text-white"
                  >
                    <option value="tazkiyah">{isAr ? '💖 تزكية ورقائق' : 'Spiritual'}</option>
                    <option value="khutbah">{isAr ? '🎙️ خطب ومواعظ' : 'Khutbah'}</option>
                    <option value="tafseer">{isAr ? '📖 تفسير وتدبر' : 'Tafseer'}</option>
                    <option value="mindset">{isAr ? '🌱 بناء النفس والهمة' : 'Mindset'}</option>
                    <option value="history">{isAr ? '⚔️ تاريخ وقادة' : 'History'}</option>
                    <option value="fiqh">{isAr ? '⚖️ فقه وأحكام' : 'Fiqh'}</option>
                    <option value="siyra">{isAr ? '🕌 السيرة النبوية' : 'Seerah'}</option>
                    <option value="anbiya">{isAr ? '📜 قصص الأنبياء' : 'Prophets'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#141517] dark:text-zinc-300 block mb-1">
                    {isAr ? 'رابط الصوت أو ساوندكلاود:' : 'Audio or SoundCloud URL:'} *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={
                      isAr
                        ? 'https://soundcloud.com/... أو https://...mp3'
                        : 'https://soundcloud.com/... or https://...mp3'
                    }
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-mono text-[#141517] dark:text-white"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-[#fde6d8] block mt-1 leading-tight">
                    {isAr
                      ? '💡 يدعم روابط ساوندكلاود (SoundCloud)، وبودكاست أبل وجوجل، وملفات MP3 المباشرة.'
                      : 'Supports SoundCloud tracks, podcast episodes, and direct MP3 links.'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#141517] dark:text-zinc-300 block mb-1">
                  {isAr ? 'نبذة أو ملاحظة شخصية (اختياري):' : 'Personal Note (optional):'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثلاً: درس رائع للاستماع أثناء الجري أو قيادة السيارة' : 'e.g. great listen for commute'}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs text-[#141517] dark:text-white"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCustomOpen(false)}
                  className="py-2 px-4 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-full bg-[#bce8c2] hover:bg-[#d4f5dc] text-[#141517] font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حفظ والتشغيل فوراً 🎙️' : 'Save & Play'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

