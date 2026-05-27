// behavior-pack-98.js — Ensure ALL TLA fields are editable + show data source indicator. 2026-05-27
(function () {
  'use strict';

  // ===== Ensure all textareas/inputs in TLA tab are NOT readonly/disabled =====
  document.addEventListener('shown.bs.tab', e => {
    if (e.target?.getAttribute('href') !== '#stu-tab-tla') return;
    setTimeout(() => {
      const pane = document.getElementById('stu-tab-tla');
      if (!pane) return;
      pane.querySelectorAll('textarea, input').forEach(el => {
        el.removeAttribute('readonly');
        el.removeAttribute('disabled');
      });
    }, 100);
  });

  // ===== Add data-source badge =====
  document.addEventListener('shown.bs.tab', e => {
    if (e.target?.getAttribute('href') !== '#stu-tab-tla') return;
    setTimeout(() => {
      const pane = document.getElementById('stu-tab-tla');
      if (!pane || pane.querySelector('.tla-source-badge')) return;
      const modal = document.getElementById('viewStuModal');
      if (!modal) return;
      const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
      if (!m) return;
      const sid = parseInt(m);
      const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
      const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
      if (!s) return;
      const tla = (typeof window.parseTlaData === 'function' ? window.parseTlaData(s) : {}) || {};

      const isFromFile = !!s['תלא_pdf_id'];
      const hasSchedule = !!(tla.schedule && Object.keys(tla.schedule).length);
      const hasQuadrants = !!(tla.profile_quadrants && (tla.profile_quadrants.environmental || tla.profile_quadrants.background));
      const filledMonths = ['אלול','חשון','כסלו','טבת','שבט','אדר'].filter(c => tla.meetings?.[c]?.summary).length;

      const badge = document.createElement('div');
      badge.className = 'tla-source-badge alert alert-info small mb-2 mt-2 no-print';
      badge.style.cssText = 'border-radius:6px;padding:6px 12px';
      badge.innerHTML = `
        <i class="bi bi-info-circle"></i>
        מקור: ${isFromFile ? '<b>קובץ PPTX מקורי בDrive</b>' : 'נוצר אוטומטית ממעקב התנהגות+פרופיל'} ·
        ${hasSchedule ? '✅ מערכת שעות' : '⏳ אין מערכת שעות'} ·
        ${hasQuadrants ? '✅ פרופיל' : '⏳ פרופיל ריק'} ·
        ${filledMonths}/6 חודשי ישיבות צוות ·
        <span class="text-success">כל השדות פתוחים לעריכה ✏️</span>
      `;
      const toolbar = pane.querySelector('.toolbar-v7');
      if (toolbar) toolbar.parentNode.insertBefore(badge, toolbar.nextSibling);
      else pane.insertBefore(badge, pane.firstChild);
    }, 200);
  });

  console.warn('%c✏️ Pack-98 — ensure TLA editable + data source indicator badge', 'color:#16a34a;font-weight:bold');
})();
