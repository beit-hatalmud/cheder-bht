// behavior-pack-128.js — Recent students dropdown + quick-jump shortcuts. 2026-05-27
(function () {
  'use strict';

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
