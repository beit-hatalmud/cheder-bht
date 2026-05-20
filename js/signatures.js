// Parent signatures page (חתימות הורים)
let _signaturesData = [];
let _signaturesStudents = [];

async function renderSignatures() {
  const html = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-pen-fill"></i> חתימות הורים</h3>
      <div class="d-flex gap-2 align-items-center">
        ${viewModeToggleHTML('signatures')}
        <button class="btn btn-primary" onclick="sigAddModal()"><i class="bi bi-plus"></i> חתימה חדשה</button>
      </div>
    </div>

    <div class="card p-3 mb-3">
      <div class="row g-2">
        <div class="col-md-6"><input id="sig-search" class="form-control" placeholder="חיפוש לפי תלמיד, סוג, הערות..."></div>
        <div class="col-md-3">
          <select id="sig-status" class="form-select"><option value="">כל הסטטוסים</option></select>
        </div>
        <div class="col-md-3">
          <input id="sig-student" class="form-control" list="sig-student-list" placeholder="חפש תלמיד...">
          <datalist id="sig-student-list"></datalist>
        </div>
      </div>
    </div>

    <div id="sig-list"></div>
    <div id="sig-empty" class="text-center py-5 text-muted d-none">
      <i class="bi bi-pen-fill fs-1"></i>
      <p class="mb-0">אין חתימות מתועדות</p>
    </div>`;
  document.getElementById('page-signatures').innerHTML = html;

  const [sR, sigR] = await Promise.all([api('listStudents', []), api('listSignatures', [])]);
  _signaturesStudents = sR.data || [];
  _signaturesData = sigR.data || [];

  const statuses = [...new Set(_signaturesData.map(s => s['סטטוס']).filter(Boolean))];
  document.getElementById('sig-status').innerHTML = '<option value="">כל הסטטוסים</option>' +
    statuses.map(st => `<option>${escHtml(st)}</option>`).join('');

  document.getElementById('sig-student-list').innerHTML = studentsDatalistOptions(_signaturesStudents, false);
  activateViewMode('signatures');

  ['sig-search','sig-status','sig-student'].forEach(id => document.getElementById(id).oninput = sigRefresh);
  ['sig-status','sig-student'].forEach(id => document.getElementById(id).onchange = sigRefresh);
  sigRefresh();
}

function sigRefresh() {
  const q = (document.getElementById('sig-search').value || '').toLowerCase();
  const status = document.getElementById('sig-status').value;
  const sLabel = document.getElementById('sig-student').value.trim();
  let list = _signaturesData.slice().sort((a,b) => new Date(b['תאריך']||0) - new Date(a['תאריך']||0));
  if (status) list = list.filter(s => s['סטטוס'] === status);
  if (sLabel) {
    const stu = resolveStudent(sLabel, _signaturesStudents);
    if (stu) {
      list = list.filter(s => String(s['תלמיד_מזהה']) === String(stu['מזהה']));
    } else {
      const lc = sLabel.toLowerCase();
      const stuById = {};
      _signaturesStudents.forEach(s => stuById[s['מזהה']] = s);
      list = list.filter(s => {
        const st = stuById[s['תלמיד_מזהה']];
        if (!st) return false;
        return `${st['שם פרטי']||''} ${st['שם משפחה']||''}`.toLowerCase().includes(lc);
      });
    }
  }
  if (q) list = list.filter(s => Object.values(s).some(v => String(v||'').toLowerCase().includes(q)));

  const el = document.getElementById('sig-list');
  document.getElementById('sig-empty').classList.toggle('d-none', list.length > 0);
  const stuById = {};
  _signaturesStudents.forEach(s => stuById[s['מזהה']] = s);
  el.innerHTML = list.map(s => {
    const stu = stuById[s['תלמיד_מזהה']];
    const stuName = stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim() : '?';
    const dt = s['תאריך'] ? formatDateBoth(s['תאריך']) : '';
    const statusColor = s['סטטוס'] === 'חתום' ? 'bg-success-subtle text-success-emphasis' :
                       s['סטטוס'] === 'מחכה' ? 'bg-warning-subtle text-warning-emphasis' :
                       'bg-light text-dark';
    return `<div class="card p-3 mb-2">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <strong>${escHtml(stuName)}</strong>
          ${stu ? `<span class="text-muted ms-2">כיתה ${escHtml(stu['מחזור']||'')}</span>` : ''}
          ${s['סוג'] ? `<span class="badge bg-light text-dark me-2">${escHtml(s['סוג'])}</span>` : ''}
          ${s['סטטוס'] ? `<span class="badge ${statusColor}">${escHtml(s['סטטוס'])}</span>` : ''}
        </div>
        <div class="d-flex gap-1 align-items-center">
          <small class="text-muted">${escHtml(dt)}</small>
          <button class="btn btn-sm btn-outline-success p-1" onclick="sigPrint(${s['מזהה']})" title="הדפסה / PDF"><i class="bi bi-printer"></i></button>
          <button class="btn btn-sm btn-outline-info p-1" onclick="sigEmailParents(${s['מזהה']})" title="שלח להורים"><i class="bi bi-envelope"></i></button>
          <button class="btn btn-sm btn-outline-primary p-1" onclick="sigEdit(${s['מזהה']})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger p-1" onclick="sigDelete(${s['מזהה']})"><i class="bi bi-trash"></i></button>
        </div>
      </div>
      ${s['סוג'] ? `<div class="mt-2"><strong>סוג:</strong> ${escHtml(s['סוג'])}</div>` : ''}
      ${s['תיאור'] ? `<div class="mt-2" style="white-space:pre-wrap;line-height:1.7">${escHtml(s['תיאור'])}</div>` : ''}
      ${s['הערות'] ? `<div class="mt-2 small text-muted">${escHtml(s['הערות'])}</div>` : ''}
    </div>`;
  }).join('');
}

function sigAddModal(existing) {
  const e = existing || {};
  const preStu = e['תלמיד_מזהה'] ? _signaturesStudents.find(s => String(s['מזהה']) === String(e['תלמיד_מזהה'])) : null;
  const preStuLabel = preStu ? studentDisplay(preStu) : '';
  const html = `<div class="modal fade" id="sig-modal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content">
    <div class="modal-header"><h5>${existing ? 'עריכת' : 'חתימה חדשה —'} חתימת הורים</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <div class="row g-2 mb-2">
        <div class="col-md-7"><label class="form-label">תלמיד</label>
          <input id="siga-student" class="form-control" list="siga-student-list" placeholder="הקלד שם תלמיד..." autocomplete="off" value="${escHtml(preStuLabel)}">
          <datalist id="siga-student-list">${studentsDatalistOptions(_signaturesStudents, true)}</datalist>
        </div>
        <div class="col-md-5"><label class="form-label">תאריך</label><input id="siga-date" type="date" class="form-control" value="${e['תאריך'] || new Date().toISOString().slice(0,10)}"></div>
      </div>
      <div class="row g-2 mb-2">
        <div class="col-md-6"><label class="form-label">סוג</label><input id="siga-type" class="form-control" value="${escHtml(e['סוג']||'')}" placeholder="הודעה, שיעורי בית, טיול..."></div>
        <div class="col-md-6"><label class="form-label">סטטוס</label>
          <select id="siga-status" class="form-select">
            <option value="מחכה" ${e['סטטוס'] === 'מחכה' ? 'selected' : ''}>מחכה</option>
            <option value="חתום" ${e['סטטוס'] === 'חתום' ? 'selected' : ''}>חתום</option>
          </select>
        </div>
      </div>
      <div class="mb-2"><label class="form-label">תיאור</label><textarea id="siga-desc" class="form-control" rows="6" style="white-space:pre-wrap">${escHtml(e['תיאור']||'')}</textarea></div>
      <div class="mb-2"><label class="form-label">הערות</label><textarea id="siga-notes" class="form-control" rows="2">${escHtml(e['הערות']||'')}</textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button>
      <button class="btn btn-primary" onclick="sigSave(${existing ? e['מזהה'] : 'null'})">שמור</button>
    </div>
  </div></div></div>`;
  cleanupModal('sig-modal');
  document.body.insertAdjacentHTML('beforeend', html);
  const _m = document.getElementById('sig-modal');
  new bootstrap.Modal(_m).show();
  _m.addEventListener('hidden.bs.modal', () => cleanupModal('sig-modal'), { once: true });
}

function sigEdit(id) {
  const s = _signaturesData.find(x => String(x['מזהה']) === String(id));
  if (s) sigAddModal(s);
}

async function sigSave(editId) {
  const typedLabel = document.getElementById('siga-student').value.trim();
  const stu = resolveStudent(typedLabel, _signaturesStudents);
  if (typedLabel && !stu) return alert('לא נמצא תלמיד בשם זה. בחר מתוך הרשימה.');
  const obj = {
    'תלמיד_מזהה': stu ? parseInt(stu['מזהה']) : 0,
    'תאריך': document.getElementById('siga-date').value,
    'סוג': document.getElementById('siga-type').value.trim(),
    'סטטוס': document.getElementById('siga-status').value,
    'תיאור': document.getElementById('siga-desc').value.trim(),
    'הערות': document.getElementById('siga-notes').value.trim(),
  };
  if (!obj['תלמיד_מזהה']) return alert('בחר תלמיד');
  if (editId) obj['מזהה'] = editId;
  const r = await api(editId ? 'updateSignature' : 'addSignature', [obj]);
  if (r.ok) {
    hideModal('sig-modal');
    notify('נשמר', 'success');
    renderSignatures();
  } else alert(r.error || 'שגיאה');
}

async function sigDelete(id) {
  if (!confirm('למחוק את החתימה?')) return;
  const r = await api('deleteSignature', [id]);
  if (r.ok) { notify('נמחק', 'success'); renderSignatures(); } else alert(r.error || 'שגיאה במחיקה');
}

function sigReportHtml(s, stu) {
  const stuName = stu ? `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim() : '';
  const dt = s['תאריך'] ? formatDateBoth(s['תאריך']) : '';
  const desc = String(s['תיאור']||'').split('\n').filter(l => l.trim()).map(l => `<p style="margin:8pt 0">${escHtml(l)}</p>`).join('');
  const title = `${s['סוג'] || 'חתימת הורים'} — ${stuName}`;
  return `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>${escHtml(title)}</title>
<style>
@page{size:A4;margin:1.5cm}
body{font-family:Arial,Heebo,sans-serif;direction:rtl;color:#1f2937;line-height:1.65}
h1{color:#0066cc;border-bottom:3px solid #0066cc;padding-bottom:8pt;margin:0 0 12pt 0;font-size:20pt}
.meta{color:#6b7280;margin:12pt 0;font-size:10.5pt}
.meta span{display:block;margin-bottom:4pt}
.signature-box{margin-top:24pt;padding:16pt;background:#f3f4f6;border:2px dashed #d1d5db;border-radius:4px;text-align:center}
.signature-box p{margin:4pt 0;font-size:11pt;color:#6b7280}
.signature-box .line{border-top:1px solid #1f2937;width:200px;margin:20pt auto 4pt}
.signature-box .label{font-weight:bold;font-size:10pt}
@media print{.no-print{display:none}}
</style></head><body>
<button class="no-print" onclick="window.print()" style="background:#0066cc;color:#fff;border:none;padding:10pt 20pt;border-radius:6px;cursor:pointer;font-size:14pt">🖨 הדפס / שמור כ-PDF</button>
<h1>${escHtml(title)}</h1>
<div class="meta">
  ${stu ? `<span><b>תלמיד:</b> ${escHtml(stuName)} (כיתה ${escHtml(stu['מחזור']||'')})</span>` : ''}
  ${dt ? `<span><b>תאריך:</b> ${escHtml(dt)}</span>` : ''}
  ${s['סוג'] ? `<span><b>סוג:</b> ${escHtml(s['סוג'])}</span>` : ''}
  ${s['סטטוס'] ? `<span><b>סטטוס:</b> ${escHtml(s['סטטוס'])}</span>` : ''}
</div>
${desc}
<div class="signature-box">
  <p>חתימת הורים:</p>
  <div class="line"></div>
  <div class="label">תאריך: _____________</div>
</div>
${s['הערות'] ? `<div style="margin-top:20pt;padding:10pt;background:#fffbeb;border-right:4px solid #f59e0b;font-size:10pt;color:#78350f"><b>הערות:</b> ${escHtml(s['הערות'])}</div>` : ''}
<script>
const _doPrint = () => window.print();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(_doPrint, 200));
else window.addEventListener('load', () => setTimeout(_doPrint, 800));
</script>
</body></html>`;
}

function _findSignature(id) {
  return _signaturesData.find(x => String(x['מזהה']) === String(id));
}
function _findStuSig(sid) {
  return _signaturesStudents.find(x => String(x['מזהה']) === String(sid));
}

function sigPrint(id) {
  const s = _findSignature(id);
  if (!s) return alert('החתימה לא נמצאה');
  const stu = _findStuSig(s['תלמיד_מזהה']);
  const html = sigReportHtml(s, stu);
  const w = window.open('', '_blank');
  if (!w) return alert('הדפדפן חוסם פופ-אפ — אפשר אותו ונסה שוב');
  w.document.write(html);
  w.document.close();
}

async function sigEmailParents(id) {
  const s = _findSignature(id);
  if (!s) return alert('החתימה לא נמצאה');
  const stu = _findStuSig(s['תלמיד_מזהה']);
  if (!stu) return alert('התלמיד לא נמצא');
  const fullName = `${stu['שם פרטי']||''} ${stu['שם משפחה']||''}`.trim();
  const subject = encodeURIComponent(`${s['סוג'] || 'חתימת הורים'} — ${fullName}`);
  const desc = String(s['תיאור']||'').trim();
  const body = encodeURIComponent(
    `שלום,\n\nבקשה לחתימה — ${fullName}.\n` +
    (s['תאריך'] ? `תאריך: ${formatGreg(s['תאריך'])}\n` : '') +
    (s['סוג'] ? `סוג: ${s['סוג']}\n` : '') +
    `\n${desc}\n\nבברכה,\nבית התלמוד · בית שמש`
  );
  window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`, '_blank');
  notify('Gmail נפתח', 'success');
}
