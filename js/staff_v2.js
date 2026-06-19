/**
 * staff_v2.js — modern card-based staff & permissions panel.
 *
 * Replaces the old table-based renderStaff (in js/staff.js). Designed
 * to look great on desktop and mobile, with inline role editing and
 * a beautiful stats header. Activated automatically when #staff loads.
 */
(function () {
  'use strict';

  const ROLE_COLORS = {
    'מנהל':    { bg: '#fee2e2', fg: '#991b1b', dot: '#dc2626', icon: 'bi-shield-fill-check' },
    'רב':      { bg: '#dcfce7', fg: '#166534', dot: '#16a34a', icon: 'bi-book-fill' },
    'מורה':    { bg: '#dbeafe', fg: '#1e40af', dot: '#2563eb', icon: 'bi-pencil-fill' },
    'מזכירות': { bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b', icon: 'bi-clipboard-check' },
    'קריאה':   { bg: '#e2e8f0', fg: '#475569', dot: '#64748b', icon: 'bi-eye-fill' },
  };

  const ROLE_PRESETS = {
    'מנהל':    ['students','behavior','writing','reading','lessonsKlein','tasks','projects','formsMgmt','functioning','tests','medications','attendance','meetings','conversations','calendar','classview','cameras','reports','staff','settings'],
    'רב':      ['students','behavior','writing','reading','lessonsKlein','functioning','tests','medications','attendance','meetings','conversations','calendar','classview','reports'],
    'מורה':    ['students','behavior','writing','reading','functioning','attendance','conversations','classview','calendar'],
    'מזכירות': ['students','meetings','reports','attendance','calendar','formsMgmt'],
    'קריאה':   ['students','classview','calendar'],
  };

  let _users = [];
  let _filter = 'all';
  let _query = '';

  function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('');
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function escAttr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  function isAdmin() {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u && (u.username === 'admin' || u.role === 'מנהל');
    } catch (_) { return false; }
  }

  function roleColor(role) {
    return ROLE_COLORS[role] || ROLE_COLORS['קריאה'];
  }

  function ensureStyle() {
    if (document.getElementById('staff-v2-style')) return;
    const css = `
      #page-staff .stf-header {
        background: linear-gradient(135deg, #eef2ff 0%, #fff 60%);
        border-radius: 18px;
        padding: 24px;
        margin-bottom: 18px;
        box-shadow: 0 1px 3px rgba(15,23,42,.06);
        border: 1px solid rgba(226,232,240,.7);
      }
      #page-staff .stf-header h2 { margin: 0; font-size: 1.6rem; font-weight: 700; color: #0f172a; }
      #page-staff .stf-header .sub { color: #64748b; font-size: .92rem; margin-top: 4px }
      #page-staff .stf-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-top: 16px }
      #page-staff .stf-stat { background: #fff; border-radius: 12px; padding: 12px 14px; box-shadow: 0 1px 3px rgba(15,23,42,.05); border: 1px solid #f1f5f9 }
      #page-staff .stf-stat .num { font-size: 1.8rem; font-weight: 700; line-height: 1 }
      #page-staff .stf-stat .lbl { color: #64748b; font-size: .8rem; margin-top: 4px }
      #page-staff .stf-toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin: 14px 0 18px }
      #page-staff .stf-toolbar input { flex: 1; min-width: 200px; padding: 10px 14px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: .95rem; transition: border-color .2s, box-shadow .2s }
      #page-staff .stf-toolbar input:focus { outline: 0; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15) }
      #page-staff .stf-toolbar .add-btn { padding: 10px 18px; border-radius: 12px; background: linear-gradient(135deg, #16a34a, #15803d); color: white; border: 0; font-weight: 600; font-size: .95rem; cursor: pointer; box-shadow: 0 4px 14px rgba(22,163,74,.35); display: flex; align-items: center; gap: 8px; transition: transform .15s, box-shadow .25s }
      #page-staff .stf-toolbar .add-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(22,163,74,.45) }
      #page-staff .stf-toolbar .add-btn:active { transform: translateY(0) }
      #page-staff .stf-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px }
      #page-staff .stf-chip { padding: 6px 14px; border-radius: 20px; background: #f1f5f9; color: #475569; font-size: .85rem; cursor: pointer; border: 1.5px solid transparent; transition: all .15s; user-select: none }
      #page-staff .stf-chip.active { background: #2563eb; color: white; border-color: #2563eb }
      #page-staff .stf-chip:hover:not(.active) { background: #e2e8f0 }
      #page-staff .stf-chip .count { opacity: .65; font-size: .78rem; margin-right: 4px }
      #page-staff .stf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px }
      #page-staff .stf-card { background: #fff; border-radius: 16px; padding: 18px; box-shadow: 0 1px 3px rgba(15,23,42,.06); border: 1px solid #f1f5f9; transition: transform .15s, box-shadow .25s, border-color .2s; position: relative; cursor: pointer }
      #page-staff .stf-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(15,23,42,.1); border-color: #cbd5e1 }
      #page-staff .stf-card .avatar { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; color: white; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,.18) }
      #page-staff .stf-card .name { font-weight: 700; font-size: 1.05rem; color: #0f172a; margin-bottom: 4px; line-height: 1.2 }
      #page-staff .stf-card .uname { font-size: .8rem; color: #94a3b8; margin-bottom: 12px }
      #page-staff .stf-card .role-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: .78rem; font-weight: 600 }
      #page-staff .stf-card .role-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0 }
      #page-staff .stf-card .meta { color: #64748b; font-size: .85rem; margin-top: 12px; line-height: 1.6; border-top: 1px dashed #e2e8f0; padding-top: 10px }
      #page-staff .stf-card .meta a { color: #2563eb; text-decoration: none }
      #page-staff .stf-card .actions { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap }
      #page-staff .stf-card .actions .quick-role { padding: 4px 8px; font-size: .7rem; border-radius: 6px; border: 1px solid transparent; cursor: pointer; font-weight: 500; transition: all .15s; opacity: 0; max-height: 0; overflow: hidden }
      #page-staff .stf-card:hover .actions .quick-role,
      #page-staff .stf-card.show-roles .actions .quick-role { opacity: 1; max-height: 30px }
      #page-staff .stf-card .actions .quick-role.current { opacity: .35; cursor: default }
      #page-staff .stf-card .delete-btn { background: rgba(220,38,38,.08); color: #dc2626; border: 0; padding: 6px 10px; border-radius: 8px; font-size: .78rem; cursor: pointer; margin-right: auto }
      #page-staff .stf-card .delete-btn:hover { background: rgba(220,38,38,.18) }
      #page-staff .stf-card.admin { background: linear-gradient(135deg, #fff, #fee2e2 200%); }
      #page-staff .stf-empty { text-align: center; padding: 60px 20px; color: #94a3b8 }
      #page-staff .stf-empty .bi { font-size: 3rem; color: #cbd5e1; margin-bottom: 12px }
      [data-theme="dark"] #page-staff .stf-header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 60%); border-color: #334155 }
      [data-theme="dark"] #page-staff .stf-header h2 { color: #e2e8f0 }
      [data-theme="dark"] #page-staff .stf-stat { background: #1e293b; border-color: #334155 }
      [data-theme="dark"] #page-staff .stf-toolbar input { background: #1e293b; color: #e2e8f0; border-color: #334155 }
      [data-theme="dark"] #page-staff .stf-toolbar input:focus { border-color: #60a5fa }
      [data-theme="dark"] #page-staff .stf-chip { background: #1e293b; color: #cbd5e1 }
      [data-theme="dark"] #page-staff .stf-chip:hover:not(.active) { background: #243149 }
      [data-theme="dark"] #page-staff .stf-card { background: #1e293b; border-color: #334155 }
      [data-theme="dark"] #page-staff .stf-card .name { color: #e2e8f0 }
      [data-theme="dark"] #page-staff .stf-card .meta { color: #94a3b8; border-top-color: #334155 }
      @media (max-width: 480px) {
        #page-staff .stf-grid { grid-template-columns: 1fr }
        #page-staff .stf-card .actions .quick-role { opacity: 1; max-height: 30px }
      }
    `;
    const s = document.createElement('style');
    s.id = 'staff-v2-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  async function loadUsers() {
    try {
      const r = await api('listUsers', []);
      _users = (r && r.data) || [];
    } catch (_) {
      _users = [];
    }
  }

  function renderStats() {
    const total = _users.length;
    const admins = _users.filter(u => u['תפקיד'] === 'מנהל' || u['שם משתמש'] === 'admin').length;
    const rabbis = _users.filter(u => (u['תפקיד'] || '').startsWith('הרב') || u['תפקיד'] === 'רב').length;
    const missing = _users.filter(u => !u['אימייל'] && u['שם משתמש'] !== 'admin').length;
    return `
      <div class="stf-stat"><div class="num text-primary">${total}</div><div class="lbl">סה"כ צוות</div></div>
      <div class="stf-stat"><div class="num text-danger">${admins}</div><div class="lbl">מנהלים</div></div>
      <div class="stf-stat"><div class="num text-success">${rabbis}</div><div class="lbl">רבנים</div></div>
      <div class="stf-stat"><div class="num text-warning">${missing}</div><div class="lbl">חסר אימייל</div></div>
    `;
  }

  function renderChips() {
    const roles = ['all', ...new Set(_users.map(u => u['תפקיד']).filter(Boolean))];
    return roles.map(r => {
      const n = r === 'all' ? _users.length : _users.filter(u => u['תפקיד'] === r).length;
      const active = _filter === r;
      return `<div class="stf-chip ${active ? 'active' : ''}" onclick="window.bhtStaffSetFilter('${escAttr(r)}')">${r === 'all' ? 'הכל' : escHtml(r)}<span class="count">${n}</span></div>`;
    }).join('');
  }

  function filteredUsers() {
    let list = _users;
    if (_filter !== 'all') list = list.filter(u => u['תפקיד'] === _filter);
    if (_query) {
      const q = _query.toLowerCase();
      list = list.filter(u =>
        ['שם מלא','שם משתמש','תפקיד','אימייל','טלפון','תז']
          .some(k => String(u[k] || '').toLowerCase().includes(q))
      );
    }
    return list;
  }

  function renderCard(u) {
    const uname = u['שם משתמש'] || '';
    const fullname = u['שם מלא'] || uname;
    const role = u['תפקיד'] || 'לא הוגדר';
    const phone = u['טלפון'] || '';
    const email = u['אימייל'] || '';
    const c = roleColor(role);
    const isThisAdmin = uname === 'admin';
    const editEsc = escAttr(uname);
    const roleButtons = Object.keys(ROLE_PRESETS).map(r => {
      const isCurrent = r === role;
      const rc = ROLE_COLORS[r];
      return `<button class="quick-role ${isCurrent ? 'current' : ''}"
        style="background:${rc.bg};color:${rc.fg}"
        onclick="event.stopPropagation();window.bhtStaffSetRole('${editEsc}','${r}')"
        ${isCurrent ? 'disabled' : ''}
        title="הפוך ל-${r}">${r}</button>`;
    }).join('');
    return `
      <div class="stf-card ${isThisAdmin ? 'admin' : ''}" onclick="window.bhtStaffEdit('${editEsc}')">
        <div class="avatar" style="background:linear-gradient(135deg, ${c.dot}, ${c.fg})">${escHtml(initials(fullname))}</div>
        <div class="name">${escHtml(fullname)}</div>
        <div class="uname">@${escHtml(uname)}</div>
        <span class="role-badge" style="background:${c.bg};color:${c.fg}">
          <span class="role-dot" style="background:${c.dot}"></span>
          <i class="bi ${c.icon}"></i>
          ${escHtml(role)}
        </span>
        ${phone || email ? `
          <div class="meta">
            ${phone ? `<div><i class="bi bi-telephone"></i> <a href="tel:${escAttr(phone)}" onclick="event.stopPropagation()">${escHtml(phone)}</a></div>` : ''}
            ${email ? `<div><i class="bi bi-envelope"></i> <a href="mailto:${escAttr(email)}" onclick="event.stopPropagation()">${escHtml(email)}</a></div>` : ''}
          </div>` : ''}
        <div class="actions">
          ${roleButtons}
          ${!isThisAdmin ? `<button class="delete-btn" onclick="event.stopPropagation();window.bhtStaffDelete('${editEsc}')"><i class="bi bi-trash"></i></button>` : ''}
        </div>
      </div>
    `;
  }

  function renderGrid() {
    const list = filteredUsers();
    if (!list.length) {
      return `<div class="stf-empty"><i class="bi bi-search"></i><div>אין משתמשים תואמים לסינון</div></div>`;
    }
    return `<div class="stf-grid">${list.map(renderCard).join('')}</div>`;
  }

  async function render() {
    const page = document.getElementById('page-staff');
    if (!page) return;
    ensureStyle();
    page.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="stf-header">
        <div class="d-flex align-items-start gap-3 flex-wrap">
          <div style="flex:1;min-width:240px">
            <h2><i class="bi bi-people-fill"></i> ניהול צוות והרשאות</h2>
            <div class="sub">לחיצה על תפקיד = שינוי מיידי. לחיצה על שורה = עריכה מלאה.</div>
          </div>
        </div>
        <div class="stf-stats" id="stf-stats-cont"><div class="text-center p-3"><div class="spinner-border text-primary"></div></div></div>
      </div>
      <div class="stf-toolbar">
        <input id="stf-search" placeholder="🔍 חיפוש שם / תפקיד / טלפון / אימייל..." autocomplete="off">
        <button class="add-btn" onclick="if(typeof addUserModal==='function')addUserModal()"><i class="bi bi-person-plus-fill"></i> משתמש חדש</button>
        ${isAdmin() ? `<button class="add-btn" style="background:linear-gradient(135deg,#7c3aed,#5b21b6);box-shadow:0 4px 14px rgba(124,58,237,.35)" onclick="if(window.openAuditLog)openAuditLog()" title="יומן פעולות"><i class="bi bi-journal-text"></i> יומן</button>` : ''}
        ${isAdmin() ? `<button class="add-btn" style="background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 4px 14px rgba(245,158,11,.35)" onclick="if(window.bhtExportAll)bhtExportAll()" title="ייצא כל הטבלאות"><i class="bi bi-archive"></i> ייצא הכל</button>` : ''}
      </div>
      <div class="stf-chips" id="stf-chips"></div>
      <div id="stf-grid-cont"></div>
    `;
    await loadUsers();
    document.getElementById('stf-stats-cont').innerHTML = renderStats();
    document.getElementById('stf-chips').innerHTML = renderChips();
    document.getElementById('stf-grid-cont').innerHTML = renderGrid();
    const search = document.getElementById('stf-search');
    if (search) search.oninput = (e) => { _query = e.target.value; document.getElementById('stf-grid-cont').innerHTML = renderGrid(); };
  }

  window.bhtStaffSetFilter = function (key) {
    _filter = key;
    document.getElementById('stf-chips').innerHTML = renderChips();
    document.getElementById('stf-grid-cont').innerHTML = renderGrid();
  };

  window.bhtStaffEdit = function (uname) {
    if (typeof editUser === 'function') editUser(uname);
  };

  window.bhtStaffDelete = async function (uname) {
    if (!isAdmin()) return alert('פעולה זו זמינה למנהל בלבד');
    if (!confirm(`למחוק את "${uname}"?`)) return;
    try {
      const r = await api('deleteUser', [uname]);
      if (r && r.ok) {
        if (window.bhtNotify) window.bhtNotify(`${uname} נמחק ✓`, 'success');
        render();
      } else {
        alert('שגיאה: ' + ((r && r.error) || 'לא ידוע'));
      }
    } catch (e) {
      alert('שגיאה: ' + (e.message || e));
    }
  };

  window.bhtStaffSetRole = async function (uname, role) {
    if (!isAdmin()) return alert('פעולה זו זמינה למנהל בלבד');
    const perms = ROLE_PRESETS[role];
    if (!perms) return;
    if (!confirm(`לשנות את ${uname} ל-${role}?`)) return;
    try {
      const obj = {
        'שם משתמש': uname,
        'תפקיד': role,
        'הרשאות': perms.join(','),
        'תלמידים_מורשים': role === 'מנהל' || role === 'מזכירות' ? 'all' : '',
        'כיתות_מורשות': role === 'מנהל' || role === 'מזכירות' ? 'all' : '',
      };
      const r = await api('updateUser', [obj, uname]);
      if (r && r.ok) {
        if (window.bhtNotify) window.bhtNotify(`${uname} → ${role} ✓`, 'success');
        render();
      } else {
        alert('שגיאה: ' + ((r && r.error) || 'לא ידוע'));
      }
    } catch (e) {
      alert('שגיאה: ' + (e.message || e));
    }
  };

  // Override the legacy renderStaff so #staff uses the new view
  window.renderStaff = render;

  // Auto-render when navigating
  window.addEventListener('hashchange', () => {
    if (location.hash === '#staff') setTimeout(render, 100);
  });
})();
