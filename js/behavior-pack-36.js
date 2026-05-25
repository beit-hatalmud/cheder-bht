// behavior-pack-36.js — Collaboration & Real-time. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Presence indicator (who's online via BroadcastChannel) =====
  const PRESENCE_KEY = 'bht_presence';
  let _myPresence = null;

  function getMyId() {
    let id = sessionStorage.getItem('bht_session_id');
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem('bht_session_id', id);
    }
    return id;
  }

  function updatePresence() {
    try {
      const presence = JSON.parse(localStorage.getItem(PRESENCE_KEY) || '{}');
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      const myId = getMyId();
      presence[myId] = {
        username: u.username || 'אורח',
        page: location.hash.replace('#', '') || 'home',
        lastSeen: Date.now(),
      };
      // Clean old entries (>5 min)
      const cutoff = Date.now() - 5 * 60 * 1000;
      Object.keys(presence).forEach(k => {
        if (presence[k].lastSeen < cutoff) delete presence[k];
      });
      localStorage.setItem(PRESENCE_KEY, JSON.stringify(presence));
      _myPresence = presence;
    } catch (_) { }
  }

  setInterval(updatePresence, 30000);
  setTimeout(updatePresence, 2000);

  // ===== 2. Active users widget =====
  window.activeUsers = function () {
    try {
      const presence = JSON.parse(localStorage.getItem(PRESENCE_KEY) || '{}');
      const cutoff = Date.now() - 5 * 60 * 1000;
      return Object.entries(presence)
        .filter(([_, p]) => p.lastSeen > cutoff)
        .map(([id, p]) => ({ id, ...p }));
    } catch (_) { return []; }
  };

  // ===== 3. Comments per event =====
  window.addEventComment = function (eventId, comment) {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const comments = JSON.parse(localStorage.getItem('bht_comments') || '{}');
    if (!comments[eventId]) comments[eventId] = [];
    comments[eventId].push({
      ts: Date.now(),
      user: u.username || 'אורח',
      text: comment,
    });
    localStorage.setItem('bht_comments', JSON.stringify(comments));
    if (typeof toast === 'function') toast('תגובה נוספה', 'success');
  };

  window.getEventComments = function (eventId) {
    try {
      const all = JSON.parse(localStorage.getItem('bht_comments') || '{}');
      return all[eventId] || [];
    } catch (_) { return []; }
  };

  // ===== 4. @mentions =====
  window.extractMentions = function (text) {
    return (String(text||'').match(/@[א-ת\w]+/g) || []).map(m => m.slice(1));
  };

  window.findUserByName = async function (name) {
    try {
      const r = await api('listUsers', []);
      return (r.data || []).find(u =>
        u['שם משתמש'] === name || u['שם מלא']?.includes(name)
      );
    } catch (_) { return null; }
  };

  // ===== 5. Cursor sharing (mouse position visible to others) =====
  // Stored in localStorage - polled by other tabs
  let _lastCursorWrite = 0;
  document.addEventListener('mousemove', (e) => {
    if (Date.now() - _lastCursorWrite < 200) return;
    _lastCursorWrite = Date.now();
    try {
      const presence = JSON.parse(localStorage.getItem(PRESENCE_KEY) || '{}');
      const myId = getMyId();
      if (presence[myId]) {
        presence[myId].cursor = { x: e.clientX, y: e.clientY };
        localStorage.setItem(PRESENCE_KEY, JSON.stringify(presence));
      }
    } catch (_) { }
  });

  // ===== 6. Activity feed =====
  window.addActivityEntry = function (action, detail) {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const log = JSON.parse(localStorage.getItem('bht_activity') || '[]');
    log.unshift({ ts: Date.now(), user: u.username || 'אורח', action, detail });
    if (log.length > 100) log.pop();
    localStorage.setItem('bht_activity', JSON.stringify(log));
  };

  window.getActivityFeed = function (limit) {
    try {
      const log = JSON.parse(localStorage.getItem('bht_activity') || '[]');
      return log.slice(0, limit || 20);
    } catch (_) { return []; }
  };

  // Hook into api mutations
  const _api = window.api;
  if (typeof _api === 'function' && !window._activityWrapped) {
    window._activityWrapped = true;
    window.api = async function (action, args) {
      const r = await _api.apply(this, arguments);
      if (/^(add|update|delete)/.test(action) && r?.ok !== false) {
        addActivityEntry(action, JSON.stringify(args).substring(0, 100));
      }
      return r;
    };
  }

  // ===== 7. Live activity feed widget =====
  window.showActivityFeed = function () {
    const feed = getActivityFeed(30);
    const html = `<div class="modal fade show" id="af-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-activity"></i> פעילות אחרונה</h5><button class="btn-close" onclick="document.getElementById('af-modal').remove()"></button></div>
          <div class="modal-body" style="max-height:60vh;overflow-y:auto">
            ${feed.length ? feed.map(e => `
              <div class="border-bottom py-2">
                <strong>${escHtml(e.user)}</strong>
                <span class="text-muted small">- ${escHtml(e.action)}</span>
                <div class="small text-muted">${new Date(e.ts).toLocaleString('he-IL')}</div>
              </div>`).join('') : '<div class="text-muted">אין פעילות'}
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 8. Lock indicator (someone is editing) =====
  window.lockEntity = function (entityType, entityId, durationMs) {
    durationMs = durationMs || 5 * 60 * 1000;
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const locks = JSON.parse(localStorage.getItem('bht_locks') || '{}');
    locks[`${entityType}_${entityId}`] = {
      user: u.username || 'אורח',
      until: Date.now() + durationMs,
    };
    localStorage.setItem('bht_locks', JSON.stringify(locks));
  };

  window.isLocked = function (entityType, entityId) {
    try {
      const locks = JSON.parse(localStorage.getItem('bht_locks') || '{}');
      const lock = locks[`${entityType}_${entityId}`];
      if (!lock) return null;
      if (lock.until < Date.now()) return null;
      return lock;
    } catch (_) { return null; }
  };

  window.unlockEntity = function (entityType, entityId) {
    const locks = JSON.parse(localStorage.getItem('bht_locks') || '{}');
    delete locks[`${entityType}_${entityId}`];
    localStorage.setItem('bht_locks', JSON.stringify(locks));
  };

  // ===== 9. Active users count badge =====
  setInterval(() => {
    const users = activeUsers();
    let badge = document.getElementById('active-users-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'active-users-badge';
      badge.style.cssText = 'position:fixed;top:10px;right:60px;background:#10b981;color:#fff;padding:4px 10px;border-radius:12px;font-size:11px;cursor:pointer;z-index:9990;display:none;direction:rtl';
      badge.onclick = () => {
        const u = activeUsers().map(u => u.username).join(', ');
        if (typeof toast === 'function') toast(`👥 ${u}`, 'info', 4000);
      };
      document.body.appendChild(badge);
    }
    if (users.length > 1) {
      badge.style.display = 'block';
      badge.textContent = `👥 ${users.length} פעילים`;
    } else {
      badge.style.display = 'none';
    }
  }, 10000);

  // ===== 10. Conflict warning =====
  document.addEventListener('shown.bs.modal', (e) => {
    const editBtn = e.target.querySelector('[onclick*="edit"]');
    if (!editBtn) return;
    const match = editBtn.getAttribute('onclick')?.match(/edit\w*\((\d+)\)/);
    if (!match) return;
    const id = match[1];
    const lock = isLocked('event', id);
    if (lock && lock.user !== JSON.parse(sessionStorage.getItem('user') || '{}').username) {
      if (typeof toast === 'function') {
        toast(`⚠ ${lock.user} ערך כעת. זהירות מהתנגשות.`, 'warn', 5000);
      }
    } else {
      lockEntity('event', id, 5 * 60 * 1000);
    }
  });

  console.warn('%c👥 Pack-36 — Collaboration: presence, comments, mentions, activity feed, locks', 'color:#16a34a;font-weight:bold');
})();
