// Google Sheets = single source of truth. localStorage = cache only.
// GitHub Pages hosts only the UI; all data lives in the Sheet.

const STORAGE_KEY = 'cheder_bht_data';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
const AGENT_TOKEN = 'BHT_AGENT_2026';
const INSTANCE = 'bht';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1-GFdXr0diOlof-mMAp2Qci0fVjq0QHf21rv3FNFHQOs/edit';

// Password hashing — SHA-256 with site-wide salt
const PWD_SALT = 'BHT2026!cheder';
const PWD_PREFIX = 'sha256:';

async function hashPassword(pw) {
  if (!pw) return '';
  const data = new TextEncoder().encode(PWD_SALT + ':' + pw);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  return PWD_PREFIX + hex;
}

async function verifyPassword(stored, attempt) {
  if (!stored || !attempt) return false;
  if (stored.startsWith(PWD_PREFIX)) {
    return (await hashPassword(attempt)) === stored;
  }
  // Backward compat: plain-text stored password (will be migrated on next login)
  return String(stored) === String(attempt);
}

let _data = null;
let _online = false;

function loadStored() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch (e) {
    // Backup corrupted data before fallback so a recovery is possible
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localStorage.setItem(STORAGE_KEY + '_corrupt_' + Date.now(), raw.slice(0, 5e5));
    } catch {}
    return {};
  }
}

function saveStored(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
  catch (e) {
    // Quota exceeded or disabled — surface a one-time warning
    if (typeof window !== 'undefined' && !window._storageWarned && typeof window.notify === 'function') {
      window._storageWarned = true;
      window.notify('שמירה מקומית נכשלה — בדוק שיש מקום בדפדפן', 'warn');
    }
  }
}

async function fetchJson(path) {
  try {
    const r = await fetch(path + '?t=' + Date.now());
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } catch { return null; }
}

async function loadData() {
  const stored = loadStored();
  // Sheet is the single source of truth. Start with stored cache (for instant render).
  // If cache is empty, we pull synchronously from the Sheet so the UI never shows a blank state.
  _data = {
    students: Array.isArray(stored.students) ? stored.students : [],
    behavior: Array.isArray(stored.behavior) ? stored.behavior : [],
    users: Array.isArray(stored.users) && stored.users.length ? stored.users : [{username:'admin',password_hash:'6742',role:'מנהל',permissions:'all'}],
    categories: Array.isArray(stored.categories) ? stored.categories : [],
    classes: Array.isArray(stored.classes) ? stored.classes : [],
    functioning: Array.isArray(stored.functioning) ? stored.functioning : [],
    tests: Array.isArray(stored.tests) ? stored.tests : [],
    medications: Array.isArray(stored.medications) ? stored.medications : [],
    meetings: Array.isArray(stored.meetings) ? stored.meetings : [],
    attendance: Array.isArray(stored.attendance) ? stored.attendance : [],
  };
  // If cache is empty (first visit), pull from the Sheet synchronously
  const hasAnyData = _data.students.length || _data.behavior.length;
  if (!hasAnyData) {
    if (typeof showLoadingOverlay === 'function') showLoadingOverlay('טוען נתונים מגוגל שיטס...');
    await pullAllFromSheet().catch(() => {});
    if (typeof hideLoadingOverlay === 'function') hideLoadingOverlay();
  }
  // Default status to פעיל for legacy students
  _data.students.forEach(s => { if (!s['סטטוס']) s['סטטוס'] = 'פעיל'; });
  // Always make sure at least one admin exists in the local user list (fallback)
  if (!_data.users.find(u => u.role === 'מנהל')) {
    _data.users.unshift({username:'admin',password_hash:'6742',role:'מנהל',permissions:'all'});
    saveStored(_data);
  }
  // Backfill IDs for behavior events that don't have one (from old data)
  let needSave = false;
  let maxBehaviorId = _data.behavior.reduce((m, e) => Math.max(m, parseInt(e['מזהה']) || 0), 0);
  _data.behavior.forEach(e => {
    if (!e['מזהה']) {
      maxBehaviorId += 1;
      e['מזהה'] = maxBehaviorId;
      needSave = true;
    }
  });
  let maxStudentId = _data.students.reduce((m, s) => Math.max(m, parseInt(s['מזהה']) || 0), 0);
  _data.students.forEach(s => {
    if (!s['מזהה']) {
      maxStudentId += 1;
      s['מזהה'] = maxStudentId;
      needSave = true;
    }
  });
  if (needSave) saveStored(_data);
  return _data;
}

function getData() {
  return _data || { students: [], behavior: [], users: [], categories: [], classes: [], functioning: [], tests: [], medications: [] };
}

// Returns _data filtered by current user's permissions. Use this in UI code.
// Internal api() handlers should use getData() directly so they can mutate.
function getVisibleData() {
  const all = getData();
  const u = JSON.parse(sessionStorage.getItem('user') || '{}');
  if (u.username === 'admin' || u.role === 'מנהל') return all;
  const full = (all.users || []).find(x => x.username === u.username);
  if (!full) return all;

  // Compute allowed student IDs from visible_classes + visible_students
  let allowedStudents = (all.students || []).slice();
  if (full.visible_classes && full.visible_classes !== 'all') {
    const cls = full.visible_classes.split(',').map(s => s.trim()).filter(Boolean);
    allowedStudents = allowedStudents.filter(s => cls.includes(s['מחזור']));
  }
  if (full.visible_students && full.visible_students !== 'all') {
    const ids = full.visible_students.split(',').map(s => s.trim()).filter(Boolean);
    allowedStudents = allowedStudents.filter(s => ids.includes(String(s['מזהה'])));
  }
  const allowedSids = new Set(allowedStudents.map(s => String(s['מזהה'])));

  const filterBySid = items => (items || []).filter(x => allowedSids.has(String(x['תלמיד_מזהה'])));
  let behavior = filterBySid(all.behavior);
  if (full.visible_categories && full.visible_categories !== 'all') {
    const cats = full.visible_categories.split(',').map(s => s.trim()).filter(Boolean);
    behavior = behavior.filter(e => cats.includes(e['קטגוריה']));
  }

  return {
    ...all,
    students: allowedStudents,
    behavior,
    functioning: filterBySid(all.functioning),
    tests: filterBySid(all.tests),
    medications: filterBySid(all.medications),
    meetings: filterBySid(all.meetings),
    attendance: filterBySid(all.attendance),
  };
}
window.getVisibleData = getVisibleData;

function saveData(part, value) {
  if (!_data) _data = { students:[], behavior:[], users:[], categories:[], classes:[], functioning:[], tests:[], medications:[] };
  _data[part] = value;
  saveStored(_data);
}

// HTML escape for safe interpolation into innerHTML or attributes
function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
// JS string literal safe for use inside an HTML attribute (e.g. onclick="fn(${jsAttr(x)})")
function jsAttr(s) {
  return JSON.stringify(String(s == null ? '' : s)).replace(/"/g, '&quot;');
}
window.escHtml = escHtml;
window.jsAttr = jsAttr;

// Compatibility shim: old api() function maps to local operations
async function api(fn, args) {
  await ensureLoaded();
  args = args || [];
  switch (fn) {
    case 'authenticate': {
      const [u, p] = args;
      const user = _data.users.find(x => x.username === u);
      if (!user) return { ok: true, data: { ok: false, error: 'משתמש או סיסמה שגויים' } };
      const matches = await verifyPassword(user.password_hash, p);
      if (!matches) return { ok: true, data: { ok: false, error: 'משתמש או סיסמה שגויים' } };
      // Auto-migrate plaintext to hash on successful login
      if (!String(user.password_hash || '').startsWith(PWD_PREFIX)) {
        user.password_hash = await hashPassword(p);
        saveStored(_data);
        markLocalChange();
        const sheetObj = {
          'שם משתמש': user.username, 'סיסמה': user.password_hash,
          'תפקיד': user.role, 'הרשאות': user.permissions,
          'תלמידים_מורשים': user.visible_students || 'all',
          'קטגוריות_מורשות': user.visible_categories || 'all',
          'שם מלא': user.full_name || '', 'אימייל': user.email || '',
          'טלפון': user.phone || '', 'הערות_משתמש': user.notes || '',
        };
        syncUpdateRow('משתמשים', sheetObj, 'שם משתמש', user.username).then(updateSyncIndicator);
      }
      return { ok: true, data: { ok: true, user: { username: u, role: user.role } } };
    }
    case 'listStudents': {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (u.username === 'admin' || u.role === 'מנהל') return { ok: true, data: _data.students };
      const full = _data.users.find(x => x.username === u.username);
      if (!full) return { ok: true, data: _data.students };
      let list = _data.students;
      // Filter by visible_classes if set
      if (full.visible_classes && full.visible_classes !== 'all') {
        const allowedCls = full.visible_classes.split(',').map(s => s.trim()).filter(Boolean);
        list = list.filter(s => allowedCls.includes(s['מחזור']));
      }
      // Filter by visible_students if set
      if (full.visible_students && full.visible_students !== 'all') {
        const allowedIds = full.visible_students.split(',').map(s => s.trim()).filter(Boolean);
        list = list.filter(s => allowedIds.includes(String(s['מזהה'])));
      }
      return { ok: true, data: list };
    }
    case 'listBehavior': {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      let events = _data.behavior;
      if (u.username !== 'admin' && u.role !== 'מנהל') {
        const full = _data.users.find(x => x.username === u.username);
        if (full) {
          // Filter by visible_classes (lookup student to get class)
          if (full.visible_classes && full.visible_classes !== 'all') {
            const allowedCls = full.visible_classes.split(',').map(s => s.trim()).filter(Boolean);
            const allowedSids = new Set(_data.students.filter(s => allowedCls.includes(s['מחזור'])).map(s => String(s['מזהה'])));
            events = events.filter(e => allowedSids.has(String(e['תלמיד_מזהה'])));
          }
          if (full.visible_students && full.visible_students !== 'all') {
            const allowed = full.visible_students.split(',').map(s => s.trim()).filter(Boolean);
            events = events.filter(e => allowed.includes(String(e['תלמיד_מזהה'])));
          }
          if (full.visible_categories && full.visible_categories !== 'all') {
            const allowedC = full.visible_categories.split(',').map(s => s.trim()).filter(Boolean);
            events = events.filter(e => allowedC.includes(e['קטגוריה']));
          }
        }
      }
      return { ok: true, data: events };
    }
    case 'listAuditLog': {
      // Pull fresh from sheet (audit log is not cached aggressively)
      const rows = await pullFromSheet('יומן_פעולות');
      return { ok: true, data: rows || [] };
    }
    case 'addCategory': {
      const name = (args[0] || '').trim();
      if (!name) return { ok: false, error: 'name required' };
      _data.categories = _data.categories || [];
      if (_data.categories.some(c => (c.name || c['קטגוריה']) === name)) {
        return { ok: false, error: 'כבר קיימת' };
      }
      _data.categories.push({ name, 'קטגוריה': name, 'תיאור': '' });
      saveStored(_data);
      markLocalChange();
      syncRowToSheet('קטגוריות', { 'קטגוריה': name, 'תיאור': '' }).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'deleteCategory': {
      const name = args[0];
      const idx = (_data.categories || []).findIndex(c => (c.name || c['קטגוריה']) === name);
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.categories.splice(idx, 1);
      saveStored(_data);
      markLocalChange();
      syncDeleteRow('קטגוריות', 'קטגוריה', name).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'listCategories': {
      // Filter by current user's visible_categories (admins see all)
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      const isAdmin = u.username === 'admin' || u.role === 'מנהל';
      let cats = _data.categories.map(c => ({ 'קטגוריה': c.name }));
      if (!isAdmin) {
        const full = _data.users.find(x => x.username === u.username);
        if (full && full.visible_categories && full.visible_categories !== 'all') {
          const allowed = full.visible_categories.split(',').map(s => s.trim()).filter(Boolean);
          cats = cats.filter(c => allowed.includes(c['קטגוריה']));
        }
      }
      return { ok: true, data: cats };
    }
    case 'listUsers':
      return { ok: true, data: _data.users.map(u => ({
        'שם משתמש': u.username,
        'תפקיד': u.role,
        'הרשאות': u.permissions || '',
        'תלמידים_מורשים': u.visible_students || 'all',
        'קטגוריות_מורשות': u.visible_categories || 'all',
        'כיתות_מורשות': u.visible_classes || 'all',
      })) };
    case 'addStudent': {
      const obj = args[0];
      const max = _data.students.reduce((m, s) => Math.max(m, parseInt(s['מזהה']) || 0), 0);
      obj['מזהה'] = max + 1;
      if (!obj['סטטוס']) obj['סטטוס'] = 'פעיל';
      _data.students.push(obj);
      saveStored(_data);
      markLocalChange();
      syncRowToSheet('תלמידים', obj).then(updateSyncIndicator);
      _auditLog('הוספה', 'תלמידים', obj['מזהה'], `${obj['שם פרטי']||''} ${obj['שם משפחה']||''}`);
      return { ok: true, data: { rowCount: _data.students.length } };
    }
    case 'listClasses':
      return { ok: true, data: [..._data.classes].sort((a,b) => (parseInt(a['סדר'])||0) - (parseInt(b['סדר'])||0)) };
    case 'addClass': {
      const obj = args[0];
      if (!obj['שם']) return { ok: false, error: 'שם כיתה חובה' };
      if (_data.classes.find(c => c['שם'] === obj['שם'])) return { ok: false, error: 'כיתה כבר קיימת' };
      const maxOrder = _data.classes.reduce((m,c) => Math.max(m, parseInt(c['סדר'])||0), 0);
      if (!obj['סדר']) obj['סדר'] = maxOrder + 1;
      const order = parseInt(obj['סדר']);
      if (_data.classes.find(c => parseInt(c['סדר']) === order)) return { ok: false, error: 'סדר ' + order + ' כבר תפוס' };
      obj['סדר'] = order;
      _data.classes.push(obj);
      saveStored(_data);
      markLocalChange();
      syncRowToSheet('כיתות', obj).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'updateClass': {
      const obj = args[0];
      const oldName = obj['שם קודם'] || obj['שם'];
      const idx = _data.classes.findIndex(c => c['שם'] === oldName);
      if (idx < 0) return { ok: false, error: 'not found' };
      const cleanObj = { 'שם': obj['שם'], 'סדר': parseInt(obj['סדר']) || _data.classes[idx]['סדר'] };
      // Reject duplicate סדר (excluding self)
      if (_data.classes.some((c, i) => i !== idx && parseInt(c['סדר']) === cleanObj['סדר']))
        return { ok: false, error: 'סדר ' + cleanObj['סדר'] + ' כבר תפוס' };
      // Reject duplicate name (excluding self)
      if (_data.classes.some((c, i) => i !== idx && c['שם'] === cleanObj['שם']))
        return { ok: false, error: 'שם הכיתה כבר קיים' };
      _data.classes[idx] = cleanObj;
      const renamed = oldName !== cleanObj['שם'];
      const affectedStudents = renamed
        ? _data.students.filter(s => s['מחזור'] === oldName)
        : [];
      affectedStudents.forEach(s => { s['מחזור'] = cleanObj['שם']; });
      saveStored(_data);
      markLocalChange();
      // Atomic-ish sync: update students first (they reference the class), then handle class row
      (async () => {
        for (const s of affectedStudents) {
          await syncUpdateRow('תלמידים', s, 'מזהה', s['מזהה']);
        }
        if (renamed) {
          const ok = await syncDeleteRow('כיתות', 'שם', oldName);
          if (ok !== false) await syncRowToSheet('כיתות', cleanObj);
        } else {
          await syncUpdateRow('כיתות', cleanObj, 'שם', oldName);
        }
        updateSyncIndicator();
      })();
      return { ok: true };
    }
    case 'deleteClass': {
      const name = args[0];
      const inUse = _data.students.filter(s => s['מחזור'] === name && s['סטטוס'] !== 'סיים').length;
      if (inUse > 0) return { ok: false, error: `יש ${inUse} תלמידים פעילים בכיתה זו — אי אפשר למחוק` };
      const idx = _data.classes.findIndex(c => c['שם'] === name);
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.classes.splice(idx, 1);
      saveStored(_data);
      markLocalChange();
      syncDeleteRow('כיתות', 'שם', name).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'promoteStudent': {
      // Move single student to next class up
      const id = args[0];
      const idx = _data.students.findIndex(s => String(s['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      const stu = _data.students[idx];
      const sorted = [..._data.classes].sort((a,b) => parseInt(a['סדר']) - parseInt(b['סדר']));
      const curIdx = sorted.findIndex(c => c['שם'] === stu['מחזור']);
      if (curIdx < 0) return { ok: false, error: 'הכיתה הנוכחית לא מוגדרת ברשימה' };
      if (curIdx === sorted.length - 1) {
        // Last class — graduate
        stu['סטטוס'] = 'סיים';
      } else {
        stu['מחזור'] = sorted[curIdx + 1]['שם'];
      }
      saveStored(_data);
      markLocalChange();
      syncUpdateRow('תלמידים', stu, 'מזהה', stu['מזהה']).then(updateSyncIndicator);
      return { ok: true, data: { newClass: stu['מחזור'], status: stu['סטטוס'] } };
    }
    case 'demoteStudent': {
      const id = args[0];
      const idx = _data.students.findIndex(s => String(s['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      const stu = _data.students[idx];
      const sorted = [..._data.classes].sort((a,b) => parseInt(a['סדר']) - parseInt(b['סדר']));
      const curIdx = sorted.findIndex(c => c['שם'] === stu['מחזור']);
      if (curIdx <= 0) return { ok: false, error: 'אי אפשר להוריד מהכיתה הראשונה' };
      stu['מחזור'] = sorted[curIdx - 1]['שם'];
      stu['סטטוס'] = 'פעיל';
      saveStored(_data);
      markLocalChange();
      syncUpdateRow('תלמידים', stu, 'מזהה', stu['מזהה']).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'deactivateStudent': {
      const id = args[0];
      const idx = _data.students.findIndex(s => String(s['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.students[idx]['סטטוס'] = 'סיים';
      saveStored(_data);
      markLocalChange();
      syncUpdateRow('תלמידים', _data.students[idx], 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'reactivateStudent': {
      const id = args[0];
      const idx = _data.students.findIndex(s => String(s['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.students[idx]['סטטוס'] = 'פעיל';
      saveStored(_data);
      markLocalChange();
      syncUpdateRow('תלמידים', _data.students[idx], 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'promoteAll': {
      // Bulk year promotion: every active student moves up; last class graduates
      const sorted = [..._data.classes].sort((a,b) => (parseInt(a['סדר'])||0) - (parseInt(b['סדר'])||0));
      if (!sorted.length) return { ok: false, error: 'אין כיתות מוגדרות' };
      let promoted = 0, graduated = 0, skipped = 0;
      const updates = [];
      _data.students.forEach(stu => {
        if (stu['סטטוס'] === 'סיים') { skipped++; return; }
        const curIdx = sorted.findIndex(c => c['שם'] === stu['מחזור']);
        if (curIdx < 0) { skipped++; return; }
        if (curIdx === sorted.length - 1) {
          stu['סטטוס'] = 'סיים';
          graduated++;
        } else {
          stu['מחזור'] = sorted[curIdx + 1]['שם'];
          promoted++;
        }
        updates.push(stu);
      });
      saveStored(_data);
      markLocalChange();
      // Throttled sync — 4 parallel max; track failures; refresh dirty window during loop
      (async () => {
        const CONCURRENCY = 4;
        let failed = 0;
        for (let i = 0; i < updates.length; i += CONCURRENCY) {
          markLocalChange();
          const batch = updates.slice(i, i + CONCURRENCY);
          const results = await Promise.all(batch.map(s => syncUpdateRow('תלמידים', s, 'מזהה', s['מזהה'])));
          failed += results.filter(r => r === false).length;
        }
        if (failed > 0 && typeof window !== 'undefined' && typeof window.notify === 'function') {
          window.notify(`${failed} סנכרונים נכשלו במעבר השנתי — נסה שוב כשתהיה רשת`, 'warn');
        }
        updateSyncIndicator();
      })();
      return { ok: true, data: { promoted, graduated, skipped } };
    }
    case 'addBehavior': {
      const obj = args[0];
      if (!obj['תאריך']) obj['תאריך'] = new Date().toISOString();
      // Auto-generate ID if missing
      if (!obj['מזהה']) {
        const max = _data.behavior.reduce((m, e) => Math.max(m, parseInt(e['מזהה']) || 0), 0);
        obj['מזהה'] = max + 1;
      }
      // Defense-in-depth: ensure reporter is set even if caller forgot
      if (!obj['דווח_עי']) {
        try {
          const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
          if (sess.username) obj['דווח_עי'] = sess.username;
        } catch {}
      }
      _data.behavior.push(obj);
      saveStored(_data);
      markLocalChange();
      syncRowToSheet('מעקב_התנהגות', obj).then(updateSyncIndicator);
      _auditLog('הוספה', 'מעקב_התנהגות', obj['מזהה'], `${obj['שם תלמיד']||''} - ${obj['קטגוריה']||''}`);
      return { ok: true, data: { rowCount: _data.behavior.length } };
    }
    case 'updateStudent': {
      const obj = args[0];
      const id = obj['מזהה'];
      const idx = _data.students.findIndex(s => String(s['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.students[idx] = Object.assign({}, _data.students[idx], obj);
      saveStored(_data);
      markLocalChange();
      syncUpdateRow('תלמידים', _data.students[idx], 'מזהה', id).then(updateSyncIndicator);
      _auditLog('עדכון', 'תלמידים', id, `${_data.students[idx]['שם פרטי']||''} ${_data.students[idx]['שם משפחה']||''}`);
      return { ok: true };
    }
    case 'deleteStudent': {
      const id = args[0];
      const idx = _data.students.findIndex(s => String(s['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      const removed = _data.students[idx];
      _data.students.splice(idx, 1);
      saveStored(_data);
      markLocalChange();
      syncDeleteRow('תלמידים', 'מזהה', id).then(updateSyncIndicator);
      _auditLog('מחיקה', 'תלמידים', id, `${removed['שם פרטי']||''} ${removed['שם משפחה']||''}`);
      return { ok: true };
    }
    case 'updateBehavior': {
      const obj = args[0];
      const id = obj['מזהה'];
      const idx = _data.behavior.findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.behavior[idx] = Object.assign({}, _data.behavior[idx], obj);
      saveStored(_data);
      markLocalChange();
      syncUpdateRow('מעקב_התנהגות', _data.behavior[idx], 'מזהה', id).then(updateSyncIndicator);
      _auditLog('עדכון', 'מעקב_התנהגות', id, `${_data.behavior[idx]['שם תלמיד']||''} - ${_data.behavior[idx]['קטגוריה']||''}`);
      return { ok: true };
    }
    case 'deleteBehavior': {
      const id = args[0];
      const idx = _data.behavior.findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      const removed = _data.behavior[idx];
      _data.behavior.splice(idx, 1);
      saveStored(_data);
      markLocalChange();
      syncDeleteRow('מעקב_התנהגות', 'מזהה', id).then(updateSyncIndicator);
      _auditLog('מחיקה', 'מעקב_התנהגות', id, `${removed['שם תלמיד']||''} - ${removed['קטגוריה']||''}`);
      return { ok: true };
    }
    case 'updateUser': {
      const obj = args[0];
      const newUsername = obj['שם משתמש'] || obj.username;
      const lookupUsername = obj['שם משתמש קודם'] || newUsername;
      const idx = _data.users.findIndex(u => u.username === lookupUsername);
      if (idx < 0) return { ok: false, error: 'not found' };
      // Hash password if provided as plain text
      let newPwd = obj['סיסמה'] || obj.password_hash || _data.users[idx].password_hash;
      if (newPwd && !String(newPwd).startsWith(PWD_PREFIX) && obj['סיסמה']) {
        // Only hash if it's a new plain-text password being set
        newPwd = await hashPassword(obj['סיסמה']);
      }
      const updated = {
        username: newUsername,
        password_hash: newPwd,
        role: obj['תפקיד'] ?? obj.role ?? _data.users[idx].role,
        permissions: obj['הרשאות'] ?? obj.permissions ?? _data.users[idx].permissions ?? '',
        visible_students: obj['תלמידים_מורשים'] ?? obj.visible_students ?? 'all',
        visible_categories: obj['קטגוריות_מורשות'] ?? obj.visible_categories ?? 'all',
        visible_classes: obj['כיתות_מורשות'] ?? obj.visible_classes ?? _data.users[idx].visible_classes ?? 'all',
        full_name: obj['שם מלא'] ?? _data.users[idx].full_name ?? '',
        email: obj['אימייל'] ?? _data.users[idx].email ?? '',
        phone: obj['טלפון'] ?? _data.users[idx].phone ?? '',
        notes: obj['הערות_משתמש'] ?? _data.users[idx].notes ?? '',
      };
      _data.users[idx] = updated;
      saveStored(_data);
      markLocalChange();
      // Build clean sheet payload (no internal-only field)
      const sheetObj = {
        'שם משתמש': newUsername,
        'סיסמה': updated.password_hash,
        'תפקיד': updated.role,
        'הרשאות': updated.permissions,
        'תלמידים_מורשים': updated.visible_students,
        'קטגוריות_מורשות': updated.visible_categories,
        'כיתות_מורשות': updated.visible_classes,
        'שם מלא': updated.full_name,
        'אימייל': updated.email,
        'טלפון': updated.phone,
        'הערות_משתמש': updated.notes,
      };
      // If renamed, delete old + add new in sheet; otherwise update
      if (lookupUsername !== newUsername) {
        syncDeleteRow('משתמשים', 'שם משתמש', lookupUsername).then(() =>
          syncRowToSheet('משתמשים', sheetObj).then(updateSyncIndicator));
      } else {
        syncUpdateRow('משתמשים', sheetObj, 'שם משתמש', newUsername).then(updateSyncIndicator);
      }
      _auditLog('עדכון', 'משתמשים', newUsername, `עדכון משתמש: ${newUsername} (${updated.role})`);
      // If session belongs to renamed user, refresh session
      const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (sess.username === lookupUsername) {
        sess.username = newUsername;
        sess.role = updated.role;
        sess.permissions = updated.permissions;
        sessionStorage.setItem('user', JSON.stringify(sess));
      }
      return { ok: true };
    }
    case 'deleteUser': {
      const username = args[0];
      const idx = _data.users.findIndex(u => u.username === username);
      if (idx < 0) return { ok: false, error: 'not found' };
      const target = _data.users[idx];
      const adminCount = _data.users.filter(u => u.role === 'מנהל').length;
      if (target.role === 'מנהל' && adminCount === 1) {
        return { ok: false, error: 'לא ניתן למחוק את המנהל היחיד' };
      }
      _data.users.splice(idx, 1);
      saveStored(_data);
      markLocalChange();
      syncDeleteRow('משתמשים', 'שם משתמש', username).then(updateSyncIndicator);
      _auditLog('מחיקה', 'משתמשים', username, `נמחק משתמש: ${username}`);
      return { ok: true };
    }
    case 'addUser': {
      const obj = args[0];
      const rawPwd = obj['סיסמה'] || '';
      const hashed = rawPwd && !rawPwd.startsWith(PWD_PREFIX) ? await hashPassword(rawPwd) : rawPwd;
      const newUser = {
        username: obj['שם משתמש'],
        password_hash: hashed,
        role: obj['תפקיד'],
        permissions: obj['הרשאות'],
        visible_students: obj['תלמידים_מורשים'] || 'all',
        visible_categories: obj['קטגוריות_מורשות'] || 'all',
        visible_classes: obj['כיתות_מורשות'] || 'all',
        full_name: obj['שם מלא'] || '',
        email: obj['אימייל'] || '',
        phone: obj['טלפון'] || '',
        notes: obj['הערות_משתמש'] || '',
      };
      const idx = _data.users.findIndex(u => u.username === newUser.username);
      if (idx >= 0) {
        _data.users[idx] = newUser;
      } else {
        _data.users.push(newUser);
      }
      saveStored(_data);
      markLocalChange();
      // Use hashed password in sheet, never plain
      const sheetObj = { ...obj, 'סיסמה': hashed };
      syncRowToSheet('משתמשים', sheetObj).then(updateSyncIndicator);
      _auditLog('הוספה', 'משתמשים', newUser.username, `משתמש חדש: ${newUser.username} (${newUser.role})`);
      return { ok: true, data: { rowCount: _data.users.length } };
    }
    case 'currentUserVisibleStudents': {
      // Returns student IDs current user can see (or null = all)
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (u.username === 'admin' || u.role === 'מנהל') return { ok: true, data: null };
      const fullUser = _data.users.find(x => x.username === u.username);
      if (!fullUser || !fullUser.visible_students || fullUser.visible_students === 'all') return { ok: true, data: null };
      return { ok: true, data: fullUser.visible_students.split(',').map(s => s.trim()).filter(Boolean) };
    }
    case 'currentUserVisibleCategories': {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (u.username === 'admin' || u.role === 'מנהל') return { ok: true, data: null };
      const fullUser = _data.users.find(x => x.username === u.username);
      if (!fullUser || !fullUser.visible_categories || fullUser.visible_categories === 'all') return { ok: true, data: null };
      return { ok: true, data: fullUser.visible_categories.split(',').map(s => s.trim()).filter(Boolean) };
    }
    case 'listFunctioning':
      return { ok: true, data: getVisibleData().functioning || [] };
    case 'listTests':
      return { ok: true, data: getVisibleData().tests || [] };
    case 'listMedications':
      return { ok: true, data: getVisibleData().medications || [] };
    case 'listMeetings':
      return { ok: true, data: getVisibleData().meetings || [] };
    case 'listAttendance':
      return { ok: true, data: getVisibleData().attendance || [] };
    case 'addMeeting': {
      const obj = args[0];
      const max = (_data.meetings || []).reduce((m, e) => Math.max(m, parseInt(e['מזהה']) || 0), 0);
      obj['מזהה'] = max + 1;
      _data.meetings = _data.meetings || [];
      _data.meetings.push(obj);
      saveStored(_data); markLocalChange();
      syncRowToSheet('אסיפות', obj).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'updateMeeting': {
      const obj = args[0];
      const id = obj['מזהה'];
      const idx = (_data.meetings || []).findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.meetings[idx] = Object.assign({}, _data.meetings[idx], obj);
      saveStored(_data); markLocalChange();
      syncUpdateRow('אסיפות', _data.meetings[idx], 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'deleteMeeting': {
      const id = args[0];
      const idx = (_data.meetings || []).findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.meetings.splice(idx, 1);
      saveStored(_data); markLocalChange();
      syncDeleteRow('אסיפות', 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'addAttendance': {
      const obj = args[0];
      const max = (_data.attendance || []).reduce((m, e) => Math.max(m, parseInt(e['מזהה']) || 0), 0);
      obj['מזהה'] = max + 1;
      _data.attendance = _data.attendance || [];
      _data.attendance.push(obj);
      saveStored(_data); markLocalChange();
      syncRowToSheet('נוכחות', obj).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'updateAttendance': {
      const obj = args[0];
      const id = obj['מזהה'];
      const idx = (_data.attendance || []).findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.attendance[idx] = Object.assign({}, _data.attendance[idx], obj);
      saveStored(_data); markLocalChange();
      syncUpdateRow('נוכחות', _data.attendance[idx], 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'deleteAttendance': {
      const id = args[0];
      const idx = (_data.attendance || []).findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.attendance.splice(idx, 1);
      saveStored(_data); markLocalChange();
      syncDeleteRow('נוכחות', 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'addFunctioning': {
      const obj = args[0];
      const max = (_data.functioning || []).reduce((m, e) => Math.max(m, parseInt(e['מזהה']) || 0), 0);
      obj['מזהה'] = max + 1;
      _data.functioning = _data.functioning || [];
      _data.functioning.push(obj);
      saveStored(_data);
      markLocalChange();
      syncRowToSheet('תפקוד', obj).then(updateSyncIndicator);
      return { ok: true, data: { rowCount: _data.functioning.length } };
    }
    case 'updateFunctioning': {
      const obj = args[0];
      const id = obj['מזהה'];
      const idx = (_data.functioning || []).findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.functioning[idx] = Object.assign({}, _data.functioning[idx], obj);
      saveStored(_data);
      markLocalChange();
      syncUpdateRow('תפקוד', _data.functioning[idx], 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'deleteFunctioning': {
      const id = args[0];
      const idx = (_data.functioning || []).findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.functioning.splice(idx, 1);
      saveStored(_data);
      markLocalChange();
      syncDeleteRow('תפקוד', 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'addTest': {
      const obj = args[0];
      const max = (_data.tests || []).reduce((m, e) => Math.max(m, parseInt(e['מזהה']) || 0), 0);
      obj['מזהה'] = max + 1;
      _data.tests = _data.tests || [];
      _data.tests.push(obj);
      saveStored(_data);
      markLocalChange();
      syncRowToSheet('מבחנים', obj).then(updateSyncIndicator);
      return { ok: true, data: { rowCount: _data.tests.length } };
    }
    case 'updateTest': {
      const obj = args[0];
      const id = obj['מזהה'];
      const idx = (_data.tests || []).findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.tests[idx] = Object.assign({}, _data.tests[idx], obj);
      saveStored(_data);
      markLocalChange();
      syncUpdateRow('מבחנים', _data.tests[idx], 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'deleteTest': {
      const id = args[0];
      const idx = (_data.tests || []).findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.tests.splice(idx, 1);
      saveStored(_data);
      markLocalChange();
      syncDeleteRow('מבחנים', 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'addMedication': {
      const obj = args[0];
      const max = (_data.medications || []).reduce((m, e) => Math.max(m, parseInt(e['מזהה']) || 0), 0);
      obj['מזהה'] = max + 1;
      _data.medications = _data.medications || [];
      _data.medications.push(obj);
      saveStored(_data);
      markLocalChange();
      syncRowToSheet('כדורים', obj).then(updateSyncIndicator);
      return { ok: true, data: { rowCount: _data.medications.length } };
    }
    case 'updateMedication': {
      const obj = args[0];
      const id = obj['מזהה'];
      const idx = (_data.medications || []).findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.medications[idx] = Object.assign({}, _data.medications[idx], obj);
      saveStored(_data);
      markLocalChange();
      syncUpdateRow('כדורים', _data.medications[idx], 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'deleteMedication': {
      const id = args[0];
      const idx = (_data.medications || []).findIndex(e => String(e['מזהה']) === String(id));
      if (idx < 0) return { ok: false, error: 'not found' };
      _data.medications.splice(idx, 1);
      saveStored(_data);
      markLocalChange();
      syncDeleteRow('כדורים', 'מזהה', id).then(updateSyncIndicator);
      return { ok: true };
    }
    case 'exportPDF':
      // generate PDF in browser using jsPDF or similar
      return { ok: false, error: 'ייצוא PDF טרם נתמך, יוטמע בקרוב' };
    default:
      return { ok: false, error: 'unknown ' + fn };
  }
}

let _loaded = false;
async function ensureLoaded() {
  if (_loaded) return;
  _loaded = true;
  await loadData();
}

// Background sync to Apps Script (best-effort)
let _syncTimer = null;
function queueSync() {
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(syncToBackend, 5000);
}

async function syncToBackend() {
  const wasOnline = _online;
  try {
    const r = await fetch(APPS_SCRIPT_URL + '?action=ping&token=' + AGENT_TOKEN, { method: 'GET', mode: 'cors' });
    _online = r.ok;
    if (_online) ensureSchemaOnce();
  } catch {
    _online = false;
  }
  // When going online and we have pending writes, flush them
  if (_online && !wasOnline && _hasPending()) {
    flushPending();
  } else if (_online && _hasPending() && !_pendingFlushTimer) {
    _pendingFlushTimer = setTimeout(flushPending, 1000);
  }
  updateSyncIndicator();
}

// Listen to browser online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { _online = true; if (_hasPending()) flushPending(); updateSyncIndicator(); });
  window.addEventListener('offline', () => { _online = false; updateSyncIndicator(); });
}

let _schemaEnsured = false;
let _schemaEnsuredAt = 0;
async function ensureSchemaOnce() {
  // Re-check every 30 minutes even after success (in case sheet was reset)
  if (_schemaEnsured && (Date.now() - _schemaEnsuredAt) < 30*60*1000) return;
  try {
    const params = new URLSearchParams({ action: 'cheder_ensureSchema', token: AGENT_TOKEN, instance: INSTANCE });
    const r = await fetch(APPS_SCRIPT_URL + '?' + params.toString(), { method: 'GET', mode: 'cors' });
    if (r.ok) { _schemaEnsured = true; _schemaEnsuredAt = Date.now(); }
  } catch {}
}

// All writes go through POST (form-urlencoded) so payloads can be arbitrarily large
// without hitting URL length limits or NetFree's URL filter.
async function postToProxy(params) {
  const form = new URLSearchParams(params);
  const r = await fetch(APPS_SCRIPT_URL, {
    method: 'POST', mode: 'cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!r.ok) return { ok: false, http: r.status };
  return await r.json();
}

async function syncRowToSheet(tab, row) {
  return _enqueueOrSend({
    kind: 'append', tab, row,
    payload: { action: 'cheder_appendRow', token: AGENT_TOKEN, instance: INSTANCE, tab, row: JSON.stringify(row) },
  });
}

async function syncUpdateRow(tab, row, matchKey, matchValue) {
  return _enqueueOrSend({
    kind: 'update', tab, row, matchKey, matchValue: String(matchValue),
    payload: { action: 'cheder_updateRow', token: AGENT_TOKEN, instance: INSTANCE, tab, row: JSON.stringify(row), matchKey, matchValue: String(matchValue) },
  });
}

async function syncDeleteRow(tab, matchKey, matchValue) {
  return _enqueueOrSend({
    kind: 'delete', tab, matchKey, matchValue: String(matchValue),
    payload: { action: 'cheder_deleteRow', token: AGENT_TOKEN, instance: INSTANCE, tab, matchKey, matchValue: String(matchValue) },
  });
}

async function _sendPayload(payload) {
  try {
    const d = await postToProxy(payload);
    return d && d.ok === true;
  } catch { return false; }
}

async function pullFromSheet(tab) {
  try {
    const params = new URLSearchParams({
      action: 'cheder_listRows', token: AGENT_TOKEN, instance: INSTANCE, tab,
    });
    const r = await fetch(APPS_SCRIPT_URL + '?' + params.toString(), { method: 'GET', mode: 'cors' });
    if (!r.ok) return null;
    const d = await r.json();
    return d.ok ? d.rows : null;
  } catch { return null; }
}

// Track local changes — pause pull-from-sheet while user is making changes
let _lastLocalChange = 0;
function markLocalChange() {
  _lastLocalChange = Date.now();
}

// =====================
// Audit log — every write goes to יומן_פעולות
// =====================
function _auditLog(action, tab, rowId, description) {
  try {
    const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
    const user = sess.username || 'anonymous';
    const entry = {
      'מזהה': Date.now() + '-' + Math.floor(Math.random()*1000),
      'תאריך': new Date().toISOString(),
      'משתמש': user,
      'פעולה': action,
      'טאב': tab,
      'מזהה_שורה': String(rowId || ''),
      'תיאור': String(description || '').slice(0, 200),
    };
    // Append directly to the audit tab (bypass api() to avoid recursion)
    _enqueueOrSend({
      kind: 'append', tab: 'יומן_פעולות', row: entry,
      payload: { action: 'cheder_appendRow', token: AGENT_TOKEN, instance: INSTANCE, tab: 'יומן_פעולות', row: JSON.stringify(entry) },
    });
  } catch (e) { /* never let audit break the app */ }
}

// =====================
// Retry queue for failed writes — survives page reloads via localStorage
// =====================
const PENDING_KEY = 'cheder_pending_writes';
let _pendingFlushTimer = null;

function _loadPending() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); }
  catch { return []; }
}
function _savePending(list) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(list)); } catch {}
  updateSyncIndicator();
}
function _hasPending() { return _loadPending().length > 0; }

// Try to send a payload; if it fails, queue it. Returns true on success.
async function _enqueueOrSend(op) {
  markLocalChange();
  if (!_online) {
    _queueWrite(op);
    return false;
  }
  const ok = await _sendPayload(op.payload);
  if (!ok) {
    _queueWrite(op);
    return false;
  }
  return true;
}

function _queueWrite(op) {
  const pending = _loadPending();
  // Coalesce duplicate updates on the same row (keep latest)
  if (op.kind === 'update' && op.matchKey != null) {
    const idx = pending.findIndex(p => p.kind === 'update' && p.tab === op.tab && p.matchKey === op.matchKey && p.matchValue === op.matchValue);
    if (idx >= 0) pending.splice(idx, 1);
  }
  pending.push({ ...op, queuedAt: Date.now() });
  _savePending(pending);
  // Schedule a flush attempt
  if (!_pendingFlushTimer) _pendingFlushTimer = setTimeout(flushPending, 5000);
}

async function flushPending() {
  _pendingFlushTimer = null;
  let pending = _loadPending();
  if (!pending.length) { updateSyncIndicator(); return; }
  const survivors = [];
  for (const op of pending) {
    const ok = await _sendPayload(op.payload);
    if (!ok) survivors.push(op);
  }
  _savePending(survivors);
  if (survivors.length) {
    // Schedule next attempt with backoff
    _pendingFlushTimer = setTimeout(flushPending, 30000);
  } else if (typeof window !== 'undefined' && typeof window.notify === 'function') {
    if (pending.length > 0) window.notify(`${pending.length} שינויים סונכרנו לשיטס`, 'success');
  }
  updateSyncIndicator();
}

// Bi-directional sync — pull latest from sheet on load
async function pullAllFromSheet() {
  // Skip if user changed something in last 30 seconds (let local writes propagate)
  if (Date.now() - _lastLocalChange < 30000) {
    console.log('[sync] skipping pull — recent local change');
    return;
  }
  // Skip pull if we have un-synced writes — pull would overwrite them
  if (_hasPending()) {
    console.log('[sync] skipping pull — pending writes still queued');
    // Try to flush before next pull
    flushPending();
    return;
  }
  const [students, behavior, users, classes, functioning, tests, medications, meetings, attendance, categoriesRows] = await Promise.all([
    pullFromSheet('תלמידים'),
    pullFromSheet('מעקב_התנהגות'),
    pullFromSheet('משתמשים'),
    pullFromSheet('כיתות'),
    pullFromSheet('תפקוד'),
    pullFromSheet('מבחנים'),
    pullFromSheet('כדורים'),
    pullFromSheet('אסיפות'),
    pullFromSheet('נוכחות'),
    pullFromSheet('קטגוריות'),
  ]);
  // Don't overwrite local with empty if local has data (avoid silent wipe)
  const safeReplace = (cur, fresh) => {
    if (fresh === null) return cur;
    if (Array.isArray(fresh) && fresh.length === 0 && Array.isArray(cur) && cur.length > 0) return cur;
    return fresh;
  };
  _data.students = safeReplace(_data.students, students);
  // Default status for any student that lost it
  _data.students.forEach(s => { if (!s['סטטוס']) s['סטטוס'] = 'פעיל'; });
  _data.behavior = safeReplace(_data.behavior, behavior);
  if (users !== null) {
    // Only apply users with valid schema
    const valid = users.filter(u => u['שם משתמש'] && u['סיסמה'] !== undefined && u['סיסמה'] !== '');
    if (!(valid.length === 0 && _data.users.length > 0)) {
      _data.users = valid.map(u => ({
        username: u['שם משתמש'],
        password_hash: String(u['סיסמה']),
        role: u['תפקיד'],
        permissions: u['הרשאות'],
        visible_students: u['תלמידים_מורשים'] || 'all',
        visible_categories: u['קטגוריות_מורשות'] || 'all',
        visible_classes: u['כיתות_מורשות'] || 'all',
        full_name: u['שם מלא'] || '',
        email: u['אימייל'] || '',
        phone: u['טלפון'] || '',
        notes: u['הערות_משתמש'] || '',
      }));
      if (!_data.users.find(u => u.role === 'מנהל')) {
        _data.users.unshift({username:'admin',password_hash:'6742',role:'מנהל',permissions:'all'});
      }
    }
  }
  _data.classes = safeReplace(_data.classes, classes);
  _data.functioning = safeReplace(_data.functioning, functioning);
  _data.tests = safeReplace(_data.tests, tests);
  _data.medications = safeReplace(_data.medications, medications);
  _data.meetings = safeReplace(_data.meetings, meetings);
  _data.attendance = safeReplace(_data.attendance, attendance);
  if (Array.isArray(categoriesRows) && categoriesRows.length) {
    _data.categories = categoriesRows.map(r => ({
      name: r['קטגוריה'] || r.name || '',
      'קטגוריה': r['קטגוריה'] || r.name || '',
      'תיאור': r['תיאור'] || '',
    })).filter(c => c.name);
  }
  saveStored(_data);
  // If everything failed, mark offline; if at least one succeeded, online
  const allFailed = students === null && behavior === null && users === null && classes === null && functioning === null && tests === null && medications === null && meetings === null && attendance === null && categoriesRows === null;
  _online = !allFailed;
  // Refresh in-memory currentUser from refreshed users list
  try {
    const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (sess.username && typeof currentUser !== 'undefined' && currentUser) {
      const fresh = _data.users.find(u => u.username === sess.username);
      if (fresh) {
        const changed = currentUser.role !== fresh.role || currentUser.permissions !== fresh.permissions;
        currentUser.role = fresh.role;
        currentUser.permissions = fresh.permissions;
        sessionStorage.setItem('user', JSON.stringify({username: fresh.username, role: fresh.role, permissions: fresh.permissions}));
        if (changed && typeof filterByPermissions === 'function') filterByPermissions();
      }
    }
  } catch {}
  updateSyncIndicator();
}

function updateSyncIndicator() {
  let el = document.getElementById('sync-indicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sync-indicator';
    el.className = 'sync-indicator';
    document.body.appendChild(el);
  }
  const pendingCount = _loadPending().length;
  if (pendingCount > 0) {
    el.innerHTML = `<i class="bi bi-cloud-upload sync-warn" style="color:#f59e0b"></i> ${pendingCount} שינויים ממתינים לסנכרון`;
  } else if (_online) {
    el.innerHTML = '<i class="bi bi-cloud-check-fill sync-online"></i> מסונכרן עם השיטס';
  } else {
    el.innerHTML = '<i class="bi bi-cloud-slash sync-offline"></i> אין חיבור — נתונים מ-cache';
  }
}

// Run sync check on load + pull latest from sheet
window.addEventListener('load', () => {
  setTimeout(async () => {
    await syncToBackend();
    if (_online && _data) {
      await pullAllFromSheet();
      // Refresh current view
      try {
        if (typeof loadStats === 'function') loadStats();
        const hash = location.hash.replace('#','');
        if (hash && typeof showPage === 'function') showPage(hash);
      } catch (e) {}
    }
  }, 1500);
});

// Periodic pull every 60 seconds for true bi-directional sync
setInterval(async () => {
  if (_online && _data) {
    await pullAllFromSheet();
  }
}, 60000);
