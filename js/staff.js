// staff.js — ניהול רבנים אנשי צוות. 2026-05-24
let _staffUsers = [];

async function renderStaff() {
  const root = document.getElementById('page-staff');
  if (!root) return;
  root.innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-people-fill text-primary"></i> ניהול רבנים ואנשי צוות</h3>
      <div class="d-flex gap-2">
        <input id="staff-search" class="form-control form-control-sm" placeholder="חיפוש..." style="width:180px">
        <button class="btn btn-success btn-sm" onclick="if(typeof addUserModal==='function')addUserModal()"><i class="bi bi-plus"></i> חדש</button>
        <button class="btn btn-outline-primary btn-sm" onclick="staffExportCSV()"><i class="bi bi-download"></i> CSV</button>
      </div>
    </div>
    <div class="alert alert-info py-2 small mb-3">
      <i class="bi bi-info-circle"></i> רשימת כל אנשי הצוות במערכת. לחץ על שורה לעריכת פרטים מלאים.
    </div>
    <div id="staff-stats" class="row g-2 mb-3"></div>
    <div id="staff-table"><div class="text-center py-4"><div class="spinner-border"></div></div></div>`;

  try {
    const r = await api('listUsers', []);
    _staffUsers = (r.data || []).filter(u => u['שם משתמש'] !== 'admin' || true);
  } catch (e) {
    _staffUsers = [];
  }
  renderStaffStats();
  renderStaffTable(_staffUsers);
  document.getElementById('staff-search').oninput = (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) return renderStaffTable(_staffUsers);
    const filtered = _staffUsers.filter(u =>
      [u['שם מלא'], u['שם משתמש'], u['תפקיד'], u['אימייל'], u['טלפון'], u['תז']]
        .some(v => String(v||'').toLowerCase().includes(q))
    );
    renderStaffTable(filtered);
  };
}

function renderStaffStats() {
  const total = _staffUsers.length;
  const rabbis = _staffUsers.filter(u => String(u['תפקיד']||'').startsWith('הרב') || u['תפקיד']==='רב').length;
  const admins = _staffUsers.filter(u => u['תפקיד']==='מנהל' || u['שם משתמש']==='admin').length;
  const missingTz = _staffUsers.filter(u => !u['תז'] && u['שם משתמש']!=='admin').length;
  const missingEmail = _staffUsers.filter(u => !u['אימייל'] && u['שם משתמש']!=='admin').length;
  document.getElementById('staff-stats').innerHTML = `
    <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="display-6 text-primary">${total}</div><div class="small text-muted">סה"כ צוות</div></div></div>
    <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="display-6 text-success">${rabbis}</div><div class="small text-muted">רבנים</div></div></div>
    <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="display-6 text-warning">${missingTz}</div><div class="small text-muted">חסר ת.ז.</div></div></div>
    <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="display-6 text-danger">${missingEmail}</div><div class="small text-muted">חסר אימייל</div></div></div>`;
}

function renderStaffTable(list) {
  const cont = document.getElementById('staff-table');
  if (!list.length) {
    cont.innerHTML = '<div class="text-center py-4 text-muted">אין משתמשים תואמים</div>';
    return;
  }
  cont.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover table-sm align-middle">
        <thead class="table-light"><tr>
          <th>שם מלא</th>
          <th>תפקיד</th>
          <th>טלפון</th>
          <th>אימייל</th>
          <th>ת.ז.</th>
          <th>תיק אישי</th>
          <th class="text-end">פעולות</th>
        </tr></thead>
        <tbody>${list.map(u => {
          const uname = u['שם משתמש']||'';
          const fullname = u['שם מלא'] || uname;
          const role = u['תפקיד'] || '';
          const phone = u['טלפון'] || '';
          const email = u['אימייל'] || '';
          const tz = u['תז'] || '';
          const tik = u['תיק_אישי'] || '';
          const status = !u['תז'] && uname !== 'admin' ? '<span class="badge bg-warning text-dark ms-1">חסר ת.ז.</span>' : '';
          return `<tr style="cursor:pointer" onclick="if(typeof editUser==='function')editUser('${escAttr(uname)}')">
            <td><strong>${escHtml(fullname)}</strong> ${status}<br><small class="text-muted">${escHtml(uname)}</small></td>
            <td><span class="badge bg-secondary">${escHtml(role)}</span></td>
            <td>${phone ? `<a href="tel:${escAttr(phone)}" onclick="event.stopPropagation()">${escHtml(phone)}</a>` : '<span class="text-muted">—</span>'}</td>
            <td>${email ? `<a href="mailto:${escAttr(email)}" onclick="event.stopPropagation()" class="small">${escHtml(email)}</a>` : '<span class="text-muted">—</span>'}</td>
            <td><span class="small font-monospace">${escHtml(tz)}</span></td>
            <td>${tik ? `<a href="${escAttr(tik)}" target="_blank" onclick="event.stopPropagation()"><i class="bi bi-folder2-open"></i></a>` : '<span class="text-muted">—</span>'}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation();if(typeof editUser==='function')editUser('${escAttr(uname)}')"><i class="bi bi-pencil"></i></button>
              ${uname !== 'admin' ? `<button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation();staffDelete('${escAttr(uname)}')"><i class="bi bi-trash"></i></button>` : ''}
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
}

async function staffDelete(uname) {
  if (!confirm(`למחוק את "${uname}"?`)) return;
  try {
    const r = await api('deleteUser', [uname]);
    if (r.ok) { renderStaff(); } else alert(r.error || 'שגיאה');
  } catch (e) { alert(e.message); }
}

function staffExportCSV() {
  if (!_staffUsers.length) return alert('אין נתונים');
  const cols = ['שם משתמש','שם מלא','תפקיד','טלפון','אימייל','תז','תאריך_לידה','כתובת','טלפון_בית','בנק','סניף','חשבון','מספר_עובד','תיק_אישי','הערות_משתמש'];
  let csv = '﻿' + cols.join(',') + '\n';
  _staffUsers.forEach(u => {
    csv += cols.map(c => `"${String(u[c]||'').replace(/"/g,'""')}"`).join(',') + '\n';
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `צוות_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

window.renderStaff = renderStaff;
window.staffDelete = staffDelete;
window.staffExportCSV = staffExportCSV;

console.log('%c✅ staff.js loaded', 'color:#0891b2;font-weight:bold');
