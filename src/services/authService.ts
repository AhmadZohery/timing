import { db } from '../db/db';
import type { AuthAccount, AuthSession } from '../types';
import { secureSha256, generateSecureSalt } from '../utils/cryptoFallback';

const SESSION_STORAGE_KEY = 'midmar_auth_session';
const PERSISTENT_STORAGE_KEY = 'midmar_auth_persistent_session';
const AUTOLOCK_MINUTES_KEY = 'midmar_autolock_minutes';
const LAST_ACTIVITY_KEY = 'midmar_last_activity_ts';
const EXPLICIT_LOCKED_KEY = 'midmar_explicit_locked';
const LAST_ACTIVE_ACCOUNT_KEY = 'midmar_last_active_account_id';
const PIN_ATTEMPTS_STORAGE_KEY = 'midmar_pin_attempts_map';

export interface LocalAccountSummary {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  isOwner: boolean;
  hasPin: boolean;
  lastLoginAt?: string;
}

export interface PinLockoutInfo {
  isLocked: boolean;
  requiresPassword: boolean;
  cooldownRemainingSeconds: number;
  failedAttempts: number;
}

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
 * Default Master Configuration Template (Generic, non-binding)
 */
export const DEFAULT_MASTER_ACCOUNT = {
  id: 'account_owner_default',
  username: '',
  cleanUsername: '',
  displayName: '',
  email: '',
  defaultPassword: '',
  defaultPin: '',
};

class AuthService {
  private cachedSession: AuthSession | null = null;

  /**
   * Securely hash password using SHA-256 + Salt (with pure-JS fallback for restricted WebViews)
   */
  public async hashSecret(secret: string, salt: string): Promise<string> {
    return secureSha256(`${salt}:${secret}:${salt}`);
  }

  /**
   * Generate a cryptographically secure random salt
   */
  public generateSalt(): string {
    return generateSecureSalt();
  }

  /**
   * Retrieve the primary owner account from IndexedDB without modifying user details
   */
  public async ensureDefaultOwnerAccount(): Promise<AuthAccount | null> {
    try {
      const all = await db.auth_accounts.toArray();
      if (all.length > 0) {
        return all.find((a) => a.isOwner) || all[0];
      }
      return null;
    } catch {
      return null;
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
   * Get all registered accounts on this device in safe summary format
   */
  public async getAvailableLocalAccounts(): Promise<LocalAccountSummary[]> {
    try {
      const accounts = await db.auth_accounts.toArray();
      return accounts.map((a) => ({
        id: a.id,
        username: a.username,
        displayName: a.displayName,
        email: a.email,
        isOwner: !!a.isOwner,
        hasPin: !!(a.pinHash && a.pinHash.length > 0),
        lastLoginAt: a.lastLoginAt,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get the last active account used on this device
   */
  public async getLastActiveAccount(): Promise<AuthAccount | null> {
    try {
      const lastId = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_ACTIVE_ACCOUNT_KEY) : null;
      if (lastId) {
        const found = await db.auth_accounts.get(lastId);
        if (found) return found;
      }
      return await this.getOwnerAccount();
    } catch {
      return null;
    }
  }

  /**
   * Store the last active account ID on this device
   */
  public setLastActiveAccountId(accountId: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LAST_ACTIVE_ACCOUNT_KEY, accountId);
      }
    } catch {}
  }

  /**
   * Anti-Brute-Force & Rate Limiting Helpers
   */
  private getAttemptsMap(): Record<string, { failedAttempts: number; cooldownUntil: number }> {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const raw = sessionStorage.getItem(PIN_ATTEMPTS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch {}
    return {};
  }

  private saveAttemptsMap(map: Record<string, { failedAttempts: number; cooldownUntil: number }>): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(PIN_ATTEMPTS_STORAGE_KEY, JSON.stringify(map));
      }
    } catch {}
  }

  public getPinLockoutInfo(accountId: string): PinLockoutInfo {
    const map = this.getAttemptsMap();
    const entry = map[accountId];
    if (!entry) {
      return {
        isLocked: false,
        requiresPassword: false,
        cooldownRemainingSeconds: 0,
        failedAttempts: 0,
      };
    }

    const now = Date.now();
    const cooldownRemainingSeconds = Math.max(0, Math.ceil((entry.cooldownUntil - now) / 1000));
    const isLocked = cooldownRemainingSeconds > 0;
    const requiresPassword = entry.failedAttempts >= 5;

    return {
      isLocked,
      requiresPassword,
      cooldownRemainingSeconds,
      failedAttempts: entry.failedAttempts,
    };
  }

  public recordFailedPinAttempt(accountId: string): PinLockoutInfo {
    const map = this.getAttemptsMap();
    const current = map[accountId] || { failedAttempts: 0, cooldownUntil: 0 };
    current.failedAttempts += 1;

    const now = Date.now();
    // After 3 failed attempts: 30s cooldown; After 4 attempts: 60s cooldown; After 5: requires password
    if (current.failedAttempts === 3) {
      current.cooldownUntil = now + 30 * 1000;
    } else if (current.failedAttempts === 4) {
      current.cooldownUntil = now + 60 * 1000;
    } else if (current.failedAttempts >= 5) {
      current.cooldownUntil = now + 300 * 1000; // 5 minutes
    }

    map[accountId] = current;
    this.saveAttemptsMap(map);

    return this.getPinLockoutInfo(accountId);
  }

  public resetPinAttempts(accountId: string): void {
    const map = this.getAttemptsMap();
    if (map[accountId]) {
      delete map[accountId];
      this.saveAttemptsMap(map);
    }
  }

  /**
   * Synchronize registered account with the central server (PostgreSQL)
   */
  public async syncAccountWithServer(account: AuthAccount): Promise<{ success: boolean; error?: string }> {
    if (typeof window === 'undefined') return { success: true };
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: account.id,
          username: account.username,
          displayName: account.displayName,
          email: account.email,
          passwordHash: account.passwordHash,
          salt: account.salt,
          pinHash: account.pinHash,
          role: account.isOwner ? 'owner' : 'user',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          return { success: false, error: data.error || 'اسم المستخدم مسجل مسبقاً على السيرفر المركزي' };
        }
      }
      return { success: true };
    } catch {
      // Offline fallback: allow local-first creation
      return { success: true };
    }
  }

  /**
   * Initialize and register the Master Owner account
   */
  public async registerOwner(
    displayName: string,
    username: string,
    password: string,
    pin?: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> {
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

      // Register with centralized PostgreSQL database if online
      const syncResult = await this.syncAccountWithServer(account);
      if (!syncResult.success) {
        return { success: false, error: syncResult.error };
      }

      await db.auth_accounts.add(account);
      this.setLastActiveAccountId(account.id);

      // Create matching user profile & update user state
      const profileId = `profile_${account.id}`;
      try {
        await db.profiles.put({
          id: profileId,
          name: cleanName,
          roleTemplate: 'software_engineer',
          email: cleanEmail,
          isDefault: true,
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
          avatarEmoji: '⚡',
        });
        // Also update default profile if present for fallback resilience
        const defProfile = await db.profiles.get('profile_default');
        if (defProfile) {
          await db.profiles.update('profile_default', {
            name: cleanName,
            email: cleanEmail || defProfile.email,
            onboardingCompleted: false,
          });
        }
        const userState = await db.user_state.get('current_user');
        if (userState) {
          await db.user_state.update('current_user', { activeProfileId: profileId });
        }
      } catch {}

      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('midmar_onboarding_wizard_seen');
        }
      } catch {}

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

      // Register with centralized PostgreSQL database if online
      const syncResult = await this.syncAccountWithServer(account);
      if (!syncResult.success) {
        return { success: false, error: syncResult.error };
      }

      await db.auth_accounts.add(account);
      this.setLastActiveAccountId(account.id);

      // Create matching user profile & update user state
      const newProfileId = `profile_${account.id}`;
      try {
        await db.profiles.put({
          id: newProfileId,
          name: cleanName,
          roleTemplate: 'software_engineer',
          email: cleanEmail,
          isDefault: isFirst,
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
          avatarEmoji: '⚡',
        });
        const userState = await db.user_state.get('current_user');
        if (userState) {
          await db.user_state.update('current_user', { activeProfileId: newProfileId });
        }
      } catch {}

      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('midmar_onboarding_wizard_seen');
        }
      } catch {}

      // Create active session
      this.createSession(account, true);
      return { success: true, account };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل إنشاء الحساب' };
    }
  }

  /**
   * Authenticate via username/email and password with central PostgreSQL fallback
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
          a.email?.toLowerCase() === cleanInput
      );

      // If account not found in local IndexedDB, attempt to authenticate with PostgreSQL server
      if (!account && typeof window !== 'undefined') {
        try {
          const saltRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameOrEmail: cleanInput, requestSaltOnly: true }),
          });
          const saltData = await saltRes.json().catch(() => ({}));
          if (saltRes.ok && saltData.salt) {
            const computedPasswordHash = await this.hashSecret(password, saltData.salt);
            const loginRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ usernameOrEmail: cleanInput, passwordHash: computedPasswordHash }),
            });
            const loginData = await loginRes.json().catch(() => ({}));
            if (loginRes.ok && loginData.user) {
              const remoteUser = loginData.user;
              account = {
                id: remoteUser.id,
                username: remoteUser.username,
                displayName: remoteUser.displayName,
                email: remoteUser.email,
                passwordHash: computedPasswordHash,
                salt: saltData.salt,
                pinHash: remoteUser.pinHash || undefined,
                isOwner: remoteUser.role === 'owner',
                createdAt: remoteUser.createdAt || new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
              };
              await db.auth_accounts.put(account);
              this.setLastActiveAccountId(account.id);

              // Ensure matching profile is stored in local IndexedDB
              const profileId = `profile_${account.id}`;
              const isCompleted = Boolean(remoteUser.onboardingCompleted);
              await db.profiles.put({
                id: profileId,
                name: remoteUser.displayName,
                email: remoteUser.email || '',
                roleTemplate: 'software_engineer',
                isDefault: remoteUser.role === 'owner',
                onboardingCompleted: isCompleted,
                createdAt: remoteUser.createdAt || new Date().toISOString(),
                avatarEmoji: '⚡',
              });

              const userState = await db.user_state.get('current_user');
              if (userState) {
                await db.user_state.update('current_user', { activeProfileId: profileId });
              }

              if (isCompleted && typeof localStorage !== 'undefined') {
                localStorage.setItem('midmar_onboarding_wizard_seen', 'true');
              }
            } else if (!loginRes.ok) {
              return { success: false, error: loginData.error || 'اسم المستخدم أو كلمة المرور غير صحيحة' };
            }
          }
        } catch {}
      }

      if (!account) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      }

      const computedHash = await this.hashSecret(password, account.salt);
      if (computedHash !== account.passwordHash) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      }

      // Update last login & reset pin attempts
      await db.auth_accounts.update(account.id, {
        lastLoginAt: new Date().toISOString(),
      });
      this.resetPinAttempts(account.id);
      this.setLastActiveAccountId(account.id);

      // Ensure active profile exists and user_state points to it
      const profileId = `profile_${account.id}`;
      const existingProfile = await db.profiles.get(profileId);
      if (!existingProfile) {
        await db.profiles.put({
          id: profileId,
          name: account.displayName,
          email: account.email || '',
          roleTemplate: 'software_engineer',
          isDefault: Boolean(account.isOwner),
          createdAt: account.createdAt,
          avatarEmoji: '⚡',
        });
      }
      const userState = await db.user_state.get('current_user');
      if (userState && userState.activeProfileId !== profileId) {
        await db.user_state.update('current_user', { activeProfileId: profileId });
      }

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
   * Quick authenticate via numeric PIN for a specific account (scoped PIN authentication)
   * This guarantees that even if multiple users set the exact same PIN (e.g. 1234),
   * each user ONLY unlocks their own account, preventing any account collisions or data leakage!
   */
  public async loginWithPin(
    pin: string,
    accountIdOrUsername?: string,
    rememberMe = true
  ): Promise<{
    success: boolean;
    error?: string;
    requiresPassword?: boolean;
    cooldownRemainingSeconds?: number;
    remainingAttempts?: number;
    account?: AuthAccount;
  }> {
    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length < 4) {
      return { success: false, error: 'رمز PIN غير مكتمل (4 أرقام على الأقل)' };
    }

    try {
      let targetAccount: AuthAccount | null = null;

      if (accountIdOrUsername && accountIdOrUsername.trim()) {
        const query = accountIdOrUsername.trim().toLowerCase();
        const all = await db.auth_accounts.toArray();
        targetAccount =
          all.find(
            (a) =>
              a.id === accountIdOrUsername.trim() ||
              a.username.toLowerCase() === query ||
              a.email?.toLowerCase() === query
          ) || null;
      } else {
        targetAccount = await this.getLastActiveAccount();
      }

      if (!targetAccount) {
        return { success: false, error: 'لم يتم العثور على الحساب المطلوب. يرجى اختيار الحساب أولاً.' };
      }

      // Check brute-force lockout status
      const lockout = this.getPinLockoutInfo(targetAccount.id);
      if (lockout.requiresPassword) {
        return {
          success: false,
          error: 'تم تجاوز الحد الأقصى لمحاولات الـ PIN (5 مرات). لحماية الحساب، يرجى تسجيل الدخول بكلمة المرور الرئيسية.',
          requiresPassword: true,
        };
      }

      if (lockout.isLocked) {
        return {
          success: false,
          error: `تم تجميد المحاولات مؤقتاً لحماية الحساب. يرجى الانتظار (${lockout.cooldownRemainingSeconds} ثانية) أو الدخول بكلمة المرور.`,
          cooldownRemainingSeconds: lockout.cooldownRemainingSeconds,
          requiresPassword: true,
        };
      }

      if (!targetAccount.pinHash) {
        return {
          success: false,
          error: 'هذا الحساب لم يقم بتعيين رمز PIN سريع. يرجى الدخول بكلمة المرور.',
          requiresPassword: true,
        };
      }

      const computedPinHash = await this.hashSecret(cleanPin, targetAccount.salt);
      if (computedPinHash !== targetAccount.pinHash) {
        const updatedLockout = this.recordFailedPinAttempt(targetAccount.id);
        const remaining = Math.max(0, 5 - updatedLockout.failedAttempts);

        if (updatedLockout.requiresPassword) {
          return {
            success: false,
            error: 'تم قفل الـ PIN بعد 5 محاولات خاطئة. يرجى تسجيل الدخول بكلمة المرور الرئيسية.',
            requiresPassword: true,
          };
        }

        if (updatedLockout.isLocked) {
          return {
            success: false,
            error: `رمز الـ PIN غير صحيح. تم تجميد الإدخال مؤقتاً لمدة ${updatedLockout.cooldownRemainingSeconds} ثانية.`,
            cooldownRemainingSeconds: updatedLockout.cooldownRemainingSeconds,
          };
        }

        return {
          success: false,
          error: `رمز الـ PIN غير صحيح. (المحاولات المتبقية: ${remaining})`,
          remainingAttempts: remaining,
        };
      }

      // PIN Correct! Reset lockout counter
      this.resetPinAttempts(targetAccount.id);

      // Update last active account and login timestamp
      await db.auth_accounts.update(targetAccount.id, {
        lastLoginAt: new Date().toISOString(),
      });
      this.setLastActiveAccountId(targetAccount.id);

      // Ensure active profile exists and user_state points to it
      const profileId = `profile_${targetAccount.id}`;
      const existingProfile = await db.profiles.get(profileId);
      if (!existingProfile) {
        await db.profiles.put({
          id: profileId,
          name: targetAccount.displayName,
          email: targetAccount.email || '',
          roleTemplate: 'software_engineer',
          isDefault: Boolean(targetAccount.isOwner),
          createdAt: targetAccount.createdAt,
          avatarEmoji: '⚡',
        });
      }
      const userState = await db.user_state.get('current_user');
      if (userState && userState.activeProfileId !== profileId) {
        await db.user_state.update('current_user', { activeProfileId: profileId });
      }

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(EXPLICIT_LOCKED_KEY);
      }

      this.createSession(targetAccount, rememberMe);
      return { success: true, account: targetAccount };
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
    } catch {}
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
      isOwner: Boolean(account.isOwner),
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
    } catch {}
  }

  /**
   * Check if current session is authenticated and not expired
   */
  public isAuthenticated(): boolean {
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
    } catch {}

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
    } catch {}
  }

  /**
   * Auto-lock detection
   */
  public recordActivity() {
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    } catch {}
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
    } catch {}
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
   * Retrieve current authenticated user account
   */
  public async getCurrentAccount(): Promise<AuthAccount | null> {
    const session = this.getSession();
    if (!session) return null;
    return (await db.auth_accounts.get(session.userId)) || null;
  }

  /**
   * Set or update numeric PIN (4-6 digits)
   */
  public async setPin(pin: string): Promise<{ success: boolean; error?: string }> {
    const session = this.getSession();
    if (!session) return { success: false, error: 'غير مسجل دخول' };

    try {
      const account = await db.auth_accounts.get(session.userId);
      if (!account) return { success: false, error: 'الحساب غير موجود' };

      const cleanPin = pin.trim();
      if (cleanPin.length < 4 || cleanPin.length > 6) {
        return { success: false, error: 'رمز الـ PIN يجب أن يتكون من 4 إلى 6 أرقام' };
      }

      const pinHash = await this.hashSecret(cleanPin, account.salt);
      await db.auth_accounts.update(account.id, { pinHash });

      // Sync with server in background if available
      if (typeof window !== 'undefined') {
        fetch('/api/auth/update-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: account.id, pinHash }),
        }).catch(() => {});
      }

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

      // Sync with server in background if available
      if (typeof window !== 'undefined') {
        fetch('/api/auth/update-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.userId, removePin: true }),
        }).catch(() => {});
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل إزالة رمز PIN' };
    }
  }

  /**
   * Update Account Profile (Display Name, Username, Email)
   */
  public async updateAccountProfile(
    displayName: string,
    username?: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> {
    const session = this.getSession();
    if (!session) return { success: false, error: 'غير مسجل دخول' };

    try {
      const cleanName = displayName.trim();
      const cleanUser = username?.trim().toLowerCase();
      const cleanEmail = email?.trim().toLowerCase();

      if (!cleanName) {
        return { success: false, error: 'الاسم لا يمكن أن يكون فارغاً' };
      }

      // Check username collision if changing username
      if (cleanUser && cleanUser !== session.username.toLowerCase()) {
        const all = await db.auth_accounts.toArray();
        const exists = all.find((a) => a.id !== session.userId && a.username.toLowerCase() === cleanUser);
        if (exists) {
          return { success: false, error: 'اسم المستخدم هذا محجوز لحساب آخر' };
        }
      }

      const updates: Partial<AuthAccount> = { displayName: cleanName };
      if (cleanUser) updates.username = cleanUser;
      if (cleanEmail !== undefined) updates.email = cleanEmail;

      await db.auth_accounts.update(session.userId, updates);

      // Update matching user profile in db.profiles
      const profileId = `profile_${session.userId}`;
      const existingProfile = await db.profiles.get(profileId);
      if (existingProfile) {
        await db.profiles.update(profileId, { name: cleanName, email: cleanEmail || existingProfile.email });
      } else {
        const firstProfile = await db.profiles.toCollection().first();
        if (firstProfile) {
          await db.profiles.update(firstProfile.id, { name: cleanName, email: cleanEmail || firstProfile.email });
        }
      }

      // Update session in memory and storage
      if (this.cachedSession) {
        this.cachedSession.displayName = cleanName;
        if (cleanUser) this.cachedSession.username = cleanUser;
        if (cleanEmail !== undefined) this.cachedSession.email = cleanEmail;

        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.cachedSession));
          if (this.cachedSession.rememberMe) {
            localStorage.setItem(PERSISTENT_STORAGE_KEY, JSON.stringify(this.cachedSession));
          }
        } catch {}
      }

      // Sync with server if online
      if (typeof window !== 'undefined') {
        fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: session.userId,
            userId: session.userId,
            displayName: cleanName,
            username: cleanUser || session.username,
            email: cleanEmail,
          }),
        }).catch(() => {});
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشل تحديث البيانات' };
    }
  }

  /**
   * Synchronize onboarding wizard completion to the central server
   */
  public async syncOnboardingCompleted(accountId: string, completed = true): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          userId: accountId,
          onboardingCompleted: completed,
        }),
      });
    } catch {}
  }
}

export const authService = new AuthService();
