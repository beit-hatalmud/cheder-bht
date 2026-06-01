// behavior-pack-149.js — Clear stale Cloudflare tunnel URLs from localStorage.
// Quick trycloudflare URLs change every restart, so any URL the user saved
// before 2026-06-01 (e.g. oregon-knock-learn-corrections) is dead and must be
// replaced with the current hardcoded fallback.
// 2026-06-01.
(function () {
  'use strict';
  const DEAD_URLS = [
    'oregon-knock-learn-corrections',
    'participation-seek-indexes-burner',
    'pressure-experts-rescue-subscribers',
  ];
  const KEYS = ['bht_cam_hls_base', 'bht_cam_whep_base', 'bht_cam_dvr_base', 'cam_url', 'webrtc_base', 'dvr_base'];
  let cleared = 0;
  KEYS.forEach(k => {
    try {
      const v = localStorage.getItem(k);
      if (v && DEAD_URLS.some(u => v.includes(u))) {
        localStorage.removeItem(k);
        cleared++;
      }
    } catch {}
  });
  // Also walk EVERY localStorage key to catch any URL we missed
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k) continue;
      const v = localStorage.getItem(k);
      if (v && DEAD_URLS.some(u => v.includes(u))) {
        localStorage.removeItem(k);
        cleared++;
      }
    }
  } catch {}
  if (cleared > 0) {
    console.warn('%c🧹 Pack-149 — cleared ' + cleared + ' stale tunnel URL(s) from localStorage', 'color:#dc2626;font-weight:bold');
  }
})();
