/**
 * group_help.js — small ? icon next to each home group title with a
 * Hebrew tooltip describing what the group is for.
 */
(function () {
  'use strict';

  const GROUP_HELP = {
    'home-group-1': 'פעולות שמורה עושה כל יום: התנהגות, נוכחות, שיחות, תלמידים, לוח שנה.',
    'home-group-2': 'מעקבים אקדמיים ורפואיים: כתיבה, קריאה, שיעורים פרטניים, מבחנים, תפקוד, תרופות.',
    'home-group-3': 'ניהול והגדרות: אסיפות, משימות, פרויקטים, צוות, דוחות, מצלמות, הגדרות מערכת.',
  };

  function inject() {
    Object.entries(GROUP_HELP).forEach(([cls, msg]) => {
      const group = document.querySelector('.' + cls);
      if (!group) return;
      const title = group.querySelector('.home-group-title');
      if (!title || title.querySelector('.bht-help')) return;
      const q = document.createElement('span');
      q.className = 'bht-help';
      q.style.cssText = 'display:inline-block;width:18px;height:18px;border-radius:50%;background:#e2e8f0;color:#475569;font-size:.75rem;font-weight:600;text-align:center;line-height:18px;cursor:help;margin-right:8px;vertical-align:middle';
      q.textContent = '?';
      q.title = msg;
      title.appendChild(q);
    });
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(inject, 800));
  window.addEventListener('hashchange', () => {
    if (location.hash === '#home' || location.hash === '') setTimeout(inject, 400);
  });
})();
