// behavior-pack-17.js — Parent Communication. 2026-05-24
(function () {
  'use strict';

  // ===== 1. SMS לאם/אב על אירוע חמור =====
  window.smsParent = function (student, msg) {
    const phone = student?.['טלפון אם'] || student?.['טלפון אב'] || '';
    if (!phone) {
      if (typeof toast === 'function') toast('אין מספר טלפון', 'warn');
      return;
    }
    const cleanPhone = String(phone).replace(/[^0-9+]/g, '');
    const text = encodeURIComponent(msg || 'הודעה מבית התלמוד');
    window.open(`sms:${cleanPhone}?body=${text}`, '_blank');
  };

  // ===== 2. WhatsApp לאם/אב =====
  window.whatsappParent = function (student, msg) {
    const phone = student?.['טלפון אם'] || student?.['טלפון אב'] || '';
    if (!phone) { if (typeof toast === 'function') toast('אין מספר טלפון', 'warn'); return; }
    let cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '972' + cleanPhone.slice(1);
    const text = encodeURIComponent(msg || `שלום, מבית התלמוד לגבי ${(student['שם פרטי']||'')}`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // ===== 3. מייל מובנה להורה =====
  window.emailParent = function (student, subject, body) {
    const email = student?.['אימייל'] || student?.['מייל אם'] || student?.['מייל אב'] || '';
    if (!email) { if (typeof toast === 'function') toast('אין כתובת מייל', 'warn'); return; }
    const s = encodeURIComponent(subject || `עדכון על ${student['שם פרטי']||'התלמיד'}`);
    const b = encodeURIComponent(body || '');
    window.open(`mailto:${email}?subject=${s}&body=${b}`, '_blank');
  };

  // ===== 4. בחר תבנית הודעה =====
  window.MESSAGE_TEMPLATES = {
    appreciation: 'שלום, רציתי לעדכן שהתלמיד שלכם {name} מתקדם יפה. אנו גאים בו.',
    concern: 'שלום, אשמח לדבר איתכם לגבי {name}. תוכלו להתקשר אלי?',
    behavior: 'שלום, היום היה אירוע עם {name}. אבקש לתאם שיחה.',
    achievement: 'מזל טוב! {name} עשה דבר מיוחד היום!',
    reminder: 'תזכורת: אסיפת הורים מתקרבת. נא לאשר השתתפות.',
    homework: 'שלום, {name} שכח להגיש שיעורי בית. אשמח לעדכון.',
    illness: 'שלום, {name} מרגיש לא טוב. נא אסוף ממוקדם.',
  };

  window.parentMessageDialog = function (studentId) {
    api('listStudents', []).then(r => {
      const stu = (r.data || []).find(s => String(s['מזהה']) === String(studentId));
      if (!stu) return alert('תלמיד לא נמצא');
      const name = `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim();
      const html = `<div class="modal fade show" id="pm-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
        <div class="modal-dialog" onclick="event.stopPropagation()">
          <div class="modal-content" style="direction:rtl">
            <div class="modal-header"><h5><i class="bi bi-chat-heart"></i> הודעה להורי ${escHtml(name)}</h5><button class="btn-close" onclick="document.getElementById('pm-modal').remove()"></button></div>
            <div class="modal-body">
              <select id="pm-template" class="form-select mb-2">
                <option value="">בחר תבנית...</option>
                <option value="appreciation">💛 הערכה</option>
                <option value="achievement">🌟 הישג</option>
                <option value="behavior">⚠ התנהגות</option>
                <option value="concern">📞 דאגה</option>
                <option value="reminder">🔔 תזכורת</option>
                <option value="homework">📝 שיעורי בית</option>
                <option value="illness">🤒 חולי</option>
              </select>
              <textarea id="pm-text" class="form-control mb-2" rows="4" placeholder="הודעה..."></textarea>
              <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-success btn-sm" onclick="(function(){const t=document.getElementById('pm-text').value;whatsappParent(${JSON.stringify(stu).replace(/"/g,'&quot;')},t);document.getElementById('pm-modal').remove()})()"><i class="bi bi-whatsapp"></i> WhatsApp</button>
                <button class="btn btn-primary btn-sm" onclick="(function(){const t=document.getElementById('pm-text').value;smsParent(${JSON.stringify(stu).replace(/"/g,'&quot;')},t);document.getElementById('pm-modal').remove()})()"><i class="bi bi-chat"></i> SMS</button>
                <button class="btn btn-info btn-sm" onclick="(function(){const t=document.getElementById('pm-text').value;emailParent(${JSON.stringify(stu).replace(/"/g,'&quot;')},'עדכון מבית התלמוד',t);document.getElementById('pm-modal').remove()})()"><i class="bi bi-envelope"></i> מייל</button>
                <button class="btn btn-warning btn-sm" onclick="callParent(${JSON.stringify(stu).replace(/"/g,'&quot;')})"><i class="bi bi-telephone"></i> חיוג</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', html);
      const tplSel = document.getElementById('pm-template');
      tplSel.onchange = () => {
        const tpl = MESSAGE_TEMPLATES[tplSel.value];
        if (tpl) document.getElementById('pm-text').value = tpl.replace(/\{name\}/g, name);
      };
    });
  };

  // ===== 5. חיוג מהיר =====
  window.callParent = function (student) {
    const phone = student?.['טלפון אם'] || student?.['טלפון אב'] || '';
    if (!phone) { if (typeof toast === 'function') toast('אין מספר טלפון', 'warn'); return; }
    window.location.href = `tel:${String(phone).replace(/[^0-9+]/g, '')}`;
  };

  // ===== 6. היסטוריית תקשורת עם הורים =====
  window.logParentContact = function (sid, channel, msg) {
    try {
      const log = JSON.parse(localStorage.getItem('bht_parent_contact') || '[]');
      log.push({ ts: Date.now(), sid, channel, msg: String(msg).substring(0, 200) });
      if (log.length > 200) log.shift();
      localStorage.setItem('bht_parent_contact', JSON.stringify(log));
    } catch (_) { }
  };

  window.parentContactHistory = function (sid) {
    try {
      const log = JSON.parse(localStorage.getItem('bht_parent_contact') || '[]');
      return log.filter(l => !sid || String(l.sid) === String(sid)).reverse();
    } catch (_) { return []; }
  };

  // ===== 7. כפתור "הודעה להורה" בכרטיס תלמיד =====
  setInterval(() => {
    document.querySelectorAll('#viewStuModal .modal-footer:not([data-pm-btn])').forEach(footer => {
      footer.dataset.pmBtn = '1';
      const sid = footer.closest('.modal').querySelector('[onclick*="editStudent"]')?.getAttribute('onclick')?.match(/editStudent\((\d+)\)/)?.[1];
      if (!sid) return;
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-success';
      btn.innerHTML = '<i class="bi bi-chat-heart"></i> הודעה להורה';
      btn.onclick = () => parentMessageDialog(parseInt(sid));
      footer.insertBefore(btn, footer.firstChild);
    });
  }, 2000);

  // ===== 8. broadcast הודעה לכל ההורים =====
  window.broadcastToParents = async function (subject, body) {
    if (!confirm(`לשלוח לכל ההורים?\n\nנושא: ${subject}\nתוכן: ${body.substring(0, 100)}...`)) return;
    try {
      const r = await api('listStudents', []);
      const students = r.data || [];
      const emails = students.map(s => s['אימייל'] || '').filter(Boolean);
      if (!emails.length) return alert('אין מיילים');
      window.open(`mailto:?bcc=${emails.join(',')}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    } catch (e) { alert(e.message); }
  };

  // ===== 9. תזכורת שבועית להורים =====
  window.weeklyParentReport = async function (sid) {
    try {
      const [stRes, evRes] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const stu = (stRes.data || []).find(s => String(s['מזהה']) === String(sid));
      if (!stu) return '';
      const week = Date.now() - 7 * 86400000;
      const events = (evRes.data || []).filter(e =>
        String(e['תלמיד_מזהה']) === String(sid) &&
        new Date(e['תאריך']).getTime() > week
      );
      const positive = events.filter(e => e['חומרה'] === 'נמוכה').length;
      const negative = events.filter(e => e['חומרה'] === 'גבוהה').length;
      return `שלום, סיכום שבועי לגבי ${stu['שם פרטי']||''} ${stu['שם משפחה']||''}:

✓ דיווחים חיוביים: ${positive}
⚠ אירועים דורשי תשומת לב: ${negative}

${events.slice(0, 3).map(e => `• ${(e['תיאור']||'').substring(0,80)}`).join('\n')}

בברכה,
צוות בית התלמוד`;
    } catch (_) { return ''; }
  };

  // ===== 10. קישור שיתוף עם הורה =====
  window.shareWithParent = function (sid) {
    const link = `${location.origin}${location.pathname}#stuPortal/${sid}`;
    if (navigator.share) {
      navigator.share({ title: 'בית התלמוד - כרטיס תלמיד', url: link });
    } else {
      navigator.clipboard.writeText(link).then(() => {
        if (typeof toast === 'function') toast('קישור הועתק', 'success');
      });
    }
  };

  console.warn('%c💬 Pack-17 — Parent Communication: SMS/WhatsApp/Email + templates + broadcast', 'color:#16a34a;font-weight:bold');
})();
