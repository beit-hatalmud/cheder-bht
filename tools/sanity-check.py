#!/usr/bin/env python
"""tools/sanity-check.py — end-to-end backend sanity (no browser).
Verifies AuthV2 + CRUD via direct POST to the live webhook. Safe: creates +
deletes a throwaway test user. Independent of headless-browser environment.

Usage:  python tools/sanity-check.py
Exit code: 0 if all PASS, 1 on any failure.
"""
import json, urllib.request, urllib.parse, sys, io, time

try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception: pass

WEBHOOK = "https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec"
PASSES = 0
FAILS = []

def post(p):
    body = urllib.parse.urlencode(p, encoding='utf-8').encode('utf-8')
    req = urllib.request.Request(WEBHOOK, data=body, headers={'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'})
    with urllib.request.urlopen(req, timeout=25) as r: return json.load(r)

def expect(name, cond, detail=''):
    global PASSES, FAILS
    if cond: PASSES += 1; print(f'  ✓ {name}')
    else:    FAILS.append(name); print(f'  ✗ {name}  {detail}')

print('=== AuthV2 ===')
t0 = time.time()
r = post({'action': 'login', 'username': 'admin', 'password': '1234', 'instance': 'bht'})
expect(f'admin login (ok=true) [{round((time.time()-t0)*1000)}ms]', r.get('ok') is True)
expect('admin login returns JWT', bool(r.get('session')) and r.get('session','').count('.') == 1)
expect('admin role = מנהל', r.get('role') == 'מנהל')
admin_sess = r.get('session', '')

r = post({'action': 'login', 'username': 'admin', 'password': 'WRONG_PWD_XYZ', 'instance': 'bht'})
expect('admin wrong password rejected', r.get('ok') is False and 'invalid credentials' in (r.get('error') or '').lower())

print('\n=== Staff rescue (legacy plain → 1234) ===')
r = post({'action': 'cheder_listRows', 'token': 'BHT_AGENT_2026', 'instance': 'bht', 'tab': 'משתמשים'})
plain_users = [u['שם משתמש'] for u in r.get('rows', []) if u.get('שם משתמש') and u.get('שם משתמש') != 'admin'
               and u.get('תפקיד') != 'מנהל' and u.get('סיסמה') and not str(u.get('סיסמה')).startswith('sha256:')]
if plain_users:
    test_staff = plain_users[0]
    r = post({'action': 'login', 'username': test_staff, 'password': '1234', 'instance': 'bht'})
    expect(f'plain-staff /1234 rescue ({test_staff})', r.get('ok') is True)
else:
    print('  (no plain-staff users to test rescue against)')

print('\n=== Admin endpoints (with JWT) ===')
r = post({'action': 'getUsersSafe', 'session': admin_sess, 'instance': 'bht'})
expect('getUsersSafe (admin) returns users', r.get('ok') is True and isinstance(r.get('users'), list))
if r.get('ok'):
    has_pwd_col = any('סיסמה' in (u or {}) for u in r.get('users', []))
    expect('getUsersSafe omits password column', not has_pwd_col)

print('\n=== CRUD (throwaway user) ===')
THROW = f'sanity_{int(time.time())}'
r = post({'action': 'createUser', 'session': admin_sess, 'instance': 'bht',
          'username': THROW, 'password': 'TempPwd_1234', 'role': 'צוות', 'permissions': 'students'})
expect('createUser', r.get('ok') is True)

r = post({'action': 'login', 'username': THROW, 'password': 'TempPwd_1234', 'instance': 'bht'})
expect('new user can log in', r.get('ok') is True and r.get('role') == 'צוות')
new_sess = r.get('session', '')

r = post({'action': 'updateUserPartial', 'session': admin_sess, 'instance': 'bht',
          'username': THROW, 'הרשאות': 'students,behavior'})
expect('updateUserPartial (no password change)', r.get('ok') is True)

r = post({'action': 'login', 'username': THROW, 'password': 'TempPwd_1234', 'instance': 'bht'})
expect('password preserved after partial update', r.get('ok') is True and 'behavior' in (r.get('permissions') or ''))

r = post({'action': 'updateUserPartial', 'session': admin_sess, 'instance': 'bht',
          'username': THROW, 'newPassword': 'NewPwd_5678'})
expect('password rotation', r.get('ok') is True)

r = post({'action': 'login', 'username': THROW, 'password': 'TempPwd_1234', 'instance': 'bht'})
expect('old password rejected after rotation', r.get('ok') is False)

r = post({'action': 'login', 'username': THROW, 'password': 'NewPwd_5678', 'instance': 'bht'})
expect('new password accepted', r.get('ok') is True)

r = post({'action': 'deleteUser', 'session': admin_sess, 'instance': 'bht', 'username': 'admin'})
expect('cannot delete admin (guard)', r.get('ok') is False)

r = post({'action': 'deleteUser', 'session': admin_sess, 'instance': 'bht', 'username': THROW})
expect('deleteUser cleanup', r.get('ok') is True)

r = post({'action': 'login', 'username': THROW, 'password': 'NewPwd_5678', 'instance': 'bht'})
expect('deleted user cannot log in', r.get('ok') is False)

print(f'\n=== SUMMARY ===  PASS={PASSES}  FAIL={len(FAILS)}')
if FAILS:
    for n in FAILS: print(f'  failed: {n}')
    sys.exit(1)
print('ALL GREEN')
sys.exit(0)
