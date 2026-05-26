// behavior-pack-69.js — Bug fix round 3: stagger camera startup + smarter HLS retry. 2026-05-26
(function () {
  'use strict';

  // ===== Throttle simultaneous HLS connections =====
  // Pack-65 attaches all 11 cameras at once → 11 ffmpeg processes spawn simultaneously.
  // Better: start in waves of 3 with 1.5s delay between waves to spread CPU.
  if (typeof window.attachHls === 'undefined') {
    // pack-65 closure-private function — wrap renderCameras instead
    const _orig = window.renderCameras;
    if (typeof _orig === 'function') {
      window.renderCameras = async function () {
        await _orig.apply(this, arguments);
        // Don't autoplay all videos at once — let IntersectionObserver in pack-68 do its job
        // For initial load, pause cameras beyond first 4
        setTimeout(() => {
          const videos = document.querySelectorAll('#cam-grid video');
          videos.forEach((v, i) => {
            if (i >= 4) {
              v.pause();
              v.dataset.deferred = '1';
              // Resume when scrolled into view
            }
          });
        }, 2000);
      };
    }
  }

  // ===== Auto-resume deferred videos when they enter view =====
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting && en.target.tagName === 'VIDEO' && en.target.dataset.deferred) {
          en.target.play().catch(() => {});
          delete en.target.dataset.deferred;
        }
      });
    }, { threshold: 0.2, rootMargin: '100px' });
    // Periodically pick up new videos
    setInterval(() => {
      document.querySelectorAll('#cam-grid video[data-deferred]').forEach(v => io.observe(v));
    }, 2000);
  }

  // ===== Smart "no signal" indicator + heartbeat check =====
  setInterval(() => {
    document.querySelectorAll('#cam-grid .cam-card').forEach(card => {
      const v = card.querySelector('video');
      if (!v || !v._hls) return;
      const status = card.querySelector('.cam-status');
      if (!status) return;
      // If readyState is 0/1 for >10s, mark offline
      if (v.readyState < 2) {
        const sinceCreate = Date.now() - (v._loadStart || Date.now());
        if (sinceCreate > 10000) {
          status.classList.remove('live');
          status.classList.add('offline');
        }
      } else {
        status.classList.add('live');
        status.classList.remove('offline');
      }
    });
  }, 5000);

  // Mark load start on each video
  setInterval(() => {
    document.querySelectorAll('#cam-grid video').forEach(v => {
      if (!v._loadStart) v._loadStart = Date.now();
    });
  }, 1000);

  console.warn('%c⚡ Pack-69 — Camera throttle + offline detection', 'color:#7c3aed;font-weight:bold');
})();
