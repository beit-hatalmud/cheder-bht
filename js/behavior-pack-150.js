// behavior-pack-150.js — Fetch live Cloudflare tunnel URLs from
// /cheder-bht/dist/camera-tunnels.json on load. Local watchdog
// (cf_tunnel_sync.py) keeps that file in sync with the actual tunnels.
// 2026-06-01.
(function () {
  'use strict';

  const KEYS = {
    hls:    'bht_cam_hls_base',
    webrtc: 'bht_cam_whep_base',
    dvr:    'bht_cam_dvr_base',
  };

  function applyUrls(cfg) {
    if (!cfg) return;
    let applied = 0;
    Object.entries(KEYS).forEach(([role, lsKey]) => {
      const url = cfg[role];
      if (!url) return;
      const current = localStorage.getItem(lsKey);
      if (current === url) return;
      try {
        localStorage.setItem(lsKey, url);
        applied++;
      } catch {}
    });
    if (applied > 0) {
      console.warn('%c📡 Pack-150 — applied ' + applied + ' live tunnel URLs', 'color:#16a34a;font-weight:bold');
      // Tell camera packs to re-render any open camera view with the new URLs.
      try { window.dispatchEvent(new CustomEvent('bht-cameras-config-updated', { detail: cfg })); } catch {}
    }
  }

  async function load() {
    try {
      const r = await fetch('dist/camera-tunnels.json?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const cfg = await r.json();
      applyUrls(cfg);
    } catch (e) {
      // Silent — fallback URLs in pack-65/76/82 etc. still work.
    }
  }

  // Load on init + every 5 minutes (in case tunnel restarts during session)
  load();
  setInterval(load, 5 * 60 * 1000);

  console.warn('%c📡 Pack-150 — camera-tunnels.json watcher live', 'color:#0891b2;font-weight:bold');
})();
