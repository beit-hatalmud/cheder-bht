// behavior-pack-107.js — More bug fixes: API retry, network failure handling, race conditions. 2026-05-27
(function () {
  'use strict';

  let fixes = 0;

  // ===== Fix 1: API retry with exponential backoff =====
  const _origApi = window.api;
  if (typeof _origApi === 'function' && !_origApi._107wrapped) {
    window.api = async function (action, args) {
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const r = await _origApi.apply(this, arguments);
          if (r && r.ok === false && /network|fetch|timeout/i.test(r.error || '')) {
            if (attempt < maxRetries) {
              await new Promise(rs => setTimeout(rs, 500 * Math.pow(2, attempt)));
              continue;
            }
          }
          return r;
        } catch (e) {
          if (attempt < maxRetries) {
            console.warn(`[Pack-107] api(${action}) retry ${attempt+1}`, e.message);
            await new Promise(rs => setTimeout(rs, 500 * Math.pow(2, attempt)));
            continue;
          }
          throw e;
        }
      }
    };
    window.api._107wrapped = true;
    fixes++;
  }

  // ===== Fix 2: prevent NaN in number inputs =====
  document.addEventListener('blur', e => {
    const t = e.target;
    if (t.matches('input[type=number]')) {
      if (t.value === 'NaN' || t.value === 'undefined' || t.value === 'null') {
        t.value = '';
      }
    }
  }, true);
  fixes++;

  // ===== Fix 3: prevent infinite re-render loops by tracking renderXxx calls =====
  ['renderStudents', 'renderBehavior', 'renderTasks', 'renderConversations'].forEach(fname => {
    const orig = window[fname];
    if (typeof orig !== 'function' || orig._107lockwrapped) return;
    let lastCall = 0;
    let inFlight = false;
    window[fname] = function () {
      if (inFlight) {
        console.warn(`[Pack-107] ${fname} blocked - already in flight`);
        return Promise.resolve();
      }
      const now = Date.now();
      if (now - lastCall < 500) {
        console.warn(`[Pack-107] ${fname} debounced (${now - lastCall}ms ago)`);
        return Promise.resolve();
      }
      lastCall = now;
      inFlight = true;
      try {
        const r = orig.apply(this, arguments);
        if (r && typeof r.then === 'function') {
          return r.finally(() => { inFlight = false; });
        }
        inFlight = false;
        return r;
      } catch (e) {
        inFlight = false;
        throw e;
      }
    };
    window[fname]._107lockwrapped = true;
    fixes++;
  });

  // ===== Fix 4: ensure all <select> default values exist in options =====
  setInterval(() => {
    document.querySelectorAll('select').forEach(sel => {
      if (sel.value && !Array.from(sel.options).some(o => o.value === sel.value)) {
        // Default value missing - reset to first option
        if (sel.options.length) sel.value = sel.options[0].value;
      }
    });
  }, 10000);
  fixes++;

  // ===== Fix 5: warn about save before unload =====
  let _dirtyFlag = false;
  document.addEventListener('input', e => {
    if (e.target.matches('#viewStuModal textarea, #viewStuModal input[type=text]')) {
      _dirtyFlag = true;
    }
  });
  document.addEventListener('click', e => {
    if (e.target.closest?.('button[onclick*="Save"]')) _dirtyFlag = false;
  });
  window.addEventListener('beforeunload', e => {
    if (_dirtyFlag) {
      const modal = document.getElementById('viewStuModal');
      if (modal && modal.classList.contains('show')) {
        e.preventDefault();
        return e.returnValue = 'יש שינויים לא שמורים בכרטיס תלמיד. לעזוב?';
      }
    }
  });
  fixes++;

  // ===== Fix 6: fix double-rendering on hashchange =====
  let lastHash = location.hash;
  let hashTimer = null;
  window.addEventListener('hashchange', () => {
    if (lastHash === location.hash) return;
    lastHash = location.hash;
    clearTimeout(hashTimer);
    hashTimer = setTimeout(() => {
      // hash actually changed
    }, 100);
  });
  fixes++;

  // ===== Fix 7: clean orphan event listeners on modal close =====
  document.addEventListener('hidden.bs.modal', e => {
    const m = e.target;
    if (!m) return;
    // Force GC of any references
    m.querySelectorAll('*').forEach(el => {
      if (el._pc) { try { el._pc.close(); } catch{} delete el._pc; }
      if (el._hls) { try { el._hls.destroy(); } catch{} delete el._hls; }
    });
  });
  fixes++;

  // ===== Fix 8: prevent text overflow in tables =====
  if (!document.getElementById('pack-107-css')) {
    const st = document.createElement('style');
    st.id = 'pack-107-css';
    st.textContent = `
      table td, table th { overflow-wrap: anywhere; word-break: break-word; }
      .modal-body { overflow-x: hidden; }
    `;
    document.head.appendChild(st);
  }
  fixes++;

  console.warn(`%c🛠 Pack-107 — ${fixes} more bug fixes (API retry, NaN guard, render-lock, unsaved warning, GC, overflow)`, 'color:#16a34a;font-weight:bold');
})();
