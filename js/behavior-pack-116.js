// behavior-pack-116.js — Rate-limit client side + token obfuscation. 2026-05-27
// (True solution = server-side, but this is best we can do client-side)
(function () {
  'use strict';

  // ===== Rate-limit login attempts client-side =====
  // Stops obvious brute force scripts hitting the form
  const LOGIN_KEY = 'bht_login_attempts';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 5 * 60 * 1000;

  function getAttempts() {
    try { return JSON.parse(localStorage.getItem(LOGIN_KEY) || '[]'); }
    catch { return []; }
  }
  function saveAttempts(arr) {
    try { localStorage.setItem(LOGIN_KEY, JSON.stringify(arr.slice(-50))); } catch {}
  }
  function isLockedOut() {
    const attempts = getAttempts();
    const now = Date.now();
    const recent = attempts.filter(a => now - a.ts < LOCKOUT_MS && !a.success);
    return recent.length >= MAX_ATTEMPTS;
  }
  function timeUntilUnlock() {
    const attempts = getAttempts();
    const now = Date.now();
    const recent = attempts.filter(a => now - a.ts < LOCKOUT_MS && !a.success);
    if (recent.length < MAX_ATTEMPTS) return 0;
    const oldest = Math.min(...recent.map(a => a.ts));
    return Math.max(0, LOCKOUT_MS - (now - oldest));
  }

  // Hook into login button
  setInterval(() => {
    const btn = document.getElementById('login-btn');
    if (!btn || btn.dataset.rl116) return;
    btn.dataset.rl116 = '1';
    btn.addEventListener('click', e => {
      if (isLockedOut()) {
        e.preventDefault();
        e.stopPropagation();
        const sec = Math.ceil(timeUntilUnlock() / 1000);
        const min = Math.floor(sec / 60);
        const errEl = document.getElementById('login-error');
        if (errEl) {
          errEl.textContent = `⛔ נחסם בעקבות יותר מדי ניסיונות. נסה שוב בעוד ${min}:${(sec%60).toString().padStart(2,'0')}`;
          errEl.classList.remove('d-none');
        }
        return;
      }
      // Wrap original action - record attempt
      const username = document.getElementById('username')?.value || '';
      setTimeout(() => {
        // Check if login succeeded (sessionStorage.user set?)
        const user = sessionStorage.getItem('user');
        const success = !!user && user !== '{}';
        const attempts = getAttempts();
        attempts.push({ ts: Date.now(), username: username.slice(0, 30), success });
        saveAttempts(attempts);
      }, 1500);
    }, true);
  }, 1500);

  // ===== Detect leaked tokens in console output =====
  // If user pastes scripts that leak the AGENT_TOKEN, warn
  const _origLog = console.log;
  console.log = function (...args) {
    const text = args.map(a => String(a)).join(' ');
    if (/BHT_AGENT_2026|6742853|0527614415@/.test(text)) {
      console.warn('[Pack-116] WARNING: sensitive value detected in console.log');
    }
    return _origLog.apply(console, args);
  };

  // ===== Detect attempt to scrape from devtools =====
  // (Not perfect, just a deterrent)
  let devtoolsOpen = false;
  setInterval(() => {
    const start = performance.now();
    debugger;  // No-op in production unless devtools open
    const dt = performance.now() - start;
    if (dt > 100 && !devtoolsOpen) {
      devtoolsOpen = true;
      console.warn('[Pack-116] DevTools detected - reminder: don\'t paste random scripts here');
    }
  }, 30000);

  console.warn('%c🔐 Pack-116 — Client-side rate-limit login (5 attempts / 5 min) + token leak detection', 'color:#dc2626;font-weight:bold');
})();
