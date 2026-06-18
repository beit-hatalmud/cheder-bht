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
        <button class="btn btn-success" onclick="if(typeof addUserModal==='function')addUserModal()" style="font-size:1rem;padding:.5rem 1.1rem;box-shadow:0 4px 12px rgba(22,163,74,.35)"><i class="bi bi-person-plus-fill"></i> הוסף משתמש</button>
        <button class="btn btn-outline-secondary btn-sm" onclick="if(window.openAuditLog)openAuditLog()" title="יומן פעולות"><i class="bi bi-journal-text"></i> יומן</button>
        <button class="btn btn-outline-warning btn-sm" onclick="if(window.bhtExportAll)bhtExportAll()" title="כל הטבלאות"><i class="bi bi-archive"></i> ייצא הכל</button>
        <button class="btn btn-outline-primary btn-sm" onclick="staffExportCSV()"><i class="bi bi-download"></i> ייצוא לאקסל</button>
      </div>
    </div>
    <div class="alert alert-info py-2 small mb-3">
      <i class="bi bi-info-circle"></i> רשימת כל אנשי הצוות במערכת. לחץ על שורה לעריכה. אדמין יכול לתת/לקחת הרשאות, להקפיא, או למחוק.
    </div>
    <div id="staff-stats" class="row g-2 mb-3"></div>
    <div class="mb-3 d-flex gap-1 flex-wrap" id="staff-role-chips"></div>
    <div id="staff-table"><div class="text-center py-4"><div class="spinner-border"></div></div></div>`;

  try {
    const r = await api('listUsers', []);
    _staffUsers = (r.data || []).filter(u => u['שם משתמש'] !== 'admin' || true);
  } catch (e) {
    _staffUsers = [];
  }
  renderStaffStats();
  renderStaffRoleChips();
  renderStaffTable(_staffUsers);
  document.getElementById('staff-search').oninput = (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) return renderStaffTable(applyRoleFilter(_staffUsers));
    const filtered = applyRoleFilter(_staffUsers).filter(u =>
      [u['שם מלא'], u['שם משתמש'], u['תפקיד'], u['אימייל'], u['טלפון'], u['תז']]
        .some(v => String(v||'').toLowerCase().includes(q))
    );
    renderStaffTable(filtered);
  };
}

let _staffRoleFilter = 'all';
function applyRoleFilter(list) {
  if (_staffRoleFilter === 'all') return list;
  if (_staffRoleFilter === '__missing_tz__') return list.filter(u => !u['תז'] && u['שם משתמש'] !== 'admin');
  if (_staffRoleFilter === '__missing_email__') return list.filter(u => !u['אימייל'] && u['שם משתמש'] !== 'admin');
  return list.filter(u => (u['תפקיד'] || '') === _staffRoleFilter);
}
function renderStaffRoleChips() {
  const cont = document.getElementById('staff-role-chips');
  if (!cont) return;
  const roles = Array.from(new Set(_staffUsers.map(u => u['תפקיד'] || '').filter(Boolean)));
  const chips = [
    { key: 'all', label: 'הכל', n: _staffUsers.length, color: '#2563eb' },
    ...roles.map(r => ({ key: r, label: r, n: _staffUsers.filter(u => u['תפקיד'] === r).length, color: '#6b7280' })),
    { key: '__missing_tz__', label: 'חסר ת.ז.', n: _staffUsers.filter(u => !u['תז'] && u['שם משתמש'] !== 'admin').length, color: '#f59e0b' },
    { key: '__missing_email__', label: 'חסר אימייל', n: _staffUsers.filter(u => !u['אימייל'] && u['שם משתמש'] !== 'admin').length, color: '#dc2626' },
  ];
  cont.innerHTML = chips.map(c => {
    const active = _staffRoleFilter === c.key;
    return `<button class="btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}" onclick="setStaffRoleFilter('${escAttr(c.key)}')">${escHtml(c.label)} <span class="badge bg-light text-dark ms-1">${c.n}</span></button>`;
  }).join('');
}
window.setStaffRoleFilter = function(key) {
  _staffRoleFilter = key;
  renderStaffRoleChips();
  const q = (document.getElementById('staff-search')?.value || '').toLowerCase().trim();
  let list = applyRoleFilter(_staffUsers);
  if (q) {
    list = list.filter(u => [u['שם מלא'], u['שם משתמש'], u['תפקיד'], u['אימייל'], u['טלפון'], u['תז']]
      .some(v => String(v||'').toLowerCase().includes(q)));
  }
  renderStaffTable(list);
};

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
  // Mobile cards (CSS shows on <=640px only)
  const mobileCards = '<div id="staff-cards-list">' + list.map(u => {
    const uname = u['שם משתמש']||'';
    const fullname = u['שם מלא'] || uname;
    const role = u['תפקיד'] || '';
    const phone = u['טלפון'] || '';
    const initials = (fullname || '').trim().split(/\s+/).slice(0,2).map(s => s[0]||'').join('');
    return `<div class="staff-card" onclick="if(typeof editUser==='function')editUser('${escAttr(uname)}')">
      <div class="avatar">${escHtml(initials || '?')}</div>
      <div class="info">
        <b>${escHtml(fullname)}</b>
        <div class="meta">${escHtml(role)}${phone ? ' · ' + escHtml(phone) : ''}</div>
      </div>
      ${uname !== 'admin' ? `<button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation();staffDelete('${escAttr(uname)}')"><i class="bi bi-trash"></i></button>` : ''}
    </div>`;
  }).join('') + '</div>';
  cont.innerHTML = mobileCards + `
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
