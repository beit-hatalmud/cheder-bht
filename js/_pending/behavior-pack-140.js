// behavior-pack-139.js — Offline mode badge + queue counter in header. 2026-05-28
// Reads navigator.onLine + the existing localStorage 'cheder_pending_writes'
// queue + the bhtIdbQueue.count() durability mirror. Polls + reacts to events.
(function () {
  'use strict';

  function ensureStyle() {
    if (document.getElementById('off-badge-style-139')) return;
    const s = document.createElement('style');
    s.id = 'off-badge-style-139';
    s.textContent = `
      #off-badge-139 { display:inline-flex; align-items:center; gap:6px; padding:4px 10px;
        border-radius:999px; font-size:11.5px; font-weight:600; line-height:1; direction:rtl;
        cursor:default; user-select:none; transition: background .2s, color .2s, transform .15s;
        font-family: Heebo, sans-serif; }
      #off-badge-139.is-online   { background:#dcfce7; color:#166534; }
      #off-badge-139.is-offline  { background:#fee2e2; color:#991b1b; animation: offBadgePulse139 1.8s infinite; }
      #off-badge-139.has-queue   { background:#fef3c7; color:#92400e; }
      #off-badge-139:hover { transform: scale(1.04); }
      #off-badge-139 .dot { width:8px; height:8px; border-radius:50%; background:currentColor; opacity:.7 }
      @keyframes offBadgePulse139 { 0%,100%{opacity:1} 50%{opacity:.65} }
      @media print { #off-badge-139 { display:none !important; } }
    `;
    document.head.appendChild(s);
  }

  function host() {
    return document.querySelector('.navbar .d-flex.align-items-center.gap-2')
        || document.querySelector('.navbar .container')
        || document.querySelector('.navbar')
        || document.body;
  }

  function getLsQueueCount() {
    try {
      const raw = localStorage.getItem('cheder_pending_writes') || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.length : 0;
    } catch { return 0; }
  }

  async function getIdbQueueCount() {
    try {
      if (!window.bhtIdbQueue) return 0;
      return await window.bhtIdbQueue.count();
    } catch { return 0; }
  }

  function mount() {
    ensureStyle();
    const h = host();
    if (!h) return null;
    let badge = document.getElementById('off-badge-139');
    if (badge) return badge;
    badge = document.createElement('span');
    badge.id = 'off-badge-139';
    badge.className = 'is-online no-print';
    badge.title = 'מצב חיבור';
    badge.innerHTML = '<span class="dot"></span><span class="label">מחובר</span>';
    // Place just before the user-info element if it exists, else append
    const userInfo = document.getElementById('user-info');
    if (userInfo && userInfo.parentNode === h) h.insertBefore(badge, userInfo);
    else h.appendChild(badge);
    return badge;
  }

  async function refresh() {
    const badge = document.getElementById('off-badge-139') || mount();
    if (!badge) return;
    const online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
    const lsCount = getLsQueueCount();
    const idbCount = await getIdbQueueCount();
    const pending = Math.max(lsCount, idbCount);
    badge.classList.remove('is-online', 'is-offline', 'has-queue');
    let label, cls, title;
    if (!online) {
      cls = 'is-offline';
      label = pending > 0 ? `לא מקוון · ${pending} בתור` : 'לא מקוון';
      title = `אין חיבור לרשת. ${pending} שינויים ממתינים להעלאה`;
    } else if (pending > 0) {
      cls = 'has-queue';
      label = `מסתנכרן · ${pending}`;
      title = `${pending} שינויים בתור (LS:${lsCount} IDB:${idbCount})`;
    } else {
      cls = 'is-online';
      label = 'מחובר';
      title = 'מקוון, אפס שינויים ממתינים';
    }
    badge.classList.add(cls);
    badge.setAttribute('title', title);
    const labelEl = badge.querySelector('.label');
    if (labelEl) labelEl.textContent = label;
  }

  // Initial mount + interval + events
  function start() {
    refresh();
    setInterval(refresh, 3000);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    // Also refresh after any storage change (other tab flushed queue)
    window.addEventListener('storage', (e) => {
      if (!e || e.key === 'cheder_pending_writes') refresh();
    });
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);

  window.refreshOfflineBadge = refresh;
  console.warn('%c📡 Pack-139 — Offline badge + queue counter in navbar', 'color:#0891b2;font-weight:bold');
})();
