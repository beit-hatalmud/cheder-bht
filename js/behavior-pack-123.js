// behavior-pack-123.js — Modern login screen using theme.css (showcase). 2026-05-27
(function () {
  'use strict';

  // Wait for login page to be rendered, then beautify
  function beautifyLogin() {
    const login = document.getElementById('page-login');
    if (!login || login.dataset.modernized123) return;
    login.dataset.modernized123 = '1';

    // Find existing card or content
    const card = login.querySelector('.card');
    if (!card) return;

    // Apply theme.css tokens via direct style (since we can't edit existing innerHTML easily)
    card.style.cssText = `
      background: #fff;
      border: 0;
      border-radius: var(--bht-radius-xl, 16px);
      box-shadow: var(--bht-shadow-xl, 0 8px 24px rgba(0,0,0,0.12));
      padding: var(--bht-space-8, 32px) !important;
      max-width: 420px;
      margin: var(--bht-space-10, 40px) auto;
      overflow: hidden;
      position: relative;
    `;

    // Add a beautiful gradient strip on top
    const strip = document.createElement('div');
    strip.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      height: 8px;
      background: linear-gradient(90deg, var(--bht-primary, #1e3a8a), var(--bht-accent, #fbbf24), var(--bht-primary-light, #3b82f6));
    `;
    card.style.position = 'relative';
    card.insertBefore(strip, card.firstChild);

    // Replace heading
    const h3 = card.querySelector('h3');
    if (h3) {
      h3.style.cssText = `
        font-size: var(--bht-font-size-2xl, 24px);
        color: var(--bht-primary, #1e3a8a);
        font-weight: 700;
        margin-bottom: var(--bht-space-6, 24px);
        text-align: center;
      `;
      // Add icon
      if (!h3.querySelector('i')) {
        const icon = document.createElement('i');
        icon.className = 'bi bi-shield-lock-fill';
        icon.style.cssText = 'color:var(--bht-primary,#1e3a8a);font-size:32px;display:block;margin-bottom:8px';
        h3.insertBefore(icon, h3.firstChild);
      }
    }

    // Style inputs with theme tokens
    card.querySelectorAll('.form-control').forEach(inp => {
      inp.style.cssText = `
        padding: var(--bht-space-3, 12px) var(--bht-space-4, 16px);
        border: 2px solid var(--bht-gray-200, #e5e7eb);
        border-radius: var(--bht-radius-md, 8px);
        font-size: var(--bht-font-size-base, 14px);
        transition: var(--bht-transition-fast, 0.15s);
        background: var(--bht-gray-50, #f9fafb);
      `;
      inp.addEventListener('focus', () => {
        inp.style.borderColor = 'var(--bht-primary, #1e3a8a)';
        inp.style.background = '#fff';
      });
      inp.addEventListener('blur', () => {
        inp.style.borderColor = 'var(--bht-gray-200, #e5e7eb)';
        inp.style.background = 'var(--bht-gray-50, #f9fafb)';
      });
    });

    // Style labels
    card.querySelectorAll('.form-label').forEach(lbl => {
      lbl.style.cssText = `
        font-size: var(--bht-font-size-sm, 12px);
        font-weight: 600;
        color: var(--bht-gray-700, #374151);
        margin-bottom: var(--bht-space-1, 4px);
      `;
    });

    // Style login button
    const btn = document.getElementById('login-btn');
    if (btn) {
      btn.style.cssText = `
        background: linear-gradient(135deg, var(--bht-primary, #1e3a8a), var(--bht-primary-light, #3b82f6));
        color: #fff;
        border: 0;
        padding: var(--bht-space-3, 12px);
        border-radius: var(--bht-radius-md, 8px);
        font-size: var(--bht-font-size-md, 15px);
        font-weight: 600;
        margin-top: var(--bht-space-4, 16px);
        cursor: pointer;
        transition: var(--bht-transition-base, 0.25s);
        box-shadow: var(--bht-shadow-md, 0 2px 4px rgba(0,0,0,0.06));
      `;
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = 'var(--bht-shadow-lg, 0 4px 12px rgba(0,0,0,0.08))';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'var(--bht-shadow-md, 0 2px 4px rgba(0,0,0,0.06))';
      });
    }

    // Add subtle bottom text
    if (!card.querySelector('.login-footer-123')) {
      const footer = document.createElement('div');
      footer.className = 'login-footer-123';
      footer.style.cssText = `
        text-align: center;
        margin-top: var(--bht-space-6, 24px);
        padding-top: var(--bht-space-4, 16px);
        border-top: 1px solid var(--bht-gray-200, #e5e7eb);
        color: var(--bht-gray-500, #6b7280);
        font-size: var(--bht-font-size-xs, 11px);
      `;
      footer.innerHTML = '<i class="bi bi-shield-check"></i> מערכת ניהול בית התלמוד';
      card.appendChild(footer);
    }

    console.warn('[Pack-123] login screen beautified with theme.css');
  }

  // Apply on initial load + when page-login becomes visible
  setTimeout(beautifyLogin, 500);
  setTimeout(beautifyLogin, 2000);

  // Re-apply if hash changes back to login
  window.addEventListener('hashchange', () => {
    if (!sessionStorage.getItem('user') || sessionStorage.getItem('user') === '{}') {
      setTimeout(beautifyLogin, 200);
    }
  });

  // Watch for DOM changes
  const obs = new MutationObserver(() => {
    if (document.getElementById('page-login') && !document.getElementById('page-login').classList.contains('d-none')) {
      beautifyLogin();
    }
  });
  obs.observe(document.body, { childList: true, subtree: false });

  console.warn('%c🎨 Pack-123 — Login screen REDESIGNED with theme.css (gradient strip, icon, modern inputs)', 'color:#7c3aed;font-weight:bold;font-size:14px');
})();
