// behavior-pack-122.js — Visually modernize Add Student form using theme.css tokens. 2026-05-27
// First showcase of design system in action.
(function () {
  'use strict';

  // ===== Replace addStudentModal with modern design =====
  const _origAddStudent = window.addStudentModal;
  window.addStudentModal = function () {
    // Try to get class options from data
    const data = (typeof window.getData === 'function') ? window.getData() :
                 (typeof window.getVisibleData === 'function') ? window.getVisibleData() : { classes: [] };
    const classOpts = (data.classes || []).slice()
      .sort((a, b) => parseInt(a['סדר']) - parseInt(b['סדר']))
      .map(c => `<option value="${c['שם']}">${c['שם']}</option>`).join('');

    // Use theme.css variables for consistency
    const html = `
      <div class="modal fade" id="addStudentModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content" style="border:0;border-radius:var(--bht-radius-lg,12px);overflow:hidden;box-shadow:var(--bht-shadow-xl,0 8px 24px rgba(0,0,0,0.12))">
            <!-- Modern gradient header -->
            <div class="modal-header" style="background:linear-gradient(135deg,var(--bht-primary,#1e3a8a),var(--bht-primary-light,#3b82f6));color:#fff;border:0;padding:var(--bht-space-4,16px) var(--bht-space-5,20px)">
              <h5 style="margin:0;font-size:var(--bht-font-size-lg,17px);font-weight:600;color:#fff">
                <i class="bi bi-person-plus-fill"></i> תלמיד חדש
              </h5>
              <button class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="סגור"></button>
            </div>
            <div class="modal-body" style="padding:var(--bht-space-5,20px);background:var(--bht-gray-50,#f9fafb)">
              <!-- Section: שמות -->
              <div class="bht-card" style="background:#fff;padding:var(--bht-space-4,16px);border-radius:var(--bht-radius-md,8px);box-shadow:var(--bht-shadow-sm,0 1px 2px rgba(0,0,0,0.05));margin-bottom:var(--bht-space-3,12px)">
                <div style="font-weight:600;color:var(--bht-primary,#1e3a8a);font-size:var(--bht-font-size-sm,12px);margin-bottom:var(--bht-space-2,8px);display:flex;align-items:center;gap:6px">
                  <i class="bi bi-person"></i> פרטי תלמיד
                </div>
                <div class="row g-2">
                  <div class="col-6"><label class="form-label small" style="color:var(--bht-gray-700,#374151)">שם פרטי *</label><input id="ns-fname" class="form-control" required></div>
                  <div class="col-6"><label class="form-label small" style="color:var(--bht-gray-700,#374151)">שם משפחה *</label><input id="ns-lname" class="form-control" required></div>
                  <div class="col-4"><label class="form-label small">גיל</label><input id="ns-age" type="number" class="form-control" min="3" max="18"></div>
                  <div class="col-8"><label class="form-label small">שיעור</label>
                    <select id="ns-cycle" class="form-select">
                      <option value="">— בחר שיעור —</option>
                      ${classOpts}
                    </select>
                  </div>
                </div>
              </div>

              <!-- Section: הורים -->
              <div class="bht-card" style="background:#fff;padding:var(--bht-space-4,16px);border-radius:var(--bht-radius-md,8px);box-shadow:var(--bht-shadow-sm,0 1px 2px rgba(0,0,0,0.05));margin-bottom:var(--bht-space-3,12px)">
                <div style="font-weight:600;color:var(--bht-primary,#1e3a8a);font-size:var(--bht-font-size-sm,12px);margin-bottom:var(--bht-space-2,8px);display:flex;align-items:center;gap:6px">
                  <i class="bi bi-people-fill"></i> פרטי הורים
                </div>
                <div class="row g-2">
                  <div class="col-6"><label class="form-label small">שם אם</label><input id="ns-mname" class="form-control"></div>
                  <div class="col-6"><label class="form-label small">טלפון אם</label><input id="ns-mphone" type="tel" class="form-control" style="direction:ltr;text-align:left"></div>
                  <div class="col-6"><label class="form-label small">שם אב</label><input id="ns-fname2" class="form-control"></div>
                  <div class="col-6"><label class="form-label small">טלפון אב</label><input id="ns-fphone" type="tel" class="form-control" style="direction:ltr;text-align:left"></div>
                  <div class="col-12"><label class="form-label small">כתובת</label><input id="ns-addr" class="form-control" placeholder="רחוב, עיר"></div>
                </div>
              </div>

              <!-- Section: רפואי / הערות -->
              <div class="bht-card" style="background:#fff;padding:var(--bht-space-4,16px);border-radius:var(--bht-radius-md,8px);box-shadow:var(--bht-shadow-sm,0 1px 2px rgba(0,0,0,0.05))">
                <div style="font-weight:600;color:var(--bht-danger,#dc2626);font-size:var(--bht-font-size-sm,12px);margin-bottom:var(--bht-space-2,8px);display:flex;align-items:center;gap:6px">
                  <i class="bi bi-exclamation-triangle"></i> מידע רפואי + הערות
                </div>
                <div class="row g-2">
                  <div class="col-12"><label class="form-label small" style="color:var(--bht-danger,#dc2626)">אלרגיה / רגישות</label>
                    <input id="ns-allergy" class="form-control" placeholder="בוטנים, גלוטן, פנצילין..." style="background:#fef2f2;border-color:#fecaca">
                  </div>
                  <div class="col-12"><label class="form-label small">הערות נוספות</label><textarea id="ns-notes" class="form-control" rows="2" placeholder="כל מידע חשוב שכדאי שהצוות יידע..."></textarea></div>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="background:#fff;border-top:1px solid var(--bht-gray-200,#e5e7eb);padding:var(--bht-space-3,12px) var(--bht-space-5,20px);gap:var(--bht-space-2,8px)">
              <button class="btn btn-secondary" data-bs-dismiss="modal" style="border-radius:var(--bht-radius-md,8px);padding:8px 18px">
                ביטול
              </button>
              <button class="btn btn-primary" onclick="saveStudent()" style="background:var(--bht-primary,#1e3a8a);border:0;border-radius:var(--bht-radius-md,8px);padding:8px 20px;font-weight:600">
                <i class="bi bi-check-circle-fill"></i> שמור תלמיד
              </button>
            </div>
          </div>
        </div>
      </div>`;

    if (typeof window.cleanupModal === 'function') cleanupModal('addStudentModal');
    else document.getElementById('addStudentModal')?.remove();

    document.body.insertAdjacentHTML('beforeend', html);
    const modalEl = document.getElementById('addStudentModal');
    if (window.bootstrap?.Modal) new bootstrap.Modal(modalEl).show();
    modalEl.addEventListener('hidden.bs.modal', () => {
      if (typeof window.cleanupModal === 'function') cleanupModal('addStudentModal');
    }, { once: true });

    // Auto-focus first input
    setTimeout(() => document.getElementById('ns-fname')?.focus(), 200);
  };

  // ===== Tell SW to update cache =====
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) reg.update();  // Force check for new version
    });
  }

  console.warn('%c✨ Pack-122 — Add Student form REDESIGNED with theme.css (3-section card layout, gradient header, modern inputs)', 'color:#7c3aed;font-weight:bold;font-size:14px');
})();
