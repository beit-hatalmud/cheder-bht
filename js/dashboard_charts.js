/**
 * dashboard_charts.js — 4 quick-glance charts above the home tiles.
 *
 * - line:  weekly average behavior score (last 8 weeks)
 * - donut: behavior category distribution this month
 * - bar:   recent tests (last 10) score
 * - bar:   attendance this week (per day)
 *
 * Renders into #dashboard-charts which is injected lazily into
 * #page-home above the home groups. Chart.js is already loaded by index.html.
 */
(function () {
  'use strict';
  const STYLE_ID = 'dashboard-charts-style';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
      #dashboard-charts { display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:12px; margin-bottom:20px }
      #dashboard-charts .chart-card { background:#fff; border-radius:10px; box-shadow:0 1px 3px rgba(0,0,0,.08); padding:12px; }
      #dashboard-charts .chart-card h6 { margin:0 0 8px 0; color:#1e293b; font-size:.9rem; display:flex; align-items:center; gap:8px }
      #dashboard-charts canvas { max-height:160px !important }
      [data-theme="dark"] #dashboard-charts .chart-card { background:#1e293b; color:#e2e8f0; }
      [data-theme="dark"] #dashboard-charts .chart-card h6 { color:#e2e8f0; }
    `;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  const CHART_DEFS = [
    { id: 'behav-line',  title: 'ציון התנהגות שבועי',  icon: 'bi-graph-up',        color: 'text-primary' },
    { id: 'behav-donut', title: 'סוגי אירועים השבוע', icon: 'bi-pie-chart',       color: 'text-success' },
    { id: 'tests-bar',   title: 'מבחנים אחרונים',      icon: 'bi-bar-chart',       color: 'text-warning' },
    { id: 'att-bar',     title: 'נוכחות השבוע',        icon: 'bi-check2-square',   color: 'text-info' },
  ];
  const VIS_KEY = 'bht_dashboard_charts_visibility_v1';

  function loadVisibility() {
    try {
      const stored = JSON.parse(localStorage.getItem(VIS_KEY) || '{}');
      return CHART_DEFS.reduce((acc, d) => {
        acc[d.id] = stored[d.id] !== false; // default: visible
        return acc;
      }, {});
    } catch (_) {
      return CHART_DEFS.reduce((acc, d) => { acc[d.id] = true; return acc; }, {});
    }
  }
  function saveVisibility(vis) {
    try { localStorage.setItem(VIS_KEY, JSON.stringify(vis)); } catch (_) {}
  }

  function ensureContainer() {
    let cont = document.getElementById('dashboard-charts');
    if (cont) return cont;
    const home = document.getElementById('page-home');
    if (!home) return null;
    cont = document.createElement('div');
    cont.id = 'dashboard-charts';
    home.insertBefore(cont, home.firstChild);
    return cont;
  }

  function ensureToggleBar() {
    if (document.getElementById('chart-toggle-bar')) return;
    const home = document.getElementById('page-home');
    if (!home) return;
    const bar = document.createElement('div');
    bar.id = 'chart-toggle-bar';
    bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;justify-content:flex-end';
    const vis = loadVisibility();
    bar.innerHTML = CHART_DEFS.map(d => `
      <button class="btn btn-sm ${vis[d.id] ? 'btn-outline-primary' : 'btn-outline-secondary'}"
              data-chart="${d.id}" style="font-size:.72rem;padding:.2rem .55rem">
        <i class="bi ${vis[d.id] ? 'bi-eye-fill' : 'bi-eye-slash'}"></i> ${d.title.replace(/השבוע|אחרונים|שבועי/g,'').trim()}
      </button>`).join('');
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-chart]');
      if (!btn) return;
      const id = btn.dataset.chart;
      const cur = loadVisibility();
      cur[id] = !cur[id];
      saveVisibility(cur);
      refresh();
    });
    home.insertBefore(bar, home.firstChild);
  }

  function renderCards() {
    const cont = ensureContainer();
    if (!cont) return;
    const vis = loadVisibility();
    const visible = CHART_DEFS.filter(d => vis[d.id]);
    if (!visible.length) {
      cont.innerHTML = '<div class="chart-card" style="text-align:center;grid-column:1/-1;color:#94a3b8">כל הגרפים מוסתרים. החזר אותם מההגדרות למעלה.</div>';
      return;
    }
    cont.innerHTML = visible.map(d => `
      <div class="chart-card"><h6><i class="bi ${d.icon} ${d.color}"></i> ${d.title}</h6><canvas id="ch-${d.id}"></canvas></div>
    `).join('');
  }

  function asDate(v) {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v) ? null : v;
    const d = new Date(v);
    return isNaN(d) ? null : d;
  }

  function weekKey(d) {
    const tmp = new Date(d);
    tmp.setHours(0,0,0,0);
    // ISO week: shift to Sunday
    tmp.setDate(tmp.getDate() - tmp.getDay());
    return tmp.toISOString().slice(0, 10);
  }

  function buildBehaviorLine(events) {
    // last 8 weeks, avg score per week
    const buckets = {};
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i*7);
      buckets[weekKey(d)] = { sum: 0, n: 0 };
    }
    events.forEach(e => {
      const d = asDate(e['תאריך']);
      if (!d) return;
      const k = weekKey(d);
      if (!(k in buckets)) return;
      const score = parseInt(e['ניקוד']) || 0;
      buckets[k].sum += score;
      buckets[k].n += 1;
    });
    const labels = Object.keys(buckets).map(k => k.slice(5));
    const data = Object.values(buckets).map(b => b.n ? +(b.sum / b.n).toFixed(2) : 0);
    return { labels, data };
  }

  function buildBehaviorDonut(events) {
    // last 7 days, group by category
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    const counts = {};
    events.forEach(e => {
      const d = asDate(e['תאריך']);
      if (!d || d < cutoff) return;
      const c = (e['קטגוריה'] || 'אחר').toString();
      counts[c] = (counts[c] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { labels: entries.map(e => e[0]), data: entries.map(e => e[1]) };
  }

  function buildTestsBar(tests) {
    const recent = tests
      .filter(t => t['ציון'] != null && t['ציון'] !== '')
      .sort((a, b) => {
        const da = asDate(a['תאריך']) || new Date(0);
        const db = asDate(b['תאריך']) || new Date(0);
        return db - da;
      })
      .slice(0, 10)
      .reverse();
    return {
      labels: recent.map(t => (t['פרשה'] || t['סוג'] || '').slice(0, 8)),
      data: recent.map(t => parseInt(t['ציון']) || 0),
    };
  }

  function buildAttendanceBar(att) {
    // last 7 days
    const days = [];
    const buckets = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      days.push({ k, label: ['א','ב','ג','ד','ה','ו','ש'][d.getDay()] });
      buckets[k] = { present: 0, late: 0, absent: 0 };
    }
    att.forEach(a => {
      const d = asDate(a['תאריך']);
      if (!d) return;
      const k = d.toISOString().slice(0, 10);
      if (!(k in buckets)) return;
      const s = (a['סטטוס'] || '').toString();
      if (s.includes('נוכח')) buckets[k].present += 1;
      else if (s.includes('איחור')) buckets[k].late += 1;
      else if (s.includes('חסר')) buckets[k].absent += 1;
    });
    return {
      labels: days.map(x => x.label),
      present: days.map(x => buckets[x.k].present),
      late: days.map(x => buckets[x.k].late),
      absent: days.map(x => buckets[x.k].absent),
    };
  }

  const _charts = {};
  function drawAll(d) {
    if (typeof Chart === 'undefined') return;
    Object.values(_charts).forEach(c => { try { c.destroy(); } catch (_) {} });
    const vis = loadVisibility();
    const has = (id) => vis[id] && document.getElementById('ch-' + id);

    if (has('behav-line')) {
    const beh = buildBehaviorLine(d.behavior);
    _charts.behLine = new Chart(document.getElementById('ch-behav-line'), {
      type: 'line',
      data: { labels: beh.labels, datasets: [{ data: beh.data, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.15)', fill: true, tension: 0.3 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });

    }
    if (has('behav-donut')) {
    const donut = buildBehaviorDonut(d.behavior);
    _charts.donut = new Chart(document.getElementById('ch-behav-donut'), {
      type: 'doughnut',
      data: { labels: donut.labels, datasets: [{ data: donut.data, backgroundColor: ['#16a34a','#dc2626','#2563eb','#f59e0b','#7c3aed','#0891b2'] }] },
      options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } },
    });
    }
    if (has('tests-bar')) {
    const tests = buildTestsBar(d.tests);
    _charts.tests = new Chart(document.getElementById('ch-tests-bar'), {
      type: 'bar',
      data: { labels: tests.labels, datasets: [{ data: tests.data, backgroundColor: '#f59e0b' }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } },
    });
    }
    if (has('att-bar')) {
    const att = buildAttendanceBar(d.attendance);
    _charts.att = new Chart(document.getElementById('ch-att-bar'), {
      type: 'bar',
      data: {
        labels: att.labels,
        datasets: [
          { label: 'נוכח', data: att.present, backgroundColor: '#16a34a' },
          { label: 'איחור', data: att.late, backgroundColor: '#f59e0b' },
          { label: 'חסר', data: att.absent, backgroundColor: '#dc2626' },
        ],
      },
      options: { plugins: { legend: { display: false } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } },
    });
    }
  }

  async function refresh() {
    try {
      ensureStyle();
      ensureToggleBar();
      renderCards();
      const cont = ensureContainer();
      if (!cont) return;
      // Lazy data pull
      const [behavior, tests, attendance] = await Promise.all([
        api('listBehavior', []).then(r => r.data || []).catch(() => []),
        api('listTests', []).then(r => r.data || []).catch(() => []),
        api('listAttendance', []).then(r => r.data || []).catch(() => []),
      ]);
      drawAll({ behavior, tests, attendance });
    } catch (e) {
      console.warn('[dashboard_charts] refresh failed:', e && e.message);
    }
  }

  // Render whenever we land on home
  function maybeRender() {
    const home = document.getElementById('page-home');
    if (home && !home.classList.contains('d-none')) {
      setTimeout(refresh, 250);
    }
  }

  window.addEventListener('hashchange', maybeRender);
  document.addEventListener('DOMContentLoaded', () => setTimeout(maybeRender, 1500));
  window.refreshDashboardCharts = refresh;
})();
