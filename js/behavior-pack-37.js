// behavior-pack-37.js — Help & Onboarding. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Tour steps =====
  window.TOUR_STEPS = [
    { selector: '#page-home', title: 'ברוך הבא לבית התלמוד', body: 'זוהי המערכת המרכזית לניהול בית התלמוד. בוא נעבור על התכונות העיקריות.' },
    { selector: '[onclick*="students"]', title: 'תלמידים', body: 'כאן מנהלים את רשימת התלמידים ופרטיהם.' },
    { selector: '[onclick*="behavior"]', title: 'מעקב התנהגות', body: 'מתעדים אירועים יומיים של תלמידים.' },
    { selector: '[onclick*="tasks"]', title: 'משימות', body: 'ניהול משימות צוות בלוח Kanban.' },
    { selector: '[onclick*="settings"]', title: 'הגדרות', body: 'ניהול משתמשים והרשאות.' },
  ];

  // ===== 2. Run tour =====
  window.startTour = function () {
    let step = 0;
    function showStep() {
      if (step >= TOUR_STEPS.length) {
        document.getElementById('tour-overlay')?.remove();
        if (typeof toast === 'function') toast('🎉 סיום סיור! בהצלחה', 'success');
        localStorage.setItem('bht_tour_completed', '1');
        return;
      }
      const s = TOUR_STEPS[step];
      const target = document.querySelector(s.selector);
      if (!target) { step++; return showStep(); }
      const rect = target.getBoundingClientRect();
      let overlay = document.getElementById('tour-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'tour-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;direction:rtl';
        document.body.appendChild(overlay);
      }
      overlay.innerHTML = `
        <div style="position:absolute;left:${rect.left-4}px;top:${rect.top-4}px;width:${rect.width+8}px;height:${rect.height+8}px;border:3px solid #fbbf24;border-radius:8px;background:rgba(255,255,255,0.05);box-shadow:0 0 0 9999px rgba(0,0,0,0.6);pointer-events:none;animation:pulse 1.5s infinite"></div>
        <div style="position:absolute;top:${Math.min(rect.bottom+10, window.innerHeight-200)}px;left:${Math.max(20, Math.min(rect.left, window.innerWidth-340))}px;background:#fff;padding:20px;border-radius:8px;max-width:320px;box-shadow:0 8px 24px rgba(0,0,0,0.3)">
          <h5>${escHtml(s.title)} <small class="text-muted">(${step+1}/${TOUR_STEPS.length})</small></h5>
          <p>${escHtml(s.body)}</p>
          <div class="d-flex gap-2 justify-content-end">
            <button class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('tour-overlay').remove()">דלג</button>
            ${step > 0 ? `<button class="btn btn-outline-primary btn-sm" id="tour-prev">הקודם</button>` : ''}
            <button class="btn btn-primary btn-sm" id="tour-next">${step === TOUR_STEPS.length-1 ? 'סיים' : 'הבא'}</button>
          </div>
        </div>
      `;
      document.getElementById('tour-next').onclick = () => { step++; showStep(); };
      document.getElementById('tour-prev')?.addEventListener('click', () => { step--; showStep(); });
    }
    showStep();
  };

  // ===== 3. Auto-start tour for new users =====
  setTimeout(() => {
    if (!localStorage.getItem('bht_tour_completed') && !localStorage.getItem('bht_tour_skipped')) {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (u.username) {
        if (confirm('זוהי כניסה ראשונה? להתחיל סיור?')) startTour();
        else localStorage.setItem('bht_tour_skipped', '1');
      }
    }
  }, 5000);

  // ===== 4. Contextual help (?) =====
  window.HELP_BY_PAGE = {
    home: { title: 'דף הבית', tips: ['לחץ Ctrl+K לחיפוש מהיר', 'הסבבי שיפור פועלים אוטומטית'] },
    students: { title: 'תלמידים', tips: ['לחץ על שורה לפתיחת פרטים', 'חיפוש בראש הדף'] },
    behavior: { title: 'מעקב התנהגות', tips: ['Ctrl+Enter לשמירה מהירה', 'בחר רב מ-dropdown לסינון'] },
    tasks: { title: 'משימות', tips: ['גרור בין עמודות לשינוי סטטוס', 'Shift+Click לבחירה מרובה'] },
    staff: { title: 'ניהול צוות', tips: ['Ctrl+Shift+U לקיצור', 'לחץ על שורה לעריכה'] },
  };

  window.showContextHelp = function () {
    const page = location.hash.replace('#', '') || 'home';
    const help = HELP_BY_PAGE[page] || { title: page, tips: ['אין עזרה ספציפית'] };
    const html = `<div class="modal fade show" id="help-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-info-circle"></i> עזרה - ${escHtml(help.title)}</h5><button class="btn-close" onclick="document.getElementById('help-modal').remove()"></button></div>
          <div class="modal-body">
            <h6>💡 טיפים:</h6>
            <ul>${help.tips.map(t => `<li>${escHtml(t)}</li>`).join('')}</ul>
            <hr>
            <button class="btn btn-outline-primary btn-sm w-100" onclick="document.getElementById('help-modal').remove();startTour()">▶ התחל סיור מלא</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 5. Help button =====
  setTimeout(() => {
    if (document.getElementById('help-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'help-btn';
    btn.title = 'עזרה (?)';
    btn.setAttribute('aria-label', 'עזרה');
    btn.style.cssText = 'position:fixed;bottom:320px;left:14px;width:42px;height:42px;border-radius:50%;background:#2563eb;color:#fff;border:none;font-size:18px;cursor:pointer;box-shadow:0 4px 8px rgba(0,0,0,0.2);z-index:9990';
    btn.innerHTML = '?';
    btn.onclick = showContextHelp;
    document.body.appendChild(btn);
  }, 2500);

  // ===== 6. Tooltips on hover (for icons) =====
  setInterval(() => {
    document.querySelectorAll('button[aria-label]:not([data-tooltipped])').forEach(btn => {
      btn.dataset.tooltipped = '1';
      if (!btn.title) btn.title = btn.getAttribute('aria-label');
    });
  }, 3000);

  // ===== 7. What's new dialog =====
  window.WHATS_NEW = [
    { date: '2026-05-25', items: ['Pack 30-37: visualization, gamification, help, themes', 'תמיכת PWA + offline'] },
    { date: '2026-05-24', items: ['ניהול צוות + 16 רבנים', 'AI insights', 'Voice input'] },
  ];

  window.showWhatsNew = function () {
    const html = `<div class="modal fade show" id="wn-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>🎉 מה חדש</h5><button class="btn-close" onclick="document.getElementById('wn-modal').remove()"></button></div>
          <div class="modal-body">
            ${WHATS_NEW.map(w => `
              <h6>${escHtml(w.date)}</h6>
              <ul>${w.items.map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>
            `).join('')}
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 8. Spotlight on changed element =====
  window.spotlight = function (selector, durationMs) {
    const el = document.querySelector(selector);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const halo = document.createElement('div');
    halo.style.cssText = `position:fixed;left:${rect.left-8}px;top:${rect.top-8}px;width:${rect.width+16}px;height:${rect.height+16}px;border-radius:8px;box-shadow:0 0 0 4px rgba(251,191,36,0.5);pointer-events:none;z-index:9990;animation:pulse 1s infinite`;
    document.body.appendChild(halo);
    setTimeout(() => halo.remove(), durationMs || 3000);
  };

  // ===== 9. FAQ =====
  window.FAQ = [
    { q: 'איך מוסיפים תלמיד?', a: 'דף בית → תלמידים → "תלמיד חדש"' },
    { q: 'איך מסננים לפי רב?', a: 'בכל מעקב יש dropdown "סנן לפי רב"' },
    { q: 'איך מוחק משתמש?', a: 'הגדרות → לחץ על משתמש → מחק' },
    { q: 'איך משחזרים נתונים?', a: 'restoreFromFile() - העלאת קובץ גיבוי' },
    { q: 'איך מוסיפים תמונה?', a: 'גרור תמונה לתוך אירוע, או הדבק Ctrl+V' },
  ];

  // ===== 10. CSS animation =====
  const animStyle = document.createElement('style');
  animStyle.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `;
  document.head.appendChild(animStyle);

  console.warn('%c❓ Pack-37 — Help: tour, contextual help, tooltips, whats-new, FAQ, spotlight', 'color:#2563eb;font-weight:bold');
})();
