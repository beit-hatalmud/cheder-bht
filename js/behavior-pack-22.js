// behavior-pack-22.js — Reports & Analytics. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Monthly report =====
  window.monthlyReport = async function (year, month) {
    year = year || new Date().getFullYear();
    month = month != null ? month : new Date().getMonth();
    const from = new Date(year, month, 1).getTime();
    const to = new Date(year, month + 1, 0).getTime();
    try {
      const [ev, st, tk] = await Promise.all([api('listBehavior',[]), api('listStudents',[]), api('listTasks',[])]);
      const events = (ev.data||[]).filter(e => {
        const t = new Date(e['תאריך']).getTime();
        return t >= from && t <= to;
      });
      const tasks = (tk.data||[]).filter(t => {
        const d = new Date(t['תאריך_יצירה']||0).getTime();
        return d >= from && d <= to;
      });
      return {
        period: `${year}-${String(month+1).padStart(2,'0')}`,
        events_total: events.length,
        events_high: events.filter(e => e['חומרה']==='גבוהה').length,
        tasks_created: tasks.length,
        tasks_completed: tasks.filter(t => t['סטטוס']==='הושלם').length,
        active_students: new Set(events.map(e => e['תלמיד_מזהה'])).size,
        active_rabbis: new Set(events.map(e => e['דווח_עי']||e['רב'])).size,
        by_category: events.reduce((acc, e) => { acc[e['קטגוריה']||'?']=(acc[e['קטגוריה']||'?']||0)+1; return acc; }, {}),
      };
    } catch (_) { return null; }
  };

  // ===== 2. Export to Excel-friendly CSV =====
  window.exportFullCSV = async function () {
    try {
      const r = await api('listBehavior', []);
      const events = r.data || [];
      if (!events.length) return alert('אין נתונים');
      const cols = ['תאריך','תאריך_עברי','שם תלמיד','קטגוריה','חומרה','תיאור','הערות','רב','דווח_עי'];
      let csv = '﻿' + cols.join(',') + '\n';
      events.forEach(e => {
        csv += cols.map(c => `"${String(e[c]||'').replace(/"/g,'""')}"`).join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `אירועים_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    } catch (e) { alert(e.message); }
  };

  // ===== 3. Student report card =====
  window.studentReportCard = async function (sid) {
    try {
      const [st, ev, tk] = await Promise.all([api('listStudents',[]), api('listBehavior',[]), api('listTasks',[])]);
      const stu = (st.data||[]).find(s => String(s['מזהה'])===String(sid));
      if (!stu) return null;
      const events = (ev.data||[]).filter(e => String(e['תלמיד_מזהה'])===String(sid));
      const last30 = events.filter(e => Date.now() - new Date(e['תאריך']).getTime() < 30*86400000);
      return {
        name: `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`,
        class: stu['מחזור'] || '',
        events_total: events.length,
        events_last_30: last30.length,
        positive: events.filter(e => e['חומרה']==='נמוכה').length,
        concerning: events.filter(e => e['חומרה']==='גבוהה').length,
        categories: events.reduce((a,e) => { a[e['קטגוריה']||'?']=(a[e['קטגוריה']||'?']||0)+1; return a; }, {}),
      };
    } catch (_) { return null; }
  };

  // ===== 4. Top categories chart (text-based) =====
  window.topCategoriesChart = async function () {
    try {
      const r = await api('listBehavior', []);
      const cats = {};
      (r.data || []).forEach(e => { cats[e['קטגוריה']||'?'] = (cats[e['קטגוריה']||'?']||0)+1; });
      const sorted = Object.entries(cats).sort((a,b)=>b[1]-a[1]);
      const max = sorted[0]?.[1] || 1;
      return sorted.map(([c, n]) => {
        const bar = '█'.repeat(Math.round(n/max*30));
        return `${c.padEnd(20)} ${bar} ${n}`;
      }).join('\n');
    } catch (_) { return ''; }
  };

  // ===== 5. PDF-ready printable report =====
  window.printableReport = async function () {
    const data = await monthlyReport();
    if (!data) return;
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>דוח חודשי</title>
      <style>
        body { font-family: Heebo, Arial; padding: 30px; max-width: 800px; margin: 0 auto; }
        h1 { color: #2563eb; }
        .kpi { display: inline-block; margin: 10px; padding: 15px; background: #f3f4f6; border-radius: 8px; min-width: 120px; text-align: center; }
        .kpi-num { font-size: 32px; font-weight: bold; color: #1e40af; }
        .kpi-label { font-size: 12px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; }
        th { background: #f9fafb; }
      </style></head><body>
      <h1>📊 דוח חודשי - בית התלמוד</h1>
      <p>תקופה: ${data.period}</p>
      <div>
        <div class="kpi"><div class="kpi-num">${data.events_total}</div><div class="kpi-label">סה"כ אירועים</div></div>
        <div class="kpi"><div class="kpi-num">${data.events_high}</div><div class="kpi-label">חומרה גבוהה</div></div>
        <div class="kpi"><div class="kpi-num">${data.tasks_created}</div><div class="kpi-label">משימות חדשות</div></div>
        <div class="kpi"><div class="kpi-num">${data.tasks_completed}</div><div class="kpi-label">משימות הושלמו</div></div>
        <div class="kpi"><div class="kpi-num">${data.active_students}</div><div class="kpi-label">תלמידים פעילים</div></div>
        <div class="kpi"><div class="kpi-num">${data.active_rabbis}</div><div class="kpi-label">רבנים פעילים</div></div>
      </div>
      <h3>חלוקה לפי קטגוריה:</h3>
      <table><thead><tr><th>קטגוריה</th><th>כמות</th></tr></thead><tbody>
        ${Object.entries(data.by_category).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`<tr><td>${c}</td><td>${n}</td></tr>`).join('')}
      </tbody></table>
      <p style="margin-top:40px;color:#9ca3af;font-size:12px">נוצר ${new Date().toLocaleString('he-IL')}</p>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== 6. Class comparison =====
  window.classComparison = async function () {
    try {
      const [st, ev] = await Promise.all([api('listStudents',[]), api('listBehavior',[])]);
      const students = st.data || [];
      const events = ev.data || [];
      const classes = {};
      students.forEach(s => {
        const c = s['מחזור'] || '?';
        if (!classes[c]) classes[c] = { count: 0, events: 0 };
        classes[c].count++;
      });
      events.forEach(e => {
        const stu = students.find(s => String(s['מזהה'])===String(e['תלמיד_מזהה']));
        if (stu) {
          const c = stu['מחזור'] || '?';
          if (classes[c]) classes[c].events++;
        }
      });
      return Object.entries(classes).map(([c, d]) => ({
        class: c, students: d.count, events: d.events,
        avg: (d.events / d.count).toFixed(1),
      }));
    } catch (_) { return []; }
  };

  // ===== 7. Anonymized export (לשיתוף) =====
  window.anonymizedExport = async function () {
    const r = await api('listBehavior', []);
    return (r.data || []).map(e => ({
      תאריך: e['תאריך'],
      קטגוריה: e['קטגוריה'],
      חומרה: e['חומרה'],
      תיאור_מטושטש: (e['תיאור']||'').substring(0,30)+'...',
    }));
  };

  // ===== 8. Compare months =====
  window.compareMonths = async function () {
    const now = new Date();
    const thisMonth = await monthlyReport(now.getFullYear(), now.getMonth());
    const lastMonth = await monthlyReport(now.getFullYear(), now.getMonth()-1);
    return {
      this_month: thisMonth,
      last_month: lastMonth,
      delta: {
        events: (thisMonth?.events_total||0) - (lastMonth?.events_total||0),
        tasks: (thisMonth?.tasks_completed||0) - (lastMonth?.tasks_completed||0),
      },
    };
  };

  // ===== 9. Email monthly report =====
  window.emailMonthlyReport = async function (to) {
    const data = await monthlyReport();
    if (!data) return;
    const subject = `דוח חודשי - ${data.period}`;
    const body = `שלום,
דוח חודשי לתקופת ${data.period}:

📊 סטטיסטיקה:
• ${data.events_total} אירועים סה"כ
• ${data.events_high} בחומרה גבוהה
• ${data.tasks_created} משימות חדשות
• ${data.tasks_completed} משימות הושלמו
• ${data.active_students} תלמידים פעילים

לפי קטגוריה:
${Object.entries(data.by_category).map(([c,n])=>`  • ${c}: ${n}`).join('\n')}

בברכה,
מערכת בית התלמוד`;
    window.open(`mailto:${to||''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  // ===== 10. PDF report button on home =====
  setTimeout(() => {
    const home = document.getElementById('page-home');
    if (!home || document.getElementById('home-report-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'home-report-btn';
    btn.className = 'btn btn-outline-primary btn-sm mt-3';
    btn.innerHTML = '📊 דוח חודשי PDF';
    btn.onclick = printableReport;
    home.appendChild(btn);
  }, 4000);

  console.warn('%c📊 Pack-22 — Reports: monthly, CSV export, class compare, printable PDF, email', 'color:#dc2626;font-weight:bold');
})();
