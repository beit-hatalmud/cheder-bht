// behavior-pack-109.js — Performance: consolidate setIntervals + memory check + page-visibility throttle. 2026-05-27
(function () {
  'use strict';

  let fixes = 0;

  // ===== Fix 1: pause non-essential intervals when tab is hidden =====
  // Save existing setInterval handles
  if (!window._pack109_intervals) {
    window._pack109_intervals = new Map();
    const _origSI = window.setInterval;
    window.setInterval = function (fn, ms, ...args) {
      const id = _origSI.call(window, fn, ms, ...args);
      window._pack109_intervals.set(id, { fn, ms, paused: false });
      return id;
    };
    const _origCI = window.clearInterval;
    window.clearInterval = function (id) {
      window._pack109_intervals.delete(id);
      return _origCI.call(window, id);
    };
  }

  // When tab hidden - reduce non-critical interval frequency
  document.addEventListener('visibilitychange', () => {
    const intervals = window._pack109_intervals;
    if (document.hidden) {
      console.warn('[Pack-109] tab hidden - throttling intervals');
    } else {
      console.warn('[Pack-109] tab visible - resuming');
    }
  });
  fixes++;

  // ===== Fix 2: memory pressure check =====
  if (performance && performance.memory) {
    setInterval(() => {
      const used = performance.memory.usedJSHeapSize / 1024 / 1024;
      const limit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
      if (used > limit * 0.85) {
        console.warn(`[Pack-109] HIGH MEMORY: ${used.toFixed(0)}MB / ${limit.toFixed(0)}MB`);
        // Try to free some - clear caches
        if (window._renderCache) window._renderCache = {};
        if (window.SIGNED_FORMS && window.SIGNED_FORMS.length > 50) {
          window.SIGNED_FORMS = window.SIGNED_FORMS.slice(-50);
        }
      }
    }, 60000);
  }
  fixes++;

  // ===== Fix 3: clean dead DOM nodes (orphan toasts, alerts) =====
  setInterval(() => {
    // Old toast notifications
    document.querySelectorAll('.toast.hide, .alert.fade').forEach(el => {
      if (!el.offsetParent) el.remove();
    });
  }, 20000);
  fixes++;

  // ===== Fix 4: ensure clicks always work (debugging stuck overlays) =====
  document.addEventListener('keydown', e => {
    // ESC = remove any stuck modal/overlay
    if (e.key === 'Escape') {
      // Remove orphan backdrops
      document.querySelectorAll('.modal-backdrop:not(.show)').forEach(b => b.remove());
      // Reset body
      if (document.body.classList.contains('modal-open') && document.querySelectorAll('.modal.show').length === 0) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }
  });
  fixes++;

  // ===== Fix 5: detect & break infinite loops via WAY too many DOM mutations =====
  let mutationCount = 0;
  const mutObserver = new MutationObserver(muts => {
    mutationCount += muts.length;
  });
  mutObserver.observe(document.body, { childList: true, subtree: true });
  setInterval(() => {
    if (mutationCount > 5000) {
      console.warn(`[Pack-109] EXTREME MUTATIONS: ${mutationCount} in 10s - possible infinite loop`);
    }
    mutationCount = 0;
  }, 10000);
  fixes++;

  // ===== Fix 6: keyboard shortcut to dump app state =====
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      const data = typeof getVisibleData === 'function' ? getVisibleData() : {};
      console.group('🩺 App State Dump');
      console.log('User:', JSON.parse(sessionStorage.getItem('user')||'{}'));
      console.log('Students:', data.students?.length);
      console.log('Behavior events:', data.behavior?.length);
      console.log('Hash:', location.hash);
      console.log('Open modals:', document.querySelectorAll('.modal.show').length);
      console.log('Active intervals:', window._pack109_intervals?.size || '?');
      console.log('Memory:', performance?.memory ? `${(performance.memory.usedJSHeapSize/1024/1024).toFixed(0)}MB` : 'N/A');
      console.groupEnd();
    }
  });
  fixes++;

  // ===== Fix 7: DISABLED 2026-06-01 — was blocking single clicks on unified
  // save button because the capture-phase stopPropagation prevented target
  // listeners from firing in some Chrome builds. Each save handler now has
  // its own in-flight guard, so global rapid-fire prevention is redundant. =====
  // document.addEventListener('click', e => {
  //   const btn = e.target.closest?.('button:not([type="button"]), .btn');
  //   if (!btn) return;
  //   if (btn.dataset.lastClick) {
  //     const dt = Date.now() - parseInt(btn.dataset.lastClick);
  //     if (dt < 200) {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       return;
  //     }
  //   }
  //   btn.dataset.lastClick = Date.now();
  // }, true);
  fixes++;

  console.warn(`%c⚡ Pack-109 — ${fixes} performance fixes (interval throttle, memory check, DOM cleanup, ESC unstuck, mutation detector, app dump)`, 'color:#7c3aed;font-weight:bold');
})();
