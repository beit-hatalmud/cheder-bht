// behavior-pack-77.js — CRITICAL FIX: CSP blocks blob: for hls.js + loadCameraReports null error. 2026-05-27
(function () {
  'use strict';

  // ===== Fix 1: Replace CSP to allow blob: for hls.js media =====
  // Remove old meta CSP from pack-14
  document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach(m => m.remove());
  // Add new permissive CSP that allows blob: for HLS streaming
  const csp = document.createElement('meta');
  csp.httpEquiv = 'Content-Security-Policy';
  csp.content = [
    "default-src 'self' https://*.googleapis.com https://*.google.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com 'unsafe-inline'",
    "img-src * data: blob:",
    "media-src * data: blob:",
    "connect-src *",
    "frame-src *",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://*.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' data: https://*.gstatic.com https://*.googleapis.com https://cdn.jsdelivr.net",
  ].join('; ');
  document.head.appendChild(csp);

  // ===== Fix 2: Stub loadCameraReports to no-op if grid is present =====
  if (typeof window.loadCameraReports === 'function') {
    const _origLCR = window.loadCameraReports;
    window.loadCameraReports = async function () {
      // If our pack-76 grid is already there, don't override
      const grid = document.getElementById('cam-grid');
      const list = document.getElementById('camera-reports-list');
      if (grid || !list) return; // pack-76 owns the page
      return _origLCR.apply(this, arguments);
    };
  }

  // ===== Fix 3: Force re-render cameras when page is shown =====
  const _origGoto = window.goto;
  if (typeof _origGoto === 'function') {
    window.goto = function (p) {
      const result = _origGoto.apply(this, arguments);
      if (p === 'cameras' && typeof window.renderCameras === 'function') {
        setTimeout(() => window.renderCameras(), 100);
      }
      return result;
    };
  }

  console.warn('%c🔓 Pack-77 — CRITICAL: CSP allows blob+media + loadCameraReports stub + goto re-render', 'color:#dc2626;font-weight:bold;font-size:14px');
})();
