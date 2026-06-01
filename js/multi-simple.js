// multi-simple.js — Same save-flow fix as behavior-simple.js but for ALL
// modules: reading, writing, lessonsKlein, conversations, meetings.
// Loaded after every module so it can wrap saveXxx and force-bypass debouncers.
// 2026-06-01.
(function () {
  'use strict';

  const SAVE_RENDER_MAP = {
    saveReading: { render: 'renderReading', label: 'קריאה' },
    saveWriting: { render: 'renderWriting', label: 'כתיבה' },
    saveLessonsKlein: { render: 'renderLessonsKlein', label: 'שיעורים' },
    saveConversation: { render: 'renderConversations', label: 'שיחה' },
    saveMeeting: { render: 'renderMeetings', label: 'אסיפה' },
    saveAttendance: { render: 'renderAttendance', label: 'נוכחות' },
  };

  function dbgBanner(msg, color) {
    let el = document.getElementById('bht-save-dbg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bht-save-dbg';
      el.style.cssText = 'position:fixed;top:60px;right:20px;min-width:300px;max-width:480px;background:#1e3a8a;color:#fff;padding:14px 18px;border-radius:10px;z-index:99999;font-family:Heebo,Arial,sans-serif;font-size:14px;direction:rtl;box-shadow:0 8px 24px rgba(0,0,0,0.3);white-space:pre-wrap;line-height:1.6';
      document.body.appendChild(el);
    }
    el.style.background = color || '#1e3a8a';
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { try { el.style.display = 'none'; } catch {} }, 5000);
  }

  function wrapSave(saveName, opts) {
    const orig = window[saveName];
    if (typeof orig !== 'function' || orig._multiSimpleWrapped) return;
    window[saveName] = async function (event) {
      dbgBanner('🔵 שומר ' + opts.label + '...');
      let r;
      try {
        // Set force-render flag BEFORE original save runs, so its trailing
        // renderXxx() call bypasses pack-50 + pack-107 debounces.
        window._forceRender = true;
        r = await orig.apply(this, arguments);
      } catch (e) {
        dbgBanner('🔴 שגיאה בשמירת ' + opts.label + ': ' + (e && e.message), '#dc2626');
        throw e;
      } finally {
        // Keep _forceRender on for 1 sec to cover any setTimeout(renderXxx, ...)
        setTimeout(() => { window._forceRender = false; }, 1000);
      }
      // ALSO try to force-render right now in case the orig swallowed the call
      try {
        if (opts.render && typeof window[opts.render] === 'function') {
          window._forceRender = true;
          window[opts.render]();
        }
      } catch {}
      dbgBanner('🟢 ✓ ' + opts.label + ' נשמר בהצלחה!', '#16a34a');
      return r;
    };
    window[saveName]._multiSimpleWrapped = true;
    console.warn('[multi-simple] wrapped', saveName);
  }

  function applyAll() {
    Object.keys(SAVE_RENDER_MAP).forEach(name => wrapSave(name, SAVE_RENDER_MAP[name]));
  }

  // Wrap on initial load + once more after a delay (some modules define their
  // save fn lazily inside a sub-IIFE that runs after our load).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }
  setTimeout(applyAll, 500);
  setTimeout(applyAll, 2000);

  console.warn('%c✅ multi-simple.js — bypassed save debounce for all categories', 'color:#16a34a;font-weight:bold;font-size:13px');
})();
