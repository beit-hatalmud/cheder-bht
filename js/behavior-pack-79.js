// behavior-pack-79.js — Cameras: add "play all" button + try inject .play() to iframes. 2026-05-27
(function () {
  'use strict';

  // After cameras render, add a "Play all" overlay that user clicks once
  // to enable autoplay on all iframes.
  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const result = _orig.apply(this, arguments);
      setTimeout(addPlayAllButton, 400);
      return result;
    };
  }

  function addPlayAllButton() {
    const grid = document.getElementById('cam-grid');
    if (!grid || grid.dataset.playAll79) return;
    grid.dataset.playAll79 = '1';

    // Add big "press to start" overlay
    const overlay = document.createElement('div');
    overlay.id = 'play-all-overlay';
    overlay.style.cssText = `position:fixed;top:80px;right:50%;transform:translateX(50%);
      background:#dc2626;color:#fff;padding:14px 24px;border-radius:30px;
      font-size:18px;font-weight:bold;cursor:pointer;z-index:9999;
      box-shadow:0 8px 32px rgba(220,38,38,0.5);animation:bounce-79 1.5s infinite`;
    overlay.innerHTML = '▶ לחץ להפעלת כל המצלמות';
    overlay.onclick = () => {
      // Trigger autoplay via interaction
      grid.querySelectorAll('iframe').forEach(iframe => {
        try {
          // Reload iframe with autoplay
          const src = iframe.src;
          iframe.src = '';
          setTimeout(() => { iframe.src = src; }, 50);
        } catch (e) {}
      });
      overlay.remove();
      // Show toast
      if (typeof toast === 'function') toast('מצלמות מתחילות לעלות...', 'success');
    };
    document.body.appendChild(overlay);

    // Auto-hide after 60s
    setTimeout(() => { try { overlay.remove(); } catch {} }, 60000);

    // Add animation
    if (!document.getElementById('bounce-79-style')) {
      const st = document.createElement('style');
      st.id = 'bounce-79-style';
      st.textContent = `@keyframes bounce-79 { 0%,100% { transform:translateX(50%) scale(1) } 50% { transform:translateX(50%) scale(1.08) } }`;
      document.head.appendChild(st);
    }
  }

  console.warn('%c▶ Pack-79 — Play-all overlay for autoplay-blocked iframes', 'color:#dc2626;font-weight:bold');
})();
