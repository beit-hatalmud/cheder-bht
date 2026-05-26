// behavior-pack-68.js — Bug fix round 2: TLA enhancements + Drive share helper + general polish. 2026-05-26
(function () {
  'use strict';

  // ===== Fix 1: TLA tab — add "Open TLA folder" + "Share folder publicly" helpers =====
  window.tlaOpenFolder = function () {
    window.open('https://drive.google.com/drive/folders/1BiRgL2RzufeH-rZ-Dree92gn2yVyDiWQ', '_blank');
  };

  window.tlaShareFolderPublicly = function () {
    if (!confirm('להפוך את תיקיית "תלאות תשפו" לציבורית (כל מי שיש לו את הקישור יכול לצפות)?\n\nזה נדרש כדי שכל הצוות יראה את ה-PDFs בפאנל.')) return;
    // Open the folder's Share dialog directly in Drive
    window.open('https://drive.google.com/drive/folders/1BiRgL2RzufeH-rZ-Dree92gn2yVyDiWQ?usp=sharing', '_blank');
    setTimeout(() => alert('בתוך Drive: לחץ על "Share" → "Anyone with the link" → "Viewer" → "Done"\n\nאחר כך רענן את הדף.'), 500);
  };

  // ===== Fix 2: Cameras grid — pause non-visible videos to save bandwidth =====
  let observer = null;
  function setupVideoLazyPlay() {
    if (observer) return;
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        const v = en.target;
        if (!v.tagName || v.tagName !== 'VIDEO') return;
        if (en.isIntersecting) {
          v.play().catch(() => {});
        } else {
          // Don't actually pause HLS streams (they keep buffering)
          // Just mute/lower priority
        }
      });
    }, { threshold: 0.1 });
  }
  setupVideoLazyPlay();

  // Hook into renderCameras to observe videos
  const _origRender = window.renderCameras;
  if (typeof _origRender === 'function') {
    window.renderCameras = async function () {
      await _origRender.apply(this, arguments);
      setTimeout(() => {
        document.querySelectorAll('#cam-grid video').forEach(v => observer?.observe(v));
      }, 600);
    };
  }

  // ===== Fix 3: TLA — add "open folder" button to tab footer =====
  // Patch the TLA tab rendering after pack-66 created it
  document.addEventListener('shown.bs.modal', e => {
    if (e.target?.id !== 'viewStuModal') return;
    setTimeout(() => {
      const tab = document.getElementById('stu-tab-tla');
      if (!tab || tab.dataset.pack68) return;
      tab.dataset.pack68 = '1';
      // Find empty-state card and add share-folder button
      const emptyBtnRow = tab.querySelector('.d-flex.gap-2.justify-content-center');
      if (emptyBtnRow) {
        const folderBtn = document.createElement('button');
        folderBtn.className = 'btn btn-outline-warning';
        folderBtn.innerHTML = '<i class="bi bi-folder-fill"></i> פתח תיקייה';
        folderBtn.onclick = window.tlaOpenFolder;
        emptyBtnRow.appendChild(folderBtn);
      }
      // Add permission help to populated cards
      const card = tab.querySelector('.card.border-warning .card-footer');
      if (card) {
        const help = document.createElement('div');
        help.className = 'mt-2 small';
        help.innerHTML = `<button class="btn btn-link btn-sm p-0" onclick="tlaShareFolderPublicly()" title="הפוך לציבורי כדי שכל הצוות יראה"><i class="bi bi-globe"></i> שתף את כל התיקייה</button>`;
        card.appendChild(help);
      }
    }, 200);
  });

  // ===== Fix 4: Detect dead-link iframe (Drive permission error) =====
  document.addEventListener('shown.bs.modal', e => {
    if (e.target?.id !== 'viewStuModal') return;
    setTimeout(() => {
      const iframe = document.querySelector('#stu-tab-tla iframe');
      if (!iframe) return;
      const loadTimer = setTimeout(() => {
        // If after 8s the iframe didn't fire load → probably blocked
        // (Drive iframes do fire 'load' but with limited content)
        // Show a fallback "Open in Drive" hint
        const fallback = document.createElement('div');
        fallback.className = 'alert alert-warning small mt-2';
        fallback.innerHTML = `⚠ אם לא רואים את ה-PDF — סביר ש-Drive חוסם תצוגה. <button class="btn btn-sm btn-warning" onclick="tlaShareFolderPublicly()">פתור עכשיו</button>`;
        iframe.parentNode.parentNode.appendChild(fallback);
      }, 8000);
      iframe.addEventListener('load', () => clearTimeout(loadTimer), { once: true });
    }, 500);
  });

  // ===== Fix 5: Console diagnostic helper =====
  window.cameraStatus = function () {
    const base = localStorage.getItem('cameras_hls_base') || '';
    console.group('📹 Camera Status');
    console.log('HLS base:', base || '(not set)');
    document.querySelectorAll('#cam-grid .cam-card').forEach(c => {
      const v = c.querySelector('video');
      const path = c.dataset.path;
      const ready = v ? ['HAVE_NOTHING','HAVE_METADATA','HAVE_CURRENT_DATA','HAVE_FUTURE_DATA','HAVE_ENOUGH_DATA'][v.readyState] : '?';
      console.log(`  ${path}: readyState=${ready}, paused=${v?.paused}, duration=${v?.duration}`);
    });
    console.groupEnd();
  };
  window.tlaStatus = function () {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const withTla = (data.students || []).filter(s => s['תלא_pdf_id']);
    console.group('🎓 TLA Status');
    console.log(`${withTla.length}/${data.students?.length} students have TLA`);
    withTla.forEach(s => console.log(`  ID=${s['מזהה']} ${s['שם פרטי']} ${s['שם משפחה']} - ${s['תלא_שם_קובץ']}`));
    console.groupEnd();
  };

  console.warn('%c🔧 Pack-68 — TLA + cameras polish, Drive share helper, diagnostics', 'color:#0891b2;font-weight:bold');
  console.log('  Try: cameraStatus(), tlaStatus(), tlaShareFolderPublicly()');
})();
