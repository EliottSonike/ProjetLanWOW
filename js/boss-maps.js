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
    ['marrowgar',        'marrowgar'],
    ['deathwhisper',     'deathwhisper'],
    ['saurfang',         'saurfang'],
    ['festergut',        'festergut'],
    ['rotface',          'rotface'],
    ['putricide',        'putricide'],
    ['blood prince',     'princes'],
    ["lana'thel",        'lanathel'],
    ['lanathel',         'lanathel'],
    ['valithria',        'valithria'],
    ['sindragosa',       'sindragosa'],
    ['lich king',        'lichking'],
    ['flame leviathan',  'flameleviathan'],
    ['yogg',             'yoggsaron'],
    ["anub'rekhan",      'anubrekhan'],
    ['heigan',           'heigan'],
    ["kel'thuzad",       'kelthuzad'],
    ['northrend beasts', 'northrend_beasts'],
    ['malygos',          'malygos'],
    ['archavon',         'archavon'],
    ['sartharion',       'sartharion'],
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
