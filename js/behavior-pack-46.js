// behavior-pack-46.js — Hebrew Calendar & Jewish Times. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Jewish months =====
  window.JEWISH_MONTHS = ['ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב'];

  // ===== 2. Parsha schedule (simplified) =====
  window.PARSHIYOT = ['בראשית','נח','לך לך','וירא','חיי שרה','תולדות','ויצא','וישלח','וישב','מקץ','ויגש','ויחי','שמות','וארא','בא','בשלח','יתרו','משפטים','תרומה','תצוה','כי תשא','ויקהל','פקודי','ויקרא','צו','שמיני','תזריע','מצורע','אחרי מות','קדושים','אמר','בהר','בחקתי','במדבר','נשא','בהעלתך','שלח','קרח','חקת','בלק','פנחס','מטות','מסעי','דברים','ואתחנן','עקב','ראה','שפטים','כי תצא','כי תבא','נצבים','וילך','האזינו','וזאת הברכה'];

  window.currentParsha = function () {
    // Approximate week-of-year calculation
    const start = new Date(new Date().getFullYear(), 8, 1); // Sep ~ start of year
    const diff = Date.now() - start.getTime();
    const week = Math.floor(diff / (7 * 86400000));
    return PARSHIYOT[Math.min(Math.max(0, week), PARSHIYOT.length - 1)];
  };

  // ===== 3. Hebrew day of week =====
  window.hebrewDayName = function (date) {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[new Date(date || Date.now()).getDay()];
  };

  // ===== 4. Approximate Hebrew date display =====
  window.formatHebDate = function (date) {
    try {
      return new Date(date).toLocaleDateString('he-IL-u-ca-hebrew', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (_) {
      return '';
    }
  };

  // ===== 5. Time of day blessings reminder =====
  window.dailyBlessings = function () {
    const h = new Date().getHours();
    const items = [];
    if (h >= 4 && h < 11) items.push({ time: 'בוקר', what: 'שחרית' });
    if (h >= 12 && h < 17) items.push({ time: 'צהריים', what: 'מנחה' });
    if (h >= 17 && h < 22) items.push({ time: 'ערב', what: 'מעריב' });
    return items;
  };

  // ===== 6. Hebrew month picker =====
  window.openHebMonthPicker = function (onSelect) {
    const html = `<div class="modal fade show" id="hm-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>בחר חודש עברי</h5><button class="btn-close" onclick="document.getElementById('hm-modal').remove()"></button></div>
          <div class="modal-body">
            <div class="row g-2">
              ${JEWISH_MONTHS.map((m, i) => `<div class="col-4"><button class="btn btn-outline-primary w-100" data-i="${i}">${m}</button></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('hm-modal').onclick = (e) => {
      const idx = e.target.closest('[data-i]')?.dataset.i;
      if (idx !== undefined) {
        if (onSelect) onSelect(JEWISH_MONTHS[idx], parseInt(idx));
        document.getElementById('hm-modal').remove();
      }
    };
  };

  // ===== 7. Friday warning =====
  setTimeout(() => {
    const day = new Date().getDay();
    if (day === 5) { // Friday
      const hour = new Date().getHours();
      if (hour >= 13 && hour < 18 && !sessionStorage.getItem('friday_warn')) {
        sessionStorage.setItem('friday_warn', '1');
        if (typeof notify === 'function') notify('🕯️ ערב שבת קרב - סיים עבודה בזמן', 'warn');
      }
    }
  }, 5000);

  // ===== 8. Year-cycle (zman) calculator =====
  window.zmanForDate = function (date) {
    date = date || new Date();
    const m = date.getMonth();
    const seasons = {
      0: 'חורף', 1: 'חורף', 2: 'אביב', 3: 'אביב', 4: 'אביב',
      5: 'קיץ', 6: 'קיץ', 7: 'קיץ', 8: 'סתיו', 9: 'סתיו',
      10: 'חורף', 11: 'חורף',
    };
    return { season: seasons[m], month: m + 1, parsha: currentParsha() };
  };

  // ===== 9. Hebrew calendar events =====
  window.HEBREW_EVENTS = {
    '01-15': { name: 'ט"ו בשבט', icon: '🌳' },
    '03-15': { name: 'פסח', icon: '🍷' },
    '04-21': { name: 'ל"ג בעומר', icon: '🔥' },
    '05-06': { name: 'שבועות', icon: '📜' },
    '08-09': { name: 'תשעה באב', icon: '🕯️' },
    '09-15': { name: 'ראש השנה', icon: '🍎' },
    '09-25': { name: 'יום כיפור', icon: '🤍' },
    '09-30': { name: 'סוכות', icon: '🛖' },
    '12-25': { name: 'חנוכה', icon: '🕎' },
  };

  // ===== 10. Hebrew calendar widget on home =====
  setTimeout(() => {
    if (document.getElementById('heb-cal-widget')) return;
    const home = document.getElementById('page-home');
    if (!home) return;
    const w = document.createElement('div');
    w.id = 'heb-cal-widget';
    w.className = 'alert alert-info py-2 mt-3';
    w.style.direction = 'rtl';
    const today = new Date();
    const zman = zmanForDate(today);
    w.innerHTML = `
      <strong>📅 ${escHtml(hebrewDayName())}</strong> ·
      ${escHtml(formatHebDate(today))} ·
      <span class="badge bg-light text-dark">${escHtml(zman.season)}</span>
      פרשת השבוע: <strong>${escHtml(zman.parsha)}</strong>
    `;
    home.appendChild(w);
  }, 4000);

  console.warn('%c📅 Pack-46 — Hebrew calendar: parsha, day names, blessings, friday warn, events', 'color:#92400e;font-weight:bold');
})();
