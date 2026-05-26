// behavior-pack-72.js — Round 6: error boundary + perf + UX polish. 2026-05-26
(function () {
  'use strict';

  // ===== Global error catcher =====
  let errCount = 0;
  window.addEventListener('error', (e) => {
    errCount++;
    if (errCount > 50) return; // avoid spam
    console.warn(`[Pack-72] caught error #${errCount}:`, e.message, 'at', e.filename + ':' + e.lineno);
  });
  window.addEventListener('unhandledrejection', (e) => {
    errCount++;
    if (errCount > 50) return;
    console.warn(`[Pack-72] unhandled promise rejection:`, e.reason);
  });

  // ===== Slow-network indicator =====
  if (navigator.connection) {
    if (navigator.connection.effectiveType === 'slow-2g' || navigator.connection.effectiveType === '2g') {
      document.body.dataset.slowNet = '1';
      console.warn('[Pack-72] Slow network detected — disabling auto-play and large iframes');
    }
  }

  // ===== Console diagnostics command =====
  window.diagFull = function () {
    const d = typeof getVisibleData === 'function' ? getVisibleData() : {};
    console.group('🏥 cheder-bht diagnostic');
    console.log('User:', JSON.parse(sessionStorage.getItem('user') || '{}'));
    console.log('Students:', d.students?.length, 'TLA-linked:', d.students?.filter(s => s['תלא_pdf_id']).length);
    console.log('Behavior events:', d.behavior?.length);
    console.log('Conversations:', d.conversations?.length);
    console.log('Categories:', d.categories?.length);
    console.log('Cameras HLS base:', localStorage.getItem('cameras_hls_base'));
    console.log('Cameras live URL:', localStorage.getItem('cameras_live_url'));
    console.log('Packs loaded:', document.querySelectorAll('script[src*="behavior-pack"]').length);
    console.log('Modal stack:', document.querySelectorAll('.modal.show').length);
    console.log('LocalStorage keys:', Object.keys(localStorage).length);
    console.log('Last error count:', errCount);
    console.groupEnd();
    return 'See console';
  };

  // ===== Lazy-load heavy iframes (Drive PDF previews) =====
  const iframeObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting && en.target.dataset.lazyIframe) {
        en.target.src = en.target.dataset.lazyIframe;
        delete en.target.dataset.lazyIframe;
        iframeObserver.unobserve(en.target);
      }
    });
  }, { rootMargin: '200px' }) : null;

  // Patch iframe rendering — replace immediate src with data-lazy-iframe
  // Skip — risk of breaking existing iframes. Leave for later.

  // ===== Detect localStorage near quota =====
  try {
    const used = new Blob(Object.entries(localStorage).map(([k,v]) => k+v)).size;
    if (used > 4 * 1024 * 1024) {
      console.warn('[Pack-72] localStorage at', Math.round(used/1024), 'KB — consider cleanup');
    }
  } catch {}

  // ===== Auto-cleanup very old draft entries =====
  try {
    const now = Date.now();
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('draft_') || k.startsWith('autosave_')) {
        try {
          const v = JSON.parse(localStorage[k]);
          if (v.timestamp && now - v.timestamp > 30 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(k);
          }
        } catch {}
      }
    });
  } catch {}

  console.warn('%c🏥 Pack-72 — Error boundary + diagnostics + cleanup', 'color:#ef4444;font-weight:bold');
  console.log('  Try: diagFull()');
})();
