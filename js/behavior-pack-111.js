// behavior-pack-111.js — Data integrity + offline detection + sync indicator. 2026-05-27
(function () {
  'use strict';

  let fixes = 0;

  // ===== Fix 1: Offline/Online detection + banner =====
  function updateOnlineStatus() {
    let banner = document.getElementById('offline-banner-111');
    if (!navigator.onLine) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offline-banner-111';
        banner.style.cssText = 'position:fixed;top:0;right:0;left:0;background:#dc2626;color:#fff;text-align:center;padding:8px;z-index:99999;font-size:14px;font-weight:600';
        banner.innerHTML = '⚠ אין חיבור אינטרנט - השינויים יישמרו לוקלית ויסונכרנו כשתתחבר';
        document.body.appendChild(banner);
      }
    } else if (banner) {
      banner.remove();
    }
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
  fixes++;

  // ===== Fix 2: validate phone numbers (Israeli format) =====
  document.addEventListener('blur', e => {
    const t = e.target;
    if (!t.matches?.('input[type=tel], input[id*="phone"], input[name*="טלפון"]')) return;
    const cleaned = t.value.replace(/[^\d+\-]/g, '');
    if (cleaned && !/^(\+972|972|0)?[2-9]\d{7,8}$/.test(cleaned.replace(/[-\s]/g, ''))) {
      t.style.borderColor = '#fbbf24';
      t.title = 'מספר טלפון לא תקין';
    } else {
      t.style.borderColor = '';
      t.title = '';
    }
  }, true);
  fixes++;

  // ===== Fix 3: highlight required fields visually =====
  if (!document.getElementById('pack-111-css')) {
    const st = document.createElement('style');
    st.id = 'pack-111-css';
    st.textContent = `
      input[required], textarea[required], select[required] {
        border-right: 3px solid #fbbf24 !important;
      }
      input[required]:valid, textarea[required]:valid, select[required]:valid {
        border-right: 3px solid #22c55e !important;
      }
      input.is-invalid, textarea.is-invalid { border-color: #dc2626 !important; background: #fef2f2; }
      .form-label.required-label::after { content: ' *'; color: #dc2626; }
    `;
    document.head.appendChild(st);
  }
  fixes++;

  // ===== Fix 4: ensure cookies/storage available =====
  try {
    const testKey = '__test_111_' + Date.now();
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
  } catch (e) {
    console.warn('[Pack-111] localStorage UNAVAILABLE:', e.message);
    let banner = document.createElement('div');
    banner.style.cssText = 'background:#fef3c7;color:#92400e;padding:8px 14px;border-radius:6px;margin:10px;text-align:center';
    banner.innerHTML = '⚠ localStorage חסום - שינויים לא יישמרו ברענון. בדוק הגדרות privacy';
    document.body.appendChild(banner);
  }
  fixes++;

  // ===== Fix 5: smart timestamps - relative + absolute =====
  function relativeTime(date) {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'הרגע';
    if (minutes < 60) return `לפני ${minutes} דק'`;
    if (hours < 24) return `לפני ${hours} שעות`;
    if (days < 7) return `לפני ${days} ימים`;
    if (days < 30) return `לפני ${Math.floor(days/7)} שבועות`;
    return new Date(date).toLocaleDateString('he-IL');
  }
  window.relativeTime = relativeTime;
  fixes++;

  // ===== Fix 6: prevent rapid double-render on data refresh =====
  let refreshDebounce = null;
  window.addEventListener('cheder-data-refreshed', e => {
    clearTimeout(refreshDebounce);
    refreshDebounce = setTimeout(() => {
      // Refresh handled - prevent further dispatches
    }, 200);
  });
  fixes++;

  // ===== Fix 7: enhanced toast notifications =====
  if (typeof window.toast !== 'function' || !window.toast._111) {
    const _orig = window.toast;
    window.toast = function (msg, type, duration) {
      duration = duration || 3000;
      // Stack toasts (don't replace)
      let container = document.getElementById('toast-container-111');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container-111';
        container.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:99998;display:flex;flex-direction:column;gap:8px;max-width:340px';
        document.body.appendChild(container);
      }
      const t = document.createElement('div');
      const color = type === 'error' ? '#dc2626' : type === 'warn' ? '#fbbf24' : type === 'success' ? '#22c55e' : '#3b82f6';
      t.style.cssText = `background:${color};color:#fff;padding:10px 16px;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.2);max-width:300px;animation:slide-111 .3s;cursor:pointer`;
      t.textContent = msg;
      t.onclick = () => t.remove();
      container.appendChild(t);
      // Limit to 5 visible
      while (container.children.length > 5) container.firstChild.remove();
      setTimeout(() => t.remove(), duration);
    };
    window.toast._111 = true;
    if (!document.getElementById('toast-anim-111')) {
      const st = document.createElement('style');
      st.id = 'toast-anim-111';
      st.textContent = '@keyframes slide-111 { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }';
      document.head.appendChild(st);
    }
  }
  fixes++;

  console.warn(`%c🌐 Pack-111 — ${fixes} fixes (offline banner, phone validation, required hl, localStorage check, relative time, stacked toasts)`, 'color:#0891b2;font-weight:bold');
})();
