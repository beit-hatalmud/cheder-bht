// behavior-pack-24.js — Multi-language + Localization. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Translation strings =====
  window.STRINGS = {
    he: {
      home: 'בית', students: 'תלמידים', behavior: 'מעקב התנהגות',
      tasks: 'משימות', projects: 'פרויקטים', settings: 'הגדרות',
      logout: 'יציאה', save: 'שמור', cancel: 'בטל', delete: 'מחק',
      edit: 'ערוך', search: 'חיפוש', loading: 'טוען...',
      no_data: 'אין נתונים', confirm_delete: 'בטוח למחוק?',
    },
    en: {
      home: 'Home', students: 'Students', behavior: 'Behavior',
      tasks: 'Tasks', projects: 'Projects', settings: 'Settings',
      logout: 'Logout', save: 'Save', cancel: 'Cancel', delete: 'Delete',
      edit: 'Edit', search: 'Search', loading: 'Loading...',
      no_data: 'No data', confirm_delete: 'Confirm delete?',
    },
    yi: {
      home: 'היים', students: 'תלמידים', behavior: 'אויפֿפֿירונג',
      tasks: 'אויפֿגאַבעס', projects: 'פראיעקטן', settings: 'הגדרות',
      logout: 'אַרויסגיין', save: 'אויפֿהיטן', cancel: 'אַנולירן', delete: 'אויסמעקן',
    },
  };

  // ===== 2. Current language =====
  window.currentLang = localStorage.getItem('bht_lang') || 'he';

  window.setLanguage = function (lang) {
    if (!STRINGS[lang]) return;
    window.currentLang = lang;
    localStorage.setItem('bht_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'en') ? 'ltr' : 'rtl';
    if (typeof toast === 'function') toast(`שפה: ${lang}`, 'success');
    location.reload();
  };

  // ===== 3. Translate function =====
  window.t = function (key, fallback) {
    return STRINGS[currentLang]?.[key] || fallback || key;
  };

  // ===== 4. Hebrew dates =====
  window.formatHebrewDate = function (d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('he-IL-u-ca-hebrew', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  // ===== 5. RTL/LTR auto detection =====
  document.addEventListener('input', e => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
      const v = e.target.value;
      const heb = (v.match(/[א-ת]/g) || []).length;
      const lat = (v.match(/[a-zA-Z]/g) || []).length;
      if (lat > heb * 2) e.target.dir = 'ltr';
      else if (heb > 0) e.target.dir = 'rtl';
    }
  });

  // ===== 6. Number formatting (Hebrew style) =====
  window.formatNum = function (n) {
    return new Intl.NumberFormat('he-IL').format(n);
  };

  // ===== 7. Currency (NIS) =====
  window.formatNIS = function (n) {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(n);
  };

  // ===== 8. Relative time in Hebrew =====
  window.relativeTime = function (ts) {
    const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (sec < 60) return 'עכשיו';
    if (sec < 3600) return `לפני ${Math.floor(sec/60)} דק'`;
    if (sec < 86400) return `לפני ${Math.floor(sec/3600)} שעות`;
    if (sec < 604800) return `לפני ${Math.floor(sec/86400)} ימים`;
    if (sec < 2592000) return `לפני ${Math.floor(sec/604800)} שבועות`;
    return `לפני ${Math.floor(sec/2592000)} חודשים`;
  };

  // ===== 9. Language switcher button =====
  setTimeout(() => {
    if (document.getElementById('lang-switch')) return;
    const btn = document.createElement('button');
    btn.id = 'lang-switch';
    btn.className = 'btn btn-sm btn-link';
    btn.style.cssText = 'position:fixed;top:10px;left:10px;z-index:9990;font-size:18px';
    btn.textContent = currentLang === 'he' ? '🇺🇸' : '🇮🇱';
    btn.title = 'החלף שפה';
    btn.onclick = () => setLanguage(currentLang === 'he' ? 'en' : 'he');
    document.body.appendChild(btn);
  }, 2000);

  // ===== 10. Holiday detection =====
  window.HOLIDAYS = {
    '01-01': '🎊 ראש השנה האזרחית',
    '05-09': '🇮🇱 יום העצמאות',
  };

  setTimeout(() => {
    const today = new Date().toISOString().slice(5, 10);
    if (HOLIDAYS[today] && !sessionStorage.getItem('holiday_shown')) {
      sessionStorage.setItem('holiday_shown', '1');
      if (typeof notify === 'function') notify(HOLIDAYS[today], 'info');
    }
  }, 4000);

  console.warn('%c🌐 Pack-24 — i18n + Hebrew formats + RTL detect + language switch', 'color:#7c3aed;font-weight:bold');
})();
