// behavior-pack-104.js — TLA: auto-grow textareas + mobile responsive + visual save feedback. 2026-05-27
(function () {
  'use strict';

  // ===== Auto-grow textareas (so all content visible without scroll) =====
  function autoGrow(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight + 4) + 'px';
  }

  function applyAutoGrow() {
    document.querySelectorAll('.tla-v7 textarea, #stu-tab-tla textarea').forEach(t => {
      if (t.dataset.grow104) return;
      t.dataset.grow104 = '1';
      autoGrow(t);
      t.addEventListener('input', () => autoGrow(t));
    });
  }

  document.addEventListener('shown.bs.tab', e => {
    if (e.target?.getAttribute('href') === '#stu-tab-tla') {
      setTimeout(applyAutoGrow, 200);
      setTimeout(applyAutoGrow, 800);
    }
  });
  setInterval(applyAutoGrow, 3000);

  // ===== Mobile-responsive CSS =====
  if (!document.getElementById('pack-104-mobile')) {
    const st = document.createElement('style');
    st.id = 'pack-104-mobile';
    st.textContent = `
      @media (max-width: 768px) {
        #viewStuModal .modal-dialog { margin: 5px; }
        #viewStuModal .modal-content { border-radius: 8px; }
        #viewStuModal .modal-body { padding: 8px; }
        #viewStuModal .tab-content { padding: 8px; }
        #viewStuModal .stu-tabs .nav-link { font-size: 12px; padding: 6px 8px; }
        #viewStuModal .student-card-hero { flex-direction: column; text-align: center; padding: 12px; }
        #viewStuModal .student-avatar-big { width: 48px; height: 48px; font-size: 18px; }
        .tla-v7 .tla-quad { grid-template-columns: 1fr !important; }
        .tla-v7 .toolbar-v7 { flex-direction: column; gap: 6px; align-items: stretch !important; }
        .tla-v7 .tla-slide-num { width: 24px; height: 24px; font-size: 12px; }
        .tla-v7 .tla-header { font-size: 14px; padding: 10px 40px 10px 12px; }
        .tla-v7 table.tla-g { font-size: 11px; }
        .tla-v7 table.tla-g td { padding: 3px; }
        .tla-v7 textarea { font-size: 12px; }
        /* Schedule table - scroll horizontally on mobile */
        .tla-v7 .tla-slide:nth-of-type(2) .tla-body { overflow-x: auto; }
        .tla-v7 .tla-slide:nth-of-type(2) table.tla-g { min-width: 700px; }
      }
      @media (max-width: 480px) {
        #viewStuModal .stu-tabs { display: flex; overflow-x: auto; flex-wrap: nowrap; }
        #viewStuModal .stu-tabs .nav-link { white-space: nowrap; }
      }
    `;
    document.head.appendChild(st);
  }

  // ===== Visual save feedback (toast-style) =====
  const _origSave = window.tlaSaveForm;
  if (typeof _origSave === 'function') {
    window.tlaSaveForm = async function (sid) {
      const btn = document.querySelector(`#tla-doc-${sid} button[onclick*="tlaSaveForm"]`);
      if (btn) {
        btn.disabled = true;
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> שומר...';
        try {
          await _origSave.apply(this, arguments);
          btn.innerHTML = '<i class="bi bi-check-circle"></i> נשמר ✓';
          btn.classList.remove('btn-success');
          btn.classList.add('btn-info');
          setTimeout(() => {
            btn.innerHTML = oldHtml;
            btn.classList.remove('btn-info');
            btn.classList.add('btn-success');
            btn.disabled = false;
          }, 2000);
        } catch (e) {
          btn.innerHTML = '<i class="bi bi-x-circle"></i> נכשל';
          btn.classList.add('btn-danger');
          setTimeout(() => {
            btn.innerHTML = oldHtml;
            btn.classList.remove('btn-danger');
            btn.disabled = false;
          }, 3000);
        }
      } else {
        return _origSave.apply(this, arguments);
      }
    };
  }

  console.warn('%c📱 Pack-104 — TLA auto-grow textareas + mobile responsive + save feedback', 'color:#0891b2;font-weight:bold');
})();
