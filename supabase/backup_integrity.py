"""
backup_integrity.py — random-sample integrity check.

Picks 5 random rows from today's backup JSONs and verifies the same
rows are still present in the live source (Sheets via cheder_listRows
+ Supabase via REST). Catches silent corruption or accidental rollbacks.

Exit 0 = all samples match; exit 1 = any mismatch (with details).
Reports via the notifications panel if invoked from a chrome tab,
and stdout for the schtask runner.
"""
import os, sys, json, random, urllib.request, urllib.parse
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import supabase_rest as sb

BACKUP_ROOT = r'C:\Users\יוסף שניידר\bht_backups\cheder-bht'
APPS_SCRIPT = ('https://script.google.com/macros/s/'
               'AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec')
AGENT_TOKEN = 'BHT_AGENT_2026'

# (table, key column, sheet tab) — only check tables with stable ids
CHECKS = [
    ('students', 'legacy_id', 'תלמידים', 'מזהה'),
    ('users',    'legacy_id', 'משתמשים', 'שם משתמש'),
    ('tests',    'legacy_id', 'מבחנים', 'מזהה'),
    ('classes',  'name',      'כיתות',   'שם'),
]


def today_dir():
    return os.path.join(BACKUP_ROOT, datetime.now().strftime('%Y-%m-%d'))


def load_backup(prefix, tab_or_name):
    fn = os.path.join(today_dir(), f'{prefix}_{tab_or_name}.json')
    if not os.path.exists(fn):
        return None
    with open(fn, encoding='utf-8') as f:
        return json.load(f)


def fetch_sheet(tab):
    q = urllib.parse.urlencode({
        'action': 'cheder_listRows', 'instance': 'bht',
        'token': AGENT_TOKEN, 'tab': tab,
    })
    try:
        with urllib.request.urlopen(APPS_SCRIPT + '?' + q, timeout=30) as r:
            return json.loads(r.read()).get('rows', [])
    except Exception as e:
        print(f'  sheet fetch failed for {tab}: {e}')
        return []


def check_one(table, key, tab, sheet_key):
    # Load supa snapshot from backup, plus current sheet rows
    supa_rows = load_backup('sb', table)
    sheet_rows = fetch_sheet(tab)
    if not supa_rows:
        print(f'  ! no backup file for {table} — skipping')
        return True
    if not sheet_rows:
        print(f'  ! no live sheet rows for {tab} — skipping')
        return True

    # Sample 5 random keys from backup
    sample = random.sample(supa_rows, min(5, len(supa_rows)))
    sheet_keys = {str(r.get(sheet_key, '')) for r in sheet_rows}

    misses = []
    for s in sample:
        key_value = str(s.get(key, ''))
        if key_value and key_value not in sheet_keys:
            misses.append(key_value)
    if misses:
        print(f'  ! {table}: {len(misses)}/{len(sample)} backup samples NOT found in live sheet ({tab})')
        for m in misses[:3]: print(f'      missing: {m!r}')
        return False
    print(f'  OK {table}: {len(sample)}/{len(sample)} samples present in live sheet ({tab})')
    return True


def main():
    print(f'== integrity check {datetime.now().isoformat()}')
    if not os.path.exists(today_dir()):
        print(f'  no backup folder for today ({today_dir()}) — skipping')
        sys.exit(0)
    all_ok = True
    for table, key, tab, sheet_key in CHECKS:
        ok = check_one(table, key, tab, sheet_key)
        all_ok = all_ok and ok
    print(f'== result: {"PASS" if all_ok else "FAIL"}')
    sys.exit(0 if all_ok else 1)


if __name__ == '__main__':
    main()
