// behavior-pack-102.js — Improved design for student card modal + TLA polish. 2026-05-27
(function () {
  'use strict';

  // Inject improved CSS
  if (!document.getElementById('pack-102-style')) {
    const st = document.createElement('style');
    st.id = 'pack-102-style';
    st.textContent = `
      /* ===== Student modal improvements ===== */
      #viewStuModal .modal-dialog {
        max-width: 1200px;
      }
      #viewStuModal .modal-content {
        border: 0;
        border-radius: 14px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        overflow: hidden;
      }
      #viewStuModal .modal-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        color: #fff;
        padding: 14px 20px;
        border-bottom: 0;
      }
      #viewStuModal .modal-header h5, #viewStuModal .modal-header .modal-title {
        color: #fff;
        font-weight: 600;
      }
      #viewStuModal .modal-header .btn-close {
        filter: invert(1);
      }
      #viewStuModal .modal-body {
        padding: 16px 20px;
        background: #f9fafb;
      }
      #viewStuModal .stu-tabs.nav-tabs {
        border-bottom: 2px solid #1e3a8a;
        margin-bottom: 12px;
        gap: 2px;
      }
      #viewStuModal .stu-tabs .nav-link {
        color: #1e3a8a;
        border: 0;
        border-radius: 8px 8px 0 0;
        padding: 8px 14px;
        font-weight: 500;
        font-size: 14px;
        transition: all 0.15s;
        background: #e0e7ff;
        margin-bottom: -2px;
      }
      #viewStuModal .stu-tabs .nav-link:hover {
        background: #c7d2fe;
        color: #1e3a8a;
      }
      #viewStuModal .stu-tabs .nav-link.active {
        background: #1e3a8a;
        color: #fff;
        border-bottom: 2px solid #1e3a8a;
      }
      #viewStuModal .tab-content {
        background: #fff;
        border-radius: 0 0 8px 8px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        min-height: 400px;
      }
      #viewStuModal .modal-footer {
        background: #f3f4f6;
        border-top: 1px solid #e5e7eb;
        padding: 12px 20px;
      }
      #viewStuModal .modal-footer .btn {
        font-weight: 500;
        padding: 6px 14px;
        border-radius: 6px;
      }

      /* ===== Student card header ===== */
      #viewStuModal .student-card-hero {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        padding: 16px 20px;
        border-radius: 10px;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 14px;
        border: 2px solid #fbbf24;
      }
      #viewStuModal .student-avatar-big {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: #1e3a8a;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        flex-shrink: 0;
      }
      #viewStuModal .student-card-hero .student-name-big {
        font-size: 22px;
        font-weight: 700;
        color: #1e3a8a;
        margin: 0;
      }
      #viewStuModal .student-card-hero .student-meta {
        font-size: 13px;
        color: #6b7280;
      }

      /* ===== TLA polish ===== */
      .tla-v7 {
        background: #f9fafb;
        padding: 12px;
        border-radius: 8px;
      }
      .tla-v7 .toolbar-v7 {
        background: #fff;
        padding: 10px 14px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        border: 1px solid #e5e7eb;
        z-index: 50;
      }
      .tla-v7 .tla-slide {
        background: #fff;
        border: 0;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        margin-bottom: 16px;
        overflow: visible;
      }
      .tla-v7 .tla-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        font-size: 16px;
        padding: 12px 50px 12px 14px;
      }
      .tla-v7 .tla-slide-num {
        width: 28px;
        height: 28px;
        background: #fbbf24;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .tla-v7 .tla-quad {
        border: 0;
        gap: 8px;
        background: transparent;
      }
      .tla-v7 .tla-quad-cell {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        overflow: hidden;
      }
      .tla-v7 .tla-quad-label {
        padding: 8px 10px;
        font-size: 13px;
      }
      .tla-v7 table.tla-g {
        border-radius: 6px;
        overflow: hidden;
      }
      .tla-v7 table.tla-g th {
        padding: 8px 6px;
        font-size: 12px;
      }
      .tla-v7 textarea {
        min-height: 36px;
        padding: 6px;
        border-radius: 4px;
        transition: background 0.15s;
      }
      .tla-v7 textarea:hover {
        background: #fafbfc;
      }
      .tla-v7 textarea:focus {
        background: #fef3c7;
        outline: 2px solid #fbbf24;
      }

      /* Student tabs - keyboard-shortcut hint */
      #viewStuModal .stu-tabs .nav-link::after {
        content: '';
      }

      /* Better scrollbar */
      #viewStuModal .modal-body::-webkit-scrollbar { width: 8px; }
      #viewStuModal .modal-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      #viewStuModal .modal-body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `;
    document.head.appendChild(st);
  }

  // ===== Inject student-card hero ON top of modal body =====
  function injectHero() {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    if (modal.querySelector('.student-card-hero')) return;
    const body = modal.querySelector('.modal-body');
    if (!body) return;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (!m) return;
    const sid = parseInt(m);
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const initials = (s['שם פרטי']||'?').charAt(0);
    const events = (data.behavior || []).filter(e => String(e['תלמיד_מזהה']) === String(sid));
    const recentEv = events.filter(e => {
      const d = new Date(e['תאריך'] || 0);
      return (Date.now() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
    }).length;

    const hero = document.createElement('div');
    hero.className = 'student-card-hero';
    hero.innerHTML = `
      <div class="student-avatar-big">${initials}</div>
      <div class="flex-grow-1">
        <h4 class="student-name-big">${fullName}</h4>
        <div class="student-meta">
          <span class="badge bg-primary me-1">${s['מחזור']||'-'}</span>
          <span class="badge bg-secondary me-1">ID: ${sid}</span>
          ${s['גיל'] ? `<span class="badge bg-info me-1">גיל: ${s['גיל']}</span>` : ''}
          ${s['סטטוס'] ? `<span class="badge bg-${s['סטטוס']==='פעיל'?'success':'warning'} me-1">${s['סטטוס']}</span>` : ''}
        </div>
      </div>
      <div class="text-end">
        <div class="text-muted small">אירועים החודש</div>
        <div class="h4 text-primary mb-0">${recentEv}</div>
      </div>
    `;
    body.insertBefore(hero, body.firstChild);
  }

  document.addEventListener('shown.bs.modal', e => {
    if (e.target?.id === 'viewStuModal') setTimeout(injectHero, 100);
  });

  console.warn('%c🎨 Pack-102 — Student card + TLA design polish (hero, gradients, shadows, better tabs)', 'color:#7c3aed;font-weight:bold');
})();
