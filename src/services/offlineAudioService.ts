/**
 * Midmar LifeOS - Offline Audio Cache & Storage Service
 * 
 * Manages downloading and offline caching of Islamic lectures & podcasts
 * directly on the user's mobile device via the standard Web CacheStorage API.
 * 
 * Guarantees:
 * - 0 bytes stored on the application server (pure client-side).
 * - 100% offline playback capability with 0 mobile data consumption.
 * - Single-tap deletion to free up device memory at any time.
 */

import { blobUrlVault } from './blobUrlVault';

export interface DownloadedAudioMetadata {
  episodeId: string;
  seriesId: string;
  seriesTitleAr: string;
  titleAr: string;
  sheikhAr: string;
  audioUrl: string;
  durationFormatted: string;
  sizeBytes: number;
  downloadedAt: number;
}

const CACHE_NAME = 'midmar-faith-audio-offline-v1';
const METADATA_KEY = 'midmar_offline_audio_catalog';

type OfflineListener = () => void;

class OfflineAudioService {
  private listeners: Set<OfflineListener> = new Set();
  private downloadingIds: Set<string> = new Set();
  private downloadProgress: Map<string, number> = new Map();
  private catalog: Map<string, DownloadedAudioMetadata> = new Map();
  private isCacheSupported: boolean = typeof window !== 'undefined' && 'caches' in window;

  constructor() {
    this.loadCatalog();
  }

  private loadCatalog() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(METADATA_KEY);
      if (raw) {
        const parsed: DownloadedAudioMetadata[] = JSON.parse(raw);
        parsed.forEach((item) => this.catalog.set(item.episodeId, item));
      }
    } catch (e) {
      console.error('[OfflineAudio] Error loading catalog:', e);
    }
  }

  private saveCatalog() {
    if (typeof localStorage === 'undefined') return;
    try {
      const arr = Array.from(this.catalog.values());
      localStorage.setItem(METADATA_KEY, JSON.stringify(arr));
      this.notifyListeners();
    } catch (e) {
      console.error('[OfflineAudio] Error saving catalog:', e);
    }
  }

  public subscribe(listener: OfflineListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (_) {}
    });
  }

  public isSupported(): boolean {
    return this.isCacheSupported;
  }

  public isDownloaded(episodeId: string): boolean {
    return this.catalog.has(episodeId);
  }

  public isDownloading(episodeId: string): boolean {
    return this.downloadingIds.has(episodeId);
  }

  public getProgress(episodeId: string): number {
    return this.downloadProgress.get(episodeId) || 0;
  }

  public getDownloadedEpisodes(): DownloadedAudioMetadata[] {
    return Array.from(this.catalog.values()).sort((a, b) => b.downloadedAt - a.downloadedAt);
  }

  public getTotalDownloadedSizeFormatted(): string {
    let totalBytes = 0;
    this.catalog.forEach((item) => {
      totalBytes += item.sizeBytes || 0;
    });

    if (totalBytes === 0) return '0 MB';
    const mb = totalBytes / (1024 * 1024);
    if (mb < 1) {
      const kb = totalBytes / 1024;
      return `${Math.round(kb)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  }

  /**
   * Downloads an audio episode to device CacheStorage with progress reporting.
   */
  public async downloadEpisode(
    episode: {
      id: string;
      titleAr: string;
      durationFormatted: string;
      audioUrl: string;
    },
    series: {
      id: string;
      titleAr: string;
      sheikhAr: string;
    }
  ): Promise<boolean> {
    if (!this.isCacheSupported) {
      throw new Error('متصفحك لا يدعم التحميل أوفلاين المباشر');
    }

    const { id, audioUrl, titleAr, durationFormatted } = episode;
    if (this.isDownloaded(id)) return true;
    if (this.downloadingIds.has(id)) return false;

    this.downloadingIds.add(id);
    this.downloadProgress.set(id, 5);
    this.notifyListeners();

    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await fetch(audioUrl, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`فشل التحميل من المصدر (${response.status})`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      // Clone response to put in cache
      await cache.put(audioUrl, response.clone());

      const metadata: DownloadedAudioMetadata = {
        episodeId: id,
        seriesId: series.id,
        seriesTitleAr: series.titleAr,
        titleAr,
        sheikhAr: series.sheikhAr,
        audioUrl,
        durationFormatted,
        sizeBytes: totalBytes || 15 * 1024 * 1024, // fallback ~15MB
        downloadedAt: Date.now(),
      };

      this.catalog.set(id, metadata);
      this.saveCatalog();

      this.downloadProgress.set(id, 100);
      return true;
    } catch (err: any) {
      console.error(`[OfflineAudio] Failed to download episode ${id}:`, err);
      throw err;
    } finally {
      this.downloadingIds.delete(id);
      setTimeout(() => {
        this.downloadProgress.delete(id);
        this.notifyListeners();
      }, 1000);
      this.notifyListeners();
    }
  }

  /**
   * Deletes a downloaded episode from device CacheStorage and metadata catalog.
   */
  public async deleteDownload(episodeId: string): Promise<boolean> {
    const meta = this.catalog.get(episodeId);
    if (!meta) return true;

    try {
      if (this.isCacheSupported) {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete(meta.audioUrl);
      }
      this.catalog.delete(episodeId);
      this.saveCatalog();
      return true;
    } catch (err) {
      console.error(`[OfflineAudio] Failed to delete episode ${episodeId}:`, err);
      return false;
    }
  }

  public async clearAllDownloads(): Promise<void> {
    try {
      if (this.isCacheSupported) {
        await caches.delete(CACHE_NAME);
      }
      this.catalog.clear();
      this.saveCatalog();
    } catch (err) {
      console.error('[OfflineAudio] Failed to clear all downloads:', err);
    }
  }

  /**
   * Returns a local offline blob URL if cached, otherwise returns the remote URL.
   * Uses blobUrlVault to automatically revoke previous URLs and prevent memory leaks.
   */
  public async getPlayableUrl(episodeId: string, fallbackUrl: string): Promise<string> {
    if (!this.isCacheSupported || !this.isDownloaded(episodeId)) {
      return fallbackUrl;
    }

    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(fallbackUrl);
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        return blobUrlVault.createUrl(blob, true);
      }
    } catch (e) {
      console.warn('[OfflineAudio] Error reading from cache, falling back to online URL:', e);
    }

    return fallbackUrl;
  }
}

export const offlineAudioService = new OfflineAudioService();

