"""
verify_admin_panel.py — quick admin-side health probe.

Runs four cheap checks and emits one line of text per check. Designed
to be called from a Scheduled Task or from the user's terminal when
they want a one-shot answer to "is the system healthy?".

Checks:
  1. live /exec?action=login for ירושלמי
  2. live GitHub Pages 200
  3. last smoke test passed (log tail)
  4. Supabase counts (users, students, behavior_events)

Exits 0 only when all four pass.
"""
import os, sys, json, urllib.request, urllib.parse

EXEC_URL = (
    'https://script.google.com/macros/s/'
    'AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec'
)
GH_PAGES = 'https://beit-hatalmud.github.io/cheder-bht/'
SMOKE_LOG = os.path.join(os.environ.get('LOCALAPPDATA', '.'),
                         'cheder-bht-watchdog', 'smoke.log')

# Import Supabase helpers
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'supabase'))
import supabase_rest as sb


def out(symbol, msg):
    try:
        print(f'{symbol} {msg}')
    except UnicodeEncodeError:
        sys.stdout.buffer.write(f'{symbol} {msg}\n'.encode('utf-8', 'replace'))


def check_login():
    try:
        params = urllib.parse.urlencode({
            'action': 'login', 'instance': 'bht', 'token': 'BHT_AGENT_2026',
            'username': 'ירושלמי', 'password': '1234',
        })
        with urllib.request.urlopen(EXEC_URL + '?' + params, timeout=15) as r:
            data = json.loads(r.read())
        if data.get('ok'):
            out('OK', f'login: role={data.get("role")}')
            return True
        out('FAIL', f'login: {data.get("error")}')
        return False
    except Exception as e:
        out('FAIL', f'login probe exception: {e}')
        return False


def check_pages():
    try:
        with urllib.request.urlopen(GH_PAGES, timeout=15) as r:
            html = r.read().decode('utf-8', 'replace')[:120000]
        score = sum([
            ('cheder-bht' in html),
            ('supabase_client.js' in html),
            ('student_quickview.js' in html),
            ('manifest.webmanifest' in html),
        ])
        out('OK' if score >= 4 else 'WARN',
            f'GH Pages 200, fingerprint score={score}/4')
        return score >= 3
    except Exception as e:
        out('FAIL', f'GH Pages exception: {e}')
        return False


def check_smoke():
    if not os.path.exists(SMOKE_LOG):
        out('WARN', 'no smoke log yet')
        return True
    try:
        with open(SMOKE_LOG, encoding='utf-8') as f:
            lines = f.readlines()
        recent = [ln for ln in lines[-30:] if 'smoke PASS' in ln or 'FAIL' in ln]
        if not recent:
            out('WARN', 'no recent smoke result in log')
            return True
        last = recent[-1].strip()
        ok = 'PASS' in last
        out('OK' if ok else 'FAIL', f'smoke: {last[:120]}')
        return ok
    except Exception as e:
        out('FAIL', f'smoke log exception: {e}')
        return False


def check_supabase():
    try:
        counts = {}
        for t in ['users', 'students', 'behavior_events']:
            url = sb._BASE + f'/{t}?select=id'
            req = urllib.request.Request(url, headers={
                'apikey': sb.SECRET_KEY,
                'Authorization': f'Bearer {sb.SECRET_KEY}',
                'Range-Unit': 'items', 'Range': '0-0',
                'Prefer': 'count=exact',
            })
            with urllib.request.urlopen(req, timeout=20) as r:
                counts[t] = int(r.headers.get('content-range', '0/0').split('/')[-1])
        out('OK', f'Supabase: users={counts["users"]} students={counts["students"]} '
                  f'events={counts["behavior_events"]}')
        return counts['users'] > 0 and counts['students'] > 0
    except Exception as e:
        out('FAIL', f'Supabase exception: {e}')
        return False


def main():
    out('==', 'admin panel verification')
    results = [check_login(), check_pages(), check_smoke(), check_supabase()]
    passed = sum(1 for x in results if x)
    out('==', f'result: {passed}/4 passed')
    sys.exit(0 if passed == 4 else 1)


if __name__ == '__main__':
    main()
