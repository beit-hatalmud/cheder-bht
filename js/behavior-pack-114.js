// behavior-pack-114.js — Convert inline styles to CSS classes (Gemini audit #4). 2026-05-27
(function () {
  'use strict';

  // Inject all the "common patterns" used by inline styles as proper CSS classes
  if (document.getElementById('pack-114-styles')) return;
  const st = document.createElement('style');
  st.id = 'pack-114-styles';
  st.textContent = `
    /* === Toolbars === */
    .bht-toolbar { position: sticky; top: 0; z-index: 50; background: #fff; padding: 8px 14px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; margin-bottom: 8px; }
    .bht-toolbar-flex { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }

    /* === Cards === */
    .bht-card-elevated { background: #fff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); padding: 14px; margin-bottom: 14px; }
    .bht-card-header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; padding: 12px 14px; font-weight: bold; border-radius: 10px 10px 0 0; }

    /* === Badges & labels === */
    .bht-badge-yellow { background: #fbbf24; color: #1e3a8a; padding: 4px 10px; border-radius: 14px; font-weight: 600; font-size: 12px; }
    .bht-badge-blue { background: #1e3a8a; color: #fff; padding: 4px 10px; border-radius: 14px; font-weight: 600; font-size: 12px; }
    .bht-badge-red { background: #dc2626; color: #fff; padding: 4px 10px; border-radius: 14px; font-weight: 600; font-size: 12px; }

    /* === Inputs === */
    .bht-input-clean { width: 100%; border: 0; background: transparent; padding: 4px; font-size: 13px; outline: none; }
    .bht-input-clean:focus { background: #fffbeb; outline: 1px solid #fbbf24; border-radius: 3px; }

    /* === Modal overlay === */
    .bht-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .bht-overlay-content { background: #fff; border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; }

    /* === Status indicators === */
    .bht-status-pulse {
      display: inline-block; width: 10px; height: 10px; border-radius: 50%;
      background: #22c55e; box-shadow: 0 0 6px #22c55e;
      animation: bht-pulse-114 2s infinite;
    }
    .bht-status-offline { background: #ef4444 !important; box-shadow: 0 0 6px #ef4444; }
    @keyframes bht-pulse-114 { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }

    /* === Buttons === */
    .bht-btn-primary { background: #1e3a8a; color: #fff; border: 0; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: opacity 0.15s; }
    .bht-btn-primary:hover { opacity: 0.9; }
    .bht-btn-primary:active { transform: translateY(1px); }
    .bht-btn-warning { background: #fbbf24; color: #1e3a8a; border: 0; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 500; }

    /* === Layout helpers === */
    .bht-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .bht-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    @media (max-width: 768px) {
      .bht-grid-2, .bht-grid-3 { grid-template-columns: 1fr; }
    }
    .bht-flex { display: flex; }
    .bht-flex-between { display: flex; justify-content: space-between; align-items: center; }
    .bht-flex-center { display: flex; justify-content: center; align-items: center; }
    .bht-flex-col { display: flex; flex-direction: column; gap: 8px; }

    /* === Spacing utilities === */
    .bht-mt-1 { margin-top: 4px; } .bht-mt-2 { margin-top: 8px; } .bht-mt-3 { margin-top: 12px; }
    .bht-mb-1 { margin-bottom: 4px; } .bht-mb-2 { margin-bottom: 8px; } .bht-mb-3 { margin-bottom: 12px; }
    .bht-p-1 { padding: 4px; } .bht-p-2 { padding: 8px; } .bht-p-3 { padding: 12px; }

    /* === Print === */
    @media print {
      .bht-no-print { display: none !important; }
      .bht-print-only { display: block !important; }
    }
    .bht-print-only { display: none; }
  `;
  document.head.appendChild(st);

  console.warn('%c🎨 Pack-114 — Reusable CSS classes (less inline style.cssText)', 'color:#7c3aed;font-weight:bold');
})();
