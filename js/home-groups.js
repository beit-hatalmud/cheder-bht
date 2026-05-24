// home-groups.js — מחלק את הכרטיסים של דף הבית ל-4 קבוצות. 2026-05-24
(function() {
  const GROUPS = {
    1: ['students', 'behavior', 'writing', 'reading', 'lessonsKlein'],
    2: ['formsMgmt', 'projects', 'tasks', 'attendance', 'staff'],
    3: ['meetings', 'conversations', 'medications'],
    4: ['classview', 'functioning', 'tests', 'calendar', 'reports', 'cameras', 'feedback', 'settings'],
  };

  function distribute() {
    const source = document.getElementById('home-tiles-source');
    if (!source) return;
    const tiles = source.querySelectorAll('.card-tile');
    if (!tiles.length) return;
    // Build map: target name → tile element
    const map = {};
    tiles.forEach(t => {
      const oc = t.getAttribute('onclick') || '';
      const m = oc.match(/goto\(['"]([^'"]+)['"]\)/);
      if (m) map[m[1]] = t.closest('.col-md-6, .col-lg-3') || t.parentElement;
    });
    // Distribute into groups
    Object.entries(GROUPS).forEach(([n, names]) => {
      const target = document.getElementById('home-grp' + n);
      if (!target) return;
      target.innerHTML = '';
      names.forEach(name => {
        if (map[name]) {
          target.appendChild(map[name]);
        }
      });
    });
    // Leftovers → group 4
    const leftoverTarget = document.getElementById('home-grp4');
    Object.keys(map).forEach(name => {
      const assigned = Object.values(GROUPS).flat().includes(name);
      if (!assigned && leftoverTarget && map[name].parentElement === source) {
        leftoverTarget.appendChild(map[name]);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(distribute, 50));
  // Also re-run when home shown
  window.addEventListener('hashchange', () => {
    if (location.hash === '#home' || location.hash === '') setTimeout(distribute, 30);
  });
  // Initial
  setTimeout(distribute, 200);

  // Re-run when DOM changes (new tiles added by other scripts)
  try {
    const source = document.getElementById('home-tiles-source');
    if (source && window.MutationObserver) {
      new MutationObserver(() => setTimeout(distribute, 30)).observe(source, {childList: true});
    }
  } catch(_) {}

  console.log('%c✅ home-groups.js loaded', 'color:#2563eb;font-weight:bold');
})();
