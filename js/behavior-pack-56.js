// behavior-pack-56.js — Login validation: show error on empty submit. 2026-05-26
(function () {
  'use strict';

  function addLoginValidation() {
    const loginBtn = [...document.querySelectorAll('button')].find(b => /כניסה|התחבר/.test(b.textContent));
    if (!loginBtn || loginBtn.dataset.validated56) return;
    const uname = document.getElementById('username');
    const pwd = document.getElementById('password');
    if (!uname || !pwd) return;
    loginBtn.dataset.validated56 = '1';
    const origClick = loginBtn.onclick;
    loginBtn.addEventListener('click', function (e) {
      const u = (uname.value || '').trim();
      const p = (pwd.value || '').trim();
      if (!u || !p) {
        e.preventDefault();
        e.stopPropagation();
        let errEl = document.getElementById('login-err-56');
        if (!errEl) {
          errEl = document.createElement('div');
          errEl.id = 'login-err-56';
          errEl.className = 'alert alert-danger mt-2';
          errEl.style.fontSize = '14px';
          loginBtn.parentNode.appendChild(errEl);
        }
        if (!u && !p) errEl.textContent = 'יש להזין שם משתמש וסיסמה';
        else if (!u) errEl.textContent = 'יש להזין שם משתמש';
        else errEl.textContent = 'יש להזין סיסמה';
        // Focus the empty field
        if (!u) uname.focus(); else pwd.focus();
        return false;
      }
      // Clear error
      document.getElementById('login-err-56')?.remove();
    }, true); // capture phase
  }

  // Try multiple times in case login page loads later
  setTimeout(addLoginValidation, 500);
  setTimeout(addLoginValidation, 1500);
  setTimeout(addLoginValidation, 3000);
  setInterval(addLoginValidation, 5000);

  // Also clear error on input
  document.addEventListener('input', e => {
    if (e.target.id === 'username' || e.target.id === 'password') {
      document.getElementById('login-err-56')?.remove();
    }
  });

  console.warn('%c🔐 Pack-56 — Login validation: error on empty submit', 'color:#dc2626;font-weight:bold');
})();
