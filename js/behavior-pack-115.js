// behavior-pack-115.js — Production cleanup: silence verbose console.log + cleanup intervals on page leave. 2026-05-27
(function () {
  'use strict';

  // ===== Suppress non-critical console.log in production =====
  // Keep warn + error visible. Silence info + log.
  const isProd = location.hostname === 'beit-hatalmud.github.io';
  if (isProd && !window._consoleSilent115) {
    window._consoleSilent115 = true;
    const _origLog = console.log;
    const _origInfo = console.info;
    let logCount = 0;
    const MAX_PROD_LOGS = 100;

    console.log = function (...args) {
      // Only log pack init messages (color-coded with %c)
      if (args[0] && typeof args[0] === 'string' && args[0].startsWith('%c')) {
        return _origLog.apply(console, args);
      }
      logCount++;
      if (logCount <= MAX_PROD_LOGS) _origLog.apply(console, args);
      // else silent
    };
    console.info = function (...args) {
      logCount++;
      if (logCount <= MAX_PROD_LOGS) _origInfo.apply(console, args);
    };

    // Restore on demand
    window.enableVerboseLogs = function () {
      console.log = _origLog;
      console.info = _origInfo;
      console.warn('[Pack-115] verbose logs restored');
    };
  }

  // ===== Cleanup on page unload =====
  window.addEventListener('beforeunload', () => {
    // Close all WebRTC connections
    document.querySelectorAll('.cam-webrtc-card').forEach(card => {
      try { card._pc?.close(); } catch {}
    });
    // Destroy HLS instances
    document.querySelectorAll('video').forEach(v => {
      try { v._hls?.destroy(); } catch {}
    });
    // Cancel pending fetch requests (if AbortController used)
    if (window._abortControllers) {
      for (const c of window._abortControllers) {
        try { c.abort(); } catch {}
      }
    }
  });

  // ===== Heartbeat - verify app is responsive =====
  let lastHeartbeat = Date.now();
  setInterval(() => {
    const now = Date.now();
    const drift = now - lastHeartbeat - 5000;
    if (drift > 3000) {
      // Main thread was blocked for >3s
      console.warn(`[Pack-115] main thread blocked for ${drift}ms`);
    }
    lastHeartbeat = now;
  }, 5000);

  // ===== Detect & warn about large API responses =====
  if (window.fetch && !window.fetch._115) {
    const _origFetch = window.fetch;
    window.fetch = async function (...args) {
      try {
        const res = await _origFetch.apply(window, args);
        const cl = res.headers?.get?.('content-length');
        if (cl && parseInt(cl) > 1024 * 1024 * 2) {
          console.warn(`[Pack-115] LARGE response: ${(parseInt(cl)/1024/1024).toFixed(1)}MB from ${args[0]}`);
        }
        return res;
      } catch (e) {
        if (e.name !== 'AbortError') console.warn('[Pack-115] fetch failed:', args[0], e.message);
        throw e;
      }
    };
    window.fetch._115 = true;
  }

  console.warn('%c🧹 Pack-115 — Production cleanup: silence verbose logs, cleanup on unload, heartbeat, fetch monitoring', 'color:#64748b;font-weight:bold');
})();
