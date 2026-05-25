// behavior-pack-53.js — Final UI bug fixes. 2026-05-25
(function () {
  'use strict';

  // ===== FIX 1: Ctrl+K opens global search (case-insensitive) =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (typeof openGlobalSearch === 'function') openGlobalSearch();
      else if (typeof toast === 'function') toast('חיפוש לא זמין', 'warn');
    }
  });

  // ===== FIX 2: Master FAB click reliability =====
  setTimeout(() => {
    const fab = document.getElementById('master-fab');
    if (!fab) return;
    // Re-attach onclick if missing
    if (!fab.onclick && typeof toggleFabMenu === 'function') {
      fab.onclick = toggleFabMenu;
    } else if (!fab.onclick) {
      fab.onclick = function () {
        // Simple fallback menu
        if (document.getElementById('fab-menu')) {
          document.getElementById('fab-menu').remove();
          return;
        }
        const menu = document.createElement('div');
        menu.id = 'fab-menu';
        menu.style.cssText = 'position:fixed;bottom:90px;left:24px;background:#fff;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.2);padding:8px;z-index:9994;direction:rtl;min-width:220px';
        const items = [
          { icon: '🔍', label: 'חיפוש', action: () => window.openGlobalSearch?.() },
          { icon: '➕', label: 'אירוע חדש', action: () => goto('behavior') },
          { icon: '👥', label: 'תלמידים', action: () => goto('students') },
          { icon: '📊', label: 'דוחות', action: () => goto('reports') },
          { icon: '⚙', label: 'הגדרות', action: () => goto('settings') },
        ];
        items.forEach(it => {
          const btn = document.createElement('button');
          btn.style.cssText = 'display:flex;gap:10px;width:100%;padding:10px 14px;border:none;background:transparent;cursor:pointer;border-radius:8px;text-align:right;direction:rtl';
          btn.innerHTML = `<span style="font-size:18px">${it.icon}</span><span>${it.label}</span>`;
          btn.onclick = () => { menu.remove(); it.action(); };
          btn.onmouseenter = () => btn.style.background = '#f3f4f6';
          btn.onmouseleave = () => btn.style.background = 'transparent';
          menu.appendChild(btn);
        });
        document.body.appendChild(menu);
        setTimeout(() => {
          document.addEventListener('click', function close(e) {
            if (!menu.contains(e.target) && e.target !== fab) {
              menu.remove();
              document.removeEventListener('click', close);
            }
          });
        }, 100);
      };
    }
  }, 2500);

  // ===== FIX 3: Ensure Bootstrap Esc closes modals =====
  // Don't capture Esc - let Bootstrap handle
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const modal = document.querySelector('.modal.show');
      if (modal) {
        try {
          if (window.bootstrap && bootstrap.Modal) {
            const inst = bootstrap.Modal.getInstance(modal);
            if (inst) inst.hide();
          }
        } catch (_) {
          // Fallback - just hide it
          modal.classList.remove('show');
          modal.style.display = 'none';
          document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
          document.body.classList.remove('modal-open');
        }
      }
    }
  });

  // ===== FIX 4: Ensure modals close on backdrop click =====
  document.addEventListener('click', e => {
    if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
      const modal = document.querySelector('.modal.show');
      if (modal) {
        try {
          bootstrap.Modal.getInstance(modal)?.hide();
        } catch (_) {
          modal.classList.remove('show');
          modal.style.display = 'none';
          e.target.remove();
          document.body.classList.remove('modal-open');
        }
      }
    }
  });

  // ===== FIX 5: Force-cleanup stuck modals =====
  setInterval(() => {
    const visibleModals = document.querySelectorAll('.modal.show').length;
    const backdrops = document.querySelectorAll('.modal-backdrop').length;
    // If body has modal-open but no visible modals - cleanup
    if (document.body.classList.contains('modal-open') && visibleModals === 0) {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
    }
    // Extra backdrops
    if (backdrops > visibleModals) {
      const all = document.querySelectorAll('.modal-backdrop');
      for (let i = visibleModals; i < all.length; i++) all[i].remove();
    }
  }, 5000);

  // ===== FIX 6: Loading overlay timeout =====
  setInterval(() => {
    const lo = document.getElementById('loading-overlay');
    if (lo && lo.offsetParent && !lo.dataset.shownTs) {
      lo.dataset.shownTs = Date.now();
    }
    if (lo && lo.dataset.shownTs && Date.now() - parseInt(lo.dataset.shownTs) > 15000) {
      lo.style.display = 'none';
      delete lo.dataset.shownTs;
      console.warn('[ui] loading-overlay stuck >15s, force-hidden');
    }
  }, 3000);

  // ===== FIX 7: Better error handling for failed renders =====
  ['renderStudents', 'renderBehavior', 'renderTasks', 'renderProjects', 'renderStaff'].forEach(fn => {
    const orig = window[fn];
    if (typeof orig !== 'function' || orig._wrapped) return;
    window[fn] = async function (...args) {
      try { return await orig.apply(this, args); }
      catch (e) {
        console.warn(`[render error] ${fn}:`, e.message);
        if (typeof toast === 'function') toast('שגיאה בטעינת מסך: ' + e.message.substring(0, 60), 'error');
      }
    };
    window[fn]._wrapped = true;
  });

  // ===== FIX 8: Auto-focus first input in opened modal =====
  document.addEventListener('shown.bs.modal', e => {
    const input = e.target.querySelector('input:not([type=hidden]),textarea,select');
    if (input && !input.disabled && !input.readOnly) {
      try { input.focus(); } catch (_) {}
    }
  });

  // ===== FIX 9: Prevent double-click on save buttons =====
  document.addEventListener('click', e => {
    const btn = e.target.closest('button.btn-primary, button.btn-success');
    if (!btn) return;
    const txt = (btn.textContent || '').trim();
    if (!/שמור|הוסף|צור|אישור/.test(txt)) return;
    if (btn.dataset.lastClick && Date.now() - parseInt(btn.dataset.lastClick) < 1500) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    btn.dataset.lastClick = Date.now();
  }, true);

  // ===== FIX 10: Ctrl+S saves modal =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      const modal = document.querySelector('.modal.show');
      if (modal) {
        e.preventDefault();
        const saveBtn = modal.querySelector('button.btn-primary, button.btn-success');
        if (saveBtn) saveBtn.click();
      }
    }
  });

  console.warn('%c🔧 Pack-53 — UI bug fixes: Esc/Bootstrap, FAB reliability, Ctrl+K, modal cleanup', 'color:#dc2626;font-weight:bold');
})();
