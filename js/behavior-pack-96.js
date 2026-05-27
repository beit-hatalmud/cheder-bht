// behavior-pack-96.js — TLA EXACT match to PPTX: schedule grid + all sections + print-perfect. 2026-05-27
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
    const doch = s['דוח_אישי'] || '';
    const m = doch.match(/\[TLA_JSON_START\]([\s\S]*?)\[TLA_JSON_END\]/);
    if (m) { try { return JSON.parse(m[1]); } catch {} }
    return {};
  }

  // OVERRIDE injectTlaTab with full PPTX-matching design
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
    pane.innerHTML = buildExactPptx(sid, student);
    tabsContent.appendChild(pane);
  };

  function buildExactPptx(sid, s) {
    const tla = parseTla(s);
    const hasFile = !!s['תלא_pdf_id'];
    const fullName = tla.header?.name || `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const sched = tla.schedule || {};
    const meetings = tla.meetings || {};
    const parents = tla.parents || {};

    if (!document.getElementById('tla-pptx-style-96')) {
      const st = document.createElement('style');
      st.id = 'tla-pptx-style-96';
      st.textContent = `
        .tla-doc-v6 { font-family: 'Heebo','Arial',sans-serif; max-width: 1100px; margin: 0 auto; padding: 12px; background: #fff; }
        .tla-doc-v6 .tla-slide { background: #fff; border: 2px solid #1e3a8a; border-radius: 12px; margin-bottom: 24px; overflow: hidden; }
        .tla-doc-v6 .tla-slide-num { position: absolute; top: 12px; left: 12px; background: #fbbf24; color: #1e3a8a; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; }
        .tla-doc-v6 .tla-slide-header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; padding: 14px 50px 14px 16px; font-size: 18px; font-weight: bold; position: relative; }
        .tla-doc-v6 .tla-slide-body { padding: 14px; }
        .tla-doc-v6 table.tla-grid { width: 100%; border-collapse: collapse; font-size: 12px; }
        .tla-doc-v6 table.tla-grid th { background: #fbbf24; color: #1e3a8a; padding: 6px 4px; border: 1px solid #1e3a8a; font-weight: bold; text-align: center; }
        .tla-doc-v6 table.tla-grid td { padding: 4px; border: 1px solid #cbd5e1; vertical-align: top; }
        .tla-doc-v6 table.tla-grid td.tla-time { background: #f3f4f6; font-weight: bold; text-align: center; white-space: nowrap; width: 90px; font-family: monospace; }
        .tla-doc-v6 table.tla-grid td.tla-month-cell { background: #fef3c7; font-weight: bold; text-align: center; width: 80px; }
        .tla-doc-v6 textarea, .tla-doc-v6 input[type=text] { width: 100%; border: 0; background: transparent; resize: vertical; font-family: inherit; font-size: 12px; padding: 3px; outline: none; min-height: 24px; }
        .tla-doc-v6 textarea:focus, .tla-doc-v6 input:focus { background: #fffbeb; outline: 1px solid #fbbf24; border-radius: 3px; }
        .tla-doc-v6 .tla-toolbar { position: sticky; top: 0; background: #fff; padding: 8px; z-index: 10; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px; }
        .tla-doc-v6 .tla-sub { display: block; color: #6b7280; font-size: 10px; margin-top: 1px; }
        @media print {
          .tla-doc-v6 .no-print { display: none !important; }
          .tla-doc-v6 .tla-slide { page-break-after: always; box-shadow: none; }
          .tla-doc-v6 .tla-slide:last-child { page-break-after: auto; }
          .tla-doc-v6 textarea, .tla-doc-v6 input { background: transparent !important; outline: 0 !important; border: 0; }
        }
      `;
      document.head.appendChild(st);
    }

    // Slide 2 schedule table - we have time slots from tla.schedule keys
    const timeSlots = Object.keys(sched);
    const scheduleHtml = timeSlots.length ? `
      <table class="tla-grid">
        <thead><tr><th>שעה</th>${DAYS.map(d => `<th>${esc(d)}</th>`).join('')}</tr></thead>
        <tbody>
          ${timeSlots.map(ts => `
            <tr>
              <td class="tla-time">${esc(ts)}</td>
              ${DAYS.map(day => {
                const cell = sched[ts]?.[day] || {main:'', individual:''};
                return `<td>
                  <textarea id="tla-sch-${sid}-${ts}-${day}-main" rows="2" placeholder="...">${esc(cell.main || '')}</textarea>
                  ${cell.individual ? `<span class="tla-sub">+ ${esc(cell.individual)}</span>` : ''}
                </td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : `<div class="text-muted small">אין נתוני מערכת שעות. <a href="#" onclick="document.getElementById('tla-add-schedule-${sid}').style.display='block';return false;">הוסף ידנית</a></div>`;

    return `
      <div class="tla-doc-v6" id="tla-doc-${sid}">
        <div class="tla-toolbar d-flex justify-content-between flex-wrap gap-2 no-print">
          <div>
            <strong>תיק תל"א — ${esc(fullName)}</strong>
            <small class="text-muted">· שיעור ${esc(s['מחזור']||'')} · תשפ"ו</small>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            ${hasFile ? `<a class="btn btn-sm btn-outline-primary" href="${escA(s['תלא_pdf_url'])}" target="_blank"><i class="bi bi-file-pdf"></i> מקור</a>` : ''}
            <button class="btn btn-sm btn-success" onclick="window.tlaSaveForm(${sid})"><i class="bi bi-save"></i> שמור</button>
            <button class="btn btn-sm btn-warning" onclick="window.tlaPrintForm(${sid})"><i class="bi bi-printer"></i> הדפס PDF</button>
          </div>
        </div>

        <!-- Slide 1 (cover) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">1</div>
          <div class="tla-slide-header">תיק תלמיד שיעור — שנה"ל תשפ"ו</div>
          <div class="tla-slide-body" style="font-size:18px;line-height:2">
            <div>שם התלמיד: <input id="tla-name-${sid}" type="text" value="${escA(fullName)}" style="width:300px;border-bottom:2px solid #1e3a8a;text-align:center"></div>
            <div class="mt-3">ת.ז.: <input id="tla-tz-${sid}" type="text" value="${escA(tla.header?.tz || s['תז'] || '')}" style="width:200px;border-bottom:2px solid #1e3a8a;text-align:center"></div>
          </div>
        </div>

        <!-- Slide 2 (schedule) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">2</div>
          <div class="tla-slide-header">מערכת שעות אישית</div>
          <div class="tla-slide-body">
            <div class="small text-muted mb-2">יש למלא את מערכת השעות בכיתה, ולסמן בצורה בולטת שיעורים אינדוודואליים (קריאה, פרא רפואי, טיפול רגשי וכו')</div>
            ${scheduleHtml}
          </div>
        </div>

        <!-- Slides 3-4 (Team meetings) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">3</div>
          <div class="tla-slide-header">תיעוד ישיבות צוות</div>
          <div class="tla-slide-body">
            <table class="tla-grid">
              <thead><tr><th style="width:80px">חודש</th><th style="width:30%">משתתפים</th><th>סיכום והמלצות</th></tr></thead>
              <tbody>
                ${MONTHS.map(ch => {
                  const m = meetings[ch] || {participants:'', summary:''};
                  return `<tr>
                    <td class="tla-month-cell">${esc(ch)}</td>
                    <td><textarea id="tla-mtg-${ch}-participants-${sid}" rows="2">${esc(m.participants || '')}</textarea></td>
                    <td><textarea id="tla-mtg-${ch}-summary-${sid}" rows="2">${esc(m.summary || '')}</textarea></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Slide 5 (Parent meetings) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">5</div>
          <div class="tla-slide-header">תיעוד שיחות הורים</div>
          <div class="tla-slide-body">
            <table class="tla-grid">
              <thead><tr><th style="width:80px">חודש</th><th>סיכום השיחות</th></tr></thead>
              <tbody>
                ${MONTHS.map(ch => `
                  <tr>
                    <td class="tla-month-cell">${esc(ch)}</td>
                    <td><textarea id="tla-prnt-${ch}-${sid}" rows="2">${esc(parents[ch] || '')}</textarea></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Slide 6 (Profile) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">6</div>
          <div class="tla-slide-header">דף הכנה לתל"א — פרופיל תלמיד</div>
          <div class="tla-slide-body">
            <table class="tla-grid mb-3">
              <tr>
                <td><strong>מחנך:</strong> <input id="tla-mech-${sid}" type="text" value="${escA(tla.profile_header?.mechanech || 'הרב יוסף סורוצקין')}"></td>
                <td><strong>שנה"ל:</strong> תשפ"ו</td>
                <td><strong>שיעור:</strong> ${esc(s['מחזור']||'')}</td>
                <td><strong>שם:</strong> ${esc(fullName)}</td>
              </tr>
            </table>
            <table class="tla-grid">
              <thead><tr><th style="width:25%">תחום</th><th>תוכן</th></tr></thead>
              <tbody>
                <tr><td class="tla-month-cell">רקע סביבתי / משפחתי</td><td><textarea id="tla-bg-${sid}" rows="3">${esc(tla.profile?.background || '')}</textarea></td></tr>
                <tr><td class="tla-month-cell">תפקוד אינטלקטואלי</td><td><textarea id="tla-intel-${sid}" rows="3">${esc(tla.profile?.intellect || '')}</textarea></td></tr>
                <tr><td class="tla-month-cell">תפקודים אקדמיים</td><td><textarea id="tla-acad-${sid}" rows="3">${esc(tla.profile?.academic || '')}</textarea></td></tr>
                <tr><td class="tla-month-cell">תלמידאיות</td><td><textarea id="tla-talm-${sid}" rows="3">${esc(tla.profile?.talmidut || '')}</textarea></td></tr>
                <tr><td class="tla-month-cell">תפקודים רגשיים וחברתיים</td><td><textarea id="tla-soc-${sid}" rows="3">${esc(tla.profile?.social || '')}</textarea></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Slide 7 (Integrative TLA) -->
        <div class="tla-slide" style="position:relative">
          <div class="tla-slide-num">7</div>
          <div class="tla-slide-header">תל"א אינטגרטיבי — תוכנית לימודים אישית</div>
          <div class="tla-slide-body">
            <table class="tla-grid">
              <thead>
                <tr>
                  <th style="width:18%">תחום</th>
                  <th style="width:22%">קו בסיס</th>
                  <th style="width:22%">מטרות-על</th>
                  <th style="width:22%">הזדמנויות עבודה ואמצעים</th>
                  <th style="width:16%">מעקב והערכה</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="tla-month-cell">לימודי</td>
                  <td><textarea id="tla-baseline-${sid}" rows="4">${esc(tla.program?.baseline || '')}</textarea></td>
                  <td><textarea id="tla-goals-${sid}" rows="4">${esc(tla.program?.goals || '')}</textarea></td>
                  <td><textarea id="tla-opp-${sid}" rows="4">${esc(tla.program?.opportunities || '')}</textarea></td>
                  <td><textarea id="tla-eval-${sid}" rows="4">${esc(tla.program?.evaluation || '')}</textarea></td>
                </tr>
                <tr>
                  <td class="tla-month-cell">רגשי</td>
                  <td colspan="4"><textarea id="tla-emotional-${sid}" rows="2">${esc(tla.program?.emotional || '')}</textarea></td>
                </tr>
                <tr>
                  <td class="tla-month-cell">חיזוק יכולות וכישורים</td>
                  <td colspan="4"><textarea id="tla-strengths-${sid}" rows="2">${esc(tla.program?.strengths || '')}</textarea></td>
                </tr>
                <tr>
                  <td class="tla-month-cell">הערכה מסכמת</td>
                  <td colspan="4"><textarea id="tla-summary-${sid}" rows="2">${esc(tla.program?.summary || '')}</textarea></td>
                </tr>
              </tbody>
            </table>
            <div class="mt-3">
              <div class="small fw-bold mb-1">המלצות, הערות ושינויים משמעותיים במהלך השנה:</div>
              <textarea id="tla-changes-${sid}" rows="3" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:6px">${esc(tla.changes || '')}</textarea>
            </div>
          </div>
        </div>

        <div class="text-end small text-muted mt-2 no-print">
          עדכון אחרון: ${esc(s['תלא_עודכן'] ? new Date(s['תלא_עודכן']).toLocaleString('he-IL') : 'מעולם לא')}
        </div>
      </div>
    `;
  }

  // Override save to capture all fields including schedule
  window.tlaSaveForm = async function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return alert('תלמיד לא נמצא');
    function v(id) { return document.getElementById(`tla-${id}-${sid}`)?.value || ''; }

    const oldTla = (typeof window.parseTlaData === 'function' ? window.parseTlaData(s) : {}) || {};

    // Schedule - keep existing structure, update from inputs
    const sched = oldTla.schedule || {};
    Object.keys(sched).forEach(ts => {
      Object.keys(sched[ts] || {}).forEach(day => {
        const el = document.getElementById(`tla-sch-${sid}-${ts}-${day}-main`);
        if (el) sched[ts][day].main = el.value;
      });
    });

    // Meetings
    const meetings = {};
    ['אלול','חשון','כסלו','טבת','שבט','אדר'].forEach(ch => {
      meetings[ch] = {
        participants: document.getElementById(`tla-mtg-${ch}-participants-${sid}`)?.value || '',
        summary: document.getElementById(`tla-mtg-${ch}-summary-${sid}`)?.value || '',
      };
    });

    const parents = {};
    ['אלול','חשון','כסלו','טבת','שבט','אדר'].forEach(ch => {
      parents[ch] = document.getElementById(`tla-prnt-${ch}-${sid}`)?.value || '';
    });

    const newTla = {
      header: { name: v('name'), tz: v('tz'), shiur: s['מחזור'] || '', year: 'תשפ"ו' },
      profile_header: { mechanech: v('mech') || oldTla.profile_header?.mechanech || 'הרב סורוצקין' },
      schedule: sched,
      meetings,
      parents,
      profile: {
        background: v('bg'),
        intellect: v('intel'),
        academic: v('acad'),
        talmidut: v('talm'),
        social: v('soc'),
      },
      program: {
        baseline: v('baseline'),
        goals: v('goals'),
        opportunities: v('opp'),
        evaluation: v('eval'),
        emotional: v('emotional'),
        strengths: v('strengths'),
        summary: v('summary'),
      },
      changes: v('changes'),
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

  console.warn('%c📄 Pack-96 — TLA FULL match to PPTX (7 slides: cover/schedule/meetings/parents/profile/integrative)', 'color:#1e3a8a;font-weight:bold;font-size:14px');
})();
