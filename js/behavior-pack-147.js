// behavior-pack-147.js — Anomalies banner from nightly health snapshot. 2026-05-28
// On admin login, fetches the latest health-YYYY-MM-DD.json (via action=getLatestHealth)
// and surfaces any anomalies (plain-passwords, missing-tab, row-drop, etc.).
// Cached 12h in localStorage so the network call is rare.
(function () {
  'use strict';

  const CACHE_KEY = 'bht_latest_health_v1';
  const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
  const DISMISS_KEY = 'bht_health_anomaly_dismissed_v1';

  function getWebhookUrl() {
    return window.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  }
  function isAdmin() {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u.role === 'מנהל' || u.username === 'admin' || u.permissions === 'all';
    } catch { return false; }
  }

  async function fetchLatest() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;
    } catch {}
    const session = sessionStorage.getItem('bht_jwt') || '';
    if (!session) return null;
    try {
      const body = new URLSearchParams({ action: 'getLatestHealth', session, instance: 'bht' });
      const r = await fetch(getWebhookUrl(), { method: 'POST', mode: 'cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
      if (!r.ok) return null;
      const j = await r.json().catch(() => null);
      if (!j || !j.ok) return null;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: j })); } catch {}
      return j;
    } catch { return null; }
  }

  function ensureStyle() {
    if (document.getElementById('hb-style-147')) return;
    const s = document.createElement('style');
    s.id = 'hb-style-147';
    s.textContent = `
      #hb-banner-147 { position:fixed; top:64px; left:14px; z-index:9984;
        background:#1e3a8a; color:#fff; border-left:4px solid #fbbf24;
        border-radius:8px; padding:10px 14px; max-width:380px; direction:rtl;
        font-family:Heebo,sans-serif; font-size:12.5px;
        box-shadow:0 6px 20px rgba(0,0,0,.22); }
      #hb-banner-147 .hb-title { font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
      #hb-banner-147 ul { margin:4px 0 6px; padding-inline-start:18px; line-height:1.5; }
      #hb-banner-147 button { background:rgba(255,255,255,.18); border:0; color:#fff;
        padding:3px 8px; border-radius:5px; cursor:pointer; font-size:11px; margin-inline-start:4px; }
      @media print { #hb-banner-147 { display:none !important; } }
    `;
    document.head.appendChild(s);
  }

  function renderBanner(data) {
    const health = data && data.health;
    if (!health || !Array.isArray(health.anomalies) || health.anomalies.length === 0) return;

    // Filter to ACTIONABLE anomalies only — ignore noisy ones
    const ACTIONABLE = health.anomalies.filter(a => /^plain-passwords:|^row-drop:|^missing-tab:|^empty-tab:/.test(a));
    if (ACTIONABLE.length === 0) return;

    const dismissedKey = (data.name || '') + '::' + ACTIONABLE.join('|');
    if (localStorage.getItem(DISMISS_KEY) === dismissedKey) return;
    if (document.getElementById('hb-banner-147')) return;
    ensureStyle();

    const lines = ACTIONABLE.slice(0, 6).map(a => {
      if (a.startsWith('plain-passwords:')) return `${a.split(':')[1]} משתמשים עם סיסמה plain — לעודד החלפה`;
      if (a.startsWith('row-drop:'))        return `ירידה משמעותית: ${a.slice(9)}`;
      if (a.startsWith('missing-tab:'))     return `לשונית חסרה: ${a.slice(12)}`;
      if (a.startsWith('empty-tab:'))       return `לשונית ריקה: ${a.slice(10)}`;
      return a;
    });

    const div = document.createElement('div');
    div.id = 'hb-banner-147';
    div.className = 'no-print';
    div.innerHTML = `
      <div class="hb-title">🛡 דוח בריאות לילי — ${data.name || ''}</div>
      <ul>${lines.map(l => `<li>${l.replace(/</g, '&lt;')}</li>`).join('')}</ul>
      <div style="text-align:left">
        <button id="hb-dismiss-147">סמן כנקרא</button>
      </div>
    `;
    document.body.appendChild(div);
    document.getElementById('hb-dismiss-147').onclick = () => {
      try { localStorage.setItem(DISMISS_KEY, dismissedKey); } catch {}
      div.remove();
    };
  }

  async function run() {
    if (!isAdmin()) return;
    const data = await fetchLatest();
    if (data) renderBanner(data);
  }

  // Run shortly after admin lands on home
  function schedule() {
    // delayed start to let login flow settle
    setTimeout(run, 7000);
  }
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);

  // Manual re-check
  window.checkLatestHealth = async function () {
    try { localStorage.removeItem(CACHE_KEY); } catch {}
    try { localStorage.removeItem(DISMISS_KEY); } catch {}
    const d = await fetchLatest();
    console.group('🛡 Latest health');
    if (d && d.health) {
      console.log('File:', d.name);
      console.log('Summary:', d.health.summary);
      console.log('Anomalies:', d.health.anomalies);
      console.log('Tabs:', d.health.tabs);
    } else console.log('(no health data)');
    console.groupEnd();
    return d;
  };

  console.warn('%c🛡 Pack-147 — Nightly health anomalies banner (admin only) + window.checkLatestHealth()', 'color:#1e3a8a;font-weight:bold');
})();
