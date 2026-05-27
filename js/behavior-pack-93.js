// behavior-pack-93.js — TLA form REDESIGNED to match original PPTX layout (tables, sections, print-friendly). 2026-05-27
(function () {
  'use strict';

  function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }
  function escA(s) { return esc(s).replace(/"/g,'&quot;'); }

  function getStudent(sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    return (data.students || []).find(s => String(s['מזהה']) === String(sid));
  }

  function parseTlaData(s) {
    // Use the global override (pack-95) if available
    if (typeof window.parseTlaData === 'function') {
      try { return window.parseTlaData(s) || {}; } catch {}
    }
    if (s['תלא_data']) {
      try { return JSON.parse(s['תלא_data']); } catch {}
    }
    // Fallback: extract from דוח_אישי
    const doch = s['דוח_אישי'] || '';
    const m = doch.match(/\[TLA_JSON_START\]([\s\S]*?)\[TLA_JSON_END\]/);
    if (m) {
      try { return JSON.parse(m[1]); } catch {}
    }
    return {};
  }

  // ===== OVERRIDE pack-90's injectTlaTab with PPTX-matching design =====
  window.injectTlaTab = function () {
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

    // Insert tab link
    const tabLi = document.createElement('li');
    tabLi.className = 'nav-item';
    tabLi.innerHTML = `<a class="nav-link" data-bs-toggle="tab" href="#stu-tab-tla"><i class="bi bi-mortarboard-fill text-warning"></i> תל"א</a>`;
    const profileTab = tabsList.querySelector('a[href="#stu-tab-profile"]');
    if (profileTab) tabsList.insertBefore(tabLi, profileTab.parentNode);
    else tabsList.appendChild(tabLi);

    const pane = document.createElement('div');
    pane.className = 'tab-pane fade';
    pane.id = 'stu-tab-tla';
    pane.innerHTML = buildPptxStyleTla(sid, student);
    tabsContent.appendChild(pane);
  };

  function buildPptxStyleTla(sid, s) {
    const tla = parseTlaData(s);
    const hasFile = !!s['תלא_pdf_id'];
    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const m = tla.meetings || {};
    const p = tla.parents || {};
    const pr = tla.profile || {};
    const pg = tla.program || {};

    // Inject styles for PPTX-like look (only once)
    if (!document.getElementById('tla-pptx-style-93')) {
      const st = document.createElement('style');
      st.id = 'tla-pptx-style-93';
      st.textContent = `
        .tla-doc { font-family: 'Heebo', Arial; max-width: 900px; margin: 0 auto; padding: 12px; background: #fff; }
        .tla-doc h2 { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; padding: 12px 16px; border-radius: 8px 8px 0 0; margin: 0; font-size: 22px; }
        .tla-doc .tla-meta { background: #f3f4f6; padding: 10px 16px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; margin-bottom: 20px; font-size: 14px; }
        .tla-doc .tla-section { margin-bottom: 20px; border: 2px solid #1e3a8a; border-radius: 8px; overflow: hidden; }
        .tla-doc .tla-section-header { background: #1e3a8a; color: #fff; padding: 8px 14px; font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; align-items: center; }
        .tla-doc .tla-section-body { padding: 12px; background: #fafafa; }
        .tla-doc table.tla-table { width: 100%; border-collapse: collapse; background: #fff; }
        .tla-doc table.tla-table th { background: #fbbf24; color: #1e3a8a; padding: 6px 8px; border: 1px solid #1e3a8a; font-size: 12px; font-weight: bold; }
        .tla-doc table.tla-table td { padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top; font-size: 13px; }
        .tla-doc table.tla-table td.tla-month { background: #fef3c7; font-weight: bold; text-align: center; width: 100px; }
        .tla-doc textarea, .tla-doc input[type=text] { width: 100%; border: 0; background: transparent; resize: vertical; font-family: inherit; font-size: 13px; padding: 4px; outline: none; }
        .tla-doc textarea:focus, .tla-doc input:focus { background: #fffbeb; outline: 2px solid #fbbf24; border-radius: 4px; }
        .tla-doc .tla-profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tla-doc .tla-profile-item { background: #fff; padding: 10px; border-radius: 6px; border-right: 4px solid #1e3a8a; }
        .tla-doc .tla-profile-label { color: #1e3a8a; font-weight: bold; font-size: 13px; margin-bottom: 4px; }
        @media print {
          .tla-doc .no-print { display: none !important; }
          .tla-doc .tla-section { page-break-inside: avoid; }
          .tla-doc textarea, .tla-doc input { background: transparent !important; outline: 0 !important; }
        }
      `;
      document.head.appendChild(st);
    }

    return `
      <div class="tla-doc" id="tla-doc-${sid}">
        <h2><i class="bi bi-mortarboard-fill"></i> תיק תל"א - ${esc(fullName)}</h2>
        <div class="tla-meta d-flex justify-content-between flex-wrap gap-2">
          <div>
            <b>שיעור:</b> ${esc(s['מחזור']||'')} ·
            <b>ת.ז.:</b> <input type="text" id="tla-tz-${sid}" value="${escA(s['תז']||'')}" style="width:120px">
            · <b>מחנך:</b> <input type="text" id="tla-mechanech-${sid}" value="${escA(tla.mechanech || 'הרב סורוצקין')}" style="width:130px">
            · <b>שנה"ל:</b> תשפ"ו
          </div>
          <div class="no-print d-flex gap-2 flex-wrap">
            ${hasFile ? `<a class="btn btn-sm btn-outline-primary" href="${escA(s['תלא_pdf_url'])}" target="_blank"><i class="bi bi-file-pdf"></i> מקור PDF</a>
            <a class="btn btn-sm btn-outline-info" href="${escA(s['תלא_pptx_url'])}" target="_blank"><i class="bi bi-file-ppt"></i> PPTX</a>` : ''}
            <button class="btn btn-sm btn-success" onclick="window.tlaSaveForm(${sid})"><i class="bi bi-save"></i> שמור</button>
            <button class="btn btn-sm btn-warning" onclick="window.tlaPrintForm(${sid})"><i class="bi bi-printer"></i> הדפס/PDF</button>
          </div>
        </div>

        <!-- Profile section -->
        <div class="tla-section">
          <div class="tla-section-header">דף הכנה לתל"א — פרופיל תלמיד</div>
          <div class="tla-section-body">
            <div class="tla-profile-grid">
              <div class="tla-profile-item">
                <div class="tla-profile-label">רקע סביבתי / משפחתי</div>
                <textarea id="tla-background-${sid}" rows="3" placeholder="הרכב משפחה, מצב כלכלי...">${esc(pr.background || '')}</textarea>
              </div>
              <div class="tla-profile-item">
                <div class="tla-profile-label">תפקוד אינטלקטואלי</div>
                <textarea id="tla-intellect-${sid}" rows="3" placeholder="IQ, יכולות חשיבה...">${esc(pr.intellect || '')}</textarea>
              </div>
              <div class="tla-profile-item">
                <div class="tla-profile-label">תפקודים אקדמיים</div>
                <textarea id="tla-academic-${sid}" rows="3" placeholder="קריאה, כתיבה, הבנה...">${esc(pr.academic || '')}</textarea>
              </div>
              <div class="tla-profile-item">
                <div class="tla-profile-label">תלמידאיות</div>
                <textarea id="tla-talmidut-${sid}" rows="3" placeholder="מוטיבציה, ארגון, מודעות...">${esc(pr.talmidut || '')}</textarea>
              </div>
              <div class="tla-profile-item" style="grid-column: 1 / -1">
                <div class="tla-profile-label">תפקודים רגשיים וחברתיים</div>
                <textarea id="tla-social-${sid}" rows="3" placeholder="גבולות, יחס לאחר, תסכול...">${esc(pr.social || '')}</textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Program section -->
        <div class="tla-section">
          <div class="tla-section-header">תל"א אינטגרטיבי — תוכנית לימודים אישית</div>
          <div class="tla-section-body">
            <table class="tla-table">
              <thead>
                <tr>
                  <th style="width:20%">קו בסיס</th>
                  <th style="width:20%">מטרות</th>
                  <th style="width:30%">הזדמנויות עבודה ואמצעים</th>
                  <th style="width:15%">מעקב והערכה</th>
                  <th style="width:15%">הערכה מסכמת</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><textarea id="tla-baseline-${sid}" rows="6">${esc(pg.baseline || '')}</textarea></td>
                  <td><textarea id="tla-goals-${sid}" rows="6">${esc(pg.goals || '')}</textarea></td>
                  <td><textarea id="tla-opportunities-${sid}" rows="6">${esc(pg.opportunities || '')}</textarea></td>
                  <td><textarea id="tla-evaluation-${sid}" rows="6">${esc(pg.evaluation || '')}</textarea></td>
                  <td><textarea id="tla-summary-${sid}" rows="6">${esc(pg.summary || '')}</textarea></td>
                </tr>
              </tbody>
            </table>
            <div class="mt-2">
              <div class="tla-profile-label">חיזוק יכולות וכישורים</div>
              <textarea id="tla-strengths-${sid}" rows="2" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:6px">${esc(pg.strengths || '')}</textarea>
            </div>
          </div>
        </div>

        <!-- Team meetings table -->
        <div class="tla-section">
          <div class="tla-section-header">תיעוד ישיבות צוות</div>
          <div class="tla-section-body">
            <table class="tla-table">
              <thead>
                <tr><th style="width:80px">חודש</th><th>משתתפים וסיכום ההישיבה</th></tr>
              </thead>
              <tbody>
                ${['אלול','חשון','כסלו','טבת','שבט','אדר'].map(ch => `
                  <tr>
                    <td class="tla-month">${ch}</td>
                    <td><textarea id="tla-mtg-${ch}-${sid}" rows="2">${esc(m[ch] || '')}</textarea></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Parent meetings -->
        <div class="tla-section">
          <div class="tla-section-header">תיעוד שיחות הורים</div>
          <div class="tla-section-body">
            <table class="tla-table">
              <thead>
                <tr><th style="width:80px">חודש</th><th>נושאים שעלו ותוצאות</th></tr>
              </thead>
              <tbody>
                ${['אלול','חשון','כסלו','טבת','שבט','אדר'].map(ch => `
                  <tr>
                    <td class="tla-month">${ch}</td>
                    <td><textarea id="tla-prnt-${ch}-${sid}" rows="2">${esc(p[ch] || '')}</textarea></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Changes -->
        <div class="tla-section">
          <div class="tla-section-header">הערות, המלצות ושינויים משמעותיים במהלך השנה</div>
          <div class="tla-section-body">
            <textarea id="tla-changes-${sid}" rows="4" style="border:1px solid #cbd5e1;border-radius:4px;padding:6px;width:100%">${esc(tla.changes || '')}</textarea>
          </div>
        </div>

        <div class="text-end small text-muted mt-3 no-print">
          <i class="bi bi-clock-history"></i> עדכון אחרון: ${esc(s['תלא_עודכן'] ? new Date(s['תלא_עודכן']).toLocaleString('he-IL') : 'מעולם לא')}
        </div>
      </div>
    `;
  }

  // ===== Override print to print only the TLA section =====
  window.tlaPrintForm = function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const docEl = document.getElementById(`tla-doc-${sid}`);
    if (!docEl) return alert('פתח את הטאב תל"א קודם');

    const fullName = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const w = window.open('', '_blank', 'width=900,height=1100');
    if (!w) return alert('לא ניתן לפתוח חלון - בדוק חוסם פופאפים');

    // Capture all current values from textareas/inputs
    const values = {};
    docEl.querySelectorAll('textarea, input').forEach(el => {
      if (el.id) values[el.id] = el.value;
    });

    // Clone the DOM
    const clone = docEl.cloneNode(true);
    // Restore values in clone
    clone.querySelectorAll('textarea, input').forEach(el => {
      if (el.id && values[el.id] !== undefined) {
        if (el.tagName === 'TEXTAREA') el.textContent = values[el.id];
        else el.setAttribute('value', values[el.id]);
      }
    });

    const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8">
      <title>תל"א - ${esc(fullName)}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Heebo', Arial, sans-serif; padding: 20px; direction: rtl; }
        ${document.getElementById('tla-pptx-style-93').textContent}
        @media print { body { padding: 0; } }
      </style>
      </head><body>${clone.outerHTML}
      <script>setTimeout(()=>window.print(), 600);<\/script>
      </body></html>`;
    w.document.write(html);
    w.document.close();
  };

  console.warn('%c🎨 Pack-93 — TLA REDESIGN matching original PPTX layout (tables, colors, print-friendly)', 'color:#1e3a8a;font-weight:bold;font-size:14px');
})();
