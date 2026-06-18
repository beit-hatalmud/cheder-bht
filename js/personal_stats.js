/**
 * personal_stats.js — small "סטטיסטיקה אישית" widget for the current user.
 *
 * Shows how many events the user recorded this week, last 24h logins,
 * etc. Surface: a card on the home page (for any logged-in user).
 */
(function () {
  'use strict';

  function ensureSection() {
    if (document.getElementById('personal-stats-section')) return document.getElementById('personal-stats-section');
    const home = document.getElementById('page-home');
    if (!home) return null;
    const div = document.createElement('div');
    div.id = 'personal-stats-section';
    div.style.cssText = 'margin-bottom:16px';
    // Insert after home-today-section if present
    const after = document.getElementById('home-today-section');
    if (after) after.parentNode.insertBefore(div, after.nextSibling);
    else home.insertBefore(div, home.firstChild);
    return div;
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function refresh() {
    const sec = ensureSection();
    if (!sec) return;
    let u = null;
    try { u = JSON.parse(sessionStorage.getItem('user') || 'null'); } catch (_) {}
    if (!u || !u.username) return;

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const yesterday = Date.now() - 86400000;
    let mine = { week: 0, today: 0, students: 0, latestEvent: null };

    try {
      const behavior = (await api('listBehavior', [])).data || [];
      behavior.forEach(b => {
        if ((b['משתמש'] || '') !== u.username) return;
        const d = new Date(b['תאריך']);
        if (isNaN(d)) return;
        if (d.getTime() >= sevenDaysAgo) mine.week++;
        if (d.getTime() >= yesterday) mine.today++;
        if (!mine.latestEvent || d > mine.latestEvent) mine.latestEvent = d;
      });
      const myStudents = new Set();
      behavior.forEach(b => {
        if ((b['משתמש'] || '') === u.username && b['תלמיד_מזהה']) myStudents.add(b['תלמיד_מזהה']);
      });
      mine.students = myStudents.size;
    } catch (_) {}

    let avgPerWeek = '—';
    if (mine.week) {
      avgPerWeek = (mine.week / 5).toFixed(1) + '/יום';
    }

    const fullName = u.fullName || u.username;
    sec.innerHTML = `
      <div class="card" style="background:linear-gradient(135deg,#eef2ff,#fff);border:1px solid #e2e8f0;border-radius:12px;padding:14px">
        <div class="d-flex align-items-center flex-wrap gap-2 mb-2">
          <h6 class="mb-0" style="flex:1"><i class="bi bi-person-badge text-primary"></i> ${escHtml(fullName)} · שלום</h6>
          <span class="small text-muted">סטטיסטיקה אישית</span>
        </div>
        <div class="row g-2 mt-1">
          <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="display-6 text-primary mb-0">${mine.week}</div><div class="small text-muted">אירועים השבוע</div></div></div>
          <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="display-6 text-success mb-0">${mine.today}</div><div class="small text-muted">אירועים היום</div></div></div>
          <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="display-6 text-warning mb-0">${mine.students}</div><div class="small text-muted">תלמידים שתיעדתי</div></div></div>
          <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="display-6 text-info mb-0">${escHtml(avgPerWeek)}</div><div class="small text-muted">ממוצע יומי</div></div></div>
        </div>
      </div>`;
  }

  function maybeRender() {
    const home = document.getElementById('page-home');
    if (home && !home.classList.contains('d-none')) {
      setTimeout(refresh, 1200);
    }
  }

  window.addEventListener('hashchange', maybeRender);
  document.addEventListener('DOMContentLoaded', () => setTimeout(maybeRender, 2500));
})();
