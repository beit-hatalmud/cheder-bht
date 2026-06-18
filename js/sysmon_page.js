/**
 * sysmon_page.js — admin-only #sysmon page that probes live endpoints.
 *
 * Surface: a "מצב מערכת" tile in the home dashboard's "ניהול והגדרות"
 * group, plus a /#sysmon route. Pings Apps Script, GH Pages, Supabase
 * REST, and displays results live.
 */
(function () {
  'use strict';

  function ensurePage() {
    let page = document.getElementById('page-sysmon');
    if (page) return page;
    page = document.createElement('div');
    page.id = 'page-sysmon';
    page.className = 'd-none';
    const container = document.querySelector('.container');
    if (container) container.appendChild(page);
    return page;
  }

  async function ping(url, label) {
    const t0 = performance.now();
    try {
      const ctl = new AbortController();
      const tt = setTimeout(() => ctl.abort(), 10000);
      await fetch(url, { mode: 'no-cors', signal: ctl.signal });
      clearTimeout(tt);
      return { label, ok: true, latency: Math.round(performance.now() - t0) };
    } catch (e) {
      return { label, ok: false, latency: null, error: e.message };
    }
  }

  async function refresh() {
    const page = ensurePage();
    if (!page) return;
    const results = await Promise.all([
      ping('https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec?action=ping', 'Apps Script'),
      ping('/cheder-bht/manifest.webmanifest', 'GitHub Pages'),
      ping('https://iythgizaqjivxtgwyexj.supabase.co/rest/v1/', 'Supabase REST'),
      ping('https://accounts.google.com/gsi/client', 'Google Sign-In SDK'),
    ]);
    const score = results.filter(r => r.ok).length;
    page.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="d-flex align-items-center mb-3 gap-2 flex-wrap">
        <h3 class="mb-0"><i class="bi bi-activity text-primary"></i> מצב מערכת</h3>
        <span class="badge ${score === results.length ? 'bg-success' : score === 0 ? 'bg-danger' : 'bg-warning'}">${score}/${results.length} שירותים</span>
        <button class="btn btn-sm btn-outline-primary ms-auto" onclick="refreshSysmon()"><i class="bi bi-arrow-clockwise"></i> בדיקה מחדש</button>
      </div>
      <div class="row g-3">
        ${results.map(r => `
          <div class="col-md-6">
            <div class="card p-3">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-${r.ok ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'} fs-4"></i>
                <div style="flex:1">
                  <div style="font-weight:600">${r.label}</div>
                  <small class="text-muted">${r.ok ? 'מגיב · ' + (r.latency != null ? r.latency + 'ms' : '—') : 'אין תגובה'}</small>
                </div>
              </div>
              ${r.error ? `<small class="text-danger mt-1">${r.error}</small>` : ''}
            </div>
          </div>`).join('')}
      </div>
      <div class="card p-3 mt-3">
        <h6><i class="bi bi-clock-history text-warning"></i> משימות מתוזמנות</h6>
        <ul class="small mb-0">
          <li>BHT_DailyBackup — 23:00 כל יום (גיבוי JSON+XLSX)</li>
          <li>BHT_AuthWatchdog — כל 10 דק׳ (משחזר backend)</li>
          <li>BHT_SmokeTest — כל 30 דק׳ (e2e Playwright)</li>
          <li>BHT_UptimeCollect — כל 5 דק׳ (אוסף latency)</li>
          <li>BHT_WeeklySummary — ראשון 07:00 (מייל סיכום)</li>
        </ul>
      </div>
      <div class="alert alert-info small mt-3">
        <i class="bi bi-info-circle"></i> הניטור רץ בדפדפן ומשתמש ב-no-cors fetch.
        קריאות לוגים מלאות + zachem watchdog נשמרות תחת
        <code style="font-size:.85em">%LOCALAPPDATA%\\cheder-bht-watchdog\\</code>
      </div>
    `;
  }

  window.refreshSysmon = refresh;

  function handleRoute() {
    if (location.hash === '#sysmon') {
      const page = ensurePage();
      const all = document.querySelectorAll('[id^="page-"]');
      all.forEach(p => p.classList.add('d-none'));
      page.classList.remove('d-none');
      refresh();
    }
  }
  window.addEventListener('hashchange', handleRoute);
  document.addEventListener('DOMContentLoaded', () => setTimeout(handleRoute, 1500));
})();
