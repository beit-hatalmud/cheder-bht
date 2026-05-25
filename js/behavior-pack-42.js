// behavior-pack-42.js — Sheet sync + error recovery. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Auto-retry failed API calls =====
  const _origApi = window.api;
  if (typeof _origApi === 'function' && !window._retryWrapped) {
    window._retryWrapped = true;
    window.api = async function (action, args) {
      let lastErr;
      for (let i = 0; i < 3; i++) {
        try {
          const r = await _origApi.apply(this, arguments);
          if (r && r.ok !== false) return r;
          if (r && (r.error === 'lock_timeout' || r.error === 'rate_limit_exceeded')) {
            await new Promise(res => setTimeout(res, 500 * (i+1)));
            continue;
          }
          return r;
        } catch (e) {
          lastErr = e;
          if (i < 2) await new Promise(res => setTimeout(res, 500 * (i+1)));
        }
      }
      throw lastErr || new Error('api_failed');
    };
  }

  // ===== 2. Pending writes queue (for offline) =====
  window._pendingWrites = JSON.parse(localStorage.getItem('bht_pending_writes') || '[]');

  async function flushPendingWrites() {
    if (!navigator.onLine || !_pendingWrites.length) return;
    const queue = [..._pendingWrites];
    for (let i = 0; i < queue.length; i++) {
      try {
        await api(queue[i].action, queue[i].args);
        _pendingWrites = _pendingWrites.filter(w => w.id !== queue[i].id);
      } catch (_) { break; }
    }
    localStorage.setItem('bht_pending_writes', JSON.stringify(_pendingWrites));
  }
  window.addEventListener('online', flushPendingWrites);
  setInterval(flushPendingWrites, 30000);

  // ===== 3. Error boundary =====
  window.addEventListener('error', e => {
    console.warn('[error boundary]', e.message);
    if (typeof notify === 'function') notify(`שגיאת JS: ${String(e.message).substring(0,80)}`, 'warn');
  });

  // ===== 4. Detect data inconsistency =====
  setInterval(async () => {
    try {
      const r = await api('listStudents', []);
      const ids = (r.data || []).map(s => s['מזהה']);
      const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dups.length) console.warn('[integrity] duplicate student IDs:', dups);
    } catch (_) {}
  }, 5 * 60 * 1000);

  // ===== 5. Server-side error handling =====
  window.handleServerError = function (response) {
    if (!response) return false;
    if (response.error === 'lock_timeout') {
      if (typeof toast === 'function') toast('המערכת עסוקה - נסה שוב', 'warn');
      return true;
    }
    if (response.error === 'rate_limit') {
      if (typeof toast === 'function') toast('יותר מדי בקשות - המתן דקה', 'warn');
      return true;
    }
    if (response.errors) {
      const msg = response.errors.map(e => `${e.field}: ${e.error}`).join(', ');
      if (typeof toast === 'function') toast(msg, 'error');
      return true;
    }
    return false;
  };

  // ===== 6. Cache invalidation strategy =====
  window.invalidateLocalCache = function (action) {
    if (window._apiCache) {
      [...window._apiCache.keys()].forEach(k => {
        if (k.startsWith(action.replace(/^(add|update|delete)/, 'list'))) {
          window._apiCache.delete(k);
        }
      });
    }
  };

  // ===== 7. Health monitor =====
  let _healthChecks = 0;
  let _healthFails = 0;
  setInterval(async () => {
    try {
      await api('ping', []);
      _healthChecks++;
    } catch (_) {
      _healthFails++;
      if (_healthFails > 3) {
        if (typeof notify === 'function') notify('⚠ בעיית חיבור לשרת', 'error');
        _healthFails = 0;
      }
    }
  }, 60000);

  // ===== 8. Auto-recover from quota errors =====
  window.handleQuotaError = function () {
    // Clean old data from localStorage
    const keys = ['bht_audit_log', 'bht_attachments', 'bht_search_history'];
    keys.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
    if (typeof toast === 'function') toast('שטח אחסון נוקה - נסה שוב', 'info');
  };

  // ===== 9. Service worker update prompt =====
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (typeof toast === 'function') toast('🔄 גרסה חדשה זמינה - רענן את הדף', 'info', 10000);
    });
  }

  // ===== 10. Sync indicator =====
  let _syncState = 'idle';
  window.setSyncState = function (state) {
    _syncState = state;
    let ind = document.getElementById('sync-state-ind');
    if (!ind) {
      ind = document.createElement('div');
      ind.id = 'sync-state-ind';
      ind.style.cssText = 'position:fixed;bottom:4px;right:4px;font-size:10px;color:#9ca3af;z-index:9990';
      document.body.appendChild(ind);
    }
    const icons = { idle: '○', syncing: '◐', ok: '●', error: '⚠' };
    ind.textContent = icons[state] || '?';
    ind.style.color = state === 'ok' ? '#16a34a' : state === 'error' ? '#dc2626' : state === 'syncing' ? '#f59e0b' : '#9ca3af';
  };

  console.warn('%c🔄 Pack-42 — Sync: retry, pending writes, error boundary, integrity check, health monitor', 'color:#0891b2;font-weight:bold');
})();
