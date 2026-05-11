// Students page
let _students = [];
let _statusFilter = 'active';

async function renderStudents() {
  const html = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-people"></i> רשימת תלמידים</h3>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="addStudentModal()"><i class="bi bi-plus"></i> תלמיד חדש</button>
        <button class="btn btn-outline-success" onclick="importStudentsCSV()"><i class="bi bi-upload"></i> ייבוא CSV</button>
        <button class="btn btn-outline-info" onclick="exportStudentsCSV()"><i class="bi bi-download"></i> ייצוא CSV</button>
      </div>
    </div>
    <div class="card p-3">
      <div class="row g-2 mb-3">
        <div class="col-md-8"><input id="s-search" class="form-control" placeholder="חיפוש תלמיד..."></div>
        <div class="col-md-4">
          <select id="s-status" class="form-select">
            <option value="active">פעילים</option>
            <option value="graduated">סיימו</option>
            <option value="all">הכל</option>
          </select>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr><th>מזהה</th><th>שם מלא</th><th>גיל</th><th>כיתה</th><th>טלפון אם</th><th>סטטוס</th><th>פעולות</th></tr>
          </thead>
          <tbody id="students-tbody"></tbody>
        </table>
      </div>
      <div id="s-empty" class="text-center py-5 d-none text-muted"><i class="bi bi-people fs-1"></i><p>אין תלמידים</p></div>
    </div>`;
  document.getElementById('page-students').innerHTML = html;

  const r = await api('listStudents', []);
  _students = r.data || [];
  document.getElementById('s-status').value = _statusFilter;
  document.getElementById('s-search').oninput = applyStudentFilters;
  document.getElementById('s-status').onchange = applyStudentFilters;
  applyStudentFilters();
}

function applyStudentFilters() {
  const q = (document.getElementById('s-search')?.value || '').toLowerCase();
  _statusFilter = document.getElementById('s-status')?.value || 'active';
  let list = _students;
  if (_statusFilter === 'active') list = list.filter(s => (s['סטטוס']||'פעיל') !== 'סיים');
  else if (_statusFilter === 'graduated') list = list.filter(s => s['סטטוס'] === 'סיים');
  if (q) list = list.filter(s => Object.values(s).some(v => String(v).toLowerCase().includes(q)));
  drawStudents(list);
}

function drawStudents(list) {
  const tbody = document.getElementById('students-tbody');
  if (!list.length) {
    tbody.innerHTML = '';
    document.getElementById('s-empty').classList.remove('d-none');
    return;
  }
  document.getElementById('s-empty').classList.add('d-none');
  tbody.innerHTML = list.map(s => {
    const fullName = (s['שם פרטי']||'') + ' ' + (s['שם משפחה']||'');
    const initials = fullName.trim().split(' ').map(w=>w[0]||'').join('').slice(0,2);
    const isGrad = s['סטטוס'] === 'סיים';
    const statusBadge = isGrad
      ? '<span class="badge bg-secondary">סיים</span>'
      : '<span class="badge bg-success">פעיל</span>';
    const promoteBtn = isGrad
      ? `<button class="btn btn-sm btn-outline-success me-1" onclick="reactivateStudent(${s['מזהה']})" title="החזר למוסד"><i class="bi bi-arrow-counterclockwise"></i></button>`
      : `<button class="btn btn-sm btn-outline-warning me-1" onclick="promoteStudent(${s['מזהה']})" title="העלה כיתה"><i class="bi bi-arrow-up"></i></button>
         <button class="btn btn-sm btn-outline-secondary me-1" onclick="deactivateStudent(${s['מזהה']})" title="הוצא מהמוסד"><i class="bi bi-box-arrow-right"></i></button>`;
    const grayed = isGrad ? 'style="opacity:.65"' : '';
    return `<tr ${grayed}>
      <td onclick="viewStudent(${s['מזהה']})" style="cursor:pointer">${escHtml(s['מזהה']||'')}</td>
      <td onclick="viewStudent(${s['מזהה']})" style="cursor:pointer"><span class="avatar">${escHtml(initials)}</span>${escHtml(fullName)}</td>
      <td onclick="viewStudent(${s['מזהה']})" style="cursor:pointer">${escHtml(s['גיל']||'')}</td>
      <td onclick="viewStudent(${s['מזהה']})" style="cursor:pointer">${escHtml(s['מחזור']||'')}</td>
      <td onclick="viewStudent(${s['מזהה']})" style="cursor:pointer">${escHtml(s['טלפון אם']||'')}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="btn btn-sm btn-outline-info me-1" onclick="viewStudent(${s['מזהה']})" title="צפייה"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editStudent(${s['מזהה']})" title="עריכה"><i class="bi bi-pencil"></i></button>
        ${promoteBtn}
        <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${s['מזהה']})" title="מחיקה"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

async function promoteStudent(id) {
  const data = getData();
  const stu = data.students.find(s => String(s['מזהה']) === String(id));
  if (!stu) return;
  if (!confirm(`להעלות את ${stu['שם פרטי']||''} ${stu['שם משפחה']||''} כיתה?`)) return;
  const r = await api('promoteStudent', [id]);
  if (!r.ok) { alert(r.error || 'שגיאה'); return; }
  const newClass = r.data.newClass;
  const status = r.data.status;
  if (typeof toast === 'function') toast(status === 'סיים' ? 'התלמיד סיים את המוסד' : `הועלה לכיתה ${newClass}`, 'success');
  renderStudents();
  loadStats();
}

async function deactivateStudent(id) {
  const data = getData();
  const stu = data.students.find(s => String(s['מזהה']) === String(id));
  if (!stu) return;
  if (!confirm(`להוציא את ${stu['שם פרטי']||''} ${stu['שם משפחה']||''} מהמוסד?\n(התלמיד לא יימחק, רק יסומן כסיים)`)) return;
  const r = await api('deactivateStudent', [id]);
  if (!r.ok) { alert(r.error || 'שגיאה'); return; }
  if (typeof toast === 'function') toast('התלמיד הוצא מהמוסד', 'success');
  renderStudents();
  loadStats();
}

async function reactivateStudent(id) {
  const r = await api('reactivateStudent', [id]);
  if (!r.ok) { alert(r.error || 'שגיאה'); return; }
  if (typeof toast === 'function') toast('התלמיד הוחזר למוסד', 'success');
  renderStudents();
  loadStats();
}

function uploadStudentPhoto(studentId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Resize to ~150px to keep storage small
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        const max = 200;
        const ratio = Math.min(max / img.width, max / img.height, 1);
        const w = img.width * ratio, h = img.height * ratio;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const r = await api('updateStudent', [{ 'מזהה': studentId, 'תמונה': dataUrl }]);
        if (r.ok) {
          notify('התמונה הועלתה', 'success');
          const old = document.getElementById('viewStuModal');
          if (old) bootstrap.Modal.getInstance(old).hide();
          setTimeout(() => viewStudent(studentId), 250);
        } else alert(r.error || 'שגיאה');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function getHebrewBirthday(s) {
  if (!s || !s['תאריך לידה'] || typeof hebcal === 'undefined') return '';
  try {
    const parts = String(s['תאריך לידה']).split(/[/\-]/);
    let d;
    if (parts[0].length === 4) {
      d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    } else {
      d = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
    }
    if (isNaN(d)) return '';
    return new hebcal.HDate(d).renderGematriya('he');
  } catch (e) { return ''; }
}

function getSortedActiveStudents() {
  return _students.filter(s => (s['סטטוס']||'פעיל') !== 'סיים').sort((a,b) =>
    String(a['מחזור']).localeCompare(String(b['מחזור'])) ||
    (a['שם משפחה']||'').localeCompare(b['שם משפחה']||'', 'he'));
}

function navigateStudent(currentId, dir) {
  const list = getSortedActiveStudents();
  const idx = list.findIndex(s => String(s['מזהה']) === String(currentId));
  if (idx < 0) return;
  const nextIdx = (idx + dir + list.length) % list.length;
  const old = document.getElementById('viewStuModal');
  if (old) bootstrap.Modal.getInstance(old).hide();
  setTimeout(() => viewStudent(list[nextIdx]['מזהה']), 250);
}

async function viewStudent(id) {
  const s = _students.find(x => String(x['מזהה']) === String(id));
  if (!s) return;
  const events = ((await api('listBehavior', [])).data || [])
    .filter(e => String(e['תלמיד_מזהה']) === String(id))
    .sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
  const fullName = (s['שם פרטי']||'') + ' ' + (s['שם משפחה']||'');
  const hebBd = getHebrewBirthday(s);
  const waButtons = (phone, name, parent) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g,'');
    if (!clean) return '';
    const intl = clean.startsWith('0') ? '972' + clean.slice(1) : clean;
    const msg = encodeURIComponent(`שלום, מבית התלמוד בנוגע ל${name.trim()}`);
    return `<a href="https://wa.me/${intl}?text=${msg}" target="_blank" class="btn btn-sm btn-success p-1 ms-1" title="WhatsApp ${parent}"><i class="bi bi-whatsapp"></i></a><a href="tel:${phone}" class="btn btn-sm btn-outline-primary p-1" title="חיוג ${parent}"><i class="bi bi-telephone"></i></a>`;
  };
  const eventsHtml = events.length ? events.map(e => {
    const sev = e['חומרה'] === 'גבוהה' ? 'severity-high' : e['חומרה'] === 'נמוכה' ? 'severity-low' : 'severity-mid';
    const dt = e['תאריך'] ? new Date(e['תאריך']).toLocaleDateString('he-IL') : '';
    let hdate = e['תאריך_עברי'] || '';
    let parsha = e['פרשה'] || '';
    if ((!hdate || !parsha) && e['תאריך'] && typeof getHebrewInfo === 'function') {
      const info = getHebrewInfo(new Date(e['תאריך']));
      if (!hdate) hdate = info.hdate;
      if (!parsha) parsha = info.parsha;
    }
    const parshaBadge = parsha ? `<span class="badge bg-light text-dark border me-1">פר' ${escHtml(parsha)}</span>` : '';
    const hdateBadge = hdate ? `<span class="badge bg-light text-dark border me-1">${escHtml(hdate)}</span>` : '';
    const reporter = e['דווח_עי'] || '';
    return `<div class="card p-2 mb-2 ${sev}">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-1">
        <div>
          <span class="cat-badge">${escHtml(e['קטגוריה']||'')}</span>
          ${parshaBadge}${hdateBadge}
        </div>
        <div class="d-flex align-items-center gap-1">
          <small class="text-muted">${escHtml(dt)}</small>
          <button class="btn btn-sm btn-outline-primary p-1" onclick="editEventInStudent(${e['מזהה']||0}, ${id})" title="עריכה"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger p-1" onclick="deleteEventInStudent(${e['מזהה']||0}, ${id})" title="מחיקה"><i class="bi bi-trash"></i></button>
        </div>
      </div>
      <p class="mb-0 mt-1 small">${escHtml(e['תיאור']||'')}</p>
      ${reporter ? `<div class="mt-1"><small class="text-muted"><i class="bi bi-person-fill"></i> ${escHtml(reporter)}</small></div>` : ''}
    </div>`;
  }).join('') : '<p class="text-muted">אין אירועים מתועדים</p>';

  const html = `<div class="modal fade" id="viewStuModal"><div class="modal-dialog modal-lg"><div class="modal-content">
    <div class="modal-header">
      <button class="btn btn-sm btn-outline-secondary p-1 ms-2" onclick="navigateStudent(${id}, -1)" title="הקודם (←)"><i class="bi bi-chevron-right"></i></button>
      <div class="d-flex align-items-center gap-2 flex-grow-1">
        ${s['תמונה'] ? `<img src="${escHtml(s['תמונה'])}" alt="" style="width:48px;height:48px;border-radius:50%;object-fit:cover;cursor:pointer" onclick="uploadStudentPhoto(${id})">` : `<span class="avatar bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width:48px;height:48px;cursor:pointer" onclick="uploadStudentPhoto(${id})" title="העלה תמונה">${escHtml(((s['שם פרטי']||' ')[0] + (s['שם משפחה']||' ')[0]).trim() || '?')}</span>`}
        <h5 class="mb-0"><i class="bi bi-person"></i> ${escHtml(fullName)}</h5>
      </div>
      <button class="btn btn-sm btn-outline-secondary p-1 me-2" onclick="navigateStudent(${id}, 1)" title="הבא (→)"><i class="bi bi-chevron-left"></i></button>
      <button class="btn-close ms-auto" data-bs-dismiss="modal"></button>
    </div>
    <div class="modal-body">
      <div class="row g-2 mb-3">
        <div class="col-md-3"><div class="card p-2 text-center"><strong>${escHtml(s['גיל']||'-')}</strong><div class="small text-muted">גיל</div></div></div>
        <div class="col-md-3"><div class="card p-2 text-center"><strong>${escHtml(s['מחזור']||'-')}</strong><div class="small text-muted">כיתה</div></div></div>
        <div class="col-md-3"><div class="card p-2 text-center"><strong>${events.length}</strong><div class="small text-muted">אירועים</div></div></div>
        <div class="col-md-3"><div class="card p-2 text-center"><strong>${events.filter(e=>e['חומרה']==='גבוהה').length}</strong><div class="small text-muted">חומרה גבוהה</div></div></div>
      </div>
      <h6>פרטים אישיים</h6>
      <table class="table table-sm">
        <tr><td><strong>תאריך לידה</strong></td><td>${escHtml(s['תאריך לידה']||'-')} ${hebBd ? `· <span class="text-muted">${escHtml(hebBd)}</span>` : ''}</td><td><strong>ת.ז.</strong></td><td>${escHtml(s['מספר זהות']||'-')}</td></tr>
        <tr><td><strong>שם אם</strong></td><td>${escHtml(s['שם אם']||'-')}</td><td><strong>טלפון אם</strong></td><td>${escHtml(s['טלפון אם']||'-')} ${waButtons(s['טלפון אם'], fullName, 'אמא')}</td></tr>
        <tr><td><strong>שם אב</strong></td><td>${escHtml(s['שם אב']||'-')}</td><td><strong>טלפון אב</strong></td><td>${escHtml(s['טלפון אב']||'-')} ${waButtons(s['טלפון אב'], fullName, 'אבא')}</td></tr>
        <tr><td><strong>כתובת</strong></td><td colspan="3">${escHtml(s['כתובת']||'-')}${s['עיר'] ? ', ' + escHtml(s['עיר']) : ''}</td></tr>
        ${s['הערות'] ? `<tr><td><strong>הערות</strong></td><td colspan="3">${escHtml(s['הערות'])}</td></tr>` : ''}
      </table>
      <div class="card p-3 mb-3">
        <h6><i class="bi bi-graph-up"></i> מגמת התנהגות (14 ימים)</h6>
        <canvas id="stu-trend-chart" style="max-height:120px"></canvas>
      </div>
      <ul class="nav nav-tabs mt-3" id="stu-tabs">
        <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#stu-tab-behavior">התנהגות (${events.length})</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#stu-tab-timeline">טיים-ליין</a></li>
      </ul>
      <div class="tab-content pt-2">
        <div class="tab-pane fade show active" id="stu-tab-behavior">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span></span>
            <button class="btn btn-sm btn-success" onclick="addEventForStudent(${id})"><i class="bi bi-plus"></i> אירוע חדש</button>
          </div>
          ${eventsHtml}
        </div>
        <div class="tab-pane fade" id="stu-tab-timeline">
          <div id="stu-timeline-content"><div class="text-center py-3 text-muted"><i class="bi bi-hourglass"></i> טוען...</div></div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline-warning" onclick="shareParentPortal(${id})"><i class="bi bi-link-45deg"></i> קישור להורים</button>
      <button class="btn btn-outline-info" onclick="emailParentSummary(${id})"><i class="bi bi-envelope"></i> מייל</button>
      <button class="btn btn-outline-success" onclick="printStudentReport(${id})"><i class="bi bi-printer"></i> הדפס</button>
      <button class="btn btn-outline-primary" onclick="bootstrap.Modal.getInstance(document.getElementById('viewStuModal')).hide(); editStudent(${id})"><i class="bi bi-pencil"></i> ערוך</button>
      <button class="btn btn-secondary" data-bs-dismiss="modal">סגור</button>
    </div>
  </div></div></div>`;
  const old = document.getElementById('viewStuModal'); if (old) old.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  const modalEl = document.getElementById('viewStuModal');
  new bootstrap.Modal(modalEl).show();
  // Trend chart for last 14 days
  setTimeout(() => drawStudentTrendChart(id, events), 200);
  // Lazy-load timeline when tab clicked
  const tlTab = modalEl.querySelector('a[href="#stu-tab-timeline"]');
  if (tlTab) tlTab.addEventListener('shown.bs.tab', () => drawStudentTimeline(id), { once: true });
  // Keyboard navigation
  const onKey = (e) => {
    if (e.target.matches('input,textarea,select')) return;
    if (e.key === 'ArrowRight') { navigateStudent(id, -1); }
    else if (e.key === 'ArrowLeft') { navigateStudent(id, 1); }
  };
  document.addEventListener('keydown', onKey);
  modalEl.addEventListener('hidden.bs.modal', () => document.removeEventListener('keydown', onKey), { once: true });
}

async function drawStudentTimeline(studentId) {
  const el = document.getElementById('stu-timeline-content');
  if (!el) return;
  const data = getData();
  const items = [];
  // Behavior
  (data.behavior||[]).filter(e => String(e['תלמיד_מזהה']) === String(studentId)).forEach(e => {
    items.push({
      date: e['תאריך'],
      type: 'התנהגות',
      icon: 'bi-clipboard-check',
      color: e['חומרה']==='גבוהה'?'danger':e['חומרה']==='נמוכה'?'success':'warning',
      title: e['קטגוריה'] || 'אירוע',
      body: e['תיאור'] || '',
      extra: e['דווח_עי'] ? `דווח ע"י ${e['דווח_עי']}` : '',
    });
  });
  // Tests
  (data.tests||[]).filter(t => String(t['תלמיד_מזהה']) === String(studentId)).forEach(t => {
    if (!t['תאריך']) return;
    const score = parseFloat(t['ציון']) || 0;
    items.push({
      date: t['תאריך'],
      type: 'מבחן',
      icon: 'bi-pencil-square',
      color: score >= 85 ? 'success' : score >= 70 ? 'warning' : 'danger',
      title: `${t['סוג']||''} · ${t['פרשה']||''}`,
      body: `ציון: ${score}`,
      extra: '',
    });
  });
  // Functioning
  (data.functioning||[]).filter(f => String(f['תלמיד_מזהה']) === String(studentId)).slice(0, 50).forEach(f => {
    items.push({
      date: f['תאריך'],
      type: 'תפקוד',
      icon: 'bi-bar-chart-line',
      color: 'info',
      title: `${f['קטגוריה']||''}: ${f['פרמטר']||''}`,
      body: `ציון: ${f['ציון']||'-'} (${f['תקופה']||''})`,
      extra: '',
    });
  });
  // Meetings
  (data.meetings||[]).filter(m => String(m['תלמיד_מזהה']) === String(studentId)).forEach(m => {
    items.push({
      date: m['תאריך'],
      type: 'אסיפה',
      icon: 'bi-people-fill',
      color: 'primary',
      title: m['נושא'] || 'אסיפת הורים',
      body: m['סיכום'] || '',
      extra: m['משתתפים'] ? `משתתפים: ${m['משתתפים']}` : '',
    });
  });
  // Attendance
  (data.attendance||[]).filter(a => String(a['תלמיד_מזהה']) === String(studentId)).slice(0, 50).forEach(a => {
    if (!a['תאריך']) return;
    items.push({
      date: a['תאריך'],
      type: 'נוכחות',
      icon: 'bi-check2-square',
      color: a['סטטוס']==='נוכח'?'success':a['סטטוס']==='איחור'?'info':'warning',
      title: a['סטטוס'] || '',
      body: '',
      extra: '',
    });
  });
  // Medication updates
  (data.medications||[]).filter(m => String(m['תלמיד_מזהה']) === String(studentId)).forEach(m => {
    items.push({
      date: m['תאריך_עדכון'],
      type: 'רפואי',
      icon: 'bi-capsule',
      color: 'secondary',
      title: m['תרופה'] || 'מעקב רפואי',
      body: m['מצב_כיום'] || m['שיחת_הורים'] || '',
      extra: '',
    });
  });

  items.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
  if (!items.length) {
    el.innerHTML = '<p class="text-muted text-center py-3">אין נתונים בטיים-ליין</p>';
    return;
  }
  el.innerHTML = `<div class="timeline">${items.slice(0, 100).map(item => {
    const dt = item.date ? new Date(item.date).toLocaleDateString('he-IL') : '?';
    return `<div class="d-flex gap-2 align-items-start py-2 border-bottom">
      <i class="bi ${item.icon} text-${item.color}" style="font-size:1.25rem;margin-top:.15rem"></i>
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-center">
          <strong>${escHtml(item.title)}</strong>
          <small class="text-muted">${escHtml(dt)} · ${escHtml(item.type)}</small>
        </div>
        ${item.body ? `<div class="small mt-1">${escHtml(item.body)}</div>` : ''}
        ${item.extra ? `<div class="small text-muted mt-1">${escHtml(item.extra)}</div>` : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

function drawStudentTrendChart(studentId, events) {
  const el = document.getElementById('stu-trend-chart');
  if (!el || typeof Chart === 'undefined') return;
  const labels = [], counts = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000);
    labels.push(d.toLocaleDateString('he-IL', {day:'numeric', month:'numeric'}));
    counts.push(events.filter(e => {
      const ed = new Date(e['תאריך']);
      return ed.toDateString() === d.toDateString();
    }).length);
  }
  if (window._stuChart) window._stuChart.destroy();
  window._stuChart = new Chart(el, {
    type: 'bar',
    data: { labels, datasets: [{ data: counts, backgroundColor: '#0066cc' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

function editStudent(id) {
  const s = _students.find(x => String(x['מזהה']) === String(id));
  if (!s) return;
  addStudentModal();
  const modalEl = document.getElementById('addStudentModal');
  const populate = () => {
    document.getElementById('ns-fname').value = s['שם פרטי']||'';
    document.getElementById('ns-lname').value = s['שם משפחה']||'';
    document.getElementById('ns-age').value = s['גיל']||'';
    const cycleSelect = document.getElementById('ns-cycle');
    const cur = s['מחזור']||'';
    if (cur && cycleSelect && !cycleSelect.querySelector(`option[value="${CSS.escape(cur)}"]`)) {
      const opt = document.createElement('option');
      opt.value = cur; opt.textContent = cur + ' (לא ברשימה)';
      cycleSelect.appendChild(opt);
    }
    if (cycleSelect) cycleSelect.value = cur;
    document.getElementById('ns-mname').value = s['שם אם']||'';
    document.getElementById('ns-mphone').value = s['טלפון אם']||'';
    document.getElementById('ns-fname2').value = s['שם אב']||'';
    document.getElementById('ns-fphone').value = s['טלפון אב']||'';
    document.getElementById('ns-addr').value = s['כתובת']||'';
    modalEl.dataset.editId = id;
    const headerH5 = modalEl.querySelector('.modal-header h5');
    if (headerH5) headerH5.innerHTML = '<i class="bi bi-pencil"></i> עריכת תלמיד';
  };
  modalEl.addEventListener('shown.bs.modal', populate, { once: true });
}

async function deleteStudent(id) {
  if (!confirm('בטוח למחוק את התלמיד?')) return;
  await api('deleteStudent', [id]);
  renderStudents();
  loadStats();
}

async function addEventForStudent(studentId, existingEvent) {
  const s = _students.find(x => String(x['מזהה']) === String(studentId));
  if (!s) return;
  const fullName = (s['שם פרטי']||'') + ' ' + (s['שם משפחה']||'');
  const cats = ((await api('listCategories', [])).data || []);
  const e = existingEvent || {};
  const html = `<div class="modal fade" id="stu-ev-modal" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5><i class="bi bi-clipboard-check"></i> ${existingEvent ? 'עריכת' : 'אירוע חדש —'} ${escHtml(fullName)}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <div class="mb-2"><label class="form-label">קטגוריה</label>
        <select id="sev-cat" class="form-select">
          ${cats.map(c => `<option ${c['קטגוריה']===e['קטגוריה']?'selected':''}>${escHtml(c['קטגוריה'])}</option>`).join('')}
        </select>
      </div>
      <div class="mb-2">
        <label class="form-label">תבניות מהירות</label>
        <div class="d-flex flex-wrap gap-1">
          ${[
            ['איחור לתפילה','התנהגות','נמוכה'],
            ['דיבור בתפילה','תפילה','בינונית'],
            ['שיחה עם הורים','דיבור עם הורים','בינונית'],
            ['התנהגות מצוינת','חינוך','נמוכה'],
            ['קושי לימודי','לימודים','בינונית'],
            ['אירוע חמור','התנהגות','גבוהה'],
          ].map(([txt,cat,sev]) => `<button type="button" class="btn btn-sm btn-outline-secondary" onclick="applyQuickTemplate('${txt}','${cat}','${sev}')">${txt}</button>`).join('')}
        </div>
      </div>
      <div class="mb-2"><label class="form-label">תיאור</label><textarea id="sev-desc" class="form-control" rows="4">${escHtml(e['תיאור']||'')}</textarea></div>
      <div class="mb-2"><label class="form-label">חומרה</label>
        <select id="sev-sev" class="form-select">
          <option ${e['חומרה']==='נמוכה'?'selected':''}>נמוכה</option>
          <option ${(!e['חומרה']||e['חומרה']==='בינונית')?'selected':''}>בינונית</option>
          <option ${e['חומרה']==='גבוהה'?'selected':''}>גבוהה</option>
        </select>
      </div>
      <div class="mb-2"><label class="form-label">שיעור (אופציונלי)</label><input id="sev-lesson" class="form-control" value="${escHtml(e['שיעור']||'')}"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button>
      <button class="btn btn-primary" onclick="saveEventForStudent(${studentId}, ${existingEvent ? e['מזהה'] : 'null'})"><i class="bi bi-check"></i> שמור</button>
    </div>
  </div></div></div>`;
  const old = document.getElementById('stu-ev-modal');
  if (old) old.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  const m = new bootstrap.Modal(document.getElementById('stu-ev-modal'));
  m.show();
  document.getElementById('stu-ev-modal').addEventListener('hidden.bs.modal', ev => ev.target.remove());
}

async function editEventInStudent(eventId, studentId) {
  const events = (await api('listBehavior', [])).data || [];
  const ev = events.find(e => String(e['מזהה']) === String(eventId));
  if (!ev) return alert('האירוע לא נמצא');
  addEventForStudent(studentId, ev);
}

async function deleteEventInStudent(eventId, studentId) {
  if (!confirm('בטוח למחוק את האירוע?')) return;
  const r = await api('deleteBehavior', [eventId]);
  if (!r.ok) return alert(r.error || 'שגיאה');
  if (typeof toast === 'function') toast('האירוע נמחק', 'success');
  // Refresh the student card modal
  const old = document.getElementById('viewStuModal');
  if (old) bootstrap.Modal.getInstance(old).hide();
  setTimeout(() => viewStudent(studentId), 250);
  loadStats();
}

function applyQuickTemplate(text, cat, sev) {
  const desc = document.getElementById('sev-desc');
  if (desc) {
    if (desc.value.trim()) desc.value = desc.value + '\n' + text;
    else desc.value = text;
  }
  const catSel = document.getElementById('sev-cat');
  if (catSel) {
    for (const opt of catSel.options) {
      if (opt.value === cat || opt.textContent === cat) { catSel.value = opt.value; break; }
    }
  }
  const sevSel = document.getElementById('sev-sev');
  if (sevSel) sevSel.value = sev;
}

async function saveEventForStudent(studentId, editId) {
  const s = _students.find(x => String(x['מזהה']) === String(studentId));
  if (!s) return;
  const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
  const reporter = sess.username || 'admin';
  const obj = {
    'תלמיד_מזהה': studentId,
    'שם תלמיד': (s['שם פרטי']||'') + ' ' + (s['שם משפחה']||''),
    'קטגוריה': document.getElementById('sev-cat').value,
    'תיאור': document.getElementById('sev-desc').value.trim(),
    'חומרה': document.getElementById('sev-sev').value,
    'שיעור': document.getElementById('sev-lesson').value.trim(),
  };
  if (!obj['קטגוריה'] || !obj['תיאור']) return alert('קטגוריה ותיאור חובה');
  if (editId) {
    obj['מזהה'] = parseInt(editId);
    // Preserve original date & hebrew info
    const events = (await api('listBehavior', [])).data || [];
    const orig = events.find(e => String(e['מזהה']) === String(editId));
    if (orig) {
      if (orig['תאריך']) obj['תאריך'] = orig['תאריך'];
      if (orig['תאריך_עברי']) obj['תאריך_עברי'] = orig['תאריך_עברי'];
      if (orig['פרשה']) obj['פרשה'] = orig['פרשה'];
    }
    const r = await api('updateBehavior', [obj]);
    if (!r.ok) return alert(r.error || 'שגיאה');
  } else {
    const now = new Date();
    obj['תאריך'] = now.toISOString();
    obj['דווח_עי'] = reporter;
    if (typeof getHebrewInfo === 'function') {
      const info = getHebrewInfo(now);
      obj['תאריך_עברי'] = info.hdate;
      obj['פרשה'] = info.parsha;
    }
    const r = await api('addBehavior', [obj]);
    if (!r.ok) return alert(r.error || 'שגיאה');
  }
  bootstrap.Modal.getInstance(document.getElementById('stu-ev-modal')).hide();
  if (typeof toast === 'function') toast(editId ? 'האירוע עודכן' : 'האירוע נוסף', 'success');
  // Refresh the student card to show updated events
  const oldModal = document.getElementById('viewStuModal');
  if (oldModal) bootstrap.Modal.getInstance(oldModal).hide();
  setTimeout(() => viewStudent(studentId), 250);
  loadStats();
}

async function shareParentPortal(id) {
  const s = _students.find(x => String(x['מזהה']) === String(id));
  if (!s) return;
  const msg = String(id) + '|BHT2026';
  const buf = new TextEncoder().encode(msg);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  const token = hex.slice(0, 12);
  const base = location.origin + location.pathname.replace(/[^/]*$/, '');
  const url = `${base}parent.html?s=${id}&t=${token}`;
  const fullName = (s['שם פרטי']||'') + ' ' + (s['שם משפחה']||'');
  const phone = (s['טלפון אם']||'').replace(/\D/g,'');
  const waUrl = phone ? `https://wa.me/${phone.startsWith('0') ? '972'+phone.slice(1) : phone}?text=${encodeURIComponent(`שלום, קישור לפורטל ההורים של ${fullName}: ${url}`)}` : '';
  const html = `<div class="modal fade" id="parent-link-modal" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5>קישור פורטל הורים — ${escHtml(fullName)}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <p class="small text-muted">קישור פרטי לצפייה בלבד — ההורה יראה את הילד שלו בלבד.</p>
      <div class="input-group">
        <input id="pl-url" class="form-control" value="${escHtml(url)}" readonly>
        <button class="btn btn-primary" onclick="navigator.clipboard.writeText(document.getElementById('pl-url').value); notify('הקישור הועתק','success')"><i class="bi bi-clipboard"></i> העתק</button>
      </div>
      ${waUrl ? `<div class="mt-3"><a href="${waUrl}" target="_blank" class="btn btn-success w-100"><i class="bi bi-whatsapp"></i> שלח ב-WhatsApp להורה</a></div>` : ''}
    </div>
  </div></div></div>`;
  const old = document.getElementById('parent-link-modal'); if (old) old.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  new bootstrap.Modal(document.getElementById('parent-link-modal')).show();
}

async function emailParentSummary(id) {
  const s = _students.find(x => String(x['מזהה']) === String(id));
  if (!s) return;
  const events = ((await api('listBehavior', [])).data || [])
    .filter(e => String(e['תלמיד_מזהה']) === String(id))
    .sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
  const fullName = (s['שם פרטי']||'') + ' ' + (s['שם משפחה']||'');
  const motherEmail = prompt('מייל ההורה:', s['אימייל אם'] || s['מייל אם'] || '');
  if (!motherEmail) return;
  const subject = `סיכום התנהגות — ${fullName}`;
  const lines = [`שלום,`, ``, `הנה סיכום עדכני של ${fullName}:`, ``];
  lines.push(`גיל: ${s['גיל']||'-'} | מחזור: ${s['מחזור']||'-'}`);
  lines.push(`סך כל אירועים: ${events.length} | חומרה גבוהה: ${events.filter(e=>e['חומרה']==='גבוהה').length}`);
  lines.push(``);
  if (events.length) {
    lines.push('אירועים אחרונים:');
    events.slice(0, 10).forEach(e => {
      const dt = new Date(e['תאריך']).toLocaleDateString('he-IL');
      lines.push(`- ${dt} | ${e['קטגוריה']||''} (${e['חומרה']||'-'}): ${e['תיאור']||''}`);
    });
  }
  lines.push(``, 'בברכה,', 'בית התלמוד · בית שמש');
  const body = lines.join('\n');
  const mailto = `mailto:${motherEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

function exportStudentsCSV() {
  if (typeof XLSX === 'undefined') return _exportStudentsCSV();
  const cols = ['מזהה','שם פרטי','שם משפחה','גיל','תאריך לידה','מחזור','שם אם','טלפון אם','שם אב','טלפון אב','כתובת','עיר','מספר זהות','תז אב','תז אם','הערות'];
  const rows = _students.map(s => {
    const r = {};
    cols.forEach(c => r[c] = s[c] || '');
    return r;
  });
  const ws = XLSX.utils.json_to_sheet(rows, { header: cols });
  ws['!cols'] = cols.map(c => ({ wch: Math.max(10, c.length + 2) }));
  ws['!rtl'] = true;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'תלמידים');
  XLSX.writeFile(wb, `תלמידים_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function _exportStudentsCSV() {
  let csv = '﻿';
  const cols = ['מזהה','שם פרטי','שם משפחה','גיל','תאריך לידה','מחזור','שם אם','טלפון אם','שם אב','טלפון אב','כתובת','הערות'];
  csv += cols.join(',') + '\n';
  _students.forEach(s => {
    csv += cols.map(f => `"${(s[f]||'').toString().replace(/"/g,'""')}"`).join(',') + '\n';
  });
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `תלמידים_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

function importStudentsCSV() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.txt';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.replace(/^﻿/,'').split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return alert('הקובץ ריק או לא תקין');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,''));
    let added = 0;
    let maxId = _students.reduce((m,s) => Math.max(m, parseInt(s['מזהה'])||0), 0);
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const obj = {};
      headers.forEach((h,j) => obj[h] = values[j] || '');
      if (!obj['שם פרטי'] && !obj['שם משפחה']) continue;
      if (!obj['מזהה']) {
        maxId += 1;
        obj['מזהה'] = maxId;
      }
      const r = await api('addStudent', [obj]);
      if (r.ok) added++;
    }
    alert(`יובאו ${added} תלמידים`);
    renderStudents();
    loadStats();
  };
  input.click();
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function printStudentReport(id) {
  const s = _students.find(x => String(x['מזהה']) === String(id));
  if (!s) return;
  // Open print view (popup-blocker safe)
  const w = window.open('', '_blank');
  if (!w) { alert('הדפדפן חוסם חלונות פופ-אפ — אפשר חלון פופ-אפ לאתר ונסה שוב'); return; }
  Promise.resolve(api('listBehavior', [])).then(b => {
    const events = (b.data || []).filter(e => String(e['תלמיד_מזהה']) === String(id))
      .sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
    const fullName = (s['שם פרטי']||'') + ' ' + (s['שם משפחה']||'');
    const today = new Date().toLocaleDateString('he-IL');
    const titleSafe = String(fullName).replace(/[<>&"']/g,' ');
    const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>${titleSafe}</title>
<style>
@page{size:A4;margin:1.5cm}body{font-family:Arial,sans-serif;direction:rtl;color:#1f2937}
h1{color:#0066cc;border-bottom:3px solid #0066cc;padding-bottom:8pt}
table{width:100%;border-collapse:collapse;margin:10pt 0;font-size:10pt}
th{background:#f3f4f6;padding:6pt;border:1px solid #d1d5db;text-align:right}
td{padding:5pt;border:1px solid #e5e7eb}
.event{margin:6pt 0;padding:8pt;border-right:4px solid #0066cc;background:#f9fafb}
.event.high{border-color:#dc2626;background:#fef2f2}.event.mid{border-color:#f59e0b;background:#fffbeb}.event.low{border-color:#16a34a;background:#f0fdf4}
@media print{.no-print{display:none}}
</style></head><body>
<button class="no-print" onclick="window.print()" style="background:#0066cc;color:#fff;border:none;padding:10pt 20pt;border-radius:6px;cursor:pointer">🖨 הדפס</button>
<h1>${escHtml(fullName)}</h1>
<p>בית התלמוד · בית שמש · ${escHtml(today)}</p>
<table>
<tr><th>גיל</th><td>${escHtml(s['גיל']||'-')}</td><th>כיתה</th><td>${escHtml(s['מחזור']||'-')}</td></tr>
<tr><th>שם אם</th><td>${escHtml(s['שם אם']||'-')}</td><th>טלפון אם</th><td>${escHtml(s['טלפון אם']||'-')}</td></tr>
<tr><th>שם אב</th><td>${escHtml(s['שם אב']||'-')}</td><th>טלפון אב</th><td>${escHtml(s['טלפון אב']||'-')}</td></tr>
<tr><th>כתובת</th><td colspan="3">${escHtml(s['כתובת']||'-')}</td></tr>
</table>
<h2>היסטוריית התנהגות (${events.length})</h2>
${events.map(e => {
  const c = e['חומרה']==='גבוהה'?'high':e['חומרה']==='נמוכה'?'low':'mid';
  const rep = e['דווח_עי'] ? ` · דווח ע"י ${escHtml(e['דווח_עי'])}` : '';
  return `<div class="event ${c}"><strong>${escHtml(e['קטגוריה']||'')}</strong> · ${escHtml(new Date(e['תאריך']).toLocaleString('he-IL'))} · חומרה ${escHtml(e['חומרה']||'')}${rep}<br>${escHtml(e['תיאור']||'')}</div>`;
}).join('')}
<script>setTimeout(()=>window.print(), 500);</script>
</body></html>`;
    w.document.write(html);
    w.document.close();
  });
}

function addStudentModal() {
  const data = getData();
  const classOpts = (data.classes||[]).sort((a,b)=>parseInt(a['סדר'])-parseInt(b['סדר']))
    .map(c => `<option value="${c['שם']}">${c['שם']}</option>`).join('');
  const html = `
    <div class="modal fade" id="addStudentModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5><i class="bi bi-person-plus"></i> תלמיד חדש</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <div class="row g-2">
              <div class="col-6"><label class="form-label small">שם פרטי</label><input id="ns-fname" class="form-control"></div>
              <div class="col-6"><label class="form-label small">שם משפחה</label><input id="ns-lname" class="form-control"></div>
              <div class="col-4"><label class="form-label small">גיל</label><input id="ns-age" type="number" class="form-control"></div>
              <div class="col-8"><label class="form-label small">כיתה</label>
                <select id="ns-cycle" class="form-select">
                  <option value="">— בחר כיתה —</option>
                  ${classOpts}
                </select>
              </div>
              <div class="col-6"><label class="form-label small">שם אם</label><input id="ns-mname" class="form-control"></div>
              <div class="col-6"><label class="form-label small">טלפון אם</label><input id="ns-mphone" class="form-control"></div>
              <div class="col-6"><label class="form-label small">שם אב</label><input id="ns-fname2" class="form-control"></div>
              <div class="col-6"><label class="form-label small">טלפון אב</label><input id="ns-fphone" class="form-control"></div>
              <div class="col-12"><label class="form-label small">כתובת</label><input id="ns-addr" class="form-control"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button>
            <button class="btn btn-primary" onclick="saveStudent()"><i class="bi bi-check"></i> שמור</button>
          </div>
        </div>
      </div>
    </div>`;
  const old = document.getElementById('addStudentModal');
  if (old) old.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  new bootstrap.Modal(document.getElementById('addStudentModal')).show();
}

async function saveStudent() {
  const obj = {
    'שם פרטי': document.getElementById('ns-fname').value,
    'שם משפחה': document.getElementById('ns-lname').value,
    'גיל': document.getElementById('ns-age').value,
    'מחזור': document.getElementById('ns-cycle').value,
    'שם אם': document.getElementById('ns-mname').value,
    'טלפון אם': document.getElementById('ns-mphone').value,
    'שם אב': document.getElementById('ns-fname2').value,
    'טלפון אב': document.getElementById('ns-fphone').value,
    'כתובת': document.getElementById('ns-addr').value,
  };
  if (typeof validateStudent === 'function') {
    const v = validateStudent(obj);
    if (!v.ok) return alert('שגיאות validation:\n' + v.errors.join('\n'));
  } else if (!obj['שם פרטי']) return alert('שם פרטי חובה');
  const editId = document.getElementById('addStudentModal').dataset.editId;
  if (editId) {
    obj['מזהה'] = parseInt(editId);
    await api('updateStudent', [obj]);
  } else {
    await api('addStudent', [obj]);
  }
  bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
  renderStudents();
  loadStats();
}
