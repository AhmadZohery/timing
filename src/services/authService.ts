import { db } from '../db/db';
import type { AuthAccount, AuthSession } from '../types';

const SESSION_STORAGE_KEY = 'midmar_auth_session';
const PERSISTENT_STORAGE_KEY = 'midmar_auth_persistent_session';
const AUTOLOCK_MINUTES_KEY = 'midmar_autolock_minutes';
const LAST_ACTIVITY_KEY = 'midmar_last_activity_ts';
const EXPLICIT_LOCKED_KEY = 'midmar_explicit_locked';

/**
 * Detect if running in local development environment (localhost / 127.0.0.1)
 */
export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local') ||
    hostname === ''
  );
}

/**
 * Master Owner Configuration for Ahmad (أحمد)
 */
export const DEFAULT_MASTER_ACCOUNT = {
  id: 'account_owner_ahmad',
  username: 'Ahmad',
  cleanUsername: 'ahmad',
  displayName: 'أحمد',
  email: 'AhmadZohery@gmail.com',
  defaultPassword: 'Ahmad@2026',
  defaultPin: '2026',
};

class AuthService {
  private cachedSession: AuthSession | null = null;

  /**
   * Securely hash password using browser-native Web Crypto API (SHA-256 + Salt)
   */
  public async hashSecret(secret: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${secret}:${salt}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a cryptographically secure random salt
   */
  public generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Ensure the master account for Ahmad exists in IndexedDB
   */
  public async ensureDefaultOwnerAccount(): Promise<AuthAccount> {
    try {
      const all = await db.auth_accounts.toArray();
      const existing = all.find(
        (a) =>
          a.username.toLowerCase() === DEFAULT_MASTER_ACCOUNT.cleanUsername ||
          a.email?.toLowerCase() === DEFAULT_MASTER_ACCOUNT.email.toLowerCase() ||
          a.isOwner
      );

      const salt = existing?.salt || this.generateSalt();
      const passwordHash =
        existing?.passwordHash || (await this.hashSecret(DEFAULT_MASTER_ACCOUNT.defaultPassword, salt));
      const pinHash =
        existing?.pinHash || (await this.hashSecret(DEFAULT_MASTER_ACCOUNT.defaultPin, salt));

      if (existing) {
        await db.auth_accounts.update(existing.id, {
          username: DEFAULT_MASTER_ACCOUNT.username,
          displayName: DEFAULT_MASTER_ACCOUNT.displayName,
          email: DEFAULT_MASTER_ACCOUNT.email,
          isOwner: true,
        });
        return {
          ...existing,
          username: DEFAULT_MASTER_ACCOUNT.username,
          displayName: DEFAULT_MASTER_ACCOUNT.displayName,
          email: DEFAULT_MASTER_ACCOUNT.email,
          isOwner: true,
        };
      }

      const account: AuthAccount = {
        id: DEFAULT_MASTER_ACCOUNT.id,
        username: DEFAULT_MASTER_ACCOUNT.username,
        displayName: DEFAULT_MASTER_ACCOUNT.displayName,
        email: DEFAULT_MASTER_ACCOUNT.email,
        passwordHash,
        salt,
        pinHash,
        isOwner: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await db.auth_accounts.add(account);
      return account;
    } catch {
      return {
        id: DEFAULT_MASTER_ACCOUNT.id,
        username: DEFAULT_MASTER_ACCOUNT.username,
        displayName: DEFAULT_MASTER_ACCOUNT.displayName,
        email: DEFAULT_MASTER_ACCOUNT.email,
        passwordHash: '',
        salt: '',
        isOwner: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Check if at least one account exists in the database
   */
  public async hasRegisteredAccount(): Promise<boolean> {
    try {
      const count = await db.auth_accounts.count();
      return count > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get the primary owner account
   */
  public async getOwnerAccount(): Promise<AuthAccount | null> {
    try {
      const accounts = await db.auth_accounts.toArray();
      if (accounts.length === 0) return null;
      return accounts.find((a) => a.isOwner) || accounts[0];
    } catch {
      return null;
    }
  }

  /**
   * Register the primary owner account on first application setup
   */
  public async registerOwner(
    displayName: string,
    username: string,
    password: string,
    pin?: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanUsername = username.trim();
    const cleanName = displayName.trim() || DEFAULT_MASTER_ACCOUNT.displayName;
    const cleanEmail = email?.trim() || DEFAULT_MASTER_ACCOUNT.email;

    if (!cleanUsername) {
      return { success: false, error: 'يرجى إدخال اسم المستخدم' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'كلمة المرور يجب ألا تقل عن 4 أحرف أو أرقام' };
    }

    try {
      const existing = await db.auth_accounts
        .where('username')
        .equalsIgnoreCase(cleanUsername)
        .first();
      if (existing) {
        return { success: false, error: 'اسم المستخدم مسجل مسبقاً' };
      }

      const salt = this.generateSalt();
      const passwordHash = await this.hashSecret(password, salt);
      let pinHash: string | undefined;

      if (pin && pin.trim().length >= 4) {
        pinHash = await this.hashSecret(pin.trim(), salt);
      }

      const account: AuthAccount = {
        id: `account_owner_${Date.now()}`,
        username: cleanUsername,
        displayName: cleanName,
        email: cleanEmail,
        passwordHash,
        salt,
        pinHash,
        isOwner: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await db.auth_accounts.add(account);

      // Create initial active session
      this.createSession(account, true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل إنشاء الحساب' };
    }
  }

  /**
   * Register a new user account (supporting multiple users / profiles)
   */
  public async registerNewUser(
    displayName: string,
    username: string,
    password: string,
    pin?: string,
    email?: string
  ): Promise<{ success: boolean; error?: string; account?: AuthAccount }> {
    const cleanUsername = username.trim();
    const cleanName = displayName.trim() || cleanUsername;
    const cleanEmail = email?.trim() || undefined;

    if (!cleanUsername) {
      return { success: false, error: 'يرجى إدخال اسم المستخدم' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'كلمة المرور يجب ألا تقل عن 4 أحرف أو أرقام' };
    }

    try {
      const existing = await db.auth_accounts
        .where('username')
        .equalsIgnoreCase(cleanUsername)
        .first();
      if (existing) {
        return { success: false, error: 'اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم آخر' };
      }

      const count = await db.auth_accounts.count();
      const isFirst = count === 0;

      const salt = this.generateSalt();
      const passwordHash = await this.hashSecret(password, salt);
      let pinHash: string | undefined;

      if (pin && pin.trim().length >= 4) {
        pinHash = await this.hashSecret(pin.trim(), salt);
      }

      const account: AuthAccount = {
        id: `account_user_${Date.now()}`,
        username: cleanUsername,
        displayName: cleanName,
        email: cleanEmail,
        passwordHash,
        salt,
        pinHash,
        isOwner: isFirst,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await db.auth_accounts.add(account);

      // Create matching user profile
      const newProfileId = `profile_${account.id}`;
      try {
        await db.profiles.add({
          id: newProfileId,
          name: cleanName,
          roleTemplate: 'software_engineer',
          email: cleanEmail,
          isDefault: isFirst,
          createdAt: new Date().toISOString(),
        });
      } catch (_) {}

      // Create active session
      this.createSession(account, true);
      return { success: true, account };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل إنشاء الحساب' };
    }
  }

  /**
   * Authenticate via username/email and password
   */
  public async login(
    usernameOrEmail: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    if (!cleanInput || !password) {
      return { success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }

    try {
      const all = await db.auth_accounts.toArray();
      let account = all.find(
        (a) =>
          a.username.toLowerCase() === cleanInput ||
          a.email?.toLowerCase() === cleanInput ||
          (all.length === 1 && (cleanInput === 'admin' || cleanInput === 'ahmad' || cleanInput === 'owner'))
      );

      if (!account) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      }

      const computedHash = await this.hashSecret(password, account.salt);
      if (computedHash !== account.passwordHash) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      }

      // Update last login
      await db.auth_accounts.update(account.id, {
        lastLoginAt: new Date().toISOString(),
      });

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(EXPLICIT_LOCKED_KEY);
      }

      this.createSession(account, rememberMe);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل تسجيل الدخول' };
    }
  }

  /**
   * Quick authenticate via numeric PIN (if set)
   */
  public async loginWithPin(
    pin: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> {
    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length < 4) {
      return { success: false, error: 'رمز PIN غير مكتمل' };
    }

    try {
      const owner = await this.getOwnerAccount();
      if (!owner || !owner.pinHash) {
        return { success: false, error: 'لم يتم تعيين رمز PIN سريع لهذا الحساب' };
      }

      const computedPinHash = await this.hashSecret(cleanPin, owner.salt);
      if (computedPinHash !== owner.pinHash) {
        return { success: false, error: 'رمز الـ PIN غير صحيح' };
      }

      await db.auth_accounts.update(owner.id, {
        lastLoginAt: new Date().toISOString(),
      });

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(EXPLICIT_LOCKED_KEY);
      }

      this.createSession(owner, rememberMe);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل التحقق من رمز PIN' };
    }
  }

  /**
   * One-click instant bypass login for local environment (localhost / 127.0.0.1)
   */
  public bypassLoginLocalOwner(): AuthSession {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(EXPLICIT_LOCKED_KEY);
    }
    const session: AuthSession = {
      token: `session_local_${Date.now()}`,
      userId: DEFAULT_MASTER_ACCOUNT.id,
      username: DEFAULT_MASTER_ACCOUNT.username,
      displayName: DEFAULT_MASTER_ACCOUNT.displayName,
      email: DEFAULT_MASTER_ACCOUNT.email,
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      rememberMe: true,
    };
    this.cachedSession = session;
    this.recordActivity();
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PERSISTENT_STORAGE_KEY, JSON.stringify(session));
      }
    } catch (_) {}
    return session;
  }

  /**
   * Create an authenticated session
   */
  private createSession(account: AuthAccount, rememberMe: boolean) {
    const token = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = rememberMe
      ? Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
      : Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const session: AuthSession = {
      token,
      userId: account.id,
      username: account.username,
      displayName: account.displayName,
      email: account.email,
      expiresAt,
      rememberMe,
    };

    this.cachedSession = session;
    this.recordActivity();

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      if (rememberMe) {
        localStorage.setItem(PERSISTENT_STORAGE_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(PERSISTENT_STORAGE_KEY);
      }
    } catch (_) {}
  }

  /**
   * Check if current session is authenticated and not expired
   */
  public isAuthenticated(): boolean {
    // If running in local environment (localhost / 127.0.0.1)
    // User requested: "بس عموما خليه مفتوح لوكال عادي بدون باسوورد"
    if (isLocalEnvironment()) {
      const explicitLocked =
        typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem(EXPLICIT_LOCKED_KEY) === 'true'
          : false;

      // If user did not explicitly press "Lock" in this session, keep open locally without password
      if (!explicitLocked) {
        if (!this.cachedSession) {
          this.cachedSession = {
            token: 'session_local_ahmad',
            userId: DEFAULT_MASTER_ACCOUNT.id,
            username: DEFAULT_MASTER_ACCOUNT.username,
            displayName: DEFAULT_MASTER_ACCOUNT.displayName,
            email: DEFAULT_MASTER_ACCOUNT.email,
            expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
            rememberMe: true,
          };
        }
        return true;
      }
    }

    if (this.cachedSession && this.cachedSession.expiresAt > Date.now()) {
      if (this.isAutoLocked()) {
        return false;
      }
      return true;
    }

    // Try reading from sessionStorage
    try {
      const sessStr = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null;
      if (sessStr) {
        const session: AuthSession = JSON.parse(sessStr);
        if (session.expiresAt > Date.now()) {
          this.cachedSession = session;
          if (this.isAutoLocked()) return false;
          return true;
        }
      }

      // Try reading from localStorage (Remember Me)
      const persStr = typeof localStorage !== 'undefined' ? localStorage.getItem(PERSISTENT_STORAGE_KEY) : null;
      if (persStr) {
        const session: AuthSession = JSON.parse(persStr);
        if (session.expiresAt > Date.now()) {
          this.cachedSession = session;
          if (this.isAutoLocked()) return false;
          // Refresh session storage
          sessionStorage.setItem(SESSION_STORAGE_KEY, persStr);
          return true;
        }
      }
    } catch (_) {}

    return false;
  }

  /**
   * Get active session details
   */
  public getSession(): AuthSession | null {
    if (this.isAuthenticated()) {
      return this.cachedSession;
    }
    return null;
  }

  /**
   * Log out and lock the application
   */
  public logout() {
    this.cachedSession = null;
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(EXPLICIT_LOCKED_KEY, 'true');
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(PERSISTENT_STORAGE_KEY);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      }
    } catch (_) {}
  }

  /**
   * Auto-lock detection
   */
  public recordActivity() {
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    } catch (_) {}
  }

  public getAutoLockMinutes(): number {
    try {
      const val = localStorage.getItem(AUTOLOCK_MINUTES_KEY);
      return val ? Number(val) : 0; // 0 = disabled
    } catch {
      return 0;
    }
  }

  public setAutoLockMinutes(minutes: number) {
    try {
      localStorage.setItem(AUTOLOCK_MINUTES_KEY, String(minutes));
    } catch (_) {}
  }

  private isAutoLocked(): boolean {
    const minutes = this.getAutoLockMinutes();
    if (minutes <= 0) return false;

    try {
      const last = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!last) return false;
      const elapsedMs = Date.now() - Number(last);
      return elapsedMs > minutes * 60 * 1000;
    } catch {
      return false;
    }
  }

  /**
   * Change current account password
   */
  public async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const session = this.getSession();
    if (!session) return { success: false, error: 'غير مسجل دخول' };

    try {
      const account = await db.auth_accounts.get(session.userId);
      if (!account) return { success: false, error: 'الحساب غير موجود' };

      const computedCurrent = await this.hashSecret(currentPassword, account.salt);
      if (computedCurrent !== account.passwordHash) {
        return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
      }

      if (!newPassword || newPassword.length < 4) {
        return { success: false, error: 'كلمة المرور الجديدة يجب أن تكون 4 خانات على الأقل' };
      }

      const newSalt = this.generateSalt();
      const newPasswordHash = await this.hashSecret(newPassword, newSalt);
      let newPinHash = account.pinHash;

      // Re-hash pin with new salt if existed
      if (account.pinHash) {
        newPinHash = undefined;
      }

      await db.auth_accounts.update(account.id, {
        passwordHash: newPasswordHash,
        salt: newSalt,
        pinHash: newPinHash,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل تحديث كلمة المرور' };
    }
  }

  /**
   * Set or update numeric PIN
   */
  public async setPin(pin: string): Promise<{ success: boolean; error?: string }> {
    const session = this.getSession();
    if (!session) return { success: false, error: 'غير مسجل دخول' };

    try {
      const account = await db.auth_accounts.get(session.userId);
      if (!account) return { success: false, error: 'الحساب غير موجود' };

      const cleanPin = pin.trim();
      if (cleanPin.length < 4) {
        return { success: false, error: 'رمز الـ PIN يجب أن يكون 4 أرقام على الأقل' };
      }

      const pinHash = await this.hashSecret(cleanPin, account.salt);
      await db.auth_accounts.update(account.id, { pinHash });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل حفظ رمز PIN' };
    }
  }

  /**
   * Remove numeric PIN
   */
  public async removePin(): Promise<{ success: boolean; error?: string }> {
    const session = this.getSession();
    if (!session) return { success: false, error: 'غير مسجل دخول' };

    try {
      await db.auth_accounts.update(session.userId, { pinHash: undefined });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل إزالة رمز PIN' };
    }
  }
}

export const authService = new AuthService();
