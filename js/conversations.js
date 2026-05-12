// Conversations with students page (שיחות עם תלמידים)
// Auto-tags the logged-in user as the rabbi who conducted the conversation.
let _convData = [];
let _convStudents = [];

async function renderConversations() {
  const html = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-chat-dots"></i> שיחות עם תלמידים</h3>
      <button class="btn btn-primary" onclick="convAddModal()"><i class="bi bi-plus"></i> שיחה חדשה</button>
    </div>

    <div class="card p-3 mb-3">
      <div class="row g-2">
        <div class="col-md-6"><input id="co-search" class="form-control" placeholder="חיפוש לפי תלמיד, נושא, תוכן..."></div>
        <div class="col-md-3">
          <select id="co-rabbi" class="form-select"><option value="">כל הרבנים</option></select>
        </div>
        <div class="col-md-3">
          <select id="co-student" class="form-select"><option value="">כל התלמידים</option></select>
        </div>
      </div>
    </div>

    <div id="co-list"></div>
    <div id="co-empty" class="text-center py-5 text-muted d-none">
      <i class="bi bi-chat-dots fs-1"></i>
      <p class="mb-0">אין שיחות מתועדות</p>
    </div>`;
  document.getElementById('page-conversations').innerHTML = html;

  const [sR, cR] = await Promise.all([api('listStudents', []), api('listConversations', [])]);
  _convStudents = sR.data || [];
  _convData = cR.data || [];

  const rabbis = [...new Set(_convData.map(m => m['רב']).filter(Boolean))].sort();
  document.getElementById('co-rabbi').innerHTML = '<option value="">כל הרבנים</option>' +
    rabbis.map(p => `<option>${escHtml(p)}</option>`).join('');

  const sortedStu = _convStudents.slice().sort((a,b) => (a['שם משפחה']||'').localeCompare(b['שם משפחה']||'', 'he'));
  document.getElementById('co-student').innerHTML = '<option value="">כל התלמידים</option>' +
    sortedStu.map(s => `<option value="${s['מזהה']}">${escHtml((s['שם פרטי']||'')+' '+(s['שם משפחה']||''))}</option>`).join('');

  ['co-search','co-rabbi','co-student'].forEach(id => document.getElementById(id).oninput = conversationsRefresh);
  ['co-rabbi','co-student'].forEach(id => document.getElementById(id).onchange = conversationsRefresh);
  conversationsRefresh();
}

function conversationsRefresh() {
  const q = (document.getElementById('co-search').value || '').toLowerCase();
  const rabbi = document.getElementById('co-rabbi').value;
  const sid = document.getElementById('co-student').value;
  let list = _convData.slice().sort((a,b) => new Date(b['תאריך']||0) - new Date(a['תאריך']||0));
  if (rabbi) list = list.filter(m => m['רב'] === rabbi);
  if (sid) list = list.filter(m => String(m['תלמיד_מזהה']) === sid);
  if (q) list = list.filter(m => Object.values(m).some(v => String(v||'').toLowerCase().includes(q)));

  const el = document.getElementById('co-list');
  document.getElementById('co-empty').classList.toggle('d-none', list.length > 0);
  const stuById = {};
  _convStudents.forEach(s => stuById[s['מזהה']] = s);
  el.innerHTML = list.map(m => {
    const stu = stuById[m['תלמיד_מזהה']];
    const stuName = stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim() : '?';
    const dt = m['תאריך'] ? formatDateBoth(m['תאריך']) : '';
    return `<div class="card p-3 mb-2">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <strong>${escHtml(stuName)}</strong>
          ${stu ? `<span class="text-muted ms-2">כיתה ${escHtml(stu['מחזור']||'')}</span>` : ''}
          ${m['רב'] ? `<span class="badge bg-info-subtle text-info-emphasis border me-2"><i class="bi bi-person-fill"></i> ${escHtml(m['רב'])}</span>` : ''}
        </div>
        <div class="d-flex gap-1 align-items-center">
          <small class="text-muted">${escHtml(dt)}</small>
          <button class="btn btn-sm btn-outline-primary p-1" onclick="convEdit(${m['מזהה']})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger p-1" onclick="convDelete(${m['מזהה']})"><i class="bi bi-trash"></i></button>
        </div>
      </div>
      ${m['נושא'] ? `<div class="mt-2"><strong>נושא:</strong> ${escHtml(m['נושא'])}</div>` : ''}
      ${m['תוכן'] ? `<div class="mt-2" style="white-space:pre-wrap">${escHtml(m['תוכן'])}</div>` : ''}
      ${m['הערות'] ? `<div class="mt-2 small text-muted">${escHtml(m['הערות'])}</div>` : ''}
    </div>`;
  }).join('');
}

function convAddModal(existing) {
  const e = existing || {};
  const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
  const defaultRabbi = e['רב'] || sess.username || '';
  const sortedStu = _convStudents.slice().sort((a,b) => (a['שם משפחה']||'').localeCompare(b['שם משפחה']||'', 'he'));
  const html = `<div class="modal fade" id="co-modal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content">
    <div class="modal-header"><h5>${existing ? 'עריכת' : ''} שיחה עם תלמיד</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <div class="row g-2 mb-2">
        <div class="col-md-7"><label class="form-label">תלמיד</label>
          <select id="coa-student" class="form-select">
            <option value="">בחר תלמיד</option>
            ${sortedStu.map(s => `<option value="${s['מזהה']}" ${String(e['תלמיד_מזהה'])===String(s['מזהה'])?'selected':''}>${escHtml((s['שם פרטי']||'')+' '+(s['שם משפחה']||''))}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-5"><label class="form-label">תאריך</label><input id="coa-date" type="date" class="form-control" value="${e['תאריך'] ? String(e['תאריך']).slice(0,10) : new Date().toISOString().slice(0,10)}"></div>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-md-6"><label class="form-label">רב (מי שעשה את השיחה)</label><input id="coa-rabbi" class="form-control" value="${escHtml(defaultRabbi)}"></div>
        <div class="col-md-6"><label class="form-label">נושא</label><input id="coa-topic" class="form-control" value="${escHtml(e['נושא']||'')}" placeholder="למשל: שיחה אישית, חיזוק, מעקב..."></div>
      </div>
      <div class="mb-2"><label class="form-label">תוכן השיחה</label><textarea id="coa-content" class="form-control" rows="6">${escHtml(e['תוכן']||'')}</textarea></div>
      <div class="mb-2"><label class="form-label">הערות</label><textarea id="coa-notes" class="form-control" rows="2">${escHtml(e['הערות']||'')}</textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button>
      <button class="btn btn-primary" onclick="convSave(${existing ? e['מזהה'] : 'null'})">שמור</button>
    </div>
  </div></div></div>`;
  cleanupModal('co-modal');
  document.body.insertAdjacentHTML('beforeend', html);
  const _m = document.getElementById('co-modal');
  new bootstrap.Modal(_m).show();
  _m.addEventListener('hidden.bs.modal', () => cleanupModal('co-modal'), { once: true });
}

function convEdit(id) {
  const m = _convData.find(x => String(x['מזהה']) === String(id));
  if (m) convAddModal(m);
}

async function convSave(editId) {
  const obj = {
    'תלמיד_מזהה': parseInt(document.getElementById('coa-student').value),
    'תאריך': document.getElementById('coa-date').value,
    'רב': document.getElementById('coa-rabbi').value.trim(),
    'נושא': document.getElementById('coa-topic').value.trim(),
    'תוכן': document.getElementById('coa-content').value.trim(),
    'הערות': document.getElementById('coa-notes').value.trim(),
  };
  if (!obj['תלמיד_מזהה']) return alert('בחר תלמיד');
  if (!obj['רב']) {
    const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
    obj['רב'] = sess.username || 'לא ידוע';
  }
  if (editId) obj['מזהה'] = editId;
  const r = await api(editId ? 'updateConversation' : 'addConversation', [obj]);
  if (r.ok) {
    hideModal('co-modal');
    notify('נשמר', 'success');
    renderConversations();
  } else alert(r.error || 'שגיאה');
}

async function convDelete(id) {
  if (!confirm('למחוק את השיחה?')) return;
  const r = await api('deleteConversation', [id]);
  if (r.ok) { notify('נמחק', 'success'); renderConversations(); } else alert(r.error || 'שגיאה במחיקה');
}
