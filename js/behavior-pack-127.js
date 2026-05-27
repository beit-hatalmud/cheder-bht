// behavior-pack-127.js — Boot polish: splash loader + SW activation force + data ready signal. 2026-05-27
(function () {
  'use strict';

  // ===== Boot splash overlay (shown until data loads) =====
  function showBootSplash() {
    if (document.getElementById('boot-splash-127')) return;
    if (document.querySelector('.modal.show')) return;  // don't overlap modals

    const user = (() => {
      try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; }
    })();
    // Only show if user is logged in and data not loaded yet
    if (!user.username) return;
    const data = typeof window.getVisibleData === 'function' ? window.getVisibleData() : {};
    if ((data.students || []).length > 0) return;  // data already there

    const splash = document.createElement('div');
    splash.id = 'boot-splash-127';
    splash.style.cssText = 'position:fixed;inset:0;background:linear-gradient(135deg,#1e3a8a,#3b82f6);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:Heebo,sans-serif';
    splash.innerHTML = `
      <div style="font-size:48px;margin-bottom:14px"><i class="bi bi-shield-fill-check"></i></div>
      <div style="font-size:22px;font-weight:600;margin-bottom:14px">בית התלמוד</div>
      <div style="font-size:14px;opacity:0.9;margin-bottom:20px">טוען נתונים...</div>
      <div style="display:flex;gap:6px">
        <span style="width:10px;height:10px;border-radius:50%;background:#fbbf24;animation:bht-bounce-127 1.4s infinite"></span>
        <span style="width:10px;height:10px;border-radius:50%;background:#fbbf24;animation:bht-bounce-127 1.4s infinite 0.2s"></span>
        <span style="width:10px;height:10px;border-radius:50%;background:#fbbf24;animation:bht-bounce-127 1.4s infinite 0.4s"></span>
      </div>
      <div id="boot-status-127" style="margin-top:24px;font-size:12px;opacity:0.7">מתחבר ל-Google Sheets...</div>
    `;
    document.body.appendChild(splash);

    if (!document.getElementById('bht-bounce-style-127')) {
      const st = document.createElement('style');
      st.id = 'bht-bounce-style-127';
      st.textContent = '@keyframes bht-bounce-127 { 0%,100% { transform: translateY(0); opacity: 0.6 } 50% { transform: translateY(-8px); opacity: 1 } }';
      document.head.appendChild(st);
    }

    // Update status messages
    const statuses = [
      'מתחבר ל-Google Sheets...',
      'טוען רשימת תלמידים...',
      'טוען אירועי התנהגות...',
      'מסנכרן נתוני תל"א...',
      'מאמת חיבור מצלמות...',
      'כמעט מוכן...',
    ];
    let i = 0;
    const statusInterval = setInterval(() => {
      const statusEl = document.getElementById('boot-status-127');
      if (!statusEl) { clearInterval(statusInterval); return; }
      i = (i + 1) % statuses.length;
      statusEl.textContent = statuses[i];
    }, 1500);

    // Hide when data loads or after 15s max
    const hideTimer = setTimeout(hideSplash, 15000);
    const checkInterval = setInterval(() => {
      const d = typeof window.getVisibleData === 'function' ? window.getVisibleData() : {};
      if ((d.students || []).length > 0) {
        clearInterval(checkInterval);
        clearInterval(statusInterval);
        clearTimeout(hideTimer);
        setTimeout(hideSplash, 300);  // brief delay so user sees "כמעט מוכן"
      }
    }, 500);
  }

  function hideSplash() {
    const splash = document.getElementById('boot-splash-127');
    if (!splash) return;
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.4s';
    setTimeout(() => splash.remove(), 500);
  }

  // ===== Show splash after login =====
  // Detect login by watching sessionStorage
  let lastUserState = sessionStorage.getItem('user');
  setInterval(() => {
    const cur = sessionStorage.getItem('user');
    if (cur && cur !== '{}' && cur !== lastUserState) {
      lastUserState = cur;
      showBootSplash();
    } else if (!cur || cur === '{}') {
      lastUserState = cur;
      hideSplash();
    }
  }, 800);

  // ===== Force SW activation when cache version changes =====
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) {
        // New SW ready - prompt activation
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });

    // When new SW takes control, soft reload critical files
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Note: don't force reload - just refresh stale data
      if (typeof window.BhtSync !== 'undefined') {
        setTimeout(() => window.BhtSync.syncAll(), 1000);
      }
    });
  }

  // ===== Page transition feedback (small progress bar at top) =====
  let progressBar = null;
  function showProgress() {
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'page-progress-127';
      progressBar.style.cssText = 'position:fixed;top:0;right:0;left:0;height:3px;background:linear-gradient(90deg,#1e3a8a,#3b82f6,#fbbf24);z-index:99998;transform:scaleX(0);transform-origin:right;transition:transform 0.4s';
      document.body.appendChild(progressBar);
    }
    progressBar.style.transform = 'scaleX(0.7)';
  }
  function hideProgress() {
    if (!progressBar) return;
    progressBar.style.transform = 'scaleX(1)';
    setTimeout(() => {
      if (progressBar) progressBar.style.transform = 'scaleX(0)';
    }, 300);
  }
  window.addEventListener('hashchange', () => {
    showProgress();
    setTimeout(hideProgress, 600);
  });

  console.warn('%c🚀 Pack-127 — Boot splash + SW skipWaiting + page transition progress bar', 'color:#3b82f6;font-weight:bold');
})();
