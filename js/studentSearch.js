// Shared student typeahead helpers — used by behavior, reading, writing, lessons, tests, etc.

function studentDisplay(s) {
  if (!s) return '';
  return `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim();
}

function studentsDatalistOptions(students, activeOnly) {
  if (activeOnly === undefined) activeOnly = true;
  const list = activeOnly ? students.filter(s => (s['סטטוס']||'פעיל') !== 'סיים') : students;
  const counts = {};
  list.forEach(s => { const d = studentDisplay(s); counts[d] = (counts[d]||0) + 1; });
  const esc = (typeof escHtml === 'function') ? escHtml : (x => String(x||''));
  return list.map(s => {
    const d = studentDisplay(s);
    const label = counts[d] > 1 ? `${d} (${s['מזהה']})` : d;
    return `<option value="${esc(label)}">`;
  }).join('');
}

function resolveStudent(label, students) {
  if (!label) return null;
  const t = String(label).trim();
  if (!t) return null;
  const m = t.match(/^(.+)\s+\((\d+)\)$/);
  if (m) return students.find(s => String(s['מזהה']) === m[2]) || null;
  return students.find(s => studentDisplay(s) === t) || null;
}

// Render <input list=...> + <datalist> pair. listId defaults to inputId + '-list'.
function studentTypeaheadHTML(inputId, students, opts) {
  opts = opts || {};
  const placeholder = opts.placeholder || 'הקלד שם תלמיד...';
  const activeOnly = opts.activeOnly !== false;
  const cls = opts.className || 'form-control';
  const listId = opts.listId || (inputId + '-list');
  const esc = (typeof escHtml === 'function') ? escHtml : (x => String(x||''));
  return `<input id="${esc(inputId)}" class="${esc(cls)}" list="${esc(listId)}" placeholder="${esc(placeholder)}" autocomplete="off">
    <datalist id="${esc(listId)}">${studentsDatalistOptions(students, activeOnly)}</datalist>`;
}

// Set the typed value of a typeahead input based on a student ID (used in edit-modal populate)
function setStudentTypeaheadValue(inputId, studentId, students, fallbackName) {
  const el = document.getElementById(inputId);
  if (!el) return;
  const stu = students.find(s => String(s['מזהה']) === String(studentId));
  el.value = stu ? studentDisplay(stu) : (fallbackName || '');
}
