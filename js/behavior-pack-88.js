// behavior-pack-88.js — Round 24: home dashboard mini-stats + camera health badge. 2026-05-27
(function () {
  'use strict';

  // ===== Render home stats widget (admin only) =====
  function renderHomeStats() {
    const home = document.getElementById('page-home');
    if (!home) return;
    if (home.querySelector('#home-stats-88')) return;
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isAdmin = u.username === 'admin' || u.role === 'מנהל';
    if (!isAdmin) return;

    const data = typeof getVisibleData === 'function' ? getVisibleData() : {};
    const today = new Date().toISOString().slice(0, 10);
    const todayBehavior = (data.behavior || []).filter(e => (e['תאריך'] || '').startsWith(today)).length;
    const studentsCount = (data.students || []).filter(s => s['סטטוס'] !== 'סיים').length;
    const tlaCount = (data.students || []).filter(s => s['תלא_pdf_id']).length;
    const recentConversations = (data.conversations || []).filter(c => {
      if (!c['תאריך']) return false;
      const d = new Date(c['תאריך']);
      return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;

    const widget = document.createElement('div');
    widget.id = 'home-stats-88';
    widget.className = 'mb-3 d-flex gap-2 flex-wrap';
    widget.style.cssText = 'background:linear-gradient(135deg,#f9fafb,#f3f4f6);padding:10px;border-radius:12px;border:1px solid #e5e7eb';
    widget.innerHTML = `
      <div style="flex:1;min-width:120px;text-align:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #e5e7eb">
        <div style="font-size:24px;font-weight:bold;color:#1e3a8a">${studentsCount}</div>
        <div style="font-size:11px;color:#6b7280">תלמידים פעילים</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #e5e7eb">
        <div style="font-size:24px;font-weight:bold;color:#16a34a">${todayBehavior}</div>
        <div style="font-size:11px;color:#6b7280">אירועים היום</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #e5e7eb">
        <div style="font-size:24px;font-weight:bold;color:#f59e0b">${tlaCount}/${studentsCount}</div>
        <div style="font-size:11px;color:#6b7280">תלאים מסונכרנים</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #e5e7eb">
        <div style="font-size:24px;font-weight:bold;color:#7c3aed">${recentConversations}</div>
        <div style="font-size:11px;color:#6b7280">שיחות 7 ימים</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #e5e7eb" id="cam-health-widget">
        <div style="font-size:24px;font-weight:bold;color:#dc2626">📹</div>
        <div style="font-size:11px;color:#6b7280">מצלמות: בודק...</div>
      </div>
    `;
    // Insert at top of home page
    home.insertBefore(widget, home.firstChild);

    // Check camera health asynchronously
    fetch('https://oregon-knock-learn-corrections.trycloudflare.com/lobby/index.m3u8', { mode: 'no-cors', cache: 'no-store' })
      .then(() => {
        const el = document.getElementById('cam-health-widget');
        if (el) el.innerHTML = `<div style="font-size:24px;font-weight:bold;color:#16a34a">📹 ✓</div><div style="font-size:11px;color:#6b7280">מצלמות פעילות</div>`;
      })
      .catch(() => {
        const el = document.getElementById('cam-health-widget');
        if (el) el.innerHTML = `<div style="font-size:24px;font-weight:bold;color:#dc2626">📹 ✗</div><div style="font-size:11px;color:#6b7280">מצלמות לא זמינות</div>`;
      });
  }

  // Render when home page is shown
  const _origShowPage = window.showPage;
  if (typeof _origShowPage === 'function') {
    window.showPage = function (name) {
      const r = _origShowPage.apply(this, arguments);
      if (name === 'home') setTimeout(renderHomeStats, 200);
      return r;
    };
  }
  // Also on initial load
  setTimeout(renderHomeStats, 1500);

  console.warn('%c📊 Pack-88 — Home dashboard mini-stats (admin only) + cameras health badge', 'color:#1e3a8a;font-weight:bold');
})();
