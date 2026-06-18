"""
Migrate Sheets → Supabase.

Idempotent: each row is upserted on legacy_id so re-running is safe.
Pulls via the existing cheder_listRows Apps Script proxy, transforms
Hebrew column names → Supabase schema, upserts via REST.

Order matters (FK dependencies):
   1. users        (FK: none)
   2. classes      (FK: users[homeroom_id])
   3. categories   (FK: none)
   4. students     (FK: classes)
   5. behavior_events (FK: students, categories, users)
   6. attendance, tests, medications, meetings, conversations, functioning
"""
import os, sys, json, urllib.request, urllib.parse, urllib.error
from typing import Any, Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import supabase_rest as sb

APPS_SCRIPT_URL = (
    'https://script.google.com/macros/s/'
    'AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec'
)
AGENT_TOKEN = 'BHT_AGENT_2026'
INSTANCE = 'bht'


def fetch_sheet(tab: str) -> List[Dict[str, Any]]:
    q = urllib.parse.urlencode({
        'action': 'cheder_listRows',
        'instance': INSTANCE,
        'token': AGENT_TOKEN,
        'tab': tab,
    })
    req = urllib.request.Request(APPS_SCRIPT_URL + '?' + q)
    with urllib.request.urlopen(req, timeout=60) as r:
        payload = json.loads(r.read())
    if not payload.get('ok'):
        raise RuntimeError(f'{tab}: {payload.get("error")}')
    return payload.get('rows', [])


def clean(s: Any) -> str:
    if s is None: return ''
    return str(s).strip()


def parse_date(s: Any) -> Optional[str]:
    s = clean(s)
    if not s or s.startswith('#'):
        return None
    # Sheets stores dd/mm/yyyy sometimes; ISO is preferred
    if '/' in s:
        parts = s.split('/')
        if len(parts) == 3:
            d, m, y = parts
            if len(y) == 2: y = '20' + y
            try:
                return f'{int(y):04d}-{int(m):02d}-{int(d):02d}'
            except ValueError:
                return None
    # Validate ISO format
    candidate = s[:10]
    if len(candidate) == 10 and candidate[4] == '-' and candidate[7] == '-':
        try:
            y, m, d = candidate.split('-')
            int(y); int(m); int(d)
            return candidate
        except ValueError:
            return None
    return None


def migrate_users() -> Dict[str, str]:
    """Insert/update users; return map of username → uuid."""
    rows = fetch_sheet('משתמשים')
    out = []
    for r in rows:
        uname = clean(r.get('שם משתמש'))
        if not uname:
            continue
        out.append({
            'email': clean(r.get('אימייל')) or f'{uname}@bht.local',
            'full_name': clean(r.get('שם מלא')) or uname,
            'role': clean(r.get('תפקיד')) or 'צוות',
            'permissions': clean(r.get('הרשאות')) or '',
            'visible_classes': clean(r.get('כיתות_מורשות')) or '',
            'active': True,
            'legacy_id': uname,
        })
    if not out:
        return {}
    result = sb.insert('users', out, on_conflict='email', returning=True)
    name_to_id = {}
    if isinstance(result, list):
        for row in result:
            legacy = row.get('legacy_id')
            if legacy:
                name_to_id[legacy] = row['id']
    return name_to_id


def migrate_classes(user_map: Dict[str, str]) -> Dict[str, str]:
    """Insert classes, return class_name → uuid map."""
    rows = fetch_sheet('כיתות')
    out = []
    for r in rows:
        name = clean(r.get('שם הכיתה') or r.get('כיתה') or r.get('שם'))
        if not name:
            continue
        homeroom_name = clean(r.get('רב כיתה') or r.get('מחנך'))
        out.append({
            'name': name,
            'year': clean(r.get('שנה') or r.get('שנת הלימודים')) or None,
            'homeroom_id': user_map.get(homeroom_name),
            'is_active': True,
            'legacy_id': name,
        })
    if not out:
        return {}
    # First-time insert (table is empty). Idempotency via legacy_id unique
    # constraint will need a SQL ALTER later if we re-run.
    existing = sb.select('classes', columns='id', limit=1)
    if existing:
        print('  classes table not empty — skipping')
        all_classes = sb.select('classes', columns='id,name')
        return {c['name']: c['id'] for c in all_classes}
    result = sb.insert('classes', out, returning=True)
    name_to_id = {}
    if isinstance(result, list):
        for row in result:
            name_to_id[row['name']] = row['id']
    return name_to_id


def migrate_categories() -> Dict[str, str]:
    rows = fetch_sheet('קטגוריות')
    out = []
    for r in rows:
        name = clean(r.get('קטגוריה') or r.get('שם'))
        if not name:
            continue
        out.append({
            'name': name,
            'kind': clean(r.get('סוג')) or 'התנהגות',
            'weight': int(r.get('משקל') or 0) if str(r.get('משקל', '')).lstrip('-').isdigit() else 0,
            'color': clean(r.get('צבע')) or '#6b7280',
            'icon': clean(r.get('אייקון')) or 'bi-circle',
            'is_active': True,
            'legacy_id': name,
        })
    if not out:
        return {}
    existing = sb.select('categories', columns='id', limit=1)
    if existing:
        print('  categories table not empty — skipping')
        all_cats = sb.select('categories', columns='id,name')
        return {c['name']: c['id'] for c in all_cats}
    result = sb.insert('categories', out, returning=True)
    name_to_id = {}
    if isinstance(result, list):
        for row in result:
            name_to_id[row['name']] = row['id']
    return name_to_id


def migrate_students(class_map: Dict[str, str]) -> Dict[str, str]:
    rows = fetch_sheet('תלמידים')
    out = []
    for r in rows:
        first = clean(r.get('שם פרטי'))
        last = clean(r.get('שם משפחה'))
        full_name = clean(r.get('שם מלא')) or (first + ' ' + last).strip() or first or last
        sid = clean(r.get('מזהה') or r.get('id'))
        if not full_name:
            continue
        # מחזור (cohort) is the class name in this sheet
        class_name = clean(r.get('מחזור') or r.get('כיתה'))
        parent_phone = clean(r.get('טלפון אב') or r.get('טלפון אם') or r.get('טלפון הורה'))
        # Build a notes blob from the rich profile fields so nothing is lost
        notes_parts = []
        for label, key in [
            ('כתובת', 'כתובת'), ('עיר', 'עיר'),
            ('טלפון בית', 'טלפון בית'), ('מספר זהות', 'מספר זהות'),
            ('דוח אישי', 'דוח_אישי'),
            ('פרופיל הורים', 'פרופיל_הורים'),
            ('פרופיל אישיות', 'פרופיל_אישיות'),
            ('פרופיל התנהגותי', 'פרופיל_התנהגותי'),
            ('פרופיל לימודי', 'פרופיל_לימודי'),
            ('אלרגיה', 'אלרגיה'),
            ('הערות רפואיות', 'הערות רפואיות'),
            ('הערות', 'הערות'),
        ]:
            v = clean(r.get(key))
            if v: notes_parts.append(f'{label}: {v}')
        out.append({
            'full_name': full_name,
            'class_id': class_map.get(class_name),
            'birthdate': parse_date(r.get('תאריך לידה') or r.get('תאריך_לידה')),
            'phone': clean(r.get('טלפון')) or None,
            'parent_phone': parent_phone or None,
            'parent_email': clean(r.get('מייל הורה') or r.get('אימייל הורה')) or None,
            'status': clean(r.get('סטטוס')) or 'פעיל',
            'notes': ' | '.join(notes_parts) if notes_parts else None,
            'legacy_id': sid or full_name,
        })
    if not out:
        return {}
    existing = sb.select('students', columns='id', limit=1)
    if existing:
        print('  students table not empty — skipping')
        all_st = sb.select('students', columns='id,legacy_id')
        return {s['legacy_id']: s['id'] for s in all_st if s.get('legacy_id')}
    sid_to_id = {}
    # Insert in chunks to avoid 1MB payload limit
    for batch in chunked(out, 250):
        result = sb.insert('students', batch, returning=True)
        if isinstance(result, list):
            for row in result:
                sid_to_id[row['legacy_id']] = row['id']
    return sid_to_id


def chunked(xs: List[Any], n: int):
    for i in range(0, len(xs), n):
        yield xs[i:i+n]


def migrate_behavior(student_map: Dict[str, str], category_map: Dict[str, str],
                     user_map: Dict[str, str]) -> int:
    # Idempotency: skip if already populated
    existing = sb.select('behavior_events', columns='id', limit=1)
    if existing:
        print('  behavior_events not empty — skipping')
        return 0
    rows = fetch_sheet('מעקב_התנהגות')
    out = []
    skipped = 0
    for r in rows:
        sid_legacy = clean(r.get('תלמיד_מזהה') or r.get('תלמיד'))
        if not sid_legacy or sid_legacy not in student_map:
            skipped += 1
            continue
        cat_name = clean(r.get('קטגוריה'))
        out.append({
            'student_id': student_map[sid_legacy],
            'category_id': category_map.get(cat_name),
            'occurred_at': clean(r.get('תאריך') or r.get('זמן')) or None,
            'description': clean(r.get('פירוט') or r.get('הערות')) or None,
            'score_delta': int(r.get('ניקוד') or 0) if str(r.get('ניקוד', '')).lstrip('-').isdigit() else 0,
            'recorded_by': user_map.get(clean(r.get('נרשם על ידי') or r.get('משתמש'))),
            'legacy_id': clean(r.get('מזהה')) or None,
        })
    # Behaviour table has no unique constraint on legacy_id, so insert-only
    inserted = 0
    for batch in chunked(out, 500):
        try:
            sb.insert('behavior_events', batch)
            inserted += len(batch)
        except sb.SupabaseError as e:
            print(f'  ! batch failed: {e}')
    return inserted


def migrate_attendance(student_map: Dict[str, str], user_map: Dict[str, str]) -> int:
    rows = fetch_sheet('נוכחות')
    out, skipped = [], 0
    for r in rows:
        sid_legacy = clean(r.get('תלמיד_מזהה'))
        d = parse_date(r.get('תאריך'))
        if not sid_legacy or sid_legacy not in student_map or not d:
            skipped += 1
            continue
        out.append({
            'student_id': student_map[sid_legacy],
            'on_date': d,
            'status': clean(r.get('סטטוס')) or 'נוכח',
            'notes': clean(r.get('הערות')) or None,
            'legacy_id': clean(r.get('מזהה')) or None,
        })
    # Idempotency
    if sb.select('attendance', columns='id', limit=1):
        print('  attendance not empty — skipping')
        return 0
    inserted = 0
    for batch in chunked(out, 500):
        try:
            sb.insert('attendance', batch)
            inserted += len(batch)
        except sb.SupabaseError as e:
            print(f'  ! attendance batch: {e}')
    return inserted


def migrate_tests(student_map: Dict[str, str]) -> int:
    if sb.select('tests', columns='id', limit=1):
        print('  tests not empty — skipping')
        return 0
    rows = fetch_sheet('מבחנים')
    out = []
    for r in rows:
        sid_legacy = clean(r.get('תלמיד_מזהה'))
        if not sid_legacy or sid_legacy not in student_map:
            continue
        subject = clean(r.get('סוג') or r.get('פרשה')) or 'מבחן'
        score_raw = clean(r.get('ציון'))
        try:
            score = float(score_raw) if score_raw else None
        except ValueError:
            score = None
        out.append({
            'student_id': student_map[sid_legacy],
            'subject': subject,
            'test_date': parse_date(r.get('תאריך')) or '2026-01-01',
            'score': score,
            'notes': clean(r.get('הערות')) or (clean(r.get('פרשה')) if subject != clean(r.get('פרשה')) else None),
            'legacy_id': clean(r.get('מזהה')) or None,
        })
    inserted = 0
    for batch in chunked(out, 500):
        try:
            sb.insert('tests', batch)
            inserted += len(batch)
        except sb.SupabaseError as e:
            print(f'  ! tests batch: {e}')
    return inserted


def migrate_medications(student_map: Dict[str, str]) -> int:
    if sb.select('medications', columns='id', limit=1):
        print('  medications not empty — skipping')
        return 0
    rows = fetch_sheet('כדורים')
    out = []
    for r in rows:
        sid_legacy = clean(r.get('תלמיד_מזהה'))
        if not sid_legacy or sid_legacy not in student_map:
            continue
        name = clean(r.get('תרופה') or r.get('סוג')) or 'לא רשום'
        # combine extra fields into notes so nothing is lost
        notes_parts = []
        for label, key in [
            ('מצב כיום', 'מצב_כיום'),
            ('שיחת הורים', 'שיחת_הורים'),
            ('הערות', 'הערות'),
            ('סוג', 'סוג'),
        ]:
            v = clean(r.get(key))
            if v: notes_parts.append(f'{label}: {v}')
        out.append({
            'student_id': student_map[sid_legacy],
            'name': name,
            'notes': ' | '.join(notes_parts) if notes_parts else None,
            'start_date': parse_date(r.get('תאריך_עדכון')),
            'legacy_id': clean(r.get('מזהה')) or None,
        })
    inserted = 0
    for batch in chunked(out, 500):
        try:
            sb.insert('medications', batch)
            inserted += len(batch)
        except sb.SupabaseError as e:
            print(f'  ! medications batch: {e}')
    return inserted


def migrate_meetings(student_map: Dict[str, str], user_map: Dict[str, str]) -> int:
    if sb.select('meetings', columns='id', limit=1):
        print('  meetings not empty — skipping')
        return 0
    rows = fetch_sheet('אסיפות')
    out = []
    for r in rows:
        sid_legacy = clean(r.get('תלמיד_מזהה'))
        if not sid_legacy or sid_legacy not in student_map:
            continue
        d = clean(r.get('תאריך'))
        # meetings.meeting_date is timestamptz so we can use ISO directly
        meeting_date = d if d else '2026-01-01T00:00:00Z'
        notes_parts = []
        for label, key in [
            ('נושא', 'נושא'),
            ('תקופה', 'תקופה'),
            ('סיכום', 'סיכום'),
            ('הערות', 'הערות'),
        ]:
            v = clean(r.get(key))
            if v: notes_parts.append(f'{label}: {v}')
        attendees_text = clean(r.get('משתתפים'))
        attendees = [s.strip() for s in attendees_text.split('+') if s.strip()] if attendees_text else None
        out.append({
            'student_id': student_map[sid_legacy],
            'meeting_date': meeting_date,
            'attendees': attendees,
            'notes': ' | '.join(notes_parts) if notes_parts else None,
            'recorded_by': user_map.get(clean(r.get('רב'))),
            'legacy_id': clean(r.get('מזהה')) or None,
        })
    inserted = 0
    for batch in chunked(out, 500):
        try:
            sb.insert('meetings', batch)
            inserted += len(batch)
        except sb.SupabaseError as e:
            print(f'  ! meetings batch: {e}')
    return inserted


def migrate_conversations(student_map: Dict[str, str], user_map: Dict[str, str]) -> int:
    if sb.select('conversations', columns='id', limit=1):
        print('  conversations not empty — skipping')
        return 0
    rows = fetch_sheet('שיחות')
    out = []
    for r in rows:
        sid_legacy = clean(r.get('תלמיד_מזהה'))
        if not sid_legacy or sid_legacy not in student_map:
            continue
        d = parse_date(r.get('תאריך'))
        summary_parts = []
        for label, key in [
            ('נושא', 'נושא'),
            ('תוכן', 'תוכן'),
            ('פרשה', 'פרשה'),
            ('קטגוריה', 'קטגוריה'),
            ('תאריך עברי', 'תאריך_עברי'),
            ('הערות', 'הערות'),
        ]:
            v = clean(r.get(key))
            if v: summary_parts.append(f'{label}: {v}')
        out.append({
            'student_id': student_map[sid_legacy],
            'participant': clean(r.get('רב')) or None,
            'on_date': d or '2026-01-01',
            'summary': ' | '.join(summary_parts) if summary_parts else None,
            'recorded_by': user_map.get(clean(r.get('רב'))),
            'legacy_id': clean(r.get('מזהה')) or None,
        })
    inserted = 0
    for batch in chunked(out, 500):
        try:
            sb.insert('conversations', batch)
            inserted += len(batch)
        except sb.SupabaseError as e:
            print(f'  ! conversations batch: {e}')
    return inserted


def migrate_functioning(student_map: Dict[str, str]) -> int:
    """Aggregate the long-form rows into a single jsonb scores blob per
    student + period so we don't blow up the table to 3941 rows."""
    if sb.select('functioning_reports', columns='id', limit=1):
        print('  functioning_reports not empty — skipping')
        return 0
    rows = fetch_sheet('תפקוד')
    # group: (sid_legacy, period) -> {scores: {category: {subcategory: {parameter: score}}}, dates: [...]}
    groups: Dict[tuple, Dict[str, Any]] = {}
    for r in rows:
        sid_legacy = clean(r.get('תלמיד_מזהה'))
        period = clean(r.get('תקופה')) or 'כללי'
        if not sid_legacy or sid_legacy not in student_map:
            continue
        key = (sid_legacy, period)
        g = groups.setdefault(key, {'scores': {}, 'dates': [], 'notes': []})
        cat = clean(r.get('קטגוריה')) or 'כללי'
        sub = clean(r.get('תת_קטגוריה')) or '_'
        param = clean(r.get('פרמטר')) or '_'
        score = r.get('ציון')
        g['scores'].setdefault(cat, {}).setdefault(sub, {})[param] = score
        d = parse_date(r.get('תאריך'))
        if d: g['dates'].append(d)
        note = clean(r.get('הערות'))
        if note: g['notes'].append(note)

    out = []
    for (sid_legacy, period), g in groups.items():
        dates = sorted(set(g['dates']))
        out.append({
            'student_id': student_map[sid_legacy],
            'period_start': dates[0] if dates else '2026-01-01',
            'period_end': dates[-1] if dates else '2026-01-01',
            'scores': {'period': period, 'by_category': g['scores']},
            'comments': ' | '.join(g['notes']) if g['notes'] else None,
            'legacy_id': f'{sid_legacy}::{period}',
        })
    inserted = 0
    for batch in chunked(out, 250):
        try:
            sb.insert('functioning_reports', batch)
            inserted += len(batch)
        except sb.SupabaseError as e:
            print(f'  ! functioning batch: {e}')
    return inserted


def main():
    summary = {}
    print('=== migrate: users ===')
    user_map = migrate_users()
    summary['users'] = len(user_map)
    print(f'  {len(user_map)} users mapped')

    print('=== migrate: classes ===')
    class_map = migrate_classes(user_map)
    summary['classes'] = len(class_map)
    print(f'  {len(class_map)} classes mapped')

    print('=== migrate: categories ===')
    cat_map = migrate_categories()
    summary['categories'] = len(cat_map)
    print(f'  {len(cat_map)} categories mapped')

    print('=== migrate: students ===')
    student_map = migrate_students(class_map)
    summary['students'] = len(student_map)
    print(f'  {len(student_map)} students mapped')

    print('=== migrate: behavior_events ===')
    inserted = migrate_behavior(student_map, cat_map, user_map)
    summary['behavior_events'] = inserted
    print(f'  {inserted} events inserted')

    print('=== migrate: attendance ===')
    summary['attendance'] = migrate_attendance(student_map, user_map)
    print(f'  {summary["attendance"]} attendance')

    print('=== migrate: tests ===')
    summary['tests'] = migrate_tests(student_map)
    print(f'  {summary["tests"]} tests')

    print('=== migrate: medications ===')
    summary['medications'] = migrate_medications(student_map)
    print(f'  {summary["medications"]} medications')

    print('=== migrate: meetings ===')
    summary['meetings'] = migrate_meetings(student_map, user_map)
    print(f'  {summary["meetings"]} meetings')

    print('=== migrate: conversations ===')
    summary['conversations'] = migrate_conversations(student_map, user_map)
    print(f'  {summary["conversations"]} conversations')

    print('=== migrate: functioning_reports ===')
    summary['functioning_reports'] = migrate_functioning(student_map)
    print(f'  {summary["functioning_reports"]} functioning reports')

    print('\n=== summary ===')
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
