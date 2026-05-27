// behavior-pack-118.js — Network resilience + offline queue + sync indicator. 2026-05-27
(function () {
  'use strict';

  // ===== Offline action queue =====
  const QUEUE_KEY = 'bht_offline_queue';

  function getQueue() {
    return (typeof window.safeParse === 'function' ? window.safeParse(localStorage.getItem(QUEUE_KEY), []) : []) || [];
  }
  function saveQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-200))); } catch {}
  }

  // ===== Intercept api() calls to queue when offline =====
  const _origApi118 = window.api;
  if (typeof _origApi118 === 'function' && !_origApi118._118) {
    const MUTATIONS = ['add', 'update', 'delete', 'append', 'remove'];

    window.api = async function (action, args) {
      const isMutation = action && MUTATIONS.some(m => action.toLowerCase().includes(m));

      if (!navigator.onLine && isMutation) {
        // Offline + mutation - queue it
        const q = getQueue();
        q.push({ ts: Date.now(), action, args, status: 'queued' });
        saveQueue(q);
        updateQueueBadge();
        return { ok: true, _queued: true, message: 'נשמר לוקלית, יסתנכרן כשתחזור לאינטרנט' };
      }

      try {
        const r = await _origApi118.apply(this, arguments);
        return r;
      } catch (e) {
        // Network error - queue if mutation
        if (isMutation) {
          const q = getQueue();
          q.push({ ts: Date.now(), action, args, status: 'failed-queued' });
          saveQueue(q);
          updateQueueBadge();
          return { ok: false, _queued: true, error: e.message };
        }
        throw e;
      }
    };
    window.api._118 = true;
  }

  // ===== Replay queue when back online =====
  async function replayQueue() {
    if (!navigator.onLine) return;
    const q = getQueue();
    if (!q.length) return;
    const pending = q.filter(e => e.status !== 'done');
    if (!pending.length) return;

    console.warn(`[Pack-118] replaying ${pending.length} queued actions`);
    for (const entry of pending) {
      try {
        const r = await _origApi118(entry.action, entry.args);
        if (r && r.ok !== false) {
          entry.status = 'done';
          entry.completedAt = Date.now();
        } else {
          entry.status = 'permanent-error';
          entry.error = r?.error || 'unknown';
        }
      } catch (e) {
        // Keep queued
      }
    }
    // Remove successful ones
    saveQueue(q.filter(e => e.status !== 'done'));
    updateQueueBadge();
    if (typeof toast === 'function') {
      const success = pending.filter(e => e.status === 'done').length;
      if (success) toast(`✓ ${success} פעולות סונכרנו`, 'success');
    }
  }

  window.addEventListener('online', () => {
    setTimeout(replayQueue, 1000);
  });
  setInterval(replayQueue, 60000);

  // ===== Queue badge =====
  function updateQueueBadge() {
    const q = getQueue().filter(e => e.status !== 'done');
    let badge = document.getElementById('queue-badge-118');
    if (q.length === 0) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('button');
      badge.id = 'queue-badge-118';
      badge.style.cssText = 'position:fixed;bottom:120px;left:20px;background:#fbbf24;color:#1e3a8a;border:0;padding:6px 12px;border-radius:8px;cursor:pointer;z-index:9997;font-size:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-weight:600';
      badge.onclick = window.viewQueue;
      document.body.appendChild(badge);
    }
    badge.innerHTML = `📤 ${q.length} ממתינים לסנכרון`;
  }

  window.viewQueue = function () {
    const q = getQueue();
    if (!q.length) return alert('אין פעולות בתור');
    const failed = q.filter(e => e.status === 'permanent-error');
    const pending = q.filter(e => e.status !== 'done' && e.status !== 'permanent-error');

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const html = `<div class="modal fade show" id="queue-modal-118" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>📤 תור סנכרון offline</h5><button class="btn-close" onclick="document.getElementById('queue-modal-118').remove()"></button></div>
          <div class="modal-body">
            <div class="alert alert-info small">${pending.length} פעולות ממתינות · ${failed.length} שגיאות</div>
            ${q.slice(-20).reverse().map(e => `
              <div class="card p-2 mb-1">
                <div class="d-flex justify-content-between">
                  <span class="badge bg-${e.status==='done'?'success':e.status==='permanent-error'?'danger':'warning'}">${esc(e.status)}</span>
                  <span class="small text-muted">${new Date(e.ts).toLocaleString('he-IL')}</span>
                </div>
                <div class="small mt-1"><strong>${esc(e.action)}</strong>${e.error?` · ${esc(e.error)}`:''}</div>
              </div>
            `).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger me-auto" onclick="if(confirm('למחוק את כל התור?')){localStorage.removeItem('${QUEUE_KEY}');document.getElementById('queue-modal-118').remove();document.getElementById('queue-badge-118')?.remove();}">מחק תור</button>
            <button class="btn btn-primary" onclick="window.dispatchEvent(new Event('online'));document.getElementById('queue-modal-118').remove();">נסה לסנכרן עכשיו</button>
            <button class="btn btn-secondary" onclick="document.getElementById('queue-modal-118').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  updateQueueBadge();

  console.warn('%c📡 Pack-118 — Offline queue + auto-replay + viewQueue() viewer', 'color:#fbbf24;font-weight:bold');
})();
