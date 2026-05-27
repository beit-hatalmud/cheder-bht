// behavior-pack-133.js — Refactor: 5 duplicate settings + Settings consolidation. 2026-05-27
(function () {
  'use strict';

  // ===== Identify duplicate settings panels (Gemini cleanup directive) =====
  // From audit: settings appear in multiple places. List them.
  const DUPLICATE_SETTINGS = [
    { id: 'theme', label: 'מצב תאורה', locations: ['toggleTheme button (navbar)', 'bhtPrefs theme', 'localStorage bht_theme'] },
    { id: 'cameras_url', label: 'URL מצלמות', locations: ['Pack-64 openCamerasConfig', 'Pack-89 openCameraSettings', 'localStorage cameras_hls_base'] },
    { id: 'compact_mode', label: 'מצב קומפקטי', locations: ['Pack-120 toggleCompactMode', 'bhtPrefs compact'] },
    { id: 'tla_visibility', label: 'תצוגת תל"א', locations: ['Pack-66 cameras_live_url', 'Pack-95 דוח_אישי TLA marker', 'settings page'] },
    { id: 'font_scale', label: 'גודל גופן', locations: ['Pack-120 setFontScale', 'browser default'] },
  ];

  // ===== Consolidated Settings Panel =====
  window.openConsolidatedSettings = function () {
    const u = (() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const isAdmin = u.username === 'admin' || u.role === 'מנהל';

    function esc(s) { return String(s||'').replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }

    const html = `<div class="modal fade show" id="cs-modal-133" style="display:block;background:rgba(0,0,0,0.5);z-index:9995" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-lg" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl;border-radius:var(--bht-radius-lg,12px);overflow:hidden">
          <div class="modal-header" style="background:linear-gradient(135deg,var(--bht-primary,#1e3a8a),var(--bht-primary-light,#3b82f6));color:#fff;border:0">
            <h5 style="margin:0;color:#fff"><i class="bi bi-sliders"></i> הגדרות מאוחדות</h5>
            <button class="btn-close btn-close-white" onclick="document.getElementById('cs-modal-133').remove()"></button>
          </div>
          <div class="modal-body" style="background:var(--bht-gray-50,#f9fafb)">
            <ul class="nav nav-tabs mb-3" id="cs-tabs">
              <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#cs-tab-ui">🎨 ממשק</a></li>
              <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#cs-tab-cameras">📹 מצלמות</a></li>
              ${isAdmin ? '<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#cs-tab-data">💾 נתונים</a></li>' : ''}
              ${isAdmin ? '<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#cs-tab-system">⚙ מערכת</a></li>' : ''}
            </ul>
            <div class="tab-content">
              <!-- UI Tab -->
              <div class="tab-pane fade show active" id="cs-tab-ui">
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🌙 מצב תאורה</strong>
                  <p class="small text-muted mb-2">בהיר / כהה</p>
                  <button class="btn btn-sm btn-outline-primary" onclick="if(typeof toggleTheme==='function')toggleTheme();">החלף</button>
                </div>
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>📏 מצב קומפקטי</strong>
                  <p class="small text-muted mb-2">פחות מרווחים, יותר תוכן במסך</p>
                  <button class="btn btn-sm btn-outline-primary" onclick="if(typeof toggleCompactMode==='function')toggleCompactMode();">החלף</button>
                </div>
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🔤 גודל גופן</strong>
                  <p class="small text-muted mb-2">Ctrl++ / Ctrl+- / Ctrl+0 לאיפוס</p>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" onclick="bumpFont(-0.1)">A-</button>
                    <button class="btn btn-outline-secondary" onclick="setFontScale(1)">1×</button>
                    <button class="btn btn-outline-secondary" onclick="bumpFont(0.1)">A+</button>
                  </div>
                </div>
              </div>
              <!-- Cameras Tab -->
              <div class="tab-pane fade" id="cs-tab-cameras">
                <div class="bht-card" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>📹 הגדרת URLs של מצלמות</strong>
                  <p class="small text-muted">לטונל HLS + WebRTC + DVR. דורש הרשאת מנהל.</p>
                  ${isAdmin ? '<button class="btn btn-sm btn-warning" onclick="if(typeof openCameraSettings===\'function\')openCameraSettings();">פתח הגדרות</button>' : '<small class="text-muted">פנה למנהל</small>'}
                </div>
              </div>
              ${isAdmin ? `
              <!-- Data Tab -->
              <div class="tab-pane fade" id="cs-tab-data">
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>💾 ניהול אחסון</strong>
                  <button class="btn btn-sm btn-outline-primary" onclick="window.showCachePanel && showCachePanel();">פתח</button>
                </div>
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>📤 תור Offline</strong>
                  <button class="btn btn-sm btn-outline-primary" onclick="window.viewQueue && viewQueue();">פתח</button>
                </div>
                <div class="bht-card" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🎓 דשבורד תל"א</strong>
                  <button class="btn btn-sm btn-outline-primary" onclick="window.openTlaDashboard && openTlaDashboard();">פתח</button>
                </div>
              </div>
              <!-- System Tab -->
              <div class="tab-pane fade" id="cs-tab-system">
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>📋 לוג שגיאות</strong>
                  <button class="btn btn-sm btn-outline-danger" onclick="window.viewErrorLog && viewErrorLog();">פתח</button>
                </div>
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🏥 בריאות מערכת</strong>
                  <button class="btn btn-sm btn-outline-success" onclick="document.querySelector('#health-badge-126')?.click();">פתח Health Panel</button>
                </div>
                <div class="bht-card mb-2" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🔄 סנכרון ידני</strong>
                  <button class="btn btn-sm btn-outline-info" onclick="window.BhtSync && BhtSync.syncAll().then(r => alert(JSON.stringify(r)));">סנכרן הכל</button>
                </div>
                <div class="bht-card" style="background:#fff;padding:14px;border-radius:8px;border:1px solid var(--bht-gray-200,#e5e7eb)">
                  <strong>🔍 בדיקת תקינות נתונים</strong>
                  <button class="btn btn-sm btn-outline-warning" onclick="window.runIntegrityCheck && runIntegrityCheck().then(r=>alert(JSON.stringify(r)));">הרץ</button>
                </div>
              </div>
              ` : ''}
            </div>
            <div class="alert alert-info small mt-3">
              <strong>💡 קיצורים:</strong> Ctrl+K (חיפוש) · Ctrl+Shift+H (בריאות) · Ctrl+Shift+L (שגיאות) · Ctrl+Shift+M (אחסון) · F1 (עזרה מלאה)
            </div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // Keyboard: Ctrl+, opens settings
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === ',') {
      e.preventDefault();
      window.openConsolidatedSettings();
    }
  });

  // Add a "gear" button to navbar
  setInterval(() => {
    if (document.getElementById('settings-gear-133')) return;
    const navbar = document.querySelector('.navbar .d-flex.align-items-center.gap-2');
    if (!navbar) return;
    const btn = document.createElement('button');
    btn.id = 'settings-gear-133';
    btn.className = 'btn btn-sm btn-outline-light';
    btn.title = 'הגדרות מאוחדות (Ctrl+,)';
    btn.setAttribute('aria-label', 'הגדרות');
    btn.innerHTML = '<i class="bi bi-sliders"></i>';
    btn.onclick = window.openConsolidatedSettings;
    navbar.insertBefore(btn, navbar.firstChild);
  }, 5000);

  console.warn('%c⚙ Pack-133 — Consolidated settings panel (4 tabs) + Ctrl+, shortcut', 'color:#0891b2;font-weight:bold');
  console.log('  Duplicate settings identified:', DUPLICATE_SETTINGS.length);
})();
