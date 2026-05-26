// behavior-pack-62.js — Self-service password change for any user. 2026-05-26
(function () {
  'use strict';

  // ===== Open my password change dialog =====
  window.openMyPasswordChange = async function () {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!u.username) {
      alert('יש להתחבר תחילה');
      return;
    }

    const html = `<div class="modal fade show" id="mypw-modal" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-key"></i> שינוי הסיסמה שלי</h5>
            <button class="btn-close" onclick="document.getElementById('mypw-modal').remove()"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">משתמש</label>
              <input class="form-control" value="${escAttr(u.username)}" readonly disabled>
            </div>
            <div class="mb-3">
              <label class="form-label">סיסמה נוכחית</label>
              <input id="mypw-current" type="password" class="form-control" placeholder="הסיסמה הנוכחית שלך">
            </div>
            <div class="mb-3">
              <label class="form-label">סיסמה חדשה</label>
              <input id="mypw-new" type="text" class="form-control" placeholder="לפחות 4 תווים" style="font-family:monospace">
            </div>
            <div class="mb-3">
              <label class="form-label">אישור סיסמה חדשה</label>
              <input id="mypw-confirm" type="text" class="form-control" style="font-family:monospace">
            </div>
            <div id="mypw-error" class="alert alert-danger d-none"></div>
            <div id="mypw-success" class="alert alert-success d-none"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('mypw-modal').remove()">בטל</button>
            <button class="btn btn-primary" id="mypw-save">שמור סיסמה חדשה</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('mypw-current').focus();

    document.getElementById('mypw-save').onclick = async function () {
      const cur = document.getElementById('mypw-current').value;
      const newPwd = document.getElementById('mypw-new').value;
      const conf = document.getElementById('mypw-confirm').value;
      const errEl = document.getElementById('mypw-error');
      const okEl = document.getElementById('mypw-success');
      errEl.classList.add('d-none');
      okEl.classList.add('d-none');

      // Validation
      if (!cur || !newPwd || !conf) {
        errEl.textContent = 'יש למלא את כל השדות';
        errEl.classList.remove('d-none');
        return;
      }
      if (newPwd.length < 4) {
        errEl.textContent = 'הסיסמה החדשה חייבת לפחות 4 תווים';
        errEl.classList.remove('d-none');
        return;
      }
      if (newPwd !== conf) {
        errEl.textContent = 'סיסמת אישור לא תואמת';
        errEl.classList.remove('d-none');
        return;
      }

      // Verify current password
      try {
        const r = await api('authenticate', [u.username, cur]);
        if (!r || r.ok === false || (r.data && r.data.ok === false)) {
          errEl.textContent = '❌ סיסמה נוכחית שגויה';
          errEl.classList.remove('d-none');
          return;
        }
      } catch (e) {
        errEl.textContent = 'שגיאת חיבור: ' + e.message;
        errEl.classList.remove('d-none');
        return;
      }

      // Update password
      try {
        const usersResp = await api('listUsers', []);
        const myUser = (usersResp.data || []).find(x => x['שם משתמש'] === u.username);
        if (!myUser) throw new Error('משתמש לא נמצא');
        const updated = Object.assign({}, myUser, { 'סיסמה': newPwd });
        const upRes = await api('updateUser', [updated]);
        if (upRes && upRes.ok !== false) {
          okEl.textContent = '✅ הסיסמה שונתה בהצלחה!';
          okEl.classList.remove('d-none');
          if (typeof toast === 'function') toast('הסיסמה שלך שונתה', 'success');
          setTimeout(() => {
            document.getElementById('mypw-modal')?.remove();
          }, 2000);
        } else {
          errEl.textContent = 'שגיאה: ' + (upRes?.error || 'unknown');
          errEl.classList.remove('d-none');
        }
      } catch (e) {
        errEl.textContent = 'שגיאה: ' + e.message;
        errEl.classList.remove('d-none');
      }
    };
  };

  // ===== Inject "Change my password" button in user-info area =====
  function injectMyPwBtn() {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!u.username) return;

    // Look for user-info or logout button area
    const candidates = [
      document.querySelector('#user-info'),
      document.querySelector('a[onclick*="logout"], button[onclick*="logout"]'),
    ];
    let target = null;
    for (const c of candidates) {
      if (c && c.offsetParent) { target = c; break; }
    }
    if (!target) return;
    if (target.parentNode.querySelector('#mypw-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'mypw-btn';
    btn.className = 'btn btn-sm btn-outline-light';
    btn.style.cssText = 'margin-left:8px;font-size:12px';
    btn.innerHTML = '🔑 שנה סיסמה';
    btn.onclick = openMyPasswordChange;
    target.parentNode.insertBefore(btn, target);
  }

  setInterval(injectMyPwBtn, 3000);
  setTimeout(injectMyPwBtn, 1000);

  // ===== Also add to FAB menu =====
  if (window.MENU_ITEMS) {
    if (!window.MENU_ITEMS.find(m => m.label === 'שנה את הסיסמה שלי')) {
      window.MENU_ITEMS.push({ icon: '🔑', label: 'שנה את הסיסמה שלי', action: openMyPasswordChange });
    }
  }

  console.warn('%c🔑 Pack-62 — Self-service password change available', 'color:#7c3aed;font-weight:bold');
})();
