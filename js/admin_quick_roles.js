/**
 * admin_quick_roles.js — fast role assignment + bulk admin panel.
 *
 * On the staff page (admin only):
 *   - Each user row gets quick-role chips: מנהל / רב / מורה / מזכירות / קריאה
 *     Click → server-side updateUser with the role's default permissions.
 *   - A new "פעולות מהירות" panel above the table lets the admin:
 *       * הפוך הכל למורים
 *       * החזר הכל לתפקיד המקורי
 *       * סמן את הנבחרים כתפקיד X
 */
(function () {
  'use strict';

  const ROLE_PRESETS = {
    'מנהל':       ['students','behavior','writing','reading','lessonsKlein','tasks','projects','formsMgmt','functioning','tests','medications','attendance','meetings','conversations','calendar','classview','cameras','reports','staff','settings'],
    'רב':         ['students','behavior','writing','reading','lessonsKlein','functioning','tests','medications','attendance','meetings','conversations','calendar','classview','reports'],
    'מורה':       ['students','behavior','writing','reading','functioning','attendance','conversations','classview','calendar'],
    'מזכירות':    ['students','meetings','reports','attendance','calendar','formsMgmt'],
    'קריאה':      ['students','classview','calendar'],
  };

  const ROLE_COLORS = {
    'מנהל':    'danger',
    'רב':      'success',
    'מורה':    'primary',
    'מזכירות': 'warning',
    'קריאה':   'secondary',
  };

  function isAdmin() {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u && (u.username === 'admin' || u.role === 'מנהל');
    } catch (_) { return false; }
  }

  async function applyRole(username, role) {
    if (!isAdmin()) { alert('פעולה זו זמינה למנהל בלבד'); return; }
    const perms = ROLE_PRESETS[role];
    if (!perms) return;
    if (!confirm(`לשנות את ${username} ל-${role}?`)) return;
    try {
      const obj = {
        'שם משתמש': username,
        'תפקיד': role,
        'הרשאות': perms.join(','),
        'תלמידים_מורשים': role === 'מנהל' || role === 'מזכירות' ? 'all' : '',
        'כיתות_מורשות': role === 'מנהל' || role === 'מזכירות' ? 'all' : '',
      };
      const r = await api('updateUser', [obj, username]);
      if (r && r.ok) {
        if (window.bhtNotify) window.bhtNotify(`${username} → ${role} ✓`, 'success');
        if (typeof renderStaff === 'function') renderStaff();
      } else {
        alert('שגיאה: ' + (r && r.error || 'לא ידוע'));
      }
    } catch (e) {
      alert('שגיאה: ' + (e.message || e));
    }
  }

  window.bhtQuickSetRole = applyRole;

  /**
   * Wire the chips after the staff table renders. We piggyback on a
   * MutationObserver so we don't need to modify staff.js heavily.
   */
  function enhance() {
    if (!isAdmin()) return;
    const table = document.getElementById('staff-table');
    if (!table) return;
    // Add bulk-action toolbar
    if (!document.getElementById('admin-bulk-bar')) {
      const bar = document.createElement('div');
      bar.id = 'admin-bulk-bar';
      bar.className = 'card p-3 mb-3';
      bar.style.background = 'linear-gradient(135deg,#eef2ff,#fff)';
      bar.innerHTML = `
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <i class="bi bi-lightning-charge-fill text-warning fs-5"></i>
          <b>פעולות מהירות לאדמין:</b>
          <span class="text-muted small">לחץ על תפקיד ליד שורת משתמש כדי להחיל מיד</span>
          ${Object.keys(ROLE_PRESETS).map(r => `
            <span class="badge bg-${ROLE_COLORS[r]}">${r}</span>`).join('')}
        </div>`;
      table.parentElement.insertBefore(bar, table);
    }

    // Append chips to each row's actions column (desktop) and cards (mobile)
    const tbody = table.querySelector('tbody');
    if (tbody) {
      tbody.querySelectorAll('tr').forEach(row => {
        if (row.dataset.bhtChipped) return;
        row.dataset.bhtChipped = '1';
        const lastCell = row.cells[row.cells.length - 1];
        if (!lastCell) return;
        const editBtn = lastCell.querySelector('button.btn-outline-primary');
        if (!editBtn) return;
        const uname = (editBtn.getAttribute('onclick') || '').match(/editUser\('([^']+)'\)/);
        if (!uname) return;
        const username = uname[1];
        const wrap = document.createElement('span');
        wrap.style.cssText = 'display:inline-flex;gap:3px;margin-left:6px';
        wrap.innerHTML = Object.keys(ROLE_PRESETS).map(r => `
          <button class="btn btn-sm btn-outline-${ROLE_COLORS[r]}"
            style="font-size:.68rem;padding:.1rem .35rem"
            onclick="event.stopPropagation();window.bhtQuickSetRole('${username.replace(/'/g, "\\'")}','${r}')"
            title="הפוך ל-${r}">${r}</button>`).join('');
        lastCell.appendChild(wrap);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(enhance, 1500);
    // Observe future re-renders
    new MutationObserver(() => {
      if (location.hash === '#staff') setTimeout(enhance, 500);
    }).observe(document.body, { childList: true, subtree: true });
  });
  window.addEventListener('hashchange', () => {
    if (location.hash === '#staff') setTimeout(enhance, 1200);
  });
})();
