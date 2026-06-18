# cheder-bht — מערכת מעקב התנהגות ולמידה לבית התלמוד

**Live site:** https://beit-hatalmud.github.io/cheder-bht/  
**Owner:** יוסף שניידר ([@yossi6742853](https://github.com/yossi6742853))  
**Hosting:** GitHub Pages (free) + Apps Script + Supabase Postgres.

---

## מה זה?

מערכת ניהול תלמידים, התנהגות, נוכחות, מבחנים, אסיפות ושיחות עבור
המכינה של בית התלמוד במעלה עמוס. כתוב כאתר סטטי (HTML/JS) עם backend
היברידי: Apps Script לתאימות לאחור עם Google Sheets, ו-Supabase
Postgres כעמוד שדרה החדש.

## ארכיטקטורה (תמונת מצב 2026-06-18)

```
דפדפן (RTL Hebrew)
   ↓
GitHub Pages — index.html + ~70 קבצי JS
   ↓
api()  ──→  Apps Script /exec  ←──→  Google Sheets "בית התלמוד"
   └─→     Supabase REST       ←──→  Postgres (18 tables, RLS)
```

**Frontend:**
- 60+ js modules, Bootstrap 5 RTL, Chart.js, Bootstrap Icons.
- Service Worker (sw.js) caches core + key modules for offline.
- `manifest.webmanifest` — PWA, installable on mobile.

**Backend (legacy):**
- Apps Script project "ai-email-agent" (`1Dby8H-Jp86g…`).
- Deployment `AKfycbzh…/exec` → currently serves v218.
- 61 files (AuthV2, ValidateV2, Monitoring, Webhook, etc.).
- A watchdog auto-restores the project if files are wiped (it
  happens ~every 30 min from an unknown source).

**Backend (new, in transition):**
- Supabase project `iythgizaqjivxtgwyexj` (Asia-Pacific Singapore).
- 18 tables: users, classes, students, categories, behavior_events,
  attendance, tasks, projects, tests, medications, meetings,
  conversations, signatures, functioning_reports, petty_cash,
  audit_log, error_log, permission_groups.
- Row Level Security wired to `auth.uid()`.
- Migrated state: 20 users, 4 classes, 14 categories, 42 students,
  557 behavior events, 445 tests, 27 medications, 49 meetings,
  8 conversations, 42 functioning reports.

## משימות מתוזמנות מקומיות

| משימה | תזמון | מטרה |
|---|---|---|
| `BHT_DailyBackup`     | 23:00 כל יום | גיבוי JSON + xlsx לכל הטבלאות |
| `BHT_AuthWatchdog`    | כל 10 דק׳    | ניטור + שחזור אוטומטי של AuthV2 |
| `BHT_SmokeTest`       | כל 30 דק׳    | playwright headless e2e |
| `BHT_UptimeCollect`   | כל 5 דק׳     | JSONL של latency + availability |
| `BHT_WeeklySummary`   | ראשון 07:00 | מייל סיכום שבועי ליוסף |

לוגים: `%LOCALAPPDATA%\cheder-bht-watchdog\`
גיבויים: `C:\Users\יוסף שניידר\bht_backups\cheder-bht\YYYY-MM-DD\`

## פיצ'רים שנוספו ב-2026-06-18

עיצוב + UX:
- דף בית בקבוצות חכמות (יומיומי / אקדמי / ניהול)
- כרטיס "תלמיד היום" עם בחירה חכמה (אקראי / חכם / חיפוש)
- מודאל "תלמיד היום" — סיכום מלא בלחיצה
- חיפוש מהיר Ctrl+K
- גרפים בלוח הבקרה (Chart.js, 4-5 גרפים, נסתרים לפי בחירה)
- Dark mode מלא
- פעמון התראות בכותרת
- נקודת סטטוס "כל המערכת חיה"
- PWA installable במובייל
- כרטיסי צוות מותאמים למובייל

תשתית:
- העברת כל הנתונים ל-Supabase (migration script)
- שמירת כניסה ("Remember me") בכל דפדפן
- pre-warm cache לרשימות
- audit log viewer לאדמין
- live smoke test
- watchdog שמשחזר את ה-backend אוטומטית

## פיתוח מקומי

```
git clone https://github.com/beit-hatalmud/cheder-bht
cd cheder-bht
# Serve locally with any static server, e.g.:
python -m http.server 8000
```

הסביבה הזו אינה דורשת build step — הכל vanilla JS.

## פריסה (deploy)

```bash
git push origin main
# GitHub Pages עולה תוך 1-2 דק'.
```

לפריסה ל-Apps Script מאחורי NetFree, השתמש ב:
```bash
python ai-email-agent/_push_auth_restore.py  # repush AuthV2 + Webhook
python ai-email-agent/bump_deployment.py     # bump deployment to HEAD
```

## בעיות ידועות

- ה-Apps Script project נמחק/נדרס כל ~30 דק' — לא מצאנו את המקור.
  ה-watchdog משחזר אוטומטית כל 10 דק'.
- `must_change=true` למשתמשים חדשים — המודאל לפעמים חוסם את
  הניווט הבא ב-smoke test.

## דרך הקודש

הקוד תוחזק על ידי Claude Code (Anthropic) ביחד עם יוסף.
לעדכונים: כל commit כולל `Co-Authored-By: Claude Opus 4.7`.
