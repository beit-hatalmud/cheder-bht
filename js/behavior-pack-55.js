// behavior-pack-55.js — Mobile responsive fixes. 2026-05-26
(function () {
  'use strict';

  // ===== FIX: Wrap tables for mobile horizontal scroll =====
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      /* Make all tables horizontally scrollable */
      table { display: block; max-width: 100%; overflow-x: auto; white-space: nowrap; }
      table thead, table tbody, table tr { display: table; width: 100%; table-layout: auto; }
      /* Reduce padding */
      .card { padding: 8px !important; }
      .modal-body { padding: 12px !important; }
      /* Stack form columns */
      .row.g-2 .col-md-6, .row.g-3 .col-md-6, .row .col-md-7, .row .col-md-5, .row .col-md-4, .row .col-md-3, .row .col-md-2 {
        flex: 0 0 100%;
        max-width: 100%;
      }
      /* Hide non-essential columns */
      .hidden-mobile, [data-hidden-mobile] { display: none !important; }
      /* Smaller buttons */
      .btn { font-size: 13px; padding: 6px 10px; }
      .btn-sm { font-size: 11px; padding: 4px 8px; }
      /* Wrap text in cells */
      td, th { word-wrap: break-word; max-width: 200px; }
    }
    @media (max-width: 480px) {
      .topbar h3, h3 { font-size: 1.1rem; }
      .display-6 { font-size: 1.4rem; }
      .home-group { margin-top: 0.8rem; }
    }
  `;
  document.head.appendChild(style);

  // ===== Wrap loose tables in .table-responsive =====
  function wrapTables() {
    document.querySelectorAll('table:not(.wrapped-mobile)').forEach(t => {
      t.classList.add('wrapped-mobile');
      if (!t.parentElement.classList.contains('table-responsive')) {
        const wrap = document.createElement('div');
        wrap.className = 'table-responsive';
        wrap.style.cssText = 'overflow-x:auto;max-width:100%';
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
      }
    });
  }
  setInterval(wrapTables, 3000);
  setTimeout(wrapTables, 500);

  // ===== Stack inline d-flex on mobile =====
  if (window.matchMedia('(max-width: 768px)').matches) {
    const stackStyle = document.createElement('style');
    stackStyle.textContent = `
      @media (max-width: 768px) {
        .d-flex.justify-content-between { flex-wrap: wrap; gap: 4px; }
        .d-flex.gap-2 { flex-wrap: wrap; }
      }
    `;
    document.head.appendChild(stackStyle);
  }

  // ===== Better mobile modal close button (larger) =====
  if (window.matchMedia('(max-width: 768px)').matches) {
    const mobModalStyle = document.createElement('style');
    mobModalStyle.textContent = `
      @media (max-width: 768px) {
        .btn-close { padding: 12px !important; opacity: 0.7; }
        .modal-dialog { margin: 0 !important; max-width: 100% !important; height: 100vh; }
        .modal-content { min-height: 100vh; border-radius: 0; }
      }
    `;
    document.head.appendChild(mobModalStyle);
  }

  console.warn('%c📱 Pack-55 — Mobile responsive: tables scroll, stacked columns, larger close', 'color:#0891b2;font-weight:bold');
})();
