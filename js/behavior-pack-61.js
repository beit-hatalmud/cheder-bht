// behavior-pack-61.js — Show password in edit user modal. 2026-05-26
(function () {
  'use strict';

  // ===== Make nu-pass field show as text with toggle visibility =====
  document.addEventListener('shown.bs.modal', e => {
    const modal = e.target;
    if (modal.id !== 'addUModal') return;

    setTimeout(() => {
      const pwd = modal.querySelector('#nu-pass');
      if (!pwd || pwd.dataset.enhanced61) return;
      pwd.dataset.enhanced61 = '1';

      // Make text by default (show actual password)
      pwd.type = 'text';
      pwd.style.fontFamily = 'monospace';

      // Wrap with visibility toggle
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;display:flex;gap:4px;align-items:center';
      pwd.parentNode.insertBefore(wrap, pwd);
      wrap.appendChild(pwd);
      pwd.style.flex = '1';

      // Toggle button (eye)
      const eyeBtn = document.createElement('button');
      eyeBtn.type = 'button';
      eyeBtn.className = 'btn btn-sm btn-outline-secondary';
      eyeBtn.innerHTML = '👁';
      eyeBtn.title = 'הצג/הסתר סיסמה';
      eyeBtn.onclick = (ev) => {
        ev.preventDefault();
        pwd.type = pwd.type === 'password' ? 'text' : 'password';
        eyeBtn.innerHTML = pwd.type === 'password' ? '👁' : '🙈';
      };
      wrap.appendChild(eyeBtn);

      // Copy button
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-sm btn-outline-secondary';
      copyBtn.innerHTML = '📋';
      copyBtn.title = 'העתק סיסמה';
      copyBtn.onclick = (ev) => {
        ev.preventDefault();
        if (pwd.value) {
          navigator.clipboard.writeText(pwd.value).then(() => {
            if (typeof toast === 'function') toast('סיסמה הועתקה', 'success');
          });
        }
      };
      wrap.appendChild(copyBtn);

      // Generate button (random password)
      const genBtn = document.createElement('button');
      genBtn.type = 'button';
      genBtn.className = 'btn btn-sm btn-outline-info';
      genBtn.innerHTML = '🔄';
      genBtn.title = 'צור סיסמה חדשה אקראית';
      genBtn.onclick = (ev) => {
        ev.preventDefault();
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let newPwd = '';
        for (let i = 0; i < 8; i++) newPwd += chars[Math.floor(Math.random() * chars.length)];
        pwd.value = newPwd;
        pwd.type = 'text';
        eyeBtn.innerHTML = '🙈';
      };
      wrap.appendChild(genBtn);

      // If current value is hashed - show warning + offer reset
      const val = pwd.value || '';
      if (val.startsWith('sha256:')) {
        const warn = document.createElement('div');
        warn.style.cssText = 'background:#fef3c7;border:1px solid #fbbf24;padding:6px 10px;border-radius:6px;margin-top:6px;font-size:12px;color:#92400e';
        warn.innerHTML = `🔒 הסיסמה מוצפנת - לא ניתן להציג. <button type="button" class="btn btn-sm btn-warning ms-2" id="pwd-reset-btn">אפס לסיסמה חדשה</button>`;
        wrap.parentNode.insertBefore(warn, wrap.nextSibling);
        warn.querySelector('#pwd-reset-btn').onclick = () => {
          pwd.value = '';
          pwd.focus();
          warn.remove();
          if (typeof toast === 'function') toast('הזן סיסמה חדשה', 'info');
        };
      }
    }, 100);
  });

  console.warn('%c👁 Pack-61 — Password field in user edit: visible + show/hide + copy + generate', 'color:#7c3aed;font-weight:bold');
})();
