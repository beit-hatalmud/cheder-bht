// Shared view-mode toggle (comfortable / compact / cards) per page.
// Stores preference in localStorage keyed by page id.

const VIEW_MODES = ['comfortable', 'compact', 'cards'];
const VIEW_MODE_LABELS = {
  comfortable: 'נוח',
  compact: 'צפוף',
  cards: 'קוביות',
};
const VIEW_MODE_ICONS = {
  comfortable: 'bi-list-ul',
  compact: 'bi-list',
  cards: 'bi-grid-3x3-gap-fill',
};

function _vmKey(pageId) { return `cheder_view_mode_${pageId}`; }

function getViewMode(pageId) {
  const v = localStorage.getItem(_vmKey(pageId));
  return VIEW_MODES.includes(v) ? v : 'comfortable';
}

function setViewMode(pageId, mode) {
  if (!VIEW_MODES.includes(mode)) return;
  localStorage.setItem(_vmKey(pageId), mode);
  applyViewMode(pageId, mode);
}

// Apply a mode by setting data-view-mode on the page container
function applyViewMode(pageId, mode) {
  const el = document.getElementById(`page-${pageId}`);
  if (el) el.setAttribute('data-view-mode', mode);
}

// Render a 3-button group bound to setViewMode. Place inside a page header.
function viewModeToggleHTML(pageId) {
  const cur = getViewMode(pageId);
  return `<div class="btn-group btn-group-sm view-mode-toggle" role="group" aria-label="תצוגה">
    ${VIEW_MODES.map(m => `
      <button type="button"
        class="btn btn-outline-secondary ${m===cur?'active':''}"
        title="תצוגה ${VIEW_MODE_LABELS[m]}"
        onclick="setViewMode('${pageId}','${m}'); document.querySelectorAll('#page-${pageId} .view-mode-toggle .btn').forEach(b => b.classList.remove('active')); this.classList.add('active');">
        <i class="bi ${VIEW_MODE_ICONS[m]}"></i>
      </button>`).join('')}
  </div>`;
}

// Apply the saved mode immediately after a render that creates #page-{pageId}
function activateViewMode(pageId) {
  applyViewMode(pageId, getViewMode(pageId));
}
