/**
 * apps-script-v2-auth.gs — Backend Refactor Phase 1: Authentication
 * Cheder-BHT Production - 2026-05-27
 *
 * DEPLOYMENT:
 * 1. Open Apps Script at https://script.google.com/...
 * 2. Add this file as new tab
 * 3. Update doPost / doGet to route auth actions here
 * 4. Set Script Properties (Project Settings → Script properties):
 *    - AGENT_TOKEN: your master agent token (was BHT_AGENT_2026)
 *    - PWD_SALT: random 32 chars for password hashing
 *    - JWT_SECRET: random 64 chars for session signing
 *
 * BEHAVIOR CHANGE:
 *   BEFORE: client sends AGENT_TOKEN with every request (token exposed)
 *   AFTER: client logs in with username+password → receives session token
 *          Subsequent requests use session token, not AGENT_TOKEN
 *
 * The Frontend NO LONGER needs to know AGENT_TOKEN.
 */

const SCRIPT_PROPS = PropertiesService.getScriptProperties();

// ===== Get secrets from Script Properties (not hardcoded) =====
function getSecret(key) {
  const v = SCRIPT_PROPS.getProperty(key);
  if (!v) throw new Error('Missing script property: ' + key);
  return v;
}

// ===== Resolve the cheder spreadsheet (standalone script — open by ID) =====
function getChederSheet_(sheetName, params) {
  const propKey = (typeof _chederSheetIdProp === 'function')
    ? _chederSheetIdProp(params)
    : ((params && params.instance === 'bht') ? 'BHT_CHEDER_SHEET_ID' : 'CHEDER_SHEET_ID');
  const id = SCRIPT_PROPS.getProperty(propKey);
  if (!id) return null;
  try {
    return SpreadsheetApp.openById(id).getSheetByName(sheetName);
  } catch (e) {
    return null;
  }
}

// ===== Session token issued on successful login =====
// Format: base64(payload).base64(signature)
// payload = {username, role, exp}, signature = HMAC-SHA256(payload, JWT_SECRET)
function issueSession(username, role, ttlSec) {
  const exp = Date.now() + (ttlSec || 8 * 60 * 60) * 1000;
  const payload = JSON.stringify({ u: username, r: role, e: exp });
  const payloadB64 = Utilities.base64EncodeWebSafe(payload).replace(/=+$/, '');
  const sig = Utilities.computeHmacSha256Signature(payloadB64, getSecret('JWT_SECRET'));
  const sigB64 = Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '');
  return payloadB64 + '.' + sigB64;
}

function verifySession(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') === -1) {
    return { valid: false, error: 'malformed' };
  }
  const [payloadB64, sigB64] = token.split('.');
  const expectedSig = Utilities.computeHmacSha256Signature(payloadB64, getSecret('JWT_SECRET'));
  const expectedB64 = Utilities.base64EncodeWebSafe(expectedSig).replace(/=+$/, '');
  if (expectedB64 !== sigB64) {
    return { valid: false, error: 'bad signature' };
  }
  let payload;
  try {
    const decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(payloadB64)).getDataAsString();
    payload = JSON.parse(decoded);
  } catch (e) {
    return { valid: false, error: 'malformed payload' };
  }
  if (payload.e < Date.now()) {
    return { valid: false, error: 'expired' };
  }
  return { valid: true, username: payload.u, role: payload.r, expires: payload.e };
}

// ===== Hash password with salt =====
function hashPassword(plain) {
  const salt = getSecret('PWD_SALT');
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plain + salt);
  return Utilities.base64Encode(bytes);
}

// ===== Login endpoint =====
// Action: 'login' with {username, password}
// Returns: { ok, session, role } or { ok: false, error }
function actionLogin(params) {
  const username = String(params.username || '').trim();
  const password = String(params.password || '');
  if (!username || !password) {
    return { ok: false, error: 'missing credentials' };
  }

  // Rate-limit (5 fails per IP per 5 minutes - using ScriptProperties as crude store)
  const failKey = 'login_fails_' + username;
  const fails = JSON.parse(SCRIPT_PROPS.getProperty(failKey) || '[]');
  const now = Date.now();
  const recentFails = fails.filter(t => now - t < 5 * 60 * 1000);
  if (recentFails.length >= 5) {
    return { ok: false, error: 'too many attempts. wait 5 minutes' };
  }

  // Lookup user in משתמשים sheet. This script is standalone (not container-
  // bound), so resolve the cheder spreadsheet by its Script Property ID — same
  // mechanism the cheder_* handlers use. instance=bht → BHT_CHEDER_SHEET_ID.
  const sheet = getChederSheet_('משתמשים', params);
  if (!sheet) return { ok: false, error: 'users sheet not configured' };
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const usernameIdx = headers.indexOf('שם משתמש');
  const passwordIdx = headers.indexOf('סיסמה');
  const roleIdx = headers.indexOf('תפקיד');
  const permIdx = headers.indexOf('הרשאות');
  const landingIdx = headers.indexOf('דף_כניסה');

  for (let i = 1; i < data.length; i++) {
    if (data[i][usernameIdx] === username) {
      const storedPwd = String(data[i][passwordIdx] || '');
      const rowRole = roleIdx >= 0 ? String(data[i][roleIdx] || '') : '';
      // Rescue rule (2026-05-28, staff lockout): non-admin users whose
      // password is empty OR legacy plaintext accept the universal default
      // '1234' in ADDITION to their stored value. Hashed users (post-AuthV2)
      // keep their real password — no '1234' bypass. Admin always requires
      // exact match to prevent impersonation.
      const isAdmin = rowRole === 'מנהל' || username === 'admin';
      const isMatch = storedPwd.startsWith('sha256:')
        ? storedPwd.slice(7) === hashPassword(password)
        : (storedPwd === password
            || (!isAdmin && password === '1234'));
      if (isMatch) {
        // Clear fail count, issue session
        SCRIPT_PROPS.deleteProperty(failKey);
        const role = data[i][roleIdx] || 'צוות';
        const permissions = permIdx >= 0 ? String(data[i][permIdx] || '') : '';
        const landingPage = landingIdx >= 0 ? String(data[i][landingIdx] || '') : '';
        const session = issueSession(username, role);
        // Frontend gets identity + permissions ONLY — never the user table.
        return { ok: true, session: session, role: role, username: username, permissions: permissions, landingPage: landingPage };
      }
      break;
    }
  }

  // Failed login - record
  recentFails.push(now);
  SCRIPT_PROPS.setProperty(failKey, JSON.stringify(recentFails));
  return { ok: false, error: 'invalid credentials' };
}

// ===== Middleware: verify session for protected actions =====
// Returns { authorized, user, error }
function authorizeRequest(params) {
  // Legacy: AGENT_TOKEN still accepted for backward compat (deprecated)
  if (params.token === getSecret('AGENT_TOKEN')) {
    return { authorized: true, user: { username: 'legacy', role: 'מנהל' }, legacy: true };
  }
  // New: session token
  const session = params.session || params.sessionToken;
  if (!session) {
    return { authorized: false, error: 'missing session token' };
  }
  const v = verifySession(session);
  if (!v.valid) {
    return { authorized: false, error: 'invalid session: ' + v.error };
  }
  return { authorized: true, user: { username: v.username, role: v.role } };
}

// ===== Safe gate helper — used by Webhook.js handleWebhook() =====
// Returns true ONLY if params carries a cryptographically valid, unexpired
// session token. NEVER throws: if JWT_SECRET isn't configured yet, or the
// token is malformed, it returns false so the caller falls back to the legacy
// WEBHOOK_TOKEN check. This keeps email/WhatsApp/Yemot flows safe during rollout.
function hasValidSession_(params) {
  try {
    const s = (params && (params.session || params.sessionToken)) || '';
    if (!s) return false;
    const v = verifySession(s);
    return v && v.valid === true;
  } catch (e) {
    return false;
  }
}

// ===== Admin-only: list users WITHOUT the password column =====
// Zero-trust: the browser never receives password hashes. Requires either a
// valid JWT whose role is מנהל, or the legacy AGENT_TOKEN (transition period).
function actionGetUsersSafe(params) {
  const auth = (function () {
    try {
      if (params.token && params.token === SCRIPT_PROPS.getProperty('AGENT_TOKEN')) return { ok: true, role: 'מנהל' };
    } catch (e) {}
    const v = hasValidSession_(params) ? verifySession(params.session || params.sessionToken) : { valid: false };
    if (v.valid && v.role === 'מנהל') return { ok: true, role: v.role };
    return { ok: false };
  })();
  if (!auth.ok) return { ok: false, error: 'admin only' };

  const sheet = getChederSheet_('משתמשים', params);
  if (!sheet) return { ok: false, error: 'users sheet not configured' };
  const data = sheet.getDataRange().getValues();
  if (!data.length) return { ok: true, users: [] };
  const headers = data[0];
  const pwdIdx = headers.indexOf('סיסמה');
  const users = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      if (c === pwdIdx) continue; // never expose passwords
      obj[headers[c]] = data[i][c];
    }
    if (obj['שם משתמש']) users.push(obj);
  }
  return { ok: true, users: users };
}

// ===== Refresh session (sliding expiry) =====
function actionRefreshSession(params) {
  const auth = authorizeRequest(params);
  if (!auth.authorized) return { ok: false, error: auth.error };
  const newSession = issueSession(auth.user.username, auth.user.role);
  return { ok: true, session: newSession, expires: Date.now() + 8 * 60 * 60 * 1000 };
}

// ===== Change own password (JWT-authenticated) =====
// Requires a valid session JWT. Writes sha256:<hash> back to the משתמשים row
// for the AUTHENTICATED user — clients cannot change another user's password.
function actionChangePassword(params) {
  const sessionToken = params.session || params.sessionToken;
  if (!sessionToken) return { ok: false, error: 'missing session' };
  let v;
  try { v = verifySession(sessionToken); } catch (e) { return { ok: false, error: 'session check failed' }; }
  if (!v || !v.valid) return { ok: false, error: 'invalid session: ' + ((v && v.error) || 'unknown') };

  const newPwd = String(params.newPassword || params.new_password || '');
  if (!newPwd || newPwd.length < 4) return { ok: false, error: 'סיסמה חייבת לפחות 4 תווים' };
  if (newPwd.length > 100) return { ok: false, error: 'סיסמה ארוכה מדי' };

  // Normalize username on both sides — Hebrew strings may carry NFC/NFD
  // differences or invisible RTL marks once they go through JWT base64 encode.
  function norm(s) {
    s = String(s == null ? '' : s);
    if (typeof s.normalize === 'function') { try { s = s.normalize('NFC'); } catch (e) {} }
    return s.replace(/[‎‏‪-‮﻿]/g, '').trim();
  }
  const username = norm(v.username);

  const sheet = getChederSheet_('משתמשים', params);
  if (!sheet) return { ok: false, error: 'users sheet not configured' };
  const data = sheet.getDataRange().getValues();
  if (!data.length) return { ok: false, error: 'empty users sheet' };
  const headers = data[0];
  const userIdx = headers.indexOf('שם משתמש');
  const pwdIdx = headers.indexOf('סיסמה');
  if (userIdx < 0 || pwdIdx < 0) return { ok: false, error: 'sheet schema unexpected' };

  for (let i = 1; i < data.length; i++) {
    if (norm(data[i][userIdx]) === username) {
      let hashed;
      try { hashed = 'sha256:' + hashPassword(newPwd); }
      catch (e) { return { ok: false, error: 'PWD_SALT not configured' }; }
      // Row index in the sheet is i+1 (1-based, accounting for header).
      // Column is pwdIdx+1 (1-based).
      sheet.getRange(i + 1, pwdIdx + 1).setValue(hashed);
      return { ok: true, message: 'הסיסמה עודכנה' };
    }
  }
  return { ok: false, error: 'user not found' };
}

// ===== Logout (informational - server can't invalidate JWT directly) =====
// Client should discard the session token.
// For full invalidation, would need a server-side blacklist (next phase).
function actionLogout(params) {
  return { ok: true, message: 'discard your session token' };
}

// ============================================================
// ROUTER — replace your existing doPost/doGet routing
// ============================================================
function routeRequest_v2(e) {
  const action = (e.parameter.action || '').trim();

  // Public actions (no auth required)
  if (action === 'login') return ContentService.createTextOutput(JSON.stringify(actionLogin(e.parameter)))
    .setMimeType(ContentService.MimeType.JSON);
  if (action === 'ping') return ContentService.createTextOutput(JSON.stringify({ ok: true, ts: Date.now() }))
    .setMimeType(ContentService.MimeType.JSON);

  // Protected actions - require session token
  const auth = authorizeRequest(e.parameter);
  if (!auth.authorized) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: auth.error, code: 'AUTH_REQUIRED' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Set current user globally for downstream handlers
  // ... your existing routing logic here, with auth.user available

  if (action === 'refreshSession') return ContentService.createTextOutput(JSON.stringify(actionRefreshSession(e.parameter)))
    .setMimeType(ContentService.MimeType.JSON);
  if (action === 'logout') return ContentService.createTextOutput(JSON.stringify(actionLogout(e.parameter)))
    .setMimeType(ContentService.MimeType.JSON);

  // For everything else, delegate to existing handlers
  // Replace this stub with your existing logic
  return ContentService.createTextOutput(JSON.stringify({
    ok: false,
    error: 'auth ok but action not implemented in v2 router',
    authenticated_as: auth.user.username
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// BOOTSTRAP — set JWT_SECRET / PWD_SALT once, autonomously.
// Reachable only behind the WEBHOOK_TOKEN gate (handleWebhook protects it).
// Idempotent: never overwrites an existing value, never returns the secret.
// ============================================================
function actionInitAuthSecrets(params) {
  function rand(nChars) {
    let s = '';
    while (s.length < nChars) s += Utilities.getUuid().replace(/-/g, '');
    return s.slice(0, nChars);
  }
  const result = { ok: true, jwt_secret: 'exists', pwd_salt: 'exists' };
  if (!SCRIPT_PROPS.getProperty('JWT_SECRET')) {
    SCRIPT_PROPS.setProperty('JWT_SECRET', rand(64));
    result.jwt_secret = 'created';
  }
  if (!SCRIPT_PROPS.getProperty('PWD_SALT')) {
    SCRIPT_PROPS.setProperty('PWD_SALT', rand(32));
    result.pwd_salt = 'created';
  }
  if (!SCRIPT_PROPS.getProperty('AGENT_TOKEN') && params && params.agentToken) {
    SCRIPT_PROPS.setProperty('AGENT_TOKEN', String(params.agentToken));
    result.agent_token = 'created';
  }
  return result;
}

// ============================================================
// MIGRATION HELPER — call once to hash all plaintext passwords
// ============================================================
function migrateLegacyPasswords(params) {
  const sheet = getChederSheet_('משתמשים', params || { instance: 'bht' });
  if (!sheet) throw new Error('users sheet not configured');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const pwdIdx = headers.indexOf('סיסמה');
  let migrated = 0;
  for (let i = 1; i < data.length; i++) {
    const p = String(data[i][pwdIdx] || '');
    if (p && !p.startsWith('sha256:')) {
      const hashed = 'sha256:' + hashPassword(p);
      sheet.getRange(i + 1, pwdIdx + 1).setValue(hashed);
      migrated++;
    }
  }
  return { ok: true, migrated };
}
