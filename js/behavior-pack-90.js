// behavior-pack-90.js — Full TLA tab: structured form matching original PPTX/PDF template. 2026-05-27
// Replaces pack-66's iframe-only view with a proper data-entry form.
// Saves to תלמידים sheet via existing fields (תלא_*) prefixed.
(function () {
  'use strict';

  const MONTHS = ['אלול', 'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב'];
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
  const TIME_SLOTS = ['8:30-9:30', '9:30-10:00', '10:00-10:50', '11:20-12:00', '12:30-13:00', '14:15-14:55', '15:30-16:00'];

  function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }
  function escA(s) { return esc(s).replace(/"/g,'&quot;'); }

  function getStudent(sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    return (data.students || []).find(s => String(s['מזהה']) === String(sid));
  }

  // Override pack-66's injectTlaTab with full form
  window.injectTlaTab = injectTlaTabFull;

  function injectTlaTabFull() {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    if (modal.querySelector('#stu-tab-tla')) return;
    const tabsList = modal.querySelector('#stu-tabs');
    const tabsContent = modal.querySelector('.tab-content');
    if (!tabsList || !tabsContent) return;

    let sid = null;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (m) sid = parseInt(m);
    if (!sid) return;

    const student = getStudent(sid);
    if (!student) return;

    // Add tab link before פרופיל
    const tabLi = document.createElement('li');
    tabLi.className = 'nav-item';
    tabLi.innerHTML = `<a class="nav-link" data-bs-toggle="tab" href="#stu-tab-tla"><i class="bi bi-mortarboard-fill text-warning"></i> תל"א</a>`;
    const profileTab = tabsList.querySelector('a[href="#stu-tab-profile"]');
    if (profileTab) tabsList.insertBefore(tabLi, profileTab.parentNode);
    else tabsList.appendChild(tabLi);

    const pane = document.createElement('div');
    pane.className = 'tab-pane fade';
    pane.id = 'stu-tab-tla';
    pane.innerHTML = buildTlaFormHtml(sid, student);
    tabsContent.appendChild(pane);

    // Init listeners after DOM insertion
    setTimeout(() => initTlaFormListeners(sid), 50);
  }

  function buildTlaFormHtml(sid, s) {
    const tla = parseTlaData(s);
    const hasFile = !!s['תלא_pdf_id'];
    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const meetings = tla.meetings || {};
    const parents = tla.parents || {};
    const schedule = tla.schedule || {};
    const profile = tla.profile || {};
    const program = tla.program || {};

    return `
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 class="mb-0"><i class="bi bi-mortarboard-fill text-warning"></i> תוכנית לימודית אישית (תל"א)</h5>
        <div class="d-flex gap-2 flex-wrap">
          ${hasFile ? `
            <a class="btn btn-sm btn-outline-primary" href="${escA(s['תלא_pdf_url'])}" target="_blank"><i class="bi bi-file-pdf"></i> PDF מקורי</a>
            <a class="btn btn-sm btn-outline-info" href="${escA(s['תלא_pptx_url'])}" target="_blank"><i class="bi bi-file-ppt"></i> PPTX</a>
          ` : ''}
          <button class="btn btn-sm btn-success" onclick="window.tlaSaveForm(${sid})"><i class="bi bi-save"></i> שמור</button>
          <button class="btn btn-sm btn-outline-secondary" onclick="window.tlaPrintForm(${sid})"><i class="bi bi-printer"></i> הדפס</button>
        </div>
      </div>

      <div class="alert alert-warning small">
        <i class="bi bi-info-circle"></i> תיק תל"א עבור <b>${esc(fullName)}</b> · שיעור ${esc(s['מחזור']||'')}
        ${hasFile ? '· יש קובץ מקורי ב-Drive (לחץ "PDF מקורי" לעיון).' : '· אין קובץ מקורי - יוצרים חדש.'}
      </div>

      <!-- 1. פרטים אישיים -->
      <div class="card mb-3">
        <div class="card-header bg-light"><b>1. פרטים אישיים</b></div>
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-4"><label class="form-label small">שם דליה</label><input id="tla-fullname-${sid}" class="form-control form-control-sm" value="${escA(fullName)}"></div>
            <div class="col-md-3"><label class="form-label small">ת.ז.</label><input id="tla-tz-${sid}" class="form-control form-control-sm" value="${escA(s['תז']||'')}"></div>
            <div class="col-md-2"><label class="form-label small">שיעור</label><input id="tla-shiur-${sid}" class="form-control form-control-sm" value="${escA(s['מחזור']||'')}"></div>
            <div class="col-md-3"><label class="form-label small">מחנך</label><input id="tla-mechanech-${sid}" class="form-control form-control-sm" value="${escA(tla.mechanech || 'הרב סורוצקין')}"></div>
          </div>
        </div>
      </div>

      <!-- 2. פרופיל תלמיד -->
      <div class="card mb-3">
        <div class="card-header bg-light"><b>2. פרופיל תלמיד (דף הכנה לתל"א)</b></div>
        <div class="card-body">
          <div class="mb-2"><label class="form-label small fw-bold">רקע סביבתי / משפחתי</label>
            <textarea id="tla-background-${sid}" class="form-control form-control-sm" rows="2" placeholder="הרכב משפחה, מצב כלכלי, מצב הילד במשפחה...">${esc(profile.background || s['פרופיל_הורים'] || '')}</textarea>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">תפקוד אינטלקטואלי</label>
            <textarea id="tla-intellect-${sid}" class="form-control form-control-sm" rows="2" placeholder="דוקפוד IQ ממוצע ע"פ אינדקסים, יישומי, ביטוי...">${esc(profile.intellect || '')}</textarea>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">תפקודים אקדמיים</label>
            <textarea id="tla-academic-${sid}" class="form-control form-control-sm" rows="3" placeholder="קריאה (קצב, דיוק), כתיבה (תוצרים, שגיאות), הבנה בארמא, חשיבה והסקת מסקנות, בקרה עצמית...">${esc(profile.academic || s['פרופיל_לימודי'] || '')}</textarea>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">תלמידאיות (מוטיבציה, ארגון)</label>
            <textarea id="tla-talmidut-${sid}" class="form-control form-control-sm" rows="2" placeholder="מוטיבציה ללמידה, ארגון, מודעות עצמית...">${esc(profile.talmidut || '')}</textarea>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">תפקודים רגשיים וחברתיים</label>
            <textarea id="tla-social-${sid}" class="form-control form-control-sm" rows="2" placeholder="יחס לאחר, גבולות וסמכות, התמודדות עם תסכול...">${esc(profile.social || s['פרופיל_אישיות'] || '')}</textarea>
          </div>
        </div>
      </div>

      <!-- 3. תל"א אינטגרטיבי -->
      <div class="card mb-3">
        <div class="card-header bg-light"><b>3. תל"א אינטגרטיבי - תוכנית לימודים אישית</b></div>
        <div class="card-body">
          <div class="row g-2 mb-2">
            <div class="col-md-6"><label class="form-label small fw-bold">קו בסיס</label>
              <textarea id="tla-baseline-${sid}" class="form-control form-control-sm" rows="3" placeholder="היכן התלמיד עומד כעת לימודית ורגשית">${esc(program.baseline || '')}</textarea>
            </div>
            <div class="col-md-6"><label class="form-label small fw-bold">מטרות-על</label>
              <textarea id="tla-goals-${sid}" class="form-control form-control-sm" rows="3" placeholder="לאן רוצים שהתלמיד יגיע השנה">${esc(program.goals || '')}</textarea>
            </div>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">הזדמנויות עבודה ואמצעים להגשמתם</label>
            <textarea id="tla-opportunities-${sid}" class="form-control form-control-sm" rows="3" placeholder="פעולות קונקרטיות לבניית מטרות">${esc(program.opportunities || '')}</textarea>
          </div>
          <div class="mb-2"><label class="form-label small fw-bold">מעקב והערכה</label>
            <textarea id="tla-evaluation-${sid}" class="form-control form-control-sm" rows="2" placeholder="כיצד מעריכים את ההתקדמות">${esc(program.evaluation || '')}</textarea>
          </div>
          <div class="row g-2">
            <div class="col-md-6"><label class="form-label small fw-bold">חיזוק יכולות וכישורים</label>
              <textarea id="tla-strengths-${sid}" class="form-control form-control-sm" rows="2" placeholder="התמקדות בנקודות חוזק">${esc(program.strengths || '')}</textarea>
            </div>
            <div class="col-md-6"><label class="form-label small fw-bold">הערכה מסכמת</label>
              <textarea id="tla-summary-${sid}" class="form-control form-control-sm" rows="2" placeholder="הערכה כללית">${esc(program.summary || '')}</textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. תיעוד ישיבות צוות -->
      <div class="card mb-3">
        <div class="card-header bg-light d-flex justify-content-between"><b>4. תיעוד ישיבות צוות (לפי חודש)</b></div>
        <div class="card-body">
          ${['אלול','חשון','כסלו','טבת','שבט','אדר'].map(ch => `
            <div class="mb-2 row g-1 align-items-start">
              <div class="col-md-2 fw-bold small pt-1">${ch}</div>
              <div class="col-md-10">
                <textarea id="tla-mtg-${ch}-${sid}" class="form-control form-control-sm" rows="2" placeholder="משתתפים, סיכום, תוצאות לחודש ${ch}">${esc(meetings[ch] || '')}</textarea>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 5. תיעוד שיחות הורים -->
      <div class="card mb-3">
        <div class="card-header bg-light"><b>5. תיעוד שיחות הורים (לפי חודש)</b></div>
        <div class="card-body">
          ${['אלול','חשון','כסלו','טבת','שבט','אדר'].map(ch => `
            <div class="mb-2 row g-1 align-items-start">
              <div class="col-md-2 fw-bold small pt-1">${ch}</div>
              <div class="col-md-10">
                <textarea id="tla-prnt-${ch}-${sid}" class="form-control form-control-sm" rows="2" placeholder="נושאים שעלו, החלטות, סיכומים מ${ch}">${esc(parents[ch] || '')}</textarea>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 6. הערות ושינויים -->
      <div class="card mb-3">
        <div class="card-header bg-light"><b>6. הערות, המלצות ושינויים משמעותיים במהלך השנה</b></div>
        <div class="card-body">
          <textarea id="tla-changes-${sid}" class="form-control" rows="4" placeholder="כל שינוי משמעותי בהתנהלות התלמיד, החלטות עם ההורים, מעקב פסיכולוגי...">${esc(tla.changes || '')}</textarea>
        </div>
      </div>

      <div class="alert alert-info small">
        <i class="bi bi-clock-history"></i> עדכון אחרון: ${esc(s['תלא_עודכן'] ? new Date(s['תלא_עודכן']).toLocaleString('he-IL') : 'מעולם לא')}
      </div>
    `;
  }

  function parseTlaData(s) {
    try {
      return JSON.parse(s['תלא_data'] || '{}');
    } catch { return {}; }
  }

  function initTlaFormListeners(sid) {
    // Optional: auto-save on blur. Keeping manual save for now.
  }

  window.tlaSaveForm = async function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return alert('תלמיד לא נמצא');

    function v(id) { return document.getElementById(`tla-${id}-${sid}`)?.value || ''; }

    const tlaData = {
      mechanech: v('mechanech'),
      profile: {
        background: v('background'),
        intellect: v('intellect'),
        academic: v('academic'),
        talmidut: v('talmidut'),
        social: v('social'),
      },
      program: {
        baseline: v('baseline'),
        goals: v('goals'),
        opportunities: v('opportunities'),
        evaluation: v('evaluation'),
        strengths: v('strengths'),
        summary: v('summary'),
      },
      meetings: {
        אלול: v('mtg-אלול'),
        חשון: v('mtg-חשון'),
        כסלו: v('mtg-כסלו'),
        טבת: v('mtg-טבת'),
        שבט: v('mtg-שבט'),
        אדר: v('mtg-אדר'),
      },
      parents: {
        אלול: v('prnt-אלול'),
        חשון: v('prnt-חשון'),
        כסלו: v('prnt-כסלו'),
        טבת: v('prnt-טבת'),
        שבט: v('prnt-שבט'),
        אדר: v('prnt-אדר'),
      },
      changes: v('changes'),
    };

    const updated = Object.assign({}, s, {
      'תלא_data': JSON.stringify(tlaData, null, 0),
      'תלא_עודכן': new Date().toISOString(),
      'תז': v('tz'),
      'פרופיל_הורים': tlaData.profile.background || s['פרופיל_הורים'] || '',
      'פרופיל_אישיות': tlaData.profile.social || s['פרופיל_אישיות'] || '',
      'פרופיל_לימודי': tlaData.profile.academic || s['פרופיל_לימודי'] || '',
    });

    const r = await api('updateStudent', [updated]);
    if (r && r.ok !== false) {
      if (typeof toast === 'function') toast('תל"א נשמר בהצלחה', 'success');
      else alert('נשמר ✓');
    } else {
      alert('שגיאה: ' + (r?.error || '?'));
    }
  };

  window.tlaPrintForm = function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const w = window.open('', '_blank');
    if (!w) return;
    const html = buildTlaFormHtml(sid, s);
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>תל"א - ${esc(fullName)}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
      <style>body{padding:30px;direction:rtl} textarea{resize:none;background:#fafafa}</style>
      </head><body><h1>תיק תל"א - ${esc(fullName)} - תשפ"ו</h1>${html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  console.warn('%c📋 Pack-90 — Full TLA form (matching original PPTX template) + save/print', 'color:#d97706;font-weight:bold;font-size:14px');
})();
