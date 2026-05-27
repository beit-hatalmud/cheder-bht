// behavior-pack-121.js — Register Service Worker for offline support + update notifier. 2026-05-27
(function () {
  'use strict';

  // Register service worker
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/cheder-bht/sw.js')
        .then(reg => {
          console.warn('%c⚙ Pack-121 — Service Worker registered', 'color:#16a34a;font-weight:bold');

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                if (typeof window.toast === 'function') {
                  showUpdateBanner();
                }
              }
            });
          });
        })
        .catch(err => console.warn('[Pack-121] SW register failed:', err.message));
    });

    // Listen for "controllerchange" - SW took over
    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshed) return;
      refreshed = true;
      // Don't auto-reload, just notify
    });
  }

  function showUpdateBanner() {
    if (document.getElementById('sw-update-121')) return;
    const banner = document.createElement('div');
    banner.id = 'sw-update-121';
    banner.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e3a8a;color:#fff;padding:10px 16px;border-radius:8px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:13px;display:flex;gap:10px;align-items:center';
    banner.innerHTML = `
      <span>🔄 גרסה חדשה זמינה</span>
      <button id="sw-update-btn" style="background:#fbbf24;color:#1e3a8a;border:0;padding:4px 12px;border-radius:4px;cursor:pointer;font-weight:600">רענן</button>
      <button id="sw-dismiss-btn" style="background:transparent;color:#fff;border:1px solid #fff;padding:4px 12px;border-radius:4px;cursor:pointer">אחר כך</button>
    `;
    document.body.appendChild(banner);
    document.getElementById('sw-update-btn').onclick = () => location.reload();
    document.getElementById('sw-dismiss-btn').onclick = () => banner.remove();
  }

  // ===== PWA install prompt capture =====
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install button to admin users
    setTimeout(() => {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.username !== 'admin' && user.role !== 'מנהל') return;
      if (document.getElementById('pwa-install-121')) return;
      const btn = document.createElement('button');
      btn.id = 'pwa-install-121';
      btn.className = 'btn btn-sm btn-outline-primary';
      btn.style.cssText = 'position:fixed;top:60px;left:10px;z-index:1000;font-size:12px';
      btn.innerHTML = '📥 התקן כאפליקציה';
      btn.onclick = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') btn.remove();
          deferredPrompt = null;
        }
      };
      document.body.appendChild(btn);
    }, 3000);
  });

  // ===== Service worker test command =====
  window.swStatus = function () {
    if (!('serviceWorker' in navigator)) return 'Not supported';
    navigator.serviceWorker.getRegistration().then(reg => {
      console.group('⚙ Service Worker');
      console.log('Registered:', !!reg);
      console.log('Scope:', reg?.scope);
      console.log('Active:', !!reg?.active);
      console.log('Waiting:', !!reg?.waiting);
      console.log('Cache name:', 'bht-cache-v1-20260527');
      caches.has('bht-cache-v1-20260527').then(has => {
        console.log('Cache exists:', has);
        if (has) caches.open('bht-cache-v1-20260527').then(c => c.keys()).then(keys => {
          console.log('Cached items:', keys.length);
        });
      });
      console.groupEnd();
    });
  };

  console.warn('%c⚙ Pack-121 — Service Worker registered (offline support) + PWA install prompt + swStatus()', 'color:#16a34a;font-weight:bold');
})();
