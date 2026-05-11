// Reports page — weekly/monthly/class reports + PDF + Gmail

async function renderReports() {
  const html = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="mb-0"><i class="bi bi-file-earmark-pdf"></i> דוחות</h3>
    </div>
    <div class="row g-3">
      <div class="col-md-6 col-lg-4">
        <div class="card p-4 h-100" style="cursor:pointer" onclick="genReportWeekly()">
          <h5><i class="bi bi-calendar-week text-primary"></i> דוח שבועי</h5>
          <p class="text-muted small mb-0">סיכום אירועי ההתנהגות והפעילות מה‑7 ימים האחרונים</p>
        </div>
      </div>
      <div class="col-md-6 col-lg-4">
        <div class="card p-4 h-100" style="cursor:pointer" onclick="genReportMonthly()">
          <h5><i class="bi bi-calendar-month text-info"></i> דוח חודשי</h5>
          <p class="text-muted small mb-0">סיכום החודש עם ממוצעי תפקוד, מבחנים ומגמות</p>
        </div>
      </div>
      <div class="col-md-6 col-lg-4">
        <div class="card p-4 h-100" style="cursor:pointer" onclick="genReportClass()">
          <h5><i class="bi bi-grid-3x3-gap text-success"></i> דוח כיתתי</h5>
          <p class="text-muted small mb-0">בחר כיתה ותצוגה מפורטת של כל התלמידים בה</p>
        </div>
      </div>
      <div class="col-md-6 col-lg-4">
        <div class="card p-4 h-100" style="cursor:pointer" onclick="genReportParent()">
          <h5><i class="bi bi-envelope-fill text-warning"></i> דוח להורים — PDF</h5>
          <p class="text-muted small mb-0">בחר תלמיד, צור PDF מעוצב ושלח להורים ב‑Gmail</p>
        </div>
      </div>
      <div class="col-md-6 col-lg-4">
        <div class="card p-4 h-100" style="cursor:pointer" onclick="genReportFlags()">
          <h5><i class="bi bi-flag-fill text-danger"></i> דוח דגלים</h5>
          <p class="text-muted small mb-0">תלמידים עם אירועי חומרה גבוהה השבוע</p>
        </div>
      </div>
      <div class="col-md-6 col-lg-4">
        <div class="card p-4 h-100" style="cursor:pointer" onclick="genReportTests()">
          <h5><i class="bi bi-pencil-square text-info"></i> דוח מבחנים</h5>
          <p class="text-muted small mb-0">ממוצעי מבחנים לפי תלמיד, פרשה וסוג</p>
        </div>
      </div>
    </div>`;
  document.getElementById('page-reports').innerHTML = html;
}

function openPrintWindow(htmlContent, title) {
  const w = window.open('', '_blank');
  if (!w) { alert('הדפדפן חוסם פופ‑אפ — אפשר אותו ונסה שוב'); return; }
  w.document.write(htmlContent);
  w.document.close();
}

function reportHeader(title) {
  return `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>${escHtml(title)}</title>
<style>
@page{size:A4;margin:1.5cm}
body{font-family:Arial,sans-serif;direction:rtl;color:#1f2937}
h1{color:#0066cc;border-bottom:3px solid #0066cc;padding-bottom:8pt;margin-bottom:4pt}
h2{color:#1e40af;margin-top:16pt}
.subtitle{color:#6b7280;margin-top:0}
table{width:100%;border-collapse:collapse;margin:10pt 0;font-size:10pt}
th{background:#f3f4f6;padding:6pt;border:1px solid #d1d5db;text-align:right}
td{padding:5pt;border:1px solid #e5e7eb}
.event{margin:6pt 0;padding:8pt;border-right:4px solid #0066cc;background:#f9fafb}
.event.high{border-color:#dc2626;background:#fef2f2}
.event.mid{border-color:#f59e0b;background:#fffbeb}
.event.low{border-color:#16a34a;background:#f0fdf4}
.kpi{display:inline-block;padding:8pt 12pt;margin:4pt;background:#eff6ff;border-radius:6px}
.kpi strong{font-size:18pt;color:#0066cc;display:block}
@media print{.no-print{display:none}}
</style></head><body>
<button class="no-print" onclick="window.print()" style="background:#0066cc;color:#fff;border:none;padding:10pt 20pt;border-radius:6px;cursor:pointer;font-size:14pt">🖨 הדפס / שמור כ‑PDF</button>
<h1>${escHtml(title)}</h1>
<p class="subtitle">בית התלמוד · בית שמש · ${new Date().toLocaleDateString('he-IL')}</p>`;
}

function reportFooter() {
  return `<script>setTimeout(()=>window.print(), 800);</script></body></html>`;
}

function genReportWeekly() {
  const data = getData();
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const events = (data.behavior||[]).filter(e => new Date(e['תאריך']).getTime() > weekAgo)
    .sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
  const high = events.filter(e => e['חומרה'] === 'גבוהה').length;
  let html = reportHeader('דוח שבועי');
  html += `<div>
    <div class="kpi"><strong>${events.length}</strong>אירועים השבוע</div>
    <div class="kpi"><strong>${high}</strong>חומרה גבוהה</div>
    <div class="kpi"><strong>${new Set(events.map(e=>e['תלמיד_מזהה'])).size}</strong>תלמידים</div>
  </div>`;
  html += '<h2>פירוט אירועים</h2>';
  if (!events.length) html += '<p class="text-muted">אין אירועים השבוע</p>';
  else events.forEach(e => {
    const c = e['חומרה']==='גבוהה'?'high':e['חומרה']==='נמוכה'?'low':'mid';
    const dt = new Date(e['תאריך']).toLocaleDateString('he-IL');
    html += `<div class="event ${c}"><strong>${escHtml(e['שם תלמיד']||'')}</strong> · ${escHtml(e['קטגוריה']||'')} · ${escHtml(dt)} · חומרה ${escHtml(e['חומרה']||'')}<br>${escHtml(e['תיאור']||'')}</div>`;
  });
  html += reportFooter();
  openPrintWindow(html, 'דוח שבועי');
}

function genReportMonthly() {
  const data = getData();
  const monthAgo = Date.now() - 30 * 24 * 3600 * 1000;
  const events = (data.behavior||[]).filter(e => new Date(e['תאריך']).getTime() > monthAgo);
  const funcAvg = data.functioning && data.functioning.length
    ? (data.functioning.reduce((a,b) => a + (parseFloat(b['ציון'])||0), 0) / data.functioning.length).toFixed(2) : '-';
  const byCat = {};
  events.forEach(e => { const c = e['קטגוריה']||'אחר'; byCat[c] = (byCat[c]||0) + 1; });
  let html = reportHeader('דוח חודשי');
  html += `<div>
    <div class="kpi"><strong>${events.length}</strong>אירועים החודש</div>
    <div class="kpi"><strong>${funcAvg}</strong>ממוצע תפקוד</div>
    <div class="kpi"><strong>${(data.tests||[]).length}</strong>מבחנים</div>
  </div>`;
  html += '<h2>פילוח לפי קטגוריה</h2><table><tr><th>קטגוריה</th><th>מספר אירועים</th></tr>';
  Object.entries(byCat).sort((a,b) => b[1] - a[1]).forEach(([c,n]) => {
    html += `<tr><td>${escHtml(c)}</td><td>${n}</td></tr>`;
  });
  html += '</table>';
  // Top students
  const byStu = {};
  events.forEach(e => { const sid = e['תלמיד_מזהה']; byStu[sid] = (byStu[sid]||0) + 1; });
  html += '<h2>תלמידים מובילים באירועים</h2><table><tr><th>תלמיד</th><th>מספר אירועים</th></tr>';
  Object.entries(byStu).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([sid,n]) => {
    const stu = (data.students||[]).find(s => String(s['מזהה']) === String(sid));
    const name = stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}` : '?';
    html += `<tr><td>${escHtml(name)}</td><td>${n}</td></tr>`;
  });
  html += '</table>';
  html += reportFooter();
  openPrintWindow(html, 'דוח חודשי');
}

function genReportClass() {
  const data = getData();
  const classes = (data.classes||[]).map(c => c['שם']);
  const cls = prompt('כיתה (' + classes.join('/') + '):', classes[0] || '');
  if (!cls) return;
  const students = (data.students||[]).filter(s => s['מחזור'] === cls && (s['סטטוס']||'פעיל') !== 'סיים');
  if (!students.length) return alert('אין תלמידים בכיתה ' + cls);
  let html = reportHeader('דוח כיתה ' + cls);
  html += `<p class="subtitle">${students.length} תלמידים</p>`;
  html += '<table><tr><th>שם</th><th>גיל</th><th>אירועים</th><th>השבוע</th><th>תפקוד</th><th>טלפון אם</th></tr>';
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  students.forEach(s => {
    const ev = (data.behavior||[]).filter(e => String(e['תלמיד_מזהה']) === String(s['מזהה']));
    const evWeek = ev.filter(e => new Date(e['תאריך']).getTime() > weekAgo).length;
    const fs = (data.functioning||[]).filter(f => String(f['תלמיד_מזהה']) === String(s['מזהה']));
    const fAvg = fs.length ? (fs.reduce((a,b) => a + (parseFloat(b['ציון'])||0), 0) / fs.length).toFixed(2) : '-';
    const name = (s['שם פרטי']||'') + ' ' + (s['שם משפחה']||'');
    html += `<tr><td>${escHtml(name)}</td><td>${escHtml(s['גיל']||'-')}</td><td>${ev.length}</td><td>${evWeek}</td><td>${fAvg}</td><td>${escHtml(s['טלפון אם']||'-')}</td></tr>`;
  });
  html += '</table>';
  html += reportFooter();
  openPrintWindow(html, 'דוח כיתה ' + cls);
}

function genReportFlags() {
  const data = getData();
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const counts = {};
  (data.behavior||[]).filter(e => new Date(e['תאריך']).getTime() > weekAgo && e['חומרה'] === 'גבוהה').forEach(e => {
    counts[e['תלמיד_מזהה']] = (counts[e['תלמיד_מזהה']]||0) + 1;
  });
  const flagged = Object.entries(counts).filter(([,n]) => n >= 2).sort((a,b) => b[1] - a[1]);
  let html = reportHeader('דוח דגלים — תלמידים לתשומת לב');
  if (!flagged.length) html += '<p>אין דגלים השבוע 🎉</p>';
  else {
    html += '<table><tr><th>תלמיד</th><th>כיתה</th><th>אירועי חומרה גבוהה השבוע</th><th>טלפון אם</th></tr>';
    flagged.forEach(([sid,n]) => {
      const stu = (data.students||[]).find(s => String(s['מזהה']) === String(sid));
      if (!stu) return;
      const name = (stu['שם פרטי']||'') + ' ' + (stu['שם משפחה']||'');
      html += `<tr><td>${escHtml(name)}</td><td>${escHtml(stu['מחזור']||'-')}</td><td><strong style="color:#dc2626">${n}</strong></td><td>${escHtml(stu['טלפון אם']||'-')}</td></tr>`;
    });
    html += '</table>';
  }
  html += reportFooter();
  openPrintWindow(html, 'דוח דגלים');
}

function genReportTests() {
  const data = getData();
  const tests = data.tests || [];
  const byStu = {};
  tests.forEach(t => {
    const sid = t['תלמיד_מזהה'];
    if (!byStu[sid]) byStu[sid] = { sum: 0, n: 0, byType: {} };
    byStu[sid].sum += parseFloat(t['ציון']) || 0;
    byStu[sid].n += 1;
    const type = t['סוג'] || 'אחר';
    if (!byStu[sid].byType[type]) byStu[sid].byType[type] = { sum: 0, n: 0 };
    byStu[sid].byType[type].sum += parseFloat(t['ציון']) || 0;
    byStu[sid].byType[type].n += 1;
  });
  const types = [...new Set(tests.map(t => t['סוג']).filter(Boolean))];
  let html = reportHeader('דוח מבחנים');
  html += '<table><tr><th>תלמיד</th><th>כיתה</th><th>ממוצע כללי</th>';
  types.forEach(t => html += `<th>${escHtml(t)}</th>`);
  html += '</tr>';
  Object.entries(byStu).map(([sid, d]) => {
    const stu = (data.students||[]).find(s => String(s['מזהה']) === String(sid));
    return { stu, d, avg: d.sum / d.n };
  }).filter(r => r.stu).sort((a,b) => b.avg - a.avg).forEach(({ stu, d, avg }) => {
    const name = (stu['שם פרטי']||'') + ' ' + (stu['שם משפחה']||'');
    html += `<tr><td>${escHtml(name)}</td><td>${escHtml(stu['מחזור']||'-')}</td><td><strong>${avg.toFixed(1)}</strong></td>`;
    types.forEach(t => {
      const td = d.byType[t];
      html += `<td>${td ? (td.sum/td.n).toFixed(1) : '-'}</td>`;
    });
    html += '</tr>';
  });
  html += '</table>';
  html += reportFooter();
  openPrintWindow(html, 'דוח מבחנים');
}

async function genReportParent() {
  const data = getData();
  const activeStu = (data.students||[]).filter(s => (s['סטטוס']||'פעיל') !== 'סיים').sort((a,b) =>
    String(a['מחזור']).localeCompare(String(b['מחזור'])) || (a['שם משפחה']||'').localeCompare(b['שם משפחה']||'', 'he'));
  const html = `<div class="modal fade" id="rp-modal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content">
    <div class="modal-header"><h5><i class="bi bi-envelope-fill"></i> דוח להורים</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <div class="mb-3"><label class="form-label">תלמיד</label>
        <select id="rp-student" class="form-select">
          ${activeStu.map(s => `<option value="${s['מזהה']}">${escHtml((s['מחזור']||'')+' · '+(s['שם פרטי']||'')+' '+(s['שם משפחה']||''))}</option>`).join('')}
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">מייל הורה</label>
        <input id="rp-email" class="form-control" placeholder="parent@example.com">
        <small class="text-muted">אם תשאיר ריק — רק PDF להדפסה</small>
      </div>
      <div class="form-check mb-3">
        <input type="checkbox" id="rp-include-trend" class="form-check-input" checked>
        <label class="form-check-label" for="rp-include-trend">כלול גרף מגמת התנהגות</label>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button>
      <button class="btn btn-warning" onclick="genParentPDF(false)"><i class="bi bi-printer"></i> רק הדפסה/PDF</button>
      <button class="btn btn-primary" onclick="genParentPDF(true)"><i class="bi bi-send"></i> צור PDF + שלח</button>
    </div>
  </div></div></div>`;
  const old = document.getElementById('rp-modal'); if (old) old.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  new bootstrap.Modal(document.getElementById('rp-modal')).show();
}

async function genParentPDF(sendEmail) {
  const sid = document.getElementById('rp-student').value;
  const email = document.getElementById('rp-email').value.trim();
  const data = getData();
  const stu = (data.students||[]).find(s => String(s['מזהה']) === String(sid));
  if (!stu) return alert('תלמיד לא נמצא');
  if (sendEmail && !email) return alert('הזן מייל');
  const events = (data.behavior||[]).filter(e => String(e['תלמיד_מזהה']) === String(sid))
    .sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
  const fs = (data.functioning||[]).filter(f => String(f['תלמיד_מזהה']) === String(sid));
  const tests = (data.tests||[]).filter(t => String(t['תלמיד_מזהה']) === String(sid));
  const fullName = (stu['שם פרטי']||'') + ' ' + (stu['שם משפחה']||'');
  const fAvg = fs.length ? (fs.reduce((a,b) => a + (parseFloat(b['ציון'])||0), 0) / fs.length).toFixed(2) : '-';
  const tAvg = tests.length ? (tests.reduce((a,b) => a + (parseFloat(b['ציון'])||0), 0) / tests.length).toFixed(1) : '-';
  let html = reportHeader('דוח התקדמות — ' + fullName);
  html += `<p class="subtitle">כיתה ${escHtml(stu['מחזור']||'-')} · גיל ${escHtml(stu['גיל']||'-')}</p>`;
  html += `<div>
    <div class="kpi"><strong>${events.length}</strong>אירועים מתועדים</div>
    <div class="kpi"><strong>${fAvg}</strong>ממוצע תפקוד</div>
    <div class="kpi"><strong>${tAvg}</strong>ממוצע מבחנים</div>
  </div>`;
  html += '<h2>אירועים אחרונים</h2>';
  if (!events.length) html += '<p>אין אירועים מתועדים</p>';
  else events.slice(0, 15).forEach(e => {
    const c = e['חומרה']==='גבוהה'?'high':e['חומרה']==='נמוכה'?'low':'mid';
    const dt = new Date(e['תאריך']).toLocaleDateString('he-IL');
    html += `<div class="event ${c}"><strong>${escHtml(e['קטגוריה']||'')}</strong> · ${escHtml(dt)}<br>${escHtml(e['תיאור']||'')}</div>`;
  });
  if (fs.length) {
    html += '<h2>ציוני תפקוד אחרונים</h2><table><tr><th>קטגוריה</th><th>פרמטר</th><th>ציון</th></tr>';
    fs.slice(0, 25).forEach(f => html += `<tr><td>${escHtml(f['קטגוריה']||'')}</td><td>${escHtml(f['פרמטר']||'')}</td><td><strong>${f['ציון']||'-'}</strong></td></tr>`);
    html += '</table>';
  }
  if (tests.length) {
    html += '<h2>ציוני מבחנים</h2><table><tr><th>סוג</th><th>פרשה</th><th>ציון</th></tr>';
    tests.slice(0, 20).forEach(t => html += `<tr><td>${escHtml(t['סוג']||'')}</td><td>${escHtml(t['פרשה']||'')}</td><td><strong>${t['ציון']||'-'}</strong></td></tr>`);
    html += '</table>';
  }
  html += `<p style="margin-top:30pt;color:#6b7280;font-size:9pt">בברכה,<br>בית התלמוד · בית שמש</p>`;
  html += reportFooter();
  bootstrap.Modal.getInstance(document.getElementById('rp-modal')).hide();
  if (sendEmail) {
    notify('שולח דוח...', 'success');
    await sendParentReportPDF(html, fullName, email);
  } else {
    openPrintWindow(html, 'דוח להורים — ' + fullName);
  }
}

async function sendParentReportPDF(html, studentName, email) {
  const APPS = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const TOKEN = 'BHT_AGENT_2026';
  try {
    // Step 1: Convert HTML to PDF via Apps Script
    const htmlB64 = btoa(unescape(encodeURIComponent(html)));
    const form = new FormData();
    form.append('action', 'html_to_pdf');
    form.append('token', TOKEN);
    form.append('html_b64', htmlB64);
    form.append('name', `דוח ${studentName}.pdf`);
    const r = await fetch(APPS, { method: 'POST', body: form });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'PDF generation failed');
    // Step 2: Open Gmail compose with PDF link
    const subject = encodeURIComponent(`דוח התקדמות — ${studentName}`);
    const body = encodeURIComponent(`שלום,\n\nמצורף דוח התקדמות של ${studentName}.\nקישור לדוח: ${j.url}\n\nבברכה,\nבית התלמוד · בית שמש`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`, '_blank');
    notify('PDF נוצר ונפתח Gmail', 'success');
  } catch (e) {
    notify('שגיאה: ' + e.message, 'error');
  }
}
