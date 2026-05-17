'use strict';

/* ================================================================
   BOSS MAPS — 5 joueurs : 1 Tank (Maël), 1 Heal (Tristan),
   3 DPS ranged (Alban Warlock, Eliott Mage, Fabien)
================================================================ */
const BossMaps = (function () {

  const DATA = {

    /* ===== ICC ===== */

    marrowgar: {
      name: 'Lord Marrowgar',
      room: 'circle',
      phases: [
        {
          name: 'Normal',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 38, r: 18, label: 'Cleave frontal — rester sur les côtés' },
            { type: 'boss',  cx: 50, cy: 38, label: 'Lord Marrowgar' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — Tank (dos au mur)' },
            { type: 'range', positions: [{ cx: 32, cy: 62 }, { cx: 50, cy: 68 }, { cx: 68, cy: 62 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 78 }] },
            { type: 'note',  text: '🦴 5-man : Bone Spike → 1 DPS lâche tout pour libérer immédiatement. Coldflame → ne pas marcher dedans. Healeur surveille les Spikes en priorité.' },
          ]
        },
        {
          name: 'Bonestorm',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 50, r: 46, label: 'Toute la salle — dégâts permanents', opacity: 0.18 },
            { type: 'boss', cx: 50, cy: 50, label: 'Marrowgar (tourne)' },
            { type: 'note', text: '🌀 5-man : Courir en cercle avec lui. Bone Spike → DPS stop et libère. Attention : 3 DPS seuls = timer serré, HoT sur tout le monde.' },
          ]
        }
      ]
    },

    deathwhisper: {
      name: 'Lady Deathwhisper',
      room: 'rect',
      phases: [
        {
          name: 'Phase 1 — Adds',
          elements: [
            { type: 'zone-danger', x: 5, y: 5, w: 90, h: 38, label: 'Zone adds — tank les deux côtés' },
            { type: 'boss',  cx: 50, cy: 18, label: 'Deathwhisper (bouclier mana)' },
            { type: 'tank',  cx: 50, cy: 30, label: 'Maël — tank les deux côtés en alternance' },
            { type: 'range', positions: [{ cx: 25, cy: 65 }, { cx: 50, cy: 70 }, { cx: 75, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '⚡ 5-man : 1 tank = Maël gère les adds des 2 côtés. DPS focus bouclier mana. Fantômes → kite vers le fond. Pas de 2ème tank → Maël doit se déplacer rapidement.' },
          ]
        },
        {
          name: 'Phase 2 — Boss',
          elements: [
            { type: 'boss',  cx: 50, cy: 22, label: 'Lady Deathwhisper (focus DPS)' },
            { type: 'tank',  cx: 50, cy: 35, label: 'Maël — tank boss' },
            { type: 'range', positions: [{ cx: 22, cy: 68 }, { cx: 50, cy: 73 }, { cx: 78, cy: 68 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 82 }] },
            { type: 'note',  text: '💀 5-man P2 : Focus DPS boss. Mind Control → le joueur MC doit être tué (CC/stomp). Fantômes encore actifs. Tristan surveille Maël en priorité.' },
          ]
        }
      ]
    },

    saurfang: {
      name: 'Deathbringer Saurfang',
      room: 'circle',
      phases: [
        {
          name: 'Phase unique',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 36, r: 18, label: 'Cleave — rester sur les côtés' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Saurfang' },
            { type: 'tank',  cx: 50, cy: 24, label: 'Maël — dos au mur' },
            { type: 'range', positions: [{ cx: 22, cy: 65 }, { cx: 50, cy: 72 }, { cx: 78, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 82 }] },
            { type: 'note',  text: '🩸 5-man : NE PAS tuer les Adds de sang (donnent énergie à Saurfang). Marque de sang → courrir en bordure de salle. Tristan ne soigne PAS les marqués (ça booste Saurfang).' },
          ]
        }
      ]
    },

    festergut: {
      name: 'Festergut',
      room: 'circle',
      phases: [
        {
          name: 'Phase normale',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 36, r: 20, label: 'Zone corpo / Pungent Blight' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Festergut' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — tank' },
            { type: 'range', positions: [{ cx: 25, cy: 65 }, { cx: 50, cy: 71 }, { cx: 75, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '☣️ 5-man : Tous les 5 doivent avoir 3 stacks Inoculated avant Pungent Blight. Gaz vomitif aléatoire → se disperser. Enrage très rapide à 5 — DPS critique !' },
          ]
        }
      ]
    },

    rotface: {
      name: 'Rotface',
      room: 'circle',
      phases: [
        {
          name: 'Phase normale',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 36, r: 18, label: 'Zone cleave' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Rotface' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — tank boss' },
            { type: 'tank',  cx: 78, cy: 58, label: 'DPS kite slime ↻' },
            { type: 'range', positions: [{ cx: 28, cy: 65 }, { cx: 72, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 78 }] },
            { type: 'note',  text: '🐛 5-man : 1 DPS doit kiter le gros slime en cercle pendant que les 2 autres DPS boss. Tristan soigne le kiteur en mouvement. Ooze Flood → courir.' },
          ]
        }
      ]
    },

    putricide: {
      name: 'Professor Putricide',
      room: 'rect',
      phases: [
        {
          name: 'Phase 1 & 2',
          elements: [
            { type: 'zone-danger', x: 58, y: 5, w: 37, h: 28, label: 'Table Orange Ooze' },
            { type: 'zone-danger', x: 5,  y: 5, w: 37, h: 28, label: 'Table Green Ooze' },
            { type: 'boss',  cx: 50, cy: 28, label: 'Putricide' },
            { type: 'tank',  cx: 50, cy: 40, label: 'Maël — tank boss' },
            { type: 'range', positions: [{ cx: 22, cy: 70 }, { cx: 50, cy: 75 }, { cx: 78, cy: 70 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 85 }] },
            { type: 'note',  text: '🧪 5-man : 1 DPS absorbé dans l\'Ooze → les 2 autres focus immédiat. Malleable Goo → dodge. À 35% P3 commence, tout s\'active en même temps.' },
          ]
        },
        {
          name: 'Phase 3 — Final',
          elements: [
            { type: 'zone-danger', x: 5, y: 5, w: 90, h: 90, label: 'Slime partout + Ooze actifs', opacity: 0.12 },
            { type: 'boss',  cx: 50, cy: 45, label: 'Putricide (P3)' },
            { type: 'tank',  cx: 50, cy: 35, label: 'Maël' },
            { type: 'note',  text: '💀 5-man P3 : Tout est actif en même temps. Berserk rapide → DPS full. Tristan en heal continu. Si 1 DPS absorbe → priorité absolue.' },
          ]
        }
      ]
    },

    princes: {
      name: 'Blood Prince Council',
      room: 'circle',
      phases: [
        {
          name: 'Combat',
          elements: [
            { type: 'boss',  cx: 50, cy: 28, label: 'Prince actif (le + de PV) → DPS focus' },
            { type: 'boss',  cx: 28, cy: 62, label: 'Prince 2 (kite)' },
            { type: 'boss',  cx: 72, cy: 62, label: 'Prince 3 (kite)' },
            { type: 'tank',  cx: 50, cy: 20, label: 'Maël — tank prince actif' },
            { type: 'range', positions: [{ cx: 25, cy: 78 }, { cx: 75, cy: 78 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 84 }] },
            { type: 'note',  text: '🧛 5-man : Maël tank le prince actif. 1 DPS kite Keleseth (qui absorbe les ombres seul). Kinetic Bombs → 1 DPS frappe pour maintenir en l\'air. Tristan focus le DPS qui kite Keleseth.' },
          ]
        }
      ]
    },

    lanathel: {
      name: "Blood-Queen Lana'thel",
      room: 'circle',
      phases: [
        {
          name: 'Phase normale',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 36, r: 18, label: 'Cleave frontal' },
            { type: 'boss',  cx: 50, cy: 36, label: "Blood-Queen Lana'thel" },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — dos au mur' },
            { type: 'range', positions: [{ cx: 25, cy: 65 }, { cx: 50, cy: 71 }, { cx: 75, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 81 }] },
            { type: 'note',  text: '🧛 5-man : Chaîne de morsures à 5 = 1→2→3→1 (3 joueurs max). Pact of Darkness → se disperser. Tristan = jamais mordu (doit soigner). Air phase → se grouper sous le boss.' },
          ]
        }
      ]
    },

    valithria: {
      name: 'Valithria Dreamwalker',
      room: 'rect',
      phases: [
        {
          name: 'Soin du dragon',
          elements: [
            { type: 'zone-safe',  x: 30, y: 22, w: 40, h: 20, label: 'Portails de rêve — Tristan entre ici' },
            { type: 'boss',  cx: 50, cy: 32, label: 'Valithria (à soigner jusqu\'à 100%)' },
            { type: 'tank',  cx: 50, cy: 62, label: 'Maël — tank tous les adds' },
            { type: 'range', positions: [{ cx: 28, cy: 72 }, { cx: 50, cy: 76 }, { cx: 72, cy: 72 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 42 }] },
            { type: 'note',  text: '💚 5-man : Tristan entre dans les portails pour stacker Emerald Vigor (+10% soin/stack). Plus de stacks = soins massifs sur Valithria. DPS et Maël tuent TOUS les adds. Victoire = dragon à 100%.' },
          ]
        }
      ]
    },

    sindragosa: {
      name: 'Sindragosa',
      room: 'rect',
      phases: [
        {
          name: 'Phase 1 & 2 — Sol',
          elements: [
            { type: 'zone-danger', x: 22, y: 5, w: 56, h: 30, label: 'Cleave / Tail Swipe' },
            { type: 'boss',  cx: 50, cy: 22, label: 'Sindragosa' },
            { type: 'tank',  cx: 50, cy: 33, label: 'Maël — tank' },
            { type: 'range', positions: [{ cx: 22, cy: 66 }, { cx: 50, cy: 71 }, { cx: 78, cy: 66 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🧊 5-man : Tombes de glace → se positionner à gauche/droite pour LoS de Frost Breath. Ne JAMAIS être derrière (Tail Swipe). Frost Stacks sur Maël → Tristan top priorité.' },
          ]
        },
        {
          name: 'Phase 3 — Enrage',
          elements: [
            { type: 'zone-danger', x: 5, y: 5, w: 90, h: 90, label: 'Blistering Cold — rester SOUS le boss', color: '#03a9f4', opacity: 0.15 },
            { type: 'boss', cx: 50, cy: 45, label: 'Sindragosa (Blistering Cold)' },
            { type: 'note', text: '❄️ 5-man P3 : Grouper sous le boss pour Blistering Cold. Tombes LoS = vital. DPS full, Maël tient avec soins de Tristan. 2 min max avant wipe.' },
          ]
        }
      ]
    },

    lichking: {
      name: 'The Lich King',
      room: 'circle',
      phases: [
        {
          name: 'Phase 1',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 92, r: 10, label: 'Bord — NE PAS TOMBER' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Lich King' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — dos au bord nord' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '💀 5-man : Defile → COURIR loin du groupe immédiatement. Val\'kyr → focus DPS absolu (3 DPS). Infest → Tristan spam soins AoE. Transition rapide à 70%.' },
          ]
        },
        {
          name: 'Transition',
          elements: [
            { type: 'zone-safe',   cx: 50, cy: 50, r: 18, label: 'Grouper au centre' },
            { type: 'zone-danger', cx: 50, cy: 50, r: 46, label: 'Esprits → focus', color: '#9c27b0', opacity: 0.18 },
            { type: 'note', text: '👻 5-man : Grouper au centre, focus les esprits avec tous les 3 DPS. Court, mais fatal si raté.' },
          ]
        },
        {
          name: 'Phase 2 & 3',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 76, r: 20, label: 'Defile — COURIR si ciblé' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Lich King' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël' },
            { type: 'range', positions: [{ cx: 28, cy: 62 }, { cx: 50, cy: 68 }, { cx: 72, cy: 62 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 78 }] },
            { type: 'note',  text: '💀 5-man P3 : Pain and Suffering → Maël swap si possible. Vile Spirits → disperser et move. Enrage serré → les 3 DPS à fond. La phase finale à 10% = cinématique.' },
          ]
        }
      ]
    },

    /* ===== ULDUAR ===== */

    flameleviathan: {
      name: 'Flame Leviathan',
      room: 'rect',
      phases: [
        {
          name: 'Combat véhicule',
          elements: [
            { type: 'zone-danger', x: 35, y: 35, w: 30, h: 30, label: 'Zone Leviathan' },
            { type: 'boss', cx: 50, cy: 50, label: 'Flame Leviathan' },
            { type: 'note', text: '🚗 5-man : 2 véhicules (Demolisher + Siège). 1 joueur dans le Demolisher tire sur le Leviathan, 1 passager monte dessus pour DPS le moteur. Overload Circuit → interrompre.' },
          ]
        }
      ]
    },

    yoggsaron: {
      name: "Yogg-Saron",
      room: 'circle',
      phases: [
        {
          name: 'Phase 1',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 50, r: 46, label: 'Nuages de folie — ne pas entrer', opacity: 0.15 },
            { type: 'boss',  cx: 50, cy: 50, label: 'Sara' },
            { type: 'tank',  cx: 35, cy: 55, label: 'Maël — Guardian' },
            { type: 'range', positions: [{ cx: 25, cy: 72 }, { cx: 50, cy: 78 }, { cx: 75, cy: 72 }] },
            { type: 'note',  text: '☁️ 5-man : Éviter ABSOLUMENT les nuages de folie. Tuer les Serviteurs. 1 Guardian à la fois pour Maël. À 5 la jauge de folie monte vite — rester concentrés.' },
          ]
        },
        {
          name: 'Phase 2 — Cerveau',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 50, r: 30, label: 'Portails vers le cerveau' },
            { type: 'note', text: '🐙 5-man : Tuer tentacules. 2-3 joueurs entrent dans les portails. Dans le cerveau : NE PAS REGARDER Yogg (folie = mort). Tuer les cellules cérébrales rapidement.' },
          ]
        }
      ]
    },

    /* ===== NAXXRAMAS ===== */

    anubrekhan: {
      name: "Anub'Rekhan",
      room: 'circle',
      phases: [
        {
          name: 'Phase normale',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 36, r: 18, label: 'Locust Swarm — kite le boss' },
            { type: 'boss',  cx: 50, cy: 36, label: "Anub'Rekhan" },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — kite pendant Locust' },
            { type: 'range', positions: [{ cx: 25, cy: 66 }, { cx: 50, cy: 72 }, { cx: 75, cy: 66 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 82 }] },
            { type: 'note',  text: '🕷️ 5-man : Locust Swarm → Maël kite le boss le long du mur extérieur. Impale aléatoire → Tristan soigne immédiatement. Crypt Guards → DPS focus.' },
          ]
        }
      ]
    },

    heigan: {
      name: 'Heigan the Unclean',
      room: 'rect',
      phases: [
        {
          name: 'The Safety Dance',
          elements: [
            { type: 'zone-danger', x: 25, y: 5,  w: 73, h: 28, label: 'Zone 1 — DANGER' },
            { type: 'zone-danger', x: 25, y: 33, w: 73, h: 28, label: 'Zone 2 — DANGER' },
            { type: 'zone-danger', x: 25, y: 61, w: 73, h: 28, label: 'Zone 3 — DANGER' },
            { type: 'zone-safe',  x: 5,  y: 5,  w: 18, h: 90, label: 'Plateforme — SAFE' },
            { type: 'boss', cx: 14, cy: 50, label: 'Heigan (plateforme)' },
            { type: 'tank', cx: 14, cy: 38, label: 'Maël (plateforme)' },
            { type: 'note', text: '💃 5-man : SAFETY DANCE = tout le monde danse. Séquence 1→2→3→2→1 en boucle. 1 seul joueur sur la plateforme avec le tank (Maël). Tristan danse aussi — personne ne peut rester en dehors.' },
          ]
        }
      ]
    },

    kelthuzad: {
      name: "Kel'Thuzad",
      room: 'circle',
      phases: [
        {
          name: 'Phase 1 — Adds',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 50, r: 20, label: "Centre — ombre de Kel'Thuzad" },
            { type: 'range', positions: [{ cx: 25, cy: 68 }, { cx: 50, cy: 75 }, { cx: 75, cy: 68 }] },
            { type: 'tank',  cx: 50, cy: 38, label: 'Maël — garde le centre' },
            { type: 'heal',  positions: [{ cx: 50, cy: 82 }] },
            { type: 'note',  text: '💀 5-man P1 : Tuer tous les adds avant que le boss s\'active. Void Zones → se disperser. Maël prend les adds lourds.' },
          ]
        },
        {
          name: 'Phase 2 — Boss',
          elements: [
            { type: 'boss',  cx: 50, cy: 50, label: "Kel'Thuzad" },
            { type: 'tank',  cx: 50, cy: 40, label: 'Maël' },
            { type: 'range', positions: [{ cx: 25, cy: 70 }, { cx: 50, cy: 76 }, { cx: 75, cy: 70 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 84 }] },
            { type: 'note',  text: '💀 5-man P2 : Frost Blast → Tristan soigne le joueur ciblé EN URGENCE. Shadow Fissure → fuir immédiatement. Détruire les Gardes des os (priorité sur DPS boss).' },
          ]
        }
      ]
    },

    /* ===== NAXXRAMAS (suite) ===== */

    faerlina: {
      name: 'Grand Widow Faerlina',
      room: 'circle',
      phases: [
        {
          name: 'Phase normale',
          elements: [
            { type: 'boss',  cx: 50, cy: 36, label: 'Grand Widow Faerlina' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — dos au mur nord' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🕸️ 5-man : Frenzy → tuer un Worshipper immédiatement (garder 1 adepte de côté). Rain of Fire → se déplacer hors des zones. Tristan dispell Poison Bolt Volley sur lui-même en priorité.' },
          ]
        }
      ]
    },

    maexxna: {
      name: 'Maexxna',
      room: 'circle',
      phases: [
        {
          name: 'Phase normale',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 82, r: 10, label: 'Cocons Web Wrap — libérer immédiatement' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Maexxna' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — dos au nord' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🕸️ 5-man : Web Wrap → les 2 DPS libres cassent le cocon immédiatement. Web Spray (stun 5s) → Tristan doit avoir tout le monde à fond AVANT le prochain spray. Frenzy à 30% → Héroïsme + heal intensif sur Maël.' },
          ]
        }
      ]
    },

    noth: {
      name: 'Noth the Plaguebringer',
      room: 'rect',
      phases: [
        {
          name: 'Phase sol',
          elements: [
            { type: 'boss',  cx: 50, cy: 25, label: 'Noth (se téléporte)' },
            { type: 'tank',  cx: 50, cy: 35, label: 'Maël — repositionner après Blink' },
            { type: 'range', positions: [{ cx: 25, cy: 70 }, { cx: 50, cy: 75 }, { cx: 75, cy: 70 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 83 }] },
            { type: 'note',  text: '🧟 5-man : Noth Blink → Maël repositionne immédiatement. Phase balcon : 70s avec squelettes → Maël aggro tous, DPS AoE. Tristan dispell Curse of the Plaguebringer. DPS race avant le 3e balcon.' },
          ]
        },
        {
          name: 'Phase balcon',
          elements: [
            { type: 'zone-danger', x: 5, y: 5, w: 90, h: 90, label: 'Vagues de squelettes', opacity: 0.12 },
            { type: 'tank',  cx: 50, cy: 50, label: 'Maël — aggro toutes les vagues' },
            { type: 'range', positions: [{ cx: 28, cy: 70 }, { cx: 72, cy: 70 }] },
            { type: 'note', text: '💀 Balcon : Noth invulnérable 70s. Maël grab les squelettes. DPS AoE. Tristan top le monde. Ne pas laisser les squelettes déborder.' },
          ]
        }
      ]
    },

    loatheb: {
      name: 'Loatheb',
      room: 'circle',
      phases: [
        {
          name: 'Phase unique',
          elements: [
            { type: 'boss',  cx: 50, cy: 36, label: 'Loatheb' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🍄 5-man : Loatheb bloque les soins 17s/20s → Tristan soigne dans la fenêtre de 3s seulement (Spore active). Tous les DPS full sur le boss. Nécrotic Aura → gérer les HP. Spore → Maël et DPS la tuent pour le buff crit.' },
          ]
        }
      ]
    },

    razuvious: {
      name: 'Instructor Razuvious',
      room: 'rect',
      phases: [
        {
          name: 'Combat',
          elements: [
            { type: 'boss',  cx: 50, cy: 30, label: 'Instructor Razuvious' },
            { type: 'tank',  cx: 32, cy: 45, label: 'DK understudy 1 (MC)' },
            { type: 'tank',  cx: 68, cy: 45, label: 'DK understudy 2 (MC)' },
            { type: 'range', positions: [{ cx: 25, cy: 72 }, { cx: 50, cy: 76 }, { cx: 75, cy: 72 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 84 }] },
            { type: 'note',  text: '🎓 5-man : Razuvious ne peut être tanké que par des Death Knight Understudy controlés mentalement (MC). 2 understudy alternent le tank (swap à 2 stacks Disrupting Shout). Maël garde l\'aggro des adds. DPS boss, Tristan surveille les MC.' },
          ]
        }
      ]
    },

    gothik: {
      name: 'Gothik the Harvester',
      room: 'rect',
      phases: [
        {
          name: 'Phase split',
          elements: [
            { type: 'zone-danger', x: 5,  y: 5, w: 43, h: 90, label: 'Côté Vivants — adds non-morts' },
            { type: 'zone-safe',   x: 52, y: 5, w: 43, h: 90, label: 'Côté Gothik — boss sur balcon' },
            { type: 'boss', cx: 75, cy: 18, label: 'Gothik (balcon, invulnérable)' },
            { type: 'tank', cx: 25, cy: 50, label: 'Maël — côté vivants' },
            { type: 'range', positions: [{ cx: 25, cy: 35 }, { cx: 25, cy: 65 }] },
            { type: 'heal', positions: [{ cx: 25, cy: 78 }] },
            { type: 'note', text: '⚗️ 5-man : Tous côté vivants. Tuer les Spectral Riders/Warriors. Ils passent côté Gothik une fois morts → s\'accumulent. À 25% Gothik descend → Maël l\'engage. DPS burn Gothik avant que les spectres débordent.' },
          ]
        },
        {
          name: 'Phase finale',
          elements: [
            { type: 'boss', cx: 50, cy: 35, label: 'Gothik (actif)' },
            { type: 'tank', cx: 50, cy: 25, label: 'Maël' },
            { type: 'range', positions: [{ cx: 28, cy: 65 }, { cx: 72, cy: 65 }] },
            { type: 'note', text: '💀 Gothik actif : DPS burn immédiat. Les spectres sont toujours actifs. Timer serré à 5.' },
          ]
        }
      ]
    },

    fourhorsemen: {
      name: 'The Four Horsemen',
      room: 'rect',
      phases: [
        {
          name: 'Positionnement',
          elements: [
            { type: 'boss',  cx: 20, cy: 20, label: 'Baron Rivendare (melee)' },
            { type: 'boss',  cx: 80, cy: 20, label: 'Thane Korth\'azz (melee)' },
            { type: 'boss',  cx: 20, cy: 80, label: 'Lady Blaumeux (range)' },
            { type: 'boss',  cx: 80, cy: 80, label: 'Sir Zeliek (range)' },
            { type: 'tank',  cx: 20, cy: 35, label: 'Maël — tank les 2 melee (alterne)' },
            { type: 'range', positions: [{ cx: 50, cy: 50 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 65 }] },
            { type: 'note',  text: '🏇 5-man : Marks → 4 stacks = mort. Maël kite les 2 melee (Rivendare + Korth\'azz) dans leur coin, swap si Mark. DPS range alternent les cibles pour répartir les Marks. Tristan reste au centre. Ordre de kill : Korth\'azz → Rivendare → casters.' },
          ]
        }
      ]
    },

    patchwerk: {
      name: 'Patchwerk',
      room: 'circle',
      phases: [
        {
          name: 'Phase unique',
          elements: [
            { type: 'boss',  cx: 50, cy: 38, label: 'Patchwerk' },
            { type: 'tank',  cx: 50, cy: 27, label: 'Maël — tank principal' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🪓 5-man : Patchwerk est un DPS race pur. Hateful Strike frappe le joueur avec le plus de HP (hors aggro) → Tristan surveille les HP de Maël. Berserk à 7 min. Tristan peut prendre des coups de Hateful Strike — CDs déf si besoin.' },
          ]
        }
      ]
    },

    grobbulus: {
      name: 'Grobbulus',
      room: 'circle',
      phases: [
        {
          name: 'Kite circulaire',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 50, r: 46, label: 'Injections de poison au sol — ne pas marcher dedans', opacity: 0.15 },
            { type: 'boss',  cx: 50, cy: 38, label: 'Grobbulus (en mouvement)' },
            { type: 'tank',  cx: 50, cy: 27, label: 'Maël — kite en cercle ↻' },
            { type: 'range', positions: [{ cx: 30, cy: 64 }, { cx: 70, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 75 }] },
            { type: 'note',  text: '🧫 5-man : Injection → le joueur ciblé court s\'isoler pour déposer son poison loin du groupe. Maël kite Grobbulus en cercle ↻ en évitant les flaques. Ne jamais marcher dans les zones de poison. Tristan reste hors des zones.' },
          ]
        }
      ]
    },

    gluth: {
      name: 'Gluth',
      room: 'circle',
      phases: [
        {
          name: 'Phase normale',
          elements: [
            { type: 'zone-safe',   cx: 50, cy: 75, r: 18, label: 'Kite zone — maintenir les Zombie Chow ici' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Gluth' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — face au nord' },
            { type: 'range', positions: [{ cx: 28, cy: 60 }, { cx: 72, cy: 60 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 72 }] },
            { type: 'note',  text: '🐕 5-man : Decimate → tous les joueurs tombent à 5% HP. Tristan burst heal immédiat. Zombie Chow → 1 DPS kite les zombies. Si un zombie atteint Gluth → il se soigne massivement. Wound Poison sur les DPS → dispell priorité. Swap si besoin.' },
          ]
        }
      ]
    },

    thaddius: {
      name: 'Thaddius',
      room: 'circle',
      phases: [
        {
          name: 'Phase Thaddius',
          elements: [
            { type: 'zone-safe',   cx: 22, cy: 50, r: 15, label: 'Côté + (Positif)' },
            { type: 'zone-danger', cx: 78, cy: 50, r: 15, label: 'Côté — (Négatif)', color: '#9c27b0', opacity: 0.2 },
            { type: 'boss',  cx: 50, cy: 38, label: 'Thaddius' },
            { type: 'tank',  cx: 50, cy: 28, label: 'Maël — face au nord' },
            { type: 'range', positions: [{ cx: 20, cy: 62 }, { cx: 50, cy: 68 }, { cx: 80, cy: 62 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 78 }] },
            { type: 'note',  text: '⚡ 5-man : Polarity Shift → changer de côté selon la charge reçue (+ ou −). Être du MÊME côté = bonus DPS. Côté opposé = explosion. Maël en coin. Fulguration → se disperser pour réduire les dégâts en chaîne.' },
          ]
        }
      ]
    },

    sapphiron: {
      name: 'Sapphiron',
      room: 'rect',
      phases: [
        {
          name: 'Phase sol',
          elements: [
            { type: 'zone-danger', x: 5, y: 5, w: 90, h: 35, label: 'Zone frontale — Frost Breath mortel' },
            { type: 'boss',  cx: 50, cy: 22, label: 'Sapphiron' },
            { type: 'tank',  cx: 50, cy: 30, label: 'Maël — face au nord' },
            { type: 'range', positions: [{ cx: 22, cy: 66 }, { cx: 50, cy: 71 }, { cx: 78, cy: 66 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🐉 5-man : Frost Breath → ne jamais être devant. Ice Bolt → cible 1 joueur qui devient bloc de glace. Les autres se cachent DERRIÈRE le bloc avant Blizzard AoE. Life Drain → interrompre si possible. Maël maximise armure.' },
          ]
        },
        {
          name: 'Phase air',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 50, r: 46, label: 'Blizzard zones aléatoires', opacity: 0.15 },
            { type: 'zone-safe',   cx: 50, cy: 68, r: 12, label: 'Se cacher derrière Ice Block' },
            { type: 'note', text: '❄️ Phase air : Sapphiron vole. Ice Block ciblé → se cacher immédiatement derrière. Blizzard → éviter les zones. Sapphiron redescend après quelques secondes.' },
          ]
        }
      ]
    },

    /* ===== ULDUAR (suite) ===== */

    ignis: {
      name: 'Ignis the Furnace Master',
      room: 'rect',
      phases: [
        {
          name: 'Kite + Constructs',
          elements: [
            { type: 'zone-danger', x: 5, y: 5, w: 90, h: 35, label: 'Sillages de Scorch — éviter' },
            { type: 'zone-safe',   x: 35, y: 60, w: 30, h: 25, label: 'Eau — Brittle Constructs ici' },
            { type: 'boss',  cx: 50, cy: 28, label: 'Ignis (kité vers le nord)' },
            { type: 'tank',  cx: 50, cy: 20, label: 'Maël — kite Ignis ↑' },
            { type: 'range', positions: [{ cx: 22, cy: 72 }, { cx: 50, cy: 77 }, { cx: 78, cy: 72 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 84 }] },
            { type: 'note',  text: '🔥 5-man : Maël kite Ignis le long du mur nord pour éviter de repasser sur les Scorch. Slag Pot → Tristan burst heal le joueur dedans. Constructs → DPS kite dans l\'eau (Brittle), puis 1 coup pour briser. Haste buff → heal intensif.' },
          ]
        }
      ]
    },

    razorscale: {
      name: 'Razorscale',
      room: 'rect',
      phases: [
        {
          name: 'Phase sol',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 30, r: 25, label: 'Flame Breath frontal' },
            { type: 'boss',  cx: 50, cy: 25, label: 'Razorscale' },
            { type: 'tank',  cx: 50, cy: 15, label: 'Maël — face au nord' },
            { type: 'range', positions: [{ cx: 22, cy: 65 }, { cx: 50, cy: 70 }, { cx: 78, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🦅 5-man : Phase aérienne : activer les harpons (Engineers) pour ramener Razorscale au sol. Phase sol : DPS burst avant qu\'elle reparte. Flame Breath → jamais devant. Fire Nova → disperser. À 50% elle reste au sol → burn.' },
          ]
        }
      ]
    },

    xt002: {
      name: 'XT-002 Deconstructor',
      room: 'rect',
      phases: [
        {
          name: 'Combat',
          elements: [
            { type: 'zone-safe',   cx: 50, cy: 25, r: 12, label: 'Cœur exposé — DPS burst ici' },
            { type: 'boss',  cx: 50, cy: 35, label: 'XT-002' },
            { type: 'tank',  cx: 50, cy: 24, label: 'Maël — sous le boss' },
            { type: 'range', positions: [{ cx: 22, cy: 68 }, { cx: 50, cy: 73 }, { cx: 78, cy: 68 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 82 }] },
            { type: 'note',  text: '🤖 5-man : Tantrum → AoE raid 35s, Tristan soigne en continu. Gravity Bomb → joueur ciblé court s\'isoler. Light Bomb → joueur ciblé court s\'isoler. Heart exposed → DPS burst massif sur le cœur (phase courte). Soulstorm/Adds → AoE priorité.' },
          ]
        }
      ]
    },

    assemblyofiron: {
      name: 'Assembly of Iron',
      room: 'rect',
      phases: [
        {
          name: 'Triple boss',
          elements: [
            { type: 'boss',  cx: 22, cy: 35, label: 'Steelbreaker (le dernier = difficulté max)' },
            { type: 'boss',  cx: 50, cy: 25, label: 'Runemaster Molgeim' },
            { type: 'boss',  cx: 78, cy: 35, label: 'Stormcaller Brundir' },
            { type: 'tank',  cx: 22, cy: 50, label: 'Maël — Steelbreaker' },
            { type: 'range', positions: [{ cx: 50, cy: 68 }, { cx: 78, cy: 60 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '⚙️ 5-man : Ordre kill → Brundir > Molgeim > Steelbreaker (ordre facile). Maël tank tous les 3 séparément. Rune of Power (Molgeim) → s\'en aller. Overload (Brundir) → interrompre. Fusion Punch (Steelbreaker) → soin raid immédiat.' },
          ]
        }
      ]
    },

    kologarn: {
      name: 'Kologarn',
      room: 'rect',
      phases: [
        {
          name: 'Combat',
          elements: [
            { type: 'zone-danger', x: 5, y: 5, w: 43, h: 55, label: 'Bras gauche — Focused Eyebeam' },
            { type: 'zone-danger', x: 52, y: 5, w: 43, h: 55, label: 'Bras droit — Stone Grip' },
            { type: 'boss',  cx: 50, cy: 35, label: 'Kologarn (corps principal)' },
            { type: 'tank',  cx: 50, cy: 22, label: 'Maël — face au boss' },
            { type: 'range', positions: [{ cx: 22, cy: 72 }, { cx: 50, cy: 77 }, { cx: 78, cy: 72 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 84 }] },
            { type: 'note',  text: '🗿 5-man : DPS focus les bras pour libérer les joueurs empoignés (Stone Grip). Eyebeam laser → le joueur ciblé court perpendiculairement. Rubble → AoE tuer. Priorité bras gauche (Grip) > bras droit > corps.' },
          ]
        }
      ]
    },

    auriaya: {
      name: 'Auriaya',
      room: 'rect',
      phases: [
        {
          name: 'Combat',
          elements: [
            { type: 'zone-danger', x: 5, y: 5, w: 90, h: 30, label: 'Zone frontale — Sonic Screech' },
            { type: 'boss',  cx: 50, cy: 22, label: 'Auriaya' },
            { type: 'boss',  cx: 25, cy: 40, label: 'Feral Defender' },
            { type: 'tank',  cx: 50, cy: 12, label: 'Maël — face au nord' },
            { type: 'range', positions: [{ cx: 22, cy: 68 }, { cx: 50, cy: 73 }, { cx: 78, cy: 68 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 82 }] },
            { type: 'note',  text: '🐱 5-man : Pull délicat — pull au couloir pour éviter les patrouilles. Sentinel Swarm (chats) → AoE tuer avant le boss. Feral Defender → tank séparé par Maël, DPS le tuer. Sanctuary of Rebirth → zones d\'étourdissement. Sonic Screech → jamais devant.' },
          ]
        }
      ]
    },

    hodir: {
      name: 'Hodir',
      room: 'rect',
      phases: [
        {
          name: 'DPS race',
          elements: [
            { type: 'zone-danger', x: 5, y: 5, w: 90, h: 45, label: 'Flash Freeze — sortir avant la fin du cast' },
            { type: 'zone-safe',   x: 15, y: 55, w: 15, h: 20, label: 'Statue L' },
            { type: 'zone-safe',   x: 70, y: 55, w: 15, h: 20, label: 'Statue R' },
            { type: 'boss',  cx: 50, cy: 28, label: 'Hodir' },
            { type: 'tank',  cx: 50, cy: 20, label: 'Maël' },
            { type: 'range', positions: [{ cx: 22, cy: 72 }, { cx: 50, cy: 77 }, { cx: 78, cy: 72 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 84 }] },
            { type: 'note',  text: '❄️ 5-man : Flash Freeze → sortir du cast OU se mettre à côté d\'une statue (créé un abri). Briser les glaçons sur les alliés. Activer les statues (NPC alliés) pour bonus Storm Power. Enrage à 3 min → DPS race critique. Biting Cold → rester en mouvement.' },
          ]
        }
      ]
    },

    thorim: {
      name: 'Thorim',
      room: 'rect',
      phases: [
        {
          name: 'Phase arène + couloir',
          elements: [
            { type: 'zone-safe',   x: 5,  y: 5, w: 43, h: 90, label: 'Arène — Maël + 2 DPS' },
            { type: 'zone-danger', x: 52, y: 5, w: 43, h: 90, label: 'Couloir — 2 joueurs avancent' },
            { type: 'boss', cx: 25, cy: 50, label: 'Mini-boss arène' },
            { type: 'boss', cx: 75, cy: 15, label: 'Thorim (balcon)' },
            { type: 'tank', cx: 25, cy: 40, label: 'Maël — arène' },
            { type: 'range', positions: [{ cx: 25, cy: 70 }, { cx: 75, cy: 50 }] },
            { type: 'note',  text: '⚡ 5-man : Split — 2 joueurs avancent dans le couloir, 3 dans l\'arène. Couloir : atteindre l\'escalier pour activer Thorim. Arène : Maël tank le champion, DPS tient. Thorim Phase 2 → tous s\'alignent. Unbalancing Strike → interrompre via grappling.' },
          ]
        },
        {
          name: 'Phase 2 — Thorim actif',
          elements: [
            { type: 'boss',  cx: 50, cy: 35, label: 'Thorim (actif)' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël' },
            { type: 'range', positions: [{ cx: 25, cy: 68 }, { cx: 75, cy: 68 }] },
            { type: 'note', text: '⚡ Thorim P2 : Chain Lightning → se disperser. Stormhammer → sortir de la zone. Unbalancing Strike → CD défensif sur Maël.' },
          ]
        }
      ]
    },

    freya: {
      name: 'Freya',
      room: 'circle',
      phases: [
        {
          name: 'Combat principal',
          elements: [
            { type: 'zone-danger', cx: 20, cy: 30, r: 12, label: 'Elder 1 zone (si actif)' },
            { type: 'zone-danger', cx: 80, cy: 30, r: 12, label: 'Elder 2 zone (si actif)' },
            { type: 'zone-danger', cx: 50, cy: 78, r: 12, label: 'Elder 3 zone (si actif)' },
            { type: 'boss',  cx: 50, cy: 40, label: 'Freya' },
            { type: 'tank',  cx: 50, cy: 30, label: 'Maël' },
            { type: 'range', positions: [{ cx: 28, cy: 62 }, { cx: 50, cy: 67 }, { cx: 72, cy: 62 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 78 }] },
            { type: 'note',  text: '🌿 5-man : Tuer les 3 Elders en ordre avant Freya (sinon immortelle). Eonar\'s Gift → interrompre. Wave of Nature → AoE tuer les adds de chaque vague. Detonating Lasher → tuer immédiatement (explose). Sunbeam → sortir.' },
          ]
        }
      ]
    },

    mimiron: {
      name: 'Mimiron',
      room: 'rect',
      phases: [
        {
          name: 'Phase 1 — Leviathan Mk II',
          elements: [
            { type: 'zone-danger', x: 35, y: 5, w: 30, h: 30, label: 'Plasma Blast — rester sur les côtés' },
            { type: 'boss',  cx: 50, cy: 22, label: 'Leviathan Mk II' },
            { type: 'tank',  cx: 50, cy: 14, label: 'Maël — face au nord' },
            { type: 'range', positions: [{ cx: 18, cy: 65 }, { cx: 50, cy: 70 }, { cx: 82, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🤖 5-man P1 : Napalm Shell → sortir de la zone au sol. Shock Blast → sortir immédiatement. Plasma Blast → gros dégâts sur le tank, Tristan burst heal. P2 : VX-001 tir laser + rocket barrage. P3 : Aerial Unit → anti-air. P4 : Tout ensemble → priorité jambes.' },
          ]
        }
      ]
    },

    vezax: {
      name: 'General Vezax',
      room: 'circle',
      phases: [
        {
          name: 'Phase unique',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 50, r: 20, label: 'Saronite Vapors — NE PAS marcher dedans' },
            { type: 'boss',  cx: 50, cy: 36, label: 'General Vezax' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — loin des vapeurs' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '👁️ 5-man : Saronite Vapors → NE PAS marcher dedans (regen mana mais perd HP). Tristan doit gérer son mana sans vapeurs. Mark of the Faceless → le joueur ciblé court s\'isoler. Surge of Darkness → Maël CDs défensifs immédiats.' },
          ]
        }
      ]
    },

    algalon: {
      name: 'Algalon the Observer',
      room: 'circle',
      phases: [
        {
          name: 'Phase normale',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 50, r: 30, label: 'Black Holes — ne pas tomber dedans', color: '#1a237e', opacity: 0.3 },
            { type: 'boss',  cx: 50, cy: 36, label: 'Algalon' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '⭐ 5-man (Légendaire) : Black Holes → se disperser, ne pas tomber. Collapsing Stars → tuer avant explosion. Phase cosmique → tous entrent dans un Black Hole ensemble. Quantum Strike → CD défensif. 1h par semaine max. Le boss le plus difficile de WotLK.' },
          ]
        }
      ]
    },

    /* ===== VOA (suite) ===== */

    emalon: {
      name: 'Emalon the Storm Watcher',
      room: 'circle',
      phases: [
        {
          name: 'Phase unique',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 36, r: 10, label: 'Chain Lightning AoE' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Emalon' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël' },
            { type: 'boss',  cx: 30, cy: 62, label: 'Tempest Minion (Overcharged!)' },
            { type: 'range', positions: [{ cx: 50, cy: 70 }, { cx: 72, cy: 62 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '⚡ 5-man : Overcharged Minion → le tuer immédiatement avant qu\'il explose (Electrical Overload). Maël tank Emalon + minions. DPS switche sur le Minion Overcharged dès qu\'il se l\'allume. Puis retour sur Emalon. Simple mais rapide.' },
          ]
        }
      ]
    },

    koralon: {
      name: 'Koralon the Flame Watcher',
      room: 'circle',
      phases: [
        {
          name: 'Phase unique',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 36, r: 22, label: 'Meteor Fists AoE' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Koralon' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël' },
            { type: 'range', positions: [{ cx: 28, cy: 66 }, { cx: 50, cy: 72 }, { cx: 72, cy: 66 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 82 }] },
            { type: 'note',  text: '🔥 5-man : Incandescent Rage (à 50%) → Maël prend des dégâts massifs, Tristan burst heal. Meteor Fists → AoE autour du tank, DPS s\'écartent légèrement. Burning Breath → cône, ne pas être devant. Boss simple, forte pression sur Tristan à 50%.' },
          ]
        }
      ]
    },

    toravon: {
      name: 'Toravon the Ice Watcher',
      room: 'circle',
      phases: [
        {
          name: 'Phase unique',
          elements: [
            { type: 'boss',  cx: 50, cy: 36, label: 'Toravon' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '❄️ 5-man : Whiteout → AoE frost sur tout le raid, Tristan soigne. Frozen Orb → le fuir. Frost-imbued Armor → debuff sur le tank, réduire son armure, Tristan surveille. Glacial Breath → cône, rester sur les côtés. Boss facile.' },
          ]
        }
      ]
    },

    /* ===== OS (mini-bosses) ===== */

    vesperon: {
      name: 'Vesperon',
      room: 'circle',
      phases: [
        {
          name: 'Combat',
          elements: [
            { type: 'boss',  cx: 50, cy: 36, label: 'Vesperon' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🌑 5-man : Drake volant. Entrer dans le portail pour couper -25% HP max. Twilight Torment → AoE sur le raid. Tuer rapidement pour réduire la difficulté de Sartharion. Atterrir → burst DPS.' },
          ]
        }
      ]
    },

    shadron: {
      name: 'Shadron',
      room: 'circle',
      phases: [
        {
          name: 'Combat',
          elements: [
            { type: 'boss',  cx: 50, cy: 36, label: 'Shadron' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🩸 5-man : Acolyte dans le portail → Shadron invulnérable tant qu\'il est en vie. 1 joueur entre dans le portail pour tuer l\'Acolyte. Puis DPS Shadron. Flame Breath → cône, rester sur les côtés.' },
          ]
        }
      ]
    },

    tenebron: {
      name: 'Tenebron',
      room: 'circle',
      phases: [
        {
          name: 'Combat',
          elements: [
            { type: 'boss',  cx: 50, cy: 36, label: 'Tenebron' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '💚 5-man : Portail → entre, tuer les œufs sinon de l\'Ombre Whelplings éclosent (ajoutent -25% soins reçus). Flame Breath cône. Tuer en priorité avant Sartharion pour simplifier le combat.' },
          ]
        }
      ]
    },

    /* ===== RUBY SANCTUM ===== */

    saviana: {
      name: 'Saviana Ragefire',
      room: 'circle',
      phases: [
        {
          name: 'Phase normale',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 36, r: 18, label: 'Flame Breath frontal' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Saviana Ragefire' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — face au nord' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🌋 5-man : Conflagration → joueur ciblé court immédiatement s\'isoler en bordure. Enrage → DPS burst ou interrompre. Flame Breath → rester derrière. Boss simple et court.' },
          ]
        }
      ]
    },

    baltharus: {
      name: 'Baltharus the Warborn',
      room: 'rect',
      phases: [
        {
          name: 'Phase 1',
          elements: [
            { type: 'boss',  cx: 50, cy: 30, label: 'Baltharus' },
            { type: 'tank',  cx: 50, cy: 20, label: 'Maël' },
            { type: 'range', positions: [{ cx: 22, cy: 68 }, { cx: 50, cy: 73 }, { cx: 78, cy: 68 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 82 }] },
            { type: 'note',  text: '⚔️ 5-man : Enervating Brand → le joueur ciblé STOP DPS immédiatement jusqu\'à expiration. Blade Tempest → s\'écarter. À 50% clone → Maël tank le clone séparé. Les 2 doivent mourir en même temps (±5%). DPS split.' },
          ]
        },
        {
          name: 'Phase 2 — Clone',
          elements: [
            { type: 'boss',  cx: 30, cy: 35, label: 'Baltharus original' },
            { type: 'boss',  cx: 70, cy: 35, label: 'Clone' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — tank les deux séparément' },
            { type: 'range', positions: [{ cx: 30, cy: 68 }, { cx: 70, cy: 68 }] },
            { type: 'note', text: '⚔️ À 50% : DPS split équitable sur les 2 cibles. Mort simultanée obligatoire. Maël kite pour les séparer.' },
          ]
        }
      ]
    },

    zarithrian: {
      name: 'General Zarithrian',
      room: 'rect',
      phases: [
        {
          name: 'Phase normale',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 28, r: 18, label: 'Cleave frontal' },
            { type: 'boss',  cx: 50, cy: 28, label: 'General Zarithrian' },
            { type: 'tank',  cx: 50, cy: 18, label: 'Maël — face au mur' },
            { type: 'range', positions: [{ cx: 22, cy: 65 }, { cx: 50, cy: 70 }, { cx: 78, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🦎 5-man : Flamescale Broodlings → tuer IMMÉDIATEMENT avant qu\'ils arrivent à Zarithrian (sinon buff). Maël intercepte les adds. Onyx Flame → swap à 2 stacks. Cleave frontal → DPS restent sur les côtés.' },
          ]
        }
      ]
    },

    halion: {
      name: 'Halion le Seigneur Crépusculaire',
      room: 'circle',
      phases: [
        {
          name: 'Phase 1 — Monde physique',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 36, r: 20, label: 'Tail Sweep + Flame Breath' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Halion (physique)' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — face au nord' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🔥 5-man P1 : Fiery Combustion → joueur ciblé court s\'isoler (laisse zone de feu). Tail Sweep → jamais derrière. Ph2 : split 3+2 (3 monde physique, 2 crépusculaire). Twilight Cutter (laser rotatif) → sauter par-dessus. Les 2 Halion partagent HP.' },
          ]
        },
        {
          name: 'Phase 3 — Double monde',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 50, r: 20, label: 'Twilight Cutter rotatif — sauter par-dessus' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Halion (les 2 copies actives)' },
            { type: 'note', text: '⚡ 5-man P3 : Les 2 copies actives simultanément. Twilight Cutter → timing précis pour sauter le laser. Soul Consumption → joueur s\'isole. DPS libre (pas de synchro nécessaire). Heal intense dans les 2 zones.' },
          ]
        }
      ]
    },

    /* ===== ONYXIA ===== */

    onyxia: {
      name: "Onyxia la Dévorante",
      room: 'rect',
      phases: [
        {
          name: 'Phase 1 — Au sol',
          elements: [
            { type: 'zone-danger', x: 28, y: 5, w: 44, h: 40, label: 'Flame Breath frontal — JAMAIS devant' },
            { type: 'zone-danger', x: 28, y: 45, w: 44, h: 30, label: 'Tail Sweep — JAMAIS derrière' },
            { type: 'boss',  cx: 50, cy: 28, label: 'Onyxia' },
            { type: 'tank',  cx: 50, cy: 15, label: 'Maël — face au fond' },
            { type: 'range', positions: [{ cx: 18, cy: 65 }, { cx: 50, cy: 70 }, { cx: 82, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🐉 5-man P1 : Maël positionne Onyxia face au fond de la grotte. DPS sur les flancs, jamais devant ni derrière. Whelps → 1 DPS intercepte et AoE. P2 (65%) : Onyxia vole → seuls casters/archers DPS. Deep Breath → courir vers la tête ou la queue.' },
          ]
        },
        {
          name: 'Phase 2 — En vol',
          elements: [
            { type: 'zone-danger', x: 15, y: 30, w: 70, h: 30, label: 'Deep Breath — courir tête ou queue', color: '#ff6d00', opacity: 0.25 },
            { type: 'boss',  cx: 50, cy: 40, label: 'Onyxia (vole)' },
            { type: 'range', positions: [{ cx: 22, cy: 70 }, { cx: 50, cy: 75 }, { cx: 78, cy: 70 }] },
            { type: 'note', text: '🌪️ Phase vol : Seuls ranged/casters DPS. Fireball aléatoire → se disperser. Deep Breath → immédiatement vers la tête (nord) ou la queue. Whelps → AoE.' },
          ]
        },
        {
          name: 'Phase 3 — Retour au sol',
          elements: [
            { type: 'zone-danger', x: 28, y: 5, w: 44, h: 40, label: 'Flame Breath renforcé' },
            { type: 'boss',  cx: 50, cy: 28, label: 'Onyxia (renforcée)' },
            { type: 'tank',  cx: 50, cy: 15, label: 'Maël — repositionner immédiatement' },
            { type: 'range', positions: [{ cx: 18, cy: 65 }, { cx: 82, cy: 65 }] },
            { type: 'note', text: '🔥 Phase 3 : Même positionnement que P1 mais dégâts augmentés. Conflagration → zones de feu au sol, éviter. Burn phase — DPS full. Tristan soigne Maël en continu.' },
          ]
        }
      ]
    },

    /* ===== TOC ===== */

    northrend_beasts: {
      name: 'Northrend Beasts',
      room: 'circle',
      phases: [
        {
          name: 'Gormok',
          elements: [
            { type: 'boss',  cx: 50, cy: 35, label: 'Gormok the Impaler' },
            { type: 'tank',  cx: 50, cy: 24, label: 'Maël — swap obligatoire à 2 stacks' },
            { type: 'range', positions: [{ cx: 25, cy: 65 }, { cx: 50, cy: 72 }, { cx: 75, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 82 }] },
            { type: 'note',  text: '🐗 5-man : Maël swap via taunt à 2 stacks Impale (sinon tank mort). Snobolds sur DPS → les tuer immédiatement. Tristan garde les stacks en priorité.' },
          ]
        },
        {
          name: 'Jormungars',
          elements: [
            { type: 'boss',  cx: 32, cy: 40, label: 'Dreadscale' },
            { type: 'boss',  cx: 68, cy: 40, label: 'Acidmaw' },
            { type: 'tank',  cx: 50, cy: 30, label: 'Maël — kite les deux' },
            { type: 'range', positions: [{ cx: 25, cy: 68 }, { cx: 75, cy: 68 }] },
            { type: 'note',  text: '🐍 5-man : Paralytic Poison + Burning Bile → le joueur affecté doit toucher le joueur avec l\'autre effet pour annuler. Prédéfinir qui touche qui.' },
          ]
        }
      ]
    },

    jaraxxus: {
      name: 'Lord Jaraxxus',
      room: 'circle',
      phases: [
        {
          name: 'Phase unique',
          elements: [
            { type: 'zone-danger', cx: 22, cy: 72, r: 8, label: 'Nether Portal (gauche)' },
            { type: 'zone-danger', cx: 78, cy: 72, r: 8, label: 'Infernal Volcano (droite)' },
            { type: 'boss',  cx: 50, cy: 35, label: 'Lord Jaraxxus' },
            { type: 'tank',  cx: 50, cy: 24, label: 'Maël — tank + Mistress of Pain' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '😈 5-man : Incinerate Flesh → Tristan burst heal massivement le joueur ciblé (sinon explosion AoE). Fel Fireball → TOUJOURS interrompre. Legion Flame → joueur ciblé court vers le bord en cercle. Mistress of Pain → Maël la taunt immédiatement. Nether Power → taunt de Maël dispell les stacks.' },
          ]
        }
      ]
    },

    champions: {
      name: 'Champions de Faction',
      room: 'circle',
      phases: [
        {
          name: 'Combat PvP',
          elements: [
            { type: 'boss',  cx: 35, cy: 35, label: 'Healer ennemi (kill en 1er)' },
            { type: 'boss',  cx: 65, cy: 35, label: 'Champion 2' },
            { type: 'boss',  cx: 50, cy: 55, label: 'Champion 3' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — peel les mêlées' },
            { type: 'range', positions: [{ cx: 25, cy: 72 }, { cx: 50, cy: 78 }, { cx: 75, cy: 72 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 85 }] },
            { type: 'note',  text: '🏹 5-man : FOCUS le healer ennemi en premier (CC sinon). CC les autres (Poly, Hex, Fear). Ordre kill : Healer → DPS dangereux → tank ennemi. Pas de taunt possible mais menace compte. Aura : -50% soins reçus. Tristan soigne malgré la réduction.' },
          ]
        }
      ]
    },

    twinvalkyr: {
      name: "Twin Val'kyr",
      room: 'circle',
      phases: [
        {
          name: 'Système d\'essence',
          elements: [
            { type: 'zone-safe',   cx: 25, cy: 50, r: 15, label: 'Côté Lumière (orbes blancs)' },
            { type: 'zone-danger', cx: 75, cy: 50, r: 15, label: 'Côté Ombre (orbes noirs)', color: '#311b92', opacity: 0.25 },
            { type: 'boss',  cx: 32, cy: 35, label: 'Fjola (Lumière)' },
            { type: 'boss',  cx: 68, cy: 35, label: 'Eydis (Ombre)' },
            { type: 'tank',  cx: 32, cy: 25, label: 'Maël — tank Fjola (essence Ombre)' },
            { type: 'range', positions: [{ cx: 25, cy: 70 }, { cx: 50, cy: 76 }, { cx: 75, cy: 70 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 84 }] },
            { type: 'note',  text: '👼 5-man : Prendre l\'essence OPPOSÉE à la Val\'kyr qu\'on attaque (immunité aux dégâts). Vortex → changer d\'essence pour résister. Orbes → collecter sa couleur pour buff DPS. DPS 50/50 sur les deux → mort simultanée obligatoire (±5%).' },
          ]
        }
      ]
    },

    anubaraktoc: {
      name: "Anub'arak",
      room: 'circle',
      phases: [
        {
          name: 'Phase 1 — Surface',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 72, r: 12, label: 'Spike souterrain — fuir' },
            { type: 'boss',  cx: 50, cy: 36, label: "Anub'arak" },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël — swap à 3 stacks Pound' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 78 }] },
            { type: 'note',  text: '🕷️ 5-man P1 : Pound → Maël CD défensif. Spike → le joueur ciblé court en cercle pour l\'esquiver. Nerubian Burrower → DPS focus immédiat. Phase 3 (30%) : Locust Infection (-50% soins) → Tristan soigne JUSTE assez → garder le raid à 20-30% HP pour réduire le vol de vie d\'Anub\'arak.' },
          ]
        },
        {
          name: 'Phase 3 — Burn (30%)',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 50, r: 46, label: 'Frost Spheres — éviter', color: '#03a9f4', opacity: 0.15 },
            { type: 'boss',  cx: 50, cy: 35, label: "Anub'arak (P3)" },
            { type: 'note', text: '💀 P3 : Garder le raid BAS (20-30% HP) → moins Anub\'arak vole de vie. Tristan NE soigne PAS à fond. Frozen Spheres → éviter. Burns adds + boss simultanément. Phase la plus difficile.' },
          ]
        }
      ]
    },

    /* ===== EOE ===== */

    malygos: {
      name: 'Malygos',
      room: 'circle',
      phases: [
        {
          name: 'Phase 1 — Plateforme',
          elements: [
            { type: 'zone-danger', cx: 50, cy: 50, r: 46, label: 'Bord de plateforme — chute mortelle' },
            { type: 'boss',  cx: 50, cy: 36, label: 'Malygos' },
            { type: 'tank',  cx: 50, cy: 25, label: 'Maël' },
            { type: 'range', positions: [{ cx: 28, cy: 64 }, { cx: 50, cy: 70 }, { cx: 72, cy: 64 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 80 }] },
            { type: 'note',  text: '🌌 5-man : Vortex → tout le monde vole puis retombe. Tristan soigne immédiatement à la chute. Arcane Breath → tank face au bord.' },
          ]
        },
        {
          name: 'Phase 3 — Drakes',
          elements: [
            { type: 'zone-safe', cx: 50, cy: 50, r: 40, label: 'Combat sur les drakes de nexus' },
            { type: 'note', text: '🐉 5-man P3 : Tous montent sur un drake. Rotation sorts 1→2→3→4 pour maximiser DPS. Tristan heal l\'équipe depuis son drake. Timer serré.' },
          ]
        }
      ]
    },

    /* ===== VOA ===== */

    archavon: {
      name: 'Archavon the Stone Watcher',
      room: 'circle',
      phases: [
        {
          name: 'Phase simple',
          elements: [
            { type: 'boss',  cx: 50, cy: 35, label: 'Archavon' },
            { type: 'tank',  cx: 50, cy: 24, label: 'Maël' },
            { type: 'range', positions: [{ cx: 25, cy: 65 }, { cx: 50, cy: 72 }, { cx: 75, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 82 }] },
            { type: 'note',  text: '🪨 5-man : Boss facile. Choking Cloud → tank swap (taunt). Rock Shards aléatoires → se disperser légèrement. DPS full, Tristan soigne confortablement.' },
          ]
        }
      ]
    },

    /* ===== OS ===== */

    sartharion: {
      name: 'Sartharion',
      room: 'rect',
      phases: [
        {
          name: 'Sartharion',
          elements: [
            { type: 'zone-danger', x: 35, y: 5, w: 30, h: 90, label: 'Zone de lave — entre les rives' },
            { type: 'zone-safe', x: 5,  y: 15, w: 28, h: 70, label: 'Rive gauche — SAFE' },
            { type: 'zone-safe', x: 67, y: 15, w: 28, h: 70, label: 'Rive droite — SAFE' },
            { type: 'boss',  cx: 50, cy: 50, label: 'Sartharion' },
            { type: 'tank',  cx: 50, cy: 40, label: 'Maël' },
            { type: 'range', positions: [{ cx: 18, cy: 65 }, { cx: 82, cy: 65 }] },
            { type: 'heal',  positions: [{ cx: 50, cy: 75 }] },
            { type: 'note',  text: '🔥 5-man : Vagues de lave → courir sur une rive pendant le passage. Sartharion 3D (avec les 3 drakes) = challenge extrême à 5 mais possible.' },
          ]
        }
      ]
    },

  };

  /* ================================================================
     RENDERER SVG
  ================================================================ */

  function renderSVGElements(elements) {
    return elements.map(el => {
      switch (el.type) {

        case 'zone-danger':
        case 'zone-safe': {
          const c = el.color || (el.type === 'zone-danger' ? '#f44336' : '#4caf50');
          const op = el.opacity !== undefined ? el.opacity : 0.22;
          const cls = 'bm-zone bm-zone-' + (el.type === 'zone-danger' ? 'danger' : 'safe');
          const dl = el.label ? ` data-label="${el.label}"` : '';
          if (el.r !== undefined)
            return `<circle cx="${el.cx}" cy="${el.cy}" r="${el.r}" fill="${c}" opacity="${op}" class="${cls}"${dl} style="pointer-events:all"/>`;
          return `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" fill="${c}" opacity="${op}" class="${cls}"${dl} style="pointer-events:all"/>`;
        }

        case 'boss':
        case 'boss-moving':
          return [
            `<circle cx="${el.cx}" cy="${el.cy}" r="4.5" fill="#c62828" stroke="#fff" stroke-width="0.8" class="bm-boss" data-label="${el.label||'Boss'}" style="pointer-events:all"/>`,
            `<circle cx="${el.cx}" cy="${el.cy}" r="4.5" fill="none" stroke="#f44336" stroke-width="1.5" opacity="0.5" class="bm-boss-ring"/>`,
            `<text x="${el.cx}" y="${el.cy+1}" class="bm-icon-text" text-anchor="middle" dominant-baseline="middle" style="font-size:4px;fill:#fff;pointer-events:none">B</text>`,
          ].join('');

        case 'tank':
          return [
            `<circle cx="${el.cx}" cy="${el.cy}" r="3.5" fill="#1565c0" stroke="#90caf9" stroke-width="0.6" class="bm-role" data-label="${el.label||'Tank'}" style="pointer-events:all"/>`,
            `<text x="${el.cx}" y="${el.cy+1}" text-anchor="middle" dominant-baseline="middle" style="font-size:3.5px;fill:#fff;pointer-events:none">T</text>`,
          ].join('');

        case 'melee':
          return (el.positions||[]).map(p =>
            `<circle cx="${p.cx}" cy="${p.cy}" r="2.5" fill="#e65100" stroke="#ffcc02" stroke-width="0.4" class="bm-role" data-label="Melee DPS" style="pointer-events:all"/>`
          ).join('');

        case 'range':
          return (el.positions||[]).map(p =>
            `<circle cx="${p.cx}" cy="${p.cy}" r="2.5" fill="#1b5e20" stroke="#a5d6a7" stroke-width="0.4" class="bm-role" data-label="Ranged DPS" style="pointer-events:all"/>`
          ).join('');

        case 'heal':
          return (el.positions||[]).map(p =>
            `<circle cx="${p.cx}" cy="${p.cy}" r="2.5" fill="#004d40" stroke="#80cbc4" stroke-width="0.4" class="bm-role" data-label="Tristan — Healer" style="pointer-events:all"/>`
          ).join('');

        default: return '';
      }
    }).join('\n');
  }

  function buildMap(bossKey) {
    const data = DATA[bossKey];
    if (!data) return null;

    const isCircle = data.room === 'circle';
    const room = isCircle
      ? `<circle cx="50" cy="50" r="47" class="bm-room"/>`
      : `<rect x="3" y="3" width="94" height="94" rx="3" class="bm-room"/>`;

    const phaseSVGs = data.phases.map((p, i) =>
      `<g class="bm-phase-layer${i===0?'':' bm-hidden'}" data-phase="${i}">${renderSVGElements(p.elements)}</g>`
    ).join('');

    const phaseButtons = data.phases.length > 1
      ? data.phases.map((p, i) =>
          `<button class="bm-phase-btn${i===0?' active':''}" data-phase="${i}">${p.name}</button>`
        ).join('')
      : '';

    const notesDivs = data.phases.map((p, i) => {
      const n = p.elements.find(e => e.type === 'note');
      return n ? `<div class="bm-note${i===0?'':' bm-hidden'}" data-phase="${i}">${n.text}</div>` : '';
    }).join('');

    return `
<div class="boss-map" data-boss="${bossKey}">
  ${phaseButtons ? `<div class="bm-phase-tabs">${phaseButtons}</div>` : ''}
  <div class="bm-body">
    <div class="bm-svg-wrap">
      <svg viewBox="0 0 100 100" class="bm-svg" xmlns="http://www.w3.org/2000/svg">
        ${room}
        <g class="bm-compass">
          <text x="50" y="5" text-anchor="middle" style="font-size:3px;fill:#555">N</text>
          <text x="50" y="97" text-anchor="middle" style="font-size:3px;fill:#555">S</text>
          <text x="3"  y="51" text-anchor="middle" style="font-size:3px;fill:#555">O</text>
          <text x="97" y="51" text-anchor="middle" style="font-size:3px;fill:#555">E</text>
        </g>
        ${phaseSVGs}
      </svg>
      <div class="bm-tooltip bm-hidden"></div>
    </div>
    <div class="bm-side">
      <div class="bm-notes">${notesDivs}</div>
      <div class="bm-legend">
        <div class="bm-leg-item"><span class="bm-leg-dot" style="background:#c62828"></span>Boss</div>
        <div class="bm-leg-item"><span class="bm-leg-dot" style="background:#1565c0"></span>Maël (Tank)</div>
        <div class="bm-leg-item"><span class="bm-leg-dot" style="background:#1b5e20"></span>DPS Ranged</div>
        <div class="bm-leg-item"><span class="bm-leg-dot" style="background:#004d40"></span>Tristan (Heal)</div>
        <div class="bm-leg-item"><span class="bm-leg-dot" style="background:#f44336;opacity:.5"></span>Danger</div>
        <div class="bm-leg-item"><span class="bm-leg-dot" style="background:#4caf50;opacity:.5"></span>Safe</div>
      </div>
    </div>
  </div>
</div>`;
  }

  /* ================================================================
     MAPPING TITRE → CLÉ
  ================================================================ */
  const BOSS_KEYS = [
    /* ICC */
    ['marrowgar',           'marrowgar'],
    ['deathwhisper',        'deathwhisper'],
    ['saurfang',            'saurfang'],
    ['festergut',           'festergut'],
    ['rotface',             'rotface'],
    ['putricide',           'putricide'],
    ['blood prince',        'princes'],
    ["lana'thel",           'lanathel'],
    ['lanathel',            'lanathel'],
    ['valithria',           'valithria'],
    ['sindragosa',          'sindragosa'],
    ['lich king',           'lichking'],
    /* ULDUAR */
    ['flame leviathan',     'flameleviathan'],
    ['ignis',               'ignis'],
    ['razorscale',          'razorscale'],
    ['xt-002',              'xt002'],
    ['assembly of iron',    'assemblyofiron'],
    ['kologarn',            'kologarn'],
    ['auriaya',             'auriaya'],
    ['hodir',               'hodir'],
    ['thorim',              'thorim'],
    ['freya',               'freya'],
    ['mimiron',             'mimiron'],
    ['vezax',               'vezax'],
    ['algalon',             'algalon'],
    ['yogg',                'yoggsaron'],
    /* NAXXRAMAS */
    ["anub'rekhan",         'anubrekhan'],
    ['faerlina',            'faerlina'],
    ['maexxna',             'maexxna'],
    ['noth',                'noth'],
    ['heigan',              'heigan'],
    ['loatheb',             'loatheb'],
    ['razuvious',           'razuvious'],
    ['gothik',              'gothik'],
    ['four horsemen',       'fourhorsemen'],
    ['patchwerk',           'patchwerk'],
    ['grobbulus',           'grobbulus'],
    ['gluth',               'gluth'],
    ['thaddius',            'thaddius'],
    ['sapphiron',           'sapphiron'],
    ["kel'thuzad",          'kelthuzad'],
    /* TOC — French names first, then English fallback */
    ["bêtes du northrend",  'northrend_beasts'],
    ['northrend beasts',    'northrend_beasts'],
    ['jaraxxus',            'jaraxxus'],
    ['champions de',        'champions'],
    ["val'kyr",             'twinvalkyr'],
    ["anub'arak",           'anubaraktoc'],
    /* EoE */
    ['malygos',             'malygos'],
    /* VOA */
    ['archavon',            'archavon'],
    ['emalon',              'emalon'],
    ['koralon',             'koralon'],
    ['toravon',             'toravon'],
    /* OS */
    ['vesperon',            'vesperon'],
    ['shadron',             'shadron'],
    ['tenebron',            'tenebron'],
    ['sartharion',          'sartharion'],
    /* RUBY SANCTUM */
    ['saviana',             'saviana'],
    ['baltharus',           'baltharus'],
    ['zarithrian',          'zarithrian'],
    ['halion',              'halion'],
    /* ONYXIA */
    ['onyxia',              'onyxia'],
  ];

  function findBossKey(title) {
    const t = title.toLowerCase();
    for (const [kw, key] of BOSS_KEYS) {
      if (t.includes(kw)) return key;
    }
    return null;
  }

  /* ================================================================
     INIT
  ================================================================ */
  function init() {
    document.querySelectorAll('.boss-card').forEach(card => {
      const h3 = card.querySelector('h3');
      if (!h3) return;
      const key = findBossKey(h3.textContent);
      if (!key) return;
      const body = card.querySelector('.boss-card-body');
      if (!body) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'bm-wrapper';
      wrapper.innerHTML = buildMap(key);
      body.insertBefore(wrapper, body.firstChild);
    });

    document.addEventListener('mouseover', e => {
      const el   = e.target.closest('[data-label]');
      const wrap = e.target.closest('.bm-svg-wrap');
      if (!wrap) return;
      const tip = wrap.querySelector('.bm-tooltip');
      if (!tip) return;
      if (el && el.dataset.label) {
        tip.textContent = el.dataset.label;
        tip.classList.remove('bm-hidden');
      } else {
        tip.classList.add('bm-hidden');
      }
    });

    document.addEventListener('mousemove', e => {
      const wrap = e.target.closest('.bm-svg-wrap');
      if (!wrap) return;
      const tip = wrap.querySelector('.bm-tooltip');
      if (!tip || tip.classList.contains('bm-hidden')) return;
      const rect = wrap.getBoundingClientRect();
      tip.style.left = (e.clientX - rect.left + 12) + 'px';
      tip.style.top  = (e.clientY - rect.top  - 32) + 'px';
    });

    document.addEventListener('click', e => {
      const btn = e.target.closest('.bm-phase-btn');
      if (!btn) return;
      const map = btn.closest('.boss-map');
      if (!map) return;
      const idx = btn.dataset.phase;
      map.querySelectorAll('.bm-phase-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.phase === idx)
      );
      map.querySelectorAll('.bm-phase-layer, .bm-note').forEach(el =>
        el.classList.toggle('bm-hidden', el.dataset.phase !== idx)
      );
    });
  }

  return { init };

})();

document.addEventListener('DOMContentLoaded', BossMaps.init);
