// behavior-pack-81.js — Round 17: lazy-load iframes + live timestamp overlay. 2026-05-27
(function () {
  'use strict';

  // ===== Lazy-load iframes via IntersectionObserver =====
  // 11 iframes loading at once = heavy. Load only when visible.
  function applyLazyLoad() {
    if (!('IntersectionObserver' in window)) return;
    const cards = document.querySelectorAll('.cam-iframe-card');
    if (!cards.length || cards[0].dataset.lazyApplied81) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        const card = en.target;
        const iframe = card.querySelector('iframe');
        if (!iframe) return;
        if (en.isIntersecting) {
          // Restore src from data-src if deferred
          if (iframe.dataset.deferredSrc && !iframe.src) {
            iframe.src = iframe.dataset.deferredSrc;
            delete iframe.dataset.deferredSrc;
          }
        }
      });
    }, { rootMargin: '200px', threshold: 0.1 });

    // For cards beyond viewport, defer their iframe load
    cards.forEach((card, i) => {
      card.dataset.lazyApplied81 = '1';
      if (i >= 6) { // first 6 stay loaded; rest deferred
        const iframe = card.querySelector('iframe');
        if (iframe && iframe.src) {
          iframe.dataset.deferredSrc = iframe.src;
          iframe.removeAttribute('src');
          iframe.style.background = 'linear-gradient(135deg,#1f2937,#111827)';
          // Add placeholder
          const placeholder = document.createElement('div');
          placeholder.className = 'cam-defer-placeholder';
          placeholder.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#9ca3af;background:rgba(0,0,0,0.5);z-index:1;pointer-events:none';
          placeholder.innerHTML = '<i class="bi bi-camera-video-fill fs-1"></i><div class="small mt-2">גלול לטעון</div>';
          card.appendChild(placeholder);
          // Remove placeholder when src restored
          new MutationObserver((muts, obs) => {
            if (iframe.src) {
              placeholder.remove();
              obs.disconnect();
            }
          }).observe(iframe, { attributes: true, attributeFilter: ['src'] });
        }
      }
      observer.observe(card);
    });
    console.info('[Pack-81] lazy-load applied to', cards.length, 'cards');
  }

  // ===== Live timestamp overlay =====
  function applyLiveTimestamp() {
    const cards = document.querySelectorAll('.cam-iframe-card');
    cards.forEach(card => {
      if (card.dataset.tsApplied81) return;
      card.dataset.tsApplied81 = '1';
      const ts = document.createElement('div');
      ts.className = 'cam-live-ts';
      ts.style.cssText = 'position:absolute;top:8px;left:8px;background:rgba(220,38,38,0.85);color:#fff;padding:2px 8px;border-radius:8px;font-size:10px;font-family:monospace;z-index:2;pointer-events:none';
      card.appendChild(ts);
    });

    function updateTimestamps() {
      const now = new Date();
      const str = now.toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      document.querySelectorAll('.cam-live-ts').forEach(el => {
        el.textContent = '● LIVE ' + str;
      });
    }
    updateTimestamps();
    setInterval(updateTimestamps, 1000);
  }

  // Apply after renderCameras
  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const r = _orig.apply(this, arguments);
      setTimeout(() => {
        applyLazyLoad();
        applyLiveTimestamp();
      }, 500);
      return r;
    };
  }

  console.warn('%c⏱️ Pack-81 — Lazy-load iframes (first 6 only) + live timestamp', 'color:#0891b2;font-weight:bold');
})();
