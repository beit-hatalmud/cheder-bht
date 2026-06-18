# CHANGELOG — cheder-bht

## 2026-06-18 — Major overnight rebuild

קוטר השדרוג: **~30 commits, ~3,500 שורות קוד חדשות, 9 משימות מתוזמנות**.

### 🆕 פיצ׳רים חדשים

**ממשק משתמש:**
- דף בית בשלוש קבוצות חכמות במקום ארבע (יומיומי / אקדמי-רפואי / ניהול)
- כרטיס "תלמיד היום" עם 3 כפתורי בחירה: **חכם** (תלמיד שצריך תשומת לב) / **אקראי** / **חיפוש**
- מודאל סיכום תלמיד מלא — אירועים, מבחנים, נוכחות, רפואה, אסיפות (`student_quickview.js`)
- חיפוש מהיר **Ctrl+K** — דפים + תלמידים, ניווט במקלדת
- **4-5 גרפים** בלוח הבקרה (Chart.js): התנהגות שבועי, פיזור קטגוריות, מבחנים, נוכחות, **כיתות**
- **toggles** לכל גרף — שמירת בחירה ב-localStorage
- **לחיצה על גרף = ניווט** לדף המלא
- פעמון התראות בכותרת + dedupe תוך 60 שניות
- 🟢 נקודת סטטוס "כל המערכת חיה" — בודקת אוטומטית כל דקה
- דף **#sysmon** עם פינג חי + כפתור "שלח דוח עכשיו"
- **#audit** — צפייה ביומן פעולות עם סינון + חיפוש
- כרטיס "יום [X]" עם מערכת שעות
- באנר ברוכים הבאים בכניסה ראשונה
- תגית "חדש" מהבהבת ליד החיפוש
- כרטיסים במקום טבלה במובייל (דף צוות)
- skeleton loaders עם shimmer

**אבטחה ויציבות:**
- ✅ **הוסר backdoor `admin/6742`** מהקוד
- 🔐 שמירת כניסה (Remember me) ב-localStorage
- 🛡️ **Watchdog** משחזר את Apps Script אוטומטית כל 10 דקות (משחזר אמת! תפס 2+ regressions היום)
- 🧪 **Smoke test** הרץ אוטומטית כל 30 דקות
- 🔍 **Backup integrity check** יומי 23:30
- 📊 **Uptime collector** כל 5 דקות → JSONL
- 📈 **health.html dashboard** מתעדכן כל 15 דק׳

**נתונים:**
- 💾 **Migration מלא ל-Supabase Postgres** — 1,232 רשומות, 11 טבלאות
- 📦 **גיבוי יומי** ב-23:00 — 12 טבלאות JSON + xlsx + גם מ-Sheets במקביל
- 📧 **דוח שבועי אוטומטי** ביום ראשון 07:00 — אומת ששליחה עובדת!

**PWA:**
- 📱 manifest.webmanifest עם 3 קיצורי דרך
- 🎨 icon-maskable.png לאנדרואיד (safe-zone padded)
- 💾 Service Worker מטמין את הקוד החדש
- ⚡ Pre-warm cache — pre-fetch 10 רשימות בזמן idle

**Dark Mode:**
- מצב כהה מלא עם קונטרסט מותאם לכל הקומפוננטות החדשות

**נגישות:**
- focus rings אמיתיים (3px כחול) לניווט במקלדת
- label-for + aria-required בדף login
- targets גדולים במובייל (≥44px)

### 🐛 תיקוני באגים

- **login שבור** (Google block הסתיר את שדה הסיסמה) — תוקן: שני הבלוקים מוצגים ביחד
- **null classList** ב-`showPage` — תוקן: null guard לדפים שנוצרים lazy
- **Apps Script regression** (נמחק כל 30 דק׳ ע"י משהו לא ידוע) — Watchdog מטפל
- **Duplicate behavior_events** ב-migration — תוקן: idempotency checks
- **secret key ב-Git** — תוקן: נטען מ-credentials.env (gitignored)

### 📁 קבצים חדשים

```
js/audit_viewer.js          js/notifications_bell.js
js/class_breakdown_chart.js js/onboarding.js
js/dashboard_charts.js      js/prewarm_cache.js
js/home_today.js            js/quick_search.js
js/skeleton_loader.js       js/status_dot.js
js/student_quickview.js     js/supabase_client.js
js/sysmon_page.js
supabase/schema.sql             tools/healthcheck_html.py
supabase/migrate_sheets.py      tools/smoke_test.py
supabase/daily_backup.py        tools/uptime_collector.py
supabase/weekly_summary.py      tools/verify_admin_panel.py
supabase/backup_integrity.py    
supabase/supabase_rest.py
ai-email-agent/_push_auth_restore.py  (backend restore)
ai-email-agent/_auth_watchdog.py
manifest.webmanifest            img/icon-192.png
README.md                       img/icon-512.png
LICENSE.md                      img/icon-maskable.png
WORK_PLAN.md                    CHANGELOG.md
```

### ⏰ משימות מתוזמנות (Scheduled Tasks)

| משימה | תזמון | מטרה |
|---|---|---|
| `BHT_DailyBackup`       | 23:00 כל יום   | גיבוי JSON + xlsx |
| `BHT_BackupIntegrity`   | 23:30 כל יום   | בדיקת חוסר התאמה |
| `BHT_AuthWatchdog`      | כל 10 דק׳      | שחזור backend |
| `BHT_SmokeTest`         | כל 30 דק׳      | e2e Playwright |
| `BHT_UptimeCollect`     | כל 5 דק׳       | latency log |
| `BHT_HealthHTML`        | כל 15 דק׳      | dashboard html |
| `BHT_WeeklySummary`     | ראשון 07:00    | מייל סיכום |

### 📊 מספרים

- Supabase: 20 משתמשים, 42 תלמידים, 14 קטגוריות, 4 כיתות, 557 אירועי התנהגות, 445 מבחנים, 49 אסיפות, 8 שיחות, 42 דוחות תפקוד
- Backend: 61 קבצי Apps Script, deployment v218
- Frontend: 70+ קבצי JS, ~24KB index.html, ~16KB main.css
