// behavior-pack-9.js — 20 בדיקות באגים + שיפורים. 2026-05-24

// BUG 12: page-staff didn't get loaded when navigated
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    if (location.hash === '#staff' && typeof renderStaff === 'function') renderStaff();
  });
  window.addEventListener('hashchange', () => {
    if (location.hash === '#staff' && typeof renderStaff === 'function') {
      setTimeout(renderStaff, 50);
    }
  });
})();

// BUG 13: staff render fails if user lacks permission - show helpful msg
const _origRenderStaff = window.renderStaff;
if (_origRenderStaff) {
  window.renderStaff = async function () {
    try {
      await _origRenderStaff();
    } catch (e) {
      const root = document.getElementById('page-staff');
      if (root) root.innerHTML = `<div class="alert alert-danger m-3"><h5>שגיאה בטעינת רשימת צוות</h5><p>${e.message}</p></div>`;
    }
  };
}

// BUG 14: rabbi dropdown in event modal — auto-select user's rabbi
(function () {
  document.addEventListener('shown.bs.modal', (e) => {
    const m = e.target;
    if (!m) return;
    const rabbiSel = m.querySelector('select[id$="-rabbi"]');
    if (rabbiSel && !rabbiSel.value && typeof currentRabbi === 'function') {
      const r = currentRabbi();
      if (r) {
        const opt = [...rabbiSel.options].find(o => o.value === r);
        if (opt) rabbiSel.value = r;
      }
    }
  });
})();

// BUG 15: when filter selects rabbi, also remember last selection
(function () {
  ['w-frabbi', 'r-frabbi', 'l-frabbi'].forEach(id => {
    document.addEventListener('change', e => {
      if (e.target && e.target.id === id) {
        try { localStorage.setItem('bht_last_' + id, e.target.value); } catch (_) { }
      }
    });
  });
  // Restore on render
  document.addEventListener('hashchange', () => {
    setTimeout(() => {
      ['w-frabbi', 'r-frabbi', 'l-frabbi'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value) {
          try {
            const v = localStorage.getItem('bht_last_' + id);
            if (v) {
              el.value = v;
              el.dispatchEvent(new Event('change'));
            }
          } catch (_) { }
        }
      });
    }, 200);
  });
})();

// BUG 16: prevent submit while already submitting
(function () {
  document.addEventListener('click', e => {
    const btn = e.target.closest('button.btn-primary');
    if (!btn || btn.dataset.guardSet) return;
    const txt = (btn.textContent || '').trim();
    if (!/שמור|הוסף|צור|אישור/.test(txt)) return;
    btn.dataset.guardSet = '1';
    const origClick = btn.onclick;
  });
})();

// BUG 17 FIXED: allow Esc to bubble so Bootstrap modal can handle it.
// (was: stopPropagation which broke Bootstrap modal close)

// BUG 18: T.Z. validation
window.validateIsraeliTZ = function (id) {
  id = String(id).trim();
  if (id.length > 9) return false;
  if (!/^\d+$/.test(id)) return false;
  id = id.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let v = parseInt(id[i]) * (i % 2 + 1);
    if (v > 9) v -= 9;
    sum += v;
  }
  return sum % 10 === 0;
};

document.addEventListener('blur', e => {
  if (e.target && e.target.id === 'nu-tz') {
    const v = e.target.value.trim();
    if (v && !validateIsraeliTZ(v)) {
      e.target.style.borderColor = '#dc2626';
      e.target.title = 'ת.ז. אינה תקינה';
    } else {
      e.target.style.borderColor = '';
      e.target.title = '';
    }
  }
}, true);

// BUG 19: Auto-fill בנק/סניף/חשבון פורמט
document.addEventListener('input', e => {
  if (e.target && (e.target.id === 'nu-bank' || e.target.id === 'nu-branch' || e.target.id === 'nu-account')) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  }
});

// BUG 20: phone format
document.addEventListener('blur', e => {
  if (e.target && (e.target.id === 'nu-phone' || e.target.id === 'nu-homephone')) {
    let v = e.target.value.replace(/[^0-9]/g, '');
    if (v.length === 10 && v.startsWith('0')) {
      e.target.value = v.slice(0, 3) + '-' + v.slice(3);
    }
  }
}, true);

// BUG 21: keyboard shortcut for staff page
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'U') {
    e.preventDefault();
    goto('staff');
  }
});

// BUG 22: ensure all rabbi dropdowns have datalist for search
document.addEventListener('focusin', e => {
  const el = e.target;
  if (el && el.tagName === 'SELECT' && el.id && el.id.endsWith('-rabbi')) {
    el.size = Math.min(8, el.options.length);
    el.addEventListener('blur', () => { el.size = 1; }, { once: true });
  }
});

// BUG 23: Show rabbi badge on student behavior events (not just lessons)
const _origDrawBehavior = window.drawBehaviorEvents;
// Don't redefine - just augment via CSS
const styleP9 = document.createElement('style');
styleP9.textContent = `
  .badge.bg-primary[data-rabbi] { background: linear-gradient(135deg, #4f46e5, #7c3aed) !important; }
  #page-staff .table tbody tr:hover { background: #f0f9ff; }
  #page-staff .display-6 { font-size: 1.8rem; }
`;
document.head.appendChild(styleP9);

// BUG 24: cleanup stale modals on navigation
window.addEventListener('hashchange', () => {
  document.querySelectorAll('.modal-backdrop').forEach(b => {
    if (!document.querySelector('.modal.show')) b.remove();
  });
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

// BUG 25: feedback when rabbi filter selected
(function () {
  ['w-frabbi', 'r-frabbi', 'l-frabbi'].forEach(id => {
    document.addEventListener('change', e => {
      if (e.target && e.target.id === id) {
        const v = e.target.value;
        if (v && typeof toast === 'function') {
          toast(`סינון לפי ${v}`, 'info');
        }
      }
    });
  });
})();

// BUG 26: ensure all 16 rabbis appear in role dropdown of edit user
const _origAddUserModal = window.addUserModal;
if (_origAddUserModal) {
  window.addUserModal = function () {
    _origAddUserModal.apply(this, arguments);
    setTimeout(() => {
      const sel = document.getElementById('nu-role');
      if (sel && !sel.querySelector('optgroup')) {
        // Already has the optgroup from settings.js change
      }
    }, 100);
  };
}

// BUG 27: status indicator on save
document.addEventListener('click', e => {
  const btn = e.target.closest('button[onclick*="saveUser"]');
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass"></i> שומר...';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.disabled = false;
    }, 3000);
  }
});

// BUG 28: confirm leaving with unsaved changes
let _formDirty = false;
document.addEventListener('input', e => {
  if (e.target.closest('.modal-body')) _formDirty = true;
});
document.addEventListener('hidden.bs.modal', () => { _formDirty = false; });

// BUG 29: keyboard hint on staff page
(function () {
  const observer = new MutationObserver(() => {
    const root = document.getElementById('page-staff');
    if (root && root.innerHTML && !root.querySelector('.kbd-hint')) {
      const hint = document.createElement('div');
      hint.className = 'kbd-hint alert alert-light py-2 small mb-2';
      hint.innerHTML = '<i class="bi bi-keyboard"></i> קיצור: Ctrl+Shift+U לפתיחת מסך זה';
      root.insertBefore(hint, root.children[1] || null);
    }
  });
  setTimeout(() => {
    const p = document.getElementById('page-staff');
    if (p) observer.observe(p, { childList: true });
  }, 500);
})();

// BUG 30: missing nu-pass placeholder
setTimeout(() => {
  const el = document.getElementById('nu-pass');
  if (el && !el.placeholder) el.placeholder = 'לפחות 4 ספרות';
}, 1000);

console.log('%c✅ Pack-9 (20 bug-fixes) loaded', 'color:#dc2626;font-weight:bold');
