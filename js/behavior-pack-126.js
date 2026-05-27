// behavior-pack-126.js — UI Wiring: health badge + manual sync + integrity viewer in admin settings. 2026-05-27
(function () {
  'use strict';

  // ===== Health badge in navbar =====
  function injectHealthBadge() {
    if (document.getElementById('health-badge-126')) return;
    const navbar = document.querySelector('.navbar .d-flex.align-items-center.gap-2');
    if (!navbar) return;

    const badge = document.createElement('button');
    badge.id = 'health-badge-126';
    badge.className = 'btn btn-sm btn-outline-light';
    badge.title = 'מצב בריאות המערכת';
    badge.setAttribute('aria-label', 'בריאות מערכת');
    badge.style.cssText = 'font-size:13px;padding:4px 10px;display:flex;align-items:center;gap:4px';
    badge.innerHTML = '<span class="health-dot-126" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e"></span><span class="health-label-126">תקין</span>';
    badge.onclick = showHealthPanel;
    navbar.insertBefore(badge, navbar.firstChild);
    updateHealthBadge();
  }

  function updateHealthBadge() {
    const dot = document.querySelector('.health-dot-126');
    const lbl = document.querySelector('.health-label-126');
    if (!dot || !lbl) return;
    if (typeof window.healthSummary !== 'function') return;

    const h = window.healthSummary();
    const online = h.online;
    const issues = h.issueCount;
    const queued = h.queuedActions;
    const errors = h.errorLog;

    if (!online) {
      dot.style.background = '#f59e0b';
      dot.style.boxShadow = '0 0 6px #f59e0b';
      lbl.textContent = 'offline';
    } else if (issues > 0 || errors > 10) {
      dot.style.background = '#dc2626';
      dot.style.boxShadow = '0 0 6px #dc2626';
      lbl.textContent = 'בעיות';
    } else if (queued > 0) {
      dot.style.background = '#fbbf24';
      dot.style.boxShadow = '0 0 6px #fbbf24';
      lbl.textContent = `${queued} ממתינים`;
    } else {
      dot.style.background = '#22c55e';
      dot.style.boxShadow = '0 0 6px #22c55e';
      lbl.textContent = 'תקין';
    }
  }

  function showHealthPanel() {
    const h = typeof window.healthSummary === 'function' ? window.healthSummary() : {};
    const integrityLog = (() => {
      try { return JSON.parse(localStorage.getItem('bht_integrity_log') || '[]'); } catch { return []; }
    })();

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const recent = integrityLog.slice(-10).reverse();

    const html = `<div class="modal fade show" id="health-panel-126" style="display:block;background:rgba(0,0,0,0.5);z-index:9990" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;border-radius:var(--bht-radius-lg,12px);overflow:hidden">
          <div class="modal-header" style="background:linear-gradient(135deg,var(--bht-primary,#1e3a8a),var(--bht-primary-light,#3b82f6));color:#fff;border:0">
            <h5 style="margin:0;color:#fff"><i class="bi bi-heart-pulse"></i> מצב בריאות המערכת</h5>
            <button class="btn-close btn-close-white" onclick="document.getElementById('health-panel-126').remove()"></button>
          </div>
          <div class="modal-body" style="background:var(--bht-gray-50,#f9fafb)">
            <div class="row g-2 mb-3">
              <div class="col-md-3"><div class="card p-2 text-center"><div style="font-size:24px;color:${h.online?'#22c55e':'#dc2626'}">${h.online?'🟢':'🔴'}</div><small>${h.online?'מחובר':'לא מחובר'}</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div style="font-size:24px;color:#1e3a8a">${h.lastHourEvents||0}</div><small>אירועי 60 דק'</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div style="font-size:24px;color:${h.issueCount?'#dc2626':'#22c55e'}">${h.issueCount||0}</div><small>בעיות שאותרו</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div style="font-size:24px;color:${h.queuedActions?'#fbbf24':'#22c55e'}">${h.queuedActions||0}</div><small>פעולות בתור</small></div></div>
            </div>
            <div class="alert alert-info small">
              📊 <b>סטטיסטיקה:</b> שגיאות בלוג: ${h.errorLog||0} · בדיקת בריאות אחרונה: ${esc(h.lastCheck||'מעולם')}
            </div>
            <h6 class="mt-3">📋 בדיקות אחרונות:</h6>
            ${recent.length ? recent.map(e => `
              <div class="card p-2 mb-1" style="border-right:3px solid ${e.status==='ok'?'#22c55e':e.status==='mismatch'?'#fbbf24':'#dc2626'}">
                <div class="d-flex justify-content-between">
                  <span>${e.status==='ok'?'✅':e.status==='mismatch'?'⚠️':'❌'} <b>${esc(e.schema)}</b> · ${esc(e.status)}</span>
                  <small class="text-muted">${esc(new Date(e.ts).toLocaleString('he-IL'))}</small>
                </div>
                ${e.details?.error ? `<div class="small text-danger mt-1">${esc(e.details.error)}</div>` : ''}
              </div>
            `).join('') : '<div class="text-muted">אין רשומות בדיקה עדיין. הבדיקה הראשונה אחרי 30 שניות.</div>'}
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary me-auto" onclick="window.runIntegrityCheck && runIntegrityCheck()"><i class="bi bi-arrow-repeat"></i> בדוק עכשיו</button>
            <button class="btn btn-info" onclick="window.BhtSync && BhtSync.syncAll().then(r=>alert('סנכרון הסתיים: '+r.success.length+' הצליחו, '+r.failed.length+' נכשלו'))"><i class="bi bi-cloud-download"></i> סנכרן הכל</button>
            <button class="btn btn-secondary" onclick="document.getElementById('health-panel-126').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // ===== Apply on load + periodically refresh =====
  setTimeout(injectHealthBadge, 1500);
  setInterval(() => {
    if (!document.getElementById('health-badge-126')) injectHealthBadge();
    else updateHealthBadge();
  }, 5000);

  // ===== Listen for online/offline =====
  window.addEventListener('online', updateHealthBadge);
  window.addEventListener('offline', updateHealthBadge);

  // ===== Keyboard: Ctrl+Shift+H for health panel =====
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      showHealthPanel();
    }
  });

  console.warn('%c💚 Pack-126 — Health badge in navbar + integrity panel (Ctrl+Shift+H)', 'color:#16a34a;font-weight:bold');
})();
