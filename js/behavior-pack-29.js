// behavior-pack-29.js — PWA & Offline Support. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Service worker registration helper =====
  window.registerSW = async function () {
    if (!('serviceWorker' in navigator)) return false;
    try {
      // Inline SW source as Blob URL
      const swCode = `
        const CACHE = 'bht-v1';
        self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
        self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
        self.addEventListener('fetch', e => {
          if (e.request.method !== 'GET') return;
          e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
          );
        });
      `;
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const reg = await navigator.serviceWorker.register(URL.createObjectURL(blob));
      console.info('[sw] registered', reg.scope);
      return true;
    } catch (e) {
      console.warn('[sw] failed:', e.message);
      return false;
    }
  };

  // ===== 2. Offline queue =====
  window.offlineQueue = JSON.parse(localStorage.getItem('bht_offline_queue') || '[]');

  window.queueOffline = function (action, args) {
    offlineQueue.push({ id: Date.now(), action, args, ts: Date.now() });
    localStorage.setItem('bht_offline_queue', JSON.stringify(offlineQueue));
    if (typeof toast === 'function') toast(`📥 בתור: ${action} (${offlineQueue.length})`, 'info');
  };

  window.flushOfflineQueue = async function () {
    if (!navigator.onLine) return;
    const queue = [...offlineQueue];
    if (!queue.length) return;
    if (typeof toast === 'function') toast(`📤 שולח ${queue.length} פעולות...`, 'info');
    let success = 0;
    for (const item of queue) {
      try {
        const r = await api(item.action, item.args);
        if (r?.ok !== false) {
          offlineQueue.splice(offlineQueue.findIndex(x => x.id === item.id), 1);
          success++;
        }
      } catch (_) { }
    }
    localStorage.setItem('bht_offline_queue', JSON.stringify(offlineQueue));
    if (success > 0 && typeof toast === 'function') toast(`✓ ${success} פעולות נשלחו`, 'success');
  };

  window.addEventListener('online', flushOfflineQueue);
  setTimeout(flushOfflineQueue, 5000);

  // ===== 3. Add to home screen prompt =====
  let _installPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _installPrompt = e;
    // Show install button after 30s if dismissed
    setTimeout(() => {
      if (_installPrompt && !sessionStorage.getItem('install_shown')) {
        sessionStorage.setItem('install_shown', '1');
        if (typeof notify === 'function') notify('💡 התקן את האפליקציה - לחץ כאן', 'info');
      }
    }, 30000);
  });

  window.installPWA = async function () {
    if (!_installPrompt) {
      if (typeof toast === 'function') toast('התקנה לא זמינה כעת', 'warn');
      return;
    }
    _installPrompt.prompt();
    const { outcome } = await _installPrompt.userChoice;
    if (outcome === 'accepted') {
      if (typeof toast === 'function') toast('✓ האפליקציה הותקנה', 'success');
    }
    _installPrompt = null;
  };

  // ===== 4. Web App Manifest (inject) - DISABLED due to CSP restrictions =====
  if (false && !document.querySelector('link[rel="manifest"]')) {
    const manifest = {
      name: 'בית התלמוד',
      short_name: 'BHT',
      description: 'מערכת ניהול בית תלמוד',
      start_url: location.pathname,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#ffffff',
      theme_color: '#2563eb',
      lang: 'he',
      dir: 'rtl',
      icons: [
        { src: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      ],
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = URL.createObjectURL(blob);
    document.head.appendChild(link);
  }

  // ===== 5. Theme color meta =====
  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#2563eb';
    document.head.appendChild(meta);
  }

  // ===== 6. Offline indicator =====
  const offlineIndicator = document.createElement('div');
  offlineIndicator.id = 'offline-banner';
  offlineIndicator.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fbbf24;color:#78350f;text-align:center;padding:6px;font-size:13px;z-index:9999;display:none;direction:rtl';
  offlineIndicator.innerHTML = '⚠ לא מחובר - שינויים יישמרו ויסונכרנו כשהחיבור יחזור';
  document.body.appendChild(offlineIndicator);

  function updateOnlineStatus() {
    offlineIndicator.style.display = navigator.onLine ? 'none' : 'block';
    document.body.classList.toggle('offline', !navigator.onLine);
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // ===== 7. IndexedDB for large data =====
  window.openIDB = function () {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('bht_db', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };

  window.idbSet = async function (key, value) {
    const db = await openIDB();
    const tx = db.transaction('cache', 'readwrite');
    tx.objectStore('cache').put({ key, value, ts: Date.now() });
    return new Promise(r => tx.oncomplete = r);
  };

  window.idbGet = async function (key) {
    const db = await openIDB();
    return new Promise(resolve => {
      const req = db.transaction('cache').objectStore('cache').get(key);
      req.onsuccess = () => resolve(req.result?.value);
      req.onerror = () => resolve(null);
    });
  };

  // ===== 8. Background sync =====
  window.backgroundSync = async function () {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register('bht-sync');
        console.info('[sync] background sync registered');
        return true;
      } catch (e) {
        console.warn('[sync] failed:', e);
        return false;
      }
    }
    return false;
  };

  // ===== 9. App badge (number on icon) =====
  window.setAppBadge = function (n) {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(n).catch(() => {});
    }
  };

  // Update badge based on notifications
  setInterval(() => {
    const count = (window.notifications || []).filter(n => !n.read).length;
    setAppBadge(count);
  }, 30000);

  // ===== 10. Share API =====
  window.shareApp = function () {
    if (navigator.share) {
      navigator.share({
        title: 'בית התלמוד',
        text: 'מערכת ניהול בית התלמוד',
        url: location.href,
      });
    } else {
      navigator.clipboard.writeText(location.href).then(() => {
        if (typeof toast === 'function') toast('קישור הועתק', 'success');
      });
    }
  };

  console.warn('%c📲 Pack-29 — PWA: offline queue, install prompt, manifest, IndexedDB, badge', 'color:#0891b2;font-weight:bold');
})();
