"""
Migrate cheder-bht data from Google Sheet → Supabase PostgreSQL.

Reads each sheet tab via the existing Apps Script Webhook (no Sheet API needed),
then UPSERTs into Supabase tables on (legacy_id) so it's safe to re-run.

Env vars (or edit the constants below):
  SUPABASE_URL          e.g. https://xxxxx.supabase.co
  SUPABASE_SERVICE_KEY  service_role key (write access, server-side only)
  WEBHOOK_URL           Apps Script /exec URL
  AGENT_TOKEN           BHT_AGENT_2026
"""
import os, sys, json, time, urllib.parse, urllib.request

WEBHOOK_URL   = os.environ.get('WEBHOOK_URL',  'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec')
AGENT_TOKEN   = os.environ.get('AGENT_TOKEN',  'BHT_AGENT_2026')
INSTANCE      = os.environ.get('BHT_INSTANCE', 'bht')

SUPABASE_URL  = os.environ.get('SUPABASE_URL')
SERVICE_KEY   = os.environ.get('SUPABASE_SERVICE_KEY')


# ─── Sheet→Table map ────────────────────────────────────────────
# Each entry: (sheet_name, supabase_table, row_transformer)
TABS = [
    ('משתמשים',        'users',            'user_row'),
    ('כיתות',          'classes',          'class_row'),
    ('תלמידים',        'students',         'student_row'),
    ('קטגוריות',       'categories',       'category_row'),
    ('מעקב_התנהגות',   'behavior_events',  'behavior_row'),
    ('נוכחות',         'attendance',       'attendance_row'),
    ('משימות',         'tasks',            'task_row'),
    ('פרויקטים',       'projects',         'project_row'),
    ('מבחנים',         'tests',            'test_row'),
    ('כדורים',         'medications',      'medication_row'),
    ('אסיפות',         'meetings',         'meeting_row'),
    ('שיחות',          'conversations',    'conversation_row'),
    ('חתימות',         'signatures',       'signature_row'),
    ('תפקוד',          'functioning_reports','functioning_row'),
    ('קופה_קטנה',      'petty_cash',       'petty_cash_row'),
]


def http_post(url, data, headers=None):
    body = json.dumps(data).encode('utf-8') if isinstance(data, (dict, list)) else data
    req = urllib.request.Request(url, data=body, method='POST',
                                 headers={'Content-Type': 'application/json', **(headers or {})})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.getcode(), r.read().decode('utf-8')


def http_get(url, headers=None):
    req = urllib.request.Request(url, method='GET', headers=headers or {})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.getcode(), r.read().decode('utf-8')


# ─── Pull data from Sheet via Webhook ───────────────────────────
def fetch_sheet(sheet_name):
    """Pull rows from a sheet tab via cheder_listRows or similar Webhook action."""
    params = {
        'action': 'cheder_listRows',
        'instance': INSTANCE,
        'token': AGENT_TOKEN,
        'sheet': sheet_name,
    }
    url = WEBHOOK_URL + '?' + urllib.parse.urlencode(params)
    code, body = http_get(url)
    if code != 200:
        raise RuntimeError(f'GET {sheet_name} failed: {code}')
    j = json.loads(body)
    if not j.get('ok'):
        # Some Sheets actions return ok=False if endpoint name differs;
        # we'll handle in caller.
        return None
    return j.get('data') or j.get('rows') or []


# ─── Row transformers — Sheet schema → Supabase schema ──────────
def user_row(r):
    return {
      'email':       (r.get('אימייל') or r.get('שם משתמש') or '').lower().strip(),
      'full_name':   r.get('שם מלא') or r.get('שם משתמש') or '',
      'role':        r.get('תפקיד') or 'צוות',
      'permissions': r.get('הרשאות') or '',
      'active':      str(r.get('פעיל', 'true')).lower() in ('true', '1', 'כן', ''),
      'legacy_id':   str(r.get('id') or r.get('שם משתמש') or ''),
    }

def class_row(r):
    return {
      'name':      r.get('שם הכיתה') or r.get('שם') or '',
      'year':      r.get('שנה') or '',
      'is_active': True,
      'legacy_id': str(r.get('id') or r.get('שם הכיתה') or ''),
    }

def student_row(r):
    return {
      'full_name':    r.get('שם מלא') or '',
      'birthdate':    r.get('תאריך לידה') or None,
      'phone':        r.get('טלפון') or '',
      'parent_phone': r.get('טלפון הורה') or r.get('טלפון') or '',
      'parent_email': r.get('אימייל הורה') or '',
      'status':       r.get('סטטוס') or 'פעיל',
      'notes':        r.get('הערות') or '',
      'legacy_id':    str(r.get('id') or r.get('תלמיד_מזהה') or r.get('שם מלא') or ''),
    }

def category_row(r):
    return {
      'name':      r.get('שם') or r.get('קטגוריה') or '',
      'kind':      r.get('סוג') or 'התנהגות',
      'weight':    int(r.get('ניקוד', 0) or 0),
      'color':     r.get('צבע') or '#6b7280',
      'is_active': True,
      'legacy_id': str(r.get('id') or r.get('שם') or ''),
    }

def behavior_row(r):
    return {
      'occurred_at': r.get('תאריך') or r.get('זמן') or None,
      'description': r.get('תיאור') or r.get('הערות') or '',
      'score_delta': int(r.get('ניקוד', 0) or 0),
      'legacy_id':   str(r.get('id') or '') ,
      '_legacy_student': r.get('תלמיד') or r.get('תלמיד_מזהה') or '',
      '_legacy_category': r.get('קטגוריה') or '',
    }

def attendance_row(r):
    return {
      'on_date':  r.get('תאריך') or None,
      'status':   r.get('סטטוס') or 'נוכח',
      'notes':    r.get('הערות') or '',
      'legacy_id': str(r.get('id') or ''),
      '_legacy_student': r.get('תלמיד') or '',
    }

def task_row(r):
    return {
      'title':       r.get('כותרת') or r.get('משימה') or '',
      'description': r.get('תיאור') or '',
      'status':      r.get('סטטוס') or 'pending',
      'priority':    int(r.get('עדיפות', 2) or 2),
      'due_date':    r.get('יעד') or None,
      'legacy_id':   str(r.get('id') or ''),
    }

def project_row(r):
    return {
      'title':       r.get('כותרת') or r.get('שם') or '',
      'description': r.get('תיאור') or '',
      'start_date':  r.get('תאריך התחלה') or None,
      'end_date':    r.get('תאריך סיום') or None,
      'status':      r.get('סטטוס') or 'active',
      'legacy_id':   str(r.get('id') or ''),
    }

def test_row(r):
    return {
      'subject':   r.get('מקצוע') or '',
      'test_date': r.get('תאריך') or None,
      'score':     float(r.get('ציון', 0) or 0),
      'max_score': float(r.get('מקסימום', 100) or 100),
      'notes':     r.get('הערות') or '',
      'legacy_id': str(r.get('id') or ''),
    }

def medication_row(r):
    return {
      'name':       r.get('שם תרופה') or '',
      'dose':       r.get('מינון') or '',
      'frequency':  r.get('תדירות') or '',
      'start_date': r.get('התחלה') or None,
      'end_date':   r.get('סיום') or None,
      'notes':      r.get('הערות') or '',
      'legacy_id':  str(r.get('id') or ''),
    }

def meeting_row(r):
    return {
      'meeting_date': r.get('תאריך') or None,
      'attendees':    (r.get('משתתפים') or '').split(','),
      'notes':        r.get('הערות') or r.get('סיכום') or '',
      'next_steps':   r.get('המשך') or '',
      'legacy_id':    str(r.get('id') or ''),
    }

def conversation_row(r):
    return {
      'participant':  r.get('עם') or '',
      'on_date':      r.get('תאריך') or None,
      'duration_min': int(r.get('משך', 0) or 0),
      'summary':      r.get('סיכום') or r.get('הערות') or '',
      'legacy_id':    str(r.get('id') or ''),
    }

def signature_row(r):
    return {
      'kind':         r.get('סוג') or '',
      'signed_at':    r.get('תאריך') or None,
      'signed_by':    r.get('חתום על ידי') or '',
      'document_url': r.get('קישור') or '',
      'legacy_id':    str(r.get('id') or ''),
    }

def functioning_row(r):
    return {
      'period_start': r.get('מ-') or None,
      'period_end':   r.get('עד') or None,
      'scores':       {},
      'comments':     r.get('הערות') or '',
      'legacy_id':    str(r.get('id') or ''),
    }

def petty_cash_row(r):
    amt = float(r.get('סכום', 0) or 0)
    return {
      'on_date':     r.get('תאריך') or None,
      'amount':      abs(amt),
      'direction':   'out' if amt < 0 else 'in',
      'description': r.get('תיאור') or '',
      'legacy_id':   str(r.get('id') or ''),
    }


TRANSFORMERS = {
  'user_row': user_row, 'class_row': class_row, 'student_row': student_row,
  'category_row': category_row, 'behavior_row': behavior_row,
  'attendance_row': attendance_row, 'task_row': task_row,
  'project_row': project_row, 'test_row': test_row, 'medication_row': medication_row,
  'meeting_row': meeting_row, 'conversation_row': conversation_row,
  'signature_row': signature_row, 'functioning_row': functioning_row,
  'petty_cash_row': petty_cash_row,
}


# ─── Push to Supabase via REST ──────────────────────────────────
def upsert(table, rows):
    if not SUPABASE_URL or not SERVICE_KEY:
        print(f'  [DRY RUN] would upsert {len(rows)} rows into {table}')
        return
    url = f'{SUPABASE_URL}/rest/v1/{table}?on_conflict=legacy_id'
    headers = {
      'apikey': SERVICE_KEY,
      'Authorization': f'Bearer {SERVICE_KEY}',
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    }
    code, body = http_post(url, rows, headers=headers)
    if code >= 300:
        raise RuntimeError(f'upsert {table} failed: {code} {body[:200]}')


def main():
    print(f'Sheet → Supabase migration')
    print(f'  WEBHOOK={WEBHOOK_URL[:60]}...')
    print(f'  SUPABASE={SUPABASE_URL or "DRY RUN"}')
    summary = []
    for sheet, table, transformer_name in TABS:
        print(f'\n→ {sheet}  ⇒  {table}')
        try:
            raw = fetch_sheet(sheet)
        except Exception as e:
            print(f'  fetch failed: {e}')
            summary.append((sheet, 0, str(e)))
            continue
        if raw is None:
            print(f'  endpoint unavailable, skipping')
            summary.append((sheet, 0, 'endpoint missing'))
            continue
        if not raw:
            print(f'  empty sheet')
            summary.append((sheet, 0, 'empty'))
            continue
        transformer = TRANSFORMERS[transformer_name]
        rows = []
        for r in raw:
            try:
                row = transformer(r)
                # strip internal _legacy_* hints
                rows.append({k: v for k, v in row.items() if not k.startswith('_')})
            except Exception as e:
                print(f'  skipped row: {e}')
        try:
            upsert(table, rows)
            print(f'  upserted {len(rows)} rows')
            summary.append((sheet, len(rows), 'ok'))
        except Exception as e:
            print(f'  upsert failed: {e}')
            summary.append((sheet, 0, str(e)))
    print('\n=== summary ===')
    for sheet, n, status in summary:
        print(f'  {sheet:30s} {n:5d}  {status}')


if __name__ == '__main__':
    main()
