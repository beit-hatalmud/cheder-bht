// behavior-pack-43.js — Smart auto-save & undo history. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Auto-save drafts every 30s =====
  setInterval(() => {
    document.querySelectorAll('.modal.show textarea[id^="b-"],.modal.show textarea[id^="nw-"],.modal.show textarea[id^="nr-"]').forEach(t => {
      if (t.value && t.value.length > 5) {
        try {
          localStorage.setItem('bht_draft_' + t.id, t.value);
        } catch (_) {}
      }
    });
  }, 30000);

  // ===== 2. Restore drafts on modal open =====
  document.addEventListener('shown.bs.modal', e => {
    e.target.querySelectorAll('textarea[id]').forEach(t => {
      if (!t.value) {
        try {
          const draft = localStorage.getItem('bht_draft_' + t.id);
          if (draft) {
            const restore = document.createElement('button');
            restore.type = 'button';
            restore.className = 'btn btn-sm btn-outline-warning mb-1';
            restore.innerHTML = '↺ שחזר טיוטה';
            restore.onclick = () => {
              t.value = draft;
              restore.remove();
              if (typeof toast === 'function') toast('טיוטה שוחזרה', 'success');
            };
            t.parentNode.insertBefore(restore, t);
          }
        } catch (_) {}
      }
    });
  });

  // ===== 3. Clear draft after successful save =====
  document.addEventListener('click', e => {
    const btn = e.target.closest('button.btn-primary');
    if (!btn || !btn.textContent.includes('שמור')) return;
    setTimeout(() => {
      Object.keys(localStorage).filter(k => k.startsWith('bht_draft_')).forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
      });
    }, 2000);
  });

  // ===== 4. Visit history =====
  window._visitHistory = JSON.parse(localStorage.getItem('bht_visits') || '[]');
  window.addEventListener('hashchange', () => {
    const page = location.hash.replace('#','') || 'home';
    _visitHistory.unshift({ page, ts: Date.now() });
    if (_visitHistory.length > 50) _visitHistory.pop();
    localStorage.setItem('bht_visits', JSON.stringify(_visitHistory));
  });

  // ===== 5. Quick "back" button =====
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key === 'ArrowRight') { // RTL = back
      e.preventDefault();
      history.back();
    }
  });

  // ===== 6. Smart focus management =====
  document.addEventListener('shown.bs.modal', e => {
    const firstInput = e.target.querySelector('input:not([type=hidden]),textarea,select');
    if (firstInput) firstInput.focus();
  });

  // ===== 7. Enter to submit =====
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.shiftKey || e.target.tagName === 'TEXTAREA') return;
    const modal = e.target.closest('.modal.show');
    if (!modal) return;
    const submitBtn = modal.querySelector('button.btn-primary:not([disabled])');
    if (submitBtn) { e.preventDefault(); submitBtn.click(); }
  });

  // ===== 8. Visual sorting indicator =====
  document.addEventListener('click', e => {
    const th = e.target.closest('th[data-sort]');
    if (!th) return;
    const dir = th.dataset.dir === 'asc' ? 'desc' : 'asc';
    th.parentElement.querySelectorAll('th').forEach(t => { t.dataset.dir = ''; });
    th.dataset.dir = dir;
    const icon = dir === 'asc' ? ' ▲' : ' ▼';
    th.textContent = th.textContent.replace(/[▲▼]/g, '').trim() + icon;
  });

  // ===== 9. Lazy import students data =====
  let _lazyLoaded = false;
  document.addEventListener('hashchange', async () => {
    if (_lazyLoaded) return;
    if (!['students','behavior','classview'].includes(location.hash.replace('#',''))) return;
    _lazyLoaded = true;
    try {
      const r = await api('listStudents', []);
      window._allStudents = r.data || [];
    } catch (_) {}
  });

  // ===== 10. Print only current view =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      const cur = document.querySelector('[id^="page-"]:not(.d-none)');
      if (!cur) { window.print(); return; }
      const w = window.open('', '_blank');
      w.document.write('<html dir="rtl"><head><title>הדפסה</title><style>body{font-family:Heebo,Arial;padding:20px}</style></head><body>' + cur.innerHTML + '<script>setTimeout(()=>window.print(),300)</script></body></html>');
    }
  });

  console.warn('%c💾 Pack-43 — Smart save: drafts, restore, history, Enter-submit, lazy load', 'color:#16a34a;font-weight:bold');
})();
