// Parent meetings page (אסיפת הורים)
let _meetingsData = [];
let _meetingsStudents = [];

async function renderMeetings() {
  const html = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-people-fill"></i> אסיפות הורים</h3>
      <button class="btn btn-primary" onclick="meetAddModal()"><i class="bi bi-plus"></i> פגישה חדשה</button>
    </div>

    <div class="card p-3 mb-3">
      <div class="row g-2">
        <div class="col-md-6"><input id="me-search" class="form-control" placeholder="חיפוש לפי תלמיד, נושא, סיכום..."></div>
        <div class="col-md-3">
          <select id="me-period" class="form-select"><option value="">כל התקופות</option></select>
        </div>
        <div class="col-md-3">
          <select id="me-student" class="form-select"><option value="">כל התלמידים</option></select>
        </div>
      </div>
    </div>

    <div id="me-list"></div>
    <div id="me-empty" class="text-center py-5 text-muted d-none">
      <i class="bi bi-people-fill fs-1"></i>
      <p class="mb-0">אין פגישות מתועדות</p>
    </div>`;
  document.getElementById('page-meetings').innerHTML = html;

  const [sR, mR] = await Promise.all([api('listStudents', []), api('listMeetings', [])]);
  _meetingsStudents = sR.data || [];
  _meetingsData = mR.data || [];

  const periods = [...new Set(_meetingsData.map(m => m['תקופה']).filter(Boolean))];
  document.getElementById('me-period').innerHTML = '<option value="">כל התקופות</option>' +
    periods.map(p => `<option>${escHtml(p)}</option>`).join('');

  const sortedStu = _meetingsStudents.slice().sort((a,b) => (a['שם משפחה']||'').localeCompare(b['שם משפחה']||'', 'he'));
  document.getElementById('me-student').innerHTML = '<option value="">כל התלמידים</option>' +
    sortedStu.map(s => `<option value="${s['מזהה']}">${escHtml((s['שם פרטי']||'')+' '+(s['שם משפחה']||''))}</option>`).join('');

  ['me-search','me-period','me-student'].forEach(id => document.getElementById(id).oninput = meetingsRefresh);
  ['me-period','me-student'].forEach(id => document.getElementById(id).onchange = meetingsRefresh);
  meetingsRefresh();
}

function meetingsRefresh() {
  const q = (document.getElementById('me-search').value || '').toLowerCase();
  const period = document.getElementById('me-period').value;
  const sid = document.getElementById('me-student').value;
  let list = _meetingsData.slice().sort((a,b) => new Date(b['תאריך']||0) - new Date(a['תאריך']||0));
  if (period) list = list.filter(m => m['תקופה'] === period);
  if (sid) list = list.filter(m => String(m['תלמיד_מזהה']) === sid);
  if (q) list = list.filter(m => Object.values(m).some(v => String(v||'').toLowerCase().includes(q)));

  const el = document.getElementById('me-list');
  document.getElementById('me-empty').classList.toggle('d-none', list.length > 0);
  const stuById = {};
  _meetingsStudents.forEach(s => stuById[s['מזהה']] = s);
  el.innerHTML = list.map(m => {
    const stu = stuById[m['תלמיד_מזהה']];
    const stuName = stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim() : '?';
    const dt = m['תאריך'] ? formatDateBoth(m['תאריך']) : '';
    return `<div class="card p-3 mb-2">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <strong>${escHtml(stuName)}</strong>
          ${stu ? `<span class="text-muted ms-2">כיתה ${escHtml(stu['מחזור']||'')}</span>` : ''}
          ${m['תקופה'] ? `<span class="badge bg-light text-dark me-2">${escHtml(m['תקופה'])}</span>` : ''}
          ${m['רב'] ? `<span class="badge bg-info-subtle text-info-emphasis border me-1"><i class="bi bi-person-fill"></i> ${escHtml(m['רב'])}</span>` : ''}
        </div>
        <div class="d-flex gap-1 align-items-center">
          <small class="text-muted">${escHtml(dt)}</small>
          <button class="btn btn-sm btn-outline-primary p-1" onclick="meetEdit(${m['מזהה']})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger p-1" onclick="meetDelete(${m['מזהה']})"><i class="bi bi-trash"></i></button>
        </div>
      </div>
      ${m['נושא'] ? `<div class="mt-2"><strong>נושא:</strong> ${escHtml(m['נושא'])}</div>` : ''}
      ${m['משתתפים'] ? `<div class="small"><strong>משתתפים:</strong> ${escHtml(m['משתתפים'])}</div>` : ''}
      ${m['סיכום'] ? `<div class="mt-2 meeting-summary" style="white-space:pre-wrap;line-height:1.7">${escHtml(m['סיכום'])}</div>` : ''}
      ${m['הערות'] ? `<div class="mt-2 small text-muted">${escHtml(m['הערות'])}</div>` : ''}
    </div>`;
  }).join('');
}

function meetAddModal(existing) {
  const e = existing || {};
  const sortedStu = _meetingsStudents.slice().sort((a,b) => (a['שם משפחה']||'').localeCompare(b['שם משפחה']||'', 'he'));
  const html = `<div class="modal fade" id="me-modal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content">
    <div class="modal-header"><h5>${existing ? 'עריכת' : 'פגישה חדשה —'} אסיפת הורים</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <div class="row g-2 mb-2">
        <div class="col-md-7"><label class="form-label">תלמיד</label>
          <select id="mea-student" class="form-select">
            ${sortedStu.map(s => `<option value="${s['מזהה']}" ${String(e['תלמיד_מזהה'])===String(s['מזהה'])?'selected':''}>${escHtml((s['שם פרטי']||'')+' '+(s['שם משפחה']||''))}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-5"><label class="form-label">תאריך</label><input id="mea-date" type="date" class="form-control" value="${e['תאריך'] || new Date().toISOString().slice(0,10)}"></div>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-md-4"><label class="form-label">תקופה</label><input id="mea-period" class="form-control" value="${escHtml(e['תקופה']||'')}" placeholder="אייר תשפ&quot;ו"></div>
        <div class="col-md-4"><label class="form-label">רב מדווח</label><input id="mea-rabbi" class="form-control" value="${escHtml(e['רב'] || (function(){ try { return JSON.parse(sessionStorage.getItem('user')||'{}').username || ''; } catch(_) { return ''; } })())}" placeholder="מי כתב את הדיווח"></div>
        <div class="col-md-4"><label class="form-label">משתתפים</label><input id="mea-parents" class="form-control" value="${escHtml(e['משתתפים']||'')}" placeholder="אבא, אמא..."></div>
      </div>
      <div class="mb-2"><label class="form-label">נושא</label><input id="mea-topic" class="form-control" value="${escHtml(e['נושא']||'')}"></div>
      <div class="mb-2"><label class="form-label">סיכום</label><textarea id="mea-summary" class="form-control" rows="8" style="white-space:pre-wrap">${escHtml(e['סיכום']||'')}</textarea></div>
      <div class="mb-2"><label class="form-label">הערות</label><textarea id="mea-notes" class="form-control" rows="2">${escHtml(e['הערות']||'')}</textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button>
      <button class="btn btn-primary" onclick="meetSave(${existing ? e['מזהה'] : 'null'})">שמור</button>
    </div>
  </div></div></div>`;
  cleanupModal('me-modal');
  document.body.insertAdjacentHTML('beforeend', html);
  const _m = document.getElementById('me-modal');
  new bootstrap.Modal(_m).show();
  _m.addEventListener('hidden.bs.modal', () => cleanupModal('me-modal'), { once: true });
}

function meetEdit(id) {
  const m = _meetingsData.find(x => String(x['מזהה']) === String(id));
  if (m) meetAddModal(m);
}

async function meetSave(editId) {
  const obj = {
    'תלמיד_מזהה': parseInt(document.getElementById('mea-student').value),
    'תאריך': document.getElementById('mea-date').value,
    'תקופה': document.getElementById('mea-period').value.trim(),
    'רב': document.getElementById('mea-rabbi').value.trim(),
    'משתתפים': document.getElementById('mea-parents').value.trim(),
    'נושא': document.getElementById('mea-topic').value.trim(),
    'סיכום': document.getElementById('mea-summary').value.trim(),
    'הערות': document.getElementById('mea-notes').value.trim(),
  };
  if (!obj['תלמיד_מזהה']) return alert('בחר תלמיד');
  if (editId) obj['מזהה'] = editId;
  const r = await api(editId ? 'updateMeeting' : 'addMeeting', [obj]);
  if (r.ok) {
    hideModal('me-modal');
    notify('נשמר', 'success');
    renderMeetings();
  } else alert(r.error || 'שגיאה');
}

async function meetDelete(id) {
  if (!confirm('למחוק את הפגישה?')) return;
  const r = await api('deleteMeeting', [id]);
  if (r.ok) { notify('נמחק', 'success'); renderMeetings(); } else alert(r.error || 'שגיאה במחיקה');
}
