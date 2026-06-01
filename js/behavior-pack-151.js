// behavior-pack-151.js — One-shot dedupe of behavior events created by the
// triple-bound save handler (now fixed). Runs on every load until clean.
// 2026-06-01.
(function () {
  'use strict';

  function eventKey(e) {
    // Two events are "the same" if they share student + category + description
    // AND were created within 10 seconds of each other (typical accidental
    // double-click window).
    const t = Date.parse(e['תאריך'] || '') || 0;
    const bucket = Math.floor(t / 10000); // 10-sec bucket
    return [
      e['תלמיד_מזהה'] || '',
      e['קטגוריה']   || '',
      (e['תיאור']    || '').trim().slice(0, 80),
      bucket,
    ].join('|');
  }

  function dedupe(arr) {
    const seen = new Map();
    const out = [];
    for (const e of arr) {
      const k = eventKey(e);
      const prev = seen.get(k);
      if (!prev) { seen.set(k, e); out.push(e); continue; }
      // Keep the one with the lowest מזהה (earlier/canonical)
      const prevId = parseInt(prev['מזהה'] || 0);
      const curId  = parseInt(e['מזהה']  || 0);
      if (curId && (!prevId || curId < prevId)) {
        const idx = out.indexOf(prev);
        if (idx >= 0) out[idx] = e;
        seen.set(k, e);
      }
      // else drop the duplicate
    }
    return out;
  }

  function run() {
    try {
      const raw = localStorage.getItem('cheder_bht_data');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!Array.isArray(data.behavior)) return;
      const before = data.behavior.length;
      data.behavior = dedupe(data.behavior);
      const after = data.behavior.length;
      if (after < before) {
        localStorage.setItem('cheder_bht_data', JSON.stringify(data));
        console.warn('%c🧹 Pack-151 — removed ' + (before - after) + ' duplicate behavior event(s)', 'color:#dc2626;font-weight:bold');
        // Also fix in-memory _events if it's already populated
        try {
          if (Array.isArray(window._events)) {
            window._events = dedupe(window._events);
            if (typeof window.drawEvents === 'function' && document.getElementById('b-list')) {
              window.drawEvents(window._events.filter(x => x['סטטוס_אישור'] !== 'ממתין לאישור'));
            }
          }
        } catch {}
      }
    } catch (e) { console.warn('[pack-151] dedupe failed:', e); }
  }

  run();
  // Also re-run after each save
  window.addEventListener('cheder-data-refreshed', () => setTimeout(run, 100));
})();
