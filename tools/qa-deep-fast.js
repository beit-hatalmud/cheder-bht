// tools/qa-deep-fast.js — fast comprehensive QA. Bypasses NetFree-slow login
// by injecting fake admin session. For each page hash, captures:
//   • presence of every known window.* global registered by packs
//   • DOM state per page (visible page-* element, body text length)
//   • console.error / pageerror lines emitted during render
//   • bundle integrity (size, pack count)
// NO CLICKS — pure inspection. Designed to finish in ~30-45s end-to-end.

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const URL = process.env.BHT_URL || 'https://beit-hatalmud.github.io/cheder-bht/';
const FAKE_ADMIN = { username: 'admin', role: 'מנהל', permissions: 'all', landingPage: '' };
const PAGES = ['#home', '#students', '#behavior', '#tasks', '#cameras', '#settings', '#staff', '#reports', '#calendar'];

const EXPECTED_GLOBALS = [
  'openUniversalPalette', 'exportVisibleTableToCsv', 'printCurrentView',
  'checkAuthV2Status', 'getSmartAlerts', 'openChangePasswordModal',
  'refreshCommandCenter', 'bhtSkeleton', 'refreshOfflineBadge',
  'bhtIdbQueue', 'toast', 'BhtSync', 'showPage', 'goto', 'getData',
];

const NOISE_RE = /netfree\.link|ERR_NAME_NOT_RESOLVED|cdn\.jsdelivr|Content Security Policy|CSP/i;
const REPORT = path.join(__dirname, '..', 'qa_deep_fast_report.json');

function nowIso() { return new Date().toISOString(); }

(async () => {
  console.log('[fast] launching');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument((u) => {
    sessionStorage.setItem('user', JSON.stringify(u));
    sessionStorage.setItem('bht_jwt', 'fake-jwt');
  }, FAKE_ADMIN);

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', m => { if (m.type() === 'error') { const t = m.text(); if (!NOISE_RE.test(t)) consoleErrors.push({ at: nowIso(), text: t.slice(0, 300) }); } });
  page.on('pageerror', e => pageErrors.push({ at: nowIso(), name: e.name, message: e.message, stack: (e.stack || '').slice(0, 800) }));

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000)); // let packs init

  // Globals snapshot
  const globalsStatus = await page.evaluate((expected) => {
    const out = {};
    for (const g of expected) {
      const v = window[g];
      out[g] = (typeof v === 'function') ? 'fn' : (v && typeof v === 'object' ? 'obj' : (v == null ? 'MISSING' : typeof v));
    }
    return out;
  }, EXPECTED_GLOBALS);

  // Bundle inventory + pack registration banners (Pack-N init messages live in console.warn)
  const inventory = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    return {
      bundle_url: scripts.find(s => /dist\/main\.bundle\.js/.test(s)) || null,
      stale_pack_tags: scripts.filter(s => /\/behavior-pack-\d+\.js/.test(s)),
      xlsx_self_hosted: scripts.some(s => /\/js\/vendor\/xlsx/.test(s)),
      idb_queue_loaded: scripts.some(s => /\/js\/idb-queue\.js/.test(s)),
      service_worker_ready: !!navigator.serviceWorker.controller,
    };
  });

  // Per-page DOM state
  const perPage = [];
  for (const hash of PAGES) {
    const before = pageErrors.length + consoleErrors.length;
    await page.evaluate((h) => { location.hash = h; if (typeof showPage === 'function') showPage(h.slice(1)); }, hash);
    await new Promise(r => setTimeout(r, 700));
    const state = await page.evaluate(() => {
      const pages = Array.from(document.querySelectorAll('[id^="page-"]'));
      const visible = pages.find(p => !p.classList.contains('d-none'));
      return {
        visible: visible ? visible.id : null,
        bodyTextLen: (document.body.innerText || '').length,
        button_count: document.querySelectorAll('button:not([style*="display:none"]), .btn:not([style*="display:none"])').length,
      };
    });
    perPage.push({ hash, ...state, newErrs: (pageErrors.length + consoleErrors.length) - before });
  }

  await browser.close();

  // Detect issues
  const missingGlobals = Object.entries(globalsStatus).filter(([k, v]) => v === 'MISSING').map(([k]) => k);
  const report = {
    ok: pageErrors.length === 0 && missingGlobals.length === 0,
    generated_at: nowIso(),
    url: URL,
    totals: {
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length,
      missingGlobals: missingGlobals.length,
    },
    inventory, globalsStatus, missingGlobals, perPage, pageErrors, consoleErrors,
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log('[fast] report ->', REPORT);
  console.log('[fast] pageErrors=', pageErrors.length, 'consoleErrors=', consoleErrors.length, 'missingGlobals=', missingGlobals.length);
  if (missingGlobals.length) console.log('[fast] missing:', missingGlobals.join(', '));
  process.exit(report.ok ? 0 : 1);
})().catch(e => { console.error('[fast] fatal:', e); process.exit(2); });
