// tools/build-bundle.js — concatenate behavior-pack-*.js in numeric order.
// Each pack is an IIFE so plain concat preserves isolation + execution semantics.
// Pure Node, zero dependencies.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');
const OUT = path.join(ROOT, 'dist', 'main.bundle.js');

function numericKey(name) {
  const m = name.match(/^behavior-pack-(\d+)\.js$/);
  return m ? parseInt(m[1], 10) : Infinity;
}

const files = fs.readdirSync(JS_DIR)
  .filter(f => /^behavior-pack-\d+\.js$/.test(f))
  .sort((a, b) => numericKey(a) - numericKey(b));

const parts = [
  `// === main.bundle.js — built ${new Date().toISOString()} ===`,
  `// Source: ${files.length} behavior packs concatenated in numeric order.`,
  `// DO NOT EDIT — regenerate with: node tools/build-bundle.js`,
  '"use strict";',
];

for (const f of files) {
  parts.push(`// ─── ${f} ─────────────────────────────────────────────`);
  let body = fs.readFileSync(path.join(JS_DIR, f), 'utf8');
  body = body.replace(/^\s*['"]use strict['"];?\s*/m, '');
  // CRITICAL: each pack runs inside try/catch so a sync throw doesn't break
  // the rest of the bundle. In the multi-<script> mode this isolation was
  // free; bundling re-introduces the cascade risk.
  parts.push(`try {`);
  parts.push(body.trimEnd());
  parts.push(`} catch (e) { (console && console.error) ? console.error('[${f}] init failed:', (e && e.message) || e) : null; }`);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, parts.join('\n'));
const size = fs.statSync(OUT).size;
console.log(`[bundle] wrote ${OUT}`);
console.log(`[bundle] packs=${files.length} size=${(size / 1024).toFixed(1)}KB`);
