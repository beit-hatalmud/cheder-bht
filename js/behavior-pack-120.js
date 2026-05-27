// behavior-pack-120.js — User preferences + better empty states + loading skeletons. 2026-05-27
(function () {
  'use strict';

  // ===== User preferences manager =====
  const PREFS_KEY = 'bht_user_prefs';
  function loadPrefs() {
    return (typeof window.safeParse === 'function' ? window.safeParse(localStorage.getItem(PREFS_KEY), {}) : {}) || {};
  }
  function savePrefs(p) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
  }
  window.bhtPrefs = {
    get(key, fallback = null) {
      const p = loadPrefs();
      return p[key] ?? fallback;
    },
    set(key, val) {
      const p = loadPrefs();
      p[key] = val;
      savePrefs(p);
    },
    all: loadPrefs,
  };

  // ===== Apply persisted preferences on load =====
  function applyPrefs() {
    const p = loadPrefs();
    if (p.theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    if (p.compact) document.body.classList.add('bht-compact');
    if (p.fontScale) document.documentElement.style.fontSize = (p.fontScale * 100) + '%';
  }
  applyPrefs();

  // ===== Persist hash (last visited page) =====
  window.addEventListener('hashchange', () => {
    window.bhtPrefs.set('lastPage', location.hash);
  });
  // On startup, restore if no hash set
  if (!location.hash) {
    const last = window.bhtPrefs.get('lastPage');
    if (last && last !== '#login') {
      // Don't auto-redirect until user is logged in
      setTimeout(() => {
        const user = sessionStorage.getItem('user');
        if (user && user !== '{}' && !location.hash) {
          // location.hash = last;  // disabled - too aggressive
        }
      }, 2000);
    }
  }

  // ===== Better empty states =====
  // Watch for "אין X" placeholder texts and replace with friendly empty states
  setInterval(() => {
    document.querySelectorAll('p, div').forEach(el => {
      if (el.dataset.empty120) return;
      const txt = el.textContent.trim();
      const empties = ['אין תלמידים', 'אין תוצאות', 'אין דיווחים', 'אין שיחות', 'אין אירועים', 'אין נתונים'];
      if (empties.some(e => txt === e) && el.children.length === 0 && txt.length < 30) {
        el.dataset.empty120 = '1';
        const original = txt;
        el.innerHTML = `
          <div style="text-align:center;padding:30px 14px;color:#9ca3af">
            <div style="font-size:48px;margin-bottom:8px;opacity:0.5">📭</div>
            <div style="font-size:14px;color:#6b7280">${original.replace(/[<>]/g, '')}</div>
            <div style="font-size:12px;margin-top:4px">לחץ על "+ חדש" כדי להוסיף</div>
          </div>
        `;
      }
    });
  }, 5000);

  // ===== Loading skeleton for slow operations =====
  window.showSkeleton = function (targetEl, count = 3) {
    if (typeof targetEl === 'string') targetEl = document.querySelector(targetEl);
    if (!targetEl) return;
    const html = Array.from({length: count}, () => `
      <div class="bht-skeleton" style="background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:200% 100%;animation:bht-skel-120 1.5s infinite;height:40px;border-radius:6px;margin-bottom:8px"></div>
    `).join('');
    targetEl.innerHTML = html;
  };
  if (!document.getElementById('bht-skel-style-120')) {
    const st = document.createElement('style');
    st.id = 'bht-skel-style-120';
    st.textContent = '@keyframes bht-skel-120 { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }';
    document.head.appendChild(st);
  }

  // ===== Compact mode toggle (saves space on mobile) =====
  if (!document.getElementById('compact-style-120')) {
    const st = document.createElement('style');
    st.id = 'compact-style-120';
    st.textContent = `
      body.bht-compact .card { padding: 8px !important; }
      body.bht-compact table td, body.bht-compact table th { padding: 4px !important; font-size: 12px !important; }
      body.bht-compact .btn { padding: 4px 8px !important; font-size: 13px !important; }
      body.bht-compact .form-control { padding: 4px 8px !important; font-size: 13px !important; }
    `;
    document.head.appendChild(st);
  }
  window.toggleCompactMode = function () {
    const isCompact = document.body.classList.toggle('bht-compact');
    window.bhtPrefs.set('compact', isCompact);
    if (typeof toast === 'function') toast(isCompact ? 'מצב קומפקטי הופעל' : 'מצב רגיל', 'info');
  };

  // ===== Font size scaling =====
  window.setFontScale = function (scale) {
    scale = Math.max(0.75, Math.min(1.5, scale));
    document.documentElement.style.fontSize = (scale * 100) + '%';
    window.bhtPrefs.set('fontScale', scale);
  };
  window.bumpFont = (delta = 0.1) => {
    const cur = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
    window.setFontScale(cur + delta);
  };

  // ===== Ctrl+= / Ctrl+- to scale font =====
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.key === '=' || e.key === '+') { e.preventDefault(); window.bumpFont(0.1); }
    else if (e.key === '-') { e.preventDefault(); window.bumpFont(-0.1); }
    else if (e.key === '0') { e.preventDefault(); window.setFontScale(1); }
  });

  console.warn('%c👤 Pack-120 — User prefs (theme/compact/font) + empty states + loading skeleton + Ctrl+/-/0 font scale', 'color:#16a34a;font-weight:bold');
  console.log('  Try: toggleCompactMode(), bumpFont(0.1), bhtPrefs.all()');
})();
