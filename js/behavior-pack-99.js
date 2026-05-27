// behavior-pack-99.js — Better TLA print/PDF: landscape schedule, page breaks, cleaner output. 2026-05-27
(function () {
  'use strict';

  // OVERRIDE print to make a polished printable PDF
  window.tlaPrintForm = function (sid) {
    const docEl = document.getElementById(`tla-doc-${sid}`);
    if (!docEl) return alert('פתח את הטאב תל"א');

    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();

    // Capture all current values
    const values = {};
    docEl.querySelectorAll('textarea, input').forEach(el => {
      if (el.id) values[el.id] = el.value;
    });

    // Clone DOM
    const clone = docEl.cloneNode(true);
    // Restore values
    clone.querySelectorAll('textarea, input').forEach(el => {
      if (el.id && values[el.id] !== undefined) {
        if (el.tagName === 'TEXTAREA') {
          el.textContent = values[el.id];
        } else {
          el.setAttribute('value', values[el.id]);
        }
      }
    });
    // Remove toolbar + interactive elements
    clone.querySelectorAll('.no-print, .toolbar-v7, .tla-source-badge').forEach(el => el.remove());

    const styleContent = (document.getElementById('tla-style-97')?.textContent || '') +
                        (document.getElementById('tla-pptx-style-96')?.textContent || '') +
                        (document.getElementById('tla-pptx-style-93')?.textContent || '');

    const w = window.open('', '_blank', 'width=1200,height=1400');
    if (!w) return alert('חוסם פופאפים? אפשר את החלון.');

    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="he">
<head><meta charset="utf-8"><title>תיק תל"א - ${fullName}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 1cm; }
@page :first { size: A4 portrait; }
@page schedule-page { size: A4 landscape; }
body { font-family: 'Heebo', Arial, sans-serif; direction: rtl; padding: 0; margin: 0; background: #fff; }
${styleContent}

/* Override for print quality */
.tla-v7 { max-width: none; padding: 6px; }
.tla-v7 .tla-slide {
  page-break-inside: avoid;
  page-break-after: always;
  margin-bottom: 0;
  box-shadow: none;
  border: 2px solid #1e3a8a;
}
.tla-v7 .tla-slide:last-child { page-break-after: auto; }

/* Slide 2 (schedule) - landscape */
.tla-v7 .tla-slide:nth-child(2) { page: schedule-page; }

/* Make textareas show all content */
.tla-v7 textarea, .tla-v7 input {
  background: transparent !important;
  border: 0 !important;
  outline: 0 !important;
  resize: none;
  overflow: visible;
  height: auto !important;
  min-height: 1.2em;
}

/* Print color preservation */
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.tla-v7 .tla-header { background: #1e3a8a !important; color: #fff !important; }
.tla-v7 .tla-quad-label { background: #fbbf24 !important; color: #1e3a8a !important; }
.tla-v7 table.tla-g th { background: #fbbf24 !important; color: #1e3a8a !important; }
.tla-v7 table.tla-g td.tla-time { background: #f3f4f6 !important; }
.tla-v7 table.tla-g td.tla-month { background: #fef3c7 !important; }
</style>
</head><body>
${clone.outerHTML}
<script>
// Resize all textareas to fit content for print
window.addEventListener('load', () => {
  document.querySelectorAll('textarea').forEach(t => {
    t.style.height = (t.scrollHeight + 4) + 'px';
  });
  setTimeout(() => window.print(), 800);
});
<\/script>
</body></html>`);
    w.document.close();
  };

  // ===== Visual hint that print is available =====
  setTimeout(() => {
    document.querySelectorAll('.tla-v7 button[onclick*="tlaPrintForm"]').forEach(btn => {
      btn.title = 'הדפסה: A4 רגיל לכיסוי+פרופיל, A4 landscape למערכת שעות';
    });
  }, 2000);

  console.warn('%c🖨 Pack-99 — Polished TLA print/PDF (landscape schedule, page breaks, color preservation)', 'color:#1e3a8a;font-weight:bold');
})();
