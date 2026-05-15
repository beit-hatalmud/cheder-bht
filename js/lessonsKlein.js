// קידום קריאה — מסך נפרד, אבל הנתונים נשמרים באותה טבלת אירועים
// (כדי שיופיעו גם במעקב התנהגות הכללי, לפי בקשת יוסי 14.5.26).
// קטגוריה קבועה: "קידום קריאה".

const LESSONSKLEIN_CAT = 'שיעור פרטני קליין';
let _lvents = [], _lllStudents = [];

async function renderLessonsKlein() {
  document.getElementById('page-lessonsKlein').innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3><i class="bi bi-mortarboard text-primary"></i> שיעור פרטני קליין</h3>
      <button class="btn btn-success" onclick="addLessonsKleinModal()"><i class="bi bi-plus"></i> דיווח חדש</button>
    </div>
    <div class="alert alert-info py-2 small mb-3">
      <i class="bi bi-info-circle"></i> דיווחי קריאה מופיעים גם במסך "מעקב התנהגות" הכללי, אבל זה המסך הייעודי לסינון מהיר.
    </div>
    <div class="row g-2 mb-3">
      <div class="col-md-6"><select id="l-fstudent" class="form-select"><option value="">כל התלמידים</option></select></div>
    </div>
    <div id="l-list"></div>`;
  const [stRes, evRes] = await Promise.all([
    api('listStudents', []),
    api('listBehavior', []),
  ]);
  _lllStudents = stRes.data || [];
  _lvents = (evRes.data || []).filter(e => e['קטגוריה'] === LESSONSKLEIN_CAT);
  _lvents.sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
  fillLessonsKleinFilters();
  drawLessonsKleinEvents(_lvents);
  document.getElementById('r-fstudent').onchange = applyLessonsKleinFilters;
}

function fillLessonsKleinFilters() {
  const stSel = document.getElementById('r-fstudent');
  _lllStudents.forEach(s => {
    const fn = (s['שם פרטי']||'') + ' ' + (s['שם משפחה']||'');
    stSel.innerHTML += `<option value="${escHtml(s['מזהה'])}">${escHtml(fn)}</option>`;
  });
}

function applyLessonsKleinFilters() {
  let f = _lvents;
  const s = document.getElementById('r-fstudent').value;
  if (s) f = f.filter(e => String(e['תלמיד_מזהה']) === s);
  drawLessonsKleinEvents(f);
}

function drawLessonsKleinEvents(list) {
  const el = document.getElementById('r-list');
  if (!list.length) {
    el.innerHTML = '<div class="text-center py-5 text-muted"><i class="bi bi-book fs-1"></i><p>אין דיווחי קריאה</p></div>';
    return;
  }
  el.innerHTML = list.map(e => {
    const date = e['תאריך'] ? formatGreg(e['תאריך']) : '';
    let hdate = e['תאריך_עברי'] || '';
    let parsha = e['פרשה'] || '';
    if ((!hdate || !parsha) && e['תאריך']) {
      const info = (typeof getHebrewInfo === 'function') ? getHebrewInfo(new Date(e['תאריך'])) : {hdate:'',parsha:''};
      if (!hdate) hdate = info.hdate;
      if (!parsha) parsha = info.parsha;
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
          <small class="text-muted">${escHtml(date)}</small>
          <button class="btn btn-sm btn-outline-primary" onclick="editEvent(${e['מזהה']||0})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteEvent(${e['מזהה']||0})"><i class="bi bi-trash"></i></button>
        </div>
      </div>
      <p class="mb-0 mt-2">${escHtml(e['תיאור']||'')}</p>
      ${reporterBadge ? `<div class="mt-2">${reporterBadge}</div>` : ''}
    </div>`;
  }).join('');
}

function addLessonsKleinModal() {
  const html = `<div class="modal fade" id="addLessonsKleinModal"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5>דיווח קידום קריאה</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <div class="mb-3"><label class="form-label">תלמיד</label><select id="nr-student" class="form-select"><option value="">בחר</option>${_lllStudents.filter(s => (s['סטטוס']||'פעיל') !== 'סיים').map(s=>`<option value="${escHtml(s['מזהה'])}">${escHtml((s['שם פרטי']||'') + ' ' + (s['שם משפחה']||''))}</option>`).join('')}</select></div>
      <div class="mb-3"><label class="form-label">תיאור הקריאה</label><textarea id="nr-desc" class="form-control" rows="4" placeholder="פסוקים שנקראו, רמת ביצוע, הערות..."></textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button><button class="btn btn-primary" onclick="saveLessonsKlein(event)">שמור</button></div>
  </div></div></div>`;
  cleanupModal('addLessonsKleinModal');
  document.body.insertAdjacentHTML('beforeend', html);
  const modalEl = document.getElementById('addLessonsKleinModal');
  new bootstrap.Modal(modalEl).show();
  modalEl.addEventListener('hidden.bs.modal', () => cleanupModal('addLessonsKleinModal'), { once: true });
}

async function saveLessonsKlein(event) {
  const btn = event?.target?.closest('button');
  if (btn && btn.disabled) return;
  if (btn) {
    btn.disabled = true;
    setTimeout(() => { btn.disabled = false; }, 3000);
  }
  const sid = document.getElementById('nr-student').value;
  const stu = _lllStudents.find(s => String(s['מזהה']) === sid);
  const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
  const reporter = sess.username || 'admin';
  const desc = document.getElementById('nr-desc').value;
  if (!sid || !desc) return alert('כל השדות חובה');
  const now = new Date();
  const info = (typeof getHebrewInfo === 'function') ? getHebrewInfo(now) : {hdate:'',parsha:''};
  const obj = {
    'תלמיד_מזהה': sid,
    'שם תלמיד': stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}` : '',
    'קטגוריה': LESSONSKLEIN_CAT,
    'תיאור': desc,
    'חומרה': 'נמוכה',
    'תאריך': now.toISOString(),
    'תאריך_עברי': info.hdate,
    'פרשה': info.parsha,
    'דווח_עי': reporter,
  };
  const r = await api('addBehavior', [obj]);
  if (r && !r.ok) return alert(r.error || 'שגיאה בשמירה');
  hideModal('addLessonsKleinModal');
  renderLessonsKlein();
  if (typeof loadStats === 'function') loadStats();
}

window.addLessonsKleinModal = addLessonsKleinModal;
window.saveLessonsKlein = saveLessonsKlein;
