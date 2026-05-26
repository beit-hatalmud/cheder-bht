// behavior-pack-67.js — Bug fix round 1: camera resilience + TLA timing + UX polish. 2026-05-26
(function () {
  'use strict';

  // ===== Fix 1: Camera grid — add loading state + per-camera reconnect on error =====
  // Wait until pack-65 has loaded and renderCameras is defined
  const _origRenderCameras = window.renderCameras;
  if (typeof _origRenderCameras === 'function') {
    window.renderCameras = async function () {
      await _origRenderCameras.apply(this, arguments);
      // After render, enhance each video tile with loading + retry
      setTimeout(enhanceCameraTiles, 500);
    };
  }

  function enhanceCameraTiles() {
    const cards = document.querySelectorAll('#cam-grid .cam-card');
    cards.forEach(card => {
      if (card.dataset.pack67) return;
      card.dataset.pack67 = '1';
      const video = card.querySelector('video');
      if (!video) return;

      // Add loading overlay
      const loadEl = document.createElement('div');
      loadEl.className = 'cam-loading';
      loadEl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);color:#fff;font-size:14px;pointer-events:none;z-index:1;transition:opacity .3s';
      loadEl.innerHTML = '<div><div class="spinner-border spinner-border-sm" style="color:#fbbf24"></div><br>טוען…</div>';
      card.appendChild(loadEl);

      const hideLoad = () => { loadEl.style.opacity = '0'; setTimeout(() => loadEl.remove(), 400); };
      video.addEventListener('playing', hideLoad, { once: true });
      video.addEventListener('loadeddata', hideLoad, { once: true });

      // Error overlay (shows after a delay if no data)
      let failTimer = setTimeout(() => {
        if (video.readyState < 2) {
          const errEl = document.createElement('div');
          errEl.className = 'cam-err';
          errEl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);color:#fff;z-index:2;text-align:center;padding:10px';
          errEl.innerHTML = `<div>
            <i class="bi bi-camera-video-off fs-3 text-warning"></i><br>
            <small>המצלמה לא נטענת</small><br>
            <button class="btn btn-sm btn-warning mt-2" style="font-size:12px">🔄 נסה שוב</button>
          </div>`;
          card.appendChild(errEl);
          errEl.querySelector('button').onclick = () => {
            errEl.remove();
            // Re-attach HLS
            const path = card.dataset.path;
            const base = localStorage.getItem('cameras_hls_base') || '';
            if (base && path && window.Hls) {
              try { video._hls?.destroy(); } catch {}
              const url = base.replace(/\/$/, '') + '/' + path + '/index.m3u8';
              const hls = new window.Hls({ liveSyncDuration: 2, maxBufferLength: 6 });
              hls.loadSource(url);
              hls.attachMedia(video);
              hls.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
              video._hls = hls;
            }
          };
        }
      }, 15000);

      video.addEventListener('playing', () => clearTimeout(failTimer));
    });
  }

  // ===== Fix 2: TLA tab — also inject on tab-button-click in case modal already open =====
  // Handle case where pack-66 misses the modal due to MutationObserver timing
  setInterval(() => {
    const modal = document.getElementById('viewStuModal');
    if (modal && !modal.querySelector('#stu-tab-tla') && typeof window.injectTlaTab === 'function') {
      // Pack-66 didn't inject. Trigger by simulating event.
      const tabsList = modal.querySelector('#stu-tabs');
      if (tabsList) {
        modal.dataset.tlaInjected = '';
        document.dispatchEvent(new Event('shown.bs.modal', { bubbles: true }));
      }
    }
  }, 3000);

  // ===== Fix 3: Ensure cameras grid scrolls properly on mobile =====
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 640px) {
      .cam-grid { grid-template-columns: 1fr 1fr !important; }
      .cam-label { font-size: 11px !important; padding: 3px 6px !important; }
      .cam-channel { font-size: 9px !important; }
    }
    .cam-card { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    .cam-card:hover { box-shadow: 0 4px 16px rgba(220,38,38,0.3); }
  `;
  document.head.appendChild(style);

  console.warn('%c🔧 Pack-67 — Camera resilience + TLA timing + UX', 'color:#16a34a;font-weight:bold');
})();
