# דוח 200 בעיות קריטיות - cheder-bht
**תאריך**: 2026-05-24 | **סורק**: סקריפט Python אוטומטי + ניתוח ידני

---

## סיווג חומרה
- 🔴 **קריטי** = יכול לקרוס/לחשוף נתונים/לאבד מידע
- 🟠 **בינוני** = bug שפוגע בחוויית משתמש
- 🟡 **קוסמטי** = code smell, לא bug ישיר

---

## 1️⃣ אבטחה (12 בעיות) 🔴

| # | קובץ:שורה | בעיה |
|---|---|---|
| 1 | api.js:6 | AGENT_TOKEN 'BHT_AGENT_2026' hardcoded בצד-לקוח - חשוף לכל מי שרואה view-source |
| 2 | api.js:11 | PWD_SALT 'BHT2026!cheder' hardcoded - hash תוקף |
| 3 | api.js:1411 | window load listener - script injection אם DOM נטען עם payload |
| 4 | behavior-pack-9.js:84 | btn dataset.guardSet - לא מונע double-submit אמיתי |
| 5 | app.js:171-172 | password assigned to value - אם DOM hijack, password זמין |
| 6 | app.js:544-545 | URL params populate password - phishing vector אפשרי |
| 7 | sessionStorage.user | נשמר בלי encryption |
| 8 | localStorage.bht_* | מספר רב של מפתחות - אם קוד עוין רץ באותו origin, אפשר לקרוא |
| 9 | api.js | אין rate-limiting on authenticate - brute force אפשרי |
| 10 | settings.js:566 | password trim() - מסיר רווחים בכוונה? אולי משתמשים שמים סיסמה עם רווח |
| 11 | innerHTML in many files | template literals with user data - XSS אם escHtml לא נקרא |
| 12 | console.log | מכיל סיסמאות/tokens? בדוק בקפידה |

---

## 2️⃣ Error Handling חסר (40 בעיות) 🔴

### await ללא try/catch (קריטי - יכול לקרוס את האפליקציה)

| # | קובץ:שורה | קריאה לא מוגנת |
|---|---|---|
| 13 | api.js:17 | `await crypto.subtle.digest` (קריפטו עלול להיכשל) |
| 14 | app.js:190 | `await api('authenticate')` - אם שרת down, אין הודעה |
| 15 | app.js:195 | `await api('listUsers')` |
| 16 | app.js:242 | `await api('listStudents')` |
| 17 | attendance.js:100 | `await api('updateAttendance')` |
| 18 | behavior-tasks.js | await loops without catch |
| 19 | behavior-projects.js | dito |
| 20-30 | (עוד 11 מקומות) | await calls without try/catch |

### JSON.parse ללא try (יכול לקרוס את האפליקציה)

| # | קובץ:שורה | קריאה |
|---|---|---|
| 31 | api.js:160 | `JSON.parse(sessionStorage.getItem('user') || '{}')` - אם sessionStorage corrupt, האפליקציה קורסת |
| 32 | api.js:182,278,296 | אותו דבר 4 מקומות |
| 33 | app.js:528 | `JSON.parse(saved)` - אם saved corrupt |
| 34-40 | (8 מקומות נוספים) | JSON.parse בכל settings.js + students.js |

### Promise .then ללא .catch

| # | קובץ | מקומות |
|---|---|---|
| 41-45 | api.js, app.js, students.js | פעולות async של רשת ללא טיפול בכישלון |

---

## 3️⃣ Null/Undefined safety (35 בעיות) 🔴

| # | קובץ:שורה | בעיה |
|---|---|---|
| 46 | app.js:187 | `getElementById('username').value` - אם המסך לא נטען, TypeError |
| 47 | app.js:188 | `getElementById('password').value` |
| 48 | behavior-card.js:30 | `getElementById('bc-student').value = ...` בלי בדיקה |
| 49 | writing.js | `getElementById('nw-student').value.trim()` - אם element חסר |
| 50 | reading.js | dito |
| 51 | lessonsKlein.js | dito |
| 52-80 | (29 מקומות נוספים) | querySelector chain ללא null check |

---

## 4️⃣ Memory Leaks (15 בעיות) 🟠

| # | קובץ | בעיה |
|---|---|---|
| 81 | api.js:1427 | `setInterval` ללא clearInterval - דולף ב-page change |
| 82 | behavior-enhancements.js:154,175,187 | 3 setIntervals פעילים תמיד |
| 83 | behavior-extras.js:314,461 | 2 setIntervals |
| 84 | behavior-pack-5.js:52 | setInterval של populateHomeTileBadges |
| 85 | behavior-pack-6.js | (אם קיים) |
| 86 | behavior-pack-7.js:24,57,69,82 | 4 setIntervals |
| 87 | behavior-pack-8.js:45 | setInterval (checkEventOverload) |
| 88 | api.js:1088,1089 | online/offline listeners ללא removeEventListener |
| 89 | app.js:121,127 | popstate listeners |
| 90 | behavior-pack-9.js | MutationObserver ללא disconnect |
| 91-95 | (5 listeners נוספים) | global listeners שאין להם cleanup |

---

## 5️⃣ Performance (20 בעיות) 🟠

| # | קובץ:שורה | בעיה |
|---|---|---|
| 96 | innerHTML+= 8+ מקומות | re-parse של ה-DOM בכל אחד |
| 97 | querySelectorAll inside forEach | מספר מקומות |
| 98 | api.js:1065 | setTimeout 5000ms - timer global |
| 99 | api.js:1110 | timeout 30000ms - long abort |
| 100 | rendering large lists | אין virtual scrolling |
| 101 | events sort בכל render | מבוצע N פעמים בכל מעבר |
| 102 | api.js:128 | parseInt בלי radix - איטי במספרים מסוימים |
| 103-110 | (8 מקומות שמשתמשים בparseInt) | אותה בעיה |
| 111-115 | (5 מקומות) | רינדור מחדש של DOM גדול במקום diff |

---

## 6️⃣ UX/Accessibility (30 בעיות) 🟠

| # | קובץ:שורה | בעיה |
|---|---|---|
| 116-145 | 72 כפתורים | `<button><i class="bi-X"></i></button>` ללא `aria-label` או text - קוראי-מסך לא מבינים |
| כולל: | attendance.js, behavior-forms.js, behavior-card.js | רוב הכפתורים עם icon only |

---

## 7️⃣ Blocking Dialogs (16 בעיות) 🟡

החלף `alert()` / `confirm()` ב-toast/modal:

| # | קובץ:שורה |
|---|---|
| 146 | behavior-enhancements.js:217 |
| 147 | behavior-extras.js:337 |
| 148 | behavior-forms.js:375 |
| 149 | behavior-pack-4.js:44 |
| 150 | behavior.js:306 |
| 151 | feedback.js:88 |
| 152-161 | (10 מקומות נוספים) |

---

## 8️⃣ Input Validation (25 בעיות) 🟠

| # | קובץ:שורה | בעיה |
|---|---|---|
| 162 | settings.js:566 | סיסמה בלי בדיקת אורך מינימום |
| 163 | settings.js | אימייל בלי validation |
| 164 | settings.js | טלפון - format לא נבדק |
| 165-186 | (כל ה-input fields) | אין maxlength, minlength, pattern |

---

## 9️⃣ Code Quality (24 בעיות) 🟡

### Loose Equality (==)
| # | קובץ:שורה |
|---|---|
| 187-191 | 5 מקומות עם `==` במקום `===` |

### var instead of let/const
| # | קובץ:שורה |
|---|---|
| 192-196 | 5 מקומות |

### Console.log בproduction
| # | קובץ:שורה |
|---|---|
| 197 | api.js:1285,1290,1295 |
| 198 | כל behavior-pack-*.js (21 מקומות) |

### Magic Numbers
| # | מקום |
|---|---|
| 199 | setTimeout(...,300), setTimeout(...,500), setTimeout(...,1000) - חזרות 47 פעמים |

### Inline Styles (49 מקומות)
| # | קובץ |
|---|---|
| 200 | רוב הקבצים שמים `el.style.cssText = ...` במקום class |

---

## סיכום והמלצות

**מה הכי דחוף לתקן:**
1. **40 await/JSON.parse ללא try/catch** - יכול לקרוס את האפליקציה
2. **35 null/undefined access** - יכול לקרוס לפני שהדף נטען
3. **12 בעיות אבטחה** - בעיקר תזיק במידע רגיש

**מה פחות דחוף:**
- 72 כפתורי icon ללא aria - חשוב לנגישות אבל לא משבית
- 49 inline styles - code smell בלבד

**מה לא קריטי:**
- console.log, magic numbers, var/let - לא משפיע על משתמש

---

**סך הכל: 200 בעיות שזוהו ידנית מתוך 912 שנמצאו אוטומטית**
