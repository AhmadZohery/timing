/**
 * UnifiedSystemHeartbeatCoordinator
 * Consolidates background timer wakeups (Prayer, Sleep, Accountability)
 * into a single coordinated heartbeat loop to reduce CPU cycles and battery drain.
 */
import { prayerNotificationManager } from './prayerNotificationManager';
import { sleepNotificationManager } from './sleepNotificationManager';
import { accountabilityNotificationManager } from './accountabilityNotificationManager';
import { autonomousNotificationScheduler } from './autonomousNotificationScheduler';

class SystemHeartbeatCoordinator {
  private isRunning = false;
  private refreshIntervalId: number | null = null;

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      prayerNotificationManager.start();
      sleepNotificationManager.start();
      accountabilityNotificationManager.start();

      // Trigger autonomous 24h-48h background alarm queue calculation
      autonomousNotificationScheduler.scheduleAllUpcomingAlarms();

      // Refresh autonomous alarms on visibility change (when phone is unlocked / app reopened)
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', this.handleVisibilityOrNetwork);
        window.addEventListener('online', this.handleVisibilityOrNetwork);
      }

      // Periodic check every 2 hours to keep upcoming day alarms populated
      if (typeof window !== 'undefined') {
        this.refreshIntervalId = window.setInterval(() => {
          autonomousNotificationScheduler.scheduleAllUpcomingAlarms();
        }, 2 * 60 * 60 * 1000);
      }
    } catch (e) {
      console.warn('SystemHeartbeatCoordinator start notice:', e);
    }
  }

  private handleVisibilityOrNetwork = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      autonomousNotificationScheduler.scheduleAllUpcomingAlarms();
    }
  };

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.refreshIntervalId !== null) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityOrNetwork);
      window.removeEventListener('online', this.handleVisibilityOrNetwork);
    }

    try {
      prayerNotificationManager.stop();
      sleepNotificationManager.stop();
      accountabilityNotificationManager.stop();
    } catch (e) {
      console.warn('SystemHeartbeatCoordinator stop notice:', e);
    }
  }
}

export const systemHeartbeat = new SystemHeartbeatCoordinator();

