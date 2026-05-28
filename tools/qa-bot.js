// tools/qa-bot.js — Puppeteer headless QA for cheder-bht.
// READ-ONLY: navigates + captures errors. NEVER clicks Add/Save/Delete buttons,
// so this is safe to run against the live site without mutating data.
//
// Output: qa_report.json (overview + findings).
// Exit code: 0 if zero findings, 1 if any (lets a wrapper loop iterate).

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const URL_BASE = process.env.BHT_URL || 'https://beit-hatalmud.github.io/cheder-bht/';
const USERNAME = process.env.BHT_USER || 'admin';
const PASSWORD = process.env.BHT_PWD || '1234';
const REPORT = path.join(ROOT, 'qa_report.json');

// Mutation-risk selectors / button text patterns — we NEVER click these.
const MUTATING = [
  /הוסף/, /שמור/, /מחק/, /Add\b/i, /Save\b/i, /Delete\b/i,
  /Submit/i, /אישור/, /התחל/, /צור/, /Send/i, /שלח/,
];

const TABS = ['#home', '#students', '#behavior', '#tasks', '#cameras', '#settings'];

function nowIso() { return new Date().toISOString(); }

async function main() {
  const findings = [];
  const networkErrors = [];
  const consoleErrors = [];
  const consoleWarns = [];
  const pageErrors = [];

  console.log(`[qa] launch headless chromium`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    timeout: 30000,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', msg => {
    const t = msg.type();
    const text = msg.text().slice(0, 400);
    if (t === 'error') consoleErrors.push({ at: nowIso(), text });
    else if (t === 'warning') consoleWarns.push({ at: nowIso(), text });
  });
  page.on('pageerror', err => {
    pageErrors.push({ at: nowIso(), name: err.name, message: err.message, stack: (err.stack || '').slice(0, 1500) });
  });
  // Noise filters:
  //  • netfree.link/* — NetFree filter injecting on the tester's machine.
  //  • camera HLS streams (.m3u8 / .ts) ERR_ABORTED — expected when the bot
  //    navigates away from #cameras mid-playback.
  const isNoise = (u) => /^https?:\/\/netfree\.link\//.test(u)
    || /trycloudflare\.com\/[^/]+\/?(index\.m3u8|\d+\.ts)?$/i.test(u);
  page.on('requestfailed', req => {
    const url = req.url();
    if (isNoise(url)) return;
    networkErrors.push({ at: nowIso(), url, method: req.method(), reason: req.failure() && req.failure().errorText });
  });
  page.on('response', resp => {
    const status = resp.status();
    const url = resp.url();
    if (status >= 400 && !isNoise(url)) {
      networkErrors.push({ at: nowIso(), url, method: resp.request().method(), status });
    }
  });

  // ───────── 1. load home ─────────
  // domcontentloaded (not networkidle2) — the app keeps a long-polling sync
  // request alive, so networkidle never settles. We wait for DOM ready + a
  // short settle delay, then probe for the login form.
  console.log(`[qa] goto ${URL_BASE}`);
  try {
    await page.goto(URL_BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise(r => setTimeout(r, 2500)); // let deferred scripts run
  } catch (e) {
    findings.push({ step: 'initial_navigation', severity: 'critical', error: e.message });
    await browser.close();
    fs.writeFileSync(REPORT, JSON.stringify({ ok: false, findings, consoleErrors, consoleWarns, pageErrors, networkErrors }, null, 2));
    process.exit(1);
  }
  const title = await page.title();
  console.log(`[qa] page title: ${title}`);
  if (!title || /error|404/i.test(title)) {
    findings.push({ step: 'load', severity: 'critical', error: 'unexpected title: ' + title });
  }

  // ───────── 2. verify bundle loaded (the Grand Bundle is the main perf win) ─────────
  const bundleStatus = await page.evaluate(() => {
    const tags = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    return {
      bundle_present: tags.some(s => /dist\/main\.bundle\.js/.test(s)),
      stale_pack_tags: tags.filter(s => /\/behavior-pack-\d+\.js/.test(s)).length,
      total_scripts: tags.length,
    };
  });
  console.log(`[qa] bundle:`, bundleStatus);
  if (!bundleStatus.bundle_present) findings.push({ step: 'bundle', severity: 'high', error: 'dist/main.bundle.js not referenced' });
  if (bundleStatus.stale_pack_tags > 0) findings.push({ step: 'bundle', severity: 'medium', error: `${bundleStatus.stale_pack_tags} stale pack tags still in DOM` });

  // ───────── 3. login with admin/1234 (read-only credentials path) ─────────
  console.log(`[qa] attempting login as ${USERNAME}`);
  try {
    await page.waitForSelector('#username', { timeout: 15000 });
    await page.type('#username', USERNAME, { delay: 5 });
    await page.type('#password', PASSWORD, { delay: 5 });
    // Capture every webhook response so we can diagnose login failures
    const loginResponses = [];
    const loginListener = (resp) => {
      const u = resp.url();
      if (/script\.google\.com\/macros\/s\//.test(u) && /action=login/.test(u + resp.request().postData())) {
        loginResponses.push({ url: u.slice(0, 120), status: resp.status() });
      } else if (/script\.google\.com/.test(u)) {
        loginResponses.push({ url: u.slice(0, 120), status: resp.status() });
      }
    };
    page.on('response', loginListener);
    try {
      await Promise.all([
        page.click('#login-btn'),
        Promise.race([
          page.waitForFunction(() => {
            const home = document.getElementById('page-home');
            return home && !home.classList.contains('d-none');
          }, { timeout: 30000 }),
          page.waitForSelector('#login-error:not(.d-none)', { timeout: 30000 }),
        ]),
      ]);
    } finally {
      page.off('response', loginListener);
    }
    if (loginResponses.length) console.log('[qa] login network:', loginResponses.slice(0, 3));
    const loggedIn = await page.evaluate(() => {
      const home = document.getElementById('page-home');
      const err = document.getElementById('login-error');
      const errVisible = err && !err.classList.contains('d-none') && err.textContent.trim();
      return {
        loggedIn: !!(home && !home.classList.contains('d-none')),
        loginError: errVisible || null,
        jwt: sessionStorage.getItem('bht_jwt') || null,
        user: sessionStorage.getItem('user') || null,
      };
    });
    console.log('[qa] login result:', { loggedIn: loggedIn.loggedIn, errMsg: loggedIn.loginError, hasJwt: !!loggedIn.jwt });
    if (!loggedIn.loggedIn) {
      findings.push({ step: 'login', severity: 'critical', error: loggedIn.loginError || 'login did not transition to home' });
    } else if (!loggedIn.jwt) {
      findings.push({ step: 'login_jwt', severity: 'high', error: 'logged in but bht_jwt not stored in sessionStorage' });
    }
  } catch (e) {
    findings.push({ step: 'login', severity: 'critical', error: e.message });
  }

  // ───────── 4. navigate tabs ─────────
  for (const hash of TABS) {
    console.log(`[qa] navigate ${hash}`);
    const beforeErrCount = consoleErrors.length;
    try {
      await page.evaluate((h) => { location.hash = h; }, hash);
      await new Promise(r => setTimeout(r, 1500)); // let render settle
      // Capture which page-* element is visible
      const visiblePage = await page.evaluate(() => {
        const pages = Array.from(document.querySelectorAll('[id^="page-"]'));
        const visible = pages.find(p => !p.classList.contains('d-none'));
        return visible ? visible.id : null;
      });
      const newErrs = consoleErrors.slice(beforeErrCount);
      if (newErrs.length) {
        findings.push({ step: `navigate_${hash}`, severity: 'medium', error: `${newErrs.length} console errors during nav: ${newErrs[0].text.slice(0, 200)}` });
      }
      // Confirm something rendered (page is not blank)
      const bodyText = (await page.evaluate(() => document.body.innerText || '')).trim();
      if (bodyText.length < 20) {
        findings.push({ step: `navigate_${hash}`, severity: 'high', error: 'page body appears blank (<20 chars text)' });
      }
      console.log(`[qa]   visible: ${visiblePage}, text_len=${bodyText.length}`);
    } catch (e) {
      findings.push({ step: `navigate_${hash}`, severity: 'medium', error: e.message });
    }
  }

  // ───────── 5. count of action buttons (read-only inventory) ─────────
  const buttonInventory = await page.evaluate((MUT) => {
    const btns = Array.from(document.querySelectorAll('button, .btn, [role="button"]'));
    const visible = btns.filter(b => b.offsetParent !== null);
    return {
      total: btns.length,
      visible: visible.length,
      // first few labels for spot-check
      sample: visible.slice(0, 10).map(b => (b.textContent || '').trim().slice(0, 30)).filter(Boolean),
    };
  }, MUTATING.map(r => r.source));
  console.log(`[qa] buttons: ${buttonInventory.visible}/${buttonInventory.total} visible`);

  // ───────── 6. write report ─────────
  const report = {
    ok: findings.length === 0,
    generated_at: nowIso(),
    url: URL_BASE,
    counters: {
      findings: findings.length,
      consoleErrors: consoleErrors.length,
      consoleWarns: consoleWarns.length,
      pageErrors: pageErrors.length,
      networkErrors: networkErrors.length,
    },
    findings,
    pageErrors,
    consoleErrors: consoleErrors.slice(0, 50),
    consoleWarns: consoleWarns.slice(0, 50),
    networkErrors: networkErrors.slice(0, 50),
    bundleStatus,
    buttonInventory,
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log(`[qa] report written: ${REPORT}`);
  console.log(`[qa] summary: findings=${findings.length} pageErrors=${pageErrors.length} netErrs=${networkErrors.length} consoleErrors=${consoleErrors.length}`);

  await browser.close();
  process.exit(findings.length === 0 ? 0 : 1);
}

main().catch(e => {
  console.error('[qa] fatal:', e);
  process.exit(2);
});
