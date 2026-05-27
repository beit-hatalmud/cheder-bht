// behavior-pack-83.js — CRITICAL FIX: 3 packs (76,78,82) all listen for hashchange and re-render. Debounce. 2026-05-27
(function () {
  'use strict';

  // Debounce renderCameras to prevent rapid re-renders that destroy WebRTC connections
  let lastRender = 0;
  let renderTimer = null;
  const _orig = window.renderCameras;
  if (typeof _orig !== 'function') return;

  window.renderCameras = function () {
    const now = Date.now();
    const sinceLast = now - lastRender;
    if (sinceLast < 3000) {
      // Too soon - debounce
      console.warn(`[Pack-83] renderCameras call suppressed (${sinceLast}ms since last)`);
      clearTimeout(renderTimer);
      renderTimer = setTimeout(() => {
        lastRender = Date.now();
        _orig.apply(window, []);
      }, 3000 - sinceLast);
      return;
    }
    lastRender = now;
    return _orig.apply(this, arguments);
  };

  // Also remove duplicate hashchange listeners by wrapping
  // (We can't really remove anonymous listeners, but we can guard the body of renderCameras above)

  console.warn('%c🛑 Pack-83 — Debounce renderCameras (was being called by 3 packs on hashchange)', 'color:#dc2626;font-weight:bold');
})();
