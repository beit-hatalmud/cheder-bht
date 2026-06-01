// behavior-pack-78.js — CRITICAL: switch from broken HLS-with-session to mediamtx built-in iframes. 2026-05-27
// HLS via hls.js has session/segment 404 issues. mediamtx serves a built-in WebRTC player at /<path>/
// We just iframe it - the player handles HLS+WebRTC negotiation, autoplay, etc.
(function () {
  'use strict';

  const HLS_BASE_KEY = 'cameras_hls_base';
  const DEFAULT_HLS_BASE = 'https://biodiversity-prairie-faq-shower.trycloudflare.com';

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

  function renderCamerasIframeGrid() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    const base = getBase();

    if (!document.getElementById('cam-grid-style-78')) {
      const st = document.createElement('style');
      st.id = 'cam-grid-style-78';
      st.textContent = `
        .cam-grid-iframe { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:12px; }
        .cam-iframe-card { position:relative; background:#000; border-radius:8px; overflow:hidden; aspect-ratio:4/3; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
        .cam-iframe-card:hover { box-shadow:0 6px 20px rgba(220,38,38,0.4); transform:scale(1.01); transition:all .15s; }
        .cam-iframe-card iframe { width:100%; height:100%; border:0; background:#000; }
        .cam-iframe-label { position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.75); color:#fff; padding:4px 10px; border-radius:14px; font-size:13px; font-weight:600; z-index:2; pointer-events:none; }
        .cam-iframe-channel { position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.7); color:#9ca3af; padding:2px 8px; border-radius:8px; font-size:11px; font-family:monospace; z-index:2; pointer-events:none; }
        .cam-iframe-expand { position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.7); color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; z-index:2; }
        .cam-iframe-card:hover .cam-iframe-expand { background:#dc2626; }
        @media (max-width:640px) { .cam-grid-iframe { grid-template-columns:1fr 1fr !important; } }
      `;
      document.head.appendChild(st);
    }

    root.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="d-flex align-items-center mb-3 flex-wrap gap-2">
        <h3 class="me-3 mb-0"><i class="bi bi-camera-video-fill text-danger"></i> מצלמות לייב</h3>
        <span class="badge bg-danger">🔴 LIVE</span>
        <span class="badge bg-secondary">${CAMERAS.length} מצלמות</span>
        <button class="btn btn-sm btn-outline-secondary ms-auto" onclick="window.renderCameras && window.renderCameras()" title="רענן"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
      <div class="cam-grid-iframe" id="cam-grid"></div>
      <div class="alert alert-info small mt-3">
        <i class="bi bi-info-circle"></i> שידור דרך mediamtx WebRTC/HLS · ${CAMERAS.length} מצלמות פעילות
      </div>
    `;

    const grid = document.getElementById('cam-grid');
    grid.innerHTML = CAMERAS.map(c => {
      const url = base.replace(/\/$/, '') + '/' + c.path + '/';
      return `<div class="cam-iframe-card" data-path="${escA(c.path)}">
        <iframe src="${escA(url)}" allow="autoplay; fullscreen" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>
        <span class="cam-iframe-label">${c.emoji} ${escA(c.name)}</span>
        <span class="cam-iframe-channel">CH${c.channel}</span>
        <button class="cam-iframe-expand" onclick="window.camExpand('${escA(c.path)}','${escA(c.name)}',${c.channel})" title="מסך מלא">⛶</button>
      </div>`;
    }).join('');
  }

  window.camExpand = function (path, name, channel) {
    const base = getBase().replace(/\/$/, '');
    const url = `${base}/${path}/`;
    const modal = document.createElement('div');
    modal.className = 'cam-fullscreen-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = `
      <button onclick="this.closest('div[data-fs]').remove()" style="position:absolute;top:20px;right:20px;background:#dc2626;color:#fff;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:16px;z-index:2">✕ סגור</button>
      <div style="position:absolute;top:24px;left:20px;color:#fff;font-size:22px;z-index:2">${escA(name)} <span style="color:#9ca3af;font-size:14px">CH${channel}</span></div>
      <iframe src="${escA(url)}" allow="autoplay; fullscreen" allowfullscreen style="width:96%;height:90%;border:0;background:#000;border-radius:8px"></iframe>
    `;
    modal.setAttribute('data-fs', '1');
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  };

  // ===== Override renderCameras =====
  function applyOverride() {
    window.renderCameras = renderCamerasIframeGrid;
    if (location.hash === '#cameras' || (document.getElementById('page-cameras') && !document.getElementById('page-cameras').classList.contains('d-none'))) {
      renderCamerasIframeGrid();
    }
  }

  if (document.readyState === 'complete') {
    setTimeout(applyOverride, 150);
  } else {
    window.addEventListener('load', () => setTimeout(applyOverride, 150));
  }
  window.addEventListener('hashchange', () => {
    if (location.hash === '#cameras') setTimeout(applyOverride, 80);
  });

  console.warn('%c🎥 Pack-78 — iframe to mediamtx built-in player (bypasses HLS session bugs)', 'color:#dc2626;font-weight:bold;font-size:14px');
})();
