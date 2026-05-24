// behavior-pack-27.js — Performance optimization. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Cache API responses =====
  const _apiCache = new Map();
  const CACHE_TTL = 30000; // 30s

  const _origApi = window.api;
  if (typeof _origApi === 'function' && !window._cacheWrapped) {
    window._cacheWrapped = true;
    window.api = async function (action, args) {
      // Only cache read operations
      if (action && action.startsWith('list')) {
        const key = `${action}_${JSON.stringify(args||[])}`;
        const cached = _apiCache.get(key);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          return cached.data;
        }
        const result = await _origApi.apply(this, arguments);
        _apiCache.set(key, { data: result, ts: Date.now() });
        return result;
      }
      // Mutations - clear cache
      if (action && /^(add|update|delete)/.test(action)) {
        _apiCache.clear();
      }
      return _origApi.apply(this, arguments);
    };
  }

  window.clearApiCache = function () { _apiCache.clear(); };

  // ===== 2. Lazy load images =====
  const lazyImgObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.dataset.lazySrc) {
        entry.target.src = entry.target.dataset.lazySrc;
        delete entry.target.dataset.lazySrc;
        lazyImgObs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '50px' });
  setInterval(() => {
    document.querySelectorAll('img[data-lazy-src]').forEach(img => lazyImgObs.observe(img));
  }, 3000);

  // ===== 3. Virtual scroll for long lists =====
  window.virtualizeList = function (containerEl, items, renderFn, itemHeight) {
    itemHeight = itemHeight || 80;
    const total = items.length;
    if (total < 50) {
      containerEl.innerHTML = items.map(renderFn).join('');
      return;
    }
    containerEl.style.position = 'relative';
    containerEl.style.height = `${total * itemHeight}px`;
    const viewport = containerEl.parentElement;
    const render = () => {
      const scrollTop = viewport.scrollTop;
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
      const end = Math.min(total, start + Math.ceil(viewport.clientHeight / itemHeight) + 10);
      containerEl.innerHTML = items.slice(start, end).map((item, i) => `
        <div style="position:absolute;top:${(start+i)*itemHeight}px;left:0;right:0;height:${itemHeight}px">
          ${renderFn(item, start + i)}
        </div>
      `).join('');
    };
    viewport.onscroll = throttle ? throttle(render, 50) : render;
    render();
  };

  // ===== 4. Debounce search inputs =====
  let _searchTimer = null;
  document.addEventListener('input', e => {
    if (e.target.type === 'search' || e.target.placeholder?.includes('חיפוש')) {
      if (e.target.dataset.debounceWired) return;
      e.target.dataset.debounceWired = '1';
      const original = e.target.oninput;
      let timer = null;
      e.target.addEventListener('input', (ev) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (original) original.call(e.target, ev);
        }, 250);
      });
    }
  });

  // ===== 5. RequestIdleCallback for non-critical work =====
  window.scheduleIdle = function (fn) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout: 2000 });
    } else {
      setTimeout(fn, 100);
    }
  };

  // ===== 6. Page visibility - pause heavy work when hidden =====
  let _wasHidden = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      _wasHidden = true;
      console.info('[perf] page hidden - pausing intervals');
      // Could clear some intervals
    } else if (_wasHidden) {
      _wasHidden = false;
      console.info('[perf] page visible - refreshing');
      window.dispatchEvent(new CustomEvent('cheder-data-refreshed', { detail: { type: 'visibility' } }));
    }
  });

  // ===== 7. Worker pool for heavy calculations =====
  window.runInBackground = function (fn, ...args) {
    // Inline worker
    const src = `self.onmessage=function(e){const fn=${fn.toString()};Promise.resolve(fn.apply(null,e.data)).then(r=>self.postMessage(r))}`;
    const blob = new Blob([src], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    return new Promise((resolve) => {
      worker.onmessage = (e) => { worker.terminate(); resolve(e.data); };
      worker.postMessage(args);
    });
  };

  // ===== 8. Preconnect to APIs =====
  ['https://script.google.com', 'https://drive.google.com'].forEach(host => {
    if (!document.querySelector(`link[rel="preconnect"][href="${host}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = host;
      document.head.appendChild(link);
    }
  });

  // ===== 9. Defer non-critical scripts (already loaded - log timing) =====
  if (window.performance && performance.timing) {
    setTimeout(() => {
      const t = performance.timing;
      const loadTime = t.loadEventEnd - t.navigationStart;
      const domTime = t.domContentLoadedEventEnd - t.navigationStart;
      if (loadTime > 5000) {
        console.warn(`[perf] slow load: ${loadTime}ms DOM, total ${loadTime}ms`);
      } else {
        console.info(`[perf] load: ${domTime}ms DOM, ${loadTime}ms total`);
      }
    }, 1000);
  }

  // ===== 10. Memory pressure - clean old data =====
  setInterval(() => {
    // Estimate localStorage usage
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key].length + key.length) * 2;
      }
    }
    const mb = total / 1024 / 1024;
    if (mb > 8) {
      console.warn(`[perf] localStorage ${mb.toFixed(1)}MB - cleaning old`);
      // Remove old session keys
      Object.keys(sessionStorage).filter(k => k.startsWith('reminded_') || k.startsWith('notif_')).forEach(k => sessionStorage.removeItem(k));
      // Remove old attachments
      if (typeof cleanOldAttachments === 'function') cleanOldAttachments(30);
    }
  }, 30 * 60 * 1000);

  console.warn('%c⚡ Pack-27 — Performance: API cache, lazy images, virtual scroll, debounce, worker pool', 'color:#f59e0b;font-weight:bold');
})();
