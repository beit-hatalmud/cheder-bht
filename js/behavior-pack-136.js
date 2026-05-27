// behavior-pack-136.js — CSV export of visible table + clean print view. 2026-05-27
(function () {
  'use strict';

  function csvEscape(v) {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function findVisibleTable() {
    const tables = Array.from(document.querySelectorAll('table'));
    let best = null;
    let bestArea = 0;
    for (const t of tables) {
      const r = t.getBoundingClientRect();
      if (r.width < 50 || r.height < 50) continue;
      const inViewport = r.top < window.innerHeight && r.bottom > 0;
      if (!inViewport) continue;
      const area = r.width * r.height;
      if (area > bestArea) { best = t; bestArea = area; }
    }
    return best;
  }

  function tableToCsv(table) {
    const rows = Array.from(table.querySelectorAll('tr'))
      .filter(tr => tr.offsetParent !== null);
    if (rows.length === 0) return null;
    const out = rows.map(tr => {
      const cells = Array.from(tr.querySelectorAll('th,td'))
        .filter(c => c.offsetParent !== null || c.tagName === 'TH');
      return cells.map(c => csvEscape(c.innerText.replace(/\s+/g, ' ').trim())).join(',');
    });
    return out.join('\r\n');
  }

  function downloadCsv(csv, filename) {
    // BOM so Excel opens Hebrew correctly
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  window.exportVisibleTableToCsv = function () {
    const table = findVisibleTable();
    if (!table) {
      if (typeof window.toast === 'function') window.toast('לא נמצאה טבלה בתצוגה', 'warning', 3000);
      else alert('לא נמצאה טבלה בתצוגה');
      return false;
    }
    const csv = tableToCsv(table);
    if (!csv) {
      if (typeof window.toast === 'function') window.toast('הטבלה ריקה', 'warning', 2500);
      return false;
    }
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const hash = (location.hash || '#home').replace('#', '');
    downloadCsv(csv, `bht-${hash}-${ts}.csv`);
    if (typeof window.toast === 'function') {
      const rows = csv.split('\r\n').length;
      window.toast(`יוצא ${rows} שורות ל-CSV`, 'success', 3000);
    }
    return true;
  };

  // Ctrl+Shift+E = export
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      window.exportVisibleTableToCsv();
    }
  });

  // ===== Clean print view =====
  // Inject print-only CSS so Ctrl+P produces a clean printout (no navbar, no buttons, RTL)
  function injectPrintCss() {
    if (document.getElementById('bht-print-css-136')) return;
    const css = document.createElement('style');
    css.id = 'bht-print-css-136';
    css.textContent = `
      @media print {
        body { background: #fff !important; color: #000 !important; direction: rtl; font-family: 'Heebo', sans-serif; }
        nav, .navbar, .sidebar, footer, .no-print,
        button:not(.print-allow), .btn:not(.print-allow),
        #palette-135, #palette-overlay-135,
        #health-badge-126, #settings-gear-133,
        #recent-btn-128, .toast, #toast-container,
        .modal-backdrop, [class*="fab-"],
        input[type=search], input[type=text],
        .pagination, .tabs-strip, .filter-bar { display: none !important; }
        .container, .container-fluid, main { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
        table { width: 100% !important; border-collapse: collapse !important; font-size: 11pt; page-break-inside: auto; }
        table th, table td { border: 1px solid #999 !important; padding: 4px 6px !important; }
        table thead { display: table-header-group; }
        table tr { page-break-inside: avoid; }
        h1, h2, h3 { page-break-after: avoid; }
        a { color: #000 !important; text-decoration: none !important; }
        a[href]:after { content: ''; }
        .card { border: 1px solid #ddd !important; box-shadow: none !important; }
        @page { margin: 1.5cm; size: A4; }
      }
    `;
    document.head.appendChild(css);
  }
  injectPrintCss();

  // ===== Print current view command =====
  window.printCurrentView = function () {
    // Slight defer so any layout settles
    setTimeout(() => window.print(), 100);
  };

  // Add /print + /export to command palette if available
  if (window.openUniversalPalette) {
    // The palette in pack-135 has hardcoded COMMANDS — we patch it indirectly via global hotkey only.
    // No-op here; the Ctrl+Shift+E shortcut already works.
  }

  // ===== Tiny "Export CSV" button in tables (auto-injected, dismissible) =====
  function ensureExportButton() {
    const table = findVisibleTable();
    if (!table) return;
    // Only inject once per table
    if (table.dataset.exportBtn136) return;
    table.dataset.exportBtn136 = '1';

    // Find a header bar to attach the button to (preferred), else float
    let host = table.previousElementSibling;
    while (host && !host.matches('.d-flex, .row, .card-header, .toolbar, h1, h2, h3')) {
      host = host.previousElementSibling;
    }
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline-success no-print';
    btn.style.cssText = 'font-size:11px;margin:0 6px;padding:2px 8px';
    btn.title = 'יצוא ל-Excel/CSV (Ctrl+Shift+E)';
    btn.innerHTML = '⬇ CSV';
    btn.onclick = (e) => { e.preventDefault(); window.exportVisibleTableToCsv(); };

    if (host && host.appendChild) {
      try { host.appendChild(btn); } catch { /* fallback */ }
    } else {
      // Float above table
      btn.style.position = 'absolute';
      btn.style.zIndex = '50';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;height:0';
      wrap.appendChild(btn);
      table.parentNode.insertBefore(wrap, table);
    }
  }

  // Check periodically (tables come and go with navigation)
  let lastHash = '';
  setInterval(() => {
    if (location.hash !== lastHash) {
      lastHash = location.hash;
      // Clear injection flag on rebuild
      document.querySelectorAll('table[data-export-btn136]').forEach(t => { delete t.dataset.exportBtn136; });
    }
    ensureExportButton();
  }, 3000);

  console.warn('%c⬇ Pack-136 — CSV export (Ctrl+Shift+E) + clean print view (Ctrl+P) + auto-inject CSV button on tables', 'color:#16a34a;font-weight:bold');
})();
