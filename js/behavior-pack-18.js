// behavior-pack-18.js — Voice Input + Speech. 2026-05-24
(function () {
  'use strict';

  const hasSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  // ===== 1. כפתור מיקרופון על כל textarea =====
  function addMicButton(textarea) {
    if (!hasSpeech || textarea.dataset.micAdded) return;
    textarea.dataset.micAdded = '1';
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;display:inline-block;width:100%';
    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.appendChild(textarea);

    const mic = document.createElement('button');
    mic.type = 'button';
    mic.className = 'btn btn-sm btn-outline-secondary';
    mic.style.cssText = 'position:absolute;bottom:6px;left:6px;padding:2px 8px;z-index:5';
    mic.innerHTML = '🎤';
    mic.title = 'הקלטה קולית';
    mic.setAttribute('aria-label', 'הקלטה');
    wrapper.appendChild(mic);

    mic.onclick = () => startVoiceInput(textarea, mic);
  }

  // DISABLED 2026-06-01 — was wrapping textareas in a new <div> every 2s.
  // Combined with pack-105's unwrap, this created a wrap/unwrap loop that stole
  // focus from users while they typed. Mic buttons are now off entirely.
  // setInterval(() => {
  //   document.querySelectorAll('textarea:not([data-mic-added])').forEach(addMicButton);
  // }, 2000);

  // ===== 2. Recognition logic =====
  window.startVoiceInput = function (target, button) {
    if (!hasSpeech) {
      if (typeof toast === 'function') toast('הדפדפן לא תומך בהקלטה קולית', 'warn');
      return;
    }
    const recog = new SR();
    recog.lang = 'he-IL';
    recog.continuous = true;
    recog.interimResults = true;

    let originalText = target.value;
    button.innerHTML = '🔴';
    button.style.background = '#dc2626';
    button.style.color = '#fff';

    recog.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += transcript + ' ';
        else interim += transcript;
      }
      target.value = originalText + final + interim;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    };

    recog.onerror = (e) => {
      console.warn('Speech error:', e.error);
      stop();
      if (typeof toast === 'function') toast('שגיאה בהקלטה: ' + e.error, 'error');
    };

    recog.onend = stop;
    function stop() {
      button.innerHTML = '🎤';
      button.style.background = '';
      button.style.color = '';
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }

    button.onclick = () => { recog.stop(); };
    recog.start();
    if (typeof toast === 'function') toast('מקליט... לחץ שוב לעצירה', 'info', 2000);
  };

  // ===== 3. Text-to-speech לדיווח (לקריאה לתלמיד) =====
  window.speakText = function (text, lang) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || 'he-IL';
    u.rate = 1.0;
    u.pitch = 1.0;
    speechSynthesis.cancel(); // stop any current
    speechSynthesis.speak(u);
  };

  // ===== 4. אייקון רמקול ליד אירועים =====
  setInterval(() => {
    document.querySelectorAll('[data-event-id]:not([data-speaker])').forEach(card => {
      card.dataset.speaker = '1';
      const desc = card.querySelector('.event-desc, .text-muted, [class*="white-space"]');
      if (!desc) return;
      const txt = desc.textContent;
      if (txt.length < 20) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-link p-0 ms-1';
      btn.innerHTML = '🔊';
      btn.title = 'הקרא בקול';
      btn.setAttribute('aria-label', 'הקרא');
      btn.onclick = (e) => {
        e.stopPropagation();
        speakText(txt);
      };
      const title = card.querySelector('strong');
      if (title && !title.querySelector('button[aria-label="הקרא"]')) {
        title.appendChild(btn);
      }
    });
  }, 3000);

  // ===== 5. Voice commands =====
  window.startVoiceCommand = function () {
    if (!hasSpeech) return;
    const recog = new SR();
    recog.lang = 'he-IL';
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (e) => {
      const cmd = e.results[0][0].transcript.toLowerCase().trim();
      processVoiceCommand(cmd);
    };
    recog.onerror = () => { if (typeof toast === 'function') toast('שגיאה בקול', 'warn'); };
    recog.start();
    if (typeof toast === 'function') toast('🎤 דבר עכשיו...', 'info', 2000);
  };

  window.processVoiceCommand = function (cmd) {
    const COMMANDS = [
      { kw: ['תלמידים', 'תלמיד'], action: () => goto('students') },
      { kw: ['התנהגות', 'אירוע'], action: () => goto('behavior') },
      { kw: ['בית', 'דף הבית'], action: () => goto('home') },
      { kw: ['משימות', 'משימה'], action: () => goto('tasks') },
      { kw: ['הגדרות'], action: () => goto('settings') },
      { kw: ['צוות', 'רבנים'], action: () => goto('staff') },
      { kw: ['חיפוש'], action: () => openGlobalSearch() },
      { kw: ['התראות'], action: () => showNotifications && showNotifications() },
      { kw: ['חדש', 'הוסף'], action: () => showQuickActions && showQuickActions() },
    ];
    for (const c of COMMANDS) {
      if (c.kw.some(k => cmd.includes(k))) {
        if (typeof toast === 'function') toast(`✓ "${cmd}"`, 'success', 1500);
        c.action();
        return;
      }
    }
    if (typeof toast === 'function') toast(`לא הבנתי: "${cmd}"`, 'warn');
  };

  // ===== 6. Voice command button =====
  if (hasSpeech) {
    setTimeout(() => {
      if (document.getElementById('voice-cmd-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'voice-cmd-btn';
      btn.title = 'פקודה קולית';
      btn.setAttribute('aria-label', 'פקודה קולית');
      btn.style.cssText = 'position:fixed;bottom:200px;left:14px;width:42px;height:42px;border-radius:50%;background:#7c3aed;color:#fff;border:none;font-size:18px;cursor:pointer;box-shadow:0 4px 8px rgba(0,0,0,0.2);z-index:9990';
      btn.innerHTML = '🎙';
      btn.onclick = startVoiceCommand;
      document.body.appendChild(btn);
    }, 1500);
  }

  // ===== 7. כפתור משוב קולי =====
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
      e.preventDefault();
      startVoiceCommand();
    }
  });

  // ===== 8. אזהרה אם דפדפן לא תומך =====
  if (!hasSpeech) {
    console.warn('SpeechRecognition לא נתמך. Chrome / Edge רק.');
  }

  // ===== 9. הקראת התראות חדשות =====
  let _lastNotifCount = 0;
  setInterval(() => {
    const notifs = window.notifications || [];
    const newCount = notifs.filter(n => !n.read).length;
    if (newCount > _lastNotifCount && newCount > 0) {
      const latest = notifs[0];
      if (latest && !latest.spoken) {
        latest.spoken = true;
        // Only auto-speak warnings/errors
        if (latest.type === 'warn' || latest.type === 'error') {
          // Optional - too intrusive maybe
          // speakText(latest.msg);
        }
      }
    }
    _lastNotifCount = newCount;
  }, 10000);

  // ===== 10. Language detect (heb/eng) =====
  window.detectLang = function (text) {
    const heb = (text.match(/[א-ת]/g) || []).length;
    const eng = (text.match(/[a-zA-Z]/g) || []).length;
    return heb > eng ? 'he-IL' : 'en-US';
  };

  console.warn('%c🎤 Pack-18 — Voice Input: mic buttons, voice commands, TTS, language detect', 'color:#7c3aed;font-weight:bold');
})();
