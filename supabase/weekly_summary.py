"""
Weekly summary email — runs every Sunday morning at 07:00.

Pulls the past week's activity from Supabase and emails a digest to
Yosef (6742853@gmail.com): how many behavior events recorded by whom,
notable trends, top/bottom students by score, attendance issues,
upcoming meetings.

The email is sent via the existing email_actions.py SMTP helper if
available, otherwise falls back to a Drive file so nothing is lost.
"""
import os, sys, json
from datetime import datetime, timedelta
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import supabase_rest as sb

# Last 7 days
now = datetime.now()
week_start = (now - timedelta(days=7)).date().isoformat()
week_end = now.date().isoformat()


def fetch_all(table, columns='*'):
    """Pull all rows (paginated)."""
    import urllib.request, urllib.parse
    out = []
    offset = 0
    PAGE = 1000
    while True:
        url = sb._BASE + f'/{table}?select={columns}&offset={offset}&limit={PAGE}'
        req = urllib.request.Request(url, headers={
            'apikey': sb.SECRET_KEY,
            'Authorization': f'Bearer {sb.SECRET_KEY}',
        })
        with urllib.request.urlopen(req, timeout=60) as r:
            chunk = json.loads(r.read())
        out.extend(chunk)
        if len(chunk) < PAGE:
            break
        offset += PAGE
    return out


def build_summary():
    print(f'-- summary for {week_start} -> {week_end}')
    students = fetch_all('students', 'id,full_name,class_id,status')
    sid_to_name = {s['id']: s['full_name'] for s in students}
    behavior = fetch_all('behavior_events', 'id,student_id,category_id,occurred_at,score_delta,recorded_by')
    attendance = fetch_all('attendance', 'id,student_id,on_date,status')
    meetings = fetch_all('meetings', 'id,student_id,meeting_date,notes')
    users = fetch_all('users', 'id,full_name,email,role')
    uid_to_name = {u['id']: u['full_name'] for u in users}
    categories = fetch_all('categories', 'id,name,weight')
    cat_to_name = {c['id']: c['name'] for c in categories}

    # Filter to last 7 days
    cutoff = (now - timedelta(days=7)).isoformat()
    weekly_behavior = [b for b in behavior if (b.get('occurred_at') or b.get('created_at', '')) >= cutoff]
    weekly_attendance = [a for a in attendance if a.get('on_date', '') >= week_start]
    weekly_meetings = [m for m in meetings if (m.get('meeting_date') or '') >= cutoff]

    # Aggregates
    by_recorder = Counter()
    by_category = Counter()
    score_per_student = defaultdict(int)
    for b in weekly_behavior:
        if b.get('recorded_by'):
            by_recorder[uid_to_name.get(b['recorded_by'], '?')] += 1
        if b.get('category_id'):
            by_category[cat_to_name.get(b['category_id'], '?')] += 1
        if b.get('student_id'):
            score_per_student[sid_to_name.get(b['student_id'], '?')] += (b.get('score_delta') or 0)

    # Attendance issues
    absent_count = Counter()
    late_count = Counter()
    for a in weekly_attendance:
        sname = sid_to_name.get(a['student_id'], '?')
        st = a.get('status', '')
        if 'חסר' in st: absent_count[sname] += 1
        if 'איחור' in st: late_count[sname] += 1

    # Top / bottom students by weekly score
    sorted_scores = sorted(score_per_student.items(), key=lambda kv: kv[1], reverse=True)
    top5 = sorted_scores[:5]
    bottom5 = sorted_scores[-5:][::-1]

    return {
        'period': f'{week_start} - {week_end}',
        'totals': {
            'behavior_events': len(weekly_behavior),
            'attendance_rows': len(weekly_attendance),
            'meetings_held': len(weekly_meetings),
            'active_students': len([s for s in students if s.get('status') == 'פעיל']),
        },
        'by_recorder': dict(by_recorder.most_common(10)),
        'by_category': dict(by_category.most_common(10)),
        'top5': top5,
        'bottom5': bottom5,
        'top_absent': dict(absent_count.most_common(5)),
        'top_late': dict(late_count.most_common(5)),
    }


def format_html(s):
    rows = []
    def section(title, items, prefix=''):
        if not items:
            return f'<h3>{title}</h3><p style="color:#94a3b8">אין נתונים</p>'
        if isinstance(items, dict):
            items = items.items()
        body = '<ul>' + ''.join(f'<li>{prefix}<b>{k}</b>: {v}</li>' for k, v in items) + '</ul>'
        return f'<h3>{title}</h3>{body}'

    html = f'''<!doctype html><html dir="rtl" lang="he">
<head><meta charset="utf-8"><style>
body{{font-family:Arial,Heebo,sans-serif;color:#1e293b;max-width:760px;margin:24px auto;padding:0 16px}}
h1{{color:#2563eb}}
h3{{color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-top:24px}}
ul{{padding-right:1.2em}}
li{{margin:4px 0}}
.totals{{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:16px 0}}
.totals .card{{background:#eef2ff;border-radius:10px;padding:12px;text-align:center}}
.totals .card .n{{font-size:1.6rem;font-weight:bold;color:#2563eb}}
</style></head><body>
<h1>סיכום שבועי – בית התלמוד</h1>
<p style="color:#64748b">לתקופה: {s["period"]}</p>
<div class="totals">
  <div class="card"><div class="n">{s["totals"]["behavior_events"]}</div>אירועי התנהגות</div>
  <div class="card"><div class="n">{s["totals"]["attendance_rows"]}</div>רישומי נוכחות</div>
  <div class="card"><div class="n">{s["totals"]["meetings_held"]}</div>אסיפות שהתקיימו</div>
  <div class="card"><div class="n">{s["totals"]["active_students"]}</div>תלמידים פעילים</div>
</div>
{section("מי תיעד הכי הרבה השבוע", s["by_recorder"])}
{section("התפלגות אירועים לפי קטגוריה", s["by_category"])}
{section("5 התלמידים עם הציון הגבוה ביותר השבוע", s["top5"], prefix="+ ")}
{section("5 התלמידים עם הציון הנמוך ביותר השבוע", s["bottom5"], prefix="- ")}
{section("הכי הרבה חיסורים", s["top_absent"])}
{section("הכי הרבה איחורים", s["top_late"])}
<hr style="margin-top:30px;border:0;border-top:1px solid #e2e8f0">
<p style="color:#94a3b8;font-size:.85rem">דוח אוטומטי. אם משהו לא תואם — בדוק ב-Supabase או צור קשר.</p>
</body></html>'''
    return html


def send_via_apps_script(html, subject):
    """Send via the ai-email-agent's sendEmail action over the /exec proxy."""
    import urllib.request, urllib.parse, urllib.error
    apps_url = ('https://script.google.com/macros/s/'
                'AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec')
    payload = urllib.parse.urlencode({
        'action': 'sendEmail',
        'token': 'BHT_AGENT_2026',
        'to': '6742853@gmail.com',
        'subject': subject,
        'htmlBody': html,
    }).encode()
    req = urllib.request.Request(apps_url, data=payload, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            resp = json.loads(r.read())
        if resp.get('ok'):
            print('-- email sent via Apps Script /sendEmail')
            return True
        print(f'-- Apps Script sendEmail returned: {resp}')
    except Exception as e:
        print(f'-- Apps Script sendEmail exception: {e}')
    return False


def send_email(html, subject):
    """Three strategies, in order:
      1. Apps Script /exec sendEmail action (Gmail, via OAuth-installed app).
      2. SMTP helper in the ai-email-agent (legacy).
      3. Fallback to disk for the user to open manually.
    """
    if send_via_apps_script(html, subject):
        return True
    try:
        sys.path.insert(0, r'C:\Users\יוסף שניידר\ai-email-agent')
        from email_actions import send_email_smtp  # type: ignore
        send_email_smtp(to='6742853@gmail.com', subject=subject, html=html)
        print('-- email sent via SMTP fallback')
        return True
    except Exception as e:
        print(f'-- SMTP fallback failed: {e}')
    fallback_dir = r'C:\Users\יוסף שניידר\bht_backups\weekly_summary'
    os.makedirs(fallback_dir, exist_ok=True)
    path = os.path.join(fallback_dir, f'{datetime.now().strftime("%Y-%m-%d")}.html')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'-- saved to disk: {path}')
    return False


def main():
    s = build_summary()
    print(json.dumps({k: v for k, v in s.items() if k != 'totals'}, ensure_ascii=False, indent=1)[:500])
    print('totals:', s['totals'])
    html = format_html(s)
    send_email(html, subject=f'סיכום שבועי בית התלמוד {s["period"]}')


if __name__ == '__main__':
    main()
