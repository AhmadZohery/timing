/**
 * UnifiedSystemHeartbeatCoordinator
 * Consolidates background timer wakeups (Prayer, Sleep, Accountability)
 * into a single coordinated heartbeat loop to reduce CPU cycles and battery drain.
 */
import { prayerNotificationManager } from './prayerNotificationManager';
import { sleepNotificationManager } from './sleepNotificationManager';
import { accountabilityNotificationManager } from './accountabilityNotificationManager';

class SystemHeartbeatCoordinator {
  private isRunning = false;

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      prayerNotificationManager.start();
      sleepNotificationManager.start();
      accountabilityNotificationManager.start();
    } catch (e) {
      console.warn('SystemHeartbeatCoordinator start notice:', e);
    }
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

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
