// behavior-pack-71.js — Bug fix round 5: TLA send via webhook + better generation. 2026-05-26
(function () {
  'use strict';

  const WH_URL = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const TOKEN = 'BHT_AGENT_2026';

  // ===== Improved tlaSendEmail with attachment via webhook =====
  // Pre-fill recipient based on relevant rabbi
  const _origSend = window.tlaSendEmail;
  window.tlaSendEmail = function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return alert('תלמיד לא נמצא');
    if (!s['תלא_pdf_url']) {
      // No PDF - just send the URL
      return _origSend?.(sid);
    }
    // Show menu: who to send to
    const choice = prompt(
      `שלח תל"א של ${s['שם פרטי']||''} ${s['שם משפחה']||''} אל:\n` +
      `1 = הרב ירושלמי (tt0527686018@gmail.com)\n` +
      `2 = הורי התלמיד (אם יש מייל)\n` +
      `3 = כתובת מותאמת (תוזן)\n` +
      `4 = Gmail compose רגיל (ידני)\n` +
      `הקלד 1/2/3/4:`,
      '1'
    );
    if (!choice) return;

    let to = '';
    if (choice === '1') to = 'tt0527686018@gmail.com';
    else if (choice === '2') to = (s['מייל_אבא'] || s['מייל_אמא'] || s['אימייל'] || '').trim();
    else if (choice === '3') to = (prompt('כתובת מייל:') || '').trim();
    else if (choice === '4') return _origSend?.(sid);
    else return alert('בחירה לא חוקית');

    if (!to) return alert('אין כתובת מייל');

    const nm = `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
    const body = `שלום,\n\nמצורף קישור לתיק התל"א של ${nm}:\n${s['תלא_pdf_url']}\n\nאם הקישור לא נפתח — יש לוודא שלחיצה ב-Drive מאפשרת תצוגה לכל מי שיש לו את הקישור.\n\nבברכה,\nבית התלמוד`;

    // Use webhook sendEmail action (text-only, no PDF attach)
    const params = new URLSearchParams({
      action: 'sendEmail',
      token: TOKEN,
      to: to,
      subject: `תיק תל"א - ${nm}`,
      body: body,
    });

    fetch(WH_URL, { method: 'POST', body: params })
      .then(r => r.json())
      .then(d => {
        if (d.ok || d.success) {
          if (typeof toast === 'function') toast(`✅ נשלח אל ${to}`, 'success');
          else alert(`✅ נשלח אל ${to}`);
        } else {
          // Fall back to Gmail compose
          const subj = encodeURIComponent(`תיק תל"א - ${nm}`);
          const bodyE = encodeURIComponent(body);
          window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${subj}&body=${bodyE}`, '_blank');
        }
      })
      .catch(err => {
        // Fallback
        const subj = encodeURIComponent(`תיק תל"א - ${nm}`);
        const bodyE = encodeURIComponent(body);
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${subj}&body=${bodyE}`, '_blank');
      });
  };

  // ===== TLA bulk operations =====
  window.tlaBulkExport = function () {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const withTla = (data.students || []).filter(s => s['תלא_pdf_id']);
    const csv = [
      'מזהה,שם,שיעור,תלא_pdf_url,תלא_עודכן',
      ...withTla.map(s => [
        s['מזהה'],
        `"${s['שם פרטי']||''} ${s['שם משפחה']||''}"`,
        s['מחזור'] || '',
        s['תלא_pdf_url'] || '',
        s['תלא_עודכן'] || '',
      ].join(',')),
    ].join('\n');
    const blob = new Blob([new Uint8Array([0xEF,0xBB,0xBF]), csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tla_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  console.warn('%c📧 Pack-71 — TLA send via webhook + bulk export', 'color:#059669;font-weight:bold');
  console.log('  Try: tlaBulkExport()');
})();
