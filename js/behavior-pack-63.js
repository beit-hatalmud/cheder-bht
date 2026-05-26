// behavior-pack-63.js — Replace UI label "כיתה" → "שיעור" everywhere (text + attributes). 2026-05-26
// Doesn't touch data field names (מחזור), Hebrew letter class names (א/ב/ג), or code.
(function () {
  'use strict';

  // Replacement rules — most-specific first to avoid double-substitution.
  // We deliberately skip "מחזור" (data field) and keep אותיות א/ב/ג as-is.
  const RULES = [
    [/בכיתת/g, 'בשיעור'],
    [/לכיתת/g, 'לשיעור'],
    [/מכיתת/g, 'משיעור'],
    [/הכיתות/g, 'השיעורים'],
    [/הכיתה/g, 'השיעור'],
    [/בכיתה/g, 'בשיעור'],
    [/לכיתה/g, 'לשיעור'],
    [/מכיתה/g, 'משיעור'],
    [/כיתות/g, 'שיעורים'],
    [/כיתה/g, 'שיעור'],
  ];

  function transform(s) {
    if (!s || typeof s !== 'string') return s;
    let out = s;
    for (const [re, rep] of RULES) out = out.replace(re, rep);
    return out;
  }

  // Skip these elements entirely (their content is data/code, not UI)
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA']);
  // Skip nodes that are inputs/options whose value/text reflects raw data (class names)
  function shouldSkipNode(node) {
    let p = node.parentNode;
    while (p && p !== document.body) {
      if (SKIP_TAGS.has(p.tagName)) return true;
      // <option> inside a <select> that lists actual class values — keep raw
      if (p.tagName === 'OPTION' || p.tagName === 'SELECT') {
        // But options' visible text like "כיתה א" we DO want to translate
        // Only skip if it's a data-* dropdown that maps to מחזור values
        return false;
      }
      p = p.parentNode;
    }
    return false;
  }

  function walkText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !/כיתה|כיתות|בכיתה|הכיתה|לכיתה|מכיתה/.test(n.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (shouldSkipNode(n)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      const t = transform(node.nodeValue);
      if (t !== node.nodeValue) node.nodeValue = t;
    }
  }

  const ATTRS = ['placeholder', 'title', 'aria-label', 'data-bs-original-title', 'alt'];
  function walkAttrs(root) {
    const all = root.querySelectorAll('*');
    for (const el of all) {
      for (const a of ATTRS) {
        if (!el.hasAttribute(a)) continue;
        const v = el.getAttribute(a);
        const t = transform(v);
        if (t !== v) el.setAttribute(a, t);
      }
    }
  }

  function runOnce() {
    try {
      walkText(document.body);
      walkAttrs(document.body);
    } catch (e) {
      console.warn('Pack-63 transform error', e);
    }
  }

  // Initial sweep after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runOnce);
  } else {
    runOnce();
  }

  // Observe DOM mutations and re-sweep
  let pending = false;
  const obs = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      runOnce();
    });
  });
  obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  console.warn('%c📝 Pack-63 — UI label rename: "כיתה" → "שיעור"', 'color:#7c3aed;font-weight:bold');
})();
