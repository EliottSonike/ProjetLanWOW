'use strict';

(function () {

  function apiFetch(ep) {
    return window.fetch('/api' + ep).then(r => r.ok ? r.json() : null).catch(() => null);
  }

  function fmt(n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n||0); }

  function allBosses(entry) {
    return entry.bosses || (entry.wings||[]).flatMap(w => w.bosses);
  }

  async function init() {
    const el = document.getElementById('dashboard-root');
    if (!el) return;

    const [prog, stats] = await Promise.all([apiFetch('/progression'), apiFetch('/stats')]);
    if (!prog && !stats) { el.innerHTML = ''; return; }

    /* ── Progression ── */
    let total = 0, killed = 0;
    const lastKills = [];
    if (prog) {
      [...(prog.raids||[]), ...(prog.dungeons||[])].forEach(e => {
        allBosses(e).forEach(b => {
          total++;
          if (b.killed) { killed++; lastKills.push({ boss:b.name, date:b.firstKill||'', raid:e.name }); }
        });
      });
      lastKills.sort((a,b) => b.date.localeCompare(a.date));
    }
    const pct = total ? Math.round(killed/total*100) : 0;

    /* ── Stats globales ── */
    let kills = 0, wipes = 0, sessions = 0;
    let topDps = null, topDpsVal = 0;

    if (stats?.sessions?.length) {
      sessions = stats.sessions.length;
      const totals = {};
      (stats.players||[]).forEach(p => totals[p] = []);
      stats.sessions.forEach(s => s.bosses.forEach(b => {
        if (b.killed) kills++;
        wipes += b.wipes||0;
        (b.performances||[]).forEach(p => {
          if (p.dps > 0 && totals[p.player]) totals[p.player].push(p.dps);
        });
      }));
      (stats.players||[]).forEach(p => {
        const arr = totals[p]||[];
        if (!arr.length) return;
        const avg = Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
        if (avg > topDpsVal) { topDpsVal = avg; topDps = p; }
      });
    }

    el.innerHTML = `
      <div class="db-grid">

        <div class="db-card db-card-prog">
          <div class="db-card-label">📊 Progression globale</div>
          <div class="db-prog-bar"><div class="db-prog-fill" style="width:${pct}%"></div></div>
          <div class="db-prog-text">${killed} / ${total} boss &nbsp;·&nbsp; <strong>${pct}%</strong></div>
        </div>

        <div class="db-card db-card-kpis">
          <div class="db-card-label">⚔️ Statistiques</div>
          <div class="db-kpis">
            <div class="db-kpi"><span class="db-kpi-v">${sessions}</span><span class="db-kpi-l">Sessions</span></div>
            <div class="db-kpi"><span class="db-kpi-v">${kills}</span><span class="db-kpi-l">Boss tués</span></div>
            <div class="db-kpi"><span class="db-kpi-v">${wipes}</span><span class="db-kpi-l">Wipes</span></div>
            <div class="db-kpi"><span class="db-kpi-v">${topDps ? fmt(topDpsVal) : '—'}</span><span class="db-kpi-l">Top DPS</span></div>
          </div>
          ${topDps ? `<div class="db-topdps">🏆 <strong>${topDps}</strong> mène le DPS</div>` : ''}
        </div>

        ${lastKills.length ? `
        <div class="db-card db-card-kills">
          <div class="db-card-label">💀 Derniers kills</div>
          <div class="db-kills">
            ${lastKills.slice(0,4).map(k=>`
              <div class="db-kill">
                <span class="db-kill-boss">${k.boss}</span>
                <span class="db-kill-meta">${k.raid}${k.date ? ' · '+k.date : ''}</span>
              </div>`).join('')}
          </div>
          <a href="progression.html" class="db-link">Voir la progression →</a>
        </div>` : ''}

      </div>`;
  }

  window.initDashboard = init;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
