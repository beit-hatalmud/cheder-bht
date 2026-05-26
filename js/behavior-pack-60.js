// behavior-pack-60.js — Unify staff & settings into single staff panel. 2026-05-26
(function () {
  'use strict';

  // ===== Inject "Permissions" section into staff page =====
  function injectPermsIntoStaff() {
    if (location.hash !== '#staff') return;
    const page = document.getElementById('page-staff');
    if (!page || page.querySelector('#staff-perms-cta')) return;

    const h3 = page.querySelector('h3');
    if (!h3) return;

    // Add comprehensive CTA bar with all admin functions
    const cta = document.createElement('div');
    cta.id = 'staff-perms-cta';
    cta.style.cssText = 'background:linear-gradient(135deg,#dbeafe,#bfdbfe);border:2px solid #2563eb;border-radius:10px;padding:14px;margin:12px 0;direction:rtl';
    cta.innerHTML = `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <strong style="color:#1e3a8a;font-size:1.05rem">⚙ ניהול מלא של הצוות</strong>
          <div class="small text-muted">משתמשים, סיסמאות, הרשאות, פרטים אישיים</div>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-primary btn-sm" onclick="if(typeof addUserModal==='function')addUserModal()">
            <i class="bi bi-person-plus"></i> משתמש חדש
          </button>
          <button class="btn btn-warning btn-sm" onclick="window.openPasswordManager?.()">
            <i class="bi bi-key"></i> סיסמאות
          </button>
          <button class="btn btn-info btn-sm" onclick="window.openPermissionsManager?.()">
            <i class="bi bi-shield-check"></i> הרשאות
          </button>
          <button class="btn btn-outline-secondary btn-sm" onclick="goto('settings')">
            <i class="bi bi-gear"></i> הגדרות מתקדמות
          </button>
        </div>
      </div>
    `;
    h3.parentNode.insertBefore(cta, h3.nextSibling);
  }

  // ===== Permissions manager modal =====
  window.openPermissionsManager = async function () {
    let users = [];
    try {
      const r = await api('listUsers', []);
      users = r.data || [];
    } catch (e) { return alert(e.message); }

    // Permission areas
    const AREAS = [
      ['students', 'תלמידים', '👨‍🎓'],
      ['behavior', 'מעקב התנהגות', '📋'],
      ['writing', 'כתיבה', '✏️'],
      ['reading', 'קריאה', '📖'],
      ['lessonsKlein', 'שיעורים פרטניים', '🎓'],
      ['tasks', 'משימות', '✅'],
      ['projects', 'פרויקטים', '📊'],
      ['formsMgmt', 'ניהול טפסים', '📝'],
      ['staff', 'ניהול צוות', '👥'],
      ['attendance', 'נוכחות', '📅'],
      ['functioning', 'ציוני תפקוד', '⭐'],
      ['tests', 'מבחנים', '📝'],
      ['medications', 'רפואי', '💊'],
      ['meetings', 'אסיפות', '🤝'],
      ['conversations', 'שיחות', '💬'],
      ['classview', 'תצוגת כיתה', '🏫'],
      ['calendar', 'יומן', '📆'],
      ['reports', 'דוחות', '📊'],
      ['settings', 'הגדרות', '⚙️'],
    ];

    const rows = users.map(u => {
      const perms = String(u['הרשאות'] || '').split(',').map(s => s.trim());
      const isAll = perms.includes('all') || u['תפקיד'] === 'מנהל';
      return `<tr>
        <td><strong>${escHtml(u['שם משתמש']||'')}</strong></td>
        <td>${escHtml(u['שם מלא']||'')}</td>
        <td>${isAll ? '<span class="badge bg-success">כל ההרשאות</span>' : `<span class="badge bg-info">${perms.filter(p=>p).length} הרשאות</span>`}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editUserPermissions('${escAttr(u['שם משתמש']||'')}')">
            <i class="bi bi-pencil"></i> ערוך
          </button>
        </td>
      </tr>`;
    }).join('');

    const html = `<div class="modal fade show" id="perms-mgr" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-shield-check"></i> ניהול הרשאות</h5>
            <button class="btn-close" onclick="document.getElementById('perms-mgr').remove()"></button>
          </div>
          <div class="modal-body" style="max-height:70vh;overflow-y:auto">
            <table class="table table-hover">
              <thead class="table-light"><tr><th>משתמש</th><th>שם מלא</th><th>הרשאות</th><th>פעולה</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    // Store areas globally for edit dialog
    window._PERM_AREAS = AREAS;
  };

  window.editUserPermissions = async function (username) {
    const r = await api('listUsers', []);
    const u = (r.data || []).find(x => x['שם משתמש'] === username);
    if (!u) return alert('משתמש לא נמצא');
    const currentPerms = String(u['הרשאות'] || '').split(',').map(s => s.trim());
    const isAll = currentPerms.includes('all');
    const AREAS = window._PERM_AREAS;

    const checkboxes = AREAS.map(([key, label, icon]) => {
      const checked = isAll || currentPerms.includes(key);
      return `<div class="form-check">
        <input class="form-check-input perm-cb" type="checkbox" value="${key}" ${checked?'checked':''} id="pe-${key}">
        <label class="form-check-label" for="pe-${key}">${icon} ${escHtml(label)}</label>
      </div>`;
    }).join('');

    const html = `<div class="modal fade show" id="perm-edit" style="display:block;background:rgba(0,0,0,0.6);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5>הרשאות ${escHtml(username)}</h5>
            <button class="btn-close" onclick="document.getElementById('perm-edit').remove()"></button>
          </div>
          <div class="modal-body" style="max-height:60vh;overflow-y:auto">
            <div class="d-flex gap-2 mb-3">
              <button class="btn btn-sm btn-outline-success" onclick="document.querySelectorAll('.perm-cb').forEach(c=>c.checked=true)">בחר הכל</button>
              <button class="btn btn-sm btn-outline-danger" onclick="document.querySelectorAll('.perm-cb').forEach(c=>c.checked=false)">בטל הכל</button>
            </div>
            ${checkboxes}
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="saveUserPerms('${escAttr(username)}')">שמור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.saveUserPerms = async function (username) {
    const selected = [...document.querySelectorAll('.perm-cb:checked')].map(c => c.value);
    const allCount = window._PERM_AREAS.length;
    const value = selected.length === allCount ? 'all' : selected.join(',');
    try {
      const r = await api('listUsers', []);
      const u = (r.data || []).find(x => x['שם משתמש'] === username);
      if (!u) return;
      const updated = Object.assign({}, u, { 'הרשאות': value });
      const res = await api('updateUser', [updated]);
      if (res && res.ok !== false) {
        if (typeof toast === 'function') toast(`הרשאות ${username} עודכנו (${selected.length} פיצ'רים)`, 'success');
        document.getElementById('perm-edit')?.remove();
      } else {
        alert('שגיאה: ' + (res?.error || 'unknown'));
      }
    } catch (e) { alert(e.message); }
  };

  // ===== Hide duplicate "user management" in settings =====
  // Add notice in settings pointing to staff
  function injectSettingsNotice() {
    if (location.hash !== '#settings') return;
    const page = document.getElementById('page-settings');
    if (!page || page.querySelector('#settings-staff-link')) return;
    const usersHeader = [...page.querySelectorAll('h5')].find(h => h.textContent.includes('משתמשים'));
    if (!usersHeader) return;
    const link = document.createElement('div');
    link.id = 'settings-staff-link';
    link.className = 'alert alert-info py-2 small';
    link.innerHTML = '💡 לניהול מלא של הצוות (פרטים אישיים, סיסמאות, הרשאות) - <a href="#staff" onclick="goto(\'staff\');return false">עבור לדף ניהול צוות</a>';
    usersHeader.parentNode.insertBefore(link, usersHeader);
  }

  window.addEventListener('hashchange', () => {
    setTimeout(injectPermsIntoStaff, 600);
    setTimeout(injectSettingsNotice, 600);
  });
  setInterval(injectPermsIntoStaff, 5000);
  setInterval(injectSettingsNotice, 5000);
  setTimeout(injectPermsIntoStaff, 2000);
  setTimeout(injectSettingsNotice, 2000);

  console.warn('%c👥 Pack-60 — Unified staff panel: passwords + permissions + personal details', 'color:#2563eb;font-weight:bold');
})();
