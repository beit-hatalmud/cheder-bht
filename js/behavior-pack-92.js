// behavior-pack-92.js — CRITICAL: Force replace pack-66's simple TLA with pack-90's full form. 2026-05-27
(function () {
  'use strict';

  function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

  // Listen for modal shown - run AFTER pack-66 with longer delay
  document.addEventListener('shown.bs.modal', e => {
    if (e.target?.id !== 'viewStuModal') return;
    setTimeout(replaceTlaTab, 300);
  });

  // Also observe DOM for new modals
  const obs = new MutationObserver(() => {
    const modal = document.getElementById('viewStuModal');
    if (modal && !modal.dataset.pack92Done) {
      modal.dataset.pack92Done = '1';
      setTimeout(replaceTlaTab, 400);
    }
  });
  obs.observe(document.body, { childList: true });

  function replaceTlaTab() {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    const oldPane = document.getElementById('stu-tab-tla');
    const tabsList = modal.querySelector('#stu-tabs');
    const tabsContent = modal.querySelector('.tab-content');
    if (!tabsList || !tabsContent) return;

    // Remove old tab link + pane added by pack-66
    if (oldPane) {
      const oldLink = tabsList.querySelector('a[href="#stu-tab-tla"]');
      if (oldLink) oldLink.parentNode.remove();
      oldPane.remove();
    }

    // Now call pack-90's full form rebuilder
    if (typeof window.injectTlaTab === 'function') {
      window.injectTlaTab();
    } else {
      console.warn('[Pack-92] window.injectTlaTab not defined');
    }
  }

  // ===== Add TLA quick-access tile to home page for admin =====
  function addTlaHomeShortcut() {
    const home = document.getElementById('page-home');
    if (!home) return;
    if (home.querySelector('#tla-home-shortcut')) return;
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.username !== 'admin' && u.role !== 'מנהל') return;

    const widget = document.createElement('div');
    widget.id = 'tla-home-shortcut';
    widget.className = 'mb-3';
    widget.innerHTML = `
      <button class="btn btn-warning" onclick="window.openTlaDashboard && window.openTlaDashboard()">
        <i class="bi bi-mortarboard-fill"></i> דשבורד תל"א (10 תלמידי שיעור א מסונכרנים)
      </button>
      <small class="text-muted ms-2">או פתח כרטיס תלמיד → לחץ על הטאב "תל"א"</small>
    `;
    home.insertBefore(widget, home.firstChild);
  }

  const _origShowPage = window.showPage;
  if (typeof _origShowPage === 'function') {
    window.showPage = function (name) {
      const r = _origShowPage.apply(this, arguments);
      if (name === 'home') setTimeout(addTlaHomeShortcut, 300);
      return r;
    };
  }
  setTimeout(addTlaHomeShortcut, 1800);

  // ===== Fix pack-88's count: also count students with תלא_data =====
  function patchHomeStats() {
    const widget = document.getElementById('home-stats-88');
    if (!widget) return;
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const tlaCount = (data.students || []).filter(s => s['תלא_pdf_id'] || s['תלא_data']).length;
    const studentsCount = (data.students || []).filter(s => s['סטטוס'] !== 'סיים').length;
    const stat = widget.querySelectorAll('div')[6]; // 3rd card's number div
    if (stat) {
      stat.textContent = `${tlaCount}/${studentsCount}`;
    }
  }
  setInterval(patchHomeStats, 3000);
  setTimeout(patchHomeStats, 2200);

  // ===== Force-refresh data on cameras/student pages =====
  // The cached data may be stale. Pull fresh from Sheet.
  if (typeof window.api === 'function') {
    setTimeout(async () => {
      try {
        // listStudents pulls from cache - force a fresh sync if pullFromSheet exists
        if (typeof window.pullFromSheet === 'function') {
          await window.pullFromSheet('תלמידים');
          console.info('[Pack-92] refreshed students from sheet');
          patchHomeStats();
        }
      } catch (e) { /* ignore */ }
    }, 3000);
  }

  console.warn('%c🔧 Pack-92 CRITICAL — replace pack-66 TLA tab with pack-90 full form + home shortcut + fix tla count', 'color:#dc2626;font-weight:bold;font-size:14px');
})();
