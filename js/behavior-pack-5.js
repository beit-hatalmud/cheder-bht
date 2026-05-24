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
