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
const LAST_DELTA_SYNC_KEY = 'midmar_server_last_delta_sync_ts';
const DEVICE_ID_KEY = 'midmar_client_device_id';

export function getOrCreateDeviceId(): string {
  if (typeof localStorage === 'undefined') return 'device_ephemeral';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `dev_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export class ServerSyncService {
  private isOnline = false;
  private aiConfiguredOnServer = false;
  private syncInProgress = false;
  private listeners: Set<(status: ServerSyncStatus) => void> = new Set();
  private checkInterval: any = null;
  private onlineHandler: (() => void) | null = null;

  constructor() {
    this.checkServerAvailability();
    // Check every 60s
    if (typeof window !== 'undefined') {
      this.onlineHandler = () => this.checkServerAvailability();
      window.addEventListener('online', this.onlineHandler);
      this.checkInterval = setInterval(() => this.checkServerAvailability(), 60000);
    }
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (typeof window !== 'undefined' && this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
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
      } catch {}
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
    } catch {
      // Server not reachable (e.g. running purely on GitHub Pages or offline)
    }
    this.isOnline = false;
    this.aiConfiguredOnServer = false;
    this.notify();
    return false;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('midmar_server_sync_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    return headers;
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
        quranProgress,
        bookProgress,
        leads,
        templates,
        customRewards,
        redeemedRewards,
        matchLogs,
        authAccounts,
        externalCalendarEvents,
        customDecks,
        customVocabularyWords,
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
        db.quran_progress.toArray(),
        db.book_progress.toArray(),
        db.leads.toArray(),
        db.templates.toArray(),
        db.custom_rewards.toArray(),
        db.redeemed_rewards.toArray(),
        db.match_logs.toArray(),
        db.auth_accounts.toArray(),
        db.external_calendar_events.toArray(),
        db.custom_decks.toArray(),
        db.custom_vocabulary_words.toArray(),
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
          quranProgress,
          bookProgress,
          leads,
          templates,
          customRewards,
          redeemedRewards,
          matchLogs,
          authAccounts,
          externalCalendarEvents,
          customDecks,
          customVocabularyWords,
          userSettings: userState?.settings,
          fullUserState: userState,
        },
      };

      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: this.getAuthHeaders(),
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
        message: 'تمت مزامنة وحفظ جميع الجداول الـ 23 والبيانات بنجاح في قاعدة بيانات بوستجري المركزية ☁️',
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
   * Lightweight Last-Write-Wins (LWW) Delta Sync (OPP-0101 / RFC-0001)
   * Only transmits modified items since lastSyncTimestamp.
   */
  async syncDelta(): Promise<{
    success: boolean;
    message: string;
    countPushed?: number;
    countPulled?: number;
    serverSyncTimestamp?: number;
  }> {
    if (!this.isOnline) {
      const isReachable = await this.checkServerAvailability();
      if (!isReachable) {
        return { success: false, message: 'السيرفر غير متصل حالياً' };
      }
    }

    if (this.syncInProgress) {
      return { success: false, message: 'مزامنة أخرى جارية حالياً...' };
    }

    this.syncInProgress = true;
    this.notify();

    try {
      const deviceId = getOrCreateDeviceId();
      const userState = await db.user_state.get('current_user');
      const profileId = userState?.activeProfileId || 'profile_default';
      const lastSyncTimestamp = Number(localStorage.getItem(LAST_DELTA_SYNC_KEY)) || 0;

      // Query only records updated after lastSyncTimestamp
      const [
        allTasks,
        allHabits,
        allCalendarEvents,
        allDecks,
        allWords,
        allCourses,
        allGoals,
      ] = await Promise.all([
        db.workday_tasks.toArray(),
        db.custom_habits.toArray(),
        db.external_calendar_events.toArray(),
        db.custom_decks.toArray(),
        db.custom_vocabulary_words.toArray(),
        db.study_courses.toArray(),
        db.goals.toArray(),
      ]);

      const changedTasks = allTasks.filter((t: any) => (t.updatedAt || 0) > lastSyncTimestamp);
      const changedHabits = allHabits.filter((h: any) => (h.updatedAt || 0) > lastSyncTimestamp);
      const changedEvents = allCalendarEvents.filter((e: any) => (e.updatedAt || 0) > lastSyncTimestamp);
      const changedDecks = allDecks.filter((d: any) => (d.updatedAt || 0) > lastSyncTimestamp);
      const changedWords = allWords.filter((w: any) => (w.updatedAt || 0) > lastSyncTimestamp);
      const changedCourses = allCourses.filter((c: any) => (c.updatedAt || 0) > lastSyncTimestamp);
      const changedGoals = allGoals.filter((g: any) => (g.updatedAt || 0) > lastSyncTimestamp);

      const countPushed =
        changedTasks.length +
        changedHabits.length +
        changedEvents.length +
        changedDecks.length +
        changedWords.length +
        changedCourses.length +
        changedGoals.length;

      const payload = {
        clientDeviceId: deviceId,
        userId: profileId,
        lastSyncTimestamp,
        changes: {
          workday_tasks: changedTasks,
          custom_habits: changedHabits,
          external_calendar_events: changedEvents,
          custom_decks: changedDecks,
          custom_vocabulary_words: changedWords,
          study_courses: changedCourses,
          goals: changedGoals,
        },
      };

      const res = await fetch('/api/sync/delta', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const resData = await res.json();
      const serverChanges = resData.serverChanges || {};
      let countPulled = 0;

      // Apply server updates with Last-Write-Wins (LWW)
      if (Array.isArray(serverChanges.workday_tasks) && serverChanges.workday_tasks.length > 0) {
        await db.workday_tasks.bulkPut(serverChanges.workday_tasks);
        countPulled += serverChanges.workday_tasks.length;
      }
      if (Array.isArray(serverChanges.custom_habits) && serverChanges.custom_habits.length > 0) {
        await db.custom_habits.bulkPut(serverChanges.custom_habits);
        countPulled += serverChanges.custom_habits.length;
      }
      if (Array.isArray(serverChanges.external_calendar_events) && serverChanges.external_calendar_events.length > 0) {
        await db.external_calendar_events.bulkPut(serverChanges.external_calendar_events);
        countPulled += serverChanges.external_calendar_events.length;
      }
      if (Array.isArray(serverChanges.custom_decks) && serverChanges.custom_decks.length > 0) {
        await db.custom_decks.bulkPut(serverChanges.custom_decks);
        countPulled += serverChanges.custom_decks.length;
      }
      if (Array.isArray(serverChanges.custom_vocabulary_words) && serverChanges.custom_vocabulary_words.length > 0) {
        await db.custom_vocabulary_words.bulkPut(serverChanges.custom_vocabulary_words);
        countPulled += serverChanges.custom_vocabulary_words.length;
      }
      if (Array.isArray(serverChanges.study_courses) && serverChanges.study_courses.length > 0) {
        await db.study_courses.bulkPut(serverChanges.study_courses);
        countPulled += serverChanges.study_courses.length;
      }
      if (Array.isArray(serverChanges.goals) && serverChanges.goals.length > 0) {
        await db.goals.bulkPut(serverChanges.goals);
        countPulled += serverChanges.goals.length;
      }

      const newSyncTimestamp = resData.serverSyncTimestamp || Date.now();
      localStorage.setItem(LAST_DELTA_SYNC_KEY, String(newSyncTimestamp));
      localStorage.setItem(LAST_SYNC_KEY, new Date(newSyncTimestamp).toISOString());

      return {
        success: true,
        message: `تمت المزامنة الفورية بنجاح (تم إرسال ${countPushed}، واستقبال ${countPulled}) ✨`,
        countPushed,
        countPulled,
        serverSyncTimestamp: newSyncTimestamp,
      };
    } catch (err: any) {
      console.warn('Delta sync failed:', err);
      return { success: false, message: `تعذرت المزامنة الفورية: ${err.message || 'خطأ'}` };
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

      const res = await fetch(`/api/sync/pull?profileId=${encodeURIComponent(profileId)}`, {
        headers: this.getAuthHeaders(),
      });
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

      // Restore quran progress
      if (Array.isArray(data.quranProgress) && data.quranProgress.length > 0) {
        await db.quran_progress.bulkPut(data.quranProgress);
        count += data.quranProgress.length;
      }

      // Restore book progress
      if (Array.isArray(data.bookProgress) && data.bookProgress.length > 0) {
        await db.book_progress.bulkPut(data.bookProgress);
        count += data.bookProgress.length;
      }

      // Restore CRM leads
      if (Array.isArray(data.leads) && data.leads.length > 0) {
        await db.leads.bulkPut(data.leads);
        count += data.leads.length;
      }

      // Restore templates
      if (Array.isArray(data.templates) && data.templates.length > 0) {
        await db.templates.bulkPut(data.templates);
        count += data.templates.length;
      }

      // Restore custom rewards
      if (Array.isArray(data.customRewards) && data.customRewards.length > 0) {
        await db.custom_rewards.bulkPut(data.customRewards);
        count += data.customRewards.length;
      }

      // Restore redeemed rewards
      if (Array.isArray(data.redeemedRewards) && data.redeemedRewards.length > 0) {
        await db.redeemed_rewards.bulkPut(data.redeemedRewards);
        count += data.redeemedRewards.length;
      }

      // Restore match logs
      if (Array.isArray(data.matchLogs) && data.matchLogs.length > 0) {
        await db.match_logs.bulkPut(data.matchLogs);
        count += data.matchLogs.length;
      }

      // Restore external calendar events
      if (Array.isArray(data.externalCalendarEvents) && data.externalCalendarEvents.length > 0) {
        await db.external_calendar_events.bulkPut(data.externalCalendarEvents);
        count += data.externalCalendarEvents.length;
      }

      // Restore custom decks
      if (Array.isArray(data.customDecks) && data.customDecks.length > 0) {
        await db.custom_decks.bulkPut(data.customDecks);
        count += data.customDecks.length;
      }

      // Restore custom vocabulary words
      if (Array.isArray(data.customVocabularyWords) && data.customVocabularyWords.length > 0) {
        await db.custom_vocabulary_words.bulkPut(data.customVocabularyWords);
        count += data.customVocabularyWords.length;
      }

      // Restore full user state
      if (data.fullUserState && typeof data.fullUserState === 'object') {
        await db.user_state.put(data.fullUserState);
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
        headers: this.getAuthHeaders(),
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
    } catch {
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
    } catch {}
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
