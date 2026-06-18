/**
 * sync_indicator.js — flashing dot next to the user info that shows
 * write activity. Hooks into the existing markLocalChange / updateSyncIndicator
 * helpers, plus a global bus so any module can call window.bhtSyncFlash().
 */
(function () {
  'use strict';

  function ensureDot() {
    if (document.getElementById('sync-flash-dot')) return;
    const userInfo = document.getElementById('user-info');
    if (!userInfo) return;
    const dot = document.createElement('span');
    dot.id = 'sync-flash-dot';
    dot.title = 'סינכרון נתונים';
    dot.style.cssText = 'display:inline-block;width:8px;height:8px;border-radius:50%;background:transparent;margin-left:4px;transition:background .3s,box-shadow .3s;vertical-align:middle';
    userInfo.parentElement.insertBefore(dot, userInfo);
  }

  let _lastFlashAt = 0;

  window.bhtSyncFlash = function (kind /* writing|success|error */) {
    ensureDot();
    const dot = document.getElementById('sync-flash-dot');
    if (!dot) return;
    const color = kind === 'error' ? '#dc2626'
                 : kind === 'success' ? '#16a34a'
                 : '#2563eb';
    dot.style.background = color;
    dot.style.boxShadow = '0 0 10px ' + color;
    _lastFlashAt = Date.now();
    // Auto-fade after 1.5s
    setTimeout(() => {
      if (Date.now() - _lastFlashAt >= 1400) {
        dot.style.background = 'transparent';
        dot.style.boxShadow = 'none';
      }
    }, 1500);
  };

  // Hook the api.js sync path. updateSyncIndicator is what api.js
  // already calls after every write — we monkey-patch around it so
  // we don't change existing files.
  function wrap() {
    if (typeof window.updateSyncIndicator !== 'function') {
      setTimeout(wrap, 1500);
      return;
    }
    const orig = window.updateSyncIndicator;
    window.updateSyncIndicator = function () {
      try {
        window.bhtSyncFlash('success');
      } catch (_) {}
      return orig.apply(this, arguments);
    };
  }

  // Wrap fetch too, so any write through postToProxy flashes 'writing'.
  function wrapFetch() {
    const orig = window.fetch;
    window.fetch = function (...args) {
      try {
        const url = String(args[0] || '');
        if (url.includes('script.google.com') && args[1] && args[1].method === 'POST') {
          window.bhtSyncFlash('writing');
        }
      } catch (_) {}
      return orig.apply(this, args);
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureDot();
    wrap();
    wrapFetch();
  });
})();
