// behavior-pack-76.js — CRITICAL FIX: standalone-pages.js overrides renderCameras AFTER pack-65/67/68/69/70.
// This pack re-applies the HLS camera grid at the very end of load order. 2026-05-27
(function () {
  'use strict';

  const HLS_BASE_KEY = 'cameras_hls_base';
  const DEFAULT_HLS_BASE = 'https://oregon-knock-learn-corrections.trycloudflare.com';

  const CAMERAS = [
    { path: 'shaar',          name: 'שער וגינה',     channel: 1,  emoji: '🚪' },
    { path: 'chadar_rm',      name: 'חדר רמ"מ',     channel: 2,  emoji: '👨‍🏫' },
    { path: 'lobby',          name: 'לובי',          channel: 3,  emoji: '🏛️' },
    { path: 'shvil',          name: 'שביל סיני',     channel: 4,  emoji: '🛤️' },
    { path: 'machsan',        name: 'מחסן',          channel: 5,  emoji: '📦' },
    { path: 'parking',        name: 'מדרכה וחניה',   channel: 6,  emoji: '🚗' },
    { path: 'chadar_shiur',   name: 'חדר שיעור',     channel: 7,  emoji: '📚' },
    { path: 'chadar_mifgash', name: 'חדר מפגש',      channel: 9,  emoji: '🤝' },
    { path: 'mazkirut',       name: 'מזכירות',       channel: 10, emoji: '📋' },
    { path: 'misrad',         name: 'משרד',          channel: 11, emoji: '💼' },
    { path: 'beit_midrash',   name: 'בית המדרש',     channel: 12, emoji: '📜' },
  ];

  function getBase() { return localStorage.getItem(HLS_BASE_KEY) || DEFAULT_HLS_BASE; }
  function escA(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

  function loadHlsJs() {
    if (window.Hls) return Promise.resolve(window.Hls);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
      s.onload = () => resolve(window.Hls);
      s.onerror = () => reject(new Error('hls.js failed'));
      document.head.appendChild(s);
    });
  }

  function attachHls(videoEl, url) {
    const Hls = window.Hls;
    if (Hls && Hls.isSupported()) {
      try { videoEl._hls?.destroy(); } catch {}
      const hls = new Hls({ liveSyncDuration: 2, maxBufferLength: 6 });
      hls.loadSource(url);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoEl.play().catch(() => {});
        videoEl.parentNode.querySelector('.cam-status')?.classList.add('live');
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          videoEl.parentNode.querySelector('.cam-status')?.classList.add('offline');
        }
      });
      videoEl._hls = hls;
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = url;
      videoEl.play().catch(() => {});
    }
  }

  function renderCamerasGrid() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    const base = getBase();
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isAdmin = u.username === 'admin' || u.role === 'מנהל';

    // Inject styles once
    if (!document.getElementById('cam-grid-style-76')) {
      const st = document.createElement('style');
      st.id = 'cam-grid-style-76';
      st.textContent = `
        .cam-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
        .cam-card { position:relative; background:#000; border-radius:8px; overflow:hidden; aspect-ratio:4/3; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
        .cam-card:hover { box-shadow:0 4px 16px rgba(220,38,38,0.3); }
        .cam-card video { width:100%; height:100%; object-fit:cover; background:#111; }
        .cam-label { position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.7); color:#fff; padding:4px 10px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px; }
        .cam-status { display:inline-block; width:8px; height:8px; border-radius:50%; background:#fbbf24; }
        .cam-status.live { background:#22c55e; box-shadow:0 0 6px #22c55e; animation:pulse 2s infinite; }
        .cam-status.offline { background:#ef4444; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .cam-channel { position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.6); color:#9ca3af; padding:2px 8px; border-radius:8px; font-size:11px; font-family:monospace; }
        @media (max-width:640px) { .cam-grid { grid-template-columns:1fr 1fr !important; } }
      `;
      document.head.appendChild(st);
    }

    root.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="d-flex align-items-center mb-3 flex-wrap gap-2">
        <h3 class="me-3 mb-0"><i class="bi bi-camera-video-fill text-danger"></i> מצלמות לייב</h3>
        <span class="badge bg-danger">🔴 LIVE</span>
        <span class="badge bg-secondary">${CAMERAS.length} מצלמות</span>
        <button class="btn btn-sm btn-outline-secondary ms-auto" onclick="window.renderCameras && window.renderCameras()" title="רענן">🔄</button>
      </div>
      <div class="cam-grid" id="cam-grid"></div>
      <div class="alert alert-info small mt-3">
        <i class="bi bi-info-circle"></i> שידור דרך mediamtx + Cloudflare Tunnel. מקור: <code>${escA(base.replace(/^https?:\/\//,'').split('/')[0])}</code>
      </div>
    `;

    const grid = document.getElementById('cam-grid');
    grid.innerHTML = CAMERAS.map(c => `
      <div class="cam-card" data-path="${c.path}">
        <video autoplay muted playsinline></video>
        <span class="cam-label">${c.emoji} ${escA(c.name)} <span class="cam-status"></span></span>
        <span class="cam-channel">CH${c.channel}</span>
      </div>
    `).join('');

    loadHlsJs().then(() => {
      CAMERAS.forEach(c => {
        const card = grid.querySelector(`.cam-card[data-path="${c.path}"]`);
        if (!card) return;
        const video = card.querySelector('video');
        const url = base.replace(/\/$/, '') + '/' + c.path + '/index.m3u8';
        attachHls(video, url);
      });
    }).catch(err => {
      grid.innerHTML = `<div class="alert alert-danger col-12">לא ניתן לטעון hls.js: ${err.message}</div>`;
    });
  }

  // Re-apply at end of all script load + on hash change
  function reapply() {
    window.renderCameras = renderCamerasGrid;
    // If currently viewing cameras, re-render
    if (location.hash === '#cameras' || document.getElementById('page-cameras')?.style.display !== 'none') {
      const camPage = document.getElementById('page-cameras');
      if (camPage && !camPage.classList.contains('d-none')) {
        renderCamerasGrid();
      }
    }
  }

  // Run after DOM ready + a delay to ensure standalone-pages.js has done its overrides
  if (document.readyState === 'complete') {
    setTimeout(reapply, 100);
  } else {
    window.addEventListener('load', () => setTimeout(reapply, 100));
  }
  // Also re-apply on page change
  window.addEventListener('hashchange', () => {
    if (location.hash === '#cameras') setTimeout(reapply, 50);
  });

  console.warn('%c🎬 Pack-76 — CRITICAL: re-apply HLS camera grid after standalone-pages override', 'color:#dc2626;font-weight:bold;font-size:14px');
})();
