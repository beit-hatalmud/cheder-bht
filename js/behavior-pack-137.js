// behavior-pack-137.js — AuthV2 readiness probe + admin status banner. 2026-05-27
// After backend deploy of AuthV2.js+ValidateV2.js, this pack tells admin what's still pending
// (Script Properties: PWD_SALT, JWT_SECRET) without ever changing the actual login flow.
(function () {
  'use strict';

  const WEBHOOK = window.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const DISMISS_KEY = 'bht_v2_probe_dismissed_v1';
  const PROBE_CACHE_KEY = 'bht_v2_probe_result';
  const PROBE_CACHE_TTL = 10 * 60 * 1000; // 10 min

  function isAdmin() {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u.username === 'admin' || u.role === 'מנהל';
    } catch { return false; }
  }

  async function probe() {
    // Cache: 10 minutes — backend doesn't change frequently
    try {
      const cached = JSON.parse(localStorage.getItem(PROBE_CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < PROBE_CACHE_TTL) return cached.status;
    } catch {}

    let status = { state: 'unknown', detail: '', timestamp: Date.now() };
    try {
      // Bench probe: try login with intentionally-wrong creds
      const url = `${WEBHOOK}?action=login&username=__probe__&password=__probe__&_t=${Date.now()}`;
      const r = await fetch(url, { method: 'GET', mode: 'cors' });
      const body = await r.text();
      let json = null;
      try { json = JSON.parse(body); } catch {}

      if (json && json.ok === false) {
        if (/unknown.*action|action.*not.*found|unsupported/i.test(json.error || '')) {
          status.state = 'missing'; status.detail = 'action=login לא קיים — לא נפרס AuthV2';
        } else if (/missing.*salt|missing.*secret|PWD_SALT|JWT_SECRET|server.*config|properties/i.test(json.error || '')) {
          status.state = 'config_pending'; status.detail = 'AuthV2 נפרס, חסר Script Properties (PWD_SALT/JWT_SECRET)';
        } else if (/unauthorized|invalid.*credentials|user.*not.*found/i.test(json.error || '')) {
          status.state = 'ready'; status.detail = 'AuthV2 פעיל — דחה credentials שגויים כצפוי';
        } else {
          status.state = 'unexpected'; status.detail = 'תשובה לא צפויה: ' + (json.error || '').slice(0, 100);
        }
      } else if (json && json.ok === true) {
        status.state = 'unexpected'; status.detail = 'בקשת בדיקה אישרה login עם credentials שגויים (!) — חשד לבאג';
      } else if (r.status >= 500) {
        status.state = 'server_error'; status.detail = `HTTP ${r.status}`;
      } else {
        status.state = 'no_json'; status.detail = body.slice(0, 120);
      }
    } catch (e) {
      status.state = 'network'; status.detail = e.message;
    }

    try { localStorage.setItem(PROBE_CACHE_KEY, JSON.stringify({ ts: Date.now(), status })); } catch {}
    return status;
  }

  function showBanner(status) {
    if (document.getElementById('bht-v2-banner-137')) return;
    if (localStorage.getItem(DISMISS_KEY) === status.state) return; // already dismissed THIS state

    const palette = {
      ready: { bg: '#16a34a', emoji: '✓', title: 'AuthV2 פעיל בייצור', body: status.detail },
      config_pending: { bg: '#f59e0b', emoji: '⚙', title: 'AuthV2 נפרס — חסרה הגדרה אחרונה', body: 'הוסף ב-Apps Script → Project Settings → Script Properties:\nPWD_SALT (string אקראי) · JWT_SECRET (string אקראי)\nאז: הרץ migrateLegacyPasswords()' },
      missing: { bg: '#dc2626', emoji: '✗', title: 'AuthV2 לא נמצא בבקאנד', body: 'הפעל GitHub Actions: gh workflow run deploy-appscript.yml' },
      unexpected: { bg: '#dc2626', emoji: '⚠', title: 'תגובת בקאנד חריגה', body: status.detail },
      network: { bg: '#6b7280', emoji: '⏸', title: 'אין רשת לבקאנד', body: status.detail },
      server_error: { bg: '#dc2626', emoji: '✗', title: 'שגיאת שרת', body: status.detail },
      no_json: { bg: '#6b7280', emoji: '?', title: 'תגובה לא JSON', body: status.detail },
      unknown: { bg: '#6b7280', emoji: '?', title: 'מצב לא ידוע', body: status.detail },
    };
    const p = palette[status.state] || palette.unknown;

    const banner = document.createElement('div');
    banner.id = 'bht-v2-banner-137';
    banner.className = 'no-print';
    banner.style.cssText = `position:fixed;top:60px;right:20px;background:${p.bg};color:#fff;padding:12px 16px;border-radius:8px;z-index:9985;box-shadow:0 6px 20px rgba(0,0,0,0.25);max-width:420px;direction:rtl;font-size:13px;font-family:Heebo,sans-serif`;
    banner.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:10px">
        <span style="font-size:22px;line-height:1">${p.emoji}</span>
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:4px">${p.title}</div>
          <div style="font-size:11px;opacity:0.92;white-space:pre-line;line-height:1.45">${p.body.replace(/</g,'&lt;')}</div>
        </div>
        <button id="v2-dismiss-137" style="background:rgba(255,255,255,0.2);border:0;color:#fff;width:24px;height:24px;border-radius:4px;cursor:pointer;font-size:14px" title="הסתר">×</button>
      </div>
    `;
    document.body.appendChild(banner);
    document.getElementById('v2-dismiss-137').onclick = () => {
      localStorage.setItem(DISMISS_KEY, status.state);
      banner.remove();
    };
  }

  // Public command
  window.checkAuthV2Status = async function () {
    try { localStorage.removeItem(PROBE_CACHE_KEY); } catch {}
    try { localStorage.removeItem(DISMISS_KEY); } catch {}
    const s = await probe();
    showBanner(s);
    console.group('🔐 AuthV2 Status');
    console.log('State:', s.state);
    console.log('Detail:', s.detail);
    console.groupEnd();
    return s;
  };

  // Auto-run on load for admin (delayed so login completes first)
  function autoRun() {
    setTimeout(async () => {
      if (!isAdmin()) return;
      const s = await probe();
      // Only show banner for actionable states
      if (['config_pending', 'missing', 'unexpected', 'server_error'].includes(s.state)) {
        showBanner(s);
      }
    }, 6000);
  }

  if (document.readyState === 'complete') autoRun();
  else window.addEventListener('load', autoRun);

  console.warn('%c🔐 Pack-137 — AuthV2 readiness probe (admin banner) + window.checkAuthV2Status()', 'color:#7c3aed;font-weight:bold');
})();
