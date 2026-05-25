// behavior-pack-26.js — Accessibility (a11y). 2026-05-24
(function () {
  'use strict';

  // ===== 1. Focus visible improved =====
  const focusStyle = document.createElement('style');
  focusStyle.textContent = `
    *:focus-visible {
      outline: 3px solid #2563eb !important;
      outline-offset: 2px !important;
      border-radius: 4px;
    }
    .skip-link {
      position: absolute; right: 8px; top: 8px; transform: translateY(-200%); z-index: 99999;
      background: #2563eb; color: #fff; padding: 8px 16px; border-radius: 4px;
    }
    .skip-link:focus { left: 16px; }
  `;
  document.head.appendChild(focusStyle);

  // ===== 2. Skip to content link =====
  if (!document.querySelector('.skip-link')) {
    const skip = document.createElement('a');
    skip.href = '#page-home';
    skip.className = 'skip-link';
    skip.textContent = 'דלג לתוכן';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  // ===== 3. ARIA live region for announcements =====
  let _liveRegion = document.getElementById('a11y-live');
  if (!_liveRegion) {
    _liveRegion = document.createElement('div');
    _liveRegion.id = 'a11y-live';
    _liveRegion.setAttribute('aria-live', 'polite');
    _liveRegion.setAttribute('aria-atomic', 'true');
    _liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0;padding:0;margin:-1px';
    document.body.appendChild(_liveRegion);
  }

  window.announce = function (msg) {
    _liveRegion.textContent = msg;
    setTimeout(() => { _liveRegion.textContent = ''; }, 1000);
  };

  // Announce toast messages
  const origToast = window.toast;
  if (typeof origToast === 'function') {
    window.toast = function (msg, type, dur) {
      announce(msg);
      return origToast.apply(this, arguments);
    };
  }

  // ===== 4. Keyboard navigation tabs =====
  document.addEventListener('keydown', e => {
    if (e.target.closest('.modal')) return; // modal has its own focus trap
    if (e.key === 'Tab') return; // native
    // Arrow keys in tab navigation
    const activeNav = document.querySelector('.nav-tabs .nav-link.active');
    if (!activeNav) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const tabs = [...document.querySelectorAll('.nav-tabs .nav-link')];
      const idx = tabs.indexOf(activeNav);
      const next = e.key === 'ArrowLeft' ? idx + 1 : idx - 1; // RTL
      if (tabs[next]) tabs[next].click();
    }
  });

  // ===== 5. High contrast mode toggle =====
  const hcStyle = document.createElement('style');
  hcStyle.id = 'hc-style';
  hcStyle.textContent = `
    body.high-contrast {
      filter: contrast(1.3) saturate(0.8);
    }
    body.high-contrast .card, body.high-contrast .btn {
      border-width: 2px !important;
    }
    body.high-contrast .text-muted {
      color: #4b5563 !important;
    }
  `;
  document.head.appendChild(hcStyle);

  window.toggleHighContrast = function () {
    document.body.classList.toggle('high-contrast');
    const on = document.body.classList.contains('high-contrast');
    localStorage.setItem('bht_high_contrast', on ? '1' : '0');
    announce(on ? 'ניגודיות גבוהה הופעלה' : 'ניגודיות גבוהה כובתה');
  };
  if (localStorage.getItem('bht_high_contrast') === '1') {
    document.body.classList.add('high-contrast');
  }

  // ===== 6. Font size adjuster =====
  const fontSize = parseFloat(localStorage.getItem('bht_font_scale') || '1');
  document.documentElement.style.fontSize = `${fontSize * 16}px`;

  window.adjustFontSize = function (delta) {
    let scale = parseFloat(localStorage.getItem('bht_font_scale') || '1');
    scale = Math.max(0.8, Math.min(1.4, scale + delta));
    localStorage.setItem('bht_font_scale', String(scale));
    document.documentElement.style.fontSize = `${scale * 16}px`;
    announce(`גודל גופן ${Math.round(scale*100)}%`);
  };

  // ===== 7. A11y toolbar =====
  setTimeout(() => {
    if (document.getElementById('a11y-toolbar')) return;
    const tb = document.createElement('div');
    tb.id = 'a11y-toolbar';
    tb.style.cssText = 'position:fixed;top:50%;left:0;transform:translateY(-50%);background:#fff;border:1px solid #e5e7eb;border-radius:0 8px 8px 0;padding:8px;display:flex;flex-direction:column;gap:4px;z-index:9990;box-shadow:2px 0 8px rgba(0,0,0,0.1)';
    const buttons = [
      { icon: 'A+', title: 'הגדל טקסט', fn: () => adjustFontSize(0.1) },
      { icon: 'A-', title: 'הקטן טקסט', fn: () => adjustFontSize(-0.1) },
      { icon: '◐', title: 'ניגודיות', fn: toggleHighContrast },
      { icon: '🔊', title: 'הקרא', fn: () => {
        const text = document.querySelector('main, [role="main"], #page-home:not(.d-none), [id^="page-"]:not(.d-none)')?.innerText.substring(0, 500) || '';
        if (typeof speakText === 'function') speakText(text);
      } },
    ];
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-outline-secondary';
      btn.textContent = b.icon;
      btn.title = b.title;
      btn.setAttribute('aria-label', b.title);
      btn.onclick = b.fn;
      tb.appendChild(btn);
    });
    document.body.appendChild(tb);
  }, 2500);

  // ===== 8. Reading mode (distraction-free) =====
  window.toggleReadingMode = function () {
    document.body.classList.toggle('reading-mode');
  };
  const readStyle = document.createElement('style');
  readStyle.textContent = `
    body.reading-mode #notif-bell, body.reading-mode #voice-cmd-btn,
    body.reading-mode #quick-action-fab, body.reading-mode #sync-indicator,
    body.reading-mode #a11y-toolbar, body.reading-mode #mobile-bottom-nav { display: none !important; }
    body.reading-mode { background: #faf5e6 !important; }
    body.reading-mode .card { background: #fffaf0 !important; }
  `;
  document.head.appendChild(readStyle);

  // ===== 9. Keyboard shortcut for a11y =====
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key === '1') { e.preventDefault(); adjustFontSize(0.1); }
    if (e.altKey && e.key === '2') { e.preventDefault(); adjustFontSize(-0.1); }
    if (e.altKey && e.key === '3') { e.preventDefault(); toggleHighContrast(); }
    if (e.altKey && e.key === '4') { e.preventDefault(); toggleReadingMode(); }
  });

  // ===== 10. Heading hierarchy check (dev only) =====
  setTimeout(() => {
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
    let lastLevel = 0;
    let issues = 0;
    headings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      if (lastLevel && level > lastLevel + 1) {
        issues++;
        console.warn(`[a11y] heading jump: h${lastLevel} → h${level}`, h);
      }
      lastLevel = level;
    });
    if (issues === 0) console.info('[a11y] heading hierarchy OK');
  }, 5000);

  console.warn('%c♿ Pack-26 — Accessibility: focus, skip link, ARIA live, high contrast, toolbar', 'color:#0891b2;font-weight:bold');
})();
