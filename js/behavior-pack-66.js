// behavior-pack-66.js — TLA (תוכנית לימודית אישית) tab in student card. 2026-05-26
// Adds a "תל\"א" tab with: PDF preview + view/edit/share/send actions.
(function () {
  'use strict';

  const WH_URL = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const TOKEN = 'BHT_AGENT_2026';

  function escA(s) { return String(s || '').replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c])); }

  // Add TLA tab to student modal after it's rendered
  window.injectTlaTab = function () { return injectTlaTabImpl(); };
  function injectTlaTabImpl() {
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    if (modal.querySelector('#stu-tab-tla')) return;
    const tabsList = modal.querySelector('#stu-tabs');
    const tabsContent = modal.querySelector('.tab-content');
    if (!tabsList || !tabsContent) return;

    // Extract student ID from any action button
    let sid = null;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (m) sid = parseInt(m);
    if (!sid) return;

    const student = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(s => String(s['מזהה']) === String(sid));
    if (!student) return;

    // Insert tab link (before פרופיל)
    const tabLi = document.createElement('li');
    tabLi.className = 'nav-item';
    tabLi.innerHTML = `<a class="nav-link" data-bs-toggle="tab" href="#stu-tab-tla"><i class="bi bi-mortarboard-fill text-warning"></i> תל"א</a>`;
    // Insert before profile tab if present
    const profileTab = tabsList.querySelector('a[href="#stu-tab-profile"]');
    if (profileTab) tabsList.insertBefore(tabLi, profileTab.parentNode);
    else tabsList.appendChild(tabLi);

    // Build tab content
    const pdfId = student['תלא_pdf_id'] || '';
    const pptxId = student['תלא_pptx_id'] || '';
    const pdfUrl = student['תלא_pdf_url'] || '';
    const pptxUrl = student['תלא_pptx_url'] || '';
    const preview = pdfId ? `https://drive.google.com/file/d/${pdfId}/preview` : '';
    const updated = student['תלא_עודכן'] || '';
    const folderUrl = student['תלא_folder_url'] || '';
    const filename = student['תלא_שם_קובץ'] || '';

    const pane = document.createElement('div');
    pane.className = 'tab-pane fade';
    pane.id = 'stu-tab-tla';
    pane.innerHTML = pdfId ? `
      <div class="card border-warning">
        <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
          <div>
            <h5 class="mb-0"><i class="bi bi-mortarboard-fill text-warning"></i> תוכנית לימודית אישית (תל"א)</h5>
            <small class="text-muted">${escA(filename)} ${updated ? '· עודכן ' + escA(new Date(updated).toLocaleDateString('he-IL')) : ''}</small>
          </div>
          <div class="btn-group btn-group-sm">
            <a class="btn btn-outline-primary" href="${escA(pdfUrl)}" target="_blank" title="צפה ב-PDF"><i class="bi bi-file-pdf"></i> צפה</a>
            <a class="btn btn-outline-info" href="${escA(pptxUrl)}" target="_blank" title="ערוך את התבנית"><i class="bi bi-pencil"></i> ערוך</a>
            <button class="btn btn-outline-success" onclick="window.tlaShare(${sid})" title="שתף קישור"><i class="bi bi-share"></i> שתף</button>
            <button class="btn btn-outline-warning" onclick="window.tlaSendEmail(${sid})" title="שלח במייל"><i class="bi bi-envelope"></i> שלח</button>
            <button class="btn btn-outline-secondary" onclick="window.tlaWhats(${sid})" title="שלח ב-WhatsApp"><i class="bi bi-whatsapp"></i> WhatsApp</button>
            <a class="btn btn-outline-dark" href="https://drive.google.com/uc?export=download&id=${escA(pdfId)}" title="הורד"><i class="bi bi-download"></i></a>
          </div>
        </div>
        <div class="card-body p-2" style="background:#f8f9fa">
          <div class="ratio ratio-4x3" style="background:#000;border-radius:6px;overflow:hidden">
            <iframe src="${escA(preview)}" allow="autoplay" allowfullscreen frameborder="0" style="border:0;width:100%;height:100%"></iframe>
          </div>
        </div>
        <div class="card-footer small text-muted d-flex justify-content-between flex-wrap gap-1">
          <span>${folderUrl ? `<a href="${escA(folderUrl)}" target="_blank"><i class="bi bi-folder"></i> תיקיית תלאים תשפ"ו</a>` : ''}</span>
          <span>PDF ID: <code style="font-size:11px">${escA(pdfId)}</code></span>
        </div>
      </div>
    ` : `
      <div class="card p-4 text-center" style="border:2px dashed #fbbf24;background:#fffbeb">
        <i class="bi bi-mortarboard fs-1 text-warning"></i>
        <h5 class="mt-3">אין תל"א עבור תלמיד זה</h5>
        <p class="text-muted">לא נמצא קובץ תוכנית לימודית אישית לתלמיד.</p>
        <div class="mt-3 d-flex gap-2 justify-content-center flex-wrap">
          <button class="btn btn-warning" onclick="window.tlaGenerate(${sid})"><i class="bi bi-magic"></i> צור תל"א מנתוני התנהגות</button>
          <button class="btn btn-outline-primary" onclick="window.tlaUploadPrompt(${sid})"><i class="bi bi-upload"></i> העלה קובץ קיים</button>
        </div>
        <div class="alert alert-info small mt-3 text-end">
          <b>איך?</b> "צור" יבנה תל"א בסיסי לפי דיווחי התנהגות שיש על התלמיד.
          "העלה" מאפשר לחבר קובץ Drive ידנית.
        </div>
      </div>
    `;
    tabsContent.appendChild(pane);
  }

  // Watch for student modal opening — use Bootstrap event
  document.addEventListener('shown.bs.modal', (e) => {
    if (e.target?.id === 'viewStuModal') {
      setTimeout(injectTlaTabImpl, 50);
    }
  });
  // Fallback MutationObserver (single-shot per modal instance)
  const observer = new MutationObserver(() => {
    const m = document.getElementById('viewStuModal');
    if (m && !m.dataset.tlaInjected) {
      m.dataset.tlaInjected = '1';
      setTimeout(injectTlaTabImpl, 100);
    }
  });
  observer.observe(document.body, { childList: true });

  // ===== Actions =====
  window.tlaShare = function (sid) {
    const s = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(x => String(x['מזהה']) === String(sid));
    if (!s || !s['תלא_pdf_url']) return alert('אין URL לתל"א');
    navigator.clipboard.writeText(s['תלא_pdf_url']).then(() => {
      if (typeof toast === 'function') toast('הקישור הועתק ללוח', 'success');
      else alert('קישור הועתק:\n' + s['תלא_pdf_url']);
    });
  };

  window.tlaWhats = function (sid) {
    const s = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(x => String(x['מזהה']) === String(sid));
    if (!s || !s['תלא_pdf_url']) return alert('אין URL לתל"א');
    const nm = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const msg = `תיק התל"א של ${nm}:\n${s['תלא_pdf_url']}`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  };

  window.tlaSendEmail = function (sid) {
    const s = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(x => String(x['מזהה']) === String(sid));
    if (!s || !s['תלא_pdf_url']) return alert('אין URL לתל"א');
    const nm = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const subj = encodeURIComponent(`תיק תל"א - ${nm}`);
    const body = encodeURIComponent(`שלום,\n\nמצורף קישור לתיק התל"א של ${nm}:\n${s['תלא_pdf_url']}\n\nבברכה,\nבית התלמוד`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subj}&body=${body}`, '_blank');
  };

  window.tlaUploadPrompt = function (sid) {
    const pdfUrl = prompt('הדבק קישור Drive ל-PDF (למשל https://drive.google.com/file/d/.../view):');
    if (!pdfUrl) return;
    const m = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!m) return alert('לא זוהה ID של קובץ Drive בקישור');
    const id = m[1];
    const pptxUrl = prompt('הדבק קישור Drive ל-PPTX (לעריכה, אופציונלי):') || '';
    const pptxM = pptxUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const pptxId = pptxM ? pptxM[1] : '';

    const s = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const updated = Object.assign({}, s, {
      'תלא_pdf_id': id,
      'תלא_pdf_url': `https://drive.google.com/file/d/${id}/view`,
      'תלא_pdf_preview': `https://drive.google.com/file/d/${id}/preview`,
      'תלא_pptx_id': pptxId,
      'תלא_pptx_url': pptxId ? `https://drive.google.com/file/d/${pptxId}/edit` : '',
      'תלא_עודכן': new Date().toISOString(),
    });
    api('updateStudent', [updated]).then(r => {
      if (r && r.ok) {
        if (typeof toast === 'function') toast('עודכן! סגור ופתח את הכרטיס מחדש', 'success');
        else alert('עודכן! סגור ופתח את הכרטיס מחדש');
      }
    });
  };

  window.tlaGenerate = async function (sid) {
    const s = ((typeof getVisibleData === 'function' ? (getVisibleData().students || []) : [])).find(x => String(x['מזהה']) === String(sid));
    if (!s) return;
    const nm = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    if (!confirm(`לבנות תל"א ראשוני עבור ${nm} מנתוני ההתנהגות והשיחות הקיימים?`)) return;

    // Gather behavior events + conversations for this student
    const events = ((typeof getVisibleData === 'function' ? (getVisibleData().behavior || []) : [])).filter(e => String(e['תלמיד_מזהה']) === String(sid));
    const convs = ((typeof getVisibleData === 'function' ? (getVisibleData().conversations || []) : [])).filter(c => String(c['תלמיד_מזהה']) === String(sid));

    if (!events.length && !convs.length) {
      alert('אין נתוני התנהגות/שיחות לתלמיד זה. אי אפשר לבנות תל"א אוטומטי.');
      return;
    }

    // Build TLA template text
    const lines = [
      `# תוכנית לימודית אישית - ${nm}`,
      ``,
      `## פרטי תלמיד`,
      `- שם: ${nm}`,
      `- שיעור: ${s['מחזור']||''}`,
      `- ת.ז.: ${s['תז']||''}`,
      `- טלפון: ${s['טלפון']||''}`,
      ``,
      `## דיווחי התנהגות (${events.length})`,
      ...events.slice(0, 30).map(e => `- [${e['תאריך']?.slice(0,10) || ''}] ${e['קטגוריה']||''}: ${e['תיאור']||''}`),
      ``,
      `## שיחות אישיות (${convs.length})`,
      ...convs.slice(0, 20).map(c => `- [${c['תאריך']?.slice(0,10) || ''}] ${c['רב']||''}: ${c['נושא']||c['תוכן']||''}`),
      ``,
      `## פרופיל`,
      `- דוח אישי: ${s['דוח_אישי']||''}`,
      `- הורים: ${s['פרופיל_הורים']||''}`,
      `- אישיות: ${s['פרופיל_אישיות']||''}`,
      `- התנהגותי: ${s['פרופיל_התנהגותי']||''}`,
      `- לימודי: ${s['פרופיל_לימודי']||''}`,
      ``,
      `## תאריך יצירה`,
      new Date().toLocaleString('he-IL'),
    ];

    const text = lines.join('\n');

    // Store as plain-text TLA in the student record (no Drive upload from browser)
    const updated = Object.assign({}, s, {
      'תלא_טקסט': text,
      'תלא_עודכן': new Date().toISOString(),
      'תלא_מקור': 'אוטומטי מנתוני התנהגות',
    });
    const r = await api('updateStudent', [updated]);
    if (r && r.ok) {
      if (typeof toast === 'function') toast(`✅ נבנה תל"א ראשוני עבור ${nm} (טקסט)`, 'success');
      // Show preview
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>תל"א ${escA(nm)}</title>
          <style>body{font-family:Arial,sans-serif;max-width:800px;margin:30px auto;padding:20px;line-height:1.6}
          h1,h2{color:#1e3a8a}h1{border-bottom:3px solid #fbbf24}h2{margin-top:30px}
          li{margin-bottom:6px}</style></head><body>${marked(text)}</body></html>`);
        w.document.close();
      }
    }

    function marked(md) {
      return md
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^- (.*)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>(\n|$))+/g, m => '<ul>' + m + '</ul>')
        .replace(/\n\n/g, '<br><br>');
    }
  };

  console.warn('%c🎓 Pack-66 — TLA tab in student card', 'color:#d97706;font-weight:bold');
})();
