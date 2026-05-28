// tools/qa-bot-real.js — human-behavioral simulation QA.
// • REAL login via the form (no sessionStorage bypass)
// • Random 800–2500ms pauses between interactions
// • After every safe click, wait until DOM signature changes (or 5s stall)
// • On stall/error, snapshot context → qa_fail_context.json
// • Per-page sampling: 6 random non-mutating elements (caps run time)
//
// Auto-fix scope: this script ONLY reports. The wrapper qa-loop.js applies
// any patches.

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const URL = process.env.BHT_URL || 'https://beit-hatalmud.github.io/cheder-bht/';
const USER = process.env.BHT_USER || 'admin';
const PWD  = process.env.BHT_PWD  || '1234';
const PAGES = ['#home','#students','#behavior','#tasks','#cameras','#settings'];
const PER_PAGE_CAP = 6;     // pick this many random safe elements per page
const STALL_MS = 5000;
const MUTATING = /(הוסף|שמור|מחק|אישור.{0,3}מחיקה|שלח|אמת|חתום|צור|הירשם|Add|Save|Delete|Submit|Send|Create|Sign|Confirm|Remove|התנתק|logout|יציאה)/i;

const FAIL_CTX = path.join(__dirname, '..', 'qa_fail_context.json');
const REPORT = path.join(__dirname, '..', 'qa_real_report.json');

const humanDelay = () => 800 + Math.floor(Math.random() * 1700);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();

let _browser; // hoisted so signal handlers can clean up
async function shutdown() {
  if (_browser) { try { await _browser.close(); } catch {} _browser = null; }
}
process.on('SIGINT', () => { shutdown().then(() => process.exit(130)); });
process.on('SIGTERM', () => { shutdown().then(() => process.exit(143)); });

(async () => {
  _browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const browser = _browser;
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const pageErrors = [];
  const consoleLog = [];   // rolling — only last 20 kept
  page.on('console', m => {
    consoleLog.push({ at: nowIso(), type: m.type(), text: m.text().slice(0, 250) });
    if (consoleLog.length > 50) consoleLog.shift();
  });
  page.on('pageerror', e => pageErrors.push({ at: nowIso(), message: e.message, stack: (e.stack || '').slice(0, 1000) }));

  console.log('[real] goto', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await sleep(2500); // initial settle

  // ───────── 1. REAL LOGIN (no fake session) ─────────
  console.log('[real] real login as', USER);
  const loginResult = await (async () => {
    try {
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.type('#username', USER, { delay: 60 });
      await sleep(humanDelay());
      await page.type('#password', PWD, { delay: 60 });
      await sleep(humanDelay());
      const startTs = Date.now();
      await page.click('#login-btn');
      // Wait for either page-home visible OR login-error visible — up to 60s
      // (NetFree can delay the auth POST significantly).
      const outcome = await Promise.race([
        page.waitForFunction(() => {
          const h = document.getElementById('page-home');
          return h && !h.classList.contains('d-none');
        }, { timeout: 90000 }).then(() => 'home'),
        page.waitForSelector('#login-error:not(.d-none)', { timeout: 90000 }).then(() => 'error'),
      ]).catch(() => 'timeout');
      const took = Date.now() - startTs;
      const state = await page.evaluate(() => ({
        loggedIn: !!(document.getElementById('page-home') && !document.getElementById('page-home').classList.contains('d-none')),
        jwt: sessionStorage.getItem('bht_jwt') || '',
        user: sessionStorage.getItem('user') || '',
        errMsg: (document.getElementById('login-error') && !document.getElementById('login-error').classList.contains('d-none')) ? document.getElementById('login-error').textContent.trim() : null,
      }));
      return { outcome, took, ...state };
    } catch (e) { return { outcome: 'exception', message: e.message }; }
  })();
  console.log('[real] login:', JSON.stringify({ outcome: loginResult.outcome, ms: loginResult.took, hasJwt: !!loginResult.jwt, errMsg: loginResult.errMsg }));

  const findings = [];
  if (!loginResult.loggedIn) {
    findings.push({ severity: 'critical', step: 'login', error: loginResult.errMsg || loginResult.outcome, took_ms: loginResult.took });
    // capture context
    const ctx = await page.evaluate(() => ({
      url: location.href,
      hash: location.hash,
      bodyText: (document.body.innerText || '').slice(0, 500),
      loginErrEl: (document.getElementById('login-error') || {}).outerHTML || null,
    }));
    fs.writeFileSync(FAIL_CTX, JSON.stringify({ at: nowIso(), step: 'login', context: ctx, consoleLog: consoleLog.slice(-10), pageErrors }, null, 2));
    fs.writeFileSync(REPORT, JSON.stringify({ ok: false, login: loginResult, findings, pageErrors, consoleLog: consoleLog.slice(-20) }, null, 2));
    await browser.close();
    console.log('[real] login FAILED — context saved to', FAIL_CTX);
    process.exit(1);
  }

  // ───────── 2. Per-page sampled clicks with state-change tracking ─────────
  const perPage = [];
  for (const hash of PAGES) {
    await sleep(humanDelay());
    console.log('[real] page', hash);
    await page.evaluate((h) => { location.hash = h; if (typeof showPage === 'function') showPage(h.slice(1)); }, hash);
    await sleep(humanDelay() + 600); // let page render

    // Enumerate non-mutating clickable elements
    const candidates = await page.evaluate((MUT) => {
      const mut = new RegExp(MUT, 'i');
      const sel = 'button, [role="button"], a[href^="#"], .btn, input[type="checkbox"], input[type="radio"]';
      const out = [];
      for (const el of document.querySelectorAll(sel)) {
        if (el.offsetParent === null && el.tagName !== 'INPUT') continue;
        if (el.disabled) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        const label = (el.textContent || el.value || el.getAttribute('aria-label') || el.title || el.id || '').replace(/\s+/g, ' ').trim();
        if (mut.test(label) || mut.test(el.id || '') || mut.test(el.className || '')) continue;
        out.push({ id: el.id || '', label: label.slice(0, 60), tag: el.tagName.toLowerCase() });
      }
      // Shuffle + cap
      for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
      return out.slice(0, 6);
    }, MUTATING.source);

    const pageStats = { hash, candidates: candidates.length, clicks: 0, stalls: 0, errors: [] };
    for (const c of candidates) {
      await sleep(humanDelay());
      const beforeErrs = pageErrors.length;
      const beforeSig = await page.evaluate(() => document.body.innerHTML.length).catch(() => 0);
      const clicked = await page.evaluate((labelMatch, idMatch) => {
        const sel = 'button, [role="button"], a[href^="#"], .btn, input[type="checkbox"], input[type="radio"]';
        for (const el of document.querySelectorAll(sel)) {
          if (el.offsetParent === null && el.tagName !== 'INPUT') continue;
          const lab = (el.textContent || el.value || el.getAttribute('aria-label') || el.title || el.id || '').replace(/\s+/g, ' ').trim().slice(0, 60);
          if ((idMatch && el.id === idMatch) || (labelMatch && lab === labelMatch)) {
            try { el.click(); return true; } catch { return false; }
          }
        }
        return false;
      }, c.label, c.id);
      if (!clicked) { pageStats.errors.push({ label: c.label, error: 'element not found at click time' }); continue; }
      pageStats.clicks++;

      // Wait up to STALL_MS for ANY DOM change (length delta) or new console output
      const startWait = Date.now();
      let stateChanged = false;
      while (Date.now() - startWait < STALL_MS) {
        await sleep(120);
        const sig = await page.evaluate(() => document.body.innerHTML.length).catch(() => 0);
        if (sig !== beforeSig) { stateChanged = true; break; }
      }
      if (!stateChanged) {
        pageStats.stalls++;
        pageStats.errors.push({ label: c.label, error: 'stall — no DOM change within 5s', stallElement: c.id || c.label });
      }
      // Capture new pageerrors
      if (pageErrors.length > beforeErrs) {
        const e = pageErrors[pageErrors.length - 1];
        pageStats.errors.push({ label: c.label, error: 'pageerror: ' + e.message.slice(0, 160) });
        // Save context for first failing click only
        if (!fs.existsSync(FAIL_CTX)) {
          fs.writeFileSync(FAIL_CTX, JSON.stringify({ at: nowIso(), step: `click_${hash}`, label: c.label, context: { url: page.url(), hash, elementId: c.id }, consoleLog: consoleLog.slice(-10), pageErrors: pageErrors.slice(-3) }, null, 2));
        }
      }
      // Close any modal that may have opened (to keep test isolated)
      await page.evaluate(() => {
        ['.modal.show', '[id$="-modal"]', '[id^="palette-"]', '[id^="cpx-"]', '[id$="-overlay"]'].forEach(s => {
          document.querySelectorAll(s).forEach(el => { try { el.remove(); } catch(e) {} });
        });
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      });
    }
    perPage.push(pageStats);
    console.log(`[real]   ${hash}: ${pageStats.clicks} clicks, ${pageStats.stalls} stalls, ${pageStats.errors.length} errors`);
  }

  const summary = {
    ok: findings.length === 0 && pageErrors.length === 0 && perPage.every(p => p.errors.length === 0),
    generated_at: nowIso(),
    url: URL,
    login: { outcome: loginResult.outcome, ms: loginResult.took, hasJwt: !!loginResult.jwt },
    totals: {
      pageErrors: pageErrors.length,
      stalls: perPage.reduce((s, p) => s + p.stalls, 0),
      clicks: perPage.reduce((s, p) => s + p.clicks, 0),
      perPageErrors: perPage.reduce((s, p) => s + p.errors.length, 0),
    },
    perPage,
    pageErrors,
    findings,
  };
  fs.writeFileSync(REPORT, JSON.stringify(summary, null, 2));
  console.log('[real] PASS=', summary.ok, '| totals=', summary.totals);
  await browser.close();
  process.exit(summary.ok ? 0 : 1);
})().catch(async (e) => {
  console.error('[real] fatal:', e.message);
  await shutdown();
  process.exit(2);
});
