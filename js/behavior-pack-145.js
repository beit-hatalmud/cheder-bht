// behavior-pack-145.js — Auto-Recovery (silent self-healing). 2026-05-28
// Every 5 minutes, while the tab is foreground:
//   • Pending writes stuck >10 min? → flushPending()
//   • _data.students empty >1h after login? → pullAllFromSheet()
//   • JWT exp <30 min? → refreshJwtNow()
// All silent. No banners. Logs to console.warn for diagnostics.
(function () {
  'use strict';
  const TICK_MS = 5 * 60 * 1000;
  const STUCK_QUEUE_MS = 10 * 60 * 1000;
  const STALE_DATA_MS = 60 * 60 * 1000;
  const JWT_REFRESH_SLACK_MS = 30 * 60 * 1000;
  let _lastFlushAttempt = 0;
  let _lastPullAttempt  = 0;
  let _loginAtMs        = 0;

  function jwtExpMs() {
    try {
      const t = sessionStorage.getItem('bht_jwt');
      if (!t || t.indexOf('.') < 0) return 0;
      const [p] = t.split('.');
      const fixed = p.replace(/-/g, '+').replace(/_/g, '/');
      const padded = fixed + '==='.slice((fixed.length + 3) % 4);
      const json = atob(padded);
      return Number(JSON.parse(json).e) || 0;
    } catch { return 0; }
  }

  function isLoggedIn() {
    try { return !!(sessionStorage.getItem('user') && JSON.parse(sessionStorage.getItem('user')).username); }
    catch { return false; }
  }

  function pendingCount() {
    try { return JSON.parse(localStorage.getItem('cheder_pending_writes') || '[]').length; }
    catch { return 0; }
  }

  function oldestPendingMs() {
    try {
      const list = JSON.parse(localStorage.getItem('cheder_pending_writes') || '[]');
      if (!list.length) return 0;
      let oldest = Infinity;
      for (const op of list) if (op.queuedAt && op.queuedAt < oldest) oldest = op.queuedAt;
      return oldest === Infinity ? 0 : oldest;
    } catch { return 0; }
  }

  function dataEmpty() {
    try {
      if (typeof getData === 'function') {
        const d = getData();
        return !d || !Array.isArray(d.students) || d.students.length === 0;
      }
    } catch {}
    return false;
  }

  async function tick() {
    if (document.hidden) return;
    if (!isLoggedIn()) return;
    if (!_loginAtMs) _loginAtMs = Date.now();

    // 1. Stuck queue?
    const count = pendingCount();
    if (count > 0) {
      const oldest = oldestPendingMs();
      if (oldest && (Date.now() - oldest) > STUCK_QUEUE_MS && (Date.now() - _lastFlushAttempt) > TICK_MS) {
        _lastFlushAttempt = Date.now();
        try { if (typeof flushPending === 'function') flushPending(); console.warn('[recovery] flushPending triggered, queue=' + count); }
        catch (e) { console.warn('[recovery] flushPending failed:', e.message); }
      }
    }

    // 2. Stale/empty data?
    if (dataEmpty() && (Date.now() - _loginAtMs) > STALE_DATA_MS && (Date.now() - _lastPullAttempt) > STALE_DATA_MS) {
      _lastPullAttempt = Date.now();
      try { if (typeof pullAllFromSheet === 'function') pullAllFromSheet(); console.warn('[recovery] pullAllFromSheet triggered (data empty 1h)'); }
      catch (e) { console.warn('[recovery] pull failed:', e.message); }
    }

    // 3. JWT near expiry?
    const exp = jwtExpMs();
    if (exp && (exp - Date.now()) < JWT_REFRESH_SLACK_MS && (exp - Date.now()) > 0) {
      try { if (typeof window.refreshJwtNow === 'function') { await window.refreshJwtNow(); console.warn('[recovery] JWT refreshed pre-expiry'); } }
      catch (e) { console.warn('[recovery] JWT refresh failed:', e.message); }
    }
  }

  setInterval(tick, TICK_MS);
  // Also tick immediately on regain-focus
  window.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(tick, 1500); });
  // Mark login moment when a fresh JWT lands
  let _seenJwt = '';
  setInterval(() => {
    try {
      const cur = sessionStorage.getItem('bht_jwt') || '';
      if (cur && cur !== _seenJwt) { _seenJwt = cur; _loginAtMs = Date.now(); }
    } catch {}
  }, 30000);

  console.warn('%c🩹 Pack-145 — Auto-recovery (stuck queue / stale data / JWT pre-expiry)', 'color:#0891b2;font-weight:bold');
})();
