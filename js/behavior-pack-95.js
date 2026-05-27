// behavior-pack-95.js — CRITICAL: read TLA data from דוח_אישי field (Apps Script drops unknown cols). 2026-05-27
(function () {
  'use strict';

  // Override parseTlaData globally
  window.parseTlaData = function (s) {
    if (!s) return {};
    // Try תלא_data first (legacy)
    if (s['תלא_data']) {
      try { return JSON.parse(s['תלא_data']); } catch {}
    }
    // Try extract from דוח_אישי field
    const doch = s['דוח_אישי'] || '';
    const m = doch.match(/\[TLA_JSON_START\]([\s\S]*?)\[TLA_JSON_END\]/);
    if (m) {
      try { return JSON.parse(m[1]); } catch (e) {
        console.warn('[Pack-95] failed to parse TLA from דוח_אישי:', e);
      }
    }
    return {};
  };

  // Override tlaSaveForm to save back to דוח_אישי
  window.tlaSaveForm = async function (sid) {
    const data = typeof getVisibleData === 'function' ? getVisibleData() : { students: [] };
    const s = (data.students || []).find(x => String(x['מזהה']) === String(sid));
    if (!s) return alert('תלמיד לא נמצא');

    function v(id) { return document.getElementById(`tla-${id}-${sid}`)?.value || ''; }

    const tlaData = {
      mechanech: v('mechanech'),
      profile: {
        background: v('background'),
        intellect: v('intellect'),
        academic: v('academic'),
        talmidut: v('talmidut'),
        social: v('social'),
      },
      program: {
        baseline: v('baseline'),
        goals: v('goals'),
        opportunities: v('opportunities'),
        evaluation: v('evaluation'),
        strengths: v('strengths'),
        summary: v('summary'),
      },
      meetings: {
        אלול: v('mtg-אלול'), חשון: v('mtg-חשון'), כסלו: v('mtg-כסלו'),
        טבת: v('mtg-טבת'), שבט: v('mtg-שבט'), אדר: v('mtg-אדר'),
      },
      parents: {
        אלול: v('prnt-אלול'), חשון: v('prnt-חשון'), כסלו: v('prnt-כסלו'),
        טבת: v('prnt-טבת'), שבט: v('prnt-שבט'), אדר: v('prnt-אדר'),
      },
      changes: v('changes'),
    };

    // Preserve existing דוח_אישי content (strip old TLA marker, then append new)
    const existing = (s['דוח_אישי'] || '').replace(/\[TLA_JSON_START\][\s\S]*?\[TLA_JSON_END\]/g, '').trim();
    const newDoch = (existing ? existing + '\n\n' : '') + `[TLA_JSON_START]${JSON.stringify(tlaData)}[TLA_JSON_END]`;

    const updated = Object.assign({}, s, {
      'דוח_אישי': newDoch,
      'תז': v('tz') || s['תז'] || '',
      'פרופיל_הורים': tlaData.profile.background || s['פרופיל_הורים'] || '',
      'פרופיל_אישיות': tlaData.profile.social || s['פרופיל_אישיות'] || '',
      'פרופיל_לימודי': tlaData.profile.academic || s['פרופיל_לימודי'] || '',
    });

    const r = await api('updateStudent', [updated]);
    if (r && r.ok !== false) {
      if (typeof toast === 'function') toast('תל"א נשמר ✓', 'success');
      else alert('✓ נשמר');
    } else {
      alert('שגיאה: ' + (r?.error || '?'));
    }
  };

  // Re-render any open TLA tabs with updated data parser
  setTimeout(() => {
    const pane = document.getElementById('stu-tab-tla');
    if (pane && typeof window.injectTlaTab === 'function') {
      pane.remove();
      const link = document.querySelector('a[href="#stu-tab-tla"]');
      if (link) link.parentNode.remove();
      window.injectTlaTab();
    }
  }, 1500);

  console.warn('%c💾 Pack-95 CRITICAL — TLA data now read/written via דוח_אישי field (Apps Script ignored תלא_data)', 'color:#dc2626;font-weight:bold;font-size:14px');
})();
