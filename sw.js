const CACHE = 'tradejournal-v5';
const BASE  = '/trading-journal-pwa';

// On install - cache core assets
self.addEventListener('install', e => {
  self.skipWaiting(); // activate immediately, don't wait
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never intercept Firebase or Google API calls
  if (url.includes('firebasedatabase.app') ||
      url.includes('googleapis.com') ||
      url.includes('gstatic.com') ||
      url.includes('fonts.gstatic') ||
      url.includes('fonts.googleapis')) return;

  // For HTML pages — network first, fallback to cache
  // This ensures index.html is ALWAYS fresh from GitHub
  if (e.request.destination === 'document' || url.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          // Cache the fresh copy
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request)) // offline fallback
    );
    return;
  }

  // For everything else (icons, manifest) — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      });
    })
  );
});
