// קידום קריאה — מסך נפרד, אבל הנתונים נשמרים באותה טבלת אירועים
// (כדי שיופיעו גם במעקב התנהגות הכללי, לפי בקשת יוסי 14.5.26).
// קטגוריה קבועה: "קידום קריאה".

const LESSONSKLEIN_CAT = 'שיעור פרטני';
let _lEvents = [], _lAllStudents = [];

async function renderLessonsKlein() {
  document.getElementById('page-lessonsKlein').innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-mortarboard text-primary"></i> שיעורים פרטניים</h3>
      <div class="d-flex gap-2 align-items-center">
        ${viewModeToggleHTML('lessonsKlein')}
        <button class="btn btn-success" onclick="addLessonsKleinModal()"><i class="bi bi-plus"></i> דיווח חדש</button>
      </div>
    </div>
    <div class="alert alert-info py-2 small mb-3">
      <i class="bi bi-info-circle"></i> דיווחי קריאה מופיעים גם במסך "מעקב התנהגות" הכללי, אבל זה המסך הייעודי לסינון מהיר.
    </div>
    <div class="row g-2 mb-3">
      <div class="col-md-6">
        <input id="l-fstudent" class="form-control" list="l-fstudent-list" placeholder="חפש תלמיד...">
        <datalist id="l-fstudent-list"></datalist>
      </div>
      <div class="col-md-3">
        <select id="l-frabbi" class="form-select"><option value="">כל הרבנים</option><option value="הרב יודלוב">הרב יודלוב</option><option value="הרב קליין">הרב קליין</option><option value="הרב ירושלמי">הרב ירושלמי</option><option value="הרב שניידר">הרב שניידר</option><option value="הרב סורוצקין">הרב סורוצקין</option><option value="הרב ארלנגר">הרב ארלנגר</option><option value="הרב פרידלנדר">הרב פרידלנדר</option><option value="הרב וינברג">הרב וינברג</option><option value="הרב קלצקין">הרב קלצקין</option><option value="הרב רוקמיל">הרב רוקמיל</option><option value="הרב הינמן">הרב הינמן</option><option value="הרב לינצנר">הרב לינצנר</option><option value="הרב יגר">הרב יגר</option><option value="הרב גולדברג">הרב גולדברג</option><option value="הרב גליק">הרב גליק</option><option value="הרב ולפסון">הרב ולפסון</option><option value="אחר">אחר</option></select>
      </div>
    </div>
    <div id="l-list"></div>`;
  const [stRes, evRes] = await Promise.all([
    api('listStudents', []),
    api('listBehavior', []),
  ]);
  _lAllStudents = stRes.data || [];
  _lEvents = (evRes.data || []).filter(e => (e['קטגוריה'] === LESSONSKLEIN_CAT || e['קטגוריה'] === 'שיעור פרטני קליין' || e['קטגוריה'] === 'שיעור פרטני יודלוב' || String(e['קטגוריה']||'').startsWith('שיעור פרטני')));
  _lEvents.sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
  activateViewMode('lessonsKlein');
  fillLessonsKleinFilters();
  drawLessonsKleinEvents(_lEvents);
  const stEl = document.getElementById('l-fstudent');
  stEl.oninput = applyLessonsKleinPageFilters;
  stEl.onchange = applyLessonsKleinPageFilters;
  const fr = document.getElementById('l-frabbi');
  if (fr) {
    fr.onchange = applyLessonsKleinPageFilters;
  }
}

function fillLessonsKleinFilters() {
  document.getElementById('l-fstudent-list').innerHTML = studentsDatalistOptions(_lAllStudents, false);
}

function applyLessonsKleinPageFilters() {
  const _rabbi = document.getElementById('l-frabbi')?.value || '';
  let f = _lEvents;
  const sLabel = document.getElementById('l-fstudent').value.trim();
  if (sLabel) {
    const stu = resolveStudent(sLabel, _lAllStudents);
    if (stu) {
      f = f.filter(e => String(e['תלמיד_מזהה']) === String(stu['מזהה']));
    } else {
      const lc = sLabel.toLowerCase();
      f = f.filter(e => String(e['שם תלמיד']||'').toLowerCase().includes(lc));
    }
  }
  if (_rabbi) {
    f = f.filter(e => {
      // Match by current 'רב' field, legacy 'דווח_עי', or infer from old category
      if ((e['רב']||'') === _rabbi) return true;
      if ((e['דווח_עי']||'') === _rabbi) return true;
      const cat = String(e['קטגוריה']||'');
      // Old categories: "שיעור פרטני קליין" → הרב קליין, "שיעור פרטני יודלוב" → הרב יודלוב
      const rabbiName = _rabbi.replace('הרב ', '');
      if (cat.includes(rabbiName)) return true;
      return false;
    });
  }
  drawLessonsKleinEvents(f);
}

function drawLessonsKleinEvents(list) {
  const el = document.getElementById('l-list');
  if (!list.length) {
    el.innerHTML = '<div class="text-center py-5 text-muted"><i class="bi bi-mortarboard fs-1"></i><p class="mt-2">אין דיווחי שיעור פרטני</p><p class="small">לחץ "דיווח חדש" כדי להתחיל</p></div>';
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
        <div><span class="badge bg-info text-light">שיעור פרטני</span> ${e['רב'] ? `<span class="badge bg-primary">${escHtml(e['רב'])}</span>` : ''} <strong class="mx-2">${escHtml(e['שם תלמיד']||'')}</strong></div>
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

function addLessonsKleinModal() {
  const html = `<div class="modal fade" id="addLessonsKleinModal"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5>דיווח קידום קריאה</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <div class="mb-3"><label class="form-label">תלמיד</label>
        <input id="nr-student" class="form-control" list="nr-student-list" placeholder="הקלד שם תלמיד..." autocomplete="off">
        <datalist id="nr-student-list">${studentsDatalistOptions(_lAllStudents, true)}</datalist>
      </div>
      <div class="mb-2"><label class="form-label">רב</label>
        ${window.rabbiDropdownHTML ? window.rabbiDropdownHTML('lessons', '', 'nr') : '<input id="nr-rabbi" class="form-control">'}
      </div>
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
  const typedLabel = document.getElementById('nr-student').value.trim();
  const stu = resolveStudent(typedLabel, _lAllStudents);
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
    'קטגוריה': LESSONSKLEIN_CAT,
    'תיאור': desc,
    'חומרה': 'נמוכה',
    'תאריך': now.toISOString(),
    'תאריך_עברי': info.hdate,
    'פרשה': info.parsha,
    'דווח_עי': reporter,
    'רב': document.getElementById('nr-rabbi')?.value || (typeof currentRabbi==='function'?currentRabbi():''),
  };
  const r = await api('addBehavior', [obj]);
  if (r && !r.ok) return alert(r.error || 'שגיאה בשמירה');
  hideModal('addLessonsKleinModal');
  renderLessonsKlein();
  if (typeof loadStats === 'function') loadStats();
}

window.addLessonsKleinModal = addLessonsKleinModal;
window.saveLessonsKlein = saveLessonsKlein;
