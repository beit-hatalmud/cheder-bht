// behavior-pack-124.js — Home page tiles redesigned with theme.css. 2026-05-27
(function () {
  'use strict';

  // Inject CSS for modern tile design
  if (!document.getElementById('pack-124-tiles')) {
    const st = document.createElement('style');
    st.id = 'pack-124-tiles';
    st.textContent = `
      /* Modern card-tile design using theme.css tokens */
      #page-home .card-tile {
        background: #fff;
        border: 0 !important;
        border-radius: var(--bht-radius-lg, 12px) !important;
        padding: var(--bht-space-5, 20px) !important;
        box-shadow: var(--bht-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
        transition: var(--bht-transition-base, 0.25s);
        text-align: center;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        min-height: 130px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      #page-home .card-tile::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--bht-primary, #1e3a8a), var(--bht-primary-light, #3b82f6));
        opacity: 0;
        transition: opacity 0.2s;
      }
      #page-home .card-tile:hover {
        transform: translateY(-4px);
        box-shadow: var(--bht-shadow-lg, 0 4px 12px rgba(0,0,0,0.08));
      }
      #page-home .card-tile:hover::before { opacity: 1; }
      #page-home .card-tile i.fs-1 {
        font-size: 38px !important;
        margin-bottom: var(--bht-space-2, 8px);
        transition: transform 0.2s;
      }
      #page-home .card-tile:hover i.fs-1 {
        transform: scale(1.15);
      }
      #page-home .card-tile h5 {
        font-size: var(--bht-font-size-md, 15px);
        font-weight: 600;
        color: var(--bht-gray-800, #1f2937);
        margin: var(--bht-space-2, 8px) 0 var(--bht-space-1, 4px);
      }
      #page-home .card-tile p {
        font-size: var(--bht-font-size-xs, 11px);
        color: var(--bht-gray-500, #6b7280);
        margin: 0;
      }

      /* Group titles - modern */
      .home-group-title {
        font-size: var(--bht-font-size-lg, 17px);
        font-weight: 700;
        color: var(--bht-primary, #1e3a8a);
        border-right: 4px solid var(--bht-primary, #1e3a8a);
        padding-right: var(--bht-space-3, 12px);
        margin-bottom: var(--bht-space-3, 12px);
        display: flex;
        align-items: center;
        gap: var(--bht-space-2, 8px);
      }
      .home-group-1 .home-group-title { border-color: var(--bht-primary, #1e3a8a); }
      .home-group-2 .home-group-title { border-color: var(--bht-success, #22c55e); color: var(--bht-success, #22c55e); }
      .home-group-3 .home-group-title { border-color: var(--bht-danger, #dc2626); color: var(--bht-danger, #dc2626); }
      .home-group-4 .home-group-title { border-color: var(--bht-accent-dark, #d97706); color: var(--bht-accent-dark, #d97706); }

      /* Navbar - modernize */
      .navbar-dark {
        background: linear-gradient(135deg, var(--bht-primary-dark, #1e293b), var(--bht-primary, #1e3a8a)) !important;
        box-shadow: var(--bht-shadow-md, 0 2px 4px rgba(0,0,0,0.06));
        padding: var(--bht-space-3, 12px) 0;
      }
      .navbar-brand .brand-text {
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .navbar .btn-outline-light, .navbar .btn-outline-warning {
        border-radius: var(--bht-radius-md, 8px);
        font-size: var(--bht-font-size-sm, 12px);
        transition: var(--bht-transition-fast, 0.15s);
      }
      .navbar .btn-outline-light:hover {
        background: rgba(255,255,255,0.15);
        transform: scale(1.05);
      }

      /* Page transitions */
      [id^="page-"]:not(.d-none) {
        animation: bht-page-fade-124 0.3s ease-out;
      }
      @keyframes bht-page-fade-124 {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Modal animations */
      .modal.show .modal-dialog {
        animation: bht-modal-pop-124 0.2s ease-out;
      }
      @keyframes bht-modal-pop-124 {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(st);
  }

  // Add subtle hover badge "New" to recently-added tiles
  setTimeout(() => {
    document.querySelectorAll('#page-home [onclick*="cameras"], #page-home [onclick*="staff"]').forEach(t => {
      if (t.querySelector('.tile-new-badge-124')) return;
      const badge = document.createElement('span');
      badge.className = 'tile-new-badge-124';
      badge.style.cssText = 'position:absolute;top:8px;left:8px;background:var(--bht-accent,#fbbf24);color:var(--bht-primary,#1e3a8a);padding:2px 8px;border-radius:10px;font-size:9px;font-weight:bold;letter-spacing:0.3px';
      badge.textContent = '⚡ חדש';
      t.style.position = 'relative';
      t.appendChild(badge);
    });
  }, 1500);

  console.warn('%c🎨 Pack-124 — Home page tiles + navbar redesigned with theme.css + page+modal animations', 'color:#7c3aed;font-weight:bold');
})();
