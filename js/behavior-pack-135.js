// behavior-pack-135.js — Polished search + universal command palette. 2026-05-27
(function () {
  'use strict';

  /**
   * Universal Command Palette (Ctrl+K).
   * Searches across students, behavior, commands, settings.
   */
  window.openUniversalPalette = function () {
    if (document.getElementById('palette-135')) return;

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const palette = document.createElement('div');
    palette.id = 'palette-135';
    palette.style.cssText = `
      position: fixed; top: 80px; right: 50%; transform: translateX(50%);
      width: min(640px, 90vw); max-height: 70vh;
      background: #fff; border-radius: var(--bht-radius-lg, 12px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      z-index: 9996; direction: rtl; overflow: hidden;
      display: flex; flex-direction: column;
    `;
    palette.innerHTML = `
      <div style="padding:14px;border-bottom:1px solid var(--bht-gray-200,#e5e7eb);display:flex;align-items:center;gap:10px">
        <i class="bi bi-search" style="color:var(--bht-gray-500,#6b7280);font-size:18px"></i>
        <input id="palette-input-135" placeholder="חפש תלמיד, פעולה, או הקלד / לפקודה..." style="flex:1;border:0;outline:0;font-size:16px;font-family:Heebo,sans-serif">
        <kbd style="background:var(--bht-gray-100,#f3f4f6);padding:2px 8px;border-radius:4px;font-size:11px;color:var(--bht-gray-500,#6b7280)">ESC</kbd>
      </div>
      <div id="palette-results-135" style="overflow-y:auto;flex:1;padding:8px">
        <div style="padding:30px 14px;text-align:center;color:var(--bht-gray-500,#6b7280)">
          הקלד 2+ תווים לחיפוש...<br>
          <small>או הקלד / לפקודות מהירות</small>
        </div>
      </div>
      <div style="padding:8px 14px;border-top:1px solid var(--bht-gray-200,#e5e7eb);background:var(--bht-gray-50,#f9fafb);font-size:11px;color:var(--bht-gray-500,#6b7280);display:flex;gap:14px">
        <span><kbd>↑↓</kbd> ניווט</span>
        <span><kbd>Enter</kbd> פתיחה</span>
        <span style="margin-right:auto"><kbd>Ctrl+K</kbd> סגור</span>
      </div>
    `;

    const overlay = document.createElement('div');
    overlay.id = 'palette-overlay-135';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:9995';
    overlay.onclick = () => { palette.remove(); overlay.remove(); };

    document.body.appendChild(overlay);
    document.body.appendChild(palette);
    const inp = document.getElementById('palette-input-135');
    inp.focus();

    const COMMANDS = [
      { cmd: '/health', label: '🏥 בריאות מערכת', action: () => document.getElementById('health-badge-126')?.click() },
      { cmd: '/cache', label: '💾 ניהול אחסון', action: () => window.showCachePanel?.() },
      { cmd: '/errors', label: '📋 לוג שגיאות', action: () => window.viewErrorLog?.() },
      { cmd: '/queue', label: '📤 תור Offline', action: () => window.viewQueue?.() },
      { cmd: '/sync', label: '🔄 סנכרון מלא', action: () => window.BhtSync?.syncAll().then(r => alert(JSON.stringify(r))) },
      { cmd: '/integrity', label: '🔍 בדיקת תקינות', action: () => window.runIntegrityCheck?.() },
      { cmd: '/tla', label: '🎓 דשבורד תל"א', action: () => window.openTlaDashboard?.() },
      { cmd: '/settings', label: '⚙ הגדרות מאוחדות', action: () => window.openConsolidatedSettings?.() },
      { cmd: '/cameras', label: '📹 מצלמות', action: () => location.hash = '#cameras' },
      { cmd: '/home', label: '🏠 דף הבית', action: () => location.hash = '#home' },
    ];

    let selectedIdx = 0;
    function render(q) {
      const results = document.getElementById('palette-results-135');
      const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
      const students = data.students || [];

      if (!q || q.length < 1) {
        results.innerHTML = '<div style="padding:30px 14px;text-align:center;color:#6b7280">הקלד 2+ תווים לחיפוש...</div>';
        return;
      }

      let items = [];
      // Commands
      if (q.startsWith('/')) {
        items = COMMANDS.filter(c => c.cmd.includes(q) || c.label.includes(q.slice(1)));
      } else {
        // Students
        const ql = q.toLowerCase();
        items = students.filter(s => {
          const name = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.toLowerCase();
          return name.includes(ql) || String(s['תז']||'').includes(q);
        }).slice(0, 15).map(s => ({
          cmd: `#${s['מזהה']}`,
          label: `👤 ${s['שם פרטי']||''} ${s['שם משפחה']||''} · ${s['מחזור']||'-'}`,
          action: () => window.viewStudent?.(s['מזהה']),
        }));
      }

      if (items.length === 0) {
        results.innerHTML = '<div style="padding:20px 14px;text-align:center;color:#9ca3af">אין תוצאות</div>';
        return;
      }

      selectedIdx = Math.min(selectedIdx, items.length - 1);
      results.innerHTML = items.map((it, i) => `
        <div class="palette-item-135" data-idx="${i}" style="padding:10px 12px;border-radius:6px;cursor:pointer;display:flex;justify-content:space-between;background:${i===selectedIdx?'var(--bht-primary-lighter,#dbeafe)':'transparent'}">
          <span>${esc(it.label)}</span>
          <code style="color:#9ca3af;font-size:11px">${esc(it.cmd)}</code>
        </div>
      `).join('');

      results.querySelectorAll('.palette-item-135').forEach((el, i) => {
        el.onmouseenter = () => { selectedIdx = i; render(q); };
        el.onclick = () => {
          items[i].action?.();
          palette.remove();
          overlay.remove();
        };
      });
    }

    inp.oninput = () => render(inp.value.trim());

    inp.onkeydown = (e) => {
      if (e.key === 'Escape') { palette.remove(); overlay.remove(); }
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIdx++;
        render(inp.value.trim());
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIdx--;
        render(inp.value.trim());
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const sel = palette.querySelector(`.palette-item-135[data-idx="${selectedIdx}"]`);
        sel?.click();
      }
    };
  };

  // Ctrl+K opens palette (override any existing)
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !e.shiftKey) {
      e.preventDefault();
      // Close existing if open
      if (document.getElementById('palette-135')) {
        document.getElementById('palette-135').remove();
        document.getElementById('palette-overlay-135')?.remove();
      } else {
        window.openUniversalPalette();
      }
    }
  });

  console.warn('%c🔍 Pack-135 — Universal Command Palette (Ctrl+K) - search students + /slash commands', 'color:#7c3aed;font-weight:bold');
})();
