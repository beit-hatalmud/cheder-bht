// Main app router & login

// Round-5 fix: auto-add static backdrop to all modals (prevents dismiss during async save)
document.addEventListener('show.bs.modal', (ev) => {
  const m = ev.target;
  if (m && !m.dataset.bsBackdrop) m.setAttribute('data-bs-backdrop', 'static');
}, true);

// Bug #1 fix: safe modal lifecycle — disposes Bootstrap instance + removes DOM
// Safely hide a modal — never throws if instance is gone
window.hideModal = function(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  try { bootstrap.Modal.getInstance(el)?.hide(); } catch {}
};

window.cleanupModal = function(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  try { bootstrap.Modal.getInstance(el)?.dispose(); } catch {}
  el.remove();
  // Clean up any stuck backdrops
  document.querySelectorAll('.modal-backdrop').forEach(b => {
    if (!document.querySelector('.modal.show')) b.remove();
  });
  if (!document.querySelector('.modal.show')) {
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }
};

// Bug #8 fix: prevents double-submit during async save
window.guardSubmit = function(btn, asyncFn) {
  if (!btn || btn.disabled) return false;
  btn.disabled = true;
  btn.dataset.originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> שומר...';
  asyncFn().finally(() => {
    btn.disabled = false;
    if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
  });
  return true;
};

function toast(msg, type) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = {success:'bi-check-circle-fill', error:'bi-exclamation-triangle-fill', warn:'bi-exclamation-circle-fill'};
  const colors = {success:'#16a34a', error:'#dc2626', warn:'#f59e0b'};
  const icon = icons[type] || 'bi-info-circle-fill';
  const div = document.createElement('div');
  div.className = `toast-msg ${type||''}`;
  div.innerHTML = `<i class="bi ${icon}" style="color:${colors[type]||'#0066cc'};font-size:1.3rem"></i><span>${msg}</span>`;
  container.appendChild(div);
  setTimeout(() => {
    div.classList.add('fadeOut');
    setTimeout(() => div.remove(), 300);
  }, 3000);
}
window.notify = toast;

let currentUser = null;
const PAGES = ['login','home','students','behavior','functioning','tests','medications','classview','attendance','calendar','meetings','conversations','settings','reports'];

function showPage(name) {
  PAGES.forEach(p => {
    document.getElementById('page-' + p).classList.toggle('d-none', p !== name);
  });
  if (name === 'students' && typeof renderStudents === 'function') renderStudents();
  if (name === 'behavior' && typeof renderBehavior === 'function') renderBehavior();
  if (name === 'functioning' && typeof renderFunctioning === 'function') renderFunctioning();
  if (name === 'tests' && typeof renderTests === 'function') renderTests();
  if (name === 'medications' && typeof renderMedications === 'function') renderMedications();
  if (name === 'classview' && typeof renderClassView === 'function') renderClassView();
  if (name === 'attendance' && typeof renderAttendance === 'function') renderAttendance();
  if (name === 'calendar' && typeof renderCalendar === 'function') renderCalendar();
  if (name === 'meetings' && typeof renderMeetings === 'function') renderMeetings();
  if (name === 'conversations' && typeof renderConversations === 'function') renderConversations();
  if (name === 'settings' && typeof renderSettings === 'function') renderSettings();
  if (name === 'reports' && typeof renderReports === 'function') renderReports();
}

function goto(page) {
  showPage(page);
  history.pushState({page}, '', '#' + page);
}

window.addEventListener('popstate', e => {
  const page = (e.state && e.state.page) || 'home';
  showPage(page);
});

// Bug #14 fix: re-render current page when data is refreshed from sheet
window.addEventListener('cheder-data-refreshed', () => {
  const hash = location.hash.replace('#','') || 'home';
  if (hash === 'home' && typeof loadStats === 'function') loadStats();
  else if (PAGES.includes(hash)) showPage(hash);
});

// Reset all module-level UI state (called on login/logout to prevent cross-user leakage)
function resetModuleState() {
  try {
    if (typeof _funcSelected !== 'undefined') window._funcSelected = null;
    if (typeof _cvSelected !== 'undefined') window._cvSelected = '';
    if (typeof _calCurMonth !== 'undefined') window._calCurMonth = new Date();
    if (typeof _statusFilter !== 'undefined') window._statusFilter = 'active';
  } catch {}
}
window.resetModuleState = resetModuleState;

// Round-16: global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Esc on a modal already handled by Bootstrap; this is for non-modal scenarios
  if (e.key === 'Escape' && !document.querySelector('.modal.show')) {
    const h = location.hash.replace('#','');
    if (h && h !== 'home' && h !== 'login') goto('home');
  }
  // / focuses search (when not typing)
  if (e.key === '/' && !e.target.matches('input,textarea,select')) {
    e.preventDefault();
    if (typeof openGlobalSearch === 'function') openGlobalSearch();
  }
});

async function doLogin(){
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  if (!u || !p) return;
  const r = await api('authenticate', [u, p]);
  if (r.ok && r.data && r.data.ok) {
    resetModuleState();  // Round-6 fix: clear stale UI state from previous user
    currentUser = r.data.user;
    // Augment with permissions from users array
    const userRow = (await api('listUsers',[])).data.find(x=>x['שם משתמש']===u);
    if (userRow) currentUser.permissions = userRow['הרשאות'] || '';
    sessionStorage.setItem('user', JSON.stringify(currentUser));
    document.getElementById('user-info').innerHTML = escHtml(currentUser.username) + ' (' + escHtml(currentUser.role||'') + ') <button class="btn btn-sm btn-outline-light ms-2" onclick="logout()">יציאה</button>';
    showPage('home');
    loadStats();
    filterByPermissions();
  } else {
    const err = document.getElementById('login-error');
    err.textContent = (r.data && r.data.error) || r.error || 'שגיאה';
    err.classList.remove('d-none');
  }
}

document.getElementById('login-btn').onclick = doLogin;
document.getElementById('password').addEventListener('keypress', e => { if(e.key==='Enter') doLogin(); });

function showLoadingOverlay(text) {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem';
    el.innerHTML = `<div class="spinner-border text-primary" role="status" style="width:3rem;height:3rem"></div><div id="loading-text" class="text-primary fw-bold"></div>`;
    document.body.appendChild(el);
  }
  document.getElementById('loading-text').textContent = text;
}
function hideLoadingOverlay() {
  const el = document.getElementById('loading-overlay');
  if (el) el.remove();
}

async function loadStats() {
  const s = await api('listStudents', []);
  const b = await api('listBehavior', []);
  const students = (s.data || []).filter(x => (x['סטטוס']||'פעיל') !== 'סיים');
  const events = b.data || [];
  document.getElementById('stat-students').textContent = students.length;
  document.getElementById('stat-events').textContent = events.length;
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const week = events.filter(e => dateMs(e['תאריך']) > weekAgo);
  document.getElementById('stat-week').textContent = week.length;
  document.getElementById('stat-high').textContent = events.filter(e => e['חומרה'] === 'גבוהה').length;
  drawClassBanner(students);
  drawTrendChart(events);
  drawBirthdays(students);
  drawAlerts(students, events);
  drawRecentActivity(events);
}

function drawClassBanner(students) {
  const el = document.getElementById('class-banner');
  if (!el) return;
  const dist = {};
  students.forEach(s => { const c = s['מחזור']||'?'; dist[c] = (dist[c]||0) + 1; });
  const keys = Object.keys(dist).sort();
  if (!keys.length) { el.textContent = ''; return; }
  el.innerHTML = keys.map(k => `<span class="me-3"><strong>${escHtml(k)}</strong>: ${dist[k]}</span>`).join('') +
    ` · סה"כ <strong>${students.length}</strong>`;
}

function drawBirthdays(students) {
  const el = document.getElementById('birthdays');
  if (!el) return;
  const today = new Date();
  const thisMonth = today.getMonth() + 1;
  const list = students.map(s => {
    const d = (typeof parseAnyDate === 'function') ? parseAnyDate(s['תאריך לידה']) : null;
    if (!d) return null;
    if (d.getMonth() + 1 !== thisMonth) return null;
    return { ...s, _day: d.getDate(), _bd: d };
  }).filter(Boolean).sort((a,b) => a._day - b._day);
  if (!list.length) {
    el.innerHTML = '<p class="text-muted small mb-0">אין ימי הולדת החודש</p>';
    return;
  }
  el.innerHTML = list.map(s => {
    const fullName = (s['שם פרטי']||'') + ' ' + (s['שם משפחה']||'');
    const newAge = (s['גיל']||0) + 1;
    return `<div class="d-flex justify-content-between border-bottom py-2 small" onclick="viewStudent(${s['מזהה']})" style="cursor:pointer">
      <div><i class="bi bi-cake2 text-warning"></i> <strong>${escHtml(fullName)}</strong> <span class="text-muted">(כיתה ${escHtml(s['מחזור']||'')})</span></div>
      <div class="text-muted">${s._day || '?'} בחודש · גיל ${newAge}</div>
    </div>`;
  }).join('');
}

function drawAlerts(students, events) {
  const el = document.getElementById('alerts-list');
  if (!el) return;
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const counts = {};
  events.filter(e => dateMs(e['תאריך']) > weekAgo && e['חומרה'] === 'גבוהה').forEach(e => {
    const sid = e['תלמיד_מזהה'];
    counts[sid] = (counts[sid]||0) + 1;
  });
  const flagged = Object.entries(counts).filter(([, n]) => n >= 2)
    .sort((a,b) => b[1] - a[1])
    .map(([sid, n]) => ({ student: students.find(s => String(s['מזהה']) === String(sid)), count: n }))
    .filter(x => x.student);
  if (!flagged.length) {
    el.innerHTML = '<p class="text-muted small mb-0">אין דגלים השבוע</p>';
    return;
  }
  el.innerHTML = flagged.map(f => {
    const fullName = (f.student['שם פרטי']||'') + ' ' + (f.student['שם משפחה']||'');
    return `<div class="d-flex justify-content-between border-bottom py-2 small" onclick="viewStudent(${f.student['מזהה']})" style="cursor:pointer">
      <div><i class="bi bi-flag-fill text-danger"></i> <strong>${escHtml(fullName)}</strong> <span class="text-muted">(${escHtml(f.student['מחזור']||'')})</span></div>
      <div><span class="badge bg-danger">${f.count} אירועי חומרה גבוהה</span></div>
    </div>`;
  }).join('');
}

function drawTrendChart(events) {
  const el = document.getElementById('trend-chart');
  if (!el || typeof Chart === 'undefined') return;
  // Last 14 days
  const labels = [];
  const counts = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000);
    const key = d.toLocaleDateString('he-IL', {day:'numeric',month:'numeric'});
    labels.push(key);
    const dayCount = events.filter(e => {
      const ed = new Date(e['תאריך']);
      return ed.toDateString() === d.toDateString();
    }).length;
    counts.push(dayCount);
  }
  if (window._chart) window._chart.destroy();
  window._chart = new Chart(el, {
    type: 'line',
    data: { labels, datasets: [{ label: 'אירועים', data: counts, borderColor: '#0066cc', backgroundColor: 'rgba(0,102,204,0.1)', tension: 0.3, fill: true }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

function drawRecentActivity(events) {
  const el = document.getElementById('recent-activity');
  if (!el) return;
  const sorted = [...events].sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך'])).slice(0, 5);
  if (!sorted.length) {
    el.innerHTML = '<p class="text-muted small mb-0">אין פעילות אחרונה</p>';
    return;
  }
  el.innerHTML = sorted.map(e => {
    const sev = e['חומרה'] === 'גבוהה' ? 'text-danger' : e['חומרה'] === 'נמוכה' ? 'text-success' : 'text-warning';
    const date = e['תאריך'] ? formatDateBoth(e['תאריך']) : '';
    return `<div class="d-flex justify-content-between border-bottom py-2 small">
      <div><i class="bi bi-circle-fill ${sev}" style="font-size:.6rem"></i> <strong>${escHtml(e['שם תלמיד']||'')}</strong> · ${escHtml(e['קטגוריה']||'')}</div>
      <div class="text-muted">${escHtml(date)}</div>
    </div>`;
  }).join('');
}

// Auto-login from session, or from URL params (?u=admin&p=6742)
const saved = sessionStorage.getItem('user');
const urlParams = new URLSearchParams(location.search);
const urlUser = urlParams.get('u');
const urlPass = urlParams.get('p');
if (saved) {
  currentUser = JSON.parse(saved);
  document.getElementById('user-info').innerHTML = currentUser.username + ' (' + currentUser.role + ') <button class="btn btn-sm btn-outline-light ms-2" onclick="logout()">יציאה</button>';
  showPage('home');
  setTimeout(loadStats, 500);
  filterByPermissions();
} else if (urlUser && urlPass) {
  showPage('login');
  document.getElementById('username').value = urlUser;
  document.getElementById('password').value = urlPass;
  setTimeout(() => {
    doLogin();
    history.replaceState({}, '', location.pathname + location.hash);
  }, 50);
} else {
  showPage('login');
}

function logout(){
  sessionStorage.removeItem('user');
  location.reload();
}

function hasPermission(area){
  if (!currentUser) return false;
  if (currentUser.role === 'מנהל' || currentUser.permissions === 'all') return true;
  if (!currentUser.permissions) return false;
  return currentUser.permissions.split(',').map(s=>s.trim()).includes(area);
}

function filterByPermissions(){
  const permissions = {
    'students': ['students','all'],
    'behavior': ['behavior','all'],
    'functioning': ['functioning','all'],
    'tests': ['tests','all'],
    'medications': ['medications','all'],
    'classview': ['classview','all'],
    'attendance': ['attendance','all'],
    'calendar': ['calendar','all'],
    'meetings': ['meetings','all'],
    'conversations': ['conversations','all'],
    'settings': ['settings','all'],
    'reports': ['reports','all'],
  };
  const tiles = document.querySelectorAll('.card-tile');
  tiles.forEach(tile => {
    const onclick = tile.getAttribute('onclick') || '';
    const m = onclick.match(/goto\('([a-z]+)'\)/);
    if (!m) return;
    const area = m[1];
    if (!hasPermission(area)) {
      tile.parentElement.style.display = 'none';
    } else {
      tile.parentElement.style.display = '';
    }
  });
  // If user is currently viewing a page they no longer have permission for, redirect home
  const currentHash = location.hash.replace('#','');
  if (currentHash && permissions[currentHash] && !hasPermission(currentHash)) {
    showPage('home');
    history.replaceState({page:'home'}, '', '#home');
  }
}
