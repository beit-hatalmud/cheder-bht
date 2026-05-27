// behavior-pack-14.js — סבב 14: אבטחה מתקדמת + אמינות. 2026-05-24
(function () {
  'use strict';

  // ===== 1. CSP runtime enforcement =====
  // הוסף meta CSP אם חסר
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const csp = document.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = "default-src 'self' https://*.googleapis.com https://*.google.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com 'unsafe-inline'; img-src * data: blob:; media-src * data: blob:; frame-src *; connect-src *;";
    document.head.appendChild(csp);
  }

  // ===== 2. Audit log: כל פעולת mutation =====
  const _origApi = window.api;
  if (typeof _origApi === 'function' && !window._auditWrapped) {
    window._auditWrapped = true;
    window.api = async function (action, args) {
      const result = await _origApi.apply(this, arguments);
      const MUTATIONS = ['add','update','delete','authenticate','login'];
      if (MUTATIONS.some(m => action.toLowerCase().includes(m))) {
        try {
          const u = JSON.parse(sessionStorage.getItem('user') || '{}');
          const log = JSON.parse(localStorage.getItem('bht_audit_log') || '[]');
          log.push({
            ts: Date.now(),
            user: u.username || '?',
            action, ok: result?.ok !== false,
            err: result?.error || null,
          });
          if (log.length > 500) log.splice(0, log.length - 500);
          localStorage.setItem('bht_audit_log', JSON.stringify(log));
        } catch (_) { }
      }
      return result;
    };
  }

  // ===== 3. Rate limiting client-side - prevent rapid auth attempts =====
  const _authAttempts = [];
  const ORIG_API = window.api;
  if (ORIG_API && !window._rateLimitWrapped) {
    window._rateLimitWrapped = true;
    window.api = async function (action, args) {
      if (action === 'authenticate') {
        const now = Date.now();
        _authAttempts.push(now);
        // Last 60 seconds
        while (_authAttempts.length && _authAttempts[0] < now - 60000) _authAttempts.shift();
        if (_authAttempts.length > 5) {
          return { ok: false, error: 'יותר מדי ניסיונות התחברות - נסה שוב בעוד דקה' };
        }
      }
      return ORIG_API.apply(this, arguments);
    };
  }

  // ===== 4. Password strength meter =====
  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'nu-pass') {
      const v = e.target.value;
      const strength = passwordStrength(v);
      let meter = e.target.parentElement.querySelector('.pwd-meter');
      if (!meter) {
        meter = document.createElement('div');
        meter.className = 'pwd-meter mt-1';
        meter.style.cssText = 'height:4px;border-radius:2px;transition:all 0.3s';
        e.target.parentElement.appendChild(meter);
      }
      const colors = ['#dc2626', '#f59e0b', '#fbbf24', '#84cc16', '#16a34a'];
      meter.style.background = colors[strength];
      meter.style.width = `${(strength + 1) * 20}%`;
      meter.title = ['חלשה מאוד','חלשה','בינונית','חזקה','חזקה מאוד'][strength];
    }
  });
  function passwordStrength(p) {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  }

  // ===== 5. Auto-backup local data every 30 min =====
  setInterval(() => {
    try {
      const data = localStorage.getItem('cheder_bht_data');
      if (!data) return;
      const backups = JSON.parse(localStorage.getItem('bht_backups') || '[]');
      backups.push({ ts: Date.now(), size: data.length, snapshot: data });
      // Keep only last 5 backups
      if (backups.length > 5) backups.shift();
      try {
        localStorage.setItem('bht_backups', JSON.stringify(backups));
      } catch (e) {
        // Quota exceeded - drop older backups
        localStorage.setItem('bht_backups', JSON.stringify(backups.slice(-2)));
      }
    } catch (_) { }
  }, 30 * 60 * 1000);

  window.restoreBackup = function (index) {
    try {
      const backups = JSON.parse(localStorage.getItem('bht_backups') || '[]');
      if (!backups[index]) return alert('גיבוי לא נמצא');
      if (!confirm(`לשחזר גיבוי מ-${new Date(backups[index].ts).toLocaleString('he-IL')}?`)) return;
      localStorage.setItem('cheder_bht_data', backups[index].snapshot);
      location.reload();
    } catch (e) { alert('שגיאה: ' + e.message); }
  };

  window.listBackups = function () {
    const backups = JSON.parse(localStorage.getItem('bht_backups') || '[]');
    return backups.map((b, i) => ({
      index: i, time: new Date(b.ts).toLocaleString('he-IL'),
      size: `${(b.size/1024).toFixed(0)} KB`,
    }));
  };

  // ===== 6. Detect modified data from server (conflict resolution) =====
  let _lastServerHash = null;
  setInterval(async () => {
    try {
      if (document.hidden) return;
      const r = await api('listBehavior', []);
      const hash = simpleHash(JSON.stringify((r.data||[]).map(e=>e['מזהה']).sort()));
      if (_lastServerHash !== null && _lastServerHash !== hash) {
        if (typeof toast === 'function') toast('🔄 נתונים חדשים מהשרת', 'info', 2000);
      }
      _lastServerHash = hash;
    } catch (_) { }
  }, 2 * 60 * 1000);
  function simpleHash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return h;
  }

  // ===== 7. Offline mode indicator =====
  window.addEventListener('online', () => {
    if (typeof toast === 'function') toast('🟢 חיבור לאינטרנט חזר', 'success', 2000);
  });
  window.addEventListener('offline', () => {
    if (typeof toast === 'function') toast('🔴 אין חיבור לאינטרנט - שינויים יישמרו מקומית', 'warn', 4000);
  });

  // ===== 8. Honeypot field for bot detection =====
  // Add hidden field to forms - if filled, it's likely a bot
  document.addEventListener('shown.bs.modal', (e) => {
    const form = e.target.querySelector('.modal-body');
    if (form && !form.querySelector('input[name="honeypot"]')) {
      const hp = document.createElement('input');
      hp.type = 'text';
      hp.name = 'honeypot';
      hp.tabIndex = -1;
      hp.autocomplete = 'off';
      hp.style.cssText = 'position:absolute;left:-9999px;opacity:0';
      hp.setAttribute('aria-hidden', 'true');
      form.appendChild(hp);
    }
  });

  // ===== 9. Throttle expensive operations =====
  window.throttle = function (fn, ms) {
    let last = 0;
    return function () {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        return fn.apply(this, arguments);
      }
    };
  };

  // ===== 10. Self-diagnostic =====
  window.diagnostic = function () {
    const report = {
      time: new Date().toISOString(),
      user: JSON.parse(sessionStorage.getItem('user') || '{}'),
      localStorage_size: (JSON.stringify(localStorage).length / 1024).toFixed(0) + ' KB',
      events_loaded: (window._events || []).length,
      students_loaded: (window._allStudents || []).length,
      tasks_loaded: (window._tasks || []).length,
      projects_loaded: (window._projects || []).length,
      backups: listBackups().length,
      audit_entries: JSON.parse(localStorage.getItem('bht_audit_log') || '[]').length,
      online: navigator.onLine,
      dark_mode: document.body.classList.contains('dark-mode'),
      intervals_active: (window._bhtIntervals || new Set()).size,
    };
    console.table(report);
    return report;
  };

  // Expose for debug
  console.warn('%c🛡 Pack-14 — security audit + auto-backup + rate-limit + diagnostic', 'color:#dc2626;font-weight:bold');
  console.info('Try: diagnostic(), listBackups(), generateWeeklySummary()');
})();
