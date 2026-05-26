// behavior-pack-58.js — Fix login flash + better feedback. 2026-05-26
(function () {
  'use strict';

  // ===== Wrap login flow with better feedback =====
  function fixLoginFlow() {
    const loginBtn = [...document.querySelectorAll('button')].find(b => /כניסה|התחבר/.test(b.textContent) && b.offsetParent);
    if (!loginBtn || loginBtn.dataset.flowfixed58) return;
    loginBtn.dataset.flowfixed58 = '1';

    loginBtn.addEventListener('click', async function (e) {
      const u = document.getElementById('username')?.value?.trim();
      const p = document.getElementById('password')?.value;
      if (!u || !p) return; // pack-56 handles empty

      // Show spinner + disable
      loginBtn.disabled = true;
      const origText = loginBtn.textContent;
      loginBtn.textContent = 'מתחבר...';

      // Wait then verify
      setTimeout(async () => {
        loginBtn.disabled = false;
        loginBtn.textContent = origText;

        // Check if actually logged in
        try {
          const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
          if (!stored.username) {
            // Login failed - show clear error
            let errEl = document.getElementById('login-err-58');
            if (!errEl) {
              errEl = document.createElement('div');
              errEl.id = 'login-err-58';
              errEl.className = 'alert alert-danger mt-2';
              errEl.style.cssText = 'animation: shake 0.5s; font-size:14px';
              loginBtn.parentNode.appendChild(errEl);
            }
            errEl.textContent = '❌ שם משתמש או סיסמה שגויים. נסה שוב.';
            // Make sure login UI stays
            const loginPage = document.getElementById('page-login');
            const homePage = document.getElementById('page-home');
            if (loginPage) loginPage.classList.remove('d-none');
            if (homePage) homePage.classList.add('d-none');
          }
        } catch (_) {}
      }, 3000);
    }, true);
  }

  setTimeout(fixLoginFlow, 500);
  setTimeout(fixLoginFlow, 2000);
  setInterval(fixLoginFlow, 5000);

  // Shake animation
  const shake = document.createElement('style');
  shake.textContent = `@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }`;
  document.head.appendChild(shake);

  // ===== Prevent showing home if not logged in =====
  setInterval(() => {
    const home = document.getElementById('page-home');
    const login = document.getElementById('page-login');
    if (!home || !login) return;
    const u = (() => {
      try { return JSON.parse(sessionStorage.getItem('user') || '{}'); }
      catch { return {}; }
    })();
    // If home visible but no user - hide home, show login
    if (!home.classList.contains('d-none') && !u.username) {
      home.classList.add('d-none');
      login.classList.remove('d-none');
      console.warn('[auth-guard] home was visible without user - hidden');
    }
  }, 2000);

  // ===== Clear stale sessionStorage on failed login attempts =====
  document.addEventListener('input', e => {
    if (e.target.id === 'password') {
      // Clear any zombie session
      try {
        const u = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (u.username && document.getElementById('username')?.value !== u.username) {
          sessionStorage.removeItem('user');
        }
      } catch (_) {}
    }
  });

  console.warn('%c🔐 Pack-58 — Login flow fix: spinner, error feedback, auth guard', 'color:#dc2626;font-weight:bold');
})();
