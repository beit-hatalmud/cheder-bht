/**
 * onboarding.js — first-time-on-this-device welcome card + "What's new"
 * announcements. Stored in localStorage so it only appears once per device.
 */
(function () {
  'use strict';

  const SEEN_KEY = 'bht_onboarding_seen';
  const FEATURES_KEY = 'bht_features_seen_v1';

  const NEW_FEATURES = [
    { id: 'quickview', label: 'תלמיד היום — סיכום מהיר בלחיצה', icon: 'bi-person-vcard', color: '#2563eb' },
    { id: 'ctrlk', label: 'חיפוש מהיר Ctrl+K — כמו ב-Notion', icon: 'bi-search', color: '#16a34a' },
    { id: 'charts', label: 'גרפים בלוח הבקרה', icon: 'bi-bar-chart-line', color: '#f59e0b' },
    { id: 'remember', label: 'שמירת כניסה — לא צריך להיכנס כל פעם', icon: 'bi-shield-check', color: '#7c3aed' },
    { id: 'pwa', label: 'התקנה במובייל כאפליקציה', icon: 'bi-phone', color: '#0891b2' },
  ];

  function ensureStyle() {
    if (document.getElementById('onb-style')) return;
    const css = `
      .onb-banner { position:fixed;top:64px;right:16px;left:16px;max-width:520px;margin:0 auto;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;padding:14px 18px;border-radius:14px;box-shadow:0 8px 30px rgba(15,23,42,.35);z-index:1050;display:flex;align-items:flex-start;gap:14px }
      .onb-banner .bi-stars { font-size:24px;flex-shrink:0 }
      .onb-banner h6 { margin:0 0 4px 0;font-weight:600 }
      .onb-banner ul { margin:6px 0 0 0;padding-right:1.1em;font-size:.86rem;line-height:1.55;opacity:.95 }
      .onb-banner .dismiss { background:rgba(255,255,255,.15);border:0;color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.8rem }
      .onb-banner .dismiss:hover { background:rgba(255,255,255,.25) }
      [data-theme="dark"] .onb-banner { background:linear-gradient(135deg,#1e40af,#5b21b6) }
    `;
    const s = document.createElement('style');
    s.id = 'onb-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function showWelcomeBanner() {
    ensureStyle();
    const div = document.createElement('div');
    div.className = 'onb-banner';
    div.innerHTML = `
      <i class="bi bi-stars"></i>
      <div style="flex:1">
        <h6>${escHtml('ברוכים הבאים למערכת מעודכנת')}</h6>
        <div style="font-size:.86rem;opacity:.95">פיצ׳רים חדשים שכדאי לדעת:</div>
        <ul>${NEW_FEATURES.slice(0,4).map(f => '<li>' + escHtml(f.label) + '</li>').join('')}</ul>
      </div>
      <button class="dismiss" onclick="window.dismissOnboarding()">סגירה</button>`;
    document.body.appendChild(div);
    window._onbDiv = div;
    // Auto-hide after 25 seconds
    setTimeout(() => { try { div.style.opacity = '0'; div.style.transition = 'opacity .6s'; setTimeout(() => div.remove(), 700); } catch (_) {} }, 25000);
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  window.dismissOnboarding = function () {
    try { localStorage.setItem(FEATURES_KEY, '1'); } catch (_) {}
    if (window._onbDiv) { window._onbDiv.remove(); window._onbDiv = null; }
  };

  // Show only after a successful login (page-home is visible)
  function maybeShow() {
    try {
      if (localStorage.getItem(FEATURES_KEY)) return;
      const home = document.getElementById('page-home');
      if (!home || home.classList.contains('d-none')) return;
      // Wait for an actual user to be logged in
      const u = sessionStorage.getItem('user') || localStorage.getItem('bht_remembered_user');
      if (!u) return;
      showWelcomeBanner();
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(maybeShow, 2500));
  window.addEventListener('hashchange', () => setTimeout(maybeShow, 800));
  window.bhtShowOnboarding = showWelcomeBanner; // for manual replay from help menu

  // Once-only Ctrl+K hint: pulse the search badge for 8 seconds.
  function nudgeCtrlK() {
    try {
      if (localStorage.getItem('bht_ctrlk_hint_seen')) return;
      const badge = document.getElementById('badge-search-new');
      if (!badge) return;
      badge.style.transition = 'transform .35s';
      let n = 0;
      const id = setInterval(() => {
        badge.style.transform = (n % 2 === 0) ? 'scale(1.35) translate(-50%, -50%)' : 'scale(1) translate(-50%, -50%)';
        n++;
        if (n > 16) { clearInterval(id); badge.style.transform = ''; }
      }, 500);
      // Mark seen on first interaction (or after the pulse ends)
      const mark = () => { try { localStorage.setItem('bht_ctrlk_hint_seen', '1'); } catch (_) {} };
      setTimeout(mark, 10000);
      document.addEventListener('keydown', function once(e) {
        if ((e.ctrlKey||e.metaKey) && (e.key==='k'||e.key==='K')) { mark(); document.removeEventListener('keydown', once); }
      });
    } catch (_) {}
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(nudgeCtrlK, 4500));
})();
