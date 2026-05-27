// behavior-pack-91.js — TLA auto-save (debounced) + scroll-to-top + warning on unsaved leave. 2026-05-27
(function () {
  'use strict';

  let saveTimer = null;
  let dirtySid = null;
  let lastSavedHash = '';

  // ===== Hash form fields content to detect changes =====
  function hashTlaForm(sid) {
    const fields = ['fullname','tz','shiur','mechanech','background','intellect','academic','talmidut','social',
      'baseline','goals','opportunities','evaluation','strengths','summary','changes',
      'mtg-אלול','mtg-חשון','mtg-כסלו','mtg-טבת','mtg-שבט','mtg-אדר',
      'prnt-אלול','prnt-חשון','prnt-כסלו','prnt-טבת','prnt-שבט','prnt-אדר'];
    let h = '';
    for (const f of fields) {
      h += '|' + (document.getElementById(`tla-${f}-${sid}`)?.value || '');
    }
    return h;
  }

  // ===== Attach auto-save listeners after TLA tab is shown =====
  document.addEventListener('shown.bs.tab', e => {
    if (e.target?.getAttribute('href') !== '#stu-tab-tla') return;
    const modal = document.getElementById('viewStuModal');
    if (!modal) return;
    const m = (modal.innerHTML.match(/addEventForStudent\((\d+)\)/) || [])[1];
    if (!m) return;
    const sid = parseInt(m);
    setupAutoSave(sid);
  });

  function setupAutoSave(sid) {
    const pane = document.getElementById('stu-tab-tla');
    if (!pane || pane.dataset.autosave91) return;
    pane.dataset.autosave91 = '1';

    lastSavedHash = hashTlaForm(sid);

    pane.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('input', () => {
        dirtySid = sid;
        clearTimeout(saveTimer);
        showStatus(sid, '✏️ עורך...', '#fbbf24');
        saveTimer = setTimeout(() => doAutoSave(sid), 4000);
      });
    });

    addStatusBadge(sid);
  }

  function addStatusBadge(sid) {
    const pane = document.getElementById('stu-tab-tla');
    if (!pane || pane.querySelector(`#tla-save-status-${sid}`)) return;
    const badge = document.createElement('div');
    badge.id = `tla-save-status-${sid}`;
    badge.style.cssText = 'position:sticky;top:0;background:#fff;padding:6px 12px;border-radius:0 0 8px 8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:5;display:inline-block;font-size:13px;color:#16a34a;margin-bottom:8px';
    badge.textContent = '✓ נשמר';
    pane.insertBefore(badge, pane.firstChild);
  }

  function showStatus(sid, text, color) {
    const el = document.getElementById(`tla-save-status-${sid}`);
    if (!el) return;
    el.textContent = text;
    el.style.color = color;
  }

  async function doAutoSave(sid) {
    const cur = hashTlaForm(sid);
    if (cur === lastSavedHash) return;
    showStatus(sid, '⏳ שומר...', '#3b82f6');
    if (typeof window.tlaSaveForm === 'function') {
      try {
        await window.tlaSaveForm(sid);
        lastSavedHash = cur;
        dirtySid = null;
        showStatus(sid, '✓ נשמר אוטומטית', '#16a34a');
      } catch (e) {
        showStatus(sid, '⚠ שגיאת שמירה', '#dc2626');
      }
    }
  }

  // ===== Warn before closing modal if unsaved =====
  document.addEventListener('hide.bs.modal', e => {
    if (e.target?.id !== 'viewStuModal') return;
    if (dirtySid !== null) {
      const cur = hashTlaForm(dirtySid);
      if (cur !== lastSavedHash) {
        clearTimeout(saveTimer);
        // Auto-save before closing
        doAutoSave(dirtySid);
      }
    }
  });

  // ===== Keyboard: Ctrl+S saves =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      const pane = document.getElementById('stu-tab-tla');
      if (pane && pane.classList.contains('active')) {
        e.preventDefault();
        if (dirtySid !== null) doAutoSave(dirtySid);
      }
    }
  });

  console.warn('%c💾 Pack-91 — TLA auto-save (4s debounce) + Ctrl+S + leave-warning', 'color:#16a34a;font-weight:bold');
})();
