'use strict';

(function () {

  const SIM_RUNS       = 10000;
  const MAX_CHART_WEEK = 20;

  /* ── Monte Carlo ───────────────────────────────────────────── */
  function runSim(dropPct, runs) {
    const p   = dropPct / 100;
    const out = new Int32Array(runs);
    for (let i = 0; i < runs; i++) {
      let w = 0;
      do { w++; } while (Math.random() > p);
      out[i] = w;
    }
    return out;
  }

  function makeBuckets(results) {
    const b = new Array(MAX_CHART_WEEK + 1).fill(0);
    for (let i = 0; i < results.length; i++) {
      const w = results[i];
      b[w <= MAX_CHART_WEEK ? w - 1 : MAX_CHART_WEEK]++;
    }
    return b;
  }

  /* ── Bar chart ─────────────────────────────────────────────── */
  function renderChart(id, buckets, farmWeeks) {
    const el = document.getElementById(id);
    if (!el) return;
    const n   = buckets.reduce((a, b) => a + b, 0);
    const max = Math.max(...buckets) || 1;

    let html = '';
    for (let i = 0; i <= MAX_CHART_WEEK; i++) {
      const week  = i + 1;
      const count = buckets[i];
      const h     = Math.round((count / max) * 100);
      const pct   = (count / n * 100).toFixed(1);
      const lbl   = i === MAX_CHART_WEEK ? (MAX_CHART_WEEK + 1) + '+' : week;
      let cls = 'rng-bar-col';
      if (farmWeeks > 0) {
        if (week < farmWeeks)      cls += ' past';
        else if (week === farmWeeks) cls += ' current';
      }
      html +=
        `<div class="${cls}" title="Sem. ${lbl} : ${pct}%">` +
        `<div class="rng-bar" style="height:${h}%"></div>` +
        `<div class="rng-bar-lbl">${lbl}</div>` +
        `</div>`;
    }
    el.innerHTML = html;
  }

  /* ── Stats block ───────────────────────────────────────────── */
  function renderStats(id, results, dropPct, farmWeeks) {
    const el = document.getElementById(id);
    if (!el) return;
    const p       = dropPct / 100;
    const exp     = (1 / p).toFixed(1);
    const n       = results.length;
    const gotIt   = Array.from(results).filter(w => w <= Math.max(farmWeeks, 0)).length;
    const pctHave = farmWeeks > 0 ? (gotIt / n * 100).toFixed(1) : '—';

    el.innerHTML =
      `<div class="rng-stat-row"><span>Espérance de drop</span><strong>${exp} semaines</strong></div>` +
      `<div class="rng-stat-row"><span>Après ${farmWeeks} sem., probabilité d'avoir l'item</span><strong>${pctHave}%</strong></div>`;
  }

  /* ── Curse meter ───────────────────────────────────────────── */
  function renderMeter(id, results, farmWeeks) {
    const el = document.getElementById(id);
    if (!el) return;
    if (farmWeeks === 0) { el.innerHTML = ''; return; }

    const n        = results.length;
    const gotIt    = Array.from(results).filter(w => w <= farmWeeks).length;
    const stillPct = ((n - gotIt) / n * 100);

    let level, label, emoji;
    if      (stillPct <= 5)  { level = 'blessed';     label = 'Béni des dieux';    emoji = '✨'; }
    else if (stillPct <= 20) { level = 'lucky';        label = 'Chanceux';          emoji = '🍀'; }
    else if (stillPct <= 50) { level = 'average';      label = 'Dans la moyenne';   emoji = '😐'; }
    else if (stillPct <= 75) { level = 'unlucky';      label = 'Malchanceux';       emoji = '😬'; }
    else if (stillPct <= 90) { level = 'cursed';       label = 'Maudit';            emoji = '💀'; }
    else                     { level = 'mega-cursed';  label = 'ÉPIQUEMENT MAUDIT'; emoji = '☠️'; }

    el.innerHTML =
      `<div class="rng-meter rng-meter-${level}">` +
      `<span class="rng-meter-ico">${emoji}</span>` +
      `<div><div class="rng-meter-lbl">${label}</div>` +
      `<div class="rng-meter-sub">${stillPct.toFixed(1)}% des joueurs farm encore</div></div>` +
      `</div>`;
  }

  /* ── Dying Curse ───────────────────────────────────────────── */
  function initDyingCurse() {
    const rateEl  = document.getElementById('dc-rate');
    const weeksEl = document.getElementById('dc-weeks');
    if (!rateEl) return;

    let cache = null, cacheRate = -1;

    function update() {
      const rate  = +rateEl.value;
      const weeks = +weeksEl.value;
      document.getElementById('dc-rate-val').textContent  = rate + '%';
      document.getElementById('dc-weeks-val').textContent = weeks;

      if (rate !== cacheRate) { cache = runSim(rate, SIM_RUNS); cacheRate = rate; }

      renderChart('dc-chart', makeBuckets(cache), weeks);
      renderStats('dc-stats', cache, rate, weeks);
      renderMeter('dc-curse-meter', cache, weeks);
    }

    rateEl.addEventListener('input', update);
    weeksEl.addEventListener('input', update);
    update();
  }

  /* ── Drop Simulator ────────────────────────────────────────── */
  function initDropSim() {
    const rateEl  = document.getElementById('ds-rate');
    const killsEl = document.getElementById('ds-kills');
    const btn     = document.getElementById('ds-btn');
    if (!rateEl) return;

    rateEl.addEventListener('input',  () => { document.getElementById('ds-rate-val').textContent  = rateEl.value + '%'; });
    killsEl.addEventListener('input', () => { document.getElementById('ds-kills-val').textContent = killsEl.value; });

    btn.addEventListener('click', () => {
      const rate  = +rateEl.value;
      const kills = +killsEl.value;
      const p     = rate / 100;
      const drops = [];
      for (let k = 1; k <= kills; k++) if (Math.random() < p) drops.push(k);

      const exp    = (kills * p).toFixed(1);
      const result = document.getElementById('ds-result');
      if (!result) return;

      let badge = '';
      if (drops.length === 0)
        badge = `<div class="rng-ds-msg bad">🥲 Aucun drop sur ${kills} kills… RNG is real.</div>`;
      else if (drops.length >= Math.round(+exp * 1.5))
        badge = `<div class="rng-ds-msg good">🎉 RNG à bloc ! Drop(s) au kill #${drops.join(', #')}.</div>`;
      else
        badge = `<div class="rng-ds-msg">Drop(s) au kill #${drops.join(', #')}.</div>`;

      result.innerHTML =
        `<div class="rng-stats-box">` +
        `<div class="rng-stat-row"><span>Kills simulés</span><strong>${kills}</strong></div>` +
        `<div class="rng-stat-row"><span>Drops obtenus</span><strong class="${drops.length === 0 ? 'rng-val-bad' : 'rng-val-good'}">${drops.length}</strong></div>` +
        `<div class="rng-stat-row"><span>Attendu en moyenne</span><strong>${exp}</strong></div>` +
        `</div>${badge}`;
    });
  }

  /* ── /roll ─────────────────────────────────────────────────── */
  function initRoll() {
    const btn = document.getElementById('roll-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const checked = document.querySelectorAll('#rng-player-checks input:checked');
      const players = Array.from(checked).map(c => c.value);
      if (players.length < 2) { alert('Sélectionne au moins 2 joueurs !'); return; }

      const rolls = players
        .map(p => ({ name: p, roll: Math.ceil(Math.random() * 100) }))
        .sort((a, b) => b.roll - a.roll);

      const ranks  = ['🥇', '🥈', '🥉', '4.', '5.'];
      const result = document.getElementById('roll-result');
      if (!result) return;

      let html = '<div class="rng-roll-list">';
      rolls.forEach((r, i) => {
        html +=
          `<div class="rng-roll-row${i === 0 ? ' winner' : ''}">` +
          `<span class="rng-roll-rank">${ranks[i] || (i + 1) + '.'}</span>` +
          `<span class="rng-roll-name">${r.name}</span>` +
          `<span class="rng-roll-score">${r.roll}</span>` +
          `</div>`;
      });
      html += `</div><div class="rng-roll-winner">🏆 ${rolls[0].name} remporte le loot avec ${rolls[0].roll} !</div>`;
      result.innerHTML = html;
    });
  }

  /* ── Tabs ──────────────────────────────────────────────────── */
  function initTabs() {
    document.querySelectorAll('.rng-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.rng-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.rng-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById('rng-' + tab.dataset.tab);
        if (panel) panel.classList.add('active');
      });
    });
  }

  initTabs();
  initDyingCurse();
  initDropSim();
  initRoll();

})();
