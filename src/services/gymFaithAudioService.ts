import {
  GYM_FAITH_CHANNELS,
  FAITH_AUDIO_SERIES,
  type GymAudioChannel,
  type FaithAudioSeries,
  type GymAudioCategory,
} from '../data/gymFaithAudioData';
import { audioCoordinator } from './audioCoordinator';
import { offlineAudioService } from './offlineAudioService';

export interface FaithAudioResumePoint {
  mode: 'channel' | 'series';
  seriesId?: string;
  seriesTitleAr?: string;
  episodeId?: string;
  episodeNumber?: number;
  episodeTitleAr?: string;
  channelId?: string;
  channelTitleAr?: string;
  sheikhAr: string;
  currentTime: number;
  duration: number;
  audioUrl: string;
  timestamp: number;
}

export interface GymFaithAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  mode: 'channel' | 'series';
  currentChannelId: string;
  currentSeriesId: string | null;
  currentEpisodeId: string | null;
  currentTitleAr: string;
  currentSheikhAr: string;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  hasError: boolean;
  errorMessage: string | null;
  resumePoint: FaithAudioResumePoint | null;
}

type AudioStateListener = (state: GymFaithAudioState) => void;

const STORAGE_CHANNEL_KEY = 'midmar_gym_audio_channel';
const STORAGE_SPEED_KEY = 'midmar_gym_audio_speed';
const STORAGE_VOL_KEY = 'midmar_gym_audio_vol';
const STORAGE_RESUME_KEY = 'midmar_faith_audio_resume';
const STORAGE_CUSTOM_SERIES_KEY = 'midmar_custom_faith_series';
const STORAGE_FAVORITES_KEY = 'midmar_faith_favorites';

class GymFaithAudioService {
  private audio: HTMLAudioElement | null = null;
  private state: GymFaithAudioState;
  private listeners: Set<AudioStateListener> = new Set();
  private isDucking = false;
  private preDuckVolume = 0.85;
  private lastSaveTime = 0;
  private currentSessionId = 0;
  private isUserPaused = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 6;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private lastKnownPosition = 0;
  private lastPositionUpdateTime = Date.now();

  constructor() {
    audioCoordinator.register('gym_faith', () => this.pause());
    const rawSavedChannel = localStorage.getItem(STORAGE_CHANNEL_KEY);
    const savedSpeed = Number(localStorage.getItem(STORAGE_SPEED_KEY) || '1');
    const savedVol = Number(localStorage.getItem(STORAGE_VOL_KEY) || '0.85');

    const initialChannel =
      GYM_FAITH_CHANNELS.find((c) => c.id === rawSavedChannel) || GYM_FAITH_CHANNELS[0];
    if (rawSavedChannel && rawSavedChannel !== initialChannel.id) {
      localStorage.setItem(STORAGE_CHANNEL_KEY, initialChannel.id);
    }

    let resumePoint: FaithAudioResumePoint | null = null;
    try {
      const savedResume = localStorage.getItem(STORAGE_RESUME_KEY);
      if (savedResume) {
        const parsed = JSON.parse(savedResume);
        if (parsed.mode === 'series') {
          const allSeries = this.getAllSeries();
          const seriesExists = allSeries.some((s) => s.id === parsed.seriesId);
          if (seriesExists) {
            resumePoint = parsed;
          } else {
            localStorage.removeItem(STORAGE_RESUME_KEY);
          }
        } else if (parsed.mode === 'channel') {
          const channelExists = GYM_FAITH_CHANNELS.some((c) => c.id === parsed.channelId) || Boolean(parsed.audioUrl);
          if (channelExists) {
            resumePoint = parsed;
          } else {
            localStorage.removeItem(STORAGE_RESUME_KEY);
          }
        }
      }
    } catch {}

    const currentTitle =
      (resumePoint
        ? (resumePoint.mode === 'series' ? resumePoint.episodeTitleAr : resumePoint.channelTitleAr)
        : null) || initialChannel.titleAr;
    const currentSheikh = resumePoint?.sheikhAr || initialChannel.sheikhAr;
    const currentChannelId = resumePoint?.channelId || initialChannel.id;
    const currentSeriesId = resumePoint?.seriesId || null;
    const currentEpisodeId = resumePoint?.episodeId || null;
    const currentPos = resumePoint?.currentTime || 0;
    const currentDur = resumePoint?.duration || 0;

    this.state = {
      isPlaying: false,
      isLoading: false,
      mode: resumePoint?.mode || 'channel',
      currentChannelId,
      currentSeriesId,
      currentEpisodeId,
      currentTitleAr: currentTitle,
      currentSheikhAr: currentSheikh,
      currentTime: currentPos,
      duration: currentDur,
      volume: Math.min(1, Math.max(0.1, savedVol)),
      isMuted: false,
      playbackRate: [1, 1.25, 1.5].includes(savedSpeed) ? savedSpeed : 1,
      hasError: false,
      errorMessage: null,
      resumePoint,
    };
  }

  private initAudio() {
    if (this.audio) return;

    this.audio = new Audio();
    this.audio.preload = 'auto';
    try {
      (this.audio as any).playsInline = true;
      (this.audio as any).crossOrigin = 'anonymous';
    } catch {}
    this.audio.volume = this.state.volume;
    this.audio.playbackRate = this.state.playbackRate;

    this.audio.addEventListener('playing', () => {
      this.isUserPaused = false;
      this.reconnectAttempts = 0;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.lastPositionUpdateTime = Date.now();
      if (this.audio) {
        this.lastKnownPosition = this.audio.currentTime;
      }
      this.updateState({ isPlaying: true, isLoading: false, hasError: false, errorMessage: null });
      this.updateMediaSession();
    });

    this.audio.addEventListener('waiting', () => {
      if (!this.isUserPaused) {
        this.updateState({ isLoading: true });
      }
    });

    this.audio.addEventListener('stalled', () => {
      if (!this.isUserPaused && this.state.isPlaying) {
        this.scheduleAutoReconnect('stalled');
      }
    });

    this.audio.addEventListener('pause', () => {
      if (this.isUserPaused) {
        this.updateState({ isPlaying: false, isLoading: false });
        this.saveResumePoint();
        this.updateMediaSession();
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio) return;
      const cur = Math.floor(this.audio.currentTime);
      const dur = Math.floor(this.audio.duration) || 0;

      if (cur !== this.lastKnownPosition) {
        this.lastKnownPosition = cur;
        this.lastPositionUpdateTime = Date.now();
      }

      // Smooth real-time state update
      if (cur !== this.state.currentTime || dur !== this.state.duration) {
        this.updateState({ currentTime: cur, duration: dur });
      }

      // Throttle persistent localStorage save to once every 3 seconds
      const now = Date.now();
      if (now - this.lastSaveTime > 3000) {
        this.lastSaveTime = now;
        this.saveResumePoint();
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (!this.audio) return;
      this.updateState({ duration: Math.floor(this.audio.duration) || 0 });
    });

    this.audio.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audio.addEventListener('error', () => {
      if (this.isUserPaused) return;
      this.scheduleAutoReconnect('error');
    });

    this.setupMediaSessionHandlers();
  }

  private startWatchdog() {
    if (this.watchdogTimer) return;
    this.watchdogTimer = setInterval(() => {
      if (!this.audio || this.isUserPaused || !this.state.isPlaying) return;
      if (this.state.isLoading || this.reconnectTimeout) return;

      const now = Date.now();
      const currentPos = this.audio.currentTime;

      // Check if audio has stalled for > 8 seconds without user pausing
      if (Math.abs(currentPos - this.lastKnownPosition) < 0.1) {
        if (now - this.lastPositionUpdateTime > 8000) {
          console.warn('[GymFaithAudio] Audio stall detected by watchdog. Triggering soft reconnect.');
          this.scheduleAutoReconnect('watchdog_stall');
        }
      } else {
        this.lastKnownPosition = currentPos;
        this.lastPositionUpdateTime = now;
      }
    }, 4000);
  }

  private stopWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private scheduleAutoReconnect(reason: string) {
    if (this.isUserPaused || !this.state.isPlaying) return;
    if (this.reconnectTimeout) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`[GymFaithAudio] Reconnect limit reached (${reason}).`);
      this.updateState({
        isPlaying: false,
        isLoading: false,
        hasError: true,
        errorMessage: 'انقطع الاتصال بالصوت. انقر على زر التشغيل لإعادة الاتصال.',
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.4, this.reconnectAttempts - 1), 6000);
    this.updateState({
      isLoading: true,
      hasError: false,
      errorMessage: `جاري استئناف البث تلقائياً (محاولة ${this.reconnectAttempts})...`,
    });

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      if (this.isUserPaused || !this.audio) return;

      try {
        const rawSrc = this.audio.src;
        if (!rawSrc) return;

        if (this.state.mode === 'channel') {
          // Fresh URL query param to bypass stuck TCP socket
          const cleanSrc = rawSrc.replace(/([?&])_t=\d+/, '');
          this.audio.src = `${cleanSrc}${cleanSrc.includes('?') ? '&' : '?'}_t=${Date.now()}`;
          this.audio.load();
          await this.audio.play();
        } else {
          const resumeTime = this.lastKnownPosition || this.state.currentTime;
          this.audio.load();
          if (resumeTime > 0) {
            this.audio.currentTime = resumeTime;
          }
          await this.audio.play();
        }
      } catch (e) {
        console.warn('[GymFaithAudio] Auto-reconnect failed, rescheduling:', e);
        this.scheduleAutoReconnect('retry_failed');
      }
    }, delay);
  }

  private handleTrackEnded() {
    if (this.state.mode === 'series' && this.state.currentSeriesId && this.state.currentEpisodeId) {
      const series = this.getAllSeries().find((s) => s.id === this.state.currentSeriesId);
      if (series) {
        const curIdx = series.episodes.findIndex((e) => e.id === this.state.currentEpisodeId);
        if (curIdx >= 0 && curIdx < series.episodes.length - 1) {
          // Auto advance to next episode!
          const nextEp = series.episodes[curIdx + 1];
          this.playEpisode(series.id, nextEp.id, 0);
          return;
        }
      }
    }
    this.updateState({ isPlaying: false, isLoading: false });
  }

  private updateMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.state.currentTitleAr,
        artist: this.state.currentSheikhAr,
        album: this.state.mode === 'series' ? 'سلاسل السيرة والهمم' : 'أثير الرياضة الإيماني',
        artwork: [
          {
            src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=512&auto=format&fit=crop',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });
    } catch {}
  }

  private setupMediaSessionHandlers() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        this.seekBy(-(details.seekOffset || 15));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        this.seekBy(details.seekOffset || 15);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.hasNextEpisode()) {
          this.playNextEpisode();
        } else {
          this.seekBy(15);
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (this.hasPrevEpisode()) {
          this.playPrevEpisode();
        } else {
          this.seekBy(-15);
        }
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          this.seekTo(details.seekTime);
        }
      });
    } catch {}
  }

  private saveResumePoint() {
    if (!this.audio) return;
    const curTime = Math.floor(this.audio.currentTime) || 0;
    const dur = Math.floor(this.audio.duration) || 0;

    let resume: FaithAudioResumePoint;

    if (this.state.mode === 'series' && this.state.currentSeriesId && this.state.currentEpisodeId) {
      const series = this.getAllSeries().find((s) => s.id === this.state.currentSeriesId);
      const ep = series?.episodes.find((e) => e.id === this.state.currentEpisodeId);

      resume = {
        mode: 'series',
        seriesId: this.state.currentSeriesId,
        seriesTitleAr: series?.titleAr || '',
        episodeId: this.state.currentEpisodeId,
        episodeNumber: ep?.episodeNumber || 1,
        episodeTitleAr: ep?.titleAr || this.state.currentTitleAr,
        sheikhAr: series?.sheikhAr || this.state.currentSheikhAr,
        currentTime: curTime,
        duration: dur,
        audioUrl: ep?.audioUrl || this.audio.src,
        timestamp: Date.now(),
      };
    } else {
      const ch = GYM_FAITH_CHANNELS.find((c) => c.id === this.state.currentChannelId);
      resume = {
        mode: 'channel',
        channelId: this.state.currentChannelId,
        channelTitleAr: ch?.titleAr || this.state.currentTitleAr,
        sheikhAr: ch?.sheikhAr || this.state.currentSheikhAr,
        currentTime: curTime,
        duration: dur,
        audioUrl: this.audio.src || ch?.streamUrl || '',
        timestamp: Date.now(),
      };
    }

    try {
      localStorage.setItem(STORAGE_RESUME_KEY, JSON.stringify(resume));
      this.updateState({ resumePoint: resume });
    } catch {}
  }

  public getState(): GymFaithAudioState {
    return { ...this.state };
  }

  public getCustomSeries(): FaithAudioSeries[] {
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_SERIES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  public getAllSeries(): FaithAudioSeries[] {
    return [...FAITH_AUDIO_SERIES, ...this.getCustomSeries()];
  }

  public addCustomSeries(seriesData: {
    titleAr: string;
    sheikhAr: string;
    category?: GymAudioCategory;
    descriptionAr?: string;
    audioUrl: string;
  }): FaithAudioSeries {
    const id = `custom_series_${Date.now()}`;
    const epId = `custom_ep_${Date.now()}`;
    const newSeries: FaithAudioSeries = {
      id,
      titleAr: seriesData.titleAr,
      titleEn: seriesData.titleAr,
      sheikhAr: seriesData.sheikhAr,
      sheikhEn: seriesData.sheikhAr,
      category: seriesData.category || 'custom',
      badgeAr: 'درس خاص 🌟',
      badgeEn: 'Custom Lecture',
      icon: '🎙️',
      descriptionAr: seriesData.descriptionAr || 'محاضرة مضافة من اختيارك الخاص.',
      totalEpisodes: 1,
      isCustom: true,
      episodes: [
        {
          id: epId,
          episodeNumber: 1,
          titleAr: seriesData.titleAr,
          titleEn: seriesData.titleAr,
          durationFormatted: 'بث صوتي',
          audioUrl: seriesData.audioUrl,
          summaryAr: seriesData.descriptionAr || seriesData.titleAr,
        },
      ],
    };

    try {
      const current = this.getCustomSeries();
      const updated = [newSeries, ...current];
      localStorage.setItem(STORAGE_CUSTOM_SERIES_KEY, JSON.stringify(updated));
    } catch {}

    return newSeries;
  }

  public deleteCustomSeries(seriesId: string): void {
    try {
      const current = this.getCustomSeries();
      const updated = current.filter((s) => s.id !== seriesId);
      localStorage.setItem(STORAGE_CUSTOM_SERIES_KEY, JSON.stringify(updated));
    } catch {}
  }

  public getFavorites(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_FAVORITES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  public toggleFavorite(itemId: string): boolean {
    const favs = new Set(this.getFavorites());
    let isNowFav = false;
    if (favs.has(itemId)) {
      favs.delete(itemId);
      isNowFav = false;
    } else {
      favs.add(itemId);
      isNowFav = true;
    }
    try {
      localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(Array.from(favs)));
    } catch {}
    return isNowFav;
  }

  public isFavorite(itemId: string): boolean {
    return this.getFavorites().includes(itemId);
  }

  public getCurrentChannel(): GymAudioChannel {
    const found = GYM_FAITH_CHANNELS.find((c) => c.id === this.state.currentChannelId);
    if (found) return found;

    const currentSrc = this.audio?.src;
    if (currentSrc) {
      const byUrl = GYM_FAITH_CHANNELS.find(
        (c) => currentSrc.includes(c.streamUrl) || c.streamUrl.includes(currentSrc)
      );
      if (byUrl) return byUrl;
    }

    return {
      id: this.state.currentChannelId || 'custom_live_audio',
      titleAr: this.state.currentTitleAr || GYM_FAITH_CHANNELS[0].titleAr,
      titleEn: 'Faith Sanctuary Stream',
      category: 'live',
      sheikhAr: this.state.currentSheikhAr || GYM_FAITH_CHANNELS[0].sheikhAr,
      sheikhEn: 'Faith Sanctuary',
      streamUrl: this.audio?.src || GYM_FAITH_CHANNELS[0].streamUrl,
      descriptionAr: this.state.currentTitleAr,
      descriptionEn: 'Live continuous stream',
      badgeAr: 'بث مباشر 🔴',
      badgeEn: 'Live 🔴',
      icon: '🎙️',
      isLiveStream: true,
    };
  }

  public getSavedResumePoint(): FaithAudioResumePoint | null {
    return this.state.resumePoint;
  }

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<GymFaithAudioState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.getState()));
  }

  // Play Live Radio Channel
  public async play(channelId?: string) {
    this.initAudio();
    if (!this.audio) return;
    this.isUserPaused = false;
    this.startWatchdog();

    if (channelId) {
      const channel = GYM_FAITH_CHANNELS.find((c) => c.id === channelId);
      if (channel) {
        const isDifferent =
          this.state.mode !== 'channel' ||
          this.state.currentChannelId !== channel.id ||
          !this.audio.src ||
          !this.audio.src.includes(channel.streamUrl.replace(/^https?:\/\//, ''));

        if (isDifferent) {
          this.audio.src = channel.streamUrl;
          this.audio.load();
          this.updateState({
            mode: 'channel',
            currentChannelId: channel.id,
            currentSeriesId: null,
            currentEpisodeId: null,
            currentTitleAr: channel.titleAr,
            currentSheikhAr: channel.sheikhAr,
            isLoading: true,
            hasError: false,
            errorMessage: null,
          });
          localStorage.setItem(STORAGE_CHANNEL_KEY, channel.id);
        } else {
          this.updateState({ isLoading: true, hasError: false, errorMessage: null });
        }
      }
    } else {
      // Resuming existing playback without re-assigning or changing the audio source!
      if (!this.audio.src) {
        const targetId = this.state.currentChannelId;
        const channel = GYM_FAITH_CHANNELS.find((c) => c.id === targetId) || GYM_FAITH_CHANNELS[0];
        this.audio.src = channel.streamUrl;
        this.audio.load();
        this.updateState({
          mode: 'channel',
          currentChannelId: channel.id,
          currentSeriesId: null,
          currentEpisodeId: null,
          currentTitleAr: channel.titleAr,
          currentSheikhAr: channel.sheikhAr,
          isLoading: true,
          hasError: false,
          errorMessage: null,
        });
      } else {
        this.updateState({ isLoading: true, hasError: false, errorMessage: null });
      }
    }

    try {
      audioCoordinator.requestExclusive('gym_faith');
      this.audio.playbackRate = this.state.playbackRate;
      await this.audio.play();
      this.updateState({ isPlaying: true, isLoading: false, hasError: false, errorMessage: null });
      this.updateMediaSession();
      this.saveResumePoint();
    } catch (e: any) {
      console.warn('Gym faith audio play error:', e);
      let userMsg = 'انقر للتشغيل أو تأكد من إعدادات الصوت.';
      if (e?.name === 'NotSupportedError') {
        userMsg = 'المتصفح لم يعثر على مصدر مدعوم لهذا الرابط حالياً.';
      } else if (e?.name === 'NotAllowedError') {
        userMsg = 'المتصفح حظر التشغيل التلقائي. انقر على زر التشغيل لبدء الصوت.';
      } else {
        this.scheduleAutoReconnect('play_catch');
        return;
      }
      this.updateState({
        isPlaying: false,
        isLoading: false,
        hasError: true,
        errorMessage: userMsg,
      });
    }
  }

  // Play On-Demand Series Episode with Seamless Continuity & Race Condition Protection
  public async playEpisode(seriesId: string, episodeId: string, startSecond = 0) {
    this.initAudio();
    if (!this.audio) return;
    this.isUserPaused = false;
    this.startWatchdog();

    const series = this.getAllSeries().find((s) => s.id === seriesId);
    if (!series) return;

    const episode = series.episodes.find((e) => e.id === episodeId) || series.episodes[0];
    if (!episode) return;

    const sessionId = ++this.currentSessionId;

    const isDifferent =
      this.state.mode !== 'series' ||
      this.state.currentSeriesId !== series.id ||
      this.state.currentEpisodeId !== episode.id ||
      !this.audio.src;

    if (isYouTubeUrl(episode.audioUrl)) {
      this.pause(0);
      this.updateState({
        mode: 'series',
        currentSeriesId: series.id,
        currentEpisodeId: episode.id,
        currentTitleAr: `${series.titleAr} • ${episode.titleAr}`,
        currentSheikhAr: series.sheikhAr,
        isPlaying: true,
        isLoading: false,
        hasError: false,
        errorMessage: null,
      });
      this.saveResumePoint();
      return;
    }

    if (isDifferent) {
      const playableUrl = await offlineAudioService.getPlayableUrl(episode.id, episode.audioUrl);
      // Cancel stale requests if a newer track was requested while loading
      if (sessionId !== this.currentSessionId) return;

      this.audio.src = playableUrl;
      this.audio.load();
      if (startSecond > 0) {
        this.audio.currentTime = startSecond;
      }
      this.updateState({
        mode: 'series',
        currentSeriesId: series.id,
        currentEpisodeId: episode.id,
        currentTitleAr: `${series.titleAr} • ${episode.titleAr}`,
        currentSheikhAr: series.sheikhAr,
        isLoading: true,
        hasError: false,
        errorMessage: null,
        currentTime: startSecond,
      });
    }

    try {
      audioCoordinator.requestExclusive('gym_faith');
      this.audio.playbackRate = this.state.playbackRate;
      this.audio.volume = this.state.volume;
      if (startSecond > 0 && !isDifferent) {
        this.audio.currentTime = startSecond;
      }
      await this.audio.play();
      if (sessionId !== this.currentSessionId) return;
      this.updateState({ isPlaying: true, isLoading: false, hasError: false, errorMessage: null });
      this.updateMediaSession();
      this.saveResumePoint();
    } catch (e: any) {
      console.warn('Episode play failed:', e);
      let userMsg = 'انقر للتشغيل أو تأكد من إعدادات الصوت.';
      if (e?.name === 'NotSupportedError') {
        userMsg = 'المتصفح لم يعثر على مصدر مدعوم لهذا المقطع حالياً.';
      } else if (e?.name === 'NotAllowedError') {
        userMsg = 'المتصفح حظر التشغيل التلقائي. انقر على زر التشغيل لبدء الصوت.';
      } else {
        this.scheduleAutoReconnect('episode_play_catch');
        return;
      }
      this.updateState({
        isPlaying: false,
        isLoading: false,
        hasError: true,
        errorMessage: userMsg,
      });
    }
  }

  // Resume last session from exact saved second (Gym or Commute!)
  public async resumeLastPlayback() {
    const resume = this.getSavedResumePoint();
    if (!resume) {
      this.play();
      return;
    }

    if (resume.mode === 'series' && resume.seriesId && resume.episodeId) {
      await this.playEpisode(resume.seriesId, resume.episodeId, resume.currentTime || 0);
    } else if (resume.channelId) {
      await this.play(resume.channelId);
      if (resume.currentTime > 0 && this.audio) {
        this.audio.currentTime = resume.currentTime;
      }
    } else {
      this.play();
    }
  }

  /**
   * Smooth Zero-Crossing Anti-Click Audio Pause
   * Fades out volume over 50ms before calling pause() to eliminate digital clicks/pops.
   */
  public pause(fadeMs = 50) {
    this.isUserPaused = true;
    this.stopWatchdog();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (!this.audio) return;
    const targetAudio = this.audio;
    const originalVol = this.state.volume;

    if (fadeMs > 0 && targetAudio.volume > 0.05 && !targetAudio.paused) {
      const steps = 5;
      const stepDuration = Math.round(fadeMs / steps);
      let currentStep = 0;
      const fadeTimer = setInterval(() => {
        currentStep++;
        if (targetAudio) {
          targetAudio.volume = Math.max(0, originalVol * (1 - currentStep / steps));
        }
        if (currentStep >= steps) {
          clearInterval(fadeTimer);
          try {
            targetAudio.pause();
            targetAudio.volume = originalVol;
          } catch {}
          this.saveResumePoint();
          this.updateState({ isPlaying: false, isLoading: false });
        }
      }, stepDuration);
    } else {
      try {
        targetAudio.pause();
      } catch {}
      this.saveResumePoint();
      this.updateState({ isPlaying: false, isLoading: false });
    }
  }

  public togglePlay(channelId?: string) {
    if (channelId && channelId !== this.state.currentChannelId) {
      this.play(channelId);
      return;
    }

    if (this.state.isPlaying) {
      this.pause();
    } else {
      if (this.state.mode === 'series' && this.state.currentSeriesId && this.state.currentEpisodeId) {
        this.playEpisode(this.state.currentSeriesId, this.state.currentEpisodeId, this.state.currentTime);
      } else {
        this.play();
      }
    }
  }

  public setChannel(channelId: string, autoPlay = true) {
    const channel = GYM_FAITH_CHANNELS.find((c) => c.id === channelId);
    if (!channel) return;

    localStorage.setItem(STORAGE_CHANNEL_KEY, channel.id);
    if (autoPlay) {
      this.play(channel.id);
    } else {
      if (this.audio) {
        this.audio.src = channel.streamUrl;
      }
      this.updateState({
        mode: 'channel',
        currentChannelId: channel.id,
        currentSeriesId: null,
        currentEpisodeId: null,
        currentTitleAr: channel.titleAr,
        currentSheikhAr: channel.sheikhAr,
      });
    }
  }

  public setPlaybackRate(rate: number) {
    if (![1, 1.25, 1.5].includes(rate)) return;
    this.state.playbackRate = rate;
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
    localStorage.setItem(STORAGE_SPEED_KEY, rate.toString());
    this.updateState({ playbackRate: rate });
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.state.volume = clamped;
    if (this.audio && !this.isDucking) {
      this.audio.volume = clamped;
    }
    localStorage.setItem(STORAGE_VOL_KEY, clamped.toString());
    this.updateState({ volume: clamped, isMuted: clamped === 0 });
  }

  public seekBy(seconds: number) {
    if (!this.audio) return;
    try {
      this.audio.currentTime = Math.max(0, this.audio.currentTime + seconds);
      this.updateState({ currentTime: Math.floor(this.audio.currentTime) });
    } catch {}
  }

  public seekTo(seconds: number) {
    if (!this.audio) return;
    try {
      this.audio.currentTime = Math.max(0, seconds);
      this.updateState({ currentTime: Math.floor(this.audio.currentTime) });
    } catch {}
  }

  public duckVolume(durationMs = 2500, duckFactor = 0.25) {
    if (!this.audio || !this.state.isPlaying || this.isDucking) return;

    this.isDucking = true;
    this.preDuckVolume = this.audio.volume;
    const targetDuckVol = Math.max(0.05, this.preDuckVolume * duckFactor);

    this.audio.volume = targetDuckVol;

    setTimeout(() => {
      if (this.audio && this.isDucking) {
        this.audio.volume = this.preDuckVolume;
        this.isDucking = false;
      }
    }, durationMs);
  }

  public playNextEpisode(): boolean {
    if (this.state.mode === 'series' && this.state.currentSeriesId && this.state.currentEpisodeId) {
      const series = this.getAllSeries().find((s) => s.id === this.state.currentSeriesId);
      if (series) {
        const curIdx = series.episodes.findIndex((e) => e.id === this.state.currentEpisodeId);
        if (curIdx >= 0 && curIdx < series.episodes.length - 1) {
          const nextEp = series.episodes[curIdx + 1];
          this.playEpisode(series.id, nextEp.id, 0);
          return true;
        }
      }
    }
    return false;
  }

  public playPrevEpisode(): boolean {
    if (this.state.mode === 'series' && this.state.currentSeriesId && this.state.currentEpisodeId) {
      const series = this.getAllSeries().find((s) => s.id === this.state.currentSeriesId);
      if (series) {
        const curIdx = series.episodes.findIndex((e) => e.id === this.state.currentEpisodeId);
        if (curIdx > 0) {
          const prevEp = series.episodes[curIdx - 1];
          this.playEpisode(series.id, prevEp.id, 0);
          return true;
        }
      }
    }
    return false;
  }

  public hasNextEpisode(): boolean {
    if (this.state.mode === 'series' && this.state.currentSeriesId && this.state.currentEpisodeId) {
      const series = this.getAllSeries().find((s) => s.id === this.state.currentSeriesId);
      if (series) {
        const curIdx = series.episodes.findIndex((e) => e.id === this.state.currentEpisodeId);
        return curIdx >= 0 && curIdx < series.episodes.length - 1;
      }
    }
    return false;
  }

  public hasPrevEpisode(): boolean {
    if (this.state.mode === 'series' && this.state.currentSeriesId && this.state.currentEpisodeId) {
      const series = this.getAllSeries().find((s) => s.id === this.state.currentSeriesId);
      if (series) {
        const curIdx = series.episodes.findIndex((e) => e.id === this.state.currentEpisodeId);
        return curIdx > 0;
      }
    }
    return false;
  }

  public async playCustomUrl(url: string, titleAr: string, sheikhAr: string) {
    if (isYouTubeUrl(url)) {
      this.pause(0);
      this.updateState({
        mode: 'channel',
        currentChannelId: 'custom_' + Date.now(),
        currentSeriesId: null,
        currentEpisodeId: null,
        currentTitleAr: titleAr,
        currentSheikhAr: sheikhAr,
        isPlaying: true,
        isLoading: false,
        hasError: false,
        errorMessage: null,
      });
      return;
    }

    // Check if this URL matches an existing GymAudioChannel
    const matchedChannel = GYM_FAITH_CHANNELS.find(
      (c) => c.streamUrl === url || url.includes(c.streamUrl) || c.streamUrl.includes(url)
    );

    if (matchedChannel) {
      this.setChannel(matchedChannel.id, true);
      return;
    }

    this.initAudio();
    if (!this.audio) return;
    this.isUserPaused = false;
    this.startWatchdog();

    const isDifferent = !this.audio.src || !this.audio.src.includes(url);
    if (isDifferent) {
      this.audio.src = url;
      this.audio.load();
    }

    const customId = this.state.currentChannelId?.startsWith('custom_')
      ? this.state.currentChannelId
      : 'custom_' + Date.now();

    this.updateState({
      mode: 'channel',
      currentChannelId: customId,
      currentSeriesId: null,
      currentEpisodeId: null,
      currentTitleAr: titleAr,
      currentSheikhAr: sheikhAr,
      isLoading: true,
      hasError: false,
      errorMessage: null,
    });

    try {
      audioCoordinator.requestExclusive('gym_faith');
      this.audio.playbackRate = this.state.playbackRate;
      this.audio.volume = this.state.volume;
      await this.audio.play();
      this.updateState({ isPlaying: true, isLoading: false, hasError: false, errorMessage: null });
      this.updateMediaSession();
      this.saveResumePoint();
    } catch (e: any) {
      console.warn('Custom audio play failed:', e);
      let userMsg = 'تعذر تشغيل هذا المقطع الصوتي حالياً.';
      if (e?.name === 'NotAllowedError') {
        userMsg = 'المتصفح منع التشغيل التلقائي. انقر على زر التشغيل لبدء الصوت.';
      } else {
        this.scheduleAutoReconnect('custom_play_catch');
        return;
      }
      this.updateState({
        isPlaying: false,
        isLoading: false,
        hasError: true,
        errorMessage: userMsg,
      });
    }
  }

  public stop() {
    this.isUserPaused = true;
    this.stopWatchdog();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.pause(0);
    if (this.audio) {
      this.audio.currentTime = 0;
    }
    this.updateState({ isPlaying: false, isLoading: false, currentTime: 0 });
  }

  public stopAndUnload() {
    this.isUserPaused = true;
    this.stopWatchdog();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.audio) {
      this.saveResumePoint();
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.updateState({ isPlaying: false, isLoading: false });
  }
}

export const isSoundCloudUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().includes('soundcloud.com');
};

export const getSoundCloudEmbedUrl = (url: string): string => {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(
    url
  )}&color=%23d97706&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
};

export const isYouTubeUrl = (url?: string): boolean => {
  if (!url) return false;
  return /(?:youtube\.com\/(?:watch\?v=|embed\/|playlist\?list=)|youtu\.be\/)/i.test(url);
};

export const extractYouTubeId = (url: string): { videoId?: string; playlistId?: string } => {
  try {
    if (url.includes('playlist?list=')) {
      const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      return { playlistId: match ? match[1] : undefined };
    }
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    return { videoId: match ? match[1] : undefined };
  } catch {
    return {};
  }
};

export const getYouTubeEmbedUrl = (url: string, autoPlay = true): string => {
  const { videoId, playlistId } = extractYouTubeId(url);
  if (playlistId) {
    return `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=${autoPlay ? 1 : 0}&playsinline=1&modestbranding=1&rel=0`;
  }
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&playsinline=1&modestbranding=1&rel=0`;
  }
  return url;
};

export const gymFaithAudio = new GymFaithAudioService();
