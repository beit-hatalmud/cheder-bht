// behavior-pack-33.js — Gamification (points, badges, levels). 2026-05-25
(function () {
  'use strict';

  // ===== 1. Points calculation per student =====
  window.studentPoints = function (events) {
    let points = 0;
    events.forEach(e => {
      const sev = e['חומרה'];
      const cat = e['קטגוריה'];
      if (cat === 'קידום כתיבה' || cat === 'קידום קריאה') points += 10;
      else if (cat === 'דרך ארץ') points += 15;
      else if (cat === 'חברה' && sev === 'נמוכה') points += 8;
      else if (cat === 'לימודים') points += 12;
      else if (sev === 'גבוהה') points -= 20;
      else if (sev === 'בינונית') points -= 10;
      else if (sev === 'נמוכה') points += 5;
    });
    return Math.max(0, points);
  };

  // ===== 2. Levels system =====
  window.LEVELS = [
    { name: 'מתחיל', minPoints: 0, icon: '🌱', color: '#6b7280' },
    { name: 'מתקדם', minPoints: 50, icon: '🌿', color: '#10b981' },
    { name: 'מצטיין', minPoints: 150, icon: '🌳', color: '#059669' },
    { name: 'אלוף', minPoints: 300, icon: '⭐', color: '#f59e0b' },
    { name: 'מצוין', minPoints: 500, icon: '🏆', color: '#dc2626' },
    { name: 'גיבור', minPoints: 1000, icon: '👑', color: '#7c3aed' },
  ];

  window.getLevel = function (points) {
    let level = LEVELS[0];
    for (const l of LEVELS) {
      if (points >= l.minPoints) level = l;
    }
    return level;
  };

  // ===== 3. Badges =====
  window.BADGES = [
    { id: 'first_week', name: 'שבוע ראשון', icon: '🎯', criteria: (events) => events.length >= 1 },
    { id: 'streak_7', name: '7 ימים רצופים', icon: '🔥', criteria: (events) => {
      const days = new Set(events.map(e => (e['תאריך']||'').slice(0, 10)));
      return days.size >= 7;
    } },
    { id: 'reader', name: 'קורא נלהב', icon: '📚', criteria: (events) =>
      events.filter(e => e['קטגוריה'] === 'קידום קריאה').length >= 5 },
    { id: 'writer', name: 'כותב מנוסה', icon: '✍', criteria: (events) =>
      events.filter(e => e['קטגוריה'] === 'קידום כתיבה').length >= 5 },
    { id: 'pray_master', name: 'אומן תפילה', icon: '🙏', criteria: (events) =>
      events.filter(e => e['קטגוריה'] === 'תפילה').length >= 10 },
    { id: 'good_friend', name: 'חבר טוב', icon: '🤝', criteria: (events) =>
      events.filter(e => e['קטגוריה'] === 'חברה' && e['חומרה'] === 'נמוכה').length >= 5 },
    { id: 'derech_eretz', name: 'דרך ארץ', icon: '👔', criteria: (events) =>
      events.filter(e => e['קטגוריה'] === 'דרך ארץ').length >= 3 },
    { id: 'clean_month', name: 'חודש נקי', icon: '✨', criteria: (events) => {
      const month = Date.now() - 30 * 86400000;
      return !events.some(e => new Date(e['תאריך']).getTime() > month && e['חומרה'] === 'גבוהה');
    } },
  ];

  window.studentBadges = function (events) {
    return BADGES.filter(b => b.criteria(events));
  };

  // ===== 4. Leaderboard =====
  window.leaderboard = async function (limit) {
    limit = limit || 10;
    try {
      const [st, ev] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const students = st.data || [];
      const events = ev.data || [];
      return students.map(s => {
        const stuEv = events.filter(e => String(e['תלמיד_מזהה']) === String(s['מזהה']));
        const points = studentPoints(stuEv);
        return {
          sid: s['מזהה'],
          name: `${s['שם פרטי']||''} ${s['שם משפחה']||''}`,
          points,
          level: getLevel(points),
          badges: studentBadges(stuEv).length,
        };
      }).sort((a, b) => b.points - a.points).slice(0, limit);
    } catch (_) { return []; }
  };

  // ===== 5. Leaderboard widget =====
  window.showLeaderboard = async function () {
    const board = await leaderboard(15);
    const html = `<div class="modal fade show" id="lb-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-trophy"></i> לוח המצטיינים</h5><button class="btn-close" onclick="document.getElementById('lb-modal').remove()"></button></div>
          <div class="modal-body">
            <table class="table">
              <thead><tr><th>#</th><th>תלמיד</th><th>רמה</th><th>נקודות</th><th>תגים</th></tr></thead>
              <tbody>${board.map((s, i) => `
                <tr>
                  <td>${i+1}${i<3 ? ' '+(['🥇','🥈','🥉'][i]) : ''}</td>
                  <td>${escHtml(s.name)}</td>
                  <td><span style="color:${s.level.color}">${s.level.icon} ${escHtml(s.level.name)}</span></td>
                  <td><strong>${s.points}</strong></td>
                  <td>${'🏅'.repeat(Math.min(s.badges, 5))}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 6. Achievement unlock animation =====
  window.celebrateBadge = function (badge) {
    if (typeof toast === 'function') toast(`🎉 פתחת תג: ${badge.icon} ${badge.name}!`, 'success', 4000);
    if ('vibrate' in navigator && document.documentElement.hasAttribute('data-user-interacted')) navigator.vibrate([100, 50, 100]);
    if (typeof playSound === 'function') playSound('success');
  };

  // ===== 7. Class points race =====
  window.classRace = async function () {
    try {
      const [st, ev] = await Promise.all([api('listStudents', []), api('listBehavior', [])]);
      const students = st.data || [];
      const events = ev.data || [];
      const classes = {};
      students.forEach(s => {
        const c = s['מחזור'] || '?';
        if (!classes[c]) classes[c] = { total: 0, count: 0 };
        const stuEv = events.filter(e => String(e['תלמיד_מזהה']) === String(s['מזהה']));
        classes[c].total += studentPoints(stuEv);
        classes[c].count++;
      });
      return Object.entries(classes).map(([c, d]) => ({
        class: c, total: d.total, avg: (d.total / d.count).toFixed(1),
      })).sort((a, b) => b.total - a.total);
    } catch (_) { return []; }
  };

  // ===== 8. Weekly champion =====
  window.weeklyChampion = async function () {
    try {
      const r = await api('listBehavior', []);
      const week = Date.now() - 7 * 86400000;
      const events = (r.data || []).filter(e => new Date(e['תאריך']).getTime() > week);
      const byStudent = {};
      events.forEach(e => {
        const sid = e['תלמיד_מזהה'];
        if (!byStudent[sid]) byStudent[sid] = { events: [], name: e['שם תלמיד'] };
        byStudent[sid].events.push(e);
      });
      const ranked = Object.entries(byStudent).map(([sid, d]) => ({
        sid, name: d.name, points: studentPoints(d.events),
      })).sort((a, b) => b.points - a.points);
      return ranked[0] || null;
    } catch (_) { return null; }
  };

  // ===== 9. Profile card with gamification =====
  window.studentGameCard = async function (sid) {
    try {
      const r = await api('listBehavior', []);
      const events = (r.data || []).filter(e => String(e['תלמיד_מזהה']) === String(sid));
      const points = studentPoints(events);
      const level = getLevel(points);
      const badges = studentBadges(events);
      return { points, level, badges, nextLevel: LEVELS.find(l => l.minPoints > points) };
    } catch (_) { return null; }
  };

  // ===== 10. Leaderboard button on home =====
  setTimeout(() => {
    const home = document.getElementById('page-home');
    if (!home || document.getElementById('home-lb-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'home-lb-btn';
    btn.className = 'btn btn-outline-warning btn-sm mt-3 me-2';
    btn.innerHTML = '🏆 לוח מצטיינים';
    btn.onclick = showLeaderboard;
    home.appendChild(btn);
  }, 4500);

  console.warn('%c🏆 Pack-33 — Gamification: points, 6 levels, 8 badges, leaderboard, class race', 'color:#f59e0b;font-weight:bold');
})();
