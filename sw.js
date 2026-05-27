// sw.js — Service Worker for offline support
// Cheder-BHT Production. 2026-05-27

const CACHE_NAME = 'bht-cache-v1-20260527';
const CORE_ASSETS = [
  '/cheder-bht/',
  '/cheder-bht/index.html',
  '/cheder-bht/api.js',
  '/cheder-bht/app.js',
  '/cheder-bht/css/main.css',
  '/cheder-bht/css/theme.css',
  '/cheder-bht/js/schema.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Don't cache: Apps Script, mediamtx, cloudflare tunnels, Drive
  if (url.host.includes('script.google.com') ||
      url.host.includes('trycloudflare.com') ||
      url.host.includes('googleusercontent.com') ||
      url.host.includes('drive.google.com')) {
    return; // Pass through
  }

  // Cache-first for same-origin static assets
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) {
          // Refresh in background
          fetch(e.request).then(net => {
            caches.open(CACHE_NAME).then(c => c.put(e.request, net.clone())).catch(() => {});
          }).catch(() => {});
          return cached;
        }
        return fetch(e.request).then(net => {
          caches.open(CACHE_NAME).then(c => c.put(e.request, net.clone())).catch(() => {});
          return net;
        }).catch(() => caches.match('/cheder-bht/index.html'));
      })
    );
  }
});
