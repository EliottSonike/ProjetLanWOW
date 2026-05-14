'use strict';

/*
  Fetche les données live depuis l'API et réinitialise les pages.
  Chargé en dernier dans chaque page concernée.
  Fallback transparent sur les données statiques si l'API est injoignable.
*/

(function () {

  const API = '/api';

  function apiFetch(endpoint) {
    return fetch(API + endpoint)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
  }

  function tryInit(fnName) {
    if (typeof window[fnName] === 'function') window[fnName]();
  }

  document.addEventListener('DOMContentLoaded', function () {

    // ── Progression ───────────────────────────────────────────────────
    if (document.getElementById('prog-page')) {
      apiFetch('/progression').then(data => {
        if (!data) return;
        window.PROGRESSION = data;
        tryInit('initProgression');
      });
    }

    // ── Raid Stats ────────────────────────────────────────────────────
    if (document.getElementById('stats-page')) {
      apiFetch('/stats').then(data => {
        if (!data) return;
        window.RAID_STATS = data;
        tryInit('initRaidStats');
      });
    }

    // ── Hall of Shame ─────────────────────────────────────────────────
    const shameEl = document.getElementById('shame-root') || document.getElementById('shame-page');
    if (shameEl) {
      apiFetch('/shame').then(data => {
        if (!data) return;
        window.HALL_OF_SHAME = data;
        tryInit('initHallOfShame');
      });
    }

  });

})();
