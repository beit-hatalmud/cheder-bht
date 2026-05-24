// behavior-pack-19.js — Image Attachments. 2026-05-24
(function () {
  'use strict';

  // ===== 1. Image upload field לאירועים =====
  window.attachImageToEvent = async function (eventId, file) {
    if (!file) return null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dataUrl = reader.result;
          const attachments = JSON.parse(localStorage.getItem('bht_attachments') || '{}');
          if (!attachments[eventId]) attachments[eventId] = [];
          attachments[eventId].push({
            ts: Date.now(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: dataUrl,
          });
          // Keep total under 5MB
          let total = JSON.stringify(attachments).length;
          while (total > 5 * 1024 * 1024 && attachments[eventId].length > 1) {
            attachments[eventId].shift();
            total = JSON.stringify(attachments).length;
          }
          localStorage.setItem('bht_attachments', JSON.stringify(attachments));
          resolve(dataUrl);
        } catch (e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  window.getEventAttachments = function (eventId) {
    try {
      const all = JSON.parse(localStorage.getItem('bht_attachments') || '{}');
      return all[eventId] || [];
    } catch (_) { return []; }
  };

  // ===== 2. Drag & drop כל מקום =====
  let _dropOverlay = null;
  document.addEventListener('dragenter', e => {
    e.preventDefault();
    if (_dropOverlay) return;
    _dropOverlay = document.createElement('div');
    _dropOverlay.id = 'drop-overlay';
    _dropOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(59,130,246,0.5);color:#fff;font-size:36px;display:flex;align-items:center;justify-content:center;z-index:99999;pointer-events:none;backdrop-filter:blur(4px);font-family:Heebo,Arial';
    _dropOverlay.textContent = '📷 שחרר תמונה כאן';
    document.body.appendChild(_dropOverlay);
  });
  document.addEventListener('dragleave', e => {
    if (e.clientX === 0 && e.clientY === 0 && _dropOverlay) {
      _dropOverlay.remove();
      _dropOverlay = null;
    }
  });
  document.addEventListener('dragover', e => { e.preventDefault(); });
  document.addEventListener('drop', e => {
    e.preventDefault();
    if (_dropOverlay) { _dropOverlay.remove(); _dropOverlay = null; }
    const files = [...(e.dataTransfer?.files || [])];
    const images = files.filter(f => f.type.startsWith('image/'));
    if (!images.length) return;
    handleDroppedImages(images);
  });

  window.handleDroppedImages = async function (files) {
    const modal = document.querySelector('.modal.show');
    if (modal) {
      const desc = modal.querySelector('textarea#b-desc, textarea[id$="-desc"], textarea[id$="-work"]');
      if (desc) {
        for (const f of files) {
          const dataUrl = await attachImageToEvent('temp_' + Date.now(), f);
          // Insert image marker in description
          desc.value += `\n[📷 ${f.name}]`;
          desc.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (typeof toast === 'function') toast(`✓ ${files.length} תמונות צורפו`, 'success');
        return;
      }
    }
    // No modal - just upload via Apps Script urlToDrive proxy
    if (typeof toast === 'function') toast(`${files.length} תמונות זוהו - פתח אירוע לשמירה`, 'info');
  };

  // ===== 3. Paste image מהcliboard =====
  document.addEventListener('paste', async (e) => {
    const items = [...(e.clipboardData?.items || [])];
    const imgItem = items.find(i => i.type.startsWith('image/'));
    if (!imgItem) return;
    const blob = imgItem.getAsFile();
    if (!blob) return;
    await handleDroppedImages([blob]);
  });

  // ===== 4. Image viewer modal =====
  window.viewImage = function (dataUrl, name) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
    modal.onclick = () => modal.remove();
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = name || '';
    img.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;border-radius:8px';
    modal.appendChild(img);
    document.body.appendChild(modal);
  };

  // ===== 5. Camera capture =====
  window.captureFromCamera = async function () {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (typeof toast === 'function') toast('מצלמה לא נתמכת בדפדפן זה', 'warn');
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center';
      video.style.cssText = 'max-width:90vw;max-height:80vh';
      overlay.appendChild(video);
      const captureBtn = document.createElement('button');
      captureBtn.className = 'btn btn-light btn-lg mt-3';
      captureBtn.innerHTML = '📸 צלם';
      overlay.appendChild(captureBtn);
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn btn-outline-light mt-2';
      closeBtn.textContent = 'בטל';
      overlay.appendChild(closeBtn);
      document.body.appendChild(overlay);
      return new Promise((resolve) => {
        captureBtn.onclick = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          stream.getTracks().forEach(t => t.stop());
          overlay.remove();
          resolve(dataUrl);
        };
        closeBtn.onclick = () => {
          stream.getTracks().forEach(t => t.stop());
          overlay.remove();
          resolve(null);
        };
      });
    } catch (e) {
      if (typeof toast === 'function') toast('שגיאת מצלמה: ' + e.message, 'error');
      return null;
    }
  };

  // ===== 6. אייקון מצלמה בתיאור =====
  setInterval(() => {
    document.querySelectorAll('textarea[id^="b-"]:not([data-camera])').forEach(t => {
      t.dataset.camera = '1';
      const wrap = t.parentNode;
      if (!wrap || wrap.style.position !== 'relative') return; // need mic wrapper to have run
      const cam = document.createElement('button');
      cam.type = 'button';
      cam.className = 'btn btn-sm btn-outline-secondary';
      cam.style.cssText = 'position:absolute;bottom:6px;left:42px;padding:2px 8px;z-index:5';
      cam.innerHTML = '📷';
      cam.title = 'צלם';
      cam.setAttribute('aria-label', 'צלם תמונה');
      cam.onclick = async (e) => {
        e.preventDefault();
        const dataUrl = await captureFromCamera();
        if (dataUrl) {
          t.value += '\n[📷 צילום ' + new Date().toLocaleTimeString('he-IL') + ']';
          // Save in attachments
          const id = 'temp_' + Date.now();
          attachImageToEvent(id, await dataUrlToBlob(dataUrl, 'capture.jpg'));
        }
      };
      wrap.appendChild(cam);
    });
  }, 3000);

  async function dataUrlToBlob(dataUrl, name) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], name, { type: blob.type });
  }

  // ===== 7. תצוגת תמונות באירוע =====
  setInterval(() => {
    document.querySelectorAll('[data-event-id]:not([data-img-shown])').forEach(card => {
      card.dataset.imgShown = '1';
      const id = card.dataset.eventId;
      const atts = getEventAttachments(id);
      if (!atts.length) return;
      const gallery = document.createElement('div');
      gallery.style.cssText = 'display:flex;gap:6px;margin-top:8px;flex-wrap:wrap';
      atts.forEach(a => {
        if (!a.type?.startsWith('image/')) return;
        const img = document.createElement('img');
        img.src = a.data;
        img.alt = a.name;
        img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:zoom-in;border:1px solid #e5e7eb';
        img.onclick = (e) => { e.stopPropagation(); viewImage(a.data, a.name); };
        gallery.appendChild(img);
      });
      card.appendChild(gallery);
    });
  }, 3000);

  // ===== 8. סטטיסטיקת attachments =====
  window.attachmentStats = function () {
    try {
      const all = JSON.parse(localStorage.getItem('bht_attachments') || '{}');
      let total = 0, count = 0;
      Object.values(all).forEach(arr => {
        arr.forEach(a => { total += a.size || 0; count++; });
      });
      return {
        events_with_images: Object.keys(all).length,
        total_files: count,
        total_size: `${(total/1024/1024).toFixed(1)} MB`,
        quota_pct: `${((total/(5*1024*1024))*100).toFixed(0)}%`,
      };
    } catch (_) { return null; }
  };

  // ===== 9. ניקוי attachments ישנים =====
  window.cleanOldAttachments = function (daysOld) {
    daysOld = daysOld || 90;
    const cutoff = Date.now() - daysOld * 86400000;
    try {
      const all = JSON.parse(localStorage.getItem('bht_attachments') || '{}');
      let removed = 0;
      Object.keys(all).forEach(eid => {
        const before = all[eid].length;
        all[eid] = all[eid].filter(a => a.ts > cutoff);
        removed += before - all[eid].length;
        if (!all[eid].length) delete all[eid];
      });
      localStorage.setItem('bht_attachments', JSON.stringify(all));
      if (typeof toast === 'function') toast(`נמחקו ${removed} תמונות ישנות`, 'success');
      return removed;
    } catch (_) { return 0; }
  };

  // ===== 10. Resize automatic =====
  window.resizeImage = function (dataUrl, maxWidth) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, (maxWidth || 1024) / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    });
  };

  console.warn('%c📷 Pack-19 — Image Attachments: drag-drop, paste, camera, resize, viewer', 'color:#0891b2;font-weight:bold');
})();
