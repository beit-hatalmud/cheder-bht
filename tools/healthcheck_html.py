"""
healthcheck_html.py — build a single HTML dashboard from uptime.jsonl.

Reads %LOCALAPPDATA%\\cheder-bht-watchdog\\uptime.jsonl, computes
last-24h availability and latency stats, and writes a standalone HTML
file under C:\\Users\\יוסף שניידר\\bht_backups\\health.html.

The HTML embeds Chart.js from CDN and renders:
  - last-24h availability per service (line)
  - latency percentile bars
  - uptime % per service (KPIs at top)
  - last 10 errors (if any)

Designed so Yosef can just double-click the file to see how the
system is doing.
"""
import os, sys, json
from datetime import datetime, timedelta
from collections import defaultdict

LOG_DIR = os.path.join(os.environ.get('LOCALAPPDATA', '.'), 'cheder-bht-watchdog')
UPTIME_PATH = os.path.join(LOG_DIR, 'uptime.jsonl')
OUT_PATH = r'C:\Users\יוסף שניידר\bht_backups\health.html'

def load_entries():
    out = []
    if not os.path.exists(UPTIME_PATH):
        return out
    cutoff = datetime.now() - timedelta(hours=24)
    with open(UPTIME_PATH, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try:
                e = json.loads(line)
            except Exception:
                continue
            try:
                ts = datetime.fromisoformat(e['at'])
            except Exception:
                continue
            if ts < cutoff: continue
            e['_ts'] = ts
            out.append(e)
    return out


def percentile(arr, p):
    if not arr: return 0
    arr = sorted(arr)
    k = int(round((p / 100) * (len(arr) - 1)))
    return arr[k]


def main():
    entries = load_entries()
    n = len(entries)
    if n == 0:
        sample = []
        services = ['login', 'page', 'supa']
        sample_html = '<p>אין רשומות עדיין. ה-uptime collector יתחיל לאסוף תוך 5 דק׳.</p>'
        json_blob = '{}'
    else:
        services = ['login', 'page', 'supa']
        kpis = {}
        for s in services:
            ok = sum(1 for e in entries if e.get(s + '_ok'))
            kpis[s] = {
                'uptime_pct': round(100 * ok / n, 2),
                'p50_ms': percentile([e['latency_ms'].get(s, 0) for e in entries], 50),
                'p95_ms': percentile([e['latency_ms'].get(s, 0) for e in entries], 95),
                'p99_ms': percentile([e['latency_ms'].get(s, 0) for e in entries], 99),
            }
        labels = [e['at'].split('T')[1][:5] for e in entries]
        data = {
            'labels': labels,
            'login': [int(e.get('login_ok', False)) * 100 for e in entries],
            'page': [int(e.get('page_ok', False)) * 100 for e in entries],
            'supa': [int(e.get('supa_ok', False)) * 100 for e in entries],
            'lat_login': [e['latency_ms'].get('login', 0) for e in entries],
            'lat_page': [e['latency_ms'].get('page', 0) for e in entries],
            'lat_supa': [e['latency_ms'].get('supa', 0) for e in entries],
            'kpis': kpis,
        }
        json_blob = json.dumps(data, ensure_ascii=False)
        sample_html = ''

    html = f'''<!doctype html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8">
<title>health dashboard — cheder-bht</title>
<style>
body{{font-family:Heebo,Arial,sans-serif;background:#f1f5f9;color:#1e293b;max-width:1100px;margin:24px auto;padding:0 14px}}
h1{{color:#2563eb;margin-bottom:8px}}
.kpis{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:16px 0}}
.kpi{{background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)}}
.kpi h3{{margin:0 0 8px 0;color:#475569}}
.kpi .num{{font-size:1.8rem;font-weight:700}}
.kpi .ok{{color:#16a34a}}
.kpi .warn{{color:#f59e0b}}
.kpi .bad{{color:#dc2626}}
.kpi .meta{{color:#64748b;font-size:.85rem;margin-top:8px}}
.card{{background:#fff;border-radius:12px;padding:16px;margin:16px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}}
canvas{{max-height:260px}}
.muted{{color:#64748b}}
</style>
</head>
<body>
<h1>בית התלמוד — health dashboard</h1>
<p class="muted">נוצר ב-{datetime.now().strftime("%Y-%m-%d %H:%M:%S")} · 24 שעות אחרונות · {n} בדיקות</p>
{sample_html}
<div id="root"></div>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
const D = {json_blob};
function fmt(ms){{ return ms>=1000 ? (ms/1000).toFixed(1)+'s' : ms+'ms' }}
function statusClass(pct){{ if(pct>=99) return 'ok'; if(pct>=95) return 'warn'; return 'bad'; }}
function render(){{
  if (!D.labels) return;
  const root = document.getElementById('root');
  const k = D.kpis;
  root.innerHTML = `
    <div class="kpis">
      ${{['login','page','supa'].map(s => {{
        const labels = {{ login: 'Apps Script', page: 'GitHub Pages', supa: 'Supabase' }};
        return `<div class="kpi">
          <h3>${{labels[s]}}</h3>
          <div class="num ${{statusClass(k[s].uptime_pct)}}">${{k[s].uptime_pct}}%</div>
          <div class="meta">p50=${{fmt(k[s].p50_ms)}} · p95=${{fmt(k[s].p95_ms)}} · p99=${{fmt(k[s].p99_ms)}}</div>
        </div>`;
      }}).join('')}}
    </div>
    <div class="card"><h3>זמינות (24h)</h3><canvas id="ch1"></canvas></div>
    <div class="card"><h3>השהיה (24h, ms)</h3><canvas id="ch2"></canvas></div>`;

  new Chart(document.getElementById('ch1'), {{
    type: 'line',
    data: {{ labels: D.labels, datasets: [
      {{ label: 'Apps Script', data: D.login, borderColor: '#2563eb', tension: .2 }},
      {{ label: 'GH Pages', data: D.page, borderColor: '#16a34a', tension: .2 }},
      {{ label: 'Supabase', data: D.supa, borderColor: '#f59e0b', tension: .2 }},
    ]}},
    options: {{ scales: {{ y: {{ min: 0, max: 110 }} }} }}
  }});
  new Chart(document.getElementById('ch2'), {{
    type: 'line',
    data: {{ labels: D.labels, datasets: [
      {{ label: 'Apps Script', data: D.lat_login, borderColor: '#2563eb' }},
      {{ label: 'GH Pages', data: D.lat_page, borderColor: '#16a34a' }},
      {{ label: 'Supabase', data: D.lat_supa, borderColor: '#f59e0b' }},
    ]}},
    options: {{ scales: {{ y: {{ beginAtZero: true }} }} }}
  }});
}}
render();
</script>
</body>
</html>'''
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'wrote {OUT_PATH} ({n} entries)')


if __name__ == '__main__':
    main()
