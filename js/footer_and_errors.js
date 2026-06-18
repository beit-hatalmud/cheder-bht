/**
 * footer_and_errors.js — global footer + unhandled error catcher.
 *
 * Adds a slim site footer with "כל הזכויות שמורות", version, and a
 * short commit hash (passed via window.BHT_COMMIT). Also installs a
 * global error handler that surfaces unhandled rejections in the
 * notifications bell instead of letting them die silently.
 */
(function () {
  'use strict';

  const VERSION = '2026-06-18';
  const COMMIT = window.BHT_COMMIT || 'dev';

  function ensureFooter() {
    if (document.getElementById('bht-footer')) return;
    const f = document.createElement('footer');
    f.id = 'bht-footer';
    f.style.cssText = 'margin-top:40px;padding:14px 16px;text-align:center;color:#94a3b8;font-size:.78rem;border-top:1px solid #e2e8f0';
    f.innerHTML = `
      <div>© ${new Date().getFullYear()} בית התלמוד מעלה עמוס · כל הזכויות שמורות</div>
      <div style="margin-top:4px">
        גרסה ${VERSION} · build <code style="font-size:.85em">${COMMIT}</code> ·
        <a href="status.html" style="color:#2563eb;text-decoration:none">מצב המערכת</a> ·
        <a href="https://github.com/beit-hatalmud/cheder-bht" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:none">GitHub</a>
      </div>`;
    const container = document.querySelector('.container');
    if (container) container.appendChild(f);
    else document.body.appendChild(f);
  }

  function notifyOnce(text, kind) {
    try {
      if (window.bhtNotify) window.bhtNotify(text, kind || 'error');
      else console.warn('[bht]', text);
    } catch (_) {}
  }

  function installErrorBoundary() {
    window.addEventListener('error', (e) => {
      const msg = (e && (e.error && e.error.message || e.message)) || 'שגיאה לא ידועה';
      // Skip Chrome's noisy ResizeObserver loop warning
      if (msg.includes('ResizeObserver')) return;
      notifyOnce('שגיאה: ' + String(msg).slice(0, 120), 'error');
    });
    window.addEventListener('unhandledrejection', (e) => {
      const msg = (e && e.reason && (e.reason.message || e.reason.toString())) || 'דחייה ללא תפיסה';
      notifyOnce('שגיאת רשת: ' + String(msg).slice(0, 120), 'error');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureFooter();
    installErrorBoundary();
  });

  // Light helpers exposed for the admin menu (e.g. open Drive shortcut)
  window.bhtOpenDrive = function () {
    window.open('https://drive.google.com/drive/u/0/my-drive', '_blank', 'noopener');
  };
  window.bhtOpenBackupsFolder = function () {
    // Best effort: clipboard the local path so admin can paste in Explorer
    try {
      const p = 'C:\\Users\\יוסף שניידר\\bht_backups\\cheder-bht';
      navigator.clipboard && navigator.clipboard.writeText(p);
      alert('הנתיב הועתק:\n' + p + '\n\nהדבק ב-Explorer.');
    } catch (_) {
      alert('C:\\Users\\יוסף שניידר\\bht_backups\\cheder-bht');
    }
  };
})();
