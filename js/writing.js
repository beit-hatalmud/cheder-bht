// קידום קריאה — מסך נפרד, אבל הנתונים נשמרים באותה טבלת אירועים
// (כדי שיופיעו גם במעקב התנהגות הכללי, לפי בקשת יוסי 14.5.26).
// קטגוריה קבועה: "קידום קריאה".

const WRITING_CAT = 'קידום כתיבה';
let _wEvents = [], _wAllStudents = [];

async function renderWriting() {
  document.getElementById('page-writing').innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-pencil-fill text-success"></i> קידום כתיבה</h3>
      <div class="d-flex gap-2 align-items-center">
        ${viewModeToggleHTML('writing')}
        <button class="btn btn-success" onclick="addWritingModal()"><i class="bi bi-plus"></i> דיווח חדש</button>
      </div>
    </div>
    <div class="alert alert-info py-2 small mb-3">
      <i class="bi bi-info-circle"></i> דיווחי קריאה מופיעים גם במסך "מעקב התנהגות" הכללי, אבל זה המסך הייעודי לסינון מהיר.
    </div>
    <div class="row g-2 mb-3">
      <div class="col-md-6">
        <input id="w-fstudent" class="form-control" list="w-fstudent-list" placeholder="חפש תלמיד...">
        <datalist id="w-fstudent-list"></datalist>
      </div>
    </div>
    <div id="w-list"></div>`;
  const [stRes, evRes] = await Promise.all([
    api('listStudents', []),
    api('listBehavior', []),
  ]);
  _wAllStudents = stRes.data || [];
  _wEvents = (evRes.data || []).filter(e => e['קטגוריה'] === WRITING_CAT);
  _wEvents.sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
  activateViewMode('writing');
  fillWritingFilters();
  drawWritingEvents(_wEvents);
  const stEl = document.getElementById('w-fstudent');
  stEl.oninput = applyReadingFilters;
  stEl.onchange = applyReadingFilters;
}

function fillWritingFilters() {
  document.getElementById('w-fstudent-list').innerHTML = studentsDatalistOptions(_wAllStudents, false);
}

function applyReadingFilters() {
  let f = _wEvents;
  const sLabel = document.getElementById('w-fstudent').value.trim();
  if (sLabel) {
    const stu = resolveStudent(sLabel, _wAllStudents);
    if (stu) {
      f = f.filter(e => String(e['תלמיד_מזהה']) === String(stu['מזהה']));
    } else {
      const lc = sLabel.toLowerCase();
      f = f.filter(e => String(e['שם תלמיד']||'').toLowerCase().includes(lc));
    }
  }
  drawWritingEvents(f);
}

function drawWritingEvents(list) {
  const el = document.getElementById('w-list');
  if (!list.length) {
    el.innerHTML = '<div class="text-center py-5 text-muted"><i class="bi bi-book fs-1"></i><p>אין דיווחי קריאה</p></div>';
    return;
  }
  el.innerHTML = list.map(e => {
    const date = e['תאריך'] ? formatGreg(e['תאריך']) : '';
    const rel = (typeof formatRelative === 'function' && e['תאריך']) ? formatRelative(e['תאריך']) : '';
    let hdate = e['תאריך_עברי'] || '';
    let parsha = parshaHebrew(e['פרשה']) || '';
    if ((!hdate || !parsha) && e['תאריך']) {
      const info = (typeof getHebrewInfo === 'function') ? getHebrewInfo(new Date(e['תאריך'])) : {hdate:'',parsha:''};
      if (!hdate) hdate = info.hdate;
      if (!parsha) parsha = parshaHebrew(info.parsha);
    }
    const reporter = e['דווח_עי'] || '';
    const reporterBadge = reporter ? `<small class="text-muted"><i class="bi bi-person-fill"></i> ${escHtml(reporter)}</small>` : '';
    const parshaBadge = parsha ? `<span class="badge bg-light text-dark border me-1">פר' ${escHtml(parsha)}</span>` : '';
    const hdateBadge = hdate ? `<span class="badge bg-light text-dark border">${escHtml(hdate)}</span>` : '';
    return `<div class="card p-3 mb-2 border-warning-subtle">
      <div class="d-flex justify-content-between flex-wrap gap-2">
        <div><span class="badge bg-warning text-dark">קידום קריאה</span> <strong class="mx-2">${escHtml(e['שם תלמיד']||'')}</strong></div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          ${parshaBadge}${hdateBadge}
          <small class="text-muted">${rel ? `<span class="badge bg-secondary-subtle text-secondary-emphasis border ms-1">${escHtml(rel)}</span>` : ''}${escHtml(date)}</small>
          <button class="btn btn-sm btn-outline-primary" onclick="editEvent(${e['מזהה']||0})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteEvent(${e['מזהה']||0})"><i class="bi bi-trash"></i></button>
        </div>
      </div>
      <p class="mb-0 mt-2">${escHtml(e['תיאור']||'')}</p>
      ${reporterBadge ? `<div class="mt-2">${reporterBadge}</div>` : ''}
    </div>`;
  }).join('');
}

function addWritingModal() {
  const html = `<div class="modal fade" id="addWritingModal"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5>דיווח קידום קריאה</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <div class="mb-3"><label class="form-label">תלמיד</label>
        <input id="nr-student" class="form-control" list="nr-student-list" placeholder="הקלד שם תלמיד..." autocomplete="off">
        <datalist id="nr-student-list">${studentsDatalistOptions(_wAllStudents, true)}</datalist>
      </div>
      <div class="mb-3"><label class="form-label">תיאור הקריאה</label><textarea id="nr-desc" class="form-control" rows="4" placeholder="פסוקים שנקראו, רמת ביצוע, הערות..."></textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button><button class="btn btn-primary" onclick="saveWriting(event)">שמור</button></div>
  </div></div></div>`;
  cleanupModal('addWritingModal');
  document.body.insertAdjacentHTML('beforeend', html);
  const modalEl = document.getElementById('addWritingModal');
  new bootstrap.Modal(modalEl).show();
  modalEl.addEventListener('hidden.bs.modal', () => cleanupModal('addWritingModal'), { once: true });
}

async function saveWriting(event) {
  const btn = event?.target?.closest('button');
  if (btn && btn.disabled) return;
  if (btn) {
    btn.disabled = true;
    setTimeout(() => { btn.disabled = false; }, 3000);
  }
  const typedLabel = document.getElementById('nr-student').value.trim();
  const stu = resolveStudent(typedLabel, _wAllStudents);
  if (typedLabel && !stu) return alert('לא נמצא תלמיד בשם זה. בחר מתוך הרשימה.');
  const sid = stu ? stu['מזהה'] : '';
  const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
  const reporter = sess.username || 'admin';
  const desc = document.getElementById('nr-desc').value;
  if (!sid || !desc) return alert('כל השדות חובה');
  const now = new Date();
  const info = (typeof getHebrewInfo === 'function') ? getHebrewInfo(now) : {hdate:'',parsha:''};
  const obj = {
    'תלמיד_מזהה': sid,
    'שם תלמיד': stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}` : '',
    'קטגוריה': WRITING_CAT,
    'תיאור': desc,
    'חומרה': 'נמוכה',
    'תאריך': now.toISOString(),
    'תאריך_עברי': info.hdate,
    'פרשה': info.parsha,
    'דווח_עי': reporter,
  };
  const r = await api('addBehavior', [obj]);
  if (r && !r.ok) return alert(r.error || 'שגיאה בשמירה');
  hideModal('addWritingModal');
  renderWriting();
  if (typeof loadStats === 'function') loadStats();
}

window.addWritingModal = addWritingModal;
window.saveWriting = saveWriting;
