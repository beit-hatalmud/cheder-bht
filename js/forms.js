// טפסים וחתימות הורים — מובנה בתוך פאנל cheder-bht
// משתמש בעמוד החתימה הציבורי הקיים ב-yossi6742853.github.io/parent-signature/
// כל פעולה דורשת מנהל מחובר (אין סיסמה — האדמין כבר authentic מ-cheder login).

const PSIG_PUBLIC_BASE = 'https://yossi6742853.github.io/parent-signature/';
const PSIG_APPS = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
const PSIG_TOKEN = 'BHT_AGENT_2026';
const PSIG_CUSTOM_KEY = 'cheder_custom_forms_v1';

const FORM_TEMPLATES = {
  trip: { icon:'🚌', title:'אישור יציאה לטיול', fields:[
    {id:'student_name',label:'שם התלמיד',type:'text',required:true},
    {id:'cycle',label:'מחזור / כיתה',type:'text',required:true},
    {id:'parent_name',label:'שם ההורה',type:'text',required:true},
    {id:'parent_phone',label:'טלפון ההורה',type:'tel',required:true},
    {id:'trip_date',label:'תאריך הטיול',type:'date',required:true},
    {id:'trip_destination',label:'יעד הטיול',type:'text',required:true},
    {id:'medical_notes',label:'הערות רפואיות / רגישויות',type:'textarea',rows:2},
    {id:'consent_trip',label:'אני מאשר את יציאת בני לטיול',type:'checkbox',required:true},
    {id:'consent_first_aid',label:'אני מאשר טיפול ראשוני במקרה חירום',type:'checkbox'},
  ]},
  photo: { icon:'📷', title:'אישור פרסום תמונות', fields:[
    {id:'student_name',label:'שם התלמיד',type:'text',required:true},
    {id:'parent_name',label:'שם ההורה',type:'text',required:true},
    {id:'parent_phone',label:'טלפון ההורה',type:'tel',required:true},
    {id:'consent_internal',label:'אני מאשר פרסום בעלון פנימי',type:'checkbox'},
    {id:'consent_website',label:'אני מאשר פרסום באתר המוסד',type:'checkbox'},
    {id:'consent_social',label:'אני מאשר פרסום ברשתות חברתיות',type:'checkbox'},
    {id:'notes',label:'הערות',type:'textarea',rows:2},
  ]},
  medical: { icon:'🏥', title:'אישור טיפול רפואי', fields:[
    {id:'student_name',label:'שם התלמיד',type:'text',required:true},
    {id:'student_id',label:'תעודת זהות התלמיד',type:'text',required:true},
    {id:'parent_name',label:'שם ההורה',type:'text',required:true},
    {id:'parent_phone',label:'טלפון ההורה',type:'tel',required:true},
    {id:'allergies',label:'אלרגיות / רגישויות',type:'textarea',rows:2},
    {id:'medications',label:'תרופות קבועות',type:'textarea',rows:2},
    {id:'doctor_name',label:'שם רופא משפחה',type:'text'},
    {id:'doctor_phone',label:'טלפון רופא',type:'tel'},
    {id:'consent_treat',label:'אני מאשר טיפול רפואי במקרה חירום',type:'checkbox',required:true},
    {id:'consent_call',label:'אני מאשר חיוג למוקד 101 במקרה צורך',type:'checkbox',required:true},
  ]},
  general: { icon:'📄', title:'אישור הורים כללי', fields:[
    {id:'student_name',label:'שם התלמיד',type:'text',required:true},
    {id:'parent_name',label:'שם ההורה',type:'text',required:true},
    {id:'parent_phone',label:'טלפון ההורה',type:'tel',required:true},
    {id:'subject',label:'נושא האישור',type:'text',required:true},
    {id:'content',label:'תוכן האישור (פירוט מלא)',type:'textarea',rows:5,required:true},
  ]},
  payment: { icon:'💰', title:'הצהרת תשלום', fields:[
    {id:'student_name',label:'שם התלמיד',type:'text',required:true},
    {id:'parent_name',label:'שם ההורה',type:'text',required:true},
    {id:'parent_id',label:'תעודת זהות ההורה',type:'text',required:true},
    {id:'parent_phone',label:'טלפון ההורה',type:'tel',required:true},
    {id:'amount',label:'סכום (₪)',type:'number',required:true},
    {id:'purpose',label:'מטרת התשלום',type:'text',required:true},
    {id:'method',label:'אמצעי תשלום',type:'select',options:['העברה בנקאית','שיק','מזומן','כרטיס אשראי','הוראת קבע'],required:true},
    {id:'consent_payment',label:'אני מאשר את חיוב הסכום',type:'checkbox',required:true},
  ]},
  emergency: { icon:'☎️', title:'עדכון פרטי חירום', fields:[
    {id:'student_name',label:'שם התלמיד',type:'text',required:true},
    {id:'cycle',label:'מחזור / כיתה',type:'text',required:true},
    {id:'mother_name',label:'שם האם',type:'text'},
    {id:'mother_phone',label:'טלפון האם',type:'tel'},
    {id:'father_name',label:'שם האב',type:'text'},
    {id:'father_phone',label:'טלפון האב',type:'tel'},
    {id:'emergency_contact_name',label:'איש קשר נוסף לחירום',type:'text'},
    {id:'emergency_contact_phone',label:'טלפון איש קשר חירום',type:'tel'},
    {id:'emergency_contact_relation',label:'יחס לתלמיד',type:'text'},
    {id:'address',label:'כתובת מגורים',type:'text'},
  ]},
};

let _formsCurrentTpl = null;

function _loadCustomForms() {
  try { return JSON.parse(localStorage.getItem(PSIG_CUSTOM_KEY) || '{}'); } catch { return {}; }
}
function _saveCustomForms(d) { localStorage.setItem(PSIG_CUSTOM_KEY, JSON.stringify(d)); }
function _allForms() { return Object.assign({}, FORM_TEMPLATES, _loadCustomForms()); }

async function renderForms() {
  Object.assign(FORM_TEMPLATES, _loadCustomForms());
  const all = _allForms();
  document.getElementById('page-forms').innerHTML = `
    <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <h3 class="mb-0"><i class="bi bi-pencil-square text-primary"></i> טפסים וחתימות הורים</h3>
      <button class="btn btn-outline-success btn-sm" onclick="formsShowCustomBuilder()"><i class="bi bi-plus-square"></i> טופס חדש מותאם</button>
    </div>

    <h5 class="mb-3"><span class="badge bg-primary me-2">1</span>בחר סוג טופס</h5>
    <div class="row g-3 mb-4" id="forms-tpl-grid">
      ${Object.entries(all).map(([key, f]) => `
        <div class="col-6 col-md-4 col-lg-3">
          <div class="card forms-tile h-100" data-key="${escAttr(key)}" onclick="formsSelectTpl('${escAttr(key).replace(/'/g,"\\'")}')">
            <div class="card-body text-center p-3">
              <div style="font-size:2.5rem;line-height:1">${f.icon || '📋'}</div>
              <h6 class="mt-2 mb-0">${escHtml(f.title)}</h6>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div id="forms-customize" class="d-none">
      <h5 class="mb-3"><span class="badge bg-primary me-2">2</span>מלא ערכים מראש <small class="text-muted fw-normal">(ההורה יוכל לערוך)</small></h5>
      <div class="card p-3 mb-3" id="forms-prefill"></div>

      <h5 class="mb-3"><span class="badge bg-primary me-2">3</span>הגדרות נוספות</h5>
      <div class="card p-3 mb-3">
        <div class="row g-2">
          <div class="col-md-6">
            <label class="form-label small fw-bold">מזהה (יופיע בכותרת המייל)</label>
            <input id="forms-ref" class="form-control" placeholder="לדוגמה: טיול ל\"ג בעומר תשפו">
          </div>
          <div class="col-md-6">
            <label class="form-label small fw-bold">מייל יעד לחתימה</label>
            <input id="forms-recipient" class="form-control" value="6787012@gmail.com">
          </div>
        </div>
      </div>

      <div class="d-flex flex-wrap gap-2 mb-3">
        <button class="btn btn-primary" onclick="formsGenerateLink()"><i class="bi bi-link-45deg"></i> צור קישור</button>
        <button class="btn btn-success" onclick="formsOpenInGmail()"><i class="bi bi-envelope-fill"></i> פתח טיוטת מייל</button>
        <button class="btn btn-outline-info" onclick="formsPreview()"><i class="bi bi-eye"></i> תצוגה מקדימה</button>
      </div>

      <div id="forms-share-box" class="d-none alert" style="background:linear-gradient(135deg,#e0f2fe,#dbeafe);border:1px solid #93c5fd">
        <h6 class="mb-2"><i class="bi bi-link-45deg"></i> הקישור מוכן</h6>
        <div id="forms-share-url" class="p-2 mb-2" style="background:#fff;border-radius:6px;font-family:monospace;font-size:.85rem;word-break:break-all;direction:ltr;text-align:left"></div>
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-sm btn-primary" onclick="formsCopyLink()"><i class="bi bi-clipboard"></i> העתק</button>
          <a id="forms-open-link" class="btn btn-sm btn-success" target="_blank"><i class="bi bi-box-arrow-up-right"></i> פתח</a>
          <button class="btn btn-sm btn-success" onclick="formsShareWA()"><i class="bi bi-whatsapp"></i> WhatsApp</button>
          <button class="btn btn-sm btn-outline-secondary" onclick="formsShareSms()"><i class="bi bi-chat"></i> SMS</button>
        </div>
      </div>
    </div>

    <div id="forms-cb" class="d-none">
      <h5 class="mb-3"><i class="bi bi-plus-square text-success"></i> בונה טופס מותאם אישית</h5>
      <div class="card p-3 mb-3">
        <input id="forms-cb-title" class="form-control mb-3" placeholder="כותרת הטופס">
        <div id="forms-cb-fields"></div>
        <button class="btn btn-outline-primary btn-sm mt-2" onclick="formsCbAddField()"><i class="bi bi-plus"></i> הוסף שדה</button>
        <hr>
        <div class="d-flex gap-2">
          <button class="btn btn-success" onclick="formsCbSave()"><i class="bi bi-save"></i> שמור</button>
          <button class="btn btn-link" onclick="formsHideCustomBuilder()">ביטול</button>
        </div>
      </div>
    </div>

    <style>
      .forms-tile{cursor:pointer;transition:all .2s;border:2px solid transparent}
      .forms-tile:hover{transform:translateY(-3px);box-shadow:0 6px 18px rgba(0,0,0,.1);border-color:#93c5fd}
      .forms-tile.active{border-color:#3b82f6;background:linear-gradient(135deg,#dbeafe,#e0f2fe)}
    </style>
  `;
}

function formsSelectTpl(key) {
  _formsCurrentTpl = key;
  document.querySelectorAll('.forms-tile').forEach(t => t.classList.toggle('active', t.dataset.key === key));
  document.getElementById('forms-customize').classList.remove('d-none');
  document.getElementById('forms-cb').classList.add('d-none');
  document.getElementById('forms-share-box').classList.add('d-none');
  const f = _allForms()[key];
  document.getElementById('forms-prefill').innerHTML = f.fields.filter(fld => fld.type !== 'checkbox').map(fld => `
    <div class="mb-2">
      <label class="form-label small fw-bold">${escHtml(fld.label)}</label>
      <input id="forms-pre-${escAttr(fld.id)}" class="form-control form-control-sm" type="${fld.type === 'textarea' ? 'text' : (fld.type || 'text')}">
    </div>
  `).join('');
  setTimeout(() => document.getElementById('forms-customize').scrollIntoView({behavior:'smooth',block:'start'}), 50);
}

async function _formsBuildUrl() {
  const f = _allForms()[_formsCurrentTpl];
  const ref = document.getElementById('forms-ref').value.trim();
  const params = new URLSearchParams({action:'parent_form_create_link', token:PSIG_TOKEN, tpl:_formsCurrentTpl, ref});
  const r = await fetch(PSIG_APPS + '?' + params.toString());
  const d = await r.json();
  if (!d.ok) throw new Error(d.error || 'שגיאה ביצירת טוקן');
  const lt = d.token;
  const qp = new URLSearchParams({tpl:_formsCurrentTpl, lt});
  f.fields.forEach(fld => {
    const el = document.getElementById('forms-pre-' + fld.id);
    if (el && el.value) qp.set(fld.id, el.value);
  });
  const to = document.getElementById('forms-recipient').value.trim();
  if (ref) qp.set('ref', ref);
  if (to) qp.set('to', to);
  return PSIG_PUBLIC_BASE + 'index.html?' + qp.toString();
}

async function formsGenerateLink() {
  if (!_formsCurrentTpl) return alert('בחר סוג טופס');
  try {
    const url = await _formsBuildUrl();
    document.getElementById('forms-share-url').textContent = url;
    document.getElementById('forms-open-link').href = url;
    const box = document.getElementById('forms-share-box');
    box.classList.remove('d-none');
    box.scrollIntoView({behavior:'smooth'});
  } catch (e) { alert('שגיאה: ' + e.message); }
}

function formsCopyLink() {
  navigator.clipboard.writeText(document.getElementById('forms-share-url').textContent);
  if (typeof window.notify === 'function') window.notify('הקישור הועתק', 'ok');
  else alert('הועתק');
}

function formsShareWA() {
  const url = document.getElementById('forms-share-url').textContent;
  const f = _allForms()[_formsCurrentTpl];
  window.open('https://wa.me/?text=' + encodeURIComponent(`${f.title}\n${url}`), '_blank');
}

function formsShareSms() {
  const url = document.getElementById('forms-share-url').textContent;
  const f = _allForms()[_formsCurrentTpl];
  window.open(`sms:?body=${encodeURIComponent(f.title + ' ' + url)}`);
}

async function formsPreview() {
  if (!_formsCurrentTpl) return alert('בחר סוג טופס');
  await formsGenerateLink();
  window.open(document.getElementById('forms-share-url').textContent, '_blank');
}

async function formsOpenInGmail() {
  if (!_formsCurrentTpl) return alert('בחר סוג טופס');
  try {
    const url = await _formsBuildUrl();
    const f = _allForms()[_formsCurrentTpl];
    const ref = document.getElementById('forms-ref').value.trim();
    const subject = encodeURIComponent(f.title + (ref ? ' — ' + ref : ''));
    const body = encodeURIComponent(`שלום,\n\nאנא מלא וחתום על הטופס:\n\n${f.title}${ref ? '\nמזהה: ' + ref : ''}\n${url}\n\nתודה,\nבית התלמוד`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  } catch (e) { alert('שגיאה: ' + e.message); }
}

function formsShowCustomBuilder() {
  document.getElementById('forms-cb').classList.remove('d-none');
  document.getElementById('forms-customize').classList.add('d-none');
  document.getElementById('forms-cb-title').value = '';
  document.getElementById('forms-cb-fields').innerHTML = '';
  formsCbAddField();
  document.getElementById('forms-cb').scrollIntoView({behavior:'smooth'});
}
function formsHideCustomBuilder() { document.getElementById('forms-cb').classList.add('d-none'); }

let _formsCbCount = 0;
function formsCbAddField() {
  _formsCbCount++;
  const id = _formsCbCount;
  document.getElementById('forms-cb-fields').insertAdjacentHTML('beforeend', `
    <div class="row g-2 mb-2 border rounded p-2" data-fcb="${id}">
      <div class="col-md-4"><input class="form-control form-control-sm fcb-label" placeholder="תווית השדה"></div>
      <div class="col-md-3"><select class="form-select form-select-sm fcb-type">
        <option value="text">טקסט</option><option value="number">מספר</option><option value="date">תאריך</option>
        <option value="tel">טלפון</option><option value="email">מייל</option><option value="textarea">פסקה</option>
        <option value="checkbox">צ׳קבוקס</option><option value="select">בחירה מרשימה</option>
      </select></div>
      <div class="col-md-3"><input class="form-control form-control-sm fcb-options" placeholder="אופציות (מופרדות ב-|)"></div>
      <div class="col-md-1 form-check pt-1"><input type="checkbox" class="form-check-input fcb-required" title="חובה?"></div>
      <div class="col-md-1"><button class="btn btn-sm btn-outline-danger" onclick="this.closest('[data-fcb]').remove()"><i class="bi bi-x"></i></button></div>
    </div>
  `);
}

function formsCbSave() {
  const title = document.getElementById('forms-cb-title').value.trim();
  if (!title) return alert('הזן כותרת');
  const fields = [];
  document.querySelectorAll('[data-fcb]').forEach((row, i) => {
    const label = row.querySelector('.fcb-label').value.trim();
    if (!label) return;
    const type = row.querySelector('.fcb-type').value;
    const opts = row.querySelector('.fcb-options').value.trim();
    const req = row.querySelector('.fcb-required').checked;
    const f = {id:'cstm_' + i + '_' + label.replace(/\s/g,'_'), label, type, required:req};
    if (type === 'select' && opts) f.options = opts.split('|').map(s => s.trim());
    if (type === 'textarea') f.rows = 3;
    fields.push(f);
  });
  if (!fields.length) return alert('הוסף לפחות שדה אחד');
  const customs = _loadCustomForms();
  customs['custom_' + Date.now()] = {icon:'⭐', title, fields};
  _saveCustomForms(customs);
  alert('הטופס נשמר');
  formsHideCustomBuilder();
  renderForms();
}

window.renderForms = renderForms;
window.formsSelectTpl = formsSelectTpl;
window.formsGenerateLink = formsGenerateLink;
window.formsCopyLink = formsCopyLink;
window.formsShareWA = formsShareWA;
window.formsShareSms = formsShareSms;
window.formsPreview = formsPreview;
window.formsOpenInGmail = formsOpenInGmail;
window.formsShowCustomBuilder = formsShowCustomBuilder;
window.formsHideCustomBuilder = formsHideCustomBuilder;
window.formsCbAddField = formsCbAddField;
window.formsCbSave = formsCbSave;
