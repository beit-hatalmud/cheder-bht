// Monthly calendar with events
let _calCurMonth = new Date();

function renderCalendar() {
  const html = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-calendar3"></i> לוח שנה</h3>
      <div class="btn-group">
        <button class="btn btn-outline-primary" onclick="calNav(-1)"><i class="bi bi-chevron-right"></i></button>
        <button class="btn btn-outline-primary" id="cal-title" onclick="calToday()"></button>
        <button class="btn btn-outline-primary" onclick="calNav(1)"><i class="bi bi-chevron-left"></i></button>
      </div>
    </div>
    <div id="cal-grid" class="card p-3"></div>
    <div class="card p-3 mt-3">
      <h6>אירועים בחודש</h6>
      <div id="cal-list"></div>
    </div>`;
  document.getElementById('page-calendar').innerHTML = html;
  drawCalendar();
}

function calNav(dir) {
  _calCurMonth = new Date(_calCurMonth.getFullYear(), _calCurMonth.getMonth() + dir, 1);
  drawCalendar();
}

function calToday() {
  _calCurMonth = new Date();
  drawCalendar();
}

function drawCalendar() {
  const data = getData();
  const events = data.behavior || [];
  const meetings = data.meetings || [];
  const year = _calCurMonth.getFullYear();
  const month = _calCurMonth.getMonth();

  const monthName = _calCurMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  document.getElementById('cal-title').textContent = monthName;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 0 = Sunday

  // Aggregate by day
  const byDay = {};
  events.forEach(e => {
    if (!e['תאריך']) return;
    const d = new Date(e['תאריך']);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      byDay[key] = byDay[key] || { events: [], meetings: [] };
      byDay[key].events.push(e);
    }
  });
  meetings.forEach(m => {
    if (!m['תאריך']) return;
    const d = new Date(m['תאריך']);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      byDay[key] = byDay[key] || { events: [], meetings: [] };
      byDay[key].meetings.push(m);
    }
  });

  const days = ['א','ב','ג','ד','ה','ו','ש'];
  let html = '<table class="table table-bordered mb-0" style="text-align:center"><thead><tr>';
  days.forEach(d => html += `<th>${d}</th>`);
  html += '</tr></thead><tbody><tr>';
  for (let i = 0; i < startWeekday; i++) html += '<td style="background:#f9fafb"></td>';
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const wd = (startWeekday + d - 1) % 7;
    if (wd === 0 && d > 1) html += '</tr><tr>';
    const dayData = byDay[d];
    const evCount = dayData ? dayData.events.length : 0;
    const mtCount = dayData ? dayData.meetings.length : 0;
    const total = evCount + mtCount;
    const today = new Date();
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const high = dayData && dayData.events.some(e => e['חומרה'] === 'גבוהה');
    let bg = '';
    if (total > 0) bg = high ? '#fee2e2' : evCount > 3 ? '#fef3c7' : '#dbeafe';
    const border = isToday ? 'border:2px solid #0066cc' : '';
    html += `<td style="height:80px;padding:6px;background:${bg};${border};cursor:${total?'pointer':'default'}" ${total ? `onclick="calShowDay(${d})"` : ''}>
      <div class="${isToday ? 'fw-bold text-primary' : ''}">${d}</div>
      ${evCount ? `<div class="small text-danger">${evCount} אירועים</div>` : ''}
      ${mtCount ? `<div class="small text-success">${mtCount} פגישות</div>` : ''}
    </td>`;
  }
  // Fill end of last week
  const totalCells = startWeekday + lastDay.getDate();
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < trailing; i++) html += '<td style="background:#f9fafb"></td>';
  html += '</tr></tbody></table>';
  document.getElementById('cal-grid').innerHTML = html;

  // Side list
  const listEl = document.getElementById('cal-list');
  const monthEvents = events.filter(e => {
    if (!e['תאריך']) return false;
    const d = new Date(e['תאריך']);
    return d.getFullYear() === year && d.getMonth() === month;
  }).sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
  if (!monthEvents.length) {
    listEl.innerHTML = '<p class="text-muted small mb-0">אין אירועים החודש</p>';
  } else {
    listEl.innerHTML = monthEvents.slice(0, 30).map(e => {
      const dt = new Date(e['תאריך']).toLocaleDateString('he-IL');
      const sev = e['חומרה']==='גבוהה'?'text-danger':e['חומרה']==='נמוכה'?'text-success':'text-warning';
      return `<div class="d-flex justify-content-between border-bottom py-1 small">
        <div><i class="bi bi-circle-fill ${sev}" style="font-size:.5rem"></i> <strong>${escHtml(e['שם תלמיד']||'')}</strong> · ${escHtml(e['קטגוריה']||'')}</div>
        <div class="text-muted">${escHtml(dt)}</div>
      </div>`;
    }).join('');
  }
}

function calShowDay(day) {
  const data = getData();
  const year = _calCurMonth.getFullYear();
  const month = _calCurMonth.getMonth();
  const events = (data.behavior||[]).filter(e => {
    if (!e['תאריך']) return false;
    const d = new Date(e['תאריך']);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });
  const meetings = (data.meetings||[]).filter(m => {
    if (!m['תאריך']) return false;
    const d = new Date(m['תאריך']);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });
  const dateStr = new Date(year, month, day).toLocaleDateString('he-IL');
  let body = '';
  if (events.length) {
    body += '<h6>אירועי התנהגות</h6>';
    events.forEach(e => {
      const sev = e['חומרה']==='גבוהה'?'severity-high':e['חומרה']==='נמוכה'?'severity-low':'severity-mid';
      body += `<div class="card p-2 mb-2 ${sev}">
        <div class="d-flex justify-content-between"><strong>${escHtml(e['שם תלמיד']||'')}</strong><span class="cat-badge">${escHtml(e['קטגוריה']||'')}</span></div>
        <div class="small mt-1">${escHtml(e['תיאור']||'')}</div>
      </div>`;
    });
  }
  if (meetings.length) {
    body += '<h6 class="mt-3">אסיפות הורים</h6>';
    meetings.forEach(m => {
      const stu = (data.students||[]).find(s => String(s['מזהה']) === String(m['תלמיד_מזהה']));
      const name = stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}` : '?';
      body += `<div class="card p-2 mb-2 border-success">
        <strong>${escHtml(name)}</strong> · ${escHtml(m['נושא']||'')}
        <div class="small mt-1">${escHtml(m['סיכום']||'')}</div>
      </div>`;
    });
  }
  if (!body) body = '<p>אין נתונים ליום זה</p>';
  const html = `<div class="modal fade" id="cal-day-modal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content">
    <div class="modal-header"><h5>${escHtml(dateStr)}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">${body}</div>
  </div></div></div>`;
  const old = document.getElementById('cal-day-modal'); if (old) old.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  new bootstrap.Modal(document.getElementById('cal-day-modal')).show();
}
