// behavior-pack-119.js — Design System: theme.css + replace alert/confirm with modern UI. 2026-05-27
(function () {
  'use strict';

  // ===== Load theme.css if not loaded =====
  if (!document.querySelector('link[href*="theme.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/theme.css?v=20260527';
    document.head.appendChild(link);
  }

  // ===== Modern alert() replacement =====
  // Don't break existing alert calls. Convert to nicer modal.
  const _origAlert = window.alert;
  let alertOpen = false;
  window.alert = function (msg) {
    msg = String(msg || '');
    if (!msg.trim()) return;
    // For very short messages or critical errors - keep native alert
    if (msg.length < 5) return _origAlert(msg);

    if (alertOpen) {
      // Stack to toast instead
      if (typeof window.toast === 'function') window.toast(msg, 'warn', 4000);
      else _origAlert(msg);
      return;
    }
    alertOpen = true;
    const modal = document.createElement('div');
    modal.className = 'bht-alert-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:20px;max-width:400px;direction:rtl;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-family:Heebo,Arial">
        <div style="font-size:14px;line-height:1.5;color:#1f2937;white-space:pre-wrap">${String(msg).replace(/[<>]/g, '')}</div>
        <button class="btn-ok" style="background:#1e3a8a;color:#fff;border:0;padding:8px 20px;border-radius:6px;margin-top:14px;cursor:pointer;width:100%;font-weight:600">אישור</button>
      </div>
    `;
    modal.querySelector('.btn-ok').onclick = () => {
      modal.remove();
      alertOpen = false;
    };
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
        alertOpen = false;
      }
    });
    document.body.appendChild(modal);
    modal.querySelector('.btn-ok').focus();
  };

  // ===== Modern confirm() replacement (promise-based) =====
  const _origConfirm = window.confirm;
  window.confirmModern = function (msg) {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;padding:20px;max-width:400px;direction:rtl;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-family:Heebo,Arial">
          <div style="font-size:14px;line-height:1.5;color:#1f2937">${String(msg).replace(/[<>]/g, '')}</div>
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn-yes" style="background:#dc2626;color:#fff;border:0;padding:8px 20px;border-radius:6px;cursor:pointer;flex:1;font-weight:600">כן</button>
            <button class="btn-no" style="background:#9ca3af;color:#fff;border:0;padding:8px 20px;border-radius:6px;cursor:pointer;flex:1">ביטול</button>
          </div>
        </div>
      `;
      modal.querySelector('.btn-yes').onclick = () => { modal.remove(); resolve(true); };
      modal.querySelector('.btn-no').onclick = () => { modal.remove(); resolve(false); };
      modal.addEventListener('click', e => {
        if (e.target === modal) { modal.remove(); resolve(false); }
      });
      document.body.appendChild(modal);
      modal.querySelector('.btn-no').focus();
    });
  };

  // ===== Track if there are leftover styles to migrate =====
  setInterval(() => {
    const inlines = document.querySelectorAll('[style*="cssText"], [style]:not([data-bht-styled])').length;
    if (inlines > 200) {
      console.warn(`[Pack-119] ${inlines} inline-style elements (consider migrating to bht-* classes)`);
    }
  }, 60000);

  console.warn('%c🎨 Pack-119 — theme.css design tokens + modern alert/confirmModern modals', 'color:#7c3aed;font-weight:bold');
})();
