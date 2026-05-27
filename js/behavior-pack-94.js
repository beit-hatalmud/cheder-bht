// behavior-pack-94.js — Fix home stats TLA count (was off-by-one) + dynamic shortcut button text. 2026-05-27
(function () {
  'use strict';

  // ===== Override the home stats widget completely =====
  function refreshHomeStatsAccurate() {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const today = new Date().toISOString().slice(0, 10);
    const students = data.students || [];
    const studentsCount = students.filter(s => s['סטטוס'] !== 'סיים').length;
    const tlaCount = students.filter(s => s['תלא_pdf_id'] || s['תלא_data']).length;
    const todayBehavior = (data.behavior || []).filter(e => (e['תאריך'] || '').startsWith(today)).length;
    const recentConv = (data.conversations || []).filter(c => {
      if (!c['תאריך']) return false;
      return (Date.now() - new Date(c['תאריך']).getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;

    // Replace pack-88's widget with a labeled one
    const existing = document.getElementById('home-stats-88');
    if (existing) {
      // Find the 4 stat-value divs (h3-equivalent big numbers) — they have inline color style
      const valueDivs = existing.querySelectorAll('div[style*="font-size:24px"]');
      // 0=students, 1=todayBehavior, 2=tlaCount, 3=recentConv, 4=cameras-icon
      if (valueDivs[0]) valueDivs[0].textContent = studentsCount;
      if (valueDivs[1]) valueDivs[1].textContent = todayBehavior;
      if (valueDivs[2]) valueDivs[2].textContent = `${tlaCount}/${studentsCount}`;
      if (valueDivs[3]) valueDivs[3].textContent = recentConv;
    }

    // Update home shortcut button text from pack-92
    const tlaBtn = document.querySelector('#tla-home-shortcut button');
    if (tlaBtn) {
      tlaBtn.innerHTML = `<i class="bi bi-mortarboard-fill"></i> דשבורד תל"א (${tlaCount}/${studentsCount} מסונכרנים)`;
    }
  }

  setInterval(refreshHomeStatsAccurate, 3000);
  setTimeout(refreshHomeStatsAccurate, 2500);

  // ===== Listen for student data refresh and update immediately =====
  window.addEventListener('cheder-data-refreshed', refreshHomeStatsAccurate);

  console.warn('%c🔢 Pack-94 — Fix home stats accuracy (count from תלא_data too) + dynamic button text', 'color:#16a34a;font-weight:bold');
})();
