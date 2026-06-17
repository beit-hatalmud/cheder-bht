# cheder-bht — Roadmap (תוכנית עבודה לrebuild)

עודכן: 2026-06-17 (Claude Code working overnight)

## למה rebuild

המערכת הנוכחית עובדת אבל יש בה בעיות מבניות שמצטברות:

1. **Apps Script deploy תקוע** ב-200 versions + emergency rollback ל-v=175 — כל תיקון לbackend לא חי ב-production
2. **Google Sheets כ-DB** איטי לcouplings, אין FK, אין transactions, אין indices
3. **149 קבצי behavior-pack** ב-1.3 MB שאף אחד לא טוען מ-HTML (רק bundle)
4. **Backdoor admin/6742** היה גלוי בקוד הלקוח (תוקן 2026-06-17)
5. **AGENT_TOKEN חשוף** בקוד הלקוח (עדיין — נסגר בstage 3)
6. **אין error logging** — באג נופל ואין מי שיודע
7. **לא יציב** — load 8 שניות, 58 script tags, שני קבצי `app.js` שונים שmaintained בנפרד

## איך אתרים מקצועיים פותרים כל אחד

| בעיה | מה אנחנו עושים עכשיו | סטנדרט תעשייתי | רענון שלנו |
|---|---|---|---|
| Auth | סיסמה+SHA-256 בScripts + backdoor | OAuth provider (Google/Auth0) | Supabase + Google OAuth |
| DB | Google Sheets | PostgreSQL/MongoDB | Supabase PostgreSQL |
| Permissions | רשימה client-side | RLS server-side | Postgres RLS |
| Logs | localStorage | Sentry/Datadog | Supabase `error_log` table + admin UI |
| Versioning | 58 hand-typed `?v=YYYYMMDD` | Build hash injected from CI | GitHub Action → hash |
| Code size | 1.3 MB packs + 1 MB bundle | 5-10 modules + lazy `import()` | אם המקור מאחד, ננקה |
| Realtime | פולל כל 10 דק' | WebSocket / Server-Sent Events | Supabase Realtime |
| Deploy | push + ידני | CI/CD with checks | GitHub Actions |

## שלבי העבודה

### ✅ שלב 1 (הושלם) — Quick wins ואבטחה
- [x] Google Sign-In flow ב-frontend (`js/google_login.js`)
- [x] רשימת משתמשים בקובץ JSON (`data/google_users.json`)
- [x] UI ניהול משתמשים לאדמין (`js/google_admin.js`)
- [x] הסרת `admin/6742` backdoor (3 מקומות)
- [x] הסרת `?u=&p=` URL auto-login
- [x] איחוד שני קבצי `app.js` ל-אחד
- [x] Global error logger (`js/error_log.js` + `errors_admin.js`)
- [x] תוסף ירושלמי (`tt0527686018@gmail.com`)

### 🔄 שלב 2 (in progress) — Supabase setup
- [x] Schema SQL (`supabase/schema.sql`) — 18 טבלאות + RLS + bootstrap admins
- [x] Migration script (`supabase/migrate.py`) — idempotent על `legacy_id`
- [ ] יצירת Supabase project
- [ ] הרצת `schema.sql`
- [ ] הרצת `migrate.py` בDRY-RUN
- [ ] בדיקת RLS עם Yosef + Yerushalmi
- [ ] הרצת migration אמיתי

### 📋 שלב 3 — Client refactor
- [ ] Supabase JS client (`js/supabase_client.js`)
- [ ] החלפת `api.js` ל-Supabase calls (queries + mutations)
- [ ] הסרת `AGENT_TOKEN` מהקוד (Supabase משתמש ב-JWT)
- [ ] התקנת RLS-aware permission filtering (server-side)

### 🎨 שלב 4 — UI Refresh
- [ ] עיצוב מודרני (Tailwind או Bootstrap 5 עם theme חדש)
- [ ] מובייל-first
- [ ] dark mode מובנה (לא extra CSS)
- [ ] צבעי ה-brand: כחול כהה + לבן + זהב לכותרות

### 🧹 שלב 5 — Cleanup
- [ ] מחיקת 149 קבצי `behavior-pack-*.js` (לאחר ode-review)
- [ ] איחוד 9 קבצי `behavior-*.js` ל-3 מודולים: `events`, `tasks`, `forms`
- [ ] איחוד `sync-engine.js` + `sync-engine-v2.js`
- [ ] ניקוי `backend/` הישן

### 🚀 שלב 6 — Deploy & CI
- [ ] GitHub Action: build → test → deploy
- [ ] BUILD_HASH מוזרק אוטומטית במקום 58 `?v=...`
- [ ] Service Worker cache name = build hash
- [ ] Deploy log

### 📊 שלב 7 — Observability
- [ ] Daily snapshot ל-Drive (כבר קיים)
- [ ] Health check page (uptime + DB latency)
- [ ] Usage analytics (anonymous, opt-in)

## מה אעבוד עליו הלילה

ScheduleWakeup פעיל — אקבל wake-up אוטומטי כל ~30 דקות ואמשיך.

1. Supabase Setup (אנסה דרך Gmail MCP)
2. Migration script — בדיקה DRY-RUN
3. Frontend refactor — שלב 3 (החלפת api.js)
4. Cleanup behavior-packs — שלב 5
5. UI refresh — שלב 4
6. כל commit + push, כך שתראה בבוקר התקדמות חיה ב-GitHub

## איך לראות התקדמות

- **GitHub commits**: https://github.com/beit-hatalmud/cheder-bht/commits/main
- **תיקיית `supabase/`** — schema, migration, policies
- **תיקיית `js/`** — קוד frontend חדש
- **קובץ זה (`ROADMAP.md`)** — מתעדכן בכל שלב

אם משהו לא ברור — `BHT.errorBuffer()` בDevTools של האתר יראה לך כל error שנתפס.
