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
