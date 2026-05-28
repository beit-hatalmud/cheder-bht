// tools/verify-widget-141.js — focused check that pack-141 (Admin Command
// Center) renders correctly when admin is logged in. Bypasses the NetFree-
// slow login by injecting a fake admin session into sessionStorage before
// the page boots, then asserts widget DOM + content.
const puppeteer = require('puppeteer');
const fs = require('fs');
const URL = process.env.BHT_URL || 'http://127.0.0.1:8767/index.html';
const FAKE_ADMIN = { username: 'admin', role: 'מנהל', permissions: 'all', landingPage: '' };

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errs = []; const warns = []; const pageErrs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 250)); else if (m.type() === 'warning') warns.push(m.text().slice(0, 250)); });
  page.on('pageerror', e => pageErrs.push(e.name + ': ' + e.message));

  // Inject fake session BEFORE any scripts run
  await page.evaluateOnNewDocument((u) => {
    sessionStorage.setItem('user', JSON.stringify(u));
    sessionStorage.setItem('bht_jwt', 'fake-test-jwt-not-actually-used');
  }, FAKE_ADMIN);

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Switch to home
  await page.evaluate(() => { location.hash = '#home'; if (typeof showPage === 'function') showPage('home'); });
  await new Promise(r => setTimeout(r, 4000)); // let packs + intervals tick

  const result = await page.evaluate(() => {
    const cc = document.getElementById('cmd-center-141');
    if (!cc) return { present: false };
    const cards = Array.from(cc.querySelectorAll('.cc-card'));
    return {
      present: true,
      card_count: cards.length,
      heights: cards.map(c => c.getBoundingClientRect().height),
      labels: cards.map(c => (c.querySelector('.cc-label') || {}).textContent || ''),
      values: cards.map(c => (c.querySelector('.cc-num') || {}).textContent || ''),
      skeleton_remaining: cards.filter(c => c.classList.contains('is-skel')).length,
      visible: cc.offsetParent !== null,
    };
  });
  console.log('[widget-141] result:', JSON.stringify(result, null, 2));
  console.log('[widget-141] pageErrors:', pageErrs.length, pageErrs.slice(0, 2));
  console.log('[widget-141] consoleErrors:', errs.length);
  const heightsOk = result.present && result.heights.every(h => Math.abs(h - 108) < 1);

  const ok = result.present
    && result.card_count === 4
    && heightsOk
    && pageErrs.length === 0;
  console.log('[widget-141] PASS=' + ok);
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
