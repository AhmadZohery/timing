import { db } from '../db/db';

export interface ServerSyncStatus {
  isServerAvailable: boolean;
  serverTime?: string;
  uptimeSeconds?: number;
  aiConfigured: boolean;
  aiProviders?: { deepseek?: string; gemini?: string };
  lastSyncedAt?: string;
  pendingSync: boolean;
}

const LAST_SYNC_KEY = 'midmar_server_last_synced_at';

export class ServerSyncService {
  private isOnline = false;
  private aiConfiguredOnServer = false;
  private syncInProgress = false;
  private listeners: Set<(status: ServerSyncStatus) => void> = new Set();
  private checkInterval: any = null;

  constructor() {
    this.checkServerAvailability();
    // Check every 60s
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.checkServerAvailability());
      this.checkInterval = setInterval(() => this.checkServerAvailability(), 60000);
    }
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public subscribe(fn: (status: ServerSyncStatus) => void): () => void {
    this.listeners.add(fn);
    fn(this.getStatus());
    return () => this.listeners.delete(fn);
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((fn) => {
      try {
        fn(status);
      } catch (_) {}
    });
  }

  public getStatus(): ServerSyncStatus {
    const lastSync = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_SYNC_KEY) : null;
    return {
      isServerAvailable: this.isOnline,
      aiConfigured: this.aiConfiguredOnServer,
      lastSyncedAt: lastSync || undefined,
      pendingSync: this.syncInProgress,
    };
  }

  /**
   * Health-check whether backend server is reachable.
   */
  async checkServerAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('/api/status', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        this.isOnline = data.ok === true;
        this.aiConfiguredOnServer = data.aiConfigured === true;
        this.notify();
        return true;
      }
    } catch (_) {
      // Server not reachable (e.g. running purely on GitHub Pages or offline)
    }
    this.isOnline = false;
    this.aiConfiguredOnServer = false;
    this.notify();
    return false;
  }

  /**
   * Push all key client data (Courses, Logs, Tasks, Goals) to server storage.
   */
  async pushToServer(): Promise<{ success: boolean; message: string; syncedAt?: string }> {
    if (!this.isOnline) {
      const isReachable = await this.checkServerAvailability();
      if (!isReachable) {
        return { success: false, message: 'السيرفر غير متصل حالياً (التطبيق يعمل محلياً 100%)' };
      }
    }

    if (this.syncInProgress) {
      return { success: false, message: 'المزامنة جارية بالفعل...' };
    }

    this.syncInProgress = true;
    this.notify();

    try {
      const userState = await db.user_state.get('current_user');
      const profileId = userState?.activeProfileId || 'profile_default';

      const [
        courses,
        dailyLogs,
        workdayTasks,
        goals,
        profiles,
        customHabits,
        workoutLogs,
        languageProgress,
        tasbihCounters,
        customReminders,
        bufferQueue,
      ] = await Promise.all([
        db.study_courses.toArray(),
        db.daily_logs.toArray(),
        db.workday_tasks.toArray(),
        db.goals.toArray(),
        db.profiles.toArray(),
        db.custom_habits.toArray(),
        db.workout_logs.toArray(),
        db.language_progress.toArray(),
        db.tasbih_counters.toArray(),
        db.custom_reminders.toArray(),
        db.buffer_queue.toArray(),
      ]);

      const payload = {
        profileId,
        timestamp: Date.now(),
        data: {
          courses,
          dailyLogs,
          workdayTasks,
          goals,
          profiles,
          customHabits,
          workoutLogs,
          languageProgress,
          tasbihCounters,
          customReminders,
          bufferQueue,
          userSettings: userState?.settings,
        },
      };

      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const resData = await res.json();
      const syncedAt = resData.syncedAt || new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, syncedAt);

      return {
        success: true,
        message: 'تمت مزامنة وحفظ جميع الجداول والبيانات بنجاح في قاعدة بيانات بوستجري المركزية ☁️',
        syncedAt,
      };
    } catch (err: any) {
      console.warn('Sync push to server failed:', err);
      return { success: false, message: `تعذرت المزامنة: ${err.message || 'خطأ في الاتصال'}` };
    } finally {
      this.syncInProgress = false;
      this.notify();
    }
  }

  /**
   * Pull saved state from server and merge into local IndexedDB.
   */
  async pullFromServer(): Promise<{ success: boolean; message: string; countRestored?: number }> {
    if (!this.isOnline) {
      const isReachable = await this.checkServerAvailability();
      if (!isReachable) {
        return { success: false, message: 'السيرفر غير متصل' };
      }
    }

    try {
      const userState = await db.user_state.get('current_user');
      const profileId = userState?.activeProfileId || 'profile_default';

      const res = await fetch(`/api/sync/pull?profileId=${encodeURIComponent(profileId)}`);
      if (!res.ok) {
        if (res.status === 404) {
          return { success: false, message: 'لا توجد بيانات محفوظة مسبقاً لهذا الحساب على السيرفر.' };
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const record = await res.json();
      const data = record.data;
      if (!data) {
        return { success: false, message: 'بيانات السيرفر فارغة' };
      }

      let count = 0;
      // Restore courses
      if (Array.isArray(data.courses) && data.courses.length > 0) {
        await db.study_courses.bulkPut(data.courses);
        count += data.courses.length;
      }

      // Restore daily logs
      if (Array.isArray(data.dailyLogs) && data.dailyLogs.length > 0) {
        await db.daily_logs.bulkPut(data.dailyLogs);
        count += data.dailyLogs.length;
      }

      // Restore workday tasks
      if (Array.isArray(data.workdayTasks) && data.workdayTasks.length > 0) {
        await db.workday_tasks.bulkPut(data.workdayTasks);
        count += data.workdayTasks.length;
      }

      // Restore goals
      if (Array.isArray(data.goals) && data.goals.length > 0) {
        await db.goals.bulkPut(data.goals);
        count += data.goals.length;
      }

      // Restore profiles
      if (Array.isArray(data.profiles) && data.profiles.length > 0) {
        await db.profiles.bulkPut(data.profiles);
        count += data.profiles.length;
      }

      // Restore custom habits
      if (Array.isArray(data.customHabits) && data.customHabits.length > 0) {
        await db.custom_habits.bulkPut(data.customHabits);
        count += data.customHabits.length;
      }

      // Restore workout logs
      if (Array.isArray(data.workoutLogs) && data.workoutLogs.length > 0) {
        await db.workout_logs.bulkPut(data.workoutLogs);
        count += data.workoutLogs.length;
      }

      // Restore language progress
      if (Array.isArray(data.languageProgress) && data.languageProgress.length > 0) {
        await db.language_progress.bulkPut(data.languageProgress);
        count += data.languageProgress.length;
      }

      // Restore tasbih counters
      if (Array.isArray(data.tasbihCounters) && data.tasbihCounters.length > 0) {
        await db.tasbih_counters.bulkPut(data.tasbihCounters);
        count += data.tasbihCounters.length;
      }

      // Restore custom reminders
      if (Array.isArray(data.customReminders) && data.customReminders.length > 0) {
        await db.custom_reminders.bulkPut(data.customReminders);
        count += data.customReminders.length;
      }

      // Restore buffer queue
      if (Array.isArray(data.bufferQueue) && data.bufferQueue.length > 0) {
        await db.buffer_queue.bulkPut(data.bufferQueue);
        count += data.bufferQueue.length;
      }

      const syncedAt = record.syncedAt || new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, syncedAt);
      this.notify();

      return {
        success: true,
        message: `تم استرجاع ومزامنة ${count} عنصر بنجاح من السيرفر! 🚀`,
        countRestored: count,
      };
    } catch (err: any) {
      return { success: false, message: `فشل استرجاع البيانات: ${err.message}` };
    }
  }

  /**
   * Call server-side token-saving AI proxy with LRU response caching.
   * If server has keys, consumes 0 client tokens.
   */
  async callServerAiProxy(
    prompt: string,
    systemPrompt: string = '',
    maxTokens: number = 150
  ): Promise<{ text: string; cached: boolean; tokensSaved?: number } | null> {
    if (!this.isOnline) return null;

    try {
      const res = await fetch('/api/ai/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt, maxTokens }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          text: data.text,
          cached: Boolean(data.cached),
          tokensSaved: data.tokensSaved,
        };
      }
    } catch (err) {
      console.warn('Server AI proxy call failed:', err);
    }

    return null;
  }

  /**
   * Helper: convert base64 VAPID key to Uint8Array for browser PushManager
   */
  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Check if browser has an active PushManager subscription.
   */
  async isPushSubscribed(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      return !!sub;
    } catch (_) {
      return false;
    }
  }

  /**
   * Ensure browser Service Worker is subscribed to Web Push on the server.
   */
  async ensurePushSubscription(profileId: string = 'default'): Promise<boolean> {
    if (!this.isOnline || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      // 1. Get VAPID public key from server
      const keyRes = await fetch('/api/push/vapid-public-key');
      if (!keyRes.ok) return false;
      const keyData = await keyRes.json();
      if (!keyData.publicKey) return false;

      // 2. Subscribe via PushManager
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlB64ToUint8Array(keyData.publicKey) as unknown as BufferSource,
        });
      }

      if (!sub) return false;

      // 3. Register subscription on server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, subscription: sub.toJSON() }),
      });

      return true;
    } catch (err) {
      console.warn('Failed to ensure Web Push subscription:', err);
      return false;
    }
  }

  /**
   * Sync upcoming alarm schedule to the server's push dispatcher.
   * Ensures alarms fire on time even if phone screen is locked or app is closed!
   */
  async syncPushSchedule(alarms: any[], profileId: string = 'default'): Promise<boolean> {
    if (!this.isOnline || !alarms || alarms.length === 0) return false;

    try {
      await this.ensurePushSubscription(profileId);

      const res = await fetch('/api/push/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, alarms }),
      });

      return res.ok;
    } catch (err) {
      console.warn('Failed to sync push schedule to server:', err);
      return false;
    }
  }

  /**
   * Cancel an alarm from the server schedule (e.g. when prayer is completed early)
   */
  async cancelPushAlarm(tag: string, profileId: string = 'default'): Promise<void> {
    if (!this.isOnline) return;
    try {
      await fetch('/api/push/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, profileId }),
      });
    } catch (_) {}
  }

  /**
   * Trigger an instant test lockscreen push notification via the server
   */
  async sendTestLockscreenPush(delaySeconds: number = 5, profileId: string = 'default'): Promise<{ success: boolean; message: string }> {
    if (!this.isOnline) {
      return { success: false, message: 'السيرفر غير متصل حالياً' };
    }

    try {
      await this.ensurePushSubscription(profileId);

      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delaySeconds, profileId }),
      });

      const data = await res.json();
      return {
        success: data.ok,
        message: data.message || data.error || 'تم إرسال أمر التجربة للسيرفر',
      };
    } catch (err: any) {
      return { success: false, message: `فشل إرسال التنبيه التجريبي: ${err.message}` };
    }
  }
}

export const serverSync = new ServerSyncService();
