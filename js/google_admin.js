/*
 * google_admin.js — Admin UI for managing the Google users list.
 *
 * Admin (role==='מנהל' or permissions==='all') can:
 *  • View all users + permissions
 *  • Add user (email, name, role, group)
 *  • Edit per-user permissions
 *  • Disable / enable a user
 *  • Save changes by either (a) committing to GitHub via PAT, or
 *                          (b) copying JSON to clipboard and editing on GitHub UI.
 */
(function () {
  'use strict';

  const REPO = 'beit-hatalmud/cheder-bht';
  const FILE_PATH = 'data/google_users.json';
  const PAT_STORAGE_KEY = 'bht_gh_pat';   // admin-only, localStorage on admin's PC

  // Pages registered in app.js permissions table — we will offer them in the UI.
  const KNOWN_AREAS = [
    'home', 'students', 'behavior', 'tasks', 'projects', 'forms',
    'attendance', 'tests', 'reading', 'writing', 'lessonsKlein',
    'functioning', 'medications', 'meetings', 'conversations',
    'signatures', 'calendar', 'classview', 'reports', 'staff',
    'settings', 'cameras',
  ];

  function isAdmin() {
    const u = window.currentUser;
    if (!u) return false;
    if (u.role === 'מנהל') return true;
    if (u.permissions === 'all') return true;
    return false;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /**
   * Ensure page-googleAdmin exists in the DOM.
   * If not, inject it after page-home.
   */
  function ensurePage() {
    let p = document.getElementById('page-googleAdmin');
    if (p) return p;
    p = document.createElement('div');
    p.id = 'page-googleAdmin';
    p.className = 'd-none';
    p.innerHTML = `
      <div class="card p-4 mt-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="m-0"><i class="bi bi-shield-lock"></i> ניהול משתמשי Google</h3>
          <div>
            <button class="btn btn-sm btn-outline-secondary" onclick="googleAdmin.refresh()"><i class="bi bi-arrow-clockwise"></i> רענן</button>
            <button class="btn btn-sm btn-outline-primary" onclick="googleAdmin.openGitHubEdit()"><i class="bi bi-github"></i> ערוך ב-GitHub</button>
            <button class="btn btn-sm btn-outline-success" onclick="googleAdmin.savePAT()"><i class="bi bi-key"></i> הגדר GitHub PAT</button>
          </div>
        </div>

        <div class="alert alert-info small mb-3" id="ga-status">
          טוען...
        </div>

        <h5 class="mt-3">הוספת משתמש חדש</h5>
        <form id="ga-add-form" class="row g-2 mb-4" onsubmit="googleAdmin.addUser(event)">
          <div class="col-md-3">
            <input type="email" class="form-control" id="ga-new-email" placeholder="gmail כתובת" required>
          </div>
          <div class="col-md-3">
            <input type="text" class="form-control" id="ga-new-name" placeholder="שם מלא" required>
          </div>
          <div class="col-md-2">
            <input type="text" class="form-control" id="ga-new-role" placeholder="תפקיד (לדוגמה: רב)" required>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="ga-new-group">
              <option value="">-- בחר קבוצת הרשאות --</option>
            </select>
          </div>
          <div class="col-md-1">
            <button type="submit" class="btn btn-primary w-100"><i class="bi bi-plus"></i></button>
          </div>
        </form>

        <h5>רשימת משתמשים</h5>
        <div class="table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead>
              <tr><th>מייל</th><th>שם</th><th>תפקיד</th><th>הרשאות</th><th>סטטוס</th><th>פעולות</th></tr>
            </thead>
            <tbody id="ga-tbody"></tbody>
          </table>
        </div>

        <h5 class="mt-4">JSON עדכני (להעתקה ל-GitHub)</h5>
        <div class="mb-2">
          <button class="btn btn-sm btn-outline-primary" onclick="googleAdmin.copyJson()"><i class="bi bi-clipboard"></i> העתק JSON</button>
          <button class="btn btn-sm btn-outline-success" onclick="googleAdmin.commitToGitHub()"><i class="bi bi-cloud-upload"></i> שמור ל-GitHub (דורש PAT)</button>
        </div>
        <pre class="border rounded p-2 small bg-light" id="ga-json" style="max-height:300px;overflow:auto"></pre>
      </div>
    `;
    const home = document.getElementById('page-home');
    if (home && home.parentNode) home.parentNode.insertBefore(p, home.nextSibling);
    else document.body.appendChild(p);
    return p;
  }

  let _data = null;
  let _sha = null;   // last known SHA of users.json on GitHub (for PUT)

  async function refresh() {
    if (!isAdmin()) {
      setStatus('warning', 'דף זה זמין רק למנהל.');
      return;
    }
    setStatus('info', 'טוען רשימת משתמשים...');
    try {
      if (typeof invalidateGoogleUsersCache === 'function') invalidateGoogleUsersCache();
      _data = await window.loadGoogleUsers();
      // Try to fetch SHA via GitHub API (best-effort, may fail w/o PAT)
      try {
        const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`);
        if (r.ok) {
          const j = await r.json();
          _sha = j.sha;
        }
      } catch (e) {}
      render();
      setStatus('success', `נטענו ${(_data.users || []).length} משתמשים. אתה: ${window.currentUser && window.currentUser.email}`);
    } catch (e) {
      setStatus('danger', 'שגיאת טעינה: ' + e.message);
    }
  }

  function setStatus(type, msg) {
    const el = document.getElementById('ga-status');
    if (!el) return;
    el.className = 'alert alert-' + type + ' small mb-3';
    el.textContent = msg;
  }

  function render() {
    if (!_data) return;
    // populate group dropdown
    const sel = document.getElementById('ga-new-group');
    if (sel) {
      sel.innerHTML = '<option value="">-- בחר קבוצת הרשאות --</option>';
      const groups = _data._groups || {};
      for (const name of Object.keys(groups)) {
        const o = document.createElement('option');
        o.value = name;
        o.textContent = name + ' (' + (groups[name] === 'all' ? 'גישה מלאה' : groups[name]) + ')';
        sel.appendChild(o);
      }
    }
    // table
    const tb = document.getElementById('ga-tbody');
    if (tb) {
      const users = _data.users || [];
      tb.innerHTML = users.map((u, i) => {
        const isMe = window.currentUser && (u.email === window.currentUser.email);
        return `<tr ${u.active === false ? 'class="text-muted"' : ''}>
          <td><code>${escapeHtml(u.email)}</code>${isMe ? ' <span class="badge bg-success">אני</span>' : ''}</td>
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(u.role || '')}</td>
          <td><small>${escapeHtml(u.permissions || '')}</small></td>
          <td>${u.active === false ? '<span class="badge bg-secondary">מושבת</span>' : '<span class="badge bg-success">פעיל</span>'}</td>
          <td class="text-nowrap">
            <button class="btn btn-xs btn-outline-primary" onclick="googleAdmin.editUser(${i})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-xs btn-outline-warning" onclick="googleAdmin.toggleActive(${i})"><i class="bi bi-toggle-${u.active === false ? 'off' : 'on'}"></i></button>
            ${isMe ? '' : `<button class="btn btn-xs btn-outline-danger" onclick="googleAdmin.removeUser(${i})"><i class="bi bi-trash"></i></button>`}
          </td>
        </tr>`;
      }).join('');
    }
    // JSON preview
    const pre = document.getElementById('ga-json');
    if (pre) pre.textContent = JSON.stringify(_data, null, 2);
  }

  function addUser(ev) {
    if (ev) ev.preventDefault();
    if (!_data) return;
    const email = document.getElementById('ga-new-email').value.trim().toLowerCase();
    const name = document.getElementById('ga-new-name').value.trim();
    const role = document.getElementById('ga-new-role').value.trim();
    const group = document.getElementById('ga-new-group').value.trim();
    if (!email || !name || !role) { alert('יש למלא מייל, שם ותפקיד'); return; }
    const users = _data.users || (_data.users = []);
    if (users.some(u => String(u.email).toLowerCase() === email)) {
      alert('מייל זה כבר קיים');
      return;
    }
    users.push({
      email, name, role,
      permissions: group || 'home',
      active: true,
      added: new Date().toISOString().slice(0, 10),
    });
    document.getElementById('ga-add-form').reset();
    render();
    setStatus('warning', 'משתמש נוסף לרשימה — לחץ "שמור ל-GitHub" או "ערוך ב-GitHub" כדי שזה יחיה.');
  }

  function editUser(i) {
    if (!_data) return;
    const u = _data.users[i];
    if (!u) return;
    const groups = _data._groups || {};
    const choices = Object.keys(groups).map(g => `${g} → ${groups[g]}`).join('\n');
    const cur = u.permissions || '';
    const np = prompt(
      `הרשאות נוכחיות ל-${u.email}:\n${cur}\n\nקבוצות זמינות:\n${choices}\n\nהזן שם קבוצה (לדוגמה: רב) או רשימה מופרדת בפסיק (לדוגמה: home,students,behavior):`,
      cur
    );
    if (np === null) return;
    u.permissions = np.trim();
    render();
    setStatus('warning', 'הרשאות עודכנו — שמור ל-GitHub');
  }

  function toggleActive(i) {
    const u = _data && _data.users && _data.users[i];
    if (!u) return;
    u.active = (u.active === false);
    render();
    setStatus('warning', `סטטוס שונה — שמור ל-GitHub`);
  }

  function removeUser(i) {
    const u = _data && _data.users && _data.users[i];
    if (!u) return;
    if (!confirm(`למחוק את ${u.email}?`)) return;
    _data.users.splice(i, 1);
    render();
    setStatus('warning', 'משתמש נמחק — שמור ל-GitHub');
  }

  function copyJson() {
    if (!_data) return;
    const txt = JSON.stringify(_data, null, 2);
    navigator.clipboard.writeText(txt).then(
      () => setStatus('success', 'הועתק. הדבק ב-GitHub בעריכת data/google_users.json'),
      () => alert('העתקה נכשלה — סמן ידנית מתוך התצוגה למטה.')
    );
  }

  function openGitHubEdit() {
    const url = `https://github.com/${REPO}/edit/main/${FILE_PATH}`;
    window.open(url, '_blank');
  }

  function savePAT() {
    const cur = localStorage.getItem(PAT_STORAGE_KEY) || '';
    const v = prompt(
      'הזן GitHub Personal Access Token (עם הרשאת write לrepo cheder-bht).\n' +
      'יווצר ב: https://github.com/settings/personal-access-tokens/new\n' +
      'שמור רק במחשב שלך (בlocalStorage).\n\n' +
      'ריק = ימחק את הקיים.',
      cur
    );
    if (v === null) return;
    if (!v.trim()) {
      localStorage.removeItem(PAT_STORAGE_KEY);
      setStatus('info', 'PAT הוסר');
    } else {
      localStorage.setItem(PAT_STORAGE_KEY, v.trim());
      setStatus('success', 'PAT נשמר. עכשיו אפשר ללחוץ "שמור ל-GitHub" לעדכון ישיר.');
    }
  }

  async function commitToGitHub() {
    if (!_data) return;
    const pat = localStorage.getItem(PAT_STORAGE_KEY);
    if (!pat) {
      if (confirm('אין GitHub PAT שמור. להגדיר עכשיו?')) savePAT();
      return;
    }
    setStatus('info', 'שולח עדכון ל-GitHub...');
    try {
      // Get current SHA
      const head = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
        headers: { Authorization: 'token ' + pat }
      });
      if (!head.ok) throw new Error('GET sha failed: ' + head.status);
      const meta = await head.json();
      const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(_data, null, 2))));
      const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: {
          Authorization: 'token ' + pat,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'admin: update google_users.json via UI',
          content: newContent,
          sha: meta.sha,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error('PUT failed: ' + r.status + ' ' + t.substring(0, 200));
      }
      const result = await r.json();
      _sha = result.content && result.content.sha;
      setStatus('success', 'נשמר ב-GitHub. השינויים יחיו תוך 30-60 שניות.');
    } catch (e) {
      setStatus('danger', 'שגיאת שמירה: ' + e.message);
    }
  }

  window.googleAdmin = {
    refresh, addUser, editUser, toggleActive, removeUser,
    copyJson, openGitHubEdit, savePAT, commitToGitHub,
  };

  // Auto-refresh when navigating to the page
  window.addEventListener('hashchange', () => {
    if (location.hash === '#googleAdmin') {
      ensurePage();
      refresh();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    ensurePage();
    if (location.hash === '#googleAdmin') refresh();
  });
})();
