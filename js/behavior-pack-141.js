// behavior-pack-141.js — Admin Command Center widgets on home view. 2026-05-28
// 4 widgets, admin-only, rendered at the TOP of #page-home with skeleton
// loaders shown until data is available (zero layout shift: card heights are
// fixed). All metrics derived from already-synced data — no new endpoints.
//
//   1. תלמידים פעילים           — count of students with status פעיל
//   2. אירועי חומרה גבוהה (7 ימ) — behavior events חומרה=גבוהה in last 7 days
//   3. משימות פתוחות             — tasks whose סטטוס is not 'הושלם'
//   4. טפסים ממתינים              — signatures whose סטטוס is 'מחכה'
(function () {
  'use strict';

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const CARD_HEIGHT = 108; // px — fixed so skeleton ≡ filled card (no CLS)

  function isAdmin() {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u.role === 'מנהל' || u.username === 'admin' || u.permissions === 'all';
    } catch { return false; }
  }

  function getDataSafe() {
    try {
      if (typeof getData === 'function') return getData();
    } catch (e) {}
    return null;
  }

  function compute(data) {
    if (!data) return null;
    const students = Array.isArray(data.students) ? data.students : [];
    const behavior = Array.isArray(data.behavior) ? data.behavior : [];
    const tasks    = Array.isArray(data.tasks)    ? data.tasks    : [];
    const sigs     = Array.isArray(data.signatures) ? data.signatures : [];

    const active = students.filter(s => (s['סטטוס'] || 'פעיל') === 'פעיל').length;

    const cutoff = Date.now() - SEVEN_DAYS_MS;
    let severeWeek = 0;
    for (const e of behavior) {
      const t = Date.parse(e['תאריך']);
      if (isNaN(t) || t < cutoff) continue;
      if (String(e['חומרה'] || '') === 'גבוהה') severeWeek++;
    }

    // tasks: count those whose status is anything except 'הושלם'.
    const openTasks = tasks.filter(t => {
      const st = String(t['סטטוס'] || '');
      return st && st !== 'הושלם';
    }).length;

    const pendingSigs = sigs.filter(s => String(s['סטטוס'] || '') === 'מחכה').length;

    return {
      active, total: students.length, severeWeek, openTasks, pendingSigs,
    };
  }

  function ensureStyle() {
    if (document.getElementById('cc-style-141')) return;
    const s = document.createElement('style');
    s.id = 'cc-style-141';
    s.textContent = `
      #cmd-center-141 { margin: 16px 0 22px; }
      #cmd-center-141 .cc-row { display: grid; gap: 14px;
        grid-template-columns: repeat(4, minmax(0, 1fr)); }
      @media (max-width: 992px) { #cmd-center-141 .cc-row { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 576px) { #cmd-center-141 .cc-row { grid-template-columns: 1fr; } }
      #cmd-center-141 .cc-card {
        position: relative;
        height: ${CARD_HEIGHT}px;
        border-radius: 14px; padding: 14px 16px;
        color: #fff; overflow: hidden; direction: rtl;
        font-family: Heebo, sans-serif;
        box-shadow: 0 6px 20px rgba(0,0,0,.10);
        transition: transform .18s ease, box-shadow .18s ease;
      }
      #cmd-center-141 .cc-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,.18); }
      #cmd-center-141 .cc-icon { position:absolute; top:10px; left:14px; opacity:.18; font-size:54px; line-height:1; pointer-events:none }
      #cmd-center-141 .cc-num  { font-size: 38px; font-weight: 800; line-height: 1; margin-top: 6px; }
      #cmd-center-141 .cc-num small { font-size: 16px; font-weight: 500; opacity: .85; margin-inline-start: 6px; }
      #cmd-center-141 .cc-label { font-size: 12.5px; opacity: .92; font-weight: 600; }
      #cmd-center-141 .cc-blue   { background: linear-gradient(135deg,#1e3a8a,#3b82f6); }
      #cmd-center-141 .cc-red    { background: linear-gradient(135deg,#991b1b,#dc2626); }
      #cmd-center-141 .cc-amber  { background: linear-gradient(135deg,#92400e,#f59e0b); }
      #cmd-center-141 .cc-purple { background: linear-gradient(135deg,#5b21b6,#8b5cf6); }
      /* Skeleton */
      #cmd-center-141 .cc-card.is-skel { background:#e5e7eb; color:transparent; box-shadow:none; }
      #cmd-center-141 .cc-card.is-skel::after {
        content:""; position:absolute; inset:0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent);
        animation: cc141-shimmer 1.4s infinite;
      }
      @keyframes cc141-shimmer { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
      #cmd-center-141 .cc-foot { font-size:11px; color:var(--bht-gray-500,#6b7280); text-align:left; margin-top:6px; padding-inline-end:4px; }
      @media print { #cmd-center-141 { display:none !important; } }
    `;
    document.head.appendChild(s);
  }

  function fmtAgo(ms) {
    if (!ms) return '';
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 5)  return 'עכשיו';
    if (s < 60) return `לפני ${s} שניות`;
    const m = Math.floor(s / 60);
    if (m < 60) return `לפני ${m} ד׳`;
    const h = Math.floor(m / 60);
    return `לפני ${h} שע׳`;
  }

  function buildShell() {
    if (document.getElementById('cmd-center-141')) return document.getElementById('cmd-center-141');
    const home = document.getElementById('page-home');
    if (!home) return null;
    ensureStyle();
    const wrap = document.createElement('div');
    wrap.id = 'cmd-center-141';
    wrap.className = 'no-print';
    wrap.innerHTML = `
      <div class="cc-row">
        <div class="cc-card cc-blue is-skel"   data-w="active">  <i class="bi bi-people-fill cc-icon"></i>          <div class="cc-label">תלמידים פעילים</div>     <div class="cc-num">—</div></div>
        <div class="cc-card cc-red is-skel"    data-w="severe">  <i class="bi bi-exclamation-triangle-fill cc-icon"></i><div class="cc-label">אירועי חומרה גבוהה · 7י׳</div><div class="cc-num">—</div></div>
        <div class="cc-card cc-amber is-skel"  data-w="tasks">   <i class="bi bi-list-check cc-icon"></i>           <div class="cc-label">משימות פתוחות</div>       <div class="cc-num">—</div></div>
        <div class="cc-card cc-purple is-skel" data-w="sigs">    <i class="bi bi-file-earmark-text cc-icon"></i>    <div class="cc-label">טפסים ממתינים לחתימה</div> <div class="cc-num">—</div></div>
      </div>
      <div class="cc-foot" data-foot-141>—</div>
    `;
    // Insert as the FIRST child of #page-home (above existing groups)
    home.insertBefore(wrap, home.firstChild);
    return wrap;
  }

  function fill(metrics) {
    const wrap = document.getElementById('cmd-center-141');
    if (!wrap) return;
    const setCard = (key, value, sub) => {
      const card = wrap.querySelector(`.cc-card[data-w="${key}"]`);
      if (!card) return;
      card.classList.remove('is-skel');
      const num = card.querySelector('.cc-num');
      if (!num) return;
      num.innerHTML = String(value) + (sub ? ` <small>${sub}</small>` : '');
    };
    setCard('active', metrics.active, metrics.total > metrics.active ? ` / ${metrics.total}` : '');
    setCard('severe', metrics.severeWeek);
    setCard('tasks', metrics.openTasks);
    setCard('sigs', metrics.pendingSigs);
    // Footer: freshness — when did getData() last refresh from sheet?
    const foot = wrap.querySelector('[data-foot-141]');
    if (foot) {
      const last = (window._bhtLastDataSync || 0) || Date.now();
      foot.textContent = 'מעודכן ' + fmtAgo(last);
    }
  }

  // Listen for sheet-data refresh events to set the timestamp
  window.addEventListener('cheder-data-refreshed', () => { window._bhtLastDataSync = Date.now(); });

  function tick() {
    if (!isAdmin()) {
      const w = document.getElementById('cmd-center-141');
      if (w) w.remove();
      return;
    }
    // Only render on the home view
    const home = document.getElementById('page-home');
    if (!home || home.classList.contains('d-none')) {
      // Build shell anyway — home will reveal it when navigating
      buildShell();
      return;
    }
    buildShell();
    const data = getDataSafe();
    const m = compute(data);
    if (m) fill(m);
  }

  // Re-render whenever data refreshes or user navigates
  let _t = 0;
  function schedule() {
    const now = Date.now();
    if (now - _t < 800) return;
    _t = now;
    setTimeout(() => { try { tick(); } catch (e) { /* defensive */ } }, 200);
  }
  window.addEventListener('hashchange', schedule);
  window.addEventListener('cheder-data-refreshed', schedule);

  // Poll every 30s for fresh numbers (data syncs in background)
  setInterval(schedule, 30000);

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);

  window.refreshCommandCenter = tick;
  console.warn('%c📊 Pack-141 — Admin Command Center (4 widgets + skeleton loaders, admin only)', 'color:#1e3a8a;font-weight:bold');
})();
