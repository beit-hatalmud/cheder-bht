// behavior-pack-20.js — Calendar Integration. 2026-05-24
(function () {
  'use strict';

  // ===== 1. ייצוא אירוע ל-Google Calendar =====
  window.toGoogleCalendar = function (event) {
    const title = event.title || 'אירוע בית התלמוד';
    const desc = event.desc || '';
    const start = event.start || new Date();
    const end = event.end || new Date(new Date(start).getTime() + 3600000);
    const fmt = d => new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(desc)}&dates=${fmt(start)}/${fmt(end)}`;
    window.open(url, '_blank');
  };

  // ===== 2. ICS download =====
  window.downloadICS = function (event) {
    const fmt = d => new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BHT//Cheder//HE
BEGIN:VEVENT
UID:${Date.now()}@cheder-bht
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(event.start)}
DTEND:${fmt(event.end || new Date(new Date(event.start).getTime() + 3600000))}
SUMMARY:${event.title || ''}
DESCRIPTION:${(event.desc || '').replace(/\n/g, '\\n')}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (event.title || 'event') + '.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== 3. ייצוא משימה ליומן =====
  window.taskToCalendar = function (task) {
    toGoogleCalendar({
      title: `📋 ${task['כותרת']||''}`,
      desc: task['תיאור'] || '',
      start: task['תאריך_יעד'] || new Date(),
    });
  };

  // ===== 4. ייצוא אסיפה ליומן =====
  window.meetingToCalendar = function (meeting) {
    toGoogleCalendar({
      title: `🤝 אסיפה - ${meeting['שם תלמיד'] || meeting['נושא'] || ''}`,
      desc: meeting['סיכום'] || meeting['נושא'] || '',
      start: meeting['תאריך'] || new Date(),
    });
  };

  // ===== 5. תזכורת לאירוע קרוב =====
  setInterval(async () => {
    try {
      const r = await api('listTasks', []);
      const now = Date.now();
      const dayMs = 86400000;
      const upcoming = (r.data || []).filter(t => {
        if (t['סטטוס'] === 'הושלם') return false;
        if (!t['תאריך_יעד']) return false;
        const d = new Date(t['תאריך_יעד']).getTime();
        return d > now && d < now + dayMs;
      });
      upcoming.forEach(t => {
        const key = `reminded_${t['מזהה']}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
        if (typeof notify === 'function') notify(`⏰ משימה ביום הקרוב: ${t['כותרת']}`, 'warn');
      });
    } catch (_) {}
  }, 30 * 60 * 1000);

  // ===== 6. כפתור "הוסף ליומן" אוטומטי =====
  setInterval(() => {
    document.querySelectorAll('[data-task-id]:not([data-cal-btn])').forEach(card => {
      card.dataset.calBtn = '1';
      const id = card.dataset.taskId;
      const actions = card.querySelector('.d-flex.gap-2, .btn-group');
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-link p-0';
      btn.innerHTML = '📅';
      btn.title = 'הוסף ליומן Google';
      btn.setAttribute('aria-label', 'הוסף ליומן');
      btn.onclick = async (e) => {
        e.stopPropagation();
        const r = await api('listTasks', []);
        const task = (r.data || []).find(t => String(t['מזהה']) === String(id));
        if (task) taskToCalendar(task);
      };
      (actions || card).appendChild(btn);
    });
  }, 3000);

  // ===== 7. Mini calendar widget =====
  window.miniCalendar = function (containerId, year, month) {
    year = year || new Date().getFullYear();
    month = month != null ? month : new Date().getMonth();
    const container = document.getElementById(containerId);
    if (!container) return;
    const today = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = new Date(year, month).toLocaleDateString('he-IL', { month: 'long' });
    let html = `<div class="card p-2" style="direction:rtl">
      <div class="d-flex justify-content-between mb-2">
        <button class="btn btn-sm btn-link p-0" onclick="miniCalendar('${containerId}',${month===0?year-1:year},${(month+11)%12})">‹</button>
        <strong>${escHtml(monthName)} ${year}</strong>
        <button class="btn btn-sm btn-link p-0" onclick="miniCalendar('${containerId}',${month===11?year+1:year},${(month+1)%12})">›</button>
      </div>
      <table class="table table-sm mb-0" style="text-align:center;font-size:11px">
        <thead><tr><th>א</th><th>ב</th><th>ג</th><th>ד</th><th>ה</th><th>ו</th><th>ש</th></tr></thead><tbody>`;
    let day = 1;
    for (let r = 0; r < 6; r++) {
      html += '<tr>';
      for (let c = 0; c < 7; c++) {
        if ((r === 0 && c < firstDay) || day > daysInMonth) html += '<td></td>';
        else {
          const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
          html += `<td style="${isToday?'background:#3b82f6;color:#fff;border-radius:50%':''}">${day}</td>`;
          day++;
        }
      }
      html += '</tr>';
      if (day > daysInMonth) break;
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;
  };

  // ===== 8. אירועי היום (overview) =====
  window.todayEvents = async function () {
    const today = new Date().toISOString().slice(0,10);
    try {
      const [tk, mt, ev] = await Promise.all([api('listTasks', []), api('listMeetings', []), api('listBehavior', [])]);
      const tasks = (tk.data || []).filter(t => (t['תאריך_יעד']||'').startsWith(today));
      const meetings = (mt.data || []).filter(m => (m['תאריך']||'').startsWith(today));
      const events = (ev.data || []).filter(e => (e['תאריך']||'').startsWith(today));
      return { tasks, meetings, events, total: tasks.length + meetings.length + events.length };
    } catch (_) { return { tasks: [], meetings: [], events: [], total: 0 }; }
  };

  // ===== 9. סנכרון אירועים יומיים ל-Google Calendar =====
  window.syncToGoogleCalendar = async function () {
    const data = await todayEvents();
    if (!data.total) {
      if (typeof toast === 'function') toast('אין אירועים היום', 'info');
      return;
    }
    if (!confirm(`לפתוח ${data.total} פריטים של היום ב-Google Calendar?`)) return;
    data.meetings.forEach(meetingToCalendar);
    data.tasks.forEach(taskToCalendar);
  };

  // ===== 10. הצג היום באוברלייי =====
  setTimeout(async () => {
    if (sessionStorage.getItem('today_shown')) return;
    const data = await todayEvents();
    if (!data.total) return;
    sessionStorage.setItem('today_shown', '1');
    if (typeof notify === 'function') {
      notify(`📅 היום: ${data.tasks.length} משימות, ${data.meetings.length} אסיפות, ${data.events.length} אירועים`, 'info');
    }
  }, 5000);

  console.warn('%c📅 Pack-20 — Calendar: Google Calendar, ICS, reminders, mini-calendar', 'color:#16a34a;font-weight:bold');
})();
