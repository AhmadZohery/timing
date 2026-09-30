import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import webpush from 'web-push';
import {
  initPostgres,
  isPgConnected,
  pgCreateUser,
  pgFindUserByIdentifier,
  pgFindUserById,
  pgListUsers,
  pgUpdateUserLogin,
  pgCountUsers,
  pgSaveUserSyncData,
  pgGetUserSyncData,
  pgSavePushSubscription,
  pgGetAllPushSubscriptions,
  pgDeletePushSubscription,
  pgSaveScheduledAlarm,
  pgGetPendingAlarms,
  pgMarkAlarmSent,
  pgCancelScheduledAlarm,
  pgClearProfileUnsentAlarms,
  pgUpdateUserPin,
  pgUpdateUserProfile,
} from './postgres.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize PostgreSQL Schema on boot (Non-blocking self-healing)
initPostgres().catch((err) => console.error('[PostgreSQL Auto-Boot]', err.message));

const PORT = parseInt(process.env.PORT || '80', 10);
const DIST_DIR = path.resolve(__dirname, '../dist');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.resolve(__dirname, '../data'));
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

// ----------------------------------------------------------------------------
// 1. Web Push Notifications Setup (VAPID)
// ----------------------------------------------------------------------------
const VAPID_FILE = path.resolve(DATA_DIR, 'vapid_keys.json');
let vapidKeys = null;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
  };
} else if (fs.existsSync(VAPID_FILE)) {
  try {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
  } catch (_) {}
}

if (!vapidKeys || !vapidKeys.publicKey || !vapidKeys.privateKey) {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), 'utf-8');
  console.log('🔑 [Web Push] Generated fresh VAPID keypair in data/vapid_keys.json');
}

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@midmar.app';
try {
  webpush.setVapidDetails(VAPID_SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey);
} catch (e) {
  console.warn('[Web Push] VAPID details setup warning:', e.message);
}

// Push Subscriptions & Alarms Store
const SUBSCRIPTIONS_FILE = path.resolve(DATA_DIR, 'push_subscriptions.json');
const SCHEDULED_ALARMS_FILE = path.resolve(DATA_DIR, 'scheduled_alarms.json');

function getSubscriptions() {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8'));
    }
  } catch (_) {}
  return {};
}

function saveSubscriptions(subs) {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  } catch (_) {}
}

function getScheduledAlarms() {
  try {
    if (fs.existsSync(SCHEDULED_ALARMS_FILE)) {
      return JSON.parse(fs.readFileSync(SCHEDULED_ALARMS_FILE, 'utf-8'));
    }
  } catch (_) {}
  return [];
}

function saveScheduledAlarms(alarms) {
  try {
    fs.writeFileSync(SCHEDULED_ALARMS_FILE, JSON.stringify(alarms, null, 2), 'utf-8');
  } catch (_) {}
}

// Autonomous Background Push Dispatcher (Runs every 15s to deliver alarms even if app is closed)
setInterval(async () => {
  const now = Date.now();
  let alarms = [];
  let subsMap = {};

  if (isPgConnected()) {
    try {
      alarms = await pgGetPendingAlarms(now);
      subsMap = await pgGetAllPushSubscriptions();
    } catch (e) {
      console.warn('[PostgreSQL Dispatcher Read Error]', e.message);
    }
  }

  // If not using PG or PG returned no pending alarms, fallback to disk store
  const diskAlarms = getScheduledAlarms();
  const diskSubs = getSubscriptions();
  if (!isPgConnected() || alarms.length === 0) {
    alarms = diskAlarms.filter((a) => !a.sent && now >= a.timestampMs && now - a.timestampMs <= 60 * 60 * 1000);
    subsMap = isPgConnected() && Object.keys(subsMap).length > 0 ? subsMap : diskSubs;
  }

  if (!alarms || alarms.length === 0) return;

  let changedDisk = false;

  for (const alarm of alarms) {
    const userSubs = subsMap[alarm.profileId] || subsMap['default'] || [];
    const payload = JSON.stringify({
      title: alarm.title,
      body: alarm.body,
      tag: alarm.tag,
      url: alarm.url || '/',
      icon: '/favicon.svg',
    });

    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(sub, payload);
        console.log(`📡 [Push Dispatched] Sent: "${alarm.title}" to ${sub.endpoint.slice(0, 30)}...`);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired: cleanup
          if (isPgConnected()) {
            await pgDeletePushSubscription(sub.endpoint).catch(() => {});
          }
          subsMap[alarm.profileId] = userSubs.filter((s) => s.endpoint !== sub.endpoint);
          saveSubscriptions(subsMap);
        } else {
          console.warn('[Push Send Error]', err.message);
        }
      }
    }

    if (isPgConnected()) {
      await pgMarkAlarmSent(alarm.id).catch(() => {});
    }

    const diskItem = diskAlarms.find((a) => a.id === alarm.id);
    if (diskItem) {
      diskItem.sent = true;
      diskItem.sentAt = new Date().toISOString();
      changedDisk = true;
    }
  }

  if (changedDisk) {
    saveScheduledAlarms(diskAlarms);
  }

  // Purge disk alarms older than 24 hours
  const filteredAlarms = diskAlarms.filter((a) => !a.sent || now - a.timestampMs < 24 * 60 * 60 * 1000);
  if (filteredAlarms.length !== diskAlarms.length) {
    saveScheduledAlarms(filteredAlarms);
  }
}, 15000);

// ----------------------------------------------------------------------------
// 2. In-Memory Token-Saving LRU Cache for AI Proxy
// ----------------------------------------------------------------------------
const aiResponseCache = new Map();
const MAX_CACHE_ENTRIES = 200;

function setAiCache(key, value) {
  if (aiResponseCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = aiResponseCache.keys().next().value;
    aiResponseCache.delete(firstKey);
  }
  aiResponseCache.set(key, value);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

// Helper to read incoming JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 20 * 1024 * 1024) {
        // 20MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(json);
}

// ----------------------------------------------------------------------------
// Authentication & Security Guards for Protected Endpoints
// ----------------------------------------------------------------------------
const SERVER_API_SECRET = (process.env.SERVER_API_SECRET || process.env.MIDMAR_AUTH_SECRET || '').trim();

// Sliding window IP rate limiter
const rateLimitMap = new Map();
function checkRateLimit(ip, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
  } else {
    entry.count++;
  }
  rateLimitMap.set(ip, entry);
  return entry.count <= limit;
}

// Memory leak safeguard: periodic cleanup of expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);

export function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function verifyRequestAuth(req) {
  if (SERVER_API_SECRET) {
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) {
      return { authorized: false, status: 401, error: 'Unauthorized: Missing Bearer token' };
    }
    const token = authHeader.slice(7).trim();
    if (!constantTimeCompare(token, SERVER_API_SECRET)) {
      return { authorized: false, status: 403, error: 'Forbidden: Invalid authorization token' };
    }
    return { authorized: true };
  }
  return { authorized: true };
}

// Native Node HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // --------------------------------------------------------------------------
  // API Routes
  // --------------------------------------------------------------------------

  // 1. Health & Status
  if (pathname === '/api/status' && req.method === 'GET') {
    const deepseekKey = process.env.DEEPSEEK_API_KEY ? 'configured' : 'missing';
    const geminiKey = process.env.GEMINI_API_KEY ? 'configured' : 'missing';
    const subs = isPgConnected() ? await pgGetAllPushSubscriptions() : getSubscriptions();
    const totalSubs = Object.values(subs).reduce((acc, arr) => acc + (arr?.length || 0), 0);
    const usersCount = isPgConnected() ? await pgCountUsers() : (fs.existsSync(path.resolve(DATA_DIR, 'users.json')) ? 1 : 0);

    return sendJson(res, 200, {
      ok: true,
      status: 'online',
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        engine: isPgConnected() ? 'PostgreSQL' : 'FileStorage (Local)',
        connected: isPgConnected(),
        usersCount,
      },
      storage: {
        dataDir: DATA_DIR,
        backupsCount: fs.existsSync(BACKUPS_DIR) ? fs.readdirSync(BACKUPS_DIR).length : 0,
      },
      pushNotifications: {
        vapidConfigured: Boolean(vapidKeys?.publicKey),
        registeredDevicesCount: totalSubs,
        activeScheduledAlarms: getScheduledAlarms().filter((a) => !a.sent).length,
      },
      aiConfigured: Boolean(process.env.DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY),
      aiProviders: { deepseek: deepseekKey, gemini: geminiKey },
      cachedAiQueriesCount: aiResponseCache.size,
    });
  }

  // --------------------------------------------------------------------------
  // Centralized Authentication API (PostgreSQL / Local File Fallback)
  // --------------------------------------------------------------------------

  // 1.1 Register New User
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const { id, username, email, displayName, passwordHash, salt, pinHash, role } = payload;

      if (!username || !passwordHash || !salt) {
        return sendJson(res, 400, { ok: false, error: 'بيانات التسجيل غير مكتملة' });
      }

      if (isPgConnected()) {
        const existing = await pgFindUserByIdentifier(username);
        if (existing) {
          return sendJson(res, 409, { ok: false, error: 'اسم المستخدم مسجل مسبقاً في قاعدة البيانات' });
        }
        if (email) {
          const existingEmail = await pgFindUserByIdentifier(email);
          if (existingEmail) {
            return sendJson(res, 409, { ok: false, error: 'البريد الإلكتروني مسجل مسبقاً' });
          }
        }
        const user = await pgCreateUser({
          id: id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          username,
          email: email || `${username.toLowerCase()}@local.app`,
          displayName: displayName || username,
          passwordHash,
          salt,
          pinHash: pinHash || null,
          role: role || 'user',
        });
        return sendJson(res, 201, { ok: true, user, storage: 'postgresql' });
      } else {
        const usersFile = path.resolve(DATA_DIR, 'users.json');
        let users = [];
        if (fs.existsSync(usersFile)) {
          try { users = JSON.parse(fs.readFileSync(usersFile, 'utf-8')); } catch (_) {}
        }
        if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
          return sendJson(res, 409, { ok: false, error: 'اسم المستخدم مسجل مسبقاً' });
        }
        const user = {
          id: id || `user_${Date.now()}`,
          username,
          email: email || `${username.toLowerCase()}@local.app`,
          displayName: displayName || username,
          passwordHash,
          salt,
          pinHash: pinHash || null,
          role: role || 'user',
          createdAt: new Date().toISOString(),
        };
        users.push(user);
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8');
        return sendJson(res, 201, { ok: true, user, storage: 'file' });
      }
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 1.2 Login with Username/Email & Password
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const clientIp = req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(`login_${clientIp}`, 10, 60000)) {
      return sendJson(res, 429, { ok: false, error: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول، يرجى الانتظار دقيقة' });
    }
    try {
      const payload = await parseJsonBody(req);
      const { usernameOrEmail, passwordHash, requestSaltOnly } = payload;
      if (!usernameOrEmail) {
        return sendJson(res, 400, { ok: false, error: 'يرجى إدخال اسم المستخدم أو البريد' });
      }

      let user = null;
      if (isPgConnected()) {
        user = await pgFindUserByIdentifier(usernameOrEmail);
      } else {
        const usersFile = path.resolve(DATA_DIR, 'users.json');
        if (fs.existsSync(usersFile)) {
          try {
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
            user = users.find((u) => u.username.toLowerCase() === usernameOrEmail.toLowerCase() || u.email?.toLowerCase() === usernameOrEmail.toLowerCase());
          } catch (_) {}
        }
      }

      if (!user) {
        return sendJson(res, 404, { ok: false, error: 'الحساب غير موجود' });
      }

      if (requestSaltOnly) {
        return sendJson(res, 200, { ok: true, salt: user.salt });
      }

      if (!passwordHash || typeof passwordHash !== 'string' || !passwordHash.trim()) {
        return sendJson(res, 400, { ok: false, error: 'كلمة المرور مطلوبة' });
      }

      if (!constantTimeCompare(user.passwordHash, passwordHash)) {
        return sendJson(res, 401, { ok: false, error: 'كلمة المرور غير صحيحة' });
      }

      if (isPgConnected()) {
        await pgUpdateUserLogin(user.id);
      }

      const { passwordHash: _, ...safeUser } = user;
      return sendJson(res, 200, { ok: true, user: safeUser, storage: isPgConnected() ? 'postgresql' : 'file' });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 1.3 Verify PIN for Scoped Account
  if (pathname === '/api/auth/verify-pin' && req.method === 'POST') {
    const clientIp = req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(`pin_${clientIp}`, 10, 60000)) {
      return sendJson(res, 429, { ok: false, error: 'تم تجاوز الحد الأقصى لمحاولات إدخال الـ PIN، يرجى الانتظار دقيقة' });
    }
    try {
      const payload = await parseJsonBody(req);
      const { accountIdOrUsername, pinHash } = payload;
      if (!accountIdOrUsername || !pinHash) {
        return sendJson(res, 400, { ok: false, error: 'بيانات التحقق من الـ PIN ناقصة' });
      }

      let user = null;
      if (isPgConnected()) {
        user = (await pgFindUserById(accountIdOrUsername)) || (await pgFindUserByIdentifier(accountIdOrUsername));
      } else {
        const usersFile = path.resolve(DATA_DIR, 'users.json');
        if (fs.existsSync(usersFile)) {
          try {
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
            user = users.find((u) => u.id === accountIdOrUsername || u.username.toLowerCase() === accountIdOrUsername.toLowerCase());
          } catch (_) {}
        }
      }

      if (!user) {
        return sendJson(res, 404, { ok: false, error: 'الحساب غير موجود' });
      }

      if (!user.pinHash) {
        return sendJson(res, 400, { ok: false, error: 'لم يتم تفعيل رمز الـ PIN لهذا الحساب' });
      }

      if (!constantTimeCompare(user.pinHash, pinHash)) {
        return sendJson(res, 401, { ok: false, error: 'رمز الـ PIN غير صحيح' });
      }

      if (isPgConnected()) {
        await pgUpdateUserLogin(user.id);
      }

      const { passwordHash: _, ...safeUser } = user;
      return sendJson(res, 200, { ok: true, user: safeUser, storage: isPgConnected() ? 'postgresql' : 'file' });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 1.4 List All Registered Users on Server (For Device Switcher / Multi-Account)
  if (pathname === '/api/auth/users' && req.method === 'GET') {
    try {
      if (isPgConnected()) {
        const users = await pgListUsers();
        return sendJson(res, 200, { ok: true, users, source: 'postgresql' });
      } else {
        const usersFile = path.resolve(DATA_DIR, 'users.json');
        let users = [];
        if (fs.existsSync(usersFile)) {
          try {
            users = JSON.parse(fs.readFileSync(usersFile, 'utf-8')).map((u) => ({
              id: u.id,
              username: u.username,
              displayName: u.displayName,
              role: u.role,
              hasPin: Boolean(u.pinHash),
              lastLoginAt: u.lastLoginAt,
            }));
          } catch (_) {}
        }
        return sendJson(res, 200, { ok: true, users, source: 'file' });
      }
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 1.5 Update PIN for an Account
  if (pathname === '/api/auth/update-pin' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const { accountId, pinHash } = payload;
      if (!accountId) {
        return sendJson(res, 400, { ok: false, error: 'معرف الحساب مطلوب' });
      }

      if (isPgConnected()) {
        await pgUpdateUserPin(accountId, pinHash || null);
      } else {
        const usersFile = path.resolve(DATA_DIR, 'users.json');
        if (fs.existsSync(usersFile)) {
          try {
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
            const user = users.find((u) => u.id === accountId);
            if (user) {
              user.pinHash = pinHash || null;
              fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8');
            }
          } catch (_) {}
        }
      }
      return sendJson(res, 200, { ok: true, message: 'تم تحديث رمز PIN بنجاح على السيرفر' });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 1.6 Update User Profile (DisplayName, Username, Email)
  if (pathname === '/api/auth/update-profile' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const { accountId, displayName, username, email } = payload;
      if (!accountId || !username) {
        return sendJson(res, 400, { ok: false, error: 'البيانات غير مكتملة' });
      }

      if (isPgConnected()) {
        await pgUpdateUserProfile(accountId, displayName || username, username, email || '');
      } else {
        const usersFile = path.resolve(DATA_DIR, 'users.json');
        if (fs.existsSync(usersFile)) {
          try {
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
            const user = users.find((u) => u.id === accountId);
            if (user) {
              user.displayName = displayName || username;
              user.username = username.toLowerCase().trim();
              if (email) user.email = email.toLowerCase().trim();
              fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8');
            }
          } catch (_) {}
        }
      }
      return sendJson(res, 200, { ok: true, message: 'تم تحديث الملف الشخصي بنجاح' });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 2. Web Push: Get VAPID Public Key
  if (pathname === '/api/push/vapid-public-key' && req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      publicKey: vapidKeys.publicKey,
    });
  }

  // 3. Web Push: Register Client Device Subscription
  if (pathname === '/api/push/subscribe' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profileId = payload.profileId || 'default';
      const subscription = payload.subscription;

      if (!subscription || !subscription.endpoint) {
        return sendJson(res, 400, { ok: false, error: 'Valid subscription required' });
      }

      if (isPgConnected()) {
        try {
          await pgSavePushSubscription(profileId, subscription);
        } catch (dbErr) {
          console.warn('[PostgreSQL Push Sub Save Error]:', dbErr.message);
        }
      }

      const subsMap = getSubscriptions();
      const list = subsMap[profileId] || [];
      // Deduplicate by endpoint
      const exists = list.some((s) => s.endpoint === subscription.endpoint);
      if (!exists) {
        list.push(subscription);
        subsMap[profileId] = list;
        saveSubscriptions(subsMap);
        console.log(`📱 [Push Registered] Device subscribed for profile "${profileId}"`);
      }

      return sendJson(res, 200, {
        ok: true,
        message: 'تم تفعيل استقبال إشعارات السيرفر لهذا الجهاز بنجاح',
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 4. Web Push: Schedule Alarms Queue from Client
  if (pathname === '/api/push/schedule' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profileId = payload.profileId || 'default';
      const incomingAlarms = Array.isArray(payload.alarms) ? payload.alarms : [];

      if (isPgConnected()) {
        try {
          await pgClearProfileUnsentAlarms(profileId);
        } catch (dbErr) {
          console.warn('[PostgreSQL Clear Alarms Error]:', dbErr.message);
        }
      }

      const currentAlarms = getScheduledAlarms();
      // Remove unsent alarms for this profile and re-schedule new ones
      const now = Date.now();
      const kept = currentAlarms.filter((a) => a.profileId !== profileId || (a.sent && now - a.timestampMs < 24 * 60 * 60 * 1000));

      for (const a of incomingAlarms) {
        if (a.timestampMs > now) {
          const alarmObj = {
            id: a.id,
            profileId,
            title: a.title,
            body: a.body,
            timestampMs: a.timestampMs,
            tag: a.tag,
            url: a.url || '/',
            sent: false,
            scheduledAt: new Date().toISOString(),
          };
          kept.push(alarmObj);

          if (isPgConnected()) {
            try {
              await pgSaveScheduledAlarm(alarmObj);
            } catch (dbErr) {
              console.warn('[PostgreSQL Scheduled Alarm Save Error]:', dbErr.message);
            }
          }
        }
      }

      saveScheduledAlarms(kept);
      return sendJson(res, 200, {
        ok: true,
        message: `تمت جدولة ${incomingAlarms.length} تنبيهاً على خادم الدفع السحابي`,
        activeAlarmsCount: kept.filter((a) => !a.sent).length,
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 5. Web Push: Cancel Alarm
  if (pathname === '/api/push/cancel' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const tag = payload.tag;
      const profileId = payload.profileId;

      if (!tag) return sendJson(res, 400, { ok: false, error: 'Tag required' });

      if (isPgConnected()) {
        try {
          await pgCancelScheduledAlarm(profileId, tag);
        } catch (dbErr) {
          console.warn('[PostgreSQL Cancel Alarm Error]:', dbErr.message);
        }
      }

      const currentAlarms = getScheduledAlarms();
      const filtered = currentAlarms.filter((a) => {
        if (profileId && a.profileId !== profileId) return true;
        return a.tag !== tag;
      });

      saveScheduledAlarms(filtered);
      return sendJson(res, 200, { ok: true, message: 'Alarm cancelled from server schedule' });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 6. Web Push: Send Test Lockscreen Notification (Delay 5-10s)
  if (pathname === '/api/push/test' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profileId = payload.profileId || 'default';
      const delaySeconds = Math.max(1, payload.delaySeconds || 5);
      const subsMap = getSubscriptions();
      const userSubs = subsMap[profileId] || subsMap['default'] || [];

      if (userSubs.length === 0) {
        return sendJson(res, 400, {
          ok: false,
          error: 'لا يوجد جهاز مشترك في الإشعارات لهذا الحساب. يرجى تفعيل الإشعارات في التطبيق أولاً.',
        });
      }

      setTimeout(async () => {
        const testPayload = JSON.stringify({
          title: '🔔 تجربة تنبيه قفل الشاشة (مِضمار عبر السيرفر)',
          body: 'ما شاء الله! وصلك التنبيه مباشرة من السيرفر وشاشة هاتفك مقفلة والتطبيق مغلق.',
          tag: 'server-lockscreen-test',
          url: '/',
          icon: '/favicon.svg',
        });

        for (const sub of userSubs) {
          try {
            await webpush.sendNotification(sub, testPayload);
          } catch (e) {
            console.warn('[Test Push Error]', e.message);
          }
        }
      }, delaySeconds * 1000);

      return sendJson(res, 200, {
        ok: true,
        message: `تم إطلاق أمر التنبيه! اقفل شاشة هاتفك الآن وانتظر ${delaySeconds} ثوانٍ.`,
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 7. Sync Push: Save client state to PostgreSQL / disk
  if (pathname === '/api/sync/push' && req.method === 'POST') {
    const auth = verifyRequestAuth(req);
    if (!auth.authorized) {
      return sendJson(res, auth.status, { ok: false, error: auth.error });
    }
    try {
      const payload = await parseJsonBody(req);
      const profileId = payload.profileId || payload.userId || 'default';
      const cleanProfileId = profileId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const clientTimestamp = payload.timestamp || Date.now();

      let pgSaved = false;
      if (isPgConnected()) {
        try {
          await pgSaveUserSyncData(cleanProfileId, payload.data || {}, clientTimestamp);
          pgSaved = true;
        } catch (dbErr) {
          console.warn('[PostgreSQL Sync Save Error]:', dbErr.message);
        }
      }

      // Keep disk file as secondary safeguard
      const targetFile = path.resolve(DATA_DIR, `sync_${cleanProfileId}.json`);
      const record = {
        profileId: cleanProfileId,
        syncedAt: new Date().toISOString(),
        clientTimestamp,
        data: payload.data || {},
        storage: pgSaved ? 'postgresql' : 'file',
      };

      fs.writeFileSync(targetFile, JSON.stringify(record, null, 2), 'utf-8');
      return sendJson(res, 200, {
        ok: true,
        message: pgSaved
          ? 'تم حفظ ومزامنة البيانات بنجاح في قاعدة بيانات بوستجري المركزية'
          : 'تمت مزامنة البيانات وحفظها على السيرفر بنجاح',
        syncedAt: record.syncedAt,
        storage: record.storage,
        sizeBytes: Buffer.byteLength(JSON.stringify(record)),
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 8. Sync Pull: Retrieve saved state from PostgreSQL / disk
  if (pathname === '/api/sync/pull' && req.method === 'GET') {
    const auth = verifyRequestAuth(req);
    if (!auth.authorized) {
      return sendJson(res, auth.status, { ok: false, error: auth.error });
    }
    try {
      const profileId = url.searchParams.get('profileId') || url.searchParams.get('userId') || 'default';
      const cleanProfileId = profileId.replace(/[^a-zA-Z0-9_-]/g, '_');

      // 1. Try PostgreSQL first
      if (isPgConnected()) {
        try {
          const pgRecord = await pgGetUserSyncData(cleanProfileId);
          if (pgRecord) {
            return sendJson(res, 200, {
              ok: true,
              profileId: cleanProfileId,
              data: pgRecord.data,
              syncedAt: pgRecord.syncedAt,
              clientTimestamp: pgRecord.clientTimestamp,
              version: pgRecord.version,
              storage: 'postgresql',
            });
          }
        } catch (dbErr) {
          console.warn('[PostgreSQL Sync Pull Error]:', dbErr.message);
        }
      }

      // 2. Fallback to local disk file
      const targetFile = path.resolve(DATA_DIR, `sync_${cleanProfileId}.json`);
      if (!fs.existsSync(targetFile)) {
        return sendJson(res, 404, { ok: false, message: 'لا توجد بيانات محفوظة لهذا الحساب على السيرفر بعد' });
      }

      const raw = fs.readFileSync(targetFile, 'utf-8');
      const record = JSON.parse(raw);
      return sendJson(res, 200, { ok: true, ...record, storage: 'file' });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 9. Create Timestamped Backup Snapshot
  if (pathname === '/api/sync/backup' && req.method === 'POST') {
    const auth = verifyRequestAuth(req);
    if (!auth.authorized) {
      return sendJson(res, auth.status, { ok: false, error: auth.error });
    }
    try {
      const payload = await parseJsonBody(req);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `midmar_backup_${timestamp}.json`;
      const targetFile = path.resolve(BACKUPS_DIR, filename);

      fs.writeFileSync(targetFile, JSON.stringify(payload, null, 2), 'utf-8');
      return sendJson(res, 200, {
        ok: true,
        filename,
        timestamp,
        message: 'تم حفظ نسخة احتياطية مشفرة على قرص السيرفر',
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 10. List Stored Backups
  if (pathname === '/api/sync/backups' && req.method === 'GET') {
    const auth = verifyRequestAuth(req);
    if (!auth.authorized) {
      return sendJson(res, auth.status, { ok: false, error: auth.error });
    }
    try {
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => {
          const stat = fs.statSync(path.resolve(BACKUPS_DIR, f));
          return {
            filename: f,
            sizeBytes: stat.size,
            createdAt: stat.mtime.toISOString(),
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return sendJson(res, 200, { ok: true, backups: files });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 10.1 Retrieve / Restore Stored Backup (Path Traversal Protected)
  if (pathname.startsWith('/api/sync/backup/') && req.method === 'GET') {
    const auth = verifyRequestAuth(req);
    if (!auth.authorized) {
      return sendJson(res, auth.status, { ok: false, error: auth.error });
    }
    try {
      const rawFilename = pathname.slice('/api/sync/backup/'.length);
      const safeFilename = path.basename(decodeURIComponent(rawFilename));
      if (!safeFilename.endsWith('.json')) {
        return sendJson(res, 400, { ok: false, error: 'نوع الملف غير صالح' });
      }
      const targetFile = path.resolve(BACKUPS_DIR, safeFilename);
      if (!fs.existsSync(targetFile)) {
        return sendJson(res, 404, { ok: false, error: 'ملف النسخة الاحتياطية غير موجود' });
      }
      const content = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
      return sendJson(res, 200, { ok: true, filename: safeFilename, data: content });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 10.2 Lightweight Last-Write-Wins (LWW) Delta Sync (OPP-0101 / RFC-0001)
  if (pathname === '/api/sync/delta' && req.method === 'POST') {
    const auth = verifyRequestAuth(req);
    if (!auth.authorized) {
      return sendJson(res, auth.status, { ok: false, error: auth.error });
    }
    try {
      const payload = await parseJsonBody(req);
      const { clientDeviceId = 'unknown_client', userId = 'default_user', lastSyncTimestamp = 0, changes = {} } = payload;
      const deltaFile = path.resolve(DATA_DIR, `delta_${userId}.json`);

      let deltaStore = {};
      if (fs.existsSync(deltaFile)) {
        try {
          deltaStore = JSON.parse(fs.readFileSync(deltaFile, 'utf-8'));
        } catch (_) {
          deltaStore = {};
        }
      }

      const now = Date.now();
      const serverChanges = {};

      // 1. Process and merge incoming changes (Last-Write-Wins based on updatedAt)
      for (const [collection, items] of Object.entries(changes)) {
        if (!Array.isArray(items)) continue;
        if (!deltaStore[collection]) deltaStore[collection] = {};

        for (const item of items) {
          if (!item || !item.id) continue;
          const existing = deltaStore[collection][item.id];
          const incomingUpdated = Number(item.updatedAt) || now;

          if (!existing || incomingUpdated >= (Number(existing.updatedAt) || 0)) {
            deltaStore[collection][item.id] = {
              ...item,
              updatedAt: incomingUpdated,
              clientDeviceId,
            };
          }
        }
      }

      // 2. Identify updates on the server since lastSyncTimestamp that did not originate from this client
      for (const [collection, itemsMap] of Object.entries(deltaStore)) {
        const newerItems = Object.values(itemsMap).filter((item) => {
          const itemUpdated = Number(item.updatedAt) || 0;
          return itemUpdated > lastSyncTimestamp && item.clientDeviceId !== clientDeviceId;
        });

        if (newerItems.length > 0) {
          serverChanges[collection] = newerItems;
        }
      }

      fs.writeFileSync(deltaFile, JSON.stringify(deltaStore, null, 2), 'utf-8');

      return sendJson(res, 200, {
        ok: true,
        serverSyncTimestamp: now,
        serverChanges,
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 11. Token-Saving AI Proxy (with server-side LRU Cache & prompt compression)
  if (pathname === '/api/ai/proxy' && req.method === 'POST') {
    const clientIp = req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp, 30, 60000)) {
      return sendJson(res, 429, { ok: false, error: 'تم تجاوز حد الطلبات المسموح به للذكاء الاصطناعي (Rate limit exceeded)' });
    }
    const auth = verifyRequestAuth(req);
    if (!auth.authorized) {
      return sendJson(res, auth.status, { ok: false, error: auth.error });
    }
    try {
      const payload = await parseJsonBody(req);
      const userPrompt = (payload.prompt || '').trim();
      const systemPrompt = (payload.systemPrompt || '').trim();
      const maxTokens = Math.min(250, payload.maxTokens || 150); // Strict token ceiling

      if (!userPrompt) {
        return sendJson(res, 400, { ok: false, error: 'User prompt is required' });
      }

      // Check In-Memory Server LRU Cache (0 Tokens, 0ms latency)
      const cacheKey = `${systemPrompt}:::${userPrompt}`.toLowerCase();
      if (aiResponseCache.has(cacheKey)) {
        return sendJson(res, 200, {
          ok: true,
          text: aiResponseCache.get(cacheKey),
          cached: true,
          tokensConsumed: 0,
          tokensSaved: 550,
        });
      }

      // Check server environment variables for keys
      const apiKey = process.env.DEEPSEEK_API_KEY || payload.apiKey;
      const geminiKey = process.env.GEMINI_API_KEY;

      if (!apiKey && !geminiKey) {
        return sendJson(res, 400, {
          ok: false,
          error: 'No AI API key found on server or request payload',
        });
      }

      let responseText = '';

      if (process.env.DEEPSEEK_API_KEY || (apiKey && !geminiKey)) {
        // DeepSeek Call with strict token compression
        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: userPrompt },
            ],
            max_tokens: maxTokens,
            temperature: 0.2,
          }),
        });

        if (!dsRes.ok) {
          const errData = await dsRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `DeepSeek API returned HTTP ${dsRes.status}`);
        }

        const data = await dsRes.json();
        responseText = data.choices?.[0]?.message?.content || '';
      } else if (geminiKey) {
        // Gemini Call with strict token compression
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey.trim()}`;
        const gmRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: 0.2,
            },
          }),
        });

        if (!gmRes.ok) {
          const errData = await gmRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Gemini API returned HTTP ${gmRes.status}`);
        }

        const data = await gmRes.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      // Store in Server Cache
      if (responseText) {
        setAiCache(cacheKey, responseText);
      }

      return sendJson(res, 200, {
        ok: true,
        text: responseText,
        cached: false,
        tokensConsumed: Math.round(userPrompt.length / 4 + responseText.length / 4),
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // --------------------------------------------------------------------------
  // Static File Serving with Gzip & SPA Fallback
  // --------------------------------------------------------------------------
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  let filePath = path.join(DIST_DIR, pathname);
  // Security: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Check if file exists, else fallback to index.html (SPA routing)
  let stat = null;
  try {
    stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stat = fs.statSync(filePath);
    }
  } catch (_) {
    filePath = path.join(DIST_DIR, 'index.html');
    try {
      stat = fs.statSync(filePath);
    } catch (e) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404: Dist build not found. Run npm run build first.');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Cache headers
  const headers = {
    'Content-Type': contentType,
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
  };

  if (pathname.startsWith('/assets/')) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  } else {
    headers['Cache-Control'] = 'no-cache, must-revalidate';
  }

  // Check Gzip support for text/code assets
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const canGzip = /\bgzip\b/.test(acceptEncoding) && /^(text\/|application\/javascript|application\/json|image\/svg)/.test(contentType);

  if (canGzip) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, headers);
    const rawStream = fs.createReadStream(filePath);
    const gzip = zlib.createGzip({ level: 6 });
    rawStream.pipe(gzip).pipe(res);
  } else {
    headers['Content-Length'] = stat.size;
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Midmar Server] Running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Static files: ${DIST_DIR}`);
  console.log(`💾 Persistent data: ${DATA_DIR}`);
});
