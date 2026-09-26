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
      const res = await fetch('/api/status', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
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

      const [courses, dailyLogs, workdayTasks, goals, profiles] = await Promise.all([
        db.study_courses.toArray(),
        db.daily_logs.toArray(),
        db.workday_tasks.toArray(),
        db.goals.toArray(),
        db.profiles.toArray(),
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
        message: 'تمت مزامنة وحفظ جميع المسارات والبيانات على السيرفر بنجاح ☁️',
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
}

export const serverSync = new ServerSyncService();
