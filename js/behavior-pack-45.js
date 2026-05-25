// behavior-pack-45.js — Saved Views & Filters Persistence. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Save current view =====
  window.savedViews = JSON.parse(localStorage.getItem('bht_saved_views') || '[]');

  window.saveCurrentView = function (name) {
    const view = {
      id: Date.now(),
      name: name || `תצוגה ${savedViews.length + 1}`,
      page: location.hash.replace('#', ''),
      filters: collectFilters(),
      created: Date.now(),
    };
    savedViews.push(view);
    localStorage.setItem('bht_saved_views', JSON.stringify(savedViews));
    if (typeof toast === 'function') toast(`תצוגה "${view.name}" נשמרה`, 'success');
    return view;
  };

  function collectFilters() {
    const filters = {};
    document.querySelectorAll('select[id*="-f"], input[id*="-f"]').forEach(el => {
      if (el.value) filters[el.id] = el.value;
    });
    return filters;
  }

  window.applyView = function (id) {
    const view = savedViews.find(v => v.id === id);
    if (!view) return;
    if (view.page) goto(view.page);
    setTimeout(() => {
      Object.entries(view.filters || {}).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) { el.value = val; el.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    }, 500);
  };

  window.deleteView = function (id) {
    savedViews = savedViews.filter(v => v.id !== id);
    localStorage.setItem('bht_saved_views', JSON.stringify(savedViews));
  };

  // ===== 2. Saved views menu =====
  window.openSavedViewsMenu = function () {
    const html = `<div class="modal fade show" id="sv-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>📋 תצוגות שמורות</h5><button class="btn-close" onclick="document.getElementById('sv-modal').remove()"></button></div>
          <div class="modal-body">
            ${savedViews.length ? savedViews.map(v => `
              <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                <button class="btn btn-link p-0" onclick="applyView(${v.id});document.getElementById('sv-modal').remove()">${escHtml(v.name)}</button>
                <button class="btn btn-sm btn-link text-danger" onclick="deleteView(${v.id});this.parentElement.remove()">×</button>
              </div>`).join('') : '<div class="text-muted">אין תצוגות שמורות</div>'}
            <hr>
            <button class="btn btn-primary w-100" onclick="(function(){const n=prompt('שם תצוגה:');if(n){saveCurrentView(n);document.getElementById('sv-modal').remove()}})()">+ שמור תצוגה נוכחית</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 3. Smart filter combos =====
  window.SMART_FILTERS = [
    { id: 'today_high', label: 'היום + חומרה גבוהה', apply: () => { setFilterValue('b-from', new Date().toISOString().slice(0,10)); setFilterValue('b-severity', 'גבוהה'); } },
    { id: 'this_week', label: 'השבוע הזה', apply: () => { const d=new Date(); d.setDate(d.getDate()-7); setFilterValue('b-from', d.toISOString().slice(0,10)); } },
    { id: 'my_only', label: 'שלי בלבד', apply: () => { const u = JSON.parse(sessionStorage.getItem('user')||'{}'); setFilterValue('b-rabbi', u.username); } },
    { id: 'unresolved', label: 'לא טופל', apply: () => { setFilterValue('b-status', 'ממתין'); } },
  ];

  function setFilterValue(id, value) {
    const el = document.getElementById(id);
    if (el) { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); }
  }

  // ===== 4. Filter chips bar =====
  window.showFilterChips = function () {
    const filters = collectFilters();
    const active = Object.entries(filters);
    let bar = document.getElementById('filter-chips-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'filter-chips-bar';
      bar.style.cssText = 'position:sticky;top:60px;background:#f3f4f6;padding:6px;border-radius:6px;margin:8px 0;display:flex;gap:4px;flex-wrap:wrap;direction:rtl;font-size:12px;z-index:50';
      const page = document.querySelector('[id^="page-"]:not(.d-none)');
      if (page) page.insertBefore(bar, page.children[1]);
    }
    bar.innerHTML = active.length ? active.map(([k, v]) => `
      <span class="badge bg-info" onclick="document.getElementById('${k}').value='';document.getElementById('${k}').dispatchEvent(new Event('change',{bubbles:true}));this.remove()" style="cursor:pointer">
        ${escHtml(v)} ×
      </span>`).join('') : '';
    if (!active.length) bar.style.display = 'none';
    else bar.style.display = '';
  };

  setInterval(showFilterChips, 3000);

  // ===== 5. Quick filter buttons =====
  setTimeout(() => {
    if (document.getElementById('quick-filters-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'quick-filters-bar';
    bar.style.cssText = 'position:fixed;top:48px;right:14px;display:flex;gap:4px;z-index:998;direction:rtl';
    SMART_FILTERS.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-secondary';
      btn.textContent = f.label;
      btn.onclick = f.apply;
      bar.appendChild(btn);
    });
    document.body.appendChild(bar);
  }, 3000);

  // ===== 6. URL deep linking =====
  window.shareFilteredView = function () {
    const params = new URLSearchParams();
    params.set('page', location.hash.replace('#', ''));
    Object.entries(collectFilters()).forEach(([k, v]) => params.set(k, v));
    const url = location.origin + location.pathname + '?' + params.toString() + '#shared';
    navigator.clipboard.writeText(url).then(() => {
      if (typeof toast === 'function') toast('קישור הועתק', 'success');
    });
  };

  // Apply filters from URL on load
  setTimeout(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('page')) {
      const page = params.get('page');
      if (location.hash !== '#' + page) goto(page);
      setTimeout(() => {
        params.forEach((v, k) => {
          if (k === 'page') return;
          setFilterValue(k, v);
        });
      }, 800);
    }
  }, 1500);

  // ===== 7. Filter history =====
  let _filterHistory = [];
  document.addEventListener('change', e => {
    if (e.target.id && e.target.id.includes('-f')) {
      _filterHistory.unshift({ id: e.target.id, value: e.target.value, ts: Date.now() });
      if (_filterHistory.length > 30) _filterHistory.pop();
    }
  });

  window.restoreLastFilter = function () {
    if (!_filterHistory.length) return;
    const last = _filterHistory[0];
    setFilterValue(last.id, last.value);
  };

  // ===== 8. Filter group "OR" support =====
  window.applyOrFilter = function (selectId, values) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    // Multi-select - select first matching
    if (values.length) sel.value = values[0];
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // ===== 9. Reset all filters =====
  window.clearAllFilters = function () {
    document.querySelectorAll('select[id*="-f"], input[id*="-f"]').forEach(el => {
      el.value = '';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    if (typeof toast === 'function') toast('פילטרים נוקו', 'info');
  };

  // ===== 10. Keyboard shortcut =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      openSavedViewsMenu();
    }
    if (e.ctrlKey && e.key === '0' && !e.target.matches('input,textarea')) {
      e.preventDefault();
      clearAllFilters();
    }
  });

  console.warn('%c💾 Pack-45 — Saved views, smart filters, URL deeplink, filter chips, history', 'color:#7c3aed;font-weight:bold');
})();
