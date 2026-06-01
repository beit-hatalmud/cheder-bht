// behavior-pack-89.js — Round 25: camera admin settings panel + tunnel URL config. 2026-05-27
(function () {
  'use strict';

  const HLS_KEY = 'cameras_hls_base';
  const WHEP_KEY = 'cameras_webrtc_base';
  const DVR_KEY = 'cameras_live_url';

  window.openCameraSettings = function () {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.username !== 'admin' && u.role !== 'מנהל') return alert('רק מנהל');

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const html = `<div class="modal fade show" id="cam-settings-89" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
            <h5><i class="bi bi-gear"></i> הגדרות מצלמות מתקדמות</h5>
            <button class="btn-close" onclick="document.getElementById('cam-settings-89').remove()"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info small">3 Cloudflare Tunnels פעילים. URL משתנה בכל reboot של mediamtx/cloudflared.</div>

            <label class="form-label fw-bold mt-2">URL לזרמי HLS</label>
            <input id="cs-hls" class="form-control" value="${esc(localStorage.getItem(HLS_KEY) || 'https://biodiversity-prairie-faq-shower.trycloudflare.com')}" style="direction:ltr;font-family:monospace">
            <div class="small text-muted">צריך לעבוד עם /{path}/index.m3u8</div>

            <label class="form-label fw-bold mt-3">URL ל-WebRTC (WHEP)</label>
            <input id="cs-whep" class="form-control" value="${esc(localStorage.getItem(WHEP_KEY) || 'https://erp-carbon-grip-autos.trycloudflare.com')}" style="direction:ltr;font-family:monospace">
            <div class="small text-muted">צריך לעבוד עם POST /{path}/whep</div>

            <label class="form-label fw-bold mt-3">URL ל-DVR (ניהול ישיר)</label>
            <input id="cs-dvr" class="form-control" value="${esc(localStorage.getItem(DVR_KEY) || 'https://heather-monster-embedded-encoding.trycloudflare.com')}" style="direction:ltr;font-family:monospace">
            <div class="small text-muted">לממשק admin של ה-DVR (Dahua 192.168.1.108)</div>

            <hr>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-primary" onclick="window.openTlaDashboard && openTlaDashboard()">דשבורד תל"א</button>
              <button class="btn btn-sm btn-outline-secondary" onclick="window.diagFull && diagFull()">אבחון מלא (Console)</button>
              <button class="btn btn-sm btn-outline-info" onclick="window.cameraStatus && cameraStatus()">סטטוס מצלמות</button>
              <button class="btn btn-sm btn-outline-warning" onclick="window.tunnelStatus && tunnelStatus()">סטטוס Tunnel</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger me-auto" onclick="localStorage.removeItem('${HLS_KEY}'); localStorage.removeItem('${WHEP_KEY}'); localStorage.removeItem('${DVR_KEY}'); document.getElementById('cam-settings-89').remove(); window.renderCameras && renderCameras();">איפוס לברירת מחדל</button>
            <button class="btn btn-secondary" onclick="document.getElementById('cam-settings-89').remove()">בטל</button>
            <button class="btn btn-primary" onclick="(()=>{
              const hls=document.getElementById('cs-hls').value.trim();
              const whep=document.getElementById('cs-whep').value.trim();
              const dvr=document.getElementById('cs-dvr').value.trim();
              if(hls) localStorage.setItem('${HLS_KEY}',hls);
              if(whep) localStorage.setItem('${WHEP_KEY}',whep);
              if(dvr) localStorage.setItem('${DVR_KEY}',dvr);
              document.getElementById('cam-settings-89').remove();
              if(window.renderCameras) renderCameras();
              if(typeof toast==='function') toast('הגדרות נשמרו ומצלמות מתחברות מחדש','success');
            })()">שמור והפעל מחדש</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== Add a gear button to cameras page header =====
  function injectGearButton() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    if (root.querySelector('#cam-gear-btn-89')) return;
    const header = root.querySelector('h3');
    if (!header) return;
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.username !== 'admin' && u.role !== 'מנהל') return;
    const btn = document.createElement('button');
    btn.id = 'cam-gear-btn-89';
    btn.className = 'btn btn-sm btn-outline-warning ms-2';
    btn.innerHTML = '<i class="bi bi-gear"></i> הגדרות';
    btn.onclick = window.openCameraSettings;
    header.appendChild(btn);
  }

  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const r = _orig.apply(this, arguments);
      setTimeout(injectGearButton, 200);
      return r;
    };
  }

  // ===== Keyboard shortcut: Ctrl+Shift+C opens settings =====
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (u.username === 'admin' || u.role === 'מנהל') {
        e.preventDefault();
        window.openCameraSettings();
      }
    }
  });

  console.warn('%c⚙ Pack-89 — Camera admin settings + Ctrl+Shift+C shortcut', 'color:#f59e0b;font-weight:bold');
  console.log('  Try: openCameraSettings()');
})();
