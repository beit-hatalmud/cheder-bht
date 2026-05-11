// Global search (Ctrl+K)

function openGlobalSearch() {
  if (document.getElementById('gs-modal')) return;
  const html = `<div class="modal fade" id="gs-modal" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content">
    <div class="modal-header py-2">
      <i class="bi bi-search me-2"></i>
      <input id="gs-input" class="form-control border-0 shadow-none" placeholder="חיפוש בכל המערכת — תלמידים, אירועים, מבחנים..." style="font-size:1.1rem">
      <button class="btn-close" data-bs-dismiss="modal"></button>
    </div>
    <div class="modal-body" id="gs-results" style="min-height:300px">
      <p class="text-muted text-center py-4">התחל להקליד...</p>
    </div>
    <div class="modal-footer py-1 small text-muted">
      <kbd>↑</kbd><kbd>↓</kbd> לניווט · <kbd>Enter</kbd> לבחירה · <kbd>Esc</kbd> לסגירה
    </div>
  </div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  const modalEl = document.getElementById('gs-modal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  const input = document.getElementById('gs-input');
  setTimeout(() => input.focus(), 200);
  input.oninput = doGlobalSearch;
  modalEl.addEventListener('keydown', handleGsKeys);
  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });
}

let _gsItems = [];
let _gsActive = 0;

function handleGsKeys(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); _gsActive = Math.min(_gsItems.length - 1, _gsActive + 1); highlightGs(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); _gsActive = Math.max(0, _gsActive - 1); highlightGs(); }
  else if (e.key === 'Enter') { e.preventDefault(); if (_gsItems[_gsActive]) _gsItems[_gsActive].click(); }
}

function highlightGs() {
  document.querySelectorAll('.gs-item').forEach((el, i) => {
    el.classList.toggle('active', i === _gsActive);
    if (i === _gsActive) el.scrollIntoView({ block: 'nearest' });
  });
}

async function doGlobalSearch() {
  const q = document.getElementById('gs-input').value.trim().toLowerCase();
  const el = document.getElementById('gs-results');
  if (!q) {
    el.innerHTML = '<p class="text-muted text-center py-4">התחל להקליד...</p>';
    return;
  }
  const data = getVisibleData();
  const hits = [];

  // Students
  (data.students || []).forEach(s => {
    const text = [s['שם פרטי'], s['שם משפחה'], s['מחזור'], s['שם אם'], s['שם אב'], s['מספר זהות'], s['טלפון אם'], s['טלפון אב'], s['כתובת']]
      .filter(Boolean).join(' ').toLowerCase();
    if (text.includes(q)) {
      hits.push({
        type: 'תלמיד', icon: 'bi-person',
        title: (s['שם פרטי']||'') + ' ' + (s['שם משפחה']||''),
        subtitle: `כיתה ${s['מחזור']||''} · גיל ${s['גיל']||''}`,
        action: () => { bootstrap.Modal.getInstance(document.getElementById('gs-modal')).hide(); goto('students'); setTimeout(() => viewStudent(s['מזהה']), 400); },
      });
    }
  });

  // Behavior events
  (data.behavior || []).forEach(e => {
    const text = [e['שם תלמיד'], e['קטגוריה'], e['תיאור'], e['הערות'], e['דווח_עי'], e['פרשה']]
      .filter(Boolean).join(' ').toLowerCase();
    if (text.includes(q)) {
      hits.push({
        type: 'אירוע', icon: 'bi-clipboard-check',
        title: e['שם תלמיד'] || '?',
        subtitle: `${e['קטגוריה']||''} · ${(e['תיאור']||'').slice(0,80)}`,
        action: () => { bootstrap.Modal.getInstance(document.getElementById('gs-modal')).hide(); goto('behavior'); },
      });
    }
  });

  // Tests
  (data.tests || []).forEach(t => {
    const stu = (data.students||[]).find(s => String(s['מזהה']) === String(t['תלמיד_מזהה']));
    const stuName = stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}` : '';
    const text = [stuName, t['סוג'], t['פרשה']].filter(Boolean).join(' ').toLowerCase();
    if (text.includes(q)) {
      hits.push({
        type: 'מבחן', icon: 'bi-pencil-square',
        title: stuName,
        subtitle: `${t['סוג']||''} · ${t['פרשה']||''} · ${t['ציון']||''}`,
        action: () => { bootstrap.Modal.getInstance(document.getElementById('gs-modal')).hide(); goto('tests'); },
      });
    }
  });

  // Functioning summary by student
  if (q.length >= 2) {
    const funcByStu = {};
    (data.functioning || []).forEach(f => {
      const stu = (data.students||[]).find(s => String(s['מזהה']) === String(f['תלמיד_מזהה']));
      if (!stu) return;
      const stuName = `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.toLowerCase();
      if (stuName.includes(q) && !funcByStu[stu['מזהה']]) {
        funcByStu[stu['מזהה']] = { stu, n: 0, sum: 0 };
      }
      if (funcByStu[stu['מזהה']]) {
        funcByStu[stu['מזהה']].n++;
        funcByStu[stu['מזהה']].sum += parseFloat(f['ציון']) || 0;
      }
    });
    Object.values(funcByStu).forEach(({ stu, n, sum }) => {
      hits.push({
        type: 'תפקוד', icon: 'bi-bar-chart-line',
        title: `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`,
        subtitle: `${n} ציונים · ממוצע ${(sum/n).toFixed(2)}`,
        action: () => { bootstrap.Modal.getInstance(document.getElementById('gs-modal')).hide(); goto('functioning'); },
      });
    });
  }

  if (!hits.length) {
    el.innerHTML = '<p class="text-muted text-center py-4">לא נמצאו תוצאות</p>';
    _gsItems = [];
    return;
  }

  el.innerHTML = hits.slice(0, 50).map((h, i) => `
    <div class="gs-item d-flex align-items-center p-2 border-bottom ${i === 0 ? 'active' : ''}" style="cursor:pointer" data-idx="${i}">
      <i class="bi ${h.icon} fs-5 me-3 text-primary"></i>
      <div class="flex-grow-1">
        <div><strong>${escHtml(h.title)}</strong></div>
        <div class="small text-muted">${escHtml(h.subtitle)}</div>
      </div>
      <span class="badge bg-light text-dark">${escHtml(h.type)}</span>
    </div>
  `).join('');
  _gsItems = Array.from(el.querySelectorAll('.gs-item'));
  _gsActive = 0;
  _gsItems.forEach((item, i) => item.onclick = hits[i].action);
}

// Global hotkey
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (typeof currentUser !== 'undefined' && currentUser) openGlobalSearch();
  }
});
