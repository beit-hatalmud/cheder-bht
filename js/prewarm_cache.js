/**
 * prewarm_cache.js — idle-time data warming.
 *
 * After the user lands on #home and the dashboard charts are rendered,
 * use requestIdleCallback to pre-fetch the lists the user is most
 * likely to open next (students, behavior, attendance, conversations,
 * tests, meetings) so the navigation to those pages feels instant.
 *
 * Only runs when:
 *   - a user is logged in,
 *   - the network is online,
 *   - we are on #home (or '' which defaults to home).
 *
 * api() already caches list results in module-level _data, so each
 * pre-fetch is a no-op next time the user actually opens that page.
 */
(function () {
  'use strict';
  const WARMED = new Set();
  const LISTS_TO_WARM = [
    'listStudents',
    'listBehavior',
    'listAttendance',
    'listConversations',
    'listTests',
    'listMeetings',
    'listMedications',
    'listFunctioning',
    'listCategories',
    'listClasses',
  ];

  function prewarmOnce(name) {
    if (WARMED.has(name)) return;
    WARMED.add(name);
    if (typeof api !== 'function') return;
    api(name, []).catch(() => { /* swallow */ });
  }

  function scheduleAll() {
    if (!navigator.onLine) return;
    if (!(sessionStorage.getItem('user') || localStorage.getItem('bht_remembered_user'))) return;
    const hash = location.hash.replace('#', '');
    if (hash && hash !== 'home') return;
    if (typeof requestIdleCallback === 'function') {
      LISTS_TO_WARM.forEach((name, i) => {
        requestIdleCallback(() => prewarmOnce(name), { timeout: 2500 + i * 600 });
      });
    } else {
      LISTS_TO_WARM.forEach((name, i) => setTimeout(() => prewarmOnce(name), 1500 + i * 500));
    }
  }

  // Wait until after the dashboard charts have had a chance to render, then warm.
  document.addEventListener('DOMContentLoaded', () => setTimeout(scheduleAll, 3500));
  window.addEventListener('hashchange', () => setTimeout(scheduleAll, 1500));
  // Once warmed, re-warm at 5-minute idle intervals so the user always
  // sees fresh data in the navigation drawer.
  setInterval(() => { WARMED.clear(); scheduleAll(); }, 5 * 60 * 1000);
})();
