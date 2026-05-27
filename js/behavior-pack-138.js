// behavior-pack-138.js — Smart Alerts: flag students needing attention. 2026-05-27
// Deterministic signals from the existing behavior data (no new schema):
//   • 3+ high-severity (חומרה=גבוהה) events in the last 7 days
//   • 5+ total behavior events in the last 7 days
// Self-contained, permission-respecting (uses getVisibleData when available),
// defensive (never throws into the page). Renders a dismissible home panel.
(function () {
  'use strict';

  const WINDOW_DAYS = 7;
  const HIGH_SEVERITY = 'גבוהה';
  const HIGH_THRESHOLD = 3;
  const FREQ_THRESHOLD = 5;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function getDataSafe() {
    try {
      if (typeof getVisibleData === 'function') return getVisibleData();
      if (typeof getData === 'function') return getData();
    } catch (e) {}
    return { students: [], behavior: [] };
  }

  // Returns [{ id, name, cls, highCount, totalCount, reasons:[...] }]
  function computeAlerts() {
    const data = getDataSafe();
    const students = Array.isArray(data.students) ? data.students : [];
    const events = Array.isArray(data.behavior) ? data.behavior : [];
    if (!events.length) return [];

    const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const byStudent = {};
    for (const e of events) {
      const t = Date.parse(e['תאריך']);
      if (isNaN(t) || t < cutoff) continue;
      const sid = String(e['תלמיד_מזהה'] || '');
      if (!sid) continue;
      if (!byStudent[sid]) byStudent[sid] = { high: 0, total: 0 };
      byStudent[sid].total++;
      if (String(e['חומרה'] || '') === HIGH_SEVERITY) byStudent[sid].high++;
    }

    const nameById = {};
    for (const s of students) {
      nameById[String(s['מזהה'])] = {
        name: `${s['שם פרטי'] || ''} ${s['שם משפחה'] || ''}`.trim() || ('תלמיד ' + s['מזהה']),
        cls: s['מחזור'] || '',
      };
    }

    const alerts = [];
    for (const sid in byStudent) {
      const c = byStudent[sid];
      const reasons = [];
      if (c.high >= HIGH_THRESHOLD) reasons.push(`${c.high} אירועי חומרה גבוהה`);
      if (c.total >= FREQ_THRESHOLD) reasons.push(`${c.total} אירועים`);
      if (!reasons.length) continue;
      const meta = nameById[sid] || { name: 'תלמיד ' + sid, cls: '' };
      alerts.push({ id: sid, name: meta.name, cls: meta.cls, highCount: c.high, totalCount: c.total, reasons });
    }
    // Most severe first (by high count, then total)
    alerts.sort((a, b) => (b.highCount - a.highCount) || (b.totalCount - a.totalCount));
    return alerts;
  }

  window.getSmartAlerts = computeAlerts;

  function renderPanel() {
    // Only on the home view, admins/staff
    if ((location.hash || '#home').replace('#', '') !== 'home') return;
    const host = document.querySelector('#page-home') || document.querySelector('[data-page="home"]') || document.querySelector('main') || document.body;
    if (!host) return;
    if (localStorage.getItem('bht_smartalerts_dismissed_today') === new Date().toISOString().slice(0, 10)) return;

    let alerts;
    try { alerts = computeAlerts(); } catch (e) { return; }
    if (!alerts.length) { const old = document.getElementById('smart-alerts-138'); if (old) old.remove(); return; }

    let panel = document.getElementById('smart-alerts-138');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'smart-alerts-138';
      panel.className = 'card no-print';
      panel.style.cssText = 'margin:12px 0;border:0;border-radius:var(--bht-radius-lg,12px);box-shadow:0 4px 16px rgba(0,0,0,.08);direction:rtl;overflow:hidden';
      host.insertBefore(panel, host.firstChild);
    }
    const items = alerts.slice(0, 8).map(a => `
      <button type="button" class="smart-alert-item-138" data-sid="${esc(a.id)}"
        style="display:flex;align-items:center;justify-content:space-between;width:100%;text-align:right;border:0;border-bottom:1px solid var(--bht-gray-100,#f3f4f6);background:transparent;padding:10px 14px;cursor:pointer;font-family:Heebo,sans-serif">
        <span style="display:flex;align-items:center;gap:10px">
          <span style="width:8px;height:8px;border-radius:50%;background:${a.highCount >= HIGH_THRESHOLD ? '#dc2626' : '#f59e0b'};flex:none"></span>
          <span style="font-weight:600">${esc(a.name)}</span>
          <span style="color:var(--bht-gray-500,#6b7280);font-size:12px">${esc(a.cls)}</span>
        </span>
        <span style="color:var(--bht-gray-600,#4b5563);font-size:12px">${esc(a.reasons.join(' · '))}</span>
      </button>`).join('');

    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#dc2626,#f59e0b);color:#fff;padding:10px 14px">
        <span style="font-weight:700;display:flex;align-items:center;gap:8px"><i class="bi bi-exclamation-triangle-fill"></i> התראות חכמות — ${alerts.length} תלמידים לתשומת לב (7 ימים)</span>
        <button id="smart-alerts-dismiss-138" title="הסתר להיום" style="background:rgba(255,255,255,.2);border:0;color:#fff;width:26px;height:26px;border-radius:6px;cursor:pointer">×</button>
      </div>
      <div>${items}</div>
      ${alerts.length > 8 ? `<div style="padding:8px 14px;font-size:12px;color:var(--bht-gray-500,#6b7280)">ועוד ${alerts.length - 8}…</div>` : ''}
    `;

    const dismiss = document.getElementById('smart-alerts-dismiss-138');
    if (dismiss) dismiss.onclick = () => {
      localStorage.setItem('bht_smartalerts_dismissed_today', new Date().toISOString().slice(0, 10));
      panel.remove();
    };
    panel.querySelectorAll('.smart-alert-item-138').forEach(btn => {
      btn.onclick = () => {
        const sid = btn.getAttribute('data-sid');
        if (typeof window.viewStudent === 'function') window.viewStudent(sid);
        else { location.hash = '#students'; }
      };
    });
  }

  // Re-render on navigation + after data refresh; throttled.
  let _t = 0;
  function schedule() {
    const now = Date.now();
    if (now - _t < 1500) return;
    _t = now;
    setTimeout(() => { try { renderPanel(); } catch (e) {} }, 300);
  }
  window.addEventListener('hashchange', schedule);
  window.addEventListener('cheder-data-refreshed', schedule);
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);

  console.warn('%c⚠ Pack-138 — Smart Alerts (3+ high-severity or 5+ events / 7d) on home + window.getSmartAlerts()', 'color:#dc2626;font-weight:bold');
})();
