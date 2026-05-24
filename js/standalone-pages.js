// standalone-pages.js — 3 דפים עצמאיים: משימות, פרויקטים, ניהול טפסים.
// לא בתוך מעקב התנהגות. הכל מסונכרן עם כרטיס תלמיד. 2026-05-24.

// ============== TASKS PAGE (standalone) ==============
window.renderTasks = async function() {
  const root = document.getElementById('page-tasks');
  if (!root) return;
  root.innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-list-check"></i> משימות צוות</h3>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-secondary" onclick="forceSyncTasks()"><i class="bi bi-arrow-clockwise"></i></button>
        <button class="btn btn-success" onclick="addTaskModal()"><i class="bi bi-plus"></i> משימה חדשה</button>
      </div>
    </div>
    <div id="tasks-page-content"><div class="text-center py-4"><div class="spinner-border"></div> טוען...</div></div>`;
  // Always load fresh
  try {
    const [stRes, tRes] = await Promise.all([api('listStudents',[]), api('listTasks',[])]);
    window._allStudents = stRes.data || [];
    window._tasks = tRes.data || [];
  } catch(e) {}
  const cont = document.getElementById('tasks-page-content');
  try {
    if (typeof renderTasksTab === 'function') {
      renderTasksTab(cont);
      if (!cont.innerHTML.trim() || cont.querySelector('.spinner-border')) throw new Error('empty render');
    } else throw new Error('renderTasksTab missing');
  } catch (err) {
    // Fallback: simple list directly
    const tasks = window._tasks || [];
    cont.innerHTML = tasks.length ? `<div class="row g-2">${tasks.map(t => `
      <div class="col-md-6 col-lg-4">
        <div class="card p-3 h-100" style="cursor:pointer" onclick="if(typeof renderTaskDetails==='function')renderTaskDetails(${t['מזהה']||0})">
          <strong>${escHtml(t['כותרת']||'(ללא כותרת)')}</strong>
          <div class="d-flex gap-2 align-items-center mt-2 flex-wrap">
            <span class="badge bg-${t['סטטוס']==='הושלם'?'success':t['סטטוס']==='בתהליך'?'warning':'secondary'}">${escHtml(t['סטטוס']||'')}</span>
            ${t['עדיפות']?`<span class="badge bg-${t['עדיפות']==='דחוף'?'danger':t['עדיפות']==='גבוה'?'warning text-dark':'light text-dark'}">${escHtml(t['עדיפות'])}</span>`:''}
            ${t['תאריך_יעד']?`<small class="text-muted">יעד: ${escHtml(t['תאריך_יעד'])}</small>`:''}
          </div>
          ${t['תיאור']?`<div class="small text-muted mt-2">${escHtml(String(t['תיאור']).substring(0,80))}</div>`:''}
        </div>
      </div>`).join('')}</div>` : '<div class="text-center py-5 text-muted"><i class="bi bi-list-check fs-1"></i><p>אין משימות עדיין. לחץ "משימה חדשה" להוסיף.</p></div>';
  }
};
window.forceSyncTasks = async function() {
  if (typeof pullAllFromSheet === 'function') await pullAllFromSheet();
  const tr = await api('listTasks', []);
  window._tasks = tr.data || [];
  renderTasks();
};

// ============== PROJECTS PAGE (standalone) ==============
window.renderProjects = async function() {
  const root = document.getElementById('page-projects');
  if (!root) return;
  root.innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-kanban"></i> פרויקטים</h3>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-secondary" onclick="forceSyncProjects()"><i class="bi bi-arrow-clockwise"></i></button>
        <button class="btn btn-success" onclick="addProjectModal()"><i class="bi bi-plus"></i> פרויקט חדש</button>
      </div>
    </div>
    <div id="projects-page-content"><div class="text-center py-4"><div class="spinner-border"></div> טוען...</div></div>`;
  try {
    const [stRes, tRes, pRes] = await Promise.all([api('listStudents',[]), api('listTasks',[]), api('listProjects',[])]);
    window._allStudents = stRes.data || [];
    window._tasks = tRes.data || [];
    window._projects = pRes.data || [];
  } catch(e) {}
  const cont = document.getElementById('projects-page-content');
  try {
    if (typeof renderProjectsTab === 'function') {
      renderProjectsTab(cont);
      if (!cont.innerHTML.trim() || cont.querySelector('.spinner-border')) throw new Error('empty');
    } else throw new Error('missing');
  } catch (err) {
    const projects = window._projects || [];
    cont.innerHTML = projects.length ? `<div class="row g-2">${projects.map(p => `
      <div class="col-md-6">
        <div class="card p-3" style="cursor:pointer" onclick="if(typeof renderProjectDetails==='function')renderProjectDetails(${p['מזהה']||0})">
          <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div>
              <strong>${escHtml(p['שם']||'')}</strong>
              <span class="badge bg-${p['סטטוס']==='הושלם'?'success':p['סטטוס']==='בתהליך'?'warning':'info'} ms-2">${escHtml(p['סטטוס']||'')}</span>
            </div>
            ${p['אחראי']?`<small class="text-muted">${escHtml(p['אחראי'])}</small>`:''}
          </div>
          ${p['תיאור']?`<div class="small text-muted mt-2">${escHtml(String(p['תיאור']).substring(0,100))}</div>`:''}
          ${p['תאריך_יעד']?`<div class="small mt-2"><i class="bi bi-calendar"></i> יעד: ${escHtml(p['תאריך_יעד'])}</div>`:''}
        </div>
      </div>`).join('')}</div>` : '<div class="text-center py-5 text-muted"><i class="bi bi-kanban fs-1"></i><p>אין פרויקטים עדיין.</p></div>';
  }
};
window.forceSyncProjects = async function() {
  if (typeof pullAllFromSheet === 'function') await pullAllFromSheet();
  const pr = await api('listProjects', []);
  window._projects = pr.data || [];
  renderProjects();
};

// ============== FORMS-MGMT PAGE (standalone) ==============
window.renderFormsMgmt = async function() {
  const root = document.getElementById('page-formsMgmt');
  if (!root) return;
  root.innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-clipboard-data"></i> ניהול טפסים וחתימות</h3>
    </div>
    <div id="forms-mgmt-content"></div>`;
  if (!window._allStudents || !window._allStudents.length) {
    const stRes = await api('listStudents', []);
    window._allStudents = stRes.data || [];
  }
  // Reuse renderFormsTab (which includes manager section)
  if (typeof renderFormsTab === 'function') {
    renderFormsTab(document.getElementById('forms-mgmt-content'));
  }
};

// ============== REMOVE tasks/projects/forms from behavior page tabs ==============
const _origRenderBehavior = window.renderBehavior;
window.renderBehavior = async function() {
  if (_origRenderBehavior) await _origRenderBehavior();
  // After render, simplify tabs to only events + card
  setTimeout(() => {
    const tabs = document.getElementById('behavior-tabs');
    if (!tabs) return;
    // Hide tasks/projects/forms tabs - they have their own pages
    tabs.querySelectorAll('a').forEach(a => {
      const oc = a.getAttribute('onclick') || '';
      if (oc.includes("'forms'") || oc.includes("'tasks'") || oc.includes("'projects'")) {
        a.parentElement.style.display = 'none';
      }
    });
    // Add info notice
    if (!document.getElementById('beh-page-notice')) {
      const notice = document.createElement('div');
      notice.id = 'beh-page-notice';
      notice.className = 'alert alert-info small d-flex justify-content-between align-items-center';
      notice.innerHTML = `<div>📌 משימות, פרויקטים וניהול טפסים עברו לדפים נפרדים מהתפריט הראשי. כאן רק אירועי התנהגות + כרטיס תלמיד.</div>`;
      tabs.parentNode.insertBefore(notice, tabs.nextSibling);
    }
  }, 200);
};

// ============== CAMERAS PAGE — basic placeholder so it shows something ==============
window.renderCameras = async function() {
  const root = document.getElementById('page-cameras');
  if (!root) return;
  root.innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3><i class="bi bi-camera-video"></i> מצלמות + AI</h3>
    </div>
    <div class="card p-4 text-center">
      <i class="bi bi-camera-video fs-1 text-muted"></i>
      <p class="mt-3">פאנל ניטור מצלמות AI - בפיתוח. בקרוב יוצג כאן feed מהמצלמות עם ניתוח AI אוטומטי.</p>
      <div class="small text-muted">המצלמות פעילות במחשב ושומרות דיווחים. גש למחשב כדי לראות.</div>
    </div>`;
};

console.log('%c✅ standalone pages loaded', 'color:#16a34a;font-weight:bold');
