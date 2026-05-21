// behavior-extras.js — sbbs 21-30: dark mode, stats, filters, tags, dashboards.
// 2026-05-21.

// SBB 21: Dark mode toggle - works across the whole app
(function initDarkMode() {
  const KEY = 'bht_dark_mode';
  const apply = (on) => {
    document.documentElement.classList.toggle('dark-mode', on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch(_) {}
  };
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === '1') apply(true);
  } catch(_) {}
  window.toggleDarkMode = () => {
    const on = !document.documentElement.classList.contains('dark-mode');
    apply(on);
    if (typeof toast === 'function') toast(on ? 'מצב כהה הופעל' : 'מצב בהיר', 'success');
  };
})();

// SBB 22: Stats overview at top of behavior page (when on events tab)
window.renderBehaviorStatsBar = function() {
  if (sessionStorage.getItem('behavior_tab') !== 'events') return;
  if (document.getElementById('beh-stats-bar')) return;
  const tabContent = document.getElementById('behavior-tab-content');
  if (!tabContent) return;
  const today = new Date().toISOString().slice(0,10);
  const weekAgo = new Date(Date.now() - 7*86400000).toISOString().slice(0,10);
  const todayCount = (_events||[]).filter(e => (e['תאריך']||'').startsWith(today)).length;
  const weekCount = (_events||[]).filter(e => (e['תאריך']||'') > weekAgo).length;
  const highCount = (_events||[]).filter(e => e['חומרה'] === 'גבוהה').length;
  const handledRatio = (_events||[]).length ? Math.round((_events||[]).filter(e => String(e['טופל']||'')==='כן' || e['טופל']===true).length / (_events||[]).length * 100) : 0;
  const bar = document.createElement('div');
  bar.id = 'beh-stats-bar';
  bar.className = 'row g-2 mb-3';
  bar.innerHTML = `
    <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="h4 mb-0 text-primary">${todayCount}</div><small class="text-muted">היום</small></div></div>
    <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="h4 mb-0 text-info">${weekCount}</div><small class="text-muted">שבוע</small></div></div>
    <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="h4 mb-0 text-danger">${highCount}</div><small class="text-muted">חומרה גבוהה</small></div></div>
    <div class="col-6 col-md-3"><div class="card p-2 text-center"><div class="h4 mb-0 text-success">${handledRatio}%</div><small class="text-muted">טופלו</small></div></div>`;
  tabContent.insertBefore(bar, tabContent.firstChild);
};

// SBB 23: Tag system for tasks (auto-detect hashtags in description)
window.extractTags = function(text) {
  if (!text) return [];
  return Array.from(new Set((text.match(/#[֐-׿a-zA-Z0-9_]+/g) || []).map(t => t.slice(1))));
};

// SBB 24: Linked items - show connections between event/task/student
window.findLinkedItems = function(itemType, itemId) {
  if (itemType === 'student') {
    return {
      events: (_events||[]).filter(e => String(e['תלמיד_מזהה']) === String(itemId)),
      tasks: (_tasks||[]).filter(t => String(t['תלמיד_מזהה']) === String(itemId)),
      signatures: (window._bfSignatures||[]).filter(s => String(s['תלמיד_מזהה']) === String(itemId)),
    };
  }
  if (itemType === 'event') {
    return {
      tasks: (_tasks||[]).filter(t => String(t['אירוע_מזהה']) === String(itemId)),
    };
  }
  if (itemType === 'project') {
    return {
      tasks: (_tasks||[]).filter(t => String(t['פרויקט_מזהה']) === String(itemId)),
    };
  }
  return {};
};

// SBB 25: Filter pills — quick filters at top of events list
window.applyQuickFilter = function(filterName) {
  let filtered = _events || [];
  if (filterName === 'today') {
    const today = new Date().toISOString().slice(0,10);
    filtered = filtered.filter(e => (e['תאריך']||'').startsWith(today));
  } else if (filterName === 'week') {
    const weekAgo = new Date(Date.now() - 7*86400000).toISOString().slice(0,10);
    filtered = filtered.filter(e => (e['תאריך']||'') > weekAgo);
  } else if (filterName === 'high') {
    filtered = filtered.filter(e => e['חומרה'] === 'גבוהה');
  } else if (filterName === 'unhandled') {
    filtered = filtered.filter(e => e['חומרה'] === 'גבוהה' && !(String(e['טופל']||'')==='כן' || e['טופל']===true));
  }
  if (typeof drawEvents === 'function') drawEvents(filtered);
};

// SBB 26: Quick filter pills UI
window.injectQuickFilters = function() {
  if (sessionStorage.getItem('behavior_tab') !== 'events') return;
  if (document.getElementById('quick-filters')) return;
  const bList = document.getElementById('b-list');
  if (!bList) return;
  const pills = document.createElement('div');
  pills.id = 'quick-filters';
  pills.className = 'mb-3 d-flex gap-2 flex-wrap';
  pills.innerHTML = `
    <button class="btn btn-sm btn-outline-secondary" onclick="applyQuickFilter('all');highlightFilter(this)">הכל</button>
    <button class="btn btn-sm btn-outline-primary" onclick="applyQuickFilter('today');highlightFilter(this)">היום</button>
    <button class="btn btn-sm btn-outline-info" onclick="applyQuickFilter('week');highlightFilter(this)">השבוע</button>
    <button class="btn btn-sm btn-outline-danger" onclick="applyQuickFilter('high');highlightFilter(this)">חומרה גבוהה</button>
    <button class="btn btn-sm btn-outline-warning" onclick="applyQuickFilter('unhandled');highlightFilter(this)">לא טופלו</button>`;
  bList.parentNode.insertBefore(pills, bList);
};

window.highlightFilter = function(btn) {
  document.querySelectorAll('#quick-filters .btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

window.applyQuickFilter = function(name) {
  if (name === 'all') return drawEvents(_events.filter(e => e['סטטוס_אישור'] !== 'ממתין לאישור'));
  let filtered = (_events||[]).filter(e => e['סטטוס_אישור'] !== 'ממתין לאישור');
  if (name === 'today') {
    const today = new Date().toISOString().slice(0,10);
    filtered = filtered.filter(e => (e['תאריך']||'').startsWith(today));
  } else if (name === 'week') {
    const weekAgo = new Date(Date.now() - 7*86400000).toISOString().slice(0,10);
    filtered = filtered.filter(e => (e['תאריך']||'') > weekAgo);
  } else if (name === 'high') {
    filtered = filtered.filter(e => e['חומרה'] === 'גבוהה');
  } else if (name === 'unhandled') {
    filtered = filtered.filter(e => e['חומרה'] === 'גבוהה' && !(String(e['טופל']||'')==='כן' || e['טופל']===true));
  }
  drawEvents(filtered);
};

// SBB 27: Hook into renderEventsTab to inject extras
const _origRenderEventsTab = window.renderEventsTab;
window.renderEventsTab = function(root) {
  if (_origRenderEventsTab) _origRenderEventsTab(root);
  setTimeout(() => { renderBehaviorStatsBar(); injectQuickFilters(); }, 50);
};

// SBB 28: Stats dashboard endpoint for sidebar
window.getQuickStats = function() {
  return {
    students: (_allStudents||[]).filter(s => (s['סטטוס']||'פעיל') !== 'סיים').length,
    events: (_events||[]).length,
    tasksOpen: (_tasks||[]).filter(t => t['סטטוס'] !== 'הושלם').length,
    projectsActive: (_projects||[]).filter(p => p['סטטוס'] !== 'הושלם').length,
    sigsPending: (window._bfSignatures||[]).filter(s => s['סטטוס'] === 'מחכה').length,
  };
};

// SBB 29: Auto-save indicator
let _lastSaveTime = Date.now();
window.markSaved = function() { _lastSaveTime = Date.now(); updateSaveIndicator(); };
window.updateSaveIndicator = function() {
  let el = document.getElementById('save-indicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'save-indicator';
    el.style.cssText = 'position:fixed;top:14px;left:14px;background:#16a34a;color:#fff;padding:4px 10px;border-radius:14px;font-size:11px;z-index:9995;font-family:Heebo,Arial;direction:rtl;box-shadow:0 2px 8px rgba(22,163,74,0.3);display:none';
    document.body.appendChild(el);
  }
  const ago = Math.round((Date.now() - _lastSaveTime) / 1000);
  if (ago < 3) {
    el.textContent = '💾 נשמר';
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 2000);
  }
};

// SBB 30: Mobile-friendly bottom nav for behavior
window.injectMobileNav = function() {
  if (window.innerWidth > 768) return;
  if (location.hash.replace('#','') !== 'behavior') return;
  if (document.getElementById('mobile-bottom-nav')) return;
  const nav = document.createElement('div');
  nav.id = 'mobile-bottom-nav';
  nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e5e7eb;display:flex;justify-content:space-around;padding:8px;z-index:9994;direction:rtl;font-family:Heebo,Arial';
  nav.innerHTML = `
    <button onclick="switchBehaviorTab('events')" style="background:none;border:0;padding:8px;font-size:12px;cursor:pointer">📋<div>אירועים</div></button>
    <button onclick="switchBehaviorTab('tasks')" style="background:none;border:0;padding:8px;font-size:12px;cursor:pointer">✅<div>משימות</div></button>
    <button onclick="switchBehaviorTab('projects')" style="background:none;border:0;padding:8px;font-size:12px;cursor:pointer">📊<div>פרויקטים</div></button>
    <button onclick="switchBehaviorTab('card')" style="background:none;border:0;padding:8px;font-size:12px;cursor:pointer">👤<div>תלמיד</div></button>`;
  document.body.appendChild(nav);
};
window.addEventListener('hashchange', () => {
  injectMobileNav();
  if (location.hash.replace('#','') !== 'behavior') {
    const n = document.getElementById('mobile-bottom-nav'); if (n) n.remove();
  }
});
setTimeout(injectMobileNav, 1000);

// SBB 31: Floating dark-mode toggle (top-left)
(function injectDarkToggle() {
  if (document.getElementById('bht-dark-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'bht-dark-btn';
  btn.className = 'bht-dark-toggle';
  btn.innerHTML = '🌙';
  btn.title = 'מצב כהה';
  btn.onclick = () => {
    toggleDarkMode();
    btn.innerHTML = document.documentElement.classList.contains('dark-mode') ? '☀️' : '🌙';
  };
  // Initial icon based on current mode
  if (document.documentElement.classList.contains('dark-mode')) btn.innerHTML = '☀️';
  if (document.readyState !== 'loading') document.body.appendChild(btn);
  else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
})();

// SBB 32: Undo system for behavior deletions (5-second window)
window._bhtUndoStack = [];
window.recordUndo = function(type, data) {
  window._bhtUndoStack.push({ type, data, time: Date.now() });
  if (window._bhtUndoStack.length > 5) window._bhtUndoStack.shift();
  showUndoToast(type);
};
window.showUndoToast = function(type) {
  let el = document.getElementById('undo-toast');
  if (el) el.remove();
  el = document.createElement('div');
  el.id = 'undo-toast';
  el.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1f2937;color:#fff;padding:12px 16px;border-radius:10px;display:flex;gap:12px;align-items:center;z-index:9999;font-family:Heebo,Arial;direction:rtl;box-shadow:0 8px 24px rgba(0,0,0,0.3)';
  el.innerHTML = `<span>${type} נמחק</span> <button onclick="bhtUndo()" style="background:#3b82f6;color:#fff;border:0;padding:6px 12px;border-radius:6px;cursor:pointer;font-family:inherit">בטל</button>`;
  document.body.appendChild(el);
  setTimeout(() => el?.remove(), 5000);
};
window.bhtUndo = async function() {
  const entry = window._bhtUndoStack.pop();
  if (!entry) return alert('אין מה לבטל');
  const apiMap = { event: 'addBehavior', task: 'addTask', project: 'addProject', signature: 'addSignature' };
  const fn = apiMap[entry.type] || apiMap.event;
  await api(fn, [entry.data]);
  if (typeof toast === 'function') toast('בוטל', 'success');
  if (typeof renderBehavior === 'function') renderBehavior();
  document.getElementById('undo-toast')?.remove();
};

// SBB 33: hover preview on student names in events
document.addEventListener('mouseover', (e) => {
  const card = e.target.closest('[data-student-id]');
  if (!card || card.dataset.hoverShown) return;
  card.dataset.hoverShown = '1';
  setTimeout(() => { card.dataset.hoverShown = ''; }, 1000);
});

// SBB 34: console banner so devs/users know what version is running
console.log('%c🎓 בית התלמוד - מעקב התנהגות v2.0%c\n%cנטענו %d אירועים, %d משימות, %d פרויקטים, %d חתימות',
  'font-size:18px;font-weight:bold;color:#0066cc',
  '',
  'color:#6b7280',
  (window._events||[]).length,
  (window._tasks||[]).length,
  (window._projects||[]).length,
  (window._bfSignatures||[]).length
);
