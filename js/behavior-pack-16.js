// behavior-pack-16.js — AI Insights: predictions + trends. 2026-05-24
(function () {
  'use strict';

  // ===== 1. ניתוח מגמה לתלמיד =====
  window.studentTrend = function (events, sid) {
    const stu = events.filter(e => String(e['תלמיד_מזהה']) === String(sid));
    if (stu.length < 3) return { trend: 'insufficient', score: 0 };
    const sorted = stu.sort((a, b) => new Date(a['תאריך']) - new Date(b['תאריך']));
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);
    const sev = e => ({ 'גבוהה': 3, 'בינונית': 2, 'נמוכה': 1 })[e['חומרה']] || 1;
    const avg1 = firstHalf.reduce((s, e) => s + sev(e), 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((s, e) => s + sev(e), 0) / secondHalf.length;
    const delta = avg2 - avg1;
    return {
      trend: delta > 0.3 ? 'worsening' : delta < -0.3 ? 'improving' : 'stable',
      score: Math.round((avg2 - avg1) * 100) / 100,
      first_avg: avg1.toFixed(2), second_avg: avg2.toFixed(2),
    };
  };

  // ===== 2. חיזוי תלמידים בסיכון =====
  window.atRiskStudents = async function () {
    try {
      const [stRes, evRes] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const students = stRes.data || [];
      const events = evRes.data || [];
      const week = Date.now() - 7 * 86400000;
      const risk = [];
      students.forEach(s => {
        const recent = events.filter(e =>
          String(e['תלמיד_מזהה']) === String(s['מזהה']) &&
          new Date(e['תאריך']).getTime() > week
        );
        const high = recent.filter(e => e['חומרה'] === 'גבוהה').length;
        const score = recent.length + high * 3;
        if (score >= 4) {
          risk.push({
            student: `${s['שם פרטי']||''} ${s['שם משפחה']||''}`,
            sid: s['מזהה'],
            score, recent: recent.length, high,
          });
        }
      });
      return risk.sort((a, b) => b.score - a.score);
    } catch (e) { return []; }
  };

  // ===== 3. השוואה לממוצע כיתה =====
  window.compareToClassAvg = async function (sid) {
    try {
      const [stRes, evRes] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const students = stRes.data || [];
      const events = evRes.data || [];
      const stu = students.find(s => String(s['מזהה']) === String(sid));
      if (!stu) return null;
      const classSiblings = students.filter(s => s['מחזור'] === stu['מחזור']);
      const week = Date.now() - 30 * 86400000;
      const recentEvents = events.filter(e => new Date(e['תאריך']).getTime() > week);
      const stuCount = recentEvents.filter(e => String(e['תלמיד_מזהה']) === String(sid)).length;
      const classCount = recentEvents.filter(e => classSiblings.some(s => String(s['מזהה']) === String(e['תלמיד_מזהה']))).length;
      const classAvg = classSiblings.length ? classCount / classSiblings.length : 0;
      return {
        student_events: stuCount,
        class_avg: classAvg.toFixed(1),
        deviation: stuCount > classAvg ? `+${(stuCount - classAvg).toFixed(1)}` : (stuCount - classAvg).toFixed(1),
      };
    } catch (_) { return null; }
  };

  // ===== 4. תחזית מספר אירועים השבוע =====
  window.forecastWeek = async function () {
    try {
      const r = await api('listBehavior', []);
      const events = r.data || [];
      const last4Weeks = [];
      for (let w = 1; w <= 4; w++) {
        const from = Date.now() - w * 7 * 86400000;
        const to = Date.now() - (w - 1) * 7 * 86400000;
        const count = events.filter(e => {
          const t = new Date(e['תאריך']).getTime();
          return t >= from && t < to;
        }).length;
        last4Weeks.push(count);
      }
      const avg = last4Weeks.reduce((s, n) => s + n, 0) / 4;
      const recent = last4Weeks[0] || 0;
      const trend = recent / (avg || 1);
      return {
        last_4_weeks: last4Weeks,
        avg: avg.toFixed(1),
        forecast_next_week: Math.round(avg * trend),
        trend: trend > 1.2 ? 'מעלייה' : trend < 0.8 ? 'בירידה' : 'יציב',
      };
    } catch (_) { return null; }
  };

  // ===== 5. זיהוי דפוסים שעתיים =====
  window.hourlyPattern = async function () {
    try {
      const r = await api('listBehavior', []);
      const hours = {};
      (r.data || []).forEach(e => {
        if (!e['תאריך']) return;
        const h = new Date(e['תאריך']).getHours();
        hours[h] = (hours[h] || 0) + 1;
      });
      const sorted = Object.entries(hours).sort((a, b) => b[1] - a[1]);
      return {
        peak_hours: sorted.slice(0, 3).map(([h, c]) => `${h}:00 (${c})`),
        quiet_hours: sorted.slice(-3).map(([h, c]) => `${h}:00 (${c})`),
        all: hours,
      };
    } catch (_) { return null; }
  };

  // ===== 6. AI Insights card בדף הבית =====
  window.showAIInsights = async function () {
    const [risk, forecast, hourly] = await Promise.all([
      atRiskStudents(), forecastWeek(), hourlyPattern(),
    ]);
    let html = '<div class="card p-3 mt-3" style="background:linear-gradient(135deg,#ddd6fe,#c4b5fd);direction:rtl">';
    html += '<h6><i class="bi bi-stars"></i> תובנות AI</h6>';
    if (risk && risk.length) {
      html += '<div class="mt-2 small"><strong>⚠ תלמידים בסיכון:</strong><br>';
      risk.slice(0, 3).forEach(r => {
        html += `• ${escHtml(r.student)} (${r.score} ניקוד)<br>`;
      });
      html += '</div>';
    }
    if (forecast) {
      html += `<div class="mt-2 small">📊 <strong>תחזית שבוע:</strong> ${forecast.forecast_next_week} אירועים (${forecast.trend})</div>`;
    }
    if (hourly && hourly.peak_hours) {
      html += `<div class="mt-2 small">⏰ <strong>שעות שיא:</strong> ${hourly.peak_hours.join(', ')}</div>`;
    }
    html += '</div>';
    const home = document.getElementById('page-home');
    if (home && !home.querySelector('.ai-insights-card')) {
      const div = document.createElement('div');
      div.className = 'ai-insights-card';
      div.innerHTML = html;
      home.appendChild(div);
    }
  };
  setTimeout(showAIInsights, 3000);

  // ===== 7. סנטימנט בסיסי לתיאור =====
  window.sentimentScore = function (text) {
    text = String(text || '').toLowerCase();
    const positive = ['מצוין', 'טוב', 'מעולה', 'מצליח', 'התקדם', 'שמח', 'עזר', 'תרם', 'יוזמה'];
    const negative = ['רע', 'גרוע', 'נכשל', 'הרס', 'התפרץ', 'בכה', 'קלל', 'הרביץ', 'איים'];
    let score = 0;
    positive.forEach(w => { if (text.includes(w)) score++; });
    negative.forEach(w => { if (text.includes(w)) score--; });
    return score;
  };

  // ===== 8. AI badge per event =====
  setInterval(() => {
    document.querySelectorAll('[data-event-id]:not([data-sentimented])').forEach(card => {
      card.dataset.sentimented = '1';
      const desc = card.querySelector('.event-desc, .text-muted')?.textContent || '';
      const s = sentimentScore(desc);
      if (s !== 0) {
        const badge = document.createElement('span');
        badge.style.cssText = 'font-size:14px;margin:0 4px';
        badge.textContent = s > 0 ? '😊' : '😟';
        badge.title = s > 0 ? 'חיובי' : 'שלילי';
        const title = card.querySelector('strong');
        if (title) title.parentElement.insertBefore(badge, title);
      }
    });
  }, 3000);

  // ===== 9. השוואת רבנים =====
  window.compareRabbis = async function () {
    try {
      const r = await api('listBehavior', []);
      const events = r.data || [];
      const stats = {};
      events.forEach(e => {
        const rabbi = e['רב'] || e['דווח_עי'] || 'לא ידוע';
        if (!stats[rabbi]) stats[rabbi] = { total: 0, high: 0, positive: 0 };
        stats[rabbi].total++;
        if (e['חומרה'] === 'גבוהה') stats[rabbi].high++;
        if (sentimentScore(e['תיאור']) > 0) stats[rabbi].positive++;
      });
      return Object.entries(stats).map(([rabbi, s]) => ({
        rabbi, ...s,
        positive_pct: ((s.positive / s.total) * 100).toFixed(0) + '%',
      })).sort((a, b) => b.total - a.total);
    } catch (_) { return []; }
  };

  // ===== 10. Insights API =====
  window.fullAIReport = async function () {
    const [risk, forecast, hourly, rabbis] = await Promise.all([
      atRiskStudents(), forecastWeek(), hourlyPattern(), compareRabbis(),
    ]);
    console.group('🤖 דוח AI מלא');
    console.log('תלמידים בסיכון:', risk);
    console.log('תחזית:', forecast);
    console.log('דפוס שעתי:', hourly);
    console.log('השוואת רבנים:', rabbis);
    console.groupEnd();
    return { risk, forecast, hourly, rabbis };
  };

  console.warn('%c🤖 Pack-16 — AI Insights: trends, predictions, risk scoring, sentiment', 'color:#7c3aed;font-weight:bold');
  console.info('Try: atRiskStudents(), forecastWeek(), fullAIReport()');
})();
