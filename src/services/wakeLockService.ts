// Screen Wake Lock API to keep the HUD screen awake during focus sprints
class WakeLockService {
  private wakeLock: any = null;
  private isRequested = false;
  private hasVisibilityListener = false;

  public async requestLock(): Promise<boolean> {
    this.isRequested = true;
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });

        // Re-acquire if user switched tabs and came back
        if (!this.hasVisibilityListener) {
          document.addEventListener('visibilitychange', this.handleVisibilityChange);
          this.hasVisibilityListener = true;
        }
        return true;
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
        return false;
      }
    }
    return false;
  }

  private handleVisibilityChange = async () => {
    if (this.isRequested && document.visibilityState === 'visible' && !this.wakeLock) {
      await this.requestLock();
    }
  };

  public async releaseLock() {
    this.isRequested = false;
    if (this.hasVisibilityListener) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.hasVisibilityListener = false;
    }
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
      } catch (_) {}
    }
  }
}

export const wakeLockService = new WakeLockService();
