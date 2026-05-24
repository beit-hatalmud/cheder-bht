// behavior-pack-31.js — Search & Filters. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Fuzzy search algorithm =====
  window.fuzzyMatch = function (query, text) {
    if (!query) return true;
    query = String(query).toLowerCase().trim();
    text = String(text).toLowerCase();
    if (text.includes(query)) return true;
    // Word-by-word
    const qWords = query.split(/\s+/);
    return qWords.every(w => text.includes(w));
  };

  // ===== 2. Saved searches =====
  window.savedSearches = JSON.parse(localStorage.getItem('bht_saved_searches') || '[]');

  window.saveSearch = function (name, criteria) {
    savedSearches.push({ id: Date.now(), name, criteria, created: Date.now() });
    localStorage.setItem('bht_saved_searches', JSON.stringify(savedSearches));
    if (typeof toast === 'function') toast(`חיפוש "${name}" נשמר`, 'success');
  };

  window.runSavedSearch = function (id) {
    const s = savedSearches.find(x => x.id === id);
    if (!s) return null;
    return s.criteria;
  };

  // ===== 3. Advanced filter builder =====
  window.buildFilter = function (criteria) {
    return function (item) {
      for (const [field, condition] of Object.entries(criteria)) {
        const val = item[field];
        if (typeof condition === 'string') {
          if (!fuzzyMatch(condition, val)) return false;
        } else if (condition && typeof condition === 'object') {
          if (condition.equals !== undefined && val !== condition.equals) return false;
          if (condition.contains && !String(val).includes(condition.contains)) return false;
          if (condition.gt !== undefined && val <= condition.gt) return false;
          if (condition.lt !== undefined && val >= condition.lt) return false;
          if (condition.in && !condition.in.includes(val)) return false;
        }
      }
      return true;
    };
  };

  // ===== 4. Date range presets =====
  window.dateRangePresets = {
    today: () => {
      const d = new Date(); d.setHours(0,0,0,0);
      return { from: d.getTime(), to: Date.now() };
    },
    yesterday: () => {
      const from = new Date(); from.setDate(from.getDate()-1); from.setHours(0,0,0,0);
      const to = new Date(from); to.setHours(23,59,59);
      return { from: from.getTime(), to: to.getTime() };
    },
    this_week: () => {
      const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0);
      return { from: d.getTime(), to: Date.now() };
    },
    last_week: () => ({ from: Date.now() - 14*86400000, to: Date.now() - 7*86400000 }),
    this_month: () => {
      const d = new Date(); d.setDate(1); d.setHours(0,0,0,0);
      return { from: d.getTime(), to: Date.now() };
    },
    last_30: () => ({ from: Date.now() - 30*86400000, to: Date.now() }),
    last_90: () => ({ from: Date.now() - 90*86400000, to: Date.now() }),
    this_year: () => {
      const d = new Date(); d.setMonth(0, 1); d.setHours(0,0,0,0);
      return { from: d.getTime(), to: Date.now() };
    },
  };

  // ===== 5. Multi-select filter UI =====
  window.openMultiSelect = function (options, selected, onChange) {
    const html = `<div class="modal fade show" id="ms-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>בחר</h5><button class="btn-close" onclick="document.getElementById('ms-modal').remove()"></button></div>
          <div class="modal-body" style="max-height:60vh;overflow-y:auto">
            ${options.map(o => `<div class="form-check">
              <input class="form-check-input ms-cb" type="checkbox" value="${escAttr(o.value)}" ${selected?.includes(o.value)?'checked':''} id="ms-${escAttr(o.value)}">
              <label class="form-check-label" for="ms-${escAttr(o.value)}">${escHtml(o.label)}</label>
            </div>`).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="(function(){
              const vals=[...document.querySelectorAll('.ms-cb:checked')].map(c=>c.value);
              window.__msResult=vals;
              document.getElementById('ms-modal').remove();
            })()">אישור</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const observer = new MutationObserver(() => {
      if (!document.getElementById('ms-modal')) {
        observer.disconnect();
        if (onChange) onChange(window.__msResult || []);
      }
    });
    observer.observe(document.body, { childList: true });
  };

  // ===== 6. Search history =====
  const SEARCH_HISTORY_KEY = 'bht_search_history';
  window.recordSearch = function (query) {
    if (!query || query.length < 2) return;
    let history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    history = history.filter(q => q !== query);
    history.unshift(query);
    if (history.length > 20) history.pop();
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  };

  window.getSearchHistory = function () {
    try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]'); }
    catch { return []; }
  };

  // ===== 7. Search suggestions (autocomplete) =====
  window.searchSuggestions = async function (query) {
    if (!query || query.length < 2) return getSearchHistory().slice(0, 5);
    try {
      const r = await api('listStudents', []);
      const names = (r.data || []).map(s => `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim());
      return names.filter(n => fuzzyMatch(query, n)).slice(0, 8);
    } catch (_) { return []; }
  };

  // ===== 8. Filter by tags =====
  window.extractTags = function (text) {
    return (String(text||'').match(/#[֐-׿\w]+/g) || []).map(t => t.slice(1));
  };

  window.allUsedTags = async function () {
    try {
      const r = await api('listBehavior', []);
      const tagSet = new Set();
      (r.data || []).forEach(e => {
        extractTags(e['תיאור']).forEach(t => tagSet.add(t));
        extractTags(e['הערות']).forEach(t => tagSet.add(t));
      });
      return [...tagSet].sort();
    } catch (_) { return []; }
  };

  // ===== 9. Quick filter chips =====
  window.QUICK_FILTERS = {
    'today': 'היום',
    'high_severity': 'חומרה גבוהה',
    'my_events': 'שלי',
    'unresolved': 'לא נפתר',
    'this_week': 'השבוע',
  };

  // ===== 10. Search highlight =====
  window.highlightMatch = function (text, query) {
    if (!query || !text) return escHtml(text);
    const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return escHtml(text).replace(regex, '<mark style="background:#fef08a">$1</mark>');
  };

  console.warn('%c🔍 Pack-31 — Search: fuzzy match, saved searches, advanced filter, history, tags', 'color:#f59e0b;font-weight:bold');
})();
