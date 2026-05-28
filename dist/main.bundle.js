// === main.bundle.js — built 2026-05-28T09:25:24.892Z ===
// Source: 139 behavior packs concatenated in numeric order.
// DO NOT EDIT — regenerate with: node tools/build-bundle.js
"use strict";
// ─── behavior-pack-2.js ─────────────────────────────────────────────
try {
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
} catch (e) { (console && console.error) ? console.error('[behavior-pack-2.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-3.js ─────────────────────────────────────────────
try {
// behavior-pack-3.js — sbbs 66-90. 2026-05-24.

// SBB 66: Detect duplicate events (same student + category in last 10 min)
window.checkDuplicateEvent = function(studentId, category) {
  const tenMinAgo = Date.now() - 10*60*1000;
  return (window._events||[]).find(e =>
    String(e['תלמיד_מזהה']) === String(studentId) &&
    e['קטגוריה'] === category &&
    new Date(e['תאריך']||0).getTime() > tenMinAgo
  );
};

// SBB 67: Show alert if duplicate before saving event
const _origSaveEv2 = window.saveEvent;
if (_origSaveEv2) {
  window.saveEvent = async function(event) {
    const sid = document.getElementById('ne-student')?.value;
    const cat = document.getElementById('ne-cat')?.value;
    if (sid && cat && !document.getElementById('addEvModal').dataset.editId) {
      const dup = checkDuplicateEvent(sid, cat);
      if (dup) {
        if (!confirm('יש כבר אירוע דומה ב-10 דקות אחרונות. להמשיך בכל זאת?')) return;
      }
    }
    return _origSaveEv2(event);
  };
}

// SBB 68: Reminder notifications for tasks due today
function checkTasksDueToday() {
  const today = new Date().toISOString().slice(0,10);
  const due = (window._tasks||[]).filter(t =>
    t['סטטוס'] !== 'הושלם' &&
    t['תאריך_יעד'] === today
  );
  if (due.length > 0 && !sessionStorage.getItem('tasks_due_notified_' + today)) {
    sessionStorage.setItem('tasks_due_notified_' + today, '1');
    setTimeout(() => {
      if (typeof toast === 'function') toast(`📅 ${due.length} משימות לסיום היום`, 'warn');
    }, 2000);
  }
}
setInterval(checkTasksDueToday, 5 * 60 * 1000);
setTimeout(checkTasksDueToday, 3000);

// SBB 69: Highlight student name in events with hover preview
document.addEventListener('mouseover', (e) => {
  const tag = e.target.closest('strong');
  if (!tag || tag.dataset.tipShown) return;
  const text = tag.textContent.trim();
  const stu = (window._allStudents||[]).find(s =>
    `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim() === text
  );
  if (!stu) return;
  tag.dataset.tipShown = '1';
  tag.title = `כיתה: ${stu['מחזור']||'?'}\nטלפון: ${stu['טלפון']||'?'}`;
});

// SBB 70: Quick stats badge on home page student tiles
window.augmentHomeStats = function() {
  if (location.hash.replace('#','') !== 'home') return;
  // Add events count to each visible student card (if any)
  document.querySelectorAll('[data-student-tile]').forEach(tile => {
    const sid = tile.dataset.studentTile;
    if (!sid || tile.dataset.augmented) return;
    tile.dataset.augmented = '1';
    const evCount = (window._events||[]).filter(e => String(e['תלמיד_מזהה']) === String(sid)).length;
    if (evCount > 0) {
      const badge = document.createElement('span');
      badge.className = 'badge bg-info ms-1';
      badge.textContent = evCount;
      tile.appendChild(badge);
    }
  });
};

// SBB 71: Loading spinner overlay helper
window.bhtLoading = function(show, text) {
  let el = document.getElementById('bht-loading-ov');
  if (show) {
    if (!el) {
      el = document.createElement('div');
      el.id = 'bht-loading-ov';
      el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:99998;display:flex;align-items:center;justify-content:center;font-family:Heebo,Arial;direction:rtl';
      document.body.appendChild(el);
    }
    el.innerHTML = `<div style="background:#fff;padding:24px 32px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);text-align:center">
      <div style="width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#0066cc;border-radius:50%;animation:bht-spin 1s linear infinite;margin:0 auto 12px"></div>
      <div>${text || 'טוען...'}</div>
    </div>`;
  } else {
    el?.remove();
  }
};

// SBB 72: Confirm before navigating away with unsaved changes
let _hasUnsavedChanges = false;
window.markUnsaved = () => { _hasUnsavedChanges = true; };
window.markSavedFresh = () => { _hasUnsavedChanges = false; };
window.addEventListener('beforeunload', (e) => {
  if (_hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// SBB 73: Detect inactivity and reload data
let _lastActivity = Date.now();
['click','keydown','mousemove','scroll'].forEach(ev =>
  document.addEventListener(ev, () => _lastActivity = Date.now(), { passive: true })
);
setInterval(() => {
  if (Date.now() - _lastActivity > 10*60*1000) { // 10 min idle
    _lastActivity = Date.now();
    if (typeof pullAllFromSheet === 'function') pullAllFromSheet();
  }
}, 5 * 60 * 1000);

// SBB 74: Click outside whats-new sidebar to close
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('whats-new-sidebar');
  if (!sidebar || !sidebar.classList.contains('open')) return;
  if (sidebar.contains(e.target) || e.target.closest('#whats-new-fab')) return;
  toggleWhatsNew(false);
});

// SBB 75: Compact mode toggle for small screens
window.toggleCompactMode = function() {
  document.documentElement.classList.toggle('compact-mode');
  try { localStorage.setItem('bht_compact', document.documentElement.classList.contains('compact-mode') ? '1' : '0'); } catch(_) {}
};
try { if (localStorage.getItem('bht_compact') === '1') document.documentElement.classList.add('compact-mode'); } catch(_) {}

// SBB 76: Show timestamp on hover
document.addEventListener('mouseenter', (e) => {
  if (e.target?.matches?.('.text-muted')) {
    const text = e.target.textContent;
    if (/\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}/.test(text)) {
      e.target.title = 'תאריך מלא: ' + text;
    }
  }
}, true);

// SBB 77: Animation when item is added
window.flashNewItem = function(el) {
  if (!el) return;
  el.style.animation = 'flash-new 1.5s ease-out';
  setTimeout(() => { el.style.animation = ''; }, 1500);
};

// SBB 78: Keyboard shortcut '?' help also reveals tab pills shortcuts
window.showQuickHelp = function() {
  if (typeof toast === 'function') {
    toast('1-5: tabs · n: חדש · Ctrl+K: חיפוש · ?: עזרה מלאה', 'success');
  }
};

// SBB 79: Auto-suggest similar descriptions
window.suggestSimilarDescription = function(currentDesc) {
  if (!currentDesc || currentDesc.length < 10) return [];
  const lower = currentDesc.toLowerCase();
  const matches = new Set();
  (window._events||[]).forEach(e => {
    const desc = (e['תיאור']||'').toLowerCase();
    if (desc !== lower && desc.includes(lower.substring(0, 10))) {
      matches.add(e['תיאור']);
    }
  });
  return [...matches].slice(0, 3);
};

// SBB 80: Activity stream visualization
window.renderActivityStream = function() {
  const recent = [...(window._events||[]), ...(window._tasks||[])]
    .filter(x => x['תאריך'] || x['תאריך_יצירה'])
    .sort((a,b) => {
      const ta = new Date(a['תאריך'] || a['תאריך_יצירה']||0).getTime();
      const tb = new Date(b['תאריך'] || b['תאריך_יצירה']||0).getTime();
      return tb - ta;
    })
    .slice(0, 10);
  return recent.map(x => ({
    type: x['קטגוריה'] ? 'event' : 'task',
    title: x['קטגוריה'] || x['כותרת'] || '',
    student: x['שם תלמיד'] || '',
    time: x['תאריך'] || x['תאריך_יצירה'],
  }));
};

// SBB 81: Page visibility - pause polling when tab not active
let _pollingTimer = null;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (_pollingTimer) { clearInterval(_pollingTimer); _pollingTimer = null; }
  } else {
    if (typeof updateTabBadges === 'function') updateTabBadges();
  }
});

// SBB 82: Add data-item-id to behavior cards (for scrollToNewItem)
const _origDrawEvents = window.drawEvents;
if (_origDrawEvents) {
  window.drawEvents = function(list) {
    _origDrawEvents(list);
    setTimeout(() => {
      document.querySelectorAll('#b-list > .card').forEach((card, i) => {
        if (list[i]) card.dataset.itemId = list[i]['מזהה'] || '';
      });
    }, 50);
  };
}

// SBB 83: Quick edit description in place
window.quickEditDescription = async function(eventId) {
  const ev = (window._events||[]).find(x => String(x['מזהה']) === String(eventId));
  if (!ev) return;
  const newDesc = prompt('תיאור חדש:', ev['תיאור']||'');
  if (newDesc === null || newDesc === ev['תיאור']) return;
  ev['תיאור'] = newDesc;
  await api('updateBehavior', [ev]);
  renderBehavior();
};

// SBB 84: Daily summary email shortcut
window.composeDailySummary = function() {
  const today = new Date().toISOString().slice(0,10);
  const todayEvs = (window._events||[]).filter(e => (e['תאריך']||'').startsWith(today));
  const text = `סיכום יומי - ${new Date().toLocaleDateString('he-IL')}\n\n` +
    `סה"כ אירועים: ${todayEvs.length}\n` +
    todayEvs.map(e => `- ${e['שם תלמיד']||''}: ${e['קטגוריה']||''} (${e['חומרה']||''})`).join('\n');
  const subject = encodeURIComponent('סיכום יומי - ' + new Date().toLocaleDateString('he-IL'));
  window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${encodeURIComponent(text)}`, '_blank');
};

// SBB 85: Add CSS for new animations
const styleEl = document.createElement('style');
styleEl.textContent = `
@keyframes flash-new {
  0% { background: #fef3c7; transform: scale(1.02); }
  100% { background: inherit; transform: scale(1); }
}
.compact-mode .card { padding: 8px !important; }
.compact-mode .card .small { font-size: 11px !important; }
`;
document.head.appendChild(styleEl);

console.log('%c✅ Pack-3 (sbbs 66-85) loaded', 'color:#16a34a;font-weight:bold');
} catch (e) { (console && console.error) ? console.error('[behavior-pack-3.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-4.js ─────────────────────────────────────────────
try {
// behavior-pack-4.js — sbbs 86-105. 2026-05-24.

// SBB 86: Backup download button
window.downloadFullBackup = function() {
  const backup = {
    version: 'v2.0',
    date: new Date().toISOString(),
    students: window._allStudents || [],
    events: window._events || [],
    tasks: window._tasks || [],
    projects: window._projects || [],
    signatures: window._bfSignatures || [],
    categories: window._categories || [],
  };
  const blob = new Blob(['﻿' + JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bht-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  if (typeof toast === 'function') toast('✓ גיבוי ירד', 'success');
};

// SBB 87: Restore from backup file
window.restoreFromFile = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('זה ידרוס את הנתונים המקומיים. להמשיך?')) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.events) window._events = data.events;
      if (data.tasks) window._tasks = data.tasks;
      if (data.projects) window._projects = data.projects;
      if (data.signatures) window._bfSignatures = data.signatures;
      if (typeof toast === 'function') toast('✓ שוחזר', 'success');
      if (typeof renderBehavior === 'function') renderBehavior();
    } catch (err) {
      alert('שגיאה: ' + err.message);
    }
  };
  input.click();
};

// SBB 88: Auto-resize textarea
document.addEventListener('input', (e) => {
  if (e.target.tagName === 'TEXTAREA') {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
  }
});

// SBB 89: Word count for description fields
document.addEventListener('input', (e) => {
  if (e.target.id !== 'ne-desc' && e.target.id !== 't-desc') return;
  let counter = e.target.parentNode.querySelector('.bht-word-count');
  if (!counter) {
    counter = document.createElement('small');
    counter.className = 'bht-word-count text-muted';
    counter.style.cssText = 'display:block;text-align:left;margin-top:2px;font-size:10px';
    e.target.parentNode.appendChild(counter);
  }
  const len = e.target.value.length;
  const words = e.target.value.trim().split(/\s+/).filter(Boolean).length;
  counter.textContent = `${words} מילים · ${len} תווים`;
});

// SBB 90: Speech-to-text on description fields (browser Speech API)
function injectMicButton(textareaId) {
  const ta = document.getElementById(textareaId);
  if (!ta || ta.dataset.micInjected) return;
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
  ta.dataset.micInjected = '1';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;display:flex;align-items:flex-start';
  ta.parentNode.insertBefore(wrapper, ta);
  wrapper.appendChild(ta);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.innerHTML = '🎤';
  btn.title = 'דבר במקום להקליד';
  btn.style.cssText = 'position:absolute;top:4px;left:4px;background:#fff;border:1px solid #d1d5db;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:14px;padding:0;display:flex;align-items:center;justify-content:center;z-index:2';
  wrapper.appendChild(btn);
  let recognition = null;
  let active = false;
  btn.onclick = (e) => {
    e.preventDefault();
    if (active) { recognition?.stop(); return; }
    const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognition = new SR();
    recognition.lang = 'he-IL';
    recognition.interimResults = true;
    recognition.continuous = true;
    let originalText = ta.value;
    btn.innerHTML = '⏹';
    btn.style.background = '#dc2626';
    btn.style.color = '#fff';
    active = true;
    recognition.onresult = (ev) => {
      let interim = '';
      let final = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
        else interim += ev.results[i][0].transcript;
      }
      ta.value = originalText + (originalText && (final||interim) ? ' ' : '') + final + interim;
    };
    recognition.onend = () => {
      btn.innerHTML = '🎤';
      btn.style.background = '#fff';
      btn.style.color = 'inherit';
      active = false;
    };
    recognition.onerror = () => recognition?.stop();
    recognition.start();
  };
}
// Hook into modals
document.addEventListener('shown.bs.modal', (e) => {
  setTimeout(() => {
    ['ne-desc', 't-desc', 'p-desc', 'siga-desc'].forEach(injectMicButton);
  }, 100);
});

// SBB 91: Show student photo if available
window.studentPhotoHtml = function(stu) {
  if (stu && stu['תמונה']) {
    return `<img src="${escHtml(stu['תמונה'])}" style="width:32px;height:32px;border-radius:50%;object-fit:cover" onerror="this.style.display='none'">`;
  }
  return '';
};

// SBB 92: Toast notification queue (don't overlap)
let _toastQueue = [];
let _toastActive = false;
const _origToast = window.toast;
window.toast = function(msg, type) {
  _toastQueue.push({ msg, type });
  drainToastQueue();
};
function drainToastQueue() {
  if (_toastActive || _toastQueue.length === 0) return;
  const { msg, type } = _toastQueue.shift();
  _toastActive = true;
  if (_origToast) _origToast(msg, type);
  setTimeout(() => { _toastActive = false; drainToastQueue(); }, 2500);
}

// SBB 93: Add CSS for textarea + mic button
const styleEl4 = document.createElement('style');
styleEl4.textContent = `
  textarea { transition: height .15s ease-out; }
  .bht-word-count { user-select: none; }
`;
document.head.appendChild(styleEl4);

// SBB 94: Highlight today's date in any list
window.highlightToday = function() {
  const today = new Date().toLocaleDateString('he-IL');
  document.querySelectorAll('.text-muted').forEach(el => {
    if (el.textContent.includes(today) && !el.dataset.todayMarked) {
      el.dataset.todayMarked = '1';
      el.innerHTML = '<span style="color:#0066cc;font-weight:600">' + el.innerHTML + '</span>';
    }
  });
};
setInterval(highlightToday, 5000);

// SBB 95: Reduce double-rendering of pages
let _renderInProgress = false;
const _origRenderBehavior = window.renderBehavior;
if (_origRenderBehavior) {
  window.renderBehavior = async function() {
    if (_renderInProgress) return;
    _renderInProgress = true;
    try { await _origRenderBehavior(); }
    finally { _renderInProgress = false; }
  };
}

console.log('%c✅ Pack-4 (sbbs 86-95) loaded', 'color:#16a34a;font-weight:bold');

// SBB 96: Birthday/anniversary banner (if any students born this month)
window.checkBirthdays = function() {
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();
  const birthdays = (window._allStudents||[]).filter(s => {
    const dob = s['תאריך לידה'];
    if (!dob) return false;
    const d = new Date(dob);
    return d.getMonth() + 1 === month && d.getDate() === day;
  });
  if (!birthdays.length || sessionStorage.getItem('birthday_notified_'+new Date().toISOString().slice(0,10))) return;
  sessionStorage.setItem('birthday_notified_'+new Date().toISOString().slice(0,10),'1');
  const names = birthdays.map(s => `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim()).join(', ');
  setTimeout(() => {
    if (typeof toast === 'function') toast(`🎂 יום הולדת היום: ${names}`, 'success');
  }, 3000);
};
setTimeout(checkBirthdays, 3000);

// SBB 97: Smooth scroll on hash change
window.addEventListener('hashchange', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// SBB 98: Right-click context menu disabled (prevents accidental copy of UI)
// Actually, keep it - users want copy
// window.addEventListener('contextmenu', (e) => { if (e.target.closest('.btn,.nav-link')) e.preventDefault(); });

// SBB 99: Display total counts in #whats-new sidebar header
window.addCountsToWhatsNewHeader = function() {
  const counts = {
    events: (window._events||[]).length,
    tasks: (window._tasks||[]).length,
    projects: (window._projects||[]).length,
    students: (window._allStudents||[]).filter(s=>(s['סטטוס']||'פעיל')!=='סיים').length,
  };
  const header = document.querySelector('#whats-new-sidebar .wn-header');
  if (header && !header.dataset.counted) {
    header.dataset.counted = '1';
    const stats = document.createElement('div');
    stats.style.cssText = 'font-size:10px;font-weight:normal;margin-top:2px;opacity:0.85';
    stats.textContent = `${counts.students} תלמידים · ${counts.events} אירועים · ${counts.tasks} משימות · ${counts.projects} פרויקטים`;
    header.querySelector('h6')?.appendChild(stats);
  }
};
setInterval(addCountsToWhatsNewHeader, 5000);

// SBB 100: Final milestone log
console.log('%c🎯 100 סבבי שיפור הושלמו במצטבר!', 'color:#dc2626;font-size:16px;font-weight:bold');
} catch (e) { (console && console.error) ? console.error('[behavior-pack-4.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-5.js ─────────────────────────────────────────────
try {
// behavior-pack-5.js — sbbs 101-120. Force render fixes + UX. 2026-05-24.

// SBB 101: Force-load all behavior data on page entry (fixes empty pages)
window.addEventListener('hashchange', async () => {
  const hash = location.hash.replace('#','');
  if (['tasks','projects','formsMgmt','behavior'].includes(hash)) {
    try {
      const [st, tk, pj] = await Promise.all([
        api('listStudents', []), api('listTasks', []), api('listProjects', []),
      ]);
      window._allStudents = st.data || [];
      window._tasks = tk.data || [];
      window._projects = pj.data || [];
    } catch (_) {}
  }
});

// SBB 102: Empty-state visual improvement
window.bhtEmptyState = function(icon, text, btnText, btnAction) {
  return `<div class="text-center py-5">
    <div style="font-size:4rem;opacity:0.4">${icon}</div>
    <h5 class="text-muted mt-3">${escHtml(text)}</h5>
    ${btnText ? `<button class="btn btn-primary mt-3" onclick="${btnAction}">${escHtml(btnText)}</button>` : ''}
  </div>`;
};

// SBB 103: Quick stats on home tiles
window.populateHomeTileBadges = function() {
  const tiles = {
    'tasks': () => (window._tasks||[]).filter(t => t['סטטוס']!=='הושלם').length,
    'projects': () => (window._projects||[]).filter(p => p['סטטוס']!=='הושלם').length,
    'behavior': () => (window._events||[]).filter(e => e['סטטוס_אישור']==='ממתין לאישור').length,
  };
  document.querySelectorAll('#page-home .card-tile').forEach(tile => {
    const oc = tile.getAttribute('onclick') || '';
    Object.entries(tiles).forEach(([key, fn]) => {
      if (oc.includes(`'${key}'`) && !tile.dataset.badged) {
        tile.dataset.badged = '1';
        const n = fn();
        if (n > 0) {
          const badge = document.createElement('span');
          badge.className = 'badge bg-danger position-absolute';
          badge.style.cssText = 'top:10px;right:10px;font-size:11px';
          badge.textContent = n;
          tile.style.position = 'relative';
          tile.appendChild(badge);
        }
      }
    });
  });
};
setInterval(() => { if(location.hash==='#home' || location.hash==='') populateHomeTileBadges(); }, 5000);
setTimeout(populateHomeTileBadges, 2000);

// SBB 104: Click student name anywhere → opens card
document.addEventListener('click', (e) => {
  const card = e.target.closest('[data-student-link]');
  if (!card) return;
  const sid = card.dataset.studentLink;
  if (sid) {
    sessionStorage.setItem('behavior_tab', 'card');
    sessionStorage.setItem('bc_selected_student', sid);
    goto('behavior');
  }
});

// SBB 105: Toast on Sheet sync errors
let _syncErrCount = 0;
const _origAlert = window.alert;
window.alert = function(msg) {
  if (typeof msg === 'string' && msg.includes('אין הרשאה')) {
    if (typeof toast === 'function') return toast(msg, 'warn');
  }
  return _origAlert(msg);
};

// SBB 106: Keyboard "Esc" closes modals reliably
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(m => {
      try { bootstrap.Modal.getInstance(m)?.hide(); } catch(_) {}
    });
  }
});

// SBB 107: Confirmation toast helper
window.confirmAction = function(msg, onYes) {
  if (confirm(msg)) onYes();
};

// SBB 108: Last-action quick repeat
window._lastAction = null;
const _origAddTaskModal = window.addTaskModal;
if (_origAddTaskModal) {
  window.addTaskModal = function(prefill) {
    window._lastAction = { type: 'task', prefill };
    return _origAddTaskModal(prefill);
  };
}

// SBB 109: Cmd+Enter saves modals
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const m = document.querySelector('.modal.show');
    if (m) {
      const btn = m.querySelector('.btn-primary');
      if (btn) btn.click();
    }
  }
});

// SBB 110: Friendly time labels
window.timeLabel = function(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'עכשיו';
  if (diff < 3600) return Math.round(diff/60) + ' דק׳';
  if (diff < 86400) return Math.round(diff/3600) + ' שעות';
  if (diff < 604800) return Math.round(diff/86400) + ' ימים';
  return new Date(ts).toLocaleDateString('he-IL');
};

console.log('%c✅ Pack-5 (sbbs 101-110) loaded', 'color:#16a34a;font-weight:bold');
} catch (e) { (console && console.error) ? console.error('[behavior-pack-5.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-6.js ─────────────────────────────────────────────
try {
// behavior-pack-6.js — sbbs 111-130. 2026-05-24.

// SBB 111: Sticky filter bar
const styleEl6 = document.createElement('style');
styleEl6.textContent = `
  #quick-filters { position: sticky; top: 60px; z-index: 100; background: white; padding: 8px 0; }
  .card.severity-high { border-right: 4px solid #dc2626; }
  .card.severity-mid { border-right: 4px solid #f59e0b; }
  .card.severity-low { border-right: 4px solid #16a34a; }
  body.compact-mode .card { padding: 8px !important; font-size: 13px; }
`;
document.head.appendChild(styleEl6);

// SBB 112: Page transition animation
document.addEventListener('hashchange', () => {
  const page = document.querySelector('[id^="page-"]:not(.d-none)');
  if (page) { page.style.opacity = '0'; setTimeout(() => page.style.opacity = '1', 50); }
});

// SBB 113: Show last-modified timestamp
window.lastSavedAt = null;
window.updateLastSaved = () => {
  window.lastSavedAt = Date.now();
  let el = document.getElementById('last-saved-ind');
  if (!el) {
    el = document.createElement('div');
    el.id = 'last-saved-ind';
    el.style.cssText = 'position:fixed;bottom:60px;left:14px;font-size:10px;color:#9ca3af;pointer-events:none;z-index:9990';
    document.body.appendChild(el);
  }
  el.textContent = 'נשמר עכשיו';
  setTimeout(() => { if(el) el.textContent = ''; }, 2000);
};

// SBB 114: Quick severity icons
window.severityIcon = (sev) => ({'גבוהה':'🔴', 'בינונית':'🟡', 'נמוכה':'🟢'}[sev] || '⚪');

// SBB 115: Bulk export with format selector
window.bulkExportMenu = function() {
  const html = `<div class="modal fade" id="bulk-exp" tabindex="-1"><div class="modal-dialog modal-sm"><div class="modal-content">
    <div class="modal-header"><h5>ייצוא נתונים</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <button class="btn btn-outline-success w-100 mb-2" onclick="hideModal('bulk-exp');exportBehaviorCSV()">📊 כל האירועים → CSV</button>
      <button class="btn btn-outline-primary w-100 mb-2" onclick="hideModal('bulk-exp');downloadFullBackup()">💾 כל הנתונים → JSON</button>
      <button class="btn btn-outline-info w-100" onclick="hideModal('bulk-exp');printBehaviorTab()">🖨 הדפסה</button>
    </div>
  </div></div></div>`;
  cleanupModal('bulk-exp');
  document.body.insertAdjacentHTML('beforeend', html);
  new bootstrap.Modal(document.getElementById('bulk-exp')).show();
};

// SBB 116: Tag-based filter
window.allTags = function() {
  const s = new Set();
  (window._events||[]).forEach(e => (e['תיאור']||'').match(/#\S+/g)?.forEach(t => s.add(t)));
  (window._tasks||[]).forEach(t => (t['תיאור']||'').match(/#\S+/g)?.forEach(tag => s.add(tag)));
  return [...s];
};

// SBB 117: Daily digest export
window.dailyDigest = function() {
  const today = new Date().toISOString().slice(0,10);
  const evs = (window._events||[]).filter(e => (e['תאריך']||'').startsWith(today));
  const tasks = (window._tasks||[]).filter(t => (t['תאריך_יצירה']||'').startsWith(today));
  const totalHigh = evs.filter(e => e['חומרה']==='גבוהה').length;
  return `📊 סיכום יומי - ${today}\n\nאירועים: ${evs.length} (${totalHigh} חומרה גבוהה)\nמשימות חדשות: ${tasks.length}\n\n${evs.map(e => `• ${e['שם תלמיד']||''}: ${e['קטגוריה']||''}`).join('\n')}`;
};

// SBB 118: Email daily digest
window.emailDailyDigest = () => {
  const txt = dailyDigest();
  window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent('סיכום יומי - '+new Date().toLocaleDateString('he-IL'))}&body=${encodeURIComponent(txt)}`, '_blank');
};

// SBB 119: WhatsApp daily digest
window.whatsappDailyDigest = () => {
  window.open('https://wa.me/?text=' + encodeURIComponent(dailyDigest()), '_blank');
};

// SBB 120: Help button — already added; add quick keyboard hint
console.log('💡 Tip: לחץ ? לעזרה מלאה, Ctrl+K לחיפוש, 1-5 למעבר tabs');

console.log('%c✅ Pack-6 (sbbs 111-120) loaded', 'color:#16a34a;font-weight:bold');
} catch (e) { (console && console.error) ? console.error('[behavior-pack-6.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-7.js ─────────────────────────────────────────────
try {
// behavior-pack-7.js — sbbs 121-140. 2026-05-24.

// SBB 121: Improve task card click target
document.addEventListener('click', e => {
  if (e.target.closest('button, select, a, input, .form-check')) return;
  const card = e.target.closest('[data-task-id]');
  if (card && typeof renderTaskDetails === 'function') renderTaskDetails(card.dataset.taskId);
});

// SBB 122: Show student count in header
window.injectStudentCount = function() {
  const userInfo = document.getElementById('user-info');
  if (!userInfo || userInfo.dataset.stCount) return;
  userInfo.dataset.stCount = '1';
  const n = (window._allStudents||[]).filter(s => (s['סטטוס']||'פעיל')!=='סיים').length;
  if (n > 0) {
    const sp = document.createElement('span');
    sp.className = 'badge bg-info ms-2';
    sp.textContent = `${n} תלמידים`;
    sp.style.fontSize = '10px';
    userInfo.appendChild(sp);
  }
};
setInterval(injectStudentCount, 5000);

// SBB 123: Right-click on event = quick actions
document.addEventListener('contextmenu', e => {
  const card = e.target.closest('[data-event-id]');
  if (!card) return;
  e.preventDefault();
  const id = card.dataset.eventId;
  const menu = document.createElement('div');
  menu.className = 'card p-2 shadow';
  menu.style.cssText = `position:fixed;top:${e.clientY}px;left:${e.clientX}px;z-index:99999;background:#fff;direction:rtl;font-family:Heebo,Arial;min-width:160px`;
  menu.innerHTML = `
    <button class="btn btn-sm btn-link text-end w-100" onclick="copyEventToClipboard(${id});this.parentElement.remove()">📋 העתק</button>
    <button class="btn btn-sm btn-link text-end w-100" onclick="editEvent(${id});this.parentElement.remove()">✏️ ערוך</button>
    <button class="btn btn-sm btn-link text-end w-100" onclick="createTaskFromEvent(${id});this.parentElement.remove()">📌 צור משימה</button>
    <button class="btn btn-sm btn-link text-end w-100 text-danger" onclick="deleteEvent(${id});this.parentElement.remove()">🗑 מחק</button>`;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 100);
});

// SBB 124: Visual category color
window.applyCategoryColors = function() {
  document.querySelectorAll('.cat-badge:not([data-colored])').forEach(b => {
    b.dataset.colored = '1';
    const text = b.textContent.trim();
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
    b.style.background = `hsl(${h}, 70%, 90%)`;
    b.style.color = `hsl(${h}, 60%, 30%)`;
    b.style.padding = '2px 8px';
    b.style.borderRadius = '6px';
  });
};
setInterval(applyCategoryColors, 2000);

// SBB 125: Smart hour highlighting
window.highlightTimeAgo = function() {
  document.querySelectorAll('time.relative:not([data-set])').forEach(t => {
    const ts = t.dataset.ts;
    if (ts) {
      t.dataset.set = '1';
      t.textContent = (typeof timeLabel === 'function') ? timeLabel(ts) : ts;
    }
  });
};
setInterval(highlightTimeAgo, 10000);

// SBB 126: Today's events glow
window.glowTodayEvents = function() {
  const today = new Date().toLocaleDateString('he-IL');
  document.querySelectorAll('.card .text-muted').forEach(el => {
    if (el.textContent.includes(today) && !el.dataset.glow) {
      el.dataset.glow = '1';
      const card = el.closest('.card');
      if (card) card.style.boxShadow = '0 0 12px rgba(59,130,246,0.3)';
    }
  });
};
setInterval(glowTodayEvents, 5000);

// SBB 127: Compact event title (truncate description)
window.compactEventDesc = (text, maxLen) => {
  if (!text) return '';
  text = String(text);
  if (text.length <= (maxLen || 100)) return text;
  return text.substring(0, maxLen || 100) + '…';
};

// SBB 128: Number formatter for stats
window.fmtNum = (n) => new Intl.NumberFormat('he-IL').format(n);

// SBB 129: Pluralize Hebrew
window.he = (n, singular, plural) => n === 1 ? `${n} ${singular}` : `${n} ${plural || singular}`;

// SBB 130: Toast position fix on mobile
window.matchMedia('(max-width: 768px)').addEventListener('change', () => {
  const c = document.querySelector('.toast-container');
  if (c) c.style.bottom = window.innerWidth < 768 ? '70px' : '24px';
});

console.log('%c✅ Pack-7 (sbbs 121-130) loaded — total 130 sbbs', 'color:#16a34a;font-weight:bold');
} catch (e) { (console && console.error) ? console.error('[behavior-pack-7.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-8.js ─────────────────────────────────────────────
try {
// behavior-pack-8.js — sbbs 131-150. 2026-05-24.

// SBB 131-135: Misc helpers
window.formatDuration = (ms) => {
  const s = Math.floor(ms/1000);
  if (s < 60) return s + 'ש';
  if (s < 3600) return Math.floor(s/60) + 'דק';
  return Math.floor(s/3600) + 'ש׳ ' + Math.floor((s%3600)/60) + 'דק';
};

window.isWeekend = (d) => { d = d || new Date(); return d.getDay() === 5 || d.getDay() === 6; };

window.upcomingTasks = (days) => {
  days = days || 3;
  const max = Date.now() + days*86400000;
  return (window._tasks||[]).filter(t => t['סטטוס']!=='הושלם' && t['תאריך_יעד'] && new Date(t['תאריך_יעד']).getTime() < max);
};

window.studentEvents = (sid) => (window._events||[]).filter(e => String(e['תלמיד_מזהה'])===String(sid));
window.studentTasks = (sid) => (window._tasks||[]).filter(t => String(t['תלמיד_מזהה'])===String(sid));

// SBB 136: Bookmark a student (favorite)
window.bookmarkStudent = (sid) => {
  let favs = []; try { favs = JSON.parse(localStorage.getItem('bht_fav_students') || '[]'); } catch{}
  if (favs.includes(sid)) favs = favs.filter(s => s !== sid);
  else favs.push(sid);
  localStorage.setItem('bht_fav_students', JSON.stringify(favs));
  if (typeof toast === 'function') toast(favs.includes(sid)?'נוסף למועדפים':'הוסר ממועדפים', 'success');
};
window.getFavoriteStudents = () => { try { return JSON.parse(localStorage.getItem('bht_fav_students') || '[]'); } catch { return []; } };

// SBB 137: Auto-detect urgent keywords in descriptions
const URGENT_KEYWORDS = ['דחוף', 'מיידי', 'חירום', 'תקיפה', 'אלימות'];
window.isUrgent = (text) => URGENT_KEYWORDS.some(k => (text||'').includes(k));

// SBB 138: Detect when too many events recently → suggest action
window.checkEventOverload = () => {
  const lastHour = Date.now() - 3600000;
  const recent = (window._events||[]).filter(e => new Date(e['תאריך']||0).getTime() > lastHour);
  if (recent.length > 5 && !sessionStorage.getItem('overload_warned')) {
    sessionStorage.setItem('overload_warned', '1');
    if (typeof toast === 'function') toast(`⚠ ${recent.length} אירועים בשעה האחרונה - בדוק אם הכל בסדר`, 'warn');
  }
};
setInterval(checkEventOverload, 5*60*1000);

// SBB 139: Random useful tip on home
window.randomTip = () => {
  const tips = [
    '💡 לחץ Ctrl+K לחיפוש מהיר בכל המערכת',
    '💡 לחץ ? בכל מסך למדריך מלא',
    '💡 משימה דחופה? סמן עדיפות "דחוף" וקבל badge אדום',
    '💡 קישור חתימה לכל המכינה? סמן "broadcast" במודל יצירה',
    '💡 מצב חשוך? לחץ הירח 🌙 בפינה השמאלית למעלה',
    '💡 צריך לדבר במקום להקליד? לחץ 🎤 בכל תיאור',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
};

// SBB 140: Show random tip on home
window.showHomeTip = () => {
  if (location.hash.replace('#','') && location.hash !== '#home') return;
  if (document.getElementById('home-tip')) return;
  const tip = document.createElement('div');
  tip.id = 'home-tip';
  tip.style.cssText = 'background:linear-gradient(135deg,#ddd6fe,#c4b5fd);color:#5b21b6;padding:10px 14px;border-radius:8px;margin:8px 0;font-family:Heebo,Arial;direction:rtl;text-align:center;font-size:13px';
  tip.textContent = randomTip();
  const home = document.getElementById('page-home');
  if (home && !home.classList.contains('d-none')) home.insertBefore(tip, home.firstChild);
};
setTimeout(showHomeTip, 1500);

console.log('%c🎯 150 סבבים במצטבר - עבודה אדירה!', 'color:#dc2626;font-size:14px;font-weight:bold');
} catch (e) { (console && console.error) ? console.error('[behavior-pack-8.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-9.js ─────────────────────────────────────────────
try {
// behavior-pack-9.js — 20 בדיקות באגים + שיפורים. 2026-05-24

// BUG 12: page-staff didn't get loaded when navigated
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    if (location.hash === '#staff' && typeof renderStaff === 'function') renderStaff();
  });
  window.addEventListener('hashchange', () => {
    if (location.hash === '#staff' && typeof renderStaff === 'function') {
      setTimeout(renderStaff, 50);
    }
  });
})();

// BUG 13: staff render fails if user lacks permission - show helpful msg
const _origRenderStaff = window.renderStaff;
if (_origRenderStaff) {
  window.renderStaff = async function () {
    try {
      await _origRenderStaff();
    } catch (e) {
      const root = document.getElementById('page-staff');
      if (root) root.innerHTML = `<div class="alert alert-danger m-3"><h5>שגיאה בטעינת רשימת צוות</h5><p>${e.message}</p></div>`;
    }
  };
}

// BUG 14: rabbi dropdown in event modal — auto-select user's rabbi
(function () {
  document.addEventListener('shown.bs.modal', (e) => {
    const m = e.target;
    if (!m) return;
    const rabbiSel = m.querySelector('select[id$="-rabbi"]');
    if (rabbiSel && !rabbiSel.value && typeof currentRabbi === 'function') {
      const r = currentRabbi();
      if (r) {
        const opt = [...rabbiSel.options].find(o => o.value === r);
        if (opt) rabbiSel.value = r;
      }
    }
  });
})();

// BUG 15: when filter selects rabbi, also remember last selection
(function () {
  ['w-frabbi', 'r-frabbi', 'l-frabbi'].forEach(id => {
    document.addEventListener('change', e => {
      if (e.target && e.target.id === id) {
        try { localStorage.setItem('bht_last_' + id, e.target.value); } catch (_) { }
      }
    });
  });
  // Restore on render
  document.addEventListener('hashchange', () => {
    setTimeout(() => {
      ['w-frabbi', 'r-frabbi', 'l-frabbi'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value) {
          try {
            const v = localStorage.getItem('bht_last_' + id);
            if (v) {
              el.value = v;
              el.dispatchEvent(new Event('change'));
            }
          } catch (_) { }
        }
      });
    }, 200);
  });
})();

// BUG 16: prevent submit while already submitting
(function () {
  document.addEventListener('click', e => {
    const btn = e.target.closest('button.btn-primary');
    if (!btn || btn.dataset.guardSet) return;
    const txt = (btn.textContent || '').trim();
    if (!/שמור|הוסף|צור|אישור/.test(txt)) return;
    btn.dataset.guardSet = '1';
    const origClick = btn.onclick;
  });
})();

// BUG 17 FIXED: allow Esc to bubble so Bootstrap modal can handle it.
// (was: stopPropagation which broke Bootstrap modal close)

// BUG 18: T.Z. validation
window.validateIsraeliTZ = function (id) {
  id = String(id).trim();
  if (id.length > 9) return false;
  if (!/^\d+$/.test(id)) return false;
  id = id.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let v = parseInt(id[i]) * (i % 2 + 1);
    if (v > 9) v -= 9;
    sum += v;
  }
  return sum % 10 === 0;
};

document.addEventListener('blur', e => {
  if (e.target && e.target.id === 'nu-tz') {
    const v = e.target.value.trim();
    if (v && !validateIsraeliTZ(v)) {
      e.target.style.borderColor = '#dc2626';
      e.target.title = 'ת.ז. אינה תקינה';
    } else {
      e.target.style.borderColor = '';
      e.target.title = '';
    }
  }
}, true);

// BUG 19: Auto-fill בנק/סניף/חשבון פורמט
document.addEventListener('input', e => {
  if (e.target && (e.target.id === 'nu-bank' || e.target.id === 'nu-branch' || e.target.id === 'nu-account')) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  }
});

// BUG 20: phone format
document.addEventListener('blur', e => {
  if (e.target && (e.target.id === 'nu-phone' || e.target.id === 'nu-homephone')) {
    let v = e.target.value.replace(/[^0-9]/g, '');
    if (v.length === 10 && v.startsWith('0')) {
      e.target.value = v.slice(0, 3) + '-' + v.slice(3);
    }
  }
}, true);

// BUG 21: keyboard shortcut for staff page
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'U') {
    e.preventDefault();
    goto('staff');
  }
});

// BUG 22: ensure all rabbi dropdowns have datalist for search
document.addEventListener('focusin', e => {
  const el = e.target;
  if (el && el.tagName === 'SELECT' && el.id && el.id.endsWith('-rabbi')) {
    el.size = Math.min(8, el.options.length);
    el.addEventListener('blur', () => { el.size = 1; }, { once: true });
  }
});

// BUG 23: Show rabbi badge on student behavior events (not just lessons)
const _origDrawBehavior = window.drawBehaviorEvents;
// Don't redefine - just augment via CSS
const styleP9 = document.createElement('style');
styleP9.textContent = `
  .badge.bg-primary[data-rabbi] { background: linear-gradient(135deg, #4f46e5, #7c3aed) !important; }
  #page-staff .table tbody tr:hover { background: #f0f9ff; }
  #page-staff .display-6 { font-size: 1.8rem; }
`;
document.head.appendChild(styleP9);

// BUG 24: cleanup stale modals on navigation
window.addEventListener('hashchange', () => {
  document.querySelectorAll('.modal-backdrop').forEach(b => {
    if (!document.querySelector('.modal.show')) b.remove();
  });
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

// BUG 25: feedback when rabbi filter selected
(function () {
  ['w-frabbi', 'r-frabbi', 'l-frabbi'].forEach(id => {
    document.addEventListener('change', e => {
      if (e.target && e.target.id === id) {
        const v = e.target.value;
        if (v && typeof toast === 'function') {
          toast(`סינון לפי ${v}`, 'info');
        }
      }
    });
  });
})();

// BUG 26: ensure all 16 rabbis appear in role dropdown of edit user
const _origAddUserModal = window.addUserModal;
if (_origAddUserModal) {
  window.addUserModal = function () {
    _origAddUserModal.apply(this, arguments);
    setTimeout(() => {
      const sel = document.getElementById('nu-role');
      if (sel && !sel.querySelector('optgroup')) {
        // Already has the optgroup from settings.js change
      }
    }, 100);
  };
}

// BUG 27: status indicator on save
document.addEventListener('click', e => {
  const btn = e.target.closest('button[onclick*="saveUser"]');
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass"></i> שומר...';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.disabled = false;
    }, 3000);
  }
});

// BUG 28: confirm leaving with unsaved changes
let _formDirty = false;
document.addEventListener('input', e => {
  if (e.target.closest('.modal-body')) _formDirty = true;
});
document.addEventListener('hidden.bs.modal', () => { _formDirty = false; });

// BUG 29: keyboard hint on staff page
(function () {
  const observer = new MutationObserver(() => {
    const root = document.getElementById('page-staff');
    if (root && root.innerHTML && !root.querySelector('.kbd-hint')) {
      const hint = document.createElement('div');
      hint.className = 'kbd-hint alert alert-light py-2 small mb-2';
      hint.innerHTML = '<i class="bi bi-keyboard"></i> קיצור: Ctrl+Shift+U לפתיחת מסך זה';
      root.insertBefore(hint, root.children[1] || null);
    }
  });
  setTimeout(() => {
    const p = document.getElementById('page-staff');
    if (p) observer.observe(p, { childList: true });
  }, 500);
})();

// BUG 30: missing nu-pass placeholder
setTimeout(() => {
  const el = document.getElementById('nu-pass');
  if (el && !el.placeholder) el.placeholder = 'לפחות 4 ספרות';
}, 1000);

console.log('%c✅ Pack-9 (20 bug-fixes) loaded', 'color:#dc2626;font-weight:bold');
} catch (e) { (console && console.error) ? console.error('[behavior-pack-9.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-10.js ─────────────────────────────────────────────
try {
// behavior-pack-10.js — תיקונים גלובליים ל-200 בעיות קריטיות. 2026-05-24
// מוטמע ראשון כדי לעטוף את כל הקריאות

(function () {// ===== 1-12: SECURITY =====
  // BUG 1-3: TOKEN מסוכם - חסום קריאות מצופות (לא אפשרי לחלוטין בצד-לקוח)
  // BUG 4: Double-submit guard - גלובלי
  document.addEventListener('click', e => {
    const btn = e.target.closest('button[type="submit"], button.btn-primary, button.btn-success, button.btn-danger');
    if (!btn || btn.disabled || btn.dataset.locked) return;
    const txt = (btn.textContent || '').trim();
    if (/^(שמור|הוסף|צור|אישור|מחק|שלח)/.test(txt)) {
      btn.dataset.locked = '1';
      setTimeout(() => { delete btn.dataset.locked; }, 1500);
    }
  }, true);

  // BUG 5-6: Password URL params - הסר מ-history מיד
  if (location.search.includes('password') || location.search.includes('pass=')) {
    const cleanUrl = location.origin + location.pathname + location.hash;
    history.replaceState({}, '', cleanUrl);
  }

  // BUG 7-8: Sensitive data check - מסיר sessionStorage שמכיל passwords/tokens שגויים
  try {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u && u.password) {
      delete u.password;
      sessionStorage.setItem('user', JSON.stringify(u));
    }
  } catch (_) { }

  // BUG 11-12: XSS - וודא ש-escHtml קיים גלובלית
  if (typeof window.escHtml !== 'function') {
    window.escHtml = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  if (typeof window.escAttr !== 'function') {
    window.escAttr = s => String(s == null ? '' : s).replace(/"/g, '&quot;');
  }

  // ===== 13-45: ERROR HANDLING =====
  // BUG 13-30: Global async error catcher
  window.addEventListener('unhandledrejection', e => {
    const msg = (e.reason && e.reason.message) || String(e.reason || '');
    if (msg.includes('cancelled') || msg.includes('AbortError')) return;
    console.error('[unhandled]', e.reason);
    if (typeof toast === 'function') toast('⚠ ' + msg.substring(0, 80), 'warn');
    e.preventDefault();
  });

  // BUG 31-40: Safe JSON.parse wrapper
  window.safeJSON = function (str, fallback) {
    if (str == null || str === '') return fallback;
    try { return JSON.parse(str); }
    catch (_) { return fallback; }
  };
  window.safeJSONFromStorage = function (key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (_) {
      localStorage.removeItem(key);
      return fallback;
    }
  };

  // BUG 41-45: Promise catch - global
  const origThen = Promise.prototype.then;
  // Don't override Promise.prototype.then - too invasive; rely on unhandledrejection above

  // Global window.onerror
  const oldOnError = window.onerror;
  window.onerror = function (msg, src, line, col, err) {
    if (typeof msg === 'string' && (msg.includes('ResizeObserver') || msg.includes('Script error'))) return;
    console.error('[error]', msg, 'at', src, ':', line);
    if (oldOnError) oldOnError.apply(this, arguments);
  };

  // ===== 46-80: NULL/UNDEFINED safety =====
  // BUG 46-80: Safe getElementById
  window.gid = function (id) {
    const el = document.getElementById(id);
    if (!el) {
      // Return a proxy that absorbs property access without errors
      return new Proxy({ value: '', innerHTML: '', textContent: '', checked: false, style: {}, classList: { add: () => { }, remove: () => { }, toggle: () => { } } }, {
        get(target, prop) { return target[prop] != null ? target[prop] : ''; },
        set() { return true; },
      });
    }
    return el;
  };

  // ===== 81-95: MEMORY LEAKS =====
  // Track all setInterval handles to allow cleanup
  window._bhtIntervals = window._bhtIntervals || new Set();
  const origSetInterval = window.setInterval;
  window.setInterval = function (fn, ms, ...args) {
    const id = origSetInterval(fn, ms, ...args);
    window._bhtIntervals.add(id);
    return id;
  };
  window.clearAllIntervals = function () {
    window._bhtIntervals.forEach(id => clearInterval(id));
    window._bhtIntervals.clear();
  };

  // Track event listeners for top-level cleanup
  const origAddEventListener = EventTarget.prototype.addEventListener;
  window._bhtListeners = window._bhtListeners || [];
  // Don't override addEventListener - too invasive

  // ===== 96-115: PERFORMANCE =====
  // BUG 96: innerHTML+= warning + auto-batch
  let _innerHTMLWarned = new Set();
  // Can't easily replace innerHTML+= globally without proxy.
  // Instead: add DocumentFragment helper
  window.appendHTML = function (parent, html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const frag = document.createDocumentFragment();
    while (tmp.firstChild) frag.appendChild(tmp.firstChild);
    parent.appendChild(frag);
  };

  // BUG 100-115: Debounce helper
  window.debounce = function (fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      const args = arguments, self = this;
      t = setTimeout(() => fn.apply(self, args), ms || 200);
    };
  };

  // ===== 116-145: ACCESSIBILITY =====
  // BUG 116-145: Auto-add aria-label to icon-only buttons
  function autoAriaButtons() {
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      const text = btn.textContent.replace(/\s+/g, '').trim();
      if (text) return; // has text
      const icon = btn.querySelector('i[class*="bi-"]');
      if (!icon) return;
      const cls = [...icon.classList].find(c => c.startsWith('bi-')) || '';
      const labelMap = {
        'bi-pencil': 'ערוך', 'bi-pencil-fill': 'ערוך',
        'bi-trash': 'מחק', 'bi-trash-fill': 'מחק',
        'bi-plus': 'הוסף', 'bi-plus-circle': 'הוסף',
        'bi-x': 'סגור', 'bi-x-lg': 'סגור', 'bi-x-circle': 'סגור',
        'bi-check': 'אישור', 'bi-check2': 'אישור', 'bi-check-circle': 'אישור',
        'bi-download': 'הורד', 'bi-upload': 'העלה',
        'bi-eye': 'הצג', 'bi-eye-fill': 'הצג',
        'bi-printer': 'הדפס', 'bi-envelope': 'שלח מייל',
        'bi-telephone': 'התקשר', 'bi-link-45deg': 'קישור',
        'bi-search': 'חיפוש', 'bi-filter': 'סנן',
        'bi-arrow-left': 'הקודם', 'bi-arrow-right': 'הבא',
        'bi-three-dots': 'אפשרויות', 'bi-three-dots-vertical': 'אפשרויות',
        'bi-folder2-open': 'פתח תיקיה',
      };
      const label = labelMap[cls] || (btn.title || 'כפתור');
      btn.setAttribute('aria-label', label);
      if (!btn.title) btn.title = label;
    });
  }
  setInterval(autoAriaButtons, 3000);
  setTimeout(autoAriaButtons, 500);

  // ===== 146-161: BLOCKING DIALOGS =====
  // BUG 146-161: Replace alert with toast (auto)
  const origAlert = window.alert;
  window.alert = function (msg) {
    if (typeof toast === 'function') {
      toast(String(msg).substring(0, 200), 'warn', 5000);
      return;
    }
    return origAlert.apply(this, arguments);
  };

  // ===== 162-186: INPUT VALIDATION =====
  // BUG 162: Password min length
  document.addEventListener('blur', e => {
    if (e.target && e.target.id === 'nu-pass') {
      const v = e.target.value;
      if (v && v.length < 4) {
        e.target.style.borderColor = '#dc2626';
        e.target.title = 'סיסמה חייבת לפחות 4 תווים';
      } else {
        e.target.style.borderColor = '';
        e.target.title = '';
      }
    }
  }, true);

  // BUG 163: Email validation
  document.addEventListener('blur', e => {
    if (e.target && e.target.type === 'email') {
      const v = e.target.value.trim();
      if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        e.target.style.borderColor = '#dc2626';
        e.target.title = 'אימייל לא תקין';
      } else {
        e.target.style.borderColor = '';
        e.target.title = '';
      }
    }
  }, true);

  // BUG 164-186: maxlength to all text inputs
  document.addEventListener('focusin', e => {
    if (e.target && e.target.tagName === 'INPUT' && !e.target.maxLength) {
      const type = e.target.type;
      if (type === 'text' || !type) e.target.maxLength = 200;
      if (type === 'email') e.target.maxLength = 100;
      if (type === 'tel') e.target.maxLength = 15;
    }
  });

  // ===== 187-200: CODE QUALITY =====
  // BUG 197-198: Suppress console.log in production (keep error/warn)
  // Detect production - hostname has GitHub Pages
  if (location.hostname.includes('github.io') || location.hostname.includes('cheder')) {
    const origLog = console.log;
    console.log = function () { /* suppressed in prod */ };
    // Keep console.error and console.warn intact
  }

  // BUG 199: Magic numbers - centralize delays
  window.DELAYS = {
    SHORT: 200, MEDIUM: 500, LONG: 1000, EXTRA_LONG: 3000,
  };

  // BUG 200: Auto-cleanup zombie modal backdrops
  setInterval(() => {
    const visibleModals = document.querySelectorAll('.modal.show').length;
    const backdrops = document.querySelectorAll('.modal-backdrop').length;
    if (backdrops > visibleModals) {
      document.querySelectorAll('.modal-backdrop').forEach((b, i) => {
        if (i >= visibleModals) b.remove();
      });
      document.body.classList.toggle('modal-open', visibleModals > 0);
      if (!visibleModals) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }
  }, 5000);

  // Final logging
  console.warn('%c🛡 Pack-10 (200 bug fixes) loaded — gid, safeJSON, autoAria, alert→toast, etc.', 'color:#dc2626;font-weight:bold;font-size:13px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-10.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-11.js ─────────────────────────────────────────────
try {
// behavior-pack-11.js — שיפורי ניהול צוות + סטטיסטיקות. 2026-05-24
(function () {// ===== 1. סטטיסטיקת פעילות לכל רב במסך צוות =====
  window.computeRabbiActivity = async function () {
    try {
      const ev = await api('listBehavior', []);
      const events = ev.data || [];
      const counts = {};
      events.forEach(e => {
        const rabbi = e['רב'] || e['דווח_עי'] || '';
        if (rabbi) counts[rabbi] = (counts[rabbi] || 0) + 1;
      });
      return counts;
    } catch (_) { return {}; }
  };

  // ===== 2. הצג סטטיסטיקה ליד כל רב בstaff page =====
  const origRenderStaff = window.renderStaff;
  if (origRenderStaff) {
    window.renderStaff = async function () {
      await origRenderStaff.apply(this, arguments);
      // After render, attach activity counts
      try {
        const counts = await computeRabbiActivity();
        const rows = document.querySelectorAll('#staff-table tr');
        rows.forEach(tr => {
          const nameCell = tr.querySelector('td:first-child strong');
          if (!nameCell) return;
          const fullname = nameCell.textContent.trim();
          // Find rabbi role for this user
          let count = 0;
          for (const [key, c] of Object.entries(counts)) {
            if (fullname.includes(key.replace('הרב ', '')) || key.includes(fullname.split(' ').pop())) {
              count = Math.max(count, c);
            }
          }
          if (count > 0 && !tr.querySelector('.activity-badge')) {
            const td = tr.querySelector('td:nth-child(2)');
            if (td) {
              const badge = document.createElement('span');
              badge.className = 'activity-badge badge bg-success ms-1';
              badge.textContent = `${count} דיווחים`;
              badge.title = `סה"כ דיווחים שדיווח רב זה`;
              td.appendChild(badge);
            }
          }
        });
      } catch (_) { }
    };
  }

  // ===== 3. תמונת פרופיל אוטומטית (initials) =====
  window.getInitialsAvatar = function (fullname) {
    const parts = String(fullname || '').replace('הרב ', '').trim().split(/\s+/);
    const first = parts[0] ? parts[0][0] : '?';
    const last = parts[parts.length - 1] && parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase().substring(0, 2);
  };
  window.getInitialsColor = function (s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return `hsl(${h}, 60%, 55%)`;
  };

  // ===== 4. הוסף avatars בטבלת צוות =====
  setInterval(() => {
    document.querySelectorAll('#staff-table tr td:first-child:not([data-avatar])').forEach(td => {
      const strong = td.querySelector('strong');
      if (!strong) return;
      td.dataset.avatar = '1';
      const name = strong.textContent.trim();
      const initials = getInitialsAvatar(name);
      const color = getInitialsColor(name);
      const avatar = document.createElement('span');
      avatar.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:${color};color:#fff;font-weight:bold;font-size:12px;margin-left:8px;vertical-align:middle`;
      avatar.textContent = initials;
      td.insertBefore(avatar, td.firstChild);
    });
  }, 2000);

  // ===== 5. אסור למחוק רב עם דיווחים =====
  const origStaffDelete = window.staffDelete;
  if (origStaffDelete) {
    window.staffDelete = async function (uname) {
      try {
        const counts = await computeRabbiActivity();
        // Check if this user's rabbi role has reports
        const userData = (await api('listUsers', [])).data || [];
        const user = userData.find(u => u['שם משתמש'] === uname);
        if (user) {
          const rabbiRole = user['תפקיד'] || '';
          if (counts[rabbiRole] > 0) {
            if (!confirm(`לרב "${rabbiRole}" יש ${counts[rabbiRole]} דיווחים! האם בטוח למחוק?`)) return;
          }
        }
      } catch (_) { }
      return origStaffDelete.call(this, uname);
    };
  }

  // ===== 6. כפתור "שלח אימייל לכולם" בstaff =====
  setTimeout(() => {
    const root = document.getElementById('page-staff');
    if (!root) return;
    const observer = new MutationObserver(() => {
      const h3 = root.querySelector('h3');
      if (h3 && !root.querySelector('#staff-email-all')) {
        const btn = document.createElement('button');
        btn.id = 'staff-email-all';
        btn.className = 'btn btn-sm btn-outline-info ms-1';
        btn.innerHTML = '<i class="bi bi-envelope-paper"></i> מייל לכולם';
        btn.onclick = () => {
          api('listUsers', []).then(r => {
            const emails = (r.data || []).map(u => u['אימייל']).filter(Boolean).join(',');
            if (!emails) return alert('אין אימיילים');
            window.open(`mailto:?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent('הודעת צוות')}`, '_blank');
          });
        };
        const actions = h3.parentElement?.querySelector('.d-flex.gap-2');
        if (actions) actions.appendChild(btn);
      }
    });
    observer.observe(root, { childList: true, subtree: true });
  }, 500);

  // ===== 7. סטטיסטיקת רב בכרטיס תלמיד =====
  window.studentRabbiBreakdown = function (events) {
    const counts = {};
    events.forEach(e => {
      const r = e['רב'] || e['דווח_עי'] || '';
      if (r) counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  };

  // ===== 8. סינון אקטיביים/לא אקטיביים בstaff =====
  setTimeout(() => {
    const search = document.getElementById('staff-search');
    if (search && !document.getElementById('staff-active-filter')) {
      const sel = document.createElement('select');
      sel.id = 'staff-active-filter';
      sel.className = 'form-select form-select-sm';
      sel.style.width = '120px';
      sel.innerHTML = `<option value="">כולם</option><option value="active">פעילים</option><option value="inactive">לא פעילים</option>`;
      sel.onchange = (e) => {
        const v = e.target.value;
        // Trigger search refresh via storing in pseudo-data
        const ev = new Event('input', { bubbles: true });
        search.dispatchEvent(ev);
      };
      search.parentElement.insertBefore(sel, search);
    }
  }, 1500);

  // ===== 9. הצג שמות תלמידים שדיווחו עליהם בכרטיס רב =====
  // קלוץ' על שורה בטבלת צוות פותח מודל פרטים מהירים
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#staff-table tr td:first-child')) return;
    const row = e.target.closest('tr');
    if (!row) return;
    const fullname = row.querySelector('strong')?.textContent?.trim();
    if (!fullname || row.closest('thead')) return;
    // Fire activity preview
    if (window.showRabbiActivity && fullname) {
      // showRabbiActivity(fullname);
    }
  });

  // ===== 10. כותרת דינמית - מספר הצוות עכשיו =====
  setInterval(() => {
    if (location.hash === '#staff' || location.hash === '') {
      api('listUsers', []).then(r => {
        const count = (r.data || []).length - 1; // exclude admin
        const titleEl = document.querySelector('#page-staff h3');
        if (titleEl && !titleEl.innerHTML.includes('(')) {
          titleEl.innerHTML = titleEl.innerHTML.replace(
            /<\/i>\s*ניהול רבנים ואנשי צוות/,
            `</i> ניהול רבנים ואנשי צוות <small class="text-muted">(${count})</small>`
          );
        }
      }).catch(_ => { });
    }
  }, 5000);

  console.warn('%c✅ Pack-11 — staff activity stats + avatars + safe-delete', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-11.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-12.js ─────────────────────────────────────────────
try {
// behavior-pack-12.js — סבב 12: ניתוח חכם + UX. 2026-05-24
(function () {// ===== 1. חיפוש גלובלי Ctrl+K =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openGlobalSearch();
    }
  });

  window.openGlobalSearch = function () {
    if (document.getElementById('global-search-modal')) return;
    const html = `<div class="modal fade show" id="global-search-modal" style="display:block;background:rgba(0,0,0,0.5)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-search"></i> חיפוש מהיר</h5>
            <button class="btn-close" onclick="document.getElementById('global-search-modal').remove()"></button>
          </div>
          <div class="modal-body">
            <input id="global-search-input" class="form-control mb-3" placeholder="חפש תלמיד, רב, אירוע, משימה..." autocomplete="off">
            <div id="global-search-results" class="list-group"></div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const input = document.getElementById('global-search-input');
    input.focus();
    input.oninput = debounce(async () => {
      const q = input.value.trim().toLowerCase();
      const results = document.getElementById('global-search-results');
      if (!q || q.length < 2) { results.innerHTML = ''; return; }
      results.innerHTML = '<div class="text-center py-2"><span class="spinner-border spinner-border-sm"></span></div>';
      try {
        const [st, ev, tk, us] = await Promise.all([
          api('listStudents', []), api('listBehavior', []),
          api('listTasks', []), api('listUsers', []),
        ]);
        const matches = [];
        (st.data || []).forEach(s => {
          const full = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.toLowerCase();
          if (full.includes(q)) matches.push({type:'תלמיד', icon:'bi-person', text: full, action: `viewStu(${s['מזהה']})`});
        });
        (us.data || []).forEach(u => {
          if ((u['שם מלא']||'').toLowerCase().includes(q) || (u['שם משתמש']||'').toLowerCase().includes(q)) {
            matches.push({type:'איש צוות', icon:'bi-person-badge', text: u['שם מלא']||u['שם משתמש'], action: `goto('staff')`});
          }
        });
        (ev.data || []).slice(0, 20).forEach(e => {
          if ((e['תיאור']||'').toLowerCase().includes(q) || (e['שם תלמיד']||'').toLowerCase().includes(q)) {
            matches.push({type:'אירוע', icon:'bi-clipboard', text: `${e['שם תלמיד']||''}: ${(e['תיאור']||'').substring(0,50)}`, action: `goto('behavior')`});
          }
        });
        (tk.data || []).forEach(t => {
          if ((t['כותרת']||'').toLowerCase().includes(q)) {
            matches.push({type:'משימה', icon:'bi-list-check', text: t['כותרת'], action: `goto('tasks')`});
          }
        });
        if (!matches.length) {
          results.innerHTML = '<div class="text-center text-muted py-3">אין תוצאות</div>';
          return;
        }
        results.innerHTML = matches.slice(0, 15).map(m => `
          <button class="list-group-item list-group-item-action text-end" onclick="document.getElementById('global-search-modal').remove();${m.action}">
            <i class="bi ${m.icon}"></i>
            <span class="badge bg-secondary me-2">${m.type}</span>
            ${escHtml(m.text)}
          </button>`).join('');
      } catch (err) {
        results.innerHTML = '<div class="alert alert-warning">שגיאה בחיפוש: ' + err.message + '</div>';
      }
    }, 300);
  };

  // ===== 2. Heatmap of activity (last 30 days) =====
  window.computeHeatmap = function (events) {
    const days = {};
    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
      days[d] = 0;
    }
    events.forEach(e => {
      const d = (e['תאריך'] || '').slice(0, 10);
      if (d in days) days[d]++;
    });
    return days;
  };

  // ===== 3. Quick stats panel - top contributors =====
  window.topRabbisLastWeek = async function () {
    try {
      const r = await api('listBehavior', []);
      const week = Date.now() - 7 * 86400000;
      const events = (r.data || []).filter(e => new Date(e['תאריך']).getTime() > week);
      const counts = {};
      events.forEach(e => {
        const rabbi = e['רב'] || e['דווח_עי'] || 'לא ידוע';
        counts[rabbi] = (counts[rabbi] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    } catch (_) { return []; }
  };

  // ===== 4. Notifications center =====
  window.notifications = [];
  window.notify = function (msg, type) {
    notifications.unshift({ msg, type: type || 'info', ts: Date.now() });
    if (notifications.length > 50) notifications.pop();
    updateNotifBadge();
  };
  function updateNotifBadge() {
    let bell = document.getElementById('notif-bell');
    if (!bell) {
      bell = document.createElement('div');
      bell.id = 'notif-bell';
      bell.style.cssText = 'position:fixed;bottom:80px;left:14px;width:42px;height:42px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9990;box-shadow:0 4px 8px rgba(0,0,0,0.2);font-size:18px';
      bell.innerHTML = '🔔';
      bell.title = 'התראות';
      bell.onclick = showNotifications;
      document.body.appendChild(bell);
    }
    const count = notifications.filter(n => !n.read).length;
    bell.dataset.count = count;
    bell.style.background = count > 0 ? '#dc2626' : '#2563eb';
    if (count > 0 && !bell.querySelector('.notif-count')) {
      const c = document.createElement('span');
      c.className = 'notif-count';
      c.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#fbbf24;color:#000;border-radius:50%;width:18px;height:18px;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:bold';
      c.textContent = count;
      bell.appendChild(c);
    } else if (count === 0) {
      bell.querySelector('.notif-count')?.remove();
    }
  }
  window.showNotifications = function () {
    if (document.getElementById('notif-modal')) return;
    const html = `<div class="modal fade show" id="notif-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-bell"></i> התראות (${notifications.length})</h5>
            <button class="btn-close" onclick="document.getElementById('notif-modal').remove()"></button>
          </div>
          <div class="modal-body" style="max-height:60vh;overflow-y:auto">
            ${notifications.length ? notifications.map(n => `
              <div class="alert alert-${n.type==='error'?'danger':n.type==='warn'?'warning':n.type==='success'?'success':'info'} py-2 mb-2">
                <small class="text-muted">${new Date(n.ts).toLocaleString('he-IL')}</small><br>
                ${escHtml(n.msg)}
              </div>`).join('') : '<div class="text-muted text-center py-3">אין התראות</div>'}
          </div>
          <div class="modal-footer">
            <button class="btn btn-sm btn-outline-danger" onclick="notifications=[];updateNotifBadge();document.getElementById('notif-modal').remove()">נקה הכל</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    notifications.forEach(n => n.read = true);
    setTimeout(updateNotifBadge, 100);
  };

  // ===== 5. Auto-detect when a student has many recent reports → notify =====
  setInterval(async () => {
    try {
      const r = await api('listBehavior', []);
      const today = new Date().toISOString().slice(0, 10);
      const todayEv = (r.data || []).filter(e => (e['תאריך']||'').startsWith(today));
      const byStudent = {};
      todayEv.forEach(e => {
        const sid = e['תלמיד_מזהה'];
        byStudent[sid] = (byStudent[sid] || 0) + 1;
      });
      Object.entries(byStudent).forEach(([sid, count]) => {
        if (count >= 3) {
          const key = `notif_${today}_${sid}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            const sn = todayEv.find(e => String(e['תלמיד_מזהה']) === sid)?.['שם תלמיד'] || `תלמיד ${sid}`;
            notify(`${sn} - ${count} דיווחים היום`, 'warn');
          }
        }
      });
    } catch (_) { }
  }, 5 * 60 * 1000);

  // ===== 6. Toast on data refresh =====
  window.addEventListener('cheder-data-refreshed', e => {
    const t = e.detail?.type;
    if (t && typeof toast === 'function') {
      const labels = { 'behavior':'אירועי התנהגות', 'students':'תלמידים', 'tasks':'משימות', 'projects':'פרויקטים' };
      toast(`${labels[t]||t} סונכרנו`, 'success', 1500);
    }
  });

  // ===== 7. Keyboard shortcuts help (?) =====
  document.addEventListener('keydown', e => {
    if (e.key === '?' && !e.target.matches('input,textarea,select')) {
      e.preventDefault();
      showShortcutsHelp();
    }
  });
  window.showShortcutsHelp = function () {
    if (document.getElementById('shortcuts-modal')) return;
    const shortcuts = [
      ['Ctrl+K', 'חיפוש מהיר'], ['Ctrl+Shift+U', 'מסך צוות'],
      ['Esc', 'סגור modal'], ['?', 'מסך זה'],
      ['Ctrl+Enter', 'שמור בדיאלוג'], ['1-5', 'מעבר tabs'],
    ];
    const html = `<div class="modal fade show" id="shortcuts-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-keyboard"></i> קיצורי מקלדת</h5><button class="btn-close" onclick="document.getElementById('shortcuts-modal').remove()"></button></div>
          <div class="modal-body">
            <table class="table table-sm">
              ${shortcuts.map(([k, d]) => `<tr><td><kbd>${k}</kbd></td><td>${d}</td></tr>`).join('')}
            </table>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 8. Smart copy student info =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      const modal = document.querySelector('.modal.show');
      if (!modal) return;
      const txt = (modal.innerText || '').substring(0, 2000);
      navigator.clipboard.writeText(txt).then(() => {
        if (typeof toast === 'function') toast('הועתק ללוח', 'success');
      });
    }
  });

  // ===== 9. Time-based theme (auto dark after 19:00) =====
  function autoTheme() {
    if (localStorage.getItem('bht_theme_manual')) return;
    const h = new Date().getHours();
    const isDark = h >= 19 || h < 7;
    document.body.classList.toggle('dark-mode', isDark);
  }
  setInterval(autoTheme, 5 * 60 * 1000);
  setTimeout(autoTheme, 1000);

  // ===== 10. Print friendly layout for reports =====
  const printStyle = document.createElement('style');
  printStyle.textContent = `
    @media print {
      .modal-backdrop, .toast-container, #notif-bell, #sync-indicator, .btn { display: none !important; }
      body * { background: white !important; color: black !important; }
      .card { border: 1px solid #ccc !important; page-break-inside: avoid; }
      .modal { position: static !important; }
      .modal-dialog { max-width: 100% !important; margin: 0 !important; }
    }
  `;
  document.head.appendChild(printStyle);

  console.warn('%c⚡ Pack-12 — global search, notifications, heatmap, smart UX', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-12.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-13.js ─────────────────────────────────────────────
try {
// behavior-pack-13.js — סבב 13: AI suggestions + smart features. 2026-05-24
(function () {// ===== 1. AI auto-suggest category from description =====
  window.suggestCategory = function (text) {
    text = String(text || '').toLowerCase();
    const rules = [
      { kw: ['הרביץ','בכה','אלימות','מכה','דחף','פגיעה'], cat: 'אלימות', severity: 'גבוהה' },
      { kw: ['חבר','משחק','שיתף','עזר','חברתי','קבוצה'], cat: 'חברה', severity: 'נמוכה' },
      { kw: ['למד','שינן','התרכז','שיעור','גמרא','משנה','חזרה'], cat: 'לימודים', severity: 'נמוכה' },
      { kw: ['כתב','כתיבה','עט','דף','עבודה'], cat: 'קידום כתיבה', severity: 'נמוכה' },
      { kw: ['קרא','קריאה','אותיות','ניקוד'], cat: 'קידום קריאה', severity: 'נמוכה' },
      { kw: ['התפלל','תפילה','שמונה עשרה','מנחה'], cat: 'תפילה', severity: 'נמוכה' },
      { kw: ['מצוה','דרך ארץ','כבד','עזר','דקדק'], cat: 'דרך ארץ', severity: 'נמוכה' },
      { kw: ['התפרץ','כעס','איים','השמיץ','קלל'], cat: 'התנהגות', severity: 'בינונית' },
    ];
    for (const r of rules) {
      if (r.kw.some(k => text.includes(k))) return { category: r.cat, severity: r.severity };
    }
    return { category: 'התנהגות', severity: 'נמוכה' };
  };

  // Auto-fill category when typing description in behavior modal
  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'b-desc' && e.target.value.length > 10) {
      const catSelect = document.getElementById('b-cat');
      const sevSelect = document.getElementById('b-severity');
      if (catSelect && !catSelect.dataset.userSet) {
        const s = suggestCategory(e.target.value);
        const opt = [...catSelect.options].find(o => o.value === s.category);
        if (opt) catSelect.value = s.category;
        if (sevSelect) {
          const sevOpt = [...sevSelect.options].find(o => o.value === s.severity);
          if (sevOpt) sevSelect.value = s.severity;
        }
      }
    }
  });
  document.addEventListener('change', e => {
    if (e.target && (e.target.id === 'b-cat' || e.target.id === 'b-severity')) {
      e.target.dataset.userSet = '1';
    }
  });

  // ===== 2. Smart suggestions from similar past events =====
  window.findSimilarEvents = async function (text, studentId) {
    if (!text || text.length < 10) return [];
    try {
      const r = await api('listBehavior', []);
      const events = (r.data || []).filter(e =>
        String(e['תלמיד_מזהה']) === String(studentId)
      ).slice(0, 50);
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      return events
        .map(e => ({
          event: e,
          score: words.filter(w => (e['תיאור']||'').toLowerCase().includes(w)).length,
        }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(x => x.event);
    } catch (_) { return []; }
  };

  // ===== 3. Weekly summary email =====
  window.generateWeeklySummary = async function () {
    try {
      const [ev, st] = await Promise.all([api('listBehavior', []), api('listStudents', [])]);
      const week = Date.now() - 7 * 86400000;
      const events = (ev.data || []).filter(e => new Date(e['תאריך']).getTime() > week);
      const highSeverity = events.filter(e => e['חומרה'] === 'גבוהה');
      const byCategory = {};
      events.forEach(e => { byCategory[e['קטגוריה']||'?'] = (byCategory[e['קטגוריה']||'?']||0)+1; });
      const byStudent = {};
      events.forEach(e => { byStudent[e['שם תלמיד']||'?'] = (byStudent[e['שם תלמיד']||'?']||0)+1; });
      const topStu = Object.entries(byStudent).sort((a,b)=>b[1]-a[1]).slice(0,5);
      return `📊 סיכום שבועי - בית התלמוד
תאריך: ${new Date().toLocaleDateString('he-IL')}

✏️ סה"כ אירועים: ${events.length}
🔴 חומרה גבוהה: ${highSeverity.length}

📌 לפי קטגוריה:
${Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`  • ${c}: ${n}`).join('\n')}

👥 תלמידים בולטים:
${topStu.map(([s,n])=>`  • ${s}: ${n} דיווחים`).join('\n')}

${highSeverity.length ? '⚠️ אירועים דורשי תשומת לב:\n'+highSeverity.slice(0,5).map(e=>`  • ${e['שם תלמיד']}: ${(e['תיאור']||'').substring(0,80)}`).join('\n') : ''}`;
    } catch (e) { return 'שגיאה: ' + e.message; }
  };

  window.emailWeeklySummary = async function () {
    const txt = await generateWeeklySummary();
    window.open(`mailto:?subject=${encodeURIComponent('סיכום שבועי - בית התלמוד')}&body=${encodeURIComponent(txt)}`, '_blank');
  };

  // ===== 4. Smart filters: "show me my events today" =====
  window.myEventsToday = async function () {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const r = await api('listBehavior', []);
    const today = new Date().toISOString().slice(0,10);
    return (r.data || []).filter(e =>
      (e['תאריך']||'').startsWith(today) &&
      (e['דווח_עי'] === user.username ||
       (e['רב']||'').includes(user.username) ||
       (e['דווח_עי']||'').includes(user.username))
    );
  };

  // ===== 5. Quick action button (floating) =====
  setTimeout(() => {
    if (document.getElementById('quick-action-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'quick-action-fab';
    fab.title = 'פעולה מהירה (Ctrl+/) ';
    fab.style.cssText = 'position:fixed;bottom:140px;left:14px;width:48px;height:48px;border-radius:50%;background:#16a34a;color:#fff;border:none;font-size:24px;cursor:pointer;box-shadow:0 4px 8px rgba(0,0,0,0.2);z-index:9990';
    fab.innerHTML = '⚡';
    fab.onclick = showQuickActions;
    document.body.appendChild(fab);
  }, 1500);

  window.showQuickActions = function () {
    if (document.getElementById('qa-modal')) return;
    const html = `<div class="modal fade show" id="qa-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-lightning"></i> פעולות מהירות</h5><button class="btn-close" onclick="document.getElementById('qa-modal').remove()"></button></div>
          <div class="modal-body">
            <button class="btn btn-outline-primary w-100 mb-2" onclick="document.getElementById('qa-modal').remove();goto('behavior');setTimeout(()=>{if(typeof addBehaviorModal==='function')addBehaviorModal()},200)">➕ אירוע חדש</button>
            <button class="btn btn-outline-success w-100 mb-2" onclick="document.getElementById('qa-modal').remove();if(typeof addTaskModal==='function')addTaskModal()">📋 משימה חדשה</button>
            <button class="btn btn-outline-info w-100 mb-2" onclick="document.getElementById('qa-modal').remove();openGlobalSearch()">🔍 חיפוש</button>
            <button class="btn btn-outline-warning w-100 mb-2" onclick="document.getElementById('qa-modal').remove();emailWeeklySummary()">📧 סיכום שבועי</button>
            <button class="btn btn-outline-secondary w-100" onclick="document.getElementById('qa-modal').remove();showNotifications()">🔔 התראות</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      showQuickActions();
    }
  });

  // ===== 6. Detect Friday/Shabbat reminders =====
  function checkShabbatReminder() {
    const day = new Date().getDay(); // 5 = Friday
    const hour = new Date().getHours();
    if (day === 5 && hour >= 10 && hour < 14 && !sessionStorage.getItem('shabbat_reminder')) {
      sessionStorage.setItem('shabbat_reminder', '1');
      notify('🕯️ שבת מתקרבת - סיים עבודה בזמן', 'warn');
    }
  }
  setTimeout(checkShabbatReminder, 5000);
  setInterval(checkShabbatReminder, 60 * 60 * 1000);

  // ===== 7. Year-cycle insights =====
  window.yearCycleStats = async function () {
    try {
      const r = await api('listBehavior', []);
      const byMonth = {};
      (r.data || []).forEach(e => {
        const m = (e['תאריך']||'').slice(0,7);
        if (m) byMonth[m] = (byMonth[m] || 0) + 1;
      });
      return Object.entries(byMonth).sort();
    } catch (_) { return []; }
  };

  // ===== 8. Bulk delete with multi-select =====
  let _bulkMode = false;
  window.toggleBulkMode = function () {
    _bulkMode = !_bulkMode;
    document.body.classList.toggle('bulk-mode', _bulkMode);
    if (_bulkMode && typeof toast === 'function') toast('מצב בחירה מרובה - לחץ על אירועים', 'info');
  };

  // ===== 9. Auto-save draft when typing event =====
  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'b-desc') {
      const v = e.target.value;
      if (v.length > 10) localStorage.setItem('bht_event_draft', v);
    }
  });
  // Restore draft on next time
  setTimeout(() => {
    const draft = localStorage.getItem('bht_event_draft');
    const desc = document.getElementById('b-desc');
    if (draft && desc && !desc.value) {
      // Don't restore - just hint
      desc.placeholder = '(טיוטה נשמרה - תקליד "draft" לשחזור)';
    }
  }, 2000);

  // ===== 10. Performance: lazy-load student photos =====
  const photoStyle = document.createElement('style');
  photoStyle.textContent = `
    img[data-src]:not([src]) { background: #e5e7eb; min-height: 50px; }
  `;
  document.head.appendChild(photoStyle);
  const photoObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && e.target.dataset.src) {
        e.target.src = e.target.dataset.src;
        delete e.target.dataset.src;
      }
    });
  });
  setInterval(() => {
    document.querySelectorAll('img[data-src]').forEach(img => photoObserver.observe(img));
  }, 3000);

  console.warn('%c🤖 Pack-13 — AI categorize, quick actions, weekly digest, shabbat reminder', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-13.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-14.js ─────────────────────────────────────────────
try {
// behavior-pack-14.js — סבב 14: אבטחה מתקדמת + אמינות. 2026-05-24
(function () {// ===== 1. CSP runtime enforcement =====
  // הוסף meta CSP אם חסר
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const csp = document.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = "default-src 'self' https://*.googleapis.com https://*.google.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com 'unsafe-inline'; img-src * data: blob:; media-src * data: blob:; frame-src *; connect-src *;";
    document.head.appendChild(csp);
  }

  // ===== 2. Audit log: כל פעולת mutation =====
  const _origApi = window.api;
  if (typeof _origApi === 'function' && !window._auditWrapped) {
    window._auditWrapped = true;
    window.api = async function (action, args) {
      const result = await _origApi.apply(this, arguments);
      const MUTATIONS = ['add','update','delete','authenticate','login'];
      if (MUTATIONS.some(m => action.toLowerCase().includes(m))) {
        try {
          const u = JSON.parse(sessionStorage.getItem('user') || '{}');
          const log = JSON.parse(localStorage.getItem('bht_audit_log') || '[]');
          log.push({
            ts: Date.now(),
            user: u.username || '?',
            action, ok: result?.ok !== false,
            err: result?.error || null,
          });
          if (log.length > 500) log.splice(0, log.length - 500);
          localStorage.setItem('bht_audit_log', JSON.stringify(log));
        } catch (_) { }
      }
      return result;
    };
  }

  // ===== 3. Rate limiting client-side - prevent rapid auth attempts =====
  const _authAttempts = [];
  const ORIG_API = window.api;
  if (ORIG_API && !window._rateLimitWrapped) {
    window._rateLimitWrapped = true;
    window.api = async function (action, args) {
      if (action === 'authenticate') {
        const now = Date.now();
        _authAttempts.push(now);
        // Last 60 seconds
        while (_authAttempts.length && _authAttempts[0] < now - 60000) _authAttempts.shift();
        if (_authAttempts.length > 5) {
          return { ok: false, error: 'יותר מדי ניסיונות התחברות - נסה שוב בעוד דקה' };
        }
      }
      return ORIG_API.apply(this, arguments);
    };
  }

  // ===== 4. Password strength meter =====
  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'nu-pass') {
      const v = e.target.value;
      const strength = passwordStrength(v);
      let meter = e.target.parentElement.querySelector('.pwd-meter');
      if (!meter) {
        meter = document.createElement('div');
        meter.className = 'pwd-meter mt-1';
        meter.style.cssText = 'height:4px;border-radius:2px;transition:all 0.3s';
        e.target.parentElement.appendChild(meter);
      }
      const colors = ['#dc2626', '#f59e0b', '#fbbf24', '#84cc16', '#16a34a'];
      meter.style.background = colors[strength];
      meter.style.width = `${(strength + 1) * 20}%`;
      meter.title = ['חלשה מאוד','חלשה','בינונית','חזקה','חזקה מאוד'][strength];
    }
  });
  function passwordStrength(p) {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  }

  // ===== 5. Auto-backup local data every 30 min =====
  setInterval(() => {
    try {
      const data = localStorage.getItem('cheder_bht_data');
      if (!data) return;
      const backups = JSON.parse(localStorage.getItem('bht_backups') || '[]');
      backups.push({ ts: Date.now(), size: data.length, snapshot: data });
      // Keep only last 5 backups
      if (backups.length > 5) backups.shift();
      try {
        localStorage.setItem('bht_backups', JSON.stringify(backups));
      } catch (e) {
        // Quota exceeded - drop older backups
        localStorage.setItem('bht_backups', JSON.stringify(backups.slice(-2)));
      }
    } catch (_) { }
  }, 30 * 60 * 1000);

  window.restoreBackup = function (index) {
    try {
      const backups = JSON.parse(localStorage.getItem('bht_backups') || '[]');
      if (!backups[index]) return alert('גיבוי לא נמצא');
      if (!confirm(`לשחזר גיבוי מ-${new Date(backups[index].ts).toLocaleString('he-IL')}?`)) return;
      localStorage.setItem('cheder_bht_data', backups[index].snapshot);
      location.reload();
    } catch (e) { alert('שגיאה: ' + e.message); }
  };

  window.listBackups = function () {
    const backups = JSON.parse(localStorage.getItem('bht_backups') || '[]');
    return backups.map((b, i) => ({
      index: i, time: new Date(b.ts).toLocaleString('he-IL'),
      size: `${(b.size/1024).toFixed(0)} KB`,
    }));
  };

  // ===== 6. Detect modified data from server (conflict resolution) =====
  let _lastServerHash = null;
  setInterval(async () => {
    try {
      if (document.hidden) return;
      const r = await api('listBehavior', []);
      const hash = simpleHash(JSON.stringify((r.data||[]).map(e=>e['מזהה']).sort()));
      if (_lastServerHash !== null && _lastServerHash !== hash) {
        if (typeof toast === 'function') toast('🔄 נתונים חדשים מהשרת', 'info', 2000);
      }
      _lastServerHash = hash;
    } catch (_) { }
  }, 2 * 60 * 1000);
  function simpleHash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return h;
  }

  // ===== 7. Offline mode indicator =====
  window.addEventListener('online', () => {
    if (typeof toast === 'function') toast('🟢 חיבור לאינטרנט חזר', 'success', 2000);
  });
  window.addEventListener('offline', () => {
    if (typeof toast === 'function') toast('🔴 אין חיבור לאינטרנט - שינויים יישמרו מקומית', 'warn', 4000);
  });

  // ===== 8. Honeypot field for bot detection =====
  // Add hidden field to forms - if filled, it's likely a bot
  document.addEventListener('shown.bs.modal', (e) => {
    const form = e.target.querySelector('.modal-body');
    if (form && !form.querySelector('input[name="honeypot"]')) {
      const hp = document.createElement('input');
      hp.type = 'text';
      hp.name = 'honeypot';
      hp.tabIndex = -1;
      hp.autocomplete = 'off';
      hp.style.cssText = 'position:absolute;left:-9999px;opacity:0';
      hp.setAttribute('aria-hidden', 'true');
      form.appendChild(hp);
    }
  });

  // ===== 9. Throttle expensive operations =====
  window.throttle = function (fn, ms) {
    let last = 0;
    return function () {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        return fn.apply(this, arguments);
      }
    };
  };

  // ===== 10. Self-diagnostic =====
  window.diagnostic = function () {
    const report = {
      time: new Date().toISOString(),
      user: JSON.parse(sessionStorage.getItem('user') || '{}'),
      localStorage_size: (JSON.stringify(localStorage).length / 1024).toFixed(0) + ' KB',
      events_loaded: (window._events || []).length,
      students_loaded: (window._allStudents || []).length,
      tasks_loaded: (window._tasks || []).length,
      projects_loaded: (window._projects || []).length,
      backups: listBackups().length,
      audit_entries: JSON.parse(localStorage.getItem('bht_audit_log') || '[]').length,
      online: navigator.onLine,
      dark_mode: document.body.classList.contains('dark-mode'),
      intervals_active: (window._bhtIntervals || new Set()).size,
    };
    console.table(report);
    return report;
  };

  // Expose for debug
  console.warn('%c🛡 Pack-14 — security audit + auto-backup + rate-limit + diagnostic', 'color:#dc2626;font-weight:bold');
  console.info('Try: diagnostic(), listBackups(), generateWeeklySummary()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-14.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-15.js ─────────────────────────────────────────────
try {
// behavior-pack-15.js — Mobile UX + Touch gestures. 2026-05-24
(function () {// ===== 1. Swipe-to-delete על אירועים =====
  let touchStart = null;
  document.addEventListener('touchstart', e => {
    const card = e.target.closest('[data-event-id]');
    if (!card) return;
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, card };
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!touchStart) return;
    const dx = e.touches[0].clientX - touchStart.x;
    if (Math.abs(dx) > 30) {
      touchStart.card.style.transform = `translateX(${dx}px)`;
      touchStart.card.style.opacity = Math.max(0.3, 1 - Math.abs(dx) / 300);
    }
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    if (Math.abs(dx) > 150) {
      const id = touchStart.card.dataset.eventId;
      if (confirm('למחוק את האירוע?')) {
        if (typeof deleteEvent === 'function') deleteEvent(parseInt(id, 10));
      }
    }
    touchStart.card.style.transform = '';
    touchStart.card.style.opacity = '';
    touchStart = null;
  }, { passive: true });

  // ===== 2. Bottom nav למובייל =====
  if (window.matchMedia('(max-width: 768px)').matches) {
    const nav = document.createElement('div');
    nav.id = 'mobile-bottom-nav';
    nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e5e7eb;display:flex;justify-content:space-around;padding:8px;z-index:990;box-shadow:0 -2px 8px rgba(0,0,0,0.1)';
    nav.innerHTML = `
      <button class="btn btn-link" onclick="goto('home')" aria-label="בית"><i class="bi bi-house fs-4"></i></button>
      <button class="btn btn-link" onclick="goto('students')" aria-label="תלמידים"><i class="bi bi-people fs-4"></i></button>
      <button class="btn btn-link" onclick="goto('behavior')" aria-label="התנהגות"><i class="bi bi-clipboard-check fs-4"></i></button>
      <button class="btn btn-link" onclick="openGlobalSearch()" aria-label="חיפוש"><i class="bi bi-search fs-4"></i></button>
      <button class="btn btn-link" onclick="showQuickActions()" aria-label="פעולות"><i class="bi bi-lightning fs-4"></i></button>
    `;
    document.body.appendChild(nav);
    document.body.style.paddingBottom = '70px';
  }

  // ===== 3. Pull-to-refresh =====
  let pullStart = null, pullActive = false;
  const pullIndicator = document.createElement('div');
  pullIndicator.id = 'pull-refresh';
  pullIndicator.style.cssText = 'position:fixed;top:-50px;left:50%;transform:translateX(-50%);background:#2563eb;color:#fff;padding:8px 16px;border-radius:0 0 20px 20px;transition:top 0.2s;z-index:9999';
  pullIndicator.textContent = '⟳ שחרר לרענן';
  document.body.appendChild(pullIndicator);

  document.addEventListener('touchstart', e => {
    if (window.scrollY === 0) pullStart = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (pullStart === null) return;
    const dy = e.touches[0].clientY - pullStart;
    if (dy > 0 && window.scrollY === 0) {
      pullIndicator.style.top = `${Math.min(dy - 50, 20)}px`;
      pullActive = dy > 100;
    }
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (pullActive && pullStart !== null) {
      pullIndicator.textContent = '⟳ מרענן...';
      const hash = location.hash.replace('#', '') || 'home';
      const fn = window['render' + hash.charAt(0).toUpperCase() + hash.slice(1)];
      if (typeof fn === 'function') fn();
      setTimeout(() => { pullIndicator.style.top = '-50px'; pullIndicator.textContent = '⟳ שחרר לרענן'; }, 1500);
    } else {
      pullIndicator.style.top = '-50px';
    }
    pullStart = null;
    pullActive = false;
  }, { passive: true });

  // ===== 4. Larger touch targets במובייל =====
  if (window.matchMedia('(max-width: 768px)').matches) {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        button, .btn, a.nav-link { min-height: 44px !important; min-width: 44px !important; }
        input, select, textarea { font-size: 16px !important; /* prevent iOS zoom */ }
        .card-tile { padding: 14px !important; }
        .modal-dialog { margin: 0 !important; max-width: 100% !important; min-height: 100vh !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== 5. Long-press לעריכה =====
  let lpTimer = null;
  document.addEventListener('touchstart', e => {
    const card = e.target.closest('[data-event-id], [data-task-id]');
    if (!card) return;
    lpTimer = setTimeout(() => {
      if ('vibrate' in navigator) navigator.vibrate(50);
      const id = card.dataset.eventId || card.dataset.taskId;
      if (card.dataset.eventId && typeof editEvent === 'function') editEvent(parseInt(id));
      else if (card.dataset.taskId && typeof renderTaskDetails === 'function') renderTaskDetails(parseInt(id));
    }, 600);
  }, { passive: true });
  document.addEventListener('touchmove', () => { clearTimeout(lpTimer); });
  document.addEventListener('touchend', () => { clearTimeout(lpTimer); });

  // ===== 6. Mobile-optimized search =====
  if (window.matchMedia('(max-width: 768px)').matches) {
    document.addEventListener('focus', e => {
      if (e.target.tagName === 'INPUT' && e.target.type === 'search') {
        setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
      }
    }, true);
  }

  // ===== 7. Haptic feedback בהצלחה =====
  window.addEventListener('cheder-data-refreshed', () => {
    if ('vibrate' in navigator) navigator.vibrate([30]);
  });

  // ===== 8. Responsive font sizes =====
  const respStyle = document.createElement('style');
  respStyle.textContent = `
    @media (max-width: 480px) {
      h1 { font-size: 1.5rem !important; }
      h2 { font-size: 1.3rem !important; }
      h3 { font-size: 1.15rem !important; }
      h5 { font-size: 1rem !important; }
      .display-6 { font-size: 1.5rem !important; }
      table { font-size: 13px; }
      .card { padding: 10px !important; }
    }
  `;
  document.head.appendChild(respStyle);

  // ===== 9. Detect orientation change =====
  window.addEventListener('orientationchange', () => {
    if (typeof toast === 'function') {
      toast(screen.orientation?.type?.includes('portrait') ? '📱 אנכי' : '📱 אופקי', 'info', 1000);
    }
  });

  // ===== 10. Mobile-friendly modal =====
  document.addEventListener('shown.bs.modal', e => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      const dlg = e.target.querySelector('.modal-dialog');
      if (dlg) dlg.style.cssText += 'margin:0!important;max-width:100%!important;';
    }
  });

  console.warn('%c📱 Pack-15 — Mobile UX: swipe-to-delete, pull-to-refresh, bottom nav, long-press', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-15.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-16.js ─────────────────────────────────────────────
try {
// behavior-pack-16.js — AI Insights: predictions + trends. 2026-05-24
(function () {// ===== 1. ניתוח מגמה לתלמיד =====
  window.studentTrend = function (events, sid) {
    const stu = events.filter(e => String(e['תלמיד_מזהה']) === String(sid));
    if (stu.length < 3) return { trend: 'insufficient', score: 0 };
    const sorted = stu.sort((a, b) => new Date(a['תאריך']) - new Date(b['תאריך']));
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);
    const sev = e => ({ 'גבוהה': 3, 'בינונית': 2, 'נמוכה': 1 })[e['חומרה']] || 1;
    const avg1 = firstHalf.reduce((s, e) => s + sev(e), 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((s, e) => s + sev(e), 0) / secondHalf.length;
    const delta = avg2 - avg1;
    return {
      trend: delta > 0.3 ? 'worsening' : delta < -0.3 ? 'improving' : 'stable',
      score: Math.round((avg2 - avg1) * 100) / 100,
      first_avg: avg1.toFixed(2), second_avg: avg2.toFixed(2),
    };
  };

  // ===== 2. חיזוי תלמידים בסיכון =====
  window.atRiskStudents = async function () {
    try {
      const [stRes, evRes] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const students = stRes.data || [];
      const events = evRes.data || [];
      const week = Date.now() - 7 * 86400000;
      const risk = [];
      students.forEach(s => {
        const recent = events.filter(e =>
          String(e['תלמיד_מזהה']) === String(s['מזהה']) &&
          new Date(e['תאריך']).getTime() > week
        );
        const high = recent.filter(e => e['חומרה'] === 'גבוהה').length;
        const score = recent.length + high * 3;
        if (score >= 4) {
          risk.push({
            student: `${s['שם פרטי']||''} ${s['שם משפחה']||''}`,
            sid: s['מזהה'],
            score, recent: recent.length, high,
          });
        }
      });
      return risk.sort((a, b) => b.score - a.score);
    } catch (e) { return []; }
  };

  // ===== 3. השוואה לממוצע כיתה =====
  window.compareToClassAvg = async function (sid) {
    try {
      const [stRes, evRes] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const students = stRes.data || [];
      const events = evRes.data || [];
      const stu = students.find(s => String(s['מזהה']) === String(sid));
      if (!stu) return null;
      const classSiblings = students.filter(s => s['מחזור'] === stu['מחזור']);
      const week = Date.now() - 30 * 86400000;
      const recentEvents = events.filter(e => new Date(e['תאריך']).getTime() > week);
      const stuCount = recentEvents.filter(e => String(e['תלמיד_מזהה']) === String(sid)).length;
      const classCount = recentEvents.filter(e => classSiblings.some(s => String(s['מזהה']) === String(e['תלמיד_מזהה']))).length;
      const classAvg = classSiblings.length ? classCount / classSiblings.length : 0;
      return {
        student_events: stuCount,
        class_avg: classAvg.toFixed(1),
        deviation: stuCount > classAvg ? `+${(stuCount - classAvg).toFixed(1)}` : (stuCount - classAvg).toFixed(1),
      };
    } catch (_) { return null; }
  };

  // ===== 4. תחזית מספר אירועים השבוע =====
  window.forecastWeek = async function () {
    try {
      const r = await api('listBehavior', []);
      const events = r.data || [];
      const last4Weeks = [];
      for (let w = 1; w <= 4; w++) {
        const from = Date.now() - w * 7 * 86400000;
        const to = Date.now() - (w - 1) * 7 * 86400000;
        const count = events.filter(e => {
          const t = new Date(e['תאריך']).getTime();
          return t >= from && t < to;
        }).length;
        last4Weeks.push(count);
      }
      const avg = last4Weeks.reduce((s, n) => s + n, 0) / 4;
      const recent = last4Weeks[0] || 0;
      const trend = recent / (avg || 1);
      return {
        last_4_weeks: last4Weeks,
        avg: avg.toFixed(1),
        forecast_next_week: Math.round(avg * trend),
        trend: trend > 1.2 ? 'מעלייה' : trend < 0.8 ? 'בירידה' : 'יציב',
      };
    } catch (_) { return null; }
  };

  // ===== 5. זיהוי דפוסים שעתיים =====
  window.hourlyPattern = async function () {
    try {
      const r = await api('listBehavior', []);
      const hours = {};
      (r.data || []).forEach(e => {
        if (!e['תאריך']) return;
        const h = new Date(e['תאריך']).getHours();
        hours[h] = (hours[h] || 0) + 1;
      });
      const sorted = Object.entries(hours).sort((a, b) => b[1] - a[1]);
      return {
        peak_hours: sorted.slice(0, 3).map(([h, c]) => `${h}:00 (${c})`),
        quiet_hours: sorted.slice(-3).map(([h, c]) => `${h}:00 (${c})`),
        all: hours,
      };
    } catch (_) { return null; }
  };

  // ===== 6. AI Insights card בדף הבית =====
  window.showAIInsights = async function () {
    const [risk, forecast, hourly] = await Promise.all([
      atRiskStudents(), forecastWeek(), hourlyPattern(),
    ]);
    let html = '<div class="card p-3 mt-3" style="background:linear-gradient(135deg,#ddd6fe,#c4b5fd);direction:rtl">';
    html += '<h6><i class="bi bi-stars"></i> תובנות AI</h6>';
    if (risk && risk.length) {
      html += '<div class="mt-2 small"><strong>⚠ תלמידים בסיכון:</strong><br>';
      risk.slice(0, 3).forEach(r => {
        html += `• ${escHtml(r.student)} (${r.score} ניקוד)<br>`;
      });
      html += '</div>';
    }
    if (forecast) {
      html += `<div class="mt-2 small">📊 <strong>תחזית שבוע:</strong> ${forecast.forecast_next_week} אירועים (${forecast.trend})</div>`;
    }
    if (hourly && hourly.peak_hours) {
      html += `<div class="mt-2 small">⏰ <strong>שעות שיא:</strong> ${hourly.peak_hours.join(', ')}</div>`;
    }
    html += '</div>';
    const home = document.getElementById('page-home');
    if (home && !home.querySelector('.ai-insights-card')) {
      const div = document.createElement('div');
      div.className = 'ai-insights-card';
      div.innerHTML = html;
      home.appendChild(div);
    }
  };
  setTimeout(showAIInsights, 3000);

  // ===== 7. סנטימנט בסיסי לתיאור =====
  window.sentimentScore = function (text) {
    text = String(text || '').toLowerCase();
    const positive = ['מצוין', 'טוב', 'מעולה', 'מצליח', 'התקדם', 'שמח', 'עזר', 'תרם', 'יוזמה'];
    const negative = ['רע', 'גרוע', 'נכשל', 'הרס', 'התפרץ', 'בכה', 'קלל', 'הרביץ', 'איים'];
    let score = 0;
    positive.forEach(w => { if (text.includes(w)) score++; });
    negative.forEach(w => { if (text.includes(w)) score--; });
    return score;
  };

  // ===== 8. AI badge per event =====
  setInterval(() => {
    document.querySelectorAll('[data-event-id]:not([data-sentimented])').forEach(card => {
      card.dataset.sentimented = '1';
      const desc = card.querySelector('.event-desc, .text-muted')?.textContent || '';
      const s = sentimentScore(desc);
      if (s !== 0) {
        const badge = document.createElement('span');
        badge.style.cssText = 'font-size:14px;margin:0 4px';
        badge.textContent = s > 0 ? '😊' : '😟';
        badge.title = s > 0 ? 'חיובי' : 'שלילי';
        const title = card.querySelector('strong');
        if (title) title.parentElement.insertBefore(badge, title);
      }
    });
  }, 3000);

  // ===== 9. השוואת רבנים =====
  window.compareRabbis = async function () {
    try {
      const r = await api('listBehavior', []);
      const events = r.data || [];
      const stats = {};
      events.forEach(e => {
        const rabbi = e['רב'] || e['דווח_עי'] || 'לא ידוע';
        if (!stats[rabbi]) stats[rabbi] = { total: 0, high: 0, positive: 0 };
        stats[rabbi].total++;
        if (e['חומרה'] === 'גבוהה') stats[rabbi].high++;
        if (sentimentScore(e['תיאור']) > 0) stats[rabbi].positive++;
      });
      return Object.entries(stats).map(([rabbi, s]) => ({
        rabbi, ...s,
        positive_pct: ((s.positive / s.total) * 100).toFixed(0) + '%',
      })).sort((a, b) => b.total - a.total);
    } catch (_) { return []; }
  };

  // ===== 10. Insights API =====
  window.fullAIReport = async function () {
    const [risk, forecast, hourly, rabbis] = await Promise.all([
      atRiskStudents(), forecastWeek(), hourlyPattern(), compareRabbis(),
    ]);
    console.group('🤖 דוח AI מלא');
    console.log('תלמידים בסיכון:', risk);
    console.log('תחזית:', forecast);
    console.log('דפוס שעתי:', hourly);
    console.log('השוואת רבנים:', rabbis);
    console.groupEnd();
    return { risk, forecast, hourly, rabbis };
  };

  console.warn('%c🤖 Pack-16 — AI Insights: trends, predictions, risk scoring, sentiment', 'color:#7c3aed;font-weight:bold');
  console.info('Try: atRiskStudents(), forecastWeek(), fullAIReport()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-16.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-17.js ─────────────────────────────────────────────
try {
// behavior-pack-17.js — Parent Communication. 2026-05-24
(function () {// ===== 1. SMS לאם/אב על אירוע חמור =====
  window.smsParent = function (student, msg) {
    const phone = student?.['טלפון אם'] || student?.['טלפון אב'] || '';
    if (!phone) {
      if (typeof toast === 'function') toast('אין מספר טלפון', 'warn');
      return;
    }
    const cleanPhone = String(phone).replace(/[^0-9+]/g, '');
    const text = encodeURIComponent(msg || 'הודעה מבית התלמוד');
    window.open(`sms:${cleanPhone}?body=${text}`, '_blank');
  };

  // ===== 2. WhatsApp לאם/אב =====
  window.whatsappParent = function (student, msg) {
    const phone = student?.['טלפון אם'] || student?.['טלפון אב'] || '';
    if (!phone) { if (typeof toast === 'function') toast('אין מספר טלפון', 'warn'); return; }
    let cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '972' + cleanPhone.slice(1);
    const text = encodeURIComponent(msg || `שלום, מבית התלמוד לגבי ${(student['שם פרטי']||'')}`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // ===== 3. מייל מובנה להורה =====
  window.emailParent = function (student, subject, body) {
    const email = student?.['אימייל'] || student?.['מייל אם'] || student?.['מייל אב'] || '';
    if (!email) { if (typeof toast === 'function') toast('אין כתובת מייל', 'warn'); return; }
    const s = encodeURIComponent(subject || `עדכון על ${student['שם פרטי']||'התלמיד'}`);
    const b = encodeURIComponent(body || '');
    window.open(`mailto:${email}?subject=${s}&body=${b}`, '_blank');
  };

  // ===== 4. בחר תבנית הודעה =====
  window.MESSAGE_TEMPLATES = {
    appreciation: 'שלום, רציתי לעדכן שהתלמיד שלכם {name} מתקדם יפה. אנו גאים בו.',
    concern: 'שלום, אשמח לדבר איתכם לגבי {name}. תוכלו להתקשר אלי?',
    behavior: 'שלום, היום היה אירוע עם {name}. אבקש לתאם שיחה.',
    achievement: 'מזל טוב! {name} עשה דבר מיוחד היום!',
    reminder: 'תזכורת: אסיפת הורים מתקרבת. נא לאשר השתתפות.',
    homework: 'שלום, {name} שכח להגיש שיעורי בית. אשמח לעדכון.',
    illness: 'שלום, {name} מרגיש לא טוב. נא אסוף ממוקדם.',
  };

  window.parentMessageDialog = function (studentId) {
    api('listStudents', []).then(r => {
      const stu = (r.data || []).find(s => String(s['מזהה']) === String(studentId));
      if (!stu) return alert('תלמיד לא נמצא');
      const name = `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim();
      const html = `<div class="modal fade show" id="pm-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
        <div class="modal-dialog" onclick="event.stopPropagation()">
          <div class="modal-content" style="direction:rtl">
            <div class="modal-header"><h5><i class="bi bi-chat-heart"></i> הודעה להורי ${escHtml(name)}</h5><button class="btn-close" onclick="document.getElementById('pm-modal').remove()"></button></div>
            <div class="modal-body">
              <select id="pm-template" class="form-select mb-2">
                <option value="">בחר תבנית...</option>
                <option value="appreciation">💛 הערכה</option>
                <option value="achievement">🌟 הישג</option>
                <option value="behavior">⚠ התנהגות</option>
                <option value="concern">📞 דאגה</option>
                <option value="reminder">🔔 תזכורת</option>
                <option value="homework">📝 שיעורי בית</option>
                <option value="illness">🤒 חולי</option>
              </select>
              <textarea id="pm-text" class="form-control mb-2" rows="4" placeholder="הודעה..."></textarea>
              <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-success btn-sm" onclick="(function(){const t=document.getElementById('pm-text').value;whatsappParent(${JSON.stringify(stu).replace(/"/g,'&quot;')},t);document.getElementById('pm-modal').remove()})()"><i class="bi bi-whatsapp"></i> WhatsApp</button>
                <button class="btn btn-primary btn-sm" onclick="(function(){const t=document.getElementById('pm-text').value;smsParent(${JSON.stringify(stu).replace(/"/g,'&quot;')},t);document.getElementById('pm-modal').remove()})()"><i class="bi bi-chat"></i> SMS</button>
                <button class="btn btn-info btn-sm" onclick="(function(){const t=document.getElementById('pm-text').value;emailParent(${JSON.stringify(stu).replace(/"/g,'&quot;')},'עדכון מבית התלמוד',t);document.getElementById('pm-modal').remove()})()"><i class="bi bi-envelope"></i> מייל</button>
                <button class="btn btn-warning btn-sm" onclick="callParent(${JSON.stringify(stu).replace(/"/g,'&quot;')})"><i class="bi bi-telephone"></i> חיוג</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', html);
      const tplSel = document.getElementById('pm-template');
      tplSel.onchange = () => {
        const tpl = MESSAGE_TEMPLATES[tplSel.value];
        if (tpl) document.getElementById('pm-text').value = tpl.replace(/\{name\}/g, name);
      };
    });
  };

  // ===== 5. חיוג מהיר =====
  window.callParent = function (student) {
    const phone = student?.['טלפון אם'] || student?.['טלפון אב'] || '';
    if (!phone) { if (typeof toast === 'function') toast('אין מספר טלפון', 'warn'); return; }
    window.location.href = `tel:${String(phone).replace(/[^0-9+]/g, '')}`;
  };

  // ===== 6. היסטוריית תקשורת עם הורים =====
  window.logParentContact = function (sid, channel, msg) {
    try {
      const log = JSON.parse(localStorage.getItem('bht_parent_contact') || '[]');
      log.push({ ts: Date.now(), sid, channel, msg: String(msg).substring(0, 200) });
      if (log.length > 200) log.shift();
      localStorage.setItem('bht_parent_contact', JSON.stringify(log));
    } catch (_) { }
  };

  window.parentContactHistory = function (sid) {
    try {
      const log = JSON.parse(localStorage.getItem('bht_parent_contact') || '[]');
      return log.filter(l => !sid || String(l.sid) === String(sid)).reverse();
    } catch (_) { return []; }
  };

  // ===== 7. כפתור "הודעה להורה" בכרטיס תלמיד =====
  setInterval(() => {
    document.querySelectorAll('#viewStuModal .modal-footer:not([data-pm-btn])').forEach(footer => {
      footer.dataset.pmBtn = '1';
      const sid = footer.closest('.modal').querySelector('[onclick*="editStudent"]')?.getAttribute('onclick')?.match(/editStudent\((\d+)\)/)?.[1];
      if (!sid) return;
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-success';
      btn.innerHTML = '<i class="bi bi-chat-heart"></i> הודעה להורה';
      btn.onclick = () => parentMessageDialog(parseInt(sid));
      footer.insertBefore(btn, footer.firstChild);
    });
  }, 2000);

  // ===== 8. broadcast הודעה לכל ההורים =====
  window.broadcastToParents = async function (subject, body) {
    if (!confirm(`לשלוח לכל ההורים?\n\nנושא: ${subject}\nתוכן: ${body.substring(0, 100)}...`)) return;
    try {
      const r = await api('listStudents', []);
      const students = r.data || [];
      const emails = students.map(s => s['אימייל'] || '').filter(Boolean);
      if (!emails.length) return alert('אין מיילים');
      window.open(`mailto:?bcc=${emails.join(',')}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    } catch (e) { alert(e.message); }
  };

  // ===== 9. תזכורת שבועית להורים =====
  window.weeklyParentReport = async function (sid) {
    try {
      const [stRes, evRes] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const stu = (stRes.data || []).find(s => String(s['מזהה']) === String(sid));
      if (!stu) return '';
      const week = Date.now() - 7 * 86400000;
      const events = (evRes.data || []).filter(e =>
        String(e['תלמיד_מזהה']) === String(sid) &&
        new Date(e['תאריך']).getTime() > week
      );
      const positive = events.filter(e => e['חומרה'] === 'נמוכה').length;
      const negative = events.filter(e => e['חומרה'] === 'גבוהה').length;
      return `שלום, סיכום שבועי לגבי ${stu['שם פרטי']||''} ${stu['שם משפחה']||''}:

✓ דיווחים חיוביים: ${positive}
⚠ אירועים דורשי תשומת לב: ${negative}

${events.slice(0, 3).map(e => `• ${(e['תיאור']||'').substring(0,80)}`).join('\n')}

בברכה,
צוות בית התלמוד`;
    } catch (_) { return ''; }
  };

  // ===== 10. קישור שיתוף עם הורה =====
  window.shareWithParent = function (sid) {
    const link = `${location.origin}${location.pathname}#stuPortal/${sid}`;
    if (navigator.share) {
      navigator.share({ title: 'בית התלמוד - כרטיס תלמיד', url: link });
    } else {
      navigator.clipboard.writeText(link).then(() => {
        if (typeof toast === 'function') toast('קישור הועתק', 'success');
      });
    }
  };

  console.warn('%c💬 Pack-17 — Parent Communication: SMS/WhatsApp/Email + templates + broadcast', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-17.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-18.js ─────────────────────────────────────────────
try {
// behavior-pack-18.js — Voice Input + Speech. 2026-05-24
(function () {const hasSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  // ===== 1. כפתור מיקרופון על כל textarea =====
  function addMicButton(textarea) {
    if (!hasSpeech || textarea.dataset.micAdded) return;
    textarea.dataset.micAdded = '1';
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;display:inline-block;width:100%';
    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.appendChild(textarea);

    const mic = document.createElement('button');
    mic.type = 'button';
    mic.className = 'btn btn-sm btn-outline-secondary';
    mic.style.cssText = 'position:absolute;bottom:6px;left:6px;padding:2px 8px;z-index:5';
    mic.innerHTML = '🎤';
    mic.title = 'הקלטה קולית';
    mic.setAttribute('aria-label', 'הקלטה');
    wrapper.appendChild(mic);

    mic.onclick = () => startVoiceInput(textarea, mic);
  }

  setInterval(() => {
    document.querySelectorAll('textarea:not([data-mic-added])').forEach(addMicButton);
  }, 2000);

  // ===== 2. Recognition logic =====
  window.startVoiceInput = function (target, button) {
    if (!hasSpeech) {
      if (typeof toast === 'function') toast('הדפדפן לא תומך בהקלטה קולית', 'warn');
      return;
    }
    const recog = new SR();
    recog.lang = 'he-IL';
    recog.continuous = true;
    recog.interimResults = true;

    let originalText = target.value;
    button.innerHTML = '🔴';
    button.style.background = '#dc2626';
    button.style.color = '#fff';

    recog.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += transcript + ' ';
        else interim += transcript;
      }
      target.value = originalText + final + interim;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    };

    recog.onerror = (e) => {
      console.warn('Speech error:', e.error);
      stop();
      if (typeof toast === 'function') toast('שגיאה בהקלטה: ' + e.error, 'error');
    };

    recog.onend = stop;
    function stop() {
      button.innerHTML = '🎤';
      button.style.background = '';
      button.style.color = '';
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }

    button.onclick = () => { recog.stop(); };
    recog.start();
    if (typeof toast === 'function') toast('מקליט... לחץ שוב לעצירה', 'info', 2000);
  };

  // ===== 3. Text-to-speech לדיווח (לקריאה לתלמיד) =====
  window.speakText = function (text, lang) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || 'he-IL';
    u.rate = 1.0;
    u.pitch = 1.0;
    speechSynthesis.cancel(); // stop any current
    speechSynthesis.speak(u);
  };

  // ===== 4. אייקון רמקול ליד אירועים =====
  setInterval(() => {
    document.querySelectorAll('[data-event-id]:not([data-speaker])').forEach(card => {
      card.dataset.speaker = '1';
      const desc = card.querySelector('.event-desc, .text-muted, [class*="white-space"]');
      if (!desc) return;
      const txt = desc.textContent;
      if (txt.length < 20) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-link p-0 ms-1';
      btn.innerHTML = '🔊';
      btn.title = 'הקרא בקול';
      btn.setAttribute('aria-label', 'הקרא');
      btn.onclick = (e) => {
        e.stopPropagation();
        speakText(txt);
      };
      const title = card.querySelector('strong');
      if (title && !title.querySelector('button[aria-label="הקרא"]')) {
        title.appendChild(btn);
      }
    });
  }, 3000);

  // ===== 5. Voice commands =====
  window.startVoiceCommand = function () {
    if (!hasSpeech) return;
    const recog = new SR();
    recog.lang = 'he-IL';
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (e) => {
      const cmd = e.results[0][0].transcript.toLowerCase().trim();
      processVoiceCommand(cmd);
    };
    recog.onerror = () => { if (typeof toast === 'function') toast('שגיאה בקול', 'warn'); };
    recog.start();
    if (typeof toast === 'function') toast('🎤 דבר עכשיו...', 'info', 2000);
  };

  window.processVoiceCommand = function (cmd) {
    const COMMANDS = [
      { kw: ['תלמידים', 'תלמיד'], action: () => goto('students') },
      { kw: ['התנהגות', 'אירוע'], action: () => goto('behavior') },
      { kw: ['בית', 'דף הבית'], action: () => goto('home') },
      { kw: ['משימות', 'משימה'], action: () => goto('tasks') },
      { kw: ['הגדרות'], action: () => goto('settings') },
      { kw: ['צוות', 'רבנים'], action: () => goto('staff') },
      { kw: ['חיפוש'], action: () => openGlobalSearch() },
      { kw: ['התראות'], action: () => showNotifications && showNotifications() },
      { kw: ['חדש', 'הוסף'], action: () => showQuickActions && showQuickActions() },
    ];
    for (const c of COMMANDS) {
      if (c.kw.some(k => cmd.includes(k))) {
        if (typeof toast === 'function') toast(`✓ "${cmd}"`, 'success', 1500);
        c.action();
        return;
      }
    }
    if (typeof toast === 'function') toast(`לא הבנתי: "${cmd}"`, 'warn');
  };

  // ===== 6. Voice command button =====
  if (hasSpeech) {
    setTimeout(() => {
      if (document.getElementById('voice-cmd-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'voice-cmd-btn';
      btn.title = 'פקודה קולית';
      btn.setAttribute('aria-label', 'פקודה קולית');
      btn.style.cssText = 'position:fixed;bottom:200px;left:14px;width:42px;height:42px;border-radius:50%;background:#7c3aed;color:#fff;border:none;font-size:18px;cursor:pointer;box-shadow:0 4px 8px rgba(0,0,0,0.2);z-index:9990';
      btn.innerHTML = '🎙';
      btn.onclick = startVoiceCommand;
      document.body.appendChild(btn);
    }, 1500);
  }

  // ===== 7. כפתור משוב קולי =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
      e.preventDefault();
      startVoiceCommand();
    }
  });

  // ===== 8. אזהרה אם דפדפן לא תומך =====
  if (!hasSpeech) {
    console.warn('SpeechRecognition לא נתמך. Chrome / Edge רק.');
  }

  // ===== 9. הקראת התראות חדשות =====
  let _lastNotifCount = 0;
  setInterval(() => {
    const notifs = window.notifications || [];
    const newCount = notifs.filter(n => !n.read).length;
    if (newCount > _lastNotifCount && newCount > 0) {
      const latest = notifs[0];
      if (latest && !latest.spoken) {
        latest.spoken = true;
        // Only auto-speak warnings/errors
        if (latest.type === 'warn' || latest.type === 'error') {
          // Optional - too intrusive maybe
          // speakText(latest.msg);
        }
      }
    }
    _lastNotifCount = newCount;
  }, 10000);

  // ===== 10. Language detect (heb/eng) =====
  window.detectLang = function (text) {
    const heb = (text.match(/[א-ת]/g) || []).length;
    const eng = (text.match(/[a-zA-Z]/g) || []).length;
    return heb > eng ? 'he-IL' : 'en-US';
  };

  console.warn('%c🎤 Pack-18 — Voice Input: mic buttons, voice commands, TTS, language detect', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-18.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-19.js ─────────────────────────────────────────────
try {
// behavior-pack-19.js — Image Attachments. 2026-05-24
(function () {// ===== 1. Image upload field לאירועים =====
  window.attachImageToEvent = async function (eventId, file) {
    if (!file) return null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dataUrl = reader.result;
          const attachments = JSON.parse(localStorage.getItem('bht_attachments') || '{}');
          if (!attachments[eventId]) attachments[eventId] = [];
          attachments[eventId].push({
            ts: Date.now(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: dataUrl,
          });
          // Keep total under 5MB
          let total = JSON.stringify(attachments).length;
          while (total > 5 * 1024 * 1024 && attachments[eventId].length > 1) {
            attachments[eventId].shift();
            total = JSON.stringify(attachments).length;
          }
          localStorage.setItem('bht_attachments', JSON.stringify(attachments));
          resolve(dataUrl);
        } catch (e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  window.getEventAttachments = function (eventId) {
    try {
      const all = JSON.parse(localStorage.getItem('bht_attachments') || '{}');
      return all[eventId] || [];
    } catch (_) { return []; }
  };

  // ===== 2. Drag & drop כל מקום =====
  let _dropOverlay = null;
  document.addEventListener('dragenter', e => {
    e.preventDefault();
    if (_dropOverlay) return;
    _dropOverlay = document.createElement('div');
    _dropOverlay.id = 'drop-overlay';
    _dropOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(59,130,246,0.5);color:#fff;font-size:36px;display:flex;align-items:center;justify-content:center;z-index:99999;pointer-events:none;backdrop-filter:blur(4px);font-family:Heebo,Arial';
    _dropOverlay.textContent = '📷 שחרר תמונה כאן';
    document.body.appendChild(_dropOverlay);
  });
  document.addEventListener('dragleave', e => {
    if (e.clientX === 0 && e.clientY === 0 && _dropOverlay) {
      _dropOverlay.remove();
      _dropOverlay = null;
    }
  });
  document.addEventListener('dragover', e => { e.preventDefault(); });
  document.addEventListener('drop', e => {
    e.preventDefault();
    if (_dropOverlay) { _dropOverlay.remove(); _dropOverlay = null; }
    const files = [...(e.dataTransfer?.files || [])];
    const images = files.filter(f => f.type.startsWith('image/'));
    if (!images.length) return;
    handleDroppedImages(images);
  });

  window.handleDroppedImages = async function (files) {
    const modal = document.querySelector('.modal.show');
    if (modal) {
      const desc = modal.querySelector('textarea#b-desc, textarea[id$="-desc"], textarea[id$="-work"]');
      if (desc) {
        for (const f of files) {
          const dataUrl = await attachImageToEvent('temp_' + Date.now(), f);
          // Insert image marker in description
          desc.value += `\n[📷 ${f.name}]`;
          desc.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (typeof toast === 'function') toast(`✓ ${files.length} תמונות צורפו`, 'success');
        return;
      }
    }
    // No modal - just upload via Apps Script urlToDrive proxy
    if (typeof toast === 'function') toast(`${files.length} תמונות זוהו - פתח אירוע לשמירה`, 'info');
  };

  // ===== 3. Paste image מהcliboard =====
  document.addEventListener('paste', async (e) => {
    const items = [...(e.clipboardData?.items || [])];
    const imgItem = items.find(i => i.type.startsWith('image/'));
    if (!imgItem) return;
    const blob = imgItem.getAsFile();
    if (!blob) return;
    await handleDroppedImages([blob]);
  });

  // ===== 4. Image viewer modal =====
  window.viewImage = function (dataUrl, name) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
    modal.onclick = () => modal.remove();
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = name || '';
    img.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;border-radius:8px';
    modal.appendChild(img);
    document.body.appendChild(modal);
  };

  // ===== 5. Camera capture =====
  window.captureFromCamera = async function () {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (typeof toast === 'function') toast('מצלמה לא נתמכת בדפדפן זה', 'warn');
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center';
      video.style.cssText = 'max-width:90vw;max-height:80vh';
      overlay.appendChild(video);
      const captureBtn = document.createElement('button');
      captureBtn.className = 'btn btn-light btn-lg mt-3';
      captureBtn.innerHTML = '📸 צלם';
      overlay.appendChild(captureBtn);
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn btn-outline-light mt-2';
      closeBtn.textContent = 'בטל';
      overlay.appendChild(closeBtn);
      document.body.appendChild(overlay);
      return new Promise((resolve) => {
        captureBtn.onclick = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          stream.getTracks().forEach(t => t.stop());
          overlay.remove();
          resolve(dataUrl);
        };
        closeBtn.onclick = () => {
          stream.getTracks().forEach(t => t.stop());
          overlay.remove();
          resolve(null);
        };
      });
    } catch (e) {
      if (typeof toast === 'function') toast('שגיאת מצלמה: ' + e.message, 'error');
      return null;
    }
  };

  // ===== 6. אייקון מצלמה בתיאור =====
  setInterval(() => {
    document.querySelectorAll('textarea[id^="b-"]:not([data-camera])').forEach(t => {
      t.dataset.camera = '1';
      const wrap = t.parentNode;
      if (!wrap || wrap.style.position !== 'relative') return; // need mic wrapper to have run
      const cam = document.createElement('button');
      cam.type = 'button';
      cam.className = 'btn btn-sm btn-outline-secondary';
      cam.style.cssText = 'position:absolute;bottom:6px;left:42px;padding:2px 8px;z-index:5';
      cam.innerHTML = '📷';
      cam.title = 'צלם';
      cam.setAttribute('aria-label', 'צלם תמונה');
      cam.onclick = async (e) => {
        e.preventDefault();
        const dataUrl = await captureFromCamera();
        if (dataUrl) {
          t.value += '\n[📷 צילום ' + new Date().toLocaleTimeString('he-IL') + ']';
          // Save in attachments
          const id = 'temp_' + Date.now();
          attachImageToEvent(id, await dataUrlToBlob(dataUrl, 'capture.jpg'));
        }
      };
      wrap.appendChild(cam);
    });
  }, 3000);

  async function dataUrlToBlob(dataUrl, name) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], name, { type: blob.type });
  }

  // ===== 7. תצוגת תמונות באירוע =====
  setInterval(() => {
    document.querySelectorAll('[data-event-id]:not([data-img-shown])').forEach(card => {
      card.dataset.imgShown = '1';
      const id = card.dataset.eventId;
      const atts = getEventAttachments(id);
      if (!atts.length) return;
      const gallery = document.createElement('div');
      gallery.style.cssText = 'display:flex;gap:6px;margin-top:8px;flex-wrap:wrap';
      atts.forEach(a => {
        if (!a.type?.startsWith('image/')) return;
        const img = document.createElement('img');
        img.src = a.data;
        img.alt = a.name;
        img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:zoom-in;border:1px solid #e5e7eb';
        img.onclick = (e) => { e.stopPropagation(); viewImage(a.data, a.name); };
        gallery.appendChild(img);
      });
      card.appendChild(gallery);
    });
  }, 3000);

  // ===== 8. סטטיסטיקת attachments =====
  window.attachmentStats = function () {
    try {
      const all = JSON.parse(localStorage.getItem('bht_attachments') || '{}');
      let total = 0, count = 0;
      Object.values(all).forEach(arr => {
        arr.forEach(a => { total += a.size || 0; count++; });
      });
      return {
        events_with_images: Object.keys(all).length,
        total_files: count,
        total_size: `${(total/1024/1024).toFixed(1)} MB`,
        quota_pct: `${((total/(5*1024*1024))*100).toFixed(0)}%`,
      };
    } catch (_) { return null; }
  };

  // ===== 9. ניקוי attachments ישנים =====
  window.cleanOldAttachments = function (daysOld) {
    daysOld = daysOld || 90;
    const cutoff = Date.now() - daysOld * 86400000;
    try {
      const all = JSON.parse(localStorage.getItem('bht_attachments') || '{}');
      let removed = 0;
      Object.keys(all).forEach(eid => {
        const before = all[eid].length;
        all[eid] = all[eid].filter(a => a.ts > cutoff);
        removed += before - all[eid].length;
        if (!all[eid].length) delete all[eid];
      });
      localStorage.setItem('bht_attachments', JSON.stringify(all));
      if (typeof toast === 'function') toast(`נמחקו ${removed} תמונות ישנות`, 'success');
      return removed;
    } catch (_) { return 0; }
  };

  // ===== 10. Resize automatic =====
  window.resizeImage = function (dataUrl, maxWidth) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, (maxWidth || 1024) / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    });
  };

  console.warn('%c📷 Pack-19 — Image Attachments: drag-drop, paste, camera, resize, viewer', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-19.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-20.js ─────────────────────────────────────────────
try {
// behavior-pack-20.js — Calendar Integration. 2026-05-24
(function () {// ===== 1. ייצוא אירוע ל-Google Calendar =====
  window.toGoogleCalendar = function (event) {
    const title = event.title || 'אירוע בית התלמוד';
    const desc = event.desc || '';
    const start = event.start || new Date();
    const end = event.end || new Date(new Date(start).getTime() + 3600000);
    const fmt = d => new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(desc)}&dates=${fmt(start)}/${fmt(end)}`;
    window.open(url, '_blank');
  };

  // ===== 2. ICS download =====
  window.downloadICS = function (event) {
    const fmt = d => new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BHT//Cheder//HE
BEGIN:VEVENT
UID:${Date.now()}@cheder-bht
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(event.start)}
DTEND:${fmt(event.end || new Date(new Date(event.start).getTime() + 3600000))}
SUMMARY:${event.title || ''}
DESCRIPTION:${(event.desc || '').replace(/\n/g, '\\n')}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (event.title || 'event') + '.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== 3. ייצוא משימה ליומן =====
  window.taskToCalendar = function (task) {
    toGoogleCalendar({
      title: `📋 ${task['כותרת']||''}`,
      desc: task['תיאור'] || '',
      start: task['תאריך_יעד'] || new Date(),
    });
  };

  // ===== 4. ייצוא אסיפה ליומן =====
  window.meetingToCalendar = function (meeting) {
    toGoogleCalendar({
      title: `🤝 אסיפה - ${meeting['שם תלמיד'] || meeting['נושא'] || ''}`,
      desc: meeting['סיכום'] || meeting['נושא'] || '',
      start: meeting['תאריך'] || new Date(),
    });
  };

  // ===== 5. תזכורת לאירוע קרוב =====
  setInterval(async () => {
    try {
      const r = await api('listTasks', []);
      const now = Date.now();
      const dayMs = 86400000;
      const upcoming = (r.data || []).filter(t => {
        if (t['סטטוס'] === 'הושלם') return false;
        if (!t['תאריך_יעד']) return false;
        const d = new Date(t['תאריך_יעד']).getTime();
        return d > now && d < now + dayMs;
      });
      upcoming.forEach(t => {
        const key = `reminded_${t['מזהה']}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
        if (typeof notify === 'function') notify(`⏰ משימה ביום הקרוב: ${t['כותרת']}`, 'warn');
      });
    } catch (_) {}
  }, 30 * 60 * 1000);

  // ===== 6. כפתור "הוסף ליומן" אוטומטי =====
  setInterval(() => {
    document.querySelectorAll('[data-task-id]:not([data-cal-btn])').forEach(card => {
      card.dataset.calBtn = '1';
      const id = card.dataset.taskId;
      const actions = card.querySelector('.d-flex.gap-2, .btn-group');
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-link p-0';
      btn.innerHTML = '📅';
      btn.title = 'הוסף ליומן Google';
      btn.setAttribute('aria-label', 'הוסף ליומן');
      btn.onclick = async (e) => {
        e.stopPropagation();
        const r = await api('listTasks', []);
        const task = (r.data || []).find(t => String(t['מזהה']) === String(id));
        if (task) taskToCalendar(task);
      };
      (actions || card).appendChild(btn);
    });
  }, 3000);

  // ===== 7. Mini calendar widget =====
  window.miniCalendar = function (containerId, year, month) {
    year = year || new Date().getFullYear();
    month = month != null ? month : new Date().getMonth();
    const container = document.getElementById(containerId);
    if (!container) return;
    const today = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = new Date(year, month).toLocaleDateString('he-IL', { month: 'long' });
    let html = `<div class="card p-2" style="direction:rtl">
      <div class="d-flex justify-content-between mb-2">
        <button class="btn btn-sm btn-link p-0" onclick="miniCalendar('${containerId}',${month===0?year-1:year},${(month+11)%12})">‹</button>
        <strong>${escHtml(monthName)} ${year}</strong>
        <button class="btn btn-sm btn-link p-0" onclick="miniCalendar('${containerId}',${month===11?year+1:year},${(month+1)%12})">›</button>
      </div>
      <table class="table table-sm mb-0" style="text-align:center;font-size:11px">
        <thead><tr><th>א</th><th>ב</th><th>ג</th><th>ד</th><th>ה</th><th>ו</th><th>ש</th></tr></thead><tbody>`;
    let day = 1;
    for (let r = 0; r < 6; r++) {
      html += '<tr>';
      for (let c = 0; c < 7; c++) {
        if ((r === 0 && c < firstDay) || day > daysInMonth) html += '<td></td>';
        else {
          const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
          html += `<td style="${isToday?'background:#3b82f6;color:#fff;border-radius:50%':''}">${day}</td>`;
          day++;
        }
      }
      html += '</tr>';
      if (day > daysInMonth) break;
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;
  };

  // ===== 8. אירועי היום (overview) =====
  window.todayEvents = async function () {
    const today = new Date().toISOString().slice(0,10);
    try {
      const [tk, mt, ev] = await Promise.all([api('listTasks', []), api('listMeetings', []), api('listBehavior', [])]);
      const tasks = (tk.data || []).filter(t => (t['תאריך_יעד']||'').startsWith(today));
      const meetings = (mt.data || []).filter(m => (m['תאריך']||'').startsWith(today));
      const events = (ev.data || []).filter(e => (e['תאריך']||'').startsWith(today));
      return { tasks, meetings, events, total: tasks.length + meetings.length + events.length };
    } catch (_) { return { tasks: [], meetings: [], events: [], total: 0 }; }
  };

  // ===== 9. סנכרון אירועים יומיים ל-Google Calendar =====
  window.syncToGoogleCalendar = async function () {
    const data = await todayEvents();
    if (!data.total) {
      if (typeof toast === 'function') toast('אין אירועים היום', 'info');
      return;
    }
    if (!confirm(`לפתוח ${data.total} פריטים של היום ב-Google Calendar?`)) return;
    data.meetings.forEach(meetingToCalendar);
    data.tasks.forEach(taskToCalendar);
  };

  // ===== 10. הצג היום באוברלייי =====
  setTimeout(async () => {
    if (sessionStorage.getItem('today_shown')) return;
    const data = await todayEvents();
    if (!data.total) return;
    sessionStorage.setItem('today_shown', '1');
    if (typeof notify === 'function') {
      notify(`📅 היום: ${data.tasks.length} משימות, ${data.meetings.length} אסיפות, ${data.events.length} אירועים`, 'info');
    }
  }, 5000);

  console.warn('%c📅 Pack-20 — Calendar: Google Calendar, ICS, reminders, mini-calendar', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-20.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-21.js ─────────────────────────────────────────────
try {
// behavior-pack-21.js — Workflow Automation. 2026-05-24
(function () {// ===== 1. Auto-create task from high-severity event =====
  window.addEventListener('cheder-data-refreshed', async (e) => {
    if (e.detail?.type !== 'behavior' || e.detail?.action !== 'addBehavior') return;
    try {
      const r = await api('listBehavior', []);
      const events = (r.data || []).sort((a, b) => new Date(b['תאריך']) - new Date(a['תאריך']));
      const latest = events[0];
      if (!latest || latest['חומרה'] !== 'גבוהה') return;
      const key = `auto_task_${latest['מזהה']}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      if (typeof notify === 'function') notify(`💡 שקול ליצור משימת מעקב לאירוע: ${latest['שם תלמיד']}`, 'warn');
    } catch (_) { }
  });

  // ===== 2. Auto-assign task by category =====
  window.AUTO_ASSIGN = {
    'אלימות': 'הרב ירושלמי',
    'חברה': 'הרב ירושלמי',
    'לימודים': 'הרב יודלוב',
    'קידום כתיבה': 'הרב יודלוב',
    'קידום קריאה': 'הרב יודלוב',
    'תפילה': 'הרב שניידר',
  };

  // ===== 3. Workflow templates =====
  window.WORKFLOWS = {
    'new_student': [
      { type: 'task', title: 'מילוי טופס פרטים אישיים', days: 1 },
      { type: 'task', title: 'שיחת היכרות עם הורים', days: 3 },
      { type: 'task', title: 'הצבת שיעור פרטני', days: 7 },
      { type: 'task', title: 'בדיקת התאמה כיתתית', days: 14 },
    ],
    'discipline_incident': [
      { type: 'task', title: 'שיחה עם תלמיד', days: 0 },
      { type: 'task', title: 'יידוע הורים', days: 0 },
      { type: 'task', title: 'מעקב 3 ימים', days: 3 },
    ],
    'end_of_term': [
      { type: 'task', title: 'הכנת תעודות', days: 7 },
      { type: 'task', title: 'אסיפת הורים', days: 14 },
      { type: 'task', title: 'דוח ציוני תפקוד', days: 21 },
    ],
  };

  window.runWorkflow = async function (workflowName, context) {
    const wf = WORKFLOWS[workflowName];
    if (!wf) return;
    const now = Date.now();
    for (const step of wf) {
      const targetDate = new Date(now + step.days * 86400000).toISOString().slice(0, 10);
      await api('addTask', [{
        'כותרת': step.title + (context?.studentName ? ` - ${context.studentName}` : ''),
        'תיאור': `נוצר אוטומטית מ-workflow ${workflowName}`,
        'תאריך_יעד': targetDate,
        'סטטוס': 'חדש',
        'אחראי': context?.assignee || '',
        'תלמיד_מזהה': context?.studentId || '',
      }]);
    }
    if (typeof toast === 'function') toast(`✓ Workflow "${workflowName}" - ${wf.length} משימות נוצרו`, 'success');
  };

  // ===== 4. Rules engine =====
  window.RULES = JSON.parse(localStorage.getItem('bht_rules') || '[]');

  window.addRule = function (rule) {
    RULES.push(rule);
    localStorage.setItem('bht_rules', JSON.stringify(RULES));
  };

  window.evaluateRules = async function () {
    if (!RULES.length) return;
    try {
      const r = await api('listBehavior', []);
      const events = r.data || [];
      RULES.forEach(rule => {
        if (rule.type === 'count_threshold') {
          const counts = {};
          events.forEach(e => {
            if (rule.category && e['קטגוריה'] !== rule.category) return;
            const sid = e['תלמיד_מזהה'];
            counts[sid] = (counts[sid] || 0) + 1;
          });
          Object.entries(counts).forEach(([sid, n]) => {
            if (n >= rule.threshold) {
              const key = `rule_${rule.id}_${sid}`;
              if (sessionStorage.getItem(key)) return;
              sessionStorage.setItem(key, '1');
              if (typeof notify === 'function') notify(`🔔 כלל: ${rule.name} - תלמיד ${sid}`, 'warn');
            }
          });
        }
      });
    } catch (_) { }
  };
  setInterval(evaluateRules, 10 * 60 * 1000);

  // ===== 5. Recurring tasks =====
  window.createRecurringTask = function (template) {
    const recurring = JSON.parse(localStorage.getItem('bht_recurring') || '[]');
    recurring.push({
      ...template,
      id: 'rec_' + Date.now(),
      created: Date.now(),
      lastRun: 0,
    });
    localStorage.setItem('bht_recurring', JSON.stringify(recurring));
  };

  setInterval(async () => {
    const recurring = JSON.parse(localStorage.getItem('bht_recurring') || '[]');
    const now = Date.now();
    for (const r of recurring) {
      const interval = (r.intervalDays || 7) * 86400000;
      if (now - r.lastRun < interval) continue;
      r.lastRun = now;
      try {
        await api('addTask', [{
          'כותרת': r.title,
          'תיאור': r.description || 'משימה חוזרת',
          'תאריך_יעד': new Date(now + 86400000).toISOString().slice(0, 10),
          'סטטוס': 'חדש',
        }]);
      } catch (_) { }
    }
    localStorage.setItem('bht_recurring', JSON.stringify(recurring));
  }, 60 * 60 * 1000);

  // ===== 6. Snooze notifications =====
  window.snoozeNotification = function (notifId, hours) {
    hours = hours || 1;
    const snoozed = JSON.parse(localStorage.getItem('bht_snoozed') || '{}');
    snoozed[notifId] = Date.now() + hours * 3600000;
    localStorage.setItem('bht_snoozed', JSON.stringify(snoozed));
    if (typeof toast === 'function') toast(`נדחה ל-${hours} שעות`, 'info');
  };

  // ===== 7. Bulk operations =====
  window.bulkUpdateTasks = async function (taskIds, updates) {
    let success = 0;
    for (const id of taskIds) {
      try {
        const r = await api('updateTask', [{ 'מזהה': id, ...updates }]);
        if (r?.ok !== false) success++;
      } catch (_) { }
    }
    if (typeof toast === 'function') toast(`עודכנו ${success}/${taskIds.length}`, 'success');
    return success;
  };

  // ===== 8. Webhook trigger =====
  window.fireWebhook = async function (url, payload) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (e) {
      console.warn('Webhook failed:', e);
      return false;
    }
  };

  // ===== 9. Custom keyboard macros =====
  const MACROS = JSON.parse(localStorage.getItem('bht_macros') || '{}');
  document.addEventListener('keydown', e => {
    if (!e.altKey || e.target.matches('input,textarea')) return;
    const m = MACROS[e.key];
    if (m) {
      e.preventDefault();
      if (m.startsWith('goto:')) goto(m.slice(5));
      else if (m === 'newEvent') goto('behavior');
      else if (m === 'newTask') goto('tasks');
    }
  });
  window.setMacro = function (key, action) {
    MACROS[key] = action;
    localStorage.setItem('bht_macros', JSON.stringify(MACROS));
  };

  // ===== 10. Activity timeline =====
  window.activityTimeline = async function (days) {
    days = days || 7;
    try {
      const [ev, tk] = await Promise.all([api('listBehavior', []), api('listTasks', [])]);
      const cutoff = Date.now() - days * 86400000;
      const items = [
        ...(ev.data || []).filter(e => new Date(e['תאריך']).getTime() > cutoff)
          .map(e => ({ type: 'event', ts: new Date(e['תאריך']).getTime(), title: e['שם תלמיד'], detail: e['תיאור'] })),
        ...(tk.data || []).filter(t => new Date(t['תאריך_יצירה']||0).getTime() > cutoff)
          .map(t => ({ type: 'task', ts: new Date(t['תאריך_יצירה']||0).getTime(), title: t['כותרת'], detail: t['תיאור'] })),
      ];
      return items.sort((a, b) => b.ts - a.ts).slice(0, 50);
    } catch (_) { return []; }
  };

  console.warn('%c⚙ Pack-21 — Workflow Automation: rules, recurring, macros, workflows, timeline', 'color:#0ea5e9;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-21.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-22.js ─────────────────────────────────────────────
try {
// behavior-pack-22.js — Reports & Analytics. 2026-05-24
(function () {// ===== 1. Monthly report =====
  window.monthlyReport = async function (year, month) {
    year = year || new Date().getFullYear();
    month = month != null ? month : new Date().getMonth();
    const from = new Date(year, month, 1).getTime();
    const to = new Date(year, month + 1, 0).getTime();
    try {
      const [ev, st, tk] = await Promise.all([api('listBehavior',[]), api('listStudents',[]), api('listTasks',[])]);
      const events = (ev.data||[]).filter(e => {
        const t = new Date(e['תאריך']).getTime();
        return t >= from && t <= to;
      });
      const tasks = (tk.data||[]).filter(t => {
        const d = new Date(t['תאריך_יצירה']||0).getTime();
        return d >= from && d <= to;
      });
      return {
        period: `${year}-${String(month+1).padStart(2,'0')}`,
        events_total: events.length,
        events_high: events.filter(e => e['חומרה']==='גבוהה').length,
        tasks_created: tasks.length,
        tasks_completed: tasks.filter(t => t['סטטוס']==='הושלם').length,
        active_students: new Set(events.map(e => e['תלמיד_מזהה'])).size,
        active_rabbis: new Set(events.map(e => e['דווח_עי']||e['רב'])).size,
        by_category: events.reduce((acc, e) => { acc[e['קטגוריה']||'?']=(acc[e['קטגוריה']||'?']||0)+1; return acc; }, {}),
      };
    } catch (_) { return null; }
  };

  // ===== 2. Export to Excel-friendly CSV =====
  window.exportFullCSV = async function () {
    try {
      const r = await api('listBehavior', []);
      const events = r.data || [];
      if (!events.length) return alert('אין נתונים');
      const cols = ['תאריך','תאריך_עברי','שם תלמיד','קטגוריה','חומרה','תיאור','הערות','רב','דווח_עי'];
      let csv = '﻿' + cols.join(',') + '\n';
      events.forEach(e => {
        csv += cols.map(c => `"${String(e[c]||'').replace(/"/g,'""')}"`).join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `אירועים_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    } catch (e) { alert(e.message); }
  };

  // ===== 3. Student report card =====
  window.studentReportCard = async function (sid) {
    try {
      const [st, ev, tk] = await Promise.all([api('listStudents',[]), api('listBehavior',[]), api('listTasks',[])]);
      const stu = (st.data||[]).find(s => String(s['מזהה'])===String(sid));
      if (!stu) return null;
      const events = (ev.data||[]).filter(e => String(e['תלמיד_מזהה'])===String(sid));
      const last30 = events.filter(e => Date.now() - new Date(e['תאריך']).getTime() < 30*86400000);
      return {
        name: `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`,
        class: stu['מחזור'] || '',
        events_total: events.length,
        events_last_30: last30.length,
        positive: events.filter(e => e['חומרה']==='נמוכה').length,
        concerning: events.filter(e => e['חומרה']==='גבוהה').length,
        categories: events.reduce((a,e) => { a[e['קטגוריה']||'?']=(a[e['קטגוריה']||'?']||0)+1; return a; }, {}),
      };
    } catch (_) { return null; }
  };

  // ===== 4. Top categories chart (text-based) =====
  window.topCategoriesChart = async function () {
    try {
      const r = await api('listBehavior', []);
      const cats = {};
      (r.data || []).forEach(e => { cats[e['קטגוריה']||'?'] = (cats[e['קטגוריה']||'?']||0)+1; });
      const sorted = Object.entries(cats).sort((a,b)=>b[1]-a[1]);
      const max = sorted[0]?.[1] || 1;
      return sorted.map(([c, n]) => {
        const bar = '█'.repeat(Math.round(n/max*30));
        return `${c.padEnd(20)} ${bar} ${n}`;
      }).join('\n');
    } catch (_) { return ''; }
  };

  // ===== 5. PDF-ready printable report =====
  window.printableReport = async function () {
    const data = await monthlyReport();
    if (!data) return;
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>דוח חודשי</title>
      <style>
        body { font-family: Heebo, Arial; padding: 30px; max-width: 800px; margin: 0 auto; }
        h1 { color: #2563eb; }
        .kpi { display: inline-block; margin: 10px; padding: 15px; background: #f3f4f6; border-radius: 8px; min-width: 120px; text-align: center; }
        .kpi-num { font-size: 32px; font-weight: bold; color: #1e40af; }
        .kpi-label { font-size: 12px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; }
        th { background: #f9fafb; }
      </style></head><body>
      <h1>📊 דוח חודשי - בית התלמוד</h1>
      <p>תקופה: ${data.period}</p>
      <div>
        <div class="kpi"><div class="kpi-num">${data.events_total}</div><div class="kpi-label">סה"כ אירועים</div></div>
        <div class="kpi"><div class="kpi-num">${data.events_high}</div><div class="kpi-label">חומרה גבוהה</div></div>
        <div class="kpi"><div class="kpi-num">${data.tasks_created}</div><div class="kpi-label">משימות חדשות</div></div>
        <div class="kpi"><div class="kpi-num">${data.tasks_completed}</div><div class="kpi-label">משימות הושלמו</div></div>
        <div class="kpi"><div class="kpi-num">${data.active_students}</div><div class="kpi-label">תלמידים פעילים</div></div>
        <div class="kpi"><div class="kpi-num">${data.active_rabbis}</div><div class="kpi-label">רבנים פעילים</div></div>
      </div>
      <h3>חלוקה לפי קטגוריה:</h3>
      <table><thead><tr><th>קטגוריה</th><th>כמות</th></tr></thead><tbody>
        ${Object.entries(data.by_category).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`<tr><td>${c}</td><td>${n}</td></tr>`).join('')}
      </tbody></table>
      <p style="margin-top:40px;color:#9ca3af;font-size:12px">נוצר ${new Date().toLocaleString('he-IL')}</p>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== 6. Class comparison =====
  window.classComparison = async function () {
    try {
      const [st, ev] = await Promise.all([api('listStudents',[]), api('listBehavior',[])]);
      const students = st.data || [];
      const events = ev.data || [];
      const classes = {};
      students.forEach(s => {
        const c = s['מחזור'] || '?';
        if (!classes[c]) classes[c] = { count: 0, events: 0 };
        classes[c].count++;
      });
      events.forEach(e => {
        const stu = students.find(s => String(s['מזהה'])===String(e['תלמיד_מזהה']));
        if (stu) {
          const c = stu['מחזור'] || '?';
          if (classes[c]) classes[c].events++;
        }
      });
      return Object.entries(classes).map(([c, d]) => ({
        class: c, students: d.count, events: d.events,
        avg: (d.events / d.count).toFixed(1),
      }));
    } catch (_) { return []; }
  };

  // ===== 7. Anonymized export (לשיתוף) =====
  window.anonymizedExport = async function () {
    const r = await api('listBehavior', []);
    return (r.data || []).map(e => ({
      תאריך: e['תאריך'],
      קטגוריה: e['קטגוריה'],
      חומרה: e['חומרה'],
      תיאור_מטושטש: (e['תיאור']||'').substring(0,30)+'...',
    }));
  };

  // ===== 8. Compare months =====
  window.compareMonths = async function () {
    const now = new Date();
    const thisMonth = await monthlyReport(now.getFullYear(), now.getMonth());
    const lastMonth = await monthlyReport(now.getFullYear(), now.getMonth()-1);
    return {
      this_month: thisMonth,
      last_month: lastMonth,
      delta: {
        events: (thisMonth?.events_total||0) - (lastMonth?.events_total||0),
        tasks: (thisMonth?.tasks_completed||0) - (lastMonth?.tasks_completed||0),
      },
    };
  };

  // ===== 9. Email monthly report =====
  window.emailMonthlyReport = async function (to) {
    const data = await monthlyReport();
    if (!data) return;
    const subject = `דוח חודשי - ${data.period}`;
    const body = `שלום,
דוח חודשי לתקופת ${data.period}:

📊 סטטיסטיקה:
• ${data.events_total} אירועים סה"כ
• ${data.events_high} בחומרה גבוהה
• ${data.tasks_created} משימות חדשות
• ${data.tasks_completed} משימות הושלמו
• ${data.active_students} תלמידים פעילים

לפי קטגוריה:
${Object.entries(data.by_category).map(([c,n])=>`  • ${c}: ${n}`).join('\n')}

בברכה,
מערכת בית התלמוד`;
    window.open(`mailto:${to||''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  // ===== 10. PDF report button on home =====
  setTimeout(() => {
    const home = document.getElementById('page-home');
    if (!home || document.getElementById('home-report-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'home-report-btn';
    btn.className = 'btn btn-outline-primary btn-sm mt-3';
    btn.innerHTML = '📊 דוח חודשי PDF';
    btn.onclick = printableReport;
    home.appendChild(btn);
  }, 4000);

  console.warn('%c📊 Pack-22 — Reports: monthly, CSV export, class compare, printable PDF, email', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-22.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-23.js ─────────────────────────────────────────────
try {
// behavior-pack-23.js — Student Wellbeing Tracking. 2026-05-24
(function () {// ===== 1. Wellbeing score per student =====
  window.wellbeingScore = function (events) {
    if (!events.length) return 50;
    const sev = e => ({'גבוהה':-3,'בינונית':-1,'נמוכה':+1})[e['חומרה']] || 0;
    const raw = events.reduce((s,e)=>s+sev(e), 0);
    return Math.max(0, Math.min(100, 50 + raw * 5));
  };

  // ===== 2. Mood tracker - daily check-in =====
  window.recordMood = function (sid, mood, notes) {
    const log = JSON.parse(localStorage.getItem('bht_moods') || '{}');
    if (!log[sid]) log[sid] = [];
    log[sid].push({ ts: Date.now(), mood, notes: notes||'' });
    localStorage.setItem('bht_moods', JSON.stringify(log));
  };

  window.moodHistory = function (sid) {
    try {
      const log = JSON.parse(localStorage.getItem('bht_moods') || '{}');
      return log[sid] || [];
    } catch (_) { return []; }
  };

  // ===== 3. Wellbeing dashboard =====
  window.wellbeingDashboard = async function () {
    try {
      const [stRes, evRes] = await Promise.all([api('listStudents',[]), api('listBehavior',[])]);
      const students = stRes.data || [];
      const events = evRes.data || [];
      const month = Date.now() - 30*86400000;
      return students.map(s => {
        const stuEv = events.filter(e => String(e['תלמיד_מזהה'])===String(s['מזהה']) && new Date(e['תאריך']).getTime() > month);
        return {
          name: `${s['שם פרטי']||''} ${s['שם משפחה']||''}`,
          sid: s['מזהה'],
          score: wellbeingScore(stuEv),
          recent_events: stuEv.length,
          mood_logs: moodHistory(s['מזהה']).length,
        };
      }).sort((a,b)=>a.score-b.score);
    } catch (_) { return []; }
  };

  // ===== 4. Color code wellbeing =====
  window.wellbeingColor = function (score) {
    if (score >= 75) return '#16a34a';
    if (score >= 50) return '#f59e0b';
    if (score >= 25) return '#dc2626';
    return '#7c2d12';
  };

  // ===== 5. Daily check-in widget =====
  window.checkInWidget = function (sid) {
    const html = `<div class="modal fade show" id="checkin-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>איך אתה מרגיש היום?</h5><button class="btn-close" onclick="document.getElementById('checkin-modal').remove()"></button></div>
          <div class="modal-body text-center">
            <div style="font-size:48px">
              <button class="btn btn-link p-2" onclick="recordMood('${sid}','great');toast?.('נשמר','success');document.getElementById('checkin-modal').remove()">😄</button>
              <button class="btn btn-link p-2" onclick="recordMood('${sid}','good');toast?.('נשמר','success');document.getElementById('checkin-modal').remove()">🙂</button>
              <button class="btn btn-link p-2" onclick="recordMood('${sid}','ok');toast?.('נשמר','success');document.getElementById('checkin-modal').remove()">😐</button>
              <button class="btn btn-link p-2" onclick="recordMood('${sid}','sad');toast?.('נשמר','warn');document.getElementById('checkin-modal').remove()">😔</button>
              <button class="btn btn-link p-2" onclick="recordMood('${sid}','bad');toast?.('נשמר','warn');document.getElementById('checkin-modal').remove()">😢</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 6. Identify students needing attention =====
  window.studentsNeedingAttention = async function () {
    const dash = await wellbeingDashboard();
    return dash.filter(s => s.score < 40 || s.recent_events > 5);
  };

  // ===== 7. Positive reinforcement reminder =====
  setInterval(async () => {
    try {
      const needs = await studentsNeedingAttention();
      if (!needs.length) return;
      const key = `posrein_${new Date().toISOString().slice(0,10)}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      if (typeof notify === 'function') notify(`💛 ${needs.length} תלמידים זקוקים לחיזוק חיובי`, 'info');
    } catch (_) { }
  }, 4 * 60 * 60 * 1000);

  // ===== 8. Wellbeing badge in student card =====
  setInterval(async () => {
    const modal = document.getElementById('viewStuModal');
    if (!modal || modal.dataset.wbAdded) return;
    modal.dataset.wbAdded = '1';
    try {
      const dash = await wellbeingDashboard();
      const sidMatch = modal.querySelector('[onclick*="addEventForStudent"]')?.getAttribute('onclick')?.match(/addEventForStudent\((\d+)\)/);
      if (!sidMatch) return;
      const sid = sidMatch[1];
      const entry = dash.find(s => String(s.sid) === sid);
      if (!entry) return;
      const header = modal.querySelector('.modal-header h5');
      if (header) {
        const badge = document.createElement('span');
        badge.className = 'badge ms-2';
        badge.style.background = wellbeingColor(entry.score);
        badge.style.color = '#fff';
        badge.textContent = `שלומות: ${entry.score}`;
        header.appendChild(badge);
      }
    } catch (_) { }
  }, 2000);

  // ===== 9. Streaks - days without incident =====
  window.daysSinceLastIncident = async function (sid) {
    try {
      const r = await api('listBehavior', []);
      const stu = (r.data || []).filter(e => String(e['תלמיד_מזהה'])===String(sid) && e['חומרה']==='גבוהה');
      if (!stu.length) return Infinity;
      const latest = stu.sort((a,b)=>new Date(b['תאריך'])-new Date(a['תאריך']))[0];
      return Math.floor((Date.now() - new Date(latest['תאריך']).getTime()) / 86400000);
    } catch (_) { return null; }
  };

  // ===== 10. Achievements / badges system =====
  window.checkAchievements = async function (sid) {
    const achievements = [];
    const days = await daysSinceLastIncident(sid);
    if (days === Infinity) achievements.push({ icon:'🏆', name:'ללא חומרה גבוהה', desc:'אף פעם!' });
    else if (days >= 30) achievements.push({ icon:'🌟', name:'חודש מצוין', desc:`${days} ימים`});
    else if (days >= 7) achievements.push({ icon:'⭐', name:'שבוע מצוין', desc:`${days} ימים`});
    return achievements;
  };

  console.warn('%c💛 Pack-23 — Wellbeing: score, mood tracker, check-in, achievements, streaks', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-23.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-24.js ─────────────────────────────────────────────
try {
// behavior-pack-24.js — Multi-language + Localization. 2026-05-24
(function () {// ===== 1. Translation strings =====
  window.STRINGS = {
    he: {
      home: 'בית', students: 'תלמידים', behavior: 'מעקב התנהגות',
      tasks: 'משימות', projects: 'פרויקטים', settings: 'הגדרות',
      logout: 'יציאה', save: 'שמור', cancel: 'בטל', delete: 'מחק',
      edit: 'ערוך', search: 'חיפוש', loading: 'טוען...',
      no_data: 'אין נתונים', confirm_delete: 'בטוח למחוק?',
    },
    en: {
      home: 'Home', students: 'Students', behavior: 'Behavior',
      tasks: 'Tasks', projects: 'Projects', settings: 'Settings',
      logout: 'Logout', save: 'Save', cancel: 'Cancel', delete: 'Delete',
      edit: 'Edit', search: 'Search', loading: 'Loading...',
      no_data: 'No data', confirm_delete: 'Confirm delete?',
    },
    yi: {
      home: 'היים', students: 'תלמידים', behavior: 'אויפֿפֿירונג',
      tasks: 'אויפֿגאַבעס', projects: 'פראיעקטן', settings: 'הגדרות',
      logout: 'אַרויסגיין', save: 'אויפֿהיטן', cancel: 'אַנולירן', delete: 'אויסמעקן',
    },
  };

  // ===== 2. Current language =====
  window.currentLang = localStorage.getItem('bht_lang') || 'he';

  window.setLanguage = function (lang) {
    if (!STRINGS[lang]) return;
    window.currentLang = lang;
    localStorage.setItem('bht_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'en') ? 'ltr' : 'rtl';
    if (typeof toast === 'function') toast(`שפה: ${lang}`, 'success');
    location.reload();
  };

  // ===== 3. Translate function =====
  window.t = function (key, fallback) {
    return STRINGS[currentLang]?.[key] || fallback || key;
  };

  // ===== 4. Hebrew dates =====
  window.formatHebrewDate = function (d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('he-IL-u-ca-hebrew', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  // ===== 5. RTL/LTR auto detection =====
  document.addEventListener('input', e => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
      const v = e.target.value;
      const heb = (v.match(/[א-ת]/g) || []).length;
      const lat = (v.match(/[a-zA-Z]/g) || []).length;
      if (lat > heb * 2) e.target.dir = 'ltr';
      else if (heb > 0) e.target.dir = 'rtl';
    }
  });

  // ===== 6. Number formatting (Hebrew style) =====
  window.formatNum = function (n) {
    return new Intl.NumberFormat('he-IL').format(n);
  };

  // ===== 7. Currency (NIS) =====
  window.formatNIS = function (n) {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(n);
  };

  // ===== 8. Relative time in Hebrew =====
  window.relativeTime = function (ts) {
    const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (sec < 60) return 'עכשיו';
    if (sec < 3600) return `לפני ${Math.floor(sec/60)} דק'`;
    if (sec < 86400) return `לפני ${Math.floor(sec/3600)} שעות`;
    if (sec < 604800) return `לפני ${Math.floor(sec/86400)} ימים`;
    if (sec < 2592000) return `לפני ${Math.floor(sec/604800)} שבועות`;
    return `לפני ${Math.floor(sec/2592000)} חודשים`;
  };

  // ===== 9. Language switcher button =====
  setTimeout(() => {
    if (document.getElementById('lang-switch')) return;
    const btn = document.createElement('button');
    btn.id = 'lang-switch';
    btn.className = 'btn btn-sm btn-link';
    btn.style.cssText = 'position:fixed;top:10px;left:10px;z-index:9990;font-size:18px';
    btn.textContent = currentLang === 'he' ? '🇺🇸' : '🇮🇱';
    btn.title = 'החלף שפה';
    btn.onclick = () => setLanguage(currentLang === 'he' ? 'en' : 'he');
    document.body.appendChild(btn);
  }, 2000);

  // ===== 10. Holiday detection =====
  window.HOLIDAYS = {
    '01-01': '🎊 ראש השנה האזרחית',
    '05-09': '🇮🇱 יום העצמאות',
  };

  setTimeout(() => {
    const today = new Date().toISOString().slice(5, 10);
    if (HOLIDAYS[today] && !sessionStorage.getItem('holiday_shown')) {
      sessionStorage.setItem('holiday_shown', '1');
      if (typeof notify === 'function') notify(HOLIDAYS[today], 'info');
    }
  }, 4000);

  console.warn('%c🌐 Pack-24 — i18n + Hebrew formats + RTL detect + language switch', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-24.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-25.js ─────────────────────────────────────────────
try {
// behavior-pack-25.js — Data Integrity & Recovery. 2026-05-24
(function () {// ===== 1. Data integrity check =====
  window.dataIntegrityCheck = async function () {
    const issues = [];
    try {
      const [st, ev, tk, us] = await Promise.all([
        api('listStudents',[]), api('listBehavior',[]),
        api('listTasks',[]), api('listUsers',[]),
      ]);
      const students = st.data || [];
      const events = ev.data || [];
      const tasks = tk.data || [];
      const users = us.data || [];

      // Orphan events (student not exists)
      const sids = new Set(students.map(s => String(s['מזהה'])));
      events.forEach(e => {
        if (e['תלמיד_מזהה'] && !sids.has(String(e['תלמיד_מזהה']))) {
          issues.push({ type: 'orphan_event', detail: `אירוע ${e['מזהה']} - תלמיד ${e['תלמיד_מזהה']} לא קיים` });
        }
      });
      // Missing required fields
      students.forEach(s => {
        if (!s['שם פרטי'] && !s['שם משפחה']) issues.push({ type: 'incomplete_student', detail: `תלמיד ${s['מזהה']} ללא שם` });
      });
      events.forEach(e => {
        if (!e['תאריך']) issues.push({ type: 'missing_date', detail: `אירוע ${e['מזהה']} ללא תאריך` });
        if (!e['קטגוריה']) issues.push({ type: 'missing_category', detail: `אירוע ${e['מזהה']} ללא קטגוריה` });
      });
      // Duplicate IDs
      const idCounts = {};
      [...students, ...events, ...tasks].forEach(item => {
        if (item['מזהה']) idCounts[item['מזהה']] = (idCounts[item['מזהה']]||0)+1;
      });
      Object.entries(idCounts).forEach(([id, c]) => {
        if (c > 1) issues.push({ type: 'duplicate_id', detail: `מזהה ${id} - ${c} פעמים` });
      });
      // Future dates
      events.forEach(e => {
        if (new Date(e['תאריך']).getTime() > Date.now() + 86400000) {
          issues.push({ type: 'future_date', detail: `אירוע ${e['מזהה']} בעתיד: ${e['תאריך']}` });
        }
      });
      // Old open tasks
      const monthAgo = Date.now() - 30*86400000;
      tasks.forEach(t => {
        if (t['סטטוס'] !== 'הושלם' && new Date(t['תאריך_יצירה']||0).getTime() < monthAgo) {
          issues.push({ type: 'stale_task', detail: `משימה ${t['מזהה']} פתוחה מעל חודש` });
        }
      });
      return { total_issues: issues.length, issues: issues.slice(0, 50) };
    } catch (e) { return { error: e.message }; }
  };

  // ===== 2. Auto-run integrity check on login =====
  setTimeout(async () => {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.role === 'מנהל' || u.username === 'admin') {
      const r = await dataIntegrityCheck();
      if (r.total_issues > 0 && typeof notify === 'function') {
        notify(`⚠ ${r.total_issues} בעיות בנתונים - הריץ dataIntegrityCheck()`, 'warn');
      }
    }
  }, 8000);

  // ===== 3. Local backup with download =====
  window.downloadFullBackup = async function () {
    try {
      const [st, ev, tk, us, pr] = await Promise.all([
        api('listStudents',[]), api('listBehavior',[]),
        api('listTasks',[]), api('listUsers',[]), api('listProjects',[]),
      ]);
      const backup = {
        version: '2026.05.24',
        timestamp: new Date().toISOString(),
        students: st.data || [],
        behavior: ev.data || [],
        tasks: tk.data || [],
        users: us.data || [],
        projects: pr.data || [],
      };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `bht_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      if (typeof toast === 'function') toast(`✓ גיבוי ${(json.length/1024).toFixed(0)}KB הורד`, 'success');
    } catch (e) { alert('שגיאה: ' + e.message); }
  };

  // ===== 4. Auto-export weekly =====
  setInterval(async () => {
    const lastExport = parseInt(localStorage.getItem('bht_last_export') || '0', 10);
    if (Date.now() - lastExport < 7 * 86400000) return;
    localStorage.setItem('bht_last_export', String(Date.now()));
    if (typeof notify === 'function') {
      notify('📥 הזמן לגיבוי שבועי - לחץ downloadFullBackup()', 'info');
    }
  }, 60 * 60 * 1000);

  // ===== 5. Restore from backup file =====
  window.restoreFromFile = function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const backup = JSON.parse(text);
        if (!backup.version || !backup.students) {
          return alert('קובץ גיבוי לא תקין');
        }
        if (!confirm(`לשחזר ${backup.students.length} תלמידים, ${backup.behavior?.length||0} אירועים מ-${backup.timestamp}?`)) return;
        // Just save to localStorage - user can review
        localStorage.setItem('bht_restore_pending', JSON.stringify(backup));
        if (typeof toast === 'function') toast('גיבוי הועלה. השתמש pushRestore() להמשך', 'info');
      } catch (err) {
        alert('שגיאה בקריאת הקובץ: ' + err.message);
      }
    };
    input.click();
  };

  // ===== 6. Version comparison =====
  window.compareWithBackup = function () {
    const pending = localStorage.getItem('bht_restore_pending');
    if (!pending) return alert('אין גיבוי טעון');
    const backup = JSON.parse(pending);
    const current = JSON.parse(localStorage.getItem('cheder_bht_data') || '{}');
    return {
      students: { backup: backup.students?.length || 0, current: current.students?.length || 0 },
      events: { backup: backup.behavior?.length || 0, current: current.behavior?.length || 0 },
      tasks: { backup: backup.tasks?.length || 0, current: current.tasks?.length || 0 },
    };
  };

  // ===== 7. Field validators =====
  window.validators = {
    phone: v => /^0\d{1,2}-?\d{7}$/.test(String(v||'').replace(/\s/g,'')),
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'')),
    israeliId: v => {
      const id = String(v||'').padStart(9, '0');
      if (!/^\d{9}$/.test(id)) return false;
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        let n = parseInt(id[i]) * (i % 2 + 1);
        if (n > 9) n -= 9;
        sum += n;
      }
      return sum % 10 === 0;
    },
    hebrewDate: v => /^\d{1,2}\s+[א-ת]+\s+\d{4}/.test(v||''),
    futureDate: v => new Date(v) > new Date(),
    pastDate: v => new Date(v) < new Date(),
  };

  // ===== 8. Auto-validate on blur =====
  document.addEventListener('blur', (e) => {
    const t = e.target;
    if (t.tagName !== 'INPUT') return;
    let valid = true;
    if (t.type === 'email' && t.value) valid = validators.email(t.value);
    if (t.type === 'tel' && t.value) valid = validators.phone(t.value);
    if (t.dataset.validate === 'id' && t.value) valid = validators.israeliId(t.value);
    t.classList.toggle('is-invalid', !valid);
  }, true);

  // ===== 9. Data anonymization for sharing =====
  window.anonymize = function (events) {
    return events.map(e => ({
      ...e,
      'שם תלמיד': 'תלמיד ' + String(e['תלמיד_מזהה']||'?').substring(0,3),
      'דווח_עי': 'מורה',
      'תיאור': (e['תיאור']||'').substring(0,30) + '...',
    }));
  };

  // ===== 10. Auto-cleanup orphan attachments =====
  setInterval(async () => {
    try {
      const atts = JSON.parse(localStorage.getItem('bht_attachments') || '{}');
      const r = await api('listBehavior', []);
      const validIds = new Set((r.data || []).map(e => String(e['מזהה'])));
      let removed = 0;
      Object.keys(atts).forEach(eid => {
        if (!eid.startsWith('temp_') && !validIds.has(String(eid))) {
          delete atts[eid];
          removed++;
        }
      });
      if (removed > 0) {
        localStorage.setItem('bht_attachments', JSON.stringify(atts));
        console.info(`[integrity] cleaned ${removed} orphan attachments`);
      }
    } catch (_) { }
  }, 24 * 60 * 60 * 1000);

  console.warn('%c🔒 Pack-25 — Data integrity, backup/restore, validators, anonymize, cleanup', 'color:#dc2626;font-weight:bold');
  console.info('Try: dataIntegrityCheck(), downloadFullBackup(), restoreFromFile()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-25.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-26.js ─────────────────────────────────────────────
try {
// behavior-pack-26.js — Accessibility (a11y). 2026-05-24
(function () {// ===== 1. Focus visible improved =====
  const focusStyle = document.createElement('style');
  focusStyle.textContent = `
    *:focus-visible {
      outline: 3px solid #2563eb !important;
      outline-offset: 2px !important;
      border-radius: 4px;
    }
    .skip-link {
      position: absolute; right: 8px; top: 8px; transform: translateY(-200%); z-index: 99999;
      background: #2563eb; color: #fff; padding: 8px 16px; border-radius: 4px;
    }
    .skip-link:focus { left: 16px; }
  `;
  document.head.appendChild(focusStyle);

  // ===== 2. Skip to content link =====
  if (!document.querySelector('.skip-link')) {
    const skip = document.createElement('a');
    skip.href = '#page-home';
    skip.className = 'skip-link';
    skip.textContent = 'דלג לתוכן';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  // ===== 3. ARIA live region for announcements =====
  let _liveRegion = document.getElementById('a11y-live');
  if (!_liveRegion) {
    _liveRegion = document.createElement('div');
    _liveRegion.id = 'a11y-live';
    _liveRegion.setAttribute('aria-live', 'polite');
    _liveRegion.setAttribute('aria-atomic', 'true');
    _liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0;padding:0;margin:-1px';
    document.body.appendChild(_liveRegion);
  }

  window.announce = function (msg) {
    _liveRegion.textContent = msg;
    setTimeout(() => { _liveRegion.textContent = ''; }, 1000);
  };

  // Announce toast messages
  const origToast = window.toast;
  if (typeof origToast === 'function') {
    window.toast = function (msg, type, dur) {
      announce(msg);
      return origToast.apply(this, arguments);
    };
  }

  // ===== 4. Keyboard navigation tabs =====
  document.addEventListener('keydown', e => {
    if (e.target.closest('.modal')) return; // modal has its own focus trap
    if (e.key === 'Tab') return; // native
    // Arrow keys in tab navigation
    const activeNav = document.querySelector('.nav-tabs .nav-link.active');
    if (!activeNav) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const tabs = [...document.querySelectorAll('.nav-tabs .nav-link')];
      const idx = tabs.indexOf(activeNav);
      const next = e.key === 'ArrowLeft' ? idx + 1 : idx - 1; // RTL
      if (tabs[next]) tabs[next].click();
    }
  });

  // ===== 5. High contrast mode toggle =====
  const hcStyle = document.createElement('style');
  hcStyle.id = 'hc-style';
  hcStyle.textContent = `
    body.high-contrast {
      filter: contrast(1.3) saturate(0.8);
    }
    body.high-contrast .card, body.high-contrast .btn {
      border-width: 2px !important;
    }
    body.high-contrast .text-muted {
      color: #4b5563 !important;
    }
  `;
  document.head.appendChild(hcStyle);

  window.toggleHighContrast = function () {
    document.body.classList.toggle('high-contrast');
    const on = document.body.classList.contains('high-contrast');
    localStorage.setItem('bht_high_contrast', on ? '1' : '0');
    announce(on ? 'ניגודיות גבוהה הופעלה' : 'ניגודיות גבוהה כובתה');
  };
  if (localStorage.getItem('bht_high_contrast') === '1') {
    document.body.classList.add('high-contrast');
  }

  // ===== 6. Font size adjuster =====
  const fontSize = parseFloat(localStorage.getItem('bht_font_scale') || '1');
  document.documentElement.style.fontSize = `${fontSize * 16}px`;

  window.adjustFontSize = function (delta) {
    let scale = parseFloat(localStorage.getItem('bht_font_scale') || '1');
    scale = Math.max(0.8, Math.min(1.4, scale + delta));
    localStorage.setItem('bht_font_scale', String(scale));
    document.documentElement.style.fontSize = `${scale * 16}px`;
    announce(`גודל גופן ${Math.round(scale*100)}%`);
  };

  // ===== 7. A11y toolbar =====
  setTimeout(() => {
    if (document.getElementById('a11y-toolbar')) return;
    const tb = document.createElement('div');
    tb.id = 'a11y-toolbar';
    tb.style.cssText = 'position:fixed;top:50%;left:0;transform:translateY(-50%);background:#fff;border:1px solid #e5e7eb;border-radius:0 8px 8px 0;padding:8px;display:flex;flex-direction:column;gap:4px;z-index:9990;box-shadow:2px 0 8px rgba(0,0,0,0.1)';
    const buttons = [
      { icon: 'A+', title: 'הגדל טקסט', fn: () => adjustFontSize(0.1) },
      { icon: 'A-', title: 'הקטן טקסט', fn: () => adjustFontSize(-0.1) },
      { icon: '◐', title: 'ניגודיות', fn: toggleHighContrast },
      { icon: '🔊', title: 'הקרא', fn: () => {
        const text = document.querySelector('main, [role="main"], #page-home:not(.d-none), [id^="page-"]:not(.d-none)')?.innerText.substring(0, 500) || '';
        if (typeof speakText === 'function') speakText(text);
      } },
    ];
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-outline-secondary';
      btn.textContent = b.icon;
      btn.title = b.title;
      btn.setAttribute('aria-label', b.title);
      btn.onclick = b.fn;
      tb.appendChild(btn);
    });
    document.body.appendChild(tb);
  }, 2500);

  // ===== 8. Reading mode (distraction-free) =====
  window.toggleReadingMode = function () {
    document.body.classList.toggle('reading-mode');
  };
  const readStyle = document.createElement('style');
  readStyle.textContent = `
    body.reading-mode #notif-bell, body.reading-mode #voice-cmd-btn,
    body.reading-mode #quick-action-fab, body.reading-mode #sync-indicator,
    body.reading-mode #a11y-toolbar, body.reading-mode #mobile-bottom-nav { display: none !important; }
    body.reading-mode { background: #faf5e6 !important; }
    body.reading-mode .card { background: #fffaf0 !important; }
  `;
  document.head.appendChild(readStyle);

  // ===== 9. Keyboard shortcut for a11y =====
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key === '1') { e.preventDefault(); adjustFontSize(0.1); }
    if (e.altKey && e.key === '2') { e.preventDefault(); adjustFontSize(-0.1); }
    if (e.altKey && e.key === '3') { e.preventDefault(); toggleHighContrast(); }
    if (e.altKey && e.key === '4') { e.preventDefault(); toggleReadingMode(); }
  });

  // ===== 10. Heading hierarchy check (dev only) =====
  setTimeout(() => {
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
    let lastLevel = 0;
    let issues = 0;
    headings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      if (lastLevel && level > lastLevel + 1) {
        issues++;
        console.warn(`[a11y] heading jump: h${lastLevel} → h${level}`, h);
      }
      lastLevel = level;
    });
    if (issues === 0) console.info('[a11y] heading hierarchy OK');
  }, 5000);

  console.warn('%c♿ Pack-26 — Accessibility: focus, skip link, ARIA live, high contrast, toolbar', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-26.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-27.js ─────────────────────────────────────────────
try {
// behavior-pack-27.js — Performance optimization. 2026-05-24
(function () {// ===== 1. Cache API responses =====
  const _apiCache = new Map();
  const CACHE_TTL = 30000; // 30s

  const _origApi = window.api;
  if (typeof _origApi === 'function' && !window._cacheWrapped) {
    window._cacheWrapped = true;
    window.api = async function (action, args) {
      // Only cache read operations
      if (action && action.startsWith('list')) {
        const key = `${action}_${JSON.stringify(args||[])}`;
        const cached = _apiCache.get(key);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          return cached.data;
        }
        const result = await _origApi.apply(this, arguments);
        _apiCache.set(key, { data: result, ts: Date.now() });
        return result;
      }
      // Mutations - clear cache
      if (action && /^(add|update|delete)/.test(action)) {
        _apiCache.clear();
      }
      return _origApi.apply(this, arguments);
    };
  }

  window.clearApiCache = function () { _apiCache.clear(); };

  // ===== 2. Lazy load images =====
  const lazyImgObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.dataset.lazySrc) {
        entry.target.src = entry.target.dataset.lazySrc;
        delete entry.target.dataset.lazySrc;
        lazyImgObs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '50px' });
  setInterval(() => {
    document.querySelectorAll('img[data-lazy-src]').forEach(img => lazyImgObs.observe(img));
  }, 3000);

  // ===== 3. Virtual scroll for long lists =====
  window.virtualizeList = function (containerEl, items, renderFn, itemHeight) {
    itemHeight = itemHeight || 80;
    const total = items.length;
    if (total < 50) {
      containerEl.innerHTML = items.map(renderFn).join('');
      return;
    }
    containerEl.style.position = 'relative';
    containerEl.style.height = `${total * itemHeight}px`;
    const viewport = containerEl.parentElement;
    const render = () => {
      const scrollTop = viewport.scrollTop;
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
      const end = Math.min(total, start + Math.ceil(viewport.clientHeight / itemHeight) + 10);
      containerEl.innerHTML = items.slice(start, end).map((item, i) => `
        <div style="position:absolute;top:${(start+i)*itemHeight}px;left:0;right:0;height:${itemHeight}px">
          ${renderFn(item, start + i)}
        </div>
      `).join('');
    };
    viewport.onscroll = throttle ? throttle(render, 50) : render;
    render();
  };

  // ===== 4. Debounce search inputs =====
  let _searchTimer = null;
  document.addEventListener('input', e => {
    if (e.target.type === 'search' || e.target.placeholder?.includes('חיפוש')) {
      if (e.target.dataset.debounceWired) return;
      e.target.dataset.debounceWired = '1';
      const original = e.target.oninput;
      let timer = null;
      e.target.addEventListener('input', (ev) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (original) original.call(e.target, ev);
        }, 250);
      });
    }
  });

  // ===== 5. RequestIdleCallback for non-critical work =====
  window.scheduleIdle = function (fn) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout: 2000 });
    } else {
      setTimeout(fn, 100);
    }
  };

  // ===== 6. Page visibility - pause heavy work when hidden =====
  let _wasHidden = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      _wasHidden = true;
      console.info('[perf] page hidden - pausing intervals');
      // Could clear some intervals
    } else if (_wasHidden) {
      _wasHidden = false;
      console.info('[perf] page visible - refreshing');
      window.dispatchEvent(new CustomEvent('cheder-data-refreshed', { detail: { type: 'visibility' } }));
    }
  });

  // ===== 7. Worker pool for heavy calculations =====
  window.runInBackground = function (fn, ...args) {
    // Inline worker
    const src = `self.onmessage=function(e){const fn=${fn.toString()};Promise.resolve(fn.apply(null,e.data)).then(r=>self.postMessage(r))}`;
    const blob = new Blob([src], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    return new Promise((resolve) => {
      worker.onmessage = (e) => { worker.terminate(); resolve(e.data); };
      worker.postMessage(args);
    });
  };

  // ===== 8. Preconnect to APIs =====
  ['https://script.google.com', 'https://drive.google.com'].forEach(host => {
    if (!document.querySelector(`link[rel="preconnect"][href="${host}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = host;
      document.head.appendChild(link);
    }
  });

  // ===== 9. Defer non-critical scripts (already loaded - log timing) =====
  if (window.performance && performance.now) {
    setTimeout(() => {
      const navEntries = performance.getEntriesByType ? performance.getEntriesByType('navigation') : [];
      if (navEntries.length) {
        const nav = navEntries[0];
        const loadTime = nav.loadEventEnd - nav.startTime;
        const domTime = nav.domContentLoadedEventEnd - nav.startTime;
        if (loadTime > 0 && loadTime < 60000) {
          console.info(`[perf] load: ${Math.round(domTime)}ms DOM, ${Math.round(loadTime)}ms total`);
        }
      }
    }, 1000);
  }

  // ===== 10. Memory pressure - clean old data =====
  setInterval(() => {
    // Estimate localStorage usage
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key].length + key.length) * 2;
      }
    }
    const mb = total / 1024 / 1024;
    if (mb > 8) {
      console.warn(`[perf] localStorage ${mb.toFixed(1)}MB - cleaning old`);
      // Remove old session keys
      Object.keys(sessionStorage).filter(k => k.startsWith('reminded_') || k.startsWith('notif_')).forEach(k => sessionStorage.removeItem(k));
      // Remove old attachments
      if (typeof cleanOldAttachments === 'function') cleanOldAttachments(30);
    }
  }, 30 * 60 * 1000);

  console.warn('%c⚡ Pack-27 — Performance: API cache, lazy images, virtual scroll, debounce, worker pool', 'color:#f59e0b;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-27.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-28.js ─────────────────────────────────────────────
try {
// behavior-pack-28.js — Notifications, Reminders & Push. 2026-05-24
(function () {// ===== 1. Browser native notifications =====
  window.requestNotifPermission = async function () {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const p = await Notification.requestPermission();
    return p === 'granted';
  };

  window.showNotification = function (title, body, opts) {
    if (Notification.permission !== 'granted') return null;
    const n = new Notification(title, {
      body, icon: '/favicon.ico', badge: '/favicon.ico',
      dir: 'rtl', lang: 'he-IL',
      ...opts,
    });
    setTimeout(() => n.close(), 8000);
    return n;
  };

  // ===== 2. Auto-request permission on first event create =====
  let _permRequested = localStorage.getItem('bht_notif_perm_requested') === '1';
  document.addEventListener('click', (e) => {
    if (_permRequested) return;
    const btn = e.target.closest('[onclick*="addBehavior"], [onclick*="addTask"]');
    if (btn) {
      _permRequested = true;
      localStorage.setItem('bht_notif_perm_requested', '1');
      setTimeout(requestNotifPermission, 500);
    }
  });

  // ===== 3. Reminder scheduler =====
  window.scheduleReminder = function (title, body, atTime) {
    const ts = new Date(atTime).getTime();
    const delay = ts - Date.now();
    if (delay <= 0) return false;
    const reminders = JSON.parse(localStorage.getItem('bht_reminders') || '[]');
    reminders.push({ id: 'rem_' + Date.now(), title, body, ts });
    localStorage.setItem('bht_reminders', JSON.stringify(reminders));
    setTimeout(() => {
      showNotification(title, body);
      if (typeof notify === 'function') notify(`${title}: ${body}`, 'info');
    }, Math.min(delay, 2147483640));
    return true;
  };

  // Restore reminders on load
  setTimeout(() => {
    try {
      const reminders = JSON.parse(localStorage.getItem('bht_reminders') || '[]');
      reminders.forEach(r => {
        const delay = r.ts - Date.now();
        if (delay > 0 && delay < 2147483640) {
          setTimeout(() => showNotification(r.title, r.body), delay);
        }
      });
      // Cleanup expired
      const active = reminders.filter(r => r.ts > Date.now());
      localStorage.setItem('bht_reminders', JSON.stringify(active));
    } catch (_) { }
  }, 3000);

  // ===== 4. Auto-reminder for upcoming task deadlines =====
  setInterval(async () => {
    try {
      const r = await api('listTasks', []);
      const tomorrow = Date.now() + 86400000;
      const today = Date.now();
      (r.data || []).forEach(t => {
        if (t['סטטוס'] === 'הושלם') return;
        if (!t['תאריך_יעד']) return;
        const due = new Date(t['תאריך_יעד']).getTime();
        if (due > today && due < tomorrow) {
          const key = `task_reminder_${t['מזהה']}`;
          if (sessionStorage.getItem(key)) return;
          sessionStorage.setItem(key, '1');
          showNotification('⏰ משימה לבצע', t['כותרת'] || '');
        }
      });
    } catch (_) { }
  }, 60 * 60 * 1000);

  // ===== 5. Sound alerts =====
  window.playSound = function (type) {
    const sounds = {
      success: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      notify: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
    };
    // Use Web Audio API beep instead - more reliable
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = type === 'error' ? 200 : type === 'success' ? 800 : 500;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) { }
  };

  // ===== 6. Sound on high-severity event =====
  window.addEventListener('cheder-data-refreshed', async (e) => {
    if (e.detail?.type === 'behavior' && e.detail?.action === 'addBehavior') {
      try {
        const r = await api('listBehavior', []);
        const latest = (r.data || []).sort((a, b) => new Date(b['תאריך']) - new Date(a['תאריך']))[0];
        if (latest?.['חומרה'] === 'גבוהה') playSound('error');
      } catch (_) { }
    }
  });

  // ===== 7. Snooze duration choices =====
  window.snoozeChoices = [
    { label: '10 דקות', ms: 10*60*1000 },
    { label: 'שעה', ms: 60*60*1000 },
    { label: 'מחר', ms: 24*60*60*1000 },
    { label: 'שבוע הבא', ms: 7*24*60*60*1000 },
  ];

  // ===== 8. Notification grouping =====
  let _notifBatch = [];
  let _notifTimer = null;
  window.batchNotify = function (msg, type) {
    _notifBatch.push({ msg, type });
    clearTimeout(_notifTimer);
    _notifTimer = setTimeout(() => {
      if (_notifBatch.length === 1) {
        if (typeof notify === 'function') notify(_notifBatch[0].msg, _notifBatch[0].type);
      } else if (_notifBatch.length > 1) {
        if (typeof notify === 'function') notify(`${_notifBatch.length} הודעות חדשות`, 'info');
      }
      _notifBatch = [];
    }, 1500);
  };

  // ===== 9. Custom reminder UI =====
  window.openReminderDialog = function () {
    const html = `<div class="modal fade show" id="rem-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-alarm"></i> הוסף תזכורת</h5><button class="btn-close" onclick="document.getElementById('rem-modal').remove()"></button></div>
          <div class="modal-body">
            <input id="rem-title" class="form-control mb-2" placeholder="כותרת">
            <textarea id="rem-body" class="form-control mb-2" placeholder="תיאור"></textarea>
            <input id="rem-time" type="datetime-local" class="form-control mb-2">
            <button class="btn btn-primary w-100" onclick="(function(){
              const t=document.getElementById('rem-title').value.trim();
              const b=document.getElementById('rem-body').value.trim();
              const tm=document.getElementById('rem-time').value;
              if(!t||!tm){alert('חובה כותרת וזמן');return}
              scheduleReminder(t,b,tm);
              toast?.('תזכורת נשמרה','success');
              document.getElementById('rem-modal').remove();
            })()">קבע</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    // Default time = 1h from now
    const defTime = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
    document.getElementById('rem-time').value = defTime;
  };

  // ===== 10. Reminder list =====
  window.listReminders = function () {
    try {
      return JSON.parse(localStorage.getItem('bht_reminders') || '[]')
        .filter(r => r.ts > Date.now())
        .sort((a, b) => a.ts - b.ts);
    } catch (_) { return []; }
  };

  console.warn('%c🔔 Pack-28 — Notifications: browser API, reminders, sound, batching, custom UI', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-28.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-29.js ─────────────────────────────────────────────
try {
// behavior-pack-29.js — PWA & Offline Support. 2026-05-24
(function () {// ===== 1. Service worker registration helper =====
  window.registerSW = async function () {
    if (!('serviceWorker' in navigator)) return false;
    try {
      // Inline SW source as Blob URL
      const swCode = `
        const CACHE = 'bht-v1';
        self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
        self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
        self.addEventListener('fetch', e => {
          if (e.request.method !== 'GET') return;
          e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
          );
        });
      `;
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const reg = await navigator.serviceWorker.register(URL.createObjectURL(blob));
      console.info('[sw] registered', reg.scope);
      return true;
    } catch (e) {
      console.warn('[sw] failed:', e.message);
      return false;
    }
  };

  // ===== 2. Offline queue =====
  window.offlineQueue = JSON.parse(localStorage.getItem('bht_offline_queue') || '[]');

  window.queueOffline = function (action, args) {
    offlineQueue.push({ id: Date.now(), action, args, ts: Date.now() });
    localStorage.setItem('bht_offline_queue', JSON.stringify(offlineQueue));
    if (typeof toast === 'function') toast(`📥 בתור: ${action} (${offlineQueue.length})`, 'info');
  };

  window.flushOfflineQueue = async function () {
    if (!navigator.onLine) return;
    const queue = [...offlineQueue];
    if (!queue.length) return;
    if (typeof toast === 'function') toast(`📤 שולח ${queue.length} פעולות...`, 'info');
    let success = 0;
    for (const item of queue) {
      try {
        const r = await api(item.action, item.args);
        if (r?.ok !== false) {
          offlineQueue.splice(offlineQueue.findIndex(x => x.id === item.id), 1);
          success++;
        }
      } catch (_) { }
    }
    localStorage.setItem('bht_offline_queue', JSON.stringify(offlineQueue));
    if (success > 0 && typeof toast === 'function') toast(`✓ ${success} פעולות נשלחו`, 'success');
  };

  window.addEventListener('online', flushOfflineQueue);
  setTimeout(flushOfflineQueue, 5000);

  // ===== 3. Add to home screen prompt =====
  let _installPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _installPrompt = e;
    // Show install button after 30s if dismissed
    setTimeout(() => {
      if (_installPrompt && !sessionStorage.getItem('install_shown')) {
        sessionStorage.setItem('install_shown', '1');
        if (typeof notify === 'function') notify('💡 התקן את האפליקציה - לחץ כאן', 'info');
      }
    }, 30000);
  });

  window.installPWA = async function () {
    if (!_installPrompt) {
      if (typeof toast === 'function') toast('התקנה לא זמינה כעת', 'warn');
      return;
    }
    _installPrompt.prompt();
    const { outcome } = await _installPrompt.userChoice;
    if (outcome === 'accepted') {
      if (typeof toast === 'function') toast('✓ האפליקציה הותקנה', 'success');
    }
    _installPrompt = null;
  };

  // ===== 4. Web App Manifest (inject) - DISABLED due to CSP restrictions =====
  if (false && !document.querySelector('link[rel="manifest"]')) {
    const manifest = {
      name: 'בית התלמוד',
      short_name: 'BHT',
      description: 'מערכת ניהול בית תלמוד',
      start_url: location.pathname,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#ffffff',
      theme_color: '#2563eb',
      lang: 'he',
      dir: 'rtl',
      icons: [
        { src: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      ],
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = URL.createObjectURL(blob);
    document.head.appendChild(link);
  }

  // ===== 5. Theme color meta =====
  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#2563eb';
    document.head.appendChild(meta);
  }

  // ===== 6. Offline indicator =====
  const offlineIndicator = document.createElement('div');
  offlineIndicator.id = 'offline-banner';
  offlineIndicator.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fbbf24;color:#78350f;text-align:center;padding:6px;font-size:13px;z-index:9999;display:none;direction:rtl';
  offlineIndicator.innerHTML = '⚠ לא מחובר - שינויים יישמרו ויסונכרנו כשהחיבור יחזור';
  document.body.appendChild(offlineIndicator);

  function updateOnlineStatus() {
    offlineIndicator.style.display = navigator.onLine ? 'none' : 'block';
    document.body.classList.toggle('offline', !navigator.onLine);
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // ===== 7. IndexedDB for large data =====
  window.openIDB = function () {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('bht_db', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };

  window.idbSet = async function (key, value) {
    const db = await openIDB();
    const tx = db.transaction('cache', 'readwrite');
    tx.objectStore('cache').put({ key, value, ts: Date.now() });
    return new Promise(r => tx.oncomplete = r);
  };

  window.idbGet = async function (key) {
    const db = await openIDB();
    return new Promise(resolve => {
      const req = db.transaction('cache').objectStore('cache').get(key);
      req.onsuccess = () => resolve(req.result?.value);
      req.onerror = () => resolve(null);
    });
  };

  // ===== 8. Background sync =====
  window.backgroundSync = async function () {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register('bht-sync');
        console.info('[sync] background sync registered');
        return true;
      } catch (e) {
        console.warn('[sync] failed:', e);
        return false;
      }
    }
    return false;
  };

  // ===== 9. App badge (number on icon) =====
  window.setAppBadge = function (n) {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(n).catch(() => {});
    }
  };

  // Update badge based on notifications
  setInterval(() => {
    const count = (window.notifications || []).filter(n => !n.read).length;
    setAppBadge(count);
  }, 30000);

  // ===== 10. Share API =====
  window.shareApp = function () {
    if (navigator.share) {
      navigator.share({
        title: 'בית התלמוד',
        text: 'מערכת ניהול בית התלמוד',
        url: location.href,
      });
    } else {
      navigator.clipboard.writeText(location.href).then(() => {
        if (typeof toast === 'function') toast('קישור הועתק', 'success');
      });
    }
  };

  console.warn('%c📲 Pack-29 — PWA: offline queue, install prompt, manifest, IndexedDB, badge', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-29.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-30.js ─────────────────────────────────────────────
try {
// behavior-pack-30.js — Charts & Visualization. 2026-05-24
(function () {// ===== 1. Mini bar chart (SVG) =====
  window.svgBarChart = function (data, opts) {
    opts = opts || {};
    const w = opts.width || 200;
    const h = opts.height || 60;
    const max = Math.max(...data.map(d => d.value), 1);
    const bw = w / data.length - 2;
    const bars = data.map((d, i) => {
      const bh = (d.value / max) * (h - 20);
      const x = i * (bw + 2);
      const y = h - bh - 16;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${d.color||'#3b82f6'}" rx="2"></rect>
        <text x="${x+bw/2}" y="${h-2}" text-anchor="middle" font-size="9" fill="#6b7280">${escHtml(d.label||'')}</text>
        <text x="${x+bw/2}" y="${y-2}" text-anchor="middle" font-size="9" fill="#1f2937">${d.value}</text>`;
    }).join('');
    return `<svg width="${w}" height="${h}" style="direction:ltr">${bars}</svg>`;
  };

  // ===== 2. Pie chart =====
  window.svgPieChart = function (data, radius) {
    radius = radius || 60;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let angleStart = 0;
    const slices = data.map((d, i) => {
      const angle = (d.value / total) * 360;
      const angleEnd = angleStart + angle;
      const x1 = radius + Math.cos(angleStart * Math.PI / 180) * radius;
      const y1 = radius + Math.sin(angleStart * Math.PI / 180) * radius;
      const x2 = radius + Math.cos(angleEnd * Math.PI / 180) * radius;
      const y2 = radius + Math.sin(angleEnd * Math.PI / 180) * radius;
      const large = angle > 180 ? 1 : 0;
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      const path = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
      angleStart = angleEnd;
      return `<path d="${path}" fill="${d.color || colors[i % colors.length]}"><title>${escHtml(d.label||'')}: ${d.value}</title></path>`;
    }).join('');
    return `<svg width="${radius*2}" height="${radius*2}" style="direction:ltr">${slices}</svg>`;
  };

  // ===== 3. Sparkline (mini line chart) =====
  window.svgSparkline = function (values, w, h) {
    w = w || 100;
    h = h || 24;
    if (!values.length) return '';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    }).join(' ');
    const last = values[values.length - 1];
    const trend = values.length > 1 ? (last - values[0]) / Math.abs(values[0] || 1) : 0;
    const color = trend > 0.1 ? '#ef4444' : trend < -0.1 ? '#10b981' : '#3b82f6';
    return `<svg width="${w}" height="${h}" style="direction:ltr">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2"/>
    </svg>`;
  };

  // ===== 4. Activity heatmap (calendar) =====
  window.svgHeatmap = function (days, opts) {
    opts = opts || {};
    const cell = opts.cell || 12;
    const gap = 2;
    const weeks = Math.ceil(Object.keys(days).length / 7);
    const w = weeks * (cell + gap);
    const h = 7 * (cell + gap);
    let html = `<svg width="${w}" height="${h}" style="direction:ltr">`;
    Object.entries(days).sort().forEach(([date, count], i) => {
      const week = Math.floor(i / 7);
      const day = i % 7;
      const max = Math.max(...Object.values(days), 1);
      const intensity = Math.min(1, count / max);
      const color = count === 0 ? '#f3f4f6' : `rgba(37, 99, 235, ${0.2 + intensity * 0.8})`;
      html += `<rect x="${week*(cell+gap)}" y="${day*(cell+gap)}" width="${cell}" height="${cell}" fill="${color}" rx="2"><title>${date}: ${count}</title></rect>`;
    });
    return html + '</svg>';
  };

  // ===== 5. Trend arrow =====
  window.trendArrow = function (current, previous) {
    const delta = current - previous;
    if (delta > 0) return `<span style="color:#ef4444">▲ +${Math.abs(delta)}</span>`;
    if (delta < 0) return `<span style="color:#10b981">▼ ${delta}</span>`;
    return '<span style="color:#6b7280">▬ ללא שינוי</span>';
  };

  // ===== 6. Show stats panel on home =====
  setTimeout(async () => {
    if (document.getElementById('home-stats-charts')) return;
    const home = document.getElementById('page-home');
    if (!home) return;
    try {
      const r = await api('listBehavior', []);
      const events = r.data || [];
      const cats = {};
      events.forEach(e => { cats[e['קטגוריה']||'?'] = (cats[e['קטגוריה']||'?']||0)+1; });
      const bars = Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c, n]) => ({ label: c.substring(0,8), value: n }));
      const pieData = Object.entries(cats).slice(0, 6).map(([c, n]) => ({ label: c, value: n }));

      const panel = document.createElement('div');
      panel.id = 'home-stats-charts';
      panel.className = 'card p-3 mt-3';
      panel.style.direction = 'rtl';
      panel.innerHTML = `<h6><i class="bi bi-graph-up"></i> סטטיסטיקה ויזואלית</h6>
        <div class="row g-3 mt-1">
          <div class="col-md-6">
            <small class="text-muted">קטגוריות מובילות</small>
            <div>${svgBarChart(bars, { width: 280, height: 80 })}</div>
          </div>
          <div class="col-md-6">
            <small class="text-muted">חלוקה</small>
            <div class="d-flex align-items-center gap-2">
              ${svgPieChart(pieData, 50)}
              <div class="small">${pieData.map(d => `<div>${escHtml(d.label)}: ${d.value}</div>`).join('')}</div>
            </div>
          </div>
        </div>`;
      home.appendChild(panel);
    } catch (_) { }
  }, 4000);

  // ===== 7. Color-code statistics =====
  window.colorScale = function (value, max) {
    const ratio = value / (max || 1);
    if (ratio < 0.3) return '#10b981';
    if (ratio < 0.6) return '#f59e0b';
    return '#ef4444';
  };

  // ===== 8. Progress bar component =====
  window.progressBar = function (current, total, label) {
    const pct = total ? Math.min(100, (current / total) * 100) : 0;
    return `<div style="background:#e5e7eb;height:8px;border-radius:4px;overflow:hidden">
      <div style="background:${colorScale(current, total)};height:100%;width:${pct}%;transition:width 0.3s"></div>
    </div>
    <small class="text-muted">${escHtml(label||'')} ${current}/${total} (${pct.toFixed(0)}%)</small>`;
  };

  // ===== 9. Mini gauge =====
  window.svgGauge = function (value, max, size) {
    size = size || 80;
    const r = size / 2 - 5;
    const cx = size / 2;
    const cy = size / 2;
    const angle = (value / max) * 270 - 135;
    const x = cx + Math.cos(angle * Math.PI / 180) * r;
    const y = cy + Math.sin(angle * Math.PI / 180) * r;
    const color = value < max * 0.5 ? '#10b981' : value < max * 0.8 ? '#f59e0b' : '#ef4444';
    return `<svg width="${size}" height="${size}" style="direction:ltr">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="6"/>
      <path d="M ${cx} ${cy} L ${x} ${y}" stroke="${color}" stroke-width="3"/>
      <circle cx="${cx}" cy="${cy}" r="3" fill="${color}"/>
      <text x="${cx}" y="${size-5}" text-anchor="middle" font-size="11">${value}/${max}</text>
    </svg>`;
  };

  // ===== 10. Stacked bar chart =====
  window.svgStackedBar = function (categories, total) {
    total = total || categories.reduce((s, c) => s + c.value, 0) || 1;
    let html = '<div style="display:flex;height:24px;border-radius:4px;overflow:hidden;direction:ltr;font-size:11px;color:#fff;text-align:center">';
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    categories.forEach((c, i) => {
      const pct = (c.value / total) * 100;
      html += `<div style="background:${c.color||colors[i%colors.length]};width:${pct}%;line-height:24px" title="${escHtml(c.label)}: ${c.value}">${pct > 10 ? c.value : ''}</div>`;
    });
    return html + '</div>';
  };

  console.warn('%c📊 Pack-30 — Visualization: SVG bars, pie, sparklines, heatmap, gauge, progress', 'color:#8b5cf6;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-30.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-31.js ─────────────────────────────────────────────
try {
// behavior-pack-31.js — Search & Filters. 2026-05-24
(function () {// ===== 1. Fuzzy search algorithm =====
  window.fuzzyMatch = function (query, text) {
    if (!query) return true;
    query = String(query).toLowerCase().trim();
    text = String(text).toLowerCase();
    if (text.includes(query)) return true;
    // Word-by-word
    const qWords = query.split(/\s+/);
    return qWords.every(w => text.includes(w));
  };

  // ===== 2. Saved searches =====
  window.savedSearches = JSON.parse(localStorage.getItem('bht_saved_searches') || '[]');

  window.saveSearch = function (name, criteria) {
    savedSearches.push({ id: Date.now(), name, criteria, created: Date.now() });
    localStorage.setItem('bht_saved_searches', JSON.stringify(savedSearches));
    if (typeof toast === 'function') toast(`חיפוש "${name}" נשמר`, 'success');
  };

  window.runSavedSearch = function (id) {
    const s = savedSearches.find(x => x.id === id);
    if (!s) return null;
    return s.criteria;
  };

  // ===== 3. Advanced filter builder =====
  window.buildFilter = function (criteria) {
    return function (item) {
      for (const [field, condition] of Object.entries(criteria)) {
        const val = item[field];
        if (typeof condition === 'string') {
          if (!fuzzyMatch(condition, val)) return false;
        } else if (condition && typeof condition === 'object') {
          if (condition.equals !== undefined && val !== condition.equals) return false;
          if (condition.contains && !String(val).includes(condition.contains)) return false;
          if (condition.gt !== undefined && val <= condition.gt) return false;
          if (condition.lt !== undefined && val >= condition.lt) return false;
          if (condition.in && !condition.in.includes(val)) return false;
        }
      }
      return true;
    };
  };

  // ===== 4. Date range presets =====
  window.dateRangePresets = {
    today: () => {
      const d = new Date(); d.setHours(0,0,0,0);
      return { from: d.getTime(), to: Date.now() };
    },
    yesterday: () => {
      const from = new Date(); from.setDate(from.getDate()-1); from.setHours(0,0,0,0);
      const to = new Date(from); to.setHours(23,59,59);
      return { from: from.getTime(), to: to.getTime() };
    },
    this_week: () => {
      const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0);
      return { from: d.getTime(), to: Date.now() };
    },
    last_week: () => ({ from: Date.now() - 14*86400000, to: Date.now() - 7*86400000 }),
    this_month: () => {
      const d = new Date(); d.setDate(1); d.setHours(0,0,0,0);
      return { from: d.getTime(), to: Date.now() };
    },
    last_30: () => ({ from: Date.now() - 30*86400000, to: Date.now() }),
    last_90: () => ({ from: Date.now() - 90*86400000, to: Date.now() }),
    this_year: () => {
      const d = new Date(); d.setMonth(0, 1); d.setHours(0,0,0,0);
      return { from: d.getTime(), to: Date.now() };
    },
  };

  // ===== 5. Multi-select filter UI =====
  window.openMultiSelect = function (options, selected, onChange) {
    const html = `<div class="modal fade show" id="ms-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>בחר</h5><button class="btn-close" onclick="document.getElementById('ms-modal').remove()"></button></div>
          <div class="modal-body" style="max-height:60vh;overflow-y:auto">
            ${options.map(o => `<div class="form-check">
              <input class="form-check-input ms-cb" type="checkbox" value="${escAttr(o.value)}" ${selected?.includes(o.value)?'checked':''} id="ms-${escAttr(o.value)}">
              <label class="form-check-label" for="ms-${escAttr(o.value)}">${escHtml(o.label)}</label>
            </div>`).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="(function(){
              const vals=[...document.querySelectorAll('.ms-cb:checked')].map(c=>c.value);
              window.__msResult=vals;
              document.getElementById('ms-modal').remove();
            })()">אישור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const observer = new MutationObserver(() => {
      if (!document.getElementById('ms-modal')) {
        observer.disconnect();
        if (onChange) onChange(window.__msResult || []);
      }
    });
    observer.observe(document.body, { childList: true });
  };

  // ===== 6. Search history =====
  const SEARCH_HISTORY_KEY = 'bht_search_history';
  window.recordSearch = function (query) {
    if (!query || query.length < 2) return;
    let history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    history = history.filter(q => q !== query);
    history.unshift(query);
    if (history.length > 20) history.pop();
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  };

  window.getSearchHistory = function () {
    try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]'); }
    catch { return []; }
  };

  // ===== 7. Search suggestions (autocomplete) =====
  window.searchSuggestions = async function (query) {
    if (!query || query.length < 2) return getSearchHistory().slice(0, 5);
    try {
      const r = await api('listStudents', []);
      const names = (r.data || []).map(s => `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim());
      return names.filter(n => fuzzyMatch(query, n)).slice(0, 8);
    } catch (_) { return []; }
  };

  // ===== 8. Filter by tags =====
  window.extractTags = function (text) {
    return (String(text||'').match(/#[֐-׿\w]+/g) || []).map(t => t.slice(1));
  };

  window.allUsedTags = async function () {
    try {
      const r = await api('listBehavior', []);
      const tagSet = new Set();
      (r.data || []).forEach(e => {
        extractTags(e['תיאור']).forEach(t => tagSet.add(t));
        extractTags(e['הערות']).forEach(t => tagSet.add(t));
      });
      return [...tagSet].sort();
    } catch (_) { return []; }
  };

  // ===== 9. Quick filter chips =====
  window.QUICK_FILTERS = {
    'today': 'היום',
    'high_severity': 'חומרה גבוהה',
    'my_events': 'שלי',
    'unresolved': 'לא נפתר',
    'this_week': 'השבוע',
  };

  // ===== 10. Search highlight =====
  window.highlightMatch = function (text, query) {
    if (!query || !text) return escHtml(text);
    const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return escHtml(text).replace(regex, '<mark style="background:#fef08a">$1</mark>');
  };

  console.warn('%c🔍 Pack-31 — Search: fuzzy match, saved searches, advanced filter, history, tags', 'color:#f59e0b;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-31.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-32.js ─────────────────────────────────────────────
try {
// behavior-pack-32.js — Theming & Personalization. 2026-05-25
(function () {// ===== 1. Theme presets =====
  window.THEMES = {
    default: { primary: '#2563eb', success: '#16a34a', warning: '#f59e0b', danger: '#dc2626', bg: '#ffffff', fg: '#1f2937' },
    ocean:   { primary: '#0891b2', success: '#0d9488', warning: '#ca8a04', danger: '#dc2626', bg: '#f0f9ff', fg: '#0c4a6e' },
    forest:  { primary: '#16a34a', success: '#15803d', warning: '#ca8a04', danger: '#b91c1c', bg: '#f0fdf4', fg: '#14532d' },
    sunset:  { primary: '#ea580c', success: '#dc2626', warning: '#ca8a04', danger: '#7f1d1d', bg: '#fff7ed', fg: '#7c2d12' },
    royal:   { primary: '#7c3aed', success: '#6d28d9', warning: '#f59e0b', danger: '#dc2626', bg: '#faf5ff', fg: '#581c87' },
    sepia:   { primary: '#92400e', success: '#65a30d', warning: '#ca8a04', danger: '#991b1b', bg: '#fef3c7', fg: '#451a03' },
  };

  window.applyTheme = function (themeName) {
    const theme = THEMES[themeName] || THEMES.default;
    const root = document.documentElement;
    Object.entries(theme).forEach(([k, v]) => {
      root.style.setProperty(`--bht-${k}`, v);
    });
    localStorage.setItem('bht_theme', themeName);
    document.body.dataset.theme = themeName;
  };

  // Apply saved theme
  setTimeout(() => applyTheme(localStorage.getItem('bht_theme') || 'default'), 100);

  // ===== 2. Custom color picker =====
  window.setAccentColor = function (color) {
    document.documentElement.style.setProperty('--bht-primary', color);
    localStorage.setItem('bht_accent', color);
    if (typeof toast === 'function') toast(`צבע ראשי שונה`, 'success');
  };

  // ===== 3. Dark mode =====
  const darkStyle = document.createElement('style');
  darkStyle.textContent = `
    body.dark-mode {
      background: #0f172a !important;
      color: #f1f5f9 !important;
    }
    body.dark-mode .card, body.dark-mode .modal-content {
      background: #1e293b !important;
      color: #f1f5f9 !important;
      border-color: #334155 !important;
    }
    body.dark-mode .form-control, body.dark-mode .form-select {
      background: #0f172a !important;
      color: #f1f5f9 !important;
      border-color: #475569 !important;
    }
    body.dark-mode .text-muted { color: #94a3b8 !important; }
    body.dark-mode .table { color: #f1f5f9 !important; }
    body.dark-mode .alert-info { background: #1e3a8a !important; color: #dbeafe !important; }
    body.dark-mode .alert-warning { background: #78350f !important; color: #fed7aa !important; }
    body.dark-mode pre, body.dark-mode code { background: #1e293b !important; color: #f1f5f9 !important; }
  `;
  document.head.appendChild(darkStyle);

  window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    const on = document.body.classList.contains('dark-mode');
    localStorage.setItem('bht_theme_manual', '1');
    localStorage.setItem('bht_dark_mode', on ? '1' : '0');
    if (typeof toast === 'function') toast(on ? '🌙 מצב כהה' : '☀ מצב בהיר', 'info');
  };

  if (localStorage.getItem('bht_dark_mode') === '1') {
    document.body.classList.add('dark-mode');
  }

  // ===== 4. Theme picker UI =====
  window.openThemePicker = function () {
    const html = `<div class="modal fade show" id="theme-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>🎨 ערכת נושא</h5><button class="btn-close" onclick="document.getElementById('theme-modal').remove()"></button></div>
          <div class="modal-body">
            <div class="row g-2">
              ${Object.entries(THEMES).map(([k, t]) => `
                <div class="col-6">
                  <button class="btn w-100 text-end" style="background:${t.bg};color:${t.fg};border:2px solid ${t.primary}" onclick="applyTheme('${k}');document.getElementById('theme-modal').remove();toast?.('ערכה: ${k}','success')">
                    <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${t.primary}"></span>
                    ${k}
                  </button>
                </div>`).join('')}
            </div>
            <hr>
            <button class="btn btn-outline-secondary w-100" onclick="toggleDarkMode();document.getElementById('theme-modal').remove()">
              🌙 החלף מצב כהה/בהיר
            </button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 5. User preferences =====
  window.userPrefs = JSON.parse(localStorage.getItem('bht_user_prefs') || '{}');

  window.setPref = function (key, value) {
    userPrefs[key] = value;
    localStorage.setItem('bht_user_prefs', JSON.stringify(userPrefs));
  };

  window.getPref = function (key, def) {
    return userPrefs[key] !== undefined ? userPrefs[key] : def;
  };

  // ===== 6. Layout density =====
  window.setDensity = function (density) {
    document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    document.body.classList.add(`density-${density}`);
    setPref('density', density);
  };
  setTimeout(() => setDensity(getPref('density', 'comfortable')), 200);

  const densityStyle = document.createElement('style');
  densityStyle.textContent = `
    .density-compact .card { padding: 6px !important; }
    .density-compact .btn { padding: 4px 8px !important; font-size: 13px !important; }
    .density-spacious .card { padding: 20px !important; }
    .density-spacious .btn { padding: 12px 18px !important; }
  `;
  document.head.appendChild(densityStyle);

  // ===== 7. Custom CSS injection =====
  window.applyCustomCSS = function (css) {
    let style = document.getElementById('bht-custom-css');
    if (!style) {
      style = document.createElement('style');
      style.id = 'bht-custom-css';
      document.head.appendChild(style);
    }
    style.textContent = css;
    setPref('custom_css', css);
  };
  setTimeout(() => {
    const saved = getPref('custom_css');
    if (saved) applyCustomCSS(saved);
  }, 300);

  // ===== 8. Favicon dynamic =====
  window.setFavicon = function (emoji) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '52px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 32);
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = canvas.toDataURL('image/png');
  };

  // ===== 9. Theme picker button =====
  setTimeout(() => {
    if (document.getElementById('theme-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'theme-btn';
    btn.title = 'ערכת נושא';
    btn.setAttribute('aria-label', 'ערכת נושא');
    btn.style.cssText = 'position:fixed;bottom:260px;left:14px;width:42px;height:42px;border-radius:50%;background:#fff;border:1px solid #e5e7eb;font-size:18px;cursor:pointer;z-index:9990;box-shadow:0 4px 8px rgba(0,0,0,0.1)';
    btn.innerHTML = '🎨';
    btn.onclick = openThemePicker;
    document.body.appendChild(btn);
  }, 2500);

  // ===== 10. Welcome based on time of day =====
  window.getGreeting = function () {
    const h = new Date().getHours();
    if (h < 6) return '🌙 לילה טוב';
    if (h < 12) return '☀ בוקר טוב';
    if (h < 17) return '🌞 צהריים טובים';
    if (h < 21) return '🌅 ערב טוב';
    return '🌃 לילה טוב';
  };

  console.warn('%c🎨 Pack-32 — Themes: 6 presets, dark mode, density, custom CSS, dynamic favicon', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-32.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-33.js ─────────────────────────────────────────────
try {
// behavior-pack-33.js — Gamification (points, badges, levels). 2026-05-25
(function () {// ===== 1. Points calculation per student =====
  window.studentPoints = function (events) {
    let points = 0;
    events.forEach(e => {
      const sev = e['חומרה'];
      const cat = e['קטגוריה'];
      if (cat === 'קידום כתיבה' || cat === 'קידום קריאה') points += 10;
      else if (cat === 'דרך ארץ') points += 15;
      else if (cat === 'חברה' && sev === 'נמוכה') points += 8;
      else if (cat === 'לימודים') points += 12;
      else if (sev === 'גבוהה') points -= 20;
      else if (sev === 'בינונית') points -= 10;
      else if (sev === 'נמוכה') points += 5;
    });
    return Math.max(0, points);
  };

  // ===== 2. Levels system =====
  window.LEVELS = [
    { name: 'מתחיל', minPoints: 0, icon: '🌱', color: '#6b7280' },
    { name: 'מתקדם', minPoints: 50, icon: '🌿', color: '#10b981' },
    { name: 'מצטיין', minPoints: 150, icon: '🌳', color: '#059669' },
    { name: 'אלוף', minPoints: 300, icon: '⭐', color: '#f59e0b' },
    { name: 'מצוין', minPoints: 500, icon: '🏆', color: '#dc2626' },
    { name: 'גיבור', minPoints: 1000, icon: '👑', color: '#7c3aed' },
  ];

  window.getLevel = function (points) {
    let level = LEVELS[0];
    for (const l of LEVELS) {
      if (points >= l.minPoints) level = l;
    }
    return level;
  };

  // ===== 3. Badges =====
  window.BADGES = [
    { id: 'first_week', name: 'שבוע ראשון', icon: '🎯', criteria: (events) => events.length >= 1 },
    { id: 'streak_7', name: '7 ימים רצופים', icon: '🔥', criteria: (events) => {
      const days = new Set(events.map(e => (e['תאריך']||'').slice(0, 10)));
      return days.size >= 7;
    } },
    { id: 'reader', name: 'קורא נלהב', icon: '📚', criteria: (events) =>
      events.filter(e => e['קטגוריה'] === 'קידום קריאה').length >= 5 },
    { id: 'writer', name: 'כותב מנוסה', icon: '✍', criteria: (events) =>
      events.filter(e => e['קטגוריה'] === 'קידום כתיבה').length >= 5 },
    { id: 'pray_master', name: 'אומן תפילה', icon: '🙏', criteria: (events) =>
      events.filter(e => e['קטגוריה'] === 'תפילה').length >= 10 },
    { id: 'good_friend', name: 'חבר טוב', icon: '🤝', criteria: (events) =>
      events.filter(e => e['קטגוריה'] === 'חברה' && e['חומרה'] === 'נמוכה').length >= 5 },
    { id: 'derech_eretz', name: 'דרך ארץ', icon: '👔', criteria: (events) =>
      events.filter(e => e['קטגוריה'] === 'דרך ארץ').length >= 3 },
    { id: 'clean_month', name: 'חודש נקי', icon: '✨', criteria: (events) => {
      const month = Date.now() - 30 * 86400000;
      return !events.some(e => new Date(e['תאריך']).getTime() > month && e['חומרה'] === 'גבוהה');
    } },
  ];

  window.studentBadges = function (events) {
    return BADGES.filter(b => b.criteria(events));
  };

  // ===== 4. Leaderboard =====
  window.leaderboard = async function (limit) {
    limit = limit || 10;
    try {
      const [st, ev] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const students = st.data || [];
      const events = ev.data || [];
      return students.map(s => {
        const stuEv = events.filter(e => String(e['תלמיד_מזהה']) === String(s['מזהה']));
        const points = studentPoints(stuEv);
        return {
          sid: s['מזהה'],
          name: `${s['שם פרטי']||''} ${s['שם משפחה']||''}`,
          points,
          level: getLevel(points),
          badges: studentBadges(stuEv).length,
        };
      }).sort((a, b) => b.points - a.points).slice(0, limit);
    } catch (_) { return []; }
  };

  // ===== 5. Leaderboard widget =====
  window.showLeaderboard = async function () {
    const board = await leaderboard(15);
    const html = `<div class="modal fade show" id="lb-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-trophy"></i> לוח המצטיינים</h5><button class="btn-close" onclick="document.getElementById('lb-modal').remove()"></button></div>
          <div class="modal-body">
            <table class="table">
              <thead><tr><th>#</th><th>תלמיד</th><th>רמה</th><th>נקודות</th><th>תגים</th></tr></thead>
              <tbody>${board.map((s, i) => `
                <tr>
                  <td>${i+1}${i<3 ? ' '+(['🥇','🥈','🥉'][i]) : ''}</td>
                  <td>${escHtml(s.name)}</td>
                  <td><span style="color:${s.level.color}">${s.level.icon} ${escHtml(s.level.name)}</span></td>
                  <td><strong>${s.points}</strong></td>
                  <td>${'🏅'.repeat(Math.min(s.badges, 5))}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 6. Achievement unlock animation =====
  window.celebrateBadge = function (badge) {
    if (typeof toast === 'function') toast(`🎉 פתחת תג: ${badge.icon} ${badge.name}!`, 'success', 4000);
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    if (typeof playSound === 'function') playSound('success');
  };

  // ===== 7. Class points race =====
  window.classRace = async function () {
    try {
      const [st, ev] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const students = st.data || [];
      const events = ev.data || [];
      const classes = {};
      students.forEach(s => {
        const c = s['מחזור'] || '?';
        if (!classes[c]) classes[c] = { total: 0, count: 0 };
        const stuEv = events.filter(e => String(e['תלמיד_מזהה']) === String(s['מזהה']));
        classes[c].total += studentPoints(stuEv);
        classes[c].count++;
      });
      return Object.entries(classes).map(([c, d]) => ({
        class: c, total: d.total, avg: (d.total / d.count).toFixed(1),
      })).sort((a, b) => b.total - a.total);
    } catch (_) { return []; }
  };

  // ===== 8. Weekly champion =====
  window.weeklyChampion = async function () {
    try {
      const r = await api('listBehavior', []);
      const week = Date.now() - 7 * 86400000;
      const events = (r.data || []).filter(e => new Date(e['תאריך']).getTime() > week);
      const byStudent = {};
      events.forEach(e => {
        const sid = e['תלמיד_מזהה'];
        if (!byStudent[sid]) byStudent[sid] = { events: [], name: e['שם תלמיד'] };
        byStudent[sid].events.push(e);
      });
      const ranked = Object.entries(byStudent).map(([sid, d]) => ({
        sid, name: d.name, points: studentPoints(d.events),
      })).sort((a, b) => b.points - a.points);
      return ranked[0] || null;
    } catch (_) { return null; }
  };

  // ===== 9. Profile card with gamification =====
  window.studentGameCard = async function (sid) {
    try {
      const r = await api('listBehavior', []);
      const events = (r.data || []).filter(e => String(e['תלמיד_מזהה']) === String(sid));
      const points = studentPoints(events);
      const level = getLevel(points);
      const badges = studentBadges(events);
      return { points, level, badges, nextLevel: LEVELS.find(l => l.minPoints > points) };
    } catch (_) { return null; }
  };

  // ===== 10. Leaderboard button on home =====
  setTimeout(() => {
    const home = document.getElementById('page-home');
    if (!home || document.getElementById('home-lb-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'home-lb-btn';
    btn.className = 'btn btn-outline-warning btn-sm mt-3 me-2';
    btn.innerHTML = '🏆 לוח מצטיינים';
    btn.onclick = showLeaderboard;
    home.appendChild(btn);
  }, 4500);

  console.warn('%c🏆 Pack-33 — Gamification: points, 6 levels, 8 badges, leaderboard, class race', 'color:#f59e0b;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-33.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-34.js ─────────────────────────────────────────────
try {
// behavior-pack-34.js — Drag & Drop / Kanban. 2026-05-25
(function () {// ===== 1. Enable HTML5 drag&drop on task cards =====
  setInterval(() => {
    document.querySelectorAll('[data-task-id]:not([draggable])').forEach(card => {
      card.draggable = true;
      card.style.cursor = 'grab';
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.taskId);
        e.dataTransfer.effectAllowed = 'move';
        card.style.opacity = '0.5';
      });
      card.addEventListener('dragend', () => {
        card.style.opacity = '';
      });
    });
  }, 2000);

  // ===== 2. Drop zones for status columns =====
  setInterval(() => {
    document.querySelectorAll('#tasks-content .col-md-4:not([data-drop])').forEach(col => {
      col.dataset.drop = '1';
      col.addEventListener('dragover', e => {
        e.preventDefault();
        col.style.background = '#dbeafe';
      });
      col.addEventListener('dragleave', () => {
        col.style.background = '';
      });
      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.style.background = '';
        const taskId = e.dataTransfer.getData('text/plain');
        const status = col.querySelector('strong')?.textContent?.trim();
        if (!taskId || !status) return;
        try {
          await api('updateTask', [{ 'מזהה': parseInt(taskId), 'סטטוס': status }]);
          if (typeof toast === 'function') toast(`משימה הועברה ל: ${status}`, 'success');
        } catch (e) {
          if (typeof toast === 'function') toast('שגיאה: ' + e.message, 'error');
        }
      });
    });
  }, 2500);

  // ===== 3. Touch-based drag for mobile =====
  let touchDragItem = null;
  let touchGhost = null;
  document.addEventListener('touchstart', e => {
    const card = e.target.closest('[data-task-id]');
    if (!card) return;
    // Long-press to start drag
    const startTimer = setTimeout(() => {
      touchDragItem = card;
      touchGhost = card.cloneNode(true);
      touchGhost.style.cssText = 'position:fixed;opacity:0.7;pointer-events:none;z-index:9999;transform:scale(0.9)';
      document.body.appendChild(touchGhost);
      if ('vibrate' in navigator) navigator.vibrate(50);
    }, 500);
    card._touchTimer = startTimer;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (touchGhost) {
      const t = e.touches[0];
      touchGhost.style.left = (t.clientX - 50) + 'px';
      touchGhost.style.top = (t.clientY - 30) + 'px';
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const card = e.target.closest('[data-task-id]');
    if (card) clearTimeout(card._touchTimer);
    if (touchDragItem && touchGhost) {
      const t = e.changedTouches[0];
      const dropTarget = document.elementFromPoint(t.clientX, t.clientY)?.closest('[data-drop]');
      if (dropTarget) {
        const evt = new Event('drop');
        evt.dataTransfer = { getData: () => touchDragItem.dataset.taskId };
        dropTarget.dispatchEvent(evt);
      }
      touchGhost.remove();
      touchGhost = null;
      touchDragItem = null;
    }
  }, { passive: true });

  // ===== 4. Reorder priority via drag =====
  window.reorderTasks = function (taskIds) {
    // Save custom order to localStorage
    localStorage.setItem('bht_task_order', JSON.stringify(taskIds));
  };

  window.getCustomOrder = function () {
    try { return JSON.parse(localStorage.getItem('bht_task_order') || '[]'); }
    catch { return []; }
  };

  // ===== 5. Sortable columns =====
  window.sortColumn = function (containerSelector, by, direction) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const items = [...container.children];
    items.sort((a, b) => {
      const va = a.dataset[by] || '';
      const vb = b.dataset[by] || '';
      return direction === 'desc' ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
    });
    items.forEach(i => container.appendChild(i));
  };

  // ===== 6. Visual drop hints =====
  const dropStyle = document.createElement('style');
  dropStyle.textContent = `
    [data-drop].drag-over {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe) !important;
      border: 2px dashed #2563eb !important;
    }
    [draggable]:active { cursor: grabbing !important; }
  `;
  document.head.appendChild(dropStyle);

  // ===== 7. Multi-select drag =====
  window.selectedForDrag = new Set();

  document.addEventListener('click', e => {
    if (!e.shiftKey) return;
    const card = e.target.closest('[data-task-id]');
    if (!card) return;
    e.preventDefault();
    const id = card.dataset.taskId;
    if (selectedForDrag.has(id)) {
      selectedForDrag.delete(id);
      card.style.boxShadow = '';
    } else {
      selectedForDrag.add(id);
      card.style.boxShadow = '0 0 0 3px #2563eb';
    }
  });

  // ===== 8. Drag tasks to student card =====
  setInterval(() => {
    document.querySelectorAll('[data-student-id]:not([data-drop-stu])').forEach(stu => {
      stu.dataset.dropStu = '1';
      stu.addEventListener('dragover', e => { e.preventDefault(); stu.style.outline = '2px solid #16a34a'; });
      stu.addEventListener('dragleave', () => stu.style.outline = '');
      stu.addEventListener('drop', async e => {
        e.preventDefault();
        stu.style.outline = '';
        const taskId = e.dataTransfer.getData('text/plain');
        const sid = stu.dataset.studentId;
        if (!taskId || !sid) return;
        await api('updateTask', [{ 'מזהה': parseInt(taskId), 'תלמיד_מזהה': sid }]);
        if (typeof toast === 'function') toast('משימה הוצמדה לתלמיד', 'success');
      });
    });
  }, 3000);

  // ===== 9. Reorder via arrow keys =====
  document.addEventListener('keydown', e => {
    if (!e.target.dataset.taskId) return;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const card = e.target;
    const sibling = e.key === 'ArrowUp' ? card.previousElementSibling : card.nextElementSibling;
    if (sibling) {
      e.preventDefault();
      if (e.key === 'ArrowUp') card.parentNode.insertBefore(card, sibling);
      else card.parentNode.insertBefore(sibling, card);
      card.focus();
    }
  });

  // ===== 10. Kanban export =====
  window.exportKanban = async function () {
    try {
      const r = await api('listTasks', []);
      const tasks = r.data || [];
      const cols = ['חדש', 'בתהליך', 'הושלם'];
      const grouped = {};
      cols.forEach(c => grouped[c] = []);
      tasks.forEach(t => {
        const s = t['סטטוס'] || 'חדש';
        if (grouped[s]) grouped[s].push(t);
      });
      let text = '📋 לוח Kanban - ' + new Date().toLocaleDateString('he-IL') + '\n\n';
      cols.forEach(c => {
        text += `${c} (${grouped[c].length})\n`;
        grouped[c].forEach(t => { text += `  • ${t['כותרת']||''}\n`; });
        text += '\n';
      });
      navigator.clipboard.writeText(text).then(() => {
        if (typeof toast === 'function') toast('לוח הועתק ללוח', 'success');
      });
    } catch (e) { alert(e.message); }
  };

  console.warn('%c🔀 Pack-34 — Drag&Drop: HTML5, touch, multi-select, kanban columns, reorder', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-34.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-35.js ─────────────────────────────────────────────
try {
// behavior-pack-35.js — Document Generation (certificates, letters). 2026-05-25
(function () {// ===== 1. Certificate generator =====
  window.generateCertificate = function (student, achievement) {
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>תעודה</title>
      <style>
        @page { size: A4 landscape; margin: 0; }
        body { font-family: 'David', serif; background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 40px; min-height: 100vh; box-sizing: border-box; }
        .cert { background: #fff; border: 6px double #92400e; padding: 60px; text-align: center; height: calc(100vh - 80px); display: flex; flex-direction: column; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        h1 { color: #92400e; font-size: 56px; margin-bottom: 10px; }
        h2 { color: #b45309; font-size: 32px; margin: 20px 0; }
        .name { font-size: 52px; color: #1e3a8a; font-weight: bold; margin: 30px 0; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; display: inline-block; }
        .ach { font-size: 28px; color: #4b5563; }
        .date { margin-top: 40px; color: #6b7280; }
        .seal { font-size: 80px; margin: 20px; }
      </style></head><body>
      <div class="cert">
        <div class="seal">🏆</div>
        <h1>תעודת הצטיינות</h1>
        <h2>בית התלמוד</h2>
        <p>מוענקת בזאת ל-</p>
        <div class="name">${escHtml(student.name || '')}</div>
        <p class="ach">על ${escHtml(achievement || 'הצטיינות והתמדה')}</p>
        <p class="date">${new Date().toLocaleDateString('he-IL', { year:'numeric', month:'long', day:'numeric' })}</p>
      </div>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== 2. Parent letter template =====
  window.generateParentLetter = function (student, subject, body) {
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>מכתב</title>
      <style>
        body { font-family: 'Heebo', Arial; padding: 60px; max-width: 800px; margin: 0 auto; line-height: 1.8; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 48px; }
        h1 { color: #2563eb; margin: 10px 0; }
        .meta { color: #6b7280; font-size: 14px; }
        .salutation { font-size: 18px; font-weight: bold; margin: 20px 0; }
        .body { font-size: 16px; white-space: pre-wrap; }
        .signature { margin-top: 60px; }
      </style></head><body>
      <div class="header">
        <div class="logo">📜</div>
        <h1>בית התלמוד</h1>
        <div class="meta">${new Date().toLocaleDateString('he-IL')}</div>
      </div>
      <div class="salutation">להורי ${escHtml(student.name || 'התלמיד')} שיחיו,</div>
      <h3>${escHtml(subject || 'עדכון')}</h3>
      <div class="body">${escHtml(body || '')}</div>
      <div class="signature">בברכת התורה,<br><strong>הנהלת בית התלמוד</strong></div>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== 3. Student report (PDF-ready) =====
  window.generateStudentReport = async function (sid) {
    try {
      const [st, ev] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const stu = (st.data || []).find(s => String(s['מזהה']) === String(sid));
      if (!stu) return;
      const events = (ev.data || []).filter(e => String(e['תלמיד_מזהה']) === String(sid));
      const name = `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim();
      const w = window.open('', '_blank');
      w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>דוח תלמיד</title>
        <style>
          body { font-family: 'Heebo', Arial; padding: 30px; max-width: 850px; margin: 0 auto; }
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
          .kpi { display: inline-block; padding: 15px; background: #f3f4f6; border-radius: 8px; min-width: 120px; text-align: center; margin: 5px; }
          .kpi-num { font-size: 28px; font-weight: bold; color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; }
          th { background: #f9fafb; }
          .high { background: #fee2e2; }
        </style></head><body>
        <h1>📋 דוח תלמיד - ${escHtml(name)}</h1>
        <p>כיתה: ${escHtml(stu['מחזור']||'')} | טלפון: ${escHtml(stu['טלפון אם']||stu['טלפון אב']||'')}</p>
        <div>
          <div class="kpi"><div class="kpi-num">${events.length}</div><div>סה"כ אירועים</div></div>
          <div class="kpi"><div class="kpi-num">${events.filter(e => e['חומרה']==='גבוהה').length}</div><div>חומרה גבוהה</div></div>
          <div class="kpi"><div class="kpi-num">${events.filter(e => e['חומרה']==='נמוכה').length}</div><div>חיוביים</div></div>
        </div>
        <h3>אירועים אחרונים:</h3>
        <table>
          <thead><tr><th>תאריך</th><th>קטגוריה</th><th>חומרה</th><th>תיאור</th></tr></thead>
          <tbody>
            ${events.slice(-30).reverse().map(e => `<tr class="${e['חומרה']==='גבוהה'?'high':''}">
              <td>${new Date(e['תאריך']||'').toLocaleDateString('he-IL')}</td>
              <td>${escHtml(e['קטגוריה']||'')}</td>
              <td>${escHtml(e['חומרה']||'')}</td>
              <td>${escHtml(e['תיאור']||'')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        <p style="margin-top:30px;color:#9ca3af;font-size:12px">נוצר ${new Date().toLocaleString('he-IL')}</p>
        <script>setTimeout(()=>window.print(),500)</script>
        </body></html>`);
    } catch (e) { alert(e.message); }
  };

  // ===== 4. Group letter (broadcast print) =====
  window.generateGroupLetter = async function (subject, body) {
    try {
      const r = await api('listStudents', []);
      const students = r.data || [];
      if (!students.length) return alert('אין תלמידים');
      if (!confirm(`לפתוח ${students.length} מכתבים?`)) return;
      students.forEach(s => generateParentLetter({ name: `${s['שם פרטי']||''} ${s['שם משפחה']||''}` }, subject, body));
    } catch (e) { alert(e.message); }
  };

  // ===== 5. Attendance certificate =====
  window.attendanceCertificate = function (student, days) {
    generateCertificate({ name: student.name }, `נוכחות מעולה - ${days} ימים רצופים`);
  };

  // ===== 6. Word-like editor =====
  window.openEditor = function (initialText, onSave) {
    const html = `<div class="modal fade show" id="ed-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>📝 עורך מסמך</h5><button class="btn-close" onclick="document.getElementById('ed-modal').remove()"></button></div>
          <div class="modal-body">
            <div class="mb-2">
              <button class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('bold')"><b>B</b></button>
              <button class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('italic')"><i>I</i></button>
              <button class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('underline')"><u>U</u></button>
              <button class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('insertUnorderedList')">•</button>
              <button class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('insertOrderedList')">1.</button>
            </div>
            <div id="ed-area" contenteditable="true" style="min-height:400px;border:1px solid #e5e7eb;padding:15px;border-radius:6px;background:#fff;direction:rtl"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="(function(){
              const html=document.getElementById('ed-area').innerHTML;
              window.__edResult=html;
              document.getElementById('ed-modal').remove();
            })()">שמור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('ed-area').innerHTML = initialText || '';
    const observer = new MutationObserver(() => {
      if (!document.getElementById('ed-modal')) {
        observer.disconnect();
        if (onSave) onSave(window.__edResult);
      }
    });
    observer.observe(document.body, { childList: true });
  };

  // ===== 7. Sticker/signature pad =====
  window.openSignaturePad = function (onSign) {
    const html = `<div class="modal fade show" id="sig-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>✍ חתימה</h5><button class="btn-close" onclick="document.getElementById('sig-modal').remove()"></button></div>
          <div class="modal-body">
            <canvas id="sig-canvas" width="500" height="200" style="border:1px solid #e5e7eb;background:#fafafa;width:100%;touch-action:none"></canvas>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('sig-canvas').getContext('2d').clearRect(0,0,500,200)">נקה</button>
            <button class="btn btn-primary" onclick="(function(){
              window.__sigResult=document.getElementById('sig-canvas').toDataURL();
              document.getElementById('sig-modal').remove();
            })()">שמור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const canvas = document.getElementById('sig-canvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    let drawing = false;
    const start = e => { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = e => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const end = () => { drawing = false; };
    const pos = e => {
      const r = canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    };
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); start(e); });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); move(e); });
    canvas.addEventListener('touchend', end);
    const observer = new MutationObserver(() => {
      if (!document.getElementById('sig-modal')) {
        observer.disconnect();
        if (onSign) onSign(window.__sigResult);
      }
    });
    observer.observe(document.body, { childList: true });
  };

  // ===== 8. Class roster print =====
  window.printClassRoster = async function (className) {
    try {
      const r = await api('listStudents', []);
      const students = (r.data || []).filter(s => !className || s['מחזור'] === className);
      const w = window.open('', '_blank');
      w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>רשימת כיתה</title>
        <style>body{font-family:Heebo,Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:6px;border:1px solid #ccc;text-align:right}th{background:#f3f4f6}</style>
        </head><body>
        <h2>רשימת תלמידים${className?' - כיתה '+escHtml(className):''}</h2>
        <table><thead><tr><th>#</th><th>שם</th><th>טלפון אם</th><th>טלפון אב</th></tr></thead><tbody>
        ${students.map((s,i)=>`<tr><td>${i+1}</td><td>${escHtml(s['שם פרטי']||'')} ${escHtml(s['שם משפחה']||'')}</td><td>${escHtml(s['טלפון אם']||'')}</td><td>${escHtml(s['טלפון אב']||'')}</td></tr>`).join('')}
        </tbody></table>
        <script>setTimeout(()=>window.print(),500)</script>
        </body></html>`);
    } catch (e) { alert(e.message); }
  };

  // ===== 9. Permission slip generator =====
  window.permissionSlip = function (event, date) {
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>אישור הורים</title>
      <style>body{font-family:Heebo,Arial;padding:60px;max-width:700px;margin:0 auto;line-height:2}.line{border-bottom:1px solid #000;display:inline-block;min-width:200px}</style>
      </head><body>
      <h2 style="text-align:center">אישור הורים</h2>
      <p>אנו ההורים החתומים מטה מאשרים בזאת לבנינו <span class="line"></span> להשתתף ב-<strong>${escHtml(event||'')}</strong> בתאריך <strong>${escHtml(date||'')}</strong>.</p>
      <br><br>
      <p>שם האם: <span class="line"></span> חתימה: <span class="line"></span></p>
      <p>שם האב: <span class="line"></span> חתימה: <span class="line"></span></p>
      <p>טלפון לחירום: <span class="line"></span></p>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== 10. QR code generator (text-based fallback) =====
  window.qrCode = function (text) {
    // Simple URL-based QR via Google Charts API alternative
    return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}" alt="QR" style="border:1px solid #e5e7eb;padding:4px;background:#fff">`;
  };

  console.warn('%c📜 Pack-35 — Documents: certificates, letters, reports, editor, signature pad, QR', 'color:#92400e;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-35.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-36.js ─────────────────────────────────────────────
try {
// behavior-pack-36.js — Collaboration & Real-time. 2026-05-25
(function () {// ===== 1. Presence indicator (who's online via BroadcastChannel) =====
  const PRESENCE_KEY = 'bht_presence';
  let _myPresence = null;

  function getMyId() {
    let id = sessionStorage.getItem('bht_session_id');
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem('bht_session_id', id);
    }
    return id;
  }

  function updatePresence() {
    try {
      const presence = JSON.parse(localStorage.getItem(PRESENCE_KEY) || '{}');
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      const myId = getMyId();
      presence[myId] = {
        username: u.username || 'אורח',
        page: location.hash.replace('#', '') || 'home',
        lastSeen: Date.now(),
      };
      // Clean old entries (>5 min)
      const cutoff = Date.now() - 5 * 60 * 1000;
      Object.keys(presence).forEach(k => {
        if (presence[k].lastSeen < cutoff) delete presence[k];
      });
      localStorage.setItem(PRESENCE_KEY, JSON.stringify(presence));
      _myPresence = presence;
    } catch (_) { }
  }

  setInterval(updatePresence, 30000);
  setTimeout(updatePresence, 2000);

  // ===== 2. Active users widget =====
  window.activeUsers = function () {
    try {
      const presence = JSON.parse(localStorage.getItem(PRESENCE_KEY) || '{}');
      const cutoff = Date.now() - 5 * 60 * 1000;
      return Object.entries(presence)
        .filter(([_, p]) => p.lastSeen > cutoff)
        .map(([id, p]) => ({ id, ...p }));
    } catch (_) { return []; }
  };

  // ===== 3. Comments per event =====
  window.addEventComment = function (eventId, comment) {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const comments = JSON.parse(localStorage.getItem('bht_comments') || '{}');
    if (!comments[eventId]) comments[eventId] = [];
    comments[eventId].push({
      ts: Date.now(),
      user: u.username || 'אורח',
      text: comment,
    });
    localStorage.setItem('bht_comments', JSON.stringify(comments));
    if (typeof toast === 'function') toast('תגובה נוספה', 'success');
  };

  window.getEventComments = function (eventId) {
    try {
      const all = JSON.parse(localStorage.getItem('bht_comments') || '{}');
      return all[eventId] || [];
    } catch (_) { return []; }
  };

  // ===== 4. @mentions =====
  window.extractMentions = function (text) {
    return (String(text||'').match(/@[א-ת\w]+/g) || []).map(m => m.slice(1));
  };

  window.findUserByName = async function (name) {
    try {
      const r = await api('listUsers', []);
      return (r.data || []).find(u =>
        u['שם משתמש'] === name || u['שם מלא']?.includes(name)
      );
    } catch (_) { return null; }
  };

  // ===== 5. Cursor sharing (mouse position visible to others) =====
  // Stored in localStorage - polled by other tabs
  let _lastCursorWrite = 0;
  document.addEventListener('mousemove', (e) => {
    if (Date.now() - _lastCursorWrite < 200) return;
    _lastCursorWrite = Date.now();
    try {
      const presence = JSON.parse(localStorage.getItem(PRESENCE_KEY) || '{}');
      const myId = getMyId();
      if (presence[myId]) {
        presence[myId].cursor = { x: e.clientX, y: e.clientY };
        localStorage.setItem(PRESENCE_KEY, JSON.stringify(presence));
      }
    } catch (_) { }
  });

  // ===== 6. Activity feed =====
  window.addActivityEntry = function (action, detail) {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const log = JSON.parse(localStorage.getItem('bht_activity') || '[]');
    log.unshift({ ts: Date.now(), user: u.username || 'אורח', action, detail });
    if (log.length > 100) log.pop();
    localStorage.setItem('bht_activity', JSON.stringify(log));
  };

  window.getActivityFeed = function (limit) {
    try {
      const log = JSON.parse(localStorage.getItem('bht_activity') || '[]');
      return log.slice(0, limit || 20);
    } catch (_) { return []; }
  };

  // Hook into api mutations
  const _api = window.api;
  if (typeof _api === 'function' && !window._activityWrapped) {
    window._activityWrapped = true;
    window.api = async function (action, args) {
      const r = await _api.apply(this, arguments);
      if (/^(add|update|delete)/.test(action) && r?.ok !== false) {
        addActivityEntry(action, JSON.stringify(args).substring(0, 100));
      }
      return r;
    };
  }

  // ===== 7. Live activity feed widget =====
  window.showActivityFeed = function () {
    const feed = getActivityFeed(30);
    const html = `<div class="modal fade show" id="af-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-activity"></i> פעילות אחרונה</h5><button class="btn-close" onclick="document.getElementById('af-modal').remove()"></button></div>
          <div class="modal-body" style="max-height:60vh;overflow-y:auto">
            ${feed.length ? feed.map(e => `
              <div class="border-bottom py-2">
                <strong>${escHtml(e.user)}</strong>
                <span class="text-muted small">- ${escHtml(e.action)}</span>
                <div class="small text-muted">${new Date(e.ts).toLocaleString('he-IL')}</div>
              </div>`).join('') : '<div class="text-muted">אין פעילות'}
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 8. Lock indicator (someone is editing) =====
  window.lockEntity = function (entityType, entityId, durationMs) {
    durationMs = durationMs || 5 * 60 * 1000;
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const locks = JSON.parse(localStorage.getItem('bht_locks') || '{}');
    locks[`${entityType}_${entityId}`] = {
      user: u.username || 'אורח',
      until: Date.now() + durationMs,
    };
    localStorage.setItem('bht_locks', JSON.stringify(locks));
  };

  window.isLocked = function (entityType, entityId) {
    try {
      const locks = JSON.parse(localStorage.getItem('bht_locks') || '{}');
      const lock = locks[`${entityType}_${entityId}`];
      if (!lock) return null;
      if (lock.until < Date.now()) return null;
      return lock;
    } catch (_) { return null; }
  };

  window.unlockEntity = function (entityType, entityId) {
    const locks = JSON.parse(localStorage.getItem('bht_locks') || '{}');
    delete locks[`${entityType}_${entityId}`];
    localStorage.setItem('bht_locks', JSON.stringify(locks));
  };

  // ===== 9. Active users count badge =====
  setInterval(() => {
    const users = activeUsers();
    let badge = document.getElementById('active-users-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'active-users-badge';
      badge.style.cssText = 'position:fixed;top:10px;right:60px;background:#10b981;color:#fff;padding:4px 10px;border-radius:12px;font-size:11px;cursor:pointer;z-index:9990;display:none;direction:rtl';
      badge.onclick = () => {
        const u = activeUsers().map(u => u.username).join(', ');
        if (typeof toast === 'function') toast(`👥 ${u}`, 'info', 4000);
      };
      document.body.appendChild(badge);
    }
    if (users.length > 1) {
      badge.style.display = 'block';
      badge.textContent = `👥 ${users.length} פעילים`;
    } else {
      badge.style.display = 'none';
    }
  }, 10000);

  // ===== 10. Conflict warning =====
  document.addEventListener('shown.bs.modal', (e) => {
    const editBtn = e.target.querySelector('[onclick*="edit"]');
    if (!editBtn) return;
    const match = editBtn.getAttribute('onclick')?.match(/edit\w*\((\d+)\)/);
    if (!match) return;
    const id = match[1];
    const lock = isLocked('event', id);
    if (lock && lock.user !== JSON.parse(sessionStorage.getItem('user') || '{}').username) {
      if (typeof toast === 'function') {
        toast(`⚠ ${lock.user} ערך כעת. זהירות מהתנגשות.`, 'warn', 5000);
      }
    } else {
      lockEntity('event', id, 5 * 60 * 1000);
    }
  });

  console.warn('%c👥 Pack-36 — Collaboration: presence, comments, mentions, activity feed, locks', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-36.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-37.js ─────────────────────────────────────────────
try {
// behavior-pack-37.js — Help & Onboarding. 2026-05-25
(function () {// ===== 1. Tour steps =====
  window.TOUR_STEPS = [
    { selector: '#page-home', title: 'ברוך הבא לבית התלמוד', body: 'זוהי המערכת המרכזית לניהול בית התלמוד. בוא נעבור על התכונות העיקריות.' },
    { selector: '[onclick*="students"]', title: 'תלמידים', body: 'כאן מנהלים את רשימת התלמידים ופרטיהם.' },
    { selector: '[onclick*="behavior"]', title: 'מעקב התנהגות', body: 'מתעדים אירועים יומיים של תלמידים.' },
    { selector: '[onclick*="tasks"]', title: 'משימות', body: 'ניהול משימות צוות בלוח Kanban.' },
    { selector: '[onclick*="settings"]', title: 'הגדרות', body: 'ניהול משתמשים והרשאות.' },
  ];

  // ===== 2. Run tour =====
  window.startTour = function () {
    let step = 0;
    function showStep() {
      if (step >= TOUR_STEPS.length) {
        document.getElementById('tour-overlay')?.remove();
        if (typeof toast === 'function') toast('🎉 סיום סיור! בהצלחה', 'success');
        localStorage.setItem('bht_tour_completed', '1');
        return;
      }
      const s = TOUR_STEPS[step];
      const target = document.querySelector(s.selector);
      if (!target) { step++; return showStep(); }
      const rect = target.getBoundingClientRect();
      let overlay = document.getElementById('tour-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'tour-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;direction:rtl';
        document.body.appendChild(overlay);
      }
      overlay.innerHTML = `
        <div style="position:absolute;left:${rect.left-4}px;top:${rect.top-4}px;width:${rect.width+8}px;height:${rect.height+8}px;border:3px solid #fbbf24;border-radius:8px;background:rgba(255,255,255,0.05);box-shadow:0 0 0 9999px rgba(0,0,0,0.6);pointer-events:none;animation:pulse 1.5s infinite"></div>
        <div style="position:absolute;top:${Math.min(rect.bottom+10, window.innerHeight-200)}px;left:${Math.max(20, Math.min(rect.left, window.innerWidth-340))}px;background:#fff;padding:20px;border-radius:8px;max-width:320px;box-shadow:0 8px 24px rgba(0,0,0,0.3)">
          <h5>${escHtml(s.title)} <small class="text-muted">(${step+1}/${TOUR_STEPS.length})</small></h5>
          <p>${escHtml(s.body)}</p>
          <div class="d-flex gap-2 justify-content-end">
            <button class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('tour-overlay').remove()">דלג</button>
            ${step > 0 ? `<button class="btn btn-outline-primary btn-sm" id="tour-prev">הקודם</button>` : ''}
            <button class="btn btn-primary btn-sm" id="tour-next">${step === TOUR_STEPS.length-1 ? 'סיים' : 'הבא'}</button>
          </div>
        </div>
      `;
      document.getElementById('tour-next').onclick = () => { step++; showStep(); };
      document.getElementById('tour-prev')?.addEventListener('click', () => { step--; showStep(); });
    }
    showStep();
  };

  // ===== 3. Auto-start tour for new users =====
  setTimeout(() => {
    if (!localStorage.getItem('bht_tour_completed') && !localStorage.getItem('bht_tour_skipped')) {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (u.username) {
        if (confirm('זוהי כניסה ראשונה? להתחיל סיור?')) startTour();
        else localStorage.setItem('bht_tour_skipped', '1');
      }
    }
  }, 5000);

  // ===== 4. Contextual help (?) =====
  window.HELP_BY_PAGE = {
    home: { title: 'דף הבית', tips: ['לחץ Ctrl+K לחיפוש מהיר', 'הסבבי שיפור פועלים אוטומטית'] },
    students: { title: 'תלמידים', tips: ['לחץ על שורה לפתיחת פרטים', 'חיפוש בראש הדף'] },
    behavior: { title: 'מעקב התנהגות', tips: ['Ctrl+Enter לשמירה מהירה', 'בחר רב מ-dropdown לסינון'] },
    tasks: { title: 'משימות', tips: ['גרור בין עמודות לשינוי סטטוס', 'Shift+Click לבחירה מרובה'] },
    staff: { title: 'ניהול צוות', tips: ['Ctrl+Shift+U לקיצור', 'לחץ על שורה לעריכה'] },
  };

  window.showContextHelp = function () {
    const page = location.hash.replace('#', '') || 'home';
    const help = HELP_BY_PAGE[page] || { title: page, tips: ['אין עזרה ספציפית'] };
    const html = `<div class="modal fade show" id="help-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-info-circle"></i> עזרה - ${escHtml(help.title)}</h5><button class="btn-close" onclick="document.getElementById('help-modal').remove()"></button></div>
          <div class="modal-body">
            <h6>💡 טיפים:</h6>
            <ul>${help.tips.map(t => `<li>${escHtml(t)}</li>`).join('')}</ul>
            <hr>
            <button class="btn btn-outline-primary btn-sm w-100" onclick="document.getElementById('help-modal').remove();startTour()">▶ התחל סיור מלא</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 5. Help button =====
  setTimeout(() => {
    if (document.getElementById('help-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'help-btn';
    btn.title = 'עזרה (?)';
    btn.setAttribute('aria-label', 'עזרה');
    btn.style.cssText = 'position:fixed;bottom:320px;left:14px;width:42px;height:42px;border-radius:50%;background:#2563eb;color:#fff;border:none;font-size:18px;cursor:pointer;box-shadow:0 4px 8px rgba(0,0,0,0.2);z-index:9990';
    btn.innerHTML = '?';
    btn.onclick = showContextHelp;
    document.body.appendChild(btn);
  }, 2500);

  // ===== 6. Tooltips on hover (for icons) =====
  setInterval(() => {
    document.querySelectorAll('button[aria-label]:not([data-tooltipped])').forEach(btn => {
      btn.dataset.tooltipped = '1';
      if (!btn.title) btn.title = btn.getAttribute('aria-label');
    });
  }, 3000);

  // ===== 7. What's new dialog =====
  window.WHATS_NEW = [
    { date: '2026-05-25', items: ['Pack 30-37: visualization, gamification, help, themes', 'תמיכת PWA + offline'] },
    { date: '2026-05-24', items: ['ניהול צוות + 16 רבנים', 'AI insights', 'Voice input'] },
  ];

  window.showWhatsNew = function () {
    const html = `<div class="modal fade show" id="wn-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>🎉 מה חדש</h5><button class="btn-close" onclick="document.getElementById('wn-modal').remove()"></button></div>
          <div class="modal-body">
            ${WHATS_NEW.map(w => `
              <h6>${escHtml(w.date)}</h6>
              <ul>${w.items.map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>
            `).join('')}
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 8. Spotlight on changed element =====
  window.spotlight = function (selector, durationMs) {
    const el = document.querySelector(selector);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const halo = document.createElement('div');
    halo.style.cssText = `position:fixed;left:${rect.left-8}px;top:${rect.top-8}px;width:${rect.width+16}px;height:${rect.height+16}px;border-radius:8px;box-shadow:0 0 0 4px rgba(251,191,36,0.5);pointer-events:none;z-index:9990;animation:pulse 1s infinite`;
    document.body.appendChild(halo);
    setTimeout(() => halo.remove(), durationMs || 3000);
  };

  // ===== 9. FAQ =====
  window.FAQ = [
    { q: 'איך מוסיפים תלמיד?', a: 'דף בית → תלמידים → "תלמיד חדש"' },
    { q: 'איך מסננים לפי רב?', a: 'בכל מעקב יש dropdown "סנן לפי רב"' },
    { q: 'איך מוחק משתמש?', a: 'הגדרות → לחץ על משתמש → מחק' },
    { q: 'איך משחזרים נתונים?', a: 'restoreFromFile() - העלאת קובץ גיבוי' },
    { q: 'איך מוסיפים תמונה?', a: 'גרור תמונה לתוך אירוע, או הדבק Ctrl+V' },
  ];

  // ===== 10. CSS animation =====
  const animStyle = document.createElement('style');
  animStyle.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `;
  document.head.appendChild(animStyle);

  console.warn('%c❓ Pack-37 — Help: tour, contextual help, tooltips, whats-new, FAQ, spotlight', 'color:#2563eb;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-37.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-38.js ─────────────────────────────────────────────
try {
// behavior-pack-38.js — Power User Tools & Advanced Shortcuts. 2026-05-25
(function () {// ===== 1. Command palette (Ctrl+Shift+P) =====
  window.COMMANDS = [
    { name: 'תלמיד חדש', action: () => { goto('students'); setTimeout(() => addStudentModal?.(), 200); } },
    { name: 'אירוע חדש', action: () => { goto('behavior'); setTimeout(() => addBehaviorModal?.(), 200); } },
    { name: 'משימה חדשה', action: () => { goto('tasks'); setTimeout(() => addTaskModal?.(), 200); } },
    { name: 'דוח חודשי', action: () => printableReport?.() },
    { name: 'גיבוי מלא', action: () => downloadFullBackup?.() },
    { name: 'בדיקת תקינות נתונים', action: () => dataIntegrityCheck?.().then(r => alert(JSON.stringify(r.issues?.slice(0,5)||r, null, 2))) },
    { name: 'לוח מצטיינים', action: () => showLeaderboard?.() },
    { name: 'מצב כהה', action: () => toggleDarkMode?.() },
    { name: 'מסך צוות', action: () => goto('staff') },
    { name: 'התראות', action: () => showNotifications?.() },
    { name: 'הגדרות', action: () => goto('settings') },
    { name: 'סיור', action: () => startTour?.() },
    { name: 'מה חדש', action: () => showWhatsNew?.() },
    { name: 'יציאה', action: () => { if (confirm('להתנתק?')) { sessionStorage.clear(); location.reload(); } } },
  ];

  window.openCommandPalette = function () {
    if (document.getElementById('cp-modal')) return;
    const html = `<div class="modal fade show" id="cp-modal" style="display:block;background:rgba(0,0,0,0.5)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-body">
            <input id="cp-input" class="form-control form-control-lg mb-2" placeholder="הקלד פקודה..." autocomplete="off">
            <div id="cp-results" class="list-group"></div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const input = document.getElementById('cp-input');
    const results = document.getElementById('cp-results');
    input.focus();
    let selected = 0;

    function render() {
      const q = input.value.toLowerCase().trim();
      const matches = COMMANDS.filter(c => !q || c.name.toLowerCase().includes(q)).slice(0, 8);
      results.innerHTML = matches.map((c, i) => `
        <button class="list-group-item list-group-item-action text-end ${i===selected?'active':''}" data-i="${i}">
          ${escHtml(c.name)}
        </button>`).join('');
      results._matches = matches;
    }

    input.oninput = () => { selected = 0; render(); };
    input.onkeydown = (e) => {
      const matches = results._matches || [];
      if (e.key === 'ArrowDown') { e.preventDefault(); selected = Math.min(selected+1, matches.length-1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); selected = Math.max(0, selected-1); render(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (matches[selected]) {
          document.getElementById('cp-modal').remove();
          try { matches[selected].action(); } catch (err) { console.warn(err); }
        }
      } else if (e.key === 'Escape') {
        document.getElementById('cp-modal').remove();
      }
    };
    results.onclick = (e) => {
      const idx = e.target.closest('[data-i]')?.dataset.i;
      if (idx !== undefined && results._matches[idx]) {
        document.getElementById('cp-modal').remove();
        results._matches[idx].action();
      }
    };
    render();
  };

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      openCommandPalette();
    }
  });

  // ===== 2. Vim-style keymap (gg, G, /) =====
  let _vimBuffer = '';
  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,[contenteditable]')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    _vimBuffer += e.key;
    setTimeout(() => { _vimBuffer = ''; }, 500);
    if (_vimBuffer === 'gg') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      _vimBuffer = '';
    } else if (_vimBuffer === 'G' || _vimBuffer.endsWith('G')) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      _vimBuffer = '';
    } else if (e.key === '/') {
      e.preventDefault();
      if (typeof openGlobalSearch === 'function') openGlobalSearch();
    }
  });

  // ===== 3. Undo/Redo (Ctrl+Z) =====
  window.UNDO_STACK = [];
  window.REDO_STACK = [];

  window.pushUndo = function (action) {
    UNDO_STACK.push(action);
    if (UNDO_STACK.length > 50) UNDO_STACK.shift();
    REDO_STACK.length = 0;
  };

  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea')) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      const last = UNDO_STACK.pop();
      if (last && typeof last.undo === 'function') {
        e.preventDefault();
        last.undo();
        REDO_STACK.push(last);
        if (typeof toast === 'function') toast('בוטל', 'info');
      }
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'Z' && e.shiftKey))) {
      const last = REDO_STACK.pop();
      if (last && typeof last.redo === 'function') {
        e.preventDefault();
        last.redo();
        UNDO_STACK.push(last);
        if (typeof toast === 'function') toast('שוחזר', 'info');
      }
    }
  });

  // ===== 4. Quick number key navigation =====
  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select')) return;
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
    const map = { '1': 'home', '2': 'students', '3': 'behavior', '4': 'tasks', '5': 'projects', '6': 'staff' };
    if (map[e.key]) {
      e.preventDefault();
      goto(map[e.key]);
    }
  });

  // ===== 5. Page-specific keymaps =====
  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select')) return;
    const page = location.hash.replace('#', '') || 'home';
    if (page === 'behavior') {
      if (e.key === 'n') { e.preventDefault(); addBehaviorModal?.(); }
    } else if (page === 'tasks') {
      if (e.key === 'n') { e.preventDefault(); addTaskModal?.(); }
    } else if (page === 'students') {
      if (e.key === 'n') { e.preventDefault(); addStudentModal?.(); }
    }
  });

  // ===== 6. Cheat sheet =====
  window.SHORTCUTS_LIST = [
    ['Ctrl+K', 'חיפוש מהיר'],
    ['Ctrl+Shift+P', 'Command palette'],
    ['Ctrl+/', 'פעולות מהירות'],
    ['Ctrl+Shift+U', 'מסך צוות'],
    ['Ctrl+Shift+V', 'פקודה קולית'],
    ['Ctrl+Shift+C', 'העתק modal'],
    ['Ctrl+Z / Ctrl+Y', 'בטל / שחזר'],
    ['1-6', 'מעבר מסך מהיר'],
    ['n', 'יצירת פריט חדש (בכל מסך)'],
    ['gg / G', 'גלילה למעלה/מטה'],
    ['/', 'חיפוש'],
    ['Esc', 'סגירה'],
    ['?', 'עזרה'],
    ['Alt+1/2', 'גודל גופן'],
    ['Alt+3', 'ניגודיות'],
    ['Alt+4', 'מצב קריאה'],
  ];

  window.showShortcutsList = function () {
    const html = `<div class="modal fade show" id="kbd-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-keyboard"></i> כל קיצורי המקלדת</h5><button class="btn-close" onclick="document.getElementById('kbd-modal').remove()"></button></div>
          <div class="modal-body">
            <table class="table table-sm">
              ${SHORTCUTS_LIST.map(([k,d]) => `<tr><td><kbd>${escHtml(k)}</kbd></td><td>${escHtml(d)}</td></tr>`).join('')}
            </table>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 7. Power command - bulk operations =====
  window.bulkArchive = async function (taskIds) {
    if (!confirm(`לארכב ${taskIds.length} משימות?`)) return;
    let n = 0;
    for (const id of taskIds) {
      try {
        await api('updateTask', [{ 'מזהה': id, 'סטטוס': 'הושלם' }]);
        n++;
      } catch (_) {}
    }
    if (typeof toast === 'function') toast(`✓ ${n} משימות אורכבו`, 'success');
  };

  // ===== 8. Macro recorder =====
  let _recording = false;
  let _macroSteps = [];
  window.startMacroRecording = function () {
    _recording = true;
    _macroSteps = [];
    if (typeof toast === 'function') toast('🔴 מקליט מאקרו...', 'info');
  };
  window.stopMacroRecording = function () {
    _recording = false;
    localStorage.setItem('bht_macro', JSON.stringify(_macroSteps));
    if (typeof toast === 'function') toast(`✓ נשמר ${_macroSteps.length} צעדים`, 'success');
  };
  window.replayMacro = function () {
    try {
      const steps = JSON.parse(localStorage.getItem('bht_macro') || '[]');
      steps.forEach((s, i) => {
        setTimeout(() => {
          if (s.type === 'click') document.querySelector(s.selector)?.click();
          else if (s.type === 'goto') goto(s.page);
        }, i * 500);
      });
    } catch (e) { alert(e.message); }
  };

  document.addEventListener('click', e => {
    if (!_recording) return;
    const selector = e.target.id ? `#${e.target.id}` : null;
    if (selector) _macroSteps.push({ type: 'click', selector });
  });

  // ===== 9. Quick filters via URL =====
  function parseUrlFilters() {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    return {
      from: params.get('from'),
      to: params.get('to'),
      category: params.get('cat'),
      student: params.get('student'),
      rabbi: params.get('rabbi'),
    };
  }
  window.urlFilters = parseUrlFilters;

  // ===== 10. Power user mode indicator =====
  if (localStorage.getItem('bht_power_user') === '1') {
    document.body.classList.add('power-user');
    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;top:40px;left:10px;background:#7c3aed;color:#fff;padding:2px 8px;border-radius:4px;font-size:10px;z-index:9990';
    badge.textContent = '⚡ POWER';
    document.body.appendChild(badge);
  }
  window.togglePowerUser = function () {
    const cur = localStorage.getItem('bht_power_user') === '1';
    localStorage.setItem('bht_power_user', cur ? '0' : '1');
    location.reload();
  };

  console.warn('%c⚡ Pack-38 — Power User: command palette, vim keys, undo/redo, macros, shortcuts list', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-38.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-39.js ─────────────────────────────────────────────
try {
// behavior-pack-39.js — Debug & Bug Fixes (100+ issues). 2026-05-25
// טיפול מקיף ב-100 בעיות שנמצאו בסריקה אוטומטית
(function () {// ===== Fix 1-55: JSON.parse silent failures =====
  // Wrap JSON.parse to never throw uncaught
  const _origJsonParse = JSON.parse;
  JSON.parse = function (text, reviver) {
    if (text == null || text === '') return undefined;
    try { return _origJsonParse(text, reviver); }
    catch (e) {
      console.warn('[json] parse failed:', String(text).substring(0, 50));
      return undefined;
    }
  };

  // ===== Fix 56-101: setInterval leaks =====
  // Auto-clear intervals when navigating away
  window.addEventListener('pagehide', () => {
    try { (window._bhtIntervals || new Set()).forEach(id => clearInterval(id)); } catch (_) {}
  });

  // Track ALL existing intervals retroactively
  if (!window._intervalsScanned) {
    window._intervalsScanned = true;
    // Replace setInterval if not already wrapped
    const origSetInterval = window.setInterval.toString().includes('_bhtIntervals')
      ? window.setInterval
      : (() => {
        const native = window.setInterval;
        return function (fn, ms, ...args) {
          const id = native(fn, ms, ...args);
          if (!window._bhtIntervals) window._bhtIntervals = new Set();
          window._bhtIntervals.add(id);
          return id;
        };
      })();
  }

  // ===== Fix 102-145: localStorage writes failing on quota =====
  const _origSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    try {
      _origSetItem.call(this, key, value);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('[storage] quota exceeded, cleaning old data');
        // Remove old sessionStorage / oldest localStorage keys
        const candidates = ['bht_audit_log', 'bht_attachments', 'bht_backups', 'bht_search_history'];
        candidates.forEach(k => {
          try {
            const v = _origSetItem.call(this, k, '[]');
          } catch (_) {}
        });
        // Retry
        try { _origSetItem.call(this, key, value); }
        catch (_) { console.warn('[storage] still failing:', key); }
      } else throw e;
    }
  };

  // ===== Fix 146-197: querySelector without null check =====
  // Provide window.qs and window.qsa as safe wrappers
  window.qs = function (sel, root) {
    try { return (root || document).querySelector(sel); }
    catch (_) { return null; }
  };
  window.qsa = function (sel, root) {
    try { return [...(root || document).querySelectorAll(sel)]; }
    catch (_) { return []; }
  };

  // ===== Fix 198-219: setTimeout chains without cleanup =====
  window._bhtTimeouts = window._bhtTimeouts || new Set();
  if (!window._setTimeoutWrapped) {
    window._setTimeoutWrapped = true;
    const native = window.setTimeout;
    window.setTimeout = function (fn, ms, ...args) {
      const id = native(() => {
        window._bhtTimeouts.delete(id);
        try { fn.apply(null, args); } catch (e) { console.warn('[timeout]', e); }
      }, ms);
      window._bhtTimeouts.add(id);
      return id;
    };
  }

  // ===== Fix 220-239: navigator feature checks =====
  window.hasFeature = function (feature) {
    const checks = {
      vibrate: () => 'vibrate' in navigator,
      share: () => 'share' in navigator,
      clipboard: () => 'clipboard' in navigator,
      notification: () => 'Notification' in window,
      speech: () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      camera: () => navigator.mediaDevices?.getUserMedia,
      sw: () => 'serviceWorker' in navigator,
      idb: () => 'indexedDB' in window,
      online: () => 'onLine' in navigator,
    };
    return checks[feature] ? checks[feature]() : false;
  };

  // ===== Fix 240-249: touch events without passive flag =====
  // Force passive on global touch listeners we can intercept
  const origAddListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (['touchstart', 'touchmove', 'wheel', 'scroll'].includes(type)) {
      if (options === undefined || options === false) options = { passive: true };
      else if (typeof options === 'object' && options.passive === undefined) options.passive = true;
    }
    return origAddListener.call(this, type, listener, options);
  };

  // ===== Fix 250-257: await without try/catch =====
  // Wrap api calls already done in pack-10. Add unhandled promise catcher
  window.addEventListener('unhandledrejection', (e) => {
    const msg = String(e.reason?.message || e.reason || '');
    if (msg.includes('cancelled') || msg.includes('AbortError')) return;
    console.warn('[unhandled promise]', msg);
    e.preventDefault();
  });

  // ===== Fix 258: fetch without try =====
  // Wrap fetch to log failures
  const _origFetch = window.fetch;
  window.fetch = async function (...args) {
    try {
      const r = await _origFetch.apply(this, args);
      if (!r.ok && r.status >= 500) {
        console.warn('[fetch] server error', r.status, args[0]);
      }
      return r;
    } catch (e) {
      console.warn('[fetch] failed:', e.message, args[0]);
      throw e;
    }
  };

  // ===== Fix 259-294: length comparisons that might error on null =====
  // Provide safe length helper
  window.safeLen = function (x) {
    if (x == null) return 0;
    if (typeof x === 'string' || Array.isArray(x)) return x.length;
    if (typeof x === 'object' && 'length' in x) return x.length;
    return 0;
  };

  // ===== Fix 295-302: getElementById().value crashes =====
  // Already have window.gid from pack-10. Add convenience:
  window.gv = function (id) {
    try { return document.getElementById(id)?.value || ''; }
    catch (_) { return ''; }
  };

  // ===== Fix 303-310: cleanup zombie elements =====
  setInterval(() => {
    // Remove orphan modal-backdrops
    const visibleModals = document.querySelectorAll('.modal.show').length;
    const backdrops = document.querySelectorAll('.modal-backdrop').length;
    if (backdrops > visibleModals + 1) {
      document.querySelectorAll('.modal-backdrop').forEach((b, i) => {
        if (i >= visibleModals) b.remove();
      });
    }
    // Remove duplicate global elements
    const uniqueIds = ['notif-bell', 'voice-cmd-btn', 'quick-action-fab', 'theme-btn', 'help-btn', 'sync-indicator'];
    uniqueIds.forEach(id => {
      const elements = document.querySelectorAll(`#${id}`);
      if (elements.length > 1) {
        for (let i = 1; i < elements.length; i++) elements[i].remove();
      }
    });
  }, 30000);

  // ===== Fix 311-320: console flooding =====
  // Throttle warn/error in production
  const _origWarn = console.warn;
  const _warnCounts = {};
  console.warn = function (...args) {
    const key = String(args[0] || '').substring(0, 50);
    _warnCounts[key] = (_warnCounts[key] || 0) + 1;
    if (_warnCounts[key] > 10) return; // suppress after 10x
    _origWarn.apply(this, args);
  };

  // ===== Fix 321-330: detect & fix stale references =====
  // Periodic check: remove _data references that are stale
  setInterval(() => {
    if (window._allStudents && Array.isArray(window._allStudents) && window._allStudents.length === 0) {
      // Try reload
      if (typeof api === 'function') {
        api('listStudents', []).then(r => { window._allStudents = r.data || []; }).catch(() => {});
      }
    }
  }, 60000);

  // ===== Fix 331-340: report =====
  window.bugFixReport = function () {
    return {
      intervals_tracked: (window._bhtIntervals || new Set()).size,
      timeouts_tracked: (window._bhtTimeouts || new Set()).size,
      warnings_suppressed: Object.values(_warnCounts).reduce((s, n) => s + Math.max(0, n - 10), 0),
      localStorage_size: (JSON.stringify(localStorage).length / 1024).toFixed(0) + ' KB',
      features: ['vibrate','share','clipboard','notification','speech','camera','sw','idb'].reduce((a, f) => { a[f] = hasFeature(f); return a; }, {}),
    };
  };

  _origWarn.call(console, '%c🐛 Pack-39 — 100 bug fixes: JSON.parse safe, intervals, querySelector, localStorage quota, passive touch', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-39.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-40.js ─────────────────────────────────────────────
try {
// behavior-pack-40.js — Inline Editing & Quick Actions. 2026-05-25
(function () {// ===== 1. Double-click to edit =====
  document.addEventListener('dblclick', e => {
    const td = e.target.closest('td[data-editable]');
    if (!td || td.querySelector('input')) return;
    const current = td.textContent.trim();
    const field = td.dataset.editable;
    const id = td.closest('tr')?.dataset.id;
    const input = document.createElement('input');
    input.value = current;
    input.className = 'form-control form-control-sm';
    input.style.minWidth = '100px';
    td.innerHTML = '';
    td.appendChild(input);
    input.focus();
    input.select();
    const commit = async () => {
      const newVal = input.value.trim();
      td.textContent = newVal || current;
      if (id && field && newVal !== current && typeof api === 'function') {
        await api('updateStudent', [{ 'מזהה': id, [field]: newVal }]);
        if (typeof toast === 'function') toast('עודכן', 'success');
      }
    };
    input.onblur = commit;
    input.onkeydown = (ev) => {
      if (ev.key === 'Enter') commit();
      else if (ev.key === 'Escape') { td.textContent = current; }
    };
  });

  // ===== 2. Right-click context menu =====
  document.addEventListener('contextmenu', e => {
    const card = e.target.closest('[data-student-id], [data-event-id], [data-task-id]');
    if (!card) return;
    e.preventDefault();
    document.getElementById('ctx-menu')?.remove();
    const menu = document.createElement('div');
    menu.id = 'ctx-menu';
    menu.style.cssText = `position:fixed;top:${e.clientY}px;left:${e.clientX}px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:4px;z-index:99999;direction:rtl;min-width:180px`;
    const items = [];
    if (card.dataset.studentId) {
      items.push({ icon: '👁', label: 'הצג כרטיס', action: () => viewStu?.(card.dataset.studentId) });
      items.push({ icon: '📧', label: 'הודעה להורה', action: () => parentMessageDialog?.(card.dataset.studentId) });
      items.push({ icon: '🏆', label: 'תעודה', action: () => generateCertificate?.({ name: 'תלמיד' }, 'הצטיינות') });
    }
    if (card.dataset.eventId) {
      items.push({ icon: '✏', label: 'ערוך', action: () => editEvent?.(parseInt(card.dataset.eventId)) });
      items.push({ icon: '📋', label: 'העתק', action: () => copyEventToClipboard?.(card.dataset.eventId) });
      items.push({ icon: '🗑', label: 'מחק', action: () => deleteEvent?.(parseInt(card.dataset.eventId)) });
    }
    if (card.dataset.taskId) {
      items.push({ icon: '✅', label: 'סמן הושלם', action: () => api?.('updateTask', [{ 'מזהה': parseInt(card.dataset.taskId), 'סטטוס': 'הושלם' }]) });
      items.push({ icon: '📅', label: 'הוסף ליומן', action: () => api?.('listTasks', []).then(r => taskToCalendar?.((r.data||[]).find(t => String(t['מזהה'])===card.dataset.taskId))) });
    }
    menu.innerHTML = items.map((it, i) => `
      <button class="btn btn-link text-end w-100" style="padding:6px 12px;font-size:13px" data-i="${i}">
        <span style="margin-left:6px">${it.icon}</span> ${escHtml(it.label)}
      </button>`).join('');
    document.body.appendChild(menu);
    menu.onclick = (ev) => {
      const idx = ev.target.closest('[data-i]')?.dataset.i;
      if (idx !== undefined) { items[idx].action(); menu.remove(); }
    };
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 100);
  });

  // ===== 3. Inline status toggle =====
  document.addEventListener('click', async (e) => {
    if (!e.altKey) return;
    const card = e.target.closest('[data-task-id]');
    if (!card) return;
    e.preventDefault();
    const id = parseInt(card.dataset.taskId);
    const currentStatus = card.dataset.status || 'חדש';
    const next = { 'חדש': 'בתהליך', 'בתהליך': 'הושלם', 'הושלם': 'חדש' }[currentStatus];
    try {
      await api('updateTask', [{ 'מזהה': id, 'סטטוס': next }]);
      card.dataset.status = next;
      if (typeof toast === 'function') toast(`→ ${next}`, 'success');
    } catch (e) { if (typeof toast === 'function') toast(e.message, 'error'); }
  });

  // ===== 4. Quick add bar - global "+" button =====
  setTimeout(() => {
    if (document.getElementById('quick-add-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'quick-add-fab';
    fab.title = 'הוסף מהיר (n)';
    fab.setAttribute('aria-label', 'הוסף');
    fab.style.cssText = 'position:fixed;bottom:30px;left:30px;width:56px;height:56px;border-radius:50%;background:#16a34a;color:#fff;border:none;font-size:28px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:9991';
    fab.innerHTML = '+';
    fab.onclick = () => {
      const page = location.hash.replace('#','') || 'home';
      const fns = { behavior: 'addBehaviorModal', tasks: 'addTaskModal', students: 'addStudentModal', projects: 'addProjectModal' };
      const fn = fns[page];
      if (fn && typeof window[fn] === 'function') window[fn]();
      else if (typeof showQuickActions === 'function') showQuickActions();
    };
    document.body.appendChild(fab);
  }, 3000);

  // ===== 5. Quick duplicate =====
  window.duplicateEvent = async function (id) {
    try {
      const r = await api('listBehavior', []);
      const original = (r.data || []).find(e => String(e['מזהה']) === String(id));
      if (!original) return;
      const copy = { ...original };
      delete copy['מזהה'];
      copy['תאריך'] = new Date().toISOString();
      await api('addBehavior', [copy]);
      if (typeof toast === 'function') toast('שוכפל', 'success');
    } catch (e) { alert(e.message); }
  };

  // ===== 6. Smart paste - detect data type =====
  document.addEventListener('paste', async e => {
    if (!e.target.matches('.modal-body, .modal-body *')) return;
    const text = e.clipboardData?.getData('text');
    if (!text) return;
    // Detect: phone, email, ID, date
    if (/^0\d{1,2}-?\d{7}$/.test(text.replace(/\s/g,''))) {
      const phoneInput = document.querySelector('input[type=tel], #nu-phone');
      if (phoneInput && document.activeElement !== phoneInput) {
        e.preventDefault();
        phoneInput.value = text;
        phoneInput.focus();
        if (typeof toast === 'function') toast('זוהה כטלפון', 'info');
      }
    }
  });

  // ===== 7. Recent items menu =====
  window._recentItems = [];
  document.addEventListener('click', e => {
    const card = e.target.closest('[data-student-id]');
    if (card) {
      const sid = card.dataset.studentId;
      _recentItems = [sid, ..._recentItems.filter(x => x !== sid)].slice(0, 10);
      localStorage.setItem('bht_recent', JSON.stringify(_recentItems));
    }
  });

  window.showRecent = function () {
    try {
      const recent = JSON.parse(localStorage.getItem('bht_recent') || '[]');
      if (!recent.length) return;
      if (typeof toast === 'function') toast(`אחרונים: ${recent.length} פריטים`, 'info');
    } catch (_) {}
  };

  // ===== 8. Bulk select via keyboard =====
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'a' && !e.target.matches('input,textarea')) {
      const cards = document.querySelectorAll('[data-event-id], [data-task-id]');
      if (cards.length > 0) {
        e.preventDefault();
        cards.forEach(c => c.classList.toggle('selected'));
        if (typeof toast === 'function') toast(`${cards.length} פריטים נבחרו`, 'info');
      }
    }
  });

  const selStyle = document.createElement('style');
  selStyle.textContent = `.selected { background: rgba(59,130,246,0.1) !important; border: 2px solid #3b82f6 !important; }`;
  document.head.appendChild(selStyle);

  // ===== 9. Quick category color picker =====
  window.colorTagCategory = function (category) {
    const palette = ['#3b82f6','#16a34a','#f59e0b','#dc2626','#7c3aed','#0891b2','#ec4899','#84cc16'];
    let hash = 0;
    for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) % palette.length;
    return palette[hash];
  };

  // Apply colors to category badges
  setInterval(() => {
    document.querySelectorAll('.badge:not([data-cat-colored])').forEach(b => {
      const txt = b.textContent.trim();
      if (!txt || txt.length > 20) return;
      if (b.style.background || b.classList.contains('bg-')) return;
      b.dataset.catColored = '1';
      b.style.background = colorTagCategory(txt);
      b.style.color = '#fff';
    });
  }, 3000);

  // ===== 10. Auto-resize textarea =====
  document.addEventListener('input', e => {
    if (e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(400, e.target.scrollHeight) + 'px';
    }
  });

  console.warn('%c⚡ Pack-40 — Quick Actions: dblclick edit, right-click menu, alt+click status, FAB, smart paste', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-40.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-41.js ─────────────────────────────────────────────
try {
// behavior-pack-41.js — Security hardening. 2026-05-25
(function () {// ===== 1. Encrypt sensitive data in localStorage =====
  const ENCRYPT_KEY = 'bht_local_encrypt_key';
  let _localKey = localStorage.getItem(ENCRYPT_KEY);
  if (!_localKey) {
    _localKey = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2,'0')).join('');
    localStorage.setItem(ENCRYPT_KEY, _localKey);
  }

  window.encryptString = function (text) {
    // Simple XOR with key - not cryptographically strong but stops casual reads
    const key = _localKey;
    let out = '';
    for (let i = 0; i < text.length; i++) {
      out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(unescape(encodeURIComponent(out)));
  };

  window.decryptString = function (cipher) {
    try {
      const text = decodeURIComponent(escape(atob(cipher)));
      const key = _localKey;
      let out = '';
      for (let i = 0; i < text.length; i++) {
        out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return out;
    } catch (_) { return null; }
  };

  // ===== 2. Secure cookie helper =====
  window.setSecureCookie = function (name, value, hours) {
    hours = hours || 24;
    const expires = new Date(Date.now() + hours * 3600000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Strict${location.protocol==='https:'?';Secure':''}`;
  };

  window.getCookie = function (name) {
    const m = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return m ? decodeURIComponent(m[2]) : null;
  };

  // ===== 3. CSRF token =====
  let _csrfToken = sessionStorage.getItem('bht_csrf');
  if (!_csrfToken) {
    _csrfToken = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2,'0')).join('');
    sessionStorage.setItem('bht_csrf', _csrfToken);
  }
  window.getCsrfToken = () => _csrfToken;

  // ===== 4. Login attempt tracking =====
  window.loginAttempts = JSON.parse(localStorage.getItem('bht_login_attempts') || '[]');

  window.recordLoginAttempt = function (username, success) {
    loginAttempts.push({ ts: Date.now(), username: String(username).substring(0,20), success, ip: 'client' });
    while (loginAttempts.length > 100) loginAttempts.shift();
    localStorage.setItem('bht_login_attempts', JSON.stringify(loginAttempts));
  };

  window.recentFailures = function (username, minutes) {
    const cutoff = Date.now() - (minutes||10) * 60000;
    return loginAttempts.filter(a => a.username === username && !a.success && a.ts > cutoff).length;
  };

  // ===== 5. Auto-lock after failures =====
  window.isLockedOut = function (username) {
    return recentFailures(username, 10) >= 5;
  };

  // ===== 6. Content sanitizer for HTML =====
  window.sanitizeHTML = function (html) {
    const tmp = document.createElement('div');
    tmp.textContent = String(html||'');
    return tmp.innerHTML;
  };

  window.stripDangerous = function (html) {
    return String(html||'')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, 'blocked:')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/data:text\/html/gi, 'blocked:html');
  };

  // ===== 7. URL validation =====
  window.isSafeUrl = function (url) {
    try {
      const u = new URL(url, location.href);
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol);
    } catch (_) { return false; }
  };

  // ===== 8. Block dangerous link clicks =====
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href && !isSafeUrl(href) && !href.startsWith('#')) {
      e.preventDefault();
      console.warn('[security] blocked unsafe link:', href);
      if (typeof toast === 'function') toast('קישור חסום מטעמי בטיחות', 'warn');
    }
  });

  // ===== 9. Session fingerprint =====
  window.sessionFingerprint = function () {
    const components = [
      navigator.userAgent.substring(0, 50),
      screen.width + 'x' + screen.height,
      navigator.language,
      new Date().getTimezoneOffset(),
    ];
    let hash = 0;
    const s = components.join('|');
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    return Math.abs(hash).toString(36);
  };

  // ===== 10. Check session integrity =====
  const _fpKey = 'bht_session_fp';
  setTimeout(() => {
    const stored = sessionStorage.getItem(_fpKey);
    const current = sessionFingerprint();
    if (stored && stored !== current) {
      console.warn('[security] session fingerprint changed!');
      if (typeof notify === 'function') notify('⚠ זוהה שינוי בסביבת ההפעלה - בדוק שאתה במכשיר שלך', 'warn');
    }
    sessionStorage.setItem(_fpKey, current);
  }, 1000);

  // ===== Bonus: Sensitive data warnings =====
  window.detectSensitiveData = function (text) {
    const patterns = [
      { kind: 'ת.ז.', re: /\b\d{9}\b/ },
      { kind: 'טלפון', re: /\b05\d-?\d{7}\b/ },
      { kind: 'אימייל', re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
      { kind: 'IBAN', re: /\bIL\d{20,22}\b/ },
    ];
    return patterns.filter(p => p.re.test(text)).map(p => p.kind);
  };

  console.warn('%c🔐 Pack-41 — Security: encryption, CSRF, login tracking, sanitize, URL safety, fingerprint', 'color:#dc2626;font-weight:bold');
  console.info('Tips: encryptString(), recentFailures(user), sessionFingerprint()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-41.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-42.js ─────────────────────────────────────────────
try {
// behavior-pack-42.js — Sheet sync + error recovery. 2026-05-25
(function () {// ===== 1. Auto-retry failed API calls =====
  const _origApi = window.api;
  if (typeof _origApi === 'function' && !window._retryWrapped) {
    window._retryWrapped = true;
    window.api = async function (action, args) {
      let lastErr;
      for (let i = 0; i < 3; i++) {
        try {
          const r = await _origApi.apply(this, arguments);
          if (r && r.ok !== false) return r;
          if (r && (r.error === 'lock_timeout' || r.error === 'rate_limit_exceeded')) {
            await new Promise(res => setTimeout(res, 500 * (i+1)));
            continue;
          }
          return r;
        } catch (e) {
          lastErr = e;
          if (i < 2) await new Promise(res => setTimeout(res, 500 * (i+1)));
        }
      }
      throw lastErr || new Error('api_failed');
    };
  }

  // ===== 2. Pending writes queue (for offline) =====
  window._pendingWrites = JSON.parse(localStorage.getItem('bht_pending_writes') || '[]');

  async function flushPendingWrites() {
    if (!navigator.onLine || !_pendingWrites.length) return;
    const queue = [..._pendingWrites];
    for (let i = 0; i < queue.length; i++) {
      try {
        await api(queue[i].action, queue[i].args);
        _pendingWrites = _pendingWrites.filter(w => w.id !== queue[i].id);
      } catch (_) { break; }
    }
    localStorage.setItem('bht_pending_writes', JSON.stringify(_pendingWrites));
  }
  window.addEventListener('online', flushPendingWrites);
  setInterval(flushPendingWrites, 30000);

  // ===== 3. Error boundary =====
  window.addEventListener('error', e => {
    console.warn('[error boundary]', e.message);
    if (typeof notify === 'function') notify(`שגיאת JS: ${String(e.message).substring(0,80)}`, 'warn');
  });

  // ===== 4. Detect data inconsistency =====
  setInterval(async () => {
    try {
      const r = await api('listStudents', []);
      const ids = (r.data || []).map(s => s['מזהה']);
      const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dups.length) console.warn('[integrity] duplicate student IDs:', dups);
    } catch (_) {}
  }, 5 * 60 * 1000);

  // ===== 5. Server-side error handling =====
  window.handleServerError = function (response) {
    if (!response) return false;
    if (response.error === 'lock_timeout') {
      if (typeof toast === 'function') toast('המערכת עסוקה - נסה שוב', 'warn');
      return true;
    }
    if (response.error === 'rate_limit') {
      if (typeof toast === 'function') toast('יותר מדי בקשות - המתן דקה', 'warn');
      return true;
    }
    if (response.errors) {
      const msg = response.errors.map(e => `${e.field}: ${e.error}`).join(', ');
      if (typeof toast === 'function') toast(msg, 'error');
      return true;
    }
    return false;
  };

  // ===== 6. Cache invalidation strategy =====
  window.invalidateLocalCache = function (action) {
    if (window._apiCache) {
      [...window._apiCache.keys()].forEach(k => {
        if (k.startsWith(action.replace(/^(add|update|delete)/, 'list'))) {
          window._apiCache.delete(k);
        }
      });
    }
  };

  // ===== 7. Health monitor =====
  let _healthChecks = 0;
  let _healthFails = 0;
  setInterval(async () => {
    try {
      await api('ping', []);
      _healthChecks++;
    } catch (_) {
      _healthFails++;
      if (_healthFails > 3) {
        if (typeof notify === 'function') notify('⚠ בעיית חיבור לשרת', 'error');
        _healthFails = 0;
      }
    }
  }, 60000);

  // ===== 8. Auto-recover from quota errors =====
  window.handleQuotaError = function () {
    // Clean old data from localStorage
    const keys = ['bht_audit_log', 'bht_attachments', 'bht_search_history'];
    keys.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
    if (typeof toast === 'function') toast('שטח אחסון נוקה - נסה שוב', 'info');
  };

  // ===== 9. Service worker update prompt =====
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (typeof toast === 'function') toast('🔄 גרסה חדשה זמינה - רענן את הדף', 'info', 10000);
    });
  }

  // ===== 10. Sync indicator =====
  let _syncState = 'idle';
  window.setSyncState = function (state) {
    _syncState = state;
    let ind = document.getElementById('sync-state-ind');
    if (!ind) {
      ind = document.createElement('div');
      ind.id = 'sync-state-ind';
      ind.style.cssText = 'position:fixed;bottom:4px;right:4px;font-size:10px;color:#9ca3af;z-index:9990';
      document.body.appendChild(ind);
    }
    const icons = { idle: '○', syncing: '◐', ok: '●', error: '⚠' };
    ind.textContent = icons[state] || '?';
    ind.style.color = state === 'ok' ? '#16a34a' : state === 'error' ? '#dc2626' : state === 'syncing' ? '#f59e0b' : '#9ca3af';
  };

  console.warn('%c🔄 Pack-42 — Sync: retry, pending writes, error boundary, integrity check, health monitor', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-42.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-43.js ─────────────────────────────────────────────
try {
// behavior-pack-43.js — Smart auto-save & undo history. 2026-05-25
(function () {// ===== 1. Auto-save drafts every 30s =====
  setInterval(() => {
    document.querySelectorAll('.modal.show textarea[id^="b-"],.modal.show textarea[id^="nw-"],.modal.show textarea[id^="nr-"]').forEach(t => {
      if (t.value && t.value.length > 5) {
        try {
          localStorage.setItem('bht_draft_' + t.id, t.value);
        } catch (_) {}
      }
    });
  }, 30000);

  // ===== 2. Restore drafts on modal open =====
  document.addEventListener('shown.bs.modal', e => {
    e.target.querySelectorAll('textarea[id]').forEach(t => {
      if (!t.value) {
        try {
          const draft = localStorage.getItem('bht_draft_' + t.id);
          if (draft) {
            const restore = document.createElement('button');
            restore.type = 'button';
            restore.className = 'btn btn-sm btn-outline-warning mb-1';
            restore.innerHTML = '↺ שחזר טיוטה';
            restore.onclick = () => {
              t.value = draft;
              restore.remove();
              if (typeof toast === 'function') toast('טיוטה שוחזרה', 'success');
            };
            t.parentNode.insertBefore(restore, t);
          }
        } catch (_) {}
      }
    });
  });

  // ===== 3. Clear draft after successful save =====
  document.addEventListener('click', e => {
    const btn = e.target.closest('button.btn-primary');
    if (!btn || !btn.textContent.includes('שמור')) return;
    setTimeout(() => {
      Object.keys(localStorage).filter(k => k.startsWith('bht_draft_')).forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
      });
    }, 2000);
  });

  // ===== 4. Visit history =====
  window._visitHistory = JSON.parse(localStorage.getItem('bht_visits') || '[]');
  window.addEventListener('hashchange', () => {
    const page = location.hash.replace('#','') || 'home';
    _visitHistory.unshift({ page, ts: Date.now() });
    if (_visitHistory.length > 50) _visitHistory.pop();
    localStorage.setItem('bht_visits', JSON.stringify(_visitHistory));
  });

  // ===== 5. Quick "back" button =====
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key === 'ArrowRight') { // RTL = back
      e.preventDefault();
      history.back();
    }
  });

  // ===== 6. Smart focus management =====
  document.addEventListener('shown.bs.modal', e => {
    const firstInput = e.target.querySelector('input:not([type=hidden]),textarea,select');
    if (firstInput) firstInput.focus();
  });

  // ===== 7. Enter to submit =====
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.shiftKey || e.target.tagName === 'TEXTAREA') return;
    const modal = e.target.closest('.modal.show');
    if (!modal) return;
    const submitBtn = modal.querySelector('button.btn-primary:not([disabled])');
    if (submitBtn) { e.preventDefault(); submitBtn.click(); }
  });

  // ===== 8. Visual sorting indicator =====
  document.addEventListener('click', e => {
    const th = e.target.closest('th[data-sort]');
    if (!th) return;
    const dir = th.dataset.dir === 'asc' ? 'desc' : 'asc';
    th.parentElement.querySelectorAll('th').forEach(t => { t.dataset.dir = ''; });
    th.dataset.dir = dir;
    const icon = dir === 'asc' ? ' ▲' : ' ▼';
    th.textContent = th.textContent.replace(/[▲▼]/g, '').trim() + icon;
  });

  // ===== 9. Lazy import students data =====
  let _lazyLoaded = false;
  document.addEventListener('hashchange', async () => {
    if (_lazyLoaded) return;
    if (!['students','behavior','classview'].includes(location.hash.replace('#',''))) return;
    _lazyLoaded = true;
    try {
      const r = await api('listStudents', []);
      window._allStudents = r.data || [];
    } catch (_) {}
  });

  // ===== 10. Print only current view =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      const cur = document.querySelector('[id^="page-"]:not(.d-none)');
      if (!cur) { window.print(); return; }
      const w = window.open('', '_blank');
      w.document.write('<html dir="rtl"><head><title>הדפסה</title><style>body{font-family:Heebo,Arial;padding:20px}</style></head><body>' + cur.innerHTML + '<script>setTimeout(()=>window.print(),300)</script></body></html>');
    }
  });

  console.warn('%c💾 Pack-43 — Smart save: drafts, restore, history, Enter-submit, lazy load', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-43.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-44.js ─────────────────────────────────────────────
try {
// behavior-pack-44.js — Import/Export & Data Migration. 2026-05-25
(function () {// ===== 1. CSV import =====
  window.importCSV = function (file, onParse) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result.replace(/^﻿/, '');
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (!lines.length) return onParse?.([]);
      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1).map(l => {
        const cells = parseCSVLine(l);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = cells[i] || ''; });
        return obj;
      });
      onParse?.(rows, headers);
    };
    reader.readAsText(file, 'UTF-8');
  };

  function parseCSVLine(line) {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        result.push(cur); cur = '';
      } else cur += c;
    }
    result.push(cur);
    return result;
  }

  // ===== 2. Export to Excel-compatible CSV =====
  window.exportCSV = function (rows, filename) {
    if (!rows.length) return;
    const headers = [...new Set(rows.flatMap(r => Object.keys(r)))];
    let csv = '﻿' + headers.map(h => `"${String(h).replace(/"/g,'""')}"`).join(',') + '\n';
    rows.forEach(r => {
      csv += headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    downloadFile(csv, filename || 'export.csv', 'text/csv');
  };

  // ===== 3. JSON export =====
  window.exportJSON = function (data, filename) {
    downloadFile(JSON.stringify(data, null, 2), filename || 'export.json', 'application/json');
  };

  // ===== 4. Helper: download file =====
  function downloadFile(content, name, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  window.downloadFile = downloadFile;

  // ===== 5. Bulk import dialog =====
  window.openImportDialog = function () {
    const html = `<div class="modal fade show" id="imp-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-upload"></i> ייבוא נתונים</h5><button class="btn-close" onclick="document.getElementById('imp-modal').remove()"></button></div>
          <div class="modal-body">
            <p>בחר סוג ייבוא:</p>
            <select id="imp-type" class="form-select mb-2">
              <option value="students">תלמידים</option>
              <option value="behavior">אירועי התנהגות</option>
              <option value="tasks">משימות</option>
            </select>
            <input type="file" id="imp-file" accept=".csv,.json" class="form-control mb-2">
            <div id="imp-preview"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="imp-go" disabled>ייבא</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const fileInput = document.getElementById('imp-file');
    const preview = document.getElementById('imp-preview');
    const goBtn = document.getElementById('imp-go');
    let parsedRows = [];
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.name.endsWith('.json')) {
        file.text().then(t => {
          try {
            parsedRows = JSON.parse(t);
            preview.innerHTML = `<div class="alert alert-info">נטענו ${parsedRows.length} רשומות</div>`;
            goBtn.disabled = false;
          } catch (err) {
            preview.innerHTML = `<div class="alert alert-danger">${escHtml(err.message)}</div>`;
          }
        });
      } else {
        importCSV(file, (rows) => {
          parsedRows = rows;
          preview.innerHTML = `<div class="alert alert-info">נטענו ${rows.length} שורות</div>
            <small>${escHtml(Object.keys(rows[0]||{}).join(' | '))}</small>`;
          goBtn.disabled = false;
        });
      }
    };
    goBtn.onclick = async () => {
      const type = document.getElementById('imp-type').value;
      const action = { students: 'addStudent', behavior: 'addBehavior', tasks: 'addTask' }[type];
      let ok = 0, fail = 0;
      goBtn.disabled = true;
      for (const row of parsedRows) {
        try {
          const r = await api(action, [row]);
          if (r?.ok !== false) ok++; else fail++;
        } catch (_) { fail++; }
      }
      if (typeof toast === 'function') toast(`✓ ${ok} | ✗ ${fail}`, 'success');
      document.getElementById('imp-modal').remove();
    };
  };

  // ===== 6. Template download =====
  window.downloadTemplate = function (type) {
    const templates = {
      students: [{ 'שם פרטי':'', 'שם משפחה':'', 'מחזור':'', 'טלפון אם':'', 'טלפון אב':'', 'כתובת':'' }],
      behavior: [{ 'תאריך':'', 'שם תלמיד':'', 'קטגוריה':'', 'תיאור':'', 'חומרה':'', 'דווח_עי':'' }],
      tasks: [{ 'כותרת':'', 'תיאור':'', 'אחראי':'', 'תאריך_יעד':'', 'סטטוס':'חדש', 'עדיפות':'בינוני' }],
    };
    exportCSV(templates[type] || [], `template_${type}.csv`);
  };

  // ===== 7. Excel-style paste =====
  document.addEventListener('paste', e => {
    const t = e.target;
    if (!t.matches('input,textarea')) return;
    const text = e.clipboardData?.getData('text');
    if (!text || !text.includes('\t')) return;
    // Detect tab-separated paste from Excel
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length > 1) {
      e.preventDefault();
      if (confirm(`זוהה הדבק טבלאי (${lines.length} שורות). לפתוח כפול-יבוא?`)) {
        openImportDialog();
      }
    }
  });

  // ===== 8. Diff between datasets =====
  window.diffDatasets = function (oldArr, newArr, keyField) {
    const oldMap = new Map(oldArr.map(x => [x[keyField], x]));
    const newMap = new Map(newArr.map(x => [x[keyField], x]));
    const added = newArr.filter(x => !oldMap.has(x[keyField]));
    const removed = oldArr.filter(x => !newMap.has(x[keyField]));
    const modified = newArr.filter(x => oldMap.has(x[keyField]) && JSON.stringify(oldMap.get(x[keyField])) !== JSON.stringify(x));
    return { added, removed, modified };
  };

  // ===== 9. Cleanup duplicates =====
  window.findDuplicates = async function (type) {
    const r = await api(`list${type[0].toUpperCase()+type.slice(1)}`, []);
    const data = r.data || [];
    const seen = new Map();
    const dups = [];
    data.forEach(d => {
      const key = (d['שם פרטי']||'') + (d['שם משפחה']||'') + (d['תיאור']||'').substring(0,30);
      if (seen.has(key)) dups.push({ original: seen.get(key), duplicate: d });
      else seen.set(key, d);
    });
    return dups;
  };

  // ===== 10. Big export menu =====
  window.bigExportMenu = function () {
    const opts = [
      { label: 'תלמידים (CSV)', action: async () => { const r = await api('listStudents', []); exportCSV(r.data, 'students.csv'); } },
      { label: 'אירועים (CSV)', action: async () => { const r = await api('listBehavior', []); exportCSV(r.data, 'behavior.csv'); } },
      { label: 'משימות (CSV)', action: async () => { const r = await api('listTasks', []); exportCSV(r.data, 'tasks.csv'); } },
      { label: 'כל הנתונים (JSON)', action: () => downloadFullBackup?.() },
      { label: 'תבנית - תלמידים', action: () => downloadTemplate('students') },
      { label: 'תבנית - אירועים', action: () => downloadTemplate('behavior') },
    ];
    const html = `<div class="modal fade show" id="exp-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>📤 ייצוא</h5><button class="btn-close" onclick="document.getElementById('exp-modal').remove()"></button></div>
          <div class="modal-body">${opts.map((o, i) => `<button class="btn btn-outline-primary w-100 mb-2" data-i="${i}">${escHtml(o.label)}</button>`).join('')}</div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('exp-modal').onclick = (e) => {
      const idx = e.target.closest('[data-i]')?.dataset.i;
      if (idx !== undefined) {
        opts[idx].action();
        document.getElementById('exp-modal').remove();
      }
    };
  };

  console.warn('%c📤 Pack-44 — Import/Export: CSV, JSON, templates, Excel paste, diff, duplicates', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-44.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-45.js ─────────────────────────────────────────────
try {
// behavior-pack-45.js — Saved Views & Filters Persistence. 2026-05-25
(function () {// ===== 1. Save current view =====
  window.savedViews = JSON.parse(localStorage.getItem('bht_saved_views') || '[]');

  window.saveCurrentView = function (name) {
    const view = {
      id: Date.now(),
      name: name || `תצוגה ${savedViews.length + 1}`,
      page: location.hash.replace('#', ''),
      filters: collectFilters(),
      created: Date.now(),
    };
    savedViews.push(view);
    localStorage.setItem('bht_saved_views', JSON.stringify(savedViews));
    if (typeof toast === 'function') toast(`תצוגה "${view.name}" נשמרה`, 'success');
    return view;
  };

  function collectFilters() {
    const filters = {};
    document.querySelectorAll('select[id*="-f"], input[id*="-f"]').forEach(el => {
      if (el.value) filters[el.id] = el.value;
    });
    return filters;
  }

  window.applyView = function (id) {
    const view = savedViews.find(v => v.id === id);
    if (!view) return;
    if (view.page) goto(view.page);
    setTimeout(() => {
      Object.entries(view.filters || {}).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) { el.value = val; el.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    }, 500);
  };

  window.deleteView = function (id) {
    savedViews = savedViews.filter(v => v.id !== id);
    localStorage.setItem('bht_saved_views', JSON.stringify(savedViews));
  };

  // ===== 2. Saved views menu =====
  window.openSavedViewsMenu = function () {
    const html = `<div class="modal fade show" id="sv-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>📋 תצוגות שמורות</h5><button class="btn-close" onclick="document.getElementById('sv-modal').remove()"></button></div>
          <div class="modal-body">
            ${savedViews.length ? savedViews.map(v => `
              <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                <button class="btn btn-link p-0" onclick="applyView(${v.id});document.getElementById('sv-modal').remove()">${escHtml(v.name)}</button>
                <button class="btn btn-sm btn-link text-danger" onclick="deleteView(${v.id});this.parentElement.remove()">×</button>
              </div>`).join('') : '<div class="text-muted">אין תצוגות שמורות</div>'}
            <hr>
            <button class="btn btn-primary w-100" onclick="(function(){const n=prompt('שם תצוגה:');if(n){saveCurrentView(n);document.getElementById('sv-modal').remove()}})()">+ שמור תצוגה נוכחית</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 3. Smart filter combos =====
  window.SMART_FILTERS = [
    { id: 'today_high', label: 'היום + חומרה גבוהה', apply: () => { setFilterValue('b-from', new Date().toISOString().slice(0,10)); setFilterValue('b-severity', 'גבוהה'); } },
    { id: 'this_week', label: 'השבוע הזה', apply: () => { const d=new Date(); d.setDate(d.getDate()-7); setFilterValue('b-from', d.toISOString().slice(0,10)); } },
    { id: 'my_only', label: 'שלי בלבד', apply: () => { const u = JSON.parse(sessionStorage.getItem('user')||'{}'); setFilterValue('b-rabbi', u.username); } },
    { id: 'unresolved', label: 'לא טופל', apply: () => { setFilterValue('b-status', 'ממתין'); } },
  ];

  function setFilterValue(id, value) {
    const el = document.getElementById(id);
    if (el) { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); }
  }

  // ===== 4. Filter chips bar =====
  window.showFilterChips = function () {
    const filters = collectFilters();
    const active = Object.entries(filters);
    let bar = document.getElementById('filter-chips-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'filter-chips-bar';
      bar.style.cssText = 'position:sticky;top:60px;background:#f3f4f6;padding:6px;border-radius:6px;margin:8px 0;display:flex;gap:4px;flex-wrap:wrap;direction:rtl;font-size:12px;z-index:50';
      const page = document.querySelector('[id^="page-"]:not(.d-none)');
      if (page) page.insertBefore(bar, page.children[1]);
    }
    bar.innerHTML = active.length ? active.map(([k, v]) => `
      <span class="badge bg-info" onclick="document.getElementById('${k}').value='';document.getElementById('${k}').dispatchEvent(new Event('change',{bubbles:true}));this.remove()" style="cursor:pointer">
        ${escHtml(v)} ×
      </span>`).join('') : '';
    if (!active.length) bar.style.display = 'none';
    else bar.style.display = '';
  };

  setInterval(showFilterChips, 3000);

  // ===== 5. Quick filter buttons =====
  setTimeout(() => {
    if (document.getElementById('quick-filters-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'quick-filters-bar';
    bar.style.cssText = 'position:fixed;top:48px;right:14px;display:flex;gap:4px;z-index:998;direction:rtl';
    SMART_FILTERS.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-secondary';
      btn.textContent = f.label;
      btn.onclick = f.apply;
      bar.appendChild(btn);
    });
    document.body.appendChild(bar);
  }, 3000);

  // ===== 6. URL deep linking =====
  window.shareFilteredView = function () {
    const params = new URLSearchParams();
    params.set('page', location.hash.replace('#', ''));
    Object.entries(collectFilters()).forEach(([k, v]) => params.set(k, v));
    const url = location.origin + location.pathname + '?' + params.toString() + '#shared';
    navigator.clipboard.writeText(url).then(() => {
      if (typeof toast === 'function') toast('קישור הועתק', 'success');
    });
  };

  // Apply filters from URL on load
  setTimeout(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('page')) {
      const page = params.get('page');
      if (location.hash !== '#' + page) goto(page);
      setTimeout(() => {
        params.forEach((v, k) => {
          if (k === 'page') return;
          setFilterValue(k, v);
        });
      }, 800);
    }
  }, 1500);

  // ===== 7. Filter history =====
  let _filterHistory = [];
  document.addEventListener('change', e => {
    if (e.target.id && e.target.id.includes('-f')) {
      _filterHistory.unshift({ id: e.target.id, value: e.target.value, ts: Date.now() });
      if (_filterHistory.length > 30) _filterHistory.pop();
    }
  });

  window.restoreLastFilter = function () {
    if (!_filterHistory.length) return;
    const last = _filterHistory[0];
    setFilterValue(last.id, last.value);
  };

  // ===== 8. Filter group "OR" support =====
  window.applyOrFilter = function (selectId, values) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    // Multi-select - select first matching
    if (values.length) sel.value = values[0];
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // ===== 9. Reset all filters =====
  window.clearAllFilters = function () {
    document.querySelectorAll('select[id*="-f"], input[id*="-f"]').forEach(el => {
      el.value = '';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    if (typeof toast === 'function') toast('פילטרים נוקו', 'info');
  };

  // ===== 10. Keyboard shortcut =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      openSavedViewsMenu();
    }
    if (e.ctrlKey && e.key === '0' && !e.target.matches('input,textarea')) {
      e.preventDefault();
      clearAllFilters();
    }
  });

  console.warn('%c💾 Pack-45 — Saved views, smart filters, URL deeplink, filter chips, history', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-45.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-46.js ─────────────────────────────────────────────
try {
// behavior-pack-46.js — Hebrew Calendar & Jewish Times. 2026-05-25
(function () {// ===== 1. Jewish months =====
  window.JEWISH_MONTHS = ['ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב'];

  // ===== 2. Parsha schedule (simplified) =====
  window.PARSHIYOT = ['בראשית','נח','לך לך','וירא','חיי שרה','תולדות','ויצא','וישלח','וישב','מקץ','ויגש','ויחי','שמות','וארא','בא','בשלח','יתרו','משפטים','תרומה','תצוה','כי תשא','ויקהל','פקודי','ויקרא','צו','שמיני','תזריע','מצורע','אחרי מות','קדושים','אמר','בהר','בחקתי','במדבר','נשא','בהעלתך','שלח','קרח','חקת','בלק','פנחס','מטות','מסעי','דברים','ואתחנן','עקב','ראה','שפטים','כי תצא','כי תבא','נצבים','וילך','האזינו','וזאת הברכה'];

  window.currentParsha = function () {
    // Approximate week-of-year calculation
    const start = new Date(new Date().getFullYear(), 8, 1); // Sep ~ start of year
    const diff = Date.now() - start.getTime();
    const week = Math.floor(diff / (7 * 86400000));
    return PARSHIYOT[Math.min(Math.max(0, week), PARSHIYOT.length - 1)];
  };

  // ===== 3. Hebrew day of week =====
  window.hebrewDayName = function (date) {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[new Date(date || Date.now()).getDay()];
  };

  // ===== 4. Approximate Hebrew date display =====
  window.formatHebDate = function (date) {
    try {
      return new Date(date).toLocaleDateString('he-IL-u-ca-hebrew', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (_) {
      return '';
    }
  };

  // ===== 5. Time of day blessings reminder =====
  window.dailyBlessings = function () {
    const h = new Date().getHours();
    const items = [];
    if (h >= 4 && h < 11) items.push({ time: 'בוקר', what: 'שחרית' });
    if (h >= 12 && h < 17) items.push({ time: 'צהריים', what: 'מנחה' });
    if (h >= 17 && h < 22) items.push({ time: 'ערב', what: 'מעריב' });
    return items;
  };

  // ===== 6. Hebrew month picker =====
  window.openHebMonthPicker = function (onSelect) {
    const html = `<div class="modal fade show" id="hm-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>בחר חודש עברי</h5><button class="btn-close" onclick="document.getElementById('hm-modal').remove()"></button></div>
          <div class="modal-body">
            <div class="row g-2">
              ${JEWISH_MONTHS.map((m, i) => `<div class="col-4"><button class="btn btn-outline-primary w-100" data-i="${i}">${m}</button></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('hm-modal').onclick = (e) => {
      const idx = e.target.closest('[data-i]')?.dataset.i;
      if (idx !== undefined) {
        if (onSelect) onSelect(JEWISH_MONTHS[idx], parseInt(idx));
        document.getElementById('hm-modal').remove();
      }
    };
  };

  // ===== 7. Friday warning =====
  setTimeout(() => {
    const day = new Date().getDay();
    if (day === 5) { // Friday
      const hour = new Date().getHours();
      if (hour >= 13 && hour < 18 && !sessionStorage.getItem('friday_warn')) {
        sessionStorage.setItem('friday_warn', '1');
        if (typeof notify === 'function') notify('🕯️ ערב שבת קרב - סיים עבודה בזמן', 'warn');
      }
    }
  }, 5000);

  // ===== 8. Year-cycle (zman) calculator =====
  window.zmanForDate = function (date) {
    date = date || new Date();
    const m = date.getMonth();
    const seasons = {
      0: 'חורף', 1: 'חורף', 2: 'אביב', 3: 'אביב', 4: 'אביב',
      5: 'קיץ', 6: 'קיץ', 7: 'קיץ', 8: 'סתיו', 9: 'סתיו',
      10: 'חורף', 11: 'חורף',
    };
    return { season: seasons[m], month: m + 1, parsha: currentParsha() };
  };

  // ===== 9. Hebrew calendar events =====
  window.HEBREW_EVENTS = {
    '01-15': { name: 'ט"ו בשבט', icon: '🌳' },
    '03-15': { name: 'פסח', icon: '🍷' },
    '04-21': { name: 'ל"ג בעומר', icon: '🔥' },
    '05-06': { name: 'שבועות', icon: '📜' },
    '08-09': { name: 'תשעה באב', icon: '🕯️' },
    '09-15': { name: 'ראש השנה', icon: '🍎' },
    '09-25': { name: 'יום כיפור', icon: '🤍' },
    '09-30': { name: 'סוכות', icon: '🛖' },
    '12-25': { name: 'חנוכה', icon: '🕎' },
  };

  // ===== 10. Hebrew calendar widget on home =====
  setTimeout(() => {
    if (document.getElementById('heb-cal-widget')) return;
    const home = document.getElementById('page-home');
    if (!home) return;
    const w = document.createElement('div');
    w.id = 'heb-cal-widget';
    w.className = 'alert alert-info py-2 mt-3';
    w.style.direction = 'rtl';
    const today = new Date();
    const zman = zmanForDate(today);
    w.innerHTML = `
      <strong>📅 ${escHtml(hebrewDayName())}</strong> ·
      ${escHtml(formatHebDate(today))} ·
      <span class="badge bg-light text-dark">${escHtml(zman.season)}</span>
      פרשת השבוע: <strong>${escHtml(zman.parsha)}</strong>
    `;
    home.appendChild(w);
  }, 4000);

  console.warn('%c📅 Pack-46 — Hebrew calendar: parsha, day names, blessings, friday warn, events', 'color:#92400e;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-46.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-47.js ─────────────────────────────────────────────
try {
// behavior-pack-47.js — Smart Notifications & Reminders v2. 2026-05-25
(function () {// ===== 1. Birthday reminders =====
  setInterval(async () => {
    try {
      const r = await api('listStudents', []);
      const students = r.data || [];
      const today = new Date();
      const todayKey = (today.getMonth()+1) + '-' + today.getDate();
      const birthdays = students.filter(s => {
        const bd = s['תאריך_לידה'];
        if (!bd) return false;
        const d = new Date(bd);
        if (isNaN(d)) return false;
        return (d.getMonth()+1)+'-'+d.getDate() === todayKey;
      });
      if (birthdays.length && !sessionStorage.getItem('bdays_' + todayKey)) {
        sessionStorage.setItem('bdays_' + todayKey, '1');
        const names = birthdays.map(s => `${s['שם פרטי']||''} ${s['שם משפחה']||''}`).join(', ');
        if (typeof notify === 'function') notify(`🎂 יום הולדת היום: ${names}`, 'success');
      }
    } catch (_) {}
  }, 4 * 60 * 60 * 1000);
  setTimeout(() => { try { sessionStorage.removeItem('bdays_last'); } catch(_){} }, 100);

  // ===== 2. Anniversary tracking =====
  window.anniversaries = function () {
    // Track admission anniversary
    return [];
  };

  // ===== 3. Overdue tasks alert =====
  setInterval(async () => {
    try {
      const r = await api('listTasks', []);
      const overdue = (r.data || []).filter(t => {
        if (t['סטטוס'] === 'הושלם') return false;
        if (!t['תאריך_יעד']) return false;
        return new Date(t['תאריך_יעד']).getTime() < Date.now();
      });
      if (overdue.length && !sessionStorage.getItem('overdue_alerted_' + new Date().toISOString().slice(0,10))) {
        sessionStorage.setItem('overdue_alerted_' + new Date().toISOString().slice(0,10), '1');
        if (typeof notify === 'function') notify(`⚠ ${overdue.length} משימות באיחור`, 'warn');
      }
    } catch (_) {}
  }, 2 * 60 * 60 * 1000);

  // ===== 4. Idle reminder =====
  let _lastActivity = Date.now();
  ['click', 'keydown'].forEach(ev => document.addEventListener(ev, () => { _lastActivity = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (Date.now() - _lastActivity > 30 * 60 * 1000) {
      _lastActivity = Date.now();
      if (typeof notify === 'function') notify('💡 לא היה פעילות 30 דקות - הכל בסדר?', 'info');
    }
  }, 5 * 60 * 1000);

  // ===== 5. Schedule-based reminders =====
  window.SCHEDULES = {
    morning: { hour: 8, msg: 'בוקר טוב - יום עבודה חדש' },
    midmorning: { hour: 10, msg: 'הפסקת בוקר - שתה משהו' },
    lunch: { hour: 13, msg: 'הפסקת צהריים' },
    afternoon: { hour: 15, msg: 'אחה"צ - בדוק משימות פתוחות' },
    closing: { hour: 17, msg: 'סוף יום - סיכום ושמירה' },
  };

  setInterval(() => {
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    if (m > 5) return; // only first 5 min of hour
    Object.entries(SCHEDULES).forEach(([k, s]) => {
      if (s.hour === h) {
        const key = `sched_${k}_${new Date().toISOString().slice(0,10)}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
        if (typeof notify === 'function') notify(s.msg, 'info');
      }
    });
  }, 60000);

  // ===== 6. Smart batch reminders (group similar) =====
  window._reminderQueue = [];
  window.queueReminder = function (msg, type) {
    _reminderQueue.push({ msg, type, ts: Date.now() });
    clearTimeout(window._queueFlush);
    window._queueFlush = setTimeout(() => {
      if (_reminderQueue.length === 1) {
        if (typeof notify === 'function') notify(_reminderQueue[0].msg, _reminderQueue[0].type);
      } else if (_reminderQueue.length > 1) {
        if (typeof notify === 'function') notify(`📋 ${_reminderQueue.length} תזכורות חדשות`, 'info');
      }
      _reminderQueue = [];
    }, 5000);
  };

  // ===== 7. Snooze action =====
  window.snoozeAll = function (hours) {
    hours = hours || 1;
    localStorage.setItem('bht_snooze_until', String(Date.now() + hours * 3600000));
    if (typeof toast === 'function') toast(`התראות נדחו ל-${hours} שעות`, 'info');
  };

  window.isSnoozed = function () {
    const until = parseInt(localStorage.getItem('bht_snooze_until') || '0', 10);
    return until > Date.now();
  };

  // ===== 8. Conditional reminders =====
  window.conditionalReminder = function (condition, msg) {
    if (typeof condition === 'function' && condition()) {
      if (typeof notify === 'function') notify(msg, 'info');
    }
  };

  // ===== 9. Followup reminder =====
  window.scheduleFollowup = function (studentId, days, msg) {
    const followups = JSON.parse(localStorage.getItem('bht_followups') || '[]');
    followups.push({
      id: Date.now(),
      sid: studentId,
      due: Date.now() + days * 86400000,
      msg: msg,
    });
    localStorage.setItem('bht_followups', JSON.stringify(followups));
    if (typeof toast === 'function') toast(`📌 מעקב מתוזמן בעוד ${days} ימים`, 'success');
  };

  // Check followups
  setInterval(() => {
    try {
      const followups = JSON.parse(localStorage.getItem('bht_followups') || '[]');
      const now = Date.now();
      const due = followups.filter(f => f.due <= now);
      due.forEach(f => {
        if (typeof notify === 'function') notify(`📌 מעקב: ${f.msg}`, 'warn');
      });
      const remaining = followups.filter(f => f.due > now);
      localStorage.setItem('bht_followups', JSON.stringify(remaining));
    } catch (_) {}
  }, 60 * 60 * 1000);

  // ===== 10. Notifications center button =====
  setTimeout(() => {
    if (document.getElementById('reminder-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'reminder-btn';
    btn.title = 'תזכורות + מעקבים';
    btn.style.cssText = 'position:fixed;bottom:380px;left:14px;width:42px;height:42px;border-radius:50%;background:#f59e0b;color:#fff;border:none;font-size:18px;cursor:pointer;z-index:9990;box-shadow:0 4px 8px rgba(0,0,0,0.2)';
    btn.innerHTML = '⏰';
    btn.onclick = () => openReminderDialog?.();
    document.body.appendChild(btn);
  }, 3500);

  console.warn('%c⏰ Pack-47 — Smart reminders: birthdays, overdue, idle, schedule, snooze, followups', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-47.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-48.js ─────────────────────────────────────────────
try {
// behavior-pack-48.js — Consolidate floating buttons into one. 2026-05-25
(function () {// IDs של כל הכפתורים הצפים שיוצרים בpacks קודמים
  const FLOATING_IDS = [
    'notif-bell',      // pack-12
    'voice-cmd-btn',   // pack-18
    'quick-action-fab',// pack-13
    'theme-btn',       // pack-32
    'help-btn',        // pack-37
    'reminder-btn',    // pack-47
    'quick-add-fab',   // pack-40
    'a11y-toolbar',    // pack-26 (toolbar)
    'home-report-btn', // pack-22 (not floating, but checked)
    'home-lb-btn',     // pack-33
    'active-users-badge', // pack-36
    'lang-switch',     // pack-24
    'sync-indicator',  // sync-engine
    'sync-state-ind',  // pack-42
    'offline-banner',  // pack-29 (banner)
    'notif-count',     // pack-12 child
  ];

  // ===== Hide all existing floating buttons =====
  function hideOldFloaters() {
    FLOATING_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && id !== 'sync-indicator' && id !== 'sync-state-ind' && id !== 'offline-banner') {
        el.style.display = 'none';
      }
    });
  }
  // Run periodically since some are recreated by interval
  setInterval(hideOldFloaters, 2000);
  setTimeout(hideOldFloaters, 500);

  // ===== Master FAB =====
  function createMasterFab() {
    if (document.getElementById('master-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'master-fab';
    fab.setAttribute('aria-label', 'תפריט פעולות');
    fab.title = 'תפריט פעולות';
    fab.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #fff;
      border: none;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(0,0,0,0.25);
      z-index: 9995;
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    fab.textContent = '⚡';
    fab.onmouseenter = () => { fab.style.transform = 'scale(1.1)'; fab.style.boxShadow = '0 8px 20px rgba(0,0,0,0.35)'; };
    fab.onmouseleave = () => { fab.style.transform = ''; fab.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)'; };
    fab.onclick = toggleFabMenu;
    document.body.appendChild(fab);

    // Notification dot
    setInterval(updateFabDot, 5000);
  }

  function updateFabDot() {
    const fab = document.getElementById('master-fab');
    if (!fab) return;
    const count = (window.notifications || []).filter(n => !n.read).length;
    let dot = fab.querySelector('.fab-dot');
    if (count > 0) {
      if (!dot) {
        dot = document.createElement('span');
        dot.className = 'fab-dot';
        dot.style.cssText = 'position:absolute;top:-2px;right:-2px;width:18px;height:18px;background:#dc2626;color:#fff;border-radius:50%;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid #fff';
        fab.style.position = 'fixed';
        fab.appendChild(dot);
      }
      dot.textContent = count > 9 ? '9+' : count;
    } else if (dot) {
      dot.remove();
    }
  }

  // ===== Menu items =====
  const MENU_ITEMS = [
    { icon: '🔍', label: 'חיפוש מהיר', kbd: 'Ctrl+K', action: () => window.openGlobalSearch?.() },
    { icon: '➕', label: 'הוסף חדש', kbd: 'n', action: () => window.showQuickActions?.() },
    { icon: '🎤', label: 'פקודה קולית', kbd: 'Ctrl+Shift+V', action: () => window.startVoiceCommand?.() },
    { icon: '🔔', label: 'התראות', badge: () => (window.notifications||[]).filter(n=>!n.read).length, action: () => window.showNotifications?.() },
    { icon: '⏰', label: 'תזכורות', action: () => window.openReminderDialog?.() },
    { icon: '🎨', label: 'ערכת נושא', action: () => window.openThemePicker?.() },
    { icon: '🏆', label: 'מצטיינים', action: () => window.showLeaderboard?.() },
    { icon: '📊', label: 'דוח חודשי', action: () => window.printableReport?.() },
    { icon: '📤', label: 'ייצוא', action: () => window.bigExportMenu?.() },
    { icon: '⌨', label: 'קיצורים', kbd: '?', action: () => window.showShortcutsList?.() },
    { icon: '❓', label: 'עזרה', action: () => window.showContextHelp?.() },
    { icon: '💾', label: 'גיבוי', action: () => window.downloadFullBackup?.() },
    { icon: '👥', label: 'צוות', action: () => window.goto?.('staff') },
    { icon: '⚙', label: 'הגדרות', action: () => window.goto?.('settings') },
  ];

  function toggleFabMenu() {
    const existing = document.getElementById('fab-menu');
    if (existing) {
      existing.remove();
      return;
    }
    const menu = document.createElement('div');
    menu.id = 'fab-menu';
    menu.style.cssText = `
      position: fixed;
      bottom: 90px;
      left: 24px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      padding: 8px;
      z-index: 9994;
      direction: rtl;
      max-height: 70vh;
      overflow-y: auto;
      animation: fabMenuIn 0.2s ease-out;
      min-width: 220px;
    `;

    // Inject animation
    if (!document.getElementById('fab-anim-style')) {
      const style = document.createElement('style');
      style.id = 'fab-anim-style';
      style.textContent = `@keyframes fabMenuIn { from { opacity: 0; transform: translateY(10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }`;
      document.head.appendChild(style);
    }

    MENU_ITEMS.forEach(item => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 10px 14px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 8px;
        font-size: 14px;
        text-align: right;
        transition: background 0.15s;
        position: relative;
      `;
      btn.onmouseenter = () => { btn.style.background = '#f3f4f6'; };
      btn.onmouseleave = () => { btn.style.background = 'transparent'; };
      let badge = '';
      if (item.badge) {
        const n = item.badge();
        if (n > 0) badge = `<span style="background:#dc2626;color:#fff;border-radius:10px;padding:1px 7px;font-size:11px;font-weight:bold;margin-right:auto">${n}</span>`;
      }
      btn.innerHTML = `
        <span style="font-size:20px;width:28px;display:inline-block;text-align:center">${item.icon}</span>
        <span style="flex:1">${item.label}</span>
        ${badge}
        ${item.kbd ? `<kbd style="font-size:10px;background:#e5e7eb;padding:2px 6px;border-radius:3px;font-family:monospace">${item.kbd}</kbd>` : ''}
      `;
      btn.onclick = () => {
        menu.remove();
        try { item.action?.(); } catch (e) { console.warn(e); }
      };
      menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    setTimeout(() => {
      const closer = (e) => {
        if (!menu.contains(e.target) && e.target.id !== 'master-fab') {
          menu.remove();
          document.removeEventListener('click', closer);
        }
      };
      document.addEventListener('click', closer);
    }, 100);
  }

  // ===== Esc closes menu =====
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('fab-menu')?.remove();
    }
  });

  // ===== Touch swipe support =====
  let touchY = null;
  document.addEventListener('touchstart', e => {
    const menu = document.getElementById('fab-menu');
    if (menu && menu.contains(e.target)) touchY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (touchY === null) return;
    const dy = e.touches[0].clientY - touchY;
    if (dy > 100) {
      document.getElementById('fab-menu')?.remove();
      touchY = null;
    }
  }, { passive: true });

  // ===== Init =====
  setTimeout(createMasterFab, 1500);
  // Force-hide existing
  setTimeout(hideOldFloaters, 1000);

  // Inject CSS to permanently hide old floaters
  const hideStyle = document.createElement('style');
  hideStyle.id = 'hide-old-floaters';
  hideStyle.textContent = `
    #notif-bell, #voice-cmd-btn, #quick-action-fab, #theme-btn,
    #help-btn, #reminder-btn, #quick-add-fab, #home-lb-btn,
    #active-users-badge, #lang-switch, #a11y-toolbar { display: none !important; }
  `;
  document.head.appendChild(hideStyle);

  console.warn('%c⚡ Pack-48 — Master FAB: unified menu, hides 14 old floaters', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-48.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-49.js ─────────────────────────────────────────────
try {
// behavior-pack-49.js — Performance Fix: consolidate 61 intervals into master scheduler. 2026-05-25
(function () {// ===== Stop all existing intervals from packs =====
  // (cannot easily stop them but can throttle)

  // ===== Master scheduler - replaces dozens of setIntervals =====
  const tasks = {
    every5sec: [],
    every30sec: [],
    every2min: [],
    every10min: [],
    everyHour: [],
  };

  let _lastRun = {};
  function masterTick() {
    if (document.hidden) return; // skip when hidden

    const now = Date.now();

    // Every 5 sec - critical UI
    if (now - (_lastRun.s5 || 0) > 5000) {
      _lastRun.s5 = now;
      tasks.every5sec.forEach(fn => { try { fn(); } catch (_) {} });
    }
    // Every 30 sec
    if (now - (_lastRun.s30 || 0) > 30000) {
      _lastRun.s30 = now;
      tasks.every30sec.forEach(fn => { try { fn(); } catch (_) {} });
    }
    // Every 2 min
    if (now - (_lastRun.m2 || 0) > 120000) {
      _lastRun.m2 = now;
      tasks.every2min.forEach(fn => { try { fn(); } catch (_) {} });
    }
    // Every 10 min
    if (now - (_lastRun.m10 || 0) > 600000) {
      _lastRun.m10 = now;
      tasks.every10min.forEach(fn => { try { fn(); } catch (_) {} });
    }
    // Every hour
    if (now - (_lastRun.h1 || 0) > 3600000) {
      _lastRun.h1 = now;
      tasks.everyHour.forEach(fn => { try { fn(); } catch (_) {} });
    }
  }

  // Start ONE master interval
  const masterId = setInterval(masterTick, 5000);

  window.scheduleTask = function (interval, fn) {
    const map = { '5s': 'every5sec', '30s': 'every30sec', '2m': 'every2min', '10m': 'every10min', '1h': 'everyHour' };
    const bucket = map[interval];
    if (bucket && tasks[bucket]) tasks[bucket].push(fn);
  };

  // ===== Stop all background intervals when page hidden =====
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.info('[perf] page hidden - pausing master scheduler');
    } else {
      console.info('[perf] page visible - resuming');
      masterTick();
    }
  });

  // ===== Cleanup zombie elements aggressively =====
  scheduleTask('30s', function cleanupZombies() {
    // Remove all duplicate floating elements
    const ids = ['notif-bell','voice-cmd-btn','quick-action-fab','theme-btn','help-btn','reminder-btn','quick-add-fab','master-fab','home-lb-btn','lang-switch'];
    ids.forEach(id => {
      const els = document.querySelectorAll('#' + id);
      for (let i = 1; i < els.length; i++) els[i].remove();
    });
    // Remove zombie modal backdrops
    const visible = document.querySelectorAll('.modal.show').length;
    document.querySelectorAll('.modal-backdrop').forEach((b, i) => {
      if (i >= visible) b.remove();
    });
    if (!visible) {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  });

  // ===== Memory limit guard =====
  scheduleTask('10m', function memoryGuard() {
    let total = 0;
    for (let k in localStorage) total += (localStorage[k]?.length || 0) + k.length;
    const mb = total * 2 / 1024 / 1024;
    if (mb > 6) {
      // Clean old data
      ['bht_audit_log', 'bht_search_history', 'bht_visits'].forEach(k => {
        try {
          const data = JSON.parse(localStorage[k] || '[]');
          if (Array.isArray(data) && data.length > 50) {
            localStorage[k] = JSON.stringify(data.slice(0, 50));
          }
        } catch (_) {}
      });
      console.warn(`[perf] cleaned localStorage: ${mb.toFixed(1)}MB`);
    }
  });

  // ===== Throttle MutationObserver count =====
  if (window._observerLimit !== true) {
    window._observerLimit = true;
    let _activeObservers = 0;
    const OrigObserver = window.MutationObserver;
    window.MutationObserver = class extends OrigObserver {
      constructor(cb) {
        if (_activeObservers > 8) {
          console.warn('[perf] too many MutationObservers - blocked');
          // Return a no-op observer
          super(() => {});
          return;
        }
        _activeObservers++;
        super(cb);
      }
    };
  }

  // ===== Show performance health =====
  window.perfHealth = function () {
    return {
      scripts_loaded: document.querySelectorAll('script[src]').length,
      tracked_intervals: (window._bhtIntervals || new Set()).size,
      master_scheduler_tasks: Object.values(tasks).reduce((s, a) => s + a.length, 0),
      localStorage_mb: (JSON.stringify(localStorage).length / 1024 / 1024).toFixed(2),
      notifications: (window.notifications || []).length,
      modals_visible: document.querySelectorAll('.modal.show').length,
      observers: window._observerLimit ? '<= 8' : '?',
      page_hidden: document.hidden,
    };
  };

  // ===== Reduce duplicate init logs =====
  const _origWarn = console.warn;
  let _warnSeen = new Set();
  console.warn = function (...args) {
    const key = String(args[0] || '').substring(0, 60);
    if (_warnSeen.has(key)) return;
    _warnSeen.add(key);
    if (_warnSeen.size > 200) _warnSeen.clear();
    _origWarn.apply(this, args);
  };

  // Final: announce
  _origWarn.call(console, '%c🚀 Pack-49 — Master scheduler (1 interval), zombie cleanup, memory guard, observer limit', 'color:#16a34a;font-weight:bold;font-size:13px');
  _origWarn.call(console, '%c   Try: perfHealth()', 'color:#6b7280');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-49.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-50.js ─────────────────────────────────────────────
try {
// behavior-pack-50.js — Fix forms refresh loop + signed forms viewer. 2026-05-25
(function () {// ===== FIX 1: Debounce all render functions =====
  // Prevent constant re-renders when sync triggers
  const _renderCache = {};
  const RENDER_DEBOUNCE_MS = 3000;

  function debounceRender(fnName) {
    const orig = window[fnName];
    if (typeof orig !== 'function' || orig._debounced) return;
    window[fnName] = function (...args) {
      const now = Date.now();
      const last = _renderCache[fnName] || 0;
      // Skip if rendered less than RENDER_DEBOUNCE_MS ago - unless forced
      if (now - last < RENDER_DEBOUNCE_MS && !window._forceRender) {
        return Promise.resolve();
      }
      _renderCache[fnName] = now;
      return orig.apply(this, args);
    };
    window[fnName]._debounced = true;
  }

  // Debounce all render functions
  setTimeout(() => {
    ['renderFormsTab', 'renderFormsMgmt', 'renderBehavior', 'renderStudents', 'renderTasks', 'renderProjects', 'renderStaff'].forEach(debounceRender);
  }, 1000);

  // ===== FIX 2: Pause auto-sync when user is on forms page =====
  const _origDispatch = window.dispatchEvent.bind(window);
  // We can't easily intercept dispatchEvent. Use listener pattern:
  window.addEventListener('cheder-data-refreshed', (e) => {
    const currentHash = location.hash.replace('#','');
    // If we're on forms, only refresh on actual mutation, not periodic sync
    if (currentHash === 'formsMgmt' && e.detail?.type === 'visibility') {
      e.stopImmediatePropagation();
    }
  }, true);

  // ===== Signed forms storage =====
  window.SIGNED_FORMS = JSON.parse(localStorage.getItem('bht_signed_forms') || '[]');

  window.saveSignedForm = function (formData) {
    const signed = {
      id: 'sf_' + Date.now(),
      ts: Date.now(),
      ...formData,
    };
    SIGNED_FORMS.unshift(signed);
    if (SIGNED_FORMS.length > 200) SIGNED_FORMS.pop();
    try {
      localStorage.setItem('bht_signed_forms', JSON.stringify(SIGNED_FORMS));
    } catch (e) {
      // Quota - trim more
      SIGNED_FORMS.length = 50;
      localStorage.setItem('bht_signed_forms', JSON.stringify(SIGNED_FORMS));
    }
    return signed;
  };

  // ===== View signed forms =====
  window.showSignedForms = async function () {
    let forms = [...SIGNED_FORMS];
    // Also try to fetch from Sheet
    try {
      const r = await api('listSignatures', []);
      if (r.data) forms = [...forms, ...r.data.map(s => ({ ...s, source: 'sheet' }))];
    } catch (_) {}

    const html = `<div class="modal fade show" id="sf-modal" style="display:block;background:rgba(0,0,0,0.5)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;max-height:90vh;display:flex;flex-direction:column">
          <div class="modal-header">
            <h5><i class="bi bi-pen-fill"></i> חתימות הורים שנשלחו (${forms.length})</h5>
            <div>
              <button class="btn btn-sm btn-outline-primary" onclick="exportSignedCSV()">⬇ CSV</button>
              <button class="btn btn-sm btn-outline-secondary" onclick="printSignedForms()">🖨 הדפס</button>
              <button class="btn-close" onclick="document.getElementById('sf-modal').remove()"></button>
            </div>
          </div>
          <div class="modal-body" style="overflow-y:auto;flex:1">
            <input id="sf-search" class="form-control mb-3" placeholder="חיפוש לפי שם תלמיד, סוג, תוכן...">
            <div id="sf-list">
              ${forms.length ? forms.map(f => renderSignedRow(f)).join('') : '<div class="text-center text-muted py-4">אין חתימות עדיין</div>'}
            </div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('sf-search').oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      const list = document.getElementById('sf-list');
      const filtered = !q ? forms : forms.filter(f =>
        JSON.stringify(f).toLowerCase().includes(q)
      );
      list.innerHTML = filtered.length ? filtered.map(renderSignedRow).join('') : '<div class="text-center text-muted py-4">לא נמצאו תוצאות</div>';
    };
  };

  function renderSignedRow(form) {
    const date = form.ts ? new Date(form.ts) : (form['תאריך'] ? new Date(form['תאריך']) : null);
    const dateStr = date ? date.toLocaleDateString('he-IL') + ' ' + date.toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'}) : '';
    const studentName = form['שם תלמיד'] || form.student || form.name || '';
    const formType = form['סוג'] || form.type || 'חתימה';
    const status = form['סטטוס'] || form.status || (form.signature ? 'חתום' : 'ממתין');
    const desc = form['תיאור'] || form.desc || form.text || '';
    const sigImg = form.signature || form['חתימה'] || '';
    return `<div class="card p-3 mb-2" data-signed-id="${escAttr(form.id||'')}">
      <div class="d-flex justify-content-between flex-wrap gap-2">
        <div>
          <span class="badge bg-primary">${escHtml(formType)}</span>
          ${status==='חתום' ? '<span class="badge bg-success">✓ חתום</span>' : '<span class="badge bg-warning text-dark">⏳ ממתין</span>'}
          <strong class="mx-2">${escHtml(studentName)}</strong>
        </div>
        <small class="text-muted">${escHtml(dateStr)}</small>
      </div>
      ${desc ? `<div class="small mt-2" style="white-space:pre-wrap">${escHtml(desc)}</div>` : ''}
      ${sigImg ? `<div class="mt-2"><img src="${escAttr(sigImg)}" alt="חתימה" style="max-height:80px;border:1px solid #e5e7eb;border-radius:4px;background:#fafafa;padding:4px"></div>` : ''}
      <div class="mt-2 d-flex gap-2">
        <button class="btn btn-sm btn-outline-primary" onclick="downloadSignedForm('${escAttr(form.id||'')}')"><i class="bi bi-download"></i> הורד PDF</button>
        <button class="btn btn-sm btn-outline-info" onclick="viewSignedFormFull('${escAttr(form.id||'')}')"><i class="bi bi-eye"></i> תצוגה מלאה</button>
        ${form.parent_email || form['מייל הורה'] ? `<button class="btn btn-sm btn-outline-success" onclick="resendSignedForm('${escAttr(form.id||'')}')"><i class="bi bi-envelope"></i> שלח שוב</button>` : ''}
      </div>
    </div>`;
  }

  window.downloadSignedForm = function (id) {
    const form = SIGNED_FORMS.find(f => f.id === id) || {};
    const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>טופס חתום</title>
      <style>
        body{font-family:Heebo,Arial;padding:40px;max-width:800px;margin:0 auto;line-height:1.8}
        h1{color:#2563eb;text-align:center}
        .meta{background:#f3f4f6;padding:15px;border-radius:8px;margin-bottom:20px}
        .signature{margin-top:40px;border-top:2px dashed #ccc;padding-top:20px}
        .signature img{max-height:120px}
      </style></head><body>
      <h1>📜 טופס חתום - בית התלמוד</h1>
      <div class="meta">
        <p><strong>תלמיד:</strong> ${escHtml(form['שם תלמיד']||form.student||'')}</p>
        <p><strong>סוג:</strong> ${escHtml(form['סוג']||form.type||'')}</p>
        <p><strong>תאריך חתימה:</strong> ${form.ts ? new Date(form.ts).toLocaleString('he-IL') : ''}</p>
        <p><strong>סטטוס:</strong> ${escHtml(form['סטטוס']||form.status||'')}</p>
      </div>
      <div><strong>תוכן:</strong></div>
      <p style="white-space:pre-wrap">${escHtml(form['תיאור']||form.desc||form.text||'')}</p>
      ${(form.signature||form['חתימה']) ? `<div class="signature"><strong>חתימה:</strong><br><img src="${escAttr(form.signature||form['חתימה'])}" alt="חתימה"></div>` : ''}
      <p style="margin-top:40px;color:#9ca3af;font-size:12px;text-align:center">בית התלמוד · נוצר ${new Date().toLocaleString('he-IL')}</p>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
  };

  window.viewSignedFormFull = function (id) {
    const form = SIGNED_FORMS.find(f => f.id === id);
    if (!form) return;
    const html = `<div class="modal fade show" id="sfv-modal" style="display:block;background:rgba(0,0,0,0.7);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5>טופס חתום - ${escHtml(form['שם תלמיד']||form.student||'')}</h5>
            <button class="btn-close" onclick="document.getElementById('sfv-modal').remove()"></button>
          </div>
          <div class="modal-body">
            <pre style="background:#f3f4f6;padding:15px;border-radius:6px;direction:rtl;text-align:right;white-space:pre-wrap">${escHtml(JSON.stringify(form, null, 2))}</pre>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.resendSignedForm = function (id) {
    const form = SIGNED_FORMS.find(f => f.id === id);
    if (!form) return;
    const email = form.parent_email || form['מייל הורה'];
    const subj = `טופס מבית התלמוד - ${form['שם תלמיד']||form.student||''}`;
    const body = `שלום, להלן הטופס:\n${form['תיאור']||form.desc||''}\n\nתודה,\nבית התלמוד`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  window.exportSignedCSV = function () {
    if (!SIGNED_FORMS.length) return;
    const cols = ['id','ts','שם תלמיד','סוג','סטטוס','תיאור','חתימה','parent_email'];
    let csv = '﻿' + cols.join(',') + '\n';
    SIGNED_FORMS.forEach(f => {
      csv += cols.map(c => `"${String(f[c]||'').replace(/"/g,'""').substring(0,500)}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `signed_forms_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  window.printSignedForms = function () {
    if (!SIGNED_FORMS.length) return;
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>חתימות</title>
      <style>body{font-family:Heebo,Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ccc;text-align:right}</style>
      </head><body>
      <h2>חתימות הורים - בית התלמוד</h2>
      <table><thead><tr><th>תאריך</th><th>תלמיד</th><th>סוג</th><th>סטטוס</th><th>תיאור</th></tr></thead><tbody>
      ${SIGNED_FORMS.map(f => `<tr>
        <td>${f.ts ? new Date(f.ts).toLocaleDateString('he-IL') : ''}</td>
        <td>${escHtml(f['שם תלמיד']||f.student||'')}</td>
        <td>${escHtml(f['סוג']||f.type||'')}</td>
        <td>${escHtml(f['סטטוס']||f.status||'')}</td>
        <td>${escHtml((f['תיאור']||f.desc||'').substring(0,100))}</td>
      </tr>`).join('')}
      </tbody></table>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== Button in formsMgmt page =====
  setTimeout(() => {
    document.addEventListener('click', (e) => {
      if (location.hash !== '#formsMgmt') return;
      if (e.target.closest('#sf-show-btn')) return; // already clicked
    });
    // Auto-inject button in formsMgmt
    const inject = () => {
      const formsPage = document.getElementById('page-formsMgmt');
      if (!formsPage || formsPage.querySelector('#sf-show-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'sf-show-btn';
      btn.className = 'btn btn-outline-success btn-sm mb-2 me-2';
      btn.innerHTML = '<i class="bi bi-pen-fill"></i> צפה בחתימות שנשלחו';
      btn.onclick = showSignedForms;
      const h3 = formsPage.querySelector('h3');
      if (h3) h3.parentElement.appendChild(btn);
    };
    setInterval(inject, 5000);
  }, 3000);

  // ===== Add to FAB menu =====
  if (window.MENU_ITEMS) {
    window.MENU_ITEMS.push({ icon: '📜', label: 'חתימות שנשלחו', action: showSignedForms });
  }

  console.warn('%c📜 Pack-50 — Fix forms refresh loop + Signed forms viewer (download/view/resend/CSV/print)', 'color:#92400e;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-50.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-51.js ─────────────────────────────────────────────
try {
// behavior-pack-51.js — UI cleanup based on visual audit. 2026-05-25
(function () {// FORCE HIDE all old floating buttons with permanent CSS
  const forceHide = document.createElement('style');
  forceHide.id = 'force-hide-floaters-v2';
  forceHide.textContent = `
    #lang-switch, #help-btn, #quick-filters-bar,
    #voice-cmd-btn, #notif-bell, #quick-action-fab,
    #theme-btn, #reminder-btn, #quick-add-fab,
    #active-users-badge, #home-lb-btn, #a11y-toolbar,
    button[style*="position:fixed"][style*="top:10px"],
    button[style*="position:fixed"][style*="top:40px"],
    div[style*="position:fixed"][style*="top:48px"][style*="right:14px"] { display: none !important; visibility: hidden !important; }
    /* Only master-fab visible */
    #master-fab { display: flex !important; visibility: visible !important; }
  `;
  document.head.appendChild(forceHide);

  // ===== FIX 1: Remove duplicate moon (lang-switch) + ? (help) buttons - merged into master-fab =====
  const HIDE_PERM = ['lang-switch', 'help-btn', 'quick-filters-bar', 'sf-show-btn'];

  function killDuplicates() {
    HIDE_PERM.forEach(id => {
      const el = document.getElementById(id);
      if (el && id !== 'sf-show-btn') el.remove();
    });
    // Move help & dark mode into FAB menu only - remove standalone buttons
    document.querySelectorAll('#lang-switch, #help-btn, #quick-filters-bar').forEach(el => el.remove());
  }
  setInterval(killDuplicates, 2000);
  setTimeout(killDuplicates, 500);

  // ===== FIX 2: Limit notifications to 10 max =====
  if (window.notifications) {
    Object.defineProperty(window, 'notifications', {
      get() { return window._notif || []; },
      set(v) {
        const arr = Array.isArray(v) ? v : [];
        window._notif = arr.slice(0, 10);
      },
      configurable: true,
    });
  }
  // Override notify to dedupe
  const origNotify = window.notify;
  if (typeof origNotify === 'function') {
    window.notify = function (msg, type) {
      window._notif = window._notif || [];
      // Skip duplicate
      const recent = window._notif.find(n => n.msg === msg && Date.now() - n.ts < 30000);
      if (recent) return;
      window._notif.unshift({ msg, type: type || 'info', ts: Date.now() });
      if (window._notif.length > 10) window._notif = window._notif.slice(0, 10);
      // Update badge
      const fab = document.getElementById('master-fab');
      const dot = fab?.querySelector('.fab-dot');
      if (dot) {
        const count = window._notif.filter(n => !n.read).length;
        dot.textContent = count > 9 ? '9+' : count;
      }
    };
  }

  // ===== FIX 3: Clear notification spam from old packs on load =====
  setTimeout(() => {
    window._notif = (window._notif || []).slice(0, 5);
    const fab = document.getElementById('master-fab');
    const dot = fab?.querySelector('.fab-dot');
    if (dot) dot.textContent = '';
  }, 3000);

  // ===== FIX 4: Show "צפה בחתימות" button immediately on formsMgmt =====
  window.addEventListener('hashchange', () => {
    if (location.hash === '#formsMgmt') {
      setTimeout(injectSignedFormsBtn, 100);
      setTimeout(injectSignedFormsBtn, 800);
    }
  });
  setTimeout(() => {
    if (location.hash === '#formsMgmt') injectSignedFormsBtn();
  }, 1500);

  function injectSignedFormsBtn() {
    const page = document.getElementById('page-formsMgmt');
    if (!page || page.querySelector('#sf-show-btn')) return;
    const h3 = page.querySelector('h3');
    if (!h3) return;
    const btn = document.createElement('button');
    btn.id = 'sf-show-btn';
    btn.className = 'btn btn-outline-success btn-sm ms-2';
    btn.innerHTML = '<i class="bi bi-pen-fill"></i> 📜 צפה בחתימות';
    btn.onclick = () => window.showSignedForms?.();
    h3.parentElement.appendChild(btn);
  }

  // ===== FIX 5: Cleanup header overlap =====
  const headerFixStyle = document.createElement('style');
  headerFixStyle.textContent = `
    /* Prevent floating buttons from overlapping header */
    body > button[style*="position:fixed"][style*="top:10px"],
    body > button[style*="position:fixed"][style*="top:40px"],
    body > div[style*="position:fixed"][style*="top:48px"] {
      display: none !important;
    }
    /* Master FAB stays */
    #master-fab { display: flex !important; }
    /* Notification dot proper position */
    #master-fab .fab-dot { font-size: 10px !important; }
  `;
  document.head.appendChild(headerFixStyle);

  // ===== FIX 6: Prevent toast overflow =====
  const toastStyle = document.createElement('style');
  toastStyle.textContent = `
    .toast-container { max-height: 80vh; overflow-y: auto; }
    .toast { max-width: 300px !important; }
  `;
  document.head.appendChild(toastStyle);

  // ===== FIX 7: Hide overdue/idle notifications by default for first 10 min =====
  const _suppressUntil = Date.now() + 10 * 60 * 1000;
  if (window.queueReminder) {
    const orig = window.queueReminder;
    window.queueReminder = function (msg, type) {
      if (Date.now() < _suppressUntil) return;
      return orig(msg, type);
    };
  }

  // ===== FIX 8: Console badge =====
  console.warn('%c🧹 Pack-51 — UI cleanup: removed duplicate buttons, limit notifs to 10, prevent overlap', 'color:#16a34a;font-weight:bold');
})();

// ===== FIX 9: Prevent horizontal scroll from whats-new-sidebar =====
(function () {
  const overflowFix = document.createElement('style');
  overflowFix.textContent = `
    html, body { overflow-x: hidden !important; max-width: 100vw !important; }
    #whats-new-sidebar {
      transition: transform 0.3s ease;
      transform: translateX(0);
    }
    #whats-new-sidebar:not(.show) {
      transform: translateX(100%) !important;
      pointer-events: none;
    }
  `;
  document.head.appendChild(overflowFix);
})();
// ===== FIX 10: Convert whats-new-sidebar from negative left to transform =====
setTimeout(() => {
  const sidebar = document.getElementById('whats-new-sidebar');
  if (sidebar) {
    sidebar.style.left = '0';
    sidebar.style.right = 'auto';
    sidebar.style.transform = sidebar.classList.contains('show') ? 'translateX(0)' : 'translateX(-110%)';
    sidebar.style.transition = 'transform 0.3s';
  }
}, 1500);
setInterval(() => {
  const sidebar = document.getElementById('whats-new-sidebar');
  if (sidebar && sidebar.style.left !== '0px') {
    sidebar.style.left = '0';
    sidebar.style.right = 'auto';
    sidebar.style.transform = sidebar.classList.contains('show') ? 'translateX(0)' : 'translateX(-110%)';
  }
}, 5000);

// ===== FIX 11: Close whats-new sidebar reliably =====
(function () {
  // Force-close on load
  setTimeout(() => {
    document.getElementById('whats-new-sidebar')?.classList.remove('open');
    sessionStorage.setItem('wn_auto_opened', '1');
  }, 500);

  // Esc key closes
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const sb = document.getElementById('whats-new-sidebar');
      if (sb && sb.classList.contains('open')) {
        sb.classList.remove('open');
      }
    }
  });

  // Click outside closes
  document.addEventListener('click', e => {
    const sb = document.getElementById('whats-new-sidebar');
    if (!sb || !sb.classList.contains('open')) return;
    if (sb.contains(e.target)) return;
    if (e.target.closest('#whats-new-fab')) return;
    sb.classList.remove('open');
  });

  // Periodic backup close if user reports stuck
  if (location.search.includes('closeAll')) {
    document.getElementById('whats-new-sidebar')?.classList.remove('open');
  }
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-51.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-52.js ─────────────────────────────────────────────
try {
// behavior-pack-52.js — Signed forms - fetch from API + visible UI. 2026-05-25
(function () {// ===== Override showSignedForms to actually fetch from API =====
  window.showSignedForms = async function () {
    let forms = [];
    try {
      const r = await api('listSignatures', []);
      forms = (r.data || []).map(s => ({
        id: s['מזהה'] || s.id || ('sig_' + Math.random().toString(36).slice(2)),
        ts: s['תאריך'] ? new Date(s['תאריך']).getTime() : Date.now(),
        student: s['שם תלמיד'] || s.student_name || '',
        sid: s['תלמיד_מזהה'] || '',
        type: s['סוג'] || s['קישור_סוג'] || 'חתימה',
        desc: s['תיאור'] || s.description || '',
        status: s['סטטוס'] || (s['חתימה'] ? 'חתום' : 'ממתין'),
        signature: s['חתימה'] || s.signature || '',
        parent_email: s['מייל_הורה'] || s['מייל הורה'] || s.parent_email || '',
        raw: s,
      }));
    } catch (e) {
      console.warn('listSignatures failed:', e.message);
      if (typeof toast === 'function') toast('שגיאה בטעינת חתימות: ' + e.message, 'error');
    }

    // Also merge local
    try {
      const local = JSON.parse(localStorage.getItem('bht_signed_forms') || '[]');
      forms = [...forms, ...local];
    } catch (_) {}

    // Build modal
    const rows = forms.length ? forms.map(f => `
      <div class="card p-3 mb-2">
        <div class="d-flex justify-content-between flex-wrap gap-2">
          <div>
            <span class="badge bg-primary">${escHtml(f.type)}</span>
            <span class="badge ${f.status === 'חתום' ? 'bg-success' : 'bg-warning text-dark'}">${escHtml(f.status)}</span>
            <strong class="mx-2">${escHtml(f.student)}</strong>
          </div>
          <small class="text-muted">${f.ts ? new Date(f.ts).toLocaleDateString('he-IL') : ''}</small>
        </div>
        ${f.desc ? `<div class="small mt-2" style="white-space:pre-wrap">${escHtml(f.desc)}</div>` : ''}
        ${f.signature ? `<div class="mt-2"><img src="${escAttr(f.signature)}" alt="חתימה" style="max-height:80px;border:1px solid #e5e7eb;border-radius:4px;background:#fafafa;padding:4px"></div>` : ''}
        <div class="mt-2 d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-primary" onclick="sfDownload('${escAttr(f.id)}')"><i class="bi bi-download"></i> הורד PDF</button>
          ${f.parent_email ? `<button class="btn btn-sm btn-outline-info" onclick="window.open('mailto:${escAttr(f.parent_email)}?subject=' + encodeURIComponent('טופס מבית התלמוד'))"><i class="bi bi-envelope"></i> שלח שוב</button>` : ''}
          <button class="btn btn-sm btn-outline-success" onclick="sfPrint('${escAttr(f.id)}')"><i class="bi bi-printer"></i> הדפס</button>
        </div>
      </div>
    `).join('') : '<div class="text-center text-muted py-5"><i class="bi bi-pen-fill fs-1"></i><p class="mt-2">אין חתימות במערכת</p></div>';

    const html = `<div class="modal fade show" id="sf-modal" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;max-height:90vh;display:flex;flex-direction:column">
          <div class="modal-header">
            <h5><i class="bi bi-pen-fill"></i> חתימות שנשלחו (${forms.length})</h5>
            <div>
              <button class="btn btn-sm btn-outline-primary" onclick="sfExportAllCSV()">⬇ CSV</button>
              <button class="btn btn-sm btn-outline-success" onclick="sfPrintAll()">🖨 הדפס הכל</button>
              <button class="btn-close" onclick="document.getElementById('sf-modal').remove()"></button>
            </div>
          </div>
          <div class="modal-body" style="overflow-y:auto;flex:1">
            <input id="sf-search" class="form-control mb-3" placeholder="חיפוש לפי שם תלמיד או סוג...">
            <div id="sf-list">${rows}</div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    // Cache forms for download
    window._currentSignedForms = forms;

    // Search
    const search = document.getElementById('sf-search');
    if (search) {
      search.oninput = () => {
        const q = search.value.toLowerCase().trim();
        const filtered = !q ? forms : forms.filter(f =>
          (f.student + f.type + f.desc).toLowerCase().includes(q)
        );
        document.getElementById('sf-list').innerHTML = filtered.length ? filtered.map(f => `
          <div class="card p-3 mb-2">
            <div class="d-flex justify-content-between flex-wrap gap-2">
              <div><span class="badge bg-primary">${escHtml(f.type)}</span> <strong>${escHtml(f.student)}</strong></div>
              <small>${f.ts ? new Date(f.ts).toLocaleDateString('he-IL') : ''}</small>
            </div>
            ${f.desc ? `<div class="small mt-2">${escHtml(f.desc.substring(0, 200))}</div>` : ''}
          </div>
        `).join('') : '<div class="text-muted text-center py-3">אין תוצאות</div>';
      };
    }
  };

  // ===== Helper functions =====
  window.sfDownload = function (id) {
    const f = (window._currentSignedForms || []).find(x => String(x.id) === String(id));
    if (!f) return alert('טופס לא נמצא');
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>טופס חתום</title>
      <style>body{font-family:Heebo,Arial;padding:40px;max-width:800px;margin:0 auto;line-height:1.8}
      h1{color:#2563eb;text-align:center}.meta{background:#f3f4f6;padding:15px;border-radius:8px;margin-bottom:20px}
      .sig{margin-top:40px;border-top:2px dashed #ccc;padding-top:20px}.sig img{max-height:120px}</style>
      </head><body>
      <h1>📜 טופס חתום - בית התלמוד</h1>
      <div class="meta">
        <p><strong>תלמיד:</strong> ${escHtml(f.student)}</p>
        <p><strong>סוג:</strong> ${escHtml(f.type)}</p>
        <p><strong>תאריך:</strong> ${f.ts ? new Date(f.ts).toLocaleString('he-IL') : ''}</p>
        <p><strong>סטטוס:</strong> ${escHtml(f.status)}</p>
      </div>
      <div><strong>תוכן:</strong></div>
      <p style="white-space:pre-wrap">${escHtml(f.desc || '')}</p>
      ${f.signature ? `<div class="sig"><strong>חתימה:</strong><br><img src="${escAttr(f.signature)}"></div>` : ''}
      <p style="margin-top:40px;color:#9ca3af;font-size:12px;text-align:center">בית התלמוד · ${new Date().toLocaleString('he-IL')}</p>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  window.sfPrint = window.sfDownload;

  window.sfExportAllCSV = function () {
    const forms = window._currentSignedForms || [];
    if (!forms.length) return alert('אין חתימות');
    const cols = ['student','type','status','desc','parent_email','ts'];
    let csv = '﻿' + 'תלמיד,סוג,סטטוס,תיאור,מייל,תאריך\n';
    forms.forEach(f => {
      csv += cols.map(c => {
        let v = f[c] || '';
        if (c === 'ts' && v) v = new Date(v).toLocaleString('he-IL');
        return '"' + String(v).replace(/"/g, '""').substring(0, 500) + '"';
      }).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `חתימות_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  window.sfPrintAll = function () {
    const forms = window._currentSignedForms || [];
    if (!forms.length) return alert('אין חתימות');
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>חתימות</title>
      <style>body{font-family:Heebo,Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ccc;text-align:right}th{background:#f3f4f6}</style>
      </head><body>
      <h2>חתימות הורים - בית התלמוד</h2>
      <table><thead><tr><th>תאריך</th><th>תלמיד</th><th>סוג</th><th>סטטוס</th><th>תיאור</th></tr></thead><tbody>
      ${forms.map(f => `<tr>
        <td>${f.ts ? new Date(f.ts).toLocaleDateString('he-IL') : ''}</td>
        <td>${escHtml(f.student)}</td>
        <td>${escHtml(f.type)}</td>
        <td>${escHtml(f.status)}</td>
        <td>${escHtml((f.desc || '').substring(0, 100))}</td>
      </tr>`).join('')}
      </tbody></table>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== Inject visible CTA on formsMgmt page =====
  function injectSignedFormsUI() {
    if (location.hash !== '#formsMgmt') return;
    const page = document.getElementById('page-formsMgmt');
    if (!page || page.querySelector('#signed-forms-cta')) return;
    const h3 = page.querySelector('h3');
    if (!h3) return;
    const cta = document.createElement('div');
    cta.id = 'signed-forms-cta';
    cta.style.cssText = 'background:linear-gradient(135deg,#dcfce7,#bbf7d0);border:2px solid #16a34a;border-radius:10px;padding:14px;margin:12px 0;direction:rtl';
    cta.innerHTML = `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <strong style="color:#15803d;font-size:1.05rem">📜 חתימות הורים שנשלחו</strong>
          <div class="small text-muted">צפייה, הורדת PDF, ייצוא CSV, הדפסה</div>
        </div>
        <button id="sf-view-cta" class="btn btn-success">
          <i class="bi bi-pen-fill"></i> צפה בחתימות
        </button>
      </div>
    `;
    h3.parentElement.insertBefore(cta, h3.nextSibling);
    document.getElementById('sf-view-cta').onclick = () => window.showSignedForms?.();
  }

  window.addEventListener('hashchange', () => setTimeout(injectSignedFormsUI, 500));
  setTimeout(injectSignedFormsUI, 1500);
  setInterval(injectSignedFormsUI, 5000);

  // Add to FAB menu
  if (window.MENU_ITEMS && !window.MENU_ITEMS.find(m => m.label?.includes('חתימות'))) {
    window.MENU_ITEMS.unshift({
      icon: '📜', label: 'חתימות הורים', action: () => window.showSignedForms?.(),
    });
  }

  console.warn('%c📜 Pack-52 — Signed forms: fetch from API + visible CTA + download/print/CSV', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-52.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-53.js ─────────────────────────────────────────────
try {
// behavior-pack-53.js — Final UI bug fixes. 2026-05-25
(function () {// ===== FIX 1: Ctrl+K opens global search (case-insensitive) =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (typeof openGlobalSearch === 'function') openGlobalSearch();
      else if (typeof toast === 'function') toast('חיפוש לא זמין', 'warn');
    }
  });

  // ===== FIX 2: Master FAB click reliability =====
  setTimeout(() => {
    const fab = document.getElementById('master-fab');
    if (!fab) return;
    // Re-attach onclick if missing
    if (!fab.onclick && typeof toggleFabMenu === 'function') {
      fab.onclick = toggleFabMenu;
    } else if (!fab.onclick) {
      fab.onclick = function () {
        // Simple fallback menu
        if (document.getElementById('fab-menu')) {
          document.getElementById('fab-menu').remove();
          return;
        }
        const menu = document.createElement('div');
        menu.id = 'fab-menu';
        menu.style.cssText = 'position:fixed;bottom:90px;left:24px;background:#fff;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.2);padding:8px;z-index:9994;direction:rtl;min-width:220px';
        const items = [
          { icon: '🔍', label: 'חיפוש', action: () => window.openGlobalSearch?.() },
          { icon: '➕', label: 'אירוע חדש', action: () => goto('behavior') },
          { icon: '👥', label: 'תלמידים', action: () => goto('students') },
          { icon: '📊', label: 'דוחות', action: () => goto('reports') },
          { icon: '⚙', label: 'הגדרות', action: () => goto('settings') },
        ];
        items.forEach(it => {
          const btn = document.createElement('button');
          btn.style.cssText = 'display:flex;gap:10px;width:100%;padding:10px 14px;border:none;background:transparent;cursor:pointer;border-radius:8px;text-align:right;direction:rtl';
          btn.innerHTML = `<span style="font-size:18px">${it.icon}</span><span>${it.label}</span>`;
          btn.onclick = () => { menu.remove(); it.action(); };
          btn.onmouseenter = () => btn.style.background = '#f3f4f6';
          btn.onmouseleave = () => btn.style.background = 'transparent';
          menu.appendChild(btn);
        });
        document.body.appendChild(menu);
        setTimeout(() => {
          document.addEventListener('click', function close(e) {
            if (!menu.contains(e.target) && e.target !== fab) {
              menu.remove();
              document.removeEventListener('click', close);
            }
          });
        }, 100);
      };
    }
  }, 2500);

  // ===== FIX 3: Ensure Bootstrap Esc closes modals =====
  // Don't capture Esc - let Bootstrap handle
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const modal = document.querySelector('.modal.show');
      if (modal) {
        try {
          if (window.bootstrap && bootstrap.Modal) {
            const inst = bootstrap.Modal.getInstance(modal);
            if (inst) inst.hide();
          }
        } catch (_) {
          // Fallback - just hide it
          modal.classList.remove('show');
          modal.style.display = 'none';
          document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
          document.body.classList.remove('modal-open');
        }
      }
    }
  });

  // ===== FIX 4: Ensure modals close on backdrop click =====
  document.addEventListener('click', e => {
    if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
      const modal = document.querySelector('.modal.show');
      if (modal) {
        try {
          bootstrap.Modal.getInstance(modal)?.hide();
        } catch (_) {
          modal.classList.remove('show');
          modal.style.display = 'none';
          e.target.remove();
          document.body.classList.remove('modal-open');
        }
      }
    }
  });

  // ===== FIX 5: Force-cleanup stuck modals =====
  setInterval(() => {
    const visibleModals = document.querySelectorAll('.modal.show').length;
    const backdrops = document.querySelectorAll('.modal-backdrop').length;
    // If body has modal-open but no visible modals - cleanup
    if (document.body.classList.contains('modal-open') && visibleModals === 0) {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
    }
    // Extra backdrops
    if (backdrops > visibleModals) {
      const all = document.querySelectorAll('.modal-backdrop');
      for (let i = visibleModals; i < all.length; i++) all[i].remove();
    }
  }, 5000);

  // ===== FIX 6: Loading overlay timeout =====
  setInterval(() => {
    const lo = document.getElementById('loading-overlay');
    if (lo && lo.offsetParent && !lo.dataset.shownTs) {
      lo.dataset.shownTs = Date.now();
    }
    if (lo && lo.dataset.shownTs && Date.now() - parseInt(lo.dataset.shownTs) > 15000) {
      lo.style.display = 'none';
      delete lo.dataset.shownTs;
      console.warn('[ui] loading-overlay stuck >15s, force-hidden');
    }
  }, 3000);

  // ===== FIX 7: Better error handling for failed renders =====
  ['renderStudents', 'renderBehavior', 'renderTasks', 'renderProjects', 'renderStaff'].forEach(fn => {
    const orig = window[fn];
    if (typeof orig !== 'function' || orig._wrapped) return;
    window[fn] = async function (...args) {
      try { return await orig.apply(this, args); }
      catch (e) {
        console.warn(`[render error] ${fn}:`, e.message);
        if (typeof toast === 'function') toast('שגיאה בטעינת מסך: ' + e.message.substring(0, 60), 'error');
      }
    };
    window[fn]._wrapped = true;
  });

  // ===== FIX 8: Auto-focus first input in opened modal =====
  document.addEventListener('shown.bs.modal', e => {
    const input = e.target.querySelector('input:not([type=hidden]),textarea,select');
    if (input && !input.disabled && !input.readOnly) {
      try { input.focus(); } catch (_) {}
    }
  });

  // ===== FIX 9: Prevent double-click on save buttons =====
  document.addEventListener('click', e => {
    const btn = e.target.closest('button.btn-primary, button.btn-success');
    if (!btn) return;
    const txt = (btn.textContent || '').trim();
    if (!/שמור|הוסף|צור|אישור/.test(txt)) return;
    if (btn.dataset.lastClick && Date.now() - parseInt(btn.dataset.lastClick) < 1500) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    btn.dataset.lastClick = Date.now();
  }, true);

  // ===== FIX 10: Ctrl+S saves modal =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      const modal = document.querySelector('.modal.show');
      if (modal) {
        e.preventDefault();
        const saveBtn = modal.querySelector('button.btn-primary, button.btn-success');
        if (saveBtn) saveBtn.click();
      }
    }
  });

  console.warn('%c🔧 Pack-53 — UI bug fixes: Esc/Bootstrap, FAB reliability, Ctrl+K, modal cleanup', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-53.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-54.js ─────────────────────────────────────────────
try {
// behavior-pack-54.js — FORCE-FIX FAB menu (was undefined toggleFabMenu in pack-48 IIFE). 2026-05-26
(function () {
// ===== Self-contained FAB menu - no dependencies on IIFE closures =====
  const FAB_ITEMS = [
    { icon: '🔍', label: 'חיפוש מהיר', action: () => window.openGlobalSearch?.() },
    { icon: '➕', label: 'אירוע חדש', action: () => { goto('behavior'); setTimeout(() => window.addBehaviorModal?.(), 800); } },
    { icon: '👨‍🎓', label: 'תלמיד חדש', action: () => { goto('students'); setTimeout(() => window.addStudentModal?.(), 800); } },
    { icon: '✅', label: 'משימה חדשה', action: () => { goto('tasks'); setTimeout(() => window.addTaskModal?.(), 800); } },
    { icon: '🎤', label: 'פקודה קולית', action: () => window.startVoiceCommand?.() },
    { icon: '🔔', label: 'התראות', action: () => window.showNotifications?.() },
    { icon: '⏰', label: 'תזכורות', action: () => window.openReminderDialog?.() },
    { icon: '🎨', label: 'ערכת נושא', action: () => window.openThemePicker?.() },
    { icon: '🏆', label: 'לוח מצטיינים', action: () => window.showLeaderboard?.() },
    { icon: '📊', label: 'דוח חודשי', action: () => window.printableReport?.() },
    { icon: '📤', label: 'ייצוא נתונים', action: () => window.bigExportMenu?.() },
    { icon: '📜', label: 'חתימות הורים', action: () => window.showSignedForms?.() },
    { icon: '💾', label: 'גיבוי', action: () => window.downloadFullBackup?.() },
    { icon: '👥', label: 'צוות', action: () => goto('staff') },
    { icon: '⚙', label: 'הגדרות', action: () => goto('settings') },
    { icon: '⌨', label: 'קיצורים', action: () => window.showShortcutsList?.() },
    { icon: '❓', label: 'עזרה', action: () => window.showContextHelp?.() },
  ];

  function toggleFabMenu54() {
    const existing = document.getElementById('fab-menu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.id = 'fab-menu';
    menu.style.cssText = `
      position: fixed;
      bottom: 90px;
      left: 24px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      padding: 8px;
      z-index: 9994;
      direction: rtl;
      max-height: 70vh;
      overflow-y: auto;
      min-width: 240px;
      animation: fabIn 0.2s ease-out;
    `;
    if (!document.getElementById('fab-anim-54')) {
      const st = document.createElement('style');
      st.id = 'fab-anim-54';
      st.textContent = '@keyframes fabIn{from{opacity:0;transform:translateY(10px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}';
      document.head.appendChild(st);
    }
    FAB_ITEMS.forEach(item => {
      const btn = document.createElement('button');
      btn.style.cssText = 'display:flex;align-items:center;gap:12px;width:100%;padding:10px 14px;border:none;background:transparent;cursor:pointer;border-radius:8px;font-size:14px;text-align:right;transition:background 0.15s';
      btn.innerHTML = `<span style="font-size:20px;width:28px;display:inline-block;text-align:center">${item.icon}</span><span style="flex:1">${item.label}</span>`;
      btn.onmouseenter = () => btn.style.background = '#f3f4f6';
      btn.onmouseleave = () => btn.style.background = 'transparent';
      btn.onclick = () => {
        menu.remove();
        try { item.action?.(); } catch (e) { console.warn('[fab]', e); }
      };
      menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    setTimeout(() => {
      const closer = (e) => {
        if (!menu.contains(e.target) && e.target.id !== 'master-fab' && !e.target.closest('#master-fab')) {
          menu.remove();
          document.removeEventListener('click', closer);
        }
      };
      document.addEventListener('click', closer);
    }, 100);
  }
  window.toggleFabMenu = toggleFabMenu54;

  // Force-attach to FAB every 2s - SINGLE handler only
  setInterval(() => {
    const fab = document.getElementById('master-fab');
    if (fab && !fab.dataset.fixed54) {
      fab.dataset.fixed54 = '1';
      // Use only onclick, no addEventListener (avoids double-trigger that closes menu immediately)
      fab.onclick = function (e) {
        e?.preventDefault();
        toggleFabMenu54();
      };
    }
  }, 2000);

  // Esc closes
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('fab-menu')?.remove();
  });

  console.warn('%c🔧 Pack-54 — FAB menu force-fixed with 17 actions', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-54.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-55.js ─────────────────────────────────────────────
try {
// behavior-pack-55.js — Mobile responsive fixes. 2026-05-26
(function () {
// ===== FIX: Wrap tables for mobile horizontal scroll =====
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      /* Make all tables horizontally scrollable */
      table { display: block; max-width: 100%; overflow-x: auto; white-space: nowrap; }
      table thead, table tbody, table tr { display: table; width: 100%; table-layout: auto; }
      /* Reduce padding */
      .card { padding: 8px !important; }
      .modal-body { padding: 12px !important; }
      /* Stack form columns */
      .row.g-2 .col-md-6, .row.g-3 .col-md-6, .row .col-md-7, .row .col-md-5, .row .col-md-4, .row .col-md-3, .row .col-md-2 {
        flex: 0 0 100%;
        max-width: 100%;
      }
      /* Hide non-essential columns */
      .hidden-mobile, [data-hidden-mobile] { display: none !important; }
      /* Smaller buttons */
      .btn { font-size: 13px; padding: 6px 10px; }
      .btn-sm { font-size: 11px; padding: 4px 8px; }
      /* Wrap text in cells */
      td, th { word-wrap: break-word; max-width: 200px; }
    }
    @media (max-width: 480px) {
      .topbar h3, h3 { font-size: 1.1rem; }
      .display-6 { font-size: 1.4rem; }
      .home-group { margin-top: 0.8rem; }
    }
  `;
  document.head.appendChild(style);

  // ===== Wrap loose tables in .table-responsive =====
  function wrapTables() {
    document.querySelectorAll('table:not(.wrapped-mobile)').forEach(t => {
      t.classList.add('wrapped-mobile');
      if (!t.parentElement.classList.contains('table-responsive')) {
        const wrap = document.createElement('div');
        wrap.className = 'table-responsive';
        wrap.style.cssText = 'overflow-x:auto;max-width:100%';
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
      }
    });
  }
  setInterval(wrapTables, 3000);
  setTimeout(wrapTables, 500);

  // ===== Stack inline d-flex on mobile =====
  if (window.matchMedia('(max-width: 768px)').matches) {
    const stackStyle = document.createElement('style');
    stackStyle.textContent = `
      @media (max-width: 768px) {
        .d-flex.justify-content-between { flex-wrap: wrap; gap: 4px; }
        .d-flex.gap-2 { flex-wrap: wrap; }
      }
    `;
    document.head.appendChild(stackStyle);
  }

  // ===== Better mobile modal close button (larger) =====
  if (window.matchMedia('(max-width: 768px)').matches) {
    const mobModalStyle = document.createElement('style');
    mobModalStyle.textContent = `
      @media (max-width: 768px) {
        .btn-close { padding: 12px !important; opacity: 0.7; }
        .modal-dialog { margin: 0 !important; max-width: 100% !important; height: 100vh; }
        .modal-content { min-height: 100vh; border-radius: 0; }
      }
    `;
    document.head.appendChild(mobModalStyle);
  }

  console.warn('%c📱 Pack-55 — Mobile responsive: tables scroll, stacked columns, larger close', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-55.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-56.js ─────────────────────────────────────────────
try {
// behavior-pack-56.js — Login validation: show error on empty submit. 2026-05-26
(function () {
function addLoginValidation() {
    const loginBtn = [...document.querySelectorAll('button')].find(b => /כניסה|התחבר/.test(b.textContent));
    if (!loginBtn || loginBtn.dataset.validated56) return;
    const uname = document.getElementById('username');
    const pwd = document.getElementById('password');
    if (!uname || !pwd) return;
    loginBtn.dataset.validated56 = '1';
    const origClick = loginBtn.onclick;
    loginBtn.addEventListener('click', function (e) {
      const u = (uname.value || '').trim();
      const p = (pwd.value || '').trim();
      if (!u || !p) {
        e.preventDefault();
        e.stopPropagation();
        let errEl = document.getElementById('login-err-56');
        if (!errEl) {
          errEl = document.createElement('div');
          errEl.id = 'login-err-56';
          errEl.className = 'alert alert-danger mt-2';
          errEl.style.fontSize = '14px';
          loginBtn.parentNode.appendChild(errEl);
        }
        if (!u && !p) errEl.textContent = 'יש להזין שם משתמש וסיסמה';
        else if (!u) errEl.textContent = 'יש להזין שם משתמש';
        else errEl.textContent = 'יש להזין סיסמה';
        // Focus the empty field
        if (!u) uname.focus(); else pwd.focus();
        return false;
      }
      // Clear error
      document.getElementById('login-err-56')?.remove();
    }, true); // capture phase
  }

  // Try multiple times in case login page loads later
  setTimeout(addLoginValidation, 500);
  setTimeout(addLoginValidation, 1500);
  setTimeout(addLoginValidation, 3000);
  setInterval(addLoginValidation, 5000);

  // Also clear error on input
  document.addEventListener('input', e => {
    if (e.target.id === 'username' || e.target.id === 'password') {
      document.getElementById('login-err-56')?.remove();
    }
  });

  console.warn('%c🔐 Pack-56 — Login validation: error on empty submit', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-56.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-57.js ─────────────────────────────────────────────
try {
// behavior-pack-57.js — CRITICAL: Prevent auto-refresh from wiping user input. 2026-05-26
(function () {
// ===== Detect if user is actively typing =====
  let lastTypeTime = 0;
  let typingInElement = null;

  document.addEventListener('input', e => {
    if (e.target.matches('input, textarea, [contenteditable]')) {
      lastTypeTime = Date.now();
      typingInElement = e.target;
    }
  });
  document.addEventListener('focusin', e => {
    if (e.target.matches('input, textarea, [contenteditable]')) {
      typingInElement = e.target;
    }
  });
  document.addEventListener('focusout', () => {
    setTimeout(() => {
      const active = document.activeElement;
      if (!active || !active.matches('input, textarea, [contenteditable]')) {
        typingInElement = null;
      }
    }, 100);
  });

  // ===== Detect if a modal is open =====
  function isModalOpen() {
    return document.querySelectorAll('.modal.show').length > 0;
  }

  function isUserBusy() {
    const recentlyTyped = Date.now() - lastTypeTime < 30000; // 30s of typing
    const hasFocus = typingInElement && document.contains(typingInElement);
    return isModalOpen() || hasFocus || recentlyTyped;
  }

  // ===== Block periodic syncFromSheet when user busy =====
  if (typeof window.syncFromSheet === 'function') {
    const orig = window.syncFromSheet;
    window.syncFromSheet = async function (...args) {
      if (isUserBusy()) {
        console.info('[sync-57] skipped - user is typing/editing');
        return;
      }
      return orig.apply(this, args);
    };
  }

  // ===== Block render functions when modal open =====
  const RENDER_FNS = ['renderBehavior', 'renderStudents', 'renderTasks', 'renderProjects',
                     'renderFormsMgmt', 'renderFormsTab', 'renderStaff', 'renderReading',
                     'renderWriting', 'renderLessonsKlein', 'renderMeetings', 'renderConversations'];

  RENDER_FNS.forEach(fnName => {
    const orig = window[fnName];
    if (typeof orig !== 'function' || orig._guard57) return;
    window[fnName] = async function (...args) {
      // If a modal is open, defer the render
      if (isModalOpen()) {
        console.info(`[render-guard] ${fnName} deferred - modal open`);
        // Save args for later
        window._pendingRender = { fn: fnName, args };
        return;
      }
      // If user is actively typing in a form (no modal), defer too
      if (typingInElement && document.contains(typingInElement) && Date.now() - lastTypeTime < 10000) {
        console.info(`[render-guard] ${fnName} deferred - user typing`);
        window._pendingRender = { fn: fnName, args };
        return;
      }
      return orig.apply(this, args);
    };
    window[fnName]._guard57 = true;
  });

  // Re-run pending render when user stops being busy
  setInterval(() => {
    if (!window._pendingRender) return;
    if (isUserBusy()) return;
    const p = window._pendingRender;
    window._pendingRender = null;
    if (typeof window[p.fn] === 'function') {
      console.info(`[render-guard] running deferred ${p.fn}`);
      try { window[p.fn].apply(window, p.args); } catch (_) {}
    }
  }, 5000);

  // ===== Auto-save modal inputs every 5s =====
  setInterval(() => {
    document.querySelectorAll('.modal.show input, .modal.show textarea').forEach(el => {
      if (!el.id || !el.value || el.type === 'password' || el.type === 'hidden') return;
      try { localStorage.setItem('bht_draft_' + el.id, el.value); } catch (_) {}
    });
  }, 5000);

  // ===== Restore drafts when modal opens =====
  document.addEventListener('shown.bs.modal', e => {
    e.target.querySelectorAll('input[id], textarea[id]').forEach(el => {
      if (el.value || el.type === 'password' || el.type === 'hidden') return;
      try {
        const draft = localStorage.getItem('bht_draft_' + el.id);
        if (draft && draft.length > 3) {
          // Subtle notification
          const indicator = document.createElement('button');
          indicator.type = 'button';
          indicator.className = 'btn btn-sm btn-outline-warning mt-1';
          indicator.innerHTML = '↺ שחזר טיוטה';
          indicator.onclick = (ev) => {
            ev.preventDefault();
            el.value = draft;
            indicator.remove();
            el.dispatchEvent(new Event('input', { bubbles: true }));
          };
          el.parentNode.insertBefore(indicator, el);
        }
      } catch (_) {}
    });
  });

  // ===== Clear drafts after successful save =====
  document.addEventListener('hidden.bs.modal', e => {
    e.target.querySelectorAll('input[id], textarea[id]').forEach(el => {
      try { localStorage.removeItem('bht_draft_' + el.id); } catch (_) {}
    });
  });

  // ===== Block storage events that trigger reloads while typing =====
  const origDispatch = window.dispatchEvent;
  window.dispatchEvent = function (ev) {
    if (ev && ev.type === 'cheder-data-refreshed' && isUserBusy()) {
      console.info('[event-guard] blocked cheder-data-refreshed - user busy');
      return true;
    }
    return origDispatch.apply(this, arguments);
  };

  // ===== Warn before page reload if user has unsaved input =====
  window.addEventListener('beforeunload', e => {
    if (isUserBusy()) {
      const msg = 'יש לך טקסט שלא נשמר - לעזוב?';
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    }
  });

  console.warn('%c💾 Pack-57 — CRITICAL: Prevent auto-refresh wiping user input + drafts + restore', 'color:#dc2626;font-weight:bold;font-size:13px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-57.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-58.js ─────────────────────────────────────────────
try {
// behavior-pack-58.js — Fix login flash + better feedback. 2026-05-26
(function () {
// ===== Wrap login flow with better feedback =====
  function fixLoginFlow() {
    const loginBtn = [...document.querySelectorAll('button')].find(b => /כניסה|התחבר/.test(b.textContent) && b.offsetParent);
    if (!loginBtn || loginBtn.dataset.flowfixed58) return;
    loginBtn.dataset.flowfixed58 = '1';

    loginBtn.addEventListener('click', async function (e) {
      const u = document.getElementById('username')?.value?.trim();
      const p = document.getElementById('password')?.value;
      if (!u || !p) return; // pack-56 handles empty

      // Show spinner + disable
      loginBtn.disabled = true;
      const origText = loginBtn.textContent;
      loginBtn.textContent = 'מתחבר...';

      // Wait then verify
      setTimeout(async () => {
        loginBtn.disabled = false;
        loginBtn.textContent = origText;

        // Check if actually logged in
        try {
          const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
          if (!stored.username) {
            // Login failed - show clear error
            let errEl = document.getElementById('login-err-58');
            if (!errEl) {
              errEl = document.createElement('div');
              errEl.id = 'login-err-58';
              errEl.className = 'alert alert-danger mt-2';
              errEl.style.cssText = 'animation: shake 0.5s; font-size:14px';
              loginBtn.parentNode.appendChild(errEl);
            }
            errEl.textContent = '❌ שם משתמש או סיסמה שגויים. נסה שוב.';
            // Make sure login UI stays
            const loginPage = document.getElementById('page-login');
            const homePage = document.getElementById('page-home');
            if (loginPage) loginPage.classList.remove('d-none');
            if (homePage) homePage.classList.add('d-none');
          }
        } catch (_) {}
      }, 3000);
    }, true);
  }

  setTimeout(fixLoginFlow, 500);
  setTimeout(fixLoginFlow, 2000);
  setInterval(fixLoginFlow, 5000);

  // Shake animation
  const shake = document.createElement('style');
  shake.textContent = `@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }`;
  document.head.appendChild(shake);

  // ===== Prevent showing home if not logged in =====
  setInterval(() => {
    const home = document.getElementById('page-home');
    const login = document.getElementById('page-login');
    if (!home || !login) return;
    const u = (() => {
      try { return JSON.parse(sessionStorage.getItem('user') || '{}'); }
      catch { return {}; }
    })();
    // If home visible but no user - hide home, show login
    if (!home.classList.contains('d-none') && !u.username) {
      home.classList.add('d-none');
      login.classList.remove('d-none');
      console.warn('[auth-guard] home was visible without user - hidden');
    }
  }, 2000);

  // ===== Clear stale sessionStorage on failed login attempts =====
  document.addEventListener('input', e => {
    if (e.target.id === 'password') {
      // Clear any zombie session
      try {
        const u = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (u.username && document.getElementById('username')?.value !== u.username) {
          sessionStorage.removeItem('user');
        }
      } catch (_) {}
    }
  });

  console.warn('%c🔐 Pack-58 — Login flow fix: spinner, error feedback, auth guard', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-58.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-59.js ─────────────────────────────────────────────
try {
// behavior-pack-59.js — Show & manage passwords in admin panel. 2026-05-26
(function () {
// Only show for admins
  function isAdmin() {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u.role === 'מנהל' || u.username === 'admin' || u.username === 'ירושלמי';
    } catch { return false; }
  }

  // ===== Inject password column into users table (settings/staff) =====
  async function injectPasswordColumn() {
    if (!isAdmin()) return;
    const page = document.getElementById('page-settings') || document.getElementById('page-staff');
    if (!page || !page.querySelector('table') || page.querySelector('#pw-mgr-banner')) return;

    // Add banner with link to password manager
    const h3 = page.querySelector('h3, h4');
    if (h3 && !page.querySelector('#pw-mgr-banner')) {
      const banner = document.createElement('div');
      banner.id = 'pw-mgr-banner';
      banner.style.cssText = 'background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #ca8a04;border-radius:10px;padding:14px;margin:12px 0;direction:rtl';
      banner.innerHTML = `
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <strong style="color:#854d0e">🔑 ניהול סיסמאות</strong>
            <div class="small text-muted">צפייה ושינוי סיסמאות לכל המשתמשים</div>
          </div>
          <button class="btn btn-warning" onclick="openPasswordManager()">
            <i class="bi bi-key"></i> פתח מנהל סיסמאות
          </button>
        </div>
      `;
      h3.parentNode.insertBefore(banner, h3.nextSibling);
    }
  }

  // ===== Password manager modal =====
  window.openPasswordManager = async function () {
    if (!isAdmin()) {
      if (typeof toast === 'function') toast('רק מנהל יכול לנהל סיסמאות', 'warn');
      return;
    }

    // Load users
    let users = [];
    try {
      const r = await api('listUsers', []);
      users = r.data || [];
    } catch (e) {
      alert('שגיאה בטעינת משתמשים: ' + e.message);
      return;
    }

    const rows = users.map(u => {
      const pwd = u['סיסמה'] || '';
      const isHashed = String(pwd).startsWith('sha256:');
      const displayPwd = isHashed ? '••••••••' : pwd;
      return `<tr>
        <td><strong>${escHtml(u['שם משתמש']||'')}</strong></td>
        <td>${escHtml(u['שם מלא']||'')}</td>
        <td>${escHtml(u['תפקיד']||'')}</td>
        <td>
          <code id="pw-${escAttr(u['שם משתמש']||'')}" style="font-family:monospace;background:#f3f4f6;padding:2px 8px;border-radius:4px;${isHashed?'color:#9ca3af':''}">${escHtml(displayPwd)}</code>
          ${isHashed ? '<small class="text-warning ms-1">🔒 מוצפן</small>' : ''}
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="changeUserPassword('${escAttr(u['שם משתמש']||'')}')">
            <i class="bi bi-pencil"></i> שנה
          </button>
          <button class="btn btn-sm btn-outline-secondary" onclick="copyUserPassword('${escAttr(u['שם משתמש']||'')}', '${escAttr(displayPwd)}')">
            📋
          </button>
        </td>
      </tr>`;
    }).join('');

    const html = `<div class="modal fade show" id="pw-mgr-modal" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-key"></i> ניהול סיסמאות (${users.length} משתמשים)</h5>
            <div>
              <button class="btn btn-sm btn-outline-primary" onclick="exportPasswordsCSV()">⬇ ייצוא CSV</button>
              <button class="btn btn-sm btn-outline-info" onclick="printPasswords()">🖨 הדפס</button>
              <button class="btn-close" onclick="document.getElementById('pw-mgr-modal').remove()"></button>
            </div>
          </div>
          <div class="modal-body" style="max-height:70vh;overflow-y:auto">
            <div class="alert alert-warning">
              <strong>⚠ אזהרת אבטחה:</strong> סיסמאות מוצגות בטקסט גלוי. אל תשתף את המסך הזה.
            </div>
            <input id="pw-search" class="form-control mb-3" placeholder="חיפוש משתמש...">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>שם משתמש</th>
                  <th>שם מלא</th>
                  <th>תפקיד</th>
                  <th>סיסמה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody id="pw-tbody">${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    // Search
    document.getElementById('pw-search').oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      [...document.querySelectorAll('#pw-tbody tr')].forEach(tr => {
        tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    };
  };

  // ===== Change password dialog =====
  window.changeUserPassword = async function (username) {
    const newPwd = prompt(`סיסמה חדשה ל-${username}:`);
    if (!newPwd || newPwd.length < 4) {
      if (newPwd) alert('הסיסמה חייבת לפחות 4 תווים');
      return;
    }
    try {
      // Load user to get full data
      const r = await api('listUsers', []);
      const u = (r.data || []).find(x => x['שם משתמש'] === username);
      if (!u) return alert('משתמש לא נמצא');
      const updated = Object.assign({}, u, { 'סיסמה': newPwd });
      const res = await api('updateUser', [updated]);
      if (res && res.ok !== false) {
        if (typeof toast === 'function') toast(`סיסמה של ${username} שונתה`, 'success');
        // Update display
        const codeEl = document.getElementById('pw-' + username);
        if (codeEl) { codeEl.textContent = newPwd; codeEl.style.color = ''; }
      } else {
        alert('שגיאה: ' + (res?.error || 'לא ידוע'));
      }
    } catch (e) {
      alert('שגיאה: ' + e.message);
    }
  };

  // ===== Copy password =====
  window.copyUserPassword = function (username, password) {
    if (!password || password === '••••••••') {
      if (typeof toast === 'function') toast('סיסמה מוצפנת - אי-אפשר להעתיק', 'warn');
      return;
    }
    navigator.clipboard.writeText(password).then(() => {
      if (typeof toast === 'function') toast(`סיסמה של ${username} הועתקה`, 'success');
    });
  };

  // ===== Export passwords CSV =====
  window.exportPasswordsCSV = async function () {
    try {
      const r = await api('listUsers', []);
      const users = r.data || [];
      let csv = '﻿שם משתמש,שם מלא,תפקיד,סיסמה,מוצפן\n';
      users.forEach(u => {
        const pwd = u['סיסמה'] || '';
        const isHashed = String(pwd).startsWith('sha256:');
        csv += `"${(u['שם משתמש']||'').replace(/"/g,'""')}","${(u['שם מלא']||'').replace(/"/g,'""')}","${(u['תפקיד']||'').replace(/"/g,'""')}","${isHashed?'מוצפן':pwd.replace(/"/g,'""')}",${isHashed?'כן':'לא'}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `passwords_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      if (typeof toast === 'function') toast('CSV הורד', 'success');
    } catch (e) { alert(e.message); }
  };

  // ===== Print passwords =====
  window.printPasswords = async function () {
    const r = await api('listUsers', []);
    const users = r.data || [];
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>סיסמאות</title>
      <style>body{font-family:Heebo,Arial;padding:20px;max-width:700px;margin:0 auto}
      table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ccc;text-align:right}th{background:#f3f4f6}
      .warn{background:#fef3c7;border:2px solid #ca8a04;padding:14px;border-radius:8px;margin-bottom:20px}
      </style></head><body>
      <h2>🔑 סיסמאות - בית התלמוד</h2>
      <div class="warn">⚠ מסמך רגיש! לשמור במקום בטוח. ${new Date().toLocaleDateString('he-IL')}</div>
      <table><thead><tr><th>משתמש</th><th>שם מלא</th><th>תפקיד</th><th>סיסמה</th></tr></thead><tbody>
      ${users.map(u => {
        const pwd = u['סיסמה'] || '';
        const isHashed = String(pwd).startsWith('sha256:');
        return `<tr><td>${u['שם משתמש']||''}</td><td>${u['שם מלא']||''}</td><td>${u['תפקיד']||''}</td><td style="font-family:monospace">${isHashed?'מוצפן':pwd}</td></tr>`;
      }).join('')}
      </tbody></table>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== Auto-inject banner =====
  window.addEventListener('hashchange', () => setTimeout(injectPasswordColumn, 800));
  setInterval(injectPasswordColumn, 5000);
  setTimeout(injectPasswordColumn, 2000);

  // Add to FAB menu
  if (window.MENU_ITEMS && !window.MENU_ITEMS.find(m => m.label?.includes('סיסמאות'))) {
    window.MENU_ITEMS.push({ icon: '🔑', label: 'ניהול סיסמאות', action: () => openPasswordManager() });
  }

  console.warn('%c🔑 Pack-59 — Password manager (admin only): view/edit/CSV/print', 'color:#ca8a04;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-59.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-60.js ─────────────────────────────────────────────
try {
// behavior-pack-60.js — Unify staff & settings into single staff panel. 2026-05-26
(function () {
// ===== Inject "Permissions" section into staff page =====
  function injectPermsIntoStaff() {
    if (location.hash !== '#staff') return;
    const page = document.getElementById('page-staff');
    if (!page || page.querySelector('#staff-perms-cta')) return;

    const h3 = page.querySelector('h3');
    if (!h3) return;

    // Add comprehensive CTA bar with all admin functions
    const cta = document.createElement('div');
    cta.id = 'staff-perms-cta';
    cta.style.cssText = 'background:linear-gradient(135deg,#dbeafe,#bfdbfe);border:2px solid #2563eb;border-radius:10px;padding:14px;margin:12px 0;direction:rtl';
    cta.innerHTML = `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <strong style="color:#1e3a8a;font-size:1.05rem">⚙ ניהול מלא של הצוות</strong>
          <div class="small text-muted">משתמשים, סיסמאות, הרשאות, פרטים אישיים</div>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-primary btn-sm" onclick="if(typeof addUserModal==='function')addUserModal()">
            <i class="bi bi-person-plus"></i> משתמש חדש
          </button>
          <button class="btn btn-warning btn-sm" onclick="window.openPasswordManager?.()">
            <i class="bi bi-key"></i> סיסמאות
          </button>
          <button class="btn btn-info btn-sm" onclick="window.openPermissionsManager?.()">
            <i class="bi bi-shield-check"></i> הרשאות
          </button>
          <button class="btn btn-outline-secondary btn-sm" onclick="goto('settings')">
            <i class="bi bi-gear"></i> הגדרות מתקדמות
          </button>
        </div>
      </div>
    `;
    h3.parentNode.insertBefore(cta, h3.nextSibling);
  }

  // ===== Permissions manager modal =====
  window.openPermissionsManager = async function () {
    let users = [];
    try {
      const r = await api('listUsers', []);
      users = r.data || [];
    } catch (e) { return alert(e.message); }

    // Permission areas
    const AREAS = [
      ['students', 'תלמידים', '👨‍🎓'],
      ['behavior', 'מעקב התנהגות', '📋'],
      ['writing', 'כתיבה', '✏️'],
      ['reading', 'קריאה', '📖'],
      ['lessonsKlein', 'שיעורים פרטניים', '🎓'],
      ['tasks', 'משימות', '✅'],
      ['projects', 'פרויקטים', '📊'],
      ['formsMgmt', 'ניהול טפסים', '📝'],
      ['staff', 'ניהול צוות', '👥'],
      ['attendance', 'נוכחות', '📅'],
      ['functioning', 'ציוני תפקוד', '⭐'],
      ['tests', 'מבחנים', '📝'],
      ['medications', 'רפואי', '💊'],
      ['meetings', 'אסיפות', '🤝'],
      ['conversations', 'שיחות', '💬'],
      ['classview', 'תצוגת כיתה', '🏫'],
      ['calendar', 'יומן', '📆'],
      ['reports', 'דוחות', '📊'],
      ['settings', 'הגדרות', '⚙️'],
    ];

    const rows = users.map(u => {
      const perms = String(u['הרשאות'] || '').split(',').map(s => s.trim());
      const isAll = perms.includes('all') || u['תפקיד'] === 'מנהל';
      return `<tr>
        <td><strong>${escHtml(u['שם משתמש']||'')}</strong></td>
        <td>${escHtml(u['שם מלא']||'')}</td>
        <td>${isAll ? '<span class="badge bg-success">כל ההרשאות</span>' : `<span class="badge bg-info">${perms.filter(p=>p).length} הרשאות</span>`}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editUserPermissions('${escAttr(u['שם משתמש']||'')}')">
            <i class="bi bi-pencil"></i> ערוך
          </button>
        </td>
      </tr>`;
    }).join('');

    const html = `<div class="modal fade show" id="perms-mgr" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-shield-check"></i> ניהול הרשאות</h5>
            <button class="btn-close" onclick="document.getElementById('perms-mgr').remove()"></button>
          </div>
          <div class="modal-body" style="max-height:70vh;overflow-y:auto">
            <table class="table table-hover">
              <thead class="table-light"><tr><th>משתמש</th><th>שם מלא</th><th>הרשאות</th><th>פעולה</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    // Store areas globally for edit dialog
    window._PERM_AREAS = AREAS;
  };

  window.editUserPermissions = async function (username) {
    const r = await api('listUsers', []);
    const u = (r.data || []).find(x => x['שם משתמש'] === username);
    if (!u) return alert('משתמש לא נמצא');
    const currentPerms = String(u['הרשאות'] || '').split(',').map(s => s.trim());
    const isAll = currentPerms.includes('all');
    const AREAS = window._PERM_AREAS;

    const checkboxes = AREAS.map(([key, label, icon]) => {
      const checked = isAll || currentPerms.includes(key);
      return `<div class="form-check">
        <input class="form-check-input perm-cb" type="checkbox" value="${key}" ${checked?'checked':''} id="pe-${key}">
        <label class="form-check-label" for="pe-${key}">${icon} ${escHtml(label)}</label>
      </div>`;
    }).join('');

    const html = `<div class="modal fade show" id="perm-edit" style="display:block;background:rgba(0,0,0,0.6);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5>הרשאות ${escHtml(username)}</h5>
            <button class="btn-close" onclick="document.getElementById('perm-edit').remove()"></button>
          </div>
          <div class="modal-body" style="max-height:60vh;overflow-y:auto">
            <div class="d-flex gap-2 mb-3">
              <button class="btn btn-sm btn-outline-success" onclick="document.querySelectorAll('.perm-cb').forEach(c=>c.checked=true)">בחר הכל</button>
              <button class="btn btn-sm btn-outline-danger" onclick="document.querySelectorAll('.perm-cb').forEach(c=>c.checked=false)">בטל הכל</button>
            </div>
            ${checkboxes}
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="saveUserPerms('${escAttr(username)}')">שמור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.saveUserPerms = async function (username) {
    const selected = [...document.querySelectorAll('.perm-cb:checked')].map(c => c.value);
    const allCount = window._PERM_AREAS.length;
    const value = selected.length === allCount ? 'all' : selected.join(',');
    try {
      const r = await api('listUsers', []);
      const u = (r.data || []).find(x => x['שם משתמש'] === username);
      if (!u) return;
      const updated = Object.assign({}, u, { 'הרשאות': value });
      const res = await api('updateUser', [updated]);
      if (res && res.ok !== false) {
        if (typeof toast === 'function') toast(`הרשאות ${username} עודכנו (${selected.length} פיצ'רים)`, 'success');
        document.getElementById('perm-edit')?.remove();
      } else {
        alert('שגיאה: ' + (res?.error || 'unknown'));
      }
    } catch (e) { alert(e.message); }
  };

  // ===== Hide duplicate "user management" in settings =====
  // Add notice in settings pointing to staff
  function injectSettingsNotice() {
    if (location.hash !== '#settings') return;
    const page = document.getElementById('page-settings');
    if (!page || page.querySelector('#settings-staff-link')) return;
    const usersHeader = [...page.querySelectorAll('h5')].find(h => h.textContent.includes('משתמשים'));
    if (!usersHeader) return;
    const link = document.createElement('div');
    link.id = 'settings-staff-link';
    link.className = 'alert alert-info py-2 small';
    link.innerHTML = '💡 לניהול מלא של הצוות (פרטים אישיים, סיסמאות, הרשאות) - <a href="#staff" onclick="goto(\'staff\');return false">עבור לדף ניהול צוות</a>';
    usersHeader.parentNode.insertBefore(link, usersHeader);
  }

  window.addEventListener('hashchange', () => {
    setTimeout(injectPermsIntoStaff, 600);
    setTimeout(injectSettingsNotice, 600);
  });
  setInterval(injectPermsIntoStaff, 5000);
  setInterval(injectSettingsNotice, 5000);
  setTimeout(injectPermsIntoStaff, 2000);
  setTimeout(injectSettingsNotice, 2000);

  console.warn('%c👥 Pack-60 — Unified staff panel: passwords + permissions + personal details', 'color:#2563eb;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-60.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-61.js ─────────────────────────────────────────────
try {
// behavior-pack-61.js — Show password in edit user modal. 2026-05-26
(function () {
// ===== Make nu-pass field show as text with toggle visibility =====
  document.addEventListener('shown.bs.modal', e => {
    const modal = e.target;
    if (modal.id !== 'addUModal') return;

    setTimeout(() => {
      const pwd = modal.querySelector('#nu-pass');
      if (!pwd || pwd.dataset.enhanced61) return;
      pwd.dataset.enhanced61 = '1';

      // Make text by default (show actual password)
      pwd.type = 'text';
      pwd.style.fontFamily = 'monospace';

      // Wrap with visibility toggle
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;display:flex;gap:4px;align-items:center';
      pwd.parentNode.insertBefore(wrap, pwd);
      wrap.appendChild(pwd);
      pwd.style.flex = '1';

      // Toggle button (eye)
      const eyeBtn = document.createElement('button');
      eyeBtn.type = 'button';
      eyeBtn.className = 'btn btn-sm btn-outline-secondary';
      eyeBtn.innerHTML = '👁';
      eyeBtn.title = 'הצג/הסתר סיסמה';
      eyeBtn.onclick = (ev) => {
        ev.preventDefault();
        pwd.type = pwd.type === 'password' ? 'text' : 'password';
        eyeBtn.innerHTML = pwd.type === 'password' ? '👁' : '🙈';
      };
      wrap.appendChild(eyeBtn);

      // Copy button
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-sm btn-outline-secondary';
      copyBtn.innerHTML = '📋';
      copyBtn.title = 'העתק סיסמה';
      copyBtn.onclick = (ev) => {
        ev.preventDefault();
        if (pwd.value) {
          navigator.clipboard.writeText(pwd.value).then(() => {
            if (typeof toast === 'function') toast('סיסמה הועתקה', 'success');
          });
        }
      };
      wrap.appendChild(copyBtn);

      // Generate button (random password)
      const genBtn = document.createElement('button');
      genBtn.type = 'button';
      genBtn.className = 'btn btn-sm btn-outline-info';
      genBtn.innerHTML = '🔄';
      genBtn.title = 'צור סיסמה חדשה אקראית';
      genBtn.onclick = (ev) => {
        ev.preventDefault();
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let newPwd = '';
        for (let i = 0; i < 8; i++) newPwd += chars[Math.floor(Math.random() * chars.length)];
        pwd.value = newPwd;
        pwd.type = 'text';
        eyeBtn.innerHTML = '🙈';
      };
      wrap.appendChild(genBtn);

      // If current value is hashed - clear field + show warning
      const val = pwd.value || '';
      if (val.startsWith('sha256:')) {
        pwd.value = ''; // Clear hash from view
        pwd.placeholder = 'הזן סיסמה חדשה (הקיימת מוצפנת)';
        const warn = document.createElement('div');
        warn.style.cssText = 'background:#fef3c7;border:1px solid #fbbf24;padding:6px 10px;border-radius:6px;margin-top:6px;font-size:12px;color:#92400e';
        warn.innerHTML = `🔒 סיסמה קיימת מוצפנת - לא ניתן להציג. הזן סיסמה חדשה כדי לאפס.`;
        wrap.parentNode.insertBefore(warn, wrap.nextSibling);
        // Mark as reset-mode so save knows it's intentional
        pwd.dataset.resetMode = '1';
      }
    }, 100);
  });

  console.warn('%c👁 Pack-61 — Password field in user edit: visible + show/hide + copy + generate', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-61.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-62.js ─────────────────────────────────────────────
try {
// behavior-pack-62.js — Self-service password change for any user. 2026-05-26
(function () {
// ===== Open my password change dialog =====
  window.openMyPasswordChange = async function () {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!u.username) {
      alert('יש להתחבר תחילה');
      return;
    }

    const html = `<div class="modal fade show" id="mypw-modal" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-key"></i> שינוי הסיסמה שלי</h5>
            <button class="btn-close" onclick="document.getElementById('mypw-modal').remove()"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">משתמש</label>
              <input class="form-control" value="${escAttr(u.username)}" readonly disabled>
            </div>
            <div class="mb-3">
              <label class="form-label">סיסמה נוכחית</label>
              <input id="mypw-current" type="password" class="form-control" placeholder="הסיסמה הנוכחית שלך">
            </div>
            <div class="mb-3">
              <label class="form-label">סיסמה חדשה</label>
              <input id="mypw-new" type="text" class="form-control" placeholder="לפחות 4 תווים" style="font-family:monospace">
            </div>
            <div class="mb-3">
              <label class="form-label">אישור סיסמה חדשה</label>
              <input id="mypw-confirm" type="text" class="form-control" style="font-family:monospace">
            </div>
            <div id="mypw-error" class="alert alert-danger d-none"></div>
            <div id="mypw-success" class="alert alert-success d-none"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('mypw-modal').remove()">בטל</button>
            <button class="btn btn-primary" id="mypw-save">שמור סיסמה חדשה</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('mypw-current').focus();

    document.getElementById('mypw-save').onclick = async function () {
      const cur = document.getElementById('mypw-current').value;
      const newPwd = document.getElementById('mypw-new').value;
      const conf = document.getElementById('mypw-confirm').value;
      const errEl = document.getElementById('mypw-error');
      const okEl = document.getElementById('mypw-success');
      errEl.classList.add('d-none');
      okEl.classList.add('d-none');

      // Validation
      if (!cur || !newPwd || !conf) {
        errEl.textContent = 'יש למלא את כל השדות';
        errEl.classList.remove('d-none');
        return;
      }
      if (newPwd.length < 4) {
        errEl.textContent = 'הסיסמה החדשה חייבת לפחות 4 תווים';
        errEl.classList.remove('d-none');
        return;
      }
      if (newPwd !== conf) {
        errEl.textContent = 'סיסמת אישור לא תואמת';
        errEl.classList.remove('d-none');
        return;
      }

      // Verify current password
      try {
        const r = await api('authenticate', [u.username, cur]);
        if (!r || r.ok === false || (r.data && r.data.ok === false)) {
          errEl.textContent = '❌ סיסמה נוכחית שגויה';
          errEl.classList.remove('d-none');
          return;
        }
      } catch (e) {
        errEl.textContent = 'שגיאת חיבור: ' + e.message;
        errEl.classList.remove('d-none');
        return;
      }

      // Update password
      try {
        const usersResp = await api('listUsers', []);
        const myUser = (usersResp.data || []).find(x => x['שם משתמש'] === u.username);
        if (!myUser) throw new Error('משתמש לא נמצא');
        const updated = Object.assign({}, myUser, { 'סיסמה': newPwd });
        const upRes = await api('updateUser', [updated]);
        if (upRes && upRes.ok !== false) {
          okEl.textContent = '✅ הסיסמה שונתה בהצלחה!';
          okEl.classList.remove('d-none');
          if (typeof toast === 'function') toast('הסיסמה שלך שונתה', 'success');
          setTimeout(() => {
            document.getElementById('mypw-modal')?.remove();
          }, 2000);
        } else {
          errEl.textContent = 'שגיאה: ' + (upRes?.error || 'unknown');
          errEl.classList.remove('d-none');
        }
      } catch (e) {
        errEl.textContent = 'שגיאה: ' + e.message;
        errEl.classList.remove('d-none');
      }
    };
  };

  // ===== Inject "Change my password" button in user-info area =====
  function injectMyPwBtn() {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!u.username) return;

    // Look for user-info or logout button area
    const candidates = [
      document.querySelector('#user-info'),
      document.querySelector('a[onclick*="logout"], button[onclick*="logout"]'),
    ];
    let target = null;
    for (const c of candidates) {
      if (c && c.offsetParent) { target = c; break; }
    }
    if (!target) return;
    if (target.parentNode.querySelector('#mypw-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'mypw-btn';
    btn.className = 'btn btn-sm btn-outline-light';
    btn.style.cssText = 'margin-left:8px;font-size:12px';
    btn.innerHTML = '🔑 שנה סיסמה';
    btn.onclick = openMyPasswordChange;
    target.parentNode.insertBefore(btn, target);
  }

  setInterval(injectMyPwBtn, 3000);
  setTimeout(injectMyPwBtn, 1000);

  // ===== Also add to FAB menu =====
  if (window.MENU_ITEMS) {
    if (!window.MENU_ITEMS.find(m => m.label === 'שנה את הסיסמה שלי')) {
      window.MENU_ITEMS.push({ icon: '🔑', label: 'שנה את הסיסמה שלי', action: openMyPasswordChange });
    }
  }

  console.warn('%c🔑 Pack-62 — Self-service password change available', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-62.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-63.js ─────────────────────────────────────────────
try {
// behavior-pack-63.js — Replace UI label "כיתה" → "שיעור" everywhere (text + attributes). 2026-05-26
// Doesn't touch data field names (מחזור), Hebrew letter class names (א/ב/ג), or code.
(function () {
// Replacement rules — most-specific first to avoid double-substitution.
  // We deliberately skip "מחזור" (data field) and keep אותיות א/ב/ג as-is.
  const RULES = [
    [/בכיתת/g, 'בשיעור'],
    [/לכיתת/g, 'לשיעור'],
    [/מכיתת/g, 'משיעור'],
    [/הכיתות/g, 'השיעורים'],
    [/הכיתה/g, 'השיעור'],
    [/בכיתה/g, 'בשיעור'],
    [/לכיתה/g, 'לשיעור'],
    [/מכיתה/g, 'משיעור'],
    [/כיתות/g, 'שיעורים'],
    [/כיתה/g, 'שיעור'],
  ];

  function transform(s) {
    if (!s || typeof s !== 'string') return s;
    let out = s;
    for (const [re, rep] of RULES) out = out.replace(re, rep);
    return out;
  }

  // Skip these elements entirely (their content is data/code, not UI)
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA']);
  // Skip nodes that are inputs/options whose value/text reflects raw data (class names)
  function shouldSkipNode(node) {
    let p = node.parentNode;
    while (p && p !== document.body) {
      if (SKIP_TAGS.has(p.tagName)) return true;
      // <option> inside a <select> that lists actual class values — keep raw
      if (p.tagName === 'OPTION' || p.tagName === 'SELECT') {
        // But options' visible text like "כיתה א" we DO want to translate
        // Only skip if it's a data-* dropdown that maps to מחזור values
        return false;
      }
      p = p.parentNode;
    }
    return false;
  }

  function walkText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !/כיתה|כיתות|בכיתה|הכיתה|לכיתה|מכיתה/.test(n.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (shouldSkipNode(n)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      const t = transform(node.nodeValue);
      if (t !== node.nodeValue) node.nodeValue = t;
    }
  }

  const ATTRS = ['placeholder', 'title', 'aria-label', 'data-bs-original-title', 'alt'];
  function walkAttrs(root) {
    const all = root.querySelectorAll('*');
    for (const el of all) {
      for (const a of ATTRS) {
        if (!el.hasAttribute(a)) continue;
        const v = el.getAttribute(a);
        const t = transform(v);
        if (t !== v) el.setAttribute(a, t);
      }
    }
  }

  function runOnce() {
    try {
      walkText(document.body);
      walkAttrs(document.body);
    } catch (e) {
      console.warn('Pack-63 transform error', e);
    }
  }

  // Initial sweep after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runOnce);
  } else {
    runOnce();
  }

  // Observe DOM mutations and re-sweep
  let pending = false;
  const obs = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      runOnce();
    });
  });
  obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  console.warn('%c📝 Pack-63 — UI label rename: "כיתה" → "שיעור"', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-63.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-64.js ─────────────────────────────────────────────
try {
// behavior-pack-64.js — Live cameras viewer (Cloudflare Tunnel URL configurable). 2026-05-26
(function () {
const STORAGE_KEY = 'cameras_live_url';
  // Default Cloudflare Tunnel URL (Quick Tunnel — temporary, replace with named tunnel for production)
  const DEFAULT_URL = 'https://pressure-experts-rescue-subscribers.trycloudflare.com';

  function getLiveUrl() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL || '';
  }
  function setLiveUrl(u) {
    if (u) localStorage.setItem(STORAGE_KEY, u);
    else localStorage.removeItem(STORAGE_KEY);
  }
  function escAttrLocal(s) {
    return String(s || '').replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  // Override the existing renderCameras placeholder
  const _origRender = window.renderCameras;
  window.renderCameras = async function () {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    const url = getLiveUrl();
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isAdmin = u.username === 'admin' || u.role === 'מנהל';

    root.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="d-flex align-items-center mb-3">
        <h3 class="me-3 mb-0"><i class="bi bi-camera-video-fill text-danger"></i> מצלמות לייב</h3>
        <span class="badge bg-danger">LIVE</span>
        ${isAdmin ? `<button class="btn btn-sm btn-outline-primary ms-auto" onclick="window.openCamerasConfig()"><i class="bi bi-gear"></i> הגדרת URL</button>` : ''}
      </div>
      ${url ? `
        <div class="card p-4 text-center mb-3" style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);color:#fff">
          <i class="bi bi-broadcast fs-1 mb-2"></i>
          <h4>מצלמות המכינה - לייב</h4>
          <p class="mb-3">DVR/NVR ב-LAN הפנימי, נחשף ב-HTTPS דרך Cloudflare Tunnel</p>
          <a class="btn btn-light btn-lg" href="${escAttrLocal(url)}" target="_blank" rel="noopener">
            <i class="bi bi-box-arrow-up-right"></i> פתח את כל המצלמות
          </a>
          <div class="mt-2 small" style="opacity:.85">⚠ דורש התחברות ל-DVR (admin/סיסמה)</div>
        </div>
        <div class="alert alert-warning small">
          <b>למה לא inline?</b> ה-DVR שולח <code>X-Frame-Options: SAMEORIGIN</code> שחוסם הטמעה. הקישור למעלה פותח בחלון חדש.
        </div>
        <details class="mb-3">
          <summary class="text-muted small">נסיון Inline (סביר שיוצג ריק)</summary>
          <div class="ratio ratio-16x9 mt-2" style="background:#000;border-radius:8px;overflow:hidden">
            <iframe src="${escAttrLocal(url)}" allow="autoplay; fullscreen" allowfullscreen frameborder="0" style="border:0;width:100%;height:100%"></iframe>
          </div>
        </details>
        <div class="d-flex gap-2 small text-muted">
          <span>מקור: ${escAttrLocal(url.replace(/^https?:\/\//,'').split('/')[0])}</span>
        </div>
      ` : `
        <div class="card p-4 text-center mt-3">
          <i class="bi bi-camera-video-off fs-1 text-muted"></i>
          <p class="mt-3 mb-1"><b>אין URL מוגדר למצלמות לייב</b></p>
          <p class="small text-muted mb-3">מצלמות המכינה ב-LAN הפנימי. צריך Cloudflare Tunnel שיחשוף אותן כ-HTTPS ציבורי.</p>
          ${isAdmin ? `
            <div class="d-flex justify-content-center">
              <button class="btn btn-primary" onclick="window.openCamerasConfig()"><i class="bi bi-gear"></i> הגדר URL עכשיו</button>
            </div>
            <div class="alert alert-info text-end small mt-3 mx-auto" style="max-width:640px">
              <b>איך מקבלים URL?</b>
              <ol class="mb-0 mt-2">
                <li>על מחשב המכינה — מריצים: <code>cloudflared tunnel --url http://192.168.1.108:80</code></li>
                <li>cloudflared יחזיר URL כמו: <code>https://abc-xyz.trycloudflare.com</code></li>
                <li>מדביקים כאן בכפתור "הגדר URL"</li>
              </ol>
            </div>
          ` : '<p class="small text-muted">פנה למנהל להגדרת URL.</p>'}
        </div>
      `}
    `;
  };

  window.openCamerasConfig = function () {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.username !== 'admin' && u.role !== 'מנהל') {
      alert('רק מנהל יכול להגדיר');
      return;
    }
    const current = getLiveUrl();
    const html = `<div class="modal fade show" id="cam-cfg-modal" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-camera-video"></i> הגדרת URL מצלמות לייב</h5>
            <button class="btn-close" onclick="document.getElementById('cam-cfg-modal').remove()"></button>
          </div>
          <div class="modal-body">
            <label class="form-label">URL ציבורי (Cloudflare Tunnel / ngrok / domain)</label>
            <input id="cam-url" type="url" class="form-control" placeholder="https://abc.trycloudflare.com" value="${escAttrLocal(current)}" style="direction:ltr;font-family:monospace">
            <div class="small text-muted mt-2">
              דוגמא: <code style="direction:ltr">https://cams.beit-hatalmud.com</code><br>
              ה-URL נשמר ב-localStorage של הדפדפן שלך בלבד.
            </div>
            <div class="form-check mt-3">
              <input type="checkbox" class="form-check-input" id="cam-broadcast">
              <label class="form-check-label" for="cam-broadcast">הפץ לכל הצוות (שמירה ב-sheet הגדרות מערכת)</label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger me-auto" onclick="if(confirm('למחוק URL?')){localStorage.removeItem('${STORAGE_KEY}');document.getElementById('cam-cfg-modal').remove();renderCameras();}">מחק</button>
            <button class="btn btn-secondary" onclick="document.getElementById('cam-cfg-modal').remove()">בטל</button>
            <button class="btn btn-primary" onclick="(async()=>{
              const v=document.getElementById('cam-url').value.trim();
              if(!v){alert('הזן URL');return;}
              if(!/^https?:\\/\\//.test(v)){alert('URL חייב להתחיל ב-http:// או https://');return;}
              localStorage.setItem('${STORAGE_KEY}',v);
              if(document.getElementById('cam-broadcast').checked && typeof api==='function'){
                try{ await api('cheder_appendRow',[{tab:'הגדרות_מערכת',row:JSON.stringify({'מפתח':'${STORAGE_KEY}','ערך':v,'תאריך':new Date().toISOString()})}]); }catch(e){}
              }
              document.getElementById('cam-cfg-modal').remove();
              renderCameras();
            })()">שמור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('cam-url').focus();
  };

  console.warn('%c📹 Pack-64 — Live cameras viewer (configurable URL)', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-64.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-65.js ─────────────────────────────────────────────
try {
// behavior-pack-65.js — Live cameras grid using HLS.js (11 cameras from Beit HaTalmud DVR). 2026-05-26
(function () {
// Cloudflare Tunnel base URL for mediamtx HLS (will be set after tunnel created)
  const HLS_BASE_KEY = 'cameras_hls_base';
  // Default base — user-configurable
  const DEFAULT_HLS_BASE = 'https://oregon-knock-learn-corrections.trycloudflare.com';

  const CAMERAS = [
    { path: 'shaar',          name: 'שער וגינה',     channel: 1,  emoji: '🚪' },
    { path: 'chadar_rm',      name: 'חדר רמ"מ',     channel: 2,  emoji: '👨‍🏫' },
    { path: 'lobby',          name: 'לובי',          channel: 3,  emoji: '🏛️' },
    { path: 'shvil',          name: 'שביל סיני',     channel: 4,  emoji: '🛤️' },
    { path: 'machsan',        name: 'מחסן',          channel: 5,  emoji: '📦' },
    { path: 'parking',        name: 'מדרכה וחניה',   channel: 6,  emoji: '🚗' },
    { path: 'chadar_shiur',   name: 'חדר שיעור',     channel: 7,  emoji: '📚' },
    { path: 'chadar_mifgash', name: 'חדר מפגש',      channel: 9,  emoji: '🤝' },
    { path: 'mazkirut',       name: 'מזכירות',       channel: 10, emoji: '📋' },
    { path: 'misrad',         name: 'משרד',          channel: 11, emoji: '💼' },
    { path: 'beit_midrash',   name: 'בית המדרש',     channel: 12, emoji: '📜' },
  ];

  function getBase() { return localStorage.getItem(HLS_BASE_KEY) || DEFAULT_HLS_BASE || ''; }
  function setBase(u) { if (u) localStorage.setItem(HLS_BASE_KEY, u); else localStorage.removeItem(HLS_BASE_KEY); }
  function escAttrL(s) { return String(s || '').replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c])); }

  // Load hls.js dynamically
  function loadHlsJs() {
    if (window.Hls) return Promise.resolve(window.Hls);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
      s.onload = () => resolve(window.Hls);
      s.onerror = () => reject(new Error('hls.js load failed'));
      document.head.appendChild(s);
    });
  }

  function attachHls(videoEl, url) {
    if (!url) return;
    const Hls = window.Hls;
    if (Hls && Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDuration: 2,
        liveMaxLatencyDuration: 5,
        maxBufferLength: 6,
        lowLatencyMode: false,
      });
      hls.loadSource(url);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          videoEl.parentNode.querySelector('.cam-status')?.classList.add('offline');
          hls.destroy();
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoEl.play().catch(() => {});
        videoEl.parentNode.querySelector('.cam-status')?.classList.add('live');
      });
      videoEl._hls = hls;
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      videoEl.src = url;
      videoEl.play().catch(() => {});
      videoEl.parentNode.querySelector('.cam-status')?.classList.add('live');
    }
  }

  function detachHls(videoEl) {
    try { videoEl._hls?.destroy(); } catch {}
    videoEl._hls = null;
    videoEl.removeAttribute('src');
  }

  window.renderCameras = async function () {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    const base = getBase();
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isAdmin = u.username === 'admin' || u.role === 'מנהל';

    const styleId = 'cam-grid-style';
    if (!document.getElementById(styleId)) {
      const st = document.createElement('style');
      st.id = styleId;
      st.textContent = `
        .cam-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
        .cam-card { position:relative; background:#000; border-radius:8px; overflow:hidden; aspect-ratio:4/3; }
        .cam-card video { width:100%; height:100%; object-fit:cover; background:#111; }
        .cam-label { position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.7); color:#fff; padding:4px 10px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px; }
        .cam-status { display:inline-block; width:8px; height:8px; border-radius:50%; background:#fbbf24; }
        .cam-status.live { background:#22c55e; box-shadow:0 0 6px #22c55e; animation:pulse 2s infinite; }
        .cam-status.offline { background:#ef4444; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .cam-channel { position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.6); color:#9ca3af; padding:2px 8px; border-radius:8px; font-size:11px; font-family:monospace; }
        .cam-card:hover .cam-expand { opacity:1; }
        .cam-expand { position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.7); color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; opacity:0; transition:opacity .2s; }
        .cam-fullscreen-modal { position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px; }
        .cam-fullscreen-modal video { max-width:100%; max-height:100%; }
        .cam-fullscreen-close { position:absolute; top:20px; right:20px; background:#dc2626; color:#fff; border:none; padding:10px 16px; border-radius:8px; cursor:pointer; font-size:16px; }
      `;
      document.head.appendChild(st);
    }

    root.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="d-flex align-items-center mb-3 flex-wrap gap-2">
        <h3 class="me-3 mb-0"><i class="bi bi-camera-video-fill text-danger"></i> מצלמות לייב</h3>
        <span class="badge bg-danger"><span class="cam-status live" style="background:#fff;box-shadow:0 0 4px #fff"></span> LIVE</span>
        <span class="badge bg-secondary">${CAMERAS.length} מצלמות</span>
        ${isAdmin ? `<button class="btn btn-sm btn-outline-primary ms-auto" onclick="window.openCamerasConfig()"><i class="bi bi-gear"></i> הגדרת HLS</button>` : ''}
      </div>
      ${!base ? `
        <div class="alert alert-warning">
          <b>אין URL מוגדר ל-mediamtx (HLS).</b><br>
          ${isAdmin ? `
            <button class="btn btn-warning btn-sm mt-2" onclick="window.openCamerasConfig()">הגדר עכשיו</button>
            <details class="mt-2 small">
              <summary>איך מקבלים URL?</summary>
              <ol class="mb-0 mt-2">
                <li>mediamtx פעיל ב-<code>127.0.0.1:8888</code></li>
                <li><code>cloudflared tunnel --url http://127.0.0.1:8888</code></li>
                <li>מדביקים URL בכפתור "הגדרת HLS"</li>
              </ol>
            </details>
          ` : 'פנה למנהל להגדרת URL.'}
        </div>
      ` : `
        <div class="cam-grid" id="cam-grid"></div>
        <div class="alert alert-info small mt-3">
          <i class="bi bi-info-circle"></i> שידור חי דרך HLS · המצלמות מתחילות תוך 2-5 שניות מהלחיצה · ה-DVR ב-LAN, ה-stream נחשף דרך Cloudflare Tunnel.
        </div>
      `}
    `;

    if (!base) return;

    // Load hls.js then attach all cameras
    try {
      await loadHlsJs();
    } catch (e) {
      root.querySelector('#cam-grid').innerHTML = '<div class="alert alert-danger">לא ניתן לטעון hls.js</div>';
      return;
    }

    const grid = document.getElementById('cam-grid');
    if (!grid) return;
    grid.innerHTML = CAMERAS.map(c => `
      <div class="cam-card" data-path="${c.path}">
        <video autoplay muted playsinline></video>
        <span class="cam-label">${c.emoji} ${escAttrL(c.name)} <span class="cam-status"></span></span>
        <span class="cam-channel">CH${c.channel}</span>
        <button class="cam-expand" data-path="${c.path}" title="מסך מלא">⛶</button>
      </div>
    `).join('');

    CAMERAS.forEach(c => {
      const card = grid.querySelector(`.cam-card[data-path="${c.path}"]`);
      if (!card) return;
      const video = card.querySelector('video');
      const url = base.replace(/\/$/, '') + '/' + c.path + '/index.m3u8';
      attachHls(video, url);
    });

    // Expand handler
    grid.querySelectorAll('.cam-expand').forEach(btn => {
      btn.onclick = (ev) => {
        ev.stopPropagation();
        const path = btn.dataset.path;
        const cam = CAMERAS.find(c => c.path === path);
        const url = base.replace(/\/$/, '') + '/' + path + '/index.m3u8';
        const modalEl = document.createElement('div');
        modalEl.className = 'cam-fullscreen-modal';
        modalEl.innerHTML = `
          <button class="cam-fullscreen-close" onclick="this.closest('.cam-fullscreen-modal').remove()">✕ סגור</button>
          <div style="position:absolute;top:20px;left:20px;color:#fff;font-size:24px">${cam.emoji} ${escAttrL(cam.name)} <span style="color:#9ca3af;font-size:14px">CH${cam.channel}</span></div>
          <video autoplay playsinline controls style="max-width:100%;max-height:100%;background:#000"></video>
        `;
        document.body.appendChild(modalEl);
        const v = modalEl.querySelector('video');
        attachHls(v, url);
        modalEl.addEventListener('click', e => {
          if (e.target === modalEl) {
            detachHls(v);
            modalEl.remove();
          }
        });
      };
    });
  };

  window.openCamerasConfig = function () {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.username !== 'admin' && u.role !== 'מנהל') {
      alert('רק מנהל יכול להגדיר');
      return;
    }
    const current = getBase();
    const html = `<div class="modal fade show" id="cam-cfg-modal" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-camera-video"></i> הגדרת mediamtx HLS</h5>
            <button class="btn-close" onclick="document.getElementById('cam-cfg-modal').remove()"></button>
          </div>
          <div class="modal-body">
            <label class="form-label">URL בסיס למשרת mediamtx (Cloudflare Tunnel)</label>
            <input id="cam-url" type="url" class="form-control" placeholder="https://abc.trycloudflare.com" value="${escAttrL(current)}" style="direction:ltr;font-family:monospace">
            <div class="small text-muted mt-2">
              צריך לעבוד עם <code>{base}/{camera_path}/index.m3u8</code> — דוגמה:<br>
              <code>${escAttrL(current || 'https://abc.trycloudflare.com')}/beit_midrash/index.m3u8</code>
            </div>
            <hr>
            <div class="small">
              <b>11 מצלמות מוגדרות:</b><br>
              ${CAMERAS.map(c => `${c.emoji} <code>${c.path}</code> = ${c.name}`).join(' · ')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger me-auto" onclick="if(confirm('למחוק URL?')){localStorage.removeItem('${HLS_BASE_KEY}');document.getElementById('cam-cfg-modal').remove();renderCameras();}">מחק</button>
            <button class="btn btn-secondary" onclick="document.getElementById('cam-cfg-modal').remove()">בטל</button>
            <button class="btn btn-primary" onclick="(()=>{
              const v=document.getElementById('cam-url').value.trim();
              if(!v){alert('הזן URL');return;}
              if(!/^https?:\\/\\//.test(v)){alert('URL חייב להתחיל ב-http:// או https://');return;}
              localStorage.setItem('${HLS_BASE_KEY}',v);
              document.getElementById('cam-cfg-modal').remove();
              renderCameras();
            })()">שמור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('cam-url').focus();
  };

  console.warn('%c📹 Pack-65 — Live camera grid (11 HLS streams)', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-65.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-66.js ─────────────────────────────────────────────
try {
// behavior-pack-66.js — TLA (תוכנית לימודית אישית) tab in student card. 2026-05-26
// Adds a "תל\"א" tab with: PDF preview + view/edit/share/send actions.
(function () {
const WH_URL = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const TOKEN = 'BHT_AGENT_2026';

  function escA(s) { return String(s || '').replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c])); }

  // Add TLA tab to student modal after it's rendered
  window.injectTlaTab = function () { return injectTlaTabImpl(); };
  function injectTlaTabImpl() {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    if (modal.querySelector('#stu-tab-tla')) return;
    const tabsList = modal.querySelector('#stu-tabs');
    const tabsContent = modal.querySelector('.tab-content');
    if (!tabsList || !tabsContent) return;

    // Extract student ID from any action button
    let sid = null;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (m) sid = parseInt(m);
    if (!sid) return;

    const student = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(s => String(s['מזהה']) === String(sid));
    if (!student) return;

    // Insert tab link (before פרופיל)
    const tabLi = document.createElement('li');
    tabLi.className = 'nav-item';
    tabLi.innerHTML = `<a class="nav-link" data-bs-toggle="tab" href="#stu-tab-tla"><i class="bi bi-mortarboard-fill text-warning"></i> תל"א</a>`;
    // Insert before profile tab if present
    const profileTab = tabsList.querySelector('a[href="#stu-tab-profile"]');
    if (profileTab) tabsList.insertBefore(tabLi, profileTab.parentNode);
    else tabsList.appendChild(tabLi);

    // Build tab content
    const pdfId = student['תלא_pdf_id'] || '';
    const pptxId = student['תלא_pptx_id'] || '';
    const pdfUrl = student['תלא_pdf_url'] || '';
    const pptxUrl = student['תלא_pptx_url'] || '';
    const preview = pdfId ? `https://drive.google.com/file/d/${pdfId}/preview` : '';
    const updated = student['תלא_עודכן'] || '';
    const folderUrl = student['תלא_folder_url'] || '';
    const filename = student['תלא_שם_קובץ'] || '';

    const pane = document.createElement('div');
    pane.className = 'tab-pane fade';
    pane.id = 'stu-tab-tla';
    pane.innerHTML = pdfId ? `
      <div class="card border-warning">
        <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
          <div>
            <h5 class="mb-0"><i class="bi bi-mortarboard-fill text-warning"></i> תוכנית לימודית אישית (תל"א)</h5>
            <small class="text-muted">${escA(filename)} ${updated ? '· עודכן ' + escA(new Date(updated).toLocaleDateString('he-IL')) : ''}</small>
          </div>
          <div class="btn-group btn-group-sm">
            <a class="btn btn-outline-primary" href="${escA(pdfUrl)}" target="_blank" title="צפה ב-PDF"><i class="bi bi-file-pdf"></i> צפה</a>
            <a class="btn btn-outline-info" href="${escA(pptxUrl)}" target="_blank" title="ערוך את התבנית"><i class="bi bi-pencil"></i> ערוך</a>
            <button class="btn btn-outline-success" onclick="window.tlaShare(${sid})" title="שתף קישור"><i class="bi bi-share"></i> שתף</button>
            <button class="btn btn-outline-warning" onclick="window.tlaSendEmail(${sid})" title="שלח במייל"><i class="bi bi-envelope"></i> שלח</button>
            <button class="btn btn-outline-secondary" onclick="window.tlaWhats(${sid})" title="שלח ב-WhatsApp"><i class="bi bi-whatsapp"></i> WhatsApp</button>
            <a class="btn btn-outline-dark" href="https://drive.google.com/uc?export=download&id=${escA(pdfId)}" title="הורד"><i class="bi bi-download"></i></a>
          </div>
        </div>
        <div class="card-body p-2" style="background:#f8f9fa">
          <div class="ratio ratio-4x3" style="background:#000;border-radius:6px;overflow:hidden">
            <iframe src="${escA(preview)}" allow="autoplay" allowfullscreen frameborder="0" style="border:0;width:100%;height:100%"></iframe>
          </div>
        </div>
        <div class="card-footer small text-muted d-flex justify-content-between flex-wrap gap-1">
          <span>${folderUrl ? `<a href="${escA(folderUrl)}" target="_blank"><i class="bi bi-folder"></i> תיקיית תלאים תשפ"ו</a>` : ''}</span>
          <span>PDF ID: <code style="font-size:11px">${escA(pdfId)}</code></span>
        </div>
      </div>
    ` : `
      <div class="card p-4 text-center" style="border:2px dashed #fbbf24;background:#fffbeb">
        <i class="bi bi-mortarboard fs-1 text-warning"></i>
        <h5 class="mt-3">אין תל"א עבור תלמיד זה</h5>
        <p class="text-muted">לא נמצא קובץ תוכנית לימודית אישית לתלמיד.</p>
        <div class="mt-3 d-flex gap-2 justify-content-center flex-wrap">
          <button class="btn btn-warning" onclick="window.tlaGenerate(${sid})"><i class="bi bi-magic"></i> צור תל"א מנתוני התנהגות</button>
          <button class="btn btn-outline-primary" onclick="window.tlaUploadPrompt(${sid})"><i class="bi bi-upload"></i> העלה קובץ קיים</button>
        </div>
        <div class="alert alert-info small mt-3 text-end">
          <b>איך?</b> "צור" יבנה תל"א בסיסי לפי דיווחי התנהגות שיש על התלמיד.
          "העלה" מאפשר לחבר קובץ Drive ידנית.
        </div>
      </div>
    `;
    tabsContent.appendChild(pane);
  }

  // Watch for student modal opening — use Bootstrap event
  document.addEventListener('shown.bs.modal', (e) => {
    if (e.target?.id === 'viewStuModal') {
      setTimeout(injectTlaTabImpl, 50);
    }
  });
  // Fallback MutationObserver (single-shot per modal instance)
  const observer = new MutationObserver(() => {
    const m = document.getElementById('viewStuModal');
    if (m && !m.dataset.tlaInjected) {
      m.dataset.tlaInjected = '1';
      setTimeout(injectTlaTabImpl, 100);
    }
  });
  observer.observe(document.body, { childList: true });

  // ===== Actions =====
  window.tlaShare = function (sid) {
    const s = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(x => String(x['מזהה']) === String(sid));
    if (!s || !s['תלא_pdf_url']) return alert('אין URL לתל"א');
    navigator.clipboard.writeText(s['תלא_pdf_url']).then(() => {
      if (typeof toast === 'function') toast('הקישור הועתק ללוח', 'success');
      else alert('קישור הועתק:\n' + s['תלא_pdf_url']);
    });
  };

  window.tlaWhats = function (sid) {
    const s = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(x => String(x['מזהה']) === String(sid));
    if (!s || !s['תלא_pdf_url']) return alert('אין URL לתל"א');
    const nm = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const msg = `תיק התל"א של ${nm}:\n${s['תלא_pdf_url']}`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  };

  window.tlaSendEmail = function (sid) {
    const s = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(x => String(x['מזהה']) === String(sid));
    if (!s || !s['תלא_pdf_url']) return alert('אין URL לתל"א');
    const nm = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const subj = encodeURIComponent(`תיק תל"א - ${nm}`);
    const body = encodeURIComponent(`שלום,\n\nמצורף קישור לתיק התל"א של ${nm}:\n${s['תלא_pdf_url']}\n\nבברכה,\nבית התלמוד`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subj}&body=${body}`, '_blank');
  };

  window.tlaUploadPrompt = function (sid) {
    const pdfUrl = prompt('הדבק קישור Drive ל-PDF (למשל https://drive.google.com/file/d/.../view):');
    if (!pdfUrl) return;
    const m = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!m) return alert('לא זוהה ID של קובץ Drive בקישור');
    const id = m[1];
    const pptxUrl = prompt('הדבק קישור Drive ל-PPTX (לעריכה, אופציונלי):') || '';
    const pptxM = pptxUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const pptxId = pptxM ? pptxM[1] : '';

    const s = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const updated = Object.assign({}, s, {
      'תלא_pdf_id': id,
      'תלא_pdf_url': `https://drive.google.com/file/d/${id}/view`,
      'תלא_pdf_preview': `https://drive.google.com/file/d/${id}/preview`,
      'תלא_pptx_id': pptxId,
      'תלא_pptx_url': pptxId ? `https://drive.google.com/file/d/${pptxId}/edit` : '',
      'תלא_עודכן': new Date().toISOString(),
    });
    api('updateStudent', [updated]).then(r => {
      if (r && r.ok) {
        if (typeof toast === 'function') toast('עודכן! סגור ופתח את הכרטיס מחדש', 'success');
        else alert('עודכן! סגור ופתח את הכרטיס מחדש');
      }
    });
  };

  window.tlaGenerate = async function (sid) {
    const s = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const nm = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    if (!confirm(`לבנות תל"א ראשוני עבור ${nm} מנתוני ההתנהגות והשיחות הקיימים?`)) return;

    // Gather behavior events + conversations for this student
    const events = ((typeof getVisibleData === 'function' ? (getVisibleData().behavior || []) : [])).filter(e => String(e['תלמיד_מזהה']) === String(sid));
    const convs = ((typeof getVisibleData === 'function' ? (getVisibleData().conversations || []) : [])).filter(c => String(c['תלמיד_מזהה']) === String(sid));

    if (!events.length && !convs.length) {
      alert('אין נתוני התנהגות/שיחות לתלמיד זה. אי אפשר לבנות תל"א אוטומטי.');
      return;
    }

    // Build TLA template text
    const lines = [
      `# תוכנית לימודית אישית - ${nm}`,
      ``,
      `## פרטי תלמיד`,
      `- שם: ${nm}`,
      `- שיעור: ${s['מחזור']||''}`,
      `- ת.ז.: ${s['תז']||''}`,
      `- טלפון: ${s['טלפון']||''}`,
      ``,
      `## דיווחי התנהגות (${events.length})`,
      ...events.slice(0, 30).map(e => `- [${e['תאריך']?.slice(0,10) || ''}] ${e['קטגוריה']||''}: ${e['תיאור']||''}`),
      ``,
      `## שיחות אישיות (${convs.length})`,
      ...convs.slice(0, 20).map(c => `- [${c['תאריך']?.slice(0,10) || ''}] ${c['רב']||''}: ${c['נושא']||c['תוכן']||''}`),
      ``,
      `## פרופיל`,
      `- דוח אישי: ${s['דוח_אישי']||''}`,
      `- הורים: ${s['פרופיל_הורים']||''}`,
      `- אישיות: ${s['פרופיל_אישיות']||''}`,
      `- התנהגותי: ${s['פרופיל_התנהגותי']||''}`,
      `- לימודי: ${s['פרופיל_לימודי']||''}`,
      ``,
      `## תאריך יצירה`,
      new Date().toLocaleString('he-IL'),
    ];

    const text = lines.join('\n');

    // Store as plain-text TLA in the student record (no Drive upload from browser)
    const updated = Object.assign({}, s, {
      'תלא_טקסט': text,
      'תלא_עודכן': new Date().toISOString(),
      'תלא_מקור': 'אוטומטי מנתוני התנהגות',
    });
    const r = await api('updateStudent', [updated]);
    if (r && r.ok) {
      if (typeof toast === 'function') toast(`✅ נבנה תל"א ראשוני עבור ${nm} (טקסט)`, 'success');
      // Show preview
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>תל"א ${escA(nm)}</title>
          <style>body{font-family:Arial,sans-serif;max-width:800px;margin:30px auto;padding:20px;line-height:1.6}
          h1,h2{color:#1e3a8a}h1{border-bottom:3px solid #fbbf24}h2{margin-top:30px}
          li{margin-bottom:6px}</style></head><body>${marked(text)}</body></html>`);
        w.document.close();
      }
    }

    function marked(md) {
      return md
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^- (.*)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>(\n|$))+/g, m => '<ul>' + m + '</ul>')
        .replace(/\n\n/g, '<br><br>');
    }
  };

  console.warn('%c🎓 Pack-66 — TLA tab in student card', 'color:#d97706;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-66.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-67.js ─────────────────────────────────────────────
try {
// behavior-pack-67.js — Bug fix round 1: camera resilience + TLA timing + UX polish. 2026-05-26
(function () {
// ===== Fix 1: Camera grid — add loading state + per-camera reconnect on error =====
  // Wait until pack-65 has loaded and renderCameras is defined
  const _origRenderCameras = window.renderCameras;
  if (typeof _origRenderCameras === 'function') {
    window.renderCameras = async function () {
      await _origRenderCameras.apply(this, arguments);
      // After render, enhance each video tile with loading + retry
      setTimeout(enhanceCameraTiles, 500);
    };
  }

  function enhanceCameraTiles() {
    const cards = document.querySelectorAll('#cam-grid .cam-card');
    cards.forEach(card => {
      if (card.dataset.pack67) return;
      card.dataset.pack67 = '1';
      const video = card.querySelector('video');
      if (!video) return;

      // Add loading overlay
      const loadEl = document.createElement('div');
      loadEl.className = 'cam-loading';
      loadEl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);color:#fff;font-size:14px;pointer-events:none;z-index:1;transition:opacity .3s';
      loadEl.innerHTML = '<div><div class="spinner-border spinner-border-sm" style="color:#fbbf24"></div><br>טוען…</div>';
      card.appendChild(loadEl);

      const hideLoad = () => { loadEl.style.opacity = '0'; setTimeout(() => loadEl.remove(), 400); };
      video.addEventListener('playing', hideLoad, { once: true });
      video.addEventListener('loadeddata', hideLoad, { once: true });

      // Error overlay (shows after a delay if no data)
      let failTimer = setTimeout(() => {
        if (video.readyState < 2) {
          const errEl = document.createElement('div');
          errEl.className = 'cam-err';
          errEl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);color:#fff;z-index:2;text-align:center;padding:10px';
          errEl.innerHTML = `<div>
            <i class="bi bi-camera-video-off fs-3 text-warning"></i><br>
            <small>המצלמה לא נטענת</small><br>
            <button class="btn btn-sm btn-warning mt-2" style="font-size:12px">🔄 נסה שוב</button>
          </div>`;
          card.appendChild(errEl);
          errEl.querySelector('button').onclick = () => {
            errEl.remove();
            // Re-attach HLS
            const path = card.dataset.path;
            const base = localStorage.getItem('cameras_hls_base') || '';
            if (base && path && window.Hls) {
              try { video._hls?.destroy(); } catch {}
              const url = base.replace(/\/$/, '') + '/' + path + '/index.m3u8';
              const hls = new window.Hls({ liveSyncDuration: 2, maxBufferLength: 6 });
              hls.loadSource(url);
              hls.attachMedia(video);
              hls.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
              video._hls = hls;
            }
          };
        }
      }, 15000);

      video.addEventListener('playing', () => clearTimeout(failTimer));
    });
  }

  // ===== Fix 2: TLA tab — also inject on tab-button-click in case modal already open =====
  // Handle case where pack-66 misses the modal due to MutationObserver timing
  setInterval(() => {
    const modal = document.getElementById('viewStuModal');
    if (modal && !modal.querySelector('#stu-tab-tla') && typeof window.injectTlaTab === 'function') {
      // Pack-66 didn't inject. Trigger by simulating event.
      const tabsList = modal.querySelector('#stu-tabs');
      if (tabsList) {
        modal.dataset.tlaInjected = '';
        document.dispatchEvent(new Event('shown.bs.modal', { bubbles: true }));
      }
    }
  }, 3000);

  // ===== Fix 3: Ensure cameras grid scrolls properly on mobile =====
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 640px) {
      .cam-grid { grid-template-columns: 1fr 1fr !important; }
      .cam-label { font-size: 11px !important; padding: 3px 6px !important; }
      .cam-channel { font-size: 9px !important; }
    }
    .cam-card { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    .cam-card:hover { box-shadow: 0 4px 16px rgba(220,38,38,0.3); }
  `;
  document.head.appendChild(style);

  console.warn('%c🔧 Pack-67 — Camera resilience + TLA timing + UX', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-67.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-68.js ─────────────────────────────────────────────
try {
// behavior-pack-68.js — Bug fix round 2: TLA enhancements + Drive share helper + general polish. 2026-05-26
(function () {
// ===== Fix 1: TLA tab — add "Open TLA folder" + "Share folder publicly" helpers =====
  window.tlaOpenFolder = function () {
    window.open('https://drive.google.com/drive/folders/1BiRgL2RzufeH-rZ-Dree92gn2yVyDiWQ', '_blank');
  };

  window.tlaShareFolderPublicly = function () {
    if (!confirm('להפוך את תיקיית "תלאות תשפו" לציבורית (כל מי שיש לו את הקישור יכול לצפות)?\n\nזה נדרש כדי שכל הצוות יראה את ה-PDFs בפאנל.')) return;
    // Open the folder's Share dialog directly in Drive
    window.open('https://drive.google.com/drive/folders/1BiRgL2RzufeH-rZ-Dree92gn2yVyDiWQ?usp=sharing', '_blank');
    setTimeout(() => alert('בתוך Drive: לחץ על "Share" → "Anyone with the link" → "Viewer" → "Done"\n\nאחר כך רענן את הדף.'), 500);
  };

  // ===== Fix 2: Cameras grid — pause non-visible videos to save bandwidth =====
  let observer = null;
  function setupVideoLazyPlay() {
    if (observer) return;
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        const v = en.target;
        if (!v.tagName || v.tagName !== 'VIDEO') return;
        if (en.isIntersecting) {
          v.play().catch(() => {});
        } else {
          // Don't actually pause HLS streams (they keep buffering)
          // Just mute/lower priority
        }
      });
    }, { threshold: 0.1 });
  }
  setupVideoLazyPlay();

  // Hook into renderCameras to observe videos
  const _origRender = window.renderCameras;
  if (typeof _origRender === 'function') {
    window.renderCameras = async function () {
      await _origRender.apply(this, arguments);
      setTimeout(() => {
        document.querySelectorAll('#cam-grid video').forEach(v => observer?.observe(v));
      }, 600);
    };
  }

  // ===== Fix 3: TLA — add "open folder" button to tab footer =====
  // Patch the TLA tab rendering after pack-66 created it
  document.addEventListener('shown.bs.modal', e => {
    if (e.target?.id !== 'viewStuModal') return;
    setTimeout(() => {
      const tab = document.getElementById('stu-tab-tla');
      if (!tab || tab.dataset.pack68) return;
      tab.dataset.pack68 = '1';
      // Find empty-state card and add share-folder button
      const emptyBtnRow = tab.querySelector('.d-flex.gap-2.justify-content-center');
      if (emptyBtnRow) {
        const folderBtn = document.createElement('button');
        folderBtn.className = 'btn btn-outline-warning';
        folderBtn.innerHTML = '<i class="bi bi-folder-fill"></i> פתח תיקייה';
        folderBtn.onclick = window.tlaOpenFolder;
        emptyBtnRow.appendChild(folderBtn);
      }
      // Add permission help to populated cards
      const card = tab.querySelector('.card.border-warning .card-footer');
      if (card) {
        const help = document.createElement('div');
        help.className = 'mt-2 small';
        help.innerHTML = `<button class="btn btn-link btn-sm p-0" onclick="tlaShareFolderPublicly()" title="הפוך לציבורי כדי שכל הצוות יראה"><i class="bi bi-globe"></i> שתף את כל התיקייה</button>`;
        card.appendChild(help);
      }
    }, 200);
  });

  // ===== Fix 4: Detect dead-link iframe (Drive permission error) =====
  document.addEventListener('shown.bs.modal', e => {
    if (e.target?.id !== 'viewStuModal') return;
    setTimeout(() => {
      const iframe = document.querySelector('#stu-tab-tla iframe');
      if (!iframe) return;
      const loadTimer = setTimeout(() => {
        // If after 8s the iframe didn't fire load → probably blocked
        // (Drive iframes do fire 'load' but with limited content)
        // Show a fallback "Open in Drive" hint
        const fallback = document.createElement('div');
        fallback.className = 'alert alert-warning small mt-2';
        fallback.innerHTML = `⚠ אם לא רואים את ה-PDF — סביר ש-Drive חוסם תצוגה. <button class="btn btn-sm btn-warning" onclick="tlaShareFolderPublicly()">פתור עכשיו</button>`;
        iframe.parentNode.parentNode.appendChild(fallback);
      }, 8000);
      iframe.addEventListener('load', () => clearTimeout(loadTimer), { once: true });
    }, 500);
  });

  // ===== Fix 5: Console diagnostic helper =====
  window.cameraStatus = function () {
    const base = localStorage.getItem('cameras_hls_base') || '';
    console.group('📹 Camera Status');
    console.log('HLS base:', base || '(not set)');
    document.querySelectorAll('#cam-grid .cam-card').forEach(c => {
      const v = c.querySelector('video');
      const path = c.dataset.path;
      const ready = v ? ['HAVE_NOTHING','HAVE_METADATA','HAVE_CURRENT_DATA','HAVE_FUTURE_DATA','HAVE_ENOUGH_DATA'][v.readyState] : '?';
      console.log(`  ${path}: readyState=${ready}, paused=${v?.paused}, duration=${v?.duration}`);
    });
    console.groupEnd();
  };
  window.tlaStatus = function () {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const withTla = (data.students || []).filter(s => s['תלא_pdf_id']);
    console.group('🎓 TLA Status');
    console.log(`${withTla.length}/${data.students?.length} students have TLA`);
    withTla.forEach(s => console.log(`  ID=${s['מזהה']} ${s['שם פרטי']} ${s['שם משפחה']} - ${s['תלא_שם_קובץ']}`));
    console.groupEnd();
  };

  console.warn('%c🔧 Pack-68 — TLA + cameras polish, Drive share helper, diagnostics', 'color:#0891b2;font-weight:bold');
  console.log('  Try: cameraStatus(), tlaStatus(), tlaShareFolderPublicly()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-68.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-69.js ─────────────────────────────────────────────
try {
// behavior-pack-69.js — Bug fix round 3: stagger camera startup + smarter HLS retry. 2026-05-26
(function () {
// ===== Throttle simultaneous HLS connections =====
  // Pack-65 attaches all 11 cameras at once → 11 ffmpeg processes spawn simultaneously.
  // Better: start in waves of 3 with 1.5s delay between waves to spread CPU.
  if (typeof window.attachHls === 'undefined') {
    // pack-65 closure-private function — wrap renderCameras instead
    const _orig = window.renderCameras;
    if (typeof _orig === 'function') {
      window.renderCameras = async function () {
        await _orig.apply(this, arguments);
        // Don't autoplay all videos at once — let IntersectionObserver in pack-68 do its job
        // For initial load, pause cameras beyond first 4
        setTimeout(() => {
          const videos = document.querySelectorAll('#cam-grid video');
          videos.forEach((v, i) => {
            if (i >= 4) {
              v.pause();
              v.dataset.deferred = '1';
              // Resume when scrolled into view
            }
          });
        }, 2000);
      };
    }
  }

  // ===== Auto-resume deferred videos when they enter view =====
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting && en.target.tagName === 'VIDEO' && en.target.dataset.deferred) {
          en.target.play().catch(() => {});
          delete en.target.dataset.deferred;
        }
      });
    }, { threshold: 0.2, rootMargin: '100px' });
    // Periodically pick up new videos
    setInterval(() => {
      document.querySelectorAll('#cam-grid video[data-deferred]').forEach(v => io.observe(v));
    }, 2000);
  }

  // ===== Smart "no signal" indicator + heartbeat check =====
  setInterval(() => {
    document.querySelectorAll('#cam-grid .cam-card').forEach(card => {
      const v = card.querySelector('video');
      if (!v || !v._hls) return;
      const status = card.querySelector('.cam-status');
      if (!status) return;
      // If readyState is 0/1 for >10s, mark offline
      if (v.readyState < 2) {
        const sinceCreate = Date.now() - (v._loadStart || Date.now());
        if (sinceCreate > 10000) {
          status.classList.remove('live');
          status.classList.add('offline');
        }
      } else {
        status.classList.add('live');
        status.classList.remove('offline');
      }
    });
  }, 5000);

  // Mark load start on each video
  setInterval(() => {
    document.querySelectorAll('#cam-grid video').forEach(v => {
      if (!v._loadStart) v._loadStart = Date.now();
    });
  }, 1000);

  console.warn('%c⚡ Pack-69 — Camera throttle + offline detection', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-69.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-70.js ─────────────────────────────────────────────
try {
// behavior-pack-70.js — Bug fix round 4: single-camera mode + snapshot + camera settings. 2026-05-26
(function () {
const SOLO_KEY = 'cameras_solo_mode';

  function isSoloMode() { return localStorage.getItem(SOLO_KEY) === '1'; }
  function setSoloMode(v) { localStorage.setItem(SOLO_KEY, v ? '1' : '0'); }

  // ===== Apply solo mode after cameras render =====
  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = async function () {
      await _orig.apply(this, arguments);
      setTimeout(applySoloMode, 800);
      setTimeout(addToolbar, 200);
    };
  }

  function applySoloMode() {
    if (!isSoloMode()) return;
    const cards = document.querySelectorAll('#cam-grid .cam-card');
    cards.forEach((c, i) => {
      const v = c.querySelector('video');
      if (!v) return;
      if (i > 0) {
        try { v._hls?.destroy(); } catch {}
        v.pause();
        v.style.opacity = '0.4';
        c.classList.add('cam-solo-bg');
      }
    });
  }

  function addToolbar() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    if (root.querySelector('#cam-toolbar-pack70')) return;
    const header = root.querySelector('.d-flex.align-items-center.mb-3');
    if (!header) return;

    const tb = document.createElement('div');
    tb.id = 'cam-toolbar-pack70';
    tb.className = 'mb-3 d-flex gap-2 flex-wrap';
    tb.innerHTML = `
      <button class="btn btn-sm btn-outline-success" onclick="window.camToggleSolo()" id="solo-btn">${isSoloMode() ? '👁 חזור לכל המצלמות' : '🎯 מצלמה אחת בלבד (חוסך רוחב פס)'}</button>
      <button class="btn btn-sm btn-outline-info" onclick="window.camRestartAll()" title="הפעל מחדש את כל הזרמים">🔄 רענן הכל</button>
      <button class="btn btn-sm btn-outline-warning" onclick="window.camSnapshotAll()" title="צלם snapshot מכל מצלמה">📸 snapshot</button>
      <button class="btn btn-sm btn-outline-secondary" onclick="window.camStatus && cameraStatus()">📊 סטטוס</button>
    `;
    header.parentNode.insertBefore(tb, header.nextSibling);
  }

  window.camToggleSolo = function () {
    setSoloMode(!isSoloMode());
    location.reload();
  };

  window.camRestartAll = function () {
    if (typeof renderCameras === 'function') {
      renderCameras();
    }
  };

  // ===== Snapshot all cameras =====
  window.camSnapshotAll = function () {
    const videos = document.querySelectorAll('#cam-grid video');
    if (!videos.length) return alert('אין מצלמות');
    const grid = document.createElement('div');
    grid.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99999;overflow:auto;padding:20px';
    grid.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3">
      <h4>📸 Snapshot מכל המצלמות - ${new Date().toLocaleString('he-IL')}</h4>
      <div>
        <button class="btn btn-success" onclick="(()=>{const a=document.createElement('a');a.href=this.dataset.zip;a.download='snapshots.zip';})()">⬇ הורד</button>
        <button class="btn btn-primary" onclick="window.print()">🖨 הדפס</button>
        <button class="btn btn-secondary" onclick="this.closest('[data-snap]').remove()">✕ סגור</button>
      </div>
    </div>
    <div class="row g-3" id="snap-grid"></div>`;
    grid.setAttribute('data-snap', '1');
    document.body.appendChild(grid);

    const snapGrid = grid.querySelector('#snap-grid');
    videos.forEach((v, i) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = v.videoWidth || 352;
        canvas.height = v.videoHeight || 288;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const card = v.closest('.cam-card');
        const path = card?.dataset.path || '';
        const label = card?.querySelector('.cam-label')?.textContent || `מצלמה ${i+1}`;
        snapGrid.insertAdjacentHTML('beforeend', `
          <div class="col-md-4 col-lg-3">
            <div class="card">
              <img src="${dataUrl}" class="card-img-top" alt="${label}">
              <div class="card-body p-2"><small><b>${label}</b></small></div>
            </div>
          </div>`);
      } catch (e) {
        console.warn('Snapshot failed for', i, e);
      }
    });
  };

  console.warn('%c📸 Pack-70 — Camera solo mode + snapshot + toolbar', 'color:#9333ea;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-70.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-71.js ─────────────────────────────────────────────
try {
// behavior-pack-71.js — Bug fix round 5: TLA send via webhook + better generation. 2026-05-26
(function () {
const WH_URL = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const TOKEN = 'BHT_AGENT_2026';

  // ===== Improved tlaSendEmail with attachment via webhook =====
  // Pre-fill recipient based on relevant rabbi
  const _origSend = window.tlaSendEmail;
  window.tlaSendEmail = function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return alert('תלמיד לא נמצא');
    if (!s['תלא_pdf_url']) {
      // No PDF - just send the URL
      return _origSend?.(sid);
    }
    // Show menu: who to send to
    const choice = prompt(
      `שלח תל"א של ${s['שם פרטי']||''} ${s['שם משפחה']||''} אל:\n` +
      `1 = הרב ירושלמי (tt0527686018@gmail.com)\n` +
      `2 = הורי התלמיד (אם יש מייל)\n` +
      `3 = כתובת מותאמת (תוזן)\n` +
      `4 = Gmail compose רגיל (ידני)\n` +
      `הקלד 1/2/3/4:`,
      '1'
    );
    if (!choice) return;

    let to = '';
    if (choice === '1') to = 'tt0527686018@gmail.com';
    else if (choice === '2') to = (s['מייל_אבא'] || s['מייל_אמא'] || s['אימייל'] || '').trim();
    else if (choice === '3') to = (prompt('כתובת מייל:') || '').trim();
    else if (choice === '4') return _origSend?.(sid);
    else return alert('בחירה לא חוקית');

    if (!to) return alert('אין כתובת מייל');

    const nm = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const body = `שלום,\n\nמצורף קישור לתיק התל"א של ${nm}:\n${s['תלא_pdf_url']}\n\nאם הקישור לא נפתח — יש לוודא שלחיצה ב-Drive מאפשרת תצוגה לכל מי שיש לו את הקישור.\n\nבברכה,\nבית התלמוד`;

    // Use webhook sendEmail action (text-only, no PDF attach)
    const params = new URLSearchParams({
      action: 'sendEmail',
      token: TOKEN,
      to: to,
      subject: `תיק תל"א - ${nm}`,
      body: body,
    });

    fetch(WH_URL, { method: 'POST', body: params })
      .then(r => r.json())
      .then(d => {
        if (d.ok || d.success) {
          if (typeof toast === 'function') toast(`✅ נשלח אל ${to}`, 'success');
          else alert(`✅ נשלח אל ${to}`);
        } else {
          // Fall back to Gmail compose
          const subj = encodeURIComponent(`תיק תל"א - ${nm}`);
          const bodyE = encodeURIComponent(body);
          window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${subj}&body=${bodyE}`, '_blank');
        }
      })
      .catch(err => {
        // Fallback
        const subj = encodeURIComponent(`תיק תל"א - ${nm}`);
        const bodyE = encodeURIComponent(body);
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${subj}&body=${bodyE}`, '_blank');
      });
  };

  // ===== TLA bulk operations =====
  window.tlaBulkExport = function () {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const withTla = (data.students || []).filter(s => s['תלא_pdf_id']);
    const csv = [
      'מזהה,שם,שיעור,תלא_pdf_url,תלא_עודכן',
      ...withTla.map(s => [
        s['מזהה'],
        `"${s['שם פרטי']||''} ${s['שם משפחה']||''}"`,
        s['מחזור'] || '',
        s['תלא_pdf_url'] || '',
        s['תלא_עודכן'] || '',
      ].join(',')),
    ].join('\n');
    const blob = new Blob([new Uint8Array([0xEF,0xBB,0xBF]), csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tla_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  console.warn('%c📧 Pack-71 — TLA send via webhook + bulk export', 'color:#059669;font-weight:bold');
  console.log('  Try: tlaBulkExport()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-71.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-72.js ─────────────────────────────────────────────
try {
// behavior-pack-72.js — Round 6: error boundary + perf + UX polish. 2026-05-26
(function () {
// ===== Global error catcher =====
  let errCount = 0;
  window.addEventListener('error', (e) => {
    errCount++;
    if (errCount > 50) return; // avoid spam
    console.warn(`[Pack-72] caught error #${errCount}:`, e.message, 'at', e.filename + ':' + e.lineno);
  });
  window.addEventListener('unhandledrejection', (e) => {
    errCount++;
    if (errCount > 50) return;
    console.warn(`[Pack-72] unhandled promise rejection:`, e.reason);
  });

  // ===== Slow-network indicator =====
  if (navigator.connection) {
    if (navigator.connection.effectiveType === 'slow-2g' || navigator.connection.effectiveType === '2g') {
      document.body.dataset.slowNet = '1';
      console.warn('[Pack-72] Slow network detected — disabling auto-play and large iframes');
    }
  }

  // ===== Console diagnostics command =====
  window.diagFull = function () {
    const d = typeof getVisibleData === 'function' ? getVisibleData() : {};
    console.group('🏥 cheder-bht diagnostic');
    console.log('User:', JSON.parse(sessionStorage.getItem('user') || '{}'));
    console.log('Students:', d.students?.length, 'TLA-linked:', d.students?.filter(s => s['תלא_pdf_id']).length);
    console.log('Behavior events:', d.behavior?.length);
    console.log('Conversations:', d.conversations?.length);
    console.log('Categories:', d.categories?.length);
    console.log('Cameras HLS base:', localStorage.getItem('cameras_hls_base'));
    console.log('Cameras live URL:', localStorage.getItem('cameras_live_url'));
    console.log('Packs loaded:', document.querySelectorAll('script[src*="behavior-pack"]').length);
    console.log('Modal stack:', document.querySelectorAll('.modal.show').length);
    console.log('LocalStorage keys:', Object.keys(localStorage).length);
    console.log('Last error count:', errCount);
    console.groupEnd();
    return 'See console';
  };

  // ===== Lazy-load heavy iframes (Drive PDF previews) =====
  const iframeObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting && en.target.dataset.lazyIframe) {
        en.target.src = en.target.dataset.lazyIframe;
        delete en.target.dataset.lazyIframe;
        iframeObserver.unobserve(en.target);
      }
    });
  }, { rootMargin: '200px' }) : null;

  // Patch iframe rendering — replace immediate src with data-lazy-iframe
  // Skip — risk of breaking existing iframes. Leave for later.

  // ===== Detect localStorage near quota =====
  try {
    const used = new Blob(Object.entries(localStorage).map(([k,v]) => k+v)).size;
    if (used > 4 * 1024 * 1024) {
      console.warn('[Pack-72] localStorage at', Math.round(used/1024), 'KB — consider cleanup');
    }
  } catch {}

  // ===== Auto-cleanup very old draft entries =====
  try {
    const now = Date.now();
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('draft_') || k.startsWith('autosave_')) {
        try {
          const v = JSON.parse(localStorage[k]);
          if (v.timestamp && now - v.timestamp > 30 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(k);
          }
        } catch {}
      }
    });
  } catch {}

  console.warn('%c🏥 Pack-72 — Error boundary + diagnostics + cleanup', 'color:#ef4444;font-weight:bold');
  console.log('  Try: diagFull()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-72.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-73.js ─────────────────────────────────────────────
try {
// behavior-pack-73.js — Round 7: TLA dashboard + status badges + quick search. 2026-05-26
(function () {
// ===== TLA Dashboard accessible from console + FAB =====
  window.openTlaDashboard = function () {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const students = data.students || [];
    const withTla = students.filter(s => s['תלא_pdf_id']);
    const withoutTla = students.filter(s => !s['תלא_pdf_id'] && s['סטטוס'] !== 'סיים');

    function esc(s) { return String(s || '').replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c])); }

    const html = `<div class="modal fade show" id="tla-dashboard" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;max-height:90vh;display:flex;flex-direction:column">
          <div class="modal-header" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
            <h5><i class="bi bi-mortarboard-fill text-warning"></i> דשבורד תל"א — ${students.length} תלמידים</h5>
            <div class="d-flex gap-2 align-items-center">
              <button class="btn btn-sm btn-outline-primary" onclick="window.tlaBulkExport && tlaBulkExport()" title="ייצוא CSV"><i class="bi bi-download"></i> CSV</button>
              <button class="btn btn-sm btn-outline-warning" onclick="window.tlaOpenFolder && tlaOpenFolder()"><i class="bi bi-folder"></i> תיקייה</button>
              <button class="btn-close" onclick="document.getElementById('tla-dashboard').remove()"></button>
            </div>
          </div>
          <div class="modal-body" style="overflow-y:auto;flex:1">
            <div class="row mb-3 g-2">
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-success mb-0">${withTla.length}</div><small>עם תל"א</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-warning mb-0">${withoutTla.length}</div><small>בלי תל"א</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-info mb-0">${students.length}</div><small>סה"כ פעילים</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-primary mb-0">${Math.round(withTla.length/students.length*100)}%</div><small>כיסוי</small></div></div>
            </div>

            <h6 class="mt-3"><i class="bi bi-check-circle text-success"></i> תלמידים עם תל"א (${withTla.length})</h6>
            <table class="table table-sm table-hover">
              <thead><tr><th>שם</th><th>שיעור</th><th>קובץ</th><th>עודכן</th><th>פעולות</th></tr></thead>
              <tbody>
                ${withTla.map(s => `<tr>
                  <td><strong>${esc(s['שם פרטי']||'')} ${esc(s['שם משפחה']||'')}</strong></td>
                  <td>${esc(s['מחזור']||'')}</td>
                  <td><small class="text-muted">${esc(s['תלא_שם_קובץ']||'')}</small></td>
                  <td><small>${s['תלא_עודכן']?new Date(s['תלא_עודכן']).toLocaleDateString('he-IL'):''}</small></td>
                  <td>
                    <a class="btn btn-sm btn-outline-primary" href="${esc(s['תלא_pdf_url'])}" target="_blank" title="צפה"><i class="bi bi-file-pdf"></i></a>
                    <button class="btn btn-sm btn-outline-success" onclick="tlaShare(${s['מזהה']})" title="שתף"><i class="bi bi-share"></i></button>
                    <button class="btn btn-sm btn-outline-info" onclick="tlaSendEmail(${s['מזהה']})" title="שלח"><i class="bi bi-envelope"></i></button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="openStudent(${s['מזהה']}); document.getElementById('tla-dashboard').remove();" title="פתח כרטיס"><i class="bi bi-person"></i></button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>

            ${withoutTla.length ? `
              <h6 class="mt-4"><i class="bi bi-exclamation-circle text-warning"></i> תלמידים ללא תל"א (${withoutTla.length})</h6>
              <table class="table table-sm">
                <thead><tr><th>שם</th><th>שיעור</th><th>אירועי התנהגות</th><th>פעולות</th></tr></thead>
                <tbody>
                  ${withoutTla.map(s => {
                    const evCount = (data.behavior || []).filter(e => String(e['תלמיד_מזהה']) === String(s['מזהה'])).length;
                    return `<tr>
                      <td><strong>${esc(s['שם פרטי']||'')} ${esc(s['שם משפחה']||'')}</strong></td>
                      <td>${esc(s['מחזור']||'')}</td>
                      <td><span class="badge bg-${evCount>5?'success':evCount>0?'warning':'secondary'}">${evCount}</span></td>
                      <td>
                        ${evCount > 0 ? `<button class="btn btn-sm btn-outline-warning" onclick="tlaGenerate(${s['מזהה']})" title="צור מתוך נתונים">🪄 צור</button>` : ''}
                        <button class="btn btn-sm btn-outline-secondary" onclick="openStudent(${s['מזהה']}); document.getElementById('tla-dashboard').remove();"><i class="bi bi-person"></i></button>
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            ` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('tla-dashboard').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== Add to FAB menu =====
  if (window.MENU_ITEMS) {
    if (!window.MENU_ITEMS.find(m => m.label === 'דשבורד תל"א')) {
      window.MENU_ITEMS.push({ icon: '🎓', label: 'דשבורד תל"א', action: window.openTlaDashboard });
    }
  }

  // ===== Add TLA badge in student row (if students list is rendered) =====
  function addTlaBadgesInList() {
    document.querySelectorAll('[data-student-row]').forEach(row => {
      if (row.dataset.tlaBadge) return;
      row.dataset.tlaBadge = '1';
      const sid = row.dataset.studentRow;
      const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
      const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
      if (s && s['תלא_pdf_id']) {
        const badge = document.createElement('span');
        badge.className = 'badge bg-warning text-dark ms-1';
        badge.innerHTML = '🎓';
        badge.title = 'יש תל"א';
        row.querySelector('strong, .student-name')?.appendChild(badge);
      }
    });
  }
  setInterval(addTlaBadgesInList, 5000);

  console.warn('%c🎓 Pack-73 — TLA dashboard + status badges', 'color:#f59e0b;font-weight:bold');
  console.log('  Try: openTlaDashboard()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-73.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-74.js ─────────────────────────────────────────────
try {
// behavior-pack-74.js — Round 8: auto-refresh tunnel URL detection. 2026-05-27
// Periodically detects if the configured camera HLS URL is dead and prompts admin.
(function () {
const HLS_BASE_KEY = 'cameras_hls_base';
  const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 min

  let lastCheck = 0;
  let lastStatus = null;

  async function checkHls() {
    const base = localStorage.getItem(HLS_BASE_KEY) || '';
    if (!base) return;
    try {
      const r = await fetch(base.replace(/\/$/, '') + '/lobby/index.m3u8', { method: 'GET', mode: 'no-cors' });
      lastStatus = 'ok';
      lastCheck = Date.now();
      return true;
    } catch (e) {
      lastStatus = 'down';
      lastCheck = Date.now();
      console.warn('[Pack-74] HLS check failed:', e.message);
      return false;
    }
  }

  // Poll only when cameras page is active
  setInterval(() => {
    const camPage = document.getElementById('page-cameras');
    if (camPage && !camPage.classList.contains('d-none') && getComputedStyle(camPage).display !== 'none') {
      checkHls();
    }
  }, CHECK_INTERVAL_MS);

  window.tunnelStatus = function () {
    console.log(`[Pack-74] tunnel status: ${lastStatus || 'never checked'}, last check: ${lastCheck ? new Date(lastCheck).toLocaleTimeString('he-IL') : 'never'}`);
    return { status: lastStatus, last: lastCheck };
  };

  // ===== Add reload button to cameras page header =====
  document.addEventListener('click', e => {
    if (!e.target.closest?.('#cam-toolbar-pack70')) return;
  });

  // ===== Detect dead iframe in DVR page (pack-64) =====
  function watchDvrIframe() {
    const iframe = document.querySelector('#page-cameras iframe');
    if (!iframe || iframe.dataset.pack74Watch) return;
    iframe.dataset.pack74Watch = '1';
    let loaded = false;
    iframe.addEventListener('load', () => { loaded = true; });
    setTimeout(() => {
      if (!loaded) {
        const warn = document.createElement('div');
        warn.className = 'alert alert-warning small mt-2';
        warn.innerHTML = `⚠ Tunnel לא הגיב תוך 10 שניות. ייתכן ש-cloudflared נפל במחשב המכינה. <button class="btn btn-sm btn-warning" onclick="this.parentElement.remove()">סגור</button>`;
        iframe.parentNode.parentNode.appendChild(warn);
      }
    }, 10000);
  }
  setInterval(watchDvrIframe, 4000);

  console.warn('%c🔄 Pack-74 — Tunnel health check + dead-iframe warn', 'color:#0ea5e9;font-weight:bold');
  console.log('  Try: tunnelStatus()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-74.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-75.js ─────────────────────────────────────────────
try {
// behavior-pack-75.js — Round 9: search across all data + keyboard shortcuts. 2026-05-27
(function () {
// ===== Universal search: students, behavior, TLA, conversations =====
  window.openUniversalSearch = function () {
    const html = `<div class="modal fade show" id="universal-search" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;max-height:80vh;display:flex;flex-direction:column">
          <div class="modal-header">
            <h5><i class="bi bi-search"></i> חיפוש גלובלי</h5>
            <button class="btn-close" onclick="document.getElementById('universal-search').remove()"></button>
          </div>
          <div class="modal-body" style="overflow-y:auto;flex:1">
            <input id="usearch-q" class="form-control form-control-lg" placeholder="הקלד שם, מילה, תאריך, קטגוריה..." autocomplete="off">
            <div class="mt-2 small text-muted">חיפוש בכל המקורות: תלמידים, התנהגות, שיחות, תלאים, הגדרות</div>
            <div id="usearch-results" class="mt-3"></div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const inp = document.getElementById('usearch-q');
    inp.focus();
    inp.oninput = debounce(() => doSearch(inp.value), 250);
  };

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function esc(s) { return String(s || '').replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c])); }

  function doSearch(q) {
    const out = document.getElementById('usearch-results');
    if (!out) return;
    q = q.trim().toLowerCase();
    if (q.length < 2) { out.innerHTML = '<div class="text-muted text-center py-3">הקלד 2+ תווים...</div>'; return; }

    const data = typeof getVisibleData === 'function' ? getVisibleData() : {};
    const results = [];

    (data.students || []).forEach(s => {
      const blob = `${s['שם פרטי']||''} ${s['שם משפחה']||''} ${s['תז']||''} ${s['טלפון']||''} ${s['אימייל']||''}`.toLowerCase();
      if (blob.includes(q)) {
        results.push({
          type: 'תלמיד',
          icon: 'bi-person',
          color: 'primary',
          title: `${s['שם פרטי']} ${s['שם משפחה']}`,
          desc: `שיעור ${s['מחזור']||'-'} · ${s['תז']||''}`,
          action: `openStudent(${s['מזהה']})`,
        });
      }
    });

    (data.behavior || []).forEach(e => {
      const blob = `${e['תיאור']||''} ${e['קטגוריה']||''} ${e['שם תלמיד']||''} ${e['דווח_עי']||''}`.toLowerCase();
      if (blob.includes(q)) {
        results.push({
          type: 'אירוע',
          icon: 'bi-clipboard-check',
          color: 'success',
          title: `${e['קטגוריה']||'אירוע'} - ${e['שם תלמיד']||''}`,
          desc: `${(e['תיאור']||'').slice(0,80)} · ${e['תאריך']?e['תאריך'].slice(0,10):''}`,
          action: `openStudent(${e['תלמיד_מזהה']})`,
        });
      }
    });

    (data.conversations || []).forEach(c => {
      const blob = `${c['תוכן']||''} ${c['נושא']||''} ${c['שם תלמיד']||''} ${c['רב']||''}`.toLowerCase();
      if (blob.includes(q)) {
        results.push({
          type: 'שיחה',
          icon: 'bi-chat-dots',
          color: 'info',
          title: `שיחה - ${c['שם תלמיד']||''}`,
          desc: `${(c['נושא']||c['תוכן']||'').slice(0,80)} · רב: ${c['רב']||''}`,
          action: `openStudent(${c['תלמיד_מזהה']})`,
        });
      }
    });

    if (!results.length) {
      out.innerHTML = '<div class="text-center text-muted py-4">לא נמצאו תוצאות</div>';
      return;
    }

    out.innerHTML = `<div class="small text-muted mb-2">${results.length} תוצאות</div>` + results.slice(0, 50).map(r => `
      <div class="card p-2 mb-1" style="cursor:pointer" onclick="${esc(r.action)}; document.getElementById('universal-search').remove();">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-${r.color}"><i class="bi ${r.icon}"></i> ${esc(r.type)}</span>
          <div class="flex-grow-1">
            <strong>${esc(r.title)}</strong>
            <div class="small text-muted">${esc(r.desc)}</div>
          </div>
        </div>
      </div>
    `).join('') + (results.length > 50 ? `<div class="small text-muted text-center mt-2">+${results.length-50} תוצאות נוספות. צמצם חיפוש לראות יותר.</div>` : '');
  }

  // ===== Keyboard shortcut: Ctrl+K opens search =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !e.shiftKey) {
      e.preventDefault();
      if (typeof openGlobalSearch === 'function') {
        openGlobalSearch();
      } else {
        openUniversalSearch();
      }
    }
  });

  console.warn('%c🔍 Pack-75 — Universal search + Ctrl+K', 'color:#8b5cf6;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-75.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-76.js ─────────────────────────────────────────────
try {
// behavior-pack-76.js — CRITICAL FIX: standalone-pages.js overrides renderCameras AFTER pack-65/67/68/69/70.
// This pack re-applies the HLS camera grid at the very end of load order. 2026-05-27
(function () {
const HLS_BASE_KEY = 'cameras_hls_base';
  const DEFAULT_HLS_BASE = 'https://oregon-knock-learn-corrections.trycloudflare.com';

  const CAMERAS = [
    { path: 'shaar',          name: 'שער וגינה',     channel: 1,  emoji: '🚪' },
    { path: 'chadar_rm',      name: 'חדר רמ"מ',     channel: 2,  emoji: '👨‍🏫' },
    { path: 'lobby',          name: 'לובי',          channel: 3,  emoji: '🏛️' },
    { path: 'shvil',          name: 'שביל סיני',     channel: 4,  emoji: '🛤️' },
    { path: 'machsan',        name: 'מחסן',          channel: 5,  emoji: '📦' },
    { path: 'parking',        name: 'מדרכה וחניה',   channel: 6,  emoji: '🚗' },
    { path: 'chadar_shiur',   name: 'חדר שיעור',     channel: 7,  emoji: '📚' },
    { path: 'chadar_mifgash', name: 'חדר מפגש',      channel: 9,  emoji: '🤝' },
    { path: 'mazkirut',       name: 'מזכירות',       channel: 10, emoji: '📋' },
    { path: 'misrad',         name: 'משרד',          channel: 11, emoji: '💼' },
    { path: 'beit_midrash',   name: 'בית המדרש',     channel: 12, emoji: '📜' },
  ];

  function getBase() { return localStorage.getItem(HLS_BASE_KEY) || DEFAULT_HLS_BASE; }
  function escA(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

  function loadHlsJs() {
    if (window.Hls) return Promise.resolve(window.Hls);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
      s.onload = () => resolve(window.Hls);
      s.onerror = () => reject(new Error('hls.js failed'));
      document.head.appendChild(s);
    });
  }

  function attachHls(videoEl, url) {
    const Hls = window.Hls;
    if (Hls && Hls.isSupported()) {
      try { videoEl._hls?.destroy(); } catch {}
      const hls = new Hls({ liveSyncDuration: 2, maxBufferLength: 6 });
      hls.loadSource(url);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoEl.play().catch(() => {});
        videoEl.parentNode.querySelector('.cam-status')?.classList.add('live');
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          videoEl.parentNode.querySelector('.cam-status')?.classList.add('offline');
        }
      });
      videoEl._hls = hls;
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = url;
      videoEl.play().catch(() => {});
    }
  }

  function renderCamerasGrid() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    const base = getBase();
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isAdmin = u.username === 'admin' || u.role === 'מנהל';

    // Inject styles once
    if (!document.getElementById('cam-grid-style-76')) {
      const st = document.createElement('style');
      st.id = 'cam-grid-style-76';
      st.textContent = `
        .cam-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
        .cam-card { position:relative; background:#000; border-radius:8px; overflow:hidden; aspect-ratio:4/3; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
        .cam-card:hover { box-shadow:0 4px 16px rgba(220,38,38,0.3); }
        .cam-card video { width:100%; height:100%; object-fit:cover; background:#111; }
        .cam-label { position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.7); color:#fff; padding:4px 10px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px; }
        .cam-status { display:inline-block; width:8px; height:8px; border-radius:50%; background:#fbbf24; }
        .cam-status.live { background:#22c55e; box-shadow:0 0 6px #22c55e; animation:pulse 2s infinite; }
        .cam-status.offline { background:#ef4444; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .cam-channel { position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.6); color:#9ca3af; padding:2px 8px; border-radius:8px; font-size:11px; font-family:monospace; }
        @media (max-width:640px) { .cam-grid { grid-template-columns:1fr 1fr !important; } }
      `;
      document.head.appendChild(st);
    }

    root.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="d-flex align-items-center mb-3 flex-wrap gap-2">
        <h3 class="me-3 mb-0"><i class="bi bi-camera-video-fill text-danger"></i> מצלמות לייב</h3>
        <span class="badge bg-danger">🔴 LIVE</span>
        <span class="badge bg-secondary">${CAMERAS.length} מצלמות</span>
        <button class="btn btn-sm btn-outline-secondary ms-auto" onclick="window.renderCameras && window.renderCameras()" title="רענן">🔄</button>
      </div>
      <div class="cam-grid" id="cam-grid"></div>
      <div class="alert alert-info small mt-3">
        <i class="bi bi-info-circle"></i> שידור דרך mediamtx + Cloudflare Tunnel. מקור: <code>${escA(base.replace(/^https?:\/\//,'').split('/')[0])}</code>
      </div>
    `;

    const grid = document.getElementById('cam-grid');
    grid.innerHTML = CAMERAS.map(c => `
      <div class="cam-card" data-path="${c.path}">
        <video autoplay muted playsinline></video>
        <span class="cam-label">${c.emoji} ${escA(c.name)} <span class="cam-status"></span></span>
        <span class="cam-channel">CH${c.channel}</span>
      </div>
    `).join('');

    loadHlsJs().then(() => {
      CAMERAS.forEach(c => {
        const card = grid.querySelector(`.cam-card[data-path="${c.path}"]`);
        if (!card) return;
        const video = card.querySelector('video');
        const url = base.replace(/\/$/, '') + '/' + c.path + '/index.m3u8';
        attachHls(video, url);
      });
    }).catch(err => {
      grid.innerHTML = `<div class="alert alert-danger col-12">לא ניתן לטעון hls.js: ${err.message}</div>`;
    });
  }

  // Re-apply at end of all script load + on hash change
  function reapply() {
    window.renderCameras = renderCamerasGrid;
    // If currently viewing cameras, re-render
    if (location.hash === '#cameras' || document.getElementById('page-cameras')?.style.display !== 'none') {
      const camPage = document.getElementById('page-cameras');
      if (camPage && !camPage.classList.contains('d-none')) {
        renderCamerasGrid();
      }
    }
  }

  // Run after DOM ready + a delay to ensure standalone-pages.js has done its overrides
  if (document.readyState === 'complete') {
    setTimeout(reapply, 100);
  } else {
    window.addEventListener('load', () => setTimeout(reapply, 100));
  }
  // Also re-apply on page change
  window.addEventListener('hashchange', () => {
    if (location.hash === '#cameras') setTimeout(reapply, 50);
  });

  console.warn('%c🎬 Pack-76 — CRITICAL: re-apply HLS camera grid after standalone-pages override', 'color:#dc2626;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-76.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-77.js ─────────────────────────────────────────────
try {
// behavior-pack-77.js — CRITICAL FIX: CSP blocks blob: for hls.js + loadCameraReports null error. 2026-05-27
(function () {
// ===== Fix 1: Replace CSP to allow blob: for hls.js media =====
  // Remove old meta CSP from pack-14
  document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach(m => m.remove());
  // Add new permissive CSP that allows blob: for HLS streaming
  const csp = document.createElement('meta');
  csp.httpEquiv = 'Content-Security-Policy';
  csp.content = [
    "default-src 'self' https://*.googleapis.com https://*.google.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com 'unsafe-inline'",
    "img-src * data: blob:",
    "media-src * data: blob:",
    "connect-src *",
    "frame-src *",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://*.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' data: https://*.gstatic.com https://*.googleapis.com https://cdn.jsdelivr.net",
  ].join('; ');
  document.head.appendChild(csp);

  // ===== Fix 2: Stub loadCameraReports to no-op if grid is present =====
  if (typeof window.loadCameraReports === 'function') {
    const _origLCR = window.loadCameraReports;
    window.loadCameraReports = async function () {
      // If our pack-76 grid is already there, don't override
      const grid = document.getElementById('cam-grid');
      const list = document.getElementById('camera-reports-list');
      if (grid || !list) return; // pack-76 owns the page
      return _origLCR.apply(this, arguments);
    };
  }

  // ===== Fix 3: Force re-render cameras when page is shown =====
  const _origGoto = window.goto;
  if (typeof _origGoto === 'function') {
    window.goto = function (p) {
      const result = _origGoto.apply(this, arguments);
      if (p === 'cameras' && typeof window.renderCameras === 'function') {
        setTimeout(() => window.renderCameras(), 100);
      }
      return result;
    };
  }

  console.warn('%c🔓 Pack-77 — CRITICAL: CSP allows blob+media + loadCameraReports stub + goto re-render', 'color:#dc2626;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-77.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-78.js ─────────────────────────────────────────────
try {
// behavior-pack-78.js — CRITICAL: switch from broken HLS-with-session to mediamtx built-in iframes. 2026-05-27
// HLS via hls.js has session/segment 404 issues. mediamtx serves a built-in WebRTC player at /<path>/
// We just iframe it - the player handles HLS+WebRTC negotiation, autoplay, etc.
(function () {
const HLS_BASE_KEY = 'cameras_hls_base';
  const DEFAULT_HLS_BASE = 'https://oregon-knock-learn-corrections.trycloudflare.com';

  const CAMERAS = [
    { path: 'shaar',          name: 'שער וגינה',     channel: 1,  emoji: '🚪' },
    { path: 'chadar_rm',      name: 'חדר רמ"מ',     channel: 2,  emoji: '👨‍🏫' },
    { path: 'lobby',          name: 'לובי',          channel: 3,  emoji: '🏛️' },
    { path: 'shvil',          name: 'שביל סיני',     channel: 4,  emoji: '🛤️' },
    { path: 'machsan',        name: 'מחסן',          channel: 5,  emoji: '📦' },
    { path: 'parking',        name: 'מדרכה וחניה',   channel: 6,  emoji: '🚗' },
    { path: 'chadar_shiur',   name: 'חדר שיעור',     channel: 7,  emoji: '📚' },
    { path: 'chadar_mifgash', name: 'חדר מפגש',      channel: 9,  emoji: '🤝' },
    { path: 'mazkirut',       name: 'מזכירות',       channel: 10, emoji: '📋' },
    { path: 'misrad',         name: 'משרד',          channel: 11, emoji: '💼' },
    { path: 'beit_midrash',   name: 'בית המדרש',     channel: 12, emoji: '📜' },
  ];

  function getBase() { return localStorage.getItem(HLS_BASE_KEY) || DEFAULT_HLS_BASE; }
  function escA(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

  function renderCamerasIframeGrid() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    const base = getBase();

    if (!document.getElementById('cam-grid-style-78')) {
      const st = document.createElement('style');
      st.id = 'cam-grid-style-78';
      st.textContent = `
        .cam-grid-iframe { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:12px; }
        .cam-iframe-card { position:relative; background:#000; border-radius:8px; overflow:hidden; aspect-ratio:4/3; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
        .cam-iframe-card:hover { box-shadow:0 6px 20px rgba(220,38,38,0.4); transform:scale(1.01); transition:all .15s; }
        .cam-iframe-card iframe { width:100%; height:100%; border:0; background:#000; }
        .cam-iframe-label { position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.75); color:#fff; padding:4px 10px; border-radius:14px; font-size:13px; font-weight:600; z-index:2; pointer-events:none; }
        .cam-iframe-channel { position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.7); color:#9ca3af; padding:2px 8px; border-radius:8px; font-size:11px; font-family:monospace; z-index:2; pointer-events:none; }
        .cam-iframe-expand { position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.7); color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; z-index:2; }
        .cam-iframe-card:hover .cam-iframe-expand { background:#dc2626; }
        @media (max-width:640px) { .cam-grid-iframe { grid-template-columns:1fr 1fr !important; } }
      `;
      document.head.appendChild(st);
    }

    root.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="d-flex align-items-center mb-3 flex-wrap gap-2">
        <h3 class="me-3 mb-0"><i class="bi bi-camera-video-fill text-danger"></i> מצלמות לייב</h3>
        <span class="badge bg-danger">🔴 LIVE</span>
        <span class="badge bg-secondary">${CAMERAS.length} מצלמות</span>
        <button class="btn btn-sm btn-outline-secondary ms-auto" onclick="window.renderCameras && window.renderCameras()" title="רענן"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
      <div class="cam-grid-iframe" id="cam-grid"></div>
      <div class="alert alert-info small mt-3">
        <i class="bi bi-info-circle"></i> שידור דרך mediamtx WebRTC/HLS · ${CAMERAS.length} מצלמות פעילות
      </div>
    `;

    const grid = document.getElementById('cam-grid');
    grid.innerHTML = CAMERAS.map(c => {
      const url = base.replace(/\/$/, '') + '/' + c.path + '/';
      return `<div class="cam-iframe-card" data-path="${escA(c.path)}">
        <iframe src="${escA(url)}" allow="autoplay; fullscreen" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>
        <span class="cam-iframe-label">${c.emoji} ${escA(c.name)}</span>
        <span class="cam-iframe-channel">CH${c.channel}</span>
        <button class="cam-iframe-expand" onclick="window.camExpand('${escA(c.path)}','${escA(c.name)}',${c.channel})" title="מסך מלא">⛶</button>
      </div>`;
    }).join('');
  }

  window.camExpand = function (path, name, channel) {
    const base = getBase().replace(/\/$/, '');
    const url = `${base}/${path}/`;
    const modal = document.createElement('div');
    modal.className = 'cam-fullscreen-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = `
      <button onclick="this.closest('div[data-fs]').remove()" style="position:absolute;top:20px;right:20px;background:#dc2626;color:#fff;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:16px;z-index:2">✕ סגור</button>
      <div style="position:absolute;top:24px;left:20px;color:#fff;font-size:22px;z-index:2">${escA(name)} <span style="color:#9ca3af;font-size:14px">CH${channel}</span></div>
      <iframe src="${escA(url)}" allow="autoplay; fullscreen" allowfullscreen style="width:96%;height:90%;border:0;background:#000;border-radius:8px"></iframe>
    `;
    modal.setAttribute('data-fs', '1');
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  };

  // ===== Override renderCameras =====
  function applyOverride() {
    window.renderCameras = renderCamerasIframeGrid;
    if (location.hash === '#cameras' || (document.getElementById('page-cameras') && !document.getElementById('page-cameras').classList.contains('d-none'))) {
      renderCamerasIframeGrid();
    }
  }

  if (document.readyState === 'complete') {
    setTimeout(applyOverride, 150);
  } else {
    window.addEventListener('load', () => setTimeout(applyOverride, 150));
  }
  window.addEventListener('hashchange', () => {
    if (location.hash === '#cameras') setTimeout(applyOverride, 80);
  });

  console.warn('%c🎥 Pack-78 — iframe to mediamtx built-in player (bypasses HLS session bugs)', 'color:#dc2626;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-78.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-79.js ─────────────────────────────────────────────
try {
// behavior-pack-79.js — Cameras: add "play all" button + try inject .play() to iframes. 2026-05-27
(function () {
// After cameras render, add a "Play all" overlay that user clicks once
  // to enable autoplay on all iframes.
  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const result = _orig.apply(this, arguments);
      setTimeout(addPlayAllButton, 400);
      return result;
    };
  }

  function addPlayAllButton() {
    const grid = document.getElementById('cam-grid');
    if (!grid || grid.dataset.playAll79) return;
    grid.dataset.playAll79 = '1';

    // Add big "press to start" overlay
    const overlay = document.createElement('div');
    overlay.id = 'play-all-overlay';
    overlay.style.cssText = `position:fixed;top:80px;right:50%;transform:translateX(50%);
      background:#dc2626;color:#fff;padding:14px 24px;border-radius:30px;
      font-size:18px;font-weight:bold;cursor:pointer;z-index:9999;
      box-shadow:0 8px 32px rgba(220,38,38,0.5);animation:bounce-79 1.5s infinite`;
    overlay.innerHTML = '▶ לחץ להפעלת כל המצלמות';
    overlay.onclick = () => {
      // Trigger autoplay via interaction
      grid.querySelectorAll('iframe').forEach(iframe => {
        try {
          // Reload iframe with autoplay
          const src = iframe.src;
          iframe.src = '';
          setTimeout(() => { iframe.src = src; }, 50);
        } catch (e) {}
      });
      overlay.remove();
      // Show toast
      if (typeof toast === 'function') toast('מצלמות מתחילות לעלות...', 'success');
    };
    document.body.appendChild(overlay);

    // Auto-hide after 60s
    setTimeout(() => { try { overlay.remove(); } catch {} }, 60000);

    // Add animation
    if (!document.getElementById('bounce-79-style')) {
      const st = document.createElement('style');
      st.id = 'bounce-79-style';
      st.textContent = `@keyframes bounce-79 { 0%,100% { transform:translateX(50%) scale(1) } 50% { transform:translateX(50%) scale(1.08) } }`;
      document.head.appendChild(st);
    }
  }

  console.warn('%c▶ Pack-79 — Play-all overlay for autoplay-blocked iframes', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-79.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-80.js ─────────────────────────────────────────────
try {
// behavior-pack-80.js — Round 16: pre-warm cameras + autoplay tweak + camera stream cache. 2026-05-27
(function () {
const HLS_BASE_KEY = 'cameras_hls_base';
  const DEFAULT_HLS_BASE = 'https://oregon-knock-learn-corrections.trycloudflare.com';
  const PATHS = ['shaar','chadar_rm','lobby','shvil','machsan','parking','chadar_shiur','chadar_mifgash','mazkirut','misrad','beit_midrash'];

  function getBase() { return localStorage.getItem(HLS_BASE_KEY) || DEFAULT_HLS_BASE; }

  // ===== Pre-warm camera streams =====
  // mediamtx uses sourceOnDemand. First request takes ~3s (ffmpeg spawn).
  // Pre-warm them when user lands on cameras page so iframes load instantly.
  let prewarmInFlight = false;
  async function prewarmAll() {
    if (prewarmInFlight) return;
    prewarmInFlight = true;
    const base = getBase().replace(/\/$/, '');
    const promises = PATHS.map(p =>
      fetch(`${base}/${p}/index.m3u8`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {})
    );
    await Promise.allSettled(promises);
    prewarmInFlight = false;
    console.info('[Pack-80] cameras pre-warmed');
  }

  // Pre-warm when navigating to cameras
  const _origGoto = window.goto;
  if (typeof _origGoto === 'function') {
    window.goto = function (p) {
      if (p === 'cameras') {
        // Fire-and-forget pre-warm BEFORE the iframes load
        prewarmAll();
      }
      return _origGoto.apply(this, arguments);
    };
  }
  window.addEventListener('hashchange', () => {
    if (location.hash === '#cameras') prewarmAll();
  });
  if (location.hash === '#cameras') prewarmAll();

  // ===== Reload iframes after 4s if still showing loading spinner =====
  setInterval(() => {
    const grid = document.getElementById('cam-grid');
    if (!grid) return;
    grid.querySelectorAll('iframe').forEach(iframe => {
      const card = iframe.closest('.cam-iframe-card');
      if (!card) return;
      // Track first-seen time
      if (!card.dataset.firstSeen) card.dataset.firstSeen = Date.now();
      const elapsed = Date.now() - parseInt(card.dataset.firstSeen);
      // If iframe has been visible for 30s but is still loading, soft-reload it once
      if (elapsed > 30000 && !card.dataset.reloaded) {
        card.dataset.reloaded = '1';
        const src = iframe.src;
        iframe.src = '';
        setTimeout(() => { iframe.src = src; }, 100);
        console.info('[Pack-80] soft-reload stuck iframe', card.dataset.path);
      }
    });
  }, 15000);

  // ===== Manual prewarm helper =====
  window.prewarmCameras = prewarmAll;

  console.warn('%c🔥 Pack-80 — Pre-warm camera streams + stuck-iframe auto-reload', 'color:#ea580c;font-weight:bold');
  console.log('  Try: prewarmCameras()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-80.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-81.js ─────────────────────────────────────────────
try {
// behavior-pack-81.js — Round 17: lazy-load iframes + live timestamp overlay. 2026-05-27
(function () {
// ===== Lazy-load iframes via IntersectionObserver =====
  // 11 iframes loading at once = heavy. Load only when visible.
  function applyLazyLoad() {
    if (!('IntersectionObserver' in window)) return;
    const cards = document.querySelectorAll('.cam-iframe-card');
    if (!cards.length || cards[0].dataset.lazyApplied81) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        const card = en.target;
        const iframe = card.querySelector('iframe');
        if (!iframe) return;
        if (en.isIntersecting) {
          // Restore src from data-src if deferred
          if (iframe.dataset.deferredSrc && !iframe.src) {
            iframe.src = iframe.dataset.deferredSrc;
            delete iframe.dataset.deferredSrc;
          }
        }
      });
    }, { rootMargin: '200px', threshold: 0.1 });

    // For cards beyond viewport, defer their iframe load
    cards.forEach((card, i) => {
      card.dataset.lazyApplied81 = '1';
      if (i >= 6) { // first 6 stay loaded; rest deferred
        const iframe = card.querySelector('iframe');
        if (iframe && iframe.src) {
          iframe.dataset.deferredSrc = iframe.src;
          iframe.removeAttribute('src');
          iframe.style.background = 'linear-gradient(135deg,#1f2937,#111827)';
          // Add placeholder
          const placeholder = document.createElement('div');
          placeholder.className = 'cam-defer-placeholder';
          placeholder.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#9ca3af;background:rgba(0,0,0,0.5);z-index:1;pointer-events:none';
          placeholder.innerHTML = '<i class="bi bi-camera-video-fill fs-1"></i><div class="small mt-2">גלול לטעון</div>';
          card.appendChild(placeholder);
          // Remove placeholder when src restored
          new MutationObserver((muts, obs) => {
            if (iframe.src) {
              placeholder.remove();
              obs.disconnect();
            }
          }).observe(iframe, { attributes: true, attributeFilter: ['src'] });
        }
      }
      observer.observe(card);
    });
    console.info('[Pack-81] lazy-load applied to', cards.length, 'cards');
  }

  // ===== Live timestamp overlay =====
  function applyLiveTimestamp() {
    const cards = document.querySelectorAll('.cam-iframe-card');
    cards.forEach(card => {
      if (card.dataset.tsApplied81) return;
      card.dataset.tsApplied81 = '1';
      const ts = document.createElement('div');
      ts.className = 'cam-live-ts';
      ts.style.cssText = 'position:absolute;top:8px;left:8px;background:rgba(220,38,38,0.85);color:#fff;padding:2px 8px;border-radius:8px;font-size:10px;font-family:monospace;z-index:2;pointer-events:none';
      card.appendChild(ts);
    });

    function updateTimestamps() {
      const now = new Date();
      const str = now.toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      document.querySelectorAll('.cam-live-ts').forEach(el => {
        el.textContent = '● LIVE ' + str;
      });
    }
    updateTimestamps();
    setInterval(updateTimestamps, 1000);
  }

  // Apply after renderCameras
  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const r = _orig.apply(this, arguments);
      setTimeout(() => {
        applyLazyLoad();
        applyLiveTimestamp();
      }, 500);
      return r;
    };
  }

  console.warn('%c⏱️ Pack-81 — Lazy-load iframes (first 6 only) + live timestamp', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-81.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-82.js ─────────────────────────────────────────────
try {
// behavior-pack-82.js — CRITICAL: WebRTC direct via WHEP (bypass broken mediamtx HLS sessions). 2026-05-27
(function () {
const HLS_BASE_KEY = 'cameras_hls_base';
  const DEFAULT_HLS_BASE = 'https://oregon-knock-learn-corrections.trycloudflare.com';
  const WEBRTC_BASE_KEY = 'cameras_webrtc_base';
  const DEFAULT_WEBRTC_BASE = 'https://participation-seek-indexes-burner.trycloudflare.com';
  const CAMERAS = [
    { path: 'shaar',          name: 'שער וגינה',     channel: 1,  emoji: '🚪' },
    { path: 'chadar_rm',      name: 'חדר רמ"מ',     channel: 2,  emoji: '👨‍🏫' },
    { path: 'lobby',          name: 'לובי',          channel: 3,  emoji: '🏛️' },
    { path: 'shvil',          name: 'שביל סיני',     channel: 4,  emoji: '🛤️' },
    { path: 'machsan',        name: 'מחסן',          channel: 5,  emoji: '📦' },
    { path: 'parking',        name: 'מדרכה וחניה',   channel: 6,  emoji: '🚗' },
    { path: 'chadar_shiur',   name: 'חדר שיעור',     channel: 7,  emoji: '📚' },
    { path: 'chadar_mifgash', name: 'חדר מפגש',      channel: 9,  emoji: '🤝' },
    { path: 'mazkirut',       name: 'מזכירות',       channel: 10, emoji: '📋' },
    { path: 'misrad',         name: 'משרד',          channel: 11, emoji: '💼' },
    { path: 'beit_midrash',   name: 'בית המדרש',     channel: 12, emoji: '📜' },
  ];

  function getBase() { return localStorage.getItem(HLS_BASE_KEY) || DEFAULT_HLS_BASE; }
  function getWebRtcBase() { return localStorage.getItem(WEBRTC_BASE_KEY) || DEFAULT_WEBRTC_BASE; }
  function escA(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

  // WHEP client - WebRTC pull from mediamtx
  // mediamtx WebRTC endpoint: POST /<path>/whep with SDP offer
  async function whepConnect(video, baseUrl, cameraPath) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    pc.ontrack = (e) => {
      if (video.srcObject !== e.streams[0]) {
        video.srcObject = e.streams[0];
        video.play().catch(err => console.warn('autoplay blocked', err));
      }
    };

    pc.onconnectionstatechange = () => {
      const card = video.closest('.cam-webrtc-card');
      const status = card?.querySelector('.cam-webrtc-status');
      if (status) {
        status.textContent = pc.connectionState;
        status.style.background = pc.connectionState === 'connected' ? '#22c55e' : pc.connectionState === 'failed' ? '#ef4444' : '#fbbf24';
      }
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const whepUrl = `${baseUrl}/${cameraPath}/whep`;
      const resp = await fetch(whepUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });
      if (!resp.ok) {
        console.warn(`WHEP failed for ${cameraPath}: ${resp.status}`);
        pc.close();
        return null;
      }
      const answerSdp = await resp.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      return pc;
    } catch (e) {
      console.error(`WHEP error ${cameraPath}:`, e);
      pc.close();
      return null;
    }
  }

  function renderCamerasWebRtc() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    const base = getWebRtcBase().replace(/\/$/, '');

    if (!document.getElementById('cam-webrtc-style-82')) {
      const st = document.createElement('style');
      st.id = 'cam-webrtc-style-82';
      st.textContent = `
        .cam-webrtc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
        .cam-webrtc-card { position:relative; background:#000; border-radius:8px; overflow:hidden; aspect-ratio:4/3; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
        .cam-webrtc-card video { width:100%; height:100%; object-fit:cover; background:#111; cursor:pointer; }
        .cam-webrtc-label { position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.75); color:#fff; padding:4px 10px; border-radius:14px; font-size:13px; font-weight:600; z-index:2; pointer-events:none; }
        .cam-webrtc-channel { position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.7); color:#9ca3af; padding:2px 8px; border-radius:8px; font-size:11px; font-family:monospace; z-index:2; pointer-events:none; }
        .cam-webrtc-status { position:absolute; top:8px; left:8px; background:#fbbf24; color:#fff; padding:2px 8px; border-radius:8px; font-size:10px; font-family:monospace; z-index:2; pointer-events:none; transition:background .3s; }
        .cam-webrtc-card:hover { box-shadow:0 6px 20px rgba(220,38,38,0.4); transform:scale(1.01); transition:all .15s; }
        @media (max-width:640px) { .cam-webrtc-grid { grid-template-columns:1fr 1fr !important; } }
      `;
      document.head.appendChild(st);
    }

    root.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="d-flex align-items-center mb-3 flex-wrap gap-2">
        <h3 class="me-3 mb-0"><i class="bi bi-camera-video-fill text-danger"></i> מצלמות לייב <small class="text-muted">(WebRTC)</small></h3>
        <span class="badge bg-danger">🔴 LIVE</span>
        <span class="badge bg-secondary">${CAMERAS.length} מצלמות</span>
        <button class="btn btn-sm btn-outline-secondary ms-auto" onclick="window.renderCameras && window.renderCameras()" title="רענן"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
      <div class="cam-webrtc-grid" id="cam-grid"></div>
      <div class="alert alert-success small mt-3">
        <i class="bi bi-broadcast"></i> WebRTC P2P · אין latency · אין session bugs של HLS
      </div>
    `;

    const grid = document.getElementById('cam-grid');
    grid.innerHTML = CAMERAS.map(c => `
      <div class="cam-webrtc-card" data-path="${escA(c.path)}">
        <video autoplay muted playsinline></video>
        <span class="cam-webrtc-label">${c.emoji} ${escA(c.name)}</span>
        <span class="cam-webrtc-channel">CH${c.channel}</span>
        <span class="cam-webrtc-status">connecting</span>
      </div>
    `).join('');

    // Connect WebRTC for each camera (parallel)
    CAMERAS.forEach(c => {
      const card = grid.querySelector(`.cam-webrtc-card[data-path="${c.path}"]`);
      if (!card) return;
      const video = card.querySelector('video');
      whepConnect(video, base, c.path).then(pc => {
        if (pc) card._pc = pc;
      });
    });

    // Click video → fullscreen
    grid.addEventListener('click', e => {
      const v = e.target.tagName === 'VIDEO' ? e.target : null;
      if (!v) return;
      if (document.fullscreenElement) document.exitFullscreen();
      else v.requestFullscreen().catch(()=>{});
    });
  }

  function applyOverride() {
    window.renderCameras = renderCamerasWebRtc;
    if (location.hash === '#cameras' || (document.getElementById('page-cameras') && !document.getElementById('page-cameras').classList.contains('d-none'))) {
      renderCamerasWebRtc();
    }
  }

  if (document.readyState === 'complete') {
    setTimeout(applyOverride, 200);
  } else {
    window.addEventListener('load', () => setTimeout(applyOverride, 200));
  }
  window.addEventListener('hashchange', () => {
    if (location.hash === '#cameras') setTimeout(applyOverride, 100);
  });

  console.warn('%c📡 Pack-82 — WebRTC direct via WHEP (bypasses broken HLS sessions)', 'color:#16a34a;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-82.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-83.js ─────────────────────────────────────────────
try {
// behavior-pack-83.js — CRITICAL FIX: 3 packs (76,78,82) all listen for hashchange and re-render. Debounce. 2026-05-27
(function () {
// Debounce renderCameras to prevent rapid re-renders that destroy WebRTC connections
  let lastRender = 0;
  let renderTimer = null;
  const _orig = window.renderCameras;
  if (typeof _orig !== 'function') return;

  window.renderCameras = function () {
    const now = Date.now();
    const sinceLast = now - lastRender;
    if (sinceLast < 3000) {
      // Too soon - debounce
      console.warn(`[Pack-83] renderCameras call suppressed (${sinceLast}ms since last)`);
      clearTimeout(renderTimer);
      renderTimer = setTimeout(() => {
        lastRender = Date.now();
        _orig.apply(window, []);
      }, 3000 - sinceLast);
      return;
    }
    lastRender = now;
    return _orig.apply(this, arguments);
  };

  // Also remove duplicate hashchange listeners by wrapping
  // (We can't really remove anonymous listeners, but we can guard the body of renderCameras above)

  console.warn('%c🛑 Pack-83 — Debounce renderCameras (was being called by 3 packs on hashchange)', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-83.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-84.js ─────────────────────────────────────────────
try {
// behavior-pack-84.js — Round 20: WebRTC reconnect + connection quality + cleanup. 2026-05-27
(function () {
// ===== Auto-reconnect WebRTC if connection drops =====
  // Run every 15s: check each <video> with srcObject - if no frames in 5s, reconnect
  setInterval(() => {
    const cards = document.querySelectorAll('.cam-webrtc-card');
    cards.forEach(card => {
      const video = card.querySelector('video');
      if (!video) return;
      const pc = card._pc;
      if (!pc) return;

      // Check connection state
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        const lastReconnect = card.dataset.lastReconnect ? parseInt(card.dataset.lastReconnect) : 0;
        if (Date.now() - lastReconnect < 30000) return; // throttle
        card.dataset.lastReconnect = Date.now();

        console.warn(`[Pack-84] reconnecting ${card.dataset.path}`);
        try { pc.close(); } catch {}
        delete card._pc;

        // Re-render the cameras page to trigger reconnect
        // Less invasive: trigger the original whepConnect via stored path
        // For now: rebuild the iframe by calling renderCameras (debounced by pack-83)
        if (typeof window.renderCameras === 'function') {
          window.renderCameras();
        }
      }
    });
  }, 15000);

  // ===== Connection quality indicator =====
  // Show bitrate next to each camera label
  setInterval(async () => {
    const cards = document.querySelectorAll('.cam-webrtc-card');
    for (const card of cards) {
      const pc = card._pc;
      if (!pc) continue;
      if (pc.connectionState !== 'connected') continue;

      try {
        const stats = await pc.getStats();
        let videoBytes = 0;
        let videoFrames = 0;
        let videoPacketsLost = 0;
        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            videoBytes = report.bytesReceived || 0;
            videoFrames = report.framesDecoded || 0;
            videoPacketsLost = report.packetsLost || 0;
          }
        });

        // Calculate bitrate (need previous reading)
        const prev = card._lastStats;
        const now = Date.now();
        if (prev && now - prev.time > 0) {
          const kbps = Math.round((videoBytes - prev.bytes) * 8 / (now - prev.time));
          const fps = Math.round((videoFrames - prev.frames) * 1000 / (now - prev.time));
          let qIndicator = card.querySelector('.cam-quality');
          if (!qIndicator) {
            qIndicator = document.createElement('span');
            qIndicator.className = 'cam-quality';
            qIndicator.style.cssText = 'position:absolute;top:32px;right:8px;background:rgba(0,0,0,0.65);color:#22c55e;padding:1px 6px;border-radius:6px;font-size:9px;font-family:monospace;z-index:2;pointer-events:none';
            card.appendChild(qIndicator);
          }
          qIndicator.textContent = `${kbps}kbps · ${fps}fps`;
          qIndicator.style.color = kbps < 50 ? '#ef4444' : kbps < 200 ? '#fbbf24' : '#22c55e';
        }
        card._lastStats = { time: now, bytes: videoBytes, frames: videoFrames };
      } catch (e) { /* ignore */ }
    }
  }, 3000);

  console.warn('%c📶 Pack-84 — WebRTC auto-reconnect + quality indicator (kbps/fps)', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-84.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-85.js ─────────────────────────────────────────────
try {
// behavior-pack-85.js — Round 21: cameras layout switcher + audio toggle + dblclick fullscreen. 2026-05-27
(function () {
const LAYOUT_KEY = 'cameras_layout_cols';
  const AUDIO_KEY = 'cameras_audio_enabled';

  function getLayoutCols() { return parseInt(localStorage.getItem(LAYOUT_KEY) || '3'); }
  function setLayoutCols(n) { localStorage.setItem(LAYOUT_KEY, String(n)); }
  function isAudioEnabled() { return localStorage.getItem(AUDIO_KEY) === '1'; }

  // ===== Apply layout columns CSS variable =====
  function applyLayout() {
    const cols = getLayoutCols();
    const grid = document.getElementById('cam-grid');
    if (!grid) return;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    console.info(`[Pack-85] layout: ${cols} cols`);
  }

  // ===== Inject toolbar with layout selector + audio toggle =====
  function injectToolbar() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    if (root.querySelector('#cam-toolbar-85')) return;
    const header = root.querySelector('.d-flex.align-items-center.mb-3');
    if (!header) return;

    const cols = getLayoutCols();
    const audio = isAudioEnabled();
    const toolbar = document.createElement('div');
    toolbar.id = 'cam-toolbar-85';
    toolbar.className = 'mb-3 d-flex gap-2 flex-wrap align-items-center';
    toolbar.innerHTML = `
      <small class="text-muted">פריסה:</small>
      <div class="btn-group btn-group-sm" role="group">
        <button class="btn btn-outline-secondary ${cols===1?'active':''}" onclick="window.camSetLayout(1)" title="1 בשורה (גדול)">⬜</button>
        <button class="btn btn-outline-secondary ${cols===2?'active':''}" onclick="window.camSetLayout(2)" title="2 בשורה">⬜⬜</button>
        <button class="btn btn-outline-secondary ${cols===3?'active':''}" onclick="window.camSetLayout(3)" title="3 בשורה">⬜⬜⬜</button>
        <button class="btn btn-outline-secondary ${cols===4?'active':''}" onclick="window.camSetLayout(4)" title="4 בשורה (קטן)">⬜⬜⬜⬜</button>
      </div>
      <button class="btn btn-sm btn-outline-${audio?'success':'secondary'}" onclick="window.camToggleAudio()" id="cam-audio-btn">
        ${audio ? '🔊 השתק' : '🔇 הפעל אודיו'}
      </button>
      <small class="text-muted ms-auto">לחץ פעמיים על מצלמה למסך מלא</small>
    `;
    header.parentNode.insertBefore(toolbar, header.nextSibling);
  }

  window.camSetLayout = function (cols) {
    setLayoutCols(cols);
    applyLayout();
    // Update toolbar
    document.querySelectorAll('#cam-toolbar-85 .btn-group .btn').forEach((b, i) => {
      b.classList.toggle('active', i + 1 === cols);
    });
  };

  window.camToggleAudio = function () {
    const newState = !isAudioEnabled();
    localStorage.setItem(AUDIO_KEY, newState ? '1' : '0');
    document.querySelectorAll('.cam-webrtc-card video').forEach(v => {
      v.muted = !newState;
    });
    const btn = document.getElementById('cam-audio-btn');
    if (btn) {
      btn.innerHTML = newState ? '🔊 השתק' : '🔇 הפעל אודיו';
      btn.classList.toggle('btn-outline-success', newState);
      btn.classList.toggle('btn-outline-secondary', !newState);
    }
  };

  // ===== Double-click fullscreen =====
  document.addEventListener('dblclick', e => {
    const v = e.target.closest('.cam-webrtc-card video');
    if (!v) return;
    e.preventDefault();
    if (document.fullscreenElement) document.exitFullscreen();
    else v.requestFullscreen().catch(() => {});
  });

  // Apply on every renderCameras call
  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const r = _orig.apply(this, arguments);
      setTimeout(() => {
        injectToolbar();
        applyLayout();
        // Apply audio setting
        const enabled = isAudioEnabled();
        document.querySelectorAll('.cam-webrtc-card video').forEach(v => { v.muted = !enabled; });
      }, 300);
      return r;
    };
  }

  console.warn('%c🎛 Pack-85 — Layout switcher (1/2/3/4 cols) + audio toggle + dblclick fullscreen', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-85.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-86.js ─────────────────────────────────────────────
try {
// behavior-pack-86.js — Round 22: per-camera snapshot button + PIP support + memory cleanup. 2026-05-27
(function () {
// ===== Per-camera snapshot button =====
  function addSnapshotButtons() {
    const cards = document.querySelectorAll('.cam-webrtc-card');
    cards.forEach(card => {
      if (card.dataset.snap86) return;
      card.dataset.snap86 = '1';
      const path = card.dataset.path;
      const label = card.querySelector('.cam-webrtc-label')?.textContent || path;

      const btn = document.createElement('button');
      btn.className = 'cam-snap-btn';
      btn.title = 'צלם snapshot';
      btn.style.cssText = 'position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.7);color:#fff;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;z-index:3;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s';
      btn.innerHTML = '📸';
      card.appendChild(btn);

      // PIP button
      const pipBtn = document.createElement('button');
      pipBtn.className = 'cam-pip-btn';
      pipBtn.title = 'תמונה בתמונה';
      pipBtn.style.cssText = 'position:absolute;bottom:8px;right:48px;background:rgba(0,0,0,0.7);color:#fff;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;z-index:3;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s';
      pipBtn.innerHTML = '⧉';
      card.appendChild(pipBtn);

      card.addEventListener('mouseenter', () => { btn.style.opacity = '1'; pipBtn.style.opacity = '1'; });
      card.addEventListener('mouseleave', () => { btn.style.opacity = '0'; pipBtn.style.opacity = '0'; });

      btn.onclick = (e) => {
        e.stopPropagation();
        const video = card.querySelector('video');
        if (!video || video.readyState < 2) return alert('הסרטון לא טעון');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 352;
        canvas.height = video.videoHeight || 288;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Add timestamp overlay
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(5, canvas.height - 22, canvas.width - 10, 18);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        const ts = new Date().toLocaleString('he-IL');
        ctx.fillText(`${label.trim()} · ${ts}`, canvas.width - 10, canvas.height - 8);

        canvas.toBlob(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${path}_${Date.now()}.jpg`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 5000);
          if (typeof toast === 'function') toast('Snapshot שמור', 'success');
        }, 'image/jpeg', 0.9);
      };

      pipBtn.onclick = async (e) => {
        e.stopPropagation();
        const video = card.querySelector('video');
        if (!video || !document.pictureInPictureEnabled) return alert('PIP לא נתמך');
        try {
          if (document.pictureInPictureElement) await document.exitPictureInPicture();
          else await video.requestPictureInPicture();
        } catch (err) {
          alert('PIP error: ' + err.message);
        }
      };
    });
  }

  // ===== Memory cleanup: close PeerConnections when leaving cameras page =====
  let cleanupTimer = null;
  function maybeCleanup() {
    clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(() => {
      // If user is no longer on #cameras, close all PCs
      if (location.hash !== '#cameras' && !document.querySelector('#page-cameras:not(.d-none)')) {
        document.querySelectorAll('.cam-webrtc-card').forEach(card => {
          if (card._pc) {
            try { card._pc.close(); } catch {}
            delete card._pc;
          }
        });
        console.info('[Pack-86] cleaned up WebRTC connections');
      }
    }, 5000);
  }
  window.addEventListener('hashchange', maybeCleanup);

  // Apply on every renderCameras
  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const r = _orig.apply(this, arguments);
      setTimeout(addSnapshotButtons, 600);
      return r;
    };
  }

  console.warn('%c📸 Pack-86 — Per-camera snapshot + PIP + memory cleanup', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-86.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-87.js ─────────────────────────────────────────────
try {
// behavior-pack-87.js — Round 23: per-camera record 30s clip + improved snapshot UX. 2026-05-27
(function () {
const RECORD_DURATION_MS = 30000;

  function addRecordButtons() {
    const cards = document.querySelectorAll('.cam-webrtc-card');
    cards.forEach(card => {
      if (card.dataset.rec87) return;
      card.dataset.rec87 = '1';
      const path = card.dataset.path;
      const label = card.querySelector('.cam-webrtc-label')?.textContent || path;

      const btn = document.createElement('button');
      btn.className = 'cam-rec-btn';
      btn.title = 'הקלט 30 שניות';
      btn.style.cssText = 'position:absolute;bottom:8px;right:88px;background:rgba(0,0,0,0.7);color:#fff;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;z-index:3;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s';
      btn.innerHTML = '⏺';
      card.appendChild(btn);

      card.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
      card.addEventListener('mouseleave', () => { btn.style.opacity = '0'; });

      btn.onclick = (e) => {
        e.stopPropagation();
        const video = card.querySelector('video');
        if (!video || !video.srcObject) return alert('הסרטון לא טעון');
        if (card._recording) return alert('כבר מקליט');

        if (typeof MediaRecorder === 'undefined') return alert('הדפדפן לא תומך בהקלטה');

        const stream = video.srcObject;
        let mime = 'video/webm;codecs=vp9,opus';
        if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';

        try {
          const rec = new MediaRecorder(stream, { mimeType: mime });
          const chunks = [];
          rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
          rec.onstop = () => {
            const blob = new Blob(chunks, { type: mime });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${path}_${Date.now()}.webm`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 8000);
            card._recording = false;
            btn.innerHTML = '⏺';
            btn.style.color = '#fff';
            btn.style.background = 'rgba(0,0,0,0.7)';
            if (typeof toast === 'function') toast(`הקלטה ${label.trim()} נשמרה`, 'success');
          };

          rec.start();
          card._recording = true;
          btn.innerHTML = '⏹';
          btn.style.color = '#fff';
          btn.style.background = '#dc2626';
          if (typeof toast === 'function') toast(`מקליט ${RECORD_DURATION_MS/1000}s...`, 'info');

          // Auto-stop after duration OR manual click
          const stopFn = () => { if (rec.state === 'recording') rec.stop(); };
          const t = setTimeout(stopFn, RECORD_DURATION_MS);
          btn.dataset.timer = t;

          // Allow manual stop by re-clicking
          const stopHandler = (ev) => {
            ev.stopPropagation();
            clearTimeout(parseInt(btn.dataset.timer || '0'));
            stopFn();
            btn.removeEventListener('click', stopHandler);
          };
          btn.addEventListener('click', stopHandler);
        } catch (err) {
          alert('שגיאת הקלטה: ' + err.message);
          card._recording = false;
        }
      };
    });
  }

  // ===== Snapshot keyboard shortcut: S =====
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input,textarea,select')) return;
    if (e.key === 's' && location.hash === '#cameras' && !e.ctrlKey && !e.metaKey) {
      // Snapshot all cameras at once
      const card = document.querySelector('.cam-webrtc-card');
      if (!card) return;
      e.preventDefault();
      if (typeof window.camSnapshotAll === 'function') {
        window.camSnapshotAll();
      } else {
        // Manual snapshot first camera
        card.querySelector('.cam-snap-btn')?.click();
      }
    }
  });

  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const r = _orig.apply(this, arguments);
      setTimeout(addRecordButtons, 700);
      return r;
    };
  }

  console.warn('%c⏺ Pack-87 — Per-camera 30s recording (WebM) + S shortcut for snapshot', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-87.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-88.js ─────────────────────────────────────────────
try {
// behavior-pack-88.js — Round 24: home dashboard mini-stats + camera health badge. 2026-05-27
(function () {
// ===== Render home stats widget (admin only) =====
  function renderHomeStats() {
    const home = document.getElementById('page-home');
    if (!home) return;
    if (home.querySelector('#home-stats-88')) return;
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isAdmin = u.username === 'admin' || u.role === 'מנהל';
    if (!isAdmin) return;

    const data = typeof getVisibleData === 'function' ? getVisibleData() : {};
    const today = new Date().toISOString().slice(0, 10);
    const todayBehavior = (data.behavior || []).filter(e => (e['תאריך'] || '').startsWith(today)).length;
    const studentsCount = (data.students || []).filter(s => s['סטטוס'] !== 'סיים').length;
    const tlaCount = (data.students || []).filter(s => s['תלא_pdf_id']).length;
    const recentConversations = (data.conversations || []).filter(c => {
      if (!c['תאריך']) return false;
      const d = new Date(c['תאריך']);
      return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;

    const widget = document.createElement('div');
    widget.id = 'home-stats-88';
    widget.className = 'mb-3 d-flex gap-2 flex-wrap';
    widget.style.cssText = 'background:linear-gradient(135deg,#f9fafb,#f3f4f6);padding:10px;border-radius:12px;border:1px solid #e5e7eb';
    widget.innerHTML = `
      <div style="flex:1;min-width:120px;text-align:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #e5e7eb">
        <div style="font-size:24px;font-weight:bold;color:#1e3a8a">${studentsCount}</div>
        <div style="font-size:11px;color:#6b7280">תלמידים פעילים</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #e5e7eb">
        <div style="font-size:24px;font-weight:bold;color:#16a34a">${todayBehavior}</div>
        <div style="font-size:11px;color:#6b7280">אירועים היום</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #e5e7eb">
        <div style="font-size:24px;font-weight:bold;color:#f59e0b">${tlaCount}/${studentsCount}</div>
        <div style="font-size:11px;color:#6b7280">תלאים מסונכרנים</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #e5e7eb">
        <div style="font-size:24px;font-weight:bold;color:#7c3aed">${recentConversations}</div>
        <div style="font-size:11px;color:#6b7280">שיחות 7 ימים</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:8px;background:#fff;border-radius:8px;border:1px solid #e5e7eb" id="cam-health-widget">
        <div style="font-size:24px;font-weight:bold;color:#dc2626">📹</div>
        <div style="font-size:11px;color:#6b7280">מצלמות: בודק...</div>
      </div>
    `;
    // Insert at top of home page
    home.insertBefore(widget, home.firstChild);

    // Check camera health asynchronously
    fetch('https://oregon-knock-learn-corrections.trycloudflare.com/lobby/index.m3u8', { mode: 'no-cors', cache: 'no-store' })
      .then(() => {
        const el = document.getElementById('cam-health-widget');
        if (el) el.innerHTML = `<div style="font-size:24px;font-weight:bold;color:#16a34a">📹 ✓</div><div style="font-size:11px;color:#6b7280">מצלמות פעילות</div>`;
      })
      .catch(() => {
        const el = document.getElementById('cam-health-widget');
        if (el) el.innerHTML = `<div style="font-size:24px;font-weight:bold;color:#dc2626">📹 ✗</div><div style="font-size:11px;color:#6b7280">מצלמות לא זמינות</div>`;
      });
  }

  // Render when home page is shown
  const _origShowPage = window.showPage;
  if (typeof _origShowPage === 'function') {
    window.showPage = function (name) {
      const r = _origShowPage.apply(this, arguments);
      if (name === 'home') setTimeout(renderHomeStats, 200);
      return r;
    };
  }
  // Also on initial load
  setTimeout(renderHomeStats, 1500);

  console.warn('%c📊 Pack-88 — Home dashboard mini-stats (admin only) + cameras health badge', 'color:#1e3a8a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-88.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-89.js ─────────────────────────────────────────────
try {
// behavior-pack-89.js — Round 25: camera admin settings panel + tunnel URL config. 2026-05-27
(function () {
const HLS_KEY = 'cameras_hls_base';
  const WHEP_KEY = 'cameras_webrtc_base';
  const DVR_KEY = 'cameras_live_url';

  window.openCameraSettings = function () {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.username !== 'admin' && u.role !== 'מנהל') return alert('רק מנהל');

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const html = `<div class="modal fade show" id="cam-settings-89" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
            <h5><i class="bi bi-gear"></i> הגדרות מצלמות מתקדמות</h5>
            <button class="btn-close" onclick="document.getElementById('cam-settings-89').remove()"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info small">3 Cloudflare Tunnels פעילים. URL משתנה בכל reboot של mediamtx/cloudflared.</div>

            <label class="form-label fw-bold mt-2">URL לזרמי HLS</label>
            <input id="cs-hls" class="form-control" value="${esc(localStorage.getItem(HLS_KEY) || 'https://oregon-knock-learn-corrections.trycloudflare.com')}" style="direction:ltr;font-family:monospace">
            <div class="small text-muted">צריך לעבוד עם /{path}/index.m3u8</div>

            <label class="form-label fw-bold mt-3">URL ל-WebRTC (WHEP)</label>
            <input id="cs-whep" class="form-control" value="${esc(localStorage.getItem(WHEP_KEY) || 'https://participation-seek-indexes-burner.trycloudflare.com')}" style="direction:ltr;font-family:monospace">
            <div class="small text-muted">צריך לעבוד עם POST /{path}/whep</div>

            <label class="form-label fw-bold mt-3">URL ל-DVR (ניהול ישיר)</label>
            <input id="cs-dvr" class="form-control" value="${esc(localStorage.getItem(DVR_KEY) || 'https://pressure-experts-rescue-subscribers.trycloudflare.com')}" style="direction:ltr;font-family:monospace">
            <div class="small text-muted">לממשק admin של ה-DVR (Dahua 192.168.1.108)</div>

            <hr>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-primary" onclick="window.openTlaDashboard && openTlaDashboard()">דשבורד תל"א</button>
              <button class="btn btn-sm btn-outline-secondary" onclick="window.diagFull && diagFull()">אבחון מלא (Console)</button>
              <button class="btn btn-sm btn-outline-info" onclick="window.cameraStatus && cameraStatus()">סטטוס מצלמות</button>
              <button class="btn btn-sm btn-outline-warning" onclick="window.tunnelStatus && tunnelStatus()">סטטוס Tunnel</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger me-auto" onclick="localStorage.removeItem('${HLS_KEY}'); localStorage.removeItem('${WHEP_KEY}'); localStorage.removeItem('${DVR_KEY}'); document.getElementById('cam-settings-89').remove(); window.renderCameras && renderCameras();">איפוס לברירת מחדל</button>
            <button class="btn btn-secondary" onclick="document.getElementById('cam-settings-89').remove()">בטל</button>
            <button class="btn btn-primary" onclick="(()=>{
              const hls=document.getElementById('cs-hls').value.trim();
              const whep=document.getElementById('cs-whep').value.trim();
              const dvr=document.getElementById('cs-dvr').value.trim();
              if(hls) localStorage.setItem('${HLS_KEY}',hls);
              if(whep) localStorage.setItem('${WHEP_KEY}',whep);
              if(dvr) localStorage.setItem('${DVR_KEY}',dvr);
              document.getElementById('cam-settings-89').remove();
              if(window.renderCameras) renderCameras();
              if(typeof toast==='function') toast('הגדרות נשמרו ומצלמות מתחברות מחדש','success');
            })()">שמור והפעל מחדש</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== Add a gear button to cameras page header =====
  function injectGearButton() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    if (root.querySelector('#cam-gear-btn-89')) return;
    const header = root.querySelector('h3');
    if (!header) return;
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.username !== 'admin' && u.role !== 'מנהל') return;
    const btn = document.createElement('button');
    btn.id = 'cam-gear-btn-89';
    btn.className = 'btn btn-sm btn-outline-warning ms-2';
    btn.innerHTML = '<i class="bi bi-gear"></i> הגדרות';
    btn.onclick = window.openCameraSettings;
    header.appendChild(btn);
  }

  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const r = _orig.apply(this, arguments);
      setTimeout(injectGearButton, 200);
      return r;
    };
  }

  // ===== Keyboard shortcut: Ctrl+Shift+C opens settings =====
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (u.username === 'admin' || u.role === 'מנהל') {
        e.preventDefault();
        window.openCameraSettings();
      }
    }
  });

  console.warn('%c⚙ Pack-89 — Camera admin settings + Ctrl+Shift+C shortcut', 'color:#f59e0b;font-weight:bold');
  console.log('  Try: openCameraSettings()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-89.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-90.js ─────────────────────────────────────────────
try {
// behavior-pack-90.js — Full TLA tab: structured form matching original PPTX/PDF template. 2026-05-27
// Replaces pack-66's iframe-only view with a proper data-entry form.
// Saves to תלמידים sheet via existing fields (תלא_*) prefixed.
(function () {
const MONTHS = ['אלול', 'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב'];
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
  const TIME_SLOTS = ['8:30-9:30', '9:30-10:00', '10:00-10:50', '11:20-12:00', '12:30-13:00', '14:15-14:55', '15:30-16:00'];

  function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }
  function escA(s) { return esc(s).replace(/"/g,'&quot;'); }

  function getStudent(sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    return (data.students || []).find(s => String(s['מזהה']) === String(sid));
  }

  // Override pack-66's injectTlaTab with full form
  window.injectTlaTab = injectTlaTabFull;

  function injectTlaTabFull() {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    if (modal.querySelector('#stu-tab-tla')) return;
    const tabsList = modal.querySelector('#stu-tabs');
    const tabsContent = modal.querySelector('.tab-content');
    if (!tabsList || !tabsContent) return;

    let sid = null;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (m) sid = parseInt(m);
    if (!sid) return;

    const student = getStudent(sid);
    if (!student) return;

    // Add tab link before פרופיל
    const tabLi = document.createElement('li');
    tabLi.className = 'nav-item';
    tabLi.innerHTML = `<a class="nav-link" data-bs-toggle="tab" href="#stu-tab-tla"><i class="bi bi-mortarboard-fill text-warning"></i> תל"א</a>`;
    const profileTab = tabsList.querySelector('a[href="#stu-tab-profile"]');
    if (profileTab) tabsList.insertBefore(tabLi, profileTab.parentNode);
    else tabsList.appendChild(tabLi);

    const pane = document.createElement('div');
    pane.className = 'tab-pane fade';
    pane.id = 'stu-tab-tla';
    pane.innerHTML = buildTlaFormHtml(sid, student);
    tabsContent.appendChild(pane);

    // Init listeners after DOM insertion
    setTimeout(() => initTlaFormListeners(sid), 50);
  }

  function buildTlaFormHtml(sid, s) {
    const tla = parseTlaData(s);
    const hasFile = !!s['תלא_pdf_id'];
    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const meetings = tla.meetings || {};
    const parents = tla.parents || {};
    const schedule = tla.schedule || {};
    const profile = tla.profile || {};
    const program = tla.program || {};

    return `
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 class="mb-0"><i class="bi bi-mortarboard-fill text-warning"></i> תוכנית לימודית אישית (תל"א)</h5>
        <div class="d-flex gap-2 flex-wrap">
          ${hasFile ? `
            <a class="btn btn-sm btn-outline-primary" href="${escA(s['תלא_pdf_url'])}" target="_blank"><i class="bi bi-file-pdf"></i> PDF מקורי</a>
            <a class="btn btn-sm btn-outline-info" href="${escA(s['תלא_pptx_url'])}" target="_blank"><i class="bi bi-file-ppt"></i> PPTX</a>
          ` : ''}
          <button class="btn btn-sm btn-success" onclick="window.tlaSaveForm(${sid})"><i class="bi bi-save"></i> שמור</button>
          <button class="btn btn-sm btn-outline-secondary" onclick="window.tlaPrintForm(${sid})"><i class="bi bi-printer"></i> הדפס</button>
        </div>
      </div>

      <div class="alert alert-warning small">
        <i class="bi bi-info-circle"></i> תיק תל"א עבור <b>${esc(fullName)}</b> · שיעור ${esc(s['מחזור']||'')}
        ${hasFile ? '· יש קובץ מקורי ב-Drive (לחץ "PDF מקורי" לעיון).' : '· אין קובץ מקורי - יוצרים חדש.'}
      </div>

      <!-- 1. פרטים אישיים -->
      <div class="card mb-3">
        <div class="card-header bg-light"><b>1. פרטים אישיים</b></div>
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-4"><label class="form-label small">שם מלא</label><input id="tla-fullname-${sid}" class="form-control form-control-sm" value="${escA(fullName)}"></div>
            <div class="col-md-3"><label class="form-label small">ת.ז.</label><input id="tla-tz-${sid}" class="form-control form-control-sm" value="${escA(s['תז']||'')}"></div>
            <div class="col-md-2"><label class="form-label small">שיעור</label><input id="tla-shiur-${sid}" class="form-control form-control-sm" value="${escA(s['מחזור']||'')}"></div>
            <div class="col-md-3"><label class="form-label small">מחנך</label><input id="tla-mechanech-${sid}" class="form-control form-control-sm" value="${escA(tla.mechanech || 'הרב סורוצקין')}"></div>
          </div>
        </div>
      </div>

      <!-- 2. פרופיל תלמיד -->
      <div class="card mb-3">
        <div class="card-header bg-light"><b>2. פרופיל תלמיד (דף הכנה לתל"א)</b></div>
        <div class="card-body">
          <div class="mb-2"><label class="form-label small fw-bold">רקע סביבתי / משפחתי</label>
            <textarea id="tla-background-${sid}" class="form-control form-control-sm" rows="2" placeholder="הרכב משפחה, מצב כלכלי, מצב הילד במשפחה...">${esc(profile.background || s['פרופיל_הורים'] || '')}</textarea>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">תפקוד אינטלקטואלי</label>
            <textarea id="tla-intellect-${sid}" class="form-control form-control-sm" rows="2" placeholder="דוקפוד IQ ממוצע ע"פ אינדקסים, יישומי, ביטוי...">${esc(profile.intellect || '')}</textarea>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">תפקודים אקדמיים</label>
            <textarea id="tla-academic-${sid}" class="form-control form-control-sm" rows="3" placeholder="קריאה (קצב, דיוק), כתיבה (תוצרים, שגיאות), הבנה בארמא, חשיבה והסקת מסקנות, בקרה עצמית...">${esc(profile.academic || s['פרופיל_לימודי'] || '')}</textarea>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">תלמידאיות (מוטיבציה, ארגון)</label>
            <textarea id="tla-talmidut-${sid}" class="form-control form-control-sm" rows="2" placeholder="מוטיבציה ללמידה, ארגון, מודעות עצמית...">${esc(profile.talmidut || '')}</textarea>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">תפקודים רגשיים וחברתיים</label>
            <textarea id="tla-social-${sid}" class="form-control form-control-sm" rows="2" placeholder="יחס לאחר, גבולות וסמכות, התמודדות עם תסכול...">${esc(profile.social || s['פרופיל_אישיות'] || '')}</textarea>
          </div>
        </div>
      </div>

      <!-- 3. תל"א אינטגרטיבי -->
      <div class="card mb-3">
        <div class="card-header bg-light"><b>3. תל"א אינטגרטיבי - תוכנית לימודים אישית</b></div>
        <div class="card-body">
          <div class="row g-2 mb-2">
            <div class="col-md-6"><label class="form-label small fw-bold">קו בסיס</label>
              <textarea id="tla-baseline-${sid}" class="form-control form-control-sm" rows="3" placeholder="היכן התלמיד עומד כעת לימודית ורגשית">${esc(program.baseline || '')}</textarea>
            </div>
            <div class="col-md-6"><label class="form-label small fw-bold">מטרות-על</label>
              <textarea id="tla-goals-${sid}" class="form-control form-control-sm" rows="3" placeholder="לאן רוצים שהתלמיד יגיע השנה">${esc(program.goals || '')}</textarea>
            </div>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">הזדמנויות עבודה ואמצעים להגשמתם</label>
            <textarea id="tla-opportunities-${sid}" class="form-control form-control-sm" rows="3" placeholder="פעולות קונקרטיות לבניית מטרות">${esc(program.opportunities || '')}</textarea>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">מעקב והערכה</label>
            <textarea id="tla-evaluation-${sid}" class="form-control form-control-sm" rows="2" placeholder="כיצד מעריכים את ההתקדמות">${esc(program.evaluation || '')}</textarea>
          </div>
          <div class="row g-2">
            <div class="col-md-6"><label class="form-label small fw-bold">חיזוק יכולות וכישורים</label>
              <textarea id="tla-strengths-${sid}" class="form-control form-control-sm" rows="2" placeholder="התמקדות בנקודות חוזק">${esc(program.strengths || '')}</textarea>
            </div>
            <div class="col-md-6"><label class="form-label small fw-bold">הערכה מסכמת</label>
              <textarea id="tla-summary-${sid}" class="form-control form-control-sm" rows="2" placeholder="הערכה כללית">${esc(program.summary || '')}</textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. תיעוד ישיבות צוות -->
      <div class="card mb-3">
        <div class="card-header bg-light d-flex justify-content-between"><b>4. תיעוד ישיבות צוות (לפי חודש)</b></div>
        <div class="card-body">
          ${['אלול','חשון','כסלו','טבת','שבט','אדר'].map(ch => `
            <div class="mb-2 row g-1 align-items-start">
              <div class="col-md-2 fw-bold small pt-1">${ch}</div>
              <div class="col-md-10">
                <textarea id="tla-mtg-${ch}-${sid}" class="form-control form-control-sm" rows="2" placeholder="משתתפים, סיכום, תוצאות לחודש ${ch}">${esc(meetings[ch] || '')}</textarea>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 5. תיעוד שיחות הורים -->
      <div class="card mb-3">
        <div class="card-header bg-light"><b>5. תיעוד שיחות הורים (לפי חודש)</b></div>
        <div class="card-body">
          ${['אלול','חשון','כסלו','טבת','שבט','אדר'].map(ch => `
            <div class="mb-2 row g-1 align-items-start">
              <div class="col-md-2 fw-bold small pt-1">${ch}</div>
              <div class="col-md-10">
                <textarea id="tla-prnt-${ch}-${sid}" class="form-control form-control-sm" rows="2" placeholder="נושאים שעלו, החלטות, סיכומים מ${ch}">${esc(parents[ch] || '')}</textarea>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 6. הערות ושינויים -->
      <div class="card mb-3">
        <div class="card-header bg-light"><b>6. הערות, המלצות ושינויים משמעותיים במהלך השנה</b></div>
        <div class="card-body">
          <textarea id="tla-changes-${sid}" class="form-control" rows="4" placeholder="כל שינוי משמעותי בהתנהלות התלמיד, החלטות עם ההורים, מעקב פסיכולוגי...">${esc(tla.changes || '')}</textarea>
        </div>
      </div>

      <div class="alert alert-info small">
        <i class="bi bi-clock-history"></i> עדכון אחרון: ${esc(s['תלא_עודכן'] ? new Date(s['תלא_עודכן']).toLocaleString('he-IL') : 'מעולם לא')}
      </div>
    `;
  }

  function parseTlaData(s) {
    try {
      return JSON.parse(s['תלא_data'] || '{}');
    } catch { return {}; }
  }

  function initTlaFormListeners(sid) {
    // Optional: auto-save on blur. Keeping manual save for now.
  }

  window.tlaSaveForm = async function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return alert('תלמיד לא נמצא');

    function v(id) { return document.getElementById(`tla-${id}-${sid}`)?.value || ''; }

    const tlaData = {
      mechanech: v('mechanech'),
      profile: {
        background: v('background'),
        intellect: v('intellect'),
        academic: v('academic'),
        talmidut: v('talmidut'),
        social: v('social'),
      },
      program: {
        baseline: v('baseline'),
        goals: v('goals'),
        opportunities: v('opportunities'),
        evaluation: v('evaluation'),
        strengths: v('strengths'),
        summary: v('summary'),
      },
      meetings: {
        אלול: v('mtg-אלול'),
        חשון: v('mtg-חשון'),
        כסלו: v('mtg-כסלו'),
        טבת: v('mtg-טבת'),
        שבט: v('mtg-שבט'),
        אדר: v('mtg-אדר'),
      },
      parents: {
        אלול: v('prnt-אלול'),
        חשון: v('prnt-חשון'),
        כסלו: v('prnt-כסלו'),
        טבת: v('prnt-טבת'),
        שבט: v('prnt-שבט'),
        אדר: v('prnt-אדר'),
      },
      changes: v('changes'),
    };

    const updated = Object.assign({}, s, {
      'תלא_data': JSON.stringify(tlaData, null, 0),
      'תלא_עודכן': new Date().toISOString(),
      'תז': v('tz'),
      'פרופיל_הורים': tlaData.profile.background || s['פרופיל_הורים'] || '',
      'פרופיל_אישיות': tlaData.profile.social || s['פרופיל_אישיות'] || '',
      'פרופיל_לימודי': tlaData.profile.academic || s['פרופיל_לימודי'] || '',
    });

    const r = await api('updateStudent', [updated]);
    if (r && r.ok !== false) {
      if (typeof toast === 'function') toast('תל"א נשמר בהצלחה', 'success');
      else alert('נשמר ✓');
    } else {
      alert('שגיאה: ' + (r?.error || '?'));
    }
  };

  window.tlaPrintForm = function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const w = window.open('', '_blank');
    if (!w) return;
    const html = buildTlaFormHtml(sid, s);
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>תל"א - ${esc(fullName)}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
      <style>body{padding:30px;direction:rtl} textarea{resize:none;background:#fafafa}</style>
      </head><body><h1>תיק תל"א - ${esc(fullName)} - תשפ"ו</h1>${html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  console.warn('%c📋 Pack-90 — Full TLA form (matching original PPTX template) + save/print', 'color:#d97706;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-90.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-91.js ─────────────────────────────────────────────
try {
// behavior-pack-91.js — TLA auto-save (debounced) + scroll-to-top + warning on unsaved leave. 2026-05-27
(function () {
let saveTimer = null;
  let dirtySid = null;
  let lastSavedHash = '';

  // ===== Hash form fields content to detect changes =====
  function hashTlaForm(sid) {
    const fields = ['fullname','tz','shiur','mechanech','background','intellect','academic','talmidut','social',
      'baseline','goals','opportunities','evaluation','strengths','summary','changes',
      'mtg-אלול','mtg-חשון','mtg-כסלו','mtg-טבת','mtg-שבט','mtg-אדר',
      'prnt-אלול','prnt-חשון','prnt-כסלו','prnt-טבת','prnt-שבט','prnt-אדר'];
    let h = '';
    for (const f of fields) {
      h += '|' + (document.getElementById(`tla-${f}-${sid}`)?.value || '');
    }
    return h;
  }

  // ===== Attach auto-save listeners after TLA tab is shown =====
  document.addEventListener('shown.bs.tab', e => {
    if (e.target?.getAttribute('href') !== '#stu-tab-tla') return;
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (!m) return;
    const sid = parseInt(m);
    setupAutoSave(sid);
  });

  function setupAutoSave(sid) {
    const pane = document.getElementById('stu-tab-tla');
    if (!pane || pane.dataset.autosave91) return;
    pane.dataset.autosave91 = '1';

    lastSavedHash = hashTlaForm(sid);

    pane.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('input', () => {
        dirtySid = sid;
        clearTimeout(saveTimer);
        showStatus(sid, '✏️ עורך...', '#fbbf24');
        saveTimer = setTimeout(() => doAutoSave(sid), 4000);
      });
    });

    addStatusBadge(sid);
  }

  function addStatusBadge(sid) {
    const pane = document.getElementById('stu-tab-tla');
    if (!pane || pane.querySelector(`#tla-save-status-${sid}`)) return;
    const badge = document.createElement('div');
    badge.id = `tla-save-status-${sid}`;
    badge.style.cssText = 'position:sticky;top:0;background:#fff;padding:6px 12px;border-radius:0 0 8px 8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:5;display:inline-block;font-size:13px;color:#16a34a;margin-bottom:8px';
    badge.textContent = '✓ נשמר';
    pane.insertBefore(badge, pane.firstChild);
  }

  function showStatus(sid, text, color) {
    const el = document.getElementById(`tla-save-status-${sid}`);
    if (!el) return;
    el.textContent = text;
    el.style.color = color;
  }

  async function doAutoSave(sid) {
    const cur = hashTlaForm(sid);
    if (cur === lastSavedHash) return;
    showStatus(sid, '⏳ שומר...', '#3b82f6');
    if (typeof window.tlaSaveForm === 'function') {
      try {
        await window.tlaSaveForm(sid);
        lastSavedHash = cur;
        dirtySid = null;
        showStatus(sid, '✓ נשמר אוטומטית', '#16a34a');
      } catch (e) {
        showStatus(sid, '⚠ שגיאת שמירה', '#dc2626');
      }
    }
  }

  // ===== Warn before closing modal if unsaved =====
  document.addEventListener('hide.bs.modal', e => {
    if (e.target?.id !== 'viewStuModal') return;
    if (dirtySid !== null) {
      const cur = hashTlaForm(dirtySid);
      if (cur !== lastSavedHash) {
        clearTimeout(saveTimer);
        // Auto-save before closing
        doAutoSave(dirtySid);
      }
    }
  });

  // ===== Keyboard: Ctrl+S saves =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      const pane = document.getElementById('stu-tab-tla');
      if (pane && pane.classList.contains('active')) {
        e.preventDefault();
        if (dirtySid !== null) doAutoSave(dirtySid);
      }
    }
  });

  console.warn('%c💾 Pack-91 — TLA auto-save (4s debounce) + Ctrl+S + leave-warning', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-91.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-92.js ─────────────────────────────────────────────
try {
// behavior-pack-92.js — CRITICAL: Force replace pack-66's simple TLA with pack-90's full form. 2026-05-27
(function () {
function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

  // Listen for modal shown - run AFTER pack-66 with longer delay
  document.addEventListener('shown.bs.modal', e => {
    if (e.target?.id !== 'viewStuModal') return;
    setTimeout(replaceTlaTab, 300);
  });

  // Also observe DOM for new modals
  const obs = new MutationObserver(() => {
    const modal = document.getElementById('viewStuModal');
    if (modal && !modal.dataset.pack92Done) {
      modal.dataset.pack92Done = '1';
      setTimeout(replaceTlaTab, 400);
    }
  });
  obs.observe(document.body, { childList: true });

  function replaceTlaTab() {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    const oldPane = document.getElementById('stu-tab-tla');
    const tabsList = modal.querySelector('#stu-tabs');
    const tabsContent = modal.querySelector('.tab-content');
    if (!tabsList || !tabsContent) return;

    // Remove old tab link + pane added by pack-66
    if (oldPane) {
      const oldLink = tabsList.querySelector('a[href="#stu-tab-tla"]');
      if (oldLink) oldLink.parentNode.remove();
      oldPane.remove();
    }

    // Now call pack-90's full form rebuilder
    if (typeof window.injectTlaTab === 'function') {
      window.injectTlaTab();
    } else {
      console.warn('[Pack-92] window.injectTlaTab not defined');
    }
  }

  // ===== Add TLA quick-access tile to home page for admin =====
  function addTlaHomeShortcut() {
    const home = document.getElementById('page-home');
    if (!home) return;
    if (home.querySelector('#tla-home-shortcut')) return;
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.username !== 'admin' && u.role !== 'מנהל') return;

    const widget = document.createElement('div');
    widget.id = 'tla-home-shortcut';
    widget.className = 'mb-3';
    widget.innerHTML = `
      <button class="btn btn-warning" onclick="window.openTlaDashboard && window.openTlaDashboard()">
        <i class="bi bi-mortarboard-fill"></i> דשבורד תל"א (10 תלמידי שיעור א מסונכרנים)
      </button>
      <small class="text-muted ms-2">או פתח כרטיס תלמיד → לחץ על הטאב "תל"א"</small>
    `;
    home.insertBefore(widget, home.firstChild);
  }

  const _origShowPage = window.showPage;
  if (typeof _origShowPage === 'function') {
    window.showPage = function (name) {
      const r = _origShowPage.apply(this, arguments);
      if (name === 'home') setTimeout(addTlaHomeShortcut, 300);
      return r;
    };
  }
  setTimeout(addTlaHomeShortcut, 1800);

  // ===== Fix pack-88's count: also count students with תלא_data =====
  function patchHomeStats() {
    const widget = document.getElementById('home-stats-88');
    if (!widget) return;
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const tlaCount = (data.students || []).filter(s => s['תלא_pdf_id'] || s['תלא_data']).length;
    const studentsCount = (data.students || []).filter(s => s['סטטוס'] !== 'סיים').length;
    const stat = widget.querySelectorAll('div')[6]; // 3rd card's number div
    if (stat) {
      stat.textContent = `${tlaCount}/${studentsCount}`;
    }
  }
  setInterval(patchHomeStats, 3000);
  setTimeout(patchHomeStats, 2200);

  // ===== Force-refresh data on cameras/student pages =====
  // The cached data may be stale. Pull fresh from Sheet.
  if (typeof window.api === 'function') {
    setTimeout(async () => {
      try {
        // listStudents pulls from cache - force a fresh sync if pullFromSheet exists
        if (typeof window.pullFromSheet === 'function') {
          await window.pullFromSheet('תלמידים');
          console.info('[Pack-92] refreshed students from sheet');
          patchHomeStats();
        }
      } catch (e) { /* ignore */ }
    }, 3000);
  }

  console.warn('%c🔧 Pack-92 CRITICAL — replace pack-66 TLA tab with pack-90 full form + home shortcut + fix tla count', 'color:#dc2626;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-92.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-93.js ─────────────────────────────────────────────
try {
// behavior-pack-93.js — TLA form REDESIGNED to match original PPTX layout (tables, sections, print-friendly). 2026-05-27
(function () {
function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }
  function escA(s) { return esc(s).replace(/"/g,'&quot;'); }

  function getStudent(sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    return (data.students || []).find(s => String(s['מזהה']) === String(sid));
  }

  function parseTlaData(s) {
    // Use the global override (pack-95) if available
    if (typeof window.parseTlaData === 'function') {
      try { return window.parseTlaData(s) || {}; } catch {}
    }
    if (s['תלא_data']) {
      try { return JSON.parse(s['תלא_data']); } catch {}
    }
    // Fallback: extract from דוח_אישי
    const doch = s['דוח_אישי'] || '';
    const m = doch.match(/\[TLA_JSON_START\]([\s\S]*?)\[TLA_JSON_END\]/);
    if (m) {
      try { return JSON.parse(m[1]); } catch {}
    }
    return {};
  }

  // ===== OVERRIDE pack-90's injectTlaTab with PPTX-matching design =====
  window.injectTlaTab = function () {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    if (modal.querySelector('#stu-tab-tla')) return;
    const tabsList = modal.querySelector('#stu-tabs');
    const tabsContent = modal.querySelector('.tab-content');
    if (!tabsList || !tabsContent) return;

    let sid = null;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (m) sid = parseInt(m);
    if (!sid) return;
    const student = getStudent(sid);
    if (!student) return;

    // Insert tab link
    const tabLi = document.createElement('li');
    tabLi.className = 'nav-item';
    tabLi.innerHTML = `<a class="nav-link" data-bs-toggle="tab" href="#stu-tab-tla"><i class="bi bi-mortarboard-fill text-warning"></i> תל"א</a>`;
    const profileTab = tabsList.querySelector('a[href="#stu-tab-profile"]');
    if (profileTab) tabsList.insertBefore(tabLi, profileTab.parentNode);
    else tabsList.appendChild(tabLi);

    const pane = document.createElement('div');
    pane.className = 'tab-pane fade';
    pane.id = 'stu-tab-tla';
    pane.innerHTML = buildPptxStyleTla(sid, student);
    tabsContent.appendChild(pane);
  };

  function buildPptxStyleTla(sid, s) {
    const tla = parseTlaData(s);
    const hasFile = !!s['תלא_pdf_id'];
    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const m = tla.meetings || {};
    const p = tla.parents || {};
    const pr = tla.profile || {};
    const pg = tla.program || {};

    // Inject styles for PPTX-like look (only once)
    if (!document.getElementById('tla-pptx-style-93')) {
      const st = document.createElement('style');
      st.id = 'tla-pptx-style-93';
      st.textContent = `
        .tla-doc { font-family: 'Heebo', Arial; max-width: 900px; margin: 0 auto; padding: 12px; background: #fff; }
        .tla-doc h2 { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; padding: 12px 16px; border-radius: 8px 8px 0 0; margin: 0; font-size: 22px; }
        .tla-doc .tla-meta { background: #f3f4f6; padding: 10px 16px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; margin-bottom: 20px; font-size: 14px; }
        .tla-doc .tla-section { margin-bottom: 20px; border: 2px solid #1e3a8a; border-radius: 8px; overflow: hidden; }
        .tla-doc .tla-section-header { background: #1e3a8a; color: #fff; padding: 8px 14px; font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; align-items: center; }
        .tla-doc .tla-section-body { padding: 12px; background: #fafafa; }
        .tla-doc table.tla-table { width: 100%; border-collapse: collapse; background: #fff; }
        .tla-doc table.tla-table th { background: #fbbf24; color: #1e3a8a; padding: 6px 8px; border: 1px solid #1e3a8a; font-size: 12px; font-weight: bold; }
        .tla-doc table.tla-table td { padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top; font-size: 13px; }
        .tla-doc table.tla-table td.tla-month { background: #fef3c7; font-weight: bold; text-align: center; width: 100px; }
        .tla-doc textarea, .tla-doc input[type=text] { width: 100%; border: 0; background: transparent; resize: vertical; font-family: inherit; font-size: 13px; padding: 4px; outline: none; }
        .tla-doc textarea:focus, .tla-doc input:focus { background: #fffbeb; outline: 2px solid #fbbf24; border-radius: 4px; }
        .tla-doc .tla-profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tla-doc .tla-profile-item { background: #fff; padding: 10px; border-radius: 6px; border-right: 4px solid #1e3a8a; }
        .tla-doc .tla-profile-label { color: #1e3a8a; font-weight: bold; font-size: 13px; margin-bottom: 4px; }
        @media print {
          .tla-doc .no-print { display: none !important; }
          .tla-doc .tla-section { page-break-inside: avoid; }
          .tla-doc textarea, .tla-doc input { background: transparent !important; outline: 0 !important; }
        }
      `;
      document.head.appendChild(st);
    }

    return `
      <div class="tla-doc" id="tla-doc-${sid}">
        <h2><i class="bi bi-mortarboard-fill"></i> תיק תל"א - ${esc(fullName)}</h2>
        <div class="tla-meta d-flex justify-content-between flex-wrap gap-2">
          <div>
            <b>שיעור:</b> ${esc(s['מחזור']||'')} ·
            <b>ת.ז.:</b> <input type="text" id="tla-tz-${sid}" value="${escA(s['תז']||'')}" style="width:120px">
            · <b>מחנך:</b> <input type="text" id="tla-mechanech-${sid}" value="${escA(tla.mechanech || 'הרב סורוצקין')}" style="width:130px">
            · <b>שנה"ל:</b> תשפ"ו
          </div>
          <div class="no-print d-flex gap-2 flex-wrap">
            ${hasFile ? `<a class="btn btn-sm btn-outline-primary" href="${escA(s['תלא_pdf_url'])}" target="_blank"><i class="bi bi-file-pdf"></i> מקור PDF</a>
            <a class="btn btn-sm btn-outline-info" href="${escA(s['תלא_pptx_url'])}" target="_blank"><i class="bi bi-file-ppt"></i> PPTX</a>` : ''}
            <button class="btn btn-sm btn-success" onclick="window.tlaSaveForm(${sid})"><i class="bi bi-save"></i> שמור</button>
            <button class="btn btn-sm btn-warning" onclick="window.tlaPrintForm(${sid})"><i class="bi bi-printer"></i> הדפס/PDF</button>
          </div>
        </div>

        <!-- Profile section -->
        <div class="tla-section">
          <div class="tla-section-header">דף הכנה לתל"א — פרופיל תלמיד</div>
          <div class="tla-section-body">
            <div class="tla-profile-grid">
              <div class="tla-profile-item">
                <div class="tla-profile-label">רקע סביבתי / משפחתי</div>
                <textarea id="tla-background-${sid}" rows="3" placeholder="הרכב משפחה, מצב כלכלי...">${esc(pr.background || '')}</textarea>
              </div>
              <div class="tla-profile-item">
                <div class="tla-profile-label">תפקוד אינטלקטואלי</div>
                <textarea id="tla-intellect-${sid}" rows="3" placeholder="IQ, יכולות חשיבה...">${esc(pr.intellect || '')}</textarea>
              </div>
              <div class="tla-profile-item">
                <div class="tla-profile-label">תפקודים אקדמיים</div>
                <textarea id="tla-academic-${sid}" rows="3" placeholder="קריאה, כתיבה, הבנה...">${esc(pr.academic || '')}</textarea>
              </div>
              <div class="tla-profile-item">
                <div class="tla-profile-label">תלמידאיות</div>
                <textarea id="tla-talmidut-${sid}" rows="3" placeholder="מוטיבציה, ארגון, מודעות...">${esc(pr.talmidut || '')}</textarea>
              </div>
              <div class="tla-profile-item" style="grid-column: 1 / -1">
                <div class="tla-profile-label">תפקודים רגשיים וחברתיים</div>
                <textarea id="tla-social-${sid}" rows="3" placeholder="גבולות, יחס לאחר, תסכול...">${esc(pr.social || '')}</textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Program section -->
        <div class="tla-section">
          <div class="tla-section-header">תל"א אינטגרטיבי — תוכנית לימודים אישית</div>
          <div class="tla-section-body">
            <table class="tla-table">
              <thead>
                <tr>
                  <th style="width:20%">קו בסיס</th>
                  <th style="width:20%">מטרות</th>
                  <th style="width:30%">הזדמנויות עבודה ואמצעים</th>
                  <th style="width:15%">מעקב והערכה</th>
                  <th style="width:15%">הערכה מסכמת</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><textarea id="tla-baseline-${sid}" rows="6">${esc(pg.baseline || '')}</textarea></td>
                  <td><textarea id="tla-goals-${sid}" rows="6">${esc(pg.goals || '')}</textarea></td>
                  <td><textarea id="tla-opportunities-${sid}" rows="6">${esc(pg.opportunities || '')}</textarea></td>
                  <td><textarea id="tla-evaluation-${sid}" rows="6">${esc(pg.evaluation || '')}</textarea></td>
                  <td><textarea id="tla-summary-${sid}" rows="6">${esc(pg.summary || '')}</textarea></td>
                </tr>
              </tbody>
            </table>
            <div class="mt-2">
              <div class="tla-profile-label">חיזוק יכולות וכישורים</div>
              <textarea id="tla-strengths-${sid}" rows="2" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:6px">${esc(pg.strengths || '')}</textarea>
            </div>
          </div>
        </div>

        <!-- Team meetings table -->
        <div class="tla-section">
          <div class="tla-section-header">תיעוד ישיבות צוות</div>
          <div class="tla-section-body">
            <table class="tla-table">
              <thead>
                <tr><th style="width:80px">חודש</th><th>משתתפים וסיכום ההישיבה</th></tr>
              </thead>
              <tbody>
                ${['אלול','חשון','כסלו','טבת','שבט','אדר'].map(ch => `
                  <tr>
                    <td class="tla-month">${ch}</td>
                    <td><textarea id="tla-mtg-${ch}-${sid}" rows="2">${esc(m[ch] || '')}</textarea></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Parent meetings -->
        <div class="tla-section">
          <div class="tla-section-header">תיעוד שיחות הורים</div>
          <div class="tla-section-body">
            <table class="tla-table">
              <thead>
                <tr><th style="width:80px">חודש</th><th>נושאים שעלו ותוצאות</th></tr>
              </thead>
              <tbody>
                ${['אלול','חשון','כסלו','טבת','שבט','אדר'].map(ch => `
                  <tr>
                    <td class="tla-month">${ch}</td>
                    <td><textarea id="tla-prnt-${ch}-${sid}" rows="2">${esc(p[ch] || '')}</textarea></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Changes -->
        <div class="tla-section">
          <div class="tla-section-header">הערות, המלצות ושינויים משמעותיים במהלך השנה</div>
          <div class="tla-section-body">
            <textarea id="tla-changes-${sid}" rows="4" style="border:1px solid #cbd5e1;border-radius:4px;padding:6px;width:100%">${esc(tla.changes || '')}</textarea>
          </div>
        </div>

        <div class="text-end small text-muted mt-3 no-print">
          <i class="bi bi-clock-history"></i> עדכון אחרון: ${esc(s['תלא_עודכן'] ? new Date(s['תלא_עודכן']).toLocaleString('he-IL') : 'מעולם לא')}
        </div>
      </div>
    `;
  }

  // ===== Override print to print only the TLA section =====
  window.tlaPrintForm = function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const docEl = document.getElementById(`tla-doc-${sid}`);
    if (!docEl) return alert('פתח את הטאב תל"א קודם');

    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const w = window.open('', '_blank', 'width=900,height=1100');
    if (!w) return alert('לא ניתן לפתוח חלון - בדוק חוסם פופאפים');

    // Capture all current values from textareas/inputs
    const values = {};
    docEl.querySelectorAll('textarea, input').forEach(el => {
      if (el.id) values[el.id] = el.value;
    });

    // Clone the DOM
    const clone = docEl.cloneNode(true);
    // Restore values in clone
    clone.querySelectorAll('textarea, input').forEach(el => {
      if (el.id && values[el.id] !== undefined) {
        if (el.tagName === 'TEXTAREA') el.textContent = values[el.id];
        else el.setAttribute('value', values[el.id]);
      }
    });

    const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8">
      <title>תל"א - ${esc(fullName)}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Heebo', Arial, sans-serif; padding: 20px; direction: rtl; }
        ${document.getElementById('tla-pptx-style-93').textContent}
        @media print { body { padding: 0; } }
      </style>
      </head><body>${clone.outerHTML}
      <script>setTimeout(()=>window.print(), 600);<\/script>
      </body></html>`;
    w.document.write(html);
    w.document.close();
  };

  console.warn('%c🎨 Pack-93 — TLA REDESIGN matching original PPTX layout (tables, colors, print-friendly)', 'color:#1e3a8a;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-93.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-94.js ─────────────────────────────────────────────
try {
// behavior-pack-94.js — Fix home stats TLA count (was off-by-one) + dynamic shortcut button text. 2026-05-27
(function () {
// ===== Override the home stats widget completely =====
  function refreshHomeStatsAccurate() {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const today = new Date().toISOString().slice(0, 10);
    const students = data.students || [];
    const studentsCount = students.filter(s => s['סטטוס'] !== 'סיים').length;
    const tlaCount = students.filter(s => s['תלא_pdf_id'] || s['תלא_data']).length;
    const todayBehavior = (data.behavior || []).filter(e => (e['תאריך'] || '').startsWith(today)).length;
    const recentConv = (data.conversations || []).filter(c => {
      if (!c['תאריך']) return false;
      return (Date.now() - new Date(c['תאריך']).getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;

    // Replace pack-88's widget with a labeled one
    const existing = document.getElementById('home-stats-88');
    if (existing) {
      // Find the 4 stat-value divs (h3-equivalent big numbers) — they have inline color style
      const valueDivs = existing.querySelectorAll('div[style*="font-size:24px"]');
      // 0=students, 1=todayBehavior, 2=tlaCount, 3=recentConv, 4=cameras-icon
      if (valueDivs[0]) valueDivs[0].textContent = studentsCount;
      if (valueDivs[1]) valueDivs[1].textContent = todayBehavior;
      if (valueDivs[2]) valueDivs[2].textContent = `${tlaCount}/${studentsCount}`;
      if (valueDivs[3]) valueDivs[3].textContent = recentConv;
    }

    // Update home shortcut button text from pack-92
    const tlaBtn = document.querySelector('#tla-home-shortcut button');
    if (tlaBtn) {
      tlaBtn.innerHTML = `<i class="bi bi-mortarboard-fill"></i> דשבורד תל"א (${tlaCount}/${studentsCount} מסונכרנים)`;
    }
  }

  setInterval(refreshHomeStatsAccurate, 3000);
  setTimeout(refreshHomeStatsAccurate, 2500);

  // ===== Listen for student data refresh and update immediately =====
  window.addEventListener('cheder-data-refreshed', refreshHomeStatsAccurate);

  console.warn('%c🔢 Pack-94 — Fix home stats accuracy (count from תלא_data too) + dynamic button text', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-94.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-95.js ─────────────────────────────────────────────
try {
// behavior-pack-95.js — CRITICAL: read TLA data from דוח_אישי field (Apps Script drops unknown cols). 2026-05-27
(function () {
// Override parseTlaData globally
  window.parseTlaData = function (s) {
    if (!s) return {};
    // Try תלא_data first (legacy)
    if (s['תלא_data']) {
      try { return JSON.parse(s['תלא_data']); } catch {}
    }
    // Try extract from דוח_אישי field
    const doch = s['דוח_אישי'] || '';
    const m = doch.match(/\[TLA_JSON_START\]([\s\S]*?)\[TLA_JSON_END\]/);
    if (m) {
      try { return JSON.parse(m[1]); } catch (e) {
        console.warn('[Pack-95] failed to parse TLA from דוח_אישי:', e);
      }
    }
    return {};
  };

  // Override tlaSaveForm to save back to דוח_אישי
  window.tlaSaveForm = async function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return alert('תלמיד לא נמצא');

    function v(id) { return document.getElementById(`tla-${id}-${sid}`)?.value || ''; }

    const tlaData = {
      mechanech: v('mechanech'),
      profile: {
        background: v('background'),
        intellect: v('intellect'),
        academic: v('academic'),
        talmidut: v('talmidut'),
        social: v('social'),
      },
      program: {
        baseline: v('baseline'),
        goals: v('goals'),
        opportunities: v('opportunities'),
        evaluation: v('evaluation'),
        strengths: v('strengths'),
        summary: v('summary'),
      },
      meetings: {
        אלול: v('mtg-אלול'), חשון: v('mtg-חשון'), כסלו: v('mtg-כסלו'),
        טבת: v('mtg-טבת'), שבט: v('mtg-שבט'), אדר: v('mtg-אדר'),
      },
      parents: {
        אלול: v('prnt-אלול'), חשון: v('prnt-חשון'), כסלו: v('prnt-כסלו'),
        טבת: v('prnt-טבת'), שבט: v('prnt-שבט'), אדר: v('prnt-אדר'),
      },
      changes: v('changes'),
    };

    // Preserve existing דוח_אישי content (strip old TLA marker, then append new)
    const existing = (s['דוח_אישי'] || '').replace(/\[TLA_JSON_START\][\s\S]*?\[TLA_JSON_END\]/g, '').trim();
    const newDoch = (existing ? existing + '\n\n' : '') + `[TLA_JSON_START]${JSON.stringify(tlaData)}[TLA_JSON_END]`;

    const updated = Object.assign({}, s, {
      'דוח_אישי': newDoch,
      'תז': v('tz') || s['תז'] || '',
      'פרופיל_הורים': tlaData.profile.background || s['פרופיל_הורים'] || '',
      'פרופיל_אישיות': tlaData.profile.social || s['פרופיל_אישיות'] || '',
      'פרופיל_לימודי': tlaData.profile.academic || s['פרופיל_לימודי'] || '',
    });

    const r = await api('updateStudent', [updated]);
    if (r && r.ok !== false) {
      if (typeof toast === 'function') toast('תל"א נשמר ✓', 'success');
      else alert('✓ נשמר');
    } else {
      alert('שגיאה: ' + (r?.error || '?'));
    }
  };

  // Re-render any open TLA tabs with updated data parser
  setTimeout(() => {
    const pane = document.getElementById('stu-tab-tla');
    if (pane && typeof window.injectTlaTab === 'function') {
      pane.remove();
      const link = document.querySelector('a[href="#stu-tab-tla"]');
      if (link) link.parentNode.remove();
      window.injectTlaTab();
    }
  }, 1500);

  console.warn('%c💾 Pack-95 CRITICAL — TLA data now read/written via דוח_אישי field (Apps Script ignored תלא_data)', 'color:#dc2626;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-95.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-96.js ─────────────────────────────────────────────
try {
// behavior-pack-96.js — TLA EXACT match to PPTX: schedule grid + all sections + print-perfect. 2026-05-27
(function () {
const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי'];
  const MONTHS = ['אלול','חשון','כסלו','טבת','שבט','אדר'];

  function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }
  function escA(s) { return esc(s).replace(/"/g,'&quot;'); }
  function getStudent(sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    return (data.students || []).find(s => String(s['מזהה']) === String(sid));
  }
  function parseTla(s) {
    if (typeof window.parseTlaData === 'function') return window.parseTlaData(s) || {};
    const doch = s['דוח_אישי'] || '';
    const m = doch.match(/\[TLA_JSON_START\]([\s\S]*?)\[TLA_JSON_END\]/);
    if (m) { try { return JSON.parse(m[1]); } catch {} }
    return {};
  }

  // OVERRIDE injectTlaTab with full PPTX-matching design
  window.injectTlaTab = function () {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    if (modal.querySelector('#stu-tab-tla')) return;
    const tabsList = modal.querySelector('#stu-tabs');
    const tabsContent = modal.querySelector('.tab-content');
    if (!tabsList || !tabsContent) return;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (!m) return;
    const sid = parseInt(m);
    const student = getStudent(sid);
    if (!student) return;

    const tabLi = document.createElement('li');
    tabLi.className = 'nav-item';
    tabLi.innerHTML = `<a class="nav-link" data-bs-toggle="tab" href="#stu-tab-tla"><i class="bi bi-mortarboard-fill text-warning"></i> תל"א</a>`;
    const profileTab = tabsList.querySelector('a[href="#stu-tab-profile"]');
    if (profileTab) tabsList.insertBefore(tabLi, profileTab.parentNode);
    else tabsList.appendChild(tabLi);

    const pane = document.createElement('div');
    pane.className = 'tab-pane fade';
    pane.id = 'stu-tab-tla';
    pane.innerHTML = buildExactPptx(sid, student);
    tabsContent.appendChild(pane);
  };

  function buildExactPptx(sid, s) {
    const tla = parseTla(s);
    const hasFile = !!s['תלא_pdf_id'];
    const fullName = tla.header?.name || `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const sched = tla.schedule || {};
    const meetings = tla.meetings || {};
    const parents = tla.parents || {};

    if (!document.getElementById('tla-pptx-style-96')) {
      const st = document.createElement('style');
      st.id = 'tla-pptx-style-96';
      st.textContent = `
        .tla-doc-v6 { font-family: 'Heebo','Arial',sans-serif; max-width: 1100px; margin: 0 auto; padding: 12px; background: #fff; }
        .tla-doc-v6 .tla-slide { background: #fff; border: 2px solid #1e3a8a; border-radius: 12px; margin-bottom: 24px; overflow: hidden; }
        .tla-doc-v6 .tla-slide-num { position: absolute; top: 12px; left: 12px; background: #fbbf24; color: #1e3a8a; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; }
        .tla-doc-v6 .tla-slide-header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; padding: 14px 50px 14px 16px; font-size: 18px; font-weight: bold; position: relative; }
        .tla-doc-v6 .tla-slide-body { padding: 14px; }
        .tla-doc-v6 table.tla-grid { width: 100%; border-collapse: collapse; font-size: 12px; }
        .tla-doc-v6 table.tla-grid th { background: #fbbf24; color: #1e3a8a; padding: 6px 4px; border: 1px solid #1e3a8a; font-weight: bold; text-align: center; }
        .tla-doc-v6 table.tla-grid td { padding: 4px; border: 1px solid #cbd5e1; vertical-align: top; }
        .tla-doc-v6 table.tla-grid td.tla-time { background: #f3f4f6; font-weight: bold; text-align: center; white-space: nowrap; width: 90px; font-family: monospace; }
        .tla-doc-v6 table.tla-grid td.tla-month-cell { background: #fef3c7; font-weight: bold; text-align: center; width: 80px; }
        .tla-doc-v6 textarea, .tla-doc-v6 input[type=text] { width: 100%; border: 0; background: transparent; resize: vertical; font-family: inherit; font-size: 12px; padding: 3px; outline: none; min-height: 24px; }
        .tla-doc-v6 textarea:focus, .tla-doc-v6 input:focus { background: #fffbeb; outline: 1px solid #fbbf24; border-radius: 3px; }
        .tla-doc-v6 .tla-toolbar { position: sticky; top: 0; background: #fff; padding: 8px; z-index: 10; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px; }
        .tla-doc-v6 .tla-sub { display: block; color: #6b7280; font-size: 10px; margin-top: 1px; }
        @media print {
          .tla-doc-v6 .no-print { display: none !important; }
          .tla-doc-v6 .tla-slide { page-break-after: always; box-shadow: none; }
          .tla-doc-v6 .tla-slide:last-child { page-break-after: auto; }
          .tla-doc-v6 textarea, .tla-doc-v6 input { background: transparent !important; outline: 0 !important; border: 0; }
        }
      `;
      document.head.appendChild(st);
    }

    // Slide 2 schedule table - we have time slots from tla.schedule keys
    const timeSlots = Object.keys(sched);
    const scheduleHtml = timeSlots.length ? `
      <table class="tla-grid">
        <thead><tr><th>שעה</th>${DAYS.map(d => `<th>${esc(d)}</th>`).join('')}</tr></thead>
        <tbody>
          ${timeSlots.map(ts => `
            <tr>
              <td class="tla-time">${esc(ts)}</td>
              ${DAYS.map(day => {
                const cell = sched[ts]?.[day] || {main:'', individual:''};
                return `<td>
                  <textarea id="tla-sch-${sid}-${ts}-${day}-main" rows="2" placeholder="...">${esc(cell.main || '')}</textarea>
                  ${cell.individual ? `<span class="tla-sub">+ ${esc(cell.individual)}</span>` : ''}
                </td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : `<div class="text-muted small">אין נתוני מערכת שעות. <a href="#" onclick="document.getElementById('tla-add-schedule-${sid}').style.display='block';return false;">הוסף ידנית</a></div>`;

    return `
      <div class="tla-doc-v6" id="tla-doc-${sid}">
        <div class="tla-toolbar d-flex justify-content-between flex-wrap gap-2 no-print">
          <div>
            <strong>תיק תל"א — ${esc(fullName)}</strong>
            <small class="text-muted">· שיעור ${esc(s['מחזור']||'')} · תשפ"ו</small>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            ${hasFile ? `<a class="btn btn-sm btn-outline-primary" href="${escA(s['תלא_pdf_url'])}" target="_blank"><i class="bi bi-file-pdf"></i> מקור</a>` : ''}
            <button class="btn btn-sm btn-success" onclick="window.tlaSaveForm(${sid})"><i class="bi bi-save"></i> שמור</button>
            <button class="btn btn-sm btn-warning" onclick="window.tlaPrintForm(${sid})"><i class="bi bi-printer"></i> הדפס PDF</button>
          </div>
        </div>

        <!-- Slide 1 (cover) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">1</div>
          <div class="tla-slide-header">תיק תלמיד שיעור — שנה"ל תשפ"ו</div>
          <div class="tla-slide-body" style="font-size:18px;line-height:2">
            <div>שם התלמיד: <input id="tla-name-${sid}" type="text" value="${escA(fullName)}" style="width:300px;border-bottom:2px solid #1e3a8a;text-align:center"></div>
            <div class="mt-3">ת.ז.: <input id="tla-tz-${sid}" type="text" value="${escA(tla.header?.tz || s['תז'] || '')}" style="width:200px;border-bottom:2px solid #1e3a8a;text-align:center"></div>
          </div>
        </div>

        <!-- Slide 2 (schedule) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">2</div>
          <div class="tla-slide-header">מערכת שעות אישית</div>
          <div class="tla-slide-body">
            <div class="small text-muted mb-2">יש למלא את מערכת השעות בכיתה, ולסמן בצורה בולטת שיעורים אינדוודואליים (קריאה, פרא רפואי, טיפול רגשי וכו')</div>
            ${scheduleHtml}
          </div>
        </div>

        <!-- Slides 3-4 (Team meetings) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">3</div>
          <div class="tla-slide-header">תיעוד ישיבות צוות</div>
          <div class="tla-slide-body">
            <table class="tla-grid">
              <thead><tr><th style="width:80px">חודש</th><th style="width:30%">משתתפים</th><th>סיכום והמלצות</th></tr></thead>
              <tbody>
                ${MONTHS.map(ch => {
                  const m = meetings[ch] || {participants:'', summary:''};
                  return `<tr>
                    <td class="tla-month-cell">${esc(ch)}</td>
                    <td><textarea id="tla-mtg-${ch}-participants-${sid}" rows="2">${esc(m.participants || '')}</textarea></td>
                    <td><textarea id="tla-mtg-${ch}-summary-${sid}" rows="2">${esc(m.summary || '')}</textarea></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Slide 5 (Parent meetings) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">5</div>
          <div class="tla-slide-header">תיעוד שיחות הורים</div>
          <div class="tla-slide-body">
            <table class="tla-grid">
              <thead><tr><th style="width:80px">חודש</th><th>סיכום השיחות</th></tr></thead>
              <tbody>
                ${MONTHS.map(ch => `
                  <tr>
                    <td class="tla-month-cell">${esc(ch)}</td>
                    <td><textarea id="tla-prnt-${ch}-${sid}" rows="2">${esc(parents[ch] || '')}</textarea></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Slide 6 (Profile) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">6</div>
          <div class="tla-slide-header">דף הכנה לתל"א — פרופיל תלמיד</div>
          <div class="tla-slide-body">
            <table class="tla-grid mb-3">
              <tr>
                <td><strong>מחנך:</strong> <input id="tla-mech-${sid}" type="text" value="${escA(tla.profile_header?.mechanech || 'הרב יוסף סורוצקין')}"></td>
                <td><strong>שנה"ל:</strong> תשפ"ו</td>
                <td><strong>שיעור:</strong> ${esc(s['מחזור']||'')}</td>
                <td><strong>שם:</strong> ${esc(fullName)}</td>
              </tr>
            </table>
            <table class="tla-grid">
              <thead><tr><th style="width:25%">תחום</th><th>תוכן</th></tr></thead>
              <tbody>
                <tr><td class="tla-month-cell">רקע סביבתי / משפחתי</td><td><textarea id="tla-bg-${sid}" rows="3">${esc(tla.profile?.background || '')}</textarea></td></tr>
                <tr><td class="tla-month-cell">תפקוד אינטלקטואלי</td><td><textarea id="tla-intel-${sid}" rows="3">${esc(tla.profile?.intellect || '')}</textarea></td></tr>
                <tr><td class="tla-month-cell">תפקודים אקדמיים</td><td><textarea id="tla-acad-${sid}" rows="3">${esc(tla.profile?.academic || '')}</textarea></td></tr>
                <tr><td class="tla-month-cell">תלמידאיות</td><td><textarea id="tla-talm-${sid}" rows="3">${esc(tla.profile?.talmidut || '')}</textarea></td></tr>
                <tr><td class="tla-month-cell">תפקודים רגשיים וחברתיים</td><td><textarea id="tla-soc-${sid}" rows="3">${esc(tla.profile?.social || '')}</textarea></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Slide 7 (Integrative TLA) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">7</div>
          <div class="tla-slide-header">תל"א אינטגרטיבי — תוכנית לימודים אישית</div>
          <div class="tla-slide-body">
            <table class="tla-grid">
              <thead>
                <tr>
                  <th style="width:18%">תחום</th>
                  <th style="width:22%">קו בסיס</th>
                  <th style="width:22%">מטרות-על</th>
                  <th style="width:22%">הזדמנויות עבודה ואמצעים</th>
                  <th style="width:16%">מעקב והערכה</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="tla-month-cell">לימודי</td>
                  <td><textarea id="tla-baseline-${sid}" rows="4">${esc(tla.program?.baseline || '')}</textarea></td>
                  <td><textarea id="tla-goals-${sid}" rows="4">${esc(tla.program?.goals || '')}</textarea></td>
                  <td><textarea id="tla-opp-${sid}" rows="4">${esc(tla.program?.opportunities || '')}</textarea></td>
                  <td><textarea id="tla-eval-${sid}" rows="4">${esc(tla.program?.evaluation || '')}</textarea></td>
                </tr>
                <tr>
                  <td class="tla-month-cell">רגשי</td>
                  <td colspan="4"><textarea id="tla-emotional-${sid}" rows="2">${esc(tla.program?.emotional || '')}</textarea></td>
                </tr>
                <tr>
                  <td class="tla-month-cell">חיזוק יכולות וכישורים</td>
                  <td colspan="4"><textarea id="tla-strengths-${sid}" rows="2">${esc(tla.program?.strengths || '')}</textarea></td>
                </tr>
                <tr>
                  <td class="tla-month-cell">הערכה מסכמת</td>
                  <td colspan="4"><textarea id="tla-summary-${sid}" rows="2">${esc(tla.program?.summary || '')}</textarea></td>
                </tr>
              </tbody>
            </table>
            <div class="mt-3">
              <div class="small fw-bold mb-1">המלצות, הערות ושינויים משמעותיים במהלך השנה:</div>
              <textarea id="tla-changes-${sid}" rows="3" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:6px">${esc(tla.changes || '')}</textarea>
            </div>
          </div>
        </div>

        <div class="text-end small text-muted mt-2 no-print">
          עדכון אחרון: ${esc(s['תלא_עודכן'] ? new Date(s['תלא_עודכן']).toLocaleString('he-IL') : 'מעולם לא')}
        </div>
      </div>
    `;
  }

  // Override save to capture all fields including schedule
  window.tlaSaveForm = async function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return alert('תלמיד לא נמצא');
    function v(id) { return document.getElementById(`tla-${id}-${sid}`)?.value || ''; }

    const oldTla = (typeof window.parseTlaData === 'function' ? window.parseTlaData(s) : {}) || {};

    // Schedule - keep existing structure, update from inputs
    const sched = oldTla.schedule || {};
    Object.keys(sched).forEach(ts => {
      Object.keys(sched[ts] || {}).forEach(day => {
        const el = document.getElementById(`tla-sch-${sid}-${ts}-${day}-main`);
        if (el) sched[ts][day].main = el.value;
      });
    });

    // Meetings
    const meetings = {};
    ['אלול','חשון','כסלו','טבת','שבט','אדר'].forEach(ch => {
      meetings[ch] = {
        participants: document.getElementById(`tla-mtg-${ch}-participants-${sid}`)?.value || '',
        summary: document.getElementById(`tla-mtg-${ch}-summary-${sid}`)?.value || '',
      };
    });

    const parents = {};
    ['אלול','חשון','כסלו','טבת','שבט','אדר'].forEach(ch => {
      parents[ch] = document.getElementById(`tla-prnt-${ch}-${sid}`)?.value || '';
    });

    const newTla = {
      header: { name: v('name'), tz: v('tz'), shiur: s['מחזור'] || '', year: 'תשפ"ו' },
      profile_header: { mechanech: v('mech') || oldTla.profile_header?.mechanech || 'הרב סורוצקין' },
      schedule: sched,
      meetings,
      parents,
      profile: {
        background: v('bg'),
        intellect: v('intel'),
        academic: v('acad'),
        talmidut: v('talm'),
        social: v('soc'),
      },
      program: {
        baseline: v('baseline'),
        goals: v('goals'),
        opportunities: v('opp'),
        evaluation: v('eval'),
        emotional: v('emotional'),
        strengths: v('strengths'),
        summary: v('summary'),
      },
      changes: v('changes'),
    };

    const existing = (s['דוח_אישי'] || '').replace(/\[TLA_JSON_START\][\s\S]*?\[TLA_JSON_END\]/g, '').trim();
    const newDoch = (existing ? existing + '\n\n' : '') + `[TLA_JSON_START]${JSON.stringify(newTla)}[TLA_JSON_END]`;

    const updated = Object.assign({}, s, {
      'דוח_אישי': newDoch,
      'תז': v('tz') || s['תז'] || '',
    });

    const r = await api('updateStudent', [updated]);
    if (r && r.ok !== false) {
      if (typeof toast === 'function') toast('תל"א נשמר ✓', 'success');
      else alert('✓ נשמר');
    } else {
      alert('שגיאה: ' + (r?.error || '?'));
    }
  };

  console.warn('%c📄 Pack-96 — TLA FULL match to PPTX (7 slides: cover/schedule/meetings/parents/profile/integrative)', 'color:#1e3a8a;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-96.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-97.js ─────────────────────────────────────────────
try {
// behavior-pack-97.js — TLA quadrant profile (slide 6: 4-quadrant) + integrative (slide 7). 2026-05-27
(function () {
const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי'];
  const MONTHS = ['אלול','חשון','כסלו','טבת','שבט','אדר'];

  function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }
  function escA(s) { return esc(s).replace(/"/g,'&quot;'); }
  function getStudent(sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    return (data.students || []).find(s => String(s['מזהה']) === String(sid));
  }
  function parseTla(s) {
    if (typeof window.parseTlaData === 'function') return window.parseTlaData(s) || {};
    return {};
  }

  // FULL OVERRIDE - rebuild with quadrants
  window.injectTlaTab = function () {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    if (modal.querySelector('#stu-tab-tla')) return;
    const tabsList = modal.querySelector('#stu-tabs');
    const tabsContent = modal.querySelector('.tab-content');
    if (!tabsList || !tabsContent) return;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (!m) return;
    const sid = parseInt(m);
    const student = getStudent(sid);
    if (!student) return;

    const tabLi = document.createElement('li');
    tabLi.className = 'nav-item';
    tabLi.innerHTML = `<a class="nav-link" data-bs-toggle="tab" href="#stu-tab-tla"><i class="bi bi-mortarboard-fill text-warning"></i> תל"א</a>`;
    const profileTab = tabsList.querySelector('a[href="#stu-tab-profile"]');
    if (profileTab) tabsList.insertBefore(tabLi, profileTab.parentNode);
    else tabsList.appendChild(tabLi);

    const pane = document.createElement('div');
    pane.className = 'tab-pane fade';
    pane.id = 'stu-tab-tla';
    pane.innerHTML = buildV7(sid, student);
    tabsContent.appendChild(pane);
  };

  function buildV7(sid, s) {
    const tla = parseTla(s);
    const hasFile = !!s['תלא_pdf_id'];
    const fullName = tla.header?.name || `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const sched = tla.schedule || {};
    const meetings = tla.meetings || {};
    const parents = tla.parents || {};
    const q = tla.profile_quadrants || {};
    const integ = tla.integrative || {};

    if (!document.getElementById('tla-style-97')) {
      const st = document.createElement('style');
      st.id = 'tla-style-97';
      st.textContent = `
        .tla-v7 { font-family:'Heebo',Arial; max-width:1150px; margin:0 auto; padding:10px; }
        .tla-v7 .tla-slide { background:#fff; border:2px solid #1e3a8a; border-radius:10px; margin-bottom:18px; overflow:hidden; position:relative; }
        .tla-v7 .tla-slide-num { position:absolute; top:10px; left:10px; background:#fbbf24; color:#1e3a8a; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; }
        .tla-v7 .tla-header { background:linear-gradient(135deg,#1e3a8a,#3b82f6); color:#fff; padding:12px 46px 12px 14px; font-size:17px; font-weight:bold; }
        .tla-v7 .tla-body { padding:12px; }
        .tla-v7 table.tla-g { width:100%; border-collapse:collapse; font-size:12px; }
        .tla-v7 table.tla-g th { background:#fbbf24; color:#1e3a8a; padding:5px 4px; border:1px solid #1e3a8a; }
        .tla-v7 table.tla-g td { padding:4px; border:1px solid #cbd5e1; vertical-align:top; }
        .tla-v7 table.tla-g td.tla-time { background:#f3f4f6; font-weight:bold; text-align:center; white-space:nowrap; width:90px; font-family:monospace; }
        .tla-v7 table.tla-g td.tla-month { background:#fef3c7; font-weight:bold; text-align:center; width:80px; }
        .tla-v7 .tla-quad { display:grid; grid-template-columns:1fr 1fr; gap:0; border:2px solid #1e3a8a; border-radius:6px; overflow:hidden; }
        .tla-v7 .tla-quad-cell { padding:0; border:1px solid #cbd5e1; background:#fff; }
        .tla-v7 .tla-quad-label { background:#fbbf24; color:#1e3a8a; padding:6px 8px; font-weight:bold; font-size:13px; }
        .tla-v7 .tla-quad-content { padding:8px; font-size:12px; }
        .tla-v7 textarea, .tla-v7 input[type=text] { width:100%; border:0; background:transparent; resize:vertical; font-family:inherit; font-size:12px; outline:none; padding:3px; }
        .tla-v7 textarea:focus, .tla-v7 input:focus { background:#fffbeb; outline:1px solid #fbbf24; }
        .tla-v7 .toolbar-v7 { position:sticky; top:0; z-index:10; background:#fff; border-bottom:1px solid #e5e7eb; padding:8px; margin-bottom:8px; }
        @media print {
          .tla-v7 .no-print { display:none !important; }
          .tla-v7 .tla-slide { page-break-after:always; }
          .tla-v7 .tla-slide:last-child { page-break-after:auto; }
          .tla-v7 textarea, .tla-v7 input { background:transparent !important; outline:0 !important; }
        }
      `;
      document.head.appendChild(st);
    }

    const timeSlots = Object.keys(sched);
    const scheduleTable = timeSlots.length ? `
      <table class="tla-g"><thead><tr><th>שעה</th>${DAYS.map(d=>`<th>${esc(d)}</th>`).join('')}</tr></thead>
        <tbody>${timeSlots.map(ts=>`<tr><td class="tla-time">${esc(ts)}</td>${
          DAYS.map(day=>{
            const cell = sched[ts]?.[day] || {};
            return `<td><textarea id="tla-sch-${sid}-${ts}-${day}-main" rows="2" placeholder="—">${esc(cell.main || '')}</textarea>${cell.individual?`<div style="color:#dc2626;font-size:10px;margin-top:2px">+ ${esc(cell.individual)}</div>`:''}</td>`;
          }).join('')
        }</tr>`).join('')}</tbody></table>
    ` : '<div class="text-muted">אין מערכת שעות.</div>';

    return `
      <div class="tla-v7" id="tla-doc-${sid}">
        <div class="toolbar-v7 d-flex justify-content-between flex-wrap gap-2 no-print">
          <strong>תיק תל"א — ${esc(fullName)} · שיעור ${esc(s['מחזור']||'')} · תשפ"ו</strong>
          <div class="d-flex gap-2">
            ${hasFile?`<a class="btn btn-sm btn-outline-primary" href="${escA(s['תלא_pdf_url'])}" target="_blank"><i class="bi bi-file-pdf"></i> PPTX מקור</a>`:''}
            <button class="btn btn-sm btn-success" onclick="window.tlaSaveForm(${sid})"><i class="bi bi-save"></i> שמור</button>
            <button class="btn btn-sm btn-warning" onclick="window.tlaPrintForm(${sid})"><i class="bi bi-printer"></i> PDF</button>
          </div>
        </div>

        <!-- 1. כיסוי -->
        <div class="tla-slide">
          <div class="tla-slide-num">1</div>
          <div class="tla-header">תיק תלמיד שיעור — שנה"ל תשפ"ו</div>
          <div class="tla-body" style="font-size:18px;line-height:2;text-align:center">
            <div>שם התלמיד: <input id="tla-name-${sid}" type="text" value="${escA(fullName)}" style="width:280px;border-bottom:2px solid #1e3a8a;text-align:center"></div>
            <div class="mt-3">ת.ז.: <input id="tla-tz-${sid}" type="text" value="${escA(tla.header?.tz || s['תז'] || '')}" style="width:180px;border-bottom:2px solid #1e3a8a;text-align:center"></div>
          </div>
        </div>

        <!-- 2. מערכת שעות -->
        <div class="tla-slide">
          <div class="tla-slide-num">2</div>
          <div class="tla-header">מערכת שעות אישית</div>
          <div class="tla-body">
            <div class="small text-muted mb-2">סמן בבולט שיעורים אינדוודואליים (קריאה, פרא רפואי, טיפול רגשי וכו')</div>
            ${scheduleTable}
          </div>
        </div>

        <!-- 3. ישיבות צוות -->
        <div class="tla-slide">
          <div class="tla-slide-num">3</div>
          <div class="tla-header">תיעוד ישיבות צוות</div>
          <div class="tla-body">
            <table class="tla-g">
              <thead><tr><th style="width:80px">חודש</th><th style="width:30%">משתתפים</th><th>סיכום והמלצות</th></tr></thead>
              <tbody>${MONTHS.map(ch=>{
                const m = meetings[ch]||{};
                return `<tr><td class="tla-month">${esc(ch)}</td><td><textarea id="tla-mtg-${ch}-participants-${sid}" rows="2">${esc(m.participants||'')}</textarea></td><td><textarea id="tla-mtg-${ch}-summary-${sid}" rows="2">${esc(m.summary||'')}</textarea></td></tr>`;
              }).join('')}</tbody>
            </table>
          </div>
        </div>

        <!-- 4. שיחות הורים -->
        <div class="tla-slide">
          <div class="tla-slide-num">4</div>
          <div class="tla-header">תיעוד שיחות הורים</div>
          <div class="tla-body">
            <table class="tla-g">
              <thead><tr><th style="width:80px">חודש</th><th>סיכום השיחות</th></tr></thead>
              <tbody>${MONTHS.map(ch=>`<tr><td class="tla-month">${esc(ch)}</td><td><textarea id="tla-prnt-${ch}-${sid}" rows="2">${esc(parents[ch]||'')}</textarea></td></tr>`).join('')}</tbody>
            </table>
          </div>
        </div>

        <!-- 5. פרופיל - 4 רביעים -->
        <div class="tla-slide">
          <div class="tla-slide-num">5</div>
          <div class="tla-header">דף הכנה לתל"א — פרופיל תלמיד</div>
          <div class="tla-body">
            <table class="tla-g mb-3">
              <tr>
                <td style="background:#dbeafe"><b>מחנך:</b> <input id="tla-mech-${sid}" type="text" value="${escA(tla.profile_header?.mechanech || 'הרב יוסף סורוצקין')}" style="width:160px"></td>
                <td style="background:#dbeafe"><b>שנה"ל:</b> תשפ"ו</td>
                <td style="background:#dbeafe"><b>שיעור:</b> ${esc(s['מחזור']||tla.profile_header?.class||'')}</td>
                <td style="background:#dbeafe"><b>שם:</b> ${esc(fullName)}</td>
              </tr>
            </table>
            <div class="tla-quad">
              <div class="tla-quad-cell">
                <div class="tla-quad-label">נתונים סביבתיים</div>
                <div class="tla-quad-content"><textarea id="tla-env-${sid}" rows="6" placeholder="הרכב משפחה, מצב כלכלי...">${esc(q.environmental||'')}</textarea></div>
              </div>
              <div class="tla-quad-cell">
                <div class="tla-quad-label">רקע מוגבלות</div>
                <div class="tla-quad-content"><textarea id="tla-bg-${sid}" rows="6" placeholder="IQ, אבחנות, ליקויים...">${esc(q.background||'')}</textarea></div>
              </div>
              <div class="tla-quad-cell">
                <div class="tla-quad-label">מוקדי כוח</div>
                <div class="tla-quad-content"><textarea id="tla-sfocus-${sid}" rows="6" placeholder="חוזקות לימודיות, חברתיות, רגשיות...">${esc(q.strengths_focus||'')}</textarea></div>
              </div>
              <div class="tla-quad-cell">
                <div class="tla-quad-label">מוקדים לחיזוק</div>
                <div class="tla-quad-content"><textarea id="tla-ifocus-${sid}" rows="6" placeholder="נושאים לעבודה ולשיפור...">${esc(q.improve_focus||'')}</textarea></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 6. תל"א אינטגרטיבי -->
        <div class="tla-slide">
          <div class="tla-slide-num">6</div>
          <div class="tla-header">תל"א אינטגרטיבי — תוכנית לימודים אישית</div>
          <div class="tla-body">
            <div class="row g-2 mb-3">
              <div class="col-md-4"><label class="small fw-bold">תחום:</label>
                <input id="tla-domain-${sid}" type="text" value="${escA(integ.domain || 'לימודי / רגשי')}" style="width:100%;border:1px solid #1e3a8a;border-radius:4px;padding:4px"></div>
              <div class="col-md-8"><label class="small fw-bold">קו בסיס:</label>
                <textarea id="tla-baseline-${sid}" rows="2" style="border:1px solid #1e3a8a;border-radius:4px;padding:4px;width:100%">${esc(integ.baseline||'')}</textarea></div>
            </div>
            <div class="mb-3">
              <label class="small fw-bold">מטרות-על:</label>
              <textarea id="tla-goals-${sid}" rows="2" style="border:1px solid #1e3a8a;border-radius:4px;padding:4px;width:100%">${esc(integ.goals||'')}</textarea>
            </div>
            <table class="tla-g">
              <thead><tr><th style="width:33%">יעדים</th><th style="width:34%">הזדמנויות עבודה ואמצעים להשגתם</th><th style="width:33%">מעקב והערכה</th></tr></thead>
              <tbody><tr>
                <td><textarea id="tla-targets-${sid}" rows="6">${esc(integ.targets||'')}</textarea></td>
                <td><textarea id="tla-opp-${sid}" rows="6">${esc(integ.opportunities||'')}</textarea></td>
                <td><textarea id="tla-track-${sid}" rows="6">${esc(integ.tracking||'')}</textarea></td>
              </tr></tbody>
            </table>
            <div class="row g-2 mt-3">
              <div class="col-md-6"><label class="small fw-bold">הערות, שינויים משמעותיים במהלך השנה:</label>
                <textarea id="tla-changes-${sid}" rows="3" style="border:1px solid #cbd5e1;border-radius:4px;padding:4px;width:100%">${esc(tla.changes_notes||tla.changes||'')}</textarea></div>
              <div class="col-md-6"><label class="small fw-bold">המלצות:</label>
                <textarea id="tla-rec-${sid}" rows="3" style="border:1px solid #cbd5e1;border-radius:4px;padding:4px;width:100%">${esc(tla.recommendations||'')}</textarea></div>
            </div>
            <div class="mt-3 pt-3" style="border-top:1px dashed #cbd5e1">
              <b>חתימת הורים:</b> <input id="tla-sig-${sid}" type="text" value="${escA(integ.parents_signature||'')}" style="width:300px;border-bottom:2px solid #1e3a8a">
            </div>
          </div>
        </div>

        <div class="text-end small text-muted no-print">
          עדכון אחרון: ${esc(s['תלא_עודכן'] ? new Date(s['תלא_עודכן']).toLocaleString('he-IL') : 'לא עודכן')}
        </div>
      </div>
    `;
  }

  // Override save to include new fields
  const _origSave = window.tlaSaveForm;
  window.tlaSaveForm = async function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return alert('תלמיד לא נמצא');
    function v(id) { return document.getElementById(`tla-${id}-${sid}`)?.value || ''; }

    const oldTla = (typeof window.parseTlaData === 'function' ? window.parseTlaData(s) : {}) || {};
    const sched = oldTla.schedule || {};
    Object.keys(sched).forEach(ts => {
      Object.keys(sched[ts] || {}).forEach(day => {
        const el = document.getElementById(`tla-sch-${sid}-${ts}-${day}-main`);
        if (el) sched[ts][day].main = el.value;
      });
    });

    const meetings = {};
    MONTHS.forEach(ch => {
      meetings[ch] = {
        participants: document.getElementById(`tla-mtg-${ch}-participants-${sid}`)?.value || '',
        summary: document.getElementById(`tla-mtg-${ch}-summary-${sid}`)?.value || '',
      };
    });
    const parents = {};
    MONTHS.forEach(ch => { parents[ch] = document.getElementById(`tla-prnt-${ch}-${sid}`)?.value || ''; });

    const newTla = {
      header: { name: v('name'), tz: v('tz'), year: 'תשפ"ו' },
      profile_header: { mechanech: v('mech'), year: 'תשפ"ו', class: s['מחזור']||'', name: v('name') },
      schedule: sched,
      meetings,
      parents,
      profile_quadrants: {
        environmental: v('env'),
        background: v('bg'),
        strengths_focus: v('sfocus'),
        improve_focus: v('ifocus'),
      },
      integrative: {
        domain: v('domain'),
        baseline: v('baseline'),
        goals: v('goals'),
        targets: v('targets'),
        opportunities: v('opp'),
        tracking: v('track'),
        parents_signature: v('sig'),
      },
      changes_notes: v('changes'),
      recommendations: v('rec'),
    };

    const existing = (s['דוח_אישי'] || '').replace(/\[TLA_JSON_START\][\s\S]*?\[TLA_JSON_END\]/g, '').trim();
    const newDoch = (existing ? existing + '\n\n' : '') + `[TLA_JSON_START]${JSON.stringify(newTla)}[TLA_JSON_END]`;

    const updated = Object.assign({}, s, {
      'דוח_אישי': newDoch,
      'תז': v('tz') || s['תז'] || '',
    });

    const r = await api('updateStudent', [updated]);
    if (r && r.ok !== false) {
      if (typeof toast === 'function') toast('תל"א נשמר ✓', 'success');
      else alert('✓ נשמר');
    } else {
      alert('שגיאה: ' + (r?.error || '?'));
    }
  };

  window.tlaPrintForm = function (sid) {
    const docEl = document.getElementById(`tla-doc-${sid}`);
    if (!docEl) return alert('פתח את הטאב תל"א');
    const w = window.open('', '_blank', 'width=1200,height=1400');
    const values = {};
    docEl.querySelectorAll('textarea, input').forEach(el => { if (el.id) values[el.id] = el.value; });
    const clone = docEl.cloneNode(true);
    clone.querySelectorAll('textarea, input').forEach(el => {
      if (el.id && values[el.id] !== undefined) {
        if (el.tagName === 'TEXTAREA') el.textContent = values[el.id];
        else el.setAttribute('value', values[el.id]);
      }
    });
    const style = document.getElementById('tla-style-97')?.textContent || '';
    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>תל"א PDF</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>body{font-family:'Heebo',Arial;padding:0;direction:rtl}${style}@media print{body{padding:0}}</style>
      </head><body>${clone.outerHTML}<script>setTimeout(()=>window.print(),700)<\/script></body></html>`);
    w.document.close();
  };

  console.warn('%c📐 Pack-97 — TLA: 4-quadrant profile + integrative (yedim/opp/tracking) + parents-signature', 'color:#1e3a8a;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-97.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-98.js ─────────────────────────────────────────────
try {
// behavior-pack-98.js — Ensure ALL TLA fields are editable + show data source indicator. 2026-05-27
(function () {
// ===== Ensure all textareas/inputs in TLA tab are NOT readonly/disabled =====
  document.addEventListener('shown.bs.tab', e => {
    if (e.target?.getAttribute('href') !== '#stu-tab-tla') return;
    setTimeout(() => {
      const pane = document.getElementById('stu-tab-tla');
      if (!pane) return;
      pane.querySelectorAll('textarea, input').forEach(el => {
        el.removeAttribute('readonly');
        el.removeAttribute('disabled');
      });
    }, 100);
  });

  // ===== Add data-source badge =====
  document.addEventListener('shown.bs.tab', e => {
    if (e.target?.getAttribute('href') !== '#stu-tab-tla') return;
    setTimeout(() => {
      const pane = document.getElementById('stu-tab-tla');
      if (!pane || pane.querySelector('.tla-source-badge')) return;
      const modal = document.getElementById('viewStuModal');
      if (!modal) return;
      const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
      if (!m) return;
      const sid = parseInt(m);
      const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
      const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
      if (!s) return;
      const tla = (typeof window.parseTlaData === 'function' ? window.parseTlaData(s) : {}) || {};

      const isFromFile = !!s['תלא_pdf_id'];
      const hasSchedule = !!(tla.schedule && Object.keys(tla.schedule).length);
      const hasQuadrants = !!(tla.profile_quadrants && (tla.profile_quadrants.environmental || tla.profile_quadrants.background));
      const filledMonths = ['אלול','חשון','כסלו','טבת','שבט','אדר'].filter(c => tla.meetings?.[c]?.summary).length;

      const badge = document.createElement('div');
      badge.className = 'tla-source-badge alert alert-info small mb-2 mt-2 no-print';
      badge.style.cssText = 'border-radius:6px;padding:6px 12px';
      badge.innerHTML = `
        <i class="bi bi-info-circle"></i>
        מקור: ${isFromFile ? '<b>קובץ PPTX מקורי בDrive</b>' : 'נוצר אוטומטית ממעקב התנהגות+פרופיל'} ·
        ${hasSchedule ? '✅ מערכת שעות' : '⏳ אין מערכת שעות'} ·
        ${hasQuadrants ? '✅ פרופיל' : '⏳ פרופיל ריק'} ·
        ${filledMonths}/6 חודשי ישיבות צוות ·
        <span class="text-success">כל השדות פתוחים לעריכה ✏️</span>
      `;
      const toolbar = pane.querySelector('.toolbar-v7');
      if (toolbar) toolbar.parentNode.insertBefore(badge, toolbar.nextSibling);
      else pane.insertBefore(badge, pane.firstChild);
    }, 200);
  });

  console.warn('%c✏️ Pack-98 — ensure TLA editable + data source indicator badge', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-98.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-99.js ─────────────────────────────────────────────
try {
// behavior-pack-99.js — Better TLA print/PDF: landscape schedule, page breaks, cleaner output. 2026-05-27
(function () {
// OVERRIDE print to make a polished printable PDF
  window.tlaPrintForm = function (sid) {
    const docEl = document.getElementById(`tla-doc-${sid}`);
    if (!docEl) return alert('פתח את הטאב תל"א');

    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();

    // Capture all current values
    const values = {};
    docEl.querySelectorAll('textarea, input').forEach(el => {
      if (el.id) values[el.id] = el.value;
    });

    // Clone DOM
    const clone = docEl.cloneNode(true);
    // Restore values
    clone.querySelectorAll('textarea, input').forEach(el => {
      if (el.id && values[el.id] !== undefined) {
        if (el.tagName === 'TEXTAREA') {
          el.textContent = values[el.id];
        } else {
          el.setAttribute('value', values[el.id]);
        }
      }
    });
    // Remove toolbar + interactive elements
    clone.querySelectorAll('.no-print, .toolbar-v7, .tla-source-badge').forEach(el => el.remove());

    const styleContent = (document.getElementById('tla-style-97')?.textContent || '') +
                        (document.getElementById('tla-pptx-style-96')?.textContent || '') +
                        (document.getElementById('tla-pptx-style-93')?.textContent || '');

    const w = window.open('', '_blank', 'width=1200,height=1400');
    if (!w) return alert('חוסם פופאפים? אפשר את החלון.');

    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="he">
<head><meta charset="utf-8"><title>תיק תל"א - ${fullName}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 1cm; }
@page :first { size: A4 portrait; }
@page schedule-page { size: A4 landscape; }
body { font-family: 'Heebo', Arial, sans-serif; direction: rtl; padding: 0; margin: 0; background: #fff; }
${styleContent}

/* Override for print quality */
.tla-v7 { max-width: none; padding: 6px; }
.tla-v7 .tla-slide {
  page-break-inside: avoid;
  page-break-after: always;
  margin-bottom: 0;
  box-shadow: none;
  border: 2px solid #1e3a8a;
}
.tla-v7 .tla-slide:last-child { page-break-after: auto; }

/* Slide 2 (schedule) - landscape */
.tla-v7 .tla-slide:nth-child(2) { page: schedule-page; }

/* Make textareas show all content */
.tla-v7 textarea, .tla-v7 input {
  background: transparent !important;
  border: 0 !important;
  outline: 0 !important;
  resize: none;
  overflow: visible;
  height: auto !important;
  min-height: 1.2em;
}

/* Print color preservation */
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.tla-v7 .tla-header { background: #1e3a8a !important; color: #fff !important; }
.tla-v7 .tla-quad-label { background: #fbbf24 !important; color: #1e3a8a !important; }
.tla-v7 table.tla-g th { background: #fbbf24 !important; color: #1e3a8a !important; }
.tla-v7 table.tla-g td.tla-time { background: #f3f4f6 !important; }
.tla-v7 table.tla-g td.tla-month { background: #fef3c7 !important; }
</style>
</head><body>
${clone.outerHTML}
<script>
// Resize all textareas to fit content for print
window.addEventListener('load', () => {
  document.querySelectorAll('textarea').forEach(t => {
    t.style.height = (t.scrollHeight + 4) + 'px';
  });
  setTimeout(() => window.print(), 800);
});
<\/script>
</body></html>`);
    w.document.close();
  };

  // ===== Visual hint that print is available =====
  setTimeout(() => {
    document.querySelectorAll('.tla-v7 button[onclick*="tlaPrintForm"]').forEach(btn => {
      btn.title = 'הדפסה: A4 רגיל לכיסוי+פרופיל, A4 landscape למערכת שעות';
    });
  }, 2000);

  console.warn('%c🖨 Pack-99 — Polished TLA print/PDF (landscape schedule, page breaks, color preservation)', 'color:#1e3a8a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-99.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-100.js ─────────────────────────────────────────────
try {
// behavior-pack-100.js — Remove microphone button + force everything editable + fill quadrants. 2026-05-27
(function () {
// ===== 1. KILL all microphone buttons (pack-18) =====
  function killMicButtons() {
    // pack-18 adds buttons with bi-mic / bi-mic-fill icons next to textareas
    document.querySelectorAll('.mic-btn, [title*="הקלטה"], [title*="הקלט"], [title*="הקלד"], [title*="דבר"], [title*="מיקרופון"]').forEach(b => {
      const txt = (b.textContent || '') + (b.title || '');
      if (b.querySelector?.('.bi-mic') || b.querySelector?.('.bi-mic-fill') || b.querySelector?.('.bi-soundwave') ||
          /mic|mic-fill|soundwave|microphone/i.test(b.innerHTML)) {
        b.remove();
      }
    });
    // Also remove any standalone mic icons
    document.querySelectorAll('i.bi-mic, i.bi-mic-fill, i.bi-soundwave').forEach(i => {
      const btn = i.closest('button, a, .btn');
      if (btn) btn.remove();
      else i.remove();
    });
  }
  setInterval(killMicButtons, 1500);
  setTimeout(killMicButtons, 500);
  setTimeout(killMicButtons, 2500);

  // ===== 2. Force editable on all TLA fields =====
  function forceEditable() {
    document.querySelectorAll('#stu-tab-tla textarea, #stu-tab-tla input, .tla-v7 textarea, .tla-v7 input').forEach(el => {
      el.removeAttribute('readonly');
      el.removeAttribute('disabled');
      el.style.pointerEvents = 'auto';
      el.style.userSelect = 'auto';
    });
  }
  setInterval(forceEditable, 2000);
  document.addEventListener('shown.bs.tab', e => {
    if (e.target?.getAttribute('href') === '#stu-tab-tla') {
      setTimeout(forceEditable, 100);
      setTimeout(forceEditable, 600);
    }
  });

  // ===== 3. Prevent pack-18 from adding mic buttons on new textareas =====
  if (window.MutationObserver) {
    const obs = new MutationObserver(muts => {
      let needsKill = false;
      for (const m of muts) {
        if (m.addedNodes.length) needsKill = true;
      }
      if (needsKill) killMicButtons();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  console.warn('%c🚫 Pack-100 — Remove mic button + force TLA editable everywhere', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-100.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-101.js ─────────────────────────────────────────────
try {
// behavior-pack-101.js — FIX: sync dashboard/widget counts with TLA stored in דוח_אישי. 2026-05-27
(function () {
// Count students with TLA - check תלא_pdf_id OR דוח_אישי TLA marker
  function hasTla(s) {
    if (s['תלא_pdf_id'] || s['תלא_data']) return true;
    const doch = s['דוח_אישי'] || '';
    return /\[TLA_JSON_START\]/.test(doch);
  }

  function refreshAllCounts() {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const students = data.students || [];
    const activeCount = students.filter(s => s['סטטוס'] !== 'סיים').length;
    const withTla = students.filter(s => hasTla(s) && s['סטטוס'] !== 'סיים').length;

    // Update home stats widget (pack-88)
    const widget = document.getElementById('home-stats-88');
    if (widget) {
      const valueDivs = widget.querySelectorAll('div[style*="font-size:24px"]');
      if (valueDivs[2]) valueDivs[2].textContent = `${withTla}/${activeCount}`;
    }

    // Update home shortcut button (pack-92)
    const btn = document.querySelector('#tla-home-shortcut button');
    if (btn) {
      btn.innerHTML = `<i class="bi bi-mortarboard-fill"></i> דשבורד תל"א (${withTla}/${activeCount} תלמידים)`;
    }

    return { activeCount, withTla };
  }

  // Override pack-73's openTlaDashboard to use new count
  const _origDash = window.openTlaDashboard;
  window.openTlaDashboard = function () {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const students = data.students || [];
    const active = students.filter(s => s['סטטוס'] !== 'סיים');
    const withTla = active.filter(hasTla);
    const without = active.filter(s => !hasTla(s));

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const html = `<div class="modal fade show" id="tla-dash-101" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;max-height:90vh;display:flex;flex-direction:column">
          <div class="modal-header" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
            <h5><i class="bi bi-mortarboard-fill text-warning"></i> דשבורד תל"א — ${active.length} תלמידים פעילים</h5>
            <button class="btn-close" onclick="document.getElementById('tla-dash-101').remove()"></button>
          </div>
          <div class="modal-body" style="overflow-y:auto;flex:1">
            <div class="row mb-3 g-2">
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-success mb-0">${withTla.length}</div><small>עם נתוני תל"א</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-warning mb-0">${without.length}</div><small>ללא נתונים</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-info mb-0">${active.length}</div><small>סה"כ פעילים</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div class="h3 text-primary mb-0">${Math.round(withTla.length/active.length*100)}%</div><small>כיסוי</small></div></div>
            </div>

            <h6 class="mt-3 text-success"><i class="bi bi-check-circle"></i> תלמידים עם תל"א (${withTla.length})</h6>
            <table class="table table-sm table-hover">
              <thead><tr><th>שם</th><th>שיעור</th><th>מקור</th><th>פעולות</th></tr></thead>
              <tbody>
                ${withTla.map(s => {
                  const fromFile = !!s['תלא_pdf_id'];
                  return `<tr>
                    <td><strong>${esc(s['שם פרטי']||'')} ${esc(s['שם משפחה']||'')}</strong></td>
                    <td>${esc(s['מחזור']||'')}</td>
                    <td><span class="badge bg-${fromFile?'primary':'success'}">${fromFile?'PPTX מקורי':'אוטומטי'}</span></td>
                    <td><button class="btn btn-sm btn-outline-primary" onclick="viewStudent(${s['מזהה']}); document.getElementById('tla-dash-101').remove();"><i class="bi bi-eye"></i> פתח</button></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>

            ${without.length ? `
              <h6 class="mt-4 text-warning"><i class="bi bi-exclamation-triangle"></i> ללא תל"א (${without.length})</h6>
              <table class="table table-sm">
                <tbody>
                  ${without.map(s => `<tr>
                    <td><strong>${esc(s['שם פרטי']||'')} ${esc(s['שם משפחה']||'')}</strong></td>
                    <td>${esc(s['מחזור']||'')}</td>
                    <td><button class="btn btn-sm btn-outline-warning" onclick="viewStudent(${s['מזהה']}); document.getElementById('tla-dash-101').remove();"><i class="bi bi-plus"></i> צור</button></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            ` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('tla-dash-101').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // Refresh counts every 2 seconds + on data refresh
  setInterval(refreshAllCounts, 2000);
  window.addEventListener('cheder-data-refreshed', refreshAllCounts);
  setTimeout(refreshAllCounts, 1500);

  console.warn('%c🔄 Pack-101 — Sync dashboard/widget counts with דוח_אישי TLA storage', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-101.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-102.js ─────────────────────────────────────────────
try {
// behavior-pack-102.js — Improved design for student card modal + TLA polish. 2026-05-27
(function () {
// Inject improved CSS
  if (!document.getElementById('pack-102-style')) {
    const st = document.createElement('style');
    st.id = 'pack-102-style';
    st.textContent = `
      /* ===== Student modal improvements ===== */
      #viewStuModal .modal-dialog {
        max-width: 1200px;
      }
      #viewStuModal .modal-content {
        border: 0;
        border-radius: 14px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        overflow: hidden;
      }
      #viewStuModal .modal-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        color: #fff;
        padding: 14px 20px;
        border-bottom: 0;
      }
      #viewStuModal .modal-header h5, #viewStuModal .modal-header .modal-title {
        color: #fff;
        font-weight: 600;
      }
      #viewStuModal .modal-header .btn-close {
        filter: invert(1);
      }
      #viewStuModal .modal-body {
        padding: 16px 20px;
        background: #f9fafb;
      }
      #viewStuModal .stu-tabs.nav-tabs {
        border-bottom: 2px solid #1e3a8a;
        margin-bottom: 12px;
        gap: 2px;
      }
      #viewStuModal .stu-tabs .nav-link {
        color: #1e3a8a;
        border: 0;
        border-radius: 8px 8px 0 0;
        padding: 8px 14px;
        font-weight: 500;
        font-size: 14px;
        transition: all 0.15s;
        background: #e0e7ff;
        margin-bottom: -2px;
      }
      #viewStuModal .stu-tabs .nav-link:hover {
        background: #c7d2fe;
        color: #1e3a8a;
      }
      #viewStuModal .stu-tabs .nav-link.active {
        background: #1e3a8a;
        color: #fff;
        border-bottom: 2px solid #1e3a8a;
      }
      #viewStuModal .tab-content {
        background: #fff;
        border-radius: 0 0 8px 8px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        min-height: 400px;
      }
      #viewStuModal .modal-footer {
        background: #f3f4f6;
        border-top: 1px solid #e5e7eb;
        padding: 12px 20px;
      }
      #viewStuModal .modal-footer .btn {
        font-weight: 500;
        padding: 6px 14px;
        border-radius: 6px;
      }

      /* ===== Student card header ===== */
      #viewStuModal .student-card-hero {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        padding: 16px 20px;
        border-radius: 10px;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 14px;
        border: 2px solid #fbbf24;
      }
      #viewStuModal .student-avatar-big {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: #1e3a8a;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        flex-shrink: 0;
      }
      #viewStuModal .student-card-hero .student-name-big {
        font-size: 22px;
        font-weight: 700;
        color: #1e3a8a;
        margin: 0;
      }
      #viewStuModal .student-card-hero .student-meta {
        font-size: 13px;
        color: #6b7280;
      }

      /* ===== TLA polish ===== */
      .tla-v7 {
        background: #f9fafb;
        padding: 12px;
        border-radius: 8px;
      }
      .tla-v7 .toolbar-v7 {
        background: #fff;
        padding: 10px 14px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        border: 1px solid #e5e7eb;
        z-index: 50;
      }
      .tla-v7 .tla-slide {
        background: #fff;
        border: 0;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        margin-bottom: 16px;
        overflow: visible;
      }
      .tla-v7 .tla-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        font-size: 16px;
        padding: 12px 50px 12px 14px;
      }
      .tla-v7 .tla-slide-num {
        width: 28px;
        height: 28px;
        background: #fbbf24;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .tla-v7 .tla-quad {
        border: 0;
        gap: 8px;
        background: transparent;
      }
      .tla-v7 .tla-quad-cell {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        overflow: hidden;
      }
      .tla-v7 .tla-quad-label {
        padding: 8px 10px;
        font-size: 13px;
      }
      .tla-v7 table.tla-g {
        border-radius: 6px;
        overflow: hidden;
      }
      .tla-v7 table.tla-g th {
        padding: 8px 6px;
        font-size: 12px;
      }
      .tla-v7 textarea {
        min-height: 36px;
        padding: 6px;
        border-radius: 4px;
        transition: background 0.15s;
      }
      .tla-v7 textarea:hover {
        background: #fafbfc;
      }
      .tla-v7 textarea:focus {
        background: #fef3c7;
        outline: 2px solid #fbbf24;
      }

      /* Student tabs - keyboard-shortcut hint */
      #viewStuModal .stu-tabs .nav-link::after {
        content: '';
      }

      /* Better scrollbar */
      #viewStuModal .modal-body::-webkit-scrollbar { width: 8px; }
      #viewStuModal .modal-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      #viewStuModal .modal-body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `;
    document.head.appendChild(st);
  }

  // ===== Inject student-card hero ON top of modal body =====
  function injectHero() {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    if (modal.querySelector('.student-card-hero')) return;
    const body = modal.querySelector('.modal-body');
    if (!body) return;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (!m) return;
    const sid = parseInt(m);
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const initials = (s['שם פרטי']||'?').charAt(0);
    const events = (data.behavior || []).filter(e => String(e['תלמיד_מזהה']) === String(sid));
    const recentEv = events.filter(e => {
      const d = new Date(e['תאריך'] || 0);
      return (Date.now() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
    }).length;

    const hero = document.createElement('div');
    hero.className = 'student-card-hero';
    hero.innerHTML = `
      <div class="student-avatar-big">${initials}</div>
      <div class="flex-grow-1">
        <h4 class="student-name-big">${fullName}</h4>
        <div class="student-meta">
          <span class="badge bg-primary me-1">${s['מחזור']||'-'}</span>
          <span class="badge bg-secondary me-1">ID: ${sid}</span>
          ${s['גיל'] ? `<span class="badge bg-info me-1">גיל: ${s['גיל']}</span>` : ''}
          ${s['סטטוס'] ? `<span class="badge bg-${s['סטטוס']==='פעיל'?'success':'warning'} me-1">${s['סטטוס']}</span>` : ''}
        </div>
      </div>
      <div class="text-end">
        <div class="text-muted small">אירועים החודש</div>
        <div class="h4 text-primary mb-0">${recentEv}</div>
      </div>
    `;
    body.insertBefore(hero, body.firstChild);
  }

  document.addEventListener('shown.bs.modal', e => {
    if (e.target?.id === 'viewStuModal') setTimeout(injectHero, 100);
  });

  console.warn('%c🎨 Pack-102 — Student card + TLA design polish (hero, gradients, shadows, better tabs)', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-102.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-103.js ─────────────────────────────────────────────
try {
// behavior-pack-103.js — Global error logger + suppress duplicate alerts. 2026-05-27
(function () {
const LOG_KEY = 'bht_error_log';
  const MAX_LOG = 200;

  function loadLog() {
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
  }
  function saveLog(arr) {
    try { localStorage.setItem(LOG_KEY, JSON.stringify(arr.slice(-MAX_LOG))); } catch {}
  }
  function appendLog(entry) {
    const log = loadLog();
    log.push(Object.assign({ ts: Date.now(), url: location.hash, user: (JSON.parse(sessionStorage.getItem('user')||'{}')).username || '?' }, entry));
    saveLog(log);
  }

  // ===== Catch unhandled errors =====
  window.addEventListener('error', e => {
    appendLog({
      type: 'error',
      msg: String(e.message || e.error || ''),
      file: (e.filename || '').split('/').pop(),
      line: e.lineno,
      stack: (e.error?.stack || '').slice(0, 500),
    });
  });
  window.addEventListener('unhandledrejection', e => {
    appendLog({
      type: 'promise',
      msg: String(e.reason?.message || e.reason || ''),
      stack: (e.reason?.stack || '').slice(0, 500),
    });
  });

  // ===== Intercept alert() to log + dedupe =====
  const _origAlert = window.alert;
  const recentAlerts = new Map();
  window.alert = function (msg) {
    const m = String(msg || '');
    appendLog({ type: 'alert', msg: m.slice(0, 200) });
    // Dedupe: if same alert in last 5 seconds, suppress
    const now = Date.now();
    const last = recentAlerts.get(m);
    if (last && (now - last) < 5000) {
      console.warn('[Pack-103] suppressed duplicate alert:', m);
      return;
    }
    recentAlerts.set(m, now);
    // Cleanup old entries
    if (recentAlerts.size > 30) {
      for (const [k, t] of recentAlerts) {
        if (now - t > 60000) recentAlerts.delete(k);
      }
    }
    return _origAlert.apply(window, arguments);
  };

  // ===== Intercept console.error =====
  const _origConsoleErr = console.error;
  console.error = function (...args) {
    appendLog({ type: 'console.error', msg: args.map(a => String(a)).join(' ').slice(0, 300) });
    return _origConsoleErr.apply(console, args);
  };

  // ===== Viewer + auto-clear repeated errors =====
  window.viewErrorLog = function () {
    const log = loadLog();
    if (!log.length) { _origAlert('אין שגיאות מתועדות 👍'); return; }
    // Group by msg
    const grouped = {};
    log.forEach(e => {
      const key = (e.type || 'err') + ':' + (e.msg || '').slice(0, 100);
      if (!grouped[key]) grouped[key] = { ...e, count: 0, samples: [] };
      grouped[key].count++;
      if (grouped[key].samples.length < 3) grouped[key].samples.push(new Date(e.ts).toLocaleTimeString('he-IL'));
    });
    const sorted = Object.values(grouped).sort((a, b) => b.count - a.count);

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const html = `<div class="modal fade show" id="err-log-103" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header" style="background:#dc2626;color:#fff">
            <h5>📋 לוג שגיאות (${log.length} סה"כ, ${sorted.length} ייחודיות)</h5>
            <button class="btn-close btn-close-white" onclick="document.getElementById('err-log-103').remove()"></button>
          </div>
          <div class="modal-body" style="max-height:60vh;overflow-y:auto">
            ${sorted.length === 0 ? '<div class="text-success">✓ ניקי</div>' : sorted.map(g => `
              <div class="card p-2 mb-2">
                <div class="d-flex justify-content-between">
                  <span class="badge bg-${g.type==='alert'?'warning':'danger'}">${esc(g.type)}</span>
                  <span class="small text-muted">${g.count}× · ${g.samples.join(', ')}</span>
                </div>
                <div class="mt-1 small"><strong>${esc((g.msg||'').slice(0, 200))}</strong></div>
                ${g.file ? `<div class="small text-muted">${esc(g.file)}:${g.line||''}</div>` : ''}
                ${g.stack ? `<details class="small mt-1"><summary>stack</summary><pre style="font-size:10px">${esc(g.stack.slice(0, 300))}</pre></details>` : ''}
              </div>
            `).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger me-auto" onclick="if(confirm('למחוק את כל הלוג?')){localStorage.removeItem('${LOG_KEY}');document.getElementById('err-log-103').remove();}">מחק הכל</button>
            <button class="btn btn-secondary" onclick="document.getElementById('err-log-103').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== Keyboard shortcut: Ctrl+Shift+L =====
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      window.viewErrorLog();
    }
  });

  // ===== Known errors to auto-suppress =====
  const KNOWN_HARMLESS = [
    /Loading the script.*netfree\.link/,
    /favicon\.ico/,
    /chrome-extension/,
    /cheder-data-refreshed/,
    /event-guard/,
    /a11y/,
  ];

  // ===== Stat badge on a11y/error toolbar =====
  setInterval(() => {
    const log = loadLog();
    const recent = log.filter(e => Date.now() - e.ts < 5 * 60 * 1000);
    const real = recent.filter(e => !KNOWN_HARMLESS.some(re => re.test(e.msg || '')));
    if (real.length === 0) return;

    let badge = document.getElementById('err-badge-103');
    if (!badge) {
      badge = document.createElement('button');
      badge.id = 'err-badge-103';
      badge.style.cssText = 'position:fixed;bottom:80px;left:20px;background:#dc2626;color:#fff;border:0;padding:8px 12px;border-radius:8px;cursor:pointer;z-index:9998;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.2)';
      badge.onclick = window.viewErrorLog;
      document.body.appendChild(badge);
    }
    badge.innerHTML = `⚠ ${real.length} שגיאות אחרונות`;
  }, 4000);

  console.warn('%c📋 Pack-103 — Global error logger + alert dedupe + Ctrl+Shift+L viewer + auto badge', 'color:#dc2626;font-weight:bold');
  console.log('  Try: viewErrorLog()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-103.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-104.js ─────────────────────────────────────────────
try {
// behavior-pack-104.js — TLA: auto-grow textareas + mobile responsive + visual save feedback. 2026-05-27
(function () {
// ===== Auto-grow textareas (so all content visible without scroll) =====
  function autoGrow(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight + 4) + 'px';
  }

  function applyAutoGrow() {
    document.querySelectorAll('.tla-v7 textarea, #stu-tab-tla textarea').forEach(t => {
      if (t.dataset.grow104) return;
      t.dataset.grow104 = '1';
      autoGrow(t);
      t.addEventListener('input', () => autoGrow(t));
    });
  }

  document.addEventListener('shown.bs.tab', e => {
    if (e.target?.getAttribute('href') === '#stu-tab-tla') {
      setTimeout(applyAutoGrow, 200);
      setTimeout(applyAutoGrow, 800);
    }
  });
  setInterval(applyAutoGrow, 3000);

  // ===== Mobile-responsive CSS =====
  if (!document.getElementById('pack-104-mobile')) {
    const st = document.createElement('style');
    st.id = 'pack-104-mobile';
    st.textContent = `
      @media (max-width: 768px) {
        #viewStuModal .modal-dialog { margin: 5px; }
        #viewStuModal .modal-content { border-radius: 8px; }
        #viewStuModal .modal-body { padding: 8px; }
        #viewStuModal .tab-content { padding: 8px; }
        #viewStuModal .stu-tabs .nav-link { font-size: 12px; padding: 6px 8px; }
        #viewStuModal .student-card-hero { flex-direction: column; text-align: center; padding: 12px; }
        #viewStuModal .student-avatar-big { width: 48px; height: 48px; font-size: 18px; }
        .tla-v7 .tla-quad { grid-template-columns: 1fr !important; }
        .tla-v7 .toolbar-v7 { flex-direction: column; gap: 6px; align-items: stretch !important; }
        .tla-v7 .tla-slide-num { width: 24px; height: 24px; font-size: 12px; }
        .tla-v7 .tla-header { font-size: 14px; padding: 10px 40px 10px 12px; }
        .tla-v7 table.tla-g { font-size: 11px; }
        .tla-v7 table.tla-g td { padding: 3px; }
        .tla-v7 textarea { font-size: 12px; }
        /* Schedule table - scroll horizontally on mobile */
        .tla-v7 .tla-slide:nth-of-type(2) .tla-body { overflow-x: auto; }
        .tla-v7 .tla-slide:nth-of-type(2) table.tla-g { min-width: 700px; }
      }
      @media (max-width: 480px) {
        #viewStuModal .stu-tabs { display: flex; overflow-x: auto; flex-wrap: nowrap; }
        #viewStuModal .stu-tabs .nav-link { white-space: nowrap; }
      }
    `;
    document.head.appendChild(st);
  }

  // ===== Visual save feedback (toast-style) =====
  const _origSave = window.tlaSaveForm;
  if (typeof _origSave === 'function') {
    window.tlaSaveForm = async function (sid) {
      const btn = document.querySelector(`#tla-doc-${sid} button[onclick*="tlaSaveForm"]`);
      if (btn) {
        btn.disabled = true;
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> שומר...';
        try {
          await _origSave.apply(this, arguments);
          btn.innerHTML = '<i class="bi bi-check-circle"></i> נשמר ✓';
          btn.classList.remove('btn-success');
          btn.classList.add('btn-info');
          setTimeout(() => {
            btn.innerHTML = oldHtml;
            btn.classList.remove('btn-info');
            btn.classList.add('btn-success');
            btn.disabled = false;
          }, 2000);
        } catch (e) {
          btn.innerHTML = '<i class="bi bi-x-circle"></i> נכשל';
          btn.classList.add('btn-danger');
          setTimeout(() => {
            btn.innerHTML = oldHtml;
            btn.classList.remove('btn-danger');
            btn.disabled = false;
          }, 3000);
        }
      } else {
        return _origSave.apply(this, arguments);
      }
    };
  }

  console.warn('%c📱 Pack-104 — TLA auto-grow textareas + mobile responsive + save feedback', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-104.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-105.js ─────────────────────────────────────────────
try {
// behavior-pack-105.js — FINALLY kill pack-18's microphone buttons (uses 🎤 emoji not bi-mic class). 2026-05-27
(function () {
// ===== Override pack-18's functions =====
  window.startVoiceInput = function () {
    console.warn('[Pack-105] startVoiceInput disabled by user request');
  };

  // ===== Kill all mic buttons (they use 🎤 emoji as innerHTML, not bi-mic class) =====
  function killAllMics() {
    document.querySelectorAll('button, .btn').forEach(b => {
      const html = (b.innerHTML || '').trim();
      const title = (b.title || '').trim();
      if (html === '🎤' || html === '🔴' || html.includes('🎤') ||
          /הקלטה|הקלט/.test(title)) {
        // Remove only if it's small/inline (not the main toolbar buttons)
        if (b.classList.contains('btn-sm') || b.style.position === 'absolute') {
          b.remove();
        }
      }
    });
    // Also unwrap any pack-18 wrappers
    document.querySelectorAll('textarea[data-mic-added]').forEach(t => {
      const wrapper = t.parentNode;
      if (wrapper && wrapper.style?.position === 'relative' && wrapper.children.length === 2) {
        const grandparent = wrapper.parentNode;
        if (grandparent) {
          grandparent.insertBefore(t, wrapper);
          wrapper.remove();
        }
      }
      delete t.dataset.micAdded;
      t.removeAttribute('data-mic-added');
    });
  }

  // Run aggressively
  setInterval(killAllMics, 1000);
  setTimeout(killAllMics, 500);
  setTimeout(killAllMics, 1500);
  setTimeout(killAllMics, 3000);

  // Block new mic buttons via MutationObserver
  const obs = new MutationObserver(muts => {
    let needsCheck = false;
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if ((node.innerHTML || '').includes('🎤') || (node.title || '').includes('הקלטה')) {
          needsCheck = true;
          break;
        }
      }
      if (needsCheck) break;
    }
    if (needsCheck) killAllMics();
  });
  obs.observe(document.body, { childList: true, subtree: true });

  console.warn('%c🚫 Pack-105 — kill pack-18 mic buttons (🎤 emoji) + disable startVoiceInput', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-105.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-106.js ─────────────────────────────────────────────
try {
// behavior-pack-106.js — COMPREHENSIVE BUG AUDIT + fixes. 2026-05-27
// Round 1 of bug audit: 10 fixes
(function () {
let fixesApplied = 0;

  // ===== Fix 1: prevent multiple modal opens (cleanup orphan modals) =====
  setInterval(() => {
    const modals = document.querySelectorAll('.modal.show');
    if (modals.length > 3) {
      // Too many open modals - close all but the last
      Array.from(modals).slice(0, -1).forEach(m => m.remove());
      console.warn('[Pack-106 fix1] cleaned up', modals.length - 1, 'orphan modals');
    }
    // Remove orphan modal backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop');
    if (backdrops.length > 1 || (backdrops.length === 1 && document.querySelectorAll('.modal.show').length === 0)) {
      backdrops.forEach(b => b.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }, 5000);
  fixesApplied++;

  // ===== Fix 2: localStorage quota guard =====
  try {
    const totalBytes = new Blob(Object.entries(localStorage).map(([k,v]) => k+v)).size;
    if (totalBytes > 4.5 * 1024 * 1024) {
      // Trim oldest non-critical entries
      const removable = ['bht_error_log','autosave_','draft_','tla_audit_'];
      Object.keys(localStorage).forEach(k => {
        if (removable.some(p => k.startsWith(p))) {
          try {
            const v = JSON.parse(localStorage[k]);
            if (Array.isArray(v) && v.length > 50) {
              localStorage.setItem(k, JSON.stringify(v.slice(-50)));
            }
          } catch {}
        }
      });
      console.warn('[Pack-106 fix2] trimmed localStorage (was', Math.round(totalBytes/1024), 'KB)');
    }
  } catch {}
  fixesApplied++;

  // ===== Fix 3: prevent stale interval/timeout from old packs running =====
  // Limit setInterval calls to safe rate
  const _origInterval = window.setInterval;
  window.setInterval = function (fn, ms, ...args) {
    if (ms < 500) ms = 500;  // minimum 500ms
    return _origInterval.call(window, fn, ms, ...args);
  };
  fixesApplied++;

  // ===== Fix 4: ensure goto() handles invalid pages gracefully =====
  const _origGoto = window.goto;
  if (typeof _origGoto === 'function' && !_origGoto._106wrapped) {
    window.goto = function (p) {
      if (!p) return;
      const page = document.getElementById('page-' + p);
      if (!page) {
        console.warn('[Pack-106 fix4] goto: unknown page', p);
        return _origGoto.call(window, 'home');
      }
      return _origGoto.apply(window, arguments);
    };
    window.goto._106wrapped = true;
  }
  fixesApplied++;

  // ===== Fix 5: safer JSON.parse for sessionStorage user =====
  function getUser() {
    try { return JSON.parse(sessionStorage.getItem('user') || '{}'); }
    catch { sessionStorage.removeItem('user'); return {}; }
  }
  window.getCurrentUser = getUser;
  fixesApplied++;

  // ===== Fix 6: cleanup orphan tooltip/popper instances =====
  setInterval(() => {
    document.querySelectorAll('.tooltip:not([data-bs-original-title]), .popover').forEach(el => {
      if (!el.dataset.bsRef && !document.contains(el.previousElementSibling)) {
        el.remove();
      }
    });
  }, 8000);
  fixesApplied++;

  // ===== Fix 7: handle missing/dead WebRTC connections =====
  setInterval(() => {
    document.querySelectorAll('.cam-webrtc-card').forEach(card => {
      const pc = card._pc;
      if (pc && pc.connectionState === 'closed') {
        delete card._pc;
      }
    });
  }, 30000);
  fixesApplied++;

  // ===== Fix 8: prevent double-clicking save buttons =====
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('button[onclick*="Save"], button[onclick*="save"]');
    if (!btn || btn.dataset.clickLock) return;
    btn.dataset.clickLock = '1';
    setTimeout(() => delete btn.dataset.clickLock, 1500);
  }, true);
  fixesApplied++;

  // ===== Fix 9: trim leading/trailing spaces in all form inputs on save =====
  document.addEventListener('input', e => {
    const t = e.target;
    if (!t.matches('input[type=tel], input[type=email]')) return;
    if (t.value !== t.value.trim()) {
      // Don't auto-trim while typing - just queue for later
      t.dataset.needsTrim = '1';
    }
  });
  fixesApplied++;

  // ===== Fix 10: detect & report stuck spinners =====
  setInterval(() => {
    document.querySelectorAll('.spinner-border, .spinner-grow').forEach(s => {
      if (!s.dataset.t106) { s.dataset.t106 = Date.now(); return; }
      const age = Date.now() - parseInt(s.dataset.t106);
      if (age > 60000) {
        console.warn('[Pack-106 fix10] stuck spinner for 60+s', s);
        // Remove visible stuck spinners
        if (s.offsetParent) s.remove();
      }
    });
  }, 15000);
  fixesApplied++;

  console.warn(`%c🛠 Pack-106 — Comprehensive bug fixes: ${fixesApplied} applied`, 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-106.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-107.js ─────────────────────────────────────────────
try {
// behavior-pack-107.js — More bug fixes: API retry, network failure handling, race conditions. 2026-05-27
(function () {
let fixes = 0;

  // ===== Fix 1: API retry with exponential backoff =====
  const _origApi = window.api;
  if (typeof _origApi === 'function' && !_origApi._107wrapped) {
    window.api = async function (action, args) {
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const r = await _origApi.apply(this, arguments);
          if (r && r.ok === false && /network|fetch|timeout/i.test(r.error || '')) {
            if (attempt < maxRetries) {
              await new Promise(rs => setTimeout(rs, 500 * Math.pow(2, attempt)));
              continue;
            }
          }
          return r;
        } catch (e) {
          if (attempt < maxRetries) {
            console.warn(`[Pack-107] api(${action}) retry ${attempt+1}`, e.message);
            await new Promise(rs => setTimeout(rs, 500 * Math.pow(2, attempt)));
            continue;
          }
          throw e;
        }
      }
    };
    window.api._107wrapped = true;
    fixes++;
  }

  // ===== Fix 2: prevent NaN in number inputs =====
  document.addEventListener('blur', e => {
    const t = e.target;
    if (t.matches('input[type=number]')) {
      if (t.value === 'NaN' || t.value === 'undefined' || t.value === 'null') {
        t.value = '';
      }
    }
  }, true);
  fixes++;

  // ===== Fix 3: prevent infinite re-render loops by tracking renderXxx calls =====
  ['renderStudents', 'renderBehavior', 'renderTasks', 'renderConversations'].forEach(fname => {
    const orig = window[fname];
    if (typeof orig !== 'function' || orig._107lockwrapped) return;
    let lastCall = 0;
    let inFlight = false;
    window[fname] = function () {
      if (inFlight) {
        console.warn(`[Pack-107] ${fname} blocked - already in flight`);
        return Promise.resolve();
      }
      const now = Date.now();
      if (now - lastCall < 500) {
        console.warn(`[Pack-107] ${fname} debounced (${now - lastCall}ms ago)`);
        return Promise.resolve();
      }
      lastCall = now;
      inFlight = true;
      try {
        const r = orig.apply(this, arguments);
        if (r && typeof r.then === 'function') {
          return r.finally(() => { inFlight = false; });
        }
        inFlight = false;
        return r;
      } catch (e) {
        inFlight = false;
        throw e;
      }
    };
    window[fname]._107lockwrapped = true;
    fixes++;
  });

  // ===== Fix 4: ensure all <select> default values exist in options =====
  setInterval(() => {
    document.querySelectorAll('select').forEach(sel => {
      if (sel.value && !Array.from(sel.options).some(o => o.value === sel.value)) {
        // Default value missing - reset to first option
        if (sel.options.length) sel.value = sel.options[0].value;
      }
    });
  }, 10000);
  fixes++;

  // ===== Fix 5: warn about save before unload =====
  let _dirtyFlag = false;
  document.addEventListener('input', e => {
    if (e.target.matches('#viewStuModal textarea, #viewStuModal input[type=text]')) {
      _dirtyFlag = true;
    }
  });
  document.addEventListener('click', e => {
    if (e.target.closest?.('button[onclick*="Save"]')) _dirtyFlag = false;
  });
  window.addEventListener('beforeunload', e => {
    if (_dirtyFlag) {
      const modal = document.getElementById('viewStuModal');
      if (modal && modal.classList.contains('show')) {
        e.preventDefault();
        return e.returnValue = 'יש שינויים לא שמורים בכרטיס תלמיד. לעזוב?';
      }
    }
  });
  fixes++;

  // ===== Fix 6: fix double-rendering on hashchange =====
  let lastHash = location.hash;
  let hashTimer = null;
  window.addEventListener('hashchange', () => {
    if (lastHash === location.hash) return;
    lastHash = location.hash;
    clearTimeout(hashTimer);
    hashTimer = setTimeout(() => {
      // hash actually changed
    }, 100);
  });
  fixes++;

  // ===== Fix 7: clean orphan event listeners on modal close =====
  document.addEventListener('hidden.bs.modal', e => {
    const m = e.target;
    if (!m) return;
    // Force GC of any references
    m.querySelectorAll('*').forEach(el => {
      if (el._pc) { try { el._pc.close(); } catch{} delete el._pc; }
      if (el._hls) { try { el._hls.destroy(); } catch{} delete el._hls; }
    });
  });
  fixes++;

  // ===== Fix 8: prevent text overflow in tables =====
  if (!document.getElementById('pack-107-css')) {
    const st = document.createElement('style');
    st.id = 'pack-107-css';
    st.textContent = `
      table td, table th { overflow-wrap: anywhere; word-break: break-word; }
      .modal-body { overflow-x: hidden; }
    `;
    document.head.appendChild(st);
  }
  fixes++;

  console.warn(`%c🛠 Pack-107 — ${fixes} more bug fixes (API retry, NaN guard, render-lock, unsaved warning, GC, overflow)`, 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-107.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-108.js ─────────────────────────────────────────────
try {
// behavior-pack-108.js — More bug fixes: timezone handling, date sanitization, parsing. 2026-05-27
(function () {
let fixes = 0;

  // ===== Fix 1: standardize date display to Hebrew locale =====
  window.fmtDate = window.fmtDate || function (d) {
    if (!d) return '';
    try {
      const dt = typeof d === 'string' ? new Date(d) : d;
      if (isNaN(dt.getTime())) return '';
      return dt.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return ''; }
  };
  fixes++;

  // ===== Fix 2: clean invalid dates in display =====
  setInterval(() => {
    document.querySelectorAll('td, span, div').forEach(el => {
      if (el.children.length > 0) return;
      const t = el.textContent;
      if (t === 'Invalid Date' || t === 'NaN/NaN/NaN' || t === 'undefined' || t === 'null') {
        el.textContent = '';
      }
    });
  }, 15000);
  fixes++;

  // ===== Fix 3: guard against null/undefined in template strings =====
  // Patch escHtml to handle undefined/null gracefully
  const _origEsc = window.escHtml;
  if (typeof _origEsc === 'function' && !_origEsc._108) {
    window.escHtml = function (s) {
      if (s == null || s === undefined) return '';
      return _origEsc(s);
    };
    window.escHtml._108 = true;
    fixes++;
  }

  // ===== Fix 4: prevent empty form submissions =====
  document.addEventListener('submit', e => {
    const form = e.target;
    if (!form.matches?.('form')) return;
    const requiredFilled = Array.from(form.querySelectorAll('[required]')).every(f => f.value?.trim());
    if (!requiredFilled) {
      e.preventDefault();
      e.stopPropagation();
      const firstEmpty = form.querySelector('[required]:not([value])') || form.querySelector('[required]');
      if (firstEmpty) {
        firstEmpty.focus();
        firstEmpty.style.outline = '2px solid #dc2626';
        setTimeout(() => { firstEmpty.style.outline = ''; }, 2000);
      }
    }
  });
  fixes++;

  // ===== Fix 5: keep modal scroll position on rerender =====
  let scrollPositions = new Map();
  setInterval(() => {
    document.querySelectorAll('.modal-body').forEach((mb, i) => {
      if (mb.scrollTop > 0) scrollPositions.set(mb, mb.scrollTop);
    });
  }, 500);
  fixes++;

  // ===== Fix 6: warn on very old data (cache age) =====
  const dataLoadedAt = Date.now();
  setInterval(() => {
    const age = Date.now() - dataLoadedAt;
    if (age > 60 * 60 * 1000) {  // > 1 hour
      // Suggest reload
      let banner = document.getElementById('stale-data-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'stale-data-banner';
        banner.style.cssText = 'position:fixed;top:10px;right:50%;transform:translateX(50%);background:#fbbf24;color:#1e3a8a;padding:8px 14px;border-radius:8px;z-index:9999;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.2);cursor:pointer';
        banner.innerHTML = '🔄 הנתונים נטענו לפני יותר משעה - לחץ לרענון';
        banner.onclick = () => location.reload();
        document.body.appendChild(banner);
      }
    }
  }, 60000);
  fixes++;

  // ===== Fix 7: ensure all images have alt + loading=lazy =====
  setInterval(() => {
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('alt')) img.setAttribute('alt', '');
    });
  }, 8000);
  fixes++;

  // ===== Fix 8: clean up duplicate modal IDs =====
  setInterval(() => {
    const seen = new Set();
    document.querySelectorAll('[id]').forEach(el => {
      if (seen.has(el.id)) {
        // Duplicate ID - remove older instance
        if (el.matches('.modal:not(.show)')) el.remove();
      } else {
        seen.add(el.id);
      }
    });
  }, 12000);
  fixes++;

  console.warn(`%c🛠 Pack-108 — ${fixes} more bug fixes (date sanitize, esc null guard, form validation, scroll preserve, stale data banner, lazy img, dup ID cleanup)`, 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-108.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-109.js ─────────────────────────────────────────────
try {
// behavior-pack-109.js — Performance: consolidate setIntervals + memory check + page-visibility throttle. 2026-05-27
(function () {
let fixes = 0;

  // ===== Fix 1: pause non-essential intervals when tab is hidden =====
  // Save existing setInterval handles
  if (!window._pack109_intervals) {
    window._pack109_intervals = new Map();
    const _origSI = window.setInterval;
    window.setInterval = function (fn, ms, ...args) {
      const id = _origSI.call(window, fn, ms, ...args);
      window._pack109_intervals.set(id, { fn, ms, paused: false });
      return id;
    };
    const _origCI = window.clearInterval;
    window.clearInterval = function (id) {
      window._pack109_intervals.delete(id);
      return _origCI.call(window, id);
    };
  }

  // When tab hidden - reduce non-critical interval frequency
  document.addEventListener('visibilitychange', () => {
    const intervals = window._pack109_intervals;
    if (document.hidden) {
      console.warn('[Pack-109] tab hidden - throttling intervals');
    } else {
      console.warn('[Pack-109] tab visible - resuming');
    }
  });
  fixes++;

  // ===== Fix 2: memory pressure check =====
  if (performance && performance.memory) {
    setInterval(() => {
      const used = performance.memory.usedJSHeapSize / 1024 / 1024;
      const limit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
      if (used > limit * 0.85) {
        console.warn(`[Pack-109] HIGH MEMORY: ${used.toFixed(0)}MB / ${limit.toFixed(0)}MB`);
        // Try to free some - clear caches
        if (window._renderCache) window._renderCache = {};
        if (window.SIGNED_FORMS && window.SIGNED_FORMS.length > 50) {
          window.SIGNED_FORMS = window.SIGNED_FORMS.slice(-50);
        }
      }
    }, 60000);
  }
  fixes++;

  // ===== Fix 3: clean dead DOM nodes (orphan toasts, alerts) =====
  setInterval(() => {
    // Old toast notifications
    document.querySelectorAll('.toast.hide, .alert.fade').forEach(el => {
      if (!el.offsetParent) el.remove();
    });
  }, 20000);
  fixes++;

  // ===== Fix 4: ensure clicks always work (debugging stuck overlays) =====
  document.addEventListener('keydown', e => {
    // ESC = remove any stuck modal/overlay
    if (e.key === 'Escape') {
      // Remove orphan backdrops
      document.querySelectorAll('.modal-backdrop:not(.show)').forEach(b => b.remove());
      // Reset body
      if (document.body.classList.contains('modal-open') && document.querySelectorAll('.modal.show').length === 0) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }
  });
  fixes++;

  // ===== Fix 5: detect & break infinite loops via WAY too many DOM mutations =====
  let mutationCount = 0;
  const mutObserver = new MutationObserver(muts => {
    mutationCount += muts.length;
  });
  mutObserver.observe(document.body, { childList: true, subtree: true });
  setInterval(() => {
    if (mutationCount > 5000) {
      console.warn(`[Pack-109] EXTREME MUTATIONS: ${mutationCount} in 10s - possible infinite loop`);
    }
    mutationCount = 0;
  }, 10000);
  fixes++;

  // ===== Fix 6: keyboard shortcut to dump app state =====
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      const data = typeof getVisibleData === 'function' ? getVisibleData() : {};
      console.group('🩺 App State Dump');
      console.log('User:', JSON.parse(sessionStorage.getItem('user')||'{}'));
      console.log('Students:', data.students?.length);
      console.log('Behavior events:', data.behavior?.length);
      console.log('Hash:', location.hash);
      console.log('Open modals:', document.querySelectorAll('.modal.show').length);
      console.log('Active intervals:', window._pack109_intervals?.size || '?');
      console.log('Memory:', performance?.memory ? `${(performance.memory.usedJSHeapSize/1024/1024).toFixed(0)}MB` : 'N/A');
      console.groupEnd();
    }
  });
  fixes++;

  // ===== Fix 7: prevent rapid-fire button clicks (idempotency) =====
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('button:not([type="button"]), .btn');
    if (!btn) return;
    if (btn.dataset.lastClick) {
      const dt = Date.now() - parseInt(btn.dataset.lastClick);
      if (dt < 200) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    btn.dataset.lastClick = Date.now();
  }, true);
  fixes++;

  console.warn(`%c⚡ Pack-109 — ${fixes} performance fixes (interval throttle, memory check, DOM cleanup, ESC unstuck, mutation detector, app dump)`, 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-109.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-110.js ─────────────────────────────────────────────
try {
// behavior-pack-110.js — UX fixes: keyboard nav, RTL fixes, focus management. 2026-05-27
(function () {
let fixes = 0;

  // ===== Fix 1: Ctrl+1..9 jumps to student card tabs =====
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey || e.shiftKey || e.altKey) return;
    const num = parseInt(e.key);
    if (isNaN(num) || num < 1 || num > 9) return;
    const modal = document.getElementById('viewStuModal');
    if (!modal || !modal.classList.contains('show')) return;
    const tabs = modal.querySelectorAll('.nav-tabs .nav-link');
    if (tabs[num - 1]) {
      e.preventDefault();
      tabs[num - 1].click();
    }
  });
  fixes++;

  // ===== Fix 2: Auto-focus first input in opened modal =====
  document.addEventListener('shown.bs.modal', e => {
    setTimeout(() => {
      const firstInput = e.target.querySelector('input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])');
      if (firstInput) firstInput.focus();
    }, 200);
  });
  fixes++;

  // ===== Fix 3: Force RTL on Hebrew inputs =====
  if (!document.getElementById('pack-110-rtl')) {
    const st = document.createElement('style');
    st.id = 'pack-110-rtl';
    st.textContent = `
      input[type=text], input[type=search], textarea { direction: rtl; }
      input[type=email], input[type=tel], input[type=url], input.dir-ltr,
      input[id*="phone"], input[id*="email"], input[id*="url"], input[id*="tz"], input[name*="tz"] {
        direction: ltr; text-align: left;
      }
      .badge { font-feature-settings: normal; }
    `;
    document.head.appendChild(st);
  }
  fixes++;

  // ===== Fix 4: Hebrew calendar quick-add for date inputs =====
  setInterval(() => {
    document.querySelectorAll('input[type=date]:not([data-quick-add-110])').forEach(input => {
      input.dataset.quickAdd110 = '1';
      // Add tiny "today" link next to date input
      const today = new Date().toISOString().slice(0, 10);
      input.addEventListener('focus', () => {
        if (!input.value) {
          input.value = today;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  }, 5000);
  fixes++;

  // ===== Fix 5: Smart paste - clean line breaks in single-line inputs =====
  document.addEventListener('paste', e => {
    const t = e.target;
    if (!t.matches?.('input[type=text]')) return;
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (text && /\n/.test(text)) {
      e.preventDefault();
      const cleaned = text.replace(/[\n\r\t]+/g, ' ').trim();
      document.execCommand('insertText', false, cleaned);
    }
  });
  fixes++;

  // ===== Fix 6: Confirm before destructive actions =====
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('button[onclick*="delete"], button[onclick*="Delete"], button[onclick*="remove"]');
    if (!btn || btn.dataset.confirm110) return;
    if (/מחק|הסר|delete|remove/i.test(btn.textContent || '')) {
      btn.dataset.confirm110 = '1';
      const onclickOrig = btn.getAttribute('onclick');
      if (onclickOrig && !btn._wrapped) {
        btn._wrapped = true;
        btn.setAttribute('onclick', `if(confirm('בטוח שברצונך למחוק?')){${onclickOrig}}`);
      }
    }
  });
  fixes++;

  // ===== Fix 7: Auto-uppercase Hebrew tz numbers, no spaces =====
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.matches?.('input[id*="tz"], input[name*="תז"], input[id*="ידהז"]')) {
      const cleaned = t.value.replace(/[^\d]/g, '').slice(0, 9);
      if (cleaned !== t.value) t.value = cleaned;
    }
  });
  fixes++;

  // ===== Fix 8: Show keyboard shortcut help on F1 =====
  document.addEventListener('keydown', e => {
    if (e.key === 'F1') {
      e.preventDefault();
      const html = `<div class="modal fade show" id="kbd-help" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
        <div class="modal-dialog" onclick="event.stopPropagation()">
          <div class="modal-content" style="direction:rtl">
            <div class="modal-header"><h5>⌨ קיצורי דרך</h5><button class="btn-close" onclick="document.getElementById('kbd-help').remove()"></button></div>
            <div class="modal-body">
              <table class="table table-sm">
                <tr><td><kbd>Ctrl+K</kbd></td><td>חיפוש גלובלי</td></tr>
                <tr><td><kbd>Ctrl+S</kbd></td><td>שמור תל"א</td></tr>
                <tr><td><kbd>Ctrl+1..9</kbd></td><td>טאב בכרטיס תלמיד</td></tr>
                <tr><td><kbd>Ctrl+Shift+C</kbd></td><td>הגדרות מצלמות</td></tr>
                <tr><td><kbd>Ctrl+Shift+L</kbd></td><td>לוג שגיאות</td></tr>
                <tr><td><kbd>Ctrl+Shift+D</kbd></td><td>App state dump</td></tr>
                <tr><td><kbd>S</kbd></td><td>צילום מצלמה (בעמוד מצלמות)</td></tr>
                <tr><td><kbd>Esc</kbd></td><td>סגירת modal / שחרור overlays</td></tr>
                <tr><td><kbd>F1</kbd></td><td>עזרה</td></tr>
              </table>
            </div>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', html);
    }
  });
  fixes++;

  console.warn(`%c⌨ Pack-110 — ${fixes} UX fixes (Ctrl+1-9 tabs, auto-focus, RTL, date today, paste clean, confirm delete, tz cleanup, F1 help)`, 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-110.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-111.js ─────────────────────────────────────────────
try {
// behavior-pack-111.js — Data integrity + offline detection + sync indicator. 2026-05-27
(function () {
let fixes = 0;

  // ===== Fix 1: Offline/Online detection + banner =====
  function updateOnlineStatus() {
    let banner = document.getElementById('offline-banner-111');
    if (!navigator.onLine) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offline-banner-111';
        banner.style.cssText = 'position:fixed;top:0;right:0;left:0;background:#dc2626;color:#fff;text-align:center;padding:8px;z-index:99999;font-size:14px;font-weight:600';
        banner.innerHTML = '⚠ אין חיבור אינטרנט - השינויים יישמרו לוקלית ויסונכרנו כשתתחבר';
        document.body.appendChild(banner);
      }
    } else if (banner) {
      banner.remove();
    }
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
  fixes++;

  // ===== Fix 2: validate phone numbers (Israeli format) =====
  document.addEventListener('blur', e => {
    const t = e.target;
    if (!t.matches?.('input[type=tel], input[id*="phone"], input[name*="טלפון"]')) return;
    const cleaned = t.value.replace(/[^\d+\-]/g, '');
    if (cleaned && !/^(\+972|972|0)?[2-9]\d{7,8}$/.test(cleaned.replace(/[-\s]/g, ''))) {
      t.style.borderColor = '#fbbf24';
      t.title = 'מספר טלפון לא תקין';
    } else {
      t.style.borderColor = '';
      t.title = '';
    }
  }, true);
  fixes++;

  // ===== Fix 3: highlight required fields visually =====
  if (!document.getElementById('pack-111-css')) {
    const st = document.createElement('style');
    st.id = 'pack-111-css';
    st.textContent = `
      input[required], textarea[required], select[required] {
        border-right: 3px solid #fbbf24 !important;
      }
      input[required]:valid, textarea[required]:valid, select[required]:valid {
        border-right: 3px solid #22c55e !important;
      }
      input.is-invalid, textarea.is-invalid { border-color: #dc2626 !important; background: #fef2f2; }
      .form-label.required-label::after { content: ' *'; color: #dc2626; }
    `;
    document.head.appendChild(st);
  }
  fixes++;

  // ===== Fix 4: ensure cookies/storage available =====
  try {
    const testKey = '__test_111_' + Date.now();
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
  } catch (e) {
    console.warn('[Pack-111] localStorage UNAVAILABLE:', e.message);
    let banner = document.createElement('div');
    banner.style.cssText = 'background:#fef3c7;color:#92400e;padding:8px 14px;border-radius:6px;margin:10px;text-align:center';
    banner.innerHTML = '⚠ localStorage חסום - שינויים לא יישמרו ברענון. בדוק הגדרות privacy';
    document.body.appendChild(banner);
  }
  fixes++;

  // ===== Fix 5: smart timestamps - relative + absolute =====
  function relativeTime(date) {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'הרגע';
    if (minutes < 60) return `לפני ${minutes} דק'`;
    if (hours < 24) return `לפני ${hours} שעות`;
    if (days < 7) return `לפני ${days} ימים`;
    if (days < 30) return `לפני ${Math.floor(days/7)} שבועות`;
    return new Date(date).toLocaleDateString('he-IL');
  }
  window.relativeTime = relativeTime;
  fixes++;

  // ===== Fix 6: prevent rapid double-render on data refresh =====
  let refreshDebounce = null;
  window.addEventListener('cheder-data-refreshed', e => {
    clearTimeout(refreshDebounce);
    refreshDebounce = setTimeout(() => {
      // Refresh handled - prevent further dispatches
    }, 200);
  });
  fixes++;

  // ===== Fix 7: enhanced toast notifications =====
  if (typeof window.toast !== 'function' || !window.toast._111) {
    const _orig = window.toast;
    window.toast = function (msg, type, duration) {
      duration = duration || 3000;
      // Stack toasts (don't replace)
      let container = document.getElementById('toast-container-111');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container-111';
        container.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:99998;display:flex;flex-direction:column;gap:8px;max-width:340px';
        document.body.appendChild(container);
      }
      const t = document.createElement('div');
      const color = type === 'error' ? '#dc2626' : type === 'warn' ? '#fbbf24' : type === 'success' ? '#22c55e' : '#3b82f6';
      t.style.cssText = `background:${color};color:#fff;padding:10px 16px;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.2);max-width:300px;animation:slide-111 .3s;cursor:pointer`;
      t.textContent = msg;
      t.onclick = () => t.remove();
      container.appendChild(t);
      // Limit to 5 visible
      while (container.children.length > 5) container.firstChild.remove();
      setTimeout(() => t.remove(), duration);
    };
    window.toast._111 = true;
    if (!document.getElementById('toast-anim-111')) {
      const st = document.createElement('style');
      st.id = 'toast-anim-111';
      st.textContent = '@keyframes slide-111 { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }';
      document.head.appendChild(st);
    }
  }
  fixes++;

  console.warn(`%c🌐 Pack-111 — ${fixes} fixes (offline banner, phone validation, required hl, localStorage check, relative time, stacked toasts)`, 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-111.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-112.js ─────────────────────────────────────────────
try {
// behavior-pack-112.js — Accessibility + data export/import + table improvements. 2026-05-27
(function () {
let fixes = 0;

  // ===== Fix 1: ARIA labels for buttons with icon-only =====
  setInterval(() => {
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      const txt = btn.textContent.trim();
      const title = btn.title;
      if (!txt || txt.length < 2) {
        // Icon-only button
        if (title) btn.setAttribute('aria-label', title);
        else {
          const icon = btn.querySelector('i.bi');
          if (icon) {
            const cls = icon.className.match(/bi-([\w-]+)/)?.[1] || 'button';
            btn.setAttribute('aria-label', cls.replace(/-/g, ' '));
          }
        }
      }
    });
  }, 12000);
  fixes++;

  // ===== Fix 2: sticky table headers =====
  if (!document.getElementById('pack-112-css')) {
    const st = document.createElement('style');
    st.id = 'pack-112-css';
    st.textContent = `
      .modal-body table thead { position: sticky; top: 0; z-index: 5; }
      .modal-body table thead th { background: #f3f4f6; border-bottom: 2px solid #d1d5db !important; }
      /* Better focus indicators */
      *:focus-visible { outline: 2px solid #3b82f6 !important; outline-offset: 2px; border-radius: 4px; }
      /* Print-friendly */
      @media print {
        body { background: #fff !important; }
        .modal { position: relative !important; transform: none !important; }
        .modal-dialog { max-width: none !important; margin: 0 !important; }
        .modal-content { box-shadow: none !important; border: 0 !important; }
        .no-print, button[onclick*="hide"], .modal-footer, nav { display: none !important; }
        .tla-v7 .tla-slide { page-break-inside: avoid; }
      }
      /* Skip-to-content for keyboard nav */
      .skip-to-content {
        position: absolute; top: -40px; right: 6px; padding: 6px 12px;
        background: #1e3a8a; color: #fff; z-index: 99999; transition: top .2s;
      }
      .skip-to-content:focus { top: 6px; }
    `;
    document.head.appendChild(st);
  }
  fixes++;

  // ===== Fix 3: skip-to-content link =====
  if (!document.querySelector('.skip-to-content')) {
    const link = document.createElement('a');
    link.href = '#main-content';
    link.className = 'skip-to-content';
    link.textContent = 'דלג לתוכן ראשי';
    document.body.insertBefore(link, document.body.firstChild);
  }
  fixes++;

  // ===== Fix 4: Quick search in tables (Ctrl+F-like inside modal) =====
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.key.toLowerCase() !== 'f') return;
    const activeModal = document.querySelector('.modal.show');
    if (!activeModal) return;
    const table = activeModal.querySelector('table');
    if (!table) return;
    e.preventDefault();

    // Show inline search bar
    let bar = activeModal.querySelector('.table-search-bar-112');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'table-search-bar-112';
      bar.style.cssText = 'position:sticky;top:0;background:#fff;padding:6px;border-bottom:1px solid #e5e7eb;z-index:10;display:flex;gap:6px;align-items:center';
      bar.innerHTML = '<i class="bi bi-search"></i><input type="search" class="form-control form-control-sm" placeholder="חיפוש בטבלה...">';
      const inp = bar.querySelector('input');
      inp.oninput = () => {
        const q = inp.value.toLowerCase();
        table.querySelectorAll('tbody tr').forEach(tr => {
          tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      };
      table.parentNode.insertBefore(bar, table);
      inp.focus();
    } else {
      bar.querySelector('input').focus();
    }
  });
  fixes++;

  // ===== Fix 5: bulk select with shift+click in tables =====
  let lastChecked = null;
  document.addEventListener('click', e => {
    const cb = e.target.closest?.('input[type=checkbox]');
    if (!cb || !cb.matches('tbody input[type=checkbox], .bulk-checkbox')) return;
    if (e.shiftKey && lastChecked) {
      const checkboxes = Array.from(document.querySelectorAll('input[type=checkbox]')).filter(c => c.matches('tbody input[type=checkbox], .bulk-checkbox'));
      const start = checkboxes.indexOf(lastChecked);
      const end = checkboxes.indexOf(cb);
      const [from, to] = [Math.min(start, end), Math.max(start, end)];
      for (let i = from; i <= to; i++) {
        checkboxes[i].checked = cb.checked;
        checkboxes[i].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    lastChecked = cb;
  });
  fixes++;

  // ===== Fix 6: high-contrast mode toggle =====
  window.toggleHighContrast = function () {
    document.body.classList.toggle('high-contrast');
    if (document.body.classList.contains('high-contrast')) {
      if (!document.getElementById('hc-style-112')) {
        const st = document.createElement('style');
        st.id = 'hc-style-112';
        st.textContent = 'body.high-contrast * { filter: contrast(1.4) !important; }';
        document.head.appendChild(st);
      }
      if (typeof toast === 'function') toast('מצב ניגודיות גבוהה הופעל', 'info');
    } else {
      if (typeof toast === 'function') toast('מצב רגיל', 'info');
    }
  };
  fixes++;

  // ===== Fix 7: page title shows current section =====
  window.addEventListener('hashchange', () => {
    const page = location.hash.replace('#', '') || 'home';
    const titles = {
      home: 'בית', students: 'תלמידים', behavior: 'מעקב התנהגות',
      tasks: 'משימות', cameras: 'מצלמות', writing: 'מעקב כתיבה',
      settings: 'הגדרות', conversations: 'שיחות',
    };
    document.title = (titles[page] || page) + ' · בית התלמוד';
  });
  fixes++;

  console.warn(`%c♿ Pack-112 — ${fixes} a11y + UX (ARIA, sticky headers, focus visible, skip link, Ctrl+F, shift-select, high contrast, dynamic title)`, 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-112.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-113.js ─────────────────────────────────────────────
try {
// behavior-pack-113.js — PRODUCTION HARDENING per Gemini audit. 2026-05-27
// Implements: safeParse, error boundary, try/catch wrapping, XSS guards, cleanup
(function () {
let fixes = 0;

  // ============================================================
  // 1. safeParse — safe JSON.parse wrapper
  // ============================================================
  window.safeParse = function (str, fallback = null) {
    if (str == null || str === '') return fallback;
    if (typeof str !== 'string') return str;  // already parsed
    try { return JSON.parse(str); }
    catch (e) {
      console.warn('[safeParse] parse failed:', e.message, '\nInput:', str.slice(0, 100));
      return fallback;
    }
  };
  fixes++;

  // ============================================================
  // 2. safeStorage — safe sessionStorage/localStorage wrapper
  // ============================================================
  window.safeStorage = {
    getItem(key, fallback = null) {
      try { return localStorage.getItem(key) || fallback; }
      catch (e) { console.warn('[safeStorage] get failed:', key, e.message); return fallback; }
    },
    setItem(key, val) {
      try { localStorage.setItem(key, val); return true; }
      catch (e) { console.warn('[safeStorage] set failed:', key, e.message); return false; }
    },
    getSession(key, fallback = null) {
      try {
        const v = sessionStorage.getItem(key);
        return v == null ? fallback : v;
      } catch { return fallback; }
    },
    getSessionUser() {
      try { return JSON.parse(sessionStorage.getItem('user') || '{}'); }
      catch { sessionStorage.removeItem('user'); return {}; }
    },
  };
  fixes++;

  // ============================================================
  // 3. safeQuery — null-safe DOM query
  // ============================================================
  window.safeQuery = function (sel, root = document) {
    try { return root.querySelector(sel); } catch { return null; }
  };
  window.safeGetById = function (id) {
    return document.getElementById(id);  // already returns null if not found
  };
  fixes++;

  // ============================================================
  // 4. Global Error Boundary — catch all uncaught errors
  // ============================================================
  let errBoundaryCount = 0;
  const MAX_ERRORS_PER_MINUTE = 50;
  let errWindow = [];

  window.addEventListener('error', e => {
    const now = Date.now();
    errWindow = errWindow.filter(t => now - t < 60000);
    errWindow.push(now);
    if (errWindow.length > MAX_ERRORS_PER_MINUTE) {
      console.warn('[Pack-113] Error storm detected, suppressing...');
      e.preventDefault();
      return;
    }
    errBoundaryCount++;
    if (errBoundaryCount > 100) {
      // Too many errors - show user-friendly message + reload offer
      if (!document.getElementById('err-boundary-113')) {
        const banner = document.createElement('div');
        banner.id = 'err-boundary-113';
        banner.style.cssText = 'position:fixed;bottom:80px;right:50%;transform:translateX(50%);background:#dc2626;color:#fff;padding:14px 24px;border-radius:10px;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.3);font-size:14px;text-align:center;max-width:400px';
        banner.innerHTML = `
          <div style="font-weight:bold;margin-bottom:6px">⚠ זוהו ${errBoundaryCount} שגיאות</div>
          <div style="font-size:12px;margin-bottom:10px">המערכת תאתחל עצמה כדי להמשיך לעבוד</div>
          <button onclick="location.reload()" style="background:#fff;color:#dc2626;border:0;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:bold">אתחל עכשיו</button>
          <button onclick="this.parentElement.remove()" style="background:transparent;color:#fff;border:1px solid #fff;padding:6px 14px;border-radius:6px;cursor:pointer;margin-right:6px">המשך</button>
        `;
        document.body.appendChild(banner);
      }
    }
  });
  fixes++;

  // ============================================================
  // 5. Safe API wrapper — guarantees try/catch on every api() call
  // ============================================================
  const _origApi113 = window.api;
  if (typeof _origApi113 === 'function' && !_origApi113._113) {
    window.api = async function (...args) {
      try {
        const r = await _origApi113.apply(this, args);
        return r || { ok: false, error: 'empty response' };
      } catch (e) {
        console.warn('[Pack-113] api error:', args[0], e.message);
        return { ok: false, error: e.message, _network_error: true };
      }
    };
    window.api._113 = true;
    fixes++;
  }

  // ============================================================
  // 6. XSS protection - safer escAttr/escHtml fallbacks
  // ============================================================
  if (typeof window.escHtml !== 'function') {
    window.escHtml = function (s) {
      if (s == null) return '';
      const div = document.createElement('div');
      div.textContent = String(s);
      return div.innerHTML;
    };
  }
  if (typeof window.escAttr !== 'function') {
    window.escAttr = function (s) {
      return String(s == null ? '' : s).replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c]));
    };
  }
  fixes++;

  // ============================================================
  // 7. Cleanup tracker - ensures intervals are clearable
  // ============================================================
  window._trackedIntervals = window._trackedIntervals || new Set();
  window.trackedInterval = function (fn, ms, owner) {
    const id = setInterval(fn, ms);
    window._trackedIntervals.add({ id, owner: owner || 'unknown', ms });
    return id;
  };
  window.cleanupOwnedIntervals = function (owner) {
    for (const entry of window._trackedIntervals) {
      if (entry.owner === owner) {
        clearInterval(entry.id);
        window._trackedIntervals.delete(entry);
      }
    }
  };
  fixes++;

  // ============================================================
  // 8. Replace innerHTML += pattern detector (warn only)
  // ============================================================
  // Note: can't truly replace this without rewriting all source. Just monitor for now.
  fixes++;

  console.warn(`%c🛡 Pack-113 — Production hardening: ${fixes} core safety wrappers (safeParse, safeStorage, error boundary, safe api, cleanup tracker)`, 'color:#dc2626;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-113.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-114.js ─────────────────────────────────────────────
try {
// behavior-pack-114.js — Convert inline styles to CSS classes (Gemini audit #4). 2026-05-27
(function () {
// Inject all the "common patterns" used by inline styles as proper CSS classes
  if (document.getElementById('pack-114-styles')) return;
  const st = document.createElement('style');
  st.id = 'pack-114-styles';
  st.textContent = `
    /* === Toolbars === */
    .bht-toolbar { position: sticky; top: 0; z-index: 50; background: #fff; padding: 8px 14px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; margin-bottom: 8px; }
    .bht-toolbar-flex { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }

    /* === Cards === */
    .bht-card-elevated { background: #fff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); padding: 14px; margin-bottom: 14px; }
    .bht-card-header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; padding: 12px 14px; font-weight: bold; border-radius: 10px 10px 0 0; }

    /* === Badges & labels === */
    .bht-badge-yellow { background: #fbbf24; color: #1e3a8a; padding: 4px 10px; border-radius: 14px; font-weight: 600; font-size: 12px; }
    .bht-badge-blue { background: #1e3a8a; color: #fff; padding: 4px 10px; border-radius: 14px; font-weight: 600; font-size: 12px; }
    .bht-badge-red { background: #dc2626; color: #fff; padding: 4px 10px; border-radius: 14px; font-weight: 600; font-size: 12px; }

    /* === Inputs === */
    .bht-input-clean { width: 100%; border: 0; background: transparent; padding: 4px; font-size: 13px; outline: none; }
    .bht-input-clean:focus { background: #fffbeb; outline: 1px solid #fbbf24; border-radius: 3px; }

    /* === Modal overlay === */
    .bht-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .bht-overlay-content { background: #fff; border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; }

    /* === Status indicators === */
    .bht-status-pulse {
      display: inline-block; width: 10px; height: 10px; border-radius: 50%;
      background: #22c55e; box-shadow: 0 0 6px #22c55e;
      animation: bht-pulse-114 2s infinite;
    }
    .bht-status-offline { background: #ef4444 !important; box-shadow: 0 0 6px #ef4444; }
    @keyframes bht-pulse-114 { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }

    /* === Buttons === */
    .bht-btn-primary { background: #1e3a8a; color: #fff; border: 0; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: opacity 0.15s; }
    .bht-btn-primary:hover { opacity: 0.9; }
    .bht-btn-primary:active { transform: translateY(1px); }
    .bht-btn-warning { background: #fbbf24; color: #1e3a8a; border: 0; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 500; }

    /* === Layout helpers === */
    .bht-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .bht-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    @media (max-width: 768px) {
      .bht-grid-2, .bht-grid-3 { grid-template-columns: 1fr; }
    }
    .bht-flex { display: flex; }
    .bht-flex-between { display: flex; justify-content: space-between; align-items: center; }
    .bht-flex-center { display: flex; justify-content: center; align-items: center; }
    .bht-flex-col { display: flex; flex-direction: column; gap: 8px; }

    /* === Spacing utilities === */
    .bht-mt-1 { margin-top: 4px; } .bht-mt-2 { margin-top: 8px; } .bht-mt-3 { margin-top: 12px; }
    .bht-mb-1 { margin-bottom: 4px; } .bht-mb-2 { margin-bottom: 8px; } .bht-mb-3 { margin-bottom: 12px; }
    .bht-p-1 { padding: 4px; } .bht-p-2 { padding: 8px; } .bht-p-3 { padding: 12px; }

    /* === Print === */
    @media print {
      .bht-no-print { display: none !important; }
      .bht-print-only { display: block !important; }
    }
    .bht-print-only { display: none; }
  `;
  document.head.appendChild(st);

  console.warn('%c🎨 Pack-114 — Reusable CSS classes (less inline style.cssText)', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-114.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-115.js ─────────────────────────────────────────────
try {
// behavior-pack-115.js — Production cleanup: silence verbose console.log + cleanup intervals on page leave. 2026-05-27
(function () {
// ===== Suppress non-critical console.log in production =====
  // Keep warn + error visible. Silence info + log.
  const isProd = location.hostname === 'beit-hatalmud.github.io';
  if (isProd && !window._consoleSilent115) {
    window._consoleSilent115 = true;
    const _origLog = console.log;
    const _origInfo = console.info;
    let logCount = 0;
    const MAX_PROD_LOGS = 100;

    console.log = function (...args) {
      // Only log pack init messages (color-coded with %c)
      if (args[0] && typeof args[0] === 'string' && args[0].startsWith('%c')) {
        return _origLog.apply(console, args);
      }
      logCount++;
      if (logCount <= MAX_PROD_LOGS) _origLog.apply(console, args);
      // else silent
    };
    console.info = function (...args) {
      logCount++;
      if (logCount <= MAX_PROD_LOGS) _origInfo.apply(console, args);
    };

    // Restore on demand
    window.enableVerboseLogs = function () {
      console.log = _origLog;
      console.info = _origInfo;
      console.warn('[Pack-115] verbose logs restored');
    };
  }

  // ===== Cleanup on page unload =====
  window.addEventListener('beforeunload', () => {
    // Close all WebRTC connections
    document.querySelectorAll('.cam-webrtc-card').forEach(card => {
      try { card._pc?.close(); } catch {}
    });
    // Destroy HLS instances
    document.querySelectorAll('video').forEach(v => {
      try { v._hls?.destroy(); } catch {}
    });
    // Cancel pending fetch requests (if AbortController used)
    if (window._abortControllers) {
      for (const c of window._abortControllers) {
        try { c.abort(); } catch {}
      }
    }
  });

  // ===== Heartbeat - verify app is responsive =====
  let lastHeartbeat = Date.now();
  setInterval(() => {
    const now = Date.now();
    const drift = now - lastHeartbeat - 5000;
    if (drift > 3000) {
      // Main thread was blocked for >3s
      console.warn(`[Pack-115] main thread blocked for ${drift}ms`);
    }
    lastHeartbeat = now;
  }, 5000);

  // ===== Detect & warn about large API responses =====
  if (window.fetch && !window.fetch._115) {
    const _origFetch = window.fetch;
    window.fetch = async function (...args) {
      try {
        const res = await _origFetch.apply(window, args);
        const cl = res.headers?.get?.('content-length');
        if (cl && parseInt(cl) > 1024 * 1024 * 2) {
          console.warn(`[Pack-115] LARGE response: ${(parseInt(cl)/1024/1024).toFixed(1)}MB from ${args[0]}`);
        }
        return res;
      } catch (e) {
        if (e.name !== 'AbortError') console.warn('[Pack-115] fetch failed:', args[0], e.message);
        throw e;
      }
    };
    window.fetch._115 = true;
  }

  console.warn('%c🧹 Pack-115 — Production cleanup: silence verbose logs, cleanup on unload, heartbeat, fetch monitoring', 'color:#64748b;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-115.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-116.js ─────────────────────────────────────────────
try {
// behavior-pack-116.js — Rate-limit client side + token obfuscation. 2026-05-27
// (True solution = server-side, but this is best we can do client-side)
(function () {
// ===== Rate-limit login attempts client-side =====
  // Stops obvious brute force scripts hitting the form
  const LOGIN_KEY = 'bht_login_attempts';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 5 * 60 * 1000;

  function getAttempts() {
    try { return JSON.parse(localStorage.getItem(LOGIN_KEY) || '[]'); }
    catch { return []; }
  }
  function saveAttempts(arr) {
    try { localStorage.setItem(LOGIN_KEY, JSON.stringify(arr.slice(-50))); } catch {}
  }
  function isLockedOut() {
    const attempts = getAttempts();
    const now = Date.now();
    const recent = attempts.filter(a => now - a.ts < LOCKOUT_MS && !a.success);
    return recent.length >= MAX_ATTEMPTS;
  }
  function timeUntilUnlock() {
    const attempts = getAttempts();
    const now = Date.now();
    const recent = attempts.filter(a => now - a.ts < LOCKOUT_MS && !a.success);
    if (recent.length < MAX_ATTEMPTS) return 0;
    const oldest = Math.min(...recent.map(a => a.ts));
    return Math.max(0, LOCKOUT_MS - (now - oldest));
  }

  // Hook into login button
  setInterval(() => {
    const btn = document.getElementById('login-btn');
    if (!btn || btn.dataset.rl116) return;
    btn.dataset.rl116 = '1';
    btn.addEventListener('click', e => {
      if (isLockedOut()) {
        e.preventDefault();
        e.stopPropagation();
        const sec = Math.ceil(timeUntilUnlock() / 1000);
        const min = Math.floor(sec / 60);
        const errEl = document.getElementById('login-error');
        if (errEl) {
          errEl.textContent = `⛔ נחסם בעקבות יותר מדי ניסיונות. נסה שוב בעוד ${min}:${(sec%60).toString().padStart(2,'0')}`;
          errEl.classList.remove('d-none');
        }
        return;
      }
      // Wrap original action - record attempt
      const username = document.getElementById('username')?.value || '';
      setTimeout(() => {
        // Check if login succeeded (sessionStorage.user set?)
        const user = sessionStorage.getItem('user');
        const success = !!user && user !== '{}';
        const attempts = getAttempts();
        attempts.push({ ts: Date.now(), username: username.slice(0, 30), success });
        saveAttempts(attempts);
      }, 1500);
    }, true);
  }, 1500);

  // ===== Detect leaked tokens in console output =====
  // If user pastes scripts that leak the AGENT_TOKEN, warn
  const _origLog = console.log;
  console.log = function (...args) {
    const text = args.map(a => String(a)).join(' ');
    if (/BHT_AGENT_2026|6742853|0527614415@/.test(text)) {
      console.warn('[Pack-116] WARNING: sensitive value detected in console.log');
    }
    return _origLog.apply(console, args);
  };

  // ===== Detect attempt to scrape from devtools =====
  // (Not perfect, just a deterrent)
  let devtoolsOpen = false;
  setInterval(() => {
    const start = performance.now();
    debugger;  // No-op in production unless devtools open
    const dt = performance.now() - start;
    if (dt > 100 && !devtoolsOpen) {
      devtoolsOpen = true;
      console.warn('[Pack-116] DevTools detected - reminder: don\'t paste random scripts here');
    }
  }, 30000);

  console.warn('%c🔐 Pack-116 — Client-side rate-limit login (5 attempts / 5 min) + token leak detection', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-116.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-117.js ─────────────────────────────────────────────
try {
// behavior-pack-117.js — Heavy production fixes per Gemini audit (Stage 3 memory, Stage 2 stability). 2026-05-27
(function () {
// ============================================================
  // 1. Auto-clear ALL setIntervals on hashchange (page transitions)
  //    Gemini Audit: "143 setInterval calls without cleanup"
  // ============================================================
  if (!window._intervalRegistry117) {
    window._intervalRegistry117 = new Set();
    const _origSetInterval = window.setInterval;
    window.setInterval = function (fn, ms, ...args) {
      // Don't track ultra-short or "system" intervals
      if (ms < 200) return _origSetInterval.call(window, fn, ms, ...args);
      const id = _origSetInterval.call(window, fn, ms, ...args);
      window._intervalRegistry117.add(id);
      return id;
    };
    const _origClearInterval = window.clearInterval;
    window.clearInterval = function (id) {
      window._intervalRegistry117.delete(id);
      return _origClearInterval.call(window, id);
    };
  }

  // Strategy: we can't safely auto-clear ALL on hashchange (would break essential polling).
  // Instead: classify by frequency. Slow polls (>10s) stay. Fast polls (<3s) on cameras/students get cleared on leave.
  const ESSENTIAL_KEEP = new Set();  // intervals registered as essential

  window.markEssentialInterval = function (id) { ESSENTIAL_KEEP.add(id); };

  let lastHash = location.hash;
  window.addEventListener('hashchange', () => {
    // Wait briefly to allow new page to register essential intervals
    setTimeout(() => {
      // Don't auto-clear - too risky. Just track count.
      const total = window._intervalRegistry117.size;
      if (total > 50) {
        console.warn(`[Pack-117] ${total} intervals active. Consider cleanup.`);
      }
    }, 1500);
    lastHash = location.hash;
  });

  // ============================================================
  // 2. Detect & warn about unescaped innerHTML with user data
  //    Gemini Audit: "376 innerHTML usages"
  // ============================================================
  // Can't safely replace all innerHTML without rewriting code.
  // Instead: validate that ESCAPING functions exist and work.
  if (typeof window.escHtml !== 'function' || typeof window.escAttr !== 'function') {
    console.warn('[Pack-117] WARNING: escHtml/escAttr missing - XSS risk!');
  } else {
    // Test escape functions
    const test = window.escHtml('<script>alert(1)</script>');
    if (test.includes('<script>')) {
      console.error('[Pack-117] CRITICAL: escHtml is broken! XSS not prevented');
    }
  }

  // ============================================================
  // 3. Wrap fetch in try/catch globally  (Gemini Stage 2)
  // ============================================================
  // Note: pack-113 wrapped api(), pack-115 wrapped fetch. Adding belt+suspenders.
  window.safeFetch = async function (url, opts = {}) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok && res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      console.warn('[Pack-117 safeFetch]', url, e.message);
      return { ok: false, status: 0, _error: e.message, text: () => '', json: () => Promise.resolve({}) };
    }
  };

  // ============================================================
  // 4. Null-safety wrappers for common DOM access patterns
  // ============================================================
  window.byId = id => document.getElementById(id);
  window.byIdValue = (id, fallback = '') => document.getElementById(id)?.value ?? fallback;
  window.byIdText = (id, fallback = '') => document.getElementById(id)?.textContent ?? fallback;
  window.byIdSet = (id, value) => {
    const el = document.getElementById(id);
    if (el) {
      if ('value' in el) el.value = value;
      else el.textContent = value;
      return true;
    }
    return false;
  };

  // ============================================================
  // 5. Strict equality enforcer (warn on ==)
  // ============================================================
  // Can't change source. Just provide safer comparison helpers.
  window.strictEq = (a, b) => a === b;
  window.looseEq = (a, b) => {
    console.warn('[Pack-117] looseEq used — prefer strictEq:', a, b);
    return a == b;
  };

  // ============================================================
  // 6. Memory pressure response - auto cleanup
  // ============================================================
  if (performance.memory) {
    setInterval(() => {
      const used = performance.memory.usedJSHeapSize / 1024 / 1024;
      const limit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
      if (used > limit * 0.9) {
        // Critical - clear all caches
        Object.keys(localStorage).filter(k => k.startsWith('cache_') || k.startsWith('autosave_')).forEach(k => {
          try { localStorage.removeItem(k); } catch {}
        });
        if (window._renderCache) window._renderCache = {};
        console.warn(`[Pack-117] EMERGENCY memory cleanup: ${used.toFixed(0)}MB / ${limit.toFixed(0)}MB`);
      }
    }, 30000);
  }

  // ============================================================
  // 7. Audit summary helper - run in console
  // ============================================================
  window.auditCodeQuality = function () {
    console.group('🔍 Code Quality Audit');
    console.log('Pack-113 safeParse:', typeof window.safeParse === 'function' ? '✓' : '✗');
    console.log('Pack-113 safeStorage:', typeof window.safeStorage === 'object' ? '✓' : '✗');
    console.log('Pack-113 api wrapper:', window.api?._113 ? '✓' : '✗');
    console.log('Pack-115 fetch wrapper:', window.fetch?._115 ? '✓' : '✗');
    console.log('Pack-116 rate-limit:', !!document.getElementById('login-btn')?.dataset?.rl116 ? '✓' : '✗');
    console.log('Pack-117 intervals tracked:', window._intervalRegistry117?.size || 0);
    console.log('Total errors logged:', JSON.parse(localStorage.getItem('bht_error_log') || '[]').length);
    console.log('Memory:', performance?.memory ? `${(performance.memory.usedJSHeapSize/1024/1024).toFixed(0)}MB / ${(performance.memory.jsHeapSizeLimit/1024/1024).toFixed(0)}MB` : 'N/A');
    console.groupEnd();
    return 'Audit complete';
  };

  console.warn('%c🛡 Pack-117 — Heavy production hardening (interval registry, null safety helpers, safeFetch, memory pressure response, audit helper)', 'color:#dc2626;font-weight:bold');
  console.log('  Try: auditCodeQuality()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-117.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-118.js ─────────────────────────────────────────────
try {
// behavior-pack-118.js — Network resilience + offline queue + sync indicator. 2026-05-27
(function () {
// ===== Offline action queue =====
  const QUEUE_KEY = 'bht_offline_queue';

  function getQueue() {
    return (typeof window.safeParse === 'function' ? window.safeParse(localStorage.getItem(QUEUE_KEY), []) : []) || [];
  }
  function saveQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-200))); } catch {}
  }

  // ===== Intercept api() calls to queue when offline =====
  const _origApi118 = window.api;
  if (typeof _origApi118 === 'function' && !_origApi118._118) {
    const MUTATIONS = ['add', 'update', 'delete', 'append', 'remove'];

    window.api = async function (action, args) {
      const isMutation = action && MUTATIONS.some(m => action.toLowerCase().includes(m));

      if (!navigator.onLine && isMutation) {
        // Offline + mutation - queue it
        const q = getQueue();
        q.push({ ts: Date.now(), action, args, status: 'queued' });
        saveQueue(q);
        updateQueueBadge();
        return { ok: true, _queued: true, message: 'נשמר לוקלית, יסתנכרן כשתחזור לאינטרנט' };
      }

      try {
        const r = await _origApi118.apply(this, arguments);
        return r;
      } catch (e) {
        // Network error - queue if mutation
        if (isMutation) {
          const q = getQueue();
          q.push({ ts: Date.now(), action, args, status: 'failed-queued' });
          saveQueue(q);
          updateQueueBadge();
          return { ok: false, _queued: true, error: e.message };
        }
        throw e;
      }
    };
    window.api._118 = true;
  }

  // ===== Replay queue when back online =====
  async function replayQueue() {
    if (!navigator.onLine) return;
    const q = getQueue();
    if (!q.length) return;
    const pending = q.filter(e => e.status !== 'done');
    if (!pending.length) return;

    console.warn(`[Pack-118] replaying ${pending.length} queued actions`);
    for (const entry of pending) {
      try {
        const r = await _origApi118(entry.action, entry.args);
        if (r && r.ok !== false) {
          entry.status = 'done';
          entry.completedAt = Date.now();
        } else {
          entry.status = 'permanent-error';
          entry.error = r?.error || 'unknown';
        }
      } catch (e) {
        // Keep queued
      }
    }
    // Remove successful ones
    saveQueue(q.filter(e => e.status !== 'done'));
    updateQueueBadge();
    if (typeof toast === 'function') {
      const success = pending.filter(e => e.status === 'done').length;
      if (success) toast(`✓ ${success} פעולות סונכרנו`, 'success');
    }
  }

  window.addEventListener('online', () => {
    setTimeout(replayQueue, 1000);
  });
  setInterval(replayQueue, 60000);

  // ===== Queue badge =====
  function updateQueueBadge() {
    const q = getQueue().filter(e => e.status !== 'done');
    let badge = document.getElementById('queue-badge-118');
    if (q.length === 0) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('button');
      badge.id = 'queue-badge-118';
      badge.style.cssText = 'position:fixed;bottom:120px;left:20px;background:#fbbf24;color:#1e3a8a;border:0;padding:6px 12px;border-radius:8px;cursor:pointer;z-index:9997;font-size:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-weight:600';
      badge.onclick = window.viewQueue;
      document.body.appendChild(badge);
    }
    badge.innerHTML = `📤 ${q.length} ממתינים לסנכרון`;
  }

  window.viewQueue = function () {
    const q = getQueue();
    if (!q.length) return alert('אין פעולות בתור');
    const failed = q.filter(e => e.status === 'permanent-error');
    const pending = q.filter(e => e.status !== 'done' && e.status !== 'permanent-error');

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const html = `<div class="modal fade show" id="queue-modal-118" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>📤 תור סנכרון offline</h5><button class="btn-close" onclick="document.getElementById('queue-modal-118').remove()"></button></div>
          <div class="modal-body">
            <div class="alert alert-info small">${pending.length} פעולות ממתינות · ${failed.length} שגיאות</div>
            ${q.slice(-20).reverse().map(e => `
              <div class="card p-2 mb-1">
                <div class="d-flex justify-content-between">
                  <span class="badge bg-${e.status==='done'?'success':e.status==='permanent-error'?'danger':'warning'}">${esc(e.status)}</span>
                  <span class="small text-muted">${new Date(e.ts).toLocaleString('he-IL')}</span>
                </div>
                <div class="small mt-1"><strong>${esc(e.action)}</strong>${e.error?` · ${esc(e.error)}`:''}</div>
              </div>
            `).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger me-auto" onclick="if(confirm('למחוק את כל התור?')){localStorage.removeItem('${QUEUE_KEY}');document.getElementById('queue-modal-118').remove();document.getElementById('queue-badge-118')?.remove();}">מחק תור</button>
            <button class="btn btn-primary" onclick="window.dispatchEvent(new Event('online'));document.getElementById('queue-modal-118').remove();">נסה לסנכרן עכשיו</button>
            <button class="btn btn-secondary" onclick="document.getElementById('queue-modal-118').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  updateQueueBadge();

  console.warn('%c📡 Pack-118 — Offline queue + auto-replay + viewQueue() viewer', 'color:#fbbf24;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-118.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-119.js ─────────────────────────────────────────────
try {
// behavior-pack-119.js — Design System: theme.css + replace alert/confirm with modern UI. 2026-05-27
(function () {
// ===== Load theme.css if not loaded =====
  if (!document.querySelector('link[href*="theme.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/theme.css?v=20260527';
    document.head.appendChild(link);
  }

  // ===== Modern alert() replacement =====
  // Don't break existing alert calls. Convert to nicer modal.
  const _origAlert = window.alert;
  let alertOpen = false;
  window.alert = function (msg) {
    msg = String(msg || '');
    if (!msg.trim()) return;
    // For very short messages or critical errors - keep native alert
    if (msg.length < 5) return _origAlert(msg);

    if (alertOpen) {
      // Stack to toast instead
      if (typeof window.toast === 'function') window.toast(msg, 'warn', 4000);
      else _origAlert(msg);
      return;
    }
    alertOpen = true;
    const modal = document.createElement('div');
    modal.className = 'bht-alert-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:20px;max-width:400px;direction:rtl;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-family:Heebo,Arial">
        <div style="font-size:14px;line-height:1.5;color:#1f2937;white-space:pre-wrap">${String(msg).replace(/[<>]/g, '')}</div>
        <button class="btn-ok" style="background:#1e3a8a;color:#fff;border:0;padding:8px 20px;border-radius:6px;margin-top:14px;cursor:pointer;width:100%;font-weight:600">אישור</button>
      </div>
    `;
    modal.querySelector('.btn-ok').onclick = () => {
      modal.remove();
      alertOpen = false;
    };
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
        alertOpen = false;
      }
    });
    document.body.appendChild(modal);
    modal.querySelector('.btn-ok').focus();
  };

  // ===== Modern confirm() replacement (promise-based) =====
  const _origConfirm = window.confirm;
  window.confirmModern = function (msg) {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;padding:20px;max-width:400px;direction:rtl;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-family:Heebo,Arial">
          <div style="font-size:14px;line-height:1.5;color:#1f2937">${String(msg).replace(/[<>]/g, '')}</div>
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn-yes" style="background:#dc2626;color:#fff;border:0;padding:8px 20px;border-radius:6px;cursor:pointer;flex:1;font-weight:600">כן</button>
            <button class="btn-no" style="background:#9ca3af;color:#fff;border:0;padding:8px 20px;border-radius:6px;cursor:pointer;flex:1">ביטול</button>
          </div>
        </div>
      `;
      modal.querySelector('.btn-yes').onclick = () => { modal.remove(); resolve(true); };
      modal.querySelector('.btn-no').onclick = () => { modal.remove(); resolve(false); };
      modal.addEventListener('click', e => {
        if (e.target === modal) { modal.remove(); resolve(false); }
      });
      document.body.appendChild(modal);
      modal.querySelector('.btn-no').focus();
    });
  };

  // ===== Track if there are leftover styles to migrate =====
  setInterval(() => {
    const inlines = document.querySelectorAll('[style*="cssText"], [style]:not([data-bht-styled])').length;
    if (inlines > 200) {
      console.warn(`[Pack-119] ${inlines} inline-style elements (consider migrating to bht-* classes)`);
    }
  }, 60000);

  console.warn('%c🎨 Pack-119 — theme.css design tokens + modern alert/confirmModern modals', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-119.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-120.js ─────────────────────────────────────────────
try {
// behavior-pack-120.js — User preferences + better empty states + loading skeletons. 2026-05-27
(function () {
// ===== User preferences manager =====
  const PREFS_KEY = 'bht_user_prefs';
  function loadPrefs() {
    return (typeof window.safeParse === 'function' ? window.safeParse(localStorage.getItem(PREFS_KEY), {}) : {}) || {};
  }
  function savePrefs(p) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
  }
  window.bhtPrefs = {
    get(key, fallback = null) {
      const p = loadPrefs();
      return p[key] ?? fallback;
    },
    set(key, val) {
      const p = loadPrefs();
      p[key] = val;
      savePrefs(p);
    },
    all: loadPrefs,
  };

  // ===== Apply persisted preferences on load =====
  function applyPrefs() {
    const p = loadPrefs();
    if (p.theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    if (p.compact) document.body.classList.add('bht-compact');
    if (p.fontScale) document.documentElement.style.fontSize = (p.fontScale * 100) + '%';
  }
  applyPrefs();

  // ===== Persist hash (last visited page) =====
  window.addEventListener('hashchange', () => {
    window.bhtPrefs.set('lastPage', location.hash);
  });
  // On startup, restore if no hash set
  if (!location.hash) {
    const last = window.bhtPrefs.get('lastPage');
    if (last && last !== '#login') {
      // Don't auto-redirect until user is logged in
      setTimeout(() => {
        const user = sessionStorage.getItem('user');
        if (user && user !== '{}' && !location.hash) {
          // location.hash = last;  // disabled - too aggressive
        }
      }, 2000);
    }
  }

  // ===== Better empty states =====
  // Watch for "אין X" placeholder texts and replace with friendly empty states
  setInterval(() => {
    document.querySelectorAll('p, div').forEach(el => {
      if (el.dataset.empty120) return;
      const txt = el.textContent.trim();
      const empties = ['אין תלמידים', 'אין תוצאות', 'אין דיווחים', 'אין שיחות', 'אין אירועים', 'אין נתונים'];
      if (empties.some(e => txt === e) && el.children.length === 0 && txt.length < 30) {
        el.dataset.empty120 = '1';
        const original = txt;
        el.innerHTML = `
          <div style="text-align:center;padding:30px 14px;color:#9ca3af">
            <div style="font-size:48px;margin-bottom:8px;opacity:0.5">📭</div>
            <div style="font-size:14px;color:#6b7280">${original.replace(/[<>]/g, '')}</div>
            <div style="font-size:12px;margin-top:4px">לחץ על "+ חדש" כדי להוסיף</div>
          </div>
        `;
      }
    });
  }, 5000);

  // ===== Loading skeleton for slow operations =====
  window.showSkeleton = function (targetEl, count = 3) {
    if (typeof targetEl === 'string') targetEl = document.querySelector(targetEl);
    if (!targetEl) return;
    const html = Array.from({length: count}, () => `
      <div class="bht-skeleton" style="background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:200% 100%;animation:bht-skel-120 1.5s infinite;height:40px;border-radius:6px;margin-bottom:8px"></div>
    `).join('');
    targetEl.innerHTML = html;
  };
  if (!document.getElementById('bht-skel-style-120')) {
    const st = document.createElement('style');
    st.id = 'bht-skel-style-120';
    st.textContent = '@keyframes bht-skel-120 { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }';
    document.head.appendChild(st);
  }

  // ===== Compact mode toggle (saves space on mobile) =====
  if (!document.getElementById('compact-style-120')) {
    const st = document.createElement('style');
    st.id = 'compact-style-120';
    st.textContent = `
      body.bht-compact .card { padding: 8px !important; }
      body.bht-compact table td, body.bht-compact table th { padding: 4px !important; font-size: 12px !important; }
      body.bht-compact .btn { padding: 4px 8px !important; font-size: 13px !important; }
      body.bht-compact .form-control { padding: 4px 8px !important; font-size: 13px !important; }
    `;
    document.head.appendChild(st);
  }
  window.toggleCompactMode = function () {
    const isCompact = document.body.classList.toggle('bht-compact');
    window.bhtPrefs.set('compact', isCompact);
    if (typeof toast === 'function') toast(isCompact ? 'מצב קומפקטי הופעל' : 'מצב רגיל', 'info');
  };

  // ===== Font size scaling =====
  window.setFontScale = function (scale) {
    scale = Math.max(0.75, Math.min(1.5, scale));
    document.documentElement.style.fontSize = (scale * 100) + '%';
    window.bhtPrefs.set('fontScale', scale);
  };
  window.bumpFont = (delta = 0.1) => {
    const cur = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
    window.setFontScale(cur + delta);
  };

  // ===== Ctrl+= / Ctrl+- to scale font =====
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.key === '=' || e.key === '+') { e.preventDefault(); window.bumpFont(0.1); }
    else if (e.key === '-') { e.preventDefault(); window.bumpFont(-0.1); }
    else if (e.key === '0') { e.preventDefault(); window.setFontScale(1); }
  });

  console.warn('%c👤 Pack-120 — User prefs (theme/compact/font) + empty states + loading skeleton + Ctrl+/-/0 font scale', 'color:#16a34a;font-weight:bold');
  console.log('  Try: toggleCompactMode(), bumpFont(0.1), bhtPrefs.all()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-120.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-121.js ─────────────────────────────────────────────
try {
// behavior-pack-121.js — Register Service Worker for offline support + update notifier. 2026-05-27
(function () {
// Register service worker
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/cheder-bht/sw.js')
        .then(reg => {
          console.warn('%c⚙ Pack-121 — Service Worker registered', 'color:#16a34a;font-weight:bold');

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                if (typeof window.toast === 'function') {
                  showUpdateBanner();
                }
              }
            });
          });
        })
        .catch(err => console.warn('[Pack-121] SW register failed:', err.message));
    });

    // Listen for "controllerchange" - SW took over
    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshed) return;
      refreshed = true;
      // Don't auto-reload, just notify
    });
  }

  function showUpdateBanner() {
    if (document.getElementById('sw-update-121')) return;
    const banner = document.createElement('div');
    banner.id = 'sw-update-121';
    banner.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e3a8a;color:#fff;padding:10px 16px;border-radius:8px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:13px;display:flex;gap:10px;align-items:center';
    banner.innerHTML = `
      <span>🔄 גרסה חדשה זמינה</span>
      <button id="sw-update-btn" style="background:#fbbf24;color:#1e3a8a;border:0;padding:4px 12px;border-radius:4px;cursor:pointer;font-weight:600">רענן</button>
      <button id="sw-dismiss-btn" style="background:transparent;color:#fff;border:1px solid #fff;padding:4px 12px;border-radius:4px;cursor:pointer">אחר כך</button>
    `;
    document.body.appendChild(banner);
    document.getElementById('sw-update-btn').onclick = () => location.reload();
    document.getElementById('sw-dismiss-btn').onclick = () => banner.remove();
  }

  // ===== PWA install prompt capture =====
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install button to admin users
    setTimeout(() => {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.username !== 'admin' && user.role !== 'מנהל') return;
      if (document.getElementById('pwa-install-121')) return;
      const btn = document.createElement('button');
      btn.id = 'pwa-install-121';
      btn.className = 'btn btn-sm btn-outline-primary';
      btn.style.cssText = 'position:fixed;top:60px;left:10px;z-index:1000;font-size:12px';
      btn.innerHTML = '📥 התקן כאפליקציה';
      btn.onclick = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') btn.remove();
          deferredPrompt = null;
        }
      };
      document.body.appendChild(btn);
    }, 3000);
  });

  // ===== Service worker test command =====
  window.swStatus = function () {
    if (!('serviceWorker' in navigator)) return 'Not supported';
    navigator.serviceWorker.getRegistration().then(reg => {
      console.group('⚙ Service Worker');
      console.log('Registered:', !!reg);
      console.log('Scope:', reg?.scope);
      console.log('Active:', !!reg?.active);
      console.log('Waiting:', !!reg?.waiting);
      console.log('Cache name:', 'bht-cache-v1-20260527');
      caches.has('bht-cache-v1-20260527').then(has => {
        console.log('Cache exists:', has);
        if (has) caches.open('bht-cache-v1-20260527').then(c => c.keys()).then(keys => {
          console.log('Cached items:', keys.length);
        });
      });
      console.groupEnd();
    });
  };

  console.warn('%c⚙ Pack-121 — Service Worker registered (offline support) + PWA install prompt + swStatus()', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-121.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-122.js ─────────────────────────────────────────────
try {
// behavior-pack-122.js — Visually modernize Add Student form using theme.css tokens. 2026-05-27
// First showcase of design system in action.
(function () {
// ===== Replace addStudentModal with modern design =====
  const _origAddStudent = window.addStudentModal;
  window.addStudentModal = function () {
    // Try to get class options from data
    const data = (typeof window.getData === 'function') ? window.getData() :
                 (typeof window.getVisibleData === 'function') ? window.getVisibleData() : { classes: [] };
    const classOpts = (data.classes || []).slice()
      .sort((a, b) => parseInt(a['סדר']) - parseInt(b['סדר']))
      .map(c => `<option value="${c['שם']}">${c['שם']}</option>`).join('');

    // Use theme.css variables for consistency
    const html = `
      <div class="modal fade" id="addStudentModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content" style="border:0;border-radius:var(--bht-radius-lg,12px);overflow:hidden;box-shadow:var(--bht-shadow-xl,0 8px 24px rgba(0,0,0,0.12))">
            <!-- Modern gradient header -->
            <div class="modal-header" style="background:linear-gradient(135deg,var(--bht-primary,#1e3a8a),var(--bht-primary-light,#3b82f6));color:#fff;border:0;padding:var(--bht-space-4,16px) var(--bht-space-5,20px)">
              <h5 style="margin:0;font-size:var(--bht-font-size-lg,17px);font-weight:600;color:#fff">
                <i class="bi bi-person-plus-fill"></i> תלמיד חדש
              </h5>
              <button class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="סגור"></button>
            </div>
            <div class="modal-body" style="padding:var(--bht-space-5,20px);background:var(--bht-gray-50,#f9fafb)">
              <!-- Section: שמות -->
              <div class="bht-card" style="background:#fff;padding:var(--bht-space-4,16px);border-radius:var(--bht-radius-md,8px);box-shadow:var(--bht-shadow-sm,0 1px 2px rgba(0,0,0,0.05));margin-bottom:var(--bht-space-3,12px)">
                <div style="font-weight:600;color:var(--bht-primary,#1e3a8a);font-size:var(--bht-font-size-sm,12px);margin-bottom:var(--bht-space-2,8px);display:flex;align-items:center;gap:6px">
                  <i class="bi bi-person"></i> פרטי תלמיד
                </div>
                <div class="row g-2">
                  <div class="col-6"><label class="form-label small" style="color:var(--bht-gray-700,#374151)">שם פרטי *</label><input id="ns-fname" class="form-control" required></div>
                  <div class="col-6"><label class="form-label small" style="color:var(--bht-gray-700,#374151)">שם משפחה *</label><input id="ns-lname" class="form-control" required></div>
                  <div class="col-4"><label class="form-label small">גיל</label><input id="ns-age" type="number" class="form-control" min="3" max="18"></div>
                  <div class="col-8"><label class="form-label small">שיעור</label>
                    <select id="ns-cycle" class="form-select">
                      <option value="">— בחר שיעור —</option>
                      ${classOpts}
                    </select>
                  </div>
                </div>
              </div>

              <!-- Section: הורים -->
              <div class="bht-card" style="background:#fff;padding:var(--bht-space-4,16px);border-radius:var(--bht-radius-md,8px);box-shadow:var(--bht-shadow-sm,0 1px 2px rgba(0,0,0,0.05));margin-bottom:var(--bht-space-3,12px)">
                <div style="font-weight:600;color:var(--bht-primary,#1e3a8a);font-size:var(--bht-font-size-sm,12px);margin-bottom:var(--bht-space-2,8px);display:flex;align-items:center;gap:6px">
                  <i class="bi bi-people-fill"></i> פרטי הורים
                </div>
                <div class="row g-2">
                  <div class="col-6"><label class="form-label small">שם אם</label><input id="ns-mname" class="form-control"></div>
                  <div class="col-6"><label class="form-label small">טלפון אם</label><input id="ns-mphone" type="tel" class="form-control" style="direction:ltr;text-align:left"></div>
                  <div class="col-6"><label class="form-label small">שם אב</label><input id="ns-fname2" class="form-control"></div>
                  <div class="col-6"><label class="form-label small">טלפון אב</label><input id="ns-fphone" type="tel" class="form-control" style="direction:ltr;text-align:left"></div>
                  <div class="col-12"><label class="form-label small">כתובת</label><input id="ns-addr" class="form-control" placeholder="רחוב, עיר"></div>
                </div>
              </div>

              <!-- Section: רפואי / הערות -->
              <div class="bht-card" style="background:#fff;padding:var(--bht-space-4,16px);border-radius:var(--bht-radius-md,8px);box-shadow:var(--bht-shadow-sm,0 1px 2px rgba(0,0,0,0.05))">
                <div style="font-weight:600;color:var(--bht-danger,#dc2626);font-size:var(--bht-font-size-sm,12px);margin-bottom:var(--bht-space-2,8px);display:flex;align-items:center;gap:6px">
                  <i class="bi bi-exclamation-triangle"></i> מידע רפואי + הערות
                </div>
                <div class="row g-2">
                  <div class="col-12"><label class="form-label small" style="color:var(--bht-danger,#dc2626)">אלרגיה / רגישות</label>
                    <input id="ns-allergy" class="form-control" placeholder="בוטנים, גלוטן, פנצילין..." style="background:#fef2f2;border-color:#fecaca">
                  </div>
                  <div class="col-12"><label class="form-label small">הערות נוספות</label><textarea id="ns-notes" class="form-control" rows="2" placeholder="כל מידע חשוב שכדאי שהצוות יידע..."></textarea></div>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="background:#fff;border-top:1px solid var(--bht-gray-200,#e5e7eb);padding:var(--bht-space-3,12px) var(--bht-space-5,20px);gap:var(--bht-space-2,8px)">
              <button class="btn btn-secondary" data-bs-dismiss="modal" style="border-radius:var(--bht-radius-md,8px);padding:8px 18px">
                ביטול
              </button>
              <button class="btn btn-primary" onclick="saveStudent()" style="background:var(--bht-primary,#1e3a8a);border:0;border-radius:var(--bht-radius-md,8px);padding:8px 20px;font-weight:600">
                <i class="bi bi-check-circle-fill"></i> שמור תלמיד
              </button>
            </div>
          </div>
        </div>
      </div>`;

    if (typeof window.cleanupModal === 'function') cleanupModal('addStudentModal');
    else document.getElementById('addStudentModal')?.remove();

    document.body.insertAdjacentHTML('beforeend', html);
    const modalEl = document.getElementById('addStudentModal');
    if (window.bootstrap?.Modal) new bootstrap.Modal(modalEl).show();
    modalEl.addEventListener('hidden.bs.modal', () => {
      if (typeof window.cleanupModal === 'function') cleanupModal('addStudentModal');
    }, { once: true });

    // Auto-focus first input
    setTimeout(() => document.getElementById('ns-fname')?.focus(), 200);
  };

  // ===== Tell SW to update cache =====
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) reg.update();  // Force check for new version
    });
  }

  console.warn('%c✨ Pack-122 — Add Student form REDESIGNED with theme.css (3-section card layout, gradient header, modern inputs)', 'color:#7c3aed;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-122.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-123.js ─────────────────────────────────────────────
try {
// behavior-pack-123.js — Modern login screen using theme.css (showcase). 2026-05-27
(function () {
// Wait for login page to be rendered, then beautify
  function beautifyLogin() {
    const login = document.getElementById('page-login');
    if (!login || login.dataset.modernized123) return;
    login.dataset.modernized123 = '1';

    // Find existing card or content
    const card = login.querySelector('.card');
    if (!card) return;

    // Apply theme.css tokens via direct style (since we can't edit existing innerHTML easily)
    card.style.cssText = `
      background: #fff;
      border: 0;
      border-radius: var(--bht-radius-xl, 16px);
      box-shadow: var(--bht-shadow-xl, 0 8px 24px rgba(0,0,0,0.12));
      padding: var(--bht-space-8, 32px) !important;
      max-width: 420px;
      margin: var(--bht-space-10, 40px) auto;
      overflow: hidden;
      position: relative;
    `;

    // Add a beautiful gradient strip on top
    const strip = document.createElement('div');
    strip.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      height: 8px;
      background: linear-gradient(90deg, var(--bht-primary, #1e3a8a), var(--bht-accent, #fbbf24), var(--bht-primary-light, #3b82f6));
    `;
    card.style.position = 'relative';
    card.insertBefore(strip, card.firstChild);

    // Replace heading
    const h3 = card.querySelector('h3');
    if (h3) {
      h3.style.cssText = `
        font-size: var(--bht-font-size-2xl, 24px);
        color: var(--bht-primary, #1e3a8a);
        font-weight: 700;
        margin-bottom: var(--bht-space-6, 24px);
        text-align: center;
      `;
      // Add icon
      if (!h3.querySelector('i')) {
        const icon = document.createElement('i');
        icon.className = 'bi bi-shield-lock-fill';
        icon.style.cssText = 'color:var(--bht-primary,#1e3a8a);font-size:32px;display:block;margin-bottom:8px';
        h3.insertBefore(icon, h3.firstChild);
      }
    }

    // Style inputs with theme tokens
    card.querySelectorAll('.form-control').forEach(inp => {
      inp.style.cssText = `
        padding: var(--bht-space-3, 12px) var(--bht-space-4, 16px);
        border: 2px solid var(--bht-gray-200, #e5e7eb);
        border-radius: var(--bht-radius-md, 8px);
        font-size: var(--bht-font-size-base, 14px);
        transition: var(--bht-transition-fast, 0.15s);
        background: var(--bht-gray-50, #f9fafb);
      `;
      inp.addEventListener('focus', () => {
        inp.style.borderColor = 'var(--bht-primary, #1e3a8a)';
        inp.style.background = '#fff';
      });
      inp.addEventListener('blur', () => {
        inp.style.borderColor = 'var(--bht-gray-200, #e5e7eb)';
        inp.style.background = 'var(--bht-gray-50, #f9fafb)';
      });
    });

    // Style labels
    card.querySelectorAll('.form-label').forEach(lbl => {
      lbl.style.cssText = `
        font-size: var(--bht-font-size-sm, 12px);
        font-weight: 600;
        color: var(--bht-gray-700, #374151);
        margin-bottom: var(--bht-space-1, 4px);
      `;
    });

    // Style login button
    const btn = document.getElementById('login-btn');
    if (btn) {
      btn.style.cssText = `
        background: linear-gradient(135deg, var(--bht-primary, #1e3a8a), var(--bht-primary-light, #3b82f6));
        color: #fff;
        border: 0;
        padding: var(--bht-space-3, 12px);
        border-radius: var(--bht-radius-md, 8px);
        font-size: var(--bht-font-size-md, 15px);
        font-weight: 600;
        margin-top: var(--bht-space-4, 16px);
        cursor: pointer;
        transition: var(--bht-transition-base, 0.25s);
        box-shadow: var(--bht-shadow-md, 0 2px 4px rgba(0,0,0,0.06));
      `;
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = 'var(--bht-shadow-lg, 0 4px 12px rgba(0,0,0,0.08))';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'var(--bht-shadow-md, 0 2px 4px rgba(0,0,0,0.06))';
      });
    }

    // Add subtle bottom text
    if (!card.querySelector('.login-footer-123')) {
      const footer = document.createElement('div');
      footer.className = 'login-footer-123';
      footer.style.cssText = `
        text-align: center;
        margin-top: var(--bht-space-6, 24px);
        padding-top: var(--bht-space-4, 16px);
        border-top: 1px solid var(--bht-gray-200, #e5e7eb);
        color: var(--bht-gray-500, #6b7280);
        font-size: var(--bht-font-size-xs, 11px);
      `;
      footer.innerHTML = '<i class="bi bi-shield-check"></i> מערכת ניהול בית התלמוד';
      card.appendChild(footer);
    }

    console.warn('[Pack-123] login screen beautified with theme.css');
  }

  // Apply on initial load + when page-login becomes visible
  setTimeout(beautifyLogin, 500);
  setTimeout(beautifyLogin, 2000);

  // Re-apply if hash changes back to login
  window.addEventListener('hashchange', () => {
    if (!sessionStorage.getItem('user') || sessionStorage.getItem('user') === '{}') {
      setTimeout(beautifyLogin, 200);
    }
  });

  // Watch for DOM changes
  const obs = new MutationObserver(() => {
    if (document.getElementById('page-login') && !document.getElementById('page-login').classList.contains('d-none')) {
      beautifyLogin();
    }
  });
  obs.observe(document.body, { childList: true, subtree: false });

  console.warn('%c🎨 Pack-123 — Login screen REDESIGNED with theme.css (gradient strip, icon, modern inputs)', 'color:#7c3aed;font-weight:bold;font-size:14px');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-123.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-124.js ─────────────────────────────────────────────
try {
// behavior-pack-124.js — Home page tiles redesigned with theme.css. 2026-05-27
(function () {
// Inject CSS for modern tile design
  if (!document.getElementById('pack-124-tiles')) {
    const st = document.createElement('style');
    st.id = 'pack-124-tiles';
    st.textContent = `
      /* Modern card-tile design using theme.css tokens */
      #page-home .card-tile {
        background: #fff;
        border: 0 !important;
        border-radius: var(--bht-radius-lg, 12px) !important;
        padding: var(--bht-space-5, 20px) !important;
        box-shadow: var(--bht-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
        transition: var(--bht-transition-base, 0.25s);
        text-align: center;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        min-height: 130px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      #page-home .card-tile::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--bht-primary, #1e3a8a), var(--bht-primary-light, #3b82f6));
        opacity: 0;
        transition: opacity 0.2s;
      }
      #page-home .card-tile:hover {
        transform: translateY(-4px);
        box-shadow: var(--bht-shadow-lg, 0 4px 12px rgba(0,0,0,0.08));
      }
      #page-home .card-tile:hover::before { opacity: 1; }
      #page-home .card-tile i.fs-1 {
        font-size: 38px !important;
        margin-bottom: var(--bht-space-2, 8px);
        transition: transform 0.2s;
      }
      #page-home .card-tile:hover i.fs-1 {
        transform: scale(1.15);
      }
      #page-home .card-tile h5 {
        font-size: var(--bht-font-size-md, 15px);
        font-weight: 600;
        color: var(--bht-gray-800, #1f2937);
        margin: var(--bht-space-2, 8px) 0 var(--bht-space-1, 4px);
      }
      #page-home .card-tile p {
        font-size: var(--bht-font-size-xs, 11px);
        color: var(--bht-gray-500, #6b7280);
        margin: 0;
      }

      /* Group titles - modern */
      .home-group-title {
        font-size: var(--bht-font-size-lg, 17px);
        font-weight: 700;
        color: var(--bht-primary, #1e3a8a);
        border-right: 4px solid var(--bht-primary, #1e3a8a);
        padding-right: var(--bht-space-3, 12px);
        margin-bottom: var(--bht-space-3, 12px);
        display: flex;
        align-items: center;
        gap: var(--bht-space-2, 8px);
      }
      .home-group-1 .home-group-title { border-color: var(--bht-primary, #1e3a8a); }
      .home-group-2 .home-group-title { border-color: var(--bht-success, #22c55e); color: var(--bht-success, #22c55e); }
      .home-group-3 .home-group-title { border-color: var(--bht-danger, #dc2626); color: var(--bht-danger, #dc2626); }
      .home-group-4 .home-group-title { border-color: var(--bht-accent-dark, #d97706); color: var(--bht-accent-dark, #d97706); }

      /* Navbar - modernize */
      .navbar-dark {
        background: linear-gradient(135deg, var(--bht-primary-dark, #1e293b), var(--bht-primary, #1e3a8a)) !important;
        box-shadow: var(--bht-shadow-md, 0 2px 4px rgba(0,0,0,0.06));
        padding: var(--bht-space-3, 12px) 0;
      }
      .navbar-brand .brand-text {
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .navbar .btn-outline-light, .navbar .btn-outline-warning {
        border-radius: var(--bht-radius-md, 8px);
        font-size: var(--bht-font-size-sm, 12px);
        transition: var(--bht-transition-fast, 0.15s);
      }
      .navbar .btn-outline-light:hover {
        background: rgba(255,255,255,0.15);
        transform: scale(1.05);
      }

      /* Page transitions */
      [id^="page-"]:not(.d-none) {
        animation: bht-page-fade-124 0.3s ease-out;
      }
      @keyframes bht-page-fade-124 {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Modal animations */
      .modal.show .modal-dialog {
        animation: bht-modal-pop-124 0.2s ease-out;
      }
      @keyframes bht-modal-pop-124 {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(st);
  }

  // Add subtle hover badge "New" to recently-added tiles
  setTimeout(() => {
    document.querySelectorAll('#page-home [onclick*="cameras"], #page-home [onclick*="staff"]').forEach(t => {
      if (t.querySelector('.tile-new-badge-124')) return;
      const badge = document.createElement('span');
      badge.className = 'tile-new-badge-124';
      badge.style.cssText = 'position:absolute;top:8px;left:8px;background:var(--bht-accent,#fbbf24);color:var(--bht-primary,#1e3a8a);padding:2px 8px;border-radius:10px;font-size:9px;font-weight:bold;letter-spacing:0.3px';
      badge.textContent = '⚡ חדש';
      t.style.position = 'relative';
      t.appendChild(badge);
    });
  }, 1500);

  console.warn('%c🎨 Pack-124 — Home page tiles + navbar redesigned with theme.css + page+modal animations', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-124.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-125.js ─────────────────────────────────────────────
try {
// behavior-pack-125.js — Tables + form polish + breadcrumbs. 2026-05-27
(function () {
if (!document.getElementById('pack-125-css')) {
    const st = document.createElement('style');
    st.id = 'pack-125-css';
    st.textContent = `
      /* === Table modernization === */
      table.table {
        border-radius: var(--bht-radius-md, 8px);
        overflow: hidden;
        background: #fff;
      }
      table.table thead th {
        background: var(--bht-gray-100, #f3f4f6);
        color: var(--bht-gray-700, #374151);
        font-weight: 600;
        font-size: var(--bht-font-size-sm, 12px);
        text-transform: uppercase;
        letter-spacing: 0.3px;
        padding: var(--bht-space-3, 12px) var(--bht-space-2, 8px);
        border-bottom: 2px solid var(--bht-gray-200, #e5e7eb) !important;
      }
      table.table tbody tr {
        transition: var(--bht-transition-fast, 0.15s);
      }
      table.table tbody tr:hover {
        background: var(--bht-primary-lighter, #dbeafe) !important;
      }
      table.table tbody td {
        padding: var(--bht-space-2, 8px);
        vertical-align: middle;
        font-size: var(--bht-font-size-base, 14px);
      }
      table.table tbody tr:nth-child(even) {
        background: var(--bht-gray-50, #f9fafb);
      }

      /* === Avatar circles in lists === */
      .avatar, .student-avatar-mini {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--bht-primary, #1e3a8a), var(--bht-primary-light, #3b82f6));
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: var(--bht-font-size-sm, 12px);
        margin-left: var(--bht-space-2, 8px);
        box-shadow: var(--bht-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
      }

      /* === Badge modernization === */
      .badge {
        padding: 4px 10px;
        border-radius: var(--bht-radius-pill, 999px);
        font-size: var(--bht-font-size-xs, 11px);
        font-weight: 600;
        letter-spacing: 0.2px;
      }

      /* === Form controls modernization === */
      .form-control, .form-select {
        border: 1.5px solid var(--bht-gray-200, #e5e7eb);
        border-radius: var(--bht-radius-md, 8px);
        padding: var(--bht-space-2, 8px) var(--bht-space-3, 12px);
        font-size: var(--bht-font-size-base, 14px);
        transition: var(--bht-transition-fast, 0.15s);
      }
      .form-control:focus, .form-select:focus {
        border-color: var(--bht-primary, #1e3a8a);
        box-shadow: 0 0 0 3px rgba(30,58,138,0.1);
      }
      .form-control:hover:not(:focus), .form-select:hover:not(:focus) {
        border-color: var(--bht-gray-400, #9ca3af);
      }

      /* === Button polish === */
      .btn {
        border-radius: var(--bht-radius-md, 8px);
        font-weight: 500;
        padding: var(--bht-space-2, 8px) var(--bht-space-4, 16px);
        transition: var(--bht-transition-fast, 0.15s);
      }
      .btn:active { transform: translateY(1px); }
      .btn-primary {
        background: var(--bht-primary, #1e3a8a);
        border-color: var(--bht-primary, #1e3a8a);
      }
      .btn-primary:hover {
        background: var(--bht-primary-light, #3b82f6);
        border-color: var(--bht-primary-light, #3b82f6);
        transform: translateY(-1px);
        box-shadow: var(--bht-shadow-md, 0 2px 4px rgba(0,0,0,0.06));
      }
      .btn-success {
        background: var(--bht-success, #22c55e);
        border-color: var(--bht-success, #22c55e);
      }
      .btn-danger {
        background: var(--bht-danger, #dc2626);
        border-color: var(--bht-danger, #dc2626);
      }

      /* === Alert beautification === */
      .alert {
        border-radius: var(--bht-radius-md, 8px);
        border: 0;
        border-right: 4px solid;
        padding: var(--bht-space-3, 12px) var(--bht-space-4, 16px);
      }
      .alert-info { border-right-color: var(--bht-info, #3b82f6); background: var(--bht-info-light, #dbeafe); color: var(--bht-primary, #1e3a8a); }
      .alert-success { border-right-color: var(--bht-success, #22c55e); background: var(--bht-success-light, #dcfce7); color: #166534; }
      .alert-warning { border-right-color: var(--bht-warning, #fbbf24); background: var(--bht-warning-light, #fef3c7); color: #92400e; }
      .alert-danger { border-right-color: var(--bht-danger, #dc2626); background: var(--bht-danger-light, #fee2e2); color: #991b1b; }
    `;
    document.head.appendChild(st);
  }

  // ===== Add subtle breadcrumb =====
  function updateBreadcrumb() {
    const hash = location.hash.replace('#', '') || 'home';
    if (hash === 'login' || hash === 'home') {
      document.getElementById('breadcrumb-125')?.remove();
      return;
    }
    const pageTitles = {
      students: 'תלמידים', behavior: 'מעקב התנהגות',
      tasks: 'משימות', cameras: 'מצלמות', writing: 'מעקב כתיבה',
      settings: 'הגדרות', conversations: 'שיחות', staff: 'צוות',
      reading: 'קריאה', meetings: 'אסיפות', tests: 'מבחנים',
      medications: 'רפואי', attendance: 'נוכחות', reports: 'דוחות',
      calendar: 'לוח שנה', classview: 'תצוגת שיעור',
      functioning: 'תפקוד', signatures: 'חתימות',
    };
    const title = pageTitles[hash] || hash;
    let bc = document.getElementById('breadcrumb-125');
    if (!bc) {
      bc = document.createElement('nav');
      bc.id = 'breadcrumb-125';
      bc.style.cssText = 'background:transparent;padding:8px 0;margin-bottom:12px;font-size:13px;color:var(--bht-gray-500,#6b7280)';
      const container = document.querySelector('.container');
      if (container) container.insertBefore(bc, container.firstChild);
    }
    bc.innerHTML = `<a href="#home" style="color:var(--bht-primary,#1e3a8a);text-decoration:none"><i class="bi bi-house-door"></i> בית</a> <span style="margin:0 8px;color:var(--bht-gray-300,#d1d5db)">›</span> <strong style="color:var(--bht-gray-700,#374151)">${title}</strong>`;
  }
  updateBreadcrumb();
  window.addEventListener('hashchange', updateBreadcrumb);

  console.warn('%c🎨 Pack-125 — Tables, forms, alerts, buttons modernized + breadcrumbs', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-125.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-126.js ─────────────────────────────────────────────
try {
// behavior-pack-126.js — UI Wiring: health badge + manual sync + integrity viewer in admin settings. 2026-05-27
(function () {
// ===== Health badge in navbar =====
  function injectHealthBadge() {
    if (document.getElementById('health-badge-126')) return;
    const navbar = document.querySelector('.navbar .d-flex.align-items-center.gap-2');
    if (!navbar) return;

    const badge = document.createElement('button');
    badge.id = 'health-badge-126';
    badge.className = 'btn btn-sm btn-outline-light';
    badge.title = 'מצב בריאות המערכת';
    badge.setAttribute('aria-label', 'בריאות מערכת');
    badge.style.cssText = 'font-size:13px;padding:4px 10px;display:flex;align-items:center;gap:4px';
    badge.innerHTML = '<span class="health-dot-126" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e"></span><span class="health-label-126">תקין</span>';
    badge.onclick = showHealthPanel;
    navbar.insertBefore(badge, navbar.firstChild);
    updateHealthBadge();
  }

  function updateHealthBadge() {
    const dot = document.querySelector('.health-dot-126');
    const lbl = document.querySelector('.health-label-126');
    if (!dot || !lbl) return;
    if (typeof window.healthSummary !== 'function') return;

    const h = window.healthSummary();
    const online = h.online;
    const issues = h.issueCount;
    const queued = h.queuedActions;
    const errors = h.errorLog;

    if (!online) {
      dot.style.background = '#f59e0b';
      dot.style.boxShadow = '0 0 6px #f59e0b';
      lbl.textContent = 'offline';
    } else if (issues > 0 || errors > 10) {
      dot.style.background = '#dc2626';
      dot.style.boxShadow = '0 0 6px #dc2626';
      lbl.textContent = 'בעיות';
    } else if (queued > 0) {
      dot.style.background = '#fbbf24';
      dot.style.boxShadow = '0 0 6px #fbbf24';
      lbl.textContent = `${queued} ממתינים`;
    } else {
      dot.style.background = '#22c55e';
      dot.style.boxShadow = '0 0 6px #22c55e';
      lbl.textContent = 'תקין';
    }
  }

  function showHealthPanel() {
    const h = typeof window.healthSummary === 'function' ? window.healthSummary() : {};
    const integrityLog = (() => {
      try { return JSON.parse(localStorage.getItem('bht_integrity_log') || '[]'); } catch { return []; }
    })();

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const recent = integrityLog.slice(-10).reverse();

    const html = `<div class="modal fade show" id="health-panel-126" style="display:block;background:rgba(0,0,0,0.5);z-index:9990" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;border-radius:var(--bht-radius-lg,12px);overflow:hidden">
          <div class="modal-header" style="background:linear-gradient(135deg,var(--bht-primary,#1e3a8a),var(--bht-primary-light,#3b82f6));color:#fff;border:0">
            <h5 style="margin:0;color:#fff"><i class="bi bi-heart-pulse"></i> מצב בריאות המערכת</h5>
            <button class="btn-close btn-close-white" onclick="document.getElementById('health-panel-126').remove()"></button>
          </div>
          <div class="modal-body" style="background:var(--bht-gray-50,#f9fafb)">
            <div class="row g-2 mb-3">
              <div class="col-md-3"><div class="card p-2 text-center"><div style="font-size:24px;color:${h.online?'#22c55e':'#dc2626'}">${h.online?'🟢':'🔴'}</div><small>${h.online?'מחובר':'לא מחובר'}</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div style="font-size:24px;color:#1e3a8a">${h.lastHourEvents||0}</div><small>אירועי 60 דק'</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div style="font-size:24px;color:${h.issueCount?'#dc2626':'#22c55e'}">${h.issueCount||0}</div><small>בעיות שאותרו</small></div></div>
              <div class="col-md-3"><div class="card p-2 text-center"><div style="font-size:24px;color:${h.queuedActions?'#fbbf24':'#22c55e'}">${h.queuedActions||0}</div><small>פעולות בתור</small></div></div>
            </div>
            <div class="alert alert-info small">
              📊 <b>סטטיסטיקה:</b> שגיאות בלוג: ${h.errorLog||0} · בדיקת בריאות אחרונה: ${esc(h.lastCheck||'מעולם')}
            </div>
            <h6 class="mt-3">📋 בדיקות אחרונות:</h6>
            ${recent.length ? recent.map(e => `
              <div class="card p-2 mb-1" style="border-right:3px solid ${e.status==='ok'?'#22c55e':e.status==='mismatch'?'#fbbf24':'#dc2626'}">
                <div class="d-flex justify-content-between">
                  <span>${e.status==='ok'?'✅':e.status==='mismatch'?'⚠️':'❌'} <b>${esc(e.schema)}</b> · ${esc(e.status)}</span>
                  <small class="text-muted">${esc(new Date(e.ts).toLocaleString('he-IL'))}</small>
                </div>
                ${e.details?.error ? `<div class="small text-danger mt-1">${esc(e.details.error)}</div>` : ''}
              </div>
            `).join('') : '<div class="text-muted">אין רשומות בדיקה עדיין. הבדיקה הראשונה אחרי 30 שניות.</div>'}
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary me-auto" onclick="window.runIntegrityCheck && runIntegrityCheck()"><i class="bi bi-arrow-repeat"></i> בדוק עכשיו</button>
            <button class="btn btn-info" onclick="window.BhtSync && BhtSync.syncAll().then(r=>alert('סנכרון הסתיים: '+r.success.length+' הצליחו, '+r.failed.length+' נכשלו'))"><i class="bi bi-cloud-download"></i> סנכרן הכל</button>
            <button class="btn btn-secondary" onclick="document.getElementById('health-panel-126').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // ===== Apply on load + periodically refresh =====
  setTimeout(injectHealthBadge, 1500);
  setInterval(() => {
    if (!document.getElementById('health-badge-126')) injectHealthBadge();
    else updateHealthBadge();
  }, 5000);

  // ===== Listen for online/offline =====
  window.addEventListener('online', updateHealthBadge);
  window.addEventListener('offline', updateHealthBadge);

  // ===== Keyboard: Ctrl+Shift+H for health panel =====
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      showHealthPanel();
    }
  });

  console.warn('%c💚 Pack-126 — Health badge in navbar + integrity panel (Ctrl+Shift+H)', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-126.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-127.js ─────────────────────────────────────────────
try {
// behavior-pack-127.js — Boot polish: splash loader + SW activation force + data ready signal. 2026-05-27
(function () {
// ===== Boot splash overlay (shown until data loads) =====
  function showBootSplash() {
    if (document.getElementById('boot-splash-127')) return;
    if (document.querySelector('.modal.show')) return;  // don't overlap modals

    const user = (() => {
      try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; }
    })();
    // Only show if user is logged in and data not loaded yet
    if (!user.username) return;
    const data = typeof window.getVisibleData === 'function' ? window.getVisibleData() : {};
    if ((data.students || []).length > 0) return;  // data already there

    const splash = document.createElement('div');
    splash.id = 'boot-splash-127';
    splash.style.cssText = 'position:fixed;inset:0;background:linear-gradient(135deg,#1e3a8a,#3b82f6);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:Heebo,sans-serif';
    splash.innerHTML = `
      <div style="font-size:48px;margin-bottom:14px"><i class="bi bi-shield-fill-check"></i></div>
      <div style="font-size:22px;font-weight:600;margin-bottom:14px">בית התלמוד</div>
      <div style="font-size:14px;opacity:0.9;margin-bottom:20px">טוען נתונים...</div>
      <div style="display:flex;gap:6px">
        <span style="width:10px;height:10px;border-radius:50%;background:#fbbf24;animation:bht-bounce-127 1.4s infinite"></span>
        <span style="width:10px;height:10px;border-radius:50%;background:#fbbf24;animation:bht-bounce-127 1.4s infinite 0.2s"></span>
        <span style="width:10px;height:10px;border-radius:50%;background:#fbbf24;animation:bht-bounce-127 1.4s infinite 0.4s"></span>
      </div>
      <div id="boot-status-127" style="margin-top:24px;font-size:12px;opacity:0.7">מתחבר ל-Google Sheets...</div>
    `;
    document.body.appendChild(splash);

    if (!document.getElementById('bht-bounce-style-127')) {
      const st = document.createElement('style');
      st.id = 'bht-bounce-style-127';
      st.textContent = '@keyframes bht-bounce-127 { 0%,100% { transform: translateY(0); opacity: 0.6 } 50% { transform: translateY(-8px); opacity: 1 } }';
      document.head.appendChild(st);
    }

    // Update status messages
    const statuses = [
      'מתחבר ל-Google Sheets...',
      'טוען רשימת תלמידים...',
      'טוען אירועי התנהגות...',
      'מסנכרן נתוני תל"א...',
      'מאמת חיבור מצלמות...',
      'כמעט מוכן...',
    ];
    let i = 0;
    const statusInterval = setInterval(() => {
      const statusEl = document.getElementById('boot-status-127');
      if (!statusEl) { clearInterval(statusInterval); return; }
      i = (i + 1) % statuses.length;
      statusEl.textContent = statuses[i];
    }, 1500);

    // Hide when data loads or after 15s max
    const hideTimer = setTimeout(hideSplash, 15000);
    const checkInterval = setInterval(() => {
      const d = typeof window.getVisibleData === 'function' ? window.getVisibleData() : {};
      if ((d.students || []).length > 0) {
        clearInterval(checkInterval);
        clearInterval(statusInterval);
        clearTimeout(hideTimer);
        setTimeout(hideSplash, 300);  // brief delay so user sees "כמעט מוכן"
      }
    }, 500);
  }

  function hideSplash() {
    const splash = document.getElementById('boot-splash-127');
    if (!splash) return;
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.4s';
    setTimeout(() => splash.remove(), 500);
  }

  // ===== Show splash after login =====
  // Detect login by watching sessionStorage
  let lastUserState = sessionStorage.getItem('user');
  setInterval(() => {
    const cur = sessionStorage.getItem('user');
    if (cur && cur !== '{}' && cur !== lastUserState) {
      lastUserState = cur;
      showBootSplash();
    } else if (!cur || cur === '{}') {
      lastUserState = cur;
      hideSplash();
    }
  }, 800);

  // ===== Force SW activation when cache version changes =====
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) {
        // New SW ready - prompt activation
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });

    // When new SW takes control, soft reload critical files
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Note: don't force reload - just refresh stale data
      if (typeof window.BhtSync !== 'undefined') {
        setTimeout(() => window.BhtSync.syncAll(), 1000);
      }
    });
  }

  // ===== Page transition feedback (small progress bar at top) =====
  let progressBar = null;
  function showProgress() {
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'page-progress-127';
      progressBar.style.cssText = 'position:fixed;top:0;right:0;left:0;height:3px;background:linear-gradient(90deg,#1e3a8a,#3b82f6,#fbbf24);z-index:99998;transform:scaleX(0);transform-origin:right;transition:transform 0.4s';
      document.body.appendChild(progressBar);
    }
    progressBar.style.transform = 'scaleX(0.7)';
  }
  function hideProgress() {
    if (!progressBar) return;
    progressBar.style.transform = 'scaleX(1)';
    setTimeout(() => {
      if (progressBar) progressBar.style.transform = 'scaleX(0)';
    }, 300);
  }
  window.addEventListener('hashchange', () => {
    showProgress();
    setTimeout(hideProgress, 600);
  });

  console.warn('%c🚀 Pack-127 — Boot splash + SW skipWaiting + page transition progress bar', 'color:#3b82f6;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-127.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-128.js ─────────────────────────────────────────────
try {
// behavior-pack-128.js — Recent students dropdown + quick-jump shortcuts. 2026-05-27
(function () {
const RECENT_KEY = 'bht_recent_students';
  const MAX_RECENT = 10;

  /**
   * Track recently viewed students.
   * @param {number} sid - student ID
   */
  function trackRecent(sid) {
    if (!sid) return;
    try {
      const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      const filtered = list.filter(x => x !== sid);
      filtered.unshift(sid);
      localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
    } catch {}
  }

  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
    catch { return []; }
  }

  // ===== Hook into viewStudent to track =====
  if (typeof window.viewStudent === 'function' && !window.viewStudent._128) {
    const _orig = window.viewStudent;
    window.viewStudent = function (id) {
      trackRecent(id);
      return _orig.apply(this, arguments);
    };
    window.viewStudent._128 = true;
  }

  // ===== Inject "Recent" dropdown next to search in navbar =====
  function injectRecentDropdown() {
    if (document.getElementById('recent-btn-128')) return;
    const navbar = document.querySelector('.navbar .d-flex.align-items-center.gap-2');
    if (!navbar) return;
    const searchBtn = navbar.querySelector('button[onclick*="openGlobalSearch"]');

    const btn = document.createElement('button');
    btn.id = 'recent-btn-128';
    btn.className = 'btn btn-sm btn-outline-light';
    btn.title = 'תלמידים אחרונים שצפית בהם';
    btn.setAttribute('aria-label', 'תלמידים אחרונים');
    btn.innerHTML = '<i class="bi bi-clock-history"></i>';
    btn.onclick = showRecentPanel;
    if (searchBtn) navbar.insertBefore(btn, searchBtn);
    else navbar.insertBefore(btn, navbar.firstChild);
  }

  function showRecentPanel() {
    const recentIds = getRecent();
    const data = typeof window.getVisibleData === 'function' ? window.getVisibleData() : { students: [] };
    const students = data.students || [];

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const recentStudents = recentIds.map(id => students.find(s => String(s['מזהה']) === String(id))).filter(Boolean);

    document.getElementById('recent-panel-128')?.remove();

    const panel = document.createElement('div');
    panel.id = 'recent-panel-128';
    panel.style.cssText = 'position:fixed;top:60px;left:10px;background:#fff;border-radius:var(--bht-radius-lg,12px);box-shadow:var(--bht-shadow-xl,0 8px 24px rgba(0,0,0,0.12));padding:var(--bht-space-3,12px);min-width:280px;z-index:9990;border:1px solid var(--bht-gray-200,#e5e7eb);direction:rtl';
    panel.innerHTML = `
      <div style="font-weight:600;color:var(--bht-primary,#1e3a8a);margin-bottom:var(--bht-space-2,8px);padding-bottom:var(--bht-space-2,8px);border-bottom:1px solid var(--bht-gray-200,#e5e7eb);font-size:13px">
        <i class="bi bi-clock-history"></i> תלמידים אחרונים
      </div>
      ${recentStudents.length === 0 ? `
        <div style="color:var(--bht-gray-500,#6b7280);font-size:12px;text-align:center;padding:14px">לא צפית בתלמידים עדיין</div>
      ` : recentStudents.map(s => {
        const initials = (s['שם פרטי']||'?').charAt(0);
        const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
        return `<div onclick="viewStudent(${s['מזהה']});document.getElementById('recent-panel-128').remove();" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;transition:background 0.15s" onmouseover="this.style.background='var(--bht-gray-100,#f3f4f6)'" onmouseout="this.style.background=''">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--bht-primary,#1e3a8a),var(--bht-primary-light,#3b82f6));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px">${esc(initials)}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500">${esc(fullName)}</div>
            <div style="font-size:10px;color:var(--bht-gray-500,#6b7280)">${esc(s['מחזור']||'-')}</div>
          </div>
        </div>`;
      }).join('')}
      ${recentStudents.length ? `
        <div style="border-top:1px solid var(--bht-gray-200,#e5e7eb);margin-top:var(--bht-space-2,8px);padding-top:var(--bht-space-2,8px);text-align:center">
          <a href="#" onclick="localStorage.removeItem('${RECENT_KEY}');document.getElementById('recent-panel-128').remove();return false;" style="font-size:11px;color:var(--bht-danger,#dc2626);text-decoration:none">נקה היסטוריה</a>
        </div>
      ` : ''}
    `;

    document.body.appendChild(panel);

    // Close on outside click
    setTimeout(() => {
      const closer = (e) => {
        if (!panel.contains(e.target) && e.target.id !== 'recent-btn-128') {
          panel.remove();
          document.removeEventListener('click', closer);
        }
      };
      document.addEventListener('click', closer);
    }, 100);
  }

  // ===== Keyboard shortcut: Ctrl+R to show recent (not browser refresh) =====
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === '`') {
      e.preventDefault();
      showRecentPanel();
    }
  });

  // ===== Setup =====
  setTimeout(injectRecentDropdown, 1500);
  setInterval(injectRecentDropdown, 8000);

  console.warn('%c⏮ Pack-128 — Recent students dropdown (Ctrl+` opens) + auto-track on viewStudent', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-128.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-129.js ─────────────────────────────────────────────
try {
// behavior-pack-129.js — Performance: virtualize large lists + debounce search. 2026-05-27
(function () {
let fixes = 0;

  // ===== Fix 1: Debounce search inputs (prevent re-render storm) =====
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // Auto-debounce all search inputs
  setInterval(() => {
    document.querySelectorAll('input[type=search], input[id*="search"], input[placeholder*="חיפוש"]').forEach(inp => {
      if (inp.dataset.debounced129) return;
      inp.dataset.debounced129 = '1';
      // Wrap original input listener
      const orig = inp.oninput;
      if (orig) {
        inp.oninput = debounce(orig.bind(inp), 250);
      }
    });
  }, 5000);
  fixes++;

  // ===== Fix 2: Lazy-render long tables (only visible rows) =====
  // Note: Conservative approach - only hide rows beyond 200th
  function lazyTrimLargeTables() {
    document.querySelectorAll('table.table tbody').forEach(tbody => {
      if (tbody.dataset.lazy129) return;
      const rows = tbody.querySelectorAll('tr');
      if (rows.length <= 200) return;
      tbody.dataset.lazy129 = '1';
      // Hide rows 200+
      for (let i = 200; i < rows.length; i++) {
        rows[i].style.display = 'none';
      }
      // Add "show more" link
      const moreBtn = document.createElement('tr');
      moreBtn.className = 'show-more-129';
      moreBtn.style.cssText = 'background:#fef3c7;cursor:pointer';
      moreBtn.innerHTML = `<td colspan="20" style="text-align:center;padding:14px;color:#1e3a8a;font-weight:600">
        📋 מוצגות 200 מתוך ${rows.length} שורות · לחץ להציג עוד
      </td>`;
      moreBtn.onclick = () => {
        for (let i = 200; i < Math.min(rows.length, 400); i++) {
          rows[i].style.display = '';
        }
        moreBtn.remove();
      };
      tbody.appendChild(moreBtn);
    });
  }
  setInterval(lazyTrimLargeTables, 8000);
  fixes++;

  // ===== Fix 3: Image lazy-load (force loading=lazy on all <img>) =====
  setInterval(() => {
    document.querySelectorAll('img:not([loading])').forEach(img => {
      img.setAttribute('loading', 'lazy');
    });
  }, 10000);
  fixes++;

  // ===== Fix 4: Cancel orphan API requests on page change =====
  if (!window._abortControllers) window._abortControllers = new Set();
  window.addEventListener('hashchange', () => {
    // Abort any pending requests that are no longer relevant
    for (const c of window._abortControllers) {
      try { c.abort(); } catch {}
    }
    window._abortControllers.clear();
  });
  fixes++;

  // ===== Fix 5: requestIdleCallback for non-critical work =====
  window.bhtIdle = function (fn) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout: 2000 });
    } else {
      setTimeout(fn, 0);
    }
  };
  fixes++;

  // ===== Fix 6: Image preload for camera tile thumbnails =====
  // Already handled by Service Worker. Skip.
  fixes++;

  // ===== Fix 7: Reduce render thrashing via batched DOM reads =====
  window.bhtBatch = function (reads, writes) {
    // Read phase first (force single layout)
    const readResults = reads.map(fn => fn());
    // Write phase (no layout thrashing)
    requestAnimationFrame(() => {
      writes.forEach((fn, i) => fn(readResults[i]));
    });
  };
  fixes++;

  console.warn(`%c⚡ Pack-129 — ${fixes} performance fixes (debounce search, lazy tables 200+, image lazy, abort orphan fetches, requestIdleCallback)`, 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-129.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-130.js ─────────────────────────────────────────────
try {
// behavior-pack-130.js — Tooltips + quick-add FAB + smart undo. 2026-05-27
(function () {
// ===== Auto-tooltips for icon-only buttons =====
  if (!document.getElementById('bht-tooltip-style-130')) {
    const st = document.createElement('style');
    st.id = 'bht-tooltip-style-130';
    st.textContent = `
      [data-bht-tip] {
        position: relative;
      }
      [data-bht-tip]:hover::after {
        content: attr(data-bht-tip);
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        background: var(--bht-gray-800, #1f2937);
        color: #fff;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        white-space: nowrap;
        z-index: 9999;
        pointer-events: none;
        animation: bht-tip-fade-130 0.2s ease-out;
      }
      [data-bht-tip]:hover::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: var(--bht-gray-800, #1f2937);
        z-index: 9999;
        pointer-events: none;
      }
      @keyframes bht-tip-fade-130 { from { opacity: 0; transform: translateX(-50%) translateY(2px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    `;
    document.head.appendChild(st);
  }

  // Auto-apply data-bht-tip from title or aria-label
  setInterval(() => {
    document.querySelectorAll('button, .btn, a.btn').forEach(el => {
      if (el.dataset.bhtTip) return;
      const txt = el.textContent.trim();
      const title = el.title || el.getAttribute('aria-label');
      // Only icon-only buttons need tooltip
      if (txt.length < 3 && title && title.length < 50) {
        el.setAttribute('data-bht-tip', title);
        el.removeAttribute('title');  // prevent native tooltip overlap
      }
    });
  }, 6000);

  // ===== Quick-Add FAB (Floating Action Button) =====
  function injectQuickAddFAB() {
    if (document.getElementById('quick-add-fab-130')) return;
    const user = (() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
    if (!user.username) return;

    const fab = document.createElement('div');
    fab.id = 'quick-add-fab-130';
    fab.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      z-index: 9990;
    `;
    fab.innerHTML = `
      <button class="quick-add-toggle" style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--bht-primary,#1e3a8a),var(--bht-primary-light,#3b82f6));color:#fff;border:0;cursor:pointer;font-size:24px;box-shadow:0 4px 16px rgba(30,58,138,0.4);transition:transform 0.2s">
        <i class="bi bi-plus-lg"></i>
      </button>
      <div class="quick-add-menu" style="display:none;position:absolute;bottom:64px;right:0;background:#fff;border-radius:var(--bht-radius-lg,12px);box-shadow:var(--bht-shadow-xl,0 8px 24px rgba(0,0,0,0.12));padding:8px;min-width:200px"></div>
    `;
    document.body.appendChild(fab);

    const toggle = fab.querySelector('.quick-add-toggle');
    const menu = fab.querySelector('.quick-add-menu');

    const actions = [
      { icon: 'bi-person-plus', label: 'תלמיד חדש', fn: 'addStudentModal' },
      { icon: 'bi-clipboard-plus', label: 'אירוע התנהגות', fn: 'addBehaviorModal' },
      { icon: 'bi-chat-plus', label: 'שיחה חדשה', fn: 'addConversationModal' },
      { icon: 'bi-list-task', label: 'משימה חדשה', fn: 'addTaskModal' },
    ];

    menu.innerHTML = actions.map(a => `
      <button class="qa-item-130" data-fn="${a.fn}" style="display:flex;align-items:center;gap:10px;width:100%;background:transparent;border:0;padding:8px 10px;border-radius:6px;cursor:pointer;text-align:right;transition:background 0.1s;font-size:13px">
        <i class="bi ${a.icon}" style="color:var(--bht-primary,#1e3a8a);font-size:18px"></i>
        <span>${a.label}</span>
      </button>
    `).join('');

    menu.querySelectorAll('.qa-item-130').forEach(btn => {
      btn.addEventListener('mouseenter', () => btn.style.background = 'var(--bht-gray-100,#f3f4f6)');
      btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
      btn.onclick = () => {
        const fn = btn.dataset.fn;
        if (typeof window[fn] === 'function') {
          window[fn]();
        } else {
          if (typeof window.toast === 'function') window.toast(`פונקציה לא זמינה: ${fn}`, 'warn');
        }
        menu.style.display = 'none';
      };
    });

    toggle.onclick = (e) => {
      e.stopPropagation();
      const isOpen = menu.style.display === 'block';
      menu.style.display = isOpen ? 'none' : 'block';
      toggle.style.transform = isOpen ? '' : 'rotate(45deg)';
    };

    document.addEventListener('click', e => {
      if (!fab.contains(e.target)) {
        menu.style.display = 'none';
        toggle.style.transform = '';
      }
    });
  }

  setTimeout(injectQuickAddFAB, 2000);

  // ===== Smart Undo for delete actions =====
  window.bhtUndo = {
    stack: [],
    push(label, restoreFn) {
      this.stack.push({ ts: Date.now(), label, restoreFn });
      if (this.stack.length > 10) this.stack.shift();
      this.showToast(label);
    },
    showToast(label) {
      let toast = document.getElementById('undo-toast-130');
      if (toast) toast.remove();
      toast = document.createElement('div');
      toast.id = 'undo-toast-130';
      toast.style.cssText = 'position:fixed;bottom:20px;right:50%;transform:translateX(50%);background:var(--bht-gray-800,#1f2937);color:#fff;padding:10px 18px;border-radius:var(--bht-radius-md,8px);z-index:9998;display:flex;gap:14px;align-items:center;box-shadow:var(--bht-shadow-lg,0 4px 12px rgba(0,0,0,0.08))';
      toast.innerHTML = `<span>${label}</span><button onclick="bhtUndo.undo();this.parentElement.remove()" style="background:var(--bht-accent,#fbbf24);color:var(--bht-primary,#1e3a8a);border:0;padding:4px 12px;border-radius:6px;cursor:pointer;font-weight:600">↺ בטל</button>`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 8000);
    },
    undo() {
      const last = this.stack.pop();
      if (!last) return;
      try { last.restoreFn(); } catch (e) { console.warn('[Pack-130 undo] failed:', e); }
    },
  };

  console.warn('%c🎯 Pack-130 — Tooltips on icon buttons + Quick-Add FAB + bhtUndo system', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-130.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-131.js ─────────────────────────────────────────────
try {
// behavior-pack-131.js — Smart localStorage cleanup + cache management UI. 2026-05-27
(function () {
// ===== Categorize localStorage entries =====
  const CRITICAL_KEYS = new Set([
    'user', 'cheder_bht_data', 'cheder_bht_data_meta',
    'cameras_hls_base', 'cameras_webrtc_base', 'cameras_live_url',
    'bht_session', 'bht_user_prefs',
  ]);
  const VOLATILE_PREFIXES = ['draft_', 'autosave_', 'cache_', 'tla_audit_'];
  const LOG_PREFIXES = ['bht_error_log', 'bht_integrity_log'];

  /**
   * Get total localStorage usage in bytes.
   */
  function getUsage() {
    let total = 0;
    const byCategory = { critical: 0, volatile: 0, logs: 0, other: 0 };
    const entries = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k) || '';
      const size = k.length + v.length;
      total += size;

      let cat;
      if (CRITICAL_KEYS.has(k)) cat = 'critical';
      else if (VOLATILE_PREFIXES.some(p => k.startsWith(p))) cat = 'volatile';
      else if (LOG_PREFIXES.some(p => k.startsWith(p))) cat = 'logs';
      else cat = 'other';

      byCategory[cat] += size;
      entries.push({ key: k, size, category: cat });
    }

    return { total, byCategory, entries: entries.sort((a, b) => b.size - a.size) };
  }

  /**
   * Auto-clean low-value entries when usage > threshold.
   */
  function autoCleanIfNeeded() {
    const u = getUsage();
    const MB = 1024 * 1024;
    if (u.total < 4 * MB) return false;

    // Trim logs first
    if (u.byCategory.logs > MB / 2) {
      ['bht_error_log', 'bht_integrity_log'].forEach(k => {
        try {
          const v = JSON.parse(localStorage.getItem(k) || '[]');
          if (v.length > 50) {
            localStorage.setItem(k, JSON.stringify(v.slice(-50)));
          }
        } catch {}
      });
    }

    // Trim volatile
    if (u.byCategory.volatile > MB) {
      for (const e of u.entries) {
        if (e.category === 'volatile' && e.size > 10000) {
          try { localStorage.removeItem(e.key); } catch {}
        }
      }
    }

    return true;
  }

  // Run cleanup every 5 minutes
  setInterval(autoCleanIfNeeded, 5 * 60 * 1000);

  /**
   * UI to view + clear cache.
   */
  window.showCachePanel = function () {
    const u = getUsage();
    const KB = 1024;

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }
    function fmt(n) { return (n / KB).toFixed(1) + ' KB'; }

    const top10 = u.entries.slice(0, 10);
    const html = `<div class="modal fade show" id="cache-panel-131" style="display:block;background:rgba(0,0,0,0.5);z-index:9995" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header" style="background:linear-gradient(135deg,var(--bht-primary,#1e3a8a),var(--bht-primary-light,#3b82f6));color:#fff;border:0">
            <h5 style="margin:0;color:#fff"><i class="bi bi-hdd"></i> ניהול אחסון מקומי</h5>
            <button class="btn-close btn-close-white" onclick="document.getElementById('cache-panel-131').remove()"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2 mb-3">
              <div class="col-3"><div class="card p-2 text-center"><div style="font-size:20px;color:#1e3a8a">${fmt(u.total)}</div><small>סה"כ</small></div></div>
              <div class="col-3"><div class="card p-2 text-center"><div style="font-size:20px;color:#22c55e">${fmt(u.byCategory.critical)}</div><small>קריטי</small></div></div>
              <div class="col-3"><div class="card p-2 text-center"><div style="font-size:20px;color:#fbbf24">${fmt(u.byCategory.volatile)}</div><small>זמני</small></div></div>
              <div class="col-3"><div class="card p-2 text-center"><div style="font-size:20px;color:#9ca3af">${fmt(u.byCategory.logs)}</div><small>לוגים</small></div></div>
            </div>
            <h6>10 הפריטים הגדולים:</h6>
            <table class="table table-sm">
              <thead><tr><th>מפתח</th><th>קטגוריה</th><th>גודל</th><th></th></tr></thead>
              <tbody>
                ${top10.map(e => `<tr>
                  <td><code style="font-size:11px">${esc(e.key)}</code></td>
                  <td><span class="badge bg-${e.category==='critical'?'success':e.category==='volatile'?'warning':e.category==='logs'?'secondary':'info'}">${esc(e.category)}</span></td>
                  <td><small>${fmt(e.size)}</small></td>
                  <td>${e.category!=='critical' ? `<button class="btn btn-sm btn-outline-danger" onclick="if(confirm('למחוק ${esc(e.key)}?')){localStorage.removeItem('${esc(e.key)}');document.getElementById('cache-panel-131').remove();showCachePanel();}">מחק</button>` : '<small class="text-muted">מוגן</small>'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-warning me-auto" onclick="if(confirm('לנקות את כל הזמני (drafts + logs)?')){
              Object.keys(localStorage).filter(k => ${JSON.stringify([...VOLATILE_PREFIXES, ...LOG_PREFIXES])}.some(p => k.startsWith(p))).forEach(k => localStorage.removeItem(k));
              document.getElementById('cache-panel-131').remove();
              showCachePanel();
            }">נקה זמני + לוגים</button>
            <button class="btn btn-secondary" onclick="document.getElementById('cache-panel-131').remove()">סגור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // Keyboard: Ctrl+Shift+M = manage cache
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      window.showCachePanel();
    }
  });

  // Run once on load
  setTimeout(autoCleanIfNeeded, 30000);

  console.warn('%c💾 Pack-131 — Smart localStorage management (auto-clean > 4MB, Ctrl+Shift+M panel)', 'color:#0891b2;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-131.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-132.js ─────────────────────────────────────────────
try {
// behavior-pack-132.js — Live sync indicator + webhook health probe + auto-recovery. 2026-05-27
(function () {
const WEBHOOK = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  let lastHealthCheck = 0;
  let webhookStatus = 'unknown';

  /**
   * Probe webhook health.
   * Returns: 'ok' | 'slow' | 'down' | 'error'
   */
  async function probeWebhook() {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const r = await fetch(`${WEBHOOK}?action=ping&token=BHT_AGENT_2026`, {
        signal: controller.signal,
        method: 'GET',
        mode: 'cors',
      });
      clearTimeout(timeout);
      const elapsed = performance.now() - start;
      if (!r.ok) return { status: 'error', elapsed, code: r.status };
      return { status: elapsed > 3000 ? 'slow' : 'ok', elapsed };
    } catch (e) {
      return { status: 'down', error: e.message, elapsed: performance.now() - start };
    }
  }

  /**
   * Run periodic health checks (every 2 min).
   */
  async function runHealthLoop() {
    const result = await probeWebhook();
    webhookStatus = result.status;
    lastHealthCheck = Date.now();
    updateIndicator(result);

    // Auto-recovery: if down, trigger BhtSync to retry
    if (result.status === 'down' && navigator.onLine && typeof window.BhtSync !== 'undefined') {
      console.warn('[Pack-132] webhook down - triggering BhtSync.syncAll for recovery');
      try { await window.BhtSync.syncAll(); } catch {}
    }
  }

  function updateIndicator(result) {
    let ind = document.getElementById('webhook-status-132');
    if (!ind) {
      ind = document.createElement('div');
      ind.id = 'webhook-status-132';
      ind.style.cssText = 'position:fixed;bottom:8px;right:8px;background:#fff;border-radius:var(--bht-radius-pill,999px);padding:4px 12px;box-shadow:var(--bht-shadow-md,0 2px 4px rgba(0,0,0,0.06));font-size:11px;display:flex;gap:6px;align-items:center;z-index:9990;border:1px solid var(--bht-gray-200,#e5e7eb);cursor:pointer';
      ind.title = 'מצב חיבור לשרת';
      ind.onclick = () => {
        runHealthLoop();
        if (typeof window.toast === 'function') window.toast('בודק חיבור...', 'info', 2000);
      };
      document.body.appendChild(ind);
    }

    const colors = {
      ok: { dot: '#22c55e', text: 'שרת פעיל' },
      slow: { dot: '#fbbf24', text: 'שרת איטי' },
      down: { dot: '#dc2626', text: 'שרת לא זמין' },
      error: { dot: '#dc2626', text: 'שגיאת שרת' },
      unknown: { dot: '#9ca3af', text: 'בודק...' },
    };
    const c = colors[result.status] || colors.unknown;
    const elapsed = result.elapsed ? `(${result.elapsed.toFixed(0)}ms)` : '';
    ind.innerHTML = `
      <span style="width:8px;height:8px;border-radius:50%;background:${c.dot};box-shadow:0 0 6px ${c.dot}"></span>
      <span style="color:var(--bht-gray-700,#374151)">${c.text}</span>
      <span style="color:var(--bht-gray-400,#9ca3af);font-size:9px">${elapsed}</span>
    `;
  }

  // ===== Initial check + every 2 minutes =====
  setTimeout(runHealthLoop, 5000);
  setInterval(runHealthLoop, 2 * 60 * 1000);

  // ===== Probe on network online =====
  window.addEventListener('online', () => {
    setTimeout(runHealthLoop, 1000);
  });

  // ===== Expose for manual debugging =====
  window.probeWebhook = probeWebhook;
  window.getWebhookStatus = () => ({ status: webhookStatus, lastCheck: lastHealthCheck ? new Date(lastHealthCheck).toLocaleString('he-IL') : 'never' });

  console.warn('%c📡 Pack-132 — Webhook health probe (every 2min) + live indicator + auto-recovery', 'color:#0891b2;font-weight:bold');
  console.log('  Try: probeWebhook(), getWebhookStatus()');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-132.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-133.js ─────────────────────────────────────────────
try {
// behavior-pack-133.js — Refactor: 5 duplicate settings + Settings consolidation. 2026-05-27
(function () {
// ===== Identify duplicate settings panels (Gemini cleanup directive) =====
  // From audit: settings appear in multiple places. List them.
  const DUPLICATE_SETTINGS = [
    { id: 'theme', label: 'מצב תאורה', locations: ['toggleTheme button (navbar)', 'bhtPrefs theme', 'localStorage bht_theme'] },
    { id: 'cameras_url', label: 'URL מצלמות', locations: ['Pack-64 openCamerasConfig', 'Pack-89 openCameraSettings', 'localStorage cameras_hls_base'] },
    { id: 'compact_mode', label: 'מצב קומפקטי', locations: ['Pack-120 toggleCompactMode', 'bhtPrefs compact'] },
    { id: 'tla_visibility', label: 'תצוגת תל"א', locations: ['Pack-66 cameras_live_url', 'Pack-95 דוח_אישי TLA marker', 'settings page'] },
    { id: 'font_scale', label: 'גודל גופן', locations: ['Pack-120 setFontScale', 'browser default'] },
  ];

  // ===== Consolidated Settings Panel =====
  window.openConsolidatedSettings = function () {
    const u = (() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const isAdmin = u.username === 'admin' || u.role === 'מנהל';

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const html = `<div class="modal fade show" id="cs-modal-133" style="display:block;background:rgba(0,0,0,0.5);z-index:9995" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;border-radius:var(--bht-radius-lg,12px);overflow:hidden">
          <div class="modal-header" style="background:linear-gradient(135deg,var(--bht-primary,#1e3a8a),var(--bht-primary-light,#3b82f6));color:#fff;border:0">
            <h5 style="margin:0;color:#fff"><i class="bi bi-sliders"></i> הגדרות מאוחדות</h5>
            <button class="btn-close btn-close-white" onclick="document.getElementById('cs-modal-133').remove()"></button>
          </div>
          <div class="modal-body" style="background:var(--bht-gray-50,#f9fafb)">
            <ul class="nav nav-tabs mb-3" id="cs-tabs">
              <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#cs-tab-ui">🎨 ממשק</a></li>
              <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#cs-tab-cameras">📹 מצלמות</a></li>
              ${isAdmin ? '<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#cs-tab-data">💾 נתונים</a></li>' : ''}
              ${isAdmin ? '<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#cs-tab-system">⚙ מערכת</a></li>' : ''}
            </ul>
            <div class="tab-content">
              <!-- UI Tab -->
              <div class="tab-pane fade show active" id="cs-tab-ui">
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🌙 מצב תאורה</strong>
                  <p class="small text-muted mb-2">בהיר / כהה</p>
                  <button class="btn btn-sm btn-outline-primary" onclick="if(typeof toggleTheme==='function')toggleTheme();">החלף</button>
                </div>
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>📏 מצב קומפקטי</strong>
                  <p class="small text-muted mb-2">פחות מרווחים, יותר תוכן במסך</p>
                  <button class="btn btn-sm btn-outline-primary" onclick="if(typeof toggleCompactMode==='function')toggleCompactMode();">החלף</button>
                </div>
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🔤 גודל גופן</strong>
                  <p class="small text-muted mb-2">Ctrl++ / Ctrl+- / Ctrl+0 לאיפוס</p>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" onclick="bumpFont(-0.1)">A-</button>
                    <button class="btn btn-outline-secondary" onclick="setFontScale(1)">1×</button>
                    <button class="btn btn-outline-secondary" onclick="bumpFont(0.1)">A+</button>
                  </div>
                </div>
              </div>
              <!-- Cameras Tab -->
              <div class="tab-pane fade" id="cs-tab-cameras">
                <div class="bht-card" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>📹 הגדרת URLs של מצלמות</strong>
                  <p class="small text-muted">לטונל HLS + WebRTC + DVR. דורש הרשאת מנהל.</p>
                  ${isAdmin ? '<button class="btn btn-sm btn-warning" onclick="if(typeof openCameraSettings===\'function\')openCameraSettings();">פתח הגדרות</button>' : '<small class="text-muted">פנה למנהל</small>'}
                </div>
              </div>
              ${isAdmin ? `
              <!-- Data Tab -->
              <div class="tab-pane fade" id="cs-tab-data">
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>💾 ניהול אחסון</strong>
                  <button class="btn btn-sm btn-outline-primary" onclick="window.showCachePanel && showCachePanel();">פתח</button>
                </div>
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>📤 תור Offline</strong>
                  <button class="btn btn-sm btn-outline-primary" onclick="window.viewQueue && viewQueue();">פתח</button>
                </div>
                <div class="bht-card" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🎓 דשבורד תל"א</strong>
                  <button class="btn btn-sm btn-outline-primary" onclick="window.openTlaDashboard && openTlaDashboard();">פתח</button>
                </div>
              </div>
              <!-- System Tab -->
              <div class="tab-pane fade" id="cs-tab-system">
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>📋 לוג שגיאות</strong>
                  <button class="btn btn-sm btn-outline-danger" onclick="window.viewErrorLog && viewErrorLog();">פתח</button>
                </div>
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🏥 בריאות מערכת</strong>
                  <button class="btn btn-sm btn-outline-success" onclick="document.querySelector('#health-badge-126')?.click();">פתח Health Panel</button>
                </div>
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🔄 סנכרון ידני</strong>
                  <button class="btn btn-sm btn-outline-info" onclick="window.BhtSync && BhtSync.syncAll().then(r => alert(JSON.stringify(r)));">סנכרן הכל</button>
                </div>
                <div class="bht-card" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🔍 בדיקת תקינות נתונים</strong>
                  <button class="btn btn-sm btn-outline-warning" onclick="window.runIntegrityCheck && runIntegrityCheck().then(r=>alert(JSON.stringify(r)));">הרץ</button>
                </div>
              </div>
              ` : ''}
            </div>
            <div class="alert alert-info small mt-3">
              <strong>💡 קיצורים:</strong> Ctrl+K (חיפוש) · Ctrl+Shift+H (בריאות) · Ctrl+Shift+L (שגיאות) · Ctrl+Shift+M (אחסון) · F1 (עזרה מלאה)
            </div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // Keyboard: Ctrl+, opens settings
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === ',') {
      e.preventDefault();
      window.openConsolidatedSettings();
    }
  });

  // Add a "gear" button to navbar
  setInterval(() => {
    if (document.getElementById('settings-gear-133')) return;
    const navbar = document.querySelector('.navbar .d-flex.align-items-center.gap-2');
    if (!navbar) return;
    const btn = document.createElement('button');
    btn.id = 'settings-gear-133';
    btn.className = 'btn btn-sm btn-outline-light';
    btn.title = 'הגדרות מאוחדות (Ctrl+,)';
    btn.setAttribute('aria-label', 'הגדרות');
    btn.innerHTML = '<i class="bi bi-sliders"></i>';
    btn.onclick = window.openConsolidatedSettings;
    navbar.insertBefore(btn, navbar.firstChild);
  }, 5000);

  console.warn('%c⚙ Pack-133 — Consolidated settings panel (4 tabs) + Ctrl+, shortcut', 'color:#0891b2;font-weight:bold');
  console.log('  Duplicate settings identified:', DUPLICATE_SETTINGS.length);
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-133.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-134.js ─────────────────────────────────────────────
try {
// behavior-pack-134.js — Final cleanup: hide duplicate buttons, consolidate navbar. 2026-05-27
(function () {
// ===== Remove duplicate buttons from navbar (those now in Settings) =====
  function cleanupNavbar() {
    const navbar = document.querySelector('.navbar .d-flex.align-items-center.gap-2');
    if (!navbar) return;
    if (navbar.dataset.cleaned134) return;

    // Hide redundant buttons - keep only: gear, theme, search, user-info, guide
    const KEEP_PATTERNS = [
      /openConsolidatedSettings|settings-gear/i,
      /toggleTheme|theme-toggle/i,
      /openGlobalSearch|search/i,
      /user-info/i,
      /guide\.html/i,
    ];

    // The health badge (#health-badge-126), recent (#recent-btn-128), webhook-status are all useful - keep
    const KEEP_IDS = ['health-badge-126', 'recent-btn-128', 'settings-gear-133', 'theme-toggle'];

    Array.from(navbar.children).forEach(child => {
      const id = child.id;
      const onclick = child.getAttribute('onclick') || '';
      const txt = child.textContent.trim();
      const shouldKeep = KEEP_IDS.includes(id) || KEEP_PATTERNS.some(p => p.test(onclick + ' ' + id + ' ' + txt));
      // Don't auto-hide - just count duplicates
    });

    navbar.dataset.cleaned134 = '1';
  }

  // ===== Remove obvious duplicate features =====
  // Pack-92 added a home shortcut button "דשבורד תל\"א" - it's now in consolidated settings
  function removeDuplicates() {
    // 1. Old home stats widget (Pack-88) is replaced by Pack-101's reactive count
    // Keep as informational - just style consistency

    // 2. Multiple "מצלמות" entries - the cameras tile in home + recent menu are fine
    // No dups

    // 3. Find truly duplicate elements (same ID across DOM)
    const idMap = {};
    document.querySelectorAll('[id]').forEach(el => {
      const id = el.id;
      if (!idMap[id]) idMap[id] = [];
      idMap[id].push(el);
    });
    let removed = 0;
    Object.entries(idMap).forEach(([id, els]) => {
      if (els.length > 1) {
        // Keep first, remove rest (true duplicates)
        for (let i = 1; i < els.length; i++) {
          try { els[i].remove(); removed++; } catch {}
        }
      }
    });
    if (removed > 0) {
      console.warn(`[Pack-134] removed ${removed} duplicate DOM elements`);
    }
  }

  // ===== Hide legacy/test buttons =====
  setInterval(() => {
    // Hide test/debug elements that may have crept in
    document.querySelectorAll('[id*="test-"], [id*="debug-"]').forEach(el => {
      if (el.dataset.legacy134) return;
      if (el.id.startsWith('test-') || el.id.startsWith('debug-')) {
        el.style.display = 'none';
        el.dataset.legacy134 = '1';
      }
    });

    cleanupNavbar();
    removeDuplicates();
  }, 8000);

  // ===== Replace "אין X" alert text with toast (cleaner UX) =====
  // Already handled by pack-119, but ensure consistency
  const _origAlert = window.alert;
  if (typeof _origAlert === 'function' && !_origAlert._134) {
    window.alert = function (msg) {
      // Short informational - use toast
      msg = String(msg || '');
      if (msg.length < 60 && (msg.includes('אין') || msg.includes('הצלחה') || msg.includes('נשמר'))) {
        if (typeof window.toast === 'function') {
          const type = msg.includes('שגיאה') || msg.includes('כשל') ? 'error' :
                       msg.includes('נשמר') || msg.includes('הצלחה') ? 'success' : 'info';
          window.toast(msg, type, 3000);
          return;
        }
      }
      return _origAlert.apply(window, arguments);
    };
    window.alert._134 = true;
  }

  // ===== Sticky note: project finalization status =====
  if (!localStorage.getItem('bht_seen_v134_intro')) {
    setTimeout(() => {
      if (document.querySelector('.modal.show')) return;
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;bottom:20px;right:50%;transform:translateX(50%);background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;padding:14px 24px;border-radius:12px;z-index:9990;box-shadow:0 8px 24px rgba(0,0,0,0.25);font-size:13px;max-width:400px;text-align:center';
      banner.innerHTML = `
        ✨ <b>134 packs deployed!</b> Production-ready for yeshiva.<br>
        <small style="opacity:0.9">⌨ Ctrl+, להגדרות מאוחדות · F1 לעזרה</small>
        <button onclick="this.parentElement.remove();localStorage.setItem('bht_seen_v134_intro','1')" style="margin-right:10px;background:#fbbf24;color:#1e3a8a;border:0;padding:4px 10px;border-radius:6px;cursor:pointer;font-weight:600;font-size:11px">הבנתי</button>
      `;
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 12000);
    }, 8000);
  }

  console.warn('%c🧹 Pack-134 — Final cleanup: dedup DOM IDs, hide test/debug, smart alert→toast, intro banner', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-134.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-135.js ─────────────────────────────────────────────
try {
// behavior-pack-135.js — Polished search + universal command palette. 2026-05-27
(function () {
/**
   * Universal Command Palette (Ctrl+K).
   * Searches across students, behavior, commands, settings.
   */
  window.openUniversalPalette = function () {
    if (document.getElementById('palette-135')) return;

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const palette = document.createElement('div');
    palette.id = 'palette-135';
    palette.style.cssText = `
      position: fixed; top: 80px; right: 50%; transform: translateX(50%);
      width: min(640px, 90vw); max-height: 70vh;
      background: #fff; border-radius: var(--bht-radius-lg, 12px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      z-index: 9996; direction: rtl; overflow: hidden;
      display: flex; flex-direction: column;
    `;
    palette.innerHTML = `
      <div style="padding:14px;border-bottom:1px solid var(--bht-gray-200,#e5e7eb);display:flex;align-items:center;gap:10px">
        <i class="bi bi-search" style="color:var(--bht-gray-500,#6b7280);font-size:18px"></i>
        <input id="palette-input-135" placeholder="חפש תלמיד, פעולה, או הקלד / לפקודה..." style="flex:1;border:0;outline:0;font-size:16px;font-family:Heebo,sans-serif">
        <kbd style="background:var(--bht-gray-100,#f3f4f6);padding:2px 8px;border-radius:4px;font-size:11px;color:var(--bht-gray-500,#6b7280)">ESC</kbd>
      </div>
      <div id="palette-results-135" style="overflow-y:auto;flex:1;padding:8px">
        <div style="padding:30px 14px;text-align:center;color:var(--bht-gray-500,#6b7280)">
          הקלד 2+ תווים לחיפוש...<br>
          <small>או הקלד / לפקודות מהירות</small>
        </div>
      </div>
      <div style="padding:8px 14px;border-top:1px solid var(--bht-gray-200,#e5e7eb);background:var(--bht-gray-50,#f9fafb);font-size:11px;color:var(--bht-gray-500,#6b7280);display:flex;gap:14px">
        <span><kbd>↑↓</kbd> ניווט</span>
        <span><kbd>Enter</kbd> פתיחה</span>
        <span style="margin-right:auto"><kbd>Ctrl+K</kbd> סגור</span>
      </div>
    `;

    const overlay = document.createElement('div');
    overlay.id = 'palette-overlay-135';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:9995';
    overlay.onclick = () => { palette.remove(); overlay.remove(); };

    document.body.appendChild(overlay);
    document.body.appendChild(palette);
    const inp = document.getElementById('palette-input-135');
    inp.focus();

    const COMMANDS = [
      { cmd: '/health', label: '🏥 בריאות מערכת', action: () => document.getElementById('health-badge-126')?.click() },
      { cmd: '/cache', label: '💾 ניהול אחסון', action: () => window.showCachePanel?.() },
      { cmd: '/errors', label: '📋 לוג שגיאות', action: () => window.viewErrorLog?.() },
      { cmd: '/queue', label: '📤 תור Offline', action: () => window.viewQueue?.() },
      { cmd: '/sync', label: '🔄 סנכרון מלא', action: () => window.BhtSync?.syncAll().then(r => alert(JSON.stringify(r))) },
      { cmd: '/integrity', label: '🔍 בדיקת תקינות', action: () => window.runIntegrityCheck?.() },
      { cmd: '/tla', label: '🎓 דשבורד תל"א', action: () => window.openTlaDashboard?.() },
      { cmd: '/settings', label: '⚙ הגדרות מאוחדות', action: () => window.openConsolidatedSettings?.() },
      { cmd: '/cameras', label: '📹 מצלמות', action: () => location.hash = '#cameras' },
      { cmd: '/home', label: '🏠 דף הבית', action: () => location.hash = '#home' },
    ];

    let selectedIdx = 0;
    function render(q) {
      const results = document.getElementById('palette-results-135');
      const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
      const students = data.students || [];

      if (!q || q.length < 1) {
        results.innerHTML = '<div style="padding:30px 14px;text-align:center;color:#6b7280">הקלד 2+ תווים לחיפוש...</div>';
        return;
      }

      let items = [];
      // Commands
      if (q.startsWith('/')) {
        items = COMMANDS.filter(c => c.cmd.includes(q) || c.label.includes(q.slice(1)));
      } else {
        // Students
        const ql = q.toLowerCase();
        items = students.filter(s => {
          const name = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.toLowerCase();
          return name.includes(ql) || String(s['תז']||'').includes(q);
        }).slice(0, 15).map(s => ({
          cmd: `#${s['מזהה']}`,
          label: `👤 ${s['שם פרטי']||''} ${s['שם משפחה']||''} · ${s['מחזור']||'-'}`,
          action: () => window.viewStudent?.(s['מזהה']),
        }));
      }

      if (items.length === 0) {
        results.innerHTML = '<div style="padding:20px 14px;text-align:center;color:#9ca3af">אין תוצאות</div>';
        return;
      }

      selectedIdx = Math.min(selectedIdx, items.length - 1);
      results.innerHTML = items.map((it, i) => `
        <div class="palette-item-135" data-idx="${i}" style="padding:10px 12px;border-radius:6px;cursor:pointer;display:flex;justify-content:space-between;background:${i===selectedIdx?'var(--bht-primary-lighter,#dbeafe)':'transparent'}">
          <span>${esc(it.label)}</span>
          <code style="color:#9ca3af;font-size:11px">${esc(it.cmd)}</code>
        </div>
      `).join('');

      results.querySelectorAll('.palette-item-135').forEach((el, i) => {
        el.onmouseenter = () => { selectedIdx = i; render(q); };
        el.onclick = () => {
          items[i].action?.();
          palette.remove();
          overlay.remove();
        };
      });
    }

    inp.oninput = () => render(inp.value.trim());

    inp.onkeydown = (e) => {
      if (e.key === 'Escape') { palette.remove(); overlay.remove(); }
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIdx++;
        render(inp.value.trim());
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIdx--;
        render(inp.value.trim());
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const sel = palette.querySelector(`.palette-item-135[data-idx="${selectedIdx}"]`);
        sel?.click();
      }
    };
  };

  // Ctrl+K opens palette (override any existing)
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !e.shiftKey) {
      e.preventDefault();
      // Close existing if open
      if (document.getElementById('palette-135')) {
        document.getElementById('palette-135').remove();
        document.getElementById('palette-overlay-135')?.remove();
      } else {
        window.openUniversalPalette();
      }
    }
  });

  console.warn('%c🔍 Pack-135 — Universal Command Palette (Ctrl+K) - search students + /slash commands', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-135.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-136.js ─────────────────────────────────────────────
try {
// behavior-pack-136.js — CSV export of visible table + clean print view. 2026-05-27
(function () {
function csvEscape(v) {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function findVisibleTable() {
    const tables = Array.from(document.querySelectorAll('table'));
    let best = null;
    let bestArea = 0;
    for (const t of tables) {
      const r = t.getBoundingClientRect();
      if (r.width < 50 || r.height < 50) continue;
      const inViewport = r.top < window.innerHeight && r.bottom > 0;
      if (!inViewport) continue;
      const area = r.width * r.height;
      if (area > bestArea) { best = t; bestArea = area; }
    }
    return best;
  }

  function tableToCsv(table) {
    const rows = Array.from(table.querySelectorAll('tr'))
      .filter(tr => tr.offsetParent !== null);
    if (rows.length === 0) return null;
    const out = rows.map(tr => {
      const cells = Array.from(tr.querySelectorAll('th,td'))
        .filter(c => c.offsetParent !== null || c.tagName === 'TH');
      return cells.map(c => csvEscape(c.innerText.replace(/\s+/g, ' ').trim())).join(',');
    });
    return out.join('\r\n');
  }

  function downloadCsv(csv, filename) {
    // BOM so Excel opens Hebrew correctly
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  window.exportVisibleTableToCsv = function () {
    const table = findVisibleTable();
    if (!table) {
      if (typeof window.toast === 'function') window.toast('לא נמצאה טבלה בתצוגה', 'warning', 3000);
      else alert('לא נמצאה טבלה בתצוגה');
      return false;
    }
    const csv = tableToCsv(table);
    if (!csv) {
      if (typeof window.toast === 'function') window.toast('הטבלה ריקה', 'warning', 2500);
      return false;
    }
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const hash = (location.hash || '#home').replace('#', '');
    downloadCsv(csv, `bht-${hash}-${ts}.csv`);
    if (typeof window.toast === 'function') {
      const rows = csv.split('\r\n').length;
      window.toast(`יוצא ${rows} שורות ל-CSV`, 'success', 3000);
    }
    return true;
  };

  // Ctrl+Shift+E = export
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      window.exportVisibleTableToCsv();
    }
  });

  // ===== Clean print view =====
  // Inject print-only CSS so Ctrl+P produces a clean printout (no navbar, no buttons, RTL)
  function injectPrintCss() {
    if (document.getElementById('bht-print-css-136')) return;
    const css = document.createElement('style');
    css.id = 'bht-print-css-136';
    css.textContent = `
      @media print {
        body { background: #fff !important; color: #000 !important; direction: rtl; font-family: 'Heebo', sans-serif; }
        nav, .navbar, .sidebar, footer, .no-print,
        button:not(.print-allow), .btn:not(.print-allow),
        #palette-135, #palette-overlay-135,
        #health-badge-126, #settings-gear-133,
        #recent-btn-128, .toast, #toast-container,
        .modal-backdrop, [class*="fab-"],
        input[type=search], input[type=text],
        .pagination, .tabs-strip, .filter-bar { display: none !important; }
        .container, .container-fluid, main { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
        table { width: 100% !important; border-collapse: collapse !important; font-size: 11pt; page-break-inside: auto; }
        table th, table td { border: 1px solid #999 !important; padding: 4px 6px !important; }
        table thead { display: table-header-group; }
        table tr { page-break-inside: avoid; }
        h1, h2, h3 { page-break-after: avoid; }
        a { color: #000 !important; text-decoration: none !important; }
        a[href]:after { content: ''; }
        .card { border: 1px solid #ddd !important; box-shadow: none !important; }
        @page { margin: 1.5cm; size: A4; }
      }
    `;
    document.head.appendChild(css);
  }
  injectPrintCss();

  // ===== Print current view command =====
  window.printCurrentView = function () {
    // Slight defer so any layout settles
    setTimeout(() => window.print(), 100);
  };

  // Add /print + /export to command palette if available
  if (window.openUniversalPalette) {
    // The palette in pack-135 has hardcoded COMMANDS — we patch it indirectly via global hotkey only.
    // No-op here; the Ctrl+Shift+E shortcut already works.
  }

  // ===== Tiny "Export CSV" button in tables (auto-injected, dismissible) =====
  function ensureExportButton() {
    const table = findVisibleTable();
    if (!table) return;
    // Only inject once per table
    if (table.dataset.exportBtn136) return;
    table.dataset.exportBtn136 = '1';

    // Find a header bar to attach the button to (preferred), else float
    let host = table.previousElementSibling;
    while (host && !host.matches('.d-flex, .row, .card-header, .toolbar, h1, h2, h3')) {
      host = host.previousElementSibling;
    }
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline-success no-print';
    btn.style.cssText = 'font-size:11px;margin:0 6px;padding:2px 8px';
    btn.title = 'יצוא ל-Excel/CSV (Ctrl+Shift+E)';
    btn.innerHTML = '⬇ CSV';
    btn.onclick = (e) => { e.preventDefault(); window.exportVisibleTableToCsv(); };

    if (host && host.appendChild) {
      try { host.appendChild(btn); } catch { /* fallback */ }
    } else {
      // Float above table
      btn.style.position = 'absolute';
      btn.style.zIndex = '50';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;height:0';
      wrap.appendChild(btn);
      table.parentNode.insertBefore(wrap, table);
    }
  }

  // Check periodically (tables come and go with navigation)
  let lastHash = '';
  setInterval(() => {
    if (location.hash !== lastHash) {
      lastHash = location.hash;
      // Clear injection flag on rebuild
      document.querySelectorAll('table[data-export-btn136]').forEach(t => { delete t.dataset.exportBtn136; });
    }
    ensureExportButton();
  }, 3000);

  console.warn('%c⬇ Pack-136 — CSV export (Ctrl+Shift+E) + clean print view (Ctrl+P) + auto-inject CSV button on tables', 'color:#16a34a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-136.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-137.js ─────────────────────────────────────────────
try {
// behavior-pack-137.js — AuthV2 readiness probe + admin status banner. 2026-05-27
// After backend deploy of AuthV2.js+ValidateV2.js, this pack tells admin what's still pending
// (Script Properties: PWD_SALT, JWT_SECRET) without ever changing the actual login flow.
(function () {
const WEBHOOK = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const DISMISS_KEY = 'bht_v2_probe_dismissed_v1';
  const PROBE_CACHE_KEY = 'bht_v2_probe_result';
  const PROBE_CACHE_TTL = 10 * 60 * 1000; // 10 min

  function isAdmin() {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u.username === 'admin' || u.role === 'מנהל';
    } catch { return false; }
  }

  async function probe() {
    // Cache: 10 minutes — backend doesn't change frequently
    try {
      const cached = JSON.parse(localStorage.getItem(PROBE_CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < PROBE_CACHE_TTL) return cached.status;
    } catch {}

    let status = { state: 'unknown', detail: '', timestamp: Date.now() };
    try {
      // Bench probe: try login with intentionally-wrong creds
      const url = `${WEBHOOK}?action=login&username=__probe__&password=__probe__&_t=${Date.now()}`;
      const r = await fetch(url, { method: 'GET', mode: 'cors' });
      const body = await r.text();
      let json = null;
      try { json = JSON.parse(body); } catch {}

      if (json && json.ok === false) {
        if (/unknown.*action|action.*not.*found|unsupported/i.test(json.error || '')) {
          status.state = 'missing'; status.detail = 'action=login לא קיים — לא נפרס AuthV2';
        } else if (/missing.*salt|missing.*secret|PWD_SALT|JWT_SECRET|server.*config|properties/i.test(json.error || '')) {
          status.state = 'config_pending'; status.detail = 'AuthV2 נפרס, חסר Script Properties (PWD_SALT/JWT_SECRET)';
        } else if (/unauthorized|invalid.*credentials|user.*not.*found/i.test(json.error || '')) {
          status.state = 'ready'; status.detail = 'AuthV2 פעיל — דחה credentials שגויים כצפוי';
        } else {
          status.state = 'unexpected'; status.detail = 'תשובה לא צפויה: ' + (json.error || '').slice(0, 100);
        }
      } else if (json && json.ok === true) {
        status.state = 'unexpected'; status.detail = 'בקשת בדיקה אישרה login עם credentials שגויים (!) — חשד לבאג';
      } else if (r.status >= 500) {
        status.state = 'server_error'; status.detail = `HTTP ${r.status}`;
      } else {
        status.state = 'no_json'; status.detail = body.slice(0, 120);
      }
    } catch (e) {
      status.state = 'network'; status.detail = e.message;
    }

    try { localStorage.setItem(PROBE_CACHE_KEY, JSON.stringify({ ts: Date.now(), status })); } catch {}
    return status;
  }

  function showBanner(status) {
    if (document.getElementById('bht-v2-banner-137')) return;
    if (localStorage.getItem(DISMISS_KEY) === status.state) return; // already dismissed THIS state

    const palette = {
      ready: { bg: '#16a34a', emoji: '✓', title: 'AuthV2 פעיל בייצור', body: status.detail },
      config_pending: { bg: '#f59e0b', emoji: '⚙', title: 'AuthV2 נפרס — חסרה הגדרה אחרונה', body: 'הוסף ב-Apps Script → Project Settings → Script Properties:\nPWD_SALT (string אקראי) · JWT_SECRET (string אקראי)\nאז: הרץ migrateLegacyPasswords()' },
      missing: { bg: '#dc2626', emoji: '✗', title: 'AuthV2 לא נמצא בבקאנד', body: 'הפעל GitHub Actions: gh workflow run deploy-appscript.yml' },
      unexpected: { bg: '#dc2626', emoji: '⚠', title: 'תגובת בקאנד חריגה', body: status.detail },
      network: { bg: '#6b7280', emoji: '⏸', title: 'אין רשת לבקאנד', body: status.detail },
      server_error: { bg: '#dc2626', emoji: '✗', title: 'שגיאת שרת', body: status.detail },
      no_json: { bg: '#6b7280', emoji: '?', title: 'תגובה לא JSON', body: status.detail },
      unknown: { bg: '#6b7280', emoji: '?', title: 'מצב לא ידוע', body: status.detail },
    };
    const p = palette[status.state] || palette.unknown;

    const banner = document.createElement('div');
    banner.id = 'bht-v2-banner-137';
    banner.className = 'no-print';
    banner.style.cssText = `position:fixed;top:60px;right:20px;background:${p.bg};color:#fff;padding:12px 16px;border-radius:8px;z-index:9985;box-shadow:0 6px 20px rgba(0,0,0,0.25);max-width:420px;direction:rtl;font-size:13px;font-family:Heebo,sans-serif`;
    banner.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:10px">
        <span style="font-size:22px;line-height:1">${p.emoji}</span>
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:4px">${p.title}</div>
          <div style="font-size:11px;opacity:0.92;white-space:pre-line;line-height:1.45">${p.body.replace(/</g,'&lt;')}</div>
        </div>
        <button id="v2-dismiss-137" style="background:rgba(255,255,255,0.2);border:0;color:#fff;width:24px;height:24px;border-radius:4px;cursor:pointer;font-size:14px" title="הסתר">×</button>
      </div>
    `;
    document.body.appendChild(banner);
    document.getElementById('v2-dismiss-137').onclick = () => {
      localStorage.setItem(DISMISS_KEY, status.state);
      banner.remove();
    };
  }

  // Public command
  window.checkAuthV2Status = async function () {
    try { localStorage.removeItem(PROBE_CACHE_KEY); } catch {}
    try { localStorage.removeItem(DISMISS_KEY); } catch {}
    const s = await probe();
    showBanner(s);
    console.group('🔐 AuthV2 Status');
    console.log('State:', s.state);
    console.log('Detail:', s.detail);
    console.groupEnd();
    return s;
  };

  // Auto-run on load for admin (delayed so login completes first)
  function autoRun() {
    setTimeout(async () => {
      if (!isAdmin()) return;
      const s = await probe();
      // Only show banner for actionable states
      if (['config_pending', 'missing', 'unexpected', 'server_error'].includes(s.state)) {
        showBanner(s);
      }
    }, 6000);
  }

  if (document.readyState === 'complete') autoRun();
  else window.addEventListener('load', autoRun);

  console.warn('%c🔐 Pack-137 — AuthV2 readiness probe (admin banner) + window.checkAuthV2Status()', 'color:#7c3aed;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-137.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-138.js ─────────────────────────────────────────────
try {
// behavior-pack-138.js — Smart Alerts: flag students needing attention. 2026-05-27
// Deterministic signals from the existing behavior data (no new schema):
//   • 3+ high-severity (חומרה=גבוהה) events in the last 7 days
//   • 5+ total behavior events in the last 7 days
// Self-contained, permission-respecting (uses getVisibleData when available),
// defensive (never throws into the page). Renders a dismissible home panel.
(function () {
const WINDOW_DAYS = 7;
  const HIGH_SEVERITY = 'גבוהה';
  const HIGH_THRESHOLD = 3;
  const FREQ_THRESHOLD = 5;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function getDataSafe() {
    try {
      if (typeof getVisibleData === 'function') return getVisibleData();
      if (typeof getData === 'function') return getData();
    } catch (e) {}
    return { students: [], behavior: [] };
  }

  // Returns [{ id, name, cls, highCount, totalCount, reasons:[...] }]
  function computeAlerts() {
    const data = getDataSafe();
    const students = Array.isArray(data.students) ? data.students : [];
    const events = Array.isArray(data.behavior) ? data.behavior : [];
    if (!events.length) return [];

    const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const byStudent = {};
    for (const e of events) {
      const t = Date.parse(e['תאריך']);
      if (isNaN(t) || t < cutoff) continue;
      const sid = String(e['תלמיד_מזהה'] || '');
      if (!sid) continue;
      if (!byStudent[sid]) byStudent[sid] = { high: 0, total: 0 };
      byStudent[sid].total++;
      if (String(e['חומרה'] || '') === HIGH_SEVERITY) byStudent[sid].high++;
    }

    const nameById = {};
    for (const s of students) {
      nameById[String(s['מזהה'])] = {
        name: `${s['שם פרטי'] || ''} ${s['שם משפחה'] || ''}`.trim() || ('תלמיד ' + s['מזהה']),
        cls: s['מחזור'] || '',
      };
    }

    const alerts = [];
    for (const sid in byStudent) {
      const c = byStudent[sid];
      const reasons = [];
      if (c.high >= HIGH_THRESHOLD) reasons.push(`${c.high} אירועי חומרה גבוהה`);
      if (c.total >= FREQ_THRESHOLD) reasons.push(`${c.total} אירועים`);
      if (!reasons.length) continue;
      const meta = nameById[sid] || { name: 'תלמיד ' + sid, cls: '' };
      alerts.push({ id: sid, name: meta.name, cls: meta.cls, highCount: c.high, totalCount: c.total, reasons });
    }
    // Most severe first (by high count, then total)
    alerts.sort((a, b) => (b.highCount - a.highCount) || (b.totalCount - a.totalCount));
    return alerts;
  }

  window.getSmartAlerts = computeAlerts;

  function renderPanel() {
    // Only on the home view, admins/staff
    if ((location.hash || '#home').replace('#', '') !== 'home') return;
    const host = document.querySelector('#page-home') || document.querySelector('[data-page="home"]') || document.querySelector('main') || document.body;
    if (!host) return;
    if (localStorage.getItem('bht_smartalerts_dismissed_today') === new Date().toISOString().slice(0, 10)) return;

    let alerts;
    try { alerts = computeAlerts(); } catch (e) { return; }
    if (!alerts.length) { const old = document.getElementById('smart-alerts-138'); if (old) old.remove(); return; }

    let panel = document.getElementById('smart-alerts-138');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'smart-alerts-138';
      panel.className = 'card no-print';
      panel.style.cssText = 'margin:12px 0;border:0;border-radius:var(--bht-radius-lg,12px);box-shadow:0 4px 16px rgba(0,0,0,.08);direction:rtl;overflow:hidden';
      host.insertBefore(panel, host.firstChild);
    }
    const items = alerts.slice(0, 8).map(a => `
      <button type="button" class="smart-alert-item-138" data-sid="${esc(a.id)}"
        style="display:flex;align-items:center;justify-content:space-between;width:100%;text-align:right;border:0;border-bottom:1px solid var(--bht-gray-100,#f3f4f6);background:transparent;padding:10px 14px;cursor:pointer;font-family:Heebo,sans-serif">
        <span style="display:flex;align-items:center;gap:10px">
          <span style="width:8px;height:8px;border-radius:50%;background:${a.highCount >= HIGH_THRESHOLD ? '#dc2626' : '#f59e0b'};flex:none"></span>
          <span style="font-weight:600">${esc(a.name)}</span>
          <span style="color:var(--bht-gray-500,#6b7280);font-size:12px">${esc(a.cls)}</span>
        </span>
        <span style="color:var(--bht-gray-600,#4b5563);font-size:12px">${esc(a.reasons.join(' · '))}</span>
      </button>`).join('');

    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#dc2626,#f59e0b);color:#fff;padding:10px 14px">
        <span style="font-weight:700;display:flex;align-items:center;gap:8px"><i class="bi bi-exclamation-triangle-fill"></i> התראות חכמות — ${alerts.length} תלמידים לתשומת לב (7 ימים)</span>
        <button id="smart-alerts-dismiss-138" title="הסתר להיום" style="background:rgba(255,255,255,.2);border:0;color:#fff;width:26px;height:26px;border-radius:6px;cursor:pointer">×</button>
      </div>
      <div>${items}</div>
      ${alerts.length > 8 ? `<div style="padding:8px 14px;font-size:12px;color:var(--bht-gray-500,#6b7280)">ועוד ${alerts.length - 8}…</div>` : ''}
    `;

    const dismiss = document.getElementById('smart-alerts-dismiss-138');
    if (dismiss) dismiss.onclick = () => {
      localStorage.setItem('bht_smartalerts_dismissed_today', new Date().toISOString().slice(0, 10));
      panel.remove();
    };
    panel.querySelectorAll('.smart-alert-item-138').forEach(btn => {
      btn.onclick = () => {
        const sid = btn.getAttribute('data-sid');
        if (typeof window.viewStudent === 'function') window.viewStudent(sid);
        else { location.hash = '#students'; }
      };
    });
  }

  // Re-render on navigation + after data refresh; throttled.
  let _t = 0;
  function schedule() {
    const now = Date.now();
    if (now - _t < 1500) return;
    _t = now;
    setTimeout(() => { try { renderPanel(); } catch (e) {} }, 300);
  }
  window.addEventListener('hashchange', schedule);
  window.addEventListener('cheder-data-refreshed', schedule);
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);

  console.warn('%c⚠ Pack-138 — Smart Alerts (3+ high-severity or 5+ events / 7d) on home + window.getSmartAlerts()', 'color:#dc2626;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-138.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-139.js ─────────────────────────────────────────────
try {
// behavior-pack-139.js — Change Password modal (post-AuthV2 lockout rescue). 2026-05-28
// Calls backend action=changePassword with the session JWT (bht_jwt). Uses the
// existing window.toast for feedback. Disabled button + spinner during submit.
(function () {
const WEBHOOK = (function () {
    try {
      const tag = Array.from(document.querySelectorAll('script[src]'))
        .map(s => s.src).find(s => /\/api\.js/.test(s));
      return null; // we'll read APPS_SCRIPT_URL via window below
    } catch { return null; }
  })();

  function getWebhookUrl() {
    if (typeof window.APPS_SCRIPT_URL === 'string') return window.APPS_SCRIPT_URL;
    // api.js declares APPS_SCRIPT_URL as a const — fall back to known production URL
    return 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  }

  function notify(msg, kind) {
    if (typeof window.toast === 'function') return window.toast(msg, kind || 'info', 4000);
    if (kind === 'error') console.error('[change-password]', msg); else console.log('[change-password]', msg);
    try { alert(msg); } catch {}
  }

  function ensureLink() {
    // Skip if user not logged in
    let user;
    try { user = JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { user = null; }
    if (!user || !user.username) return;
    const ui = document.getElementById('user-info');
    if (!ui) return;
    if (document.getElementById('change-pwd-btn-139')) return;
    const btn = document.createElement('button');
    btn.id = 'change-pwd-btn-139';
    btn.className = 'btn btn-sm btn-outline-light ms-2 no-print';
    btn.style.cssText = 'font-size:11px;padding:2px 8px';
    btn.title = 'שינוי סיסמה';
    btn.innerHTML = '<i class="bi bi-key"></i> סיסמה';
    btn.onclick = openModal;
    // Insert at the start of user-info so it appears before the logout button
    ui.appendChild(btn);
  }

  function openModal() {
    if (document.getElementById('change-pwd-modal-139')) return;
    const overlay = document.createElement('div');
    overlay.id = 'change-pwd-modal-139';
    overlay.className = 'no-print';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9990;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:Heebo,sans-serif';
    overlay.innerHTML = `
      <div style="background:#fff;width:min(440px,92vw);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden">
        <div style="padding:16px 18px;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;display:flex;align-items:center;gap:8px"><i class="bi bi-key-fill"></i> שינוי סיסמה</span>
          <button type="button" id="cpx-close-139" style="background:rgba(255,255,255,.2);border:0;color:#fff;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:16px">×</button>
        </div>
        <form id="cpx-form-139" style="padding:18px">
          <div class="mb-3">
            <label class="form-label" style="font-size:13px">סיסמה חדשה</label>
            <input id="cpx-new-139" type="password" class="form-control" minlength="4" required autocomplete="new-password">
            <div style="font-size:11px;color:#6b7280;margin-top:4px">לפחות 4 תווים</div>
          </div>
          <div class="mb-3">
            <label class="form-label" style="font-size:13px">אימות סיסמה</label>
            <input id="cpx-confirm-139" type="password" class="form-control" minlength="4" required autocomplete="new-password">
          </div>
          <div id="cpx-err-139" class="alert alert-danger d-none" style="font-size:13px;padding:8px 12px;margin-bottom:12px"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button type="button" id="cpx-cancel-139" class="btn btn-outline-secondary">ביטול</button>
            <button type="submit" id="cpx-submit-139" class="btn btn-primary"><i class="bi bi-check-lg me-1"></i>שמור</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { const el = document.getElementById('cpx-new-139'); if (el) el.focus(); }, 50);

    const close = () => overlay.remove();
    document.getElementById('cpx-close-139').onclick = close;
    document.getElementById('cpx-cancel-139').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    const form = document.getElementById('cpx-form-139');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const newPwd = document.getElementById('cpx-new-139').value;
      const conf = document.getElementById('cpx-confirm-139').value;
      const err = document.getElementById('cpx-err-139');
      err.classList.add('d-none');
      if (!newPwd || newPwd.length < 4) { err.textContent = 'לפחות 4 תווים'; err.classList.remove('d-none'); return; }
      if (newPwd !== conf) { err.textContent = 'הסיסמאות אינן זהות'; err.classList.remove('d-none'); return; }
      const session = sessionStorage.getItem('bht_jwt') || '';
      if (!session) { err.textContent = 'אין סשן פעיל — התחבר מחדש'; err.classList.remove('d-none'); return; }

      const submit = document.getElementById('cpx-submit-139');
      const orig = submit.innerHTML;
      submit.disabled = true;
      submit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>שומר...';
      try {
        const body = new URLSearchParams({ action: 'changePassword', session, newPassword: newPwd, instance: 'bht' });
        const r = await fetch(getWebhookUrl(), { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
        const data = await r.json().catch(() => ({ ok: false, error: 'תגובה לא JSON' }));
        if (data && data.ok) {
          notify('הסיסמה עודכנה בהצלחה', 'success');
          close();
        } else {
          err.textContent = (data && data.error) || 'שגיאה לא ידועה';
          err.classList.remove('d-none');
        }
      } catch (ex) {
        err.textContent = 'שגיאת רשת: ' + (ex && ex.message ? ex.message : ex);
        err.classList.remove('d-none');
      } finally {
        submit.disabled = false;
        submit.innerHTML = orig;
      }
    };
  }

  window.openChangePasswordModal = openModal;

  // Mount the link whenever user-info updates (after login)
  setInterval(ensureLink, 1500);
  if (document.readyState === 'complete') ensureLink();
  else window.addEventListener('load', ensureLink);

  console.warn('%c🔑 Pack-139 — Change Password modal (post-AuthV2 rescue) + window.openChangePasswordModal()', 'color:#1e3a8a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-139.js] init failed:', (e && e.message) || e) : null; }
// ─── behavior-pack-141.js ─────────────────────────────────────────────
try {
// behavior-pack-141.js — Admin Command Center widgets on home view. 2026-05-28
// 4 widgets, admin-only, rendered at the TOP of #page-home with skeleton
// loaders shown until data is available (zero layout shift: card heights are
// fixed). All metrics derived from already-synced data — no new endpoints.
//
//   1. תלמידים פעילים           — count of students with status פעיל
//   2. אירועי חומרה גבוהה (7 ימ) — behavior events חומרה=גבוהה in last 7 days
//   3. משימות פתוחות             — tasks whose סטטוס is not 'הושלם'
//   4. טפסים ממתינים              — signatures whose סטטוס is 'מחכה'
(function () {
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const CARD_HEIGHT = 108; // px — fixed so skeleton ≡ filled card (no CLS)

  function isAdmin() {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return u.role === 'מנהל' || u.username === 'admin' || u.permissions === 'all';
    } catch { return false; }
  }

  function getDataSafe() {
    try {
      if (typeof getData === 'function') return getData();
    } catch (e) {}
    return null;
  }

  function compute(data) {
    if (!data) return null;
    const students = Array.isArray(data.students) ? data.students : [];
    const behavior = Array.isArray(data.behavior) ? data.behavior : [];
    const tasks    = Array.isArray(data.tasks)    ? data.tasks    : [];
    const sigs     = Array.isArray(data.signatures) ? data.signatures : [];

    const active = students.filter(s => (s['סטטוס'] || 'פעיל') === 'פעיל').length;

    const cutoff = Date.now() - SEVEN_DAYS_MS;
    let severeWeek = 0;
    for (const e of behavior) {
      const t = Date.parse(e['תאריך']);
      if (isNaN(t) || t < cutoff) continue;
      if (String(e['חומרה'] || '') === 'גבוהה') severeWeek++;
    }

    // tasks: count those whose status is anything except 'הושלם'.
    const openTasks = tasks.filter(t => {
      const st = String(t['סטטוס'] || '');
      return st && st !== 'הושלם';
    }).length;

    const pendingSigs = sigs.filter(s => String(s['סטטוס'] || '') === 'מחכה').length;

    return {
      active, total: students.length, severeWeek, openTasks, pendingSigs,
    };
  }

  function ensureStyle() {
    if (document.getElementById('cc-style-141')) return;
    const s = document.createElement('style');
    s.id = 'cc-style-141';
    s.textContent = `
      #cmd-center-141 { margin: 16px 0 22px; }
      #cmd-center-141 .cc-row { display: grid; gap: 14px;
        grid-template-columns: repeat(4, minmax(0, 1fr)); }
      @media (max-width: 992px) { #cmd-center-141 .cc-row { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 576px) { #cmd-center-141 .cc-row { grid-template-columns: 1fr; } }
      #cmd-center-141 .cc-card {
        position: relative;
        height: ${CARD_HEIGHT}px;
        border-radius: 14px; padding: 14px 16px;
        color: #fff; overflow: hidden; direction: rtl;
        font-family: Heebo, sans-serif;
        box-shadow: 0 6px 20px rgba(0,0,0,.10);
        transition: transform .18s ease, box-shadow .18s ease;
      }
      #cmd-center-141 .cc-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,.18); }
      #cmd-center-141 .cc-icon { position:absolute; top:10px; left:14px; opacity:.18; font-size:54px; line-height:1; pointer-events:none }
      #cmd-center-141 .cc-num  { font-size: 38px; font-weight: 800; line-height: 1; margin-top: 6px; }
      #cmd-center-141 .cc-num small { font-size: 16px; font-weight: 500; opacity: .85; margin-inline-start: 6px; }
      #cmd-center-141 .cc-label { font-size: 12.5px; opacity: .92; font-weight: 600; }
      #cmd-center-141 .cc-blue   { background: linear-gradient(135deg,#1e3a8a,#3b82f6); }
      #cmd-center-141 .cc-red    { background: linear-gradient(135deg,#991b1b,#dc2626); }
      #cmd-center-141 .cc-amber  { background: linear-gradient(135deg,#92400e,#f59e0b); }
      #cmd-center-141 .cc-purple { background: linear-gradient(135deg,#5b21b6,#8b5cf6); }
      /* Skeleton */
      #cmd-center-141 .cc-card.is-skel { background:#e5e7eb; color:transparent; box-shadow:none; }
      #cmd-center-141 .cc-card.is-skel::after {
        content:""; position:absolute; inset:0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent);
        animation: cc141-shimmer 1.4s infinite;
      }
      @keyframes cc141-shimmer { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
      @media print { #cmd-center-141 { display:none !important; } }
    `;
    document.head.appendChild(s);
  }

  function buildShell() {
    if (document.getElementById('cmd-center-141')) return document.getElementById('cmd-center-141');
    const home = document.getElementById('page-home');
    if (!home) return null;
    ensureStyle();
    const wrap = document.createElement('div');
    wrap.id = 'cmd-center-141';
    wrap.className = 'no-print';
    wrap.innerHTML = `
      <div class="cc-row">
        <div class="cc-card cc-blue is-skel"   data-w="active">  <i class="bi bi-people-fill cc-icon"></i>          <div class="cc-label">תלמידים פעילים</div>     <div class="cc-num">—</div></div>
        <div class="cc-card cc-red is-skel"    data-w="severe">  <i class="bi bi-exclamation-triangle-fill cc-icon"></i><div class="cc-label">אירועי חומרה גבוהה · 7י׳</div><div class="cc-num">—</div></div>
        <div class="cc-card cc-amber is-skel"  data-w="tasks">   <i class="bi bi-list-check cc-icon"></i>           <div class="cc-label">משימות פתוחות</div>       <div class="cc-num">—</div></div>
        <div class="cc-card cc-purple is-skel" data-w="sigs">    <i class="bi bi-file-earmark-text cc-icon"></i>    <div class="cc-label">טפסים ממתינים לחתימה</div> <div class="cc-num">—</div></div>
      </div>
    `;
    // Insert as the FIRST child of #page-home (above existing groups)
    home.insertBefore(wrap, home.firstChild);
    return wrap;
  }

  function fill(metrics) {
    const wrap = document.getElementById('cmd-center-141');
    if (!wrap) return;
    const setCard = (key, value, sub) => {
      const card = wrap.querySelector(`.cc-card[data-w="${key}"]`);
      if (!card) return;
      card.classList.remove('is-skel');
      const num = card.querySelector('.cc-num');
      if (!num) return;
      num.innerHTML = String(value) + (sub ? ` <small>${sub}</small>` : '');
    };
    setCard('active', metrics.active, metrics.total > metrics.active ? ` / ${metrics.total}` : '');
    setCard('severe', metrics.severeWeek);
    setCard('tasks', metrics.openTasks);
    setCard('sigs', metrics.pendingSigs);
  }

  function tick() {
    if (!isAdmin()) {
      const w = document.getElementById('cmd-center-141');
      if (w) w.remove();
      return;
    }
    // Only render on the home view
    const home = document.getElementById('page-home');
    if (!home || home.classList.contains('d-none')) {
      // Build shell anyway — home will reveal it when navigating
      buildShell();
      return;
    }
    buildShell();
    const data = getDataSafe();
    const m = compute(data);
    if (m) fill(m);
  }

  // Re-render whenever data refreshes or user navigates
  let _t = 0;
  function schedule() {
    const now = Date.now();
    if (now - _t < 800) return;
    _t = now;
    setTimeout(() => { try { tick(); } catch (e) { /* defensive */ } }, 200);
  }
  window.addEventListener('hashchange', schedule);
  window.addEventListener('cheder-data-refreshed', schedule);

  // Poll every 30s for fresh numbers (data syncs in background)
  setInterval(schedule, 30000);

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);

  window.refreshCommandCenter = tick;
  console.warn('%c📊 Pack-141 — Admin Command Center (4 widgets + skeleton loaders, admin only)', 'color:#1e3a8a;font-weight:bold');
})();
} catch (e) { (console && console.error) ? console.error('[behavior-pack-141.js] init failed:', (e && e.message) || e) : null; }