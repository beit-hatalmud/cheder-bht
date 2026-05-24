// behavior-pack-28.js — Notifications, Reminders & Push. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Browser native notifications =====
  window.requestNotifPermission = async function () {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const p = await Notification.requestPermission();
    return p === 'granted';
  };

  window.showNotification = function (title, body, opts) {
    if (Notification.permission !== 'granted') return null;
    const n = new Notification(title, {
      body, icon: '/favicon.ico', badge: '/favicon.ico',
      dir: 'rtl', lang: 'he-IL',
      ...opts,
    });
    setTimeout(() => n.close(), 8000);
    return n;
  };

  // ===== 2. Auto-request permission on first event create =====
  let _permRequested = localStorage.getItem('bht_notif_perm_requested') === '1';
  document.addEventListener('click', (e) => {
    if (_permRequested) return;
    const btn = e.target.closest('[onclick*="addBehavior"], [onclick*="addTask"]');
    if (btn) {
      _permRequested = true;
      localStorage.setItem('bht_notif_perm_requested', '1');
      setTimeout(requestNotifPermission, 500);
    }
  });

  // ===== 3. Reminder scheduler =====
  window.scheduleReminder = function (title, body, atTime) {
    const ts = new Date(atTime).getTime();
    const delay = ts - Date.now();
    if (delay <= 0) return false;
    const reminders = JSON.parse(localStorage.getItem('bht_reminders') || '[]');
    reminders.push({ id: 'rem_' + Date.now(), title, body, ts });
    localStorage.setItem('bht_reminders', JSON.stringify(reminders));
    setTimeout(() => {
      showNotification(title, body);
      if (typeof notify === 'function') notify(`${title}: ${body}`, 'info');
    }, Math.min(delay, 2147483640));
    return true;
  };

  // Restore reminders on load
  setTimeout(() => {
    try {
      const reminders = JSON.parse(localStorage.getItem('bht_reminders') || '[]');
      reminders.forEach(r => {
        const delay = r.ts - Date.now();
        if (delay > 0 && delay < 2147483640) {
          setTimeout(() => showNotification(r.title, r.body), delay);
        }
      });
      // Cleanup expired
      const active = reminders.filter(r => r.ts > Date.now());
      localStorage.setItem('bht_reminders', JSON.stringify(active));
    } catch (_) { }
  }, 3000);

  // ===== 4. Auto-reminder for upcoming task deadlines =====
  setInterval(async () => {
    try {
      const r = await api('listTasks', []);
      const tomorrow = Date.now() + 86400000;
      const today = Date.now();
      (r.data || []).forEach(t => {
        if (t['סטטוס'] === 'הושלם') return;
        if (!t['תאריך_יעד']) return;
        const due = new Date(t['תאריך_יעד']).getTime();
        if (due > today && due < tomorrow) {
          const key = `task_reminder_${t['מזהה']}`;
          if (sessionStorage.getItem(key)) return;
          sessionStorage.setItem(key, '1');
          showNotification('⏰ משימה לבצע', t['כותרת'] || '');
        }
      });
    } catch (_) { }
  }, 60 * 60 * 1000);

  // ===== 5. Sound alerts =====
  window.playSound = function (type) {
    const sounds = {
      success: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      notify: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
    };
    // Use Web Audio API beep instead - more reliable
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = type === 'error' ? 200 : type === 'success' ? 800 : 500;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) { }
  };

  // ===== 6. Sound on high-severity event =====
  window.addEventListener('cheder-data-refreshed', async (e) => {
    if (e.detail?.type === 'behavior' && e.detail?.action === 'addBehavior') {
      try {
        const r = await api('listBehavior', []);
        const latest = (r.data || []).sort((a, b) => new Date(b['תאריך']) - new Date(a['תאריך']))[0];
        if (latest?.['חומרה'] === 'גבוהה') playSound('error');
      } catch (_) { }
    }
  });

  // ===== 7. Snooze duration choices =====
  window.snoozeChoices = [
    { label: '10 דקות', ms: 10*60*1000 },
    { label: 'שעה', ms: 60*60*1000 },
    { label: 'מחר', ms: 24*60*60*1000 },
    { label: 'שבוע הבא', ms: 7*24*60*60*1000 },
  ];

  // ===== 8. Notification grouping =====
  let _notifBatch = [];
  let _notifTimer = null;
  window.batchNotify = function (msg, type) {
    _notifBatch.push({ msg, type });
    clearTimeout(_notifTimer);
    _notifTimer = setTimeout(() => {
      if (_notifBatch.length === 1) {
        if (typeof notify === 'function') notify(_notifBatch[0].msg, _notifBatch[0].type);
      } else if (_notifBatch.length > 1) {
        if (typeof notify === 'function') notify(`${_notifBatch.length} הודעות חדשות`, 'info');
      }
      _notifBatch = [];
    }, 1500);
  };

  // ===== 9. Custom reminder UI =====
  window.openReminderDialog = function () {
    const html = `<div class="modal fade show" id="rem-modal" style="display:block;background:rgba(0,0,0,0.4)" onclick="if(event.target===this)this.remove()">
      <div class="modal-dialog modal-sm" onclick="event.stopPropagation()">
        <div class="modal-content" style="direction:rtl">
          <div class="modal-header"><h5><i class="bi bi-alarm"></i> הוסף תזכורת</h5><button class="btn-close" onclick="document.getElementById('rem-modal').remove()"></button></div>
          <div class="modal-body">
            <input id="rem-title" class="form-control mb-2" placeholder="כותרת">
            <textarea id="rem-body" class="form-control mb-2" placeholder="תיאור"></textarea>
            <input id="rem-time" type="datetime-local" class="form-control mb-2">
            <button class="btn btn-primary w-100" onclick="(function(){
              const t=document.getElementById('rem-title').value.trim();
              const b=document.getElementById('rem-body').value.trim();
              const tm=document.getElementById('rem-time').value;
              if(!t||!tm){alert('חובה כותרת וזמן');return}
              scheduleReminder(t,b,tm);
              toast?.('תזכורת נשמרה','success');
              document.getElementById('rem-modal').remove();
            })()">קבע</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    // Default time = 1h from now
    const defTime = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
    document.getElementById('rem-time').value = defTime;
  };

  // ===== 10. Reminder list =====
  window.listReminders = function () {
    try {
      return JSON.parse(localStorage.getItem('bht_reminders') || '[]')
        .filter(r => r.ts > Date.now())
        .sort((a, b) => a.ts - b.ts);
    } catch (_) { return []; }
  };

  console.warn('%c🔔 Pack-28 — Notifications: browser API, reminders, sound, batching, custom UI', 'color:#dc2626;font-weight:bold');
})();
