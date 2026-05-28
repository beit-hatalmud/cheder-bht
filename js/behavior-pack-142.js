// behavior-pack-142.js — Skeleton-loader API + premium toast polish. 2026-05-28
//
// Public surface:
//   window.bhtSkeleton.show(container, opts?)  — replace content with N skeleton rows
//   window.bhtSkeleton.hide(container)         — remove skeleton overlay
//   window.bhtSkeleton.injectIntoEmpty(selector, opts?)  — show skeletons in empty containers
//
// Toast polish: wraps the existing window.toast (from pack-111 / app.js) so
// each toast has a type-icon, slide-out animation, and softer shadow — without
// changing the call signature.
(function () {
  'use strict';

  // ─────────────────────── Skeleton CSS (additive) ───────────────────────
  if (!document.getElementById('bht-skel-style-142')) {
    const s = document.createElement('style');
    s.id = 'bht-skel-style-142';
    s.textContent = `
      .bht-skel-wrap { display: grid; gap: 12px; padding: 6px; }
      .bht-skel { position: relative; overflow: hidden;
        background: #e5e7eb; border-radius: 10px;
        height: var(--bht-skel-h, 64px);
      }
      .bht-skel.dark, body.dark-mode .bht-skel { background:#374151; }
      .bht-skel::after { content:""; position:absolute; inset:0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
        animation: bht-skel-shimmer 1.4s infinite;
      }
      body.dark-mode .bht-skel::after { background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent); }
      @keyframes bht-skel-shimmer { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
      .bht-skel-row { height: 18px; }
      .bht-skel-card { height: 110px; border-radius: 12px; }
      .bht-skel-tile { height: 140px; border-radius: 14px; }
      .bht-skel-table { height: 56px; }
      @media print { .bht-skel-wrap { display:none !important; } }
    `;
    document.head.appendChild(s);
  }

  function asEl(c) {
    if (!c) return null;
    if (typeof c === 'string') return document.querySelector(c);
    return c.nodeType === 1 ? c : null;
  }

  const SKEL = {
    show(container, opts) {
      const el = asEl(container);
      if (!el) return;
      opts = opts || {};
      const rows = Math.max(1, Math.min(20, opts.rows | 0 || 4));
      const variant = opts.variant || 'row'; // row | card | tile | table
      el.dataset.bhtSkelOrig = el.dataset.bhtSkelOrig || '';
      // Save the current inner HTML once (so hide() can restore if nothing else replaced it).
      if (!el.dataset.bhtSkelArmed) {
        el.dataset.bhtSkelArmed = '1';
        el.dataset.bhtSkelOrigHtml = el.innerHTML || '';
      }
      const klass = 'bht-skel bht-skel-' + variant;
      const cells = Array.from({ length: rows }, () => `<div class="${klass}"></div>`).join('');
      el.innerHTML = `<div class="bht-skel-wrap" data-bht-skel-host>${cells}</div>`;
    },
    hide(container) {
      const el = asEl(container);
      if (!el) return;
      const host = el.querySelector('[data-bht-skel-host]');
      if (host) host.remove();
      delete el.dataset.bhtSkelArmed;
      delete el.dataset.bhtSkelOrigHtml;
    },
    injectIntoEmpty(selector, opts) {
      const list = document.querySelectorAll(selector);
      list.forEach(el => {
        const isEmpty = !el.children.length && !(el.textContent || '').trim();
        if (isEmpty) SKEL.show(el, opts);
      });
    },
  };
  window.bhtSkeleton = SKEL;

  // ─────────────────────── Auto-inject skeletons (best-effort) ───────────────────────
  // On nav to data-heavy pages, if the main container is empty, show skeletons
  // briefly. Real renderers will replace them when data arrives.
  const AUTO_TARGETS = [
    { hash: '#home',     selector: '#home-grp1, #home-grp2', variant: 'tile', rows: 4 },
    { hash: '#students', selector: '#students-tbody, #students-list, [data-page="students"] tbody', variant: 'table', rows: 6 },
    { hash: '#behavior', selector: '#behavior-list, [data-page="behavior"] tbody', variant: 'table', rows: 6 },
  ];
  function autoInject() {
    const h = location.hash || '#home';
    for (const t of AUTO_TARGETS) {
      if (h !== t.hash) continue;
      const els = document.querySelectorAll(t.selector);
      els.forEach(el => {
        if (el.children.length === 0 && !(el.textContent || '').trim()) {
          SKEL.show(el, { variant: t.variant, rows: t.rows });
        }
      });
    }
  }
  window.addEventListener('hashchange', () => setTimeout(autoInject, 50));
  // Hide skeletons after data refresh
  window.addEventListener('cheder-data-refreshed', () => {
    document.querySelectorAll('[data-bht-skel-host]').forEach(host => {
      const parent = host.parentElement;
      if (parent && (parent.children.length === 1 || parent.querySelector(':scope > [data-bht-skel-host]'))) {
        // Don't blank a container that we're its only child — leave for the renderer to repaint.
      }
      host.remove();
    });
  });
  if (document.readyState === 'complete') setTimeout(autoInject, 200);
  else window.addEventListener('load', () => setTimeout(autoInject, 200));

  // ─────────────────────── Toast polish (wraps existing window.toast) ───────────────────────
  if (!document.getElementById('bht-toast-style-142')) {
    const s = document.createElement('style');
    s.id = 'bht-toast-style-142';
    s.textContent = `
      #toast-container-111 > div {
        display:flex !important; align-items:center; gap:10px;
        backdrop-filter: blur(4px);
        border-radius: 12px !important;
        box-shadow: 0 8px 24px rgba(0,0,0,.18) !important;
        font-family: Heebo, sans-serif !important;
        animation: bht-toast-in 0.22s cubic-bezier(.16,1,.3,1) !important;
      }
      #toast-container-111 > div::before {
        font-size: 18px; line-height:1; flex: none;
      }
      #toast-container-111 > div.bht-t-success::before { content: "✓"; }
      #toast-container-111 > div.bht-t-error::before   { content: "✗"; }
      #toast-container-111 > div.bht-t-warn::before    { content: "⚠"; }
      #toast-container-111 > div.bht-t-info::before    { content: "ℹ"; }
      @keyframes bht-toast-in { from { transform: translateY(8px); opacity: 0 } to { transform: none; opacity: 1 } }
      @keyframes bht-toast-out { from { transform: none; opacity: 1 } to { transform: translateY(8px); opacity: 0 } }
      .bht-toast-leaving { animation: bht-toast-out 0.22s ease-in forwards !important; }
    `;
    document.head.appendChild(s);
  }
  if (typeof window.toast === 'function' && !window.toast._142_polish) {
    const orig = window.toast;
    window.toast = function (msg, type, duration) {
      const ret = orig.apply(this, arguments);
      // After the original toast appends a child, decorate the newest one with our class.
      const c = document.getElementById('toast-container-111');
      if (c && c.lastElementChild) {
        const last = c.lastElementChild;
        const t = (type === 'warning' ? 'warn' : type) || 'info';
        last.classList.add('bht-t-' + t);
        // Hook smooth leave: orig calls t.remove() after duration. We intercept remove() once.
        const _remove = last.remove.bind(last);
        let removed = false;
        last.remove = function () {
          if (removed) return _remove();
          removed = true;
          last.classList.add('bht-toast-leaving');
          setTimeout(_remove, 220);
        };
      }
      return ret;
    };
    window.toast._142_polish = true;
  }

  console.warn('%c💎 Pack-142 — Skeleton API (window.bhtSkeleton) + premium toast polish', 'color:#7c3aed;font-weight:bold');
})();
