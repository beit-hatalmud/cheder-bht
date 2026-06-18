/*
 * google_login.js — Google Sign-In flow + permission resolution for cheder-bht.
 *
 * Flow:
 *  1. GSI button renders (in index.html via data attrs).
 *  2. onGoogleSignIn(credentialResponse) fires.
 *  3. Verify ID Token by calling Google's tokeninfo endpoint.
 *  4. Load data/google_users.json from GitHub Pages.
 *  5. Find matching email → resolve role + permissions.
 *  6. Populate currentUser, save to localStorage, route.
 *
 * Why client-side: backend Apps Script deploy is stuck (200 versions),
 * so all auth happens in browser. Trust comes from Google ID Token + audience check.
 */
(function () {
  'use strict';

  const USERS_URL = 'data/google_users.json';

  // expected aud (filled in by user when they paste their Client ID)
  const EXPECTED_AUD_PLACEHOLDER = '799978027774-6qo4khetndu0472cf5d1shn1a1d5lgeo.apps.googleusercontent.com';

  function showLoginError(msg) {
    const el = document.getElementById('login-error');
    if (!el) { alert(msg); return; }
    el.textContent = msg;
    el.classList.remove('d-none');
  }

  function clearLoginError() {
    const el = document.getElementById('login-error');
    if (el) el.classList.add('d-none');
  }

  /**
   * Parse JWT payload without verifying signature.
   * Used to read sub/email/aud/exp. Verification happens via tokeninfo API.
   */
  function decodeJwtPayload(jwt) {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload + '==='.slice((payload.length + 3) % 4);
      const decoded = atob(padded);
      const utf8 = decodeURIComponent(escape(decoded));
      return JSON.parse(utf8);
    } catch (e) { return null; }
  }

  /**
   * Verify the ID Token by calling Google's tokeninfo endpoint.
   * Returns the verified token info or throws.
   */
  async function verifyIdToken(idToken) {
    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
    const r = await fetch(url, { method: 'GET' });
    if (!r.ok) throw new Error('tokeninfo failed: ' + r.status);
    const info = await r.json();
    if (!info.email) throw new Error('no email in token');
    if (info.email_verified === 'false' || info.email_verified === false) {
      throw new Error('email not verified');
    }
    if (EXPECTED_AUD_PLACEHOLDER !== '__GOOGLE_CLIENT_ID__' && info.aud !== EXPECTED_AUD_PLACEHOLDER) {
      throw new Error('audience mismatch');
    }
    if (info.exp && (Date.now() / 1000) > Number(info.exp)) {
      throw new Error('token expired');
    }
    return info;
  }

  /**
   * Load the users list (data/google_users.json). Cached for 60s.
   */
  let _usersCache = null;
  let _usersCacheAt = 0;
  async function loadUsers() {
    if (_usersCache && (Date.now() - _usersCacheAt < 60000)) return _usersCache;
    const r = await fetch(USERS_URL + '?t=' + Date.now());
    if (!r.ok) throw new Error('users.json load failed: ' + r.status);
    _usersCache = await r.json();
    _usersCacheAt = Date.now();
    return _usersCache;
  }

  /**
   * Resolve a verified email → user record + permission string.
   * Returns null if not authorized.
   */
  async function resolveUser(email) {
    const data = await loadUsers();
    const norm = String(email || '').trim().toLowerCase();
    const users = (data && data.users) || [];
    for (const u of users) {
      if (String(u.email || '').trim().toLowerCase() === norm) {
        if (u.active === false) return { error: 'החשבון שלך הושבת. פנה למנהל.' };
        // If permissions is a group name, expand it
        let perms = u.permissions;
        if (perms && data._groups && data._groups[perms]) perms = data._groups[perms];
        return {
          email: u.email,
          username: u.email,
          fullName: u.name || u.email,
          role: u.role || 'צוות',
          permissions: perms || '',
          viaGoogle: true,
        };
      }
    }
    return null;
  }

  /**
   * Main callback wired in index.html via data-callback="onGoogleSignIn".
   * Receives { credential: <JWT id_token>, select_by, ... }.
   */
  async function onGoogleSignIn(resp) {
    clearLoginError();
    if (!resp || !resp.credential) { showLoginError('לא התקבל אישור מ-Google'); return; }
    let info;
    try {
      info = await verifyIdToken(resp.credential);
    } catch (e) {
      // Fall back to local decode (tokeninfo blocked by NetFree?)
      info = decodeJwtPayload(resp.credential);
      if (!info || !info.email) { showLoginError('אימות נכשל: ' + e.message); return; }
    }
    let user;
    try {
      user = await resolveUser(info.email);
    } catch (e) {
      showLoginError('טעינת רשימת משתמשים נכשלה: ' + e.message);
      return;
    }
    if (!user) {
      showLoginError('המייל ' + info.email + ' לא רשום במערכת. פנה למנהל להוסיף אותך.');
      return;
    }
    if (user.error) { showLoginError(user.error); return; }

    // Set global currentUser (used elsewhere in app.js)
    window.currentUser = user;

    // Persist
    try {
      sessionStorage.setItem('bht_jwt', resp.credential);
      sessionStorage.setItem('bht_user', JSON.stringify(user));
      sessionStorage.setItem('bht_login_via', 'google');
    } catch (e) {}

    // Hand off to existing post-login flow (defined in app.js)
    if (typeof afterLoginSuccess === 'function') {
      afterLoginSuccess(user);
    } else {
      // Fallback: redraw home
      const loginEl = document.getElementById('page-login');
      if (loginEl) loginEl.classList.add('d-none');
      const userInfo = document.getElementById('user-info');
      if (userInfo) {
        userInfo.innerHTML = (user.fullName || user.email) +
          ' (' + (user.role || '') + ') ' +
          '<button class="btn btn-sm btn-outline-light ms-2" onclick="googleLogout()">יציאה</button>';
      }
      if (typeof showPage === 'function') showPage('home');
      else if (typeof goto === 'function') goto('home');
    }
  }

  function googleLogout() {
    try {
      sessionStorage.removeItem('bht_jwt');
      sessionStorage.removeItem('bht_user');
      sessionStorage.removeItem('bht_login_via');
    } catch (e) {}
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
    location.reload();
  }

  function toggleLegacyLogin(ev) {
    if (ev) ev.preventDefault();
    const g = document.getElementById('google-login-block');
    const l = document.getElementById('legacy-login-block');
    if (!g || !l) return;
    g.classList.toggle('d-none');
    l.classList.toggle('d-none');
  }

  /**
   * Restore session on page load.
   */
  function restoreSession() {
    try {
      const raw = sessionStorage.getItem('bht_user');
      if (!raw) return;
      const user = JSON.parse(raw);
      if (!user || !user.email) return;
      window.currentUser = user;
      const userInfo = document.getElementById('user-info');
      if (userInfo) {
        userInfo.innerHTML = (user.fullName || user.email) +
          ' (' + (user.role || '') + ') ' +
          '<button class="btn btn-sm btn-outline-light ms-2" onclick="googleLogout()">יציאה</button>';
      }
      const loginEl = document.getElementById('page-login');
      if (loginEl) loginEl.classList.add('d-none');
      if (typeof showPage === 'function') showPage(location.hash.replace('#', '') || 'home');
    } catch (e) {}
  }

  /**
   * Check whether a real OAuth Client ID is wired up.
   * If not — keep Google block hidden, show a small notice in the legacy block.
   */
  function checkClientIdAvailable() {
    const onload = document.getElementById('g_id_onload');
    if (!onload) return false;
    const cid = onload.getAttribute('data-client_id') || '';
    return cid && cid !== '__GOOGLE_CLIENT_ID__' && cid.length > 20;
  }

  function applyGoogleAvailability() {
    const available = checkClientIdAvailable();
    const gBlock = document.getElementById('google-login-block');
    const lBlock = document.getElementById('legacy-login-block');
    const notice = document.getElementById('google-not-configured');
    const togLink = document.getElementById('google-toggle-link');
    if (available) {
      if (gBlock) gBlock.classList.remove('d-none');
      if (lBlock) lBlock.classList.add('d-none');
      if (notice) notice.style.display = 'none';
      if (togLink) togLink.style.display = '';
    } else {
      if (gBlock) gBlock.classList.add('d-none');
      if (lBlock) lBlock.classList.remove('d-none');
      if (notice) notice.style.display = '';
      if (togLink) togLink.style.display = 'none';
    }
  }

  window.onGoogleSignIn = onGoogleSignIn;
  window.googleLogout = googleLogout;
  window.toggleLegacyLogin = toggleLegacyLogin;
  window.resolveGoogleUser = resolveUser;   // for admin UI
  window.loadGoogleUsers = loadUsers;       // for admin UI
  window.invalidateGoogleUsersCache = function () { _usersCache = null; };

  document.addEventListener('DOMContentLoaded', () => {
    applyGoogleAvailability();
    restoreSession();
  });
})();
