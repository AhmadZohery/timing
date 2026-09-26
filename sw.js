// Service Worker for 100% Offline Caching, Autonomous Alarms & Background Notifications
const CACHE_NAME = 'midmar-lifeos-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons.svg',
];

// Open native IndexedDB inside Service Worker for background alarm storage
function openAlarmsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('midmar_sw_alarms_db', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('alarms')) {
        db.createObjectStore('alarms', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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
  } catch (_) {}
}

// Check and trigger any alarms whose time has arrived
async function checkDueAlarms() {
  const alarms = await getAlarmsFromDB();
  const now = Date.now();

  for (const alarm of alarms) {
    // If alarm is due (within past 45 mins window and not future)
    if (now >= alarm.timestampMs && now - alarm.timestampMs <= 45 * 60 * 1000) {
      try {
        await self.registration.showNotification(alarm.title, {
          body: alarm.body,
          icon: alarm.icon || '/favicon.svg',
          badge: '/favicon.svg',
          tag: alarm.tag,
          renotify: true,
          requireInteraction: true,
          vibrate: [500, 200, 500, 200, 500],
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
    } else if (now - alarm.timestampMs > 45 * 60 * 1000) {
      // Expired alarm older than 45 mins: purge
      await removeAlarmFromDB(alarm.id);
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache first, then network fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
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

        // If Notification Triggers API is supported by the browser/Android OS
        if ('showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined') {
          for (const alarm of data.alarms) {
            if (alarm.timestampMs > Date.now()) {
              try {
                await self.registration.showNotification(alarm.title, {
                  body: alarm.body,
                  icon: alarm.icon || '/favicon.svg',
                  badge: '/favicon.svg',
                  tag: alarm.tag,
                  requireInteraction: true,
                  vibrate: [500, 200, 500, 200, 500],
                  showTrigger: new TimestampTrigger(alarm.timestampMs),
                  actions: alarm.actions || [
                    { action: 'mark_done', title: 'تم بحمد الله ✔' },
                    { action: 'snooze', title: 'تذكير بعد 10 دقائق ⏰' },
                  ],
                  data: { url: alarm.url || '/', ...alarm.data },
                });
              } catch (e) {
                console.warn('[SW] TimestampTrigger registration notice:', e);
              }
            }
          }
        }
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
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              tag: 'test-lockscreen-alert',
              requireInteraction: true,
              vibrate: [500, 250, 500, 250, 500],
              showTrigger: new TimestampTrigger(targetMs),
              data: { url: '/' },
            });
            triggerRegistered = true;
          } catch (_) {}
        }

        // Fallback setTimeout inside Service Worker
        if (!triggerRegistered) {
          setTimeout(async () => {
            await self.registration.showNotification('🔔 تجربة تنبيه الشاشة المقفلة (مِضمار)', {
              body: 'ما شاء الله! التنبيهات تعمل بنجاح وشاشة هاتفك مقفلة وبأعلى أولوية.',
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              tag: 'test-lockscreen-alert',
              requireInteraction: true,
              vibrate: [500, 250, 500, 250, 500],
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
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              tag: event.notification.tag + '-snooze',
              requireInteraction: true,
              vibrate: [500, 200, 500],
              showTrigger: new TimestampTrigger(snoozeMs),
              data: notifData,
            });
            return;
          } catch (_) {}
        }
        setTimeout(async () => {
          await self.registration.showNotification(event.notification.title + ' (تذكير مؤجل)', {
            body: event.notification.body,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: event.notification.tag + '-snooze',
            requireInteraction: true,
            vibrate: [500, 200, 500],
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
        return self.clients.openWindow(targetUrl + (action ? '?action=' + action : ''));
      }
    })
  );
});
