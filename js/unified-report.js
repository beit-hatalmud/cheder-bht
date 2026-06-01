// unified-report.js — One modal for every report type (התנהגות / קריאה /
// כתיבה / שיעור פרטני / שיחה / אסיפה). Built fresh, doesn't depend on any
// of the broken individual saveXxx flows. 2026-06-01.
(function () {
  'use strict';

  const TYPES = [
    { key: 'behavior',     label: 'התנהגות',        icon: 'bi-clipboard-check', api: 'addBehavior',     cats: 'dynamic' },
    { key: 'reading',      label: 'קריאה',          icon: 'bi-book',            api: 'addBehavior',     cats: ['קריאה'] },
    { key: 'writing',      label: 'כתיבה',          icon: 'bi-pencil',          api: 'addBehavior',     cats: ['כתיבה'] },
    { key: 'lesson',       label: 'שיעור פרטני',    icon: 'bi-mortarboard',     api: 'addBehavior',     cats: ['שיעור פרטני'] },
    { key: 'conversation', label: 'שיחה עם תלמיד',  icon: 'bi-chat-dots',       api: 'addConversation', cats: ['שיחה'] },
    { key: 'meeting',      label: 'אסיפת הורים',    icon: 'bi-people',          api: 'addMeeting',      cats: ['אסיפה'] },
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&"'<>]/g, c => ({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c]));
  }

  function getStudents() {
    if (Array.isArray(window._allStudents) && window._allStudents.length) return window._allStudents;
    try {
      const d = JSON.parse(localStorage.getItem('cheder_bht_data') || '{}');
      if (Array.isArray(d.students)) return d.students;
    } catch {}
    return [];
  }

  function getBehaviorCategories() {
    if (Array.isArray(window._categories) && window._categories.length) return window._categories;
    try {
      const d = JSON.parse(localStorage.getItem('cheder_bht_data') || '{}');
      if (Array.isArray(d.categories)) return d.categories;
    } catch {}
    return [];
  }

  function getRabbis() {
    try {
      const d = JSON.parse(localStorage.getItem('cheder_bht_data') || '{}');
      if (Array.isArray(d.staff)) return d.staff.map(s => s['שם']||s.name).filter(Boolean);
    } catch {}
    return ['הרב ירושלמי', 'הרב יודלוב', 'הרב קליין', 'הרב שניידר'];
  }

  function showModal() {
    // Remove any existing copies
    document.getElementById('unified-report-modal')?.remove();
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());

    const students = getStudents().filter(s => (s['סטטוס']||'פעיל') !== 'סיים');
    const rabbis = getRabbis();

    const html = `
<div class="modal fade" id="unified-report-modal" tabindex="-1" style="z-index:100000">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content" dir="rtl">
      <div class="modal-header" style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff">
        <h5 class="modal-title">📝 דיווח חדש</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label class="form-label fw-bold">מה לדווח?</label>
          <div id="ur-type-buttons" class="d-flex flex-wrap gap-2">
            ${TYPES.map((t, i) => `
              <button type="button" class="btn ${i===0?'btn-primary':'btn-outline-primary'} btn-lg ur-type-btn" data-type="${t.key}">
                <i class="bi ${t.icon}"></i> ${t.label}
              </button>`).join('')}
          </div>
        </div>

        <hr>

        <div class="mb-3">
          <label class="form-label fw-bold">תלמיד</label>
          <input id="ur-student" class="form-control form-control-lg" list="ur-student-list" placeholder="הקלד שם...">
          <datalist id="ur-student-list">
            ${students.map(s => `<option value="${esc(((s['שם פרטי']||'')+' '+(s['שם משפחה']||'')).trim())}"></option>`).join('')}
          </datalist>
          <small class="text-muted">${students.length} תלמידים זמינים</small>
        </div>

        <div class="mb-3" id="ur-cat-row">
          <label class="form-label fw-bold">קטגוריה</label>
          <select id="ur-cat" class="form-select form-select-lg">
            <option value="">בחר...</option>
          </select>
        </div>

        <div class="mb-3" id="ur-rabbi-row" style="display:none">
          <label class="form-label fw-bold">רב</label>
          <select id="ur-rabbi" class="form-select">
            <option value="">בחר רב...</option>
            ${rabbis.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('')}
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold">תיאור</label>
          <textarea id="ur-desc" class="form-control" rows="4" placeholder="מה קרה? פירוט..."></textarea>
        </div>

        <div class="mb-3" id="ur-sev-row">
          <label class="form-label fw-bold">חומרה</label>
          <select id="ur-sev" class="form-select">
            <option value="נמוכה">נמוכה</option>
            <option value="בינונית" selected>בינונית</option>
            <option value="גבוהה">גבוהה</option>
          </select>
        </div>

        <div id="ur-status" class="alert d-none"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button>
        <button type="button" id="ur-save" class="btn btn-success btn-lg" style="min-width:160px">
          💾 שמור דיווח
        </button>
      </div>
    </div>
  </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    const modalEl = document.getElementById('unified-report-modal');

    let currentType = TYPES[0];

    function setType(key) {
      currentType = TYPES.find(t => t.key === key) || TYPES[0];
      // Highlight active button
      modalEl.querySelectorAll('.ur-type-btn').forEach(b => {
        const active = b.dataset.type === currentType.key;
        b.classList.toggle('btn-primary', active);
        b.classList.toggle('btn-outline-primary', !active);
      });
      // Update category dropdown
      const catSel = document.getElementById('ur-cat');
      const catRow = document.getElementById('ur-cat-row');
      if (currentType.cats === 'dynamic') {
        const opts = getBehaviorCategories().map(c => c['קטגוריה'] || c.name).filter(Boolean);
        catSel.innerHTML = '<option value="">בחר קטגוריה...</option>' + opts.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
        catRow.style.display = '';
      } else if (Array.isArray(currentType.cats) && currentType.cats.length === 1) {
        catSel.innerHTML = `<option value="${esc(currentType.cats[0])}" selected>${esc(currentType.cats[0])}</option>`;
        catRow.style.display = 'none';
        catSel.value = currentType.cats[0];
      }
      // Severity is only for behavior
      document.getElementById('ur-sev-row').style.display = currentType.key === 'behavior' ? '' : 'none';
      // Rabbi is for reading/writing/lesson
      document.getElementById('ur-rabbi-row').style.display = ['reading','writing','lesson'].includes(currentType.key) ? '' : 'none';
    }

    // Wire type buttons
    modalEl.querySelectorAll('.ur-type-btn').forEach(btn => {
      btn.onclick = () => setType(btn.dataset.type);
    });
    setType(TYPES[0].key);

    // Wire save — INLINE handler, re-entry guarded
    let inFlight = false;
    const saveBtn = document.getElementById('ur-save');
    const handler = async function (ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      if (inFlight) return;
      inFlight = true;
      await doSave(currentType);
      setTimeout(() => { inFlight = false; }, 2500);
    };
    saveBtn.onclick = handler;
    saveBtn.addEventListener('click', handler);

    // Show
    try {
      const bs = (window.bootstrap && bootstrap.Modal) ? new bootstrap.Modal(modalEl) : null;
      if (bs) bs.show(); else { modalEl.classList.add('show'); modalEl.style.display = 'block'; }
    } catch (e) { modalEl.style.display = 'block'; modalEl.classList.add('show'); }

    setTimeout(() => { document.getElementById('ur-student')?.focus(); }, 200);
  }

  async function doSave(type) {
    const stEl = document.getElementById('ur-status');
    const showStatus = (msg, cls) => { stEl.className = 'alert alert-' + cls; stEl.textContent = msg; stEl.classList.remove('d-none'); };
    const saveBtn = document.getElementById('ur-save');

    const typed = (document.getElementById('ur-student').value || '').trim();
    const cat = document.getElementById('ur-cat').value;
    const desc = (document.getElementById('ur-desc').value || '').trim();
    const sev = document.getElementById('ur-sev')?.value || 'בינונית';
    const rabbi = document.getElementById('ur-rabbi')?.value || '';

    const students = getStudents();
    let stu = students.find(s => `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim() === typed);
    if (!stu && typed) {
      const q = typed.toLowerCase();
      const m = students.filter(s => `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.toLowerCase().includes(q));
      if (m.length === 1) stu = m[0];
    }

    if (!stu) { showStatus('יש להקליד שם תלמיד מהרשימה', 'warning'); return; }
    if (!cat) { showStatus('יש לבחור קטגוריה', 'warning'); return; }
    if (!desc) { showStatus('יש להוסיף תיאור', 'warning'); return; }
    if (['reading','writing','lesson'].includes(type.key) && !rabbi) {
      showStatus('יש לבחור רב', 'warning'); return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ שומר...';
    showStatus('שומר...', 'info');

    const now = new Date();
    const reporter = (function(){ try { return JSON.parse(sessionStorage.getItem('user')||'{}').username||'admin'; } catch { return 'admin'; }})();
    const obj = {
      'מזהה': Math.floor(now.getTime() / 1000) * 1000 + Math.floor(Math.random() * 1000),
      'תלמיד_מזהה': String(stu['מזהה']||''),
      'שם תלמיד': `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim(),
      'קטגוריה': cat,
      'תיאור': desc,
      'חומרה': type.key === 'behavior' ? sev : 'נמוכה',
      'תאריך': now.toISOString(),
      'דווח_עי': reporter,
    };
    if (rabbi) obj['רב'] = rabbi;
    try {
      if (typeof getHebrewInfo === 'function') {
        const info = getHebrewInfo(now);
        obj['תאריך_עברי'] = info.hdate || '';
        obj['פרשה'] = info.parsha || '';
      }
    } catch {}

    let saved = false;
    try {
      if (typeof window.api === 'function') {
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('api timeout 8s')), 8000));
        const r = await Promise.race([window.api(type.api, [obj]), timeout]);
        if (r && r.ok !== false) saved = true;
      }
    } catch (e) {
      console.warn('[unified] api err:', e && e.message);
    }

    // Always also write to localStorage (idempotent by מזהה)
    try {
      const data = JSON.parse(localStorage.getItem('cheder_bht_data') || '{}');
      const targetKey = type.api === 'addBehavior' ? 'behavior'
                     : type.api === 'addConversation' ? 'conversations'
                     : type.api === 'addMeeting' ? 'meetings' : 'behavior';
      if (!Array.isArray(data[targetKey])) data[targetKey] = [];
      const exists = data[targetKey].some(e => String(e['מזהה']||'') === String(obj['מזהה']));
      if (!exists) data[targetKey].push(obj);
      localStorage.setItem('cheder_bht_data', JSON.stringify(data));
      saved = true;
    } catch (e) {
      showStatus('שגיאה: ' + e.message, 'danger');
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 שמור דיווח';
      return;
    }

    // Update in-memory + redraw
    try {
      if (type.api === 'addBehavior') {
        if (!Array.isArray(window._events)) window._events = [];
        window._events.unshift(obj);
        window._events.sort((a,b) => new Date(b['תאריך']) - new Date(a['תאריך']));
        if (typeof window.drawEvents === 'function' && document.getElementById('b-list')) {
          window.drawEvents(window._events.filter(e => e['סטטוס_אישור'] !== 'ממתין לאישור'));
        }
      }
    } catch {}

    showStatus('✓ ' + type.label + ' נשמר בהצלחה!', 'success');
    if (typeof window.toast === 'function') {
      try { window.toast('✓ ' + type.label + ': ' + obj['שם תלמיד'], 'success'); } catch {}
    }

    setTimeout(() => {
      const m = document.getElementById('unified-report-modal');
      if (!m) return;
      try {
        const inst = window.bootstrap && bootstrap.Modal ? bootstrap.Modal.getInstance(m) : null;
        if (inst) inst.hide();
      } catch {}
      setTimeout(() => { try { m.remove(); } catch {} }, 400);
      document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 800);
  }

  // Floating action button on every page
  function addFAB() {
    if (document.getElementById('ur-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'ur-fab';
    fab.title = 'דיווח חדש';
    fab.innerHTML = '📝';
    fab.style.cssText = 'position:fixed;bottom:80px;left:24px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;border:0;font-size:28px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,0.3);z-index:9990;display:flex;align-items:center;justify-content:center';
    fab.onclick = showModal;
    document.body.appendChild(fab);
  }

  // Expose globally for any other code that wants to open it
  window.openUnifiedReport = showModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addFAB, 1000));
  } else {
    setTimeout(addFAB, 1000);
  }

  console.warn('%c📝 unified-report.js — single panel for every category', 'color:#1e3a8a;font-weight:bold;font-size:14px');
})();
