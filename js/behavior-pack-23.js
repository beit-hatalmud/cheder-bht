// behavior-pack-23.js — Student Wellbeing Tracking. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Wellbeing score per student =====
  window.wellbeingScore = function (events) {
    if (!events.length) return 50;
    const sev = e => ({'גבוהה':-3,'בינונית':-1,'נמוכה':+1})[e['חומרה']] || 0;
    const raw = events.reduce((s,e)=>s+sev(e), 0);
    return Math.max(0, Math.min(100, 50 + raw * 5));
  };

  // ===== 2. Mood tracker - daily check-in =====
  window.recordMood = function (sid, mood, notes) {
    const log = JSON.parse(localStorage.getItem('bht_moods') || '{}');
    if (!log[sid]) log[sid] = [];
    log[sid].push({ ts: Date.now(), mood, notes: notes||'' });
    localStorage.setItem('bht_moods', JSON.stringify(log));
  };

  window.moodHistory = function (sid) {
    try {
      const log = JSON.parse(localStorage.getItem('bht_moods') || '{}');
      return log[sid] || [];
    } catch (_) { return []; }
  };

  // ===== 3. Wellbeing dashboard =====
  window.wellbeingDashboard = async function () {
    try {
      const [stRes, evRes] = await Promise.all([api('listStudents',[]), api('listBehavior',[])]);
      const students = stRes.data || [];
      const events = evRes.data || [];
      const month = Date.now() - 30*86400000;
      return students.map(s => {
        const stuEv = events.filter(e => String(e['תלמיד_מזהה'])===String(s['מזהה']) && new Date(e['תאריך']).getTime() > month);
        return {
          name: `${s['שם פרטי']||''} ${s['שם משפחה']||''}`,
          sid: s['מזהה'],
          score: wellbeingScore(stuEv),
          recent_events: stuEv.length,
          mood_logs: moodHistory(s['מזהה']).length,
        };
      }).sort((a,b)=>a.score-b.score);
    } catch (_) { return []; }
  };

  // ===== 4. Color code wellbeing =====
  window.wellbeingColor = function (score) {
    if (score >= 75) return '#16a34a';
    if (score >= 50) return '#f59e0b';
    if (score >= 25) return '#dc2626';
    return '#7c2d12';
  };

  // ===== 5. Daily check-in widget =====
  window.checkInWidget = function (sid) {
    const html = `<div class="modal fade show" id="checkin-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>איך אתה מרגיש היום?</h5><button class="btn-close" onclick="document.getElementById('checkin-modal').remove()"></button></div>
          <div class="modal-body text-center">
            <div style="font-size:48px">
              <button class="btn btn-link p-2" onclick="recordMood('${sid}','great');toast?.('נשמר','success');document.getElementById('checkin-modal').remove()">😄</button>
              <button class="btn btn-link p-2" onclick="recordMood('${sid}','good');toast?.('נשמר','success');document.getElementById('checkin-modal').remove()">🙂</button>
              <button class="btn btn-link p-2" onclick="recordMood('${sid}','ok');toast?.('נשמר','success');document.getElementById('checkin-modal').remove()">😐</button>
              <button class="btn btn-link p-2" onclick="recordMood('${sid}','sad');toast?.('נשמר','warn');document.getElementById('checkin-modal').remove()">😔</button>
              <button class="btn btn-link p-2" onclick="recordMood('${sid}','bad');toast?.('נשמר','warn');document.getElementById('checkin-modal').remove()">😢</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 6. Identify students needing attention =====
  window.studentsNeedingAttention = async function () {
    const dash = await wellbeingDashboard();
    return dash.filter(s => s.score < 40 || s.recent_events > 5);
  };

  // ===== 7. Positive reinforcement reminder =====
  setInterval(async () => {
    try {
      const needs = await studentsNeedingAttention();
      if (!needs.length) return;
      const key = `posrein_${new Date().toISOString().slice(0,10)}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      if (typeof notify === 'function') notify(`💛 ${needs.length} תלמידים זקוקים לחיזוק חיובי`, 'info');
    } catch (_) { }
  }, 4 * 60 * 60 * 1000);

  // ===== 8. Wellbeing badge in student card =====
  setInterval(async () => {
    const modal = document.getElementById('viewStuModal');
    if (!modal || modal.dataset.wbAdded) return;
    modal.dataset.wbAdded = '1';
    try {
      const dash = await wellbeingDashboard();
      const sidMatch = modal.querySelector('[onclick*="addEventForStudent"]')?.getAttribute('onclick')?.match(/addEventForStudent\((\d+)\)/);
      if (!sidMatch) return;
      const sid = sidMatch[1];
      const entry = dash.find(s => String(s.sid) === sid);
      if (!entry) return;
      const header = modal.querySelector('.modal-header h5');
      if (header) {
        const badge = document.createElement('span');
        badge.className = 'badge ms-2';
        badge.style.background = wellbeingColor(entry.score);
        badge.style.color = '#fff';
        badge.textContent = `שלומות: ${entry.score}`;
        header.appendChild(badge);
      }
    } catch (_) { }
  }, 2000);

  // ===== 9. Streaks - days without incident =====
  window.daysSinceLastIncident = async function (sid) {
    try {
      const r = await api('listBehavior', []);
      const stu = (r.data || []).filter(e => String(e['תלמיד_מזהה'])===String(sid) && e['חומרה']==='גבוהה');
      if (!stu.length) return Infinity;
      const latest = stu.sort((a,b)=>new Date(b['תאריך'])-new Date(a['תאריך']))[0];
      return Math.floor((Date.now() - new Date(latest['תאריך']).getTime()) / 86400000);
    } catch (_) { return null; }
  };

  // ===== 10. Achievements / badges system =====
  window.checkAchievements = async function (sid) {
    const achievements = [];
    const days = await daysSinceLastIncident(sid);
    if (days === Infinity) achievements.push({ icon:'🏆', name:'ללא חומרה גבוהה', desc:'אף פעם!' });
    else if (days >= 30) achievements.push({ icon:'🌟', name:'חודש מצוין', desc:`${days} ימים`});
    else if (days >= 7) achievements.push({ icon:'⭐', name:'שבוע מצוין', desc:`${days} ימים`});
    return achievements;
  };

  console.warn('%c💛 Pack-23 — Wellbeing: score, mood tracker, check-in, achievements, streaks', 'color:#dc2626;font-weight:bold');
})();
