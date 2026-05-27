// behavior-pack-86.js — Round 22: per-camera snapshot button + PIP support + memory cleanup. 2026-05-27
(function () {
  'use strict';

  // ===== Per-camera snapshot button =====
  function addSnapshotButtons() {
    const cards = document.querySelectorAll('.cam-webrtc-card');
    cards.forEach(card => {
      if (card.dataset.snap86) return;
      card.dataset.snap86 = '1';
      const path = card.dataset.path;
      const label = card.querySelector('.cam-webrtc-label')?.textContent || path;

      const btn = document.createElement('button');
      btn.className = 'cam-snap-btn';
      btn.title = 'צלם snapshot';
      btn.style.cssText = 'position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.7);color:#fff;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;z-index:3;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s';
      btn.innerHTML = '📸';
      card.appendChild(btn);

      // PIP button
      const pipBtn = document.createElement('button');
      pipBtn.className = 'cam-pip-btn';
      pipBtn.title = 'תמונה בתמונה';
      pipBtn.style.cssText = 'position:absolute;bottom:8px;right:48px;background:rgba(0,0,0,0.7);color:#fff;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;z-index:3;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s';
      pipBtn.innerHTML = '⧉';
      card.appendChild(pipBtn);

      card.addEventListener('mouseenter', () => { btn.style.opacity = '1'; pipBtn.style.opacity = '1'; });
      card.addEventListener('mouseleave', () => { btn.style.opacity = '0'; pipBtn.style.opacity = '0'; });

      btn.onclick = (e) => {
        e.stopPropagation();
        const video = card.querySelector('video');
        if (!video || video.readyState < 2) return alert('הסרטון לא טעון');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 352;
        canvas.height = video.videoHeight || 288;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Add timestamp overlay
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(5, canvas.height - 22, canvas.width - 10, 18);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        const ts = new Date().toLocaleString('he-IL');
        ctx.fillText(`${label.trim()} · ${ts}`, canvas.width - 10, canvas.height - 8);

        canvas.toBlob(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${path}_${Date.now()}.jpg`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 5000);
          if (typeof toast === 'function') toast('Snapshot שמור', 'success');
        }, 'image/jpeg', 0.9);
      };

      pipBtn.onclick = async (e) => {
        e.stopPropagation();
        const video = card.querySelector('video');
        if (!video || !document.pictureInPictureEnabled) return alert('PIP לא נתמך');
        try {
          if (document.pictureInPictureElement) await document.exitPictureInPicture();
          else await video.requestPictureInPicture();
        } catch (err) {
          alert('PIP error: ' + err.message);
        }
      };
    });
  }

  // ===== Memory cleanup: close PeerConnections when leaving cameras page =====
  let cleanupTimer = null;
  function maybeCleanup() {
    clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(() => {
      // If user is no longer on #cameras, close all PCs
      if (location.hash !== '#cameras' && !document.querySelector('#page-cameras:not(.d-none)')) {
        document.querySelectorAll('.cam-webrtc-card').forEach(card => {
          if (card._pc) {
            try { card._pc.close(); } catch {}
            delete card._pc;
          }
        });
        console.info('[Pack-86] cleaned up WebRTC connections');
      }
    }, 5000);
  }
  window.addEventListener('hashchange', maybeCleanup);

  // Apply on every renderCameras
  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const r = _orig.apply(this, arguments);
      setTimeout(addSnapshotButtons, 600);
      return r;
    };
  }

  console.warn('%c📸 Pack-86 — Per-camera snapshot + PIP + memory cleanup', 'color:#0891b2;font-weight:bold');
})();
