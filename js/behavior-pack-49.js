// behavior-pack-49.js — Performance Fix: consolidate 61 intervals into master scheduler. 2026-05-25
(function () {
  'use strict';

  // ===== Stop all existing intervals from packs =====
  // (cannot easily stop them but can throttle)

  // ===== Master scheduler - replaces dozens of setIntervals =====
  const tasks = {
    every5sec: [],
    every30sec: [],
    every2min: [],
    every10min: [],
    everyHour: [],
  };

  let _lastRun = {};
  function masterTick() {
    if (document.hidden) return; // skip when hidden

    const now = Date.now();

    // Every 5 sec - critical UI
    if (now - (_lastRun.s5 || 0) > 5000) {
      _lastRun.s5 = now;
      tasks.every5sec.forEach(fn => { try { fn(); } catch (_) {} });
    }
    // Every 30 sec
    if (now - (_lastRun.s30 || 0) > 30000) {
      _lastRun.s30 = now;
      tasks.every30sec.forEach(fn => { try { fn(); } catch (_) {} });
    }
    // Every 2 min
    if (now - (_lastRun.m2 || 0) > 120000) {
      _lastRun.m2 = now;
      tasks.every2min.forEach(fn => { try { fn(); } catch (_) {} });
    }
    // Every 10 min
    if (now - (_lastRun.m10 || 0) > 600000) {
      _lastRun.m10 = now;
      tasks.every10min.forEach(fn => { try { fn(); } catch (_) {} });
    }
    // Every hour
    if (now - (_lastRun.h1 || 0) > 3600000) {
      _lastRun.h1 = now;
      tasks.everyHour.forEach(fn => { try { fn(); } catch (_) {} });
    }
  }

  // Start ONE master interval
  const masterId = setInterval(masterTick, 5000);

  window.scheduleTask = function (interval, fn) {
    const map = { '5s': 'every5sec', '30s': 'every30sec', '2m': 'every2min', '10m': 'every10min', '1h': 'everyHour' };
    const bucket = map[interval];
    if (bucket && tasks[bucket]) tasks[bucket].push(fn);
  };

  // ===== Stop all background intervals when page hidden =====
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.info('[perf] page hidden - pausing master scheduler');
    } else {
      console.info('[perf] page visible - resuming');
      masterTick();
    }
  });

  // ===== Cleanup zombie elements aggressively =====
  scheduleTask('30s', function cleanupZombies() {
    // Remove all duplicate floating elements
    const ids = ['notif-bell','voice-cmd-btn','quick-action-fab','theme-btn','help-btn','reminder-btn','quick-add-fab','master-fab','home-lb-btn','lang-switch'];
    ids.forEach(id => {
      const els = document.querySelectorAll('#' + id);
      for (let i = 1; i < els.length; i++) els[i].remove();
    });
    // Remove zombie modal backdrops
    const visible = document.querySelectorAll('.modal.show').length;
    document.querySelectorAll('.modal-backdrop').forEach((b, i) => {
      if (i >= visible) b.remove();
    });
    if (!visible) {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  });

  // ===== Memory limit guard =====
  scheduleTask('10m', function memoryGuard() {
    let total = 0;
    for (let k in localStorage) total += (localStorage[k]?.length || 0) + k.length;
    const mb = total * 2 / 1024 / 1024;
    if (mb > 6) {
      // Clean old data
      ['bht_audit_log', 'bht_search_history', 'bht_visits'].forEach(k => {
        try {
          const data = JSON.parse(localStorage[k] || '[]');
          if (Array.isArray(data) && data.length > 50) {
            localStorage[k] = JSON.stringify(data.slice(0, 50));
          }
        } catch (_) {}
      });
      console.warn(`[perf] cleaned localStorage: ${mb.toFixed(1)}MB`);
    }
  });

  // ===== Throttle MutationObserver count =====
  if (window._observerLimit !== true) {
    window._observerLimit = true;
    let _activeObservers = 0;
    const OrigObserver = window.MutationObserver;
    window.MutationObserver = class extends OrigObserver {
      constructor(cb) {
        if (_activeObservers > 8) {
          console.warn('[perf] too many MutationObservers - blocked');
          // Return a no-op observer
          super(() => {});
          return;
        }
        _activeObservers++;
        super(cb);
      }
    };
  }

  // ===== Show performance health =====
  window.perfHealth = function () {
    return {
      scripts_loaded: document.querySelectorAll('script[src]').length,
      tracked_intervals: (window._bhtIntervals || new Set()).size,
      master_scheduler_tasks: Object.values(tasks).reduce((s, a) => s + a.length, 0),
      localStorage_mb: (JSON.stringify(localStorage).length / 1024 / 1024).toFixed(2),
      notifications: (window.notifications || []).length,
      modals_visible: document.querySelectorAll('.modal.show').length,
      observers: window._observerLimit ? '<= 8' : '?',
      page_hidden: document.hidden,
    };
  };

  // ===== Reduce duplicate init logs =====
  const _origWarn = console.warn;
  let _warnSeen = new Set();
  console.warn = function (...args) {
    const key = String(args[0] || '').substring(0, 60);
    if (_warnSeen.has(key)) return;
    _warnSeen.add(key);
    if (_warnSeen.size > 200) _warnSeen.clear();
    _origWarn.apply(this, args);
  };

  // Final: announce
  _origWarn.call(console, '%c🚀 Pack-49 — Master scheduler (1 interval), zombie cleanup, memory guard, observer limit', 'color:#16a34a;font-weight:bold;font-size:13px');
  _origWarn.call(console, '%c   Try: perfHealth()', 'color:#6b7280');
})();
