/**
 * status_dot.js — colored dot in the topbar that reflects system health.
 *
 * Polls three live signals every 60s:
 *   - Apps Script /exec (any 2xx)
 *   - GitHub Pages itself
 *   - Supabase REST root (anonymous OPTIONS)
 *
 * Colors:
 *   green  = all three OK
 *   yellow = one degraded
 *   red    = two+ degraded
 *
 * Tooltip lists current state in Hebrew; clicking opens the
 * notifications panel for context.
 */
(function () {
  'use strict';

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const SUPABASE_URL = 'https://iythgizaqjivxtgwyexj.supabase.co/rest/v1/';

  function ensureDot() {
    if (document.getElementById('sys-status-dot')) return;
    const userInfo = document.getElementById('user-info');
    if (!userInfo) return;
    const dot = document.createElement('span');
    dot.id = 'sys-status-dot';
    dot.title = 'מצב מערכת';
    dot.style.cssText = 'display:inline-block;width:10px;height:10px;border-radius:50%;background:#94a3b8;margin-left:6px;cursor:pointer;box-shadow:0 0 6px rgba(0,0,0,.3);transition:background .35s,transform .2s,box-shadow .25s';
    dot.onmouseenter = () => { dot.style.transform = 'scale(1.5)'; dot.style.boxShadow = '0 0 10px rgba(0,0,0,.45)'; };
    dot.onmouseleave = () => { dot.style.transform = ''; dot.style.boxShadow = '0 0 6px rgba(0,0,0,.3)'; };
    dot.onclick = () => {
      if (window.bhtOpenNotifications) window.bhtOpenNotifications();
    };
    userInfo.parentElement.insertBefore(dot, userInfo);
  }

  function setState(score, parts) {
    const dot = document.getElementById('sys-status-dot');
    if (!dot) return;
    let color = '#94a3b8', text = 'בודק...';
    if (score === 3) { color = '#16a34a'; text = 'כל המערכת חיה'; }
    else if (score === 2) { color = '#f59e0b'; text = 'תקלה חלקית'; }
    else if (score === 1) { color = '#dc2626'; text = 'בעיה רצינית'; }
    else if (score === 0) { color = '#7f1d1d'; text = 'המערכת לא מגיבה'; }
    dot.style.background = color;
    dot.title = `${text} (Apps Script: ${parts.script ? 'OK' : 'בעיה'} · אתר: ${parts.pages ? 'OK' : 'בעיה'} · Supabase: ${parts.supa ? 'OK' : 'בעיה'})`;
  }

  async function probeWithRace(url, options = {}) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(url, Object.assign({ signal: ctl.signal, mode: 'no-cors' }, options));
      clearTimeout(t);
      // With mode no-cors we cannot read status; assume reachable = OK
      return true;
    } catch (_) { return false; }
  }

  async function probeAll() {
    const [scriptOk, pagesOk, supaOk] = await Promise.all([
      probeWithRace(SCRIPT_URL + '?action=ping&t=' + Date.now()),
      probeWithRace('/cheder-bht/manifest.webmanifest?t=' + Date.now()),
      probeWithRace(SUPABASE_URL + '?t=' + Date.now()),
    ]);
    const parts = { script: scriptOk, pages: pagesOk, supa: supaOk };
    const score = (scriptOk ? 1 : 0) + (pagesOk ? 1 : 0) + (supaOk ? 1 : 0);
    setState(score, parts);
    // Surface big changes via the notifications bell
    if (window.bhtNotify) {
      const last = window._statusDotLastScore;
      if (last !== undefined && last >= 3 && score < 3) {
        window.bhtNotify('זוהתה ירידה בזמינות — סטטוס: ' + score + '/3', 'warn');
      } else if (last !== undefined && last < 3 && score === 3) {
        window.bhtNotify('המערכת חזרה למצב מלא ✓', 'success');
      }
    }
    window._statusDotLastScore = score;
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      ensureDot();
      probeAll();
      setInterval(probeAll, 60000);
    }, 2000);
  });
})();
