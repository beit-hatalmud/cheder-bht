// behavior-pack-105.js — FINALLY kill pack-18's microphone buttons (uses 🎤 emoji not bi-mic class). 2026-05-27
(function () {
  'use strict';

  // ===== Override pack-18's functions =====
  window.startVoiceInput = function () {
    console.warn('[Pack-105] startVoiceInput disabled by user request');
  };

  // ===== Kill all mic buttons (they use 🎤 emoji as innerHTML, not bi-mic class) =====
  function killAllMics() {
    document.querySelectorAll('button, .btn').forEach(b => {
      const html = (b.innerHTML || '').trim();
      const title = (b.title || '').trim();
      if (html === '🎤' || html === '🔴' || html.includes('🎤') ||
          /הקלטה|הקלט/.test(title)) {
        // Remove only if it's small/inline (not the main toolbar buttons)
        if (b.classList.contains('btn-sm') || b.style.position === 'absolute') {
          b.remove();
        }
      }
    });
    // Also unwrap any pack-18 wrappers
    document.querySelectorAll('textarea[data-mic-added]').forEach(t => {
      const wrapper = t.parentNode;
      if (wrapper && wrapper.style?.position === 'relative' && wrapper.children.length === 2) {
        const grandparent = wrapper.parentNode;
        if (grandparent) {
          grandparent.insertBefore(t, wrapper);
          wrapper.remove();
        }
      }
      delete t.dataset.micAdded;
      t.removeAttribute('data-mic-added');
    });
  }

  // Run aggressively
  setInterval(killAllMics, 1000);
  setTimeout(killAllMics, 500);
  setTimeout(killAllMics, 1500);
  setTimeout(killAllMics, 3000);

  // Block new mic buttons via MutationObserver
  const obs = new MutationObserver(muts => {
    let needsCheck = false;
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if ((node.innerHTML || '').includes('🎤') || (node.title || '').includes('הקלטה')) {
          needsCheck = true;
          break;
        }
      }
      if (needsCheck) break;
    }
    if (needsCheck) killAllMics();
  });
  obs.observe(document.body, { childList: true, subtree: true });

  console.warn('%c🚫 Pack-105 — kill pack-18 mic buttons (🎤 emoji) + disable startVoiceInput', 'color:#dc2626;font-weight:bold');
})();
