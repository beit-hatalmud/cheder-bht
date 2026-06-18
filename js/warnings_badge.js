/**
 * warnings_badge.js — admin-only "אזהרות אחרונות" badge.
 *
 * Polls the notifications panel for any error/warn entries from the
 * last 24 hours and shows a yellow count next to the bell.
 * Click → opens notifications panel.
 */
(function () {
  'use strict';

  function isAdmin() {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u && (u.username === 'admin' || u.role === 'מנהל');
    } catch (_) { return false; }
  }

  function loadNotifs() {
    try { return JSON.parse(localStorage.getItem('bht_notifications') || '[]'); }
    catch (_) { return []; }
  }

  function countWarnings() {
    const yesterday = Date.now() - 86400000;
    return loadNotifs().filter(n => {
      if (n.kind !== 'error' && n.kind !== 'warn') return false;
      try { return new Date(n.at).getTime() >= yesterday; }
      catch (_) { return false; }
    }).length;
  }

  function ensureBadge() {
    if (document.getElementById('warn-badge')) return;
    const bell = document.getElementById('notif-toggle');
    if (!bell) return;
    const wrap = document.createElement('span');
    wrap.id = 'warn-badge';
    wrap.style.cssText = 'background:#f59e0b;color:#fff;padding:2px 6px;border-radius:8px;font-size:.7rem;font-weight:600;margin-left:4px;cursor:pointer;display:none';
    wrap.title = 'אזהרות מ-24 השעות האחרונות';
    wrap.onclick = () => { if (window.bhtOpenNotifications) window.bhtOpenNotifications(); };
    bell.parentElement.insertBefore(wrap, bell);
  }

  function refresh() {
    const badge = document.getElementById('warn-badge');
    if (!badge) return;
    if (!isAdmin()) { badge.style.display = 'none'; return; }
    const n = countWarnings();
    if (n > 0) {
      badge.textContent = '⚠ ' + n;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      ensureBadge();
      refresh();
      setInterval(refresh, 30000);
    }, 2500);
  });
})();
