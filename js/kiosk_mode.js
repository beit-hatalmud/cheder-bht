/**
 * kiosk_mode.js — classroom-screen rotation.
 *
 * Activate with #kiosk hash or ?kiosk=1 query. Auto-rotates between
 * the 4 dashboard charts in full-screen view every 12 seconds, no
 * navigation, no menu. Designed for a classroom display where the
 * staff want to glance at this week's status.
 *
 * Exit: Esc or click anywhere.
 */
(function () {
  'use strict';

  let _active = false;
  let _idx = 0;
  let _interval = null;

  const CHARTS = [
    { id: 'ch-behav-line',  title: 'ציון התנהגות שבועי' },
    { id: 'ch-behav-donut', title: 'סוגי אירועים השבוע' },
    { id: 'ch-tests-bar',   title: 'מבחנים אחרונים' },
    { id: 'ch-att-bar',     title: 'נוכחות השבוע' },
    { id: 'ch-class-bar',   title: 'ציוני התנהגות לפי כיתה' },
  ];

  function ensureLayer() {
    if (document.getElementById('kiosk-layer')) return;
    const layer = document.createElement('div');
    layer.id = 'kiosk-layer';
    layer.style.cssText = 'position:fixed;inset:0;background:#0f172a;color:#e2e8f0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px';
    layer.innerHTML = `
      <h2 id="kiosk-title" style="margin:0 0 12px 0;font-size:2.2rem">…</h2>
      <div id="kiosk-time" style="font-size:1rem;color:#94a3b8;margin-bottom:24px"></div>
      <div id="kiosk-chart-frame" style="width:min(90vw,1200px);height:min(70vh,700px);background:#1e293b;border-radius:16px;padding:20px;overflow:hidden;display:flex;align-items:center;justify-content:center"></div>
      <div style="margin-top:24px;color:#94a3b8;font-size:.85rem">Esc או לחיצה לסגירה · רוטציה כל 12 שניות</div>`;
    layer.onclick = stop;
    document.body.appendChild(layer);
    document.addEventListener('keydown', escHandler);
  }

  function escHandler(e) {
    if (e.key === 'Escape' && _active) stop();
  }

  function tick() {
    if (!_active) return;
    const c = CHARTS[_idx % CHARTS.length];
    document.getElementById('kiosk-title').textContent = c.title;
    document.getElementById('kiosk-time').textContent = new Date().toLocaleTimeString('he-IL');
    // Clone the live chart canvas into the frame
    const src = document.getElementById(c.id);
    const frame = document.getElementById('kiosk-chart-frame');
    if (src) {
      const tmp = document.createElement('canvas');
      tmp.width = src.width || 800;
      tmp.height = src.height || 400;
      tmp.style.width = '100%';
      tmp.style.height = '100%';
      const ctx = tmp.getContext('2d');
      try { ctx.drawImage(src, 0, 0); } catch (_) {}
      frame.innerHTML = '';
      frame.appendChild(tmp);
    } else {
      frame.innerHTML = '<div style="color:#94a3b8">אין נתונים</div>';
    }
    _idx++;
  }

  function start() {
    if (_active) return;
    _active = true;
    ensureLayer();
    // Ensure home renders first so charts exist
    location.hash = '#home';
    setTimeout(() => {
      tick();
      _interval = setInterval(tick, 12000);
    }, 1500);
  }

  function stop() {
    _active = false;
    if (_interval) clearInterval(_interval);
    _interval = null;
    const layer = document.getElementById('kiosk-layer');
    if (layer) layer.remove();
    document.removeEventListener('keydown', escHandler);
  }

  window.bhtKioskStart = start;
  window.bhtKioskStop = stop;

  function checkHash() {
    if (location.hash === '#kiosk' || location.search.includes('kiosk=1')) {
      setTimeout(start, 2500);
    }
  }
  window.addEventListener('hashchange', checkHash);
  document.addEventListener('DOMContentLoaded', () => setTimeout(checkHash, 2000));
})();
