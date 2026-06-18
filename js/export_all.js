/**
 * export_all.js — admin "ייצא הכל" button.
 *
 * Pulls every list-style API the user is allowed to see, builds a
 * single CSV per table inside a zip-like joined .csv file, and downloads.
 * For simplicity (no zip library dependency), we produce a single big
 * .csv with a separator row per table — easy to import into Excel.
 *
 * Surface: a button on the staff page (admins only).
 */
(function () {
  'use strict';

  const LISTS = [
    ['users', 'listUsers'],
    ['classes', 'listClasses'],
    ['students', 'listStudents'],
    ['categories', 'listCategories'],
    ['behavior_events', 'listBehavior'],
    ['attendance', 'listAttendance'],
    ['tests', 'listTests'],
    ['medications', 'listMedications'],
    ['meetings', 'listMeetings'],
    ['conversations', 'listConversations'],
    ['functioning', 'listFunctioning'],
  ];

  function toCsvCell(v) {
    if (v == null) return '';
    let s = String(v);
    if (typeof v === 'object') {
      try { s = JSON.stringify(v); } catch (_) { s = String(v); }
    }
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function buildCsv(name, rows) {
    if (!rows || !rows.length) {
      return `### ${name} (0 rows)\n\n`;
    }
    const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    const lines = [`### ${name} (${rows.length} rows)`];
    lines.push(headers.join(','));
    rows.forEach(r => {
      lines.push(headers.map(h => toCsvCell(r[h])).join(','));
    });
    lines.push('');
    return lines.join('\n');
  }

  window.bhtExportAll = async function () {
    let u = null;
    try { u = JSON.parse(sessionStorage.getItem('user') || 'null'); } catch (_) {}
    const isAdmin = u && (u.username === 'admin' || u.role === 'מנהל');
    if (!isAdmin) {
      alert('פעולה זו זמינה למנהל בלבד');
      return;
    }
    if (!confirm('הורד CSV של כל הטבלאות? (יכול לקחת 30 שניות עד דקה)')) return;
    if (window.bhtNotify) window.bhtNotify('מתחיל ייצוא לכל הטבלאות…', 'info');

    let csv = '﻿';  // BOM for Excel
    csv += '# ייצוא מלא של בית התלמוד\n';
    csv += `# נוצר ב-${new Date().toLocaleString('he-IL')}\n\n`;

    for (const [name, fn] of LISTS) {
      try {
        const r = await api(fn, []);
        const rows = (r && r.data) || [];
        csv += buildCsv(name, rows);
      } catch (e) {
        csv += `### ${name} — שגיאה: ${e.message || e}\n\n`;
      }
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bht_full_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
    if (window.bhtNotify) window.bhtNotify('הייצוא הושלם ✓', 'success');
  };
})();
