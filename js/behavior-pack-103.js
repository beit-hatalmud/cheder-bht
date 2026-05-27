// behavior-pack-103.js — Global error logger + suppress duplicate alerts. 2026-05-27
(function () {
  'use strict';

  const LOG_KEY = 'bht_error_log';
  const MAX_LOG = 200;

  function loadLog() {
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
  }
  function saveLog(arr) {
    try { localStorage.setItem(LOG_KEY, JSON.stringify(arr.slice(-MAX_LOG))); } catch {}
  }
  function appendLog(entry) {
    const log = loadLog();
    log.push(Object.assign({ ts: Date.now(), url: location.hash, user: (JSON.parse(sessionStorage.getItem('user')||'{}')).username || '?' }, entry));
    saveLog(log);
  }

  // ===== Catch unhandled errors =====
  window.addEventListener('error', e => {
    appendLog({
      type: 'error',
      msg: String(e.message || e.error || ''),
      file: (e.filename || '').split('/').pop(),
      line: e.lineno,
      stack: (e.error?.stack || '').slice(0, 500),
    });
  });
  window.addEventListener('unhandledrejection', e => {
    appendLog({
      type: 'promise',
      msg: String(e.reason?.message || e.reason || ''),
      stack: (e.reason?.stack || '').slice(0, 500),
    });
  });

  // ===== Intercept alert() to log + dedupe =====
  const _origAlert = window.alert;
  const recentAlerts = new Map();
  window.alert = function (msg) {
    const m = String(msg || '');
    appendLog({ type: 'alert', msg: m.slice(0, 200) });
    // Dedupe: if same alert in last 5 seconds, suppress
    const now = Date.now();
    const last = recentAlerts.get(m);
    if (last && (now - last) < 5000) {
      console.warn('[Pack-103] suppressed duplicate alert:', m);
      return;
    }
    recentAlerts.set(m, now);
    // Cleanup old entries
    if (recentAlerts.size > 30) {
      for (const [k, t] of recentAlerts) {
        if (now - t > 60000) recentAlerts.delete(k);
      }
    }
    return _origAlert.apply(window, arguments);
  };

  // ===== Intercept console.error =====
  const _origConsoleErr = console.error;
  console.error = function (...args) {
    appendLog({ type: 'console.error', msg: args.map(a => String(a)).join(' ').slice(0, 300) });
    return _origConsoleErr.apply(console, args);
  };

  // ===== Viewer + auto-clear repeated errors =====
  window.viewErrorLog = function () {
    const log = loadLog();
    if (!log.length) { _origAlert('אין שגיאות מתועדות 👍'); return; }
    // Group by msg
    const grouped = {};
    log.forEach(e => {
      const key = (e.type || 'err') + ':' + (e.msg || '').slice(0, 100);
      if (!grouped[key]) grouped[key] = { ...e, count: 0, samples: [] };
      grouped[key].count++;
      if (grouped[key].samples.length < 3) grouped[key].samples.push(new Date(e.ts).toLocaleTimeString('he-IL'));
    });
    const sorted = Object.values(grouped).sort((a, b) => b.count - a.count);

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const html = `<div class="modal fade show" id="err-log-103" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header" style="background:#dc2626;color:#fff">
            <h5>📋 לוג שגיאות (${log.length} סה"כ, ${sorted.length} ייחודיות)</h5>
            <button class="btn-close btn-close-white" onclick="document.getElementById('err-log-103').remove()"></button>
          </div>
          <div class="modal-body" style="max-height:60vh;overflow-y:auto">
            ${sorted.length === 0 ? '<div class="text-success">✓ ניקי</div>' : sorted.map(g => `
              <div class="card p-2 mb-2">
                <div class="d-flex justify-content-between">
                  <span class="badge bg-${g.type==='alert'?'warning':'danger'}">${esc(g.type)}</span>
                  <span class="small text-muted">${g.count}× · ${g.samples.join(', ')}</span>
                </div>
                <div class="mt-1 small"><strong>${esc((g.msg||'').slice(0, 200))}</strong></div>
                ${g.file ? `<div class="small text-muted">${esc(g.file)}:${g.line||''}</div>` : ''}
                ${g.stack ? `<details class="small mt-1"><summary>stack</summary><pre style="font-size:10px">${esc(g.stack.slice(0, 300))}</pre></details>` : ''}
              </div>
            `).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger me-auto" onclick="if(confirm('למחוק את כל הלוג?')){localStorage.removeItem('${LOG_KEY}');document.getElementById('err-log-103').remove();}">מחק הכל</button>
            <button class="btn btn-secondary" onclick="document.getElementById('err-log-103').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== Keyboard shortcut: Ctrl+Shift+L =====
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      window.viewErrorLog();
    }
  });

  // ===== Known errors to auto-suppress =====
  const KNOWN_HARMLESS = [
    /Loading the script.*netfree\.link/,
    /favicon\.ico/,
    /chrome-extension/,
    /cheder-data-refreshed/,
    /event-guard/,
    /a11y/,
  ];

  // ===== Stat badge on a11y/error toolbar =====
  setInterval(() => {
    const log = loadLog();
    const recent = log.filter(e => Date.now() - e.ts < 5 * 60 * 1000);
    const real = recent.filter(e => !KNOWN_HARMLESS.some(re => re.test(e.msg || '')));
    if (real.length === 0) return;

    let badge = document.getElementById('err-badge-103');
    if (!badge) {
      badge = document.createElement('button');
      badge.id = 'err-badge-103';
      badge.style.cssText = 'position:fixed;bottom:80px;left:20px;background:#dc2626;color:#fff;border:0;padding:8px 12px;border-radius:8px;cursor:pointer;z-index:9998;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.2)';
      badge.onclick = window.viewErrorLog;
      document.body.appendChild(badge);
    }
    badge.innerHTML = `⚠ ${real.length} שגיאות אחרונות`;
  }, 4000);

  console.warn('%c📋 Pack-103 — Global error logger + alert dedupe + Ctrl+Shift+L viewer + auto badge', 'color:#dc2626;font-weight:bold');
  console.log('  Try: viewErrorLog()');
})();
