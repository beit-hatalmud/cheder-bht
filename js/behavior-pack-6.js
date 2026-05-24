// behavior-pack-6.js — sbbs 111-130. 2026-05-24.

// SBB 111: Sticky filter bar
const styleEl6 = document.createElement('style');
styleEl6.textContent = `
  #quick-filters { position: sticky; top: 60px; z-index: 100; background: white; padding: 8px 0; }
  .card.severity-high { border-right: 4px solid #dc2626; }
  .card.severity-mid { border-right: 4px solid #f59e0b; }
  .card.severity-low { border-right: 4px solid #16a34a; }
  body.compact-mode .card { padding: 8px !important; font-size: 13px; }
`;
document.head.appendChild(styleEl6);

// SBB 112: Page transition animation
document.addEventListener('hashchange', () => {
  const page = document.querySelector('[id^="page-"]:not(.d-none)');
  if (page) { page.style.opacity = '0'; setTimeout(() => page.style.opacity = '1', 50); }
});

// SBB 113: Show last-modified timestamp
window.lastSavedAt = null;
window.updateLastSaved = () => {
  window.lastSavedAt = Date.now();
  let el = document.getElementById('last-saved-ind');
  if (!el) {
    el = document.createElement('div');
    el.id = 'last-saved-ind';
    el.style.cssText = 'position:fixed;bottom:60px;left:14px;font-size:10px;color:#9ca3af;pointer-events:none;z-index:9990';
    document.body.appendChild(el);
  }
  el.textContent = 'נשמר עכשיו';
  setTimeout(() => { if(el) el.textContent = ''; }, 2000);
};

// SBB 114: Quick severity icons
window.severityIcon = (sev) => ({'גבוהה':'🔴', 'בינונית':'🟡', 'נמוכה':'🟢'}[sev] || '⚪');

// SBB 115: Bulk export with format selector
window.bulkExportMenu = function() {
  const html = `<div class="modal fade" id="bulk-exp" tabindex="-1"><div class="modal-dialog modal-sm"><div class="modal-content">
    <div class="modal-header"><h5>ייצוא נתונים</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <button class="btn btn-outline-success w-100 mb-2" onclick="hideModal('bulk-exp');exportBehaviorCSV()">📊 כל האירועים → CSV</button>
      <button class="btn btn-outline-primary w-100 mb-2" onclick="hideModal('bulk-exp');downloadFullBackup()">💾 כל הנתונים → JSON</button>
      <button class="btn btn-outline-info w-100" onclick="hideModal('bulk-exp');printBehaviorTab()">🖨 הדפסה</button>
    </div>
  </div></div></div>`;
  cleanupModal('bulk-exp');
  document.body.insertAdjacentHTML('beforeend', html);
  new bootstrap.Modal(document.getElementById('bulk-exp')).show();
};

// SBB 116: Tag-based filter
window.allTags = function() {
  const s = new Set();
  (window._events||[]).forEach(e => (e['תיאור']||'').match(/#\S+/g)?.forEach(t => s.add(t)));
  (window._tasks||[]).forEach(t => (t['תיאור']||'').match(/#\S+/g)?.forEach(tag => s.add(tag)));
  return [...s];
};

// SBB 117: Daily digest export
window.dailyDigest = function() {
  const today = new Date().toISOString().slice(0,10);
  const evs = (window._events||[]).filter(e => (e['תאריך']||'').startsWith(today));
  const tasks = (window._tasks||[]).filter(t => (t['תאריך_יצירה']||'').startsWith(today));
  const totalHigh = evs.filter(e => e['חומרה']==='גבוהה').length;
  return `📊 סיכום יומי - ${today}\n\nאירועים: ${evs.length} (${totalHigh} חומרה גבוהה)\nמשימות חדשות: ${tasks.length}\n\n${evs.map(e => `• ${e['שם תלמיד']||''}: ${e['קטגוריה']||''}`).join('\n')}`;
};

// SBB 118: Email daily digest
window.emailDailyDigest = () => {
  const txt = dailyDigest();
  window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent('סיכום יומי - '+new Date().toLocaleDateString('he-IL'))}&body=${encodeURIComponent(txt)}`, '_blank');
};

// SBB 119: WhatsApp daily digest
window.whatsappDailyDigest = () => {
  window.open('https://wa.me/?text=' + encodeURIComponent(dailyDigest()), '_blank');
};

// SBB 120: Help button — already added; add quick keyboard hint
console.log('💡 Tip: לחץ ? לעזרה מלאה, Ctrl+K לחיפוש, 1-5 למעבר tabs');

console.log('%c✅ Pack-6 (sbbs 111-120) loaded', 'color:#16a34a;font-weight:bold');
