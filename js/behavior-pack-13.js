// behavior-pack-13.js — סבב 13: AI suggestions + smart features. 2026-05-24
(function () {
  'use strict';

  // ===== 1. AI auto-suggest category from description =====
  window.suggestCategory = function (text) {
    text = String(text || '').toLowerCase();
    const rules = [
      { kw: ['הרביץ','בכה','אלימות','מכה','דחף','פגיעה'], cat: 'אלימות', severity: 'גבוהה' },
      { kw: ['חבר','משחק','שיתף','עזר','חברתי','קבוצה'], cat: 'חברה', severity: 'נמוכה' },
      { kw: ['למד','שינן','התרכז','שיעור','גמרא','משנה','חזרה'], cat: 'לימודים', severity: 'נמוכה' },
      { kw: ['כתב','כתיבה','עט','דף','עבודה'], cat: 'קידום כתיבה', severity: 'נמוכה' },
      { kw: ['קרא','קריאה','אותיות','ניקוד'], cat: 'קידום קריאה', severity: 'נמוכה' },
      { kw: ['התפלל','תפילה','שמונה עשרה','מנחה'], cat: 'תפילה', severity: 'נמוכה' },
      { kw: ['מצוה','דרך ארץ','כבד','עזר','דקדק'], cat: 'דרך ארץ', severity: 'נמוכה' },
      { kw: ['התפרץ','כעס','איים','השמיץ','קלל'], cat: 'התנהגות', severity: 'בינונית' },
    ];
    for (const r of rules) {
      if (r.kw.some(k => text.includes(k))) return { category: r.cat, severity: r.severity };
    }
    return { category: 'התנהגות', severity: 'נמוכה' };
  };

  // Auto-fill category when typing description in behavior modal
  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'b-desc' && e.target.value.length > 10) {
      const catSelect = document.getElementById('b-cat');
      const sevSelect = document.getElementById('b-severity');
      if (catSelect && !catSelect.dataset.userSet) {
        const s = suggestCategory(e.target.value);
        const opt = [...catSelect.options].find(o => o.value === s.category);
        if (opt) catSelect.value = s.category;
        if (sevSelect) {
          const sevOpt = [...sevSelect.options].find(o => o.value === s.severity);
          if (sevOpt) sevSelect.value = s.severity;
        }
      }
    }
  });
  document.addEventListener('change', e => {
    if (e.target && (e.target.id === 'b-cat' || e.target.id === 'b-severity')) {
      e.target.dataset.userSet = '1';
    }
  });

  // ===== 2. Smart suggestions from similar past events =====
  window.findSimilarEvents = async function (text, studentId) {
    if (!text || text.length < 10) return [];
    try {
      const r = await api('listBehavior', []);
      const events = (r.data || []).filter(e =>
        String(e['תלמיד_מזהה']) === String(studentId)
      ).slice(0, 50);
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      return events
        .map(e => ({
          event: e,
          score: words.filter(w => (e['תיאור']||'').toLowerCase().includes(w)).length,
        }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(x => x.event);
    } catch (_) { return []; }
  };

  // ===== 3. Weekly summary email =====
  window.generateWeeklySummary = async function () {
    try {
      const [ev, st] = await Promise.all([api('listBehavior', []), api('listStudents', [])]);
      const week = Date.now() - 7 * 86400000;
      const events = (ev.data || []).filter(e => new Date(e['תאריך']).getTime() > week);
      const highSeverity = events.filter(e => e['חומרה'] === 'גבוהה');
      const byCategory = {};
      events.forEach(e => { byCategory[e['קטגוריה']||'?'] = (byCategory[e['קטגוריה']||'?']||0)+1; });
      const byStudent = {};
      events.forEach(e => { byStudent[e['שם תלמיד']||'?'] = (byStudent[e['שם תלמיד']||'?']||0)+1; });
      const topStu = Object.entries(byStudent).sort((a,b)=>b[1]-a[1]).slice(0,5);
      return `📊 סיכום שבועי - בית התלמוד
תאריך: ${new Date().toLocaleDateString('he-IL')}

✏️ סה"כ אירועים: ${events.length}
🔴 חומרה גבוהה: ${highSeverity.length}

📌 לפי קטגוריה:
${Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`  • ${c}: ${n}`).join('\n')}

👥 תלמידים בולטים:
${topStu.map(([s,n])=>`  • ${s}: ${n} דיווחים`).join('\n')}

${highSeverity.length ? '⚠️ אירועים דורשי תשומת לב:\n'+highSeverity.slice(0,5).map(e=>`  • ${e['שם תלמיד']}: ${(e['תיאור']||'').substring(0,80)}`).join('\n') : ''}`;
    } catch (e) { return 'שגיאה: ' + e.message; }
  };

  window.emailWeeklySummary = async function () {
    const txt = await generateWeeklySummary();
    window.open(`mailto:?subject=${encodeURIComponent('סיכום שבועי - בית התלמוד')}&body=${encodeURIComponent(txt)}`, '_blank');
  };

  // ===== 4. Smart filters: "show me my events today" =====
  window.myEventsToday = async function () {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const r = await api('listBehavior', []);
    const today = new Date().toISOString().slice(0,10);
    return (r.data || []).filter(e =>
      (e['תאריך']||'').startsWith(today) &&
      (e['דווח_עי'] === user.username ||
       (e['רב']||'').includes(user.username) ||
       (e['דווח_עי']||'').includes(user.username))
    );
  };

  // ===== 5. Quick action button (floating) =====
  setTimeout(() => {
    if (document.getElementById('quick-action-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'quick-action-fab';
    fab.title = 'פעולה מהירה (Ctrl+/) ';
    fab.style.cssText = 'position:fixed;bottom:140px;left:14px;width:48px;height:48px;border-radius:50%;background:#16a34a;color:#fff;border:none;font-size:24px;cursor:pointer;box-shadow:0 4px 8px rgba(0,0,0,0.2);z-index:9990';
    fab.innerHTML = '⚡';
    fab.onclick = showQuickActions;
    document.body.appendChild(fab);
  }, 1500);

  window.showQuickActions = function () {
    if (document.getElementById('qa-modal')) return;
    const html = `<div class="modal fade show" id="qa-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-lightning"></i> פעולות מהירות</h5><button class="btn-close" onclick="document.getElementById('qa-modal').remove()"></button></div>
          <div class="modal-body">
            <button class="btn btn-outline-primary w-100 mb-2" onclick="document.getElementById('qa-modal').remove();goto('behavior');setTimeout(()=>{if(typeof addBehaviorModal==='function')addBehaviorModal()},200)">➕ אירוע חדש</button>
            <button class="btn btn-outline-success w-100 mb-2" onclick="document.getElementById('qa-modal').remove();if(typeof addTaskModal==='function')addTaskModal()">📋 משימה חדשה</button>
            <button class="btn btn-outline-info w-100 mb-2" onclick="document.getElementById('qa-modal').remove();openGlobalSearch()">🔍 חיפוש</button>
            <button class="btn btn-outline-warning w-100 mb-2" onclick="document.getElementById('qa-modal').remove();emailWeeklySummary()">📧 סיכום שבועי</button>
            <button class="btn btn-outline-secondary w-100" onclick="document.getElementById('qa-modal').remove();showNotifications()">🔔 התראות</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      showQuickActions();
    }
  });

  // ===== 6. Detect Friday/Shabbat reminders =====
  function checkShabbatReminder() {
    const day = new Date().getDay(); // 5 = Friday
    const hour = new Date().getHours();
    if (day === 5 && hour >= 10 && hour < 14 && !sessionStorage.getItem('shabbat_reminder')) {
      sessionStorage.setItem('shabbat_reminder', '1');
      notify('🕯️ שבת מתקרבת - סיים עבודה בזמן', 'warn');
    }
  }
  setTimeout(checkShabbatReminder, 5000);
  setInterval(checkShabbatReminder, 60 * 60 * 1000);

  // ===== 7. Year-cycle insights =====
  window.yearCycleStats = async function () {
    try {
      const r = await api('listBehavior', []);
      const byMonth = {};
      (r.data || []).forEach(e => {
        const m = (e['תאריך']||'').slice(0,7);
        if (m) byMonth[m] = (byMonth[m] || 0) + 1;
      });
      return Object.entries(byMonth).sort();
    } catch (_) { return []; }
  };

  // ===== 8. Bulk delete with multi-select =====
  let _bulkMode = false;
  window.toggleBulkMode = function () {
    _bulkMode = !_bulkMode;
    document.body.classList.toggle('bulk-mode', _bulkMode);
    if (_bulkMode && typeof toast === 'function') toast('מצב בחירה מרובה - לחץ על אירועים', 'info');
  };

  // ===== 9. Auto-save draft when typing event =====
  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'b-desc') {
      const v = e.target.value;
      if (v.length > 10) localStorage.setItem('bht_event_draft', v);
    }
  });
  // Restore draft on next time
  setTimeout(() => {
    const draft = localStorage.getItem('bht_event_draft');
    const desc = document.getElementById('b-desc');
    if (draft && desc && !desc.value) {
      // Don't restore - just hint
      desc.placeholder = '(טיוטה נשמרה - תקליד "draft" לשחזור)';
    }
  }, 2000);

  // ===== 10. Performance: lazy-load student photos =====
  const photoStyle = document.createElement('style');
  photoStyle.textContent = `
    img[data-src]:not([src]) { background: #e5e7eb; min-height: 50px; }
  `;
  document.head.appendChild(photoStyle);
  const photoObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && e.target.dataset.src) {
        e.target.src = e.target.dataset.src;
        delete e.target.dataset.src;
      }
    });
  });
  setInterval(() => {
    document.querySelectorAll('img[data-src]').forEach(img => photoObserver.observe(img));
  }, 3000);

  console.warn('%c🤖 Pack-13 — AI categorize, quick actions, weekly digest, shabbat reminder', 'color:#16a34a;font-weight:bold');
})();
