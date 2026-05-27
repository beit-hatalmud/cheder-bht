// behavior-pack-85.js — Round 21: cameras layout switcher + audio toggle + dblclick fullscreen. 2026-05-27
(function () {
  'use strict';

  const LAYOUT_KEY = 'cameras_layout_cols';
  const AUDIO_KEY = 'cameras_audio_enabled';

  function getLayoutCols() { return parseInt(localStorage.getItem(LAYOUT_KEY) || '3'); }
  function setLayoutCols(n) { localStorage.setItem(LAYOUT_KEY, String(n)); }
  function isAudioEnabled() { return localStorage.getItem(AUDIO_KEY) === '1'; }

  // ===== Apply layout columns CSS variable =====
  function applyLayout() {
    const cols = getLayoutCols();
    const grid = document.getElementById('cam-grid');
    if (!grid) return;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    console.info(`[Pack-85] layout: ${cols} cols`);
  }

  // ===== Inject toolbar with layout selector + audio toggle =====
  function injectToolbar() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    if (root.querySelector('#cam-toolbar-85')) return;
    const header = root.querySelector('.d-flex.align-items-center.mb-3');
    if (!header) return;

    const cols = getLayoutCols();
    const audio = isAudioEnabled();
    const toolbar = document.createElement('div');
    toolbar.id = 'cam-toolbar-85';
    toolbar.className = 'mb-3 d-flex gap-2 flex-wrap align-items-center';
    toolbar.innerHTML = `
      <small class="text-muted">פריסה:</small>
      <div class="btn-group btn-group-sm" role="group">
        <button class="btn btn-outline-secondary ${cols===1?'active':''}" onclick="window.camSetLayout(1)" title="1 בשורה (גדול)">⬜</button>
        <button class="btn btn-outline-secondary ${cols===2?'active':''}" onclick="window.camSetLayout(2)" title="2 בשורה">⬜⬜</button>
        <button class="btn btn-outline-secondary ${cols===3?'active':''}" onclick="window.camSetLayout(3)" title="3 בשורה">⬜⬜⬜</button>
        <button class="btn btn-outline-secondary ${cols===4?'active':''}" onclick="window.camSetLayout(4)" title="4 בשורה (קטן)">⬜⬜⬜⬜</button>
      </div>
      <button class="btn btn-sm btn-outline-${audio?'success':'secondary'}" onclick="window.camToggleAudio()" id="cam-audio-btn">
        ${audio ? '🔊 השתק' : '🔇 הפעל אודיו'}
      </button>
      <small class="text-muted ms-auto">לחץ פעמיים על מצלמה למסך מלא</small>
    `;
    header.parentNode.insertBefore(toolbar, header.nextSibling);
  }

  window.camSetLayout = function (cols) {
    setLayoutCols(cols);
    applyLayout();
    // Update toolbar
    document.querySelectorAll('#cam-toolbar-85 .btn-group .btn').forEach((b, i) => {
      b.classList.toggle('active', i + 1 === cols);
    });
  };

  window.camToggleAudio = function () {
    const newState = !isAudioEnabled();
    localStorage.setItem(AUDIO_KEY, newState ? '1' : '0');
    document.querySelectorAll('.cam-webrtc-card video').forEach(v => {
      v.muted = !newState;
    });
    const btn = document.getElementById('cam-audio-btn');
    if (btn) {
      btn.innerHTML = newState ? '🔊 השתק' : '🔇 הפעל אודיו';
      btn.classList.toggle('btn-outline-success', newState);
      btn.classList.toggle('btn-outline-secondary', !newState);
    }
  };

  // ===== Double-click fullscreen =====
  document.addEventListener('dblclick', e => {
    const v = e.target.closest('.cam-webrtc-card video');
    if (!v) return;
    e.preventDefault();
    if (document.fullscreenElement) document.exitFullscreen();
    else v.requestFullscreen().catch(() => {});
  });

  // Apply on every renderCameras call
  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const r = _orig.apply(this, arguments);
      setTimeout(() => {
        injectToolbar();
        applyLayout();
        // Apply audio setting
        const enabled = isAudioEnabled();
        document.querySelectorAll('.cam-webrtc-card video').forEach(v => { v.muted = !enabled; });
      }, 300);
      return r;
    };
  }

  console.warn('%c🎛 Pack-85 — Layout switcher (1/2/3/4 cols) + audio toggle + dblclick fullscreen', 'color:#7c3aed;font-weight:bold');
})();
