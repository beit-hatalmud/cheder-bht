// behavior-pack-21.js — Workflow Automation. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Auto-create task from high-severity event =====
  window.addEventListener('cheder-data-refreshed', async (e) => {
    if (e.detail?.type !== 'behavior' || e.detail?.action !== 'addBehavior') return;
    try {
      const r = await api('listBehavior', []);
      const events = (r.data || []).sort((a, b) => new Date(b['תאריך']) - new Date(a['תאריך']));
      const latest = events[0];
      if (!latest || latest['חומרה'] !== 'גבוהה') return;
      const key = `auto_task_${latest['מזהה']}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      if (typeof notify === 'function') notify(`💡 שקול ליצור משימת מעקב לאירוע: ${latest['שם תלמיד']}`, 'warn');
    } catch (_) { }
  });

  // ===== 2. Auto-assign task by category =====
  window.AUTO_ASSIGN = {
    'אלימות': 'הרב ירושלמי',
    'חברה': 'הרב ירושלמי',
    'לימודים': 'הרב יודלוב',
    'קידום כתיבה': 'הרב יודלוב',
    'קידום קריאה': 'הרב יודלוב',
    'תפילה': 'הרב שניידר',
  };

  // ===== 3. Workflow templates =====
  window.WORKFLOWS = {
    'new_student': [
      { type: 'task', title: 'מילוי טופס פרטים אישיים', days: 1 },
      { type: 'task', title: 'שיחת היכרות עם הורים', days: 3 },
      { type: 'task', title: 'הצבת שיעור פרטני', days: 7 },
      { type: 'task', title: 'בדיקת התאמה כיתתית', days: 14 },
    ],
    'discipline_incident': [
      { type: 'task', title: 'שיחה עם תלמיד', days: 0 },
      { type: 'task', title: 'יידוע הורים', days: 0 },
      { type: 'task', title: 'מעקב 3 ימים', days: 3 },
    ],
    'end_of_term': [
      { type: 'task', title: 'הכנת תעודות', days: 7 },
      { type: 'task', title: 'אסיפת הורים', days: 14 },
      { type: 'task', title: 'דוח ציוני תפקוד', days: 21 },
    ],
  };

  window.runWorkflow = async function (workflowName, context) {
    const wf = WORKFLOWS[workflowName];
    if (!wf) return;
    const now = Date.now();
    for (const step of wf) {
      const targetDate = new Date(now + step.days * 86400000).toISOString().slice(0, 10);
      await api('addTask', [{
        'כותרת': step.title + (context?.studentName ? ` - ${context.studentName}` : ''),
        'תיאור': `נוצר אוטומטית מ-workflow ${workflowName}`,
        'תאריך_יעד': targetDate,
        'סטטוס': 'חדש',
        'אחראי': context?.assignee || '',
        'תלמיד_מזהה': context?.studentId || '',
      }]);
    }
    if (typeof toast === 'function') toast(`✓ Workflow "${workflowName}" - ${wf.length} משימות נוצרו`, 'success');
  };

  // ===== 4. Rules engine =====
  window.RULES = JSON.parse(localStorage.getItem('bht_rules') || '[]');

  window.addRule = function (rule) {
    RULES.push(rule);
    localStorage.setItem('bht_rules', JSON.stringify(RULES));
  };

  window.evaluateRules = async function () {
    if (!RULES.length) return;
    try {
      const r = await api('listBehavior', []);
      const events = r.data || [];
      RULES.forEach(rule => {
        if (rule.type === 'count_threshold') {
          const counts = {};
          events.forEach(e => {
            if (rule.category && e['קטגוריה'] !== rule.category) return;
            const sid = e['תלמיד_מזהה'];
            counts[sid] = (counts[sid] || 0) + 1;
          });
          Object.entries(counts).forEach(([sid, n]) => {
            if (n >= rule.threshold) {
              const key = `rule_${rule.id}_${sid}`;
              if (sessionStorage.getItem(key)) return;
              sessionStorage.setItem(key, '1');
              if (typeof notify === 'function') notify(`🔔 כלל: ${rule.name} - תלמיד ${sid}`, 'warn');
            }
          });
        }
      });
    } catch (_) { }
  };
  setInterval(evaluateRules, 10 * 60 * 1000);

  // ===== 5. Recurring tasks =====
  window.createRecurringTask = function (template) {
    const recurring = JSON.parse(localStorage.getItem('bht_recurring') || '[]');
    recurring.push({
      ...template,
      id: 'rec_' + Date.now(),
      created: Date.now(),
      lastRun: 0,
    });
    localStorage.setItem('bht_recurring', JSON.stringify(recurring));
  };

  setInterval(async () => {
    const recurring = JSON.parse(localStorage.getItem('bht_recurring') || '[]');
    const now = Date.now();
    for (const r of recurring) {
      const interval = (r.intervalDays || 7) * 86400000;
      if (now - r.lastRun < interval) continue;
      r.lastRun = now;
      try {
        await api('addTask', [{
          'כותרת': r.title,
          'תיאור': r.description || 'משימה חוזרת',
          'תאריך_יעד': new Date(now + 86400000).toISOString().slice(0, 10),
          'סטטוס': 'חדש',
        }]);
      } catch (_) { }
    }
    localStorage.setItem('bht_recurring', JSON.stringify(recurring));
  }, 60 * 60 * 1000);

  // ===== 6. Snooze notifications =====
  window.snoozeNotification = function (notifId, hours) {
    hours = hours || 1;
    const snoozed = JSON.parse(localStorage.getItem('bht_snoozed') || '{}');
    snoozed[notifId] = Date.now() + hours * 3600000;
    localStorage.setItem('bht_snoozed', JSON.stringify(snoozed));
    if (typeof toast === 'function') toast(`נדחה ל-${hours} שעות`, 'info');
  };

  // ===== 7. Bulk operations =====
  window.bulkUpdateTasks = async function (taskIds, updates) {
    let success = 0;
    for (const id of taskIds) {
      try {
        const r = await api('updateTask', [{ 'מזהה': id, ...updates }]);
        if (r?.ok !== false) success++;
      } catch (_) { }
    }
    if (typeof toast === 'function') toast(`עודכנו ${success}/${taskIds.length}`, 'success');
    return success;
  };

  // ===== 8. Webhook trigger =====
  window.fireWebhook = async function (url, payload) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (e) {
      console.warn('Webhook failed:', e);
      return false;
    }
  };

  // ===== 9. Custom keyboard macros =====
  const MACROS = JSON.parse(localStorage.getItem('bht_macros') || '{}');
  document.addEventListener('keydown', e => {
    if (!e.altKey || e.target.matches('input,textarea')) return;
    const m = MACROS[e.key];
    if (m) {
      e.preventDefault();
      if (m.startsWith('goto:')) goto(m.slice(5));
      else if (m === 'newEvent') goto('behavior');
      else if (m === 'newTask') goto('tasks');
    }
  });
  window.setMacro = function (key, action) {
    MACROS[key] = action;
    localStorage.setItem('bht_macros', JSON.stringify(MACROS));
  };

  // ===== 10. Activity timeline =====
  window.activityTimeline = async function (days) {
    days = days || 7;
    try {
      const [ev, tk] = await Promise.all([api('listBehavior', []), api('listTasks', [])]);
      const cutoff = Date.now() - days * 86400000;
      const items = [
        ...(ev.data || []).filter(e => new Date(e['תאריך']).getTime() > cutoff)
          .map(e => ({ type: 'event', ts: new Date(e['תאריך']).getTime(), title: e['שם תלמיד'], detail: e['תיאור'] })),
        ...(tk.data || []).filter(t => new Date(t['תאריך_יצירה']||0).getTime() > cutoff)
          .map(t => ({ type: 'task', ts: new Date(t['תאריך_יצירה']||0).getTime(), title: t['כותרת'], detail: t['תיאור'] })),
      ];
      return items.sort((a, b) => b.ts - a.ts).slice(0, 50);
    } catch (_) { return []; }
  };

  console.warn('%c⚙ Pack-21 — Workflow Automation: rules, recurring, macros, workflows, timeline', 'color:#0ea5e9;font-weight:bold');
})();
