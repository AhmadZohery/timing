// Service Worker for 100% Offline Caching, Autonomous Alarms & Background Notifications
const isLocalDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1' || self.location.port === '5173';

const CACHE_NAME = 'midmar-sanctuary-v11';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg?v=20261020',
  '/icons/midmar-royal-192.png',
  '/icons/midmar-royal-512.png',
  '/icons/midmar-royal-maskable-512.png',
  '/icons/notification-badge-96x96.png',
  '/icons/notification-badge-192x192.png',
  '/icons/midmar-apple-touch.png',
  '/icons.svg',
];

// Open native IndexedDB inside Service Worker for background alarm storage & deduplication
function openAlarmsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('midmar_sw_alarms_db', 2);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('alarms')) {
        db.createObjectStore('alarms', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('shown_tags')) {
        db.createObjectStore('shown_tags', { keyPath: 'tag' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const recentlyShownTags = new Map();
const DEDUP_WINDOW_MS = 45 * 60 * 1000; // 45 minutes cooldown per tag

async function wasTagShownRecently(tag) {
  if (!tag || String(tag).startsWith('test-')) return false;
  const now = Date.now();
  const memTs = recentlyShownTags.get(tag);
  if (memTs && now - memTs < DEDUP_WINDOW_MS) {
    return true;
  }
  try {
    // Also check if notification is already visible in the OS tray
    const activeNotifs = await self.registration.getNotifications({ tag });
    if (activeNotifs && activeNotifs.length > 0) {
      return true;
    }
  } catch {}

  try {
    const db = await openAlarmsDB();
    return await new Promise((resolve) => {
      const tx = db.transaction('shown_tags', 'readonly');
      const store = tx.objectStore('shown_tags');
      const req = store.get(tag);
      req.onsuccess = () => {
        const rec = req.result;
        if (rec && now - rec.shownAt < DEDUP_WINDOW_MS) {
          recentlyShownTags.set(tag, rec.shownAt);
          resolve(true);
        } else {
          resolve(false);
        }
      };
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

async function markTagShown(tag) {
  if (!tag) return;
  const now = Date.now();
  recentlyShownTags.set(tag, now);
  try {
    const db = await openAlarmsDB();
    const tx = db.transaction('shown_tags', 'readwrite');
    tx.objectStore('shown_tags').put({ tag, shownAt: now });
  } catch {}
}

async function showDedupedNotification(title, options = {}) {
  const tag = options.tag || 'midmar-general';
  if (await wasTagShownRecently(tag)) {
    return false;
  }
  await markTagShown(tag);
  await self.registration.showNotification(title, {
    ...options,
    tag,
    renotify: false,
    requireInteraction: false,
    vibrate: options.vibrate || [200, 100, 200],
  });
  return true;
}

async function saveAlarmsToDB(alarms) {
  try {
    const db = await openAlarmsDB();
    const tx = db.transaction('alarms', 'readwrite');
    const store = tx.objectStore('alarms');
    store.clear();
    for (const alarm of alarms) {
      store.put(alarm);
    }
  } catch (err) {
    console.warn('[SW] Could not save alarms to IndexedDB:', err);
  }
}

async function getAlarmsFromDB() {
  try {
    const db = await openAlarmsDB();
    return new Promise((resolve) => {
      const tx = db.transaction('alarms', 'readonly');
      const store = tx.objectStore('alarms');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

async function removeAlarmFromDB(alarmId) {
  try {
    const db = await openAlarmsDB();
    const tx = db.transaction('alarms', 'readwrite');
    tx.objectStore('alarms').delete(alarmId);
  } catch {}
}

const DEFAULT_ICON = new URL('/icons/midmar-royal-192.png', self.location.origin).href;
// Android status bar & notification header require a monochrome white silhouette on a 100% transparent background
const DEFAULT_BADGE = new URL('/icons/notification-badge-96x96.png', self.location.origin).href;

function getValidIcon(icon) {
  if (icon && typeof icon === 'string' && !icon.endsWith('.svg')) {
    try {
      return new URL(icon, self.location.origin).href;
    } catch {
      return icon;
    }
  }
  return DEFAULT_ICON;
}

let activeLocalTimeouts = [];

function clearLocalTimeouts() {
  for (const t of activeLocalTimeouts) {
    clearTimeout(t);
  }
  activeLocalTimeouts = [];
}

function scheduleUpcomingLocalTimeouts(alarms) {
  clearLocalTimeouts();
  const now = Date.now();
  for (const alarm of alarms) {
    const delay = alarm.timestampMs - now;
    // Set timers for anything up to 4 hours in the future while SW stays alive
    if (delay > 0 && delay <= 4 * 60 * 60 * 1000) {
      const timeoutId = setTimeout(async () => {
        try {
          await showDedupedNotification(alarm.title, {
            body: alarm.body,
            icon: getValidIcon(alarm.icon),
            badge: DEFAULT_BADGE,
            tag: alarm.tag,
            actions: alarm.actions || [
              { action: 'mark_done', title: 'تم بحمد الله ✔' },
              { action: 'snooze', title: 'تذكير بعد 10 دقائق ⏰' },
            ],
            data: { url: alarm.url || '/', ...alarm.data },
          });
          await removeAlarmFromDB(alarm.id);
        } catch (e) {
          console.warn('[SW] Timeout notification trigger notice:', e);
        }
      }, delay);
      activeLocalTimeouts.push(timeoutId);
    }
  }
}

// Check and trigger any alarms whose time has arrived
async function checkDueAlarms() {
  const alarms = await getAlarmsFromDB();
  const now = Date.now();

  for (const alarm of alarms) {
    // If alarm is due (within past 15 mins window and not future)
    if (now >= alarm.timestampMs && now - alarm.timestampMs <= 15 * 60 * 1000) {
      try {
        await showDedupedNotification(alarm.title, {
          body: alarm.body,
          icon: getValidIcon(alarm.icon),
          badge: DEFAULT_BADGE,
          tag: alarm.tag,
          actions: alarm.actions || [
            { action: 'mark_done', title: 'تم بحمد الله ✔' },
            { action: 'snooze', title: 'تذكير بعد 10 دقائق ⏰' },
          ],
          data: { url: alarm.url || '/', ...alarm.data },
        });
        await removeAlarmFromDB(alarm.id);
      } catch (e) {
        console.warn('[SW] Failed to show alarm notification:', e);
      }
    } else if (now - alarm.timestampMs > 15 * 60 * 1000) {
      // Expired alarm older than 15 mins: purge without spamming old alerts
      await removeAlarmFromDB(alarm.id);
    }
  }
}

self.addEventListener('install', (event) => {
  if (!isLocalDev) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
    );
  }
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (isLocalDev || key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Smart caching strategy:
// 1. Navigation requests (HTML) -> Network-First with cache fallback, ensuring new deployments update immediately
// 2. API requests (/api/) -> Network only (never cached by SW)
// 3. Static assets (images, icons, fonts, hashed JS/CSS) -> Cache-First with network fallback
self.addEventListener('fetch', (event) => {
  if (isLocalDev || event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never intercept localhost development, Vite HMR, or server API routes
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.port === '5173' ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/api/') ||
    url.search.includes('t=')
  ) {
    return;
  }

  const isNavigation =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  const isManifestOrIcon =
    url.pathname.endsWith('manifest.webmanifest') ||
    url.pathname.endsWith('favicon.svg') ||
    url.pathname.startsWith('/icons/');

  if (isNavigation || isManifestOrIcon) {
    // Network-First for HTML navigation, manifest, and brand icons so updates reflect immediately on mobile
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback
          const cached = await caches.match(event.request);
          if (cached) return cached;
          if (isNavigation) {
            const fallback = await caches.match('/index.html');
            return fallback || Response.error();
          }
          return Response.error();
        })
    );
    return;
  }

  // Cache-First for static assets (icons, fonts, scripts, styles)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        const cachedType = (cachedResponse.headers.get('content-type') || '').toLowerCase();
        const isJsOrCss = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
        if (!isJsOrCss || !cachedType.includes('text/html')) {
          return cachedResponse;
        }
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const respType = (networkResponse.headers.get('content-type') || '').toLowerCase();
          const isJsOrCss = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
          if (isJsOrCss && respType.includes('text/html')) {
            return new Response('Asset mismatch', { status: 404, statusText: 'Not Found' });
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(async (err) => {
          if (event.request.mode === 'navigate' || event.request.destination === 'document') {
            const cachedHtml = (await caches.match('/index.html')) || (await caches.match('/'));
            if (cachedHtml) return cachedHtml;
          }
          // Reject naturally so browser dynamic imports and fetch retries fail cleanly without SyntaxError
          throw err;
        });
    })
  );
});

// Listen for messages from client application
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SCHEDULE_ALARMS' && Array.isArray(data.alarms)) {
    event.waitUntil(
      (async () => {
        await saveAlarmsToDB(data.alarms);

        const fallbackAlarms = [];
        const hasTimestampTrigger =
          'showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined';

        if (hasTimestampTrigger) {
          for (const alarm of data.alarms) {
            if (alarm.timestampMs > Date.now()) {
              try {
                await self.registration.showNotification(alarm.title, {
                  body: alarm.body,
                  icon: getValidIcon(alarm.icon),
                  badge: DEFAULT_BADGE,
                  tag: alarm.tag,
                  renotify: false,
                  requireInteraction: false,
                  vibrate: [200, 100, 200],
                  showTrigger: new TimestampTrigger(alarm.timestampMs),
                  actions: alarm.actions || [
                    { action: 'mark_done', title: 'تم بحمد الله ✔' },
                    { action: 'snooze', title: 'تذكير بعد 10 دقائق ⏰' },
                  ],
                  data: { url: alarm.url || '/', ...alarm.data },
                });
              } catch (e) {
                fallbackAlarms.push(alarm);
              }
            }
          }
        } else {
          fallbackAlarms.push(...data.alarms);
        }

        // Only set local in-memory timeouts for alarms that weren't scheduled via OS TimestampTrigger
        scheduleUpcomingLocalTimeouts(fallbackAlarms);
      })()
    );
  }

  if (data.type === 'CLEAR_ALL_ALARMS') {
    event.waitUntil(
      (async () => {
        clearLocalTimeouts();
        await saveAlarmsToDB([]);
        try {
          const notifications = await self.registration.getNotifications();
          notifications.forEach((n) => n.close());
        } catch {}
      })()
    );
  }

  if (data.type === 'TEST_LOCKSCREEN_ALARM') {
    const delayMs = data.delayMs || 10000;
    const targetMs = Date.now() + delayMs;

    event.waitUntil(
      (async () => {
        // Attempt TimestampTrigger if available
        let triggerRegistered = false;
        if ('showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined') {
          try {
            await self.registration.showNotification('🔔 تجربة تنبيه الشاشة المقفلة (مِضمار)', {
              body: 'ما شاء الله! التنبيهات تعمل بنجاح وشاشة هاتفك مقفلة وبأعلى أولوية.',
              icon: DEFAULT_ICON,
              badge: DEFAULT_BADGE,
              tag: 'test-lockscreen-alert',
              requireInteraction: false,
              vibrate: [250, 150, 250],
              showTrigger: new TimestampTrigger(targetMs),
              data: { url: '/' },
            });
            triggerRegistered = true;
          } catch {}
        }

        // Fallback setTimeout inside Service Worker
        if (!triggerRegistered) {
          setTimeout(async () => {
            await self.registration.showNotification('🔔 تجربة تنبيه الشاشة المقفلة (مِضمار)', {
              body: 'ما شاء الله! التنبيهات تعمل بنجاح وشاشة هاتفك مقفلة وبأعلى أولوية.',
              icon: DEFAULT_ICON,
              badge: DEFAULT_BADGE,
              tag: 'test-lockscreen-alert',
              requireInteraction: false,
              vibrate: [250, 150, 250],
              data: { url: '/' },
            });
          }, delayMs);
        }
      })()
    );
  }

  if (data.type === 'CANCEL_ALARM' && data.tag) {
    event.waitUntil(
      self.registration.getNotifications({ tag: data.tag }).then((notifications) => {
        notifications.forEach((n) => n.close());
      })
    );
  }
});

// Periodic Background Sync (triggers when Android OS wakes up the Service Worker)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'midmar-alarms' || event.tag === 'midmar-periodic-alarms') {
    event.waitUntil(checkDueAlarms());
  }
});

// One-off Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'midmar-sync-alarms') {
    event.waitUntil(checkDueAlarms());
  }
});

// Actionable Notifications click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/';

  // Handle Snooze action: re-notify in 10 minutes
  if (action === 'snooze') {
    event.waitUntil(
      (async () => {
        const snoozeMs = Date.now() + 10 * 60 * 1000;
        if ('showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined') {
          try {
            await self.registration.showNotification(event.notification.title + ' (تذكير مؤجل)', {
              body: event.notification.body,
              icon: DEFAULT_ICON,
              badge: DEFAULT_BADGE,
              tag: event.notification.tag + '-snooze',
              requireInteraction: false,
              vibrate: [200, 100, 200],
              showTrigger: new TimestampTrigger(snoozeMs),
              data: notifData,
            });
            return;
          } catch {}
        }
        setTimeout(async () => {
          await self.registration.showNotification(event.notification.title + ' (تذكير مؤجل)', {
            body: event.notification.body,
            icon: DEFAULT_ICON,
            badge: DEFAULT_BADGE,
            tag: event.notification.tag + '-snooze',
            requireInteraction: false,
            vibrate: [200, 100, 200],
            data: notifData,
          });
        }, 10 * 60 * 1000);
      })()
    );
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window or open new
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_ACTION', action, data: notifData });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        const sep = targetUrl.includes('?') ? '&' : '?';
        return self.clients.openWindow(targetUrl + (action ? sep + 'action=' + action : ''));
      }
    })
  );
});

// Web Push Notifications Handler (Wakes device OS when app is closed / screen locked)
self.addEventListener('push', (event) => {
  let data = {
    title: 'مِضمار - تذكير ذكي 🔔',
    body: 'حان موعد مهمتك المجدولة في جدولك اليومي.',
  };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: getValidIcon(data.icon),
    badge: DEFAULT_BADGE,
    tag: data.tag || 'midmar-push',
    actions: [
      { action: 'mark_done', title: 'تم بحمد الله ✔' },
      { action: 'snooze', title: 'تأجيل 10 دقائق ⏰' },
    ],
    data: { url: data.url || '/' },
  };

  event.waitUntil(showDedupedNotification(data.title, options));
});
