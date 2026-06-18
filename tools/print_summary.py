"""
print_summary.py — terminal-friendly 24h health summary.

Reads uptime.jsonl, computes uptime % and latency stats per service
for the last 24 hours, and prints a clean Hebrew + English table.

Usage: python tools/print_summary.py
"""
import os, json
from datetime import datetime, timedelta

LOG_DIR = os.path.join(os.environ.get('LOCALAPPDATA', '.'),
                       'cheder-bht-watchdog')
UPTIME_PATH = os.path.join(LOG_DIR, 'uptime.jsonl')


def percentile(arr, p):
    if not arr: return 0
    arr = sorted(arr)
    k = int(round((p / 100) * (len(arr) - 1)))
    return arr[k]


def fmt_ms(v):
    if v >= 1000: return f'{v/1000:.1f}s'
    return f'{v}ms'


def main():
    if not os.path.exists(UPTIME_PATH):
        print('  no uptime.jsonl yet — run BHT_UptimeCollect first.')
        return
    cutoff = datetime.now() - timedelta(hours=24)
    entries = []
    with open(UPTIME_PATH, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try:
                e = json.loads(line)
                ts = datetime.fromisoformat(e['at'])
            except Exception:
                continue
            if ts < cutoff: continue
            entries.append(e)
    n = len(entries)
    print(f'== cheder-bht uptime — last 24h ({n} probes) ==')
    if not n:
        print('  no probes in window.')
        return
    services = [('login', 'Apps Script'), ('page', 'GH Pages'), ('supa', 'Supabase')]
    print(f'{"service":<14}{"uptime":>8}{"p50":>9}{"p95":>9}{"p99":>9}{"max":>9}')
    print('-' * 58)
    for key, name in services:
        ok = sum(1 for e in entries if e.get(f'{key}_ok'))
        lats = [e['latency_ms'].get(key, 0) for e in entries]
        print(f'{name:<14}{100*ok/n:>7.2f}%{fmt_ms(percentile(lats,50)):>9}'
              f'{fmt_ms(percentile(lats,95)):>9}{fmt_ms(percentile(lats,99)):>9}'
              f'{fmt_ms(max(lats)):>9}')
    # Recent failure timeline
    fails = [e for e in entries if not (e.get('login_ok') and e.get('page_ok') and e.get('supa_ok'))]
    if fails:
        print(f'\n  recent failures ({len(fails)}):')
        for e in fails[-5:]:
            failed = [k for k in ('login', 'page', 'supa') if not e.get(k + '_ok')]
            print(f'    {e["at"]}: {",".join(failed)}')


if __name__ == '__main__':
    main()
