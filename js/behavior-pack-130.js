// behavior-pack-130.js — Tooltips + quick-add FAB + smart undo. 2026-05-27
(function () {
  'use strict';

  // ===== Auto-tooltips for icon-only buttons =====
  if (!document.getElementById('bht-tooltip-style-130')) {
    const st = document.createElement('style');
    st.id = 'bht-tooltip-style-130';
    st.textContent = `
      [data-bht-tip] {
        position: relative;
      }
      [data-bht-tip]:hover::after {
        content: attr(data-bht-tip);
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        background: var(--bht-gray-800, #1f2937);
        color: #fff;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        white-space: nowrap;
        z-index: 9999;
        pointer-events: none;
        animation: bht-tip-fade-130 0.2s ease-out;
      }
      [data-bht-tip]:hover::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: var(--bht-gray-800, #1f2937);
        z-index: 9999;
        pointer-events: none;
      }
      @keyframes bht-tip-fade-130 { from { opacity: 0; transform: translateX(-50%) translateY(2px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    `;
    document.head.appendChild(st);
  }

  // Auto-apply data-bht-tip from title or aria-label
  setInterval(() => {
    document.querySelectorAll('button, .btn, a.btn').forEach(el => {
      if (el.dataset.bhtTip) return;
      const txt = el.textContent.trim();
      const title = el.title || el.getAttribute('aria-label');
      // Only icon-only buttons need tooltip
      if (txt.length < 3 && title && title.length < 50) {
        el.setAttribute('data-bht-tip', title);
        el.removeAttribute('title');  // prevent native tooltip overlap
      }
    });
  }, 6000);

  // ===== Quick-Add FAB (Floating Action Button) =====
  function injectQuickAddFAB() {
    if (document.getElementById('quick-add-fab-130')) return;
    const user = (() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
    if (!user.username) return;

    const fab = document.createElement('div');
    fab.id = 'quick-add-fab-130';
    fab.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      z-index: 9990;
    `;
    fab.innerHTML = `
      <button class="quick-add-toggle" style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--bht-primary,#1e3a8a),var(--bht-primary-light,#3b82f6));color:#fff;border:0;cursor:pointer;font-size:24px;box-shadow:0 4px 16px rgba(30,58,138,0.4);transition:transform 0.2s">
        <i class="bi bi-plus-lg"></i>
      </button>
      <div class="quick-add-menu" style="display:none;position:absolute;bottom:64px;right:0;background:#fff;border-radius:var(--bht-radius-lg,12px);box-shadow:var(--bht-shadow-xl,0 8px 24px rgba(0,0,0,0.12));padding:8px;min-width:200px"></div>
    `;
    document.body.appendChild(fab);

    const toggle = fab.querySelector('.quick-add-toggle');
    const menu = fab.querySelector('.quick-add-menu');

    const actions = [
      { icon: 'bi-person-plus', label: 'תלמיד חדש', fn: 'addStudentModal' },
      { icon: 'bi-clipboard-plus', label: 'אירוע התנהגות', fn: 'addBehaviorModal' },
      { icon: 'bi-chat-plus', label: 'שיחה חדשה', fn: 'addConversationModal' },
      { icon: 'bi-list-task', label: 'משימה חדשה', fn: 'addTaskModal' },
    ];

    menu.innerHTML = actions.map(a => `
      <button class="qa-item-130" data-fn="${a.fn}" style="display:flex;align-items:center;gap:10px;width:100%;background:transparent;border:0;padding:8px 10px;border-radius:6px;cursor:pointer;text-align:right;transition:background 0.1s;font-size:13px">
        <i class="bi ${a.icon}" style="color:var(--bht-primary,#1e3a8a);font-size:18px"></i>
        <span>${a.label}</span>
      </button>
    `).join('');

    menu.querySelectorAll('.qa-item-130').forEach(btn => {
      btn.addEventListener('mouseenter', () => btn.style.background = 'var(--bht-gray-100,#f3f4f6)');
      btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
      btn.onclick = () => {
        const fn = btn.dataset.fn;
        if (typeof window[fn] === 'function') {
          window[fn]();
        } else {
          if (typeof window.toast === 'function') window.toast(`פונקציה לא זמינה: ${fn}`, 'warn');
        }
        menu.style.display = 'none';
      };
    });

    toggle.onclick = (e) => {
      e.stopPropagation();
      const isOpen = menu.style.display === 'block';
      menu.style.display = isOpen ? 'none' : 'block';
      toggle.style.transform = isOpen ? '' : 'rotate(45deg)';
    };

    document.addEventListener('click', e => {
      if (!fab.contains(e.target)) {
        menu.style.display = 'none';
        toggle.style.transform = '';
      }
    });
  }

  setTimeout(injectQuickAddFAB, 2000);

  // ===== Smart Undo for delete actions =====
  window.bhtUndo = {
    stack: [],
    push(label, restoreFn) {
      this.stack.push({ ts: Date.now(), label, restoreFn });
      if (this.stack.length > 10) this.stack.shift();
      this.showToast(label);
    },
    showToast(label) {
      let toast = document.getElementById('undo-toast-130');
      if (toast) toast.remove();
      toast = document.createElement('div');
      toast.id = 'undo-toast-130';
      toast.style.cssText = 'position:fixed;bottom:20px;right:50%;transform:translateX(50%);background:var(--bht-gray-800,#1f2937);color:#fff;padding:10px 18px;border-radius:var(--bht-radius-md,8px);z-index:9998;display:flex;gap:14px;align-items:center;box-shadow:var(--bht-shadow-lg,0 4px 12px rgba(0,0,0,0.08))';
      toast.innerHTML = `<span>${label}</span><button onclick="bhtUndo.undo();this.parentElement.remove()" style="background:var(--bht-accent,#fbbf24);color:var(--bht-primary,#1e3a8a);border:0;padding:4px 12px;border-radius:6px;cursor:pointer;font-weight:600">↺ בטל</button>`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 8000);
    },
    undo() {
      const last = this.stack.pop();
      if (!last) return;
      try { last.restoreFn(); } catch (e) { console.warn('[Pack-130 undo] failed:', e); }
    },
  };

  console.warn('%c🎯 Pack-130 — Tooltips on icon buttons + Quick-Add FAB + bhtUndo system', 'color:#7c3aed;font-weight:bold');
})();
