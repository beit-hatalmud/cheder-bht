// behavior-pack-34.js — Drag & Drop / Kanban. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Enable HTML5 drag&drop on task cards =====
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
