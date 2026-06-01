// behavior-pack-15.js — Mobile UX + Touch gestures. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Swipe-to-delete על אירועים =====
  let touchStart = null;
  document.addEventListener('touchstart', e => {
    const card = e.target.closest('[data-event-id]');
    if (!card) return;
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, card };
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!touchStart) return;
    const dx = e.touches[0].clientX - touchStart.x;
    if (Math.abs(dx) > 30) {
      touchStart.card.style.transform = `translateX(${dx}px)`;
      touchStart.card.style.opacity = Math.max(0.3, 1 - Math.abs(dx) / 300);
    }
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    if (Math.abs(dx) > 150) {
      const id = touchStart.card.dataset.eventId;
      if (confirm('למחוק את האירוע?')) {
        if (typeof deleteEvent === 'function') deleteEvent(parseInt(id, 10));
      }
    }
    touchStart.card.style.transform = '';
    touchStart.card.style.opacity = '';
    touchStart = null;
  }, { passive: true });

  // ===== 2. Bottom nav למובייל =====
  if (window.matchMedia('(max-width: 768px)').matches) {
    const nav = document.createElement('div');
    nav.id = 'mobile-bottom-nav';
    nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e5e7eb;display:flex;justify-content:space-around;padding:8px;z-index:990;box-shadow:0 -2px 8px rgba(0,0,0,0.1)';
    nav.innerHTML = `
      <button class="btn btn-link" onclick="goto('home')" aria-label="בית"><i class="bi bi-house fs-4"></i></button>
      <button class="btn btn-link" onclick="goto('students')" aria-label="תלמידים"><i class="bi bi-people fs-4"></i></button>
      <button class="btn btn-link" onclick="goto('behavior')" aria-label="התנהגות"><i class="bi bi-clipboard-check fs-4"></i></button>
      <button class="btn btn-link" onclick="openGlobalSearch()" aria-label="חיפוש"><i class="bi bi-search fs-4"></i></button>
      <button class="btn btn-link" onclick="showQuickActions()" aria-label="פעולות"><i class="bi bi-lightning fs-4"></i></button>
    `;
    document.body.appendChild(nav);
    document.body.style.paddingBottom = '70px';
  }

  // ===== 3. Pull-to-refresh =====
  let pullStart = null, pullActive = false;
  const pullIndicator = document.createElement('div');
  pullIndicator.id = 'pull-refresh';
  pullIndicator.style.cssText = 'position:fixed;top:-50px;left:50%;transform:translateX(-50%);background:#2563eb;color:#fff;padding:8px 16px;border-radius:0 0 20px 20px;transition:top 0.2s;z-index:9999';
  pullIndicator.textContent = '⟳ שחרר לרענן';
  document.body.appendChild(pullIndicator);

  document.addEventListener('touchstart', e => {
    if (window.scrollY === 0) pullStart = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (pullStart === null) return;
    const dy = e.touches[0].clientY - pullStart;
    if (dy > 0 && window.scrollY === 0) {
      pullIndicator.style.top = `${Math.min(dy - 50, 20)}px`;
      pullActive = dy > 100;
    }
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (pullActive && pullStart !== null) {
      pullIndicator.textContent = '⟳ מרענן...';
      const hash = location.hash.replace('#', '') || 'home';
      const fn = window['render' + hash.charAt(0).toUpperCase() + hash.slice(1)];
      if (typeof fn === 'function') fn();
      setTimeout(() => { pullIndicator.style.top = '-50px'; pullIndicator.textContent = '⟳ שחרר לרענן'; }, 1500);
    } else {
      pullIndicator.style.top = '-50px';
    }
    pullStart = null;
    pullActive = false;
  }, { passive: true });

  // ===== 4. Larger touch targets במובייל =====
  if (window.matchMedia('(max-width: 768px)').matches) {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        button, .btn, a.nav-link { min-height: 44px !important; min-width: 44px !important; }
        input, select, textarea { font-size: 16px !important; /* prevent iOS zoom */ }
        .card-tile { padding: 14px !important; }
        .modal-dialog { margin: 0 !important; max-width: 100% !important; min-height: 100vh !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== 5. Long-press לעריכה =====
  let lpTimer = null;
  document.addEventListener('touchstart', e => {
    const card = e.target.closest('[data-event-id], [data-task-id]');
    if (!card) return;
    lpTimer = setTimeout(() => {
      if ('vibrate' in navigator && document.documentElement.hasAttribute('data-user-interacted')) navigator.vibrate(50);
      const id = card.dataset.eventId || card.dataset.taskId;
      if (card.dataset.eventId && typeof editEvent === 'function') editEvent(parseInt(id));
      else if (card.dataset.taskId && typeof renderTaskDetails === 'function') renderTaskDetails(parseInt(id));
    }, 600);
  }, { passive: true });
  document.addEventListener('touchmove', () => { clearTimeout(lpTimer); });
  document.addEventListener('touchend', () => { clearTimeout(lpTimer); });

  // ===== 6. Mobile-optimized search =====
  if (window.matchMedia('(max-width: 768px)').matches) {
    document.addEventListener('focus', e => {
      if (e.target.tagName === 'INPUT' && e.target.type === 'search') {
        setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
      }
    }, true);
  }

  // ===== 7. Haptic feedback בהצלחה =====
  window.addEventListener('cheder-data-refreshed', () => {
    if ('vibrate' in navigator && document.documentElement.hasAttribute('data-user-interacted')) navigator.vibrate([30]);
  });

  // ===== 8. Responsive font sizes =====
  const respStyle = document.createElement('style');
  respStyle.textContent = `
    @media (max-width: 480px) {
      h1 { font-size: 1.5rem !important; }
      h2 { font-size: 1.3rem !important; }
      h3 { font-size: 1.15rem !important; }
      h5 { font-size: 1rem !important; }
      .display-6 { font-size: 1.5rem !important; }
      table { font-size: 13px; }
      .card { padding: 10px !important; }
    }
  `;
  document.head.appendChild(respStyle);

  // ===== 9. Detect orientation change =====
  window.addEventListener('orientationchange', () => {
    if (typeof toast === 'function') {
      toast(screen.orientation?.type?.includes('portrait') ? '📱 אנכי' : '📱 אופקי', 'info', 1000);
    }
  });

  // ===== 10. Mobile-friendly modal =====
  document.addEventListener('shown.bs.modal', e => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      const dlg = e.target.querySelector('.modal-dialog');
      if (dlg) dlg.style.cssText += 'margin:0!important;max-width:100%!important;';
    }
  });

  console.warn('%c📱 Pack-15 — Mobile UX: swipe-to-delete, pull-to-refresh, bottom nav, long-press', 'color:#0891b2;font-weight:bold');
})();
