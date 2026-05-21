// whats-new.js — סרגל צד "מה חדש במערכת". טוען changelog.json ומציג חדשים.
// משתמש ב-localStorage כדי לזכור מה כבר נקרא. נכתב 2026-05-21.
const WHATS_NEW_KEY = 'bht_whats_new_seen';

const WHATS_NEW_TYPES = {
  feature: { icon: '✨', color: '#16a34a', label: 'חדש' },
  improvement: { icon: '⚡', color: '#0066cc', label: 'שיפור' },
  fix: { icon: '🔧', color: '#d97706', label: 'תיקון' },
};

let _whatsNewData = [];
let _whatsNewSeen = new Set();

async function loadWhatsNew() {
  try {
    const r = await fetch('changelog.json?_=' + Date.now());
    _whatsNewData = await r.json();
  } catch (e) {
    _whatsNewData = [];
  }
  try {
    _whatsNewSeen = new Set(JSON.parse(localStorage.getItem(WHATS_NEW_KEY) || '[]'));
  } catch (_) { _whatsNewSeen = new Set(); }
}

function whatsNewUnseenCount() {
  return _whatsNewData.filter(e => !_whatsNewSeen.has(e.id)).length;
}

function whatsNewRender() {
  const root = document.getElementById('whats-new-sidebar');
  if (!root) return;
  const sortedEntries = _whatsNewData.slice().sort((a, b) => b.id.localeCompare(a.id)).slice(0, 20);
  root.innerHTML = `
    <div class="wn-header">
      <h6 class="mb-0"><i class="bi bi-stars"></i> מה חדש</h6>
      <button class="wn-close" onclick="toggleWhatsNew(false)" title="סגור">×</button>
    </div>
    <div class="wn-actions">
      <button class="wn-btn-link" onclick="markAllWhatsNewSeen()">סמן הכל כנקרא</button>
    </div>
    <div class="wn-list">
      ${sortedEntries.map(e => {
        const t = WHATS_NEW_TYPES[e.type] || WHATS_NEW_TYPES.feature;
        const unseen = !_whatsNewSeen.has(e.id);
        return `<div class="wn-card ${unseen ? 'wn-new' : ''}" style="border-right-color:${t.color}">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <div class="wn-title">${t.icon} ${escHtml(e.title)}</div>
            ${unseen ? '<span class="wn-new-badge">חדש</span>' : ''}
          </div>
          <div class="wn-meta">
            <span class="wn-type" style="background:${t.color}22;color:${t.color}">${t.label}</span>
            <span class="wn-date">${escHtml(e.date)}</span>
          </div>
          <div class="wn-desc">${escHtml(e.desc)}</div>
        </div>`;
      }).join('')}
    </div>`;
}

function whatsNewToggleBadge() {
  const fab = document.getElementById('whats-new-fab');
  if (!fab) return;
  const count = whatsNewUnseenCount();
  const badge = fab.querySelector('.wn-fab-badge');
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline-block';
    fab.classList.add('wn-has-new');
  } else {
    badge.style.display = 'none';
    fab.classList.remove('wn-has-new');
  }
}

function toggleWhatsNew(open) {
  const sidebar = document.getElementById('whats-new-sidebar');
  if (!sidebar) return;
  const willOpen = open === undefined ? !sidebar.classList.contains('open') : open;
  sidebar.classList.toggle('open', willOpen);
  if (willOpen) {
    whatsNewRender();
  }
}

function markAllWhatsNewSeen() {
  _whatsNewData.forEach(e => _whatsNewSeen.add(e.id));
  try { localStorage.setItem(WHATS_NEW_KEY, JSON.stringify([..._whatsNewSeen])); } catch (_) {}
  whatsNewRender();
  whatsNewToggleBadge();
}

function whatsNewInit() {
  if (document.getElementById('whats-new-sidebar')) return;
  // Inject FAB + sidebar
  const container = document.createElement('div');
  container.innerHTML = `
    <button id="whats-new-fab" onclick="toggleWhatsNew()" title="מה חדש במערכת">
      <i class="bi bi-stars"></i>
      <span class="wn-fab-badge"></span>
    </button>
    <div id="whats-new-sidebar"></div>`;
  document.body.appendChild(container);
  loadWhatsNew().then(() => {
    whatsNewToggleBadge();
    // Auto-open on first load if there are unseen items
    if (whatsNewUnseenCount() > 0 && !sessionStorage.getItem('wn_auto_opened')) {
      sessionStorage.setItem('wn_auto_opened', '1');
      setTimeout(() => toggleWhatsNew(true), 1500);
    }
  });
}

// Auto-init when page is ready (only on logged-in pages, not login)
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', whatsNewInit);
  } else {
    whatsNewInit();
  }
}
