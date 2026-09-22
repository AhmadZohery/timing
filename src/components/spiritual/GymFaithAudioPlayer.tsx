import React, { useState, useEffect, useMemo } from 'react';
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
  type GymFaithAudioState,
} from '../../services/gymFaithAudioService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface GymFaithAudioPlayerProps {
  className?: string;
  onRewardToast?: (msg: string) => void;
  onClose?: () => void;
}

export const GymFaithAudioPlayer: React.FC<GymFaithAudioPlayerProps> = ({
  className = '',
  onRewardToast,
  onClose,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [audioState, setAudioState] = useState<GymFaithAudioState>(gymFaithAudio.getState());
  const [playerTab, setPlayerTab] = useState<'series' | 'radio'>('series');
  const [allSeries, setAllSeries] = useState<FaithAudioSeries[]>(() => gymFaithAudio.getAllSeries());
  const [selectedSeries, setSelectedSeries] = useState<FaithAudioSeries>(
    () => gymFaithAudio.getAllSeries()[0] || FAITH_AUDIO_SERIES[0]
  );
  const [isSeriesListOpen, setIsSeriesListOpen] = useState(true);
  const [showQuoteCard, setShowQuoteCard] = useState(false);
  const [randomQuoteIndex, setRandomQuoteIndex] = useState(0);
  const [, setOfflineTick] = useState(0);

  useEffect(() => {
    return offlineAudioService.subscribe(() => setOfflineTick((t) => t + 1));
  }, []);

  // Active episode & SoundCloud detection
  const activeEpisode = useMemo(() => {
    if (audioState.mode === 'series' && audioState.currentSeriesId && audioState.currentEpisodeId) {
      const s = allSeries.find((ser) => ser.id === audioState.currentSeriesId);
      return s?.episodes.find((e) => e.id === audioState.currentEpisodeId) || null;
    }
    return selectedSeries?.episodes[0] || null;
  }, [audioState.mode, audioState.currentSeriesId, audioState.currentEpisodeId, allSeries, selectedSeries]);

  const isCurrentSoundCloud = useMemo(() => {
    return isSoundCloudUrl(activeEpisode?.audioUrl);
  }, [activeEpisode]);

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

  // Multi-Criteria Series Filtering
  const filteredSeries = useMemo(() => {
    let list = allSeries;

    // Filter by Scholar
    if (selectedScholarId) {
      const scholar = SCHOLARS_DIRECTORY.find((s) => s.id === selectedScholarId);
      if (scholar) {
        list = list.filter(
          (s) =>
            s.sheikhAr.includes(scholar.nameAr) ||
            scholar.nameAr.includes(s.sheikhAr) ||
            s.sheikhEn.toLowerCase().includes(scholar.nameEn.toLowerCase())
        );
      }
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

  const handleTogglePlay = (targetChannelId?: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    gymFaithAudio.togglePlay(targetChannelId);

    if (!audioState.isPlaying && onRewardToast) {
      onRewardToast(
        isAr ? `🎙️ بدأ تشغيل: ${audioState.currentTitleAr}` : `🎙️ Playing: ${audioState.currentTitleAr}`
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
      data-no-swipe="true"
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-500/[0.07] via-white dark:via-[#14151E] to-white dark:to-[#12131A] border border-amber-500/25 dark:border-amber-500/20 shadow-sm p-4 sm:p-5 space-y-3.5 ${className}`}
    >
      {/* Top Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Bar: Title, Live Status, Add Custom, & Wisdom */}
      <div className="flex items-center justify-between gap-2 flex-wrap relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
            🎙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-950 dark:text-white">
                {isAr ? 'أثير الوعي والدروس الإيمانية والفكرية' : 'Faith & Knowledge Audio Sanctuary'}
              </span>
              {audioState.isPlaying && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/60 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{isAr ? 'يعمل الآن' : 'Playing'}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 font-medium">
              {isAr
                ? 'نخبة علماء ومفكري أهل السنة، التزكية، وتأسيس الوعي المعاصر'
                : 'Orthodox Sunni Scholars, Tazkiyah & Contemporary Awareness'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setIsAddCustomOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
            title={isAr ? 'إضافة درس أو رابط ساوندكلاود أو MP3' : 'Add custom lecture / SoundCloud link'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'أضف درساً خاصاً' : 'Add Custom'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              setShowQuoteCard(!showQuoteCard);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              showQuoteCard
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50 hover:bg-amber-100'
            }`}
            title={isAr ? 'قبسات من عزائم السيرة والهمم' : 'Faith & Resolve Quotes'}
          >
            <span>💡</span>
            <span>{isAr ? 'قبس' : 'Quote'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Quick Resume Banner (Cross-Station Continuity across Gym, Commute & Dashboard) */}
      {audioState.resumePoint && !audioState.isPlaying && (
        <div className="relative z-10 p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border border-amber-400/40 dark:border-amber-600/30 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 text-xs">
              ⏳
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block">
                {isAr ? 'استئناف من حيث توقفت (الجيم أو الطريق):' : 'Resume where you left off:'}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                {audioState.resumePoint.episodeTitleAr || audioState.resumePoint.channelTitleAr}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                {audioState.resumePoint.sheikhAr} • {formatSeconds(audioState.resumePoint.currentTime)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              gymFaithAudio.resumeLastPlayback();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isAr ? 'استئناف' : 'Resume'}</span>
          </button>
        </div>
      )}

      {/* 3. Primary Player Spotlight Card */}
      <div className="relative z-10 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
              {audioState.mode === 'series' ? '🎙️' : currentChannel.icon}
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/40">
                  {audioState.mode === 'series'
                    ? isAr ? 'سلسلة / درس محدد' : 'Selected Series'
                    : isAr ? currentChannel.badgeAr : currentChannel.badgeEn}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium truncate">
                  {audioState.currentSheikhAr}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 truncate">
                {audioState.currentTitleAr}
              </h3>
            </div>
          </div>

          {/* Toggle Episodes Drawer Button */}
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setIsSeriesListOpen(!isSeriesListOpen);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer shrink-0"
          >
            <span>{isAr ? 'تصفح الشيوخ والمواضيع' : 'Browse All'}</span>
            {isSeriesListOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* SoundCloud Embedded Widget if current track is from SoundCloud */}
        {isCurrentSoundCloud && activeEpisode?.audioUrl && (
          <div className="rounded-2xl overflow-hidden border border-amber-500/30 bg-black/5 dark:bg-black/30 p-2 space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300 px-1">
              <span className="flex items-center gap-1.5">
                <span>🟠</span>
                <span>{isAr ? 'مشغل ساوندكلاود مدمج' : 'SoundCloud Player'}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                {activeEpisode.titleAr}
              </span>
            </div>
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={getSoundCloudEmbedUrl(activeEpisode.audioUrl)}
              className="w-full rounded-xl"
            />
          </div>
        )}

        {/* Time Progress Scrubber (for on-demand episodes) */}
        {!isCurrentSoundCloud && audioState.duration > 0 && (
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={audioState.duration}
              value={audioState.currentTime}
              onChange={(e) => gymFaithAudio.seekTo(Number(e.target.value))}
              className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400">
              <span>{formatSeconds(audioState.currentTime)}</span>
              <span>{formatSeconds(audioState.duration)}</span>
            </div>
          </div>
        )}

        {/* Tactical Large Controls Strip */}
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
          {/* Main Huge Play / Pause, Prev/Next Episodes & 15s Skips */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Previous Episode */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                gymFaithAudio.playPrevEpisode();
              }}
              disabled={!gymFaithAudio.hasPrevEpisode()}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title={isAr ? 'الحلقة السابقة ⏮️' : 'Previous Episode ⏮️'}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Skip 15s backward */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                gymFaithAudio.seekBy(-15);
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer text-xs font-mono"
              title={isAr ? 'تأخير 15 ثانية' : 'Rewind 15s'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleTogglePlay()}
              className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm cursor-pointer select-none active:scale-95 transition-all shadow-sm ${
                audioState.isPlaying
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              }`}
            >
              {audioState.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : audioState.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}

              <span>
                {audioState.isLoading
                  ? isAr ? 'جاري الاتصال...' : 'Connecting...'
                  : audioState.isPlaying
                  ? isAr ? 'إيقاف مؤقت' : 'Pause'
                  : isAr ? 'استماع الآن 🎙️' : 'Listen Now 🎙️'}
              </span>

              {audioState.isPlaying && (
                <div className="flex items-end gap-0.5 h-3.5 ms-1">
                  <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '70%', animationDuration: '0.45s' }} />
                  <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '100%', animationDuration: '0.3s' }} />
                  <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '40%', animationDuration: '0.6s' }} />
                  <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '85%', animationDuration: '0.4s' }} />
                </div>
              )}
            </button>

            {/* Skip 15s forward */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                gymFaithAudio.seekBy(15);
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer text-xs font-mono"
              title={isAr ? 'تقديم 15 ثانية' : 'Fast forward 15s'}
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
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title={isAr ? 'الحلقة التالية ⏭️' : 'Next Episode ⏭️'}
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Playback Speed */}
            <button
              type="button"
              onClick={handleCycleSpeed}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-mono text-xs font-black transition-colors cursor-pointer"
              title={isAr ? 'تغيير سرعة التشغيل' : 'Playback speed'}
            >
              {audioState.playbackRate}x
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                gymFaithAudio.setVolume(audioState.isMuted ? 0.8 : 0);
              }}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer transition-colors"
            >
              {audioState.isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioState.isMuted ? 0 : audioState.volume}
              onChange={(e) => gymFaithAudio.setVolume(parseFloat(e.target.value))}
              className="w-16 sm:w-20 accent-amber-600 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Error Notification */}
        {audioState.hasError && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center justify-between">
            <span>⚠️ {audioState.errorMessage}</span>
            <button
              type="button"
              onClick={() => handleTogglePlay()}
              className="underline font-bold cursor-pointer"
            >
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}
      </div>

      {/* 4. Seerah Determination Quote Card */}
      {showQuoteCard && (
        <div className="relative z-10 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 dark:border-amber-600/30 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚔️</span>
              <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200">
                {activeQuote.titleAr}
              </h4>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleNextQuote}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-[11px] font-bold text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/40 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                {isAr ? 'موقف آخر ↻' : 'Next ↻'}
              </button>
              <button
                type="button"
                onClick={() => setShowQuoteCard(false)}
                className="p-1 rounded-lg hover:bg-amber-200/50 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-800 dark:text-amber-100 leading-relaxed font-sans font-medium">
            "{activeQuote.quoteAr}"
          </p>
          <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px]">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              ⚡ العِبرة والعزيمة: {activeQuote.lessonAr}
            </span>
            <span className="font-mono text-slate-500 dark:text-zinc-400">
              [{activeQuote.sourceAr}]
            </span>
          </div>
        </div>
      )}

      {/* 5. Comprehensive Scholars & Series Navigation Drawer */}
      {isSeriesListOpen && (
        <div className="relative z-20 space-y-3 pt-3 border-t border-slate-200 dark:border-zinc-800 animate-fade-in">
          {/* Mode Switcher: On-demand Series vs Live Radios */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setPlayerTab('series');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                playerTab === 'series'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
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
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                playerTab === 'radio'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
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
              className="w-full py-2.5 px-3 ps-9 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Scholar / Sheikh Selection Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'اختر الشيخ أو المتحدث المفضل:' : 'Select Scholar / Speaker:'}</span>
              </span>
              {selectedScholarId && (
                <button
                  type="button"
                  onClick={() => setSelectedScholarId(null)}
                  className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  {isAr ? 'عرض الكل (إلغاء التحديد)' : 'Clear Filter'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedScholarId(null)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedScholarId === null
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
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
                      setSelectedScholarId(isSelected ? null : scholar.id);
                    }}
                    className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/40'
                        : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-zinc-700'
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
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{activeScholar.avatarEmoji}</span>
                <div>
                  <span className="font-bold text-amber-950 dark:text-amber-200">
                    {activeScholar.nameAr}:
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-zinc-300 ms-1">
                    {activeScholar.descriptionAr}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScholarId(null)}
                className="text-[10px] text-amber-800 dark:text-amber-300 font-bold hover:underline shrink-0"
              >
                ✕ {isAr ? 'إلغاء' : 'Clear'}
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
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/60 hover:border-slate-300'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                  {cat.id === 'favorites' && favorites.length > 0 && (
                    <span className="ms-0.5 text-[9px] px-1 py-0.2 rounded-full bg-amber-500 text-white font-mono">
                      {favorites.length}
                    </span>
                  )}
                  {cat.id === 'downloaded' && offlineAudioService.getDownloadedEpisodes().length > 0 && (
                    <span className="ms-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-mono font-bold">
                      {offlineAudioService.getDownloadedEpisodes().length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Offline Status & Storage Indicator */}
          {offlineAudioService.getDownloadedEpisodes().length > 0 && (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-700/50 text-xs shadow-2xs animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-200 truncate">
                  {isAr
                    ? `المحمل على هاتفك: ${offlineAudioService.getDownloadedEpisodes().length} درس (${offlineAudioService.getTotalDownloadedSizeFormatted()}) • بدون إنترنت`
                    : `Offline on device: ${offlineAudioService.getDownloadedEpisodes().length} lessons (${offlineAudioService.getTotalDownloadedSizeFormatted()})`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-full border border-emerald-300/40">
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
                  className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
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
                  const isCurrent = selectedSeries.id === s.id;
                  const isFav = favorites.includes(s.id);

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setSelectedSeries(s);
                      }}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer space-y-1.5 relative group ${
                        isCurrent
                          ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 shadow-xs ring-1 ring-amber-400/30'
                          : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-base">{s.icon}</span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-100/70 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 truncate">
                            {s.badgeAr}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {s.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustom(s.id, e)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              title={isAr ? 'حذف هذا الدرس الخاص' : 'Delete custom lesson'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(s.id, e)}
                            className="p-1 text-amber-400 hover:text-amber-500 transition-colors cursor-pointer"
                            title={isFav ? (isAr ? 'إزالة من المفضلة' : 'Unfavorite') : (isAr ? 'إضافة إلى المفضلة' : 'Favorite')}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {s.titleAr}
                        </h5>
                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 truncate">
                          {s.sheikhAr}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                          {s.descriptionAr}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredSeries.length === 0 && (
                <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
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
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
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

              {/* Selected Series Episodes List */}
              {selectedSeries && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{selectedSeries.icon}</span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {selectedSeries.titleAr} ({selectedSeries.sheikhAr})
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                          {selectedSeries.descriptionAr}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      {selectedSeries.totalEpisodes} {isAr ? 'حلقات' : 'episodes'}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                    {selectedSeries.episodes.map((ep) => {
                      const isPlayingEp =
                        audioState.mode === 'series' &&
                        audioState.currentSeriesId === selectedSeries.id &&
                        audioState.currentEpisodeId === ep.id &&
                        audioState.isPlaying;
                      const isDownloaded = offlineAudioService.isDownloaded(ep.id);
                      const isDownloading = offlineAudioService.isDownloading(ep.id);
                      const downloadProgress = offlineAudioService.getProgress(ep.id);
                      const isSoundCloud = isSoundCloudUrl(ep.audioUrl);

                      return (
                        <div
                          key={ep.id}
                          onClick={() => handleSelectEpisode(selectedSeries, ep)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            isPlayingEp
                              ? 'bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-200 shadow-2xs'
                              : 'bg-slate-50 dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-800 hover:border-amber-300'
                          }`}
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-600/20 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                {ep.episodeNumber}
                              </span>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {ep.titleAr}
                              </h5>
                              {isDownloaded && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 shrink-0">
                                  {isAr ? 'أوفلاين ⚡' : 'Offline ⚡'}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-1 ps-7">
                              {ep.summaryAr}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Offline Download / Status / Delete Controls */}
                            {!isSoundCloud && (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {isDownloading ? (
                                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
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
                                    className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
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
                                        await offlineAudioService.downloadEpisode(ep, selectedSeries);
                                        if (onRewardToast) {
                                          onRewardToast(isAr ? `✓ تم حفظ "${ep.titleAr}" على هاتفك! متاح بدون نت وبدون باقة` : 'Saved for offline listening!');
                                        }
                                      } catch (err: any) {
                                        if (onRewardToast) {
                                          onRewardToast(isAr ? `تعذر التحميل: ${err.message || 'خطأ في الاتصال'}` : 'Download failed');
                                        }
                                      }
                                    }}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-950/50 text-slate-600 dark:text-zinc-300 hover:text-amber-800 dark:hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                                    title={isAr ? 'تحميل على الهاتف للاستماع بدون نت وبدون استهلاك الباقة' : 'Download for offline playback'}
                                  >
                                    <Download className="w-3 h-3" />
                                    <span className="hidden sm:inline">{isAr ? 'تحميل' : 'Save'}</span>
                                  </button>
                                )}
                              </div>
                            )}

                            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                              {ep.durationFormatted}
                            </span>
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
                                isPlayingEp
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
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
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isCurrent
                        ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600/60 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{c.icon}</span>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100/70 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold">
                            {isAr ? c.badgeAr : c.badgeEn}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                            {isAr ? c.sheikhAr : c.sheikhEn}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {isAr ? c.titleAr : c.titleEn}
                        </h5>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(c.id, e)}
                        className="p-1 text-amber-400 hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                      </button>

                      {isPlayingThis ? (
                        <span className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xs">
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center text-xs">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer pointer-events-auto"
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
            className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-white dark:via-zinc-900 to-white dark:to-zinc-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {isAr ? 'إضافة درس أو شيخ خاص بك 🎙️' : 'Add Custom Lecture / Sheikh'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {isAr
                      ? 'أدخل تفاصيل أي شيخ أو سلسلة صوتية تفضل الاستماع إليها'
                      : 'Enter any scholar or lecture stream you love listening to'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveCustom} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  {isAr ? 'اسم الشيخ أو المتحدث:' : 'Scholar / Speaker Name:'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثلاً: الشيخ عبد الرزاق البدر، د. حازم شومان...' : 'e.g. Sheikh Abdul Razzaq Al-Badr'}
                  value={customSheikh}
                  onChange={(e) => setCustomSheikh(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  {isAr ? 'عنوان الخطبة أو الدرس أو السلسلة:' : 'Lecture / Series Title:'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثلاً: أسباب انشراح الصدر وزوال الهم' : 'e.g. Causes of Joy and Inner Peace'}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    {isAr ? 'القسم / التصنيف:' : 'Category:'}
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as GymAudioCategory)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white"
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
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
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
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-1 leading-tight">
                    {isAr
                      ? '💡 يدعم روابط ساوندكلاود (SoundCloud)، وبودكاست أبل وجوجل، وملفات MP3 المباشرة.'
                      : 'Supports SoundCloud tracks, podcast episodes, and direct MP3 links.'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  {isAr ? 'نبذة أو ملاحظة شخصية (اختياري):' : 'Personal Note (optional):'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثلاً: درس رائع للاستماع أثناء الجري أو قيادة السيارة' : 'e.g. great listen for commute'}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCustomOpen(false)}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
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
