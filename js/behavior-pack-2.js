// behavior-pack-2.js — sbbs 51-70. 2026-05-24.

// SBB 51: Bulk select bar for events tab
window.bulkSelected = new Set();
window.toggleBulkSelect = function(id) {
  if (window.bulkSelected.has(id)) window.bulkSelected.delete(id);
  else window.bulkSelected.add(id);
  renderBulkBar();
};
window.renderBulkBar = function() {
  let el = document.getElementById('bulk-bar');
  if (window.bulkSelected.size === 0) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('div');
    el.id = 'bulk-bar';
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0066cc;color:#fff;padding:12px 20px;border-radius:30px;box-shadow:0 8px 24px rgba(0,102,204,0.4);z-index:9990;display:flex;gap:12px;align-items:center;font-family:Heebo,Arial;direction:rtl';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <strong>${window.bulkSelected.size} נבחרו</strong>
    <button onclick="bulkApprove()" style="background:#16a34a;color:#fff;border:0;padding:6px 14px;border-radius:18px;cursor:pointer;font-family:inherit">✓ אשר הכל</button>
    <button onclick="bulkDelete()" style="background:#dc2626;color:#fff;border:0;padding:6px 14px;border-radius:18px;cursor:pointer;font-family:inherit">🗑 מחק</button>
    <button onclick="window.bulkSelected.clear();renderBulkBar();renderBehavior()" style="background:transparent;color:#fff;border:1px solid #fff;padding:6px 14px;border-radius:18px;cursor:pointer;font-family:inherit">ביטול</button>`;
};
window.bulkApprove = async function() {
  for (const id of window.bulkSelected) {
    const ev = (window._events||[]).find(x => String(x['מזהה']) === String(id));
    if (ev) { ev['סטטוס_אישור'] = 'מאושר'; await api('updateBehavior', [ev]); }
  }
  window.bulkSelected.clear();
  if (typeof toast === 'function') toast('כולם אושרו', 'success');
  renderBehavior();
};
window.bulkDelete = async function() {
  if (!confirm(`למחוק ${window.bulkSelected.size} פריטים?`)) return;
  for (const id of window.bulkSelected) {
    await api('deleteBehavior', [parseInt(id)]);
  }
  window.bulkSelected.clear();
  if (typeof toast === 'function') toast('נמחקו', 'success');
  renderBehavior();
};

// SBB 52: Mini chart of events per day (last 14 days)
window.renderEventsTrendChart = function() {
  if (sessionStorage.getItem('behavior_tab') !== 'events') return;
  if (document.getElementById('events-trend-chart')) return;
  const bList = document.getElementById('b-list');
  if (!bList) return;
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i*86400000);
    const key = d.toISOString().slice(0,10);
    const count = (window._events||[]).filter(e => (e['תאריך']||'').startsWith(key)).length;
    days.push({ day: d.getDate(), count, key });
  }
  const max = Math.max(...days.map(d => d.count), 1);
  const bars = days.map(d => {
    const h = Math.round((d.count / max) * 36);
    return `<div title="${d.key}: ${d.count}" style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1">
      <div style="width:100%;height:${h}px;background:linear-gradient(180deg,#0066cc,#007aff);border-radius:3px 3px 0 0;min-height:2px"></div>
      <div style="font-size:9px;color:#6b7280">${d.day}</div>
    </div>`;
  }).join('');
  const chart = document.createElement('div');
  chart.id = 'events-trend-chart';
  chart.className = 'card p-2 mb-3';
  chart.innerHTML = `
    <div class="small text-muted mb-1">אירועים ב-14 ימים אחרונים</div>
    <div style="display:flex;align-items:flex-end;gap:3px;height:50px">${bars}</div>`;
  bList.parentNode.insertBefore(chart, bList);
};

// SBB 53: Modal close on click outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal') && e.target.classList.contains('show')) {
    try { bootstrap.Modal.getInstance(e.target)?.hide(); } catch(_) {}
  }
});

// SBB 54: Smart copy event text to clipboard
window.copyEventToClipboard = function(eventId) {
  const e = (window._events||[]).find(x => String(x['מזהה']) === String(eventId));
  if (!e) return;
  const text = `${e['שם תלמיד']||''} - ${e['קטגוריה']||''} - ${e['חומרה']||''}\n${e['תיאור']||''}\nתאריך: ${e['תאריך']?new Date(e['תאריך']).toLocaleString('he-IL'):''}`;
  navigator.clipboard.writeText(text);
  if (typeof toast === 'function') toast('הועתק', 'success');
};

// SBB 55: Quick add to current student card
window.quickAddForStudent = function(studentId) {
  if (typeof addEventModal === 'function') {
    addEventModal();
    setTimeout(() => {
      const sel = document.getElementById('ne-student');
      if (sel) sel.value = studentId;
    }, 300);
  }
};

// SBB 56: Recent students dropdown - last 5 students you reported on
const RECENT_KEY = 'bht_recent_students';
window.trackRecentStudent = function(studentId) {
  if (!studentId) return;
  try {
    let recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    recent = [studentId, ...recent.filter(s => s !== studentId)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch(_) {}
};
window.getRecentStudents = function() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
};

// SBB 57: Hook into saveEvent to track recents
const _origSaveEvent = window.saveEvent;
if (_origSaveEvent) {
  window.saveEvent = async function(event) {
    const sid = document.getElementById('ne-student')?.value;
    if (sid) trackRecentStudent(sid);
    return _origSaveEvent(event);
  };
}

// SBB 58: Show recent students on top of student selectors
window.augmentStudentSelectors = function() {
  const recent = getRecentStudents();
  if (!recent.length) return;
  document.querySelectorAll('select[id$="-student"], select[id="ne-student"], select[id="t-student"]').forEach(sel => {
    if (sel.dataset.augmented) return;
    sel.dataset.augmented = '1';
    const recentOpts = recent.map(sid => {
      const s = (window._allStudents||[]).find(x => String(x['מזהה']) === String(sid));
      if (!s) return null;
      return `<option value="${sid}">⭐ ${(s['שם פרטי']||'')} ${(s['שם משפחה']||'')}</option>`;
    }).filter(Boolean).join('');
    if (recentOpts) {
      const header = document.createElement('optgroup');
      header.label = 'אחרונים';
      header.innerHTML = recentOpts;
      sel.insertBefore(header, sel.firstChild.nextSibling);
    }
  });
};
// run on modal open
const _origAddEventModal = window.addEventModal;
if (_origAddEventModal) {
  window.addEventModal = function() {
    _origAddEventModal();
    setTimeout(augmentStudentSelectors, 300);
  };
}

// SBB 59: Toggle severity quickly from card
window.toggleSeverity = async function(eventId) {
  const e = (window._events||[]).find(x => String(x['מזהה']) === String(eventId));
  if (!e) return;
  const order = ['נמוכה', 'בינונית', 'גבוהה'];
  const idx = order.indexOf(e['חומרה']);
  e['חומרה'] = order[(idx + 1) % order.length];
  await api('updateBehavior', [e]);
  if (typeof toast === 'function') toast(`חומרה: ${e['חומרה']}`, 'success');
  renderBehavior();
};

// SBB 60: Print specific student's full card
window.printStudentCard = function(studentId) {
  sessionStorage.setItem('behavior_tab', 'card');
  sessionStorage.setItem('bc_selected_student', studentId);
  if (typeof switchBehaviorTab === 'function') switchBehaviorTab('card');
  setTimeout(() => {
    if (typeof bcPrintCard === 'function') bcPrintCard();
  }, 800);
};

// SBB 61: Today summary widget at top of home
window.todaySummary = function() {
  const today = new Date().toISOString().slice(0,10);
  const evToday = (window._events||[]).filter(e => (e['תאריך']||'').startsWith(today)).length;
  const tasksToday = (window._tasks||[]).filter(t => (t['תאריך_יצירה']||'').startsWith(today)).length;
  return `📋 ${evToday} אירועים, ✅ ${tasksToday} משימות חדשות היום`;
};

// SBB 62: Color category visualization
window.colorForCategory = function(cat) {
  // Hash cat to consistent color
  let h = 0;
  for (let i = 0; i < (cat||'').length; i++) h = (h * 31 + cat.charCodeAt(i)) % 360;
  return `hsl(${h}, 60%, 55%)`;
};

// SBB 63: Auto-scroll to new item
window.scrollToNewItem = function(id) {
  setTimeout(() => {
    const el = document.querySelector(`[data-item-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 500);
};

// SBB 64: Window title with unread count
let lastTitleUpdate = 0;
function tickTitleUpdate() {
  if (Date.now() - lastTitleUpdate < 30000) return;
  lastTitleUpdate = Date.now();
  if (typeof updateBrowserTitle === 'function') updateBrowserTitle();
}
setInterval(tickTitleUpdate, 30000);

// SBB 65: Focus search on '/' key
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea,select')) return;
  if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    if (typeof openBehaviorSearch === 'function') openBehaviorSearch();
  }
});

console.log('%c✅ Pack-2 (sbbs 51-65) loaded', 'color:#16a34a;font-weight:bold');
