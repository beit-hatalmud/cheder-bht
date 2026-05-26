// behavior-pack-59.js — Show & manage passwords in admin panel. 2026-05-26
(function () {
  'use strict';

  // Only show for admins
  function isAdmin() {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u.role === 'מנהל' || u.username === 'admin' || u.username === 'ירושלמי';
    } catch { return false; }
  }

  // ===== Inject password column into users table (settings/staff) =====
  async function injectPasswordColumn() {
    if (!isAdmin()) return;
    const page = document.getElementById('page-settings') || document.getElementById('page-staff');
    if (!page || !page.querySelector('table') || page.querySelector('#pw-mgr-banner')) return;

    // Add banner with link to password manager
    const h3 = page.querySelector('h3, h4');
    if (h3 && !page.querySelector('#pw-mgr-banner')) {
      const banner = document.createElement('div');
      banner.id = 'pw-mgr-banner';
      banner.style.cssText = 'background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #ca8a04;border-radius:10px;padding:14px;margin:12px 0;direction:rtl';
      banner.innerHTML = `
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <strong style="color:#854d0e">🔑 ניהול סיסמאות</strong>
            <div class="small text-muted">צפייה ושינוי סיסמאות לכל המשתמשים</div>
          </div>
          <button class="btn btn-warning" onclick="openPasswordManager()">
            <i class="bi bi-key"></i> פתח מנהל סיסמאות
          </button>
        </div>
      `;
      h3.parentNode.insertBefore(banner, h3.nextSibling);
    }
  }

  // ===== Password manager modal =====
  window.openPasswordManager = async function () {
    if (!isAdmin()) {
      if (typeof toast === 'function') toast('רק מנהל יכול לנהל סיסמאות', 'warn');
      return;
    }

    // Load users
    let users = [];
    try {
      const r = await api('listUsers', []);
      users = r.data || [];
    } catch (e) {
      alert('שגיאה בטעינת משתמשים: ' + e.message);
      return;
    }

    const rows = users.map(u => {
      const pwd = u['סיסמה'] || '';
      const isHashed = String(pwd).startsWith('sha256:');
      const displayPwd = isHashed ? '••••••••' : pwd;
      return `<tr>
        <td><strong>${escHtml(u['שם משתמש']||'')}</strong></td>
        <td>${escHtml(u['שם מלא']||'')}</td>
        <td>${escHtml(u['תפקיד']||'')}</td>
        <td>
          <code id="pw-${escAttr(u['שם משתמש']||'')}" style="font-family:monospace;background:#f3f4f6;padding:2px 8px;border-radius:4px;${isHashed?'color:#9ca3af':''}">${escHtml(displayPwd)}</code>
          ${isHashed ? '<small class="text-warning ms-1">🔒 מוצפן</small>' : ''}
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="changeUserPassword('${escAttr(u['שם משתמש']||'')}')">
            <i class="bi bi-pencil"></i> שנה
          </button>
          <button class="btn btn-sm btn-outline-secondary" onclick="copyUserPassword('${escAttr(u['שם משתמש']||'')}', '${escAttr(displayPwd)}')">
            📋
          </button>
        </td>
      </tr>`;
    }).join('');

    const html = `<div class="modal fade show" id="pw-mgr-modal" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-key"></i> ניהול סיסמאות (${users.length} משתמשים)</h5>
            <div>
              <button class="btn btn-sm btn-outline-primary" onclick="exportPasswordsCSV()">⬇ ייצוא CSV</button>
              <button class="btn btn-sm btn-outline-info" onclick="printPasswords()">🖨 הדפס</button>
              <button class="btn-close" onclick="document.getElementById('pw-mgr-modal').remove()"></button>
            </div>
          </div>
          <div class="modal-body" style="max-height:70vh;overflow-y:auto">
            <div class="alert alert-warning">
              <strong>⚠ אזהרת אבטחה:</strong> סיסמאות מוצגות בטקסט גלוי. אל תשתף את המסך הזה.
            </div>
            <input id="pw-search" class="form-control mb-3" placeholder="חיפוש משתמש...">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>שם משתמש</th>
                  <th>שם מלא</th>
                  <th>תפקיד</th>
                  <th>סיסמה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody id="pw-tbody">${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    // Search
    document.getElementById('pw-search').oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      [...document.querySelectorAll('#pw-tbody tr')].forEach(tr => {
        tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    };
  };

  // ===== Change password dialog =====
  window.changeUserPassword = async function (username) {
    const newPwd = prompt(`סיסמה חדשה ל-${username}:`);
    if (!newPwd || newPwd.length < 4) {
      if (newPwd) alert('הסיסמה חייבת לפחות 4 תווים');
      return;
    }
    try {
      // Load user to get full data
      const r = await api('listUsers', []);
      const u = (r.data || []).find(x => x['שם משתמש'] === username);
      if (!u) return alert('משתמש לא נמצא');
      const updated = Object.assign({}, u, { 'סיסמה': newPwd });
      const res = await api('updateUser', [updated]);
      if (res && res.ok !== false) {
        if (typeof toast === 'function') toast(`סיסמה של ${username} שונתה`, 'success');
        // Update display
        const codeEl = document.getElementById('pw-' + username);
        if (codeEl) { codeEl.textContent = newPwd; codeEl.style.color = ''; }
      } else {
        alert('שגיאה: ' + (res?.error || 'לא ידוע'));
      }
    } catch (e) {
      alert('שגיאה: ' + e.message);
    }
  };

  // ===== Copy password =====
  window.copyUserPassword = function (username, password) {
    if (!password || password === '••••••••') {
      if (typeof toast === 'function') toast('סיסמה מוצפנת - אי-אפשר להעתיק', 'warn');
      return;
    }
    navigator.clipboard.writeText(password).then(() => {
      if (typeof toast === 'function') toast(`סיסמה של ${username} הועתקה`, 'success');
    });
  };

  // ===== Export passwords CSV =====
  window.exportPasswordsCSV = async function () {
    try {
      const r = await api('listUsers', []);
      const users = r.data || [];
      let csv = '﻿שם משתמש,שם מלא,תפקיד,סיסמה,מוצפן\n';
      users.forEach(u => {
        const pwd = u['סיסמה'] || '';
        const isHashed = String(pwd).startsWith('sha256:');
        csv += `"${(u['שם משתמש']||'').replace(/"/g,'""')}","${(u['שם מלא']||'').replace(/"/g,'""')}","${(u['תפקיד']||'').replace(/"/g,'""')}","${isHashed?'מוצפן':pwd.replace(/"/g,'""')}",${isHashed?'כן':'לא'}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `passwords_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      if (typeof toast === 'function') toast('CSV הורד', 'success');
    } catch (e) { alert(e.message); }
  };

  // ===== Print passwords =====
  window.printPasswords = async function () {
    const r = await api('listUsers', []);
    const users = r.data || [];
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>סיסמאות</title>
      <style>body{font-family:Heebo,Arial;padding:20px;max-width:700px;margin:0 auto}
      table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ccc;text-align:right}th{background:#f3f4f6}
      .warn{background:#fef3c7;border:2px solid #ca8a04;padding:14px;border-radius:8px;margin-bottom:20px}
      </style></head><body>
      <h2>🔑 סיסמאות - בית התלמוד</h2>
      <div class="warn">⚠ מסמך רגיש! לשמור במקום בטוח. ${new Date().toLocaleDateString('he-IL')}</div>
      <table><thead><tr><th>משתמש</th><th>שם מלא</th><th>תפקיד</th><th>סיסמה</th></tr></thead><tbody>
      ${users.map(u => {
        const pwd = u['סיסמה'] || '';
        const isHashed = String(pwd).startsWith('sha256:');
        return `<tr><td>${u['שם משתמש']||''}</td><td>${u['שם מלא']||''}</td><td>${u['תפקיד']||''}</td><td style="font-family:monospace">${isHashed?'מוצפן':pwd}</td></tr>`;
      }).join('')}
      </tbody></table>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== Auto-inject banner =====
  window.addEventListener('hashchange', () => setTimeout(injectPasswordColumn, 800));
  setInterval(injectPasswordColumn, 5000);
  setTimeout(injectPasswordColumn, 2000);

  // Add to FAB menu
  if (window.MENU_ITEMS && !window.MENU_ITEMS.find(m => m.label?.includes('סיסמאות'))) {
    window.MENU_ITEMS.push({ icon: '🔑', label: 'ניהול סיסמאות', action: () => openPasswordManager() });
  }

  console.warn('%c🔑 Pack-59 — Password manager (admin only): view/edit/CSV/print', 'color:#ca8a04;font-weight:bold');
})();
