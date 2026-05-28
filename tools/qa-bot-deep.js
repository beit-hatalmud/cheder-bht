// tools/qa-bot-deep.js — deep interactive QA against the live site.
// Bypasses NetFree-slow login by injecting fake admin session, then for each
// page hash clicks every visible button/link/checkbox/toggle EXCEPT mutating
// ones (Add/Save/Delete/Send/Submit/etc.). Captures JS exceptions per click.
//
// Output: qa_deep_report.json — { ok, perPage:[{hash, clicked, errors:[{el,msg}]}], summary }

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const URL = process.env.BHT_URL || 'https://beit-hatalmud.github.io/cheder-bht/';
const FAKE_ADMIN = { username: 'admin', role: 'מנהל', permissions: 'all', landingPage: '' };
const PAGES = ['#home','#students','#behavior','#tasks','#cameras','#settings','#staff','#reports','#calendar','#projects','#meetings','#signatures'];

// labels (Hebrew + English) that are mutating — never click these
const MUTATING_RE = /(הוסף|שמור|מחק|אישור.{0,3}מחיקה|שלח|אמת|התחל|חתום|צור|הירשם|Add|Save|Delete|Submit|Send|Create|Sign|Confirm|Remove)/i;
const REPORT = path.join(__dirname, '..', 'qa_deep_report.json');

function safeText(s) { return (s || '').replace(/\s+/g, ' ').trim().slice(0, 60); }
function nowIso() { return new Date().toISOString(); }

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  await page.evaluateOnNewDocument((u) => {
    sessionStorage.setItem('user', JSON.stringify(u));
    sessionStorage.setItem('bht_jwt', 'fake-jwt-for-render-bypass');
  }, FAKE_ADMIN);

  const allPageErrs = [];
  const allConsoleErrs = [];
  page.on('pageerror', e => allPageErrs.push({ at: nowIso(), msg: e.message, stack: (e.stack||'').slice(0,1500) }));
  page.on('console', m => { if (m.type() === 'error') allConsoleErrs.push({ at: nowIso(), msg: m.text().slice(0,300) }); });

  console.log('[deep] loading:', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await new Promise(r => setTimeout(r, 3500));

  const perPage = [];
  for (const hash of PAGES) {
    console.log(`[deep] page ${hash}`);
    const errBefore = allPageErrs.length + allConsoleErrs.length;
    try {
      await page.evaluate((h) => { location.hash = h; if (typeof showPage === 'function') showPage(h.slice(1)); }, hash);
    } catch (e) { /* defensive */ }
    await new Promise(r => setTimeout(r, 1200));

    // Enumerate clickable interactive elements
    const interactive = await page.evaluate((MUT) => {
      const mut = new RegExp(MUT, 'i');
      const out = [];
      const sel = 'button, [role="button"], a[href^="#"], .btn, input[type="checkbox"], input[type="radio"], select';
      const list = Array.from(document.querySelectorAll(sel));
      for (const el of list) {
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        if (el.offsetParent === null && el.tagName !== 'INPUT') continue;
        if (el.disabled) continue;
        const label = (el.textContent || el.value || el.getAttribute('aria-label') || el.title || el.id || '').replace(/\s+/g, ' ').trim().slice(0, 80);
        const inMutating = mut.test(label) || mut.test(el.id || '') || mut.test(el.className || '');
        const xpath = el.id ? `#${el.id}` : (el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').filter(Boolean).slice(0,1).join('.') : ''));
        out.push({ tag: el.tagName.toLowerCase(), label, xpath, mutating: inMutating });
      }
      return out.slice(0, 60); // cap per page
    }, MUTATING_RE.source);

    const pageInfo = { hash, total: interactive.length, clicked: 0, skipped: 0, errors: [] };
    for (const item of interactive) {
      if (item.mutating) { pageInfo.skipped++; continue; }
      const before = allPageErrs.length + allConsoleErrs.length;
      try {
        // Click via DOM (Puppeteer .click hits visible coords, may be unreliable through bot)
        await page.evaluate((labelMatch) => {
          const sel = 'button, [role="button"], a[href^="#"], .btn, input[type="checkbox"], input[type="radio"], select';
          const els = Array.from(document.querySelectorAll(sel));
          for (const el of els) {
            const txt = (el.textContent || el.value || el.getAttribute('aria-label') || el.title || el.id || '').replace(/\s+/g,' ').trim().slice(0,80);
            if (txt === labelMatch && el.offsetParent !== null) {
              try { el.click(); } catch (e) {}
              return true;
            }
          }
          return false;
        }, item.label);
        await new Promise(r => setTimeout(r, 220));
        pageInfo.clicked++;
        const newErrs = allPageErrs.slice(before - allConsoleErrs.length).concat(allConsoleErrs.slice(before - allPageErrs.length));
        // Simpler: any new error since `before`
        const afterCnt = allPageErrs.length + allConsoleErrs.length;
        if (afterCnt > before) {
          // Capture the latest error
          const latest = allPageErrs[allPageErrs.length - 1] || allConsoleErrs[allConsoleErrs.length - 1];
          pageInfo.errors.push({ label: item.label, error: latest && (latest.msg || '').slice(0, 200) });
        }
        // Close any modal that may have opened
        await page.evaluate(() => {
          ['.modal.show', '[id$="-modal"]', '[id^="palette-"]', '[id^="cpx-"]', '[id$="-overlay"]', '[id$="-modal-139"]'].forEach(sel => {
            document.querySelectorAll(sel).forEach(el => { try { el.remove(); } catch(e){} });
          });
          document.body.style.overflow = '';
          document.body.classList.remove('modal-open');
        });
      } catch (e) {
        pageInfo.errors.push({ label: item.label, error: e.message });
      }
    }
    const errAfter = allPageErrs.length + allConsoleErrs.length;
    pageInfo.newErrsTotal = errAfter - errBefore;
    perPage.push(pageInfo);
    console.log(`[deep]   total=${pageInfo.total} clicked=${pageInfo.clicked} skipped=${pageInfo.skipped} newErrs=${pageInfo.newErrsTotal}`);
  }

  await browser.close();

  const summary = {
    ok: allPageErrs.length === 0,
    generated_at: nowIso(),
    url: URL,
    totals: {
      pages: perPage.length,
      pageErrors: allPageErrs.length,
      consoleErrors: allConsoleErrs.length,
      clicks: perPage.reduce((s, p) => s + p.clicked, 0),
      skipped: perPage.reduce((s, p) => s + p.skipped, 0),
    },
    perPage,
    pageErrors: allPageErrs.slice(0, 30),
    consoleErrors: allConsoleErrs.slice(0, 30),
  };
  fs.writeFileSync(REPORT, JSON.stringify(summary, null, 2));
  console.log('[deep] report written:', REPORT);
  console.log('[deep] totals:', summary.totals);
  process.exit(allPageErrs.length === 0 ? 0 : 1);
})().catch(e => { console.error('[deep] fatal:', e); process.exit(2); });
