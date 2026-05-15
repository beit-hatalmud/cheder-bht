// Generic lessons module — handles both קליין + יודלוב (and any future rabbi).
// Each instance binds to a specific rabbi name and renders into its own page div.

const LESSONS_TAB = 'שיעורים_פרטניים';
const LESSONS_RABBIS = {
  klein:  { fullName: 'הרב קליין',  pageId: 'page-lessonsKlein',  emoji: '🎓', color: 'primary' },
  yodlov: { fullName: 'הרב יודלוב', pageId: 'page-lessonsYodlov', emoji: '🎓', color: 'info' },
};
const _lessonsCache = { all: null };

async function fetchLessons(force) {
  if (force || !_lessonsCache.all) {
    try {
      const params = new URLSearchParams({ action: 'cheder_listRows', token: AGENT_TOKEN, instance: INSTANCE, tab: LESSONS_TAB });
      const r = await fetch(APPS_SCRIPT_URL + '?' + params.toString());
      const d = await r.json();
      _lessonsCache.all = d.rows || [];
    } catch { _lessonsCache.all = []; }
  }
  return _lessonsCache.all;
}

async function renderLessons(rabbiKey) {
  const cfg = LESSONS_RABBIS[rabbiKey];
  if (!cfg) return;
  const root = document.getElementById(cfg.pageId);
  root.innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3><i class="bi bi-mortarboard text-${cfg.color}"></i> ${cfg.emoji} שיעורים פרטניים — ${cfg.fullName}</h3>
      <div class="btn-group">
        <button class="btn btn-success" onclick="addLessonModal('${rabbiKey}')"><i class="bi bi-plus-lg"></i> סיכום שיעור חדש</button>
        <button class="btn btn-outline-secondary" onclick="renderLessons('${rabbiKey}')" title="רענן"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
    </div>
    <div class="row g-2 mb-3">
      <div class="col-md-4"><input type="search" id="lf-search" class="form-control" placeholder="חיפוש לפי שם / נושא / תוכן"></div>
      <div class="col-md-3"><select id="lf-student" class="form-select"><option value="">כל התלמידים</option></select></div>
      <div class="col-md-3"><input type="month" id="lf-month" class="form-control"></div>
    </div>
    <div id="lessons-list" class="text-muted">טוען…</div>`;
  const [stRes, lessons] = await Promise.all([api('listStudents', []), fetchLessons(true)]);
  const students = stRes.data || [];
  const studentSel = document.getElementById('lf-student');
  students.slice().sort((a,b) => (a['שם משפחה']||'').localeCompare(b['שם משפחה']||'', 'he')).forEach(s => {
    const opt = document.createElement('option');
    opt.value = String(s['מזהה']);
    opt.textContent = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    studentSel.appendChild(opt);
  });
  const myLessons = lessons.filter(l => String(l['רב']||'').trim() === cfg.fullName);
  function paint() {
    const q = (document.getElementById('lf-search').value||'').toLowerCase().trim();
    const sid = document.getElementById('lf-student').value;
    const month = document.getElementById('lf-month').value;
    let list = myLessons;
    if (q) list = list.filter(l => Object.values(l).join(' ').toLowerCase().includes(q));
    if (sid) list = list.filter(l => String(l['תלמיד_מזהה']) === sid);
    if (month) list = list.filter(l => String(l['תאריך']||'').startsWith(month));
    list = list.slice().sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
    drawLessons(list, students, rabbiKey);
  }
  document.getElementById('lf-search').oninput = paint;
  studentSel.onchange = paint;
  document.getElementById('lf-month').onchange = paint;
  paint();
}

function drawLessons(list, students, rabbiKey) {
  const el = document.getElementById('lessons-list');
  if (!list.length) {
    el.innerHTML = '<div class="text-muted text-center py-4">אין סיכומי שיעור עדיין. לחץ "+ סיכום שיעור חדש" להתחיל.</div>';
    return;
  }
  const cfg = LESSONS_RABBIS[rabbiKey];
  el.innerHTML = list.map(l => {
    const stu = students.find(s => String(s['מזהה']) === String(l['תלמיד_מזהה']));
    const stuName = stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim() : (l['שם תלמיד']||'(לא ידוע)');
    const dt = l['תאריך'] ? new Date(l['תאריך']).toLocaleDateString('he-IL') : '';
    return `
      <div class="card mb-2 p-3 shadow-sm border-${cfg.color}">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <h6 class="mb-1"><strong>${escHtml(stuName)}</strong>
              ${l['נושא'] ? `<span class="badge bg-${cfg.color}-subtle text-${cfg.color}-emphasis border ms-2">${escHtml(l['נושא'])}</span>` : ''}
            </h6>
            <small class="text-muted"><i class="bi bi-calendar"></i> ${escHtml(dt)} ${l['משך']?`· <i class="bi bi-clock"></i> ${escHtml(l['משך'])} דק'`:''}</small>
          </div>
          <div>
            <button class="btn btn-sm btn-outline-secondary" onclick="editLesson('${escHtml(l['מזהה'])}','${rabbiKey}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteLesson('${escHtml(l['מזהה'])}','${rabbiKey}')"><i class="bi bi-trash"></i></button>
          </div>
        </div>
        ${l['תוכן'] ? `<div class="mt-2"><strong class="small text-muted">📚 מה למדנו:</strong><div style="white-space:pre-wrap" class="small">${escHtml(l['תוכן'])}</div></div>` : ''}
        ${l['שיעורי_בית'] ? `<div class="mt-2"><strong class="small text-warning">📝 שיעורי בית:</strong><div style="white-space:pre-wrap" class="small">${escHtml(l['שיעורי_בית'])}</div></div>` : ''}
        ${l['הערות'] ? `<div class="mt-2"><strong class="small text-info">💭 הערות:</strong><div style="white-space:pre-wrap" class="small">${escHtml(l['הערות'])}</div></div>` : ''}
        ${l['רושם'] ? `<div class="mt-2 small text-muted">😊 רושם: ${escHtml(l['רושם'])}</div>` : ''}
      </div>`;
  }).join('');
}

async function addLessonModal(rabbiKey, existing) {
  const cfg = LESSONS_RABBIS[rabbiKey];
  const stRes = await api('listStudents', []);
  const students = (stRes.data || []).slice().sort((a,b) => (a['שם משפחה']||'').localeCompare(b['שם משפחה']||'', 'he'));
  const e = existing || {};
  const today = new Date().toISOString().slice(0,10);
  const html = `
    <div class="modal fade" id="lessonModal" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content">
      <div class="modal-header bg-${cfg.color} text-white">
        <h5 class="modal-title"><i class="bi bi-mortarboard"></i> ${e['מזהה']?'עריכת':'סיכום'} שיעור — ${cfg.fullName}</h5>
        <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="row g-2">
          <div class="col-md-4"><label class="form-label small">תאריך</label>
            <input type="date" id="lm-date" class="form-control" value="${e['תאריך']||today}">
          </div>
          <div class="col-md-5"><label class="form-label small">תלמיד <span class="text-danger">*</span></label>
            <select id="lm-student" class="form-select"><option value="">בחר תלמיד...</option>
              ${students.map(s => `<option value="${s['מזהה']}" ${String(e['תלמיד_מזהה'])===String(s['מזהה'])?'selected':''}>${escHtml((s['שם פרטי']||'')+' '+(s['שם משפחה']||''))} ${s['מחזור']?`(${escHtml(s['מחזור'])})`:''}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-3"><label class="form-label small">משך (דק')</label>
            <input type="number" id="lm-duration" class="form-control" value="${escAttr(e['משך']||'30')}" min="0" max="240">
          </div>
          <div class="col-12"><label class="form-label small">נושא <span class="text-danger">*</span></label>
            <input id="lm-topic" class="form-control" value="${escAttr(e['נושא']||'')}" placeholder="פרשת השבוע / חשבון / קריאה / הלכות שבת...">
          </div>
          <div class="col-12"><label class="form-label small">📚 מה למדנו</label>
            <textarea id="lm-content" class="form-control" rows="4" placeholder="פירוט החומר שכוסה - דפים, מספרים, אירועים, הסברים...">${escHtml(e['תוכן']||'')}</textarea>
          </div>
          <div class="col-md-6"><label class="form-label small">📝 שיעורי בית</label>
            <textarea id="lm-homework" class="form-control" rows="3" placeholder="מה לתלמיד לעשות עד הפעם הבאה">${escHtml(e['שיעורי_בית']||'')}</textarea>
          </div>
          <div class="col-md-6"><label class="form-label small">💭 הערות / מעקב</label>
            <textarea id="lm-notes" class="form-control" rows="3" placeholder="הצלחות, קשיים, נקודות לתשומת לב להורים">${escHtml(e['הערות']||'')}</textarea>
          </div>
          <div class="col-12"><label class="form-label small">😊 רושם כללי</label>
            <select id="lm-mood" class="form-select">
              <option value="">— לא צוין —</option>
              <option ${e['רושם']==='מצוין'?'selected':''}>😄 מצוין</option>
              <option ${e['רושם']==='טוב'?'selected':''}>🙂 טוב</option>
              <option ${e['רושם']==='בסדר'?'selected':''}>😐 בסדר</option>
              <option ${e['רושם']==='קשה'?'selected':''}>😕 קשה</option>
              <option ${e['רושם']==='לא הגיע'?'selected':''}>❌ לא הגיע</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button>
        <button class="btn btn-${cfg.color}" onclick="saveLesson('${rabbiKey}', ${e['מזהה'] ? `'${e['מזהה']}'` : 'null'})"><i class="bi bi-check2"></i> שמור</button>
      </div>
    </div></div></div>`;
  cleanupModal('lessonModal');
  document.body.insertAdjacentHTML('beforeend', html);
  new bootstrap.Modal(document.getElementById('lessonModal')).show();
}
window.addLessonModal = addLessonModal;

async function saveLesson(rabbiKey, editId) {
  const cfg = LESSONS_RABBIS[rabbiKey];
  const stuId = document.getElementById('lm-student').value;
  const topic = document.getElementById('lm-topic').value.trim();
  if (!stuId) { alert('בחר תלמיד'); return; }
  if (!topic) { alert('נושא חובה'); return; }
  const stRes = await api('listStudents', []);
  const stu = (stRes.data||[]).find(s => String(s['מזהה'])===String(stuId));
  const stuName = stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim() : '';
  const id = editId || ('L' + Date.now());
  const row = {
    'מזהה': id, 'רב': cfg.fullName,
    'תאריך': document.getElementById('lm-date').value,
    'תלמיד_מזהה': stuId, 'שם תלמיד': stuName,
    'משך': document.getElementById('lm-duration').value,
    'נושא': topic,
    'תוכן': document.getElementById('lm-content').value.trim(),
    'שיעורי_בית': document.getElementById('lm-homework').value.trim(),
    'הערות': document.getElementById('lm-notes').value.trim(),
    'רושם': document.getElementById('lm-mood').value,
    'דווח_עי': (currentUser && currentUser.username) || 'admin',
  };
  try {
    const params = new URLSearchParams({
      action: editId ? 'cheder_updateRow' : 'cheder_appendRow',
      token: AGENT_TOKEN, instance: INSTANCE, tab: LESSONS_TAB,
      row: JSON.stringify(row),
      ...(editId ? { matchKey: 'מזהה', matchValue: id } : {}),
    });
    const r = await fetch(APPS_SCRIPT_URL, {
      method: 'POST', mode: 'cors',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: params.toString()
    });
    const d = await r.json();
    if (d.ok) {
      hideModal('lessonModal');
      _lessonsCache.all = null;
      if (typeof notify === 'function') notify('סיכום השיעור נשמר','success');
      renderLessons(rabbiKey);
    } else alert('שגיאה: ' + (d.error||'לא ידוע'));
  } catch (e) { alert('שגיאת רשת: ' + e.message); }
}
window.saveLesson = saveLesson;

async function editLesson(id, rabbiKey) {
  const lessons = await fetchLessons(false);
  const l = lessons.find(x => String(x['מזהה']) === String(id));
  if (l) addLessonModal(rabbiKey, l);
}
window.editLesson = editLesson;

async function deleteLesson(id, rabbiKey) {
  if (!confirm('למחוק את סיכום השיעור?')) return;
  try {
    const params = new URLSearchParams({
      action: 'cheder_deleteRow', token: AGENT_TOKEN, instance: INSTANCE,
      tab: LESSONS_TAB, matchKey: 'מזהה', matchValue: id,
    });
    const r = await fetch(APPS_SCRIPT_URL, {
      method: 'POST', mode: 'cors',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: params.toString()
    });
    const d = await r.json();
    if (d.ok) {
      _lessonsCache.all = null;
      renderLessons(rabbiKey);
      if (typeof notify === 'function') notify('נמחק','success');
    } else alert('שגיאה: ' + (d.error||''));
  } catch (e) { alert('שגיאה: ' + e.message); }
}
window.deleteLesson = deleteLesson;

// Override the placeholder render functions from the old reading-clones
window.renderLessonsKlein  = () => renderLessons('klein');
window.renderLessonsYodlov = () => renderLessons('yodlov');
