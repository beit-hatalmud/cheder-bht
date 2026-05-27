// behavior-pack-132.js — Live sync indicator + webhook health probe + auto-recovery. 2026-05-27
(function () {
  'use strict';

  const WEBHOOK = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  let lastHealthCheck = 0;
  let webhookStatus = 'unknown';

  /**
   * Probe webhook health.
   * Returns: 'ok' | 'slow' | 'down' | 'error'
   */
  async function probeWebhook() {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const r = await fetch(`${WEBHOOK}?action=ping&token=BHT_AGENT_2026`, {
        signal: controller.signal,
        method: 'GET',
        mode: 'cors',
      });
      clearTimeout(timeout);
      const elapsed = performance.now() - start;
      if (!r.ok) return { status: 'error', elapsed, code: r.status };
      return { status: elapsed > 3000 ? 'slow' : 'ok', elapsed };
    } catch (e) {
      return { status: 'down', error: e.message, elapsed: performance.now() - start };
    }
  }

  /**
   * Run periodic health checks (every 2 min).
   */
  async function runHealthLoop() {
    const result = await probeWebhook();
    webhookStatus = result.status;
    lastHealthCheck = Date.now();
    updateIndicator(result);

    // Auto-recovery: if down, trigger BhtSync to retry
    if (result.status === 'down' && navigator.onLine && typeof window.BhtSync !== 'undefined') {
      console.warn('[Pack-132] webhook down - triggering BhtSync.syncAll for recovery');
      try { await window.BhtSync.syncAll(); } catch {}
    }
  }

  function updateIndicator(result) {
    let ind = document.getElementById('webhook-status-132');
    if (!ind) {
      ind = document.createElement('div');
      ind.id = 'webhook-status-132';
      ind.style.cssText = 'position:fixed;bottom:8px;right:8px;background:#fff;border-radius:var(--bht-radius-pill,999px);padding:4px 12px;box-shadow:var(--bht-shadow-md,0 2px 4px rgba(0,0,0,0.06));font-size:11px;display:flex;gap:6px;align-items:center;z-index:9990;border:1px solid var(--bht-gray-200,#e5e7eb);cursor:pointer';
      ind.title = 'מצב חיבור לשרת';
      ind.onclick = () => {
        runHealthLoop();
        if (typeof window.toast === 'function') window.toast('בודק חיבור...', 'info', 2000);
      };
      document.body.appendChild(ind);
    }

    const colors = {
      ok: { dot: '#22c55e', text: 'שרת פעיל' },
      slow: { dot: '#fbbf24', text: 'שרת איטי' },
      down: { dot: '#dc2626', text: 'שרת לא זמין' },
      error: { dot: '#dc2626', text: 'שגיאת שרת' },
      unknown: { dot: '#9ca3af', text: 'בודק...' },
    };
    const c = colors[result.status] || colors.unknown;
    const elapsed = result.elapsed ? `(${result.elapsed.toFixed(0)}ms)` : '';
    ind.innerHTML = `
      <span style="width:8px;height:8px;border-radius:50%;background:${c.dot};box-shadow:0 0 6px ${c.dot}"></span>
      <span style="color:var(--bht-gray-700,#374151)">${c.text}</span>
      <span style="color:var(--bht-gray-400,#9ca3af);font-size:9px">${elapsed}</span>
    `;
  }

  // ===== Initial check + every 2 minutes =====
  setTimeout(runHealthLoop, 5000);
  setInterval(runHealthLoop, 2 * 60 * 1000);

  // ===== Probe on network online =====
  window.addEventListener('online', () => {
    setTimeout(runHealthLoop, 1000);
  });

  // ===== Expose for manual debugging =====
  window.probeWebhook = probeWebhook;
  window.getWebhookStatus = () => ({ status: webhookStatus, lastCheck: lastHealthCheck ? new Date(lastHealthCheck).toLocaleString('he-IL') : 'never' });

  console.warn('%c📡 Pack-132 — Webhook health probe (every 2min) + live indicator + auto-recovery', 'color:#0891b2;font-weight:bold');
  console.log('  Try: probeWebhook(), getWebhookStatus()');
})();
