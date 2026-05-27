// behavior-pack-75.js — Round 9: search across all data + keyboard shortcuts. 2026-05-27
(function () {
  'use strict';

  // ===== Universal search: students, behavior, TLA, conversations =====
  window.openUniversalSearch = function () {
    const html = `<div class="modal fade show" id="universal-search" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;max-height:80vh;display:flex;flex-direction:column">
          <div class="modal-header">
            <h5><i class="bi bi-search"></i> חיפוש גלובלי</h5>
            <button class="btn-close" onclick="document.getElementById('universal-search').remove()"></button>
          </div>
          <div class="modal-body" style="overflow-y:auto;flex:1">
            <input id="usearch-q" class="form-control form-control-lg" placeholder="הקלד שם, מילה, תאריך, קטגוריה..." autocomplete="off">
            <div class="mt-2 small text-muted">חיפוש בכל המקורות: תלמידים, התנהגות, שיחות, תלאים, הגדרות</div>
            <div id="usearch-results" class="mt-3"></div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const inp = document.getElementById('usearch-q');
    inp.focus();
    inp.oninput = debounce(() => doSearch(inp.value), 250);
  };

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function esc(s) { return String(s || '').replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c])); }

  function doSearch(q) {
    const out = document.getElementById('usearch-results');
    if (!out) return;
    q = q.trim().toLowerCase();
    if (q.length < 2) { out.innerHTML = '<div class="text-muted text-center py-3">הקלד 2+ תווים...</div>'; return; }

    const data = typeof getVisibleData === 'function' ? getVisibleData() : {};
    const results = [];

    (data.students || []).forEach(s => {
      const blob = `${s['שם פרטי']||''} ${s['שם משפחה']||''} ${s['תז']||''} ${s['טלפון']||''} ${s['אימייל']||''}`.toLowerCase();
      if (blob.includes(q)) {
        results.push({
          type: 'תלמיד',
          icon: 'bi-person',
          color: 'primary',
          title: `${s['שם פרטי']} ${s['שם משפחה']}`,
          desc: `שיעור ${s['מחזור']||'-'} · ${s['תז']||''}`,
          action: `openStudent(${s['מזהה']})`,
        });
      }
    });

    (data.behavior || []).forEach(e => {
      const blob = `${e['תיאור']||''} ${e['קטגוריה']||''} ${e['שם תלמיד']||''} ${e['דווח_עי']||''}`.toLowerCase();
      if (blob.includes(q)) {
        results.push({
          type: 'אירוע',
          icon: 'bi-clipboard-check',
          color: 'success',
          title: `${e['קטגוריה']||'אירוע'} - ${e['שם תלמיד']||''}`,
          desc: `${(e['תיאור']||'').slice(0,80)} · ${e['תאריך']?e['תאריך'].slice(0,10):''}`,
          action: `openStudent(${e['תלמיד_מזהה']})`,
        });
      }
    });

    (data.conversations || []).forEach(c => {
      const blob = `${c['תוכן']||''} ${c['נושא']||''} ${c['שם תלמיד']||''} ${c['רב']||''}`.toLowerCase();
      if (blob.includes(q)) {
        results.push({
          type: 'שיחה',
          icon: 'bi-chat-dots',
          color: 'info',
          title: `שיחה - ${c['שם תלמיד']||''}`,
          desc: `${(c['נושא']||c['תוכן']||'').slice(0,80)} · רב: ${c['רב']||''}`,
          action: `openStudent(${c['תלמיד_מזהה']})`,
        });
      }
    });

    if (!results.length) {
      out.innerHTML = '<div class="text-center text-muted py-4">לא נמצאו תוצאות</div>';
      return;
    }

    out.innerHTML = `<div class="small text-muted mb-2">${results.length} תוצאות</div>` + results.slice(0, 50).map(r => `
      <div class="card p-2 mb-1" style="cursor:pointer" onclick="${esc(r.action)}; document.getElementById('universal-search').remove();">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-${r.color}"><i class="bi ${r.icon}"></i> ${esc(r.type)}</span>
          <div class="flex-grow-1">
            <strong>${esc(r.title)}</strong>
            <div class="small text-muted">${esc(r.desc)}</div>
          </div>
        </div>
      </div>
    `).join('') + (results.length > 50 ? `<div class="small text-muted text-center mt-2">+${results.length-50} תוצאות נוספות. צמצם חיפוש לראות יותר.</div>` : '');
  }

  // ===== Keyboard shortcut: Ctrl+K opens search =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !e.shiftKey) {
      e.preventDefault();
      if (typeof openGlobalSearch === 'function') {
        openGlobalSearch();
      } else {
        openUniversalSearch();
      }
    }
  });

  console.warn('%c🔍 Pack-75 — Universal search + Ctrl+K', 'color:#8b5cf6;font-weight:bold');
})();
