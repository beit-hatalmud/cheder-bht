/*
 * errors_admin.js — Admin view of the error log.
 *
 * Adds page #errors with a table of buffered/synced errors.
 * Reads from BHT.errorBuffer() and (when available) the Supabase error_log table.
 */
(function () {
  'use strict';

  function isAdmin() {
    const u = window.currentUser;
    if (!u) return false;
    if (u.role === 'מנהל') return true;
    if (u.permissions === 'all') return true;
    return false;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function ensurePage() {
    let p = document.getElementById('page-errors');
    if (p) return p;
    p = document.createElement('div');
    p.id = 'page-errors';
    p.className = 'd-none';
    p.innerHTML = `
      <div class="card p-4 mt-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="m-0"><i class="bi bi-bug"></i> יומן שגיאות</h3>
          <div>
            <button class="btn btn-sm btn-outline-secondary" onclick="errorsAdmin.refresh()"><i class="bi bi-arrow-clockwise"></i> רענן</button>
            <button class="btn btn-sm btn-outline-danger" onclick="errorsAdmin.clear()"><i class="bi bi-trash"></i> נקה מקומי</button>
            <button class="btn btn-sm btn-outline-primary" onclick="errorsAdmin.download()"><i class="bi bi-download"></i> הורד JSON</button>
          </div>
        </div>
        <div class="alert alert-info small mb-3" id="ea-status">טוען...</div>
        <div class="row g-2 mb-3">
          <div class="col-md-3">
            <select class="form-select form-select-sm" id="ea-level-filter">
              <option value="">כל הרמות</option>
              <option value="error">שגיאה</option>
              <option value="warn">אזהרה</option>
              <option value="info">מידע</option>
            </select>
          </div>
          <div class="col-md-9">
            <input type="text" class="form-control form-control-sm" id="ea-search" placeholder="חיפוש בהודעה / stack / משתמש...">
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-sm table-hover">
            <thead><tr>
              <th>זמן</th><th>רמה</th><th>משתמש</th><th>הודעה</th><th>URL</th><th></th>
            </tr></thead>
            <tbody id="ea-tbody"></tbody>
          </table>
        </div>
      </div>
    `;
    const home = document.getElementById('page-home');
    if (home && home.parentNode) home.parentNode.insertBefore(p, home.nextSibling);
    else document.body.appendChild(p);
    return p;
  }

  let _entries = [];

  function refresh() {
    if (!isAdmin()) { setStatus('warning', 'דף זמין רק למנהל.'); return; }
    _entries = (window.BHT && BHT.errorBuffer && BHT.errorBuffer()) || [];
    render();
    setStatus('info', `${_entries.length} רשומות בbufferמקומי. Supabase תחזיר עוד כשתחובר.`);
    // best-effort: fetch from Supabase too
    if (window.bhtSupabase) {
      window.bhtSupabase.from('error_log').select('*').order('at', { ascending: false }).limit(500)
        .then(({ data }) => {
          if (data && data.length) {
            const seen = new Set(_entries.map(e => e.at + e.message));
            for (const r of data) {
              const key = (r.at || '') + (r.message || '');
              if (seen.has(key)) continue;
              _entries.push({
                at: r.at, level: 'error',
                message: r.message, stack: r.stack, url: r.url,
                user: r.user_email ? { email: r.user_email } : null,
                build: r.build_hash, ua: r.user_agent,
              });
            }
            _entries.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
            render();
            setStatus('success', `${_entries.length} רשומות (כולל Supabase).`);
          }
        });
    }
  }

  function setStatus(type, msg) {
    const el = document.getElementById('ea-status');
    if (!el) return;
    el.className = 'alert alert-' + type + ' small mb-3';
    el.textContent = msg;
  }

  function render() {
    const tb = document.getElementById('ea-tbody');
    if (!tb) return;
    const lf = document.getElementById('ea-level-filter').value;
    const sf = (document.getElementById('ea-search').value || '').toLowerCase().trim();
    const rows = _entries
      .slice()
      .reverse()
      .filter(e => !lf || e.level === lf)
      .filter(e => !sf || (
        (e.message && e.message.toLowerCase().includes(sf)) ||
        (e.stack && e.stack.toLowerCase().includes(sf)) ||
        (e.user && e.user.email && e.user.email.toLowerCase().includes(sf))
      ));
    tb.innerHTML = rows.map((e, i) => `
      <tr>
        <td><small>${escapeHtml((e.at || '').replace('T', ' ').slice(0, 19))}</small></td>
        <td><span class="badge bg-${e.level === 'error' ? 'danger' : e.level === 'warn' ? 'warning' : 'secondary'}">${escapeHtml(e.level || 'info')}</span></td>
        <td><small>${escapeHtml((e.user && (e.user.email || e.user.name)) || 'anonymous')}</small></td>
        <td><small>${escapeHtml((e.message || '').slice(0, 120))}</small></td>
        <td><small>${escapeHtml((e.url || '').replace(location.origin, '').slice(0, 60))}</small></td>
        <td><button class="btn btn-xs btn-outline-secondary" onclick="errorsAdmin.showStack(${i})">stack</button></td>
      </tr>
    `).join('');
  }

  function showStack(i) {
    const rows = _entries.slice().reverse();
    const e = rows[i];
    if (!e) return;
    alert((e.message || '') + '\n\n' + (e.stack || '(אין stack)'));
  }

  function clear() {
    if (!confirm('למחוק את ה-buffer המקומי?')) return;
    BHT.clearErrorBuffer();
    refresh();
  }

  function download() {
    const blob = new Blob([JSON.stringify(_entries, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bht-errors-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 100);
  }

  window.errorsAdmin = { refresh, clear, download, showStack };
  window.addEventListener('hashchange', () => {
    if (location.hash === '#errors') { ensurePage(); refresh(); }
  });
  document.addEventListener('DOMContentLoaded', () => {
    ensurePage();
    const lf = document.getElementById('ea-level-filter');
    const sf = document.getElementById('ea-search');
    if (lf) lf.addEventListener('change', render);
    if (sf) sf.addEventListener('input', render);
    if (location.hash === '#errors') refresh();
  });
})();
