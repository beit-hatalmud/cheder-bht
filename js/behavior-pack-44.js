// behavior-pack-44.js — Import/Export & Data Migration. 2026-05-25
(function () {
  'use strict';

  // ===== 1. CSV import =====
  window.importCSV = function (file, onParse) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result.replace(/^﻿/, '');
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (!lines.length) return onParse?.([]);
      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1).map(l => {
        const cells = parseCSVLine(l);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = cells[i] || ''; });
        return obj;
      });
      onParse?.(rows, headers);
    };
    reader.readAsText(file, 'UTF-8');
  };

  function parseCSVLine(line) {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        result.push(cur); cur = '';
      } else cur += c;
    }
    result.push(cur);
    return result;
  }

  // ===== 2. Export to Excel-compatible CSV =====
  window.exportCSV = function (rows, filename) {
    if (!rows.length) return;
    const headers = [...new Set(rows.flatMap(r => Object.keys(r)))];
    let csv = '﻿' + headers.map(h => `"${String(h).replace(/"/g,'""')}"`).join(',') + '\n';
    rows.forEach(r => {
      csv += headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    downloadFile(csv, filename || 'export.csv', 'text/csv');
  };

  // ===== 3. JSON export =====
  window.exportJSON = function (data, filename) {
    downloadFile(JSON.stringify(data, null, 2), filename || 'export.json', 'application/json');
  };

  // ===== 4. Helper: download file =====
  function downloadFile(content, name, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  window.downloadFile = downloadFile;

  // ===== 5. Bulk import dialog =====
  window.openImportDialog = function () {
    const html = `<div class="modal fade show" id="imp-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-upload"></i> ייבוא נתונים</h5><button class="btn-close" onclick="document.getElementById('imp-modal').remove()"></button></div>
          <div class="modal-body">
            <p>בחר סוג ייבוא:</p>
            <select id="imp-type" class="form-select mb-2">
              <option value="students">תלמידים</option>
              <option value="behavior">אירועי התנהגות</option>
              <option value="tasks">משימות</option>
            </select>
            <input type="file" id="imp-file" accept=".csv,.json" class="form-control mb-2">
            <div id="imp-preview"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="imp-go" disabled>ייבא</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const fileInput = document.getElementById('imp-file');
    const preview = document.getElementById('imp-preview');
    const goBtn = document.getElementById('imp-go');
    let parsedRows = [];
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.name.endsWith('.json')) {
        file.text().then(t => {
          try {
            parsedRows = JSON.parse(t);
            preview.innerHTML = `<div class="alert alert-info">נטענו ${parsedRows.length} רשומות</div>`;
            goBtn.disabled = false;
          } catch (err) {
            preview.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
          }
        });
      } else {
        importCSV(file, (rows) => {
          parsedRows = rows;
          preview.innerHTML = `<div class="alert alert-info">נטענו ${rows.length} שורות</div>
            <small>${escHtml(Object.keys(rows[0]||{}).join(' | '))}</small>`;
          goBtn.disabled = false;
        });
      }
    };
    goBtn.onclick = async () => {
      const type = document.getElementById('imp-type').value;
      const action = { students: 'addStudent', behavior: 'addBehavior', tasks: 'addTask' }[type];
      let ok = 0, fail = 0;
      goBtn.disabled = true;
      for (const row of parsedRows) {
        try {
          const r = await api(action, [row]);
          if (r?.ok !== false) ok++; else fail++;
        } catch (_) { fail++; }
      }
      if (typeof toast === 'function') toast(`✓ ${ok} | ✗ ${fail}`, 'success');
      document.getElementById('imp-modal').remove();
    };
  };

  // ===== 6. Template download =====
  window.downloadTemplate = function (type) {
    const templates = {
      students: [{ 'שם פרטי':'', 'שם משפחה':'', 'מחזור':'', 'טלפון אם':'', 'טלפון אב':'', 'כתובת':'' }],
      behavior: [{ 'תאריך':'', 'שם תלמיד':'', 'קטגוריה':'', 'תיאור':'', 'חומרה':'', 'דווח_עי':'' }],
      tasks: [{ 'כותרת':'', 'תיאור':'', 'אחראי':'', 'תאריך_יעד':'', 'סטטוס':'חדש', 'עדיפות':'בינוני' }],
    };
    exportCSV(templates[type] || [], `template_${type}.csv`);
  };

  // ===== 7. Excel-style paste =====
  document.addEventListener('paste', e => {
    const t = e.target;
    if (!t.matches('input,textarea')) return;
    const text = e.clipboardData?.getData('text');
    if (!text || !text.includes('\t')) return;
    // Detect tab-separated paste from Excel
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length > 1) {
      e.preventDefault();
      if (confirm(`זוהה הדבק טבלאי (${lines.length} שורות). לפתוח כפול-יבוא?`)) {
        openImportDialog();
      }
    }
  });

  // ===== 8. Diff between datasets =====
  window.diffDatasets = function (oldArr, newArr, keyField) {
    const oldMap = new Map(oldArr.map(x => [x[keyField], x]));
    const newMap = new Map(newArr.map(x => [x[keyField], x]));
    const added = newArr.filter(x => !oldMap.has(x[keyField]));
    const removed = oldArr.filter(x => !newMap.has(x[keyField]));
    const modified = newArr.filter(x => oldMap.has(x[keyField]) && JSON.stringify(oldMap.get(x[keyField])) !== JSON.stringify(x));
    return { added, removed, modified };
  };

  // ===== 9. Cleanup duplicates =====
  window.findDuplicates = async function (type) {
    const r = await api(`list${type[0].toUpperCase()+type.slice(1)}`, []);
    const data = r.data || [];
    const seen = new Map();
    const dups = [];
    data.forEach(d => {
      const key = (d['שם פרטי']||'') + (d['שם משפחה']||'') + (d['תיאור']||'').substring(0,30);
      if (seen.has(key)) dups.push({ original: seen.get(key), duplicate: d });
      else seen.set(key, d);
    });
    return dups;
  };

  // ===== 10. Big export menu =====
  window.bigExportMenu = function () {
    const opts = [
      { label: 'תלמידים (CSV)', action: async () => { const r = await api('listStudents', []); exportCSV(r.data, 'students.csv'); } },
      { label: 'אירועים (CSV)', action: async () => { const r = await api('listBehavior', []); exportCSV(r.data, 'behavior.csv'); } },
      { label: 'משימות (CSV)', action: async () => { const r = await api('listTasks', []); exportCSV(r.data, 'tasks.csv'); } },
      { label: 'כל הנתונים (JSON)', action: () => downloadFullBackup?.() },
      { label: 'תבנית - תלמידים', action: () => downloadTemplate('students') },
      { label: 'תבנית - אירועים', action: () => downloadTemplate('behavior') },
    ];
    const html = `<div class="modal fade show" id="exp-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>📤 ייצוא</h5><button class="btn-close" onclick="document.getElementById('exp-modal').remove()"></button></div>
          <div class="modal-body">${opts.map((o, i) => `<button class="btn btn-outline-primary w-100 mb-2" data-i="${i}">${escHtml(o.label)}</button>`).join('')}</div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('exp-modal').onclick = (e) => {
      const idx = e.target.closest('[data-i]')?.dataset.i;
      if (idx !== undefined) {
        opts[idx].action();
        document.getElementById('exp-modal').remove();
      }
    };
  };

  console.warn('%c📤 Pack-44 — Import/Export: CSV, JSON, templates, Excel paste, diff, duplicates', 'color:#16a34a;font-weight:bold');
})();
