# Backend Refactor — Deployment Guide

**Phase 1: Authentication (Session Tokens)** — 2026-05-27
**Phase 2: Validation Mirror** — 2026-05-27

This document describes how to deploy backend phases to your Google Apps Script project.

## Phases Overview

| Phase | File | What It Does | Status |
|---|---|---|---|
| 1 | `apps-script-v2-auth.gs` | JWT sessions + password hashing + rate-limit | Ready |
| 2 | `apps-script-v2-validate.gs` | Server-side validation (mirrors `js/validate.js`) | Ready |
| 3 | (TBD) | Per-action role enforcement | Planned |
| 4 | (TBD) | IP rate-limit + abuse detection | Planned |

## Phase 2 Setup (Validation Mirror)

Add `apps-script-v2-validate.gs` as a new Script file. Then in `routeRequest_v2`:

```javascript
// Inside routeRequest_v2, before delegating to existing handlers:
const mutationActions = ['addStudent', 'updateStudent', 'addBehavior', 'updateBehavior'];
if (mutationActions.includes(action)) {
  const errResp = enforceValidation(action, e.parameter);
  if (errResp) return errResp;  // 422-like response
}
// continue with original handler
```

This ensures the same validation logic exists on both sides:
- Frontend (`js/validate.js`): UX feedback
- Backend (`apps-script-v2-validate.gs`): security enforcement



## What Changes

### Before (Current Production)
```
Client (api.js):
  const AGENT_TOKEN = 'BHT_AGENT_2026';  // EXPOSED IN BROWSER

  function api(action, args) {
    return fetch(WEBHOOK_URL, { body: 'action=...&token=' + AGENT_TOKEN });
  }
```

**Problem:** Anyone can read `view-source:` on the site and steal the token.

### After (Phase 1)
```
Client (api-v2.js):
  // No hardcoded token!

  function login(username, password) {
    return fetch(WEBHOOK_URL, { body: 'action=login&username=...&password=...' })
      .then(r => r.json())
      .then(d => {
        if (d.ok) sessionStorage.setItem('session', d.session);
      });
  }

  function api(action, args) {
    const session = sessionStorage.getItem('session');
    return fetch(WEBHOOK_URL, { body: 'action=...&session=' + session });
  }
```

**Improvement:**
- No long-lived master token in browser
- Each user has their own session token (signed JWT, 8h TTL)
- Sessions can be invalidated server-side (Phase 2)

## Deployment Steps

### Step 1: Set Script Properties

Open Apps Script editor → ⚙ Project Settings → Script Properties → Add:

| Property | Value |
|---|---|
| `AGENT_TOKEN` | `BHT_AGENT_2026` (your existing token, for legacy compat) |
| `PWD_SALT` | Generate 32 random chars (use `openssl rand -base64 32`) |
| `JWT_SECRET` | Generate 64 random chars (use `openssl rand -base64 64`) |

**Important:** These are SECRET. Don't share them.

### Step 2: Add the new code

In Apps Script editor:
1. File → New → Script file
2. Name: `auth-v2`
3. Paste contents of `apps-script-v2-auth.gs`
4. Save

### Step 3: Update your main router

In your existing `Webhook.gs` (or wherever you have `doPost`/`doGet`):

```javascript
function doPost(e) {
  // OLD:
  // return handleAction(e);

  // NEW:
  return routeRequest_v2(e);
}

function doGet(e) {
  return routeRequest_v2(e);
}
```

### Step 4: Run migration

In Apps Script editor:
1. Select `migrateLegacyPasswords` from the function dropdown
2. Click ▶ Run
3. Grant permission if prompted
4. Check the execution log — should say "migrated: N"

This converts all plaintext passwords to `sha256:HASH` format.

### Step 5: Deploy new version

Deploy → Manage deployments → Edit current → New version → Deploy.

The webhook URL stays the same. Old clients still work (legacy token still accepted).

## Testing

### Test the login flow:

```bash
# Login (no auth required)
curl -X POST "https://script.google.com/macros/s/YOUR_ID/exec" \
  -d "action=login&username=admin&password=1234"

# Expected response:
# {"ok":true,"session":"eyJ1IjoiYWRtaW4iLCJyIjoi...","role":"מנהל"}

# Use session for protected request:
curl -X POST "https://script.google.com/macros/s/YOUR_ID/exec" \
  -d "action=cheder_listRows&tab=תלמידים&session=eyJ1IjoiYWRtaW4i..."
```

### Test that legacy token still works:

```bash
# Old way - still works during transition
curl -X POST "https://script.google.com/macros/s/YOUR_ID/exec" \
  -d "action=cheder_listRows&tab=תלמידים&token=BHT_AGENT_2026"
```

## Frontend Migration

Once backend is deployed, update `js/api.js`:

```javascript
// REMOVE:
// const AGENT_TOKEN = 'BHT_AGENT_2026';

// ADD:
function getSession() {
  return sessionStorage.getItem('bht_session');
}

async function login(username, password) {
  const r = await fetch(URL, {
    method: 'POST',
    body: new URLSearchParams({ action: 'login', username, password })
  });
  const d = await r.json();
  if (d.ok) {
    sessionStorage.setItem('bht_session', d.session);
    sessionStorage.setItem('user', JSON.stringify({ username, role: d.role }));
  }
  return d;
}

// In api() calls, replace `token: AGENT_TOKEN` with:
//   session: getSession()
```

## Rollback Plan

If something goes wrong:
1. In Apps Script: Deploy → Manage deployments → Revert to previous version
2. Frontend continues using `token` parameter (legacy code in `routeRequest_v2` accepts it)

## Phases Roadmap

- **Phase 1** ✅ (this commit) — Login + sessions
- **Phase 2** — Server-side session blacklist (instant logout)
- **Phase 3** — Per-action role enforcement (admin-only mutations)
- **Phase 4** — IP rate-limit at Apps Script level

Estimated total: 12 hours (3h per phase).

## Security Audit Result

| Item | Before | After |
|---|---|---|
| AGENT_TOKEN in browser | 🔴 Exposed | 🟢 Removed (after frontend migration) |
| Password storage | 🟡 Plaintext | 🟢 SHA-256 + salt |
| Session expiry | ❌ None | 🟢 8h TTL |
| Login rate-limit | 🟡 Client-side only | 🟢 Server-side per username |
| Session invalidation | ❌ N/A | 🟡 Phase 2 (blacklist) |

## Files

- `apps-script-v2-auth.gs` — the new auth code (deploy to Google Apps Script)
- `DEPLOYMENT_GUIDE.md` — this file
- (Pending) `js/api-v2.js` — frontend migration

## Contact

If you encounter issues during deployment:
1. Check Apps Script execution log: View → Logs
2. Verify Script Properties are set
3. Test legacy token still works first
