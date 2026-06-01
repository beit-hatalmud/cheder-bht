// behavior-pack-148.js — set data-user-interacted flag on first real click/key.
// Used by packs 15/33/34 to gate navigator.vibrate (which is blocked by Chrome
// until the user has tapped the page, generating console warnings).
// 2026-06-01.
(function () {
  'use strict';
  function markInteracted() {
    try { document.documentElement.setAttribute('data-user-interacted', '1'); } catch {}
    document.removeEventListener('pointerdown', markInteracted, true);
    document.removeEventListener('keydown', markInteracted, true);
    document.removeEventListener('touchstart', markInteracted, true);
  }
  document.addEventListener('pointerdown', markInteracted, true);
  document.addEventListener('keydown', markInteracted, true);
  document.addEventListener('touchstart', markInteracted, true);
  console.warn('%c👆 Pack-148 — user-interaction flag (gates vibrate)', 'color:#0891b2;font-weight:bold');
})();
