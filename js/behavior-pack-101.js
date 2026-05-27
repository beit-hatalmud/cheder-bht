// behavior-pack-101.js — FIX: sync dashboard/widget counts with TLA stored in דוח_אישי. 2026-05-27
(function () {
  'use strict';

  // Count students with TLA - check תלא_pdf_id OR דוח_אישי TLA marker
  function hasTla(s) {
    if (s['תלא_pdf_id'] || s['תלא_data']) return true;
    const doch = s['דוח_אישי'] || '';
    return /\[TLA_JSON_START\]/.test(doch);
  }

  function refreshAllCounts() {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const students = data.students || [];
    const activeCount = students.filter(s => s['סטטוס'] !== 'סיים').length;
    const withTla = students.filter(s => hasTla(s) && s['סטטוס'] !== 'סיים').length;

    // Update home stats widget (pack-88)
    const widget = document.getElementById('home-stats-88');
    if (widget) {
      const valueDivs = widget.querySelectorAll('div[style*="font-size:24px"]');
      if (valueDivs[2]) valueDivs[2].textContent = `${withTla}/${activeCount}`;
    }

    // Update home shortcut button (pack-92)
    const btn = document.querySelector('#tla-home-shortcut button');
    if (btn) {
      btn.innerHTML = `<i class="bi bi-mortarboard-fill"></i> דשבורד תל"א (${withTla}/${activeCount} תלמידים)`;
    }

    return { activeCount, withTla };
  }

  // Override pack-73's openTlaDashboard to use new count
  const _origDash = window.openTlaDashboard;
  window.openTlaDashboard = function () {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const students = data.students || [];
    const active = students.filter(s => s['סטטוס'] !== 'סיים');
    const withTla = active.filter(hasTla);
    const without = active.filter(s => !hasTla(s));

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const html = `<div class="modal fade show" id="tla-dash-101" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;max-height:90vh;display:flex;flex-direction:column">
          <div class="modal-header" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
            <h5><i class="bi bi-mortarboard-fill text-warning"></i> דשבורד תל"א — ${active.length} תלמידים פעילים</h5>
            <button class="btn-close" onclick="document.getElementById('tla-dash-101').remove()"></button>
          </div>
          <div class="modal-body" style="overflow-y:auto;flex:1">
            <div class="row mb-3 g-2">
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-success mb-0">${withTla.length}</div><small>עם נתוני תל"א</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-warning mb-0">${without.length}</div><small>ללא נתונים</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-info mb-0">${active.length}</div><small>סה"כ פעילים</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-primary mb-0">${Math.round(withTla.length/active.length*100)}%</div><small>כיסוי</small></div></div>
            </div>

            <h6 class="mt-3 text-success"><i class="bi bi-check-circle"></i> תלמידים עם תל"א (${withTla.length})</h6>
            <table class="table table-sm table-hover">
              <thead><tr><th>שם</th><th>שיעור</th><th>מקור</th><th>פעולות</th></tr></thead>
              <tbody>
                ${withTla.map(s => {
                  const fromFile = !!s['תלא_pdf_id'];
                  return `<tr>
                    <td><strong>${esc(s['שם פרטי']||'')} ${esc(s['שם משפחה']||'')}</strong></td>
                    <td>${esc(s['מחזור']||'')}</td>
                    <td><span class="badge bg-${fromFile?'primary':'success'}">${fromFile?'PPTX מקורי':'אוטומטי'}</span></td>
                    <td><button class="btn btn-sm btn-outline-primary" onclick="viewStudent(${s['מזהה']}); document.getElementById('tla-dash-101').remove();"><i class="bi bi-eye"></i> פתח</button></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>

            ${without.length ? `
              <h6 class="mt-4 text-warning"><i class="bi bi-exclamation-triangle"></i> ללא תל"א (${without.length})</h6>
              <table class="table table-sm">
                <tbody>
                  ${without.map(s => `<tr>
                    <td><strong>${esc(s['שם פרטי']||'')} ${esc(s['שם משפחה']||'')}</strong></td>
                    <td>${esc(s['מחזור']||'')}</td>
                    <td><button class="btn btn-sm btn-outline-warning" onclick="viewStudent(${s['מזהה']}); document.getElementById('tla-dash-101').remove();"><i class="bi bi-plus"></i> צור</button></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            ` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('tla-dash-101').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // Refresh counts every 2 seconds + on data refresh
  setInterval(refreshAllCounts, 2000);
  window.addEventListener('cheder-data-refreshed', refreshAllCounts);
  setTimeout(refreshAllCounts, 1500);

  console.warn('%c🔄 Pack-101 — Sync dashboard/widget counts with דוח_אישי TLA storage', 'color:#16a34a;font-weight:bold');
})();
