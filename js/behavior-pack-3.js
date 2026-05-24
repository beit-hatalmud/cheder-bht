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
