// tools/verify-bundle.js — headless verification of dist/main.bundle.js
//   1. Syntax check (node --check via vm.Script compile)
//   2. Run in a mock-DOM vm sandbox; catch ANY synchronous throw
//   3. Assert known globals/exports defined by specific packs are present
// Exit 0 on green; non-zero on any failure.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BUNDLE = path.join(ROOT, 'dist', 'main.bundle.js');

if (!fs.existsSync(BUNDLE)) {
  console.error('[verify] bundle not found — run build-bundle.js first');
  process.exit(2);
}
const code = fs.readFileSync(BUNDLE, 'utf8');
const sizeKB = (code.length / 1024).toFixed(1);
console.log(`[verify] bundle size: ${sizeKB}KB, lines: ${code.split('\n').length}`);

// --- 1. syntax / parse ---
let script;
try {
  script = new vm.Script(code, { filename: 'main.bundle.js' });
  console.log('[verify] ✓ parse + syntax OK');
} catch (e) {
  console.error('[verify] ✗ parse failed:', e.message);
  process.exit(1);
}

// --- 2. mock-DOM sandbox ---
function makeNode(tag) {
  const n = {
    tagName: (tag || 'div').toUpperCase(),
    id: '',
    className: '',
    style: { cssText: '' },
    innerHTML: '',
    textContent: '',
    dataset: {},
    attributes: {},
    children: [],
    parentNode: null,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    insertBefore(c) { this.children.unshift(c); c.parentNode = this; return c; },
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k] || null; },
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { width: 0, height: 0, top: 0, bottom: 0, left: 0, right: 0 }; },
    remove() { if (this.parentNode) this.parentNode.removeChild(this); },
    focus() {},
    click() {},
    contains() { return false; },
  };
  return n;
}
function makeStorage() {
  const m = new Map();
  return {
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { m.set(k, String(v)); },
    removeItem(k) { m.delete(k); },
    clear() { m.clear(); },
    key(i) { return Array.from(m.keys())[i] || null; },
    get length() { return m.size; },
  };
}

const document = {
  readyState: 'complete',
  body: makeNode('body'),
  head: makeNode('head'),
  documentElement: makeNode('html'),
  createElement: (t) => makeNode(t),
  createTextNode: (t) => ({ nodeValue: t }),
  getElementById: () => null,
  getElementsByTagName: () => [],
  getElementsByClassName: () => [],
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  cookie: '',
};

const errors = [];
const warns = [];
const win = {
  document,
  location: { href: 'https://beit-hatalmud.github.io/cheder-bht/', hash: '#home', protocol: 'https:', pathname: '/cheder-bht/', search: '', searchParams: new URLSearchParams() },
  navigator: { userAgent: 'node-verify', serviceWorker: { register: () => Promise.resolve({ addEventListener() {} }), getRegistration: () => Promise.resolve(null), addEventListener: () => {} } },
  localStorage: makeStorage(),
  sessionStorage: makeStorage(),
  history: { replaceState: () => {} },
  performance: { now: () => Date.now() },
  fetch: () => Promise.resolve({ ok: true, status: 200, json: async () => ({}), text: async () => '' }),
  setTimeout, clearTimeout, setInterval, clearInterval,
  console: {
    log: () => {},
    info: () => {},
    warn: (...a) => { warns.push(a.map(String).join(' ').slice(0, 200)); },
    error: (...a) => { errors.push(a.map(String).join(' ').slice(0, 200)); },
    group: () => {}, groupEnd: () => {}, table: () => {}, dir: () => {}, debug: () => {}, trace: () => {},
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  CustomEvent: function (n, o) { this.type = n; Object.assign(this, o || {}); },
  Event: function (n) { this.type = n; },
  URL, URLSearchParams,
  Blob: function () {}, File: function () {},
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  crypto: {
    getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; },
    subtle: {
      digest: async () => new ArrayBuffer(32),
    },
  },
  matchMedia: (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  IntersectionObserver: function () { this.observe = () => {}; this.unobserve = () => {}; this.disconnect = () => {}; },
  MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; this.takeRecords = () => []; },
  ResizeObserver: function () { this.observe = () => {}; this.unobserve = () => {}; this.disconnect = () => {}; },
  // Stubs for app-defined globals that some packs reference
  toast: () => {},
  notify: () => {},
  api: async () => ({ ok: false, data: { ok: false } }),
  getData: () => ({ students: [], behavior: [], users: [], categories: [], classes: [] }),
  getVisibleData: () => ({ students: [], behavior: [] }),
  showPage: () => {},
  logout: () => {},
  openTlaDashboard: () => {},
  viewStudent: () => {},
};
win.window = win;
win.globalThis = win;
win.self = win;

const ctx = vm.createContext(win);

let runError = null;
try {
  script.runInContext(ctx, { timeout: 8000 });
  console.log('[verify] ✓ executed in sandbox without throwing');
} catch (e) {
  runError = e;
  console.error('[verify] ✗ runtime error:', e.message);
}

// --- 3. assert specific packs registered their exports ---
const expectedGlobals = [
  // pack -> global it must define
  ['pack-135', 'openUniversalPalette'],
  ['pack-136', 'exportVisibleTableToCsv'],
  ['pack-136', 'printCurrentView'],
  ['pack-137', 'checkAuthV2Status'],
  ['pack-138', 'getSmartAlerts'],
  ['pack-139', 'openChangePasswordModal'],
  ['pack-141', 'refreshCommandCenter'],
];
let missing = [];
for (const [pack, key] of expectedGlobals) {
  if (typeof ctx[key] !== 'function') missing.push(`${pack} → window.${key}`);
}
if (missing.length) {
  console.error('[verify] ✗ missing globals:', missing.join(', '));
} else {
  console.log(`[verify] ✓ all ${expectedGlobals.length} expected globals are functions`);
}

// --- 4. error-channel summary ---
if (errors.length) console.error(`[verify] console.error count: ${errors.length}; first: ${errors[0]}`);
console.log(`[verify] console.warn count: ${warns.length}`);

if (runError || missing.length) {
  console.error('[verify] FAIL');
  process.exit(1);
}
console.log('[verify] PASS');
process.exit(0);
