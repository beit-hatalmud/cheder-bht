// behavior-pack-30.js — Charts & Visualization. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Mini bar chart (SVG) =====
  window.svgBarChart = function (data, opts) {
    opts = opts || {};
    const w = opts.width || 200;
    const h = opts.height || 60;
    const max = Math.max(...data.map(d => d.value), 1);
    const bw = w / data.length - 2;
    const bars = data.map((d, i) => {
      const bh = (d.value / max) * (h - 20);
      const x = i * (bw + 2);
      const y = h - bh - 16;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${d.color||'#3b82f6'}" rx="2"></rect>
        <text x="${x+bw/2}" y="${h-2}" text-anchor="middle" font-size="9" fill="#6b7280">${escHtml(d.label||'')}</text>
        <text x="${x+bw/2}" y="${y-2}" text-anchor="middle" font-size="9" fill="#1f2937">${d.value}</text>`;
    }).join('');
    return `<svg width="${w}" height="${h}" style="direction:ltr">${bars}</svg>`;
  };

  // ===== 2. Pie chart =====
  window.svgPieChart = function (data, radius) {
    radius = radius || 60;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let angleStart = 0;
    const slices = data.map((d, i) => {
      const angle = (d.value / total) * 360;
      const angleEnd = angleStart + angle;
      const x1 = radius + Math.cos(angleStart * Math.PI / 180) * radius;
      const y1 = radius + Math.sin(angleStart * Math.PI / 180) * radius;
      const x2 = radius + Math.cos(angleEnd * Math.PI / 180) * radius;
      const y2 = radius + Math.sin(angleEnd * Math.PI / 180) * radius;
      const large = angle > 180 ? 1 : 0;
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      const path = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
      angleStart = angleEnd;
      return `<path d="${path}" fill="${d.color || colors[i % colors.length]}"><title>${escHtml(d.label||'')}: ${d.value}</title></path>`;
    }).join('');
    return `<svg width="${radius*2}" height="${radius*2}" style="direction:ltr">${slices}</svg>`;
  };

  // ===== 3. Sparkline (mini line chart) =====
  window.svgSparkline = function (values, w, h) {
    w = w || 100;
    h = h || 24;
    if (!values.length) return '';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    }).join(' ');
    const last = values[values.length - 1];
    const trend = values.length > 1 ? (last - values[0]) / Math.abs(values[0] || 1) : 0;
    const color = trend > 0.1 ? '#ef4444' : trend < -0.1 ? '#10b981' : '#3b82f6';
    return `<svg width="${w}" height="${h}" style="direction:ltr">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2"/>
    </svg>`;
  };

  // ===== 4. Activity heatmap (calendar) =====
  window.svgHeatmap = function (days, opts) {
    opts = opts || {};
    const cell = opts.cell || 12;
    const gap = 2;
    const weeks = Math.ceil(Object.keys(days).length / 7);
    const w = weeks * (cell + gap);
    const h = 7 * (cell + gap);
    let html = `<svg width="${w}" height="${h}" style="direction:ltr">`;
    Object.entries(days).sort().forEach(([date, count], i) => {
      const week = Math.floor(i / 7);
      const day = i % 7;
      const max = Math.max(...Object.values(days), 1);
      const intensity = Math.min(1, count / max);
      const color = count === 0 ? '#f3f4f6' : `rgba(37, 99, 235, ${0.2 + intensity * 0.8})`;
      html += `<rect x="${week*(cell+gap)}" y="${day*(cell+gap)}" width="${cell}" height="${cell}" fill="${color}" rx="2"><title>${date}: ${count}</title></rect>`;
    });
    return html + '</svg>';
  };

  // ===== 5. Trend arrow =====
  window.trendArrow = function (current, previous) {
    const delta = current - previous;
    if (delta > 0) return `<span style="color:#ef4444">▲ +${Math.abs(delta)}</span>`;
    if (delta < 0) return `<span style="color:#10b981">▼ ${delta}</span>`;
    return '<span style="color:#6b7280">▬ ללא שינוי</span>';
  };

  // ===== 6. Show stats panel on home =====
  setTimeout(async () => {
    if (document.getElementById('home-stats-charts')) return;
    const home = document.getElementById('page-home');
    if (!home) return;
    try {
      const r = await api('listBehavior', []);
      const events = r.data || [];
      const cats = {};
      events.forEach(e => { cats[e['קטגוריה']||'?'] = (cats[e['קטגוריה']||'?']||0)+1; });
      const bars = Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c, n]) => ({ label: c.substring(0,8), value: n }));
      const pieData = Object.entries(cats).slice(0, 6).map(([c, n]) => ({ label: c, value: n }));

      const panel = document.createElement('div');
      panel.id = 'home-stats-charts';
      panel.className = 'card p-3 mt-3';
      panel.style.direction = 'rtl';
      panel.innerHTML = `<h6><i class="bi bi-graph-up"></i> סטטיסטיקה ויזואלית</h6>
        <div class="row g-3 mt-1">
          <div class="col-md-6">
            <small class="text-muted">קטגוריות מובילות</small>
            <div>${svgBarChart(bars, { width: 280, height: 80 })}</div>
          </div>
          <div class="col-md-6">
            <small class="text-muted">חלוקה</small>
            <div class="d-flex align-items-center gap-2">
              ${svgPieChart(pieData, 50)}
              <div class="small">${pieData.map(d => `<div>${escHtml(d.label)}: ${d.value}</div>`).join('')}</div>
            </div>
          </div>
        </div>`;
      home.appendChild(panel);
    } catch (_) { }
  }, 4000);

  // ===== 7. Color-code statistics =====
  window.colorScale = function (value, max) {
    const ratio = value / (max || 1);
    if (ratio < 0.3) return '#10b981';
    if (ratio < 0.6) return '#f59e0b';
    return '#ef4444';
  };

  // ===== 8. Progress bar component =====
  window.progressBar = function (current, total, label) {
    const pct = total ? Math.min(100, (current / total) * 100) : 0;
    return `<div style="background:#e5e7eb;height:8px;border-radius:4px;overflow:hidden">
      <div style="background:${colorScale(current, total)};height:100%;width:${pct}%;transition:width 0.3s"></div>
    </div>
    <small class="text-muted">${escHtml(label||'')} ${current}/${total} (${pct.toFixed(0)}%)</small>`;
  };

  // ===== 9. Mini gauge =====
  window.svgGauge = function (value, max, size) {
    size = size || 80;
    const r = size / 2 - 5;
    const cx = size / 2;
    const cy = size / 2;
    const angle = (value / max) * 270 - 135;
    const x = cx + Math.cos(angle * Math.PI / 180) * r;
    const y = cy + Math.sin(angle * Math.PI / 180) * r;
    const color = value < max * 0.5 ? '#10b981' : value < max * 0.8 ? '#f59e0b' : '#ef4444';
    return `<svg width="${size}" height="${size}" style="direction:ltr">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="6"/>
      <path d="M ${cx} ${cy} L ${x} ${y}" stroke="${color}" stroke-width="3"/>
      <circle cx="${cx}" cy="${cy}" r="3" fill="${color}"/>
      <text x="${cx}" y="${size-5}" text-anchor="middle" font-size="11">${value}/${max}</text>
    </svg>`;
  };

  // ===== 10. Stacked bar chart =====
  window.svgStackedBar = function (categories, total) {
    total = total || categories.reduce((s, c) => s + c.value, 0) || 1;
    let html = '<div style="display:flex;height:24px;border-radius:4px;overflow:hidden;direction:ltr;font-size:11px;color:#fff;text-align:center">';
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    categories.forEach((c, i) => {
      const pct = (c.value / total) * 100;
      html += `<div style="background:${c.color||colors[i%colors.length]};width:${pct}%;line-height:24px" title="${escHtml(c.label)}: ${c.value}">${pct > 10 ? c.value : ''}</div>`;
    });
    return html + '</div>';
  };

  console.warn('%c📊 Pack-30 — Visualization: SVG bars, pie, sparklines, heatmap, gauge, progress', 'color:#8b5cf6;font-weight:bold');
})();
