'use strict';

const RotationVisual = (function () {

  const ICON = name =>
    `https://wow.zamimg.com/images/wow/icons/large/${name}.jpg`;

  /* ================================================================
     DONNÉES DE ROTATION PAR SPEC
  ================================================================ */
  const ROTATIONS = {

    /* ── Mage Frostfire Bolt ──────────────────────────────────── */
    'mage-fire': {
      label: 'Mage Frostfire — Rotation',
      color: '#5ec8f0',
      glow:  'rgba(94,200,240,0.4)',
      phases: [
        {
          name: 'Ouverture',
          steps: [
            { icon: ICON('ability_mage_livingbomb'),        name: 'Living Bomb',      priority: 1, proc: false, note: 'Appliquer en premier · maintenir en permanence' },
            { icon: ICON('spell_frost_icyveins'),           name: 'Icy Veins',        priority: 2, proc: false, note: '+20% haste 20s · activer sur pull · reset avec Cold Snap' },
            { icon: ICON('spell_fire_soulburn'),            name: 'Combustion',        priority: 3, proc: false, note: 'CD offensif · chaque crit = +10% crit Feu' },
            { icon: ICON('spell_frost_frostfirebolt02'),   name: 'Frostfire Bolt',   priority: 4, proc: false, note: 'Sort principal (Feu + Givre) · spam en boucle' },
          ]
        },
        {
          name: 'Combat',
          steps: [
            { icon: ICON('ability_mage_livingbomb'),        name: 'Living Bomb',      priority: 1, proc: false, note: 'Réappliquer si expiré · priorité absolue' },
            { icon: ICON('ability_mage_hotstreak'),         name: 'Pyroblast!',       priority: 2, proc: true,  note: '🔥 PROC Hot Streak → cast instantané · ne jamais retarder' },
            { icon: ICON('spell_frost_frostfirebolt02'),   name: 'Frostfire Bolt',   priority: 3, proc: false, note: 'Filler principal · bénéficie d\'Ice Shards + Ignite' },
            { icon: ICON('spell_fire_flamebolt'),           name: 'Fire Blast',       priority: 4, proc: false, note: 'Instant · enchaîner les crits pour Hot Streak' },
            { icon: ICON('spell_fire_sear'),                name: 'Scorch',           priority: 5, proc: false, note: 'En déplacement seulement · FFB ne se cast pas en mouvement' },
          ]
        }
      ]
    },

    /* ── Warlock Affliction ───────────────────────────────────── */
    'warlock-affliction': {
      label: 'Démoniste Affliction — Rotation',
      color: '#9c27b0',
      glow:  'rgba(156,39,176,0.4)',
      phases: [
        {
          name: 'Ouverture',
          steps: [
            { icon: ICON('spell_shadow_lifetap'),                  name: 'Life Tap',          priority: 1, proc: true,  note: '💜 Pre-pull · active le buff Glyph of Life Tap (+20% Esprit en SP 40s)' },
            { icon: ICON('spell_shadow_abominationexplosion'),     name: 'Corruption',        priority: 2, proc: false, note: 'DoT principal · jamais réappliquer manuellement (Everlasting Affliction)' },
            { icon: ICON('ability_warlock_haunt'),                 name: 'Haunt',             priority: 3, proc: false, note: '+20% dégâts sur tous vos DoTs · activer dès Corruption posé' },
            { icon: ICON('spell_shadow_unstableaffliction_3'),    name: 'Unstable Affliction', priority: 4, proc: false, note: 'DoT puissant 15s · maintenir en permanence' },
            { icon: ICON('spell_shadow_curse'),                    name: 'Curse of Agony',    priority: 5, proc: false, note: 'Malédiction principale · ou Curse of Elements si absent du raid' },
            { icon: ICON('spell_shadow_shadowbolt'),              name: 'Shadow Bolt',       priority: 6, proc: false, note: 'Filler spam · refresh Corruption via Everlasting Affliction' },
          ]
        },
        {
          name: 'Priorités combat',
          steps: [
            { icon: ICON('ability_warlock_haunt'),                 name: 'Haunt',             priority: 1, proc: false, note: '⚡ Sur cooldown (15s) · priorité absolue · +20% DoTs' },
            { icon: ICON('spell_shadow_unstableaffliction_3'),    name: 'Unstable Affliction', priority: 2, proc: false, note: 'Réappliquer avant expiration · ne jamais laisser tomber' },
            { icon: ICON('spell_shadow_curse'),                    name: 'Curse of Agony',    priority: 3, proc: false, note: 'Réappliquer avant expiration · ne jamais laisser tomber' },
            { icon: ICON('spell_shadow_lifetap'),                  name: 'Life Tap',          priority: 4, proc: true,  note: '💜 BUFF Glyph of Life Tap · maintenir en permanence (expire 40s)' },
            { icon: ICON('spell_shadow_shadowbolt'),              name: 'Shadow Bolt',       priority: 5, proc: false, note: 'Filler · refresh Corruption · spam entre les DoTs' },
          ]
        }
      ]
    },

    /* ── Paladin Protection ───────────────────────────────────── */
    'paladin-protection': {
      label: 'Paladin Protection — Système 969',
      color: '#f48fb1',
      glow:  'rgba(244,143,177,0.4)',
      phases: [
        {
          name: 'Rotation 969',
          steps: [
            { icon: ICON('ability_paladin_judgementsofthejust'), name: 'Judgment',               priority: 1, proc: false, note: '9s CD · génère menace · applique debuff' },
            { icon: ICON('ability_paladin_shieldofvengeance'),   name: 'Shield of Righteousness', priority: 2, proc: false, note: '6s CD · dégâts Block Value · menace élevée' },
            { icon: ICON('ability_paladin_holyshield'),          name: 'Holy Shield',             priority: 3, proc: false, note: '9s CD · +30% chance de bloquer · maintenir actif' },
            { icon: ICON('ability_paladin_hammeroftherighteous'),'name': 'Hammer of the Righteous', priority: 4, proc: false, note: '6s CD · AoE 3 cibles · essentiel sur packs' },
            { icon: ICON('spell_holy_consecration'),             name: 'Consecration',            priority: 5, proc: false, note: '9s CD · AoE sol · menace passive' },
            { icon: ICON('spell_holy_avengersshield'),           name: "Avenger's Shield",        priority: 6, proc: false, note: '15s CD · hors 969 · caser entre les GCDs' },
          ]
        },
        {
          name: 'CDs défensifs',
          steps: [
            { icon: ICON('spell_holy_divineprotection'),           name: 'Divine Protection', priority: 1, proc: false, note: '-50% tous dégâts 10s · CD 1 min · pics de dégâts' },
            { icon: ICON('ability_paladin_divineguardian'),       name: 'Divine Guardian',   priority: 2, proc: false, note: '-30% dégâts raid 6s · communiquer avec le heal' },
            { icon: ICON('ability_paladin_layonhands'),           name: 'Lay on Hands',      priority: 3, proc: false, note: 'Soin total · CD 20 min · urgences seulement' },
          ]
        }
      ]
    },

    /* ── Chasseur Précision ──────────────────────────────────── */
    'hunter-marksmanship': {
      label: 'Chasseur Précision — Rotation',
      color: '#8bc34a',
      glow:  'rgba(139,195,74,0.4)',
      phases: [
        {
          name: 'Ouverture',
          steps: [
            { icon: ICON('ability_hunter_markofthehunter'),  name: "Hunter's Mark",    priority: 1, proc: false, note: 'Avant le pull · +110 PA à distance pour tout le groupe' },
            { icon: ICON('ability_hunter_serpentsting'),     name: 'Venin du Serpent', priority: 2, proc: false, note: 'DoT principal · refreshé automatiquement par Chimera Shot' },
            { icon: ICON('ability_hunter_rapidfire'),        name: 'Rapid Fire',       priority: 3, proc: false, note: '+40% vitesse d\'attaque 20s · activer sur pull avec trinkets' },
            { icon: ICON('ability_hunter_chimerashot2'),     name: 'Chimera Shot',     priority: 4, proc: false, note: 'Sort signature · CD 9s · refresh Venin du Serpent' },
            { icon: ICON('ability_hunter_aimedshot'),        name: 'Aimed Shot',       priority: 5, proc: false, note: '-50% soins reçus par la cible · immédiatement après Chimera' },
          ]
        },
        {
          name: 'Priorités combat',
          steps: [
            { icon: ICON('ability_hunter_assassinate2'),     name: 'Kill Shot',        priority: 1, proc: true,  note: '💀 Cible < 20% HP · PRIORITÉ ABSOLUE · reset CD si cible survit' },
            { icon: ICON('ability_hunter_chimerashot2'),     name: 'Chimera Shot',     priority: 2, proc: false, note: 'Sur cooldown (9s) · refresh Venin du Serpent automatiquement' },
            { icon: ICON('ability_hunter_aimedshot'),        name: 'Aimed Shot',       priority: 3, proc: true,  note: '⚡ Si buff Improved Steady Shot actif → +20% dégâts · ne pas rater' },
            { icon: ICON('ability_impalingbolt'),            name: 'Arcane Shot',      priority: 4, proc: false, note: 'Filler instant si Chimera/Aimed en CD' },
            { icon: ICON('ability_hunter_steadyshot'),       name: 'Steady Shot × 2', priority: 5, proc: false, note: '2 consécutifs → proc Improved Steady Shot (+20% prochain special)' },
          ]
        }
      ]
    },

    /* ── Paladin Holy ─────────────────────────────────────────── */
    'paladin-holy': {
      label: 'Paladin Holy — Priorités de soin',
      color: '#ffd54f',
      glow:  'rgba(255,213,79,0.4)',
      phases: [
        {
          name: 'Setup',
          steps: [
            { icon: ICON('ability_paladin_beaconoflight'),          name: 'Beacon of Light',     priority: 1, proc: false, note: 'Sur le tank · soins transmis automatiquement' },
            { icon: ICON('ability_paladin_sacredshield'),           name: 'Sacred Shield',       priority: 2, proc: false, note: 'Sur la cible la plus à risque · proc FoL réduit' },
            { icon: ICON('ability_paladin_judgementsofthejust'),   name: 'Judgment of Light',   priority: 3, proc: false, note: '+15% haste via Judgements of the Pure · rafraîchir toutes ~50s' },
          ]
        },
        {
          name: 'Soin en combat',
          steps: [
            { icon: ICON('spell_holy_searinglight'),               name: 'Holy Shock',              priority: 1, proc: false, note: 'Sur CD · si crit → FoL instantané disponible' },
            { icon: ICON('spell_holy_flashoflight'),               name: 'Flash of Light (instant)', priority: 2, proc: true,  note: '✨ PROC Infusion of Light → cast instantané · ne pas rater' },
            { icon: ICON('spell_holy_flashoflight'),               name: 'Flash of Light',          priority: 3, proc: false, note: 'Sort principal · rapide et économique en mana' },
            { icon: ICON('spell_holy_holybolt'),                   name: 'Holy Light',              priority: 4, proc: false, note: 'Soin massif · coûteux · réserver aux urgences' },
          ]
        }
      ]
    },

  };

  /* ================================================================
     DÉTECTION DE SPEC
  ================================================================ */
  function detectSpec() {
    const cls = document.body.dataset.class || '';
    const url = location.pathname.toLowerCase();

    if (cls === 'mage')    return 'mage-fire';
    if (cls === 'warlock') return 'warlock-affliction';
    if (cls === 'hunter')  return 'hunter-marksmanship';

    if (cls === 'paladin') {
      // Distinguer prot vs holy via le titre de la page
      const title = document.title.toLowerCase();
      if (title.includes('protection') || title.includes('prot')) return 'paladin-protection';
      if (title.includes('holy'))                                  return 'paladin-holy';
      // Fallback : url ou h1
      const h1 = (document.querySelector('h1') || {}).textContent || '';
      if (h1.toLowerCase().includes('protection')) return 'paladin-protection';
      return 'paladin-holy';
    }

    return null;
  }

  /* ================================================================
     RENDU
  ================================================================ */
  function render(spec) {
    const data = ROTATIONS[spec];
    if (!data) return null;

    const phaseButtons = data.phases.map((p, i) =>
      `<button class="rv-phase-btn${i === 0 ? ' active' : ''}" data-phase="${i}">${p.name}</button>`
    ).join('');

    const phaseDivs = data.phases.map((p, i) =>
      `<div class="rv-phase${i === 0 ? '' : ' rv-hidden'}" data-phase="${i}">
        <div class="rv-steps-wrap">
          <div class="rv-steps">
            ${p.steps.map((s, si) => buildStep(s, si, data.color, data.glow)).join('')}
          </div>
        </div>
      </div>`
    ).join('');

    return `
<div class="rotation-visual" style="--rv-color:${data.color};--rv-glow:${data.glow}">
  <div class="rv-tabs">${phaseButtons}</div>
  ${phaseDivs}
</div>`;
  }

  function buildStep(step, idx, color, glow) {
    const procClass = step.proc ? ' rv-proc' : '';
    const delay = idx * 0.15;
    return `
<div class="rv-step${procClass}" style="animation-delay:${delay}s" data-idx="${idx}">
  ${idx > 0 ? '<div class="rv-arrow">→</div>' : ''}
  <div class="rv-spell">
    <div class="rv-icon-wrap">
      <img class="rv-icon" src="${step.icon}" alt="${step.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('rv-icon-missing')">
      <span class="rv-priority">${step.priority}</span>
      ${step.proc ? '<div class="rv-proc-ring"></div>' : ''}
    </div>
    <span class="rv-spell-name">${step.name}</span>
    <div class="rv-tooltip">${step.note}</div>
  </div>
</div>`;
  }

  /* ================================================================
     INIT
  ================================================================ */
  function init() {
    const spec = detectSpec();
    if (!spec) return;

    // Trouve la section rotation et insère avant le premier content-card
    const rotSection = document.getElementById('rotation');
    if (!rotSection) return;

    const html = render(spec);
    if (!html) return;

    const firstCard = rotSection.querySelector('.content-card');
    const wrapper   = document.createElement('div');
    wrapper.className = 'rv-wrapper content-card';
    wrapper.innerHTML = `
      <h3 style="margin-bottom:1rem;font-size:0.9rem;color:var(--gold);text-transform:uppercase;letter-spacing:0.5px">
        Rotation visuelle — survol pour les détails
      </h3>
      ${html}`;

    if (firstCard) {
      rotSection.insertBefore(wrapper, firstCard);
    } else {
      rotSection.appendChild(wrapper);
    }

    // Phase switch
    document.addEventListener('click', e => {
      const btn = e.target.closest('.rv-phase-btn');
      if (!btn) return;
      const vis = btn.closest('.rotation-visual');
      if (!vis) return;
      const idx = btn.dataset.phase;
      vis.querySelectorAll('.rv-phase-btn').forEach(b => b.classList.toggle('active', b.dataset.phase === idx));
      vis.querySelectorAll('.rv-phase').forEach(p => p.classList.toggle('rv-hidden', p.dataset.phase !== idx));
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', RotationVisual.init);
