// behavior-pack-82.js — CRITICAL: WebRTC direct via WHEP (bypass broken mediamtx HLS sessions). 2026-05-27
(function () {
  'use strict';

  const HLS_BASE_KEY = 'cameras_hls_base';
  const DEFAULT_HLS_BASE = 'https://oregon-knock-learn-corrections.trycloudflare.com';
  const WEBRTC_BASE_KEY = 'cameras_webrtc_base';
  const DEFAULT_WEBRTC_BASE = 'https://participation-seek-indexes-burner.trycloudflare.com';
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
  function getWebRtcBase() { return localStorage.getItem(WEBRTC_BASE_KEY) || DEFAULT_WEBRTC_BASE; }
  function escA(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

  // WHEP client - WebRTC pull from mediamtx
  // mediamtx WebRTC endpoint: POST /<path>/whep with SDP offer
  async function whepConnect(video, baseUrl, cameraPath) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    pc.ontrack = (e) => {
      if (video.srcObject !== e.streams[0]) {
        video.srcObject = e.streams[0];
        video.play().catch(err => console.warn('autoplay blocked', err));
      }
    };

    pc.onconnectionstatechange = () => {
      const card = video.closest('.cam-webrtc-card');
      const status = card?.querySelector('.cam-webrtc-status');
      if (status) {
        status.textContent = pc.connectionState;
        status.style.background = pc.connectionState === 'connected' ? '#22c55e' : pc.connectionState === 'failed' ? '#ef4444' : '#fbbf24';
      }
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const whepUrl = `${baseUrl}/${cameraPath}/whep`;
      const resp = await fetch(whepUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });
      if (!resp.ok) {
        console.warn(`WHEP failed for ${cameraPath}: ${resp.status}`);
        pc.close();
        return null;
      }
      const answerSdp = await resp.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      return pc;
    } catch (e) {
      console.error(`WHEP error ${cameraPath}:`, e);
      pc.close();
      return null;
    }
  }

  function renderCamerasWebRtc() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    const base = getWebRtcBase().replace(/\/$/, '');

    if (!document.getElementById('cam-webrtc-style-82')) {
      const st = document.createElement('style');
      st.id = 'cam-webrtc-style-82';
      st.textContent = `
        .cam-webrtc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
        .cam-webrtc-card { position:relative; background:#000; border-radius:8px; overflow:hidden; aspect-ratio:4/3; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
        .cam-webrtc-card video { width:100%; height:100%; object-fit:cover; background:#111; cursor:pointer; }
        .cam-webrtc-label { position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.75); color:#fff; padding:4px 10px; border-radius:14px; font-size:13px; font-weight:600; z-index:2; pointer-events:none; }
        .cam-webrtc-channel { position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.7); color:#9ca3af; padding:2px 8px; border-radius:8px; font-size:11px; font-family:monospace; z-index:2; pointer-events:none; }
        .cam-webrtc-status { position:absolute; top:8px; left:8px; background:#fbbf24; color:#fff; padding:2px 8px; border-radius:8px; font-size:10px; font-family:monospace; z-index:2; pointer-events:none; transition:background .3s; }
        .cam-webrtc-card:hover { box-shadow:0 6px 20px rgba(220,38,38,0.4); transform:scale(1.01); transition:all .15s; }
        @media (max-width:640px) { .cam-webrtc-grid { grid-template-columns:1fr 1fr !important; } }
      `;
      document.head.appendChild(st);
    }

    root.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="d-flex align-items-center mb-3 flex-wrap gap-2">
        <h3 class="me-3 mb-0"><i class="bi bi-camera-video-fill text-danger"></i> מצלמות לייב <small class="text-muted">(WebRTC)</small></h3>
        <span class="badge bg-danger">🔴 LIVE</span>
        <span class="badge bg-secondary">${CAMERAS.length} מצלמות</span>
        <button class="btn btn-sm btn-outline-secondary ms-auto" onclick="window.renderCameras && window.renderCameras()" title="רענן"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
      <div class="cam-webrtc-grid" id="cam-grid"></div>
      <div class="alert alert-success small mt-3">
        <i class="bi bi-broadcast"></i> WebRTC P2P · אין latency · אין session bugs של HLS
      </div>
    `;

    const grid = document.getElementById('cam-grid');
    grid.innerHTML = CAMERAS.map(c => `
      <div class="cam-webrtc-card" data-path="${escA(c.path)}">
        <video autoplay muted playsinline></video>
        <span class="cam-webrtc-label">${c.emoji} ${escA(c.name)}</span>
        <span class="cam-webrtc-channel">CH${c.channel}</span>
        <span class="cam-webrtc-status">connecting</span>
      </div>
    `).join('');

    // Connect WebRTC for each camera (parallel)
    CAMERAS.forEach(c => {
      const card = grid.querySelector(`.cam-webrtc-card[data-path="${c.path}"]`);
      if (!card) return;
      const video = card.querySelector('video');
      whepConnect(video, base, c.path).then(pc => {
        if (pc) card._pc = pc;
      });
    });

    // Click video → fullscreen
    grid.addEventListener('click', e => {
      const v = e.target.tagName === 'VIDEO' ? e.target : null;
      if (!v) return;
      if (document.fullscreenElement) document.exitFullscreen();
      else v.requestFullscreen().catch(()=>{});
    });
  }

  function applyOverride() {
    window.renderCameras = renderCamerasWebRtc;
    if (location.hash === '#cameras' || (document.getElementById('page-cameras') && !document.getElementById('page-cameras').classList.contains('d-none'))) {
      renderCamerasWebRtc();
    }
  }

  if (document.readyState === 'complete') {
    setTimeout(applyOverride, 200);
  } else {
    window.addEventListener('load', () => setTimeout(applyOverride, 200));
  }
  window.addEventListener('hashchange', () => {
    if (location.hash === '#cameras') setTimeout(applyOverride, 100);
  });

  console.warn('%c📡 Pack-82 — WebRTC direct via WHEP (bypasses broken HLS sessions)', 'color:#16a34a;font-weight:bold;font-size:14px');
})();
