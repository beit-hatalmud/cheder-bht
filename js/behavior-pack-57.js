// behavior-pack-57.js — CRITICAL: Prevent auto-refresh from wiping user input. 2026-05-26
(function () {
  'use strict';

  // ===== Detect if user is actively typing =====
  let lastTypeTime = 0;
  let typingInElement = null;

  document.addEventListener('input', e => {
    if (e.target.matches('input, textarea, [contenteditable]')) {
      lastTypeTime = Date.now();
      typingInElement = e.target;
    }
  });
  document.addEventListener('focusin', e => {
    if (e.target.matches('input, textarea, [contenteditable]')) {
      typingInElement = e.target;
    }
  });
  document.addEventListener('focusout', () => {
    setTimeout(() => {
      const active = document.activeElement;
      if (!active || !active.matches('input, textarea, [contenteditable]')) {
        typingInElement = null;
      }
    }, 100);
  });

  // ===== Detect if a modal is open =====
  function isModalOpen() {
    return document.querySelectorAll('.modal.show').length > 0;
  }

  function isUserBusy() {
    const recentlyTyped = Date.now() - lastTypeTime < 30000; // 30s of typing
    const hasFocus = typingInElement && document.contains(typingInElement);
    return isModalOpen() || hasFocus || recentlyTyped;
  }

  // ===== Block periodic syncFromSheet when user busy =====
  if (typeof window.syncFromSheet === 'function') {
    const orig = window.syncFromSheet;
    window.syncFromSheet = async function (...args) {
      if (isUserBusy()) {
        console.info('[sync-57] skipped - user is typing/editing');
        return;
      }
      return orig.apply(this, args);
    };
  }

  // ===== Block render functions when modal open =====
  const RENDER_FNS = ['renderBehavior', 'renderStudents', 'renderTasks', 'renderProjects',
                     'renderFormsMgmt', 'renderFormsTab', 'renderStaff', 'renderReading',
                     'renderWriting', 'renderLessonsKlein', 'renderMeetings', 'renderConversations'];

  RENDER_FNS.forEach(fnName => {
    const orig = window[fnName];
    if (typeof orig !== 'function' || orig._guard57) return;
    window[fnName] = async function (...args) {
      // If a modal is open, defer the render
      if (isModalOpen()) {
        console.info(`[render-guard] ${fnName} deferred - modal open`);
        // Save args for later
        window._pendingRender = { fn: fnName, args };
        return;
      }
      // If user is actively typing in a form (no modal), defer too
      if (typingInElement && document.contains(typingInElement) && Date.now() - lastTypeTime < 10000) {
        console.info(`[render-guard] ${fnName} deferred - user typing`);
        window._pendingRender = { fn: fnName, args };
        return;
      }
      return orig.apply(this, args);
    };
    window[fnName]._guard57 = true;
  });

  // Re-run pending render when user stops being busy
  setInterval(() => {
    if (!window._pendingRender) return;
    if (isUserBusy()) return;
    const p = window._pendingRender;
    window._pendingRender = null;
    if (typeof window[p.fn] === 'function') {
      console.info(`[render-guard] running deferred ${p.fn}`);
      try { window[p.fn].apply(window, p.args); } catch (_) {}
    }
  }, 5000);

  // ===== Auto-save modal inputs every 5s =====
  setInterval(() => {
    document.querySelectorAll('.modal.show input, .modal.show textarea').forEach(el => {
      if (!el.id || !el.value || el.type === 'password' || el.type === 'hidden') return;
      try { localStorage.setItem('bht_draft_' + el.id, el.value); } catch (_) {}
    });
  }, 5000);

  // ===== Restore drafts when modal opens =====
  document.addEventListener('shown.bs.modal', e => {
    e.target.querySelectorAll('input[id], textarea[id]').forEach(el => {
      if (el.value || el.type === 'password' || el.type === 'hidden') return;
      try {
        const draft = localStorage.getItem('bht_draft_' + el.id);
        if (draft && draft.length > 3) {
          // Subtle notification
          const indicator = document.createElement('button');
          indicator.type = 'button';
          indicator.className = 'btn btn-sm btn-outline-warning mt-1';
          indicator.innerHTML = '↺ שחזר טיוטה';
          indicator.onclick = (ev) => {
            ev.preventDefault();
            el.value = draft;
            indicator.remove();
            el.dispatchEvent(new Event('input', { bubbles: true }));
          };
          el.parentNode.insertBefore(indicator, el);
        }
      } catch (_) {}
    });
  });

  // ===== Clear drafts after successful save =====
  document.addEventListener('hidden.bs.modal', e => {
    e.target.querySelectorAll('input[id], textarea[id]').forEach(el => {
      try { localStorage.removeItem('bht_draft_' + el.id); } catch (_) {}
    });
  });

  // ===== Block storage events that trigger reloads while typing =====
  const origDispatch = window.dispatchEvent;
  window.dispatchEvent = function (ev) {
    if (ev && ev.type === 'cheder-data-refreshed' && isUserBusy()) {
      console.info('[event-guard] blocked cheder-data-refreshed - user busy');
      return true;
    }
    return origDispatch.apply(this, arguments);
  };

  // ===== Warn before page reload if user has unsaved input =====
  window.addEventListener('beforeunload', e => {
    if (isUserBusy()) {
      const msg = 'יש לך טקסט שלא נשמר - לעזוב?';
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    }
  });

  console.warn('%c💾 Pack-57 — CRITICAL: Prevent auto-refresh wiping user input + drafts + restore', 'color:#dc2626;font-weight:bold;font-size:13px');
})();
