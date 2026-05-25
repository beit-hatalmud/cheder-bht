// behavior-pack-52.js — Signed forms - fetch from API + visible UI. 2026-05-25
(function () {
  'use strict';

  // ===== Override showSignedForms to actually fetch from API =====
  window.showSignedForms = async function () {
    let forms = [];
    try {
      const r = await api('listSignatures', []);
      forms = (r.data || []).map(s => ({
        id: s['מזהה'] || s.id || ('sig_' + Math.random().toString(36).slice(2)),
        ts: s['תאריך'] ? new Date(s['תאריך']).getTime() : Date.now(),
        student: s['שם תלמיד'] || s.student_name || '',
        sid: s['תלמיד_מזהה'] || '',
        type: s['סוג'] || s['קישור_סוג'] || 'חתימה',
        desc: s['תיאור'] || s.description || '',
        status: s['סטטוס'] || (s['חתימה'] ? 'חתום' : 'ממתין'),
        signature: s['חתימה'] || s.signature || '',
        parent_email: s['מייל_הורה'] || s['מייל הורה'] || s.parent_email || '',
        raw: s,
      }));
    } catch (e) {
      console.warn('listSignatures failed:', e.message);
      if (typeof toast === 'function') toast('שגיאה בטעינת חתימות: ' + e.message, 'error');
    }

    // Also merge local
    try {
      const local = JSON.parse(localStorage.getItem('bht_signed_forms') || '[]');
      forms = [...forms, ...local];
    } catch (_) {}

    // Build modal
    const rows = forms.length ? forms.map(f => `
      <div class="card p-3 mb-2">
        <div class="d-flex justify-content-between flex-wrap gap-2">
          <div>
            <span class="badge bg-primary">${escHtml(f.type)}</span>
            <span class="badge ${f.status === 'חתום' ? 'bg-success' : 'bg-warning text-dark'}">${escHtml(f.status)}</span>
            <strong class="mx-2">${escHtml(f.student)}</strong>
          </div>
          <small class="text-muted">${f.ts ? new Date(f.ts).toLocaleDateString('he-IL') : ''}</small>
        </div>
        ${f.desc ? `<div class="small mt-2" style="white-space:pre-wrap">${escHtml(f.desc)}</div>` : ''}
        ${f.signature ? `<div class="mt-2"><img src="${escAttr(f.signature)}" alt="חתימה" style="max-height:80px;border:1px solid #e5e7eb;border-radius:4px;background:#fafafa;padding:4px"></div>` : ''}
        <div class="mt-2 d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-primary" onclick="sfDownload('${escAttr(f.id)}')"><i class="bi bi-download"></i> הורד PDF</button>
          ${f.parent_email ? `<button class="btn btn-sm btn-outline-info" onclick="window.open('mailto:${escAttr(f.parent_email)}?subject=' + encodeURIComponent('טופס מבית התלמוד'))"><i class="bi bi-envelope"></i> שלח שוב</button>` : ''}
          <button class="btn btn-sm btn-outline-success" onclick="sfPrint('${escAttr(f.id)}')"><i class="bi bi-printer"></i> הדפס</button>
        </div>
      </div>
    `).join('') : '<div class="text-center text-muted py-5"><i class="bi bi-pen-fill fs-1"></i><p class="mt-2">אין חתימות במערכת</p></div>';

    const html = `<div class="modal fade show" id="sf-modal" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;max-height:90vh;display:flex;flex-direction:column">
          <div class="modal-header">
            <h5><i class="bi bi-pen-fill"></i> חתימות שנשלחו (${forms.length})</h5>
            <div>
              <button class="btn btn-sm btn-outline-primary" onclick="sfExportAllCSV()">⬇ CSV</button>
              <button class="btn btn-sm btn-outline-success" onclick="sfPrintAll()">🖨 הדפס הכל</button>
              <button class="btn-close" onclick="document.getElementById('sf-modal').remove()"></button>
            </div>
          </div>
          <div class="modal-body" style="overflow-y:auto;flex:1">
            <input id="sf-search" class="form-control mb-3" placeholder="חיפוש לפי שם תלמיד או סוג...">
            <div id="sf-list">${rows}</div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    // Cache forms for download
    window._currentSignedForms = forms;

    // Search
    const search = document.getElementById('sf-search');
    if (search) {
      search.oninput = () => {
        const q = search.value.toLowerCase().trim();
        const filtered = !q ? forms : forms.filter(f =>
          (f.student + f.type + f.desc).toLowerCase().includes(q)
        );
        document.getElementById('sf-list').innerHTML = filtered.length ? filtered.map(f => `
          <div class="card p-3 mb-2">
            <div class="d-flex justify-content-between flex-wrap gap-2">
              <div><span class="badge bg-primary">${escHtml(f.type)}</span> <strong>${escHtml(f.student)}</strong></div>
              <small>${f.ts ? new Date(f.ts).toLocaleDateString('he-IL') : ''}</small>
            </div>
            ${f.desc ? `<div class="small mt-2">${escHtml(f.desc.substring(0, 200))}</div>` : ''}
          </div>
        `).join('') : '<div class="text-muted text-center py-3">אין תוצאות</div>';
      };
    }
  };

  // ===== Helper functions =====
  window.sfDownload = function (id) {
    const f = (window._currentSignedForms || []).find(x => String(x.id) === String(id));
    if (!f) return alert('טופס לא נמצא');
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>טופס חתום</title>
      <style>body{font-family:Heebo,Arial;padding:40px;max-width:800px;margin:0 auto;line-height:1.8}
      h1{color:#2563eb;text-align:center}.meta{background:#f3f4f6;padding:15px;border-radius:8px;margin-bottom:20px}
      .sig{margin-top:40px;border-top:2px dashed #ccc;padding-top:20px}.sig img{max-height:120px}</style>
      </head><body>
      <h1>📜 טופס חתום - בית התלמוד</h1>
      <div class="meta">
        <p><strong>תלמיד:</strong> ${escHtml(f.student)}</p>
        <p><strong>סוג:</strong> ${escHtml(f.type)}</p>
        <p><strong>תאריך:</strong> ${f.ts ? new Date(f.ts).toLocaleString('he-IL') : ''}</p>
        <p><strong>סטטוס:</strong> ${escHtml(f.status)}</p>
      </div>
      <div><strong>תוכן:</strong></div>
      <p style="white-space:pre-wrap">${escHtml(f.desc || '')}</p>
      ${f.signature ? `<div class="sig"><strong>חתימה:</strong><br><img src="${escAttr(f.signature)}"></div>` : ''}
      <p style="margin-top:40px;color:#9ca3af;font-size:12px;text-align:center">בית התלמוד · ${new Date().toLocaleString('he-IL')}</p>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  window.sfPrint = window.sfDownload;

  window.sfExportAllCSV = function () {
    const forms = window._currentSignedForms || [];
    if (!forms.length) return alert('אין חתימות');
    const cols = ['student','type','status','desc','parent_email','ts'];
    let csv = '﻿' + 'תלמיד,סוג,סטטוס,תיאור,מייל,תאריך\n';
    forms.forEach(f => {
      csv += cols.map(c => {
        let v = f[c] || '';
        if (c === 'ts' && v) v = new Date(v).toLocaleString('he-IL');
        return '"' + String(v).replace(/"/g, '""').substring(0, 500) + '"';
      }).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `חתימות_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  window.sfPrintAll = function () {
    const forms = window._currentSignedForms || [];
    if (!forms.length) return alert('אין חתימות');
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>חתימות</title>
      <style>body{font-family:Heebo,Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ccc;text-align:right}th{background:#f3f4f6}</style>
      </head><body>
      <h2>חתימות הורים - בית התלמוד</h2>
      <table><thead><tr><th>תאריך</th><th>תלמיד</th><th>סוג</th><th>סטטוס</th><th>תיאור</th></tr></thead><tbody>
      ${forms.map(f => `<tr>
        <td>${f.ts ? new Date(f.ts).toLocaleDateString('he-IL') : ''}</td>
        <td>${escHtml(f.student)}</td>
        <td>${escHtml(f.type)}</td>
        <td>${escHtml(f.status)}</td>
        <td>${escHtml((f.desc || '').substring(0, 100))}</td>
      </tr>`).join('')}
      </tbody></table>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== Inject visible CTA on formsMgmt page =====
  function injectSignedFormsUI() {
    if (location.hash !== '#formsMgmt') return;
    const page = document.getElementById('page-formsMgmt');
    if (!page || page.querySelector('#signed-forms-cta')) return;
    const h3 = page.querySelector('h3');
    if (!h3) return;
    const cta = document.createElement('div');
    cta.id = 'signed-forms-cta';
    cta.style.cssText = 'background:linear-gradient(135deg,#dcfce7,#bbf7d0);border:2px solid #16a34a;border-radius:10px;padding:14px;margin:12px 0;direction:rtl';
    cta.innerHTML = `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <strong style="color:#15803d;font-size:1.05rem">📜 חתימות הורים שנשלחו</strong>
          <div class="small text-muted">צפייה, הורדת PDF, ייצוא CSV, הדפסה</div>
        </div>
        <button id="sf-view-cta" class="btn btn-success">
          <i class="bi bi-pen-fill"></i> צפה בחתימות
        </button>
      </div>
    `;
    h3.parentElement.insertBefore(cta, h3.nextSibling);
    document.getElementById('sf-view-cta').onclick = () => window.showSignedForms?.();
  }

  window.addEventListener('hashchange', () => setTimeout(injectSignedFormsUI, 500));
  setTimeout(injectSignedFormsUI, 1500);
  setInterval(injectSignedFormsUI, 5000);

  // Add to FAB menu
  if (window.MENU_ITEMS && !window.MENU_ITEMS.find(m => m.label?.includes('חתימות'))) {
    window.MENU_ITEMS.unshift({
      icon: '📜', label: 'חתימות הורים', action: () => window.showSignedForms?.(),
    });
  }

  console.warn('%c📜 Pack-52 — Signed forms: fetch from API + visible CTA + download/print/CSV', 'color:#16a34a;font-weight:bold');
})();
