"""
Daily backup: Supabase + the existing BHT Google Sheets → Google Drive.

Runs nightly via Scheduled Task. Produces:
  - <Drive>/Backups/cheder-bht/YYYY-MM-DD/<table>.json (one file per table)
  - <Drive>/Backups/cheder-bht/YYYY-MM-DD/all_tables.xlsx (single workbook)

The Supabase REST is the primary source; the existing Sheets (via Apps
Script proxy) are also dumped for double-redundancy. If either source
fails, the other still produces a backup.

NOTE: requires the SQL in grant_service_role.sql to have been applied
to the Supabase project before Supabase data is reachable.
"""
import os, sys, json, time, urllib.request, urllib.parse, urllib.error
from datetime import datetime

# Load Supabase REST helpers from the sibling file
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import supabase_rest

ALL_TABLES = [
    'users', 'classes', 'students', 'categories',
    'behavior_events', 'attendance',
    'tasks', 'projects', 'tests', 'medications',
    'meetings', 'conversations', 'signatures',
    'functioning_reports', 'petty_cash',
    'audit_log', 'error_log', 'permission_groups',
]

SHEETS_VIA_APPS_SCRIPT = [
    'תלמידים', 'משתמשים', 'כיתות', 'קטגוריות',
    'מעקב_התנהגות', 'נוכחות', 'מבחנים', 'כדורים',
    'אסיפות', 'שיחות', 'תפקוד', 'משימות',
]

APPS_SCRIPT_URL = (
    'https://script.google.com/macros/s/'
    'AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec'
)
AGENT_TOKEN = 'BHT_AGENT_2026'

BACKUP_ROOT = r'C:\Users\יוסף שניידר\bht_backups\cheder-bht'


def dump_supabase(out_dir):
    summary = {'source': 'supabase', 'tables': {}, 'errors': []}
    for t in ALL_TABLES:
        try:
            rows = supabase_rest.select(t, columns='*')
            path = os.path.join(out_dir, f'sb_{t}.json')
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(rows, f, ensure_ascii=False, indent=1)
            summary['tables'][t] = len(rows)
        except supabase_rest.SupabaseError as e:
            summary['errors'].append(f'{t}: {e}')
            summary['tables'][t] = None
    return summary


def dump_sheets(out_dir):
    summary = {'source': 'sheets', 'tabs': {}, 'errors': []}
    for tab in SHEETS_VIA_APPS_SCRIPT:
        try:
            q = urllib.parse.urlencode({
                'action': 'cheder_listRows',
                'instance': 'bht',
                'token': AGENT_TOKEN,
                'tab': tab,
            })
            req = urllib.request.Request(APPS_SCRIPT_URL + '?' + q)
            with urllib.request.urlopen(req, timeout=30) as r:
                payload = json.loads(r.read())
            if not payload.get('ok'):
                summary['errors'].append(f'{tab}: {payload.get("error")}')
                continue
            rows = payload.get('rows', [])
            path = os.path.join(out_dir, f'sheet_{tab}.json')
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(rows, f, ensure_ascii=False, indent=1)
            summary['tabs'][tab] = len(rows)
        except Exception as e:
            summary['errors'].append(f'{tab}: {e}')
    return summary


def write_xlsx(out_dir, files):
    """Combine all JSON files into a single xlsx workbook."""
    try:
        import openpyxl
    except ImportError:
        return None
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    for fn in sorted(files):
        try:
            with open(os.path.join(out_dir, fn), encoding='utf-8') as f:
                rows = json.load(f)
        except Exception:
            continue
        if not isinstance(rows, list) or not rows:
            continue
        sheet_name = fn.replace('.json', '').replace('sheet_', '')[:31]
        try:
            ws = wb.create_sheet(sheet_name)
        except Exception:
            continue
        headers = list(rows[0].keys())
        ws.append(headers)
        for r in rows:
            ws.append([r.get(h, '') if not isinstance(r.get(h), (list, dict)) else json.dumps(r.get(h), ensure_ascii=False) for h in headers])
    xlsx_path = os.path.join(out_dir, 'all_tables.xlsx')
    wb.save(xlsx_path)
    return xlsx_path


def main():
    ts = datetime.now().strftime('%Y-%m-%d')
    out_dir = os.path.join(BACKUP_ROOT, ts)
    os.makedirs(out_dir, exist_ok=True)
    log = {'started_at': datetime.now().isoformat(), 'out_dir': out_dir}

    log['supabase'] = dump_supabase(out_dir)
    log['sheets'] = dump_sheets(out_dir)

    files = [f for f in os.listdir(out_dir) if f.endswith('.json')]
    xlsx = write_xlsx(out_dir, files)
    if xlsx:
        log['xlsx'] = xlsx

    log['ended_at'] = datetime.now().isoformat()
    log['files_count'] = len(files)

    with open(os.path.join(out_dir, '_run.log.json'), 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

    print(json.dumps({
        'date': ts,
        'supabase_tables': sum(1 for v in log['supabase']['tables'].values() if v),
        'sheets_tabs': len(log['sheets'].get('tabs', {})),
        'errors': len(log['supabase']['errors']) + len(log['sheets']['errors']),
        'files': len(files),
        'out_dir': out_dir,
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
