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
          const channelExists = GYM_FAITH_CHANNELS.some((c) => c.id === parsed.channelId);
          if (channelExists) {
            resumePoint = parsed;
          } else {
            localStorage.removeItem(STORAGE_RESUME_KEY);
          }
        }
      }
    } catch (_) {}

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
    this.audio.preload = 'metadata';
    this.audio.volume = this.state.volume;
    this.audio.playbackRate = this.state.playbackRate;

    this.audio.addEventListener('playing', () => {
      this.updateState({ isPlaying: true, isLoading: false, hasError: false, errorMessage: null });
      this.updateMediaSession();
    });

    this.audio.addEventListener('waiting', () => {
      this.updateState({ isLoading: true });
    });

    this.audio.addEventListener('pause', () => {
      this.updateState({ isPlaying: false, isLoading: false });
      this.saveResumePoint();
    });

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio) return;
      const cur = Math.floor(this.audio.currentTime);
      const dur = Math.floor(this.audio.duration) || 0;

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
      const mediaErr = this.audio?.error;
      let msg = 'تعذر الاتصال بالبث الصوتي. يرجى التحقق من اتصال الإنترنت.';
      if (mediaErr) {
        if (mediaErr.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
          msg = 'المقطع الصوتي غير متاح حالياً أو تعذر تشغيل مصدره في المتصفح.';
        } else if (mediaErr.code === 2) { // MEDIA_ERR_NETWORK
          msg = 'انقطع الاتصال بالشبكة أثناء تحميل الصوت. يرجى التحقق من الإنترنت.';
        } else if (mediaErr.code === 3) { // MEDIA_ERR_DECODE
          msg = 'تعذر فك تشفير هذا الملف الصوتي.';
        }
      }
      this.updateState({
        isPlaying: false,
        isLoading: false,
        hasError: true,
        errorMessage: msg,
      });
    });

    this.setupMediaSessionHandlers();
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
    } catch (_) {}
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
    } catch (_) {}
  }

  private saveResumePoint() {
    if (!this.audio) return;
    const curTime = Math.floor(this.audio.currentTime);
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
      const ch = GYM_FAITH_CHANNELS.find((c) => c.id === this.state.currentChannelId) || GYM_FAITH_CHANNELS[0];
      resume = {
        mode: 'channel',
        channelId: ch.id,
        channelTitleAr: ch.titleAr,
        sheikhAr: ch.sheikhAr,
        currentTime: curTime,
        duration: dur,
        audioUrl: ch.streamUrl,
        timestamp: Date.now(),
      };
    }

    try {
      localStorage.setItem(STORAGE_RESUME_KEY, JSON.stringify(resume));
      this.updateState({ resumePoint: resume });
    } catch (_) {}
  }

  public getState(): GymFaithAudioState {
    return { ...this.state };
  }

  public getCustomSeries(): FaithAudioSeries[] {
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_SERIES_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
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
    } catch (_) {}

    return newSeries;
  }

  public deleteCustomSeries(seriesId: string): void {
    try {
      const current = this.getCustomSeries();
      const updated = current.filter((s) => s.id !== seriesId);
      localStorage.setItem(STORAGE_CUSTOM_SERIES_KEY, JSON.stringify(updated));
    } catch (_) {}
  }

  public getFavorites(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_FAVORITES_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
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
    } catch (_) {}
    return isNowFav;
  }

  public isFavorite(itemId: string): boolean {
    return this.getFavorites().includes(itemId);
  }

  public getCurrentChannel(): GymAudioChannel {
    return (
      GYM_FAITH_CHANNELS.find((c) => c.id === this.state.currentChannelId) || GYM_FAITH_CHANNELS[0]
    );
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

    const targetId = channelId || this.state.currentChannelId;
    const channel = GYM_FAITH_CHANNELS.find((c) => c.id === targetId) || GYM_FAITH_CHANNELS[0];
    const isDifferent = this.state.mode !== 'channel' || this.state.currentChannelId !== channel.id || !this.audio.src;

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
      });
      localStorage.setItem(STORAGE_CHANNEL_KEY, channel.id);
    } else {
      this.updateState({ isLoading: true, hasError: false });
    }

    try {
      audioCoordinator.requestExclusive('gym_faith');
      this.audio.playbackRate = this.state.playbackRate;
      await this.audio.play();
      this.updateState({ isPlaying: true, isLoading: false, hasError: false, errorMessage: null });
      this.updateMediaSession();
    } catch (e: any) {
      console.warn('Gym faith audio play blocked:', e);
      let userMsg = 'انقر للتشغيل أو تأكد من إعدادات الصوت.';
      if (e?.name === 'NotSupportedError') {
        userMsg = 'المتصفح لم يعثر على مصدر مدعوم لهذا الرابط حالياً.';
      } else if (e?.name === 'NotAllowedError') {
        userMsg = 'المتصفح حظر التشغيل التلقائي. انقر على زر التشغيل لبدء الصوت.';
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
          } catch (_) {}
          this.saveResumePoint();
          this.updateState({ isPlaying: false, isLoading: false });
        }
      }, stepDuration);
    } else {
      targetAudio.pause();
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
    } catch (_) {}
  }

  public seekTo(seconds: number) {
    if (!this.audio) return;
    try {
      this.audio.currentTime = Math.max(0, seconds);
      this.updateState({ currentTime: Math.floor(this.audio.currentTime) });
    } catch (_) {}
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

  public stopAndUnload() {
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

export const gymFaithAudio = new GymFaithAudioService();
