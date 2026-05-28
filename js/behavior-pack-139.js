// behavior-pack-139.js — Change Password modal (post-AuthV2 lockout rescue). 2026-05-28
// Calls backend action=changePassword with the session JWT (bht_jwt). Uses the
// existing window.toast for feedback. Disabled button + spinner during submit.
(function () {
  'use strict';

  const WEBHOOK = (function () {
    try {
      const tag = Array.from(document.querySelectorAll('script[src]'))
        .map(s => s.src).find(s => /\/api\.js/.test(s));
      return null; // we'll read APPS_SCRIPT_URL via window below
    } catch { return null; }
  })();

  function getWebhookUrl() {
    if (typeof window.APPS_SCRIPT_URL === 'string') return window.APPS_SCRIPT_URL;
    // api.js declares APPS_SCRIPT_URL as a const — fall back to known production URL
    return 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  }

  function notify(msg, kind) {
    if (typeof window.toast === 'function') return window.toast(msg, kind || 'info', 4000);
    if (kind === 'error') console.error('[change-password]', msg); else console.log('[change-password]', msg);
    try { alert(msg); } catch {}
  }

  function ensureLink() {
    // Skip if user not logged in
    let user;
    try { user = JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { user = null; }
    if (!user || !user.username) return;
    const ui = document.getElementById('user-info');
    if (!ui) return;
    if (document.getElementById('change-pwd-btn-139')) return;
    const btn = document.createElement('button');
    btn.id = 'change-pwd-btn-139';
    btn.className = 'btn btn-sm btn-outline-light ms-2 no-print';
    btn.style.cssText = 'font-size:11px;padding:2px 8px';
    btn.title = 'שינוי סיסמה';
    btn.innerHTML = '<i class="bi bi-key"></i> סיסמה';
    btn.onclick = openModal;
    // Insert at the start of user-info so it appears before the logout button
    ui.appendChild(btn);
  }

  function openModal() {
    if (document.getElementById('change-pwd-modal-139')) return;
    const overlay = document.createElement('div');
    overlay.id = 'change-pwd-modal-139';
    overlay.className = 'no-print';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9990;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:Heebo,sans-serif';
    overlay.innerHTML = `
      <div style="background:#fff;width:min(440px,92vw);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden">
        <div style="padding:16px 18px;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;display:flex;align-items:center;gap:8px"><i class="bi bi-key-fill"></i> שינוי סיסמה</span>
          <button type="button" id="cpx-close-139" style="background:rgba(255,255,255,.2);border:0;color:#fff;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:16px">×</button>
        </div>
        <form id="cpx-form-139" style="padding:18px">
          <div class="mb-3">
            <label class="form-label" style="font-size:13px">סיסמה חדשה</label>
            <input id="cpx-new-139" type="password" class="form-control" minlength="4" required autocomplete="new-password">
            <div style="font-size:11px;color:#6b7280;margin-top:4px">לפחות 4 תווים</div>
          </div>
          <div class="mb-3">
            <label class="form-label" style="font-size:13px">אימות סיסמה</label>
            <input id="cpx-confirm-139" type="password" class="form-control" minlength="4" required autocomplete="new-password">
          </div>
          <div id="cpx-err-139" class="alert alert-danger d-none" style="font-size:13px;padding:8px 12px;margin-bottom:12px"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button type="button" id="cpx-cancel-139" class="btn btn-outline-secondary">ביטול</button>
            <button type="submit" id="cpx-submit-139" class="btn btn-primary"><i class="bi bi-check-lg me-1"></i>שמור</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { const el = document.getElementById('cpx-new-139'); if (el) el.focus(); }, 50);

    const close = () => overlay.remove();
    document.getElementById('cpx-close-139').onclick = close;
    document.getElementById('cpx-cancel-139').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    const form = document.getElementById('cpx-form-139');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const newPwd = document.getElementById('cpx-new-139').value;
      const conf = document.getElementById('cpx-confirm-139').value;
      const err = document.getElementById('cpx-err-139');
      err.classList.add('d-none');
      if (!newPwd || newPwd.length < 4) { err.textContent = 'לפחות 4 תווים'; err.classList.remove('d-none'); return; }
      if (newPwd !== conf) { err.textContent = 'הסיסמאות אינן זהות'; err.classList.remove('d-none'); return; }
      const session = sessionStorage.getItem('bht_jwt') || '';
      if (!session) { err.textContent = 'אין סשן פעיל — התחבר מחדש'; err.classList.remove('d-none'); return; }

      const submit = document.getElementById('cpx-submit-139');
      const orig = submit.innerHTML;
      submit.disabled = true;
      submit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>שומר...';
      try {
        const body = new URLSearchParams({ action: 'changePassword', session, newPassword: newPwd, instance: 'bht' });
        const r = await fetch(getWebhookUrl(), { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
        const data = await r.json().catch(() => ({ ok: false, error: 'תגובה לא JSON' }));
        if (data && data.ok) {
          notify('הסיסמה עודכנה בהצלחה', 'success');
          close();
        } else {
          err.textContent = (data && data.error) || 'שגיאה לא ידועה';
          err.classList.remove('d-none');
        }
      } catch (ex) {
        err.textContent = 'שגיאת רשת: ' + (ex && ex.message ? ex.message : ex);
        err.classList.remove('d-none');
      } finally {
        submit.disabled = false;
        submit.innerHTML = orig;
      }
    };
  }

  window.openChangePasswordModal = openModal;

  // Mount the link whenever user-info updates (after login)
  setInterval(ensureLink, 1500);
  if (document.readyState === 'complete') ensureLink();
  else window.addEventListener('load', ensureLink);

  console.warn('%c🔑 Pack-139 — Change Password modal (post-AuthV2 rescue) + window.openChangePasswordModal()', 'color:#1e3a8a;font-weight:bold');
})();
