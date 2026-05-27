// behavior-pack-131.js — Smart localStorage cleanup + cache management UI. 2026-05-27
(function () {
  'use strict';

  // ===== Categorize localStorage entries =====
  const CRITICAL_KEYS = new Set([
    'user', 'cheder_bht_data', 'cheder_bht_data_meta',
    'cameras_hls_base', 'cameras_webrtc_base', 'cameras_live_url',
    'bht_session', 'bht_user_prefs',
  ]);
  const VOLATILE_PREFIXES = ['draft_', 'autosave_', 'cache_', 'tla_audit_'];
  const LOG_PREFIXES = ['bht_error_log', 'bht_integrity_log'];

  /**
   * Get total localStorage usage in bytes.
   */
  function getUsage() {
    let total = 0;
    const byCategory = { critical: 0, volatile: 0, logs: 0, other: 0 };
    const entries = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k) || '';
      const size = k.length + v.length;
      total += size;

      let cat;
      if (CRITICAL_KEYS.has(k)) cat = 'critical';
      else if (VOLATILE_PREFIXES.some(p => k.startsWith(p))) cat = 'volatile';
      else if (LOG_PREFIXES.some(p => k.startsWith(p))) cat = 'logs';
      else cat = 'other';

      byCategory[cat] += size;
      entries.push({ key: k, size, category: cat });
    }

    return { total, byCategory, entries: entries.sort((a, b) => b.size - a.size) };
  }

  /**
   * Auto-clean low-value entries when usage > threshold.
   */
  function autoCleanIfNeeded() {
    const u = getUsage();
    const MB = 1024 * 1024;
    if (u.total < 4 * MB) return false;

    // Trim logs first
    if (u.byCategory.logs > MB / 2) {
      ['bht_error_log', 'bht_integrity_log'].forEach(k => {
        try {
          const v = JSON.parse(localStorage.getItem(k) || '[]');
          if (v.length > 50) {
            localStorage.setItem(k, JSON.stringify(v.slice(-50)));
          }
        } catch {}
      });
    }

    // Trim volatile
    if (u.byCategory.volatile > MB) {
      for (const e of u.entries) {
        if (e.category === 'volatile' && e.size > 10000) {
          try { localStorage.removeItem(e.key); } catch {}
        }
      }
    }

    return true;
  }

  // Run cleanup every 5 minutes
  setInterval(autoCleanIfNeeded, 5 * 60 * 1000);

  /**
   * UI to view + clear cache.
   */
  window.showCachePanel = function () {
    const u = getUsage();
    const KB = 1024;

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }
    function fmt(n) { return (n / KB).toFixed(1) + ' KB'; }

    const top10 = u.entries.slice(0, 10);
    const html = `<div class="modal fade show" id="cache-panel-131" style="display:block;background:rgba(0,0,0,0.5);z-index:9995" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header" style="background:linear-gradient(135deg,var(--bht-primary,#1e3a8a),var(--bht-primary-light,#3b82f6));color:#fff;border:0">
            <h5 style="margin:0;color:#fff"><i class="bi bi-hdd"></i> ניהול אחסון מקומי</h5>
            <button class="btn-close btn-close-white" onclick="document.getElementById('cache-panel-131').remove()"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2 mb-3">
              <div class="col-3"><div class="card p-2 text-center"><div style="font-size:20px;color:#1e3a8a">${fmt(u.total)}</div><small>סה"כ</small></div></div>
              <div class="col-3"><div class="card p-2 text-center"><div style="font-size:20px;color:#22c55e">${fmt(u.byCategory.critical)}</div><small>קריטי</small></div></div>
              <div class="col-3"><div class="card p-2 text-center"><div style="font-size:20px;color:#fbbf24">${fmt(u.byCategory.volatile)}</div><small>זמני</small></div></div>
              <div class="col-3"><div class="card p-2 text-center"><div style="font-size:20px;color:#9ca3af">${fmt(u.byCategory.logs)}</div><small>לוגים</small></div></div>
            </div>
            <h6>10 הפריטים הגדולים:</h6>
            <table class="table table-sm">
              <thead><tr><th>מפתח</th><th>קטגוריה</th><th>גודל</th><th></th></tr></thead>
              <tbody>
                ${top10.map(e => `<tr>
                  <td><code style="font-size:11px">${esc(e.key)}</code></td>
                  <td><span class="badge bg-${e.category==='critical'?'success':e.category==='volatile'?'warning':e.category==='logs'?'secondary':'info'}">${esc(e.category)}</span></td>
                  <td><small>${fmt(e.size)}</small></td>
                  <td>${e.category!=='critical' ? `<button class="btn btn-sm btn-outline-danger" onclick="if(confirm('למחוק ${esc(e.key)}?')){localStorage.removeItem('${esc(e.key)}');document.getElementById('cache-panel-131').remove();showCachePanel();}">מחק</button>` : '<small class="text-muted">מוגן</small>'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-warning me-auto" onclick="if(confirm('לנקות את כל הזמני (drafts + logs)?')){
              Object.keys(localStorage).filter(k => ${JSON.stringify([...VOLATILE_PREFIXES, ...LOG_PREFIXES])}.some(p => k.startsWith(p))).forEach(k => localStorage.removeItem(k));
              document.getElementById('cache-panel-131').remove();
              showCachePanel();
            }">נקה זמני + לוגים</button>
            <button class="btn btn-secondary" onclick="document.getElementById('cache-panel-131').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // Keyboard: Ctrl+Shift+M = manage cache
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      window.showCachePanel();
    }
  });

  // Run once on load
  setTimeout(autoCleanIfNeeded, 30000);

  console.warn('%c💾 Pack-131 — Smart localStorage management (auto-clean > 4MB, Ctrl+Shift+M panel)', 'color:#0891b2;font-weight:bold');
})();
