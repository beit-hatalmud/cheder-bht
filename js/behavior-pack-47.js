// behavior-pack-47.js — Smart Notifications & Reminders v2. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Birthday reminders =====
  setInterval(async () => {
    try {
      const r = await api('listStudents', []);
      const students = r.data || [];
      const today = new Date();
      const todayKey = (today.getMonth()+1) + '-' + today.getDate();
      const birthdays = students.filter(s => {
        const bd = s['תאריך_לידה'];
        if (!bd) return false;
        const d = new Date(bd);
        if (isNaN(d)) return false;
        return (d.getMonth()+1)+'-'+d.getDate() === todayKey;
      });
      if (birthdays.length && !sessionStorage.getItem('bdays_' + todayKey)) {
        sessionStorage.setItem('bdays_' + todayKey, '1');
        const names = birthdays.map(s => `${s['שם פרטי']||''} ${s['שם משפחה']||''}`).join(', ');
        if (typeof notify === 'function') notify(`🎂 יום הולדת היום: ${names}`, 'success');
      }
    } catch (_) {}
  }, 4 * 60 * 60 * 1000);
  setTimeout(() => { try { sessionStorage.removeItem('bdays_last'); } catch(_){} }, 100);

  // ===== 2. Anniversary tracking =====
  window.anniversaries = function () {
    // Track admission anniversary
    return [];
  };

  // ===== 3. Overdue tasks alert =====
  setInterval(async () => {
    try {
      const r = await api('listTasks', []);
      const overdue = (r.data || []).filter(t => {
        if (t['סטטוס'] === 'הושלם') return false;
        if (!t['תאריך_יעד']) return false;
        return new Date(t['תאריך_יעד']).getTime() < Date.now();
      });
      if (overdue.length && !sessionStorage.getItem('overdue_alerted_' + new Date().toISOString().slice(0,10))) {
        sessionStorage.setItem('overdue_alerted_' + new Date().toISOString().slice(0,10), '1');
        if (typeof notify === 'function') notify(`⚠ ${overdue.length} משימות באיחור`, 'warn');
      }
    } catch (_) {}
  }, 2 * 60 * 60 * 1000);

  // ===== 4. Idle reminder =====
  let _lastActivity = Date.now();
  ['click', 'keydown'].forEach(ev => document.addEventListener(ev, () => { _lastActivity = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (Date.now() - _lastActivity > 30 * 60 * 1000) {
      _lastActivity = Date.now();
      if (typeof notify === 'function') notify('💡 לא היה פעילות 30 דקות - הכל בסדר?', 'info');
    }
  }, 5 * 60 * 1000);

  // ===== 5. Schedule-based reminders =====
  window.SCHEDULES = {
    morning: { hour: 8, msg: 'בוקר טוב - יום עבודה חדש' },
    midmorning: { hour: 10, msg: 'הפסקת בוקר - שתה משהו' },
    lunch: { hour: 13, msg: 'הפסקת צהריים' },
    afternoon: { hour: 15, msg: 'אחה"צ - בדוק משימות פתוחות' },
    closing: { hour: 17, msg: 'סוף יום - סיכום ושמירה' },
  };

  setInterval(() => {
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    if (m > 5) return; // only first 5 min of hour
    Object.entries(SCHEDULES).forEach(([k, s]) => {
      if (s.hour === h) {
        const key = `sched_${k}_${new Date().toISOString().slice(0,10)}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
        if (typeof notify === 'function') notify(s.msg, 'info');
      }
    });
  }, 60000);

  // ===== 6. Smart batch reminders (group similar) =====
  window._reminderQueue = [];
  window.queueReminder = function (msg, type) {
    _reminderQueue.push({ msg, type, ts: Date.now() });
    clearTimeout(window._queueFlush);
    window._queueFlush = setTimeout(() => {
      if (_reminderQueue.length === 1) {
        if (typeof notify === 'function') notify(_reminderQueue[0].msg, _reminderQueue[0].type);
      } else if (_reminderQueue.length > 1) {
        if (typeof notify === 'function') notify(`📋 ${_reminderQueue.length} תזכורות חדשות`, 'info');
      }
      _reminderQueue = [];
    }, 5000);
  };

  // ===== 7. Snooze action =====
  window.snoozeAll = function (hours) {
    hours = hours || 1;
    localStorage.setItem('bht_snooze_until', String(Date.now() + hours * 3600000));
    if (typeof toast === 'function') toast(`התראות נדחו ל-${hours} שעות`, 'info');
  };

  window.isSnoozed = function () {
    const until = parseInt(localStorage.getItem('bht_snooze_until') || '0', 10);
    return until > Date.now();
  };

  // ===== 8. Conditional reminders =====
  window.conditionalReminder = function (condition, msg) {
    if (typeof condition === 'function' && condition()) {
      if (typeof notify === 'function') notify(msg, 'info');
    }
  };

  // ===== 9. Followup reminder =====
  window.scheduleFollowup = function (studentId, days, msg) {
    const followups = JSON.parse(localStorage.getItem('bht_followups') || '[]');
    followups.push({
      id: Date.now(),
      sid: studentId,
      due: Date.now() + days * 86400000,
      msg: msg,
    });
    localStorage.setItem('bht_followups', JSON.stringify(followups));
    if (typeof toast === 'function') toast(`📌 מעקב מתוזמן בעוד ${days} ימים`, 'success');
  };

  // Check followups
  setInterval(() => {
    try {
      const followups = JSON.parse(localStorage.getItem('bht_followups') || '[]');
      const now = Date.now();
      const due = followups.filter(f => f.due <= now);
      due.forEach(f => {
        if (typeof notify === 'function') notify(`📌 מעקב: ${f.msg}`, 'warn');
      });
      const remaining = followups.filter(f => f.due > now);
      localStorage.setItem('bht_followups', JSON.stringify(remaining));
    } catch (_) {}
  }, 60 * 60 * 1000);

  // ===== 10. Notifications center button =====
  setTimeout(() => {
    if (document.getElementById('reminder-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'reminder-btn';
    btn.title = 'תזכורות + מעקבים';
    btn.style.cssText = 'position:fixed;bottom:380px;left:14px;width:42px;height:42px;border-radius:50%;background:#f59e0b;color:#fff;border:none;font-size:18px;cursor:pointer;z-index:9990;box-shadow:0 4px 8px rgba(0,0,0,0.2)';
    btn.innerHTML = '⏰';
    btn.onclick = () => openReminderDialog?.();
    document.body.appendChild(btn);
  }, 3500);

  console.warn('%c⏰ Pack-47 — Smart reminders: birthdays, overdue, idle, schedule, snooze, followups', 'color:#dc2626;font-weight:bold');
})();
