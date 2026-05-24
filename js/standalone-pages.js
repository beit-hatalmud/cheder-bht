// standalone-pages.js v2 — simpler, more reliable. 2026-05-24.

function _shArr(arr) { return Array.isArray(arr) ? arr : []; }
function _shEsc(s) { return String(s||'').replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }

async function _shLoadAllBehaviorData() {
  try {
    const [st, tk, pj, ev] = await Promise.all([
      api('listStudents', []),
      api('listTasks', []),
      api('listProjects', []),
      api('listBehavior', []),
    ]);
    window._allStudents = st.data || [];
    window._tasks = tk.data || [];
    window._projects = pj.data || [];
    window._events = ev.data || [];
  } catch (e) {
    console.error('data load err', e);
  }
}

// =========== TASKS PAGE ===========
window.renderTasks = async function() {
  const root = document.getElementById('page-tasks');
  if (!root) return;
  root.innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-list-check"></i> משימות צוות</h3>
      <button class="btn btn-success" onclick="if(typeof addTaskModal==='function')addTaskModal()"><i class="bi bi-plus"></i> משימה חדשה</button>
    </div>
    <div id="tasks-content"><div class="text-center py-4"><div class="spinner-border"></div></div></div>`;
  await _shLoadAllBehaviorData();
  const tasks = _shArr(window._tasks);
  const cont = document.getElementById('tasks-content');
  if (!tasks.length) {
    cont.innerHTML = `<div class="text-center py-5">
      <div style="font-size:4rem;opacity:0.3">📋</div>
      <h5 class="text-muted mt-3">אין משימות עדיין</h5>
      <p class="text-muted">לחץ "משימה חדשה" כדי ליצור את הראשונה.</p>
    </div>`;
    return;
  }
  // Group by status
  const groups = { 'חדש': [], 'בתהליך': [], 'הושלם': [] };
  tasks.forEach(t => {
    const s = t['סטטוס'] || 'חדש';
    if (groups[s]) groups[s].push(t); else groups['חדש'].push(t);
  });
  cont.innerHTML = `<div class="row g-3">${Object.entries(groups).map(([status, list]) => `
    <div class="col-md-4">
      <div class="card p-2" style="background:#f8fafc">
        <div class="d-flex justify-content-between mb-2"><strong>${status}</strong><span class="badge bg-secondary">${list.length}</span></div>
        ${list.map(t => `<div class="card p-2 mb-2" style="cursor:pointer" onclick="if(typeof renderTaskDetails==='function')renderTaskDetails(${t['מזהה']||0});else alert('${_shEsc(t['כותרת']||'')}')">
          <strong>${_shEsc(t['כותרת']||'(ללא כותרת)')}</strong>
          ${t['עדיפות']?`<span class="badge bg-${t['עדיפות']==='דחוף'?'danger':t['עדיפות']==='גבוה'?'warning text-dark':'light text-dark'} mt-1">${_shEsc(t['עדיפות'])}</span>`:''}
          ${t['תאריך_יעד']?`<div class="small text-muted mt-1">יעד: ${_shEsc(t['תאריך_יעד'])}</div>`:''}
          ${t['אחראי']?`<div class="small text-muted">אחראי: ${_shEsc(t['אחראי'])}</div>`:''}
        </div>`).join('') || '<div class="text-muted text-center small py-3">ריק</div>'}
      </div>
    </div>`).join('')}</div>`;
};

// =========== PROJECTS PAGE ===========
window.renderProjects = async function() {
  const root = document.getElementById('page-projects');
  if (!root) return;
  root.innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-kanban"></i> פרויקטים</h3>
      <button class="btn btn-success" onclick="if(typeof addProjectModal==='function')addProjectModal()"><i class="bi bi-plus"></i> פרויקט חדש</button>
    </div>
    <div id="projects-content"><div class="text-center py-4"><div class="spinner-border"></div></div></div>`;
  await _shLoadAllBehaviorData();
  const projs = _shArr(window._projects);
  const tasks = _shArr(window._tasks);
  const cont = document.getElementById('projects-content');
  if (!projs.length) {
    cont.innerHTML = `<div class="text-center py-5">
      <div style="font-size:4rem;opacity:0.3">📊</div>
      <h5 class="text-muted mt-3">אין פרויקטים עדיין</h5>
      <p class="text-muted">לחץ "פרויקט חדש" כדי ליצור את הראשון.</p>
    </div>`;
    return;
  }
  cont.innerHTML = `<div class="row g-3">${projs.map(p => {
    const linked = tasks.filter(t => String(t['פרויקט_מזהה'])===String(p['מזהה']));
    const done = linked.filter(t => t['סטטוס']==='הושלם').length;
    const pct = linked.length ? Math.round(done/linked.length*100) : 0;
    return `<div class="col-md-6">
      <div class="card p-3 h-100" style="cursor:pointer" onclick="if(typeof renderProjectDetails==='function')renderProjectDetails(${p['מזהה']||0})">
        <div class="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
          <h5 class="mb-0">${_shEsc(p['שם']||'(ללא שם)')}</h5>
          <span class="badge bg-${p['סטטוס']==='הושלם'?'success':p['סטטוס']==='בתהליך'?'warning':'info'}">${_shEsc(p['סטטוס']||'')}</span>
        </div>
        ${p['תיאור']?`<div class="small text-muted mb-2">${_shEsc(String(p['תיאור']).substring(0,120))}</div>`:''}
        <div class="d-flex gap-3 small text-muted flex-wrap">
          ${p['אחראי']?`<span>👤 ${_shEsc(p['אחראי'])}</span>`:''}
          ${p['תאריך_יעד']?`<span>📅 ${_shEsc(p['תאריך_יעד'])}</span>`:''}
          <span>📋 ${done}/${linked.length} משימות</span>
        </div>
        ${linked.length?`<div class="progress mt-2" style="height:6px"><div class="progress-bar bg-success" style="width:${pct}%"></div></div>`:''}
      </div>
    </div>`;
  }).join('')}</div>`;
};

// =========== FORMS MGMT PAGE ===========
window.renderFormsMgmt = async function() {
  const root = document.getElementById('page-formsMgmt');
  if (!root) return;
  root.innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-clipboard-data"></i> ניהול טפסים וחתימות</h3>
      <button class="btn btn-primary" onclick="if(typeof newFormLink==='function')newFormLink()"><i class="bi bi-plus"></i> צור קישור חתימה</button>
    </div>
    <div id="formsMgmt-content"><div class="text-center py-4"><div class="spinner-border"></div></div></div>`;
  await _shLoadAllBehaviorData();
  const cont = document.getElementById('formsMgmt-content');
  // Try to use renderFormsTab; otherwise show simple panel
  try {
    if (typeof renderFormsTab === 'function') {
      renderFormsTab(cont);
      if (!cont.innerHTML.trim() || cont.querySelector('.spinner-border')) throw 0;
      return;
    }
  } catch(_) {}
  // Fallback: load signatures
  let sigs = window._bfSignatures || [];
  if (!sigs.length) {
    try { const r = await api('listSignatures', []); sigs = r.data || []; window._bfSignatures = sigs; } catch(_) {}
  }
  cont.innerHTML = `<div class="card p-3 mb-3">
    <h5>חתימות הורים שתועדו</h5>
    ${sigs.length ? `<div class="row g-2 mt-2">${sigs.slice(0,30).map(s => `
      <div class="col-md-6"><div class="card p-2">
        <strong>${_shEsc(s['סוג']||'')}</strong>
        <div class="small text-muted">${_shEsc(s['תיאור']||'').substring(0,80)}</div>
        <div class="small">${_shEsc(s['סטטוס']||'')} · ${_shEsc(s['תאריך']||'')}</div>
      </div></div>`).join('')}</div>` : '<div class="text-muted">אין חתימות. צור קישור חתימה ראשון.</div>'}
  </div>`;
};

// =========== CAMERAS PAGE ===========
window.renderCameras = async function() {
  const root = document.getElementById('page-cameras');
  if (!root) return;
  root.innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <h3><i class="bi bi-camera-video"></i> מצלמות + AI</h3>
    <div class="card p-4 text-center mt-3">
      <i class="bi bi-camera-video fs-1 text-muted"></i>
      <p class="mt-3">פאנל ניטור מצלמות AI - בפיתוח.</p>
      <p class="small text-muted">המצלמות פעילות במחשב המקומי ושומרות דיווחים אוטומטיים.</p>
    </div>`;
};

console.log('%c✅ standalone-pages v2 loaded', 'color:#16a34a;font-weight:bold');
