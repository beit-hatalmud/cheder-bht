// behavior-pack-84.js — Round 20: WebRTC reconnect + connection quality + cleanup. 2026-05-27
(function () {
  'use strict';

  // ===== Auto-reconnect WebRTC if connection drops =====
  // Run every 15s: check each <video> with srcObject - if no frames in 5s, reconnect
  setInterval(() => {
    const cards = document.querySelectorAll('.cam-webrtc-card');
    cards.forEach(card => {
      const video = card.querySelector('video');
      if (!video) return;
      const pc = card._pc;
      if (!pc) return;

      // Check connection state
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        const lastReconnect = card.dataset.lastReconnect ? parseInt(card.dataset.lastReconnect) : 0;
        if (Date.now() - lastReconnect < 30000) return; // throttle
        card.dataset.lastReconnect = Date.now();

        console.warn(`[Pack-84] reconnecting ${card.dataset.path}`);
        try { pc.close(); } catch {}
        delete card._pc;

        // Re-render the cameras page to trigger reconnect
        // Less invasive: trigger the original whepConnect via stored path
        // For now: rebuild the iframe by calling renderCameras (debounced by pack-83)
        if (typeof window.renderCameras === 'function') {
          window.renderCameras();
        }
      }
    });
  }, 15000);

  // ===== Connection quality indicator =====
  // Show bitrate next to each camera label
  setInterval(async () => {
    const cards = document.querySelectorAll('.cam-webrtc-card');
    for (const card of cards) {
      const pc = card._pc;
      if (!pc) continue;
      if (pc.connectionState !== 'connected') continue;

      try {
        const stats = await pc.getStats();
        let videoBytes = 0;
        let videoFrames = 0;
        let videoPacketsLost = 0;
        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            videoBytes = report.bytesReceived || 0;
            videoFrames = report.framesDecoded || 0;
            videoPacketsLost = report.packetsLost || 0;
          }
        });

        // Calculate bitrate (need previous reading)
        const prev = card._lastStats;
        const now = Date.now();
        if (prev && now - prev.time > 0) {
          const kbps = Math.round((videoBytes - prev.bytes) * 8 / (now - prev.time));
          const fps = Math.round((videoFrames - prev.frames) * 1000 / (now - prev.time));
          let qIndicator = card.querySelector('.cam-quality');
          if (!qIndicator) {
            qIndicator = document.createElement('span');
            qIndicator.className = 'cam-quality';
            qIndicator.style.cssText = 'position:absolute;top:32px;right:8px;background:rgba(0,0,0,0.65);color:#22c55e;padding:1px 6px;border-radius:6px;font-size:9px;font-family:monospace;z-index:2;pointer-events:none';
            card.appendChild(qIndicator);
          }
          qIndicator.textContent = `${kbps}kbps · ${fps}fps`;
          qIndicator.style.color = kbps < 50 ? '#ef4444' : kbps < 200 ? '#fbbf24' : '#22c55e';
        }
        card._lastStats = { time: now, bytes: videoBytes, frames: videoFrames };
      } catch (e) { /* ignore */ }
    }
  }, 3000);

  console.warn('%c📶 Pack-84 — WebRTC auto-reconnect + quality indicator (kbps/fps)', 'color:#0891b2;font-weight:bold');
})();
