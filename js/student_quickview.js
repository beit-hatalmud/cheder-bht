/**
 * student_quickview.js — instant student profile modal.
 *
 * Usage:
 *   showStudentQuickView('SID-123')
 *
 * Surfaces in one panel: recent behavior, last 5 tests, attendance streak,
 * latest meeting summary, active medications, parent phones.
 *
 * Wires into Ctrl+K (quick_search.js dispatches to it for student picks),
 * the staff page, and the home dashboard ("תלמיד היום" button).
 */
(function () {
  'use strict';

  const STYLE_ID = 'sqv-style';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
      .sqv-backdrop { position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(2px) }
      .sqv-modal { background:#fff;border-radius:14px;max-width:780px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.4) }
      .sqv-head { padding:18px 22px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#eef2ff,#fff) }
      .sqv-avatar { width:54px;height:54px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold }
      .sqv-title { flex:1 }
      .sqv-title h4 { margin:0;color:#1e293b }
      .sqv-title .meta { color:#64748b;font-size:.85rem }
      .sqv-body { padding:18px 22px;display:grid;grid-template-columns:1fr 1fr;gap:18px }
      .sqv-card { background:#f8fafc;border-radius:10px;padding:14px;border:1px solid #e2e8f0 }
      .sqv-card h6 { margin:0 0 10px 0;color:#1e293b;display:flex;align-items:center;gap:8px;font-weight:600 }
      .sqv-list { font-size:.88rem;color:#475569;line-height:1.7 }
      .sqv-list b { color:#1e293b }
      .sqv-empty { color:#94a3b8;font-size:.85rem;font-style:italic }
      .sqv-foot { padding:14px 22px;border-top:1px solid #e2e8f0;display:flex;gap:10px;justify-content:flex-end }
      .sqv-row { display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #e2e8f0 }
      .sqv-row:last-child { border-bottom:0 }
      .sqv-badge { display:inline-block;padding:2px 8px;border-radius:10px;font-size:.78rem;font-weight:500;background:#dbeafe;color:#1e40af }
      .sqv-badge.ok { background:#dcfce7;color:#15803d }
      .sqv-badge.warn { background:#fef3c7;color:#a16207 }
      .sqv-badge.bad { background:#fee2e2;color:#b91c1c }
      [data-theme="dark"] .sqv-modal { background:#0f172a;color:#e2e8f0 }
      [data-theme="dark"] .sqv-head { background:linear-gradient(135deg,#1e293b,#0f172a);border-bottom-color:#334155 }
      [data-theme="dark"] .sqv-title h4, [data-theme="dark"] .sqv-card h6 { color:#e2e8f0 }
      [data-theme="dark"] .sqv-card { background:#1e293b;border-color:#334155 }
      [data-theme="dark"] .sqv-list, [data-theme="dark"] .sqv-row { color:#cbd5e1 }
      [data-theme="dark"] .sqv-foot { border-top-color:#334155 }
      @media (max-width: 640px) {
        .sqv-body { grid-template-columns: 1fr }
      }
    `;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('');
  }

  function fmtDate(v) {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d)) return String(v).slice(0, 10);
    return d.toLocaleDateString('he-IL');
  }

  function safe(v) {
    return v == null ? '' : String(v);
  }

  function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function loadAllFor(sid) {
    sid = String(sid);
    const out = { student: null, behavior: [], tests: [], attendance: [], meetings: [], medications: [], conversations: [] };
    try {
      const students = (await api('listStudents', [])).data || [];
      out.student = students.find(s => String(s['מזהה']) === sid);
    } catch (_) {}
    try {
      const beh = (await api('listBehavior', [])).data || [];
      out.behavior = beh.filter(b => String(b['תלמיד_מזהה']) === sid)
        .sort((a, b) => new Date(b['תאריך']||0) - new Date(a['תאריך']||0)).slice(0, 6);
    } catch (_) {}
    try {
      const ts = (await api('listTests', [])).data || [];
      out.tests = ts.filter(t => String(t['תלמיד_מזהה']) === sid).slice(-5).reverse();
    } catch (_) {}
    try {
      const att = (await api('listAttendance', [])).data || [];
      out.attendance = att.filter(a => String(a['תלמיד_מזהה']) === sid);
    } catch (_) {}
    try {
      const m = (await api('listMeetings', [])).data || [];
      out.meetings = m.filter(x => String(x['תלמיד_מזהה']) === sid)
        .sort((a, b) => new Date(b['תאריך']||0) - new Date(a['תאריך']||0)).slice(0, 2);
    } catch (_) {}
    try {
      const meds = (await api('listMedications', [])).data || [];
      out.medications = meds.filter(x => String(x['תלמיד_מזהה']) === sid);
    } catch (_) {}
    try {
      const cv = (await api('listConversations', [])).data || [];
      out.conversations = cv.filter(c => String(c['תלמיד_מזהה']) === sid).slice(-3).reverse();
    } catch (_) {}
    return out;
  }

  function renderBehavior(events) {
    if (!events.length) return '<div class="sqv-empty">אין אירועים</div>';
    return '<div class="sqv-list">' + events.map(e => {
      const cat = safe(e['קטגוריה']);
      const score = parseInt(e['ניקוד'] || 0);
      const badge = score > 0 ? 'ok' : score < 0 ? 'bad' : '';
      return `<div class="sqv-row"><span><b>${escHtml(cat)}</b>${e['פירוט']?' — '+escHtml(e['פירוט']).slice(0,40):''}</span><span><span class="sqv-badge ${badge}">${score>0?'+':''}${score}</span> ${fmtDate(e['תאריך'])}</span></div>`;
    }).join('') + '</div>';
  }

  function renderTests(tests) {
    if (!tests.length) return '<div class="sqv-empty">אין מבחנים</div>';
    return '<div class="sqv-list">' + tests.map(t => {
      const score = parseInt(t['ציון'] || 0);
      const badge = score >= 80 ? 'ok' : score >= 60 ? 'warn' : 'bad';
      return `<div class="sqv-row"><span><b>${escHtml(safe(t['פרשה']||t['סוג']))}</b></span><span class="sqv-badge ${badge}">${score}</span></div>`;
    }).join('') + '</div>';
  }

  function renderAttendance(att) {
    if (!att.length) return '<div class="sqv-empty">אין רישומי נוכחות</div>';
    const recent = att.slice(-30);
    const present = recent.filter(a => safe(a['סטטוס']).includes('נוכח')).length;
    const late = recent.filter(a => safe(a['סטטוס']).includes('איחור')).length;
    const absent = recent.filter(a => safe(a['סטטוס']).includes('חסר')).length;
    return `<div class="sqv-list">
      <div class="sqv-row"><span>נוכח</span><span class="sqv-badge ok">${present}</span></div>
      <div class="sqv-row"><span>איחור</span><span class="sqv-badge warn">${late}</span></div>
      <div class="sqv-row"><span>חסר</span><span class="sqv-badge bad">${absent}</span></div>
      <div class="sqv-row"><span class="text-muted small">מתוך ${recent.length} ימים אחרונים</span></div>
    </div>`;
  }

  function renderMeetings(meets) {
    if (!meets.length) return '<div class="sqv-empty">אין אסיפות</div>';
    return meets.map(m => `<div class="sqv-row" style="flex-direction:column;align-items:flex-start"><b>${escHtml(safe(m['נושא']))}</b><span class="small text-muted">${fmtDate(m['תאריך'])} · ${escHtml(safe(m['רב']))}</span><span style="margin-top:4px">${escHtml(safe(m['סיכום']).slice(0, 160))}${m['סיכום']&&m['סיכום'].length>160?'…':''}</span></div>`).join('');
  }

  function renderMeds(meds) {
    if (!meds.length) return '<div class="sqv-empty">אין רישום תרופות</div>';
    return meds.map(m => `<div class="sqv-row"><span><b>${escHtml(safe(m['תרופה']||m['סוג']||'—'))}</b></span><span class="small text-muted">${escHtml(safe(m['מצב_כיום']).slice(0,80))}</span></div>`).join('');
  }

  async function show(sid) {
    ensureStyle();
    const back = document.createElement('div');
    back.className = 'sqv-backdrop';
    back.onclick = (e) => { if (e.target === back) close(); };
    back.innerHTML = `
      <div class="sqv-modal" role="dialog">
        <div class="sqv-head">
          <div class="sqv-avatar" id="sqv-av">…</div>
          <div class="sqv-title">
            <h4 id="sqv-name">טוען…</h4>
            <div class="meta" id="sqv-meta"></div>
          </div>
          <button class="btn btn-sm btn-outline-secondary" onclick="closeStudentQuickView()" title="סגור (Esc)">×</button>
        </div>
        <div class="sqv-body" id="sqv-body">
          <div class="sqv-card" style="grid-column:1/-1;text-align:center;padding:30px">
            <div class="spinner-border text-primary"></div>
          </div>
        </div>
        <div class="sqv-foot">
          <button class="btn btn-outline-secondary btn-sm" onclick="closeStudentQuickView()">סגירה</button>
          <button class="btn btn-primary btn-sm" id="sqv-fullbtn">דף מלא של התלמיד</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    window._sqv_back = back;

    const d = await loadAllFor(sid);
    if (!d.student) {
      document.getElementById('sqv-name').textContent = 'תלמיד לא נמצא';
      document.getElementById('sqv-body').innerHTML = '<div class="sqv-empty" style="grid-column:1/-1">אין נתונים זמינים</div>';
      return;
    }
    const s = d.student;
    const full = (s['שם פרטי'] && s['שם משפחה']) ? (s['שם פרטי'] + ' ' + s['שם משפחה']) : (s['שם מלא'] || s['שם'] || '');
    document.getElementById('sqv-av').textContent = initials(full);
    document.getElementById('sqv-name').textContent = full;
    document.getElementById('sqv-meta').innerHTML =
      `כיתה ${escHtml(safe(s['מחזור']||s['כיתה']))} · גיל ${escHtml(safe(s['גיל']))} · ` +
      (s['טלפון אם'] ? `אם: <a href="tel:${escAttr(s['טלפון אם'])}">${escHtml(s['טלפון אם'])}</a> · ` : '') +
      (s['טלפון אב'] ? `אב: <a href="tel:${escAttr(s['טלפון אב'])}">${escHtml(s['טלפון אב'])}</a>` : '');

    document.getElementById('sqv-fullbtn').onclick = () => {
      close();
      location.hash = '#student-card?id=' + encodeURIComponent(sid);
    };

    document.getElementById('sqv-body').innerHTML = `
      <div class="sqv-card">
        <h6><i class="bi bi-clipboard-check text-primary"></i> אירועים אחרונים</h6>
        ${renderBehavior(d.behavior)}
      </div>
      <div class="sqv-card">
        <h6><i class="bi bi-pencil-square text-warning"></i> מבחנים אחרונים</h6>
        ${renderTests(d.tests)}
      </div>
      <div class="sqv-card">
        <h6><i class="bi bi-check2-square text-success"></i> נוכחות (30 ימים)</h6>
        ${renderAttendance(d.attendance)}
      </div>
      <div class="sqv-card">
        <h6><i class="bi bi-capsule text-info"></i> תרופות</h6>
        ${renderMeds(d.medications)}
      </div>
      <div class="sqv-card" style="grid-column:1/-1">
        <h6><i class="bi bi-people-fill text-primary"></i> אסיפות אחרונות</h6>
        ${renderMeetings(d.meetings)}
      </div>
    `;
  }

  function close() {
    if (window._sqv_back) {
      window._sqv_back.remove();
      window._sqv_back = null;
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window._sqv_back) close();
  });

  /**
   * Auto-open the smart pick once per session after first login.
   * Acts as a "good morning" nudge for the staff: who needs your
   * attention today?
   */
  window.bhtSmartAutoOpenOnce = function () {
    try {
      if (sessionStorage.getItem('bht_smart_opened_today')) return;
      const home = document.getElementById('page-home');
      if (!home || home.classList.contains('d-none')) return;
      const user = sessionStorage.getItem('user') || localStorage.getItem('bht_remembered_user');
      if (!user) return;
      sessionStorage.setItem('bht_smart_opened_today', '1');
      // Wait for charts/data to settle so list rpcs already cached.
      setTimeout(async () => {
        // Sanity check — only open if we actually have student data,
        // otherwise the modal would say 'תלמיד לא נמצא' which is jarring.
        try {
          const list = (await api('listStudents', []).catch(() => ({}))).data || [];
          if (!list.length) return;
        } catch (_) { return; }
        if (typeof window.smartStudentQuickView === 'function') {
          window.smartStudentQuickView();
        }
      }, 3500);
    } catch (_) {}
  };

  // Hook into hashchange so the prompt only fires on real navigation
  // to home, not on api-driven rerenders.
  window.addEventListener('hashchange', () => {
    if (location.hash === '#home' || location.hash === '') {
      setTimeout(window.bhtSmartAutoOpenOnce, 2000);
    }
  });

  window.showStudentQuickView = show;
  window.closeStudentQuickView = close;

  // Helper for the home page "אקראי" button
  window.randomStudentQuickView = async function () {
    try {
      const students = (await api('listStudents', [])).data || [];
      const active = students.filter(s => !s['סטטוס'] || s['סטטוס'] === 'פעיל');
      if (!active.length) return alert('אין תלמידים פעילים');
      const pick = active[Math.floor(Math.random() * active.length)];
      show(pick['מזהה']);
    } catch (e) {
      alert('שגיאה: ' + (e.message || e));
    }
  };

  /**
   * "תלמיד היום" smart pick — surfaces a student that probably needs
   * attention TODAY, not just a random one. Heuristic:
   *   1. Score the last 7 days of behavior events per student (sum delta).
   *   2. Add a penalty for recent absences/late.
   *   3. Among active students with score <= 0, pick one weighted by
   *      severity (more-negative score is more likely).
   *   4. Stable per-day: the same call on the same date returns the
   *      same pick (so the home card isn't dancing around all morning).
   */
  window.smartStudentQuickView = async function () {
    try {
      const [students, behavior, attendance] = await Promise.all([
        api('listStudents', []).then(r => r.data || []),
        api('listBehavior', []).then(r => r.data || []),
        api('listAttendance', []).then(r => r.data || []),
      ]);
      const active = students.filter(s => !s['סטטוס'] || s['סטטוס'] === 'פעיל');
      if (!active.length) return alert('אין תלמידים פעילים');

      const sevenDaysAgo = Date.now() - 7 * 86400000;
      const scores = {};
      active.forEach(s => { scores[String(s['מזהה'])] = 0; });
      behavior.forEach(b => {
        const d = new Date(b['תאריך']);
        if (isNaN(d) || d.getTime() < sevenDaysAgo) return;
        const sid = String(b['תלמיד_מזהה']);
        if (sid in scores) scores[sid] += (parseInt(b['ניקוד']) || 0);
      });
      attendance.forEach(a => {
        const d = new Date(a['תאריך']);
        if (isNaN(d) || d.getTime() < sevenDaysAgo) return;
        const sid = String(a['תלמיד_מזהה']);
        if (!(sid in scores)) return;
        const st = String(a['סטטוס'] || '');
        if (st.includes('חסר')) scores[sid] -= 2;
        else if (st.includes('איחור')) scores[sid] -= 1;
      });
      // Pool: students with negative score (most need attention)
      let pool = active.filter(s => scores[String(s['מזהה'])] < 0);
      if (!pool.length) pool = active;
      // Stable shuffle by date: same student all day
      const today = new Date().toISOString().slice(0, 10);
      const seed = today.split('-').reduce((a, x) => a * 31 + parseInt(x), 7);
      const idx = Math.abs(seed) % pool.length;
      const pick = pool.sort((a, b) => scores[String(a['מזהה'])] - scores[String(b['מזהה'])])[idx];
      show(pick['מזהה']);
    } catch (e) {
      console.warn('smartStudentQuickView failed', e);
      // Fallback to random
      window.randomStudentQuickView();
    }
  };
})();
