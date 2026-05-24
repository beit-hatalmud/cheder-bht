// behavior-pack-8.js — sbbs 131-150. 2026-05-24.

// SBB 131-135: Misc helpers
window.formatDuration = (ms) => {
  const s = Math.floor(ms/1000);
  if (s < 60) return s + 'ש';
  if (s < 3600) return Math.floor(s/60) + 'דק';
  return Math.floor(s/3600) + 'ש׳ ' + Math.floor((s%3600)/60) + 'דק';
};

window.isWeekend = (d) => { d = d || new Date(); return d.getDay() === 5 || d.getDay() === 6; };

window.upcomingTasks = (days) => {
  days = days || 3;
  const max = Date.now() + days*86400000;
  return (window._tasks||[]).filter(t => t['סטטוס']!=='הושלם' && t['תאריך_יעד'] && new Date(t['תאריך_יעד']).getTime() < max);
};

window.studentEvents = (sid) => (window._events||[]).filter(e => String(e['תלמיד_מזהה'])===String(sid));
window.studentTasks = (sid) => (window._tasks||[]).filter(t => String(t['תלמיד_מזהה'])===String(sid));

// SBB 136: Bookmark a student (favorite)
window.bookmarkStudent = (sid) => {
  let favs = []; try { favs = JSON.parse(localStorage.getItem('bht_fav_students') || '[]'); } catch{}
  if (favs.includes(sid)) favs = favs.filter(s => s !== sid);
  else favs.push(sid);
  localStorage.setItem('bht_fav_students', JSON.stringify(favs));
  if (typeof toast === 'function') toast(favs.includes(sid)?'נוסף למועדפים':'הוסר ממועדפים', 'success');
};
window.getFavoriteStudents = () => { try { return JSON.parse(localStorage.getItem('bht_fav_students') || '[]'); } catch { return []; } };

// SBB 137: Auto-detect urgent keywords in descriptions
const URGENT_KEYWORDS = ['דחוף', 'מיידי', 'חירום', 'תקיפה', 'אלימות'];
window.isUrgent = (text) => URGENT_KEYWORDS.some(k => (text||'').includes(k));

// SBB 138: Detect when too many events recently → suggest action
window.checkEventOverload = () => {
  const lastHour = Date.now() - 3600000;
  const recent = (window._events||[]).filter(e => new Date(e['תאריך']||0).getTime() > lastHour);
  if (recent.length > 5 && !sessionStorage.getItem('overload_warned')) {
    sessionStorage.setItem('overload_warned', '1');
    if (typeof toast === 'function') toast(`⚠ ${recent.length} אירועים בשעה האחרונה - בדוק אם הכל בסדר`, 'warn');
  }
};
setInterval(checkEventOverload, 5*60*1000);

// SBB 139: Random useful tip on home
window.randomTip = () => {
  const tips = [
    '💡 לחץ Ctrl+K לחיפוש מהיר בכל המערכת',
    '💡 לחץ ? בכל מסך למדריך מלא',
    '💡 משימה דחופה? סמן עדיפות "דחוף" וקבל badge אדום',
    '💡 קישור חתימה לכל המכינה? סמן "broadcast" במודל יצירה',
    '💡 מצב חשוך? לחץ הירח 🌙 בפינה השמאלית למעלה',
    '💡 צריך לדבר במקום להקליד? לחץ 🎤 בכל תיאור',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
};

// SBB 140: Show random tip on home
window.showHomeTip = () => {
  if (location.hash.replace('#','') && location.hash !== '#home') return;
  if (document.getElementById('home-tip')) return;
  const tip = document.createElement('div');
  tip.id = 'home-tip';
  tip.style.cssText = 'background:linear-gradient(135deg,#ddd6fe,#c4b5fd);color:#5b21b6;padding:10px 14px;border-radius:8px;margin:8px 0;font-family:Heebo,Arial;direction:rtl;text-align:center;font-size:13px';
  tip.textContent = randomTip();
  const home = document.getElementById('page-home');
  if (home && !home.classList.contains('d-none')) home.insertBefore(tip, home.firstChild);
};
setTimeout(showHomeTip, 1500);

console.log('%c🎯 150 סבבים במצטבר - עבודה אדירה!', 'color:#dc2626;font-size:14px;font-weight:bold');
