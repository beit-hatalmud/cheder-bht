// behavior-pack-38.js — Power User Tools & Advanced Shortcuts. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Command palette (Ctrl+Shift+P) =====
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
