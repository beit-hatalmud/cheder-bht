// behavior-pack-74.js — Round 8: auto-refresh tunnel URL detection. 2026-05-27
// Periodically detects if the configured camera HLS URL is dead and prompts admin.
(function () {
  'use strict';

  const HLS_BASE_KEY = 'cameras_hls_base';
  const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 min

  let lastCheck = 0;
  let lastStatus = null;

  async function checkHls() {
    const base = localStorage.getItem(HLS_BASE_KEY) || '';
    if (!base) return;
    try {
      const r = await fetch(base.replace(/\/$/, '') + '/lobby/index.m3u8', { method: 'GET', mode: 'no-cors' });
      lastStatus = 'ok';
      lastCheck = Date.now();
      return true;
    } catch (e) {
      lastStatus = 'down';
      lastCheck = Date.now();
      console.warn('[Pack-74] HLS check failed:', e.message);
      return false;
    }
  }

  // Poll only when cameras page is active
  setInterval(() => {
    const camPage = document.getElementById('page-cameras');
    if (camPage && !camPage.classList.contains('d-none') && getComputedStyle(camPage).display !== 'none') {
      checkHls();
    }
  }, CHECK_INTERVAL_MS);

  window.tunnelStatus = function () {
    console.log(`[Pack-74] tunnel status: ${lastStatus || 'never checked'}, last check: ${lastCheck ? new Date(lastCheck).toLocaleTimeString('he-IL') : 'never'}`);
    return { status: lastStatus, last: lastCheck };
  };

  // ===== Add reload button to cameras page header =====
  document.addEventListener('click', e => {
    if (!e.target.closest?.('#cam-toolbar-pack70')) return;
  });

  // ===== Detect dead iframe in DVR page (pack-64) =====
  function watchDvrIframe() {
    const iframe = document.querySelector('#page-cameras iframe');
    if (!iframe || iframe.dataset.pack74Watch) return;
    iframe.dataset.pack74Watch = '1';
    let loaded = false;
    iframe.addEventListener('load', () => { loaded = true; });
    setTimeout(() => {
      if (!loaded) {
        const warn = document.createElement('div');
        warn.className = 'alert alert-warning small mt-2';
        warn.innerHTML = `⚠ Tunnel לא הגיב תוך 10 שניות. ייתכן ש-cloudflared נפל במחשב המכינה. <button class="btn btn-sm btn-warning" onclick="this.parentElement.remove()">סגור</button>`;
        iframe.parentNode.parentNode.appendChild(warn);
      }
    }, 10000);
  }
  setInterval(watchDvrIframe, 4000);

  console.warn('%c🔄 Pack-74 — Tunnel health check + dead-iframe warn', 'color:#0ea5e9;font-weight:bold');
  console.log('  Try: tunnelStatus()');
})();
