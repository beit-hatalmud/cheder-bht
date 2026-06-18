"""Debug smoke test - see what happens after login click."""
import os, time, json
from playwright.sync_api import sync_playwright

URL = 'https://beit-hatalmud.github.io/cheder-bht/?cb=' + str(int(time.time()))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900}, locale='he-IL')
    page = ctx.new_page()
    console = []
    page.on('console', lambda m: console.append(f'[{m.type}] ' + m.text[:200]))
    pageerrors = []
    page.on('pageerror', lambda e: pageerrors.append(str(e)[:300]))

    page.goto(URL, wait_until='domcontentloaded', timeout=30000)
    page.wait_for_timeout(4500)

    page.fill('#username', 'ירושלמי')
    page.fill('#password', '1234')
    page.click('#login-btn')
    page.wait_for_timeout(8000)

    state = page.evaluate('''() => ({
      page_login_hidden: document.getElementById('page-login')?.classList.contains('d-none'),
      page_home_hidden: document.getElementById('page-home')?.classList.contains('d-none'),
      login_error_text: document.getElementById('login-error')?.textContent || '',
      login_error_hidden: document.getElementById('login-error')?.classList.contains('d-none'),
      current_user: sessionStorage.getItem('user'),
      hash: location.hash,
    })''')
    print('STATE:', json.dumps(state, ensure_ascii=False, indent=1))

    print('\nCONSOLE (last 20):')
    for c in console[-20:]:
        print(' ', c[:200])

    print(f'\nPAGEERRORS ({len(pageerrors)}):')
    for e in pageerrors:
        print(' ', e)

    page.screenshot(path=r'C:\temp\bht_qa\smoke_debug.png', full_page=True)
    browser.close()
