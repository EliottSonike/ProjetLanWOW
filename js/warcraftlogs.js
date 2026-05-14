'use strict';

const WarcraftLogs = (function () {

  const BASE = 'https://www.warcraftlogs.com/v1';

  function cfg() { return window.WCL_CONFIG || {}; }

  function url(path, extra) {
    const params = new URLSearchParams({ api_key: cfg().apiKey, ...(extra || {}) });
    return `${BASE}${path}?${params}`;
  }

  /* ── Fetch avec gestion d'erreur ─────────────────────────────── */
  async function apiFetch(path, extra) {
    const r = await fetch(url(path, extra));
    if (!r.ok) throw new Error(`WCL ${r.status}`);
    return r.json();
  }

  /* ── Rendu de l'état "non configuré" ─────────────────────────── */
  function renderSetup(root) {
    root.innerHTML = `
      <div class="wcl-setup">
        <div class="wcl-setup-icon">📋</div>
        <h3>Configuration WarcraftLogs requise</h3>
        <ol class="wcl-steps">
          <li>Active <strong>Advanced Combat Logging</strong> dans WoW → Options → Réseau</li>
          <li>Tape <code>/combatlog</code> en jeu avant le raid pour démarrer l'enregistrement</li>
          <li>Après le raid, upload le fichier <code>WoWCombatLog.txt</code> via
            <a href="https://www.warcraftlogs.com/client/download" target="_blank" rel="noopener">WarcraftLogs Uploader</a>
          </li>
          <li>Crée un compte sur <a href="https://www.warcraftlogs.com" target="_blank" rel="noopener">warcraftlogs.com</a></li>
          <li>Va dans ton profil → <strong>API Key</strong> et copie ta clé</li>
          <li>Colle-la dans <code>data/warcraftlogs-config.js</code></li>
        </ol>
        <a href="https://www.warcraftlogs.com/client/download" target="_blank" rel="noopener" class="wcl-btn">
          Télécharger WarcraftLogs Uploader →
        </a>
      </div>`;
  }

  /* ── Rendu loading ───────────────────────────────────────────── */
  function renderLoading(root) {
    root.innerHTML = `<div class="wcl-loading"><div class="wcl-spinner"></div><p>Chargement depuis WarcraftLogs…</p></div>`;
  }

  /* ── Rendu erreur ────────────────────────────────────────────── */
  function renderError(root, msg) {
    root.innerHTML = `
      <div class="wcl-error">
        <p>⚠️ Impossible de contacter WarcraftLogs.</p>
        <p><small>${msg}</small></p>
        <p>Vérifie ta clé API et que des logs ont été uploadés.</p>
      </div>`;
  }

  /* ── Couleur de parse (comme WarcraftLogs) ───────────────────── */
  function parseColor(pct) {
    if (pct >= 99) return '#e5cc80'; // Légendaire
    if (pct >= 95) return '#ff8000'; // Épique
    if (pct >= 75) return '#a335ee'; // Violet
    if (pct >= 50) return '#0070dd'; // Bleu
    if (pct >= 25) return '#1eff00'; // Vert
    return '#9d9d9d';                // Gris
  }

  function parseName(pct) {
    if (pct >= 99) return 'Légendaire';
    if (pct >= 95) return 'Épique';
    if (pct >= 75) return 'Rare';
    if (pct >= 50) return 'Peu commun';
    if (pct >= 25) return 'Commun';
    return 'Médiocre';
  }

  /* ── Rendu d'un rapport ──────────────────────────────────────── */
  function renderReport(report) {
    const date = new Date(report.start).toLocaleDateString('fr-FR');
    const dur  = Math.round((report.end - report.start) / 60000);
    return `
      <a class="wcl-report" href="https://www.warcraftlogs.com/reports/${report.id}" target="_blank" rel="noopener">
        <span class="wcl-report-title">${report.title || report.zone?.name || 'Raid'}</span>
        <span class="wcl-report-date">${date}</span>
        <span class="wcl-report-dur">${dur} min</span>
        <span class="wcl-report-arrow">→</span>
      </a>`;
  }

  /* ── Rendu d'un parse de personnage ─────────────────────────── */
  function renderParse(p) {
    const color = parseColor(p.percentile);
    return `
      <div class="wcl-parse-row">
        <span class="wcl-parse-boss">${p.encounterName}</span>
        <span class="wcl-parse-spec">${p.spec}</span>
        <span class="wcl-parse-dps">${Math.round(p.total).toLocaleString()}</span>
        <div class="wcl-parse-bar-wrap">
          <div class="wcl-parse-bar" style="width:${p.percentile}%;background:${color}"></div>
          <span class="wcl-parse-pct" style="color:${color}">${p.percentile}%</span>
        </div>
        <span class="wcl-parse-rank" style="color:${color}">${parseName(p.percentile)}</span>
      </div>`;
  }

  /* ── Rendu principal ─────────────────────────────────────────── */
  async function load(root) {
    const config = cfg();

    if (!config.apiKey || !config.username) {
      renderSetup(root);
      return;
    }

    renderLoading(root);

    try {
      /* Récupère les rapports de l'utilisateur */
      const reports = await apiFetch(`/reports/user/${config.username}`);

      /* Récupère les parses pour chaque personnage */
      const parsesData = await Promise.allSettled(
        config.characters.map(char =>
          apiFetch(`/parses/character/${encodeURIComponent(char)}/${encodeURIComponent(config.serverName)}/${config.serverRegion}`)
            .then(data => ({ char, data }))
        )
      );

      root.innerHTML = `

        <!-- Résumé -->
        <div class="wcl-summary">
          <div class="wcl-sum-item">
            <span class="wcl-sum-val">${reports.length}</span>
            <span class="wcl-sum-label">Rapports uploadés</span>
          </div>
          <a href="https://www.warcraftlogs.com/guild/reports-list/${encodeURIComponent(config.serverName)}/${config.serverRegion}" target="_blank" rel="noopener" class="wcl-btn wcl-btn-sm">
            Voir sur WarcraftLogs →
          </a>
        </div>

        <!-- Derniers rapports -->
        <div class="wcl-section">
          <h4 class="wcl-section-title">Derniers rapports</h4>
          <div class="wcl-reports">
            ${reports.slice(0, 8).map(renderReport).join('') || '<p class="wcl-none">Aucun rapport trouvé.</p>'}
          </div>
        </div>

        <!-- Parses par personnage -->
        <div class="wcl-section">
          <h4 class="wcl-section-title">Meilleurs parses par personnage</h4>
          <div class="wcl-char-tabs">
            ${config.characters.map((c, i) =>
              `<button class="wcl-char-btn${i === 0 ? ' active' : ''}" data-char="${i}">${c}</button>`
            ).join('')}
          </div>
          ${parsesData.map((result, i) => {
            if (result.status === 'rejected' || !result.value?.data?.length) {
              return `<div class="wcl-parses${i === 0 ? '' : ' wcl-hidden'}" data-char="${i}">
                <p class="wcl-none">Aucun parse disponible pour ${config.characters[i]}.<br>
                <small>Le personnage doit être présent dans un log uploadé.</small></p>
              </div>`;
            }
            const parses = result.value.data
              .sort((a, b) => b.percentile - a.percentile)
              .slice(0, 15);
            return `<div class="wcl-parses${i === 0 ? '' : ' wcl-hidden'}" data-char="${i}">
              <div class="wcl-parse-header">
                <span>Boss</span><span>Spec</span><span>DPS/HPS</span>
                <span>Percentile</span><span>Qualité</span>
              </div>
              ${parses.map(renderParse).join('')}
            </div>`;
          }).join('')}
        </div>
      `;

      /* Onglets personnages */
      root.addEventListener('click', e => {
        const btn = e.target.closest('.wcl-char-btn');
        if (!btn) return;
        const idx = btn.dataset.char;
        root.querySelectorAll('.wcl-char-btn').forEach(b => b.classList.toggle('active', b.dataset.char === idx));
        root.querySelectorAll('.wcl-parses').forEach(p => p.classList.toggle('wcl-hidden', p.dataset.char !== idx));
      });

    } catch (err) {
      renderError(root, err.message);
    }
  }

  /* ── Init ────────────────────────────────────────────────────── */
  function init() {
    const root = document.getElementById('wcl-section');
    if (!root) return;
    load(root);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', WarcraftLogs.init);
