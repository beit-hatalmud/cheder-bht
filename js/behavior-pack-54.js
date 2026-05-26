// behavior-pack-54.js — FORCE-FIX FAB menu (was undefined toggleFabMenu in pack-48 IIFE). 2026-05-26
(function () {
  'use strict';

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
