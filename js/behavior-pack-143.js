// behavior-pack-143.js — Silent JWT auto-refresh. 2026-05-28
// Keeps users logged in across long workdays. Backend issues 8-hour JWTs;
// this pack quietly hits action=refreshSession ~30min before expiry, swapping
// the stored bht_jwt with a fresh one. On refresh failure, does nothing —
// the session expires naturally and the user re-logs in normally.
(function () {
  'use strict';

  // Parse JWT exp without verifying signature (signature is server-side concern)
  function parseExpMs(jwt) {
    try {
      if (!jwt || typeof jwt !== 'string' || jwt.indexOf('.') < 0) return 0;
      const [payloadB64] = jwt.split('.');
      // payloadB64 may be base64-URL-safe; normalize
      const fixed = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
      const padded = fixed + '==='.slice((fixed.length + 3) % 4);
      const json = atob(padded);
      const p = JSON.parse(json);
      return Number(p.e) || 0;
    } catch (e) { return 0; }
  }

  function getJwt() {
    try { return sessionStorage.getItem('bht_jwt') || ''; } catch { return ''; }
  }
  function setJwt(v) {
    try { if (v) sessionStorage.setItem('bht_jwt', v); } catch {}
  }

  function getWebhookUrl() {
    if (typeof window.APPS_SCRIPT_URL === 'string') return window.APPS_SCRIPT_URL;
    return 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  }

  async function refreshOnce() {
    const cur = getJwt();
    if (!cur) return { ok: false, reason: 'no-session' };
    try {
      const body = new URLSearchParams({ action: 'refreshSession', session: cur, instance: 'bht' });
      const r = await fetch(getWebhookUrl(), {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!r.ok) return { ok: false, reason: 'http-' + r.status };
      const j = await r.json().catch(() => null);
      if (j && j.ok && j.session) {
        setJwt(j.session);
        return { ok: true, expires: j.expires };
      }
      return { ok: false, reason: (j && j.error) || 'no-session-in-response' };
    } catch (e) { return { ok: false, reason: (e && e.message) || String(e) }; }
  }

  // Decide when to refresh: aim for ~30min before exp. Bound between 5min
  // (impatient) and 2h (sanity), so we don't sit idle for 8h.
  function nextDelayMs() {
    const exp = parseExpMs(getJwt());
    if (!exp) return 0;
    const remaining = exp - Date.now();
    if (remaining <= 5 * 60 * 1000) return 5 * 60 * 1000; // already near expiry; refresh in 5min
    const target = remaining - 30 * 60 * 1000;
    return Math.max(5 * 60 * 1000, Math.min(target, 2 * 60 * 60 * 1000));
  }

  let _timer = null;
  function schedule() {
    if (_timer) clearTimeout(_timer);
    const delay = nextDelayMs();
    if (!delay) return; // no session yet
    _timer = setTimeout(async () => {
      const r = await refreshOnce();
      if (!r.ok) {
        // Silent failure — try again in 10min in case of transient issue.
        _timer = setTimeout(schedule, 10 * 60 * 1000);
        return;
      }
      schedule(); // re-arm based on new expiry
    }, delay);
  }

  // Schedule on first load + whenever sessionStorage changes (e.g., login)
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);
  // Re-schedule when a new login writes bht_jwt
  let _lastSeen = '';
  setInterval(() => {
    const cur = getJwt();
    if (cur && cur !== _lastSeen) { _lastSeen = cur; schedule(); }
  }, 30 * 1000);

  // Public manual trigger (debugging)
  window.refreshJwtNow = async function () {
    const r = await refreshOnce();
    console.warn('[refreshJwtNow]', r);
    return r;
  };

  console.warn('%c♻ Pack-143 — Silent JWT auto-refresh (30min before 8h expiry) + window.refreshJwtNow()', 'color:#0891b2;font-weight:bold');
})();
