// behavior-pack-40.js — Inline Editing & Quick Actions. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Double-click to edit =====
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
