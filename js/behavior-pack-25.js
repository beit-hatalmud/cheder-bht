// behavior-pack-25.js — Data Integrity & Recovery. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Data integrity check =====
  window.dataIntegrityCheck = async function () {
    const issues = [];
    try {
      const [st, ev, tk, us] = await Promise.all([
        api('listStudents',[]), api('listBehavior',[]),
        api('listTasks',[]), api('listUsers',[]),
      ]);
      const students = st.data || [];
      const events = ev.data || [];
      const tasks = tk.data || [];
      const users = us.data || [];

      // Orphan events (student not exists)
      const sids = new Set(students.map(s => String(s['מזהה'])));
      events.forEach(e => {
        if (e['תלמיד_מזהה'] && !sids.has(String(e['תלמיד_מזהה']))) {
          issues.push({ type: 'orphan_event', detail: `אירוע ${e['מזהה']} - תלמיד ${e['תלמיד_מזהה']} לא קיים` });
        }
      });
      // Missing required fields
      students.forEach(s => {
        if (!s['שם פרטי'] && !s['שם משפחה']) issues.push({ type: 'incomplete_student', detail: `תלמיד ${s['מזהה']} ללא שם` });
      });
      events.forEach(e => {
        if (!e['תאריך']) issues.push({ type: 'missing_date', detail: `אירוע ${e['מזהה']} ללא תאריך` });
        if (!e['קטגוריה']) issues.push({ type: 'missing_category', detail: `אירוע ${e['מזהה']} ללא קטגוריה` });
      });
      // Duplicate IDs
      const idCounts = {};
      [...students, ...events, ...tasks].forEach(item => {
        if (item['מזהה']) idCounts[item['מזהה']] = (idCounts[item['מזהה']]||0)+1;
      });
      Object.entries(idCounts).forEach(([id, c]) => {
        if (c > 1) issues.push({ type: 'duplicate_id', detail: `מזהה ${id} - ${c} פעמים` });
      });
      // Future dates
      events.forEach(e => {
        if (new Date(e['תאריך']).getTime() > Date.now() + 86400000) {
          issues.push({ type: 'future_date', detail: `אירוע ${e['מזהה']} בעתיד: ${e['תאריך']}` });
        }
      });
      // Old open tasks
      const monthAgo = Date.now() - 30*86400000;
      tasks.forEach(t => {
        if (t['סטטוס'] !== 'הושלם' && new Date(t['תאריך_יצירה']||0).getTime() < monthAgo) {
          issues.push({ type: 'stale_task', detail: `משימה ${t['מזהה']} פתוחה מעל חודש` });
        }
      });
      return { total_issues: issues.length, issues: issues.slice(0, 50) };
    } catch (e) { return { error: e.message }; }
  };

  // ===== 2. Auto-run integrity check on login =====
  setTimeout(async () => {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.role === 'מנהל' || u.username === 'admin') {
      const r = await dataIntegrityCheck();
      if (r.total_issues > 0 && typeof notify === 'function') {
        notify(`⚠ ${r.total_issues} בעיות בנתונים - הריץ dataIntegrityCheck()`, 'warn');
      }
    }
  }, 8000);

  // ===== 3. Local backup with download =====
  window.downloadFullBackup = async function () {
    try {
      const [st, ev, tk, us, pr] = await Promise.all([
        api('listStudents',[]), api('listBehavior',[]),
        api('listTasks',[]), api('listUsers',[]), api('listProjects',[]),
      ]);
      const backup = {
        version: '2026.05.24',
        timestamp: new Date().toISOString(),
        students: st.data || [],
        behavior: ev.data || [],
        tasks: tk.data || [],
        users: us.data || [],
        projects: pr.data || [],
      };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `bht_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      if (typeof toast === 'function') toast(`✓ גיבוי ${(json.length/1024).toFixed(0)}KB הורד`, 'success');
    } catch (e) { alert('שגיאה: ' + e.message); }
  };

  // ===== 4. Auto-export weekly =====
  setInterval(async () => {
    const lastExport = parseInt(localStorage.getItem('bht_last_export') || '0', 10);
    if (Date.now() - lastExport < 7 * 86400000) return;
    localStorage.setItem('bht_last_export', String(Date.now()));
    if (typeof notify === 'function') {
      notify('📥 הזמן לגיבוי שבועי - לחץ downloadFullBackup()', 'info');
    }
  }, 60 * 60 * 1000);

  // ===== 5. Restore from backup file =====
  window.restoreFromFile = function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const backup = JSON.parse(text);
        if (!backup.version || !backup.students) {
          return alert('קובץ גיבוי לא תקין');
        }
        if (!confirm(`לשחזר ${backup.students.length} תלמידים, ${backup.behavior?.length||0} אירועים מ-${backup.timestamp}?`)) return;
        // Just save to localStorage - user can review
        localStorage.setItem('bht_restore_pending', JSON.stringify(backup));
        if (typeof toast === 'function') toast('גיבוי הועלה. השתמש pushRestore() להמשך', 'info');
      } catch (err) {
        alert('שגיאה בקריאת הקובץ: ' + err.message);
      }
    };
    input.click();
  };

  // ===== 6. Version comparison =====
  window.compareWithBackup = function () {
    const pending = localStorage.getItem('bht_restore_pending');
    if (!pending) return alert('אין גיבוי טעון');
    const backup = JSON.parse(pending);
    const current = JSON.parse(localStorage.getItem('cheder_bht_data') || '{}');
    return {
      students: { backup: backup.students?.length || 0, current: current.students?.length || 0 },
      events: { backup: backup.behavior?.length || 0, current: current.behavior?.length || 0 },
      tasks: { backup: backup.tasks?.length || 0, current: current.tasks?.length || 0 },
    };
  };

  // ===== 7. Field validators =====
  window.validators = {
    phone: v => /^0\d{1,2}-?\d{7}$/.test(String(v||'').replace(/\s/g,'')),
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'')),
    israeliId: v => {
      const id = String(v||'').padStart(9, '0');
      if (!/^\d{9}$/.test(id)) return false;
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        let n = parseInt(id[i]) * (i % 2 + 1);
        if (n > 9) n -= 9;
        sum += n;
      }
      return sum % 10 === 0;
    },
    hebrewDate: v => /^\d{1,2}\s+[א-ת]+\s+\d{4}/.test(v||''),
    futureDate: v => new Date(v) > new Date(),
    pastDate: v => new Date(v) < new Date(),
  };

  // ===== 8. Auto-validate on blur =====
  document.addEventListener('blur', (e) => {
    const t = e.target;
    if (t.tagName !== 'INPUT') return;
    let valid = true;
    if (t.type === 'email' && t.value) valid = validators.email(t.value);
    if (t.type === 'tel' && t.value) valid = validators.phone(t.value);
    if (t.dataset.validate === 'id' && t.value) valid = validators.israeliId(t.value);
    t.classList.toggle('is-invalid', !valid);
  }, true);

  // ===== 9. Data anonymization for sharing =====
  window.anonymize = function (events) {
    return events.map(e => ({
      ...e,
      'שם תלמיד': 'תלמיד ' + String(e['תלמיד_מזהה']||'?').substring(0,3),
      'דווח_עי': 'מורה',
      'תיאור': (e['תיאור']||'').substring(0,30) + '...',
    }));
  };

  // ===== 10. Auto-cleanup orphan attachments =====
  setInterval(async () => {
    try {
      const atts = JSON.parse(localStorage.getItem('bht_attachments') || '{}');
      const r = await api('listBehavior', []);
      const validIds = new Set((r.data || []).map(e => String(e['מזהה'])));
      let removed = 0;
      Object.keys(atts).forEach(eid => {
        if (!eid.startsWith('temp_') && !validIds.has(String(eid))) {
          delete atts[eid];
          removed++;
        }
      });
      if (removed > 0) {
        localStorage.setItem('bht_attachments', JSON.stringify(atts));
        console.info(`[integrity] cleaned ${removed} orphan attachments`);
      }
    } catch (_) { }
  }, 24 * 60 * 60 * 1000);

  console.warn('%c🔒 Pack-25 — Data integrity, backup/restore, validators, anonymize, cleanup', 'color:#dc2626;font-weight:bold');
  console.info('Try: dataIntegrityCheck(), downloadFullBackup(), restoreFromFile()');
})();
