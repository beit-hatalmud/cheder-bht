// behavior-pack-50.js — Fix forms refresh loop + signed forms viewer. 2026-05-25
(function () {
  'use strict';

  // ===== FIX 1: Debounce all render functions =====
  // Prevent constant re-renders when sync triggers
  const _renderCache = {};
  const RENDER_DEBOUNCE_MS = 3000;

  function debounceRender(fnName) {
    const orig = window[fnName];
    if (typeof orig !== 'function' || orig._debounced) return;
    window[fnName] = function (...args) {
      const now = Date.now();
      const last = _renderCache[fnName] || 0;
      // Skip if rendered less than RENDER_DEBOUNCE_MS ago - unless forced
      if (now - last < RENDER_DEBOUNCE_MS && !window._forceRender) {
        return Promise.resolve();
      }
      _renderCache[fnName] = now;
      return orig.apply(this, args);
    };
    window[fnName]._debounced = true;
  }

  // Debounce all render functions
  setTimeout(() => {
    ['renderFormsTab', 'renderFormsMgmt', 'renderBehavior', 'renderStudents', 'renderTasks', 'renderProjects', 'renderStaff'].forEach(debounceRender);
  }, 1000);

  // ===== FIX 2: Pause auto-sync when user is on forms page =====
  const _origDispatch = window.dispatchEvent.bind(window);
  // We can't easily intercept dispatchEvent. Use listener pattern:
  window.addEventListener('cheder-data-refreshed', (e) => {
    const currentHash = location.hash.replace('#','');
    // If we're on forms, only refresh on actual mutation, not periodic sync
    if (currentHash === 'formsMgmt' && e.detail?.type === 'visibility') {
      e.stopImmediatePropagation();
    }
  }, true);

  // ===== Signed forms storage =====
  window.SIGNED_FORMS = JSON.parse(localStorage.getItem('bht_signed_forms') || '[]');

  window.saveSignedForm = function (formData) {
    const signed = {
      id: 'sf_' + Date.now(),
      ts: Date.now(),
      ...formData,
    };
    SIGNED_FORMS.unshift(signed);
    if (SIGNED_FORMS.length > 200) SIGNED_FORMS.pop();
    try {
      localStorage.setItem('bht_signed_forms', JSON.stringify(SIGNED_FORMS));
    } catch (e) {
      // Quota - trim more
      SIGNED_FORMS.length = 50;
      localStorage.setItem('bht_signed_forms', JSON.stringify(SIGNED_FORMS));
    }
    return signed;
  };

  // ===== View signed forms =====
  window.showSignedForms = async function () {
    let forms = [...SIGNED_FORMS];
    // Also try to fetch from Sheet
    try {
      const r = await api('listSignatures', []);
      if (r.data) forms = [...forms, ...r.data.map(s => ({ ...s, source: 'sheet' }))];
    } catch (_) {}

    const html = `<div class="modal fade show" id="sf-modal" style="display:block;background:rgba(0,0,0,0.5)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;max-height:90vh;display:flex;flex-direction:column">
          <div class="modal-header">
            <h5><i class="bi bi-pen-fill"></i> חתימות הורים שנשלחו (${forms.length})</h5>
            <div>
              <button class="btn btn-sm btn-outline-primary" onclick="exportSignedCSV()">⬇ CSV</button>
              <button class="btn btn-sm btn-outline-secondary" onclick="printSignedForms()">🖨 הדפס</button>
              <button class="btn-close" onclick="document.getElementById('sf-modal').remove()"></button>
            </div>
          </div>
          <div class="modal-body" style="overflow-y:auto;flex:1">
            <input id="sf-search" class="form-control mb-3" placeholder="חיפוש לפי שם תלמיד, סוג, תוכן...">
            <div id="sf-list">
              ${forms.length ? forms.map(f => renderSignedRow(f)).join('') : '<div class="text-center text-muted py-4">אין חתימות עדיין</div>'}
            </div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('sf-search').oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      const list = document.getElementById('sf-list');
      const filtered = !q ? forms : forms.filter(f =>
        JSON.stringify(f).toLowerCase().includes(q)
      );
      list.innerHTML = filtered.length ? filtered.map(renderSignedRow).join('') : '<div class="text-center text-muted py-4">לא נמצאו תוצאות</div>';
    };
  };

  function renderSignedRow(form) {
    const date = form.ts ? new Date(form.ts) : (form['תאריך'] ? new Date(form['תאריך']) : null);
    const dateStr = date ? date.toLocaleDateString('he-IL') + ' ' + date.toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'}) : '';
    const studentName = form['שם תלמיד'] || form.student || form.name || '';
    const formType = form['סוג'] || form.type || 'חתימה';
    const status = form['סטטוס'] || form.status || (form.signature ? 'חתום' : 'ממתין');
    const desc = form['תיאור'] || form.desc || form.text || '';
    const sigImg = form.signature || form['חתימה'] || '';
    return `<div class="card p-3 mb-2" data-signed-id="${escAttr(form.id||'')}">
      <div class="d-flex justify-content-between flex-wrap gap-2">
        <div>
          <span class="badge bg-primary">${escHtml(formType)}</span>
          ${status==='חתום' ? '<span class="badge bg-success">✓ חתום</span>' : '<span class="badge bg-warning text-dark">⏳ ממתין</span>'}
          <strong class="mx-2">${escHtml(studentName)}</strong>
        </div>
        <small class="text-muted">${escHtml(dateStr)}</small>
      </div>
      ${desc ? `<div class="small mt-2" style="white-space:pre-wrap">${escHtml(desc)}</div>` : ''}
      ${sigImg ? `<div class="mt-2"><img src="${escAttr(sigImg)}" alt="חתימה" style="max-height:80px;border:1px solid #e5e7eb;border-radius:4px;background:#fafafa;padding:4px"></div>` : ''}
      <div class="mt-2 d-flex gap-2">
        <button class="btn btn-sm btn-outline-primary" onclick="downloadSignedForm('${escAttr(form.id||'')}')"><i class="bi bi-download"></i> הורד PDF</button>
        <button class="btn btn-sm btn-outline-info" onclick="viewSignedFormFull('${escAttr(form.id||'')}')"><i class="bi bi-eye"></i> תצוגה מלאה</button>
        ${form.parent_email || form['מייל הורה'] ? `<button class="btn btn-sm btn-outline-success" onclick="resendSignedForm('${escAttr(form.id||'')}')"><i class="bi bi-envelope"></i> שלח שוב</button>` : ''}
      </div>
    </div>`;
  }

  window.downloadSignedForm = function (id) {
    const form = SIGNED_FORMS.find(f => f.id === id) || {};
    const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>טופס חתום</title>
      <style>
        body{font-family:Heebo,Arial;padding:40px;max-width:800px;margin:0 auto;line-height:1.8}
        h1{color:#2563eb;text-align:center}
        .meta{background:#f3f4f6;padding:15px;border-radius:8px;margin-bottom:20px}
        .signature{margin-top:40px;border-top:2px dashed #ccc;padding-top:20px}
        .signature img{max-height:120px}
      </style></head><body>
      <h1>📜 טופס חתום - בית התלמוד</h1>
      <div class="meta">
        <p><strong>תלמיד:</strong> ${escHtml(form['שם תלמיד']||form.student||'')}</p>
        <p><strong>סוג:</strong> ${escHtml(form['סוג']||form.type||'')}</p>
        <p><strong>תאריך חתימה:</strong> ${form.ts ? new Date(form.ts).toLocaleString('he-IL') : ''}</p>
        <p><strong>סטטוס:</strong> ${escHtml(form['סטטוס']||form.status||'')}</p>
      </div>
      <div><strong>תוכן:</strong></div>
      <p style="white-space:pre-wrap">${escHtml(form['תיאור']||form.desc||form.text||'')}</p>
      ${(form.signature||form['חתימה']) ? `<div class="signature"><strong>חתימה:</strong><br><img src="${escAttr(form.signature||form['חתימה'])}" alt="חתימה"></div>` : ''}
      <p style="margin-top:40px;color:#9ca3af;font-size:12px;text-align:center">בית התלמוד · נוצר ${new Date().toLocaleString('he-IL')}</p>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
  };

  window.viewSignedFormFull = function (id) {
    const form = SIGNED_FORMS.find(f => f.id === id);
    if (!form) return;
    const html = `<div class="modal fade show" id="sfv-modal" style="display:block;background:rgba(0,0,0,0.7);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5>טופס חתום - ${escHtml(form['שם תלמיד']||form.student||'')}</h5>
            <button class="btn-close" onclick="document.getElementById('sfv-modal').remove()"></button>
          </div>
          <div class="modal-body">
            <pre style="background:#f3f4f6;padding:15px;border-radius:6px;direction:rtl;text-align:right;white-space:pre-wrap">${escHtml(JSON.stringify(form, null, 2))}</pre>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.resendSignedForm = function (id) {
    const form = SIGNED_FORMS.find(f => f.id === id);
    if (!form) return;
    const email = form.parent_email || form['מייל הורה'];
    const subj = `טופס מבית התלמוד - ${form['שם תלמיד']||form.student||''}`;
    const body = `שלום, להלן הטופס:\n${form['תיאור']||form.desc||''}\n\nתודה,\nבית התלמוד`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  window.exportSignedCSV = function () {
    if (!SIGNED_FORMS.length) return;
    const cols = ['id','ts','שם תלמיד','סוג','סטטוס','תיאור','חתימה','parent_email'];
    let csv = '﻿' + cols.join(',') + '\n';
    SIGNED_FORMS.forEach(f => {
      csv += cols.map(c => `"${String(f[c]||'').replace(/"/g,'""').substring(0,500)}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `signed_forms_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  window.printSignedForms = function () {
    if (!SIGNED_FORMS.length) return;
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>חתימות</title>
      <style>body{font-family:Heebo,Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ccc;text-align:right}</style>
      </head><body>
      <h2>חתימות הורים - בית התלמוד</h2>
      <table><thead><tr><th>תאריך</th><th>תלמיד</th><th>סוג</th><th>סטטוס</th><th>תיאור</th></tr></thead><tbody>
      ${SIGNED_FORMS.map(f => `<tr>
        <td>${f.ts ? new Date(f.ts).toLocaleDateString('he-IL') : ''}</td>
        <td>${escHtml(f['שם תלמיד']||f.student||'')}</td>
        <td>${escHtml(f['סוג']||f.type||'')}</td>
        <td>${escHtml(f['סטטוס']||f.status||'')}</td>
        <td>${escHtml((f['תיאור']||f.desc||'').substring(0,100))}</td>
      </tr>`).join('')}
      </tbody></table>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== Button in formsMgmt page =====
  setTimeout(() => {
    document.addEventListener('click', (e) => {
      if (location.hash !== '#formsMgmt') return;
      if (e.target.closest('#sf-show-btn')) return; // already clicked
    });
    // Auto-inject button in formsMgmt
    const inject = () => {
      const formsPage = document.getElementById('page-formsMgmt');
      if (!formsPage || formsPage.querySelector('#sf-show-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'sf-show-btn';
      btn.className = 'btn btn-outline-success btn-sm mb-2 me-2';
      btn.innerHTML = '<i class="bi bi-pen-fill"></i> צפה בחתימות שנשלחו';
      btn.onclick = showSignedForms;
      const h3 = formsPage.querySelector('h3');
      if (h3) h3.parentElement.appendChild(btn);
    };
    setInterval(inject, 5000);
  }, 3000);

  // ===== Add to FAB menu =====
  if (window.MENU_ITEMS) {
    window.MENU_ITEMS.push({ icon: '📜', label: 'חתימות שנשלחו', action: showSignedForms });
  }

  console.warn('%c📜 Pack-50 — Fix forms refresh loop + Signed forms viewer (download/view/resend/CSV/print)', 'color:#92400e;font-weight:bold');
})();
