'use strict';

(function () {

  const ROLES = {
    Fripon:   { role: 'dps',  class: 'warlock', icon: '🧙' },
    Eliott:  { role: 'dps',  class: 'mage',    icon: '🔥' },
    Fabien:  { role: 'dps',  class: '',         icon: '⚔️' },
    Gredin:    { role: 'tank', class: 'paladin',  icon: '🛡️' },
    Tristan: { role: 'heal', class: 'paladin',  icon: '💚' },
  };

  function init() {
    const root = document.getElementById('stats-page');
    if (!root) return;

    const data = window.RAID_STATS;
    if (!data) return;

    if (!data.sessions || data.sessions.length === 0) {
      root.innerHTML = `
        <div class="stats-empty">
          <div class="stats-empty-icon">📊</div>
          <h3>Aucune session enregistrée</h3>
          <p>Les stats apparaîtront ici après votre première session de raid.<br>
          Remplissez <code>data/raid-stats.js</code> après chaque session.</p>
        </div>`;
      return;
    }

    /* ── Agrégation des données ───────────────────────────────── */
    const totals = {}; // par joueur
    const bossStats = {}; // par boss
    let totalKills = 0, totalWipes = 0, totalSessions = data.sessions.length;

    data.players.forEach(p => {
      totals[p] = { dps: [], hps: [], deaths: 0, kills: 0 };
    });

    data.sessions.forEach(session => {
      session.bosses.forEach(boss => {
        if (boss.killed) totalKills++;
        totalWipes += boss.wipes || 0;

        if (!bossStats[boss.name]) bossStats[boss.name] = { kills: 0, wipes: 0, bestDps: {} };
        if (boss.killed) bossStats[boss.name].kills++;
        bossStats[boss.name].wipes += boss.wipes || 0;

        boss.performances.forEach(p => {
          if (!totals[p.player]) return;
          if (p.dps  > 0) totals[p.player].dps.push(p.dps);
          if (p.hps  > 0) totals[p.player].hps.push(p.hps);
          totals[p.player].deaths += p.deaths || 0;
          if (boss.killed) totals[p.player].kills++;

          if (p.dps > 0) {
            if (!bossStats[boss.name].bestDps[p.player] || p.dps > bossStats[boss.name].bestDps[p.player])
              bossStats[boss.name].bestDps[p.player] = p.dps;
          }
        });
      });
    });

    const avg    = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const maxDps = arr => arr.length ? Math.max(...arr) : 0;

    /* ── Classements ─────────────────────────────────────────── */
    const dpsRank = data.players
      .filter(p => ROLES[p]?.role === 'dps')
      .map(p => ({ player: p, avg: avg(totals[p].dps), best: maxDps(totals[p].dps), deaths: totals[p].deaths, kills: totals[p].kills }))
      .sort((a, b) => b.avg - a.avg);

    const healRank = data.players
      .filter(p => ROLES[p]?.role === 'heal')
      .map(p => ({ player: p, avg: avg(totals[p].hps), best: maxDps(totals[p].hps), deaths: totals[p].deaths, kills: totals[p].kills }));

    const deathRank = [...data.players]
      .map(p => ({ player: p, deaths: totals[p].deaths }))
      .sort((a, b) => b.deaths - a.deaths);

    const maxDpsVal = Math.max(...dpsRank.map(d => d.avg), 1);
    const maxHpsVal = Math.max(...healRank.map(d => d.avg), 1);

    /* ── Rendu HTML ──────────────────────────────────────────── */
    root.innerHTML = `

      <!-- KPIs globaux -->
      <div class="stats-kpis">
        <div class="stats-kpi">
          <span class="kpi-value">${totalSessions}</span>
          <span class="kpi-label">Sessions</span>
        </div>
        <div class="stats-kpi">
          <span class="kpi-value">${totalKills}</span>
          <span class="kpi-label">Boss tués</span>
        </div>
        <div class="stats-kpi">
          <span class="kpi-value">${totalWipes}</span>
          <span class="kpi-label">Wipes</span>
        </div>
        <div class="stats-kpi">
          <span class="kpi-value">${totalWipes > 0 ? (totalKills / (totalKills + totalWipes) * 100).toFixed(0) + '%' : '—'}</span>
          <span class="kpi-label">Taux de réussite</span>
        </div>
      </div>

      <!-- Podium DPS -->
      <div class="stats-section">
        <h3 class="stats-section-title">DPS Ranking</h3>
        <div class="stats-podium">
          ${buildPodium(dpsRank, 'dps')}
        </div>
        <div class="stats-bars">
          ${dpsRank.map(d => buildBar(d, maxDpsVal, 'dps')).join('')}
        </div>
      </div>

      <!-- Heals -->
      ${healRank.length ? `
      <div class="stats-section">
        <h3 class="stats-section-title">Heal Ranking</h3>
        <div class="stats-bars">
          ${healRank.map(d => buildBar(d, maxHpsVal, 'hps')).join('')}
        </div>
      </div>` : ''}

      <!-- Hall of Shame : morts -->
      <div class="stats-section">
        <h3 class="stats-section-title">Hall of Shame — Morts</h3>
        <div class="stats-deaths">
          ${deathRank.map((d, i) => `
            <div class="death-row${i === 0 ? ' death-leader' : ''}">
              <span class="death-rank">${['💀','☠️','🪦','😤','😎'][i] || (i+1)}</span>
              <span class="death-name ${ROLES[d.player]?.class || ''}">${d.player}</span>
              <div class="death-bar-wrap">
                <div class="death-bar" style="width:${deathRank[0].deaths ? (d.deaths / deathRank[0].deaths * 100) : 0}%"></div>
              </div>
              <span class="death-count">${d.deaths} mort${d.deaths !== 1 ? 's' : ''}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- Meilleurs parses par boss -->
      <div class="stats-section">
        <h3 class="stats-section-title">Meilleurs parses par boss</h3>
        <table class="stats-table">
          <thead><tr><th>Boss</th><th>Kills</th><th>Wipes</th>${dpsRank.map(d => `<th>${d.player}</th>`).join('')}</tr></thead>
          <tbody>
            ${Object.entries(bossStats).map(([name, bs]) => `
              <tr>
                <td class="boss-cell">${name}</td>
                <td class="kills-cell">${bs.kills > 0 ? '✅ '.repeat(bs.kills) : '—'}</td>
                <td class="wipes-cell">${bs.wipes || 0}</td>
                ${dpsRank.map(d => `<td class="parse-cell">${bs.bestDps[d.player] ? formatNum(bs.bestDps[d.player]) : '—'}</td>`).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <!-- Wipe Analyzer -->
      <div class="stats-section">
        <h3 class="stats-section-title">🔥 Wipe Analyzer</h3>
        ${buildWipeAnalyzer(bossStats)}
      </div>

      <!-- Stats fun -->
      <div class="stats-section">
        <h3 class="stats-section-title">🎭 Stats fun</h3>
        ${buildFunStats(data, bossStats, deathRank)}
      </div>

      <!-- Kill Timeline -->
      <div class="stats-section">
        <h3 class="stats-section-title">📅 Timeline des kills</h3>
        ${buildKillTimeline(data)}
      </div>

      <!-- Historique sessions -->
      <div class="stats-section">
        <h3 class="stats-section-title">Historique des sessions</h3>
        <div class="stats-sessions">
          ${data.sessions.map(s => buildSession(s)).join('')}
        </div>
      </div>
    `;
  }

  function buildPodium(rank, key) {
    if (rank.length === 0) return '<p class="no-data">Aucune donnée</p>';
    const order = [1, 0, 2]; // silver, gold, bronze
    const medals = ['🥇', '🥈', '🥉'];
    const heights = ['120px', '150px', '90px'];
    return `<div class="podium-wrap">
      ${order.map(i => {
        const d = rank[i];
        if (!d) return '';
        return `<div class="podium-slot podium-${i+1}" style="height:${heights[order.indexOf(i)]}">
          <div class="podium-medal">${medals[i]}</div>
          <div class="podium-name ${ROLES[d.player]?.class || ''}">${d.player}</div>
          <div class="podium-val">${formatNum(d.avg)} DPS</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function buildBar(d, max, key) {
    const val  = key === 'dps' ? d.avg : d.avg;
    const best = key === 'dps' ? d.best : d.best;
    const pct  = max ? (val / max * 100).toFixed(1) : 0;
    const cls  = ROLES[d.player]?.class || '';
    return `<div class="stat-bar-row">
      <span class="stat-bar-name ${cls}">${d.player}</span>
      <div class="stat-bar-track">
        <div class="stat-bar-fill ${cls}-bar" style="width:${pct}%"></div>
        <span class="stat-bar-label">${formatNum(val)} moy · ${formatNum(best)} best</span>
      </div>
    </div>`;
  }

  function buildSession(s) {
    const kills = s.bosses.filter(b => b.killed).length;
    const wipes = s.bosses.reduce((a, b) => a + (b.wipes || 0), 0);
    return `<div class="session-card">
      <div class="session-header">
        <span class="session-date">${s.date}</span>
        <span class="session-raid">${s.raid}</span>
        <span class="session-score">${kills} kills · ${wipes} wipes</span>
      </div>
      <div class="session-bosses">
        ${s.bosses.map(b => `
          <div class="session-boss ${b.killed ? 'killed' : 'wiped'}">
            <span class="sb-icon">${b.killed ? '✅' : '❌'}</span>
            <span class="sb-name">${b.name}</span>
            ${b.wipes ? `<span class="sb-wipes">${b.wipes} wipe${b.wipes > 1 ? 's' : ''}</span>` : ''}
          </div>`).join('')}
      </div>
    </div>`;
  }

  /* ── Wipe Analyzer ───────────────────────────────────────── */
  function buildWipeAnalyzer(bossStats) {
    const sorted = Object.entries(bossStats)
      .map(([name, bs]) => ({ name, wipes: bs.wipes || 0 }))
      .filter(b => b.wipes > 0)
      .sort((a, b) => b.wipes - a.wipes);

    if (!sorted.length) return '<p class="no-data">Aucun wipe — vous êtes des dieux 🎉</p>';

    const max = sorted[0].wipes;
    return `<div class="wipe-bars">
      ${sorted.map(b => {
        const pct = Math.round(b.wipes / max * 100);
        const cls = b.wipes >= 15 ? 'wipe-red' : b.wipes >= 7 ? 'wipe-orange' : 'wipe-green';
        return `<div class="wipe-row">
          <span class="wipe-name">${b.name}</span>
          <div class="wipe-track"><div class="wipe-fill ${cls}" style="width:${pct}%"></div></div>
          <span class="wipe-count">${b.wipes} wipe${b.wipes>1?'s':''}</span>
        </div>`;
      }).join('')}
    </div>`;
  }

  /* ── Stats fun ───────────────────────────────────────────── */
  function buildFunStats(data, bossStats, deathRank) {
    // Fastest kill (minutes:secondes → secondes)
    let fastest = null;
    data.sessions.forEach(s => {
      s.bosses.forEach(b => {
        if (!b.killed || !b.duration) return;
        const parts = b.duration.split(':');
        const secs = (+parts[0]) * 60 + (+parts[1] || 0);
        if (!fastest || secs < fastest.secs)
          fastest = { boss: b.name, dur: b.duration, raid: s.raid, secs };
      });
    });

    // Most wiped boss
    const mostWiped = Object.entries(bossStats)
      .map(([n, bs]) => ({ name: n, wipes: bs.wipes || 0 }))
      .sort((a, b) => b.wipes - a.wipes)[0];

    // First kill date
    let firstKill = null;
    data.sessions.forEach(s => {
      s.bosses.forEach(b => {
        if (!b.killed) return;
        if (!firstKill || s.date < firstKill.date)
          firstKill = { boss: b.name, date: s.date, raid: s.raid };
      });
    });

    const top = deathRank[0];
    const cards = [
      fastest ? `<div class="fun-card">
        <span class="fun-ico">⚡</span>
        <div class="fun-body">
          <div class="fun-title">Kill le plus rapide</div>
          <div class="fun-val">${fastest.boss}</div>
          <div class="fun-sub">${fastest.dur} · ${fastest.raid}</div>
        </div></div>` : '',
      mostWiped?.wipes > 0 ? `<div class="fun-card">
        <span class="fun-ico">😤</span>
        <div class="fun-body">
          <div class="fun-title">Boss le plus récalcitrant</div>
          <div class="fun-val">${mostWiped.name}</div>
          <div class="fun-sub">${mostWiped.wipes} wipe${mostWiped.wipes>1?'s':''}</div>
        </div></div>` : '',
      top?.deaths > 0 ? `<div class="fun-card">
        <span class="fun-ico">💀</span>
        <div class="fun-body">
          <div class="fun-title">Joueur le plus mort</div>
          <div class="fun-val ${ROLES[top.player]?.class||''}">${top.player}</div>
          <div class="fun-sub">${top.deaths} mort${top.deaths>1?'s':''} au compteur</div>
        </div></div>` : '',
      firstKill ? `<div class="fun-card">
        <span class="fun-ico">🎉</span>
        <div class="fun-body">
          <div class="fun-title">Premier kill</div>
          <div class="fun-val">${firstKill.boss}</div>
          <div class="fun-sub">${firstKill.date} · ${firstKill.raid}</div>
        </div></div>` : '',
    ].filter(Boolean);

    return cards.length
      ? `<div class="fun-grid">${cards.join('')}</div>`
      : '<p class="no-data">Pas encore de données.</p>';
  }

  /* ── Kill Timeline ───────────────────────────────────────── */
  function buildKillTimeline(data) {
    const kills = [];
    data.sessions.forEach(s => {
      s.bosses.forEach(b => {
        if (b.killed) kills.push({ boss:b.name, raid:s.raid, date:s.date, dur:b.duration, wipes:b.wipes||0 });
      });
    });
    kills.sort((a, b) => b.date.localeCompare(a.date));

    if (!kills.length) return '<p class="no-data">Aucun kill enregistré pour l\'instant.</p>';

    return `<div class="kill-tl">
      ${kills.map(k => `
        <div class="kl-item">
          <div class="kl-date">${k.date}</div>
          <div class="kl-line"><div class="kl-dot"></div></div>
          <div class="kl-content">
            <span class="kl-boss">${k.boss}</span>
            <span class="kl-raid">${k.raid}</span>
            ${k.dur ? `<span class="kl-tag">⏱ ${k.dur}</span>` : ''}
            ${k.wipes > 0 ? `<span class="kl-tag kl-wipes">💀 ${k.wipes}w</span>` : ''}
          </div>
        </div>`).join('')}
    </div>`;
  }

  function formatNum(n) {
    if (!n) return '0';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  window.initRaidStats = init;

  document.addEventListener('DOMContentLoaded', init);

})();
