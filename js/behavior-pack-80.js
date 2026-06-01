// behavior-pack-80.js — Round 16: pre-warm cameras + autoplay tweak + camera stream cache. 2026-05-27
(function () {
  'use strict';

  const HLS_BASE_KEY = 'cameras_hls_base';
  const DEFAULT_HLS_BASE = 'https://biodiversity-prairie-faq-shower.trycloudflare.com';
  const PATHS = ['shaar','chadar_rm','lobby','shvil','machsan','parking','chadar_shiur','chadar_mifgash','mazkirut','misrad','beit_midrash'];

  function getBase() { return localStorage.getItem(HLS_BASE_KEY) || DEFAULT_HLS_BASE; }

  // ===== Pre-warm camera streams =====
  // mediamtx uses sourceOnDemand. First request takes ~3s (ffmpeg spawn).
  // Pre-warm them when user lands on cameras page so iframes load instantly.
  let prewarmInFlight = false;
  async function prewarmAll() {
    if (prewarmInFlight) return;
    prewarmInFlight = true;
    const base = getBase().replace(/\/$/, '');
    const promises = PATHS.map(p =>
      fetch(`${base}/${p}/index.m3u8`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {})
    );
    await Promise.allSettled(promises);
    prewarmInFlight = false;
    console.info('[Pack-80] cameras pre-warmed');
  }

  // Pre-warm when navigating to cameras
  const _origGoto = window.goto;
  if (typeof _origGoto === 'function') {
    window.goto = function (p) {
      if (p === 'cameras') {
        // Fire-and-forget pre-warm BEFORE the iframes load
        prewarmAll();
      }
      return _origGoto.apply(this, arguments);
    };
  }
  window.addEventListener('hashchange', () => {
    if (location.hash === '#cameras') prewarmAll();
  });
  if (location.hash === '#cameras') prewarmAll();

  // ===== Reload iframes after 4s if still showing loading spinner =====
  setInterval(() => {
    const grid = document.getElementById('cam-grid');
    if (!grid) return;
    grid.querySelectorAll('iframe').forEach(iframe => {
      const card = iframe.closest('.cam-iframe-card');
      if (!card) return;
      // Track first-seen time
      if (!card.dataset.firstSeen) card.dataset.firstSeen = Date.now();
      const elapsed = Date.now() - parseInt(card.dataset.firstSeen);
      // If iframe has been visible for 30s but is still loading, soft-reload it once
      if (elapsed > 30000 && !card.dataset.reloaded) {
        card.dataset.reloaded = '1';
        const src = iframe.src;
        iframe.src = '';
        setTimeout(() => { iframe.src = src; }, 100);
        console.info('[Pack-80] soft-reload stuck iframe', card.dataset.path);
      }
    });
  }, 15000);

  // ===== Manual prewarm helper =====
  window.prewarmCameras = prewarmAll;

  console.warn('%c🔥 Pack-80 — Pre-warm camera streams + stuck-iframe auto-reload', 'color:#ea580c;font-weight:bold');
  console.log('  Try: prewarmCameras()');
})();
