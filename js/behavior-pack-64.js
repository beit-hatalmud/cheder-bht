// behavior-pack-64.js — Live cameras viewer (Cloudflare Tunnel URL configurable). 2026-05-26
(function () {
  'use strict';

  const STORAGE_KEY = 'cameras_live_url';
  // Default Cloudflare Tunnel URL (Quick Tunnel — temporary, replace with named tunnel for production)
  const DEFAULT_URL = 'https://pressure-experts-rescue-subscribers.trycloudflare.com';

  function getLiveUrl() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL || '';
  }
  function setLiveUrl(u) {
    if (u) localStorage.setItem(STORAGE_KEY, u);
    else localStorage.removeItem(STORAGE_KEY);
  }
  function escAttrLocal(s) {
    return String(s || '').replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  // Override the existing renderCameras placeholder
  const _origRender = window.renderCameras;
  window.renderCameras = async function () {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    const url = getLiveUrl();
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isAdmin = u.username === 'admin' || u.role === 'מנהל';

    root.innerHTML = `
      <div class="mb-3"><button class="btn btn-link p-0" onclick="goto('home')"><i class="bi bi-arrow-right"></i> חזרה לתפריט</button></div>
      <div class="d-flex align-items-center mb-3">
        <h3 class="me-3 mb-0"><i class="bi bi-camera-video-fill text-danger"></i> מצלמות לייב</h3>
        <span class="badge bg-danger">LIVE</span>
        ${isAdmin ? `<button class="btn btn-sm btn-outline-primary ms-auto" onclick="window.openCamerasConfig()"><i class="bi bi-gear"></i> הגדרת URL</button>` : ''}
      </div>
      ${url ? `
        <div class="card p-4 text-center mb-3" style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);color:#fff">
          <i class="bi bi-broadcast fs-1 mb-2"></i>
          <h4>מצלמות המכינה - לייב</h4>
          <p class="mb-3">DVR/NVR ב-LAN הפנימי, נחשף ב-HTTPS דרך Cloudflare Tunnel</p>
          <a class="btn btn-light btn-lg" href="${escAttrLocal(url)}" target="_blank" rel="noopener">
            <i class="bi bi-box-arrow-up-right"></i> פתח את כל המצלמות
          </a>
          <div class="mt-2 small" style="opacity:.85">⚠ דורש התחברות ל-DVR (admin/סיסמה)</div>
        </div>
        <div class="alert alert-warning small">
          <b>למה לא inline?</b> ה-DVR שולח <code>X-Frame-Options: SAMEORIGIN</code> שחוסם הטמעה. הקישור למעלה פותח בחלון חדש.
        </div>
        <details class="mb-3">
          <summary class="text-muted small">נסיון Inline (סביר שיוצג ריק)</summary>
          <div class="ratio ratio-16x9 mt-2" style="background:#000;border-radius:8px;overflow:hidden">
            <iframe src="${escAttrLocal(url)}" allow="autoplay; fullscreen" allowfullscreen frameborder="0" style="border:0;width:100%;height:100%"></iframe>
          </div>
        </details>
        <div class="d-flex gap-2 small text-muted">
          <span>מקור: ${escAttrLocal(url.replace(/^https?:\/\//,'').split('/')[0])}</span>
        </div>
      ` : `
        <div class="card p-4 text-center mt-3">
          <i class="bi bi-camera-video-off fs-1 text-muted"></i>
          <p class="mt-3 mb-1"><b>אין URL מוגדר למצלמות לייב</b></p>
          <p class="small text-muted mb-3">מצלמות המכינה ב-LAN הפנימי. צריך Cloudflare Tunnel שיחשוף אותן כ-HTTPS ציבורי.</p>
          ${isAdmin ? `
            <div class="d-flex justify-content-center">
              <button class="btn btn-primary" onclick="window.openCamerasConfig()"><i class="bi bi-gear"></i> הגדר URL עכשיו</button>
            </div>
            <div class="alert alert-info text-end small mt-3 mx-auto" style="max-width:640px">
              <b>איך מקבלים URL?</b>
              <ol class="mb-0 mt-2">
                <li>על מחשב המכינה — מריצים: <code>cloudflared tunnel --url http://192.168.1.108:80</code></li>
                <li>cloudflared יחזיר URL כמו: <code>https://abc-xyz.trycloudflare.com</code></li>
                <li>מדביקים כאן בכפתור "הגדר URL"</li>
              </ol>
            </div>
          ` : '<p class="small text-muted">פנה למנהל להגדרת URL.</p>'}
        </div>
      `}
    `;
  };

  window.openCamerasConfig = function () {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (u.username !== 'admin' && u.role !== 'מנהל') {
      alert('רק מנהל יכול להגדיר');
      return;
    }
    const current = getLiveUrl();
    const html = `<div class="modal fade show" id="cam-cfg-modal" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header">
            <h5><i class="bi bi-camera-video"></i> הגדרת URL מצלמות לייב</h5>
            <button class="btn-close" onclick="document.getElementById('cam-cfg-modal').remove()"></button>
          </div>
          <div class="modal-body">
            <label class="form-label">URL ציבורי (Cloudflare Tunnel / ngrok / domain)</label>
            <input id="cam-url" type="url" class="form-control" placeholder="https://abc.trycloudflare.com" value="${escAttrLocal(current)}" style="direction:ltr;font-family:monospace">
            <div class="small text-muted mt-2">
              דוגמא: <code style="direction:ltr">https://cams.beit-hatalmud.com</code><br>
              ה-URL נשמר ב-localStorage של הדפדפן שלך בלבד.
            </div>
            <div class="form-check mt-3">
              <input type="checkbox" class="form-check-input" id="cam-broadcast">
              <label class="form-check-label" for="cam-broadcast">הפץ לכל הצוות (שמירה ב-sheet הגדרות מערכת)</label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger me-auto" onclick="if(confirm('למחוק URL?')){localStorage.removeItem('${STORAGE_KEY}');document.getElementById('cam-cfg-modal').remove();renderCameras();}">מחק</button>
            <button class="btn btn-secondary" onclick="document.getElementById('cam-cfg-modal').remove()">בטל</button>
            <button class="btn btn-primary" onclick="(async()=>{
              const v=document.getElementById('cam-url').value.trim();
              if(!v){alert('הזן URL');return;}
              if(!/^https?:\\/\\//.test(v)){alert('URL חייב להתחיל ב-http:// או https://');return;}
              localStorage.setItem('${STORAGE_KEY}',v);
              if(document.getElementById('cam-broadcast').checked && typeof api==='function'){
                try{ await api('cheder_appendRow',[{tab:'הגדרות_מערכת',row:JSON.stringify({'מפתח':'${STORAGE_KEY}','ערך':v,'תאריך':new Date().toISOString()})}]); }catch(e){}
              }
              document.getElementById('cam-cfg-modal').remove();
              renderCameras();
            })()">שמור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('cam-url').focus();
  };

  console.warn('%c📹 Pack-64 — Live cameras viewer (configurable URL)', 'color:#dc2626;font-weight:bold');
})();
