// behavior-pack-110.js — UX fixes: keyboard nav, RTL fixes, focus management. 2026-05-27
(function () {
  'use strict';

  let fixes = 0;

  // ===== Fix 1: Ctrl+1..9 jumps to student card tabs =====
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey || e.shiftKey || e.altKey) return;
    const num = parseInt(e.key);
    if (isNaN(num) || num < 1 || num > 9) return;
    const modal = document.getElementById('viewStuModal');
    if (!modal || !modal.classList.contains('show')) return;
    const tabs = modal.querySelectorAll('.nav-tabs .nav-link');
    if (tabs[num - 1]) {
      e.preventDefault();
      tabs[num - 1].click();
    }
  });
  fixes++;

  // ===== Fix 2: Auto-focus first input in opened modal =====
  document.addEventListener('shown.bs.modal', e => {
    setTimeout(() => {
      const firstInput = e.target.querySelector('input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])');
      if (firstInput) firstInput.focus();
    }, 200);
  });
  fixes++;

  // ===== Fix 3: Force RTL on Hebrew inputs =====
  if (!document.getElementById('pack-110-rtl')) {
    const st = document.createElement('style');
    st.id = 'pack-110-rtl';
    st.textContent = `
      input[type=text], input[type=search], textarea { direction: rtl; }
      input[type=email], input[type=tel], input[type=url], input.dir-ltr,
      input[id*="phone"], input[id*="email"], input[id*="url"], input[id*="tz"], input[name*="tz"] {
        direction: ltr; text-align: left;
      }
      .badge { font-feature-settings: normal; }
    `;
    document.head.appendChild(st);
  }
  fixes++;

  // ===== Fix 4: Hebrew calendar quick-add for date inputs =====
  setInterval(() => {
    document.querySelectorAll('input[type=date]:not([data-quick-add-110])').forEach(input => {
      input.dataset.quickAdd110 = '1';
      // Add tiny "today" link next to date input
      const today = new Date().toISOString().slice(0, 10);
      input.addEventListener('focus', () => {
        if (!input.value) {
          input.value = today;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  }, 5000);
  fixes++;

  // ===== Fix 5: Smart paste - clean line breaks in single-line inputs =====
  document.addEventListener('paste', e => {
    const t = e.target;
    if (!t.matches?.('input[type=text]')) return;
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (text && /\n/.test(text)) {
      e.preventDefault();
      const cleaned = text.replace(/[\n\r\t]+/g, ' ').trim();
      document.execCommand('insertText', false, cleaned);
    }
  });
  fixes++;

  // ===== Fix 6: Confirm before destructive actions =====
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('button[onclick*="delete"], button[onclick*="Delete"], button[onclick*="remove"]');
    if (!btn || btn.dataset.confirm110) return;
    if (/מחק|הסר|delete|remove/i.test(btn.textContent || '')) {
      btn.dataset.confirm110 = '1';
      const onclickOrig = btn.getAttribute('onclick');
      if (onclickOrig && !btn._wrapped) {
        btn._wrapped = true;
        btn.setAttribute('onclick', `if(confirm('בטוח שברצונך למחוק?')){${onclickOrig}}`);
      }
    }
  });
  fixes++;

  // ===== Fix 7: Auto-uppercase Hebrew tz numbers, no spaces =====
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.matches?.('input[id*="tz"], input[name*="תז"], input[id*="ידהז"]')) {
      const cleaned = t.value.replace(/[^\d]/g, '').slice(0, 9);
      if (cleaned !== t.value) t.value = cleaned;
    }
  });
  fixes++;

  // ===== Fix 8: Show keyboard shortcut help on F1 =====
  document.addEventListener('keydown', e => {
    if (e.key === 'F1') {
      e.preventDefault();
      const html = `<div class="modal fade show" id="kbd-help" style="display:block;background:rgba(0,0,0,0.5);z-index:99999" onclick="if(event.target===this)this.remove()">
        <div class="modal-dialog" onclick="event.stopPropagation()">
          <div class="modal-content" style="direction:rtl">
            <div class="modal-header"><h5>⌨ קיצורי דרך</h5><button class="btn-close" onclick="document.getElementById('kbd-help').remove()"></button></div>
            <div class="modal-body">
              <table class="table table-sm">
                <tr><td><kbd>Ctrl+K</kbd></td><td>חיפוש גלובלי</td></tr>
                <tr><td><kbd>Ctrl+S</kbd></td><td>שמור תל"א</td></tr>
                <tr><td><kbd>Ctrl+1..9</kbd></td><td>טאב בכרטיס תלמיד</td></tr>
                <tr><td><kbd>Ctrl+Shift+C</kbd></td><td>הגדרות מצלמות</td></tr>
                <tr><td><kbd>Ctrl+Shift+L</kbd></td><td>לוג שגיאות</td></tr>
                <tr><td><kbd>Ctrl+Shift+D</kbd></td><td>App state dump</td></tr>
                <tr><td><kbd>S</kbd></td><td>צילום מצלמה (בעמוד מצלמות)</td></tr>
                <tr><td><kbd>Esc</kbd></td><td>סגירת modal / שחרור overlays</td></tr>
                <tr><td><kbd>F1</kbd></td><td>עזרה</td></tr>
              </table>
            </div>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', html);
    }
  });
  fixes++;

  console.warn(`%c⌨ Pack-110 — ${fixes} UX fixes (Ctrl+1-9 tabs, auto-focus, RTL, date today, paste clean, confirm delete, tz cleanup, F1 help)`, 'color:#7c3aed;font-weight:bold');
})();
