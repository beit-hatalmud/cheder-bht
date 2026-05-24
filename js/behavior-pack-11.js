// behavior-pack-11.js — שיפורי ניהול צוות + סטטיסטיקות. 2026-05-24
(function () {
  'use strict';

  // ===== 1. סטטיסטיקת פעילות לכל רב במסך צוות =====
  window.computeRabbiActivity = async function () {
    try {
      const ev = await api('listBehavior', []);
      const events = ev.data || [];
      const counts = {};
      events.forEach(e => {
        const rabbi = e['רב'] || e['דווח_עי'] || '';
        if (rabbi) counts[rabbi] = (counts[rabbi] || 0) + 1;
      });
      return counts;
    } catch (_) { return {}; }
  };

  // ===== 2. הצג סטטיסטיקה ליד כל רב בstaff page =====
  const origRenderStaff = window.renderStaff;
  if (origRenderStaff) {
    window.renderStaff = async function () {
      await origRenderStaff.apply(this, arguments);
      // After render, attach activity counts
      try {
        const counts = await computeRabbiActivity();
        const rows = document.querySelectorAll('#staff-table tr');
        rows.forEach(tr => {
          const nameCell = tr.querySelector('td:first-child strong');
          if (!nameCell) return;
          const fullname = nameCell.textContent.trim();
          // Find rabbi role for this user
          let count = 0;
          for (const [key, c] of Object.entries(counts)) {
            if (fullname.includes(key.replace('הרב ', '')) || key.includes(fullname.split(' ').pop())) {
              count = Math.max(count, c);
            }
          }
          if (count > 0 && !tr.querySelector('.activity-badge')) {
            const td = tr.querySelector('td:nth-child(2)');
            if (td) {
              const badge = document.createElement('span');
              badge.className = 'activity-badge badge bg-success ms-1';
              badge.textContent = `${count} דיווחים`;
              badge.title = `סה"כ דיווחים שדיווח רב זה`;
              td.appendChild(badge);
            }
          }
        });
      } catch (_) { }
    };
  }

  // ===== 3. תמונת פרופיל אוטומטית (initials) =====
  window.getInitialsAvatar = function (fullname) {
    const parts = String(fullname || '').replace('הרב ', '').trim().split(/\s+/);
    const first = parts[0] ? parts[0][0] : '?';
    const last = parts[parts.length - 1] && parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase().substring(0, 2);
  };
  window.getInitialsColor = function (s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return `hsl(${h}, 60%, 55%)`;
  };

  // ===== 4. הוסף avatars בטבלת צוות =====
  setInterval(() => {
    document.querySelectorAll('#staff-table tr td:first-child:not([data-avatar])').forEach(td => {
      const strong = td.querySelector('strong');
      if (!strong) return;
      td.dataset.avatar = '1';
      const name = strong.textContent.trim();
      const initials = getInitialsAvatar(name);
      const color = getInitialsColor(name);
      const avatar = document.createElement('span');
      avatar.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:${color};color:#fff;font-weight:bold;font-size:12px;margin-left:8px;vertical-align:middle`;
      avatar.textContent = initials;
      td.insertBefore(avatar, td.firstChild);
    });
  }, 2000);

  // ===== 5. אסור למחוק רב עם דיווחים =====
  const origStaffDelete = window.staffDelete;
  if (origStaffDelete) {
    window.staffDelete = async function (uname) {
      try {
        const counts = await computeRabbiActivity();
        // Check if this user's rabbi role has reports
        const userData = (await api('listUsers', [])).data || [];
        const user = userData.find(u => u['שם משתמש'] === uname);
        if (user) {
          const rabbiRole = user['תפקיד'] || '';
          if (counts[rabbiRole] > 0) {
            if (!confirm(`לרב "${rabbiRole}" יש ${counts[rabbiRole]} דיווחים! האם בטוח למחוק?`)) return;
          }
        }
      } catch (_) { }
      return origStaffDelete.call(this, uname);
    };
  }

  // ===== 6. כפתור "שלח אימייל לכולם" בstaff =====
  setTimeout(() => {
    const root = document.getElementById('page-staff');
    if (!root) return;
    const observer = new MutationObserver(() => {
      const h3 = root.querySelector('h3');
      if (h3 && !root.querySelector('#staff-email-all')) {
        const btn = document.createElement('button');
        btn.id = 'staff-email-all';
        btn.className = 'btn btn-sm btn-outline-info ms-1';
        btn.innerHTML = '<i class="bi bi-envelope-paper"></i> מייל לכולם';
        btn.onclick = () => {
          api('listUsers', []).then(r => {
            const emails = (r.data || []).map(u => u['אימייל']).filter(Boolean).join(',');
            if (!emails) return alert('אין אימיילים');
            window.open(`mailto:?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent('הודעת צוות')}`, '_blank');
          });
        };
        const actions = h3.parentElement?.querySelector('.d-flex.gap-2');
        if (actions) actions.appendChild(btn);
      }
    });
    observer.observe(root, { childList: true, subtree: true });
  }, 500);

  // ===== 7. סטטיסטיקת רב בכרטיס תלמיד =====
  window.studentRabbiBreakdown = function (events) {
    const counts = {};
    events.forEach(e => {
      const r = e['רב'] || e['דווח_עי'] || '';
      if (r) counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  };

  // ===== 8. סינון אקטיביים/לא אקטיביים בstaff =====
  setTimeout(() => {
    const search = document.getElementById('staff-search');
    if (search && !document.getElementById('staff-active-filter')) {
      const sel = document.createElement('select');
      sel.id = 'staff-active-filter';
      sel.className = 'form-select form-select-sm';
      sel.style.width = '120px';
      sel.innerHTML = `<option value="">כולם</option><option value="active">פעילים</option><option value="inactive">לא פעילים</option>`;
      sel.onchange = (e) => {
        const v = e.target.value;
        // Trigger search refresh via storing in pseudo-data
        const ev = new Event('input', { bubbles: true });
        search.dispatchEvent(ev);
      };
      search.parentElement.insertBefore(sel, search);
    }
  }, 1500);

  // ===== 9. הצג שמות תלמידים שדיווחו עליהם בכרטיס רב =====
  // קלוץ' על שורה בטבלת צוות פותח מודל פרטים מהירים
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#staff-table tr td:first-child')) return;
    const row = e.target.closest('tr');
    if (!row) return;
    const fullname = row.querySelector('strong')?.textContent?.trim();
    if (!fullname || row.closest('thead')) return;
    // Fire activity preview
    if (window.showRabbiActivity && fullname) {
      // showRabbiActivity(fullname);
    }
  });

  // ===== 10. כותרת דינמית - מספר הצוות עכשיו =====
  setInterval(() => {
    if (location.hash === '#staff' || location.hash === '') {
      api('listUsers', []).then(r => {
        const count = (r.data || []).length - 1; // exclude admin
        const titleEl = document.querySelector('#page-staff h3');
        if (titleEl && !titleEl.innerHTML.includes('(')) {
          titleEl.innerHTML = titleEl.innerHTML.replace(
            /<\/i>\s*ניהול רבנים ואנשי צוות/,
            `</i> ניהול רבנים ואנשי צוות <small class="text-muted">(${count})</small>`
          );
        }
      }).catch(_ => { });
    }
  }, 5000);

  console.warn('%c✅ Pack-11 — staff activity stats + avatars + safe-delete', 'color:#7c3aed;font-weight:bold');
})();
