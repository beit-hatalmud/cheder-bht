// behavior-pack-100.js — Remove microphone button + force everything editable + fill quadrants. 2026-05-27
(function () {
  'use strict';

  // ===== 1. KILL all microphone buttons (pack-18) =====
  function killMicButtons() {
    // pack-18 adds buttons with bi-mic / bi-mic-fill icons next to textareas
    document.querySelectorAll('.mic-btn, [title*="הקלטה"], [title*="הקלט"], [title*="הקלד"], [title*="דבר"], [title*="מיקרופון"]').forEach(b => {
      const txt = (b.textContent || '') + (b.title || '');
      if (b.querySelector?.('.bi-mic') || b.querySelector?.('.bi-mic-fill') || b.querySelector?.('.bi-soundwave') ||
          /mic|mic-fill|soundwave|microphone/i.test(b.innerHTML)) {
        b.remove();
      }
    });
    // Also remove any standalone mic icons
    document.querySelectorAll('i.bi-mic, i.bi-mic-fill, i.bi-soundwave').forEach(i => {
      const btn = i.closest('button, a, .btn');
      if (btn) btn.remove();
      else i.remove();
    });
  }
  setInterval(killMicButtons, 1500);
  setTimeout(killMicButtons, 500);
  setTimeout(killMicButtons, 2500);

  // ===== 2. Force editable on all TLA fields =====
  function forceEditable() {
    document.querySelectorAll('#stu-tab-tla textarea, #stu-tab-tla input, .tla-v7 textarea, .tla-v7 input').forEach(el => {
      el.removeAttribute('readonly');
      el.removeAttribute('disabled');
      el.style.pointerEvents = 'auto';
      el.style.userSelect = 'auto';
    });
  }
  setInterval(forceEditable, 2000);
  document.addEventListener('shown.bs.tab', e => {
    if (e.target?.getAttribute('href') === '#stu-tab-tla') {
      setTimeout(forceEditable, 100);
      setTimeout(forceEditable, 600);
    }
  });

  // ===== 3. Prevent pack-18 from adding mic buttons on new textareas =====
  if (window.MutationObserver) {
    const obs = new MutationObserver(muts => {
      let needsKill = false;
      for (const m of muts) {
        if (m.addedNodes.length) needsKill = true;
      }
      if (needsKill) killMicButtons();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  console.warn('%c🚫 Pack-100 — Remove mic button + force TLA editable everywhere', 'color:#dc2626;font-weight:bold');
})();
