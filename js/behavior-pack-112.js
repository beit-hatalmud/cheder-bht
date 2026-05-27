// behavior-pack-112.js — Accessibility + data export/import + table improvements. 2026-05-27
(function () {
  'use strict';

  let fixes = 0;

  // ===== Fix 1: ARIA labels for buttons with icon-only =====
  setInterval(() => {
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      const txt = btn.textContent.trim();
      const title = btn.title;
      if (!txt || txt.length < 2) {
        // Icon-only button
        if (title) btn.setAttribute('aria-label', title);
        else {
          const icon = btn.querySelector('i.bi');
          if (icon) {
            const cls = icon.className.match(/bi-([\w-]+)/)?.[1] || 'button';
            btn.setAttribute('aria-label', cls.replace(/-/g, ' '));
          }
        }
      }
    });
  }, 12000);
  fixes++;

  // ===== Fix 2: sticky table headers =====
  if (!document.getElementById('pack-112-css')) {
    const st = document.createElement('style');
    st.id = 'pack-112-css';
    st.textContent = `
      .modal-body table thead { position: sticky; top: 0; z-index: 5; }
      .modal-body table thead th { background: #f3f4f6; border-bottom: 2px solid #d1d5db !important; }
      /* Better focus indicators */
      *:focus-visible { outline: 2px solid #3b82f6 !important; outline-offset: 2px; border-radius: 4px; }
      /* Print-friendly */
      @media print {
        body { background: #fff !important; }
        .modal { position: relative !important; transform: none !important; }
        .modal-dialog { max-width: none !important; margin: 0 !important; }
        .modal-content { box-shadow: none !important; border: 0 !important; }
        .no-print, button[onclick*="hide"], .modal-footer, nav { display: none !important; }
        .tla-v7 .tla-slide { page-break-inside: avoid; }
      }
      /* Skip-to-content for keyboard nav */
      .skip-to-content {
        position: absolute; top: -40px; right: 6px; padding: 6px 12px;
        background: #1e3a8a; color: #fff; z-index: 99999; transition: top .2s;
      }
      .skip-to-content:focus { top: 6px; }
    `;
    document.head.appendChild(st);
  }
  fixes++;

  // ===== Fix 3: skip-to-content link =====
  if (!document.querySelector('.skip-to-content')) {
    const link = document.createElement('a');
    link.href = '#main-content';
    link.className = 'skip-to-content';
    link.textContent = 'דלג לתוכן ראשי';
    document.body.insertBefore(link, document.body.firstChild);
  }
  fixes++;

  // ===== Fix 4: Quick search in tables (Ctrl+F-like inside modal) =====
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.key.toLowerCase() !== 'f') return;
    const activeModal = document.querySelector('.modal.show');
    if (!activeModal) return;
    const table = activeModal.querySelector('table');
    if (!table) return;
    e.preventDefault();

    // Show inline search bar
    let bar = activeModal.querySelector('.table-search-bar-112');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'table-search-bar-112';
      bar.style.cssText = 'position:sticky;top:0;background:#fff;padding:6px;border-bottom:1px solid #e5e7eb;z-index:10;display:flex;gap:6px;align-items:center';
      bar.innerHTML = '<i class="bi bi-search"></i><input type="search" class="form-control form-control-sm" placeholder="חיפוש בטבלה...">';
      const inp = bar.querySelector('input');
      inp.oninput = () => {
        const q = inp.value.toLowerCase();
        table.querySelectorAll('tbody tr').forEach(tr => {
          tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      };
      table.parentNode.insertBefore(bar, table);
      inp.focus();
    } else {
      bar.querySelector('input').focus();
    }
  });
  fixes++;

  // ===== Fix 5: bulk select with shift+click in tables =====
  let lastChecked = null;
  document.addEventListener('click', e => {
    const cb = e.target.closest?.('input[type=checkbox]');
    if (!cb || !cb.matches('tbody input[type=checkbox], .bulk-checkbox')) return;
    if (e.shiftKey && lastChecked) {
      const checkboxes = Array.from(document.querySelectorAll('input[type=checkbox]')).filter(c => c.matches('tbody input[type=checkbox], .bulk-checkbox'));
      const start = checkboxes.indexOf(lastChecked);
      const end = checkboxes.indexOf(cb);
      const [from, to] = [Math.min(start, end), Math.max(start, end)];
      for (let i = from; i <= to; i++) {
        checkboxes[i].checked = cb.checked;
        checkboxes[i].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    lastChecked = cb;
  });
  fixes++;

  // ===== Fix 6: high-contrast mode toggle =====
  window.toggleHighContrast = function () {
    document.body.classList.toggle('high-contrast');
    if (document.body.classList.contains('high-contrast')) {
      if (!document.getElementById('hc-style-112')) {
        const st = document.createElement('style');
        st.id = 'hc-style-112';
        st.textContent = 'body.high-contrast * { filter: contrast(1.4) !important; }';
        document.head.appendChild(st);
      }
      if (typeof toast === 'function') toast('מצב ניגודיות גבוהה הופעל', 'info');
    } else {
      if (typeof toast === 'function') toast('מצב רגיל', 'info');
    }
  };
  fixes++;

  // ===== Fix 7: page title shows current section =====
  window.addEventListener('hashchange', () => {
    const page = location.hash.replace('#', '') || 'home';
    const titles = {
      home: 'בית', students: 'תלמידים', behavior: 'מעקב התנהגות',
      tasks: 'משימות', cameras: 'מצלמות', writing: 'מעקב כתיבה',
      settings: 'הגדרות', conversations: 'שיחות',
    };
    document.title = (titles[page] || page) + ' · בית התלמוד';
  });
  fixes++;

  console.warn(`%c♿ Pack-112 — ${fixes} a11y + UX (ARIA, sticky headers, focus visible, skip link, Ctrl+F, shift-select, high contrast, dynamic title)`, 'color:#16a34a;font-weight:bold');
})();
