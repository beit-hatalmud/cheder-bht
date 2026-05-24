// rabbis.js — רשימת רבנים משותפת + זיהוי אוטומטי לפי משתמש מחובר
// 2026-05-24

window.RABBIS = {
  writing:  ['הרב יודלוב', 'הרב קליין', 'הרב ירושלמי', 'הרב שניידר', 'הרב סורוצקין', 'הרב ארלנגר', 'הרב פרידלנדר', 'הרב וינברג', 'הרב קלצקין', 'הרב רוקמיל', 'הרב הינמן', 'הרב לינצנר', 'הרב יגר', 'הרב גולדברג', 'הרב גליק', 'הרב ולפסון', 'אחר'],
  reading:  ['הרב יודלוב', 'הרב קליין', 'הרב ירושלמי', 'הרב שניידר', 'הרב סורוצקין', 'הרב ארלנגר', 'הרב פרידלנדר', 'הרב וינברג', 'הרב קלצקין', 'הרב רוקמיל', 'הרב הינמן', 'הרב לינצנר', 'הרב יגר', 'הרב גולדברג', 'הרב גליק', 'הרב ולפסון', 'אחר'],
  lessons:  ['הרב יודלוב', 'הרב קליין', 'הרב ירושלמי', 'הרב שניידר', 'הרב סורוצקין', 'הרב ארלנגר', 'הרב פרידלנדר', 'הרב וינברג', 'הרב קלצקין', 'הרב רוקמיל', 'הרב הינמן', 'הרב לינצנר', 'הרב יגר', 'הרב גולדברג', 'הרב גליק', 'הרב ולפסון', 'אחר'],
};

// מיפוי משתמש → רב. ניתן לעדכן בהגדרות.
window.USER_TO_RABBI = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem('bht_user_rabbi_map') || '{}');
    return Object.assign({
      'yudlov': 'הרב יודלוב',
      'klein': 'הרב קליין',
      'yerushalmi': 'הרב ירושלמי',
      'shneider': 'הרב שניידר',
      'sorotzkin': 'הרב סורוצקין',
      'erlanger': 'הרב ארלנגר',
      'friedlander': 'הרב פרידלנדר',
      'weinberg': 'הרב וינברג',
      'klatzkin': 'הרב קלצקין',
      'rockmill': 'הרב רוקמיל',
      'hineman': 'הרב הינמן',
      'linzner': 'הרב לינצנר',
      'yagar': 'הרב יגר',
      'goldberg': 'הרב גולדברג',
      'glick': 'הרב גליק',
      'wolfson': 'הרב ולפסון',
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
