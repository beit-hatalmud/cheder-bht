// behavior-pack-73.js — Round 7: TLA dashboard + status badges + quick search. 2026-05-26
(function () {
  'use strict';

  // ===== TLA Dashboard accessible from console + FAB =====
  window.openTlaDashboard = function () {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const students = data.students || [];
    const withTla = students.filter(s => s['תלא_pdf_id']);
    const withoutTla = students.filter(s => !s['תלא_pdf_id'] && s['סטטוס'] !== 'סיים');

    function esc(s) { return String(s || '').replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c])); }

    const html = `<div class="modal fade show" id="tla-dashboard" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;max-height:90vh;display:flex;flex-direction:column">
          <div class="modal-header" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
            <h5><i class="bi bi-mortarboard-fill text-warning"></i> דשבורד תל"א — ${students.length} תלמידים</h5>
            <div class="d-flex gap-2 align-items-center">
              <button class="btn btn-sm btn-outline-primary" onclick="window.tlaBulkExport && tlaBulkExport()" title="ייצוא CSV"><i class="bi bi-download"></i> CSV</button>
              <button class="btn btn-sm btn-outline-warning" onclick="window.tlaOpenFolder && tlaOpenFolder()"><i class="bi bi-folder"></i> תיקייה</button>
              <button class="btn-close" onclick="document.getElementById('tla-dashboard').remove()"></button>
            </div>
          </div>
          <div class="modal-body" style="overflow-y:auto;flex:1">
            <div class="row mb-3 g-2">
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-success mb-0">${withTla.length}</div><small>עם תל"א</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-warning mb-0">${withoutTla.length}</div><small>בלי תל"א</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-info mb-0">${students.length}</div><small>סה"כ פעילים</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-primary mb-0">${Math.round(withTla.length/students.length*100)}%</div><small>כיסוי</small></div></div>
            </div>

            <h6 class="mt-3"><i class="bi bi-check-circle text-success"></i> תלמידים עם תל"א (${withTla.length})</h6>
            <table class="table table-sm table-hover">
              <thead><tr><th>שם</th><th>שיעור</th><th>קובץ</th><th>עודכן</th><th>פעולות</th></tr></thead>
              <tbody>
                ${withTla.map(s => `<tr>
                  <td><strong>${esc(s['שם פרטי']||'')} ${esc(s['שם משפחה']||'')}</strong></td>
                  <td>${esc(s['מחזור']||'')}</td>
                  <td><small class="text-muted">${esc(s['תלא_שם_קובץ']||'')}</small></td>
                  <td><small>${s['תלא_עודכן']?new Date(s['תלא_עודכן']).toLocaleDateString('he-IL'):''}</small></td>
                  <td>
                    <a class="btn btn-sm btn-outline-primary" href="${esc(s['תלא_pdf_url'])}" target="_blank" title="צפה"><i class="bi bi-file-pdf"></i></a>
                    <button class="btn btn-sm btn-outline-success" onclick="tlaShare(${s['מזהה']})" title="שתף"><i class="bi bi-share"></i></button>
                    <button class="btn btn-sm btn-outline-info" onclick="tlaSendEmail(${s['מזהה']})" title="שלח"><i class="bi bi-envelope"></i></button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="openStudent(${s['מזהה']}); document.getElementById('tla-dashboard').remove();" title="פתח כרטיס"><i class="bi bi-person"></i></button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>

            ${withoutTla.length ? `
              <h6 class="mt-4"><i class="bi bi-exclamation-circle text-warning"></i> תלמידים ללא תל"א (${withoutTla.length})</h6>
              <table class="table table-sm">
                <thead><tr><th>שם</th><th>שיעור</th><th>אירועי התנהגות</th><th>פעולות</th></tr></thead>
                <tbody>
                  ${withoutTla.map(s => {
                    const evCount = (data.behavior || []).filter(e => String(e['תלמיד_מזהה']) === String(s['מזהה'])).length;
                    return `<tr>
                      <td><strong>${esc(s['שם פרטי']||'')} ${esc(s['שם משפחה']||'')}</strong></td>
                      <td>${esc(s['מחזור']||'')}</td>
                      <td><span class="badge bg-${evCount>5?'success':evCount>0?'warning':'secondary'}">${evCount}</span></td>
                      <td>
                        ${evCount > 0 ? `<button class="btn btn-sm btn-outline-warning" onclick="tlaGenerate(${s['מזהה']})" title="צור מתוך נתונים">🪄 צור</button>` : ''}
                        <button class="btn btn-sm btn-outline-secondary" onclick="openStudent(${s['מזהה']}); document.getElementById('tla-dashboard').remove();"><i class="bi bi-person"></i></button>
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            ` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('tla-dashboard').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== Add to FAB menu =====
  if (window.MENU_ITEMS) {
    if (!window.MENU_ITEMS.find(m => m.label === 'דשבורד תל"א')) {
      window.MENU_ITEMS.push({ icon: '🎓', label: 'דשבורד תל"א', action: window.openTlaDashboard });
    }
  }

  // ===== Add TLA badge in student row (if students list is rendered) =====
  function addTlaBadgesInList() {
    document.querySelectorAll('[data-student-row]').forEach(row => {
      if (row.dataset.tlaBadge) return;
      row.dataset.tlaBadge = '1';
      const sid = row.dataset.studentRow;
      const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
      const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
      if (s && s['תלא_pdf_id']) {
        const badge = document.createElement('span');
        badge.className = 'badge bg-warning text-dark ms-1';
        badge.innerHTML = '🎓';
        badge.title = 'יש תל"א';
        row.querySelector('strong, .student-name')?.appendChild(badge);
      }
    });
  }
  setInterval(addTlaBadgesInList, 5000);

  console.warn('%c🎓 Pack-73 — TLA dashboard + status badges', 'color:#f59e0b;font-weight:bold');
  console.log('  Try: openTlaDashboard()');
})();
