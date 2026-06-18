"""
uptime_collector.py — records every health probe to a JSONL timeline.

Runs every 5 minutes via Scheduled Task (BHT_UptimeCollect). Writes
one line per probe into %LOCALAPPDATA%\\cheder-bht-watchdog\\uptime.jsonl
so we can graph availability later.

Each line:
  {"at": "ISO8601", "login_ok": true, "page_ok": true, "supa_ok": true,
   "latency_ms": {"login": 612, "page": 134, "supa": 89}}
"""
import os, json, time, urllib.request, urllib.parse, urllib.error
from datetime import datetime

EXEC_URL = (
    'https://script.google.com/macros/s/'
    'AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec'
)
GH_PAGES = 'https://beit-hatalmud.github.io/cheder-bht/'
SUPA_URL = 'https://iythgizaqjivxtgwyexj.supabase.co/rest/v1/users?select=id&limit=1'

LOG_DIR = os.path.join(os.environ.get('LOCALAPPDATA', '.'), 'cheder-bht-watchdog')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_PATH = os.path.join(LOG_DIR, 'uptime.jsonl')


def time_call(fn):
    t0 = time.time()
    try:
        ok = fn()
    except Exception:
        ok = False
    return ok, int((time.time() - t0) * 1000)


def probe_login():
    params = urllib.parse.urlencode({
        'action': 'login', 'instance': 'bht', 'token': 'BHT_AGENT_2026',
        'username': 'ירושלמי', 'password': '1234',
    })
    try:
        with urllib.request.urlopen(EXEC_URL + '?' + params, timeout=12) as r:
            data = json.loads(r.read())
        return bool(data.get('ok'))
    except Exception:
        return False


def probe_page():
    try:
        with urllib.request.urlopen(GH_PAGES + '?cb=' + str(int(time.time())), timeout=10) as r:
            # 200 + any html body
            return r.status == 200 and len(r.read(2048)) > 100
    except Exception:
        return False


def probe_supa():
    # Load secret from gitignored credentials.env (best-effort)
    here = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(here, '..', 'supabase', 'secrets', 'credentials.env')
    secret = None
    try:
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                if line.startswith('SUPABASE_SECRET_KEY='):
                    secret = line.split('=', 1)[1].strip()
                    break
    except FileNotFoundError:
        return False
    if not secret:
        return False
    req = urllib.request.Request(SUPA_URL, headers={
        'apikey': secret, 'Authorization': f'Bearer {secret}',
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False


def main():
    login_ok, t_login = time_call(probe_login)
    page_ok, t_page = time_call(probe_page)
    supa_ok, t_supa = time_call(probe_supa)
    entry = {
        'at': datetime.now().isoformat(timespec='seconds'),
        'login_ok': login_ok,
        'page_ok': page_ok,
        'supa_ok': supa_ok,
        'latency_ms': {'login': t_login, 'page': t_page, 'supa': t_supa},
    }
    with open(LOG_PATH, 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    print(json.dumps(entry, ensure_ascii=False))


if __name__ == '__main__':
    main()
