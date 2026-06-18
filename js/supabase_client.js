/**
 * supabase_client.js
 * Initializes the Supabase client for cheder-bht and exposes window.supa.
 *
 * Loaded BEFORE api.js so api.js can opt into Supabase-backed actions
 * via the BHT_SUPABASE_ENABLED flag.
 */
(function () {
  'use strict';

  // Project: beit-hatalmud / cheder-bht (Asia-Pacific Singapore)
  const SUPABASE_URL = 'https://iythgizaqjivxtgwyexj.supabase.co';
  // Publishable key (safe to expose in browser; row-level security guards data).
  const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_kxoLoHUTY5c1IXloMcoWDw_40Frbf_6';

  // Per-domain feature flags so we can migrate one slice at a time without
  // breaking the rest. Flip to true once the corresponding migration has
  // been verified against the live data.
  const FLAGS = {
    auth: false,        // when true: api.authenticate uses supabase.auth
    users: false,       // when true: list/add/update/deleteUser via supabase
    students: false,
    behavior: false,
    attendance: false,
    audit: false,
  };

  function loadSdk() {
    return new Promise((resolve, reject) => {
      if (window.supabase && window.supabase.createClient) {
        resolve(window.supabase);
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.crossOrigin = 'anonymous';
      s.onload = () => {
        if (window.supabase && window.supabase.createClient) resolve(window.supabase);
        else reject(new Error('supabase-js loaded but createClient missing'));
      };
      s.onerror = () => reject(new Error('failed to load supabase-js'));
      document.head.appendChild(s);
    });
  }

  let initPromise = null;

  function init() {
    if (initPromise) return initPromise;
    initPromise = loadSdk()
      .then((sb) => {
        const client = sb.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: {
            persistSession: true,
            storageKey: 'cheder_bht_supabase_session',
            autoRefreshToken: true,
          },
          db: { schema: 'public' },
        });
        window.supa = client;
        window.supa.bht = {
          url: SUPABASE_URL,
          flags: FLAGS,
          enabled: (domain) => !!FLAGS[domain],
          /**
           * Sign in with a Google ID token (issued by GIS popup).
           * Supabase converts it into its own session.
           */
          signInWithGoogleIdToken: async (idToken) => {
            const { data, error } = await client.auth.signInWithIdToken({
              provider: 'google',
              token: idToken,
            });
            if (error) throw error;
            return data;
          },
          signOut: async () => {
            try { await client.auth.signOut(); } catch (_) {}
          },
          getSession: async () => {
            const { data } = await client.auth.getSession();
            return data && data.session ? data.session : null;
          },
        };
        // Dispatch a ready event so other scripts can wait for it.
        document.dispatchEvent(new CustomEvent('supabase-ready', { detail: { client } }));
        return client;
      })
      .catch((err) => {
        console.warn('[supabase] init failed:', err && err.message);
        // expose a stub so feature-flag checks short-circuit safely.
        window.supa = window.supa || {
          bht: {
            url: SUPABASE_URL,
            flags: FLAGS,
            enabled: () => false,
            signInWithGoogleIdToken: () => Promise.reject(new Error('supabase unavailable')),
            signOut: () => Promise.resolve(),
            getSession: () => Promise.resolve(null),
          },
        };
        throw err;
      });
    return initPromise;
  }

  // Kick off init right away. The promise is cached so callers that
  // `await window.supa.bht.ready` get the same client.
  window.supaReady = init();
})();
