// behavior-pack-97.js — TLA quadrant profile (slide 6: 4-quadrant) + integrative (slide 7). 2026-05-27
(function () {
  'use strict';

  const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי'];
  const MONTHS = ['אלול','חשון','כסלו','טבת','שבט','אדר'];

  function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }
  function escA(s) { return esc(s).replace(/"/g,'&quot;'); }
  function getStudent(sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    return (data.students || []).find(s => String(s['מזהה']) === String(sid));
  }
  function parseTla(s) {
    if (typeof window.parseTlaData === 'function') return window.parseTlaData(s) || {};
    return {};
  }

  // FULL OVERRIDE - rebuild with quadrants
  window.injectTlaTab = function () {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    if (modal.querySelector('#stu-tab-tla')) return;
    const tabsList = modal.querySelector('#stu-tabs');
    const tabsContent = modal.querySelector('.tab-content');
    if (!tabsList || !tabsContent) return;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (!m) return;
    const sid = parseInt(m);
    const student = getStudent(sid);
    if (!student) return;

    const tabLi = document.createElement('li');
    tabLi.className = 'nav-item';
    tabLi.innerHTML = `<a class="nav-link" data-bs-toggle="tab" href="#stu-tab-tla"><i class="bi bi-mortarboard-fill text-warning"></i> תל"א</a>`;
    const profileTab = tabsList.querySelector('a[href="#stu-tab-profile"]');
    if (profileTab) tabsList.insertBefore(tabLi, profileTab.parentNode);
    else tabsList.appendChild(tabLi);

    const pane = document.createElement('div');
    pane.className = 'tab-pane fade';
    pane.id = 'stu-tab-tla';
    pane.innerHTML = buildV7(sid, student);
    tabsContent.appendChild(pane);
  };

  function buildV7(sid, s) {
    const tla = parseTla(s);
    const hasFile = !!s['תלא_pdf_id'];
    const fullName = tla.header?.name || `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const sched = tla.schedule || {};
    const meetings = tla.meetings || {};
    const parents = tla.parents || {};
    const q = tla.profile_quadrants || {};
    const integ = tla.integrative || {};

    if (!document.getElementById('tla-style-97')) {
      const st = document.createElement('style');
      st.id = 'tla-style-97';
      st.textContent = `
        .tla-v7 { font-family:'Heebo',Arial; max-width:1150px; margin:0 auto; padding:10px; }
        .tla-v7 .tla-slide { background:#fff; border:2px solid #1e3a8a; border-radius:10px; margin-bottom:18px; overflow:hidden; position:relative; }
        .tla-v7 .tla-slide-num { position:absolute; top:10px; left:10px; background:#fbbf24; color:#1e3a8a; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; }
        .tla-v7 .tla-header { background:linear-gradient(135deg,#1e3a8a,#3b82f6); color:#fff; padding:12px 46px 12px 14px; font-size:17px; font-weight:bold; }
        .tla-v7 .tla-body { padding:12px; }
        .tla-v7 table.tla-g { width:100%; border-collapse:collapse; font-size:12px; }
        .tla-v7 table.tla-g th { background:#fbbf24; color:#1e3a8a; padding:5px 4px; border:1px solid #1e3a8a; }
        .tla-v7 table.tla-g td { padding:4px; border:1px solid #cbd5e1; vertical-align:top; }
        .tla-v7 table.tla-g td.tla-time { background:#f3f4f6; font-weight:bold; text-align:center; white-space:nowrap; width:90px; font-family:monospace; }
        .tla-v7 table.tla-g td.tla-month { background:#fef3c7; font-weight:bold; text-align:center; width:80px; }
        .tla-v7 .tla-quad { display:grid; grid-template-columns:1fr 1fr; gap:0; border:2px solid #1e3a8a; border-radius:6px; overflow:hidden; }
        .tla-v7 .tla-quad-cell { padding:0; border:1px solid #cbd5e1; background:#fff; }
        .tla-v7 .tla-quad-label { background:#fbbf24; color:#1e3a8a; padding:6px 8px; font-weight:bold; font-size:13px; }
        .tla-v7 .tla-quad-content { padding:8px; font-size:12px; }
        .tla-v7 textarea, .tla-v7 input[type=text] { width:100%; border:0; background:transparent; resize:vertical; font-family:inherit; font-size:12px; outline:none; padding:3px; }
        .tla-v7 textarea:focus, .tla-v7 input:focus { background:#fffbeb; outline:1px solid #fbbf24; }
        .tla-v7 .toolbar-v7 { position:sticky; top:0; z-index:10; background:#fff; border-bottom:1px solid #e5e7eb; padding:8px; margin-bottom:8px; }
        @media print {
          .tla-v7 .no-print { display:none !important; }
          .tla-v7 .tla-slide { page-break-after:always; }
          .tla-v7 .tla-slide:last-child { page-break-after:auto; }
          .tla-v7 textarea, .tla-v7 input { background:transparent !important; outline:0 !important; }
        }
      `;
      document.head.appendChild(st);
    }

    const timeSlots = Object.keys(sched);
    const scheduleTable = timeSlots.length ? `
      <table class="tla-g"><thead><tr><th>שעה</th>${DAYS.map(d=>`<th>${esc(d)}</th>`).join('')}</tr></thead>
        <tbody>${timeSlots.map(ts=>`<tr><td class="tla-time">${esc(ts)}</td>${
          DAYS.map(day=>{
            const cell = sched[ts]?.[day] || {};
            return `<td><textarea id="tla-sch-${sid}-${ts}-${day}-main" rows="2" placeholder="—">${esc(cell.main || '')}</textarea>${cell.individual?`<div style="color:#dc2626;font-size:10px;margin-top:2px">+ ${esc(cell.individual)}</div>`:''}</td>`;
          }).join('')
        }</tr>`).join('')}</tbody></table>
    ` : '<div class="text-muted">אין מערכת שעות.</div>';

    return `
      <div class="tla-v7" id="tla-doc-${sid}">
        <div class="toolbar-v7 d-flex justify-content-between flex-wrap gap-2 no-print">
          <strong>תיק תל"א — ${esc(fullName)} · שיעור ${esc(s['מחזור']||'')} · תשפ"ו</strong>
          <div class="d-flex gap-2">
            ${hasFile?`<a class="btn btn-sm btn-outline-primary" href="${escA(s['תלא_pdf_url'])}" target="_blank"><i class="bi bi-file-pdf"></i> PPTX מקור</a>`:''}
            <button class="btn btn-sm btn-success" onclick="window.tlaSaveForm(${sid})"><i class="bi bi-save"></i> שמור</button>
            <button class="btn btn-sm btn-warning" onclick="window.tlaPrintForm(${sid})"><i class="bi bi-printer"></i> PDF</button>
          </div>
        </div>

        <!-- 1. כיסוי -->
        <div class="tla-slide">
          <div class="tla-slide-num">1</div>
          <div class="tla-header">תיק תלמיד שיעור — שנה"ל תשפ"ו</div>
          <div class="tla-body" style="font-size:18px;line-height:2;text-align:center">
            <div>שם התלמיד: <input id="tla-name-${sid}" type="text" value="${escA(fullName)}" style="width:280px;border-bottom:2px solid #1e3a8a;text-align:center"></div>
            <div class="mt-3">ת.ז.: <input id="tla-tz-${sid}" type="text" value="${escA(tla.header?.tz || s['תז'] || '')}" style="width:180px;border-bottom:2px solid #1e3a8a;text-align:center"></div>
          </div>
        </div>

        <!-- 2. מערכת שעות -->
        <div class="tla-slide">
          <div class="tla-slide-num">2</div>
          <div class="tla-header">מערכת שעות אישית</div>
          <div class="tla-body">
            <div class="small text-muted mb-2">סמן בבולט שיעורים אינדוודואליים (קריאה, פרא רפואי, טיפול רגשי וכו')</div>
            ${scheduleTable}
          </div>
        </div>

        <!-- 3. ישיבות צוות -->
        <div class="tla-slide">
          <div class="tla-slide-num">3</div>
          <div class="tla-header">תיעוד ישיבות צוות</div>
          <div class="tla-body">
            <table class="tla-g">
              <thead><tr><th style="width:80px">חודש</th><th style="width:30%">משתתפים</th><th>סיכום והמלצות</th></tr></thead>
              <tbody>${MONTHS.map(ch=>{
                const m = meetings[ch]||{};
                return `<tr><td class="tla-month">${esc(ch)}</td><td><textarea id="tla-mtg-${ch}-participants-${sid}" rows="2">${esc(m.participants||'')}</textarea></td><td><textarea id="tla-mtg-${ch}-summary-${sid}" rows="2">${esc(m.summary||'')}</textarea></td></tr>`;
              }).join('')}</tbody>
            </table>
          </div>
        </div>

        <!-- 4. שיחות הורים -->
        <div class="tla-slide">
          <div class="tla-slide-num">4</div>
          <div class="tla-header">תיעוד שיחות הורים</div>
          <div class="tla-body">
            <table class="tla-g">
              <thead><tr><th style="width:80px">חודש</th><th>סיכום השיחות</th></tr></thead>
              <tbody>${MONTHS.map(ch=>`<tr><td class="tla-month">${esc(ch)}</td><td><textarea id="tla-prnt-${ch}-${sid}" rows="2">${esc(parents[ch]||'')}</textarea></td></tr>`).join('')}</tbody>
            </table>
          </div>
        </div>

        <!-- 5. פרופיל - 4 רביעים -->
        <div class="tla-slide">
          <div class="tla-slide-num">5</div>
          <div class="tla-header">דף הכנה לתל"א — פרופיל תלמיד</div>
          <div class="tla-body">
            <table class="tla-g mb-3">
              <tr>
                <td style="background:#dbeafe"><b>מחנך:</b> <input id="tla-mech-${sid}" type="text" value="${escA(tla.profile_header?.mechanech || 'הרב יוסף סורוצקין')}" style="width:160px"></td>
                <td style="background:#dbeafe"><b>שנה"ל:</b> תשפ"ו</td>
                <td style="background:#dbeafe"><b>שיעור:</b> ${esc(s['מחזור']||tla.profile_header?.class||'')}</td>
                <td style="background:#dbeafe"><b>שם:</b> ${esc(fullName)}</td>
              </tr>
            </table>
            <div class="tla-quad">
              <div class="tla-quad-cell">
                <div class="tla-quad-label">נתונים סביבתיים</div>
                <div class="tla-quad-content"><textarea id="tla-env-${sid}" rows="6" placeholder="הרכב משפחה, מצב כלכלי...">${esc(q.environmental||'')}</textarea></div>
              </div>
              <div class="tla-quad-cell">
                <div class="tla-quad-label">רקע מוגבלות</div>
                <div class="tla-quad-content"><textarea id="tla-bg-${sid}" rows="6" placeholder="IQ, אבחנות, ליקויים...">${esc(q.background||'')}</textarea></div>
              </div>
              <div class="tla-quad-cell">
                <div class="tla-quad-label">מוקדי כוח</div>
                <div class="tla-quad-content"><textarea id="tla-sfocus-${sid}" rows="6" placeholder="חוזקות לימודיות, חברתיות, רגשיות...">${esc(q.strengths_focus||'')}</textarea></div>
              </div>
              <div class="tla-quad-cell">
                <div class="tla-quad-label">מוקדים לחיזוק</div>
                <div class="tla-quad-content"><textarea id="tla-ifocus-${sid}" rows="6" placeholder="נושאים לעבודה ולשיפור...">${esc(q.improve_focus||'')}</textarea></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 6. תל"א אינטגרטיבי -->
        <div class="tla-slide">
          <div class="tla-slide-num">6</div>
          <div class="tla-header">תל"א אינטגרטיבי — תוכנית לימודים אישית</div>
          <div class="tla-body">
            <div class="row g-2 mb-3">
              <div class="col-md-4"><label class="small fw-bold">תחום:</label>
                <input id="tla-domain-${sid}" type="text" value="${escA(integ.domain || 'לימודי / רגשי')}" style="width:100%;border:1px solid #1e3a8a;border-radius:4px;padding:4px"></div>
              <div class="col-md-8"><label class="small fw-bold">קו בסיס:</label>
                <textarea id="tla-baseline-${sid}" rows="2" style="border:1px solid #1e3a8a;border-radius:4px;padding:4px;width:100%">${esc(integ.baseline||'')}</textarea></div>
            </div>
            <div class="mb-3">
              <label class="small fw-bold">מטרות-על:</label>
              <textarea id="tla-goals-${sid}" rows="2" style="border:1px solid #1e3a8a;border-radius:4px;padding:4px;width:100%">${esc(integ.goals||'')}</textarea>
            </div>
            <table class="tla-g">
              <thead><tr><th style="width:33%">יעדים</th><th style="width:34%">הזדמנויות עבודה ואמצעים להשגתם</th><th style="width:33%">מעקב והערכה</th></tr></thead>
              <tbody><tr>
                <td><textarea id="tla-targets-${sid}" rows="6">${esc(integ.targets||'')}</textarea></td>
                <td><textarea id="tla-opp-${sid}" rows="6">${esc(integ.opportunities||'')}</textarea></td>
                <td><textarea id="tla-track-${sid}" rows="6">${esc(integ.tracking||'')}</textarea></td>
              </tr></tbody>
            </table>
            <div class="row g-2 mt-3">
              <div class="col-md-6"><label class="small fw-bold">הערות, שינויים משמעותיים במהלך השנה:</label>
                <textarea id="tla-changes-${sid}" rows="3" style="border:1px solid #cbd5e1;border-radius:4px;padding:4px;width:100%">${esc(tla.changes_notes||tla.changes||'')}</textarea></div>
              <div class="col-md-6"><label class="small fw-bold">המלצות:</label>
                <textarea id="tla-rec-${sid}" rows="3" style="border:1px solid #cbd5e1;border-radius:4px;padding:4px;width:100%">${esc(tla.recommendations||'')}</textarea></div>
            </div>
            <div class="mt-3 pt-3" style="border-top:1px dashed #cbd5e1">
              <b>חתימת הורים:</b> <input id="tla-sig-${sid}" type="text" value="${escA(integ.parents_signature||'')}" style="width:300px;border-bottom:2px solid #1e3a8a">
            </div>
          </div>
        </div>

        <div class="text-end small text-muted no-print">
          עדכון אחרון: ${esc(s['תלא_עודכן'] ? new Date(s['תלא_עודכן']).toLocaleString('he-IL') : 'לא עודכן')}
        </div>
      </div>
    `;
  }

  // Override save to include new fields
  const _origSave = window.tlaSaveForm;
  window.tlaSaveForm = async function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return alert('תלמיד לא נמצא');
    function v(id) { return document.getElementById(`tla-${id}-${sid}`)?.value || ''; }

    const oldTla = (typeof window.parseTlaData === 'function' ? window.parseTlaData(s) : {}) || {};
    const sched = oldTla.schedule || {};
    Object.keys(sched).forEach(ts => {
      Object.keys(sched[ts] || {}).forEach(day => {
        const el = document.getElementById(`tla-sch-${sid}-${ts}-${day}-main`);
        if (el) sched[ts][day].main = el.value;
      });
    });

    const meetings = {};
    MONTHS.forEach(ch => {
      meetings[ch] = {
        participants: document.getElementById(`tla-mtg-${ch}-participants-${sid}`)?.value || '',
        summary: document.getElementById(`tla-mtg-${ch}-summary-${sid}`)?.value || '',
      };
    });
    const parents = {};
    MONTHS.forEach(ch => { parents[ch] = document.getElementById(`tla-prnt-${ch}-${sid}`)?.value || ''; });

    const newTla = {
      header: { name: v('name'), tz: v('tz'), year: 'תשפ"ו' },
      profile_header: { mechanech: v('mech'), year: 'תשפ"ו', class: s['מחזור']||'', name: v('name') },
      schedule: sched,
      meetings,
      parents,
      profile_quadrants: {
        environmental: v('env'),
        background: v('bg'),
        strengths_focus: v('sfocus'),
        improve_focus: v('ifocus'),
      },
      integrative: {
        domain: v('domain'),
        baseline: v('baseline'),
        goals: v('goals'),
        targets: v('targets'),
        opportunities: v('opp'),
        tracking: v('track'),
        parents_signature: v('sig'),
      },
      changes_notes: v('changes'),
      recommendations: v('rec'),
    };

    const existing = (s['דוח_אישי'] || '').replace(/\[TLA_JSON_START\][\s\S]*?\[TLA_JSON_END\]/g, '').trim();
    const newDoch = (existing ? existing + '\n\n' : '') + `[TLA_JSON_START]${JSON.stringify(newTla)}[TLA_JSON_END]`;

    const updated = Object.assign({}, s, {
      'דוח_אישי': newDoch,
      'תז': v('tz') || s['תז'] || '',
    });

    const r = await api('updateStudent', [updated]);
    if (r && r.ok !== false) {
      if (typeof toast === 'function') toast('תל"א נשמר ✓', 'success');
      else alert('✓ נשמר');
    } else {
      alert('שגיאה: ' + (r?.error || '?'));
    }
  };

  window.tlaPrintForm = function (sid) {
    const docEl = document.getElementById(`tla-doc-${sid}`);
    if (!docEl) return alert('פתח את הטאב תל"א');
    const w = window.open('', '_blank', 'width=1200,height=1400');
    const values = {};
    docEl.querySelectorAll('textarea, input').forEach(el => { if (el.id) values[el.id] = el.value; });
    const clone = docEl.cloneNode(true);
    clone.querySelectorAll('textarea, input').forEach(el => {
      if (el.id && values[el.id] !== undefined) {
        if (el.tagName === 'TEXTAREA') el.textContent = values[el.id];
        else el.setAttribute('value', values[el.id]);
      }
    });
    const style = document.getElementById('tla-style-97')?.textContent || '';
    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>תל"א PDF</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>body{font-family:'Heebo',Arial;padding:0;direction:rtl}${style}@media print{body{padding:0}}</style>
      </head><body>${clone.outerHTML}<script>setTimeout(()=>window.print(),700)<\/script></body></html>`);
    w.document.close();
  };

  console.warn('%c📐 Pack-97 — TLA: 4-quadrant profile + integrative (yedim/opp/tracking) + parents-signature', 'color:#1e3a8a;font-weight:bold;font-size:14px');
})();
