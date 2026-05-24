// behavior-pack-4.js — sbbs 86-105. 2026-05-24.

// SBB 86: Backup download button
window.downloadFullBackup = function() {
  const backup = {
    version: 'v2.0',
    date: new Date().toISOString(),
    students: window._allStudents || [],
    events: window._events || [],
    tasks: window._tasks || [],
    projects: window._projects || [],
    signatures: window._bfSignatures || [],
    categories: window._categories || [],
  };
  const blob = new Blob(['﻿' + JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bht-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  if (typeof toast === 'function') toast('✓ גיבוי ירד', 'success');
};

// SBB 87: Restore from backup file
window.restoreFromFile = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('זה ידרוס את הנתונים המקומיים. להמשיך?')) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.events) window._events = data.events;
      if (data.tasks) window._tasks = data.tasks;
      if (data.projects) window._projects = data.projects;
      if (data.signatures) window._bfSignatures = data.signatures;
      if (typeof toast === 'function') toast('✓ שוחזר', 'success');
      if (typeof renderBehavior === 'function') renderBehavior();
    } catch (err) {
      alert('שגיאה: ' + err.message);
    }
  };
  input.click();
};

// SBB 88: Auto-resize textarea
document.addEventListener('input', (e) => {
  if (e.target.tagName === 'TEXTAREA') {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
  }
});

// SBB 89: Word count for description fields
document.addEventListener('input', (e) => {
  if (e.target.id !== 'ne-desc' && e.target.id !== 't-desc') return;
  let counter = e.target.parentNode.querySelector('.bht-word-count');
  if (!counter) {
    counter = document.createElement('small');
    counter.className = 'bht-word-count text-muted';
    counter.style.cssText = 'display:block;text-align:left;margin-top:2px;font-size:10px';
    e.target.parentNode.appendChild(counter);
  }
  const len = e.target.value.length;
  const words = e.target.value.trim().split(/\s+/).filter(Boolean).length;
  counter.textContent = `${words} מילים · ${len} תווים`;
});

// SBB 90: Speech-to-text on description fields (browser Speech API)
function injectMicButton(textareaId) {
  const ta = document.getElementById(textareaId);
  if (!ta || ta.dataset.micInjected) return;
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
  ta.dataset.micInjected = '1';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;display:flex;align-items:flex-start';
  ta.parentNode.insertBefore(wrapper, ta);
  wrapper.appendChild(ta);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.innerHTML = '🎤';
  btn.title = 'דבר במקום להקליד';
  btn.style.cssText = 'position:absolute;top:4px;left:4px;background:#fff;border:1px solid #d1d5db;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:14px;padding:0;display:flex;align-items:center;justify-content:center;z-index:2';
  wrapper.appendChild(btn);
  let recognition = null;
  let active = false;
  btn.onclick = (e) => {
    e.preventDefault();
    if (active) { recognition?.stop(); return; }
    const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognition = new SR();
    recognition.lang = 'he-IL';
    recognition.interimResults = true;
    recognition.continuous = true;
    let originalText = ta.value;
    btn.innerHTML = '⏹';
    btn.style.background = '#dc2626';
    btn.style.color = '#fff';
    active = true;
    recognition.onresult = (ev) => {
      let interim = '';
      let final = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
        else interim += ev.results[i][0].transcript;
      }
      ta.value = originalText + (originalText && (final||interim) ? ' ' : '') + final + interim;
    };
    recognition.onend = () => {
      btn.innerHTML = '🎤';
      btn.style.background = '#fff';
      btn.style.color = 'inherit';
      active = false;
    };
    recognition.onerror = () => recognition?.stop();
    recognition.start();
  };
}
// Hook into modals
document.addEventListener('shown.bs.modal', (e) => {
  setTimeout(() => {
    ['ne-desc', 't-desc', 'p-desc', 'siga-desc'].forEach(injectMicButton);
  }, 100);
});

// SBB 91: Show student photo if available
window.studentPhotoHtml = function(stu) {
  if (stu && stu['תמונה']) {
    return `<img src="${escHtml(stu['תמונה'])}" style="width:32px;height:32px;border-radius:50%;object-fit:cover" onerror="this.style.display='none'">`;
  }
  return '';
};

// SBB 92: Toast notification queue (don't overlap)
let _toastQueue = [];
let _toastActive = false;
const _origToast = window.toast;
window.toast = function(msg, type) {
  _toastQueue.push({ msg, type });
  drainToastQueue();
};
function drainToastQueue() {
  if (_toastActive || _toastQueue.length === 0) return;
  const { msg, type } = _toastQueue.shift();
  _toastActive = true;
  if (_origToast) _origToast(msg, type);
  setTimeout(() => { _toastActive = false; drainToastQueue(); }, 2500);
}

// SBB 93: Add CSS for textarea + mic button
const styleEl4 = document.createElement('style');
styleEl4.textContent = `
  textarea { transition: height .15s ease-out; }
  .bht-word-count { user-select: none; }
`;
document.head.appendChild(styleEl4);

// SBB 94: Highlight today's date in any list
window.highlightToday = function() {
  const today = new Date().toLocaleDateString('he-IL');
  document.querySelectorAll('.text-muted').forEach(el => {
    if (el.textContent.includes(today) && !el.dataset.todayMarked) {
      el.dataset.todayMarked = '1';
      el.innerHTML = '<span style="color:#0066cc;font-weight:600">' + el.innerHTML + '</span>';
    }
  });
};
setInterval(highlightToday, 5000);

// SBB 95: Reduce double-rendering of pages
let _renderInProgress = false;
const _origRenderBehavior = window.renderBehavior;
if (_origRenderBehavior) {
  window.renderBehavior = async function() {
    if (_renderInProgress) return;
    _renderInProgress = true;
    try { await _origRenderBehavior(); }
    finally { _renderInProgress = false; }
  };
}

console.log('%c✅ Pack-4 (sbbs 86-95) loaded', 'color:#16a34a;font-weight:bold');

// SBB 96: Birthday/anniversary banner (if any students born this month)
window.checkBirthdays = function() {
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();
  const birthdays = (window._allStudents||[]).filter(s => {
    const dob = s['תאריך לידה'];
    if (!dob) return false;
    const d = new Date(dob);
    return d.getMonth() + 1 === month && d.getDate() === day;
  });
  if (!birthdays.length || sessionStorage.getItem('birthday_notified_'+new Date().toISOString().slice(0,10))) return;
  sessionStorage.setItem('birthday_notified_'+new Date().toISOString().slice(0,10),'1');
  const names = birthdays.map(s => `${s['שם פרטי']||''} ${s['שם משפחה']||''}`.trim()).join(', ');
  setTimeout(() => {
    if (typeof toast === 'function') toast(`🎂 יום הולדת היום: ${names}`, 'success');
  }, 3000);
};
setTimeout(checkBirthdays, 3000);

// SBB 97: Smooth scroll on hash change
window.addEventListener('hashchange', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// SBB 98: Right-click context menu disabled (prevents accidental copy of UI)
// Actually, keep it - users want copy
// window.addEventListener('contextmenu', (e) => { if (e.target.closest('.btn,.nav-link')) e.preventDefault(); });

// SBB 99: Display total counts in #whats-new sidebar header
window.addCountsToWhatsNewHeader = function() {
  const counts = {
    events: (window._events||[]).length,
    tasks: (window._tasks||[]).length,
    projects: (window._projects||[]).length,
    students: (window._allStudents||[]).filter(s=>(s['סטטוס']||'פעיל')!=='סיים').length,
  };
  const header = document.querySelector('#whats-new-sidebar .wn-header');
  if (header && !header.dataset.counted) {
    header.dataset.counted = '1';
    const stats = document.createElement('div');
    stats.style.cssText = 'font-size:10px;font-weight:normal;margin-top:2px;opacity:0.85';
    stats.textContent = `${counts.students} תלמידים · ${counts.events} אירועים · ${counts.tasks} משימות · ${counts.projects} פרויקטים`;
    header.querySelector('h6')?.appendChild(stats);
  }
};
setInterval(addCountsToWhatsNewHeader, 5000);

// SBB 100: Final milestone log
console.log('%c🎯 100 סבבי שיפור הושלמו במצטבר!', 'color:#dc2626;font-size:16px;font-weight:bold');
