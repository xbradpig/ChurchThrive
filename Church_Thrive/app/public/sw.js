// ChurchThrive Service Worker v1
// Handles caching, offline fallback, background sync, and push notifications.

const CACHE_NAME = 'churchthrive-v1';
const STATIC_CACHE = 'churchthrive-static-v1';
const DYNAMIC_CACHE = 'churchthrive-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
];

// File extensions considered static assets
const STATIC_EXTENSIONS = [
  '.css', '.js', '.woff2', '.woff', '.ttf', '.otf',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const allowedCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !allowedCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  // API / Supabase calls: Network-first with dynamic cache fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets: Cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages: Network-first with offline fallback
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Everything else: Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ─── Cache Strategies ───────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/offline.html');
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ─── Background Sync ────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(notifyClients('SYNC_NOTES'));
  }
  if (event.tag === 'sync-attendance') {
    event.waitUntil(notifyClients('SYNC_ATTENDANCE'));
  }
  if (event.tag === 'sync-all') {
    event.waitUntil(notifyClients('SYNC_ALL'));
  }
});

async function notifyClients(type) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => {
    client.postMessage({ type });
  });
}

// ─── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { body: event.data?.text() || '' };
  }

  const options = {
    body: data.body || '새로운 알림이 있습니다',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [],
    tag: data.tag || 'churchthrive-notification',
    renotify: Boolean(data.renotify),
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ChurchThrive', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  // Handle action button clicks
  if (event.action) {
    const action = event.notification.data?.actions?.find((a) => a.action === event.action);
    if (action?.url) {
      event.waitUntil(self.clients.openWindow(action.url));
      return;
    }
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Try to focus an existing window with the target URL
        const existing = clients.find((c) => {
          const clientUrl = new URL(c.url);
          return clientUrl.pathname === targetUrl || c.url.includes(targetUrl);
        });

        if (existing) {
          return existing.focus();
        }

        // Try to navigate an existing window
        if (clients.length > 0) {
          return clients[0].focus().then((client) => {
            client.postMessage({ type: 'NAVIGATE', url: targetUrl });
            return client;
          });
        }

        // Open a new window as last resort
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ─── Message handler ────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    );
  }

  if (event.data?.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(urls))
    );
  }
});
