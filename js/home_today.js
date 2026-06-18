/**
 * home_today.js — "מערכת שעות היום" card on the home dashboard.
 *
 * If a weekly schedule exists (api('listSchedule')), show today's
 * classes. Otherwise show a friendly placeholder hinting at how to
 * add a schedule. Also surfaces a "החלף מקור נתונים" button for
 * the admin to toggle supa.bht.flags.users.
 */
(function () {
  'use strict';

  function ensureSection() {
    if (document.getElementById('home-today-section')) return document.getElementById('home-today-section');
    const home = document.getElementById('page-home');
    if (!home) return null;
    const div = document.createElement('div');
    div.id = 'home-today-section';
    div.style.cssText = 'margin-bottom:16px';
    // Insert after dashboard-charts if present, otherwise as first child
    const after = document.getElementById('dashboard-charts');
    if (after) after.parentNode.insertBefore(div, after.nextSibling);
    else home.insertBefore(div, home.firstChild);
    return div;
  }

  const HEBREW_DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

  function todayLabel() {
    const d = new Date();
    return 'יום ' + HEBREW_DAYS[d.getDay()] + ' · ' + d.toLocaleDateString('he-IL');
  }

  function render(slots) {
    const sec = ensureSection();
    if (!sec) return;
    const isAdmin = (() => {
      try {
        const u = JSON.parse(sessionStorage.getItem('user') || '{}');
        return u.role === 'מנהל' || u.username === 'admin';
      } catch (_) { return false; }
    })();
    const supaWired = !!(window.supa && window.supa.bht);
    let supaToggleHtml = '';
    if (isAdmin && supaWired) {
      const on = window.supa.bht.enabled && window.supa.bht.enabled('users');
      supaToggleHtml = `
        <button class="btn btn-sm ${on ? 'btn-success' : 'btn-outline-secondary'}"
                onclick="window.bhtToggleSupabaseUsers && window.bhtToggleSupabaseUsers()"
                title="הפעל/כבה את שכבת Supabase למשתמשים — מצב ניסוי">
          <i class="bi bi-cloud-arrow-up"></i>
          ${on ? 'Supabase פעיל' : 'הפעל Supabase'}
        </button>`;
    }

    let content = '';
    if (slots && slots.length) {
      content = `
        <div class="d-flex flex-wrap gap-2">
          ${slots.map(s => `
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:10px;min-width:140px">
              <span style="font-weight:700;color:#2563eb">${escHtml(s.time||s['שעה']||'')}</span>
              <span>${escHtml(s.subject||s['מקצוע']||s.title||'')}</span>
              <small class="text-muted">${escHtml(s.teacher||s['רב']||'')}</small>
            </div>`).join('')}
        </div>`;
    } else {
      content = `
        <div class="text-muted small">
          אין מערכת שעות מוגדרת. אפשר להוסיף בעתיד דרך
          <button class="btn btn-link btn-sm p-0 align-baseline" onclick="goto('settings')">הגדרות</button>.
        </div>`;
    }

    sec.innerHTML = `
      <div class="card" style="background:linear-gradient(135deg,#fef9c3,#fff);border:1px solid #e2e8f0;border-radius:12px;padding:14px">
        <div class="d-flex align-items-center flex-wrap gap-2 mb-2">
          <h6 class="mb-0" style="flex:1"><i class="bi bi-calendar-day text-warning"></i> ${escHtml(todayLabel())}</h6>
          ${supaToggleHtml}
        </div>
        ${content}
      </div>`;
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function refresh() {
    let slots = [];
    try {
      if (typeof api === 'function') {
        const r = await api('listSchedule', []).catch(() => ({ data: [] }));
        const all = r && r.data ? r.data : [];
        const today = HEBREW_DAYS[new Date().getDay()];
        slots = all.filter(s => (s['יום']||s.day||'') === today)
                    .sort((a,b) => (a['שעה']||'').localeCompare(b['שעה']||''))
                    .slice(0, 8);
      }
    } catch (_) {}
    render(slots);
  }

  function maybeRender() {
    const home = document.getElementById('page-home');
    if (home && !home.classList.contains('d-none')) {
      setTimeout(refresh, 350);
    }
  }

  window.addEventListener('hashchange', maybeRender);
  document.addEventListener('DOMContentLoaded', () => setTimeout(maybeRender, 1700));

  // Admin toggle for Supabase users feature flag
  window.bhtToggleSupabaseUsers = function () {
    if (!window.supa || !window.supa.bht || !window.supa.bht.flags) return;
    const cur = !!window.supa.bht.flags.users;
    if (!confirm(cur
      ? 'לכבות את חיבור Supabase למשתמשים? נחזור לקריאה דרך Apps Script.'
      : 'להפעיל את חיבור Supabase למשתמשים? זו תכונה ניסיונית — אפשר לכבות בכל רגע.')) return;
    window.supa.bht.flags.users = !cur;
    if (window.bhtNotify) {
      window.bhtNotify(window.supa.bht.flags.users
        ? 'Supabase למשתמשים: פעיל'
        : 'Supabase למשתמשים: כבוי', 'success');
    }
    refresh();
  };
})();
