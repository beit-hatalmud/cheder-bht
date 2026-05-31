// 2026-05-21: behavior.js now hosts 4 tabs - events, forms (חתימות הורים),
// tasks (משימות), and student card. Tab content is rendered by separate
// modules: behavior-forms.js, behavior-tasks.js, behavior-card.js.

// Sbb 47: expose to window for cross-module access by behavior-extras.js
window._events = window._events || [];
window._categories = window._categories || [];
window._allStudents = window._allStudents || [];
var _events = window._events;
var _categories = window._categories;
var _allStudents = window._allStudents;
let _activeBehaviorTab = 'events';

function getHebrewInfo(jsDate) {
  return {
    hdate: (typeof formatHebrew === 'function') ? formatHebrew(jsDate) : '',
    parsha: (typeof getParshaFor === 'function') ? getParshaFor(jsDate) : '',
  };
}

async function renderBehavior() {
  document.getElementById('page-behavior').innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-clipboard-check"></i> מעקב התנהגות</h3>
      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-sm btn-outline-secondary" onclick="forceSyncBehavior()" title="סנכרן מ-Sheet"><i class="bi bi-arrow-clockwise"></i> סנכרן</button>
        <div id="b-actions"></div>
      </div>
    </div>
    <ul class="nav nav-pills mb-3 flex-wrap" id="behavior-tabs">
      <li class="nav-item"><a class="nav-link active" href="#" onclick="switchBehaviorTab('events',event)"><i class="bi bi-clipboard"></i> אירועים <span class="badge bg-warning text-dark ms-1" id="tab-events-badge"></span></a></li>
      <li class="nav-item"><a class="nav-link" href="#" onclick="switchBehaviorTab('forms',event)"><i class="bi bi-pencil-square"></i> חתימות הורים <span class="badge bg-warning text-dark ms-1" id="tab-forms-badge"></span></a></li>
      <li class="nav-item"><a class="nav-link" href="#" onclick="switchBehaviorTab('tasks',event)"><i class="bi bi-list-check"></i> משימות <span class="badge bg-danger ms-1" id="tab-tasks-badge"></span></a></li>
      <li class="nav-item"><a class="nav-link" href="#" onclick="switchBehaviorTab('projects',event)"><i class="bi bi-kanban"></i> פרויקטים <span class="badge bg-info ms-1" id="tab-proj-badge"></span></a></li>
      <li class="nav-item"><a class="nav-link" href="#" onclick="switchBehaviorTab('card',event)"><i class="bi bi-person-vcard"></i> כרטיס תלמיד</a></li>
    </ul>
    <div id="behavior-tab-content"></div>`;

  // Load shared data once
  const [stRes, evRes, catRes, sigRes, taskRes, projRes] = await Promise.all([
    api('listStudents', []),
    api('listBehavior', []),
    api('listCategories', []),
    api('listSignatures', []),
    api('listTasks', []),
    api('listProjects', []),
  ]);
  _allStudents = window._allStudents = stRes.data || [];
  _events = window._events = evRes.data || [];
  _categories = window._categories = catRes.data || [];
  // Pre-load these so tabs render fast and badges work
  window._bfSignatures = sigRes.data || [];
  window._tasks = taskRes.data || [];
  window._projects = projRes.data || [];
  // also expose to module-scoped vars if they exist
  try { if (typeof _tasks !== 'undefined') _tasks = window._tasks; } catch(_) {}
  try { if (typeof _projects !== 'undefined') _projects = window._projects; } catch(_) {}
  _events.sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
  updateTabBadges();
  // restore last tab
  _activeBehaviorTab = sessionStorage.getItem('behavior_tab') || 'events';
  setActivePill(_activeBehaviorTab);
  renderActiveBehaviorTab();
}

function setActivePill(name) {
  document.querySelectorAll('#behavior-tabs .nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('onclick').includes(`'${name}'`));
  });
}

function updateTabBadges() {
  const setBadge = (id, n) => {
    const el = document.getElementById(id);
    if (el) el.textContent = n > 0 ? n : '';
  };
  const tasks = window._tasks || [];
  const projects = window._projects || [];
  setBadge('tab-events-badge', (_events||[]).filter(e => e['סטטוס_אישור'] === 'ממתין לאישור').length);
  setBadge('tab-forms-badge', (window._bfSignatures||[]).filter(s => s['סטטוס'] === 'מחכה').length);
  setBadge('tab-tasks-badge', tasks.filter(t => t['סטטוס'] !== 'הושלם' && t['תאריך_יעד'] && new Date(t['תאריך_יעד']) < new Date()).length);
  setBadge('tab-proj-badge', projects.filter(p => p['סטטוס'] !== 'הושלם').length);
}

function switchBehaviorTab(name, ev) {
  if (ev) ev.preventDefault();
  _activeBehaviorTab = name;
  sessionStorage.setItem('behavior_tab', name);
  setActivePill(name);
  renderActiveBehaviorTab();
  updateTabBadges();
}

// Auto-refresh badges every 60s
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (document.getElementById('behavior-tabs')) updateTabBadges();
  }, 60000);
}

window.forceSyncBehavior = async function() {
  if (typeof toast === 'function') toast('מסנכרן מ-Sheet...', 'success');
  // Reset _lastLocalChange so pullAllFromSheet won't skip
  if (typeof _lastLocalChange !== 'undefined') {
    try { window._lastLocalChange = 0; } catch(_) {}
  }
  if (typeof pullAllFromSheet === 'function') {
    await pullAllFromSheet();
  }
  await renderBehavior();
  if (typeof toast === 'function') toast('✓ מסונכרן', 'success');
};

function renderActiveBehaviorTab() {
  const root = document.getElementById('behavior-tab-content');
  const actionBar = document.getElementById('b-actions');
  if (_activeBehaviorTab === 'events') {
    actionBar.innerHTML = `<button class="btn btn-success" onclick="addEventModal()"><i class="bi bi-plus"></i> אירוע חדש</button>`;
    renderEventsTab(root);
  } else if (_activeBehaviorTab === 'forms') {
    actionBar.innerHTML = `<button class="btn btn-success" onclick="newFormLink()"><i class="bi bi-plus"></i> שלח טופס חדש</button>`;
    if (typeof renderFormsTab === 'function') renderFormsTab(root);
    else root.innerHTML = '<div class="alert alert-warning">חתימות הורים — טוען...</div>';
  } else if (_activeBehaviorTab === 'tasks') {
    actionBar.innerHTML = `<button class="btn btn-success" onclick="addTaskModal()"><i class="bi bi-plus"></i> משימה חדשה</button>`;
    if (typeof renderTasksTab === 'function') renderTasksTab(root);
    else root.innerHTML = '<div class="alert alert-warning">משימות — טוען...</div>';
  } else if (_activeBehaviorTab === 'projects') {
    actionBar.innerHTML = `<button class="btn btn-success" onclick="addProjectModal()"><i class="bi bi-plus"></i> פרויקט חדש</button>`;
    if (typeof renderProjectsTab === 'function') renderProjectsTab(root);
    else root.innerHTML = '<div class="alert alert-warning">פרויקטים — טוען...</div>';
  } else if (_activeBehaviorTab === 'card') {
    actionBar.innerHTML = '';
    if (typeof renderCardTab === 'function') renderCardTab(root);
    else root.innerHTML = '<div class="alert alert-warning">כרטיס תלמיד — טוען...</div>';
  }
}

function renderEventsTab(root) {
  // 2026-05-21: phone-line approval flow — events from /8 come in as סטטוס_אישור=ממתין לאישור
  const pending = _events.filter(e => e['סטטוס_אישור'] === 'ממתין לאישור');
  const pendingHtml = pending.length ? `
    <div class="card border-warning p-3 mb-3" style="background:#fffbeb">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h5 class="mb-0"><i class="bi bi-clock-history text-warning"></i> ${pending.length} אירועים מהקו הטלפוני ממתינים לאישור</h5>
        <button class="btn btn-sm btn-link" onclick="document.getElementById('b-pending').classList.toggle('d-none')">הצג / הסתר</button>
      </div>
      <div id="b-pending">${pending.map(e => bcPendingCardHtml(e)).join('')}</div>
    </div>` : '';
  root.innerHTML = pendingHtml + `
    <div class="row g-2 mb-3">
      <div class="col-md-4">
        <input id="b-fstudent" class="form-control" list="b-fstudent-list" placeholder="הקלד שם תלמיד או השאר ריק לכולם" autocomplete="off">
        <datalist id="b-fstudent-list"></datalist>
      </div>
      <div class="col-md-4"><select id="b-fcat" class="form-select"><option value="">כל הקטגוריות</option></select></div>
    </div>
    <div id="b-list"></div>`;
  fillFilters();
  drawEvents(_events.filter(e => e['סטטוס_אישור'] !== 'ממתין לאישור'));
  document.getElementById('b-fstudent').oninput = applyFilters;
  document.getElementById('b-fstudent').onchange = applyFilters;
  document.getElementById('b-fcat').onchange = applyFilters;
}

function bcPendingCardHtml(e) {
  const eid = e['מזהה']||0;
  const date = e['תאריך'] ? (typeof formatGreg==='function'?formatGreg(e['תאריך']):e['תאריך']) : '';
  const sev = e['חומרה'] === 'גבוהה' ? 'danger' : e['חומרה'] === 'נמוכה' ? 'success' : 'warning';
  return `<div class="card p-2 mb-2" style="border-right:4px solid #f59e0b">
    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
      <div class="flex-grow-1">
        <div class="d-flex gap-2 align-items-center flex-wrap mb-1">
          <strong>${escHtml(e['שם תלמיד']||'(לא זוהה)')}</strong>
          <span class="badge bg-secondary">${escHtml(e['קטגוריה']||'')}</span>
          <span class="badge bg-${sev}">${escHtml(e['חומרה']||'')}</span>
          <small class="text-muted"><i class="bi bi-telephone"></i> ${escHtml(e['דווח_עי']||'phone')}</small>
          <small class="text-muted">${escHtml(date)}</small>
        </div>
        <div class="small">${escHtml(e['תיאור']||'')}</div>
      </div>
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-success" onclick="approveEvent(${eid})" title="אשר"><i class="bi bi-check-lg"></i> אשר</button>
        <button class="btn btn-sm btn-primary" onclick="editEvent(${eid})" title="ערוך לפני אישור"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteEvent(${eid})" title="מחק"><i class="bi bi-trash"></i></button>
      </div>
    </div>
  </div>`;
}

window.approveEvent = async function(id) {
  const ev = _events.find(x => String(x['מזהה']) === String(id));
  if (!ev) return;
  ev['סטטוס_אישור'] = 'מאושר';
  const r = await api('updateBehavior', [ev]);
  if (r && !r.ok) return alert(r.error || 'שגיאה');
  if (typeof toast === 'function') toast('האירוע אושר', 'success');
  renderBehavior();
};

function fillFilters() {
  const stList = document.getElementById('b-fstudent-list');
  if (stList && typeof studentsDatalistOptions === 'function') {
    stList.innerHTML = studentsDatalistOptions(_allStudents, true);
  }
  const catSel = document.getElementById('b-fcat');
  _categories.forEach(c => {
    catSel.innerHTML += `<option value="${escHtml(c['קטגוריה'])}">${escHtml(c['קטגוריה'])}</option>`;
  });
}

function applyFilters() {
  let f = _events;
  const typed = (document.getElementById('b-fstudent').value || '').trim();
  const c = document.getElementById('b-fcat').value;
  if (typed) {
    const stu = (typeof resolveStudent === 'function') ? resolveStudent(typed, _allStudents) : null;
    if (stu) {
      f = f.filter(e => String(e['תלמיד_מזהה']) === String(stu['מזהה']));
    } else {
      // Partial match: filter by name substring on the event's שם תלמיד
      const q = typed.toLowerCase();
      f = f.filter(e => (e['שם תלמיד']||'').toLowerCase().includes(q));
    }
  }
  if (c) f = f.filter(e => e['קטגוריה'] === c);
  drawEvents(f);
}

function drawEvents(list) {
  const el = document.getElementById('b-list');
  if (!list.length) {
    el.innerHTML = '<div class="text-center py-5 text-muted"><i class="bi bi-clipboard fs-1"></i><p>אין אירועים</p></div>';
    return;
  }
  el.innerHTML = list.map(e => {
    const sev = e['חומרה'] === 'גבוהה' ? 'severity-high' : e['חומרה'] === 'נמוכה' ? 'severity-low' : 'severity-mid';
    const date = e['תאריך'] ? formatGreg(e['תאריך']) : '';
    let hdate = e['תאריך_עברי'] || '';
    let parsha = e['פרשה'] || '';
    if ((!hdate || !parsha) && e['תאריך']) {
      const info = getHebrewInfo(new Date(e['תאריך']));
      if (!hdate) hdate = info.hdate;
      if (!parsha) parsha = info.parsha;
    }
    const reporter = e['דווח_עי'] || '';
    const lesson = e['שיעור'] || '';
    const reporterBadge = reporter ? `<small class="text-muted"><i class="bi bi-person-fill"></i> ${escHtml(reporter)}</small>` : '';
    const lessonBadge = lesson ? `<small class="text-muted ms-2"><i class="bi bi-book"></i> ${escHtml(lesson)}</small>` : '';
    const parshaBadge = parsha ? `<span class="badge bg-light text-dark border me-1">פר' ${escHtml(parsha)}</span>` : '';
    const hdateBadge = hdate ? `<span class="badge bg-light text-dark border">${escHtml(hdate)}</span>` : '';
    const isHigh = e['חומרה'] === 'גבוהה';
    const handled = String(e['טופל']||'').toLowerCase() === 'true' || e['טופל'] === true || e['טופל'] === 'כן';
    const followBadge = isHigh ? (handled
      ? '<span class="badge bg-success-subtle text-success-emphasis border me-1"><i class="bi bi-check-circle"></i> טופל</span>'
      : '<span class="badge bg-danger-subtle text-danger-emphasis border me-1"><i class="bi bi-exclamation-triangle"></i> נדרשת שיחה</span>') : '';
    const handleBtn = isHigh && !handled
      ? `<button class="btn btn-sm btn-outline-success" onclick="markEventHandled(${e['מזהה']||0})" title="סמן כטופל"><i class="bi bi-check2-circle"></i></button>` : '';
    const taskBtn = isHigh && !handled
      ? `<button class="btn btn-sm btn-outline-warning" onclick="createTaskFromEvent(${e['מזהה']||0})" title="צור משימת מעקב"><i class="bi bi-list-check"></i></button>` : '';
    const formBtn = `<button class="btn btn-sm btn-outline-info" onclick="newFormForEvent(${e['מזהה']||0})" title="שלח טופס להורה"><i class="bi bi-pencil-square"></i></button>`;
    return `<div class="card p-3 mb-2 ${sev}">
      <div class="d-flex justify-content-between flex-wrap gap-2">
        <div><span class="cat-badge">${escHtml(e['קטגוריה']||'')}</span><strong class="mx-2">${escHtml(e['שם תלמיד']||'')}</strong>${followBadge}</div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          ${parshaBadge}${hdateBadge}
          <small class="text-muted">${escHtml(date)}</small>
          ${handleBtn}${taskBtn}${formBtn}
          <button class="btn btn-sm btn-outline-primary" onclick="editEvent(${e['מזהה']||0})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteEvent(${e['מזהה']||0})"><i class="bi bi-trash"></i></button>
        </div>
      </div>
      <p class="mb-0 mt-2">${escHtml(e['תיאור']||'')}</p>
      ${(reporterBadge || lessonBadge) ? `<div class="mt-2">${reporterBadge}${lessonBadge}</div>` : ''}
    </div>`;
  }).join('');
}

function editEvent(id) {
  const e = _events.find(x => String(x['מזהה']) === String(id));
  if (!e) return;
  addEventModal();
  const modalEl = document.getElementById('addEvModal');
  const populate = () => {
    const stuInput = document.getElementById('ne-student');
    if (stuInput && stuInput.tagName === 'INPUT' && typeof setStudentTypeaheadValue === 'function') {
      setStudentTypeaheadValue('ne-student', e['תלמיד_מזהה'], _allStudents, e['שם תלמיד']);
    } else if (stuInput) {
      stuInput.value = e['תלמיד_מזהה'] || '';
    }
    document.getElementById('ne-cat').value = e['קטגוריה'] || '';
    document.getElementById('ne-desc').value = e['תיאור'] || '';
    document.getElementById('ne-sev').value = e['חומרה'] || 'בינונית';
    modalEl.dataset.editId = id;
    const h5 = modalEl.querySelector('h5');
    if (h5) h5.textContent = 'עריכת אירוע';
  };
  modalEl.addEventListener('shown.bs.modal', populate, { once: true });
}

async function deleteEvent(id) {
  if (!confirm('בטוח למחוק את האירוע?')) return;
  await api('deleteBehavior', [id]);
  renderBehavior();
  loadStats();
}

async function markEventHandled(id) {
  const ev = _events.find(x => String(x['מזהה']) === String(id));
  if (!ev) return;
  ev['טופל'] = 'כן';
  const r = await api('updateBehavior', [ev]);
  if (r && !r.ok) return alert(r.error || 'שגיאה');
  if (typeof toast === 'function') toast('סומן כטופל', 'success');
  renderBehavior();
}
window.markEventHandled = markEventHandled;

// Create a follow-up task from a high-severity event — implemented in behavior-tasks.js
window.createTaskFromEvent = async function(eventId) {
  if (typeof createTaskFromEvent_impl === 'function') return createTaskFromEvent_impl(eventId);
  alert('משימות לא נטענו עדיין');
};

// Open the form-link modal pre-filled from an event — implemented in behavior-forms.js
window.newFormForEvent = function(eventId) {
  if (typeof newFormForEvent_impl === 'function') return newFormForEvent_impl(eventId);
  switchBehaviorTab('forms');
};

function addEventModal() {
  const studentInput = (typeof studentTypeaheadHTML === 'function')
    ? studentTypeaheadHTML('ne-student', _allStudents, { placeholder: 'הקלד שם תלמיד...', className: 'form-control' })
    : `<select id="ne-student" class="form-select"><option value="">בחר</option>${_allStudents.filter(s => (s['סטטוס']||'פעיל') !== 'סיים').map(s=>`<option value="${escHtml(s['מזהה'])}">${escHtml((s['שם פרטי']||'') + ' ' + (s['שם משפחה']||''))}</option>`).join('')}</select>`;
  const html = `<div class="modal fade" id="addEvModal"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5>אירוע חדש</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <div class="mb-3"><label class="form-label">תלמיד</label>${studentInput}</div>
      <div class="mb-3"><label class="form-label">קטגוריה</label><select id="ne-cat" class="form-select"><option value="">בחר</option>${_categories.map(c=>`<option value="${escHtml(c['קטגוריה'])}">${escHtml(c['קטגוריה'])}</option>`).join('')}</select></div>
      <div class="mb-3"><label class="form-label">תיאור</label><textarea id="ne-desc" class="form-control" rows="3"></textarea></div>
      <div class="mb-3"><label class="form-label">חומרה</label><select id="ne-sev" class="form-select"><option>נמוכה</option><option selected>בינונית</option><option>גבוהה</option></select></div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button><button class="btn btn-primary" onclick="saveEvent(event)">שמור</button></div>
  </div></div></div>`;
  cleanupModal('addEvModal');
  document.body.insertAdjacentHTML('beforeend', html);
  const modalEl = document.getElementById('addEvModal');
  new bootstrap.Modal(modalEl).show();
  modalEl.addEventListener('hidden.bs.modal', () => cleanupModal('addEvModal'), { once: true });
}

async function saveEvent(event) {
  const btn = event?.target?.closest('button');
  if (btn && btn.disabled) return;
  if (btn) {
    btn.disabled = true;
    btn.dataset._origText = btn.textContent;
    btn.textContent = 'שומר...';
    setTimeout(() => {
      if (btn.disabled) {
        btn.disabled = false;
        btn.textContent = btn.dataset._origText || 'שמור';
      }
    }, 15000);
  }
  const stuInput = document.getElementById('ne-student');
  let sid = '';
  let stu = null;
  if (stuInput && stuInput.tagName === 'INPUT') {
    const typed = (stuInput.value || '').trim();
    stu = (typeof resolveStudent === 'function') ? resolveStudent(typed, _allStudents) : null;
    if (!stu && typed) {
      // Fallback: case-insensitive substring match on full name
      const q = typed.toLowerCase();
      const matches = _allStudents.filter(s => `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.toLowerCase().includes(q));
      if (matches.length === 1) stu = matches[0];
    }
    if (stu) sid = String(stu['מזהה']||'');
  } else if (stuInput) {
    sid = stuInput.value;
    stu = _allStudents.find(s => String(s['מזהה']) === sid);
  }
  const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
  const reporter = sess.username || 'admin';
  const obj = {
    'תלמיד_מזהה': sid,
    'שם תלמיד': stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}` : '',
    'קטגוריה': document.getElementById('ne-cat').value,
    'תיאור': document.getElementById('ne-desc').value,
    'חומרה': document.getElementById('ne-sev').value,
  };
  if (!obj['תלמיד_מזהה']) {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset._origText || 'שמור'; }
    return alert('יש לבחור תלמיד מהרשימה (הקלד שם והרשימה תציע)');
  }
  if (!obj['קטגוריה'] || !obj['תיאור']) {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset._origText || 'שמור'; }
    return alert('כל השדות חובה');
  }
  const editId = document.getElementById('addEvModal').dataset.editId;
  let r;
  if (editId) {
    obj['מזהה'] = parseInt(editId);
    const orig = _events.find(x => String(x['מזהה']) === String(editId));
    if (orig && orig['תאריך']) {
      const info = getHebrewInfo(new Date(orig['תאריך']));
      obj['תאריך_עברי'] = orig['תאריך_עברי'] || info.hdate;
      obj['פרשה'] = orig['פרשה'] || info.parsha;
    }
    r = await api('updateBehavior', [obj]);
  } else {
    const now = new Date();
    const info = getHebrewInfo(now);
    obj['תאריך'] = now.toISOString();
    obj['תאריך_עברי'] = info.hdate;
    obj['פרשה'] = info.parsha;
    obj['דווח_עי'] = reporter;
    r = await api('addBehavior', [obj]);
  }
  if (r && !r.ok) {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset._origText || 'שמור'; }
    return alert(r.error || 'שגיאה בשמירה');
  }
  hideModal('addEvModal');
  // Optimistic local update — drawEvents directly, before triggering renderBehavior.
  // Multiple packs (50, 107, 4) debounce renderBehavior up to 3s, which caused the
  // post-save list to appear unchanged → users thought save failed.
  try {
    if (!editId) {
      _events.unshift(obj);
    } else {
      const idx = _events.findIndex(e => String(e['מזהה']) === String(obj['מזהה']));
      if (idx >= 0) _events[idx] = Object.assign({}, _events[idx], obj);
    }
    _events.sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
    if (typeof drawEvents === 'function') drawEvents(_events.filter(e => e['סטטוס_אישור'] !== 'ממתין לאישור'));
    if (typeof updateTabBadges === 'function') updateTabBadges();
    if (typeof toast === 'function') toast(editId ? '✓ עודכן' : '✓ נשמר', 'success');
  } catch(e) { console.warn('optimistic update failed:', e); }
  // Then trigger full render (bypass debounce so dependent screens refresh)
  window._forceRender = true;
  try { renderBehavior(); } finally { setTimeout(() => { window._forceRender = false; }, 100); }
  loadStats();
}
