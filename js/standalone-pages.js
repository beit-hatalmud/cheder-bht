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
  if (typeof renderTasksTab === 'function') {
    renderTasksTab(document.getElementById('tasks-page-content'));
  } else {
    document.getElementById('tasks-page-content').innerHTML = '<div class="alert alert-warning">renderTasksTab לא נטען. רענן את הדף.</div>';
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
  if (typeof renderProjectsTab === 'function') {
    renderProjectsTab(document.getElementById('projects-page-content'));
  } else {
    document.getElementById('projects-page-content').innerHTML = '<div class="alert alert-warning">renderProjectsTab לא נטען.</div>';
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

console.log('%c✅ standalone pages loaded (tasks, projects, formsMgmt)', 'color:#16a34a;font-weight:bold');
