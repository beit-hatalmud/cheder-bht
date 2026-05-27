// behavior-pack-87.js — Round 23: per-camera record 30s clip + improved snapshot UX. 2026-05-27
(function () {
  'use strict';

  const RECORD_DURATION_MS = 30000;

  function addRecordButtons() {
    const cards = document.querySelectorAll('.cam-webrtc-card');
    cards.forEach(card => {
      if (card.dataset.rec87) return;
      card.dataset.rec87 = '1';
      const path = card.dataset.path;
      const label = card.querySelector('.cam-webrtc-label')?.textContent || path;

      const btn = document.createElement('button');
      btn.className = 'cam-rec-btn';
      btn.title = 'הקלט 30 שניות';
      btn.style.cssText = 'position:absolute;bottom:8px;right:88px;background:rgba(0,0,0,0.7);color:#fff;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;z-index:3;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s';
      btn.innerHTML = '⏺';
      card.appendChild(btn);

      card.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
      card.addEventListener('mouseleave', () => { btn.style.opacity = '0'; });

      btn.onclick = (e) => {
        e.stopPropagation();
        const video = card.querySelector('video');
        if (!video || !video.srcObject) return alert('הסרטון לא טעון');
        if (card._recording) return alert('כבר מקליט');

        if (typeof MediaRecorder === 'undefined') return alert('הדפדפן לא תומך בהקלטה');

        const stream = video.srcObject;
        let mime = 'video/webm;codecs=vp9,opus';
        if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';

        try {
          const rec = new MediaRecorder(stream, { mimeType: mime });
          const chunks = [];
          rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
          rec.onstop = () => {
            const blob = new Blob(chunks, { type: mime });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${path}_${Date.now()}.webm`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 8000);
            card._recording = false;
            btn.innerHTML = '⏺';
            btn.style.color = '#fff';
            btn.style.background = 'rgba(0,0,0,0.7)';
            if (typeof toast === 'function') toast(`הקלטה ${label.trim()} נשמרה`, 'success');
          };

          rec.start();
          card._recording = true;
          btn.innerHTML = '⏹';
          btn.style.color = '#fff';
          btn.style.background = '#dc2626';
          if (typeof toast === 'function') toast(`מקליט ${RECORD_DURATION_MS/1000}s...`, 'info');

          // Auto-stop after duration OR manual click
          const stopFn = () => { if (rec.state === 'recording') rec.stop(); };
          const t = setTimeout(stopFn, RECORD_DURATION_MS);
          btn.dataset.timer = t;

          // Allow manual stop by re-clicking
          const stopHandler = (ev) => {
            ev.stopPropagation();
            clearTimeout(parseInt(btn.dataset.timer || '0'));
            stopFn();
            btn.removeEventListener('click', stopHandler);
          };
          btn.addEventListener('click', stopHandler);
        } catch (err) {
          alert('שגיאת הקלטה: ' + err.message);
          card._recording = false;
        }
      };
    });
  }

  // ===== Snapshot keyboard shortcut: S =====
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input,textarea,select')) return;
    if (e.key === 's' && location.hash === '#cameras' && !e.ctrlKey && !e.metaKey) {
      // Snapshot all cameras at once
      const card = document.querySelector('.cam-webrtc-card');
      if (!card) return;
      e.preventDefault();
      if (typeof window.camSnapshotAll === 'function') {
        window.camSnapshotAll();
      } else {
        // Manual snapshot first camera
        card.querySelector('.cam-snap-btn')?.click();
      }
    }
  });

  const _orig = window.renderCameras;
  if (typeof _orig === 'function') {
    window.renderCameras = function () {
      const r = _orig.apply(this, arguments);
      setTimeout(addRecordButtons, 700);
      return r;
    };
  }

  console.warn('%c⏺ Pack-87 — Per-camera 30s recording (WebM) + S shortcut for snapshot', 'color:#dc2626;font-weight:bold');
})();
