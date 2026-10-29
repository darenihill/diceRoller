const CACHE_NAME = 'diceroller-v2';
// How long opening the app waits for the network before using the saved copy
const NAV_TIMEOUT_MS = 3000;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  '/manifest.json'
];

// Install: Cache core static shell assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate caching strategy
self.addEventListener('fetch', (e) => {
  // Only handle GET requests and local/font resources
  if (e.request.method !== 'GET') return;
  
  const url = new URL(e.request.url);
  
  // Bypass caching on localhost/127.0.0.1 to prevent caching outdated code in local development
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;
  
  const isLocal = url.origin === self.location.origin;
  const isGoogleFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  
  if (!isLocal && !isGoogleFont) return;

  // Navigation requests (the HTML shell) use network-first. Under
  // stale-while-revalidate a returning visitor would render the PREVIOUS
  // deploy's index.html on every visit — permanently one release behind,
  // since the fresh copy only lands in cache after the page has rendered.
  // Hashed assets are immutable, so they stay stale-while-revalidate.
  const isNavigation = e.request.mode === 'navigate' || e.request.destination === 'document';

  if (isNavigation) {
    const cachedShell = () => caches.match(e.request).then((cached) => cached || caches.match('/index.html'));
    const network = fetch(e.request);
    // Save the fresh page on the side: a good signal shows it straight away, and
    // after a slow network loses the race below it still saves, so the newer
    // version opens next time
    e.waitUntil(network.then((networkResponse) => {
      if (networkResponse.status !== 200) return;
      const copy = networkResponse.clone();
      return caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
    }).catch(() => {}));
    // A weak signal: after NAV_TIMEOUT_MS open this page's copy on the phone
    // instead of a blank screen. With no copy of it yet, keep waiting.
    const slow = new Promise((resolve) => setTimeout(resolve, NAV_TIMEOUT_MS))
      .then(() => caches.match(e.request))
      .then((cached) => cached || network);
    e.respondWith(
      Promise.race([network, slow]).catch(() => cachedShell())
    );
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        const fetchPromise = fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Silent catch for network failures
        });

        // Return cached version if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});
