// מעקב כתיבה — הרב יודלוב
// מבנה Yudlov: שיעור (ב/ג), תאריך, עבודה_על, הערות, הארות
// נשמר באותה טבלת אירועים (מעקב_התנהגות) עם קטגוריה 'קידום כתיבה',
// כדי שיופיע גם במעקב הכללי.

const WRITING_CAT = 'קידום כתיבה';
let _wEvents = [], _wAllStudents = [];

async function renderWriting() {
  document.getElementById('page-writing').innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-pencil-fill text-success"></i> מעקב כתיבה — הרב יודלוב</h3>
      <div class="d-flex gap-2 align-items-center">
        ${viewModeToggleHTML('writing')}
        <button class="btn btn-success" onclick="addWritingModal()"><i class="bi bi-plus"></i> דיווח חדש</button>
      </div>
    </div>
    <div class="alert alert-info py-2 small mb-3">
      <i class="bi bi-info-circle"></i> דיווחי כתיבה מופיעים גם במסך "מעקב התנהגות" הכללי.
    </div>
    <div class="row g-2 mb-3">
      <div class="col-md-6">
        <input id="w-fstudent" class="form-control" list="w-fstudent-list" placeholder="חפש תלמיד...">
        <datalist id="w-fstudent-list"></datalist>
      </div>
      <div class="col-md-3">
        <select id="w-fshiur" class="form-select">
          <option value="">כל השיעורים</option>
          <option value="ב">שיעור ב</option>
          <option value="ג">שיעור ג</option>
        </select>
      </div>
    </div>
    <div id="w-list"></div>`;
  const [stRes, evRes] = await Promise.all([
    api('listStudents', []),
    api('listBehavior', []),
  ]);
  _wAllStudents = stRes.data || [];
  _wEvents = (evRes.data || []).filter(e => e['קטגוריה'] === WRITING_CAT);
  _wEvents.sort((a,b) => new Date(b['תאריך']||0) - new Date(a['תאריך']||0));
  activateViewMode('writing');
  fillWritingFilters();
  drawWritingEvents(_wEvents);
  document.getElementById('w-fstudent').oninput = applyWritingPageFilters;
  document.getElementById('w-fstudent').onchange = applyWritingPageFilters;
  document.getElementById('w-fshiur').onchange = applyWritingPageFilters;
}

function fillWritingFilters() {
  document.getElementById('w-fstudent-list').innerHTML = studentsDatalistOptions(_wAllStudents, false);
}

function applyWritingPageFilters() {
  let f = _wEvents;
  const sLabel = document.getElementById('w-fstudent').value.trim();
  const shiur = document.getElementById('w-fshiur').value;
  if (sLabel) {
    const stu = resolveStudent(sLabel, _wAllStudents);
    if (stu) {
      f = f.filter(e => String(e['תלמיד_מזהה']) === String(stu['מזהה']));
    } else {
      const lc = sLabel.toLowerCase();
      f = f.filter(e => String(e['שם תלמיד']||'').toLowerCase().includes(lc));
    }
  }
  if (shiur) f = f.filter(e => e['שיעור'] === shiur);
  drawWritingEvents(f);
}

function drawWritingEvents(list) {
  const el = document.getElementById('w-list');
  if (!list.length) {
    el.innerHTML = '<div class="text-center py-5 text-muted"><i class="bi bi-pencil-fill fs-1"></i><p class="mt-2">אין דיווחי כתיבה</p><p class="small">לחץ "דיווח חדש" כדי להתחיל</p></div>';
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
    const shiurBadge = e['שיעור'] ? `<span class="badge bg-info text-dark">שיעור ${escHtml(e['שיעור'])}</span>` : '';
    const legacy = e['תיאור'] && !e['עבודה_על'] && !e['הערות'] && !e['הארות'];
    return `<div class="card p-3 mb-2 border-success-subtle">
      <div class="d-flex justify-content-between flex-wrap gap-2 mb-2">
        <div>
          <span class="badge bg-success">כתיבה</span>
          ${shiurBadge}
          <strong class="mx-2">${escHtml(e['שם תלמיד']||'')}</strong>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          ${parshaBadge}${hdateBadge}
          <small class="text-muted">${rel ? `<span class="badge bg-secondary-subtle text-secondary-emphasis border ms-1">${escHtml(rel)}</span>` : ''}${escHtml(date)}</small>
          <button class="btn btn-sm btn-outline-primary" onclick="editEvent(${e['מזהה']||0})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteEvent(${e['מזהה']||0})"><i class="bi bi-trash"></i></button>
        </div>
      </div>
      ${e['עבודה_על'] ? `<div class="mb-2"><small class="text-muted fw-bold d-block"><i class="bi bi-bullseye me-1"></i>עבודה על:</small><div style="white-space:pre-wrap">${escHtml(e['עבודה_על'])}</div></div>` : ''}
      ${e['הערות'] ? `<div class="mb-2"><small class="text-muted fw-bold d-block"><i class="bi bi-chat-left-text me-1"></i>הערות:</small><div style="white-space:pre-wrap">${escHtml(e['הערות'])}</div></div>` : ''}
      ${e['הארות'] ? `<div class="mb-2 p-2 rounded" style="background:#f0fdf4;border-right:3px solid #16a34a"><small class="text-success fw-bold d-block"><i class="bi bi-lightbulb me-1"></i>הארות הרב:</small><div class="text-success-emphasis" style="white-space:pre-wrap">${escHtml(e['הארות'])}</div></div>` : ''}
      ${legacy ? `<p class="mb-0">${escHtml(e['תיאור'])}</p>` : ''}
      ${reporterBadge ? `<div class="mt-2">${reporterBadge}</div>` : ''}
    </div>`;
  }).join('');
}

function addWritingModal(prefill) {
  const today = new Date().toISOString().slice(0,10);
  const p = prefill || {};
  const html = `<div class="modal fade" id="addWritingModal"><div class="modal-dialog modal-lg"><div class="modal-content">
    <div class="modal-header"><h5><i class="bi bi-pencil-fill text-success"></i> דיווח כתיבה — הרב יודלוב</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <div class="row g-2">
        <div class="col-md-7"><label class="form-label">תלמיד</label>
          <input id="nw-student" class="form-control" list="nw-student-list" placeholder="הקלד שם תלמיד..." autocomplete="off" value="${escAttr(p.student||'')}">
          <datalist id="nw-student-list">${studentsDatalistOptions(_wAllStudents, true)}</datalist>
        </div>
        <div class="col-md-2"><label class="form-label">שיעור</label>
          <select id="nw-shiur" class="form-select">
            <option value="">—</option>
            <option value="ב" ${p.shiur==='ב'?'selected':''}>ב</option>
            <option value="ג" ${p.shiur==='ג'?'selected':''}>ג</option>
          </select>
        </div>
        <div class="col-md-3"><label class="form-label">תאריך</label>
          <input id="nw-date" type="date" class="form-control" value="${p.date||today}">
        </div>
      </div>
      <div class="mt-3"><label class="form-label"><i class="bi bi-bullseye me-1"></i>עבודה על:</label>
        <textarea id="nw-work" class="form-control" rows="2" placeholder="מה עבדנו עליו בכתיבה...">${escHtml(p.work||'')}</textarea>
      </div>
      <div class="mt-3"><label class="form-label"><i class="bi bi-chat-left-text me-1"></i>הערות:</label>
        <textarea id="nw-notes" class="form-control" rows="2" placeholder="מצב הכתב, שגיאות, התקדמות...">${escHtml(p.notes||'')}</textarea>
      </div>
      <div class="mt-3"><label class="form-label"><i class="bi bi-lightbulb me-1"></i>הארות הרב:</label>
        <textarea id="nw-insight" class="form-control" rows="2" placeholder="המלצות, כיוונים, פעולות להמשך...">${escHtml(p.insight||'')}</textarea>
      </div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button><button class="btn btn-primary" onclick="saveWriting(event)">שמור</button></div>
  </div></div></div>`;
  cleanupModal('addWritingModal');
  document.body.insertAdjacentHTML('beforeend', html);
  const modalEl = document.getElementById('addWritingModal');
  new bootstrap.Modal(modalEl).show();
  modalEl.addEventListener('hidden.bs.modal', () => cleanupModal('addWritingModal'), { once: true });
}

function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

async function saveWriting(event) {
  const btn = event?.target?.closest('button');
  if (btn && btn.disabled) return;
  if (btn) { btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 3000); }
  const typedLabel = document.getElementById('nw-student').value.trim();
  const stu = resolveStudent(typedLabel, _wAllStudents);
  if (typedLabel && !stu) return alert('לא נמצא תלמיד בשם זה. בחר מתוך הרשימה.');
  const sid = stu ? stu['מזהה'] : '';
  const work = document.getElementById('nw-work').value.trim();
  const notes = document.getElementById('nw-notes').value.trim();
  const insight = document.getElementById('nw-insight').value.trim();
  const shiur = document.getElementById('nw-shiur').value;
  const dateStr = document.getElementById('nw-date').value;
  if (!sid) return alert('יש לבחור תלמיד');
  if (!work && !notes && !insight) return alert('חובה למלא לפחות שדה אחד (עבודה / הערות / הארות)');
  const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
  const reporter = sess.username || 'admin';
  const dt = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  const info = (typeof getHebrewInfo === 'function') ? getHebrewInfo(dt) : {hdate:'',parsha:''};
  const obj = {
    'תלמיד_מזהה': sid,
    'שם תלמיד': stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim() : '',
    'קטגוריה': WRITING_CAT,
    'שיעור': shiur,
    'עבודה_על': work,
    'הערות': notes,
    'הארות': insight,
    'תיאור': [work,notes,insight].filter(Boolean).join(' | '),
    'חומרה': 'נמוכה',
    'תאריך': dt.toISOString(),
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
