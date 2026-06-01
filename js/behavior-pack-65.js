// behavior-pack-65.js — Live cameras grid using HLS.js (11 cameras from Beit HaTalmud DVR). 2026-05-26
(function () {
  'use strict';

  // Cloudflare Tunnel base URL for mediamtx HLS (will be set after tunnel created)
  const HLS_BASE_KEY = 'cameras_hls_base';
  // Default base — user-configurable
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

  function getBase() { return localStorage.getItem(HLS_BASE_KEY) || DEFAULT_HLS_BASE || ''; }
  function setBase(u) { if (u) localStorage.setItem(HLS_BASE_KEY, u); else localStorage.removeItem(HLS_BASE_KEY); }
  function escAttrL(s) { return String(s || '').replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c])); }

  // Load hls.js dynamically
  function loadHlsJs() {
    if (window.Hls) return Promise.resolve(window.Hls);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
      s.onload = () => resolve(window.Hls);
      s.onerror = () => reject(new Error('hls.js load failed'));
      document.head.appendChild(s);
    });
  }

  function attachHls(videoEl, url) {
    if (!url) return;
    const Hls = window.Hls;
    if (Hls && Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDuration: 2,
        liveMaxLatencyDuration: 5,
        maxBufferLength: 6,
        lowLatencyMode: false,
      });
      hls.loadSource(url);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          videoEl.parentNode.querySelector('.cam-status')?.classList.add('offline');
          hls.destroy();
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoEl.play().catch(() => {});
        videoEl.parentNode.querySelector('.cam-status')?.classList.add('live');
      });
      videoEl._hls = hls;
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      videoEl.src = url;
      videoEl.play().catch(() => {});
      videoEl.parentNode.querySelector('.cam-status')?.classList.add('live');
    }
  }

  function detachHls(videoEl) {
    try { videoEl._hls?.destroy(); } catch {}
    videoEl._hls = null;
    videoEl.removeAttribute('src');
  }

  window.renderCameras = async function () {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    const base = getBase();
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isAdmin = u.username === 'admin' || u.role === 'מנהל';

    const styleId = 'cam-grid-style';
    if (!document.getElementById(styleId)) {
      const st = document.createElement('style');
      st.id = styleId;
      st.textContent = `
        .cam-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
        .cam-card { position:relative; background:#000; border-radius:8px; overflow:hidden; aspect-ratio:4/3; }
        .cam-card video { width:100%; height:100%; object-fit:cover; background:#111; }
        .cam-label { position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.7); color:#fff; padding:4px 10px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px; }
        .cam-status { display:inline-block; width:8px; height:8px; border-radius:50%; background:#fbbf24; }
        .cam-status.live { background:#22c55e; box-shadow:0 0 6px #22c55e; animation:pulse 2s infinite; }
        .cam-status.offline { background:#ef4444; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .cam-channel { position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.6); color:#9ca3af; padding:2px 8px; border-radius:8px; font-size:11px; font-family:monospace; }
        .cam-card:hover .cam-expand { opacity:1; }
        .cam-expand { position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.7); color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; opacity:0; transition:opacity .2s; }
        .cam-fullscreen-modal { position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px; }
        .cam-fullscreen-modal video { max-width:100%; max-height:100%; }
        .cam-fullscreen-close { position:absolute; top:20px; right:20px; background:#dc2626; color:#fff; border:none; padding:10px 16px; border-radius:8px; cursor:pointer; font-size:16px; }
      `;
      document.head.appendChild(st);
    }

    root.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="d-flex align-items-center mb-3 flex-wrap gap-2">
        <h3 class="me-3 mb-0"><i class="bi bi-camera-video-fill text-danger"></i> מצלמות לייב</h3>
        <span class="badge bg-danger"><span class="cam-status live" style="background:#fff;box-shadow:0 0 4px #fff"></span> LIVE</span>
        <span class="badge bg-secondary">${CAMERAS.length} מצלמות</span>
        ${isAdmin ? `<button class="btn btn-sm btn-outline-primary ms-auto" onclick="window.openCamerasConfig()"><i class="bi bi-gear"></i> הגדרת HLS</button>` : ''}
      </div>
      ${!base ? `
        <div class="alert alert-warning">
          <b>אין URL מוגדר ל-mediamtx (HLS).</b><br>
          ${isAdmin ? `
            <button class="btn btn-warning btn-sm mt-2" onclick="window.openCamerasConfig()">הגדר עכשיו</button>
            <details class="mt-2 small">
              <summary>איך מקבלים URL?</summary>
              <ol class="mb-0 mt-2">
                <li>mediamtx פעיל ב-<code>127.0.0.1:8888</code></li>
                <li><code>cloudflared tunnel --url http://127.0.0.1:8888</code></li>
                <li>מדביקים URL בכפתור "הגדרת HLS"</li>
              </ol>
            </details>
          ` : 'פנה למנהל להגדרת URL.'}
        </div>
      ` : `
        <div class="cam-grid" id="cam-grid"></div>
        <div class="alert alert-info small mt-3">
          <i class="bi bi-info-circle"></i> שידור חי דרך HLS · המצלמות מתחילות תוך 2-5 שניות מהלחיצה · ה-DVR ב-LAN, ה-stream נחשף דרך Cloudflare Tunnel.
        </div>
      `}
    `;

    if (!base) return;

    // Load hls.js then attach all cameras
    try {
      await loadHlsJs();
    } catch (e) {
      root.querySelector('#cam-grid').innerHTML = '<div class="alert alert-danger">לא ניתן לטעון hls.js</div>';
      return;
    }

    const grid = document.getElementById('cam-grid');
    if (!grid) return;
    grid.innerHTML = CAMERAS.map(c => `
      <div class="cam-card" data-path="${c.path}">
        <video autoplay muted playsinline></video>
        <span class="cam-label">${c.emoji} ${escAttrL(c.name)} <span class="cam-status"></span></span>
        <span class="cam-channel">CH${c.channel}</span>
        <button class="cam-expand" data-path="${c.path}" title="מסך מלא">⛶</button>
      </div>
    `).join('');

    CAMERAS.forEach(c => {
      const card = grid.querySelector(`.cam-card[data-path="${c.path}"]`);
      if (!card) return;
      const video = card.querySelector('video');
      const url = base.replace(/\/$/, '') + '/' + c.path + '/index.m3u8';
      attachHls(video, url);
    });

    // Expand handler
    grid.querySelectorAll('.cam-expand').forEach(btn => {
      btn.onclick = (ev) => {
        ev.stopPropagation();
        const path = btn.dataset.path;
        const cam = CAMERAS.find(c => c.path === path);
        const url = base.replace(/\/$/, '') + '/' + path + '/index.m3u8';
        const modalEl = document.createElement('div');
        modalEl.className = 'cam-fullscreen-modal';
        modalEl.innerHTML = `
          <button class="cam-fullscreen-close" onclick="this.closest('.cam-fullscreen-modal').remove()">✕ סגור</button>
          <div style="position:absolute;top:20px;left:20px;color:#fff;font-size:24px">${cam.emoji} ${escAttrL(cam.name)} <span style="color:#9ca3af;font-size:14px">CH${cam.channel}</span></div>
          <video autoplay playsinline controls style="max-width:100%;max-height:100%;background:#000"></video>
        `;
        document.body.appendChild(modalEl);
        const v = modalEl.querySelector('video');
        attachHls(v, url);
        modalEl.addEventListener('click', e => {
          if (e.target === modalEl) {
            detachHls(v);
            modalEl.remove();
          }
        });
      };
    });
  };

  window.openCamerasConfig = function () {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.username !== 'admin' && u.role !== 'מנהל') {
      alert('רק מנהל יכול להגדיר');
      return;
    }
    const current = getBase();
    const html = `<div class="modal fade show" id="cam-cfg-modal" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-camera-video"></i> הגדרת mediamtx HLS</h5>
            <button class="btn-close" onclick="document.getElementById('cam-cfg-modal').remove()"></button>
          </div>
          <div class="modal-body">
            <label class="form-label">URL בסיס למשרת mediamtx (Cloudflare Tunnel)</label>
            <input id="cam-url" type="url" class="form-control" placeholder="https://abc.trycloudflare.com" value="${escAttrL(current)}" style="direction:ltr;font-family:monospace">
            <div class="small text-muted mt-2">
              צריך לעבוד עם <code>{base}/{camera_path}/index.m3u8</code> — דוגמה:<br>
              <code>${escAttrL(current || 'https://abc.trycloudflare.com')}/beit_midrash/index.m3u8</code>
            </div>
            <hr>
            <div class="small">
              <b>11 מצלמות מוגדרות:</b><br>
              ${CAMERAS.map(c => `${c.emoji} <code>${c.path}</code> = ${c.name}`).join(' · ')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger me-auto" onclick="if(confirm('למחוק URL?')){localStorage.removeItem('${HLS_BASE_KEY}');document.getElementById('cam-cfg-modal').remove();renderCameras();}">מחק</button>
            <button class="btn btn-secondary" onclick="document.getElementById('cam-cfg-modal').remove()">בטל</button>
            <button class="btn btn-primary" onclick="(()=>{
              const v=document.getElementById('cam-url').value.trim();
              if(!v){alert('הזן URL');return;}
              if(!/^https?:\\/\\//.test(v)){alert('URL חייב להתחיל ב-http:// או https://');return;}
              localStorage.setItem('${HLS_BASE_KEY}',v);
              document.getElementById('cam-cfg-modal').remove();
              renderCameras();
            })()">שמור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('cam-url').focus();
  };

  console.warn('%c📹 Pack-65 — Live camera grid (11 HLS streams)', 'color:#dc2626;font-weight:bold');
})();
