// behavior-pack-125.js — Tables + form polish + breadcrumbs. 2026-05-27
(function () {
  'use strict';

  if (!document.getElementById('pack-125-css')) {
    const st = document.createElement('style');
    st.id = 'pack-125-css';
    st.textContent = `
      /* === Table modernization === */
      table.table {
        border-radius: var(--bht-radius-md, 8px);
        overflow: hidden;
        background: #fff;
      }
      table.table thead th {
        background: var(--bht-gray-100, #f3f4f6);
        color: var(--bht-gray-700, #374151);
        font-weight: 600;
        font-size: var(--bht-font-size-sm, 12px);
        text-transform: uppercase;
        letter-spacing: 0.3px;
        padding: var(--bht-space-3, 12px) var(--bht-space-2, 8px);
        border-bottom: 2px solid var(--bht-gray-200, #e5e7eb) !important;
      }
      table.table tbody tr {
        transition: var(--bht-transition-fast, 0.15s);
      }
      table.table tbody tr:hover {
        background: var(--bht-primary-lighter, #dbeafe) !important;
      }
      table.table tbody td {
        padding: var(--bht-space-2, 8px);
        vertical-align: middle;
        font-size: var(--bht-font-size-base, 14px);
      }
      table.table tbody tr:nth-child(even) {
        background: var(--bht-gray-50, #f9fafb);
      }

      /* === Avatar circles in lists === */
      .avatar, .student-avatar-mini {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--bht-primary, #1e3a8a), var(--bht-primary-light, #3b82f6));
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: var(--bht-font-size-sm, 12px);
        margin-left: var(--bht-space-2, 8px);
        box-shadow: var(--bht-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
      }

      /* === Badge modernization === */
      .badge {
        padding: 4px 10px;
        border-radius: var(--bht-radius-pill, 999px);
        font-size: var(--bht-font-size-xs, 11px);
        font-weight: 600;
        letter-spacing: 0.2px;
      }

      /* === Form controls modernization === */
      .form-control, .form-select {
        border: 1.5px solid var(--bht-gray-200, #e5e7eb);
        border-radius: var(--bht-radius-md, 8px);
        padding: var(--bht-space-2, 8px) var(--bht-space-3, 12px);
        font-size: var(--bht-font-size-base, 14px);
        transition: var(--bht-transition-fast, 0.15s);
      }
      .form-control:focus, .form-select:focus {
        border-color: var(--bht-primary, #1e3a8a);
        box-shadow: 0 0 0 3px rgba(30,58,138,0.1);
      }
      .form-control:hover:not(:focus), .form-select:hover:not(:focus) {
        border-color: var(--bht-gray-400, #9ca3af);
      }

      /* === Button polish === */
      .btn {
        border-radius: var(--bht-radius-md, 8px);
        font-weight: 500;
        padding: var(--bht-space-2, 8px) var(--bht-space-4, 16px);
        transition: var(--bht-transition-fast, 0.15s);
      }
      .btn:active { transform: translateY(1px); }
      .btn-primary {
        background: var(--bht-primary, #1e3a8a);
        border-color: var(--bht-primary, #1e3a8a);
      }
      .btn-primary:hover {
        background: var(--bht-primary-light, #3b82f6);
        border-color: var(--bht-primary-light, #3b82f6);
        transform: translateY(-1px);
        box-shadow: var(--bht-shadow-md, 0 2px 4px rgba(0,0,0,0.06));
      }
      .btn-success {
        background: var(--bht-success, #22c55e);
        border-color: var(--bht-success, #22c55e);
      }
      .btn-danger {
        background: var(--bht-danger, #dc2626);
        border-color: var(--bht-danger, #dc2626);
      }

      /* === Alert beautification === */
      .alert {
        border-radius: var(--bht-radius-md, 8px);
        border: 0;
        border-right: 4px solid;
        padding: var(--bht-space-3, 12px) var(--bht-space-4, 16px);
      }
      .alert-info { border-right-color: var(--bht-info, #3b82f6); background: var(--bht-info-light, #dbeafe); color: var(--bht-primary, #1e3a8a); }
      .alert-success { border-right-color: var(--bht-success, #22c55e); background: var(--bht-success-light, #dcfce7); color: #166534; }
      .alert-warning { border-right-color: var(--bht-warning, #fbbf24); background: var(--bht-warning-light, #fef3c7); color: #92400e; }
      .alert-danger { border-right-color: var(--bht-danger, #dc2626); background: var(--bht-danger-light, #fee2e2); color: #991b1b; }
    `;
    document.head.appendChild(st);
  }

  // ===== Add subtle breadcrumb =====
  function updateBreadcrumb() {
    const hash = location.hash.replace('#', '') || 'home';
    if (hash === 'login' || hash === 'home') {
      document.getElementById('breadcrumb-125')?.remove();
      return;
    }
    const pageTitles = {
      students: 'תלמידים', behavior: 'מעקב התנהגות',
      tasks: 'משימות', cameras: 'מצלמות', writing: 'מעקב כתיבה',
      settings: 'הגדרות', conversations: 'שיחות', staff: 'צוות',
      reading: 'קריאה', meetings: 'אסיפות', tests: 'מבחנים',
      medications: 'רפואי', attendance: 'נוכחות', reports: 'דוחות',
      calendar: 'לוח שנה', classview: 'תצוגת שיעור',
      functioning: 'תפקוד', signatures: 'חתימות',
    };
    const title = pageTitles[hash] || hash;
    let bc = document.getElementById('breadcrumb-125');
    if (!bc) {
      bc = document.createElement('nav');
      bc.id = 'breadcrumb-125';
      bc.style.cssText = 'background:transparent;padding:8px 0;margin-bottom:12px;font-size:13px;color:var(--bht-gray-500,#6b7280)';
      const container = document.querySelector('.container');
      if (container) container.insertBefore(bc, container.firstChild);
    }
    bc.innerHTML = `<a href="#home" style="color:var(--bht-primary,#1e3a8a);text-decoration:none"><i class="bi bi-house-door"></i> בית</a> <span style="margin:0 8px;color:var(--bht-gray-300,#d1d5db)">›</span> <strong style="color:var(--bht-gray-700,#374151)">${title}</strong>`;
  }
  updateBreadcrumb();
  window.addEventListener('hashchange', updateBreadcrumb);

  console.warn('%c🎨 Pack-125 — Tables, forms, alerts, buttons modernized + breadcrumbs', 'color:#7c3aed;font-weight:bold');
})();
