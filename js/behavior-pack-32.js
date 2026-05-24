// behavior-pack-32.js — Theming & Personalization. 2026-05-25
(function () {
  'use strict';

  // ===== 1. Theme presets =====
  window.THEMES = {
    default: { primary: '#2563eb', success: '#16a34a', warning: '#f59e0b', danger: '#dc2626', bg: '#ffffff', fg: '#1f2937' },
    ocean:   { primary: '#0891b2', success: '#0d9488', warning: '#ca8a04', danger: '#dc2626', bg: '#f0f9ff', fg: '#0c4a6e' },
    forest:  { primary: '#16a34a', success: '#15803d', warning: '#ca8a04', danger: '#b91c1c', bg: '#f0fdf4', fg: '#14532d' },
    sunset:  { primary: '#ea580c', success: '#dc2626', warning: '#ca8a04', danger: '#7f1d1d', bg: '#fff7ed', fg: '#7c2d12' },
    royal:   { primary: '#7c3aed', success: '#6d28d9', warning: '#f59e0b', danger: '#dc2626', bg: '#faf5ff', fg: '#581c87' },
    sepia:   { primary: '#92400e', success: '#65a30d', warning: '#ca8a04', danger: '#991b1b', bg: '#fef3c7', fg: '#451a03' },
  };

  window.applyTheme = function (themeName) {
    const theme = THEMES[themeName] || THEMES.default;
    const root = document.documentElement;
    Object.entries(theme).forEach(([k, v]) => {
      root.style.setProperty(`--bht-${k}`, v);
    });
    localStorage.setItem('bht_theme', themeName);
    document.body.dataset.theme = themeName;
  };

  // Apply saved theme
  setTimeout(() => applyTheme(localStorage.getItem('bht_theme') || 'default'), 100);

  // ===== 2. Custom color picker =====
  window.setAccentColor = function (color) {
    document.documentElement.style.setProperty('--bht-primary', color);
    localStorage.setItem('bht_accent', color);
    if (typeof toast === 'function') toast(`צבע ראשי שונה`, 'success');
  };

  // ===== 3. Dark mode =====
  const darkStyle = document.createElement('style');
  darkStyle.textContent = `
    body.dark-mode {
      background: #0f172a !important;
      color: #f1f5f9 !important;
    }
    body.dark-mode .card, body.dark-mode .modal-content {
      background: #1e293b !important;
      color: #f1f5f9 !important;
      border-color: #334155 !important;
    }
    body.dark-mode .form-control, body.dark-mode .form-select {
      background: #0f172a !important;
      color: #f1f5f9 !important;
      border-color: #475569 !important;
    }
    body.dark-mode .text-muted { color: #94a3b8 !important; }
    body.dark-mode .table { color: #f1f5f9 !important; }
    body.dark-mode .alert-info { background: #1e3a8a !important; color: #dbeafe !important; }
    body.dark-mode .alert-warning { background: #78350f !important; color: #fed7aa !important; }
    body.dark-mode pre, body.dark-mode code { background: #1e293b !important; color: #f1f5f9 !important; }
  `;
  document.head.appendChild(darkStyle);

  window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    const on = document.body.classList.contains('dark-mode');
    localStorage.setItem('bht_theme_manual', '1');
    localStorage.setItem('bht_dark_mode', on ? '1' : '0');
    if (typeof toast === 'function') toast(on ? '🌙 מצב כהה' : '☀ מצב בהיר', 'info');
  };

  if (localStorage.getItem('bht_dark_mode') === '1') {
    document.body.classList.add('dark-mode');
  }

  // ===== 4. Theme picker UI =====
  window.openThemePicker = function () {
    const html = `<div class="modal fade show" id="theme-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5>🎨 ערכת נושא</h5><button class="btn-close" onclick="document.getElementById('theme-modal').remove()"></button></div>
          <div class="modal-body">
            <div class="row g-2">
              ${Object.entries(THEMES).map(([k, t]) => `
                <div class="col-6">
                  <button class="btn w-100 text-end" style="background:${t.bg};color:${t.fg};border:2px solid ${t.primary}" onclick="applyTheme('${k}');document.getElementById('theme-modal').remove();toast?.('ערכה: ${k}','success')">
                    <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${t.primary}"></span>
                    ${k}
                  </button>
                </div>`).join('')}
            </div>
            <hr>
            <button class="btn btn-outline-secondary w-100" onclick="toggleDarkMode();document.getElementById('theme-modal').remove()">
              🌙 החלף מצב כהה/בהיר
            </button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ===== 5. User preferences =====
  window.userPrefs = JSON.parse(localStorage.getItem('bht_user_prefs') || '{}');

  window.setPref = function (key, value) {
    userPrefs[key] = value;
    localStorage.setItem('bht_user_prefs', JSON.stringify(userPrefs));
  };

  window.getPref = function (key, def) {
    return userPrefs[key] !== undefined ? userPrefs[key] : def;
  };

  // ===== 6. Layout density =====
  window.setDensity = function (density) {
    document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    document.body.classList.add(`density-${density}`);
    setPref('density', density);
  };
  setTimeout(() => setDensity(getPref('density', 'comfortable')), 200);

  const densityStyle = document.createElement('style');
  densityStyle.textContent = `
    .density-compact .card { padding: 6px !important; }
    .density-compact .btn { padding: 4px 8px !important; font-size: 13px !important; }
    .density-spacious .card { padding: 20px !important; }
    .density-spacious .btn { padding: 12px 18px !important; }
  `;
  document.head.appendChild(densityStyle);

  // ===== 7. Custom CSS injection =====
  window.applyCustomCSS = function (css) {
    let style = document.getElementById('bht-custom-css');
    if (!style) {
      style = document.createElement('style');
      style.id = 'bht-custom-css';
      document.head.appendChild(style);
    }
    style.textContent = css;
    setPref('custom_css', css);
  };
  setTimeout(() => {
    const saved = getPref('custom_css');
    if (saved) applyCustomCSS(saved);
  }, 300);

  // ===== 8. Favicon dynamic =====
  window.setFavicon = function (emoji) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '52px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 32);
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = canvas.toDataURL('image/png');
  };

  // ===== 9. Theme picker button =====
  setTimeout(() => {
    if (document.getElementById('theme-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'theme-btn';
    btn.title = 'ערכת נושא';
    btn.setAttribute('aria-label', 'ערכת נושא');
    btn.style.cssText = 'position:fixed;bottom:260px;left:14px;width:42px;height:42px;border-radius:50%;background:#fff;border:1px solid #e5e7eb;font-size:18px;cursor:pointer;z-index:9990;box-shadow:0 4px 8px rgba(0,0,0,0.1)';
    btn.innerHTML = '🎨';
    btn.onclick = openThemePicker;
    document.body.appendChild(btn);
  }, 2500);

  // ===== 10. Welcome based on time of day =====
  window.getGreeting = function () {
    const h = new Date().getHours();
    if (h < 6) return '🌙 לילה טוב';
    if (h < 12) return '☀ בוקר טוב';
    if (h < 17) return '🌞 צהריים טובים';
    if (h < 21) return '🌅 ערב טוב';
    return '🌃 לילה טוב';
  };

  console.warn('%c🎨 Pack-32 — Themes: 6 presets, dark mode, density, custom CSS, dynamic favicon', 'color:#7c3aed;font-weight:bold');
})();
