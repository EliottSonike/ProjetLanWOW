'use strict';

const RotationVisual = (function () {

  const ICON = name =>
    `https://wowgaming.altervista.org/aowow/static/images/wow/icons/large/${name}.jpg`;

  /* ================================================================
     DONNÉES DE ROTATION PAR SPEC
  ================================================================ */
  const ROTATIONS = {

    /* ── Mage Feu ─────────────────────────────────────────────── */
    'mage-fire': {
      label: 'Mage Feu — Rotation',
      color: '#f4511e',
      glow:  'rgba(244,81,30,0.4)',
      phases: [
        {
          name: 'Ouverture',
          steps: [
            { icon: ICON('ability_mage_livingbomb'),   name: 'Living Bomb',    priority: 1, proc: false, note: 'Appliquer en premier · maintenir en permanence' },
            { icon: ICON('spell_fire_soulburn'),        name: 'Combustion',     priority: 2, proc: false, note: 'CD offensif · activer dès le début du combat' },
            { icon: ICON('spell_fire_firebolt02'),      name: 'Fireball',       priority: 3, proc: false, note: 'Sort principal · spam en boucle' },
          ]
        },
        {
          name: 'Combat',
          steps: [
            { icon: ICON('ability_mage_livingbomb'),   name: 'Living Bomb',    priority: 1, proc: false, note: 'Réappliquer si expiré' },
            { icon: ICON('ability_mage_hotstreak'),     name: 'Pyroblast!',     priority: 2, proc: true,  note: '🔥 PROC Hot Streak → cast instantané · PRIORITÉ ABSOLUE' },
            { icon: ICON('spell_fire_firebolt02'),      name: 'Fireball',       priority: 3, proc: false, note: 'Filler principal' },
            { icon: ICON('spell_fire_flamebolt'),       name: 'Fire Blast',     priority: 4, proc: false, note: 'Instant · pour déclencher Hot Streak' },
            { icon: ICON('spell_fire_sear'),            name: 'Scorch',         priority: 5, proc: false, note: 'En déplacement seulement · maintenir le debuff' },
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
            { icon: ICON('spell_shadow_curseofachimonde'),         name: 'Curse of Elements', priority: 1, proc: false, note: 'Debuff raid · 1 seul warlock l\'applique' },
            { icon: ICON('spell_shadow_abominationexplosion'),     name: 'Corruption',        priority: 2, proc: false, note: 'Auto-refresh via Shadow Bolt (Everlasting Affliction)' },
            { icon: ICON('ability_warlock_haunt'),                  name: 'Haunt',             priority: 3, proc: false, note: '+20% dégâts sur vos DoTs · maintenir en permanence' },
            { icon: ICON('spell_shadow_unstableaffliction_3'),     name: 'Unstable Affliction', priority: 4, proc: false, note: 'DoT puissant · durée 15s' },
            { icon: ICON('spell_shadow_shadowbolt'),               name: 'Shadow Bolt',       priority: 5, proc: false, note: 'Filler · refresh Corruption automatiquement' },
          ]
        },
        {
          name: 'Priorités continues',
          steps: [
            { icon: ICON('ability_warlock_haunt'),                  name: 'Haunt',             priority: 1, proc: false, note: '⚡ GCD le plus prioritaire · réappliquer dès expiration' },
            { icon: ICON('spell_shadow_unstableaffliction_3'),     name: 'Unstable Affliction', priority: 2, proc: false, note: 'Réappliquer avant expiration' },
            { icon: ICON('spell_shadow_burningspirit'),            name: 'Life Tap',           priority: 3, proc: true,  note: '💜 BUFF 20% SP pendant 40s · maintenir en permanence' },
            { icon: ICON('spell_shadow_shadowbolt'),               name: 'Shadow Bolt',       priority: 4, proc: false, note: 'Filler · refresh Corruption' },
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
            { icon: ICON('spell_holy_blessingofprotection'),     name: 'Holy Shield',             priority: 3, proc: false, note: '9s CD · +30% chance de bloquer · maintenir actif' },
            { icon: ICON('ability_paladin_hammeroftherighteous'),'name': 'Hammer of the Righteous', priority: 4, proc: false, note: '6s CD · AoE 3 cibles · essentiel sur packs' },
            { icon: ICON('spell_holy_innerfire'),                name: 'Consecration',            priority: 5, proc: false, note: '9s CD · AoE sol · menace passive' },
            { icon: ICON('spell_holy_avengersshield'),           name: "Avenger's Shield",        priority: 6, proc: false, note: '15s CD · hors 969 · caser entre les GCDs' },
          ]
        },
        {
          name: 'CDs défensifs',
          steps: [
            { icon: ICON('spell_holy_greaterblessingofsalvation'), name: 'Divine Protection', priority: 1, proc: false, note: '-50% tous dégâts 10s · CD 1 min · pics de dégâts' },
            { icon: ICON('spell_holy_sealofblood'),               name: 'Divine Guardian',   priority: 2, proc: false, note: '-30% dégâts raid 6s · communiquer avec le heal' },
            { icon: ICON('ability_paladin_layonhands'),           name: 'Lay on Hands',      priority: 3, proc: false, note: 'Soin total · CD 20 min · urgences seulement' },
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
            { icon: ICON('spell_holy_powerwordshield'),             name: 'Sacred Shield',       priority: 2, proc: false, note: 'Sur la cible la plus à risque · proc FoL réduit' },
            { icon: ICON('ability_paladin_judgementsofthejust'),   name: 'Judgment of Light',   priority: 3, proc: false, note: '+15% haste via Judgements of the Pure · rafraîchir toutes ~50s' },
          ]
        },
        {
          name: 'Soin en combat',
          steps: [
            { icon: ICON('spell_holy_searinglight'),               name: 'Holy Shock',              priority: 1, proc: false, note: 'Sur CD · si crit → FoL instantané disponible' },
            { icon: ICON('spell_holy_flashheal'),                  name: 'Flash of Light (instant)', priority: 2, proc: true,  note: '✨ PROC Infusion of Light → cast instantané · ne pas rater' },
            { icon: ICON('spell_holy_flashheal'),                  name: 'Flash of Light',          priority: 3, proc: false, note: 'Sort principal · rapide et économique en mana' },
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
        <div class="rv-steps">
          ${p.steps.map((s, si) => buildStep(s, si, data.color, data.glow)).join('')}
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
      <img class="rv-icon" src="${step.icon}" alt="${step.name}" loading="lazy">
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
