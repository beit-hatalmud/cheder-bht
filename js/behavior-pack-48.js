// behavior-pack-48.js — Consolidate floating buttons into one. 2026-05-25
(function () {
  'use strict';

  // IDs של כל הכפתורים הצפים שיוצרים בpacks קודמים
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
