// behavior-pack-35.js — Document Generation (certificates, letters). 2026-05-25
(function () {
  'use strict';

  // ===== 1. Certificate generator =====
  window.generateCertificate = function (student, achievement) {
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>תעודה</title>
      <style>
        @page { size: A4 landscape; margin: 0; }
        body { font-family: 'David', serif; background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 40px; min-height: 100vh; box-sizing: border-box; }
        .cert { background: #fff; border: 6px double #92400e; padding: 60px; text-align: center; height: calc(100vh - 80px); display: flex; flex-direction: column; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        h1 { color: #92400e; font-size: 56px; margin-bottom: 10px; }
        h2 { color: #b45309; font-size: 32px; margin: 20px 0; }
        .name { font-size: 52px; color: #1e3a8a; font-weight: bold; margin: 30px 0; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; display: inline-block; }
        .ach { font-size: 28px; color: #4b5563; }
        .date { margin-top: 40px; color: #6b7280; }
        .seal { font-size: 80px; margin: 20px; }
      </style></head><body>
      <div class="cert">
        <div class="seal">🏆</div>
        <h1>תעודת הצטיינות</h1>
        <h2>בית התלמוד</h2>
        <p>מוענקת בזאת ל-</p>
        <div class="name">${escHtml(student.name || '')}</div>
        <p class="ach">על ${escHtml(achievement || 'הצטיינות והתמדה')}</p>
        <p class="date">${new Date().toLocaleDateString('he-IL', { year:'numeric', month:'long', day:'numeric' })}</p>
      </div>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== 2. Parent letter template =====
  window.generateParentLetter = function (student, subject, body) {
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>מכתב</title>
      <style>
        body { font-family: 'Heebo', Arial; padding: 60px; max-width: 800px; margin: 0 auto; line-height: 1.8; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 48px; }
        h1 { color: #2563eb; margin: 10px 0; }
        .meta { color: #6b7280; font-size: 14px; }
        .salutation { font-size: 18px; font-weight: bold; margin: 20px 0; }
        .body { font-size: 16px; white-space: pre-wrap; }
        .signature { margin-top: 60px; }
      </style></head><body>
      <div class="header">
        <div class="logo">📜</div>
        <h1>בית התלמוד</h1>
        <div class="meta">${new Date().toLocaleDateString('he-IL')}</div>
      </div>
      <div class="salutation">להורי ${escHtml(student.name || 'התלמיד')} שיחיו,</div>
      <h3>${escHtml(subject || 'עדכון')}</h3>
      <div class="body">${escHtml(body || '')}</div>
      <div class="signature">בברכת התורה,<br><strong>הנהלת בית התלמוד</strong></div>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== 3. Student report (PDF-ready) =====
  window.generateStudentReport = async function (sid) {
    try {
      const [st, ev] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const stu = (st.data || []).find(s => String(s['מזהה']) === String(sid));
      if (!stu) return;
      const events = (ev.data || []).filter(e => String(e['תלמיד_מזהה']) === String(sid));
      const name = `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim();
      const w = window.open('', '_blank');
      w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>דוח תלמיד</title>
        <style>
          body { font-family: 'Heebo', Arial; padding: 30px; max-width: 850px; margin: 0 auto; }
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
          .kpi { display: inline-block; padding: 15px; background: #f3f4f6; border-radius: 8px; min-width: 120px; text-align: center; margin: 5px; }
          .kpi-num { font-size: 28px; font-weight: bold; color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; }
          th { background: #f9fafb; }
          .high { background: #fee2e2; }
        </style></head><body>
        <h1>📋 דוח תלמיד - ${escHtml(name)}</h1>
        <p>כיתה: ${escHtml(stu['מחזור']||'')} | טלפון: ${escHtml(stu['טלפון אם']||stu['טלפון אב']||'')}</p>
        <div>
          <div class="kpi"><div class="kpi-num">${events.length}</div><div>סה"כ אירועים</div></div>
          <div class="kpi"><div class="kpi-num">${events.filter(e => e['חומרה']==='גבוהה').length}</div><div>חומרה גבוהה</div></div>
          <div class="kpi"><div class="kpi-num">${events.filter(e => e['חומרה']==='נמוכה').length}</div><div>חיוביים</div></div>
        </div>
        <h3>אירועים אחרונים:</h3>
        <table>
          <thead><tr><th>תאריך</th><th>קטגוריה</th><th>חומרה</th><th>תיאור</th></tr></thead>
          <tbody>
            ${events.slice(-30).reverse().map(e => `<tr class="${e['חומרה']==='גבוהה'?'high':''}">
              <td>${new Date(e['תאריך']||'').toLocaleDateString('he-IL')}</td>
              <td>${escHtml(e['קטגוריה']||'')}</td>
              <td>${escHtml(e['חומרה']||'')}</td>
              <td>${escHtml(e['תיאור']||'')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        <p style="margin-top:30px;color:#9ca3af;font-size:12px">נוצר ${new Date().toLocaleString('he-IL')}</p>
        <script>setTimeout(()=>window.print(),500)</script>
        </body></html>`);
    } catch (e) { alert(e.message); }
  };

  // ===== 4. Group letter (broadcast print) =====
  window.generateGroupLetter = async function (subject, body) {
    try {
      const r = await api('listStudents', []);
      const students = r.data || [];
      if (!students.length) return alert('אין תלמידים');
      if (!confirm(`לפתוח ${students.length} מכתבים?`)) return;
      students.forEach(s => generateParentLetter({ name: `${s['שם פרטי']||''} ${s['שם משפחה']||''}` }, subject, body));
    } catch (e) { alert(e.message); }
  };

  // ===== 5. Attendance certificate =====
  window.attendanceCertificate = function (student, days) {
    generateCertificate({ name: student.name }, `נוכחות מעולה - ${days} ימים רצופים`);
  };

  // ===== 6. Word-like editor =====
  window.openEditor = function (initialText, onSave) {
    const html = `<div class="modal fade show" id="ed-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-xl" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>📝 עורך מסמך</h5><button class="btn-close" onclick="document.getElementById('ed-modal').remove()"></button></div>
          <div class="modal-body">
            <div class="mb-2">
              <button class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('bold')"><b>B</b></button>
              <button class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('italic')"><i>I</i></button>
              <button class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('underline')"><u>U</u></button>
              <button class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('insertUnorderedList')">•</button>
              <button class="btn btn-sm btn-outline-secondary" onclick="document.execCommand('insertOrderedList')">1.</button>
            </div>
            <div id="ed-area" contenteditable="true" style="min-height:400px;border:1px solid #e5e7eb;padding:15px;border-radius:6px;background:#fff;direction:rtl"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="(function(){
              const html=document.getElementById('ed-area').innerHTML;
              window.__edResult=html;
              document.getElementById('ed-modal').remove();
            })()">שמור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('ed-area').innerHTML = initialText || '';
    const observer = new MutationObserver(() => {
      if (!document.getElementById('ed-modal')) {
        observer.disconnect();
        if (onSave) onSave(window.__edResult);
      }
    });
    observer.observe(document.body, { childList: true });
  };

  // ===== 7. Sticker/signature pad =====
  window.openSignaturePad = function (onSign) {
    const html = `<div class="modal fade show" id="sig-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>✍ חתימה</h5><button class="btn-close" onclick="document.getElementById('sig-modal').remove()"></button></div>
          <div class="modal-body">
            <canvas id="sig-canvas" width="500" height="200" style="border:1px solid #e5e7eb;background:#fafafa;width:100%;touch-action:none"></canvas>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('sig-canvas').getContext('2d').clearRect(0,0,500,200)">נקה</button>
            <button class="btn btn-primary" onclick="(function(){
              window.__sigResult=document.getElementById('sig-canvas').toDataURL();
              document.getElementById('sig-modal').remove();
            })()">שמור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const canvas = document.getElementById('sig-canvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    let drawing = false;
    const start = e => { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = e => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const end = () => { drawing = false; };
    const pos = e => {
      const r = canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    };
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); start(e); });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); move(e); });
    canvas.addEventListener('touchend', end);
    const observer = new MutationObserver(() => {
      if (!document.getElementById('sig-modal')) {
        observer.disconnect();
        if (onSign) onSign(window.__sigResult);
      }
    });
    observer.observe(document.body, { childList: true });
  };

  // ===== 8. Class roster print =====
  window.printClassRoster = async function (className) {
    try {
      const r = await api('listStudents', []);
      const students = (r.data || []).filter(s => !className || s['מחזור'] === className);
      const w = window.open('', '_blank');
      w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>רשימת כיתה</title>
        <style>body{font-family:Heebo,Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:6px;border:1px solid #ccc;text-align:right}th{background:#f3f4f6}</style>
        </head><body>
        <h2>רשימת תלמידים${className?' - כיתה '+escHtml(className):''}</h2>
        <table><thead><tr><th>#</th><th>שם</th><th>טלפון אם</th><th>טלפון אב</th></tr></thead><tbody>
        ${students.map((s,i)=>`<tr><td>${i+1}</td><td>${escHtml(s['שם פרטי']||'')} ${escHtml(s['שם משפחה']||'')}</td><td>${escHtml(s['טלפון אם']||'')}</td><td>${escHtml(s['טלפון אב']||'')}</td></tr>`).join('')}
        </tbody></table>
        <script>setTimeout(()=>window.print(),500)</script>
        </body></html>`);
    } catch (e) { alert(e.message); }
  };

  // ===== 9. Permission slip generator =====
  window.permissionSlip = function (event, date) {
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>אישור הורים</title>
      <style>body{font-family:Heebo,Arial;padding:60px;max-width:700px;margin:0 auto;line-height:2}.line{border-bottom:1px solid #000;display:inline-block;min-width:200px}</style>
      </head><body>
      <h2 style="text-align:center">אישור הורים</h2>
      <p>אנו ההורים החתומים מטה מאשרים בזאת לבנינו <span class="line"></span> להשתתף ב-<strong>${escHtml(event||'')}</strong> בתאריך <strong>${escHtml(date||'')}</strong>.</p>
      <br><br>
      <p>שם האם: <span class="line"></span> חתימה: <span class="line"></span></p>
      <p>שם האב: <span class="line"></span> חתימה: <span class="line"></span></p>
      <p>טלפון לחירום: <span class="line"></span></p>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>`);
  };

  // ===== 10. QR code generator (text-based fallback) =====
  window.qrCode = function (text) {
    // Simple URL-based QR via Google Charts API alternative
    return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}" alt="QR" style="border:1px solid #e5e7eb;padding:4px;background:#fff">`;
  };

  console.warn('%c📜 Pack-35 — Documents: certificates, letters, reports, editor, signature pad, QR', 'color:#92400e;font-weight:bold');
})();
