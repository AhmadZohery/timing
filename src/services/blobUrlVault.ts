/**
 * BlobUrlVault - Zero-Leak Memory Manager for Audio Blobs
 * Automatically tracks and revokes Object URLs to prevent heap memory exhaustion.
 */
class BlobUrlVaultService {
  private activeUrls: Set<string> = new Set();
  private currentTrackUrl: string | null = null;

  /**
   * Creates an object URL for a Blob and registers it in the vault.
   * If replaceTrack is true, it revokes the previously active track URL.
   */
  public createUrl(blob: Blob, replaceTrack = true): string {
    if (replaceTrack && this.currentTrackUrl) {
      this.revokeUrl(this.currentTrackUrl);
    }

    const url = URL.createObjectURL(blob);
    this.activeUrls.add(url);
    if (replaceTrack) {
      this.currentTrackUrl = url;
    }
    return url;
  }

  /**
   * Safely revokes a registered Object URL and frees memory.
   */
  public revokeUrl(url: string | null | undefined): void {
    if (!url) return;
    if (this.activeUrls.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Failed to revoke Object URL:', e);
      }
      this.activeUrls.delete(url);
      if (this.currentTrackUrl === url) {
        this.currentTrackUrl = null;
      }
    }
  }

  /**
   * Clears and revokes all active Object URLs.
   */
  public clearAll(): void {
    this.activeUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {}
    });
    this.activeUrls.clear();
    this.currentTrackUrl = null;
  }
}

export const blobUrlVault = new BlobUrlVaultService();
