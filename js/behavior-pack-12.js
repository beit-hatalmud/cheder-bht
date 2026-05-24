// behavior-pack-12.js — סבב 12: ניתוח חכם + UX. 2026-05-24
(function () {
  'use strict';

  // ===== 1. חיפוש גלובלי Ctrl+K =====
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
