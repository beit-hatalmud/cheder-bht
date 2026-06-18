/**
 * class_breakdown_chart.js — homeroom-friendly behavior pivot.
 *
 * Aggregates the last 30 days of behavior_events per class (using
 * student.מחזור or student.כיתה), and renders a stacked horizontal
 * bar chart with positive/negative score deltas.
 *
 * Rendered as a 5th card under the dashboard, hidden by default
 * unless the user enables it from the toggle bar (key: class-bar).
 */
(function () {
  'use strict';

  function buildPivot(students, behavior) {
    const sidToClass = {};
    students.forEach(s => {
      sidToClass[String(s['מזהה'])] = s['מחזור'] || s['כיתה'] || 'לא משויך';
    });
    const cutoff = Date.now() - 30 * 86400000;
    const positives = {}, negatives = {};
    behavior.forEach(b => {
      const d = new Date(b['תאריך']);
      if (isNaN(d) || d.getTime() < cutoff) return;
      const cls = sidToClass[String(b['תלמיד_מזהה'])];
      if (!cls) return;
      const sd = parseInt(b['ניקוד']) || 0;
      if (sd >= 0) positives[cls] = (positives[cls] || 0) + sd;
      else negatives[cls] = (negatives[cls] || 0) + sd;
    });
    const classes = Array.from(new Set([
      ...Object.keys(positives),
      ...Object.keys(negatives),
    ])).sort();
    return {
      classes,
      positive: classes.map(c => positives[c] || 0),
      negative: classes.map(c => negatives[c] || 0),
    };
  }

  let _classChart = null;

  async function renderInto(canvas) {
    if (typeof Chart === 'undefined') return;
    try {
      const [students, behavior] = await Promise.all([
        api('listStudents', []).then(r => r.data || []),
        api('listBehavior', []).then(r => r.data || []),
      ]);
      const pivot = buildPivot(students, behavior);
      if (_classChart) { try { _classChart.destroy(); } catch (_) {} }
      _classChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: pivot.classes,
          datasets: [
            { label: 'חיובי', data: pivot.positive, backgroundColor: '#16a34a' },
            { label: 'שלילי', data: pivot.negative, backgroundColor: '#dc2626' },
          ],
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { stacked: true, beginAtZero: true },
            y: { stacked: true },
          },
        },
      });
      canvas.style.cursor = 'pointer';
      canvas.onclick = () => { location.hash = '#classview'; };
    } catch (e) {
      console.warn('[class_breakdown_chart] failed:', e && e.message);
    }
  }

  // Hook the dashboard-charts module: append a 5th card when the
  // toggle is on. We register a small DOM observer because charts
  // re-render on hashchange.
  function ensureExtraCard() {
    const cont = document.getElementById('dashboard-charts');
    if (!cont) return;
    let vis = {};
    try { vis = JSON.parse(localStorage.getItem('bht_dashboard_charts_visibility_v1') || '{}'); }
    catch (_) {}
    if (vis['class-bar'] === false) {
      const existing = document.getElementById('ch-class-bar');
      if (existing && existing.parentElement) existing.parentElement.remove();
      return;
    }
    if (document.getElementById('ch-class-bar')) return;
    const card = document.createElement('div');
    card.className = 'chart-card';
    card.style.gridColumn = 'span 2';
    card.innerHTML = '<h6><i class="bi bi-bar-chart-steps text-info"></i> ציוני התנהגות לפי כיתה (30 ימים)</h6><canvas id="ch-class-bar" style="max-height:200px"></canvas>';
    cont.appendChild(card);
    renderInto(document.getElementById('ch-class-bar'));
  }

  // Add 'class-bar' toggle to the toggle bar (only after dashboard_charts has rendered)
  function ensureToggleEntry() {
    const bar = document.getElementById('chart-toggle-bar');
    if (!bar) return;
    if (bar.querySelector('[data-chart="class-bar"]')) return;
    let vis = {};
    try { vis = JSON.parse(localStorage.getItem('bht_dashboard_charts_visibility_v1') || '{}'); }
    catch (_) {}
    const on = vis['class-bar'] !== false;
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm ' + (on ? 'btn-outline-info' : 'btn-outline-secondary');
    btn.dataset.chart = 'class-bar';
    btn.style.cssText = 'font-size:.72rem;padding:.2rem .55rem';
    btn.innerHTML = `<i class="bi ${on ? 'bi-eye-fill' : 'bi-eye-slash'}"></i> כיתות`;
    bar.appendChild(btn);
  }

  function maybeRender() {
    const home = document.getElementById('page-home');
    if (!home || home.classList.contains('d-none')) return;
    setTimeout(() => {
      ensureToggleEntry();
      ensureExtraCard();
    }, 700);
  }

  window.addEventListener('hashchange', maybeRender);
  document.addEventListener('DOMContentLoaded', () => setTimeout(maybeRender, 3000));
})();
