// rabbis.js — רשימת רבנים משותפת + זיהוי אוטומטי לפי משתמש מחובר
// 2026-05-24

window.RABBIS = {
  writing:  ['הרב יודלוב', 'הרב שניידר', 'הרב קליין', 'הרב ירושלמי', 'אחר'],
  reading:  ['הרב יודלוב', 'הרב שניידר', 'הרב קליין', 'הרב ירושלמי', 'אחר'],
  lessons:  ['הרב קליין', 'הרב יודלוב', 'הרב שניידר', 'הרב ירושלמי', 'אחר'],
};

// מיפוי משתמש → רב. ניתן לעדכן בהגדרות.
window.USER_TO_RABBI = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem('bht_user_rabbi_map') || '{}');
    return Object.assign({
      'yudlov': 'הרב יודלוב',
      'klein': 'הרב קליין',
      'shneider': 'הרב שניידר',
      'yerushalmi': 'הרב ירושלמי',
    }, stored);
  } catch { return {}; }
})();

window.currentRabbi = function() {
  const sess = JSON.parse(sessionStorage.getItem('user') || '{}');
  const u = (sess.username || '').toLowerCase();
  if (window.USER_TO_RABBI[u]) return window.USER_TO_RABBI[u];
  // אם השם כולל את שם הרב (לדוגמה "yudlov" או "klein") - לזהות
  for (const [uname, rabbi] of Object.entries(window.USER_TO_RABBI)) {
    if (u.includes(uname.toLowerCase())) return rabbi;
  }
  return '';
};

window.rabbiDropdownHTML = function(category, selectedVal, idPrefix) {
  const list = window.RABBIS[category] || window.RABBIS.lessons;
  const sel = selectedVal || window.currentRabbi() || '';
  return `<select id="${idPrefix}-rabbi" class="form-select">
    <option value="">— בחר רב —</option>
    ${list.map(r => `<option value="${r}" ${r===sel?'selected':''}>${r}</option>`).join('')}
  </select>`;
};

window.saveUserRabbiMap = function(uname, rabbi) {
  const map = JSON.parse(localStorage.getItem('bht_user_rabbi_map') || '{}');
  if (rabbi) map[uname.toLowerCase()] = rabbi; else delete map[uname.toLowerCase()];
  localStorage.setItem('bht_user_rabbi_map', JSON.stringify(map));
  window.USER_TO_RABBI[uname.toLowerCase()] = rabbi;
};

console.log('%c✅ rabbis.js loaded', 'color:#7c3aed;font-weight:bold');
