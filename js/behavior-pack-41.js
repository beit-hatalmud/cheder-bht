// behavior-pack-41.js — Security hardening. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Encrypt sensitive data in localStorage =====
  const ENCRYPT_KEY = 'bht_local_encrypt_key';
  let _localKey = localStorage.getItem(ENCRYPT_KEY);
  if (!_localKey) {
    _localKey = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2,'0')).join('');
    localStorage.setItem(ENCRYPT_KEY, _localKey);
  }

  window.encryptString = function (text) {
    // Simple XOR with key - not cryptographically strong but stops casual reads
    const key = _localKey;
    let out = '';
    for (let i = 0; i < text.length; i++) {
      out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(unescape(encodeURIComponent(out)));
  };

  window.decryptString = function (cipher) {
    try {
      const text = decodeURIComponent(escape(atob(cipher)));
      const key = _localKey;
      let out = '';
      for (let i = 0; i < text.length; i++) {
        out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return out;
    } catch (_) { return null; }
  };

  // ===== 2. Secure cookie helper =====
  window.setSecureCookie = function (name, value, hours) {
    hours = hours || 24;
    const expires = new Date(Date.now() + hours * 3600000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Strict${location.protocol==='https:'?';Secure':''}`;
  };

  window.getCookie = function (name) {
    const m = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return m ? decodeURIComponent(m[2]) : null;
  };

  // ===== 3. CSRF token =====
  let _csrfToken = sessionStorage.getItem('bht_csrf');
  if (!_csrfToken) {
    _csrfToken = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2,'0')).join('');
    sessionStorage.setItem('bht_csrf', _csrfToken);
  }
  window.getCsrfToken = () => _csrfToken;

  // ===== 4. Login attempt tracking =====
  window.loginAttempts = JSON.parse(localStorage.getItem('bht_login_attempts') || '[]');

  window.recordLoginAttempt = function (username, success) {
    loginAttempts.push({ ts: Date.now(), username: String(username).substring(0,20), success, ip: 'client' });
    while (loginAttempts.length > 100) loginAttempts.shift();
    localStorage.setItem('bht_login_attempts', JSON.stringify(loginAttempts));
  };

  window.recentFailures = function (username, minutes) {
    const cutoff = Date.now() - (minutes||10) * 60000;
    return loginAttempts.filter(a => a.username === username && !a.success && a.ts > cutoff).length;
  };

  // ===== 5. Auto-lock after failures =====
  window.isLockedOut = function (username) {
    return recentFailures(username, 10) >= 5;
  };

  // ===== 6. Content sanitizer for HTML =====
  window.sanitizeHTML = function (html) {
    const tmp = document.createElement('div');
    tmp.textContent = String(html||'');
    return tmp.innerHTML;
  };

  window.stripDangerous = function (html) {
    return String(html||'')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, 'blocked:')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/data:text\/html/gi, 'blocked:html');
  };

  // ===== 7. URL validation =====
  window.isSafeUrl = function (url) {
    try {
      const u = new URL(url, location.href);
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol);
    } catch (_) { return false; }
  };

  // ===== 8. Block dangerous link clicks =====
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href && !isSafeUrl(href) && !href.startsWith('#')) {
      e.preventDefault();
      console.warn('[security] blocked unsafe link:', href);
      if (typeof toast === 'function') toast('קישור חסום מטעמי בטיחות', 'warn');
    }
  });

  // ===== 9. Session fingerprint =====
  window.sessionFingerprint = function () {
    const components = [
      navigator.userAgent.substring(0, 50),
      screen.width + 'x' + screen.height,
      navigator.language,
      new Date().getTimezoneOffset(),
    ];
    let hash = 0;
    const s = components.join('|');
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    return Math.abs(hash).toString(36);
  };

  // ===== 10. Check session integrity =====
  const _fpKey = 'bht_session_fp';
  setTimeout(() => {
    const stored = sessionStorage.getItem(_fpKey);
    const current = sessionFingerprint();
    if (stored && stored !== current) {
      console.warn('[security] session fingerprint changed!');
      if (typeof notify === 'function') notify('⚠ זוהה שינוי בסביבת ההפעלה - בדוק שאתה במכשיר שלך', 'warn');
    }
    sessionStorage.setItem(_fpKey, current);
  }, 1000);

  // ===== Bonus: Sensitive data warnings =====
  window.detectSensitiveData = function (text) {
    const patterns = [
      { kind: 'ת.ז.', re: /\b\d{9}\b/ },
      { kind: 'טלפון', re: /\b05\d-?\d{7}\b/ },
      { kind: 'אימייל', re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
      { kind: 'IBAN', re: /\bIL\d{20,22}\b/ },
    ];
    return patterns.filter(p => p.re.test(text)).map(p => p.kind);
  };

  console.warn('%c🔐 Pack-41 — Security: encryption, CSRF, login tracking, sanitize, URL safety, fingerprint', 'color:#dc2626;font-weight:bold');
  console.info('Tips: encryptString(), recentFailures(user), sessionFingerprint()');
})();
