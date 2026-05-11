// Monthly calendar with events + Hebrew calendar
let _calCurMonth = new Date();
let _calMode = 'gregorian'; // gregorian | hebrew

function renderCalendar() {
  const html = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-calendar3"></i> לוח שנה</h3>
      <div class="d-flex gap-2">
        <div class="btn-group">
          <button class="btn btn-outline-secondary ${_calMode==='gregorian'?'active':''}" onclick="calSetMode('gregorian')">לועזי</button>
          <button class="btn btn-outline-secondary ${_calMode==='hebrew'?'active':''}" onclick="calSetMode('hebrew')">עברי</button>
        </div>
        <div class="btn-group">
          <button class="btn btn-outline-primary" onclick="calNav(-1)"><i class="bi bi-chevron-right"></i></button>
          <button class="btn btn-outline-primary" id="cal-title" onclick="calToday()"></button>
          <button class="btn btn-outline-primary" onclick="calNav(1)"><i class="bi bi-chevron-left"></i></button>
        </div>
      </div>
    </div>
    <div id="cal-parsha-banner"></div>
    <div id="cal-grid" class="card p-3"></div>
    <div class="row g-3 mt-1">
      <div class="col-md-6">
        <div class="card p-3 h-100">
          <h6><i class="bi bi-stars"></i> חגים ומועדים</h6>
          <div id="cal-holidays"></div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card p-3 h-100">
          <h6><i class="bi bi-clipboard-check"></i> אירועי התנהגות בחודש</h6>
          <div id="cal-list"></div>
        </div>
      </div>
    </div>`;
  document.getElementById('page-calendar').innerHTML = html;
  drawCalendar();
}

function calSetMode(mode) {
  _calMode = mode;
  renderCalendar();
}

function calNav(dir) {
  if (_calMode === 'hebrew' && typeof hebcal !== 'undefined' && hebcal.HDate) {
    try {
      const hd = new hebcal.HDate(_calCurMonth);
      const next = new hebcal.HDate(1, hd.getMonth(), hd.getFullYear()).onOrAfter(0);
      // Advance/recede by adding/subtracting days until month changes
      let candidate = _calCurMonth;
      for (let i = 0; i < 50; i++) {
        candidate = new Date(candidate);
        candidate.setDate(candidate.getDate() + (dir * 7));
        const nh = new hebcal.HDate(candidate);
        if (nh.getMonth() !== hd.getMonth() || nh.getFullYear() !== hd.getFullYear()) {
          _calCurMonth = candidate;
          drawCalendar();
          return;
        }
      }
    } catch {}
  }
  _calCurMonth = new Date(_calCurMonth.getFullYear(), _calCurMonth.getMonth() + dir, 1);
  drawCalendar();
}

function calToday() {
  _calCurMonth = new Date();
  drawCalendar();
}

// Hebrew month names
const HEB_MONTHS_HE = ['ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב'];

function getHebDayLetter(day) {
  // Render day-of-month in Hebrew letters (gematriya)
  if (typeof hebcal !== 'undefined' && hebcal.gematriya) {
    try { return hebcal.gematriya(day); } catch {}
  }
  // Fallback: simple
  return String(day);
}

function holidaysForDate(jsDate) {
  if (typeof hebcal === 'undefined' || !hebcal.HebrewCalendar) return [];
  try {
    const events = hebcal.HebrewCalendar.getHolidaysOnDate(new hebcal.HDate(jsDate), false) || [];
    return events.map(e => {
      try { return e.render('he'); }
      catch { return e.getDesc(); }
    });
  } catch { return []; }
}

function parshaForDate(jsDate) {
  if (typeof hebcal === 'undefined' || !hebcal.HDate || !hebcal.Sedra) return '';
  try {
    const hd = new hebcal.HDate(jsDate);
    // Find upcoming Shabbat parsha
    const sat = new Date(jsDate);
    sat.setDate(sat.getDate() + ((6 - sat.getDay()) % 7));
    const sedra = new hebcal.Sedra(hd.getFullYear(), false);
    const p = sedra.lookup(new hebcal.HDate(sat));
    if (p && p.parsha && p.parsha.length) return p.parsha.join(' ');
  } catch {}
  return '';
}

function buildGregorianGrid(year, month, byDay) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const today = new Date();
  const days = ['א','ב','ג','ד','ה','ו','ש'];
  let html = '<table class="table table-bordered mb-0" style="text-align:center;table-layout:fixed"><thead><tr>';
  days.forEach(d => html += `<th style="font-size:.85rem">${d}</th>`);
  html += '</tr></thead><tbody><tr>';
  for (let i = 0; i < startWeekday; i++) html += '<td style="background:#f9fafb"></td>';
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const wd = (startWeekday + d - 1) % 7;
    if (wd === 0 && d > 1) html += '</tr><tr>';
    const jsDate = new Date(year, month, d);
    const dayData = byDay[d];
    const evCount = dayData ? dayData.events.length : 0;
    const mtCount = dayData ? dayData.meetings.length : 0;
    const total = evCount + mtCount;
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const isShabbat = wd === 6;
    const holidays = holidaysForDate(jsDate);
    const hasHoliday = holidays.length > 0;
    const high = dayData && dayData.events.some(e => e['חומרה'] === 'גבוהה');
    let bg = isShabbat ? '#f0f9ff' : '';
    if (hasHoliday) bg = '#fff7ed';
    if (total > 0) bg = high ? '#fee2e2' : evCount > 3 ? '#fef3c7' : '#dbeafe';
    const border = isToday ? 'border:2px solid #0066cc' : '';
    let hebDay = '';
    try {
      if (typeof hebcal !== 'undefined' && hebcal.HDate) {
        const hd = new hebcal.HDate(jsDate);
        const monthName = HEB_MONTHS_HE[hd.getMonth() - 1] || '';
        hebDay = `<span class="small text-muted" style="font-size:.7rem">${getHebDayLetter(hd.getDate())}${d === 1 || hd.getDate() === 1 ? ' ' + monthName : ''}</span>`;
      }
    } catch {}
    const holidayBadge = hasHoliday ? `<div class="small" style="font-size:.65rem;color:#c2410c;line-height:1.1">${escHtml(holidays.join(', ').slice(0, 30))}</div>` : '';
    html += `<td style="height:90px;padding:4px;background:${bg};${border};cursor:${total?'pointer':'default'};vertical-align:top" ${total ? `onclick="calShowDay(${d})"` : ''}>
      <div class="d-flex justify-content-between align-items-start">
        <span class="${isToday ? 'fw-bold text-primary' : ''}">${d}</span>
        ${hebDay}
      </div>
      ${holidayBadge}
      ${evCount ? `<div class="small text-danger" style="font-size:.7rem">${evCount} אירועים</div>` : ''}
      ${mtCount ? `<div class="small text-success" style="font-size:.7rem">${mtCount} פגישות</div>` : ''}
    </td>`;
  }
  const totalCells = startWeekday + lastDay.getDate();
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < trailing; i++) html += '<td style="background:#f9fafb"></td>';
  html += '</tr></tbody></table>';
  return html;
}

function buildHebrewGrid(jsAnchor, byJsDateKey) {
  // Render a Hebrew month based on the HDate of the anchor
  if (typeof hebcal === 'undefined' || !hebcal.HDate) return '<p class="text-muted">לוח שנה עברי לא זמין (hebcal לא נטען)</p>';
  const today = new Date();
  const anchorHd = new hebcal.HDate(jsAnchor);
  const hYear = anchorHd.getFullYear();
  const hMonth = anchorHd.getMonth();
  // First day of Hebrew month
  const first = new hebcal.HDate(1, hMonth, hYear);
  const firstJs = first.greg();
  const startWeekday = firstJs.getDay();
  // Length of Hebrew month
  const monthLen = first.daysInMonth();
  const days = ['א','ב','ג','ד','ה','ו','ש'];
  const monthName = HEB_MONTHS_HE[hMonth - 1] || '';
  let html = `<table class="table table-bordered mb-0" style="text-align:center;table-layout:fixed"><thead><tr>`;
  days.forEach(d => html += `<th style="font-size:.85rem">${d}</th>`);
  html += '</tr></thead><tbody><tr>';
  for (let i = 0; i < startWeekday; i++) html += '<td style="background:#f9fafb"></td>';
  for (let d = 1; d <= monthLen; d++) {
    const wd = (startWeekday + d - 1) % 7;
    if (wd === 0 && d > 1) html += '</tr><tr>';
    const hd = new hebcal.HDate(d, hMonth, hYear);
    const jsDate = hd.greg();
    const key = jsDate.toISOString().slice(0,10);
    const dayData = byJsDateKey[key];
    const evCount = dayData ? dayData.events.length : 0;
    const mtCount = dayData ? dayData.meetings.length : 0;
    const total = evCount + mtCount;
    const isToday = jsDate.toDateString() === today.toDateString();
    const isShabbat = wd === 6;
    const holidays = holidaysForDate(jsDate);
    const hasHoliday = holidays.length > 0;
    const high = dayData && dayData.events.some(e => e['חומרה'] === 'גבוהה');
    let bg = isShabbat ? '#f0f9ff' : '';
    if (hasHoliday) bg = '#fff7ed';
    if (total > 0) bg = high ? '#fee2e2' : evCount > 3 ? '#fef3c7' : '#dbeafe';
    const border = isToday ? 'border:2px solid #0066cc' : '';
    const gregLabel = `<span class="small text-muted" style="font-size:.7rem">${jsDate.getDate()}/${jsDate.getMonth()+1}</span>`;
    const holidayBadge = hasHoliday ? `<div class="small" style="font-size:.65rem;color:#c2410c;line-height:1.1">${escHtml(holidays.join(', ').slice(0, 30))}</div>` : '';
    html += `<td style="height:90px;padding:4px;background:${bg};${border};cursor:${total?'pointer':'default'};vertical-align:top" ${total ? `onclick="calShowDay(${jsDate.getDate()}, ${jsDate.getMonth()}, ${jsDate.getFullYear()})"` : ''}>
      <div class="d-flex justify-content-between align-items-start">
        <span class="${isToday ? 'fw-bold text-primary' : ''}" style="font-size:1.1rem">${getHebDayLetter(d)}</span>
        ${gregLabel}
      </div>
      ${holidayBadge}
      ${evCount ? `<div class="small text-danger" style="font-size:.7rem">${evCount} אירועים</div>` : ''}
      ${mtCount ? `<div class="small text-success" style="font-size:.7rem">${mtCount} פגישות</div>` : ''}
    </td>`;
  }
  const totalCells = startWeekday + monthLen;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < trailing; i++) html += '<td style="background:#f9fafb"></td>';
  html += '</tr></tbody></table>';
  // Save current Hebrew month for nav
  window._calHebMonth = hMonth;
  window._calHebYear = hYear;
  window._calHebMonthName = monthName;
  return html;
}

function drawCalendar() {
  const data = getData();
  const events = data.behavior || [];
  const meetings = data.meetings || [];

  // Build byJsDateKey index (works for both modes)
  const byJsDateKey = {};
  events.forEach(e => {
    if (!e['תאריך']) return;
    const d = new Date(e['תאריך']);
    const key = d.toISOString().slice(0,10);
    byJsDateKey[key] = byJsDateKey[key] || { events: [], meetings: [] };
    byJsDateKey[key].events.push(e);
  });
  meetings.forEach(m => {
    if (!m['תאריך']) return;
    const d = new Date(m['תאריך']);
    const key = d.toISOString().slice(0,10);
    byJsDateKey[key] = byJsDateKey[key] || { events: [], meetings: [] };
    byJsDateKey[key].meetings.push(m);
  });

  let titleHtml = '';
  if (_calMode === 'hebrew' && typeof hebcal !== 'undefined' && hebcal.HDate) {
    const hd = new hebcal.HDate(_calCurMonth);
    const mn = HEB_MONTHS_HE[hd.getMonth() - 1] || '';
    titleHtml = `${mn} ${getHebDayLetter(hd.getFullYear()).replace(/^ה?/, '')}`;
  } else {
    titleHtml = _calCurMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  }
  document.getElementById('cal-title').textContent = titleHtml;

  // Parsha banner — show this week's parsha
  const parsha = parshaForDate(new Date());
  const todayHd = (typeof hebcal !== 'undefined' && hebcal.HDate) ? new hebcal.HDate(new Date()).renderGematriya('he') : '';
  document.getElementById('cal-parsha-banner').innerHTML = parsha ?
    `<div class="alert alert-light border mb-2 d-flex justify-content-between align-items-center py-2">
      <span><i class="bi bi-book"></i> פרשת השבוע: <strong>${escHtml(parsha)}</strong></span>
      <span class="text-muted small">${escHtml(todayHd)}</span>
    </div>` : '';

  // Render grid based on mode
  let gridHtml = '';
  if (_calMode === 'hebrew') {
    gridHtml = buildHebrewGrid(_calCurMonth, byJsDateKey);
  } else {
    const year = _calCurMonth.getFullYear();
    const month = _calCurMonth.getMonth();
    const byDay = {};
    Object.keys(byJsDateKey).forEach(k => {
      const d = new Date(k);
      if (d.getFullYear() === year && d.getMonth() === month) {
        byDay[d.getDate()] = byJsDateKey[k];
      }
    });
    gridHtml = buildGregorianGrid(year, month, byDay);
  }
  document.getElementById('cal-grid').innerHTML = gridHtml;

  // Holidays panel
  drawHolidaysPanel();

  // Events list — month-relevant
  const listEl = document.getElementById('cal-list');
  let monthEvents;
  if (_calMode === 'hebrew' && typeof hebcal !== 'undefined' && hebcal.HDate) {
    const hd = new hebcal.HDate(_calCurMonth);
    const hMonth = hd.getMonth(); const hYear = hd.getFullYear();
    monthEvents = events.filter(e => {
      if (!e['תאריך']) return false;
      try {
        const ehd = new hebcal.HDate(new Date(e['תאריך']));
        return ehd.getMonth() === hMonth && ehd.getFullYear() === hYear;
      } catch { return false; }
    });
  } else {
    const year = _calCurMonth.getFullYear();
    const month = _calCurMonth.getMonth();
    monthEvents = events.filter(e => {
      if (!e['תאריך']) return false;
      const d = new Date(e['תאריך']);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }
  monthEvents.sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
  if (!monthEvents.length) {
    listEl.innerHTML = '<p class="text-muted small mb-0">אין אירועים בחודש</p>';
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

function drawHolidaysPanel() {
  const el = document.getElementById('cal-holidays');
  if (!el) return;
  if (typeof hebcal === 'undefined' || !hebcal.HebrewCalendar) {
    el.innerHTML = '<p class="text-muted small mb-0">לוח חגים לא זמין</p>';
    return;
  }
  try {
    // Determine date range
    let start, end;
    if (_calMode === 'hebrew' && hebcal.HDate) {
      const hd = new hebcal.HDate(_calCurMonth);
      const first = new hebcal.HDate(1, hd.getMonth(), hd.getFullYear());
      start = first.greg();
      const monthLen = first.daysInMonth();
      end = new hebcal.HDate(monthLen, hd.getMonth(), hd.getFullYear()).greg();
    } else {
      start = new Date(_calCurMonth.getFullYear(), _calCurMonth.getMonth(), 1);
      end = new Date(_calCurMonth.getFullYear(), _calCurMonth.getMonth() + 1, 0);
    }
    const events = hebcal.HebrewCalendar.calendar({
      start, end, sedrot: true, omer: false, candlelighting: false, locale: 'he',
    });
    if (!events.length) {
      el.innerHTML = '<p class="text-muted small mb-0">אין חגים החודש</p>';
      return;
    }
    el.innerHTML = events.map(ev => {
      let desc; try { desc = ev.render('he'); } catch { desc = ev.getDesc(); }
      const jsDate = ev.getDate().greg();
      const greg = jsDate.toLocaleDateString('he-IL');
      let hebDate = '';
      try { hebDate = ev.getDate().renderGematriya('he'); } catch {}
      const flagClass = (typeof ev.getFlags === 'function') ? ev.getFlags() : 0;
      const isMajor = ev.getCategories && ev.getCategories().includes('major');
      const color = isMajor ? 'text-danger' : 'text-warning';
      return `<div class="d-flex justify-content-between border-bottom py-1 small">
        <div><i class="bi bi-stars ${color}"></i> <strong>${escHtml(desc)}</strong></div>
        <div class="text-muted small">${escHtml(hebDate || greg)}</div>
      </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = '<p class="text-muted small mb-0">שגיאה בטעינת חגים</p>';
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
