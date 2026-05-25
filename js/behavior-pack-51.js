// behavior-pack-51.js — UI cleanup based on visual audit. 2026-05-25
(function () {
  'use strict';

  // FORCE HIDE all old floating buttons with permanent CSS
  const forceHide = document.createElement('style');
  forceHide.id = 'force-hide-floaters-v2';
  forceHide.textContent = `
    #lang-switch, #help-btn, #quick-filters-bar,
    #voice-cmd-btn, #notif-bell, #quick-action-fab,
    #theme-btn, #reminder-btn, #quick-add-fab,
    #active-users-badge, #home-lb-btn, #a11y-toolbar,
    button[style*="position:fixed"][style*="top:10px"],
    button[style*="position:fixed"][style*="top:40px"],
    div[style*="position:fixed"][style*="top:48px"][style*="right:14px"] { display: none !important; visibility: hidden !important; }
    /* Only master-fab visible */
    #master-fab { display: flex !important; visibility: visible !important; }
  `;
  document.head.appendChild(forceHide);

  // ===== FIX 1: Remove duplicate moon (lang-switch) + ? (help) buttons - merged into master-fab =====
  const HIDE_PERM = ['lang-switch', 'help-btn', 'quick-filters-bar', 'sf-show-btn'];

  function killDuplicates() {
    HIDE_PERM.forEach(id => {
      const el = document.getElementById(id);
      if (el && id !== 'sf-show-btn') el.remove();
    });
    // Move help & dark mode into FAB menu only - remove standalone buttons
    document.querySelectorAll('#lang-switch, #help-btn, #quick-filters-bar').forEach(el => el.remove());
  }
  setInterval(killDuplicates, 2000);
  setTimeout(killDuplicates, 500);

  // ===== FIX 2: Limit notifications to 10 max =====
  if (window.notifications) {
    Object.defineProperty(window, 'notifications', {
      get() { return window._notif || []; },
      set(v) {
        const arr = Array.isArray(v) ? v : [];
        window._notif = arr.slice(0, 10);
      },
      configurable: true,
    });
  }
  // Override notify to dedupe
  const origNotify = window.notify;
  if (typeof origNotify === 'function') {
    window.notify = function (msg, type) {
      window._notif = window._notif || [];
      // Skip duplicate
      const recent = window._notif.find(n => n.msg === msg && Date.now() - n.ts < 30000);
      if (recent) return;
      window._notif.unshift({ msg, type: type || 'info', ts: Date.now() });
      if (window._notif.length > 10) window._notif = window._notif.slice(0, 10);
      // Update badge
      const fab = document.getElementById('master-fab');
      const dot = fab?.querySelector('.fab-dot');
      if (dot) {
        const count = window._notif.filter(n => !n.read).length;
        dot.textContent = count > 9 ? '9+' : count;
      }
    };
  }

  // ===== FIX 3: Clear notification spam from old packs on load =====
  setTimeout(() => {
    window._notif = (window._notif || []).slice(0, 5);
    const fab = document.getElementById('master-fab');
    const dot = fab?.querySelector('.fab-dot');
    if (dot) dot.textContent = '';
  }, 3000);

  // ===== FIX 4: Show "צפה בחתימות" button immediately on formsMgmt =====
  window.addEventListener('hashchange', () => {
    if (location.hash === '#formsMgmt') {
      setTimeout(injectSignedFormsBtn, 100);
      setTimeout(injectSignedFormsBtn, 800);
    }
  });
  setTimeout(() => {
    if (location.hash === '#formsMgmt') injectSignedFormsBtn();
  }, 1500);

  function injectSignedFormsBtn() {
    const page = document.getElementById('page-formsMgmt');
    if (!page || page.querySelector('#sf-show-btn')) return;
    const h3 = page.querySelector('h3');
    if (!h3) return;
    const btn = document.createElement('button');
    btn.id = 'sf-show-btn';
    btn.className = 'btn btn-outline-success btn-sm ms-2';
    btn.innerHTML = '<i class="bi bi-pen-fill"></i> 📜 צפה בחתימות';
    btn.onclick = () => window.showSignedForms?.();
    h3.parentElement.appendChild(btn);
  }

  // ===== FIX 5: Cleanup header overlap =====
  const headerFixStyle = document.createElement('style');
  headerFixStyle.textContent = `
    /* Prevent floating buttons from overlapping header */
    body > button[style*="position:fixed"][style*="top:10px"],
    body > button[style*="position:fixed"][style*="top:40px"],
    body > div[style*="position:fixed"][style*="top:48px"] {
      display: none !important;
    }
    /* Master FAB stays */
    #master-fab { display: flex !important; }
    /* Notification dot proper position */
    #master-fab .fab-dot { font-size: 10px !important; }
  `;
  document.head.appendChild(headerFixStyle);

  // ===== FIX 6: Prevent toast overflow =====
  const toastStyle = document.createElement('style');
  toastStyle.textContent = `
    .toast-container { max-height: 80vh; overflow-y: auto; }
    .toast { max-width: 300px !important; }
  `;
  document.head.appendChild(toastStyle);

  // ===== FIX 7: Hide overdue/idle notifications by default for first 10 min =====
  const _suppressUntil = Date.now() + 10 * 60 * 1000;
  if (window.queueReminder) {
    const orig = window.queueReminder;
    window.queueReminder = function (msg, type) {
      if (Date.now() < _suppressUntil) return;
      return orig(msg, type);
    };
  }

  // ===== FIX 8: Console badge =====
  console.warn('%c🧹 Pack-51 — UI cleanup: removed duplicate buttons, limit notifs to 10, prevent overlap', 'color:#16a34a;font-weight:bold');
})();

// ===== FIX 9: Prevent horizontal scroll from whats-new-sidebar =====
(function () {
  const overflowFix = document.createElement('style');
  overflowFix.textContent = `
    html, body { overflow-x: hidden !important; max-width: 100vw !important; }
    #whats-new-sidebar {
      transition: transform 0.3s ease;
      transform: translateX(0);
    }
    #whats-new-sidebar:not(.show) {
      transform: translateX(100%) !important;
      pointer-events: none;
    }
  `;
  document.head.appendChild(overflowFix);
})();
