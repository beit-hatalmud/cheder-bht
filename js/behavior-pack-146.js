// behavior-pack-146.js — Dead-Letter queue manager. 2026-05-28
// When writes fail >10 times, they land in localStorage.cheder_failed_writes.
// This pack: (a) auto-purges entries >30 days old, (b) shows admin banner
// when ≥5 dead letters exist, (c) provides bhtDeadLetters API for inspection.
(function () {
  'use strict';
  const KEY = 'cheder_failed_writes';
  const PURGE_AFTER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  const BANNER_THRESHOLD = 5;
  const DISMISS_KEY = 'bht_dl_dismissed_today';

  function loadList() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }
  function saveList(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(-100))); } catch {}
  }
  function purgeOld() {
    const list = loadList();
    if (!list.length) return 0;
    const cutoff = Date.now() - PURGE_AFTER_MS;
    const kept = list.filter(op => (op.failedAt || op.queuedAt || 0) >= cutoff);
    if (kept.length !== list.length) {
      saveList(kept);
      return list.length - kept.length;
    }
    return 0;
  }

  window.bhtDeadLetters = {
    list: () => loadList(),
    count: () => loadList().length,
    clear: () => { try { localStorage.removeItem(KEY); } catch {} },
    purgeOld,
  };

  function isAdmin() {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u.role === 'מנהל' || u.username === 'admin' || u.permissions === 'all';
    } catch { return false; }
  }

  function ensureStyle() {
    if (document.getElementById('dl-style-146')) return;
    const s = document.createElement('style');
    s.id = 'dl-style-146';
    s.textContent = `
      #dl-banner-146 { position:fixed; bottom:14px; right:14px; z-index:9986;
        background:linear-gradient(135deg,#92400e,#f59e0b); color:#fff;
        border-radius:10px; padding:10px 14px; max-width:380px; direction:rtl;
        font-family:Heebo,sans-serif; font-size:13px;
        box-shadow:0 6px 20px rgba(0,0,0,.25);
        display:flex; align-items:center; gap:10px; }
      #dl-banner-146 button { background:rgba(255,255,255,.2); color:#fff; border:0;
        padding:4px 10px; border-radius:6px; cursor:pointer; font-size:11px; }
      #dl-banner-146 button:hover { background:rgba(255,255,255,.35); }
      @media print { #dl-banner-146 { display:none !important; } }
    `;
    document.head.appendChild(s);
  }

  function showBannerIfNeeded() {
    if (!isAdmin()) return;
    const list = loadList();
    if (list.length < BANNER_THRESHOLD) {
      const old = document.getElementById('dl-banner-146'); if (old) old.remove();
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(DISMISS_KEY) === today) return;
    if (document.getElementById('dl-banner-146')) return;
    ensureStyle();
    const div = document.createElement('div');
    div.id = 'dl-banner-146';
    div.className = 'no-print';
    div.innerHTML = `
      <span style="font-size:20px">⚠</span>
      <span style="flex:1">
        <b>${list.length} שינויים נכשלו</b><br>
        <small style="opacity:.9">לחץ "פרטים" לבדיקה</small>
      </span>
      <button id="dl-details-146">פרטים</button>
      <button id="dl-dismiss-146">×</button>
    `;
    document.body.appendChild(div);
    document.getElementById('dl-dismiss-146').onclick = () => {
      try { localStorage.setItem(DISMISS_KEY, today); } catch {}
      div.remove();
    };
    document.getElementById('dl-details-146').onclick = () => {
      const lines = loadList().map((op, i) => {
        const when = op.failedAt ? new Date(op.failedAt).toLocaleString('he-IL') : '?';
        const what = `${op.kind || '?'} ${op.tab || ''} ${op.matchValue || ''}`;
        return `${i + 1}. ${when} — ${what} (${op.attempts || '?'} ניסיונות)`;
      }).join('\n');
      if (typeof window.toast === 'function') window.toast('פרטים בקונסול (F12)', 'info', 3000);
      console.group('🔥 Dead-letter queue (' + loadList().length + ')');
      console.log(lines || '(empty)');
      console.log('פעולות: bhtDeadLetters.clear() למחיקה, bhtDeadLetters.list() לרשימה');
      console.groupEnd();
    };
  }

  // Purge old on every page load + every 6 hours
  function lifecycle() {
    const p = purgeOld();
    if (p > 0) console.warn('[dl] purged ' + p + ' dead-letter entries older than 30 days');
    showBannerIfNeeded();
  }
  setInterval(lifecycle, 6 * 60 * 60 * 1000);
  if (document.readyState === 'complete') setTimeout(lifecycle, 4000);
  else window.addEventListener('load', () => setTimeout(lifecycle, 4000));

  console.warn('%c🔥 Pack-146 — Dead-letter queue manager (auto-purge 30d + admin banner ≥5)', 'color:#f59e0b;font-weight:bold');
})();
