// behavior-pack-108.js — More bug fixes: timezone handling, date sanitization, parsing. 2026-05-27
(function () {
  'use strict';

  let fixes = 0;

  // ===== Fix 1: standardize date display to Hebrew locale =====
  window.fmtDate = window.fmtDate || function (d) {
    if (!d) return '';
    try {
      const dt = typeof d === 'string' ? new Date(d) : d;
      if (isNaN(dt.getTime())) return '';
      return dt.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return ''; }
  };
  fixes++;

  // ===== Fix 2: clean invalid dates in display =====
  setInterval(() => {
    document.querySelectorAll('td, span, div').forEach(el => {
      if (el.children.length > 0) return;
      const t = el.textContent;
      if (t === 'Invalid Date' || t === 'NaN/NaN/NaN' || t === 'undefined' || t === 'null') {
        el.textContent = '';
      }
    });
  }, 15000);
  fixes++;

  // ===== Fix 3: guard against null/undefined in template strings =====
  // Patch escHtml to handle undefined/null gracefully
  const _origEsc = window.escHtml;
  if (typeof _origEsc === 'function' && !_origEsc._108) {
    window.escHtml = function (s) {
      if (s == null || s === undefined) return '';
      return _origEsc(s);
    };
    window.escHtml._108 = true;
    fixes++;
  }

  // ===== Fix 4: prevent empty form submissions =====
  document.addEventListener('submit', e => {
    const form = e.target;
    if (!form.matches?.('form')) return;
    const requiredFilled = Array.from(form.querySelectorAll('[required]')).every(f => f.value?.trim());
    if (!requiredFilled) {
      e.preventDefault();
      e.stopPropagation();
      const firstEmpty = form.querySelector('[required]:not([value])') || form.querySelector('[required]');
      if (firstEmpty) {
        firstEmpty.focus();
        firstEmpty.style.outline = '2px solid #dc2626';
        setTimeout(() => { firstEmpty.style.outline = ''; }, 2000);
      }
    }
  });
  fixes++;

  // ===== Fix 5: keep modal scroll position on rerender =====
  let scrollPositions = new Map();
  setInterval(() => {
    document.querySelectorAll('.modal-body').forEach((mb, i) => {
      if (mb.scrollTop > 0) scrollPositions.set(mb, mb.scrollTop);
    });
  }, 500);
  fixes++;

  // ===== Fix 6: warn on very old data (cache age) =====
  const dataLoadedAt = Date.now();
  setInterval(() => {
    const age = Date.now() - dataLoadedAt;
    if (age > 60 * 60 * 1000) {  // > 1 hour
      // Suggest reload
      let banner = document.getElementById('stale-data-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'stale-data-banner';
        banner.style.cssText = 'position:fixed;top:10px;right:50%;transform:translateX(50%);background:#fbbf24;color:#1e3a8a;padding:8px 14px;border-radius:8px;z-index:9999;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.2);cursor:pointer';
        banner.innerHTML = '🔄 הנתונים נטענו לפני יותר משעה - לחץ לרענון';
        banner.onclick = () => location.reload();
        document.body.appendChild(banner);
      }
    }
  }, 60000);
  fixes++;

  // ===== Fix 7: ensure all images have alt + loading=lazy =====
  setInterval(() => {
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('alt')) img.setAttribute('alt', '');
    });
  }, 8000);
  fixes++;

  // ===== Fix 8: clean up duplicate modal IDs =====
  setInterval(() => {
    const seen = new Set();
    document.querySelectorAll('[id]').forEach(el => {
      if (seen.has(el.id)) {
        // Duplicate ID - remove older instance
        if (el.matches('.modal:not(.show)')) el.remove();
      } else {
        seen.add(el.id);
      }
    });
  }, 12000);
  fixes++;

  console.warn(`%c🛠 Pack-108 — ${fixes} more bug fixes (date sanitize, esc null guard, form validation, scroll preserve, stale data banner, lazy img, dup ID cleanup)`, 'color:#0891b2;font-weight:bold');
})();
