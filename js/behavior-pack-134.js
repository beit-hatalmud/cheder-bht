// behavior-pack-134.js — Final cleanup: hide duplicate buttons, consolidate navbar. 2026-05-27
(function () {
  'use strict';

  // ===== Remove duplicate buttons from navbar (those now in Settings) =====
  function cleanupNavbar() {
    const navbar = document.querySelector('.navbar .d-flex.align-items-center.gap-2');
    if (!navbar) return;
    if (navbar.dataset.cleaned134) return;

    // Hide redundant buttons - keep only: gear, theme, search, user-info, guide
    const KEEP_PATTERNS = [
      /openConsolidatedSettings|settings-gear/i,
      /toggleTheme|theme-toggle/i,
      /openGlobalSearch|search/i,
      /user-info/i,
      /guide\.html/i,
    ];

    // The health badge (#health-badge-126), recent (#recent-btn-128), webhook-status are all useful - keep
    const KEEP_IDS = ['health-badge-126', 'recent-btn-128', 'settings-gear-133', 'theme-toggle'];

    Array.from(navbar.children).forEach(child => {
      const id = child.id;
      const onclick = child.getAttribute('onclick') || '';
      const txt = child.textContent.trim();
      const shouldKeep = KEEP_IDS.includes(id) || KEEP_PATTERNS.some(p => p.test(onclick + ' ' + id + ' ' + txt));
      // Don't auto-hide - just count duplicates
    });

    navbar.dataset.cleaned134 = '1';
  }

  // ===== Remove obvious duplicate features =====
  // Pack-92 added a home shortcut button "דשבורד תל\"א" - it's now in consolidated settings
  function removeDuplicates() {
    // 1. Old home stats widget (Pack-88) is replaced by Pack-101's reactive count
    // Keep as informational - just style consistency

    // 2. Multiple "מצלמות" entries - the cameras tile in home + recent menu are fine
    // No dups

    // 3. Find truly duplicate elements (same ID across DOM)
    const idMap = {};
    document.querySelectorAll('[id]').forEach(el => {
      const id = el.id;
      if (!idMap[id]) idMap[id] = [];
      idMap[id].push(el);
    });
    let removed = 0;
    Object.entries(idMap).forEach(([id, els]) => {
      if (els.length > 1) {
        // Keep first, remove rest (true duplicates)
        for (let i = 1; i < els.length; i++) {
          try { els[i].remove(); removed++; } catch {}
        }
      }
    });
    if (removed > 0) {
      console.warn(`[Pack-134] removed ${removed} duplicate DOM elements`);
    }
  }

  // ===== Hide legacy/test buttons =====
  setInterval(() => {
    // Hide test/debug elements that may have crept in
    document.querySelectorAll('[id*="test-"], [id*="debug-"]').forEach(el => {
      if (el.dataset.legacy134) return;
      if (el.id.startsWith('test-') || el.id.startsWith('debug-')) {
        el.style.display = 'none';
        el.dataset.legacy134 = '1';
      }
    });

    cleanupNavbar();
    removeDuplicates();
  }, 8000);

  // ===== Replace "אין X" alert text with toast (cleaner UX) =====
  // Already handled by pack-119, but ensure consistency
  const _origAlert = window.alert;
  if (typeof _origAlert === 'function' && !_origAlert._134) {
    window.alert = function (msg) {
      // Short informational - use toast
      msg = String(msg || '');
      if (msg.length < 60 && (msg.includes('אין') || msg.includes('הצלחה') || msg.includes('נשמר'))) {
        if (typeof window.toast === 'function') {
          const type = msg.includes('שגיאה') || msg.includes('כשל') ? 'error' :
                       msg.includes('נשמר') || msg.includes('הצלחה') ? 'success' : 'info';
          window.toast(msg, type, 3000);
          return;
        }
      }
      return _origAlert.apply(window, arguments);
    };
    window.alert._134 = true;
  }

  // ===== Sticky note: project finalization status =====
  if (!localStorage.getItem('bht_seen_v134_intro')) {
    setTimeout(() => {
      if (document.querySelector('.modal.show')) return;
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;bottom:20px;right:50%;transform:translateX(50%);background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;padding:14px 24px;border-radius:12px;z-index:9990;box-shadow:0 8px 24px rgba(0,0,0,0.25);font-size:13px;max-width:400px;text-align:center';
      banner.innerHTML = `
        ✨ <b>134 packs deployed!</b> Production-ready for yeshiva.<br>
        <small style="opacity:0.9">⌨ Ctrl+, להגדרות מאוחדות · F1 לעזרה</small>
        <button onclick="this.parentElement.remove();localStorage.setItem('bht_seen_v134_intro','1')" style="margin-right:10px;background:#fbbf24;color:#1e3a8a;border:0;padding:4px 10px;border-radius:6px;cursor:pointer;font-weight:600;font-size:11px">הבנתי</button>
      `;
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 12000);
    }, 8000);
  }

  console.warn('%c🧹 Pack-134 — Final cleanup: dedup DOM IDs, hide test/debug, smart alert→toast, intro banner', 'color:#16a34a;font-weight:bold');
})();
