# Cheder-BHT — Developer Guide

**Last updated:** 2026-05-27
**Architecture:** Single-page app (vanilla JS) + Google Apps Script backend

## Project Overview

cheder-bht is a Hebrew yeshiva management system. Features:
- Student tracking (behavior, conversations, profile)
- TLA (Personal Learning Plans) per student
- Live camera grid (11 cameras via mediamtx + Cloudflare Tunnel)
- Multi-shiur support (א / ב1 / ב2 / ג)

**Live:** https://beit-hatalmud.github.io/cheder-bht/
**Repo:** https://github.com/beit-hatalmud/cheder-bht

## Architecture

```
┌─ Frontend (GitHub Pages, static) ────────────────────┐
│  index.html → ~120 packs (behavior-pack-N.js)        │
│  api.js (local cache + sync engine)                  │
│  schema.js (single source of truth for fields)       │
│  theme.css (design tokens)                           │
└──────────────┬───────────────────────────────────────┘
               │
               │ POST/GET to Apps Script
               ▼
┌─ Backend (Google Apps Script) ────────────────────────┐
│  Webhook URL: AKfycb...                              │
│  Token: BHT_AGENT_2026                               │
│  Instance: bht                                       │
│  Tabs: תלמידים, מעקב_התנהגות, משתמשים, etc          │
└──────────────────────────────────────────────────────┘
```

## Coding Standards

### JavaScript

✅ DO:
- Use `const` for never-reassigned, `let` for everything else
- Use `===` and `!==` (strict equality)
- Wrap async ops: `try { await api(...) } catch (e) { /* handle */ }`
- Use `window.safeParse(str, fallback)` instead of raw `JSON.parse`
- Use `window.byId(id)` instead of `document.getElementById` when you need null safety
- Use `window.escHtml(s)` before inserting user content via `innerHTML`
- Use behavior-pack pattern: IIFE + `console.warn('%c{name}', '...')` for init log

❌ DON'T:
- Use `var` (causes hoisting bugs)
- Use `==` (causes type coercion bugs)
- Raw `JSON.parse(...)` outside `try`
- `innerHTML +=` in loops (causes browser reflow on each iteration)
- Inline `style.cssText` (use `.bht-*` classes from theme.css)
- `console.log` for permanent code (use `console.warn` for important info)

### Pack Structure

New behavior packs MUST follow this pattern:

```javascript
// behavior-pack-NNN.js — Short description. YYYY-MM-DD
(function () {
  'use strict';

  // Implementation here

  console.warn('%cPack-NNN — Description', 'color:#xxx;font-weight:bold');
})();
```

Then register in `index.html` before `</body>`:
```html
<script src="js/behavior-pack-NNN.js?v=YYYYMMDDa"></script>
```

### Schema-Driven Development

When adding new sheet fields, ALWAYS update `js/schema.js` first:
```javascript
SCHEMAS.students.fields.push({ name: 'newField', type: Field.TEXT, required: false });
```

Then use the schema for forms/validation:
```javascript
const result = window.BHT_SCHEMA.validateRecord('students', formData);
if (!result.valid) showErrors(result.errors);
```

### CSS

Use design tokens from `theme.css`:
```css
.my-class {
  background: var(--bht-primary);
  padding: var(--bht-space-3);
  border-radius: var(--bht-radius-md);
  box-shadow: var(--bht-shadow-md);
}
```

### Error Handling

All async functions follow this pattern:

```javascript
async function doSomething() {
  try {
    const r = await api('actionName', [args]);
    if (r && r.ok) {
      window.toast('הצליח', 'success');
    } else {
      window.toast(r?.error || 'שגיאה', 'error');
    }
  } catch (e) {
    console.warn('doSomething failed:', e);
    window.toast('שגיאת רשת. נסה שוב.', 'error');
  }
}
```

## File Organization

```
cheder-bht/
├── index.html              # Main entry + script loader
├── api.js                  # Core API + data cache + sync
├── app.js                  # Router + auth + page transitions
├── css/
│   ├── main.css            # Layout + Bootstrap overrides
│   ├── theme.css           # Design tokens (CSS vars)
│   └── *.css               # Feature-specific
├── js/
│   ├── schema.js           # Central schema (use first!)
│   ├── students.js         # Student page logic
│   ├── behavior-pack-*.js  # Incremental feature packs (120+)
│   └── *.js                # Feature modules
└── AUDIT_200_ISSUES.txt    # Production hardening status
```

## Adding New Features

1. **Check schema** — Does it need new fields? Update `js/schema.js`.
2. **Pick a pack number** — Find the latest `behavior-pack-N.js`, use N+1.
3. **Write the pack** following the IIFE pattern above.
4. **Add `<script>` tag** in `index.html` before `</body>`.
5. **Test** in a fresh incognito browser tab.
6. **Commit** with descriptive message: `Pack-N: short description`.
7. **Push** — GitHub Pages auto-deploys in 30-60s.

## Production Checklist

Before considering a feature done:

- [ ] All `await` calls wrapped in `try/catch`
- [ ] User-visible errors use `toast()` not `alert()`
- [ ] No `console.log` for normal flow (only `console.warn` for init/errors)
- [ ] All DOM queries handle missing elements (`document.getElementById(...)?.value`)
- [ ] User input escaped with `escHtml()` before `innerHTML`
- [ ] Mobile tested (responsive at 375px width)
- [ ] Schema updated if new fields added
- [ ] No new `var` or `==` (use `const`/`let`, `===`)
- [ ] No inline `style.cssText` (use `.bht-*` classes or CSS vars)

## Common Tools (Console)

```javascript
auditCodeQuality()      // Run code quality audit
viewErrorLog()          // Ctrl+Shift+L
diagFull()              // Full diagnostic dump
cameraStatus()          // Camera connection state
tlaStatus()             // TLA data coverage
bhtPrefs.all()          // User preferences
toggleCompactMode()     // Compact UI mode
bumpFont(0.1)           // Font size +10%
```

## Backend (Apps Script)

The Apps Script webhook at `AKfycb...` handles all data operations:
- `cheder_listRows(tab)` — read all rows
- `cheder_appendRow(tab, row)` — add new row
- `cheder_updateRow(tab, row, matchKey, matchValue)` — update
- `cheder_deleteRow(tab, matchKey, matchValue)` — delete
- `authenticate(username, password)` — login
- `addBehavior`, `updateStudent`, etc. — typed shortcuts

⚠️ Apps Script ignores **unknown columns** — always check schema.js before adding new fields to the Sheet.

## Performance Targets

| Metric | Target | Current |
|---|---|---|
| Initial load | < 3s | ~2s |
| TTI (Time to interactive) | < 5s | ~3s |
| Memory (after 30min) | < 150MB | ~100MB |
| API response | < 800ms | ~400ms |

Run `auditCodeQuality()` in console to check current state.

## Security

- Tokens stored in client (`api.js`) — acceptable for yeshiva-internal use
- For commercial deployment: migrate auth to server-side (Cloud Functions + HttpOnly cookies)
- CSP active: `default-src 'self' + cdn.jsdelivr.net + cdnjs.cloudflare.com + googleapis.com`
- Rate-limit login client-side (5/5min) via pack-116

See `AUDIT_200_ISSUES.txt` for full security status.

## Contact

- Maintainer: Yosef Schneider (יוסף שניידר) — 6742853@gmail.com
- Instance: BHT (Beit HaTalmud)
