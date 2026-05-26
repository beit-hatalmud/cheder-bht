// behavior-pack-70.js — Bug fix round 4: single-camera mode + snapshot + camera settings. 2026-05-26
(function () {
  'use strict';

  const SOLO_KEY = 'cameras_solo_mode';

  function isSoloMode() { return localStorage.getItem(SOLO_KEY) === '1'; }
  function setSoloMode(v) { localStorage.setItem(SOLO_KEY, v ? '1' : '0'); }

  // ===== Apply solo mode after cameras render =====
  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = async function () {
      await _orig.apply(this, arguments);
      setTimeout(applySoloMode, 800);
      setTimeout(addToolbar, 200);
    };
  }

  function applySoloMode() {
    if (!isSoloMode()) return;
    const cards = document.querySelectorAll('#cam-grid .cam-card');
    cards.forEach((c, i) => {
      const v = c.querySelector('video');
      if (!v) return;
      if (i > 0) {
        try { v._hls?.destroy(); } catch {}
        v.pause();
        v.style.opacity = '0.4';
        c.classList.add('cam-solo-bg');
      }
    });
  }

  function addToolbar() {
    const root = document.getElementById('page-cameras');
    if (!root) return;
    if (root.querySelector('#cam-toolbar-pack70')) return;
    const header = root.querySelector('.d-flex.align-items-center.mb-3');
    if (!header) return;

    const tb = document.createElement('div');
    tb.id = 'cam-toolbar-pack70';
    tb.className = 'mb-3 d-flex gap-2 flex-wrap';
    tb.innerHTML = `
      <button class="btn btn-sm btn-outline-success" onclick="window.camToggleSolo()" id="solo-btn">${isSoloMode() ? '👁 חזור לכל המצלמות' : '🎯 מצלמה אחת בלבד (חוסך רוחב פס)'}</button>
      <button class="btn btn-sm btn-outline-info" onclick="window.camRestartAll()" title="הפעל מחדש את כל הזרמים">🔄 רענן הכל</button>
      <button class="btn btn-sm btn-outline-warning" onclick="window.camSnapshotAll()" title="צלם snapshot מכל מצלמה">📸 snapshot</button>
      <button class="btn btn-sm btn-outline-secondary" onclick="window.camStatus && cameraStatus()">📊 סטטוס</button>
    `;
    header.parentNode.insertBefore(tb, header.nextSibling);
  }

  window.camToggleSolo = function () {
    setSoloMode(!isSoloMode());
    location.reload();
  };

  window.camRestartAll = function () {
    if (typeof renderCameras === 'function') {
      renderCameras();
    }
  };

  // ===== Snapshot all cameras =====
  window.camSnapshotAll = function () {
    const videos = document.querySelectorAll('#cam-grid video');
    if (!videos.length) return alert('אין מצלמות');
    const grid = document.createElement('div');
    grid.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99999;overflow:auto;padding:20px';
    grid.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3">
      <h4>📸 Snapshot מכל המצלמות - ${new Date().toLocaleString('he-IL')}</h4>
      <div>
        <button class="btn btn-success" onclick="(()=>{const a=document.createElement('a');a.href=this.dataset.zip;a.download='snapshots.zip';})()">⬇ הורד</button>
        <button class="btn btn-primary" onclick="window.print()">🖨 הדפס</button>
        <button class="btn btn-secondary" onclick="this.closest('[data-snap]').remove()">✕ סגור</button>
      </div>
    </div>
    <div class="row g-3" id="snap-grid"></div>`;
    grid.setAttribute('data-snap', '1');
    document.body.appendChild(grid);

    const snapGrid = grid.querySelector('#snap-grid');
    videos.forEach((v, i) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = v.videoWidth || 352;
        canvas.height = v.videoHeight || 288;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const card = v.closest('.cam-card');
        const path = card?.dataset.path || '';
        const label = card?.querySelector('.cam-label')?.textContent || `מצלמה ${i+1}`;
        snapGrid.insertAdjacentHTML('beforeend', `
          <div class="col-md-4 col-lg-3">
            <div class="card">
              <img src="${dataUrl}" class="card-img-top" alt="${label}">
              <div class="card-body p-2"><small><b>${label}</b></small></div>
            </div>
          </div>`);
      } catch (e) {
        console.warn('Snapshot failed for', i, e);
      }
    });
  };

  console.warn('%c📸 Pack-70 — Camera solo mode + snapshot + toolbar', 'color:#9333ea;font-weight:bold');
})();
